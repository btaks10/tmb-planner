/**
 * Tests for src/components/WeatherTimingCard.jsx — the departure-time card.
 * Static plan renders with no weather at all; a forecast stub only adjusts it.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WeatherTimingCard from '../../src/components/WeatherTimingCard';
import { OPEN_METEO_ATTRIBUTION } from '../../src/lib/weather';

const SCENARIO = {
  name: '7-Day Classic',
  startDate: '2026-08-04',
  days: [6, 8, 12, 15, 21, 26, 33],
};

// Pin "now" to the day before the trip so daysOut ≤ 4 (forecast is actionable).
const NOW = Date.parse('2026-08-03T18:00:00Z');

function makeForecast(dateStr, { cape = 50 } = {}) {
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return {
    hourly: {
      time: hours.map((h) => `${dateStr}T${String(h).padStart(2, '0')}:00`),
      cape: hours.map(() => cape),
      weather_code: hours.map(() => 1),
      wind_gusts_10m: hours.map(() => 20),
      temperature_2m: hours.map(() => 15),
      precipitation_probability: hours.map(() => 5),
      freezing_level_height: hours.map(() => 4200),
    },
  };
}

function weatherStub(forecasts, extra = {}) {
  return {
    forecasts,
    fetchedAt: NOW - 30 * 60 * 1000,
    stale: false,
    loading: false,
    error: null,
    refresh: vi.fn(),
    attribution: OPEN_METEO_ATTRIBUTION,
    ...extra,
  };
}

describe('WeatherTimingCard — static plan (no forecast)', () => {
  it('day 2: renders the 08:00 recommendation, 11:00 latest, and sleep-in badge', () => {
    render(<WeatherTimingCard dayIndex={1} scenario={SCENARIO} selectedShortcuts={{}} now={NOW} />);
    expect(screen.getByText('08:00')).toBeInTheDocument(); // Leave
    expect(screen.getByText('11:00')).toBeInTheDocument(); // Latest
    expect(screen.getByText('12:50')).toBeInTheDocument(); // Arrive
    expect(screen.getByText(/Sleep in/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear Col du Bonhomme by 14:00/)).toBeInTheDocument();
    expect(screen.getByText(/No forecast loaded/)).toBeInTheDocument();
  });

  it('day 7: infeasible on foot, says so instead of showing times', () => {
    render(<WeatherTimingCard dayIndex={6} scenario={SCENARIO} selectedShortcuts={{}} now={NOW} />);
    expect(screen.getByText(/doesn't fit the storm clock on foot/)).toBeInTheDocument();
  });

  it('day 7 + Flégère lift: feasible again, leave 06:15', () => {
    render(
      <WeatherTimingCard
        dayIndex={6}
        scenario={SCENARIO}
        selectedShortcuts={{ '28-29-Télécabine de la Flégère': true }}
        now={NOW}
      />
    );
    expect(screen.queryByText(/doesn't fit the storm clock/)).toBeNull();
    expect(screen.getByText('06:15')).toBeInTheDocument(); // Leave
    expect(screen.getByText('06:45')).toBeInTheDocument(); // Latest
  });

  it('compact mode on day 7 warns; onOpen fires on tap', () => {
    const onOpen = vi.fn();
    render(
      <WeatherTimingCard compact dayIndex={6} scenario={SCENARIO} selectedShortcuts={{}} now={NOW} onOpen={onOpen} />
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('Not walkable on the storm clock');
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalled();
  });

  it('compact mode on day 2 shows the one-line departure strip', () => {
    render(<WeatherTimingCard compact dayIndex={1} scenario={SCENARIO} selectedShortcuts={{}} now={NOW} />);
    expect(screen.getByRole('button')).toHaveTextContent('Leave 08:00');
    expect(screen.getByRole('button')).toHaveTextContent('latest 11:00');
  });
});

describe('WeatherTimingCard — forecast adjustments', () => {
  it('a quiet forecast relaxes day 2: latest moves 11:00 → 12:00', () => {
    // Day index 1 = 2026-08-05
    const weather = weatherStub({
      'day-1': { key: 'day-1', point: { key: 'day-1' }, fetchedAt: NOW, data: makeForecast('2026-08-05', { cape: 50 }) },
    });
    render(
      <WeatherTimingCard dayIndex={1} scenario={SCENARIO} selectedShortcuts={{}} weather={weather} now={NOW} />
    );
    expect(screen.getByText('12:00')).toBeInTheDocument(); // relaxed latest
    expect(screen.queryByText('11:00')).toBeNull();
    expect(screen.getByText(/Stable air — clock relaxed 1 h/)).toBeInTheDocument();
  });

  it('an extreme forecast tightens day 2 to a 09:00 latest', () => {
    const weather = weatherStub({
      'day-1': { key: 'day-1', point: { key: 'day-1' }, fetchedAt: NOW, data: makeForecast('2026-08-05', { cape: 1500 }) },
    });
    render(
      <WeatherTimingCard dayIndex={1} scenario={SCENARIO} selectedShortcuts={{}} weather={weather} now={NOW} />
    );
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText(/cols close at noon/)).toBeInTheDocument();
  });

  it('renders forecast age and the Open-Meteo CC BY attribution', () => {
    const weather = weatherStub({
      'day-1': { key: 'day-1', point: { key: 'day-1' }, fetchedAt: NOW, data: makeForecast('2026-08-05') },
    });
    render(
      <WeatherTimingCard dayIndex={1} scenario={SCENARIO} selectedShortcuts={{}} weather={weather} now={NOW} />
    );
    expect(screen.getByText(/Forecast updated/)).toBeInTheDocument();
    expect(screen.getByText(OPEN_METEO_ATTRIBUTION)).toBeInTheDocument();
    expect(screen.getByText(/Download all/)).toBeInTheDocument();
  });
});

describe('WeatherTimingCard — running-late mode', () => {
  it('a departure past the point of no return names the shelter', () => {
    render(<WeatherTimingCard dayIndex={1} scenario={SCENARIO} selectedShortcuts={{}} now={NOW} />);
    fireEvent.change(screen.getByLabelText(/Running late/i), { target: { value: '11:30' } });
    expect(screen.getByText(/Too late for/)).toBeInTheDocument();
    // Named in the constraint prose AND in the running-late advice
    expect(screen.getAllByText(/Refuge de la Croix du Bonhomme/).length).toBeGreaterThanOrEqual(2);
  });

  it('a departure still inside every window shows the new arrival', () => {
    render(<WeatherTimingCard dayIndex={1} scenario={SCENARIO} selectedShortcuts={{}} now={NOW} />);
    fireEvent.change(screen.getByLabelText(/Running late/i), { target: { value: '09:00' } });
    expect(screen.getByText(/Still inside every window/)).toBeInTheDocument();
    expect(screen.getByText(/13:50/)).toBeInTheDocument(); // 09:00 + 4h50 walk+breaks
  });
});

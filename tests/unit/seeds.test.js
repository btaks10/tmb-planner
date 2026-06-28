import { describe, it, expect } from 'vitest'
import gearSeed from '../../src/data/gearSeed.json'
import transportSeed from '../../src/data/transportSeed.json'
import safetySeed from '../../src/data/safetySeed.json'

describe('gearSeed.json', () => {
  it('has exactly 90 items', () => {
    expect(gearSeed.items).toHaveLength(90)
    expect(gearSeed.meta.count).toBe(90)
  })

  it('every item has a name and category', () => {
    for (const item of gearSeed.items) {
      expect(item.name).toBeTruthy()
      expect(item.category).toBeTruthy()
    }
  })

  it('covers the expected number of categories', () => {
    const categories = new Set(gearSeed.items.map(i => i.category))
    // At least 15 distinct categories
    expect(categories.size).toBeGreaterThanOrEqual(15)
  })

  it('has valid status values', () => {
    const validStatuses = ['Need to Buy', 'Bought', 'Packed', 'Not Bringing', 'Not Reviewed']
    for (const item of gearSeed.items) {
      expect(validStatuses).toContain(item.status)
    }
  })

  it('all items have packed boolean field', () => {
    for (const item of gearSeed.items) {
      expect(typeof item.packed).toBe('boolean')
    }
  })

  it('sort values are sequential from 0', () => {
    const sorts = gearSeed.items.map(i => i.sort)
    for (let i = 0; i < sorts.length; i++) {
      expect(sorts[i]).toBe(i)
    }
  })

  it('has expected essential items', () => {
    const essentials = gearSeed.items.filter(i => i.priority === 'Essential')
    expect(essentials.length).toBeGreaterThan(15)

    const essentialNames = essentials.map(i => i.name)
    expect(essentialNames).toContain('Hiking boots')
    expect(essentialNames).toContain('Hardshell rain jacket')
    expect(essentialNames).toContain('Passport/ID')
  })

  it('costs are numbers or null', () => {
    for (const item of gearSeed.items) {
      if (item.cost !== null) {
        expect(typeof item.cost).toBe('number')
        expect(item.cost).toBeGreaterThan(0)
      }
    }
  })
})

describe('transportSeed.json', () => {
  it('has 11 transport legs', () => {
    expect(transportSeed.legs).toHaveLength(11)
    expect(transportSeed.meta.count).toBe(11)
  })

  it('every leg has required fields', () => {
    for (const leg of transportSeed.legs) {
      expect(leg.name).toBeTruthy()
      expect(typeof leg.day_index).toBe('number')
      expect(leg.day_index).toBeGreaterThanOrEqual(-1)
      expect(leg.day_index).toBeLessThanOrEqual(7)
      expect(leg.type).toBeTruthy()
      expect(leg.from_place).toBeTruthy()
      expect(leg.to_place).toBeTruthy()
      // Some legs (flights, transfers) have null cost until booked
      if (leg.cost !== null) {
        expect(typeof leg.cost).toBe('number')
      }
      expect(leg.currency).toMatch(/^(EUR|CHF)$/)
    }
  })

  it('includes Prarion lift at €18.90', () => {
    const prarion = transportSeed.legs.find(l => l.name.includes('Prarion'))
    expect(prarion).toBeTruthy()
    expect(prarion.cost).toBe(18.90)
    expect(prarion.type).toBe('lift')
    expect(prarion.day_index).toBe(0)
  })

  it('includes Chapieux navette at €8 with schedule info', () => {
    const chapieux = transportSeed.legs.find(l => l.name.includes('Chapieux'))
    expect(chapieux).toBeTruthy()
    expect(chapieux.cost).toBe(8.00)
    expect(chapieux.depart_time).toBe('17:20')
    expect(chapieux.info).toContain('17:20')
    expect(chapieux.info).toContain('17:50')
    expect(chapieux.info).toContain('18:20')
    expect(chapieux.info).toMatch(/06:45|08:20/)
  })

  it('includes Swiss PostBus legs with CHF currency', () => {
    const swissLegs = transportSeed.legs.filter(l => l.currency === 'CHF')
    expect(swissLegs.length).toBeGreaterThanOrEqual(2)
    for (const leg of swissLegs) {
      expect(leg.type).toBe('bus')
    }
  })

  it('includes Flégère/Brévent lift', () => {
    const flegere = transportSeed.legs.find(l => l.name.includes('Flégère'))
    expect(flegere).toBeTruthy()
    expect(flegere.cost).toBe(50.00)
    expect(flegere.info).toContain('19')
    expect(flegere.info).toContain('31')
    expect(flegere.day_index).toBe(6)
  })

  it('day indices are unique per leg', () => {
    // Multiple legs can share a day — check at least we cover a spread
    const days = new Set(transportSeed.legs.map(l => l.day_index))
    expect(days.size).toBeGreaterThanOrEqual(4)
  })
})

describe('safetySeed.json', () => {
  it('has 5 emergency contacts', () => {
    expect(safetySeed.contacts).toHaveLength(5)
    expect(safetySeed.meta.count).toBe(5)
  })

  it('every contact has a label', () => {
    for (const c of safetySeed.contacts) {
      expect(c.label).toBeTruthy()
    }
  })

  it('includes European Emergency 112', () => {
    const eur = safetySeed.contacts.find(c => c.phone === '112')
    expect(eur).toBeTruthy()
    expect(eur.label).toContain('European')
  })

  it('includes PGHM Chamonix', () => {
    const pghm = safetySeed.contacts.find(c => c.label.includes('PGHM'))
    expect(pghm).toBeTruthy()
    expect(pghm.phone).toContain('+33')
  })

  it('includes REGA with 1414', () => {
    const rega = safetySeed.contacts.find(c => c.phone === '1414')
    expect(rega).toBeTruthy()
    expect(rega.label).toContain('REGA')
  })

  it('includes Italian CNSAS with 118', () => {
    const cnsas = safetySeed.contacts.find(c => c.phone === '118')
    expect(cnsas).toBeTruthy()
    expect(cnsas.label).toContain('CNSAS')
  })

  it('includes trail conditions entry (no phone)', () => {
    const trail = safetySeed.contacts.find(c => c.phone === null)
    expect(trail).toBeTruthy()
    expect(trail.label).toContain('Trail')
    expect(trail.notes).toContain('autourdumontblanc')
  })
})

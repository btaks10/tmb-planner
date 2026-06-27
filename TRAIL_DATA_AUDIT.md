# TMB Planner — Trail Data Audit (2026 season)

**Audited:** 2026-06-27 · **Trip dates:** ~Aug 2–11, 2026 · **Route in app:** clockwise, Les Houches → Les Houches (34 waypoints, 11 stages)

This audit checks the app's hard-coded route/transport/sights data against current (2026) sources, flags what to **correct**, what to **add**, and what to **verify at booking/departure**. Line numbers reference `src/segmentData.js` unless noted. Apply these as part of **Phase 5** of the build plan.

> Confidence legend: ✅ verified from 2026 source · ⚠️ likely changed, verify · ❓ not confirmed, check official source.

---

## 1. Headline findings

1. **No permanent trail closures or reroutes found for 2026** on the standard clockwise route. ✅ One long-standing erosion/landslide spot on the **Trient side** (descent toward Trient/Col de la Forclaz) requires a short climb-around — care when wet. ⚠️
2. **Snow lingers on high passes into early July** (Bonhomme, Col des Fours, Col de la Seigne, Fenêtre d'Arpette, Brévent). By your **Aug 2** start this is a non-issue, but the app should show a live trail-conditions link rather than static "open" assumptions. ✅
3. **Several transport prices/schedules in the app are stale** — most importantly the **Les Chapieux ↔ Bourg-Saint-Maurice navette** (app says €5 / "limited"; actual 2026 is €8 with fixed daily times). Corrections in §3. ✅
4. **August is the wettest, most thunderstorm-prone month** despite being warmest. The app should surface the "off the high passes by early afternoon" rule and early-start guidance. ✅
5. Your **Champex → Trient** day uses the **Bovine** route (via Plan de l'Au / Col de la Forclaz), not Fenêtre d'Arpette — this is the correct, safer standard variant. ✅ Keep it; offer Arpette only as a clear-weather alt.

---

## 2. Refuge / accommodation status (2026)

- Booking platform is **[Mon Tour du Mont Blanc](https://www.montourdumontblanc.com/en/)**; 2026 reservations opened **15 Oct 2025**. Non-association huts must be contacted directly. You already hold 9 nights booked (per project notes), so this is for reference + the in-app "booking link" field. ✅
- **Rifugio Bonatti** — 2026 season reservations **26 May → 30 Sep 2026**. ✅ ([rifugiobonatti.it](https://www.rifugiobonatti.it/))
- **Rifugio Elena** — typically open ~late May → early Oct; operating in early Aug. ✅ ([rifugioelena.it](https://www.rifugioelena.it/))
- **Rifugio Elisabetta** (Val Veny) — open in season; exact 2026 dates not published in search. ❓ ([rifugioelisabetta.com](https://www.rifugioelisabetta.com/))
- **Action:** add a `bookingUrl` + `phone` field per refuge in the data model (used by the Logistics section). Seed from the official refuge sites above.

---

## 3. Transport corrections (apply to `segmentData.js`)

| Item | App now | 2026 reality | Action |
|---|---|---|---|
| **Téléphérique du Prarion** (L62–70) | `cost: 18`, "9:00–17:00" | Adult **€18.90** one-way; daily **9:15–17:00** (Jun 27–Sep 6) ✅ | Update cost → `18.9`, hours → 9:15–17:00 |
| **Add: Bellevue cable car** (Les Houches, stage 1) | — | Adult **€18.90** OW / €23.90 RT; **7:30–18:00** (Jul 5–Aug 29) ✅ | Add as a stage-1 shortcut (more direct to Bellevue/Col de Voza) |
| **Tramway du Mont Blanc** (L76–84) | `cost: 22` | Price has risen (≈€40+ RT from Le Fayet/St-Gervais) ⚠️ | Verify on montblancnaturalresort.com; update cost |
| **Les Chapieux → Bourg-St-Maurice navette** (L462–470) | `cost: 5`, "limited, check refuge" | **€8**; departs Les Chapieux **17:20 / 17:50 / 18:20**; morning BSM→Les Chapieux **06:45 / 08:20**; peak svc ~Jun 22–Aug 30 (runs Jun 13–Sep 13); ticket machine on site ✅ | Update cost → `8`, rewrite ticketInfo with times. **This is your Day-2/3 hinge — make it prominent.** |
| **Bus from Val Veny / La Visaille → Courmayeur** (L654–662) | `cost: 3` | SVAP/Savda summer shuttle still runs; verify 2026 fare ⚠️ | Verify price/timetable |
| **PostBus La Fouly → Champex** (L988–996) | `cost: 15` | Bus **272** La Fouly→Orsières, change to **273** Orsières→Champex; operating from 6 Jun 2026; pay in CHF ✅ | Verify CHF fare on SBB; note the 272→273 change at Orsières |
| **PostBus Col de la Forclaz → Trient** (L1246–1254) | `cost: 10`, "supplies run to Martigny" | **≈CHF 2.20**, 4-min ride; useful times **16:31 / 18:31** (also 05:35 / 11:31) ✅ | Update cost + reframe as the Forclaz→Trient skip; cite carpostal.ch/valais |
| **Téléphérique de Balme** (Le Tour, L1409–1417) | `cost: 20` | Charamillon/Le Tour lift toward Col de Balme — verify 2026 hours/price ⚠️ | Verify |
| **Mont Blanc Express train** (L1430) | `cost: 12` | Vallorcine–Chamonix line; verify 2026 fare ⚠️ | Verify |

**Day 7 descent escape (high value).** Your final day is the longest (the saved plan shows ~23 mi / 13h to Les Houches). Make sure stage 10–11 segments expose the Chamonix-side lift bail-outs with 2026 prices:
- **La Flégère** gondola — adult **€19** one-way; **8:20–18:00**, last descent 18:00 (Jul 11–Aug 30). ✅
- **Le Brévent** cable car — adult **€31** one-way / €43 RT; **8:20–18:00** (Jul 11–Aug 30). ✅
- **Action:** add/verify these as descent shortcuts on the La Flégère→Planpraz→Brévent→Les Houches segments so a tired finish has a clearly-priced exit.

---

## 4. Weather & safety (surface in-app)

- **August = warmest but wettest.** Valley highs sometimes >30 °C; afternoon showers/thunderstorms are common and build through hot days, breaking mid-to-late afternoon with lightning + sharp temperature drops. ✅
- **Rule to display:** start early, be **over the high passes by early afternoon**; if a storm hits, get off passes/ridges and shelter. ✅
- **Water:** carry **≥1.5 L** at the start of each day; some streams run dry late season; filter natural sources. The app already lists `waterSources` per segment — good; add a "carry 1.5L / filter" note. ✅
- Always carry **full waterproofs** regardless of forecast. ✅
- **Currency:** the Champex/Trient legs are in **Switzerland → carry CHF** (PostBus, refuges). Add a logistics flag. ✅

Sources: [Happy Tracks – TMB weather](https://happytracks.ch/weather-tmb/) · [Altitude Trekker – TMB season](https://www.altitudetrekker.com/en/post/tmbseason) · [TMB Trail Guide – 10 safety tips](https://tmbtrailguide.com/10-safety-tips-for-the-tour-du-mont-blanc/)

---

## 5. Trail conditions (2026, dynamic)

- As of **mid-June 2026**, ~65% of the trail was snow-free; high cols held snow into late June/early July. Irrelevant by August, but conditions are dynamic. ✅
- **Fenêtre d'Arpette** was *not recommended* in June 2026 (steep snow both sides). By August it's usually passable for confident hikers in good weather, but **Bovine remains the safe default** — which your plan uses. ✅
- **Recommendation:** don't bake "trail open/closed" into static data. Add a **live conditions link** in the app header/Logistics: the official **[autourdumontblanc.com trail conditions](https://www.autourdumontblanc.com/en/information/trails-conditions)**, plus [Happy Tracks updates](https://happytracks.ch/info-updates/) and [The Hiking Club 2026 trail updates](https://www.thehiking.club/tour-du-mont-blanc-trail-updates).

---

## 6. Canonical live sources (wire these into the app, don't hardcode)

- Refuge booking: **[Mon Tour du Mont Blanc](https://www.montourdumontblanc.com/en/)**
- Trail conditions (official): **[autourdumontblanc.com](https://www.autourdumontblanc.com/en/information/trails-conditions)**
- French lifts/timetables: **[Les Houches – Mont Blanc Natural Resort](https://leshouches.montblancnaturalresort.com/en/timetables-rates)** · [Chamonix lifts (live status)](https://www.chamonix.com/informations-remontees-mecaniques-en-temps-reel)
- Swiss transport: **[SBB](https://www.sbb.ch/en)** · [CarPostal Valais](https://www.carpostal.ch/) (Forclaz–Trient)
- Weather: Météo-France (Chamonix), MeteoSwiss, and refuge-posted forecasts.

---

## 7. Open items to verify before departure (checklist for the app)

- [ ] Tramway du Mont Blanc 2026 fare (update from €22)
- [ ] Val Veny→Courmayeur shuttle 2026 fare/timetable
- [ ] La Fouly→Orsières→Champex (272/273) CHF fares + times
- [ ] Le Tour/Charamillon lift 2026 hours/price
- [ ] Mont Blanc Express 2026 fare
- [ ] Confirm Lykke Hôtel & Spa receipt + Aug 11 return flight to Barcelona (from project notes)
- [ ] Re-check trail conditions in the final week via the official link above

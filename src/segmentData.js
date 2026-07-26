// TMB Segment Data - Anticlockwise from Les Houches
// Each key is "fromId-toId" matching waypoint IDs in src/waypoints.js
//
// Weather & Timing fields (optional per segment; absent = sheltered / no heat concern):
// - highPoint: { name, altitude, position (0–1 fraction of segment), lat, lng }
//     intermediate col/high point not represented as its own waypoint
// - exposure: { level: "moderate"|"exposed"|"severe", exitMin, shelter, note? }
//     exitMin = minutes from the most committed point to the named shelter
// - heat: { level, aspect, shade, water } — sun exposure risk on hot afternoons

export const segmentData = {
  "0-1": {
    // Les Houches (1007m) → Col de Voza (1657m) | 6.0km | +680m -30m | 2h20
    exposure: { level: "moderate", exitMin: 25, shelter: "Col de Voza buildings (ahead)" },
    heat: { level: "moderate", aspect: "S", shade: "partial", water: "scarce" },
    sights: [
      {
        name: "Les Houches Village",
        type: "historical",
        description: "Charming alpine village with traditional Savoyard architecture",
        detailedDescription: "Starting point of your TMB journey. The village has a beautiful 18th-century church and offers stunning views of Mont Blanc. Worth a quick walk through the old center before heading up.",
        timeToVisit: 15,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8906, lng: 6.7986 },
        photoRating: 3,
        position: 0.0
      },
      {
        name: "Téléphérique du Prarion viewpoint",
        type: "viewpoint",
        description: "First major panorama of the Mont Blanc massif",
        detailedDescription: "As you climb through the forest, clearings offer increasingly dramatic views of Mont Blanc, Aiguille du Midi, and the Chamonix valley. The Prarion cable car station has a restaurant terrace with exceptional views.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8833, lng: 6.7667 },
        photoRating: 5,
        position: 0.7
      },
      {
        name: "Col de Voza",
        type: "viewpoint",
        description: "Historic pass with panoramic Mont Blanc views",
        detailedDescription: "A significant mountain pass at 1653m. The Tramway du Mont Blanc stops here—a historic rack railway dating from 1909. Outstanding 360° views of the Bionnassay glacier and Mont Blanc.",
        timeToVisit: 20,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8667, lng: 6.7667 },
        photoRating: 5,
        position: 1.0
      }
    ],
    foodStops: [
      {
        name: "Hôtel-Restaurant Le Prarion",
        type: "restaurant",
        description: "Mountain restaurant at the cable car station",
        priceRange: "€€",
        specialty: "Tartiflette and local Savoyard dishes",
        position: 0.7
      },
      {
        name: "Refuge du Col de Voza",
        type: "refuge",
        description: "Small refuge at the pass",
        priceRange: "€",
        specialty: "Coffee, snacks, simple lunch plates",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Téléphérique du Prarion",
        type: "cable_car",
        description: "Cable car from Les Houches to Prarion, near Col de Voza",
        timeSaved: 90,
        distanceSaved: 5.0,
        ascentSaved: 600,
        descentSaved: 0,
        cost: 18.9,
        ticketInfo: "Buy at Les Houches station. Runs 9:15–17:00 (late Jun–early Sep). No advance booking needed.",
        skipsToWaypoint: null,
        considerations: "Misses the forest walk but saves significant elevation gain. Good option if starting late or in poor weather.",
        position: 0.1
      },
      {
        name: "Bellevue cable car",
        type: "cable_car",
        description: "Cable car from Les Houches to Bellevue, near Col de Voza",
        timeSaved: 90,
        distanceSaved: 5.0,
        ascentSaved: 650,
        descentSaved: 0,
        cost: 18.9,
        ticketInfo: "€18.90 one-way / €23.90 RT. Runs 7:30–18:00 (Jul 5–Aug 29). More direct route to Bellevue/Col de Voza.",
        skipsToWaypoint: null,
        considerations: "More direct than Prarion cable car for reaching Col de Voza. Opens earlier (7:30) which is useful for an early start.",
        position: 0.1
      },
      {
        name: "Tramway du Mont Blanc",
        type: "cable_car",
        description: "Historic rack railway to Col de Voza",
        timeSaved: 90,
        distanceSaved: 5.0,
        ascentSaved: 600,
        descentSaved: 0,
        cost: 22, // TODO verify — 2026 price may be ≈€40+ RT from Le Fayet; check montblancnaturalresort.com
        ticketInfo: "Departs from Saint-Gervais. Book at montblancnaturalresort.com or at station. Several departures daily.",
        skipsToWaypoint: null,
        considerations: "Scenic historic railway experience. Continues to Nid d'Aigle (2372m) if you want to see the Bionnassay glacier up close.",
        position: 0.1
      }
    ],
    waterSources: [
      { name: "Les Houches village fountain", type: "fountain", potable: true, position: 0.0 },
      { name: "Col de Voza refuge", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Les Houches tourist office / Prarion cable car station",
      phone: "+33 4 50 55 50 62"
    }
  },

  "1-2": {
    // Col de Voza (1657m) → Hôtel du Prarion (1860m) | 0.8km | +200m | 30min
    sights: [
      {
        name: "Mont Blanc Panorama",
        type: "photo",
        description: "One of the best Mont Blanc photo spots on the entire TMB",
        detailedDescription: "The ridge walk between Col de Voza and Prarion offers unobstructed views of the entire Mont Blanc massif. On clear days, you can see from the Aiguille du Midi to the Dômes de Miage. Best light in early morning.",
        timeToVisit: 15,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8650, lng: 6.7580 },
        photoRating: 5,
        position: 0.5
      }
    ],
    foodStops: [
      {
        name: "Hôtel Le Prarion",
        type: "restaurant",
        description: "Mountain hotel with full restaurant",
        priceRange: "€€",
        specialty: "Croûte au fromage, mountain charcuterie",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Hôtel Le Prarion", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Hôtel Le Prarion",
      phone: "+33 4 50 54 40 07"
    }
  },

  "2-3": {
    // Hôtel du Prarion (1860m) → Les Contamines (1161m) | 9.5km | +150m -849m | 2h45
    sights: [
      {
        name: "Bionnassay Glacier View",
        type: "glacier",
        description: "Dramatic view of the Bionnassay glacier and its moraines",
        detailedDescription: "From the high traverse, you get excellent views of the Bionnassay glacier descending from Mont Blanc. The glacier has retreated significantly—old photos at refuges show how far. A sobering reminder of climate change.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8500, lng: 6.7450 },
        photoRating: 4,
        position: 0.2
      },
      {
        name: "Col de Tricot",
        type: "viewpoint",
        description: "High point with views in all directions",
        detailedDescription: "At 2120m, this pass offers views back to Mont Blanc and forward to the Contamines valley. The descent involves a memorable crossing of the Bionnassay torrent on a footbridge.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8350, lng: 6.7350 },
        photoRating: 4,
        position: 0.35
      },
      {
        name: "Chalets de Miage",
        type: "historical",
        description: "Traditional alpine summer farming hamlet",
        detailedDescription: "A beautiful collection of old chalets where farmers still bring cattle for summer grazing. The area is known for its wildflowers in July. Small chapel with frescoes.",
        timeToVisit: 20,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8200, lng: 6.7200 },
        photoRating: 4,
        position: 0.5
      },
      {
        name: "Notre-Dame de la Gorge approach",
        type: "chapel",
        description: "Baroque church at the head of the valley",
        detailedDescription: "This 17th-century pilgrimage church marks the entrance to Les Contamines. Beautiful baroque interior with gold altarpiece. The Roman road beside it dates back 2000 years.",
        timeToVisit: 15,
        distanceOffTrail: 0.2,
        coordinates: { lat: 45.7950, lng: 6.7100 },
        photoRating: 3,
        position: 0.85
      }
    ],
    foodStops: [
      {
        name: "Refuge de Miage",
        type: "refuge",
        description: "Peaceful refuge in the Miage meadows",
        priceRange: "€",
        specialty: "Homemade tarts, fresh milk from local cows",
        position: 0.5
      },
      {
        name: "Les Contamines village",
        type: "restaurant",
        description: "Full-service mountain village with multiple options",
        priceRange: "€€",
        specialty: "Try La Ferme for farm-fresh Savoyard cuisine",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Bus from Les Houches",
        type: "bus",
        description: "Skip directly to Les Contamines via bus",
        timeSaved: 240,
        distanceSaved: 16.0,
        ascentSaved: 900,
        descentSaved: 1000,
        cost: 8,
        ticketInfo: "SAT Mont Blanc bus line. Several departures daily from Les Houches. Buy on bus or at tourist office.",
        skipsToWaypoint: 3,
        considerations: "Misses the entire Prarion-Tricot section, which is one of the most scenic on the TMB. Only recommended if weather is very poor or you need to skip ahead.",
        position: 0.0
      }
    ],
    waterSources: [
      { name: "Stream crossing at Col de Tricot", type: "stream", potable: true, position: 0.4 },
      { name: "Refuge de Miage", type: "tap", potable: true, position: 0.5 },
      { name: "Les Contamines village fountains", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Steep descent from Col de Tricot can be slippery when wet", severity: "caution", position: 0.4 }
    ],
    emergencyContacts: {
      nearestHelp: "Refuge de Miage / Les Contamines tourist office",
      phone: "+33 4 50 47 01 58"
    }
  },

  "3-4": {
    // Les Contamines (1161m) → Notre-Dame de la Gorge (1210m) | 3.2km | +60m -11m | 45min
    sights: [
      {
        name: "Les Contamines Village",
        type: "historical",
        description: "Authentic mountain village with baroque heritage",
        detailedDescription: "One of the best-preserved villages in the region. The 18th-century church has remarkable baroque interiors. Good place to resupply—several shops and a pharmacy.",
        timeToVisit: 30,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8206, lng: 6.7267 },
        photoRating: 3,
        position: 0.0
      },
      {
        name: "Notre-Dame de la Gorge",
        type: "chapel",
        description: "17th-century baroque pilgrimage church",
        detailedDescription: "A masterpiece of Savoyard baroque architecture. The gilded altarpiece is stunning. This has been a pilgrimage site since medieval times. The Roman road starting here was part of an ancient trade route over Col du Bonhomme.",
        timeToVisit: 20,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7989, lng: 6.7089 },
        photoRating: 4,
        position: 1.0
      }
    ],
    foodStops: [
      {
        name: "Chalet-Hôtel de la Gorge",
        type: "restaurant",
        description: "Restaurant next to the church",
        priceRange: "€€",
        specialty: "Trout from local streams",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Les Contamines fountains", type: "fountain", potable: true, position: 0.0 },
      { name: "Notre-Dame de la Gorge fountain", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Les Contamines medical center",
      phone: "+33 4 50 47 01 58"
    }
  },

  "4-5": {
    // Notre-Dame de la Gorge (1210m) → Nant Borrant (1459m) | 1.9km | +255m -6m | 50min
    sights: [
      {
        name: "Roman Road",
        type: "historical",
        description: "Ancient paved path dating back 2000 years",
        detailedDescription: "The first kilometer follows an authentic Roman road, part of the route connecting Gaul to Italy via Col du Bonhomme. The worn stone slabs have been walked for millennia. Remarkable piece of history underfoot.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7950, lng: 6.7050 },
        photoRating: 3,
        position: 0.2
      },
      {
        name: "Pont de la Téna",
        type: "photo",
        description: "Picturesque stone bridge over rushing torrent",
        detailedDescription: "Beautiful old stone bridge crossing the Bon Nant river. Great photo spot with cascading water and mountain backdrop. The water is glacier-fed and incredibly clear.",
        timeToVisit: 5,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7850, lng: 6.6950 },
        photoRating: 4,
        position: 0.4
      }
    ],
    foodStops: [
      {
        name: "Refuge de Nant Borrant",
        type: "refuge",
        description: "Traditional refuge in idyllic meadow setting",
        priceRange: "€",
        specialty: "Blueberry tart (tarte aux myrtilles), homemade soups",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Stream at Pont de la Téna", type: "stream", potable: true, position: 0.4 },
      { name: "Nant Borrant refuge", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Refuge de Nant Borrant",
      phone: "+33 4 50 47 03 57"
    }
  },

  "5-6": {
    // Nant Borrant (1459m) → Refuge de la Balme (1706m) | 4.4km | +260m -13m | 1h20
    exposure: { level: "moderate", exitMin: 25, shelter: "Refuge de la Balme (ahead)" },
    sights: [
      {
        name: "La Balme Valley",
        type: "viewpoint",
        description: "Beautiful high alpine valley with wildflower meadows",
        detailedDescription: "The valley opens up into stunning alpine meadows, especially beautiful in July when wildflowers are at their peak. Marmots are frequently spotted here. The cirque of peaks ahead is impressive.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7700, lng: 6.6850 },
        photoRating: 4,
        position: 0.6
      }
    ],
    foodStops: [
      {
        name: "Refuge de la Balme",
        type: "refuge",
        description: "Well-run refuge with mountain atmosphere",
        priceRange: "€",
        specialty: "Génépi digestif, hearty evening meals",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Stream crossings along valley", type: "stream", potable: true, position: 0.5 },
      { name: "Refuge de la Balme", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Refuge de la Balme",
      phone: "+33 4 50 47 03 54"
    }
  },

  "6-7": {
    // Refuge de la Balme (1706m) → Refuge de la Croix du Bonhomme (2433m) | 6.8km | +830m -103m | 2h50
    highPoint: { name: "Col du Bonhomme", altitude: 2329, position: 0.59, lat: 45.7350, lng: 6.7066 },
    exposure: { level: "severe", exitMin: 60, shelter: "Refuge de la Croix du Bonhomme (ahead)", note: "Above treeline from Plan des Dames; no shelter between La Balme and Croix du Bonhomme" },
    sights: [
      {
        name: "Col du Bonhomme",
        type: "viewpoint",
        description: "Historic pass at 2329m on ancient trade route",
        detailedDescription: "This pass has been used for thousands of years as a route between France and Italy. On clear days, views extend to Mont Blanc behind and the Beaufortain Alps ahead. Often windy—bring layers.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7450, lng: 6.6950 },
        photoRating: 4,
        position: 0.6
      },
      {
        name: "Col de la Croix du Bonhomme",
        type: "viewpoint",
        description: "High pass at 2483m with stone cross",
        detailedDescription: "The highest point between Les Contamines and Les Chapieux. A large wooden cross marks the spot. Views down into the Vallée des Glaciers and to the Italian border. Can have snow patches into July.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7400, lng: 6.7000 },
        photoRating: 5,
        position: 0.85
      }
    ],
    foodStops: [
      {
        name: "Refuge de la Croix du Bonhomme",
        type: "refuge",
        description: "Modern refuge at the pass",
        priceRange: "€€",
        specialty: "Hot drinks essential at this altitude, good dinner menu",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Refuge de la Croix du Bonhomme", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Exposed section between the two cols—dangerous in storms, turn back if lightning threatens", severity: "warning", position: 0.7 },
      { description: "Snow patches may persist into July—can be icy in early morning", severity: "caution", position: 0.8 }
    ],
    emergencyContacts: {
      nearestHelp: "Refuge de la Croix du Bonhomme",
      phone: "+33 4 79 07 05 28"
    }
  },

  "7-8": {
    // Refuge de la Croix du Bonhomme (2433m) → Les Chapieux (1554m) | 5.3km | +20m -899m | 1h40
    exposure: { level: "moderate", exitMin: 30, shelter: "Les Chapieux (ahead)" },
    sights: [
      {
        name: "Vallée des Glaciers View",
        type: "glacier",
        description: "Panorama of glacier-carved valley leading to Italy",
        detailedDescription: "The descent offers remarkable views of the Vallée des Glaciers with its hanging glaciers and the Aiguille des Glaciers (3816m). On the horizon, you can see the peaks of the Italian border including Mont Tondu.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7350, lng: 6.7100 },
        photoRating: 5,
        position: 0.3
      },
      {
        name: "Plan des Dames",
        type: "historical",
        description: "Site of tragic historical event",
        detailedDescription: "This windswept plateau is named for a group of women who perished in a snowstorm while crossing the pass centuries ago. A memorial stone marks the spot. A reminder of the mountains' dangers.",
        timeToVisit: 5,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7300, lng: 6.7200 },
        photoRating: 2,
        position: 0.2
      }
    ],
    foodStops: [
      {
        name: "Auberge de la Nova",
        type: "restaurant",
        description: "Rustic auberge in Les Chapieux hamlet",
        priceRange: "€€",
        specialty: "Beaufort cheese from local dairy, fondue",
        position: 1.0
      },
      {
        name: "Refuge des Mottets (advance)",
        type: "refuge",
        description: "If continuing, next refuge is 5km ahead",
        priceRange: "€",
        specialty: "Polenta, pasta, Italian influence begins",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Navette Les Chapieux ↔ Bourg-Saint-Maurice",
        type: "bus",
        description: "Shuttle bus from Les Chapieux to Bourg-Saint-Maurice and back",
        timeSaved: 0,
        distanceSaved: 0,
        ascentSaved: 0,
        descentSaved: 0,
        cost: 8,
        ticketInfo: "€8 each way. Evening departures from Les Chapieux: 17:20 / 17:50 / 18:20. Morning return BSM → Les Chapieux: 06:45 / 08:20. Runs ~Jun 22–Aug 30 (extended Jun 13–Sep 13). Ticket machine on site.",
        skipsToWaypoint: null,
        considerations: "Key hinge for Day 2/3 logistics — supplies, pharmacy, or train connections in Bourg-Saint-Maurice. Does not skip TMB sections. Plan around fixed departure times.",
        position: 1.0
      }
    ],
    waterSources: [
      { name: "Streams during descent", type: "stream", potable: true, position: 0.5 },
      { name: "Les Chapieux hamlet", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Steep descent—hard on knees, use poles", severity: "caution", position: 0.5 }
    ],
    emergencyContacts: {
      nearestHelp: "Auberge de la Nova, Les Chapieux",
      phone: "+33 4 79 89 07 15"
    }
  },

  "8-9": {
    // Les Chapieux (1554m) → Refuge des Mottets (1868m) | 6.4km | +320m -6m | 1h50
    sights: [
      {
        name: "Vallée des Glaciers",
        type: "viewpoint",
        description: "Deep valley leading to the Italian border",
        detailedDescription: "Walking through this U-shaped glacial valley, you're surrounded by high peaks. The Aiguille des Glaciers dominates. The valley feels remote and wild—few other hikers compared to other sections.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7200, lng: 6.7500 },
        photoRating: 4,
        position: 0.5
      }
    ],
    foodStops: [
      {
        name: "Refuge des Mottets",
        type: "refuge",
        description: "Welcoming refuge at foot of Col de la Seigne",
        priceRange: "€",
        specialty: "Italian-influenced menu, excellent pasta dishes",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Torrent des Glaciers", type: "stream", potable: true, position: 0.4 },
      { name: "Refuge des Mottets", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Refuge des Mottets",
      phone: "+33 4 79 07 01 70"
    }
  },

  "9-10": {
    // Refuge des Mottets (1868m) → Rifugio Elisabetta (2195m) | 8.1km | +655m -328m | 2h55
    highPoint: { name: "Col de la Seigne", altitude: 2516, position: 0.57, lat: 45.7514, lng: 6.8072 },
    exposure: { level: "severe", exitMin: 50, shelter: "Rifugio Elisabetta (ahead)", note: "Col de la Seigne open on both sides; Les Mottets behind" },
    sights: [
      {
        name: "Col de la Seigne",
        type: "viewpoint",
        description: "France-Italy border crossing at 2516m",
        detailedDescription: "A truly spectacular moment on the TMB. You step from France into Italy and the view opens to reveal the entire Italian side of Mont Blanc—the Miage glacier, the massive south face. Border stone marks the spot.",
        timeToVisit: 15,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7140, lng: 6.8070 },
        photoRating: 5,
        position: 0.6
      },
      {
        name: "Mont Blanc South Face",
        type: "glacier",
        description: "Dramatic view of Mont Blanc's Italian side",
        detailedDescription: "The view from Col de la Seigne is one of the trip highlights. The massive Miage glacier and the forbidding south face of Mont Blanc dominate the horizon. Very different character from the French side—more alpine, more dramatic.",
        timeToVisit: 15,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7130, lng: 6.8100 },
        photoRating: 5,
        position: 0.7
      }
    ],
    foodStops: [
      {
        name: "Rifugio Elisabetta",
        type: "refuge",
        description: "Italian refuge with spectacular position",
        priceRange: "€€",
        specialty: "Welcome to Italy! Pasta, polenta, Italian wines, espresso that's leagues better than the French stuff",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Streams near Col de la Seigne", type: "stream", potable: true, position: 0.6 },
      { name: "Rifugio Elisabetta", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Col de la Seigne exposed in bad weather—storms roll in fast from Italy", severity: "warning", position: 0.6 },
      { description: "Snow patches persist late into season on north side of col", severity: "caution", position: 0.5 }
    ],
    emergencyContacts: {
      nearestHelp: "Rifugio Elisabetta",
      phone: "+39 0165 844 080"
    }
  },

  "10-11": {
    // Rifugio Elisabetta (2195m) → Lac Combal (1968m) | 3.5km | +10m -237m | 55min
    exposure: { level: "moderate", exitMin: 25, shelter: "Cabane du Combal (ahead)" },
    sights: [
      {
        name: "Lago di Combal",
        type: "lake",
        description: "Glacial lake with stunning Mont Blanc backdrop",
        detailedDescription: "A beautiful aquamarine glacial lake at the base of the Miage glacier moraine. The milky color comes from glacial sediment. Mont Blanc towers above. Excellent spot for photography and a break.",
        timeToVisit: 15,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7600, lng: 6.8500 },
        photoRating: 5,
        position: 0.9
      },
      {
        name: "Miage Glacier View",
        type: "glacier",
        description: "Italy's longest glacier on Mont Blanc",
        detailedDescription: "The trail offers continuous views of the debris-covered Miage glacier. At 10km, it's the longest glacier on the Italian side. The moraine walls are immense—the glacier was once much larger.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7550, lng: 6.8400 },
        photoRating: 4,
        position: 0.5
      }
    ],
    foodStops: [],
    shortcuts: [],
    waterSources: [
      { name: "Streams from glacier", type: "stream", potable: false, position: 0.5 },
      { name: "Lac Combal area springs", type: "stream", potable: true, position: 0.9 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Rifugio Elisabetta (behind) or Courmayeur (ahead)",
      phone: "+39 0165 844 080"
    }
  },

  "11-12": {
    // Lac Combal (1968m) → Courmayeur (1226m) | 12.1km | +80m -822m | 3h05
    sights: [
      {
        name: "Val Veny",
        type: "viewpoint",
        description: "Classic Italian alpine valley",
        detailedDescription: "The descent follows the beautiful Val Veny with continuous views of the Mont Blanc range. The valley is less developed than Chamonix—more pastoral, with traditional farming. Wildflowers in summer.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7700, lng: 6.9000 },
        photoRating: 4,
        position: 0.4
      },
      {
        name: "Mont Blanc Skyway View",
        type: "viewpoint",
        description: "Views of the iconic cable car system",
        detailedDescription: "You'll see the Skyway Monte Bianco, the impressive rotating cable car to Punta Helbronner. Consider adding a day in Courmayeur to ride it—the views from 3466m are otherworldly.",
        timeToVisit: 5,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7850, lng: 6.9350 },
        photoRating: 3,
        position: 0.6
      }
    ],
    foodStops: [
      {
        name: "Courmayeur town center",
        type: "restaurant",
        description: "Charming Italian resort town with excellent dining",
        priceRange: "€€-€€€",
        specialty: "Try Cadran Solaire for pizza, La Terrazza for fine dining, or Caffè della Posta for people-watching",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Bus from Val Veny",
        type: "bus",
        description: "Bus from near Lac Combal to Courmayeur",
        timeSaved: 90,
        distanceSaved: 6.4,
        ascentSaved: 40,
        descentSaved: 750,
        cost: 3, // TODO verify — check SVAP/Savda 2026 fare and timetable
        ticketInfo: "Savda bus. Stops near La Visaille. Runs hourly in summer. Buy on bus.",
        skipsToWaypoint: 12,
        considerations: "Useful if tired or short on time. The Val Veny walk is pleasant but not essential.",
        position: 0.2
      }
    ],
    waterSources: [
      { name: "Streams in Val Veny", type: "stream", potable: true, position: 0.4 },
      { name: "Courmayeur town fountains", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Courmayeur hospital and tourist office",
      phone: "+39 0165 842 060"
    }
  },

  "12-13": {
    // Courmayeur (1226m) → Rifugio Bertone (1989m) | 4.3km | +770m -7m | 2h10
    exposure: { level: "moderate", exitMin: 30, shelter: "Rifugio Bertone (ahead)" },
    heat: { level: "severe", aspect: "S", shade: "none", water: "none" },
    sights: [
      {
        name: "Courmayeur Old Town",
        type: "historical",
        description: "Elegant Italian mountain resort",
        detailedDescription: "Worth exploring before the climb. Pedestrianized center with upscale shops, historic church, and genuine Italian cafe culture. The tourist office has a small mountaineering museum.",
        timeToVisit: 60,
        distanceOffTrail: 0,
        coordinates: { lat: 45.7967, lng: 6.9694 },
        photoRating: 3,
        position: 0.0
      },
      {
        name: "Mont Blanc Panorama from Bertone",
        type: "viewpoint",
        description: "Perhaps the finest Mont Blanc vista on the entire TMB",
        detailedDescription: "The view from Rifugio Bertone is legendary. The entire Italian side of Mont Blanc spreads before you—from the Brenva glacier to the Grandes Jorasses. Best at sunset when the mountain glows pink.",
        timeToVisit: 30,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8067, lng: 6.9600 },
        photoRating: 5,
        position: 1.0
      }
    ],
    foodStops: [
      {
        name: "Rifugio Bertone",
        type: "refuge",
        description: "Classic Italian rifugio with unbeatable views",
        priceRange: "€€",
        specialty: "Tagliatelle al ragù, local Valle d'Aosta wines, grappa",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Taxi to Rifugio Bertone road end",
        type: "alternate_route",
        description: "Taxi from Courmayeur to end of road above town",
        timeSaved: 30,
        distanceSaved: 1.5,
        ascentSaved: 200,
        descentSaved: 0,
        cost: 15,
        ticketInfo: "Arrange through hotel or call Courmayeur taxi: +39 0165 842 960",
        skipsToWaypoint: null,
        considerations: "Saves lowest part of climb through town. The climb is steep regardless.",
        position: 0.0
      }
    ],
    waterSources: [
      { name: "Courmayeur fountains", type: "fountain", potable: true, position: 0.0 },
      { name: "Rifugio Bertone", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Steep climb through forest—no shade in open sections, hot in afternoon", severity: "caution", position: 0.5 }
    ],
    emergencyContacts: {
      nearestHelp: "Rifugio Bertone / Courmayeur",
      phone: "+39 0165 844 612"
    }
  },

  "13-14": {
    // Rifugio Bertone (1989m) → Rifugio Bonatti (2025m) | 7.7km | +330m -294m | 2h15
    exposure: { level: "exposed", exitMin: 45, shelter: "Rifugio Bonatti (ahead)", note: "Balcony trail above treeline most of the way" },
    sights: [
      {
        name: "Mont de la Saxe Ridge",
        type: "viewpoint",
        description: "High ridge walk with non-stop panoramas",
        detailedDescription: "This is often cited as the most beautiful section of the entire TMB. You walk along a balcony facing Mont Blanc with the Grandes Jorasses, Dent du Géant, and the entire range spread before you. Take your time.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8300, lng: 7.0000 },
        photoRating: 5,
        position: 0.4
      },
      {
        name: "Tête de la Tronche",
        type: "viewpoint",
        description: "Optional summit with 360° views",
        detailedDescription: "A short detour to this 2584m summit offers even better views than the main trail. On clear days, you can see the Matterhorn. Add 45 minutes round trip.",
        timeToVisit: 45,
        distanceOffTrail: 0.5,
        coordinates: { lat: 45.8350, lng: 6.9850 },
        photoRating: 5,
        position: 0.3
      },
      {
        name: "Grandes Jorasses View",
        type: "glacier",
        description: "One of the Alps' most famous north faces",
        detailedDescription: "The view of the Grandes Jorasses (4208m) is spectacular from this section. The Walker Spur on the north face is one of mountaineering's great challenges. Massive hanging glaciers.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8400, lng: 7.0100 },
        photoRating: 5,
        position: 0.6
      }
    ],
    foodStops: [
      {
        name: "Rifugio Bonatti",
        type: "refuge",
        description: "Named after legendary mountaineer Walter Bonatti",
        priceRange: "€€",
        specialty: "Outstanding food, homemade pasta, extensive wine list. Book dinner ahead in high season.",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Streams on Mont de la Saxe", type: "stream", potable: true, position: 0.5 },
      { name: "Rifugio Bonatti", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Exposed ridge—no shelter in storms. Check weather before setting out.", severity: "warning", position: 0.4 }
    ],
    emergencyContacts: {
      nearestHelp: "Rifugio Bonatti",
      phone: "+39 0165 869 055"
    }
  },

  "14-15": {
    // Rifugio Bonatti (2025m) → Rifugio Elena (2062m) | 5.7km | +300m -263m | 1h50
    exposure: { level: "exposed", exitMin: 45, shelter: "Rifugio Elena (ahead)" },
    sights: [
      {
        name: "Val Ferret Views",
        type: "viewpoint",
        description: "Continued panoramas along the Italian-Swiss border",
        detailedDescription: "The trail continues its spectacular traverse high above Val Ferret. Views of the Triolet glacier and Aiguille de Triolet. The Grandes Jorasses remains visible for much of this section.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8600, lng: 7.0300 },
        photoRating: 5,
        position: 0.3
      },
      {
        name: "Pré de Bar Glacier",
        type: "glacier",
        description: "Dramatic glacier descending from Mont Dolent",
        detailedDescription: "The trail passes close to this impressive glacier. Mont Dolent (3820m) marks the point where France, Italy, and Switzerland meet. The glacier has retreated significantly but remains impressive.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8800, lng: 7.0500 },
        photoRating: 4,
        position: 0.6
      }
    ],
    foodStops: [
      {
        name: "Rifugio Elena",
        type: "refuge",
        description: "Final Italian refuge before Switzerland",
        priceRange: "€€",
        specialty: "Polenta e spezzatino (stew), last chance for Italian coffee!",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Low route via Val Ferret",
        type: "alternate_route",
        description: "Valley floor route instead of high traverse",
        timeSaved: 30,
        distanceSaved: 1.0,
        ascentSaved: 200,
        descentSaved: 100,
        cost: 0,
        ticketInfo: "N/A - just follow valley signs to Arnuva",
        skipsToWaypoint: null,
        considerations: "Less spectacular views but easier terrain. Good option in poor weather or if tired. Passes through Arnuva with bus connections.",
        position: 0.2
      }
    ],
    waterSources: [
      { name: "Multiple streams along traverse", type: "stream", potable: true, position: 0.5 },
      { name: "Rifugio Elena", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Some exposed sections with steep drop-offs—use caution", severity: "caution", position: 0.5 }
    ],
    emergencyContacts: {
      nearestHelp: "Rifugio Elena",
      phone: "+39 0165 844 688"
    }
  },

  "15-16": {
    // Rifugio Elena (2062m) → La Peule (2071m) | 7.5km | +480m -471m | 2h35
    highPoint: { name: "Grand Col Ferret", altitude: 2537, position: 0.51, lat: 45.8890, lng: 7.0779 },
    exposure: { level: "severe", exitMin: 60, shelter: "La Peule (ahead)", note: "Grand Col Ferret open on both approaches; Elena behind" },
    sights: [
      {
        name: "Grand Col Ferret",
        type: "viewpoint",
        description: "Italy-Switzerland border at 2537m",
        detailedDescription: "The crossing into Switzerland is dramatic. Behind you, the Italian Val Ferret and Mont Blanc. Ahead, the Swiss Val Ferret stretches toward Champex. Border stone marks the point. Often quite cold and windy.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8850, lng: 7.0700 },
        photoRating: 5,
        position: 0.5
      }
    ],
    foodStops: [
      {
        name: "Alpage de La Peule",
        type: "refuge",
        description: "Swiss mountain farm with simple refreshments",
        priceRange: "€",
        specialty: "Fresh milk, cheese from their own cows, rösti",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Streams near Grand Col Ferret", type: "stream", potable: true, position: 0.5 },
      { name: "La Peule farm", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Grand Col Ferret can be cold and exposed—bring layers", severity: "caution", position: 0.5 },
      { description: "Snow may persist on north side into July", severity: "caution", position: 0.4 }
    ],
    emergencyContacts: {
      nearestHelp: "La Peule / Ferret village ahead",
      phone: "Swiss emergency: 144"
    }
  },

  "16-17": {
    // La Peule (2071m) → Ferret (1700m) | 4.0km | +10m -381m | 1h05
    exposure: { level: "moderate", exitMin: 25, shelter: "Ferret village (ahead)" },
    sights: [
      {
        name: "Swiss Val Ferret",
        type: "viewpoint",
        description: "Classic Swiss alpine valley",
        detailedDescription: "The Swiss side feels immediately different—manicured trails, precise signage, picturesque farms. The valley is gentler than the Italian side. Views back to the glaciated peaks you've crossed.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8900, lng: 7.0850 },
        photoRating: 3,
        position: 0.5
      }
    ],
    foodStops: [
      {
        name: "Hotel Col de Fenêtre",
        type: "restaurant",
        description: "Small hotel in Ferret hamlet",
        priceRange: "€€",
        specialty: "Swiss rösti, fondue, excellent pastries",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Bus from Ferret",
        type: "bus",
        description: "PostBus down the valley to La Fouly or further",
        timeSaved: 60,
        distanceSaved: 7.0,
        ascentSaved: 20,
        descentSaved: 90,
        cost: 8,
        ticketInfo: "Swiss PostBus. Yellow buses, runs regularly. Buy on bus or Swiss travel app.",
        skipsToWaypoint: 18,
        considerations: "Useful if behind schedule. The Swiss Val Ferret walk is pleasant but not essential scenery.",
        position: 1.0
      }
    ],
    waterSources: [
      { name: "Ferret village fountain", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Ferret village",
      phone: "Swiss emergency: 144"
    }
  },

  "17-18": {
    // Ferret (1700m) → La Fouly (1610m) | 4.3km | +40m -130m | 1h
    sights: [
      {
        name: "Swiss Val Ferret meadows",
        type: "viewpoint",
        description: "Pastoral Swiss countryside",
        detailedDescription: "Easy walking through flower-filled meadows and traditional Swiss farms. Good chance to see the famous Swiss cows with their bells. The valley is peaceful after the high mountain drama.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.9100, lng: 7.1000 },
        photoRating: 3,
        position: 0.5
      }
    ],
    foodStops: [
      {
        name: "La Fouly village",
        type: "restaurant",
        description: "Swiss mountain village with services",
        priceRange: "€€",
        specialty: "Auberge des Glaciers has great fondue. Several cafés.",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "PostBus La Fouly to Champex",
        type: "bus",
        description: "Skip ahead to Champex-Lac via Orsières",
        timeSaved: 180,
        distanceSaved: 16.0,
        ascentSaved: 520,
        descentSaved: 550,
        cost: 15, // TODO verify — CHF fare on SBB; bus 272 La Fouly→Orsières then 273 Orsières→Champex
        ticketInfo: "Bus 272 La Fouly → Orsières, change to bus 273 Orsières → Champex. Operating from 6 Jun 2026. Pay in CHF. Runs multiple times daily.",
        skipsToWaypoint: 21,
        considerations: "Skips the valley floor section which is less dramatic. Many hikers use this option to save a day. Note: requires a bus change at Orsières (272→273).",
        position: 1.0
      }
    ],
    waterSources: [
      { name: "Streams along path", type: "stream", potable: true, position: 0.5 },
      { name: "La Fouly fountains", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "La Fouly tourist office",
      phone: "+41 27 783 23 83"
    }
  },

  "18-19": {
    // La Fouly (1610m) → Praz-de-Fort (1151m) | 8.3km | +70m -530m | 2h30
    sights: [
      {
        name: "Dranse de Ferret river",
        type: "lake",
        description: "Beautiful glacial river",
        detailedDescription: "The path follows the milky-blue Dranse river, fed by glaciers above. Peaceful woodland walking, a contrast to the high alpine sections. Several nice picnic spots along the river.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.9400, lng: 7.1200 },
        photoRating: 3,
        position: 0.5
      }
    ],
    foodStops: [
      {
        name: "Praz-de-Fort",
        type: "restaurant",
        description: "Small village with café",
        priceRange: "€€",
        specialty: "Local cheese plates, simple meals",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "PostBus to Champex",
        type: "bus",
        description: "Bus from Praz-de-Fort toward Champex",
        timeSaved: 120,
        distanceSaved: 7.7,
        ascentSaved: 450,
        descentSaved: 140,
        cost: 10,
        ticketInfo: "PostBus via Orsières. Check schedule.",
        skipsToWaypoint: 21,
        considerations: "The climb to Champex is significant (700m+). Bus is a reasonable option if tired.",
        position: 1.0
      }
    ],
    waterSources: [
      { name: "Dranse river (treat first)", type: "stream", potable: false, position: 0.5 },
      { name: "Praz-de-Fort fountain", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Praz-de-Fort / Orsières",
      phone: "Swiss emergency: 144"
    }
  },

  "19-20": {
    // Praz-de-Fort (1151m) → Issert (1055m) | 2.5km | -100m | 40min
    sights: [],
    foodStops: [
      {
        name: "Issert",
        type: "restaurant",
        description: "Small hamlet",
        priceRange: "€",
        specialty: "Limited options, small café",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Issert village tap", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Orsières (nearest town)",
      phone: "Swiss emergency: 144"
    }
  },

  "20-21": {
    // Issert (1055m) → Champex-Lac (1467m) | 5.2km | +450m | 2h
    sights: [
      {
        name: "Champex-Lac",
        type: "lake",
        description: "Stunning Swiss mountain lake",
        detailedDescription: "A beautiful lake surrounded by mountains, often called 'Little Canada' for its setting. The water reflects the peaks perfectly on calm mornings. Paddleboats available for rent. The Jardin Alpin is worth a visit.",
        timeToVisit: 30,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0290, lng: 7.1210 },
        photoRating: 5,
        position: 1.0
      },
      {
        name: "Jardin Alpin Flore-Alpe",
        type: "wildlife",
        description: "Alpine botanical garden",
        detailedDescription: "One of Switzerland's finest alpine gardens with over 4000 species. A great place to learn about the flowers you've been seeing. Small entrance fee.",
        timeToVisit: 45,
        distanceOffTrail: 0.2,
        coordinates: { lat: 46.0300, lng: 7.1200 },
        photoRating: 3,
        position: 0.95
      }
    ],
    foodStops: [
      {
        name: "Champex-Lac village",
        type: "restaurant",
        description: "Charming Swiss resort village",
        priceRange: "€€",
        specialty: "Restaurant Au Club Alpin for lake views, several bakeries for pastries",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Champex-Lac fountains", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Champex-Lac tourist office",
      phone: "+41 27 783 12 27"
    }
  },

  "21-22": {
    // Champex-Lac (1467m) → Plan de l'Au (1330m) | 4.7km | +30m -170m | 1h30
    sights: [
      {
        name: "Forest trail above Champex",
        type: "viewpoint",
        description: "Pleasant woodland with mountain views",
        detailedDescription: "Gentle walking through mixed forest with occasional clearings offering views of the Grand Combin massif to the south. A transitional section before the climb to Bovine.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0400, lng: 7.1100 },
        photoRating: 3,
        position: 0.5
      }
    ],
    foodStops: [
      {
        name: "Alpage de Plan de l'Au",
        type: "refuge",
        description: "Mountain farm with refreshments",
        priceRange: "€",
        specialty: "Fresh cheese, milk, simple snacks",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Plan de l'Au farm", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Champex-Lac / Col de la Forclaz",
      phone: "Swiss emergency: 144"
    }
  },

  "22-23": {
    // Plan de l'Au (1330m) → Bovine (1987m) | 4.2km | +690m -33m | 2h
    exposure: { level: "exposed", exitMin: 40, shelter: "Bovine alpage (ahead)" },
    sights: [
      {
        name: "Bovine Alpage",
        type: "viewpoint",
        description: "High pastures with panoramic views",
        detailedDescription: "The trail climbs to these beautiful high pastures with views of the Rhône valley and the Bernese Alps. Working alpine farm in summer—watch for grazing cattle. Great area for marmot sightings.",
        timeToVisit: 15,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0600, lng: 7.0750 },
        photoRating: 4,
        position: 0.8
      },
      {
        name: "Grand Combin View",
        type: "glacier",
        description: "Views of 4314m peak to the south",
        detailedDescription: "The Grand Combin, with its massive glaciers, dominates views to the south. It's one of the highest peaks in the Alps outside the Mont Blanc and Monte Rosa groups.",
        timeToVisit: 5,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0550, lng: 7.0800 },
        photoRating: 4,
        position: 0.6
      }
    ],
    foodStops: [
      {
        name: "Alpage de Bovine",
        type: "refuge",
        description: "Classic Swiss mountain farm refuge",
        priceRange: "€",
        specialty: "Famous for their dairy products—don't miss the dessert made with fresh cream",
        position: 1.0
      }
    ],
    shortcuts: [],
    waterSources: [
      { name: "Bovine alpage", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Bovine alpage",
      phone: "Swiss emergency: 144"
    }
  },

  "23-24": {
    // Bovine (1987m) → Col de la Forclaz (1526m) | 4.5km | +130m -591m | 1h30
    exposure: { level: "moderate", exitMin: 30, shelter: "Col de la Forclaz (ahead)" },
    sights: [
      {
        name: "Rhône Valley Views",
        type: "viewpoint",
        description: "Dramatic descent with valley panoramas",
        detailedDescription: "The descent offers sweeping views of the Rhône valley below and the Bernese Alps across the valley—including the Aletsch glacier region. On clear days, views extend to the Oberland peaks.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0650, lng: 7.0550 },
        photoRating: 4,
        position: 0.4
      }
    ],
    foodStops: [
      {
        name: "Hôtel du Col de la Forclaz",
        type: "restaurant",
        description: "Historic hotel at the pass",
        priceRange: "€€",
        specialty: "Traditional Swiss cuisine, excellent rösti, popular cyclist stop",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "PostBus Col de la Forclaz → Trient",
        type: "bus",
        description: "PostBus descent to Trient (4-min ride) or onward to Martigny",
        timeSaved: 30,
        distanceSaved: 2.1,
        ascentSaved: 0,
        descentSaved: 250,
        cost: 2.2,
        ticketInfo: "≈CHF 2.20 to Trient (4 min). Useful times: 16:31 / 18:31 (also 05:35 / 11:31). Continues to Martigny for supplies. See carpostal.ch/valais.",
        skipsToWaypoint: 25,
        considerations: "Quick skip of the Forclaz→Trient descent. Also useful for a supplies run to Martigny (longer ride). Pay in CHF.",
        position: 1.0
      }
    ],
    waterSources: [
      { name: "Col de la Forclaz hotel/fountain", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Hôtel Col de la Forclaz",
      phone: "+41 27 722 26 88"
    }
  },

  "24-25": {
    // Col de la Forclaz (1526m) → Trient (1279m) | 2.1km | -250m | 45min
    sights: [
      {
        name: "Trient Glacier View",
        type: "glacier",
        description: "Distant views of the Trient glacier",
        detailedDescription: "As you descend, you'll see the Trient glacier in the distance. The glacier has retreated dramatically in recent decades but remains impressive. The Trient valley was carved by this ice.",
        timeToVisit: 5,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0550, lng: 7.0200 },
        photoRating: 3,
        position: 0.4
      }
    ],
    foodStops: [
      {
        name: "Trient village",
        type: "restaurant",
        description: "Small Swiss village with inn",
        priceRange: "€€",
        specialty: "Auberge du Mont Blanc offers good meals and accommodation",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "PostBus Forclaz → Trient",
        type: "bus",
        description: "PostBus descent from Col de la Forclaz to Trient (4 min)",
        timeSaved: 30,
        distanceSaved: 2.1,
        ascentSaved: 0,
        descentSaved: 250,
        cost: 2.2,
        ticketInfo: "≈CHF 2.20. Useful times: 16:31 / 18:31 (also 05:35 / 11:31). See carpostal.ch/valais.",
        skipsToWaypoint: 25,
        considerations: "Short descent skip. Saves knees if they're suffering by this point. Pay in CHF.",
        position: 0.0
      }
    ],
    waterSources: [
      { name: "Trient village fountain", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Trient village",
      phone: "Swiss emergency: 144"
    }
  },

  "25-26": {
    // Trient (1279m) → Col de Balme (2191m) | 5.7km | +920m -8m | 2h40
    exposure: { level: "exposed", exitMin: 45, shelter: "Col de Balme / Charamillon lift (ahead)" },
    sights: [
      {
        name: "Les Grands viewpoint",
        type: "viewpoint",
        description: "Views back to the Trient valley",
        detailedDescription: "As you climb, increasingly expansive views open up—the Trient valley below, the Bernese Alps across the Rhône valley, and eventually the Mont Blanc massif coming back into view.",
        timeToVisit: 5,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0350, lng: 6.9900 },
        photoRating: 4,
        position: 0.4
      },
      {
        name: "Col de Balme",
        type: "viewpoint",
        description: "Switzerland-France border with legendary views",
        detailedDescription: "One of the trip highlights. The border crossing at 2191m offers a complete panorama of the Mont Blanc massif. After days circling the mountain, you finally see it whole from this magnificent vantage point. Emotional moment for many hikers.",
        timeToVisit: 20,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0280, lng: 6.9710 },
        photoRating: 5,
        position: 1.0
      }
    ],
    foodStops: [
      {
        name: "Refuge du Col de Balme",
        type: "refuge",
        description: "Refuge right at the pass",
        priceRange: "€€",
        specialty: "Hot chocolate and tarts with that view. Last Swiss prices!",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Télécabine Les Tseppes",
        type: "cable_car",
        description: "Gondola from Trient area partway up",
        timeSaved: 45,
        distanceSaved: 2.5,
        ascentSaved: 400,
        descentSaved: 0,
        cost: 15,
        ticketInfo: "Limited operation—check locally. Not always running.",
        skipsToWaypoint: null,
        considerations: "Saves some climbing but misses nice views. Availability uncertain.",
        position: 0.2
      }
    ],
    waterSources: [
      { name: "Streams on climb", type: "stream", potable: true, position: 0.5 },
      { name: "Col de Balme refuge", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Col de Balme exposed to weather—storms roll in quickly", severity: "warning", position: 0.9 }
    ],
    emergencyContacts: {
      nearestHelp: "Refuge du Col de Balme",
      phone: "+41 27 722 15 30"
    }
  },

  "26-27": {
    // Col de Balme (2191m) → Le Tour (1460m) | 3.9km | +5m -736m | 1h15
    exposure: { level: "moderate", exitMin: 30, shelter: "Charamillon lift / Le Tour (ahead)" },
    sights: [
      {
        name: "Chamonix Valley Vista",
        type: "viewpoint",
        description: "First views into the legendary Chamonix valley",
        detailedDescription: "The descent from Col de Balme offers one of the great views of the trip—the entire Chamonix valley spreads below with Mont Blanc, the Aiguilles, and the glaciers. You've almost come full circle.",
        timeToVisit: 15,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0150, lng: 6.9650 },
        photoRating: 5,
        position: 0.3
      },
      {
        name: "Aiguille du Tour",
        type: "glacier",
        description: "Impressive glaciated peak above Le Tour",
        detailedDescription: "The Aiguille du Tour (3542m) dominates the head of the valley. The Glacier du Tour descends from it. Le Tour village is a famous mountaineering center for these peaks.",
        timeToVisit: 5,
        distanceOffTrail: 0,
        coordinates: { lat: 46.0050, lng: 6.9750 },
        photoRating: 4,
        position: 0.6
      }
    ],
    foodStops: [
      {
        name: "Le Tour village",
        type: "restaurant",
        description: "Small village at head of Chamonix valley",
        priceRange: "€€",
        specialty: "Several cafés and restaurants. Good crêpes at village center.",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Téléphérique de Balme",
        type: "cable_car",
        description: "Cable car from near Col de Balme to Le Tour",
        timeSaved: 75,
        distanceSaved: 5.0,
        ascentSaved: 0,
        descentSaved: 650,
        cost: 20, // TODO verify — check 2026 Charamillon/Le Tour lift price and hours
        ticketInfo: "Chamonix lift pass accepted. Runs 9:00-16:30 in summer.",
        skipsToWaypoint: null,
        considerations: "Easy descent but misses the trail. Good option for tired knees.",
        position: 0.1
      },
      {
        name: "Train Le Tour to Chamonix",
        type: "bus",
        description: "Train from Le Tour to Chamonix/Les Houches",
        timeSaved: 180,
        distanceSaved: 31.5,
        ascentSaved: 1930,
        descentSaved: 3010,
        cost: 12, // TODO verify — Mont Blanc Express 2026 fare (Vallorcine–Chamonix line)
        ticketInfo: "Mont Blanc Express train. Frequent departures. Scenic ride.",
        skipsToWaypoint: 33,
        considerations: "Completes the circuit by train. Many hikers use this if short on time or to skip the final day.",
        position: 1.0
      }
    ],
    waterSources: [
      { name: "Streams during descent", type: "stream", potable: true, position: 0.5 },
      { name: "Le Tour village fountain", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Steep descent—hard on knees, use poles", severity: "caution", position: 0.5 }
    ],
    emergencyContacts: {
      nearestHelp: "Le Tour / Chamonix",
      phone: "+33 4 50 53 00 24"
    }
  },

  "27-28": {
    // Le Tour (1460m) → Tré-le-Champ (1417m) | 3.4km | +60m -103m | 50min
    sights: [
      {
        name: "Chamonix Aiguilles",
        type: "viewpoint",
        description: "Iconic granite spires come into view",
        detailedDescription: "Walking along the valley, you get ever-better views of the famous Aiguilles—the granite spires that make Chamonix legendary. The Aiguille Verte and Drus become prominent. World-class mountaineering terrain.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.9700, lng: 6.9400 },
        photoRating: 4,
        position: 0.5
      },
      {
        name: "Argentière Glacier viewpoint",
        type: "glacier",
        description: "One of Chamonix's major glaciers",
        detailedDescription: "The Argentière glacier flows down from the Aiguille Verte. You'll pass close enough to see the crevasses and seracs. Like all Alpine glaciers, it has retreated dramatically—historic photos show it once reached near the valley floor.",
        timeToVisit: 10,
        distanceOffTrail: 0.3,
        coordinates: { lat: 45.9650, lng: 6.9300 },
        photoRating: 4,
        position: 0.6
      }
    ],
    foodStops: [
      {
        name: "Argentière village",
        type: "restaurant",
        description: "Larger village with full services",
        priceRange: "€€",
        specialty: "Good pizzeria, several cafés, small supermarket for supplies",
        position: 0.5
      },
      {
        name: "Tré-le-Champ",
        type: "refuge",
        description: "Small hamlet with gîte",
        priceRange: "€",
        specialty: "Gîte Le Moulin has good home cooking",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Télécabine de Lognan",
        type: "cable_car",
        description: "Cable car from Argentière toward Grands Montets",
        timeSaved: 0,
        distanceSaved: 0,
        ascentSaved: 0,
        descentSaved: 0,
        cost: 25,
        ticketInfo: "Not a TMB shortcut but worth it for glacier views if you have time.",
        skipsToWaypoint: null,
        considerations: "Ride to Grands Montets (3275m) for incredible glacier views. Not a shortcut, but a worthy detour.",
        position: 0.5
      },
      {
        name: "Train to Chamonix/Les Houches",
        type: "bus",
        description: "Train from Argentière to skip ahead",
        timeSaved: 240,
        distanceSaved: 23.5,
        ascentSaved: 1690,
        descentSaved: 2730,
        cost: 10, // TODO verify — Mont Blanc Express 2026 fare (Vallorcine–Chamonix line)
        ticketInfo: "Mont Blanc Express. Frequent service.",
        skipsToWaypoint: 33,
        considerations: "Skips the final high sections including La Flégère and Brévent—which are spectacular. Only recommend if injured or out of time.",
        position: 0.5
      }
    ],
    waterSources: [
      { name: "Argentière village fountains", type: "fountain", potable: true, position: 0.5 },
      { name: "Tré-le-Champ", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Argentière / Chamonix",
      phone: "+33 4 50 53 00 24"
    }
  },

  "28-29": {
    // Tré-le-Champ (1417m) → La Flégère (1875m) | 7.5km | +783m -325m | 3h
    highPoint: { name: "Tête aux Vents", altitude: 2132, position: 0.6, lat: 45.963, lng: 6.906 },
    exposure: { level: "severe", exitMin: 60, shelter: "La Flégère (ahead)", note: "Aiguillette d'Argentière ladders + Tête aux Vents; retreat back down ladders is slow" },
    sights: [
      {
        name: "Lac Blanc optional detour",
        type: "lake",
        description: "One of the Alps' most photographed lakes",
        detailedDescription: "A 1-hour detour to this stunning mountain lake at 2352m. The reflection of Mont Blanc in the lake is world-famous. Refuge du Lac Blanc serves refreshments. Highly recommended if weather is good.",
        timeToVisit: 120,
        distanceOffTrail: 2.0,
        coordinates: { lat: 45.9650, lng: 6.8850 },
        photoRating: 5,
        position: 0.6
      },
      {
        name: "Aiguille Verte panorama",
        type: "viewpoint",
        description: "Dramatic views of 4122m peak",
        detailedDescription: "The Aiguille Verte is one of the great peaks of the Alps. From this traverse, you see its north face—one of the classic mountaineering routes. The hanging glaciers are impressive.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.9550, lng: 6.8900 },
        photoRating: 5,
        position: 0.5
      }
    ],
    foodStops: [
      {
        name: "Refuge de La Flégère",
        type: "refuge",
        description: "Refuge at cable car station",
        priceRange: "€€",
        specialty: "Terrace with Mont Blanc view, good tarts",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Télécabine de la Flégère",
        type: "cable_car",
        description: "Cable car from Les Praz to La Flégère",
        timeSaved: 120,
        distanceSaved: 7.0,
        ascentSaved: 750,
        descentSaved: 300,
        cost: 19,
        ticketInfo: "€19 one-way. Runs 8:20–18:00 (Jul 11–Aug 30), last descent 18:00. From Les Praz village.",
        skipsToWaypoint: 29,
        considerations: "Misses the beautiful traverse and Lac Blanc option. Only use if short on time.",
        position: 0.0
      }
    ],
    waterSources: [
      { name: "Streams on traverse", type: "stream", potable: true, position: 0.4 },
      { name: "La Flégère refuge", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Exposed traverse sections—not for vertigo sufferers", severity: "caution", position: 0.5 },
      { description: "Ladders and fixed chains on some variations—check route", severity: "caution", position: 0.55 }
    ],
    emergencyContacts: {
      nearestHelp: "La Flégère cable car station / Chamonix",
      phone: "+33 4 50 53 00 24"
    }
  },

  "29-30": {
    // La Flégère (1875m) → Planpraz (2000m) | 5.5km | +340m -215m | 1h50
    exposure: { level: "exposed", exitMin: 40, shelter: "Planpraz lift station (ahead)" },
    sights: [
      {
        name: "Grand Balcon Sud",
        type: "viewpoint",
        description: "The famous balcony trail facing Mont Blanc",
        detailedDescription: "This section of the Grand Balcon is one of the most spectacular walks in the Alps. You traverse directly across from Mont Blanc with unobstructed views of the entire massif—every peak, every glacier, laid out before you.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.9400, lng: 6.8700 },
        photoRating: 5,
        position: 0.5
      },
      {
        name: "Mer de Glace viewpoint",
        type: "glacier",
        description: "Views of France's largest glacier",
        detailedDescription: "From the trail, you can see the Mer de Glace flowing down between the Drus and Grandes Jorasses. Once 12km long, it has retreated dramatically but remains impressive. The scale is hard to comprehend.",
        timeToVisit: 10,
        distanceOffTrail: 0,
        coordinates: { lat: 45.9350, lng: 6.8650 },
        photoRating: 5,
        position: 0.7
      }
    ],
    foodStops: [
      {
        name: "Planpraz restaurant",
        type: "restaurant",
        description: "Restaurant at cable car mid-station",
        priceRange: "€€",
        specialty: "Busy tourist spot but great views and decent food",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Télécabine de la Flégère (descent)",
        type: "cable_car",
        description: "Descend from La Flégère to Les Praz / Chamonix",
        timeSaved: 90,
        distanceSaved: 2.8,
        ascentSaved: 0,
        descentSaved: 340,
        cost: 19,
        ticketInfo: "€19 one-way. Runs 8:20–18:00 (Jul 11–Aug 30), last descent 18:00. Bus from Les Praz to Les Houches.",
        skipsToWaypoint: null,
        considerations: "Bail-out option if tired or weather closing in. Descend to Chamonix and bus/taxi to Les Houches.",
        position: 0.0
      },
      {
        name: "Cable car Planpraz to Chamonix",
        type: "cable_car",
        description: "Descend to Chamonix by cable car (Brévent system)",
        timeSaved: 90,
        distanceSaved: 2.5,
        ascentSaved: 300,
        descentSaved: 200,
        cost: 22,
        ticketInfo: "Part of Brévent lift system. Runs 8:20–18:00 (Jul 11–Aug 30). Frequent departures to Chamonix.",
        skipsToWaypoint: null,
        considerations: "If bad weather closing in or tired, can end day here and bus to Les Houches.",
        position: 1.0
      }
    ],
    waterSources: [
      { name: "Planpraz facilities", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Planpraz cable car station",
      phone: "+33 4 50 53 22 75"
    }
  },

  "30-31": {
    // Planpraz (2000m) → Brévent (2525m) | 2.8km | +540m -15m | 1h30
    exposure: { level: "exposed", exitMin: 45, shelter: "Planpraz lift station (behind)" },
    sights: [
      {
        name: "Brévent Summit",
        type: "viewpoint",
        description: "Classic Mont Blanc viewpoint at 2525m",
        detailedDescription: "The Brévent is THE viewpoint of Chamonix. From the summit, you face Mont Blanc directly at eye level. The panorama is complete—from the Aiguilles to the glaciers to the summit. Many consider this the finest view of the mountain anywhere.",
        timeToVisit: 30,
        distanceOffTrail: 0,
        coordinates: { lat: 45.9333, lng: 6.8375 },
        photoRating: 5,
        position: 1.0
      }
    ],
    foodStops: [
      {
        name: "Brévent summit restaurant",
        type: "restaurant",
        description: "Restaurant at the cable car summit station",
        priceRange: "€€€",
        specialty: "Tourist prices but spectacular setting for a celebratory drink",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Téléphérique du Brévent",
        type: "cable_car",
        description: "Cable car Planpraz to Brévent summit",
        timeSaved: 60,
        distanceSaved: 2.5,
        ascentSaved: 500,
        descentSaved: 0,
        cost: 15,
        ticketInfo: "Part of Chamonix lift system. Short ride to summit.",
        skipsToWaypoint: null,
        considerations: "The climb is steep but rewarding. Cable car is quick if tired.",
        position: 0.0
      }
    ],
    waterSources: [
      { name: "Brévent summit facilities", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Final climb is steep with some scrambling—take care", severity: "caution", position: 0.7 },
      { description: "Summit exposed to wind and sudden weather changes", severity: "warning", position: 1.0 }
    ],
    emergencyContacts: {
      nearestHelp: "Brévent cable car station",
      phone: "+33 4 50 53 22 75"
    }
  },

  "31-32": {
    // Brévent (2525m) → Bellachat (2152m) | 2.4km | +30m -403m | 50min
    exposure: { level: "exposed", exitMin: 35, shelter: "Refuge de Bellachat (ahead)" },
    sights: [
      {
        name: "Final Mont Blanc Views",
        type: "viewpoint",
        description: "Last high-level views of the massif",
        detailedDescription: "The traverse from Brévent to Bellachat offers continuous Mont Blanc views as you begin your final descent. Enjoy these last hours at altitude—the journey is almost complete.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.9200, lng: 6.8200 },
        photoRating: 5,
        position: 0.5
      }
    ],
    foodStops: [
      {
        name: "Refuge de Bellachat",
        type: "refuge",
        description: "Cozy refuge with terrace views",
        priceRange: "€€",
        specialty: "Great sunset spot for final night on trail. Good home cooking.",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Téléphérique du Brévent (descent)",
        type: "cable_car",
        description: "Cable car from Brévent summit to Chamonix",
        timeSaved: 120,
        distanceSaved: 10.0,
        ascentSaved: 0,
        descentSaved: 1500,
        cost: 31,
        ticketInfo: "€31 one-way / €43 RT. Runs 8:20–18:00 (Jul 11–Aug 30). Descends via Planpraz to Chamonix.",
        skipsToWaypoint: null,
        considerations: "Major bail-out for a tired finish. Descend to Chamonix and bus/taxi to Les Houches. Skips Bellachat and the final descent.",
        position: 0.0
      }
    ],
    waterSources: [
      { name: "Bellachat refuge", type: "tap", potable: true, position: 1.0 }
    ],
    dangerZones: [],
    emergencyContacts: {
      nearestHelp: "Refuge de Bellachat",
      phone: "+33 4 50 53 43 23"
    }
  },

  "32-33": {
    // Bellachat (2152m) → Les Houches End (1007m) | 6.0km | +15m -1160m | 2h
    sights: [
      {
        name: "Final descent views",
        type: "viewpoint",
        description: "Closing views of Mont Blanc as you descend",
        detailedDescription: "The long descent offers time for reflection. Mont Blanc stays in view as you drop through forest and meadows back to Les Houches. You've walked all the way around that mountain.",
        timeToVisit: 0,
        distanceOffTrail: 0,
        coordinates: { lat: 45.9000, lng: 6.8100 },
        photoRating: 4,
        position: 0.3
      },
      {
        name: "Les Houches return",
        type: "historical",
        description: "Completing the circuit",
        detailedDescription: "Walking back into Les Houches, you've completed one of the world's great treks—170km, 10,000m of climbing, three countries, countless memories. Tradition calls for a celebratory drink in the village where you started.",
        timeToVisit: 30,
        distanceOffTrail: 0,
        coordinates: { lat: 45.8906, lng: 6.7986 },
        photoRating: 3,
        position: 1.0
      }
    ],
    foodStops: [
      {
        name: "Les Houches village",
        type: "restaurant",
        description: "Full services at your finish point",
        priceRange: "€€",
        specialty: "Le Basilic for pizza, Le Pèle for Savoyard classics. You've earned a big meal!",
        position: 1.0
      }
    ],
    shortcuts: [
      {
        name: "Téléphérique du Prarion",
        type: "cable_car",
        description: "Descend by cable car to Les Houches",
        timeSaved: 90,
        distanceSaved: 5.0,
        ascentSaved: 0,
        descentSaved: 700,
        cost: 18.9,
        ticketInfo: "€18.90 one-way. Same cable car you may have seen on Day 1. Runs 9:15–17:00 (late Jun–early Sep).",
        skipsToWaypoint: null,
        considerations: "Saves knees on long descent. But walking in is more satisfying—you've come this far!",
        position: 0.3
      }
    ],
    waterSources: [
      { name: "Streams in forest", type: "stream", potable: true, position: 0.5 },
      { name: "Les Houches fountains", type: "fountain", potable: true, position: 1.0 }
    ],
    dangerZones: [
      { description: "Very long descent—hard on knees. Use poles, take breaks.", severity: "caution", position: 0.5 }
    ],
    emergencyContacts: {
      nearestHelp: "Les Houches tourist office / medical center",
      phone: "+33 4 50 55 50 62"
    }
  }
};

export default segmentData;

/**
 * Geographic GeoJSON feature collections for Uttarakhand, India.
 * Includes District Administrative Outlines and Major Himalayan River System Channels.
 */

export const UTTARAKHAND_DISTRICTS_GEOJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Rudraprayag", "state": "Uttarakhand", "riskCategory": "High" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [78.85, 30.25], [78.95, 30.40], [79.05, 30.78], [79.18, 30.75],
          [79.20, 30.50], [79.12, 30.30], [78.98, 30.20], [78.85, 30.25]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Chamoli", "state": "Uttarakhand", "riskCategory": "Critical" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [79.12, 30.30], [79.20, 30.50], [79.18, 30.75], [79.45, 30.88],
          [79.75, 30.82], [79.95, 30.60], [79.80, 30.15], [79.45, 30.00],
          [79.25, 30.15], [79.12, 30.30]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Nainital", "state": "Uttarakhand", "riskCategory": "Moderate" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [79.25, 29.25], [79.38, 29.50], [79.68, 29.55], [79.75, 29.35],
          [79.60, 29.15], [79.35, 29.10], [79.25, 29.25]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Tehri Garhwal", "state": "Uttarakhand" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [78.35, 30.15], [78.50, 30.65], [78.85, 30.68], [78.95, 30.40],
          [78.85, 30.25], [78.45, 30.08], [78.35, 30.15]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Pauri Garhwal", "state": "Uttarakhand" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [78.45, 30.08], [78.85, 30.25], [78.98, 30.20], [79.25, 30.15],
          [79.25, 29.60], [78.75, 29.50], [78.45, 29.80], [78.45, 30.08]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Uttarkashi", "state": "Uttarakhand" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.85, 30.80], [78.20, 31.35], [79.15, 31.45], [79.18, 30.75],
          [78.85, 30.68], [78.50, 30.65], [77.85, 30.80]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Almora", "state": "Uttarakhand" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [79.25, 29.60], [79.45, 30.00], [79.80, 29.90], [79.85, 29.60],
          [79.68, 29.55], [79.38, 29.50], [79.25, 29.60]
        ]]
      }
    }
  ]
};

export const UTTARAKHAND_RIVERS_GEOJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Mandakini River", "basin": "Mandakini Valley", "hazardType": "Flash Flood Prone" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [79.0669, 30.7346], // Kedarnath
          [79.0050, 30.6400], // Sonprayag
          [79.0784, 30.5258], // Guptkashi
          [79.0944, 30.5167], // Ukhimath
          [78.9818, 30.3956], // Agastyamuni
          [78.9760, 30.3475], // Tilwara
          [78.9811, 30.2844]  // Rudraprayag Sangam with Alaknanda
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Alaknanda River", "basin": "Alaknanda Valley", "hazardType": "Main Trunk River" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [79.4938, 30.7433], // Badrinath
          [79.5658, 30.5564], // Joshimath / Vishnuprayag
          [79.4310, 30.4320], // Pipalkoti
          [79.3244, 30.4072], // Chamoli / Gopeshwar
          [79.2178, 30.2608], // Karnaprayag Sangam
          [78.9811, 30.2844], // Rudraprayag Sangam
          [78.6000, 30.1500], // Srinagar Garhwal
          [78.5900, 30.1400]  // Devprayag Confluence
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Pindar River", "basin": "Pindar Valley", "hazardType": "Glacial & Rainfall Runoff" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [79.9500, 30.2500], // Pindari Glacier Head
          [79.6000, 30.1000], // Khati
          [79.5020, 30.0650], // Tharali
          [79.3500, 30.1500], // Simli
          [79.2178, 30.2608]  // Karnaprayag Sangam
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Bhagirathi River", "basin": "Bhagirathi Valley", "hazardType": "Cloudburst Corridor" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [79.0800, 30.9200], // Gaumukh / Gangotri
          [78.4300, 30.7300], // Uttarkashi
          [78.4800, 30.3700], // Tehri Dam Reservoir
          [78.5900, 30.1400]  // Devprayag Confluence
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Kosi River & Lake Drainage", "basin": "Kumaon Hills", "hazardType": "Flash Flood Channel" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [79.4300, 29.4200], // Pangot Heights
          [79.4530, 29.3920], // Mallital / Naini Lake
          [79.4636, 29.3803], // Tallital Outlet
          [79.5160, 29.3830], // Bhowali
          [79.5550, 29.4380], // Ramgarh Valley
          [79.6470, 29.4720]  // Mukteshwar Slope
        ]
      }
    }
  ]
};

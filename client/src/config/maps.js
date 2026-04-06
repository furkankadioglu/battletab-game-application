/**
 * BattleTab v2 — Map Configuration
 * Single source of truth for both React menus and Phaser scenes.
 */

const maps = [
  {
    id: 'turkey',
    name: 'Turkey',
    regions: 91,
    minPlayers: 2,
    maxPlayers: 4,
    geoJsonFile: 'turkey.geojson',
    dimensions: { width: 1600, height: 900 },
    description: '91 provinces of Turkey',
  },
  {
    id: 'poland',
    name: 'Poland',
    regions: 73,
    minPlayers: 2,
    maxPlayers: 4,
    geoJsonFile: 'poland.geojson',
    dimensions: { width: 1600, height: 900 },
    description: '73 administrative regions of Poland',
  },
  {
    id: 'china',
    name: 'China',
    regions: 34,
    minPlayers: 2,
    maxPlayers: 4,
    geoJsonFile: 'china.geojson',
    dimensions: { width: 1600, height: 900 },
    description: '34 provinces of China',
  },
];

export function getMapById(id) {
  return maps.find(m => m.id === id);
}

export function getAllMaps() {
  return maps;
}

export default maps;

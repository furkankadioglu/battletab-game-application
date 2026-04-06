# P5.01 - MapGenerator.js

## Summary
Ported MapGenerator.js from v1 to BattleTab v2 with updated import paths and branding.

## File
`server/src/game/MapGenerator.js` (1055 lines)

## Changes from v1
1. **Import paths updated:**
   - `require('./Region')` -> `require('./entities/Region')`
   - `require('./constants')` -> `require('../../../shared').gameConstants`
   - `require('../../../shared/regionTypes')` -> `require('../../../shared').regionTypes`
   - `require('../utils/idGenerator')` -> unchanged
   - `require('./GateSystem')` -> unchanged

2. **try/catch fallback for regionTypes removed** -- now uses shared module directly.

3. **Branding:** All references use "BattleTab" only.

4. **Variable rename:** `resourceTypes` local variable renamed to `resourceTypes_list` to avoid shadowing the imported `regionTypes`/`resourceTypes` names.

## Preserved Logic
- GeoJSON loading with multi-path fallback and caching
- Mercator projection (mercatorY)
- Polygon splitting (_splitPolygon) and merging (_mergeSmallFeatures)
- RDP simplification (rdpSimplify, rdpSimplifyToTarget, perpDist)
- Centroid calculation (computeCentroid) with pointInPolygon validation
- Neighbor detection (computeNeighbors, areNeighbors) with edge midpoint fallback
- Spawn selection (pickSpawns) -- greedy farthest-first
- Tower selection (pickTowers) -- minimum spacing
- Connectivity enforcement (ensureConnectivity) -- BFS component bridging
- Grid map generation (generateGridMap) with cell vertices
- Special region type assignment (assignSpecialRegionTypes) -- MOUNTAIN, SNOW, ROCKY, SPEED
- Gate creation via GateSystem.createGates
- Resource distribution (iron, crystal, uranium)

## Exported API
```js
module.exports = { generateMap, generateMapFromGeoJSON };
```
- `generateMap(playerCount, mapType)` -- main entry point
- `generateMapFromGeoJSON(geoJsonData, playerCount, mapType)` -- direct GeoJSON input

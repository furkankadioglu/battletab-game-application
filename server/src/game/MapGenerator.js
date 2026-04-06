const fs = require('fs');
const path = require('path');
const Region = require('./entities/Region');
const { gameConstants: constants } = require('../../../shared');
const { regionTypes } = require('../../../shared');
const { generateId } = require('../utils/idGenerator');
const GateSystem = require('./GateSystem');

// Cache loaded GeoJSON data
const geoJsonCache = {};

/**
 * Load GeoJSON from client/public/maps (full data) or server maps (fallback).
 */
function loadGeoJSON(mapType) {
  if (geoJsonCache[mapType]) return geoJsonCache[mapType];

  const paths = [
    path.join(__dirname, 'maps', `${mapType}.json`),
    path.join(__dirname, '..', '..', '..', 'client', 'dist', 'maps', `${mapType}.json`),
    path.join(__dirname, '..', '..', '..', 'client', 'public', 'maps', `${mapType}.json`),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      geoJsonCache[mapType] = data;
      return data;
    }
  }

  throw new Error(`GeoJSON not found for: ${mapType}`);
}

/**
 * Main entry: generate map by type.
 */
function generateMap(playerCount, mapType = 'grid') {
  if (mapType && mapType !== 'grid') {
    const geoJsonData = loadGeoJSON(mapType);
    return generateMapFromGeoJSON(geoJsonData, playerCount, mapType);
  }
  return generateGridMap(playerCount);
}

// ============================================================================
// GeoJSON Map Generation
// ============================================================================

/**
 * Mercator projection: convert lat to Y coordinate.
 * This corrects for the stretching at high latitudes.
 */
function mercatorY(lat) {
  const latRad = (lat * Math.PI) / 180;
  // Scale to degree-equivalent units so Y is comparable to longitude (degrees)
  return (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

/**
 * Generate BattleTab game map from GeoJSON data.
 */
function generateMapFromGeoJSON(geoJsonData, playerCount, mapType) {
  const width = constants.MAP_WIDTH;
  const height = constants.MAP_HEIGHT;
  const PADDING = 50;

  const features = geoJsonData.features;
  if (!features || features.length === 0) {
    throw new Error('GeoJSON data has no features');
  }

  // Step 1: Extract ALL polygons per feature (merge MultiPolygon into single outline)
  const extractedFeatures = [];
  for (const feature of features) {
    const geom = feature.geometry;
    if (!geom) continue;

    const name = feature.properties?.name || feature.properties?.NAME ||
                 feature.properties?.Name || feature.properties?.ADMIN ||
                 feature.properties?.NAME_2 || feature.properties?.NAME_3 ||
                 feature.properties?.NAME_1 || 'Unknown';

    let rings = [];
    if (geom.type === 'Polygon') {
      rings = [geom.coordinates[0]]; // outer ring only
    } else if (geom.type === 'MultiPolygon') {
      // Collect ALL outer rings from all polygons
      rings = geom.coordinates.map(poly => poly[0]);
    } else {
      continue;
    }

    // Pick the largest ring as the main outline for this region
    let largestRing = rings[0];
    let largestArea = 0;
    for (const ring of rings) {
      const area = Math.abs(ringArea(ring));
      if (area > largestArea) {
        largestArea = area;
        largestRing = ring;
      }
    }

    extractedFeatures.push({ coords: largestRing, name, area: largestArea });
  }

  // Split oversized and merge undersized regions
  {
    const avgArea = extractedFeatures.length > 0
      ? extractedFeatures.reduce((s, f) => s + f.area, 0) / extractedFeatures.length : 0;
    const shouldSplitMerge = avgArea > 0 && extractedFeatures.length >= 3;

    // Scale thresholds: split > 1.5x avg, merge < 0.15x avg
    const scaledMaxArea = avgArea * 1.5;
    const scaledMinArea = avgArea * 0.15;

    if (shouldSplitMerge) {
      // Multiple passes: recalculate avg each pass, stop at 80 regions max
      const MAX_REGIONS = 80;
      for (let pass = 0; pass < 5; pass++) {
        if (extractedFeatures.length >= MAX_REGIONS) break;
        const passAvg = extractedFeatures.reduce((s, f) => s + f.area, 0) / extractedFeatures.length;
        const passMax = passAvg * 1.5;

        let didSplit = false;
        let i = 0;
        while (i < extractedFeatures.length) {
          if (extractedFeatures[i].area > passMax) {
            const halves = _splitPolygon(extractedFeatures[i].coords, extractedFeatures[i].name);
            if (halves && halves.length === 2) {
              extractedFeatures.splice(i, 1, ...halves);
              didSplit = true;
              continue;
            }
          }
          i++;
        }
        if (!didSplit) break;
      }

      // Merge undersized into nearest neighbor
      _mergeSmallFeatures(extractedFeatures, scaledMinArea);
    }
  }

  // Step 2: Compute bounding box with Mercator projection
  let minLon = Infinity, maxLon = -Infinity;
  let minMercY = Infinity, maxMercY = -Infinity;

  for (const feat of extractedFeatures) {
    for (const coord of feat.coords) {
      const lon = coord[0];
      const my = mercatorY(coord[1]);
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (my < minMercY) minMercY = my;
      if (my > maxMercY) maxMercY = my;
    }
  }

  // Step 3: Create Mercator coordinate transform
  const geoWidth = maxLon - minLon;
  const geoHeight = maxMercY - minMercY;
  const availWidth = width - 2 * PADDING;
  const availHeight = height - 2 * PADDING;
  const scaleX = availWidth / geoWidth;
  const scaleY = availHeight / geoHeight;
  const scale = Math.min(scaleX, scaleY);
  const scaledWidth = geoWidth * scale;
  const scaledHeight = geoHeight * scale;
  const offsetX = PADDING + (availWidth - scaledWidth) / 2;
  const offsetY = PADDING + (availHeight - scaledHeight) / 2;

  function transform(lon, lat) {
    const x = (lon - minLon) * scale + offsetX;
    const y = (maxMercY - mercatorY(lat)) * scale + offsetY;
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
  }

  // Step 4: Convert features to game coordinates
  const regionData = [];
  for (const feat of extractedFeatures) {
    // Transform all coordinates
    const gameCoords = feat.coords.map(c => transform(c[0], c[1]));

    // Remove duplicate closing point if present
    const last = gameCoords[gameCoords.length - 1];
    const first = gameCoords[0];
    if (Math.abs(last.x - first.x) < 0.5 && Math.abs(last.y - first.y) < 0.5) {
      gameCoords.pop();
    }

    // Simplify to reasonable vertex count (more generous for quality)
    const maxPts = mapType === 'russia' ? 40 : 60;
    const simplified = gameCoords.length > maxPts ? rdpSimplifyToTarget(gameCoords, maxPts) : gameCoords;

    if (simplified.length < 3) continue;

    // Compute proper centroid
    const centroid = computeCentroid(simplified);

    // Validate centroid is inside polygon (if not, use bbox center)
    if (!pointInPolygon(centroid, simplified)) {
      const bounds = getBounds(simplified);
      centroid.x = (bounds.minX + bounds.maxX) / 2;
      centroid.y = (bounds.minY + bounds.maxY) / 2;
    }

    regionData.push({
      name: feat.name,
      vertices: simplified,
      center: centroid,
      area: feat.area,
    });
  }

  // Step 5: Compute neighbors (shared edges = close vertices)
  const neighborMap = computeNeighbors(regionData);

  // Step 6: Select spawns (farthest apart)
  const spawnIndices = pickSpawns(regionData, playerCount, neighborMap);

  // Step 7: Select towers (near center, avoiding spawns)
  const towerIndices = pickTowers(regionData, spawnIndices, width, height);

  // Step 8: Create Region objects
  const regions = [];
  for (let i = 0; i < regionData.length; i++) {
    const rd = regionData[i];
    const id = generateId('region');

    const spawnIndex = spawnIndices.indexOf(i);
    const isTower = towerIndices.includes(i);

    let type, hp;
    if (spawnIndex >= 0) {
      type = regionTypes.SPAWN;
      hp = constants.SPAWN_HP;
    } else if (isTower) {
      type = regionTypes.TOWER;
      hp = randomInt(constants.MIN_NEUTRAL_HP, constants.MAX_NEUTRAL_HP);
    } else {
      type = regionTypes.NORMAL;
      hp = randomInt(constants.MIN_NEUTRAL_HP, constants.MAX_NEUTRAL_HP);
    }

    const region = new Region({
      id,
      center: rd.center,
      vertices: rd.vertices,
      type,
      hp,
      ownerId: null,
      neighbors: [],
    });

    if (spawnIndex >= 0) region._spawnIndex = spawnIndex;
    region.name = rd.name;
    regions.push(region);
  }

  // Step 9: Assign neighbor IDs
  for (let i = 0; i < regions.length; i++) {
    regions[i].neighbors = (neighborMap[i] || []).map(ni => regions[ni].id);
  }

  // Step 10: Ensure connectivity
  ensureConnectivity(regions, regionData);

  const spawnPositions = spawnIndices.map((ri, idx) => ({
    index: idx,
    regionId: regions[ri].id,
  }));

  // Generate gates FIRST (before special region types)
  const gates = GateSystem.createGates(regions, spawnIndices, towerIndices, width, height);

  // Collect gate region IDs
  const gateRegionIds = new Set(gates.map(g => g.regionId));

  // THEN assign special region types, excluding gate regions
  assignSpecialRegionTypes(regions, spawnIndices, towerIndices, gateRegionIds);

  // All regions have equal production (no area-based multiplier)
  // This ensures fairness since players choose their spawn location

  // Assign resource types equally distributed and random rates
  const resourceTypes_list = constants.RESOURCE_TYPES || ['iron', 'crystal', 'uranium'];
  const minRate = constants.RESOURCE_MIN_RATE || 0.8;
  const maxRate = constants.RESOURCE_MAX_RATE || 1.2;

  // Collect eligible regions, then shuffle and distribute evenly
  const eligible = regions.filter(r => r.type !== 'ROCKY' && !gateRegionIds.has(r.id));
  // Fisher-Yates shuffle
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  for (let i = 0; i < eligible.length; i++) {
    eligible[i].resourceType = resourceTypes_list[i % resourceTypes_list.length];
    eligible[i].resourceRate = +(minRate + Math.random() * (maxRate - minRate)).toFixed(2);
  }

  return { regions, width, height, spawnPositions, gates };
}

/**
 * Merge features smaller than minArea into their nearest neighbor.
 */
function _mergeSmallFeatures(features, minArea) {
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = features.length - 1; i >= 0; i--) {
      if (features[i].area >= minArea) continue;

      const small = features[i];
      // Find centroid of small feature
      let scx = 0, scy = 0;
      for (const [lon, lat] of small.coords) { scx += lon; scy += lat; }
      scx /= small.coords.length;
      scy /= small.coords.length;

      // Find nearest larger neighbor
      let bestIdx = -1, bestDist = Infinity;
      for (let j = 0; j < features.length; j++) {
        if (j === i) continue;
        let ncx = 0, ncy = 0;
        for (const [lon, lat] of features[j].coords) { ncx += lon; ncy += lat; }
        ncx /= features[j].coords.length;
        ncy /= features[j].coords.length;
        const d = (scx - ncx) ** 2 + (scy - ncy) ** 2;
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }

      if (bestIdx >= 0) {
        // Merge: combine coords (simple concat, polygon union approximation)
        const neighbor = features[bestIdx];
        // Use the larger polygon's coords + add small polygon's area
        neighbor.area += small.area;
        neighbor.name = neighbor.name.replace(/ \+ .*$/, '') + ' + ' + small.name;
        features.splice(i, 1);
        merged = true;
      }
    }
  }
}

/**
 * Split a polygon into two halves along its longest axis through the centroid.
 * Returns two features or null if split fails.
 */
function _splitPolygon(coords, baseName) {
  let cx = 0, cy = 0;
  for (const [lon, lat] of coords) { cx += lon; cy += lat; }
  cx /= coords.length;
  cy /= coords.length;

  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const splitHorizontal = (maxLon - minLon) > (maxLat - minLat);
  const splitValue = splitHorizontal ? cx : cy;
  const splitIdx = splitHorizontal ? 0 : 1;

  const left = [], right = [];
  for (let i = 0; i < coords.length; i++) {
    const curr = coords[i];
    const next = coords[(i + 1) % coords.length];

    if (curr[splitIdx] <= splitValue) left.push(curr);
    else right.push(curr);

    if ((curr[splitIdx] <= splitValue) !== (next[splitIdx] <= splitValue)) {
      const t = (splitValue - curr[splitIdx]) / (next[splitIdx] - curr[splitIdx]);
      const ix = curr[0] + t * (next[0] - curr[0]);
      const iy = curr[1] + t * (next[1] - curr[1]);
      left.push([ix, iy]);
      right.push([ix, iy]);
    }
  }

  if (left.length < 3 || right.length < 3) return null;

  left.push(left[0]);
  right.push(right[0]);

  const areaL = Math.abs(ringArea(left));
  const areaR = Math.abs(ringArea(right));

  return [
    { coords: left, name: baseName + ' (1)', area: areaL },
    { coords: right, name: baseName + ' (2)', area: areaR },
  ];
}

// ============================================================================
// Geometry Helpers
// ============================================================================

function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  return area / 2;
}

function computeCentroid(vertices) {
  let cx = 0, cy = 0, signedArea = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cross = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    signedArea += cross;
    cx += (vertices[i].x + vertices[j].x) * cross;
    cy += (vertices[i].y + vertices[j].y) * cross;
  }
  signedArea /= 2;
  if (Math.abs(signedArea) < 1e-10) {
    return {
      x: vertices.reduce((s, v) => s + v.x, 0) / n,
      y: vertices.reduce((s, v) => s + v.y, 0) / n,
    };
  }
  return { x: cx / (6 * signedArea), y: cy / (6 * signedArea) };
}

function pointInPolygon(point, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    if ((yi > point.y) !== (yj > point.y) &&
        point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function getBounds(vertices) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  return { minX, minY, maxX, maxY };
}

function distSq(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function dist(a, b) {
  return Math.sqrt(distSq(a, b));
}

// ============================================================================
// Polygon Simplification (RDP)
// ============================================================================

function rdpSimplifyToTarget(points, maxPoints) {
  if (points.length <= maxPoints) return points;

  let epsilon = 0.5;
  let result = points;
  for (let iter = 0; iter < 60; iter++) {
    result = rdpSimplify(points, epsilon);
    if (result.length <= maxPoints) break;
    epsilon *= 1.4;
  }

  if (result.length > maxPoints) {
    // Uniform sample as fallback
    const sampled = [];
    const step = result.length / maxPoints;
    for (let i = 0; i < maxPoints; i++) {
      sampled.push(result[Math.floor(i * step)]);
    }
    result = sampled;
  }

  return result.length >= 3 ? result : points.slice(0, 3);
}

function rdpSimplify(points, epsilon) {
  if (points.length <= 2) return points.slice();

  let maxDist = 0, maxIdx = 0;
  const start = points[0], end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], start, end);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
}

function perpDist(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(point, lineStart);
  return Math.abs(dx * (lineStart.y - point.y) - (lineStart.x - point.x) * dy) / Math.sqrt(lenSq);
}

// ============================================================================
// Neighbor Detection
// ============================================================================

/**
 * Compute neighbors by checking if regions share close vertices.
 * Two regions are neighbors if they have at least 2 vertices within threshold.
 */
function computeNeighbors(regionData) {
  const n = regionData.length;
  const neighborMap = {};
  for (let i = 0; i < n; i++) neighborMap[i] = [];

  // Threshold: vertices this close means shared border
  // Use larger threshold for maps with many regions (GeoJSON simplified coordinates may not align perfectly)
  const factor = n > 40 ? 0.025 : 0.015;
  const threshold = Math.max(constants.MAP_WIDTH, constants.MAP_HEIGHT) * factor;
  const thSq = threshold * threshold;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (areNeighbors(regionData[i].vertices, regionData[j].vertices, thSq)) {
        neighborMap[i].push(j);
        neighborMap[j].push(i);
      }
    }
  }

  return neighborMap;
}

function areNeighbors(vertsA, vertsB, thSq) {
  // Count close vertex pairs - need at least 2 for a shared border
  let closeCount = 0;
  for (const a of vertsA) {
    for (const b of vertsB) {
      if (distSq(a, b) < thSq) {
        closeCount++;
        if (closeCount >= 2) return true;
      }
    }
  }

  // Also check if edges are close (for cases where vertices don't align perfectly)
  // Sample midpoints of edges
  for (let i = 0; i < vertsA.length; i++) {
    const a1 = vertsA[i];
    const a2 = vertsA[(i + 1) % vertsA.length];
    const midA = { x: (a1.x + a2.x) / 2, y: (a1.y + a2.y) / 2 };

    for (let j = 0; j < vertsB.length; j++) {
      const b1 = vertsB[j];
      const b2 = vertsB[(j + 1) % vertsB.length];
      const midB = { x: (b1.x + b2.x) / 2, y: (b1.y + b2.y) / 2 };

      if (distSq(midA, midB) < thSq * 4) {
        // Edge midpoints are close - check endpoint proximity too
        if (distSq(a1, b1) < thSq * 9 || distSq(a1, b2) < thSq * 9 ||
            distSq(a2, b1) < thSq * 9 || distSq(a2, b2) < thSq * 9) {
          return true;
        }
      }
    }
  }

  return false;
}

// ============================================================================
// Spawn & Tower Selection
// ============================================================================

function pickSpawns(regionData, playerCount, neighborMap) {
  const n = regionData.length;
  if (n <= playerCount) return Array.from({ length: Math.min(n, playerCount) }, (_, i) => i);

  // Only consider regions with enough neighbors for viable gameplay
  const MIN_NEIGHBORS = 2;
  const eligible = new Set();
  for (let i = 0; i < n; i++) {
    if ((neighborMap[i] || []).length >= MIN_NEIGHBORS) {
      eligible.add(i);
    }
  }
  // Fallback: if too few eligible, include regions with at least 1 neighbor
  if (eligible.size < playerCount) {
    for (let i = 0; i < n; i++) {
      if ((neighborMap[i] || []).length >= 1) eligible.add(i);
    }
  }

  // Precompute distances
  const d = [];
  for (let i = 0; i < n; i++) {
    d[i] = [];
    for (let j = 0; j < n; j++) {
      d[i][j] = dist(regionData[i].center, regionData[j].center);
    }
  }

  // First spawn: top-left eligible region
  let bestIdx = 0, bestDist = Infinity;
  for (const i of eligible) {
    const dd = regionData[i].center.x + regionData[i].center.y;
    if (dd < bestDist) { bestDist = dd; bestIdx = i; }
  }
  const spawns = [bestIdx];

  // Greedy farthest-first (only from eligible regions)
  while (spawns.length < playerCount && spawns.length < n) {
    let maxMinDist = -1, nextSpawn = -1;
    for (const i of eligible) {
      if (spawns.includes(i)) continue;
      const minDist = Math.min(...spawns.map(s => d[i][s]));
      if (minDist > maxMinDist) { maxMinDist = minDist; nextSpawn = i; }
    }
    if (nextSpawn >= 0) spawns.push(nextSpawn);
    else break;
  }

  return spawns;
}

function pickTowers(regionData, spawnIndices, mapWidth, mapHeight) {
  const spawnSet = new Set(spawnIndices);
  const candidates = regionData
    .map((rd, i) => i)
    .filter(i => !spawnSet.has(i));

  // Shuffle candidates randomly
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const n = regionData.length;
  const count = n <= 10 ? 1 : n <= 20 ? 2 : n <= 30 ? 3 : n <= 50 ? 4 : 5;

  // Pick towers with minimum spacing to spread them out
  const picked = [];
  const minDist = Math.min(mapWidth, mapHeight) * 0.15;
  for (const idx of candidates) {
    if (picked.length >= count) break;
    const tooClose = picked.some(p => dist(regionData[idx].center, regionData[p].center) < minDist);
    if (!tooClose) picked.push(idx);
  }

  // Fallback: if spacing was too strict, just take first available
  if (picked.length < count) {
    for (const idx of candidates) {
      if (picked.length >= count) break;
      if (!picked.includes(idx)) picked.push(idx);
    }
  }

  return picked;
}

// ============================================================================
// Connectivity
// ============================================================================

function ensureConnectivity(regions, regionData) {
  // Phase 1: Ensure every region has at least MIN_NEIGHBORS neighbors
  const MIN_NEIGHBORS = 2;
  for (let i = 0; i < regions.length; i++) {
    while (regions[i].neighbors.length < MIN_NEIGHBORS) {
      let nearestIdx = -1, nearestDist = Infinity;
      const existingNeighborIds = new Set(regions[i].neighbors);
      for (let j = 0; j < regions.length; j++) {
        if (i === j || existingNeighborIds.has(regions[j].id)) continue;
        const d = dist(regionData[i].center, regionData[j].center);
        if (d < nearestDist) { nearestDist = d; nearestIdx = j; }
      }
      if (nearestIdx >= 0) {
        regions[i].neighbors.push(regions[nearestIdx].id);
        if (!regions[nearestIdx].neighbors.includes(regions[i].id)) {
          regions[nearestIdx].neighbors.push(regions[i].id);
        }
      } else {
        break;
      }
    }
  }

  // Phase 2: Bridge disconnected components (critical for multi-continent maps)
  const idToIdx = {};
  for (let i = 0; i < regions.length; i++) idToIdx[regions[i].id] = i;

  function findComponents() {
    const visited = new Set();
    const components = [];
    for (let i = 0; i < regions.length; i++) {
      if (visited.has(i)) continue;
      const comp = [];
      const queue = [i];
      visited.add(i);
      while (queue.length > 0) {
        const cur = queue.shift();
        comp.push(cur);
        for (const nId of regions[cur].neighbors) {
          const nIdx = idToIdx[nId];
          if (nIdx !== undefined && !visited.has(nIdx)) {
            visited.add(nIdx);
            queue.push(nIdx);
          }
        }
      }
      components.push(comp);
    }
    return components;
  }

  let components = findComponents();
  while (components.length > 1) {
    // Connect component[1] to component[0] via nearest pair
    const compA = components[0];
    const compB = components[1];
    let bestDist = Infinity, bestA = -1, bestB = -1;
    for (const ai of compA) {
      for (const bi of compB) {
        const d = dist(regionData[ai].center, regionData[bi].center);
        if (d < bestDist) { bestDist = d; bestA = ai; bestB = bi; }
      }
    }
    if (bestA >= 0 && bestB >= 0) {
      regions[bestA].neighbors.push(regions[bestB].id);
      regions[bestB].neighbors.push(regions[bestA].id);
      console.log(`[ensureConnectivity] Bridged components: ${regions[bestA].name} <-> ${regions[bestB].name} (dist=${Math.round(bestDist)}px)`);
    }
    components = findComponents();
  }
}

// ============================================================================
// Grid Map
// ============================================================================

function generateGridMap(playerCount) {
  const width = constants.MAP_WIDTH;
  const height = constants.MAP_HEIGHT;

  let cols, rows;
  if (playerCount <= 2) { cols = 5; rows = 4; }
  else { cols = 6; rows = 5; }

  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const jitterX = cellWidth * 0.2;
  const jitterY = cellHeight * 0.2;
  const padding = 20;

  const centers = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const baseCx = (col + 0.5) * cellWidth;
      const baseCy = (row + 0.5) * cellHeight;
      centers.push({
        row, col,
        x: clamp(baseCx + randomRange(-jitterX, jitterX), padding, width - padding),
        y: clamp(baseCy + randomRange(-jitterY, jitterY), padding, height - padding),
      });
    }
  }

  const spawnPositions = getGridSpawns(playerCount, cols, rows);
  const towerPositions = getGridTowers(cols, rows, playerCount);

  const regions = [];
  const gridIndex = {};

  for (let i = 0; i < centers.length; i++) {
    const { row, col, x, y } = centers[i];
    const id = generateId('region');

    const isSpawn = spawnPositions.findIndex(s => s.row === row && s.col === col);
    const isTower = towerPositions.some(t => t.row === row && t.col === col);

    let type = regionTypes.NORMAL;
    let hp;

    if (isSpawn >= 0) {
      type = regionTypes.SPAWN;
      hp = constants.SPAWN_HP;
    } else if (isTower) {
      type = regionTypes.TOWER;
      hp = randomInt(constants.MIN_NEUTRAL_HP, constants.MAX_NEUTRAL_HP);
    } else {
      hp = randomInt(constants.MIN_NEUTRAL_HP, constants.MAX_NEUTRAL_HP);
    }

    const vertices = generateCellVertices(col, row, cellWidth, cellHeight, width, height);
    const region = new Region({ id, center: { x, y }, vertices, type, hp, ownerId: null, neighbors: [] });
    if (isSpawn >= 0) region._spawnIndex = isSpawn;
    regions.push(region);
    gridIndex[`${row},${col}`] = i;
  }

  for (let i = 0; i < centers.length; i++) {
    const { row, col } = centers[i];
    const deltas = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    regions[i].neighbors = deltas
      .map(([dr, dc]) => gridIndex[`${row + dr},${col + dc}`])
      .filter(idx => idx !== undefined)
      .map(idx => regions[idx].id);
  }

  // Compute spawn and tower indices for gate generation
  const spawnRegionIndices = spawnPositions
    .map(s => gridIndex[`${s.row},${s.col}`])
    .filter(idx => idx !== undefined);
  const towerRegionIndices = towerPositions
    .map(t => gridIndex[`${t.row},${t.col}`])
    .filter(idx => idx !== undefined);

  // Generate gates FIRST (before special region types)
  const gates = GateSystem.createGates(regions, spawnRegionIndices, towerRegionIndices, width, height);

  // Collect gate region IDs
  const gateRegionIds = new Set(gates.map(g => g.regionId));

  // THEN assign special region types, excluding gate regions
  assignSpecialRegionTypes(regions, spawnRegionIndices, towerRegionIndices, gateRegionIds);

  return {
    regions, width, height,
    spawnPositions: spawnPositions.map((s, idx) => ({
      index: idx,
      regionId: regions[gridIndex[`${s.row},${s.col}`]].id,
    })),
    gates,
  };
}

function getGridSpawns(playerCount, cols, rows) {
  return [
    { row: 0, col: 0 },
    { row: rows - 1, col: cols - 1 },
    { row: 0, col: cols - 1 },
    { row: rows - 1, col: 0 },
  ].slice(0, playerCount);
}

function getGridTowers(cols, rows, playerCount) {
  const count = playerCount <= 2 ? 1 : playerCount <= 3 ? 2 : 3;
  // Build all non-edge cells as candidates
  const candidates = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      candidates.push({ row: r, col: c });
    }
  }
  // Shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count);
}

function generateCellVertices(col, row, cellWidth, cellHeight, mapWidth, mapHeight) {
  const left = col * cellWidth, right = (col + 1) * cellWidth;
  const top = row * cellHeight, bottom = (row + 1) * cellHeight;
  const vx = cellWidth * 0.03, vy = cellHeight * 0.03;
  return [
    { x: clamp(left + randomRange(0, vx), 0, mapWidth), y: clamp(top + randomRange(0, vy), 0, mapHeight) },
    { x: clamp(right + randomRange(-vx, 0), 0, mapWidth), y: clamp(top + randomRange(0, vy), 0, mapHeight) },
    { x: clamp(right + randomRange(-vx, 0), 0, mapWidth), y: clamp(bottom + randomRange(-vy, 0), 0, mapHeight) },
    { x: clamp(left + randomRange(0, vx), 0, mapWidth), y: clamp(bottom + randomRange(-vy, 0), 0, mapHeight) },
  ];
}

// ============================================================================
// Special Region Type Assignment
// ============================================================================

/**
 * Randomly assign MOUNTAIN, SNOW, ROCKY types to some NORMAL regions.
 * Constraints:
 * - Only NORMAL regions are converted
 * - Gate regions are NEVER converted (they stay NORMAL)
 * - Gate regions' neighbors are never ALL blocked (at least 1 passable neighbor per gate)
 * - Rocky regions must not be adjacent to spawn regions
 * - Rocky regions must not be adjacent to other rocky regions
 * - ~15% mountain, ~15% snow, ~5% rocky
 */
function assignSpecialRegionTypes(regions, spawnIndices, towerIndices, gateRegionIds) {
  const spawnSet = new Set(spawnIndices);
  const towerSet = new Set(towerIndices);
  gateRegionIds = gateRegionIds || new Set();

  // Find spawn region IDs for adjacency check
  const spawnRegionIds = new Set();
  for (const idx of spawnIndices) {
    if (regions[idx]) spawnRegionIds.add(regions[idx].id);
  }

  // Build a set of gate region indices
  const gateIndexSet = new Set();
  for (let i = 0; i < regions.length; i++) {
    if (gateRegionIds.has(regions[i].id)) gateIndexSet.add(i);
  }

  // Collect indices of NORMAL regions that are eligible for conversion
  // Excludes: spawn, tower, gate regions
  const normalIndices = [];
  for (let i = 0; i < regions.length; i++) {
    if (!spawnSet.has(i) && !towerSet.has(i) && !gateIndexSet.has(i) && regions[i].type === 'NORMAL') {
      normalIndices.push(i);
    }
  }

  // Shuffle for randomness
  for (let i = normalIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [normalIndices[i], normalIndices[j]] = [normalIndices[j], normalIndices[i]];
  }

  const total = normalIndices.length;
  const mountainCount = Math.max(1, Math.floor(total * 0.15));
  // Snow and rocky are optional - ~60% chance to appear on any given map
  const snowCount = Math.random() < 0.6 ? Math.floor(total * 0.15) : 0;
  const rockyCount = (total >= 10 && Math.random() < 0.6) ? Math.floor(total * 0.08) : 0;

  // Track which region IDs are impassable (rocky) or blocking (for gate neighbor check)
  const rockyRegionIds = new Set();
  // Track all special type IDs for gate neighbor protection
  const specialRegionIds = new Set();

  /**
   * Check if making a region special would block all exits from any gate region.
   * A gate must keep at least 1 neighbor that is passable (not rocky, not gate).
   */
  function wouldBlockGate(regionId) {
    for (const gateId of gateRegionIds) {
      const gateRegion = regions.find(r => r.id === gateId);
      if (!gateRegion) continue;

      // Count passable neighbors (not rocky, not the region we're about to convert)
      let passableCount = 0;
      for (const nId of gateRegion.neighbors) {
        if (nId === regionId) continue; // This one is being converted
        if (rockyRegionIds.has(nId)) continue; // Already rocky
        if (gateRegionIds.has(nId)) continue; // Another gate
        passableCount++;
      }
      // If this gate would have 0 passable neighbors, block the conversion
      if (passableCount === 0) return true;
    }
    return false;
  }

  let assigned = 0;

  // Assign MOUNTAIN
  for (let i = 0; i < mountainCount && assigned < normalIndices.length; assigned++) {
    const idx = normalIndices[assigned];
    const region = regions[idx];
    region.type = regionTypes.MOUNTAIN;
    region.productionRate = constants.MOUNTAIN_PRODUCTION_RATE || 0.5;
    const bonuses = constants.MOUNTAIN_DEFENSE_BONUS || [10, 25, 50];
    region.defenseBonus = bonuses[Math.floor(Math.random() * bonuses.length)];
    specialRegionIds.add(region.id);
    i++;
  }

  // Assign SNOW
  for (let i = 0; i < snowCount && assigned < normalIndices.length; assigned++) {
    const idx = normalIndices[assigned];
    const region = regions[idx];
    region.type = regionTypes.SNOW;
    region.productionRate = constants.SNOW_PRODUCTION_RATE || 0.8;
    region.speedMultiplier = constants.SNOW_SPEED_MULTIPLIER || 0.5;
    specialRegionIds.add(region.id);
    i++;
  }

  // Assign ROCKY (with adjacency constraints)
  let rockyAssigned = 0;
  for (; assigned < normalIndices.length && rockyAssigned < rockyCount; assigned++) {
    const idx = normalIndices[assigned];
    const region = regions[idx];

    // Skip if adjacent to a spawn region
    if (region.neighbors.some(nId => spawnRegionIds.has(nId))) continue;

    // Skip if adjacent to a gate region
    if (region.neighbors.some(nId => gateRegionIds.has(nId))) continue;

    // Skip if would create two adjacent rocky regions
    if (region.neighbors.some(nId => rockyRegionIds.has(nId))) continue;

    // Skip if would block all exits from any gate
    if (wouldBlockGate(region.id)) continue;

    region.type = regionTypes.ROCKY;
    region.productionRate = 0;
    region.hp = 0;
    region.ownerId = null;
    rockyRegionIds.add(region.id);
    rockyAssigned++;
  }

  // Assign SPEED (~10% of remaining normals)
  const remainingNormals = [];
  for (let i = assigned; i < normalIndices.length; i++) {
    const idx = normalIndices[i];
    if (regions[idx].type === 'NORMAL') {
      remainingNormals.push(idx);
    }
  }
  const speedCount = Math.max(0, Math.floor(remainingNormals.length * 0.1));
  for (let i = 0; i < speedCount && i < remainingNormals.length; i++) {
    const idx = remainingNormals[i];
    const region = regions[idx];
    region.type = regionTypes.SPEED;
    region.productionRate = constants.SPEED_PRODUCTION_RATE || 0.8;
    region.speedMultiplier = constants.SPEED_REGION_MULTIPLIER || 1.5;
  }

  console.log(`[MapGenerator] Special regions: ${mountainCount} mountain, ${snowCount} snow, ${rockyAssigned} rocky (of ${total} normal, ${gateRegionIds.size} gate excluded)`);
}

// ============================================================================
// Utilities
// ============================================================================

function randomRange(min, max) { return min + Math.random() * (max - min); }
function randomInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

module.exports = { generateMap, generateMapFromGeoJSON };

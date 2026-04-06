/**
 * BattleTab v2 — Pathfinding System
 * Computes waypoints around rocky (impassable) regions.
 * Uses expanded polygon vertices + visibility graph + Dijkstra.
 */

const { distance, pointInPolygon, segmentIntersectsPolygon } = require('../utils/math');

const EXPAND_MARGIN = 18; // px outward expansion for rocky polygon vertices

/**
 * Expand a polygon's vertices outward from its center by a margin.
 */
function expandPolygon(vertices, center, margin) {
  return vertices.map(v => {
    const dx = v.x - center.x;
    const dy = v.y - center.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x: v.x + margin, y: v.y };
    return {
      x: v.x + (dx / len) * margin,
      y: v.y + (dy / len) * margin,
    };
  });
}

/**
 * Check if a line segment is clear of all rocky polygons.
 */
function isSegmentClear(from, to, rockyRegions) {
  for (const region of rockyRegions) {
    const verts = region.polygon || [];
    if (verts.length < 3) continue;
    if (segmentIntersectsPolygon(from, to, verts)) return false;
  }
  return true;
}

/**
 * Compute avoidance waypoints from start to end around rocky regions.
 * Returns intermediate waypoints (not including start/end).
 */
function computeWaypoints(start, end, rockyRegions) {
  if (!rockyRegions || rockyRegions.length === 0) return [];
  if (isSegmentClear(start, end, rockyRegions)) return [];

  // Collect candidate nodes from expanded rocky vertices
  const candidates = [];
  for (const region of rockyRegions) {
    const verts = region.polygon || [];
    if (verts.length < 3) continue;
    const expanded = expandPolygon(verts, region.center, EXPAND_MARGIN);
    for (const v of expanded) {
      let insideOther = false;
      for (const other of rockyRegions) {
        if (other === region) continue;
        const otherVerts = other.polygon || [];
        if (otherVerts.length < 3) continue;
        if (pointInPolygon(v, otherVerts)) { insideOther = true; break; }
      }
      if (!insideOther) candidates.push(v);
    }
  }

  if (candidates.length === 0) return [];

  // Build visibility graph: 0=start, 1=end, 2..N=candidates
  const nodes = [start, end, ...candidates];
  const n = nodes.length;
  const adj = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (isSegmentClear(nodes[i], nodes[j], rockyRegions)) {
        const d = distance(nodes[i], nodes[j]);
        adj[i].push({ to: j, dist: d });
        adj[j].push({ to: i, dist: d });
      }
    }
  }

  // Dijkstra: start(0) → end(1)
  const dists = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);
  dists[0] = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1, minD = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited[i] && dists[i] < minD) { minD = dists[i]; u = i; }
    }
    if (u === -1 || u === 1) break;
    visited[u] = true;

    for (const edge of adj[u]) {
      const newDist = dists[u] + edge.dist;
      if (newDist < dists[edge.to]) {
        dists[edge.to] = newDist;
        prev[edge.to] = u;
      }
    }
  }

  if (dists[1] === Infinity) return [];

  // Reconstruct path → extract intermediate waypoints
  const path = [];
  let current = 1;
  while (current !== 0 && current !== -1) {
    path.push(current);
    current = prev[current];
  }
  path.reverse();

  return path
    .filter(idx => idx !== 0 && idx !== 1)
    .map(idx => ({ x: nodes[idx].x, y: nodes[idx].y }));
}

/**
 * Collect rocky regions from gameState.
 */
function getRockyRegions(gameState) {
  const rocky = [];
  for (const region of gameState.regions.values()) {
    if (region.type === 'ROCKY') rocky.push(region);
  }
  return rocky;
}

module.exports = { computeWaypoints, getRockyRegions, isSegmentClear, expandPolygon };

/**
 * BattleTab v2 — Pathfinding System
 * Computes waypoints around rocky (impassable) regions.
 * Uses expanded polygon vertices + cached visibility graph + Dijkstra w/ min-heap.
 *
 * Performance optimisation (2026-04):
 *  - Rocky regions are STATIC — build the inter-candidate visibility graph once
 *    and store it on a VisibilityGraph instance per game.
 *  - Per query: only O(m) segment checks (start→candidates, end→candidates).
 *    Previously O(m²) checks were repeated for every single army dispatch.
 *  - Dijkstra uses a binary min-heap → O((V+E) log V) instead of O(V²).
 *  - Results are cached by rounded coord key for parallel armies on same route.
 */

const { distance, pointInPolygon, segmentIntersectsPolygon } = require('../utils/math');

const EXPAND_MARGIN = 18; // px outward expansion for rocky polygon vertices
const CACHE_MAX = 256;    // max path-cache entries per VisibilityGraph

// ─── Min-Heap ─────────────────────────────────────────────────────────────────

class MinHeap {
  constructor() { this.data = []; }
  isEmpty() { return this.data.length === 0; }

  push(dist, node) {
    this.data.push({ dist, node });
    this._bubbleUp(this.data.length - 1);
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[p].dist <= this.data[i].dist) break;
      const tmp = this.data[p]; this.data[p] = this.data[i]; this.data[i] = tmp;
      i = p;
    }
  }

  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let s = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l].dist < this.data[s].dist) s = l;
      if (r < n && this.data[r].dist < this.data[s].dist) s = r;
      if (s === i) break;
      const tmp = this.data[s]; this.data[s] = this.data[i]; this.data[i] = tmp;
      i = s;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function expandPolygon(vertices, center, margin) {
  return vertices.map(v => {
    const dx = v.x - center.x;
    const dy = v.y - center.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x: v.x + margin, y: v.y };
    return { x: v.x + (dx / len) * margin, y: v.y + (dy / len) * margin };
  });
}

function isSegmentClear(from, to, rockyRegions) {
  for (const region of rockyRegions) {
    const verts = region.polygon || [];
    if (verts.length < 3) continue;
    if (segmentIntersectsPolygon(from, to, verts)) return false;
  }
  return true;
}

// ─── VisibilityGraph ──────────────────────────────────────────────────────────

/**
 * Pre-built static visibility graph for a fixed set of rocky regions.
 * Construct once at game start; query cheaply per army dispatch.
 *
 * Node layout inside computeWaypoints:
 *   0 = start (dynamic)
 *   1 = end   (dynamic)
 *   2…m+1 = candidates (static, built once)
 */
class VisibilityGraph {
  constructor(rockyRegions) {
    this.rockyRegions = rockyRegions;
    this.candidates = [];  // expanded vertices — static per game
    this.staticAdj = [];   // candidate↔candidate edges — static per game
    this._cache = new Map();

    this._build();
  }

  _build() {
    // 1. Collect expanded polygon vertices, skip those inside other polygons
    for (const region of this.rockyRegions) {
      const verts = region.polygon || [];
      if (verts.length < 3) continue;
      const expanded = expandPolygon(verts, region.center, EXPAND_MARGIN);
      for (const v of expanded) {
        let insideOther = false;
        for (const other of this.rockyRegions) {
          if (other === region) continue;
          const otherVerts = other.polygon || [];
          if (otherVerts.length < 3) continue;
          if (pointInPolygon(v, otherVerts)) { insideOther = true; break; }
        }
        if (!insideOther) this.candidates.push(v);
      }
    }

    // 2. Build inter-candidate edges — the expensive O(m²) part, done ONCE
    const m = this.candidates.length;
    this.staticAdj = Array.from({ length: m }, () => []);
    for (let i = 0; i < m; i++) {
      for (let j = i + 1; j < m; j++) {
        if (isSegmentClear(this.candidates[i], this.candidates[j], this.rockyRegions)) {
          const d = distance(this.candidates[i], this.candidates[j]);
          this.staticAdj[i].push({ to: j, dist: d }); // stored as candidate index
          this.staticAdj[j].push({ to: i, dist: d });
        }
      }
    }
  }

  /** Find avoidance waypoints from start to end. */
  computeWaypoints(start, end) {
    if (this.rockyRegions.length === 0) return [];
    if (isSegmentClear(start, end, this.rockyRegions)) return [];

    const candidates = this.candidates;
    const m = candidates.length;
    if (m === 0) return [];

    // Bounded cache: round coords so nearby army dispatches share results
    const key = `${Math.round(start.x)},${Math.round(start.y)}->${Math.round(end.x)},${Math.round(end.y)}`;
    if (this._cache.has(key)) return this._cache.get(key);

    // Per-query: which candidates are visible from start / end?
    // O(m * segments) — much cheaper than O(m²) since m >> segments
    const startEdges = []; // { ci: candidate-index, dist }
    const endEdgeDist = new Float64Array(m).fill(-1); // -1 = not visible

    for (let j = 0; j < m; j++) {
      if (isSegmentClear(start, candidates[j], this.rockyRegions)) {
        startEdges.push({ ci: j, dist: distance(start, candidates[j]) });
      }
      if (isSegmentClear(end, candidates[j], this.rockyRegions)) {
        endEdgeDist[j] = distance(end, candidates[j]);
      }
    }

    // Node layout: 0=start, 1=end, 2+ci=candidate[ci]
    const n = m + 2;
    const dists = new Float64Array(n).fill(Infinity);
    const prev  = new Int32Array(n).fill(-1);
    dists[0] = 0;

    const heap = new MinHeap();
    heap.push(0, 0); // dist=0, node=start(0)

    while (!heap.isEmpty()) {
      const { dist, node: u } = heap.pop();
      if (dist > dists[u]) continue; // stale heap entry
      if (u === 1) break;            // reached end — done

      if (u === 0) {
        // Start node: edges to visible candidates
        for (const { ci, dist: d } of startEdges) {
          const v = ci + 2;
          const nd = d; // dists[0] = 0
          if (nd < dists[v]) {
            dists[v] = nd;
            prev[v] = 0;
            heap.push(nd, v);
          }
        }
      } else {
        // Candidate node: edges to other candidates + edge to end (if visible)
        const ci = u - 2;

        for (const edge of this.staticAdj[ci]) {
          const v = edge.to + 2;
          const nd = dists[u] + edge.dist;
          if (nd < dists[v]) {
            dists[v] = nd;
            prev[v] = u;
            heap.push(nd, v);
          }
        }

        // Edge to end
        const de = endEdgeDist[ci];
        if (de >= 0) {
          const nd = dists[u] + de;
          if (nd < dists[1]) {
            dists[1] = nd;
            prev[1] = u;
            heap.push(nd, 1);
          }
        }
      }
    }

    let result = [];
    if (dists[1] !== Infinity) {
      const path = [];
      let cur = 1;
      while (cur !== 0 && cur !== -1) { path.push(cur); cur = prev[cur]; }
      path.reverse();
      result = path
        .filter(idx => idx !== 0 && idx !== 1)
        .map(idx => ({ x: candidates[idx - 2].x, y: candidates[idx - 2].y }));
    }

    // Bounded LRU-style cache (evict oldest on overflow)
    if (this._cache.size >= CACHE_MAX) {
      this._cache.delete(this._cache.keys().next().value);
    }
    this._cache.set(key, result);
    return result;
  }
}

// ─── Collect rocky regions ────────────────────────────────────────────────────

function getRockyRegions(gameState) {
  const rocky = [];
  for (const region of gameState.regions.values()) {
    if (region.type === 'ROCKY') rocky.push(region);
  }
  return rocky;
}

// ─── Legacy one-shot API (for standalone use / unit tests) ────────────────────

function computeWaypoints(start, end, rockyRegions) {
  const graph = new VisibilityGraph(rockyRegions);
  return graph.computeWaypoints(start, end);
}

module.exports = { VisibilityGraph, computeWaypoints, getRockyRegions, isSegmentClear, expandPolygon };

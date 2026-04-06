/**
 * BattleTab v2 — Math Utilities
 * Geometry helpers for distance, intersection, and point-in-polygon.
 */

function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(vector) {
  const len = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: vector.x / len, y: vector.y / len };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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

function segmentIntersectsPolygon(p1, p2, vertices) {
  if (pointInPolygon(p1, vertices) || pointInPolygon(p2, vertices)) return true;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    if (segmentsIntersect(p1, p2, vertices[i], vertices[j])) return true;
  }
  return false;
}

function segmentsIntersect(a1, a2, b1, b2) {
  const d1 = cross(b1, b2, a1);
  const d2 = cross(b1, b2, a2);
  const d3 = cross(a1, a2, b1);
  const d4 = cross(a1, a2, b2);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

module.exports = { distance, normalize, lerp, pointInPolygon, segmentIntersectsPolygon };

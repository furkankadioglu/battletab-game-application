/**
 * BattleTab v2 — Visibility System
 * BFS fog-of-war calculation from owned regions.
 */

const { gameConstants } = require('../../../shared');

function calculateVisibility(gameState, playerId) {
  const visible = new Set();
  const queue = [];

  // Start BFS from all owned regions
  for (const region of gameState.regions.values()) {
    if (region.ownerId === playerId) {
      visible.add(region.id);
      queue.push({ id: region.id, depth: 0 });
    }
  }

  // BFS to FOG_DEPTH
  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (depth >= gameConstants.FOG_DEPTH) continue;

    const region = gameState.getRegion(id);
    if (!region) continue;

    // Regular neighbors
    for (const neighborId of region.neighbors) {
      if (!visible.has(neighborId)) {
        visible.add(neighborId);
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    }

    // Gate tunnel extension
    if (region.gate) {
      const pairedId = region.gate.pairedRegionId;
      if (!visible.has(pairedId)) {
        visible.add(pairedId);
        queue.push({ id: pairedId, depth: depth + 1 });
      }
    }
  }

  return visible;
}

function isRegionVisible(gameState, regionId, playerId) {
  const visible = calculateVisibility(gameState, playerId);
  return visible.has(regionId);
}

function canAttack(gameState, sourceRegionId, targetRegionId, playerId) {
  // Check if target is within ATTACK_RANGE hops from source
  const source = gameState.getRegion(sourceRegionId);
  if (!source || source.ownerId !== playerId) return false;

  // BFS from source to ATTACK_RANGE
  const visited = new Set([sourceRegionId]);
  const queue = [{ id: sourceRegionId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (depth >= gameConstants.ATTACK_RANGE) continue;

    const region = gameState.getRegion(id);
    if (!region) continue;

    for (const neighborId of region.neighbors) {
      if (neighborId === targetRegionId) return true;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    }

    // Gate virtual neighbor
    if (region.gate) {
      const pairedId = region.gate.pairedRegionId;
      if (pairedId === targetRegionId) return true;
      if (!visited.has(pairedId)) {
        visited.add(pairedId);
        queue.push({ id: pairedId, depth: depth + 1 });
      }
    }
  }

  return false;
}

module.exports = { calculateVisibility, isRegionVisible, canAttack };

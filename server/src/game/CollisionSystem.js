/**
 * BattleTab v2 — Collision System
 * Handles army-vs-army collision in the field.
 */

const { gameConstants } = require('../../../shared');

function processTick(gameState) {
  const armies = gameState.getAllArmies();
  const destroyed = new Set();

  for (let i = 0; i < armies.length; i++) {
    if (destroyed.has(armies[i].id)) continue;

    for (let j = i + 1; j < armies.length; j++) {
      if (destroyed.has(armies[j].id)) continue;

      const a = armies[i];
      const b = armies[j];

      // Same owner — no collision
      if (a.ownerId === b.ownerId) continue;

      // Distance check
      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= gameConstants.ARMY_COLLISION_RADIUS) {
        // Collision — larger army wins
        if (a.count > b.count) {
          a.count -= b.count;
          destroyed.add(b.id);
        } else if (b.count > a.count) {
          b.count -= a.count;
          destroyed.add(a.id);
        } else {
          // Equal — both destroyed
          destroyed.add(a.id);
          destroyed.add(b.id);
        }
      }
    }
  }

  // Remove destroyed armies
  for (const id of destroyed) {
    gameState.removeArmy(id);
  }

  return destroyed;
}

module.exports = { processTick };

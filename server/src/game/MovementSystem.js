/**
 * BattleTab v2 — Movement System
 * Moves armies toward their targets each tick.
 */

const { gameConstants } = require('../../../shared');

function processTick(gameState, deltaSec) {
  const now = Date.now();
  const toRemove = [];

  for (const army of gameState.armies.values()) {
    // Frozen check
    if (army.isFrozen(now)) continue;

    // Stuck timeout
    if (army.isStuck()) {
      toRemove.push(army.id);
      continue;
    }

    // Attrition: lose 1 soldier/sec
    army.attritionAccumulator += gameConstants.ARMY_ATTRITION_RATE * deltaSec;
    if (army.attritionAccumulator >= 1.0) {
      const loss = Math.floor(army.attritionAccumulator);
      army.attritionAccumulator -= loss;
      army.count -= loss;
      if (army.count <= 0) {
        toRemove.push(army.id);
        continue;
      }
    }

    // Get move target (waypoint or final destination)
    const target = army.getMoveTarget();
    if (!target) {
      // Army has arrived — will be handled by ConquestSystem
      continue;
    }

    // Calculate speed with terrain modifiers
    let speed = army.speed;

    // Check what region the army is in for speed modifier
    for (const region of gameState.regions.values()) {
      if (region.type === 'SNOW' || region.type === 'SPEED') {
        // Simple check: if army is near region center
        const dx = army.position.x - region.center.x;
        const dy = army.position.y - region.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) { // Approximate region influence radius
          speed *= region.getSpeedMultiplier();
          break;
        }
      }
    }

    // Speed boost from player ability
    const player = gameState.getPlayer(army.ownerId);
    if (player && player.speedBoostUntil > now) {
      speed *= gameConstants.SPEED_BOOST_MULTIPLIER;
    }

    // Move toward target
    const dx = target.x - army.position.x;
    const dy = target.y - army.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < gameConstants.WAYPOINT_ARRIVAL_THRESHOLD) {
      // Arrived at waypoint
      army.position.x = target.x;
      army.position.y = target.y;
      army.advanceWaypoint();
    } else {
      const moveAmount = speed * deltaSec;
      const ratio = Math.min(moveAmount / dist, 1);
      army.position.x += dx * ratio;
      army.position.y += dy * ratio;
    }
  }

  // Remove dead/stuck armies
  for (const id of toRemove) {
    gameState.removeArmy(id);
  }
}

module.exports = { processTick };

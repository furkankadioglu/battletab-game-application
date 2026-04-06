/**
 * BattleTab v2 — Conquest System
 * Handles army arrival at target regions.
 */

const { gameConstants } = require('../../../shared');

const ABILITY_TYPES = ['missile', 'nuclear', 'barracks', 'speedBoost', 'freeze'];

function processTick(gameState) {
  const arrivedArmies = [];

  for (const army of gameState.armies.values()) {
    // Check if army has arrived (no more waypoints and close to final target)
    if (army.waypointIndex >= army.waypoints.length) {
      const target = gameState.getRegion(army.targetRegionId);
      if (!target) continue;

      const dx = army.position.x - target.center.x;
      const dy = army.position.y - target.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) { // Close enough to region center
        arrivedArmies.push(army);
      }
    }
  }

  const events = [];

  for (const army of arrivedArmies) {
    const region = gameState.getRegion(army.targetRegionId);
    if (!region) {
      gameState.removeArmy(army.id);
      continue;
    }

    if (region.ownerId === army.ownerId) {
      // Friendly — reinforce
      if (Object.keys(region.siegeForces).length > 0) {
        // Fighting siege forces
        const totalSiege = Object.values(region.siegeForces).reduce((a, b) => a + b, 0);
        if (army.count >= totalSiege) {
          // Reinforcements win — clear siege, add remainder
          const remainder = army.count - totalSiege;
          region.siegeForces = {};
          region.siegeEntryPoints = {};
          region.hp += remainder;
        } else {
          // Distribute damage among siege forces
          const ratio = army.count / totalSiege;
          for (const attackerId of Object.keys(region.siegeForces)) {
            region.siegeForces[attackerId] -= Math.floor(region.siegeForces[attackerId] * ratio);
            if (region.siegeForces[attackerId] <= 0) {
              delete region.siegeForces[attackerId];
              delete region.siegeEntryPoints[attackerId];
            }
          }
        }
      } else {
        // Simple reinforce
        region.hp += army.count;
        if (region.hp > gameConstants.MAX_REGION_HP) {
          region.hp = gameConstants.MAX_REGION_HP;
        }
      }
    } else if (!region.ownerId || region.hp <= 0) {
      // Unowned/empty — instant capture
      region.ownerId = army.ownerId;
      region.hp = army.count + region.defenseBonus;
      region.siegeForces = {};
      region.siegeEntryPoints = {};

      // Grant ability charge on first neutral capture
      if (!region.abilityGranted) {
        region.abilityGranted = true;
        const player = gameState.getPlayer(army.ownerId);
        if (player) {
          const ability = ABILITY_TYPES[Math.floor(Math.random() * ABILITY_TYPES.length)];
          player.charges[ability]++;
          events.push({ type: 'ability_granted', playerId: army.ownerId, ability, regionId: region.id });
        }
      }

      events.push({
        type: 'region_captured',
        regionId: region.id,
        newOwnerId: army.ownerId,
        previousOwnerId: null,
      });
    } else {
      // Enemy owned — start/join siege
      if (Object.keys(region.siegeForces).length < gameConstants.SIEGE_MAX_ARMIES_PER_REGION) {
        region.siegeForces[army.ownerId] = (region.siegeForces[army.ownerId] || 0) + army.count;
        region.siegeEntryPoints[army.ownerId] = { x: army.position.x, y: army.position.y };
        events.push({ type: 'siege_started', regionId: region.id, attackerId: army.ownerId });
      }
    }

    gameState.removeArmy(army.id);
  }

  return events;
}

module.exports = { processTick };

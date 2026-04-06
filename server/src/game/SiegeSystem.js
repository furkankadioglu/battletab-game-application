/**
 * BattleTab v2 — Siege System
 * Tug-of-war combat when armies attack defended regions.
 */

const { gameConstants } = require('../../../shared');

function processTick(gameState, deltaSec) {
  const events = [];

  for (const region of gameState.regions.values()) {
    const attackerIds = Object.keys(region.siegeForces);
    if (attackerIds.length === 0) continue;

    // Calculate defense bonus
    let defenseMultiplier = gameConstants.SIEGE_DEFENSE_BONUS;
    if (region.building === 'wall') {
      defenseMultiplier += gameConstants.SIEGE_WALL_BONUS;
    }

    const defenderForce = region.hp * defenseMultiplier;
    const attackerForces = {};
    let totalAttackerForce = 0;

    for (const attackerId of attackerIds) {
      const force = region.siegeForces[attackerId];
      attackerForces[attackerId] = force;
      totalAttackerForce += force;
    }

    const totalForce = defenderForce + totalAttackerForce;
    if (totalForce <= 0) continue;

    // Damage to defender from all attackers
    const defenderDamage = totalAttackerForce * gameConstants.SIEGE_DAMAGE_PERCENT * deltaSec;
    region.hp -= defenderDamage;

    // Damage to each attacker from defender
    for (const attackerId of attackerIds) {
      const attackerDamage = defenderForce * gameConstants.SIEGE_DAMAGE_PERCENT * deltaSec *
        (attackerForces[attackerId] / totalAttackerForce);
      region.siegeForces[attackerId] -= attackerDamage;

      // Remove depleted attackers
      if (region.siegeForces[attackerId] <= 0) {
        delete region.siegeForces[attackerId];
        delete region.siegeEntryPoints[attackerId];
        events.push({ type: 'siege_ended', regionId: region.id, reason: 'repelled', playerId: attackerId });
      }
    }

    // Defender falls
    if (region.hp <= 0) {
      const remainingAttackers = Object.entries(region.siegeForces);
      if (remainingAttackers.length > 0) {
        // Strongest attacker captures
        remainingAttackers.sort((a, b) => b[1] - a[1]);
        const [winnerId, winnerForce] = remainingAttackers[0];
        const previousOwnerId = region.ownerId;

        region.ownerId = winnerId;
        region.hp = Math.max(1, Math.floor(winnerForce)) + region.defenseBonus;
        region.siegeForces = {};
        region.siegeEntryPoints = {};

        // Grant ability charge
        if (!region.abilityGranted) {
          region.abilityGranted = true;
          const player = gameState.getPlayer(winnerId);
          if (player) {
            const abilities = ['missile', 'nuclear', 'barracks', 'speedBoost', 'freeze'];
            const ability = abilities[Math.floor(Math.random() * abilities.length)];
            player.charges[ability]++;
          }
        }

        events.push({
          type: 'region_captured',
          regionId: region.id,
          newOwnerId: winnerId,
          previousOwnerId,
        });
        events.push({ type: 'siege_ended', regionId: region.id, reason: 'captured', playerId: winnerId });
      } else {
        // All attackers gone and defender at 0 — defender survives with 1 HP
        region.hp = 1;
      }
    }
  }

  return events;
}

module.exports = { processTick };

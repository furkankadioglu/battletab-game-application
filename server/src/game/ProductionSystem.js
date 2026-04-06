/**
 * BattleTab v2 — Production System
 * Auto-produces soldiers in owned regions each tick.
 */

const { gameConstants } = require('../../../shared');

function processTick(gameState, deltaSec) {
  for (const region of gameState.regions.values()) {
    if (region.type === 'ROCKY') continue;
    if (region.gate) continue;

    const rate = region.getProductionRate();
    if (rate <= 0) continue;

    // Interest mechanic: +1% of current HP per second
    const interest = region.ownerId ? region.hp * gameConstants.INTEREST_RATE : 0;
    const totalRate = rate + interest;

    // Calculate max HP (city center bonus)
    let maxHp = gameConstants.MAX_REGION_HP;
    if (region.ownerId) {
      const player = gameState.getPlayer(region.ownerId);
      if (player) {
        // Count city centers
        let cityCenterCount = 0;
        for (const r of gameState.regions.values()) {
          if (r.ownerId === region.ownerId && r.building === 'city_center') cityCenterCount++;
        }
        for (let i = 0; i < cityCenterCount; i++) {
          maxHp *= (1 + gameConstants.CITY_CENTER_HP_BONUS);
        }

        // Barracks production bonus
        let barracksCount = 0;
        for (const r of gameState.regions.values()) {
          if (r.ownerId === region.ownerId && r.building === 'barracks') barracksCount++;
        }
        if (barracksCount > 0) {
          // Applied via accumulator adjustment
        }
      }
    }

    // HP decay if over cap
    if (region.hp > maxHp) {
      region.hp -= region.hp * gameConstants.HP_DECAY_RATE * deltaSec;
      if (region.hp < maxHp) region.hp = maxHp;
      continue;
    }

    // Accumulate production
    region.productionAccumulator += totalRate * deltaSec;
    if (region.productionAccumulator >= 1.0) {
      const soldiers = Math.floor(region.productionAccumulator);
      region.productionAccumulator -= soldiers;
      region.hp = Math.min(region.hp + soldiers, maxHp);
    }
  }
}

module.exports = { processTick };

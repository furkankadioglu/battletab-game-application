/**
 * BattleTab v2 — Region Entity
 * Represents a map region with HP, type, owner, and production.
 */

const { gameConstants } = require('../../../../shared');

class Region {
  constructor({ id, type, hp, center, polygon, vertices, neighbors, resourceType, defenseBonus, ownerId }) {
    this.id = id;
    this.type = type || 'NORMAL';
    this.hp = hp || 0;
    this.maxHp = gameConstants.MAX_REGION_HP;
    this.ownerId = ownerId || null;
    this.center = center || { x: 0, y: 0 };
    this.polygon = polygon || vertices || [];
    this.neighbors = neighbors || [];
    this.resourceType = resourceType || null;
    this.resourceRate = 0;
    this.defenseBonus = defenseBonus || 0;
    this.building = null;
    this.isNuclearized = false;
    this.nuclearUntil = 0;
    this.gate = null; // { pairedRegionId, color }
    this.abilityGranted = false;
    this.siegeForces = {};       // { attackerId: count }
    this.siegeEntryPoints = {};  // { attackerId: { x, y } }
    this.productionAccumulator = 0;

    // Dirty tracking for delta updates
    this._lastHp = hp || 0;
    this._lastOwnerId = null;
    this._lastNuclearized = false;
    this._lastBuilding = null;
    this._lastSiegeTotal = 0;
  }

  getProductionRate() {
    if (this.isNuclearized) return 0;
    if (this.gate) return 0;

    const rates = {
      NORMAL: gameConstants.BASE_PRODUCTION_RATE,
      TOWER: gameConstants.TOWER_PRODUCTION_RATE,
      SPAWN: gameConstants.SPAWN_PRODUCTION_RATE,
      MOUNTAIN: gameConstants.MOUNTAIN_PRODUCTION_RATE,
      SNOW: gameConstants.SNOW_PRODUCTION_RATE,
      SPEED: gameConstants.SPEED_PRODUCTION_RATE,
      ROCKY: gameConstants.ROCKY_PRODUCTION_RATE,
    };

    if (!this.ownerId) return gameConstants.NEUTRAL_PRODUCTION_RATE;
    return rates[this.type] || gameConstants.BASE_PRODUCTION_RATE;
  }

  getSpeedMultiplier() {
    const mults = {
      SNOW: gameConstants.SNOW_SPEED_MULTIPLIER,
      SPEED: gameConstants.SPEED_REGION_MULTIPLIER,
    };
    return mults[this.type] || gameConstants.NORMAL_SPEED_MULTIPLIER;
  }

  isDirty() {
    const siegeTotal = Object.values(this.siegeForces).reduce((a, b) => a + b, 0);
    const dirty = (
      Math.floor(this.hp) !== Math.floor(this._lastHp) ||
      this.ownerId !== this._lastOwnerId ||
      this.isNuclearized !== this._lastNuclearized ||
      this.building !== this._lastBuilding ||
      siegeTotal !== this._lastSiegeTotal
    );
    return dirty;
  }

  markClean() {
    this._lastHp = this.hp;
    this._lastOwnerId = this.ownerId;
    this._lastNuclearized = this.isNuclearized;
    this._lastBuilding = this.building;
    this._lastSiegeTotal = Object.values(this.siegeForces).reduce((a, b) => a + b, 0);
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      hp: Math.floor(this.hp),
      ownerId: this.ownerId,
      center: this.center,
      polygon: this.polygon,
      neighbors: this.neighbors,
      resourceType: this.resourceType,
      resourceRate: this.resourceRate,
      defenseBonus: this.defenseBonus,
      building: this.building,
      isNuclearized: this.isNuclearized,
      gate: this.gate,
      abilityGranted: this.abilityGranted,
      siegeForces: this.siegeForces,
      siegeEntryPoints: this.siegeEntryPoints,
    };
  }

  serializeDelta() {
    return {
      id: this.id,
      hp: Math.floor(this.hp),
      ownerId: this.ownerId,
      nuclearized: this.isNuclearized,
      abilityGranted: this.abilityGranted,
      building: this.building,
      siegeForces: this.siegeForces,
      siegeEntryPoints: this.siegeEntryPoints,
    };
  }
}

module.exports = Region;

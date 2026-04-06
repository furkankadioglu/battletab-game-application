/**
 * BattleTab v2 — Army Entity
 * Represents a group of soldiers moving between regions.
 */

const { gameConstants } = require('../../../../shared');

class Army {
  constructor({ id, ownerId, count, sourceRegionId, targetRegionId, position, speed, waypoints, finalTargetId }) {
    this.id = id;
    this.ownerId = ownerId;
    this.count = count;
    this.sourceRegionId = sourceRegionId;
    this.targetRegionId = targetRegionId;
    this.finalTargetId = finalTargetId || targetRegionId;
    this.position = { x: position?.x || 0, y: position?.y || 0 };
    this.speed = speed || gameConstants.ARMY_SPEED;
    this.waypoints = waypoints || [];
    this.waypointIndex = 0;
    this.createdAt = Date.now();
    this.frozenUntil = 0;
    this.attritionAccumulator = 0;
    this.isGateRouted = false;
    this.gateCooldownUntil = 0;
  }

  getMoveTarget() {
    if (this.waypointIndex < this.waypoints.length) {
      return this.waypoints[this.waypointIndex];
    }
    return null; // Has arrived or no waypoints
  }

  advanceWaypoint() {
    this.waypointIndex++;
  }

  isFrozen(now) {
    return this.frozenUntil > 0 && now < this.frozenUntil;
  }

  isStuck() {
    return (Date.now() - this.createdAt) > gameConstants.ARMY_STUCK_TIMEOUT;
  }

  serialize() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      count: this.count,
      sourceRegionId: this.sourceRegionId,
      targetRegionId: this.targetRegionId,
      finalTargetId: this.finalTargetId,
      position: { ...this.position },
      speed: this.speed,
      waypoints: this.waypoints,
      waypointIndex: this.waypointIndex,
    };
  }
}

module.exports = Army;

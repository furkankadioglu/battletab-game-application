/**
 * BattleTab v2 — Bot AI
 * Decision-making for bot players: attack, reinforce, abilities.
 */

const { gameConstants } = require('../../../shared');
const { distance } = require('../utils/math');

class BotAI {
  constructor(playerId, gameRoom) {
    this.playerId = playerId;
    this.room = gameRoom;
    this.interval = null;
  }

  start() {
    const delay = gameConstants.BOT_DECISION_INTERVAL || 1500;
    this.interval = setInterval(() => {
      try { this.makeDecision(); } catch (e) { /* bot errors are non-fatal */ }
    }, delay + Math.random() * 500);
  }

  stop() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }

  makeDecision() {
    const gs = this.room.gameState;
    if (gs.phase !== 'playing') return;

    const player = gs.getPlayer(this.playerId);
    if (!player || player.isEliminated) { this.stop(); return; }

    const myRegions = gs.getPlayerRegions(this.playerId);
    if (myRegions.length === 0) return;

    // Use abilities first
    this._useAbilities(player, gs, myRegions);

    // 70% reinforce, 30% attack
    if (Math.random() < 0.7) {
      this._reinforce(gs, myRegions);
    } else {
      this._attack(gs, myRegions);
    }
  }

  _attack(gs, myRegions) {
    // Find strong regions to attack from
    const sources = myRegions.filter(r => r.hp > 8);
    if (sources.length === 0) return;

    // Find best target
    let bestTarget = null, bestScore = -Infinity;

    for (const source of sources) {
      for (const neighborId of source.neighbors) {
        const neighbor = gs.getRegion(neighborId);
        if (!neighbor || neighbor.ownerId === this.playerId) continue;
        if (neighbor.type === 'ROCKY' || neighbor.gate) continue;

        const effective = this._effectiveSoldiers(source, neighbor, Math.floor(source.hp * 0.5));
        if (effective <= 0) continue;

        // Score: prefer weak targets, penalize distance
        let score = effective - neighbor.hp;
        if (neighbor.type === 'TOWER') score += 10; // Tower bonus
        if (effective > neighbor.hp * 1.3) score += 20; // Safe capture bonus

        if (score > bestScore) {
          bestScore = score;
          bestTarget = { sourceId: source.id, targetId: neighbor.id };
        }
      }
    }

    if (bestTarget && bestScore > 0) {
      this.room.onSendSoldiers(this.playerId, [bestTarget.sourceId], bestTarget.targetId);
    }
  }

  _reinforce(gs, myRegions) {
    // Find weak frontline regions (adjacent to enemy, low HP)
    const frontline = myRegions.filter(r =>
      r.hp < 15 && r.neighbors.some(nId => {
        const n = gs.getRegion(nId);
        return n && n.ownerId && n.ownerId !== this.playerId;
      })
    );
    if (frontline.length === 0) return;

    // Find strong backend regions
    const backend = myRegions.filter(r =>
      r.hp > 12 && !r.neighbors.some(nId => {
        const n = gs.getRegion(nId);
        return n && n.ownerId && n.ownerId !== this.playerId;
      })
    );
    if (backend.length === 0) return;

    // Send from strongest backend to weakest frontline
    const target = frontline.reduce((a, b) => a.hp < b.hp ? a : b);
    const source = backend.reduce((a, b) => a.hp > b.hp ? a : b);

    // Check adjacency
    if (source.neighbors.includes(target.id)) {
      this.room.onSendSoldiers(this.playerId, [source.id], target.id);
    }
  }

  _useAbilities(player, gs, myRegions) {
    const now = Date.now();

    // Freeze: 3+ enemy armies in flight
    if (player.charges.freeze > 0 && (!player.cooldowns.freeze || player.cooldowns.freeze <= now)) {
      const enemyArmies = gs.getAllArmies().filter(a => a.ownerId !== this.playerId);
      if (enemyArmies.length >= 3) {
        this.room.onUseFreeze(this.playerId);
        return;
      }
    }

    // Speed boost: 2+ own armies in flight
    if (player.charges.speedBoost > 0 && (!player.cooldowns.speedBoost || player.cooldowns.speedBoost <= now)) {
      const myArmies = gs.getPlayerArmies(this.playerId);
      if (myArmies.length >= 2) {
        this.room.onUseSpeedBoost(this.playerId);
        return;
      }
    }

    // Missile: high-HP enemy border region
    if (player.charges.missile > 0 && (!player.cooldowns.missile || player.cooldowns.missile <= now)) {
      const targets = [];
      for (const r of myRegions) {
        for (const nId of r.neighbors) {
          const n = gs.getRegion(nId);
          if (n && n.ownerId && n.ownerId !== this.playerId && n.hp > 12) {
            targets.push(n);
          }
        }
      }
      if (targets.length > 0) {
        targets.sort((a, b) => b.hp - a.hp);
        this.room.onUseMissile(this.playerId, targets[0].id);
        return;
      }
    }

    // Nuclear: TOWER first, else high HP
    if (player.charges.nuclear > 0 && (!player.cooldowns.nuclear || player.cooldowns.nuclear <= now)) {
      const targets = [];
      for (const r of gs.regions.values()) {
        if (r.ownerId && r.ownerId !== this.playerId && !r.isNuclearized) {
          targets.push(r);
        }
      }
      const tower = targets.find(r => r.type === 'TOWER');
      if (tower) { this.room.onUseNuclear(this.playerId, tower.id); return; }
      if (targets.length > 0) {
        targets.sort((a, b) => b.hp - a.hp);
        this.room.onUseNuclear(this.playerId, targets[0].id);
        return;
      }
    }

    // Barracks: safe interior regions
    if (player.charges.barracks > 0 && (!player.cooldowns.barracks || player.cooldowns.barracks <= now)) {
      const safe = myRegions.filter(r =>
        r.type !== 'TOWER' && r.type !== 'ROCKY' && !r.isNuclearized &&
        r.hp > 5 && r.neighbors.every(nId => {
          const n = gs.getRegion(nId);
          return !n || n.ownerId === this.playerId;
        })
      );
      if (safe.length > 0) {
        this.room.onUseBarracks(this.playerId, safe[0].id);
      }
    }
  }

  _effectiveSoldiers(source, target, count) {
    const dist = distance(source.center, target.center);
    const attritionLoss = Math.floor(dist / gameConstants.ARMY_SPEED);
    return Math.max(0, count - attritionLoss);
  }
}

module.exports = BotAI;

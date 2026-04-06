/**
 * BattleTab v2 — Missile (Bomb) Ability
 * 50% HP damage to target enemy region.
 */

const { gameConstants } = require('../../../../shared');

function apply(gameState, playerId, targetRegionId) {
  const player = gameState.getPlayer(playerId);
  if (!player || player.charges.missile <= 0) return null;
  if (player.cooldowns.missile > Date.now()) return null;

  const region = gameState.getRegion(targetRegionId);
  if (!region || region.ownerId === playerId || region.type === 'ROCKY') return null;

  // Iron dome check: any iron_dome within 3 hops blocks missile
  const visited = new Set([targetRegionId]);
  const queue = [{ id: targetRegionId, depth: 0 }];
  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (depth > 3) continue;
    const r = gameState.getRegion(id);
    if (r && r.building === 'iron_dome' && r.ownerId === region.ownerId) {
      return null; // Blocked by iron dome
    }
    if (depth < 3 && r) {
      for (const nId of r.neighbors) {
        if (!visited.has(nId)) { visited.add(nId); queue.push({ id: nId, depth: depth + 1 }); }
      }
    }
  }

  player.charges.missile--;
  player.cooldowns.missile = Date.now() + gameConstants.MISSILE_COOLDOWN;

  const damage = Math.floor(region.hp * gameConstants.MISSILE_DAMAGE_RATIO);
  region.hp = Math.max(0, region.hp - damage);

  return { playerId, targetRegionId, damage, position: region.center };
}

module.exports = { apply };

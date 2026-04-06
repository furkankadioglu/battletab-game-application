/**
 * BattleTab v2 — Barracks Ability
 * Upgrades own region to TOWER type (1.5x production).
 */

const { gameConstants } = require('../../../../shared');

function apply(gameState, playerId, targetRegionId) {
  const player = gameState.getPlayer(playerId);
  if (!player || player.charges.barracks <= 0) return null;
  if (player.cooldowns.barracks > Date.now()) return null;

  const region = gameState.getRegion(targetRegionId);
  if (!region || region.ownerId !== playerId) return null;
  if (region.type === 'TOWER' || region.type === 'ROCKY') return null;
  if (region.isNuclearized) return null;

  player.charges.barracks--;
  player.cooldowns.barracks = Date.now() + gameConstants.BARRACKS_COOLDOWN;

  region.type = 'TOWER';

  return { playerId, targetRegionId, position: region.center };
}

module.exports = { apply };

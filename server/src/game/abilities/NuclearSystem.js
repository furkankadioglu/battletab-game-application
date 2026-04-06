/**
 * BattleTab v2 — Nuclear Ability
 * Disables production on target enemy region.
 */

const { gameConstants } = require('../../../../shared');

function apply(gameState, playerId, targetRegionId) {
  const player = gameState.getPlayer(playerId);
  if (!player || player.charges.nuclear <= 0) return null;
  if (player.cooldowns.nuclear > Date.now()) return null;

  const region = gameState.getRegion(targetRegionId);
  if (!region || region.ownerId === playerId || region.type === 'ROCKY') return null;

  player.charges.nuclear--;
  player.cooldowns.nuclear = Date.now() + gameConstants.NUCLEAR_COOLDOWN;

  region.isNuclearized = true;
  region.nuclearUntil = Date.now() + gameConstants.NUCLEAR_DURATION;

  return { playerId, targetRegionId, position: region.center };
}

module.exports = { apply };

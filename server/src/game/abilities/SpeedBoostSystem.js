/**
 * BattleTab v2 — Speed Boost Ability
 * 25% speed increase for all player's armies for 10 seconds.
 */

const { gameConstants } = require('../../../../shared');

function apply(gameState, playerId) {
  const player = gameState.getPlayer(playerId);
  if (!player || player.charges.speedBoost <= 0) return null;
  if (player.cooldowns.speedBoost > Date.now()) return null;

  player.charges.speedBoost--;
  player.cooldowns.speedBoost = Date.now() + gameConstants.SPEED_BOOST_COOLDOWN;
  player.speedBoostUntil = Date.now() + gameConstants.SPEED_BOOST_DURATION;

  return { playerId, duration: gameConstants.SPEED_BOOST_DURATION };
}

module.exports = { apply };

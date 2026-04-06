/**
 * BattleTab v2 — Freeze Ability
 * Freezes ALL enemy armies mid-air for 1.5 seconds.
 */

const { gameConstants } = require('../../../../shared');

function apply(gameState, playerId) {
  const player = gameState.getPlayer(playerId);
  if (!player || player.charges.freeze <= 0) return null;
  if (player.cooldowns.freeze > Date.now()) return null;

  player.charges.freeze--;
  player.cooldowns.freeze = Date.now() + gameConstants.FREEZE_COOLDOWN;

  const now = Date.now();
  for (const army of gameState.armies.values()) {
    if (army.ownerId !== playerId) {
      army.frozenUntil = now + gameConstants.FREEZE_ARMY_DURATION;
    }
  }

  return { playerId, duration: gameConstants.FREEZE_ARMY_DURATION };
}

module.exports = { apply };

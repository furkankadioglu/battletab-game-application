/**
 * BattleTab v2 — Win Condition
 * Checks for player elimination and game victory.
 */

function checkWinCondition(gameState) {
  const events = [];

  // Update region counts
  for (const player of gameState.players.values()) {
    player.regionCount = gameState.getPlayerRegionCount(player.id);
  }

  // Check eliminations
  for (const player of gameState.players.values()) {
    if (player.isEliminated) continue;
    if (player.regionCount === 0) {
      player.isEliminated = true;

      // Find who eliminated them (last capturer)
      let eliminatedBy = null;
      const activePlayers = gameState.getActivePlayers();
      if (activePlayers.length > 0) {
        eliminatedBy = activePlayers[0].id;
      }

      events.push({
        type: 'player_eliminated',
        playerId: player.id,
        eliminatedBy,
      });
    }
  }

  // Check victory
  const activePlayers = gameState.getActivePlayers();
  if (activePlayers.length <= 1 && gameState.players.size > 1) {
    const winner = activePlayers[0] || null;
    events.push({
      type: 'game_over',
      winnerId: winner?.id || null,
      winnerUsername: winner?.username || null,
    });
    gameState.phase = 'finished';
  }

  return events;
}

module.exports = { checkWinCondition };

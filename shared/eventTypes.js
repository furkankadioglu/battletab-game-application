/**
 * BattleTab v2 — Socket.IO Event Types
 * All event names used between client and server.
 */

module.exports = {
  // ─── Client → Server: Lobby ────────────────────────────
  JOIN_LOBBY: 'join_lobby',
  LEAVE_LOBBY: 'leave_lobby',
  PLAYER_READY: 'player_ready',

  // ─── Client → Server: Game Actions ─────────────────────
  SEND_SOLDIERS: 'send_soldiers',
  BUILD_BUILDING: 'build_building',
  RECALL_ARMY: 'recall_army',
  SELECT_SPAWN: 'select_spawn',

  // ─── Client → Server: Abilities ────────────────────────
  USE_MISSILE: 'use_missile',
  USE_NUCLEAR: 'use_nuclear',
  USE_BARRACKS: 'use_barracks',
  USE_SPEED_BOOST: 'use_speed_boost',
  USE_FREEZE: 'use_freeze',

  // ─── Client → Server: Network ──────────────────────────
  PING_CHECK: 'ping_check',

  // ─── Server → Client: Matchmaking ─────────────────────
  QUEUE_UPDATE: 'queue_update',
  MATCH_FOUND: 'match_found',
  LOBBY_UPDATE: 'lobby_update',

  // ─── Server → Client: Game Lifecycle ───────────────────
  GAME_COUNTDOWN: 'game_countdown',
  GAME_START: 'game_start',
  STATE_UPDATE: 'state_update',
  GAME_OVER: 'game_over',

  // ─── Server → Client: Spawn Phase ─────────────────────
  SPAWN_SELECTED: 'spawn_selected',
  SPAWN_PHASE_END: 'spawn_phase_end',
  REGIONS_REVEAL: 'regions_reveal',

  // ─── Server → Client: Army Events ─────────────────────
  ARMY_CREATED: 'army_created',
  ARMY_DESTROYED: 'army_destroyed',

  // ─── Server → Client: Combat Events ───────────────────
  REGION_CAPTURED: 'region_captured',
  PLAYER_ELIMINATED: 'player_eliminated',
  SIEGE_STARTED: 'siege_started',
  SIEGE_ENDED: 'siege_ended',

  // ─── Server → Client: Special Events ──────────────────
  GATE_TELEPORT: 'gate_teleport',

  // ─── Server → Client: Ability Applied ─────────────────
  MISSILE_APPLIED: 'missile_applied',
  NUCLEAR_APPLIED: 'nuclear_applied',
  BARRACKS_APPLIED: 'barracks_applied',
  SPEED_BOOST_APPLIED: 'speed_boost_applied',
  FREEZE_APPLIED: 'freeze_applied',
  STUN_APPLIED: 'stun_applied',
  ABILITY_GRANTED: 'ability_granted',

  // ─── Server → Client: Economy ─────────────────────────
  RANKING_UPDATE: 'ranking_update',
  DIAMOND_REWARD: 'diamond_reward',
  PROMOTION_REWARD: 'promotion_reward',

  // ─── Server → Client: Network ─────────────────────────
  PONG_CHECK: 'pong_check',

  // ─── Server → Client: Error ───────────────────────────
  ERROR: 'error',
};

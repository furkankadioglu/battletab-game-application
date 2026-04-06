/**
 * BattleTab v2 — Game Socket Handlers
 * Handles all in-game socket events with input validation.
 */

const { eventTypes } = require('../../../../shared');

function registerGameHandlers(socket, getRoomForSocket) {
  // ─── Spawn Selection ─────────────────────────────────
  socket.on(eventTypes.SELECT_SPAWN, (data) => {
    if (!data || typeof data.regionId !== 'string' || data.regionId.length > 50) return;
    const room = getRoomForSocket(socket);
    if (room) room.onSelectSpawn(socket.playerId, data.regionId);
  });

  // ─── Send Soldiers ───────────────────────────────────
  socket.on(eventTypes.SEND_SOLDIERS, (data) => {
    if (!data) return;
    if (!Array.isArray(data.sourceIds) || data.sourceIds.length === 0 || data.sourceIds.length > 12) return;
    if (typeof data.targetId !== 'string' || data.targetId.length > 50) return;
    for (const id of data.sourceIds) {
      if (typeof id !== 'string' || id.length > 50) return;
    }
    const room = getRoomForSocket(socket);
    if (room) room.onSendSoldiers(socket.playerId, data.sourceIds, data.targetId);
  });

  // ─── Build Building ──────────────────────────────────
  socket.on(eventTypes.BUILD_BUILDING, (data) => {
    if (!data || typeof data.regionId !== 'string' || typeof data.buildingId !== 'string') return;
    if (data.regionId.length > 50 || data.buildingId.length > 50) return;
    const room = getRoomForSocket(socket);
    if (room) room.onBuildBuilding(socket.playerId, data.regionId, data.buildingId);
  });

  // ─── Recall Army ─────────────────────────────────────
  socket.on(eventTypes.RECALL_ARMY, (data) => {
    if (!data || typeof data.armyId !== 'string' || data.armyId.length > 50) return;
    const room = getRoomForSocket(socket);
    if (room) room.onRecallArmy(socket.playerId, data.armyId);
  });

  // ─── Abilities ───────────────────────────────────────
  socket.on(eventTypes.USE_MISSILE, (data) => {
    if (!data || typeof data.targetRegionId !== 'string') return;
    const room = getRoomForSocket(socket);
    if (room) room.onUseMissile(socket.playerId, data.targetRegionId);
  });

  socket.on(eventTypes.USE_NUCLEAR, (data) => {
    if (!data || typeof data.targetRegionId !== 'string') return;
    const room = getRoomForSocket(socket);
    if (room) room.onUseNuclear(socket.playerId, data.targetRegionId);
  });

  socket.on(eventTypes.USE_BARRACKS, (data) => {
    if (!data || typeof data.targetRegionId !== 'string') return;
    const room = getRoomForSocket(socket);
    if (room) room.onUseBarracks(socket.playerId, data.targetRegionId);
  });

  socket.on(eventTypes.USE_SPEED_BOOST, () => {
    const room = getRoomForSocket(socket);
    if (room) room.onUseSpeedBoost(socket.playerId);
  });

  socket.on(eventTypes.USE_FREEZE, () => {
    const room = getRoomForSocket(socket);
    if (room) room.onUseFreeze(socket.playerId);
  });
}

module.exports = { registerGameHandlers };

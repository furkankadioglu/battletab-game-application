/**
 * BattleTab v2 — Matchmaking Service
 * Queue management and match creation for all game modes.
 */

const { gameConstants, eventTypes } = require('../../../shared');
const { generateId } = require('../utils/idGenerator');
const GameRoom = require('../game/GameRoom');

class MatchmakingService {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId → GameRoom
    this.queues = {
      normal: new Map(),   // socketId → { socket, username, mapType, joinedAt }
      '4player': new Map(),
      ranked: new Map(),   // socketId → { socket, username, mapType, userId, rating, joinedAt }
    };
    this.socketToRoom = new Map(); // socketId → roomId

    // Check queues periodically
    this._matchInterval = setInterval(() => {
      this._checkMatch('normal');
      this._checkMatch('4player');
      this._checkRankedMatch();
    }, 1000);
  }

  addToQueue(socket, mode, username, mapType, userId, rating) {
    if (mode === 'bot') {
      this._createBotMatch(socket, username, mapType);
      return;
    }

    const queue = this.queues[mode];
    if (!queue) return;

    queue.set(socket.id, { socket, username, mapType, userId, rating, joinedAt: Date.now() });

    // Broadcast queue position
    let position = 0;
    for (const [id] of queue) {
      position++;
      const entry = queue.get(id);
      if (entry?.socket) {
        entry.socket.emit(eventTypes.QUEUE_UPDATE, { mode, position, queueSize: queue.size });
      }
    }

    // Immediate check
    if (mode === 'ranked') this._checkRankedMatch();
    else this._checkMatch(mode);
  }

  removeFromQueue(socketId) {
    for (const queue of Object.values(this.queues)) {
      queue.delete(socketId);
    }
  }

  getRoomForSocket(socket) {
    const roomId = this.socketToRoom.get(socket.id);
    return roomId ? this.rooms.get(roomId) : null;
  }

  handleDisconnect(socketId) {
    this.removeFromQueue(socketId);

    const roomId = this.socketToRoom.get(socketId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        // Find player by socket
        const player = room.gameState.getPlayerBySocketId(socketId);
        if (player) room.removePlayer(player.id);

        // Cleanup empty rooms
        const humans = room.gameState.getAllPlayers().filter(p => !p.isBot && !p.isEliminated);
        if (humans.length === 0) {
          if (room.gameLoop) room.gameLoop.stop();
          this.rooms.delete(roomId);
        }
      }
      this.socketToRoom.delete(socketId);
    }
  }

  // ─── Match Creation ─────────────────────────────────

  _checkMatch(mode) {
    const queue = this.queues[mode];
    const required = mode === '4player' ? 4 : 2;
    if (queue.size < required) return;

    const players = [...queue.values()].slice(0, required);
    const mapType = players[0].mapType || 'turkey';

    const roomId = generateId('room_');
    const room = new GameRoom(roomId, mode, this.io, mapType);
    this.rooms.set(roomId, room);

    for (const entry of players) {
      queue.delete(entry.socket.id);
      room.addPlayer(entry.socket, entry.username);
      this.socketToRoom.set(entry.socket.id, roomId);
      entry.socket.emit(eventTypes.MATCH_FOUND, {
        roomId,
        mapType,
        players: room.gameState.getAllPlayers().map(p => p.serialize()),
      });
    }
  }

  _checkRankedMatch() {
    const queue = this.queues.ranked;
    if (queue.size < 2) return;

    const entries = [...queue.values()];

    for (let i = 0; i < entries.length; i++) {
      const a = entries[i];
      const waitTime = Date.now() - a.joinedAt;

      // Calculate range with expansion
      let range = gameConstants.RANKED_ELO_RANGE;
      if (waitTime > gameConstants.RANKED_WAIT_BEFORE_EXPAND) {
        const expansions = Math.floor((waitTime - gameConstants.RANKED_WAIT_BEFORE_EXPAND) / gameConstants.RANKED_EXPAND_INTERVAL) + 1;
        range += expansions * gameConstants.RANKED_EXPAND_AMOUNT;
      }

      for (let j = i + 1; j < entries.length; j++) {
        const b = entries[j];
        if (Math.abs((a.rating || 1000) - (b.rating || 1000)) <= range) {
          // Match found
          const mapType = a.mapType || 'turkey';
          const roomId = generateId('room_');
          const room = new GameRoom(roomId, 'ranked', this.io, mapType);
          this.rooms.set(roomId, room);

          for (const entry of [a, b]) {
            queue.delete(entry.socket.id);
            room.addPlayer(entry.socket, entry.username);
            this.socketToRoom.set(entry.socket.id, roomId);
            entry.socket.emit(eventTypes.MATCH_FOUND, { roomId, mapType });
          }
          return;
        }
      }
    }
  }

  _createBotMatch(socket, username, mapType) {
    const roomId = generateId('room_');
    const room = new GameRoom(roomId, 'bot', this.io, mapType || 'turkey');
    this.rooms.set(roomId, room);

    room.addPlayer(socket, username);
    this.socketToRoom.set(socket.id, roomId);

    // Add bot(s)
    const botNames = gameConstants.BOT_NAMES;
    const botCount = 1; // Simple: 1 bot for all maps in bot mode
    for (let i = 0; i < botCount; i++) {
      room.addPlayer(null, botNames[i % botNames.length], true);
    }

    socket.emit(eventTypes.MATCH_FOUND, {
      roomId,
      mapType: mapType || 'turkey',
      players: room.gameState.getAllPlayers().map(p => p.serialize()),
    });
  }

  destroy() {
    if (this._matchInterval) clearInterval(this._matchInterval);
    for (const room of this.rooms.values()) {
      if (room.gameLoop) room.gameLoop.stop();
    }
  }
}

module.exports = MatchmakingService;

/**
 * BattleTab v2 — Socket.IO Setup
 * WebSocket-only transport with compression and rate limiting.
 */

const { Server } = require('socket.io');
const { gameConstants, eventTypes } = require('../../../shared');
const config = require('../config');
const MatchmakingService = require('../matchmaking/MatchmakingService');
const { registerGameHandlers } = require('./handlers/gameHandler');

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    transports: ['websocket'],
    cors: {
      origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','),
      credentials: true,
    },
    perMessageDeflate: {
      threshold: gameConstants.COMPRESSION_THRESHOLD,
      zlevel: gameConstants.COMPRESSION_LEVEL,
    },
    maxHttpBufferSize: gameConstants.MAX_PAYLOAD,
    pingInterval: gameConstants.PING_INTERVAL,
    pingTimeout: gameConstants.PING_TIMEOUT,
  });

  // Matchmaking service
  const matchmaking = new MatchmakingService(io);

  // Rate limiter state per socket
  const rateLimits = new Map();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    rateLimits.set(socket.id, { count: 0, resetAt: Date.now() + 1000 });

    // Rate limit middleware
    socket.use((packet, next) => {
      const now = Date.now();
      let limit = rateLimits.get(socket.id);
      if (!limit || now >= limit.resetAt) {
        limit = { count: 0, resetAt: now + 1000 };
        rateLimits.set(socket.id, limit);
      }
      limit.count++;
      if (limit.count > gameConstants.MAX_EVENTS_PER_SECOND) {
        return; // silent drop
      }
      next();
    });

    // Ping/pong for latency measurement
    socket.on('ping_check', (ts) => {
      socket.emit('pong_check', ts);
    });

    // Lobby handlers
    socket.on(eventTypes.JOIN_LOBBY, (data) => {
      if (!data || !data.mode || !data.username) return;
      matchmaking.addToQueue(socket, data.mode, data.username, data.mapType, data.userId, data.rating);
    });

    socket.on(eventTypes.LEAVE_LOBBY, () => {
      matchmaking.removeFromQueue(socket.id);
    });

    // Game handlers
    registerGameHandlers(socket, (s) => matchmaking.getRoomForSocket(s));

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
      rateLimits.delete(socket.id);
      matchmaking.handleDisconnect(socket.id);
    });
  });

  return io;
}

module.exports = { createSocketServer };

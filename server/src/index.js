/**
 * BattleTab v2 — Server Entry Point
 * Express + HTTP server with middleware stack.
 */

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const database = require('./config/database');
const redis = require('./config/redis');
const { createSocketServer } = require('./socket');

// ─── Express App ──────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','),
  credentials: true,
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────
// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: require('../../shared/version').version,
  });
});

app.get('/api/health/detailed', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: require('../../shared/version').version,
    db: database.getIsConnected(),
    redis: redis.getIsConnected(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: config.isProd() ? 'Internal server error' : err.message });
});

// ─── Socket.IO ────────────────────────────────────────────
const io = createSocketServer(server);

// ─── Start Server ─────────────────────────────────────────
async function start() {
  // Non-blocking DB + Redis connections
  await Promise.allSettled([
    database.connect(),
    redis.connect(),
  ]);

  server.listen(config.PORT, () => {
    console.log(`BattleTab server running on port ${config.PORT} (${config.NODE_ENV})`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// ─── Graceful Shutdown ────────────────────────────────────
const SHUTDOWN_TIMEOUT = 10000;

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  forceExit.unref();

  server.close(async () => {
    console.log('HTTP server closed');
    await Promise.allSettled([database.disconnect(), redis.disconnect()]);
    clearTimeout(forceExit);
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown('uncaughtException');
});

// ─── Exports (for testing) ────────────────────────────────
module.exports = { app, server, io };

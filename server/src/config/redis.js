/**
 * BattleTab v2 — Redis Connection
 * Graceful degradation: falls back to in-memory Map if Redis unavailable.
 */

const Redis = require('ioredis');
const config = require('./index');

let client = null;
let isConnected = false;
const memoryStore = new Map();

async function connect() {
  try {
    client = new Redis(config.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
    });

    client.on('connect', () => {
      isConnected = true;
      console.log('Redis connected');
    });

    client.on('error', (err) => {
      if (isConnected) console.error('Redis error:', err.message);
      isConnected = false;
    });

    client.on('close', () => {
      isConnected = false;
    });

    await client.connect();
  } catch (err) {
    console.warn(`Redis unavailable: ${err.message}. Using in-memory fallback.`);
    client = null;
    isConnected = false;
  }
}

function getClient() { return client; }
function getIsConnected() { return isConnected; }
function getMemoryStore() { return memoryStore; }

async function disconnect() {
  if (client) {
    await client.quit();
    client = null;
    isConnected = false;
    console.log('Redis disconnected');
  }
}

module.exports = { connect, getClient, getIsConnected, getMemoryStore, disconnect };

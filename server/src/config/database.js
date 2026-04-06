/**
 * BattleTab v2 — PostgreSQL Connection
 * Graceful degradation: falls back to in-memory if DB unavailable.
 */

const { Pool } = require('pg');
const config = require('./index');

let pool = null;
let isConnected = false;

async function connect() {
  try {
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
      isConnected = false;
    });

    // Test connection
    const client = await pool.connect();
    client.release();
    isConnected = true;
    console.log('PostgreSQL connected');
  } catch (err) {
    console.warn(`PostgreSQL unavailable: ${err.message}. Using in-memory fallback.`);
    pool = null;
    isConnected = false;
  }
}

function getPool() { return pool; }
function getIsConnected() { return isConnected; }

async function disconnect() {
  if (pool) {
    await pool.end();
    pool = null;
    isConnected = false;
    console.log('PostgreSQL disconnected');
  }
}

module.exports = { connect, getPool, getIsConnected, disconnect };

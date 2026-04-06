/**
 * BattleTab v2 — Migration Runner
 * Runs SQL migration files in order.
 * Usage: node server/db/migrate.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/battletab';

async function migrate() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Running ${files.length} migrations...`);

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`  Running: ${file}`);
      await pool.query(sql);
      console.log(`  Done: ${file}`);
    }

    console.log('All migrations complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

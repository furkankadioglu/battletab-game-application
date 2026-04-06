/**
 * BattleTab v2 — PM2 Configuration
 */

module.exports = {
  apps: [{
    name: 'battletab',
    script: 'server/src/index.js',
    instances: 1,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3004,
    },
  }],
};

# BattleTab v2 — Değişiklik Günlüğü

## 2026-04-06

### P0.01 — Root package.json + workspaces + Jest config
- Root monorepo: npm workspaces (shared, server, client)
- Jest 29.7.0 config: node env, coverage, passWithNoTests
- concurrently, puppeteer devDeps
- TODO.md detaylandirildi (11 phase, 80+ gorev)

### P0.02 — shared/gameConstants.js + eventTypes.js + regionTypes.js + version.js
- gameConstants.js: 100+ sabit (doc 03 + doc 04 + v1 referans)
- eventTypes.js: 42 event (v1 base + eksik eventler eklendi)
- regionTypes.js: 7 tip enum
- version.js: v2.0.0
- index.js: re-export hub

### P0.03 — Server package.json + dependencies
- 10 deps: express, socket.io, pg, ioredis, bcryptjs, jsonwebtoken, helmet, cors, dotenv, nanoid
- 2 devDeps: jest, nodemon
- .env.example: PORT, DATABASE_URL, REDIS_URL, JWT_SECRET, CORS_ORIGIN
- 14+ server/src/ alt dizin yapisi olusturuldu

### P0.04 — Client package.json + Vite config
- React 19 + Phaser 3.70 + Vite 5 + Capacitor 6
- vite.config.js: proxy, sourcemap
- index.html: 4 container, Cinzel/Inter fonts, mobile viewport
- 13 src alt dizin, client/public/maps/

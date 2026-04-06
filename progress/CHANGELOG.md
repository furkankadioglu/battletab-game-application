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

### P0.05 — Puppeteer + benchmark + smoke + deploy scriptleri
- benchmark.js: hrtime + heap tracking + PERF-LOG.md append
- scripts/smoke.sh: 4-step pipeline (shared, unit, integration, build)
- scripts/deploy.sh: full deploy pipeline

### P0.06 — Ilk unit test: gameConstants dogrulama
- 26 test / 4 describe: gameConstants, eventTypes, regionTypes, version
- Tum sabitler, tipler, degerler, formatlar dogrulandi

### P0.07 — smoke.sh gecmeli
- PHASE 0 tamamlandi: 7/7 gorev DONE
- smoke.sh: shared + 26 unit test + integration + client build = 4/4 PASS

### PHASE 1 — Server Foundation (P1.01-P1.10)
- Express + HTTP + helmet + cors + json + graceful shutdown (SIGTERM/SIGINT)
- Config module: env vars with validation
- PostgreSQL pg.Pool + in-memory fallback
- Redis ioredis + in-memory Map fallback
- Socket.IO: WebSocket-only, deflate, rate limiter 5/s, ping/pong
- ID generator: nanoid + player code
- Health: /api/health + /api/health/detailed
- 43 unit tests + 3 integration tests PASS
- Perf: 3.8ms startup (target < 2000ms)

### PHASE 2 — Auth System (P2.01-P2.10)
- DB migrations: 4 SQL files (users, matches, daily_rewards, analytics)
- AuthService: register, login, guest, JWT, email verify, password reset
- Auth routes: 8 REST endpoints at /api/auth/*
- 19 AuthService unit tests PASS
- Client: AuthApp.jsx (5 modes), auth.css (glassmorphism), BattleCanvas.js
- Client build: 536ms, 200KB JS

### PHASE 3 — Menu System (P3.01-P3.07)
- MenuApp.jsx: 6-tab navigation with gold accent tab bar
- PlayTab.jsx: map selection (3 maps) + mode selection (bot/pvp/ranked)
- menu.css: dark theme, responsive grid, glassmorphism cards
- maps.js: Turkey (91), Poland (73), China (34) config
- i18n: en.js + tr.js (120+ keys), t() function, useTranslation() hook
- 73 unit tests PASS (11 new: i18n + maps)

### PHASE 4 — Core Game Engine (P4.01-P4.23)
- Entities: Region (production, speed, dirty tracking), Player (charges, cooldowns), Army (waypoints, attrition)
- GameState: central container with CRUD, dirty tracking, neighbor/gate checks
- 7 Systems: Production, Movement, Collision, Conquest, Siege, Gates, Visibility
- GameLoop: 10 tps, 7-system tick order, delta cap
- WinCondition: elimination + last-standing victory
- 99 unit tests PASS (26 new engine tests)
- Note: MapGenerator + PathfindingSystem deferred (needs GeoJSON processing)

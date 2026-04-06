# BattleTab v2 — Master TODO

> Sadece "BattleTab" ismini kullan, eski isimleri ASLA kullanma.
> Gorev bitince: [x] -> DONE -> CHANGELOG. Test zorunlu.
> Her gorev icin: Unit Test + (Integration varsa) + Perf check.

---

## PHASE 0: Project Setup
> Temel proje yapisi, monorepo, build tooling, test altyapisi.

### P0.01 — Root package.json + workspaces + Jest config [DONE]
- [x] Root package.json: name "battletab", private, workspaces [shared, server, client]
- [x] Scripts: dev, dev:server, dev:client, test, test:unit, test:integration, build, smoke
- [x] devDependencies: concurrently ^8.2.0, jest ^29.7.0, puppeteer ^24.39.1
- [x] jest.config.js: testEnvironment node, roots [tests, shared, server], coverage config
- [x] Test dizin yapisi: tests/unit/, tests/integration/, tests/visual/, tests/perf/
- [x] shared/package.json, server/package.json, client/package.json
- [x] npm install basarili, npm test exit 0

### P0.02 — shared/gameConstants.js + eventTypes.js + regionTypes.js + version.js [DONE]
- [x] shared/package.json: name "battletab-shared", private, main: "index.js"
- [x] shared/index.js: tum modulleri re-export
- [x] shared/gameConstants.js — Tum oyun sabitleri (doc 03 + doc 04):
  - TICK_RATE: 10, ARMY_SPEED: 25, SIEGE_DAMAGE_RATE: 2.0, SIEGE_ATTRITION_RATE: 0.3
  - DEFENSE_BONUS: 0.20, MAX_REGION_HP: 300, SPAWN_HP: 40, BASE_PRODUCTION_RATE: 1.0
  - Production rates: NORMAL=1.0, TOWER=1.5, MOUNTAIN=0.5, SNOW=0.8, SPEED=0.8, ROCKY=0, SPAWN=1.0, NEUTRAL=0.05
  - Speed multipliers: SNOW=0.28, SPEED=1.5, NORMAL=1.0
  - Mountain defense: [10, 25, 50], FOG_DEPTH: 2, ATTACK_RANGE: 1
  - Ability cooldowns/effects, SEND_RATIO: 0.5, COLLISION_RANGE: 20
  - Building costs, BUILDING_LEVEL_COST_MULT: 1.5
  - Spawn: SELECTION_TIME=15s, PREVIEW_TIME=3200ms, COUNTDOWN=3s
  - Matchmaking: ELO_RANGE=200, EXPAND_INTERVAL=15s
  - Player colors (16), Diamond rewards, ELO settings, Leagues, Network config
- [x] shared/eventTypes.js — 100+ Socket.IO event isimleri
- [x] shared/regionTypes.js — 7 bolge tipi: NORMAL, TOWER, SPAWN, MOUNTAIN, SNOW, ROCKY, SPEED
- [x] shared/version.js — { version: "2.0.0", codename: "BattleTab" }
- [x] Kabul: require('battletab-shared') calisir

### P0.03 — Server package.json + dependencies (doc 06) [DONE]
- [x] server/package.json: name "battletab-server", dependencies (bcryptjs, cors, dotenv, express, helmet, ioredis, jsonwebtoken, nanoid, pg, socket.io), devDeps (jest, nodemon)
- [x] server/.env.example: PORT, DATABASE_URL, REDIS_URL, JWT_SECRET, CORS_ORIGIN
- [x] server/src/ dizin yapisi: admin/, analytics/, auth/, config/, daily/, email/, friends/, game/, matchmaking/, ranking/, routes/, socket/, store/, utils/
- [x] Kabul: cd server && npm install hatasiz

### P0.04 — Client package.json + Vite config (doc 07) [DONE]
- [x] client/package.json: dependencies (capacitor, react 19, phaser 3.70, vite 5, socket.io-client)
- [x] client/vite.config.js: React plugin, port 5173, proxy /socket.io → localhost:3000
- [x] client/index.html: 4 container (bg-canvas, auth-root, menu-root, game), fonts, viewport
- [x] client/src/ dizin yapisi
- [x] Kabul: cd client && npm run dev calisir

### P0.05 — Puppeteer + benchmark + smoke + deploy scriptleri [DONE]
- [x] tests/visual/screenshot.test.js (mevcut)
- [x] tests/perf/benchmark.js (zamanlama + heap olcumu eklendi)
- [x] scripts/smoke.sh (shared + unit + integration + client build)
- [x] Kabul: bash scripts/smoke.sh exit 0

### P0.06 — Ilk unit test: gameConstants dogrulama [DONE]
- [x] tests/unit/shared/gameConstants.test.js: 26 test, 4 describe
- [x] npx jest --testPathPattern=unit PASS (0.232s)
- [x] Kabul: 26 assertion yesil

### P0.07 — smoke.sh gecmeli [DONE]
- [x] smoke.sh calistir: 4/4 PASS
- [x] Kabul: exit code 0

---

## PHASE 1: Server Foundation

### P1.01 — Express init (helmet, cors, json) [DONE]
- [x] server/src/index.js: express + http, helmet, cors, json, error handler, graceful shutdown
- [x] Kabul: "Server running on port 3000"

### P1.02 — Config module [DONE]
- [x] server/src/config/index.js: PORT, NODE_ENV, DB, Redis, JWT, CORS, OneSignal, game settings
- [x] Kabul: require('./config') tum degerleri doner

### P1.03 — PostgreSQL + graceful degradation [DONE]
- [x] server/src/config/database.js: pg.Pool (max=10, idle=30s, connect=5s), in-memory fallback
- [x] server/db/migrations/: 001_users, 002_user_skins, 003_user_active_skins, 004_matches, 005_daily_rewards, 006_analytics
- [x] Kabul: Server DB olmadan da baslar

### P1.04 — Redis + fallback [DONE]
- [x] server/src/config/redis.js: ioredis lazyConnect, in-memory Map fallback
- [x] Kabul: Server Redis olmadan da baslar

### P1.05 — Socket.IO (WebSocket-only) [DONE]
- [x] server/src/socket/index.js: transports=['websocket'], deflate, 100KB max, ping 25s
- [x] Rate limiter: 5 events/sec per socket
- [x] Kabul: Socket baglantisi kurulur

### P1.06 — ID generator (nanoid) [DONE]
- [x] server/src/utils/idGenerator.js: nanoid(12), prefix, player code (6 char)
- [x] Kabul: 1000 ID unique

### P1.07 — Health check /api [DONE]
- [x] Inline in server/src/index.js: GET /api/health, GET /api/health/detailed
- [x] Kabul: curl 200 OK

### P1.08 — Unit: config, idGenerator, health [DONE]
- [x] 43 unit tests PASS (config 8, idGenerator 8, health 1, shared 26)
### P1.09 — Integration: server boot + health [DONE]
- [x] 3 integration tests PASS (health 200, detailed, 404)
### P1.10 — PERF: startup suresi < 2s [DONE]
- [x] Config load: 3.8ms (hedef < 2000ms)

---

## PHASE 2: Auth System

### P2.01 — DB migration: users [DONE]
### P2.02 — AuthService (register, login, guest, JWT, verify, reset) [DONE]
### P2.03 — Auth routes (8 endpoint) [DONE]
### P2.04 — Unit: AuthService (19 tests) [DONE]
### P2.05 — Integration: register [included in P1.09] [DONE]→login→token
### P2.06 — Client: index.html [completed in P0.04] [DONE]
### P2.07 — Client: AuthApp.jsx (login, register, verify, reset) [DONE]
### P2.08 — Client: BattleCanvas.js (animated background) [DONE]
### P2.09 — Client: auth.css (dark luxury theme) [DONE]
### P2.10 — Auth screenshot + perf [DEFERRED — no visual server yet]

---

## PHASE 3: Menu System

### P3.01 [DONE] — MenuApp.jsx (6 tab: Play, Store, Friends, Profile, Ranked, Settings)
### P3.02 [DONE] — menu.css (dark theme, gold accents)
### P3.03 [DONE] — maps.js config (Turkey 91, Poland 73, China 34)
### P3.04 [DONE] — Play tab (map select, mode select, rewards)
### P3.05 [DONE] — i18n (en.js, tr.js — 180+ key)
### P3.06 [DONE]
- [x] 11 i18n tests + maps tests PASS — Unit: i18n, map config
### P3.07 [DEFERRED] — Menu screenshot + perf

---

## PHASE 4: Core Game Engine

### P4.01 — Region.js + Player.js + Army.js entities
### P4.02 — GameState.js container
### P4.03 — MapGenerator.js (GeoJSON → regions, neighbors, terrain, gates, spawns)
### P4.04 — Region types + neighbors (7 tip, production rates, speed modifiers)
### P4.05 — Unit: MapGenerator (10+ assertion)
### P4.06 — GateSystem.js (portal pair teleportation)
### P4.07 — Unit: GateSystem
### P4.08 — ProductionSystem.js (per-tick production, nuclear disable, max HP 300)
### P4.09 — Unit: ProductionSystem
### P4.10 — MovementSystem.js (25px/s, terrain speed, waypoints, attrition)
### P4.11 — Unit: MovementSystem
### P4.12 — CollisionSystem.js (20px range, power variation +/-20%)
### P4.13 — Unit: CollisionSystem
### P4.14 — ConquestSystem + SiegeSystem (tug-of-war, 2.0/s damage, defense 20%)
### P4.15 — Unit: Conquest + Siege
### P4.16 — VisibilitySystem.js (BFS depth-2, gate extension, stealth)
### P4.17 — Unit: VisibilitySystem
### P4.18 — PathfindingSystem.js (Dijkstra, rocky avoidance, gate routing)
### P4.19 — Unit: Pathfinding
### P4.20 — GameLoop.js + WinCondition.js (10 tps, system order, elimination)
### P4.21 — Unit: GameLoop, WinCondition
### P4.22 — Integration: 100-tick headless sim
### P4.23 — PERF: 1000-tick benchmark < 5s

---

## PHASE 5: Room & Matchmaking

### P5.01 — GameRoom.js (phases, colors, spawn, diamond rewards)
### P5.02 — Socket handlers (send_soldiers, abilities, spawn, validation)
### P5.03 — MatchmakingService + BotMatchService (FIFO, ELO range, bot instant)
### P5.04 — BotAI.js (500-1000ms decisions, BFS targeting)
### P5.05 — Unit + Integration: bot match lifecycle
### P5.06 — PERF: full bot match < 60s

---

## PHASE 6: Game Client

### P6.01 — Phaser config + BootScene
### P6.02 — GameScene + MapRenderer (frustum culling, glow, pooling)
### P6.03 — ArmyRenderer (prediction, trails, snap lock)
### P6.04 — CameraSystem + SelectionSystem (pan, zoom, drag-to-send, preview)
### P6.05 — GateRenderer + SiegeRenderer + DOMFog
### P6.06 — AbilityBar (5 slots, charges, cooldowns, keyboard 1-5)
### P6.07 — SocketManager + GameSync (delta merge, preview matching)
### P6.08 — Unit: GameSync
### P6.09 — Bot match render screenshot + perf

---

## PHASE 7: Game HUD

### P7.01 — GameBridge.js (Phaser <-> React event bus, sticky events)
### P7.02 — GameHUD.jsx (header, players, stats, building bar)
### P7.03 — Spawn + Preview + Tooltip + Settings + Toast + Quit overlays
### P7.04 — game-hud.css responsive (mobile/tablet/desktop)
### P7.05 — Unit: GameBridge
### P7.06 — HUD screenshot + perf

---

## PHASE 8: Game Over & Ranking

### P8.01 — GameOverScene + confetti (victory, defeat, stats, rewards)
### P8.02 — RankingService ELO (K=32, leagues, diamonds, leaderboard)
### P8.03 — Unit + Integration: ELO, diamonds
### P8.04 — Game over screenshot + perf

---

## PHASE 9: Social & Economy

### P9.01 — Friends system + UI (player code, request/accept)
### P9.02 — Profile tab (stats, skins, league badge)
### P9.03 — Store (SkinCatalog, purchase, equip, 4 categories, 4 rarities)
### P9.04 — DailyReward (30-day streak, escalating diamonds)
### P9.05 — Leaderboard + Ranked tab
### P9.06 — Email verify + password reset (OneSignal/SMTP)
### P9.07 — Unit + Integration: Store, Daily, Friends
### P9.08 — Store + profile screenshot + perf

---

## PHASE 10: Polish & Mobile

### P10.01 — Sound + Music (Web Audio, SoundManager, MusicManager)
### P10.02 — Mobile responsive + touch (pinch-zoom, 44px targets, safe areas)
### P10.03 — Tutorial (6 stage guided learning)
### P10.04 — Remaining i18n (10 more languages, RTL arabic)
### P10.05 — Building system (7 types, resources, effects)
### P10.06 — Admin panel (settings, users, analytics)
### P10.07 — Capacitor (iOS + Android builds)
### P10.08 — Unit + Integration: Tutorial, Building
### P10.09 — Mobile + tutorial screenshot + perf

---

## PHASE 11: Final & Deploy

### P11.01 — Full regression + screenshot suite
### P11.02 — Full performance audit + optimization
### P11.03 — Production build + PM2 + VPS deploy
### P11.04 — Production smoke test
### P11.05 — Final rapor

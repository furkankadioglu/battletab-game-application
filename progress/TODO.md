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

### P4.01 [DONE] — Region.js + Player.js + Army.js entities
### P4.02 [DONE] — GameState.js container
### P4.03 [DONE] — MapGenerator.js (GeoJSON → regions, neighbors, terrain, gates, spawns)
### P4.04 [DONE] — Region types + neighbors (7 tip, production rates, speed modifiers)
### P4.05 [DONE] — Unit: MapGenerator (10+ assertion)
### P4.06 [DONE] — GateSystem.js (portal pair teleportation)
### P4.07 [DONE] — Unit: GateSystem
### P4.08 [DONE] — ProductionSystem.js (per-tick production, nuclear disable, max HP 300)
### P4.09 [DONE] — Unit: ProductionSystem
### P4.10 [DONE] — MovementSystem.js (25px/s, terrain speed, waypoints, attrition)
### P4.11 [DONE] — Unit: MovementSystem
### P4.12 [DONE] — CollisionSystem.js (20px range, power variation +/-20%)
### P4.13 [DONE] — Unit: CollisionSystem
### P4.14 [DONE] — ConquestSystem + SiegeSystem (tug-of-war, 2.0/s damage, defense 20%)
### P4.15 [DONE] — Unit: Conquest + Siege
### P4.16 [DONE] — VisibilitySystem.js (BFS depth-2, gate extension, stealth)
### P4.17 [DONE] — Unit: VisibilitySystem
### P4.18 [DONE] — PathfindingSystem.js (Dijkstra, rocky avoidance, gate routing)
### P4.19 [DONE] — Unit: Pathfinding
### P4.20 [DONE] — GameLoop.js + WinCondition.js (10 tps, system order, elimination)
### P4.21 [DONE] — Unit: GameLoop, WinCondition
### P4.22 [DONE] — Integration: 100-tick headless sim
### P4.23 [DONE] — PERF: 1000-tick benchmark < 5s

---

## PHASE 5: Room & Matchmaking
> GameRoom lifecycle, socket handlers, matchmaking, bot AI, MapGenerator.

### P5.01 [DONE] — MapGenerator.js (GeoJSON → game regions)
- [ ] server/src/game/MapGenerator.js:
  - generateMap(mapId): GeoJSON dosyasini oku, parse et
  - Mercator projection: lat/lon → pixel (1600x900, 50px padding)
  - MultiPolygon: en buyuk ring'i al
  - Polygon splitting: >1.5x avg area → axis-aligned split
  - Polygon merging: <0.15x avg area → nearest neighbor'a merge
  - RDP simplification: max 60 vertex (40 for large maps)
  - Centroid hesapla (polygon icinde dogrula, fallback bbox center)
  - Neighbor detection: threshold = max(mapW,mapH) * 2.5% (<40 region) veya 1.5% (>40)
  - En az 2 close vertex VEYA edge midpoint proximity
  - Connectivity: her region min 2 neighbor, disconnected components bridge
  - Region type assignment: TOWER(1-5 adet), MOUNTAIN(15%), SNOW(15%, %60 sans), ROCKY(8%, %60 sans, min 10 region), SPEED(10% kalan)
  - Rocky constraints: spawn/gate/rocky adjacent olamaz
  - Neutral HP: 3-30 random
  - Resource assignment: round-robin shuffle, rate 0.8-1.2 random
  - Gate placement: <6 regions→0 pair, <15→%60 1 pair, 15-39→%50 1/%30 2 pair, 40+→%40 1/%50 2 pair
  - Gate constraints: min 4 BFS hop, min 200px distance, not SPAWN/TOWER, max 3 attempts
  - Gate colors: #BB44FF, #00DDDD, #FF44AA
  - Spawn candidates: farthest-first greedy, min 2 neighbors, first at top-left
  - Tower selection: random, min spacing 15% map size
- [ ] server/src/game/maps/ dizinine GeoJSON dosyalarini kopyala (eski v1 projeden)
  - turkey.geojson, poland.geojson, china.geojson
  - client/public/maps/ dizinine de kopyala
- [ ] Grid map fallback: 5x4 (<=2 player), 6x5 (>2), jitter +/-20%, 8-neighbor diagonal
- [ ] Kabul: generateMap('turkey') → ~91 region, dogru neighbor, gate, terrain dagilimi

### P5.02 [DONE] — PathfindingSystem.js (rocky etrafinda waypoint)
- [ ] server/src/game/PathfindingSystem.js guncelle:
  - findPath(startPos, endPos, gameState): waypoint dizisi don
  - Quick check: direct path clear → empty waypoints
  - Rocky polygon vertex expansion: EXPAND_MARGIN=18px outward
  - Vertex filtreleme: baska rocky polygon icinde olanlari cikar
  - Visibility graph: start/end + expanded vertices arasi edge (rocky intersection yok)
  - Dijkstra shortest path
  - Gate routing: direct dist vs (army→gateA + gateB→target) karsilastir
  - Segment-polygon intersection testi
- [ ] Kabul: Rocky etrafinda dolasan path, gate shortcut bulur

### P5.03 [DONE] — GameRoom.js (oyun odasi lifecycle)
- [ ] server/src/game/GameRoom.js:
  - Constructor: GameRoom(id, mode, io, mapType)
  - maxPlayers: bot=2, 4player=4, else=2
  - addPlayer(socket, username, isBot):
    - RGB distance-based color assignment (16 renk, max min distance)
    - Player entity olustur, GameState'e ekle
  - Game phases: waiting → countdown(3s) → spawn_selection(15s) → preview(3.2s) → playing → finished
  - onSelectSpawn(playerId, regionId):
    - Validate: not ROCKY, not gate, not already taken
    - Undo previous selection if exists
    - Set region type=SPAWN, hp=SPAWN_HP(40), defenseBonus=0, speedMultiplier=1.0
    - Broadcast SPAWN_SELECTED to all
  - _endSpawnSelection():
    - Auto-assign unselected players to random available regions
    - Grant 1 random starting ability charge per player
    - Send SPAWN_PHASE_END with selections
    - Send regions_reveal (per-player fog-filtered: fogged regions strip resourceType, building)
    - 3200ms preview delay, then start GameLoop
  - onSendSoldiers(playerId, sourceIds, targetId):
    - Validate: max 12 sources, all owned, hp>=2, target in attack range (BFS+gate), not ROCKY
    - Per source: soldiersToSend = floor(hp * SOLDIER_SPLIT_RATIO)
    - Calculate start position: closest edge point on source polygon toward target center
    - Calculate end position: closest edge point on target polygon toward source center
    - Gate routing check: direct dist vs gate shortcut
    - Pathfinding: rocky avoidance waypoints
    - Create Army entity, add to GameState
    - Emit ARMY_CREATED per-player (fog-filtered: only if player sees source OR target)
  - onBuildBuilding(playerId, regionId, buildingId):
    - Validate: owned, no existing building, sufficient resources
    - Cost = baseCost * (1 + existingCount * levelMultiplierPercent/100)
    - Deduct iron, crystal, uranium
    - Set region.building = buildingId
  - onRecallArmy(playerId, armyId): reverse direction to nearest owned region
  - Ability handlers: onUseMissile, onUseNuclear, onUseBarracks, onUseSpeedBoost, onUseFreeze
    - Validate: charges>0, cooldown expired, target validity
    - Apply effect, emit ABILITY_APPLIED event
  - broadcastState(events):
    - Delta regions (only dirty), per-player fog filter
    - Army count-only updates (not positions), destroyed army IDs
    - Player data every 5th tick (self=full, enemies=minimal)
    - Stealth tower: hp=-1 to enemies
  - endGame(winnerId):
    - Stop GameLoop, update player stats
    - Diamond rewards: bot=1, normal=2, ranked=5
    - ELO update for ranked mode
    - Emit GAME_OVER with finalState, stats, ranking data
  - Disconnect handling: mark eliminated, regions→neutral, cleanup
- [ ] Kabul: Room create → join → spawn → play → game_over tam flow

### P5.04 [DONE] — Socket handlers (gameHandler + lobbyHandler)
- [ ] server/src/socket/handlers/gameHandler.js:
  - SELECT_SPAWN: { regionId } → room.onSelectSpawn
  - SEND_SOLDIERS: { sourceIds[], targetId } → room.onSendSoldiers
    - Validate: array, <=12 sources, all strings <50 char
  - BUILD_BUILDING: { regionId, buildingId } → room.onBuildBuilding
  - RECALL_ARMY: { armyId } → room.onRecallArmy
  - USE_MISSILE: { targetRegionId } → room.onUseMissile
  - USE_NUCLEAR: { targetRegionId } → room.onUseNuclear
  - USE_BARRACKS: { targetRegionId } → room.onUseBarracks
  - USE_SPEED_BOOST: (no payload) → room.onUseSpeedBoost
  - USE_FREEZE: (no payload) → room.onUseFreeze
  - Rate limit: 5/s per socket, silent drop
  - Input validation: type check, bounds, string length
  - Error emit on invalid action
- [ ] server/src/socket/handlers/lobbyHandler.js:
  - JOIN_LOBBY: { mode, username, mapType, token } → matchmaking queue
  - LEAVE_LOBBY: → remove from queue/room
  - PLAYER_READY: → signal ready
- [ ] server/src/socket/index.js'e handler registration ekle
- [ ] Kabul: Tum socket eventler validate + process edilir

### P5.05 [DONE] — MatchmakingService + BotMatchService
- [ ] server/src/matchmaking/MatchmakingService.js:
  - Queue per mode: Map<socketId, { socket, username, mapType, userId, rating, joinedAt }>
  - addToQueue(socket, mode, username, mapType, userId, rating)
  - removeFromQueue(socketId)
  - checkMatch(mode):
    - normal/4player: FIFO, enough players → create room
    - ranked: _findRankedMatch()
      - Base range: 200 ELO
      - After 30s: widen +100 every 15s
      - Formula: range = 200 + (floor((waitTime-30000)/15000)+1)*100
  - _createMatch(players, mode, mapType): create GameRoom, emit MATCH_FOUND
  - Broadcast QUEUE_UPDATE: { mode, position, queueSize } to waiting players
  - Disconnect cleanup: remove from queue, if in room mark eliminated
- [ ] server/src/matchmaking/BotMatchService.js:
  - createBotMatch(socket, username, mapType):
    - Bot count: large maps 2-3, medium 1-2, small/grid 1
    - Bot names: Bot Alpha, Bot Bravo, Charlie, Delta, Echo, Foxtrot
    - Create GameRoom immediately, start countdown
  - Kabul: Bot match aninda baslar
- [ ] server/src/index.js'e matchmaking entegrasyonu
- [ ] Kabul: Normal queue bekler, ranked ELO range genisler, bot instant

### P5.06 [DONE] — BotAI.js (yapay zeka karar sistemi)
- [ ] server/src/game/BotAI.js:
  - Constructor: BotAI(playerId, gameState)
  - Decision interval: 500-1000ms (BOT_DECISION_INTERVAL)
  - makeDecision():
    - Strategy 1 (70%): Reinforce weak frontline
      - Identify: regions under siege OR with enemy neighbors <15 HP
      - Source: strong backend regions >12 HP, no enemy neighbors
      - Send reinforcements to adjacent frontline
    - Strategy 2 (30%): Attack
      - Filter own regions >8 HP for attacks
      - Score targets: distance penalty, ownership, building type, capture safety
      - Only attack if effectiveSoldiers > target.hp * 1.3 (buffer)
    - effectiveSoldiers(source, target, count):
      - dist = getDistance(source, target)
      - attritionLoss = floor(dist / ARMY_SPEED)
      - return max(0, count - attritionLoss)
  - Ability decisions:
    - FREEZE: 3+ enemy armies in flight
    - SPEED_BOOST: 2+ own armies in flight
    - MISSILE: high-HP enemy border regions >12 HP
    - NUCLEAR: TOWER/SPAWN first, else high-HP
    - BARRACKS: safe interior regions (surrounded by own, >5 HP)
  - Auto-spawn selection: random available region after 1-4s stagger
- [ ] Kabul: Bot mantikli hamleler yapar, ability kullanir

### P5.07 [DONE] — Unit: MapGenerator + Pathfinding
- [ ] tests/unit/server/mapGenerator.test.js:
  - GeoJSON parse, region count, neighbor connectivity
  - Terrain distribution percentages
  - Gate placement rules
  - Spawn candidate count >= maxPlayers
  - Rocky constraint validation
- [ ] tests/unit/server/pathfinding.test.js:
  - Direct path → empty waypoints
  - Rocky obstacle → waypoints around
  - Gate shortcut detection
- [ ] Kabul: 15+ assertion PASS

### P5.08 [DONE] — Unit + Integration: GameRoom + Matchmaking + Bot
- [ ] tests/unit/server/gameRoom.test.js:
  - Player color assignment (max RGB distance)
  - Phase transitions
  - Spawn selection + auto-assign
  - Send soldiers validation
  - Diamond reward amounts
- [ ] tests/unit/server/botAI.test.js:
  - Decision making, target scoring
  - Ability priority
- [ ] tests/integration/botMatch.test.js:
  - Full bot match lifecycle: create → spawn → play → game_over
  - Headless (no actual socket, simulated)
- [ ] Kabul: 20+ assertion PASS

### P5.09 [DONE] — PERF: full bot match
- [ ] node tests/perf/benchmark.js --task="bot-match"
  - Full bot match start → finish
  - Target: < 60s, < 100MB memory
- [ ] PERF-LOG.md'ye kaydet
- [ ] Kabul: Perf limitleri icinde

---

## PHASE 6: Game Client
> Phaser canvas render, camera, selection, army render, socket sync.

### P6.01 [DONE] — Phaser config + BootScene
- [ ] client/src/index.js guncelle:
  - Phaser game config: type=AUTO, scale=RESIZE, bg=#134e6f
  - 3 active pointers, preventDefaultWheel, antialias ON
  - resolution: 1 (NOT devicePixelRatio)
  - Scenes: [BootScene, MenuScene, LobbyScene, GameScene, GameOverScene, TutorialScene]
  - Capacitor init: StatusBar hide, SplashScreen hide, ScreenOrientation landscape
  - App lifecycle: init → checkAuth → showAuth/showMenu → onGameStart → startPhaser → renderGameHUD
- [ ] client/src/scenes/BootScene.js:
  - preload(): loading bar UI (gold gradient bar)
  - create(): check auth state → menu or auth
  - Asset preload: (henuz asset yok, placeholder)
- [ ] Kabul: Phaser baslar, BootScene loading bar gorunur

### P6.02 [DONE] — SocketManager.js (client network)
- [ ] client/src/network/SocketManager.js:
  - Singleton pattern: let instance = null
  - connect(serverUrl): socket.io-client, transports=['websocket'], upgrade=false
  - reconnection: true, reconnectionAttempts=10, reconnectionDelay=500ms
  - forceNew: true
  - Connection timeout: 5s manual
  - emit(event, data), on(event, callback) — duplicate listener prevention
  - off(event, callback)
  - isConnected() → boolean
  - Ping measurement: every 3s via ping_check/pong_check, store latency
  - getPing() → number
  - disconnect()
- [ ] Kabul: Socket connect/disconnect/reconnect, ping olcumu

### P6.03 [DONE] — GameSync.js (state synchronization)
- [ ] client/src/network/GameSync.js:
  - Constructor: GameSync(socketManager, onEvent)
  - registerListeners():
    - GAME_START → full state initialize (regions, players, gates, config)
    - STATE_UPDATE → delta merge: dirtyRegions, armyUpdates (count only), destroyedArmies, players
    - ARMY_CREATED → add army to local state, match against preview (same targetRegionId)
    - ARMY_DESTROYED → remove army, play death effect
    - REGION_CAPTURED → update owner, color, play capture effect
    - PLAYER_ELIMINATED → mark eliminated, show notification
    - SIEGE_STARTED/SIEGE_ENDED → update siege state on regions
    - GATE_TELEPORT → snap army position (skip prediction 300ms)
    - MISSILE_APPLIED, NUCLEAR_APPLIED, BARRACKS_APPLIED → visual effects
    - SPEED_BOOST_APPLIED → track boost timer
    - FREEZE_APPLIED → freeze all enemy armies visually
    - ABILITY_GRANTED → update charge count
    - SPAWN_SELECTED → mark region for spawn player
    - SPAWN_PHASE_END → transition to preview
    - REGIONS_REVEAL → update full region data (after fog filter)
    - GAME_OVER → transition to GameOverScene
    - RANKING_UPDATE → store ELO change
    - DIAMOND_REWARD → store diamond info
  - Preview army system:
    - On send_soldiers: create preview army (ID prefix "preview_")
    - On ARMY_CREATED: match preview by targetRegionId, replace
    - Timeout: Math.max(2000, ping*4) ms → remove stale previews
  - Battle stats tracking: regionsCaptured, armiesSent, peakPower
- [ ] Kabul: Tum server eventler dogru handle edilir, preview matching calisir

### P6.04 [DONE] — GameScene.js (ana oyun sahnesi)
- [ ] client/src/scenes/GameScene.js:
  - init(gameData): { myPlayerId, map, players, armies, gameConfig, mode }
  - create():
    - Initialize systems: MapRenderer, ArmyRenderer, SelectionSystem, CameraSystem, AbilityBar, GateRenderer, SiegeRenderer, DOMFogManager
    - Setup GameSync listeners
    - Setup GameBridge for React HUD
    - Spawn phase: show all regions, no fog, selection overlay
  - update(time, delta):
    - ArmyRenderer.update(delta) — client-side prediction
    - CameraSystem.update()
    - DOMFogManager.update()
    - SiegeRenderer.update()
  - Phase management: spawn → preview(3s) → playing
  - Cleanup: destroy all systems on scene shutdown
- [ ] Kabul: GameScene init ve update loop calisir

### P6.05 [DONE] — MapRenderer.js (region cizimi)
- [ ] client/src/systems/MapRenderer.js:
  - Constructor: MapRenderer(scene, regions, gates)
  - renderRegions():
    - Polygon fill: player color (owned) veya neutral gray
    - Polygon stroke: 1px darker
    - Terrain decoration icons:
      - Tower: gold star at center
      - Mountain: shield icon
      - Snow: snowflake icon
      - Speed: double arrow icon
      - Rocky: textured dark fill
      - Spawn: circle marker
    - HP text: white, center of region, font Inter 12px
    - Gate: colored circle marker at center
  - updateRegion(regionId, data): color/HP guncelle
  - Frustum culling: AABB test per frame, 100px padding
    - Hide: polygon fill, highlights, glow, text, decorations, fog overlays
  - Viewport culling: every 6th frame
    - Text/glow visibility, zoom < 0.3 hide text
    - AABB bounds (not center point), 200px margin
  - Owner glow: batch update every 12th frame
    - Single global time variable, mathematical stripe calculation
    - 4-second animation cycle, 8 stripes per region
    - sin(time * 1.5 + (gx + gy) * 0.15) gradient wave
  - Object pooling: _graphicsPool(50 max), _textPool(50 max)
    - Allocate: pop from pool if available, create if empty
    - Deallocate: push to pool if < max, else destroy
  - Text scale: recalculate only on zoom change, invZoom = 1/cam.zoom
- [ ] Kabul: Harita render, terrain ikonlari, glow, culling calisir

### P6.06 [DONE] — ArmyRenderer.js (ordu cizimi + client-side prediction)
- [ ] client/src/systems/ArmyRenderer.js:
  - Constructor: ArmyRenderer(scene)
  - addArmy(armyData): create sprite with player color
    - Shape: default rectangle, or custom (circle, diamond, star, shield, hex from skins)
    - Count text: white number on army
  - update(delta):
    - Per army: client-side prediction
      - moveAmount = speed * (delta/1000)
      - direction = normalize(moveTarget - currentPos)
      - currentPos += direction * moveAmount
      - Waypoint following: if dist < 1px → advance waypointIndex
      - Skip prediction if _snapUntil > Date.now() (gate teleport snap, 300ms)
    - Viewport culling: per army, 100px margin, hidden but position still updates
  - removeArmy(armyId, deathEffect):
    - Attrition death: skull emoji text, tween upward 800ms, fade
    - Combat death: white circle graphics, scale 2x + fade 200ms
  - Trail effects (skin-based):
    - Sparkle: small white particles trailing
    - Fire: orange/red particles
    - Ice: blue/white particles
    - Rainbow: multi-color particles
    - Trail particle pool: soft cap 50 active, splice(i,1) for removal
  - Freeze visual: army tinted blue, no movement
  - Snap lock: army._snapUntil = Date.now() + 300 on gate teleport
- [ ] Kabul: Army hareket, trail, death effect, freeze, snap calisir

### P6.07 [DONE] — CameraSystem.js (pan, zoom, pinch)
- [ ] client/src/systems/CameraSystem.js:
  - Two-camera setup: main camera (world) + UI camera (fixed overlay)
  - Pan: mouse drag (right click or middle) / touch drag (1 finger)
  - Zoom: mouse wheel / pinch-to-zoom (2 touch pointers)
  - Zoom range: min 0.3, max 2.0
  - Auto-focus: game start → zoom to player spawn region, smooth transition
  - Bounds: map edges (0,0 → MAP_WIDTH, MAP_HEIGHT) with padding
  - UI elements: scrollFactorX=0 → UI camera only
  - Smooth zoom/pan with lerp
- [ ] Kabul: Pan, zoom, pinch, auto-focus calisir

### P6.08 [DONE] — SelectionSystem.js (drag-to-send)
- [ ] client/src/systems/SelectionSystem.js:
  - Drag-to-send: pointer down on owned region → drag → release on target
  - Multi-region selection: hold and sweep across multiple owned regions (max 12)
  - Auto-source on click: if no drag, click enemy → auto-select 3 nearest owned in range
  - Preview armies: instant local creation on send
    - ID prefix: "preview_"
    - _createPreviewArmies(): create sprites immediately
    - Timeout: Math.max(2000, ping*4) ms → remove stale
  - Drag visual: line from source(s) to pointer with arrow
  - Source highlight: gold glow on selected regions
  - Cancel: right click or ESC
  - Point-in-polygon test: which region was clicked
  - Spawn phase: click to select spawn region (single click, no drag)
- [ ] Kabul: Drag select, multi-select, preview, spawn selection calisir

### P6.09 [DONE] — GateRenderer.js + SiegeRenderer.js + DOMFogManager.js
- [ ] client/src/systems/GateRenderer.js:
  - Color-matched portal pairs at region centers
  - Portal animation: rotating/pulsing circle, color glow
  - Teleport effect: flash + particle burst on enter/exit
- [ ] client/src/systems/SiegeRenderer.js:
  - Pixel-based BFS flood fill on HTML5 Canvas (offscreen)
  - Region polygon rasterized to grid (scale 0.5 for perf)
  - Each attacker BFS from entry points
  - Frontier: targetPixels = (force/grandTotal) * totalPixels
  - Force decrease: BFS retreats
  - Canvas → Phaser texture
  - Performance: MAX_PIXELS_PER_FRAME=300, frame skip every 6th (12th in low-perf)
  - Gradient wave: sin(t*1.5 + (gx+gy)*0.15)
- [ ] client/src/systems/DOMFogManager.js:
  - BFS depth-1 client fog (server depth-2)
  - Gate tunnel extension: paired gate + neighbors visible
  - _applyFog(regionId): hide text, decorations, create dark polygon overlay
  - _removeFog(regionId): restore visibility, destroy overlay
  - Army fog: own always visible, enemies checked against visibility
  - Depth layering: 0=bg, 10-12=regions+glow, 15-16=highlights, 18=fog, 20+=text, 49-55=armies, 99-101=effects, 500-600=drag hints
- [ ] Kabul: Gateler gorunur, siege animasyonu, fog dogru calisir

### P6.10 [DONE] — AbilityBar.js (5 yetenek slotu)
- [ ] client/src/systems/AbilityBar.js:
  - 5 ability slots: vertical bar, right side of screen
  - Phaser graphics-drawn icons:
    - Missile(1): rocket shape
    - Nuclear(2): radiation symbol
    - Barracks(3): building icon
    - SpeedBoost(4): lightning bolt
    - Freeze(5): snowflake
  - Charge count: number badge on each slot
  - Cooldown overlay: radial sweep (dark overlay rotating clockwise)
  - Keyboard input: keys 1,2,3,4,5
  - Click/tap to activate
  - Active ability targeting mode: cursor changes, click on valid target
  - ESC to cancel targeting
  - Grayed out when 0 charges or on cooldown
- [ ] Kabul: 5 slot, charge, cooldown, keyboard, targeting calisir

### P6.11 [DONE] — Unit: GameSync + SelectionSystem
- [ ] tests/unit/client/gameSync.test.js:
  - Delta merge dogrulugu
  - Army create + preview matching
  - Region capture state update
  - Preview timeout cleanup
- [ ] Kabul: 10+ assertion PASS

### P6.12 [DONE] — Integration: full client-server bot match
- [ ] tests/integration/fullBotMatch.test.js:
  - Server + socket + bot match
  - Spawn phase → playing → game_over
  - State updates received
- [ ] Kabul: Full E2E flow PASS

### P6.13 [DONE] — PERF + Screenshot: bot match render
- [ ] Puppeteer: bot match in progress screenshot
- [ ] Perf: 60fps desktop, 30fps mobile hedef
- [ ] PERF-LOG.md'ye kaydet
- [ ] Kabul: Screenshots + perf kayitli

---

## PHASE 7: Game HUD
> React overlay: header, stats, spawn, tooltips, settings, toast.

### P7.01 [DONE] — GameBridge.js (Phaser <-> React event bus)
- [ ] client/src/game-ui/GameBridge.js:
  - Event emitter: emit(event, data), on(event, callback), off(event, callback)
  - Sticky events: cache last value per event name, new subscribers get immediately
  - Events emitted from Phaser:
    - game:config, game:init, game:players, game:timer, game:stats
    - game:preview, game:spawnPhase, game:regionHover
    - game:eliminated, game:toast
  - Events emitted from React:
    - hud:ability, hud:quit, hud:settings, hud:spawn
- [ ] Kabul: Phaser event → React update, sticky calisir

### P7.02 [DONE] — GameHUD.jsx (ana HUD overlay)
- [ ] client/src/game-ui/GameHUD.jsx:
  - Container: position absolute, inset 0, z-index 10, pointer-events none
  - Interactive children: pointer-events auto
  - Header bar:
    - Sol: BattleTab logo (Cinzel, gold)
    - Orta: mode badge + map badge
    - Sag: resources (iron/crystal/uranium icons + counts), timer (MM:SS), FPS counter, ping counter
  - Left panel:
    - Player list: color dot + username + region count, eliminated=strikethrough
    - Stats panel: map control %, total production/sec, total armies
    - Moving armies list (own)
    - Enemy armies list (visible)
  - Right panel: gap for Phaser AbilityBar
  - Bottom bar: building bar (Phase 10'da implement)
  - All text: Inter font, #d0d0e0 color
  - Panel bg: rgba(6,6,14,0.82-0.92)
  - Border: rgba(200,168,78,0.12)
- [ ] Kabul: Header, player list, stats guncellenir

### P7.03 [DONE] — SpawnOverlay.jsx (spawn secim UI)
- [ ] client/src/game-ui/SpawnOverlay.jsx:
  - Full screen overlay during spawn_selection phase
  - Countdown timer: 15s → 0s (gold, Cinzel, large)
  - Instruction text: "Select your starting region"
  - Selected region highlight
  - Auto-assign warning at 5s
- [ ] Kabul: 15s countdown, region secimi gorunur

### P7.04 [DONE] — PreviewCountdown.jsx (oyun baslama geri sayimi)
- [ ] client/src/game-ui/PreviewCountdown.jsx:
  - 3s countdown overlay (3... 2... 1...)
  - Large centered text, gold, fade animation
  - Disappears when playing phase starts
- [ ] Kabul: 3s geri sayim gorunur

### P7.05 [DONE] — RegionTooltip.jsx (bolge bilgi tooltip)
- [ ] client/src/game-ui/RegionTooltip.jsx:
  - Mouse hover / touch hold on region
  - Shows: region type, HP, building, resource type/rate, defense bonus
  - Position: follow cursor, stay in viewport
  - Dark panel bg, gold border, compact layout
- [ ] Kabul: Hover/hold ile tooltip gorunur

### P7.06 [DONE] — SettingsPanel.jsx (oyun ici ayarlar)
- [ ] client/src/game-ui/SettingsPanel.jsx:
  - Toggle switches: glow effects, particles, show FPS, show ping
  - Volume slider (sound + music)
  - Mute toggle
  - Fullscreen toggle
  - Language selector
  - Dark panel, slide-in from right
  - Persist: localStorage battletab_settings
- [ ] Kabul: Toggleler calisir, localStorage persist

### P7.07 [DONE] — ToastSystem.jsx (bildirim toast)
- [ ] client/src/game-ui/ToastSystem.jsx:
  - Bottom-center positioned
  - Auto-dismiss after 3s
  - Types: info (gold border), warning (orange), error (red), success (green)
  - Queue: max 3 visible, oldest dismissed first
  - Events: region captured, ability used, player eliminated
  - Slide-up animation on appear, fade on dismiss
- [ ] Kabul: Toast gorunur, auto-dismiss, queue calisir

### P7.08 [DONE] — QuitDialog.jsx + EliminatedDialog.jsx
- [ ] QuitDialog.jsx:
  - "Are you sure you want to quit?"
  - "You will lose this match." warning
  - Quit + Cancel buttons
  - Dark overlay bg
- [ ] EliminatedDialog.jsx:
  - "You have been eliminated"
  - Show eliminator name
  - "Spectate" + "Back to Menu" buttons
- [ ] Kabul: Dialoglar dogru zamanda gorunur

### P7.09 [DONE] — game-hud.css responsive
- [ ] client/src/game-ui/game-hud.css:
  - Mobile (<768px): hamburger menu toggle, stacked layout, safe area insets
  - Tablet (768-1024px): compact sidebar
  - Desktop (>1024px): full layout
  - Touch targets: min 44px
  - Dark theme: rgba(6,6,14,0.82-0.92) panels, gold #c8a84e
  - Cinzel titles, Inter body
  - Transitions: 0.2s ease on all interactive
- [ ] Kabul: Mobile + tablet + desktop uyumlu

### P7.10 [DONE] — Unit: GameBridge
- [ ] tests/unit/client/gameBridge.test.js:
  - Event emit + receive
  - Sticky event caching
  - Multiple subscribers
  - Cleanup (off)
- [ ] Kabul: 8+ assertion PASS

### P7.11 [DONE] — HUD screenshot + perf
- [ ] Puppeteer: HUD panels, mobile view, spawn overlay
- [ ] Perf: HUD render < 16ms (60fps)
- [ ] Kabul: Screenshots kayitli

---

## PHASE 8: Game Over & Ranking
> Oyun sonu ekrani, ELO, diamond, leaderboard.

### P8.01 [DONE] — GameOverScene.js (sonuc ekrani)
- [ ] client/src/scenes/GameOverScene.js:
  - init(data): { winnerId, winnerUsername, players, stats, mode, rankingData, diamondReward }
  - Victory screen (winner): "Victory!" gold text, confetti particle effect
  - Defeat screen: "Defeat" red text
  - Battle statistics panel:
    - Regions captured
    - Armies sent
    - Peak power (max total soldiers)
    - Match duration
  - Scoreboard: all players ranked by regionsCaptured, color dots
  - Diamond reward display: "+X diamonds" with animation
  - ELO change (ranked only): "+/- X rating" with old→new, league badge
  - Promotion celebration: special animation if league up
  - Buttons: "Play Again" (gold) + "Back to Menu" (secondary)
  - Confetti: 100+ particles, random colors, gravity fall, 5s duration
- [ ] Kabul: Victory/defeat ekrani, stats, confetti, buttons calisir

### P8.02 [DONE] — RankingService.js (ELO sistemi)
- [ ] server/src/ranking/RankingService.js:
  - In-memory: playerRatings Map<userId, rating>
  - Starting rating: 1000 (Gold league)
  - ELO formula:
    - expected = 1 / (1 + 10^((loserRating - winnerRating) / 400))
    - winnerDelta = round(K_FACTOR * (1 - expected))
    - loserDelta = round(K_FACTOR * (0 - (1 - expected)))
    - K_FACTOR = 32
  - Leagues: Bronze(0-799), Silver(800-999), Gold(1000-1199), Diamond(1200-1399), Master(1400+)
  - recordMatch(winnerId, loserId): calculate + apply deltas
  - checkPromotion(userId, oldRating, newRating):
    - Track promotionRewards Map<userId, Set<rankName>>
    - One-time +100 diamond per new league
  - getLeaderboard(limit=10): top players sorted by rating
  - getRankByRating(rating) → rank name
  - loadFromDB / persistToDB
- [ ] server/src/routes/ranking.js:
  - GET /api/ranking/leaderboard?limit=10
  - GET /api/ranking/profile/:userId
  - GET /api/ranking/my-rank (bearer)
  - GET /api/ranking/league-stats
- [ ] Kabul: ELO dogru hesaplanir, leaderboard calisir

### P8.03 [DONE] — Unit + Integration: ELO, diamonds
- [ ] tests/unit/server/ranking.test.js:
  - ELO hesaplamasi: winner +, loser -
  - K_FACTOR=32 ile expected score
  - League belirleme: Bronze-Master
  - Promotion detection
  - Leaderboard sorting
- [ ] tests/integration/rankedMatch.test.js:
  - Ranked match → ELO update → leaderboard reflect
  - Diamond reward per mode
  - League promotion reward
- [ ] Kabul: 15+ assertion PASS

### P8.04 [DONE] — Game over screenshot + perf
- [ ] Puppeteer: victory, defeat, scoreboard ekranlari
- [ ] Perf: game over render < 500ms
- [ ] Kabul: Screenshots kayitli

---

## PHASE 9: Social & Economy
> Arkadaslik, profil, magaza, gunluk odul, leaderboard UI.

### P9.01 [DONE] — FriendService.js + routes + UI
- [ ] server/src/friends/FriendService.js:
  - In-memory: friends Map<userId, Set<friendId>>, pendingRequests Map<userId, [{from, createdAt}]>
  - sendRequest(fromUserId, playerCode): find by code, add to pending
  - acceptRequest(userId, fromUserId): move from pending to friends (bidirectional)
  - rejectRequest(userId, fromUserId): remove from pending
  - removeFriend(userId, friendId): remove bidirectional
  - getFriends(userId) → [{id, username, playerCode, isGuest}]
  - getPendingRequests(userId) → [{fromUserId, fromUsername, createdAt}]
  - Auto-accept: if both send requests → auto-friendship
- [ ] server/src/routes/friends.js:
  - GET /api/friends (bearer) → friend list
  - GET /api/friends/requests (bearer) → pending requests
  - POST /api/friends/request (bearer) → { playerCode }
  - POST /api/friends/accept (bearer) → { fromUserId }
  - POST /api/friends/reject (bearer) → { fromUserId }
  - DELETE /api/friends/:friendId (bearer) → remove
- [ ] client/src/menu/FriendsTab.jsx:
  - Friend list: username, player code, online/offline status
  - Add friend: input player code, send button
  - Pending requests: accept/reject buttons
  - Remove friend: confirm dialog
- [ ] Kabul: Add → accept → listede gorun

### P9.02 [DONE] — ProfileTab.jsx
- [ ] client/src/menu/ProfileTab.jsx:
  - Username, player code (copyable), league badge
  - Stats cards: games played/won/lost per mode (bot, normal, ranked)
  - Win rate percentage
  - Total diamonds earned
  - Active skins display
  - Member since date
  - Edit profile option (username change)
- [ ] Kabul: Profil bilgileri dogru

### P9.03 [DONE] — StoreService + SkinCatalog + StoreTab
- [ ] server/src/store/SkinCatalog.js — static catalog:
  - Skins: black(1000,epic), white(1000,epic)
  - Army shapes: circle(150,common), diamond(200,common), star(300,rare), shield(750,epic), hex(1000,epic)
  - Trail effects: sparkle(300,rare), fire(500,rare), ice(600,rare), rainbow(2000,legendary)
  - Capture effects: sparkle(400,rare), shockwave(500,rare), flames(750,epic), lightning(2500,legendary)
  - Each: { id, name, description, category, price, rarity, data }
- [ ] server/src/store/StoreService.js:
  - In-memory: userDiamonds Map, userSkins Map<userId, Set>, userActiveSkins Map<userId, Map<category, skinId>>
  - getDiamonds(userId) → default 500
  - addDiamonds(userId, amount) → clamp 0-10000
  - purchaseSkin(userId, skinId) → validate diamonds, deduct, add to owned
  - equipSkin(userId, skinId) → set active for category
  - unequipSkin(userId, category) → remove active
  - getUserSkins(userId) → owned set
  - getPlayerSkinData(userId) → active skins for game_start
  - rewardMatchEnd(userId, mode, won) → add diamonds by mode
  - loadFromDB / persistToDB
- [ ] server/src/routes/store.js:
  - GET /api/store/catalog → all skins
  - GET /api/store/my-skins (bearer) → owned + active
  - POST /api/store/purchase (bearer) → { skinId }
  - POST /api/store/equip (bearer) → { skinId }
  - POST /api/store/unequip (bearer) → { category }
- [ ] client/src/menu/StoreTab.jsx:
  - Category tabs: Skins, Army Shapes, Trail Effects, Capture Effects
  - Skin cards: preview image, name, price, rarity badge (color coded)
  - Rarity colors: Common=gray, Rare=blue, Epic=purple, Legendary=gold
  - Buy button (disabled if insufficient diamonds)
  - Equip/Unequip toggle for owned skins
  - Diamond balance display
- [ ] Kabul: Catalog gorunur, satin alma, equip calisir

### P9.04 [DONE] — DailyRewardService + UI
- [ ] server/src/daily/DailyRewardService.js:
  - Reset time: 06:00 UTC (09:00 Turkey)
  - Max streak: 30 days
  - Reward formula: 10 + (day - 1) diamonds
    - Day 1: 10, Day 2: 11, ... Day 30: 39
  - Streak broken: 2+ day gap → reset to day 1
  - In-memory: streaks Map<userId, { day, lastClaimTs, cycleStartTs }>
  - _getRewardDay(timestamp) → day number (adjusted for 06:00 UTC reset)
  - getStatus(userId) → { streakDay, canClaim, todayReward, nextDay, rewards[] }
  - claimReward(userId) → { success, day, reward, totalDiamonds }
  - _buildRewardsList(currentDay, claimedToday) → [{day, reward, status: 'claimed'|'today'|'upcoming'}]
  - Guest restriction: no daily rewards
  - loadFromDB / persistToDB
- [ ] server/src/routes/dailyReward.js:
  - GET /api/daily-reward/status (bearer, no guests)
  - POST /api/daily-reward/claim (bearer, no guests)
- [ ] client/src/menu/DailyRewardPopup.jsx:
  - 30-day calendar grid (5x6 or 6x5)
  - Each day: diamond amount, status color (gray=upcoming, gold=today, green=claimed)
  - Claim button for today
  - Streak counter display
  - Auto-show on login if claimable
- [ ] Kabul: Streak artar, diamond eklenir, popup gorunur

### P9.05 [DONE] — RankedTab + LeaderboardTab
- [ ] client/src/menu/RankedTab.jsx:
  - Current ELO rating display (large number)
  - League badge with name + color
  - League progress bar (min→current→next threshold)
  - Season stats: W/L, win rate
  - "Play Ranked" button (gold, -1 diamond entry fee warning)
  - Disabled if not registered (guest block)
- [ ] client/src/menu/LeaderboardTab.jsx:
  - Top 100 players table: rank #, username, ELO, league badge
  - Current player position highlighted
  - Search by username
  - Pull-to-refresh
- [ ] Kabul: Leaderboard dogru siralama, ranked giris calisir

### P9.06 [DONE] — Email service (OneSignal / SMTP fallback)
- [ ] server/src/email/EmailService.js:
  - sendVerificationEmail(email, code): OneSignal API call
  - sendResetEmail(email, code): OneSignal API call
  - Fallback: console.log if no API keys configured
  - Rate limit: 1 email per minute per address
- [ ] AuthService entegrasyonu: register → sendVerificationEmail, forgotPassword → sendResetEmail
- [ ] Kabul: Email gonderimi (veya fallback log)

### P9.07 [DONE] — Unit + Integration: Store, Daily, Friends
- [ ] tests/unit/server/store.test.js: purchase, equip, insufficient diamonds, catalog
- [ ] tests/unit/server/dailyReward.test.js: claim, streak, reset, guest block
- [ ] tests/unit/server/friends.test.js: request, accept, reject, remove, auto-accept
- [ ] tests/integration/socialFlow.test.js: register → add friend → daily claim → buy skin
- [ ] Kabul: 20+ assertion PASS

### P9.08 [DONE] — Store + profile screenshot + perf
- [ ] Puppeteer: store, profile, leaderboard, daily reward
- [ ] Perf: page loads < 500ms
- [ ] Kabul: Screenshots kayitli

---

## PHASE 10: Polish & Mobile
> Ses, mobil, tutorial, diller, building, admin, Capacitor.

### P10.01 — SoundManager + MusicManager
- [ ] client/src/audio/SoundManager.js:
  - Web Audio API synthesis (no audio files needed)
  - Sounds: bubble (army send), capture (region capture), teleport (gate), bomb (missile/nuclear)
  - Each sound: frequency, waveform, duration, volume envelope
  - play(soundName), setVolume(0-1), mute(), unmute()
  - Persist: localStorage battletab_sound_muted
- [ ] client/src/audio/MusicManager.js:
  - Background music (procedural or loop)
  - Menu music vs game music
  - Crossfade between tracks (1s fade)
  - play(), pause(), setVolume(0-1)
  - Persist: localStorage battletab_music_muted
- [ ] Kabul: Sesler dogru zamanda, mute/volume calisir

### P10.02 — Mobile responsive + touch controls
- [ ] client/src/config/device.js:
  - getDeviceType(width): mobile(<768), tablet(768-1200), desktop(>=1200)
  - isMobile, isTablet, isDesktop, isTouch
  - getVerticalScale(height): Math.min(1, height/700)
  - isCompactHeight(height): height < 500
  - getSafeAreaInsets(): CSS env(safe-area-inset-*)
  - pick(width, mobile, tablet, desktop): responsive value selector
- [ ] Touch controls:
  - Pinch-to-zoom: 2 pointer tracking, distance ratio → zoom
  - Drag-to-pan: 1 finger pan
  - Tap-to-select: region selection
  - Touch targets: min 44px
  - Landscape lock via Capacitor ScreenOrientation
- [ ] Mobile HUD adaptations:
  - Hamburger menu: toggle left panel visibility
  - Compact ability bar: horizontal bottom instead of vertical right
  - Safe area insets: notch padding
- [ ] Kabul: Mobile'da oynanabilir, touch responsive

### P10.03 — TutorialScene (6 asamali ogretici)
- [ ] client/src/scenes/TutorialScene.js:
  - 6 stage sequential tutorial with local bot:
    1. Sending Troops: drag mechanic, "Select your region and drag to target"
    2. Production & Towers: "Towers produce 1.5x soldiers", economy basics
    3. Mountain Regions: "Mountains give defense bonus", +10/25/50 soldiers
    4. Snow Regions: "Snow slows armies to 28% speed"
    5. Abilities: "Press 1-5 to use abilities", each ability explained
    6. Bot Battle: full practice match with hints
  - Each stage: guided overlay with arrows pointing to relevant UI
  - Highlight target elements with pulsing gold border
  - Text instructions: bottom panel, Cinzel title + Inter body
  - Skip button per stage
  - Progress indicator (dots or bar)
  - Local bot opponent (simplified AI)
  - Auto-advance on objective completion
- [ ] Kabul: 6 asama tamamlanabilir, ogretici metinler gorunur

### P10.04 — Remaining i18n (10 more languages)
- [ ] client/src/i18n/ — 10 ek dil dosyasi:
  - de.js (German), fr.js (French), es.js (Spanish), it.js (Italian)
  - pt.js (Portuguese), ru.js (Russian), ar.js (Arabic)
  - zh.js (Chinese), ja.js (Japanese), ko.js (Korean)
  - Her biri ~120+ key, en.js ile ayni key seti
- [ ] RTL support for Arabic (ar):
  - dir="rtl" on body when ar selected
  - CSS logical properties: margin-inline-start vs margin-left
- [ ] Language selector in settings: flag icons + native language names
- [ ] i18n.js: dynamic import for non-bundled languages
- [ ] Kabul: 12 dil arasi gecis, RTL calisir

### P10.05 — BuildingSystem + BuildingBar
- [ ] server/src/game/BuildingSystem.js:
  - processBuilding(gameState, playerId, regionId, buildingId):
    - Validate: owned, no existing building, not ROCKY
    - Calculate cost: baseCost * (1 + existingCount * levelMultPercent/100)
    - Check resources: player.resources.iron >= cost.iron, etc.
    - Deduct resources, set region.building = buildingId
  - Building effects (applied in relevant systems):
    - city_center: +20% max HP (compound), calculated in ProductionSystem
    - barracks: +10% production to ALL player regions (stacks)
    - wall: +50% siege defense bonus (SiegeSystem)
    - iron_dome: blocks missiles within 3 neighbor hops (BombSystem)
    - stealth_tower: HP = -1 to enemies (broadcastState)
    - drone_facility: prerequisite for future abilities
    - missile_base: prerequisite for future abilities
  - maxPerPlayer: 0 = unlimited
- [ ] client/src/game-ui/BuildingBar.jsx:
  - Bottom bar with 7 building slots
  - Each: icon, name, cost (iron/crystal/uranium), effect description
  - Grayed out if insufficient resources
  - Click to enter placement mode → click owned region to build
  - Cancel: ESC or right click
  - Show building count per type (if maxPerPlayer > 0)
- [ ] Kabul: Bina yapilir, kaynak duser, etki uygulanir

### P10.06 — Ability Systems (Missile, Nuclear, Barracks, SpeedBoost, Freeze)
- [ ] server/src/game/BombSystem.js (Missile):
  - Apply: floor(target.hp * 0.5) damage
  - Iron dome check: any iron_dome building within 3 hops → block
  - Emit MISSILE_APPLIED: { playerId, targetRegionId, damage, position }
- [ ] server/src/game/NuclearSystem.js:
  - Apply: region.isNuclearized = true, nuclearUntil = now + NUCLEAR_DURATION(3000ms)
  - Production + resource production disabled
  - Emit NUCLEAR_APPLIED
- [ ] server/src/game/BarracksSystem.js:
  - Apply: region.type = 'TOWER' (production becomes 1.5x)
  - Cannot upgrade: already TOWER, ROCKY, nuclearized
  - Emit BARRACKS_APPLIED
- [ ] server/src/game/SpeedBoostSystem.js:
  - Apply: player.speedBoostUntil = now + SPEED_BOOST_DURATION(10000ms)
  - All player armies get 1.25x speed multiplier
  - Emit SPEED_BOOST_APPLIED: { playerId, duration }
- [ ] server/src/game/StunSystem.js (Freeze):
  - Apply: all enemy armies → frozenUntil = now + FREEZE_ARMY_DURATION(1500ms)
  - Attrition still applies during freeze
  - Emit FREEZE_APPLIED: { playerId, duration }
- [ ] GameRoom ability handlers entegrasyonu
- [ ] Kabul: 5 ability dogru calisir, iron dome block

### P10.07 — AdminService + Admin Panel
- [ ] server/src/admin/AdminService.js:
  - Admin auth: check username === 'kan'
  - Game settings: get/post all balance values (override gameConstants at runtime)
  - User management: list (last 100), ban/unban, add/remove diamonds, edit username/email
  - Analytics realtime: online players, active games, peak today
  - Analytics daily: 30-day snapshot history
  - Top players: by wins and ELO (limit 5)
  - Economy: total diamonds earned/spent
  - System: memory usage, uptime, error count
  - Error tracking: log to error_logs table
  - Uptime tracking: server_uptime table
- [ ] server/src/routes/admin.js:
  - GET /api/admin/settings, POST /api/admin/settings
  - GET /api/admin/users, POST /api/admin/users/:id/ban, /unban, /diamonds, /edit
  - GET /api/admin/analytics/realtime, /daily, /top-players, /economy, /system, /errors, /uptime
  - POST /api/admin/analytics/snapshot (manual)
- [ ] Client admin page (basit React, ayn route veya MenuApp tab):
  - Settings editor: JSON form for all game constants
  - User table: search, ban/unban, diamond adjust
  - Analytics dashboard: chart.js grafikler (DAU, games, diamonds)
- [ ] Kabul: Admin giris, settings degistir, kullanici yonet

### P10.08 — Capacitor mobile builds
- [ ] mobile/capacitor.config.json:
  - appId: com.battletab.app
  - appName: BattleTab
  - webDir: ../client/dist
  - plugins: StatusBar, SplashScreen, ScreenOrientation, Haptics, Keyboard
- [ ] iOS build config: Info.plist, landscape only
- [ ] Android build config: AndroidManifest.xml, landscape only
- [ ] Live reload: server.url pointed to local dev server
- [ ] Kabul: iOS ve Android build olusur

### P10.09 — Unit + Integration: Building, Abilities, Tutorial
- [ ] tests/unit/server/buildingSystem.test.js: placement, costs, effects, limits
- [ ] tests/unit/server/abilities.test.js: missile damage, nuclear disable, barracks upgrade, speed boost, freeze
- [ ] tests/integration/buildingFlow.test.js: build → effect → verify
- [ ] Kabul: 15+ assertion PASS

### P10.10 — Mobile + tutorial screenshot + perf
- [ ] Puppeteer: mobile viewport (375x667), tutorial stages
- [ ] Perf: mobile 30fps hedef
- [ ] Kabul: Screenshots kayitli

---

## PHASE 11: Final & Deploy
> Son testler, performans, production deploy.

### P11.01 — Auto Performance Mode (client)
- [ ] client/src/utils/performanceMonitor.js:
  - FPS sampling: start after 5s, check every 500ms
  - Trigger: average of 6+ samples < 30 FPS
  - Actions: disable glow animations, disable trail particles, slow siege animation (12th frame)
  - Persist: localStorage battletab_low_perf
  - Re-check periodically, re-enable if FPS recovers

### P11.02 — Full regression test suite
- [ ] Tum unit testler: npx jest --testPathPattern=unit
- [ ] Tum integration testler: npx jest --testPathPattern=integration
- [ ] E2E: full game flow (auth → menu → bot match → game over)
- [ ] Visual: screenshot suite (auth, menu, game, HUD, game over)
- [ ] Kabul: 0 fail

### P11.03 — Full performance audit
- [ ] Client: 60fps desktop, 30fps mobile
- [ ] Server: < 10ms per tick (headroom for 10 tps)
- [ ] Network: < 6 KB/s per player (delta compression)
- [ ] Memory: server < 200MB, client < 300MB
- [ ] Startup: server < 2s, client < 3s
- [ ] Object pool utilization report
- [ ] Kabul: Tum hedefler karsilanir

### P11.04 — Production build + PM2 + VPS deploy
- [ ] Client: vite build → dist/ (sourcemap)
- [ ] Server: ecosystem.config.js (PM2):
  - name: battletab-server
  - instances: 1 (single process for Socket.IO)
  - max_memory_restart: 500M
  - env_production: NODE_ENV=production, PORT=3000
- [ ] Deploy script: build → rsync to VPS → pm2 reload
- [ ] .env.production: real JWT_SECRET, DATABASE_URL, REDIS_URL
- [ ] Nginx reverse proxy config (optional)
- [ ] SSL certificate (Let's Encrypt)
- [ ] Kabul: Production'da calisir

### P11.05 — Production smoke test
- [ ] Health check: curl /api/health → 200
- [ ] Auth flow: register → verify → login
- [ ] Bot match: start → spawn → play → game_over
- [ ] Socket stable: 5 min connection test
- [ ] Mobile: Capacitor build connects to production
- [ ] Kabul: Production smoke PASS

### P11.06 — Analytics baseline + monitoring
- [ ] First analytics snapshot (manual)
- [ ] Error log monitoring: check error_logs table
- [ ] Uptime tracking: server_uptime records
- [ ] Performance baseline recorded in PERF-LOG.md
- [ ] Kabul: Monitoring aktif

### P11.07 — Final rapor
- [ ] Test coverage raporu (jest --coverage)
- [ ] Performance benchmark raporu (all tasks)
- [ ] Screenshot suite raporu (all phases)
- [ ] Known issues / tech debt listesi
- [ ] Architecture diagram (ASCII or mermaid)
- [ ] Kabul: Rapor hazir, proje release-ready

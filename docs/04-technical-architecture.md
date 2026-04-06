# 04 - Technical Architecture

> Complete technical reference for rebuilding KUST 10 - Pillows from scratch.
> Version: 0.14.0 | Last updated: 2026-04-06

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Server Stack](#2-server-stack)
3. [Client Stack](#3-client-stack)
4. [Network Protocol](#4-network-protocol)
5. [Performance Optimizations](#5-performance-optimizations)
6. [Rendering Pipeline](#6-rendering-pipeline)
7. [Game Loop](#7-game-loop)
8. [Authentication System](#8-authentication-system)
9. [Database Schema](#9-database-schema)
10. [Deployment](#10-deployment)
11. [Anti-Cheat / Security](#11-anti-cheat--security)
12. [Admin Panel](#12-admin-panel)
13. [Matchmaking System](#13-matchmaking-system)
14. [Building System](#14-building-system)
15. [Abilities System](#15-abilities-system)
16. [Cosmetics / Store](#16-cosmetics--store)

---

## 1. Project Structure

### 1.1 Directory Layout

```
kust-project-application/
├── client/                     # PhaserJS + React frontend
│   ├── public/                 # Static assets (images, sounds, fonts)
│   ├── src/
│   │   ├── audio/              # MusicManager, SoundManager
│   │   ├── auth/               # AuthApp.jsx (React login/register UI), BattleCanvas.js
│   │   ├── config/             # maps.js (map definitions), version.js
│   │   ├── entities/           # Army.js, Region.js, Player.js (client data models)
│   │   ├── game-ui/            # GameHUD.jsx, BuildingBar.jsx, GameBridge.js (React overlay)
│   │   ├── i18n/               # en.js, tr.js (internationalization)
│   │   ├── menu/               # MenuApp.jsx (React main menu)
│   │   ├── network/            # SocketManager.js, GameSync.js, EventTypes.js
│   │   ├── scenes/             # Phaser scenes (Boot, Menu, Lobby, Game, GameOver, Tutorial, Friends)
│   │   ├── services/           # AuthService.js (client-side auth state)
│   │   ├── systems/            # MapRenderer, ArmyRenderer, SelectionSystem, CameraSystem, AbilityBar, GateRenderer, SiegeRenderer, DOMFogManager
│   │   ├── ui/                 # Shared UI components
│   │   ├── utils/              # colors.js, math.js, device.js
│   │   └── index.js            # Entry point (orchestrates Auth -> Menu -> Phaser)
│   ├── index.html              # SPA shell with #game, #menu-root, #auth-root, #bg-canvas
│   ├── package.json
│   └── vite.config.js
├── server/                     # Express + Socket.IO backend
│   ├── db/migrations/          # SQL migration files (001-006)
│   ├── src/
│   │   ├── admin/              # adminRoutes.js (admin panel API + game settings)
│   │   ├── analytics/          # AnalyticsService.js (realtime + daily snapshots)
│   │   ├── auth/               # AuthService.js, authRoutes.js
│   │   ├── config/             # index.js (env config), database.js (PostgreSQL), redis.js
│   │   ├── daily/              # DailyRewardService.js, dailyRewardRoutes.js
│   │   ├── email/              # Email sending (OneSignal integration)
│   │   ├── friends/            # friendRoutes.js (friend system)
│   │   ├── game/               # Core game logic
│   │   │   ├── Army.js         # Server army entity with pathfinding
│   │   │   ├── BotAI.js        # AI decision making
│   │   │   ├── BuildingCatalog.js  # Building definitions
│   │   │   ├── BombSystem.js   # Missile ability logic
│   │   │   ├── NuclearSystem.js    # Nuclear ability logic
│   │   │   ├── BarracksSystem.js   # Barracks ability logic
│   │   │   ├── SpeedBoostSystem.js # Speed boost ability logic
│   │   │   ├── FreezeSystem.js     # Freeze ability logic
│   │   │   ├── CollisionSystem.js  # Army-vs-army collision
│   │   │   ├── ConquestSystem.js   # Army arrival + siege initiation
│   │   │   ├── SiegeSystem.js      # Multi-player tug-of-war combat
│   │   │   ├── GameLoop.js         # Tick loop (Production -> Movement -> Collision -> Conquest -> Siege -> Gates -> WinCondition)
│   │   │   ├── GameRoom.js         # Room lifecycle + event handling
│   │   │   ├── GameState.js        # Centralized state container
│   │   │   ├── GateSystem.js       # Teleportation portals
│   │   │   ├── MapGenerator.js     # Voronoi map generation
│   │   │   ├── MovementSystem.js   # Army movement per tick
│   │   │   ├── PathfindingSystem.js # Waypoint computation around rocky regions
│   │   │   ├── Player.js           # Server player entity
│   │   │   ├── ProductionSystem.js  # Soldier + resource production
│   │   │   ├── Region.js           # Server region entity
│   │   │   ├── VisibilitySystem.js  # Fog of war BFS computation
│   │   │   ├── WinCondition.js      # Elimination / last-player-standing check
│   │   │   ├── constants.js         # Re-exports shared/gameConstants.js
│   │   │   └── maps/               # JSON map data (turkey.json, poland.json, china.json)
│   │   ├── matchmaking/        # MatchmakingService.js, BotMatchService.js
│   │   ├── ranking/            # RankingService.js (ELO system)
│   │   ├── routes/             # health.js (health check endpoint)
│   │   ├── socket/             # Socket.IO setup
│   │   │   ├── index.js        # Socket.IO server configuration
│   │   │   └── handlers/       # gameHandler.js, lobbyHandler.js
│   │   ├── store/              # StoreService.js, SkinCatalog.js, storeRoutes.js
│   │   ├── utils/              # idGenerator.js, math.js, gameLogger.js
│   │   └── index.js            # Server entry point
│   └── package.json
├── shared/                     # Shared between client and server
│   ├── gameConstants.js        # All game balance constants
│   ├── eventTypes.js           # Socket event name constants
│   ├── regionTypes.js          # Region type enums
│   └── version.js              # { version, date, changelog }
├── mobile/                     # Capacitor mobile wrapper
├── tests/                      # Integration / E2E tests
├── docs/                       # Documentation
├── handover-docs/              # Handover documentation
└── claude_documentations/      # Development documentation
```

### 1.2 Module Systems

| Component | Module System | Reason |
|-----------|--------------|--------|
| Server (`server/`) | **CommonJS** (`require`/`module.exports`) | Node.js default, no build step needed |
| Client (`client/`) | **ESM** (`import`/`export`) | Vite requires ESM, tree-shaking support |
| Shared (`shared/`) | **CommonJS** | Must be importable by server; client accesses via server transmission |

### 1.3 File Naming Conventions

- **Services**: PascalCase (`AuthService.js`, `MatchmakingService.js`)
- **Systems**: PascalCase (`MovementSystem.js`, `ProductionSystem.js`)
- **Entities**: PascalCase (`Army.js`, `Region.js`, `Player.js`)
- **Routes**: camelCase (`authRoutes.js`, `friendRoutes.js`)
- **React components**: PascalCase `.jsx` (`GameHUD.jsx`, `BuildingBar.jsx`)
- **Config files**: camelCase (`gameConstants.js`, `maps.js`)
- **SQL migrations**: Numbered prefix (`001_create_users.sql`)

---

## 2. Server Stack

### 2.1 Express.js Setup

```javascript
// Port: process.env.PORT || 3000
// Middleware stack (in order):
1. helmet()                     // Security headers
2. cors({ origin: corsOrigin }) // CORS - supports web + Capacitor origins
3. express.json()               // JSON body parser

// CORS Origins (array):
// - config.cors.origin (from CORS_ORIGIN env var, default '*')
// - 'capacitor://localhost'
// - 'https://localhost'
// - 'http://localhost'
```

**API Routes:**
| Route | Handler | Purpose |
|-------|---------|---------|
| `GET /` | inline | Root endpoint (returns server name + version) |
| `/api` | healthRoutes | Health check |
| `/api/auth` | authRoutes | Login, register, guest, verify email, reset password |
| `/api/ranking` | rankingRoutes | Leaderboard, player profiles |
| `/api/friends` | friendRoutes | Friend requests, friend list |
| `/api/store` | storeRoutes | Skin catalog, purchase, equip/unequip |
| `/api/daily-reward` | dailyRewardRoutes | Daily reward status, claim |
| `/api/admin` | adminRoutes | Admin panel (game settings, user management, analytics) |

### 2.2 Socket.IO Configuration

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: /* same array as Express CORS */,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],     // WebSocket-only: skip HTTP polling handshake (100-200ms faster)
  allowUpgrades: false,          // No upgrade dance: connect directly via WebSocket
  pingTimeout: 60000,            // 60s before considering client disconnected
  pingInterval: 25000,           // Ping every 25s
  maxHttpBufferSize: 1e5,        // 100KB max payload (prevent large payload attacks)
  perMessageDeflate: {
    threshold: 256,              // Compress messages > 256 bytes
    zlibDeflateOptions: { level: 1 }, // Fast compression (speed priority)
  },
});
```

**Key design decisions:**
- WebSocket-only transport (no polling fallback) saves 100-200ms on initial connection
- Per-message deflate enabled for bandwidth reduction on state updates
- 100KB max buffer size prevents denial-of-service via oversized payloads

### 2.3 PostgreSQL Configuration

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/pillows',
  max: 10,                      // Max 10 connections in pool
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Connection timeout 5s
});
```

**Graceful degradation:** The server works without PostgreSQL. All services (`AuthService`, `StoreService`, `DailyRewardService`, `AnalyticsService`) maintain in-memory state and persist to DB when available. DB connection failures are caught and logged, not fatal.

### 2.4 Redis Configuration

```javascript
const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});
```

**Current usage:** Redis connection is established but primarily serves as a future-ready cache layer. All game state is kept in-memory within the Node.js process. Redis is non-blocking on failure.

### 2.5 Environment Variables

```
PORT=3000                       # Server port
NODE_ENV=development            # Environment
DATABASE_URL=postgresql://...   # PostgreSQL connection string
REDIS_URL=redis://localhost:6379 # Redis connection string
JWT_SECRET=<strong-secret>      # JWT signing secret (MUST change in production)
JWT_EXPIRES_IN=7d               # Token expiration
CORS_ORIGIN=*                   # Allowed origins (* for development)
ONESIGNAL_APP_ID=<app-id>      # OneSignal for email notifications
ONESIGNAL_API_KEY=<api-key>    # OneSignal API key
```

### 2.6 Graceful Shutdown

The server handles `SIGTERM`, `SIGINT`, and `uncaughtException`:

1. Record shutdown in analytics
2. Close all active game rooms (determine winner by most regions)
3. Close Socket.IO connections
4. Close HTTP server
5. Close Redis connection
6. Close PostgreSQL pool
7. Force exit after 10-second timeout

### 2.7 Server Dependencies

```json
{
  "bcryptjs": "^2.4.3",        // Password hashing
  "cors": "^2.8.5",            // CORS middleware
  "dotenv": "^16.3.1",         // Environment variables
  "express": "^4.18.2",        // HTTP framework
  "helmet": "^7.1.0",          // Security headers
  "ioredis": "^5.3.2",         // Redis client
  "jsonwebtoken": "^9.0.3",    // JWT tokens
  "nanoid": "^3.3.7",          // Unique ID generation (nanoid v3 for CJS compatibility)
  "pg": "^8.11.3",             // PostgreSQL client
  "socket.io": "^4.7.2"        // WebSocket server
}
```

---

## 3. Client Stack

### 3.1 PhaserJS Configuration

**Version:** Phaser 3.70.0

```javascript
const config = {
  type: Phaser.AUTO,              // Auto-detect WebGL or Canvas
  parent: 'game',                 // DOM container ID
  backgroundColor: '#134e6f',     // Ocean blue background
  scene: [BootScene, MenuScene, LobbyScene, GameScene, GameOverScene, TutorialScene, FriendsScene],
  scale: {
    mode: Phaser.Scale.RESIZE,    // Responsive: fills parent container
    parent: 'game',
    width: '100%',
    height: '100%',
  },
  dom: { createContainer: true }, // Enable DOM elements in Phaser
  input: {
    activePointers: 3,            // Support up to 3 simultaneous touch points
    mouse: { preventDefaultWheel: true },
    touch: { capture: true },
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    transparent: false,           // Disable alpha channel on main canvas (performance)
  },
  resolution: 1,
};
```

### 3.2 React + Phaser Coexistence

The application uses a **hybrid architecture** where React handles all menu UI and in-game HUD overlays, while Phaser handles the game world rendering.

**DOM Structure:**
```html
<body>
  <canvas id="bg-canvas"></canvas>           <!-- Animated background (auth/menu) -->
  <div id="auth-root"></div>                 <!-- React: Login/Register/Guest -->
  <div id="menu-root"></div>                 <!-- React: Main menu, map selection -->
  <div id="game" style="display:none">       <!-- Phaser canvas container -->
    <div id="game-ui-root"></div>            <!-- React: In-game HUD overlay -->
  </div>
</body>
```

**Communication:** Phaser and React communicate through `GameBridge.js`, a simple event emitter with "sticky" events (late subscribers receive the last emitted value):

```
Phaser GameScene  <--GameBridge-->  React GameHUD
   emit('game:stats', data)  -->  on('game:stats', handler)
   emit('game:timer', time)  -->  on('game:timer', handler)
   on('hud:quit', handler)   <--  emit('hud:quit')
   on('building:mode', fn)   <--  emit('building:mode', buildingId)
```

**Key Bridge Events (Phaser -> React):**
| Event | Payload | Purpose |
|-------|---------|---------|
| `game:init` | `{ myPlayerId, gameMode, mapId, players }` | Initial game state |
| `game:stats` | `{ players, regions, armies }` | Player region counts, army counts |
| `game:timer` | `number` (ms) | Game elapsed time (every 1s) |
| `game:fps` | `number` | FPS counter (every 500ms) |
| `game:config` | `{ buildingCosts, attackRange, fogDepth }` | Server game config |
| `game:spawnPhase` | `{ active, seconds }` | Spawn selection countdown |
| `game:regionHover` | `{ regionId, hp, type, building, ... }` or `null` | Tooltip data |
| `game:toast` | `{ message, options }` | Toast notification |
| `ping_update` | `number` (ms) | Network latency |
| `settings:changed` | `{ glow, fps }` | Settings toggles |

**Key Bridge Events (React -> Phaser):**
| Event | Payload | Purpose |
|-------|---------|---------|
| `hud:quit` | none | Return to menu |
| `building:mode` | `string` (buildingId) | Enter building placement mode |
| `building:confirm` | `{ regionId }` | Confirm building placement |
| `camera:focus` | `{ x, y }` | Pan camera to coordinates |

### 3.3 Application Lifecycle

```
init() (index.js)
  ├── initMobilePlatform()           // Capacitor: hide status bar, lock landscape
  ├── authService.isLoggedIn()?
  │   ├── YES -> showMenu()          // Render React MenuApp
  │   └── NO  -> showAuth()          // Render React AuthApp
  │
  showAuth()
  │   ├── renderAuth() (React)       // Login, Register, Guest forms
  │   └── on success -> showMenu()
  │
  showMenu()
  │   ├── createBackground()         // Animated BattleCanvas on bg-canvas
  │   ├── musicManager.play()        // Start menu music
  │   └── renderMenu() (React)       // Mode selection, map selection, queue
  │       └── on matchFound -> startPhaser(gameData)
  │
  startPhaser(gameData)
  │   ├── musicManager.pause()
  │   ├── destroyBackground()
  │   ├── Hide menu-root, auth-root
  │   ├── Show #game
  │   ├── Dynamic import all Phaser scenes
  │   ├── new Phaser.Game(config)
  │   ├── renderGameHUD() (React)    // Mount React HUD overlay
  │   └── window.__kustReturnToMenu = () => {
  │       ├── socket.disconnect()
  │       ├── gameBridge.clear()
  │       ├── hudRoot.unmount()
  │       ├── game.destroy(true)
  │       ├── musicManager.resume()
  │       └── showMenu()
  │   }
```

### 3.4 Vite Build Configuration

```javascript
export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [react()],           // @vitejs/plugin-react for JSX
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {           // Proxy WebSocket to backend during dev
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,            // Source maps in production for debugging
  },
});
```

### 3.5 Client Dependencies

```json
{
  "@capacitor/core": "^6.1.0",           // Mobile wrapper
  "@capacitor/haptics": "^6.0.0",        // Vibration feedback
  "@capacitor/keyboard": "^6.0.0",       // Keyboard management
  "@capacitor/screen-orientation": "^6.0.0", // Lock landscape
  "@capacitor/splash-screen": "^6.0.0",  // Splash screen
  "@capacitor/status-bar": "^6.0.0",     // Status bar
  "@vitejs/plugin-react": "^4.7.0",      // React plugin for Vite
  "chart.js": "^4.5.1",                  // Charts (admin panel)
  "phaser": "^3.70.0",                   // Game engine
  "react": "^19.2.4",                    // UI framework
  "react-chartjs-2": "^5.3.1",          // React Chart.js wrapper
  "react-dom": "^19.2.4",               // React DOM renderer
  "socket.io-client": "^4.7.2"          // WebSocket client
}
```

---

## 4. Network Protocol

### 4.1 Socket Connection (Client)

```javascript
this.socket = io(serverUrl || undefined, {
  transports: ['websocket'],   // WebSocket-only (matches server)
  upgrade: false,              // No polling-to-WS upgrade
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,      // 500ms between reconnection attempts
  forceNew: true,              // Always create fresh connection
});
// Connection timeout: 5 seconds (manual)
```

### 4.2 All Socket Events

#### Client -> Server

| Event | Payload | Rate Limited | Description |
|-------|---------|-------------|-------------|
| `join_lobby` | `{ mode, username, mapType?, token? }` | No | Join matchmaking queue |
| `leave_lobby` | none | No | Leave queue/room |
| `player_ready` | none | No | Signal ready in lobby |
| `send_soldiers` | `{ sourceIds: string[], targetId: string }` | Yes (5/s) | Send armies from regions to target |
| `build_building` | `{ regionId, buildingId }` | Yes (5/s) | Build a building on owned region |
| `recall_army` | `{ armyId }` | Yes (5/s) | Recall army to nearest owned region |
| `use_missile` | `{ targetRegionId }` | Yes (5/s) | Fire missile at enemy region |
| `use_nuclear` | `{ targetRegionId }` | Yes (5/s) | Nuclear strike on enemy region |
| `use_barracks` | `{ targetRegionId }` | Yes (5/s) | Barracks upgrade on own region |
| `use_speed_boost` | none | Yes (5/s) | Activate speed boost (self) |
| `use_freeze` | none | Yes (5/s) | Freeze all enemy armies |
| `select_spawn` | `{ regionId }` | Yes (5/s) | Select spawn location |
| `ping_check` | `timestamp (number)` | No | Latency measurement |

#### Server -> Client

| Event | Payload | Frequency | Description |
|-------|---------|-----------|-------------|
| `pong_check` | `timestamp (number)` | On request | Ping response |
| `queue_update` | `{ mode, position, queueSize, message? }` | On change | Queue position update |
| `match_found` | `{ roomId, players[], mapType }` | Once | Match created |
| `lobby_update` | `{ players[], status }` | On change | Lobby state |
| `game_countdown` | `{ seconds }` | Every 1s | Pre-game countdown (3s) |
| `game_start` | See 4.3 | Once | Full initial game state |
| `spawn_selected` | `{ playerId, regionId, previousRegionId, playerUsername }` | On action | Player chose spawn |
| `spawn_phase_end` | `{ selections: { playerId: regionId } }` | Once | Spawn phase complete |
| `regions_reveal` | `{ regions[] }` | Once | Full region data after spawn (fog-filtered) |
| `state_update` | See 4.4 | Every tick (100ms) | Delta game state |
| `army_created` | See 4.5 | On action | New army created (fog-filtered per player) |
| `army_destroyed` | `{ armyId, destroyedBy }` | On event | Army destroyed |
| `region_captured` | `{ regionId, newOwnerId, previousOwnerId }` | On event | Region ownership changed |
| `player_eliminated` | `{ playerId, eliminatedBy }` | On event | Player lost all regions |
| `siege_started` | `{ regionId, attackerId }` | On event | Siege begins on region |
| `siege_ended` | `{ regionId, reason, playerId? }` | On event | Siege resolved |
| `gate_teleport` | `{ armyId, fromGateId, toGateId, fromPosition, toPosition, newTarget, color, colorHex }` | On event | Army teleported through gate |
| `missile_applied` | `{ playerId, targetRegionId, damage, position }` | On action | Missile hit (fog-filtered) |
| `nuclear_applied` | `{ playerId, targetRegionId, position }` | On action | Nuclear hit (fog-filtered) |
| `barracks_applied` | `{ playerId, targetRegionId, position }` | On action | Barracks used (fog-filtered) |
| `speed_boost_applied` | `{ playerId, duration }` | On action | Speed boost activated (self only) |
| `freeze_applied` | `{ playerId, duration }` | On action | Freeze activated (broadcast to all) |
| `ability_granted` | `{ playerId, ability, regionId }` | On capture | Ability charge gained |
| `game_over` | See 4.6 | Once | Game finished |
| `ranking_update` | `{ oldRating, newRating, ratingChange, rank, oldRank }` | Once | ELO change (ranked only) |
| `diamond_reward` | `{ diamonds, total }` | Once | Diamond reward for match end |
| `diamond_update` | `{ diamonds }` | On change | Diamond balance update |
| `promotion_reward` | `{ rank, reward, total }` | On promotion | League promotion reward |
| `error` | `{ message }` | On error | Error message |

### 4.3 `game_start` Payload

```javascript
{
  myPlayerId: 'player_abc123',
  mode: 'normal',                    // 'normal' | 'bot' | '4player' | 'ranked'
  mapType: 'turkey',
  spawnPhase: true,                  // Always true (spawn selection first)
  spawnSeconds: 15,                  // SPAWN_SELECTION_SECONDS
  gameConfig: {
    buildingCosts: {                 // Per-building costs (admin-overridable)
      city_center: { iron: 80, crystal: 80, uranium: 40 },
      barracks: { iron: 60, crystal: 30, uranium: 30 },
      wall: { iron: 40, crystal: 20, uranium: 10 },
      // ... etc
    },
    buildingLevelCostMultiplier: 50, // 50% increase per additional building of same type
    attackRange: 1,                  // Hop distance for army sending
    fogDepth: 2,                     // BFS depth for visibility
  },
  map: {
    width: 1600,                     // Map width in pixels
    height: 900,                     // Map height in pixels
    mapType: 'turkey',
    regions: [                       // During spawn phase: minimal data (no HP/type/resource)
      {
        id: 'region_001',
        center: { x: 400, y: 300 },
        vertices: [{ x: 380, y: 280 }, { x: 420, y: 280 }, ...],
        neighbors: ['region_002', 'region_003'],
        name: 'Istanbul',
        type: 'NORMAL',             // Always 'NORMAL' during spawn (real type hidden)
        hp: 0,                       // Always 0 during spawn
        defenseBonus: 0,
        speedMultiplier: 1.0,
        resourceType: null,          // Hidden during spawn
        resourceRate: 0,
        building: null,
      },
      // ... all regions
    ],
    gates: [
      {
        id: 'gate_abc',
        pairId: 'gate_def',
        pairGroupId: 'gatepair_001',
        regionId: 'region_015',
        color: 'purple',
        colorHex: 0xBB44FF,
        position: { x: 500, y: 400 },
      },
      // ... paired gate
    ],
  },
  players: [
    {
      id: 'player_abc123',
      username: 'PlayerOne',
      color: '#E94560',
      colorIndex: 0,
      isBot: false,
      skinData: { skin: { color: '#1a1a1a' }, army_shape: { shape: 'star' } } | null,
      // ... player data
    },
    // ... other players
  ],
  armies: [],                        // Always empty at game start
}
```

### 4.4 `state_update` Payload (Per-Player, Fog-Filtered)

```javascript
{
  // Delta regions: ONLY regions that changed since last tick
  regions: [
    {
      id: 'region_001',
      hp: 45,                        // -1 if stealth_tower + enemy = hidden
      ownerId: 'player_abc123',
      nuclearized: false,
      abilityGranted: true,
      building: 'wall' | null,
      stealthed: true | undefined,   // Only set if stealth_tower hides HP from this player
      siegeForces: { 'player_def456': 20 },
      siegeEntryPoints: [{ x: 410, y: 310, playerId: 'player_def456' }],
    },
    // ... only dirty regions
  ],

  // Army lifecycle
  destroyedArmies: ['army_001', 'army_002'],  // IDs of armies no longer active

  // Army count changes only (NO positions - client predicts positions)
  armyUpdates: [
    { id: 'army_003', c: 18 },  // Count changed due to attrition/collision
  ],

  // Newly revealed regions (fog lifted - full resource/building data)
  revealedRegions: [
    {
      id: 'region_020',
      resourceType: 'iron',
      resourceRate: 0.9,
      building: 'barracks',
      type: 'MOUNTAIN',
      defenseBonus: 25,
    },
  ],

  // Embedded events (processed inline, not as separate socket events)
  events: [
    { type: 'region_captured', data: { regionId, newOwnerId, previousOwnerId } },
    { type: 'player_eliminated', data: { playerId, eliminatedBy } },
    { type: 'ability_granted', data: { playerId, ability, regionId } },
  ],

  // Player data (ONLY every 5th tick for bandwidth optimization)
  players: [                         // undefined on 4 out of 5 ticks
    // For SELF:
    {
      id: 'player_abc123',
      username: 'PlayerOne',
      isBot: false,
      missileCharges: 2,
      missileCooldownEnd: 1712345678000,
      nuclearCharges: 1,
      nuclearCooldownEnd: 0,
      barracksCharges: 0,
      barracksCooldownEnd: 0,
      speedBoostCharges: 1,
      speedBoostCooldownEnd: 0,
      speedBoostUntil: 0,
      eliminated: false,
      colorIndex: 0,
      regionCount: 5,
      resources: { iron: 23.4, crystal: 12.1, uranium: 8.7 },
    },
    // For ENEMIES: minimal data (no charges, no cooldowns, no resources)
    {
      id: 'player_def456',
      username: 'EnemyBot',
      isBot: true,
      eliminated: false,
      colorIndex: 1,
      regionCount: 3,
    },
  ],

  tickCount: 450,
  gameTime: 45000,                   // ms since game start (server-authoritative)
}
```

### 4.5 `army_created` Payload

```javascript
{
  id: 'army_xyz789',
  ownerId: 'player_abc123',
  count: 20,
  position: { x: 410, y: 305 },     // Spawn position (closest edge of source region)
  target: { x: 520, y: 380 },       // Immediate target (may be gate waypoint)
  targetRegionId: 'region_010',
  speed: 25,                         // pixels per second
  arrived: false,
  destroyed: false,
  // Pathfinding waypoints (if rocky regions to avoid)
  waypoints: [{ x: 450, y: 340 }, { x: 490, y: 360 }],  // optional
  finalTarget: { x: 520, y: 380 },  // Final destination (if waypoints/gate routing)
}
```

### 4.6 `game_over` Payload

```javascript
{
  winnerId: 'player_abc123',
  winnerName: 'PlayerOne',
  duration: 120,                     // seconds
  finalState: {                      // Full serialized game state
    regions: { ... },
    armies: { ... },
    players: { ... },
    tickCount: 1200,
    gameStatus: 'finished',
    winnerId: 'player_abc123',
  },
  rankingData: {                     // Only for ranked matches
    winner: { oldRating: 1200, newRating: 1225, ratingChange: 25 },
    loser: { oldRating: 1180, newRating: 1160, ratingChange: -20 },
  } | null,
}
```

### 4.7 Event Flow: Player Joins Game

```
Client                           Server
  │                                │
  ├─ join_lobby ─────────────────> │  lobbyHandler validates mode, username, mapType
  │  { mode, username, mapType }   │  Sanitize username (strip HTML, 1-20 chars)
  │                                │  For ranked: validate JWT, check diamonds, deduct 1 diamond
  │                                │  matchmakingService.addToQueue()
  │                                │
  │ <── queue_update ──────────────┤  { mode, position: 1, queueSize: 1 }
  │                                │
  │                                │  ... another player joins same mode ...
  │                                │  matchmakingService.checkMatch() triggers
  │                                │  GameRoom created, players added
  │                                │
  │ <── match_found ───────────────┤  { roomId, players: ['P1', 'P2'], mapType }
  │                                │
  │                                │  room.startCountdown() auto-triggers
  │ <── game_countdown { 3 } ──────┤
  │ <── game_countdown { 2 } ──────┤
  │ <── game_countdown { 1 } ──────┤
  │                                │  room.startGame() -> generateMap()
  │                                │
  │ <── game_start ────────────────┤  Full initial game state (see 4.3)
  │                                │  gameStatus = 'spawn_selection'
  │                                │
  │  (800ms delay for scene transition)
  │                                │  _startSpawnSelection() begins
  │                                │  15-second countdown
  │                                │
  ├─ select_spawn ────────────────>│  Player picks starting region
  │  { regionId }                  │
  │ <── spawn_selected ────────────┤  Broadcast to all players
  │                                │
  │                                │  ... 15 seconds pass ...
  │                                │  _endSpawnSelection()
  │                                │  Auto-assign unselected players
  │                                │  Grant random starting ability
  │                                │
  │ <── spawn_phase_end ───────────┤  { selections: { pid: regionId } }
  │ <── regions_reveal ────────────┤  Full region data (fog-filtered per player)
  │                                │
  │                                │  gameStatus = 'preview' (3.2s delay)
  │                                │  gameStatus = 'playing'
  │                                │  GameLoop.start() -> tick every 100ms
  │                                │
  │ <── state_update ──────────────┤  Every 100ms (10 ticks/second)
```

### 4.8 Event Flow: Player Sends Soldiers

```
Client                           Server
  │                                │
  │  Player drags from source to   │
  │  target region                 │
  │                                │
  ├─ send_soldiers ───────────────>│  gameHandler: rate limit check (5/s)
  │  { sourceIds: ['r1','r2'],     │  Validate: data shape, string types
  │    targetId: 'r5' }           │  Max 12 source regions per send
  │                                │  room.onSendSoldiers(playerId, sourceIds, targetId)
  │                                │
  │                                │  Validation:
  │                                │  - Game status === 'playing'
  │                                │  - Player not eliminated
  │                                │  - Target exists, not gate, not ROCKY
  │                                │  - Target visible to player (fog check)
  │                                │
  │                                │  Per source region:
  │                                │  - Owned by player
  │                                │  - HP >= 2 (need at least 2 to split)
  │                                │  - Within attackRange hops of target (BFS)
  │                                │  - Send floor(HP * 0.5) soldiers
  │                                │  - Spawn position = closest edge point to target
  │                                │  - Arrival position = closest edge point on target
  │                                │  - Apply gate routing if shorter
  │                                │  - Compute pathfinding waypoints around rocky regions
  │                                │
  │ <── army_created ──────────────┤  Per-player fog-filtered:
  │  (fog-filtered per player)     │  - Own armies: always sent
  │                                │  - Enemy armies: only if target or source visible
```

### 4.9 Event Flow: Region Captured (via Siege)

```
Server (GameLoop._tick):
  │
  ├── ProductionSystem.tick()      # Regions produce soldiers
  ├── MovementSystem.tick()        # Armies move toward targets
  ├── CollisionSystem.tick()       # Enemy armies collide (subtract counts)
  ├── ConquestSystem.tick()        # Arrived armies start/join siege
  │   └── army arrives at enemy region
  │       └── region.addSiegeForce(count, ownerId)
  │       └── emit siege_started
  │
  ├── SiegeSystem.tick()           # Tug-of-war damage resolution
  │   └── Each side takes 10% of opposing total force per second
  │   └── Defender gets 20% base bonus (+50% with wall building)
  │   └── If defender HP <= 0:
  │       └── Strongest attacker captures with remaining force as HP
  │       └── Previous owner loses region
  │       └── New owner gains region + defense bonus
  │       └── Random ability granted on first capture of region
  │       └── If previous owner has 0 regions -> player_eliminated
  │       └── emit region_captured, siege_ended
  │
  ├── GateSystem.tick()            # Teleport armies through gates
  ├── WinCondition.check()         # Check if only 1 player remains
  │   └── If winner found -> endGame(winnerId)
  │
  └── broadcastState(events)       # Send delta state to all players
```

---

## 5. Performance Optimizations

### 5.1 Client-Side Prediction for Army Movement

**Architecture:** The server never sends army positions in `state_update`. The client calculates positions locally from the army's start position, target, speed, and elapsed time.

**Server sends:**
- `army_created` with initial position, target, speed, waypoints
- `state_update.destroyedArmies[]` - IDs of armies to remove
- `state_update.armyUpdates[]` - Count changes only (`{ id, c }`)

**Client calculates per frame:**
```javascript
// ArmyRenderer.updateAll(delta):
// For each army sprite:
const dx = target.x - position.x;
const dy = target.y - position.y;
const dist = Math.sqrt(dx * dx + dy * dy);
const moveAmount = speed * (delta / 1000);
if (dist <= moveAmount) {
  // Arrived at target/waypoint
} else {
  position.x += (dx / dist) * moveAmount;
  position.y += (dy / dist) * moveAmount;
}
```

**Optimistic updates:** When the player sends soldiers, preview armies are created instantly on the client before server confirmation. Preview armies are cleaned up when:
1. Server confirms via `army_created` (matched by targetRegionId)
2. Timeout expires (`Math.max(2000, ping * 4)` ms)

### 5.2 Delta State Updates

Regions track dirty state to avoid sending unchanged data:

```javascript
// Region.isDirty() checks:
// - HP changed (floor comparison)
// - Owner changed
// - Nuclear status changed
// - Siege force changed
// - Building changed
```

Only dirty regions are included in `state_update.regions[]`. After broadcast, `region.markClean()` saves current values.

### 5.3 Player Data Throttling

Player data (charges, cooldowns, resources, region counts) is only sent every **5th tick** (every 500ms instead of every 100ms). This is an **80% bandwidth reduction** for player data.

```javascript
const shouldSendPlayers = this.gameState.tickCount % 5 === 0;
// If not shouldSendPlayers, payload.players is undefined
```

Additionally, enemy player data is stripped to minimal fields (no charges, no cooldowns, no resources).

### 5.4 Viewport Culling (Frustum Culling)

Region graphics, texts, decorations, and glows are hidden when outside the camera viewport:

```javascript
// MapRenderer.updateViewportCulling(cam):
// Throttled: every 6 frames to avoid per-frame overhead
// For each region:
//   if (regionBounds.maxX < camLeft || regionBounds.minX > camRight ||
//       regionBounds.maxY < camTop || regionBounds.minY > camBottom)
//     -> hide all elements for this region
```

Text scale is also cached: scale values are only updated when `cam.zoom` changes.

### 5.5 Object Pooling

The `ArmyRenderer` maintains pools for recycling destroyed army graphics and text objects:

```javascript
_graphicsPool = [];     // Recycled Phaser.Graphics objects
_textPool = [];         // Recycled Phaser.Text objects
_poolMaxSize = 50;      // Max pool size
_trailParticlePool = []; // Recycled trail particle objects
```

When an army is destroyed, its graphics and text are returned to the pool. When a new army is created, objects are pulled from the pool before creating new ones.

### 5.6 Owner Glow Batch Updates

Region owner glow animations are updated in a single batch per frame (`MapRenderer.updateOwnerGlows(delta)`) instead of using individual Phaser tweens per region. This avoids the overhead of hundreds of concurrent tweens.

### 5.7 Text Scale Caching

```javascript
// Only update text scale when zoom actually changes:
if (cam.zoom !== this._lastTextZoom) {
  this._lastTextZoom = cam.zoom;
  const invZoom = 1 / cam.zoom;
  for (const [, texts] of this.mapRenderer.regionTexts) {
    if (texts.hpText) texts.hpText.setScale(invZoom);
    // ...
  }
}
```

### 5.8 Fog-Filtered Army Creation

Enemy army creation events are only sent to players who can see either the source or target region:

```javascript
for (const [pid, sock] of this.playerSockets) {
  if (army.ownerId === pid) {
    sock.emit('army_created', army);  // Own armies: always
  } else {
    const vis = VisibilitySystem.getVisibleRegions(pid, ...);
    if (vis.has(army.targetRegionId) || vis.has(army._sourceRegionId)) {
      sock.emit('army_created', army);  // Enemy: only if visible
    }
  }
}
```

### 5.9 Server-Side Caching

- **Region centers cache** (`_regionCentersCache`): Pre-computed array for `_findNearestRegionId()`
- **Speed regions cache** (`_speedRegionsCache`): Cached per-tick list of regions with speed modifiers
- **Gate region IDs cache** (`_gateRegionIds`): Set of gate region IDs for skipping production
- **Player visibility cache** (`_playerVisibility`): Previous visible regions per player for detecting newly revealed regions

### 5.10 Per-Message Compression

Socket.IO is configured with per-message deflate:
```javascript
perMessageDeflate: {
  threshold: 256,     // Only compress messages > 256 bytes
  zlibDeflateOptions: { level: 1 }, // Level 1 = fastest compression
}
```

### 5.11 Auto Performance Mode

The client monitors FPS and automatically enables performance optimizations when FPS drops low:

```javascript
// GameScene._autoPerf_checkLowFps(delta):
// Tracks FPS over time, enables optimizations like reduced effects
```

---

## 6. Rendering Pipeline

### 6.1 Phaser Scene Lifecycle

```
BootScene
  ├── Loads assets, checks game data
  └── Transitions to GameScene (or MenuScene if no game data)

GameScene.create()
  ├── Extract game info (myPlayerId, gameConfig, map dimensions)
  ├── Draw ocean background (gradient + wave pattern + grid)
  ├── Initialize entities (players, regions, armies Maps)
  ├── Initialize systems:
  │   ├── MapRenderer.renderMap() -> draws all regions
  │   ├── ArmyRenderer (with fog references)
  │   ├── SelectionSystem (drag-to-send input)
  │   ├── CameraSystem (zoom/pan/bounds)
  │   ├── AbilityBar (in-game ability targeting)
  │   └── GateRenderer (portal visuals)
  ├── Setup two-camera system (main camera + UI camera)
  ├── Register GameSync listeners
  ├── Start spawn selection phase
  └── Emit initial state to React HUD

GameScene.update(time, delta)        // Every frame (~60fps)
  ├── armyRenderer.updateAll(delta)  // Move armies (client-side prediction)
  ├── selectionSystem.update()       // Update drag arrows
  ├── cameraSystem.update()          // Handle pan/zoom
  ├── mapRenderer.update()           // Frustum culling for regions
  ├── siegeRenderer.updateAll(delta) // Siege spread animations
  ├── mapRenderer.updateOwnerGlows(delta) // Glow pulse animation
  ├── Text scale update (if zoom changed)
  ├── Viewport culling (every 6 frames)
  ├── Game timer emission (every 1s)
  ├── AbilityBar update
  ├── FPS counter (every 500ms)
  └── Auto performance check
```

### 6.2 Camera System

- **Type:** Phaser `cameras.main` (scrollable, zoomable)
- **Bounds:** Set to map dimensions with padding
- **Zoom:** Configurable min/max, responds to scroll wheel and pinch
- **Pan:** Mouse drag / touch drag
- **Two-finger detection:** Distinguishes camera pan from troop selection on touch devices
- **UI offset:** Panel width subtracted from camera center for right-panel menus

```javascript
// Camera UI width:
const isMobile = cam.width < 768;
const cameraUiWidth = isMobile ? 0 : (cam.width < 1200 ? 165 : 185);
```

### 6.3 Two-Camera Setup

```javascript
// Main camera: game world (scrollable, zoomable)
this.cameras.main

// UI camera: fixed position for HUD elements
this.uiCamera = this.cameras.add(0, 0);
this.uiCamera.setName('uiCamera');

// Elements with scrollFactorX === 0 are only on UI camera
// Elements with scrollFactorX !== 0 are only on main camera
for (const child of this.children.list) {
  if (child.scrollFactorX === 0) {
    mainCam.ignore(child);
  } else {
    this.uiCamera.ignore(child);
  }
}
```

### 6.4 Layer / Depth Ordering

| Depth | Layer | Content |
|-------|-------|---------|
| 0 | Ocean background | Ocean color + wave lines |
| 1 | Ocean overlay | Grid pattern |
| 5 | Landmass glow | Outer glow border around all regions |
| 10 | Region graphics | Filled polygons with borders |
| 15 | Highlights | Selection highlights, hover effects |
| 20 | Region texts | HP text, resource icons, building icons, badges |
| 30 | Decorations | Mountain peaks, snow particles, speed arrows |
| 35 | Fog overlays | Semi-transparent fog polygons |
| 40 | Gate graphics | Portal visuals |
| 50 | Army graphics | Army shapes (circles, diamonds, stars, etc.) |
| 51 | Army count text | Soldier count above armies |
| 100 | Selection arrow | Drag-to-target arrow |

### 6.5 Region Rendering

Each region is rendered as:
1. **Fill polygon** - Color based on owner (player color) or neutral palette
2. **Border stroke** - Darker shade of fill color
3. **HP text** - Centered, scaled inversely with zoom
4. **Owner glow** - Pulsing glow effect (manual batch animation, not tweens)
5. **Decorations** - Type-specific (mountain peaks, snow particles, speed arrows, etc.)
6. **Fog overlay** - Dark semi-transparent polygon for non-visible regions
7. **Resource icon** - Small icon showing resource type (iron/crystal/uranium)
8. **Building icon** - Badge showing building type

**Neutral color palette** (varied for distinguishing unowned regions):
```javascript
[0x4a5568, 0x4b6858, 0x5c5470, 0x6b5b4b, 0x485570, 0x5a6048]
```

**Player colors** (16 colors, maximum contrast ordering):
```javascript
['#E94560', '#06D6A0', '#8338EC', '#FFD166', '#4CC9F0', '#FF6B35',
 '#8AC926', '#F72585', '#2EC4B6', '#FB5607', '#7209B7', '#FFBE0B',
 '#6A4C93', '#FF595E', '#E07C24', '#FF006E']
```

Color assignment uses maximum RGB distance algorithm: each new player gets the color with the greatest minimum distance to all already-used colors.

### 6.6 Fog of War Rendering

Fog is rendered as semi-transparent dark polygons over non-visible regions. Visibility is computed server-side via BFS and communicated through filtered `state_update` payloads.

Client-side fog update occurs on:
- Region ownership changes
- `state_update` with region changes
- Initial game start (after spawn phase)

`DOMFogManager` was an earlier approach using DOM overlays but was disabled for performance reasons.

---

## 7. Game Loop

### 7.1 Server Tick Configuration

```javascript
TICK_RATE: 10,        // 10 ticks per second
TICK_DURATION: 100,   // 100ms per tick
```

### 7.2 Tick Execution Order

```javascript
GameLoop._tick():
  1. gameState.tickCount++
  2. ProductionSystem.tick(gameState, tickDuration)    // Soldier + resource generation
  3. MovementSystem.tick(gameState, tickDuration)       // Army movement
  4. CollisionSystem.tick(gameState)                    // Army-vs-army collision
  5. ConquestSystem.tick(gameState)                     // Arrived armies -> siege/reinforce
  6. SiegeSystem.tick(gameState, tickDuration)           // Tug-of-war damage
  7. GateSystem.tick(gameState)                          // Teleportation
  8. WinCondition.check(gameState, events)               // Elimination + winner check
  9. broadcastState(allEvents)                           // Send delta state to players
```

### 7.3 Production Calculation (Per Tick)

```
Region production per tick:
  baseRate = (owned) ? region.productionRate : NEUTRAL_PRODUCTION_RATE (0.05)
  interestRate = (owned) ? region.hp * 0.01 : 0     // 1% of current HP as bonus
  rate = baseRate + interestRate
  raw = rate * (tickDuration / 1000)                 // Scale to tick duration
  Accumulate fractional production (accumulator pattern)
  Produce whole soldiers when accumulator >= 1

Building bonuses:
  barracks: +10% production per barracks building (global, stacks)

Max HP cap:
  base = 300
  per city_center: cap *= 1.20 (compound)
  If HP > cap: decay at 1% per second

Skip production if:
  - Region is a gate region
  - Region is frozen
  - Region is nuclearized
```

**Production rates by region type:**

| Type | Base Rate (soldiers/s) | Special |
|------|----------------------|---------|
| NORMAL | 1.0 | Standard |
| TOWER | 1.5 | 50% faster production |
| SPAWN | 1.0 | Player starting region |
| MOUNTAIN | 0.5 | +defense bonus (10/25/50 random) |
| SNOW | 0.8 | Army speed 28% (3.5x slower) |
| SPEED | 0.8 | Army speed 150% |
| ROCKY | 0 | Impassable, no production |
| Neutral (unowned) | 0.05 | 1 soldier per 20 seconds |

**Area multiplier:** Bigger regions produce proportionally more (multiplier applied to base rate).

### 7.4 Resource Production

Each region has a resource type (`iron`, `crystal`, or `uranium`) and rate (0.8-1.2/s). Resources accumulate per player and are used for building construction.

```
resource per tick = resourceRate * (tickDuration / 1000)
// Fractional, accumulates continuously
```

### 7.5 Army Movement Per Tick

```
For each active army (not destroyed, not arrived):
  1. Safety: destroy armies older than 45 seconds
  2. Attrition: lose 1 soldier per second while traveling
     (if count <= 0: destroy army)
  3. Check freeze: skip movement if frozenUntil > now
  4. Check speed modifiers:
     - SNOW region: effectiveDuration *= 0.28
     - SPEED region: effectiveDuration *= 1.5
     - Player speed boost: effectiveDuration *= 1.25
  5. army.move(effectiveDuration)
     - moveAmount = speed * (effectiveDuration / 1000)
     - Move toward current target
  6. Early arrival: if army entered target region polygon -> arrived = true
  7. Waypoint handling:
     - If at waypoint and more waypoints: advance to next
     - If at gate waypoint: GateSystem handles teleport
     - If at final target: ConquestSystem handles
```

**Army speed:** 25 pixels/second (configurable via admin panel).

### 7.6 Siege Damage Per Tick

```
Multi-player tug-of-war:
  sides = [defender(region.hp), attacker1(siegeForce1), attacker2(siegeForce2), ...]

  DAMAGE_PERCENT = 10% of opposing total force per second
  DEFENSE_BONUS = 1.20 (20% base)
  If wall building: DEFENSE_BONUS += 0.50 (total 70%)

  For each side:
    effectiveForce = isDefender ? force * DEFENSE_BONUS : force
    damage = otherSidesEffective * DAMAGE_PERCENT * dt

  If defender HP <= 0: strongest attacker captures with remaining force as HP
  If all attackers depleted: siege over, region survives
```

### 7.7 Collision System

```
For each pair of armies from different owners:
  if distance < ARMY_COLLISION_RADIUS (20px):
    Larger army survives with (count - smaller.count)
    Smaller army destroyed
    Equal: both destroyed
```

---

## 8. Authentication System

### 8.1 Architecture

`AuthService` uses a **dual-layer architecture**: in-memory cache + PostgreSQL persistence. All lookups use in-memory Maps for O(1) access; DB is used for persistence only.

**In-memory indexes:**
```javascript
this.users = new Map();          // userId -> user object
this.usernameIndex = new Map();  // username (lowercase) -> userId
this.emailIndex = new Map();     // email (lowercase) -> userId
this.playerCodeIndex = new Map(); // playerCode (uppercase) -> userId
```

### 8.2 Guest Login Flow

```
Client -> POST /api/auth/guest { username }
Server:
  1. Sanitize username (1-20 chars)
  2. Generate userId: 'user_N' (auto-increment)
  3. Generate 6-char player code (ABCDEFGHJKLMNPQRSTUVWXYZ23456789)
  4. Create user object (isGuest: true, diamonds: 0)
  5. Cache in memory (NOT persisted to DB)
  6. Generate JWT: { userId, username, isGuest: true }
  7. Return { user, token }

JWT payload: { userId, username, isGuest }
JWT secret: process.env.JWT_SECRET (default: 'kust-dev-secret-change-in-production')
JWT expiry: 7 days (configurable via JWT_EXPIRES_IN)
```

### 8.3 Registration Flow

```
Client -> POST /api/auth/register { username, email, password }
Server:
  1. Validate: username 3-20 chars, valid email, password >= 6 chars
  2. Check username/email uniqueness (in-memory index)
  3. Hash password: bcrypt with salt rounds 10
  4. Generate userId, playerCode
  5. Create user (emailVerified: false, diamonds: 500)
  6. Cache in memory + persist to PostgreSQL
  7. Return { user } (no token yet - needs email verification)
```

### 8.4 Email Verification

```
Client -> POST /api/auth/verify-email { email }
Server: Generate 6-digit code, valid 10 minutes, send via OneSignal

Client -> POST /api/auth/verify-code { email, code }
Server: Validate code + expiry, set emailVerified = true, return JWT token
```

### 8.5 Password Reset

```
Client -> POST /api/auth/forgot-password { email }
Server: Generate 6-digit code, valid 10 minutes, send via OneSignal

Client -> POST /api/auth/reset-password { email, code, newPassword }
Server: Validate code + expiry, hash new password, update DB
```

### 8.6 Token Validation

```javascript
validateToken(token):
  1. jwt.verify(token, secret)
  2. Look up user in memory cache
  3. If user not in cache but JWT valid:
     Create fallback user from JWT payload (recovery for DB-down scenarios)
  4. Return sanitized user (no password hash)
```

---

## 9. Database Schema

### 9.1 Users Table (001_create_users.sql)

```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,              -- 'user_N' format
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255),                       -- NULL for guests
    password_hash VARCHAR(255),               -- NULL for guests
    player_code VARCHAR(10) UNIQUE,           -- 6-char alphanumeric
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    diamonds INTEGER NOT NULL DEFAULT 500,
    banned BOOLEAN NOT NULL DEFAULT FALSE,    -- Added in migration 005
    stats JSONB NOT NULL DEFAULT '{
      "bot": {"played": 0, "won": 0, "lost": 0},
      "normal": {"played": 0, "won": 0, "lost": 0},
      "ranked": {"played": 0, "won": 0, "lost": 0}
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- Auto-updated via trigger
);

-- Indexes
UNIQUE INDEX idx_users_username_lower ON users(LOWER(username));
UNIQUE INDEX idx_users_email_lower ON users(LOWER(email)) WHERE email IS NOT NULL;
INDEX idx_users_player_code ON users(player_code);

-- Auto-update trigger on updated_at
```

### 9.2 User Skins Table (001_create_users.sql)

```sql
CREATE TABLE user_skins (
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skin_id VARCHAR(50) NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(user_id, skin_id)
);
```

### 9.3 Active Skins Table (001_create_users.sql)

```sql
CREATE TABLE user_active_skins (
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL,     -- 'skin', 'army_shape', 'trail_effect', 'capture_effect'
    skin_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(user_id, category)
);
```

### 9.4 Matches Table (002_create_matches.sql)

```sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode VARCHAR(20) NOT NULL DEFAULT 'normal',
    player_count INTEGER NOT NULL DEFAULT 2,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    map_seed VARCHAR(100),
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9.5 Daily Rewards Table (004_create_daily_rewards.sql)

```sql
CREATE TABLE user_daily_rewards (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    streak_day INTEGER NOT NULL DEFAULT 1,
    last_claim_date DATE,
    cycle_start_date DATE,
    last_claim_ts BIGINT DEFAULT 0,         -- Added via migration
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9.6 Analytics Tables (006_create_analytics_tables.sql)

```sql
CREATE TABLE analytics_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    total_users INTEGER NOT NULL DEFAULT 0,
    new_users INTEGER NOT NULL DEFAULT 0,
    daily_active_users INTEGER NOT NULL DEFAULT 0,
    total_games_played INTEGER NOT NULL DEFAULT 0,
    bot_games INTEGER NOT NULL DEFAULT 0,
    normal_games INTEGER NOT NULL DEFAULT 0,
    ranked_games INTEGER NOT NULL DEFAULT 0,
    avg_game_duration INTEGER NOT NULL DEFAULT 0,
    total_diamonds_earned INTEGER NOT NULL DEFAULT 0,
    total_diamonds_spent INTEGER NOT NULL DEFAULT 0,
    peak_online_players INTEGER NOT NULL DEFAULT 0,
    peak_concurrent_games INTEGER NOT NULL DEFAULT 0,
    total_friend_requests INTEGER NOT NULL DEFAULT 0,
    daily_reward_claims INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- UNIQUE INDEX on snapshot_date

CREATE TABLE error_logs (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE server_uptime (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE,
    stop_reason VARCHAR(50)
);
```

---

## 10. Deployment

### 10.1 Server Deployment

**Process manager:** PM2
**Production path:** `/Domains/kust.frkn.com.tr/backend/`
**Deploy method:** rsync

```bash
# Deploy server
rsync -avz --exclude node_modules server/ yuksel:/Domains/kust.frkn.com.tr/backend/

# Restart PM2
ssh yuksel "cd /Domains/kust.frkn.com.tr/backend/ && pm2 restart all"
```

**SSH:** Port 2232, use `yuksel` alias (direct IP+port 22 does not work).

### 10.2 Client Deployment

**Build tool:** Vite
**Deploy method:** SCP after build

```bash
# Build client
cd client && npm run build

# Deploy dist to server
scp -P 2232 -r dist/ yuksel:/path/to/frontend/
```

### 10.3 Important Notes

- Do NOT deploy directly; merge to `main` and let CI/CD handle it (per user preference)
- PM2 runs from `/Domains/kust.frkn.com.tr/backend/`, NOT `/var/www/kust-game/`

---

## 11. Anti-Cheat / Security

### 11.1 Server-Authoritative Design

ALL game logic runs on the server. The client is a "dumb terminal" that:
- Sends player intents (send_soldiers, use_ability, select_spawn)
- Receives authoritative state updates
- Locally predicts army positions (but server decides arrival, collision, damage)

The client NEVER:
- Computes production, siege damage, or collision
- Decides region captures or eliminations
- Modifies game state directly

### 11.2 Fog of War Server-Side Filtering

The server maintains per-player visibility and filters ALL outgoing data:

1. **state_update regions:** All dirty regions sent (HP may be hidden via stealth)
2. **army_created:** Only sent if player can see source OR target region
3. **army count updates:** Filtered by visibility
4. **regions_reveal:** Sends resource/building data only when fog lifts
5. **Ability effects (missile, nuclear, etc.):** Only sent to players who can see the target region
6. **spawn phase:** Region types, HP, and resource data are completely hidden

### 11.3 Rate Limiting

```javascript
RATE_LIMIT_MAX = 5;       // Max events per second
RATE_LIMIT_WINDOW = 1000; // 1-second window

// Applied to all game action events:
// send_soldiers, build_building, recall_army, use_missile, etc.
// NOT applied to: ping_check (lightweight)
```

Rate limit entries are cleaned up on disconnect.

### 11.4 Input Validation

Every socket event validates:
- `data` is an object (not null, not primitive)
- Required fields exist and are correct types
- String lengths are bounded (regionId < 50 chars)
- Array lengths are bounded (sourceIds max 12)
- Player is in a room and found in room state
- Game status is correct for the action
- Region ownership verification
- Fog visibility verification for target selection
- Attack range verification via BFS

### 11.5 Username Sanitization

```javascript
function sanitizeUsername(raw) {
  const stripped = raw.replace(/<[^>]*>/g, '').trim(); // Strip HTML tags (XSS prevention)
  if (stripped.length < 1 || stripped.length > 20) return null;
  return stripped;
}
```

### 11.6 Admin Authentication

Admin panel uses JWT + username whitelist:
```javascript
const ADMIN_USERNAMES = ['kan'];

function isAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = authService.validateToken(token);
  if (!user || !ADMIN_USERNAMES.includes(user.username)) {
    return res.status(403).json({ error: 'Not admin' });
  }
  next();
}
```

### 11.7 Payload Size Limit

Socket.IO `maxHttpBufferSize: 1e5` (100KB) prevents oversized payload attacks.

---

## 12. Admin Panel

### 12.1 Game Settings (Runtime-Configurable)

```javascript
{
  armySpeed: 25,                     // pixels/second
  siegeDamagePercent: 10,
  defenseBonus: 20,
  interestRate: 1,                   // 1% of HP as bonus production
  maxRegionHP: 300,
  spawnHP: 40,
  baseProductionRate: 1,             // soldiers/second
  fogDepth: 2,                       // BFS visibility depth
  attackRange: 1,                    // BFS attack range
  buildingCosts: {                   // Per-building costs
    city_center: { iron: 80, crystal: 80, uranium: 40 },
    barracks: { iron: 60, crystal: 30, uranium: 30 },
    wall: { iron: 40, crystal: 20, uranium: 10 },
    iron_dome: { iron: 60, crystal: 60, uranium: 80 },
    stealth_tower: { iron: 30, crystal: 70, uranium: 50 },
    drone_facility: { iron: 50, crystal: 50, uranium: 70 },
    missile_base: { iron: 40, crystal: 40, uranium: 100 },
  },
  buildingLevelCostMultiplier: 50,   // 50% = 2nd costs 1.5x, 3rd costs 2x
}
```

Settings are stored in memory and applied at runtime. Changes affect new game rooms (not in-progress games, except `armySpeed`, `spawnHP`, `baseProductionRate` which modify `constants` directly).

### 12.2 Admin API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/settings` | Get current game settings |
| POST | `/api/admin/settings` | Update game settings |
| GET | `/api/admin/stats` | Total users, games, DAU/WAU/MAU |
| GET | `/api/admin/users` | List users (last 100, by activity) |
| POST | `/api/admin/users/:id/ban` | Ban user |
| POST | `/api/admin/users/:id/unban` | Unban user |
| POST | `/api/admin/users/:id/diamonds` | Add/remove diamonds |
| POST | `/api/admin/users/:id/edit` | Edit username/email |
| GET | `/api/admin/analytics/realtime` | Online players, active games, peak today |
| GET | `/api/admin/analytics/daily?days=30` | Historical daily snapshots |
| GET | `/api/admin/analytics/top-players?limit=5` | Top by wins and ELO |
| GET | `/api/admin/analytics/economy` | Diamond economy stats |
| GET | `/api/admin/analytics/system` | Memory, uptime, errors |
| GET | `/api/admin/analytics/errors?days=7` | Error history |
| GET | `/api/admin/analytics/uptime` | Server restart history |
| POST | `/api/admin/analytics/snapshot` | Manual daily snapshot |

### 12.3 Analytics Tracking

**Realtime (in-memory):**
- Online players (updated every 10s from Socket.IO)
- Active games (updated every 10s from MatchmakingService)
- Peak online today
- Peak games today

**Daily counters (reset at midnight Turkey time = 21:00 UTC):**
- Games played by mode (bot, normal, ranked)
- Diamonds earned/spent
- New user registrations
- Friend requests
- Daily reward claims
- Game durations
- Daily active user IDs

**Persistence:** Daily snapshot saved to `analytics_snapshots` table at midnight Turkey time. Final snapshot also saved on graceful shutdown.

---

## 13. Matchmaking System

### 13.1 Game Modes

| Mode | Players | Map | Rating Required | Entry Fee |
|------|---------|-----|-----------------|-----------|
| `normal` | 2 | Player choice | No | Free |
| `bot` | 2 (1 human + 1 AI) | Player choice | No | Free |
| `4player` | 4 | Player choice | No | Free |
| `ranked` | 2 | Player choice | Yes (non-guest, JWT) | 1 diamond |

### 13.2 Available Maps

```javascript
[
  { id: 'turkey',  regions: 91, minPlayers: 2, maxPlayers: 4 },
  { id: 'poland',  regions: 73, minPlayers: 2, maxPlayers: 4 },
  { id: 'china',   regions: 34, minPlayers: 2, maxPlayers: 4 },
  // 'grid' - procedurally generated, no JSON file
]
```

Map types are validated server-side against the `server/src/game/maps/` directory (dynamic file listing + 'grid').

### 13.3 Queue Logic

```
Normal/4Player:
  - Queue by mode
  - First N players matched (FIFO)
  - Map type from first player's selection

Ranked:
  - Queue with ELO rating
  - Initial match range: +/- 200 ELO
  - After 30s wait: range widens by 100 every 15 seconds
  - Checked every 5 seconds
  - Uses max range of both players for matching

Bot:
  - Instant match creation (no queue)
  - BotMatchService creates room with 1 human + 1 AI
```

### 13.4 Room Lifecycle

```
WAITING -> COUNTDOWN (3s) -> startGame() ->
SPAWN_SELECTION (15s) -> PREVIEW (3.2s) -> PLAYING -> FINISHED
```

### 13.5 Disconnect Handling

```
During waiting/countdown: Player removed, countdown cancelled
During playing: Player marked eliminated, regions become neutral
If 0 human players: Room cleaned up, game ends
```

---

## 14. Building System

### 14.1 Building Catalog

| ID | Name | Cost (I/C/U) | Scope | Effect |
|----|------|-------------|-------|--------|
| `city_center` | Sehir Merkezi | 80/80/40 | Global | +20% max HP cap (compound per building) |
| `barracks` | Baraka | 60/30/30 | Global | +10% production (stacks) |
| `wall` | Duvar | 40/20/10 | Local | +50% defense in siege |
| `iron_dome` | Demir Kubbe | 60/60/80 | Local | Blocks missiles within 3 neighbor hops |
| `stealth_tower` | Gorunmezlik Kulesi | 30/70/50 | Local | HP hidden from enemies (shows "?") |
| `drone_facility` | Drone Tesisi | 50/50/70 | Local | Unlocks drone attack |
| `missile_base` | Fuze Ussu | 40/40/100 | Local | Unlocks missile attack |

### 14.2 Building Cost Scaling

```
actualCost = baseCost * (1 + existingCount * levelMultiplierPercent / 100)

Example with 50% multiplier:
  1st barracks: 60/30/30
  2nd barracks: 90/45/45 (1.5x)
  3rd barracks: 120/60/60 (2.0x)
```

### 14.3 Building Rules

- Max 1 building per region
- Region must be owned by the player
- Costs deducted from player resources (iron, crystal, uranium)
- Admin can override costs and level multiplier

---

## 15. Abilities System

### 15.1 Ability Charges

Players start with 0 charges for all abilities. A random ability charge is granted:
- At game start (1 random ability for each player)
- On first capture of each neutral/enemy region (random from all 5 abilities)

### 15.2 Ability Details

| Ability | Cooldown | Duration | Effect |
|---------|----------|----------|--------|
| **Missile** | 10s | Instant | 50% HP damage to target enemy region |
| **Nuclear** | 10s | 3s | Disables production in target region for 3s |
| **Barracks** | 10s | Permanent | Upgrades region to tower type |
| **Speed Boost** | 10s | 10s | 25% faster army movement (self, all armies) |
| **Freeze** | 30s | 1.5s | Freezes ALL enemy armies mid-air |

### 15.3 Ability Visibility

| Ability | Who sees the effect |
|---------|-------------------|
| Missile | Actor + players who can see target region |
| Nuclear | Actor + players who can see target region |
| Barracks | Actor + players who can see target region |
| Speed Boost | Actor only |
| Freeze | Everyone (global effect) |

---

## 16. Cosmetics / Store

### 16.1 Skin Categories

| Category | Effect | Items |
|----------|--------|-------|
| `skin` | Player color override | Black (#1a1a1a), White (#f0f0f0) |
| `army_shape` | Army visual shape | Circle, Diamond, Star, Shield, Hexagon |
| `trail_effect` | Particle trail behind armies | Sparkle, Fire, Ice, Rainbow |
| `capture_effect` | Visual effect on region capture | Sparkle, Shockwave, Flames, Lightning |

### 16.2 Rarity & Pricing

| Rarity | Price Range | Examples |
|--------|-------------|---------|
| Common | 150-200 | Circle, Diamond army shapes |
| Rare | 300-500 | Star army shape, Fire/Ice trails, Sparkle effects |
| Epic | 750-1000 | Shield/Hexagon shapes, Black/White skins, Flames effect |
| Legendary | 2000-2500 | Rainbow trail, Lightning effect |

### 16.3 Diamond Economy

| Source | Diamonds |
|--------|----------|
| New registration | 500 |
| Win (ranked) | 5 |
| Win (normal/4player) | 2 |
| Win (bot) | 1 |
| Daily reward | 10 + (day - 1) per streak day |
| League promotion | Varies by league |
| Ranked entry fee | -1 |

### 16.4 Daily Reward System

- 30-day cycle
- Reward increases per day: day 1 = 10, day 2 = 11, ..., day 30 = 39
- Day resets at 09:00 Turkey time (06:00 UTC)
- Streak continues if claimed on consecutive days
- Missing 2+ days resets streak to day 1
- Same-day claim blocked ("already claimed today")

---

## Appendix A: Game Constants Reference

```javascript
// Tick
TICK_RATE: 10                        // ticks/second
TICK_DURATION: 100                   // ms/tick

// Production (soldiers/second)
BASE_PRODUCTION_RATE: 1
TOWER_PRODUCTION_RATE: 1.5
SPAWN_PRODUCTION_RATE: 1
NEUTRAL_PRODUCTION_RATE: 0.05
MOUNTAIN_PRODUCTION_RATE: 0.5
SNOW_PRODUCTION_RATE: 0.8
SPEED_PRODUCTION_RATE: 0.8

// Terrain
MOUNTAIN_DEFENSE_BONUS: [10, 25, 50] // Random pick
SNOW_SPEED_MULTIPLIER: 0.28          // 3.5x slower
SPEED_REGION_MULTIPLIER: 1.5         // 50% faster

// Army
ARMY_SPEED: 25                       // pixels/second
ARMY_COLLISION_RADIUS: 20            // pixels
SOLDIER_SPLIT_RATIO: 0.5             // Send 50% of HP

// Map
MAP_WIDTH: 1600
MAP_HEIGHT: 900
MIN_NEUTRAL_HP: 3
MAX_NEUTRAL_HP: 30
SPAWN_HP: 40

// Siege
SIEGE_DAMAGE_PER_SECOND: 2.0
SIEGE_ATTRITION_PER_SECOND: 0.3
SIEGE_POSITION_OFFSET: 30            // px
SIEGE_MAX_ARMIES_PER_REGION: 3

// Visibility & Range
FOG_DEPTH: 2                         // BFS hops
ATTACK_RANGE: 1                      // BFS hops

// Abilities
MISSILE_COOLDOWN: 10000              // ms
MISSILE_DAMAGE_RATIO: 0.5            // 50% HP
NUCLEAR_COOLDOWN: 10000
NUCLEAR_DURATION: 3000               // ms (production disable)
BARRACKS_COOLDOWN: 10000
SPEED_BOOST_COOLDOWN: 10000
SPEED_BOOST_DURATION: 10000          // ms
SPEED_BOOST_MULTIPLIER: 1.25         // 25% faster
FREEZE_COOLDOWN: 30000
FREEZE_ARMY_DURATION: 1500           // ms

// Combat
COMBAT_POWER_VARIATION: 0.2          // +/-20% random

// Resources
RESOURCE_TYPES: ['iron', 'crystal', 'uranium']
RESOURCE_MIN_RATE: 0.8
RESOURCE_MAX_RATE: 1.2

// Game Flow
COUNTDOWN_SECONDS: 3
SPAWN_SELECTION_SECONDS: 15
BOT_DECISION_INTERVAL: 1500          // ms

// Initial Charges (all 0 - granted randomly at game start)
MISSILE_INITIAL_CHARGES: 0
NUCLEAR_INITIAL_CHARGES: 0
BARRACKS_INITIAL_CHARGES: 0
SPEED_BOOST_INITIAL_CHARGES: 0
FREEZE_INITIAL_CHARGES: 0
```

## Appendix B: Gate System Constants

```javascript
GATE_TELEPORT_THRESHOLD: 15    // px - army must be this close to gate center
GATE_EXIT_OFFSET: 20           // px - offset after teleport to prevent re-teleport
GATE_COOLDOWN_MS: 500          // ms - per-army cooldown between teleports
MIN_GATE_HOP_DISTANCE: 4      // Minimum BFS hops between paired gates
MIN_GATE_EUCLIDEAN_DISTANCE: 200 // Minimum px distance between paired gates
MAX_GATE_ATTEMPTS: 3           // Retry limit for finding valid gate placement

// Gate colors (avoid conflict with player colors)
GATE_COLORS: [
  { name: 'purple', hex: 0xBB44FF },
  { name: 'cyan',   hex: 0x00DDDD },
  { name: 'pink',   hex: 0xFF44AA },
]

// Gate pair count (random per game based on map size):
// < 15 regions: 40% no gates, 60% 1 pair
// 15-39 regions: 20% none, 50% 1 pair, 30% 2 pairs
// 40+ regions: 10% none, 40% 1 pair, 50% 2 pairs
```

## Appendix C: ID Generation

All entity IDs use nanoid v3 (CommonJS compatible) with format: `{prefix}_{nanoid}`.

```javascript
const { nanoid } = require('nanoid');
function generateId(prefix = 'id') {
  return `${prefix}_${nanoid(12)}`;
}
// Examples: 'player_abc123xyz45', 'army_def456uvw78', 'room_ghi789rst01'
```

Prefixes used: `player`, `army`, `room`, `gate`, `gatepair`, `user`.

---

*This document covers the complete technical architecture of KUST 10 - Pillows v0.14.0. Every configuration value, event payload, system interaction, and optimization technique documented here reflects the actual codebase as of 2026-04-06.*

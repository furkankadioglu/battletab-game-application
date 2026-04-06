# 06 - Backend Documentation (Complete Server Rebuild Reference)

**Game**: KUST 10 - Pillows  
**Version**: 0.14.0 (2026-04-05)  
**Runtime**: Node.js  
**Framework**: Express.js  
**Database**: PostgreSQL  
**Cache/Realtime**: Redis (ioredis)  
**Realtime Protocol**: Socket.IO (WebSocket-only)

---

## Table of Contents

1. [Dependencies and Package Info](#1-dependencies-and-package-info)
2. [Server Initialization Flow](#2-server-initialization-flow)
3. [Configuration](#3-configuration)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [REST API Endpoints](#6-rest-api-endpoints)
7. [Socket Event Protocol](#7-socket-event-protocol)
8. [Matchmaking System](#8-matchmaking-system)
9. [Game Room Lifecycle](#9-game-room-lifecycle)
10. [Game State Broadcasting](#10-game-state-broadcasting)
11. [Combat System](#11-combat-system)
12. [Ability System](#12-ability-system)
13. [Building System](#13-building-system)
14. [Map Generation Pipeline](#14-map-generation-pipeline)
15. [Gate System](#15-gate-system)
16. [Fog of War / Visibility](#16-fog-of-war--visibility)
17. [Pathfinding System](#17-pathfinding-system)
18. [Bot AI](#18-bot-ai)
19. [Skin / Store System](#19-skin--store-system)
20. [Daily Rewards](#20-daily-rewards)
21. [Ranked System](#21-ranked-system)
22. [Analytics System](#22-analytics-system)
23. [Rate Limiting and Security](#23-rate-limiting-and-security)
24. [Shared Constants](#24-shared-constants)

---

## 1. Dependencies and Package Info

**Package name**: `pillows-server`  
**Entry point**: `server/src/index.js`

### Production Dependencies (with exact versions)

| Package | Version | Purpose |
|---------|---------|---------|
| `bcryptjs` | ^2.4.3 | Password hashing (bcrypt algorithm) |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| `dotenv` | ^16.3.1 | Environment variable loading from .env |
| `express` | ^4.18.2 | HTTP framework |
| `helmet` | ^7.1.0 | Security headers |
| `ioredis` | ^5.3.2 | Redis client |
| `jsonwebtoken` | ^9.0.3 | JWT token signing/verification |
| `nanoid` | ^3.3.7 | Unique ID generation |
| `pg` | ^8.11.3 | PostgreSQL client |
| `socket.io` | ^4.7.2 | WebSocket server |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `jest` | ^29.7.0 | Test framework |
| `nodemon` | ^3.0.2 | Auto-restart in development |

### NPM Scripts

```json
{
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "test": "jest --forceExit --detectOpenHandles"
}
```

---

## 2. Server Initialization Flow

**File**: `server/src/index.js`

### Startup Sequence

```
1. Load all modules and routes
2. Create Express app + HTTP server
3. Apply middleware chain:
   a. helmet()                    - Security headers (CSP, XSS protection, etc.)
   b. cors({ origin: ... })       - CORS with mobile support
   c. express.json()              - JSON body parser
4. Mount REST routes:
   a. /api         -> healthRoutes
   b. /api/auth    -> authRoutes
   c. /api/ranking -> rankingRoutes
   d. /api/friends -> friendRoutes
   e. /api/store   -> storeRoutes
   f. /api/daily-reward -> dailyRewardRoutes
   g. /api/admin   -> adminRoutes
5. Root endpoint: GET / -> { name: 'KUST Game Server', version: '1.0.0' }
6. Setup Socket.IO (returns io + matchmakingService)
7. startServer() async:
   a. Connect Redis (non-blocking - continues without Redis)
   b. Connect PostgreSQL (non-blocking - continues without DB)
   c. If DB available: init services in order:
      - authService._initDb()
      - storeService._initDb()
      - dailyRewardService._initDb()
      - analyticsService.init()
   d. Start HTTP server on configured port
   e. Start analytics interval (every 10s): tracks online players + active games
```

### CORS Configuration

```javascript
const corsOrigin = config.cors.origin === '*'
  ? '*'
  : [config.cors.origin, 'capacitor://localhost', 'https://localhost', 'http://localhost'].filter(Boolean);
```

Supports:
- Wildcard (`*`) in development
- Capacitor mobile app origins (`capacitor://localhost`)
- Standard localhost origins

### Socket.IO Setup

**File**: `server/src/socket/index.js`

```javascript
const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  transports: ['websocket'],        // WebSocket-only (skip HTTP polling = 100-200ms faster)
  allowUpgrades: false,              // No upgrade dance
  pingTimeout: 60000,                // 60s before considering disconnected
  pingInterval: 25000,               // 25s ping interval
  maxHttpBufferSize: 1e5,            // 100KB max payload (anti-DoS)
  perMessageDeflate: {
    threshold: 256,                  // Compress messages > 256 bytes
    zlibDeflateOptions: { level: 1 } // Fast compression (speed priority)
  },
});
```

On each connection:
1. Log client connected
2. `registerLobbyHandlers(socket, io, matchmakingService)`
3. `registerGameHandlers(socket, io, matchmakingService)`
4. On disconnect: `matchmakingService.handleDisconnect(socket.id)`

### Graceful Shutdown

Handles: `SIGTERM`, `SIGINT`, `uncaughtException`, `unhandledRejection`

Shutdown sequence:
1. Record shutdown in analytics
2. For each active game room: determine winner by most regions, call `endGame(winnerId)`
3. Close Socket.IO
4. Close HTTP server
5. Close Redis connection
6. Close PostgreSQL pool
7. Force exit after 10 seconds if not graceful

---

## 3. Configuration

**File**: `server/src/config/index.js`

```javascript
const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/pillows',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'kust-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  onesignal: {
    appId: process.env.ONESIGNAL_APP_ID || '',
    apiKey: process.env.ONESIGNAL_API_KEY || '',
  },
};
```

Environment variables loaded from:
1. Project root `.env` (via `path.resolve(__dirname, '../../../.env')`)
2. Server-level `.env` (via `path.resolve(__dirname, '../../.env')`)

---

## 4. Database Schema

All PostgreSQL tables. The server works without a database (in-memory fallback mode).

### 4.1 users

**Migration**: `001_create_users.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,           -- 'user_1', 'user_2', etc.
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255),                    -- NULL for guests
    password_hash VARCHAR(255),            -- bcrypt hash, NULL for guests
    player_code VARCHAR(10) UNIQUE,        -- 6-char alphanumeric (e.g., 'A3B7K9')
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    diamonds INTEGER NOT NULL DEFAULT 500,
    stats JSONB NOT NULL DEFAULT '{"bot":{"played":0,"won":0,"lost":0},"normal":{"played":0,"won":0,"lost":0},"ranked":{"played":0,"won":0,"lost":0}}',
    banned BOOLEAN NOT NULL DEFAULT FALSE, -- Added by migration 005
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_users_username_lower ON users(LOWER(username));
CREATE UNIQUE INDEX idx_users_email_lower ON users(LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX idx_users_player_code ON users(player_code);

-- Auto-update trigger on updated_at
```

### 4.2 user_skins

**Migration**: `001_create_users.sql`

```sql
CREATE TABLE IF NOT EXISTS user_skins (
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skin_id VARCHAR(50) NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(user_id, skin_id)
);
```

### 4.3 user_active_skins

**Migration**: `001_create_users.sql`

```sql
CREATE TABLE IF NOT EXISTS user_active_skins (
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL,        -- 'skin', 'army_shape', 'trail_effect', 'capture_effect'
    skin_id VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(user_id, category)
);
```

### 4.4 matches (historical, not actively used by current game logic)

**Migration**: `002_create_matches.sql`

```sql
CREATE TABLE IF NOT EXISTS matches (
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

### 4.5 match_players (historical)

**Migration**: `003_create_match_players.sql`

```sql
CREATE TABLE IF NOT EXISTS match_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_bot BOOLEAN NOT NULL DEFAULT FALSE,
    placement INTEGER NOT NULL DEFAULT 0,
    elo_before INTEGER,
    elo_after INTEGER,
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.6 user_daily_rewards

**Migration**: `004_create_daily_rewards.sql` + runtime migration

```sql
CREATE TABLE IF NOT EXISTS user_daily_rewards (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    streak_day INTEGER NOT NULL DEFAULT 1,
    last_claim_date DATE,                 -- legacy, kept for safety
    cycle_start_date DATE,                -- legacy, kept for safety
    last_claim_ts BIGINT DEFAULT 0,       -- added by runtime migration
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.7 analytics_snapshots

**Migration**: `006_create_analytics_tables.sql`

```sql
CREATE TABLE IF NOT EXISTS analytics_snapshots (
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
CREATE UNIQUE INDEX idx_analytics_snapshot_date ON analytics_snapshots(snapshot_date);
```

### 4.8 error_logs

```sql
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
```

### 4.9 server_uptime

```sql
CREATE TABLE IF NOT EXISTS server_uptime (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE,
    stop_reason VARCHAR(50)
);
```

---

## 5. Authentication System

**File**: `server/src/auth/AuthService.js`

### Architecture

- **In-memory cache** with PostgreSQL persistence
- All users loaded into memory Maps on startup
- Falls back to in-memory only if DB is unavailable
- Guest accounts are NOT persisted to DB

### Data Structures (In-Memory)

```javascript
this.users = new Map();            // userId -> user object
this.usernameIndex = new Map();    // username (lowercase) -> userId
this.emailIndex = new Map();       // email (lowercase) -> userId
this.playerCodeIndex = new Map();  // playerCode (uppercase) -> userId
this.resetCodes = new Map();       // email (lowercase) -> { code, expiresAt }
this.verificationCodes = new Map(); // email (lowercase) -> { code, expiresAt }
```

### User Object Shape

```javascript
{
  id: 'user_1',                    // Sequential: 'user_N'
  username: 'PlayerName',
  email: 'user@email.com',         // null for guests
  password: '$2a$10$...',          // bcrypt hash, null for guests
  playerCode: 'A3B7K9',           // 6-char: [ABCDEFGHJKLMNPQRSTUVWXYZ23456789]
  emailVerified: false,
  isGuest: false,
  diamonds: 500,                    // Default starting diamonds
  createdAt: '2026-01-01T00:00:00.000Z',
  stats: {
    bot: { played: 0, won: 0, lost: 0 },
    normal: { played: 0, won: 0, lost: 0 },
    ranked: { played: 0, won: 0, lost: 0 },
  }
}
```

### Registration Flow

1. Validate: username (3-20 chars), email (regex), password (min 6 chars)
2. Normalize: lowercase username and email for index lookup
3. Check uniqueness of username and email
4. Hash password with bcrypt (salt rounds: 10)
5. Generate sequential ID (`user_N`)
6. Generate 6-character player code (characters: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`)
7. Set `diamonds: 500` (DEFAULT_DIAMONDS)
8. Cache in memory + persist to DB via UPSERT
9. Return sanitized user (no password)

### Login Flow

1. Normalize username to lowercase
2. Lookup userId via usernameIndex
3. Verify not a guest account
4. bcrypt.compare password
5. Check emailVerified (must be true)
6. Generate JWT token
7. Return user + token

### Guest Login

1. Generate guest name: provided name or `Misafir_{random 0-9999}`
2. Generate sequential ID + player code
3. Set `isGuest: true`, `diamonds: 0`
4. Cache in memory only (NOT persisted to DB)
5. Generate JWT token
6. Return user + token

### JWT Token

```javascript
jwt.sign(
  { userId: user.id, username: user.username, isGuest: user.isGuest },
  config.jwt.secret,           // env: JWT_SECRET
  { expiresIn: config.jwt.expiresIn }  // env: JWT_EXPIRES_IN, default '7d'
);
```

**Payload**: `{ userId, username, isGuest, iat, exp }`

### Email Verification

- 6-digit numeric code: `Math.floor(100000 + Math.random() * 900000)`
- Expires in 10 minutes (`Date.now() + 10 * 60 * 1000`)
- On verification success: sets `emailVerified = true`, generates new JWT token

### Password Reset

- 6-digit numeric code
- Expires in 10 minutes
- New password hashed with bcrypt (salt rounds: 10)

### Token Validation

- `jwt.verify(token, secret)` -> decoded payload
- Lookup user in memory cache by `decoded.userId`
- If user not in cache but JWT valid: creates fallback user from JWT payload (recovery path)

### Stats Tracking

```javascript
updateGameStats(userId, mode, won)
// mode '4player' maps to 'normal' stats key
// Increments played, won or lost
// Persists stats JSONB to DB
```

---

## 6. REST API Endpoints

### 6.1 Auth Routes (`/api/auth`)

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/register` | No | `{ username, email, password }` | `{ success, needsVerification, email, message }` (201) |
| POST | `/login` | No | `{ username, password }` | `{ success, user, token }` (200) |
| GET | `/profile` | Bearer | - | `{ success, user }` (200) |
| POST | `/guest` | No | `{ username? }` | `{ success, user, token }` (200) |
| POST | `/verify-email` | No | `{ email, code }` | `{ success, user, token }` (200) |
| POST | `/resend-verification` | No | `{ email }` | `{ success, message }` (200) |
| POST | `/forgot-password` | No | `{ email }` | `{ success, message }` (200) |
| POST | `/reset-password` | No | `{ email, code, newPassword }` | `{ success, message }` (200) |

### 6.2 Store Routes (`/api/store`)

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/catalog` | No | - | `{ success, catalog: SkinCatalog[] }` |
| GET | `/my-skins` | Bearer | - | `{ success, diamonds, ownedSkins[], activeSkins{} }` |
| POST | `/purchase` | Bearer | `{ skinId }` | `{ success, diamonds, skinId }` |
| POST | `/equip` | Bearer | `{ skinId }` | `{ success, category, skinId }` |
| POST | `/unequip` | Bearer | `{ category }` | `{ success, category }` |

Valid categories: `skin`, `army_shape`, `trail_effect`, `capture_effect`

### 6.3 Ranking Routes (`/api/ranking`)

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/leaderboard` | No | `{ success, leaderboard[20] }` |
| GET | `/profile/:userId` | No | `{ success, profile }` |
| GET | `/my-rank` | Bearer | `{ success, profile }` |
| GET | `/league-stats` | No | `{ success, leagues[] }` |

### 6.4 Friends Routes (`/api/friends`)

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/` | Bearer | - | `{ success, friends[] }` |
| GET | `/requests` | Bearer | - | `{ success, requests[] }` |
| POST | `/request` | Bearer | `{ playerCode }` | `{ success }` |
| POST | `/accept` | Bearer | `{ fromUserId }` | `{ success }` |
| POST | `/reject` | Bearer | `{ fromUserId }` | `{ success }` |
| DELETE | `/:friendId` | Bearer | - | `{ success }` |

### 6.5 Daily Reward Routes (`/api/daily-reward`)

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/status` | Bearer (no guests) | `{ success, streakDay, canClaim, todayReward, nextDay, rewards[] }` |
| POST | `/claim` | Bearer (no guests) | `{ success, day, reward, totalDiamonds, rewards[] }` |

### 6.6 Admin Routes (`/api/admin`)

**Auth**: Bearer token + username must be in `ADMIN_USERNAMES = ['kan']`

| Method | Path | Response |
|--------|------|----------|
| GET | `/settings` | Game settings object |
| POST | `/settings` | `{ success, settings }` |
| GET | `/stats` | `{ totalUsers, totalGames, dailyActive, weeklyActive, monthlyActive }` |
| GET | `/users` | User list (limit 100) |
| POST | `/users/:id/ban` | `{ success }` |
| POST | `/users/:id/unban` | `{ success }` |
| POST | `/users/:id/diamonds` | `{ success, newTotal }` (body: `{ amount }`) |
| POST | `/users/:id/edit` | `{ success }` (body: `{ username?, email? }`) |
| GET | `/analytics/realtime` | Realtime stats |
| GET | `/analytics/daily?days=30` | Chart data array |
| GET | `/analytics/top-players?limit=5` | `{ byWins[], byElo[] }` |
| GET | `/analytics/economy` | Economy stats |
| GET | `/analytics/system` | System health + memory + errors |
| GET | `/analytics/errors?days=7` | Error history |
| GET | `/analytics/uptime` | Server uptime history |
| POST | `/analytics/snapshot` | Manual daily snapshot trigger |

### Admin Game Settings Object

```javascript
{
  armySpeed: 25,                      // ARMY_SPEED constant
  siegeDamagePercent: 10,
  defenseBonus: 20,
  interestRate: 1,
  maxRegionHP: 300,
  spawnHP: 40,
  baseProductionRate: 1,
  fogDepth: 2,
  attackRange: 1,
  buildingCosts: {                    // Per-building, admin-overridable
    city_center: { iron: 80, crystal: 80, uranium: 40 },
    barracks: { iron: 60, crystal: 30, uranium: 30 },
    wall: { iron: 40, crystal: 20, uranium: 10 },
    iron_dome: { iron: 60, crystal: 60, uranium: 80 },
    stealth_tower: { iron: 30, crystal: 70, uranium: 50 },
    drone_facility: { iron: 50, crystal: 50, uranium: 70 },
    missile_base: { iron: 40, crystal: 40, uranium: 100 },
  },
  buildingLevelCostMultiplier: 50,    // 50% = 2nd building costs 1.5x
}
```

When settings are saved, runtime constants are also updated: `constants.ARMY_SPEED`, `constants.SPAWN_HP`, `constants.BASE_PRODUCTION_RATE`.

---

## 7. Socket Event Protocol

### 7.1 Event Types (shared/eventTypes.js)

**Client -> Server:**
```
join_lobby, leave_lobby, player_ready, send_soldiers, use_missile,
use_nuclear, use_barracks, use_speed_boost, use_freeze,
build_building, recall_army, select_spawn, ping_check
```

**Server -> Client:**
```
lobby_update, game_start, game_countdown, state_update, army_created,
army_destroyed, region_captured, player_eliminated, gate_teleport,
missile_applied, nuclear_applied, barracks_applied, speed_boost_applied,
freeze_applied, ability_granted, siege_started, siege_ended,
spawn_selected, spawn_phase_end, game_over, error,
queue_update, match_found, ranking_update, pong_check,
diamond_update, diamond_reward, promotion_reward, regions_reveal
```

### 7.2 Connection Events

#### `connect` (automatic)
- Server logs client ID
- Registers all event handlers

#### `disconnect` (automatic)
- Direction: Client -> Server (automatic)
- Handler: `matchmakingService.handleDisconnect(socket.id)`
  - Removes from matchmaking queue
  - If in a room:
    - Pre-game: removes player, notifies others, cleans up empty room
    - In-game: marks as eliminated, regions become neutral

#### `ping_check` / `pong_check`
- Direction: Client -> Server -> Client
- Payload: `timestamp` (number)
- Purpose: Latency measurement, not rate-limited

### 7.3 Lobby Events

#### `join_lobby` (Client -> Server)
```javascript
{
  mode: 'normal' | 'bot' | '4player' | 'ranked',  // required
  username: string,                                   // 1-20 chars, no HTML
  mapType: string,                                    // optional, default 'turkey'
  token: string,                                      // optional, for auth/ranked
}
```
- Validates mode against whitelist: `['normal', 'bot', '4player', 'ranked']`
- Validates mapType against dynamically built list from `server/src/game/maps/*.json` + `'grid'`
- Sanitizes username: strips HTML tags, trims, enforces 1-20 char length
- **Ranked mode**: requires valid non-guest token, deducts 1 diamond entry fee, emits `diamond_update`
- **Bot mode**: instantly creates bot match via `createBotMatch()`
- **Normal/4player/ranked**: adds to matchmaking queue

#### `leave_lobby` (Client -> Server)
- No payload
- Removes from matchmaking queue
- If in a waiting room: removes player

#### `player_ready` (Client -> Server)
- No payload
- Sets `player.ready = true`
- Broadcasts `lobby_update`
- If room full + all ready + status is 'waiting': starts countdown

#### `lobby_update` (Server -> Client)
```javascript
{
  roomId: string,
  mode: string,
  players: Player[],
  maxPlayers: number,
}
```

#### `queue_update` (Server -> Client)
```javascript
{
  mode: string,
  position: number,
  queueSize: number,
  message?: string,     // e.g., 'Rakip baglantisi kesildi...'
}
```

#### `match_found` (Server -> Client)
```javascript
{
  roomId: string,
  players: string[],    // usernames
  mapType: string,
}
```

### 7.4 Spawn Events

#### `select_spawn` (Client -> Server)
```javascript
{ regionId: string }
```
- Rate limited (5/sec)
- Validates: in spawn_selection phase, region exists, not ROCKY, not gate region, not claimed by another
- If player already selected: undoes previous selection (restores region to original state)
- Claims region: sets type to SPAWN, hp to SPAWN_HP (40), owner to player
- Broadcasts `spawn_selected` to all

#### `spawn_selected` (Server -> Client)
```javascript
{
  playerId: string,
  regionId: string,
  previousRegionId: string | null,
  playerUsername: string,
}
```

#### `spawn_phase_end` (Server -> Client)
```javascript
{
  selections: { [playerId]: regionId }
}
```
Followed by per-player `regions_reveal` with fog-filtered region data.

### 7.5 Game Events

#### `send_soldiers` (Client -> Server)
```javascript
{
  sourceIds: string[],  // 1-12 region IDs
  targetId: string,
}
```
- Rate limited (5/sec)
- Validates: game is playing, player not eliminated, target exists
- Target cannot be: gate region, ROCKY region, not visible to player
- Attack range check: source must be within `attackRange` hops of target (BFS)
- For each valid source: splits soldiers (50%), creates Army, applies gate routing + pathfinding
- Emits `army_created` per-player with fog filtering

#### `army_created` (Server -> Client)
```javascript
{
  id: string,
  ownerId: string,
  count: number,
  position: { x: number, y: number },
  target: { x: number, y: number },
  targetRegionId: string,
  speed: number,
  arrived: boolean,
  destroyed: boolean,
  waypoints?: Array<{ x, y }>,         // for pathfinding around rocky
  finalTarget?: { x: number, y: number }, // when gate-routed or waypointed
  _sourceRegionId: string,              // for fog filtering
}
```
**Fog filtering**: Each player only receives army_created if they can see the source OR target region.

#### `build_building` (Client -> Server)
```javascript
{ regionId: string, buildingId: string }
```

#### `recall_army` (Client -> Server)
```javascript
{ armyId: string }
```
- Reverses army direction: finds nearest owned region, sets as new target
- Clears waypoints and gate routing

#### `state_update` (Server -> Client) - per tick
See section [10. Game State Broadcasting](#10-game-state-broadcasting)

#### `game_start` (Server -> Client)
```javascript
{
  myPlayerId: string,
  mode: string,
  mapType: string,
  spawnPhase: true,
  spawnSeconds: 15,
  gameConfig: {
    buildingCosts: Object,
    buildingLevelCostMultiplier: number,
    attackRange: number,
    fogDepth: number,
  },
  map: {
    width: number,
    height: number,
    mapType: string,
    regions: RegionData[],  // Spawn phase: all types shown as NORMAL, HP=0
    gates: GateData[],
  },
  players: PlayerData[],   // includes colorIndex and skinData
  armies: [],              // always empty at start
}
```

During spawn phase, regions are stripped of sensitive data:
- `type` -> 'NORMAL', `hp` -> 0, `defenseBonus` -> 0, `speedMultiplier` -> 1.0
- `resourceType` -> null, `resourceRate` -> 0, `building` -> null

#### `game_countdown` (Server -> Client)
```javascript
{ seconds: number }
```

#### `game_over` (Server -> Client)
```javascript
{
  winnerId: string | null,
  winnerName: string,
  duration: number,           // seconds
  finalState: GameState,      // full serialized state
  rankingData?: {             // only in ranked mode
    winner: { oldRating, newRating, ratingChange, ... },
    loser: { oldRating, newRating, ratingChange, ... },
  },
}
```

Also per-player for eliminated players:
```javascript
socket.emit('game_over', {
  winnerId: string,
  winnerName: string,
  duration: number,
});
```

#### `ranking_update` (Server -> Client) - ranked only
```javascript
{
  oldRating: number,
  newRating: number,
  ratingChange: number,
  rank: string,
  oldRank: string,
}
```

#### `diamond_reward` (Server -> Client)
```javascript
{ diamonds: number, total: number }
```

#### `promotion_reward` (Server -> Client)
```javascript
{ rank: string, reward: number, total: number }
```

### 7.6 Ability Events

#### `use_missile` (Client -> Server)
```javascript
{ targetRegionId: string }
```

#### `missile_applied` (Server -> Client) - fog-filtered
```javascript
{
  playerId: string,
  targetRegionId: string,
  damage: number,
  remainingHp: number,
  position: { x, y },
}
```

#### `use_nuclear` (Client -> Server)
```javascript
{ targetRegionId: string }
```

#### `nuclear_applied` (Server -> Client) - fog-filtered
```javascript
{
  playerId: string,
  targetRegionId: string,
  position: { x, y },
}
```

#### `use_barracks` (Client -> Server)
```javascript
{ targetRegionId: string }
```

#### `barracks_applied` (Server -> Client) - fog-filtered
```javascript
{
  playerId: string,
  targetRegionId: string,
  position: { x, y },
}
```

#### `use_speed_boost` (Client -> Server)
- No payload

#### `speed_boost_applied` (Server -> Client) - self only
```javascript
{ playerId: string }
```

#### `use_freeze` (Client -> Server)
- No payload

#### `freeze_applied` (Server -> Client) - broadcast to all
```javascript
{
  playerId: string,
  duration: number,       // ms
  frozenCount: number,
}
```

#### `ability_granted` (Server -> Client) - via state_update events
```javascript
{
  playerId: string,
  ability: 'missile' | 'nuclear' | 'barracks' | 'speedBoost' | 'freeze',
  regionId: string,
}
```

### 7.7 Siege & Region Events

#### `siege_started` (via state_update events)
```javascript
{ regionId: string, attackerId: string }
```

#### `siege_ended` (via state_update events)
```javascript
{ regionId: string, reason: 'captured' | 'repelled', playerId?: string }
```

#### `region_captured` (via state_update events)
```javascript
{ regionId: string, newOwnerId: string, previousOwnerId: string | null }
```

#### `player_eliminated` (via state_update events + direct emit)
```javascript
{ playerId: string, eliminatedBy: string | null }
```

### 7.8 Gate Events

#### `gate_teleport` (Server -> Client) - broadcast to all
```javascript
{
  armyId: string,
  fromGateId: string,
  toGateId: string,
  fromPosition: { x, y },
  toPosition: { x, y },
  newTarget: { x, y },
  color: string,
  colorHex: number,
}
```

### 7.9 Misc Events

#### `regions_reveal` (Server -> Client) - per-player, after spawn phase
```javascript
{
  regions: RegionData[],  // Full region data, fog-filtered (fogged regions strip resourceType/building)
}
```

#### `diamond_update` (Server -> Client)
```javascript
{ diamonds: number }
```

---

## 8. Matchmaking System

**File**: `server/src/matchmaking/MatchmakingService.js`

### Queue Structure

```javascript
this.queue = new Map();
// 'normal' -> [{ socket, username, mapType, userId? }]
// '4player' -> [{ socket, username, mapType, userId? }]
// 'ranked' -> [{ socket, username, mapType, userId?, rating? }]
```

### Match Requirements

| Mode | Players Required | Map Selection |
|------|-----------------|---------------|
| `normal` | 2 | First player's mapType |
| `4player` | 4 | First player's mapType |
| `ranked` | 2 | First player's mapType |
| `bot` | 1 (instant) | Player's mapType |

### Normal/4player Matching

FIFO: takes first N players from queue when enough are available.

### Ranked Matching

- Initial rating range: 200 points
- After 30 seconds wait: range widens by 100 every 15 seconds
- Checked every 5 seconds via interval
- Uses the wider range between two candidate players
- On match: creates room with `isRanked = true`

### Bot Matching

**File**: `server/src/matchmaking/BotMatchService.js`

```javascript
// Bot count based on map type:
// Large maps (world, europe, africa, usa, brazil, russia): 2-3 bots
// Medium maps (south_america, turkey, italy, portugal): 1-2 bots
// Small/grid maps: 1 bot

const BOT_NAMES = ['Bot Alpha', 'Bot Bravo', 'Bot Charlie', 'Bot Delta', 'Bot Echo', 'Bot Foxtrot'];
```

### Match Creation Flow

1. Create `GameRoom(roomId, mode, io, mapType)`
2. Emit `match_found` to all matched players
3. Add each player to room via `room.addPlayer()`
4. Store userId for stats tracking
5. Register socket->room mapping
6. Auto-start countdown

### Disconnect Handling

- Remove from queue
- If in room:
  - Pre-game (waiting/countdown): remove player, notify others
  - In-game: mark eliminated, regions become neutral
  - If no human players left: end game, clean up room

---

## 9. Game Room Lifecycle

**File**: `server/src/game/GameRoom.js`

### Constructor

```javascript
new GameRoom(id, mode, io, mapType = 'grid')
```
- `maxPlayers`: bot=2, 4player=4, else=2
- `isRanked`: set separately after construction
- Tracks: playerSockets, botAIs, network optimization caches

### Player Colors (16 maximum-contrast colors)

```javascript
const PLAYER_COLORS = [
  '#E94560', '#06D6A0', '#8338EC', '#FFD166',
  '#4CC9F0', '#FF6B35', '#8AC926', '#F72585',
  '#2EC4B6', '#FB5607', '#7209B7', '#FFBE0B',
  '#6A4C93', '#FF595E', '#E07C24', '#FF006E',
];
```

Color assignment uses maximum RGB distance from all existing players in the room.

### Phase Flow

```
waiting -> countdown (3s) -> spawn_selection (15s) -> preview (3s) -> playing -> finished
```

### Phase 1: Countdown (3 seconds)

- `game_countdown` emitted every second with remaining seconds
- On completion: calls `startGame()`

### Phase 2: Game Start + Spawn Selection

**startGame():**
1. Set status to `spawn_selection`
2. Generate map via `MapGenerator.generateMap(playerCount, mapType)`
3. Add all regions to game state
4. Store gates in game state (gate regions: hp=0, productionRate=0, no owner)
5. Initialize BotAI instances
6. Emit `game_start` to each player (with spawn-phase censored region data)
7. After 800ms delay (scene transition buffer): start spawn selection timer

**Spawn Selection (15 seconds):**
- Players click regions to select spawn
- Bots auto-select after 1-4 second random delay
- `onSelectSpawn(playerId, regionId)`:
  - Validates: spawn_selection phase, not ROCKY, not gate, not claimed
  - If already selected: undoes previous (restores original type/hp/defenseBonus)
  - Claims: sets type=SPAWN, hp=40, owner=player
  - Broadcasts `spawn_selected`
- Full 15 seconds always waited (no early end)

### Phase 3: End Spawn Selection

`_endSpawnSelection()`:
1. Auto-assign unselected players to random available regions
2. Grant 1 random starting ability to each player (from: missile, nuclear, barracks, speedBoost, freeze)
3. Broadcast `spawn_phase_end` with final selections
4. Per-player: emit `regions_reveal` with fog-filtered full region data
5. Set status to `preview`

### Phase 4: Preview (3 seconds)

- 3000ms + 200ms network buffer = 3200ms delay
- After delay: set status to `playing`, start GameLoop, start bot turns

### Phase 5: Playing (Game Loop)

**File**: `server/src/game/GameLoop.js`

Game loop runs at **10 ticks per second** (100ms per tick).

Each tick, in order:
1. **Production** - regions produce soldiers
2. **Movement** - armies move toward targets
3. **Collision** - enemy armies collide (bigger absorbs smaller)
4. **Conquest** - arrived armies: reinforce, counter-siege, or start siege
5. **Siege** - progressive mutual damage between all sides
6. **Gates** - teleport armies through gate portals
7. **Win Condition** - check eliminations and victory
8. **Broadcast** - send delta state to all players

### Phase 6: Game Over

**endGame(winnerId):**
1. Stop all timers/intervals (game loop, bots, countdown, spawn selection)
2. Set status to `finished`
3. Track analytics: `trackGameEnd(mode, duration)`
4. For each human player:
   - `authService.updateGameStats(userId, mode, won)`
   - `storeService.rewardMatchEnd(userId, mode, won)` -> diamond rewards
   - Emit `diamond_reward` if applicable
5. If ranked: process ELO changes, check promotions, emit `ranking_update` + `promotion_reward`
6. Broadcast `game_over` with final state and ranking data

### Diamond Rewards for Match End

```javascript
// Winner rewards:
// ranked: 5 diamonds
// bot: 1 diamond
// normal/4player: 2 diamonds
// Losers: 0 diamonds
```

---

## 10. Game State Broadcasting

**Method**: `GameRoom.broadcastState(events)`

Called every tick (10 times/second). Uses multiple optimization techniques:

### Delta Compression for Regions

Only sends regions that changed since last broadcast:
```javascript
for (const region of gameState.regions.values()) {
  if (region.isDirty()) {
    dirtyRegions.push(region.serializeDelta());
    region.markClean();
  }
}
```

**Dirty check** compares: `hp`, `ownerId`, `nuclearized`, `totalSiegeForce`, `building`

**Delta region payload**:
```javascript
{
  id: string,
  hp: number,          // Math.floor
  ownerId: string|null,
  nuclearized: boolean,
  abilityGranted: boolean,
  building: string|null,
  siegeForces: { [playerId]: number },
  siegeEntryPoints: [{ x, y, playerId }],
}
```

### Client-Side Prediction (No Army Positions)

Server does NOT send army positions each tick. Instead:
- `army_created` event gives initial position, target, speed, waypoints
- Client predicts movement locally
- Server only sends:
  - `destroyedArmies`: IDs of armies that disappeared (destroyed/arrived)
  - `armyUpdates`: count changes only (`{ id, c }`) for attrition/collision

### Player Data Throttling

Player data (charges, cooldowns, resources) sent only every 5th tick (~500ms):

```javascript
const shouldSendPlayers = this.gameState.tickCount % 5 === 0;
```

**Self player data** (full):
```javascript
{
  id, username, isBot,
  missileCharges, missileCooldownEnd,
  nuclearCharges, nuclearCooldownEnd,
  barracksCharges, barracksCooldownEnd,
  speedBoostCharges, speedBoostCooldownEnd, speedBoostUntil,
  eliminated, colorIndex, regionCount,
  resources: { iron, crystal, uranium },  // floored to 1 decimal
}
```

**Enemy player data** (minimal):
```javascript
{ id, username, isBot, eliminated, colorIndex, regionCount }
```

### Stealth Region Filtering

Regions with `stealth_tower` building: enemy players receive `hp: -1, stealthed: true` instead of actual HP.

### Fog-Based Army Count Filtering

Army count changes only sent if player can see the army (owns it or its target region is visible).

### Revealed Regions

When fog lifts (player captures new territory), newly visible regions' data (resourceType, building, type, defenseBonus) is sent via `revealedRegions` array.

### Full state_update Payload

```javascript
{
  regions: RegionDelta[],           // only dirty regions
  destroyedArmies: string[],       // army IDs removed
  armyUpdates?: [{ id, c }],       // count changes only, fog-filtered
  revealedRegions?: [{             // newly visible regions
    id, resourceType, resourceRate, building, type, defenseBonus
  }],
  events: GameEvent[],              // siege_started, region_captured, etc.
  tickCount: number,
  gameTime: number,                 // ms since game start
  players?: PlayerData[],           // only every 5th tick
}
```

---

## 11. Combat System

### 11.1 Sending Soldiers

**Method**: `GameRoom.onSendSoldiers(playerId, sourceIds, targetId)`

For each valid source region:
1. Validate ownership: `sourceRegion.ownerId === playerId`
2. Minimum soldiers: `sourceRegion.hp >= 2`
3. Attack range check: BFS from source to target within `attackRange` hops (considers gate connections)
4. Calculate soldiers: `Math.floor(sourceRegion.hp * SOLDIER_SPLIT_RATIO)` where `SOLDIER_SPLIT_RATIO = 0.5`
5. Remove soldiers from source
6. Spawn position: closest edge point of source polygon toward target center
7. Arrival position: closest edge point of target polygon toward source center
8. Create Army object
9. Apply gate routing: if route through gate is shorter, set gate waypoint
10. Compute pathfinding waypoints around ROCKY regions

**Edge Point Calculation**: Projects target point onto each polygon edge segment, finds closest point.

**Attack Range BFS**: Includes normal neighbors AND extended gate connections (neighbors of gate1 connect to neighbors of gate2).

### 11.2 Army Movement

**File**: `server/src/game/MovementSystem.js`

Each tick:
1. **Stuck army cleanup**: destroy armies alive > 45 seconds
2. **Attrition**: lose 1 soldier per second while traveling (`army._attritionAccum`)
3. **Freeze check**: if `army.frozenUntil > now`, skip movement
4. **Speed region check**: if army is inside SNOW/SPEED region polygon (ray casting), apply `region.speedMultiplier` to tick duration
5. **Player speed boost**: if `player._speedBoostUntil > now`, multiply tick by `SPEED_BOOST_MULTIPLIER (1.25)`
6. **Move**: `army.move(effectiveDuration)` - linear interpolation toward target
7. **Early arrival**: if army entered target region polygon, arrive immediately
8. **Waypoint advance**: if arrived at waypoint, advance to next (or final target)

**Army.move()**: `speed * (tickDuration / 1000)` pixels per tick. Default `ARMY_SPEED = 25` pixels/second.

### 11.3 Collision

**File**: `server/src/game/CollisionSystem.js`

Every tick, check all army pairs from different owners:
- Within `ARMY_COLLISION_RADIUS = 20` pixels
- Larger army survives with `count -= smallerCount`
- Equal: both destroyed
- Emits `army_destroyed` events

### 11.4 Conquest (Army Arrival)

**File**: `server/src/game/ConquestSystem.js`

When armies arrive:

**Own region (no siege)**: add soldiers as reinforcement
**Own region (under siege)**: distribute army count as damage against all siege forces evenly
**Enemy/neutral region**: add to siege force, record entry point, emit `siege_started` if new siege

**Combat power variation**: `COMBAT_POWER_VARIATION = 0.2` (+-20% random - defined but mainly used in siege context)

### 11.5 Siege System (Tug of War)

**File**: `server/src/game/SiegeSystem.js`

Multi-player siege with mutual damage:

**Each tick** for each region under siege:
1. Build force list: defender (region HP) + all attackers (siegeForces)
2. Calculate total force across all sides
3. Damage formula: each side takes `10% * opposing_total_force * dt` damage per second
4. **Defense bonus**: defender force multiplied by `1.20` (20% bonus)
5. **Wall building**: adds extra `0.50` (50%) to defense bonus
6. Apply damages to defender HP and attacker siege forces
7. Remove depleted attackers

**Capture condition**: if defender HP <= 0, strongest remaining attacker captures with their remaining force as new HP + `defenseBonus`.

**On capture**:
1. Transfer ownership
2. Clear all siege forces
3. Grant 1 random ability charge (if region hasn't granted one before: `abilityGranted` flag)
4. Check if previous owner lost all regions -> elimination

**Mountain defense bonus**: captured mountain regions add `defenseBonus` (random from [10, 25, 50]) to starting HP.

---

## 12. Ability System

All abilities use a charge + cooldown system. Charges are gained by capturing regions (1 random ability per first capture of each region).

### 12.1 Missile

**File**: `server/src/game/BombSystem.js`

- **Target**: enemy or neutral region (not own, not ROCKY)
- **Damage**: `floor(region.hp * 0.5)` (50% of current HP)
- **Cooldown**: 10,000ms (10 seconds)
- **Initial charges**: 0
- **Iron Dome**: buildings with `iron_dome` block missiles within 3 neighbor hops (NOT currently enforced in BombSystem code - the building catalog defines it but the check is not implemented in the missile system)

### 12.2 Nuclear

**File**: `server/src/game/NuclearSystem.js`

- **Target**: enemy or neutral region (not own, not ROCKY)
- **Effect**: sets `region.nuclearizedUntil = Date.now() + NUCLEAR_DURATION`
- **NUCLEAR_DURATION**: 3,000ms (3 seconds in constants, but code uses `constants.NUCLEAR_DURATION || 30000` suggesting 30s may be intended)
- **Nuclearized effect**: disables production AND resource production
- **Cooldown**: 10,000ms
- **Initial charges**: 0

### 12.3 Barracks (Region Upgrade)

**File**: `server/src/game/BarracksSystem.js`

- **Target**: own region (not TOWER, not ROCKY, not nuclearized)
- **Effect**: upgrades region type to TOWER, sets production rate to `TOWER_PRODUCTION_RATE (1.5)`
- **Cooldown**: 10,000ms
- **Initial charges**: 0

### 12.4 Speed Boost

**File**: `server/src/game/SpeedBoostSystem.js`

- **Target**: self (no target needed)
- **Effect**: sets `player._speedBoostUntil = Date.now() + SPEED_BOOST_DURATION`
- **Duration**: 10,000ms (10 seconds)
- **Multiplier**: `SPEED_BOOST_MULTIPLIER = 1.25` (25% faster armies)
- **Cooldown**: 10,000ms
- **Initial charges**: 0

### 12.5 Freeze

**File**: `server/src/game/FreezeSystem.js`

- **Target**: self-cast (no target needed)
- **Effect**: freezes ALL enemy armies mid-air for `FREEZE_ARMY_DURATION = 1500ms` (1.5 seconds)
- **Mechanism**: sets `army.frozenUntil = now + duration` on all non-owned, non-destroyed, non-arrived armies
- **Cooldown**: 30,000ms (30 seconds)
- **Initial charges**: 0

### Ability Charge Acquisition

- **Start of game**: each player gets 1 random ability charge (from all 5 types)
- **Region capture**: first capture of each region grants 1 random ability charge (`abilityGranted` flag per region)

### Fog Filtering for Ability Events

- `missile_applied`, `nuclear_applied`, `barracks_applied`: emitted only to the actor + players who can see the target region
- `speed_boost_applied`: emitted only to the player who activated it
- `freeze_applied`: broadcast to ALL players (everyone needs to know about frozen armies)

---

## 13. Building System

**File**: `server/src/game/BuildingCatalog.js`

Each region can have at most 1 building. Buildings cost resources (iron, crystal, uranium).

### Building Catalog

| ID | Name | Cost (I/C/U) | MaxPerPlayer | Scope | Effect |
|----|------|---------------|--------------|-------|--------|
| `city_center` | Sehir Merkezi | 80/80/40 | unlimited | global | +20% max HP cap (compound) |
| `barracks` | Baraka | 60/30/30 | unlimited | global | +10% production bonus |
| `wall` | Duvar | 40/20/10 | unlimited | local | +50% defense in siege |
| `iron_dome` | Demir Kubbe | 60/60/80 | unlimited | local | Blocks missiles within 3 hops |
| `stealth_tower` | Gorunmezlik Kulesi | 30/70/50 | unlimited | local | Region invisible to enemies (HP shows as -1) |
| `drone_facility` | Drone Tesisi | 50/50/70 | unlimited | local | Unlocks drone attack |
| `missile_base` | Fuze Ussu | 40/40/100 | unlimited | local | Unlocks missile attack |

### Level Cost Multiplier

Each additional building of the **same type** costs more:
```
actualCost = baseCost * (1 + existingCount * buildingLevelCostMultiplier / 100)
```
Default multiplier: 50% (so 2nd costs 1.5x, 3rd costs 2x, 4th costs 2.5x, etc.)

### Building Effects in Game Logic

**city_center** (ProductionSystem):
```javascript
// Max HP cap starts at 300
// Each city_center: maxHP *= 1.20 (compound)
// 1 city_center: 360, 2: 432, 3: 518
```

**barracks** (ProductionSystem):
```javascript
// Each barracks adds +10% production globally
// production = ceil(production * (1 + barracksCount * 0.10))
```

**wall** (SiegeSystem):
```javascript
// Defender gets 20% base defense bonus
// Wall adds +50% extra
// DEFENSE_BONUS = 1.20 + (wall ? 0.50 : 0) = 1.70 with wall
```

**stealth_tower** (broadcastState):
```javascript
// Enemy players see hp: -1, stealthed: true for this region
```

**Over-capacity decay** (ProductionSystem):
```javascript
// If region HP >= maxHP: lose 1% per second
// Never decays below maxHP
```

---

## 14. Map Generation Pipeline

**File**: `server/src/game/MapGenerator.js`

### Entry Point

```javascript
function generateMap(playerCount, mapType = 'grid')
```

If `mapType !== 'grid'`: loads GeoJSON and generates from real geography.
If `mapType === 'grid'`: generates procedural grid map.

### GeoJSON Loading

Search paths (in order):
1. `server/src/game/maps/{mapType}.json`
2. `client/dist/maps/{mapType}.json`
3. `client/public/maps/{mapType}.json`

Cached in memory after first load.

### GeoJSON Map Generation Pipeline

**Step 1: Extract Polygons**
- For MultiPolygon: picks largest ring by area
- Extracts name from properties (tries: name, NAME, Name, ADMIN, NAME_2, NAME_3, NAME_1)

**Step 2: Split Oversized / Merge Undersized Regions**
- Split threshold: > 1.5x average area
- Merge threshold: < 0.15x average area
- Max regions: 80
- Up to 5 splitting passes
- Split: cuts polygon along longest axis through centroid
- Merge: merges into nearest neighbor by centroid distance

**Step 3: Mercator Projection**
```javascript
function mercatorY(lat) {
  const latRad = (lat * Math.PI) / 180;
  return (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}
```
- Map dimensions: 1600 x 900 pixels
- Padding: 50px on each side
- Uniform scale: `Math.min(scaleX, scaleY)` with centering

**Step 4: Polygon Simplification (RDP)**
- Max points: 40 for Russia, 60 for others
- Ramer-Douglas-Peucker algorithm with iterative epsilon increase (starting 0.5, *= 1.4)
- Fallback: uniform sampling

**Step 5: Compute Neighbors**
```javascript
const factor = n > 40 ? 0.025 : 0.015;
const threshold = Math.max(MAP_WIDTH, MAP_HEIGHT) * factor;
```
Two regions are neighbors if:
- At least 2 vertices within threshold distance, OR
- Edge midpoints are close AND endpoints are within 3x threshold

**Step 6: Ensure Connectivity**
- Phase 1: every region gets at least 2 neighbors (adds nearest)
- Phase 2: BFS to find disconnected components, bridges them via nearest pair

**Step 7: Spawn Selection** (farthest-first greedy)
- Only considers regions with >= 2 neighbors
- First spawn: top-left eligible region
- Each subsequent: maximizes minimum distance to existing spawns

**Step 8: Tower Selection**
- Count: `n <= 10: 1, n <= 20: 2, n <= 30: 3, n <= 50: 4, else: 5`
- Random selection with minimum spacing (`15% of min(width, height)`)

**Step 9: Create Region Objects**
- Spawn regions: type=SPAWN, hp=40
- Tower regions: type=TOWER, hp=random(3-30)
- Normal regions: type=NORMAL, hp=random(3-30)

**Step 10: Generate Gates** (before special types)
- Via `GateSystem.createGates()`

**Step 11: Assign Special Region Types** (excluding gate regions)
- ~15% MOUNTAIN (always), ~15% SNOW (60% chance), ~8% ROCKY (60% chance, requires >= 10 normal regions)
- Constraints: gate regions never converted, rocky not adjacent to spawn or other rocky

**Step 12: Resource Distribution**
- Types: `['iron', 'crystal', 'uranium']`
- Rate: random 0.8-1.2 per second
- Evenly distributed across eligible regions (not ROCKY, not gate)

### Grid Map Generation

For `mapType === 'grid'`:
- 2 players: 5x4 grid (20 regions)
- 3+ players: 6x5 grid (30 regions)
- Cell vertices with +-3% jitter
- Centers with +-20% jitter
- 8-directional neighbors (including diagonals)
- Spawns at corners
- Same gate/special type assignment pipeline

---

## 15. Gate System

**File**: `server/src/game/GateSystem.js`

### Gate Object Structure

```javascript
{
  id: string,            // 'gate_xxx'
  pairId: string,        // ID of paired gate
  pairGroupId: string,   // 'gatepair_xxx' - groups a pair
  regionId: string,      // Region this gate is on
  color: string,         // 'purple', 'cyan', or 'pink'
  colorHex: number,      // 0xBB44FF, 0x00DDDD, or 0xFF44AA
  position: { x, y },    // Region center coordinates
}
```

### Gate Colors

```javascript
const GATE_COLORS = [
  { name: 'purple', hex: 0xBB44FF },
  { name: 'cyan',   hex: 0x00DDDD },
  { name: 'pink',   hex: 0xFF44AA },
];
```

### Gate Creation Rules

**Pair count** (random):
- < 15 regions: 40% none, 60% one pair
- 15-39 regions: 20% none, 50% one, 30% two pairs
- 40+ regions: 10% none, 40% one, 50% two pairs
- Minimum 6 regions required

**Placement constraints**:
- Not on spawn or tower regions
- Minimum `MIN_GATE_HOP_DISTANCE = 4` BFS hops between paired gates
- Minimum `MIN_GATE_EUCLIDEAN_DISTANCE = 200` pixels apart
- Up to `MAX_GATE_ATTEMPTS = 3` retries per pair

### Gate Teleportation (Per Tick)

**Constants**:
- `GATE_TELEPORT_THRESHOLD = 15` pixels (army must be this close)
- `GATE_EXIT_OFFSET = 20` pixels (offset after teleport)
- `GATE_COOLDOWN_MS = 500` ms per army

**Logic**:
- Only teleports armies that were intentionally gate-routed (`army._exitGateId` must be set)
- Skip if army's final target IS a gate region (prevents infinite loop)
- On teleport: move army to paired gate position + offset toward target
- Restore original target, clear gate routing state
- Emit `gate_teleport` event

### Gate Pathfinding

```javascript
GateSystem.findShortestPath(fromPos, toPos, gates)
```
Compares direct distance vs each gate pair route (from->gateA + gateB->to). Returns shortest.

---

## 16. Fog of War / Visibility

**File**: `server/src/game/VisibilitySystem.js`

### Algorithm: BFS from Owned Regions

```javascript
function getVisibleRegions(playerId, gameState) -> Set<string>
```

1. Start: all regions owned by player (depth 0)
2. BFS up to `FOG_DEPTH` hops (default: 2)
3. Normal neighbors count as 1 hop
4. Gate virtual neighbors count as 1 hop (gate pair = bidirectional connection)
5. **Gate tunnel extension**: if a visible region contains a gate, also see:
   - The paired gate's region
   - All neighbors of the paired gate's region

### fog depth

```javascript
function getFogDepth() {
  const settings = getGameSettings(); // admin-configurable
  return settings.fogDepth || constants.FOG_DEPTH || 2;
}
```

### Where Fog Filtering is Applied

1. **state_update**: army count changes filtered by target region visibility
2. **army_created**: only sent if player can see source or target region
3. **regions_reveal** (after spawn phase): fogged regions stripped of resourceType, building
4. **revealedRegions** in state_update: sent when fog lifts on newly captured territory
5. **Ability events** (missile, nuclear, barracks): only sent to actor + players who can see target
6. **Stealth tower**: overrides HP to -1 for enemies
7. **send_soldiers validation**: target must be visible to player

---

## 17. Pathfinding System

**File**: `server/src/game/PathfindingSystem.js`

### Purpose

Computes waypoints around ROCKY (impassable) regions for army movement.

### Algorithm: Visibility Graph + Dijkstra

1. If direct path is clear of all rocky polygons: return empty waypoints
2. Expand rocky polygon vertices outward by `EXPAND_MARGIN = 18` pixels
3. Filter out expanded vertices that are inside other rocky polygons
4. Build visibility graph: edges between start, end, and candidate waypoints that don't cross any rocky polygon
5. Dijkstra shortest path from start to end
6. Return intermediate waypoints (not including start/end)

### Segment-Polygon Intersection

Uses ray-casting algorithm for point-in-polygon and segment intersection checks.

### Integration

Called in `onSendSoldiers()`:
```javascript
const rockyRegions = PathfindingSystem.getRockyRegions(gameState);
if (rockyRegions.length > 0) {
  const waypoints = PathfindingSystem.computeWaypoints(army.position, army.target, rockyRegions);
  if (waypoints.length > 0) army.setWaypoints(waypoints);
}
```

### Waypoint Following

- `WAYPOINT_THRESHOLD = 8` pixels for waypoint arrival (in MovementSystem)
- When army arrives at a waypoint: `army.advanceWaypoint()` points to next
- After all waypoints done: heads to final target

---

## 18. Bot AI

**File**: `server/src/game/BotAI.js`

### Decision Interval

`BOT_DECISION_INTERVAL = 1500ms` (1.5 seconds between decisions)

### Decision Types

1. **Reinforce** (70% chance if available): move soldiers from safe backend regions to weak frontline/siege-under regions
2. **Attack** (if no reinforce): score all reachable enemy/neutral targets, pick best
3. **Skip** (10% chance even with good moves): unpredictability

### Attack Scoring

For each target candidate:
- Positive: `60 - target.hp` (neutral) or `50 - target.hp` (enemy)
- Bonus: TOWER (+40/+35), SPAWN (+25), MOUNTAIN (+10)
- Penalty: nuclearized (-15), distance (-1 per 10px)
- Bonus: can safely capture (+30), can capture (+10)
- Penalty: sources left too weak (avg < 4 hp after split: -25)
- Random: +-10% variation

### Effective Soldiers Calculation

Bot accounts for attrition loss during travel:
```javascript
attritionLoss = Math.floor(distance / speed)
effectiveSoldiers = Math.max(0, soldierCount - attritionLoss)
```

### Multi-Source Attacks

Bot can send armies from multiple regions simultaneously if needed.

### Gate-Aware Targeting

Bot considers gate-connected regions as attack candidates.

### Ability Usage (every 3 seconds)

Priority order:
1. **Freeze**: if 3+ enemy armies in flight
2. **Speed Boost**: if 2+ own armies in flight
3. **Missile**: on enemy border region with HP > 12 (picks highest HP)
4. **Nuclear**: on enemy TOWER/SPAWN (not nuclearized), or any enemy with HP > 8
5. **Barracks**: on safe interior own region (most own neighbors + highest HP)

### Spawn Selection (during spawn phase)

Bots auto-select after 1-4 second random delay. Pick random available region (not ROCKY, not gate, not owned, not claimed).

---

## 19. Skin / Store System

### SkinCatalog.js - All Available Skins

#### Color Override Skins (category: 'skin')

| ID | Name | Price | Rarity | Data |
|----|------|-------|--------|------|
| `skin_black` | Siyah | 1000 | epic | `{ color: '#1a1a1a' }` |
| `skin_white` | Beyaz | 1000 | epic | `{ color: '#f0f0f0' }` |

#### Army Shapes (category: 'army_shape')

| ID | Name | Price | Rarity | Data |
|----|------|-------|--------|------|
| `army_circle` | Daire | 150 | common | `{ shape: 'circle' }` |
| `army_diamond` | Elmas | 200 | common | `{ shape: 'diamond' }` |
| `army_star` | Yildiz | 500 | rare | `{ shape: 'star' }` |
| `army_shield` | Kalkan | 750 | epic | `{ shape: 'shield' }` |
| `army_hex` | Hexagon | 1000 | epic | `{ shape: 'hexagon' }` |

#### Trail Effects (category: 'trail_effect')

| ID | Name | Price | Rarity | Data |
|----|------|-------|--------|------|
| `trail_sparkle` | Isiltili Iz | 300 | rare | `{ trail: 'sparkle' }` |
| `trail_fire` | Atesli Iz | 500 | rare | `{ trail: 'fire' }` |
| `trail_ice` | Buzlu Iz | 500 | rare | `{ trail: 'ice' }` |
| `trail_rainbow` | Gokkusagi Izi | 2000 | legendary | `{ trail: 'rainbow' }` |

#### Capture Effects (category: 'capture_effect')

| ID | Name | Price | Rarity | Data |
|----|------|-------|--------|------|
| `capture_sparkle` | Isiltili Fetih | 400 | rare | `{ effect: 'sparkle' }` |
| `capture_shockwave` | Sarsinti | 600 | rare | `{ effect: 'shockwave' }` |
| `capture_flames` | Alevler | 1000 | epic | `{ effect: 'flames' }` |
| `capture_lightning` | Simse | 2500 | legendary | `{ effect: 'lightning' }` |

**Rarity order**: common(0) -> rare(1) -> epic(2) -> legendary(3)

### Diamond Economy

| Source | Amount |
|--------|--------|
| Registration | 500 starting diamonds |
| Guest account | 0 diamonds |
| Win (ranked) | +5 |
| Win (normal/4player) | +2 |
| Win (bot) | +1 |
| Loss | 0 |
| Ranked entry fee | -1 |
| Daily reward (day N) | 10 + (N-1) diamonds |
| Rank promotion | +100 |

### StoreService

- In-memory cache with DB persistence
- `addDiamonds()`: clamped to [-10000, 10000], never goes below 0
- `purchaseSkin()`: validates skin exists, not already owned, sufficient diamonds
- `equipSkin()`: sets active skin for its category
- `getPlayerSkinData(userId)`: returns resolved skin configs for game_start transmission

---

## 20. Daily Rewards

**File**: `server/src/daily/DailyRewardService.js`

### Configuration

```javascript
const MAX_STREAK_DAYS = 30;
const BASE_REWARD = 10;       // Day 1 = 10 diamonds
const RESET_HOUR_UTC = 6;     // Day resets at 06:00 UTC (09:00 Turkey)
```

### Reward Formula

```javascript
reward(day) = BASE_REWARD + (day - 1) = 10 + (day - 1)
// Day 1: 10, Day 2: 11, ..., Day 30: 39
```

### Streak Logic

- **Same day**: already claimed, `canClaim: false`
- **Yesterday**: streak continues, next day = current + 1
- **2+ days gap**: streak broken, reset to day 1
- **Day 30**: cycles back to day 1

### Day Boundary

```javascript
// Day changes at 06:00 UTC (09:00 Turkey time)
const adjusted = ms - RESET_HOUR_UTC * 60 * 60 * 1000;
return Math.floor(adjusted / (24 * 60 * 60 * 1000));
```

### Guests

Guests cannot use daily rewards (403 Forbidden).

---

## 21. Ranked System

**File**: `server/src/ranking/RankingService.js`

### ELO Rating

- **Default rating**: 0
- **K-Factor**: 32 (standard ELO)
- **Min rating**: 0 (clamped, never negative)

### ELO Calculation

```javascript
expectedWinner = 1 / (1 + 10^((loserRating - winnerRating) / 400))
expectedLoser  = 1 / (1 + 10^((winnerRating - loserRating) / 400))
winnerDelta = round(K * (1 - expectedWinner))
loserDelta  = round(K * (0 - expectedLoser))
```

### Leagues

| League | Min Rating | Promotion Reward |
|--------|------------|------------------|
| Bronz | 0 | - |
| Gumus | 800 | 100 diamonds |
| Altin | 1000 | 100 diamonds |
| Elmas | 1200 | 100 diamonds |
| Usta | 1400 | 100 diamonds |

### Ranked Match Flow

1. Player joins ranked queue (requires auth, non-guest, 1 diamond entry fee)
2. Matchmaking finds opponent within rating range
3. Normal game plays out
4. On game end: `rankingService.recordMatch(winnerId, loserId)` updates both ratings
5. Check for league promotion: if rank changed to higher tier AND not previously rewarded -> +100 diamonds
6. Emit `ranking_update` and `promotion_reward` events

### Rating Range Widening

- Initial range: 200 points
- After 30s wait: widens by 100 every 15 seconds
- Checked every 5 seconds

### Storage

Currently in-memory only (Map). Not persisted to PostgreSQL.

---

## 22. Analytics System

**File**: `server/src/analytics/AnalyticsService.js`

### Realtime Counters (updated every 10 seconds)

- `onlinePlayers`: from `io.engine.clientsCount`
- `activeGames`: from `matchmakingService.rooms.size`
- `peakOnlineToday`, `peakGamesToday`

### Daily Counters (reset at midnight Turkey time)

- `dailyGamesPlayed`: `{ bot, normal, ranked }`
- `dailyDiamondsEarned`, `dailyDiamondsSpent`
- `dailyNewUsers`, `dailyFriendRequests`, `dailyRewardClaims`
- `dailyGameDurations`: array of seconds
- `dailyActiveUserIds`: Set

### Daily Snapshot

Saved at midnight Turkey time (21:00 UTC) to `analytics_snapshots` table.
Includes all daily counters + total users from DB.

### Error Tracking

- In-memory: `errorCounts` (by type), `recentErrors` (last 50)
- DB: `error_logs` table with type, message, stack, context

### System Health

- Uptime (ms, formatted)
- Memory: heapUsed, heapTotal, RSS, external (all in MB)
- Error counts and recent errors
- Node.js version and platform

### Server Uptime

- Records start time on init
- Records stop time and reason on shutdown
- Stored in `server_uptime` table

---

## 23. Rate Limiting and Security

### Socket Event Rate Limiting

**File**: `server/src/socket/handlers/gameHandler.js`

```javascript
const RATE_LIMIT_MAX = 5;       // max events per second
const RATE_LIMIT_WINDOW = 1000; // 1 second window
```

Applied to: `send_soldiers`, `build_building`, `recall_army`, `use_missile`, `use_nuclear`, `use_barracks`, `use_speed_boost`, `use_freeze`, `select_spawn`

NOT applied to: `ping_check` (lightweight)

Rate limit uses per-socket sliding window counter. Cleaned up on disconnect.

### Input Validation

All socket events validate:
- `data` is an object
- String fields exist, are strings, and have max length (50 chars)
- `sourceIds` is array, max length 12
- All IDs are short strings (< 50 chars)

### Username Sanitization

```javascript
function sanitizeUsername(raw) {
  const stripped = raw.replace(/<[^>]*>/g, '').trim(); // Strip HTML tags
  if (stripped.length < 1 || stripped.length > 20) return null;
  return stripped;
}
```

### Map Type Validation

Valid map types are dynamically built from `server/src/game/maps/*.json` files + `'grid'`.

### Server-Authoritative Architecture

All game logic runs server-side:
- Client never directly modifies game state
- All actions validated on server before applying
- Army positions calculated on server (client does client-side prediction)
- Fog of war enforced server-side (clients never receive hidden data)

### Specific Security Measures

1. **Fog enforcement**: `send_soldiers` validates target is in player's visible regions
2. **Attack range**: BFS check ensures source is within `attackRange` hops of target
3. **Ownership checks**: all actions verify player owns the region
4. **Rocky/gate targeting**: cannot target ROCKY or gate regions
5. **Elimination check**: eliminated players cannot perform actions
6. **Stealth**: stealth tower regions show HP=-1 to enemies
7. **Diamond safety**: `addDiamonds()` clamped to [-10000, 10000], never negative
8. **Spawn phase data hiding**: region types/HP/resources hidden during spawn selection
9. **Max payload size**: Socket.IO `maxHttpBufferSize: 100KB`
10. **Helmet.js**: security headers (CSP, X-Frame-Options, etc.)
11. **WebSocket-only**: no HTTP polling (reduces attack surface)

### Admin Access Control

```javascript
const ADMIN_USERNAMES = ['kan'];
// Verified via JWT token + username whitelist check
```

---

## 24. Shared Constants

**File**: `shared/gameConstants.js`

```javascript
module.exports = {
  // Tick Rate
  TICK_RATE: 10,                          // ticks per second
  TICK_DURATION: 100,                     // ms per tick

  // Production
  BASE_PRODUCTION_RATE: 1,                // soldiers/sec for normal regions
  TOWER_PRODUCTION_RATE: 1.5,             // soldiers/sec for towers
  SPAWN_PRODUCTION_RATE: 1,               // soldiers/sec for spawn regions
  NEUTRAL_PRODUCTION_RATE: 0.05,          // 1 soldier per 20 seconds for neutral

  // Terrain
  MOUNTAIN_DEFENSE_BONUS: [10, 25, 50],   // Random extra defense on capture
  MOUNTAIN_PRODUCTION_RATE: 0.5,
  SNOW_SPEED_MULTIPLIER: 0.28,            // 28% speed (3.5x slower)
  SNOW_PRODUCTION_RATE: 0.8,
  SPEED_REGION_MULTIPLIER: 1.5,           // 150% speed
  SPEED_PRODUCTION_RATE: 0.8,

  // Abilities
  MISSILE_COOLDOWN: 10000,                // 10s
  MISSILE_DAMAGE_RATIO: 0.5,              // 50% HP damage
  MISSILE_INITIAL_CHARGES: 0,
  COMBAT_POWER_VARIATION: 0.2,            // +-20%
  NUCLEAR_COOLDOWN: 10000,                // 10s
  NUCLEAR_DURATION: 3000,                 // 3s production disable
  NUCLEAR_INITIAL_CHARGES: 0,
  BARRACKS_COOLDOWN: 10000,               // 10s
  BARRACKS_INITIAL_CHARGES: 0,
  SPEED_BOOST_COOLDOWN: 10000,            // 10s
  SPEED_BOOST_DURATION: 10000,            // 10s active
  SPEED_BOOST_MULTIPLIER: 1.25,           // 25% faster
  SPEED_BOOST_INITIAL_CHARGES: 0,
  FREEZE_COOLDOWN: 30000,                 // 30s
  FREEZE_ARMY_DURATION: 1500,             // 1.5s freeze
  FREEZE_INITIAL_CHARGES: 0,

  // Army
  ARMY_SPEED: 25,                         // pixels/second
  ARMY_COLLISION_RADIUS: 20,              // pixels
  SOLDIER_SPLIT_RATIO: 0.5,              // send 50% of soldiers

  // Map
  MAP_WIDTH: 1600,
  MAP_HEIGHT: 900,
  MIN_NEUTRAL_HP: 3,
  MAX_NEUTRAL_HP: 30,
  SPAWN_HP: 40,

  // Siege
  SIEGE_DAMAGE_PER_SECOND: 2.0,          // (used as reference, actual: 10% of opposing force)
  SIEGE_ATTRITION_PER_SECOND: 0.3,
  SIEGE_POSITION_OFFSET: 30,             // px
  SIEGE_MAX_ARMIES_PER_REGION: 3,

  // Visibility & Attack Range
  FOG_DEPTH: 2,                           // BFS depth for fog of war
  ATTACK_RANGE: 1,                        // hops for sending armies

  // Resources
  RESOURCE_TYPES: ['iron', 'crystal', 'uranium'],
  RESOURCE_MIN_RATE: 0.8,
  RESOURCE_MAX_RATE: 1.2,

  // Game Flow
  COUNTDOWN_SECONDS: 3,
  SPAWN_SELECTION_SECONDS: 15,
  BOT_DECISION_INTERVAL: 1500,           // ms
};
```

### Region Types (shared/regionTypes.js)

```javascript
{
  NORMAL: 'NORMAL',
  TOWER: 'TOWER',
  SPAWN: 'SPAWN',
  MOUNTAIN: 'MOUNTAIN',
  SNOW: 'SNOW',
  ROCKY: 'ROCKY',      // Impassable
  SPEED: 'SPEED',
}
```

### Production per Region Type

| Type | Base Rate | Notes |
|------|-----------|-------|
| NORMAL | 1.0/s | Standard |
| TOWER | 1.5/s | 50% bonus |
| SPAWN | 1.0/s | Same as normal |
| MOUNTAIN | 0.5/s | Low production, defense bonus |
| SNOW | 0.8/s | Slows armies to 28% speed |
| ROCKY | 0/s | Impassable, no production |
| SPEED | 0.8/s | Speeds armies to 150% |
| Neutral (unowned) | 0.05/s | 1 soldier per 20 seconds |

### Interest Rate

All owned regions get bonus production: `1% of current HP per second`.

### Version Info (shared/version.js)

```javascript
{ version: '0.14.0', date: '2026-04-05', changelog: 'https://github.com/...' }
```

---

## Appendix A: File Structure Reference

```
server/
  src/
    index.js                    - Entry point, Express setup, startup
    config/
      index.js                  - Configuration from env vars
      redis.js                  - Redis connection
      database.js               - PostgreSQL connection
    socket/
      index.js                  - Socket.IO setup
      handlers/
        gameHandler.js          - All game socket events
        lobbyHandler.js         - All lobby socket events
    game/
      GameRoom.js               - Game room lifecycle, all game actions
      GameState.js              - State container
      GameLoop.js               - Tick loop orchestrator
      Region.js                 - Region class
      Player.js                 - Player class
      Army.js                   - Army class with waypoint support
      MapGenerator.js           - GeoJSON + grid map generation
      MovementSystem.js         - Per-tick army movement
      PathfindingSystem.js      - Rocky region avoidance (Dijkstra)
      VisibilitySystem.js       - Fog of war (BFS)
      GateSystem.js             - Gate creation + teleportation
      ProductionSystem.js       - Soldier production per tick
      CollisionSystem.js        - Army collision resolution
      ConquestSystem.js         - Army arrival handling
      SiegeSystem.js            - Tug-of-war siege combat
      WinCondition.js           - Elimination + victory check
      BombSystem.js             - Missile ability
      NuclearSystem.js          - Nuclear ability
      BarracksSystem.js         - Barracks upgrade ability
      SpeedBoostSystem.js       - Speed boost ability
      FreezeSystem.js           - Freeze ability
      BuildingCatalog.js        - Building definitions
      BotAI.js                  - Bot decision engine
      constants.js              - Re-exports shared constants
      maps/                     - GeoJSON map files
    auth/
      AuthService.js            - Auth logic, JWT, password hashing
      authRoutes.js             - Auth REST endpoints
    store/
      StoreService.js           - Diamond/skin transactions
      SkinCatalog.js            - All skin definitions
      storeRoutes.js            - Store REST endpoints
    ranking/
      RankingService.js         - ELO rating system
      rankingRoutes.js          - Ranking REST endpoints
    friends/
      FriendService.js          - Friend request logic
      friendRoutes.js           - Friend REST endpoints
    daily/
      DailyRewardService.js     - Daily login rewards
      dailyRewardRoutes.js      - Daily reward REST endpoints
    admin/
      adminRoutes.js            - Admin panel endpoints + game settings
    analytics/
      AnalyticsService.js       - Analytics tracking + snapshots
    matchmaking/
      MatchmakingService.js     - Queue management + match creation
      BotMatchService.js        - Bot match creation
    email/
      EmailService.js           - Email sending (verification, reset)
    utils/
      idGenerator.js            - nanoid-based ID generation
      math.js                   - distance, normalize, pointInPolygon, etc.
      gameLogger.js             - Structured game logging
  db/
    migrations/
      001_create_users.sql
      002_create_matches.sql
      003_create_match_players.sql
      004_create_daily_rewards.sql
      005_add_banned_column.sql
      006_create_analytics_tables.sql
shared/
  gameConstants.js              - All game constants
  regionTypes.js                - Region type enum
  eventTypes.js                 - Socket event name enum
  version.js                    - Version info
```

---

## Appendix B: Player Color Pool (16 Colors)

```
Index 0:  #E94560 (red)
Index 1:  #06D6A0 (green)
Index 2:  #8338EC (purple)
Index 3:  #FFD166 (gold)
Index 4:  #4CC9F0 (cyan)
Index 5:  #FF6B35 (orange)
Index 6:  #8AC926 (lime)
Index 7:  #F72585 (pink)
Index 8:  #2EC4B6 (teal)
Index 9:  #FB5607 (deep orange)
Index 10: #7209B7 (violet)
Index 11: #FFBE0B (amber)
Index 12: #6A4C93 (plum)
Index 13: #FF595E (coral)
Index 14: #E07C24 (bronze)
Index 15: #FF006E (magenta)
```

Store-exclusive colors (not in pool): Black (#1a1a1a), White (#f0f0f0)

---

## Appendix C: ID Generation Patterns

All IDs use nanoid with prefixes:
- `player_xxx` - Player IDs
- `room_xxx` - Room IDs
- `region_xxx` - Region IDs
- `army_xxx` - Army IDs
- `gate_xxx` - Gate IDs
- `gatepair_xxx` - Gate pair group IDs
- `user_N` - User IDs (sequential integer)

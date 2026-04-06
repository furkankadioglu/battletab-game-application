# 07 - Frontend Documentation (Complete)

> KUST 10 - Pillows: Multiplayer Real-Time Strategy Game  
> Engine: PhaserJS 3.70 + React 19 + Socket.IO Client  
> Last updated: 2026-04-06

---

## Table of Contents

1. [Application Bootstrap](#1-application-bootstrap)
2. [Scene Architecture](#2-scene-architecture)
3. [GameScene (Main Game)](#3-gamescene-main-game)
4. [MapRenderer System](#4-maprenderer-system)
5. [ArmyRenderer System](#5-armyrenderer-system)
6. [SelectionSystem](#6-selectionsystem)
7. [AbilityBar System](#7-abilitybar-system)
8. [SiegeRenderer System](#8-siegerenderer-system)
9. [GateRenderer System](#9-gaterenderer-system)
10. [CameraSystem](#10-camerasystem)
11. [Network Synchronization (GameSync)](#11-network-synchronization-gamesync)
12. [React Components](#12-react-components)
13. [GameBridge (Phaser-React Communication)](#13-gamebridge-phaser-react-communication)
14. [Sound System](#14-sound-system)
15. [i18n System](#15-i18n-system)
16. [Device Detection](#16-device-detection)
17. [Utilities](#17-utilities)
18. [Entity Classes](#18-entity-classes)
19. [Configuration & Constants](#19-configuration--constants)
20. [Build & Dependencies](#20-build--dependencies)
21. [Depth Layering Reference](#21-depth-layering-reference)
22. [Event Reference](#22-event-reference)

---

## 1. Application Bootstrap

### HTML Structure (`client/index.html`)

```
<body>
  <canvas id="bg-canvas">        <!-- Animated battle background (3D perspective transform) -->
  <div id="auth-root">           <!-- React Auth screens (z-index: 9999) -->
  <div id="menu-root">           <!-- React Menu (z-index: 100) -->
  <div id="game">                <!-- Phaser game container (hidden until game start) -->
    <div id="game-ui-root">      <!-- React GameHUD overlay (z-index: 10, pointer-events: none) -->
  </div>
</body>
```

Key CSS:
- `body`: `overflow: hidden; background: #06060e; width/height: 100vw/100dvh`
- `#bg-canvas`: `position: fixed; z-index: 0; transform: perspective(1500px) rotateX(5deg) scale(1.08); transform-origin: center 55%`
- `#game`: `touch-action: none; overscroll-behavior: none`
- `#game-ui-root`: `position: absolute; inset: 0; z-index: 10; pointer-events: none`
- Viewport meta: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`

### Vite Configuration (`client/vite.config.js`)

```js
{
  root: '.',
  publicDir: 'public',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3000', ws: true, changeOrigin: true }
    }
  },
  build: { outDir: 'dist', sourcemap: true }
}
```

### Entry Point (`client/src/index.js`)

The application has three modes that are mutually exclusive:

1. **Auth Mode** - React AuthApp (login/register/verify)
2. **Menu Mode** - React MenuApp (map selection, game modes)
3. **Game Mode** - Phaser game + React GameHUD overlay

**Boot Sequence:**

```
init()
  -> initMobilePlatform()  // Capacitor: hide status bar, lock landscape, hide splash
  -> authService.isLoggedIn() ? showMenu() : showAuth()
```

**`showAuth()`:**
- Shows `#auth-root`, hides `#menu-root`
- Creates animated BattleCanvas background
- Mounts React AuthApp; on success callback calls `showMenu()`

**`showMenu()`:**
- Shows `#menu-root`, hides `#auth-root`
- Creates animated BattleCanvas background
- Starts music via `musicManager.play()`
- Mounts React MenuApp with two callbacks:
  - `onStartGame(gameData)` -> `startPhaser(gameData)`
  - `onLogout()` -> destroys background, calls `showAuth()`

**`startPhaser(gameData)`:**
- Pauses menu music
- Destroys BattleCanvas background
- Hides menu/auth roots, shows `#game`
- Lazy-loads Phaser + all 7 scenes via `Promise.all([import(...)])`
- Stores game data: `window.__kustGameData = gameData`
- Creates Phaser game instance

### Phaser Game Configuration

```js
{
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#134e6f',
  scene: [BootScene, MenuScene, LobbyScene, GameScene, GameOverScene, TutorialScene, FriendsScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game',
    width: '100%',
    height: '100%',
  },
  dom: { createContainer: true },
  input: {
    activePointers: 3,           // Support 3 simultaneous touch points
    mouse: { preventDefaultWheel: true },
    touch: { capture: true }
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    transparent: false,          // No alpha channel on main canvas (OpenFront technique)
  },
  resolution: 1
}
```

After Phaser creates:
- Touch gesture prevention applied to `#game` container and canvas
- React GameHUD mounted into `#game-ui-root` via `renderGameHUD()`
- `window.__kustReturnToMenu` function registered for returning to menu:
  - Disconnects socket
  - Clears GameBridge
  - Unmounts HUD
  - Destroys Phaser game
  - Resumes menu music
  - Calls `showMenu()`

### Phaser-React Coexistence Pattern

- Phaser renders into a `<canvas>` inside `#game`
- React renders into `#game-ui-root` which is `position: absolute; inset: 0` over the canvas
- `#game-ui-root` has `pointer-events: none` so clicks pass through to Phaser
- Individual React elements (buttons, panels) set `pointer-events: auto`
- Communication via **GameBridge** singleton (event emitter with sticky replay)

---

## 2. Scene Architecture

### Scene List and Keys

| Scene Key | Class | Purpose |
|-----------|-------|---------|
| `BootScene` | BootScene | Asset generation, routing |
| `MenuScene` | MenuScene | Phaser-based menu (fallback) |
| `LobbyScene` | LobbyScene | Matchmaking/waiting room |
| `GameScene` | GameScene | **Main game** |
| `GameOverScene` | GameOverScene | Results, stats, ranked ELO |
| `TutorialScene` | TutorialScene | Interactive tutorial (6 stages) |
| `FriendsScene` | FriendsScene | Friend management |

### Scene Transition Flow

```
[React Menu] --startPhaser(gameData)--> BootScene
  BootScene --> GameScene (if gameData)
  BootScene --> TutorialScene (if gameData.tutorial)
  BootScene --> MenuScene (fallback, shouldn't happen)

LobbyScene --> GameScene (on game_start event)
LobbyScene --> MenuScene (on back button)

GameScene --> GameOverScene (on game_over event)
GameOverScene --> LobbyScene (play again)
GameOverScene --> [React Menu] (main menu via __kustReturnToMenu)

MenuScene --> LobbyScene (play buttons)
MenuScene --> TutorialScene (tutorial button)
MenuScene --> FriendsScene (friends button)

FriendsScene --> MenuScene (back button)
```

### BootScene (`client/src/scenes/BootScene.js`)

**Scene Key:** `'BootScene'`

**preload():**
- Shows "Loading..." text centered on screen

**create():**
- Generates two textures programmatically:
  - `'arrow'` - 32x24 white arrow shape (for UI)
  - `'soldier'` - 8x8 white square (for army sprites, currently unused)
- Routes based on `window.__kustGameData`:
  - If `gameData.tutorial` -> `TutorialScene`
  - If `gameData` exists -> `GameScene` with `gameData`
  - Else -> `MenuScene` (fallback)

### MenuScene (`client/src/scenes/MenuScene.js`)

**Scene Key:** `'MenuScene'`

This is the Phaser-based menu, used as fallback. The primary menu is React-based (`MenuApp.jsx`).

**Features:**
- Gradient background (0x0a0e1a -> 0x111836)
- Hexagonal grid pattern (subtle, 40px hex size)
- Floating particles (50 desktop, 20 compact)
- Accent lines (animated opacity)
- "KUST" title with glow + breathing animation
- "Strateji & Fetih" subtitle
- User display (logged in: username + logout; fallback: username input)
- Stats bar (Bot/Online/Ranked win/loss)
- Map selection buttons (from `config/maps.js` + "Rastgele")
- Play buttons: Bot, Online, Ranked, Tutorial, Friends
- Ranked requires authenticated non-guest account
- Scroll support for overflow content
- Responsive: 3-tier (mobile/tablet/desktop) via `pick()`

**Map config from `config/maps.js`:**
```js
const GAME_MAPS = [
  { id: 'turkey',  nameKey: 'map.turkey',  color: '#d94a4a', regions: 91,  minPlayers: 2, maxPlayers: 4 },
  { id: 'poland',  nameKey: 'map.poland',  color: '#dc143c', regions: 73,  minPlayers: 2, maxPlayers: 4 },
  { id: 'china',   nameKey: 'map.china',   color: '#de2910', regions: 34,  minPlayers: 2, maxPlayers: 4 },
];
export const MAPS_PER_ROW = 3;
```

**Play flow:**
1. User selects map
2. Clicks play button (bot/online/ranked)
3. Scene connects socket, emits `join_lobby`
4. Transitions to `LobbyScene`

### LobbyScene (`client/src/scenes/LobbyScene.js`)

**Scene Key:** `'LobbyScene'`

**init(data):** Receives `{ username, mapType, mode }`

**Features:**
- Same dark theme with hex grid and particles
- Title "KUST" with breathing animation
- Mode/map info card (color-coded per mode)
- Animated spinner ring (rotating arc)
- Animated dots on status text ("Aranıyor...")
- Player list panel with slots showing:
  - Status dot (green=ready, yellow=waiting with pulse)
  - Player name (self highlighted blue, bots labeled)
- Back/Cancel button
- Version footer

**Socket Events Listened:**
- `lobby_update` -> Updates player list
- `game_countdown` -> Shows "Yükleniyor..." text
- `game_start` -> Stores data in registry, starts GameScene after 600ms delay
- `error` -> Shows error message in red
- `queue_update` -> Shows queue position info
- `match_found` -> Shows "Rakip bulundu!" with green status, updates player list

**Cleanup:** Removes all socket listeners on scene exit.

### GameOverScene (`client/src/scenes/GameOverScene.js`)

**Scene Key:** `'GameOverScene'`

**init(data):** Receives:
```js
{
  winnerId, players, myPlayerId, rankingData, isRanked,
  battleStats: { regionsCaptured, armiesSent, peakPower },
  gameTime, gameMode, mapType, winnerName, diamondReward
}
```

**Features:**
- Dark background with gold (win) or red (loss) particles
- Result card with:
  - Victory/Defeat title with scale animation
  - Winner badge with player color
  - Battle stats (regions captured, armies sent, peak power, time)
  - Diamond reward display (if earned)
  - Scoreboard with rank, color bars, status badges
  - Ranked section: ELO change display, rank promotion/demotion
- "Ana Menu" button -> disconnects socket, returns to React menu
- Winner confetti animation (50 particles falling)
- Scroll support for overflow

**Rank system:** Bronz -> Gumus -> Altin -> Elmas -> Usta

### TutorialScene (`client/src/scenes/TutorialScene.js`)

**Scene Key:** `'TutorialScene'`

**Constants:**
```js
PLAYER_ID = 'tutorial-player'
BOT_ID = 'tutorial-bot'
HEX_RADIUS = 130
MAP_CX = 800, MAP_CY = 450
MAP_WIDTH = 1600, MAP_HEIGHT = 900
ARMY_SPEED = 90  // px/sec
SPLIT_RATIO = 0.5
PRODUCTION_INTERVAL = 1000  // ms
BOT_TICK_INTERVAL = 3000  // ms
```

**Map:** 7 hexagonal regions (flower pattern):
- R0: NORMAL (center)
- R1: MOUNTAIN (top-left, +25 defense)
- R2: NORMAL (top-right)
- R3: SPAWN (left, player start, 10 HP)
- R4: SPAWN (right, bot start, 10 HP)
- R5: SNOW (bottom-left, 0.28x speed)
- R6: TOWER (bottom-right, 2.5x production)

**6 Tutorial Stages:**
1. **Drag Mechanic** - Drag from own region to target; hand animation shows path
2. **Production & Towers** - Capture tower region R6 for 2.5x production
3. **Mountain Regions** - Capture mountain R1 for defense bonus
4. **Snow Regions** - Capture snow R5 (armies move 3.5x slower)
5. **Abilities** - Use missile/nuclear/barracks/speed boost (1 charge each)
6. **Bot Fight** - Production + bot AI enabled; defeat the bot

Each stage has overlay with title, instructions, "Anladim" button, and celebratory transition.

### FriendsScene (`client/src/scenes/FriendsScene.js`)

**Scene Key:** `'FriendsScene'`

**Features:**
- Player code display (clickable to copy)
- Add friend by player code (DOM input + EKLE button)
- Two tabs: "Arkadaslarim" / "Istekler"
- Friend list with remove button
- Request list with accept/reject buttons
- Badge count on requests tab
- API calls to `/api/friends`, `/api/friends/requests`, etc.

---

## 3. GameScene (Main Game)

**File:** `client/src/scenes/GameScene.js`  
**Scene Key:** `'GameScene'`

### init(data)

Receives game data from LobbyScene or BootScene:
```js
this.gameData = data || this.registry.get('gameData');
```

### create() - Full Initialization Sequence

1. **Extract game info:**
   - `this.myPlayerId = data.myPlayerId || data.playerId`
   - `this.gameConfig = data.gameConfig || {}` (building costs, attack range, etc.)
   - Emits `game:config` to React via GameBridge

2. **Draw ocean background:**
   - 5000px padding around map
   - Base color: `0x134e6f`
   - Subtle wave lines every 40px with sine-based alpha variation
   - Depth: 0

3. **Initialize entities:**
   - `this.players = new Map()` - from `data.players` -> `Player` instances
   - `this.regions = new Map()` - from `data.map.regions` -> `Region` instances
   - `this.armies = new Map()` - from `data.armies` -> `Army` instances

4. **Initialize MapRenderer:**
   - `new MapRenderer(this)`
   - `renderMap(regions, players)` - draws all region polygons
   - `setGates(data.map.gates)` - stores gate data for fog connections

5. **Fog of War:**
   - If NOT spawn phase: `mapRenderer.updateFogOfWar(myPlayerId)`
   - DOMFogManager disabled (Phaser polygon overlays only)

6. **Initialize ArmyRenderer:**
   - `new ArmyRenderer(this, players)`
   - `setFogReferences(mapRenderer, myPlayerId)`
   - Adds all initial armies

7. **Initialize SelectionSystem:**
   - `new SelectionSystem(this, mapRenderer, myPlayerId, players, regions)`
   - Sets `attackRange` from `gameConfig.attackRange` (default: 1)
   - `mapRenderer.setSelectionSystem(selectionSystem)`
   - First-time send intercept: shows drag hint after 10s if no send

8. **Initialize CameraSystem:**
   - Panel width: 0 on mobile, 165 on tablet, 185 on desktop
   - `new CameraSystem(this, mapWidth, mapHeight, cameraUiWidth)`

9. **Initialize AbilityBar:**
   - `new AbilityBar(this, myPlayerId, players, mapRenderer)`
   - Stays in Phaser (needs world input for targeting)

10. **Initialize GateRenderer:**
    - `new GateRenderer(this)`
    - Renders gates, sets gate region IDs in selection system
    - Builds gate virtual connections for attack range BFS

11. **Set rocky regions** in selection system

12. **Ping measurement:**
    - Emits `ping_check` every 3000ms
    - Listens for `pong_check` response
    - Broadcasts ping to React via `gameBridge.emit('ping_update', ping)`

13. **Register GameSync:**
    - `gameSync.setGameScene(this)` - registers all socket event handlers

14. **Spawn or Preview phase:**
    - If `spawnPhase`: calls `_startSpawnSelection()`
    - Else: calls `_startReactPreview()` (3, 2, 1, GO! countdown)

15. **Two-camera setup:**
    - `this.uiCamera = this.cameras.add(0, 0)` named 'uiCamera'
    - Main camera ignores scrollFactor=0 objects (UI)
    - uiCamera ignores scrollFactor!=0 objects (world)
    - Both MapRenderer, ArmyRenderer, GateRenderer get uiCamera reference

16. **GameBridge listeners:**
    - `hud:quit` -> disconnect + return to menu
    - `settings:changed` -> toggle glow visibility, FPS display
    - `building:mode` -> enter building placement mode
    - `camera:focus` -> tween camera to position

17. **Input handlers:**
    - `pointermove` -> region hover tooltip via GameBridge
    - `pointerup` -> building placement (if `_buildingMode` active)

18. **Emit initial state:**
    - `game:init` -> myPlayerId, gameMode, mapId, serialized players
    - `emitStats()` -> map control, production, armies data

19. **Mobile hint** toast after 4s (once per device)

20. **Settings sync** from localStorage

### update(time, delta) - Per Frame

```
1. armyRenderer.updateAll(delta)          // Client-side prediction movement
2. selectionSystem.update()               // (if not preview) Arrow drawing
3. cameraSystem.update()                  // WASD pan, Z/X zoom
4. mapRenderer.update()                   // Frustum culling (region graphics)
5. siegeRenderer.updateAll(delta)          // Pixel-based siege spread
6. mapRenderer.updateOwnerGlows(delta)    // Batch glow animation
7. mapRenderer.updateViewportCulling(cam) // Every 6th frame: text/decoration culling
8. HP text inverse zoom scaling           // Scale texts by 1/cam.zoom
9. Army count text inverse zoom scaling
10. gameTime += delta                     // Timer update, emit every 1000ms
11. abilityBar.update()                   // Cooldown timers
12. FPS counter                           // Emit every 500ms if enabled
13. _autoPerf_checkLowFps(delta)          // Auto low-perf mode detection
```

### Spawn Selection Phase

**`_startSpawnSelection()`:**
- Hides all region details (HP, decorations, glows) via `setRegionDetailsVisible(false)`
- Emits `game:spawnPhase { active: true, seconds }` to React HUD
- Countdown timer: decrements every 1000ms
- Click handler: tap threshold 30px (touch) / 15px (desktop)
  - Validates: not ROCKY, not gate region, not owned by other player
  - Reverts previous selection (resets HP, type, owner)
  - Highlights new selection, emits `SELECT_SPAWN` to server
  - Shows "Spawn confirmed" toast

**`endSpawnSelection()`:**
- Cleans up spawn timers and listeners
- Shows region details again
- Applies fog of war
- Focuses camera on spawn region with zoom tween (1.6x, 1200ms cubic)
- Starts `_startReactPreview()` countdown

### Preview Countdown

**`_startReactPreview()`:**
- Emits `game:preview { active: true, count: 3 }`
- At 1500ms: count 2
- At 2500ms: count 1
- At 3500ms: `previewActive = false`, count 0
- After preview: starts drag hint timer (10s)

### First-Time Drag Hint

**`_showDragHint()`:**
- Finds player's first region and nearest non-owned neighbor
- Draws animated pulsing arrow (red dot traveling from source to target)
- Shows "Drag from your region to attack!" text at top of screen
- Dismissed on first troop send

### Auto Performance Mode

**`_autoPerf_checkLowFps(delta)`:**
- Starts checking after 5s of gameplay
- Samples FPS every 500ms, keeps last 10 samples
- If average < 30 FPS after 6+ samples:
  1. Disables owner glow animations
  2. Disables trail particles on armies
  3. Slows siege animation tick rate (every 12th frame)
  4. Sets `kust_low_perf = '1'` in localStorage
  5. Shows toast notification

### Helper Methods

**`_serializePlayers()`:** Returns array of `{ id, username, colorIndex, colorStr, regionCount, eliminated, isBot }`

**`emitPlayers()`:** Throttled (500ms), emits serialized players to React HUD

**`emitStats()`:** Throttled (500ms), computes and emits:
- `mapControl[]` - per-player territory percentage
- `production[]` - per-player production rate + interest
- `armies[]` - per-player total soldiers
- `myResources` - iron, crystal, uranium amounts
- `myResourceRates` - resource production rates
- `myBuildings` - building type counts
- `myArmyList[]` - own moving armies (id, count, x, y)
- `enemyArmyList[]` - enemy armies targeting my regions

**Production rates used:** `{ NORMAL: 1, SPAWN: 1, TOWER: 2.5, MOUNTAIN: 0.5, SNOW: 0.8 }`

**Interest formula:** `hp < 300 ? hp * 0.01 : 0`

---

## 4. MapRenderer System

**File:** `client/src/systems/MapRenderer.js`

### Constructor Data Structures

```js
this.regionGraphics = new Map();       // regionId -> Phaser.Graphics
this.regionTexts = new Map();          // regionId -> { hpText, nameText, badgeText, resourceText }
this.regionHighlights = new Map();     // regionId -> Phaser.Graphics
this.regionData = new Map();           // regionId -> { vertices, center, type, name, ownerId, hp, neighbors }
this.towerDecorations = new Map();     // regionId -> Phaser.Container
this.spawnMarkers = new Map();         // regionId -> Phaser.Container
this.mountainDecorations = new Map();  // regionId -> Phaser.Container
this.snowDecorations = new Map();      // regionId -> Phaser.Container
this.rockyDecorations = new Map();     // regionId -> Phaser.Container
this.speedDecorations = new Map();     // regionId -> Phaser.Container
this.ownerGlows = new Map();          // regionId -> { graphics, maskGfx, _glowData }
this.fogOverlays = new Map();         // regionId -> Phaser.Graphics
this.foggedRegions = new Set();       // Set of fogged regionIds
this.gateConnections = new Map();     // regionId -> Set<regionId>
this.regionBounds = new Map();        // regionId -> { minX, minY, maxX, maxY }
```

### renderMap(regions, players)

1. Creates `SiegeRenderer` instance
2. Creates depth-ordered layers:
   - `graphicsLayer` (container, depth 10)
   - `highlightLayer` (container, depth 15)
3. Calculates map bounds from all vertices
4. Draws ocean background:
   - Base fill: `0x134e6f` with 300px padding
   - Grid pattern: 60px spacing, `0x1a4a7a` at 0.15 alpha
   - Depth: 1
5. Draws outer landmass glow (6px border, `0x1a3a6a` at 0.4 alpha, depth 5)
6. Calls `_drawRegion(region)` for each region

### _drawRegion(region)

1. Stores region data in `regionData` Map
2. Computes AABB bounds for frustum culling
3. Determines fill color:
   - ROCKY: `0x2a2a2a`
   - Unowned: `0x1e2030`
   - Owned: player color from `getPlayerColor(colorIndex, skinData)`
4. Calls `_drawRegionShape(graphics, vertices, fillColor, borderColor, highlightEdge, type, area)`
5. Creates type-specific decorations (tower, spawn, mountain, snow, rocky, speed)
6. Creates owner glow if owned and not ROCKY
7. Creates HP text with area-based font sizing:
   - `area < 1200`: 9px
   - `area < 2000`: 11px
   - `area < 5000`: 14px
   - `area < 10000`: 16px
   - `area < 20000`: 18px
   - `area < 40000`: 20px
   - `area >= 40000`: 22px
8. Creates defense badge for MOUNTAIN regions
9. Creates resource icon if `region.resourceType` exists:
   - Iron: `⚒` (`#aabbcc`)
   - Crystal: `💎` (`#cc88ff`)
   - Uranium: `☢` (`#44ff88`)

### _drawRegionShape(graphics, vertices, fillColor, borderColor, highlightEdge, type, area)

1. Calculates centroid
2. Draws expanded fill polygon (1.5px vertex outset from centroid to cover gaps)
3. Draws 3px black border on original vertices at 0.8 alpha

### Neutral Color Palette

```js
const NEUTRAL_PALETTE = [
  0x4a5568,  // slate gray
  0x4b6858,  // teal gray
  0x5c5470,  // purple gray
  0x6b5b4b,  // warm brown
  0x485570,  // blue gray
  0x5a6048,  // olive gray
];
```

### updateRegion(regionId, hp, ownerId)

1. Updates HP text:
   - Fogged: hidden
   - Stealthed: shows "?"
   - HP <= 0: hidden (spawn phase)
   - Normal: shows `Math.floor(hp)`
2. Redraws region polygon with new fill color
3. Tracks hp in regionData
4. On owner change:
   - Removes old owner glow
   - Creates new owner glow
   - Ends siege effect
   - Updates friendly borders
5. Wall building overlay (thick border + diagonal fence)
6. Updates siege spread visual

### Region Type Decorations

**Tower (`_drawTowerDecoration`):**
- Castle icon with three turrets, gate/door
- Gold color (`0xFFD700`)
- Glow circle behind (pulsing animation: 2000ms)
- Scale based on area (0.6/0.8/1.0)
- Depth: 22

**Mountain (`_drawMountainDecoration`):**
- Shield icon with cross emblem
- Blue color (`0x4488cc`)
- Highlight stripe on top-left
- Glow circle (pulsing: 2500ms)
- Depth: 22

**Snow (`_drawSnowDecoration`):**
- Scattered white dots across polygon (12px spacing, jittered)
- Snowflake emoji at center (rotating: 10000ms)
- Depth: 12

**Rocky (`_drawRockyDecoration`):**
- 45-degree dashed hatching lines across polygon (10px spacing, 6px dash, 4px gap)
- Mountain emoji at center
- Depth: 12

**Speed (`_drawSpeedDecoration`):**
- Short diagonal energy streaks (green, 16px spacing)
- Lightning bolt emoji at center (pulsing: 1500ms)
- Depth: 12

### Owner Glow System

**`_createOwnerGlow(regionId, vertices, ownerId)`:**
- Skipped if `kust_low_perf === '1'`
- Creates polygon mask from region vertices
- Creates stripe graphics with mask
- 8 stripe bands, random direction (0-3: horizontal/vertical)
- Stripe colors lerp between darkened and lightened player color
- No per-region tween - uses manual batch update

**`updateOwnerGlows(delta)`:**
- Global glow time (shared across all regions)
- 4-second cycle (2*PI period)
- Frame skip: every 12th frame
- Sine wave color interpolation per stripe

### Fog of War

**`updateFogOfWar(myPlayerId)`:**
- BFS from all owned regions, max depth 1 (fogDepth=1)
- Gate connections count as 1 hop
- Gate tunnel extension: visible gate regions reveal paired gate + neighbors
- For each region: if should fog and wasn't, call `_applyFog`; if shouldn't and was, call `_removeFog`
- Syncs fogged set to SelectionSystem

**`_applyFog(regionId)`:**
- Adds to `foggedRegions` set
- Hides: hpText, nameText, badgeText, resourceText
- Hides: snow, rocky, mountain, tower decorations
- Creates dark polygon overlay: `0x050812` at 0.65 alpha, depth 18

**`_removeFog(regionId)`:**
- Removes from `foggedRegions` set
- Restores text visibility (HP text only if hp > 0)
- Shows decorations
- Destroys fog overlay

### Frustum Culling

**`update()` (called every frame from GameScene):**
- Camera viewport in world coords with 100px padding
- AABB overlap test per region
- Toggles visibility of: graphics, highlights, owner glows, fog overlays
- Text labels only hidden when not visible (visibility when visible managed by fog)
- All decoration types toggled

**`updateViewportCulling(cam)` (called every 6th frame):**
- Skips if `_detailsHidden` (spawn phase)
- Hides all text when `cam.zoom < 0.3`
- 200px margin for edge flicker prevention
- Toggles: hpText (respects hp state), badgeText, resourceText, owner glows

### Highlight System

**`highlightRegion(regionId, highlight)`:**
- Creates graphics at depth 16
- Outer glow: 6px white at 0.3 alpha
- Inner border: 3px white at 0.8 alpha

### Friendly Borders

**`_updateFriendlyBorders(regionId)`:**
- Finds neighbors with same owner
- Draws 1.5px player-colored lines on shared edges (vertex proximity threshold: 5px)
- Depth: 12

### Capture Effects

**`playCaptureEffect(regionId, skinData, playerColor)`:**
- `sparkle`: 14 particles radiating outward + central gold flash
- `shockwave`: Inner ring + delayed outer ring + central flash
- `flames`: 18 fire-colored particles rising upward + glow
- `lightning`: 6 jagged bolt lines + central flash + sparks

### Region Details Visibility

**`setRegionDetailsVisible(visible)`:**
- Sets `_detailsHidden` flag
- Shows/hides all HP texts, badges, resource icons, decorations, owner glows

---

## 5. ArmyRenderer System

**File:** `client/src/systems/ArmyRenderer.js`

### Constructor

```js
this.armySprites = new Map();     // armyId -> sprite data
this._trailParticles = [];        // active trail particles
this._graphicsPool = [];          // recycled Phaser.Graphics (max 50)
this._textPool = [];              // recycled Phaser.Text (max 50)
this._trailParticlePool = [];     // recycled trail particles
this._poolMaxSize = 50;
```

### Trail Colors

```js
const TRAIL_COLORS = {
  sparkle: [0xFFFFFF, 0xFFD700, 0xFFF8DC],
  fire:    [0xFF4500, 0xFF6600, 0xFF8C00, 0xFFD700],
  ice:     [0x00CED1, 0x87CEEB, 0xB0E0E6, 0xFFFFFF],
  rainbow: [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x8B00FF],
};
```

### addArmy(armyData)

1. Tries to recycle graphics/text from pool, else creates new
2. Graphics depth: 50; Count text depth: 51
3. Text style: 12px bold white, 3px black stroke, resolution 2
4. Builds waypoint queue from `armyData.waypoints` + `armyData.finalTarget`
5. Stores sprite data:
```js
{
  graphics, text: countText, currentPos, targetPos,
  moveTarget, speed, ownerId, count, size,
  _waypoints, _waypointIndex: 0,
}
```

### Army Shapes

Determined by `skinData.army_shape.shape`:

| Shape | Drawing |
|-------|---------|
| `circle` | Filled circle + white stroke |
| `diamond` | 4-point rhombus |
| `star` | 5-pointed star (outer/inner radii) |
| `shield` | 6-point shield shape |
| `hexagon` | Regular hexagon |
| default | Filled rectangle |

All shapes have 1px white stroke at 0.5 alpha.

### Army Size

```js
_getArmySize(count) {
  return clamp(8 + Math.floor(count / 5), 8, 20);
}
```

### updateAll(delta) - Client-Side Prediction

Called every frame. Key operations:

1. **Freeze check:** If freeze expired, removes all freeze overlays
2. **Viewport culling bounds** calculated with 100px margin
3. **Per-army loop:**
   - Skip if snap-locked (teleport, 300ms)
   - Skip if fog-hidden
   - Skip if already arrived
   - **Movement prediction:**
     - Calculate distance to moveTarget
     - Move by `speed * deltaSec` toward target
     - Delta capped at 33ms (30fps equivalent)
     - On arrival at moveTarget: advance to next waypoint
     - On arrival at final waypoint: hide sprite, set `_arrived = true`
   - Update graphics position
   - Update count text position (above sprite by `size + 4`)
   - **Viewport culling:** hide if outside camera bounds
   - **Freeze overlay** positioning (if active)

4. **Trail particles:**
   - Spawned every ~50ms for owned armies with trail skin
   - Trail types: sparkle, fire, ice, rainbow
   - Each particle: small circle, fades out over 400-800ms
   - Particles managed in pool for recycling

### removeArmy(armyId)

1. **Preview armies** (`id.startsWith('preview_')`) removed silently (no death effect)
2. **Attrition death** (count <= 0): Skull emoji floating up (800ms)
3. **Combat death**: White flash circle expanding (200ms)
4. Graphics/text recycled to pool if under 50, else destroyed

### Fog Visibility

**`updateFogVisibility()`:**
- Own armies always visible
- Enemy armies: check region at current position via `mapRenderer.getRegionAtPoint()`
- If region is fogged: hide army
- If over ocean (no region): show army (ocean not treated as fogged)

### Freeze System

**`startFreeze(casterId, duration)`:**
- Sets `_freezeEndTime` and `_freezeOwnerId`
- Creates ice-blue diamond overlay on all enemy armies:
  - `0x00ddff` fill, 0.7 alpha
  - Pulsing tween (0.6-1.0 alpha, 0.95-1.05 scale)

### snapArmy(armyId, position)

Instantly teleports army to position (used for gate teleportation):
- Sets current + target position
- Updates graphics position
- Sets `_snapUntil = Date.now() + 300` to skip prediction briefly

---

## 6. SelectionSystem

**File:** `client/src/systems/SelectionSystem.js`

### Constants

```js
MAX_SELECTED_REGIONS = 12
TAP_THRESHOLD_DESKTOP = 15    // px
TAP_THRESHOLD_TOUCH = 30      // px
DRAG_ACTIVATE_THRESHOLD = 8   // px (touch)
```

### Constructor

```js
this.sourceRegionIds = new Set();
this.gateRegionIds = new Set();        // not targetable
this.rockyRegionIds = new Set();       // not targetable
this.foggedRegionIds = new Set();      // not targetable
this.attackRange = 1;                  // max BFS hops
this.gateConnections = new Map();      // gate virtual neighbors
this.onSendSoldiers = null;           // callback intercept (tutorial)
this.arrowGraphics = scene.add.graphics().setDepth(100);
```

### Input Flow

**pointerdown:**
1. Skip if preview active, two-finger panning, or ability targeting
2. If clicked on own region:
   - Touch: store as `_pendingSourceRegionId` (wait for drag confirmation)
   - Desktop: immediately activate selection, add region
3. Else: reset selection

**pointermove:**
1. Cancel if two-finger panning started
2. Touch activation: if `_pendingSourceRegionId` and moved > 8px, activate selection
3. If active: add hovered own regions to selection (up to 12 max)
4. Draw arrows from all selected sources to pointer

**pointerup:**
1. Touch tap detection: if pending source and distance < threshold, activate for next tap
2. Desktop: skip if moved too far (was a pan)
3. Determine target region
4. **Auto-select sources:** If no drag selection (tap on target):
   - Find owned regions within attack range, sorted by distance
   - Auto-select up to 3 nearest
5. Remove target from sources if it's own region in drag mode
6. **Filter valid sources** by attack range via BFS
7. **Send soldiers** if valid sources exist and target not blocked:
   - Via `onSendSoldiers` callback (tutorial) or socket emit
   - Play bubble sound + 40ms haptic vibration
   - Create optimistic preview armies

**ESC key:** Cancels active selection

### Attack Range BFS

**`_isWithinRange(sourceId, targetId, maxHops)`:**
- BFS from source, checking normal neighbors + gate virtual neighbors
- Returns true if target found within maxHops

### Arrow Drawing

**`_drawArrows(targetX, targetY)`:**
- Color: green (`0x22c55e`) for valid target, red (`0xff4444`) for blocked, gray (`0x888888`) for empty
- Dashed lines (12px dash, 8px gap) with filled arrowhead (14px, PI/6 angle)

### Optimistic Preview Armies

**`_createPreviewArmies(sourceIds, targetRegionId)`:**
- For each source: calculates `Math.floor(hp * 0.5)` soldiers to send
- Creates preview army with ID `'preview_' + sourceId + '_' + targetId + '_' + timestamp`
- Optimistically reduces source HP on client
- Updates source region visuals
- Speed: 25 px/s
- Tracked in `scene._previewArmies[]` for cleanup when server confirms

---

## 7. AbilityBar System

**File:** `client/src/systems/AbilityBar.js`

### Ability Definitions

```js
const ABILITIES = [
  { key: 'missile',    label: '1', color: 0xff4444, cooldownMs: 10000, event: USE_MISSILE,      targetType: 'enemy', name: 'FUZE',    desc: 'Dusman bolgenin %50 askerini oldurur' },
  { key: 'nuclear',    label: '2', color: 0x44ff44, cooldownMs: 10000, event: USE_NUCLEAR,      targetType: 'enemy', name: 'NUKLEER', desc: 'Bolgenin asker uretimini 30 saniye durdurur' },
  { key: 'barracks',   label: '3', color: 0x4488ff, cooldownMs: 10000, event: USE_BARRACKS,     targetType: 'own',   name: 'BARAKA',  desc: 'Kendi bolgeni kaleye cevirir (2.5x uretim)' },
  { key: 'speedBoost', label: '4', color: 0xffaa00, cooldownMs: 10000, event: USE_SPEED_BOOST,  targetType: 'self',  name: 'HIZ',     desc: '10 saniye boyunca asker hizi %25 artar' },
  { key: 'freeze',     label: '5', color: 0x00ddff, cooldownMs: 30000, event: USE_FREEZE,       targetType: 'self',  name: 'DONDUR',  desc: 'Tum dusman askerlerini 1.5 saniye dondurur' },
];
```

### Layout

- **Position:** Right side, vertical layout
- Panel starts at Y=52 (below header), aligned with left panel top
- Slot size: 48x48 (mobile), 52x52 (tablet), 56x56 (desktop)
- Spacing: 4/6/8px
- Panel background: `0x0a0a1a` at 0.85 alpha, 8px rounded
- Depth: 500 (container), 501 (hit areas)
- `scrollFactor: 0` (fixed on screen)

### Per-Slot UI Elements

- Background: `0x1a1a2e`, 6px rounded, 2px colored border
- Icon: Drawn with Phaser graphics (rocket, radiation, building, arrows, snowflake)
- Key label at bottom (monospace, `#888899`)
- Cooldown overlay (dark fill over slot)
- Cooldown text (countdown seconds)
- Charge badge (top-right corner, `#333366` background)
- Hit area for interaction

### Keyboard Shortcuts

- Keys 1-5: Activate corresponding ability
- ESC: Cancel active targeting mode
- Q/W/E/R mapped to 1/2/3/4

### Targeting Modes

- `targetType: 'enemy'` - Click on enemy region (missile, nuclear)
- `targetType: 'own'` - Click on own region (barracks)
- `targetType: 'self'` - Immediate use, no target needed (speed boost, freeze)

### Cooldown Display

- Dark overlay fills slot from bottom to top proportionally
- Countdown text shows remaining seconds
- Slot border changes to darker color during cooldown

### Charge Display

- Badge at top-right shows available charges
- When charges = 0 and no cooldown: slot appears dimmed

### update() Method

Called every frame from GameScene:
- Updates cooldown timers
- Updates charge badge text from player data
- Updates cooldown overlay fill level

---

## 8. SiegeRenderer System

**File:** `client/src/systems/SiegeRenderer.js`

### Overview

Pixel-based territory spreading visualization using Canvas2D + Phaser texture:

```js
const MAX_PIXELS_PER_FRAME = 300;
function getPixelScale() { return 0.5; } // 2x resolution
```

### Data Structure per Siege

```js
{
  canvas, ctx, imageData, img, tex, texKey,
  grid,           // Uint8Array: 0=outside, 1=inside-empty, 2+=filled-by-attacker
  gridW, gridH, scale, totalPixels,
  minX, minY, center,
  attackers: {},  // playerId -> attacker data
  nextGridVal: 2, // increments per attacker
}
```

### Algorithm

1. **startSiege:** Rasterizes region polygon into grid using scanline
2. **Per attacker:** BFS flood fill from entry points
3. **Entry points:** From server `siegeEntryPoints` data (world coords -> grid coords)
4. **Multiple entry points** per attacker supported (multi-angle attack)
5. **updateAll:** Every 6th frame (12th in low-perf), spreads `perSiegeLimit` pixels per siege
6. **Canvas rendering:** Sets RGBA pixels in imageData, uploads to Phaser texture

### Frame Skip

```js
const frameSkip = this._autoLowPerf ? 12 : 6;
```

---

## 9. GateRenderer System

**File:** `client/src/systems/GateRenderer.js`

### Portal Visual

Each gate consists of:
- **Outer glow:** 3 concentric circles (2.8r, 2.0r, 1.44r) at increasing alpha
- **Outer ring:** 4px colored + 2px white inner + 1px colored outer
- **Inner fill:** Colored circle + smaller filled center + white dot
- **Rotating diamond:** Counter-rotating rhombus shape
- **Orbiting particles:** 4 dots circling at `portalRadius + 10`, 3000ms orbit
- **"GATE" label** below portal
- Portal radius: 11px
- Depth: 50

### Animations

- Glow: pulsing scale (0.8-1.2) + alpha (0.6-1.0), 1400ms
- Ring: continuous rotation, 8000ms
- Diamond: counter-rotation, 5000ms
- Particles: individual orbit timers

### Hover Behavior

- Shows connection line between gate pairs (dashed, 10px dash + 8px gap)
- Scale punch to 1.15x on hover
- Connection line fades in/out (250ms/400ms)

### Teleport Effect

**`showTeleportEffect(teleportData)`:**
1. Entrance: implosion burst (shrinks from 1.5x to 0.1x)
2. Exit: explosion burst (expands from 0.2x to 2.0x) after 100ms delay
3. Both gates pulse (scale 1.4x, 150ms yoyo)
4. Electric arc particles (3 per burst): jagged lines from center

---

## 10. CameraSystem

**File:** `client/src/systems/CameraSystem.js`

### Constructor

```js
constructor(scene, mapWidth, mapHeight, uiLeftWidth)
```

### Zoom Limits

```js
const mapArea = mapWidth * mapHeight;
this.maxZoom = mapArea > 8_000_000 ? 3.0 : 2.5;
this.minZoom = mapArea > 8_000_000
  ? Math.max(0.15, fitZoom * 0.4)
  : Math.max(0.2, fitZoom * 0.5);
```

### Initial View

- Fit zoom: `Math.min(availW / mapWidth, camH / mapHeight) * scale`
  - Scale: 0.85 (mobile), 0.92 (tablet), 0.9 (desktop)
- Center: map center, offset by left panel width
- No camera bounds (free panning like OpenFront)

### Controls

**Desktop:**
- Left click drag on empty space: pan camera
- Middle/right click drag anywhere: pan camera
- Scroll wheel: zoom toward pointer position (0.92/1.08 factor per tick)
- WASD: pan at 400px/s (adjusted for zoom)
- Z/X: zoom in/out at center (1.5x rate per second)

**Mobile/Tablet:**
- Two-finger pan: midpoint tracking
- Pinch-to-zoom: distance ratio between fingers
- Combined pan + zoom in real-time
- Single-finger selection vs pan distinction:
  - If SelectionSystem has pending source: don't start pan
  - 15px threshold (touch) before confirming pan
  - 10px threshold (desktop)

### _zoomToward(screenX, screenY, factor)

```js
const oldZoom = camera.zoom;
const newZoom = clamp(oldZoom * factor, minZoom, maxZoom);
const worldBefore = camera.getWorldPoint(screenX, screenY);
camera.zoom = newZoom;
const worldAfter = camera.getWorldPoint(screenX, screenY);
camera.scrollX += worldBefore.x - worldAfter.x;
camera.scrollY += worldBefore.y - worldAfter.y;
```

### Reset Button

- Position: bottom-right, 12px margin, above ability bar (60px offset)
- Icon: `↺` character
- Calls `resetView()` which recalculates initial view

### Two-Finger Panning Detection

```js
isTwoFingerPanning() { return this._twoFingerPanning; }
```

Used by SelectionSystem and GameScene to cancel drag operations.

---

## 11. Network Synchronization (GameSync)

**File:** `client/src/network/GameSync.js`

### Singleton Pattern

```js
class GameSync {
  setGameScene(scene) { ... }   // Registers all listeners
  removeListeners() { ... }      // Cleans up on scene destroy
}
const gameSync = new GameSync();
```

### Battle Statistics Tracking

```js
this.battleStats = {
  regionsCaptured: 0,
  armiesSent: 0,
  peakPower: 0,
};
```

### handleStateUpdate(data)

The most frequent server event. Handles delta updates:

1. **Preview army expiry:** Removes previews older than `max(2000, ping * 4)` ms
2. **Region updates** (`data.regions[]`):
   - Updates region model: hp, ownerId, building, siegeForces, siegeEntryPoints
   - Stealthed regions keep client hp (don't overwrite)
   - Updates MapRenderer visuals
   - Refreshes fog of war
   - Refreshes hover tooltip if hovering changed region
3. **Revealed regions** (`data.revealedRegions[]`):
   - Adds resourceType, resourceRate, building, type, defenseBonus
   - Calls `mapRenderer.refreshRegionOverlays()` to create missing decorations
4. **Army count updates** (`data.armyUpdates[]`):
   - Updates army model + sprite text
   - Resizes army shape if count changed significantly
   - Dead armies show skull emoji
5. **Destroyed armies** (`data.destroyedArmies[]`):
   - Removes from model + renderer (triggers death effects)
6. **Fog visibility update** after region changes
7. **Player updates** (`data.players[]`):
   - Updates player models + emits to React HUD
8. **Embedded events** (`data.events[]`):
   - Processes `region_captured` events for capture effects
9. **Game time sync** from server

### handleArmyCreated(data)

1. **Preview cleanup:** Finds matching preview army by targetId, removes it
2. Creates new Army entity + adds to ArmyRenderer
3. Increments `battleStats.armiesSent` for own armies

### handleArmyDestroyed(data)

- Removes from armies Map + ArmyRenderer (triggers death effects)

### handleRegionCaptured(data)

1. Updates region model (owner, HP)
2. Updates MapRenderer visuals
3. Updates fog of war + army fog visibility
4. Plays capture sound
5. Plays capture skin effect (sparkle/shockwave/flames/lightning)
6. Screen shake for own captures (150ms, 0.005 intensity)
7. Tracks battleStats (regionsCaptured, peakPower)
8. Emits stats to React HUD

### handlePlayerEliminated(data)

- Marks player as eliminated
- If self: shows eliminated dialog via GameBridge

### handleMissileApplied(data)

- Plays bomb sound
- Shows missile explosion effect:
  - Central flash (5x scale expansion)
  - Shockwave ring (4x scale)
  - 12 debris particles
  - Floating damage number
- Starts cooldown on AbilityBar

### handleNuclearApplied(data)

- Plays bomb sound
- Shows nuclear effect (green radiation particles)
- Starts cooldown

### handleBarracksApplied(data)

- Plays capture sound
- Shows barracks effect (building particles)
- Starts cooldown

### handleSpeedBoostApplied(data)

- Plays high bubble sound
- Starts cooldown

### handleFreezeApplied(data)

- Full-screen ice flash overlay (`0x00ddff`, 0.3 alpha, 800ms fade)
- "DONDURULDU!" or "DONDURULDUNUZ!" text floating up
- 20 ice particles spreading from center
- Screen shake (200ms, 0.008)
- Tells ArmyRenderer to freeze enemy armies

### handleAbilityGranted(data)

- Shows toast: "+1 [ability name]" (2000ms)

### handleGateTeleport(data)

- Handled elsewhere: snaps army position + GateRenderer teleport effect

### handleSpawnSelected(data)

- Updates region ownership during spawn phase
- Stores original region properties for revert
- Highlights selected region

### handleSpawnPhaseEnd(data)

- Calls `gameScene.endSpawnSelection()`
- Provides updated region data

### handleRegionsReveal(data)

- Bulk updates region types, resources, buildings after spawn
- Refreshes MapRenderer overlays

### handleGameOver(data)

- Transitions to GameOverScene with full result data
- Includes pending ranking update and diamond reward

### handleRankingUpdate(data) / handleDiamondReward(data)

- Stores for inclusion in GameOverScene data

---

## 12. React Components

### GameHUD (`client/src/game-ui/GameHUD.jsx`)

**Mount point:** `#game-ui-root`  
**Mount function:** `renderGameHUD()` returns React root for unmounting

**State:**
```js
players, myPlayerId, timer, stats, gameMode, mapId,
preview: { active, count },
spawnPhase: { active, seconds },
spawnConfirm, eliminated, showElimDialog, showQuit,
mobileOpen, statsOpen, toasts, initialized,
fps, ping, regionHover, muted, isFullscreen,
showSettings, settings: { glow, particles, fps, ping }
```

**GameBridge Events Subscribed:**
- `game:init` -> sets players, myPlayerId, gameMode, mapId
- `game:players` -> updates player list
- `game:timer` -> updates timer
- `game:stats` -> updates stats panels
- `game:preview` -> countdown overlay
- `game:spawnPhase` -> spawn selection overlay
- `game:spawnConfirm` -> spawn confirmation dialog
- `game:spawnSelected` -> clears confirm dialog
- `game:fps` -> FPS counter
- `ping_update` -> ping display
- `game:regionHover` -> tooltip data
- `game:eliminated` -> elimination dialog
- `game:toast` -> toast notifications

**Layout Structure:**

```
.ghud (root, pointer-events: none)
  header.ghud-header (44px height)
    .ghud-header-left: KUST logo + mode badge + map badge
    .ghud-header-center: Resource display (iron/crystal/uranium with rates)
    .ghud-header-right: Timer + FPS + Ping + Fullscreen + Settings + Mute + Quit
  
  button.ghud-mobile-toggle (hamburger, hidden on desktop)
  
  .ghud-left (185px width, top: 52px, left: 8px)
    .ghud-players: Player list (color dot + name + region count)
    .ghud-stats: Collapsible stats (map control bar, production, armies)
    .ghud-armies-panel: My moving armies (clickable for camera focus, recall button)
    .ghud-enemy-armies: Incoming enemy armies
  
  .ghud-region-tooltip: Floating tooltip at pointer position
  
  BuildingBar: Bottom bar with 7 building buttons
  
  .ghud-toasts: Toast notification stack
  
  Dialogs: Eliminated, Spawn Confirm, Quit Confirm
  Overlays: Spawn Phase, Preview Countdown, Settings Panel
```

**CSS Classes (from `game-hud.css`):**
- Fonts: Cinzel (serif, for titles/timers), Inter (sans-serif, for data)
- Color scheme: Gold (`#c8a84e`), dark blue backgrounds (`rgba(6,6,14,0.82-0.95)`)
- Glass morphism: `backdrop-filter: blur(8px-12px)`
- Resource colors: Iron `#aabbcc`, Crystal `#cc88ff`, Uranium `#44ff88`

**Key Interactions:**
- Toggle fullscreen via `document.documentElement.requestFullscreen()`
- Toggle mute via `soundManager.toggleMute()` + `musicManager.setEnabled()`
- Settings changes emitted via `gameBridge.emit('settings:changed', settings)`
- Quit emits `gameBridge.emit('hud:quit')`
- Army click emits `gameBridge.emit('camera:focus', { x, y })`
- Army recall emits `socketManager.emit(RECALL_ARMY, { armyId })`

### BuildingBar (`client/src/game-ui/BuildingBar.jsx`)

**Buildings:**

| ID | Icon | Name | Description |
|----|------|------|-------------|
| `city_center` | `🏛` | Sehir Merkezi | Max asker +20% (global) |
| `barracks` | `⚔` | Baraka | Uretim +10% (global) |
| `wall` | `🧱` | Duvar | Savunma +50% (lokal) |
| `iron_dome` | `🛡` | Demir Kubbe | Fuze kalkani |
| `stealth_tower` | `👁` | Gorunmezlik | Bolge gizlenir |
| `drone_facility` | `🚁` | Drone Tesisi | Drone saldirisi (1x) |
| `missile_base` | `🚀` | Fuze Ussu | Fuze saldirisi (1x) |

**Default Costs:**
```js
city_center:    { iron: 80, crystal: 80, uranium: 40 }
barracks:       { iron: 60, crystal: 30, uranium: 30 }
wall:           { iron: 40, crystal: 20, uranium: 10 }
iron_dome:      { iron: 60, crystal: 60, uranium: 80 }
stealth_tower:  { iron: 30, crystal: 70, uranium: 50 }
drone_facility: { iron: 50, crystal: 50, uranium: 70 }
missile_base:   { iron: 40, crystal: 40, uranium: 100 }
```

**Cost scaling:** `actualCost = baseCost * (1 + count * levelMultiplier / 100)`  
Default `levelMultiplier = 50`

**Flow:**
1. Click building button -> `gameBridge.emit('building:mode', buildingId)`
2. Click on own region in Phaser -> `gameBridge.emit('building:confirm', { regionId })`
3. BuildingBar receives confirm -> `socketManager.emit(BUILD_BUILDING, { regionId, buildingId })`
4. ESC cancels building mode

**Tooltip:** Portal-rendered fixed tooltip with cost breakdown and affordability check.

---

## 13. GameBridge (Phaser-React Communication)

**File:** `client/src/game-ui/GameBridge.js`

Singleton event emitter with "sticky" replay for late subscribers:

```js
class GameBridge {
  _listeners = new Map();   // event -> Set<fn>
  _sticky = new Map();      // event -> last data

  on(event, fn)    // Subscribe + replay last value
  off(event, fn)   // Unsubscribe
  emit(event, data) // Broadcast + cache
  clear()          // Reset all
}
```

### Key Events (Phaser -> React)

| Event | Data | Purpose |
|-------|------|---------|
| `game:init` | `{ myPlayerId, gameMode, mapId, players }` | Initial game state |
| `game:players` | `[{ id, username, colorStr, regionCount, eliminated }]` | Player list updates |
| `game:timer` | `number` (ms) | Game time |
| `game:stats` | `{ mapControl, production, armies, myResources, ... }` | Full stats |
| `game:preview` | `{ active, count }` | Countdown overlay |
| `game:spawnPhase` | `{ active, seconds }` | Spawn selection |
| `game:eliminated` | `undefined` | Player eliminated |
| `game:toast` | `{ message, options: { duration, color } }` | Toast notification |
| `game:fps` | `number` | FPS counter value |
| `ping_update` | `number` | Ping in ms |
| `game:regionHover` | `{ regionId, hp, type, building, x, y }` or `null` | Hover tooltip |
| `game:config` | `{ buildingCosts, attackRange, ... }` | Server config |
| `settings:changed` | `{ glow, particles, fps, ping }` | Settings update |

### Key Events (React -> Phaser)

| Event | Data | Purpose |
|-------|------|---------|
| `hud:quit` | - | Return to menu |
| `building:mode` | `string` or `null` | Enter/exit building mode |
| `building:confirm` | `{ regionId }` | Confirm building placement |
| `camera:focus` | `{ x, y }` | Focus camera on position |
| `spawn:confirm` | `{ regionId }` | Confirm spawn selection |
| `spawn:cancel` | - | Cancel spawn selection |

---

## 14. Sound System

**File:** `client/src/audio/SoundManager.js`

Singleton using Web Audio API (`AudioContext`). All sounds are synthesized (no audio files).

### Available Sounds

| Method | Trigger | Description |
|--------|---------|-------------|
| `playBubble()` | Sending soldiers | Sine 600->200Hz, 150ms |
| `playBubbleHigh()` | Multi-select, speed boost | Sine 800->400Hz, 100ms |
| `playCaptureSound()` | Region captured | Sine 400->800->300Hz, 250ms |
| `playTeleportSound()` | Gate teleport | 3 layers: square crackle + sawtooth buzz + sine rumble |
| `playWinSound()` | Victory | 4-note arpeggio (C5 E5 G5 C6) + sustained chord |
| `playBombSound()` | Missile/nuclear | 3 layers: bass boom + mid crunch + high crackle |

### Mute Control

```js
toggleMute()  // Returns new muted state
// Persists to localStorage('kust_muted')
// Default volume: 0.3 (unmuted), 0 (muted)
```

---

## 15. i18n System

**File:** `client/src/i18n/i18n.js`

### Supported Languages

| Code | Name |
|------|------|
| `en` | English |
| `tr` | Turkce |
| `de` | Deutsch |
| `fr` | Francais |
| `es` | Espanol |
| `it` | Italiano |
| `zh` | Chinese |
| `pt` | Portugues |
| `ru` | Russian |
| `ja` | Japanese |
| `ko` | Korean |
| `ar` | Arabic |

### API

```js
// Translation function (works in both Phaser and React)
t(key, params?)
// Example: t('game.spawnConfirmed')
// With params: t('auth.verify.info', { email: 'user@example.com' })
// Params replace {{paramName}} in string

getLanguage()          // Returns current lang code
getLanguages()         // Returns [{ code, name }]
setLanguage(lang)      // Switches + persists to localStorage('kust_language')
```

### React Hook

```js
const { t, language, setLanguage } = useTranslation();
// Re-renders component when language changes via listener set
```

### Key Namespaces

- `auth.*` - Login, register, verify, forgot password, reset
- `menu.*` - Play tab, store, friends, profile
- `map.*` - Map names (turkey, poland, china, etc.)
- `lobbyScene.*` - Lobby text (bot match, online PvP, ranked)
- `game.*` - In-game text (select spawn, hints, eliminated)
- `gameOver.*` - Results screen (victory, defeat, stats labels)
- `tutorial.*` - Tutorial stage instructions
- `ui.*` - Common UI (players, quit, etc.)
- `stats.*` - Stats labels (map control, production, armies)
- `settings.*` - Settings toggle labels
- `resource.*` - Resource names
- `store.*` - Store/reward text

---

## 16. Device Detection

**File:** `client/src/utils/device.js`

### Breakpoints

```js
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1200;
```

### Functions

```js
getDeviceType(width)     // -> 'mobile' | 'tablet' | 'desktop'
isMobile(width)          // width < 768
isTablet(width)          // 768 <= width < 1200
isDesktop(width)         // width >= 1200
pick(width, m, t, d)     // Returns m/t/d based on device type
isTouch()                // navigator.maxTouchPoints > 0 || 'ontouchstart' in window
getVerticalScale(height) // Math.min(1, height / 700)
isCompactHeight(height)  // height < 500 (landscape mobile)
```

### Scene Scrolling

```js
enableSceneScroll(scene, contentBottomY)
```
- Enables touch drag + wheel scrolling when content overflows screen
- Sets camera bounds to content height
- Tracks `_isScrollDragging` flag to prevent button clicks during scroll

### Safe Area Insets

```js
getSafeAreaInsets()  // -> { top, bottom, left, right }
```
- Reads CSS `env(safe-area-inset-*)` values
- Creates temporary div to compute values
- Used for iPad notch/home indicator spacing

---

## 17. Utilities

### Math (`client/src/utils/math.js`)

```js
distance(p1, p2)          // Euclidean distance
pointInPolygon(point, vertices)  // Ray-casting algorithm
lerp(a, b, t)             // Linear interpolation
angleBetween(p1, p2)      // atan2 angle in radians
clamp(value, min, max)    // Min-max clamping
polygonCentroid(vertices)  // Average of all vertex positions
```

### Colors (`client/src/utils/colors.js`)

```js
getPlayerColor(colorIndex, skinData)  // Returns { hex, str, name }
// If skinData.skin.color exists, uses that; else PLAYER_COLORS[colorIndex]

getNeutralColor()         // { hex: 0x555555, str: '#555555' }
lightenColor(hex, amount) // Lightens by 0-1 amount
darkenColor(hex, amount)  // Darkens by 0-1 amount
hexToStr(hex)             // 0x4A90D9 -> '#4a90d9'
getRegionColor(ownerId, players)  // Player color or neutral
```

---

## 18. Entity Classes

### Army (`client/src/entities/Army.js`)

```js
class Army {
  constructor(data) {
    this.id = data.id;
    this.ownerId = data.ownerId;
    this.count = data.count || 0;
    this.position = { ...data.position };
    this.target = { ...data.target };
    this.targetRegionId = data.targetRegionId || null;
    this.previousPosition = { ...data.position };
    this.speed = data.speed || 25;  // px/s (matches server ARMY_SPEED)
  }
  updateCount(count) { ... }
  updateFromServer(data) { ... }  // Legacy, no longer used for position
}
```

### Region and Player

Referenced from `client/src/entities/Region.js` and `client/src/entities/Player.js`:
- Region has: id, center, vertices, type, hp, ownerId, neighbors, defenseBonus, speedMultiplier, productionRate, building, resourceType, resourceRate, stealthed
- Player has: id, username, colorIndex, isBot, eliminated, skinData, resources, ability charges, ability cooldown ends

---

## 19. Configuration & Constants

### config.js

```js
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';
export const GAME_WIDTH = 1600;
export const GAME_HEIGHT = 900;
```

### Player Colors (16 total, maximum contrast order)

```js
0:  { hex: 0xE94560, str: '#E94560', name: 'Red' }
1:  { hex: 0x06D6A0, str: '#06D6A0', name: 'Green' }
2:  { hex: 0x8338EC, str: '#8338EC', name: 'Purple' }
3:  { hex: 0xFFD166, str: '#FFD166', name: 'Gold' }
4:  { hex: 0x4CC9F0, str: '#4CC9F0', name: 'Cyan' }
5:  { hex: 0xFF6B35, str: '#FF6B35', name: 'Orange' }
6:  { hex: 0x8AC926, str: '#8AC926', name: 'Lime' }
7:  { hex: 0xF72585, str: '#F72585', name: 'Pink' }
8:  { hex: 0x2EC4B6, str: '#2EC4B6', name: 'Teal' }
9:  { hex: 0xFB5607, str: '#FB5607', name: 'Deep Orange' }
10: { hex: 0x7209B7, str: '#7209B7', name: 'Violet' }
11: { hex: 0xFFBE0B, str: '#FFBE0B', name: 'Amber' }
12: { hex: 0x6A4C93, str: '#6A4C93', name: 'Plum' }
13: { hex: 0xFF595E, str: '#FF595E', name: 'Coral' }
14: { hex: 0xE07C24, str: '#E07C24', name: 'Bronze' }
15: { hex: 0xFF006E, str: '#FF006E', name: 'Magenta' }
NEUTRAL: { hex: 0x555555, str: '#555555' }
```

### Map Configuration

```js
const GAME_MAPS = [
  { id: 'turkey',  nameKey: 'map.turkey',  color: '#d94a4a', regions: 91,  minPlayers: 2, maxPlayers: 4 },
  { id: 'poland',  nameKey: 'map.poland',  color: '#dc143c', regions: 73,  minPlayers: 2, maxPlayers: 4 },
  { id: 'china',   nameKey: 'map.china',   color: '#de2910', regions: 34,  minPlayers: 2, maxPlayers: 4 },
];
export const MAPS_PER_ROW = 3;
```

---

## 20. Build & Dependencies

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `phaser` | ^3.70.0 | Game engine (WebGL/Canvas rendering) |
| `react` | ^19.2.4 | UI components (HUD, menus, auth) |
| `react-dom` | ^19.2.4 | React DOM renderer |
| `socket.io-client` | ^4.7.2 | Real-time server communication |
| `chart.js` | ^4.5.1 | Chart rendering (stats/profile) |
| `react-chartjs-2` | ^5.3.1 | React wrapper for Chart.js |
| `@capacitor/core` | ^6.1.0 | Mobile platform abstraction |
| `@capacitor/haptics` | ^6.0.0 | Mobile haptic feedback |
| `@capacitor/keyboard` | ^6.0.0 | Mobile keyboard management |
| `@capacitor/screen-orientation` | ^6.0.0 | Lock to landscape |
| `@capacitor/splash-screen` | ^6.0.0 | Splash screen control |
| `@capacitor/status-bar` | ^6.0.0 | Status bar hiding |
| `@vitejs/plugin-react` | ^4.7.0 | React JSX transform for Vite |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^5.0.0 | Build tool & dev server |

### Build

```bash
npm run dev      # Vite dev server on port 5173
npm run build    # Production build to client/dist/
npm run preview  # Preview production build
```

**Output:** `client/dist/` with sourcemaps enabled.

### Capacitor Mobile Integration

On native platform start:
1. Hides status bar (dark style)
2. Locks to landscape orientation
3. Hides splash screen after 500ms

---

## 21. Depth Layering Reference

| Depth | Element |
|-------|---------|
| 0 | Ocean background (GameScene) |
| 1 | Ocean background (MapRenderer) |
| 5 | Outer landmass glow |
| 10 | Region polygons (fill + border) |
| 11 | Owner glow stripes (masked) |
| 12 | Snow/Rocky/Speed decorations, Friendly borders, Siege images |
| 15 | Highlight layer |
| 16 | Region highlights (selection glow) |
| 18 | Fog overlays |
| 20 | HP text, badge text, resource icons |
| 22 | Tower/Mountain decorations |
| 45 | Gate connection lines |
| 50 | Army graphics, Gate portals |
| 51 | Army count text |
| 55 | Army death effects (skull, flash) |
| 56-57 | Gate teleport burst effects |
| 99-102 | Capture effects (sparkle, shockwave, flames, lightning) |
| 100 | Selection arrow graphics |
| 199-202 | Missile/nuclear explosion effects |
| 300-302 | Freeze full-screen effect |
| 490-492 | Camera reset button |
| 500 | AbilityBar container |
| 501 | AbilityBar hit areas |
| 600 | Drag hint text |
| 900 | Confetti (GameOverScene) |

---

## 22. Event Reference

### Client -> Server Events

| Event | Data | Purpose |
|-------|------|---------|
| `join_lobby` | `{ mode, username, mapType, token }` | Join matchmaking |
| `leave_lobby` | `{}` | Leave matchmaking |
| `player_ready` | - | Mark as ready |
| `send_soldiers` | `{ sourceIds[], targetId }` | Send troops |
| `select_spawn` | `{ regionId }` | Select spawn point |
| `use_missile` | `{ targetRegionId }` | Use missile ability |
| `use_nuclear` | `{ targetRegionId }` | Use nuclear ability |
| `use_barracks` | `{ targetRegionId }` | Use barracks ability |
| `use_speed_boost` | `{}` | Use speed boost |
| `use_freeze` | `{}` | Use freeze ability |
| `build_building` | `{ regionId, buildingId }` | Place building |
| `recall_army` | `{ armyId }` | Recall army |
| `ping_check` | `timestamp` | Ping measurement |

### Server -> Client Events

| Event | Data | Handler |
|-------|------|---------|
| `lobby_update` | `{ players, status }` | LobbyScene |
| `game_countdown` | `{ seconds }` | LobbyScene |
| `game_start` | Full game data | LobbyScene -> GameScene |
| `state_update` | Delta regions/armies/players | GameSync.handleStateUpdate |
| `army_created` | Army data | GameSync.handleArmyCreated |
| `army_destroyed` | `{ armyId }` | GameSync.handleArmyDestroyed |
| `region_captured` | `{ regionId, newOwnerId, hp }` | GameSync.handleRegionCaptured |
| `player_eliminated` | `{ playerId }` | GameSync.handlePlayerEliminated |
| `gate_teleport` | Teleport data | GameSync.handleGateTeleport |
| `missile_applied` | `{ playerId, position, damage }` | GameSync.handleMissileApplied |
| `nuclear_applied` | `{ playerId, position }` | GameSync.handleNuclearApplied |
| `barracks_applied` | `{ playerId, position }` | GameSync.handleBarracksApplied |
| `speed_boost_applied` | `{ playerId }` | GameSync.handleSpeedBoostApplied |
| `freeze_applied` | `{ playerId, duration }` | GameSync.handleFreezeApplied |
| `ability_granted` | `{ playerId, ability }` | GameSync.handleAbilityGranted |
| `siege_started` | Siege data | GameSync.handleSiegeStarted |
| `siege_ended` | `{ regionId }` | GameSync.handleSiegeEnded |
| `spawn_selected` | Spawn data | GameSync.handleSpawnSelected |
| `spawn_phase_end` | Region data | GameSync.handleSpawnPhaseEnd |
| `regions_reveal` | Revealed region data | GameSync.handleRegionsReveal |
| `game_over` | Result data | GameSync.handleGameOver |
| `ranking_update` | ELO/rank changes | GameSync.handleRankingUpdate |
| `diamond_reward` | `{ diamonds }` | GameSync.handleDiamondReward |
| `queue_update` | `{ position, queueSize }` | LobbyScene |
| `match_found` | `{ players, mapType }` | LobbyScene |
| `error` | `{ message }` | LobbyScene |
| `pong_check` | `timestamp` | GameScene ping handler |

---

*End of Frontend Documentation*

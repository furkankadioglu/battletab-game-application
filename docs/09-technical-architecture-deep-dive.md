# 09 - Technical Architecture Deep-Dive

> KUST 10 - Pillows: Multiplayer RTS Game  
> Engine: PhaserJS (client) + ExpressJS/Node.js (server)  
> Transport: Socket.IO (WebSocket-only)  
> Database: PostgreSQL | Cache: Redis

---

## 1. Software Architecture Patterns

### 1.1 Overall Architecture

The game uses a **client-server model** with **server-authoritative design**. The server is the single source of truth for all game state: region ownership, HP, army existence, combat resolution, ability effects, and win conditions. The client never directly modifies game state; every player action is sent to the server as a request, validated, and only then applied.

**Why server-authoritative?** In a competitive multiplayer RTS, allowing clients to compute game state opens the door to cheating (modifying HP, spawning armies, seeing through fog). By keeping the server as the authority, the client is reduced to a **rendering terminal** that displays what the server tells it, plus local prediction for visual smoothness.

**Hybrid rendering architecture:**
- **PhaserJS** handles the game canvas: map rendering, army sprites, camera, input, visual effects
- **React** handles the UI overlay: HUD panels, stats, ability bar tooltips, settings, menus
- **GameBridge** is the communication layer between Phaser and React -- a simple event emitter with "sticky" events (last-value caching so late-mounting React components receive the most recent state)

```
React (MenuApp.jsx / GameHUD.jsx)
        |  GameBridge (event bus with sticky cache)
        v
PhaserJS (GameScene, MapRenderer, ArmyRenderer, SelectionSystem)
        |  SocketManager (WebSocket)
        v
Express Server (GameRoom, GameLoop, Systems)
        |
  PostgreSQL + Redis
```

**Event-driven architecture:**
All communication flows through events. Socket.IO events carry game actions from client to server and state updates from server to client. GameBridge events carry game state from Phaser to React and user actions from React to Phaser.

### 1.2 Design Principles Applied

#### Server Authority (Core Principle)
The server validates every action before it takes effect:
- `send_soldiers`: checks ownership, HP >= 2, attack range, fog visibility, rocky/gate restrictions
- `use_ability`: checks charge count, cooldown timer, target validity
- `select_spawn`: checks game phase, region availability, type restrictions
- `build_building`: checks ownership, resource cost, maxPerPlayer limits

The client receives only the **results** of validated actions, never performs game logic directly.

#### Single Responsibility Principle
The codebase separates concerns into distinct modules:
- **GameRoom**: Room lifecycle (join, leave, countdown, spawn selection, game start/end)
- **GameState**: Pure data container (regions, armies, players, gates)
- **GameLoop**: Tick orchestration (calls systems in order, broadcasts state)
- **ProductionSystem**: Soldier generation per tick
- **MovementSystem**: Army position updates per tick
- **CollisionSystem**: Army-vs-army collision detection
- **ConquestSystem**: Army arrival and siege initiation
- **SiegeSystem**: Progressive damage from siege armies
- **VisibilitySystem**: BFS fog-of-war calculation
- **PathfindingSystem**: Waypoint computation around rocky regions

On the client:
- **MapRenderer**: Region polygons, fog overlays, decorations, text labels
- **ArmyRenderer**: Army sprites, client-side prediction, trail particles
- **SelectionSystem**: Drag-to-send input handling
- **CameraSystem**: Pan, zoom, bounds
- **GameSync**: Server event handling and state reconciliation

#### Open/Closed Principle
- **MapGenerator** is extensible for new map types (grid, turkey, etc.) without modifying core game logic
- **BuildingCatalog** allows adding new building types without changing the build system
- Region types (NORMAL, TOWER, SPAWN, MOUNTAIN, SNOW, ROCKY, SPEED) are data-driven through `regionTypes`

#### Dependency Inversion
All game systems (VisibilitySystem, MovementSystem, PathfindingSystem) are pure functions or stateless modules that receive `gameState` as a parameter. They have no dependency on GameRoom or networking -- they operate on the state object directly.

#### DRY: Shared Constants
`shared/gameConstants.js` is imported by both client and server through `server/src/game/constants.js`. Tick rate, army speed, production rates, ability durations, and all numeric values are defined once.

#### YAGNI: What Was Intentionally Kept Simple
- No entity-component-system (ECS) framework: the game has ~3 entity types (Region, Army, Player), making a full ECS unnecessary overhead
- No complex interpolation: client-side prediction eliminates the need for server position updates and interpolation buffers
- No replay system: game state is ephemeral, not persisted frame-by-frame
- No WebRTC/UDP: Socket.IO WebSocket is sufficient for the tick rate (10 tps) and the nature of RTS commands

### 1.3 Component Architecture

**Scene-based architecture (Phaser scenes as pages):**
- `MenuScene` / `MenuApp.jsx`: Main menu (React-rendered)
- `GameScene`: The game itself (Phaser canvas + React HUD overlay)

**System-based game logic:**
Each system is an independent module with a clear responsibility, instantiated by GameScene:
- `MapRenderer`: Owns all region graphics, fog overlays, decorations, siege visuals
- `ArmyRenderer`: Owns all army sprites, handles client-side prediction movement
- `SelectionSystem`: Processes pointer input, manages source/target selection, emits send_soldiers
- `AbilityBar`: Renders ability buttons on Phaser canvas (needs world input for targeting)
- `CameraSystem`: Handles pan/zoom with bounds clamping
- `GateRenderer`: Draws gate portal visuals
- `SiegeRenderer`: Pixel-based territory fill animation

**Entity pattern:**
- `Army` (client): Lightweight data holder -- `id`, `ownerId`, `count`, `position`, `target`, `speed`. The `updateFromServer` method is a no-op in prediction mode.
- `Region` (client): Data holder with `hp`, `ownerId`, `type`, `neighbors`, `resourceType`
- `Player` (client): Data holder with `username`, `colorIndex`, `charges`, `cooldowns`, `resources`

---

## 2. Client-Side Prediction (Valve/Riot Style)

### 2.1 The Problem

The server tick rate is **10 tps** (100ms per tick). The client renders at **60 fps** (16.7ms per frame). Without prediction, armies would jump between positions every 100ms, appearing to teleport. With network latency (50-200ms), the visual delay becomes even more pronounced.

### 2.2 The Solution: Zero-Server-Position Architecture

This game uses an unconventional but highly effective prediction model: **the server never sends army positions in tick updates**. Instead:

1. **Server sends `army_created` event** (once, when army spawns) containing:
   - `position`: starting position (edge of source region)
   - `target`: immediate movement target
   - `waypoints`: intermediate pathfinding waypoints (around rocky regions)
   - `finalTarget`: ultimate destination (edge of target region)
   - `speed`: pixels per second (default: 25)

2. **Client predicts position every frame** in `ArmyRenderer.updateAll()`:
   ```
   moveAmount = speed * deltaSec  (capped at 33ms equivalent to prevent jumps)
   direction = normalize(moveTarget - currentPos)
   currentPos += direction * moveAmount
   ```

3. **Server only sends per-tick**:
   - `armyUpdates`: count changes (attrition, collision) -- `[{ id, c }]`
   - `destroyedArmies`: list of army IDs that were destroyed/arrived

4. **Client handles waypoint following**:
   - When army reaches `moveTarget`, advance `_waypointIndex`
   - Load next waypoint from `_waypoints` array
   - When all waypoints exhausted, army hides itself (`_arrived = true`) and waits for server `destroyedArmies` event

This approach has **zero position data in tick updates**, saving massive bandwidth. The tradeoff is minor position drift between client and server, which is acceptable because:
- Armies travel in straight lines between known points
- Both client and server use the same speed value
- Arrival is detected server-side by polygon containment (army enters target region polygon)

### 2.3 Optimistic Updates (Preview Armies)

When a player sends soldiers, the client creates **preview armies** before the server responds:

1. Player drags from source to target, releases
2. `SelectionSystem._createPreviewArmies()` instantly creates visual army sprites with IDs prefixed `preview_`
3. Server processes `send_soldiers`, validates, creates real armies, emits `army_created`
4. `GameSync.handleArmyCreated()` finds matching preview (same `targetRegionId`), removes it, and adds the real army sprite

**Preview cleanup:**
- Timeout scales with ping: `Math.max(2000, ping * 4)` milliseconds
- Stale previews are cleaned up in `handleStateUpdate()` every tick
- Preview armies are removed silently (no death effect) via `removeArmy()` detecting `preview_` prefix

### 2.4 Reconciliation Strategy

**There is no traditional position reconciliation.** The game deliberately avoids server position corrections because:
- Server does not send positions in tick updates (bandwidth optimization)
- Client and server both compute position from the same initial conditions
- Minor drift is invisible at the game's scale

**What the server is authoritative for:**
- Army existence (creation/destruction)
- Army count (attrition, collision damage)
- Region ownership and HP
- All game logic (combat, abilities, win conditions)

**What the client handles independently:**
- Army visual position (prediction from speed/target/waypoints)
- Fog-of-war overlay (client-side BFS mirror of server calculation)
- Camera position and zoom

### 2.5 Snap Locks

After gate teleportation, the army's position changes instantly. `snapArmy()` sets:
```js
sprite._snapUntil = Date.now() + 300; // skip prediction for 300ms
```
During this window, `updateAll()` skips the movement calculation, preventing the army from "jumping" from the pre-teleport position.

---

## 3. Server Reconciliation & Authoritative State

### 3.1 What the Server Controls

| Domain | Details |
|--------|---------|
| Region HP | Production, siege damage, ability damage, conquest |
| Region ownership | Capture logic, siege resolution |
| Region buildings | Build validation, cost deduction, placement |
| Army lifecycle | Creation (with validation), destruction (arrival/attrition/collision) |
| Army count | Attrition (1 soldier/second while traveling), collision damage |
| Ability effects | Missile (50% HP damage), Nuclear (production freeze), Barracks (upgrade to tower), Speed Boost (1.25x), Freeze (1.5s army freeze) |
| Game phases | waiting -> countdown -> spawn_selection -> preview -> playing -> finished |
| Win conditions | Elimination check after each conquest/siege event |
| Visibility | BFS calculation per player per tick |

### 3.2 State Broadcasting Strategy

The game loop runs at **10 ticks per second** (100ms interval). Each tick, `broadcastState()` sends a **per-player filtered** payload.

#### Delta-Only Regions
```js
// Only send regions whose state changed since last broadcast
for (const region of gameState.regions.values()) {
  if (region.isDirty()) {
    dirtyRegions.push(region.serializeDelta());
    region.markClean();
  }
}
```

**Dirty tracking** (`Region.isDirty()`):
A region is dirty when any of these differ from their last-sent values:
- `Math.floor(hp)` (integer HP, ignoring sub-integer production accumulation)
- `ownerId` (ownership change)
- `isNuclearized()` (nuclear effect state)
- `Math.floor(totalSiegeForce)` (siege force changes)
- `building` (building placed/removed)

`markClean()` stores the current values. This means a region producing soldiers continuously only becomes dirty when HP crosses an integer boundary.

#### serializeDelta() Payload (Per Region)
```json
{
  "id": "region_123",
  "hp": 45,
  "ownerId": "player_abc",
  "nuclearized": false,
  "abilityGranted": false,
  "building": null,
  "siegeForces": {},
  "siegeEntryPoints": []
}
```
No vertices, no center, no neighbors, no type. Only dynamic data that changes during gameplay.

#### Player Data Throttling
```js
const shouldSendPlayers = this.gameState.tickCount % 5 === 0;
```
Player data (charges, cooldowns, resources, regionCount) is sent **every 5th tick** (500ms). This represents an **80% reduction** in player data bandwidth. Enemy player data is further stripped to minimal fields (no charges, cooldowns, or resources).

#### Army Count-Only Updates
```js
// Only send armies whose count changed
const armyCountChanges = [];
for (const army of allArmies) {
  const lastCount = this._lastArmyCount.get(army.id);
  if (lastCount !== undefined && lastCount !== army.count) {
    armyCountChanges.push({ id: army.id, c: army.count });
  }
  this._lastArmyCount.set(army.id, army.count);
}
```
Payload: `[{ id: "army_xyz", c: 8 }]` -- only ID and new count. No position, no target, no speed.

#### Destroyed Armies
```js
const destroyedArmyIds = [];
for (const trackedId of this._lastSentArmyState.keys()) {
  if (!currentArmyIds.has(trackedId)) {
    destroyedArmyIds.push(trackedId);
  }
}
```
Just an array of IDs: `["army_001", "army_002"]`

#### Per-Player Fog Filtering

Army count changes are filtered by visibility:
```js
const visibleCountChanges = armyCountChanges.filter(update => {
  const army = this.gameState.armies.get(update.id);
  if (army.ownerId === playerId) return true;
  return army.targetRegionId && visibleRegions.has(army.targetRegionId);
});
```

Stealth tower regions hide HP from enemies:
```js
if (fullRegion.building === 'stealth_tower' && fullRegion.ownerId !== playerId) {
  return { ...r, hp: -1, stealthed: true };
}
```

#### Revealed Regions (Fog Lift)
When a player's visibility expands (capturing new territory), newly visible regions get their hidden data sent:
```js
for (const rid of visibleRegions) {
  if (!prevVisible.has(rid)) {
    revealedRegions.push({
      id: rid,
      resourceType: region.resourceType,
      resourceRate: region.resourceRate,
      building: region.building,
      type: region.type,
      defenseBonus: region.defenseBonus,
    });
  }
}
```
This is a one-time reveal. Resource types and buildings are security-sensitive data that was stripped during initial `regions_reveal`.

### 3.3 Bandwidth Optimization Breakdown

**Per-tick state_update payload estimate (per player):**

| Component | Frequency | Approx Size |
|-----------|-----------|-------------|
| Dirty regions | Every tick, only changed ones | ~80 bytes per dirty region (typically 2-5 dirty per tick = 160-400 bytes) |
| Army count updates | Every tick, only changed counts | ~20 bytes per changed army (typically 0-3 = 0-60 bytes) |
| Destroyed armies | Every tick, only IDs | ~15 bytes per destroyed army (typically 0-1 = 0-15 bytes) |
| Player data | Every 5th tick only | ~200 bytes (self) + ~40 bytes per opponent = ~280 bytes, amortized to ~56 bytes/tick |
| Events | Per tick if any | ~50-100 bytes per event (rare) |
| Revealed regions | Only when fog lifts | ~60 bytes per revealed region (rare) |
| Overhead (JSON + Socket.IO framing) | Every tick | ~50 bytes |

**Estimated total per tick per player: 300-600 bytes**  
**Estimated bandwidth per player: 3-6 KB/s** (at 10 tps)

Compare to a naive approach (full state every tick): all regions (~200 x 200 bytes = 40KB) + all armies (position, target, count = ~100 bytes x 20 = 2KB) = ~42KB per tick = **420 KB/s**. The delta approach achieves a **~100x reduction**.

---

## 4. Performance Engineering - Client

### 4.1 Rendering Performance (FPS)

#### Frustum Culling (Every Frame)

`MapRenderer.update()` runs **every frame** from `GameScene.update()`. It tests every region's pre-calculated AABB bounds against the camera viewport:

```js
const visible = bounds.maxX >= vx && bounds.minX <= vRight &&
                bounds.maxY >= vy && bounds.minY <= vBottom;
```

AABB bounds are calculated once per region during `_drawRegion()`:
```js
for (const v of vertices) {
  if (v.x < bMinX) bMinX = v.x;
  // ...
}
this.regionBounds.set(id, { minX: bMinX, minY: bMinY, maxX: bMaxX, maxY: bMaxY });
```

When a region is off-screen, frustum culling hides:
- Region graphics (polygon fill)
- Region highlights
- Owner glow graphics
- HP text, badge text, resource text (only hide when off-screen; re-showing is managed by fog system and viewport culling)
- All decorations (tower, mountain, snow, rocky, speed)
- Fog overlays (only visible if both in-viewport AND fogged)

**Padding: 100px** around the viewport to prevent pop-in at the edges.

#### Viewport Culling (Throttled, Every 6th Frame)

`MapRenderer.updateViewportCulling()` is called from `GameScene.update()`:
```js
if (++this._vpCullFrame % 6 === 0) {
  this.mapRenderer.updateViewportCulling(cam);
}
```

This handles text/glow visibility with more nuance than frustum culling:
- **Zoom threshold**: all text hidden when `cam.zoom < 0.3` (unreadable at that zoom)
- **Skips fogged regions**: already hidden by fog system
- **Skips spawn phase**: respects `_detailsHidden` flag
- **Uses AABB bounds** (not center point -- which was a fixed bug)
- **Margin: 200px** (larger than frustum culling to prevent edge flicker)
- **HP text**: only shown if `data.hp > 0` (prevents showing "0" during spawn phase)

#### Owner Glow Batch Update (Every 12th Frame)

**OLD approach (removed):** Each owned region had a Phaser Tween object that animated stripe colors. With 50+ owned regions, this meant 50+ active tweens causing GC pressure and CPU overhead.

**NEW approach:** `MapRenderer.updateOwnerGlows()` is called from `GameScene.update()` and uses a single global time variable:

```js
updateOwnerGlows(delta) {
  if (this.ownerGlows.size === 0 || this._glowsDisabled) return;
  
  this._glowTime += delta * 0.001;
  const t = (this._glowTime * Math.PI * 2 / 4) % (Math.PI * 2); // 4-second cycle
  
  // Skip 11 out of 12 frames
  if (++this._glowFrameSkip % 12 !== 0) return;
  
  for (const [, glow] of this.ownerGlows) {
    // Calculate stripe colors mathematically using sin(t + phase)
    // Draw 8 stripes per region with lerped dark<->light colors
  }
}
```

Each glow stores its animation data (`_glowData`) for the manual loop:
- `darkHex`, `lightHex`: color range for stripes
- `direction`: 0-3 (random direction per region)
- `STRIPE_COUNT`: 8 stripes per region
- `stripePhases`: `[0, 0.5, 1.0, 1.5, ...]` for wave offset

The stripe animation is a masked rectangle fill: a geometry mask clips the stripe rectangles to the region polygon shape.

#### Object Pooling

`ArmyRenderer` maintains three object pools:

| Pool | Type | Max Size | Purpose |
|------|------|----------|---------|
| `_graphicsPool` | `Phaser.Graphics` | 50 | Reuse destroyed army visuals |
| `_textPool` | `Phaser.Text` | 50 | Reuse destroyed army count labels |
| `_trailParticlePool` | `Phaser.Graphics` | Unlimited (soft cap 50 active) | Reuse faded trail particles |

**Allocation pattern (army creation):**
```js
let graphics = this._graphicsPool.pop();
if (graphics) {
  graphics.setVisible(true);
  graphics.setAlpha(1);
  graphics.setScale(1);
} else {
  graphics = this.scene.add.graphics(); // only if pool empty
}
```

**Deallocation pattern (army removal):**
```js
if (this._graphicsPool.length < this._poolMaxSize) {
  sprite.graphics.clear();
  sprite.graphics.setVisible(false);
  this._graphicsPool.push(sprite.graphics);
} else {
  sprite.graphics.destroy(); // pool full, actually destroy
}
```

**Trail particles** have an additional cap: active particles are limited to 50. When exceeded, the oldest particle is recycled to the pool immediately.

#### Text Scale Optimization

Text must appear at consistent screen-space size regardless of camera zoom. The naive approach recalculates scale every frame for every text object. The optimized approach:

```js
// Only update when zoom actually changes
if (cam.zoom !== this._lastTextZoom) {
  this._lastTextZoom = cam.zoom;
  const invZoom = 1 / cam.zoom;
  for (const [, texts] of this.mapRenderer.regionTexts) {
    if (texts.hpText) texts.hpText.setScale(invZoom);
    if (texts.resourceText) texts.resourceText.setScale(invZoom);
    if (texts.badgeText) texts.badgeText.setScale(invZoom);
  }
}
```

**Visibility is NOT set in this loop.** An earlier bug caused flicker because the zoom loop was competing with the viewport culling system for visibility control. Now, scale and visibility are managed by separate systems.

#### Death Effects (Lightweight)

Army death uses two different lightweight effects (no particle systems):
- **Attrition death** (count <= 0): Single emoji text ("skull") that tweens upward and fades over 800ms, then destroys itself
- **Combat death**: Single `Graphics` object (white circle) that tweens to 2x scale and fades over 200ms, then destroys itself

Both effects are self-cleaning via tween `onComplete` callbacks.

#### Army Viewport Culling

`ArmyRenderer.updateAll()` performs per-army viewport culling every frame:
```js
const cullMargin = 100;
const vpLeft = cam.scrollX - cullMargin;
// ...
const inViewport = px >= vpLeft && px <= vpRight && py >= vpTop && py <= vpBottom;

if (!inViewport) {
  sprite.graphics.setVisible(false);  // hide but keep updating position
  sprite.text.setVisible(false);
  continue; // skip rendering, but position still updates
}
```

Armies outside the viewport are hidden but continue to predict their position. When they re-enter the viewport, they appear at the correct predicted position.

### 4.2 Auto Performance Mode

`GameScene._autoPerf_checkLowFps()` monitors FPS and automatically enables optimizations if average FPS drops below 30:

1. **Sampling**: After 5 seconds of gameplay, samples FPS every 500ms, keeping last 10 samples
2. **Trigger**: Average of 6+ samples below 30 FPS
3. **Actions**:
   - Disable owner glow animations (`_glowsDisabled = true`)
   - Disable trail particles on armies (`_autoLowPerf = true`)
   - Slow siege animation to every 12th frame (from every 6th)
   - Persist `kust_low_perf` flag in localStorage

### 4.3 Memory Performance

| Strategy | Implementation |
|----------|---------------|
| Object pooling | 3 pools in ArmyRenderer (graphics, text, trail particles) |
| Trail particle cap | Max 50 active particles, excess recycled |
| Fog overlay reuse | Created once per region, destroyed on fog lift, not recreated until fogged again |
| Region data caching | `regionData` Map caches vertices, center, type, neighbors |
| AABB bounds caching | `regionBounds` Map computed once per region at render time |
| Glow data caching | `_glowData` stores precomputed animation parameters |
| Delta cap | `Math.min(delta, 33)` prevents massive movement jumps from frame spikes |

---

## 5. Performance Engineering - Server

### 5.1 Game Loop Optimization

**Tick rate: 10 tps (100ms interval)**  
**Tick duration: 100ms**

The game loop (`GameLoop._tick()`) executes systems in fixed order:
1. ProductionSystem (HP generation)
2. MovementSystem (army position updates)
3. CollisionSystem (army-vs-army)
4. ConquestSystem (arrival handling, siege initiation)
5. SiegeSystem (progressive siege damage)
6. GateSystem (teleportation portal processing)
7. WinCondition (elimination check)
8. broadcastState (network send)

Each system is a pure function operating on `gameState`. No system depends on the output of a previous system within the same tick (they all read from the same state).

**MovementSystem optimization:**
- Speed-modifier regions (SNOW, SPEED) are cached per tick:
  ```js
  if (!gameState._speedRegionsCache || gameState._speedRegionsCacheTick !== gameState.tickCount) {
    gameState._speedRegionsCache = [];
    // collect all regions with speedMultiplier != 1.0
  }
  ```
- Safety timeout: armies stuck for >45 seconds are force-destroyed
- Attrition: 1 soldier/second accumulated fractionally

### 5.2 Visibility Calculation

`VisibilitySystem.getVisibleRegions()` uses **BFS from all owned regions** with configurable depth (default: 2):

```
Owned regions (depth 0)
  -> Immediate neighbors (depth 1)
    -> Neighbors of neighbors (depth 2)
```

**Gate tunnel extension:** After the BFS, if any visible region contains a gate, the paired gate's region AND its immediate neighbors are also added to the visible set. This creates a "see through the tunnel" effect.

**Fog depth is admin-configurable** via `getGameSettings().fogDepth`.

**Per-player caching:**
```js
if (!this._playerVisibility) this._playerVisibility = new Map();
const prevVisible = this._playerVisibility.get(playerId) || new Set();
// ... compute new visibility ...
this._playerVisibility.set(playerId, visibleRegions);
```
The previous visibility set is compared to the new one to detect newly revealed regions.

### 5.3 State Serialization Hierarchy

| Method | Used For | Content |
|--------|----------|---------|
| `Region.serialize()` | `regions_reveal` (once after spawn phase) | Full data: vertices, center, neighbors, type, HP, owner, productionRate, defenseBonus, resourceType, building, siegeForces |
| `Region.serializeDelta()` | `state_update` (every tick, dirty only) | Minimal: id, hp, ownerId, nuclearized, building, siegeForces, siegeEntryPoints |
| `Army.serialize()` | `army_created` (once per army) | Full: id, ownerId, count, position, target, speed, waypoints, finalTarget |
| `Army.serializeDelta()` | Not used in current architecture | Would contain: id, ownerId, count, position, target, speed |
| `Player.serialize()` | `game_start`, `state_update` (throttled) | Self: full data. Enemy: minimal (no charges, cooldowns, resources) |

---

## 6. Fog of War Architecture

### 6.1 Server-Side (Security Boundary)

Fog of war is not just visual -- it is a **security boundary**. Data that would reveal hidden information is never sent to the client.

**spawn_selection phase:**
All regions are sent with stripped data:
```js
type: 'NORMAL', hp: 0, defenseBonus: 0, resourceType: null, building: null
```
Real types, HP values, resources, and buildings are hidden until the game starts.

**regions_reveal (post-spawn):**
Per-player filtered: fogged regions have `resourceType`, `resourceRate`, and `building` stripped to `null`/`0`.

**army_created event:**
Only emitted to players who can see the source OR target region:
```js
if (army.ownerId === pid) {
  sock.emit('army_created', army); // always see own armies
} else {
  const vis = VisibilitySystem.getVisibleRegions(pid, gameState);
  if (vis.has(army.targetRegionId) || vis.has(army._sourceRegionId)) {
    sock.emit('army_created', army);
  }
}
```

**state_update:**
- Army count changes filtered by visibility
- Region HP hidden for stealth_tower buildings (`hp: -1, stealthed: true`)
- Newly visible regions get resource/building data via `revealedRegions`

### 6.2 Client-Side (Visual)

`MapRenderer.updateFogOfWar()` mirrors the server's BFS:
- BFS from owned regions, depth 1 (client uses depth 1; server uses configurable depth)
- Gate tunnel extension (same logic as server)
- Tracks `foggedRegions` Set

**_applyFog(regionId):**
- Hide: hpText, nameText, badgeText, resourceText
- Hide: snow, rocky, mountain, tower, speed decorations
- Create fog overlay: dark polygon (color `0x050812`, opacity `0.65`, depth `18`)

**_removeFog(regionId):**
- Restore text visibility (HP text only if `hp > 0`)
- Show decorations
- Destroy fog overlay graphics

**Army fog visibility** (`ArmyRenderer.updateFogVisibility()`):
- Own armies: always visible
- Enemy armies: check which region the army is in (using predicted position) via `mapRenderer.getRegionAtPoint()`, if that region is fogged, hide the army

---

## 7. Depth Layering Strategy

| Depth | Content |
|-------|---------|
| 0 | Extended ocean background (GameScene) |
| 1 | Map ocean background (MapRenderer) |
| 5 | Outer landmass glow |
| 10 | Region polygon fills |
| 11 | Owner glow stripes (masked) |
| 12 | Region decorations (snow texture, rocky hatching, speed streaks, siege spread images, friendly borders) |
| 15 | Region highlight borders, wall overlays |
| 16 | Active selection highlight |
| 18 | Fog overlay polygons |
| 20 | HP text, badge text, resource icons |
| 22 | Tower decoration (castle icon), Mountain decoration (shield icon) |
| 23 | Spawn marker (player icon + username) |
| 49 | Trail particles |
| 50 | Army graphics (sprites) |
| 51 | Army count text |
| 52 | Freeze overlay on armies |
| 55 | Death effects (skull emoji, flash circle) |
| 99-101 | Capture effects (sparkle, shockwave, flames, lightning) |
| 100 | Selection arrow |
| 500-600 | First-time drag hint (arrow, dot, text) |

---

## 8. Camera Architecture

### Two-Camera Setup

GameScene creates two cameras:
1. **Main camera** (`this.cameras.main`): Game world camera. Pans and zooms with player input.
2. **UI camera** (`this.uiCamera`): Fixed overlay camera for screen-space UI elements.

**Separation logic:**
```js
this.uiCamera = this.cameras.add(0, 0);
for (const child of this.children.list) {
  if (child.scrollFactorX === 0) {
    mainCam.ignore(child);     // Fixed UI -> only on uiCamera
  } else {
    this.uiCamera.ignore(child); // World objects -> only on mainCam
  }
}
```

Every game object created after scene setup is explicitly told to ignore the UI camera:
```js
this._uiCamera.ignore(graphics);
this._uiCamera.ignore(countText);
```

This prevents world objects (regions, armies, decorations) from rendering on the UI camera, and prevents UI elements from scrolling with the game world.

---

## 9. Network Configuration

### Socket.IO Server Configuration

```js
const io = new Server(httpServer, {
  transports: ['websocket'],     // Skip HTTP long-polling entirely
  allowUpgrades: false,          // No polling-to-WS upgrade dance
  pingTimeout: 60000,            // 60s before considering client dead
  pingInterval: 25000,           // Ping every 25s
  maxHttpBufferSize: 1e5,        // 100KB max payload (prevents large payload attacks)
  perMessageDeflate: {
    threshold: 256,              // Compress messages > 256 bytes
    zlibDeflateOptions: { level: 1 }, // Fast compression (speed over ratio)
  },
});
```

**Why WebSocket-only?** Skipping the HTTP long-polling handshake saves 100-200ms on initial connection. For a real-time game, this startup latency matters.

### Socket.IO Client Configuration

```js
this.socket = io(serverUrl, {
  transports: ['websocket'],     // Match server: WebSocket-only
  upgrade: false,                // No upgrade negotiation
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
  forceNew: true,
});
```

### Ping Measurement

Client measures ping every 3 seconds:
```js
socketManager.emit('ping_check', Date.now());
// Server echoes it back immediately:
socket.on('ping_check', (timestamp) => socket.emit('pong_check', timestamp));
// Client calculates:
this._ping = Date.now() - start;
```

Ping is used for preview army timeout scaling: `Math.max(2000, ping * 4)`.

---

## 10. Anti-Cheat Design

### Server Validates Every Action

**send_soldiers:**
1. Game must be in `playing` state
2. Player must exist and not be eliminated
3. Target region must exist and not be a gate or rocky region
4. Target must be visible (fog check via `VisibilitySystem.getVisibleRegions()`)
5. Target must be within `attackRange` hops from source (BFS check via `_isWithinRange()`)
6. Each source region must be owned by the player
7. Source must have >= 2 HP (need at least 1 to split)

**use_ability (missile/nuclear/barracks/speedBoost/freeze):**
Each ability system validates:
- Player has charges > 0
- Cooldown has expired
- Target region exists and meets ability-specific requirements

**build_building:**
- Region must be owned by player
- Region must not already have a building
- Player must have sufficient resources (iron, crystal, uranium)
- Building count must not exceed `maxPerPlayer` limit

### Rate Limiting

```js
const RATE_LIMIT_MAX = 5;       // max events per second
const RATE_LIMIT_WINDOW = 1000; // 1 second window
```

Every socket event handler calls `isRateLimited(socket.id)` first. If a client sends more than 5 game actions per second, subsequent actions are silently dropped.

### Input Validation

All incoming data is validated for type and bounds:
```js
if (!data || typeof data !== 'object') return;
if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) return;
if (sourceIds.length > 12) return; // Max 12 source regions per send
if (!sourceIds.every(id => typeof id === 'string' && id.length < 50)) return;
```

### Fog as Security Boundary

The most important anti-cheat mechanism is that **fogged data is never sent**. A client with a modified game cannot see through fog because the server never transmits:
- Resource types for fogged regions
- Buildings for fogged regions
- Army creation events for invisible armies
- Army count changes for invisible armies
- Region HP for stealth towers (shown as `-1`)

---

## 11. Siege System Architecture

### Server-Side (SiegeSystem)

When an army arrives at an enemy region, instead of instant capture, a **siege** begins:
- Army count is added to `region.siegeForces[attackerId]`
- Multiple attackers can siege the same region simultaneously
- Siege deals `SIEGE_DAMAGE_PER_SECOND` (2.0) per second to the region
- Siege army suffers `SIEGE_ATTRITION_PER_SECOND` (0.3) attrition
- When region HP reaches 0, the strongest attacker captures it

### Client-Side (SiegeRenderer)

Visual representation uses a **pixel-based BFS flood fill** on an HTML5 Canvas:

1. Region polygon is rasterized into a grid (scale factor 0.5 = 2x resolution)
2. Each attacker gets a BFS starting from their entry points on the grid
3. BFS frontier expands proportionally to siege force ratio: `targetPixels = (force / grandTotal) * totalPixels`
4. If siege force decreases, BFS retreats (removes pixels from fill order)
5. Canvas is rendered to a Phaser texture and displayed as an image at the region position

**Performance controls:**
- `MAX_PIXELS_PER_FRAME`: 300 pixels total across all sieges
- Frame skip: every 6th frame (every 12th in auto low-perf mode)
- Per-siege pixel limit: `MAX_PIXELS_PER_FRAME / siegeCount`
- Gradient wave animation: `sin(t * 1.5 + (gx + gy) * 0.15)` for visual depth

---

## 12. Pathfinding Architecture

### Server-Side (PathfindingSystem)

When an army is created and the direct path to its target crosses a rocky region, `PathfindingSystem.computeWaypoints()` calculates avoidance waypoints:

**Algorithm: Visibility Graph + Dijkstra**
1. Quick check: if direct path is clear (no rocky intersection), return empty waypoints
2. Expand all rocky region polygons outward by `EXPAND_MARGIN` (18 pixels) to get candidate waypoint nodes
3. Filter: exclude vertices inside other rocky polygons
4. Build visibility graph: edges between all pairs of nodes (start, end, candidates) where the line segment doesn't intersect any rocky polygon
5. Dijkstra shortest path from start to end
6. Return intermediate waypoints (excluding start and end)

**Segment intersection**: `segmentIntersectsPolygon()` from math utilities

**Gate routing** (`MovementSystem.applyGateRouting()`): Before pathfinding, the system checks if routing through a gate pair is shorter. If so, it sets the gate entrance as an intermediate waypoint.

### Client-Side Waypoint Following

The client receives waypoints in `army_created` and follows them in `ArmyRenderer.updateAll()`:
```
moveTarget = waypoints[waypointIndex]
-> move toward moveTarget
-> when reached (distance < 1px), increment waypointIndex
-> load next waypoint
-> when all waypoints exhausted, army is at final target
-> hide sprite, set _arrived = true
```

---

## 13. Known Architectural Issues & Technical Debt

### Visibility Calculation Cost
`VisibilitySystem.getVisibleRegions()` is called multiple times per tick per player: once in `broadcastState()` for filtering, once for army count filtering, potentially once for army creation fog checks. With 4 players and 200 regions, this is ~12 BFS traversals per tick. While BFS is O(V+E) and fast, caching the result per player per tick would be an easy optimization.

### Client Fog Depth Mismatch
The client's `updateFogOfWar()` uses a hardcoded depth of 1, while the server uses a configurable depth (default 2). This means the client's visual fog can differ from the server's actual visibility calculation. The server's filtering ensures no data leaks, but the client may show regions as fogged that the server considers visible.

### Point-in-Polygon for Every Region on Click
`MapRenderer.getRegionAtPoint()` iterates all regions and performs `pointInPolygon()` for each. With 200+ regions, this is 200 polygon containment tests per click/hover. A spatial index (quadtree) would make this O(log n) instead of O(n).

### GameRoom Responsibilities
`GameRoom` handles room lifecycle, player management, action processing, broadcasting, bot AI scheduling, and ranked ELO updates. This class is over 1400 lines and violates SRP. Extracting action handlers (onSendSoldiers, onUseMissile, etc.) into separate command objects would improve maintainability.

### Inline Requires
Several `GameRoom` methods use `require()` inline:
```js
const MissileSystem = require('./BombSystem');
const { getGameSettings } = require('../admin/adminRoutes');
```
This is done to avoid circular dependencies but makes dependency tracking harder.

### No State Snapshots for Reconnection
If a player disconnects and reconnects, they lose all client state (armies, fog state, preview armies). The server could send a full state snapshot on reconnect, but this is not implemented. The player's regions remain (server-side), but they must rely on the next `state_update` to rebuild their view.

### Trail Particle GC
While trail particles use pooling, the `_trailParticles` array uses `splice(i, 1)` for removal, which is O(n) for each removal. With 50 active particles and frequent removal, this creates unnecessary array copying. A swap-and-pop removal pattern would be O(1).

### SiegeRenderer Canvas Memory
Each active siege creates an HTML5 Canvas element and a Phaser texture. With multiple simultaneous sieges, this can consume significant GPU memory. The canvas size is proportional to region area at 2x resolution (scale 0.5), which for large regions can be substantial.

### Production Accumulator Floating Point
The `_productionAccumulator` uses floating point arithmetic with an epsilon guard (`+ 1e-9`), but over long games, accumulated floating point error could cause minor production rate drift. An integer-based accumulator (counting microsoldiers) would be more precise.

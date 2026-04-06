# KUST 10 - Pillows: Development History & Lessons Learned

**Last Updated**: 2026-04-06
**Purpose**: Complete institutional knowledge capture for rebuild/handover
**Scope**: Every major decision, failure, success, and lesson from the project's entire development lifecycle

---

## Table of Contents

1. [Map System Evolution](#1-map-system-evolution)
2. [Rendering & Performance Journey](#2-rendering--performance-journey)
3. [Combat System Evolution](#3-combat-system-evolution)
4. [UI/UX Iterations](#4-uiux-iterations)
5. [Networking & Sync Problems](#5-networking--sync-problems)
6. [Feature Additions & Their Impact](#6-feature-additions--their-impact)
7. [Bug Fix Chronicles](#7-bug-fix-chronicles)
8. [Failed Approaches](#8-failed-approaches-critical-section)
9. [Successful Patterns](#9-successful-patterns-critical-section)
10. [Deployment Lessons](#10-deployment-lessons)
11. [Architecture Decisions & Trade-offs](#11-architecture-decisions--trade-offs)
12. [Recommendations for Rebuild](#12-recommendations-for-rebuild)

---

## 1. Map System Evolution

### 1.1 Phase 1: Grid-Based Maps (v0.1 - v0.5, March 11)

**What**: The initial MVP used a simple grid-based map generator with jitter (random displacement) to create irregular-looking regions from a regular grid.

**Why**: Fastest possible approach for MVP. No external dependencies needed.

**Result**: Worked for prototype but maps looked artificial and repetitive. No geographic identity.

**Lesson**: Grid maps are good for prototyping but lack the visual appeal and strategic depth needed for a compelling RTS game.

### 1.2 Phase 2: GeoJSON Real-World Maps (v0.5+, March 11-12)

**What**: Added `generateMapFromGeoJSON()` to MapGenerator that loads real geographic data (Turkey 81 provinces, USA 50 states, World 177 countries). Used Mercator projection, Ramer-Douglas-Peucker polygon simplification, and automatic neighbor detection.

**Why**: The game's core identity is fighting over real-world territory. GeoJSON gives each map a distinctive, recognizable feel.

**Result**: Massive improvement in game appeal. Players immediately recognized Turkey, USA, etc. This became the permanent map system.

**Lesson**: Real geographic data provided enormous value relative to implementation effort. The Mercator projection bug (Y-axis in radians vs degrees causing 138x compression, making maps appear as a thin horizontal line) was the first major bug -- always verify coordinate unit consistency in map projections.

**Critical Bug Found**: Mercator Y unit mismatch. `mercatorY()` returned radians while longitude was in degrees. Fixed with `(180/PI)` multiplier.

### 1.3 Phase 3: Map Explosion (March 12-21)

**What**: Rapidly added many maps: Turkey, USA, World, Europe, Middle East, South America, Africa, Istanbul, Dubai, London, Barcelona, Spain, France, Poland, UAE, Russia, Portugal, Brazil.

**When**: March 12-21 (roughly 10 days)

**Why**: Each new map was seen as adding variety and replay value.

**Result**: Too many maps, most with quality issues. Some maps had problematic region counts (Dubai had 195 sectors, Barcelona had 73 tiny neighborhoods). Multiple maps were later removed.

**Lesson**: More maps is not always better. Each map needs careful playtesting for region count, size balance, neighbor detection quality, and strategic depth. Quality over quantity.

### 1.4 The South Atlantic Saga (April 5 -- CRITICAL FAILURE)

**What**: An ambitious attempt to create a massive South Atlantic map (4000x2800px, 248 regions, 8 players). This involved:
1. Creating the map with all of Africa + South America
2. Implementing frustum culling for large maps
3. Adding MapRenderer optimizations (outset, gap filling, vertex snapping)
4. Multiple rewrites trying to fix polygon gaps

**When**: April 5 (a single intense day of work)

**Why**: Desire for a "flagship" large-scale map to differentiate the game.

**Result**: COMPLETE DISASTER. The sequence was:
1. `e2b00bf` - South Atlantic map created (4000x2800, 248 regions)
2. `e326bdc` - Frontend render optimization: frustum culling, spatial grid (broke rendering)
3. `d4ee542` - QA connectivity fix + spawn neighbor fix
4. `63422ce` - CHANGELOG v0.12.0 released (premature)
5. `6fac845` - **SDD-002 EMERGENCY**: South Atlantic revert & fix spec written because ALL MAPS BROKE
6. `5f4463e` - **REVERT**: MapGenerator reverted to working state
7. `a4bd77f` - **REVERT**: MapRenderer reverted to working state
8. `551b133` - CHANGELOG v0.12.1: Documented the revert

The outset/gap filling commits (increasing outset to 5-7px, vertex snapping, edge normal outset) caused regions to overlap and visual corruption across ALL maps, not just South Atlantic. The entire MapRenderer and MapGenerator had to be reverted to the previous day's working state.

**Lesson**: 
- NEVER make large-scale rendering changes alongside new content
- Always test changes on ALL maps, not just the new one
- Polygon manipulation (outset, vertex snapping, gap filling) is extremely fragile -- small changes cascade into visual disasters
- The 1.5px simple outset that was already working should not have been touched
- Large maps (4000x2800) introduce a completely different performance profile -- they need separate optimization strategies, not modifications to the core renderer

### 1.5 Map Removals

**Istanbul, South Europe, South Atlantic** -- all removed:
- Istanbul (39 districts): Too many tiny regions for gameplay
- South Europe: Created ad hoc, quality issues with region detection thresholds (had to increase from 0.15 to 0.45)
- South Atlantic: See saga above -- caused all-maps breakage

**Europe, World** -- removed in favor of smaller, focused maps:
- Europe (39 countries) and World (167 countries) replaced by Poland, UAE, Russia because focused regional maps played better than continental/global ones

**Russia, Middle East, UAE** -- later removed:
- Russia: Chukotka date line polygon issues (had to shift negative longitudes by +360). Aggressive simplification (313K to 3.6K points)
- Middle East and UAE: Too few regions for interesting gameplay (7 and 17 respectively)

**Lesson**: The ideal map has 30-100 regions, recognizable geography, balanced region sizes, and good neighbor connectivity. Maps outside this range (too few or too many regions) produce poor gameplay.

### 1.6 Final State: Turkey Voronoi Hybrid (April 5-6)

**What**: The Turkey map evolved through multiple phases:
- Phase 1: 18 crude geographic regions (Marmara, Ege, etc.)
- Phase 2: 81 real provinces from GeoJSON
- Phase 3: Discussion of Voronoi hybrid (splitting large provinces into 2-3 sub-regions) for 100-150 total regions
- Phase 4: Current state with 81 provinces + region merging for small provinces

**Result**: Turkey with 81 provinces + special region type distribution works well. The SDD-005 Voronoi spec was written but the Voronoi hybrid was not fully implemented.

**Working Map Configuration**:
- Server-side GeoJSON clipping
- Multi-boundary polygon support
- No Chaikin smoothing (caused issues)
- 3px outset for gap prevention (1.5px was standard, but Turkey needed more)
- 8px neighbor threshold (reduced from original 40px to eliminate false neighbors)

**Key Constants**: `neighborThreshold = 8px`, `attackRange = 1`, `fogDepth = 2`

### 1.7 Map System Lessons Summary

| Approach | Outcome | Keep? |
|----------|---------|-------|
| Grid-based procedural | Works for random maps | Yes (as "Random" option) |
| GeoJSON provinces | Excellent for real-world maps | Yes (core approach) |
| Large maps (4000x2800) | Performance and rendering nightmares | No |
| Many small-region maps | Poor gameplay | No |
| Polygon outset > 3px | Causes overlaps | Never |
| Vertex snapping/gap filling | Broke all maps | Never |
| Dynamic map list from config/maps.js | Excellent DX | Yes |

---

## 2. Rendering & Performance Journey

### 2.1 DOM-Based Fog (DOMFogManager.js) -- TRIED AND ABANDONED

**What**: Created a DOM-based CSS fog system overlaid on the Phaser canvas. Each fogged region got a `.kust-fogwrapper` div with `clip-path: polygon()`, CSS fog texture animations (`background-image: url(fog1.png/fog2.png)`), drift and breath keyframe animations.

**When**: March 18 (initial DOM blur version) through April (PNG texture + clip-path version)

**Why**: CSS animations are GPU-accelerated and run on the compositor thread, theoretically leaving the main thread free for game logic.

**Result**: Performance DISASTER on lower-end machines:
- 60-100 parallel CSS animations for 15-25 fogged regions
- Each `clip-path: polygon()` created a separate GPU compositing layer
- `syncCamera()` called every frame updated DOM `style.transform`
- On Windows machines with integrated GPUs, this killed FPS
- Performance audit estimated -10-15% FPS impact from DOMFogManager alone

**Current State**: DOMFogManager.js still exists in codebase but its impact is significant. The Phaser polygon overlay (dark overlay at depth 18) does the actual fog hiding; the DOM fog adds visual polish at a performance cost.

**Lesson**: DOM overlays synchronized with a canvas game engine create inherent performance tension. The `syncCamera` every frame, the clip-path complexity, and the sheer number of animated elements make this approach unsuitable for a game with 50+ regions. In a rebuild, fog should be implemented entirely within the game renderer (Phaser/WebGL shaders) rather than as a DOM overlay.

### 2.2 Frustum Culling: The Problem and Solution

**What**: With 200+ region maps, rendering everything every frame was wasteful. Frustum culling was implemented to only render regions visible in the camera viewport.

**When**: First attempt: April 5 (as part of South Atlantic -- broke everything). Successful implementation: April 5 after revert.

**Why**: 200+ regions each with multiple graphics objects (polygon, border, glow, text, decorations, fog overlay) created thousands of draw calls.

**Failed Approach** (commit `e326bdc`):
- Spatial grid indexing
- Complex viewport intersection tests
- Bundled with other optimizations (outset changes, gap filling)
- Broke all rendering

**Successful Approach** (commit `a4bd77f` after revert):
- Simple AABB (axis-aligned bounding box) per region, computed once
- Each frame: compare viewport AABB with region AABBs
- 100px padding to prevent pop-in at edges
- Only toggles `setVisible()` on existing objects -- no creation/destruction
- Added to `MapRenderer.update()` called from `GameScene.update()`

**Lesson**: Frustum culling should be a SEPARATE, ISOLATED change. Never bundle it with other rendering changes. The simple AABB approach works perfectly for a 2D game with non-rotating regions.

### 2.3 MapRenderer Rewrites and Reverts

The MapRenderer went through multiple reverts:

1. **Revert 1** (`a4bd77f`, April 5): Reverted to April 4 working state after outset/gap/frustum changes broke rendering. Then frustum culling added cleanly on top.
2. **Revert 2** (`5f4463e`, April 5): MapGenerator also reverted after South Atlantic map corrupted the generator.

**Root Problem**: Each "improvement" was tested only on the new map, not on all existing maps. Changes that worked for one map's polygon structure broke others.

**Lesson**: The MapRenderer is the most fragile file in the codebase (1706 lines, 10+ responsibilities, God Object per SOLID audit). Any change must be tested on ALL maps. Consider breaking it into sub-renderers in a rebuild.

### 2.4 Owner Glow Optimization

**What**: Each player-owned region had a pulsing glow effect with animated stripe patterns.

**Problem** (identified in performance audit, April 3):
- Each owned region: 1 Phaser tween + 1 geometry mask + 1 graphics object
- Every 3rd frame: `clear()` + 8x `fillRect()` + 8x `_lerpColor()` per region
- With 30-40 owned regions mid-game: 240 fillRect calls every 3rd frame
- Estimated -15-25% FPS impact on Windows

**Attempted Solutions**:
- Frame skip increased from every 3rd to every 6th frame
- Stripe count reduced from 8 to 4
- Eventually replaced with simpler wave gradient animation (`fa282fe`, `c3102bd`)
- Multiple gradient versions tried (v1, v2, v3), each with visual issues

**Current State**: Gradient animation exists but `kust_low_perf` localStorage flag disables it for low-end devices. A settings panel toggle (Glow: ON/OFF) was added.

**Lesson**: Per-region per-frame visual effects scale terribly. In a rebuild, use a single WebGL shader for all region highlights rather than per-region Graphics objects with individual tweens.

### 2.5 Text Flicker Bug: 3 Competing Visibility Systems

**What**: At full zoom, region text (HP, badge, resource icon) would flicker -- appearing and disappearing rapidly.

**When**: April 6

**Root Cause**: THREE independent systems were fighting over text visibility:
1. `MapRenderer.update()` -- Every frame, AABB frustum culling (only hides, never shows)
2. `updateViewportCulling()` -- Every 6 frames, center-point test (shows AND hides)
3. `GameScene.update()` zoom loop -- When zoom changes, sets ALL texts visible

The center-point test and AABB test gave different results: a region whose edge was in viewport but center was outside would be hidden by center-point test but shown by AABB test, creating a 6-frame flicker cycle.

**Fix**:
- `GameScene.update()` zoom loop: Now only calls `setScale()`, NEVER `setVisible()`
- `updateViewportCulling()`: Changed from center-point to AABB bounds (consistent with frustum culling)
- Margin increased from 100px to 200px
- Zoom < 0.3 control moved to viewport culling

**Lesson**: NEVER have multiple independent systems controlling the same property (visibility). Establish a single source of truth for visibility and have all systems go through it.

### 2.6 Client-Side Prediction

**What**: Army positions were originally updated only when server state arrived (every 100ms at 10 TPS). Between ticks, armies appeared to stutter.

**When**: April 3 (v2 -- complete rewrite)

**Previous System**: Server sent army positions, client lerped toward them. 100ms gaps between updates caused visible stuttering.

**New System**:
- **Client-Side Prediction**: Client moves armies every frame toward their `moveTarget` at `speed` px/s. Does not wait for server.
- **Server Reconciliation**: When server position arrives, client computes drift:
  - drift <= 2px: No correction needed
  - drift 2-50px: Smooth correction (exponential decay, `1 - exp(-8 * deltaSec)`)
  - drift > 50px: Snap to server position
  - drift > 150px: Teleport (snap + 500ms lock)
- **Server Delta Speed**: `serializeDelta()` now includes `speed` field so client knows exact army speed (including speed boost, snow, speed region effects)

**Result**: Night and day improvement in visual smoothness. Armies now move at 60fps regardless of server tick rate.

**Lesson**: For any entity that moves continuously, client-side prediction with server reconciliation is essential. The reconciliation thresholds (2px/50px/150px) were tuned through playtesting. The exponential decay correction (`1 - exp(-8 * deltaSec)`) provides smooth convergence without visible snapping.

### 2.7 Object Pooling

**What**: Army graphics and text objects were being created and destroyed constantly as armies spawned and arrived.

**Why**: Each `scene.add.graphics()` and `scene.add.text()` allocates memory and creates a new render object. In a game with 20+ armies constantly being created/destroyed, this caused GC pauses and performance degradation.

**Solution**: `_graphicsPool` and `_textPool` (max 50 each) in ArmyRenderer. When an army is removed, its graphics/text are returned to the pool instead of destroyed. When a new army needs graphics, the pool is checked first.

**Result**: Eliminated creation/destruction churn. Noticeable improvement in smoothness during heavy combat.

**Lesson**: Object pooling is essential for any frequently-created-and-destroyed game objects. 50-element pools were sufficient for this game's scale.

### 2.8 Viewport Culling for Armies

**What**: Army graphics outside the camera viewport were still being rendered.

**Fix**: In `ArmyRenderer.updateAll()`, calculate camera viewport + 80px margin. Armies outside this area get `setVisible(false)`. Position updates (prediction) continue even for hidden armies so they are in the right place when they scroll into view.

**Bug Found**: Fogged armies that entered the viewport would briefly flash before being hidden. Fixed with `_fogHidden` flag that keeps fog-hidden armies invisible even when they enter the viewport.

**Lesson**: Viewport culling + fog visibility are two independent concerns. They must not interfere with each other. Use separate flags.

---

## 3. Combat System Evolution

### 3.1 Original System: Instant Resolution (v0.1-v0.10)

**What**: Army arrives at target region -> HP instantly reduced -> army destroyed. Simple subtraction: `region.hp -= army.count`. If HP drops to 0, region changes ownership.

**Result**: Worked but felt "flat." No tension, no opportunity to react, no "battle" feeling. As described in the brainstorm doc: "The fight has no middle. Army either arrives or doesn't."

### 3.2 Combat Power Variation (March 21)

**What**: Added +/-20% random variation to combat power. 30 soldiers attacking might deal 24-36 effective damage.

**Why**: Pure deterministic combat made outcomes 100% predictable. You could never take a 31 HP region with 30 soldiers.

**Implementation**: `COMBAT_POWER_VARIATION: 0.2` constant. `getCombatPower(count)` function in ConquestSystem. Only applied to attacks, not reinforcements.

**Result**: Small but meaningful improvement. Added uncertainty to close battles.

### 3.3 Siege System: Tug of War (April 4)

**What**: Complete combat overhaul. Instead of instant resolution:
1. Army arrives at enemy region -> siege begins
2. Siege army stays on map, visible near the region
3. Each second: siege army deals 2 HP damage to region
4. Siege army suffers attrition: 0.3 soldiers/second lost
5. Defender can send reinforcement to break the siege
6. If region HP reaches 0: region captured, remaining siege force becomes HP
7. Max 3 siege armies per region (multi-attacker support)
8. **Neutral regions**: Still use instant capture (keeps early game fast)

**Why**: Inspired by OpenFront.io's "halat cekme" (tug of war) feeling at borders. The brainstorm doc explored 4 options and recommended the hybrid model.

**Visual**: Region border pulses rapidly during siege. Attacker's color glow on border. Siege army visible at region edge.

**Siege Renderer Evolution** (went through 5+ visual versions):
- v1: Simple color overlay
- v2: Virus-like spreading color effect
- v3: Organic blob spread with edge glow
- v4: OpenFront-style pixel-based BFS spread (current)
- Each version had performance issues with `putImageData` + `tex.refresh()` every 2 frames

**Result**: Dramatically improved combat feel. "Takviye gondereyim mi?" (Should I send reinforcement?) became a real strategic decision.

**Constants**:
- `SIEGE_DAMAGE_PER_SECOND`: 2.0
- `SIEGE_ATTRITION_PER_SECOND`: 0.3
- `SIEGE_MAX_ARMIES_PER_REGION`: 3
- `SIEGE_POSITION_OFFSET`: 30px

### 3.4 Attack Range (April 4-5)

**What**: Added `attackRange = 1` limiting attacks to only directly adjacent regions.

**Before**: Free targeting -- could attack any visible region from any owned region.

**Problem Found**: Even with attackRange=1 on server, client had no range checking. Client was selecting "nearest 3 regions by pixel distance" as sources, and some of those could be 2-3 hops away. Server would reject them, but pixel-close regions that happened to be neighbors could still attack from far away visually.

**Fix**: Added BFS `_isWithinRange` method to both client (`SelectionSystem.js`) and server. Client now pre-filters source regions before sending. `attackRange` sent from server via `gameConfig`.

### 3.5 Army Attrition (March 21)

**What**: Moving armies lose 1 soldier per second. When count reaches 0, army displays skull icon and is destroyed.

**Why**: Prevented infinite-range "sniping" -- sending 1 soldier across the entire map for reconnaissance. Forces players to fight locally.

### 3.6 Collision System

**What**: When two enemy armies meet on the map, they collide. Larger army wins, remaining count = difference. If 10 vs 7, winner continues with 3.

**No significant changes since MVP**: This system worked well from the start. Simple subtraction model.

---

## 4. UI/UX Iterations

### 4.1 Auth Screen: Phaser to React Migration

**Phase 1** (March 11): Phaser-based AuthScene with DOM input elements. Basic login/register/guest tabs.

**Phase 2** (March 15): Made responsive with 3-tier breakpoints (mobile/tablet/desktop) and `pick()` utility function.

**Phase 3** (March 16): **Complete rewrite to React**. Professional strategy-game themed login screen with:
- BattleCanvas.js animated background (hex grid, faction territories, army movements, explosions)
- Gold/dark color scheme (Cinzel/Inter fonts)
- Ornamental corner CSS decorations
- Code-split: React only loads when auth is needed, Phaser loads after successful login
- Responsive: Desktop (panel right), Tablet (panel center), Mobile portrait (full width), Mobile landscape (compact panel right)

**Lesson**: Phaser DOM elements for forms are painful. React is the right tool for forms and menus. The code-splitting approach (React for auth, then dynamic-import Phaser) works well.

### 4.2 Menu System: Dual Phaser+React Architecture

**The Problem**: The game ended up with TWO menu systems running simultaneously:
- `client/src/scenes/MenuScene.js` (Phaser scene) -- original menu
- `client/src/menu/MenuApp.jsx` (React component) -- replacement menu

**Timeline**:
1. Phaser MenuScene created (March 11) -- simple text buttons
2. FriendsScene added as Phaser scene (March 12)
3. React MenuApp.jsx created (March 16) -- LoL-themed tabs with Play/Friends/Profile
4. Both systems kept in codebase, with `config/maps.js` as single source of truth for map list

**Current Flow**: `Auth (React) -> Menu (React) -> Game Start -> Phaser (Boot -> Game -> GameOver) -> Menu (React)`

**Lesson**: Migrating incrementally from Phaser menus to React menus is messy. In a rebuild, commit to React for ALL non-gameplay UI from day one. The `GameBridge.js` event bus pattern for React-Phaser communication works well and should be kept.

### 4.3 HUD: From Phaser UIOverlay to React GameHUD

**What**: The in-game HUD was originally built entirely in Phaser (UIOverlay.js, StatsPanel.js, ToastManager). This was replaced with React (GameHUD.jsx) overlaid on the Phaser canvas.

**When**: March 16

**Architecture**: 
- `#game-ui-root` div positioned absolute over Phaser canvas (z-index 10)
- `pointer-events: none` on root, `pointer-events: auto` on interactive elements
- `GameBridge.js` singleton event bus connects Phaser -> React (game data) and React -> Phaser (user actions)
- AbilityBar stays in Phaser (needs game world input for target selection)

**Lesson**: React HUD over Phaser canvas is an excellent pattern. The `pointer-events: none` with selective `auto` enables click-through to the game canvas. GameBridge event bus is clean and decoupled.

### 4.4 Mobile Responsive Overhaul

**The Core Problem**: Game was built desktop-first. Mobile had multiple issues:
- `touch-action: none` missing everywhere -- browser default gestures intercepted Phaser touch events
- `100vh` CSS didn't account for mobile browser address bar
- No resize handlers -- rotating phone didn't re-layout
- `width < 768px` breakpoint missed landscape phones (width 700-900px but height only 375px)

**Solution**: Comprehensive mobile overhaul:
1. `touch-action: none` added to `#game`, canvas, `#game-ui-root`, `.ghud`
2. `100dvh` (dynamic viewport height) CSS
3. Resize handlers on all UI scenes (restart scene on resize)
4. Compact mode: `isCompactHeight(H)` for H < 500px (landscape phone)
5. `pick(mobile, tablet, desktop)` utility for 3-tier responsive values
6. `getSafeAreaInsets()` for notch/camera cutout handling
7. Touch thresholds increased: 15px -> 30px for `pointer.getDistance()`
8. SelectionSystem: `_pendingSourceRegionId` pattern to distinguish tap from drag on touch

**Lesson**: Mobile support is not a bolt-on. It needs architectural consideration from day one. The `pick()` utility pattern and compact mode detection should be part of the core framework.

### 4.5 3-Tier Responsive System

Every UI scene adopted the pattern:
```
const p = (mobile, tablet, desktop) => pick(W, mobile, tablet, desktop);
const compact = isCompactHeight(H);
```

Breakpoints: Mobile < 768px, Tablet 768-1199px, Desktop >= 1200px

Compact mode (H < 500px) forces mobile-tier values regardless of width.

### 4.6 Lobby Redesign

**What**: LobbyScene went from simple waiting text to full overlay system with matchmaking states:
- "Connecting..." -> "Searching for opponent..." -> "Match found!" -> Countdown
- Player list display
- Cancel button
- Queue position display

### 4.7 Game Over Screen

**Evolution**: Basic text -> Stats card with battle statistics -> Diamond reward badge -> ELO change display (ranked) -> Confetti particles for victory -> Dark/gold theme matching KUST brand

### 4.8 Tutorial System

**What**: 6-stage interactive tutorial entirely client-side (no server needed):
1. Send Troops (drag mechanic)
2. Production & Towers
3. Mountain Regions
4. Snow Regions
5. Abilities (Q, W, E, R, T)
6. Bot Battle

Each stage has pulsing highlight effects, restricted targeting, and completion detection.

**Key Technical Decision**: Tutorial uses `onSendSoldiers` callback in SelectionSystem instead of socket emit. If callback exists, it's called instead of emitting to server. This elegantly enables offline tutorial without modifying the selection system's core logic.

---

## 5. Networking & Sync Problems

### 5.1 Delta State Evolution

**Phase 1** (March 11, MVP): Full state sent every tick. Every region, every army, every player -- 100% of game state 10 times per second.

**Phase 2** (March 16): Delta compression introduced:
- **Region dirty tracking**: `isDirty()`, `markClean()`, `serializeDelta()`. Only sends `{id, hp, ownerId}` instead of full region data (~34 bytes vs ~400 bytes).
- **Army position threshold**: Only armies that moved 2+ pixels broadcast. `_lastSentArmyState` Map tracks last sent positions.
- **Player data throttle**: Player info (charges, cooldowns) sent every 5th tick (500ms) instead of every tick.
- **Army velocity**: `serializeDelta()` includes `vx, vy` for client extrapolation.

**Phase 3** (March 16+): Per-player fog filtering:
- Server computes each player's visible regions via BFS
- Army data filtered: only armies in visible regions sent to each player
- Region data: initially sent to all (fog filtering was client-side only), later `regions_reveal` event made per-player with fogged regions getting `resourceType=null, building=null`

**Result**: ~40-60% bandwidth reduction from delta compression. Per-player filtering added anti-cheat protection.

**CRITICAL BUG** during delta implementation: When server started sending only changed armies (delta), client was deleting all non-received armies assuming they were destroyed. Fix: Army deletion ONLY via `ARMY_DESTROYED` event. Non-received army = unchanged, NOT destroyed.

### 5.2 Fog of War Security: Resource Type Leak

**What** (April 6): `regions_reveal` event was sending ALL regions' `resourceType`, `resourceRate`, and `building` data to ALL players. A player inspecting WebSocket traffic could see resources in fogged regions.

**Fix**: Per-player fog filtering in `GameRoom.js`. `regions_reveal` now sent individually per player. Fogged regions have `resourceType`, `resourceRate`, and `building` set to `null`.

**Additional**: `_playerVisibility` tracking added to detect when new regions become visible, sending `revealedRegions` in STATE_UPDATE payload so client can show newly-revealed resources.

**Lesson**: Every piece of data sent to the client is a potential information leak. In a multiplayer game with fog of war, ALL data must be filtered per-player on the server side.

### 5.3 Army Visibility Through Fog

**What** (March 11): Enemy armies moving through fogged regions were visible to the player.

**Fix**: `ArmyRenderer.setFogReferences(mapRenderer, myPlayerId)` + `updateFogVisibility()`. Each STATE_UPDATE and REGION_CAPTURED triggers fog visibility check. Enemy armies in fogged regions are hidden. When transitioning from hidden to visible, position snaps to prevent lerp jumps.

### 5.4 State Update Optimization History

| Optimization | When | Impact |
|-------------|------|--------|
| Full state every tick | March 11 | Baseline |
| Region dirty tracking | March 16 | -60% region data |
| Army position threshold | March 16 | -40% army data |
| Player data throttle (5 ticks) | March 16 | -80% player data |
| Per-player fog filtering | March 16+ | -30% per-player + anti-cheat |
| perMessageDeflate (zlib level 1, threshold 256) | March 16 | -20% on large payloads |
| Region fog-based resource filtering | April 6 | Security fix + minor bandwidth |

---

## 6. Feature Additions & Their Impact

### 6.1 Gate/Teleport System

**When**: March 11 (Phase 2)

**Implementation Challenges**:
1. **Infinite teleport loop**: Sending soldiers TO a gate region caused them to teleport back and forth forever. Fix: reject `send_soldiers` where `targetId` matches a gate's `regionId`. Client-side `gateRegionIds` Set prevents targeting gates.
2. **Accidental teleportation**: Armies passing near a gate (within 15px) on their way to a different target would get teleported. Fix: `army._exitGateId` flag -- only armies specifically routed through gates (by `MovementSystem.applyGateRouting()`) can teleport.
3. **Fog of war integration**: Gate connections needed to count as 1-hop neighbors for fog calculation. Added "virtual neighbors" in MapRenderer BFS.
4. **Teleport visual glitch**: Flash graphics drawn at world coordinates then scaled caused position shift. Fix: draw at local (0,0) coordinates, position via `graphics.x/y`.
5. **Gate placement**: Maps with 20+ regions get 2 pairs, smaller maps get 1. Min euclidean distance 200px + 4 hop distance. 3 attempts before giving up (not every map needs gates).

**Lesson**: Teleportation systems interact with almost every other system (pathfinding, fog, targeting, collision, rendering). Each interaction needs explicit handling.

### 6.2 Building System (April 3+)

**When**: v0.12.0, April 3

**What**: 7 building types -- City Center, Barracks, Wall, Iron Dome, Stealth Tower, Drone Facility, Missile Base. Each with different costs in Iron/Crystal/Uranium. Per-building cost system with level multiplier (each additional building costs 50% more).

**Impact**: Added resource spending purpose. Previously resources just accumulated with no use.

### 6.3 Ability System Evolution

**Phase 1** (March 11): 3 abilities -- Bomb (Q), Fireball (W), Freeze (E). Each player started with 1 charge of each. Fixed damage values.

**Phase 2** (March 18): Complete rewrite to 4 abilities -- Missile (Q), Nuclear (W), Barracks (E), Speed Boost (R). Abilities no longer given at start; earned by capturing regions (1 random ability per first-time capture). AbilityBar rewritten from circular to rectangular LoL-style slots.

**Phase 3** (March 20): 5th ability added -- Freeze (T). Freezes ALL enemy armies for 1.5 seconds. Self-cast (no target needed). 30s cooldown.

**Phase 4** (March 20): Starting ability -- each player (including bots) gets 1 random ability charge at game start.

**Key Bug**: Icon movement bug -- pressing E caused ability icon to shift downward. Root cause: `scaleX/scaleY` tween on Graphics object scaling from (0,0) origin. Fix: replaced scale tween with alpha flash animation. Region selection conflict: ability targeting mode was intercepted by SelectionSystem. Fix: guard check `if (abilityBar.activeMode) return;` in SelectionSystem.

### 6.4 Resource System (April 3)

**What**: 3 resource types (Iron, Crystal, Uranium) with per-region production. Each region (except ROCKY and GATE) randomly assigned one resource type with 0.8-1.2 production rate.

**Server-authoritative**: Resources tracked entirely on server (`Player.resources`). Client only displays server-sent values.

### 6.5 Skin/Store System (March 17)

**What**: Diamond currency economy + cosmetic store with 4 categories:
- Skins (player color override): Black, White (1000 diamonds each)
- Army Shapes: Circle, Diamond, Star, Shield, Hexagon (150-1000 diamonds)
- Trail Effects: Sparkle, Fire, Ice, Rainbow (300-2000 diamonds)
- Capture Effects: Sparkle, Shockwave, Flames, Lightning (400-2500 diamonds)

4 rarity tiers with color coding. PostgreSQL persistence for purchases.

### 6.6 Ranked System (March 11)

**What**: ELO-based with K-factor 32, starting rating 1000. 5 leagues: Bronze (0-799), Silver (800-999), Gold (1000-1199), Diamond (1200-1399), Master (1400+). Rating-based matchmaking (+/- 200 range, expanding every 15s after 30s wait).

**In-memory only**: Rankings reset on server restart. PostgreSQL persistence was added for other data but ranked data remained in-memory.

### 6.7 Friends System (March 12)

**What**: 6-digit player codes (charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` -- I/O/0/1 removed to prevent confusion). Add friends by code, accept/reject requests. In-memory only.

### 6.8 Daily Rewards (March 21)

**What**: 30-day cycle, Day N gives 10+(N-1) diamonds. Streak resets if a day is missed. PostgreSQL persistent.

### 6.9 Sound Effects (March 11)

**What**: All sounds generated via Web Audio API -- no audio files:
- `playBubble()`: Army send (600Hz->200Hz sine, 0.15s)
- `playCaptureSound()`: Region capture (400Hz->800Hz->300Hz, 0.25s)
- `playTeleportSound()`: Gate teleport (3-layer electric zap)
- `playWinSound()`: Victory (C5-E5-G5-C6 arpeggio)
- `playBombSound()`: Ability explosion (deep boom)

**Lesson**: Web Audio API synthesis works well for prototype but sounds are "electronic." Real audio assets would significantly improve game feel.

### 6.10 i18n: 12 Languages

**What**: Full localization system with `t(key, params)` function and `useTranslation()` React hook. 180+ translation keys. Languages: English, Turkish, German, French, Spanish, Italian, Portuguese, Russian, Arabic, Chinese, Japanese, Korean.

**Architecture**: Synchronous (all languages bundled), flat key structure (`'auth.login'`), localStorage persistence (`kust_language`), listener pattern for React re-renders.

**Lesson**: Adding i18n is relatively low effort if done with the right pattern from the start. The `t()` function + React hook + Phaser direct import approach works cleanly across both frameworks.

---

## 7. Bug Fix Chronicles

### 7.1 Spawn Selection Bugs (The Trilogy)

**Bug 1: HP 40 Staying** (April 3-6)

When player selected a spawn region, it got HP 40. When they switched to a different region, the OLD region's "40" text persisted.

Root causes (found in stages):
1. `MapRenderer.updateRegion()` had `region` variable referenced outside its block scope (`const` is block-scoped in JS). `ReferenceError` crashed the function silently.
2. After fixing scope: `updateRegion(prevId, origHp, null)` was called with non-zero origHp. `updateViewportCulling()` running every 6 frames would see `data.hp > 0` and re-show the text.
3. Final fix: Send `updateRegion(prevId, 0, null)` to renderer (HP=0 means culling won't re-show), while keeping `prevRegion.hp` with original value for restoration after spawn phase.

**Bug 2: Color Not Reverting** (April 6)

When switching spawn selection, old region stayed in player's color. Root cause: Latency -- server revert was slow, and client-side type restore was missing. Fix: Immediate client-side revert on click (don't wait for server), plus full type/property restore.

**Bug 3: Game Not Starting** (April 3)

`endSpawnSelection()` was never called because `handleSpawnPhaseEnd` crashed in its for-loop due to the `updateRegion()` ReferenceError from Bug 1.

**Lesson**: The spawn selection bugs formed a cascade. One scoping error in MapRenderer caused three visible bugs. This is a textbook example of why God Objects are dangerous -- a single bug in a 1706-line file has unpredictable ripple effects.

### 7.2 Fog of War Bug: Resource Icons Showing

**When**: April 6

**What**: Resource icons (Iron/Crystal/Uranium) were visible in fogged regions.

**Root Cause**: `_drawRegion()` created resourceText but didn't check fog state. `updateRegion()` didn't hide resourceText for fogged regions. Even though `_applyFog()` had `setVisible(false)` for resourceText, the other code paths bypassed it.

**Fix**: Added fog checks in both `_drawRegion()` and `updateRegion()` for resourceText visibility.

### 7.3 Camera Bugs

**Wrong region focus after spawn**: `_pendingSpawnRegionId` was set to null BEFORE the camera focus code used it. The code then searched for the first owned region, which might not be the spawn region.

**iPad zoom after pan**: Two-finger zoom left residual single-finger pan state. Fix: Clear all pan state when two-finger zoom ends.

**Camera offset for UI panel**: Left panel covered the map. Solution evolved through multiple iterations:
1. Simple offset subtracted from viewport
2. Two-camera system (main camera for game world + UI camera for fixed elements)
3. Centering formula: `scrollX = mapWidth/2 - (camW + panelW) / (2 * fitZoom)`

### 7.4 Mobile Touch Bugs

**MOST CRITICAL**: `touch-action: none` CSS was missing EVERYWHERE. Mobile browsers intercepted all touch events for their default scroll/pan/zoom behavior, completely blocking Phaser input.

**Fix**: Added `touch-action: none` to `#game`, canvas, `#game-ui-root`, `.ghud`, and dynamically after Phaser game creation.

**Other touch fixes**:
- `pointer.getDistance()` threshold: 15px -> 30px for touch (high DPI screens)
- SelectionSystem: `_pendingSourceRegionId` pattern instead of immediate `active = true`
- CameraSystem: pan threshold 10px -> 15px for touch

### 7.5 Deploy Issues

**rsync --delete wiping .env** (March 20): Deploy command `rsync --delete` deleted the production `.env` file on the server. PostgreSQL connection lost. Diamonds reset to zero. JWT_SECRET changed causing all tokens to become invalid (401 errors for all users).

Fix: Added `--exclude='.env'` to rsync command. Created `.env` backup procedure.

**PM2 process name wrong** (April 6): `deploy.sh` referenced `kust-backend` but PM2 process was named `kust-game`. Server wouldn't restart after deploy.

### 7.6 MapGenerator Overrides Bug (April 6)

`MAP_OVERRIDES` configuration was removed but its usage in `overrides.maxRegions` and `overrides.maxPts` was not cleaned up. Runtime crash on any map generation.

Fix: Replace `overrides.X || default` with just `default`.

### 7.7 Diamond Reward Bug (March 18)

Players weren't receiving diamonds after winning bot matches.

**Root Cause Chain**:
1. PostgreSQL couldn't connect (SASL password error from missing .env)
2. `AuthService._initDb()` failed -> user cache empty
3. `validateToken()` found user in JWT but not in cache -> returned null
4. `player.userId` was null
5. `endGame()` had `if (player.isBot || !player.userId) continue;` -> skipped all players

**Fix**: JWT fallback in `validateToken()` -- if JWT is valid but user not in cache, create minimal user from JWT payload and add to cache.

---

## 8. Failed Approaches (CRITICAL SECTION)

### 8.1 DOM Fog Manager (DOMFogManager.js)

**Status**: Implemented, still in codebase, but causes performance issues.

**What Failed**: 60-100 CSS animations + `clip-path: polygon()` per fogged region. Browser compositor couldn't handle the volume. -10-15% FPS impact.

**What To Do Instead**: Implement fog entirely within the game renderer. Use a single full-screen overlay with "holes" cut for visible regions, or use WebGL shaders for fog rendering.

### 8.2 Server-Sent Army Positions (Pre-Prediction)

**Status**: Replaced by client-side prediction.

**What Failed**: 100ms gap between server ticks caused visible stuttering. Lerp toward server position couldn't smooth the gaps enough.

**What Replaced It**: Client-side prediction + server reconciliation. Client moves armies every frame; server provides corrections.

### 8.3 Phaser-Only Menu System

**Status**: Replaced by React menus.

**What Failed**: Phaser DOM elements for forms are clunky. No component model, no state management, no CSS flexibility. Every UI change required manual coordinate math.

**What Replaced It**: React MenuApp.jsx with proper CSS, responsive design, and component architecture.

### 8.4 Large Map Optimization Bundle (South Atlantic)

**Status**: Completely reverted.

**What Failed**: Combining frustum culling + polygon outset changes + gap filling + vertex snapping + new map content in one batch. Every change interacted with every other change in unexpected ways.

**Lesson**: Make ONE rendering change at a time, test on ALL maps, then move to the next.

### 8.5 Polygon Gap Filling Attempts

Multiple approaches tried and all failed:
- Edge normal outset (dynamic outset based on edge normals)
- Vertex snapping (snapping nearby vertices together)
- Large outset values (5-7px instead of 1.5px)
- Gap filling (drawing additional geometry between regions)

All caused region overlaps or visual corruption. The simple 1.5px uniform outset was the only approach that worked reliably.

### 8.6 Owner Glow with Per-Region Tweens

**Status**: Partially replaced with gradient animation.

**What Failed**: 30-40 simultaneous Phaser tweens each doing `clear() + 8x fillRect() + 8x _lerpColor()` every 3rd frame. -15-25% FPS on Windows machines.

**What To Do Instead**: Single WebGL shader for all region highlights, or pre-rendered texture atlas.

### 8.7 Canvas Gradient Animation Iterations

Multiple gradient animation versions attempted for player-owned regions:
- v1: Animated gradient per region (CPU-heavy)
- v2: Gradient with stripe pattern (visual issues)
- v3: Base polygon color direct animation (worked but still CPU-heavy)

**Current compromise**: Toggle via settings panel and `kust_low_perf` flag.

---

## 9. Successful Patterns (CRITICAL SECTION)

### 9.1 Server-Authoritative Architecture

All game logic runs on the server. Client is purely a renderer with prediction. This prevents cheating and ensures consistency.

**Keep exactly as-is in rebuild.**

### 9.2 Client-Side Prediction + Server Reconciliation

**Pattern**:
- Client predicts army positions every frame using `speed` and `moveTarget`
- Server sends authoritative positions every 100ms
- Drift thresholds: <2px (ignore), 2-50px (smooth correct), >50px (snap), >150px (teleport)
- Correction via exponential decay: `1 - exp(-8 * deltaSec)`

**Keep exactly as-is. This is one of the best-implemented systems in the codebase.**

### 9.3 Delta State Updates

**Pattern**:
- `isDirty()` / `markClean()` / `serializeDelta()` on entities
- Only dirty regions broadcast
- Army threshold: 2px movement minimum
- Player data: every 5th tick
- `_lastSentOwnerId` initialized to `undefined` (not `null`) so first tick is always dirty

**Keep exactly as-is. The optimization standards document (`optimization-standards.md`) is a perfect reference for this pattern.**

### 9.4 Per-Player Fog Filtering

Server computes each player's visible regions via BFS and filters army data per-player. Prevents information leaks and reduces bandwidth.

**Keep and extend to cover ALL data types (buildings, resources, etc.).**

### 9.5 Object Pooling for Army Sprites

Graphics and text pools (max 50 each) in ArmyRenderer. Eliminates creation/destruction churn.

**Keep and apply to more object types (particles, effects).**

### 9.6 GeoJSON-Based Map Generation

Load real geographic data -> Mercator projection -> polygon simplification -> neighbor detection -> spawn placement -> terrain type assignment.

**Keep as the core map system.** Single source of truth in `config/maps.js`.

### 9.7 React + Phaser Hybrid UI

- React: Auth, Menu, HUD overlay (GameHUD.jsx)
- Phaser: Game rendering, AbilityBar (needs game input)
- Communication: GameBridge.js event bus

**Keep this architecture.** The `pointer-events: none` with selective `auto` pattern is clean.

### 9.8 GameBridge Event Bus

Simple pub/sub singleton connecting Phaser scene events to React HUD components.

**Keep exactly as-is.** Consider replacing with a more formal event system (EventEmitter3) if the event count grows.

### 9.9 Shared Constants (client/server)

`shared/gameConstants.js` and `shared/eventTypes.js` used by both sides ensures consistency.

**Keep, but eliminate the duplicated `server/src/game/constants.js` fallback file.** The try/catch import pattern is a code smell.

### 9.10 3-Tier Responsive with pick() Utility

```javascript
const p = (mobile, tablet, desktop) => pick(W, mobile, tablet, desktop);
```

Simple, effective, used consistently across all UI scenes.

**Keep as a core utility.**

### 9.11 Tutorial with Callback Pattern

SelectionSystem's `onSendSoldiers` callback enables offline tutorial without modifying the core selection logic.

**Keep this pattern for any system that needs both online and offline modes.**

---

## 10. Deployment Lessons

### 10.1 Deploy Script Evolution

**Phase 1**: Manual rsync commands (3 separate commands for client, server, shared)
**Phase 2**: `deploy.sh` script automating all steps
**Phase 3**: deploy.sh bug fixes (PM2 process name, .env exclusion)

### 10.2 PM2 Process Naming

**Bug**: `deploy.sh` called `pm2 restart kust-backend` but the actual PM2 process was named `kust-game`. Server didn't restart after deploys.

**Fix**: Changed to `pm2 restart kust-game`.

**Lesson**: Always verify PM2 process names match across deploy scripts and ecosystem.config.js.

### 10.3 rsync --delete Danger

**CRITICAL INCIDENT**: `rsync --delete` deleted the production `.env` file, killing:
1. PostgreSQL connection (diamonds reset to 0)
2. JWT_SECRET changed (all user tokens invalid, mass 401 errors)

**Fix**: `--exclude='.env'` in all rsync commands.

**Lesson**: NEVER use `rsync --delete` without explicit excludes for environment files. Better yet, keep `.env` managed separately from deploys.

### 10.4 SSH Configuration

- Server: `server.internethane.com` (185.106.208.55)
- **Port**: 2232 (non-standard!)
- **SSH Key**: `~/.ssh/internethane_ed25519`
- **Alias**: `yuksel` in ~/.ssh/config
- Direct IP+port 22 does NOT work

### 10.5 Build Pipeline

```
Client: cd client && VITE_SERVER_URL="" npm run build
Server: rsync (excluding node_modules, .git, tests, .env)
Shared: rsync shared/
Restart: ssh yuksel 'cd /Domains/kust.frkn.com.tr/backend && npm install --production && pm2 restart kust-game'
```

**Deploy Path**: `/Domains/kust.frkn.com.tr/` (NOT `/var/www/kust-game/`)

---

## 11. Architecture Decisions & Trade-offs

### 11.1 Why PhaserJS over Raw Canvas/WebGL

**Decision**: PhaserJS 3.70 for game rendering

**Pros**:
- Scene management, input handling, tweens, cameras built-in
- Large community, good documentation
- Handles WebGL fallback to Canvas2D
- `setScrollFactor(0)` for UI elements

**Cons**:
- Heavy for a 2D strategy game (~500KB)
- Graphics objects are not optimally batched for many polygons
- Tween system becomes a bottleneck with 30+ parallel tweens
- No built-in polygon filling with textures

**Verdict**: Good choice for rapid development. For a rebuild with performance focus, consider raw WebGL with a minimal framework or Pixi.js (lighter rendering).

### 11.2 Why Socket.IO over Raw WebSocket

**Decision**: Socket.IO 4.7 for realtime communication

**Pros**:
- Automatic reconnection
- Event-based messaging
- perMessageDeflate support
- Room system (useful for game rooms)
- Fallback to HTTP long-polling

**Cons**:
- Overhead vs raw WebSocket (~10% larger messages)
- perMessageDeflate can be CPU-intensive at higher levels

**Verdict**: Good choice. The room system and auto-reconnect are valuable for a multiplayer game. The overhead is acceptable.

### 11.3 Why PostgreSQL over MongoDB

**Decision**: PostgreSQL for persistent data

**Pros**:
- ACID transactions for diamond economy
- JSONB for flexible stats storage
- Strong ecosystem, proven reliability
- UPSERT support (`INSERT ON CONFLICT UPDATE`)

**Cons**:
- Requires schema migrations
- Heavier than MongoDB for simple document storage

**Verdict**: Correct choice for a game with an economy system. Transactions ensure diamond operations are atomic.

### 11.4 Why React for UI over Pure Phaser

**Decision**: React 18 for menus and HUD, Phaser for gameplay rendering

**Pros**:
- Proper component model for complex UI
- CSS for styling (much easier than Phaser coordinate math)
- Responsive design with standard CSS breakpoints
- State management with hooks
- Code-splitting (React loads only when needed)

**Cons**:
- Two rendering pipelines (React DOM + Phaser Canvas)
- GameBridge needed for cross-framework communication
- Bundle size increase (~206KB for React)

**Verdict**: Correct choice. The hybrid approach plays to each framework's strengths.

### 11.5 Why No Redis in Production

**Reality**: Redis is listed in the tech stack but never installed on the production server. The codebase has `REDIS_URL=redis://localhost:6379` in .env but uses in-memory fallback.

**Why It Works**: 
- Single server deployment
- Matchmaking queue is in-memory (fine for low player count)
- Session management via JWT (stateless)
- No data that needs distributed caching

**When Redis Would Be Needed**: Multi-server deployment, high-volume matchmaking, shared session state.

### 11.6 Why Client-Side Prediction over Server Interpolation

**Decision**: Client predicts army positions rather than interpolating between server states.

**Why**: 10 TPS server tick rate creates 100ms gaps. Interpolation would always show positions 100-200ms behind server reality. Prediction shows positions 0-50ms ahead, which feels much more responsive.

**Trade-off**: Prediction can be wrong (visible snap corrections). Reconciliation thresholds were tuned to minimize noticeable corrections.

---

## 12. Recommendations for Rebuild

### 12.1 Keep Exactly As-Is

| System | Why |
|--------|-----|
| Server-authoritative architecture | Security, consistency |
| Client-side prediction + reconciliation | Smooth 60fps army movement |
| Delta state updates (dirty tracking pattern) | Proven bandwidth optimization |
| Per-player fog filtering | Anti-cheat + bandwidth |
| GameBridge event bus | Clean React-Phaser communication |
| React for UI, Phaser for gameplay | Best of both worlds |
| GeoJSON map system | Core game identity |
| `config/maps.js` single source of truth | Excellent DX for adding maps |
| `pick()` 3-tier responsive utility | Consistent responsive design |
| Tutorial callback pattern | Clean offline/online mode switching |
| Object pooling for armies | Proven performance benefit |
| Shared constants (client/server) | Consistency |
| `t()` + `useTranslation()` i18n | Works across React and Phaser |

### 12.2 Redesign from Scratch

| System | What's Wrong | What To Do |
|--------|-------------|------------|
| **MapRenderer** (1706 lines, God Object) | 10+ responsibilities, most fragile file | Split into RegionBaseRenderer, DecorationRenderer, FogManager, CaptureEffectRenderer, OwnerGlowRenderer |
| **GameRoom** (1088 lines, God Object) | 12+ responsibilities | Split into RoomManager, SpawnPhaseManager, AbilityHandler (Strategy pattern), BroadcastService, BotManager |
| **GameSync** (665 lines) | Network module contains 200+ lines of visual effects | Extract EffectRenderer. GameSync should only handle state sync and event dispatch |
| **Fog of War rendering** | DOM-based DOMFogManager is a performance sink | Implement entirely in Phaser/WebGL. Single overlay with visibility holes |
| **Owner glow/gradient** | Per-region tweens kill performance | Single WebGL shader or pre-rendered texture approach |
| **SiegeRenderer pixel grid** | putImageData every 2 frames is expensive | Use dirty-region tracking, sin lookup table, incremental updates |
| **Event flow** | Two delivery mechanisms (STATE_UPDATE embedded + separate emit) | Single event pipeline. All game events through one channel |
| **Error handling** | No try-catch in GameLoop tick, broadcastState, or client handlers | Add defensive error handling at all system boundaries |
| **Client state** | 3 places hold region data (GameScene, MapRenderer.regionData, entity cache) | Single GameStore/StateManager |

### 12.3 Simplify

| System | Current Complexity | Simplified Version |
|--------|-------------------|-------------------|
| Ability system | 5 abilities with separate Player properties each (15 fields) | `player.abilities = new Map()` with dynamic ability registration |
| Region types | switch-case in constructor (violates Open/Closed) | RegionTypeConfig lookup table |
| gameHandler.js | 7 handlers x 40 lines of identical boilerplate | Generic `wrapGameAction()` wrapper |
| DOMFogManager | 149 lines of DOM manipulation | Remove entirely, use in-engine fog |
| Constants fallback | `shared/gameConstants.js` + `server/src/game/constants.js` with try/catch | Single constants file, no fallback |
| Player color lookup | `getPlayerColor(colorIndex, skinData)` called 10+ places | Compute once per player, cache in entity |

### 12.4 Add What's Missing

| Feature | Why | Priority |
|---------|-----|----------|
| Structured logger | `console.log` everywhere, no log levels | P1 |
| Error boundaries | One subsystem crash kills entire game | P1 |
| Schema-based input validation | Socket events validated ad-hoc | P2 |
| Rate limiter middleware | Rate limiting duplicated in each handler | P2 |
| Performance metrics | No visibility into production performance | P2 |
| Horizontal scaling | Single server architecture | P3 |
| Redis for matchmaking | Needed for multi-server | P3 |
| Difficulty levels for bots | Current bot is static | P3 |
| Spectator mode | Players can only watch after elimination | P4 |
| Replay system | No match replay capability | P4 |

### 12.5 Architecture Improvements

1. **Event-Driven Server**: Replace direct `io.emit()` calls with an event bus. GameRoom emits events, a BroadcastService subscribes and handles serialization + per-player filtering + socket delivery.

2. **System Registration**: Instead of manually calling each system in GameLoop, use a system registry that auto-discovers and orders systems by dependency.

3. **ECS (Entity-Component-System)**: The server already has a pseudo-ECS with ProductionSystem, MovementSystem, etc. Formalize this with proper entity/component separation.

4. **Client Renderer Pipeline**: Define a clear render order and have each renderer register itself. MapRenderer orchestrates sub-renderers in defined passes (background -> regions -> decorations -> fog -> effects -> UI).

5. **Type Safety**: Consider TypeScript for the rebuild. The number of bugs caused by undefined variables, wrong types, and missing properties strongly argues for static typing.

### 12.6 Performance Improvements

1. **Phaser Config** (biggest single improvement):
   - `resolution: 1` (not `devicePixelRatio` -- this alone can double FPS)
   - `antialias: false`
   - `roundPixels: true`
   - `type: Phaser.WEBGL`
   - `powerPreference: 'high-performance'`
   - `batchSize: 4096`

2. **Eliminate per-region per-frame work**: Owner glow, siege rendering, fog animations should use batch rendering or shaders, not individual per-region operations.

3. **Trail particles**: Use a single Graphics object for all particles (batch rendering) instead of individual `scene.add.graphics()` per particle.

4. **FPS emit throttle**: Currently emits to React every frame. Throttle to every 500ms.

5. **Camera sync dirty flag**: `domFogManager.syncCamera()` called every frame. Only call when camera actually moves.

### 12.7 Code Organization Improvements

```
Recommended rebuild structure:

server/
  src/
    core/          # GameLoop, EventBus, Logger
    game/
      systems/     # ProductionSystem, MovementSystem, etc.
      entities/    # Region, Army, Player (pure data)
      handlers/    # AbilityHandler, SpawnHandler (strategy pattern)
      maps/        # MapGenerator, GeoJSON loader
    network/       # BroadcastService, FogFilter, DeltaCompressor
    auth/          # AuthService, routes
    store/         # StoreService, routes
    matchmaking/   # MatchmakingService, BotMatchService
    admin/         # AdminPanel routes

client/
  src/
    engine/        # Phaser setup, scene management
    rendering/
      map/         # RegionRenderer, DecorationRenderer, FogRenderer
      army/        # ArmyRenderer (with pooling)
      effects/     # CaptureEffects, AbilityEffects, SiegeRenderer
      camera/      # CameraSystem
    network/       # GameSync (state only), SocketManager
    prediction/    # ArmyPredictor, ServerReconciler
    ui/            # React components (menu, HUD, auth)
    game-bridge/   # GameBridge event bus
    input/         # SelectionSystem, TouchHandler
    audio/         # SoundManager
    i18n/          # Language files
    config/        # maps.js, constants
    utils/         # device.js, colors.js, math.js
```

---

## Appendix A: Chronological Development Timeline

| Date | Milestone |
|------|-----------|
| March 11 | MVP: Grid maps, armies, conquest, bot AI, auth, sound, fog, gate system |
| March 11 | Phase 2: Online PvP, ranked, GeoJSON maps, visibility system |
| March 11 | Abilities v1 (bomb/fireball/freeze), terrain types, security fixes |
| March 12 | Tutorial system, friends system, deployment to production |
| March 15 | 3-tier responsive, mobile overhaul, tablet support |
| March 16 | React auth screen, React menu, React HUD, i18n system |
| March 16 | Network delta optimization, performance throttling |
| March 16-17 | Map explosion (Poland, UAE, Russia, Portugal, Brazil) |
| March 17 | PostgreSQL persistence, skin/store system, daily rewards |
| March 18 | Abilities v2 (missile/nuclear/barracks/speedBoost), bot abilities |
| March 18 | DOM fog manager, diamond bug fix, test suite (110 tests) |
| March 20 | Freeze ability v2 (army freeze), dynamic map config, deploy fixes |
| March 21 | Combat power variation, elimination game over, neutral production |
| April 3 | Resource system, building system, mobile touch fix, SOLID audit |
| April 3 | Client-side prediction v2, performance audit |
| April 4 | Siege/tug-of-war system, combat redesign brainstorms |
| April 5 | South Atlantic disaster + revert, attack range, building costs |
| April 5 | MapRenderer revert + clean frustum culling |
| April 6 | Spawn HP 40 final fix, resource fog security, text flicker fix |
| April 6 | MapGenerator overrides fix, Poland/China maps, viewport culling |

## Appendix B: Key File Sizes (Technical Debt Indicator)

| File | Lines | Role | Debt Level |
|------|-------|------|-----------|
| `MapRenderer.js` | 1706 | God Object | CRITICAL |
| `GameRoom.js` | 1088 | God Object | CRITICAL |
| `MapGenerator.js` | 1015 | Large but functional | HIGH |
| `GameScene.js` | 801 | Borderline God Object | HIGH |
| `GameSync.js` | 665 | Mixed concerns | HIGH |
| `SiegeRenderer.js` | 378 | Acceptable | MEDIUM |
| `gameHandler.js` | 356 | DRY violations | MEDIUM |
| `Region.js` | 287 | Acceptable | LOW |
| `SiegeSystem.js` | 179 | Good | LOW |
| `ConquestSystem.js` | 94 | Excellent reference | NONE |
| `Player.js` | 92 | Good (DRY issue with abilities) | LOW |

## Appendix C: Constants Reference

| Constant | Value | Notes |
|----------|-------|-------|
| TICK_RATE | 10 | Ticks per second |
| TICK_DURATION | 100ms | Per tick |
| ARMY_SPEED | 45 px/s | Reduced from 75, then from 150 |
| ARMY_COLLISION_RADIUS | 20px | |
| SOLDIER_SPLIT_RATIO | 0.5 | Half soldiers sent |
| MAP_WIDTH | 1600px | Standard |
| MAP_HEIGHT | 900px | Standard |
| FOG_DEPTH | 2 | BFS hops (server) |
| NEIGHBOR_THRESHOLD | 8px | Reduced from 40px |
| ATTACK_RANGE | 1 | BFS hops |
| SIEGE_DAMAGE_PER_SECOND | 2.0 | |
| SIEGE_ATTRITION_PER_SECOND | 0.3 | |
| COMBAT_POWER_VARIATION | 0.2 | +/-20% |
| SNOW_SPEED_MULTIPLIER | 0.28 | Was 0.35 |
| SPEED_BOOST_MULTIPLIER | 1.25 | |

---

*This document captures the complete institutional knowledge of the KUST 10 - Pillows project as of April 6, 2026. It was compiled from 147 documentation files in `claude_documentations/`, 200+ git commits, 3 SDD specifications, and 10 handover documents.*

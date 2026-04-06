# 03 - Gameplay Mechanics (Complete Reference)

This document captures every gameplay mechanic, numerical value, timing, and system interaction in KUST 10 - Pillows. It is written from a player's perspective but includes all implementation-level constants needed to recreate the exact game balance.

---

## Table of Contents

1. [Core Constants](#1-core-constants)
2. [Game Flow](#2-game-flow)
3. [Map System](#3-map-system)
4. [Soldier Production](#4-soldier-production)
5. [Army / Soldier Movement](#5-army--soldier-movement)
6. [Combat: Collision System](#6-combat-collision-system)
7. [Combat: Siege System (Tug of War)](#7-combat-siege-system-tug-of-war)
8. [Conquest System](#8-conquest-system)
9. [Ability System](#9-ability-system)
10. [Building System](#10-building-system)
11. [Resource System](#11-resource-system)
12. [Gate / Teleport System](#12-gate--teleport-system)
13. [Fog of War](#13-fog-of-war)
14. [Region Types (Detailed)](#14-region-types-detailed)
15. [Player Interaction / Controls](#15-player-interaction--controls)
16. [Bot AI System](#16-bot-ai-system)
17. [Ranking / ELO System](#17-ranking--elo-system)
18. [Diamond Economy](#18-diamond-economy)
19. [Win Conditions](#19-win-conditions)
20. [Tutorial System](#20-tutorial-system)
21. [Network Architecture Summary](#21-network-architecture-summary)

---

## 1. Core Constants

All values originate from `shared/gameConstants.js`. Server re-exports from `server/src/game/constants.js`.

| Constant | Value | Unit |
|---|---|---|
| TICK_RATE | 10 | ticks/second |
| TICK_DURATION | 100 | ms/tick |
| MAP_WIDTH | 1600 | pixels |
| MAP_HEIGHT | 900 | pixels |
| COUNTDOWN_SECONDS | 3 | seconds |
| SPAWN_SELECTION_SECONDS | 15 | seconds |

---

## 2. Game Flow

### 2.1 Game Modes

There are three ways to start a game:

| Mode | Key | Max Players | Description |
|---|---|---|---|
| Bot Match | `bot` | 2 | 1 human vs 1 bot |
| Normal (Online) | `normal` | 2 | 1v1 human match |
| 4-Player | `4player` | 4 | 4-player free-for-all |
| Ranked | `ranked` | 2 | 1v1 with ELO tracking |

### 2.2 Map Selection

Three maps are available:

| Map | ID | Approximate Regions | Min/Max Players |
|---|---|---|---|
| Turkey | `turkey` | ~91 | 2-4 |
| Poland | `poland` | ~73 | 2-4 |
| China | `china` | ~34 | 2-4 |

Maps are generated from GeoJSON data. Each real-world administrative subdivision becomes a game region. The server also supports a `grid` map type as fallback (5x4 or 6x5 grid of Voronoi-like cells).

### 2.3 Phase Sequence

The game progresses through these phases in order:

```
waiting -> countdown -> spawn_selection -> preview -> playing -> finished
```

**Phase 1: Waiting**
- Players join the room. The game waits until `maxPlayers` are present.

**Phase 2: Countdown (3 seconds)**
- A 3-second countdown is broadcast each second: 3... 2... 1...
- If a player leaves during countdown, the room reverts to `waiting`.

**Phase 3: Spawn Selection (15 seconds)**
- The map is generated and sent to all clients.
- During this phase, region data is **hidden** -- all regions appear as NORMAL type with 0 HP. Players cannot see terrain types, resource types, or defense bonuses.
- Each player clicks any non-ROCKY, non-gate region to claim it as their starting position.
- Players can change their selection during this phase (the previous selection is undone).
- The selected region is converted to type `SPAWN`, given `SPAWN_HP = 40` soldiers, and defense bonus / speed multiplier are reset to defaults (0, 1.0).
- Bots auto-select a random available region after 1-4 seconds (staggered delay).
- If a player does not select within 15 seconds, they are auto-assigned to a random available region.
- The timer always runs the full 15 seconds; there is no early-end mechanic.

**Phase 4: Preview (3 seconds)**
- After spawn selection ends, the full region data is revealed per-player (fog-filtered: fogged regions do not reveal `resourceType` or `building`).
- A 3-second preview countdown plays (CLIENT_PREVIEW_MS = 3000ms).
- Each player receives 1 random starting ability charge (randomly chosen from: missile, nuclear, barracks, speedBoost, freeze).
- Status transitions to `playing` after 3200ms (3000 + 200ms network buffer).

**Phase 5: Playing**
- The game loop starts at 10 ticks per second.
- Tick order each frame:
  1. Production
  2. Movement
  3. Collision (army vs army)
  4. Conquest (army arrival)
  5. Siege (ongoing tug-of-war damage)
  6. Gate teleportation
  7. Win condition check
- State updates are broadcast to each player individually (fog-filtered).

**Phase 6: Finished**
- Triggered when only 1 non-eliminated player remains.
- Final state is broadcast, ELO is updated (ranked mode), diamond rewards are distributed.
- Eliminated players are sent a `game_over` event immediately upon elimination (they do not wait for the game to fully end).

### 2.4 Player Disconnection

- If a player disconnects during `waiting` or `countdown`: they are removed entirely, countdown is cancelled.
- If a player disconnects during `playing`, `preview`, or `spawn_selection`: they are marked as eliminated, and all their regions become neutral (owner set to null).

---

## 3. Map System

### 3.1 GeoJSON Map Generation

1. Load GeoJSON file for the chosen map (Turkey, Poland, China).
2. Extract polygon features. For MultiPolygon, use the largest ring as the outline.
3. Split oversized regions (>1.5x average area) using axis-aligned splits. Merge undersized regions (<0.15x average area) into their nearest neighbor. Max 80 regions.
4. Apply Mercator projection and fit to 1600x900 canvas with 50px padding.
5. Simplify polygons using Ramer-Douglas-Peucker to max 60 vertices (40 for Russia).
6. Compute neighbors: two regions are neighbors if they share at least 2 close vertices (threshold = map dimension * 1.5-2.5%).
7. Ensure connectivity: every region gets at least 2 neighbors; disconnected components are bridged.

### 3.2 Region Type Assignment

After base regions are created, special types are assigned randomly:

| Type | % of Normal Regions | Appearance Chance |
|---|---|---|
| MOUNTAIN | 15% | Always |
| SNOW | 15% | 60% chance per map |
| ROCKY | 8% (if total >= 10) | 60% chance per map |
| SPEED | 10% of remaining normals | Always (after other assignments) |
| TOWER | 1-5 (based on region count) | Always |

**Tower count formula:**
- <= 10 regions: 1 tower
- 11-20 regions: 2 towers
- 21-30 regions: 3 towers
- 31-50 regions: 4 towers
- 50+ regions: 5 towers

**Rocky constraints:**
- Cannot be adjacent to a SPAWN region
- Cannot be adjacent to another ROCKY region
- Cannot be adjacent to a gate region
- Must not block all exits from any gate region

### 3.3 Neutral Region HP

| Region Type | HP Range |
|---|---|
| SPAWN | 40 (fixed) |
| Neutral (NORMAL, TOWER, etc.) | 3 - 30 (random) |
| ROCKY | 0 (impassable, no HP) |

### 3.4 Player Colors

16 colors available, assigned for maximum RGB distance contrast:

```
#E94560 (red), #06D6A0 (green), #8338EC (purple), #FFD166 (gold),
#4CC9F0 (cyan), #FF6B35 (orange), #8AC926 (lime), #F72585 (pink),
#2EC4B6 (teal), #FB5607 (deep orange), #7209B7 (violet), #FFBE0B (amber),
#6A4C93 (plum), #FF595E (coral), #E07C24 (bronze), #FF006E (magenta)
```

First player gets a random color. Subsequent players get the color with maximum minimum RGB distance from all already-used colors.

---

## 4. Soldier Production

### 4.1 Base Production Rates

| Region Type | Soldiers/Second | Notes |
|---|---|---|
| NORMAL | 1.0 | Standard rate |
| SPAWN | 1.0 | Same as normal |
| TOWER | 1.5 | 50% bonus production |
| MOUNTAIN | 0.5 | Half speed production |
| SNOW | 0.8 | Reduced production |
| SPEED | 0.8 | Reduced production |
| ROCKY | 0 | No production, impassable |
| Neutral (unowned) | 0.05 | 1 soldier per 20 seconds |

### 4.2 Interest Mechanic

Owned regions gain **bonus production equal to 1% of current HP per second**. This means larger garrisons grow faster:

```
effectiveRate = baseProductionRate + (currentHP * 0.01)
```

Example: A NORMAL region with 50 soldiers produces `1.0 + 0.5 = 1.5 soldiers/second`.

### 4.3 Production Cap (Max HP)

- Base max HP per region: **300 soldiers**
- Each `city_center` building owned by the player increases cap by **+20% (compound)**:
  - 0 city centers: 300
  - 1 city center: 360
  - 2 city centers: 432
  - 3 city centers: 518
- When a region exceeds the cap, it **decays at 1% per second** back down to the cap.
- Production will not push a region above the cap.

### 4.4 Production Modifiers

- **Barracks building**: Each `barracks` building the player owns gives **+10% production** to ALL their regions (stacks additively).
  - 1 barracks: `ceil(production * 1.10)`
  - 2 barracks: `ceil(production * 1.20)`
  - 3 barracks: `ceil(production * 1.30)`
- **Nuclearized regions**: Production is **completely disabled** for the nuclearized duration.
- **Frozen regions**: Production is **completely disabled** while frozen.
- **Gate regions**: Never produce soldiers.

### 4.5 Production Accumulator

Production uses a fractional accumulator. Each tick, `rate * (tickDuration / 1000)` is added to the accumulator. When the accumulator reaches >= 1.0, a whole soldier is produced and subtracted. This means at 1.0 soldiers/second with 100ms ticks, a soldier is produced every 10 ticks (1 second).

---

## 5. Army / Soldier Movement

### 5.1 Sending Soldiers

- **Split ratio**: `SOLDIER_SPLIT_RATIO = 0.5` (50% of the region's soldiers are sent)
- Soldiers sent: `floor(regionHP * 0.5)`
- Minimum to send: Region must have at least 2 soldiers (so at least 1 is sent and 1 remains).
- **Multi-source**: Players can select up to **12 regions** at once (MAX_SELECTED_REGIONS) by drag-selecting.
- **Auto-source on click/tap**: If no drag selection is active, clicking/tapping an enemy or neutral region automatically selects up to **3 nearest owned regions** within attack range as sources (sorted by distance).

### 5.2 Attack Range

- `ATTACK_RANGE = 1` hop (neighbors only)
- A source region must be within 1 neighbor-hop of the target to send soldiers.
- Gate connections count as virtual neighbors for range calculation (see Gate System).

### 5.3 Army Speed

- `ARMY_SPEED = 25` pixels/second (base)
- Army spawn position: closest edge point on source polygon toward target center.
- Army arrival position: closest edge point on target polygon toward source center.

### 5.4 Speed Modifiers

| Modifier | Multiplier | Duration/Scope |
|---|---|---|
| SNOW region | 0.28x (72% slower) | While army is inside snow polygon |
| SPEED region | 1.5x (50% faster) | While army is inside speed polygon |
| Speed Boost ability | 1.25x (25% faster) | 10 seconds, all player's armies |

Speed modifiers stack multiplicatively:
- Speed Boost in a SPEED region: `25 * 1.5 * 1.25 = 46.9 px/sec`
- Speed Boost in a SNOW region: `25 * 0.28 * 1.25 = 8.75 px/sec`

### 5.5 Army Attrition

- Armies lose **1 soldier per second** while traveling (attrition).
- If an army reaches 0 soldiers from attrition, it is destroyed.
- Attrition uses an accumulator (same pattern as production).

### 5.6 Army Lifetime Cap

- Armies stuck for more than **45 seconds** are automatically destroyed (safety timeout).

### 5.7 Early Arrival

- An army arrives **immediately** when its position enters the target region's polygon (not just the center point). This makes arrival feel responsive.

### 5.8 Pathfinding Around Rocky Regions

- Rocky regions are impassable. Armies cannot walk through them.
- The system uses a **visibility-graph + Dijkstra** pathfinding approach:
  1. Rocky polygon vertices are expanded outward by 18px margin.
  2. A visibility graph is built between the start, end, and expanded vertices.
  3. Dijkstra finds the shortest clear path.
  4. Intermediate waypoints are set on the army, which follows them sequentially.
- Waypoint arrival threshold: 8 pixels.

### 5.9 Army Freezing

- The Freeze ability freezes ALL enemy armies mid-air for `FREEZE_ARMY_DURATION = 1500ms` (1.5 seconds).
- Frozen armies cannot move but still accumulate attrition? No -- movement is skipped entirely while frozen (the `if (army.frozenUntil && now < army.frozenUntil) continue;` check happens after attrition, so **attrition still applies during freeze**).

---

## 6. Combat: Collision System

When two armies from different players come within `ARMY_COLLISION_RADIUS = 20 pixels` of each other:

- The larger army survives with `(largerCount - smallerCount)` soldiers.
- The smaller army is destroyed.
- If equal, both are destroyed.
- This is a pure numbers fight with no randomness.

---

## 7. Combat: Siege System (Tug of War)

### 7.1 How Siege Works

When an army arrives at an enemy or neutral region, it does NOT instantly capture. Instead, the soldiers join a **siege force** that fights the defenders over time.

- Multiple attackers (different players) can siege the same region simultaneously.
- Max simultaneous siege armies per region: `SIEGE_MAX_ARMIES_PER_REGION = 3` (this limits the number of distinct siege armies that can pile up).

### 7.2 Siege Damage Calculation

Each tick, all sides damage each other proportionally:

```
DAMAGE_PERCENT = 0.10 (10% of opposing force per second)
DEFENSE_BONUS = 1.20 (defender gets 20% base bonus)
```

If the region has a **wall building**: `DEFENSE_BONUS += 0.50` (total 1.70, i.e., 70% bonus).

For each side:
1. Calculate effective force: defender's force * DEFENSE_BONUS, attacker's force stays raw.
2. Calculate effective total of all sides.
3. Each side takes damage: `(totalEffectiveForce - ownEffectiveForce) * DAMAGE_PERCENT * deltaTimeSeconds`

This means:
- With 20 defenders and 30 attackers: defender's effective = 20 * 1.2 = 24, attacker effective = 30. Total = 54. Defender takes `30 * 0.10 * dt` damage. Attacker takes `24 * 0.10 * dt` damage.
- Higher force advantage means the weaker side melts faster.

### 7.3 Siege Resolution

- **Attackers depleted**: If a siege force reaches 0, that attacker is removed from the siege. If all attackers are gone, siege ends ("repelled").
- **Defender falls**: When region HP reaches 0, the **strongest remaining attacker** captures the region. Their remaining siege force becomes the region's starting HP (minimum 1). The region's `defenseBonus` is added on top.
- **All depleted**: If the defender and all attackers hit 0 simultaneously, the region survives with 1 HP.

### 7.4 Reinforcements During Siege

- If the **region owner** sends armies to their own besieged region, the reinforcing soldiers fight the siege forces directly:
  - Reinforcement damage is distributed evenly across all active attackers.
  - Any leftover reinforcements are added to the region's HP.
- If the region owner's siege force is somehow present as an attacker (edge case), it converts directly to region HP.

### 7.5 Siege Attrition

`SIEGE_ATTRITION_PER_SECOND = 0.3` -- this constant is defined but the actual siege damage system uses the 10% proportional model described above, not a flat attrition rate.

---

## 8. Conquest System

When an army arrives at its target region:

| Scenario | Result |
|---|---|
| **Own region, no siege** | Soldiers added directly to region HP (reinforcement) |
| **Own region, under siege** | Soldiers fight siege forces (distributed evenly), excess becomes HP |
| **Neutral region** | Soldiers join siege force (same mechanic as enemy) |
| **Enemy region** | Soldiers join siege force (tug of war begins/continues) |

### 8.1 Ability Grants on Capture

The **first time** a neutral region is captured, the capturing player receives **1 random ability charge** (chosen from: missile, nuclear, barracks, speedBoost, freeze). Each region can only grant this bonus once per game (`abilityGranted` flag).

### 8.2 Combat Power Variation

`COMBAT_POWER_VARIATION = 0.2` -- this constant exists but is used only in the `getCombatPower()` function in ConquestSystem.js. However, in the current siege-based flow, arriving armies always add their exact count to siege forces (no randomness applied). The variation would apply to direct-capture scenarios if they existed.

### 8.3 Defense Bonus on Capture

When a region is captured, `region.defenseBonus` soldiers are added to the starting HP:
```
newHP = remainingSiegeForce + defenseBonus
```

Mountain defense bonuses are randomly assigned from `[10, 25, 50]`.

---

## 9. Ability System

### 9.1 Ability Charges

Abilities are **charge-based**. All abilities start with **0 charges** (`INITIAL_CHARGES = 0` for all).

Charges are earned by:
1. **Starting the game**: Each player gets 1 random ability charge after spawn selection.
2. **Capturing neutral regions**: First capture of any neutral region grants 1 random ability charge.

### 9.2 Ability List

#### Missile (Key: 1)
| Property | Value |
|---|---|
| Target | Enemy region |
| Damage | 50% of target region's current soldiers killed |
| Cooldown | 10 seconds |
| Charges consumed | 1 |
| Restrictions | Cannot target own regions, rocky regions |

Damage formula: `floor(region.hp * 0.5)`. Region HP cannot go below 0.

#### Nuclear (Key: 2)
| Property | Value |
|---|---|
| Target | Enemy region |
| Effect | Disables production for 3 seconds |
| Cooldown | 10 seconds |
| Charges consumed | 1 |
| Restrictions | Cannot target own regions, rocky regions |

Note: The `NUCLEAR_DURATION` constant is set to `3000` (3 seconds) in gameConstants.js. However, the NuclearSystem code has a comment saying "30-second production disable" and uses `constants.NUCLEAR_DURATION || 30000` as fallback. The actual effect duration is **3 seconds** based on the constant value of 3000ms.

The nuclearized region:
- Cannot produce soldiers
- Cannot produce resources
- Cannot be upgraded with barracks ability
- Shows a visual nuclear effect

#### Barracks (Key: 3)
| Property | Value |
|---|---|
| Target | Own region (not already TOWER, not ROCKY, not nuclearized) |
| Effect | Converts region type to TOWER (production rate becomes 1.5x) |
| Cooldown | 10 seconds |
| Charges consumed | 1 |

The upgraded region keeps its area multiplier. The new production rate = `TOWER_PRODUCTION_RATE * areaMultiplier`.

#### Speed Boost (Key: 4)
| Property | Value |
|---|---|
| Target | Self (no target needed) |
| Effect | All player's armies move 25% faster for 10 seconds |
| Duration | 10,000 ms (10 seconds) |
| Cooldown | 10 seconds |
| Multiplier | 1.25x |
| Charges consumed | 1 |

Activates immediately upon pressing the key (no targeting required).

#### Freeze (Key: 5)
| Property | Value |
|---|---|
| Target | Self (global effect) |
| Effect | Freezes ALL enemy armies mid-air for 1.5 seconds |
| Duration | 1,500 ms (1.5 seconds) |
| Cooldown | 30 seconds |
| Charges consumed | 1 |

Frozen armies cannot move. Attrition still applies during freeze.

### 9.3 Ability Targeting

- **Enemy-target abilities** (Missile, Nuclear): Player presses the key, then clicks an enemy region.
- **Own-target abilities** (Barracks): Player presses the key, then clicks one of their own regions.
- **Self abilities** (Speed Boost, Freeze): Activates immediately on key press, no targeting needed.
- ESC cancels targeting mode.

---

## 10. Building System

Buildings are **constructed on owned regions** using resources. Each region can hold **at most 1 building**.

### 10.1 Building Catalog

| Building | ID | Cost (Iron/Crystal/Uranium) | Scope | Effect |
|---|---|---|---|---|
| City Center | `city_center` | 80 / 80 / 40 | Global | +20% max population cap (compound per building) |
| Barracks | `barracks` | 60 / 30 / 30 | Global | +10% production to ALL player regions |
| Wall | `wall` | 40 / 20 / 10 | Local | +50% defense during siege |
| Iron Dome | `iron_dome` | 60 / 60 / 80 | Local | Blocks missiles within 3 neighbor hops |
| Stealth Tower | `stealth_tower` | 30 / 70 / 50 | Local | Region invisible to enemies (HP shows as "?") |
| Drone Facility | `drone_facility` | 50 / 50 / 70 | Local | Required for drone attacks |
| Missile Base | `missile_base` | 40 / 40 / 100 | Local | Required for missile attacks |

### 10.2 Building Costs and Leveling

- Base costs can be overridden by admin settings.
- Each additional building of the same type costs more via a **level cost multiplier**:
  ```
  actualCost = ceil(baseCost * (1 + existingCount * levelMultiplierPercent / 100))
  ```
- The level multiplier percentage is admin-configurable (default 0%).

### 10.3 Building Limits

- `maxPerPlayer = 0` means **unlimited** for all buildings.
- Each region can only have 1 building.

### 10.4 Building Effects (Detailed)

**City Center (Global):**
- Default max HP: 300
- Per city center: `maxHP *= 1.20`
- Compound: 300 -> 360 -> 432 -> 518 -> 622 -> ...

**Barracks (Global):**
- Each barracks gives +10% production to all owned regions.
- Applied as: `ceil(production * (1 + barracksCount * 0.10))`

**Wall (Local):**
- During siege, defender's effective force gets an additional +50% bonus (on top of the base 20% defense bonus).
- Total defender bonus with wall: 1.70x (70% bonus)

**Iron Dome (Local):**
- Blocks incoming missiles within 3 neighbor-hop radius.
- This is defined in the catalog but implementation details in BombSystem would need to check for iron_dome buildings in the target's neighborhood.

**Stealth Tower (Local):**
- The region's HP is hidden from enemies (sent as `-1` in state updates).
- Enemies see "?" instead of the actual soldier count.
- The region is still visible on the map, just its HP is unknown.

**Drone Facility / Missile Base (Local):**
- These are prerequisite buildings for certain abilities (future expansion).

---

## 11. Resource System

### 11.1 Resource Types

Three resource types: `iron`, `crystal`, `uranium`.

### 11.2 Resource Assignment

- Each non-ROCKY, non-gate region is assigned exactly one resource type.
- Resources are distributed in round-robin fashion (shuffled): the eligible region list is shuffled, then each region gets `resourceTypes[index % 3]`.
- Each region's resource rate is randomly assigned: `0.8 to 1.2 per second` (uniform distribution, rounded to 2 decimal places).

### 11.3 Resource Production

- Only **owned** regions produce resources.
- Resource production per tick: `resourceRate * (tickDuration / 1000)`
- Nuclearized and frozen regions do not produce resources.
- Resources accumulate as floating-point values on the player object.

### 11.4 Resource Usage

Resources are spent on:
- **Building construction** (see Building System section for costs).

Resources are displayed to the player rounded to 1 decimal place:
```
displayedIron = floor(iron * 10) / 10
```

### 11.5 Starting Resources

Players start with **0 of each resource**. All resources must be earned through region control.

---

## 12. Gate / Teleport System

### 12.1 Gate Creation

Gates are **color-matched portal pairs** placed randomly on the map during generation.

- Gate count per map:
  | Region Count | 0 pairs | 1 pair | 2 pairs |
  |---|---|---|---|
  | < 6 | 100% | - | - |
  | < 15 | 40% | 60% | - |
  | 15-39 | 20% | 50% | 30% |
  | 40+ | 10% | 40% | 50% |

- Gates cannot be placed on SPAWN or TOWER regions.
- Paired gates must be at least **4 hops apart** (BFS hop distance) AND at least **200 pixels apart** (Euclidean distance).
- Up to 3 placement attempts per gate pair.

Gate colors: purple (`#BB44FF`), cyan (`#00DDDD`), pink (`#FF44AA`).

### 12.2 Gate Regions

- Gate regions are set to: `ownerId = null`, `hp = 0`, `productionRate = 0`.
- Gate regions **cannot** be targeted for attacks, spawned on, or selected.
- Gate regions do not produce soldiers or resources.

### 12.3 Army Teleportation

When creating an army, the system checks if routing through a gate is shorter:

1. Compare direct distance to `distance(army -> gateA) + distance(gateB -> target)` for each gate pair.
2. If a gate shortcut is found, the army's immediate target is set to the gate entrance.
3. When the army reaches within **15 pixels** (`GATE_TELEPORT_THRESHOLD`) of the entrance gate, it is **instantly teleported** to the paired gate's position + 20px offset toward the final target.
4. After teleport, the army continues to its original target.

- **Cooldown**: 500ms per army to prevent re-teleport loops.
- Only armies that were explicitly gate-routed can teleport (random passing armies are not sucked in).
- Armies targeting a gate region are prevented from teleporting (avoids infinite loops).

### 12.4 Gate Visibility

- Gates act as **visibility tunnels**: if a player can see a region containing a gate, they can also see the paired gate's region AND its immediate neighbors.
- Gate connections count as virtual neighbors for BFS-based visibility and attack range calculations.

---

## 13. Fog of War

### 13.1 Visibility Rules

- `FOG_DEPTH = 2` (configurable by admin)
- Visibility is computed via **BFS from all owned regions**:
  - Depth 0: owned regions (always visible)
  - Depth 1: immediate neighbors of owned regions
  - Depth 2: neighbors of neighbors
- Gate virtual connections count as 1 hop.

### 13.2 What Fog Hides

- **Fogged regions**: resource type, resource rate, and building data are stripped from state updates.
- **Enemy armies**: Only visible if their source OR target region is within the player's visible set.
- **Stealth tower regions**: Even if visible, HP is sent as -1 (shown as "?").

### 13.3 Fog Reveal on Expansion

When a player captures new regions and their visibility expands, newly revealed regions receive their full data (resourceType, resourceRate, building, type, defenseBonus) via a `revealedRegions` payload in the state update.

### 13.4 Spawn Phase Fog

During spawn selection, ALL region data is hidden -- every region appears as NORMAL type with 0 HP. This prevents strategic advantage from seeing the map layout before choosing a spawn.

---

## 14. Region Types (Detailed)

### NORMAL
- Production: 1.0 soldiers/sec
- Defense bonus: 0
- Speed multiplier: 1.0x
- Can be targeted, captured, built on

### TOWER
- Production: 1.5 soldiers/sec (50% bonus)
- Defense bonus: 0
- Speed multiplier: 1.0x
- Strategically valuable production nodes

### SPAWN
- Production: 1.0 soldiers/sec (same as normal)
- Defense bonus: 0
- Speed multiplier: 1.0x
- Starting HP: 40 soldiers
- Created when a player selects their starting region

### MOUNTAIN
- Production: 0.5 soldiers/sec (half rate)
- Defense bonus: randomly 10, 25, or 50 extra soldiers added when captured
- Speed multiplier: 1.0x
- Hard to take (soldiers added on capture), but slow production

### SNOW
- Production: 0.8 soldiers/sec
- Defense bonus: 0
- Speed multiplier: 0.28x (armies move at 28% speed = ~3.6x slower)
- Armies traveling through snow regions are dramatically slowed

### SPEED
- Production: 0.8 soldiers/sec
- Defense bonus: 0
- Speed multiplier: 1.5x (armies move 50% faster)
- Strategic for fast troop movement

### ROCKY
- Production: 0 (none)
- HP: 0, ownerId: null (always)
- **Completely impassable**: cannot be targeted, owned, or traversed
- Armies must pathfind around rocky regions
- Acts as terrain obstacles that shape the map's strategic layout
- Never adjacent to another ROCKY or to SPAWN regions

---

## 15. Player Interaction / Controls

### 15.1 Sending Soldiers (Desktop)

**Drag Method:**
1. Mouse down on an owned region -- it becomes the first source.
2. Drag across other owned regions -- they are added to the selection (up to 12).
3. Release on a target region -- soldiers are sent from all selected sources.

**Click/Tap Method:**
1. Click/tap on a target region directly.
2. The system automatically selects up to 3 nearest owned regions within attack range.
3. Soldiers are sent from all auto-selected sources.

### 15.2 Sending Soldiers (Touch/Mobile)

- **Tap on own region**: Selects it (highlighted). Tap again on target to send.
- **Drag from own region**: Drag activation threshold = 8px. Then drag to target.
- Two-finger panning cancels any active selection.
- Haptic feedback (40ms vibration) on successful send.

### 15.3 Arrow Indicators

While dragging, dashed arrow lines show from all source regions to the cursor:
- **Green**: Valid target (non-owned, non-gate, non-rocky region)
- **Red**: Blocked target (gate, rocky, or invalid)
- **Gray**: Empty space (no region)

### 15.4 Abilities (Keyboard)

| Key | Ability |
|---|---|
| 1 | Missile |
| 2 | Nuclear |
| 3 | Barracks |
| 4 | Speed Boost (instant) |
| 5 | Freeze (instant) |
| ESC | Cancel targeting mode |

### 15.5 Optimistic Updates (Client-Side Prediction)

When a player sends soldiers, the client immediately:
1. Reduces the source region's HP by the expected amount.
2. Creates a preview army sprite that begins moving toward the target.
3. When the server confirms with `army_created`, the preview is replaced by the real army.

This eliminates the 400-800ms wait for server response.

---

## 16. Bot AI System

### 16.1 Decision Timing

- `BOT_DECISION_INTERVAL = 1500ms` (1.5 seconds between decisions)
- Ability decisions: every 3000ms (3 seconds)

### 16.2 Bot Strategies

**Reinforcement (70% priority when applicable):**
- Finds weak frontline regions (bordering enemies with <15 HP, or under siege).
- Sends soldiers from strong backend regions (>12 HP, no enemy neighbors) to reinforce.

**Attack:**
- Only attacks from regions with >8 soldiers.
- Evaluates all targetable neighbors and gate-accessible regions.
- Scoring considers:
  - Distance penalty (closer targets preferred)
  - Neutral targets: score = 60 - targetHP; towers get +40 bonus
  - Enemy targets: score = 50 - targetHP; towers +35, spawns +25
  - Safe capture bonus: +30 if `effectiveSoldiers >= target.hp * 1.3`
  - Weak source penalty: -25 if average remaining HP < 4
  - Random variation: +/- 10%

**Attrition-aware:** Bot calculates effective soldiers after travel attrition:
```
attritionLoss = floor(distance / ARMY_SPEED)
effectiveSoldiers = sentSoldiers - attritionLoss
```

**Unpredictability:** 10% chance to skip a turn even with a valid attack.

### 16.3 Bot Ability Usage

Priority order:
1. **Freeze**: When 3+ enemy armies are in flight.
2. **Speed Boost**: When 2+ own armies are moving.
3. **Missile**: On enemy border regions with >12 HP (highest HP preferred).
4. **Nuclear**: On enemy towers/spawns, or any enemy region with >8 HP.
5. **Barracks**: On safe interior regions (most own-neighbors, not towers/rocky/nuclearized, HP >= 5).

### 16.4 Bot Spawn Selection

During spawn selection, bots pick a random available region after a 1-4 second delay.

---

## 17. Ranking / ELO System

### 17.1 Rating System

- **ELO-based** with K-factor = 32.
- Default starting rating: **0**.
- Minimum rating: 0 (cannot go negative).

### 17.2 ELO Calculation

Standard ELO formula:
```
expectedWinner = 1 / (1 + 10^((loserRating - winnerRating) / 400))
winnerDelta = round(K * (1 - expectedWinner))
loserDelta = round(K * (0 - expectedLoser))
```

### 17.3 Leagues / Ranks

| Rank | Minimum Rating |
|---|---|
| Bronz (Bronze) | 0 |
| Gumus (Silver) | 800 |
| Altin (Gold) | 1000 |
| Elmas (Diamond) | 1200 |
| Usta (Master) | 1400 |

### 17.4 Promotion Rewards

When a player enters a new rank for the first time, they receive a one-time reward of **100 diamonds**. This reward is tracked per-user per-rank and cannot be earned again for the same rank.

### 17.5 Ranked Mode Specifics

- Only available in 1v1 mode (2 players, no bots).
- ELO is updated only for human players with valid user IDs.
- Post-game shows: old rating, new rating, delta, rank name, and any promotion.

---

## 18. Diamond Economy

### 18.1 Starting Balance

New players receive **500 diamonds** by default.

### 18.2 Earning Diamonds

| Event | Diamonds |
|---|---|
| Win ranked match | 5 |
| Win normal match | 2 |
| Win bot match | 1 |
| Lose any match | 0 |
| League promotion (one-time) | 100 |

### 18.3 Spending Diamonds

Diamonds are spent in the cosmetic store on:
- Army shape skins (circle, diamond, star, etc.)
- Player color skins (black, white)
- Other cosmetic items

Prices vary per item (e.g., 200 diamonds for common skins).

---

## 19. Win Conditions

### 19.1 Elimination

A player is **eliminated** when they lose all their regions (regions count drops to 0).

When eliminated:
- `player.eliminated = true`
- They receive a `game_over` event immediately.
- Their remaining armies continue traveling but have no home.

### 19.2 Victory

The game ends when **only 1 non-eliminated player remains**. That player is the winner.

### 19.3 Draw (Edge Case)

If all players are eliminated simultaneously (all reach 0 regions in the same tick), the game ends with `winner = null` (draw). This is extremely rare.

### 19.4 No Timer

There is **no game timer** that forces the game to end. Games continue indefinitely until a winner is determined by elimination.

---

## 20. Tutorial System

The tutorial is a **6-stage offline experience** that teaches core mechanics using a fixed 7-region hex map.

### 20.1 Tutorial Map

- 7 hexagonal regions arranged in a flower pattern (center + 6 neighbors).
- Hex radius: 130px, map: 1600x900.
- Layout:
  - **R0**: Center, NORMAL, 6 HP, neutral
  - **R1**: Top-left, MOUNTAIN, 8 HP, neutral, defenseBonus=25
  - **R2**: Top-right, NORMAL, 8 HP, neutral
  - **R3**: Left, SPAWN, 10 HP, **player start**
  - **R4**: Right, SPAWN, 10 HP, **bot start**
  - **R5**: Bottom-left, SNOW, 5 HP, neutral, speedMultiplier=0.28
  - **R6**: Bottom-right, TOWER, 6 HP, neutral

Tutorial uses modified constants:
- `ARMY_SPEED = 90 px/sec` (faster than real game for quicker feedback)
- `TOWER_PRODUCTION_RATE = 2.5` (higher than real game's 1.5)
- `PRODUCTION_INTERVAL = 1000ms`
- `BOT_TICK_INTERVAL = 3000ms`

### 20.2 Tutorial Stages

**Stage 1: Drag Mechanic**
- Goal: Drag soldiers from R3 (player spawn) to R0 (center).
- Only R3->R0 is allowed in this stage.
- Animated hand shows the drag gesture.
- Pulsing highlights on R3 (source, blue) and R0 (target, green).

**Stage 2: Production & Towers**
- Goal: Capture R6 (TOWER region).
- Teaches that regions produce soldiers over time.
- Explains towers produce 2.5x faster.
- Production system starts running.

**Stage 3: Mountain Regions**
- Goal: Capture R1 (MOUNTAIN).
- Teaches that mountains give defense bonus soldiers on capture.
- Teaches that mountain production is slower (0.5/sec).

**Stage 4: Snow Regions**
- Goal: Capture R5 (SNOW).
- Teaches that armies move ~3.5x slower in snow.
- Teaches that snow production is 0.8/sec.

**Stage 5: Abilities**
- Player receives 1 charge of each ability (missile, nuclear, barracks, speedBoost).
- R2 is given to the bot (15 HP).
- Player must use any one ability to proceed.
- Teaches ability targeting and effects.

**Stage 6: Bot Fight**
- Full battle against the tutorial bot.
- Production and bot AI are active.
- Player must eliminate the bot (capture all bot regions).
- Surrender button available.
- On victory: option to return to main menu or start a bot match.
- On defeat: option to retry or return to main menu.

---

## 21. Network Architecture Summary

### 21.1 Tick-Based State Updates

- Server runs at 10 ticks/second (100ms intervals).
- State updates use **delta compression**: only changed regions are sent.
- Army positions are **NOT sent** each tick -- the client predicts positions using `start position + target + speed`. Only army count changes (from attrition/collision) and destruction events are sent.
- Player data (charges, cooldowns, resources) is throttled to every **5th tick** (~500ms) to save bandwidth.

### 21.2 Per-Player Fog Filtering

Each player receives a different state update:
- Only dirty regions included.
- Stealth tower HP hidden for enemies.
- Army count changes filtered by visibility.
- Newly revealed regions include full data.
- Enemy player data is minimal (no ability charges, no cooldowns, no resources).

### 21.3 Key Events

| Event | Direction | Description |
|---|---|---|
| `game_start` | Server -> Client | Initial game data, map, players |
| `game_countdown` | Server -> Client | Countdown seconds |
| `spawn_selected` | Server -> All | Player chose a spawn |
| `spawn_phase_end` | Server -> All | All spawns finalized |
| `regions_reveal` | Server -> Client | Full region data after spawn phase |
| `state_update` | Server -> Client | Per-tick delta updates |
| `army_created` | Server -> Client | New army spawned (fog-filtered) |
| `army_destroyed` | Server -> Client | Army removed |
| `region_captured` | Server -> Client | Region ownership changed |
| `siege_started` | Server -> Client | Siege began on a region |
| `siege_ended` | Server -> Client | Siege concluded |
| `missile_applied` | Server -> Visible | Missile hit a region |
| `nuclear_applied` | Server -> Visible | Nuclear strike on region |
| `barracks_applied` | Server -> Visible | Region upgraded to tower |
| `speed_boost_applied` | Server -> Self | Speed boost activated |
| `freeze_applied` | Server -> All | All enemy armies frozen |
| `gate_teleport` | Server -> All | Army teleported through gate |
| `player_eliminated` | Server -> All | Player lost all regions |
| `game_over` | Server -> All | Game finished, winner announced |
| `send_soldiers` | Client -> Server | Request to send armies |
| `select_spawn` | Client -> Server | Spawn region selection |
| `use_missile` | Client -> Server | Use missile ability |
| `use_nuclear` | Client -> Server | Use nuclear ability |
| `use_barracks` | Client -> Server | Use barracks ability |
| `use_speed_boost` | Client -> Server | Use speed boost ability |
| `use_freeze` | Client -> Server | Use freeze ability |
| `build_building` | Client -> Server | Construct a building |

---

## Appendix: Complete Constants Table

```javascript
// Timing
TICK_RATE: 10                          // ticks per second
TICK_DURATION: 100                     // ms per tick

// Production
BASE_PRODUCTION_RATE: 1                // soldiers/sec (NORMAL, SPAWN)
TOWER_PRODUCTION_RATE: 1.5             // soldiers/sec
SPAWN_PRODUCTION_RATE: 1               // soldiers/sec
NEUTRAL_PRODUCTION_RATE: 0.05          // soldiers/sec (unowned regions)
MOUNTAIN_PRODUCTION_RATE: 0.5          // soldiers/sec
SNOW_PRODUCTION_RATE: 0.8              // soldiers/sec
SPEED_PRODUCTION_RATE: 0.8             // soldiers/sec

// Terrain Modifiers
MOUNTAIN_DEFENSE_BONUS: [10, 25, 50]   // random extra soldiers on capture
SNOW_SPEED_MULTIPLIER: 0.28            // armies at 28% speed in snow
SPEED_REGION_MULTIPLIER: 1.5           // armies at 150% speed in speed zones

// Army
ARMY_SPEED: 25                         // pixels/second
ARMY_COLLISION_RADIUS: 20              // pixels
SOLDIER_SPLIT_RATIO: 0.5              // send 50% of soldiers

// Siege
SIEGE_DAMAGE_PER_SECOND: 2.0          // (unused in current implementation)
SIEGE_ATTRITION_PER_SECOND: 0.3       // (unused in current implementation)
SIEGE_POSITION_OFFSET: 30             // px visual offset for siege army
SIEGE_MAX_ARMIES_PER_REGION: 3        // max concurrent siege armies

// Siege (actual implementation)
// DAMAGE_PERCENT: 0.10                // 10% of opposing force per second
// DEFENSE_BONUS: 1.20                 // defender 20% bonus
// Wall bonus: +0.50                   // total 1.70 with wall

// Abilities
MISSILE_COOLDOWN: 10000                // 10 sec
MISSILE_DAMAGE_RATIO: 0.5             // kills 50% of soldiers
MISSILE_INITIAL_CHARGES: 0

NUCLEAR_COOLDOWN: 10000                // 10 sec
NUCLEAR_DURATION: 3000                 // 3 sec production disable
NUCLEAR_INITIAL_CHARGES: 0

BARRACKS_COOLDOWN: 10000               // 10 sec
BARRACKS_INITIAL_CHARGES: 0

SPEED_BOOST_COOLDOWN: 10000            // 10 sec
SPEED_BOOST_DURATION: 10000            // 10 sec effect
SPEED_BOOST_MULTIPLIER: 1.25          // +25% army speed
SPEED_BOOST_INITIAL_CHARGES: 0

FREEZE_COOLDOWN: 30000                 // 30 sec
FREEZE_ARMY_DURATION: 1500             // 1.5 sec freeze
FREEZE_INITIAL_CHARGES: 0

// Combat
COMBAT_POWER_VARIATION: 0.2           // +/- 20% (unused in siege model)

// Map
MAP_WIDTH: 1600                        // pixels
MAP_HEIGHT: 900                        // pixels
MIN_NEUTRAL_HP: 3
MAX_NEUTRAL_HP: 30
SPAWN_HP: 40

// Visibility
FOG_DEPTH: 2                           // BFS hops visible
ATTACK_RANGE: 1                        // max hops to send armies

// Resources
RESOURCE_TYPES: ['iron', 'crystal', 'uranium']
RESOURCE_MIN_RATE: 0.8                 // min per second
RESOURCE_MAX_RATE: 1.2                 // max per second

// Game Flow
COUNTDOWN_SECONDS: 3
SPAWN_SELECTION_SECONDS: 15

// Bot
BOT_DECISION_INTERVAL: 1500            // 1.5 sec between decisions

// Gate System (from GateSystem.js)
GATE_TELEPORT_THRESHOLD: 15            // pixels to trigger teleport
GATE_EXIT_OFFSET: 20                   // pixels offset after teleport
GATE_COOLDOWN_MS: 500                  // per-army teleport cooldown
MIN_GATE_HOP_DISTANCE: 4              // min hops between paired gates
MIN_GATE_EUCLIDEAN_DISTANCE: 200      // min pixels between paired gates
MAX_GATE_ATTEMPTS: 3                   // placement retry attempts

// Pathfinding (from PathfindingSystem.js)
EXPAND_MARGIN: 18                      // px outward expansion for rocky polygons

// Movement safety
ARMY_MAX_LIFETIME: 45000               // ms before army auto-destroyed

// Production system
MAX_HP_DEFAULT: 300                    // base max soldiers per region
HP_DECAY_RATE: 0.01                    // 1% per second when over cap
INTEREST_RATE: 0.01                    // 1% of HP per second bonus production

// Ranking
ELO_K_FACTOR: 32
ELO_DEFAULT_RATING: 0
RANK_BRONZ: 0
RANK_GUMUS: 800
RANK_ALTIN: 1000
RANK_ELMAS: 1200
RANK_USTA: 1400
PROMOTION_REWARD: 100                  // diamonds

// Diamonds
DEFAULT_DIAMONDS: 500                  // starting balance
DIAMOND_WIN_RANKED: 5
DIAMOND_WIN_NORMAL: 2
DIAMOND_WIN_BOT: 1
DIAMOND_LOSS: 0
```

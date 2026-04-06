# KUST 10 - Pillows: Handover Wiki Index

**Last Updated**: 2026-04-06
**Purpose**: Master index for the complete game handover documentation. Start here to find anything.

---

## Document Map

| # | Document | Scope | Lines | Status |
|---|----------|-------|-------|--------|
| 00 | [Game Overview & Concept](00-overview-and-concept.md) | Game identity, features, tech stack, current state | 345 | Complete |
| 01 | [Visual Theme & Design System](01-visual-theme-design.md) | Colors, typography, icons, CSS, per-page styles | 1411 | Complete |
| 02 | [Layout & Positioning](02-layout-positioning.md) | Screen layouts, element positions, z-index, responsive | 1423 | Complete |
| 03 | [Gameplay Mechanics & Balance](03-gameplay-mechanics.md) | Regions, armies, siege, abilities, resources, economy | 1114 | Complete |
| 04 | [Technical Architecture](04-technical-architecture.md) | Socket protocol, DB schema, game loop, auth, deploy | 1896 | Complete |
| 05 | [Wiki Index](05-wiki-index.md) | This file -- master index and glossary | 308 | Complete |
| 06 | [Backend Documentation](06-backend-documentation.md) | Server, 35+ socket events, game logic, bot AI, store | 2279 | Complete |
| 07 | [Frontend Documentation](07-frontend-documentation.md) | Phaser scenes, React components, render pipeline | 1858 | Complete |
| 08 | [Responsive & Mobile](08-responsive-mobile.md) | Touch, pinch-zoom, breakpoints, mobile adaptation | 1459 | Complete |
| 09 | [Technical Architecture Deep Dive](09-technical-architecture-deep-dive.md) | Client-side prediction, SOLID, fog security, perf engineering | 894 | Complete |
| 10 | [History & Lessons Learned](10-history-lessons-learned.md) | Development history, failed approaches, successful patterns | 1165 | Complete |

---

## Quick Start

**New to the project?** Read in this order:
1. [Game Overview & Concept](00-overview-and-concept.md) -- Understand what the game is
2. [Gameplay Mechanics & Balance](03-gameplay-mechanics.md) -- Understand how the game works
3. [History & Lessons Learned](10-history-lessons-learned.md) -- What was tried, what worked, what failed
4. [Technical Architecture](04-technical-architecture.md) -- Understand how it is built
5. [Tech Deep Dive](09-technical-architecture-deep-dive.md) -- Client-side prediction, SOLID, performance
6. [Backend Documentation](06-backend-documentation.md) -- Server, DB, socket events, game logic
7. [Frontend Documentation](07-frontend-documentation.md) -- Phaser scenes, React, rendering
8. [Visual Theme & Design System](01-visual-theme-design.md) -- Understand the look and feel
9. [Layout & Positioning](02-layout-positioning.md) -- Understand screen structure
10. [Responsive & Mobile](08-responsive-mobile.md) -- Touch, zoom, mobile adaptation

---

## Detailed Table of Contents

### 00 - Game Overview & Concept
- [Game Identity](00-overview-and-concept.md#1-game-identity) -- Name, genre, platform, elevator pitch, target audience, inspirations
- [Core Concept](00-overview-and-concept.md#2-core-concept) -- Uniqueness, gameplay loop, win condition, player counts
- [Feature List](00-overview-and-concept.md#3-feature-list) -- Core, extended, social, and monetization features (all with implementation status)
- [Technology Stack](00-overview-and-concept.md#4-technology-stack-summary) -- Full tech stack table with purposes
- [Game Modes](00-overview-and-concept.md#5-game-modes) -- Bot Match, Online PvP, Ranked, Tutorial
- [Maps](00-overview-and-concept.md#6-maps) -- Available maps, region counts, generation system
- [Monetization](00-overview-and-concept.md#7-monetization) -- Diamond economy, store categories, rarity tiers, ranked leagues
- [Localization](00-overview-and-concept.md#8-localization) -- 12 supported languages, i18n system
- [Current State Assessment](00-overview-and-concept.md#9-current-state-assessment) -- Strengths, known issues, technical debt
- [Scene Flow](00-overview-and-concept.md#appendix-scene-flow) -- Scene transition diagram, HUD architecture

### 01 - Visual Theme & Design System
- Color Palette -- Ocean blues, UI dark theme, player colors (16-color high-contrast pool)
- Typography -- Font families, sizes, weights across UI elements
- Region Rendering -- Fill, stroke, glow, terrain indicators, fog of war visuals
- Army Visuals -- Default shape, custom shapes (store), trails, interpolation
- Ability Icons -- Phaser graphics-drawn icons (missile, nuclear, barracks, speed, freeze)
- UI Component Patterns -- Panels, buttons, dialogs, toasts, badges, toggles
- Terrain Visual Language -- Mountain (shield icon), Snow (snowflake), Tower (gold), Rocky (textured), Speed (arrows)
- Gate Visuals -- Color-matched portal pairs, animations, teleport effects
- Game Over Effects -- Victory/defeat screens, particle effects
- Responsive Design Tokens -- Mobile, tablet, desktop breakpoints and scaling

### 02 - Layout & Positioning
- Screen Layout Breakdown -- Header, left panel, right panel, bottom bar, center overlays
- Header Bar -- Logo, mode badge, map badge, resources, timer, FPS/ping, controls
- Left Panel -- Player list, stats panel (map control, production, armies), moving armies, enemy armies
- Right Panel -- Ability bar (vertical, 5 slots)
- Bottom Bar -- Building bar
- Center Overlays -- Spawn selection, map preview countdown, quit dialog, eliminated dialog
- Spawn Phase UI -- Selection overlay with countdown timer
- Region Tooltip -- Hover tooltip showing power, building, resource
- Toast System -- Notification toasts (bottom-center)
- Settings Panel -- In-game toggle panel
- Mobile Layout -- Hamburger toggle, adaptive sizing, safe area insets
- Camera System -- Pan, zoom, pinch-to-zoom, auto-focus
- Menu Screens -- Auth, Play tab, Store tab, Friends tab, Profile tab, Ranked tab, Settings

### 03 - Gameplay Mechanics & Balance
- Region Types -- All 7 types with production rates, special effects, and strategic roles
- Production System -- Auto-production rates, tower multipliers, neutral decay, nuclear disable
- Army Mechanics -- Sending (50% split), multi-select, recall, movement speed, collision
- Siege System -- Tug-of-war damage, attrition, position offset, max armies per region
- Combat System -- Army-vs-army collision, power variation (+/-20%), field resolution
- Terrain Effects -- Snow (0.28x speed), Speed (1.5x speed), Mountain (defense bonus), Rocky (impassable)
- Ability System -- 5 abilities with cooldowns, charges, targeting rules
  - Missile: 50% HP damage to enemy region
  - Nuclear: Permanently stops production
  - Barracks: Converts own region to Tower (2.5x production)
  - Speed Boost: 25% army speed for 10 seconds
  - Freeze: Freezes all enemy armies for 1.5 seconds
- Gate System -- Portal pairs, pathfinding integration, strategic value
- Fog of War -- BFS depth-2 visibility, attack range depth-1
- Resource System -- Iron, Crystal, Uranium with per-region rates
- Building System -- 7 building types with resource costs
- Win Condition -- Last player standing, elimination mechanics
- Bot AI -- Decision interval, targeting logic, difficulty
- Ranked Balance -- ELO K-factor, rating ranges, matchmaking expansion
- Economy Balance -- Diamond earnings, store pricing, daily rewards

### 04 - Technical Architecture
- Project Structure -- Monorepo layout (client/, server/, shared/, mobile/)
- Client Architecture
  - Scene System -- Boot, Auth, Menu, Lobby, Game, GameOver, Tutorial, Friends
  - Rendering Systems -- MapRenderer, ArmyRenderer, GateRenderer, DOMFogManager, SiegeRenderer
  - Input Systems -- SelectionSystem, CameraSystem (pan/zoom/pinch)
  - UI Systems -- AbilityBar (Phaser), GameHUD (React), GameBridge (event bridge)
  - Network -- SocketManager (singleton), GameSync (state synchronization), EventTypes
  - Audio -- SoundManager (Web Audio API), MusicManager
  - i18n -- Translation system with React hooks and Phaser integration
  - Config -- maps.js (single source of truth), device detection, color utilities
- Server Architecture
  - Game Engine -- GameRoom, GameLoop, GameState (tick-based ECS-like)
  - Systems -- ProductionSystem, MovementSystem, CollisionSystem, ConquestSystem, VisibilitySystem, PathfindingSystem
  - Ability Systems -- BombSystem (missile), NuclearSystem, BarracksSystem, SpeedBoostSystem
  - Map Generation -- MapGenerator, GeoJSON processing, neighbor calculation
  - Gate System -- GateSystem (teleportation logic)
  - Bot AI -- BotAI (decision-making)
  - Win Condition -- WinCondition (elimination detection)
  - Stun System -- StunSystem (crowd control)
- Networking
  - Socket.IO Events -- Client-to-server and server-to-client event catalog
  - Delta State Updates -- Only changed data sent per tick
  - Army Position Tracking -- Delta compression for position updates
  - Player Data Throttling -- Non-critical data sent less frequently
- Authentication -- JWT-based, bcrypt passwords, email verification, guest mode
- Data Layer -- PostgreSQL (persistent), Redis (cache), in-memory fallback
- Ranked System -- ELO calculation, matchmaking queue, rating expansion
- Friends System -- Player codes, request/accept flow
- Daily Rewards -- 30-day streak cycle, diamond payouts
- Store System -- SkinCatalog, purchase/equip/unequip flow
- Deployment -- PM2, Plesk VPS, build pipeline
- Shared Code -- gameConstants.js, eventTypes.js, regionTypes.js
- Mobile -- Capacitor config, iOS/Android builds, live reload dev

---

## Key File Reference

### Configuration & Constants
| File | Purpose |
|------|---------|
| `shared/gameConstants.js` | All game balance numbers (tick rate, production, army speed, abilities, siege, etc.) |
| `shared/eventTypes.js` | Socket.IO event name constants |
| `shared/regionTypes.js` | Region type enum (NORMAL, TOWER, SPAWN, MOUNTAIN, SNOW, ROCKY, SPEED) |
| `client/src/config/maps.js` | Map definitions (id, regions, player counts) -- single source of truth |
| `client/src/config.js` | Client constants (colors, server URL) |

### Client Entry Points
| File | Purpose |
|------|---------|
| `client/src/index.js` | Phaser game configuration and bootstrap |
| `client/src/scenes/GameScene.js` | Main gameplay scene (orchestrates all systems) |
| `client/src/game-ui/GameHUD.jsx` | React-based in-game HUD |
| `client/src/game-ui/GameBridge.js` | Event bridge between Phaser and React |
| `client/src/network/SocketManager.js` | Singleton Socket.IO client |
| `client/src/network/GameSync.js` | Server-client state synchronization |

### Server Entry Points
| File | Purpose |
|------|---------|
| `server/src/index.js` | Express + Socket.IO server entry |
| `server/src/game/GameRoom.js` | Game lifecycle (room creation, player management, game flow) |
| `server/src/game/GameLoop.js` | Tick-based game loop (10 tps) |
| `server/src/game/GameState.js` | Central game state container |
| `server/src/game/MapGenerator.js` | GeoJSON to game map conversion |
| `server/src/socket/handlers/gameHandler.js` | Socket event handlers for gameplay |
| `server/src/socket/index.js` | Socket.IO connection setup |

### Rendering Systems
| File | Purpose |
|------|---------|
| `client/src/systems/MapRenderer.js` | Region drawing, ocean, shadow, glow, terrain icons |
| `client/src/systems/ArmyRenderer.js` | Army sprites, interpolation, trails |
| `client/src/systems/GateRenderer.js` | Portal rendering and animation |
| `client/src/systems/SiegeRenderer.js` | Siege combat visualization |
| `client/src/systems/SelectionSystem.js` | Drag-and-drop army sending |
| `client/src/systems/CameraSystem.js` | Pan, zoom, pinch-to-zoom |
| `client/src/systems/AbilityBar.js` | Ability slot rendering and input |
| `client/src/systems/DOMFogManager.js` | Fog of War rendering |

### Game Logic (Server)
| File | Purpose |
|------|---------|
| `server/src/game/ProductionSystem.js` | Soldier auto-production |
| `server/src/game/MovementSystem.js` | Army movement, terrain speed effects |
| `server/src/game/CollisionSystem.js` | Army-vs-army collision |
| `server/src/game/ConquestSystem.js` | Region capture logic |
| `server/src/game/VisibilitySystem.js` | Fog of war calculation |
| `server/src/game/PathfindingSystem.js` | Pathfinding with gate shortcuts |
| `server/src/game/GateSystem.js` | Teleportation portal logic |
| `server/src/game/BotAI.js` | Bot decision-making |
| `server/src/game/WinCondition.js` | Elimination and victory detection |
| `server/src/game/BombSystem.js` | Missile ability |
| `server/src/game/NuclearSystem.js` | Nuclear ability |
| `server/src/game/BarracksSystem.js` | Barracks ability |
| `server/src/game/SpeedBoostSystem.js` | Speed boost ability |

---

## Glossary

### Map & Territory

| Term | Definition |
|------|-----------|
| **Region** | A bounded area on the map that can be owned by a player. Each region has HP (soldier count), a type, and a production rate. Derived from GeoJSON geographic boundaries. |
| **Fog of War** | Unexplored/unseen areas of the map. Players can only see regions within BFS depth-2 of their owned regions. Hidden regions appear fogged. |
| **Gate** | A teleportation portal. Gates come in color-matched pairs -- an army entering one gate exits instantly from its paired gate elsewhere on the map. |
| **Tower** | A special region type with 1.5x production rate (1.5 soldiers/second vs. normal 1.0). Strategically valuable. Can also be created via the Barracks ability. |
| **Mountain** | A region type with low production (0.5/sec) but grants a random defense bonus (+10, +25, or +50 soldiers) when captured. |
| **Snow** | A region type that slows armies passing through to 28% speed (~3.5x slower). Production rate is 0.8/sec. |
| **Speed** | A region type that accelerates armies passing through to 150% speed. Production rate is 0.8/sec. |
| **Rocky** | An impassable region type. Cannot be captured, cannot be traversed. Acts as a terrain wall/obstacle. |
| **Spawn** | A region designated as a player's starting position. Has 1.0/sec production and starts with 40 HP. |
| **Neutral** | An unowned region. Has very slow production (0.05/sec = 1 soldier per 20 seconds). Starts with 3-30 HP. |

### Combat & Armies

| Term | Definition |
|------|-----------|
| **Army** | A group of soldiers moving from one region to another. Created when a player drags from an owned region to a target. Contains 50% of the source region's soldiers. |
| **Siege** | A tug-of-war combat that occurs when an army attacks a defended (owned) region. The attacking army deals damage over time while suffering attrition, rather than instant resolution. |
| **HP** | Hit Points -- the soldier count of a region. Serves as both offensive power (determines army size when sending) and defensive strength (must be depleted to capture). |
| **Production Rate** | How many soldiers a region generates per second. Varies by region type (Normal: 1.0, Tower: 1.5, Mountain: 0.5, Snow/Speed: 0.8, Rocky: 0, Neutral: 0.05). |
| **Defense Bonus** | Extra soldiers added to a Mountain region immediately after capture (+10, +25, or +50 randomly). |
| **Speed Multiplier** | Terrain modifier on army movement speed. Snow: 0.28x, Speed: 1.5x, Normal: 1.0x. Stacks with Speed Boost ability (1.25x). |
| **Collision** | When two opposing armies come within 20px of each other on the map. The larger army wins, losing soldiers equal to the smaller army's count. |
| **Army Recall** | Ability to call back a moving army to its source region. |

### Abilities

| Term | Definition |
|------|-----------|
| **Missile** | Ability (key: 1). Deals 50% HP damage to a target enemy region. 10-second cooldown. |
| **Nuclear** | Ability (key: 2). Permanently stops production in a target enemy region. 10-second cooldown. |
| **Barracks** | Ability (key: 3). Converts an owned region into a Tower type (1.5x production). 10-second cooldown. |
| **Speed Boost** | Ability (key: 4). Increases all of your armies' speed by 25% for 10 seconds. 10-second cooldown. |
| **Freeze** | Ability (key: 5). Freezes all enemy armies in place for 1.5 seconds. 30-second cooldown. |
| **Charge** | A use-count for an ability. Charges start at 0 and are earned randomly (1 charge) each time the player captures a region. |
| **Cooldown** | The time after using an ability before it can be used again. All abilities except Freeze have 10-second cooldowns; Freeze has 30 seconds. |

### Economy & Progression

| Term | Definition |
|------|-----------|
| **Diamond** | The in-game premium currency. Earned through wins and daily rewards. Spent in the store and on ranked entry fees. |
| **Skin** | A cosmetic item that changes the player's color on the map. |
| **League** | A ranked tier based on ELO rating: Bronze (0-799), Silver (800-999), Gold (1000-1199), Diamond (1200-1399), Master (1400+). |
| **PR / RP (Rating Points)** | A player's ELO rating number. Starting rating is 1000 (Gold league). Also referred to as "Power Rating" in some contexts. |
| **Daily Reward** | Diamond bonus earned by logging in each day. Follows a 30-day streak cycle that resets after completion. |

### Technical Terms

| Term | Definition |
|------|-----------|
| **Tick** | One cycle of the server game loop. The server runs at 10 ticks per second (100ms per tick). All game logic (production, movement, collision, conquest) is processed each tick. |
| **Delta Update** | Network optimization where only changed data is sent from server to client each tick, rather than full state snapshots. Reduces bandwidth. |
| **Client-Side Prediction** | Technique where the client simulates game actions locally before receiving server confirmation, reducing perceived latency. Referenced in project agents but not fully implemented. |
| **Viewport Culling** | Rendering optimization where only regions and armies visible within the current camera viewport are drawn. Critical for large maps. |
| **BFS (Breadth-First Search)** | Algorithm used for fog-of-war visibility calculation. Starting from owned regions, BFS explores neighbors up to a configured depth (FOG_DEPTH=2). |
| **GeoJSON** | Standard format for geographic data. Maps are stored as GeoJSON files with polygon boundaries for each region (country, province, etc.). |
| **Interpolation** | Smooth visual movement of armies between server-sent positions. The client interpolates army positions between ticks for fluid animation even at 10 tps. |
| **Socket.IO** | Real-time bidirectional communication library used for all game state synchronization between client and server. |
| **GameBridge** | An event emitter pattern that connects Phaser game scenes to the React HUD layer, allowing cross-framework communication. |
| **ELO** | Rating system (named after Arpad Elo) used for ranked matchmaking. K-factor of 32 determines rating change magnitude. |

---

## Existing Documentation Reference

These documents in the `claude_documentations/` folder contain additional implementation details:

| Document | Contents |
|----------|----------|
| `KUST10-game-design-document.md` | Original GDD with design philosophy and feature plans |
| `KUST10-complete-game-documentation.md` | Comprehensive technical documentation of all systems |
| `project-scaffolding.md` | Initial project setup documentation |
| `client-implementation.md` | Client-side implementation details |
| `map-selection-feature.md` | Map selection UI implementation |
| `geojson-map-generation.md` | GeoJSON processing and map generation |
| `game-over-effects.md` | Game over screen implementation |
| `gate-system-implementation.md` | Gate/portal system implementation |
| `ranked-system.md` | Ranked mode and ELO system |
| `sound-effects.md` | Audio system implementation |
| `neutral-region-production.md` | Neutral region production mechanics |
| `gate-fixes-colors-loops-visuals.md` | Gate visual improvements |
| `bomb-terrain-features.md` | Missile ability and terrain features |
| `ability-speed-system.md` | Speed boost ability implementation |
| `optimization-standards.md` | Delta state, fog filtering, compression patterns |
| `game-handbook.md` | Player-facing game handbook |

---

## Cross-Reference: Where to Find Answers

| Question | Document |
|----------|----------|
| What is this game about? | [00 - Overview](00-overview-and-concept.md#1-game-identity) |
| What are the game modes? | [00 - Overview](00-overview-and-concept.md#5-game-modes) |
| What colors does the UI use? | [01 - Visual Theme](01-visual-theme-design.md) |
| How are regions rendered? | [01 - Visual Theme](01-visual-theme-design.md) |
| Where is the player list on screen? | [02 - Layout](02-layout-positioning.md) |
| How does mobile layout differ? | [02 - Layout](02-layout-positioning.md) |
| How does army combat work? | [03 - Mechanics](03-gameplay-mechanics.md) |
| What do the abilities do? | [03 - Mechanics](03-gameplay-mechanics.md) or [00 - Overview](00-overview-and-concept.md#3-feature-list) |
| How does ranked matchmaking work? | [03 - Mechanics](03-gameplay-mechanics.md) |
| What are the game constants? | [03 - Mechanics](03-gameplay-mechanics.md) or `shared/gameConstants.js` |
| How is the project structured? | [04 - Architecture](04-technical-architecture.md) |
| How does networking work? | [04 - Architecture](04-technical-architecture.md) |
| How do I deploy the server? | [04 - Architecture](04-technical-architecture.md) |
| How do I run the project locally? | [04 - Architecture](04-technical-architecture.md) or `README.md` |
| What does term X mean? | [05 - Wiki Index (this file)](#glossary) |
| Where is file X? | [05 - Wiki Index (this file)](#key-file-reference) |

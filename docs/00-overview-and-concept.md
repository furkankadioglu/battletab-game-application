# KUST 10 - Pillows: Game Overview & Concept

**Last Updated**: 2026-04-06
**Version**: 0.14.x (Active Development)
**Status**: Playable Alpha -- Core systems functional, polish ongoing

---

## 1. Game Identity

### Name & Genre
- **Name**: KUST 10 - Pillows
- **Genre**: Online Multiplayer Real-Time Strategy (RTS)
- **Platform**: Web Browser (desktop + mobile), iOS, Android (via Capacitor)
- **Language of Origin**: Turkish (primary audience), with 12-language localization

### Elevator Pitch

KUST 10 - Pillows is a fast-paced, browser-based real-time strategy game where players compete to conquer territory on real-world map layouts. Players drag to send armies between regions, capture neutral and enemy territory, use tactical abilities, and race to eliminate all opponents. Matches last 3-10 minutes, blending the instant accessibility of Territorial.io with deeper mechanics like terrain types, teleportation gates, MOBA-style abilities, a ranked ELO system, and a cosmetic store economy.

### Target Audience
- **Primary**: Casual-to-competitive strategy gamers aged 13-30
- **Secondary**: Mobile gamers looking for quick competitive sessions
- **Tertiary**: .io game community (Territorial.io, OpenFront.io, Agar.io players)
- **Market**: Turkish-speaking players first, global expansion via localization

### Inspirations
| Game | What We Borrow |
|------|---------------|
| **Territorial.io** | Core land-grab RTS loop, drag-to-send armies, real-world map shapes |
| **OpenFront.io** | Region-based conquest, minimalist art style |
| **State.io** | Simple army movement, quick matches |
| **League of Legends** | Ability bar with cooldowns, charge system, ranked leagues |
| **Clash Royale** | Quick match loop, league progression, cosmetic monetization |

---

## 2. Core Concept

### What Makes This Game Unique?

1. **Speed vs. Strategy Tension**: The core design philosophy. Fast players capture many regions but spread thin. Slow, strategic players build power but lose territory. The winner balances both.
2. **Real-World Maps**: Players fight over Turkey, Poland, China, and more -- maps derived from actual GeoJSON geographic data, giving each match a familiar and distinct feel.
3. **Terrain Diversity**: Seven region types (Normal, Tower, Mountain, Snow, Rocky, Speed, Spawn) create tactical depth -- mountains give defense bonuses, snow slows armies, speed zones accelerate them, rocky terrain is impassable.
4. **MOBA-Style Abilities**: Five active abilities (Missile, Nuclear, Barracks, Speed Boost, Freeze) earned by conquering regions, adding a layer of tactical decision-making uncommon in .io strategy games.
5. **Teleportation Gates**: Color-matched portal pairs on maps allow instant army transport, creating strategic chokepoints and flanking opportunities.
6. **Siege Combat**: When armies attack defended regions, a tug-of-war siege mechanic plays out over time rather than instant resolution.

### Core Gameplay Loop (5 steps)

1. **Spawn**: Choose your starting region on the map (15-second selection phase).
2. **Expand**: Drag from your regions to neutral territory to capture them. Each region auto-produces soldiers over time.
3. **Build Power**: Capture Tower regions for faster production, Mountain regions for defense bonuses, and accumulate ability charges.
4. **Engage**: Attack enemy regions, use abilities (Missile, Nuclear, Barracks, Speed Boost, Freeze) to gain advantage, and manage army positioning across the map.
5. **Dominate**: Eliminate all opponents by capturing every one of their regions. Last player standing wins.

### Win Condition
- **Elimination**: A player is eliminated when they lose all their regions.
- **Victory**: The last remaining player wins the match.
- In multiplayer FFA (Free-for-All), players are eliminated one by one until a single winner remains.

### Player Count
| Map | Min Players | Max Players |
|-----|-------------|-------------|
| Turkey | 2 | 4 |
| Poland | 2 | 4 |
| China | 2 | 4 |

Bot players fill remaining slots in Bot Match mode.

---

## 3. Feature List

### Core Features (MVP -- Implemented)
- [x] Real-time territory conquest with drag-to-send army controls
- [x] Multi-region selection (hold and sweep across multiple owned regions)
- [x] Seven terrain types with distinct gameplay effects
- [x] Automatic soldier production per region
- [x] Army-vs-army collision in the field
- [x] Siege combat system (tug-of-war at defended regions)
- [x] Five active abilities with cooldowns and charge system
- [x] Teleportation gate system (color-matched portal pairs)
- [x] Fog of War (BFS depth-2 visibility from owned regions)
- [x] Bot AI opponents
- [x] Real-world GeoJSON-based maps (Turkey, Poland, China)
- [x] Game timer and scoreboard
- [x] Spawn point selection phase
- [x] Map preview countdown before match start

### Extended Features (Implemented)
- [x] Resource system (Iron, Crystal, Uranium) with per-region production
- [x] Building system (City Center, Barracks, Wall, Iron Dome, Stealth Tower, Drone Facility, Missile Base)
- [x] Army recall (call back moving armies)
- [x] Region hover tooltips showing power, buildings, resources
- [x] Fullscreen toggle
- [x] FPS and ping counters
- [x] In-game settings panel (glow, particles, FPS, ping toggles)
- [x] Sound effects (Web Audio API: bubble, capture, teleport, bomb)
- [x] Background music system
- [x] Mobile-responsive HUD with hamburger menu
- [x] Capacitor-based native mobile app (iOS + Android)

### Social Features (Implemented)
- [x] User registration with email verification (OneSignal)
- [x] Login / guest mode
- [x] Password reset via email code
- [x] Friends system (add by player code, accept/reject requests)
- [x] Player profiles with statistics (played, won, lost)
- [x] Leaderboard

### Monetization Features (Implemented)
- [x] Diamond currency (earned through wins and daily rewards)
- [x] Cosmetic store (skins, army shapes, trail effects, capture effects)
- [x] Four rarity tiers (Common, Rare, Epic, Legendary)
- [x] Ranked mode entry fee (1 diamond per match)
- [x] League promotion reward (+100 diamonds)
- [x] Daily login reward system (30-day streak cycle)

---

## 4. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Game Engine** | PhaserJS 3.70 | 2D rendering, scenes, input, camera |
| **UI Framework** | React 18 | Menu system, in-game HUD, overlays |
| **Bundler** | Vite 5 | Fast dev server, production builds |
| **Backend** | Express.js (Node.js) | REST API, HTTP server |
| **Realtime** | Socket.IO | Bidirectional game state sync |
| **Database** | PostgreSQL | Persistent user data, rankings |
| **Cache** | Redis | Session cache, matchmaking queues |
| **Mobile** | Capacitor | iOS/Android native shell wrapping web build |
| **Process Manager** | PM2 | Production server management |
| **Hosting** | Plesk VPS | Server deployment at kust.frkn.com.tr |
| **Email** | OneSignal | Email verification, password reset |
| **Language** | JavaScript (ES Modules) | Full-stack, shared code between client/server |

### Architecture Highlights
- **Shared Constants**: `shared/gameConstants.js` and `shared/eventTypes.js` are used by both client and server, ensuring consistency.
- **Tick-Based Simulation**: Server runs at 10 ticks/second (100ms per tick). Client interpolates between ticks for smooth rendering.
- **Delta State Updates**: Only changed data is sent over the network to minimize bandwidth.
- **Viewport Culling**: Client only renders what is visible on screen.
- **In-Memory Fallback**: Server can run without Redis or PostgreSQL for development (falls back to in-memory stores).

---

## 5. Game Modes

### Bot Match
- **Description**: Single player vs. AI bot(s)
- **Players**: 1 human + 1 bot (2-player maps)
- **Matchmaking**: Instant start, no queue
- **Reward**: +1 diamond on win
- **Purpose**: Practice, learning, casual play

### Online PvP
- **Description**: Real-time match against human opponents
- **Players**: 2 humans
- **Matchmaking**: Queue-based, searches for available opponent
- **Reward**: +2 diamonds on win
- **Purpose**: Competitive casual play

### Ranked
- **Description**: ELO-rated competitive match
- **Players**: 2 humans (ELO-based matchmaking)
- **Entry Fee**: 1 diamond
- **Matchmaking**: Rating-based (+/- 200 range, expanding every 15s after 30s wait)
- **Reward**: +5 diamonds on win, ELO rating change
- **Restriction**: Registered accounts only (no guests)
- **Purpose**: Competitive ladder climbing

### Tutorial
- **Description**: Guided 6-stage learning experience
- **Stages**:
  1. Sending Troops (drag mechanic)
  2. Production & Towers (economy basics)
  3. Mountain Regions (defense bonuses)
  4. Snow Regions (movement speed effects)
  5. Abilities (Q, W, E, R, T usage)
  6. Bot Battle (full practice match)
- **Purpose**: Onboarding new players

---

## 6. Maps

### Available Maps

| Map | Regions | Min Players | Max Players | Source |
|-----|---------|-------------|-------------|--------|
| **Turkey** | 91 | 2 | 4 | Turkey 81 provinces (GeoJSON) |
| **Poland** | 73 | 2 | 4 | Poland administrative regions |
| **China** | 34 | 2 | 4 | China provinces |

### Map Generation System
- Maps are defined in `client/src/config/maps.js` (single source of truth for both React and Phaser menus)
- GeoJSON files are stored in `client/public/maps/` (client) and `server/src/game/maps/` (server)
- `MapGenerator.js` processes GeoJSON data into game regions with:
  - Unique region IDs
  - Neighbor adjacency lists (8px threshold for island bridging)
  - Center points for rendering
  - Random terrain type assignment (Tower, Mountain, Snow, Speed, Rocky distribution)
  - Gate pair placement
  - Spawn point candidates
- Additional GeoJSON files exist for future maps: USA, Russia, UAE, South America, Africa, Italy, Portugal, Brazil, Europe, Dubai, London, Barcelona

### Map Dimensions
- Standard: 1600 x 900 pixels
- Large maps (e.g., South Atlantic): 4000 x 2800 pixels with frustum culling

---

## 7. Monetization

### Diamond Currency
Diamonds are the single in-game currency used for:
- Purchasing cosmetics in the store
- Ranked match entry fee (1 diamond)

### Earning Diamonds
| Source | Amount |
|--------|--------|
| Bot match win | +1 diamond |
| Online PvP win | +2 diamonds |
| Ranked win | +5 diamonds |
| League promotion | +100 diamonds |
| Daily login reward | +5 to +50 diamonds (varies by streak day) |

### Store Categories
| Category | Items | Price Range | Description |
|----------|-------|-------------|-------------|
| **Skins** | 2 | 1000 diamonds | Player color override (Black, White) |
| **Army Shapes** | 5 | 150-1000 diamonds | Circle, Diamond, Star, Shield, Hexagon |
| **Trail Effects** | 4 | 300-2000 diamonds | Sparkle, Fire, Ice, Rainbow |
| **Capture Effects** | 4 | 400-2500 diamonds | Sparkle, Shockwave, Flames, Lightning |

### Rarity Tiers
| Rarity | Examples | Price Range |
|--------|----------|-------------|
| Common | Circle, Diamond shapes | 150-200 |
| Rare | Star shape, Sparkle trail, Fire/Ice trail | 300-600 |
| Epic | Black/White skins, Shield/Hexagon shape, Flames effect | 750-1000 |
| Legendary | Rainbow trail, Lightning effect | 2000-2500 |

### Ranked League System
| Rating Range | League | Badge |
|-------------|--------|-------|
| 0 - 799 | Bronze | |
| 800 - 999 | Silver | |
| 1000 - 1199 | Gold | |
| 1200 - 1399 | Diamond | |
| 1400+ | Master | |

- Starting rating: 1000 (Gold)
- K-factor: 32
- Rating Power (RP) displayed on profile

---

## 8. Localization

### Supported Languages (12)

| Code | Language | File |
|------|----------|------|
| `en` | English | `client/src/i18n/en.js` |
| `tr` | Turkish (primary) | `client/src/i18n/tr.js` |
| `de` | German | `client/src/i18n/de.js` |
| `fr` | French | `client/src/i18n/fr.js` |
| `es` | Spanish | `client/src/i18n/es.js` |
| `it` | Italian | `client/src/i18n/it.js` |
| `pt` | Portuguese | `client/src/i18n/pt.js` |
| `ru` | Russian | `client/src/i18n/ru.js` |
| `ar` | Arabic | `client/src/i18n/ar.js` |
| `zh` | Chinese | `client/src/i18n/zh.js` |
| `ja` | Japanese | `client/src/i18n/ja.js` |
| `ko` | Korean | `client/src/i18n/ko.js` |

### i18n System Overview
- Each language file exports a flat key-value object of translated strings
- Template variables use `{{variable}}` syntax (e.g., `"Day {{day}}"`)
- `client/src/i18n/i18n.js` provides the `useTranslation()` React hook and `t()` function
- Language selection available in the Settings menu
- All UI text (menus, HUD, dialogs, tutorials, store, errors) is localized
- Approximately 180+ translation keys covering auth, menu, gameplay, store, ranked, tutorial, settings, and errors

---

## 9. Current State Assessment

### What Works Well
- **Core gameplay loop** is solid and fun -- drag-to-send armies, real-time conquest, and elimination flow smoothly
- **Terrain variety** adds genuine strategic depth (Mountain defense bonuses, Snow slowdown, Speed acceleration, Rocky impassability)
- **Ability system** provides tactical moments that can swing matches
- **Gate teleportation** creates interesting map-reading and flanking opportunities
- **Tutorial** effectively teaches all core mechanics in 6 progressive stages
- **Ranked system** with ELO provides competitive motivation
- **Mobile responsiveness** works well with touch controls and adaptive UI
- **Network architecture** with tick-based simulation and delta updates is performant
- **12-language localization** ready for international launch

### Known Issues / Areas for Improvement
- **Map variety**: Only 3 maps currently active in the config (Turkey, Poland, China) despite 15+ GeoJSON files being available -- more maps should be enabled and tested
- **Player count**: Currently limited to 2-4 players per match -- larger maps with 6-8 players would increase variety
- **Bot AI**: Bot decision-making is basic (1.5s decision interval) -- could benefit from difficulty levels and smarter strategies
- **Matchmaking**: Online PvP queue can be slow with a small player base -- might need timer-based bot backfill
- **Balance tuning**: Army speed (25 px/s) and various production rates may need ongoing adjustment as the player meta develops
- **Cosmetic store**: Only 15 items currently -- needs expansion for sustained monetization
- **Audio**: Basic Web Audio API synthesis -- would benefit from proper audio assets and music tracks
- **Visual polish**: Minimalist graphics style works but could be enhanced with more animations, particles, and visual feedback
- **Building system**: Building bar and resource system (Iron, Crystal, Uranium) appear partially implemented in the HUD -- needs full integration testing
- **Server infrastructure**: Currently single-server -- will need horizontal scaling for growth

### Technical Debt
- Some constants are duplicated between `shared/gameConstants.js` and `server/src/game/constants.js` with a try/catch fallback pattern
- Client-side prediction not yet fully implemented (referenced in agent configuration but not visible in current codebase)
- Large GeoJSON files for potential maps exist but are not all integrated into the map selection config

---

## Appendix: Scene Flow

```
BootScene -> AuthScene -> MenuScene -> LobbyScene -> GameScene -> GameOverScene
                                   \-> TutorialScene -> GameOverScene
                                   \-> FriendsScene
```

| Scene | Purpose |
|-------|---------|
| **BootScene** | Asset loading, texture generation |
| **AuthScene** | Login, registration, email verification, guest access |
| **MenuScene** | Map selection, game mode selection, settings |
| **LobbyScene** | Matchmaking queue, player list, waiting room |
| **GameScene** | Main gameplay (map rendering, armies, abilities, HUD) |
| **GameOverScene** | Victory/defeat screen, battle statistics, scoreboard |
| **TutorialScene** | 6-stage guided tutorial with local bot |
| **FriendsScene** | Friend list management |

### HUD Architecture (In-Game)
The in-game UI uses a hybrid approach:
- **PhaserJS**: AbilityBar, GateRenderer, MapRenderer, ArmyRenderer, SelectionSystem, CameraSystem, DOMFogManager
- **React (GameHUD.jsx)**: Header bar, player list, stats panel, resource display, army list, building bar, settings panel, spawn selection overlay, quit dialog, toasts, region tooltips
- **Communication**: `GameBridge.js` event emitter bridges Phaser scene events to React HUD components

# P0.02 — shared/gameConstants.js + eventTypes.js + regionTypes.js + version.js

## Tarih: 2026-04-06

## Dosyalar

### shared/gameConstants.js (100+ sabit)
- Tick: TICK_RATE=10, TICK_DURATION=100ms
- Production: 7 bolge tipi rate + interest + decay
- HP: MAX_REGION_HP=300, SPAWN_HP=40
- Army: SPEED=25, SPLIT=0.5, COLLISION=20px, ATTRITION=1/s, STUCK=45s
- Speed: SNOW=0.28x, SPEED=1.5x
- Siege: DAMAGE_PERCENT=0.10, DEFENSE_BONUS=1.20, WALL_BONUS=0.50
- 5 ability (cooldown, damage, duration)
- Phases: COUNTDOWN=3s, SPAWN=15s, PREVIEW=3.2s
- Buildings: 7 tip, iron/crystal/uranium costs
- Gates: THRESHOLD=15px, OFFSET=20px, COOLDOWN=500ms
- Player: 16 color, bot names
- Economy: diamond rewards, ELO K=32, 5 league
- Network: rate limit=5/s, ping=25s, payload=100KB
- Map gen: vertex limit, neighbor detection, type distribution %

### shared/eventTypes.js (42 event)
- Client→Server: 12 (lobby, game actions, abilities, ping)
- Server→Client: 30 (matchmaking, lifecycle, army, combat, abilities, economy, network)

### shared/regionTypes.js (7 tip)
- NORMAL, TOWER, SPAWN, MOUNTAIN, SNOW, ROCKY, SPEED

### shared/version.js
- version: "2.0.0", codename: "BattleTab"

### shared/index.js
- Re-export: gameConstants, eventTypes, regionTypes, version

## Kaynaklar
- doc 03 (Gameplay Mechanics) — production rates, speed, siege, abilities, buildings
- doc 04 (Technical Architecture) — network config, tick rate, phases
- doc 06 (Backend) — socket events, building costs
- Eski v1 shared/ — base reference

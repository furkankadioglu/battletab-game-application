# BattleTab v2 — Tamamlanan Görevler

## PHASE 0: Project Setup

### P0.01 — Root package.json + workspaces + Jest config
- Root package.json: battletab monorepo, workspaces [shared, server, client]
- Scripts: dev, test, test:unit, test:integration, build, smoke
- devDependencies: concurrently, jest, puppeteer
- jest.config.js: node environment, roots, coverage
- shared/package.json, server/package.json, client/package.json
- npm install + npm test basarili (0 test, 0 fail)

### P0.02 — shared/gameConstants.js + eventTypes.js + regionTypes.js + version.js
- shared/gameConstants.js: 100+ sabit (tick, production, army, siege, abilities, buildings, gates, ELO, network, UI colors)
- shared/eventTypes.js: 42 Socket.IO event (client→server + server→client)
- shared/regionTypes.js: 7 bolge tipi
- shared/version.js: v2.0.0 BattleTab
- shared/index.js: tum modulleri re-export
- require('./shared') dogrulandi

### P0.03 — Server package.json + dependencies
- server/package.json: 10 dependencies + 2 devDeps
- server/.env.example: tum env degiskenleri
- server/src/ dizin yapisi: 14 alt klasor + game/entities, game/maps
- server/db/migrations/ dizini
- npm install: 143 paket, 0 vulnerability

### P0.04 — Client package.json + Vite config
- client/package.json: react 19, phaser 3.70, vite 5, capacitor 6, socket.io-client
- client/vite.config.js: react plugin, port 5173, socket.io proxy
- client/index.html: 4 container (bg-canvas, auth-root, menu-root, game), fonts, viewport
- client/src/: 13 alt dizin + index.js entry point
- vite build: 44ms, vite dev: OK

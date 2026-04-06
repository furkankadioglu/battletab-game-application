# BattleTab v2 — Tamamlanan Görevler

## PHASE 0: Project Setup

### P0.01 — Root package.json + workspaces + Jest config
- Root package.json: battletab monorepo, workspaces [shared, server, client]
- Scripts: dev, test, test:unit, test:integration, build, smoke
- devDependencies: concurrently, jest, puppeteer
- jest.config.js: node environment, roots, coverage
- shared/package.json, server/package.json, client/package.json
- npm install + npm test basarili (0 test, 0 fail)

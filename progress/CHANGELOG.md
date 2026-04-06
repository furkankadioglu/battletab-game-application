# BattleTab v2 — Değişiklik Günlüğü

## 2026-04-06

### P0.01 — Root package.json + workspaces + Jest config
- Root monorepo: npm workspaces (shared, server, client)
- Jest 29.7.0 config: node env, coverage, passWithNoTests
- concurrently, puppeteer devDeps
- TODO.md detaylandirildi (11 phase, 80+ gorev)

### P0.02 — shared/gameConstants.js + eventTypes.js + regionTypes.js + version.js
- gameConstants.js: 100+ sabit (doc 03 + doc 04 + v1 referans)
- eventTypes.js: 42 event (v1 base + eksik eventler eklendi)
- regionTypes.js: 7 tip enum
- version.js: v2.0.0
- index.js: re-export hub

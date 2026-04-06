# P0.01 — Root package.json + workspaces + Jest config

## Tarih: 2026-04-06

## Ne Yapildi

### 1. Root package.json
- Monorepo yapisi: npm workspaces ile `shared`, `server`, `client` paketleri
- Scripts:
  - `dev`: concurrently ile server + client paralel calistirir
  - `test`: jest --passWithNoTests --forceExit --detectOpenHandles
  - `test:unit`: jest --testPathPattern=unit
  - `test:integration`: jest --testPathPattern=integration
  - `build`: client vite build
  - `smoke`: tests/smoke.sh

### 2. jest.config.js
- testEnvironment: 'node'
- roots: tests/, shared/, server/
- testMatch: `**/tests/**/*.test.js`, `**/tests/**/*.spec.js`
- testPathIgnorePatterns: node_modules, client, visual, perf
- Coverage: shared ve server kaynak dosyalari

### 3. Workspace Paketleri
- `shared/package.json`: battletab-shared, main: index.js
- `server/package.json`: battletab-server, main: src/index.js
- `client/package.json`: battletab-client, placeholder scripts

### 4. devDependencies
- concurrently ^8.2.0 (paralel dev server)
- jest ^29.7.0 (test runner)
- puppeteer ^24.39.1 (visual/screenshot test)

### 5. TODO.md Genisletildi
- 11 phase, 80+ gorev detayli olarak tanimlandI
- Her gorev icin kabul kriterleri, dosya yollari, doc referanslari eklendi

## Dogrulama
- `npm install`: 348 paket, 0 vulnerability
- `npm test`: exit 0 (no tests, passWithNoTests)
- `npm ls --depth=0`: 3 workspace + 3 devDep gorunur

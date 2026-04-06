# BattleTab v2

Online Multiplayer Real-Time Strategy game. Browser + iOS + Android (Capacitor).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | PhaserJS 3.70 |
| UI Framework | React 19 |
| Bundler | Vite 5 |
| Backend | Express.js + Socket.IO 4 |
| Database | PostgreSQL + Redis |
| Mobile | Capacitor 6 |
| Testing | Jest 29 + Puppeteer |

## Project Structure

```
battletab/
  shared/       # Shared constants (gameConstants, eventTypes, regionTypes)
  server/       # Express + Socket.IO backend
  client/       # React + Phaser frontend (Vite)
  mobile/       # Capacitor mobile builds
  docs/         # Handover documentation (10 docs)
  tests/        # Unit, integration, visual, perf tests
  progress/     # TODO, DONE, CHANGELOG, PERF-LOG
  scripts/      # smoke.sh, deploy.sh
```

## Quick Start

```bash
npm install          # Install all workspace dependencies
npm run dev          # Start server + client dev servers
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run build        # Build client for production
npm run smoke        # Run smoke tests
```

## Development Progress

See [progress/TODO.md](progress/TODO.md) for the full task list.

Current phase: **PHASE 0 — Project Setup**

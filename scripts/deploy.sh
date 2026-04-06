#!/bin/bash
# BattleTab v2 — Deploy to battletab.frkn.com.tr
# Usage: bash scripts/deploy.sh [all|backend|frontend]

set -e
cd "$(dirname "$0")/.."

REMOTE="yuksel"
REMOTE_BASE="/Domains/battletab.frkn.com.tr"
REMOTE_BACKEND="$REMOTE_BASE/backend"
REMOTE_FRONTEND="$REMOTE_BASE/public_html"
PM2_NAME="battletab"
EXCLUDE="--exclude=node_modules --exclude=.git --exclude=.DS_Store --exclude=tests --exclude=docs --exclude=progress --exclude=.claude --exclude=hooks --exclude=claude_documentations --exclude=mobile --exclude=scripts --exclude=setup.sh --exclude=client/src --exclude=client/node_modules"

MODE=${1:-all}

echo "🚀 BattleTab Deploy — mode: $MODE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Pre-deploy checks ─────────────────────────────────────
echo -n "1. Smoke test... "
bash scripts/smoke.sh > /dev/null 2>&1 && echo "✅" || { echo "❌ Smoke failed, aborting deploy"; exit 1; }

# ─── Backend Deploy ─────────────────────────────────────────
if [ "$MODE" = "all" ] || [ "$MODE" = "backend" ]; then
  echo "2. Deploying backend..."

  # Sync server + shared to remote backend
  rsync -avz --delete \
    $EXCLUDE \
    server/ "$REMOTE:$REMOTE_BACKEND/server/"

  rsync -avz --delete \
    shared/ "$REMOTE:$REMOTE_BACKEND/shared/"

  # Sync root package files for workspace
  rsync -avz \
    package.json package-lock.json jest.config.js \
    "$REMOTE:$REMOTE_BACKEND/"

  # Install dependencies on server
  ssh "$REMOTE" "cd $REMOTE_BACKEND && npm install --production 2>&1 | tail -3"

  # Create .env if not exists
  ssh "$REMOTE" "[ -f $REMOTE_BACKEND/server/.env ] || cp $REMOTE_BACKEND/server/.env.example $REMOTE_BACKEND/server/.env 2>/dev/null || true"

  # PM2: start or reload
  ssh "$REMOTE" "cd $REMOTE_BACKEND && (pm2 describe $PM2_NAME > /dev/null 2>&1 && pm2 reload $PM2_NAME || PORT=3004 pm2 start server/src/index.js --name $PM2_NAME --env production) && pm2 save"

  echo "   Backend deployed ✅"
fi

# ─── Frontend Deploy ────────────────────────────────────────
if [ "$MODE" = "all" ] || [ "$MODE" = "frontend" ]; then
  echo "3. Building client..."
  cd client && npx vite build 2>&1 | tail -3 && cd ..

  echo "   Deploying frontend..."
  rsync -avz --delete \
    --exclude=.DS_Store \
    client/dist/ "$REMOTE:$REMOTE_FRONTEND/"

  echo "   Frontend deployed ✅"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deploy complete!"
echo "   URL: https://battletab.frkn.com.tr"

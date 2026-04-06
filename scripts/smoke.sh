#!/bin/bash
# BattleTab v2 — Smoke Test
# Runs all critical checks before deploy

set -e
cd "$(dirname "$0")/.."

echo "🔍 BattleTab Smoke Test"
FAIL=0

echo -n "1. Shared constants... "
node -e "const s = require('./shared'); if (!s.gameConstants.TICK_RATE) process.exit(1)" 2>/dev/null && echo "✅" || { echo "❌"; FAIL=1; }

echo -n "2. Unit tests... "
npx jest --testPathPattern=unit --passWithNoTests --silent 2>/dev/null && echo "✅" || { echo "❌"; FAIL=1; }

echo -n "3. Integration tests... "
npx jest --testPathPattern=integration --passWithNoTests --silent 2>/dev/null && echo "✅" || { echo "❌"; FAIL=1; }

echo -n "4. Client build... "
(cd client && npx vite build 2>/dev/null 1>/dev/null) && echo "✅" || { echo "❌"; FAIL=1; }

echo ""
if [ $FAIL -ne 0 ]; then
  echo "❌ SMOKE FAILED"
  exit 1
fi
echo "🎉 All checks passed!"

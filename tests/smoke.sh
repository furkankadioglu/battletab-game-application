#!/bin/bash
echo "🔍 BattleTab Smoke Test"; FAIL=0
echo -n "1. Shared... "; node -e "require('./shared/gameConstants.js').TICK_RATE||process.exit(1)" 2>/dev/null && echo "✅" || { echo "❌"; FAIL=1; }
echo -n "2. Server... "; timeout 5 node server/src/index.js &>/dev/null & P=$!; sleep 3; curl -sf http://localhost:3000/api &>/dev/null && echo "✅" || { echo "❌"; FAIL=1; }; kill $P 2>/dev/null; wait $P 2>/dev/null
echo -n "3. Build... "; (cd client && npm run build &>/dev/null) && echo "✅" || { echo "❌"; FAIL=1; }
echo -n "4. Tests... "; npx jest --testPathPattern=unit --silent 2>/dev/null && echo "✅" || { echo "❌"; FAIL=1; }
[ $FAIL -ne 0 ] && { echo "❌ FAIL"; exit 1; }; echo "🎉 OK!"

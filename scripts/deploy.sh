#!/bin/bash
set -e; echo "🚀 BattleTab Deploy"
npm test -- --testPathPattern=unit --silent && echo "✅ Unit"
npm test -- --testPathPattern=integration --silent && echo "✅ Integration"
bash tests/smoke.sh && echo "✅ Smoke"
node tests/perf/benchmark.js --task="deploy" && echo "✅ Perf"
cd client && npm run build && cd .. && echo "✅ Build"
echo "🎉 Deploy hazır"

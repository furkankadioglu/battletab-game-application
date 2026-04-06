#!/bin/bash
RC=$(git diff --name-only 2>/dev/null | head -20)
[ -z "$RC" ] && exit 0
R=""
for f in $RC; do
  echo "$f" | grep -q '^server/src/' 2>/dev/null && { BN=$(basename "$f" .js); [ ! -f "tests/unit/server/${BN}.test.js" ] && R="${R}⚠️ $f testi yok\n"; }
done
echo "$RC" | grep -qc 'progress/' 2>/dev/null || R="${R}📋 TODO/DONE/CHANGELOG güncelle\n"
[ -n "$R" ] && { echo -e "$R" >&2; exit 2; }
exit 0

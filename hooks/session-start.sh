#!/bin/bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎮 BattleTab v2 — Oturum Başladı"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "progress/TODO.md" ]; then
  TOTAL=$(grep -c '^\- \[' progress/TODO.md 2>/dev/null || echo "0")
  DONE_C=$(grep -c '^\- \[x\]' progress/TODO.md 2>/dev/null || echo "0")
  NEXT=$(grep -m1 '^\- \[ \]' progress/TODO.md 2>/dev/null || echo "Yok")
  echo "📋 TODO: $DONE_C/$TOTAL tamamlandı, $((TOTAL-DONE_C)) kaldı"
  echo "👉 $NEXT"
fi
[ -f "progress/DONE.md" ] && LAST=$(tail -1 progress/DONE.md) && [ -n "$LAST" ] && echo "✅ Son: $LAST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit 0

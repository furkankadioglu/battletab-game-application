#!/bin/bash
INPUT=$(cat)
FP=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
[[ -z "$FP" ]] && exit 0
W=""
[ -f "$FP" ] && grep -qiE '\bKUST\b|Pillows' "$FP" 2>/dev/null && W="${W}⚠️ $FP: KUST/Pillows bulundu — BattleTab yap\n"
if echo "$FP" | grep -q '^server/src/' 2>/dev/null; then
  BN=$(basename "$FP" .js); TF="tests/unit/server/${BN}.test.js"
  if [ -f "$TF" ]; then
    npx jest "$TF" --silent 2>&1 >/dev/null && W="${W}✅ $TF geçti\n" || W="${W}❌ $TF FAILED\n"
  else
    W="${W}⚠️ Unit test yok: $TF\n"
  fi
fi
echo "$FP" | grep -q '^shared/' 2>/dev/null && { npx jest --testPathPattern=unit --silent 2>&1 >/dev/null && W="${W}✅ shared/ testleri geçti\n" || W="${W}❌ shared/ testleri FAILED\n"; }
[ -n "$W" ] && { CTX=$(echo -e "$W"); jq -n --arg ctx "$CTX" '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":$ctx}}'; }
exit 0

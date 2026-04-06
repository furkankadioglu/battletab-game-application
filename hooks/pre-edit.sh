#!/bin/bash
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty' 2>/dev/null || echo "")
[[ -z "$CONTENT" ]] && exit 0
if echo "$CONTENT" | grep -qiE '\bKUST\b|Pillows|kust-project|pillows-server' 2>/dev/null; then
  echo "❌ KUST/Pillows tespit edildi. BattleTab kullan." >&2
  exit 2
fi
exit 0

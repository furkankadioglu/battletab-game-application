#!/bin/bash
# ============================================
# BattleTab — Claude Code Setup
# ============================================
# battletab/ klasörünün İÇİNDE çalıştır:
#   mkdir battletab && cd battletab
#   cp /indirdiğin/yer/setup.sh .
#   chmod +x setup.sh && ./setup.sh
# ============================================
set -e
echo "🎮 BattleTab proje yapısı oluşturuluyor..."

# ---- Dizinler ----
mkdir -p .claude/commands hooks docs progress/screenshots
mkdir -p client/public client/src server/src shared mobile
mkdir -p tests/unit/server tests/unit/shared tests/integration tests/visual tests/perf scripts
echo "📁 Dizinler oluşturuldu"

# ============================================
# GLOBAL AYARLAR → ~/.claude/settings.json
# ============================================
GLOBAL_DIR="$HOME/.claude"
mkdir -p "$GLOBAL_DIR"
[ -f "$GLOBAL_DIR/settings.json" ] && cp "$GLOBAL_DIR/settings.json" "$GLOBAL_DIR/settings.json.bak.$(date +%s)" && echo "⚠️  Eski ~/.claude/settings.json yedeklendi"

cat > "$GLOBAL_DIR/settings.json" << 'GLOBEOF'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "effortLevel": "high",
  "alwaysThinkingEnabled": true,
  "env": {
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "64000",
    "CLAUDE_CODE_EFFORT_LEVEL": "high",
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CLAUDE_CODE_MAX_TOOL_USE_PER_TURN": "50"
  },
  "permissions": {
    "allow": [
      "Bash(npm run *)", "Bash(npx jest *)", "Bash(npx jest)", "Bash(node *)",
      "Bash(cat *)", "Bash(ls *)", "Bash(find *)", "Bash(grep *)",
      "Bash(mkdir *)", "Bash(cp *)", "Bash(mv *)", "Bash(chmod *)",
      "Bash(head *)", "Bash(tail *)", "Bash(wc *)", "Bash(sort *)",
      "Bash(git status)", "Bash(git diff *)", "Bash(git add *)",
      "Bash(git commit *)", "Bash(git log *)", "Bash(cd *)", "Bash(pwd)",
      "Bash(echo *)", "Bash(curl -sf http://localhost:*)",
      "Bash(timeout *)", "Bash(kill *)",
      "Bash(bash hooks/*)", "Bash(bash tests/*)", "Bash(bash scripts/*)",
      "Read(*)", "Edit(*)", "MultiEdit(*)", "Write(*)"
    ],
    "deny": [
      "Bash(rm -rf /)", "Bash(rm -rf ~)", "Bash(sudo *)",
      "Read(.env)", "Read(.env.*)"
    ]
  }
}
GLOBEOF
echo "✅ ~/.claude/settings.json (global performans)"

# ============================================
# PROJE AYARLARI → .claude/settings.local.json
# ============================================
cat > .claude/settings.local.json << 'LOCEOF'
{
  "hooks": {
    "SessionStart": [{"matcher": "", "hooks": [{"type": "command", "command": "bash hooks/session-start.sh"}]}],
    "PreToolUse": [{"matcher": "Write|Edit|MultiEdit", "hooks": [{"type": "command", "command": "bash hooks/pre-edit.sh"}]}],
    "PostToolUse": [{"matcher": "Write|Edit|MultiEdit", "hooks": [{"type": "command", "command": "bash hooks/post-edit.sh"}]}],
    "Stop": [{"matcher": "", "hooks": [{"type": "command", "command": "bash hooks/on-stop.sh"}]}]
  }
}
LOCEOF
echo "✅ .claude/settings.local.json (hooks)"

# ============================================
# CLAUDE.md
# ============================================
cat > .claude/CLAUDE.md << 'CLEOF'
# BattleTab v2 — Claude Code Kuralları

## PROJENİN KİMLİĞİ
- **İsim:** BattleTab (eski adı: KUST 10 - Pillows)
- **Tür:** Online Multiplayer RTS
- **Platform:** Web Browser + iOS + Android (Capacitor)

> "KUST" veya "Pillows" KULLANMA. Her yerde "BattleTab" yaz.
> Package: battletab-server, battletab-client. DB: battletab.
> docs/ içindeki referanslarda "KUST" geçer — oku ama koda "BattleTab" yaz.

## KRİTİK KURALLAR

### Kural 1: TODO Odaklı Çalış
- HER işe başlamadan önce progress/TODO.md oku
- Sadece sıradaki - [ ] görevi yap, bitirmeden diğerine GEÇME
- Bitince: [x] işaretle → DONE.md'ye taşı → CHANGELOG.md'ye yaz

### Kural 2: Her Adımda 3 Katlı Test
- A) Unit Test: tests/unit/ altına yaz, npx jest --testPathPattern=unit
- B) Integration Test (birden fazla sistem etkileniyorsa): tests/integration/
- C) Puppeteer Screenshot (UI ise): node tests/visual/screenshot.test.js --task="X"
- BİRİ EKSİK → GÖREV TAMAMLANMADI

### Kural 3: Performans Kontrolü
- node tests/perf/benchmark.js --task="X" çalıştır, PERF-LOG.md'ye kaydet
- %20+ kötüleşme → DUR, düzelt

### Kural 4: Mevcut Kodu Bozma
- Yeni özellik eklemeden ÖNCE mevcut testleri çalıştır
- Kırılırsa → GERİ AL
- Dosyayı değiştirmeden ÖNCE TAMAMI oku

### Kural 5: docs/ Referans
- 10 MD dosyası TEK KAYNAK. Implemente ederken ilgili dokümanı OKU
- Dokümanla çelişen şey yapma

### Kural 6: Küçük Adımlar
- Max 1 özellik/seferde. Her adımda çalışır bırak.

## PROJE BAĞLAMI
- Client: PhaserJS 3.70 + React 19 + Vite 5 (ESM)
- Server: Express.js + Socket.IO 4 (CommonJS)
- DB: PostgreSQL + Redis | Test: Jest + Puppeteer
- Server-authoritative, 10 tick/s, delta state, BFS fog depth-2
- Hybrid UI: Phaser canvas + React overlay + GameBridge event bus
- Renkler: Gold #c8a84e, BG rgba(6,6,14,0.85), Text #d0d0e0, Canvas #134e6f
- Fontlar: Cinzel (display), Inter (body)

## DEPLOY KURALI
1. npx jest unit → 2. npx jest integration → 3. smoke.sh → 4. perf benchmark → 5. client build
BİR FAIL → DEPLOY YAPMA.
CLEOF
echo "✅ .claude/CLAUDE.md"

# ============================================
# HOOKS
# ============================================
cat > hooks/session-start.sh << 'H1'
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
H1

cat > hooks/pre-edit.sh << 'H2'
#!/bin/bash
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty' 2>/dev/null || echo "")
[[ -z "$CONTENT" ]] && exit 0
if echo "$CONTENT" | grep -qiE '\bKUST\b|Pillows|kust-project|pillows-server' 2>/dev/null; then
  echo "❌ KUST/Pillows tespit edildi. BattleTab kullan." >&2
  exit 2
fi
exit 0
H2

cat > hooks/post-edit.sh << 'H3'
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
H3

cat > hooks/on-stop.sh << 'H4'
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
H4

chmod +x hooks/*.sh
echo "✅ hooks/ (4 script)"

# ============================================
# SLASH COMMANDS
# ============================================
cat > .claude/commands/todo.md << 'C1'
1. progress/TODO.md oku, tamamlanmamış görevleri listele
2. Sıradaki görevi belirle, ilgili docs/ dokümanını oku
3. Plan sun, onay bekle
Argüman: add "P7.12 — ..." → ekle | move P3.05 → DONE'a taşı
C1
cat > .claude/commands/test.md << 'C2'
Sırasıyla: 1) npx jest --testPathPattern=unit --verbose
2) npx jest --testPathPattern=integration --verbose
3) node tests/visual/screenshot.test.js --task="GÖREV"
4) Özet tablo göster
C2
cat > .claude/commands/checkpoint.md << 'C3'
1. Unit test var+geçiyor mu? → yoksa DURMA
2. Integration test (varsa) geçiyor mu? → DURMA
3. Screenshot (UI ise) var mı? → DURMA
4. node tests/perf/benchmark.js → %20+ kötüleşme → DURMA
5. bash tests/smoke.sh → FAIL → DURMA
6. Geçtiyse: TODO [x], DONE'a taşı, CHANGELOG yaz, özet göster
C3
cat > .claude/commands/status.md << 'C4'
1. TODO.md → toplam/kalan/phase
2. DONE.md → son 3 görev
3. PERF-LOG.md → son ölçüm
4. Son screenshot
5. Test durumu
6. Özet tablo
C4
cat > .claude/commands/perf.md << 'C5'
1. node tests/perf/benchmark.js --task="GÖREV"
2. PERF-LOG.md'ye kaydet
3. Önceki ile karşılaştır, %20+ kötüleşme → UYARI
C5
echo "✅ .claude/commands/"

# ============================================
# PROGRESS
# ============================================
cat > progress/TODO.md << 'TODOEOF'
# BattleTab v2 — Master TODO

> "BattleTab" kullan, "KUST"/"Pillows" ASLA.
> Görev bitince: [x] → DONE → CHANGELOG. Test zorunlu.

## PHASE 0: Project Setup
- [ ] P0.01 — Root package.json + workspaces + Jest config
- [ ] P0.02 — shared/gameConstants.js + eventTypes.js + regionTypes.js + version.js
- [ ] P0.03 — Server package.json + dependencies (doc 06 §1)
- [ ] P0.04 — Client package.json + Vite config (doc 07 §20)
- [ ] P0.05 — Puppeteer + benchmark + smoke + deploy scriptleri
- [ ] P0.06 — İlk unit test: gameConstants doğrulama
- [ ] P0.07 — 🧪📸 smoke.sh geçmeli

## PHASE 1: Server Foundation
- [ ] P1.01 — Express init (helmet, cors, json) — doc 06 §2
- [ ] P1.02 — Config module — doc 06 §3
- [ ] P1.03 — PostgreSQL + graceful degradation — doc 06 §4
- [ ] P1.04 — Redis + fallback — doc 04 §2.4
- [ ] P1.05 — Socket.IO (WebSocket-only) — doc 04 §2.2
- [ ] P1.06 — ID generator (nanoid) — doc 04 App.C
- [ ] P1.07 — Health check /api — doc 06 §6
- [ ] P1.08 — 🧪 Unit: config, idGenerator, health
- [ ] P1.09 — 🧪 Integration: server boot + health
- [ ] P1.10 — 🏎️ PERF: startup süresi

## PHASE 2: Auth System
- [ ] P2.01 — DB migration: users — doc 06 §4
- [ ] P2.02 — AuthService — doc 06 §5
- [ ] P2.03 — Auth routes — doc 06 §6
- [ ] P2.04 — 🧪 Unit: AuthService
- [ ] P2.05 — 🧪 Integration: register→login→token
- [ ] P2.06 — Client: index.html — doc 02 §1
- [ ] P2.07 — Client: AuthApp.jsx — doc 02 §2
- [ ] P2.08 — Client: BattleCanvas.js — doc 01 §5
- [ ] P2.09 — Client: auth.css — doc 01 §5
- [ ] P2.10 — 📸🏎️ Auth screenshot + perf

## PHASE 3: Menu System
- [ ] P3.01 — MenuApp.jsx — doc 01 §6
- [ ] P3.02 — menu.css — doc 01 §6
- [ ] P3.03 — maps.js config — doc 00 §6
- [ ] P3.04 — Play tab — doc 01 §6
- [ ] P3.05 — i18n (en.js, tr.js) — doc 00 §8
- [ ] P3.06 — 🧪 Unit: i18n, map config
- [ ] P3.07 — 📸🏎️ Menu screenshot + perf

## PHASE 4: Core Game Engine
- [ ] P4.01 — Region.js + Player.js + Army.js entities
- [ ] P4.02 — GameState.js container
- [ ] P4.03 — MapGenerator.js — doc 06 §14
- [ ] P4.04 — Region types + neighbors — doc 03 §3
- [ ] P4.05 — 🧪 Unit: MapGenerator
- [ ] P4.06 — GateSystem.js — doc 06 §15
- [ ] P4.07 — 🧪 Unit: GateSystem
- [ ] P4.08 — ProductionSystem.js — doc 03 §4
- [ ] P4.09 — 🧪 Unit: ProductionSystem
- [ ] P4.10 — MovementSystem.js — doc 03 §5
- [ ] P4.11 — 🧪 Unit: MovementSystem
- [ ] P4.12 — CollisionSystem.js — doc 03 §6
- [ ] P4.13 — 🧪 Unit: CollisionSystem
- [ ] P4.14 — ConquestSystem + SiegeSystem — doc 03 §7-8
- [ ] P4.15 — 🧪 Unit: Conquest + Siege
- [ ] P4.16 — VisibilitySystem.js — doc 03 §13
- [ ] P4.17 — 🧪 Unit: VisibilitySystem
- [ ] P4.18 — PathfindingSystem.js — doc 06 §17
- [ ] P4.19 — 🧪 Unit: Pathfinding
- [ ] P4.20 — GameLoop.js + WinCondition.js — doc 04 §7
- [ ] P4.21 — 🧪 Unit: GameLoop, WinCondition
- [ ] P4.22 — 🧪 Integration: 100-tick headless sim
- [ ] P4.23 — 🏎️ PERF: 1000-tick benchmark

## PHASE 5: Room & Matchmaking
- [ ] P5.01 — GameRoom.js — doc 06 §9
- [ ] P5.02 — Socket handlers — doc 06 §7
- [ ] P5.03 — BotMatchService + MatchmakingService — doc 06 §8
- [ ] P5.04 — BotAI.js — doc 03 §16
- [ ] P5.05 — 🧪 Unit + Integration: bot match lifecycle
- [ ] P5.06 — 🏎️ PERF: full bot match

## PHASE 6: Game Client
- [ ] P6.01 — Phaser config + BootScene — doc 02 §18
- [ ] P6.02 — GameScene + MapRenderer — doc 07 §4
- [ ] P6.03 — ArmyRenderer — doc 07 §5
- [ ] P6.04 — CameraSystem + SelectionSystem — doc 07 §6, doc 08 §4
- [ ] P6.05 — GateRenderer + SiegeRenderer + DOMFog — doc 07 §8-9
- [ ] P6.06 — AbilityBar — doc 07 §7
- [ ] P6.07 — SocketManager + GameSync — doc 07 §11
- [ ] P6.08 — 🧪 Unit: GameSync
- [ ] P6.09 — 📸🏎️ Bot match render screenshot + perf

## PHASE 7: Game HUD
- [ ] P7.01 — GameBridge.js — doc 07 §13
- [ ] P7.02 — GameHUD.jsx — doc 02 §4
- [ ] P7.03 — Spawn + Preview + Tooltip + Settings + Toast + Quit
- [ ] P7.04 — game-hud.css responsive — doc 08
- [ ] P7.05 — 🧪 Unit: GameBridge
- [ ] P7.06 — 📸🏎️ HUD screenshot + perf

## PHASE 8: Game Over & Ranking
- [ ] P8.01 — GameOverScene + confetti — doc 02 §17
- [ ] P8.02 — RankingService (ELO) + diamonds — doc 06 §21
- [ ] P8.03 — 🧪 Unit + Integration: ELO, diamonds
- [ ] P8.04 — 📸🏎️ Game over screenshot + perf

## PHASE 9: Social & Economy
- [ ] P9.01 — Friends system + UI — doc 01 §9
- [ ] P9.02 — Profile tab — doc 01 §10
- [ ] P9.03 — Store (StoreService + SkinCatalog + UI) — doc 06 §19
- [ ] P9.04 — DailyReward + UI — doc 06 §20
- [ ] P9.05 — Leaderboard + Ranked tab — doc 01 §11
- [ ] P9.06 — Email verify + password reset — doc 06 §5
- [ ] P9.07 — 🧪 Unit + Integration: Store, Daily, Friends
- [ ] P9.08 — 📸🏎️ Store + profile screenshot + perf

## PHASE 10: Polish & Mobile
- [ ] P10.01 — Sound + Music — doc 07 §14
- [ ] P10.02 — Mobile responsive + touch — doc 08
- [ ] P10.03 — Tutorial (6 stage) — doc 03 §20
- [ ] P10.04 — Remaining i18n (12 dil) — doc 00 §8
- [ ] P10.05 — Building system — doc 03 §10-11
- [ ] P10.06 — Admin panel — doc 04 §12
- [ ] P10.07 — Capacitor — doc 08 §10
- [ ] P10.08 — 🧪 Unit + Integration: Tutorial, Building
- [ ] P10.09 — 📸🏎️ Mobile + tutorial screenshot + perf

## PHASE 11: Final & Deploy
- [ ] P11.01 — Full regression + screenshot suite
- [ ] P11.02 — Full performance audit + optimization
- [ ] P11.03 — Production build + PM2 + VPS deploy
- [ ] P11.04 — Production smoke test
- [ ] P11.05 — 🧪🏎️ Final rapor
TODOEOF

cat > progress/DONE.md << 'X1'
# BattleTab v2 — Tamamlanan Görevler
X1
cat > progress/CHANGELOG.md << 'X2'
# BattleTab v2 — Değişiklik Günlüğü
X2
cat > progress/PERF-LOG.md << 'X3'
# BattleTab v2 — Performans Ölçüm Geçmişi
X3
echo "✅ progress/"

# ============================================
# TEST SCRIPTS
# ============================================
cat > tests/visual/screenshot.test.js << 'SS'
const puppeteer=require('puppeteer'),path=require('path'),fs=require('fs');
async function run(task,url='http://localhost:5173'){
  const dir=path.join(__dirname,'../../progress/screenshots');
  fs.mkdirSync(dir,{recursive:true});
  const b=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const p=await b.newPage();await p.setViewport({width:1920,height:1080});
  const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  try{await p.goto(url,{waitUntil:'networkidle2',timeout:20000});
    await new Promise(r=>setTimeout(r,3000));
    const ts=new Date().toISOString().slice(0,19).replace(/[:.]/g,'-');
    const fp=path.join(dir,`${ts}-${task}.png`);
    await p.screenshot({path:fp,fullPage:true});
    console.log(`✅ Screenshot: ${fp}`);
    errs.length?console.log('⚠️ Hatalar:',errs):console.log('✅ Hata yok');
  }catch(e){console.error(`❌ ${e.message}`)}finally{await b.close()}}
const t=(process.argv.find(a=>a.startsWith('--task='))||'').split('=')[1]||'unknown';
const u=(process.argv.find(a=>a.startsWith('--url='))||'').split('=')[1]||'http://localhost:5173';
run(t,u);
SS

cat > tests/perf/benchmark.js << 'BM'
const fs=require('fs'),path=require('path');
const task=(process.argv.find(a=>a.startsWith('--task='))||'').split('=')[1]||'unknown';
const now=new Date().toISOString().slice(0,16).replace('T',' ');
const heap=Math.round(process.memoryUsage().heapUsed/1024/1024);
console.log(`🏎️ BattleTab Benchmark — ${task} | ${heap}MB`);
const log=path.join(__dirname,'../../progress/PERF-LOG.md');
fs.appendFileSync(log,`\n### ${now} — ${task}\n| Metrik | Değer |\n|--------|-------|\n| Heap | ${heap}MB |\n`);
BM

cat > tests/smoke.sh << 'SM'
#!/bin/bash
echo "🔍 BattleTab Smoke Test"; FAIL=0
echo -n "1. Shared... "; node -e "require('./shared/gameConstants.js').TICK_RATE||process.exit(1)" 2>/dev/null && echo "✅" || { echo "❌"; FAIL=1; }
echo -n "2. Server... "; timeout 5 node server/src/index.js &>/dev/null & P=$!; sleep 3; curl -sf http://localhost:3000/api &>/dev/null && echo "✅" || { echo "❌"; FAIL=1; }; kill $P 2>/dev/null; wait $P 2>/dev/null
echo -n "3. Build... "; (cd client && npm run build &>/dev/null) && echo "✅" || { echo "❌"; FAIL=1; }
echo -n "4. Tests... "; npx jest --testPathPattern=unit --silent 2>/dev/null && echo "✅" || { echo "❌"; FAIL=1; }
[ $FAIL -ne 0 ] && { echo "❌ FAIL"; exit 1; }; echo "🎉 OK!"
SM
chmod +x tests/smoke.sh

cat > scripts/deploy.sh << 'DP'
#!/bin/bash
set -e; echo "🚀 BattleTab Deploy"
npm test -- --testPathPattern=unit --silent && echo "✅ Unit"
npm test -- --testPathPattern=integration --silent && echo "✅ Integration"
bash tests/smoke.sh && echo "✅ Smoke"
node tests/perf/benchmark.js --task="deploy" && echo "✅ Perf"
cd client && npm run build && cd .. && echo "✅ Build"
echo "🎉 Deploy hazır"
DP
chmod +x scripts/deploy.sh
echo "✅ tests/ + scripts/"

# ============================================
# GIT
# ============================================
if [ ! -d ".git" ]; then
  git init -q
  printf '.claude/settings.local.json\nnode_modules/\nclient/dist/\n.env\n.env.*\n' > .gitignore
  echo "✅ git init"
fi

# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎮 BattleTab hazır!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "SONRA:"
echo "  1. 10 MD dosyasını docs/ klasörüne kopyala"
echo "  2. jq yükle (brew install jq / apt install jq)"
echo "  3. claude"
echo ""
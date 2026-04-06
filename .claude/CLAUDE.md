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

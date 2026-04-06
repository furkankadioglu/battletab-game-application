const fs=require('fs'),path=require('path');
const task=(process.argv.find(a=>a.startsWith('--task='))||'').split('=')[1]||'unknown';
const now=new Date().toISOString().slice(0,16).replace('T',' ');
const heap=Math.round(process.memoryUsage().heapUsed/1024/1024);
console.log(`🏎️ BattleTab Benchmark — ${task} | ${heap}MB`);
const log=path.join(__dirname,'../../progress/PERF-LOG.md');
fs.appendFileSync(log,`\n### ${now} — ${task}\n| Metrik | Değer |\n|--------|-------|\n| Heap | ${heap}MB |\n`);

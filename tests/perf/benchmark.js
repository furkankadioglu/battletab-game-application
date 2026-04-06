/**
 * BattleTab v2 — Performance Benchmark
 * Usage: node tests/perf/benchmark.js --task="task-name"
 *
 * Measures execution time and memory, appends to PERF-LOG.md
 */

const fs = require('fs');
const path = require('path');

const task = (process.argv.find(a => a.startsWith('--task=')) || '').split('=')[1] || 'unknown';
const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

const startTime = process.hrtime.bigint();
const startHeap = process.memoryUsage().heapUsed;

// Run task-specific benchmark if a module is provided
const taskModule = process.argv.find(a => a.startsWith('--run='));
if (taskModule) {
  const modulePath = taskModule.split('=')[1];
  try {
    require(path.resolve(modulePath));
  } catch (e) {
    console.error(`Benchmark module error: ${e.message}`);
  }
}

const endTime = process.hrtime.bigint();
const endHeap = process.memoryUsage().heapUsed;

const durationMs = Number(endTime - startTime) / 1_000_000;
const heapMB = Math.round(endHeap / 1024 / 1024);
const heapDeltaMB = Math.round((endHeap - startHeap) / 1024 / 1024);

console.log(`🏎️  BattleTab Benchmark — ${task}`);
console.log(`   Duration: ${durationMs.toFixed(1)}ms`);
console.log(`   Heap: ${heapMB}MB (+${heapDeltaMB}MB)`);

// Append to PERF-LOG.md
const logPath = path.join(__dirname, '../../progress/PERF-LOG.md');
const entry = `\n### ${now} — ${task}\n| Metrik | Deger |\n|--------|-------|\n| Duration | ${durationMs.toFixed(1)}ms |\n| Heap | ${heapMB}MB |\n| Heap Delta | +${heapDeltaMB}MB |\n`;
fs.appendFileSync(logPath, entry);

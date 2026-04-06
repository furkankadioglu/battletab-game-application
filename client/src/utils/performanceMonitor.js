/**
 * BattleTab v2 — Performance Monitor
 * Auto-detects low FPS and disables expensive effects.
 */

let samples = [];
let lowPerfMode = localStorage.getItem('battletab_low_perf') === 'true';
let monitoring = false;
let intervalId = null;

export function startMonitoring() {
  if (monitoring) return;
  monitoring = true;

  // Start sampling after 5 seconds
  setTimeout(() => {
    intervalId = setInterval(() => {
      // This will be called with actual FPS from Phaser game loop
      if (samples.length >= 6) {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        if (avg < 30 && !lowPerfMode) {
          enableLowPerfMode();
        } else if (avg >= 45 && lowPerfMode) {
          disableLowPerfMode();
        }
        samples = [];
      }
    }, 500);
  }, 5000);
}

export function recordFPS(fps) {
  samples.push(fps);
  if (samples.length > 12) samples.shift();
}

export function enableLowPerfMode() {
  lowPerfMode = true;
  localStorage.setItem('battletab_low_perf', 'true');
  console.log('[Perf] Low performance mode ENABLED');
}

export function disableLowPerfMode() {
  lowPerfMode = false;
  localStorage.setItem('battletab_low_perf', 'false');
  console.log('[Perf] Low performance mode DISABLED');
}

export function isLowPerf() { return lowPerfMode; }

export function stopMonitoring() {
  monitoring = false;
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  samples = [];
}

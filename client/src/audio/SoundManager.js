/**
 * BattleTab v2 — Sound Manager
 * Web Audio API synthesis for game sounds.
 */

let audioCtx = null;
let muted = localStorage.getItem('battletab_sound_muted') === 'true';
let volume = 0.5;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', vol = volume) {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* audio errors are non-fatal */ }
}

export function playBubble() { playTone(600, 0.15, 'sine'); }
export function playCapture() { playTone(800, 0.2, 'triangle'); playTone(1000, 0.15, 'triangle'); }
export function playTeleport() { playTone(400, 0.3, 'sawtooth', 0.2); }
export function playBomb() { playTone(100, 0.4, 'square', 0.3); }
export function playClick() { playTone(1200, 0.05, 'sine', 0.15); }

export function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }
export function mute() { muted = true; localStorage.setItem('battletab_sound_muted', 'true'); }
export function unmute() { muted = false; localStorage.setItem('battletab_sound_muted', 'false'); }
export function isMuted() { return muted; }
export function toggleMute() { muted ? unmute() : mute(); return muted; }

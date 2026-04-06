/**
 * BattleTab v2 — Music Manager
 * Background music control (placeholder for future audio assets).
 */

let muted = localStorage.getItem('battletab_music_muted') === 'true';
let volume = 0.3;
let currentTrack = null;

export function play(trackName) { currentTrack = trackName; /* Future: load and play audio */ }
export function pause() { currentTrack = null; }
export function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }
export function mute() { muted = true; localStorage.setItem('battletab_music_muted', 'true'); }
export function unmute() { muted = false; localStorage.setItem('battletab_music_muted', 'false'); }
export function isMuted() { return muted; }
export function toggleMute() { muted ? unmute() : mute(); return muted; }
export function getCurrentTrack() { return currentTrack; }

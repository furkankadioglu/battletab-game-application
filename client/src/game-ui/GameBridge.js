/**
 * BattleTab v2 — Game Bridge
 * Event bus between Phaser scenes and React HUD components.
 * Supports sticky events: last value cached for late subscribers.
 */

class GameBridge {
  constructor() {
    this.listeners = new Map();  // event → Set<callback>
    this.stickyCache = new Map(); // event → last data
  }

  emit(event, data) {
    this.stickyCache.set(event, data);
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        try { cb(data); } catch (e) { console.error(`GameBridge error [${event}]:`, e); }
      }
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);

    // Sticky: immediately deliver cached value
    if (this.stickyCache.has(event)) {
      try { callback(this.stickyCache.get(event)); } catch (e) { /* ignore */ }
    }
  }

  off(event, callback) {
    const set = this.listeners.get(event);
    if (set) set.delete(callback);
  }

  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  clear() {
    this.listeners.clear();
    this.stickyCache.clear();
  }
}

// Singleton
const gameBridge = new GameBridge();
export default gameBridge;

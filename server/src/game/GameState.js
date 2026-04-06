/**
 * BattleTab v2 — Game State Container
 * Central state for a single game room.
 */

class GameState {
  constructor() {
    this.regions = new Map();
    this.players = new Map();
    this.armies = new Map();
    this.gates = [];
    this.phase = 'waiting'; // waiting | countdown | spawn_selection | preview | playing | finished
    this.tick = 0;
    this.startTime = null;
    this.mapType = null;
    this.mapWidth = 1600;
    this.mapHeight = 900;
  }

  // ─── Region ──────────────────────────────────────────────
  addRegion(region) { this.regions.set(region.id, region); }
  getRegion(id) { return this.regions.get(id); }
  getAllRegions() { return [...this.regions.values()]; }

  getPlayerRegions(playerId) {
    return this.getAllRegions().filter(r => r.ownerId === playerId);
  }

  getPlayerRegionCount(playerId) {
    let count = 0;
    for (const r of this.regions.values()) {
      if (r.ownerId === playerId) count++;
    }
    return count;
  }

  getDirtyRegions() {
    const dirty = [];
    for (const r of this.regions.values()) {
      if (r.isDirty()) {
        dirty.push(r.serializeDelta());
        r.markClean();
      }
    }
    return dirty;
  }

  // ─── Player ──────────────────────────────────────────────
  addPlayer(player) { this.players.set(player.id, player); }
  getPlayer(id) { return this.players.get(id); }
  getAllPlayers() { return [...this.players.values()]; }

  getActivePlayers() {
    return this.getAllPlayers().filter(p => !p.isEliminated);
  }

  getPlayerBySocketId(socketId) {
    for (const p of this.players.values()) {
      if (p.socketId === socketId) return p;
    }
    return null;
  }

  // ─── Army ────────────────────────────────────────────────
  addArmy(army) { this.armies.set(army.id, army); }
  getArmy(id) { return this.armies.get(id); }
  removeArmy(id) { this.armies.delete(id); }
  getAllArmies() { return [...this.armies.values()]; }

  getPlayerArmies(playerId) {
    return this.getAllArmies().filter(a => a.ownerId === playerId);
  }

  // ─── Gates ───────────────────────────────────────────────
  getGatePair(regionId) {
    for (const gate of this.gates) {
      if (gate.regionA === regionId) return { paired: gate.regionB, color: gate.color };
      if (gate.regionB === regionId) return { paired: gate.regionA, color: gate.color };
    }
    return null;
  }

  // ─── Neighbors ───────────────────────────────────────────
  getNeighbors(regionId) {
    const region = this.getRegion(regionId);
    if (!region) return [];
    return region.neighbors.map(nId => this.getRegion(nId)).filter(Boolean);
  }

  isNeighbor(regionIdA, regionIdB) {
    const regionA = this.getRegion(regionIdA);
    if (!regionA) return false;
    if (regionA.neighbors.includes(regionIdB)) return true;

    // Check gate connections as virtual neighbors
    const gateA = this.getGatePair(regionIdA);
    if (gateA) {
      const pairedRegion = this.getRegion(gateA.paired);
      if (pairedRegion && pairedRegion.neighbors.includes(regionIdB)) return true;
      if (gateA.paired === regionIdB) return true;
    }
    return false;
  }
}

module.exports = GameState;

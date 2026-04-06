/**
 * BattleTab v2 — Game State Synchronization
 * Handles all server events and maintains local game state.
 */

class GameSync {
  constructor(socketManager, gameBridge) {
    this.sm = socketManager;
    this.bridge = gameBridge;
    this.regions = new Map();
    this.players = new Map();
    this.armies = new Map();
    this.previewArmies = new Map(); // preview_id → { targetRegionId, createdAt }
    this.myPlayerId = null;
    this.gameConfig = null;
    this.gates = [];
    this.mapData = null;
    this.stats = { regionsCaptured: 0, armiesSent: 0, peakPower: 0 };
    this.rankingData = null;
    this.diamondReward = null;
  }

  registerListeners() {
    this.sm.on('game_start', (data) => this._onGameStart(data));
    this.sm.on('state_update', (data) => this._onStateUpdate(data));
    this.sm.on('army_created', (data) => this._onArmyCreated(data));
    this.sm.on('army_destroyed', (data) => this._onArmyDestroyed(data));
    this.sm.on('region_captured', (data) => this._onRegionCaptured(data));
    this.sm.on('player_eliminated', (data) => this._onPlayerEliminated(data));
    this.sm.on('siege_started', (data) => this._emit('siege:started', data));
    this.sm.on('siege_ended', (data) => this._emit('siege:ended', data));
    this.sm.on('gate_teleport', (data) => this._onGateTeleport(data));
    this.sm.on('missile_applied', (data) => this._emit('ability:missile', data));
    this.sm.on('nuclear_applied', (data) => this._emit('ability:nuclear', data));
    this.sm.on('barracks_applied', (data) => this._emit('ability:barracks', data));
    this.sm.on('speed_boost_applied', (data) => this._emit('ability:speedBoost', data));
    this.sm.on('freeze_applied', (data) => this._emit('ability:freeze', data));
    this.sm.on('ability_granted', (data) => this._emit('ability:granted', data));
    this.sm.on('spawn_selected', (data) => this._emit('spawn:selected', data));
    this.sm.on('spawn_phase_end', (data) => this._emit('spawn:end', data));
    this.sm.on('regions_reveal', (data) => this._onRegionsReveal(data));
    this.sm.on('game_over', (data) => this._onGameOver(data));
    this.sm.on('ranking_update', (data) => { this.rankingData = data; });
    this.sm.on('diamond_reward', (data) => { this.diamondReward = data; });
    this.sm.on('game_countdown', (data) => this._emit('game:countdown', data));
  }

  // ─── Event Handlers ──────────────────────────────────

  _onGameStart(data) {
    this.myPlayerId = data.myPlayerId;
    this.gameConfig = data.gameConfig;
    this.gates = data.map?.gates || [];
    this.mapData = data.map;

    // Initialize regions
    for (const r of data.map?.regions || []) {
      this.regions.set(r.id, { ...r });
    }

    // Initialize players
    for (const p of data.players || []) {
      this.players.set(p.id, { ...p });
    }

    this._emit('game:start', data);
  }

  _onStateUpdate(data) {
    // Delta regions
    if (data.regions) {
      for (const delta of data.regions) {
        const existing = this.regions.get(delta.id);
        if (existing) Object.assign(existing, delta);
      }
    }

    // Army count updates
    if (data.armyUpdates) {
      for (const update of data.armyUpdates) {
        const army = this.armies.get(update.id);
        if (army) army.count = update.c;
      }
    }

    // Destroyed armies
    if (data.destroyedArmies) {
      for (const id of data.destroyedArmies) {
        this.armies.delete(id);
        this._emit('army:destroyed', { armyId: id });
      }
    }

    // Player updates
    if (data.players) {
      for (const p of data.players) {
        this.players.set(p.id, { ...this.players.get(p.id), ...p });
      }
    }

    // Track peak power
    let totalPower = 0;
    for (const r of this.regions.values()) {
      if (r.ownerId === this.myPlayerId) totalPower += (r.hp || 0);
    }
    if (totalPower > this.stats.peakPower) this.stats.peakPower = totalPower;

    this._emit('game:stateUpdate', data);
  }

  _onArmyCreated(data) {
    // Check if this matches a preview army
    let matchedPreview = null;
    for (const [previewId, preview] of this.previewArmies) {
      if (preview.targetRegionId === data.targetRegionId && data.ownerId === this.myPlayerId) {
        matchedPreview = previewId;
        break;
      }
    }

    if (matchedPreview) {
      this.previewArmies.delete(matchedPreview);
      this._emit('army:previewMatched', { previewId: matchedPreview, realArmy: data });
    }

    this.armies.set(data.id, { ...data });
    this._emit('army:created', data);
  }

  _onArmyDestroyed(data) {
    this.armies.delete(data.armyId);
    this._emit('army:destroyed', data);
  }

  _onRegionCaptured(data) {
    const region = this.regions.get(data.regionId);
    if (region) region.ownerId = data.newOwnerId;
    if (data.newOwnerId === this.myPlayerId) this.stats.regionsCaptured++;
    this._emit('region:captured', data);
  }

  _onPlayerEliminated(data) {
    const player = this.players.get(data.playerId);
    if (player) player.isEliminated = true;
    this._emit('player:eliminated', data);
  }

  _onGateTeleport(data) {
    const army = this.armies.get(data.armyId);
    if (army) {
      army.position = { ...data.toPosition };
      army._snapUntil = Date.now() + 300; // Skip prediction for 300ms
    }
    this._emit('gate:teleport', data);
  }

  _onRegionsReveal(data) {
    for (const r of data.regions || []) {
      const existing = this.regions.get(r.id);
      if (existing) Object.assign(existing, r);
      else this.regions.set(r.id, { ...r });
    }
    this._emit('regions:reveal', data);
  }

  _onGameOver(data) {
    this._emit('game:over', { ...data, stats: this.stats, rankingData: this.rankingData, diamondReward: this.diamondReward });
  }

  // ─── Preview Armies ──────────────────────────────────

  addPreviewArmy(previewId, targetRegionId) {
    this.previewArmies.set(previewId, { targetRegionId, createdAt: Date.now() });
    this.stats.armiesSent++;
  }

  cleanStalePreviewS(maxAge) {
    const now = Date.now();
    for (const [id, preview] of this.previewArmies) {
      if (now - preview.createdAt > maxAge) {
        this.previewArmies.delete(id);
        this._emit('army:previewExpired', { previewId: id });
      }
    }
  }

  // ─── Helpers ─────────────────────────────────────────

  _emit(event, data) {
    if (this.bridge) this.bridge.emit(event, data);
  }
}

export default GameSync;

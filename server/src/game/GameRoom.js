/**
 * BattleTab v2 — Game Room
 * Manages the full lifecycle of a single match:
 * waiting → countdown → spawn_selection → preview → playing → finished
 */

const { gameConstants, eventTypes, regionTypes } = require('../../../shared');
const { generateId } = require('../utils/idGenerator');
const { distance } = require('../utils/math');
const GameState = require('./GameState');
const GameLoop = require('./GameLoop');
const { generateMap } = require('./MapGenerator');
const { findShortestPath } = require('./GateSystem');
const { computeWaypoints, getRockyRegions } = require('./PathfindingSystem');
const { calculateVisibility, canAttack } = require('./VisibilitySystem');
const Region = require('./entities/Region');
const Player = require('./entities/Player');
const Army = require('./entities/Army');

const PLAYER_COLORS = gameConstants.PLAYER_COLORS;
const ABILITY_TYPES = ['missile', 'nuclear', 'barracks', 'speedBoost', 'freeze'];

class GameRoom {
  constructor(id, mode, io, mapType) {
    this.id = id;
    this.mode = mode; // 'bot' | 'normal' | '4player' | 'ranked'
    this.io = io;
    this.mapType = mapType || 'turkey';
    this.maxPlayers = mode === '4player' ? 4 : 2;
    this.gameState = new GameState();
    this.gameState.mapType = mapType;
    this.gameLoop = null;
    this.usedColors = [];
    this.countdownInterval = null;
    this.spawnTimer = null;
    this.previewTimer = null;

    // Broadcasting optimization
    this._playerBroadcastCounter = 0;
  }

  // ─── Player Management ──────────────────────────────────

  addPlayer(socket, username, isBot = false) {
    const color = this._pickColor();
    const player = new Player({
      id: generateId('player_'),
      socketId: isBot ? null : socket?.id,
      username,
      color,
      isBot,
    });

    this.gameState.addPlayer(player);

    if (socket) {
      socket.join(this.id);
      socket.gameRoomId = this.id;
      socket.playerId = player.id;
    }

    // Start countdown when full
    if (this.gameState.getAllPlayers().length >= this.maxPlayers) {
      this._startCountdown();
    }

    return player;
  }

  removePlayer(playerId) {
    const player = this.gameState.getPlayer(playerId);
    if (!player) return;

    if (this.gameState.phase === 'playing') {
      // Mark eliminated, neutralize regions
      player.isEliminated = true;
      for (const region of this.gameState.getPlayerRegions(playerId)) {
        region.ownerId = null;
      }
      // Remove armies
      for (const army of this.gameState.getPlayerArmies(playerId)) {
        this.gameState.removeArmy(army.id);
      }
    }
  }

  _pickColor() {
    if (this.usedColors.length === 0) {
      const idx = Math.floor(Math.random() * PLAYER_COLORS.length);
      this.usedColors.push(PLAYER_COLORS[idx]);
      return PLAYER_COLORS[idx];
    }

    // Max min RGB distance
    let bestColor = PLAYER_COLORS[0];
    let bestMinDist = -1;
    for (const color of PLAYER_COLORS) {
      if (this.usedColors.includes(color)) continue;
      const minDist = Math.min(...this.usedColors.map(uc => this._colorDist(color, uc)));
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestColor = color;
      }
    }
    this.usedColors.push(bestColor);
    return bestColor;
  }

  _colorDist(hex1, hex2) {
    const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  }

  // ─── Phase Transitions ──────────────────────────────────

  _startCountdown() {
    this.gameState.phase = 'countdown';
    let seconds = gameConstants.COUNTDOWN_SECONDS;

    this.countdownInterval = setInterval(() => {
      this._emitToAll(eventTypes.GAME_COUNTDOWN, { seconds });
      seconds--;
      if (seconds < 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this._startSpawnSelection();
      }
    }, 1000);
  }

  _startSpawnSelection() {
    // Generate map
    const playerCount = this.gameState.getAllPlayers().length;
    const mapResult = generateMap(playerCount, this.mapType);

    // Add regions to game state
    for (const region of mapResult.regions) {
      this.gameState.addRegion(region);
    }
    this.gameState.gates = mapResult.gates || [];
    this.gameState.mapWidth = mapResult.width;
    this.gameState.mapHeight = mapResult.height;

    // Set gate references on regions
    for (const gate of this.gameState.gates) {
      const region = this.gameState.getRegion(gate.regionId);
      if (region) {
        const pairGate = this.gameState.gates.find(g => g.id === gate.pairId);
        if (pairGate) {
          region.gate = { pairedRegionId: pairGate.regionId, color: gate.color, colorHex: gate.colorHex };
        }
      }
    }

    this.gameState.phase = 'spawn_selection';

    // Emit game_start with censored data (spawn phase: hide types/hp)
    const censoredRegions = this.gameState.getAllRegions().map(r => ({
      ...r.serialize(),
      type: regionTypes.NORMAL,
      hp: 0,
      resourceType: null,
      building: null,
    }));

    const gameConfig = {
      buildingCosts: gameConstants.BUILDING_COSTS,
      buildingLevelCostMultiplier: gameConstants.BUILDING_LEVEL_COST_MULT,
      attackRange: gameConstants.ATTACK_RANGE,
      fogDepth: gameConstants.FOG_DEPTH,
    };

    for (const player of this.gameState.getAllPlayers()) {
      if (player.isBot) continue;
      const socket = this._getSocket(player.socketId);
      if (socket) {
        socket.emit(eventTypes.GAME_START, {
          myPlayerId: player.id,
          mode: this.mode,
          mapType: this.mapType,
          spawnPhase: true,
          spawnSeconds: gameConstants.SPAWN_SELECTION_SECONDS,
          gameConfig,
          map: {
            width: this.gameState.mapWidth,
            height: this.gameState.mapHeight,
            mapType: this.mapType,
            regions: censoredRegions,
            gates: this.gameState.gates,
          },
          players: this.gameState.getAllPlayers().map(p => p.serialize(p.id === player.id)),
        });
      }
    }

    // Bot auto-spawn after 1-4s
    for (const player of this.gameState.getAllPlayers()) {
      if (player.isBot) {
        setTimeout(() => this._botSelectSpawn(player.id), 1000 + Math.random() * 3000);
      }
    }

    // Spawn selection timer
    this.spawnTimer = setTimeout(() => {
      this._endSpawnSelection();
    }, gameConstants.SPAWN_SELECTION_SECONDS * 1000);
  }

  onSelectSpawn(playerId, regionId) {
    if (this.gameState.phase !== 'spawn_selection') return;

    const region = this.gameState.getRegion(regionId);
    if (!region) return;
    if (region.type === regionTypes.ROCKY) return;
    if (region.gate) return;

    // Check if already taken by another player
    if (region.ownerId && region.ownerId !== playerId) return;

    // Undo previous selection
    for (const r of this.gameState.getPlayerRegions(playerId)) {
      if (r.type === regionTypes.SPAWN) {
        r.ownerId = null;
        r.type = regionTypes.NORMAL;
        r.hp = r._originalHp || 0;
      }
    }

    // Apply new selection
    region._originalHp = region.hp;
    region.ownerId = playerId;
    region.type = regionTypes.SPAWN;
    region.hp = gameConstants.SPAWN_HP;
    region.defenseBonus = 0;

    this._emitToAll(eventTypes.SPAWN_SELECTED, {
      playerId,
      regionId,
      playerUsername: this.gameState.getPlayer(playerId)?.username,
    });
  }

  _botSelectSpawn(playerId) {
    if (this.gameState.phase !== 'spawn_selection') return;

    const available = this.gameState.getAllRegions().filter(r =>
      !r.ownerId && r.type !== regionTypes.ROCKY && !r.gate
    );
    if (available.length > 0) {
      const region = available[Math.floor(Math.random() * available.length)];
      this.onSelectSpawn(playerId, region.id);
    }
  }

  _endSpawnSelection() {
    if (this.spawnTimer) { clearTimeout(this.spawnTimer); this.spawnTimer = null; }

    // Auto-assign unselected players
    for (const player of this.gameState.getAllPlayers()) {
      if (this.gameState.getPlayerRegionCount(player.id) === 0) {
        this._botSelectSpawn(player.id);
      }
    }

    // Grant 1 random starting ability per player
    for (const player of this.gameState.getAllPlayers()) {
      const ability = ABILITY_TYPES[Math.floor(Math.random() * ABILITY_TYPES.length)];
      player.charges[ability]++;
    }

    // Emit spawn phase end
    const selections = {};
    for (const player of this.gameState.getAllPlayers()) {
      const regions = this.gameState.getPlayerRegions(player.id);
      if (regions.length > 0) selections[player.id] = regions[0].id;
    }
    this._emitToAll(eventTypes.SPAWN_PHASE_END, { selections });

    // Emit regions_reveal (per-player fog-filtered)
    for (const player of this.gameState.getAllPlayers()) {
      if (player.isBot) continue;
      const visible = calculateVisibility(this.gameState, player.id);
      const regions = this.gameState.getAllRegions().map(r => {
        const data = r.serialize();
        if (!visible.has(r.id)) {
          data.resourceType = null;
          data.building = null;
        }
        return data;
      });
      const socket = this._getSocket(player.socketId);
      if (socket) socket.emit(eventTypes.REGIONS_REVEAL, { regions });
    }

    // Preview phase
    this.gameState.phase = 'preview';
    this.previewTimer = setTimeout(() => {
      this._startPlaying();
    }, gameConstants.PREVIEW_MS);
  }

  _startPlaying() {
    this.gameState.phase = 'playing';

    // Mark all regions clean for delta tracking
    for (const r of this.gameState.regions.values()) r.markClean();

    this.gameLoop = new GameLoop(this.gameState, (events) => {
      this._broadcastState(events);
    });
    this.gameLoop.start();
  }

  // ─── Game Actions ───────────────────────────────────────

  onSendSoldiers(playerId, sourceIds, targetId) {
    if (this.gameState.phase !== 'playing') return;

    const player = this.gameState.getPlayer(playerId);
    if (!player || player.isEliminated) return;

    const targetRegion = this.gameState.getRegion(targetId);
    if (!targetRegion || targetRegion.type === regionTypes.ROCKY) return;

    const rockyRegions = getRockyRegions(this.gameState);

    for (const sourceId of sourceIds) {
      const sourceRegion = this.gameState.getRegion(sourceId);
      if (!sourceRegion || sourceRegion.ownerId !== playerId) continue;
      if (sourceRegion.hp < 2) continue;

      // Attack range check
      if (!canAttack(this.gameState, sourceId, targetId, playerId)) continue;

      const count = Math.floor(sourceRegion.hp * gameConstants.SOLDIER_SPLIT_RATIO);
      if (count <= 0) continue;
      sourceRegion.hp -= count;

      // Calculate positions
      const startPos = this._closestEdgePoint(sourceRegion, targetRegion.center);
      const endPos = this._closestEdgePoint(targetRegion, sourceRegion.center);

      // Gate routing
      const gateResult = findShortestPath(startPos, endPos, this.gameState.gates);

      // Pathfinding around rocky
      let waypoints;
      if (gateResult.useGate) {
        waypoints = [gateResult.waypoint, endPos];
      } else {
        const rockyWaypoints = computeWaypoints(startPos, endPos, rockyRegions);
        waypoints = [...rockyWaypoints, endPos];
      }

      const army = new Army({
        id: generateId('army_'),
        ownerId: playerId,
        count,
        sourceRegionId: sourceId,
        targetRegionId: targetId,
        position: { ...startPos },
        waypoints,
        speed: gameConstants.ARMY_SPEED,
      });

      if (gateResult.useGate) {
        army.isGateRouted = true;
        army.finalTargetId = targetId;
      }

      this.gameState.addArmy(army);

      // Emit army_created (fog-filtered)
      const armyData = army.serialize();
      for (const p of this.gameState.getAllPlayers()) {
        if (p.isBot) continue;
        const visible = calculateVisibility(this.gameState, p.id);
        if (p.id === playerId || visible.has(sourceId) || visible.has(targetId)) {
          const socket = this._getSocket(p.socketId);
          if (socket) socket.emit(eventTypes.ARMY_CREATED, armyData);
        }
      }
    }
  }

  _closestEdgePoint(region, targetCenter) {
    const poly = region.polygon || [];
    if (poly.length === 0) return { ...region.center };

    let closestPoint = poly[0];
    let minDist = Infinity;

    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      // Project target direction onto edge
      const point = this._closestPointOnSegment(region.center, targetCenter, a, b);
      const d = distance(point, targetCenter);
      if (d < minDist) { minDist = d; closestPoint = point; }
    }

    return { x: closestPoint.x, y: closestPoint.y };
  }

  _closestPointOnSegment(from, to, segA, segB) {
    // Find point on segment AB closest to the line from→to direction
    const dx = segB.x - segA.x;
    const dy = segB.y - segA.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return { ...segA };

    const t = Math.max(0, Math.min(1,
      ((to.x - segA.x) * dx + (to.y - segA.y) * dy) / len2
    ));
    return { x: segA.x + t * dx, y: segA.y + t * dy };
  }

  // ─── Abilities ──────────────────────────────────────────

  onUseMissile(playerId, targetRegionId) {
    const player = this.gameState.getPlayer(playerId);
    if (!player || player.charges.missile <= 0) return;
    if (player.cooldowns.missile > Date.now()) return;

    const region = this.gameState.getRegion(targetRegionId);
    if (!region || region.ownerId === playerId || region.type === regionTypes.ROCKY) return;

    player.charges.missile--;
    player.cooldowns.missile = Date.now() + gameConstants.MISSILE_COOLDOWN;

    const damage = Math.floor(region.hp * gameConstants.MISSILE_DAMAGE_RATIO);
    region.hp = Math.max(0, region.hp - damage);

    this._emitToVisible(eventTypes.MISSILE_APPLIED, {
      playerId, targetRegionId, damage, position: region.center,
    }, targetRegionId);
  }

  onUseNuclear(playerId, targetRegionId) {
    const player = this.gameState.getPlayer(playerId);
    if (!player || player.charges.nuclear <= 0) return;
    if (player.cooldowns.nuclear > Date.now()) return;

    const region = this.gameState.getRegion(targetRegionId);
    if (!region || region.ownerId === playerId || region.type === regionTypes.ROCKY) return;

    player.charges.nuclear--;
    player.cooldowns.nuclear = Date.now() + gameConstants.NUCLEAR_COOLDOWN;

    region.isNuclearized = true;
    region.nuclearUntil = Date.now() + gameConstants.NUCLEAR_DURATION;

    this._emitToVisible(eventTypes.NUCLEAR_APPLIED, {
      playerId, targetRegionId, position: region.center,
    }, targetRegionId);
  }

  onUseBarracks(playerId, targetRegionId) {
    const player = this.gameState.getPlayer(playerId);
    if (!player || player.charges.barracks <= 0) return;
    if (player.cooldowns.barracks > Date.now()) return;

    const region = this.gameState.getRegion(targetRegionId);
    if (!region || region.ownerId !== playerId) return;
    if (region.type === regionTypes.TOWER || region.type === regionTypes.ROCKY) return;
    if (region.isNuclearized) return;

    player.charges.barracks--;
    player.cooldowns.barracks = Date.now() + gameConstants.BARRACKS_COOLDOWN;

    region.type = regionTypes.TOWER;

    this._emitToVisible(eventTypes.BARRACKS_APPLIED, {
      playerId, targetRegionId, position: region.center,
    }, targetRegionId);
  }

  onUseSpeedBoost(playerId) {
    const player = this.gameState.getPlayer(playerId);
    if (!player || player.charges.speedBoost <= 0) return;
    if (player.cooldowns.speedBoost > Date.now()) return;

    player.charges.speedBoost--;
    player.cooldowns.speedBoost = Date.now() + gameConstants.SPEED_BOOST_COOLDOWN;
    player.speedBoostUntil = Date.now() + gameConstants.SPEED_BOOST_DURATION;

    const socket = this._getSocket(player.socketId);
    if (socket) socket.emit(eventTypes.SPEED_BOOST_APPLIED, { playerId, duration: gameConstants.SPEED_BOOST_DURATION });
  }

  onUseFreeze(playerId) {
    const player = this.gameState.getPlayer(playerId);
    if (!player || player.charges.freeze <= 0) return;
    if (player.cooldowns.freeze > Date.now()) return;

    player.charges.freeze--;
    player.cooldowns.freeze = Date.now() + gameConstants.FREEZE_COOLDOWN;

    // Freeze all enemy armies
    const now = Date.now();
    for (const army of this.gameState.armies.values()) {
      if (army.ownerId !== playerId) {
        army.frozenUntil = now + gameConstants.FREEZE_ARMY_DURATION;
      }
    }

    this._emitToAll(eventTypes.FREEZE_APPLIED, { playerId, duration: gameConstants.FREEZE_ARMY_DURATION });
  }

  onRecallArmy(playerId, armyId) {
    const army = this.gameState.getArmy(armyId);
    if (!army || army.ownerId !== playerId) return;

    // Find nearest owned region
    const ownedRegions = this.gameState.getPlayerRegions(playerId);
    if (ownedRegions.length === 0) return;

    let nearest = ownedRegions[0];
    let minDist = distance(army.position, nearest.center);
    for (const r of ownedRegions) {
      const d = distance(army.position, r.center);
      if (d < minDist) { minDist = d; nearest = r; }
    }

    army.targetRegionId = nearest.id;
    army.finalTargetId = nearest.id;
    army.waypoints = [{ ...nearest.center }];
    army.waypointIndex = 0;
    army.isGateRouted = false;
  }

  onBuildBuilding(playerId, regionId, buildingId) {
    const player = this.gameState.getPlayer(playerId);
    if (!player) return;

    const region = this.gameState.getRegion(regionId);
    if (!region || region.ownerId !== playerId) return;
    if (region.building) return;
    if (region.type === regionTypes.ROCKY) return;

    const costs = gameConstants.BUILDING_COSTS[buildingId];
    if (!costs) return;

    // Count existing buildings of same type for level cost
    let existingCount = 0;
    for (const r of this.gameState.getPlayerRegions(playerId)) {
      if (r.building === buildingId) existingCount++;
    }
    const multiplier = 1 + existingCount * (gameConstants.BUILDING_LEVEL_COST_MULT / 100);

    const actualCost = {
      iron: Math.ceil(costs.iron * multiplier),
      crystal: Math.ceil(costs.crystal * multiplier),
      uranium: Math.ceil(costs.uranium * multiplier),
    };

    if (player.resources.iron < actualCost.iron ||
        player.resources.crystal < actualCost.crystal ||
        player.resources.uranium < actualCost.uranium) return;

    player.resources.iron -= actualCost.iron;
    player.resources.crystal -= actualCost.crystal;
    player.resources.uranium -= actualCost.uranium;
    region.building = buildingId;
  }

  // ─── Broadcasting ───────────────────────────────────────

  _broadcastState(events) {
    this._playerBroadcastCounter++;
    const sendPlayerData = this._playerBroadcastCounter % gameConstants.PLAYER_DATA_TICK_INTERVAL === 0;

    // Process events (captures, eliminations, game over)
    for (const event of events) {
      if (event.type === 'region_captured') {
        this._emitToAll(eventTypes.REGION_CAPTURED, event);
      } else if (event.type === 'player_eliminated') {
        this._emitToAll(eventTypes.PLAYER_ELIMINATED, event);
      } else if (event.type === 'game_over') {
        this._endGame(event.winnerId);
        return;
      } else if (event.type === 'army_destroyed') {
        this._emitToAll(eventTypes.ARMY_DESTROYED, { armyId: event.armyId, destroyedBy: event.destroyedBy });
      } else if (event.type === 'siege_started') {
        this._emitToAll(eventTypes.SIEGE_STARTED, event);
      } else if (event.type === 'siege_ended') {
        this._emitToAll(eventTypes.SIEGE_ENDED, event);
      } else if (event.type === 'gate_teleport') {
        this._emitToAll(eventTypes.GATE_TELEPORT, event);
      } else if (event.type === 'ability_granted') {
        const socket = this._getSocket(this.gameState.getPlayer(event.playerId)?.socketId);
        if (socket) socket.emit(eventTypes.ABILITY_GRANTED, event);
      }
    }

    // Delta regions
    const dirtyRegions = this.gameState.getDirtyRegions();

    // Army updates (count changes only)
    const armyUpdates = [];
    const destroyedArmyIds = events
      .filter(e => e.type === 'army_destroyed')
      .map(e => e.armyId);

    for (const army of this.gameState.armies.values()) {
      armyUpdates.push({ id: army.id, c: army.count });
    }

    // Per-player state update
    for (const player of this.gameState.getAllPlayers()) {
      if (player.isBot) continue;
      const socket = this._getSocket(player.socketId);
      if (!socket) continue;

      const visible = calculateVisibility(this.gameState, player.id);

      // Filter regions by visibility
      const filteredRegions = dirtyRegions.map(r => {
        if (!visible.has(r.id)) return null;
        // Stealth tower: hide HP
        const region = this.gameState.getRegion(r.id);
        if (region && region.building === 'stealth_tower' && region.ownerId !== player.id) {
          return { ...r, hp: -1 };
        }
        return r;
      }).filter(Boolean);

      // Filter army updates by visibility
      const filteredArmies = armyUpdates.filter(a => {
        const army = this.gameState.getArmy(a.id);
        if (!army) return false;
        if (army.ownerId === player.id) return true;
        // Check if army source or target is visible
        return visible.has(army.sourceRegionId) || visible.has(army.targetRegionId);
      });

      const stateUpdate = {
        tick: this.gameState.tick,
        regions: filteredRegions,
        armyUpdates: filteredArmies,
        destroyedArmies: destroyedArmyIds,
      };

      // Player data every 5th tick
      if (sendPlayerData) {
        stateUpdate.players = this.gameState.getAllPlayers().map(p => p.serialize(p.id === player.id));
      }

      socket.emit(eventTypes.STATE_UPDATE, stateUpdate);
    }
  }

  _endGame(winnerId) {
    this.gameState.phase = 'finished';
    if (this.gameLoop) this.gameLoop.stop();

    // Diamond rewards
    const winner = this.gameState.getPlayer(winnerId);
    let diamondReward = 0;
    if (winner) {
      if (this.mode === 'bot') diamondReward = gameConstants.DIAMOND_REWARD_BOT_WIN;
      else if (this.mode === 'ranked') diamondReward = gameConstants.DIAMOND_REWARD_RANKED_WIN;
      else diamondReward = gameConstants.DIAMOND_REWARD_NORMAL_WIN;
    }

    // Emit game over
    this._emitToAll(eventTypes.GAME_OVER, {
      winnerId,
      winnerUsername: winner?.username,
      mode: this.mode,
      diamondReward,
      players: this.gameState.getAllPlayers().map(p => p.serialize(true)),
    });

    // Cleanup timers
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.spawnTimer) clearTimeout(this.spawnTimer);
    if (this.previewTimer) clearTimeout(this.previewTimer);
  }

  // ─── Helpers ────────────────────────────────────────────

  _getSocket(socketId) {
    if (!socketId || !this.io) return null;
    return this.io.sockets.sockets.get(socketId) || null;
  }

  _emitToAll(event, data) {
    if (this.io) this.io.to(this.id).emit(event, data);
  }

  _emitToVisible(event, data, regionId) {
    for (const player of this.gameState.getAllPlayers()) {
      if (player.isBot) continue;
      const visible = calculateVisibility(this.gameState, player.id);
      if (visible.has(regionId)) {
        const socket = this._getSocket(player.socketId);
        if (socket) socket.emit(event, data);
      }
    }
  }
}

module.exports = GameRoom;

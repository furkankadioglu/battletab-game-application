/**
 * BattleTab v2 — Game Scene
 * Full gameplay: polygon map, armies, input, socket sync, abilities.
 */

import Phaser from 'phaser';
import gameBridge from '../game-ui/GameBridge.js';
import SocketManager from '../network/SocketManager.js';
import { playBubble, playCapture, playTeleport, playBomb } from '../audio/SoundManager.js';

const socket = SocketManager.getInstance();

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.gameData = data;
    this.regionGraphics = new Map();
    this.armySprites = new Map();
    this.selectedSources = [];
    this.spawnPhase = data.spawnPhase || false;
    this.isPlaying = false;
  }

  create() {
    const map = this.gameData.map || {};
    const w = map.width || 1600, h = map.height || 900;

    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.setBackgroundColor('#134e6f');

    // Zoom (wheel)
    this.input.on('wheel', (_p, _go, _dx, dy) => {
      const cam = this.cameras.main;
      cam.zoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.3, 2.0);
    });

    // Pan (right-click drag)
    this.input.on('pointermove', (p) => {
      if (p.isDown && (p.button === 2 || p.button === 1)) {
        const cam = this.cameras.main;
        cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
        cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
      }
    });

    this._renderRegions(map.regions || []);
    this._renderGates(map.gates || []);

    // Click → spawn select or send soldiers
    this.input.on('pointerdown', (p) => {
      if (p.button !== 0) return;
      this._handleClick(this.cameras.main.getWorldPoint(p.x, p.y));
    });

    // Ability keys
    this.input.keyboard.on('keydown-ONE', () => socket.emit('use_missile', {}));
    this.input.keyboard.on('keydown-TWO', () => socket.emit('use_nuclear', {}));
    this.input.keyboard.on('keydown-THREE', () => socket.emit('use_barracks', {}));
    this.input.keyboard.on('keydown-FOUR', () => socket.emit('use_speed_boost'));
    this.input.keyboard.on('keydown-FIVE', () => socket.emit('use_freeze'));

    this._registerSocketListeners();

    gameBridge.emit('game:init', {
      myPlayerId: this.gameData.myPlayerId,
      players: this.gameData.players,
      mode: this.gameData.mode,
      mapType: this.gameData.mapType,
    });
  }

  update(_time, delta) {
    if (!this.isPlaying) return;
    const dt = delta / 1000;

    for (const [, obj] of this.armySprites) {
      const a = obj.data;
      if (!a || (a._snapUntil && Date.now() < a._snapUntil)) continue;

      const wp = (a.waypoints || [])[a.waypointIndex || 0];
      if (!wp) continue;

      const dx = wp.x - a.position.x, dy = wp.y - a.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2) {
        a.position.x = wp.x; a.position.y = wp.y;
        a.waypointIndex = (a.waypointIndex || 0) + 1;
      } else {
        const r = Math.min((a.speed || 25) * dt / dist, 1);
        a.position.x += dx * r; a.position.y += dy * r;
      }

      obj.sprite.setPosition(a.position.x, a.position.y);
      if (obj.text) obj.text.setPosition(a.position.x, a.position.y - 12);
    }
  }

  // ─── Regions ────────────────────────────────────────────

  _renderRegions(regions) {
    for (const r of regions) {
      const poly = r.polygon || r.vertices || [];
      const color = this._regionColor(r);

      if (poly.length < 3) {
        const c = this.add.circle(r.center.x, r.center.y, 10, color, 0.6);
        this.regionGraphics.set(r.id, { fill: c, text: null, data: { ...r }, points: null });
        continue;
      }

      const pts = poly.map(p => new Phaser.Math.Vector2(p.x, p.y));
      const g = this.add.graphics();
      this._drawPoly(g, pts, color);

      const txt = r.hp > 0 ? this.add.text(r.center.x, r.center.y, String(Math.floor(r.hp)), {
        fontSize: '11px', color: '#fff', fontFamily: 'Inter', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20) : null;

      // Type icon
      const icons = { TOWER: '★', MOUNTAIN: '⛰', SNOW: '❄', SPEED: '⚡' };
      if (icons[r.type]) {
        this.add.text(r.center.x, r.center.y - 14, icons[r.type], { fontSize: '10px' }).setOrigin(0.5).setDepth(21);
      }

      this.regionGraphics.set(r.id, { fill: g, text: txt, data: { ...r }, points: pts });
    }
  }

  _drawPoly(g, pts, color) {
    g.clear();
    g.fillStyle(color, 0.6);
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath(); g.fillPath();
    g.lineStyle(1, 0x000000, 0.3);
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath(); g.strokePath();
  }

  _regionColor(r) {
    if (r.type === 'ROCKY') return 0x2a2a2a;
    if (!r.ownerId) return 0x3a3a5c;
    const p = (this.gameData.players || []).find(x => x.id === r.ownerId);
    return p ? parseInt(p.color.replace('#', ''), 16) : 0x3a3a5c;
  }

  _updateRegion(id, delta) {
    const rg = this.regionGraphics.get(id);
    if (!rg) return;
    Object.assign(rg.data, delta);
    if (rg.text) {
      const hp = delta.hp !== undefined ? delta.hp : rg.data.hp;
      rg.text.setText(hp === -1 ? '?' : String(Math.floor(hp)));
    }
    if (delta.ownerId !== undefined && rg.points) {
      this._drawPoly(rg.fill, rg.points, this._regionColor(rg.data));
    }
  }

  // ─── Gates ──────────────────────────────────────────────

  _renderGates(gates) {
    for (const g of gates) {
      const c = g.colorHex || 0xBB44FF;
      this.add.circle(g.position.x, g.position.y, 12, c, 0.7).setDepth(15);
      this.add.circle(g.position.x, g.position.y, 6, c, 0.4).setDepth(15);
    }
  }

  // ─── Armies ─────────────────────────────────────────────

  _addArmy(d) {
    const p = (this.gameData.players || []).find(x => x.id === d.ownerId);
    const c = p ? parseInt(p.color.replace('#', ''), 16) : 0xffffff;
    const s = this.add.circle(d.position.x, d.position.y, 5, c).setDepth(50);
    const t = this.add.text(d.position.x, d.position.y - 12, String(d.count || ''), {
      fontSize: '9px', color: '#fff', fontFamily: 'Inter', stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(51);
    this.armySprites.set(d.id, { sprite: s, text: t, data: { ...d } });
    playBubble();
  }

  _removeArmy(id) {
    const o = this.armySprites.get(id);
    if (o) { o.sprite.destroy(); if (o.text) o.text.destroy(); this.armySprites.delete(id); }
  }

  // ─── Input ──────────────────────────────────────────────

  _handleClick(wp) {
    let closest = null, minD = Infinity;
    for (const [, rg] of this.regionGraphics) {
      const r = rg.data;
      if (r.type === 'ROCKY') continue;
      const d = Math.sqrt((wp.x - r.center.x) ** 2 + (wp.y - r.center.y) ** 2);
      if (d < minD && d < 60) { minD = d; closest = r; }
    }
    if (!closest) return;

    if (this.spawnPhase) {
      socket.emit('select_spawn', { regionId: closest.id });
      return;
    }
    if (!this.isPlaying) return;

    if (closest.ownerId === this.gameData.myPlayerId) {
      if (!this.selectedSources.includes(closest.id)) {
        this.selectedSources.push(closest.id);
        if (this.selectedSources.length > 12) this.selectedSources.shift();
      }
    } else if (this.selectedSources.length > 0) {
      socket.emit('send_soldiers', { sourceIds: this.selectedSources, targetId: closest.id });
      this.selectedSources = [];
    } else {
      // Auto-select 3 nearest own
      const own = [...this.regionGraphics.values()]
        .filter(rg => rg.data.ownerId === this.gameData.myPlayerId && rg.data.hp >= 2)
        .map(rg => ({ id: rg.data.id, d: Math.sqrt((rg.data.center.x - closest.center.x) ** 2 + (rg.data.center.y - closest.center.y) ** 2) }))
        .sort((a, b) => a.d - b.d).slice(0, 3);
      if (own.length) socket.emit('send_soldiers', { sourceIds: own.map(r => r.id), targetId: closest.id });
    }
  }

  // ──��� Socket ─────────────────────────────────────────────

  _registerSocketListeners() {
    socket.on('state_update', (d) => {
      if (d.regions) for (const r of d.regions) this._updateRegion(r.id, r);
      if (d.armyUpdates) for (const u of d.armyUpdates) {
        const o = this.armySprites.get(u.id);
        if (o) { o.data.count = u.c; if (o.text) o.text.setText(String(u.c)); }
      }
      if (d.destroyedArmies) for (const id of d.destroyedArmies) this._removeArmy(id);
      if (d.players) { this.gameData.players = d.players; gameBridge.emit('game:stateUpdate', d); }
    });

    socket.on('army_created', (d) => this._addArmy(d));
    socket.on('army_destroyed', (d) => this._removeArmy(d.armyId));
    socket.on('region_captured', (d) => { this._updateRegion(d.regionId, { ownerId: d.newOwnerId }); playCapture(); });

    socket.on('gate_teleport', (d) => {
      const o = this.armySprites.get(d.armyId);
      if (o) { o.data.position = { ...d.toPosition }; o.data._snapUntil = Date.now() + 300; o.sprite.setPosition(d.toPosition.x, d.toPosition.y); if (o.text) o.text.setPosition(d.toPosition.x, d.toPosition.y - 12); }
      playTeleport();
    });

    socket.on('missile_applied', () => playBomb());
    socket.on('nuclear_applied', () => playBomb());
    socket.on('player_eliminated', (d) => { gameBridge.emit('player:eliminated', d); if (d.playerId === this.gameData.myPlayerId) gameBridge.emit('game:eliminated', d); });

    socket.on('spawn_selected', (d) => { this._updateRegion(d.regionId, { ownerId: d.playerId, type: 'SPAWN', hp: 40 }); });
    socket.on('spawn_phase_end', () => { this.spawnPhase = false; });

    socket.on('regions_reveal', (d) => {
      for (const r of d.regions || []) {
        const rg = this.regionGraphics.get(r.id);
        if (rg) { Object.assign(rg.data, r); if (rg.text && r.hp > 0) rg.text.setText(String(Math.floor(r.hp))); if (rg.points) this._drawPoly(rg.fill, rg.points, this._regionColor(rg.data)); }
      }
      setTimeout(() => { this.isPlaying = true; gameBridge.emit('game:playing', {}); }, 3200);
    });

    socket.on('game_over', (d) => { this.isPlaying = false; d.myPlayerId = this.gameData.myPlayerId; gameBridge.emit('game:over', d); this.scene.start('GameOverScene', d); });
    socket.on('game_countdown', (d) => gameBridge.emit('game:countdown', d));
    socket.on('ability_granted', (d) => gameBridge.emit('ability:granted', d));
  }

  shutdown() { this.regionGraphics.clear(); this.armySprites.clear(); this.selectedSources = []; }
}

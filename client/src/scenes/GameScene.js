/**
 * BattleTab v2 — Game Scene
 * Main gameplay scene: renders map, armies, handles input, syncs with server.
 */

import Phaser from 'phaser';
import gameBridge from '../game-ui/GameBridge.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.gameData = null;
  }

  init(data) {
    this.gameData = data;
  }

  create() {
    const { width, height } = this.gameData.map || { width: 1600, height: 900 };

    // Set world bounds
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setBackgroundColor('#134e6f');

    // Placeholder: render region centers as circles
    const regions = this.gameData.map?.regions || [];
    for (const r of regions) {
      const color = r.ownerId
        ? this._getPlayerColor(r.ownerId)
        : 0x3a3a5c;

      const circle = this.add.circle(r.center.x, r.center.y, 8, color);
      circle.setData('regionId', r.id);

      // HP text
      if (r.hp > 0) {
        this.add.text(r.center.x, r.center.y - 12, String(Math.floor(r.hp)), {
          fontSize: '10px',
          color: '#ffffff',
          fontFamily: 'Inter',
        }).setOrigin(0.5);
      }
    }

    // Emit game init to React HUD
    gameBridge.emit('game:init', {
      myPlayerId: this.gameData.myPlayerId,
      players: this.gameData.players,
      mode: this.gameData.mode,
      mapType: this.gameData.mapType,
    });

    console.log('GameScene created with', regions.length, 'regions');
  }

  update(time, delta) {
    // Future: army prediction, camera, selection updates
  }

  _getPlayerColor(playerId) {
    const player = (this.gameData.players || []).find(p => p.id === playerId);
    if (!player) return 0x3a3a5c;
    return parseInt(player.color.replace('#', ''), 16);
  }
}

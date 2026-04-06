/**
 * BattleTab v2 — Boot Scene
 * Initial loading, asset preload, auth check.
 */

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Loading bar
    const { width, height } = this.cameras.main;
    const barWidth = Math.min(400, width * 0.6);
    const barHeight = 8;
    const barX = (width - barWidth) / 2;
    const barY = height / 2 + 40;

    const bg = this.add.rectangle(barX + barWidth / 2, barY, barWidth, barHeight, 0x1a1a2e);
    const bar = this.add.rectangle(barX, barY, 0, barHeight, 0xc8a84e).setOrigin(0, 0.5);

    const title = this.add.text(width / 2, height / 2 - 20, 'BattleTab', {
      fontFamily: 'Cinzel, serif',
      fontSize: '32px',
      color: '#c8a84e',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = barWidth * value;
    });

    // No actual assets to load yet — placeholder
    // Future: textures, sounds, etc.
  }

  create() {
    // Boot complete — transition handled by main app lifecycle
    console.log('BootScene ready');
    this.scene.stop();
  }
}

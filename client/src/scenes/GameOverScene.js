/**
 * BattleTab v2 — Game Over Scene
 * Victory/defeat screen with stats, scoreboard, and confetti.
 */

import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.result = data; // { winnerId, winnerUsername, players, stats, mode, rankingData, diamondReward }
  }

  create() {
    const { width, height } = this.cameras.main;
    const isWinner = this.result.winnerId === this.result.myPlayerId;

    // Background overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Title
    const title = isWinner ? 'Victory!' : 'Defeat';
    const titleColor = isWinner ? '#c8a84e' : '#d94a4a';
    this.add.text(width / 2, height * 0.15, title, {
      fontFamily: 'Cinzel, serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: titleColor,
    }).setOrigin(0.5);

    // Winner name
    if (this.result.winnerUsername) {
      this.add.text(width / 2, height * 0.25, this.result.winnerUsername, {
        fontFamily: 'Inter',
        fontSize: '20px',
        color: '#d0d0e0',
      }).setOrigin(0.5);
    }

    // Stats
    const stats = this.result.stats || {};
    const statsText = [
      `Regions Captured: ${stats.regionsCaptured || 0}`,
      `Armies Sent: ${stats.armiesSent || 0}`,
      `Peak Power: ${stats.peakPower || 0}`,
    ].join('\n');

    this.add.text(width / 2, height * 0.42, statsText, {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#d0d0e0',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Diamond reward
    if (this.result.diamondReward) {
      this.add.text(width / 2, height * 0.58, `+${this.result.diamondReward} diamonds`, {
        fontFamily: 'Inter',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#c8a84e',
      }).setOrigin(0.5);
    }

    // ELO change (ranked)
    if (this.result.rankingData) {
      const rd = this.result.rankingData;
      const sign = rd.ratingChange > 0 ? '+' : '';
      this.add.text(width / 2, height * 0.65, `${sign}${rd.ratingChange} ELO (${rd.newRating})`, {
        fontFamily: 'Inter',
        fontSize: '16px',
        color: rd.ratingChange > 0 ? '#4ad94a' : '#d94a4a',
      }).setOrigin(0.5);
    }

    // Confetti for winner
    if (isWinner) this._spawnConfetti(width, height);

    // Buttons (interactive text for now)
    const playAgain = this.add.text(width / 2 - 80, height * 0.82, 'Play Again', {
      fontFamily: 'Cinzel, serif',
      fontSize: '16px',
      color: '#c8a84e',
      backgroundColor: 'rgba(200,168,78,0.15)',
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const backToMenu = this.add.text(width / 2 + 80, height * 0.82, 'Menu', {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: '#d0d0e0',
      backgroundColor: 'rgba(100,100,120,0.2)',
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playAgain.on('pointerdown', () => {
      // Future: restart game flow
      this.scene.stop();
    });

    backToMenu.on('pointerdown', () => {
      this.scene.stop();
      // Future: show menu
    });
  }

  _spawnConfetti(width, height) {
    const colors = [0xc8a84e, 0xE94560, 0x06D6A0, 0x4CC9F0, 0xFFD166, 0xFF6B35];
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = -20 - Math.random() * 200;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 5;

      const particle = this.add.rectangle(x, y, size, size * 1.5, color);
      particle.setAngle(Math.random() * 360);

      this.tweens.add({
        targets: particle,
        y: height + 50,
        x: x + (Math.random() - 0.5) * 200,
        angle: particle.angle + (Math.random() - 0.5) * 720,
        duration: 2000 + Math.random() * 3000,
        ease: 'Quad.easeIn',
        delay: Math.random() * 1000,
        onComplete: () => particle.destroy(),
      });
    }
  }
}

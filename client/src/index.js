/**
 * BattleTab v2 — Client Entry Point
 * Full lifecycle: auth → menu → lobby → game → game over → menu
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import Phaser from 'phaser';
import AuthApp from './auth/AuthApp.jsx';
import MenuApp from './menu/MenuApp.jsx';
import GameHUD from './game-ui/GameHUD.jsx';
import { initBattleCanvas } from './auth/BattleCanvas.js';
import { getToken, getProfile, clearToken } from './auth/authService.js';
import SocketManager from './network/SocketManager.js';
import GameSync from './network/GameSync.js';
import gameBridge from './game-ui/GameBridge.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import BootScene from './scenes/BootScene.js';

let battleCanvas = null;
let menuRoot = null;
let hudRoot = null;
let phaserGame = null;
let currentUser = null;
const socket = SocketManager.getInstance();

// ─── Auth ──────────────────────────────────────────────────

function showAuth() {
  hideAll();
  const authEl = document.getElementById('auth-root');
  authEl.style.display = 'block';
  battleCanvas = initBattleCanvas('bg-canvas');

  const root = createRoot(authEl);
  root.render(
    React.createElement(AuthApp, {
      onLogin: (user) => {
        if (battleCanvas) { battleCanvas.destroy(); battleCanvas = null; }
        authEl.style.display = 'none';
        root.unmount();
        currentUser = user;
        showMenu(user);
      },
    })
  );
}

// ─── Menu ──────────────────────────────────────────────────

function showMenu(user) {
  hideAll();
  const menuEl = document.getElementById('menu-root');
  menuEl.style.display = 'block';

  if (menuRoot) menuRoot.unmount();
  menuRoot = createRoot(menuEl);
  menuRoot.render(
    React.createElement(MenuApp, {
      user,
      onStartGame: (opts) => startGame(opts, user),
      onLogout: () => {
        clearToken();
        socket.disconnect();
        menuEl.style.display = 'none';
        if (menuRoot) { menuRoot.unmount(); menuRoot = null; }
        showAuth();
      },
    })
  );
}

// ─── Game Start ────────────────────────────────────────────

async function startGame(opts, user) {
  const menuEl = document.getElementById('menu-root');
  menuEl.style.display = 'none';
  if (menuRoot) { menuRoot.unmount(); menuRoot = null; }

  // Connect socket
  try {
    await socket.connect();
  } catch (err) {
    console.error('Socket connection failed:', err);
    showMenu(user);
    return;
  }

  // Setup game sync
  const gameSync = new GameSync(socket, gameBridge);
  gameSync.registerListeners();

  // Listen for game_start to launch Phaser
  gameBridge.on('game:start', (gameData) => {
    launchPhaser(gameData, gameSync);
  });

  // Listen for game over
  gameBridge.on('game:over', (data) => {
    // Phaser GameOverScene handles display
    // After player clicks "menu", return to menu
    gameBridge.once('menu:return', () => {
      destroyPhaser();
      socket.disconnect();
      showMenu(currentUser);
    });
  });

  // Join lobby
  socket.emit('join_lobby', {
    mode: opts.mode,
    username: user.username,
    mapType: opts.mapType,
    token: getToken(),
  });

  // Show "Searching..." status
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'block';
  gameEl.innerHTML = '<div id="game-ui-root" style="position:absolute;inset:0;z-index:10;pointer-events:none;"></div>';

  // Waiting overlay
  const waitingDiv = document.createElement('div');
  waitingDiv.id = 'waiting-overlay';
  waitingDiv.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:20;background:rgba(6,6,14,0.95);color:#d0d0e0;font-family:Inter,sans-serif;';
  waitingDiv.innerHTML = `<div style="text-align:center"><h2 style="font-family:Cinzel,serif;color:#c8a84e;margin-bottom:12px;">BattleTab</h2><p>${opts.mode === 'bot' ? 'Starting bot match...' : 'Searching for opponent...'}</p></div>`;
  gameEl.appendChild(waitingDiv);

  // Match found → waiting overlay removed by game_start
  socket.on('match_found', () => {
    const overlay = document.getElementById('waiting-overlay');
    if (overlay) overlay.remove();
  });

  // Queue updates
  socket.on('queue_update', (data) => {
    const overlay = document.getElementById('waiting-overlay');
    if (overlay) {
      const p = overlay.querySelector('p');
      if (p) p.textContent = `Queue position: ${data.position}/${data.queueSize}`;
    }
  });
}

// ─── Phaser ────────────────────────────────────────────────

function launchPhaser(gameData, gameSync) {
  const gameEl = document.getElementById('game');

  // Remove waiting overlay
  const overlay = document.getElementById('waiting-overlay');
  if (overlay) overlay.remove();

  // Create Phaser game
  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameEl,
    backgroundColor: '#134e6f',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
    },
    input: {
      activePointers: 3,
      mouse: { preventDefaultWheel: true },
      touch: { capture: true },
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    resolution: 1,
    scene: [GameScene, GameOverScene],
  });

  // Start GameScene with data
  phaserGame.scene.start('GameScene', gameData);

  // Mount React HUD
  const hudEl = document.getElementById('game-ui-root');
  if (hudEl) {
    hudRoot = createRoot(hudEl);
    hudRoot.render(React.createElement(GameHUD));
  }
}

function destroyPhaser() {
  if (hudRoot) { hudRoot.unmount(); hudRoot = null; }
  if (phaserGame) { phaserGame.destroy(true); phaserGame = null; }
  gameBridge.clear();
}

// ─── Helpers ───────────────────────────────────────────────

function hideAll() {
  document.getElementById('auth-root').style.display = 'none';
  document.getElementById('menu-root').style.display = 'none';
  document.getElementById('game').style.display = 'none';
}

// ─── Init ──────────────────────────────────────────────────

async function init() {
  const token = getToken();
  if (token) {
    try {
      const data = await getProfile(token);
      currentUser = data.user;
      showMenu(data.user);
      return;
    } catch {
      clearToken();
    }
  }
  showAuth();
}

init();

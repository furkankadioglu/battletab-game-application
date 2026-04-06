/**
 * BattleTab v2 — Client Entry Point
 * Bootstraps auth -> menu -> game lifecycle.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import AuthApp from './auth/AuthApp.jsx';
import MenuApp from './menu/MenuApp.jsx';
import { initBattleCanvas } from './auth/BattleCanvas.js';
import { getToken, getProfile, clearToken } from './auth/authService.js';

let battleCanvas = null;
let menuRoot = null;

function showAuth() {
  const authEl = document.getElementById('auth-root');
  authEl.style.display = 'block';
  document.getElementById('menu-root').style.display = 'none';

  battleCanvas = initBattleCanvas('bg-canvas');

  const root = createRoot(authEl);
  root.render(
    React.createElement(AuthApp, {
      onLogin: (user) => {
        if (battleCanvas) battleCanvas.destroy();
        authEl.style.display = 'none';
        root.unmount();
        showMenu(user);
      },
    })
  );
}

function showMenu(user) {
  const menuEl = document.getElementById('menu-root');
  menuEl.style.display = 'block';

  if (menuRoot) menuRoot.unmount();
  menuRoot = createRoot(menuEl);
  menuRoot.render(
    React.createElement(MenuApp, {
      user,
      onStartGame: (opts) => {
        console.log('Starting game:', opts);
        // Game start will be implemented in Phase 5-6
      },
      onLogout: () => {
        clearToken();
        menuEl.style.display = 'none';
        menuRoot.unmount();
        menuRoot = null;
        showAuth();
      },
    })
  );
}

async function init() {
  const token = getToken();
  if (token) {
    try {
      const data = await getProfile(token);
      showMenu(data.user);
      return;
    } catch {
      clearToken();
    }
  }
  showAuth();
}

init();

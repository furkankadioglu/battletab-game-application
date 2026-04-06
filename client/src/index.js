/**
 * BattleTab v2 — Client Entry Point
 * Bootstraps auth → menu → game lifecycle.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import AuthApp from './auth/AuthApp.jsx';
import { initBattleCanvas } from './auth/BattleCanvas.js';
import { getToken, getProfile } from './auth/authService.js';

let battleCanvas = null;

function showAuth() {
  const authRoot = document.getElementById('auth-root');
  authRoot.style.display = 'block';

  // Animated background
  battleCanvas = initBattleCanvas('bg-canvas');

  const root = createRoot(authRoot);
  root.render(
    React.createElement(AuthApp, {
      onLogin: (user) => {
        if (battleCanvas) battleCanvas.destroy();
        authRoot.style.display = 'none';
        showMenu(user);
      },
    })
  );
}

function showMenu(user) {
  const menuRoot = document.getElementById('menu-root');
  menuRoot.style.display = 'block';
  menuRoot.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100dvh;color:#d0d0e0;font-family:Inter,sans-serif;">
    <div style="text-align:center;">
      <h1 style="font-family:Cinzel,serif;color:#c8a84e;margin-bottom:16px;">BattleTab</h1>
      <p>Welcome, ${user.username}!</p>
      <p style="opacity:0.5;margin-top:8px;">Menu coming in Phase 3</p>
    </div>
  </div>`;
}

async function init() {
  const token = getToken();
  if (token) {
    try {
      const data = await getProfile(token);
      showMenu(data.user);
      return;
    } catch {
      // Token expired or invalid
    }
  }
  showAuth();
}

init();

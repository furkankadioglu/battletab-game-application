/**
 * BattleTab v2 — Game HUD
 * React overlay for in-game UI: header, players, stats, timer.
 */

import React, { useState, useEffect } from 'react';
import gameBridge from './GameBridge.js';
import { t } from '../i18n/i18n.js';
import './game-hud.css';

export default function GameHUD() {
  const [gameData, setGameData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [timer, setTimer] = useState(0);
  const [phase, setPhase] = useState('waiting');

  useEffect(() => {
    const onInit = (data) => {
      setGameData(data);
      setPlayers(data.players || []);
    };

    const onStateUpdate = (data) => {
      if (data.players) setPlayers(data.players);
    };

    const onCountdown = (data) => {
      setPhase('countdown');
      setTimer(data.seconds);
    };

    const onSpawnEnd = () => setPhase('preview');
    const onGameStart = () => setPhase('playing');
    const onGameOver = () => setPhase('finished');

    gameBridge.on('game:init', onInit);
    gameBridge.on('game:stateUpdate', onStateUpdate);
    gameBridge.on('game:countdown', onCountdown);
    gameBridge.on('spawn:end', onSpawnEnd);
    gameBridge.on('game:start', onGameStart);
    gameBridge.on('game:over', onGameOver);

    return () => {
      gameBridge.off('game:init', onInit);
      gameBridge.off('game:stateUpdate', onStateUpdate);
      gameBridge.off('game:countdown', onCountdown);
      gameBridge.off('spawn:end', onSpawnEnd);
      gameBridge.off('game:start', onGameStart);
      gameBridge.off('game:over', onGameOver);
    };
  }, []);

  if (!gameData) return null;

  return (
    <div className="game-hud">
      {/* Header */}
      <div className="hud-header">
        <span className="hud-logo">BattleTab</span>
        <span className="hud-mode">{gameData.mode} — {gameData.mapType}</span>
        <span className="hud-timer">{formatTime(timer)}</span>
      </div>

      {/* Player List */}
      <div className="hud-players">
        {players.map(p => (
          <div key={p.id} className={`hud-player ${p.isEliminated ? 'eliminated' : ''}`}>
            <span className="hud-player-dot" style={{ backgroundColor: p.color }} />
            <span className="hud-player-name">{p.username}</span>
            <span className="hud-player-regions">{p.regionCount || 0}</span>
          </div>
        ))}
      </div>

      {/* Phase overlays handled separately */}
      {phase === 'countdown' && (
        <div className="hud-overlay">
          <span className="hud-countdown">{timer}</span>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

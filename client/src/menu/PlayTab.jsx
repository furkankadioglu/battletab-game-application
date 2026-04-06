/**
 * BattleTab v2 — Play Tab
 * Map selection + mode selection + Play button.
 */

import React, { useState } from 'react';
import { t } from '../i18n/i18n.js';
import maps from '../config/maps.js';

const MODES = [
  { id: 'bot', label: 'botMatch', desc: 'botMatchDesc', reward: 1 },
  { id: 'normal', label: 'onlinePvP', desc: 'onlinePvPDesc', reward: 2 },
  { id: 'ranked', label: 'rankedMatch', desc: 'rankedMatchDesc', reward: 5, cost: 1 },
];

export default function PlayTab({ user, onStartGame }) {
  const [selectedMap, setSelectedMap] = useState(maps[0].id);
  const [selectedMode, setSelectedMode] = useState('bot');

  function handlePlay() {
    if (onStartGame) {
      onStartGame({ mapType: selectedMap, mode: selectedMode });
    }
  }

  return (
    <div className="play-tab">
      {/* Map Selection */}
      <h2 className="play-section-title">{t('selectMap')}</h2>
      <div className="play-maps">
        {maps.map(map => (
          <div
            key={map.id}
            className={`play-map-card ${selectedMap === map.id ? 'selected' : ''}`}
            onClick={() => setSelectedMap(map.id)}
          >
            <h3>{map.name}</h3>
            <p className="play-map-info">{t('regions', { count: map.regions })}</p>
            <p className="play-map-info">{t('players', { min: map.minPlayers, max: map.maxPlayers })}</p>
          </div>
        ))}
      </div>

      {/* Mode Selection */}
      <h2 className="play-section-title">{t('selectMode')}</h2>
      <div className="play-modes">
        {MODES.map(mode => (
          <div
            key={mode.id}
            className={`play-mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
            onClick={() => setSelectedMode(mode.id)}
          >
            <h3>{t(mode.label)}</h3>
            <p className="play-mode-desc">{t(mode.desc)}</p>
            <span className="play-mode-reward">{t('reward', { amount: mode.reward })}</span>
            {mode.cost && (
              <span className="play-mode-cost">{t('entryCost', { amount: mode.cost })}</span>
            )}
          </div>
        ))}
      </div>

      {/* Play Button */}
      <button className="play-button" onClick={handlePlay}>
        {t('playButton')}
      </button>
    </div>
  );
}

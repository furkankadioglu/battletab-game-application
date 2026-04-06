/**
 * BattleTab v2 — Menu System
 * 6-tab navigation: Play, Store, Friends, Profile, Ranked, Settings
 */

import React, { useState } from 'react';
import { t } from '../i18n/i18n.js';
import PlayTab from './PlayTab.jsx';
import './menu.css';

const TABS = ['play', 'store', 'friends', 'profile', 'ranked', 'settings'];

export default function MenuApp({ user, onStartGame, onLogout }) {
  const [activeTab, setActiveTab] = useState('play');

  return (
    <div className="menu-container">
      {/* Header */}
      <div className="menu-header">
        <h1 className="menu-logo">BattleTab</h1>
        <div className="menu-user-info">
          <span className="menu-username">{user.username}</span>
          <span className="menu-diamonds">{user.diamonds} {t('diamonds')}</span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="menu-content">
        {activeTab === 'play' && (
          <PlayTab user={user} onStartGame={onStartGame} />
        )}
        {activeTab === 'store' && (
          <div className="menu-placeholder">
            <h2>{t('store')}</h2>
            <p>Coming in Phase 9</p>
          </div>
        )}
        {activeTab === 'friends' && (
          <div className="menu-placeholder">
            <h2>{t('friends')}</h2>
            <p>Coming in Phase 9</p>
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="menu-placeholder">
            <h2>{t('profile')}</h2>
            <p>{user.username}</p>
            {user.playerCode && <p>Code: {user.playerCode}</p>}
            <p>{t('gamesPlayed')}: {
              (user.stats?.bot?.played || 0) +
              (user.stats?.normal?.played || 0) +
              (user.stats?.ranked?.played || 0)
            }</p>
          </div>
        )}
        {activeTab === 'ranked' && (
          <div className="menu-placeholder">
            <h2>{t('ranked')}</h2>
            <p>Coming in Phase 8</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="menu-placeholder">
            <h2>{t('settings')}</h2>
            <button className="menu-btn-danger" onClick={onLogout}>{t('logout')}</button>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="menu-tabbar">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`menu-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(tab)}
          </button>
        ))}
      </div>
    </div>
  );
}

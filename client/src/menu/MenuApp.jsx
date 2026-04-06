/**
 * BattleTab v2 — Menu System
 * 6-tab navigation with live data from API.
 */

import React, { useState } from 'react';
import { t } from '../i18n/i18n.js';
import PlayTab from './PlayTab.jsx';
import StoreTab from './StoreTab.jsx';
import FriendsTab from './FriendsTab.jsx';
import ProfileTab from './ProfileTab.jsx';
import RankedTab from './RankedTab.jsx';
import './menu.css';

const TABS = ['play', 'store', 'friends', 'profile', 'ranked', 'settings'];

export default function MenuApp({ user, onStartGame, onLogout }) {
  const [activeTab, setActiveTab] = useState('play');

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1 className="menu-logo">BattleTab</h1>
        <div className="menu-user-info">
          <span className="menu-username">{user.username}</span>
          <span className="menu-diamonds">{user.diamonds} {t('diamonds')}</span>
        </div>
      </div>

      <div className="menu-content">
        {activeTab === 'play' && <PlayTab user={user} onStartGame={onStartGame} />}
        {activeTab === 'store' && <StoreTab user={user} />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'profile' && <ProfileTab user={user} />}
        {activeTab === 'ranked' && <RankedTab user={user} onStartGame={onStartGame} />}
        {activeTab === 'settings' && (
          <div className="menu-placeholder">
            <h2>{t('settings')}</h2>
            <button className="menu-btn-danger" onClick={onLogout}>{t('logout')}</button>
          </div>
        )}
      </div>

      <div className="menu-tabbar">
        {TABS.map(tab => (
          <button key={tab} className={`menu-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {t(tab)}
          </button>
        ))}
      </div>
    </div>
  );
}

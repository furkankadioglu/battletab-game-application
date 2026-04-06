import React, { useState, useEffect } from 'react';
import { t } from '../i18n/i18n.js';

export default function RankedTab({ user, onStartGame }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch('/api/ranking/leaderboard?limit=20').then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  const leagueColors = { Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Diamond: '#B9F2FF', Master: '#FF6B6B' };

  return (
    <div className="play-tab">
      <h2 className="play-section-title">{t('ranked')}</h2>

      <div className="play-mode-card" style={{ marginBottom: 16, textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'rgba(200,200,220,0.5)', marginBottom: 8 }}>{t('currentRating')}</p>
        <p style={{ fontSize: '2rem', fontWeight: 700, color: '#c8a84e' }}>1000</p>
        <p style={{ color: leagueColors.Gold, fontWeight: 600 }}>{t('gold')}</p>
        {!user?.isGuest && (
          <button onClick={() => onStartGame({ mode: 'ranked', mapType: 'turkey' })} className="play-button" style={{ marginTop: 12, padding: '10px 24px', fontSize: '0.9rem' }}>
            {t('playRanked')} (-1 {t('diamonds')})
          </button>
        )}
        {user?.isGuest && <p style={{ color: '#d94a4a', fontSize: '0.8rem', marginTop: 8 }}>Register to play ranked</p>}
      </div>

      <h3 style={{ color: '#c8a84e', fontSize: '0.9rem', marginBottom: 8 }}>{t('leaderboard')}</h3>
      {leaderboard.length === 0 && <p style={{ color: 'rgba(200,200,220,0.4)', fontSize: '0.85rem' }}>No ranked players yet</p>}
      {leaderboard.map((entry, i) => (
        <div key={entry.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(10,10,25,0.3)', borderRadius: 8, marginBottom: 4 }}>
          <span style={{ width: 24, color: i < 3 ? '#c8a84e' : '#888', fontWeight: 600 }}>#{i + 1}</span>
          <span style={{ flex: 1, color: '#d0d0e0' }}>{entry.userId}</span>
          <span style={{ color: '#c8a84e', fontWeight: 600 }}>{entry.rating}</span>
          <span style={{ color: leagueColors[entry.league] || '#888', fontSize: '0.75rem' }}>{entry.league}</span>
        </div>
      ))}
    </div>
  );
}

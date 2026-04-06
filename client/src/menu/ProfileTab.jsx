import React from 'react';
import { t } from '../i18n/i18n.js';

export default function ProfileTab({ user }) {
  if (!user) return null;
  const stats = user.stats || {};
  const total = (stats.bot?.played || 0) + (stats.normal?.played || 0) + (stats.ranked?.played || 0);
  const wins = (stats.bot?.won || 0) + (stats.normal?.won || 0) + (stats.ranked?.won || 0);
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="play-tab">
      <h2 className="play-section-title">{t('profile')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="play-mode-card">
          <h3>{user.username}</h3>
          {user.playerCode && <p className="play-mode-desc">{t('playerCode')}: {user.playerCode}</p>}
          <p className="play-mode-desc">{t('diamonds')}: {user.diamonds}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          <StatCard label={t('gamesPlayed')} value={total} />
          <StatCard label={t('gamesWon')} value={wins} />
          <StatCard label={t('winRate')} value={`${winRate}%`} />
        </div>
        {['bot', 'normal', 'ranked'].map(mode => {
          const s = stats[mode] || {};
          return (
            <div key={mode} className="play-mode-card">
              <h3 style={{ textTransform: 'capitalize' }}>{mode}</h3>
              <p className="play-mode-desc">{s.played || 0} {t('gamesPlayed')} / {s.won || 0} W / {s.lost || 0} L</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ padding: '12px 16px', background: 'rgba(10,10,25,0.5)', borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#c8a84e' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(200,200,220,0.5)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

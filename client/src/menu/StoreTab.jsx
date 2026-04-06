import React, { useState, useEffect } from 'react';
import { t } from '../i18n/i18n.js';
import { getToken } from '../auth/authService.js';

export default function StoreTab({ user }) {
  const [catalog, setCatalog] = useState([]);
  const [owned, setOwned] = useState([]);
  const [active, setActive] = useState({});
  const [diamonds, setDiamonds] = useState(user?.diamonds || 0);
  const [category, setCategory] = useState('skin');

  useEffect(() => {
    fetch('/api/store/catalog').then(r => r.json()).then(setCatalog).catch(() => {});
    const token = getToken();
    if (token) {
      fetch('/api/store/my-skins', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { setOwned(d.owned || []); setActive(d.active || {}); setDiamonds(d.diamonds || 0); })
        .catch(() => {});
    }
  }, []);

  const filtered = catalog.filter(s => s.category === category);
  const categories = ['skin', 'army_shape', 'trail_effect', 'capture_effect'];

  async function buy(skinId) {
    const token = getToken();
    const res = await fetch('/api/store/purchase', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ skinId }),
    });
    const data = await res.json();
    if (data.success) { setOwned([...owned, skinId]); setDiamonds(data.diamonds); }
  }

  async function equip(skinId) {
    const token = getToken();
    const res = await fetch('/api/store/equip', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ skinId }),
    });
    const data = await res.json();
    if (data.success) setActive({ ...active, [data.category]: skinId });
  }

  return (
    <div className="play-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="play-section-title">{t('store')}</h2>
        <span style={{ color: '#c8a84e', fontWeight: 600 }}>{diamonds} {t('diamonds')}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`menu-tab ${category === c ? 'active' : ''}`}
            style={{ flex: 1, padding: '8px 4px', border: '1px solid rgba(200,168,78,0.2)', borderRadius: 8, background: category === c ? 'rgba(200,168,78,0.1)' : 'transparent', color: category === c ? '#c8a84e' : '#888', cursor: 'pointer', fontSize: '0.75rem' }}>
            {t(c === 'skin' ? 'skins' : c === 'army_shape' ? 'armyShapes' : c === 'trail_effect' ? 'trailEffects' : 'captureEffects')}
          </button>
        ))}
      </div>
      <div className="play-modes">
        {filtered.map(skin => {
          const isOwned = owned.includes(skin.id);
          const isActive = Object.values(active).includes(skin.id);
          return (
            <div key={skin.id} className="play-mode-card" style={{ borderColor: isActive ? '#c8a84e' : undefined }}>
              <h3>{skin.name}</h3>
              <p className="play-mode-desc" style={{ color: skin.rarity === 'legendary' ? '#c8a84e' : skin.rarity === 'epic' ? '#8338EC' : skin.rarity === 'rare' ? '#4CC9F0' : '#888' }}>
                {t(skin.rarity)}
              </p>
              {!isOwned && <button onClick={() => buy(skin.id)} className="play-button" style={{ marginTop: 8, padding: '8px 16px', fontSize: '0.85rem' }}>{skin.price} {t('diamonds')}</button>}
              {isOwned && !isActive && <button onClick={() => equip(skin.id)} className="play-button" style={{ marginTop: 8, padding: '8px 16px', fontSize: '0.85rem', background: 'rgba(200,168,78,0.2)' }}>{t('equip')}</button>}
              {isActive && <span style={{ display: 'block', marginTop: 8, color: '#4ad94a', fontSize: '0.85rem' }}>{t('equipped')}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

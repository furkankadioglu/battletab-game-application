import React, { useState, useEffect } from 'react';
import { t } from '../i18n/i18n.js';
import { getToken } from '../auth/authService.js';

export default function FriendsTab() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  const token = getToken();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { loadData(); }, []);

  function loadData() {
    fetch('/api/friends', { headers }).then(r => r.json()).then(setFriends).catch(() => {});
    fetch('/api/friends/requests', { headers }).then(r => r.json()).then(setRequests).catch(() => {});
  }

  async function sendRequest() {
    if (!code.trim()) return;
    const res = await fetch('/api/friends/request', { method: 'POST', headers, body: JSON.stringify({ playerCode: code.trim().toUpperCase() }) });
    const data = await res.json();
    setMsg(data.error || `Request sent to ${data.targetUsername}`);
    setCode('');
    loadData();
  }

  async function accept(fromUserId) {
    await fetch('/api/friends/accept', { method: 'POST', headers, body: JSON.stringify({ fromUserId }) });
    loadData();
  }

  async function reject(fromUserId) {
    await fetch('/api/friends/reject', { method: 'POST', headers, body: JSON.stringify({ fromUserId }) });
    loadData();
  }

  return (
    <div className="play-tab">
      <h2 className="play-section-title">{t('friends')}</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder={t('playerCode')}
          style={{ flex: 1, padding: '10px 12px', background: 'rgba(12,12,30,0.8)', border: '1px solid rgba(200,168,78,0.15)', borderRadius: 8, color: '#d0d0e0', fontFamily: 'Inter', outline: 'none' }} />
        <button onClick={sendRequest} className="play-button" style={{ padding: '10px 20px', fontSize: '0.85rem', maxWidth: 120 }}>{t('addFriend')}</button>
      </div>
      {msg && <p style={{ color: '#c8a84e', fontSize: '0.8rem', marginBottom: 12 }}>{msg}</p>}

      {requests.length > 0 && (
        <>
          <h3 style={{ color: '#c8a84e', fontSize: '0.9rem', marginBottom: 8 }}>{t('friendRequests')}</h3>
          {requests.map(r => (
            <div key={r.fromUserId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '8px 12px', background: 'rgba(10,10,25,0.5)', borderRadius: 8 }}>
              <span style={{ flex: 1, color: '#d0d0e0' }}>{r.fromUsername}</span>
              <button onClick={() => accept(r.fromUserId)} style={{ padding: '4px 12px', background: 'rgba(74,217,74,0.2)', border: '1px solid rgba(74,217,74,0.4)', borderRadius: 6, color: '#4ad94a', cursor: 'pointer' }}>{t('accept')}</button>
              <button onClick={() => reject(r.fromUserId)} style={{ padding: '4px 12px', background: 'rgba(217,74,74,0.2)', border: '1px solid rgba(217,74,74,0.4)', borderRadius: 6, color: '#d94a4a', cursor: 'pointer' }}>{t('reject')}</button>
            </div>
          ))}
        </>
      )}

      <h3 style={{ color: '#c8a84e', fontSize: '0.9rem', marginTop: 16, marginBottom: 8 }}>{t('friends')} ({friends.length})</h3>
      {friends.length === 0 && <p style={{ color: 'rgba(200,200,220,0.4)', fontSize: '0.85rem' }}>{t('noFriends')}</p>}
      {friends.map(f => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, padding: '8px 12px', background: 'rgba(10,10,25,0.3)', borderRadius: 8 }}>
          <span style={{ flex: 1, color: '#d0d0e0' }}>{f.username}</span>
          <span style={{ color: 'rgba(200,200,220,0.4)', fontSize: '0.75rem' }}>{f.playerCode}</span>
        </div>
      ))}
    </div>
  );
}

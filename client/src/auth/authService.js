/**
 * BattleTab v2 — Client Auth Service
 * API calls to /api/auth/* endpoints.
 */

const API_BASE = '/api/auth';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function register(username, email, password) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export function login(username, password) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function guestLogin() {
  return request('/guest', { method: 'POST' });
}

export function getProfile(token) {
  return request('/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function verifyEmail(email, code) {
  return request('/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function resendVerification(email) {
  return request('/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function forgotPassword(email) {
  return request('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(email, code, newPassword) {
  return request('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
}

// Token management
export function saveToken(token) {
  localStorage.setItem('battletab_token', token);
}

export function getToken() {
  return localStorage.getItem('battletab_token');
}

export function clearToken() {
  localStorage.removeItem('battletab_token');
}

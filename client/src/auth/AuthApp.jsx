/**
 * BattleTab v2 — Auth UI
 * Login, Register, Email Verification, Password Reset.
 */

import React, { useState } from 'react';
import * as authApi from './authService.js';
import './auth.css';

export default function AuthApp({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register | verify | forgot | reset
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const clearMessages = () => { setError(''); setSuccess(''); };

  async function handleLogin(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await authApi.login(username, password);
      authApi.saveToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    clearMessages();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.register(username, email, password);
      setSuccess('Registration successful! Check your email for verification code.');
      setMode('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await authApi.verifyEmail(email, code);
      authApi.saveToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    clearMessages();
    setLoading(true);
    try {
      const data = await authApi.guestLogin();
      authApi.saveToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess('Reset code sent to your email.');
      setMode('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await authApi.resetPassword(email, code, newPassword);
      setSuccess('Password reset! You can now login.');
      setMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-panel">
        <h1 className="auth-title">BattleTab</h1>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Username" value={username}
              onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button type="button" className="auth-btn-secondary" onClick={handleGuest} disabled={loading}>
              Play as Guest
            </button>
            <div className="auth-links">
              <span onClick={() => { clearMessages(); setMode('register'); }}>Create Account</span>
              <span onClick={() => { clearMessages(); setMode('forgot'); }}>Forgot Password?</span>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <input type="text" placeholder="Username (3-20 chars)" value={username}
              onChange={e => setUsername(e.target.value)} required />
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password (min 6 chars)" value={password}
              onChange={e => setPassword(e.target.value)} required />
            <input type="password" placeholder="Confirm Password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} required />
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
            <div className="auth-links">
              <span onClick={() => { clearMessages(); setMode('login'); }}>Back to Login</span>
            </div>
          </form>
        )}

        {mode === 'verify' && (
          <form onSubmit={handleVerify}>
            <p className="auth-hint">Enter the 6-digit code sent to your email</p>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <input type="text" placeholder="Verification Code" value={code}
              onChange={e => setCode(e.target.value)} maxLength={6} required />
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <div className="auth-links">
              <span onClick={() => { clearMessages(); setMode('login'); }}>Back to Login</span>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <div className="auth-links">
              <span onClick={() => { clearMessages(); setMode('login'); }}>Back to Login</span>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset}>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <input type="text" placeholder="Reset Code" value={code}
              onChange={e => setCode(e.target.value)} maxLength={6} required />
            <input type="password" placeholder="New Password (min 6 chars)" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} required />
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <div className="auth-links">
              <span onClick={() => { clearMessages(); setMode('login'); }}>Back to Login</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

# PHASE 2 — Auth System

## Tarih: 2026-04-06

## Server

### DB Migrations (server/db/)
- 001_create_users.sql: users + user_skins + user_active_skins + trigger
- 002_create_matches.sql: matches + match_players
- 003_create_daily_rewards.sql: user_daily_rewards
- 004_create_analytics.sql: analytics_snapshots + error_logs + server_uptime
- migrate.js: basit SQL runner

### AuthService (server/src/auth/AuthService.js)
- In-memory Maps: users, usernameIndex, emailIndex, playerCodeIndex, verificationCodes, resetCodes
- register: validation (3-20 username, email regex, 6+ password), bcrypt(10), playerCode, 500 diamonds
- login: case-insensitive username, bcrypt verify, emailVerified check
- guest: "Misafir_{random}", not persisted, 0 diamonds
- JWT: { userId, username, isGuest }, 7d expiry
- verifyEmail: 6-digit code, 10 min expiry
- forgotPassword / resetPassword: 6-digit code flow
- loadFromDB: startup ile PostgreSQL'den yukle
- _persistUser: DB varsa kaydet

### Auth Routes (server/src/routes/auth.js)
- POST register, login, guest, verify-email, resend-verification, forgot-password, reset-password
- GET profile (Bearer token)
- JWT middleware: authenticate function

## Client

### AuthApp.jsx (client/src/auth/AuthApp.jsx)
- 5 mode: login, register, verify, forgot, reset
- React state management, loading/error/success states
- Calls authService.js API wrapper

### auth.css (client/src/auth/auth.css)
- Dark luxury: rgba(8,8,20,0.92) panel, gold #c8a84e accents
- Glassmorphism: backdrop-blur(20px), border gold 15%
- Cinzel titles, Inter body, 48px buttons
- Mobile responsive: max-width 420px, mobile full-width

### BattleCanvas.js (client/src/auth/BattleCanvas.js)
- Canvas particles: gold dots on #06060e background
- requestAnimationFrame loop, resize handler

### authService.js (client/src/auth/authService.js)
- fetch wrapper for all /api/auth endpoints
- Token: localStorage battletab_token

## Tests
- 19 AuthService unit tests (register, login, guest, JWT, verify, reset)
- 62 total unit tests PASS
- 3 integration tests PASS
- smoke.sh 4/4 PASS

/**
 * BattleTab v2 — Auth Routes
 * POST /api/auth/register, login, guest, verify-email, resend-verification, forgot-password, reset-password
 * GET  /api/auth/profile (bearer)
 */

const { Router } = require('express');

function createAuthRoutes(authService) {
  const router = Router();

  // JWT middleware
  function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = authService.verifyToken(header.slice(7));
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  }

  router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const result = await authService.register(username, email, password);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    if (result.error) return res.status(401).json({ error: result.error });
    res.json(result);
  });

  router.post('/guest', (req, res) => {
    const result = authService.guest();
    res.json(result);
  });

  router.get('/profile', authenticate, (req, res) => {
    const result = authService.getProfile(req.user.userId);
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  });

  router.post('/verify-email', (req, res) => {
    const { email, code } = req.body;
    const result = authService.verifyEmail(email, code);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  router.post('/resend-verification', (req, res) => {
    const { email } = req.body;
    const result = authService.resendVerification(email);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: 'Verification code sent' });
  });

  router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    const result = authService.forgotPassword(email);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: 'Reset code sent' });
  });

  router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    const result = await authService.resetPassword(email, code, newPassword);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: 'Password reset successful' });
  });

  return { router, authenticate };
}

module.exports = { createAuthRoutes };

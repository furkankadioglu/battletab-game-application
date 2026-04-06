/**
 * BattleTab v2 — Authentication Service
 * Handles user registration, login, guest, JWT, email verification, password reset.
 * Graceful degradation: works in-memory when DB is unavailable.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { generateId, generatePlayerCode } = require('../utils/idGenerator');
const { gameConstants } = require('../../../shared');

const BCRYPT_ROUNDS = 10;
const VERIFICATION_CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

class AuthService {
  constructor() {
    // In-memory stores
    this.users = new Map();
    this.usernameIndex = new Map(); // lowercase username -> userId
    this.emailIndex = new Map();    // lowercase email -> userId
    this.playerCodeIndex = new Map();
    this.verificationCodes = new Map(); // email -> { code, expiresAt }
    this.resetCodes = new Map();        // email -> { code, expiresAt }
    this.dbPool = null;
  }

  setDbPool(pool) {
    this.dbPool = pool;
  }

  async loadFromDB() {
    if (!this.dbPool) return;
    try {
      const result = await this.dbPool.query('SELECT * FROM users');
      for (const row of result.rows) {
        const user = {
          id: row.id,
          username: row.username,
          email: row.email,
          passwordHash: row.password_hash,
          playerCode: row.player_code,
          emailVerified: row.email_verified,
          isGuest: row.is_guest,
          diamonds: row.diamonds,
          banned: row.banned,
          stats: row.stats,
          createdAt: row.created_at,
        };
        this.users.set(user.id, user);
        this.usernameIndex.set(user.username.toLowerCase(), user.id);
        if (user.email) this.emailIndex.set(user.email.toLowerCase(), user.id);
        if (user.playerCode) this.playerCodeIndex.set(user.playerCode, user.id);
      }
      console.log(`AuthService: loaded ${this.users.size} users from DB`);
    } catch (err) {
      console.warn('AuthService: failed to load from DB:', err.message);
    }
  }

  // ─── Registration ────────────────────────────────────────
  async register(username, email, password) {
    // Validation
    if (!username || username.length < 3 || username.length > 20) {
      return { error: 'Username must be 3-20 characters' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: 'Invalid email address' };
    }
    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters' };
    }

    // Duplicate checks
    if (this.usernameIndex.has(username.toLowerCase())) {
      return { error: 'Username already taken' };
    }
    if (this.emailIndex.has(email.toLowerCase())) {
      return { error: 'Email already registered' };
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const id = generateId('user_');
    const playerCode = this._uniquePlayerCode();

    const user = {
      id,
      username,
      email,
      passwordHash,
      playerCode,
      emailVerified: false,
      isGuest: false,
      diamonds: gameConstants.STARTING_DIAMONDS,
      banned: false,
      stats: {
        bot: { played: 0, won: 0, lost: 0 },
        normal: { played: 0, won: 0, lost: 0 },
        ranked: { played: 0, won: 0, lost: 0 },
      },
      createdAt: new Date(),
    };

    this.users.set(id, user);
    this.usernameIndex.set(username.toLowerCase(), id);
    this.emailIndex.set(email.toLowerCase(), id);
    this.playerCodeIndex.set(playerCode, id);

    // Persist to DB if available
    await this._persistUser(user);

    // Generate verification code
    const code = this._generateCode();
    this.verificationCodes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + VERIFICATION_CODE_EXPIRY,
    });

    return {
      user: this._sanitizeUser(user),
      verificationCode: code,
    };
  }

  // ─── Login ───────────────────────────────────────────────
  async login(username, password) {
    if (!username || !password) {
      return { error: 'Username and password required' };
    }

    const userId = this.usernameIndex.get(username.toLowerCase());
    if (!userId) return { error: 'Invalid credentials' };

    const user = this.users.get(userId);
    if (!user) return { error: 'Invalid credentials' };
    if (user.banned) return { error: 'Account banned' };

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return { error: 'Invalid credentials' };

    if (!user.emailVerified) {
      return { error: 'Email not verified' };
    }

    const token = this._generateToken(user);
    return { user: this._sanitizeUser(user), token };
  }

  // ─── Guest ───────────────────────────────────────────────
  guest() {
    const id = generateId('guest_');
    const username = `Misafir_${Math.random().toString(36).slice(2, 7)}`;

    const user = {
      id,
      username,
      email: null,
      passwordHash: null,
      playerCode: null,
      emailVerified: false,
      isGuest: true,
      diamonds: 0,
      banned: false,
      stats: {
        bot: { played: 0, won: 0, lost: 0 },
        normal: { played: 0, won: 0, lost: 0 },
        ranked: { played: 0, won: 0, lost: 0 },
      },
      createdAt: new Date(),
    };

    // Guest users are NOT persisted
    this.users.set(id, user);

    const token = this._generateToken(user);
    return { user: this._sanitizeUser(user), token };
  }

  // ─── Profile ─────────────────────────────────────────────
  getProfile(userId) {
    const user = this.users.get(userId);
    if (!user) return { error: 'User not found' };
    return { user: this._sanitizeUser(user) };
  }

  // ─── Email Verification ──────────────────────────────────
  verifyEmail(email, code) {
    if (!email || !code) return { error: 'Email and code required' };

    const entry = this.verificationCodes.get(email.toLowerCase());
    if (!entry) return { error: 'No verification pending' };
    if (Date.now() > entry.expiresAt) return { error: 'Code expired' };
    if (entry.code !== code) return { error: 'Invalid code' };

    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return { error: 'User not found' };

    const user = this.users.get(userId);
    user.emailVerified = true;
    this.verificationCodes.delete(email.toLowerCase());

    const token = this._generateToken(user);
    return { user: this._sanitizeUser(user), token };
  }

  resendVerification(email) {
    if (!email) return { error: 'Email required' };
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return { error: 'Email not found' };

    const code = this._generateCode();
    this.verificationCodes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + VERIFICATION_CODE_EXPIRY,
    });
    return { code };
  }

  // ─── Password Reset ──────────────────────────────────────
  forgotPassword(email) {
    if (!email) return { error: 'Email required' };
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return { error: 'Email not found' };

    const code = this._generateCode();
    this.resetCodes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + VERIFICATION_CODE_EXPIRY,
    });
    return { code };
  }

  async resetPassword(email, code, newPassword) {
    if (!email || !code || !newPassword) {
      return { error: 'Email, code, and new password required' };
    }
    if (newPassword.length < 6) return { error: 'Password must be at least 6 characters' };

    const entry = this.resetCodes.get(email.toLowerCase());
    if (!entry) return { error: 'No reset pending' };
    if (Date.now() > entry.expiresAt) return { error: 'Code expired' };
    if (entry.code !== code) return { error: 'Invalid code' };

    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return { error: 'User not found' };

    const user = this.users.get(userId);
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    this.resetCodes.delete(email.toLowerCase());

    return { success: true };
  }

  // ─── JWT ─────────────────────────────────────────────────
  _generateToken(user) {
    return jwt.sign(
      { userId: user.id, username: user.username, isGuest: user.isGuest },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET);
    } catch {
      return null;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────
  _generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  }

  _uniquePlayerCode() {
    let code;
    let attempts = 0;
    do {
      code = generatePlayerCode();
      attempts++;
    } while (this.playerCodeIndex.has(code) && attempts < 100);
    return code;
  }

  _sanitizeUser(user) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      playerCode: user.playerCode,
      emailVerified: user.emailVerified,
      isGuest: user.isGuest,
      diamonds: user.diamonds,
      stats: user.stats,
    };
  }

  async _persistUser(user) {
    if (!this.dbPool) return;
    try {
      await this.dbPool.query(
        `INSERT INTO users (id, username, email, password_hash, player_code, email_verified, is_guest, diamonds, stats)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.username, user.email, user.passwordHash, user.playerCode,
         user.emailVerified, user.isGuest, user.diamonds, JSON.stringify(user.stats)]
      );
    } catch (err) {
      console.warn('AuthService: failed to persist user:', err.message);
    }
  }
}

module.exports = AuthService;

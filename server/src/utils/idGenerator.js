/**
 * BattleTab v2 — ID Generator
 * Unique ID generation using nanoid.
 */

const { nanoid } = require('nanoid');

// Character set for player codes (no ambiguous chars: 0, O, I, 1, L)
const PLAYER_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a unique ID with optional prefix.
 * @param {string} [prefix] - e.g. 'army_', 'room_'
 * @param {number} [length=12] - ID length (excluding prefix)
 */
function generateId(prefix = '', length = 12) {
  return prefix + nanoid(length);
}

/**
 * Generate a 6-character player code.
 * Uses unambiguous charset for readability.
 */
function generatePlayerCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += PLAYER_CODE_CHARS[Math.floor(Math.random() * PLAYER_CODE_CHARS.length)];
  }
  return code;
}

module.exports = { generateId, generatePlayerCode };

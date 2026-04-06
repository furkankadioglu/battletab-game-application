/**
 * BattleTab v2 — ID Generator Unit Tests
 */

const { generateId, generatePlayerCode } = require('../../../server/src/utils/idGenerator');

describe('idGenerator', () => {
  test('generates unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });

  test('respects prefix', () => {
    const id = generateId('army_');
    expect(id.startsWith('army_')).toBe(true);
    expect(id.length).toBe(5 + 12); // 'army_' (5) + 12 chars
  });

  test('respects custom length', () => {
    const id = generateId('', 8);
    expect(id.length).toBe(8);
  });

  test('empty prefix works', () => {
    const id = generateId();
    expect(id.length).toBe(12);
  });
});

describe('generatePlayerCode', () => {
  test('generates 6-character codes', () => {
    const code = generatePlayerCode();
    expect(code.length).toBe(6);
  });

  test('uses only valid characters', () => {
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 100; i++) {
      const code = generatePlayerCode();
      for (const char of code) {
        expect(validChars).toContain(char);
      }
    }
  });

  test('generates unique codes (1000 samples)', () => {
    const codes = new Set();
    for (let i = 0; i < 1000; i++) {
      codes.add(generatePlayerCode());
    }
    // With 30^6 = 729M possibilities, 1000 should all be unique
    expect(codes.size).toBe(1000);
  });

  test('does not contain ambiguous characters (0, O, I, 1)', () => {
    const ambiguous = '0OI1';
    for (let i = 0; i < 100; i++) {
      const code = generatePlayerCode();
      for (const char of ambiguous) {
        expect(code).not.toContain(char);
      }
    }
  });
});

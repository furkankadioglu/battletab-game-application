/**
 * BattleTab v2 — Config Unit Tests
 */

const config = require('../../../server/src/config');

describe('Server Config', () => {
  test('has default PORT', () => {
    expect(config.PORT).toBe(3000);
  });

  test('has NODE_ENV', () => {
    expect(['development', 'test', 'production']).toContain(config.NODE_ENV);
  });

  test('has JWT settings', () => {
    expect(config.JWT_SECRET).toBeDefined();
    expect(config.JWT_SECRET.length).toBeGreaterThan(0);
    expect(config.JWT_EXPIRES_IN).toBe('7d');
  });

  test('has CORS_ORIGIN', () => {
    expect(config.CORS_ORIGIN).toBeDefined();
  });

  test('isProd() is false when not production', () => {
    if (config.NODE_ENV !== 'production') {
      expect(config.isProd()).toBe(false);
    }
  });

  test('isProd() returns false in test env', () => {
    expect(config.isProd()).toBe(false);
  });

  test('has DATABASE_URL', () => {
    expect(config.DATABASE_URL).toContain('postgresql');
  });

  test('has REDIS_URL', () => {
    expect(config.REDIS_URL).toContain('redis');
  });
});

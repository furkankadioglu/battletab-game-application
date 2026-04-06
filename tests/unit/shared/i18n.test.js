/**
 * BattleTab v2 — i18n & Maps Config Unit Tests
 * Tests translation keys and map config validity.
 * Note: Client uses ESM, so we read files as text and parse exports.
 */

const fs = require('fs');
const path = require('path');

function parseI18nFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Extract key-value pairs from "key: 'value'" or 'key: "value"' patterns
  const pairs = {};
  const regex = /^\s*(\w+):\s*['"`](.+?)['"`],?\s*$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    pairs[match[1]] = match[2];
  }
  return pairs;
}

const enPath = path.join(__dirname, '../../../client/src/i18n/en.js');
const trPath = path.join(__dirname, '../../../client/src/i18n/tr.js');
const en = parseI18nFile(enPath);
const tr = parseI18nFile(trPath);

describe('i18n translations', () => {
  test('English has 100+ keys', () => {
    expect(Object.keys(en).length).toBeGreaterThanOrEqual(100);
  });

  test('Turkish has same key count as English', () => {
    expect(Object.keys(tr).length).toBe(Object.keys(en).length);
  });

  test('Turkish has all English keys', () => {
    const missing = Object.keys(en).filter(k => !tr[k]);
    expect(missing).toEqual([]);
  });

  test('no empty values in English', () => {
    for (const [key, val] of Object.entries(en)) {
      expect(val.length).toBeGreaterThan(0);
    }
  });

  test('template variables are consistent', () => {
    const templateRegex = /\{\{(\w+)\}\}/g;
    for (const key of Object.keys(en)) {
      if (!tr[key]) continue;
      const enVars = [...(en[key].matchAll(templateRegex))].map(m => m[1]).sort();
      const trVars = [...(tr[key].matchAll(templateRegex))].map(m => m[1]).sort();
      expect(trVars).toEqual(enVars);
    }
  });

  test('critical keys exist in both', () => {
    const keys = ['login', 'register', 'play', 'store', 'friends', 'profile',
      'ranked', 'settings', 'victory', 'defeat', 'missile', 'nuclear', 'freeze'];
    for (const key of keys) {
      expect(en[key]).toBeDefined();
      expect(tr[key]).toBeDefined();
    }
  });
});

describe('maps config', () => {
  const mapsContent = fs.readFileSync(
    path.join(__dirname, '../../../client/src/config/maps.js'), 'utf8'
  );

  test('has 3 maps defined', () => {
    expect(mapsContent).toContain("id: 'turkey'");
    expect(mapsContent).toContain("id: 'poland'");
    expect(mapsContent).toContain("id: 'china'");
  });

  test('Turkey has 91 regions', () => {
    expect(mapsContent).toContain('regions: 91');
  });

  test('Poland has 73 regions', () => {
    expect(mapsContent).toContain('regions: 73');
  });

  test('China has 34 regions', () => {
    expect(mapsContent).toContain('regions: 34');
  });

  test('all maps have required fields', () => {
    for (const field of ['id', 'name', 'regions', 'minPlayers', 'maxPlayers', 'geoJsonFile', 'dimensions']) {
      expect(mapsContent).toContain(field);
    }
  });
});

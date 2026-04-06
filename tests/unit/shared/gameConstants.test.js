/**
 * BattleTab v2 — Shared Module Unit Tests
 * Validates all shared constants, event types, region types, and version.
 */

const { gameConstants, eventTypes, regionTypes, version } = require('../../../shared');

describe('gameConstants', () => {
  test('tick rate is valid', () => {
    expect(gameConstants.TICK_RATE).toBe(10);
    expect(gameConstants.TICK_DURATION).toBe(100);
  });

  test('map dimensions are positive', () => {
    expect(gameConstants.MAP_WIDTH).toBeGreaterThan(0);
    expect(gameConstants.MAP_HEIGHT).toBeGreaterThan(0);
  });

  test('production rates are defined and non-negative', () => {
    expect(gameConstants.BASE_PRODUCTION_RATE).toBe(1.0);
    expect(gameConstants.TOWER_PRODUCTION_RATE).toBe(1.5);
    expect(gameConstants.MOUNTAIN_PRODUCTION_RATE).toBe(0.5);
    expect(gameConstants.SNOW_PRODUCTION_RATE).toBe(0.8);
    expect(gameConstants.SPEED_PRODUCTION_RATE).toBe(0.8);
    expect(gameConstants.ROCKY_PRODUCTION_RATE).toBe(0);
    expect(gameConstants.SPAWN_PRODUCTION_RATE).toBe(1.0);
    expect(gameConstants.NEUTRAL_PRODUCTION_RATE).toBe(0.05);
  });

  test('army constants are valid', () => {
    expect(gameConstants.ARMY_SPEED).toBe(25);
    expect(gameConstants.SOLDIER_SPLIT_RATIO).toBe(0.5);
    expect(gameConstants.ARMY_COLLISION_RADIUS).toBe(20);
    expect(gameConstants.ARMY_ATTRITION_RATE).toBe(1);
    expect(gameConstants.ARMY_STUCK_TIMEOUT).toBe(45000);
  });

  test('speed multipliers are valid', () => {
    expect(gameConstants.SNOW_SPEED_MULTIPLIER).toBe(0.28);
    expect(gameConstants.SPEED_REGION_MULTIPLIER).toBe(1.5);
    expect(gameConstants.NORMAL_SPEED_MULTIPLIER).toBe(1.0);
  });

  test('HP constants are valid', () => {
    expect(gameConstants.MAX_REGION_HP).toBe(300);
    expect(gameConstants.SPAWN_HP).toBe(40);
    expect(gameConstants.MIN_NEUTRAL_HP).toBe(3);
    expect(gameConstants.MAX_NEUTRAL_HP).toBe(30);
  });

  test('siege constants are valid', () => {
    expect(gameConstants.SIEGE_DAMAGE_PERCENT).toBe(0.10);
    expect(gameConstants.SIEGE_DEFENSE_BONUS).toBe(1.20);
    expect(gameConstants.SIEGE_MAX_ARMIES_PER_REGION).toBe(3);
  });

  test('visibility and range are defined', () => {
    expect(gameConstants.FOG_DEPTH).toBe(2);
    expect(gameConstants.ATTACK_RANGE).toBe(1);
  });

  test('ability cooldowns are positive numbers', () => {
    expect(gameConstants.MISSILE_COOLDOWN).toBeGreaterThan(0);
    expect(gameConstants.NUCLEAR_COOLDOWN).toBeGreaterThan(0);
    expect(gameConstants.BARRACKS_COOLDOWN).toBeGreaterThan(0);
    expect(gameConstants.SPEED_BOOST_COOLDOWN).toBeGreaterThan(0);
    expect(gameConstants.FREEZE_COOLDOWN).toBeGreaterThan(0);
  });

  test('ability effects are valid', () => {
    expect(gameConstants.MISSILE_DAMAGE_RATIO).toBe(0.5);
    expect(gameConstants.SPEED_BOOST_MULTIPLIER).toBe(1.25);
    expect(gameConstants.SPEED_BOOST_DURATION).toBe(10000);
    expect(gameConstants.FREEZE_ARMY_DURATION).toBe(1500);
  });

  test('game phases are defined', () => {
    expect(gameConstants.COUNTDOWN_SECONDS).toBe(3);
    expect(gameConstants.SPAWN_SELECTION_SECONDS).toBe(15);
    expect(gameConstants.PREVIEW_MS).toBe(3200);
  });

  test('building costs has all 7 building types', () => {
    const types = Object.keys(gameConstants.BUILDING_COSTS);
    expect(types).toHaveLength(7);
    expect(types).toContain('city_center');
    expect(types).toContain('barracks');
    expect(types).toContain('wall');
    expect(types).toContain('iron_dome');
    expect(types).toContain('stealth_tower');
    expect(types).toContain('drone_facility');
    expect(types).toContain('missile_base');

    // Each building has iron, crystal, uranium
    for (const type of types) {
      const cost = gameConstants.BUILDING_COSTS[type];
      expect(cost).toHaveProperty('iron');
      expect(cost).toHaveProperty('crystal');
      expect(cost).toHaveProperty('uranium');
      expect(cost.iron).toBeGreaterThanOrEqual(0);
      expect(cost.crystal).toBeGreaterThanOrEqual(0);
      expect(cost.uranium).toBeGreaterThanOrEqual(0);
    }
  });

  test('player colors has 16 entries', () => {
    expect(gameConstants.PLAYER_COLORS).toHaveLength(16);
    gameConstants.PLAYER_COLORS.forEach(color => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  test('diamond economy values are valid', () => {
    expect(gameConstants.DIAMOND_REWARD_BOT_WIN).toBe(1);
    expect(gameConstants.DIAMOND_REWARD_NORMAL_WIN).toBe(2);
    expect(gameConstants.DIAMOND_REWARD_RANKED_WIN).toBe(5);
    expect(gameConstants.DIAMOND_REWARD_LEAGUE_PROMOTION).toBe(100);
    expect(gameConstants.RANKED_ENTRY_FEE).toBe(1);
    expect(gameConstants.STARTING_DIAMONDS).toBe(500);
  });

  test('ELO and league system is valid', () => {
    expect(gameConstants.ELO_K_FACTOR).toBe(32);
    expect(gameConstants.ELO_STARTING_RATING).toBe(1000);
    expect(gameConstants.LEAGUES).toHaveLength(5);
    expect(gameConstants.LEAGUES[0].name).toBe('Bronze');
    expect(gameConstants.LEAGUES[4].name).toBe('Master');
  });

  test('network constants are valid', () => {
    expect(gameConstants.MAX_EVENTS_PER_SECOND).toBe(5);
    expect(gameConstants.PING_INTERVAL).toBeGreaterThan(0);
    expect(gameConstants.RECONNECT_ATTEMPTS).toBeGreaterThan(0);
    expect(gameConstants.MAX_PAYLOAD).toBe(100 * 1024);
    expect(gameConstants.PLAYER_DATA_TICK_INTERVAL).toBe(5);
  });

  test('mountain defense bonus is array of 3', () => {
    expect(gameConstants.MOUNTAIN_DEFENSE_BONUS).toEqual([10, 25, 50]);
  });

  test('gate constants are defined', () => {
    expect(gameConstants.GATE_TELEPORT_THRESHOLD).toBe(15);
    expect(gameConstants.GATE_COLORS).toHaveLength(3);
  });
});

describe('eventTypes', () => {
  test('has no empty string values', () => {
    const values = Object.values(eventTypes);
    values.forEach(v => {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    });
  });

  test('has all critical client→server events', () => {
    expect(eventTypes.JOIN_LOBBY).toBeDefined();
    expect(eventTypes.SEND_SOLDIERS).toBeDefined();
    expect(eventTypes.USE_MISSILE).toBeDefined();
    expect(eventTypes.USE_FREEZE).toBeDefined();
    expect(eventTypes.SELECT_SPAWN).toBeDefined();
    expect(eventTypes.BUILD_BUILDING).toBeDefined();
  });

  test('has all critical server→client events', () => {
    expect(eventTypes.GAME_START).toBeDefined();
    expect(eventTypes.STATE_UPDATE).toBeDefined();
    expect(eventTypes.ARMY_CREATED).toBeDefined();
    expect(eventTypes.REGION_CAPTURED).toBeDefined();
    expect(eventTypes.GAME_OVER).toBeDefined();
    expect(eventTypes.PLAYER_ELIMINATED).toBeDefined();
    expect(eventTypes.DIAMOND_REWARD).toBeDefined();
    expect(eventTypes.RANKING_UPDATE).toBeDefined();
  });

  test('has no duplicate values', () => {
    const values = Object.values(eventTypes);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('regionTypes', () => {
  test('has exactly 7 types', () => {
    expect(Object.keys(regionTypes)).toHaveLength(7);
  });

  test('has all required types', () => {
    expect(regionTypes.NORMAL).toBe('NORMAL');
    expect(regionTypes.TOWER).toBe('TOWER');
    expect(regionTypes.SPAWN).toBe('SPAWN');
    expect(regionTypes.MOUNTAIN).toBe('MOUNTAIN');
    expect(regionTypes.SNOW).toBe('SNOW');
    expect(regionTypes.ROCKY).toBe('ROCKY');
    expect(regionTypes.SPEED).toBe('SPEED');
  });
});

describe('version', () => {
  test('has valid version format', () => {
    expect(version.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('codename is BattleTab', () => {
    expect(version.codename).toBe('BattleTab');
  });
});

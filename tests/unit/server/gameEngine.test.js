/**
 * BattleTab v2 — Core Game Engine Unit Tests
 * Tests entities, systems, game state, and game loop.
 */

const Region = require('../../../server/src/game/entities/Region');
const Player = require('../../../server/src/game/entities/Player');
const Army = require('../../../server/src/game/entities/Army');
const GameState = require('../../../server/src/game/GameState');
const ProductionSystem = require('../../../server/src/game/ProductionSystem');
const MovementSystem = require('../../../server/src/game/MovementSystem');
const CollisionSystem = require('../../../server/src/game/CollisionSystem');
const ConquestSystem = require('../../../server/src/game/ConquestSystem');
const SiegeSystem = require('../../../server/src/game/SiegeSystem');
const VisibilitySystem = require('../../../server/src/game/VisibilitySystem');
const { checkWinCondition } = require('../../../server/src/game/WinCondition');

// Helper: create a basic game state with 2 players and a few regions
function createTestState() {
  const gs = new GameState();

  const p1 = new Player({ id: 'p1', username: 'Player1', color: '#E94560' });
  const p2 = new Player({ id: 'p2', username: 'Player2', color: '#06D6A0' });
  gs.addPlayer(p1);
  gs.addPlayer(p2);

  const r1 = new Region({ id: 'r1', type: 'NORMAL', hp: 40, center: { x: 100, y: 100 }, neighbors: ['r2', 'r3'] });
  r1.ownerId = 'p1';
  const r2 = new Region({ id: 'r2', type: 'NORMAL', hp: 20, center: { x: 200, y: 100 }, neighbors: ['r1', 'r3'] });
  // r2 is neutral
  const r3 = new Region({ id: 'r3', type: 'NORMAL', hp: 30, center: { x: 300, y: 100 }, neighbors: ['r1', 'r2'] });
  r3.ownerId = 'p2';

  gs.addRegion(r1);
  gs.addRegion(r2);
  gs.addRegion(r3);

  return gs;
}

// ─── Entities ──────────────────────────────────────────────
describe('Region', () => {
  test('production rate by type', () => {
    expect(new Region({ type: 'NORMAL' }).getProductionRate()).toBe(0.05); // neutral
    const r = new Region({ type: 'TOWER' });
    r.ownerId = 'p1';
    expect(r.getProductionRate()).toBe(1.5);
  });

  test('speed multiplier by type', () => {
    expect(new Region({ type: 'SNOW' }).getSpeedMultiplier()).toBe(0.28);
    expect(new Region({ type: 'SPEED' }).getSpeedMultiplier()).toBe(1.5);
    expect(new Region({ type: 'NORMAL' }).getSpeedMultiplier()).toBe(1.0);
  });

  test('serialize and serializeDelta', () => {
    const r = new Region({ id: 'r1', type: 'NORMAL', hp: 50, center: { x: 10, y: 20 } });
    const full = r.serialize();
    expect(full.id).toBe('r1');
    expect(full.hp).toBe(50);
    expect(full.center).toEqual({ x: 10, y: 20 });

    const delta = r.serializeDelta();
    expect(delta.id).toBe('r1');
    expect(delta.hp).toBe(50);
  });

  test('dirty tracking', () => {
    const r = new Region({ id: 'r1', type: 'NORMAL', hp: 50 });
    r.markClean();
    expect(r.isDirty()).toBe(false);
    r.hp = 51;
    expect(r.isDirty()).toBe(true);
    r.markClean();
    expect(r.isDirty()).toBe(false);
  });

  test('nuclearized region has 0 production', () => {
    const r = new Region({ type: 'TOWER' });
    r.ownerId = 'p1';
    r.isNuclearized = true;
    expect(r.getProductionRate()).toBe(0);
  });
});

describe('Player', () => {
  test('serialize for self includes charges', () => {
    const p = new Player({ id: 'p1', username: 'Test', color: '#fff' });
    p.charges.missile = 2;
    const selfData = p.serialize(true);
    expect(selfData.charges.missile).toBe(2);
    const enemyData = p.serialize(false);
    expect(enemyData.charges).toBeUndefined();
  });
});

describe('Army', () => {
  test('waypoint management', () => {
    const a = new Army({
      id: 'a1', ownerId: 'p1', count: 20,
      sourceRegionId: 'r1', targetRegionId: 'r2',
      position: { x: 0, y: 0 },
      waypoints: [{ x: 50, y: 0 }, { x: 100, y: 0 }],
    });
    expect(a.getMoveTarget()).toEqual({ x: 50, y: 0 });
    a.advanceWaypoint();
    expect(a.getMoveTarget()).toEqual({ x: 100, y: 0 });
    a.advanceWaypoint();
    expect(a.getMoveTarget()).toBeNull();
  });

  test('serialize', () => {
    const a = new Army({ id: 'a1', ownerId: 'p1', count: 20, position: { x: 10, y: 20 } });
    const data = a.serialize();
    expect(data.id).toBe('a1');
    expect(data.count).toBe(20);
  });
});

// ─── GameState ─────────────────────────────────────────────
describe('GameState', () => {
  test('CRUD operations', () => {
    const gs = createTestState();
    expect(gs.getAllPlayers()).toHaveLength(2);
    expect(gs.getAllRegions()).toHaveLength(3);
    expect(gs.getPlayerRegions('p1')).toHaveLength(1);
    expect(gs.getPlayerRegionCount('p2')).toBe(1);
  });

  test('neighbor check', () => {
    const gs = createTestState();
    expect(gs.isNeighbor('r1', 'r2')).toBe(true);
    expect(gs.isNeighbor('r1', 'r3')).toBe(true);
  });

  test('army management', () => {
    const gs = createTestState();
    const a = new Army({ id: 'a1', ownerId: 'p1', count: 20, position: { x: 0, y: 0 }, waypoints: [] });
    gs.addArmy(a);
    expect(gs.getAllArmies()).toHaveLength(1);
    gs.removeArmy('a1');
    expect(gs.getAllArmies()).toHaveLength(0);
  });

  test('dirty regions tracking', () => {
    const gs = createTestState();
    // Mark all clean
    for (const r of gs.regions.values()) r.markClean();
    expect(gs.getDirtyRegions()).toHaveLength(0);
    // Modify one
    gs.getRegion('r1').hp += 5;
    const dirty = gs.getDirtyRegions();
    expect(dirty.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Production System ─────────────────────────────────────
describe('ProductionSystem', () => {
  test('produces soldiers over time', () => {
    const gs = createTestState();
    const r1 = gs.getRegion('r1');
    const startHp = r1.hp;

    // Simulate 10 ticks (1 second)
    for (let i = 0; i < 10; i++) {
      ProductionSystem.processTick(gs, 0.1);
    }

    expect(r1.hp).toBeGreaterThan(startHp);
  });

  test('nuclearized region does not produce', () => {
    const gs = createTestState();
    const r1 = gs.getRegion('r1');
    r1.isNuclearized = true;
    const startHp = r1.hp;

    for (let i = 0; i < 10; i++) {
      ProductionSystem.processTick(gs, 0.1);
    }

    expect(r1.hp).toBe(startHp);
  });

  test('neutral region produces slowly', () => {
    const gs = createTestState();
    const r2 = gs.getRegion('r2'); // neutral
    const startHp = r2.hp;

    // 200 ticks = 20 seconds → should produce 1 soldier (0.05/sec)
    for (let i = 0; i < 200; i++) {
      ProductionSystem.processTick(gs, 0.1);
    }

    expect(r2.hp).toBeGreaterThan(startHp);
  });
});

// ─── Collision System ──────────────────────────────────────
describe('CollisionSystem', () => {
  test('larger army wins collision', () => {
    const gs = createTestState();
    const a1 = new Army({ id: 'a1', ownerId: 'p1', count: 30, position: { x: 150, y: 100 }, waypoints: [{ x: 200, y: 100 }] });
    const a2 = new Army({ id: 'a2', ownerId: 'p2', count: 20, position: { x: 155, y: 100 }, waypoints: [{ x: 100, y: 100 }] });
    gs.addArmy(a1);
    gs.addArmy(a2);

    const destroyed = CollisionSystem.processTick(gs);
    expect(destroyed.has('a2')).toBe(true);
    expect(gs.getArmy('a1').count).toBe(10);
  });

  test('no collision when too far apart', () => {
    const gs = createTestState();
    const a1 = new Army({ id: 'a1', ownerId: 'p1', count: 30, position: { x: 0, y: 0 }, waypoints: [] });
    const a2 = new Army({ id: 'a2', ownerId: 'p2', count: 20, position: { x: 100, y: 100 }, waypoints: [] });
    gs.addArmy(a1);
    gs.addArmy(a2);

    const destroyed = CollisionSystem.processTick(gs);
    expect(destroyed.size).toBe(0);
  });

  test('equal armies both destroyed', () => {
    const gs = createTestState();
    const a1 = new Army({ id: 'a1', ownerId: 'p1', count: 20, position: { x: 150, y: 100 }, waypoints: [] });
    const a2 = new Army({ id: 'a2', ownerId: 'p2', count: 20, position: { x: 155, y: 100 }, waypoints: [] });
    gs.addArmy(a1);
    gs.addArmy(a2);

    const destroyed = CollisionSystem.processTick(gs);
    expect(destroyed.size).toBe(2);
  });
});

// ─── Conquest System ───────────────────────────────────────
describe('ConquestSystem', () => {
  test('capture neutral region', () => {
    const gs = createTestState();
    const r2 = gs.getRegion('r2'); // neutral, center at (200, 100)
    const a = new Army({ id: 'a1', ownerId: 'p1', count: 15, sourceRegionId: 'r1', targetRegionId: 'r2', position: { x: 200, y: 100 }, waypoints: [] });
    // army at target center with no waypoints left
    gs.addArmy(a);

    const events = ConquestSystem.processTick(gs);
    expect(r2.ownerId).toBe('p1');
    expect(events.some(e => e.type === 'region_captured')).toBe(true);
  });

  test('reinforce friendly region', () => {
    const gs = createTestState();
    const r1 = gs.getRegion('r1'); // owned by p1, hp=40
    const a = new Army({ id: 'a1', ownerId: 'p1', count: 10, sourceRegionId: 'r1', targetRegionId: 'r1', position: { x: 100, y: 100 }, waypoints: [] });
    gs.addArmy(a);

    ConquestSystem.processTick(gs);
    expect(r1.hp).toBe(50); // 40 + 10
  });
});

// ─── Siege System ──────────────────────────────────────────
describe('SiegeSystem', () => {
  test('siege damages defender over time', () => {
    const gs = createTestState();
    const r3 = gs.getRegion('r3'); // owned by p2, hp=30
    r3.siegeForces = { p1: 20 };
    r3.siegeEntryPoints = { p1: { x: 250, y: 100 } };

    const startHp = r3.hp;
    SiegeSystem.processTick(gs, 1.0); // 1 second

    expect(r3.hp).toBeLessThan(startHp);
  });

  test('defender falls → attacker captures', () => {
    const gs = createTestState();
    const r3 = gs.getRegion('r3');
    r3.hp = 1; // Almost dead
    r3.siegeForces = { p1: 50 };
    r3.siegeEntryPoints = { p1: { x: 250, y: 100 } };

    const events = SiegeSystem.processTick(gs, 1.0);
    expect(r3.ownerId).toBe('p1');
    expect(events.some(e => e.type === 'region_captured')).toBe(true);
  });
});

// ─── Visibility System ─────────────────────────────────────
describe('VisibilitySystem', () => {
  test('owned region and neighbors visible (depth 2)', () => {
    const gs = createTestState();
    const visible = VisibilitySystem.calculateVisibility(gs, 'p1');
    expect(visible.has('r1')).toBe(true); // owned
    expect(visible.has('r2')).toBe(true); // neighbor (depth 1)
    expect(visible.has('r3')).toBe(true); // neighbor (depth 1)
  });

  test('canAttack checks range', () => {
    const gs = createTestState();
    expect(VisibilitySystem.canAttack(gs, 'r1', 'r2', 'p1')).toBe(true);
    expect(VisibilitySystem.canAttack(gs, 'r1', 'r3', 'p1')).toBe(true);
  });
});

// ─── Win Condition ─────────────────────────────────────────
describe('WinCondition', () => {
  test('player with 0 regions is eliminated', () => {
    const gs = createTestState();
    gs.getRegion('r3').ownerId = 'p1'; // p2 loses all regions

    const events = checkWinCondition(gs);
    expect(gs.getPlayer('p2').isEliminated).toBe(true);
    expect(events.some(e => e.type === 'player_eliminated')).toBe(true);
  });

  test('last player standing triggers game_over', () => {
    const gs = createTestState();
    gs.getRegion('r3').ownerId = 'p1'; // p2 loses all
    gs.getPlayer('p2').isEliminated = true;
    gs.getPlayer('p2').regionCount = 0;

    const events = checkWinCondition(gs);
    expect(events.some(e => e.type === 'game_over')).toBe(true);
    expect(gs.phase).toBe('finished');
  });
});

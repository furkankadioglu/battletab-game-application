/**
 * BattleTab v2 — Game Loop
 * Tick-based game loop at 10 tps (100ms per tick).
 * System order: Production → Movement → Collision → Conquest → Siege → Gates → WinCondition
 */

const { gameConstants } = require('../../../shared');
const ProductionSystem = require('./ProductionSystem');
const MovementSystem = require('./MovementSystem');
const CollisionSystem = require('./CollisionSystem');
const ConquestSystem = require('./ConquestSystem');
const SiegeSystem = require('./SiegeSystem');
const GateSystem = require('./GateSystem');
const { checkWinCondition } = require('./WinCondition');

class GameLoop {
  constructor(gameState, onTick) {
    this.gameState = gameState;
    this.onTick = onTick; // callback(events) called each tick
    this.interval = null;
    this.lastTickTime = 0;
    this.running = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTickTime = Date.now();
    this.gameState.startTime = Date.now();

    this.interval = setInterval(() => {
      try {
        this.tick();
      } catch (err) {
        console.error('GameLoop tick error:', err);
      }
    }, gameConstants.TICK_DURATION);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  tick() {
    if (!this.running || this.gameState.phase !== 'playing') return;

    const now = Date.now();
    const deltaSec = Math.min((now - this.lastTickTime) / 1000, 0.2); // Cap at 200ms
    this.lastTickTime = now;
    this.gameState.tick++;

    const allEvents = [];

    // 1. Production
    ProductionSystem.processTick(this.gameState, deltaSec);

    // 2. Movement
    MovementSystem.processTick(this.gameState, deltaSec);

    // 3. Collision
    const destroyed = CollisionSystem.processTick(this.gameState);
    if (destroyed.size > 0) {
      for (const id of destroyed) {
        allEvents.push({ type: 'army_destroyed', armyId: id, destroyedBy: 'collision' });
      }
    }

    // 4. Conquest
    const conquestEvents = ConquestSystem.processTick(this.gameState);
    allEvents.push(...conquestEvents);

    // 5. Siege
    const siegeEvents = SiegeSystem.processTick(this.gameState, deltaSec);
    allEvents.push(...siegeEvents);

    // 6. Gates
    const gateEvents = GateSystem.processTick(this.gameState);
    allEvents.push(...gateEvents);

    // 7. Win condition
    const winEvents = checkWinCondition(this.gameState);
    allEvents.push(...winEvents);

    // Check if game is over
    if (this.gameState.phase === 'finished') {
      this.stop();
    }

    // Callback with events
    if (this.onTick) {
      this.onTick(allEvents);
    }
  }
}

module.exports = GameLoop;

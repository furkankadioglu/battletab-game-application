/**
 * BattleTab v2 — Gate System
 * Portal pairs for army teleportation + gate creation for map generation.
 *
 * Gate object: { id, pairId, pairGroupId, regionId, color, colorHex, position }
 */

const { generateId } = require('../utils/idGenerator');
const { gameConstants } = require('../../../shared');

const GATE_COLORS = [
  { name: 'purple', hex: 0xBB44FF },
  { name: 'cyan',   hex: 0x00DDDD },
  { name: 'pink',   hex: 0xFF44AA },
];

// Per-army cooldown tracker: armyId → timestamp
const armyCooldowns = new Map();

// ─── Gate Creation (used by MapGenerator) ─────────────────

function bfsHopDistance(fromId, toId, neighborMap) {
  if (fromId === toId) return 0;
  const visited = new Set([fromId]);
  const queue = [{ id: fromId, depth: 0 }];
  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    const neighbors = neighborMap.get(id) || [];
    for (const nId of neighbors) {
      if (nId === toId) return depth + 1;
      if (!visited.has(nId)) {
        visited.add(nId);
        queue.push({ id: nId, depth: depth + 1 });
      }
    }
  }
  return Infinity;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Create gate pairs for a map.
 * @param {Array} regions - Region objects
 * @param {number[]} spawnIndices
 * @param {number[]} towerIndices
 * @returns {Array} gate objects
 */
function createGates(regions, spawnIndices, towerIndices) {
  const regionCount = regions.length;
  if (regionCount < 6) return [];

  // Determine pair count based on region count
  const rand = Math.random();
  let pairCount;
  if (regionCount < 15) {
    pairCount = rand < 0.4 ? 0 : 1;
  } else if (regionCount < 40) {
    pairCount = rand < 0.2 ? 0 : rand < 0.7 ? 1 : 2;
  } else {
    pairCount = rand < 0.1 ? 0 : rand < 0.5 ? 1 : 2;
  }
  if (pairCount === 0) return [];

  const spawnSet = new Set(spawnIndices);
  const towerSet = new Set(towerIndices);
  const eligible = [];
  for (let i = 0; i < regionCount; i++) {
    if (!spawnSet.has(i) && !towerSet.has(i)) eligible.push(i);
  }
  if (eligible.length < pairCount * 2) return [];

  // Build neighbor map by region ID
  const neighborMap = new Map();
  for (const region of regions) {
    neighborMap.set(region.id, region.neighbors || []);
  }

  const gates = [];
  const usedIndices = new Set();

  for (let p = 0; p < pairCount; p++) {
    const color = GATE_COLORS[p % GATE_COLORS.length];
    const pairGroupId = generateId('gatepair_');
    let gateA = null, gateB = null;

    for (let attempt = 0; attempt < gameConstants.GATE_MIN_HOP_DISTANCE || 3; attempt++) {
      const available = shuffle(eligible.filter(idx => !usedIndices.has(idx)));
      if (available.length < 2) break;

      const candidateA = available[0];
      const validB = [];
      for (let i = 1; i < available.length; i++) {
        const idx = available[i];
        const eucDist = distance(regions[candidateA].center, regions[idx].center);
        if (eucDist < (gameConstants.GATE_MIN_PIXEL_DISTANCE || 200)) continue;
        const hops = bfsHopDistance(regions[candidateA].id, regions[idx].id, neighborMap);
        if (hops >= (gameConstants.GATE_MIN_HOP_DISTANCE || 4)) {
          validB.push(idx);
        }
      }

      if (validB.length > 0) {
        gateA = candidateA;
        gateB = validB[Math.floor(Math.random() * validB.length)];
        break;
      }
    }

    if (gateA === null || gateB === null) continue;

    usedIndices.add(gateA);
    usedIndices.add(gateB);

    const idA = generateId('gate_');
    const idB = generateId('gate_');

    gates.push({
      id: idA, pairId: idB, pairGroupId,
      regionId: regions[gateA].id,
      color: color.name, colorHex: color.hex,
      position: { ...regions[gateA].center },
    });
    gates.push({
      id: idB, pairId: idA, pairGroupId,
      regionId: regions[gateB].id,
      color: color.name, colorHex: color.hex,
      position: { ...regions[gateB].center },
    });
  }

  return gates;
}

// ─── Gate Tick (Teleportation each game tick) ─────────────

function processTick(gameState) {
  const gates = gameState.gates;
  if (!gates || gates.length === 0) return [];

  const events = [];
  const now = Date.now();

  const gateById = new Map();
  for (const gate of gates) gateById.set(gate.id, gate);

  const gateRegionIds = new Set();
  for (const gate of gates) gateRegionIds.add(gate.regionId);

  for (const army of gameState.armies.values()) {
    // Cooldown check
    const lastTeleport = armyCooldowns.get(army.id);
    if (lastTeleport && (now - lastTeleport) < (gameConstants.GATE_TELEPORT_COOLDOWN || 500)) continue;

    // Only gate-routed armies teleport
    if (!army.isGateRouted) continue;

    // Prevent loop: don't teleport if targeting a gate region
    if (gateRegionIds.has(army.targetRegionId)) continue;

    for (const gate of gates) {
      const dist = distance(army.position, gate.position);
      if (dist <= (gameConstants.GATE_TELEPORT_THRESHOLD || 15)) {
        const pairedGate = gateById.get(gate.pairId);
        if (!pairedGate) continue;

        // Teleport with offset toward target
        const targetRegion = gameState.getRegion(army.finalTargetId || army.targetRegionId);
        let offsetX = gameConstants.GATE_TELEPORT_OFFSET || 20;
        let offsetY = 0;

        if (targetRegion) {
          const dx = targetRegion.center.x - pairedGate.position.x;
          const dy = targetRegion.center.y - pairedGate.position.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            offsetX = (dx / len) * (gameConstants.GATE_TELEPORT_OFFSET || 20);
            offsetY = (dy / len) * (gameConstants.GATE_TELEPORT_OFFSET || 20);
          }
        }

        army.position.x = pairedGate.position.x + offsetX;
        army.position.y = pairedGate.position.y + offsetY;
        army.isGateRouted = false; // Teleport done
        armyCooldowns.set(army.id, now);

        events.push({
          type: 'gate_teleport',
          armyId: army.id,
          fromGateId: gate.id,
          toGateId: pairedGate.id,
          fromPosition: { ...gate.position },
          toPosition: { x: army.position.x, y: army.position.y },
          color: gate.color,
          colorHex: gate.colorHex,
        });

        break; // One teleport per army per tick
      }
    }
  }

  // Cleanup cooldowns for removed armies
  for (const [armyId] of armyCooldowns) {
    if (!gameState.armies.has(armyId)) armyCooldowns.delete(armyId);
  }

  return events;
}

// ─── Pathfinding with Gates ───────────────────────────────

/**
 * Check if routing through a gate is shorter than direct path.
 * @returns {{ useGate, gateId, exitGateId, totalDist, waypoint }}
 */
function findShortestPath(fromPos, toPos, gates) {
  const directDist = distance(fromPos, toPos);
  const result = { useGate: false, gateId: null, exitGateId: null, totalDist: directDist, waypoint: null };

  if (!gates || gates.length === 0) return result;

  const gateById = new Map();
  for (const gate of gates) gateById.set(gate.id, gate);

  for (const gate of gates) {
    const paired = gateById.get(gate.pairId);
    if (!paired) continue;

    const viaDist = distance(fromPos, gate.position) + distance(paired.position, toPos);
    if (viaDist < result.totalDist) {
      result.useGate = true;
      result.gateId = gate.id;
      result.exitGateId = paired.id;
      result.totalDist = viaDist;
      result.waypoint = { ...gate.position };
    }
  }

  return result;
}

function clearCooldowns() {
  armyCooldowns.clear();
}

module.exports = {
  createGates,
  processTick,
  findShortestPath,
  clearCooldowns,
};

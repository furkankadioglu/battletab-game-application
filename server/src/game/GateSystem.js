/**
 * BattleTab v2 — Gate System
 * Portal pair teleportation for armies.
 */

const { gameConstants } = require('../../../shared');

function processTick(gameState) {
  const now = Date.now();
  const events = [];

  for (const army of gameState.armies.values()) {
    if (!army.isGateRouted) continue;
    if (army.gateCooldownUntil > now) continue;

    // Check if army is near a gate region
    for (const gate of gameState.gates) {
      const gateARegion = gameState.getRegion(gate.regionA);
      const gateBRegion = gameState.getRegion(gate.regionB);
      if (!gateARegion || !gateBRegion) continue;

      // Check entrance at gate A
      let teleported = tryTeleport(army, gateARegion, gateBRegion, gate, now, events);
      if (!teleported) {
        // Check entrance at gate B
        tryTeleport(army, gateBRegion, gateARegion, gate, now, events);
      }
    }
  }

  return events;
}

function tryTeleport(army, fromRegion, toRegion, gate, now, events) {
  const dx = army.position.x - fromRegion.center.x;
  const dy = army.position.y - fromRegion.center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= gameConstants.GATE_TELEPORT_THRESHOLD) {
    // Teleport to paired gate with offset toward final target
    const finalTarget = army.finalTargetId;
    let offsetX = 0, offsetY = 0;

    if (finalTarget) {
      // We'd need the final target region, but for simplicity use gate offset
      offsetX = gameConstants.GATE_TELEPORT_OFFSET;
    }

    army.position.x = toRegion.center.x + offsetX;
    army.position.y = toRegion.center.y + offsetY;
    army.gateCooldownUntil = now + gameConstants.GATE_TELEPORT_COOLDOWN;

    events.push({
      type: 'gate_teleport',
      armyId: army.id,
      fromGateId: fromRegion.id,
      toGateId: toRegion.id,
      fromPosition: { x: fromRegion.center.x, y: fromRegion.center.y },
      toPosition: { x: army.position.x, y: army.position.y },
      color: gate.color,
    });

    return true;
  }
  return false;
}

module.exports = { processTick };

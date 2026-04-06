/**
 * BattleTab v2 — Shared Module Entry Point
 * Re-exports all shared constants for both server and client.
 */

const gameConstants = require('./gameConstants');
const eventTypes = require('./eventTypes');
const regionTypes = require('./regionTypes');
const version = require('./version');

module.exports = {
  gameConstants,
  eventTypes,
  regionTypes,
  version,
};

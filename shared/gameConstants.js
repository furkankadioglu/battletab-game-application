/**
 * BattleTab v2 — Game Constants
 * Single source of truth for all game balance numbers.
 * Used by both server (CommonJS) and client (via workspace).
 */

module.exports = {
  // ─── Tick ───────────────────────────────────────────────
  TICK_RATE: 10,               // ticks per second
  TICK_DURATION: 100,          // ms per tick

  // ─── Map ────────────────────────────────────────────────
  MAP_WIDTH: 1600,
  MAP_HEIGHT: 900,

  // ─── Production ─────────────────────────────────────────
  BASE_PRODUCTION_RATE: 1.0,        // soldiers/sec — NORMAL & SPAWN
  TOWER_PRODUCTION_RATE: 1.5,       // soldiers/sec — TOWER
  MOUNTAIN_PRODUCTION_RATE: 0.5,    // soldiers/sec — MOUNTAIN
  SNOW_PRODUCTION_RATE: 0.8,        // soldiers/sec — SNOW
  SPEED_PRODUCTION_RATE: 0.8,       // soldiers/sec — SPEED
  ROCKY_PRODUCTION_RATE: 0,         // impassable, no production
  SPAWN_PRODUCTION_RATE: 1.0,       // soldiers/sec — SPAWN
  NEUTRAL_PRODUCTION_RATE: 0.05,    // 1 soldier per 20 seconds
  INTEREST_RATE: 0.01,              // +1% of current HP per second bonus
  HP_DECAY_RATE: 0.01,              // 1% per second when over cap

  // ─── HP ─────────────────────────────────────────────────
  MAX_REGION_HP: 300,
  SPAWN_HP: 40,
  MIN_NEUTRAL_HP: 3,
  MAX_NEUTRAL_HP: 30,
  CITY_CENTER_HP_BONUS: 0.20,       // +20% max HP per city center (compound)

  // ─── Army ───────────────────────────────────────────────
  ARMY_SPEED: 25,                   // pixels per second
  SOLDIER_SPLIT_RATIO: 0.5,         // send 50% of region HP
  ARMY_COLLISION_RADIUS: 20,        // px — collision detection range
  ARMY_ATTRITION_RATE: 1,           // soldiers lost per second while moving
  ARMY_STUCK_TIMEOUT: 45000,        // ms — auto-destroy stuck armies
  MAX_SELECTED_REGIONS: 12,         // max multi-select source regions
  AUTO_SOURCE_COUNT: 3,             // auto-select nearest owned for click

  // ─── Speed Modifiers ───────────────────────────────────
  SNOW_SPEED_MULTIPLIER: 0.28,      // 72% slower in snow
  SPEED_REGION_MULTIPLIER: 1.5,     // 50% faster in speed regions
  NORMAL_SPEED_MULTIPLIER: 1.0,

  // ─── Terrain ────────────────────────────────────────────
  MOUNTAIN_DEFENSE_BONUS: [10, 25, 50],  // random extra soldiers on capture

  // ─── Combat ─────────────────────────────────────────────
  COMBAT_POWER_VARIATION: 0.2,      // +/-20% random power

  // ─── Siege ──────────────────────────────────────────────
  SIEGE_DAMAGE_PERCENT: 0.10,       // 10% of opposing force per second
  SIEGE_DEFENSE_BONUS: 1.20,        // defender gets 20% base bonus
  SIEGE_WALL_BONUS: 0.50,           // wall adds +50% (total 1.70)
  SIEGE_ATTRITION_PER_SECOND: 0.3,  // siege army attrition
  SIEGE_DAMAGE_PER_SECOND: 2.0,     // legacy constant
  SIEGE_POSITION_OFFSET: 30,        // px offset from region center
  SIEGE_MAX_ARMIES_PER_REGION: 3,   // max simultaneous siege armies

  // ─── Visibility & Range ─────────────────────────────────
  FOG_DEPTH: 2,                     // BFS hops for visibility
  ATTACK_RANGE: 1,                  // BFS hops for sending armies

  // ─── Abilities ──────────────────────────────────────────
  MISSILE_COOLDOWN: 10000,          // ms
  MISSILE_DAMAGE_RATIO: 0.5,        // 50% HP damage
  MISSILE_INITIAL_CHARGES: 0,

  NUCLEAR_COOLDOWN: 10000,
  NUCLEAR_DURATION: 3000,           // ms — production disable duration
  NUCLEAR_INITIAL_CHARGES: 0,

  BARRACKS_COOLDOWN: 10000,
  BARRACKS_INITIAL_CHARGES: 0,

  SPEED_BOOST_COOLDOWN: 10000,
  SPEED_BOOST_DURATION: 10000,      // ms — 10 seconds
  SPEED_BOOST_MULTIPLIER: 1.25,     // 25% faster
  SPEED_BOOST_INITIAL_CHARGES: 0,

  FREEZE_COOLDOWN: 30000,           // ms — 30 seconds
  FREEZE_ARMY_DURATION: 1500,       // ms — 1.5 seconds
  FREEZE_INITIAL_CHARGES: 0,

  // ─── Game Phases ────────────────────────────────────────
  COUNTDOWN_SECONDS: 3,
  SPAWN_SELECTION_SECONDS: 15,
  PREVIEW_MS: 3200,                 // 3000 + 200ms network buffer

  // ─── Resources ──────────────────────────────────────────
  RESOURCE_TYPES: ['iron', 'crystal', 'uranium'],
  RESOURCE_MIN_RATE: 0.8,
  RESOURCE_MAX_RATE: 1.2,

  // ─── Buildings ──────────────────────────────────────────
  BUILDING_COSTS: {
    city_center:    { iron: 80, crystal: 80, uranium: 40 },
    barracks:       { iron: 60, crystal: 30, uranium: 30 },
    wall:           { iron: 40, crystal: 20, uranium: 10 },
    iron_dome:      { iron: 60, crystal: 60, uranium: 80 },
    stealth_tower:  { iron: 30, crystal: 70, uranium: 50 },
    drone_facility: { iron: 50, crystal: 50, uranium: 70 },
    missile_base:   { iron: 40, crystal: 40, uranium: 100 },
  },
  BUILDING_LEVEL_COST_MULT: 0,      // % per existing same-type (admin overridable)
  BUILDING_MAX_PER_PLAYER: 0,       // 0 = unlimited
  BARRACKS_PRODUCTION_BONUS: 0.10,  // +10% per barracks building

  // ─── Gates ──────────────────────────────────────────────
  GATE_TELEPORT_THRESHOLD: 15,      // px — distance to trigger teleport
  GATE_TELEPORT_OFFSET: 20,         // px — exit offset toward target
  GATE_TELEPORT_COOLDOWN: 500,      // ms — prevent re-teleport
  GATE_MIN_HOP_DISTANCE: 4,         // min BFS hops between paired gates
  GATE_MIN_PIXEL_DISTANCE: 200,     // min Euclidean px between paired gates
  GATE_COLORS: ['#BB44FF', '#00DDDD', '#FF44AA'],

  // ─── Pathfinding ────────────────────────────────────────
  ROCKY_EXPANSION_MARGIN: 18,       // px — expand rocky polygons for pathfinding
  WAYPOINT_ARRIVAL_THRESHOLD: 8,    // px — waypoint reached distance

  // ─── Player Colors (16) ─────────────────────────────────
  PLAYER_COLORS: [
    '#E94560', '#06D6A0', '#8338EC', '#FFD166',
    '#4CC9F0', '#FF6B35', '#8AC926', '#F72585',
    '#2EC4B6', '#FB5607', '#7209B7', '#FFBE0B',
    '#6A4C93', '#FF595E', '#E07C24', '#FF006E',
  ],

  // ─── Bot AI ─────────────────────────────────────────────
  BOT_DECISION_INTERVAL: 1500,      // ms between bot decisions
  BOT_NAMES: ['Bot Alpha', 'Bot Bravo', 'Bot Charlie', 'Bot Delta', 'Bot Echo', 'Bot Foxtrot'],

  // ─── Diamond Economy ────────────────────────────────────
  DIAMOND_REWARD_BOT_WIN: 1,
  DIAMOND_REWARD_NORMAL_WIN: 2,
  DIAMOND_REWARD_RANKED_WIN: 5,
  DIAMOND_REWARD_LEAGUE_PROMOTION: 100,
  RANKED_ENTRY_FEE: 1,
  STARTING_DIAMONDS: 500,

  // ─── ELO / Ranked ──────────────────────────────────────
  ELO_K_FACTOR: 32,
  ELO_STARTING_RATING: 1000,
  RANKED_ELO_RANGE: 200,            // initial matchmaking range
  RANKED_EXPAND_INTERVAL: 15000,    // ms — widen range every 15s
  RANKED_EXPAND_AMOUNT: 100,        // widen by 100 ELO
  RANKED_WAIT_BEFORE_EXPAND: 30000, // ms — wait 30s before expanding

  // ─── Leagues ─────────────────────────────────────────���──
  LEAGUES: [
    { name: 'Bronze',  min: 0,    max: 799  },
    { name: 'Silver',  min: 800,  max: 999  },
    { name: 'Gold',    min: 1000, max: 1199 },
    { name: 'Diamond', min: 1200, max: 1399 },
    { name: 'Master',  min: 1400, max: Infinity },
  ],

  // ─── Network ───────────────────────────────────────────
  MAX_EVENTS_PER_SECOND: 5,         // rate limit per socket
  PING_INTERVAL: 25000,             // ms — server ping interval
  PING_TIMEOUT: 60000,              // ms — server ping timeout
  RECONNECT_ATTEMPTS: 10,
  RECONNECT_DELAY: 500,             // ms
  MAX_PAYLOAD: 100 * 1024,          // 100KB
  PLAYER_DATA_TICK_INTERVAL: 5,     // send player data every 5th tick
  COMPRESSION_THRESHOLD: 256,       // bytes — deflate threshold
  COMPRESSION_LEVEL: 1,             // zlib level (speed)
  CLIENT_PING_INTERVAL: 3000,       // ms — client measures ping

  // ─── Map Generation ─────────────────────────────────────
  MAX_POLYGON_VERTICES: 60,
  NEIGHBOR_THRESHOLD_PERCENT: 2.0,  // % of map dimension for neighbor detection
  MIN_NEIGHBORS: 2,
  OVERSIZED_REGION_MULT: 1.5,       // split regions > 1.5x average
  UNDERSIZED_REGION_MULT: 0.15,     // merge regions < 0.15x average
  MAP_PADDING: 50,                  // px padding for projection

  // ─── Region Type Distribution ───────────────────────────
  MOUNTAIN_PERCENT: 0.15,
  SNOW_PERCENT: 0.15,
  SNOW_CHANCE: 0.60,                // 60% chance per map
  ROCKY_PERCENT: 0.08,
  ROCKY_CHANCE: 0.60,               // 60% chance per map
  ROCKY_MIN_REGIONS: 10,            // min total regions to allow rocky
  SPEED_PERCENT: 0.10,              // of remaining normals

  // ─── UI (shared reference) ─────────────────────────────
  COLORS: {
    GOLD: '#c8a84e',
    GOLD_DARK: '#a8882e',
    GOLD_LIGHT: '#d8b85e',
    BG_DEEP: 'rgba(8, 8, 20, 0.92)',
    BG_PANEL: 'rgba(6, 6, 14, 0.85)',
    TEXT_PRIMARY: '#d0d0e0',
    TEXT_WHITE: '#ffffff',
    OCEAN_BLUE: '#134e6f',
    ERROR_RED: '#d94a4a',
    SUCCESS_GREEN: '#4ad94a',
  },
};

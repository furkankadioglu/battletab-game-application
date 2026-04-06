/**
 * BattleTab v2 — Skin Catalog
 * Static definitions for all purchasable cosmetics.
 */

const catalog = [
  // Skins (player color override)
  { id: 'skin_black', name: 'Black', category: 'skin', price: 1000, rarity: 'epic', data: { color: '#111111' } },
  { id: 'skin_white', name: 'White', category: 'skin', price: 1000, rarity: 'epic', data: { color: '#eeeeee' } },

  // Army Shapes
  { id: 'shape_circle', name: 'Circle', category: 'army_shape', price: 150, rarity: 'common', data: { shape: 'circle' } },
  { id: 'shape_diamond', name: 'Diamond', category: 'army_shape', price: 200, rarity: 'common', data: { shape: 'diamond' } },
  { id: 'shape_star', name: 'Star', category: 'army_shape', price: 300, rarity: 'rare', data: { shape: 'star' } },
  { id: 'shape_shield', name: 'Shield', category: 'army_shape', price: 750, rarity: 'epic', data: { shape: 'shield' } },
  { id: 'shape_hex', name: 'Hexagon', category: 'army_shape', price: 1000, rarity: 'epic', data: { shape: 'hexagon' } },

  // Trail Effects
  { id: 'trail_sparkle', name: 'Sparkle', category: 'trail_effect', price: 300, rarity: 'rare', data: { type: 'sparkle' } },
  { id: 'trail_fire', name: 'Fire', category: 'trail_effect', price: 500, rarity: 'rare', data: { type: 'fire' } },
  { id: 'trail_ice', name: 'Ice', category: 'trail_effect', price: 600, rarity: 'rare', data: { type: 'ice' } },
  { id: 'trail_rainbow', name: 'Rainbow', category: 'trail_effect', price: 2000, rarity: 'legendary', data: { type: 'rainbow' } },

  // Capture Effects
  { id: 'cap_sparkle', name: 'Sparkle', category: 'capture_effect', price: 400, rarity: 'rare', data: { type: 'sparkle' } },
  { id: 'cap_shockwave', name: 'Shockwave', category: 'capture_effect', price: 500, rarity: 'rare', data: { type: 'shockwave' } },
  { id: 'cap_flames', name: 'Flames', category: 'capture_effect', price: 750, rarity: 'epic', data: { type: 'flames' } },
  { id: 'cap_lightning', name: 'Lightning', category: 'capture_effect', price: 2500, rarity: 'legendary', data: { type: 'lightning' } },
];

function getCatalog() { return catalog; }
function getSkinById(id) { return catalog.find(s => s.id === id); }
function getSkinsByCategory(category) { return catalog.filter(s => s.category === category); }

module.exports = { getCatalog, getSkinById, getSkinsByCategory, catalog };

/**
 * BattleTab v2 — Store Service
 * Diamond management, skin purchase/equip.
 */

const { gameConstants } = require('../../../shared');
const { getSkinById } = require('./SkinCatalog');

class StoreService {
  constructor() {
    this.userDiamonds = new Map();     // userId → balance
    this.userSkins = new Map();        // userId → Set<skinId>
    this.userActiveSkins = new Map();  // userId → Map<category, skinId>
    this.dbPool = null;
  }

  setDbPool(pool) { this.dbPool = pool; }

  getDiamonds(userId) {
    return this.userDiamonds.get(userId) ?? gameConstants.STARTING_DIAMONDS;
  }

  addDiamonds(userId, amount) {
    const current = this.getDiamonds(userId);
    const newBalance = Math.max(0, Math.min(current + amount, 10000));
    this.userDiamonds.set(userId, newBalance);
    return newBalance;
  }

  purchaseSkin(userId, skinId) {
    const skin = getSkinById(skinId);
    if (!skin) return { error: 'Skin not found' };

    const owned = this.userSkins.get(userId) || new Set();
    if (owned.has(skinId)) return { error: 'Already owned' };

    const diamonds = this.getDiamonds(userId);
    if (diamonds < skin.price) return { error: 'Insufficient diamonds' };

    this.addDiamonds(userId, -skin.price);
    owned.add(skinId);
    this.userSkins.set(userId, owned);

    return { success: true, diamonds: this.getDiamonds(userId), skinId };
  }

  equipSkin(userId, skinId) {
    const skin = getSkinById(skinId);
    if (!skin) return { error: 'Skin not found' };

    const owned = this.userSkins.get(userId) || new Set();
    if (!owned.has(skinId)) return { error: 'Not owned' };

    if (!this.userActiveSkins.has(userId)) this.userActiveSkins.set(userId, new Map());
    this.userActiveSkins.get(userId).set(skin.category, skinId);

    return { success: true, category: skin.category, skinId };
  }

  unequipSkin(userId, category) {
    const active = this.userActiveSkins.get(userId);
    if (active) active.delete(category);
    return { success: true };
  }

  getUserSkins(userId) {
    return [...(this.userSkins.get(userId) || new Set())];
  }

  getActiveSkins(userId) {
    const active = this.userActiveSkins.get(userId);
    if (!active) return {};
    const result = {};
    for (const [category, skinId] of active) {
      result[category] = skinId;
    }
    return result;
  }

  getPlayerSkinData(userId) {
    return this.getActiveSkins(userId);
  }

  rewardMatchEnd(userId, mode, won) {
    if (!won) return 0;
    let reward = 0;
    if (mode === 'ranked') reward = gameConstants.DIAMOND_REWARD_RANKED_WIN;
    else if (mode === 'bot') reward = gameConstants.DIAMOND_REWARD_BOT_WIN;
    else reward = gameConstants.DIAMOND_REWARD_NORMAL_WIN;

    this.addDiamonds(userId, reward);
    return reward;
  }
}

module.exports = StoreService;

/**
 * BattleTab v2 — Player Entity
 * Represents a player in a game room.
 */

class Player {
  constructor({ id, socketId, username, color, isBot }) {
    this.id = id;
    this.socketId = socketId || null;
    this.username = username;
    this.color = color;
    this.isBot = isBot || false;
    this.isEliminated = false;
    this.regionCount = 0;

    // Ability charges
    this.charges = {
      missile: 0,
      nuclear: 0,
      barracks: 0,
      speedBoost: 0,
      freeze: 0,
    };

    // Ability cooldowns (timestamps)
    this.cooldowns = {
      missile: 0,
      nuclear: 0,
      barracks: 0,
      speedBoost: 0,
      freeze: 0,
    };

    // Resources
    this.resources = { iron: 0, crystal: 0, uranium: 0 };

    // Speed boost state
    this.speedBoostUntil = 0;

    // Active skins
    this.activeSkins = {};
  }

  serialize(isSelf = false) {
    const base = {
      id: this.id,
      username: this.username,
      color: this.color,
      isBot: this.isBot,
      isEliminated: this.isEliminated,
      regionCount: this.regionCount,
    };

    if (isSelf) {
      base.charges = { ...this.charges };
      base.cooldowns = { ...this.cooldowns };
      base.resources = { ...this.resources };
      base.speedBoostUntil = this.speedBoostUntil;
      base.activeSkins = this.activeSkins;
    }

    return base;
  }
}

module.exports = Player;

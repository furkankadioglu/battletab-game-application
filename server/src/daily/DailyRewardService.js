/**
 * BattleTab v2 — Daily Reward Service
 * 30-day streak cycle with escalating diamond rewards.
 * Reset time: 06:00 UTC (09:00 Turkey)
 */

const RESET_HOUR_UTC = 6;
const MAX_STREAK = 30;
const BASE_REWARD = 10; // Day 1: 10, Day 2: 11, ..., Day 30: 39

class DailyRewardService {
  constructor(storeService) {
    this.storeService = storeService;
    this.streaks = new Map(); // userId → { day, lastClaimTs, cycleStartTs }
    this.dbPool = null;
  }

  setDbPool(pool) { this.dbPool = pool; }

  _getRewardDay(timestamp) {
    const d = new Date(timestamp);
    // Adjust for 06:00 UTC reset
    const adjusted = new Date(d.getTime() - RESET_HOUR_UTC * 3600000);
    return Math.floor(adjusted.getTime() / 86400000);
  }

  _getReward(day) {
    return BASE_REWARD + (day - 1);
  }

  getStatus(userId) {
    const streak = this.streaks.get(userId) || { day: 1, lastClaimTs: 0, cycleStartTs: 0 };
    const today = this._getRewardDay(Date.now());
    const lastClaimed = streak.lastClaimTs > 0 ? this._getRewardDay(streak.lastClaimTs) : -1;
    const canClaim = lastClaimed < today;

    // Check if streak broken (2+ day gap)
    if (lastClaimed > 0 && today - lastClaimed > 1) {
      streak.day = 1; // Reset
    }

    const rewards = this._buildRewardsList(streak.day, !canClaim);

    return {
      streakDay: streak.day,
      canClaim,
      todayReward: this._getReward(streak.day),
      rewards,
    };
  }

  claimReward(userId) {
    const status = this.getStatus(userId);
    if (!status.canClaim) return { error: 'Already claimed today' };

    let streak = this.streaks.get(userId);
    if (!streak) {
      streak = { day: 1, lastClaimTs: 0, cycleStartTs: Date.now() };
      this.streaks.set(userId, streak);
    }

    const reward = this._getReward(streak.day);
    const newBalance = this.storeService.addDiamonds(userId, reward);

    const claimedDay = streak.day;
    streak.lastClaimTs = Date.now();
    streak.day = streak.day >= MAX_STREAK ? 1 : streak.day + 1;

    return {
      success: true,
      day: claimedDay,
      reward,
      totalDiamonds: newBalance,
    };
  }

  _buildRewardsList(currentDay, claimedToday) {
    const rewards = [];
    for (let d = 1; d <= MAX_STREAK; d++) {
      let status;
      if (d < currentDay) status = 'claimed';
      else if (d === currentDay) status = claimedToday ? 'claimed' : 'today';
      else status = 'upcoming';

      rewards.push({ day: d, reward: this._getReward(d), status });
    }
    return rewards;
  }
}

module.exports = DailyRewardService;

/**
 * BattleTab v2 — Ranking Service
 * ELO-based competitive ranking with league tiers.
 */

const { gameConstants } = require('../../../shared');

const LEAGUES = gameConstants.LEAGUES;

class RankingService {
  constructor() {
    this.playerRatings = new Map();  // userId → rating
    this.promotionRewards = new Map(); // userId → Set<rankName>
    this.dbPool = null;
  }

  setDbPool(pool) { this.dbPool = pool; }

  getRating(userId) {
    return this.playerRatings.get(userId) || gameConstants.ELO_STARTING_RATING;
  }

  setRating(userId, rating) {
    this.playerRatings.set(userId, Math.max(0, Math.round(rating)));
  }

  recordMatch(winnerId, loserId) {
    const winnerRating = this.getRating(winnerId);
    const loserRating = this.getRating(loserId);

    const K = gameConstants.ELO_K_FACTOR;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 - expectedWinner;

    const winnerDelta = Math.round(K * (1 - expectedWinner));
    const loserDelta = Math.round(K * (0 - expectedLoser));

    const newWinnerRating = winnerRating + winnerDelta;
    const newLoserRating = loserRating + loserDelta;

    this.setRating(winnerId, newWinnerRating);
    this.setRating(loserId, newLoserRating);

    return {
      winner: { userId: winnerId, oldRating: winnerRating, newRating: newWinnerRating, delta: winnerDelta },
      loser: { userId: loserId, oldRating: loserRating, newRating: newLoserRating, delta: loserDelta },
    };
  }

  checkPromotion(userId, oldRating, newRating) {
    const oldLeague = this.getLeagueByRating(oldRating);
    const newLeague = this.getLeagueByRating(newRating);

    if (!this.promotionRewards.has(userId)) {
      this.promotionRewards.set(userId, new Set());
    }
    const rewarded = this.promotionRewards.get(userId);

    if (newLeague.name !== oldLeague.name && !rewarded.has(newLeague.name) && newRating > oldRating) {
      rewarded.add(newLeague.name);
      return {
        promoted: true,
        league: newLeague.name,
        reward: gameConstants.DIAMOND_REWARD_LEAGUE_PROMOTION,
      };
    }

    return { promoted: false };
  }

  getLeagueByRating(rating) {
    for (const league of LEAGUES) {
      if (rating >= league.min && rating <= league.max) return league;
    }
    return LEAGUES[0];
  }

  getLeaderboard(limit = 10) {
    return [...this.playerRatings.entries()]
      .map(([userId, rating]) => ({ userId, rating, league: this.getLeagueByRating(rating).name }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  async loadFromDB() {
    // Future: load from matches/users table
  }
}

module.exports = RankingService;

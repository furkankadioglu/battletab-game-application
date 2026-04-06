/**
 * BattleTab v2 — Ranking Routes
 */

const { Router } = require('express');

function createRankingRoutes(rankingService) {
  const router = Router();

  router.get('/leaderboard', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    res.json(rankingService.getLeaderboard(Math.min(limit, 100)));
  });

  router.get('/profile/:userId', (req, res) => {
    const rating = rankingService.getRating(req.params.userId);
    const league = rankingService.getLeagueByRating(rating);
    res.json({ userId: req.params.userId, rating, league: league.name });
  });

  return router;
}

module.exports = { createRankingRoutes };

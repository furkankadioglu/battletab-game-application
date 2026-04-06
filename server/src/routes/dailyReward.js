/**
 * BattleTab v2 — Daily Reward Routes
 */

const { Router } = require('express');

function createDailyRewardRoutes(dailyRewardService, authenticate) {
  const router = Router();

  router.get('/status', authenticate, (req, res) => {
    if (req.user.isGuest) return res.status(403).json({ error: 'Guests cannot claim daily rewards' });
    res.json(dailyRewardService.getStatus(req.user.userId));
  });

  router.post('/claim', authenticate, (req, res) => {
    if (req.user.isGuest) return res.status(403).json({ error: 'Guests cannot claim daily rewards' });
    const result = dailyRewardService.claimReward(req.user.userId);
    if (result.error) return res.status(400).json(result);
    res.json(result);
  });

  return router;
}

module.exports = { createDailyRewardRoutes };

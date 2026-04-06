/**
 * BattleTab v2 — Store Routes
 */

const { Router } = require('express');
const { getCatalog } = require('../store/SkinCatalog');

function createStoreRoutes(storeService, authenticate) {
  const router = Router();

  router.get('/catalog', (req, res) => res.json(getCatalog()));

  router.get('/my-skins', authenticate, (req, res) => {
    res.json({
      owned: storeService.getUserSkins(req.user.userId),
      active: storeService.getActiveSkins(req.user.userId),
      diamonds: storeService.getDiamonds(req.user.userId),
    });
  });

  router.post('/purchase', authenticate, (req, res) => {
    const result = storeService.purchaseSkin(req.user.userId, req.body.skinId);
    if (result.error) return res.status(400).json(result);
    res.json(result);
  });

  router.post('/equip', authenticate, (req, res) => {
    const result = storeService.equipSkin(req.user.userId, req.body.skinId);
    if (result.error) return res.status(400).json(result);
    res.json(result);
  });

  router.post('/unequip', authenticate, (req, res) => {
    const result = storeService.unequipSkin(req.user.userId, req.body.category);
    res.json(result);
  });

  return router;
}

module.exports = { createStoreRoutes };

/**
 * BattleTab v2 — Friends Routes
 */

const { Router } = require('express');

function createFriendsRoutes(friendService, authenticate) {
  const router = Router();

  router.get('/', authenticate, (req, res) => {
    res.json(friendService.getFriends(req.user.userId));
  });

  router.get('/requests', authenticate, (req, res) => {
    res.json(friendService.getPendingRequests(req.user.userId));
  });

  router.post('/request', authenticate, (req, res) => {
    const result = friendService.sendRequest(req.user.userId, req.body.playerCode);
    if (result.error) return res.status(400).json(result);
    res.json(result);
  });

  router.post('/accept', authenticate, (req, res) => {
    const result = friendService.acceptRequest(req.user.userId, req.body.fromUserId);
    if (result.error) return res.status(400).json(result);
    res.json(result);
  });

  router.post('/reject', authenticate, (req, res) => {
    const result = friendService.rejectRequest(req.user.userId, req.body.fromUserId);
    if (result.error) return res.status(400).json(result);
    res.json(result);
  });

  router.delete('/:friendId', authenticate, (req, res) => {
    const result = friendService.removeFriend(req.user.userId, req.params.friendId);
    res.json(result);
  });

  return router;
}

module.exports = { createFriendsRoutes };

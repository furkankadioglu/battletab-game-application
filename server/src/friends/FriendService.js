/**
 * BattleTab v2 — Friend Service
 * In-memory friend management with player codes.
 */

class FriendService {
  constructor(authService) {
    this.authService = authService;
    this.friends = new Map();        // userId → Set<friendId>
    this.pendingRequests = new Map(); // userId → [{ from, createdAt }]
  }

  sendRequest(fromUserId, playerCode) {
    if (!playerCode) return { error: 'Player code required' };

    // Find target by player code
    const targetId = this.authService.playerCodeIndex.get(playerCode);
    if (!targetId) return { error: 'Player not found' };
    if (targetId === fromUserId) return { error: 'Cannot add yourself' };

    // Already friends?
    const friendSet = this.friends.get(fromUserId);
    if (friendSet?.has(targetId)) return { error: 'Already friends' };

    // Auto-accept: if target already sent request to us
    const myPending = this.pendingRequests.get(fromUserId) || [];
    const reverseRequest = myPending.find(r => r.from === targetId);
    if (reverseRequest) {
      return this.acceptRequest(fromUserId, targetId);
    }

    // Add to target's pending
    if (!this.pendingRequests.has(targetId)) this.pendingRequests.set(targetId, []);
    const pending = this.pendingRequests.get(targetId);

    // Check duplicate
    if (pending.some(r => r.from === fromUserId)) return { error: 'Request already sent' };

    pending.push({ from: fromUserId, createdAt: Date.now() });
    const targetUser = this.authService.users.get(targetId);
    return { success: true, targetUsername: targetUser?.username };
  }

  acceptRequest(userId, fromUserId) {
    const pending = this.pendingRequests.get(userId) || [];
    const idx = pending.findIndex(r => r.from === fromUserId);
    if (idx === -1) return { error: 'No pending request from this user' };

    pending.splice(idx, 1);

    // Add bidirectional friendship
    if (!this.friends.has(userId)) this.friends.set(userId, new Set());
    if (!this.friends.has(fromUserId)) this.friends.set(fromUserId, new Set());
    this.friends.get(userId).add(fromUserId);
    this.friends.get(fromUserId).add(userId);

    return { success: true };
  }

  rejectRequest(userId, fromUserId) {
    const pending = this.pendingRequests.get(userId) || [];
    const idx = pending.findIndex(r => r.from === fromUserId);
    if (idx === -1) return { error: 'No pending request' };
    pending.splice(idx, 1);
    return { success: true };
  }

  removeFriend(userId, friendId) {
    this.friends.get(userId)?.delete(friendId);
    this.friends.get(friendId)?.delete(userId);
    return { success: true };
  }

  getFriends(userId) {
    const friendIds = this.friends.get(userId) || new Set();
    return [...friendIds].map(fId => {
      const user = this.authService.users.get(fId);
      return user ? { id: fId, username: user.username, playerCode: user.playerCode, isGuest: user.isGuest } : null;
    }).filter(Boolean);
  }

  getPendingRequests(userId) {
    return (this.pendingRequests.get(userId) || []).map(r => {
      const user = this.authService.users.get(r.from);
      return { fromUserId: r.from, fromUsername: user?.username, createdAt: r.createdAt };
    });
  }
}

module.exports = FriendService;

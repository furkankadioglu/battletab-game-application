/**
 * BattleTab v2 — Socket Manager
 * Singleton WebSocket client with reconnection and ping measurement.
 */

import { io } from 'socket.io-client';

let instance = null;
const listeners = new Map(); // event → Set<callback>

class SocketManager {
  constructor() {
    this.socket = null;
    this.ping = 0;
    this._pingInterval = null;
  }

  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      this.socket = io(serverUrl || undefined, {
        transports: ['websocket'],
        upgrade: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 500,
        forceNew: true,
      });

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('Socket connected:', this.socket.id);
        this._startPingMeasurement();
        resolve(this.socket);
      });

      this.socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this._stopPingMeasurement();
      });
    });
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (!this.socket) return;
    // Prevent duplicate listeners
    if (!listeners.has(event)) listeners.set(event, new Set());
    const set = listeners.get(event);
    if (set.has(callback)) return;
    set.add(callback);
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
    const set = listeners.get(event);
    if (set) set.delete(callback);
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getPing() {
    return this.ping;
  }

  disconnect() {
    this._stopPingMeasurement();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    listeners.clear();
  }

  _startPingMeasurement() {
    this._pingInterval = setInterval(() => {
      if (!this.socket?.connected) return;
      const start = Date.now();
      this.socket.emit('ping_check', start);
    }, 3000);

    this.socket.on('pong_check', (startTs) => {
      this.ping = Date.now() - startTs;
    });
  }

  _stopPingMeasurement() {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
  }

  static getInstance() {
    if (!instance) instance = new SocketManager();
    return instance;
  }
}

export default SocketManager;

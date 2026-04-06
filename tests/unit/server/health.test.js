/**
 * BattleTab v2 — Health Endpoint Unit Tests
 */

const http = require('http');
const express = require('express');

// Create a minimal test app with just the health route
function createTestApp() {
  const app = express();
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: require('../../../shared/version').version,
    });
  });
  return app;
}

describe('Health Endpoint', () => {
  let server;
  let port;

  beforeAll((done) => {
    const app = createTestApp();
    server = http.createServer(app);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('GET /api/health returns 200', (done) => {
    http.get(`http://localhost:${port}/api/health`, (res) => {
      expect(res.statusCode).toBe(200);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const body = JSON.parse(data);
        expect(body.status).toBe('ok');
        expect(body.version).toBe('2.0.0');
        expect(body.uptime).toBeGreaterThanOrEqual(0);
        expect(body.timestamp).toBeDefined();
        done();
      });
    });
  });
});

/**
 * BattleTab v2 — Server Boot Integration Test
 * Tests server startup without DB/Redis (graceful degradation).
 */

const http = require('http');

describe('Server Boot', () => {
  let serverModule;
  let port;

  beforeAll((done) => {
    // Use a random port to avoid conflicts
    process.env.PORT = '0';
    // Clear module cache to get fresh server
    delete require.cache[require.resolve('../../server/src/index')];
    delete require.cache[require.resolve('../../server/src/config')];

    serverModule = require('../../server/src/index');

    // Wait for server to start listening
    const checkReady = setInterval(() => {
      const addr = serverModule.server.address();
      if (addr) {
        port = addr.port;
        clearInterval(checkReady);
        done();
      }
    }, 100);
  }, 15000);

  afterAll((done) => {
    serverModule.server.close(done);
  });

  test('health endpoint returns 200', (done) => {
    http.get(`http://localhost:${port}/api/health`, (res) => {
      expect(res.statusCode).toBe(200);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const body = JSON.parse(data);
        expect(body.status).toBe('ok');
        expect(body.version).toBe('2.0.0');
        done();
      });
    });
  });

  test('detailed health shows DB/Redis status', (done) => {
    http.get(`http://localhost:${port}/api/health/detailed`, (res) => {
      expect(res.statusCode).toBe(200);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const body = JSON.parse(data);
        expect(body).toHaveProperty('db');
        expect(body).toHaveProperty('redis');
        done();
      });
    });
  });

  test('404 for unknown routes', (done) => {
    http.get(`http://localhost:${port}/nonexistent`, (res) => {
      expect(res.statusCode).toBe(404);
      done();
    });
  });
});

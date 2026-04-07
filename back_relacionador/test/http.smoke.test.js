'use strict';

const http = require('node:http');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../server/server.js');

function startServer() {
    return new Promise((resolve, reject) => {
        const server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => resolve(server));
        server.on('error', reject);
    });
}

describe('HTTP smoke (Express montado en servidor HTTP)', () => {
    let server;
    let baseUrl;

    before(async () => {
        server = await startServer();
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
    });

    after(() => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))));

    test('GET /health responde 200 y cuerpo ok', async () => {
        const res = await fetch(`${baseUrl}/health`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.ok, true);
        assert.equal(body.service, 'back_relacionador');
    });

    test('GET /protected sin Authorization responde 401', async () => {
        const res = await fetch(`${baseUrl}/protected`);
        assert.equal(res.status, 401);
        const body = await res.json();
        assert.ok(body && body.error);
    });

    test('GET /apiV3 ruta inexistente responde 404', async () => {
        const res = await fetch(`${baseUrl}/apiV3/__no_existe_ruta_smoke__`);
        assert.equal(res.status, 404);
    });
});

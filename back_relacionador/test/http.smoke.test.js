'use strict';

// Nota: el backend exige variables de entorno para DB al importar `server/db.js`.
// Para smoke tests, configuramos placeholders antes de requerir la app.
process.env.DB_SERVER ||= 'localhost';
process.env.DB_DATABASE ||= 'CeereSio';
process.env.DB_USER ||= 'CeereRIPS';
process.env.DB_PASSWORD ||= 'crsoft';
process.env.CEERE_RIPS_DATA_ROOT ||= 'C:\\CeereSio\\RIPS_2275';
process.env.RIPS_2275_ROOT ||= process.env.CEERE_RIPS_DATA_ROOT;

const http = require('node:http');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../server/server.js');
const { poolPromise } = require('../server/db2');
const tediousConnection = require('../server/db');

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

    after(async () => {
        await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
        // Evita que el proceso de pruebas quede colgado por el pool MSSQL.
        try {
            const pool = await poolPromise;
            await pool.close();
        } catch {
            // Si el pool no alcanzó a crear, no bloquear el teardown.
        }

        try {
            if (tediousConnection && typeof tediousConnection.close === 'function') {
                tediousConnection.close();
            }
        } catch {
            // noop
        }
    });

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

    test('GET /apiV3/relacionesRipsDesrelacionador/pacientes responde 200', async () => {
        const res = await fetch(
            `${baseUrl}/apiV3/relacionesRipsDesrelacionador/pacientes/123/2026-04-01/2026-04-15`
        );
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.ok(body && Array.isArray(body.items));
    });

    test('GET /apiV3/relacionesRipsDesrelacionador responde 200', async () => {
        const res = await fetch(
            `${baseUrl}/apiV3/relacionesRipsDesrelacionador/999/123/2026-04-01/2026-04-15`
        );
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.ok(body && Array.isArray(body.items));
    });
});

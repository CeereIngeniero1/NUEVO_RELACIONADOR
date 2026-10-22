'use strict';

/**
 * Switch relación automática RIPS ↔ Factura.
 * GET/PUT /apiV3/Rips/relacion-automatica-factura
 * POST /apiV3/Rips/relacion-automatica-factura/ensure-install
 */
const fs = require('fs');
const path = require('path');
const Router = require('express').Router;
const router = Router();

function mapSqlErr(err) {
    const msg = String(err && (err.message || err) || '');
    if (/Invalid object name|nombre de objeto.*ConfigRelacionAutomaticaRipsFactura|ConfigRelacionAutomaticaRipsFactura.*no es v[aá]lido/i.test(msg)) {
        const e = new Error(
            'No existe la tabla ConfigRelacionAutomaticaRipsFactura. '
            + 'Puede instalarla desde esta pantalla o ejecutar SQL/2275/20. Relacion_Automatica_Rips_Factura.sql'
        );
        e.code = 'RELACION_AUTO_TABLA_AUSENTE';
        e.status = 409;
        return e;
    }
    return err;
}

async function ensureConfigRow(pool) {
    await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.ConfigRelacionAutomaticaRipsFactura WHERE Id = 1)
            INSERT INTO dbo.ConfigRelacionAutomaticaRipsFactura (Id, Activo) VALUES (1, 0);
    `);
}

async function configTableExists(pool) {
    const result = await pool.request().query(`
        SELECT CASE
            WHEN EXISTS (
                SELECT 1 FROM sys.tables
                WHERE name = N'ConfigRelacionAutomaticaRipsFactura'
                  AND schema_id = SCHEMA_ID(N'dbo')
            ) THEN 1 ELSE 0
        END AS existe
    `);
    return Number(result.recordset?.[0]?.existe) === 1;
}

/**
 * Ejecuta el instalador 20. Relacion_Automatica_Rips_Factura.sql (lotes separados por GO).
 */
async function ensureRelacionAutomaticaInstall() {
    const { poolPromise } = require('../db2');
    const pool = await poolPromise;
    const sqlPath = path.join(
        __dirname,
        '..',
        '..',
        'SQL',
        '2275',
        '20. Relacion_Automatica_Rips_Factura.sql'
    );
    if (!fs.existsSync(sqlPath)) {
        const err = new Error(`No se encontró el instalador: ${sqlPath}`);
        err.code = 'RELACION_AUTO_SQL_NO_ENCONTRADO';
        err.status = 500;
        throw err;
    }

    const existed = await configTableExists(pool);
    const raw = fs.readFileSync(sqlPath, 'utf8');
    const batches = raw
        .split(/^\s*GO\s*$/gim)
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

    let executed = 0;
    for (const batch of batches) {
        // Ignorar lotes que solo son comentarios
        const withoutComments = batch
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/--.*$/gm, '')
            .trim();
        if (!withoutComments) continue;
        await pool.request().batch(batch);
        executed += 1;
    }

    await ensureConfigRow(pool);
    const triggers = await pool.request().query(`
        SELECT name
        FROM sys.triggers
        WHERE name IN (
            N'TR_RelacionAuto_Factura_Insert',
            N'TR_RelacionAuto_Rips_Insert',
            N'TR_RelacionAuto_Factura_Anulada'
        )
        ORDER BY name
    `);

    return {
        ok: true,
        created: !existed,
        alreadyExisted: existed,
        batchesExecuted: executed,
        triggers: (triggers.recordset || []).map((r) => r.name),
        message: existed
            ? 'Instalación verificada (config y triggers). Switch en OFF hasta que lo active.'
            : 'Relación automática instalada. Switch en OFF; actívelo cuando quiera.',
    };
}

/** Ping sin BD: sirve para verificar que el backend nuevo está cargado. */
router.get('/Rips/relacion-automatica-factura/ping', (req, res) => {
    res.json({
        ok: true,
        service: 'relacion-automatica-rips-factura',
        version: '2026-10-22',
    });
});

/**
 * POST /Rips/relacion-automatica-factura/ensure-install
 */
router.post('/Rips/relacion-automatica-factura/ensure-install', async (req, res) => {
    try {
        const result = await ensureRelacionAutomaticaInstall();
        return res.json(result);
    } catch (err) {
        const e = mapSqlErr(err);
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || 'RELACION_AUTO_INSTALL_ERROR',
        });
    }
});

router.get('/Rips/relacion-automatica-factura', async (req, res) => {
    try {
        const { poolPromise } = require('../db2');
        const pool = await poolPromise;
        if (!(await configTableExists(pool))) {
            const e = mapSqlErr(new Error('Invalid object name ConfigRelacionAutomaticaRipsFactura'));
            return res.status(e.status).json({
                ok: false,
                error: e.message,
                code: e.code,
            });
        }
        await ensureConfigRow(pool);
        const result = await pool.request().query(`
            SELECT TOP 1
                CAST(ISNULL(Activo, 0) AS BIT) AS activo,
                FechaActualizacion AS fechaActualizacion
            FROM dbo.ConfigRelacionAutomaticaRipsFactura
            WHERE Id = 1
        `);
        const row = result.recordset && result.recordset[0];
        return res.json({
            ok: true,
            activo: Boolean(row && row.activo),
            fechaActualizacion: row ? row.fechaActualizacion : null,
        });
    } catch (err) {
        const e = mapSqlErr(err);
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code,
        });
    }
});

router.put('/Rips/relacion-automatica-factura', async (req, res) => {
    try {
        const body = req.body || {};
        const activoRaw = body.activo ?? body.Activo;
        if (activoRaw === undefined || activoRaw === null) {
            return res.status(400).json({ ok: false, error: 'activo (boolean) es requerido' });
        }
        const activo = ['1', 'true', 'yes', 'on', true, 1].includes(
            typeof activoRaw === 'string' ? activoRaw.trim().toLowerCase() : activoRaw
        );

        const { sql, poolPromise } = require('../db2');
        const pool = await poolPromise;
        if (!(await configTableExists(pool))) {
            const e = mapSqlErr(new Error('Invalid object name ConfigRelacionAutomaticaRipsFactura'));
            return res.status(e.status).json({
                ok: false,
                error: e.message,
                code: e.code,
            });
        }
        await ensureConfigRow(pool);
        await pool
            .request()
            .input('Activo', sql.Bit, activo ? 1 : 0)
            .query(`
                UPDATE dbo.ConfigRelacionAutomaticaRipsFactura
                SET Activo = @Activo,
                    FechaActualizacion = SYSUTCDATETIME()
                WHERE Id = 1;

                IF @@ROWCOUNT = 0
                    INSERT INTO dbo.ConfigRelacionAutomaticaRipsFactura (Id, Activo)
                    VALUES (1, @Activo);
            `);

        return res.json({
            ok: true,
            activo,
            message: activo
                ? 'Relación automática RIPS↔Factura ACTIVADA'
                : 'Relación automática RIPS↔Factura DESACTIVADA',
        });
    } catch (err) {
        const e = mapSqlErr(err);
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code,
        });
    }
});

module.exports = router;

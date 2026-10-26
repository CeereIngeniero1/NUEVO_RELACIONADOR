'use strict';

/**
 * Relación automática RIPS ↔ Factura (por SP + scheduler).
 * GET/PUT /apiV3/Rips/relacion-automatica-factura
 * POST .../ensure-install | .../ejecutar-ahora
 */
const fs = require('fs');
const path = require('path');
const Router = require('express').Router;
const router = Router();
const { ejecutarLote } = require('../jobs/relacionAutoRipsFacturaScheduler');

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

async function ensureConfigColumns(pool) {
    await pool.request().batch(`
IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'IntervaloMinutos') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura
        ADD IntervaloMinutos INT NOT NULL CONSTRAINT DF_ConfigRelacionAuto_Intervalo_rt DEFAULT (30);
IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'TopLote') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura
        ADD TopLote INT NOT NULL CONSTRAINT DF_ConfigRelacionAuto_TopLote_rt DEFAULT (50);
IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'UltimaEjecucion') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura ADD UltimaEjecucion DATETIME2 NULL;
IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'UltimoRelacionados') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura ADD UltimoRelacionados INT NULL;
IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'UltimoMensaje') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura ADD UltimoMensaje NVARCHAR(200) NULL;
`);
}

async function ensureConfigRow(pool) {
    await ensureConfigColumns(pool);
    await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.ConfigRelacionAutomaticaRipsFactura WHERE Id = 1)
            INSERT INTO dbo.ConfigRelacionAutomaticaRipsFactura (Id, Activo, IntervaloMinutos, TopLote)
            VALUES (1, 0, 30, 50);
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

async function runSqlFileBatches(pool, sqlPath) {
    if (!fs.existsSync(sqlPath)) {
        const err = new Error(`No se encontró el instalador: ${sqlPath}`);
        err.code = 'RELACION_AUTO_SQL_NO_ENCONTRADO';
        err.status = 500;
        throw err;
    }
    const raw = fs.readFileSync(sqlPath, 'utf8');
    const batches = raw
        .split(/^\s*GO\s*$/gim)
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

    let executed = 0;
    for (const batch of batches) {
        const withoutComments = batch
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/--.*$/gm, '')
            .trim();
        if (!withoutComments) continue;
        await pool.request().batch(batch);
        executed += 1;
    }
    return executed;
}

async function ensureRelacionAutomaticaInstall() {
    const { poolPromise } = require('../db2');
    const pool = await poolPromise;
    const sqlDir = path.join(__dirname, '..', '..', 'SQL', '2275');
    const pathCopago = path.join(sqlDir, '23. Factura_Copago_No_Salud.sql');
    const pathRelacion = path.join(sqlDir, '20. Relacion_Automatica_Rips_Factura.sql');

    const existed = await configTableExists(pool);
    let executed = 0;
    // Primero exclusiones de copago (vista usada por el SP y listados)
    executed += await runSqlFileBatches(pool, pathCopago);
    executed += await runSqlFileBatches(pool, pathRelacion);

    await ensureConfigRow(pool);
    const objs = await pool.request().query(`
        SELECT
            CASE WHEN OBJECT_ID(N'dbo.usp_RelacionAutomatica_RipsFactura', N'P') IS NOT NULL
                THEN 1 ELSE 0 END AS spOk,
            CASE WHEN OBJECT_ID(N'dbo.TR_RelacionAuto_Factura_Anulada', N'TR') IS NOT NULL
                THEN 1 ELSE 0 END AS triggerAnulaOk,
            CASE WHEN OBJECT_ID(N'dbo.VwFacturasCopagoNoSalud', N'V') IS NOT NULL
                THEN 1 ELSE 0 END AS vwCopagoOk
    `);
    const row = objs.recordset?.[0] || {};

    return {
        ok: true,
        created: !existed,
        alreadyExisted: existed,
        batchesExecuted: executed,
        spInstalled: Number(row.spOk) === 1,
        triggerAnulacion: Number(row.triggerAnulaOk) === 1,
        vwCopago: Number(row.vwCopagoOk) === 1,
        message: existed
            ? 'Instalación verificada (SP + exclusión copago). Switch OFF hasta que lo active.'
            : 'Relación automática instalada (SP + exclusión copago). Switch OFF; actívelo cuando quiera.',
    };
}

router.get('/Rips/relacion-automatica-factura/ping', (req, res) => {
    res.json({
        ok: true,
        service: 'relacion-automatica-rips-factura',
        mode: 'sp-lote',
        version: '2026-10-26',
    });
});

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

router.post('/Rips/relacion-automatica-factura/ejecutar-ahora', async (req, res) => {
    try {
        const { poolPromise } = require('../db2');
        const pool = await poolPromise;
        if (!(await configTableExists(pool))) {
            const e = mapSqlErr(new Error('Invalid object name ConfigRelacionAutomaticaRipsFactura'));
            return res.status(e.status).json({ ok: false, error: e.message, code: e.code });
        }
        const top = req.body && req.body.top != null ? Number(req.body.top) : null;
        const out = await ejecutarLote({ forzar: true, top });
        return res.json({
            ok: true,
            ...out,
            message: `Relacionados: ${out.relacionados || 0}. ${out.mensaje || ''}`.trim(),
        });
    } catch (err) {
        const e = mapSqlErr(err);
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || 'RELACION_AUTO_EJECUTAR_ERROR',
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
                FechaActualizacion AS fechaActualizacion,
                ISNULL(IntervaloMinutos, 30) AS intervaloMinutos,
                ISNULL(TopLote, 50) AS topLote,
                UltimaEjecucion AS ultimaEjecucion,
                UltimoRelacionados AS ultimoRelacionados,
                UltimoMensaje AS ultimoMensaje,
                CASE WHEN OBJECT_ID(N'dbo.usp_RelacionAutomatica_RipsFactura', N'P') IS NOT NULL
                    THEN 1 ELSE 0 END AS spInstalado
            FROM dbo.ConfigRelacionAutomaticaRipsFactura
            WHERE Id = 1
        `);
        const row = result.recordset && result.recordset[0];
        return res.json({
            ok: true,
            activo: Boolean(row && row.activo),
            fechaActualizacion: row ? row.fechaActualizacion : null,
            intervaloMinutos: row ? Number(row.intervaloMinutos) || 30 : 30,
            topLote: row ? Number(row.topLote) || 50 : 50,
            ultimaEjecucion: row ? row.ultimaEjecucion : null,
            ultimoRelacionados: row && row.ultimoRelacionados != null
                ? Number(row.ultimoRelacionados)
                : null,
            ultimoMensaje: row ? row.ultimoMensaje : null,
            spInstalado: Boolean(row && Number(row.spInstalado) === 1),
            modo: 'sp-lote',
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

        let intervalo = body.intervaloMinutos != null ? Number(body.intervaloMinutos) : null;
        let topLote = body.topLote != null ? Number(body.topLote) : null;
        if (intervalo != null) {
            if (!Number.isFinite(intervalo) || intervalo < 5) intervalo = 30;
            if (intervalo > 1440) intervalo = 1440;
        }
        if (topLote != null) {
            if (!Number.isFinite(topLote) || topLote < 1) topLote = 50;
            if (topLote > 500) topLote = 500;
        }

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

        const reqSql = pool.request().input('Activo', sql.Bit, activo ? 1 : 0);
        if (intervalo != null) reqSql.input('Intervalo', sql.Int, intervalo);
        if (topLote != null) reqSql.input('TopLote', sql.Int, topLote);

        await reqSql.query(`
            UPDATE dbo.ConfigRelacionAutomaticaRipsFactura
            SET Activo = @Activo,
                FechaActualizacion = SYSUTCDATETIME()
                ${intervalo != null ? ', IntervaloMinutos = @Intervalo' : ''}
                ${topLote != null ? ', TopLote = @TopLote' : ''}
            WHERE Id = 1;

            IF @@ROWCOUNT = 0
                INSERT INTO dbo.ConfigRelacionAutomaticaRipsFactura (Id, Activo, IntervaloMinutos, TopLote)
                VALUES (
                    1,
                    @Activo,
                    ${intervalo != null ? '@Intervalo' : '30'},
                    ${topLote != null ? '@TopLote' : '50'}
                );
        `);

        return res.json({
            ok: true,
            activo,
            intervaloMinutos: intervalo,
            topLote,
            message: activo
                ? 'Relación automática ACTIVADA (lote cada IntervaloMinutos vía SP)'
                : 'Relación automática DESACTIVADA',
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

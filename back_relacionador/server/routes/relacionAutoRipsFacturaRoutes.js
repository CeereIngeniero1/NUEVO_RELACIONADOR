'use strict';

/**
 * Switch relación automática RIPS ↔ Factura.
 * GET/PUT /apiV3/Rips/relacion-automatica-factura
 */
const Router = require('express').Router;
const router = Router();

function mapSqlErr(err) {
    const msg = String(err && (err.message || err) || '');
    if (/Invalid object name|nombre de objeto.*ConfigRelacionAutomaticaRipsFactura|ConfigRelacionAutomaticaRipsFactura.*no es v[aá]lido/i.test(msg)) {
        const e = new Error(
            'No existe la tabla ConfigRelacionAutomaticaRipsFactura. '
            + 'Ejecute SQL/2275/20. Relacion_Automatica_Rips_Factura.sql en esta BD.'
        );
        e.code = 'RELACION_AUTO_TABLA_AUSENTE';
        e.status = 409;
        return e;
    }
    return err;
}

async function ensureConfigRow(pool, sql) {
    await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.ConfigRelacionAutomaticaRipsFactura WHERE Id = 1)
            INSERT INTO dbo.ConfigRelacionAutomaticaRipsFactura (Id, Activo) VALUES (1, 0);
    `);
}

router.get('/Rips/relacion-automatica-factura', async (req, res) => {
    try {
        const { sql, poolPromise } = require('../db2');
        const pool = await poolPromise;
        await ensureConfigRow(pool, sql);
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
        await ensureConfigRow(pool, sql);
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

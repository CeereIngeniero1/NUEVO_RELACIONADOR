'use strict';

/**
 * Llama usp_RelacionAutomatica_RipsFactura periódicamente si Activo=1.
 * Intervalo leído de Config.IntervaloMinutos (default 30). Top del SP.
 */

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
const MIN_INTERVAL_MS = 5 * 60 * 1000;
const MAX_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 45 * 1000;

let timer = null;
let running = false;
let started = false;

async function ejecutarLote(opts = {}) {
    const forzar = Boolean(opts.forzar);
    const { sql, poolPromise } = require('../db2');
    const pool = await poolPromise;

    const exists = await pool.request().query(`
        SELECT CASE WHEN OBJECT_ID(N'dbo.usp_RelacionAutomatica_RipsFactura', N'P') IS NOT NULL
            THEN 1 ELSE 0 END AS ok
    `);
    if (Number(exists.recordset?.[0]?.ok) !== 1) {
        return {
            ok: false,
            skipped: true,
            message: 'SP usp_RelacionAutomatica_RipsFactura no instalado',
        };
    }

    const topVal =
        opts.top != null && Number.isFinite(Number(opts.top))
            ? Math.min(500, Math.max(1, Number(opts.top)))
            : null;

    const result = await pool
        .request()
        .input('Top', sql.Int, topVal)
        .input('Forzar', sql.Bit, forzar ? 1 : 0)
        .query(`
            EXEC dbo.usp_RelacionAutomatica_RipsFactura
                @Top = @Top,
                @Forzar = @Forzar;
        `);
    const row = (result.recordset && result.recordset[0]) || {};
    return {
        ok: true,
        relacionados: Number(row.Relacionados) || 0,
        mensaje: row.Mensaje || null,
        activo: Boolean(row.Activo),
        topUsado: row.TopUsado != null ? Number(row.TopUsado) : null,
    };
}

async function tick() {
    if (running) return;
    running = true;
    try {
        const out = await ejecutarLote({ forzar: false });
        if (out.skipped) {
            console.log('[relacion-auto] tick omitido:', out.message);
        } else if (out.mensaje === 'Desactivado') {
            // silencioso cuando está off
        } else {
            console.log(
                `[relacion-auto] lote: ${out.relacionados} relacionados (${out.mensaje || 'OK'})`
            );
        }
    } catch (err) {
        console.error('[relacion-auto] error en lote:', err && (err.message || err));
    } finally {
        running = false;
        scheduleNext();
    }
}

async function resolveIntervalMs() {
    try {
        const { poolPromise } = require('../db2');
        const pool = await poolPromise;
        const r = await pool.request().query(`
            IF OBJECT_ID(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'U') IS NULL
                SELECT CAST(30 AS INT) AS minutos;
            ELSE
                SELECT TOP 1 CAST(ISNULL(IntervaloMinutos, 30) AS INT) AS minutos
                FROM dbo.ConfigRelacionAutomaticaRipsFactura WHERE Id = 1;
        `);
        let m = Number(r.recordset?.[0]?.minutos);
        if (!Number.isFinite(m) || m < 5) m = 30;
        if (m > 1440) m = 1440;
        return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, m * 60 * 1000));
    } catch (_) {
        return DEFAULT_INTERVAL_MS;
    }
}

function scheduleNext() {
    if (timer) clearTimeout(timer);
    resolveIntervalMs()
        .then((ms) => {
            timer = setTimeout(tick, ms);
            timer.unref?.();
        })
        .catch(() => {
            timer = setTimeout(tick, DEFAULT_INTERVAL_MS);
            timer.unref?.();
        });
}

function startRelacionAutoScheduler() {
    if (started) return;
    started = true;
    console.log(
        '[relacion-auto] scheduler iniciado (lote SP cada IntervaloMinutos si Activo=1)'
    );
    timer = setTimeout(tick, FIRST_RUN_DELAY_MS);
    timer.unref?.();
}

function stopRelacionAutoScheduler() {
    if (timer) clearTimeout(timer);
    timer = null;
    started = false;
}

module.exports = {
    startRelacionAutoScheduler,
    stopRelacionAutoScheduler,
    ejecutarLote,
};

'use strict';

/**
 * Valida periodo de atención RDA (Encounter) alineado con IHCE:
 * inv-enc-period-valid-range → start/end <= now()
 *
 * @param {Date|string|null|undefined} inicio
 * @param {Date|string|null|undefined} fin
 * @param {{ graceMs?: number }} [opts]
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validatePeriodoAtencionNoFuturo(inicio, fin, opts) {
    const graceMs = opts && Number.isFinite(opts.graceMs) ? opts.graceMs : 60 * 1000;
    const nowMs = Date.now() + graceMs;

    const toMs = (v) => {
        if (v == null || v === '') return null;
        if (v instanceof Date) {
            const t = v.getTime();
            return Number.isNaN(t) ? NaN : t;
        }
        const d = new Date(v);
        const t = d.getTime();
        return Number.isNaN(t) ? NaN : t;
    };

    const tIni = toMs(inicio);
    const tFin = toMs(fin);

    if (tIni == null && tFin == null) return { ok: true };
    if (tIni != null && Number.isNaN(tIni)) {
        return { ok: false, error: 'Fecha/hora de inicio de atención no válida.' };
    }
    if (tFin != null && Number.isNaN(tFin)) {
        return { ok: false, error: 'Fecha/hora de fin de atención no válida.' };
    }
    if (tIni != null && tFin != null && tFin <= tIni) {
        return { ok: false, error: 'La hora de fin de atención debe ser posterior a la de inicio.' };
    }
    if ((tIni != null && tIni > nowMs) || (tFin != null && tFin > nowMs)) {
        return {
            ok: false,
            error:
                'La fecha y hora de atención (inicio y fin) no pueden ser futuras. ' +
                'IHCE rechaza el envío si el encuentro es mayor a la fecha/hora actual.',
        };
    }
    return { ok: true };
}

module.exports = {
    validatePeriodoAtencionNoFuturo,
};

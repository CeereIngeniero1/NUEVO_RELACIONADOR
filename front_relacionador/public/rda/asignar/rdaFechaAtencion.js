/**
 * @param {string} prefix "RDA_" o "RDACE_"
 */
function colombiaDateTimeNowSql() {
    const fp = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        hour12: false,
    }).formatToParts(new Date());
    const g = (t) => (fp.find((x) => x.type === t) || {}).value;
    return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}:${g('second')}`;
}

export function wireRdaFechaAtencionGlobal() {
    const g = window;
    g.rdaParseFechaHorasAtencion = function (prefix) {
        function normTime(t) {
            if (!t) return '';
            const s = String(t).trim();
            return s.length >= 5 ? s.slice(0, 5) : s;
        }
        const fecha = (document.getElementById(prefix + 'FechaAtencion') || {}).value;
        let hi = (document.getElementById(prefix + 'HoraInicioAtencion') || {}).value;
        let hf = (document.getElementById(prefix + 'HoraFinAtencion') || {}).value;
        const f = fecha ? String(fecha).trim() : '';
        hi = hi ? String(hi).trim() : '';
        hf = hf ? String(hf).trim() : '';
        const parts = (f ? 1 : 0) + (hi ? 1 : 0) + (hf ? 1 : 0);
        if (parts === 0) return { ok: true, inicio: null, fin: null };
        if (parts < 3) {
            return {
                ok: false,
                error: 'Indique la fecha de atención, hora de inicio y hora de fin, o deje los tres campos vacíos.',
            };
        }
        const t1 = normTime(hi);
        const t2 = normTime(hf);
        const inicioStr = `${f}T${t1}:00-05:00`;
        const finStr = `${f}T${t2}:00-05:00`;
        const d1 = new Date(inicioStr);
        const d2 = new Date(finStr);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            return { ok: false, error: 'Fecha u hora no válida.' };
        }
        if (d2 <= d1) {
            return { ok: false, error: 'La hora de fin debe ser posterior a la hora de inicio.' };
        }
        return { ok: true, inicio: inicioStr, fin: finStr };
    };

    window.colombiaDateTimeNowSql = colombiaDateTimeNowSql;
}

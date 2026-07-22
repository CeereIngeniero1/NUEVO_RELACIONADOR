/**
 * IHCE en pantalla Asignar — SweetAlert, envío y preview JSON (antes inline en Asignar_RIPS V3.html).
 */
import { authJsonHeaders } from '../api/httpClient.js';
import { urlEnviarIhce, bodyEnviarIhce, urlJsonEnviarPreview, bodyJsonEnviarPreview } from '../api/ihceRutasV2.js';

const RDA_IHCE_SWAL_LABEL_STYLE = 'color:rgba(241,245,249,0.78);';
const RDA_IHCE_SWAL_PANEL_STYLE =
    'max-height:220px;overflow:auto;text-align:left;font-size:0.875rem;' +
    'background:#1e293b;color:#f1f5f9;border:1px solid rgba(148,163,184,0.35);' +
    'border-radius:0.375rem;padding:0.65rem;line-height:1.45;';
const RDA_IHCE_SWAL_PRE_STYLE =
    'text-align:left;font-size:0.72rem;max-height:70vh;overflow:auto;white-space:pre-wrap;' +
    'background:#0f172a;color:#e2e8f0;border:1px solid rgba(148,163,184,0.25);' +
    'border-radius:0.35rem;padding:0.75rem;';

function ambienteBody(val) {
    const cfg = window.__APP_CONFIG__ || {};
    const forceSandboxOnly = cfg.IHCE_FORCE_SANDBOX_ONLY === true;
    const forceProdOnly = cfg.IHCE_FORCE_PROD_ONLY === true;
    if (forceProdOnly) return 'prod';
    if (forceSandboxOnly) return 'sandbox';
    return val === 'prod' ? 'prod' : 'sandbox';
}

function ihceForceSandboxOnlyUi() {
    const cfg = window.__APP_CONFIG__ || {};
    return cfg.IHCE_FORCE_SANDBOX_ONLY === true;
}
function ihceForceProdOnlyUi() {
    const cfg = window.__APP_CONFIG__ || {};
    return cfg.IHCE_FORCE_PROD_ONLY === true;
}

function ihceEnableSandboxUi() {
    const cfg = window.__APP_CONFIG__ || {};
    return cfg.IHCE_ENABLE_SANDBOX !== false;
}
function ihceEnableProdUi() {
    const cfg = window.__APP_CONFIG__ || {};
    return cfg.IHCE_ENABLE_PROD !== false;
}

function ihceAllowedAmbientesUi() {
    const forceSandboxUi = ihceForceSandboxOnlyUi();
    const forceProdUi = ihceForceProdOnlyUi();
    if (forceProdUi) return ['prod'];
    if (forceSandboxUi) return ['sandbox'];

    const allowed = [];
    if (ihceEnableProdUi()) allowed.push('prod');
    if (ihceEnableSandboxUi()) allowed.push('sandbox');
    // Fallback defensivo: si ambas quedan deshabilitadas por error de config, mantener prod.
    return allowed.length ? allowed : ['prod'];
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatIsoPeriod(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }) + ' (hora Colombia)';
}

function formatFechaSolo(isoOrDate) {
    if (!isoOrDate) return '—';
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
    if (isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleDateString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

function formatHoraSolo(isoOrDate) {
    if (!isoOrDate) return '—';
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
    if (isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleTimeString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }) + ' (hora Colombia)';
}

/** Periodo del formulario RDA (Paciente / Consulta Externa) en pantalla Asignar. */
function getFormEncounterPeriod() {
    const read = (ids) => {
        for (const id of ids) {
            const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
            const v = el && el.value != null ? String(el.value).trim() : '';
            if (v) return v;
        }
        return '';
    };
    const fecha = read(['RDACE_FechaAtencion', 'RDA_FechaAtencion']);
    const horaIni = read(['RDACE_HoraInicioAtencion', 'RDA_HoraInicioAtencion']);
    const horaFin = read(['RDACE_HoraFinAtencion', 'RDA_HoraFinAtencion']);
    if (!fecha && !horaIni && !horaFin) return null;

    let startIso = null;
    let endIso = null;
    if (fecha && horaIni) {
        const s = new Date(`${fecha}T${horaIni.length === 5 ? horaIni + ':00' : horaIni}`);
        if (!isNaN(s.getTime())) startIso = s.toISOString();
    }
    if (fecha && horaFin) {
        const e = new Date(`${fecha}T${horaFin.length === 5 ? horaFin + ':00' : horaFin}`);
        if (!isNaN(e.getTime())) endIso = e.toISOString();
    }
    return {
        fecha: fecha || null,
        horaInicio: horaIni || null,
        horaFin: horaFin || null,
        startIso,
        endIso,
    };
}

function formatPeriodBlock(periodsFromIhce, formPeriod) {
    const lines = [];
    if (periodsFromIhce && periodsFromIhce.length >= 2) {
        lines.push('Fecha y rango horario detectados por IHCE:');
        lines.push('• Fecha: ' + formatFechaSolo(periodsFromIhce[0]));
        lines.push('• Hora inicio: ' + formatHoraSolo(periodsFromIhce[0]));
        lines.push('• Hora fin: ' + formatHoraSolo(periodsFromIhce[1]));
        lines.push('• Inicio completo: ' + formatIsoPeriod(periodsFromIhce[0]));
        lines.push('• Fin completo: ' + formatIsoPeriod(periodsFromIhce[1]));
        return lines;
    }
    if (periodsFromIhce && periodsFromIhce.length === 1) {
        lines.push('Periodo detectado por IHCE: ' + formatIsoPeriod(periodsFromIhce[0]));
        return lines;
    }
    if (formPeriod && (formPeriod.fecha || formPeriod.horaInicio || formPeriod.horaFin)) {
        lines.push('Fecha y rango horario utilizados en el envío:');
        lines.push('• Fecha: ' + (formPeriod.fecha || '—'));
        lines.push('• Hora inicio: ' + (formPeriod.horaInicio || '—') + (formPeriod.horaInicio ? ' (hora Colombia)' : ''));
        lines.push('• Hora fin: ' + (formPeriod.horaFin || '—') + (formPeriod.horaFin ? ' (hora Colombia)' : ''));
        if (formPeriod.startIso || formPeriod.endIso) {
            lines.push('• Inicio completo: ' + formatIsoPeriod(formPeriod.startIso));
            lines.push('• Fin completo: ' + formatIsoPeriod(formPeriod.endIso));
        }
        return lines;
    }
    return lines;
}

function extractPeriodsFromText(text) {
    const periods = [];
    const re = /period='([^']+)'/gi;
    let m;
    while ((m = re.exec(String(text || ''))) !== null) {
        periods.push(m[1]);
    }
    return periods;
}

function issueToText(issue) {
    if (issue == null) return '';
    if (typeof issue === 'string') return issue.trim();
    if (typeof issue !== 'object') return String(issue).trim();
    if (issue.details && issue.details.text) return String(issue.details.text).trim();
    if (issue.diagnostics) return String(issue.diagnostics).trim();
    return '';
}

function issueSearchText(issue) {
    if (issue == null) return '';
    if (typeof issue === 'string') return issue.trim();
    if (typeof issue !== 'object') return String(issue).trim();
    return [
        issueToText(issue),
        issue.diagnostics,
        ...(Array.isArray(issue.location) ? issue.location : []),
        ...(Array.isArray(issue.expression) ? issue.expression : []),
        ...(issue.details && Array.isArray(issue.details.coding)
            ? issue.details.coding.map((c) => [c && c.system, c && c.code, c && c.display].filter(Boolean).join(' '))
            : []),
    ].filter(Boolean).join(' ');
}

/** IHCE: Composition ya existe para el mismo subject/period (historia duplicada). */
function parseDuplicateRdaHistoria(text) {
    const t = issueToText(text);
    if (!t || !/already exist/i.test(t) || !/Composition/i.test(t)) return null;

    const periods = extractPeriodsFromText(t);
    const lines = [
        'Ya se registró un RDA (historia clínica) para este paciente en ese horario o rango horario.',
        'No puede volverse a diligenciar ni enviarse nuevamente con el mismo periodo.',
        '',
        'El RDA queda guardado y se marca como NO reenviable (Enviado*=2); no aparecerá en pendientes.',
        '',
    ];
    const block = formatPeriodBlock(periods, getFormEncounterPeriod());
    if (block.length) lines.push(...block);
    else lines.push('Revise la fecha y las horas de inicio/fin de la atención en el formulario.');
    return lines.join('\n');
}

/** IHCE: Encounter ya existe para mismo paciente/fecha-hora (episodio duplicado). */
function parseDuplicateEncounter(text) {
    const t = issueToText(text);
    if (!t || !/Resource type\s+'Encounter'/i.test(t) || !/already exist/i.test(t)) return null;

    const periods = extractPeriodsFromText(t);
    const lines = [
        'Ya se registró un RDA (encuentro) para este paciente en ese horario o rango horario.',
        'Para enviar nuevamente, cambie la fecha/hora del encuentro o valide el registro existente en IHCE.',
        '',
        'El RDA queda guardado y se marca como NO reenviable (Enviado*=2); no aparecerá en pendientes.',
        '',
    ];
    const block = formatPeriodBlock(periods, getFormEncounterPeriod());
    if (block.length) lines.push(...block);
    else lines.push('Revise la fecha y las horas de inicio/fin de la atención en el formulario.');
    return lines.join('\n');
}

/**
 * IHCE: invariante de periodo (Composition/Encounter).
 * Incluye el caso de fechas futuras y deja el rango usado bien organizado.
 */
function parseEncounterPeriodRejected(issueOrText) {
    const t = issueSearchText(issueOrText);
    if (!t) return null;

    const isPeriodInvariant =
        /inv-enc-period-valid-range/i.test(t)
        || (/start\s*<=\s*now\(\)/i.test(t) && /end\s*<=\s*now\(\)/i.test(t))
        || /fecha del encuentro.*no puede ser mayor a la fecha actual/i.test(t)
        || (/start\.exists\(\)/i.test(t) && /end\.exists\(\)/i.test(t) && /start\s*<=\s*end/i.test(t));

    if (!isPeriodInvariant) return null;

    const periods = extractPeriodsFromText(t);
    const formPeriod = getFormEncounterPeriod();
    const lines = [
        'Ya se registró un RDA para este paciente en ese horario o rango horario,',
        'o el periodo enviado no es aceptado por IHCE para un nuevo envío.',
        '',
        'No puede enviarse nuevamente con la misma fecha y horas de atención.',
        '',
        'El RDA queda guardado en el Relacionador y se marca como NO reenviable',
        '(Enviado / Enviado pruebas = 2), por lo que no aparecerá en RDA pendientes.',
        '',
    ];
    const block = formatPeriodBlock(periods, formPeriod);
    if (block.length) {
        lines.push(...block);
    } else {
        lines.push('No se pudo leer el rango horario del formulario; revise Fecha / Hora inicio / Hora fin.');
    }
    lines.push('');
    lines.push('Detalle IHCE: La fecha del encuentro (inicio y fin) no puede ser mayor a la fecha actual,');
    lines.push('y el periodo debe ser válido (inicio ≤ fin). Ajuste el rango o verifique el RDA ya enviado.');
    return lines.join('\n');
}

/** IHCE: Patient.telecom inválido (cardinality 0..0 con valor no conforme). */
function parsePatientTelecomInvalid(text) {
    const t = String(text || '');
    if (!/Patient\.telecom/i.test(t)) return null;
    if (!/cardinality|0\.\.0|Instance count/i.test(t)) return null;
    return 'Falta el teléfono del paciente o el teléfono no es válido. '
        + 'Revise el campo Teléfono en Datos del paciente (celular colombiano de 10 dígitos, ejemplo: 3001234567).';
}

/** Texto legible completo a partir de la respuesta IHCE (OperationOutcome, Bundle, etc.). */
export function extractIhceMessage(data) {
    if (data == null) return '';
    if (typeof data === 'string') return data.trim();
    if (typeof data !== 'object') return String(data);

    const lines = [];

    if (typeof data.message === 'string' && data.message.trim()) lines.push(data.message.trim());
    if (typeof data.error === 'string' && data.error.trim()) lines.push(data.error.trim());
    if (typeof data.error_description === 'string' && data.error_description.trim()) {
        lines.push(data.error_description.trim());
    }

    const formatIssue = (i, idx) => {
        if (typeof i === 'string') {
            const telecomMsg = parsePatientTelecomInvalid(i);
            if (telecomMsg) return [telecomMsg];
            const periodMsg = parseEncounterPeriodRejected(i);
            if (periodMsg) return [periodMsg];
            const dup = parseDuplicateRdaHistoria(i);
            if (dup) return [dup];
            const dupEncounter = parseDuplicateEncounter(i);
            if (dupEncounter) return [dupEncounter];
            const t = i.trim();
            return t ? [t] : [];
        }
        if (!i || typeof i !== 'object') return [];
        const telecomObj = parsePatientTelecomInvalid(issueSearchText(i));
        if (telecomObj) return [telecomObj];
        const periodObj = parseEncounterPeriodRejected(i);
        if (periodObj) return [periodObj];
        const dupObj = parseDuplicateRdaHistoria(issueToText(i));
        if (dupObj) return [dupObj];
        const dupEncounterObj = parseDuplicateEncounter(issueToText(i));
        if (dupEncounterObj) return [dupEncounterObj];
        const out = [];
        const n = idx != null ? ` [${idx + 1}]` : '';
        if (i.severity) out.push(`severity${n}: ${i.severity}`);
        if (i.code) out.push(`code${n}: ${i.code}`);
        if (i.diagnostics) out.push(String(i.diagnostics));
        if (i.details && i.details.text) out.push(String(i.details.text));
        if (i.details && Array.isArray(i.details.coding)) {
            i.details.coding.forEach((c) => {
                if (!c) return;
                const parts = [c.system, c.code, c.display].filter(Boolean).join(' | ');
                if (parts) out.push(`coding${n}: ${parts}`);
            });
        }
        if (Array.isArray(i.location) && i.location.length) {
            out.push(`location${n}: ${i.location.join(', ')}`);
        }
        if (Array.isArray(i.expression) && i.expression.length) {
            out.push(`expression${n}: ${i.expression.join(', ')}`);
        }
        return out;
    };

    if (data.resourceType === 'OperationOutcome' && Array.isArray(data.issue)) {
        for (let idx = 0; idx < data.issue.length; idx++) {
            const telecomMsg = parsePatientTelecomInvalid(issueSearchText(data.issue[idx]));
            if (telecomMsg) return telecomMsg;
            const periodMsg = parseEncounterPeriodRejected(data.issue[idx]);
            if (periodMsg) return periodMsg;
            const dup = parseDuplicateRdaHistoria(data.issue[idx]);
            if (dup) return dup;
            const dupEncounter = parseDuplicateEncounter(data.issue[idx]);
            if (dupEncounter) return dupEncounter;
        }
        data.issue.forEach((i, idx) => {
            formatIssue(i, idx).forEach((l) => lines.push(l));
        });
    }

    if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
        const statuses = [];
        lines.push(
            `IHCE devolvió Bundle FHIR (${data.type ? 'tipo «' + data.type + '»' : 'sin tipo'}, ${data.entry.length} entrada(s)).`
        );
        data.entry.forEach((ent) => {
            if (ent && ent.response && ent.response.status) {
                statuses.push(String(ent.response.status).trim());
            }
            const res = ent && ent.resource;
            if (res && res.resourceType === 'OperationOutcome' && Array.isArray(res.issue)) {
                res.issue.forEach((i, idx) => {
                    formatIssue(i, idx).forEach((l) => lines.push(l));
                });
            }
        });
        if (statuses.length) {
            const okN = statuses.filter((s) => {
                const n = parseInt(s, 10);
                return n >= 200 && n < 400;
            }).length;
            lines.push(`HTTP por entry: ${statuses.join(', ')} (${okN}/${statuses.length} éxito)`);
        }
    }

    if (!lines.length && data.resourceType) {
        lines.push('IHCE respondió recurso FHIR tipo «' + data.resourceType + '».');
    }
    if (!lines.length && typeof data.raw === 'string' && data.raw.trim()) {
        return data.raw.trim();
    }

    const friendlyTelecom = parsePatientTelecomInvalid(lines.join('\n'));
    if (friendlyTelecom) return friendlyTelecom;

    return lines.join('\n');
}

/** Modal con la respuesta JSON cruda del Ministerio (IHCE). */
export function showIhceApiResponse(data, title) {
    const summary = extractIhceMessage(data);
    const jsonText = typeof data === 'string'
        ? data
        : JSON.stringify(data, null, 2);
    Swal.fire({
        icon: 'error',
        title: title || 'Respuesta IHCE (Ministerio)',
        width: 'min(95vw, 860px)',
        html:
            (summary
                ? '<p class="small text-start mb-2" style="' + RDA_IHCE_SWAL_LABEL_STYLE + '">Resumen legible:</p>' +
                  '<div style="' + RDA_IHCE_SWAL_PANEL_STYLE + 'max-height:280px;">' +
                  escapeHtml(summary).replace(/\n/g, '<br>') +
                  '</div>'
                : '') +
            '<p class="small text-start mt-3 mb-2" style="' + RDA_IHCE_SWAL_LABEL_STYLE + '">JSON completo de la API:</p>' +
            '<pre style="' + RDA_IHCE_SWAL_PRE_STYLE + '">' + escapeHtml(jsonText) + '</pre>' +
            '<p class="mt-2 mb-0 text-center"><button type="button" class="btn btn-sm btn-outline-light" id="rda-ihce-btn-copy-resp">Copiar JSON</button></p>',
        confirmButtonText: 'Cerrar',
        didOpen: function (popup) {
            const b = popup.querySelector('#rda-ihce-btn-copy-resp');
            if (!b) return;
            b.addEventListener('click', function () {
                const copy = (navigator.clipboard && navigator.clipboard.writeText)
                    ? navigator.clipboard.writeText(jsonText)
                    : Promise.reject(new Error('Clipboard no disponible'));
                copy.then(function () {
                    Swal.showValidationMessage('JSON copiado.');
                    setTimeout(function () { Swal.resetValidationMessage(); }, 900);
                }).catch(function () {
                    Swal.showValidationMessage('No se pudo copiar.');
                });
            });
        },
    });
}

function openJsonModal(title, jsonText, width) {
    Swal.fire({
        title: title,
        html:
            '<pre style="' + RDA_IHCE_SWAL_PRE_STYLE + '">' + escapeHtml(jsonText) + '</pre>' +
            '<p class="mt-3 mb-0 text-center"><button type="button" class="btn btn-sm btn-outline-light" id="rda-ihce-btn-copy-json">Copiar al portapapeles</button></p>',
        width: width || 'min(95vw, 760px)',
        confirmButtonText: 'Cerrar',
        didOpen: function (popup) {
            const b = popup.querySelector('#rda-ihce-btn-copy-json');
            if (!b) return;
            b.addEventListener('click', function () {
                const txt = String(jsonText || '');
                const copy = (navigator.clipboard && navigator.clipboard.writeText)
                    ? navigator.clipboard.writeText(txt)
                    : Promise.reject(new Error('Clipboard API no disponible'));
                copy.then(function () {
                    Swal.showValidationMessage('Copiado al portapapeles.');
                    setTimeout(function () { Swal.resetValidationMessage(); }, 900);
                }).catch(function () {
                    Swal.showValidationMessage('No se pudo copiar automáticamente.');
                });
            });
        },
    });
}

/** Abre modal con el Bundle/JSON que se enviaría (o se envió) a IHCE. */
export function openIhceBundlePreview(kind, id, ambienteUi) {
    const amb = ambienteUi === 'prod' ? 'prod' : 'sandbox';
    const k = kind === 'rdace' ? 'rdace' : 'paciente';
    const url = urlJsonEnviarPreview(k);
    const body = JSON.stringify(bodyJsonEnviarPreview(k, id, amb));
    Swal.fire({
        title: 'Cargando JSON enviado…',
        allowOutsideClick: false,
        didOpen: function () {
            Swal.showLoading();
        },
    });
    fetch(url, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: body,
    })
        .then(function (r) {
            return r.text().then(function (t) {
                return {
                    ok: r.ok,
                    status: r.status,
                    text: t,
                    validationWarning: r.headers.get('X-RDA-Validation-Warning'),
                };
            });
        })
        .then(function (out) {
            let parsed;
            try {
                parsed = JSON.parse(out.text);
            } catch (e) {
                parsed = { raw: out.text };
            }
            if (parsed && parsed.ok === false && parsed.error) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No se pudo generar el JSON',
                    text: parsed.error,
                });
                return;
            }
            const warn = out.validationWarning;
            const jsonText = JSON.stringify(parsed, null, 2);
            openJsonModal(
                warn ? 'JSON generado para envío IHCE (con advertencias)' : 'JSON generado para envío IHCE',
                warn ? `/* Advertencia: ${warn} */\n\n${jsonText}` : jsonText,
                'min(95vw, 860px)'
            );
        })
        .catch(function (err) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo cargar el JSON enviado',
                text: err.message || String(err),
            });
        });
}

/** Modal JSON legible (enviado o respuesta IHCE). */
export function openIhceJsonModal(title, dataOrText, width) {
    const jsonText = typeof dataOrText === 'string'
        ? dataOrText
        : JSON.stringify(dataOrText, null, 2);
    openJsonModal(title, jsonText, width || 'min(95vw, 760px)');
}

/**
 * @param {Response} resp
 * @param {object} data
 * @param {'sandbox'|'prod'} ambienteUi
 * @param {{ id: number, kind: 'paciente'|'rdace' }|null} bundleCtx
 */
export function swalRespuestaIhce(resp, data, ambienteUi, bundleCtx) {
    const prettyJson = JSON.stringify(data, null, 2);
    const isSandbox = ambienteUi !== 'prod';
    const amb = ambienteUi === 'prod' ? 'prod' : 'sandbox';

    function showJsonRespuesta() {
        openJsonModal('Respuesta IHCE (JSON)', prettyJson, 'min(95vw, 760px)');
    }

    function showJsonEnviado() {
        if (!bundleCtx || bundleCtx.id == null) return;
        openIhceBundlePreview(bundleCtx.kind === 'rdace' ? 'rdace' : 'paciente', bundleCtx.id, amb);
    }

    if (isSandbox) {
        let msg = extractIhceMessage(data);
        const historiaDuplicada = Boolean(msg && /Ya se registró un RDA|ya fue registrada en IHCE/i.test(msg));
        if (!msg) {
            msg = resp.ok
                ? 'El envío a IHCE (sandbox) finalizó correctamente. Use los botones de abajo para ver JSON de respuesta o el Bundle enviado.'
                : 'IHCE respondió con error HTTP ' + resp.status + '. Use «Ver JSON de la respuesta» para el detalle técnico.';
        }
        const icon = resp.ok ? 'success' : (historiaDuplicada ? 'warning' : 'error');
        const bundleBtnHtml =
            bundleCtx && bundleCtx.id != null
                ? '<div class="mt-3 mb-0 text-center d-flex flex-column gap-2">' +
                  '<button type="button" class="btn btn-sm btn-outline-light" id="rda-ihce-btn-json-enviado">Ver JSON enviado</button>' +
                  '<button type="button" class="btn btn-sm btn-outline-light" id="rda-ihce-btn-bundle-fhir">Ver Bundle FHIR enviado</button>' +
                  '</div>'
                : '';
        Swal.fire({
            icon: icon,
            title: resp.ok
                ? 'IHCE — Sandbox'
                : (historiaDuplicada ? 'IHCE — RDA ya registrado / periodo no válido' : 'IHCE — Sandbox (error)'),
            html:
                '<p class="small text-start mb-2" style="' + RDA_IHCE_SWAL_LABEL_STYLE + '">Resumen de la respuesta (IHCE / FHIR):</p>' +
                '<div style="' + RDA_IHCE_SWAL_PANEL_STYLE + '">' +
                escapeHtml(msg).replace(/\n/g, '<br>') +
                '</div>' +
                bundleBtnHtml,
            confirmButtonText: 'Cerrar',
            showDenyButton: true,
            denyButtonText: 'Ver JSON de la respuesta',
            denyButtonColor: '#6c757d',
            didOpen: function (popup) {
                const jb = popup.querySelector('#rda-ihce-btn-json-enviado');
                if (jb && bundleCtx) {
                    jb.addEventListener('click', function () {
                        showJsonEnviado();
                    });
                }
                const b = popup.querySelector('#rda-ihce-btn-bundle-fhir');
                if (!b || !bundleCtx) return;
                b.addEventListener('click', function () {
                    const kind2 = bundleCtx.kind === 'rdace' ? 'rdace' : 'paciente';
                    const url2 = urlJsonEnviarPreview(kind2);
                    const body2 = JSON.stringify(bodyJsonEnviarPreview(kind2, bundleCtx.id, amb));
                    Swal.fire({
                        title: 'Cargando Bundle…',
                        allowOutsideClick: false,
                        didOpen: function () {
                            Swal.showLoading();
                        },
                    });
                    fetch(url2, {
                        method: 'POST',
                        headers: authJsonHeaders(),
                        body: body2,
                    })
                        .then(function (r) {
                            return r.text().then(function (t) {
                                return {
                                    ok: r.ok,
                                    status: r.status,
                                    text: t,
                                    validationWarning: r.headers.get('X-RDA-Validation-Warning'),
                                };
                            });
                        })
                        .then(function (out) {
                            let parsed;
                            try {
                                parsed = JSON.parse(out.text);
                            } catch (e) {
                                parsed = { raw: out.text };
                            }
                            if (parsed && parsed.ok === false && parsed.error) {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'No se pudo generar el JSON',
                                    text: parsed.error,
                                });
                                return;
                            }
                            const warn = out.validationWarning;
                            const bundleStr = JSON.stringify(parsed, null, 2);
                            openJsonModal(
                                warn ? 'Bundle FHIR generado (con advertencias)' : 'Bundle FHIR generado (mismo que se envió)',
                                warn ? `/* Advertencia: ${warn} */\n\n${bundleStr}` : bundleStr,
                                'min(95vw, 860px)'
                            );
                        })
                        .catch(function (err) {
                            Swal.fire({
                                icon: 'error',
                                title: 'No se pudo cargar el Bundle',
                                text: err.message || String(err),
                            });
                        });
                });
            },
        }).then(function (r) {
            if (r.isDenied) {
                showJsonRespuesta();
            }
        });
        return;
    }

    const msgProd = extractIhceMessage(data) || (resp.ok
        ? 'Envío a IHCE (producción) finalizado.'
        : 'IHCE respondió con error HTTP ' + resp.status + '.');
    const historiaDuplicadaProd = Boolean(msgProd && /Ya se registró un RDA|ya fue registrada en IHCE/i.test(msgProd));
    const jsonBtnProdHtml =
        bundleCtx && bundleCtx.id != null
            ? '<p class="mt-3 mb-0 text-center"><button type="button" class="btn btn-sm btn-outline-light" id="rda-ihce-btn-json-enviado">Ver JSON enviado</button></p>'
            : '';
    Swal.fire({
        icon: resp.ok ? 'success' : (historiaDuplicadaProd ? 'warning' : 'error'),
        title: resp.ok
            ? 'IHCE — Producción'
            : (historiaDuplicadaProd ? 'IHCE — RDA ya registrado / periodo no válido' : 'IHCE — Producción (error)'),
        html:
            '<p class="small text-start mb-2" style="' + RDA_IHCE_SWAL_LABEL_STYLE + '">Resumen de la respuesta (IHCE / FHIR):</p>' +
            '<div style="' + RDA_IHCE_SWAL_PANEL_STYLE + '">' +
            escapeHtml(msgProd).replace(/\n/g, '<br>') +
            '</div>' +
            jsonBtnProdHtml,
        confirmButtonText: 'Cerrar',
        showDenyButton: true,
        denyButtonText: 'Ver JSON de la respuesta',
        denyButtonColor: '#6c757d',
        didOpen: function (popup) {
            const jb = popup.querySelector('#rda-ihce-btn-json-enviado');
            if (jb && bundleCtx) {
                jb.addEventListener('click', function () {
                    showJsonEnviado();
                });
            }
        },
    }).then(function (r) {
        if (r.isDenied) {
            showJsonRespuesta();
        }
    });
}

export async function enviarIhceRdace(id, opts) {
    opts = opts || {};
    const ambiente = ambienteBody(opts.ambiente || 'sandbox');
    const btn = opts.manageButton || null;
    const showSwal = opts.showSwal !== false;
    const textoOrig = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Enviando...';
    }
    try {
        const url = urlEnviarIhce('rdace', ambiente);
        const body = bodyEnviarIhce('rdace', id, ambiente);
        const resp = await fetch(url, {
            method: 'POST',
            headers: authJsonHeaders(),
            body: JSON.stringify(body),
        });
        const texto = await resp.text();
        let data = {};
        try { data = JSON.parse(texto); } catch (e) { data = { raw: texto }; }
        if (showSwal) {
            swalRespuestaIhce(resp, data, ambiente, { id: id, kind: 'rdace' });
        }
        return { ok: resp.ok, status: resp.status, data: data };
    } catch (err) {
        if (showSwal) {
            Swal.fire({ icon: 'error', title: 'Error de red', text: err.message });
        }
        throw err;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = textoOrig;
        }
    }
}

export async function enviarIhcePaciente(id, opts) {
    opts = opts || {};
    const ambiente = ambienteBody(opts.ambiente || 'sandbox');
    const btn = opts.manageButton || null;
    const showSwal = opts.showSwal !== false;
    const textoOrig = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Enviando...';
    }
    try {
        const url = urlEnviarIhce('paciente', ambiente);
        const body = bodyEnviarIhce('paciente', id, ambiente);
        const resp = await fetch(url, {
            method: 'POST',
            headers: authJsonHeaders(),
            body: JSON.stringify(body),
        });
        const texto = await resp.text();
        let data = {};
        try { data = JSON.parse(texto); } catch (e) { data = { raw: texto }; }
        if (showSwal) {
            swalRespuestaIhce(resp, data, ambiente, { id: id, kind: 'paciente' });
        }
        return { ok: resp.ok, status: resp.status, data: data };
    } catch (err) {
        if (showSwal) {
            Swal.fire({ icon: 'error', title: 'Error de red', text: err.message });
        }
        throw err;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = textoOrig;
        }
    }
}

export function rdaOfrecerEnvioIhce(titulo, htmlResumen, enviarFn) {
    const allowed = ihceAllowedAmbientesUi();
    const defaultAmb = allowed.includes('prod') ? 'prod' : 'sandbox';
    const radiosHtml = allowed
        .map((amb) => {
            const checked = amb === defaultAmb ? ' checked' : '';
            const label = amb === 'prod' ? 'Producción' : 'Sandbox (pruebas)';
            return '<label class="d-block"><input type="radio" name="swalRdaAmbIhce" value="' + amb + '"' + checked + '> ' + label + '</label>';
        })
        .join('');
    return Swal.fire({
        icon: 'success',
        title: titulo,
        html:
            '<div class="text-start">' + htmlResumen + '</div>' +
            '<hr class="my-2">' +
            '<p class="small text-muted mb-2">¿Desea enviar este documento al Ministerio (IHCE) ahora?</p>' +
            '<div class="text-start">' +
            radiosHtml +
            '</div>',
        showDenyButton: true,
        denyButtonText: 'Solo cerrar',
        confirmButtonText: 'Enviar a Ministerio (IHCE)',
        preConfirm: function () {
            const el = Swal.getPopup().querySelector('input[name="swalRdaAmbIhce"]:checked');
            return el ? el.value : defaultAmb;
        },
    }).then(function (result) {
        if (result.isConfirmed) {
            const raw = result.value;
            const amb = raw === 'prod' ? 'prod' : 'sandbox';
            return enviarFn(amb);
        }
    });
}

/**
 * Registra en window las funciones que esperan los handlers de guardado y otras partes.
 */
export function initIhceAsignarWindow() {
    const w = window;
    w.enviarIhceRdace = enviarIhceRdace;
    w.enviarIhcePaciente = enviarIhcePaciente;
    w.rdaOfrecerEnvioIhce = rdaOfrecerEnvioIhce;
}

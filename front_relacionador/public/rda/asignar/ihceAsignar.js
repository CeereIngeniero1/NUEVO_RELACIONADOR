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

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Texto legible a partir de la respuesta IHCE (misma lógica que el HTML original, compacta en ramas frecuentes). */
function extractIhceMessage(data) {
    if (data == null) return '';
    if (typeof data === 'string') return data.trim();
    if (typeof data !== 'object') return String(data);
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
    if (typeof data.error_description === 'string' && data.error_description.trim()) {
        return data.error_description.trim();
    }
    if (data.resourceType === 'OperationOutcome' && Array.isArray(data.issue)) {
        const parts = data.issue.map((i) => {
            if (!i) return '';
            if (i.diagnostics) return String(i.diagnostics);
            if (i.details && i.details.text) return String(i.details.text);
            return '';
        }).filter(Boolean);
        if (parts.length) return parts.join('\n');
    }
    if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
        const outcomes = [];
        const statuses = [];
        data.entry.forEach((ent) => {
            if (ent && ent.response && ent.response.status) {
                statuses.push(String(ent.response.status).trim());
            }
            const res = ent && ent.resource;
            if (res && res.resourceType === 'OperationOutcome' && Array.isArray(res.issue)) {
                res.issue.forEach((i) => {
                    const txt = (i.diagnostics) || (i.details && i.details.text) || '';
                    if (txt) outcomes.push(String(txt));
                });
            }
        });
        const lines = [];
        lines.push(
            `IHCE devolvió un Bundle FHIR (${data.type ? 'tipo «' + data.type + '»' : 'sin tipo'}, ${data.entry.length} entrada(s)).`
        );
        if (statuses.length) {
            const okN = statuses.filter((s) => {
                const n = parseInt(s, 10);
                return n >= 200 && n < 400;
            }).length;
            lines.push(`Estados: ${statuses.slice(0, 14).join(', ')}${statuses.length > 14 ? '…' : ''} → ${okN}/${statuses.length} éxito.`);
        }
        if (outcomes.length) {
            lines.push('OperationOutcome:');
            outcomes.forEach((o) => lines.push('• ' + o));
        }
        return lines.join('\n');
    }
    if (data.resourceType) {
        return 'IHCE respondió con recurso FHIR tipo «' + data.resourceType + '».';
    }
    if (typeof data.raw === 'string' && data.raw.trim()) return data.raw.trim().slice(0, 4000);
    return '';
}

/**
 * @param {Response} resp
 * @param {object} data
 * @param {'sandbox'|'prod'} ambienteUi
 * @param {{ id: number, kind: 'paciente'|'rdace' }|null} bundleCtx
 */
function swalRespuestaIhce(resp, data, ambienteUi, bundleCtx) {
    const prettyJson = JSON.stringify(data, null, 2);
    const isSandbox = ambienteUi !== 'prod';
    const amb = ambienteUi === 'prod' ? 'prod' : 'sandbox';

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

    function showJsonRespuesta() {
        openJsonModal('Respuesta IHCE (JSON)', prettyJson, 'min(95vw, 760px)');
    }

    function showJsonEnviado() {
        if (!bundleCtx || bundleCtx.id == null) return;
        const kind = bundleCtx.kind === 'rdace' ? 'rdace' : 'paciente';
        const url = urlJsonEnviarPreview(kind);
        const body = JSON.stringify(bodyJsonEnviarPreview(kind, bundleCtx.id, amb));
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
                    return { ok: r.ok, status: r.status, text: t };
                });
            })
            .then(function (out) {
                let parsed;
                try {
                    parsed = JSON.parse(out.text);
                } catch (e) {
                    parsed = { raw: out.text };
                }
                const sentStr = JSON.stringify(parsed, null, 2);
                openJsonModal('JSON generado para envío IHCE', sentStr, 'min(95vw, 860px)');
            })
            .catch(function (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo cargar el JSON enviado',
                    text: err.message || String(err),
                });
            });
    }

    if (isSandbox) {
        let msg = extractIhceMessage(data);
        if (!msg) {
            msg = resp.ok
                ? 'El envío a IHCE (sandbox) finalizó correctamente. Use los botones de abajo para ver JSON de respuesta o el Bundle enviado.'
                : 'IHCE respondió con error HTTP ' + resp.status + '. Use «Ver JSON de la respuesta» para el detalle técnico.';
        }
        const icon = resp.ok ? 'success' : 'error';
        const bundleBtnHtml =
            bundleCtx && bundleCtx.id != null
                ? '<div class="mt-3 mb-0 text-center d-flex flex-column gap-2">' +
                  '<button type="button" class="btn btn-sm btn-outline-light" id="rda-ihce-btn-json-enviado">Ver JSON enviado</button>' +
                  '<button type="button" class="btn btn-sm btn-outline-light" id="rda-ihce-btn-bundle-fhir">Ver Bundle FHIR enviado</button>' +
                  '</div>'
                : '';
        Swal.fire({
            icon: icon,
            title: resp.ok ? 'IHCE — Sandbox' : 'IHCE — Sandbox (error)',
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
                                return { ok: r.ok, status: r.status, text: t };
                            });
                        })
                        .then(function (out) {
                            let parsed;
                            try {
                                parsed = JSON.parse(out.text);
                            } catch (e) {
                                parsed = { raw: out.text };
                            }
                            const bundleStr = JSON.stringify(parsed, null, 2);
                            openJsonModal('Bundle FHIR generado (mismo que se envió)', bundleStr, 'min(95vw, 860px)');
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
    const jsonBtnProdHtml =
        bundleCtx && bundleCtx.id != null
            ? '<p class="mt-3 mb-0 text-center"><button type="button" class="btn btn-sm btn-outline-light" id="rda-ihce-btn-json-enviado">Ver JSON enviado</button></p>'
            : '';
    Swal.fire({
        icon: resp.ok ? 'success' : 'error',
        title: resp.ok ? 'IHCE — Producción' : 'IHCE — Producción (error)',
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
    const forceSandboxUi = ihceForceSandboxOnlyUi();
    const forceProdUi = ihceForceProdOnlyUi();
    const radiosHtml = forceProdUi
        ? '<label class="d-block"><input type="radio" name="swalRdaAmbIhce" value="prod" checked> Producción</label>'
        : forceSandboxUi
        ? '<label class="d-block"><input type="radio" name="swalRdaAmbIhce" value="sandbox" checked> Sandbox (pruebas)</label>'
        : '<label class="d-block"><input type="radio" name="swalRdaAmbIhce" value="sandbox" checked> Sandbox (pruebas)</label>' +
          '<label class="d-block"><input type="radio" name="swalRdaAmbIhce" value="prod"> Producción</label>';
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
            return el ? el.value : 'sandbox';
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

/**
 * UI: listado GET RdaEnvioMasivo (paciente o CE) pendientes + envío en lote (POST).
 */
(function () {
    'use strict';

    const SWAL_PRE =
        'text-align:left;font-size:0.72rem;max-height:70vh;overflow:auto;white-space:pre-wrap;' +
        'background:#0f172a;color:#e2e8f0;border:1px solid rgba(148,163,184,0.25);' +
        'border-radius:0.35rem;padding:0.75rem;';

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function authHeaders() {
        const t = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
        const h = { 'Content-Type': 'application/json' };
        if (t) h.Authorization = t;
        return h;
    }

    function apiBase() {
        if (typeof window.getApiBaseUrl === 'function') {
            const b = String(window.getApiBaseUrl() || '').replace(/\/$/, '');
            if (b) return b;
        }
        const cfg = window.__APP_CONFIG__ || {};
        const port = cfg.BACK_PORT != null && cfg.BACK_PORT !== '' ? String(cfg.BACK_PORT) : '3000';
        const h =
            (typeof localStorage !== 'undefined' && localStorage.getItem('NombreEquipoServidor')) ||
            (typeof window.location !== 'undefined' && window.location.hostname) ||
            'localhost';
        return `http://${h}:${port}`;
    }

    function defaultDates() {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const toYmd = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };
        return { desde: toYmd(first), hasta: toYmd(now) };
    }

    const state = {
        tipo: 'paciente',
        ambiente: 'sandbox',
        filas: [],
        /** @type {Record<number, { ok: boolean, httpStatus: number, cuerpoTextoTruncado: string }>} */
        resultadosPorId: {},
    };

    const el = {
        selTipo: document.getElementById('selTipo'),
        fechaDesde: document.getElementById('fechaDesde'),
        fechaHasta: document.getElementById('fechaHasta'),
        selAmbiente: document.getElementById('selAmbiente'),
        btnBuscar: document.getElementById('btnBuscar'),
        btnEnviar: document.getElementById('btnEnviar'),
        chkTodos: document.getElementById('chkTodos'),
        tbody: document.getElementById('tbodyPendientes'),
        theadPaciente: document.getElementById('theadPaciente'),
        theadCe: document.getElementById('theadCe'),
        envioProgreso: document.getElementById('envioProgreso'),
        envioBarWrap: document.getElementById('envioBarWrap'),
        envioBar: document.getElementById('envioBar'),
    };

    function syncThead() {
        const ce = state.tipo === 'ce';
        if (el.theadPaciente) el.theadPaciente.classList.toggle('d-none', ce);
        if (el.theadCe) el.theadCe.classList.toggle('d-none', !ce);
    }

    function fmtFecha(val) {
        if (val == null || val === '') return '—';
        const d = new Date(val);
        if (Number.isNaN(d.getTime())) return String(val);
        return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    }

    function nombrePaciente(f) {
        const parts = [
            f.primerNombre,
            f.segundoNombre,
            f.primerApellido,
            f.segundoApellido,
        ].filter(Boolean);
        return parts.length ? parts.join(' ') : '—';
    }

    function ventanaAtencion(f) {
        const a = f.fechaHoraInicioAtencion;
        const b = f.fechaHoraFinAtencion;
        if (!a && !b) return '—';
        return `${fmtFecha(a)} → ${fmtFecha(b)}`;
    }

    function renderTabla() {
        syncThead();
        state.resultadosPorId = {};
        el.chkTodos.checked = false;
        if (!state.filas.length) {
            const colspan = state.tipo === 'ce' ? 8 : 9;
            el.tbody.innerHTML =
                `<tr><td colspan="${colspan}" class="text-center py-4 text-muted">No hay registros pendientes en el rango.</td></tr>`;
            el.btnEnviar.disabled = true;
            return;
        }

        const rows = state.filas.map((f) => {
            const id = f.id;
            const baseCells =
                state.tipo === 'paciente'
                    ? `<td>${escapeHtml(f.documento)}</td>
                       <td>${escapeHtml(nombrePaciente(f))}</td>
                       <td>${escapeHtml(fmtFecha(f.fechaRda))}</td>
                       <td>${escapeHtml(f.codigoPrestador || '—')}</td>
                       <td>${escapeHtml(f.nombreAdminPlanBeneficios || '—')}</td>
                       <td>${escapeHtml(ventanaAtencion(f))}</td>`
                    : `<td>${escapeHtml(f.documento)}</td>
                       <td>${escapeHtml(fmtFecha(f.fechaRda))}</td>
                       <td>${escapeHtml(f.codigoPrestador || '—')}</td>
                       <td>${escapeHtml(f.nombreAdminPlanBeneficios || '—')}</td>
                       <td>${escapeHtml(ventanaAtencion(f))}</td>`;
            return `<tr data-id="${id}">
                <td><input type="checkbox" class="form-check-input chk-fila" value="${id}"></td>
                <td>${id}</td>
                ${baseCells}
                <td class="celda-resultado text-muted">—</td>
            </tr>`;
        });
        el.tbody.innerHTML = rows.join('');
        el.btnEnviar.disabled = false;

        el.tbody.querySelectorAll('.chk-fila').forEach((cb) => {
            cb.addEventListener('change', () => {
                el.chkTodos.checked = Array.from(el.tbody.querySelectorAll('.chk-fila')).every((c) => c.checked);
            });
        });
    }

    function swalErr(title, text) {
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({ icon: 'error', title, text });
        } else {
            window.alert(`${title}: ${text}`);
        }
    }
    function openJsonModal(title, jsonText, widthPx) {
        Swal.fire({
            title,
            html:
                `<pre style="${SWAL_PRE}">${escapeHtml(jsonText)}</pre>` +
                '<p class="mt-3 mb-0 text-center"><button type="button" class="btn btn-sm btn-outline-light" id="btnCopyJsonModal">Copiar al portapapeles</button></p>',
            width: widthPx || 760,
            confirmButtonText: 'Cerrar',
            didOpen: function (popup) {
                const b = popup.querySelector('#btnCopyJsonModal');
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

    async function buscar() {
        try {
            if (!el.btnBuscar || !el.selTipo || !el.fechaDesde || !el.fechaHasta || !el.selAmbiente) {
                swalErr('Interfaz', 'Faltan controles en la página. Recargue (Ctrl+F5).');
                return;
            }
            state.tipo = el.selTipo.value === 'ce' ? 'ce' : 'paciente';
            state.ambiente = el.selAmbiente.value === 'prod' ? 'prod' : 'sandbox';
            const fd = el.fechaDesde.value;
            const fh = el.fechaHasta.value;
            const ambiente = state.ambiente;
            if (!fd || !fh) {
                if (typeof Swal !== 'undefined' && Swal.fire) {
                    Swal.fire({ icon: 'warning', title: 'Fechas', text: 'Indique fecha desde y hasta.' });
                } else {
                    window.alert('Indique fecha desde y hasta.');
                }
                return;
            }
            const base = apiBase();
            el.btnBuscar.disabled = true;
            const path =
                state.tipo === 'ce'
                    ? '/apiV3/RdaEnvioMasivo/ce/pendientes'
                    : '/apiV3/RdaEnvioMasivo/paciente/pendientes';
            const q = new URLSearchParams({
                fechaDesde: fd,
                fechaHasta: fh,
                ambiente,
            });
            const url = `${base}${path}?${q}`;
            const resp = await fetch(url, { headers: authHeaders() });
            const raw = await resp.text();
            let data;
            try {
                data = raw ? JSON.parse(raw) : {};
            } catch (parseErr) {
                throw new Error(
                    'El servidor no devolvió JSON. ¿Abre esta página por http://localhost (front) y el API en el puerto del backend? Detalle: ' +
                        raw.slice(0, 180)
                );
            }
            if (!resp.ok || !data.ok) {
                throw new Error(data.error || resp.statusText || 'Error al listar');
            }
            state.filas = data.filas || [];
            renderTabla();
        } catch (err) {
            console.error('[EnvioRdaPendientes] buscar:', err);
            swalErr('Error', err.message || String(err));
        } finally {
            if (el.btnBuscar) el.btnBuscar.disabled = false;
        }
    }

    function seleccionados() {
        return Array.from(el.tbody.querySelectorAll('.chk-fila:checked')).map((c) => parseInt(c.value, 10));
    }

    function mostrarDetalle(res) {
        const body = res.cuerpoTextoTruncado || '';
        let pretty = body;
        let parsed = null;
        try {
            parsed = JSON.parse(body);
            pretty = JSON.stringify(parsed, null, 2);
        } catch (e) {
            /* texto plano */
        }
        const ok = res.ok;
        const resumen = (() => {
            if (parsed && parsed.resourceType === 'OperationOutcome' && Array.isArray(parsed.issue)) {
                const issues = parsed.issue
                    .map((it) => {
                        const txt = (it && it.details && it.details.text) || it.diagnostics || '';
                        return String(txt || '').trim();
                    })
                    .filter(Boolean);
                if (issues.length) return issues.join('\n');
            }
            if (typeof body === 'string' && body.trim()) return body.trim().slice(0, 700);
            return ok ? 'Envío finalizado correctamente.' : `Error HTTP ${res.httpStatus}`;
        })();

        const showJsonRespuesta = () => {
            openJsonModal('Respuesta IHCE (JSON)', pretty, 780);
        };

        const showJsonEnviado = async () => {
            const isCe = state.tipo === 'ce';
            const url = isCe
                ? `${apiBase()}/apiV3/RdaConsultaExterna/JsonEnviarIHCE`
                : `${apiBase()}/apiV3/RdaPaciente/JsonEnviarIHCE`;
            const reqBody = isCe
                ? { IdEvaluacionEntidadRDACE: res.id, ambiente: state.ambiente }
                : { IdEvaluacionEntidadRDA: res.id, ambiente: state.ambiente };
            Swal.fire({
                title: 'Cargando JSON enviado…',
                allowOutsideClick: false,
                didOpen: function () {
                    Swal.showLoading();
                },
            });
            try {
                const r = await fetch(url, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify(reqBody),
                });
                const t = await r.text();
                let parsedSent;
                try {
                    parsedSent = JSON.parse(t);
                } catch (_) {
                    parsedSent = { raw: t };
                }
                openJsonModal('JSON generado para envío IHCE', JSON.stringify(parsedSent, null, 2), 860);
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'No se pudo cargar JSON enviado', text: err.message || String(err) });
            }
        };

        Swal.fire({
            icon: ok ? 'success' : 'error',
            title: ok ? 'Respuesta IHCE' : `Error HTTP ${res.httpStatus}`,
            html:
                '<p class="small text-start mb-2">Resumen del mensaje:</p>' +
                `<div style="${SWAL_PRE}">${escapeHtml(resumen).replace(/\n/g, '<br>')}</div>` +
                '<div class="d-flex gap-2 justify-content-center mt-3">' +
                '<button type="button" class="btn btn-sm btn-outline-light" id="btnJsonEnviado">Ver JSON enviado</button>' +
                '<button type="button" class="btn btn-sm btn-outline-light" id="btnJsonResp">Ver JSON de la respuesta</button>' +
                '</div>',
            width: 780,
            confirmButtonText: 'Cerrar',
            didOpen: function (popup) {
                const bResp = popup.querySelector('#btnJsonResp');
                const bSent = popup.querySelector('#btnJsonEnviado');
                if (bResp) bResp.addEventListener('click', showJsonRespuesta);
                if (bSent) bSent.addEventListener('click', showJsonEnviado);
            },
        });
    }

    function mostrarResumenLote(list) {
        if (!Array.isArray(list) || list.length === 0) return;
        const okN = list.filter((r) => r && r.ok).length;
        const errN = list.length - okN;
        const optionsHtml = list
            .map((r) => `<option value="${r.id}">ID ${r.id} — ${r.ok ? 'OK' : 'Error ' + r.httpStatus}</option>`)
            .join('');

        Swal.fire({
            icon: errN === 0 ? 'success' : 'warning',
            title: 'Resumen envío masivo',
            html:
                `<p class="small text-start mb-2">Procesados: <b>${list.length}</b> · OK: <b>${okN}</b> · Error: <b>${errN}</b></p>` +
                '<label class="form-label small mb-1">Seleccione un registro para inspeccionar:</label>' +
                `<select id="selDetalleLote" class="form-select form-select-sm">${optionsHtml}</select>` +
                '<div class="d-flex gap-2 justify-content-center mt-3">' +
                '<button type="button" class="btn btn-sm btn-outline-light" id="btnLoteJsonEnviado">Ver JSON enviado</button>' +
                '<button type="button" class="btn btn-sm btn-outline-light" id="btnLoteJsonResp">Ver JSON de la respuesta</button>' +
                '</div>',
            width: 780,
            confirmButtonText: 'Cerrar',
            didOpen: function (popup) {
                const getSelected = () => {
                    const sel = popup.querySelector('#selDetalleLote');
                    const id = sel ? parseInt(sel.value, 10) : NaN;
                    if (!Number.isFinite(id)) return null;
                    return list.find((r) => r.id === id) || null;
                };
                const bResp = popup.querySelector('#btnLoteJsonResp');
                const bSent = popup.querySelector('#btnLoteJsonEnviado');
                if (bResp) {
                    bResp.addEventListener('click', function () {
                        const r = getSelected();
                        if (!r) return;
                        const body = r.cuerpoTextoTruncado || '';
                        let pretty = body;
                        try {
                            pretty = JSON.stringify(JSON.parse(body), null, 2);
                        } catch (_) {}
                        openJsonModal('Respuesta IHCE (JSON)', pretty, 780);
                    });
                }
                if (bSent) {
                    bSent.addEventListener('click', async function () {
                        const r = getSelected();
                        if (!r) return;
                        const isCe = state.tipo === 'ce';
                        const url = isCe
                            ? `${apiBase()}/apiV3/RdaConsultaExterna/JsonEnviarIHCE`
                            : `${apiBase()}/apiV3/RdaPaciente/JsonEnviarIHCE`;
                        const reqBody = isCe
                            ? { IdEvaluacionEntidadRDACE: r.id, ambiente: state.ambiente }
                            : { IdEvaluacionEntidadRDA: r.id, ambiente: state.ambiente };
                        Swal.fire({
                            title: 'Cargando JSON enviado…',
                            allowOutsideClick: false,
                            didOpen: function () {
                                Swal.showLoading();
                            },
                        });
                        try {
                            const resp = await fetch(url, {
                                method: 'POST',
                                headers: authHeaders(),
                                body: JSON.stringify(reqBody),
                            });
                            const txt = await resp.text();
                            let parsed;
                            try {
                                parsed = JSON.parse(txt);
                            } catch (_) {
                                parsed = { raw: txt };
                            }
                            openJsonModal('JSON generado para envío IHCE', JSON.stringify(parsed, null, 2), 860);
                        } catch (err) {
                            Swal.fire({
                                icon: 'error',
                                title: 'No se pudo cargar JSON enviado',
                                text: err.message || String(err),
                            });
                        }
                    });
                }
            },
        });
    }

    async function enviarLote() {
        const ids = seleccionados();
        if (!ids.length) {
            Swal.fire({ icon: 'info', title: 'Selección', text: 'Marque al menos un registro.' });
            return;
        }
        const ambiente = el.selAmbiente.value === 'prod' ? 'prod' : 'sandbox';
        state.ambiente = ambiente;
        const path =
            state.tipo === 'ce'
                ? '/apiV3/RdaEnvioMasivo/ce/enviar'
                : '/apiV3/RdaEnvioMasivo/paciente/enviar';
        el.btnEnviar.disabled = true;
        el.btnBuscar.disabled = true;
        el.envioProgreso.classList.remove('d-none');
        el.envioBarWrap.classList.remove('d-none');
        el.envioBar.style.width = '30%';
        el.envioProgreso.textContent = `Enviando ${ids.length} registro(s) al servidor (procesamiento en serie en backend)...`;

        try {
            const resp = await fetch(`${apiBase()}${path}`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ ids, ambiente }),
            });
            el.envioBar.style.width = '90%';
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                throw new Error(data.error || resp.statusText || 'Error en envío masivo');
            }
            const list = data.resultados || [];
            list.forEach((r) => {
                state.resultadosPorId[r.id] = r;
                const row = el.tbody.querySelector(`tr[data-id="${r.id}"]`);
                if (row) {
                    const cel = row.querySelector('.celda-resultado');
                    if (cel) {
                        if (r.ok) {
                            cel.innerHTML =
                                '<span class="badge bg-success">Enviado OK</span> ' +
                                '<button type="button" class="btn btn-sm btn-outline-light btn-detalle">Ver detalle</button>';
                        } else {
                            cel.innerHTML =
                                '<span class="badge bg-danger">Error</span> ' +
                                '<button type="button" class="btn btn-sm btn-outline-light btn-detalle">Ver detalle</button>';
                        }
                        const btn = cel.querySelector('.btn-detalle');
                        if (btn) {
                            btn.addEventListener('click', () => mostrarDetalle(r));
                        }
                    }
                }
            });
            el.envioBar.style.width = '100%';
            el.envioProgreso.textContent = `Listo: ${list.length} respuesta(s) recibidas.`;
            mostrarResumenLote(list);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Envío', text: err.message || String(err) });
        } finally {
            el.btnEnviar.disabled = false;
            el.btnBuscar.disabled = false;
            el.envioProgreso.classList.add('d-none');
            el.envioBarWrap.classList.add('d-none');
        }
    }

    function init() {
        try {
            if (!el.btnBuscar || !el.tbody || !el.selTipo || !el.fechaDesde || !el.fechaHasta || !el.selAmbiente) {
                console.error('[EnvioRdaPendientes] Faltan elementos DOM.');
                swalErr('Carga', 'No se encontraron los controles de la página. Use el servidor web (no abra el HTML como archivo).');
                return;
            }
            const d = defaultDates();
            el.fechaDesde.value = d.desde;
            el.fechaHasta.value = d.hasta;
            syncThead();

            el.selTipo.addEventListener('change', () => {
                state.tipo = el.selTipo.value === 'ce' ? 'ce' : 'paciente';
                state.filas = [];
                syncThead();
                const colspan = state.tipo === 'ce' ? 8 : 9;
                el.tbody.innerHTML =
                    `<tr><td colspan="${colspan}" class="text-center py-4 text-muted">Pulse <strong>Buscar</strong> para cargar pendientes.</td></tr>`;
                el.btnEnviar.disabled = true;
            });

            el.btnBuscar.addEventListener('click', buscar);
            el.btnEnviar.addEventListener('click', enviarLote);

            el.chkTodos.addEventListener('change', () => {
                const on = el.chkTodos.checked;
                el.tbody.querySelectorAll('.chk-fila').forEach((c) => {
                    c.checked = on;
                });
            });
        } catch (e) {
            console.error('[EnvioRdaPendientes] init:', e);
            swalErr('Inicio', e.message || String(e));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/**
 * UI: listado GET RdaEnvioMasivo (paciente o CE) pendientes + envío en lote (POST).
 *
 * RDA V2:
 * - Preview "Ver JSON enviado" usa `JsonEnviarIHCE` (paciente/CE), igual que en modo legacy (ver docs RDA-V2).
 * - El envío en serie lo hace el backend; modo V2 interno se activa con env `RDA_ENVIO_MASIVO_VERSION=v2`
 *   (no confundir con `localStorage.RDA_API_VERSION`, que solo aplica a `rda/index.js` en Asignar).
 */
import { extractIhceMessage, isIhceYaRegistradoMessage } from './rda/asignar/ihceAsignar.js?v=20260727c';

(function () {
    'use strict';
    const MAX_ENVIO_MASIVO = 50;
    // Señal de versión en consola para verificar que no hay JS cacheado viejo.
    try { console.info('[EnvioRdaPendientes] build 20260727c — Ver detalle en errores tras refresco'); } catch (_) {}

    /**
     * Tri-estado del envío masivo:
     *   ok          → enviado bien
     *   ya_existia  → already exist en IHCE (Enviado*=2, sale de pendientes)
     *   error       → falla corregible / reintentable
     */
    function clasificarResultado(r) {
        if (!r) return 'error';
        if (r.estado === 'ok' || r.estado === 'ya_existia' || r.estado === 'error') return r.estado;
        if (r.ok) return 'ok';
        if (r.noReenviable) return 'ya_existia';
        const cuerpo = String(r.cuerpoTextoTruncado || '');
        if (/already\s*exist/i.test(cuerpo)) return 'ya_existia';
        try {
            if (isIhceYaRegistradoMessage(resumenIhceDesdeResultado(r))) return 'ya_existia';
        } catch (_) { /* ignore */ }
        return 'error';
    }

    function etiquetaEstado(estado) {
        if (estado === 'ok') return 'OK';
        if (estado === 'ya_existia') return 'OK ya existía';
        return 'Error';
    }

    /** HTML de la celda Resultado + Corregir según el tri-estado del envío. */
    function htmlCeldasEnvio(r) {
        const estado = clasificarResultado(r);
        let resultadoHtml;
        if (estado === 'ok') {
            resultadoHtml =
                '<span class="badge bg-success">OK</span> ' +
                '<button type="button" class="btn btn-sm btn-outline-light btn-detalle">Ver detalle</button>';
        } else if (estado === 'ya_existia') {
            resultadoHtml =
                '<span class="badge bg-info text-dark">OK ya existía</span> ' +
                '<button type="button" class="btn btn-sm btn-outline-light btn-detalle">Ver detalle</button>';
        } else {
            resultadoHtml =
                '<span class="badge bg-danger">Error</span> ' +
                '<button type="button" class="btn btn-sm btn-outline-light btn-detalle">Ver detalle</button>';
        }

        let corregirHtml = '<span class="text-muted">—</span>';
        if (estado === 'error') {
            const esProd = state.ambiente === 'prod';
            if (!esProd) {
                corregirHtml = '<span class="badge bg-secondary">Solo producción</span>';
            } else {
                const tipoParam = state.tipo === 'ce' ? 'ce' : 'paciente';
                corregirHtml =
                    `<a class="btn btn-sm btn-outline-warning" href="Asignar_RIPS%20V3.html?modo=corregir-rda&tipo=${encodeURIComponent(tipoParam)}&id=${encodeURIComponent(String(r.id))}&ambiente=prod">Corregir RDA</a>`;
            }
        }
        return { estado, resultadoHtml, corregirHtml };
    }

    function aplicarResultadoEnFila(row, r) {
        if (!row || !r) return;
        const { estado, resultadoHtml, corregirHtml } = htmlCeldasEnvio(r);
        const cel = row.querySelector('.celda-resultado');
        const celCorregir = row.querySelector('.celda-corregir');
        if (cel) {
            cel.classList.remove('text-muted');
            cel.innerHTML = resultadoHtml;
            const btn = cel.querySelector('.btn-detalle');
            if (btn) btn.addEventListener('click', () => mostrarDetalle(r));
        }
        if (celCorregir) {
            celCorregir.classList.remove('text-muted');
            celCorregir.innerHTML = corregirHtml;
        }
        if (estado === 'ok' || estado === 'ya_existia') {
            row.classList.add('table-secondary');
            const chk = row.querySelector('.chk-fila');
            if (chk) {
                chk.checked = false;
                chk.disabled = true;
            }
        }
    }

    function podarResultadosPorFilas() {
        const ids = new Set((state.filas || []).map((f) => Number(f.id)));
        Object.keys(state.resultadosPorId || {}).forEach((k) => {
            if (!ids.has(Number(k))) delete state.resultadosPorId[k];
        });
    }

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
    function ihceForceSandboxOnlyUi() {
        const cfg = window.__APP_CONFIG__ || {};
        return cfg.IHCE_FORCE_SANDBOX_ONLY === true;
    }
    function ihceForceProdOnlyUi() {
        const cfg = window.__APP_CONFIG__ || {};
        return cfg.IHCE_FORCE_PROD_ONLY === true;
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
        sort: { key: 'id', dir: 'asc' },
        /** @type {Record<number, { ok: boolean, httpStatus: number, cuerpoTextoTruncado: string }>} */
        resultadosPorId: {},
        /** Última respuesta de envío masivo: metadatos de la petición OAuth del token (sin secretos). */
        ihceTokenRequestDebug: null,
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
        dashAmbienteBadge: document.getElementById('dashAmbienteBadge'),
        dashAmbienteTexto: document.getElementById('dashAmbienteTexto'),
        dashRangoTexto: document.getElementById('dashRangoTexto'),
        dashColumnaTexto: document.getElementById('dashColumnaTexto'),
        dashActualizado: document.getElementById('dashActualizado'),
        dashBlockPaciente: document.getElementById('dashBlockPaciente'),
        dashBlockCe: document.getElementById('dashBlockCe'),
        dashPacTotal: document.getElementById('dashPacTotal'),
        dashPacEnviados: document.getElementById('dashPacEnviados'),
        dashPacPendientes: document.getElementById('dashPacPendientes'),
        dashCeTotal: document.getElementById('dashCeTotal'),
        dashCeEnviados: document.getElementById('dashCeEnviados'),
        dashCePendientes: document.getElementById('dashCePendientes'),
        dashCombTotal: document.getElementById('dashCombTotal'),
        dashCombEnviados: document.getElementById('dashCombEnviados'),
        dashCombPendientes: document.getElementById('dashCombPendientes'),
    };

    function fmtNum(n) {
        const v = Number(n);
        return Number.isFinite(v) ? String(v) : '0';
    }

    function syncDashTipoActivo() {
        if (el.dashBlockPaciente) {
            el.dashBlockPaciente.classList.toggle('rda-dash-block--active', state.tipo === 'paciente');
        }
        if (el.dashBlockCe) {
            el.dashBlockCe.classList.toggle('rda-dash-block--active', state.tipo === 'ce');
        }
    }

    function renderDashboard(data) {
        if (!data || !data.ok) return;
        const prod = data.ambiente === 'prod';
        if (el.dashAmbienteBadge) {
            el.dashAmbienteBadge.classList.toggle('rda-dash-ambiente--prod', prod);
            el.dashAmbienteBadge.classList.toggle('rda-dash-ambiente--sandbox', !prod);
            const icon = el.dashAmbienteBadge.querySelector('i');
            if (icon) {
                icon.className = prod ? 'ri-shield-check-line' : 'ri-cloud-line';
            }
        }
        if (el.dashAmbienteTexto) el.dashAmbienteTexto.textContent = data.ambienteLabel || (prod ? 'Producción' : 'Sandbox (pruebas)');
        if (el.dashRangoTexto) {
            el.dashRangoTexto.textContent = `Período: ${data.fechaDesde || '—'} a ${data.fechaHasta || '—'}`;
        }
        if (el.dashColumnaTexto) {
            el.dashColumnaTexto.textContent = `Criterio de envío: [${data.columnaEnvio || (prod ? 'Enviado' : 'Enviado pruebas')}] = 1`;
        }
        const p = data.paciente || {};
        const c = data.ce || {};
        const comb = data.combinado || {};
        if (el.dashPacTotal) el.dashPacTotal.textContent = fmtNum(p.total);
        if (el.dashPacEnviados) el.dashPacEnviados.textContent = fmtNum(p.enviados);
        if (el.dashPacPendientes) el.dashPacPendientes.textContent = fmtNum(p.pendientes);
        if (el.dashCeTotal) el.dashCeTotal.textContent = fmtNum(c.total);
        if (el.dashCeEnviados) el.dashCeEnviados.textContent = fmtNum(c.enviados);
        if (el.dashCePendientes) el.dashCePendientes.textContent = fmtNum(c.pendientes);
        if (el.dashCombTotal) el.dashCombTotal.textContent = fmtNum(comb.total);
        if (el.dashCombEnviados) el.dashCombEnviados.textContent = fmtNum(comb.enviados);
        if (el.dashCombPendientes) el.dashCombPendientes.textContent = fmtNum(comb.pendientes);
        if (el.dashActualizado) {
            el.dashActualizado.textContent = `Actualizado: ${new Date().toLocaleString('es-CO')}`;
        }
        syncDashTipoActivo();
    }

    async function cargarDashboard() {
        if (!el.fechaDesde || !el.fechaHasta || !el.selAmbiente) return;
        const fd = el.fechaDesde.value;
        const fh = el.fechaHasta.value;
        const ambiente = el.selAmbiente.value === 'prod' ? 'prod' : 'sandbox';
        if (!fd || !fh) return;
        try {
            const q = new URLSearchParams({ fechaDesde: fd, fechaHasta: fh, ambiente });
            const resp = await fetch(`${apiBase()}/apiV3/RdaEnvioMasivo/dashboard?${q}`, {
                headers: authHeaders(),
            });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                throw new Error(data.error || resp.statusText || 'No se pudo cargar el resumen');
            }
            state.ambiente = data.ambiente === 'prod' ? 'prod' : 'sandbox';
            renderDashboard(data);
        } catch (err) {
            console.error('[EnvioRdaPendientes] dashboard:', err);
            if (el.dashActualizado) {
                el.dashActualizado.textContent = 'No se pudo actualizar el resumen.';
            }
        }
    }

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

    function sortValueForRow(row, key) {
        if (!row || !key) return '';
        if (key === 'atencion') {
            const t = row.fechaHoraInicioAtencion ? Date.parse(row.fechaHoraInicioAtencion) : NaN;
            return Number.isNaN(t) ? 0 : t;
        }
        if (key === 'fechaRda') {
            const t = row.fechaRda ? Date.parse(row.fechaRda) : NaN;
            return Number.isNaN(t) ? 0 : t;
        }
        if (key === 'id') {
            const n = Number(row.id);
            return Number.isFinite(n) ? n : 0;
        }
        return String(row[key] == null ? '' : row[key]).toLocaleLowerCase('es-CO');
    }

    function sortFilasInPlace() {
        const { key, dir } = state.sort || {};
        if (!key) return;
        const factor = dir === 'desc' ? -1 : 1;
        state.filas.sort((a, b) => {
            const av = sortValueForRow(a, key);
            const bv = sortValueForRow(b, key);
            if (av < bv) return -1 * factor;
            if (av > bv) return 1 * factor;
            const aid = Number(a && a.id);
            const bid = Number(b && b.id);
            return (aid - bid) * factor;
        });
    }

    function sortArrow(key) {
        if (!state.sort || state.sort.key !== key) return '';
        return state.sort.dir === 'desc' ? ' ▼' : ' ▲';
    }

    function setSortFromHeader(key) {
        if (!key) return;
        if (state.sort && state.sort.key === key) {
            state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
        } else {
            state.sort = { key, dir: 'asc' };
        }
        renderTabla();
    }

    function makeHeaderSortable(th, label, key) {
        if (!th || !key) return;
        th.style.cursor = 'pointer';
        th.title = 'Ordenar';
        th.innerHTML = `${escapeHtml(label)}<span class="ms-1 text-muted">${sortArrow(key)}</span>`;
        th.onclick = () => setSortFromHeader(key);
    }

    function wireSortHeaders() {
        const tr = state.tipo === 'ce' ? el.theadCe : el.theadPaciente;
        if (!tr) return;
        const ths = tr.querySelectorAll('th');
        if (!ths || !ths.length) return;

        if (state.tipo === 'paciente') {
            makeHeaderSortable(ths[1], 'Id', 'id');
            makeHeaderSortable(ths[2], 'Documento', 'documento');
            makeHeaderSortable(ths[3], 'Nombre paciente', 'nombreCompleto');
            makeHeaderSortable(ths[4], 'Fecha RDA', 'fechaRda');
            makeHeaderSortable(ths[5], 'Cód. prestador', 'codigoPrestador');
            makeHeaderSortable(ths[6], 'Doc. profesional', 'numDocProfesional');
            makeHeaderSortable(ths[7], 'Plan beneficios', 'nombreAdminPlanBeneficios');
            makeHeaderSortable(ths[8], 'Atención', 'atencion');
        } else {
            makeHeaderSortable(ths[1], 'Id', 'id');
            makeHeaderSortable(ths[2], 'Documento', 'documento');
            makeHeaderSortable(ths[3], 'Fecha RDA', 'fechaRda');
            makeHeaderSortable(ths[4], 'Cód. prestador', 'codigoPrestador');
            makeHeaderSortable(ths[5], 'Doc. profesional', 'numDocProfesional');
            makeHeaderSortable(ths[6], 'Plan beneficios', 'nombreAdminPlanBeneficios');
            makeHeaderSortable(ths[7], 'Atención', 'atencion');
        }
    }

    function renderTabla() {
        syncThead();
        state.filas = (state.filas || []).map((f) => ({
            ...f,
            nombreCompleto: nombrePaciente(f),
        }));
        sortFilasInPlace();
        wireSortHeaders();
        // Conservar resultados de errores del último lote; solo podar ids que ya no están.
        podarResultadosPorFilas();
        el.chkTodos.checked = false;
        if (!state.filas.length) {
            const colspan = 11;
            el.tbody.innerHTML =
                `<tr><td colspan="${colspan}" class="text-center py-4 text-muted">No hay registros pendientes en el rango.</td></tr>`;
            el.btnEnviar.disabled = true;
            return;
        }

        const rows = state.filas.map((f) => {
            const id = f.id;
            const prev = state.resultadosPorId[id] || state.resultadosPorId[String(id)];
            const celdasEnvio = prev
                ? htmlCeldasEnvio(prev)
                : {
                    resultadoHtml: '<span class="text-muted">—</span>',
                    corregirHtml: '<span class="text-muted">—</span>',
                };
            const baseCells =
                state.tipo === 'paciente'
                    ? `<td>${escapeHtml(f.documento)}</td>
                       <td>${escapeHtml(nombrePaciente(f))}</td>
                       <td>${escapeHtml(fmtFecha(f.fechaRda))}</td>
                       <td>${escapeHtml(f.codigoPrestador || '—')}</td>
                       <td>${escapeHtml(f.numDocProfesional || '—')}</td>
                       <td>${escapeHtml(f.nombreAdminPlanBeneficios || '—')}</td>
                       <td>${escapeHtml(ventanaAtencion(f))}</td>`
                    : `<td>${escapeHtml(f.documento)}</td>
                       <td>${escapeHtml(fmtFecha(f.fechaRda))}</td>
                       <td>${escapeHtml(f.codigoPrestador || '—')}</td>
                       <td>${escapeHtml(f.numDocProfesional || '—')}</td>
                       <td>${escapeHtml(f.nombreAdminPlanBeneficios || '—')}</td>
                       <td>${escapeHtml(ventanaAtencion(f))}</td>`;
            return `<tr data-id="${id}">
                <td><input type="checkbox" class="form-check-input chk-fila" value="${id}"></td>
                <td>${id}</td>
                ${baseCells}
                <td class="celda-resultado">${celdasEnvio.resultadoHtml}</td>
                <td class="celda-corregir">${celdasEnvio.corregirHtml}</td>
            </tr>`;
        });
        el.tbody.innerHTML = rows.join('');
        el.btnEnviar.disabled = false;

        el.tbody.querySelectorAll('.chk-fila').forEach((cb) => {
            cb.addEventListener('change', () => {
                el.chkTodos.checked = Array.from(el.tbody.querySelectorAll('.chk-fila')).every((c) => c.checked);
            });
        });
        // Reenganchar «Ver detalle» en filas con resultado (errores que siguen en pendientes).
        el.tbody.querySelectorAll('tr[data-id]').forEach((row) => {
            const id = parseInt(row.getAttribute('data-id'), 10);
            const r = state.resultadosPorId[id] || state.resultadosPorId[String(id)];
            if (!r) return;
            const btn = row.querySelector('.btn-detalle');
            if (btn) btn.addEventListener('click', () => mostrarDetalle(r));
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

    async function buscar(opts) {
        const keepResultados = Boolean(opts && opts.keepResultados);
        try {
            if (!keepResultados) {
                state.ihceTokenRequestDebug = null;
                state.resultadosPorId = {};
            }
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
            await cargarDashboard();
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

    function periodContextFromFila(id) {
        const fila = (state.filas || []).find((f) => Number(f.id) === Number(id));
        if (!fila) return null;
        const startRaw = fila.fechaHoraInicioAtencion;
        const endRaw = fila.fechaHoraFinAtencion;
        const start = startRaw ? new Date(startRaw) : null;
        const end = endRaw ? new Date(endRaw) : null;
        const fmtDate = (d) => (d && !isNaN(d.getTime())
            ? d.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' })
            : '');
        const fmtTime = (d) => (d && !isNaN(d.getTime())
            ? d.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false })
            : '');
        return {
            fecha: fmtDate(start) || fmtDate(end) || null,
            horaInicio: fmtTime(start) || null,
            horaFin: fmtTime(end) || null,
            startIso: start && !isNaN(start.getTime()) ? start.toISOString() : null,
            endIso: end && !isNaN(end.getTime()) ? end.toISOString() : null,
        };
    }

    function formatIsoLocal(iso) {
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

    /** Fallback local si el módulo importado viene cacheado/viejo. */
    function mensajeYaExisteLocal(text) {
        const t = String(text || '');
        if (!/already\s*exist/i.test(t)) return null;
        const dates = [];
        const re = /(?:period|date)='([^']+)'/gi;
        let m;
        while ((m = re.exec(t)) !== null) dates.push(m[1]);
        const tipo = /Composition/i.test(t)
            ? 'historia clínica (Composition)'
            : (/Encounter/i.test(t) ? 'encuentro (Encounter)' : 'recurso');
        const lines = [
            'Ya existe un RDA / ' + tipo + ' en IHCE para este paciente en ese horario.',
            'No se puede volver a enviar con la misma fecha y rango de atención.',
            '',
            'Los UUID de IHCE pueden cambiar; lo importante es el periodo.',
            'El registro se marca NO reenviable (Enviado*=2) y no aparecerá en pendientes.',
            '',
        ];
        if (dates.length >= 2) {
            lines.push('Fecha y rango horario detectados por IHCE:');
            lines.push('• Inicio: ' + formatIsoLocal(dates[0]));
            lines.push('• Fin: ' + formatIsoLocal(dates[1]));
        } else if (dates.length === 1) {
            lines.push('Periodo IHCE: ' + formatIsoLocal(dates[0]));
        }
        return lines.join('\n');
    }

    function resumenIhceDesdeResultado(res) {
        const body = res.cuerpoTextoTruncado || '';
        const opts = { periodContext: periodContextFromFila(res.id) };
        let parsed = null;
        try {
            parsed = JSON.parse(body);
            if (typeof parsed === 'string') {
                try {
                    parsed = JSON.parse(parsed);
                } catch (_) {
                    parsed = { raw: parsed };
                }
            }
        } catch (_) {
            parsed = body && String(body).trim() ? { raw: String(body).trim() } : null;
        }

        let msg = '';
        try {
            msg = extractIhceMessage(parsed, opts) || '';
        } catch (e) {
            console.warn('[EnvioRdaPendientes] extractIhceMessage falló:', e);
        }

        // Si el resumen sigue siendo JSON crudo u OperationOutcome, forzar mensaje amigable.
        const looksLikeRawJson = /"resourceType"\s*:\s*"OperationOutcome"/i.test(String(msg || body));
        if (!msg || looksLikeRawJson) {
            const local = mensajeYaExisteLocal(body)
                || mensajeYaExisteLocal(typeof msg === 'string' ? msg : '')
                || (parsed && Array.isArray(parsed.issue)
                    ? mensajeYaExisteLocal(parsed.issue.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n'))
                    : null);
            if (local) return local;
            try {
                const again = extractIhceMessage(String(body || ''), opts);
                if (again && !/"resourceType"\s*:\s*"OperationOutcome"/i.test(again)) return again;
            } catch (_) { /* ignore */ }
        }
        if (msg && !/"resourceType"\s*:\s*"OperationOutcome"/i.test(msg)) return msg;
        if (typeof body === 'string' && body.trim()) return body.trim().slice(0, 700);
        return res.ok ? 'Envío finalizado correctamente.' : `Error HTTP ${res.httpStatus}`;
    }

    function mostrarDetalle(res) {
        const body = res.cuerpoTextoTruncado || '';
        let pretty = body;
        try {
            pretty = JSON.stringify(JSON.parse(body), null, 2);
        } catch (e) {
            /* texto plano */
        }
        const estado = clasificarResultado(res);
        const resumen = resumenIhceDesdeResultado(res);
        const yaExistia = estado === 'ya_existia';
        const ok = estado === 'ok';

        const showJsonRespuesta = () => {
            let jsonText = pretty;
            if (!jsonText || !String(jsonText).trim()) {
                jsonText = body || '(sin cuerpo de respuesta)';
            }
            openJsonModal('JSON recibido de IHCE (respuesta)', jsonText, 860);
        };

        const showJsonTokenOAuth = () => {
            const dbg = state.ihceTokenRequestDebug;
            if (!dbg) {
                Swal.fire({
                    icon: 'info',
                    title: 'Solicitud de token',
                    text: 'No hay datos de la última ejecución de envío masivo. Envíe un lote de nuevo.',
                });
                return;
            }
            openJsonModal(
                'Solicitud de token IHCE (referencia)',
                JSON.stringify(dbg, null, 2),
                860
            );
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
                if (parsedSent && parsedSent.ok === false && parsedSent.error) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'No se pudo generar el JSON',
                        html: escapeHtml(parsedSent.error).replace(/\n/g, '<br>'),
                    });
                    return;
                }
                const warn = r.headers.get('X-RDA-Validation-Warning');
                const jsonText = JSON.stringify(parsedSent, null, 2);
                openJsonModal(
                    warn ? 'JSON enviado a IHCE (con advertencias)' : 'JSON enviado a IHCE',
                    warn
                        ? `/* Advertencia: ${warn} */\n\n${jsonText}`
                        : jsonText,
                    860
                );
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'No se pudo cargar JSON enviado', text: err.message || String(err) });
            }
        };

        const tokenBtnHtml = state.ihceTokenRequestDebug
            ? '<button type="button" class="btn btn-sm btn-outline-light" id="btnJsonTokenReq">Solicitud token</button>'
            : '';

        const esErrorComun = yaExistia || /periodo|fecha del encuentro|telecom|teléfono/i.test(resumen);
        const ayudaHtml = ok
            ? ''
            : (yaExistia
                ? '<p class="small text-start mt-2 mb-0 text-success">Tratado como <b>OK ya existía</b>: se marcó Enviado*=2 y ya no aparece en pendientes.</p>'
                : (esErrorComun
                    ? '<p class="small text-start mt-2 mb-0 text-warning">Error común interpretado. El JSON técnico recibido queda en el botón de abajo.</p>'
                    : '<p class="small text-start mt-2 mb-0 text-muted">Error no tipificado: revise el JSON recibido para el detalle técnico.</p>'));

        const titleDetalle = ok
            ? 'OK — enviado a IHCE'
            : (yaExistia
                ? 'OK ya existía — sale de pendientes'
                : `Error HTTP ${res.httpStatus}`);

        Swal.fire({
            icon: ok ? 'success' : (yaExistia ? 'info' : 'error'),
            title: titleDetalle,
            html:
                '<p class="small text-start mb-2">Resumen legible:</p>' +
                `<div style="${SWAL_PRE}">${escapeHtml(resumen).replace(/\n/g, '<br>')}</div>` +
                ayudaHtml +
                '<div class="d-flex flex-wrap gap-2 justify-content-center mt-3">' +
                '<button type="button" class="btn btn-sm btn-warning" id="btnJsonResp">Ver JSON recibido</button>' +
                '<button type="button" class="btn btn-sm btn-outline-light" id="btnJsonEnviado">Ver JSON enviado</button>' +
                tokenBtnHtml +
                '</div>',
            width: 780,
            confirmButtonText: 'Cerrar',
            showDenyButton: true,
            denyButtonText: 'Ver JSON recibido',
            denyButtonColor: '#f0ad4e',
            didOpen: function (popup) {
                const bResp = popup.querySelector('#btnJsonResp');
                const bSent = popup.querySelector('#btnJsonEnviado');
                const bTok = popup.querySelector('#btnJsonTokenReq');
                if (bResp) bResp.addEventListener('click', showJsonRespuesta);
                if (bSent) bSent.addEventListener('click', showJsonEnviado);
                if (bTok) bTok.addEventListener('click', showJsonTokenOAuth);
            },
        }).then(function (r) {
            if (r.isDenied) showJsonRespuesta();
        });
    }

    function mostrarResumenLote(list) {
        if (!Array.isArray(list) || list.length === 0) return;
        const okN = list.filter((r) => clasificarResultado(r) === 'ok').length;
        const yaN = list.filter((r) => clasificarResultado(r) === 'ya_existia').length;
        const errN = list.filter((r) => clasificarResultado(r) === 'error').length;
        const optionsHtml = list
            .map((r) => {
                const estado = clasificarResultado(r);
                const label = etiquetaEstado(estado) + (estado === 'error' ? ' ' + r.httpStatus : '');
                return `<option value="${r.id}">ID ${r.id} — ${label}</option>`;
            })
            .join('');

        const showJsonTokenOAuthLote = () => {
            const dbg = state.ihceTokenRequestDebug;
            if (!dbg) {
                Swal.fire({
                    icon: 'info',
                    title: 'Solicitud de token',
                    text: 'No hay datos de token en esta respuesta. Actualice el servidor o reenvíe el lote.',
                });
                return;
            }
            openJsonModal('Solicitud de token IHCE (referencia)', JSON.stringify(dbg, null, 2), 860);
        };

        const tokenBtnLoteHtml = state.ihceTokenRequestDebug
            ? '<button type="button" class="btn btn-sm btn-outline-light" id="btnLoteJsonTokenReq">Solicitud token</button>'
            : '';

        Swal.fire({
            icon: errN === 0 ? (yaN > 0 ? 'info' : 'success') : 'warning',
            title: 'Resumen envío masivo',
            html:
                `<p class="small text-start mb-2">Procesados: <b>${list.length}</b> · OK: <b>${okN}</b> · OK ya existía: <b>${yaN}</b> · Error: <b>${errN}</b></p>` +
                (yaN
                    ? '<p class="small text-start text-success mb-2">Los «OK ya existía» se marcaron Enviado*=2 y <b>ya no aparecen en pendientes</b>.</p>'
                    : '') +
                '<label class="form-label small mb-1">Seleccione un registro para inspeccionar:</label>' +
                `<select id="selDetalleLote" class="form-select form-select-sm">${optionsHtml}</select>` +
                '<div class="d-flex flex-wrap gap-2 justify-content-center mt-3">' +
                '<button type="button" class="btn btn-sm btn-outline-warning" id="btnLoteMsgLegible">Ver mensaje legible</button>' +
                '<button type="button" class="btn btn-sm btn-warning" id="btnLoteJsonResp">Ver JSON recibido</button>' +
                '<button type="button" class="btn btn-sm btn-outline-light" id="btnLoteJsonEnviado">Ver JSON enviado</button>' +
                tokenBtnLoteHtml +
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
                const bLegible = popup.querySelector('#btnLoteMsgLegible');
                const bResp = popup.querySelector('#btnLoteJsonResp');
                const bSent = popup.querySelector('#btnLoteJsonEnviado');
                const bTok = popup.querySelector('#btnLoteJsonTokenReq');
                if (bTok) bTok.addEventListener('click', showJsonTokenOAuthLote);
                if (bLegible) {
                    bLegible.addEventListener('click', function () {
                        const r = getSelected();
                        if (r) mostrarDetalle(r);
                    });
                }
                if (bResp) {
                    bResp.addEventListener('click', function () {
                        const r = getSelected();
                        if (!r) return;
                        const body = r.cuerpoTextoTruncado || '';
                        let pretty = body;
                        try {
                            pretty = JSON.stringify(JSON.parse(body), null, 2);
                        } catch (_) {}
                        openJsonModal('JSON recibido de IHCE (respuesta)', pretty, 860);
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
                            if (parsed && parsed.ok === false && parsed.error) {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'No se pudo generar el JSON',
                                    html: escapeHtml(parsed.error).replace(/\n/g, '<br>'),
                                });
                                return;
                            }
                            const warn = resp.headers.get('X-RDA-Validation-Warning');
                            const jsonText = JSON.stringify(parsed, null, 2);
                            openJsonModal(
                                warn ? 'JSON generado para envío IHCE (con advertencias)' : 'JSON generado para envío IHCE',
                                warn
                                    ? `/* Advertencia: ${warn} */\n\n${jsonText}`
                                    : jsonText,
                                860
                            );
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
        let ids = seleccionados();
        if (!ids.length) {
            Swal.fire({ icon: 'info', title: 'Selección', text: 'Marque al menos un registro.' });
            return;
        }
        if (ids.length > MAX_ENVIO_MASIVO) {
            ids = ids.slice(0, MAX_ENVIO_MASIVO);
            Swal.fire({
                icon: 'info',
                title: 'Límite de envío',
                text: `Solo se pueden enviar ${MAX_ENVIO_MASIVO} registros por lote. Se enviarán los primeros ${MAX_ENVIO_MASIVO} seleccionados.`,
            });
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
            state.ihceTokenRequestDebug = data.ihceTokenRequestDebug || null;
            const list = data.resultados || [];
            list.forEach((r) => {
                const estado = clasificarResultado(r);
                // OK / OK ya existía: no guardar (desaparecen del listado).
                // Error: conservar para el botón «Ver detalle» tras refrescar.
                if (estado === 'error') {
                    state.resultadosPorId[r.id] = r;
                } else {
                    delete state.resultadosPorId[r.id];
                }
                const row = el.tbody.querySelector(`tr[data-id="${r.id}"]`);
                if (row) aplicarResultadoEnFila(row, r);
            });
            el.envioBar.style.width = '100%';
            const yaN = list.filter((r) => clasificarResultado(r) === 'ya_existia').length;
            const errN = list.filter((r) => clasificarResultado(r) === 'error').length;
            el.envioProgreso.textContent = yaN || errN
                ? `Listo: ${list.length}. OK ya existía: ${yaN} (salen). Error: ${errN} (siguen con Ver detalle).`
                : `Listo: ${list.length} respuesta(s) recibidas.`;
            mostrarResumenLote(list);
            await cargarDashboard();
            // Refresco: ya_existia/OK salen; errores se quedan con su botón Ver detalle.
            await buscar({ keepResultados: true });
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
            if (ihceForceProdOnlyUi() && el.selAmbiente) {
                const sandboxOpt = el.selAmbiente.querySelector('option[value="sandbox"]');
                if (sandboxOpt) sandboxOpt.remove();
                el.selAmbiente.value = 'prod';
                el.selAmbiente.disabled = true;
            } else if (ihceForceSandboxOnlyUi() && el.selAmbiente) {
                const prodOpt = el.selAmbiente.querySelector('option[value="prod"]');
                if (prodOpt) prodOpt.remove();
                el.selAmbiente.value = 'sandbox';
                el.selAmbiente.disabled = true;
            } else if (el.selAmbiente) {
                el.selAmbiente.disabled = false;
            }
            if (ihceForceProdOnlyUi()) {
                state.ambiente = 'prod';
            } else if (ihceForceSandboxOnlyUi()) {
                state.ambiente = 'sandbox';
            }
            syncThead();
            syncDashTipoActivo();

            el.selTipo.addEventListener('change', () => {
                state.tipo = el.selTipo.value === 'ce' ? 'ce' : 'paciente';
                state.filas = [];
                state.resultadosPorId = {};
                state.ihceTokenRequestDebug = null;
                syncThead();
                syncDashTipoActivo();
                wireSortHeaders();
                const colspan = state.tipo === 'ce' ? 8 : 9;
                const colspanFix = 11;
                el.tbody.innerHTML =
                    `<tr><td colspan="${colspanFix}" class="text-center py-4 text-muted">Pulse <strong>Buscar</strong> para cargar pendientes.</td></tr>`;
                el.btnEnviar.disabled = true;
            });

            el.btnBuscar.addEventListener('click', buscar);
            el.btnEnviar.addEventListener('click', enviarLote);
            el.selAmbiente.addEventListener('change', () => {
                state.ambiente = el.selAmbiente.value === 'prod' ? 'prod' : 'sandbox';
                cargarDashboard();
            });
            el.fechaDesde.addEventListener('change', cargarDashboard);
            el.fechaHasta.addEventListener('change', cargarDashboard);

            cargarDashboard();

            el.chkTodos.addEventListener('change', () => {
                const on = el.chkTodos.checked;
                const checks = Array.from(el.tbody.querySelectorAll('.chk-fila'));
                checks.forEach((c, idx) => {
                    c.checked = on ? idx < MAX_ENVIO_MASIVO : false;
                });
                if (on && checks.length > MAX_ENVIO_MASIVO) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Límite de selección',
                        text: `Se seleccionaron ${MAX_ENVIO_MASIVO} registros (máximo permitido por envío).`,
                    });
                }
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

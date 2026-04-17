/**
 * UI: listado GET RdaEnvioMasivo/*/pendientes + envío POST masivo.
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
        return typeof window.getApiBaseUrl === 'function' ? window.getApiBaseUrl() : '';
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

    async function buscar() {
        state.tipo = el.selTipo.value === 'ce' ? 'ce' : 'paciente';
        const fd = el.fechaDesde.value;
        const fh = el.fechaHasta.value;
        const ambiente = el.selAmbiente.value;
        if (!fd || !fh) {
            Swal.fire({ icon: 'warning', title: 'Fechas', text: 'Indique fecha desde y hasta.' });
            return;
        }
        el.btnBuscar.disabled = true;
        try {
            const path =
                state.tipo === 'ce'
                    ? '/apiV3/RdaEnvioMasivo/ce/pendientes'
                    : '/apiV3/RdaEnvioMasivo/paciente/pendientes';
            const q = new URLSearchParams({
                fechaDesde: fd,
                fechaHasta: fh,
                ambiente,
            });
            const resp = await fetch(`${apiBase()}${path}?${q}`, { headers: authHeaders() });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                throw new Error(data.error || resp.statusText || 'Error al listar');
            }
            state.filas = data.filas || [];
            renderTabla();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message || String(err) });
        } finally {
            el.btnBuscar.disabled = false;
        }
    }

    function seleccionados() {
        return Array.from(el.tbody.querySelectorAll('.chk-fila:checked')).map((c) => parseInt(c.value, 10));
    }

    function mostrarDetalle(res) {
        const body = res.cuerpoTextoTruncado || '';
        let pretty = body;
        try {
            pretty = JSON.stringify(JSON.parse(body), null, 2);
        } catch (e) {
            /* texto plano */
        }
        const ok = res.ok;
        Swal.fire({
            icon: ok ? 'success' : 'error',
            title: ok ? 'Respuesta IHCE' : `Error HTTP ${res.httpStatus}`,
            html:
                '<p class="small text-start mb-2">HTTP <strong>' +
                res.httpStatus +
                '</strong></p>' +
                '<pre style="' +
                SWAL_PRE +
                '">' +
                escapeHtml(pretty) +
                '</pre>',
            width: 720,
            confirmButtonText: 'Cerrar',
        });
    }

    async function enviarLote() {
        const ids = seleccionados();
        if (!ids.length) {
            Swal.fire({ icon: 'info', title: 'Selección', text: 'Marque al menos un registro.' });
            return;
        }
        const ambiente = el.selAmbiente.value;
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

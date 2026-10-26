/**
 * Switch: relación automática RIPS ↔ Factura (SP por lote + scheduler)
 * GET/PUT /apiV3/Rips/relacion-automatica-factura
 * POST .../ensure-install | .../ejecutar-ahora
 */
(function () {
    'use strict';

    function authHeaders(json) {
        const h = {};
        if (json) h['Content-Type'] = 'application/json';
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (token) h.Authorization = `Bearer ${token}`;
        return h;
    }

    function apiBase() {
        if (typeof window.getApiBaseUrl === 'function') {
            return String(window.getApiBaseUrl()).replace(/\/$/, '');
        }
        const cfg = window.__APP_CONFIG__ || {};
        if (cfg.API_BASE_URL) {
            return String(cfg.API_BASE_URL).replace(/\/$/, '');
        }
        const host = (window.location && window.location.hostname) || 'localhost';
        const port = cfg.BACK_PORT || '3000';
        return `http://${host}:${port}`;
    }

    const el = {
        sw: document.getElementById('switchRelacionAuto'),
        lblEstado: document.getElementById('lblEstado'),
        lblFecha: document.getElementById('lblFecha'),
        lblUltima: document.getElementById('lblUltimaEjecucion'),
        btnRecargar: document.getElementById('btnRecargar'),
        btnEjecutar: document.getElementById('btnEjecutarAhora'),
    };

    let saving = false;

    function esTablaAusente(data, message, status) {
        const code = String(data && data.code || '');
        const msg = String((data && data.error) || message || '');
        return (
            code === 'RELACION_AUTO_TABLA_AUSENTE'
            || status === 409
            || (/ConfigRelacionAutomaticaRipsFactura/i.test(msg)
                && /no existe|nombre de objeto|Invalid object name|no es v[aá]lido|tabla|Ejecute SQL/i.test(msg))
        );
    }

    function fmtFecha(fecha) {
        if (!fecha) return '';
        try {
            return new Date(fecha).toLocaleString('es-CO');
        } catch (_) {
            return String(fecha);
        }
    }

    function pintar(data) {
        const activo = Boolean(data && data.activo);
        if (el.sw) el.sw.checked = activo;
        if (el.lblEstado) {
            el.lblEstado.textContent = activo ? 'Activado' : 'Desactivado';
            el.lblEstado.classList.toggle('on', activo);
            el.lblEstado.classList.toggle('off', !activo);
        }
        if (el.lblFecha) {
            const interv = data && data.intervaloMinutos != null ? data.intervaloMinutos : 30;
            const top = data && data.topLote != null ? data.topLote : 50;
            const cambio = data && data.fechaActualizacion
                ? 'Último cambio: ' + fmtFecha(data.fechaActualizacion)
                : '';
            el.lblFecha.textContent = cambio
                ? `${cambio} · cada ${interv} min · TOP ${top}`
                : `Cada ${interv} min · TOP ${top}`;
        }
        if (el.lblUltima) {
            if (data && data.ultimaEjecucion) {
                const n = data.ultimoRelacionados != null ? data.ultimoRelacionados : '?';
                const msg = data.ultimoMensaje ? ` (${data.ultimoMensaje})` : '';
                el.lblUltima.textContent =
                    `Última ejecución: ${fmtFecha(data.ultimaEjecucion)} → ${n} relacionados${msg}`;
            } else {
                el.lblUltima.textContent = 'Aún no hay ejecuciones registradas.';
            }
        }
    }

    async function instalar() {
        const resp = await fetch(
            `${apiBase()}/apiV3/Rips/relacion-automatica-factura/ensure-install`,
            {
                method: 'POST',
                headers: authHeaders(true),
                body: '{}',
            }
        );
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            throw new Error(data.error || 'No se pudo instalar la relación automática');
        }
        return data;
    }

    async function ofrecerInstalar(mensajeOriginal) {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Falta instalar en esta BD',
            html:
                '<p class="mb-2">Esta base no tiene el SP de relación automática RIPS↔Factura.</p>'
                + '<p class="mb-0 small text-muted">¿Desea instalarlo ahora? Quedará <strong>desactivado</strong> hasta que active el switch.</p>',
            showCancelButton: true,
            confirmButtonText: 'Instalar ahora',
            cancelButtonText: 'Cancelar',
            footer: mensajeOriginal
                ? `<span class="small text-muted">${String(mensajeOriginal).slice(0, 240)}</span>`
                : undefined,
        });
        if (!result.isConfirmed) return false;

        Swal.fire({
            title: 'Instalando…',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        try {
            const data = await instalar();
            await Swal.fire({
                icon: 'success',
                title: 'Listo',
                text: data.message || 'Instalación completada.',
            });
            await cargar();
            return true;
        } catch (e) {
            await Swal.fire({
                icon: 'error',
                title: 'No se pudo instalar',
                text: e.message || String(e),
            });
            return false;
        }
    }

    async function manejarErrorCarga(data, status, fallbackMsg) {
        const msg = (data && data.error) || fallbackMsg || 'No se pudo leer la configuración';
        if (status === 404) {
            const url = `${apiBase()}/apiV3/Rips/relacion-automatica-factura`;
            await Swal.fire({
                icon: 'error',
                title: 'Ruta no encontrada (API)',
                html:
                    '<p class="mb-2">No respondió:</p>'
                    + `<p><code>${url}</code></p>`
                    + '<p class="small mb-0">Reinicie el backend con el código nuevo.</p>',
            });
            return;
        }
        if (esTablaAusente(data, msg, status)) {
            await ofrecerInstalar(msg);
            return;
        }
        await Swal.fire({ icon: 'error', text: msg });
    }

    async function cargar() {
        const url = `${apiBase()}/apiV3/Rips/relacion-automatica-factura`;
        let resp;
        try {
            resp = await fetch(url, { headers: authHeaders(false) });
        } catch (netErr) {
            await Swal.fire({
                icon: 'error',
                title: 'Backend no responde',
                html:
                    `<p class="mb-2">No se pudo conectar a:</p>`
                    + `<p><code>${url}</code></p>`
                    + '<p class="small text-muted mb-0">El scheduler vive en el backend: debe estar corriendo.</p>',
            });
            return null;
        }
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            await manejarErrorCarga(
                data,
                resp.status,
                `No se pudo leer la configuración (${resp.status}) → ${url}`
            );
            return null;
        }
        if (data.spInstalado === false) {
            await ofrecerInstalar('Falta el procedimiento usp_RelacionAutomatica_RipsFactura');
        }
        pintar(data);
        return data;
    }

    async function guardar(activo) {
        saving = true;
        try {
            const resp = await fetch(`${apiBase()}/apiV3/Rips/relacion-automatica-factura`, {
                method: 'PUT',
                headers: authHeaders(true),
                body: JSON.stringify({ activo: Boolean(activo) }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                if (esTablaAusente(data, data.error, resp.status)) {
                    const ok = await ofrecerInstalar(data.error);
                    if (ok) await guardar(activo);
                    return;
                }
                throw new Error(data.error || 'No se pudo guardar');
            }
            await Swal.fire({
                icon: 'success',
                text: data.message || (activo ? 'Activado' : 'Desactivado'),
                timer: 1800,
                showConfirmButton: false,
            });
            await cargar();
        } finally {
            saving = false;
        }
    }

    async function ejecutarAhora() {
        Swal.fire({
            title: 'Ejecutando lote…',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        try {
            const resp = await fetch(
                `${apiBase()}/apiV3/Rips/relacion-automatica-factura/ejecutar-ahora`,
                {
                    method: 'POST',
                    headers: authHeaders(true),
                    body: '{}',
                }
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                if (esTablaAusente(data, data.error, resp.status)) {
                    Swal.close();
                    await ofrecerInstalar(data.error);
                    return;
                }
                throw new Error(data.error || 'No se pudo ejecutar');
            }
            await Swal.fire({
                icon: 'success',
                title: 'Lote ejecutado',
                text: data.message || `Relacionados: ${data.relacionados || 0}`,
            });
            await cargar();
        } catch (e) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: e.message || String(e),
            });
        }
    }

    function init() {
        el.btnRecargar?.addEventListener('click', () => {
            cargar().catch((e) => Swal.fire({ icon: 'error', text: e.message || String(e) }));
        });
        el.btnEjecutar?.addEventListener('click', () => {
            Swal.fire({
                icon: 'question',
                title: '¿Ejecutar lote ahora?',
                text: 'Correrá el SP una vez (con TOP configurado), aunque el switch esté apagado.',
                showCancelButton: true,
                confirmButtonText: 'Ejecutar',
                cancelButtonText: 'Cancelar',
            }).then((r) => {
                if (r.isConfirmed) ejecutarAhora();
            });
        });
        el.sw?.addEventListener('change', () => {
            if (saving) return;
            const next = Boolean(el.sw.checked);
            el.sw.checked = !next;
            Swal.fire({
                icon: 'question',
                title: next ? '¿Activar relación automática?' : '¿Desactivar relación automática?',
                text: next
                    ? 'Cada ~30 min el backend relacionará un lote de RIPS AC/AP con facturas del mismo día.'
                    : 'Dejará de correr el lote automático. Lo ya relacionado no se toca.',
                showCancelButton: true,
                confirmButtonText: next ? 'Activar' : 'Desactivar',
                cancelButtonText: 'Cancelar',
            }).then((r) => {
                if (!r.isConfirmed) {
                    cargar().catch(() => {});
                    return;
                }
                guardar(next).catch((e) => {
                    Swal.fire({ icon: 'error', text: e.message || String(e) });
                    cargar().catch(() => {});
                });
            });
        });
        cargar().catch((e) => Swal.fire({ icon: 'error', text: e.message || String(e) }));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/**
 * Switch: relación automática RIPS ↔ Factura
 * GET/PUT /apiV3/Rips/relacion-automatica-factura
 * POST .../ensure-install
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
        return '';
    }

    const el = {
        sw: document.getElementById('switchRelacionAuto'),
        lblEstado: document.getElementById('lblEstado'),
        lblFecha: document.getElementById('lblFecha'),
        btnRecargar: document.getElementById('btnRecargar'),
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

    function pintar(activo, fecha) {
        if (el.sw) el.sw.checked = Boolean(activo);
        if (el.lblEstado) {
            el.lblEstado.textContent = activo ? 'Activado' : 'Desactivado';
            el.lblEstado.classList.toggle('on', Boolean(activo));
            el.lblEstado.classList.toggle('off', !activo);
        }
        if (el.lblFecha) {
            if (fecha) {
                try {
                    el.lblFecha.textContent = 'Último cambio: ' + new Date(fecha).toLocaleString('es-CO');
                } catch (_) {
                    el.lblFecha.textContent = 'Último cambio: ' + String(fecha);
                }
            } else {
                el.lblFecha.textContent = '';
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
                '<p class="mb-2">Esta base no tiene la configuración/triggers de relación automática RIPS↔Factura.</p>'
                + '<p class="mb-0 small text-muted">¿Desea instalarlos ahora? Quedará <strong>desactivado</strong> hasta que active el switch.</p>',
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
            await Swal.fire({
                icon: 'error',
                title: 'Ruta no encontrada (API)',
                html:
                    '<p class="mb-2">El <strong>front</strong> (puerto 3100) ya tiene la pantalla, pero el <strong>backend</strong> (puerto 3000) no responde esa ruta.</p>'
                    + '<ol class="text-start small mb-0">'
                    + '<li>En la carpeta del proyecto: <code>git pull</code></li>'
                    + '<li>Pare el Node del backend (Ctrl+C)</li>'
                    + '<li>Arranque de nuevo: <code>cd back_relacionador\\server</code> → <code>node .\\server.js</code></li>'
                    + '<li>Pruebe: <code>http://localhost:3000/apiV3/Rips/relacion-automatica-factura</code></li>'
                    + '</ol>',
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
                    + '<p class="small text-muted mb-0">El front (3100) está arriba, pero el API (normalmente puerto 3000) no está corriendo o apunta a otra carpeta. '
                    + 'Pare Node, haga <code>git pull</code> en la misma carpeta del backend y ejecute <code>node .\\server.js</code>.</p>',
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
        pintar(data.activo, data.fechaActualizacion);
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
            pintar(data.activo, new Date().toISOString());
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

    function init() {
        el.btnRecargar?.addEventListener('click', () => {
            cargar().catch((e) => Swal.fire({ icon: 'error', text: e.message || String(e) }));
        });
        el.sw?.addEventListener('change', () => {
            if (saving) return;
            const next = Boolean(el.sw.checked);
            el.sw.checked = !next;
            Swal.fire({
                icon: 'question',
                title: next ? '¿Activar relación automática?' : '¿Desactivar relación automática?',
                text: next
                    ? 'Las facturas y RIPS AC/AP nuevos del mismo día se relacionarán solos.'
                    : 'Dejará de relacionar automáticamente. Lo ya relacionado no se toca.',
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

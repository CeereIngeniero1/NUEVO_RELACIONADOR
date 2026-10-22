/**
 * Switch: relación automática RIPS ↔ Factura
 * GET/PUT /apiV3/Rips/relacion-automatica-factura
 */
(function () {
    'use strict';

    function authHeaders() {
        const h = { 'Content-Type': 'application/json' };
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

    async function cargar() {
        const resp = await fetch(`${apiBase()}/apiV3/Rips/relacion-automatica-factura`, {
            headers: authHeaders(),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            throw new Error(data.error || 'No se pudo leer la configuración');
        }
        pintar(data.activo, data.fechaActualizacion);
        return data;
    }

    async function guardar(activo) {
        saving = true;
        try {
            const resp = await fetch(`${apiBase()}/apiV3/Rips/relacion-automatica-factura`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ activo: Boolean(activo) }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
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
            // revert visual until confirmed
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

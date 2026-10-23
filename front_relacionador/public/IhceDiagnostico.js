/**
 * Diagnóstico IHCE — pruebas tipo Postman (sin $enviar-*).
 */
(function () {
    'use strict';

    function apiBase() {
        if (typeof window.getApiBaseUrl === 'function') {
            return String(window.getApiBaseUrl()).replace(/\/$/, '');
        }
        const cfg = window.__APP_CONFIG__ || {};
        if (cfg.API_BASE_URL) return String(cfg.API_BASE_URL).replace(/\/$/, '');
        const host = (window.location && window.location.hostname) || 'localhost';
        return `http://${host}:${cfg.BACK_PORT || '3000'}`;
    }

    function authHeaders(json) {
        const h = {};
        if (json) h['Content-Type'] = 'application/json';
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (token) h.Authorization = `Bearer ${token}`;
        return h;
    }

    function docEmpresa() {
        return String(sessionStorage.getItem('empresaTrabajarExecuted') || '').trim();
    }

    const el = {
        lblDoc: document.getElementById('lblDocumentoEmpresa'),
        selAmbiente: document.getElementById('selAmbiente'),
        selOperacion: document.getElementById('selOperacion'),
        boxOrg: document.getElementById('boxOrg'),
        boxPaciente: document.getElementById('boxPaciente'),
        boxExtra: document.getElementById('boxExtra'),
        inpNit: document.getElementById('inpNit'),
        inpReps: document.getElementById('inpReps'),
        inpOrgName: document.getElementById('inpOrgName'),
        inpTipoDoc: document.getElementById('inpTipoDoc'),
        inpNumDoc: document.getElementById('inpNumDoc'),
        inpHuman: document.getElementById('inpHuman'),
        inpExtra: document.getElementById('inpExtra'),
        btnProbar: document.getElementById('btnProbar'),
        btnToken: document.getElementById('btnToken'),
        btnOrg: document.getElementById('btnOrg'),
        btnPac: document.getElementById('btnPac'),
        outJson: document.getElementById('outJson'),
        lblStatus: document.getElementById('lblStatus'),
    };

    const OPS_NEED_ORG = new Set(['consultar-organizacion', 'consultar-eapb']);
    const OPS_NEED_PAC = new Set([
        'consultar-paciente-exacto',
        'consultar-paciente-similar',
        'consultar-profesional-salud',
        'consultar-inmunizacion',
        'consultar-dispensacion-paciente',
        'listar-rdas-pacientes-composition',
        'listar-rdas-encuentros-clinicos-composition',
        'listar-document-reference-index',
    ]);
    const OPS_NEED_EXTRA = new Set([
        'consultar-rda-por-id-composition',
        'terminologia-lookup',
        'terminologia-validate-code',
        'terminologia-consultar-codificaciones-modificadas',
    ]);

    function syncBoxes() {
        const op = el.selOperacion.value;
        el.boxOrg.classList.toggle('d-none', !OPS_NEED_ORG.has(op));
        el.boxPaciente.classList.toggle('d-none', !OPS_NEED_PAC.has(op));
        el.boxExtra.classList.toggle('d-none', !OPS_NEED_EXTRA.has(op));
    }

    function paintResult(data, httpOk) {
        const ok = data && data.ok !== false && httpOk;
        el.lblStatus.innerHTML = ok
            ? `<span class="diag-badge-ok">OK</span> ${data.status != null ? 'HTTP ' + data.status : ''} ${data.ms != null ? data.ms + ' ms' : ''}`
            : `<span class="diag-badge-bad">ERROR</span> ${data && data.status != null ? 'HTTP ' + data.status : ''} ${data && data.ms != null ? data.ms + ' ms' : ''}`;
        el.outJson.textContent = JSON.stringify(data, null, 2);
    }

    function buildBody(operacion) {
        const body = {
            operacion,
            ambiente: el.selAmbiente.value,
            documentoEmpresa: docEmpresa(),
        };
        if (OPS_NEED_ORG.has(operacion)) {
            if (el.inpNit.value.trim()) body.TaxIdentifier = el.inpNit.value.trim();
            if (el.inpReps.value.trim()) body.HealthcareProviderIdentifier = el.inpReps.value.trim();
            if (el.inpOrgName.value.trim()) body.name = el.inpOrgName.value.trim();
        }
        if (OPS_NEED_PAC.has(operacion)) {
            body.tipoDocumento = el.inpTipoDoc.value.trim() || 'CC';
            body.numeroDocumento = el.inpNumDoc.value.trim();
            if (el.inpHuman.value.trim()) body.humanuser = el.inpHuman.value.trim();
        }
        if (OPS_NEED_EXTRA.has(operacion)) {
            const extra = el.inpExtra.value.trim();
            if (operacion === 'consultar-rda-por-id-composition') {
                body.compositionId = extra;
            } else if (operacion === 'terminologia-validate-code' || operacion === 'terminologia-lookup') {
                if (extra.startsWith('{')) {
                    try {
                        body.parameters = JSON.parse(extra);
                    } catch (_) {
                        body.code = extra;
                    }
                } else {
                    body.code = extra;
                }
            } else if (operacion === 'terminologia-consultar-codificaciones-modificadas') {
                body.since = extra || '2026-04-01';
            } else if (extra.startsWith('{')) {
                body.parametersJson = extra;
            }
        }
        return body;
    }

    async function probar(operacion) {
        const op = operacion || el.selOperacion.value;
        if (!op) {
            Swal.fire({ icon: 'warning', text: 'Seleccione una operación' });
            return;
        }
        el.outJson.textContent = 'Ejecutando…';
        el.lblStatus.textContent = '';
        try {
            const resp = await fetch(`${apiBase()}/apiV3/Rda/ihce-diagnostico/probar`, {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(buildBody(op)),
            });
            const data = await resp.json().catch(() => ({ ok: false, error: `HTTP ${resp.status}` }));
            paintResult(data, resp.ok);
            if (!resp.ok && data.code === 'IHCE_DIAG_ENVIO_BLOQUEADO') {
                Swal.fire({
                    icon: 'info',
                    title: 'Envío bloqueado',
                    text: data.error || 'Esta pantalla no permite enviar RDA.',
                });
            }
        } catch (e) {
            paintResult({ ok: false, error: e.message || String(e) }, false);
        }
    }

    async function cargarOps() {
        const resp = await fetch(`${apiBase()}/apiV3/Rda/ihce-diagnostico/operaciones`, {
            headers: authHeaders(false),
        });
        const data = await resp.json().catch(() => ({}));
        const ops = (data && data.operaciones) || [];
        el.selOperacion.innerHTML = '';
        ops.forEach((o) => {
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = `${o.id}  (${o.method})`;
            el.selOperacion.appendChild(opt);
        });
        if (!ops.length) {
            el.selOperacion.innerHTML = '<option value="">(no se cargaron operaciones — ¿backend reiniciado?)</option>';
        }
        el.selOperacion.value = 'consultar-organizacion';
        syncBoxes();
    }

    function init() {
        if (el.lblDoc) el.lblDoc.textContent = docEmpresa() || '(sin empresa en sesión)';
        el.selOperacion?.addEventListener('change', syncBoxes);
        el.btnProbar?.addEventListener('click', () => probar());
        el.btnToken?.addEventListener('click', () => {
            el.selOperacion.value = 'obtener-token';
            syncBoxes();
            probar('obtener-token');
        });
        el.btnOrg?.addEventListener('click', () => {
            el.selOperacion.value = 'consultar-organizacion';
            syncBoxes();
            probar('consultar-organizacion');
        });
        el.btnPac?.addEventListener('click', () => {
            el.selOperacion.value = 'consultar-paciente-exacto';
            syncBoxes();
            probar('consultar-paciente-exacto');
        });
        cargarOps().catch((e) => {
            el.outJson.textContent = 'No se pudo cargar operaciones: ' + (e.message || e);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

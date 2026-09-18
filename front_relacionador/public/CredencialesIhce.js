/**
 * Módulo: Credenciales IHCE por empresa (sandbox + prod).
 * GET/PUT /apiV3/Rda/credenciales-ihce/:documentoEmpresa
 */
(function () {
    'use strict';

    function documentoEmpresaSesion() {
        return String(sessionStorage.getItem('empresaTrabajarExecuted') || '').trim();
    }

    function authHeaders() {
        const h = {};
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
        lblDoc: document.getElementById('lblDocumentoEmpresa'),
        btnRecargar: document.getElementById('btnRecargar'),
        formSandbox: document.getElementById('formSandbox'),
        formProd: document.getElementById('formProd'),
    };

    const state = {
        documentoEmpresa: '',
        sandbox: null,
        prod: null,
    };

    const FIELDS = {
        sandbox: {
            baseUrl: 'sbBaseUrl',
            tenantId: 'sbTenantId',
            clientId: 'sbClientId',
            clientSecret: 'sbClientSecret',
            scope: 'sbScope',
            subscriptionKey: 'sbSubKey',
            custodianReps: 'sbReps',
            custodianNit: 'sbNit',
            custodianName: 'sbName',
        },
        prod: {
            baseUrl: 'prBaseUrl',
            tenantId: 'prTenantId',
            clientId: 'prClientId',
            clientSecret: 'prClientSecret',
            scope: 'prScope',
            subscriptionKey: 'prSubKey',
            custodianReps: 'prReps',
            custodianNit: 'prNit',
            custodianName: 'prName',
        },
    };

    function fillForm(ambiente, data) {
        const map = FIELDS[ambiente];
        const d = data || {};
        document.getElementById(map.baseUrl).value = d.baseUrl || '';
        document.getElementById(map.tenantId).value = d.tenantId || '';
        document.getElementById(map.clientId).value = d.clientId || '';
        document.getElementById(map.scope).value = d.scope || '';
        document.getElementById(map.custodianReps).value = d.custodianReps || '';
        document.getElementById(map.custodianNit).value = d.custodianNit || '';
        document.getElementById(map.custodianName).value = d.custodianName || '';
        document.getElementById(map.clientSecret).value = '';
        document.getElementById(map.subscriptionKey).value = '';
        document.getElementById(map.clientSecret).placeholder = d.tieneClientSecret
            ? '•••••••• (vacío = no cambiar)'
            : 'Obligatorio la primera vez';
        document.getElementById(map.subscriptionKey).placeholder = d.tieneSubscriptionKey
            ? '•••••••• (vacío = no cambiar)'
            : 'Obligatoria la primera vez';
    }

    function readForm(ambiente) {
        const map = FIELDS[ambiente];
        const prev = state[ambiente] || {};
        return {
            ambiente,
            baseUrl: document.getElementById(map.baseUrl).value.trim(),
            tenantId: document.getElementById(map.tenantId).value.trim(),
            clientId: document.getElementById(map.clientId).value.trim(),
            clientSecret: document.getElementById(map.clientSecret).value || '',
            scope: document.getElementById(map.scope).value.trim(),
            subscriptionKey: document.getElementById(map.subscriptionKey).value || '',
            custodianReps: document.getElementById(map.custodianReps).value.trim(),
            custodianNit: document.getElementById(map.custodianNit).value.trim(),
            custodianName: document.getElementById(map.custodianName).value.trim(),
            _prev: prev,
        };
    }

    function validatePayload(p) {
        if (!p.baseUrl || !p.tenantId || !p.clientId || !p.scope) {
            return 'Base URL, Tenant Id, Client Id y Scope son obligatorios';
        }
        if (!p.clientSecret && !p._prev.tieneClientSecret) {
            return 'Client Secret es obligatorio la primera vez';
        }
        if (!p.subscriptionKey && !p._prev.tieneSubscriptionKey) {
            return 'Subscription Key es obligatoria la primera vez';
        }
        return '';
    }

    async function cargar() {
        const doc = documentoEmpresaSesion();
        state.documentoEmpresa = doc;
        if (el.lblDoc) el.lblDoc.textContent = doc || '(sin empresa en sesión)';
        if (!doc) {
            Swal.fire({
                icon: 'warning',
                text: 'Seleccione una empresa en el login antes de configurar IHCE.',
            });
            return;
        }
        const resp = await fetch(
            `${apiBase()}/apiV3/Rda/credenciales-ihce/${encodeURIComponent(doc)}`,
            { headers: authHeaders() }
        );
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            throw new Error(data.error || 'No se pudieron cargar las credenciales');
        }
        state.sandbox = data.sandbox || null;
        state.prod = data.prod || null;
        fillForm('sandbox', state.sandbox);
        fillForm('prod', state.prod);
    }

    async function guardar(ambiente) {
        const doc = state.documentoEmpresa || documentoEmpresaSesion();
        if (!doc) {
            Swal.fire({ icon: 'warning', text: 'No hay empresa en sesión.' });
            return;
        }
        const payload = readForm(ambiente);
        const err = validatePayload(payload);
        if (err) {
            Swal.fire({ icon: 'warning', text: err });
            return;
        }
        const { _prev, ...body } = payload;
        const resp = await fetch(
            `${apiBase()}/apiV3/Rda/credenciales-ihce/${encodeURIComponent(doc)}`,
            {
                method: 'PUT',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }
        );
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            throw new Error(data.error || 'No se guardaron las credenciales');
        }
        Swal.fire({
            icon: 'success',
            text: `Credenciales IHCE (${ambiente}) guardadas para ${doc}.`,
        });
        await cargar();
    }

    function init() {
        el.btnRecargar?.addEventListener('click', () => {
            cargar().catch((e) => Swal.fire({ icon: 'error', text: e.message || String(e) }));
        });
        el.formSandbox?.addEventListener('submit', (ev) => {
            ev.preventDefault();
            guardar('sandbox').catch((e) => Swal.fire({ icon: 'error', text: e.message || String(e) }));
        });
        el.formProd?.addEventListener('submit', (ev) => {
            ev.preventDefault();
            guardar('prod').catch((e) => Swal.fire({ icon: 'error', text: e.message || String(e) }));
        });
        cargar().catch((e) => Swal.fire({ icon: 'error', text: e.message || String(e) }));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

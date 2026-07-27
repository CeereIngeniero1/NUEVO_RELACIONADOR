(function () {
    'use strict';

    function apiBase() {
        if (typeof window.getApiBaseUrl === 'function') {
            const b = String(window.getApiBaseUrl() || '').replace(/\/$/, '');
            if (b) return b;
        }
        const cfg = window.__APP_CONFIG__ || {};
        const port = cfg.BACK_PORT != null && cfg.BACK_PORT !== '' ? String(cfg.BACK_PORT) : '3000';
        const h = (typeof window.location !== 'undefined' && window.location.hostname) || 'localhost';
        return `http://${h}:${port}`;
    }

    function authHeaders() {
        const token = localStorage.getItem('token');
        const h = { 'Content-Type': 'application/json' };
        if (token) h.Authorization = token;
        return h;
    }

    const params = new URLSearchParams(window.location.search);
    const tipo = (params.get('tipo') || '').toLowerCase() === 'ce' ? 'ce' : 'paciente';
    const id = parseInt(params.get('id') || '', 10);
    const ambienteParam = String(params.get('ambiente') || '').toLowerCase();

    const el = {
        lblContexto: document.getElementById('lblContexto'),
        campos: document.getElementById('camposContainer'),
        frm: document.getElementById('frmCorregir'),
        btnReenviar: document.getElementById('btnReenviar'),
        selAmbiente: document.getElementById('selAmbiente'),
    };

    const FIELDS = {
        paciente: [
            { key: 'Documento Entidad', payload: 'DocumentoEntidad', label: 'Documento', type: 'text' },
            { key: 'Id Tipo Documento', payload: 'IdTipoDocumento', label: 'Id Tipo Documento', type: 'number' },
            { key: 'Primer Apellido Entidad', payload: 'PrimerApellidoEntidad', label: 'Primer Apellido', type: 'text' },
            { key: 'Segundo Apellido Entidad', payload: 'SegundoApellidoEntidad', label: 'Segundo Apellido', type: 'text' },
            { key: 'Primer Nombre Entidad', payload: 'PrimerNombreEntidad', label: 'Primer Nombre', type: 'text' },
            { key: 'Segundo Nombre Entidad', payload: 'SegundoNombreEntidad', label: 'Segundo Nombre', type: 'text' },
            { key: 'Fecha Nacimiento', payload: 'FechaNacimiento', label: 'Fecha Nacimiento', type: 'datetime-local' },
            { key: 'Edad', payload: 'Edad', label: 'Edad', type: 'number', step: 'any' },
            { key: 'Id Sexo Biologico', payload: 'IdSexoBiologico', label: 'Id Sexo Biológico', type: 'number' },
            { key: 'Id Identidad Genero', payload: 'IdIdentidadGenero', label: 'Id Identidad Género', type: 'number' },
            { key: 'Id Pais Nacionalidad', payload: 'IdPaisNacionalidad', label: 'Id País Nacionalidad', type: 'number' },
            { key: 'Id Pais Recidencia', payload: 'IdPaisRecidencia', label: 'Id País Residencia', type: 'number' },
            { key: 'Id Municipio Recidencia', payload: 'IdMunicipioRecidencia', label: 'Id Municipio Residencia', type: 'number' },
            { key: 'Id Zona Residencia', payload: 'IdZonaResidencia', label: 'Id Zona Residencia', type: 'number' },
            { key: 'Id Etnia', payload: 'IdEtnia', label: 'Id Etnia', type: 'number' },
            { key: 'Id Discapacidad', payload: 'IdDiscapacidad', label: 'Id Discapacidad', type: 'number' },
            { key: 'Dirección', payload: 'Direccion', label: 'Dirección', type: 'text' },
            { key: 'Teléfono Celular', payload: 'TelefonoCelular', label: 'Teléfono', type: 'text' },
            { key: 'Talla', payload: 'Talla', label: 'Talla', type: 'text' },
            { key: 'Peso', payload: 'Peso', label: 'Peso', type: 'text' },
        ],
        ce: [
            { key: 'Documento Entidad', payload: 'DocumentoEntidad', label: 'Documento', type: 'text' },
            { key: 'Codigo Prestador', payload: 'CodigoPrestador', label: 'Código Prestador', type: 'text' },
            { key: 'Codigo Admin Plan Beneficios', payload: 'CodigoAdminPlanBeneficios', label: 'Código Plan Beneficios', type: 'text' },
            { key: 'Nombre Admin Plan Beneficios', payload: 'NombreAdminPlanBeneficios', label: 'Nombre Plan Beneficios', type: 'text' },
            { key: 'Fecha Hora Inicio Atencion', payload: 'FechaHoraInicioAtencion', label: 'Fecha/Hora Inicio', type: 'datetime-local' },
            { key: 'Fecha Hora Fin Atencion', payload: 'FechaHoraFinAtencion', label: 'Fecha/Hora Fin', type: 'datetime-local' },
            { key: 'Tipo Doc Profesional', payload: 'TipoDocProfesional', label: 'Tipo Doc Profesional', type: 'text' },
            { key: 'Num Doc Profesional', payload: 'NumDocProfesional', label: 'Num Doc Profesional', type: 'text' },
            { key: 'Diagnostico Ingreso CIE11 Codigo', payload: 'DiagnosticoIngresoCIE11Codigo', label: 'Diag Ingreso CIE11 Código', type: 'text' },
            { key: 'Diagnostico Ingreso CIE11 Termino', payload: 'DiagnosticoIngresoCIE11Termino', label: 'Diag Ingreso CIE11 Término', type: 'text' },
            { key: 'Id Modalidad Atencion', payload: 'IdModalidadAtencion', label: 'Id Modalidad Atención', type: 'number' },
            { key: 'Id Grupo Servicios', payload: 'IdGrupoServicios', label: 'Id Grupo Servicios', type: 'number' },
            { key: 'Id Via Ingreso Usuario', payload: 'IdViaIngresoUsuario', label: 'Id Vía Ingreso Usuario', type: 'number' },
            { key: 'Id Causa Motivo Atencion', payload: 'IdCausaMotivoAtencion', label: 'Id Causa Motivo Atención', type: 'number' },
        ],
    };

    const state = { registroPaciente: null, registroCe: null, idPaciente: null, idCe: null };

    function toLocalInput(v) {
        if (!v) return '';
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function esc(v) {
        return String(v == null ? '' : v).replace(/"/g, '&quot;');
    }

    function renderSection(title, kind, registro) {
        const fields = FIELDS[kind];
        const html = fields.map((f) => {
            const raw = registro ? registro[f.key] : '';
            const value = f.type === 'datetime-local' ? toLocalInput(raw) : (raw == null ? '' : String(raw));
            return `
                <div class="col-12 col-md-6 col-lg-4">
                    <label class="form-label small fw-semibold">${f.label}</label>
                    <input class="form-control form-control-sm" data-kind="${kind}" data-payload="${f.payload}" type="${f.type}" value="${esc(value)}" ${f.step ? `step="${f.step}"` : ''} />
                </div>
            `;
        }).join('');
        return `
            <div class="col-12 mt-2"><h2 class="h6 text-uppercase fw-bold mb-2" style="color: var(--color-text-secondary);">${title}</h2></div>
            ${html}
        `;
    }

    function renderForm() {
        const bloques = [];
        bloques.push(renderSection('RDA Paciente', 'paciente', state.registroPaciente));
        bloques.push(renderSection('RDA Consulta Externa', 'ce', state.registroCe));
        el.campos.innerHTML = bloques.join('');
    }

    async function load() {
        if (!Number.isFinite(id)) throw new Error('Id inválido.');
        if (ambienteParam && ambienteParam !== 'prod') {
            throw new Error('La corrección RDA está habilitada solo para Producción.');
        }
        el.selAmbiente.value = 'prod';
        el.selAmbiente.disabled = true;

        el.lblContexto.textContent = `Corrigiendo ${tipo === 'ce' ? 'RDA Consulta Externa' : 'RDA Paciente'} #${id} (Producción)`;
        const resp = await fetch(`${apiBase()}/apiV3/RdaEnvioMasivo/${tipo}/${id}`, { headers: authHeaders() });
        const data = await resp.json();
        if (!resp.ok || !data.ok) throw new Error(data.error || 'No se pudo cargar el registro.');

        state.registroPaciente = data.registroPaciente || null;
        state.registroCe = data.registroCe || null;
        state.idPaciente = data.idPaciente || null;
        state.idCe = data.idCe || null;
        if (!state.registroPaciente && !state.registroCe) throw new Error('No hay datos para corrección.');
        renderForm();
    }

    function payloadFromKind(kind) {
        const payload = {};
        el.campos.querySelectorAll(`input[data-kind="${kind}"][data-payload]`).forEach((inp) => {
            payload[inp.dataset.payload] = inp.value;
        });
        return payload;
    }

    async function guardar(e) {
        e.preventDefault();
        const payloadCe = state.idCe ? payloadFromKind('ce') : null;
        if (payloadCe && (payloadCe.FechaHoraInicioAtencion || payloadCe.FechaHoraFinAtencion)) {
            const d1 = payloadCe.FechaHoraInicioAtencion ? new Date(payloadCe.FechaHoraInicioAtencion) : null;
            const d2 = payloadCe.FechaHoraFinAtencion ? new Date(payloadCe.FechaHoraFinAtencion) : null;
            const ahoraMs = Date.now() + 60 * 1000;
            if ((d1 && !Number.isNaN(d1.getTime()) && d1.getTime() > ahoraMs)
                || (d2 && !Number.isNaN(d2.getTime()) && d2.getTime() > ahoraMs)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Fecha de atención',
                    text: 'La fecha y hora de atención (inicio y fin) no pueden ser futuras. IHCE rechaza encuentros posteriores a la hora actual.',
                });
                return;
            }
            if (d1 && d2 && !Number.isNaN(d1.getTime()) && !Number.isNaN(d2.getTime()) && d2 <= d1) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Fecha de atención',
                    text: 'La hora de fin debe ser posterior a la de inicio.',
                });
                return;
            }
        }
        const reqs = [];
        if (state.idPaciente) {
            reqs.push(fetch(`${apiBase()}/apiV3/RdaEnvioMasivo/paciente/${state.idPaciente}/corregir`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payloadFromKind('paciente')),
            }));
        }
        if (state.idCe) {
            reqs.push(fetch(`${apiBase()}/apiV3/RdaEnvioMasivo/ce/${state.idCe}/corregir`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payloadCe),
            }));
        }
        const resps = await Promise.all(reqs);
        for (const r of resps) {
            const d = await r.json();
            if (!r.ok || !d.ok) throw new Error(d.error || 'No se pudo guardar la corrección.');
        }
        Swal.fire({ icon: 'success', title: 'Guardado', text: 'Correcciones guardadas para RDA Paciente y Consulta Externa.' });
    }

    async function reenviar() {
        const ambiente = 'prod';
        const outcomes = [];
        if (state.idPaciente) {
            const respP = await fetch(`${apiBase()}/apiV3/RdaEnvioMasivo/paciente/enviar`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ ids: [state.idPaciente], ambiente }),
            });
            const dataP = await respP.json();
            outcomes.push({ tipo: 'RDA Paciente', data: dataP, okHttp: respP.ok });
        }
        if (state.idCe) {
            const respC = await fetch(`${apiBase()}/apiV3/RdaEnvioMasivo/ce/enviar`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ ids: [state.idCe], ambiente }),
            });
            const dataC = await respC.json();
            outcomes.push({ tipo: 'RDA Consulta Externa', data: dataC, okHttp: respC.ok });
        }

        const lines = outcomes.map((o) => {
            const r = Array.isArray(o.data?.resultados) ? o.data.resultados[0] : null;
            const ok = !!(o.okHttp && o.data?.ok && r?.ok);
            return `${o.tipo}: ${ok ? 'OK' : 'Error'}${r ? ` (HTTP ${r.httpStatus})` : ''}`;
        });
        const allOk = lines.every((l) => l.includes('OK'));
        Swal.fire({
            icon: allOk ? 'success' : 'warning',
            title: allOk ? 'Envío exitoso' : 'Envío con observaciones',
            html: lines.join('<br>'),
        });
    }

    async function init() {
        try {
            await load();
            el.frm.addEventListener('submit', async (e) => {
                try { await guardar(e); } catch (err) { Swal.fire({ icon: 'error', title: 'Guardar', text: err.message || String(err) }); }
            });
            el.btnReenviar.addEventListener('click', async () => {
                try { await reenviar(); } catch (err) { Swal.fire({ icon: 'error', title: 'Reenviar', text: err.message || String(err) }); }
            });
        } catch (err) {
            console.error('[Corregir_RDA] init:', err);
            Swal.fire({ icon: 'error', title: 'Carga', text: err.message || String(err) });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/**
 * RDA Consulta Externa — guardar (antes inline en Asignar_RIPS V3.html).
 */
import {
    guardarEvaluacionPacientePrincipal,
    guardarEvaluacionCEPrincipal,
    postAntecedenteSaludCE,
    postAntecedenteFamCE,
    postAntecedenteFarmCE,
    postDiagnosticoRelacionadoCE,
    postPrescripcionMedCE,
    postPrescripcionProcCE,
    postOtraTecCE,
    urlResumenClinicoPdf,
    fetchBlobAuthenticated,
} from '../api/entidad1888.js';
import { openIhceBundlePreview, openIhceJsonModal, extractIhceMessage } from './ihceAsignar.js';
import { validarPacienteDemografia, bloquearSiPacienteSinGuardar } from '../../shared/pacienteDemografiaValidation.js';

function buildDescAntecedenteFamiliar(item) {
    const codigo = (item.codigo || '').trim();
    const descripcion = (item.descripcion || '').trim();
    if (codigo) return descripcion ? `${codigo} - ${descripcion}` : codigo;
    const c11 = (item.cie11Codigo || '').trim();
    const t11 = (item.cie11Termino || '').trim();
    if (c11) return t11 ? `${c11} - ${t11}` : c11;
    if (t11) return t11;
    return 'Sin descripción';
}

function rdaceSelect2Value(selectId) {
    const el = document.getElementById(selectId);
    if (!el) return null;
    try {
        const $ = window.jQuery;
        if ($ && $(el).data('select2')) {
            const d = $(el).select2('data')[0];
            return d && d.id != null ? String(d.id) : (el.value || null);
        }
    } catch (e) { /* ignore */ }
    return el.value || null;
}

function rdaceDigitsOnly(value) {
    if (value == null) return '';
    return String(value).replace(/\D+/g, '');
}

/** Prescripción procedimientos CE: lista en memoria, o CUPS del formulario RDACE / RIPS si aún no se agregó a la lista. */
function resolvePrescripcionProcedimientosCE() {
    const lista = (window.RDA?.getPrescripcionProcedimientos?.() || []);
    if (lista.length) return lista;

    const codigoRdace = rdaceSelect2Value('RDACE_CodigoProcedimiento') || rdaceGetInputValue('RDACE_CodigoProcedimiento');
    if (codigoRdace) {
        return [{
            tipo: 'Procedimiento',
            codigo: codigoRdace,
            nombre: rdaceGetInputValue('RDACE_NombreProcedimiento') || '',
            finalidad: rdaceSelect2Value('RDACE_FinalidadTecSaludProc') || rdaceGetInputValue('RDACE_FinalidadTecSaludProc') || null,
            fechaPrescripcion: rdaceGetInputValue('RDACE_FechaPrescripcionProc') || null,
        }];
    }

    const ripSel = document.getElementById('SelectProcedimientoRIPSAP1');
    const codigoRips = ripSel && ripSel.value && ripSel.value !== 'Sin Seleccionar' ? String(ripSel.value).trim() : '';
    if (codigoRips) {
        const opt = ripSel.options[ripSel.selectedIndex];
        return [{
            tipo: 'Procedimiento',
            codigo: codigoRips,
            nombre: opt ? String(opt.text || '').trim() : '',
            finalidad: null,
            fechaPrescripcion: null,
        }];
    }

    return [];
}

function rdaceGetInputValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return String(el.value || '').trim();
}

function rdaceMarkFieldInvalid(id, invalid) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
        if (invalid) {
            el.classList.add('is-invalid');
            el.style.borderColor = '#dc3545';
        } else {
            el.classList.remove('is-invalid');
            el.style.removeProperty('border-color');
        }
    } catch (e) { /* ignore */ }
}

function rdaceValidateRequiredForSave() {
    const required = [
        { id: 'RDACE_CodigoPrestador', label: 'Codigo Prestador', getValue: () => rdaceGetInputValue('RDACE_CodigoPrestador') },
        { id: 'RDACE_TipoDocProfesional', label: 'Tipo documento del profesional', getValue: () => rdaceGetInputValue('RDACE_TipoDocProfesional') },
        { id: 'RDACE_NumDocProfesional', label: 'Numero documento del profesional', getValue: () => rdaceSelect2Value('RDACE_NumDocProfesional') || rdaceGetInputValue('RDACE_NumDocProfesional') },
        { id: 'RDACE_IdModalidadAtencion', label: 'Modalidad tecnologia salud', getValue: () => rdaceGetInputValue('RDACE_IdModalidadAtencion') },
        { id: 'RDACE_IdGrupoServicios', label: 'Grupo servicios', getValue: () => rdaceGetInputValue('RDACE_IdGrupoServicios') },
        { id: 'RDACE_IdViaIngresoUsuario', label: 'Via ingreso usuario', getValue: () => rdaceGetInputValue('RDACE_IdViaIngresoUsuario') },
        { id: 'RDACE_IdCausaMotivoAtencion', label: 'Causa motivo atencion', getValue: () => rdaceGetInputValue('RDACE_IdCausaMotivoAtencion') },
        { id: 'RDACE_EntornoAtencion', label: 'Entorno de atencion', getValue: () => rdaceSelect2Value('RDACE_EntornoAtencion') || rdaceGetInputValue('RDACE_EntornoAtencion') },
        { id: 'RDACE_DiagPrincipalCIE10Codigo', label: 'Diagnostico principal CIE-10', getValue: () => rdaceSelect2Value('RDACE_DiagPrincipalCIE10Codigo') || rdaceGetInputValue('RDACE_DiagPrincipalCIE10Codigo') },
        { id: 'RDACE_TipoDiagPrincipalCIE10', label: 'Tipo diagnostico principal', getValue: () => rdaceSelect2Value('RDACE_TipoDiagPrincipalCIE10') || rdaceGetInputValue('RDACE_TipoDiagPrincipalCIE10') },
    ];

    const missing = [];
    required.forEach((f) => {
        const v = (typeof f.getValue === 'function') ? f.getValue() : rdaceGetInputValue(f.id);
        const isMissing = !(v != null && String(v).trim() !== '');
        rdaceMarkFieldInvalid(f.id, isMissing);
        if (isMissing) missing.push(f.label);
    });

    const procItems = resolvePrescripcionProcedimientosCE();
    const procCodigo = procItems.length && procItems.some((p) => p.codigo && String(p.codigo).trim());
    const procFinalidad = procItems.length && procItems.some((p) => p.finalidad && String(p.finalidad).trim());
    rdaceMarkFieldInvalid('RDACE_CodigoProcedimiento', !procCodigo);
    rdaceMarkFieldInvalid('RDACE_FinalidadTecSaludProc', !procFinalidad);
    if (!procCodigo) {
        missing.push('Código procedimiento (CUPS) — obligatorio para envío IHCE');
    }
    if (procCodigo && !procFinalidad) {
        missing.push('Finalidad tecnología salud del procedimiento — obligatoria para envío IHCE');
    }

    return missing;
}

function rdaceIsMissingRequired(v) {
    if (v == null) return true;
    const s = String(v).trim().toLowerCase();
    return s === '' || s === 'null' || s === 'undefined';
}

function rdaceValidatePacienteForSave() {
    return validarPacienteDemografia();
}

function rdaceAttachDigitsOnlyFilter(inputId) {
    const input = document.getElementById(inputId);
    if (!input || input.dataset?.digitsOnlyAttached === '1') return;
    try { input.dataset.digitsOnlyAttached = '1'; } catch (e) { /* ignore */ }

    input.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Enter'];
        if (allowed.indexOf(e.key) !== -1) return;
        if (/^\d$/.test(e.key)) return;
        e.preventDefault();
    });

    input.addEventListener('beforeinput', function (e) {
        const t = e.inputType || '';
        if (t.indexOf('insert') !== 0) return;
        const data = e.data == null ? '' : String(e.data);
        if (data && /\D/.test(data)) e.preventDefault();
    });

    input.addEventListener('paste', function (e) {
        const txt = (e.clipboardData && e.clipboardData.getData) ? (e.clipboardData.getData('text') || '') : '';
        const d = rdaceDigitsOnly(txt);
        e.preventDefault();
        const start = (input.selectionStart != null) ? input.selectionStart : input.value.length;
        const end = (input.selectionEnd != null) ? input.selectionEnd : input.value.length;
        const next = (input.value.slice(0, start) + d + input.value.slice(end));
        input.value = rdaceDigitsOnly(next);
        try {
            const caret = start + d.length;
            input.setSelectionRange(caret, caret);
        } catch (err) { /* ignore */ }
    });

    input.addEventListener('input', function () {
        const next = rdaceDigitsOnly(input.value);
        if (next !== input.value) input.value = next;
    });
}

function rdaceEscapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function rdaceIhceJsonButtonsHtml(unifiedSend) {
    let html =
        '<div class="mt-3 text-center d-flex flex-column gap-2">' +
        '<button type="button" class="btn btn-sm btn-outline-light" id="rdace-btn-json-resp-ce">Ver JSON respuesta — Consulta Externa</button>' +
        '<button type="button" class="btn btn-sm btn-outline-light" id="rdace-btn-json-env-ce">Ver JSON enviado — Consulta Externa</button>';
    if (unifiedSend) {
        html +=
            '<button type="button" class="btn btn-sm btn-outline-light" id="rdace-btn-json-resp-pac">Ver JSON respuesta — Paciente</button>' +
            '<button type="button" class="btn btn-sm btn-outline-light" id="rdace-btn-json-env-pac">Ver JSON enviado — Paciente</button>';
    }
    html += '</div>';
    return html;
}

function wireRdaceIhceJsonButtons(popup, { ambiente, idCE, idPacienteIhce, ceOut, pacienteOut, unifiedSend }) {
    const btnRespCe = popup.querySelector('#rdace-btn-json-resp-ce');
    if (btnRespCe && ceOut && ceOut.data != null) {
        btnRespCe.addEventListener('click', function () {
            openIhceJsonModal(
                'Respuesta IHCE — Consulta Externa (HTTP ' + (ceOut.status || '') + ')',
                ceOut.data
            );
        });
    }
    const btnEnvCe = popup.querySelector('#rdace-btn-json-env-ce');
    if (btnEnvCe && idCE) {
        btnEnvCe.addEventListener('click', function () {
            openIhceBundlePreview('rdace', idCE, ambiente);
        });
    }
    if (!unifiedSend) return;
    const btnRespPac = popup.querySelector('#rdace-btn-json-resp-pac');
    if (btnRespPac && pacienteOut && pacienteOut.data != null) {
        btnRespPac.addEventListener('click', function () {
            openIhceJsonModal(
                'Respuesta IHCE — Paciente (HTTP ' + (pacienteOut.status || '') + ')',
                pacienteOut.data
            );
        });
    }
    const btnEnvPac = popup.querySelector('#rdace-btn-json-env-pac');
    if (btnEnvPac && idPacienteIhce) {
        btnEnvPac.addEventListener('click', function () {
            openIhceBundlePreview('paciente', idPacienteIhce, ambiente);
        });
    }
}

function rdaceSummarizeSendOutcome(nombre, out) {
    if (!out) return `<b>${nombre}:</b> no ejecutado`;
    if (out.ok) {
        return `<b>${nombre}:</b> enviado correctamente (HTTP ${out.status})`;
    }
    const detail = extractIhceMessage(out.data);
    const panelStyle =
        'max-height:200px;overflow:auto;text-align:left;font-size:0.8rem;' +
        'background:#1e293b;color:#f1f5f9;border:1px solid rgba(148,163,184,0.35);' +
        'border-radius:0.375rem;padding:0.5rem;margin-top:0.35rem;line-height:1.45;';
    const detailHtml = detail
        ? `<div style="${panelStyle}">${rdaceEscapeHtml(detail).replace(/\n/g, '<br>')}</div>`
        : '';
    return `<b>${nombre}:</b> error (HTTP ${out.status}) — respuesta del Ministerio (IHCE):${detailHtml}`;
}

/** true = al enviar desde RDACE se guarda y envía también RDA Paciente; false = solo RDACE. */
function rdaceIhceUnifiedSendEnabled() {
    const cfg = typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};
    return cfg.RDA_IHCE_UNIFIED_SEND !== false;
}

async function rdaceGuardarPacienteDesdeConsulta({ documento, fhRdace }) {
    const selPrestador = document.getElementById('RDACE_CodigoPrestador');
    let nitPrestadorIps = null;
    let nombrePrestadorIps = null;
    if (selPrestador && selPrestador.value) {
        const optPrest = selPrestador.options[selPrestador.selectedIndex];
        if (optPrest) {
            const nitAttr = optPrest.getAttribute('data-nit');
            const nomAttr = optPrest.getAttribute('data-nombre');
            nitPrestadorIps = (nitAttr != null && String(nitAttr).trim()) ? String(nitAttr).trim() : String(selPrestador.value).trim() || null;
            nombrePrestadorIps = (nomAttr != null && String(nomAttr).trim()) ? String(nomAttr).trim() : null;
        }
    }

    const ahora = typeof window.colombiaDateTimeNowSql === 'function'
        ? window.colombiaDateTimeNowSql()
        : new Date().toISOString().slice(0, 19).replace('T', ' ');
    let cie11Termino = null;
    try {
        const $ = window.jQuery;
        if ($) {
            const cie11Data = $('#RDACE_DiagnosticoIngresoCIE11Termino').select2('data');
            cie11Termino = cie11Data?.length ? cie11Data[0].text : (document.getElementById('RDACE_DiagnosticoIngresoCIE11Termino')?.value || null);
        }
    } catch (e) {
        cie11Termino = document.getElementById('RDACE_DiagnosticoIngresoCIE11Termino')?.value || null;
    }

    const rawIdDiscapacidad = (document.getElementById('DiscapacidadBase')?.value || '').trim();
    const idDiscapacidadSeguro =
        !rawIdDiscapacidad || rawIdDiscapacidad.toLowerCase() === 'null' || rawIdDiscapacidad.toLowerCase() === 'undefined'
            ? '9'
            : rawIdDiscapacidad;

    const payloadPaciente = {
        DocumentoEntidad: documento,
        FechaRDA: ahora,
        IdTipoDocumento: document.getElementById('TipoDocumentoBase')?.value?.trim() || null,
        PrimerApellidoEntidad: document.getElementById('PrimerApellidoBase')?.value || null,
        SegundoApellidoEntidad: document.getElementById('SegundoApellidoBase')?.value || null,
        PrimerNombreEntidad: document.getElementById('PrimerNombreBase')?.value || null,
        SegundoNombreEntidad: document.getElementById('SegundoNombreBase')?.value || null,
        FechaNacimiento: document.getElementById('FechaNacimientoBase')?.value || null,
        Edad: document.getElementById('EdadPaciente')?.value || null,
        IdUnidaddeMedidaEdad: null,
        IdSexoBiologico: document.getElementById('SexoPaciente')?.value || null,
        IdIdentidadGenero: document.getElementById('IdentidadGeneroBase')?.value || null,
        IdPaisNacionalidad: document.getElementById('SelectNombrePaisNacionalidadBase')?.value || null,
        Talla: document.getElementById('TallaPaciente')?.value || null,
        Peso: document.getElementById('PesoPaciente')?.value || null,
        IdPaisRecidencia: document.getElementById('SelectNombrePaisResidenciaBase')?.value || null,
        IdMunicipioRecidencia: document.getElementById('SelectNombreMunicipioResidenciaBase')?.value || null,
        IdZonaResidencia: document.getElementById('ListaZonaTerritorialBase')?.value || null,
        Direccion: document.getElementById('DireccionPaciente')?.value || null,
        IdEtnia: document.getElementById('EtniaBase')?.value || null,
        ComunidadEtnica: document.getElementById('ComunidadEtnicaBase')?.value || null,
        IdDiscapacidad: idDiscapacidadSeguro,
        TelefonoCelular: document.getElementById('TelefonoPaciente')?.value || null,
        Alergeno: document.getElementById('NombreAlergenoBase')?.value || null,
        CodigoPrestador: document.getElementById('RDACE_CodigoPrestador')?.value || null,
        CodigoAdminPlanBeneficios: document.getElementById('RDACE_CodigoAdminPlanBeneficios')?.value || null,
        NombreAdminPlanBeneficios: document.getElementById('RDACE_NombreAdminPlanBeneficios')?.value || null,
        FechaHoraInicioAtencion: fhRdace.inicio,
        FechaHoraFinAtencion: fhRdace.fin,
        TipoDocProfesional: document.getElementById('RDACE_TipoDocProfesional')?.value || null,
        NumDocProfesional: rdaceSelect2Value('RDACE_NumDocProfesional') || document.getElementById('RDACE_NumDocProfesional')?.value || null,
        DiagnosticoIngresoCIE11Codigo: document.getElementById('RDACE_DiagnosticoIngresoCIE11Codigo')?.value || null,
        DiagnosticoIngresoCIE11Termino: cie11Termino || null,
        TipoAlergia: rdaceSelect2Value('RDACE_TipoAlergia'),
        IdModalidadAtencion: document.getElementById('RDACE_IdModalidadAtencion')?.value || null,
        IdGrupoServicios: document.getElementById('RDACE_IdGrupoServicios')?.value || null,
        NitPrestadorIPS: nitPrestadorIps,
        NombrePrestadorIPS: nombrePrestadorIps,
    };

    const out = await guardarEvaluacionPacientePrincipal(payloadPaciente);
    const id = out && out.IdEvaluacionEntidadRDA;
    if (!id) {
        throw new Error(out?.error || 'No se pudo guardar RDA Paciente para envío conjunto.');
    }
    return Number(id);
}

export function wireGuardarRdace() {
    rdaceAttachDigitsOnlyFilter('RDACE_DiasIncapacidad');
    rdaceAttachDigitsOnlyFilter('RDACE_DiasLicenciaMaternidad');

    document.getElementById('RDACE_BtnDescargarPdf')?.addEventListener('click', async function () {
        const id = document.getElementById('RDACE_IdEvaluacionActual')?.value?.trim();
        if (!id) {
            Swal.fire({ icon: 'info', title: 'PDF', text: 'Guarde primero el RDA Consulta Externa para generar el resumen clínico.' });
            return;
        }
        const pdfUrl = urlResumenClinicoPdf(id);
        try {
            const blob = await fetchBlobAuthenticated(pdfUrl);
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const rawName = document.getElementById('RDACE_NombreDocumentoPDF')?.value || ('RDA_CE_' + id + '.pdf');
            a.download = String(rawName).replace(/[^\w.\-]+/g, '_');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'PDF', text: err.message || 'No se pudo descargar el PDF.' });
        }
    });

    document.getElementById('RDACE_BtnGuardarConsultaExterna')?.addEventListener('click', async function () {
        await guardarRDACE();
    });
}

export async function guardarRDACE() {
    const btn = document.getElementById('RDACE_BtnGuardarConsultaExterna');
    const documento = document.getElementById('DocumentoPaciente')?.value?.trim();

    if (!documento) {
        Swal.fire({ icon: 'warning', title: 'Dato requerido', text: 'Seleccione un paciente antes de guardar el RDA Consulta Externa.' });
        return;
    }

    if (!bloquearSiPacienteSinGuardar()) return;

    const { faltantes: missingPaciente, corruptos: corruptosPaciente } = rdaceValidatePacienteForSave();
    if (corruptosPaciente.length) {
        Swal.fire({
            icon: 'warning',
            title: 'Datos del paciente inválidos',
            html: 'Hay campos con valor <b>null</b> (dato corrupto de la base de datos).'
                + ' Use <b>Actualizar datos paciente</b> para corregirlos antes de guardar o enviar.<br><br><b>Revisar:</b><br> - '
                + corruptosPaciente.join('<br> - '),
        });
        return;
    }
    if (missingPaciente.length) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos obligatorios del paciente pendientes',
            html: 'Complete los campos del paciente marcados con asterisco antes de guardar o enviar.<br><br><b>Faltan:</b><br> - '
                + missingPaciente.join('<br> - '),
        });
        return;
    }

    const ahora = typeof window.colombiaDateTimeNowSql === 'function'
        ? window.colombiaDateTimeNowSql()
        : new Date().toISOString().slice(0, 19).replace('T', ' ');
    let cie11TerminoCE = null;
    try {
        const $ = window.jQuery;
        if ($) {
            const cie11Data = $('#RDACE_DiagnosticoIngresoCIE11Termino').select2('data');
            cie11TerminoCE = cie11Data?.length ? cie11Data[0].text : (document.getElementById('RDACE_DiagnosticoIngresoCIE11Termino')?.value || null);
        }
    } catch (e) {
        cie11TerminoCE = document.getElementById('RDACE_DiagnosticoIngresoCIE11Termino')?.value || null;
    }

    const fhRdace = window.rdaParseFechaHorasAtencion('RDACE_');
    if (!fhRdace.ok) {
        Swal.fire({ icon: 'warning', title: 'Fecha y horas de atención', text: fhRdace.error });
        return;
    }

    const missingRequired = rdaceValidateRequiredForSave();
    if (missingRequired.length) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos obligatorios pendientes',
            html: 'Complete los campos marcados con asterisco antes de guardar.<br><br><b>Faltan:</b><br> - '
                + missingRequired.join('<br> - '),
        });
        return;
    }

    const payload = {
        DocumentoEntidad: documento,
        FechaRDA: ahora,
        CodigoPrestador: document.getElementById('RDACE_CodigoPrestador')?.value || null,
        CodigoAdminPlanBeneficios: document.getElementById('RDACE_CodigoAdminPlanBeneficios')?.value || null,
        NombreAdminPlanBeneficios: document.getElementById('RDACE_NombreAdminPlanBeneficios')?.value || null,
        FechaHoraInicioAtencion: fhRdace.inicio,
        FechaHoraFinAtencion: fhRdace.fin,
        TipoDocProfesional: document.getElementById('RDACE_TipoDocProfesional')?.value || null,
        NumDocProfesional: rdaceSelect2Value('RDACE_NumDocProfesional') || document.getElementById('RDACE_NumDocProfesional')?.value || null,
        DiagnosticoIngresoCIE11Codigo: document.getElementById('RDACE_DiagnosticoIngresoCIE11Codigo')?.value || null,
        DiagnosticoIngresoCIE11Termino: cie11TerminoCE,
        TipoAlergia: rdaceSelect2Value('RDACE_TipoAlergia'),
        EntornoAtencion: rdaceSelect2Value('RDACE_EntornoAtencion'),
        TipoFactorRiesgo: rdaceSelect2Value('RDACE_TipoFactorRiesgo'),
        NombreFactorRiesgo: document.getElementById('RDACE_NombreFactorRiesgo')?.value || null,
        DiagnosticoPrincipalCIE10Codigo: rdaceSelect2Value('RDACE_DiagPrincipalCIE10Codigo') || document.getElementById('RDACE_DiagPrincipalCIE10Codigo')?.value || null,
        DiagnosticoPrincipalCIE10Nombre: document.getElementById('RDACE_DiagPrincipalCIE10Nombre')?.value || null,
        TipoDiagnosticoPrincipal: rdaceSelect2Value('RDACE_TipoDiagPrincipalCIE10'),
        CondicionDestinoEgreso: rdaceSelect2Value('RDACE_CondicionDestinoEgreso'),
        CodigoPrestadorRemite: document.getElementById('RDACE_CodigoPrestadorRemite')?.value || null,
        AlcanceIncapacidad: rdaceSelect2Value('RDACE_AlcanceIncapacidad'),
        DiasIncapacidad: rdaceDigitsOnly(document.getElementById('RDACE_DiasIncapacidad')?.value || '') || null,
        DiasLicenciaMaternidad: rdaceDigitsOnly(document.getElementById('RDACE_DiasLicenciaMaternidad')?.value || '') || null,
        NombreDocumentoPDF: document.getElementById('RDACE_NombreDocumentoPDF')?.value || null,
        NotasAdicionalesPdf: rdaceGetInputValue('RDACE_NotasAdicionalesPdf') || null,
        IdModalidadAtencion: document.getElementById('RDACE_IdModalidadAtencion')?.value || null,
        IdGrupoServicios: document.getElementById('RDACE_IdGrupoServicios')?.value || null,
        IdViaIngresoUsuario: document.getElementById('RDACE_IdViaIngresoUsuario')?.value || null,
        IdCausaMotivoAtencion: document.getElementById('RDACE_IdCausaMotivoAtencion')?.value || null,
    };

    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

    try {
        const dataPrincipal = await guardarEvaluacionCEPrincipal(payload);
        const idCE = dataPrincipal.IdEvaluacionEntidadRDACE;

        const antSalud = (window.RDA?.getAntecedentesCE?.() || []);
        for (const item of antSalud) {
            const desc = item.codigo + (item.descripcion ? ' - ' + item.descripcion : '');
            await postAntecedenteSaludCE({
                IdEvaluacionEntidadRDACE: idCE,
                DocumentoEntidad: documento,
                Descripcion: desc,
                IdEstado: 1,
            });
        }

        const antFam = (window.RDA?.getAntecedentesFamiliaresCE?.() || []);
        for (const item of antFam) {
            await postAntecedenteFamCE({
                IdEvaluacionEntidadRDACE: idCE,
                DocumentoEntidad: documento,
                Parentesco: item.parentesco != null ? String(item.parentesco) : null,
                Descripcion: buildDescAntecedenteFamiliar(item),
                CIE11Codigo: item.cie11Codigo || null,
                CIE11Termino: item.cie11Termino || null,
                IdEstado: 1,
            });
        }

        const medic = (window.RDA?.getMedicamentosCE?.() || []);
        for (const item of medic) {
            const obs = (item.observacion || '').trim();
            const base = (item.codigo ? item.codigo + ' - ' : '') + (item.nombre || '');
            const desc = obs ? `${base} (${obs})` : base;
            await postAntecedenteFarmCE({
                IdEvaluacionEntidadRDACE: idCE,
                DocumentoEntidad: documento,
                Descripcion: desc,
                IdEstado: 1,
            });
        }

        const diags = (window.RDA?.getDiagRelacionados?.() || []);
        for (const item of diags) {
            await postDiagnosticoRelacionadoCE({
                IdEvaluacionEntidadRDACE: idCE,
                CodigoCIE10: item.codigoCIE10 || null,
                NombreCIE10: item.nombreCIE10 || null,
                CodigoCIE11: item.codigoCIE11 || null,
                TerminoCIE11: item.terminoCIE11 || null,
                IdEstado: 1,
            });
        }

        const presMed = (window.RDA?.getPrescripcionMedicamentos?.() || []);
        for (const item of presMed) {
            await postPrescripcionMedCE({
                IdEvaluacionEntidadRDACE: idCE,
                tipo: item.tipo || null,
                codigo: item.codigo || null,
                nombre: item.nombre || null,
                dci: item.dci || null,
                fechaPrescripcion: item.fechaPrescripcion || null,
                dosis: item.dosis || null,
                unidadDosis: item.unidadDosis || null,
                via: item.viaCodigo || item.via || null,
                duracionCant: item.duracionCant || null,
                duracionUnid: item.duracionUnid || null,
                frecuenciaCant: item.frecuenciaCant || null,
                frecuenciaUnid: item.frecuenciaUnid || null,
                finalidad: item.finalidad != null ? String(item.finalidad) : null,
                IdEstado: 1,
            });
        }

        const presProc = resolvePrescripcionProcedimientosCE();
        for (const item of presProc) {
            await postPrescripcionProcCE({
                IdEvaluacionEntidadRDACE: idCE,
                tipo: item.tipo || null,
                codigo: item.codigo || null,
                nombre: item.nombre || null,
                finalidad: item.finalidad || null,
                fechaPrescripcion: item.fechaPrescripcion || null,
                IdEstado: 1,
            });
        }

        const otras = (window.RDA?.getOtrasTecnologias?.() || []);
        for (const item of otras) {
            await postOtraTecCE({
                IdEvaluacionEntidadRDACE: idCE,
                tipo: item.tipo || null,
                codigo: item.codigo || null,
                nombre: item.nombre || null,
                fechaPrescripcion: item.fechaPrescripcion || null,
                finalidad: item.finalidad || null,
                IdEstado: 1,
            });
        }

        const hidId = document.getElementById('RDACE_IdEvaluacionActual');
        if (hidId) hidId.value = String(idCE);
        const fnEl = document.getElementById('RDACE_NombreDocumentoPDF');
        if (fnEl && !String(fnEl.value || '').trim()) {
            const slug = (documento || 'paciente').replace(/\W+/g, '_');
            fnEl.value = 'RDA_CE_' + slug + '_' + idCE + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
        }

        const autoPdf = document.getElementById('RDACE_AutoDescargarPdf');
        if (autoPdf && autoPdf.checked) {
            const pdfUrlAuto = urlResumenClinicoPdf(idCE);
            try {
                const blob = await fetchBlobAuthenticated(pdfUrlAuto);
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                const rawName = (fnEl && fnEl.value) ? fnEl.value : ('RDA_CE_' + idCE + '.pdf');
                a.download = String(rawName).replace(/[^\w.\-]+/g, '_');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            } catch (ePdf) {
                console.warn('[RDACE] Descarga automática PDF:', ePdf);
            }
        }

        const resumenCe =
            '<b>ID RDACE:</b> ' + idCE + '<br>' +
            'Ant. salud: ' + antSalud.length + ' | Familiares: ' + antFam.length + ' | Farmacológicos: ' + medic.length + '<br>' +
            'Diag. relacionados: ' + diags.length + ' | Prescr. med: ' + presMed.length + ' | Proc: ' + presProc.length + ' | Otras tec: ' + otras.length + '<br>';

        const unifiedSend = rdaceIhceUnifiedSendEnabled();
        const textoEnvioIhce = unifiedSend
            ? '<small class="text-muted">Si elige enviar, se intentará enviar <b>RDA Paciente</b> y <b>RDA Consulta Externa</b>.</small>'
            : '<small class="text-muted">Si elige enviar, solo se enviará <b>RDA Consulta Externa</b> (RDA Paciente por separado desde su botón de guardar).</small>';

        await window.rdaOfrecerEnvioIhce(
            'RDA Consulta Externa guardado',
            resumenCe + '<hr class="my-2">' + textoEnvioIhce,
            async function (ambiente) {
                if (!unifiedSend) {
                    return window.enviarIhceRdace(idCE, { ambiente: ambiente });
                }

                let pacienteResult = null;
                let rdaceResult = null;
                let pacienteError = null;
                let idPacienteIhce = null;

                if (unifiedSend) {
                    try {
                        idPacienteIhce = await rdaceGuardarPacienteDesdeConsulta({ documento, fhRdace });
                        pacienteResult = await window.enviarIhcePaciente(idPacienteIhce, { ambiente: ambiente, showSwal: false });
                    } catch (ePac) {
                        pacienteError = ePac;
                    }
                }

                try {
                    rdaceResult = await window.enviarIhceRdace(idCE, { ambiente: ambiente, showSwal: false });
                } catch (eCe) {
                    rdaceResult = { ok: false, status: 0, data: { error: eCe?.message || String(eCe) } };
                }

                const pacienteOut = unifiedSend
                    ? (pacienteError
                        ? { ok: false, status: 0, data: { error: pacienteError.message || String(pacienteError) } }
                        : pacienteResult)
                    : null;
                const ceOut = rdaceResult;

                const okPac = unifiedSend && !!(pacienteOut && pacienteOut.ok);
                const okCe = !!(ceOut && ceOut.ok);
                const icon = unifiedSend
                    ? ((okPac && okCe) ? 'success' : ((okPac || okCe) ? 'warning' : 'error'))
                    : (okCe ? 'success' : 'error');
                const title = unifiedSend
                    ? ((okPac && okCe)
                        ? 'Envio IHCE completado'
                        : ((okPac || okCe) ? 'Envio IHCE parcial' : 'Envio IHCE con errores'))
                    : (okCe ? 'Envio IHCE completado' : 'Envio IHCE con errores');

                const htmlResumen = unifiedSend
                    ? '<div class="text-start">' +
                        rdaceSummarizeSendOutcome('RDA Paciente', pacienteOut) + '<br><br>' +
                        rdaceSummarizeSendOutcome('RDA Consulta Externa', ceOut) +
                        '</div>'
                    : '<div class="text-start">' +
                        rdaceSummarizeSendOutcome('RDA Consulta Externa', ceOut) +
                        '</div>';

                const jsonBtnHtml = rdaceIhceJsonButtonsHtml(unifiedSend);

                await Swal.fire({
                    icon,
                    title,
                    html: htmlResumen + jsonBtnHtml,
                    confirmButtonText: 'Cerrar',
                    showDenyButton: true,
                    denyButtonText: 'Ver JSON respuesta — Consulta Externa',
                    denyButtonColor: '#6c757d',
                    didOpen: function (popup) {
                        wireRdaceIhceJsonButtons(popup, {
                            ambiente,
                            idCE,
                            idPacienteIhce,
                            ceOut,
                            pacienteOut,
                            unifiedSend,
                        });
                    },
                }).then(function (result) {
                    if (result.isDenied && ceOut && ceOut.data != null) {
                        openIhceJsonModal(
                            'Respuesta IHCE — Consulta Externa (HTTP ' + (ceOut.status || '') + ')',
                            ceOut.data
                        );
                    }
                });
            }
        );
    } catch (error) {
        console.error('[RDACE] Error al guardar:', error);
        Swal.fire({ icon: 'error', title: 'Error al guardar', text: error.message || 'Ocurrió un error inesperado.' });
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

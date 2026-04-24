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

function rdaceExtractIhceMessage(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (data.resourceType === 'OperationOutcome' && Array.isArray(data.issue) && data.issue.length) {
        const first = data.issue[0] || {};
        return (
            first.diagnostics ||
            (first.details && first.details.text) ||
            ''
        );
    }
    return '';
}

function rdaceSummarizeSendOutcome(nombre, out) {
    if (!out) return `<b>${nombre}:</b> no ejecutado`;
    if (out.ok) {
        return `<b>${nombre}:</b> enviado correctamente (HTTP ${out.status})`;
    }
    const detail = rdaceExtractIhceMessage(out.data);
    return `<b>${nombre}:</b> error (HTTP ${out.status})${detail ? `<br><small>${detail}</small>` : ''}`;
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

    const ahora = new Date().toISOString().slice(0, 19).replace('T', ' ');
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
        IdDiscapacidad: document.getElementById('DiscapacidadBase')?.value || null,
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

    const ahora = new Date().toISOString().slice(0, 19).replace('T', ' ');
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
            const desc = item.codigo ? (item.codigo + (item.descripcion ? ' - ' + item.descripcion : '')) : null;
            await postAntecedenteFamCE({
                IdEvaluacionEntidadRDACE: idCE,
                DocumentoEntidad: documento,
                Parentesco: item.parentesco != null ? String(item.parentesco) : null,
                Descripcion: desc,
                CIE11Codigo: item.cie11Codigo || null,
                CIE11Termino: item.cie11Termino || null,
                IdEstado: 1,
            });
        }

        const medic = (window.RDA?.getMedicamentosCE?.() || []);
        for (const item of medic) {
            const desc = item.nombre + (item.observacion ? ' (' + item.observacion + ')' : '');
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
                via: item.via || null,
                duracionCant: item.duracionCant || null,
                duracionUnid: item.duracionUnid || null,
                frecuenciaCant: item.frecuenciaCant || null,
                frecuenciaUnid: item.frecuenciaUnid || null,
                finalidad: item.finalidad != null ? String(item.finalidad) : null,
                IdEstado: 1,
            });
        }

        const presProc = (window.RDA?.getPrescripcionProcedimientos?.() || []);
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

        await window.rdaOfrecerEnvioIhce(
            'RDA Consulta Externa guardado',
            resumenCe +
                '<hr class="my-2">' +
                '<small class="text-muted">Si elige enviar, se intentará enviar <b>RDA Paciente</b> y <b>RDA Consulta Externa</b>.</small>',
            async function (ambiente) {
                let pacienteResult = null;
                let rdaceResult = null;
                let pacienteError = null;

                try {
                    const idPaciente = await rdaceGuardarPacienteDesdeConsulta({ documento, fhRdace });
                    pacienteResult = await window.enviarIhcePaciente(idPaciente, { ambiente: ambiente, showSwal: false });
                } catch (ePac) {
                    pacienteError = ePac;
                }

                try {
                    rdaceResult = await window.enviarIhceRdace(idCE, { ambiente: ambiente, showSwal: false });
                } catch (eCe) {
                    rdaceResult = { ok: false, status: 0, data: { error: eCe?.message || String(eCe) } };
                }

                const pacienteOut = pacienteError
                    ? { ok: false, status: 0, data: { error: pacienteError.message || String(pacienteError) } }
                    : pacienteResult;
                const ceOut = rdaceResult;

                const okPac = !!(pacienteOut && pacienteOut.ok);
                const okCe = !!(ceOut && ceOut.ok);
                const icon = (okPac && okCe) ? 'success' : ((okPac || okCe) ? 'warning' : 'error');
                const title = (okPac && okCe)
                    ? 'Envio IHCE completado'
                    : ((okPac || okCe) ? 'Envio IHCE parcial' : 'Envio IHCE con errores');

                await Swal.fire({
                    icon,
                    title,
                    html:
                        '<div class="text-start">' +
                        rdaceSummarizeSendOutcome('RDA Paciente', pacienteOut) + '<br><br>' +
                        rdaceSummarizeSendOutcome('RDA Consulta Externa', ceOut) +
                        '</div>',
                    confirmButtonText: 'Cerrar',
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

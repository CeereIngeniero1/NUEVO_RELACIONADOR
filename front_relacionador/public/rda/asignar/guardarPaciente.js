/**
 * RDA Paciente — guardar cabecera + listas (antes inline en Asignar_RIPS V3.html).
 */
import {
    guardarEvaluacionPacientePrincipal,
    postAntecedenteSaludPac,
    postAntecedenteFamPac,
    postAntecedenteFarmPac,
} from '../api/entidad1888.js';
import { validarPacienteDemografia, bloquearSiPacienteSinGuardar } from '../../shared/pacienteDemografiaValidation.js';

function rdaSelect2Value(selectId) {
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

function rdaValidatePacienteForSave() {
    return validarPacienteDemografia();
}

export function wireGuardarPaciente() {
    const btn = document.getElementById('RDA_BtnGuardarPaciente');
    if (!btn) return;
    btn.addEventListener('click', async function () {
        await guardarRDAPaciente();
    });
}

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

export async function guardarRDAPaciente() {
    const btn = document.getElementById('RDA_BtnGuardarPaciente');
    // ── Datos del paciente (sección superior) ──────────────────────
    const documento = document.getElementById('DocumentoPaciente')?.value?.trim();
    const tipoDoc = document.getElementById('TipoDocumentoBase')?.value?.trim();

    if (!documento) {
        Swal.fire({ icon: 'warning', title: 'Dato requerido', text: 'Seleccione un paciente antes de guardar el RDA.' });
        return;
    }

    if (!bloquearSiPacienteSinGuardar()) return;

    const { faltantes: missingPaciente, corruptos: corruptosPaciente } = rdaValidatePacienteForSave();
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
            title: 'Campos obligatorios pendientes',
            html: 'Complete los campos del paciente marcados con asterisco antes de guardar.<br><br><b>Faltan:</b><br> - '
                + missingPaciente.join('<br> - '),
        });
        return;
    }

    const rdaCodPrest = document.getElementById('RDA_CodigoPrestador')?.value?.trim();
    const rdaIdMod = document.getElementById('RDA_IdModalidadAtencion')?.value?.trim();
    const rdaIdGrp = document.getElementById('RDA_IdGrupoServicios')?.value?.trim();
    if (!rdaCodPrest) {
        Swal.fire({ icon: 'warning', title: 'Prestador requerido', text: 'Seleccione el código prestador (IPS / REPS) antes de guardar. Sin esto no se puede armar el custodian del documento FHIR.' });
        return;
    }
    if (!rdaIdMod) {
        Swal.fire({ icon: 'warning', title: 'Modalidad requerida', text: 'Seleccione la modalidad de atención (RDA / FHIR).' });
        return;
    }
    if (!rdaIdGrp) {
        Swal.fire({ icon: 'warning', title: 'Grupo de servicios requerido', text: 'Seleccione el grupo de servicios (RDA / FHIR).' });
        return;
    }

    const fhRda = window.rdaParseFechaHorasAtencion('RDA_');
    if (!fhRda.ok) {
        Swal.fire({ icon: 'warning', title: 'Fecha y horas de atención', text: fhRda.error });
        return;
    }

    const ahora = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const $ = window.jQuery;
    let cie11Termino = null;
    try {
        const cie11TerminoData = $ && $('#RDA_DiagnosticoIngresoCIE11Termino').length
            ? $('#RDA_DiagnosticoIngresoCIE11Termino').select2('data')
            : null;
        cie11Termino = cie11TerminoData?.length ? cie11TerminoData[0].text : (document.getElementById('RDA_DiagnosticoIngresoCIE11Termino')?.value || null);
    } catch (e) {
        cie11Termino = document.getElementById('RDA_DiagnosticoIngresoCIE11Termino')?.value || null;
    }

    const selPrestador = document.getElementById('RDA_CodigoPrestador');
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

    const rawIdDiscapacidad = (document.getElementById('DiscapacidadBase')?.value || '').trim();
    const idDiscapacidadSeguro =
        !rawIdDiscapacidad || rawIdDiscapacidad.toLowerCase() === 'null' || rawIdDiscapacidad.toLowerCase() === 'undefined'
            ? '9'
            : rawIdDiscapacidad;

    const payload = {
        DocumentoEntidad: documento,
        FechaRDA: ahora,
        IdTipoDocumento: tipoDoc || null,
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
        CodigoPrestador: document.getElementById('RDA_CodigoPrestador')?.value || null,
        CodigoAdminPlanBeneficios: document.getElementById('RDA_CodigoAdminPlanBeneficios')?.value || null,
        NombreAdminPlanBeneficios: document.getElementById('RDA_NombreAdminPlanBeneficios')?.value || null,
        FechaHoraInicioAtencion: fhRda.inicio,
        FechaHoraFinAtencion: fhRda.fin,
        TipoDocProfesional: document.getElementById('RDA_TipoDocProfesional')?.value || null,
        NumDocProfesional: document.getElementById('RDA_NumDocProfesional')?.value || null,
        DiagnosticoIngresoCIE11Codigo: document.getElementById('RDA_DiagnosticoIngresoCIE11Codigo')?.value || null,
        DiagnosticoIngresoCIE11Termino: cie11Termino || null,
        TipoAlergia: rdaSelect2Value('RDA_TipoAlergia'),
        IdModalidadAtencion: document.getElementById('RDA_IdModalidadAtencion')?.value || null,
        IdGrupoServicios: document.getElementById('RDA_IdGrupoServicios')?.value || null,
        NitPrestadorIPS: nitPrestadorIps,
        NombrePrestadorIPS: nombrePrestadorIps,
    };

    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

    try {
        const dataPrincipal = await guardarEvaluacionPacientePrincipal(payload);
        if (!dataPrincipal.ok) {
            throw new Error(dataPrincipal.error || 'Error al guardar el RDA principal');
        }
        const idRDA = dataPrincipal.IdEvaluacionEntidadRDA;

        const antSalud = (window.RDA?.getAntecedentes?.() || []);
        for (const item of antSalud) {
            const desc = item.codigo + (item.descripcion ? ' - ' + item.descripcion : '');
            await postAntecedenteSaludPac({
                IdEvaluacionEntidadRDA: idRDA,
                DocumentoEntidad: documento,
                Descripcion: desc,
                IdEstado: 1,
            });
        }

        const antFam = (window.RDA?.getAntecedentesFamiliares?.() || []);
        for (const item of antFam) {
            await postAntecedenteFamPac({
                IdEvaluacionEntidadRDA: idRDA,
                DocumentoEntidad: documento,
                Parentesco: item.parentesco || null,
                Descripcion: buildDescAntecedenteFamiliar(item),
                CIE11Codigo: item.cie11Codigo || null,
                CIE11Termino: item.cie11Termino || null,
                IdEstado: 1,
            });
        }

        const medic = (window.RDA?.getMedicamentos?.() || []);
        for (const item of medic) {
            const obs = (item.observacion || '').trim();
            const base = (item.codigo ? item.codigo + ' - ' : '') + (item.nombre || '');
            const desc = obs ? `${base} (${obs})` : base;
            await postAntecedenteFarmPac({
                IdEvaluacionEntidadRDA: idRDA,
                DocumentoEntidad: documento,
                Descripcion: desc,
                IdEstado: 1,
            });
        }

        const resumenPac =
            '<b>ID Evaluación:</b> ' + idRDA + '<br>' +
            'Antecedentes de salud: ' + antSalud.length + ' | Familiares: ' + antFam.length + ' | Medicamentos: ' + medic.length;
        await window.rdaOfrecerEnvioIhce('RDA Paciente guardado', resumenPac, function (ambiente) {
            return window.enviarIhcePaciente(idRDA, { ambiente: ambiente });
        });
    } catch (error) {
        console.error('[RDA Paciente] Error al guardar:', error);
        Swal.fire({ icon: 'error', title: 'Error al guardar', text: error.message || 'Ocurrió un error inesperado.' });
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

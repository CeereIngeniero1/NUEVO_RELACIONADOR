/**
 * Modo edición RDA (errores / pendientes): hidrata Asignar desde GET /RdaEdicion/*
 * y marca window.RDA.edicion para que Guardar haga UPDATE del mismo Id.
 */
import {
    fetchRdaEdicionPaciente,
    fetchRdaEdicionCe,
} from '../api/entidad1888.js';
import {
    replaceAntecedentesPaciente,
    replaceAntecedentesCE,
    replaceListasClinicasCE,
} from '../state.js';
import { refreshListasAntecedentesPaciente } from '../ui/listasPaciente.js';
import { refreshListasClinicasCE } from '../ui/listasConsultaExterna.js';

const edicionState = {
    active: false,
    tipo: null, // 'paciente' | 'ce'
    id: null,
    ambiente: 'prod',
};

function setInput(idEl, value) {
    const el = document.getElementById(idEl);
    if (!el) return;
    el.value = value == null ? '' : String(value);
    try {
        el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) {
        /* noop */
    }
}

function setSelect2OrInput(idEl, value, text) {
    const el = document.getElementById(idEl);
    if (!el) return;
    const v = value == null ? '' : String(value);
    const t = text == null || text === '' ? v : String(text);
    try {
        if (window.jQuery && window.jQuery(el).data('select2')) {
            const opt = new Option(t, v, true, true);
            window.jQuery(el).append(opt).trigger('change');
            return;
        }
    } catch (_) {
        /* noop */
    }
    el.value = v;
    try {
        el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) {
        /* noop */
    }
}

function toDatetimeLocal(v) {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    // SQL DATETIME no tiene zona horaria. mssql lo serializa con "Z", pero sus
    // componentes UTC representan el reloj local guardado (08:00 debe verse 08:00).
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function splitFechaHoras(v) {
    const local = toDatetimeLocal(v);
    if (!local) return { fecha: '', hora: '' };
    return { fecha: local.slice(0, 10), hora: local.slice(11, 16) };
}

function ensureBanner() {
    let banner = document.getElementById('rdaEdicionBanner');
    if (banner) return banner;
    banner = document.createElement('div');
    banner.id = 'rdaEdicionBanner';
    banner.className = 'alert alert-warning py-2 px-3 mb-2';
    banner.style.cssText = 'border-left:4px solid #f0ad4e;';
    const card = document.getElementById('cardRDA') || document.getElementById('ContenidoRDA');
    if (card && card.parentElement) {
        card.parentElement.insertBefore(banner, card);
    } else {
        document.body.prepend(banner);
    }
    return banner;
}

function paintBanner() {
    const banner = ensureBanner();
    const tipoLbl = edicionState.tipo === 'ce' ? 'Consulta Externa' : 'Paciente';
    banner.innerHTML = `
      <strong>Editando RDA ${tipoLbl} #${edicionState.id}</strong>
      <span class="ms-1">(pendiente / error — se actualizará el mismo registro, sin duplicar).</span>
      <div class="small text-muted mt-1">Ambiente: ${edicionState.ambiente}. Guarde desde el botón del módulo y luego reenvíe a IHCE.</div>
    `;
    banner.classList.remove('d-none');
}

function activarUiPorTipo(tipo) {
    const checkRda = document.getElementById('GenerarRDABase');
    const radioPaciente = document.getElementById('RDATipoPaciente');
    const radioCe = document.getElementById('RDATipoConsultaExterna');
    const contenidoRda = document.getElementById('ContenidoRDA');
    const seccionPaciente = document.getElementById('SeccionRDAPaciente');
    const seccionCe = document.getElementById('SeccionRDAConsultaExterna');
    const cardRda = document.getElementById('cardRDA');
    const labelPaciente = document.querySelector('label[for="RDATipoPaciente"]');
    const labelCe = document.querySelector('label[for="RDATipoConsultaExterna"]');

    ['cardSeleccionPaciente', 'bloqueBuscarDocumentoRda'].forEach((cardId) => {
        const node = document.getElementById(cardId);
        if (node) node.style.display = 'none';
    });

    if (checkRda) {
        checkRda.checked = true;
        try {
            checkRda.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (_) {
            /* noop */
        }
    }
    if (radioPaciente) radioPaciente.disabled = false;
    if (radioCe) radioCe.disabled = false;

    if (tipo === 'ce') {
        if (radioCe) {
            radioCe.checked = true;
            try {
                radioCe.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (_) {
                /* noop */
            }
        }
        if (radioPaciente) radioPaciente.disabled = true;
        if (labelPaciente) labelPaciente.classList.add('d-none');
        if (labelCe) labelCe.classList.remove('d-none');
        if (seccionCe) seccionCe.classList.remove('d-none');
        if (seccionPaciente) seccionPaciente.classList.add('d-none');
    } else {
        if (radioPaciente) {
            radioPaciente.checked = true;
            try {
                radioPaciente.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (_) {
                /* noop */
            }
        }
        if (radioCe) radioCe.disabled = true;
        if (labelCe) labelCe.classList.add('d-none');
        if (labelPaciente) labelPaciente.classList.remove('d-none');
        if (seccionPaciente) seccionPaciente.classList.remove('d-none');
        if (seccionCe) seccionCe.classList.add('d-none');
    }

    if (contenidoRda) contenidoRda.classList.remove('d-none');
    if (cardRda) cardRda.classList.remove('collapsed');

    const scope = tipo === 'ce' ? '#SeccionRDAConsultaExterna' : '#SeccionRDAPaciente';
    document.querySelectorAll(`${scope} .rda-module-card`).forEach((c) => {
        c.classList.remove('rda-module-collapsed');
    });

    const btnPac = document.getElementById('RDA_BtnGuardarPaciente');
    const btnCe = document.getElementById('RDACE_BtnGuardarConsultaExterna');
    if (btnPac && tipo === 'paciente') {
        btnPac.innerHTML = '<i class="ri-save-3-line me-1"></i>Actualizar RDA Paciente';
    }
    if (btnCe && tipo === 'ce') {
        btnCe.innerHTML = '<i class="ri-save-3-line me-1"></i>Actualizar RDA Consulta Externa';
    }
}

function hydratePacienteCabecera(c) {
    setInput('DocumentoPaciente', c.DocumentoEntidad);
    setInput('TipoDocumentoBase', c.IdTipoDocumento);
    setInput('PrimerApellidoBase', c.PrimerApellidoEntidad);
    setInput('SegundoApellidoBase', c.SegundoApellidoEntidad);
    setInput('PrimerNombreBase', c.PrimerNombreEntidad);
    setInput('SegundoNombreBase', c.SegundoNombreEntidad);
    setInput('FechaNacimientoBase', toDatetimeLocal(c.FechaNacimiento));
    setInput('EdadPaciente', c.Edad);
    setInput('SexoPaciente', c.IdSexoBiologico);
    setInput('IdentidadGeneroBase', c.IdIdentidadGenero);
    setInput('SelectNombrePaisNacionalidadBase', c.IdPaisNacionalidad);
    setInput('TallaPaciente', c.Talla);
    setInput('PesoPaciente', c.Peso);
    setInput('SelectNombrePaisResidenciaBase', c.IdPaisRecidencia);
    setInput('SelectNombreMunicipioResidenciaBase', c.IdMunicipioRecidencia);
    setInput('ListaZonaTerritorialBase', c.IdZonaResidencia);
    setInput('DireccionPaciente', c.Direccion);
    setInput('EtniaBase', c.IdEtnia);
    setInput('ComunidadEtnicaBase', c.ComunidadEtnica);
    setInput('DiscapacidadBase', c.IdDiscapacidad);
    setInput('TelefonoPaciente', c.TelefonoCelular);
    setInput('NombreAlergenoBase', c.Alergeno);
    setInput('RDA_CodigoPrestador', c.CodigoPrestador);
    setInput('RDA_CodigoAdminPlanBeneficios', c.CodigoAdminPlanBeneficios);
    setInput('RDA_NombreAdminPlanBeneficios', c.NombreAdminPlanBeneficios);
    const fh = splitFechaHoras(c.FechaHoraInicioAtencion);
    const fhFin = splitFechaHoras(c.FechaHoraFinAtencion);
    setInput('RDA_FechaAtencion', fh.fecha);
    setInput('RDA_HoraInicioAtencion', fh.hora);
    setInput('RDA_HoraFinAtencion', fhFin.hora);
    setInput('RDA_TipoDocProfesional', c.TipoDocProfesional);
    setSelect2OrInput('RDA_NumDocProfesional', c.NumDocProfesional, c.NumDocProfesional);
    setInput('RDA_DiagnosticoIngresoCIE11Codigo', c.DiagnosticoIngresoCIE11Codigo);
    setSelect2OrInput(
        'RDA_DiagnosticoIngresoCIE11Termino',
        c.DiagnosticoIngresoCIE11Codigo || c.DiagnosticoIngresoCIE11Termino,
        c.DiagnosticoIngresoCIE11Termino
    );
    setSelect2OrInput('RDA_TipoAlergia', c.TipoAlergia, c.TipoAlergia);
    setInput('RDA_IdModalidadAtencion', c.IdModalidadAtencion);
    setInput('RDA_IdGrupoServicios', c.IdGrupoServicios);
}

function hydrateCeCabecera(c, demografia) {
    setInput('RDACE_IdEvaluacionActual', c.IdEvaluacionEntidadRDACE || edicionState.id);
    if (c.DocumentoEntidad) setInput('DocumentoPaciente', c.DocumentoEntidad);

    if (demografia && demografia.PrimerApellidoBase != null) {
        setInput('PrimerApellidoBase', demografia.PrimerApellidoBase);
        setInput('SegundoApellidoBase', demografia.SegundoApellidoBase);
        setInput('PrimerNombreBase', demografia.PrimerNombreBase);
        setInput('SegundoNombreBase', demografia.SegundoNombreBase);
        setInput('FechaNacimientoBase', toDatetimeLocal(demografia.FechaNacimiento));
        setInput('SexoPaciente', demografia.IdSexo || demografia.CodigoSexo);
        setInput('IdentidadGeneroBase', demografia.IdIdentidadGenero);
        setInput('TelefonoPaciente', demografia.TelefonoCelular);
        setInput('DireccionPaciente', demografia.Direccion);
    }

    setInput('RDACE_CodigoPrestador', c.CodigoPrestador);
    setInput('RDACE_CodigoAdminPlanBeneficios', c.CodigoAdminPlanBeneficios);
    setInput('RDACE_NombreAdminPlanBeneficios', c.NombreAdminPlanBeneficios);
    const fh = splitFechaHoras(c.FechaHoraInicioAtencion);
    const fhFin = splitFechaHoras(c.FechaHoraFinAtencion);
    setInput('RDACE_FechaAtencion', fh.fecha);
    setInput('RDACE_HoraInicioAtencion', fh.hora);
    setInput('RDACE_HoraFinAtencion', fhFin.hora);
    setInput('RDACE_TipoDocProfesional', c.TipoDocProfesional);
    setSelect2OrInput('RDACE_NumDocProfesional', c.NumDocProfesional, c.NumDocProfesional);
    setInput('RDACE_DiagnosticoIngresoCIE11Codigo', c.DiagnosticoIngresoCIE11Codigo);
    setSelect2OrInput(
        'RDACE_DiagnosticoIngresoCIE11Termino',
        c.DiagnosticoIngresoCIE11Codigo || c.DiagnosticoIngresoCIE11Termino,
        c.DiagnosticoIngresoCIE11Termino
    );
    setInput('RDACE_IdModalidadAtencion', c.IdModalidadAtencion);
    setInput('RDACE_IdGrupoServicios', c.IdGrupoServicios);
    setInput('RDACE_IdViaIngresoUsuario', c.IdViaIngresoUsuario);
    setInput('RDACE_IdCausaMotivoAtencion', c.IdCausaMotivoAtencion);
    setSelect2OrInput(
        'RDACE_EntornoAtencion',
        c.EntornoAtencion,
        c.NombreEntornoAtencion || c.EntornoAtencion
    );
    setSelect2OrInput('RDACE_TipoFactorRiesgo', c.TipoFactorRiesgo, c.TipoFactorRiesgo);
    setInput('RDACE_NombreFactorRiesgo', c.NombreFactorRiesgo);
    setSelect2OrInput(
        'RDACE_DiagPrincipalCIE10Codigo',
        c.DiagnosticoPrincipalCIE10Codigo,
        c.DiagnosticoPrincipalCIE10Nombre
            ? `${c.DiagnosticoPrincipalCIE10Codigo} - ${c.DiagnosticoPrincipalCIE10Nombre}`
            : c.DiagnosticoPrincipalCIE10Codigo
    );
    setInput('RDACE_DiagPrincipalCIE10Nombre', c.DiagnosticoPrincipalCIE10Nombre);
    setSelect2OrInput(
        'RDACE_TipoDiagPrincipalCIE10',
        c.TipoDiagnosticoPrincipal,
        c.NombreTipoDiagnosticoPrincipal || c.TipoDiagnosticoPrincipal
    );
    setSelect2OrInput(
        'RDACE_CondicionDestinoEgreso',
        c.CondicionDestinoEgreso,
        c.NombreCondicionDestinoEgreso || c.CondicionDestinoEgreso
    );
    setInput('RDACE_CodigoPrestadorRemite', c.CodigoPrestadorRemite);
    setSelect2OrInput(
        'RDACE_AlcanceIncapacidad',
        c.AlcanceIncapacidad,
        c.NombreAlcanceIncapacidad || c.AlcanceIncapacidad
    );
    setInput('RDACE_DiasIncapacidad', c.DiasIncapacidad);
    setInput('RDACE_DiasLicenciaMaternidad', c.DiasLicenciaMaternidad);
    setSelect2OrInput('RDACE_TipoAlergia', c.TipoAlergia, c.NombreTipoAlergia || c.TipoAlergia);
    if (c.NotasAdicionalesPdf != null) {
        setInput('RDACE_NotasAdicionalesPdf', c.NotasAdicionalesPdf);
    }
}

async function hydratePaciente(id) {
    const data = await fetchRdaEdicionPaciente(id);
    hydratePacienteCabecera(data.cabecera || {});
    const listas = data.listas || {};
    replaceAntecedentesPaciente({
        salud: listas.antecedentesSalud || [],
        familiares: listas.antecedentesFamiliares || [],
        medicamentos: listas.antecedentesFarmacologicos || [],
    });
    refreshListasAntecedentesPaciente();
    return data;
}

async function hydrateCe(id) {
    const data = await fetchRdaEdicionCe(id);
    hydrateCeCabecera(data.cabecera || {}, data.demografia || {});
    const listas = data.listas || {};
    replaceAntecedentesCE({
        salud: listas.antecedentesSalud || [],
        familiares: listas.antecedentesFamiliares || [],
        medicamentos: listas.antecedentesFarmacologicos || [],
    });
    replaceListasClinicasCE({
        diagRelacionados: listas.diagRelacionados || [],
        prescripcionMed: listas.prescripcionMed || [],
        prescripcionProc: listas.prescripcionProc || [],
        otrasTec: listas.otrasTec || [],
    });
    refreshListasClinicasCE();
    return data;
}

export function getEdicionState() {
    return { ...edicionState };
}

export function isEditMode() {
    return !!edicionState.active && !!edicionState.id && !!edicionState.tipo;
}

/**
 * Lee querystring modo=corregir-rda y carga el agregado.
 */
export async function bootstrapEdicionDesdeQuery() {
    const qs = new URLSearchParams(window.location.search);
    const modo = String(qs.get('modo') || '').toLowerCase();
    if (modo !== 'corregir-rda') return false;

    const tipo = String(qs.get('tipo') || 'paciente').toLowerCase() === 'ce' ? 'ce' : 'paciente';
    const id = parseInt(qs.get('id') || '', 10);
    const ambiente = String(qs.get('ambiente') || 'prod').toLowerCase() || 'prod';

    if (!Number.isFinite(id)) {
        throw new Error('Id inválido en modo corrección RDA.');
    }

    edicionState.active = true;
    edicionState.tipo = tipo;
    edicionState.id = id;
    edicionState.ambiente = ambiente === 'sandbox' ? 'sandbox' : 'prod';

    activarUiPorTipo(tipo);
    paintBanner();

    const data = tipo === 'ce' ? await hydrateCe(id) : await hydratePaciente(id);

    if (Number(data.enviado) === 1 || Number(data.enviado) === 2) {
        await Swal.fire({
            icon: 'warning',
            title: 'RDA no editable',
            text:
                Number(data.enviado) === 2
                    ? 'Este RDA no es reenviable (Enviado=2).'
                    : 'Este RDA ya fue enviado OK (Enviado=1). La edición v1 solo aplica a pendientes.',
        });
    } else {
        await Swal.fire({
            icon: 'info',
            title: 'Modo edición RDA',
            html: `Se cargó el RDA <b>#${id}</b> (${tipo === 'ce' ? 'Consulta Externa' : 'Paciente'}) con cabecera y listas. Ajuste lo necesario y pulse <b>Actualizar</b>.`,
            timer: 4500,
            showConfirmButton: true,
        });
    }
    return true;
}

export function initEdicionRda() {
    const api = {
        isEditMode,
        getEdicionState,
        bootstrapEdicionDesdeQuery,
    };
    if (typeof window !== 'undefined') {
        window.RDA = window.RDA || {};
        window.RDA.edicion = api;
    }
    setTimeout(() => {
        bootstrapEdicionDesdeQuery().catch((e) => {
            console.error('[RDA edición]', e);
            Swal.fire({
                icon: 'error',
                title: 'Corrección RDA',
                text: e.message || String(e),
            });
        });
    }, 900);
    return api;
}

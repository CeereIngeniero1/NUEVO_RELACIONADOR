/**
 * RDA Consulta Externa — Router independiente (Resolución 1888)
 *
 * Rutas incluidas:
 *  POST  /EvaluacionEntidadRDACE/                      — cabecera
 *  POST  /EvaluacionEntidadRDACE/AntecedentesSalud
 *  POST  /EvaluacionEntidadRDACE/AntecedentesFamiliares
 *  POST  /EvaluacionEntidadRDACE/AntecedentesFarmacologicos
 *  POST  /EvaluacionEntidadRDACE/DiagnosticosRelacionados
 *  POST  /EvaluacionEntidadRDACE/PrescripcionMedicamentos
 *  POST  /EvaluacionEntidadRDACE/PrescripcionProcedimientos
 *  POST  /EvaluacionEntidadRDACE/OtrasTecnologias
 *  GET   /EgresoRemision                               — catálogo 1888
 *  GET   /FactorDeRiesgo                               — catálogo 1888
 *  GET   /TipoTecnologiaEnSalud                        — catálogo 1888
 *  GET   /Catalogo1888/:clave                          — catálogos 1888 genéricos
 *  GET   /EvaluacionEntidadRDACE/:id/ResumenClinico.pdf — descarga PDF resumen clínico (Decreto 780)
 *  POST  /RdaConsultaExterna/FhirBundle                — construcción Bundle FHIR
 *  POST  /RdaConsultaExterna/EnviarIHCE                — envío IHCE ($enviar-rda-consulta)
 *  POST  /RdaConsultaExterna/JsonEnviarIHCE            — mismo JSON que se POSTea a IHCE (sin enviar)
 *  POST  /RdaConsultaExterna/BundlePayloadIHCE       — alias de JsonEnviarIHCE (nombre explícito)
 *  POST  /RdaConsultaExterna/PayloadParaIHCE        — alias de JsonEnviarIHCE
 *  POST  /RdaConsultaExterna/EnviarIHCEModular         — envío IHCE con flags por tipo de recurso
 *  POST  /RdaConsultaExterna/JsonEnviarIHCEModular     — payload modular (sin enviar)
 *  POST  /RdaConsultaExterna/BundlePayloadIHCEModular / PayloadParaIHCEModular — alias
 *
 * Montaje en el router principal:
 *   router.use(require('./rda/RdaConsultaExternaRoutes'));
 *
 * IG: https://vulcano.ihcecol.gov.co/RDA-consulta.html
 */

'use strict';

const Router      = require('express').Router;
const { randomUUID, createHash } = require('crypto');
const { sql, poolPromise } = require('../../db2');
const { loadRdaceAggregate } = require('../../rda/rdaceAggregateLoader');

/**
 * PDF RDACE (pdfkit) — carga perezosa para que el server arranque si falta `pdfkit` en node_modules.
 * Solo se requiere al usar `ResumenClinico.pdf` o `FhirBundle` (epicrisis). Instalar: npm install en back_relacionador.
 */
let _rdacePdfService;
function rdacePdfService() {
    if (_rdacePdfService) return _rdacePdfService;
    try {
        _rdacePdfService = require('../../rda/rdacePdfService');
        return _rdacePdfService;
    } catch (e) {
        if (e && e.code === 'MODULE_NOT_FOUND') {
            const wrap = new Error(
                'Dependencias PDF RDACE no instaladas (p. ej. pdfkit). En la carpeta back_relacionador ejecute: npm install'
            );
            wrap.code = 'RDACE_PDF_DEPS_MISSING';
            wrap.cause = e;
            throw wrap;
        }
        throw e;
    }
}

/** Catálogo Res. 1888: código "7" = Sin Asignar (no permitido para envío real IHCE). */
function skipRdaEthnicityExtension(codigoEtnia, textoEtnia) {
    const c = codigoEtnia != null && String(codigoEtnia).trim() !== '' ? String(codigoEtnia).trim() : '';
    const t = textoEtnia != null && String(textoEtnia).trim() !== '' ? String(textoEtnia).trim() : '';
    const cNum = c && /^\d+$/.test(c) ? String(parseInt(c, 10)) : c;
    if (cNum === '7') return true; // soporta 7, 07, 007
    if (t && /(sin\s*asignar|sin\s*informaci[oó]n|no\s*aplica)/i.test(t)) return true;
    return false;
}

function ethnicityFromDb(codigoEtnia, textoEtnia) {
    const code = codigoEtnia != null && String(codigoEtnia).trim() !== '' ? String(codigoEtnia).trim() : '';
    const display = textoEtnia != null && String(textoEtnia).trim() !== '' ? String(textoEtnia).trim() : '';
    if (!code || skipRdaEthnicityExtension(code, display)) return null;
    return { code, display: display || undefined };
}

async function saveIhceTraceConsultaExterna({
    idEvaluacionEntidadRDACE,
    ambiente,
    urlEnvio,
    jsonEnviado,
    httpStatus,
    jsonRespuesta,
    exitoso,
    error,
}) {
    try {
        const pool = await poolPromise;
        const hash = jsonEnviado ? createHash('sha256').update(String(jsonEnviado)).digest('hex') : null;
        await pool.request()
            .input('TipoRda', sql.VarChar(20), 'ce')
            .input('IdRDA', sql.Int, null)
            .input('IdRDACE', sql.Int, idEvaluacionEntidadRDACE || null)
            .input('Ambiente', sql.VarChar(20), ambiente || null)
            .input('UrlEnvio', sql.NVarChar(sql.MAX), urlEnvio || null)
            .input('JsonEnviado', sql.NVarChar(sql.MAX), jsonEnviado || null)
            .input('HashJsonEnviado', sql.Char(64), hash || null)
            .input('HttpStatus', sql.Int, Number.isFinite(httpStatus) ? httpStatus : null)
            .input('JsonRespuesta', sql.NVarChar(sql.MAX), jsonRespuesta || null)
            .input('Exitoso', sql.Bit, exitoso ? 1 : 0)
            .input('ErrorTexto', sql.NVarChar(1000), error || null)
            .query(`
                INSERT INTO [dbo].[RDA IHCE Trazabilidad]
                (
                    [Tipo RDA],
                    [Id Evaluacion Entidad RDA],
                    [Id Evaluacion Entidad RDA Consulta Externa],
                    [Ambiente],
                    [URL Envio IHCE],
                    [JSON Enviado],
                    [Hash SHA256 JSON Enviado],
                    [HTTP Status Respuesta],
                    [JSON Respuesta],
                    [Exitoso],
                    [Error]
                )
                VALUES
                (
                    @TipoRda,
                    @IdRDA,
                    @IdRDACE,
                    @Ambiente,
                    @UrlEnvio,
                    @JsonEnviado,
                    @HashJsonEnviado,
                    @HttpStatus,
                    @JsonRespuesta,
                    @Exitoso,
                    @ErrorTexto
                )
            `);
    } catch (traceErr) {
        console.error('⚠️ [RDACE] No se pudo guardar trazabilidad IHCE:', traceErr && traceErr.message ? traceErr.message : traceErr);
    }
}

function sanitizeOptionalPatientFields(patient) {
    if (!patient || typeof patient !== 'object') return;

    if (Array.isArray(patient.extension)) {
        patient.extension = patient.extension.filter((ex) => {
            if (!ex || typeof ex !== 'object' || !ex.url) return false;
            if (Object.prototype.hasOwnProperty.call(ex, 'valueString')) {
                return String(ex.valueString || '').trim() !== '';
            }
            if (Object.prototype.hasOwnProperty.call(ex, 'valueCoding')) {
                const vc = ex.valueCoding || {};
                return String(vc.code || '').trim() !== '';
            }
            return true;
        });
    }

    if (Array.isArray(patient.telecom)) {
        patient.telecom = patient.telecom.filter((t) => t && String(t.value || '').trim() !== '');
    }

    if (Array.isArray(patient.address)) {
        patient.address = patient.address.filter((a) => {
            if (!a || typeof a !== 'object') return false;
            return Boolean(
                String(a.city || '').trim() ||
                String(a.country || '').trim() ||
                (Array.isArray(a.extension) && a.extension.length)
            );
        });
    }
}

function validateRequiredForIhceCeBundle(bundle) {
    if (!bundle || !Array.isArray(bundle.entry)) {
        return 'Bundle inválido: no contiene entry.';
    }

    const entries = bundle.entry;
    const patientEntry = entries.find((e) => e && e.resource && e.resource.resourceType === 'Patient');
    const compositionEntry = entries.find((e) => e && e.resource && e.resource.resourceType === 'Composition');
    if (!patientEntry || !patientEntry.resource) return 'Falta recurso Patient.';
    if (!compositionEntry || !compositionEntry.resource) return 'Falta recurso Composition.';

    const patient = patientEntry.resource;
    const composition = compositionEntry.resource;
    if (!String(patient.id || '').trim()) return 'Patient.id es obligatorio.';
    if (!/^[A-Z]{1,4}-[0-9A-Za-z]+$/.test(String(patient.id || '').trim())) {
        return 'Patient.id debe cumplir el patrón TipoDocumento-NumeroDocumento (ej: CC-123456).';
    }
    if (!composition.subject || !String(composition.subject.reference || '').trim()) {
        return 'Composition.subject.reference es obligatorio.';
    }
    if (!composition.custodian || !String(composition.custodian.reference || '').trim()) {
        return 'Composition.custodian.reference es obligatorio.';
    }

    const patientExt = Array.isArray(patient.extension) ? patient.extension : [];
    const ethnicityExt = patientExt.find(
        (x) => x && typeof x.url === 'string' && /ExtensionPatientEthnicity$/i.test(x.url)
    );
    const ethnicityCode = ethnicityExt && ethnicityExt.valueCoding && ethnicityExt.valueCoding.code != null
        ? String(ethnicityExt.valueCoding.code).trim()
        : '';
    const ethnicityDisplay = ethnicityExt && ethnicityExt.valueCoding && ethnicityExt.valueCoding.display != null
        ? String(ethnicityExt.valueCoding.display).trim()
        : '';
    if (!ethnicityExt || !ethnicityCode || ethnicityCode === '7' || /sin\s*asignar/i.test(ethnicityDisplay)) {
        return 'La etnia del paciente es obligatoria para envío IHCE y no puede estar en "Sin asignar".';
    }

    const custRef = String(composition.custodian.reference || '').trim().replace(/^#/, '');
    const orgExists = entries.some((e) =>
        e &&
        e.resource &&
        e.resource.resourceType === 'Organization' &&
        String(e.resource.id || '').trim() === custRef
    );
    if (!orgExists) {
        return `El custodian de Composition referencia una Organization inexistente en el bundle (${custRef}).`;
    }

    const encounterEntry = entries.find((e) => e && e.resource && e.resource.resourceType === 'Encounter');
    const encounter = encounterEntry && encounterEntry.resource;
    const cupsSystem = 'https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS';
    const svcType = encounter && encounter.serviceType;
    const svcCoding = svcType && Array.isArray(svcType.coding) ? svcType.coding[0] : null;
    const svcSystem = svcCoding && svcCoding.system != null ? String(svcCoding.system).trim() : '';
    const svcCode = svcCoding && svcCoding.code != null ? String(svcCoding.code).trim() : '';
    if (!encounter) {
        return 'Falta recurso Encounter (EncounterAmbulatoryRDA).';
    }
    if (!svcCoding || svcSystem !== cupsSystem || !svcCode) {
        return 'Encounter.serviceType requiere un código CUPS (system https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS). '
            + 'No use GrupoServicios en serviceType: el grupo RIPS va en type[1]=01 solo para el perfil RDA CE; '
            + 'el procedimiento CUPS va en prescripción de procedimientos o en el RIPS de la historia clínica.';
    }

    return '';
}

function collectIcd11CodesFromBundle(bundle) {
    if (!bundle || !Array.isArray(bundle.entry)) return [];
    const out = [];
    const seen = new Set();
    bundle.entry.forEach((e) => {
        const r = e && e.resource;
        if (!r || r.resourceType !== 'Condition') return;
        const codings = r.code && Array.isArray(r.code.coding) ? r.code.coding : [];
        codings.forEach((c) => {
            const system = String(c && c.system ? c.system : '').trim().toLowerCase();
            if (system !== 'http://hl7.org/fhir/sid/icd-11') return;
            const code = String(c && c.code ? c.code : '').trim();
            if (!code) return;
            const key = code.toUpperCase();
            if (seen.has(key)) return;
            seen.add(key);
            out.push(code);
        });
    });
    return out;
}

const router = Router();

// ---------------------------------------------------------------------------
// Helper: convierte string a Date para DateTime2 (devuelve null si inválido)
// ---------------------------------------------------------------------------
const toDateTimeRDACE = (str) => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

// ---------------------------------------------------------------------------
// Helper: solo enteros en string (devuelve null si inválido)
// ---------------------------------------------------------------------------
const toStrictIntStringOrNull = (value) => {
    if (value == null) return null;
    const s = String(value).trim();
    if (!s) return null;
    return /^[0-9]+$/.test(s) ? s : null;
};

const toStrictIntOrNull = (value) => {
    const s = toStrictIntStringOrNull(value);
    if (s == null) return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
};

// ===========================================================================
// PERSISTENCIA — tablas RDACE
// ===========================================================================

// Cabecera principal
router.post('/EvaluacionEntidadRDACE/', async (req, res) => {
    const {
        DocumentoEntidad, FechaRDA,
        CodigoPrestador, CodigoAdminPlanBeneficios, NombreAdminPlanBeneficios,
        FechaHoraInicioAtencion, FechaHoraFinAtencion,
        TipoDocProfesional, NumDocProfesional,
        DiagnosticoIngresoCIE11Codigo, DiagnosticoIngresoCIE11Termino,
        TipoAlergia,
        EntornoAtencion, TipoFactorRiesgo, NombreFactorRiesgo,
        DiagnosticoPrincipalCIE10Codigo, DiagnosticoPrincipalCIE10Nombre, TipoDiagnosticoPrincipal,
        CondicionDestinoEgreso, CodigoPrestadorRemite,
        AlcanceIncapacidad, DiasIncapacidad, DiasLicenciaMaternidad,
        NombreDocumentoPDF,
        IdModalidadAtencion, IdGrupoServicios, IdViaIngresoUsuario, IdCausaMotivoAtencion,
    } = req.body;

    const rdaceIntOrNull = (v) => {
        if (v == null || v === '') return null;
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : null;
    };

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('FechaRDA', sql.DateTime2, toDateTimeRDACE(FechaRDA) || new Date())
            .input('CodigoPrestador', sql.NVarChar, CodigoPrestador || null)
            .input('CodigoAdminPlanBeneficios', sql.NVarChar, CodigoAdminPlanBeneficios || null)
            .input('NombreAdminPlanBeneficios', sql.NVarChar, NombreAdminPlanBeneficios || null)
            .input('FechaHoraInicioAtencion', sql.DateTime2, toDateTimeRDACE(FechaHoraInicioAtencion))
            .input('FechaHoraFinAtencion', sql.DateTime2, toDateTimeRDACE(FechaHoraFinAtencion))
            .input('TipoDocProfesional', sql.NVarChar, TipoDocProfesional || null)
            .input('NumDocProfesional', sql.NVarChar, NumDocProfesional || null)
            .input('DiagnosticoIngresoCIE11Codigo', sql.NVarChar, DiagnosticoIngresoCIE11Codigo || null)
            .input('DiagnosticoIngresoCIE11Termino', sql.NVarChar, DiagnosticoIngresoCIE11Termino || null)
            .input('TipoAlergia', sql.NVarChar, TipoAlergia || null)
            .input('EntornoAtencion', sql.NVarChar, EntornoAtencion || null)
            .input('TipoFactorRiesgo', sql.NVarChar, TipoFactorRiesgo || null)
            .input('NombreFactorRiesgo', sql.NVarChar, NombreFactorRiesgo || null)
            .input('DiagnosticoPrincipalCIE10Codigo', sql.NVarChar, DiagnosticoPrincipalCIE10Codigo || null)
            .input('DiagnosticoPrincipalCIE10Nombre', sql.NVarChar, DiagnosticoPrincipalCIE10Nombre || null)
            .input('TipoDiagnosticoPrincipal', sql.NVarChar, TipoDiagnosticoPrincipal || null)
            .input('CondicionDestinoEgreso', sql.NVarChar, CondicionDestinoEgreso || null)
            .input('CodigoPrestadorRemite', sql.NVarChar, CodigoPrestadorRemite || null)
            .input('AlcanceIncapacidad', sql.NVarChar, AlcanceIncapacidad || null)
            .input('DiasIncapacidad', sql.Int, toStrictIntOrNull(DiasIncapacidad))
            .input('DiasLicenciaMaternidad', sql.Int, toStrictIntOrNull(DiasLicenciaMaternidad))
            .input('NombreDocumentoPDF', sql.NVarChar, NombreDocumentoPDF || null)
            .input('IdModalidadAtencion', sql.Int, rdaceIntOrNull(IdModalidadAtencion))
            .input('IdGrupoServicios', sql.Int, rdaceIntOrNull(IdGrupoServicios))
            .input('IdViaIngresoUsuario', sql.Int, rdaceIntOrNull(IdViaIngresoUsuario))
            .input('IdCausaMotivoAtencion', sql.Int, rdaceIntOrNull(IdCausaMotivoAtencion))
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA Consulta Externa]
                (
                    [Documento Entidad], [Fecha RDA],
                    [Codigo Prestador], [Codigo Admin Plan Beneficios], [Nombre Admin Plan Beneficios],
                    [Fecha Hora Inicio Atencion], [Fecha Hora Fin Atencion],
                    [Tipo Doc Profesional], [Num Doc Profesional],
                    [Diagnostico Ingreso CIE11 Codigo], [Diagnostico Ingreso CIE11 Termino],
                    [Tipo Alergia],
                    [Entorno Atencion], [Tipo Factor Riesgo], [Nombre Factor Riesgo],
                    [Diagnostico Principal CIE10 Codigo], [Diagnostico Principal CIE10 Nombre], [Tipo Diagnostico Principal],
                    [Condicion Destino Egreso], [Codigo Prestador Remite],
                    [Alcance Incapacidad], [Dias Incapacidad], [Dias Licencia Maternidad],
                    [Nombre Documento PDF],
                    [Id Modalidad Atencion], [Id Grupo Servicios], [Id Via Ingreso Usuario], [Id Causa Motivo Atencion]
                )
                OUTPUT INSERTED.[Id Evaluacion Entidad RDA Consulta Externa]
                VALUES
                (
                    @DocumentoEntidad, @FechaRDA,
                    @CodigoPrestador, @CodigoAdminPlanBeneficios, @NombreAdminPlanBeneficios,
                    @FechaHoraInicioAtencion, @FechaHoraFinAtencion,
                    @TipoDocProfesional, @NumDocProfesional,
                    @DiagnosticoIngresoCIE11Codigo, @DiagnosticoIngresoCIE11Termino,
                    @TipoAlergia,
                    @EntornoAtencion, @TipoFactorRiesgo, @NombreFactorRiesgo,
                    @DiagnosticoPrincipalCIE10Codigo, @DiagnosticoPrincipalCIE10Nombre, @TipoDiagnosticoPrincipal,
                    @CondicionDestinoEgreso, @CodigoPrestadorRemite,
                    @AlcanceIncapacidad, @DiasIncapacidad, @DiasLicenciaMaternidad,
                    @NombreDocumentoPDF,
                    @IdModalidadAtencion, @IdGrupoServicios, @IdViaIngresoUsuario, @IdCausaMotivoAtencion
                )
            `);
        const idInsertado = result.recordset[0]['Id Evaluacion Entidad RDA Consulta Externa'];
        res.json({ ok: true, IdEvaluacionEntidadRDACE: idInsertado });
    } catch (error) {
        console.error('❌ Error al insertar Evaluacion Entidad RDA Consulta Externa:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/AntecedentesSalud', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion', sql.NVarChar, Descripcion || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Salud]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdRDACE, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Antecedente Salud:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/AntecedentesFamiliares', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Parentesco, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Parentesco', sql.NVarChar, Parentesco || null)
            .input('Descripcion', sql.NVarChar, Descripcion || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Familiares]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Parentesco], [Descripcion], [Id Estado])
                VALUES (@IdRDACE, @DocumentoEntidad, @Parentesco, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Antecedente Familiar:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/AntecedentesFarmacologicos', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion', sql.NVarChar, Descripcion || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Farmacologicos]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdRDACE, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Antecedente Farmacológico:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/DiagnosticosRelacionados', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, CodigoCIE10, NombreCIE10, CodigoCIE11, TerminoCIE11, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('CodigoCIE10', sql.NVarChar, CodigoCIE10 || null)
            .input('NombreCIE10', sql.NVarChar, NombreCIE10 || null)
            .input('CodigoCIE11', sql.NVarChar, CodigoCIE11 || null)
            .input('TerminoCIE11', sql.NVarChar, TerminoCIE11 || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Codigo CIE10], [Nombre CIE10], [Codigo CIE11], [Termino CIE11], [Id Estado])
                VALUES (@IdRDACE, @CodigoCIE10, @NombreCIE10, @CodigoCIE11, @TerminoCIE11, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Diagnóstico relacionado:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/PrescripcionMedicamentos', async (req, res) => {
    const {
        IdEvaluacionEntidadRDACE,
        tipo, codigo, nombre, dci, fechaPrescripcion,
        dosis, unidadDosis, via,
        duracionCant, duracionUnid, frecuenciaCant, frecuenciaUnid, finalidad,
        IdEstado,
    } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('TipoTec', sql.NVarChar, tipo || null)
            .input('CodigoMed', sql.NVarChar, codigo || null)
            .input('NombreMed', sql.NVarChar, nombre || null)
            .input('Dci', sql.NVarChar, dci || null)
            .input('FechaPresc', sql.DateTime2, toDateTimeRDACE(fechaPrescripcion))
            .input('Dosis', sql.NVarChar, toStrictIntStringOrNull(dosis))
            .input('UnidadDosis', sql.NVarChar, unidadDosis || null)
            .input('Via', sql.NVarChar, via || null)
            .input('DurCant', sql.NVarChar, toStrictIntStringOrNull(duracionCant))
            .input('DurUnid', sql.NVarChar, duracionUnid || null)
            .input('FreqCant', sql.NVarChar, toStrictIntStringOrNull(frecuenciaCant))
            .input('FreqUnid', sql.NVarChar, frecuenciaUnid || null)
            .input('Finalidad', sql.NVarChar, finalidad != null ? String(finalidad) : null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]
                (
                    [Id Evaluacion Entidad RDA Consulta Externa],
                    [Tipo Tec Salud], [Codigo Medicamento], [Nombre Medicamento], [Descripcion Comun DCI],
                    [Fecha Prescripcion], [Dosis Ordenada], [Unidad Medida Dosis], [Via Administracion],
                    [Duracion Cantidad], [Duracion Unidad Tiempo], [Frecuencia Cantidad], [Frecuencia Unidad Tiempo],
                    [Finalidad Tec Salud], [Id Estado]
                )
                VALUES
                (
                    @IdRDACE,
                    @TipoTec, @CodigoMed, @NombreMed, @Dci,
                    @FechaPresc, @Dosis, @UnidadDosis, @Via,
                    @DurCant, @DurUnid, @FreqCant, @FreqUnid,
                    @Finalidad, @IdEstado
                )
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Prescripción medicamento:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/PrescripcionProcedimientos', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, tipo, codigo, nombre, finalidad, fechaPrescripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('TipoTec', sql.NVarChar, tipo || null)
            .input('CodigoProc', sql.NVarChar, codigo || null)
            .input('NombreProc', sql.NVarChar, nombre || null)
            .input('Finalidad', sql.NVarChar, finalidad || null)
            .input('FechaPresc', sql.DateTime2, toDateTimeRDACE(fechaPrescripcion))
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Tipo Tec Salud], [Codigo Procedimiento], [Nombre Procedimiento], [Finalidad Tec Salud], [Fecha Prescripcion], [Id Estado])
                VALUES (@IdRDACE, @TipoTec, @CodigoProc, @NombreProc, @Finalidad, @FechaPresc, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Prescripción procedimiento:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/OtrasTecnologias', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, tipo, codigo, nombre, fechaPrescripcion, finalidad, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('TipoTec', sql.NVarChar, tipo || null)
            .input('Codigo', sql.NVarChar, codigo || null)
            .input('Nombre', sql.NVarChar, nombre || null)
            .input('FechaPresc', sql.DateTime2, toDateTimeRDACE(fechaPrescripcion))
            .input('Finalidad', sql.NVarChar, finalidad || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Otras Tecnologias]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Tipo Tec Salud], [Codigo], [Nombre], [Fecha Prescripcion], [Finalidad Tec Salud], [Id Estado])
                VALUES (@IdRDACE, @TipoTec, @Codigo, @Nombre, @FechaPresc, @Finalidad, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Otra tecnología:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

// ===========================================================================
// CATÁLOGOS 1888
// ===========================================================================

// Egreso y Remisión — sin ?q = todo; con ?q = filtro
router.get('/EgresoRemision', async (req, res) => {
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Egreso y Remision 1888]`);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Egreso y Remision 1888] WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda`);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Egreso y Remisión:', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

router.get('/FactorDeRiesgo', async (req, res) => {
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Factor De Riesgo 1888]`);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Factor De Riesgo 1888] WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda`);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Factor De Riesgo:', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

router.get('/TipoTecnologiaEnSalud', async (req, res) => {
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Tipo de tecnología en salud 1888]`);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Tipo de tecnología en salud 1888] WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda`);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Tipo de tecnología en salud:', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

const RDACE_CATALOGOS_1888 = {
    EntornoAtencion:             '[Cnsta Entorno de atencion 1888]',
    TipoAlergia:                 '[Cnsta Tipo de alergia 1888]',
    ParentescoFamiliar:          '[Cnsta Parentesco familiar RDA 1888]',
    TipoDiagnosticoPrincipal:    '[Cnsta Tipo diagnostico principal 1888]',
    UnidadMedidaDosis:           '[Cnsta Unidad medida dosis 1888]',
    ViaAdministracionMedicamento:'[Cnsta Via administracion medicamento 1888]',
    UnidadTiempoDuracion:        '[Cnsta Unidad tiempo duracion 1888]',
    UnidadTiempoFrecuencia:      '[Cnsta Unidad tiempo frecuencia 1888]',
    FinalidadTecnologiaSalud:    '[Cnsta Finalidad tecnologia salud 1888]',
    OtraTecnologiaCategoria:     '[Cnsta Otra tecnologia categoria 1888]',
    AlcanceIncapacidad:          '[Cnsta Alcance incapacidad 1888]',
};

router.get('/Catalogo1888/:clave', async (req, res) => {
    const viewName = RDACE_CATALOGOS_1888[req.params.clave];
    if (!viewName) return res.status(404).json({ error: 'Catálogo no encontrado', clave: req.params.clave });
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`SELECT Codigo, Descripcion, IdEstado FROM ${viewName}`);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`SELECT Codigo, Descripcion, IdEstado FROM ${viewName} WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda`);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error catálogo 1888', req.params.clave, error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

// ===========================================================================
// RDACE — PDF resumen clínico (descarga)
// ===========================================================================
router.get('/EvaluacionEntidadRDACE/:id/ResumenClinico.pdf', async (req, res) => {
    const id = req.params.id != null ? parseInt(req.params.id, 10) : NaN;
    if (!Number.isFinite(id)) {
        return res.status(400).send('Id inválido');
    }
    const forceRegenerate = req.query.regenerar === '1' || String(req.query.regenerar || '').toLowerCase() === 'true';
    try {
        const pool = await poolPromise;
        const aggregate = await loadRdaceAggregate(pool, sql, id, req.query || {});
        const pdfBuf = await rdacePdfService().getOrBuildRdacePdfBuffer({
            pool,
            sql,
            id,
            aggregate,
            forceRegenerate,
            reqBody: req.query || {},
        });
        const strFn = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);
        const doc = strFn(aggregate.head.DocumentoEntidad) || 'paciente';
        const nombre = strFn(aggregate.head.NombreDocumentoPDF) || `RDA_CE_${doc}_${id}.pdf`;
        const asciiName = nombre.replace(/[^\w.\-]+/g, '_').slice(0, 180) || `RDA_CE_${id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"`);
        res.send(pdfBuf);
    } catch (e) {
        if (e.code === 'RDACE_NOT_FOUND') {
            return res.status(404).send('No existe el registro RDACE indicado');
        }
        if (e.code === 'RDACE_PDF_DEPS_MISSING') {
            return res.status(503).send(e.message || 'Faltan dependencias PDF (npm install en back_relacionador).');
        }
        console.error('[RDACE] Error sirviendo ResumenClinico.pdf:', e);
        return res.status(500).send('Error al generar el PDF');
    }
});

// ===========================================================================
// FHIR BUNDLE — construcción local (sin envío a IHCE)
// ===========================================================================
// Body:  { "IdEvaluacionEntidadRDACE": 123,
//          "overrideCodigoPrestador": "...",   // opcional (REPS)
//          "overrideNombrePrestadorIPS": "...",   // opcional
//          "overrideNitPrestadorIPS":   "..." }   // opcional
// Envío IHCE: POST {IHCE_BASE}/Composition/$enviar-rda-consulta (ver handler EnviarIHCE más abajo)
router.post('/RdaConsultaExterna/FhirBundle', async (req, res) => {
    const { IdEvaluacionEntidadRDACE } = req.body || {};
    const id = IdEvaluacionEntidadRDACE != null ? parseInt(IdEvaluacionEntidadRDACE, 10) : NaN;
    if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
    }

    const newUuid = () => {
        try { if (typeof randomUUID === 'function') return randomUUID(); } catch (_) {}
        return `uuid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };
    const makeEntry = (resource) => {
        resource.id = resource.id || newUuid();
        return { resource };
    };
    const refOf = (entryOrId, resourceTypeHint = '') => {
        if (typeof entryOrId === 'string') {
            const raw = String(entryOrId).trim();
            if (!raw) throw new Error('[RDACE] No se puede referenciar un id vacío');
            if (/^[A-Za-z]+\/.+$/.test(raw)) return raw;
            if (resourceTypeHint) return `${resourceTypeHint}/${raw.replace(/^#/, '')}`;
            return raw.replace(/^#/, '');
        }
        const r = entryOrId && entryOrId.resource ? entryOrId.resource : entryOrId;
        const rid = r && r.id ? String(r.id) : '';
        const rt = r && r.resourceType ? String(r.resourceType) : '';
        if (!rid) throw new Error('[RDACE] No se puede referenciar un recurso sin id');
        if (!rt) throw new Error(`[RDACE] Recurso ${rid} sin resourceType para referencia interna`);
        return `${rt}/${rid}`;
    };

    const refId = (reference) => {
        const raw = String(reference || '').trim();
        if (!raw) return '';
        if (raw.startsWith('urn:uuid:')) return raw.slice('urn:uuid:'.length);
        if (raw.startsWith('#')) return raw.slice(1);
        const m = raw.match(/^[A-Za-z]+\/(.+)$/);
        return m ? m[1] : raw;
    };

    const nowIso        = new Date().toISOString();
    const str           = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);
    const toIsoDateTime = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); };
    const toIsoDate     = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]; };

    const RDA_SD       = 'https://fhir.minsalud.gov.co/rda/StructureDefinition';
    const CS_MODALITY  = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality';
    const CS_GRUPO_SVC = 'https://fhir.minsalud.gov.co/rda/CodeSystem/GrupoServicios';
    const CS_ENTORNO   = 'https://fhir.minsalud.gov.co/rda/CodeSystem/EntornoAtencion';
    const CS_CAUSA_EXT = 'https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSCausaExternaVersion2';
    const CS_DIAG_ROLE = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDiagnosisRole';
    const CS_TIPO_DIAG = 'https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSTipoDiagnosticoPrincipalVersion2';
    const CS_EGRESO    = 'https://fhir.minsalud.gov.co/rda/CodeSystem/CondicionyDestinoUsuarioEgreso';
    const CS_TIPO_ALERGIA = 'https://fhir.minsalud.gov.co/rda/CodeSystem/TipoAlergia';
    const CS_FACTOR_RIESGO_IG = 'https://fhir.minsalud.gov.co/rda/CodeSystem/FactorRiesgo';
    const CS_CUPS = 'https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS';
    const CS_UMM = 'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM';
    const CS_COLOMBIAN_LICENSE_SCOPE = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianLicenseScope';
    const CS_RIPS_FINALIDAD = 'https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSFinalidadConsultaVersion2';
    const CS_COLOMBIAN_HT_CAT = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianHealthTechnologyCategory';
    const CS_MIPRES_INN = 'https://fhir.minsalud.gov.co/rda/CodeSystem/MipresINN';
    const SCT = 'http://snomed.info/sct';

    const codeableFromDb = (system, code, display) => {
        const c = str(code);
        const d = str(display);
        if (!c && !d) return null;
        return {
            coding: [{ system, code: c || d, display: d || undefined }],
            text: d || c || undefined,
        };
    };
    const finalidadCodigoFromDb = (codigo, raw) => {
        const c = str(codigo);
        if (c) return c;
        const s = str(raw);
        if (!s) return '';
        const m = s.match(/^(\d{1,2})/);
        return m ? String(parseInt(m[1], 10)).padStart(2, '0') : s;
    };
    const ripsFinalidadCodeable = (code, display, rawFallback) => {
        const c = finalidadCodigoFromDb(code, rawFallback || display);
        const d = str(display) || str(rawFallback);
        return codeableFromDb(CS_RIPS_FINALIDAD, c, d);
    };
    /** Código ColombianGenderGroup (01/02/03) y gender FHIR alineados — solo datos de BD / catálogo Sexo 1888. */
    const patientGenderFromDb = (pdem) => {
        const codigoCatalogo = str(pdem.CodigoSexo);
        const letraSexo = str(pdem.SexoPaciente);
        const display = str(pdem.Sexo);

        let grupoCode = null;
        if (codigoCatalogo) {
            const c = codigoCatalogo.trim();
            if (/^0?[1-3]$/.test(c)) {
                grupoCode = String(parseInt(c, 10)).padStart(2, '0');
            } else if (/^(01|02|03)$/i.test(c)) {
                grupoCode = c.toUpperCase();
            } else if (/^[MF]$/i.test(c)) {
                grupoCode = c.toUpperCase() === 'M' ? '01' : '02';
            }
        }
        if (!grupoCode && letraSexo && /^[MF]$/i.test(letraSexo)) {
            grupoCode = letraSexo.toUpperCase() === 'M' ? '01' : '02';
        }
        if (!grupoCode) return { fhirGender: undefined, bioGender: null };

        const fhirByGrupo = { '01': 'male', '02': 'female', '03': 'unknown' };
        return {
            fhirGender: fhirByGrupo[grupoCode],
            bioGender: { code: grupoCode, display: display || undefined },
        };
    };
    const ICD10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10';
    const ICD11_SYSTEM = 'http://hl7.org/fhir/sid/icd-11';

    // Perfil IG RDA Consulta: ConditionRDA (https://vulcano.ihcecol.gov.co/RDA-consulta)
    // ConditionStatementRDA corresponde al RDA Paciente y no está permitido en $enviar-rda-consulta.
    const CONDITION_RDA_BASE = {
        clinicalStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }],
        },
        verificationStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed', display: 'Confirmed' }],
        },
        category: [{
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }],
        }],
    };

    try {
        const pool = await poolPromise;

        let aggregate;
        try {
            aggregate = await loadRdaceAggregate(pool, sql, id, req.body || {});
        } catch (loadErr) {
            if (loadErr.code === 'RDACE_NOT_FOUND') {
                return res.status(404).json({ ok: false, error: loadErr.message });
            }
            throw loadErr;
        }

        const head = aggregate.head;
        const pdem = aggregate.pdem;
        const diagRelacionados = aggregate.diagRelacionados;
        const medPrescripciones = aggregate.medPrescripciones;
        const procPrescripciones = aggregate.procPrescripciones;
        const otrasTecnologias = aggregate.otrasTecnologias;
        const codPrest = str(head.CodigoPrestador);
        const nitIpsOverride = str((req.body || {}).overrideNitPrestadorIPS)
            || str(process.env.IHCE_RDACE_DEFAULT_NIT_IPS);
        const nomIpsOverride = str((req.body || {}).overrideNombrePrestadorIPS)
            || str(process.env.IHCE_RDACE_DEFAULT_NOMBRE_IPS);

        // =======================================================================
        // CONSTRUCCIÓN DE RECURSOS FHIR
        // =======================================================================

        // Organization EAPB
        const orgId = str(head.CodigoAdminPlanBeneficios) || newUuid();
        const eapbOrgEntry = str(head.NombreAdminPlanBeneficios) ? makeEntry({
            resourceType: 'Organization',
            id: orgId,
            meta: { profile: [`${RDA_SD}/HealthBenefitPlanAdminOrganizationRDA`] },
            identifier: str(head.CodigoAdminPlanBeneficios) ? [{
                use: 'official',
                type: { coding: [
                    { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'NIIP', display: 'National Insurance Payor Identifier' },
                    { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'EAPB', display: 'Entidad Administradora de Planes de Beneficios' },
                ] },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/EAPB',
                value: str(head.CodigoAdminPlanBeneficios),
            }] : undefined,
            active: true,
            name: str(head.NombreAdminPlanBeneficios),
        }) : null;

        // Organization IPS: id = código REPS (igual que RDA Paciente / ejemplos jsonsalida CE). type + address + period REPS alinean con Organization que devuelve IHCE.
        const CS_PROVIDER_CLASS = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianProviderClass';
        const CS_LEGAL_NATURE   = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianLegalNatureType';
        const CS_DIVIPOLA       = 'https://fhir.minsalud.gov.co/rda/CodeSystem/DIVIPOLA';
        const ipsId = codPrest ? codPrest : '';
        const repsPeriodStart = str(process.env.IHCE_RDACE_DEFAULT_REPS_PERIOD_START) || '2011-11-30';
        const ipsMunicipioCode = str(process.env.IHCE_RDACE_DEFAULT_DIVIPOLA_MUNICIPIO) || '05001';
        const ipsDeptCode      = str(process.env.IHCE_RDACE_DEFAULT_DIVIPOLA_DEPTO) || '05';
        const nombreIps        = codPrest ? (nomIpsOverride || `IPS (${codPrest})`) : '';
        let ipsOrgEntry = null;
        if (codPrest) {
            const nitIps    = nitIpsOverride || null;
            ipsOrgEntry = makeEntry({
                resourceType: 'Organization',
                id: ipsId,
                meta: { profile: [`${RDA_SD}/CareDeliveryOrganizationRDA`] },
                active: true,
                name: nombreIps,
                type: [
                    { coding: [{ system: CS_PROVIDER_CLASS, code: 'IPS', display: 'Institución Prestadora de Servicios de Salud' }] },
                    { coding: [{ system: CS_LEGAL_NATURE, code: 'PRIV', display: 'Privada' }] },
                ],
                identifier: [
                    ...(nitIps ? [{
                        id: 'TaxIdentifier', use: 'official',
                        type: { coding: [
                            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'TAX', display: 'Tax ID number' },
                            { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'NIT', display: 'Número de Identificación Tributaria' },
                        ] },
                        system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/DIAN',
                        value: nitIps,
                    }] : []),
                    {
                        id: 'HealthcareProviderIdentifier', use: 'official',
                        type: { coding: [
                            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                            { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'CodigoPrestador', display: 'Código de habilitación de prestador de servicios de salud' },
                        ] },
                        system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                        value: codPrest,
                        period: { start: repsPeriodStart },
                    },
                ],
                address: [{
                    use: 'work',
                    type: 'physical',
                    text: 'Sin informacion',
                    city: 'MEDELLÍN',
                    _city: {
                        extension: [{
                            url: `${RDA_SD}/ExtensionDivipolaMunicipality`,
                            valueCoding: { system: CS_DIVIPOLA, code: ipsMunicipioCode },
                        }],
                    },
                    state: 'ANTIOQUIA',
                    _state: {
                        extension: [{
                            url: `${RDA_SD}/ExtensionDivipolaDepartment`,
                            valueCoding: { system: CS_DIVIPOLA, code: ipsDeptCode },
                        }],
                    },
                    country: 'CO',
                }],
            });
        }

        // Patient (documento desde cabecera CE; mismo criterio que loadRdaceAggregate)
        const docPac = str(head.DocumentoEntidad);
        const docTypeCode  = str(pdem.TipoDocumentoBase);
        const pacienteId   = docTypeCode && docPac ? `${docTypeCode}-${docPac}` : null;
        const { fhirGender, bioGender } = patientGenderFromDb(pdem);
        if (str(pdem.CodigoSexo) || str(pdem.SexoPaciente)) {
            if (!bioGender || !fhirGender) {
                return res.status(400).json({
                    ok: false,
                    error: 'Sexo biológico en BD incompleto o no mapeable a catálogo (01 Hombre / 02 Mujer / 03 Indeterminado). Revise [Cnsta Sexo 1888] y EntidadIII.Id Sexo.',
                });
            }
        }
        const zonaFromDb = (() => {
            const codigo = str(pdem.CodigoZonaResidencia);
            const letra = str(pdem.ZonaResidencia);
            const descripcion = str(pdem.DescripcionZonaResidencia);
            let code = null;
            if (/^0?[12]$/.test(codigo || '')) {
                code = String(parseInt(codigo, 10)).padStart(2, '0');
            } else if (/^0[12]$/.test(codigo || '')) {
                code = codigo;
            } else if (letra && /^[UR]$/i.test(letra)) {
                code = letra.toUpperCase() === 'U' ? '01' : '02';
            } else if (descripcion && /urbana/i.test(descripcion)) {
                code = '01';
            } else if (descripcion && /rural/i.test(descripcion)) {
                code = '02';
            }
            if (!code) return { code: null, display: null };
            const display = descripcion
                || (code === '01' ? 'Urbana' : 'Rural');
            return { code, display };
        })();
        const zonaCode = zonaFromDb.code;
        const zonaDisplay = zonaFromDb.display;

        const patExt = [];
        if (str(pdem.CodigoPaisNacionalidad)) {
            const cNat = str(pdem.CodigoPaisNacionalidad);
            const dNat = str(pdem.NombrePaisNacionalidad);
            const dispNat = dNat;
            patExt.push({ url: `${RDA_SD}/ExtensionPatientNationality`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661', code: cNat, display: dispNat || undefined } });
        }
        {
            const ethnicity = ethnicityFromDb(pdem.CodigoEtnia, pdem.TextoEtnia);
            if (ethnicity) {
                patExt.push({
                    url: `${RDA_SD}/ExtensionPatientEthnicity`,
                    valueCoding: {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianEthnicGroup',
                        code: ethnicity.code,
                        display: ethnicity.display,
                    },
                });
            }
        }
        if (str(pdem.ComunidadEtnica))        patExt.push({ url: `${RDA_SD}/ExtensionPatientEthnicCommunity`, valueString: str(pdem.ComunidadEtnica) });
        if (str(pdem.CodigoDiscapacidad))     patExt.push({ url: `${RDA_SD}/ExtensionPatientDisability`,    valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDisabilityClassification', code: str(pdem.CodigoDiscapacidad),    display: str(pdem.TextoDiscapacidad)     || undefined } });
        if (str(pdem.CodigoIdentidadGenero) && pdem.IdIdentidadGenero && pdem.IdIdentidadGenero !== 0) patExt.push({ url: `${RDA_SD}/ExtensionPatientGenderIdentity`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderIdentity', code: str(pdem.CodigoIdentidadGenero), display: str(pdem.TextoIdentidadGenero) || undefined } });

        const primerApellido  = str(pdem.PrimerApellidoBase)  || '';
        const segundoApellido = str(pdem.SegundoApellidoBase) || '';
        const primerNombre    = str(pdem.PrimerNombreBase)    || '';
        const segundoNombre   = str(pdem.SegundoNombreBase)   || '';
        const familyText      = primerApellido || undefined;
        const givenArr        = [primerNombre, segundoNombre].filter(Boolean);
        const familyExtArr    = [
            ...(primerApellido  ? [{ url: `${RDA_SD}/ExtensionFathersFamilyName`, valueString: primerApellido  }] : []),
            ...(segundoApellido ? [{ url: `${RDA_SD}/ExtensionMothersFamilyName`, valueString: segundoApellido }] : []),
        ];
        const hasAddr  = str(pdem.CodigoPaisResidencia) || str(pdem.NombreMunicipio) || str(pdem.Direccion);
        const homeAddr = hasAddr ? (() => {
            const addr = { id: 'HomeAddress-0', use: 'home', type: 'physical' };
            if (zonaCode) addr.extension = [{ url: `${RDA_SD}/ExtensionResidenceZone`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianResidenceZone', code: zonaCode, display: zonaDisplay } }];
            console.log('zonaCode', zonaCode);
            console.log('zonaDisplay', zonaDisplay);
            if (str(pdem.Direccion)) addr.line = [str(pdem.Direccion)];
            if (str(pdem.NombreMunicipio)) {
                addr.city = str(pdem.NombreMunicipio);
                if (str(pdem.CodigoMunicipio)) addr._city = { extension: [{ url: `${RDA_SD}/ExtensionDivipolaMunicipality`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/DIVIPOLA', code: str(pdem.CodigoMunicipio) } }] };
            }
            if (str(pdem.CodigoPaisResidencia)) {
                addr.country  = str(pdem.NombrePaisResidencia) || str(pdem.CodigoPaisResidencia);
                addr._country = { extension: [{ url: `${RDA_SD}/ExtensionCountryCode`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661', code: str(pdem.CodigoPaisResidencia) } }] };
            }
            return addr;
        })() : null;

        if (!pacienteId) {
            return res.status(400).json({ ok: false, error: 'Faltan tipo y número de documento del paciente en base de datos' });
        }
        const patientEntry = makeEntry({
            resourceType: 'Patient',
            id: pacienteId,
            meta: { profile: [`${RDA_SD}/PatientRDA`] },
            ...(patExt.length > 0 ? { extension: patExt } : {}),
            identifier: docPac ? [{
                id: 'NationalPersonIdentifier-0', use: 'official',
                type: { coding: [
                    { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PN', display: 'Person number' },
                    ...(docTypeCode ? [{ system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier', code: docTypeCode }] : []),
                ] },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC',
                value: docPac,
            }] : undefined,
            active: true,
            ...(familyText || givenArr.length > 0 ? { name: [{ use: 'official', ...(familyText ? { family: familyText } : {}), ...(familyExtArr.length > 0 ? { _family: { extension: familyExtArr } } : {}), ...(givenArr.length > 0 ? { given: givenArr } : {}) }] } : {}),
            ...(fhirGender ? { gender: fhirGender } : {}),
            ...(bioGender  ? { _gender: { extension: [{ url: `${RDA_SD}/ExtensionBiologicalGender`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderGroup', code: bioGender.code, display: bioGender.display } }] } } : {}),
            ...(() => {
                const birthIso = toIsoDate(pdem.FechaNacimiento);
                if (!birthIso) return {};
                const out = { birthDate: birthIso };
                const bd = new Date(pdem.FechaNacimiento);
                if (!isNaN(bd.getTime()) && (bd.getUTCHours() || bd.getUTCMinutes() || bd.getUTCSeconds())) {
                    out._birthDate = { extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/patient-birthTime', valueDateTime: bd.toISOString() }] };
                }
                return out;
            })(),
            deceasedBoolean: false,
            ...(str(pdem.TelefonoCelular) ? { telecom: [{ system: 'phone', value: str(pdem.TelefonoCelular) }] } : {}),
            ...(homeAddr    ? { address: [homeAddr] } : {}),
            ...(eapbOrgEntry ? { managingOrganization: { reference: refOf(eapbOrgEntry), display: str(head.NombreAdminPlanBeneficios) || undefined } } : {}),
        });

        // Practitioner
        const tipoProf = str(head.TipoDocProfesional);
        const numProf  = str(head.NumDocProfesional);
        const practId  = tipoProf && numProf ? `${tipoProf}-${numProf}` : null;
        if (!practId) {
            return res.status(400).json({ ok: false, error: 'Faltan tipo y número de documento del profesional en base de datos' });
        }
        const practitionerEntry = makeEntry({
            resourceType: 'Practitioner',
            id: practId,
            meta: { profile: [`${RDA_SD}/PractitionerRDA`] },
            identifier: [{ id: 'NationalPersonIdentifier-0', use: 'official',
                type: { coding: [
                    { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PN', display: 'Person number' },
                    { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier', code: tipoProf },
                ] },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC',
                value: numProf,
            }],
            active: true,
        });

        // Condition principal + relacionadas.
        // Perfil: ConditionRDA (RDA Consulta). Id patrón Condition-<n> (BUNDLE-005).
        let conditionSeq = 0;
        let condPrincipalEntry = (str(head.DiagPrincipalCIE10Codigo) || str(head.DiagnosticoIngresoCIE11Codigo)) ? makeEntry({
            resourceType: 'Condition',
            id: `Condition-${conditionSeq++}`,
            meta: { profile: [`${RDA_SD}/ConditionRDA`] },
            ...CONDITION_RDA_BASE,
            subject: { reference: refOf(patientEntry) },
            code: {
                coding: [
                    ...(str(head.DiagPrincipalCIE10Codigo)     ? [{ system: ICD10_SYSTEM, code: str(head.DiagPrincipalCIE10Codigo),     display: str(head.DiagPrincipalCIE10Nombre)       || undefined }] : []),
                    ...(str(head.DiagnosticoIngresoCIE11Codigo) ? [{ system: ICD11_SYSTEM, code: str(head.DiagnosticoIngresoCIE11Codigo), display: str(head.DiagnosticoIngresoCIE11Termino) || undefined }] : []),
                ],
                text: str(head.DiagPrincipalCIE10Nombre) || str(head.DiagnosticoIngresoCIE11Termino) || str(head.DiagPrincipalCIE10Codigo) || undefined,
            },
        }) : null;

        // Diagnósticos relacionados
        const condRelacionadasEntries = diagRelacionados.map((r) => {
            const c10 = str(r.CodigoCIE10); const c11 = str(r.CodigoCIE11);
            if (!c10 && !c11) return null;
            return makeEntry({
                resourceType: 'Condition',
                id: `Condition-${conditionSeq++}`,
                meta: { profile: [`${RDA_SD}/ConditionRDA`] },
                ...CONDITION_RDA_BASE,
                subject: { reference: refOf(patientEntry) },
                code: {
                    coding: [
                        ...(c10 ? [{ system: ICD10_SYSTEM, code: c10, display: str(r.NombreCIE10)   || undefined }] : []),
                        ...(c11 ? [{ system: ICD11_SYSTEM, code: c11, display: str(r.TerminoCIE11) || undefined }] : []),
                    ],
                    text: str(r.NombreCIE10) || str(r.TerminoCIE11) || c10 || c11,
                },
            });
        }).filter(Boolean);

        // AllergyIntolerance — AllergyIntoleranceRDA: verificationStatus → ValueSet allergyintolerance-verification (R4).
        const tipoAlergiaCode = str(head.TipoAlergia);
        const allergyEntry   = tipoAlergiaCode ? makeEntry({
            resourceType: 'AllergyIntolerance',
            id: 'AllergyIntolerance-0',
            meta: { profile: [`${RDA_SD}/AllergyIntoleranceRDA`] },
            clinicalStatus:     { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active', display: 'Active' }] },
            verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed', display: 'Confirmed' }] },
            code: {
                coding: [{
                    system: CS_TIPO_ALERGIA,
                    code: tipoAlergiaCode,
                    display: str(head.NombreTipoAlergia) || undefined,
                }],
                text: str(head.NombreTipoAlergia) || tipoAlergiaCode,
            },
            patient: { reference: refOf(patientEntry) },
        }) : null;

        // RiskAssessment — RiskFactorRDA: status registered (fijo); encounter 1..1; FactorRiesgo + texto obligatorio
        const tipoRiesgo   = str(head.TipoFactorRiesgo);
        const nombreRiesgo = str(head.NombreFactorRiesgo);
        const riskEntry    = tipoRiesgo ? makeEntry({
            resourceType: 'RiskAssessment',
            id: 'RiskAssessment-0',
            meta: { profile: [`${RDA_SD}/RiskFactorRDA`] },
            status: 'registered',
            encounter: { reference: refOf('Encounter-0', 'Encounter') },
            subject: { reference: refOf(patientEntry) },
            code: {
                coding: [{ system: CS_FACTOR_RIESGO_IG, code: tipoRiesgo, display: nombreRiesgo || undefined }],
                text: nombreRiesgo || tipoRiesgo,
            },
            prediction: [],
        }) : null;

        const authoredOnFromHead = toIsoDateTime(head.FechaRDA)
            || toIsoDateTime(head.FechaHoraInicioAtencion)
            || toIsoDateTime(head.FechaHoraFinAtencion);

        // MedicationRequest — MedicationRequestRDA: código MipresINN debe existir en ValueSet MipresDCI (solo CodigoMedicamento oficial Mi Prescripción).
        const CS_MED_TIME = 'https://fhir.minsalud.gov.co/rda/CodeSystem/MedicationTime';
        let medSeq = 0;
        const medRequestEntries = medPrescripciones.map((m) => {
            const medCode = str(m.CodigoMedicamento);
            if (!medCode) return null;
            const medName = str(m.NombreMedicamento) || str(m.DCI) || medCode;
            const medReq  = {
                resourceType: 'MedicationRequest',
                id: `MedicationRequest-${medSeq++}`,
                meta: { profile: [`${RDA_SD}/MedicationRequestRDA`] },
                status: 'active', intent: 'order',
                category: [{
                    coding: [{
                        system: CS_COLOMBIAN_HT_CAT,
                        code: '02',
                        display: 'Medicamento con registro sanitario',
                    }],
                }],
                reportedBoolean: false,
                medicationCodeableConcept: {
                    coding: [{ system: CS_MIPRES_INN, code: String(medCode).slice(0, 64), display: medName }],
                    text: medName,
                },
                subject: { reference: refOf(patientEntry) },
                encounter: { reference: refOf('Encounter-0', 'Encounter') },
                ...(ripsFinalidadCodeable(m.FinalidadCodigo, m.FinalidadDescripcion, m.Finalidad) ? { reasonCode: [ripsFinalidadCodeable(m.FinalidadCodigo, m.FinalidadDescripcion, m.Finalidad)] } : {}),
                ...(toIsoDateTime(m.FechaPrescripcion) || authoredOnFromHead ? { authoredOn: toIsoDateTime(m.FechaPrescripcion) || authoredOnFromHead } : {}),
            };
            const dosis = str(m.DosisOrdenada); const via = str(m.ViaAdministracion);
            const durCant = str(m.DuracionCantidad); const durUnid = str(m.DuracionUnidad);
            const freqCant = str(m.FrecuenciaCantidad); const freqUnid = str(m.FrecuenciaUnidad);
            const ummCode = str(m.UnidadDosisCodigo);
            const ummDisplay = str(m.UnidadDosisDescripcion);
            const medTimeCode = str(m.FrecuenciaUnidadCodigo);
            const medTimeDisplay = str(m.FrecuenciaUnidadDescripcion);
            const durUnit = str(m.DuracionUnidadCodigo);
            const dosageInst = {
                ...(via ? { route: { text: via } } : {}),
                ...((durCant && durUnit) || medTimeCode ? {
                    timing: {
                        ...(durCant && durUnit ? {
                            repeat: {
                                duration: parseFloat(durCant),
                                durationUnit: durUnit,
                            },
                        } : {}),
                        ...(medTimeCode ? {
                            code: {
                                coding: [{
                                    system: CS_MED_TIME,
                                    code: medTimeCode,
                                    display: medTimeDisplay || undefined,
                                }],
                            },
                        } : {}),
                    },
                } : {}),
            };
            const dv = dosis != null && String(dosis).trim() !== '' ? parseFloat(dosis) : NaN;
            if (Number.isFinite(dv) && ummCode) {
                dosageInst.doseAndRate = [{
                    doseQuantity: {
                        value: dv,
                        unit: ummDisplay || ummCode,
                        system: CS_UMM,
                        code: ummCode,
                    },
                    ...(freqCant && medTimeCode ? {
                        rateQuantity: {
                            value: parseFloat(freqCant),
                            unit: medTimeDisplay || medTimeCode,
                            system: CS_MED_TIME,
                            code: medTimeCode,
                        },
                    } : {}),
                }];
            }
            if (Object.keys(dosageInst).length > 0) medReq.dosageInstruction = [dosageInst];
            return makeEntry(medReq);
        }).filter(Boolean);

        // ServiceRequest: procedimientos + otras tecnologías con secuencia global (BUNDLE-005: id = ServiceRequest-<n>)
        let serviceSeq = 0;
        const serviceRequestEntries = procPrescripciones.map((p) => {
            const cprod = str(p.CodigoProcedimiento);
            return makeEntry({
                resourceType: 'ServiceRequest',
                id: `ServiceRequest-${serviceSeq++}`,
                meta: { profile: [`${RDA_SD}/ServiceRequestRDA`] },
                status: 'active', intent: 'order',
                category: [{
                    coding: [{
                        system: CS_COLOMBIAN_HT_CAT,
                        code: '01',
                        display: 'Procedimiento en salud',
                    }],
                }],
                ...(ripsFinalidadCodeable(p.FinalidadCodigo, p.FinalidadDescripcion, p.Finalidad) ? { reasonCode: [ripsFinalidadCodeable(p.FinalidadCodigo, p.FinalidadDescripcion, p.Finalidad)] } : {}),
                code: {
                    coding: cprod ? [{
                        system: CS_CUPS,
                        code: cprod,
                        display: str(p.NombreProcedimiento) || undefined,
                    }] : [],
                    text: str(p.NombreProcedimiento) || cprod || undefined,
                },
                subject: { reference: refOf(patientEntry) },
                encounter: { reference: refOf('Encounter-0', 'Encounter') },
                ...(toIsoDateTime(p.FechaPrescripcion) || authoredOnFromHead ? { authoredOn: toIsoDateTime(p.FechaPrescripcion) || authoredOnFromHead } : {}),
            });
        });

        // ServiceRequest: otras tecnologías — primer coding SNOMED (perfil); categoría ValueSet ColombianOtherHealthTechnologyCategoryCodes
        const otrasTecEntries = otrasTecnologias.map((o) => {
            const cotra = str(o.Codigo);
            const nom = str(o.Nombre) || cotra || 'Otra tecnología';
            return makeEntry({
                resourceType: 'ServiceRequest',
                id: `ServiceRequest-${serviceSeq++}`,
                meta: { profile: [`${RDA_SD}/OtherTechnologyServiceRequestRDA`] },
                status: 'active', intent: 'order',
                category: [{
                    coding: [{
                        system: CS_COLOMBIAN_HT_CAT,
                        code: '13',
                        display: 'Servicio complementario',
                    }],
                }],
                ...(ripsFinalidadCodeable(o.FinalidadCodigo, o.FinalidadDescripcion, o.Finalidad) ? { reasonCode: [ripsFinalidadCodeable(o.FinalidadCodigo, o.FinalidadDescripcion, o.Finalidad)] } : {}),
                code: {
                    coding: cotra ? [{ system: SCT, code: cotra, display: nom || undefined }] : [],
                    text: nom || cotra || undefined,
                },
                subject: { reference: refOf(patientEntry) },
                encounter: { reference: refOf('Encounter-0', 'Encounter') },
                ...(toIsoDateTime(o.FechaPrescripcion) || authoredOnFromHead ? { authoredOn: toIsoDateTime(o.FechaPrescripcion) || authoredOnFromHead } : {}),
            });
        });

        // Observation incapacidad — AttendanceAllowanceRDA: slices LicenseScope (1..1), LicenseTime, MaternityLicenseTime (IG 0.7+/0.8)
        const alcanceIncapacidad = str(head.AlcanceIncapacidad);
        const diasIncapacidad    = toStrictIntOrNull(head.DiasIncapacidad);
        const diasLicencia       = toStrictIntOrNull(head.DiasLicenciaMaternidad);
        const colombianLicenseScopeCoding = () => {
            if (!alcanceIncapacidad) return [];
            return [{
                system: CS_COLOMBIAN_LICENSE_SCOPE,
                code: alcanceIncapacidad,
                display: str(head.NombreAlcanceIncapacidad) || undefined,
            }];
        };
        const incapacidadEntry   = (alcanceIncapacidad || (diasIncapacidad != null && !isNaN(diasIncapacidad)) || (diasLicencia != null && !isNaN(diasLicencia))) ? makeEntry({
            resourceType: 'Observation',
            id: 'Observation-0',
            meta: { profile: [`${RDA_SD}/AttendanceAllowanceRDA`] },
            status: 'final',
            code: {
                coding: [{ system: SCT, code: '160983005', display: 'permiso de concurrencia' }],
                text: 'Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)',
            },
            subject: { reference: refOf(patientEntry) },
            component: [
                {
                    id: 'LicenseScope',
                    code: {
                        coding: [{ system: SCT, code: '255590007', display: 'alcance' }],
                        text: 'Incapacidad - Alcance de la incapacidad',
                    },
                    valueCodeableConcept: { coding: colombianLicenseScopeCoding() },
                },
                ...((diasIncapacidad != null && !isNaN(diasIncapacidad)) ? [{
                    id: 'LicenseTime',
                    code: {
                        coding: [{ system: SCT, code: '410670007', display: 'tiempo' }],
                        text: 'Días de incapacidad',
                    },
                    valueQuantity: { value: diasIncapacidad, unit: 'días', system: 'http://unitsofmeasure.org', code: 'd' },
                }] : []),
                ...((diasLicencia != null && !isNaN(diasLicencia)) ? [{
                    id: 'MaternityLicenseTime',
                    code: {
                        coding: [{ system: SCT, code: '410670007', display: 'tiempo' }],
                        text: 'Días de licencia de maternidad',
                    },
                    valueQuantity: { value: diasLicencia, unit: 'días', system: 'http://unitsofmeasure.org', code: 'd' },
                }] : []),
            ],
        }) : null;

        // Encounter (EncounterAmbulatoryRDA) — OBLIGATORIO en RDA Consulta
        const allConditionEntries = [...(condPrincipalEntry ? [condPrincipalEntry] : []), ...condRelacionadasEntries];
        const condicionEgreso     = str(head.CondicionDestinoEgreso);
        const codPrestRemite      = str(head.CodigoPrestadorRemite);
        const encounterExt        = [];
        if (condicionEgreso) {
            const egresExt = [{ url: 'DispositionCode', valueCoding: {
                system: CS_EGRESO,
                code: condicionEgreso,
                display: str(head.NombreCondicionDestinoEgreso) || undefined,
            } }];
            if (codPrestRemite) {
                const remRef = codPrestRemite === codPrest ? refOf(ipsOrgEntry) : refOf(codPrestRemite);
                egresExt.push({ url: 'ReferenceOrganization', valueReference: { reference: remRef } });
            }
            encounterExt.push({ url: `${RDA_SD}/ExtensionDischargeDisposition`, extension: egresExt });
        }
        // EncounterAmbulatoryRDA (RDA Consulta Externa):
        //   type[1] → GrupoServicios 01 "Consulta externa" SIEMPRE (fijo del perfil IG; no es el grupo RIPS del formulario).
        //   serviceType → system CUPS + código CUPS (procedimiento real). Nunca repetir GrupoServicios aquí.
        const encounterTypes = [];
        if (str(head.CodigoModalidadAtencion)) {
            encounterTypes.push({ coding: [{ system: CS_MODALITY, code: str(head.CodigoModalidadAtencion), display: str(head.NombreModalidadAtencion) || undefined }] });
        }
        const grupoPerfilCeDisplay = str(head.NombreGrupoServiciosPerfilCE)
            || (str(head.CodigoGrupoServicios) === '01' ? str(head.NombreGrupoServicios) : '')
            || 'Consulta externa';
        encounterTypes.push({ coding: [{ system: CS_GRUPO_SVC, code: '01', display: grupoPerfilCeDisplay }] });
        const entorno = str(head.EntornoAtencion);
        if (entorno) {
            encounterTypes.push({ coding: [{ system: CS_ENTORNO, code: entorno, display: str(head.NombreEntornoAtencion) || undefined }] });
        }
        const procConCups = (procPrescripciones || []).find((p) => str(p.CodigoProcedimiento));
        const cupsFromRips = aggregate.cupsFromRips || null;
        const cupsSvcCode = str(procConCups && procConCups.CodigoProcedimiento)
            || str(cupsFromRips && cupsFromRips.CodigoCups);
        const cupsSvcDispRaw = str(procConCups && procConCups.NombreProcedimiento)
            || str(cupsFromRips && cupsFromRips.NombreCups);
        const serviceTypeObj = cupsSvcCode ? {
            coding: [{ system: CS_CUPS, code: cupsSvcCode, display: cupsSvcDispRaw || undefined }],
        } : null;
        if (!cupsSvcCode) {
            return res.status(400).json({
                ok: false,
                code: 'RDACE_CUPS_SERVICE_TYPE_REQUERIDO',
                error: 'Encounter.serviceType (1..1) requiere un código CUPS del servicio prestado (ej. 890201 consulta medicina general). '
                    + 'No confundir con el diagnóstico CIE-11 de ingreso: el CIE-11 va en Condition/diagnosis; el CUPS va en Prescripción de procedimientos del formulario RDACE o en el RIPS de la historia clínica.',
            });
        }

        const encounterEntry = makeEntry({
            resourceType: 'Encounter',
            id: 'Encounter-0',
            meta: { profile: [`${RDA_SD}/EncounterAmbulatoryRDA`] },
            ...(encounterExt.length > 0 ? { extension: encounterExt } : {}),
            identifier: [{ id: 'EncounterIdentifier', use: 'usual', system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/Encounters', value: `RDACE-${id}` }],
            status: 'finished',
            class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
            ...(encounterTypes.length > 0 ? { type: encounterTypes } : {}),
            ...(serviceTypeObj ? { serviceType: serviceTypeObj } : {}),
            subject: { reference: refOf(patientEntry) },
            participant: [{
                id: 'AttenderPhysician',
                type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType', code: 'ATND', display: 'attender' }] }],
                individual: { reference: refOf(practitionerEntry) },
            }],
            ...(toIsoDateTime(head.FechaHoraInicioAtencion) || toIsoDateTime(head.FechaHoraFinAtencion) ? {
                period: {
                    ...(toIsoDateTime(head.FechaHoraInicioAtencion) ? { start: toIsoDateTime(head.FechaHoraInicioAtencion) } : {}),
                    ...(toIsoDateTime(head.FechaHoraFinAtencion)    ? { end:   toIsoDateTime(head.FechaHoraFinAtencion)    } : {}),
                },
            } : {}),
            ...(str(head.CodigoCausaMotivo) ? { reasonCode: [{ coding: [{
                system: CS_CAUSA_EXT,
                code: str(head.CodigoCausaMotivo),
                display: str(head.NombreCausaMotivo) || undefined,
            }] }] } : {}),
            ...(condPrincipalEntry ? { diagnosis: [{
                id: 'MainDiagnosis',
                ...(str(head.TipoDiagnosticoPrincipal) ? { extension: [{ url: `${RDA_SD}/ExtensionDiagnosisType`, valueCoding: { system: CS_TIPO_DIAG, code: str(head.TipoDiagnosticoPrincipal), display: str(head.NombreTipoDiagnosticoPrincipal) || undefined } }] } : {}),
                condition: { reference: refOf(condPrincipalEntry) },
                use: { coding: [{ system: CS_DIAG_ROLE, code: '8319008', display: 'diagnóstico primario' }] },
                rank: 1,
            }] } : {}),
            ...(ipsOrgEntry ? { serviceProvider: { reference: `#${codPrest}` } } : {}),
        });

        const compositionDateIso = toIsoDateTime(head.FechaRDA) || nowIso;

        let attachmentPdfBase64;
        try {
            const pdfBuf = await rdacePdfService().getOrBuildRdacePdfBuffer({
                pool,
                sql,
                id,
                aggregate,
                forceRegenerate: Boolean((req.body || {}).regenerarPdf),
                reqBody: req.body || {},
            });
            attachmentPdfBase64 = pdfBuf.toString('base64');
        } catch (pdfErr) {
            console.error('[RDACE] Error generando PDF resumen clínico:', pdfErr);
            if (pdfErr && pdfErr.code === 'RDACE_PDF_DEPS_MISSING') {
                return res.status(503).json({
                    ok: false,
                    error: pdfErr.message || 'Faltan dependencias PDF (npm install en back_relacionador).',
                });
            }
            return res.status(500).json({
                ok: false,
                error: 'No se pudo generar el PDF del resumen clínico: ' + (pdfErr.message || String(pdfErr)),
            });
        }

        // DocumentReference (DocumentReferenceEPIRDA): description y securityLabel fijos. IHCE DOC-001 exige attachment con datos no vacíos (url sola no basta en $enviar-rda-consulta).
        const DOC_EPI_DESCRIPTION = 'Epicrisis del encuentro de atención en salud - RDA';
        // custodian/author: SOLO referencia lógica por REPS (identifier + display). IHCE resuelve #REPS u Organization/REPS
        // a Organization/<uuid> y DocumentReferenceEPIRDA falla («Reference Organization/… in path DocumentReference.custodian is invalid»).
        const ipsOrgRefByIdentifier = ipsOrgEntry ? {
            identifier: {
                use: 'official',
                type: { coding: [
                    { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                    { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'CodigoPrestador', display: 'Código de habilitación de prestador de servicios de salud' },
                ] },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                value: codPrest,
            },
            display: nombreIps,
        } : null;
        const documentReferenceEntry = makeEntry({
            resourceType: 'DocumentReference',
            id: 'DocumentReference-0',
            meta: { profile: [`${RDA_SD}/DocumentReferenceEPIRDA`] },
            status: 'current',
            type: {
                coding: [
                    { system: 'http://loinc.org', code: '18842-5', display: 'Discharge summary' },
                    {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDocumentTypes',
                        code: 'EPI',
                        display: 'Epicrisis',
                    },
                ],
            },
            category: [{
                coding: [{ system: 'http://loinc.org', code: '55108-5', display: 'Clinical presentation Document' }],
            }],
            subject: { reference: refOf(patientEntry) },
            date: compositionDateIso,
            author: [ipsOrgRefByIdentifier || { reference: refOf(practitionerEntry) }],
            custodian: ipsOrgRefByIdentifier || { reference: refOf(practitionerEntry) },
            description: DOC_EPI_DESCRIPTION,
            securityLabel: [{
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
                    code: 'R',
                    display: 'restricted',
                }],
            }],
            context: { encounter: [{ reference: refOf('Encounter-0', 'Encounter') }] },
            content: [{
                // Perfil DocumentReferenceEPIRDA (IHCE): attachment.contentType 0..0; format fijo urn:ietf:bcp:13 + application/pdf.
                attachment: {
                    language: 'es-CO',
                    data: attachmentPdfBase64,
                    title: str(head.NombreDocumentoPDF) || DOC_EPI_DESCRIPTION,
                    creation: compositionDateIso,
                },
                format: {
                    system: 'urn:ietf:bcp:13',
                    code: 'application/pdf',
                    display: 'PDF',
                },
            }],
        });

        // Composition (CompositionAmbulatoryRDA) — cmp-1: toda sección debe tener text, entry o subsection (narrativa mínima)
        const sectionTextDiv = (msg) => ({
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">${msg}</div>`,
        });
        const emptySection = (title, loinc, display) => ({
            title,
            code: { coding: [{ system: 'http://loinc.org', code: loinc, display }] },
            text: sectionTextDiv('Sin información registrada'),
            emptyReason: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason', code: 'nilknown', display: 'Nil Known' }], text: 'Sin información registrada' },
        });

        const allMedEntries     = medRequestEntries;
        const allServiceEntries = [...serviceRequestEntries, ...otrasTecEntries];

        const sections = [
            eapbOrgEntry
                ? { title: 'Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)', code: { coding: [{ system: 'http://loinc.org', code: '48768-6', display: 'Payment sources Document' }] }, entry: [{ reference: refOf(eapbOrgEntry) }] }
                : emptySection('Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)', '48768-6', 'Payment sources Document'),
            emptySection('Otros datos demográficos', '74208-0', 'Demographic information + History of occupation Document'),
            incapacidadEntry
                ? { title: 'Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)', code: { coding: [{ system: 'http://loinc.org', code: '105583-9', display: 'Worker Sick leave form' }] }, entry: [{ reference: refOf(incapacidadEntry) }] }
                : emptySection('Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)', '105583-9', 'Worker Sick leave form'),
            allConditionEntries.length > 0
                ? { title: 'Historial de diagnósticos de problemas de salud', code: { coding: [{ system: 'http://loinc.org', code: '11450-4', display: 'Problem list - Reported' }] }, entry: allConditionEntries.map((c) => ({ reference: refOf(c) })) }
                : emptySection('Historial de diagnósticos de problemas de salud', '11450-4', 'Problem list - Reported'),
            allergyEntry
                ? { title: 'Historial de alergias, intolerancias y reacciones adversas', code: { coding: [{ system: 'http://loinc.org', code: '48765-2', display: 'Allergies and adverse reactions Document' }] }, entry: [{ reference: refOf(allergyEntry) }] }
                : emptySection('Historial de alergias, intolerancias y reacciones adversas', '48765-2', 'Allergies and adverse reactions Document'),
            riskEntry
                ? { title: 'Factores de riesgo', code: { coding: [{ system: 'http://loinc.org', code: '75492-9', display: 'Risk assessment and screening note' }] }, entry: [{ reference: refOf(riskEntry) }] }
                : emptySection('Factores de riesgo', '75492-9', 'Risk assessment and screening note'),
            allMedEntries.length > 0
                ? { title: 'Historial de medicamentos', code: { coding: [{ system: 'http://loinc.org', code: '10160-0', display: 'History of Medication use Narrative' }] }, entry: allMedEntries.map((m) => ({ reference: refOf(m) })) }
                : emptySection('Historial de medicamentos', '10160-0', 'History of Medication use Narrative'),
            allServiceEntries.length > 0
                ? { title: 'Órdenes, prescripciones o solicitudes de servicio', code: { coding: [{ system: 'http://loinc.org', code: '61146-1', display: 'Orders for services Document' }] }, entry: allServiceEntries.map((s) => ({ reference: refOf(s) })) }
                : emptySection('Órdenes, prescripciones o solicitudes de servicio', '61146-1', 'Orders for services Document'),
            {
                title: 'Documentos de soporte',
                code: { coding: [{ system: 'http://loinc.org', code: '55107-7', display: 'Addendum Document' }] },
                text: sectionTextDiv(str(head.NombreDocumentoPDF) || 'Documento de soporte asociado al encuentro'),
                entry: [{ reference: refOf(documentReferenceEntry) }],
            },
        ];

        const compositionEntry = makeEntry({
            resourceType: 'Composition',
            id: 'Composition-0',
            meta: { profile: [`${RDA_SD}/CompositionAmbulatoryRDA`] },
            status: 'final',
            type: { coding: [{ system: 'http://loinc.org', code: '51845-6', display: 'Outpatient Consult note' }] },
            subject:         { reference: refOf(patientEntry) },
            encounter:       { reference: refOf('Encounter-0', 'Encounter') },
            date:            compositionDateIso,
            author:          [{ reference: refOf(practitionerEntry) }],
            title:           'Resumen Digital de Atención en Salud - RDA de consulta externa',
            confidentiality: 'N',
            attester:        [{ mode: 'legal', party: { reference: refOf(practitionerEntry) } }],
            custodian:       ipsOrgEntry ? { reference: `#${codPrest}` } : { reference: refOf(practitionerEntry) },
            event:           [{ period: {
                ...(toIsoDateTime(head.FechaHoraInicioAtencion) ? { start: toIsoDateTime(head.FechaHoraInicioAtencion) } : {}),
                ...(toIsoDateTime(head.FechaHoraFinAtencion)    ? { end:   toIsoDateTime(head.FechaHoraFinAtencion)    } : {}),
            } }],
            section: sections,
        });

        return res.json({
            resourceType: 'Bundle',
            type: 'document',
            timestamp: compositionDateIso,
            entry: [
                compositionEntry,
                patientEntry,
                encounterEntry,
                practitionerEntry,
                ...(ipsOrgEntry      ? [ipsOrgEntry]      : []),
                ...(eapbOrgEntry     ? [eapbOrgEntry]     : []),
                ...allConditionEntries,
                ...(allergyEntry     ? [allergyEntry]     : []),
                ...(riskEntry        ? [riskEntry]        : []),
                ...allMedEntries,
                ...allServiceEntries,
                ...(incapacidadEntry ? [incapacidadEntry] : []),
                documentReferenceEntry,
            ],
        });

    } catch (error) {
        console.error('❌ [RDACE] Error al construir Bundle FHIR RDA Consulta Externa:', error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
    }
});

// ======================================================================================
// RDA CONSULTA EXTERNA — Envío a IHCE (sandbox/prod) desde backend
// ======================================================================================
// Body requerido: { "IdEvaluacionEntidadRDACE": 123 }
// Body opcional:  { "ambiente": "sandbox" | "prod",
//                   "overrideCodigoPrestador": "...",
//                   "overrideNitPrestadorIPS": "...", "overrideNombrePrestadorIPS": "..." }
//   incluirAllergyIntolerance: false — omitir AllergyIntolerance (workaround validador IHCE que exige condition-ver-status en perfil AllergyIntoleranceRDA).
// Flags modular (rutas *Modular) y también filtrado en EnviarIHCE estándar:
//   incluirConditions, incluirAllergyIntolerance, incluirRiskAssessment,
//   incluirMedications, incluirObservations  (boolean, default true)
//   incluirServiceRequests se ignora: ServiceRequest debe permanecer (sección órdenes 61146-1).
//
// Variables de entorno requeridas (sandbox):
//   IHCE_SANDBOX_BASE_URL, IHCE_SANDBOX_TENANT_ID, IHCE_SANDBOX_CLIENT_ID,
//   IHCE_SANDBOX_CLIENT_SECRET, IHCE_SANDBOX_SCOPE, IHCE_SANDBOX_SUBSCRIPTION_KEY
// Override custodian (opcional):
//   IHCE_SANDBOX_CUSTODIAN_REPS, IHCE_SANDBOX_CUSTODIAN_NIT, IHCE_SANDBOX_CUSTODIAN_NAME
// Workaround validador IHCE (AllergyIntoleranceRDA / verificationStatus):
//   IHCE_RDACE_OMIT_ALLERGY_INTOLERANCE=true (omite por defecto si el body no define el flag)
//   Body explícito: incluirAllergyIntolerance false siempre omite; true fuerza incluir (anula .env).
router.post(
    [
        '/RdaConsultaExterna/EnviarIHCE',
        '/RdaConsultaExterna/EnviarIhce',
        '/RdaConsultaExterna/JsonEnviarIHCE',
        '/RdaConsultaExterna/JsonEnviarIhce',
        '/RdaConsultaExterna/BundlePayloadIHCE',
        '/RdaConsultaExterna/PayloadParaIHCE',
        '/RdaConsultaExterna/EnviarIHCEModular',
        '/RdaConsultaExterna/EnviarIhceModular',
        '/RdaConsultaExterna/JsonEnviarIHCEModular',
        '/RdaConsultaExterna/JsonEnviarIhceModular',
        '/RdaConsultaExterna/BundlePayloadIHCEModular',
        '/RdaConsultaExterna/PayloadParaIHCEModular',
    ],
    async (req, res) => {
    const { loadDotEnvFromCandidates } = require('../../config/envLoader');
    loadDotEnvFromCandidates();

    const https = require('https');

    const {
        IdEvaluacionEntidadRDACE,
        ambiente,
        overrideCodigoPrestador,
        overrideNitPrestadorIPS,
        overrideNombrePrestadorIPS,
        incluirConditions,
        incluirAllergyIntolerance,
        incluirRiskAssessment,
        incluirMedications,
        incluirServiceRequests,
        incluirObservations,
    } = req.body || {};

    const id = IdEvaluacionEntidadRDACE != null ? parseInt(IdEvaluacionEntidadRDACE, 10) : NaN;
    if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
    }

    const forceSandboxOnly = ['1', 'true', 'yes', 'on'].includes(
        String(process.env.IHCE_FORCE_SANDBOX_ONLY || '').trim().toLowerCase()
    );
    const forceProdOnly = ['1', 'true', 'yes', 'on'].includes(
        String(process.env.IHCE_FORCE_PROD_ONLY || '').trim().toLowerCase()
    );
    const strictRequiredFields = !['0', 'false', 'no', 'off'].includes(
        String(process.env.RDA_STRICT_REQUIRED_FIELDS || 'true').trim().toLowerCase()
    );
    const requestedAmb = (String(ambiente || 'sandbox').toLowerCase() === 'prod' || String(ambiente || '').toLowerCase() === 'produccion')
        ? 'prod'
        : 'sandbox';
    const effectiveAmb = forceProdOnly ? 'prod' : (forceSandboxOnly ? 'sandbox' : requestedAmb);
    const envPrefix = effectiveAmb === 'prod' ? 'IHCE_PROD_' : 'IHCE_SANDBOX_';

    const firstEnv = (...keys) => {
        for (let i = 0; i < keys.length; i += 1) {
            const v = process.env[keys[i]];
            if (v != null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    };
    const readEnvKeyFromFile = (key) => {
        try {
            const fs = require('fs');
            const path = require('path');
            const envCandidates = [
                path.resolve(__dirname, '..', '..', '..', '.env'),
                path.resolve(__dirname, '..', '..', '..', '.env acquir'),
            ];
            for (const envPath of envCandidates) {
                if (!fs.existsSync(envPath)) continue;
                const txt = fs.readFileSync(envPath, 'utf8');
                for (const line of txt.split(/\r?\n/)) {
                    const s = line.replace(/^\uFEFF/, '').trim();
                    if (!s || s.startsWith('#')) continue;
                    const eq = s.indexOf('=');
                    if (eq <= 0) continue;
                    const k = s.slice(0, eq).trim();
                    if (k !== key) continue;
                    let val = s.slice(eq + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    return val != null ? String(val).trim() : '';
                }
            }
        } catch (_) {}
        return '';
    };
    const envPathDiag = require('path').resolve(__dirname, '..', '..', '..', '.env');

    let baseUrl, tenantId, clientId, clientSecret, scope, subscriptionKey;
    if (envPrefix === 'IHCE_SANDBOX_') {
        baseUrl         = firstEnv('IHCE_SANDBOX_BASE_URL', 'IHCE_API_BASE_URL', 'IHCE_BASE_URL');
        tenantId        = firstEnv('IHCE_SANDBOX_TENANT_ID', 'IHCE_TENANT_ID');
        clientId        = firstEnv('IHCE_SANDBOX_CLIENT_ID', 'IHCE_CLIENT_ID');
        clientSecret    = firstEnv('IHCE_SANDBOX_CLIENT_SECRET', 'IHCE_CLIENT_SECRET');
        scope           = firstEnv('IHCE_SANDBOX_SCOPE', 'IHCE_SCOPE');
        subscriptionKey = firstEnv('IHCE_SANDBOX_SUBSCRIPTION_KEY', 'IHCE_APIM_SUBSCRIPTION_KEY', 'IHCE_SUBSCRIPTION_KEY', 'OCP_APIM_SUBSCRIPTION_KEY');
    } else {
        baseUrl         = firstEnv('IHCE_PROD_BASE_URL', 'IHCE_API_BASE_URL_PROD');
        tenantId        = firstEnv('IHCE_PROD_TENANT_ID');
        clientId        = firstEnv('IHCE_PROD_CLIENT_ID');
        clientSecret    = firstEnv('IHCE_PROD_CLIENT_SECRET');
        scope           = firstEnv('IHCE_PROD_SCOPE');
        subscriptionKey = firstEnv('IHCE_PROD_SUBSCRIPTION_KEY', 'IHCE_APIM_SUBSCRIPTION_KEY_PROD');
    }

    const forceCustodianNIT  = firstEnv(`${envPrefix}CUSTODIAN_NIT`)  || readEnvKeyFromFile(`${envPrefix}CUSTODIAN_NIT`);
    const forceCustodianREPS = firstEnv(`${envPrefix}CUSTODIAN_REPS`) || readEnvKeyFromFile(`${envPrefix}CUSTODIAN_REPS`);
    const forceCustodianName = firstEnv(`${envPrefix}CUSTODIAN_NAME`) || readEnvKeyFromFile(`${envPrefix}CUSTODIAN_NAME`);
    console.log('[RDACE] Diagnóstico env custodian:', {
        envPath: envPathDiag,
        envPrefix,
        fromEnv: {
            reps: firstEnv(`${envPrefix}CUSTODIAN_REPS`) ? 'OK' : 'EMPTY',
            nit: firstEnv(`${envPrefix}CUSTODIAN_NIT`) ? 'OK' : 'EMPTY',
            name: firstEnv(`${envPrefix}CUSTODIAN_NAME`) ? 'OK' : 'EMPTY',
        },
        resolved: {
            reps: forceCustodianREPS ? 'OK' : 'EMPTY',
            nit: forceCustodianNIT ? 'OK' : 'EMPTY',
            name: forceCustodianName ? 'OK' : 'EMPTY',
        },
    });
    const omitAllergyForIHCE = ['1', 'true', 'yes'].includes(String(process.env.IHCE_RDACE_OMIT_ALLERGY_INTOLERANCE || '').trim().toLowerCase());
    const includeAllergyIntolerance = incluirAllergyIntolerance === true
        ? true
        : incluirAllergyIntolerance === false
            ? false
            : !omitAllergyForIHCE;

    const missing = [
        !baseUrl         && 'BASE_URL',
        !tenantId        && 'TENANT_ID',
        !clientId        && 'CLIENT_ID',
        !clientSecret    && 'CLIENT_SECRET',
        !scope           && 'SCOPE',
        !subscriptionKey && 'SUBSCRIPTION_KEY',
    ].filter(Boolean);
    if (missing.length) {
        const hint = envPrefix === 'IHCE_SANDBOX_'
            ? ' Sandbox: IHCE_SANDBOX_* o IHCE_API_BASE_URL, IHCE_TENANT_ID, IHCE_CLIENT_ID, IHCE_CLIENT_SECRET, IHCE_SCOPE, IHCE_APIM_SUBSCRIPTION_KEY.'
            : ' Producción: IHCE_PROD_BASE_URL, IHCE_PROD_TENANT_ID, IHCE_PROD_CLIENT_ID, IHCE_PROD_CLIENT_SECRET, IHCE_PROD_SCOPE, IHCE_PROD_SUBSCRIPTION_KEY.';
        return res.status(500).json({ ok: false, error: `Faltan variables de entorno IHCE (${missing.join(', ')}).${hint}` });
    }

    const httpJson = (url, { method = 'GET', headers = {}, body = null } = {}) =>
        new Promise((resolve, reject) => {
            const u = new URL(url);
            const opts = { method, hostname: u.hostname, path: u.pathname + (u.search || ''), headers };
            const req2 = https.request(opts, (resp) => {
                let data = '';
                resp.on('data', (chunk) => (data += chunk));
                resp.on('end', () => resolve({ status: resp.statusCode || 0, headers: resp.headers, body: data }));
            });
            req2.on('error', reject);
            if (body) req2.write(body);
            req2.end();
        });

    // Helpers de referencia para normalizar refs internas del Bundle (# / ResourceType/id / urn:uuid).
    const refOf = (entryOrId, resourceTypeHint = '') => {
        if (typeof entryOrId === 'string') {
            const raw = String(entryOrId).trim();
            if (!raw) return '';
            if (/^[A-Za-z]+\/.+$/.test(raw)) return raw;
            if (resourceTypeHint) return `${resourceTypeHint}/${raw.replace(/^#/, '')}`;
            return raw.replace(/^#/, '');
        }
        const r = entryOrId && entryOrId.resource ? entryOrId.resource : entryOrId;
        const rid = r && r.id ? String(r.id) : '';
        const rt = r && r.resourceType ? String(r.resourceType) : '';
        if (!rid) return '';
        return rt ? `${rt}/${rid}` : rid;
    };
    const refId = (reference) => {
        const raw = String(reference || '').trim();
        if (!raw) return '';
        if (raw.startsWith('urn:uuid:')) return raw.slice('urn:uuid:'.length);
        if (raw.startsWith('#')) return raw.slice(1);
        const m = raw.match(/^[A-Za-z]+\/(.+)$/);
        return m ? m[1] : raw;
    };

    /** IHCE BUNDLE-005 en $enviar-rda-consulta: exige coherencia entre Bundle.entry y refs en Composition/recursos; mezclar #REPS con Patient/CC-… puede hacer que el validador no cuente enlaces. Unificar a #<resource.id>. */
    const normalizeBundleRefsToHashFragment = (bd) => {
        if (!bd || !Array.isArray(bd.entry)) return;
        const idSet = new Set();
        bd.entry.forEach((e) => {
            if (e && e.resource && e.resource.id != null && String(e.resource.id).trim() !== '') {
                idSet.add(String(e.resource.id).trim());
            }
        });
        const rewrite = (node) => {
            if (Array.isArray(node)) {
                node.forEach(rewrite);
                return;
            }
            if (!node || typeof node !== 'object') return;
            if (typeof node.reference === 'string') {
                const ref = node.reference.trim();
                if (!ref || ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('urn:')) return;
                if (ref.startsWith('#')) return;
                const m = ref.match(/^[A-Za-z]+\/(.+)$/);
                if (m && idSet.has(m[1])) node.reference = `#${m[1]}`;
                return;
            }
            Object.keys(node).forEach((k) => rewrite(node[k]));
        };
        rewrite(bd);
    };

    try {
        // 1) Obtener Bundle desde el endpoint interno
        const localBase = `http://localhost:${process.env.BACK_PORT || process.env.PORT || 3000}`;
        const bundleResp = await new Promise((resolve, reject) => {
            const http = require('http');
            // Igual que RdaPaciente/EnviarIHCE: solo overrides explícitos en el body al construir el Bundle.
            // IHCE_*_CUSTODIAN_* se aplica después sobre el JSON (bloque «Override custodian»), no aquí,
            // para no pisar el [Codigo Prestador] de BD con un REPS de .env distinto al del token.
            const bundleBody = { IdEvaluacionEntidadRDACE: id };
            if (overrideCodigoPrestador != null && String(overrideCodigoPrestador).trim()) {
                bundleBody.overrideCodigoPrestador = String(overrideCodigoPrestador).trim();
            }
            if (overrideNitPrestadorIPS != null && String(overrideNitPrestadorIPS).trim()) {
                bundleBody.overrideNitPrestadorIPS = String(overrideNitPrestadorIPS).trim();
            }
            if (overrideNombrePrestadorIPS != null && String(overrideNombrePrestadorIPS).trim()) {
                bundleBody.overrideNombrePrestadorIPS = String(overrideNombrePrestadorIPS).trim();
            }
            console.log('[RDACE] FhirBundle request (overrides body solamente):', {
                ambiente: envPrefix === 'IHCE_PROD_' ? 'prod' : 'sandbox',
                overrideCodigoPrestador: bundleBody.overrideCodigoPrestador || '(ninguno; usa BD)',
                overrideNitPrestadorIPS: bundleBody.overrideNitPrestadorIPS || '(ninguno)',
                overrideNombrePrestadorIPS: bundleBody.overrideNombrePrestadorIPS || '(ninguno)',
                custodianEnvActivo: Boolean(forceCustodianREPS && String(forceCustodianREPS).trim()),
            });
            const payload = JSON.stringify(bundleBody);
            const req3 = http.request(
                `${localBase}/apiV3/RdaConsultaExterna/FhirBundle`,
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
                (resp) => { let data = ''; resp.on('data', (c) => (data += c)); resp.on('end', () => resolve({ status: resp.statusCode || 0, body: data })); }
            );
            req3.on('error', reject);
            req3.write(payload);
            req3.end();
        });
        if (bundleResp.status < 200 || bundleResp.status >= 300) {
            return res.status(500).json({ ok: false, error: `No se pudo construir el Bundle local (status ${bundleResp.status})`, details: bundleResp.body });
        }
        const bundle = JSON.parse(bundleResp.body);

        // 2) Normalización — RDACE mantiene Encounter (obligatorio según IG)
        //    RDA Paciente lo elimina; aquí NO se quita.
        if (bundle && Array.isArray(bundle.entry)) {
            // En modo modular los flags controlan qué tipos opcionales se incluyen.
            // ServiceRequest no es excluible: la Composition RDACE exige al menos un entry en la sección de órdenes (61146-1).
            const isModular = /Modular$/i.test(req.path);
            // DocumentReference: sección Composition «Documentos de soporte» (55107-7) exige entry 1..1 y prohíbe emptyReason (IG / validador IHCE).
            const alwaysKeep = new Set(['Composition', 'Patient', 'Encounter', 'Practitioner', 'Organization', 'DocumentReference']);
            const optFlags = {
                Condition:          isModular ? incluirConditions        !== false : true,
                AllergyIntolerance: includeAllergyIntolerance,
                RiskAssessment:     isModular ? incluirRiskAssessment     !== false : true,
                MedicationRequest:  isModular ? incluirMedications        !== false : true,
                ServiceRequest:     true,
                Observation:        isModular ? incluirObservations       !== false : true,
            };

            bundle.entry = bundle.entry.filter((e) => {
                if (!e || !e.resource) return false;
                const rt = e.resource.resourceType;
                return alwaysKeep.has(rt) || optFlags[rt] === true;
            });

            // Reconstruir secciones de Composition conservando solo refs a entries presentes.
            const compEntry = bundle.entry.find((e) => e && e.resource && e.resource.resourceType === 'Composition');
            if (compEntry && compEntry.resource) {
                const comp  = compEntry.resource;
                const avail = new Set(bundle.entry.map((e) => e && e.resource && e.resource.id).filter(Boolean));
                const emptyReason = { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason', code: 'nilknown', display: 'Nil Known' }], text: 'Sin información registrada' };

                // IHCE (CompositionAmbulatoryRDA): sección Documentos de soporte (55107-7) no admite emptyReason (0..0) y exige entry 1..1.
                const loincOf = (sec) => (sec && sec.code && sec.code.coding && sec.code.coding[0] && sec.code.coding[0].code) || '';
                comp.section = (Array.isArray(comp.section) ? comp.section : []).map((s) => {
                    if (!Array.isArray(s.entry) || s.entry.length === 0) return s;
                    const filtered = s.entry.filter((r) => avail.has(refId(r.reference)));
                    if (filtered.length === 0) {
                        if (loincOf(s) === '55107-7') {
                            return { ...s, entry: [] };
                        }
                        const { entry: _removed, ...rest } = s;
                        const text = rest.text || {
                            status: 'generated',
                            div: '<div xmlns="http://www.w3.org/1999/xhtml">Sin información registrada</div>',
                        };
                        return { ...rest, text, emptyReason };
                    }
                    return { ...s, entry: filtered };
                });
            }

            // Patient.address: quitar line y _city (validación IHCE)
            bundle.entry
                .filter((e) => e && e.resource && e.resource.resourceType === 'Patient')
                .forEach((e) => {
                    sanitizeOptionalPatientFields(e.resource);
                    if (Array.isArray(e.resource.address)) {
                        e.resource.address.forEach((a) => {
                            if (a && Object.prototype.hasOwnProperty.call(a, 'line')) delete a.line;
                            if (a && a._city) delete a._city;
                        });
                    }
                });
        }

        // 3) Override custodian si las variables de entorno lo solicitan (misma idea que RdaPaciente/EnviarIHCE)
        if (forceCustodianREPS && String(forceCustodianREPS).trim()) {
            const reps = String(forceCustodianREPS).trim();
            const nit  = forceCustodianNIT  ? String(forceCustodianNIT).trim()  : '';
            const name = forceCustodianName && String(forceCustodianName).trim()
                ? String(forceCustodianName).trim()
                : `IPS (${reps})`;
            const entries = Array.isArray(bundle.entry) ? bundle.entry : [];
            const compE = entries.find((e) => e && e.resource && e.resource.resourceType === 'Composition');
            // Misma forma que RdaPaciente/EnviarIHCE: referencia por fragmento al Organization del bundle.
            // Organization/<reps> en $enviar-rda-consulta puede disparar err-000 (custodian vs token) aunque RDA Paciente pase.
            if (compE && compE.resource) compE.resource.custodian = { reference: `#${reps}` };
            const encE = entries.find((e) => e && e.resource && e.resource.resourceType === 'Encounter');
            if (encE && encE.resource) encE.resource.serviceProvider = { reference: `#${reps}` };
            const docRefE = entries.find((e) => e && e.resource && e.resource.resourceType === 'DocumentReference');
            if (docRefE && docRefE.resource) {
                const drCust = {
                    identifier: {
                        use: 'official',
                        type: { coding: [
                            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                            { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'CodigoPrestador', display: 'Código de habilitación de prestador de servicios de salud' },
                        ] },
                        system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                        value: reps,
                    },
                    display: name,
                };
                docRefE.resource.custodian = drCust;
                docRefE.resource.author = [drCust];
            }
            let orgE = entries.find((e) => e && e.resource && e.resource.resourceType === 'Organization' && e.resource.id === reps);
            if (!orgE) { orgE = { resource: { resourceType: 'Organization', id: reps } }; entries.push(orgE); bundle.entry = entries; }
            orgE.resource.active = true;
            orgE.resource.meta   = orgE.resource.meta || { profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/CareDeliveryOrganizationRDA'] };
            orgE.resource.name   = name;
            orgE.resource.identifier = nit
                ? [
                    { id: 'TaxIdentifier', use: 'official', type: { coding: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'TAX', display: 'Tax ID number' },
                        { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'NIT', display: 'Número de Identificación Tributaria' },
                    ]}, system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/DIAN', value: nit },
                    { id: 'HealthcareProviderIdentifier', use: 'official', type: { coding: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                        { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'CodigoPrestador', display: 'Código de habilitación de prestador de servicios de salud' },
                    ]}, system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS', value: reps },
                ]
                : orgE.resource.identifier || [{ system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS', value: reps }];
            // Evitar dos Organization IPS (id distinto al REPS forzado) en el mismo Bundle
            const ipsProf = 'CareDeliveryOrganizationRDA';
            bundle.entry = bundle.entry.filter((e) => {
                if (!e || !e.resource || e.resource.resourceType !== 'Organization') return true;
                const prof0 = (e.resource.meta && Array.isArray(e.resource.meta.profile) && e.resource.meta.profile[0]) || '';
                if (!String(prof0).includes(ipsProf)) return true;
                return String(e.resource.id) === reps;
            });
        }

        normalizeBundleRefsToHashFragment(bundle);

        // Mismo cuerpo que JSON.stringify(bundle) en POST a IHCE; sin token ni llamada remota
        const isBundlePayloadPreview = /\/Json/i.test(req.path)
            || /BundlePayloadIHCE/i.test(req.path)
            || /PayloadParaIHCE/i.test(req.path);
        if (isBundlePayloadPreview) {
            const previewErr = validateRequiredForIhceCeBundle(bundle);
            if (previewErr) {
                return res.status(400).json({
                    ok: false,
                    code: 'RDACE_VALIDACION_OBLIGATORIOS',
                    error: previewErr,
                });
            }
            return res.type('application/fhir+json').json(bundle);
        }
        const requiredErr = validateRequiredForIhceCeBundle(bundle);
        if (strictRequiredFields && requiredErr) {
            return res.status(400).json({
                ok: false,
                code: 'RDACE_VALIDACION_OBLIGATORIOS',
                error: `No se puede enviar a IHCE: ${requiredErr}`,
            });
        }

        const icd11Codes = collectIcd11CodesFromBundle(bundle);
        if (icd11Codes.length) {
            const localBase = `http://localhost:${process.env.BACK_PORT || process.env.PORT || 3000}`;
            const invalids = [];
            for (const c of icd11Codes) {
                const vResp = await new Promise((resolve) => {
                    const http = require('http');
                    const req4 = http.request(
                        `${localBase}/apiV3/icd11/validate/${encodeURIComponent(c)}`,
                        { method: 'GET' },
                        (resp) => {
                            let data = '';
                            resp.on('data', (chunk) => (data += chunk));
                            resp.on('end', () => {
                                try {
                                    const parsed = JSON.parse(data || '{}');
                                    resolve({ status: resp.statusCode || 0, body: parsed });
                                } catch (_) {
                                    resolve({ status: resp.statusCode || 0, body: null });
                                }
                            });
                        }
                    );
                    req4.on('error', () => resolve({ status: 0, body: null }));
                    req4.end();
                });
                const valid = Boolean(vResp && vResp.body && vResp.body.valid);
                if (!valid) invalids.push(c);
            }
            if (invalids.length) {
                return res.status(400).json({
                    ok: false,
                    code: 'RDACE_ICD11_NO_PERMITIDO_CO',
                    error: `Códigos CIE-11 no permitidos para Colombia: ${invalids.join(', ')}`,
                    details: {
                        invalidCodes: invalids,
                        hint: 'Actualice el diagnóstico con códigos válidos del catálogo ICD11 Colombia.',
                    },
                });
            }
        }

        // 4) Obtener token Entra (client_credentials)
        const tokenUrl  = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const tokenBody = new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope }).toString();
        const tokenResp = await httpJson(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(tokenBody) },
            body: tokenBody,
        });
        if (tokenResp.status !== 200) {
            return res.status(502).json({ ok: false, error: `Token IHCE falló (status ${tokenResp.status})`, details: tokenResp.body });
        }
        const tokenJson = JSON.parse(tokenResp.body);
        const accessToken = tokenJson.access_token;
        if (!accessToken) {
            return res.status(502).json({ ok: false, error: 'Token IHCE: respuesta sin access_token', details: tokenJson });
        }

        // 5) Enviar a IHCE — operación $enviar-rda-consulta (distinta de $enviar-rda-paciente)
        const sendUrl  = `${baseUrl.replace(/\/$/, '')}/Composition/$enviar-rda-consulta`;
        const sendBody = JSON.stringify(bundle);
        const sendResp = await httpJson(sendUrl, {
            method: 'POST',
            headers: {
                Authorization:               `Bearer ${accessToken}`,
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Content-Type':              'application/fhir+json',
                Accept:                      'application/fhir+json',
                'Content-Length':            Buffer.byteLength(sendBody),
            },
            body: sendBody,
        });

        const statusOk = sendResp.status >= 200 && sendResp.status < 300;
        await saveIhceTraceConsultaExterna({
            idEvaluacionEntidadRDACE: id,
            ambiente: ambiente === 'prod' ? 'prod' : 'sandbox',
            urlEnvio: sendUrl,
            jsonEnviado: sendBody,
            httpStatus: sendResp.status,
            jsonRespuesta: sendResp.body || '',
            exitoso: statusOk,
            error: statusOk ? null : `HTTP ${sendResp.status}`,
        });
        if (statusOk) {
            try {
                const pool = await poolPromise;
                const isProd = envPrefix === 'IHCE_PROD_';
                const setSql = isProd
                    ? `UPDATE [dbo].[Evaluacion Entidad RDA Consulta Externa]
                       SET [Enviado] = 1
                       WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE`
                    : `UPDATE [dbo].[Evaluacion Entidad RDA Consulta Externa]
                       SET [Enviado pruebas] = 1
                       WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE`;
                await pool
                    .request()
                    .input('IdEvaluacionEntidadRDACE', sql.Int, id)
                    .query(setSql);
            } catch (dbErr) {
                console.error(
                    '❌ [RDACE] IHCE aceptó el envío pero no se pudo marcar envío en BD:',
                    dbErr && dbErr.message ? dbErr.message : dbErr
                );
            }
        }

        return res.status(sendResp.status || 502).send(sendResp.body || '');

    } catch (error) {
        console.error('❌ [RDACE] Error en EnviarIHCE:', error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
    }
    }
);

module.exports = router;

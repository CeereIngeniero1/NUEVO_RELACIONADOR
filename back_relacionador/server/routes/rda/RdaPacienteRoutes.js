/**
 * RDA Paciente — Router independiente (Resolución 1888)
 *
 * Rutas incluidas:
 *  POST  /EvaluacionEntidadRDA/                        — cabecera (persistencia)
 *  POST  /EvaluacionEntidadRDA/AntecedentesSalud       — tabla hija
 *  POST  /EvaluacionEntidadRDA/AntecedentesFamiliares  — tabla hija
 *  POST  /EvaluacionEntidadRDA/AntecedentesFarmacologicos — tabla hija
 *  POST  /RdaPaciente/FhirBundle                       — construcción Bundle FHIR
 *  POST  /RdaPaciente/EnviarIHCE (+ variantes)         — envío a IHCE (sandbox/prod); OK → [Enviado*]=1; duplicado/periodo → =2 (no pendiente)
 *
 * Montaje en el router principal:
 *   router.use(require('./rda/RdaPacienteRoutes'));
 *
 * IG: https://vulcano.ihcecol.gov.co/RDA-paciente.html
 */

'use strict';

const Router      = require('express').Router;
const { sql, poolPromise } = require('../../db2');
const { solicitarTokenIhceShared } = require('../../rda/ihceInteropService');
const { mergePrestadorHeadFromEnv, applyEnvCustodianIfConfigured, normalizeIhceAmbiente } = require('../../rda/rdaBundleIpsHelpers');
const { resolveTipoAlergiaDisplay, normalizeTipoAlergiaCode, allergyTypeToCategory } = require('../../rda/tipoAlergiaCatalog');
const {
    buildNationalPersonIdentifier,
    PersonIdentifierDisplayError,
    normalizeDocTypeCode,
} = require('../../rda/colombianPersonIdentifierCatalog');
const { patientGenderFromCatalog } = require('../../rda/patientGenderMap');
const {
    RDA_ENVIO_OK,
    RDA_ENVIO_NO_REENVIBLE,
    isIhceNoReenviableResponse,
    setRdaEnvioMarca,
} = require('../../rda/rdaEnvioEstado');
const { validatePeriodoAtencionNoFuturo } = require('../../rda/rdaPeriodoAtencion');
const {
    toFhirDateTimeColombia,
    toFhirDateTimeColombiaNow,
    colombiaDateTimeToMssqlDate,
    toFhirBirthTimeColombia,
    hasBirthTimeColombia,
    normalizePatientBirthTimeExtension,
    normalizeDivipolaMunicipalityCode,
    buildRdaPersonName,
} = require('../../rda/fhirColombiaFormat');
const {
    telefonoPacienteParaFhir,
    mensajeErrorTelefonoPacienteIhce,
    isTelefonoPacienteValidoParaFhir,
} = require('../../rda/pacienteTelecomFhir');
const { archiveRdaEnvioJson } = require('../../rda/rdaEnvioJsonArchive');
const { createHash } = require('crypto');
const { classifyIcdCode, isIcd10Code } = require('../../rda/icdCodeKind');

/** Catálogo Res. 1888: código "7" = Sin Asignar (no permitido para envío real IHCE). */
function skipRdaEthnicityExtension(codigoEtnia, textoEtnia) {
    const c = codigoEtnia != null && String(codigoEtnia).trim() !== '' ? String(codigoEtnia).trim() : '';
    const t = textoEtnia != null && String(textoEtnia).trim() !== '' ? String(textoEtnia).trim() : '';
    const cNum = c && /^\d+$/.test(c) ? String(parseInt(c, 10)) : c;
    if (cNum === '7') return true; // soporta 7, 07, 007
    if (t && /(sin\s*asignar|sin\s*informaci[oó]n|no\s*aplica)/i.test(t)) return true;
    return false;
}

function resolveEthnicityForFhir(codigoEtnia, textoEtnia) {
    const code = codigoEtnia != null && String(codigoEtnia).trim() !== '' ? String(codigoEtnia).trim() : '';
    const display = textoEtnia != null && String(textoEtnia).trim() !== '' ? String(textoEtnia).trim() : '';
    if (skipRdaEthnicityExtension(code, display)) {
        return { code: 'Y', display: 'Y' };
    }
    if (!code) return null;
    return { code, display: display || undefined };
}

/** Descripcion NOT NULL en BD: CIE-10, CIE-11 o texto de respaldo. */
function resolveAntecedenteFamDescripcion(descripcion, cie11Codigo, cie11Termino) {
    const d = descripcion != null ? String(descripcion).trim() : '';
    if (d) return d;
    const c11 = cie11Codigo != null ? String(cie11Codigo).trim() : '';
    const t11 = cie11Termino != null ? String(cie11Termino).trim() : '';
    if (c11 && t11) return `${c11} - ${t11}`;
    if (c11) return c11;
    if (t11) return t11;
    return 'Sin descripción';
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
        patient.telecom = patient.telecom
            .map((t) => {
                if (!t || typeof t !== 'object') return null;
                const normalized = telefonoPacienteParaFhir(t.value);
                if (!normalized) return null;
                return { ...t, value: normalized };
            })
            .filter(Boolean);
        if (!patient.telecom.length) delete patient.telecom;
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

function validateRequiredForIhcePatientBundle(bundle) {
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

    const telecomPhone = patient.telecom && patient.telecom[0] && patient.telecom[0].value;
    if (!isTelefonoPacienteValidoParaFhir(telecomPhone)) {
        return mensajeErrorTelefonoPacienteIhce();
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

    return '';
}

async function saveIhceTracePaciente({
    idEvaluacionEntidadRDA,
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
            .input('TipoRda', sql.VarChar(20), 'paciente')
            .input('IdRDA', sql.Int, idEvaluacionEntidadRDA || null)
            .input('IdRDACE', sql.Int, null)
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
        console.error('⚠️ [RDA] No se pudo guardar trazabilidad IHCE:', traceErr && traceErr.message ? traceErr.message : traceErr);
    }
}

const router = Router();
router.post('/EvaluacionEntidadRDA/', async (req, res) => {
    const {
        DocumentoEntidad, FechaRDA, IdTipoDocumento,
        PrimerApellidoEntidad, SegundoApellidoEntidad, PrimerNombreEntidad, SegundoNombreEntidad,
        FechaNacimiento, Edad, IdUnidaddeMedidaEdad, IdSexoBiologico, IdIdentidadGenero,
        IdPaisNacionalidad, Talla, Peso, IdPaisRecidencia, IdMunicipioRecidencia,
        IdZonaResidencia, Direccion, IdEtnia, ComunidadEtnica, IdDiscapacidad,
        TelefonoCelular, Alergeno,
        // Campos RDA Paciente (Resolución 1888)
        CodigoPrestador, CodigoAdminPlanBeneficios, NombreAdminPlanBeneficios,
        FechaHoraInicioAtencion, FechaHoraFinAtencion,
        TipoDocProfesional, NumDocProfesional,
        DiagnosticoIngresoCIE11Codigo, DiagnosticoIngresoCIE11Termino,
        TipoAlergia,
        IdModalidadAtencion, IdGrupoServicios,
        NitPrestadorIPS, NombrePrestadorIPS,
    } = req.body;

    const parseIntNullable = (value) => {
        if (value === null || value === undefined) return null;
        const s = String(value).trim();
        if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : null;
    };

    const codPrestTrim = CodigoPrestador != null ? String(CodigoPrestador).trim() : '';
    if (!codPrestTrim || codPrestTrim.toLowerCase() === 'null') {
        return res.status(400).json({
            ok: false,
            error: 'CodigoPrestador es obligatorio (código REPS / habilitación del prestador IPS).',
        });
    }
    const idMod = IdModalidadAtencion != null && IdModalidadAtencion !== '' ? parseInt(IdModalidadAtencion, 10) : NaN;
    const idGrp = IdGrupoServicios != null && IdGrupoServicios !== '' ? parseInt(IdGrupoServicios, 10) : NaN;
    if (!Number.isFinite(idMod)) {
        return res.status(400).json({ ok: false, error: 'IdModalidadAtencion es obligatorio (valor numérico).' });
    }
    if (!Number.isFinite(idGrp)) {
        return res.status(400).json({ ok: false, error: 'IdGrupoServicios es obligatorio (valor numérico).' });
    }

    // Convierte un string de fecha en objeto Date; null si no es válido
    const toDate = (str) => colombiaDateTimeToMssqlDate(str);

    const dInicioAtencion = toDate(FechaHoraInicioAtencion) || null;
    const dFinAtencion = toDate(FechaHoraFinAtencion) || null;
    const periodoOk = validatePeriodoAtencionNoFuturo(dInicioAtencion, dFinAtencion);
    if (!periodoOk.ok) {
        return res.status(400).json({ ok: false, error: periodoOk.error });
    }

    try {
        const pool = await poolPromise;
        let idIdentidadGeneroSeguro = parseIntNullable(IdIdentidadGenero);

        // Si no llega IdIdentidadGenero válido, usar automáticamente un valor seguro.
        // Se intenta "Sin asignar/No aplica" del catálogo; fallback final: 6.
        if (idIdentidadGeneroSeguro == null) {
            const generoRs = await pool.request().query(`
                SELECT TOP (1) g.[Id Sexo Identidad Genero] AS IdSexoIdentidadGenero
                FROM [dbo].[Sexo Identidad Genero] g
                WHERE g.[Identidad Genero] COLLATE Latin1_General_CI_AI LIKE N'%Sin asignar%'
                   OR g.[Identidad Genero] COLLATE Latin1_General_CI_AI LIKE N'%No aplica%'
                   OR g.[Identidad Genero] COLLATE Latin1_General_CI_AI LIKE N'%No informado%'
                   OR g.[Identidad Genero] COLLATE Latin1_General_CI_AI LIKE N'%Indeterminado%'
                ORDER BY g.[Id Sexo Identidad Genero]
            `);
            idIdentidadGeneroSeguro = generoRs?.recordset?.[0]?.IdSexoIdentidadGenero ?? 6;
        }

        let idDiscapacidadSeguro = parseIntNullable(IdDiscapacidad);

        // Si no llega IdDiscapacidad válido, usar automáticamente "Sin discapacidad"
        if (idDiscapacidadSeguro == null) {
            const fallbackRs = await pool.request().query(`
                SELECT TOP (1) d.[Id Discapacidad] AS IdDiscapacidad
                FROM [dbo].[Discapacidad] d
                WHERE d.[Discapacidad] COLLATE Latin1_General_CI_AI LIKE N'%Sin discapacidad%'
                   OR d.[Descripcion Discapacidad] COLLATE Latin1_General_CI_AI LIKE N'%Sin discapacidad%'
                   OR d.[Codigo] IN (N'09', N'9')
                ORDER BY
                    CASE
                        WHEN d.[Discapacidad] COLLATE Latin1_General_CI_AI = N'Sin discapacidad' THEN 0
                        WHEN d.[Descripcion Discapacidad] COLLATE Latin1_General_CI_AI = N'Sin discapacidad' THEN 1
                        ELSE 2
                    END,
                    d.[Id Discapacidad]
            `);

            idDiscapacidadSeguro = fallbackRs?.recordset?.[0]?.IdDiscapacidad ?? 9;
        }

        const result = await pool.request()
            .input('DocumentoEntidad',              sql.NVarChar,  DocumentoEntidad                 || null)
            .input('FechaRDA',                      sql.DateTime2, toDate(FechaRDA)                 || new Date())
            .input('IdTipoDocumento',               sql.Int,       IdTipoDocumento                  ? parseInt(IdTipoDocumento)         : null)
            .input('PrimerApellidoEntidad',         sql.NVarChar,  PrimerApellidoEntidad            || null)
            .input('SegundoApellidoEntidad',        sql.NVarChar,  SegundoApellidoEntidad           || null)
            .input('PrimerNombreEntidad',           sql.NVarChar,  PrimerNombreEntidad              || null)
            .input('SegundoNombreEntidad',          sql.NVarChar,  SegundoNombreEntidad             || null)
            .input('FechaNacimiento',               sql.DateTime2, toDate(FechaNacimiento)          || null)
            .input('Edad',                          sql.Float,     Edad                             ? parseFloat(Edad) : null)
            .input('IdUnidaddeMedidaEdad',          sql.Int,       IdUnidaddeMedidaEdad             ? parseInt(IdUnidaddeMedidaEdad)    : null)
            .input('IdSexoBiologico',               sql.Int,       IdSexoBiologico                  ? parseInt(IdSexoBiologico)         : null)
            .input('IdIdentidadGenero',             sql.Int,       idIdentidadGeneroSeguro)
            .input('IdPaisNacionalidad',            sql.Int,       IdPaisNacionalidad               ? parseInt(IdPaisNacionalidad)      : null)
            .input('Talla',                         sql.NVarChar,  Talla                            || '0')
            .input('Peso',                          sql.NVarChar,  Peso                             || '0')
            .input('IdPaisRecidencia',              sql.Int,       IdPaisRecidencia                 ? parseInt(IdPaisRecidencia)        : null)
            .input('IdMunicipioRecidencia',         sql.Int,       IdMunicipioRecidencia            ? parseInt(IdMunicipioRecidencia)   : null)
            .input('IdZonaResidencia',              sql.Int,       IdZonaResidencia                 ? parseInt(IdZonaResidencia)        : null)
            .input('Direccion',                     sql.NVarChar,  Direccion                        || null)
            .input('IdEtnia',                       sql.Int,       IdEtnia                          ? parseInt(IdEtnia)                 : 0)
            .input('ComunidadEtnica',               sql.NVarChar,  ComunidadEtnica                  || '')
            .input('IdDiscapacidad',                sql.Int,       idDiscapacidadSeguro)
            .input('TelefonoCelular',               sql.NVarChar,  TelefonoCelular                  || null)
            .input('Alergeno',                      sql.NVarChar,  Alergeno                         || null)
            // Campos RDA Paciente (Resolución 1888)
            .input('CodigoPrestador',               sql.NVarChar,  codPrestTrim)
            .input('CodigoAdminPlanBeneficios',     sql.NVarChar,  CodigoAdminPlanBeneficios        || null)
            .input('NombreAdminPlanBeneficios',     sql.NVarChar,  NombreAdminPlanBeneficios        || null)
            .input('FechaHoraInicioAtencion',       sql.DateTime2, dInicioAtencion)
            .input('FechaHoraFinAtencion',          sql.DateTime2, dFinAtencion)
            .input('TipoDocProfesional',            sql.NVarChar,  TipoDocProfesional               || null)
            .input('NumDocProfesional',             sql.NVarChar,  NumDocProfesional                || null)
            .input('DiagnosticoIngresoCIE11Codigo', sql.NVarChar,  DiagnosticoIngresoCIE11Codigo    || null)
            .input('DiagnosticoIngresoCIE11Termino',sql.NVarChar,  DiagnosticoIngresoCIE11Termino   || null)
            .input('TipoAlergia',                   sql.NVarChar,  TipoAlergia                      || null)
            .input('IdModalidadAtencion',           sql.Int,       idMod)
            .input('IdGrupoServicios',              sql.Int,       idGrp)
            .input('NitPrestadorIPS',               sql.NVarChar,  NitPrestadorIPS                  || null)
            .input('NombrePrestadorIPS',            sql.NVarChar,  NombrePrestadorIPS               || null)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA]
                (
                    [Documento Entidad], [Fecha RDA], [Id Tipo Documento],
                    [Primer Apellido Entidad], [Segundo Apellido Entidad],
                    [Primer Nombre Entidad], [Segundo Nombre Entidad],
                    [Fecha Nacimiento], [Edad], [Id Unidad de Medida Edad],
                    [Id Sexo Biologico], [Id Identidad Genero], [Id Pais Nacionalidad],
                    [Talla], [Peso], [Id Pais Recidencia], [Id Municipio Recidencia],
                    [Id Zona Residencia], [Dirección], [Id Etnia], [Comunidad Etnica],
                    [Id Discapacidad], [Teléfono Celular], [Alergeno],
                    [Codigo Prestador], [Codigo Admin Plan Beneficios], [Nombre Admin Plan Beneficios],
                    [Fecha Hora Inicio Atencion], [Fecha Hora Fin Atencion],
                    [Tipo Doc Profesional], [Num Doc Profesional],
                    [Diagnostico Ingreso CIE11 Codigo], [Diagnostico Ingreso CIE11 Termino],
                    [Tipo Alergia],
                    [Id Modalidad Atencion], [Id Grupo Servicios],
                    [NIT Prestador IPS], [Nombre Prestador IPS]
                )
                OUTPUT INSERTED.[Id Evaluacion Entidad RDA]
                VALUES
                (
                    @DocumentoEntidad, @FechaRDA, @IdTipoDocumento,
                    @PrimerApellidoEntidad, @SegundoApellidoEntidad,
                    @PrimerNombreEntidad, @SegundoNombreEntidad,
                    @FechaNacimiento, @Edad, @IdUnidaddeMedidaEdad,
                    @IdSexoBiologico, @IdIdentidadGenero, @IdPaisNacionalidad,
                    @Talla, @Peso, @IdPaisRecidencia, @IdMunicipioRecidencia,
                    @IdZonaResidencia, @Direccion, @IdEtnia, @ComunidadEtnica,
                    @IdDiscapacidad, @TelefonoCelular, @Alergeno,
                    @CodigoPrestador, @CodigoAdminPlanBeneficios, @NombreAdminPlanBeneficios,
                    @FechaHoraInicioAtencion, @FechaHoraFinAtencion,
                    @TipoDocProfesional, @NumDocProfesional,
                    @DiagnosticoIngresoCIE11Codigo, @DiagnosticoIngresoCIE11Termino,
                    @TipoAlergia,
                    @IdModalidadAtencion, @IdGrupoServicios,
                    @NitPrestadorIPS, @NombrePrestadorIPS
                )
            `);
        const idInsertado = result.recordset[0]['Id Evaluacion Entidad RDA'];
        res.json({ ok: true, IdEvaluacionEntidadRDA: idInsertado });
    } catch (error) {
        console.error('❌ Error al insertar Evaluacion Entidad RDA:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDA/AntecedentesSalud', async (req, res) => {
    const { IdEvaluacionEntidadRDA, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdEvaluacionEntidadRDA', sql.Int,      parseInt(IdEvaluacionEntidadRDA))
            .input('DocumentoEntidad',       sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion',            sql.NVarChar, Descripcion      || null)
            .input('IdEstado',               sql.Int,      IdEstado ? parseInt(IdEstado) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA Antecedentes Salud]
                ([Id Evaluacion Entidad RDA], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdEvaluacionEntidadRDA, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error al insertar Antecedente Salud:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDA/AntecedentesFamiliares', async (req, res) => {
    const { IdEvaluacionEntidadRDA, DocumentoEntidad, Parentesco, Descripcion, IdEstado, CIE11Codigo, CIE11Termino } = req.body;
    const descripcionFinal = resolveAntecedenteFamDescripcion(Descripcion, CIE11Codigo, CIE11Termino);
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdEvaluacionEntidadRDA', sql.Int,      parseInt(IdEvaluacionEntidadRDA))
            .input('DocumentoEntidad',       sql.NVarChar, DocumentoEntidad || null)
            .input('Parentesco',             sql.NVarChar, Parentesco       || null)
            .input('Descripcion',            sql.NVarChar, descripcionFinal)
            .input('CIE11Codigo',            sql.NVarChar, CIE11Codigo      || null)
            .input('CIE11Termino',           sql.NVarChar, CIE11Termino     || null)
            .input('IdEstado',               sql.Int,      IdEstado ? parseInt(IdEstado) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA Antecedentes Familiares]
                ([Id Evaluacion Entidad RDA], [Documento Entidad], [Parentesco], [Descripcion], [CIE11 Codigo], [CIE11 Termino], [Id Estado])
                VALUES (@IdEvaluacionEntidadRDA, @DocumentoEntidad, @Parentesco, @Descripcion, @CIE11Codigo, @CIE11Termino, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error al insertar Antecedente Familiar:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDA/AntecedentesFarmacologicos', async (req, res) => {
    const { IdEvaluacionEntidadRDA, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdEvaluacionEntidadRDA', sql.Int,      parseInt(IdEvaluacionEntidadRDA))
            .input('DocumentoEntidad',       sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion',            sql.NVarChar, Descripcion      || null)
            .input('IdEstado',               sql.Int,      IdEstado ? parseInt(IdEstado) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA Antecedentes Farmacologicos]
                ([Id Evaluacion Entidad RDA], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdEvaluacionEntidadRDA, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error al insertar Antecedente Farmacologico:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

// ======================================================================================
// RDA PACIENTE — Construcción FHIR Bundle desde BD
// ======================================================================================
// Body (recomendado): { "IdEvaluacionEntidadRDA": 123 }
// Opcional (solo pruebas puntuales sin UPDATE en BD):
//   overrideCodigoPrestador, overrideNitPrestadorIPS, overrideNombrePrestadorIPS
// Devuelve: Bundle FHIR type="document" (paciente) con Composition + Patient + entradas
// (Condition, FamilyMemberHistory, MedicationStatement).
router.post('/RdaPaciente/FhirBundle', async (req, res) => {
    const { IdEvaluacionEntidadRDA } = req.body || {};

    const id = IdEvaluacionEntidadRDA != null ? parseInt(IdEvaluacionEntidadRDA, 10) : NaN;
    if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
    }

    const { randomUUID } = require('crypto');
    const newUuid = () => {
        try {
            if (typeof randomUUID === 'function') return randomUUID();
        } catch (_) {
            // ignore
        }
        return `uuid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    // IHCE (manual operativo) valida que las entradas del Bundle solo incluyan `resource`
    // (no acepta `fullUrl`). Las referencias internas se manejan con el patrón `#<id>`.
    const makeEntry = (resource) => {
        const entryId = resource.id || newUuid();
        resource.id = entryId;
        return { resource };
    };

    const refOf = (entryOrResource) => {
        const r = entryOrResource && entryOrResource.resource ? entryOrResource.resource : entryOrResource;
        const id = r && r.id ? String(r.id) : '';
        if (!id) throw new Error('[RDA] No se puede referenciar un recurso sin id');
        return `#${id}`;
    };

    const parseCodigoDescripcion = (text) => {
        const s = (text ?? '').toString().trim();
        if (!s) return { codigo: '', descripcion: '' };
        // En el frontend se guardan así: `${codigo} - ${descripcion}`
        const parts = s.split(' - ');
        if (parts.length >= 2) {
            return {
                codigo: (parts[0] ?? '').trim(),
                descripcion: parts.slice(1).join(' - ').trim(),
            };
        }
        return { codigo: s, descripcion: '' };
    };

    const parseNombreObservacion = (text) => {
        const s = (text ?? '').toString().trim();
        if (!s) return { nombre: '', observacion: '' };
        // En el frontend se guarda así: `nombre (observacion)`
        if (s.endsWith(')')) {
            const idx = s.lastIndexOf(' (');
            if (idx > -1) {
                return {
                    nombre: s.slice(0, idx).trim(),
                    observacion: s.slice(idx + 3, -1).trim(),
                };
            }
        }
        return { nombre: s, observacion: '' };
    };

    /** Formato BD: `codigo - nombre (observacion)` o `codigo - nombre` o `nombre (obs)`. */
    const parseMedicamentoDescripcion = (text) => {
        const s = (text ?? '').toString().trim();
        if (!s) return { codigo: '', nombre: '', observacion: '' };
        let base = s;
        let observacion = '';
        const obsMatch = s.match(/^(.+?)\s+\(([^)]+)\)\s*$/);
        if (obsMatch) {
            base = obsMatch[1].trim();
            observacion = obsMatch[2].trim();
        }
        const codeDesc = parseCodigoDescripcion(base);
        if (codeDesc.descripcion) {
            return {
                codigo: codeDesc.codigo,
                nombre: codeDesc.descripcion,
                observacion,
            };
        }
        return { codigo: '', nombre: base, observacion };
    };
    const parseParentescoAntecedente = (value) => {
        const s = (value ?? '').toString().trim();
        if (!s) return '';
        const m = s.match(/^(\d{2})/);
        return m ? m[1] : s;
    };

    // Categoría FHIR AllergyIntolerance según código TipoAlergia (catálogo MinSalud).

    const RDA_SD = 'https://fhir.minsalud.gov.co/rda/StructureDefinition';
    const CS_MODALITY = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality';
    const CS_GRUPO_SVC = 'https://fhir.minsalud.gov.co/rda/CodeSystem/GrupoServicios';
    const ICD10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10';
    const ICD11_SYSTEM = 'http://hl7.org/fhir/sid/icd-11';

    const toFhirDtCo = (v) => toFhirDateTimeColombia(v);

    const emptySectionNilKnown = (texto) => ({
        emptyReason: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
                    code: 'nilknown',
                    display: 'Nil Known',
                },
            ],
            text: texto || 'Sin información registrada',
        },
    });

    const CONDITION_STATEMENT_RDA_BASE = {
        clinicalStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }],
        },
        verificationStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'unconfirmed', display: 'Unconfirmed' }],
        },
        category: [{
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }],
        }],
    };

    const CS_MIPRES_INN = 'https://fhir.minsalud.gov.co/rda/CodeSystem/MipresINN';

    // Construye codings de Condition para soportar dualidad CIE-10 / CIE-11.
    const buildConditionCodings = ({
        cie10Code,
        cie10Display,
        cie11Code,
        cie11Display,
    }) => {
        const codings = [];
        const c10 = cie10Code != null ? String(cie10Code).trim() : '';
        const d10 = cie10Display != null ? String(cie10Display).trim() : '';
        const c11 = cie11Code != null ? String(cie11Code).trim() : '';
        const d11 = cie11Display != null ? String(cie11Display).trim() : '';

        if (c10 && isIcd10Code(c10)) {
            codings.push({
                system: ICD10_SYSTEM,
                code: c10,
                display: d10 || undefined,
            });
        }
        if (c11 && classifyIcdCode(c11) !== 'icd-10') {
            codings.push({
                system: ICD11_SYSTEM,
                code: c11,
                display: d11 || undefined,
            });
        }
        return codings;
    };

    /** FamilyMemberHistoryRDA: solo ICD-10 Colombia en condition.code.coding (sin CIE-11). */
    const buildFamilyHistoryConditionCode = (item) => {
        const c10 = (item.codigo || '').trim();
        const c10Desc = (item.descripcion || '').trim();
        const c11Term = (item.cie11Termino || '').trim();
        const codings = [];
        if (c10 && isIcd10Code(c10)) {
            codings.push({
                system: ICD10_SYSTEM,
                code: c10,
                display: c10Desc || undefined,
            });
        }
        const text = c10Desc || c11Term || c10 || (item.cie11Codigo || '').trim() || undefined;
        return {
            ...(codings.length ? { coding: codings } : {}),
            ...(text ? { text } : {}),
        };
    };

    const buildRdaPacienteBundle = ({
        paciente,
        organizationEapb,
        organizationIps,
        practitioner,
        head,
        antecedents,
        antecedentsFam,
        medications,
        alergia,
    }) => {
        const patientEntry = makeEntry(paciente.resource);
        const patientId = patientEntry.resource.id;
        const compositionDateIso = toFhirDtCo(head && head.FechaRDA) || toFhirDateTimeColombiaNow();

        const conditionEntries = (antecedents || []).map((item, idx) =>
            makeEntry({
                resourceType: 'Condition',
                id: `Condition-${idx}`,
                meta: {
                    profile: [`${RDA_SD}/ConditionStatementRDA`],
                },
                ...CONDITION_STATEMENT_RDA_BASE,
                subject: { reference: refOf(patientEntry) },
                code: {
                    coding: buildConditionCodings({
                        cie10Code: item.codigo,
                        cie10Display: item.descripcion,
                        cie11Code: item.cie11Codigo,
                        cie11Display: item.cie11Termino,
                    }),
                    text: item.descripcion || item.codigo,
                },
            })
        );

        const c11Ingreso = head && (head.DiagnosticoIngresoCIE11Codigo || '').toString().trim();
        const c11IngresoTerm = head && (head.DiagnosticoIngresoCIE11Termino || '').toString().trim();
        const conditionIngresoEntry = c11Ingreso
            ? makeEntry({
                resourceType: 'Condition',
                id: 'ConditionIngreso-0',
                meta: {
                    profile: [`${RDA_SD}/ConditionStatementRDA`],
                },
                ...CONDITION_STATEMENT_RDA_BASE,
                subject: { reference: refOf(patientEntry) },
                code: {
                    coding: buildConditionCodings({
                        cie11Code: c11Ingreso,
                        cie11Display: c11IngresoTerm,
                    }),
                    text: c11IngresoTerm || c11Ingreso,
                },
            })
            : null;

        const familyHistoryEntries = (antecedentsFam || []).map((item, idx) =>
            makeEntry({
                resourceType: 'FamilyMemberHistory',
                id: `FamilyMemberHistory-${idx}`,
                meta: {
                    profile: [`${RDA_SD}/FamilyMemberHistoryRDA`],
                },
                status: 'partial',
                patient: { reference: refOf(patientEntry) },
                relationship: {
                    coding: [
                        {
                            system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ParentescoAntecedente',
                            code: parseParentescoAntecedente(item.parentesco),
                            display: item.textoParentesco || undefined,
                        },
                    ],
                },
                condition: [
                    {
                        code: buildFamilyHistoryConditionCode(item),
                    },
                ],
            })
        );

        const medicationStatementEntries = (medications || []).map((item, idx) => {
            const medCode = (item.codigo || '').toString().trim();
            const medName = (item.nombre || '').toString().trim();
            const medObs = (item.observacion || '').toString().trim();
            const medDisplay = medName || medCode;
            return makeEntry({
                resourceType: 'MedicationStatement',
                id: `MedicationStatement-${idx}`,
                meta: {
                    profile: [`${RDA_SD}/MedicationStatementRDA`],
                },
                status: 'completed',
                subject: { reference: refOf(patientEntry) },
                medicationCodeableConcept: medCode
                    ? {
                        coding: [{
                            system: CS_MIPRES_INN,
                            code: medCode,
                            display: medDisplay || undefined,
                        }],
                    }
                    : { text: medDisplay },
                note: medObs ? [{ text: medObs }] : undefined,
            });
        });

        const observationEntries = [];
        const parseNum = (x) => {
            const n = parseFloat(String(x || '').replace(',', '.'));
            return Number.isFinite(n) ? n : null;
        };
        const tallaN = head ? parseNum(head.Talla) : null;
        const pesoN = head ? parseNum(head.Peso) : null;
        if (tallaN != null && tallaN > 0) {
            observationEntries.push(
                makeEntry({
                    resourceType: 'Observation',
                    id: `Observation-Talla-0`,
                    status: 'final',
                    category: [
                        {
                            coding: [
                                {
                                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                                    code: 'vital-signs',
                                    display: 'Vital Signs',
                                },
                            ],
                        },
                    ],
                    code: {
                        coding: [
                            {
                                system: 'http://loinc.org',
                                code: '8302-2',
                                display: 'Body height',
                            },
                        ],
                    },
                    subject: { reference: refOf(patientEntry) },
                    valueQuantity: { value: tallaN, unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' },
                })
            );
        }
        if (pesoN != null && pesoN > 0) {
            observationEntries.push(
                makeEntry({
                    resourceType: 'Observation',
                    id: `Observation-Peso-0`,
                    status: 'final',
                    category: [
                        {
                            coding: [
                                {
                                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                                    code: 'vital-signs',
                                    display: 'Vital Signs',
                                },
                            ],
                        },
                    ],
                    code: {
                        coding: [
                            {
                                system: 'http://loinc.org',
                                code: '29463-7',
                                display: 'Body weight',
                            },
                        ],
                    },
                    subject: { reference: refOf(patientEntry) },
                    valueQuantity: { value: pesoN, unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' },
                })
            );
        }

        // AllergyIntolerance: tipo de alergía (obligatorio en pantalla) + texto del alérgeno si existe.
        const tipoAlergiaParsed = parseCodigoDescripcion(alergia && alergia.tipoAlergia);
        const tipoAlergiaCode = normalizeTipoAlergiaCode(tipoAlergiaParsed.codigo || (alergia && alergia.tipoAlergia));
        const tipoAlergiaDisplay = resolveTipoAlergiaDisplay(
            tipoAlergiaCode,
            tipoAlergiaParsed.descripcion || (alergia && alergia.nombreTipoAlergia),
        );
        const alergenoTexto = alergia && (alergia.alergeno || '').toString().trim();
        const hasAlergia = Boolean(tipoAlergiaCode || alergenoTexto);
        const allergyText = alergenoTexto || tipoAlergiaDisplay || 'Alergia no especificada';
        const allergyEntry = hasAlergia
            ? (() => makeEntry({
                resourceType: 'AllergyIntolerance',
                id: 'AllergyIntolerance-0',
                meta: {
                    profile: [`${RDA_SD}/AllergyIntoleranceStatementRDA`],
                },
                clinicalStatus: {
                    coding: [
                        {
                            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                            code: 'active',
                        },
                    ],
                },
                verificationStatus: {
                    coding: [
                        {
                            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                            code: 'unconfirmed',
                            display: 'Unconfirmed',
                        },
                    ],
                },
                code: {
                    coding: [
                        {
                            system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/TipoAlergia',
                            code: tipoAlergiaCode || '99',
                            display: tipoAlergiaDisplay || 'No especificado',
                        },
                    ],
                    text: allergyText,
                },
                patient: { reference: refOf(patientEntry) },
            }))()
            : null;

        const periodStart =
            toFhirDtCo(head && head.FechaHoraInicioAtencion) || compositionDateIso;
        const periodEnd =
            toFhirDtCo(head && head.FechaHoraFinAtencion) || periodStart;
        const modCode = (head && head.CodigoModalidadAtencion && String(head.CodigoModalidadAtencion).trim()) || '01';
        const modDisplay = head && head.NombreModalidadAtencion ? String(head.NombreModalidadAtencion) : undefined;
        const modSystem = head && head.ModalidadAtencionSystemUrl
            ? String(head.ModalidadAtencionSystemUrl).trim()
            : null;
        const grpCode = (head && head.CodigoGrupoServicios && String(head.CodigoGrupoServicios).trim()) || '01';
        const grpDisplay = head && head.NombreGrupoServicios ? String(head.NombreGrupoServicios) : undefined;

        const practitionerRef = practitioner ? { reference: refOf(practitioner) } : null;
        const custodianRef = organizationIps ? { reference: refOf(organizationIps) } : null;
        if (!practitionerRef) {
            throw new Error(
                'No se pudo construir Composition.author (PractitionerRDA). Verifique Tipo/Num documento del profesional en el RDA o datos mínimos del autor.'
            );
        }
        if (!custodianRef) {
            throw new Error(
                'No se pudo construir Composition.custodian (IPS). Verifique NitPrestadorIPS y CodigoPrestador en la cabecera RDA.'
            );
        }

        const compositionId = 'Composition-0';

        // RDA Paciente (CompositionPatientStatementRDA): encounter tiene cardinalidad 0 en el IG IHCE;
        // incluir Encounter provoca BUNDLE-005 (“Prior creation in FHIR service”). Modalidad/grupo van en Composition.event.
        const sections = [];
        sections.push(
            medicationStatementEntries.length
                ? {
                    title: 'Antecedentes farmacológicos',
                    entry: medicationStatementEntries.map((e) => ({ reference: refOf(e) })),
                }
                : {
                    title: 'Antecedentes farmacológicos',
                    ...emptySectionNilKnown('No se registran antecedentes farmacológicos'),
                }
        );
        sections.push(
            allergyEntry
                ? {
                    title: 'Antecedentes alérgicos',
                    entry: [{ reference: refOf(allergyEntry) }],
                }
                : {
                    title: 'Antecedentes alérgicos',
                    ...emptySectionNilKnown('No se conocen alergias'),
                }
        );
        sections.push(
            (conditionEntries.length || conditionIngresoEntry)
                ? {
                    title: 'Antecedentes patológicos',
                    entry: [
                        ...(conditionIngresoEntry ? [{ reference: refOf(conditionIngresoEntry) }] : []),
                        ...conditionEntries.map((e) => ({ reference: refOf(e) })),
                    ],
                }
                : {
                    title: 'Antecedentes patológicos',
                    ...emptySectionNilKnown('No se registran antecedentes patológicos'),
                }
        );
        sections.push(
            familyHistoryEntries.length
                ? {
                    title: 'Antecedentes familiares',
                    entry: familyHistoryEntries.map((e) => ({ reference: refOf(e) })),
                }
                : {
                    title: 'Antecedentes familiares',
                    ...emptySectionNilKnown('No se registran antecedentes familiares'),
                }
        );

        const compositionResource = {
            resourceType: 'Composition',
            id: compositionId,
            meta: {
                profile: [`${RDA_SD}/CompositionPatientStatementRDA`],
            },
            status: 'final',
            type: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '102089-0',
                        display: 'FHIR resource patient medical record',
                    },
                ],
            },
            date: compositionDateIso,
            title: 'Resumen Digital de Atención en Salud - RDA de antecedentes manifestados por el paciente',
            confidentiality: 'N',
            attester: custodianRef ? [{ mode: 'legal', party: custodianRef }] : undefined,
            event: [
                {
                    period: {
                        start: periodStart,
                        end: periodEnd,
                    },
                    code: [
                        {
                            coding: [
                                {
                                    system: modSystem || CS_MODALITY,
                                    code: modCode,
                                    display: modDisplay,
                                },
                            ],
                        },
                        {
                            coding: [
                                {
                                    system: CS_GRUPO_SVC,
                                    code: grpCode,
                                    display: grpDisplay,
                                },
                            ],
                        },
                    ],
                },
            ],
            subject: { reference: refOf(patientEntry) },
            custodian: custodianRef,
            author: [practitionerRef],
            section: sections,
        };

        const compositionEntry = makeEntry(compositionResource);

        const bundleEntries = [
            compositionEntry,
            patientEntry,
            ...(practitioner ? [practitioner] : []),
            ...(organizationIps ? [organizationIps] : []),
            ...(organizationEapb ? [organizationEapb] : []),
            ...observationEntries,
            ...(conditionIngresoEntry ? [conditionIngresoEntry] : []),
            ...conditionEntries,
            ...familyHistoryEntries,
            ...medicationStatementEntries,
            ...(allergyEntry ? [allergyEntry] : []),
        ];

        return {
            resourceType: 'Bundle',
            language: 'es-CO',
            type: 'document',
            entry: bundleEntries,
        };
    };

    try {
        const pool = await poolPromise;

        // Verificación temprana: si las tablas RDA no existen en BD,
        // el SQL falla con "El nombre de objeto ... no es válido".
        const existsCheck = await pool
            .request()
            .query(`
                SELECT
                    OBJECT_ID('dbo.[Evaluacion Entidad RDA]') AS oidMain,
                    OBJECT_ID('dbo.[Evaluacion Entidad RDA Antecedentes Salud]') AS oidAntSalud,
                    OBJECT_ID('dbo.[Evaluacion Entidad RDA Antecedentes Familiares]') AS oidAntFam,
                    OBJECT_ID('dbo.[Evaluacion Entidad RDA Antecedentes Farmacologicos]') AS oidAntFarm
            `);

        const chk = existsCheck.recordset && existsCheck.recordset[0] ? existsCheck.recordset[0] : null;
        if (!chk || chk.oidMain == null) {
            return res.status(500).json({
                ok: false,
                error:
                    'Faltan tablas de RDA Paciente en la BD. Verifica haber ejecutado los scripts SQL de RDA (tabla Evaluacion Entidad RDA).',
            });
        }

        // 1) Cabecera (Patient + Organization base)
        const main = await pool
            .request()
            .input('IdEvaluacionEntidadRDA', sql.Int, id)
            .query(`
                SELECT
                    e.[Id Evaluacion Entidad RDA]      AS IdEvaluacionEntidadRDA,
                    e.[Documento Entidad]              AS DocumentoEntidad,
                    e.[Primer Apellido Entidad]        AS PrimerApellidoEntidad,
                    e.[Segundo Apellido Entidad]       AS SegundoApellidoEntidad,
                    e.[Primer Nombre Entidad]          AS PrimerNombreEntidad,
                    e.[Segundo Nombre Entidad]         AS SegundoNombreEntidad,
                    e.[Id Tipo Documento]              AS IdTipoDocumento,
                    t.[CódigoTipoDocumento]            AS CodigoTipoDocumento,
                    t.[TipoDocumento]                  AS TipoDocumento,
                    t.[DescripciónTipoDocumento]       AS DescripcionTipoDocumento,
                    e.[Fecha Nacimiento]               AS FechaNacimiento,
                    e.[Id Sexo Biologico]              AS IdSexoBiologico,
                    sx.[CódigoSexo]                   AS CodigoSexo,
                    sx.[Sexo]                          AS Sexo,
                    e.[Id Identidad Genero]            AS IdIdentidadGenero,
                    gi.[Codigo]                        AS CodigoIdentidadGenero,
                    gi.[IdentidadGenero]               AS TextoIdentidadGenero,
                    e.[Id Pais Nacionalidad]           AS IdPaisNacionalidad,
                    pn.[Codigo]                        AS CodigoPaisNacionalidad,
                    pn.[Nombre]                        AS NombrePaisNacionalidad,
                    e.[Id Pais Recidencia]             AS IdPaisResidencia,
                    pr.[Codigo]                        AS CodigoPaisResidencia,
                    pr.[Nombre]                        AS NombrePaisResidencia,
                    e.[Id Municipio Recidencia]        AS IdMunicipioResidencia,
                    c.[Codigo]                         AS CodigoMunicipio,
                    c.[Nombre]                         AS NombreMunicipio,
                    e.[Id Zona Residencia]             AS IdZonaResidencia,
                    z.[ZonaResidencia]                 AS ZonaResidencia,
                    e.[Dirección]                      AS Direccion,
                    e.[Id Etnia]                       AS IdEtnia,
                    et.[CódigoEtnia]                  AS CodigoEtnia,
                    et.[Etnia]                         AS TextoEtnia,
                    e.[Comunidad Etnica]               AS ComunidadEtnica,
                    e.[Id Discapacidad]                AS IdDiscapacidad,
                    d.[Codigo]                         AS CodigoDiscapacidad,
                    d.[Discapacidad]                   AS TextoDiscapacidad,
                    e.[Teléfono Celular]               AS TelefonoCelular,
                    e.[Talla]                          AS Talla,
                    e.[Peso]                           AS Peso,
                    e.[Codigo Prestador]               AS CodigoPrestador,
                    e.[Codigo Admin Plan Beneficios]   AS CodigoAdminPlanBeneficios,
                    e.[Nombre Admin Plan Beneficios]   AS NombreAdminPlanBeneficios,
                    e.[Fecha RDA]                      AS FechaRDA,
                    e.[Alergeno]                       AS Alergeno,
                    e.[Tipo Alergia]                   AS TipoAlergia,
                    tal.[Descripcion]                  AS NombreTipoAlergia,
                    e.[Fecha Hora Inicio Atencion]     AS FechaHoraInicioAtencion,
                    e.[Fecha Hora Fin Atencion]        AS FechaHoraFinAtencion,
                    e.[Tipo Doc Profesional]           AS TipoDocProfesional,
                    e.[Num Doc Profesional]            AS NumDocProfesional,
                    e.[Diagnostico Ingreso CIE11 Codigo]  AS DiagnosticoIngresoCIE11Codigo,
                    e.[Diagnostico Ingreso CIE11 Termino] AS DiagnosticoIngresoCIE11Termino,
                    e.[Id Modalidad Atencion]          AS IdModalidadAtencion,
                    e.[Id Grupo Servicios]             AS IdGrupoServicios,
                    e.[NIT Prestador IPS]              AS NitPrestadorIPS,
                    e.[Nombre Prestador IPS]           AS NombrePrestadorIPS,
                    ma.[Codigo]                        AS CodigoModalidadAtencion,
                    COALESCE(ctm.display, ma.[NombreModalidadAtencion]) AS NombreModalidadAtencion,
                    ctm.system_url                     AS ModalidadAtencionSystemUrl,
                    gs.[Codigo]                        AS CodigoGrupoServicios,
                    gs.[NombreGrupoServicios]          AS NombreGrupoServicios,
                    eprof.[Primer Apellido Entidad]    AS ProfPrimerApellido,
                    eprof.[Segundo Apellido Entidad]   AS ProfSegundoApellido,
                    eprof.[Primer Nombre Entidad]      AS ProfPrimerNombre,
                    eprof.[Segundo Nombre Entidad]     AS ProfSegundoNombre
                FROM [dbo].[Evaluacion Entidad RDA] e
                LEFT JOIN [dbo].[Cnsta Tipodocumento 1888] t
                    ON t.[IdTipodeDocumento] = e.[Id Tipo Documento]
                LEFT JOIN [dbo].[Cnsta Sexo 1888] sx
                    ON sx.[IdSexo] = e.[Id Sexo Biologico]
                LEFT JOIN [dbo].[Cnsta SexoIdentidad 1888] gi
                    ON gi.[IdSexoIdentidadGenero] = e.[Id Identidad Genero]
                LEFT JOIN [dbo].[Cnsta Pais 1888] pn
                    ON pn.[IdPais1888] = e.[Id Pais Nacionalidad]
                LEFT JOIN [dbo].[Cnsta Pais 1888] pr
                    ON pr.[IdPais1888] = e.[Id Pais Recidencia]
                LEFT JOIN [dbo].[Cnsta Ciudad 1888] c
                    ON c.[IdCiudad1888] = e.[Id Municipio Recidencia]
                LEFT JOIN [dbo].[Cnsta ZonaResidencia 1888] z
                    ON z.[IdZonaResidencia] = e.[Id Zona Residencia]
                LEFT JOIN [dbo].[Cnsta Etnia 1888] et
                    ON et.[IdEtnia] = e.[Id Etnia]
                LEFT JOIN [dbo].[Cnsta Discapacidad 1888] d
                    ON d.[IdDiscapacidad] = e.[Id Discapacidad]
                LEFT JOIN [dbo].[Cnsta Relacionador Modalidad Atencion] ma
                    ON ma.[IdModalidadAtencion] = e.[Id Modalidad Atencion]
                LEFT JOIN dbo.VW_RDA_ColombianTechModality_Activos ctm
                    ON LTRIM(RTRIM(ctm.codigo)) = LTRIM(RTRIM(ma.[Codigo]))
                LEFT JOIN [dbo].[Cnsta Relacionador ModalidadGrupoServicioTecSal] gs
                    ON gs.[IdGrupoServicios] = e.[Id Grupo Servicios]
                LEFT JOIN [dbo].[Cnsta Tipo de alergia 1888] tal
                    ON LTRIM(RTRIM(tal.Codigo)) = LTRIM(RTRIM(LEFT(LTRIM(RTRIM(e.[Tipo Alergia])), 2)))
                LEFT JOIN [dbo].[Entidad] eprof
                    ON eprof.[Documento Entidad] = e.[Num Doc Profesional]
                WHERE e.[Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
            `);

        if (!main.recordset || !main.recordset.length) {
            return res.status(404).json({ ok: false, error: 'No existe Evaluacion Entidad RDA para el Id indicado' });
        }

        const head = main.recordset[0];

        const ob = req.body || {};
        if (ob.overrideCodigoPrestador != null && String(ob.overrideCodigoPrestador).trim()) {
            head.CodigoPrestador = String(ob.overrideCodigoPrestador).trim();
        }
        if (ob.overrideNitPrestadorIPS != null && String(ob.overrideNitPrestadorIPS).trim()) {
            head.NitPrestadorIPS = String(ob.overrideNitPrestadorIPS).trim();
        }
        if (ob.overrideNombrePrestadorIPS != null && String(ob.overrideNombrePrestadorIPS).trim()) {
            head.NombrePrestadorIPS = String(ob.overrideNombrePrestadorIPS).trim();
        }

        const { loadDotEnvFromCandidates } = require('../../config/envLoader');
        loadDotEnvFromCandidates();
        mergePrestadorHeadFromEnv(head, normalizeIhceAmbiente(ob.ambiente), ob);

        const codPrestHdr = head.CodigoPrestador != null ? String(head.CodigoPrestador).trim() : '';
        if (!codPrestHdr || codPrestHdr.toLowerCase() === 'null') {
            return res.status(400).json({
                ok: false,
                error:
                    'La cabecera RDA no tiene Código Prestador (REPS). Vuelva a guardar el RDA eligiendo el prestador IPS en el formulario.',
            });
        }
        if (head.IdModalidadAtencion == null) {
            return res.status(400).json({
                ok: false,
                error:
                    'Falta modalidad de atención en la cabecera RDA. Complétela en el formulario antes de generar el Bundle FHIR.',
            });
        }
        if (head.IdGrupoServicios == null) {
            return res.status(400).json({
                ok: false,
                error:
                    'Falta grupo de servicios en la cabecera RDA. Compléntelo en el formulario antes de generar el Bundle FHIR.',
            });
        }

        // 2) Listas
        const [antecedentsRes, antecedentsFamRes, medsRes, parentescosRes] = await Promise.all([
            pool.request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT [Descripcion]
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Salud]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA AND [Id Estado] = 1
                `),
            pool.request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT [Parentesco], [Descripcion], [CIE11 Codigo] AS CIE11Codigo, [CIE11 Termino] AS CIE11Termino
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Familiares]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA AND [Id Estado] = 1
                `),
            pool.request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT [Descripcion]
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Farmacologicos]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA AND [Id Estado] = 1
                `),
            pool.request().query(`
                SELECT Codigo, Descripcion
                FROM [dbo].[Cnsta Parentesco familiar RDA 1888]
            `)
        ]);

        const parentescosMap = new Map(
            (parentescosRes.recordset || []).map((r) => [String(r.Codigo), String(r.Descripcion)])
        );

        const antecedentes = (antecedentsRes.recordset || []).map((r) => {
            const parsed = parseCodigoDescripcion(r.Descripcion);
            return { codigo: parsed.codigo, descripcion: parsed.descripcion };
        });

        const antecedentesFam = (antecedentsFamRes.recordset || []).map((r) => {
            const parsed = parseCodigoDescripcion(r.Descripcion);
            const parentescoCodigo = r.Parentesco != null ? String(r.Parentesco) : '';
            const c11c = r.CIE11Codigo != null ? String(r.CIE11Codigo).trim() : '';
            const c11t = r.CIE11Termino != null ? String(r.CIE11Termino).trim() : '';

            let cie10Code = '';
            let cie10Desc = '';
            if (c11c) {
                // Descripcion suele repetir CIE-11; solo tomar CIE-10 si el parsed es distinto y formato CIE-10.
                if (parsed.codigo && parsed.codigo !== c11c && isIcd10Code(parsed.codigo)) {
                    cie10Code = parsed.codigo;
                    cie10Desc = parsed.descripcion;
                }
            } else if (parsed.codigo && isIcd10Code(parsed.codigo)) {
                cie10Code = parsed.codigo;
                cie10Desc = parsed.descripcion;
            } else if (parsed.codigo && classifyIcdCode(parsed.codigo) === 'icd-11') {
                return {
                    parentesco: parentescoCodigo,
                    textoParentesco: parentescosMap.get(parentescoCodigo) || undefined,
                    codigo: '',
                    descripcion: '',
                    cie11Codigo: parsed.codigo,
                    cie11Termino: parsed.descripcion || c11t || undefined,
                };
            }

            return {
                parentesco: parentescoCodigo,
                textoParentesco: parentescosMap.get(parentescoCodigo) || undefined,
                codigo: cie10Code,
                descripcion: cie10Desc,
                cie11Codigo: c11c || undefined,
                cie11Termino: c11t || undefined,
            };
        });

        const medicamentos = (medsRes.recordset || []).map((r) => {
            const parsed = parseMedicamentoDescripcion(r.Descripcion);
            return {
                codigo: parsed.codigo || '',
                nombre: parsed.nombre,
                observacion: parsed.observacion,
            };
        });

        // 3) Resources base (Patient + Organization)
        // IHCE recomienda referencias por tipo y número de identificación para Patient/Practitioner
        const docTypePaciente = normalizeDocTypeCode(head.TipoDocumento || head.CodigoTipoDocumento || 'SI');
        const docNumPaciente = (head.DocumentoEntidad || 'NO-INFORMADO').toString().trim();
        const pacienteId = `${docTypePaciente}-${docNumPaciente}`;

        // Para EAPB se usa el código (EAPBS) cuando exista
        const orgId = head.CodigoAdminPlanBeneficios != null && String(head.CodigoAdminPlanBeneficios).trim()
            ? String(head.CodigoAdminPlanBeneficios).trim()
            : newUuid();

        // -----------------------------------------------------------------------
        // Helper: builds a PatientRDA-conformant resource from the enriched head
        // row (includes catalog JOIN columns).
        // Reference profile example: https://vulcano.ihcecol.gov.co/Patient-92a8e277...
        // -----------------------------------------------------------------------
        const buildPatientRdaFromHead = (h, pid, orgEntry) => {
            // Primitive helpers
            const str  = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);
            const toIsoDate = (v) => {
                if (!v) return null;
                const d = new Date(v);
                return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
            };

            // gender: catálogo Sexo 1888 (CódigoSexo 01/02/03 o letra M/F) → FHIR + extensión biológica alineados (IHCE err-000)
            const { fhirGender, bioGender: biologicalGender } = patientGenderFromCatalog({
                codigoSexo: str(h.CodigoSexo),
                letraSexo: str(h.Sexo),
            });

            const docTypeCode = normalizeDocTypeCode(str(h.TipoDocumento) || str(h.CodigoTipoDocumento));
            const docTypeDisplayBd = str(h.DescripcionTipoDocumento);

            // Residence zone: map DB value (U/R or Urbana/Rural) to ColombianResidenceZone code
            const zonaText = str(h.ZonaResidencia) || '';
            const zonaLower = zonaText.toLowerCase();
            const zonaCode = (zonaLower === 'r' || zonaLower.includes('rural'))  ? '02'
                           : (zonaLower === 'u' || zonaLower.includes('urban'))  ? '01'
                           : (zonaText ? '01' : null);
            const zonaDisplay = zonaCode === '02' ? 'Rural' : zonaCode === '01' ? 'Urbana' : undefined;

            // Build Patient-level extensions
            const patExt = [];
            if (str(h.CodigoPaisNacionalidad)) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientNationality',
                    valueCoding: {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661',
                        code: str(h.CodigoPaisNacionalidad),
                        display: str(h.NombrePaisNacionalidad) || undefined,
                    },
                });
            }
            const ethnicity = resolveEthnicityForFhir(h.CodigoEtnia, h.TextoEtnia);
            if (ethnicity) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientEthnicity',
                    valueCoding: {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianEthnicGroup',
                        code: ethnicity.code,
                        display: ethnicity.display,
                    },
                });
            }
            if (str(h.ComunidadEtnica)) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientEthnicCommunity',
                    valueString: str(h.ComunidadEtnica),
                });
            }
            if (str(h.CodigoDiscapacidad)) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientDisability',
                    valueCoding: {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDisabilityClassification',
                        code: str(h.CodigoDiscapacidad),
                        display: str(h.TextoDiscapacidad) || undefined,
                    },
                });
            }
            if (str(h.CodigoIdentidadGenero) && h.IdIdentidadGenero && h.IdIdentidadGenero !== 0) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientGenderIdentity',
                    valueCoding: {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderIdentity',
                        code: str(h.CodigoIdentidadGenero),
                        display: str(h.TextoIdentidadGenero) || undefined,
                    },
                });
            }

            // Name
            const primerApellido  = str(h.PrimerApellidoEntidad)  || '';
            const segundoApellido = str(h.SegundoApellidoEntidad) || '';
            const primerNombre    = str(h.PrimerNombreEntidad)    || '';
            const segundoNombre   = str(h.SegundoNombreEntidad)   || '';
            // IHCE (MPI-002): Patient.name.family debe ser solo el primer apellido; el segundo va en ExtensionMothersFamilyName.
            const familyText      = primerApellido || undefined;
            const givenArr        = [primerNombre, segundoNombre].filter(Boolean);
            const familyExtArr    = [
                ...(primerApellido  ? [{ url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionFathersFamilyName', valueString: primerApellido }]  : []),
                ...(segundoApellido ? [{ url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionMothersFamilyName', valueString: segundoApellido }] : []),
            ];

            // Address
            const hasAddr = str(h.CodigoPaisResidencia) || str(h.NombreMunicipio) || str(h.Direccion);
            const homeAddr = hasAddr ? (() => {
                const addr = { id: 'HomeAddress-0', use: 'home', type: 'physical' };
                if (zonaCode) {
                    addr.extension = [{
                        url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionResidenceZone',
                        valueCoding: {
                            system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianResidenceZone',
                            code: zonaCode,
                            display: zonaDisplay,
                        },
                    }];
                }
                if (str(h.Direccion)) addr.line = [str(h.Direccion)];
                if (str(h.NombreMunicipio)) {
                    addr.city = str(h.NombreMunicipio);
                    const divipola = normalizeDivipolaMunicipalityCode(str(h.CodigoMunicipio));
                    if (divipola) {
                        addr._city = {
                            extension: [{
                                url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionDivipolaMunicipality',
                                valueCoding: {
                                    system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/DIVIPOLA',
                                    code: divipola,
                                },
                            }],
                        };
                    }
                }
                if (str(h.CodigoPaisResidencia)) {
                    addr.country = str(h.NombrePaisResidencia) || str(h.CodigoPaisResidencia);
                    addr._country = { extension: [{ url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionCountryCode', valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661', code: str(h.CodigoPaisResidencia) } }] };
                }
                return addr;
            })() : null;

            // Telecom
            const phoneVal = telefonoPacienteParaFhir(h.TelefonoCelular);

            // Compose resource
            return {
                resourceType: 'Patient',
                id: pid,
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/PatientRDA'],
                },
                ...(patExt.length > 0 ? { extension: patExt } : {}),
                ...(str(h.DocumentoEntidad) && docTypeCode
                    ? {
                        identifier: [
                            buildNationalPersonIdentifier({
                                docTypeCode,
                                value: str(h.DocumentoEntidad),
                                displayFromBd: docTypeDisplayBd,
                            }),
                        ],
                    }
                    : {}),
                active: true,
                ...(familyText || givenArr.length > 0
                    ? { name: [{
                        use: 'official',
                        ...(familyText ? { family: familyText } : {}),
                        ...(familyExtArr.length > 0 ? { _family: { extension: familyExtArr } } : {}),
                        ...(givenArr.length > 0 ? { given: givenArr } : {}),
                    }] }
                    : {}),
                ...(fhirGender ? { gender: fhirGender } : {}),
                ...(biologicalGender ? { _gender: { extension: [{ url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionBiologicalGender', valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderGroup', code: biologicalGender.code, display: biologicalGender.display } }] } } : {}),
                ...(() => {
                    const birthIso = toIsoDate(h.FechaNacimiento);
                    if (!birthIso) return {};
                    const out = { birthDate: birthIso };
                    if (hasBirthTimeColombia(h.FechaNacimiento)) {
                        normalizePatientBirthTimeExtension(out, h.FechaNacimiento);
                    }
                    return out;
                })(),
                deceasedBoolean: false,
                ...(phoneVal ? { telecom: [{ system: 'phone', value: phoneVal }] } : {}),
                ...(homeAddr ? { address: [homeAddr] } : {}),
                ...(orgEntry ? { managingOrganization: { reference: orgEntry.fullUrl, display: str(h.NombreAdminPlanBeneficios) || undefined } } : {}),
            };
        };

        // Organization resource (EAPB) — use a generated UUID so fullUrl is valid
        const organizationName = head.NombreAdminPlanBeneficios || '';
        const organizationResource = organizationName
            ? {
                resourceType: 'Organization',
                id: orgId,
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/HealthBenefitPlanAdminOrganizationRDA'],
                },
                identifier: head.CodigoAdminPlanBeneficios
                    ? [{ system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/EAPBS', value: String(head.CodigoAdminPlanBeneficios) }]
                    : undefined,
                active: true,
                name: organizationName,
            }
            : null;

        // Build a temporary Organization entry reference so Patient.managingOrganization can point to it
        const orgEntryRef = organizationResource ? { fullUrl: `#${orgId}` } : null;

        const patientResource = buildPatientRdaFromHead(head, pacienteId, orgEntryRef);

        const tipoProf = normalizeDocTypeCode(head.TipoDocProfesional || 'SI');
        const numProf = (head.NumDocProfesional || 'NO-INFORMADO').toString().trim();
        const practId = `${tipoProf}-${numProf}`;
        const profName = buildRdaPersonName({
            primerApellido: head.ProfPrimerApellido,
            segundoApellido: head.ProfSegundoApellido,
            primerNombre: head.ProfPrimerNombre,
            segundoNombre: head.ProfSegundoNombre,
        });
        const practitionerResource = {
            resourceType: 'Practitioner',
            id: practId,
            meta: {
                profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/PractitionerRDA'],
            },
            identifier: [
                buildNationalPersonIdentifier({
                    docTypeCode: tipoProf,
                    value: numProf,
                }),
            ],
            ...(profName ? { name: [profName] } : {}),
            active: true,
        };
        const practitionerEntry = makeEntry(practitionerResource);

        const nitIps = head.NitPrestadorIPS != null ? String(head.NitPrestadorIPS).trim() : '';
        const codPrest = head.CodigoPrestador != null ? String(head.CodigoPrestador).trim() : '';
        const ipsId = codPrest || newUuid();
        let organizationIpsEntry = null;
        if (codPrest) {
            const nombreIps =
                head.NombrePrestadorIPS != null && String(head.NombrePrestadorIPS).trim()
                    ? String(head.NombrePrestadorIPS).trim()
                    : `IPS (${codPrest})`;
            const identifiers = [
                ...(nitIps
                    ? [
                        {
                            id: 'TaxIdentifier',
                            use: 'official',
                            type: {
                                coding: [
                                    { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'TAX', display: 'Tax ID number' },
                                    { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'NIT', display: 'Número de Identificación Tributaria' },
                                ],
                            },
                            system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/DIAN',
                            value: nitIps,
                        },
                    ]
                    : []),
                {
                    id: 'HealthcareProviderIdentifier',
                    use: 'official',
                    type: {
                        coding: [
                            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                            { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'CodigoPrestador', display: 'Código de habilitación de prestador de servicios de salud' },
                        ],
                    },
                    system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                    value: codPrest,
                },
            ];

            const ipsResource = {
                resourceType: 'Organization',
                id: ipsId,
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/CareDeliveryOrganizationRDA'],
                },
                active: true,
                name: nombreIps,
                identifier: identifiers,
            };
            organizationIpsEntry = makeEntry(ipsResource);
        }

        if (organizationResource && head.CodigoAdminPlanBeneficios) {
            organizationResource.id = String(head.CodigoAdminPlanBeneficios).trim();
        }
        const organizationEapbEntry = organizationResource ? makeEntry(organizationResource) : null;

        const bundle = buildRdaPacienteBundle({
            paciente: { id: pacienteId, resource: patientResource },
            organizationEapb: organizationEapbEntry,
            organizationIps: organizationIpsEntry,
            practitioner: practitionerEntry,
            head,
            antecedents: antecedentes,
            antecedentsFam: antecedentesFam,
            medications: medicamentos,
            alergia: {
                alergeno: head.Alergeno,
                tipoAlergia: head.TipoAlergia,
                nombreTipoAlergia: head.NombreTipoAlergia,
            },
        });

        applyEnvCustodianIfConfigured(bundle, normalizeIhceAmbiente(ob.ambiente), ob);
        return res.json(bundle);
    } catch (error) {
        console.error('❌ [RDA] Error al construir Bundle FHIR RDA Paciente:', error);
        if (error instanceof PersonIdentifierDisplayError) {
            return res.status(400).json({ ok: false, code: error.code, error: error.message, docTypeCode: error.docTypeCode });
        }
        return res.status(500).json({ ok: false, error: error.message || String(error) });
    }
});

// ======================================================================================
// RDA PACIENTE — Envío a IHCE (sandbox/prod) desde backend
// ======================================================================================
// Body: { "IdEvaluacionEntidadRDA": 123, "ambiente": "sandbox" | "prod",
//   opcional: overrideCodigoPrestador, overrideNitPrestadorIPS, overrideNombrePrestadorIPS (se reenvían a FhirBundle) }
// Requiere variables de entorno por ambiente:
//   IHCE_SANDBOX_BASE_URL, IHCE_SANDBOX_TENANT_ID, IHCE_SANDBOX_CLIENT_ID, IHCE_SANDBOX_CLIENT_SECRET, IHCE_SANDBOX_SCOPE, IHCE_SANDBOX_SUBSCRIPTION_KEY
//   IHCE_PROD_BASE_URL,    IHCE_PROD_TENANT_ID,    IHCE_PROD_CLIENT_ID,    IHCE_PROD_CLIENT_SECRET,    IHCE_PROD_SCOPE,    IHCE_PROD_SUBSCRIPTION_KEY
router.post(
    [
        '/RdaPaciente/EnviarIHCE',
        '/RdaPaciente/EnviarIhce',
        '/RdaPaciente/JsonEnviarIHCE',
        '/RdaPaciente/JsonEnviarIhce',
        '/RdaPaciente/IHCE/EnviarPacienteAntecedentes',
        '/RdaPaciente/IHCE/PreviewPacienteAntecedentes',
        '/RdaPaciente/EnviarIHCEModular',
        '/RdaPaciente/EnviarIhceModular',
        '/RdaPaciente/JsonEnviarIHCEModular',
        '/RdaPaciente/JsonEnviarIhceModular',
        '/RdaPaciente/IHCE/EnviarPacienteAntecedentesModular',
        '/RdaPaciente/IHCE/PreviewPacienteAntecedentesModular',
    ],
    async (req, res) => {
    const { loadDotEnvFromCandidates } = require('../../config/envLoader');
    loadDotEnvFromCandidates();

    const https = require('https');

    const {
        IdEvaluacionEntidadRDA,
        ambiente,
        overrideCodigoPrestador,
        overrideNitPrestadorIPS,
        overrideNombrePrestadorIPS,
        // Solo endpoint de prueba: habilitar bloques de forma incremental.
        incluirConditionIngreso,
        incluirConditions,
        incluirFamilyHistory,
        incluirAllergy,
        incluirObservations,
    } = req.body || {};
    const id = IdEvaluacionEntidadRDA != null ? parseInt(IdEvaluacionEntidadRDA, 10) : NaN;
    if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
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

    /** Primer valor de entorno no vacío (trim). Orden importa. */
    const firstEnv = (...keys) => {
        for (let i = 0; i < keys.length; i += 1) {
            const v = process.env[keys[i]];
            if (v != null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    };

    let baseUrl;
    let tenantId;
    let clientId;
    let clientSecret;
    let scope;
    let subscriptionKey;
    if (envPrefix === 'IHCE_SANDBOX_') {
        baseUrl = firstEnv('IHCE_SANDBOX_BASE_URL', 'IHCE_API_BASE_URL', 'IHCE_BASE_URL');
        tenantId = firstEnv('IHCE_SANDBOX_TENANT_ID', 'IHCE_TENANT_ID');
        clientId = firstEnv('IHCE_SANDBOX_CLIENT_ID', 'IHCE_CLIENT_ID');
        clientSecret = firstEnv('IHCE_SANDBOX_CLIENT_SECRET', 'IHCE_CLIENT_SECRET');
        scope = firstEnv('IHCE_SANDBOX_SCOPE', 'IHCE_SCOPE');
        subscriptionKey = firstEnv(
            'IHCE_SANDBOX_SUBSCRIPTION_KEY',
            'IHCE_APIM_SUBSCRIPTION_KEY',
            'IHCE_SUBSCRIPTION_KEY',
            'OCP_APIM_SUBSCRIPTION_KEY',
        );
    } else {
        baseUrl = firstEnv('IHCE_PROD_BASE_URL', 'IHCE_API_BASE_URL_PROD');
        tenantId = firstEnv('IHCE_PROD_TENANT_ID');
        clientId = firstEnv('IHCE_PROD_CLIENT_ID');
        clientSecret = firstEnv('IHCE_PROD_CLIENT_SECRET');
        scope = firstEnv('IHCE_PROD_SCOPE');
        subscriptionKey = firstEnv('IHCE_PROD_SUBSCRIPTION_KEY', 'IHCE_APIM_SUBSCRIPTION_KEY_PROD');
    }

    const missing = [
        !baseUrl && 'BASE_URL',
        !tenantId && 'TENANT_ID',
        !clientId && 'CLIENT_ID',
        !clientSecret && 'CLIENT_SECRET',
        !scope && 'SCOPE',
        !subscriptionKey && 'SUBSCRIPTION_KEY',
    ].filter(Boolean);
    if (missing.length) {
        const hint =
            envPrefix === 'IHCE_SANDBOX_'
                ? ' Sandbox: IHCE_SANDBOX_* o IHCE_API_BASE_URL, IHCE_TENANT_ID, IHCE_CLIENT_ID, IHCE_CLIENT_SECRET, IHCE_SCOPE, IHCE_APIM_SUBSCRIPTION_KEY.'
                : ' Producción: IHCE_PROD_BASE_URL, IHCE_PROD_TENANT_ID, IHCE_PROD_CLIENT_ID, IHCE_PROD_CLIENT_SECRET, IHCE_PROD_SCOPE, IHCE_PROD_SUBSCRIPTION_KEY.';
        return res.status(500).json({
            ok: false,
            error: `Faltan variables de entorno IHCE (${missing.join(', ')}).${hint}`,
        });
    }

    const httpJson = (url, { method = 'GET', headers = {}, body = null } = {}) =>
        new Promise((resolve, reject) => {
            const u = new URL(url);
            const opts = {
                method,
                hostname: u.hostname,
                path: u.pathname + (u.search || ''),
                headers,
            };
            const req2 = https.request(opts, (resp) => {
                let data = '';
                resp.on('data', (chunk) => (data += chunk));
                resp.on('end', () => resolve({ status: resp.statusCode || 0, headers: resp.headers, body: data }));
            });
            req2.on('error', reject);
            if (body) req2.write(body);
            req2.end();
        });

    try {
        // 1) Obtener Bundle desde el endpoint interno (mismo backend)
        const localBase = `http://localhost:${process.env.BACK_PORT || process.env.PORT || 3000}`;
        const bundleResp = await new Promise((resolve, reject) => {
            const http = require('http');
            const bundleBody = { IdEvaluacionEntidadRDA: id, ambiente: effectiveAmb };
            if (overrideCodigoPrestador != null && String(overrideCodigoPrestador).trim()) {
                bundleBody.overrideCodigoPrestador = String(overrideCodigoPrestador).trim();
            }
            if (overrideNitPrestadorIPS != null && String(overrideNitPrestadorIPS).trim()) {
                bundleBody.overrideNitPrestadorIPS = String(overrideNitPrestadorIPS).trim();
            }
            if (overrideNombrePrestadorIPS != null && String(overrideNombrePrestadorIPS).trim()) {
                bundleBody.overrideNombrePrestadorIPS = String(overrideNombrePrestadorIPS).trim();
            }
            const payload = JSON.stringify(bundleBody);
            const req3 = http.request(
                `${localBase}/apiV3/RdaPaciente/FhirBundle`,
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
                (resp) => {
                    let data = '';
                    resp.on('data', (c) => (data += c));
                    resp.on('end', () => resolve({ status: resp.statusCode || 0, body: data }));
                }
            );
            req3.on('error', reject);
            req3.write(payload);
            req3.end();
        });
        if (bundleResp.status < 200 || bundleResp.status >= 300) {
            return res.status(500).json({ ok: false, error: `No se pudo construir el Bundle local (status ${bundleResp.status})`, details: bundleResp.body });
        }
        const bundle = JSON.parse(bundleResp.body);

        // IG IHCE RDA Paciente: sin Encounter en el documento; si llega (código viejo en memoria u otro build), quitarlo o BUNDLE-005.
        if (bundle && Array.isArray(bundle.entry)) {
            bundle.entry = bundle.entry.filter(
                (e) => !(e && e.resource && e.resource.resourceType === 'Encounter')
            );
            const compEntry = bundle.entry.find(
                (e) => e && e.resource && e.resource.resourceType === 'Composition'
            );
            if (compEntry && compEntry.resource && compEntry.resource.encounter != null) {
                delete compEntry.resource.encounter;
            }
        }

        const isModularEndpoint =
            /\/RdaPaciente\/(Json)?EnviarIHCE(Modular)$/i.test(req.path) ||
            /\/RdaPaciente\/IHCE\/(Preview|Enviar)PacienteAntecedentes(Modular)$/i.test(req.path);
        // Envío normal: incluir antecedentes guardados en BD. Flags modular solo para pruebas incrementales.
        const wantsObservations = isModularEndpoint && incluirObservations === true;
        const wantsConditions = !isModularEndpoint || incluirConditions === true;
        const wantsFamilyHistory = !isModularEndpoint || incluirFamilyHistory === true;
        const wantsAllergy = !isModularEndpoint || incluirAllergy === true;

        // Base estable: no enviar Observations salvo que el endpoint de prueba lo solicite.
        if (bundle && Array.isArray(bundle.entry) && !wantsObservations) {
            bundle.entry = bundle.entry.filter(
                (e) => !(e && e.resource && e.resource.resourceType === 'Observation')
            );

            const isObservationRef = (ref) => {
                const r = String(ref || '').trim();
                return /^#?Observation[\/-]/i.test(r);
            };
            const stripObservationRefs = (node) => {
                if (Array.isArray(node)) {
                    for (let i = node.length - 1; i >= 0; i -= 1) {
                        const item = node[i];
                        if (
                            item &&
                            typeof item === 'object' &&
                            typeof item.reference === 'string' &&
                            isObservationRef(item.reference)
                        ) {
                            node.splice(i, 1);
                        } else {
                            stripObservationRefs(item);
                        }
                    }
                    return;
                }
                if (!node || typeof node !== 'object') return;
                Object.keys(node).forEach((k) => stripObservationRefs(node[k]));
            };
            stripObservationRefs(bundle);
        }

        // Normalización IHCE (perfil CompositionPatientStatementRDA estricto).
        if (bundle && Array.isArray(bundle.entry)) {
            const entries = bundle.entry;
            const byType = (t) =>
                entries.filter((e) => e && e.resource && e.resource.resourceType === t);
            const keepTypes = new Set([
                'Composition',
                'Patient',
                'Practitioner',
                'Organization',
                'MedicationStatement',
            ]);
            if (wantsAllergy) keepTypes.add('AllergyIntolerance');
            if (wantsConditions) keepTypes.add('Condition');
            if (wantsFamilyHistory) keepTypes.add('FamilyMemberHistory');
            if (wantsObservations) keepTypes.add('Observation');

            // Quitar recursos que están fallando en esta versión del perfil.
            bundle.entry = entries.filter(
                (e) => e && e.resource && keepTypes.has(e.resource.resourceType)
            );

            const cleanRef = (r) => String(r || '').trim().replace(/^#/, '');
            const availableIds = new Set(
                bundle.entry
                    .map((e) => (e && e.resource && e.resource.id ? String(e.resource.id) : ''))
                    .filter(Boolean)
            );
            const filterExistingRefs = (refs) =>
                (Array.isArray(refs) ? refs : []).filter(
                    (x) => x && typeof x.reference === 'string' && availableIds.has(cleanRef(x.reference))
                );

            const compEntry = bundle.entry.find(
                (e) => e && e.resource && e.resource.resourceType === 'Composition'
            );
            if (compEntry && compEntry.resource) {
                const comp = compEntry.resource;

                bundle.language = 'es-CO';
                if (Object.prototype.hasOwnProperty.call(bundle, 'timestamp')) {
                    delete bundle.timestamp;
                }

                if (comp.date) {
                    comp.date = toFhirDateTimeColombia(comp.date) || comp.date;
                }
                if (comp.type && Object.prototype.hasOwnProperty.call(comp.type, 'text')) {
                    delete comp.type.text;
                }
                if (comp.custodian) {
                    comp.attester = [{ mode: 'legal', party: comp.custodian }];
                }

                // El perfil no permite event.code.text
                if (Array.isArray(comp.event)) {
                    comp.event.forEach((ev) => {
                        if (ev && ev.period) {
                            if (ev.period.start) {
                                ev.period.start = toFhirDateTimeColombia(ev.period.start) || ev.period.start;
                            }
                            if (ev.period.end) {
                                ev.period.end = toFhirDateTimeColombia(ev.period.end) || ev.period.end;
                            }
                        }
                        if (ev && Array.isArray(ev.code)) {
                            ev.code.forEach((c) => {
                                if (c && Object.prototype.hasOwnProperty.call(c, 'text')) {
                                    delete c.text;
                                }
                            });
                        }
                    });
                }

                const oldSections = Array.isArray(comp.section) ? comp.section : [];
                const getSectionRefs = (includesText) => {
                    const s = oldSections.find((x) =>
                        x && typeof x.title === 'string' && x.title.toLowerCase().includes(includesText)
                    );
                    return filterExistingRefs(s && s.entry);
                };

                const medicationsRefs = filterExistingRefs(
                    bundle.entry
                        .filter((e) => e && e.resource && e.resource.resourceType === 'MedicationStatement')
                        .map((e) => ({ reference: `#${e.resource.id}` }))
                );
                const allergiesRefs =
                    wantsAllergy
                        ? filterExistingRefs(
                            bundle.entry
                                .filter((e) => e && e.resource && e.resource.resourceType === 'AllergyIntolerance')
                                .map((e) => ({ reference: `#${e.resource.id}` }))
                        )
                        : getSectionRefs('alerg');
                const problemsRefs = wantsConditions
                    ? filterExistingRefs(
                        bundle.entry
                            .filter((e) => e && e.resource && e.resource.resourceType === 'Condition')
                            .map((e) => ({ reference: `#${e.resource.id}` }))
                    )
                    : [];
                const familyRefs = wantsFamilyHistory
                    ? filterExistingRefs(
                        bundle.entry
                            .filter((e) => e && e.resource && e.resource.resourceType === 'FamilyMemberHistory')
                            .map((e) => ({ reference: `#${e.resource.id}` }))
                    )
                    : [];
                const allergySectionRefs = wantsAllergy ? allergiesRefs : [];

                const mkSection = (code, codeDisplay, title, refs, emptyText) => ({
                    title,
                    code: {
                        coding: [
                            {
                                system: 'http://loinc.org',
                                code,
                                display: codeDisplay,
                            },
                        ],
                    },
                    ...(refs.length
                        ? { entry: refs }
                        : { text: { status: 'generated', div: `<div xmlns="http://www.w3.org/1999/xhtml">${emptyText}</div>` } }),
                });

                // 4 secciones exactas requeridas por el perfil (orden guía Ministerio)
                comp.section = [
                    mkSection(
                        '11450-4',
                        'Problem list - Reported',
                        'Historial de diagnósticos de problemas de salud',
                        problemsRefs,
                        'No se registran antecedentes patologicos'
                    ),
                    mkSection(
                        '48765-2',
                        'Allergies and adverse reactions Document',
                        'Historial de alergias, intolerancias y reacciones adversas',
                        allergySectionRefs,
                        'No se conocen alergias'
                    ),
                    mkSection(
                        '10160-0',
                        'History of Medication use Narrative',
                        'Historial de medicamentos',
                        medicationsRefs,
                        'Sin antecedentes farmacologicos'
                    ),
                    mkSection(
                        '10157-6',
                        'History of family member diseases Narrative',
                        'Historial de antecedentes familiares',
                        familyRefs,
                        'No se registran antecedentes familiares'
                    ),
                ];
            }

            bundle.entry.forEach((e) => {
                if (!e || !e.resource) return;
                if (e.resource.resourceType === 'MedicationStatement') {
                    e.resource.status = 'completed';
                    const mcc = e.resource.medicationCodeableConcept;
                    if (mcc && Array.isArray(mcc.coding) && mcc.coding.length && mcc.text) {
                        delete mcc.text;
                    }
                }
                if (e.resource.resourceType === 'AllergyIntolerance') {
                    const tipoCod = e.resource.code
                        && Array.isArray(e.resource.code.coding)
                        && e.resource.code.coding.find((c) => c && String(c.system || '').includes('TipoAlergia'));
                    if (tipoCod && tipoCod.code) {
                        const officialDisplay = resolveTipoAlergiaDisplay(tipoCod.code);
                        if (officialDisplay) tipoCod.display = officialDisplay;
                    }
                    const vs = e.resource.verificationStatus;
                    if (vs && Array.isArray(vs.coding)) {
                        vs.coding.forEach((c) => {
                            if (!c) return;
                            c.system = 'http://terminology.hl7.org/CodeSystem/condition-ver-status';
                            if (c.code === 'unconfirmed' && !c.display) c.display = 'Unconfirmed';
                        });
                    }
                }
                if (e.resource.resourceType === 'FamilyMemberHistory' && Array.isArray(e.resource.condition)) {
                    e.resource.condition.forEach((cond) => {
                        const code = cond && cond.code;
                        if (!code || !Array.isArray(code.coding)) return;
                        code.coding = code.coding.filter((c) => {
                            if (!c || !c.code) return false;
                            const sys = String(c.system || '');
                            if (sys.includes('icd-11') || classifyIcdCode(c.code) === 'icd-11') return false;
                            if (sys.includes('icd-10') && !isIcd10Code(c.code)) return false;
                            return true;
                        });
                        if (!code.coding.length) delete code.coding;
                    });
                }
            });

            // Patient.address.line no permitido por este perfil IHCE.
            byType('Patient').forEach((e) => {
                const p = e.resource;
                sanitizeOptionalPatientFields(p);
                if (p.birthDate) {
                    if (p._birthDate && Array.isArray(p._birthDate.extension)) {
                        p._birthDate.extension.forEach((ex) => {
                            if (!ex || !ex.url) return;
                            if (ex.url.includes('patient-birthTime') && ex.valueDateTime) {
                                ex.url = 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionBirthTime';
                                const vt = toFhirBirthTimeColombia(ex.valueDateTime);
                                delete ex.valueDateTime;
                                if (vt) ex.valueTime = vt;
                            }
                        });
                    }
                }
                if (Array.isArray(p.extension)) {
                    p.extension.forEach((ex) => {
                        if (
                            ex &&
                            ex.valueCoding &&
                            ex.valueCoding.system === 'https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661' &&
                            String(ex.valueCoding.code || '') === '170'
                        ) {
                            ex.valueCoding.display = 'Colombia';
                        }
                    });
                }
                if (Array.isArray(p.address)) {
                    p.address.forEach((a) => {
                        if (a && Object.prototype.hasOwnProperty.call(a, 'line')) {
                            delete a.line;
                        }
                        if (a && a._city && Array.isArray(a._city.extension)) {
                            a._city.extension.forEach((ex) => {
                                if (ex && ex.valueCoding && ex.valueCoding.code != null) {
                                    const norm = normalizeDivipolaMunicipalityCode(ex.valueCoding.code);
                                    if (norm) {
                                        ex.valueCoding.code = norm;
                                    } else {
                                        delete a._city;
                                    }
                                }
                            });
                            if (a._city && (!a._city.extension || !a._city.extension.length)) {
                                delete a._city;
                            }
                        }
                    });
                }
            });
        }

        applyEnvCustodianIfConfigured(bundle, effectiveAmb, {
            overrideCodigoPrestador,
            overrideNitPrestadorIPS,
            overrideNombrePrestadorIPS,
        });

        // Modo preview: devolver exactamente el JSON que se enviaría a IHCE.
        if (
            /\/RdaPaciente\/JsonEnviarIHCE($|Modular$)/i.test(req.path) ||
            /\/RdaPaciente\/IHCE\/PreviewPacienteAntecedentes($|Modular$)/i.test(req.path)
        ) {
            return res.json(bundle);
        }

        const requiredErr = validateRequiredForIhcePatientBundle(bundle);
        if (strictRequiredFields && requiredErr) {
            return res.status(400).json({
                ok: false,
                code: 'RDA_PACIENTE_VALIDACION_OBLIGATORIOS',
                error: `No se puede enviar a IHCE: ${requiredErr}`,
            });
        }

        // 2) Obtener token Entra (client_credentials) desde servicio compartido IHCE
        const tokenOut = await solicitarTokenIhceShared(ambiente === 'prod' ? 'prod' : 'sandbox');
        const accessToken = tokenOut.access_token;
        if (!accessToken) {
            return res.status(502).json({ ok: false, error: 'Token IHCE: respuesta sin access_token', details: tokenOut });
        }

        // 3) Enviar a IHCE
        const sendUrl = `${baseUrl.replace(/\/$/, '')}/Composition/$enviar-rda-paciente`;
        const sendBody = JSON.stringify(bundle);
        archiveRdaEnvioJson({
            bundle,
            bundleJson: sendBody,
            ambiente: effectiveAmb,
            tipo: 'paciente',
            idEvaluacion: id,
        });
        const sendResp = await httpJson(sendUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Content-Type': 'application/fhir+json',
                Accept: 'application/fhir+json',
                'Content-Length': Buffer.byteLength(sendBody),
            },
            body: sendBody,
        });

        const statusOk = sendResp.status >= 200 && sendResp.status < 300;
        await saveIhceTracePaciente({
            idEvaluacionEntidadRDA: id,
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
                await setRdaEnvioMarca({
                    pool,
                    sql,
                    kind: 'paciente',
                    id,
                    ambiente: isProd ? 'prod' : 'sandbox',
                    valor: RDA_ENVIO_OK,
                });
            } catch (dbErr) {
                console.error(
                    '❌ [RDA] IHCE aceptó el envío pero no se pudo marcar envío en BD:',
                    dbErr && dbErr.message ? dbErr.message : dbErr
                );
            }
        } else if (isIhceNoReenviableResponse(sendResp.body)) {
            try {
                const pool = await poolPromise;
                const isProd = envPrefix === 'IHCE_PROD_';
                await setRdaEnvioMarca({
                    pool,
                    sql,
                    kind: 'paciente',
                    id,
                    ambiente: isProd ? 'prod' : 'sandbox',
                    valor: RDA_ENVIO_NO_REENVIBLE,
                });
            } catch (dbErr) {
                console.error(
                    '❌ [RDA] No se pudo marcar RDA como no reenviable (Enviado*=2):',
                    dbErr && dbErr.message ? dbErr.message : dbErr
                );
            }
        }

        // Devolver lo que IHCE responde (útil para depurar OperationOutcome)
        return res.status(sendResp.status || 502).send(sendResp.body || '');
    } catch (error) {
        console.error('❌ [RDA] Error en EnviarIHCE:', error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
    }
    }
);

module.exports = router;
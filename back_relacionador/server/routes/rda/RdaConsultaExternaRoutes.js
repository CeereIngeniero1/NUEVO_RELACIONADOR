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
const {
    loadRdaceMedicationCatalogs,
    loadColombianTechModalityCatalog,
    resolveMedicationTimeFromRow,
    resolveDurationMedicationTimeFromRow,
    resolveUmmFromRow,
    resolveVadFromRow,
    isCompleteMedicationPrescriptionRow,
    validateMedicationDosageFromCatalogs,
    validatePrescripcionMedicamentoCatalogCodes,
} = require('../../rda/rdaFhirCatalogs');
const { patientGenderFromCatalog } = require('../../rda/patientGenderMap');
const {
    toFhirDateTimeColombia,
    normalizePatientBirthTimeExtension,
    normalizeDivipolaMunicipalityCode,
    buildRdaPersonName,
} = require('../../rda/fhirColombiaFormat');
const {
    resolvePrestadorForIhce,
    applyEnvCustodianIfConfigured,
    normalizeIhceAmbiente,
} = require('../../rda/rdaBundleIpsHelpers');
const {
    buildNationalPersonIdentifier,
    PersonIdentifierDisplayError,
    normalizeDocTypeCode,
} = require('../../rda/colombianPersonIdentifierCatalog');

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

function validateRequiredForIhceCeBundle(bundle, options = {}) {
    const medicationTimeCatalog = options.medicationTimeCatalog || null;
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

    const cupsSystem = 'https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS';
    const SCT = 'http://snomed.info/sct';
    const sections = Array.isArray(composition.section) ? composition.section : [];
    const sectionByLoinc = (loinc) => sections.find((s) =>
        s &&
        s.code &&
        Array.isArray(s.code.coding) &&
        s.code.coding.some((c) => String(c && c.code ? c.code : '').trim() === loinc)
    );

    if (entries.some((e) => e && e.resource && e.resource.resourceType === 'FamilyMemberHistory')) {
        return 'RDA Consulta Externa no permite FamilyMemberHistory en el bundle.';
    }

    const encounterEntry = entries.find((e) => e && e.resource && e.resource.resourceType === 'Encounter');
    const encounter = encounterEntry && encounterEntry.resource;
    if (!encounter) {
        return 'Falta recurso Encounter (EncounterAmbulatoryRDA).';
    }
    if (encounter && Array.isArray(encounter.diagnosis)) {
        if (encounter.diagnosis.length > 1) {
            return 'Encounter.diagnosis debe contener solo el diagnóstico principal (Condition-0).';
        }
        const mainRef = encounter.diagnosis[0]
            && encounter.diagnosis[0].condition
            && encounter.diagnosis[0].condition.reference;
        if (mainRef && refIdFromBundleReference(mainRef) !== 'Condition-0') {
            return 'Encounter.diagnosis[0] debe referenciar Condition-0.';
        }
    }

    const svcType = encounter.serviceType;
    const svcCoding = svcType && Array.isArray(svcType.coding) ? svcType.coding[0] : null;
    const svcSystem = svcCoding && svcCoding.system != null ? String(svcCoding.system).trim() : '';
    const svcCode = svcCoding && svcCoding.code != null ? String(svcCoding.code).trim() : '';
    if (!svcCoding || svcSystem !== cupsSystem || !svcCode) {
        return 'Encounter.serviceType requiere un código CUPS (system https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS). '
            + 'No use GrupoServicios en serviceType: el grupo RIPS va en type[1]=01 solo para el perfil RDA CE; '
            + 'el procedimiento CUPS va en prescripción de procedimientos o en el RIPS de la historia clínica.';
    }

    const allergyCount = entries.filter((e) => e && e.resource && e.resource.resourceType === 'AllergyIntolerance').length;
    const riskCount = entries.filter((e) => e && e.resource && e.resource.resourceType === 'RiskAssessment').length;
    const svcCount = entries.filter((e) => e && e.resource && e.resource.resourceType === 'ServiceRequest').length;

    const allergySection = sectionByLoinc('48765-2');
    const riskSection = sectionByLoinc('75492-9');
    const svcSection = sectionByLoinc('61146-1');

    if (allergyCount > 0 && allergySection && allergySection.emptyReason) {
        return 'La sección de alergias no puede tener emptyReason si existe AllergyIntolerance en el bundle.';
    }
    if (allergyCount === 0 && allergySection && Array.isArray(allergySection.entry) && allergySection.entry.length > 0) {
        return 'La sección de alergias tiene entry pero no hay AllergyIntolerance en el bundle.';
    }
    if (riskCount > 0 && riskSection && riskSection.emptyReason) {
        return 'La sección de factores de riesgo no puede tener emptyReason si existe RiskAssessment en el bundle.';
    }
    if (riskCount === 0 && riskSection && Array.isArray(riskSection.entry) && riskSection.entry.length > 0) {
        return 'La sección de factores de riesgo tiene entry pero no hay RiskAssessment en el bundle.';
    }
    if (svcCount > 0 && svcSection && svcSection.emptyReason) {
        return 'La sección de órdenes no puede tener emptyReason si existe ServiceRequest en el bundle.';
    }
    if (svcCount === 0 && svcSection && Array.isArray(svcSection.entry) && svcSection.entry.length > 0) {
        return 'La sección de órdenes tiene entry pero no hay ServiceRequest en el bundle.';
    }

    const badSvc = entries.find((e) => {
        const r = e && e.resource;
        if (!r || r.resourceType !== 'ServiceRequest') return false;
        if (!r.requester) return true;
        if (!r.authoredOn) return true;
        if (!Array.isArray(r.reasonCode) || r.reasonCode.length === 0) return true;
        const codings = r.code && Array.isArray(r.code.coding) ? r.code.coding : [];
        const hasCups = codings.some((c) =>
            String(c && c.system ? c.system : '').trim() === cupsSystem && String(c && c.code ? c.code : '').trim()
        );
        const hasSnomed = codings.some((c) =>
            String(c && c.system ? c.system : '').trim() === SCT && String(c && c.code ? c.code : '').trim()
        );
        return !hasCups && !hasSnomed;
    });
    if (badSvc) {
        return 'ServiceRequestRDA incompleto: requiere requester, reasonCode, authoredOn y código CUPS o SNOMED válido.';
    }

    if (riskCount > 0) {
        const badRisk = entries.find((e) => {
            const r = e && e.resource;
            return r && r.resourceType === 'RiskAssessment' && (!r.encounter || !r.subject || !r.code);
        });
        if (badRisk) {
            return 'RiskAssessment incompleto: requiere encounter, subject y code.';
        }
    }

    const diagSection = sectionByLoinc('11450-4');
    const conditionCount = entries.filter((e) => e && e.resource && e.resource.resourceType === 'Condition').length;
    if (diagSection && Array.isArray(diagSection.entry) && diagSection.entry.length !== conditionCount) {
        return 'La sección Historial de diagnósticos debe referenciar exactamente las Condition del bundle.';
    }

    if (entries.some((e) => e && e.resource && e.resource.resourceType === 'MedicationStatement')) {
        return 'RDA Consulta Externa no permite MedicationStatement: use MedicationRequestRDA.';
    }

    const hasIcd11Condition = entries.some((e) => {
        const r = e && e.resource;
        if (!r || r.resourceType !== 'Condition') return false;
        const codings = r.code && Array.isArray(r.code.coding) ? r.code.coding : [];
        return codings.some((c) => String(c && c.system ? c.system : '').trim() === 'http://hl7.org/fhir/sid/icd-11');
    });
    if (hasIcd11Condition) {
        return 'ConditionRDA en RDACE debe usar CIE-10; no envíe codificaciones ICD-11 en Condition.';
    }

    const idSet = new Set(
        entries
            .map((e) => e && e.resource && String(e.resource.id || '').trim())
            .filter(Boolean)
    );

    const refs = [];
    const collectRefs = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            node.forEach(collectRefs);
            return;
        }
        if (typeof node.reference === 'string' && node.reference.trim().startsWith('#')) {
            refs.push(node.reference.trim().slice(1));
        }
        Object.keys(node).forEach((k) => collectRefs(node[k]));
    };
    collectRefs(bundle);
    const missingRef = refs.find((rid) => !idSet.has(rid));
    if (missingRef) {
        return `Reference #${missingRef} no existe en Bundle.entry.resource.id.`;
    }

    const medsSection = sectionByLoinc('10160-0');
    const medReqCount = entries.filter((e) => e && e.resource && e.resource.resourceType === 'MedicationRequest').length;

    if (sections.some((s) =>
        s &&
        s.code &&
        Array.isArray(s.code.coding) &&
        s.code.coding.some((c) => String(c && c.code ? c.code : '').trim() === '10157-6')
    )) {
        return 'CompositionAmbulatoryRDA no admite la sección Historial de antecedentes familiares (10157-6).';
    }

    if (medReqCount > 0 && (!medsSection || !Array.isArray(medsSection.entry) || medsSection.entry.length === 0)) {
        return 'Hay MedicationRequest en el bundle, pero la sección de Historial de medicamentos no tiene entry.';
    }
    if (medReqCount === 0 && medsSection && Array.isArray(medsSection.entry) && medsSection.entry.length > 0) {
        return 'La sección de Historial de medicamentos tiene entry pero no hay MedicationRequest en el bundle.';
    }

    const medReqInvalid = entries.find((e) => {
        const r = e && e.resource;
        if (!r || r.resourceType !== 'MedicationRequest') return false;
        if (!r.subject || !r.encounter || !r.requester || !r.authoredOn) return true;
        if (!Array.isArray(r.reasonCode) || r.reasonCode.length === 0) return true;
        if (!Array.isArray(r.dosageInstruction) || r.dosageInstruction.length === 0) return true;
        const di = r.dosageInstruction[0];
        const routeOk = di && di.route && Array.isArray(di.route.coding) && di.route.coding.length > 0;
        const timing = di && di.timing;
        const repeat = timing && timing.repeat;
        const dar = di && Array.isArray(di.doseAndRate) ? di.doseAndRate[0] : null;
        return !(
            routeOk &&
            repeat && repeat.duration != null && repeat.durationUnit &&
            timing.code &&
            dar && dar.doseQuantity && dar.rateQuantity
        );
    });
    if (medReqInvalid) {
        return 'MedicationRequestRDA incompleto: requiere reasonCode, dosageInstruction, subject, encounter, requester y authoredOn.';
    }

    const medTimeInvalid = entries.find((e) => {
        const r = e && e.resource;
        if (!r || r.resourceType !== 'MedicationRequest') return false;
        const di = Array.isArray(r.dosageInstruction) ? r.dosageInstruction[0] : null;
        const err = validateMedicationDosageFromCatalogs(di, options.medicationCatalogs || {});
        return Boolean(err);
    });
    if (medTimeInvalid) {
        const di = medTimeInvalid.resource.dosageInstruction[0];
        const err = validateMedicationDosageFromCatalogs(di, options.medicationCatalogs || {});
        return err || 'MedicationRequest dosageInstruction inválido respecto a catálogos BD.';
    }

    const badSection = sections.find((s) => Array.isArray(s && s.entry) && s.entry.length > 0 && s.emptyReason);
    if (badSection) {
        return 'Una sección Composition contiene entry y emptyReason al mismo tiempo, lo cual es inválido.';
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

const parseCodeDisplayFromText = (raw) => {
    const s = raw != null ? String(raw).trim() : '';
    if (!s) return { code: null, display: null };
    const m = s.match(/^([A-Za-z0-9.]+)\s*[-:]\s*(.+)$/);
    if (m) return { code: m[1].trim(), display: m[2].trim() || null };
    return { code: s, display: null };
};

const cleanMipresInnDisplay = (raw) => {
    const s = raw != null ? String(raw).trim() : '';
    if (!s) return null;
    return s.replace(/\s*\([^)]*\)\s*$/g, '').trim() || null;
};

/** Prescripción CE completa solo si todos los catálogos FHIR resuelven desde BD. */
const isCompleteMedicationPrescription = (m, catalogs) => isCompleteMedicationPrescriptionRow(m, catalogs);

const refIdFromBundleReference = (reference) => {
    const raw = String(reference || '').trim();
    if (!raw) return '';
    if (raw.startsWith('#')) return raw.slice(1);
    const m = raw.match(/^[A-Za-z]+\/(.+)$/);
    return m ? m[1] : raw;
};

const parseIcd10FromText = (raw) => {
    const s = raw != null ? String(raw).trim() : '';
    if (!s) return { code: null, display: null };

    const cie10Slice = s.match(/CIE\s*-\s*10\s*:\s*([^|]+)/i);
    const source = cie10Slice ? String(cie10Slice[1] || '').trim() : s;
    const matchCode = source.match(/\b([A-TV-Z][0-9][0-9A-Z]{1,3})\b/i);
    if (!matchCode) return { code: null, display: null };

    const code = String(matchCode[1] || '').toUpperCase();
    const after = source.slice(matchCode.index + matchCode[0].length).trim();
    const cleaned = after.replace(/^[-:]\s*/, '').trim();
    return { code, display: cleaned || null };
};

const parseParentescoFromText = (raw) => {
    const s = raw != null ? String(raw).trim() : '';
    if (!s) return { code: null, display: null };
    const m = s.match(/^(\d{1,2})\s*[-:]\s*(.+)$/);
    if (m) return { code: String(parseInt(m[1], 10)).padStart(2, '0'), display: m[2].trim() || null };
    if (/^\d{1,2}$/.test(s)) return { code: String(parseInt(s, 10)).padStart(2, '0'), display: null };
    return { code: null, display: s };
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
        NotasAdicionalesPdf,
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
            .input('NotasAdicionalesPdf', sql.NVarChar(sql.MAX), NotasAdicionalesPdf || null)
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
                    [Nombre Documento PDF], [Notas Adicionales PDF],
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
                    @NombreDocumentoPDF, @NotasAdicionalesPdf,
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
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Parentesco, Descripcion, IdEstado, CIE11Codigo, CIE11Termino } = req.body;
    const descripcionFinal = (() => {
        const d = Descripcion != null ? String(Descripcion).trim() : '';
        if (d) return d;
        const c11 = CIE11Codigo != null ? String(CIE11Codigo).trim() : '';
        const t11 = CIE11Termino != null ? String(CIE11Termino).trim() : '';
        if (c11 && t11) return `${c11} - ${t11}`;
        if (c11) return c11;
        if (t11) return t11;
        return 'Sin descripción';
    })();
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Parentesco', sql.NVarChar, Parentesco || null)
            .input('Descripcion', sql.NVarChar, descripcionFinal)
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
        const medicationCatalogs = await loadRdaceMedicationCatalogs(pool);
        const catalogErr = validatePrescripcionMedicamentoCatalogCodes(
            { via, unidadDosis, duracionUnid, frecuenciaUnid },
            medicationCatalogs
        );
        if (catalogErr) {
            return res.status(400).json({ ok: false, error: catalogErr });
        }
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
    UnidadTiempoDuracion:        '[Cnsta Unidad tiempo duracion 1888]',
    UnidadTiempoFrecuencia:      '[Cnsta Unidad tiempo frecuencia 1888]',
    FinalidadTecnologiaSalud:    '[Cnsta Finalidad tecnologia salud 1888]',
    OtraTecnologiaCategoria:     '[Cnsta Otra tecnologia categoria 1888]',
    AlcanceIncapacidad:          '[Cnsta Alcance incapacidad 1888]',
};

router.get('/Catalogo1888/:clave', async (req, res) => {
    const clave = req.params.clave;
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    if (clave === 'MedicationTime') {
        try {
            const pool = await poolPromise;
            const sqlBase = `
                SELECT
                    codigo AS Codigo,
                    display AS Descripcion,
                    system_url AS SystemUrl,
                    fhir_duration_unit AS FhirDurationUnit,
                    id_estado AS IdEstado
                FROM dbo.VW_RDA_MedicationTime_Activos
            `;
            if (!q) {
                const result = await pool.request().query(`${sqlBase} ORDER BY TRY_CAST(codigo AS INT), codigo`);
                return res.json(result.recordset);
            }
            const result = await pool.request()
                .input('Busqueda', sql.VarChar, '%' + q + '%')
                .query(`${sqlBase} WHERE display LIKE @Busqueda OR CAST(codigo AS NVARCHAR(50)) LIKE @Busqueda ORDER BY TRY_CAST(codigo AS INT), codigo`);
            return res.json(result.recordset);
        } catch (error) {
            console.error('❌ Error catálogo MedicationTime:', error);
            if (!res.headersSent) res.status(500).send('Error interno del servidor');
            return;
        }
    }
    if (clave === 'UMM') {
        try {
            const pool = await poolPromise;
            const sqlBase = `
                SELECT codigo AS Codigo, display AS Descripcion, unidad AS Unidad, system_url AS SystemUrl, id_estado AS IdEstado
                FROM dbo.VW_RDA_UMM_Activos
            `;
            if (!q) {
                const result = await pool.request().query(`${sqlBase} ORDER BY codigo`);
                return res.json(result.recordset);
            }
            const result = await pool.request()
                .input('Busqueda', sql.VarChar, '%' + q + '%')
                .query(`${sqlBase} WHERE display LIKE @Busqueda OR unidad LIKE @Busqueda OR CAST(codigo AS NVARCHAR(50)) LIKE @Busqueda ORDER BY codigo`);
            return res.json(result.recordset);
        } catch (error) {
            console.error('❌ Error catálogo UMM:', error);
            if (!res.headersSent) res.status(500).send('Error interno del servidor');
            return;
        }
    }
    if (clave === 'VAD') {
        try {
            const pool = await poolPromise;
            const sqlBase = `
                SELECT codigo AS Codigo, display AS Descripcion, system_url AS SystemUrl, id_estado AS IdEstado
                FROM dbo.VW_RDA_ViaAdministracion_Activos
            `;
            if (!q) {
                const result = await pool.request().query(`${sqlBase} ORDER BY codigo`);
                return res.json(result.recordset);
            }
            const result = await pool.request()
                .input('Busqueda', sql.VarChar, '%' + q + '%')
                .query(`${sqlBase} WHERE display LIKE @Busqueda OR CAST(codigo AS NVARCHAR(50)) LIKE @Busqueda ORDER BY codigo`);
            return res.json(result.recordset);
        } catch (error) {
            console.error('❌ Error catálogo VAD:', error);
            if (!res.headersSent) res.status(500).send('Error interno del servidor');
            return;
        }
    }
    const viewName = RDACE_CATALOGOS_1888[clave];
    if (!viewName) return res.status(404).json({ error: 'Catálogo no encontrado', clave: clave });
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
    const toFhirDtCo    = (v) => toFhirDateTimeColombia(v) || toIsoDateTime(v);

    const RDA_SD       = 'https://fhir.minsalud.gov.co/rda/StructureDefinition';
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
    const LICENSE_SCOPE_DISPLAY = Object.freeze({
        '01': 'Nueva',
        '02': 'Prórroga',
    });
    const licenseScopeDisplayFromCode = (code, fallback) => {
        const c = str(code).trim();
        if (!c) return str(fallback) || undefined;
        return LICENSE_SCOPE_DISPLAY[c] || str(fallback) || c;
    };
    const CS_RIPS_FINALIDAD = 'https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSFinalidadConsultaVersion2';
    const CS_COLOMBIAN_HT_CAT = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianHealthTechnologyCategory';
    const CS_MIPRES_INN = 'https://fhir.minsalud.gov.co/rda/CodeSystem/MipresINN';
    const CS_REPS_HC_SVC = 'https://fhir.minsalud.gov.co/rda/CodeSystem/REPShealthcareServices';
    const CS_VIA_INGRESO = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ViaIngreso';
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
    const patientGenderFromDb = (pdem) => patientGenderFromCatalog({
        codigoSexo: str(pdem.CodigoSexo),
        letraSexo: str(pdem.SexoPaciente),
        descripcionSexo: str(pdem.Sexo),
    });
    const ICD10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10';
    const ICD11_SYSTEM = 'http://hl7.org/fhir/sid/icd-11';

    /** ConditionRDA: un solo sistema por recurso (no mezclar CIE-10 y CIE-11 en el mismo coding). */
    const buildConditionRdaCode = ({ cie10Code, cie10Display, cie11Code, cie11Display }) => {
        const c10 = str(cie10Code);
        const d10 = str(cie10Display);
        const c11 = str(cie11Code);
        const d11 = str(cie11Display);
        if (c10) {
            return {
                coding: [{ system: ICD10_SYSTEM, code: c10, display: d10 || undefined }],
                text: d10 || c10,
            };
        }
        if (c11) {
            return {
                coding: [{ system: ICD11_SYSTEM, code: c11, display: d11 || undefined }],
                text: d11 || c11,
            };
        }
        return null;
    };

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
        const antecedentesSalud = aggregate.antecedentesSalud || [];
        // Antecedentes familiares y farmacológicos: persistidos en BD para UI/PDF;
        // no se incluyen como FamilyMemberHistory ni MedicationRequest en RDA CE (slicing cerrado).
        const empresaIps = aggregate.empresaIps || null;
        const reqBody = req.body || {};
        const { loadDotEnvFromCandidates } = require('../../config/envLoader');
        loadDotEnvFromCandidates();
        const ihceAmb = normalizeIhceAmbiente(reqBody.ambiente);
        const prestadorIps = resolvePrestadorForIhce(ihceAmb, {
            overrideCodigoPrestador: reqBody.overrideCodigoPrestador,
            overrideNitPrestadorIPS: reqBody.overrideNitPrestadorIPS,
            overrideNombrePrestadorIPS: reqBody.overrideNombrePrestadorIPS,
            codigoPrestador: head.CodigoPrestador,
            nitPrestadorIPS: empresaIps && empresaIps.DocumentoEmpresa,
            nombrePrestadorIPS:
                (empresaIps && (empresaIps.RazonSocialEmpresa || empresaIps.NombreComercialEmpresa))
                || null,
        });
        const codPrest = prestadorIps.reps;
        const nitIpsResolved = prestadorIps.nit;
        const nomIpsResolved = prestadorIps.name;

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
        const repsPeriodFromDb = empresaIps && empresaIps.FechaInscripcionEmpresa
            ? toIsoDate(empresaIps.FechaInscripcionEmpresa)
            : null;
        const repsPeriodStart = repsPeriodFromDb
            || str(process.env.IHCE_RDACE_DEFAULT_REPS_PERIOD_START)
            || '2011-11-30';
        const ipsMunicipioFromDb = normalizeDivipolaMunicipalityCode(
            empresaIps && empresaIps.CodigoMunicipioDivipola
        );
        const ipsMunicipioCode = ipsMunicipioFromDb
            || str(process.env.IHCE_RDACE_DEFAULT_DIVIPOLA_MUNICIPIO)
            || '05001';
        const ipsDeptCode = ipsMunicipioFromDb
            ? ipsMunicipioFromDb.slice(0, 2)
            : (str(process.env.IHCE_RDACE_DEFAULT_DIVIPOLA_DEPTO) || '05');
        const ipsCityDisplay = str(empresaIps && empresaIps.NombreMunicipio)
            || (ipsMunicipioCode === '05001' ? 'MEDELLÍN' : ipsMunicipioCode);
        const nombreIps = codPrest ? (
            nomIpsResolved
            || str(empresaIps && empresaIps.RazonSocialEmpresa)
            || str(empresaIps && empresaIps.NombreComercialEmpresa)
            || `IPS (${codPrest})`
        ) : '';
        let ipsOrgEntry = null;
        if (codPrest) {
            const nitIps = nitIpsResolved
                || str(empresaIps && empresaIps.DocumentoEmpresa)
                || null;
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
                    city: ipsCityDisplay,
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
        const docTypeCode  = normalizeDocTypeCode(pdem.TipoDocumentoBase);
        const docTypeDisplayBd = str(pdem.DescripciTipoDocumento);
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
            if (str(pdem.Direccion)) addr.line = [str(pdem.Direccion)];
            if (str(pdem.NombreMunicipio)) {
                addr.city = str(pdem.NombreMunicipio);
                const divipola = normalizeDivipolaMunicipalityCode(pdem.CodigoMunicipio);
                if (divipola) {
                    addr._city = {
                        extension: [{
                            url: `${RDA_SD}/ExtensionDivipolaMunicipality`,
                            valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/DIVIPOLA', code: divipola },
                        }],
                    };
                }
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
        const patientResource = {
            resourceType: 'Patient',
            id: pacienteId,
            meta: { profile: [`${RDA_SD}/PatientRDA`] },
            ...(patExt.length > 0 ? { extension: patExt } : {}),
            ...(docPac && docTypeCode
                ? { identifier: [buildNationalPersonIdentifier({ docTypeCode, value: docPac, displayFromBd: docTypeDisplayBd })] }
                : {}),
            active: true,
            ...(familyText || givenArr.length > 0 ? { name: [{ use: 'official', ...(familyText ? { family: familyText } : {}), ...(familyExtArr.length > 0 ? { _family: { extension: familyExtArr } } : {}), ...(givenArr.length > 0 ? { given: givenArr } : {}) }] } : {}),
            ...(fhirGender ? { gender: fhirGender } : {}),
            ...(bioGender  ? { _gender: { extension: [{ url: `${RDA_SD}/ExtensionBiologicalGender`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderGroup', code: bioGender.code, display: bioGender.display } }] } } : {}),
            ...(toIsoDate(pdem.FechaNacimiento) ? { birthDate: toIsoDate(pdem.FechaNacimiento) } : {}),
            deceasedBoolean: false,
            ...(str(pdem.TelefonoCelular) ? { telecom: [{ system: 'phone', value: str(pdem.TelefonoCelular) }] } : {}),
            ...(homeAddr    ? { address: [homeAddr] } : {}),
            ...(eapbOrgEntry ? { managingOrganization: { reference: refOf(eapbOrgEntry), display: str(head.NombreAdminPlanBeneficios) || undefined } } : {}),
        };
        normalizePatientBirthTimeExtension(patientResource, pdem.FechaNacimiento);
        const patientEntry = makeEntry(patientResource);

        // Practitioner
        const tipoProf = normalizeDocTypeCode(head.TipoDocProfesional);
        const numProf  = str(head.NumDocProfesional);
        const practId  = tipoProf && numProf ? `${tipoProf}-${numProf}` : null;
        if (!practId) {
            return res.status(400).json({ ok: false, error: 'Faltan tipo y número de documento del profesional en base de datos' });
        }
        const profName = buildRdaPersonName({
            primerApellido: head.ProfPrimerApellido,
            segundoApellido: head.ProfSegundoApellido,
            primerNombre: head.ProfPrimerNombre,
            segundoNombre: head.ProfSegundoNombre,
        });
        const practitionerEntry = makeEntry({
            resourceType: 'Practitioner',
            id: practId,
            meta: { profile: [`${RDA_SD}/PractitionerRDA`] },
            identifier: [buildNationalPersonIdentifier({ docTypeCode: tipoProf, value: numProf })],
            ...(profName ? { name: [profName] } : {}),
            active: true,
        });
        const practitionerRef = { reference: refOf(practitionerEntry) };

        // Condition principal (solo CIE-10) + antecedentes de salud/relacionados como Conditions adicionales.
        let conditionSeq = 0;
        const principalCode = buildConditionRdaCode({
            cie10Code: head.DiagPrincipalCIE10Codigo,
            cie10Display: head.DiagPrincipalCIE10Nombre,
        });
        let condPrincipalEntry = principalCode ? makeEntry({
            resourceType: 'Condition',
            id: `Condition-${conditionSeq++}`,
            meta: { profile: [`${RDA_SD}/ConditionRDA`] },
            ...CONDITION_RDA_BASE,
            subject: { reference: refOf(patientEntry) },
            code: principalCode,
        }) : null;

        // Diagnósticos relacionados (solo CIE-10 para ConditionRDA).
        const condRelacionadasEntries = diagRelacionados.map((r) => {
            const code = buildConditionRdaCode({
                cie10Code: r.CodigoCIE10,
                cie10Display: r.NombreCIE10,
            });
            if (!code) return null;
            return makeEntry({
                resourceType: 'Condition',
                id: `Condition-${conditionSeq++}`,
                meta: { profile: [`${RDA_SD}/ConditionRDA`] },
                ...CONDITION_RDA_BASE,
                subject: { reference: refOf(patientEntry) },
                code,
            });
        }).filter(Boolean);

        const condAntecedentesSaludEntries = antecedentesSalud.map((a) => {
            const parsed = parseIcd10FromText(a && a.Descripcion);
            if (!parsed.code) return null;
            return makeEntry({
                resourceType: 'Condition',
                id: `Condition-${conditionSeq++}`,
                meta: { profile: [`${RDA_SD}/ConditionRDA`] },
                ...CONDITION_RDA_BASE,
                subject: { reference: refOf(patientEntry) },
                code: {
                    coding: [{
                        system: 'http://hl7.org/fhir/sid/icd-10',
                        code: parsed.code,
                        display: parsed.display || undefined,
                    }],
                    text: parsed.display || parsed.code,
                },
            });
        }).filter(Boolean);

        // AllergyIntoleranceRDA (CE): sin verificationStatus; encounter obligatorio en guía.
        const tipoAlergiaCode = str(head.TipoAlergia);
        const allergyEntry   = tipoAlergiaCode ? makeEntry({
            resourceType: 'AllergyIntolerance',
            id: 'AllergyIntolerance-0',
            meta: { profile: [`${RDA_SD}/AllergyIntoleranceRDA`] },
            clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active', display: 'Active' }] },
            code: {
                coding: [{
                    system: CS_TIPO_ALERGIA,
                    code: tipoAlergiaCode,
                    display: str(head.NombreTipoAlergia) || undefined,
                }],
                text: str(head.NombreTipoAlergia) || tipoAlergiaCode,
            },
            patient: { reference: refOf(patientEntry) },
            encounter: { reference: refOf('Encounter-0', 'Encounter') },
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

        const authoredOnFromHead = toFhirDtCo(head.FechaRDA)
            || toFhirDtCo(head.FechaHoraInicioAtencion)
            || toFhirDtCo(head.FechaHoraFinAtencion);

        const medicationCatalogs = await loadRdaceMedicationCatalogs(pool);
        let colombianTechModalityCatalog = null;

        const defaultMedReasonCodeable = () => {
            const code = str(process.env.IHCE_RDACE_DEFAULT_MED_FINALIDAD_CODE) || '21';
            const display = str(process.env.IHCE_RDACE_DEFAULT_MED_FINALIDAD_DISPLAY)
                || 'ATENCION BASICA DE ORIENTACION FAMILIAR';
            return codeableFromDb(CS_RIPS_FINALIDAD, code, display);
        };
        const resolveMedicationReasonCodeable = (m) =>
            ripsFinalidadCodeable(m.FinalidadCodigo, m.FinalidadDescripcion, m.Finalidad)
            || defaultMedReasonCodeable();
        const buildMedicationDosageInstruction = (m) => {
            const medTime = resolveMedicationTimeFromRow(m, medicationCatalogs.medicationTime);
            const durTime = resolveDurationMedicationTimeFromRow(m, medicationCatalogs.medicationTime);
            const umm = resolveUmmFromRow(m, medicationCatalogs.umm);
            const vad = resolveVadFromRow(m, medicationCatalogs.vad);
            if (!medTime || !durTime || !umm || !vad) return null;
            if (!durTime.fhir_duration_unit) return null;

            const durCant = str(m.DuracionCantidad);
            const dosisRaw = str(m.DosisOrdenada);
            const doseValue = dosisRaw != null ? parseFloat(dosisRaw) : NaN;
            const freqRaw = str(m.FrecuenciaCantidad);
            const rateValue = freqRaw != null ? parseFloat(freqRaw) : NaN;
            if (!durCant || isNaN(doseValue) || isNaN(rateValue)) return null;

            return {
                route: {
                    coding: [{
                        system: vad.system_url,
                        code: vad.codigo,
                        display: vad.display || undefined,
                    }],
                },
                timing: {
                    repeat: {
                        duration: parseFloat(durCant),
                        durationUnit: durTime.fhir_duration_unit,
                    },
                    code: {
                        coding: [{
                            system: medTime.system_url,
                            code: medTime.codigo,
                            display: medTime.display || undefined,
                        }],
                    },
                },
                doseAndRate: [{
                    doseQuantity: {
                        value: doseValue,
                        unit: umm.unidad || umm.display || umm.codigo,
                        system: umm.system_url,
                        code: umm.codigo,
                    },
                    rateQuantity: {
                        value: rateValue,
                        unit: medTime.display || medTime.codigo,
                        system: medTime.system_url,
                        code: medTime.codigo,
                    },
                }],
            };
        };

        const medicationSourceRows = medPrescripciones
            .map((m) => ({
                CodigoMedicamento: m.CodigoMedicamento,
                NombreMedicamento: m.NombreMedicamento,
                DCI: m.DCI,
                FechaPrescripcion: m.FechaPrescripcion,
                DosisOrdenada: m.DosisOrdenada,
                UnidadDosisCodigo: m.UnidadDosisCodigo,
                UnidadDosisDescripcion: m.UnidadDosisDescripcion,
                ViaAdministracion: m.ViaAdministracion,
                ViaAdministracionCodigo: m.ViaAdministracionCodigo,
                ViaAdministracionDescripcion: m.ViaAdministracionDescripcion,
                DuracionCantidad: m.DuracionCantidad,
                DuracionUnidad: m.DuracionUnidad,
                DuracionUnidadCodigo: m.DuracionUnidadCodigo,
                FrecuenciaCantidad: m.FrecuenciaCantidad,
                FrecuenciaUnidadCodigo: m.FrecuenciaUnidadCodigo,
                FrecuenciaUnidadDescripcion: m.FrecuenciaUnidadDescripcion,
                FrecuenciaMedicationTimeCodigo: m.FrecuenciaMedicationTimeCodigo,
                FrecuenciaMedicationTimeDisplay: m.FrecuenciaMedicationTimeDisplay,
                FrecuenciaUnidad: m.FrecuenciaUnidad,
                FinalidadCodigo: m.FinalidadCodigo,
                FinalidadDescripcion: m.FinalidadDescripcion,
                Finalidad: m.Finalidad,
                reportedBoolean: false,
            }))
            .filter((m) => isCompleteMedicationPrescription(m, medicationCatalogs));

        const mipresCatalog = {};
        const medCodesUnique = [...new Set(medicationSourceRows.map((m) => str(m.CodigoMedicamento)).filter(Boolean))];
        if (medCodesUnique.length) {
            for (const code of medCodesUnique) {
                const catRes = await pool.request()
                    .input('Codigo', sql.VarChar(20), code)
                    .query(`
                        SELECT TOP 1 Codigo, Descripcion
                        FROM [dbo].[Cnsta Medicamentos DCI 1888]
                        WHERE LTRIM(RTRIM(Codigo)) = LTRIM(RTRIM(@Codigo))
                    `);
                const row = catRes.recordset && catRes.recordset[0];
                if (row && row.Descripcion) {
                    mipresCatalog[String(row.Codigo).trim()] = String(row.Descripcion).trim();
                }
            }
        }
        const resolveMipresDisplay = (code, rawDisplay) => {
            const key = str(code);
            if (key && mipresCatalog[key]) return mipresCatalog[key];
            const cleaned = cleanMipresInnDisplay(rawDisplay);
            if (cleaned) return cleaned;
            return key;
        };

        // MedicationRequestRDA — solo si hay medicamentos; sección 10160-0 usa emptyReason si no hay ninguno.
        let medSeq = 0;
        const allMedEntries = medicationSourceRows.map((m) => {
            const medCode = str(m.CodigoMedicamento);
            const medDisplay = resolveMipresDisplay(
                medCode,
                str(m.NombreMedicamento) || str(m.DCI)
            );
            const authoredOn = toFhirDtCo(m.FechaPrescripcion) || authoredOnFromHead;
            const dosageInstruction = buildMedicationDosageInstruction(m);
            if (!authoredOn || !dosageInstruction) return null;
            return makeEntry({
                resourceType: 'MedicationRequest',
                id: `MedicationRequest-${medSeq++}`,
                meta: { profile: [`${RDA_SD}/MedicationRequestRDA`] },
                status: 'active',
                intent: 'order',
                category: [{
                    coding: [{
                        system: CS_COLOMBIAN_HT_CAT,
                        code: '02',
                        display: 'Medicamento con registro sanitario',
                    }],
                }],
                reportedBoolean: m.reportedBoolean === true,
                medicationCodeableConcept: {
                    coding: [{
                        system: CS_MIPRES_INN,
                        code: String(medCode).slice(0, 64),
                        display: medDisplay,
                    }],
                },
                subject: { reference: refOf(patientEntry) },
                encounter: { reference: refOf('Encounter-0', 'Encounter') },
                requester: practitionerRef,
                reasonCode: [resolveMedicationReasonCodeable(m)],
                authoredOn,
                dosageInstruction: [dosageInstruction],
            });
        }).filter(Boolean);

        // ServiceRequest: procedimientos + otras tecnologías con secuencia global (BUNDLE-005: id = ServiceRequest-<n>)
        let serviceSeq = 0;
        const serviceRequestEntries = procPrescripciones.map((p) => {
            const cprod = str(p.CodigoProcedimiento);
            const reason = ripsFinalidadCodeable(p.FinalidadCodigo, p.FinalidadDescripcion, p.Finalidad);
            const authoredOn = toFhirDtCo(p.FechaPrescripcion) || authoredOnFromHead;
            if (!cprod || !reason || !authoredOn) return null;
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
                reasonCode: [reason],
                code: {
                    coding: [{
                        system: CS_CUPS,
                        code: cprod,
                        display: str(p.NombreProcedimiento) || undefined,
                    }],
                    text: str(p.NombreProcedimiento) || cprod || undefined,
                },
                subject: { reference: refOf(patientEntry) },
                encounter: { reference: refOf('Encounter-0', 'Encounter') },
                requester: practitionerRef,
                authoredOn,
            });
        }).filter(Boolean);

        // ServiceRequest: otras tecnologías — primer coding SNOMED (perfil); categoría ValueSet ColombianOtherHealthTechnologyCategoryCodes
        const otrasTecEntries = otrasTecnologias.map((o) => {
            const cotra = str(o.Codigo);
            const nom = str(o.Nombre) || cotra || 'Otra tecnología';
            const reason = ripsFinalidadCodeable(o.FinalidadCodigo, o.FinalidadDescripcion, o.Finalidad);
            const authoredOn = toFhirDtCo(o.FechaPrescripcion) || authoredOnFromHead;
            if (!cotra || !reason || !authoredOn) return null;
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
                reasonCode: [reason],
                code: {
                    coding: [{ system: SCT, code: cotra, display: nom || undefined }],
                    text: nom || cotra || undefined,
                },
                subject: { reference: refOf(patientEntry) },
                encounter: { reference: refOf('Encounter-0', 'Encounter') },
                requester: practitionerRef,
                authoredOn,
            });
        }).filter(Boolean);

        // Observation incapacidad — AttendanceAllowanceRDA: slices LicenseScope (1..1), LicenseTime, MaternityLicenseTime (IG 0.7+/0.8)
        const alcanceIncapacidad = str(head.AlcanceIncapacidad);
        const diasIncapacidad    = toStrictIntOrNull(head.DiasIncapacidad);
        const diasLicencia       = toStrictIntOrNull(head.DiasLicenciaMaternidad);
        const colombianLicenseScopeCoding = () => {
            if (!alcanceIncapacidad) return [];
            return [{
                system: CS_COLOMBIAN_LICENSE_SCOPE,
                code: alcanceIncapacidad,
                display: licenseScopeDisplayFromCode(alcanceIncapacidad, head.NombreAlcanceIncapacidad),
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

        const idOcupacionPac = pdem && pdem.IdOcupacion != null
            ? parseInt(String(pdem.IdOcupacion).trim(), 10)
            : NaN;
        const hasOcupacionPac = Number.isFinite(idOcupacionPac) && idOcupacionPac > 0;
        const ocupacionCodigo = hasOcupacionPac ? str(pdem.CodigoOcupacion) : null;
        const ocupacionNombre = hasOcupacionPac ? str(pdem.Ocupacion) : null;
        const ocupacionEntry = (ocupacionCodigo || ocupacionNombre) ? makeEntry({
            resourceType: 'Observation',
            id: 'Observation-1',
            meta: { profile: [`${RDA_SD}/PatientOccupationAtEncounterRDA`] },
            status: 'final',
            code: {
                coding: [{ system: SCT, code: '184104002', display: 'ocupación del paciente' }],
                text: 'Ocupación del paciente en el momento de la atención',
            },
            valueCodeableConcept: {
                coding: [{
                    system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/CIUO88AC',
                    ...(ocupacionCodigo ? { code: ocupacionCodigo } : {}),
                    ...(ocupacionNombre ? { display: ocupacionNombre } : {}),
                }],
            },
            subject: { reference: refOf(patientEntry) },
        }) : null;

        // Encounter (EncounterAmbulatoryRDA) — OBLIGATORIO en RDA Consulta
        const allConditionEntries = [
            ...(condPrincipalEntry ? [condPrincipalEntry] : []),
            ...condRelacionadasEntries,
            ...condAntecedentesSaludEntries,
        ];
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
        const cupsFromRips = aggregate.cupsFromRips || null;
        const encounterTypes = [];
        if (str(head.CodigoModalidadAtencion)) {
            let modalitySystem = str(head.ModalidadAtencionSystemUrl);
            let modalityDisplay = str(head.NombreModalidadAtencion);
            if (!modalitySystem || !modalityDisplay) {
                if (!colombianTechModalityCatalog) {
                    try {
                        colombianTechModalityCatalog = await loadColombianTechModalityCatalog(pool);
                    } catch (_) {
                        colombianTechModalityCatalog = {};
                    }
                }
                const ctmRow = colombianTechModalityCatalog[str(head.CodigoModalidadAtencion)];
                if (ctmRow) {
                    modalitySystem = modalitySystem || str(ctmRow.system_url);
                    modalityDisplay = modalityDisplay || str(ctmRow.display);
                }
            }
            if (!modalitySystem) {
                throw new Error('Modalidad de atención sin system_url oficial en BD (ejecute script RDA_ColombianTechModality).');
            }
            encounterTypes.push({
                coding: [{
                    system: modalitySystem,
                    code: str(head.CodigoModalidadAtencion),
                    display: modalityDisplay || undefined,
                }],
            });
        }
        const grupoPerfilCeDisplay = str(head.NombreGrupoServiciosPerfilCE)
            || (str(head.CodigoGrupoServicios) === '01' ? str(head.NombreGrupoServicios) : '')
            || 'Consulta externa';
        encounterTypes.push({ coding: [{ system: CS_GRUPO_SVC, code: '01', display: grupoPerfilCeDisplay }] });
        const repsHcSvcCode = str(cupsFromRips && cupsFromRips.CodigoServicioReps)
            || str(process.env.IHCE_RDACE_DEFAULT_REPS_HEALTHCARE_SERVICE_CODE)
            || '328';
        const repsHcSvcDisplay = str(cupsFromRips && cupsFromRips.NombreServicioReps)
            || str(process.env.IHCE_RDACE_DEFAULT_REPS_HEALTHCARE_SERVICE_DISPLAY)
            || 'MEDICINA GENERAL';
        encounterTypes.push({ coding: [{ system: CS_REPS_HC_SVC, code: repsHcSvcCode, display: repsHcSvcDisplay }] });
        const entorno = str(head.EntornoAtencion);
        if (entorno) {
            encounterTypes.push({ coding: [{ system: CS_ENTORNO, code: entorno, display: str(head.NombreEntornoAtencion) || undefined }] });
        }
        const procConCups = (procPrescripciones || []).find((p) => str(p.CodigoProcedimiento));
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

        const locationId = codPrest ? `${codPrest}-01` : null;
        const locationEntry = (codPrest && locationId) ? makeEntry({
            resourceType: 'Location',
            id: locationId,
            meta: { profile: [`${RDA_SD}/CareDeliveryLocationRDA`] },
            identifier: [{
                use: 'official',
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                value: locationId,
            }],
            name: nombreIps || `Sede ${codPrest}`,
            managingOrganization: { reference: `#${codPrest}` },
        }) : null;

        const viaIngresoCode = str(head.CodigoViaIngreso);
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
            ...(toFhirDtCo(head.FechaHoraInicioAtencion) || toFhirDtCo(head.FechaHoraFinAtencion) ? {
                period: {
                    ...(toFhirDtCo(head.FechaHoraInicioAtencion) ? { start: toFhirDtCo(head.FechaHoraInicioAtencion) } : {}),
                    ...(toFhirDtCo(head.FechaHoraFinAtencion)    ? { end:   toFhirDtCo(head.FechaHoraFinAtencion)    } : {}),
                },
            } : {}),
            ...(locationEntry ? { location: [{ location: { reference: `#${locationId}` } }] } : {}),
            ...(viaIngresoCode ? {
                hospitalization: {
                    admitSource: {
                        coding: [{
                            system: CS_VIA_INGRESO,
                            code: viaIngresoCode,
                            display: str(head.NombreViaIngreso) || undefined,
                        }],
                    },
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

        const compositionDateIso = toFhirDtCo(head.FechaRDA) || toFhirDtCo(new Date());

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

        const allServiceEntries = [...serviceRequestEntries, ...otrasTecEntries];

        const sections = [
            eapbOrgEntry
                ? { title: 'Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)', code: { coding: [{ system: 'http://loinc.org', code: '48768-6', display: 'Payment sources Document' }] }, entry: [{ reference: refOf(eapbOrgEntry) }] }
                : emptySection('Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)', '48768-6', 'Payment sources Document'),
            ...(ocupacionEntry
                ? [{ title: 'Otros datos demográficos', code: { coding: [{ system: 'http://loinc.org', code: '74208-0', display: 'Demographic information + History of occupation Document' }] }, entry: [{ reference: refOf(ocupacionEntry) }] }]
                : []),
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
            author:          ipsOrgEntry ? [{ reference: `#${codPrest}` }] : [{ reference: refOf(practitionerEntry) }],
            title:           'Resumen Digital de Atención en Salud - RDA de consulta externa',
            confidentiality: 'N',
            attester:        [{ mode: 'legal', party: { reference: refOf(practitionerEntry) } }],
            custodian:       ipsOrgEntry ? { reference: `#${codPrest}` } : { reference: refOf(practitionerEntry) },
            event:           [{ period: {
                ...(toFhirDtCo(head.FechaHoraInicioAtencion) ? { start: toFhirDtCo(head.FechaHoraInicioAtencion) } : {}),
                ...(toFhirDtCo(head.FechaHoraFinAtencion)    ? { end:   toFhirDtCo(head.FechaHoraFinAtencion)    } : {}),
            } }],
            section: sections,
        });

        const bundle = {
            resourceType: 'Bundle',
            language: 'es-CO',
            type: 'document',
            entry: [
                compositionEntry,
                patientEntry,
                encounterEntry,
                practitionerEntry,
                ...(ipsOrgEntry      ? [ipsOrgEntry]      : []),
                ...(eapbOrgEntry     ? [eapbOrgEntry]     : []),
                ...(locationEntry    ? [locationEntry]    : []),
                ...allConditionEntries,
                ...(allergyEntry     ? [allergyEntry]     : []),
                ...(riskEntry        ? [riskEntry]        : []),
                ...allMedEntries,
                ...allServiceEntries,
                ...(ocupacionEntry   ? [ocupacionEntry]   : []),
                ...(incapacidadEntry ? [incapacidadEntry] : []),
                documentReferenceEntry,
            ],
        };
        applyEnvCustodianIfConfigured(bundle, ihceAmb, reqBody, { rdace: true });
        return res.json(bundle);

    } catch (error) {
        console.error('❌ [RDACE] Error al construir Bundle FHIR RDA Consulta Externa:', error);
        if (error instanceof PersonIdentifierDisplayError) {
            return res.status(400).json({ ok: false, code: error.code, error: error.message, docTypeCode: error.docTypeCode });
        }
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
            const bundleBody = { IdEvaluacionEntidadRDACE: id, ambiente: effectiveAmb };
            if (overrideCodigoPrestador != null && String(overrideCodigoPrestador).trim()) {
                bundleBody.overrideCodigoPrestador = String(overrideCodigoPrestador).trim();
            }
            if (overrideNitPrestadorIPS != null && String(overrideNitPrestadorIPS).trim()) {
                bundleBody.overrideNitPrestadorIPS = String(overrideNitPrestadorIPS).trim();
            }
            if (overrideNombrePrestadorIPS != null && String(overrideNombrePrestadorIPS).trim()) {
                bundleBody.overrideNombrePrestadorIPS = String(overrideNombrePrestadorIPS).trim();
            }
            const prestadorDiag = resolvePrestadorForIhce(effectiveAmb, bundleBody);
            console.log('[RDACE] Prestador IPS resuelto (body > .env > BD):', {
                ambiente: effectiveAmb,
                reps: prestadorDiag.reps || '(vacío)',
                nit: prestadorDiag.nit || '(vacío)',
                name: prestadorDiag.name || '(vacío)',
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
            const alwaysKeep = new Set(['Composition', 'Patient', 'Encounter', 'Practitioner', 'Organization', 'Location', 'DocumentReference']);
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
                    });
                }
            }

            bundle.entry
                .filter((e) => e && e.resource && e.resource.resourceType === 'Encounter')
                .forEach((e) => {
                    const enc = e.resource;
                    if (enc.period) {
                        if (enc.period.start) {
                            enc.period.start = toFhirDateTimeColombia(enc.period.start) || enc.period.start;
                        }
                        if (enc.period.end) {
                            enc.period.end = toFhirDateTimeColombia(enc.period.end) || enc.period.end;
                        }
                    }
                });

            bundle.entry
                .filter((e) => e && e.resource && e.resource.resourceType === 'DocumentReference')
                .forEach((e) => {
                    const dr = e.resource;
                    if (dr.date) {
                        dr.date = toFhirDateTimeColombia(dr.date) || dr.date;
                    }
                    if (Array.isArray(dr.content)) {
                        dr.content.forEach((c) => {
                            if (c && c.attachment && c.attachment.creation) {
                                c.attachment.creation = toFhirDateTimeColombia(c.attachment.creation) || c.attachment.creation;
                            }
                        });
                    }
                });

            // PatientOccupationAtEncounterRDA: valueCodeableConcept.text prohibido (0..0)
            bundle.entry
                .filter((e) => e && e.resource && e.resource.resourceType === 'Observation')
                .forEach((e) => {
                    const prof = e.resource.meta && Array.isArray(e.resource.meta.profile)
                        ? e.resource.meta.profile.join(' ')
                        : '';
                    if (!prof.includes('PatientOccupationAtEncounterRDA')) return;
                    const vcc = e.resource.valueCodeableConcept;
                    if (vcc && Object.prototype.hasOwnProperty.call(vcc, 'text')) {
                        delete vcc.text;
                    }
                });

            // Patient.address: quitar line; normalizar DIVIPOLA en _city (no eliminar)
            bundle.entry
                .filter((e) => e && e.resource && e.resource.resourceType === 'Patient')
                .forEach((e) => {
                    sanitizeOptionalPatientFields(e.resource);
                    normalizePatientBirthTimeExtension(e.resource);
                    if (Array.isArray(e.resource.address)) {
                        e.resource.address.forEach((a) => {
                            if (a && Object.prototype.hasOwnProperty.call(a, 'line')) delete a.line;
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
        }, { rdace: true });

        normalizeBundleRefsToHashFragment(bundle);

        const poolValidate = await poolPromise;
        const medicationCatalogs = await loadRdaceMedicationCatalogs(poolValidate);
        const bundleValidateOpts = { medicationCatalogs };

        // Mismo cuerpo que JSON.stringify(bundle) en POST a IHCE; sin token ni llamada remota
        const isBundlePayloadPreview = /\/Json/i.test(req.path)
            || /BundlePayloadIHCE/i.test(req.path)
            || /PayloadParaIHCE/i.test(req.path);
        if (isBundlePayloadPreview) {
            const previewErr = validateRequiredForIhceCeBundle(bundle, bundleValidateOpts);
            if (previewErr) {
                return res.status(400).json({
                    ok: false,
                    code: 'RDACE_VALIDACION_OBLIGATORIOS',
                    error: previewErr,
                });
            }
            return res.type('application/fhir+json').json(bundle);
        }
        const requiredErr = validateRequiredForIhceCeBundle(bundle, bundleValidateOpts);
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

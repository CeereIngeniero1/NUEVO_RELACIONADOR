'use strict';

const fs = require('fs');
const path = require('path');

const JSON_ROOT = path.join(__dirname, '..', '..', 'jsons');
const DIR_SANDBOX = path.join(JSON_ROOT, 'sandbox');
const DIR_PRODUCCION = path.join(JSON_ROOT, 'produccion');

function ensureRdaEnvioJsonDirs() {
    fs.mkdirSync(DIR_SANDBOX, { recursive: true });
    fs.mkdirSync(DIR_PRODUCCION, { recursive: true });
}

function ambienteToFolder(ambiente) {
    const a = String(ambiente || 'sandbox').trim().toLowerCase();
    if (a === 'prod' || a === 'produccion' || a === 'producción') return 'produccion';
    return 'sandbox';
}

function sanitizeFilePart(value) {
    const s = String(value || 'sin-documento').trim();
    const clean = s.replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return (clean || 'sin-documento').slice(0, 80);
}

function extractDocumentoFromBundle(bundle) {
    if (!bundle || !Array.isArray(bundle.entry)) return 'sin-documento';
    const patientEntry = bundle.entry.find((e) => e && e.resource && e.resource.resourceType === 'Patient');
    const patient = patientEntry && patientEntry.resource;
    if (!patient) return 'sin-documento';

    if (patient.id) {
        const id = String(patient.id).trim();
        const m = id.match(/^([A-Za-z]+)[\-_](.+)$/);
        if (m) return sanitizeFilePart(`${m[1]}_${m[2]}`);
        return sanitizeFilePart(id);
    }

    const identifiers = Array.isArray(patient.identifier) ? patient.identifier : [];
    for (const ident of identifiers) {
        const val = ident && ident.value != null ? String(ident.value).trim() : '';
        if (val) return sanitizeFilePart(val);
    }
    return 'sin-documento';
}

function extractNombrePacienteFromBundle(bundle) {
    if (!bundle || !Array.isArray(bundle.entry)) return '';
    const patientEntry = bundle.entry.find((e) => e && e.resource && e.resource.resourceType === 'Patient');
    const patient = patientEntry && patientEntry.resource;
    if (!patient || !Array.isArray(patient.name) || patient.name.length === 0) return '';

    const official = patient.name.find((n) => n && n.use === 'official') || patient.name[0];
    if (!official || typeof official !== 'object') return '';

    const given = Array.isArray(official.given)
        ? official.given.map((g) => String(g || '').trim()).filter(Boolean).join(' ')
        : '';
    const family = official.family != null ? String(official.family).trim() : '';
    return [given, family].filter(Boolean).join(' ').trim();
}

/**
 * Carpeta por paciente: {documento}_{nombre}, p. ej. CC_53059528_Monica_Andrea_Delgado_Arango
 */
function buildPatientArchiveDirName(documento, nombrePaciente) {
    const doc = sanitizeFilePart(documento || 'sin-documento');
    const nombre = sanitizeFilePart(nombrePaciente);
    if (!nombre || nombre === 'sin-documento') return doc;
    return sanitizeFilePart(`${doc}_${nombre}`);
}

function extractCedulaFromBundle(bundle) {
    const documento = extractDocumentoFromBundle(bundle);
    const fromTypedId = documento.match(/^[A-Za-z]+_(\d+[\w]*)$/);
    if (fromTypedId) return sanitizeFilePart(fromTypedId[1]);

    const identifiers = [];
    if (bundle && Array.isArray(bundle.entry)) {
        const patient = bundle.entry.find((e) => e?.resource?.resourceType === 'Patient')?.resource;
        if (patient && Array.isArray(patient.identifier)) {
            for (const ident of patient.identifier) {
                const val = ident?.value != null ? String(ident.value).trim() : '';
                if (val) identifiers.push(val);
            }
        }
    }

    const numeric = identifiers.find((v) => /^\d+$/.test(v));
    if (numeric) return sanitizeFilePart(numeric);

    const digits = documento.replace(/\D/g, '');
    return sanitizeFilePart(digits || documento);
}

/**
 * Fecha/hora del RDA desde Composition.date (fallback Encounter.period.start).
 * @returns {string|null} YYYYMMDD_HHMMSS en hora del instante FHIR
 */
function extractRdaDateTimeFromBundle(bundle) {
    if (!bundle || !Array.isArray(bundle.entry)) return null;

    const composition = bundle.entry.find((e) => e?.resource?.resourceType === 'Composition')?.resource;
    const fromComposition = formatFhirDateTimeForFileName(composition?.date);
    if (fromComposition) return fromComposition;

    const encounter = bundle.entry.find((e) => e?.resource?.resourceType === 'Encounter')?.resource;
    const fromEncounter = formatFhirDateTimeForFileName(encounter?.period?.start);
    if (fromEncounter) return fromEncounter;

    return null;
}

function formatFhirDateTimeForFileName(value) {
    const s = String(value || '').trim();
    if (!s) return null;

    const withTime = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (withTime) {
        const [, y, mo, d, h, mi, se = '00'] = withTime;
        return `${y}${mo}${d}_${h}${mi}${se}`;
    }

    const dateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnly) {
        const [, y, mo, d] = dateOnly;
        return `${y}${mo}${d}_000000`;
    }

    return null;
}

function resolveTipoRdaLabel(tipo) {
    const t = String(tipo || '').trim().toLowerCase();
    if (t === 'ce' || t === 'consulta-externa' || t === 'rdace') return 'CE';
    return 'PAC';
}

function buildArchiveFileName({ bundle, tipo, idEvaluacion }) {
    const cedula = extractCedulaFromBundle(bundle);
    const tipoLabel = resolveTipoRdaLabel(tipo);
    const rdaDateTime = extractRdaDateTimeFromBundle(bundle) || formatTimestampColombia();
    return `${cedula}_${tipoLabel}_${rdaDateTime}.json`;
}

function uniqueFilePath(folder, fileName) {
    let candidate = path.join(folder, fileName);
    if (!fs.existsSync(candidate)) return candidate;

    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    let n = 2;
    while (fs.existsSync(candidate) && n < 100) {
        candidate = path.join(folder, `${base}_${n}${ext}`);
        n += 1;
    }
    return candidate;
}

function formatTimestampColombia(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        hour12: false,
    }).formatToParts(date);
    const get = (type) => (parts.find((p) => p.type === type) || {}).value;
    return `${get('year')}${get('month')}${get('day')}_${get('hour')}${get('minute')}${get('second')}`;
}

function prettyJsonText(bundleOrString) {
    if (typeof bundleOrString === 'string') {
        try {
            return `${JSON.stringify(JSON.parse(bundleOrString), null, 2)}\n`;
        } catch (_) {
            return bundleOrString.endsWith('\n') ? bundleOrString : `${bundleOrString}\n`;
        }
    }
    return `${JSON.stringify(bundleOrString, null, 2)}\n`;
}

/**
 * Guarda en disco el JSON que se envía a IHCE.
 * @returns {string|null} ruta absoluta del archivo creado
 */
function archiveRdaEnvioJson({ bundle, bundleJson, ambiente, tipo, idEvaluacion }) {
    try {
        ensureRdaEnvioJsonDirs();
        const baseFolder = ambienteToFolder(ambiente) === 'produccion' ? DIR_PRODUCCION : DIR_SANDBOX;
        const documento = extractDocumentoFromBundle(bundle);
        const nombrePaciente = extractNombrePacienteFromBundle(bundle);
        const patientDir = buildPatientArchiveDirName(documento, nombrePaciente);
        const folder = path.join(baseFolder, patientDir);
        fs.mkdirSync(folder, { recursive: true });
        const fileName = buildArchiveFileName({ bundle, tipo, idEvaluacion });
        const filePath = uniqueFilePath(folder, fileName);
        const text = bundleJson != null ? prettyJsonText(bundleJson) : prettyJsonText(bundle);
        fs.writeFileSync(filePath, text, 'utf8');
        console.log(`[RDA archive] JSON IHCE guardado: ${filePath}`);
        return filePath;
    } catch (err) {
        console.error('[RDA archive] No se pudo guardar JSON de envío:', err && err.message ? err.message : err);
        return null;
    }
}

module.exports = {
    JSON_ROOT,
    DIR_SANDBOX,
    DIR_PRODUCCION,
    ensureRdaEnvioJsonDirs,
    archiveRdaEnvioJson,
    extractDocumentoFromBundle,
    extractCedulaFromBundle,
    extractNombrePacienteFromBundle,
    extractRdaDateTimeFromBundle,
    buildArchiveFileName,
    buildPatientArchiveDirName,
    sanitizeFilePart,
};

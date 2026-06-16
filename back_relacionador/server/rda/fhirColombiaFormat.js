'use strict';

const CO_TZ = 'America/Bogota';
const CO_OFFSET = '-05:00';
const RDA_SD = 'https://fhir.minsalud.gov.co/rda/StructureDefinition';
const EXT_BIRTH_TIME = `${RDA_SD}/ExtensionBirthTime`;

function formatParts(d, options) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: CO_TZ, ...options }).formatToParts(d);
}

function partVal(parts, type) {
    const p = parts.find((x) => x.type === type);
    return p ? p.value : '';
}

/** FHIR dateTime con offset Colombia (-05:00), p. ej. 2025-08-09T09:59:00-05:00 */
function toFhirDateTimeColombia(v) {
    if (v == null || v === '') return null;
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return null;
    const parts = formatParts(d, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    return `${partVal(parts, 'year')}-${partVal(parts, 'month')}-${partVal(parts, 'day')}T${partVal(parts, 'hour')}:${partVal(parts, 'minute')}:${partVal(parts, 'second')}${CO_OFFSET}`;
}

/** Hora de nacimiento local Colombia (valueTime), p. ej. 14:30:00 */
function toFhirBirthTimeColombia(v) {
    if (v == null || v === '') return null;
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return null;
    const parts = formatParts(d, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    return `${partVal(parts, 'hour')}:${partVal(parts, 'minute')}:${partVal(parts, 'second')}`;
}

function hasBirthTimeColombia(v) {
    const t = toFhirBirthTimeColombia(v);
    return t != null && t !== '00:00:00';
}

function normalizePatientBirthTimeExtension(patient, birthSource) {
    if (!patient || !patient.birthDate) return;
    const src = birthSource != null ? birthSource : patient.birthDate;
    if (!hasBirthTimeColombia(src)) {
        if (patient._birthDate) delete patient._birthDate;
        return;
    }
    const valueTime = toFhirBirthTimeColombia(src);
    if (!valueTime) return;
    patient._birthDate = {
        extension: [{
            url: EXT_BIRTH_TIME,
            valueTime,
        }],
    };
}

/** Código municipio DIVIPOLA a 5 dígitos (p. ej. 5001 → 05001, 11001 → 11001). */
function normalizeDivipolaMunicipalityCode(code) {
    const s = code != null ? String(code).trim() : '';
    if (!s || !/^\d+$/.test(s)) return null;
    return s.padStart(5, '0');
}

/** PatientRDA / PractitionerRDA — name oficial con extensiones de apellidos. */
function buildRdaPersonName({ primerApellido, segundoApellido, primerNombre, segundoNombre }) {
    const pAp = primerApellido != null ? String(primerApellido).trim() : '';
    const sAp = segundoApellido != null ? String(segundoApellido).trim() : '';
    const pNom = primerNombre != null ? String(primerNombre).trim() : '';
    const sNom = segundoNombre != null ? String(segundoNombre).trim() : '';
    if (!pAp && !sAp && !pNom && !sNom) return null;

    const familyText = pAp || undefined;
    const givenArr = [pNom, sNom].filter(Boolean);
    const familyExtArr = [
        ...(pAp ? [{ url: `${RDA_SD}/ExtensionFathersFamilyName`, valueString: pAp }] : []),
        ...(sAp ? [{ url: `${RDA_SD}/ExtensionMothersFamilyName`, valueString: sAp }] : []),
    ];

    return {
        use: 'official',
        ...(familyText ? { family: familyText } : {}),
        ...(familyExtArr.length > 0 ? { _family: { extension: familyExtArr } } : {}),
        ...(givenArr.length > 0 ? { given: givenArr } : {}),
    };
}

module.exports = {
    toFhirDateTimeColombia,
    toFhirBirthTimeColombia,
    hasBirthTimeColombia,
    normalizePatientBirthTimeExtension,
    normalizeDivipolaMunicipalityCode,
    buildRdaPersonName,
    EXT_BIRTH_TIME,
};

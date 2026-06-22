'use strict';

const CO_TZ = 'America/Bogota';
const CO_OFFSET = '-05:00';
const RDA_SD = 'https://fhir.minsalud.gov.co/rda/StructureDefinition';
const EXT_BIRTH_TIME = `${RDA_SD}/ExtensionBirthTime`;

function pad2(n) {
    return String(n).padStart(2, '0');
}

/**
 * Partes de fecha/hora parseadas desde string API/SQL/FHIR.
 * @returns {{ y: string, mo: string, d: string, h: string, mi: string, se: string, hasOffset: boolean, isUtcZ?: boolean, offsetSign?: string, offsetH?: string, offsetM?: string } | null}
 */
function parseDateTimeParts(v) {
    if (v == null || v === '') return null;
    const s = String(v).trim();
    if (!s) return null;

    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|([+-])(\d{2}):?(\d{2}))?$/);
    if (m) {
        const [, y, mo, d, h, mi, se = '00', tz, sign, tzH, tzM] = m;
        return {
            y,
            mo,
            d,
            h,
            mi,
            se: se || '00',
            hasOffset: Boolean(tz),
            isUtcZ: tz === 'Z',
            offsetSign: sign,
            offsetH: tzH,
            offsetM: tzM,
        };
    }

    m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
        const [, y, mo, d, h, mi, se = '00'] = m;
        return {
            y,
            mo,
            d,
            h,
            mi,
            se: se || '00',
            hasOffset: false,
        };
    }

    return null;
}

function partsToFhir(parts) {
    if (!parts) return null;
    return `${parts.y}-${parts.mo}-${parts.d}T${pad2(parts.h)}:${pad2(parts.mi)}:${pad2(parts.se)}${CO_OFFSET}`;
}

function partsToSqlLiteral(parts) {
    if (!parts) return null;
    return `${parts.y}-${parts.mo}-${parts.d} ${pad2(parts.h)}:${pad2(parts.mi)}:${pad2(parts.se)}`;
}

function formatParts(d, options) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: CO_TZ,
        hourCycle: 'h23',
        ...options,
    }).formatToParts(d);
}

function partVal(parts, type) {
    const p = parts.find((x) => x.type === type);
    return p ? p.value : '';
}

function formatBogotaInstantParts(d) {
    const fp = formatParts(d, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    return {
        y: partVal(fp, 'year'),
        mo: partVal(fp, 'month'),
        d: partVal(fp, 'day'),
        h: partVal(fp, 'hour'),
        mi: partVal(fp, 'minute'),
        se: partVal(fp, 'second'),
    };
}

/** SQL DateTime2 vía mssql (useUTC:true): componentes UTC = reloj Colombia guardado. */
function sqlUtcDateToFhir(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return null;
    return partsToFhir({
        y: String(d.getUTCFullYear()),
        mo: pad2(d.getUTCMonth() + 1),
        d: pad2(d.getUTCDate()),
        h: pad2(d.getUTCHours()),
        mi: pad2(d.getUTCMinutes()),
        se: pad2(d.getUTCSeconds()),
    });
}

/**
 * Normaliza entrada de formulario/API:
 * - sin offset → hora local Colombia (naive)
 * - con Z/offset → instante convertido a hora Colombia
 */
function normalizeColombiaDateTimeInput(v) {
    const parts = parseDateTimeParts(v);
    if (!parts) return null;

    if (!parts.hasOffset) {
        return partsToFhir(parts);
    }

    const iso = parts.isUtcZ
        ? `${parts.y}-${parts.mo}-${parts.d}T${parts.h}:${parts.mi}:${parts.se}Z`
        : `${parts.y}-${parts.mo}-${parts.d}T${parts.h}:${parts.mi}:${parts.se}${parts.offsetSign}${parts.offsetH}:${parts.offsetM}`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return partsToFhir(formatBogotaInstantParts(d));
}

/**
 * Convierte entrada de usuario a Date para mssql (useUTC:true):
 * la hora naive se guarda tal cual en SQL (componentes UTC = reloj Colombia).
 */
function colombiaDateTimeToMssqlDate(v) {
    if (v == null || v === '') return null;

    if (typeof v === 'string') {
        const parts = parseDateTimeParts(v);
        if (parts) {
            if (!parts.hasOffset) {
                return new Date(Date.UTC(
                    Number(parts.y),
                    Number(parts.mo) - 1,
                    Number(parts.d),
                    Number(parts.h),
                    Number(parts.mi),
                    Number(parts.se),
                ));
            }
            const iso = parts.isUtcZ
                ? `${parts.y}-${parts.mo}-${parts.d}T${parts.h}:${parts.mi}:${parts.se}Z`
                : `${parts.y}-${parts.mo}-${parts.d}T${parts.h}:${parts.mi}:${parts.se}${parts.offsetSign}${parts.offsetH}:${parts.offsetM}`;
            const d = new Date(iso);
            if (isNaN(d.getTime())) return null;
            const bp = formatBogotaInstantParts(d);
            return new Date(Date.UTC(
                Number(bp.y),
                Number(bp.mo) - 1,
                Number(bp.d),
                Number(bp.h),
                Number(bp.mi),
                Number(bp.se),
            ));
        }
    }

    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

/** Fecha/hora actual en Colombia para [Fecha RDA] (SQL literal). */
function colombiaDateTimeNowSql() {
    return partsToSqlLiteral(formatBogotaInstantParts(new Date()));
}

/** FHIR dateTime con offset Colombia (-05:00). */
function toFhirDateTimeColombia(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'string') return normalizeColombiaDateTimeInput(v);
    if (v instanceof Date) {
        if (isNaN(v.getTime())) return null;
        return sqlUtcDateToFhir(v);
    }
    return normalizeColombiaDateTimeInput(String(v));
}

/** FHIR dateTime para instante actual (p. ej. fallback Composition.date). */
function toFhirDateTimeColombiaNow() {
    return partsToFhir(formatBogotaInstantParts(new Date()));
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
    toFhirDateTimeColombiaNow,
    colombiaDateTimeToMssqlDate,
    colombiaDateTimeNowSql,
    normalizeColombiaDateTimeInput,
    toFhirBirthTimeColombia,
    hasBirthTimeColombia,
    normalizePatientBirthTimeExtension,
    normalizeDivipolaMunicipalityCode,
    buildRdaPersonName,
    EXT_BIRTH_TIME,
};

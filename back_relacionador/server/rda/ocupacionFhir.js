/** Id reservado en [Ocupación] para placeholder Sin asignar (sin código CIUO). */
const ID_OCUPACION_SIN_ASIGNAR = 1;

const {
    emptyRdaceSection,
    loincFromSection,
    RDACE_SECTION_LOINC,
} = require('./rdaceCompositionSections');

function normStr(v) {
    return v == null ? '' : String(v).trim();
}

function isSinAsignarText(text) {
    return /^sin\s+asignar$/i.test(normStr(text));
}

/** Código CIUO-88 A.C. a 4 dígitos para el bundle. */
function normalizeCiou88acCode(raw) {
    const digits = normStr(raw).replace(/\D/g, '');
    if (!digits) return '';
    return digits.length >= 4 ? digits.slice(-4).padStart(4, '0') : digits.padStart(4, '0');
}

function isCorruptCodeText(code) {
    const s = normStr(code).toLowerCase();
    return s === 'null' || s === 'undefined';
}

/**
 * Ocupación informada para Observation CIUO88AC en RDACE.
 * La sección Composition 74208-0 sigue siendo 1..1; sin dato va con emptyReason (entry 0..1).
 */
function isOcupacionInformadaParaFhir({ idOcupacion, codigoOcupacion, ocupacionNombre } = {}) {
    const id = idOcupacion != null ? parseInt(String(idOcupacion).trim(), 10) : NaN;
    if (!Number.isFinite(id) || id <= 0 || id === ID_OCUPACION_SIN_ASIGNAR) return false;

    const codigo = normalizeCiou88acCode(codigoOcupacion);
    const nombre = normStr(ocupacionNombre);
    if (isSinAsignarText(nombre)) return false;
    if (!codigo || isCorruptCodeText(codigo)) return false;

    return true;
}

function isPatientOccupationObservation(resource) {
    const prof = resource?.meta?.profile;
    if (!Array.isArray(prof)) return false;
    return prof.some((p) => String(p).includes('PatientOccupationAtEncounterRDA'));
}

/**
 * Elimina Observation de ocupación sin coding.code y deja sección 74208-0 con emptyReason.
 * Evita error IHCE: value[x].coding.code 1..1 en PatientOccupationAtEncounterRDA.
 */
function sanitizeRdaceOccupationBundle(bundle) {
    if (!bundle || !Array.isArray(bundle.entry)) return { removed: 0 };

    const dropIds = new Set();
    let removed = 0;

    bundle.entry.forEach((e) => {
        const r = e?.resource;
        if (!r || r.resourceType !== 'Observation' || !isPatientOccupationObservation(r)) return;

        const coding = r.valueCodeableConcept?.coding?.[0];
        const code = normalizeCiou88acCode(coding?.code);
        const display = normStr(coding?.display);

        if (!code || isSinAsignarText(display)) {
            if (r.id) dropIds.add(String(r.id));
            e.__dropOccupation = true;
            removed += 1;
        } else if (coding && coding.code !== code) {
            coding.code = code;
        }
    });

    if (!removed) return { removed: 0 };

    bundle.entry = bundle.entry.filter((e) => !e.__dropOccupation);

    const comp = bundle.entry.find((e) => e?.resource?.resourceType === 'Composition')?.resource;
    if (comp && Array.isArray(comp.section)) {
        comp.section = comp.section.map((sec) => {
            if (loincFromSection(sec) !== RDACE_SECTION_LOINC.OCCUPATION) return sec;
            const refs = Array.isArray(sec.entry) ? sec.entry : [];
            const pointsToDropped = refs.some((r) => dropIds.has(refIdFromBundleRef(r?.reference)));
            if (!pointsToDropped && refs.length) return sec;
            return emptyRdaceSection(
                'Otros datos demográficos',
                RDACE_SECTION_LOINC.OCCUPATION,
                'Demographic information + History of occupation Document'
            );
        });
    }

    return { removed };
}

function refIdFromBundleRef(reference) {
    const raw = normStr(reference);
    if (!raw) return '';
    if (raw.startsWith('#')) return raw.slice(1);
    const m = raw.match(/^[A-Za-z]+\/(.+)$/);
    return m ? m[1] : raw;
}

module.exports = {
    ID_OCUPACION_SIN_ASIGNAR,
    isSinAsignarText,
    normalizeCiou88acCode,
    isOcupacionInformadaParaFhir,
    isPatientOccupationObservation,
    sanitizeRdaceOccupationBundle,
};

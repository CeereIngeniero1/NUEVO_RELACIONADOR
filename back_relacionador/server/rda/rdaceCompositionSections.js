/**
 * Composition.section para RDA Consulta Externa (CompositionAmbulatoryRDA).
 * Perfil IHCE: mínimo 9 secciones (máx. 10 con notas aclaratorias opcionales).
 */

const RDACE_SECTION_LOINC = {
    PAYERS: '48768-6',
    OCCUPATION: '74208-0',
    INCAPACITY: '105583-9',
    MEDICATIONS: '10160-0',
    ALLERGIES: '48765-2',
    PROBLEMS: '11450-4',
    RISK_FACTORS: '75492-9',
    SERVICE_REQUESTS: '61146-1',
    SUPPORT_DOCS: '55107-7',
    CLARIFICATION_NOTES: '34109-9',
};

const RDACE_MIN_SECTIONS = 9;
const RDACE_MAX_SECTIONS = 10;

const REQUIRED_RDACE_SECTION_LOINCS = [
    RDACE_SECTION_LOINC.PAYERS,
    RDACE_SECTION_LOINC.OCCUPATION,
    RDACE_SECTION_LOINC.INCAPACITY,
    RDACE_SECTION_LOINC.MEDICATIONS,
    RDACE_SECTION_LOINC.ALLERGIES,
    RDACE_SECTION_LOINC.PROBLEMS,
    RDACE_SECTION_LOINC.RISK_FACTORS,
    RDACE_SECTION_LOINC.SERVICE_REQUESTS,
    RDACE_SECTION_LOINC.SUPPORT_DOCS,
];

function sectionTextDiv(msg) {
    return {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${msg}</div>`,
    };
}

function emptyRdaceSection(title, loinc, display) {
    return {
        title,
        code: { coding: [{ system: 'http://loinc.org', code: loinc, display }] },
        text: sectionTextDiv('Sin información registrada'),
        emptyReason: {
            coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
                code: 'nilknown',
                display: 'Nil Known',
            }],
            text: 'Sin información registrada',
        },
    };
}

function loincFromSection(section) {
    const coding = section && section.code && section.code.coding;
    if (!Array.isArray(coding) || !coding[0]) return '';
    return String(coding[0].code || '').trim();
}

/**
 * Sección 74208-0: Observation si hay ocupación; si no, text + emptyReason (perfil 1..1 slice, entry 0..1).
 */
function buildRdaceOccupationSection(ocupacionEntry, refOf) {
    if (ocupacionEntry) {
        return {
            title: 'Otros datos demográficos',
            code: {
                coding: [{
                    system: 'http://loinc.org',
                    code: RDACE_SECTION_LOINC.OCCUPATION,
                    display: 'Demographic information + History of occupation Document',
                }],
            },
            entry: [{ reference: refOf(ocupacionEntry) }],
        };
    }
    return emptyRdaceSection(
        'Otros datos demográficos',
        RDACE_SECTION_LOINC.OCCUPATION,
        'Demographic information + History of occupation Document'
    );
}

/**
 * @returns {string} mensaje de error o '' si válido
 */
function validateRdaceCompositionSections(sections) {
    const list = Array.isArray(sections) ? sections : [];
    const count = list.length;
    if (count < RDACE_MIN_SECTIONS || count > RDACE_MAX_SECTIONS) {
        return `Composition.section debe tener entre ${RDACE_MIN_SECTIONS} y ${RDACE_MAX_SECTIONS} entradas; actual: ${count}.`;
    }

    const present = new Set(list.map(loincFromSection).filter(Boolean));
    const missing = REQUIRED_RDACE_SECTION_LOINCS.filter((loinc) => !present.has(loinc));
    if (missing.length) {
        return `Faltan secciones obligatorias CompositionAmbulatoryRDA (LOINC): ${missing.join(', ')}.`;
    }

    const invalid = list.find((s) =>
        Array.isArray(s && s.entry) && s.entry.length > 0 && s.emptyReason
    );
    if (invalid) {
        return `La sección LOINC ${loincFromSection(invalid)} no puede tener entry y emptyReason a la vez.`;
    }

    return '';
}

function logRdaceCompositionSections(sections, logPrefix = '[RDACE]') {
    const list = Array.isArray(sections) ? sections : [];
    const summary = list.map((s, i) => `${i + 1}:${loincFromSection(s) || '?'}`).join(', ');
    const err = validateRdaceCompositionSections(list);
    console.log(`${logPrefix} Composition.section count=${list.length} [${summary}]`);
    if (err) {
        console.warn(`${logPrefix} Composition.section validation: ${err}`);
    }
    return err;
}

module.exports = {
    RDACE_SECTION_LOINC,
    RDACE_MIN_SECTIONS,
    RDACE_MAX_SECTIONS,
    REQUIRED_RDACE_SECTION_LOINCS,
    sectionTextDiv,
    emptyRdaceSection,
    buildRdaceOccupationSection,
    loincFromSection,
    validateRdaceCompositionSections,
    logRdaceCompositionSections,
};

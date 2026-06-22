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

function escapeXhtmlText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function sectionTextDiv(msg) {
    return {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${msg}</div>`,
    };
}

/**
 * Narrativa de antecedentes farmacológicos para sección 10160-0.
 * IHCE exige route/timing/doseAndRate en cada MedicationRequestRDA; sin esos datos en BD
 * los antecedentes van como texto narrativo, no como MedicationRequest.
 * @param {Array<{ codigo?: string, nombre?: string, observacion?: string }>} rows
 */
function buildAntecedentesSaludNarrative(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '';
    const items = list.map((row, i) => {
        const desc = String(row && row.descripcion ? row.descripcion : '').trim();
        return `<li>${i + 1}. ${escapeXhtmlText(desc || 'Sin descripción')}</li>`;
    });
    return `<p>Antecedentes personales de salud reportados:</p><ul>${items.join('')}</ul>`;
}

function buildAntecedentesFamiliaresNarrative(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '';
    const items = list.map((row, i) => {
        const parentesco = String(row && row.parentescoLabel ? row.parentescoLabel : row.parentesco || '').trim();
        const desc = String(row && row.descripcion ? row.descripcion : '').trim();
        const prefix = parentesco ? `${escapeXhtmlText(parentesco)}: ` : '';
        return `<li>${i + 1}. ${prefix}${escapeXhtmlText(desc || 'Sin descripción')}</li>`;
    });
    return `<p>Antecedentes familiares reportados:</p><ul>${items.join('')}</ul>`;
}

function buildProblemsSectionNarrative(antecedentSaludRows = [], antecedentFamRows = []) {
    const parts = [
        buildAntecedentesSaludNarrative(antecedentSaludRows),
        buildAntecedentesFamiliaresNarrative(antecedentFamRows),
    ].filter(Boolean);
    return parts.join('');
}

/**
 * Sección 11450-4: Condition (dx consulta + antecedentes con CIE-10); antecedentes sin FMH como narrativa.
 */
function buildRdaceProblemsSection({
    conditionEntries = [],
    antecedentSaludRows = [],
    antecedentFamRows = [],
    refOf,
    emptyRdaceSection: emptySectionFn = emptyRdaceSection,
}) {
    const hasCond = Array.isArray(conditionEntries) && conditionEntries.length > 0;
    const narrative = buildProblemsSectionNarrative(antecedentSaludRows, antecedentFamRows);
    const loinc = RDACE_SECTION_LOINC.PROBLEMS;
    const display = 'Problem list - Reported';

    if (!hasCond && !narrative) {
        return emptySectionFn('Historial de diagnósticos de problemas de salud', loinc, display);
    }

    const section = {
        title: 'Historial de diagnósticos de problemas de salud',
        code: { coding: [{ system: 'http://loinc.org', code: loinc, display }] },
    };

    if (narrative) {
        section.text = sectionTextDiv(narrative);
    }

    if (hasCond) {
        section.entry = conditionEntries.map((c) => ({ reference: refOf(c) }));
    }

    return section;
}

function buildAntecedentesFarmacologicosNarrative(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '';
    const items = list.map((m, i) => {
        const code = String(m && m.codigo ? m.codigo : '').trim();
        const name = String(m && m.nombre ? m.nombre : '').trim();
        const obs = String(m && m.observacion ? m.observacion : '').trim();
        const medLabel = name || code || 'Medicamento';
        const codePart = code ? `${escapeXhtmlText(code)} - ` : '';
        const obsPart = obs ? ` (${escapeXhtmlText(obs)})` : '';
        return `<li>${i + 1}. ${codePart}${escapeXhtmlText(medLabel)}${obsPart}</li>`;
    });
    return `<p>Antecedentes farmacológicos reportados:</p><ul>${items.join('')}</ul>`;
}

/**
 * Sección 10160-0: prescripciones como MedicationRequest; antecedentes solo narrativa.
 */
function buildRdaceMedicationsSection({
    prescriptionMedEntries = [],
    antecedentMedRows = [],
    refOf,
    emptyRdaceSection: emptySectionFn = emptyRdaceSection,
}) {
    const hasRx = Array.isArray(prescriptionMedEntries) && prescriptionMedEntries.length > 0;
    const hasAnt = Array.isArray(antecedentMedRows) && antecedentMedRows.length > 0;
    const loinc = RDACE_SECTION_LOINC.MEDICATIONS;
    const display = 'History of Medication use Narrative';

    if (!hasRx && !hasAnt) {
        return emptySectionFn('Historial de medicamentos', loinc, display);
    }

    const section = {
        title: 'Historial de medicamentos',
        code: { coding: [{ system: 'http://loinc.org', code: loinc, display }] },
    };

    if (hasAnt) {
        section.text = sectionTextDiv(buildAntecedentesFarmacologicosNarrative(antecedentMedRows));
    }

    if (hasRx) {
        section.entry = prescriptionMedEntries.map((m) => ({ reference: refOf(m) }));
    }

    return section;
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
    escapeXhtmlText,
    buildAntecedentesSaludNarrative,
    buildAntecedentesFamiliaresNarrative,
    buildProblemsSectionNarrative,
    buildRdaceProblemsSection,
    buildAntecedentesFarmacologicosNarrative,
    buildRdaceMedicationsSection,
    emptyRdaceSection,
    buildRdaceOccupationSection,
    loincFromSection,
    validateRdaceCompositionSections,
    logRdaceCompositionSections,
};

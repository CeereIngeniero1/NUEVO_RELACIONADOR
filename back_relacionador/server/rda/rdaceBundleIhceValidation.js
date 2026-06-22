'use strict';

const { validateMedicationDosageFromCatalogs } = require('./rdaFhirCatalogs');
const { validateRdaceCompositionSections, REQUIRED_RDACE_SECTION_LOINCS } = require('./rdaceCompositionSections');

/**
 * @typedef {{ path: string, resourceType: string, message: string }} RdaceBundleIssue
 */

function str(v) {
    return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function bundleEntryPath(entryIndex, suffix) {
    return `Bundle.entry[${entryIndex}].resource${suffix ? `.${suffix}` : ''}`;
}

/**
 * @param {object} r MedicationRequest resource
 * @param {number} entryIndex índice en Bundle.entry
 * @param {object} [options]
 * @returns {RdaceBundleIssue[]}
 */
function collectMedicationRequestIssues(r, entryIndex, options = {}) {
    const issues = [];
    const base = bundleEntryPath(entryIndex);
    if (!r || r.resourceType !== 'MedicationRequest') return issues;

    if (r.status !== 'active') {
        issues.push({
            path: `${base}.status`,
            resourceType: 'MedicationRequest',
            message: "MedicationRequest.status debe ser exactamente 'active'",
        });
    }
    if (r.intent !== 'order') {
        issues.push({
            path: `${base}.intent`,
            resourceType: 'MedicationRequest',
            message: "MedicationRequest.intent debe ser exactamente 'order'",
        });
    }

    const medConcept = r.medicationCodeableConcept;
    const hasMed = medConcept && (
        (Array.isArray(medConcept.coding) && medConcept.coding.some((c) => str(c && c.code)))
        || str(medConcept.text)
    );
    if (!hasMed) {
        issues.push({
            path: `${base}.medicationCodeableConcept`,
            resourceType: 'MedicationRequest',
            message: 'MedicationRequest requiere medicationCodeableConcept con código o texto.',
        });
    }

    if (!r.subject || !str(r.subject.reference)) {
        issues.push({ path: `${base}.subject`, resourceType: 'MedicationRequest', message: 'MedicationRequest.subject es obligatorio.' });
    }
    if (!r.encounter || !str(r.encounter.reference)) {
        issues.push({ path: `${base}.encounter`, resourceType: 'MedicationRequest', message: 'MedicationRequest.encounter es obligatorio en RDA CE.' });
    }
    if (!r.requester || !str(r.requester.reference)) {
        issues.push({ path: `${base}.requester`, resourceType: 'MedicationRequest', message: 'MedicationRequest.requester es obligatorio.' });
    }
    if (!r.authoredOn) {
        issues.push({ path: `${base}.authoredOn`, resourceType: 'MedicationRequest', message: 'MedicationRequest.authoredOn es obligatorio.' });
    }
    if (!Array.isArray(r.reasonCode) || r.reasonCode.length === 0) {
        issues.push({ path: `${base}.reasonCode`, resourceType: 'MedicationRequest', message: 'MedicationRequest.reasonCode es obligatorio.' });
    }

    if (!Array.isArray(r.dosageInstruction) || r.dosageInstruction.length !== 1) {
        issues.push({
            path: `${base}.dosageInstruction`,
            resourceType: 'MedicationRequest',
            message: 'MedicationRequest.dosageInstruction debe existir con cardinalidad 1..1 (exactamente un elemento).',
        });
        return issues;
    }

    if (r.reportedBoolean === true) {
        issues.push({
            path: base,
            resourceType: 'MedicationRequest',
            message: 'RDA CE: antecedentes farmacológicos no deben enviarse como MedicationRequest; use narrativa en Composition.section 10160-0.',
        });
        return issues;
    }

    const di = r.dosageInstruction[0];
    const routeOk = di && di.route && Array.isArray(di.route.coding) && di.route.coding.length > 0;
    const timing = di && di.timing;
    const repeat = timing && timing.repeat;
    const dar = di && Array.isArray(di.doseAndRate) ? di.doseAndRate[0] : null;
    const dosageComplete = Boolean(
        routeOk &&
        repeat && repeat.duration != null && repeat.durationUnit &&
        timing.code &&
        dar && dar.doseQuantity && dar.rateQuantity
    );
    if (!dosageComplete) {
        issues.push({
            path: `${base}.dosageInstruction[0]`,
            resourceType: 'MedicationRequest',
            message: 'MedicationRequestRDA: dosageInstruction requiere route, timing (duración/frecuencia) y doseAndRate desde catálogos.',
        });
    } else {
        const catalogErr = validateMedicationDosageFromCatalogs(di, options.medicationCatalogs || {});
        if (catalogErr) {
            issues.push({
                path: `${base}.dosageInstruction[0]`,
                resourceType: 'MedicationRequest',
                message: catalogErr,
            });
        }
    }

    return issues;
}

/**
 * @param {object} bundle
 * @param {object} [options]
 * @returns {RdaceBundleIssue[]}
 */
function collectRdaceBundleIhceIssues(bundle, options = {}) {
    const issues = [];
    if (!bundle || !Array.isArray(bundle.entry)) {
        return [{ path: 'Bundle', resourceType: 'Bundle', message: 'Bundle inválido: no contiene entry.' }];
    }

    const entries = bundle.entry;
    const idSet = new Set(
        entries
            .map((e) => e && e.resource && str(e.resource.id))
            .filter(Boolean)
    );

    entries.forEach((e, idx) => {
        const r = e && e.resource;
        if (!r) return;
        if (r.resourceType === 'MedicationRequest') {
            issues.push(...collectMedicationRequestIssues(r, idx, options));
        }
    });

    const compositionEntry = entries.find((e) => e && e.resource && e.resource.resourceType === 'Composition');
    const composition = compositionEntry && compositionEntry.resource;
    if (composition && Array.isArray(composition.section)) {
        const sectionErr = validateRdaceCompositionSections(composition.section);
        if (sectionErr) {
            issues.push({
                path: 'Bundle.entry[].resource.section',
                resourceType: 'Composition',
                message: sectionErr,
            });
        }
        const allowed = new Set(REQUIRED_RDACE_SECTION_LOINCS);
        composition.section.forEach((sec, si) => {
            const loinc = sec && sec.code && Array.isArray(sec.code.coding)
                ? str(sec.code.coding[0] && sec.code.coding[0].code)
                : '';
            if (loinc && !allowed.has(loinc)) {
                issues.push({
                    path: `Bundle.entry[].resource.section[${si}].code`,
                    resourceType: 'Composition',
                    message: `Sección LOINC ${loinc} no permitida en CompositionAmbulatoryRDA.`,
                });
            }
            if (Array.isArray(sec && sec.entry)) {
                sec.entry.forEach((ref, ri) => {
                    const raw = ref && ref.reference ? String(ref.reference).trim() : '';
                    const rid = raw.startsWith('#') ? raw.slice(1) : raw.replace(/^[A-Za-z]+\//, '');
                    if (rid && !idSet.has(rid)) {
                        issues.push({
                            path: `Bundle.entry[].resource.section[${si}].entry[${ri}].reference`,
                            resourceType: 'Composition',
                            message: `Reference #${rid} no existe en Bundle.entry.resource.id.`,
                        });
                    }
                });
            }
        });
    }

    if (entries.some((e) => e && e.resource && e.resource.resourceType === 'MedicationStatement')) {
        issues.push({
            path: 'Bundle.entry',
            resourceType: 'Bundle',
            message: 'RDA Consulta Externa no permite MedicationStatement; use MedicationRequestRDA.',
        });
    }

    return issues;
}

function firstRdaceBundleIhceIssueMessage(bundle, options = {}) {
    const issues = collectRdaceBundleIhceIssues(bundle, options);
    return issues.length ? issues[0].message : '';
}

module.exports = {
    collectMedicationRequestIssues,
    collectRdaceBundleIhceIssues,
    firstRdaceBundleIhceIssueMessage,
};

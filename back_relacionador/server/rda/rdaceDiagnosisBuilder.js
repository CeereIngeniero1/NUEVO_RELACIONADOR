'use strict';

/**
 * Armado de ConditionRDA y Encounter.diagnosis (MainDiagnosis + Comorbidity-1..3)
 * según EncounterAmbulatoryRDA / ConditionRDA (IG MinSalud RDA Consulta Externa).
 */

const ICD10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10';
const ICD11_SYSTEM = 'http://hl7.org/fhir/sid/icd-11';
const CS_DIAG_ROLE = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDiagnosisRole';
const CONDITION_PROFILE_SUFFIX = 'ConditionRDA';

const COMORBIDITY_SLICES = [
    { id: 'Comorbidity-1', rank: 2 },
    { id: 'Comorbidity-2', rank: 3 },
    { id: 'Comorbidity-3', rank: 4 },
];

const MAX_ENCOUNTER_COMORBIDITIES = 3;

function str(v) {
    return v != null ? String(v).trim() : '';
}

/** ConditionRDA.code: slices ICD10 + ICD11 en el mismo CodeableConcept (IG). */
function buildConditionRdaCode({ cie10Code, cie10Display, cie11Code, cie11Display }) {
    const c10 = str(cie10Code);
    const d10 = str(cie10Display);
    const c11 = str(cie11Code);
    const d11 = str(cie11Display);
    const coding = [];
    if (c10) {
        coding.push({ system: ICD10_SYSTEM, code: c10, display: d10 || undefined });
    }
    if (c11) {
        coding.push({ system: ICD11_SYSTEM, code: c11, display: d11 || undefined });
    }
    if (!coding.length) return null;
    return {
        coding,
        text: d10 || d11 || c10 || c11,
    };
}

function getConditionRdaBase() {
    return {
        clinicalStatus: {
            coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
                display: 'Active',
            }],
        },
        verificationStatus: {
            coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                code: 'confirmed',
                display: 'Confirmed',
            }],
        },
        category: [{
            coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                code: 'encounter-diagnosis',
                display: 'Encounter Diagnosis',
            }],
        }],
    };
}

/**
 * Construye Condition principal + relacionados + antecedentes salud (como Conditions).
 * @returns {{ condPrincipalEntry, condRelacionadasEntries, condRelacionadasForEncounter, condAntecedentesSaludEntries, allConditionEntries }}
 */
function buildRdaceConditionEntries({
    head,
    diagRelacionados,
    antecedentesSalud,
    makeEntry,
    refOf,
    patientEntry,
    RDA_SD,
    parseIcd10FromText,
}) {
    const CONDITION_RDA_BASE = getConditionRdaBase();
    let conditionSeq = 0;

    const principalCode = buildConditionRdaCode({
        cie10Code: head.DiagPrincipalCIE10Codigo,
        cie10Display: head.DiagPrincipalCIE10Nombre,
        cie11Code: head.DiagnosticoIngresoCIE11Codigo,
        cie11Display: head.DiagnosticoIngresoCIE11Termino,
    });
    const condPrincipalEntry = principalCode ? makeEntry({
        resourceType: 'Condition',
        id: `Condition-${conditionSeq++}`,
        meta: { profile: [`${RDA_SD}/${CONDITION_PROFILE_SUFFIX}`] },
        ...CONDITION_RDA_BASE,
        subject: { reference: refOf(patientEntry) },
        code: principalCode,
    }) : null;

    const condRelacionadasForEncounter = [];
    const condRelacionadasEntries = (diagRelacionados || []).map((r) => {
        const code = buildConditionRdaCode({
            cie10Code: r.CodigoCIE10,
            cie10Display: r.NombreCIE10,
            cie11Code: r.CodigoCIE11,
            cie11Display: r.TerminoCIE11,
        });
        if (!code) return null;
        const entry = makeEntry({
            resourceType: 'Condition',
            id: `Condition-${conditionSeq++}`,
            meta: { profile: [`${RDA_SD}/${CONDITION_PROFILE_SUFFIX}`] },
            ...CONDITION_RDA_BASE,
            subject: { reference: refOf(patientEntry) },
            code,
        });
        if (str(r.CodigoCIE10) && condRelacionadasForEncounter.length < MAX_ENCOUNTER_COMORBIDITIES) {
            condRelacionadasForEncounter.push(entry);
        }
        return entry;
    }).filter(Boolean);

    const condAntecedentesSaludEntries = (antecedentesSalud || []).map((a) => {
        const parsed = parseIcd10FromText(a && a.Descripcion);
        if (!parsed.code) return null;
        return makeEntry({
            resourceType: 'Condition',
            id: `Condition-${conditionSeq++}`,
            meta: { profile: [`${RDA_SD}/${CONDITION_PROFILE_SUFFIX}`] },
            ...CONDITION_RDA_BASE,
            subject: { reference: refOf(patientEntry) },
            code: {
                coding: [{
                    system: ICD10_SYSTEM,
                    code: parsed.code,
                    display: parsed.display || undefined,
                }],
                text: parsed.display || parsed.code,
            },
        });
    }).filter(Boolean);

    const allConditionEntries = [
        ...(condPrincipalEntry ? [condPrincipalEntry] : []),
        ...condRelacionadasEntries,
        ...condAntecedentesSaludEntries,
    ];

    return {
        condPrincipalEntry,
        condRelacionadasEntries,
        condRelacionadasForEncounter,
        condAntecedentesSaludEntries,
        allConditionEntries,
    };
}

/**
 * Encounter.diagnosis: MainDiagnosis (1..1) + Comorbidity-1..3 (0..1 c/u).
 */
function buildEncounterDiagnosisEntries({
    condPrincipalEntry,
    condRelacionadasForEncounter,
    head,
    refOf,
    RDA_SD,
    CS_TIPO_DIAG,
}) {
    const diagnosis = [];
    if (condPrincipalEntry) {
        diagnosis.push({
            id: 'MainDiagnosis',
            ...(str(head.TipoDiagnosticoPrincipal) ? {
                extension: [{
                    url: `${RDA_SD}/ExtensionDiagnosisType`,
                    valueCoding: {
                        system: CS_TIPO_DIAG,
                        code: str(head.TipoDiagnosticoPrincipal),
                        display: str(head.NombreTipoDiagnosticoPrincipal) || undefined,
                    },
                }],
            } : {}),
            condition: { reference: refOf(condPrincipalEntry) },
            use: {
                coding: [{
                    system: CS_DIAG_ROLE,
                    code: '8319008',
                    display: 'diagnóstico primario',
                }],
            },
            rank: 1,
        });
    }

    (condRelacionadasForEncounter || []).forEach((entry, idx) => {
        const slice = COMORBIDITY_SLICES[idx];
        if (!slice || !entry) return;
        diagnosis.push({
            id: slice.id,
            condition: { reference: refOf(entry) },
            use: {
                coding: [{
                    system: CS_DIAG_ROLE,
                    code: '398192003',
                    display: 'comorbilidades',
                }],
            },
            rank: slice.rank,
        });
    });

    return diagnosis.length ? diagnosis : undefined;
}

/**
 * Construye recursos Condition (sin Bundle entry wrapper) para preview modular v2.
 */
function buildConditionResourcesForPreview({
    head,
    diagRelacionados,
    patientRef,
    RDA_SD,
}) {
    const CONDITION_PROFILE = `${RDA_SD}/${CONDITION_PROFILE_SUFFIX}`;
    const conditionBase = getConditionRdaBase();
    const resources = [];
    let seq = 0;

    const principalCode = buildConditionRdaCode({
        cie10Code: head.DiagPrincipalCIE10Codigo,
        cie10Display: head.DiagPrincipalCIE10Nombre,
        cie11Code: head.DiagnosticoIngresoCIE11Codigo,
        cie11Display: head.DiagnosticoIngresoCIE11Termino,
    });
    if (principalCode) {
        resources.push({
            resourceType: 'Condition',
            id: `Condition-${seq++}`,
            meta: { profile: [CONDITION_PROFILE] },
            ...conditionBase,
            ...(patientRef ? { subject: { reference: patientRef } } : {}),
            code: principalCode,
        });
    }

    for (const r of diagRelacionados || []) {
        const code = buildConditionRdaCode({
            cie10Code: r.CodigoCIE10,
            cie10Display: r.NombreCIE10,
            cie11Code: r.CodigoCIE11,
            cie11Display: r.TerminoCIE11,
        });
        if (!code) continue;
        resources.push({
            resourceType: 'Condition',
            id: `Condition-${seq++}`,
            meta: { profile: [CONDITION_PROFILE] },
            ...conditionBase,
            ...(patientRef ? { subject: { reference: patientRef } } : {}),
            code,
        });
    }

    return resources;
}

/**
 * Valida Encounter.diagnosis del bundle CE contra slices IG (1..4 entradas).
 * @returns {string|null} mensaje de error o null si válido
 */
function validateEncounterDiagnosisInBundle(encounter, refIdFromBundleReference) {
    if (!encounter || !Array.isArray(encounter.diagnosis)) {
        return null;
    }
    const dx = encounter.diagnosis;
    if (dx.length < 1 || dx.length > 4) {
        return 'Encounter.diagnosis debe contener entre 1 y 4 entradas (MainDiagnosis + hasta 3 comorbilidades).';
    }

    const main = dx.find((d) => d && d.id === 'MainDiagnosis');
    if (!main) {
        return 'Encounter.diagnosis debe incluir el slice MainDiagnosis.';
    }
    const mainRef = main.condition && main.condition.reference;
    if (mainRef && refIdFromBundleReference(mainRef) !== 'Condition-0') {
        return 'Encounter.diagnosis MainDiagnosis debe referenciar Condition-0.';
    }
    if (main.rank !== 1) {
        return 'Encounter.diagnosis MainDiagnosis debe tener rank 1.';
    }
    const mainUse = main.use && Array.isArray(main.use.coding) && main.use.coding[0];
    if (!mainUse || String(mainUse.code) !== '8319008') {
        return 'Encounter.diagnosis MainDiagnosis debe usar rol 8319008 (diagnóstico primario).';
    }

    const comorbidities = dx.filter((d) => d && /^Comorbidity-[123]$/.test(String(d.id || '')));
    if (comorbidities.length !== dx.length - 1) {
        return 'Encounter.diagnosis solo admite slices MainDiagnosis y Comorbidity-1..3.';
    }

    for (let i = 0; i < comorbidities.length; i++) {
        const expected = COMORBIDITY_SLICES[i];
        const item = comorbidities[i];
        if (!expected || item.id !== expected.id) {
            return `Encounter.diagnosis comorbilidad ${i + 1} debe usar id ${expected ? expected.id : 'Comorbidity-N'}.`;
        }
        if (item.rank !== expected.rank) {
            return `Encounter.diagnosis ${item.id} debe tener rank ${expected.rank}.`;
        }
        const useCode = item.use && Array.isArray(item.use.coding) && item.use.coding[0];
        if (!useCode || String(useCode.code) !== '398192003') {
            return `Encounter.diagnosis ${item.id} debe usar rol 398192003 (comorbilidades).`;
        }
        const ref = item.condition && item.condition.reference;
        if (!ref || !refIdFromBundleReference(ref)) {
            return `Encounter.diagnosis ${item.id} debe referenciar una Condition del bundle.`;
        }
    }

    return null;
}

module.exports = {
    ICD10_SYSTEM,
    ICD11_SYSTEM,
    CS_DIAG_ROLE,
    MAX_ENCOUNTER_COMORBIDITIES,
    buildConditionRdaCode,
    getConditionRdaBase,
    buildRdaceConditionEntries,
    buildEncounterDiagnosisEntries,
    buildConditionResourcesForPreview,
    validateEncounterDiagnosisInBundle,
};

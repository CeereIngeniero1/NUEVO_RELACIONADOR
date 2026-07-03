'use strict';

/**
 * Pruebas unitarias ligeras para rdaceDiagnosisBuilder (sin BD).
 * Ejecutar: node back_relacionador/server/rda/rdaceDiagnosisBuilder.test.js
 */

const assert = require('assert');
const {
    buildConditionRdaCode,
    buildRdaceConditionEntries,
    buildEncounterDiagnosisEntries,
    validateEncounterDiagnosisInBundle,
} = require('./rdaceDiagnosisBuilder');

const RDA_SD = 'https://fhir.minsalud.gov.co/rda/StructureDefinition';
const CS_TIPO_DIAG = 'https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSTipoDiagnosticoPrincipalVersion2';

function makeEntry(resource) {
    return { resource };
}

function refOf(entryOrId) {
    if (typeof entryOrId === 'string') return entryOrId.replace(/^#/, '');
    const r = entryOrId.resource;
    return `${r.resourceType}/${r.id}`;
}

function refIdFromBundleReference(reference) {
    const raw = String(reference || '').trim();
    const slash = raw.lastIndexOf('/');
    return slash >= 0 ? raw.slice(slash + 1) : raw.replace(/^#/, '');
}

// Dual coding principal CIE-10 + CIE-11 ingreso
const dual = buildConditionRdaCode({
    cie10Code: 'J06.9',
    cie10Display: 'IRA',
    cie11Code: 'CA40.Z',
    cie11Display: 'Infección respiratoria aguda',
});
assert.strictEqual(dual.coding.length, 2);
assert.strictEqual(dual.coding[0].system, 'http://hl7.org/fhir/sid/icd-10');
assert.strictEqual(dual.coding[1].system, 'http://hl7.org/fhir/sid/icd-11');

const head = {
    DiagPrincipalCIE10Codigo: 'J06.9',
    DiagPrincipalCIE10Nombre: 'IRA',
    DiagnosticoIngresoCIE11Codigo: 'CA40.Z',
    DiagnosticoIngresoCIE11Termino: 'Infección respiratoria aguda',
    TipoDiagnosticoPrincipal: '02',
    NombreTipoDiagnosticoPrincipal: 'Confirmado nuevo',
};
const diagRelacionados = [
    { CodigoCIE10: 'E11', NombreCIE10: 'DM2', CodigoCIE11: '5A11', TerminoCIE11: 'Diabetes' },
    { CodigoCIE10: 'I10', NombreCIE10: 'HTA', CodigoCIE11: null, TerminoCIE11: null },
    { CodigoCIE10: 'J45', NombreCIE10: 'Asma', CodigoCIE11: null, TerminoCIE11: null },
];
const patientEntry = makeEntry({ resourceType: 'Patient', id: 'CC-123' });

const built = buildRdaceConditionEntries({
    head,
    diagRelacionados,
    antecedentesSalud: [],
    makeEntry,
    refOf,
    patientEntry,
    RDA_SD,
    parseIcd10FromText: () => ({ code: null }),
});

assert.ok(built.condPrincipalEntry);
assert.strictEqual(built.condRelacionadasEntries.length, 3);
assert.strictEqual(built.condRelacionadasForEncounter.length, 3);
assert.strictEqual(built.allConditionEntries.length, 4);

const encounterDx = buildEncounterDiagnosisEntries({
    condPrincipalEntry: built.condPrincipalEntry,
    condRelacionadasForEncounter: built.condRelacionadasForEncounter,
    head,
    refOf,
    RDA_SD,
    CS_TIPO_DIAG,
});
assert.strictEqual(encounterDx.length, 4);
assert.strictEqual(encounterDx[0].id, 'MainDiagnosis');
assert.strictEqual(encounterDx[0].rank, 1);
assert.strictEqual(encounterDx[1].id, 'Comorbidity-1');
assert.strictEqual(encounterDx[1].rank, 2);
assert.strictEqual(encounterDx[3].id, 'Comorbidity-3');
assert.strictEqual(encounterDx[3].rank, 4);

const encounter = { diagnosis: encounterDx };
const validErr = validateEncounterDiagnosisInBundle(encounter, refIdFromBundleReference);
assert.strictEqual(validErr, null);

// Solo principal
const soloMain = buildEncounterDiagnosisEntries({
    condPrincipalEntry: built.condPrincipalEntry,
    condRelacionadasForEncounter: [],
    head,
    refOf,
    RDA_SD,
    CS_TIPO_DIAG,
});
assert.strictEqual(soloMain.length, 1);

// CIE-11 only related no va a Encounter
const relCie11Only = buildRdaceConditionEntries({
    head,
    diagRelacionados: [{ CodigoCIE10: null, CodigoCIE11: '5A11', TerminoCIE11: 'DM' }],
    antecedentesSalud: [],
    makeEntry,
    refOf,
    patientEntry,
    RDA_SD,
    parseIcd10FromText: () => ({ code: null }),
});
assert.strictEqual(relCie11Only.condRelacionadasEntries.length, 1);
assert.strictEqual(relCie11Only.condRelacionadasForEncounter.length, 0);

console.log('rdaceDiagnosisBuilder.test.js: OK');

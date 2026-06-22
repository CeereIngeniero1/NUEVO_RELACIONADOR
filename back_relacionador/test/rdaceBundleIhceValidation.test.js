const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    collectMedicationRequestIssues,
    collectRdaceBundleIhceIssues,
} = require('../server/rda/rdaceBundleIhceValidation');

const VAD_SYSTEM = 'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD';
const MT_SYSTEM = 'https://fhir.minsalud.gov.co/rda/CodeSystem/MedicationTime';
const UMM_SYSTEM = 'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM';

const mockMedicationCatalogs = {
    vad: { '001': { codigo: '001', system_url: VAD_SYSTEM, display: 'ORAL' } },
    medicationTime: {
        '2': { codigo: '2', system_url: MT_SYSTEM, display: 'Días' },
    },
    umm: { '1': { codigo: '1', system_url: UMM_SYSTEM, display: 'mg', unidad: 'mg' } },
};

const validDosageInstruction = {
    route: {
        coding: [{
            system: VAD_SYSTEM,
            code: '001',
            display: 'ORAL',
        }],
    },
    timing: {
        repeat: { duration: 7, durationUnit: 'd' },
        code: {
            coding: [{
                system: MT_SYSTEM,
                code: '2',
                display: 'Días',
            }],
        },
    },
    doseAndRate: [{
        doseQuantity: {
            value: 500,
            unit: 'mg',
            system: UMM_SYSTEM,
            code: '1',
        },
        rateQuantity: {
            value: 2,
            unit: 'Días',
            system: MT_SYSTEM,
            code: '2',
        },
    }],
};

function baseMedicationRequest(overrides = {}) {
    return {
        resourceType: 'MedicationRequest',
        id: 'MedicationRequest-0',
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
            coding: [{
                system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/MipresINN',
                code: '10001',
                display: 'Acetaminofén',
            }],
        },
        subject: { reference: '#Patient-0' },
        encounter: { reference: '#Encounter-0' },
        requester: { reference: '#Practitioner-0' },
        reasonCode: [{ coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'Z00.0' }] }],
        authoredOn: '2026-06-22T14:00:00-05:00',
        dosageInstruction: [validDosageInstruction],
        ...overrides,
    };
}

describe('rdaceBundleIhceValidation', () => {
    it('rechaza MedicationRequest sin route/timing/doseAndRate', () => {
        const r = baseMedicationRequest({
            dosageInstruction: [{ text: 'Solo texto narrativo' }],
        });
        const issues = collectMedicationRequestIssues(r, 11);
        assert.ok(issues.some((i) => i.path.includes('dosageInstruction')));
    });

    it('acepta MedicationRequest con dosageInstruction estructurado', () => {
        const issues = collectMedicationRequestIssues(
            baseMedicationRequest(),
            11,
            { medicationCatalogs: mockMedicationCatalogs }
        );
        assert.equal(issues.length, 0);
    });

    it('collectRdaceBundleIhceIssues detecta referencias rotas en Composition.section', () => {
        const bundle = {
            entry: [
                {
                    resource: {
                        resourceType: 'Composition',
                        section: [{
                            code: { coding: [{ code: '10160-0' }] },
                            entry: [{ reference: '#MedicationRequest-99' }],
                        }],
                    },
                },
                {
                    resource: baseMedicationRequest(),
                },
            ],
        };
        const issues = collectRdaceBundleIhceIssues(bundle);
        assert.ok(issues.some((i) => i.message.includes('MedicationRequest-99')));
    });
});

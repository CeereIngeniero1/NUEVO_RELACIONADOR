const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    buildRdaceOccupationSection,
    buildRdaceMedicationsSection,
    buildRdaceProblemsSection,
    buildAntecedentesFarmacologicosNarrative,
    emptyRdaceSection,
    validateRdaceCompositionSections,
    REQUIRED_RDACE_SECTION_LOINCS,
    RDACE_SECTION_LOINC,
} = require('../server/rda/rdaceCompositionSections');

describe('rdaceCompositionSections', () => {
    it('buildRdaceOccupationSection sin ocupación devuelve emptyReason 74208-0', () => {
        const sec = buildRdaceOccupationSection(null, () => '#x');
        assert.equal(sec.code.coding[0].code, '74208-0');
        assert.ok(sec.emptyReason);
        assert.equal(sec.entry, undefined);
    });

    it('buildRdaceOccupationSection con ocupación incluye entry', () => {
        const entry = { resource: { resourceType: 'Observation', id: 'Observation-1' } };
        const sec = buildRdaceOccupationSection(entry, () => '#Observation-1');
        assert.equal(sec.code.coding[0].code, '74208-0');
        assert.equal(sec.entry[0].reference, '#Observation-1');
        assert.equal(sec.emptyReason, undefined);
    });

    it('validateRdaceCompositionSections rechaza 8 secciones (caso Ministerio)', () => {
        const eight = [
            emptyRdaceSection('Pagadores', RDACE_SECTION_LOINC.PAYERS, 'Payment sources Document'),
            emptyRdaceSection('Incapacidad', RDACE_SECTION_LOINC.INCAPACITY, 'Worker Sick leave form'),
            emptyRdaceSection('Diagnósticos', RDACE_SECTION_LOINC.PROBLEMS, 'Problem list - Reported'),
            emptyRdaceSection('Alergias', RDACE_SECTION_LOINC.ALLERGIES, 'Allergies and adverse reactions Document'),
            emptyRdaceSection('Riesgo', RDACE_SECTION_LOINC.RISK_FACTORS, 'Risk assessment and screening note'),
            emptyRdaceSection('Medicamentos', RDACE_SECTION_LOINC.MEDICATIONS, 'History of Medication use Narrative'),
            emptyRdaceSection('Órdenes', RDACE_SECTION_LOINC.SERVICE_REQUESTS, 'Orders for services Document'),
            emptyRdaceSection('PDF', RDACE_SECTION_LOINC.SUPPORT_DOCS, 'Addendum Document'),
        ];
        const err = validateRdaceCompositionSections(eight);
        assert.match(err, /actual: 8/);
    });

    it('validateRdaceCompositionSections acepta 9 secciones con ocupación vacía', () => {
        const nine = REQUIRED_RDACE_SECTION_LOINCS.map((loinc) =>
            emptyRdaceSection('T', loinc, 'D')
        );
        assert.equal(validateRdaceCompositionSections(nine), '');
    });

    it('buildRdaceMedicationsSection antecedentes solo narrativa sin MedicationRequest', () => {
        const sec = buildRdaceMedicationsSection({
            prescriptionMedEntries: [],
            antecedentMedRows: [{ codigo: '10001', nombre: 'EPROCICLOVIR', observacion: '2 dosis' }],
            refOf: () => '#x',
            emptyRdaceSection,
        });
        assert.equal(sec.code.coding[0].code, '10160-0');
        assert.ok(sec.text);
        assert.equal(sec.entry, undefined);
        assert.match(sec.text.div, /EPROCICLOVIR/);
    });

    it('buildRdaceMedicationsSection prescripción con entry y antecedente con text', () => {
        const medEntry = { resource: { id: 'MedicationRequest-0' } };
        const sec = buildRdaceMedicationsSection({
            prescriptionMedEntries: [medEntry],
            antecedentMedRows: [{ nombre: 'Ibuprofeno' }],
            refOf: () => '#MedicationRequest-0',
            emptyRdaceSection,
        });
        assert.equal(sec.entry.length, 1);
        assert.ok(sec.text);
    });

    it('buildRdaceProblemsSection antecedentes salud y familiares como narrativa', () => {
        const condEntry = { resource: { id: 'Condition-0' } };
        const sec = buildRdaceProblemsSection({
            conditionEntries: [condEntry],
            antecedentSaludRows: [{ descripcion: 'P001 - FETO AFECTADO' }],
            antecedentFamRows: [{ parentescoLabel: 'Madre', descripcion: 'E10 - DIABETES' }],
            refOf: () => '#Condition-0',
            emptyRdaceSection,
        });
        assert.equal(sec.code.coding[0].code, '11450-4');
        assert.equal(sec.entry.length, 1);
        assert.ok(sec.text);
        assert.match(sec.text.div, /personales de salud/i);
        assert.match(sec.text.div, /familiares/i);
        assert.match(sec.text.div, /Madre/);
    });

    it('buildRdaceProblemsSection solo narrativa sin Condition', () => {
        const sec = buildRdaceProblemsSection({
            conditionEntries: [],
            antecedentFamRows: [{ parentescoLabel: 'Padre', descripcion: 'I10 - HTA' }],
            refOf: () => '#x',
            emptyRdaceSection,
        });
        assert.equal(sec.entry, undefined);
        assert.match(sec.text.div, /Padre/);
    });
});

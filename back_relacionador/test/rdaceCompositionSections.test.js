const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    buildRdaceOccupationSection,
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
});

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    isTelefonoPacienteValidoParaFhir,
    telefonoPacienteParaFhir,
    esErrorIhcePatientTelecom,
} = require('../server/rda/pacienteTelecomFhir');

describe('pacienteTelecomFhir', () => {
    it('acepta celular colombiano 10 dígitos', () => {
        assert.equal(isTelefonoPacienteValidoParaFhir('3001234567'), true);
        assert.equal(telefonoPacienteParaFhir('300 123 4567'), '3001234567');
    });

    it('rechaza fijo o formato inválido', () => {
        assert.equal(isTelefonoPacienteValidoParaFhir('(033)-212-34-53'), false);
        assert.equal(telefonoPacienteParaFhir('(033)-212-34-53'), null);
    });

    it('detecta error IHCE Patient.telecom', () => {
        const err = "Instance count for 'Patient.telecom' is 1, which is not within the specified cardinality of 0..0";
        assert.equal(esErrorIhcePatientTelecom(err), true);
    });
});

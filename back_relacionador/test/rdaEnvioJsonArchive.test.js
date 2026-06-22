const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    extractDocumentoFromBundle,
    extractNombrePacienteFromBundle,
    buildPatientArchiveDirName,
} = require('../server/rda/rdaEnvioJsonArchive');

const sampleBundle = {
    entry: [{
        resource: {
            resourceType: 'Patient',
            id: 'CC-53059528',
            name: [{
                use: 'official',
                family: 'Delgado',
                given: ['Monica', 'Andrea'],
            }],
        },
    }],
};

describe('rdaEnvioJsonArchive', () => {
    it('extrae documento y nombre del Patient en el bundle', () => {
        assert.equal(extractDocumentoFromBundle(sampleBundle), 'CC_53059528');
        assert.equal(extractNombrePacienteFromBundle(sampleBundle), 'Monica Andrea Delgado');
    });

    it('buildPatientArchiveDirName combina documento y nombre', () => {
        const dir = buildPatientArchiveDirName('CC_53059528', 'Monica Andrea Delgado');
        assert.match(dir, /^CC_53059528_Monica/);
        assert.match(dir, /Delgado/);
    });

    it('sin nombre usa solo documento', () => {
        assert.equal(buildPatientArchiveDirName('CC_53059528', ''), 'CC_53059528');
    });
});

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    extractDocumentoFromBundle,
    extractCedulaFromBundle,
    extractNombrePacienteFromBundle,
    extractRdaDateTimeFromBundle,
    buildArchiveFileName,
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
    }, {
        resource: {
            resourceType: 'Composition',
            date: '2026-06-22T10:57:45-05:00',
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

    it('extrae cedula numerica del Patient', () => {
        assert.equal(extractCedulaFromBundle(sampleBundle), '53059528');
    });

    it('extrae fecha/hora del RDA desde Composition.date', () => {
        assert.equal(extractRdaDateTimeFromBundle(sampleBundle), '20260622_105745');
    });

    it('buildArchiveFileName usa cedula, tipo y fecha del RDA', () => {
        assert.equal(
            buildArchiveFileName({ bundle: sampleBundle, tipo: 'ce' }),
            '53059528_CE_20260622_105745.json'
        );
        assert.equal(
            buildArchiveFileName({ bundle: sampleBundle, tipo: 'paciente' }),
            '53059528_PAC_20260622_105745.json'
        );
    });
});

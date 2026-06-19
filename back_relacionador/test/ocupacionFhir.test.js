const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    ID_OCUPACION_SIN_ASIGNAR,
    isOcupacionInformadaParaFhir,
    normalizeCiou88acCode,
    sanitizeRdaceOccupationBundle,
} = require('../server/rda/ocupacionFhir');

describe('ocupacionFhir', () => {
    it('Id 1 Sin asignar no va al FHIR', () => {
        assert.equal(ID_OCUPACION_SIN_ASIGNAR, 1);
        assert.equal(isOcupacionInformadaParaFhir({
            idOcupacion: 1,
            codigoOcupacion: null,
            ocupacionNombre: 'Sin asignar',
        }), false);
    });

    it('ocupación CIUO válida sí va al FHIR', () => {
        assert.equal(isOcupacionInformadaParaFhir({
            idOcupacion: 401,
            codigoOcupacion: '0110',
            ocupacionNombre: 'Oficiales de las Fuerzas Militares',
        }), true);
        assert.equal(normalizeCiou88acCode('110'), '0110');
    });

    it('sin código CIUO no va al FHIR aunque haya id', () => {
        assert.equal(isOcupacionInformadaParaFhir({
            idOcupacion: 99,
            codigoOcupacion: '',
            ocupacionNombre: 'Algo',
        }), false);
    });

    it('sanitize elimina Observation sin code y deja emptyReason 74208-0', () => {
        const bundle = {
            resourceType: 'Bundle',
            entry: [
                {
                    resource: {
                        resourceType: 'Composition',
                        section: [{
                            code: { coding: [{ code: '74208-0' }] },
                            entry: [{ reference: '#Observation-1' }],
                        }],
                    },
                },
                {
                    resource: {
                        resourceType: 'Observation',
                        id: 'Observation-1',
                        meta: { profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/PatientOccupationAtEncounterRDA'] },
                        valueCodeableConcept: {
                            coding: [{ system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/CIUO88AC', display: 'Sin asignar' }],
                        },
                    },
                },
            ],
        };
        const r = sanitizeRdaceOccupationBundle(bundle);
        assert.equal(r.removed, 1);
        assert.equal(bundle.entry.length, 1);
        const sec = bundle.entry[0].resource.section[0];
        assert.ok(sec.emptyReason);
        assert.equal(sec.entry, undefined);
    });
});

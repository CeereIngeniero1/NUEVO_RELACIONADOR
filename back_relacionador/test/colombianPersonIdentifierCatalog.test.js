'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const {
    buildColombianPersonIdentifierCoding,
    buildNationalPersonIdentifier,
    resolvePersonIdentifierNamingSystem,
    PersonIdentifierDisplayError,
    CS_COLOMBIAN_PERSON_IDENTIFIER,
    NS_RNEC,
} = require('../server/rda/colombianPersonIdentifierCatalog');

describe('colombianPersonIdentifierCatalog', () => {
    test('PA incluye display Pasaporte desde catálogo oficial', () => {
        const coding = buildColombianPersonIdentifierCoding('PA');
        assert.equal(coding.system, CS_COLOMBIAN_PERSON_IDENTIFIER);
        assert.equal(coding.code, 'PA');
        assert.equal(coding.display, 'Pasaporte');
    });

    test('CC incluye display Cédula ciudadanía desde catálogo oficial', () => {
        const coding = buildColombianPersonIdentifierCoding('CC');
        assert.equal(coding.system, CS_COLOMBIAN_PERSON_IDENTIFIER);
        assert.equal(coding.code, 'CC');
        assert.equal(coding.display, 'Cédula ciudadanía');
    });

    test('Patient identifier PA completo con RNEC (IG PatientRDA)', () => {
        const id = buildNationalPersonIdentifier({
            docTypeCode: 'PA',
            value: 'AB123456',
        });
        assert.ok(id);
        assert.equal(id.system, NS_RNEC);
        assert.equal(id.value, 'AB123456');
        const col = id.type.coding.find((c) => c.system === CS_COLOMBIAN_PERSON_IDENTIFIER);
        assert.ok(col);
        assert.equal(col.code, 'PA');
        assert.equal(col.display, 'Pasaporte');
    });

    test('Practitioner identifier CC completo con RNEC', () => {
        const id = buildNationalPersonIdentifier({
            docTypeCode: 'CC',
            value: '71733864',
        });
        assert.ok(id);
        assert.equal(id.system, NS_RNEC);
        assert.equal(resolvePersonIdentifierNamingSystem('PA'), NS_RNEC);
        const col = id.type.coding.find((c) => c.system === CS_COLOMBIAN_PERSON_IDENTIFIER);
        assert.ok(col);
        assert.equal(col.code, 'CC');
        assert.equal(col.display, 'Cédula ciudadanía');
    });

    test('prioriza display de BD sobre catálogo', () => {
        const coding = buildColombianPersonIdentifierCoding('CC', 'Texto BD custom');
        assert.equal(coding.display, 'Texto BD custom');
    });

    test('código desconocido sin display en BD lanza error controlado', () => {
        assert.throws(
            () => buildColombianPersonIdentifierCoding('ZZZ'),
            (err) => err instanceof PersonIdentifierDisplayError && err.code === 'RDA_PERSON_IDENTIFIER_DISPLAY_MISSING',
        );
    });
});

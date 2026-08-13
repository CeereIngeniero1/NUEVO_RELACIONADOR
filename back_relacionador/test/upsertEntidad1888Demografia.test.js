'use strict';

const assert = require('assert');
const {
    upsertEntidad1888Demografia,
    ensureEntidad1888Row,
} = require('../server/rda/upsertEntidad1888Demografia');

function mockSql() {
    return {
        NVarChar: (n) => ({ type: 'NVarChar', n }),
        Int: { type: 'Int' },
        VarChar: (n) => ({ type: 'VarChar', n }),
    };
}

function mockPool(handler) {
    const inputs = {};
    const request = {
        input(name, _type, value) {
            inputs[name] = value;
            return request;
        },
        async query(sqlText) {
            return handler({ sqlText, inputs });
        },
    };
    return {
        request() {
            return request;
        },
    };
}

async function run() {
    await upsertEntidad1888Demografia(mockPool(() => ({})), mockSql(), {})
        .then(() => {
            throw new Error('expected reject for empty documento');
        })
        .catch((err) => {
            assert.strictEqual(err.code, 'ENTIDAD1888_DOCUMENTO_REQUERIDO');
        });

    const out = await upsertEntidad1888Demografia(
        mockPool(({ sqlText, inputs }) => {
            assert.ok(/LTRIM\(RTRIM\(\[Documento Entidad\]\)\)/.test(sqlText));
            assert.ok(/\[Id Pais Nacionalidad\] = @IdNacionalidad/.test(sqlText));
            assert.ok(/\[Id Pais Recidencia\] = @IdResidencia/.test(sqlText));
            assert.strictEqual(inputs.Documento, '10321830');
            assert.strictEqual(inputs.IdNacionalidad, 796);
            assert.strictEqual(inputs.IdResidencia, 796);
            assert.strictEqual(inputs.IdMunicipio, 1);
            return { recordset: [{ RowsAffected: 1, WasInsert: 0 }] };
        }),
        mockSql(),
        {
            Documento: ' 10321830 ',
            IdNacionalidad: '796',
            IdResidencia: 796,
            IdMunicipio: '1',
            Talla: '175',
            Peso: '62',
        }
    );
    assert.strictEqual(out.entidad1888RowsAffected, 1);
    assert.strictEqual(out.documento, '10321830');
    assert.strictEqual(out.IdPaisNacionalidad, 796);
    assert.strictEqual(out.IdPaisRecidencia, 796);

    await upsertEntidad1888Demografia(
        mockPool(() => ({ recordset: [{ RowsAffected: 0, WasInsert: 0 }] })),
        mockSql(),
        { Documento: '1' }
    )
        .then(() => {
            throw new Error('expected reject for zero rows');
        })
        .catch((err) => {
            assert.strictEqual(err.code, 'ENTIDAD1888_ZERO_ROWS');
        });

    const ensured = await ensureEntidad1888Row(
        mockPool(({ sqlText, inputs }) => {
            assert.ok(/LTRIM\(RTRIM\(\[Documento Entidad\]\)\)/.test(sqlText));
            assert.strictEqual(inputs.DocumentoPaciente, 'ABC');
            return { recordset: [{ Created: 1 }] };
        }),
        mockSql(),
        ' ABC '
    );
    assert.strictEqual(ensured.created, true);
    assert.strictEqual(ensured.documento, 'ABC');

    console.log('upsertEntidad1888Demografia.test.js: OK');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

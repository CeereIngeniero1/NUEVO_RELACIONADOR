'use strict';

/**
 * Marcas de envío IHCE en cabeceras RDA:
 *   [Enviado] / [Enviado pruebas]
 *
 *   0 = Pendiente de envío (aparece en RDA pendientes)
 *   1 = Enviado OK a IHCE
 *   2 = Guardado localmente, NO reenviable (ya existe en IHCE / periodo no válido)
 *       → no aparece en pendientes (filtro ISNULL(col,0)=0)
 *
 * No usar [Id Estado] para esto: los listados de pendientes miran solo Enviado*.
 */

const RDA_ENVIO_PENDIENTE = 0;
const RDA_ENVIO_OK = 1;
const RDA_ENVIO_NO_REENVIBLE = 2;

function responseBodyToText(body) {
    if (body == null) return '';
    if (typeof body === 'string') return body;
    try {
        return JSON.stringify(body);
    } catch (_) {
        return String(body);
    }
}

/**
 * Detecta respuestas IHCE donde el RDA ya no debe reintentarse
 * (duplicado Composition/Encounter o invariante de periodo).
 */
function isIhceNoReenviableResponse(body) {
    const t = responseBodyToText(body);
    if (!t) return false;

    if (/already\s*exist/i.test(t) && (/Composition/i.test(t) || /Encounter/i.test(t))) {
        return true;
    }
    if (/inv-enc-period-valid-range/i.test(t)) return true;
    if (/fecha del encuentro.*no puede ser mayor a la fecha actual/i.test(t)) return true;
    if (/start\s*<=\s*now\(\)/i.test(t) && /end\s*<=\s*now\(\)/i.test(t)) return true;

    return false;
}

/**
 * @param {object} opts
 * @param {import('mssql').ConnectionPool} opts.pool
 * @param {import('mssql')} opts.sql
 * @param {'paciente'|'rdace'} opts.kind
 * @param {number} opts.id
 * @param {'prod'|'sandbox'} opts.ambiente
 * @param {number} opts.valor  0|1|2
 */
async function setRdaEnvioMarca({ pool, sql, kind, id, ambiente, valor }) {
    const n = Number(valor);
    if (![RDA_ENVIO_PENDIENTE, RDA_ENVIO_OK, RDA_ENVIO_NO_REENVIBLE].includes(n)) {
        throw new Error(`Valor de envío RDA inválido: ${valor}`);
    }
    const idNum = parseInt(id, 10);
    if (!Number.isFinite(idNum)) throw new Error('Id RDA inválido');

    const isProd = ambiente === 'prod';
    const col = isProd ? '[Enviado]' : '[Enviado pruebas]';

    if (kind === 'rdace') {
        await pool
            .request()
            .input('Id', sql.Int, idNum)
            .input('Valor', sql.Int, n)
            .query(`
                UPDATE [dbo].[Evaluacion Entidad RDA Consulta Externa]
                SET ${col} = @Valor
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id
            `);
        return { kind: 'rdace', id: idNum, columna: isProd ? 'Enviado' : 'Enviado pruebas', valor: n };
    }

    await pool
        .request()
        .input('Id', sql.Int, idNum)
        .input('Valor', sql.Int, n)
        .query(`
            UPDATE [dbo].[Evaluacion Entidad RDA]
            SET ${col} = @Valor
            WHERE [Id Evaluacion Entidad RDA] = @Id
        `);
    return { kind: 'paciente', id: idNum, columna: isProd ? 'Enviado' : 'Enviado pruebas', valor: n };
}

module.exports = {
    RDA_ENVIO_PENDIENTE,
    RDA_ENVIO_OK,
    RDA_ENVIO_NO_REENVIBLE,
    isIhceNoReenviableResponse,
    setRdaEnvioMarca,
};

'use strict';

const { buildRdaceResumenClinicoPdfBuffer } = require('./rdaceResumenPdf');

const str = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);

/**
 * Persiste el PDF binario y la fecha de generación en la cabecera RDACE.
 */
async function persistRdacePdf(pool, sql, id, buffer) {
    await pool.request()
        .input('Id', sql.Int, id)
        .input('Pdf', sql.VarBinary(sql.MAX), buffer)
        .input('Fecha', sql.DateTime2, new Date())
        .query(`
            UPDATE [dbo].[Evaluacion Entidad RDA Consulta Externa]
            SET [Contenido Documento PDF] = @Pdf,
                [Fecha Generacion Documento PDF] = @Fecha
            WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id
        `);
}

/**
 * Devuelve buffer PDF: reutiliza el almacenado si existe y no se fuerza regeneración.
 * Añade a aggregate los metadatos de IPS usados en narrativa PDF (mismos overrides que FhirBundle).
 */
async function getOrBuildRdacePdfBuffer({
    pool,
    sql,
    id,
    aggregate,
    forceRegenerate = false,
    reqBody = {},
}) {
    if (!forceRegenerate && aggregate.storedPdfBuffer && aggregate.storedPdfBuffer.length > 0) {
        return aggregate.storedPdfBuffer;
    }

    const codPrest = str(aggregate.head.CodigoPrestador);
    const nitIpsOverride = str(reqBody.overrideNitPrestadorIPS)
        || str(process.env.IHCE_RDACE_DEFAULT_NIT_IPS);
    const nomIpsOverride = str(reqBody.overrideNombrePrestadorIPS)
        || str(process.env.IHCE_RDACE_DEFAULT_NOMBRE_IPS);
    const nombreIpsDisplay = codPrest ? (nomIpsOverride || `IPS (${codPrest})`) : '';

    const aggForPdf = {
        ...aggregate,
        nombreIpsDisplay,
        nitIpsOverride,
        nomIpsOverride,
    };

    const buffer = await buildRdaceResumenClinicoPdfBuffer(aggForPdf, { idEvaluacion: id });
    try {
        await persistRdacePdf(pool, sql, id, buffer);
    } catch (e) {
        console.error('[RDACE] No se pudo persistir PDF en BD (el buffer se devuelve igual):', e.message || e);
    }
    return buffer;
}

module.exports = { getOrBuildRdacePdfBuffer, persistRdacePdf };

'use strict';

const { buildRdaceResumenClinicoPdfBuffer } = require('./rdaceResumenPdf');

const str = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);

/**
 * Persiste el PDF binario y la fecha de generación en la cabecera RDACE.
 */
async function persistRdacePdf(pool, sql, id, buffer) {
    const cols = await pool.request().query(`
        SELECT
            CASE WHEN COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Contenido Documento PDF') IS NULL THEN 0 ELSE 1 END AS HasPdfBin,
            CASE WHEN COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Fecha Generacion Documento PDF') IS NULL THEN 0 ELSE 1 END AS HasPdfDate,
            CASE WHEN COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Contenido Documento PDF Base64') IS NULL THEN 0 ELSE 1 END AS HasPdfBase64
    `);
    const colInfo = (cols.recordset && cols.recordset[0]) || {};
    const hasPdfBin = Number(colInfo.HasPdfBin) === 1;
    const hasPdfDate = Number(colInfo.HasPdfDate) === 1;
    const hasPdfBase64 = Number(colInfo.HasPdfBase64) === 1;

    if (!hasPdfBin && !hasPdfBase64) {
        throw new Error(
            'No existe columna para persistir PDF en [Evaluacion Entidad RDA Consulta Externa]. ' +
            'Ejecute SQL/1888/ALTER_RDACE_ContenidoDocumentoPdf.sql o el patch equivalente.'
        );
    }

    const sets = [];
    const req = pool.request()
        .input('Id', sql.Int, id)
        .input('Fecha', sql.DateTime2, new Date());

    if (hasPdfBin) {
        req.input('PdfBin', sql.VarBinary(sql.MAX), buffer);
        sets.push('[Contenido Documento PDF] = @PdfBin');
        if (hasPdfDate) sets.push('[Fecha Generacion Documento PDF] = @Fecha');
    }
    if (hasPdfBase64) {
        req.input('PdfBase64', sql.NVarChar(sql.MAX), buffer.toString('base64'));
        sets.push('[Contenido Documento PDF Base64] = @PdfBase64');
    }

    await req.query(`
        UPDATE [dbo].[Evaluacion Entidad RDA Consulta Externa]
        SET ${sets.join(',\n            ')}
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

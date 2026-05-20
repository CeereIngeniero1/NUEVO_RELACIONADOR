const { sql, poolPromise } = require('../db2');

const ID_TIPO_EVALUACION_HC = 4;

/**
 * Estado RIPS de una evaluación HC: fila en [Evaluación Entidad Rips] y flag [Rips] en entidad.
 */
async function consultarRipsPorEvaluacion(idEvaluacionEntidad) {
    const id = Number.parseInt(idEvaluacionEntidad, 10);
    if (Number.isNaN(id) || id <= 0) {
        throw new Error('Id de evaluación inválido.');
    }

    const pool = await poolPromise;
    const result = await pool
        .request()
        .input('IdEvaluacion', sql.Int, id)
        .query(`
            SELECT TOP (1)
                ev.[Id Evaluación Entidad] AS IdEvaluacionEntidad,
                ev.[Id Estado] AS IdEstado,
                ev.[Rips] AS FlagRipsEntidad,
                evr.[Id Evaluación Entidad Rips] AS IdEvaluacionEntidadRips,
                evr.[Id Acto Quirúrgico] AS IdActoQuirurgico,
                evr.[Codigo Rips] AS CodigoRips1,
                evr.[Codigo Rips2] AS CodigoRips2,
                evr.[Diagnostico Rips] AS DiagnosticoRips1,
                evr.[Diagnostico Rips2] AS DiagnosticoRips2,
                evr.[Id Factura] AS IdFactura,
                evr.[Id Plan de Tratamiento] AS IdPlanTratamiento
            FROM [dbo].[Evaluación Entidad] ev
            LEFT JOIN [dbo].[Evaluación Entidad Rips] evr
                ON evr.[Id Evaluación Entidad] = ev.[Id Evaluación Entidad]
            WHERE ev.[Id Evaluación Entidad] = @IdEvaluacion
              AND ev.[Id Tipo de Evaluación] = ${ID_TIPO_EVALUACION_HC}
        `);

    const row = result.recordset[0];
    if (!row) return null;

    let tipoRips = null;
    const acto = Number(row.IdActoQuirurgico);
    if (acto === 1) tipoRips = 'AC';
    else if (acto === 2) tipoRips = 'AP';

    const tieneRipsRegistrado = row.IdEvaluacionEntidadRips != null;
    const marcadaSinRips = Number(row.FlagRipsEntidad) === 0 && !tieneRipsRegistrado;

    return {
        idEvaluacionEntidad: row.IdEvaluacionEntidad,
        idEstado: row.IdEstado,
        tieneRipsRegistrado,
        marcadaSinRips,
        idEvaluacionEntidadRips: row.IdEvaluacionEntidadRips,
        tipoRips,
        resumen: tieneRipsRegistrado
            ? `RIPS ${tipoRips || ''} #${row.IdEvaluacionEntidadRips}`
            : marcadaSinRips
              ? 'Marcada sin RIPS'
              : 'Sin RIPS asignado',
    };
}

module.exports = {
    consultarRipsPorEvaluacion,
};

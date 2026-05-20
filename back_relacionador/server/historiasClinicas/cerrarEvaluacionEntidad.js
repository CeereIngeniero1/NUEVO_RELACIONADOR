const { sql, poolPromise } = require('../db2');
const {
    ID_ESTADO_ABIERTO,
    ID_ESTADO_CERRADO,
} = require('./listarEvolucionesPaciente');

const ID_TIPO_EVALUACION_HC = 4;

/**
 * Pasa una HC guardada de Abierto (8) a Cerrado (7).
 */
async function cerrarHistoriaClinica(idEvaluacionEntidad) {
    const id = Number.parseInt(idEvaluacionEntidad, 10);
    if (Number.isNaN(id) || id <= 0) {
        throw new Error('Id de evaluación inválido.');
    }

    const pool = await poolPromise;
    const check = await pool
        .request()
        .input('IdEvaluacion', sql.Int, id)
        .query(`
            SELECT TOP (1)
                ev.[Id Evaluación Entidad] AS IdEvaluacionEntidad,
                ev.[Id Estado] AS IdEstado,
                ev.[Id Tipo de Evaluación] AS IdTipoEvaluacion
            FROM [dbo].[Evaluación Entidad] ev
            WHERE ev.[Id Evaluación Entidad] = @IdEvaluacion
        `);

    const row = check.recordset[0];
    if (!row) {
        throw new Error('Evaluación no encontrada.');
    }
    if (Number(row.IdTipoEvaluacion) !== ID_TIPO_EVALUACION_HC) {
        throw new Error('El registro no corresponde a una historia clínica (tipo 4).');
    }

    const idEstadoActual = Number(row.IdEstado);
    if (idEstadoActual === ID_ESTADO_CERRADO) {
        throw new Error('Esta historia clínica ya está cerrada.');
    }
    if (idEstadoActual !== ID_ESTADO_ABIERTO) {
        throw new Error(
            `Solo se puede cerrar una evolución en estado Abierto (8). Estado actual: ${idEstadoActual}.`
        );
    }

    const update = await pool
        .request()
        .input('IdEvaluacion', sql.Int, id)
        .input('IdEstadoCerrado', sql.Int, ID_ESTADO_CERRADO)
        .query(`
            UPDATE [dbo].[Evaluación Entidad]
            SET [Id Estado] = @IdEstadoCerrado
            WHERE [Id Evaluación Entidad] = @IdEvaluacion
              AND [Id Tipo de Evaluación] = ${ID_TIPO_EVALUACION_HC}
              AND [Id Estado] = ${ID_ESTADO_ABIERTO}
        `);

    if (!update.rowsAffected || update.rowsAffected[0] === 0) {
        throw new Error('No se pudo cerrar la evaluación (conflicto de estado o registro inexistente).');
    }

    return {
        idEvaluacionEntidad: id,
        idEstado: ID_ESTADO_CERRADO,
        estadoTexto: 'Cerrado',
        estadoClase: 'cerrado',
    };
}

module.exports = {
    cerrarHistoriaClinica,
};

const { sql, poolPromise } = require('../db2');

const ID_TIPO_EVALUACION_HC = 4;
const ID_ESTADO_ABIERTO = 8;
const ID_ESTADO_CERRADO = 7;

function estadoDesdeId(idEstado) {
    const n = Number.parseInt(idEstado, 10);
    if (n === ID_ESTADO_ABIERTO) return { id: n, texto: 'Abierto', clase: 'abierto' };
    if (n === ID_ESTADO_CERRADO) return { id: n, texto: 'Cerrado', clase: 'cerrado' };
    return { id: n, texto: `Estado ${n}`, clase: 'otro' };
}

async function listarEvolucionesHc(documentoPaciente) {
    const doc = String(documentoPaciente || '').trim();
    if (!doc) return [];

    const pool = await poolPromise;
    const result = await pool
        .request()
        .input('DocumentoPaciente', sql.VarChar(50), doc)
        .query(`
            SELECT
                ev.[Id Evaluación Entidad] AS IdEvaluacionEntidad,
                ev.[Fecha Evaluación Entidad] AS FechaEvaluacion,
                ev.[Id Estado] AS IdEstado,
                ev.[Diagnóstico General Evaluación Entidad] AS DiagnosticoGeneral,
                CASE
                    WHEN ev.[Id Tipo de Evaluación] = 4
                         AND CHARINDEX('\\', CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(MAX))) > 0
                    THEN LTRIM(RTRIM(
                        SUBSTRING(
                            CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(MAX)),
                            CHARINDEX('\\', CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(MAX)),
                                CHARINDEX('\\', CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(MAX))) + 1
                            ) + 1,
                            400
                        )
                    ))
                    ELSE LTRIM(RTRIM(CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(400))))
                END AS NombreFormato
            FROM [dbo].[Evaluación Entidad] ev
            WHERE LTRIM(RTRIM(ev.[Documento Entidad])) = LTRIM(RTRIM(@DocumentoPaciente))
              AND ev.[Id Tipo de Evaluación] = ${ID_TIPO_EVALUACION_HC}
            ORDER BY ev.[Fecha Evaluación Entidad] DESC
        `);

    return (result.recordset || []).map((row) => {
        const est = estadoDesdeId(row.IdEstado);
        return {
            idEvaluacionEntidad: row.IdEvaluacionEntidad,
            fechaEvaluacion: row.FechaEvaluacion,
            idEstado: est.id,
            estadoTexto: est.texto,
            estadoClase: est.clase,
            nombreFormato: row.NombreFormato || '',
            diagnosticoGeneral: row.DiagnosticoGeneral,
        };
    });
}

async function obtenerDetalleEvolucion(idEvaluacionEntidad) {
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
                ev.[Documento Entidad] AS DocumentoPaciente,
                ev.[Fecha Evaluación Entidad] AS FechaEvaluacion,
                ev.[Id Estado] AS IdEstado,
                ev.[Diagnóstico General Evaluación Entidad] AS DiagnosticoGeneral,
                ev.[Diagnóstico Específico Evaluación Entidad] AS DiagnosticoEspecifico,
                CASE
                    WHEN ev.[Id Tipo de Evaluación] = 4
                         AND CHARINDEX('\\', CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(MAX))) > 0
                    THEN LTRIM(RTRIM(
                        SUBSTRING(
                            CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(MAX)),
                            CHARINDEX('\\', CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(MAX)),
                                CHARINDEX('\\', CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(MAX))) + 1
                            ) + 1,
                            400
                        )
                    ))
                    ELSE LTRIM(RTRIM(CAST(ev.[Diagnóstico General Evaluación Entidad] AS NVARCHAR(400))))
                END AS NombreFormato
            FROM [dbo].[Evaluación Entidad] ev
            WHERE ev.[Id Evaluación Entidad] = @IdEvaluacion
              AND ev.[Id Tipo de Evaluación] = ${ID_TIPO_EVALUACION_HC}
        `);

    const row = result.recordset[0];
    if (!row) return null;

    const est = estadoDesdeId(row.IdEstado);
    return {
        idEvaluacionEntidad: row.IdEvaluacionEntidad,
        documentoPaciente: row.DocumentoPaciente,
        fechaEvaluacion: row.FechaEvaluacion,
        idEstado: est.id,
        estadoTexto: est.texto,
        estadoClase: est.clase,
        nombreFormato: row.NombreFormato || '',
        diagnosticoGeneral: row.DiagnosticoGeneral,
        diagnosticoEspecifico: row.DiagnosticoEspecifico,
    };
}

module.exports = {
    ID_ESTADO_ABIERTO,
    ID_ESTADO_CERRADO,
    listarEvolucionesHc,
    obtenerDetalleEvolucion,
};

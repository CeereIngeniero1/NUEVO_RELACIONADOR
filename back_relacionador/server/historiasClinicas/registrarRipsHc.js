const { sql, poolPromise } = require('../db2');
const { ID_ESTADO_CERRADO } = require('./listarEvolucionesPaciente');

const ID_TIPO_EVALUACION_HC = 4;

function parseIntOrNull(v) {
    if (v == null || v === '' || v === 'Sin Seleccionar') return null;
    const n = Number.parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
}

function parseStrOrNull(v) {
    if (v == null || v === '' || v === 'Sin Seleccionar') return null;
    return String(v).trim();
}

function actoQuirurgicoDesdeTipo(tipoRips) {
    const t = String(tipoRips || '').toUpperCase();
    if (t === 'AC') return 1;
    if (t === 'AP') return 2;
    throw new Error('tipoRips debe ser AC o AP.');
}

/**
 * INSERT en [Evaluación Entidad Rips] (misma lógica que RegistrarRips en Asignar_RipsRoutes V3).
 */
async function registrarRipsHc(body) {
    const idEvaluacion = Number.parseInt(body.idEvaluacionEntidad, 10);
    if (Number.isNaN(idEvaluacion) || idEvaluacion <= 0) {
        throw new Error('idEvaluacionEntidad es obligatorio.');
    }

    const tipoRips = String(body.tipoRips || '').toUpperCase();
    const actoquirurgico = actoQuirurgicoDesdeTipo(tipoRips);

    const pool = await poolPromise;

    const check = await pool
        .request()
        .input('IdEvaluacion', sql.Int, idEvaluacion)
        .query(`
            SELECT TOP (1)
                ev.[Id Evaluación Entidad] AS IdEvaluacionEntidad,
                ev.[Id Estado] AS IdEstado,
                ev.[Id Tipo de Evaluación] AS IdTipoEvaluacion,
                ev.[Documento Entidad] AS DocumentoEntidad
            FROM [dbo].[Evaluación Entidad] ev
            WHERE ev.[Id Evaluación Entidad] = @IdEvaluacion
        `);

    const row = check.recordset[0];
    if (!row) throw new Error('Evaluación no encontrada.');
    if (Number(row.IdTipoEvaluacion) !== ID_TIPO_EVALUACION_HC) {
        throw new Error('El registro no es una historia clínica (tipo 4).');
    }
    if (Number(row.IdEstado) === ID_ESTADO_CERRADO) {
        throw new Error('No se puede asignar RIPS a una historia clínica cerrada.');
    }

    const existeRips = await pool
        .request()
        .input('IdEvaluacion', sql.Int, idEvaluacion)
        .query(`
            SELECT TOP (1) [Id Evaluación Entidad Rips] AS IdEvaluacionEntidadRips
            FROM [dbo].[Evaluación Entidad Rips]
            WHERE [Id Evaluación Entidad] = @IdEvaluacion
        `);
    if (existeRips.recordset[0]) {
        throw new Error('Esta evaluación ya tiene un RIPS asignado.');
    }

    let cups2 = parseStrOrNull(body.cups2);
    if (!cups2 || cups2 === '0') cups2 = null;
    let cie2 = parseStrOrNull(body.cie2);
    if (!cie2 || cie2 === '0') cie2 = null;

    const causa =
        tipoRips === 'AP' ? 0 : parseIntOrNull(body.causaMotivoAtencion) ?? 0;
    const tipoDx =
        tipoRips === 'AP' ? 0 : parseIntOrNull(body.tipoDiagnosticoPrincipal) ?? 0;
    const viaIngreso =
        tipoRips === 'AP' ? parseIntOrNull(body.viaIngresoServicioSalud) ?? 0 : 0;

    const idFactura = parseIntOrNull(body.idFactura) ?? 0;
    const idPresupuesto = parseIntOrNull(body.idPresupuesto) ?? 0;

    const request = pool.request();
    request.input('IdEvaluacion', sql.Int, idEvaluacion);
    request.input('Cups1', sql.NVarChar(50), parseStrOrNull(body.cups1));
    request.input('Cups2', sql.NVarChar(50), cups2);
    request.input('Cie1', sql.NVarChar(50), parseStrOrNull(body.cie1));
    request.input('Cie2', sql.NVarChar(50), cie2);
    request.input('TipoUsuario', sql.Int, parseIntOrNull(body.tipoUsuario));
    request.input('Entidad', sql.NVarChar(50), parseStrOrNull(body.entidad));
    request.input('CausaMotivoAtencion', sql.Int, causa);
    request.input('TipoDiagnosticoPrincipal', sql.Int, tipoDx);
    request.input('FinalidadTecnologiaSalud', sql.Int, parseIntOrNull(body.finalidadTecnologiaSalud));
    request.input('Actoquirurgico', sql.Int, actoquirurgico);
    request.input('ModalidadGrupoServicioTecSal', sql.Int, parseIntOrNull(body.modalidadGrupoServicioTecSal));
    request.input('GrupoServicios', sql.Int, parseIntOrNull(body.grupoServicios));
    request.input('CodServicio', sql.Int, parseIntOrNull(body.codServicio));
    request.input('ViaIngresoServicioSalud', sql.Int, viaIngreso);
    request.input('IdFactura', sql.Int, idFactura);
    request.input('IdPresupuesto', sql.Int, idPresupuesto);

    const insert = await request.query(`
        INSERT INTO [dbo].[Evaluación Entidad Rips] (
            [Id Evaluación Entidad],
            [Codigo Rips],
            [Codigo Rips2],
            [Diagnostico Rips],
            [Diagnostico Rips2],
            [Id Tipo de Rips],
            [Documento Tipo Rips],
            [Id Causa Externa],
            [Id Tipo de Diagnóstico Principal],
            [Id Finalidad Consulta],
            [Id Acto Quirúrgico],
            [Id Modalidad Atencion],
            [Id Grupo Servicios],
            [Id Servicios],
            [Id Via Ingreso Usuario],
            [Id Factura],
            [Id Plan de Tratamiento]
        )
        OUTPUT INSERTED.[Id Evaluación Entidad Rips] AS IdEvaluacionEntidadRips
        VALUES (
            @IdEvaluacion,
            @Cups1,
            @Cups2,
            @Cie1,
            @Cie2,
            @TipoUsuario,
            @Entidad,
            @CausaMotivoAtencion,
            @TipoDiagnosticoPrincipal,
            @FinalidadTecnologiaSalud,
            @Actoquirurgico,
            @ModalidadGrupoServicioTecSal,
            @GrupoServicios,
            @CodServicio,
            @ViaIngresoServicioSalud,
            @IdFactura,
            @IdPresupuesto
        )
    `);

    const idRips = insert.recordset[0]?.IdEvaluacionEntidadRips;
    if (idRips == null) {
        throw new Error('No se obtuvo Id Evaluación Entidad Rips tras el INSERT.');
    }

    return {
        idEvaluacionEntidad: idEvaluacion,
        idEvaluacionEntidadRips: idRips,
        tipoRips,
    };
}

async function marcarSinRipsHc(idEvaluacionEntidad) {
    const id = Number.parseInt(idEvaluacionEntidad, 10);
    if (Number.isNaN(id) || id <= 0) {
        throw new Error('Id de evaluación inválido.');
    }

    const pool = await poolPromise;
    const existeRips = await pool
        .request()
        .input('IdEvaluacion', sql.Int, id)
        .query(`
            SELECT TOP (1) [Id Evaluación Entidad Rips] AS IdRips
            FROM [dbo].[Evaluación Entidad Rips]
            WHERE [Id Evaluación Entidad] = @IdEvaluacion
        `);
    if (existeRips.recordset[0]) {
        throw new Error('Esta evaluación ya tiene RIPS registrado; no aplica "sin RIPS".');
    }

    const upd = await pool
        .request()
        .input('IdEvaluacion', sql.Int, id)
        .query(`
            UPDATE [dbo].[Evaluación Entidad]
            SET [Rips] = 0
            WHERE [Id Evaluación Entidad] = @IdEvaluacion
              AND [Id Tipo de Evaluación] = ${ID_TIPO_EVALUACION_HC}
        `);

    if (!upd.rowsAffected || upd.rowsAffected[0] === 0) {
        throw new Error('No se pudo marcar la evaluación sin RIPS.');
    }

    return { idEvaluacionEntidad: id, rips: 0 };
}

module.exports = {
    registrarRipsHc,
    marcarSinRipsHc,
};

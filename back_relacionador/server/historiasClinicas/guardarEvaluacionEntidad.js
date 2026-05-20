const { sql, poolPromise } = require('../db2');

const ID_TIPO_EVALUACION_HC = 4;
const ID_ESTADO_HC = 8;
const ID_ESTADO_WEB = 2;
const ID_UNIDAD_MEDIDA_EDAD_ANOS = 2;
const ID_PARENTESCO_SIN_ASIGNAR = 1;
const PREFIJO_FORMATO_HC = '\\Formatos HC\\';

function trimOrNull(v) {
    if (v == null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
}

function parsearDiagnosticoEspecifico(cadena) {
    const mapa = {};
    const s = String(cadena || '');
    if (!s) return mapa;

    s.split('||').forEach((bloque) => {
        const b = bloque.trim();
        if (!b) return;
        const partes = b.split('|');
        if (partes.length < 3) return;
        const nombre = partes[0].trim();
        const valor = partes[1] != null ? String(partes[1]).trim() : '';
        if (nombre) mapa[nombre] = valor;
    });
    return mapa;
}

function construirDiagnosticoGeneral(nombreFormato) {
    const nombre = String(nombreFormato || '').trim();
    if (!nombre) return null;
    return `${PREFIJO_FORMATO_HC}${nombre}`;
}

async function cargarPaciente(pool, documentoPaciente) {
    const result = await pool
        .request()
        .input('DocumentoPaciente', sql.VarChar(50), documentoPaciente)
        .query(`
            SELECT TOP (1) *
            FROM [dbo].[Cnsta Relacionador Usuarios Info]
            WHERE LTRIM(RTRIM(DocumentoPaciente)) = LTRIM(RTRIM(@DocumentoPaciente))
        `);
    return result.recordset[0] || null;
}

async function resolverIdParentesco(pool, texto, fallbackId = ID_PARENTESCO_SIN_ASIGNAR) {
    const t = trimOrNull(texto);
    if (!t || /^sin\s+asignar$/i.test(t)) return fallbackId;
    try {
        const rs = await pool
            .request()
            .input('Texto', sql.NVarChar(100), t)
            .query(`
                SELECT TOP (1) [Id Parentesco] AS Id
                FROM [dbo].[Parentesco]
                WHERE [Parentesco] = @Texto
                   OR [Descripción Parentesco] = @Texto
            `);
        return rs.recordset[0]?.Id ?? fallbackId;
    } catch (_) {
        return fallbackId;
    }
}

async function resolverIdEstadoCivil(pool, texto) {
    const t = trimOrNull(texto);
    if (!t) return null;
    try {
        const rs = await pool
            .request()
            .input('Texto', sql.NVarChar(100), t)
            .query(`
                SELECT TOP (1) [Id Estado Civil] AS Id
                FROM [dbo].[Estado Civil]
                WHERE [Estado Civil] = @Texto
            `);
        return rs.recordset[0]?.Id ?? null;
    } catch (_) {
        return null;
    }
}

/**
 * Arma el payload para INSERT en [Evaluación Entidad].
 */
async function buildInsertPayload({ paciente, body, camposFormato }) {
    const documentoPaciente = trimOrNull(body.documentoPaciente) || trimOrNull(paciente?.DocumentoPaciente);
    const nombreFormato = trimOrNull(body.nombreFormato);
    const diagnosticoEspecifico = String(body.diagnosticoEspecifico ?? '');
    const diagnosticoGeneral =
        trimOrNull(body.diagnosticoGeneral) || construirDiagnosticoGeneral(nombreFormato);

    const session = body.session || {};
    const documentoUsuario =
        trimOrNull(session.documentoUsuario) ||
        trimOrNull(session.documentoProfesional) ||
        '0';
    const documentoProfesional =
        trimOrNull(session.documentoProfesional) || documentoUsuario;
    const documentoEmpresa = trimOrNull(session.documentoEmpresa) || null;
    const idTerminalRaw = session.idTerminal ?? process.env.CEERE_ID_TERMINAL ?? '1392';
    const idTerminalParsed = Number.parseInt(idTerminalRaw, 10);
    const idTerminal = Number.isNaN(idTerminalParsed) ? 1392 : idTerminalParsed;

    const pool = await poolPromise;

    const acompanante =
        trimOrNull(camposFormato.T15) ||
        trimOrNull(paciente?.Acompanante) ||
        'Sin Acompañante';
    const telAcompanante =
        trimOrNull(camposFormato.T17) || 'Sin Asignar';
    const responsable =
        trimOrNull(camposFormato.T18) ||
        trimOrNull(paciente?.NombreResponsable) ||
        'Sin Responsable';
    const telResponsable =
        trimOrNull(camposFormato.T20) || 'Sin Asignar';
    const documentoAseguradora = trimOrNull(camposFormato.T13) || null;

    const idParentesco = await resolverIdParentesco(pool, camposFormato.T16);
    const idParentescoResponsable = await resolverIdParentesco(
        pool,
        camposFormato.T19 || paciente?.ParentescoResponsable
    );

    let idEstadoCivil = null;
    const estadoCivilTexto = trimOrNull(camposFormato.T11) || trimOrNull(paciente?.EstadoCivil);
    if (estadoCivilTexto) {
        idEstadoCivil = await resolverIdEstadoCivil(pool, estadoCivilTexto);
    }

    const edadRaw = paciente?.Edad;
    const edad =
        edadRaw != null && !Number.isNaN(Number.parseInt(edadRaw, 10))
            ? Number.parseInt(edadRaw, 10)
            : null;

    const fechaNac = paciente?.FechaNacimientoBase || null;

    return {
        idTipoEvaluacion: ID_TIPO_EVALUACION_HC,
        fechaEvaluacion: body.fechaEvaluacion ? new Date(body.fechaEvaluacion) : new Date(),
        documentoEntidad: documentoPaciente,
        edadEntidadEvaluacion: edad,
        acompananteEvaluacion: acompanante,
        idParentesco,
        telefonoAcompanante: telAcompanante,
        diagnosticoGeneral,
        diagnosticoEspecifico,
        manejoMedicamentos: 0,
        direccionDomicilio: trimOrNull(paciente?.Direccion),
        idCiudad: paciente?.IdMunicipioRecidencia ?? paciente?.IdCiudad ?? 1,
        telefonoDomicilio: trimOrNull(paciente?.Tel) || trimOrNull(camposFormato.T8),
        fechaNacimiento: fechaNac,
        idUnidadMedidaEdad: ID_UNIDAD_MEDIDA_EDAD_ANOS,
        idSexo: paciente?.IdSexo ?? paciente?.['Id Sexo'] ?? null,
        idEstado: ID_ESTADO_HC,
        idEstadoCivil,
        idOcupacion: paciente?.IdOcupación ?? paciente?.IdOcupacion ?? null,
        documentoAseguradora,
        idTipoAfiliado: null,
        responsableEvaluacion: responsable,
        idParentescoResponsable,
        telefonoResponsable: telResponsable,
        documentoUsuario,
        documentoEmpresa,
        idTerminal,
        documentoProfesional,
        idEstadoWeb: ID_ESTADO_WEB,
        conOrden: 0,
        sincronizado: 0,
        preguntarControl: 0,
        nombreFormatoAux: null,
    };
}

async function insertarEvaluacionEntidad(payload) {
    const pool = await poolPromise;
    const request = pool.request();

    request.input('IdTipoEvaluacion', sql.Int, payload.idTipoEvaluacion);
    request.input('FechaEvaluacion', sql.DateTime, payload.fechaEvaluacion);
    request.input('DocumentoEntidad', sql.NVarChar(50), payload.documentoEntidad);
    request.input('EdadEntidadEvaluacion', sql.Int, payload.edadEntidadEvaluacion);
    request.input('AcompananteEvaluacion', sql.NVarChar(200), payload.acompananteEvaluacion);
    request.input('IdParentesco', sql.Int, payload.idParentesco);
    request.input('TelefonoAcompanante', sql.NVarChar(50), payload.telefonoAcompanante);
    request.input('DiagnosticoGeneral', sql.NText, payload.diagnosticoGeneral);
    request.input('DiagnosticoEspecifico', sql.NText, payload.diagnosticoEspecifico);
    request.input('ManejoMedicamentos', sql.Bit, payload.manejoMedicamentos);
    request.input('DireccionDomicilio', sql.NVarChar(250), payload.direccionDomicilio);
    request.input('IdCiudad', sql.Int, payload.idCiudad);
    request.input('TelefonoDomicilio', sql.NVarChar(50), payload.telefonoDomicilio);
    request.input('FechaNacimiento', sql.DateTime, payload.fechaNacimiento);
    request.input('IdUnidadMedidaEdad', sql.Int, payload.idUnidadMedidaEdad);
    request.input('IdSexo', sql.Int, payload.idSexo);
    request.input('IdEstado', sql.Int, payload.idEstado);
    request.input('IdEstadoCivil', sql.Int, payload.idEstadoCivil);
    request.input('IdOcupacion', sql.Int, payload.idOcupacion);
    request.input('DocumentoAseguradora', sql.NVarChar(50), payload.documentoAseguradora);
    request.input('IdTipoAfiliado', sql.Int, payload.idTipoAfiliado);
    request.input('ResponsableEvaluacion', sql.NVarChar(250), payload.responsableEvaluacion);
    request.input('IdParentescoResponsable', sql.Int, payload.idParentescoResponsable);
    request.input('TelefonoResponsable', sql.NVarChar(50), payload.telefonoResponsable);
    request.input('DocumentoUsuario', sql.NVarChar(50), payload.documentoUsuario);
    request.input('DocumentoEmpresa', sql.NVarChar(50), payload.documentoEmpresa);
    request.input('IdTerminal', sql.Int, payload.idTerminal);
    request.input('DocumentoProfesional', sql.NVarChar(50), payload.documentoProfesional);
    request.input('IdEstadoWeb', sql.Int, payload.idEstadoWeb);
    request.input('ConOrden', sql.Bit, payload.conOrden);
    request.input('Sincronizado', sql.Bit, payload.sincronizado);
    request.input('PreguntarControl', sql.Bit, payload.preguntarControl);
    request.input('NombreFormatoAux', sql.NVarChar(100), payload.nombreFormatoAux);

    const incluirRips = process.env.CEERE_HC_INSERT_RIPS !== '0';
    const columnasRips = incluirRips ? ', [Rips]' : '';
    const valoresRips = incluirRips ? ', 1' : '';

    /* OUTPUT INTO: requerido porque [Evaluación Entidad] tiene triggers (error 334). */
    const result = await request.query(`
        DECLARE @InsertedIds TABLE (IdEvaluacionEntidad INT);

        INSERT INTO [dbo].[Evaluación Entidad] (
            [Id Tipo de Evaluación],
            [Fecha Evaluación Entidad],
            [Documento Entidad],
            [Edad Entidad Evaluación Entidad],
            [Acompañante Evaluación Entidad],
            [Id Parentesco],
            [Teléfono Acompañante],
            [Diagnóstico General Evaluación Entidad],
            [Diagnóstico Específico Evaluación Entidad],
            [Manejo de Medicamentos],
            [Dirección Domicilio],
            [Id Ciudad],
            [Teléfono Domicilio],
            [Fecha Nacimiento],
            [Id Unidad de Medida Edad],
            [Id Sexo],
            [Id Estado],
            [Id Estado Civil],
            [Id Ocupación],
            [Documento Aseguradora],
            [Id Tipo de Afiliado],
            [Responsable Evaluación Entidad],
            [Id Parentesco Responsable],
            [Teléfono Responsable],
            [Documento Usuario],
            [Documento Empresa],
            [Id Terminal],
            [Documento Profesional],
            [Id Estado Web],
            [Con Orden],
            [Sincronizado],
            [PreguntarControl],
            [NombreFormatoAux]
            ${columnasRips}
        )
        OUTPUT INSERTED.[Id Evaluación Entidad] INTO @InsertedIds (IdEvaluacionEntidad)
        VALUES (
            @IdTipoEvaluacion,
            @FechaEvaluacion,
            @DocumentoEntidad,
            @EdadEntidadEvaluacion,
            @AcompananteEvaluacion,
            @IdParentesco,
            @TelefonoAcompanante,
            @DiagnosticoGeneral,
            @DiagnosticoEspecifico,
            @ManejoMedicamentos,
            @DireccionDomicilio,
            @IdCiudad,
            @TelefonoDomicilio,
            @FechaNacimiento,
            @IdUnidadMedidaEdad,
            @IdSexo,
            @IdEstado,
            @IdEstadoCivil,
            @IdOcupacion,
            @DocumentoAseguradora,
            @IdTipoAfiliado,
            @ResponsableEvaluacion,
            @IdParentescoResponsable,
            @TelefonoResponsable,
            @DocumentoUsuario,
            @DocumentoEmpresa,
            @IdTerminal,
            @DocumentoProfesional,
            @IdEstadoWeb,
            @ConOrden,
            @Sincronizado,
            @PreguntarControl,
            @NombreFormatoAux
            ${valoresRips}
        );

        SELECT IdEvaluacionEntidad FROM @InsertedIds;
    `);

    const sets = result.recordsets && result.recordsets.length
        ? result.recordsets
        : [result.recordset];
    const lastSet = sets[sets.length - 1] || [];
    const row = lastSet[0] || {};
    const id = row.IdEvaluacionEntidad;
    if (id == null) {
        throw new Error('No se obtuvo el Id Evaluación Entidad tras el INSERT.');
    }
    return id;
}

async function guardarHistoriaClinica(body) {
    const documentoPaciente = trimOrNull(body.documentoPaciente);
    const nombreFormato = trimOrNull(body.nombreFormato);
    const diagnosticoEspecifico = body.diagnosticoEspecifico;

    if (!documentoPaciente) {
        throw new Error('documentoPaciente es obligatorio.');
    }
    if (!nombreFormato) {
        throw new Error('nombreFormato es obligatorio.');
    }
    if (diagnosticoEspecifico == null || String(diagnosticoEspecifico).trim() === '') {
        throw new Error('diagnosticoEspecifico es obligatorio (serialización del formato).');
    }

    const pool = await poolPromise;
    const paciente = await cargarPaciente(pool, documentoPaciente);
    if (!paciente) {
        throw new Error('No se encontró el paciente en el directorio de usuarios.');
    }

    const camposFormato = parsearDiagnosticoEspecifico(diagnosticoEspecifico);
    const payload = await buildInsertPayload({ paciente, body, camposFormato });
    const idEvaluacionEntidad = await insertarEvaluacionEntidad(payload);

    return {
        idEvaluacionEntidad,
        fechaEvaluacion: payload.fechaEvaluacion,
        diagnosticoGeneral: payload.diagnosticoGeneral,
        cantidadCamposFormato: Object.keys(camposFormato).length,
    };
}

module.exports = {
    guardarHistoriaClinica,
    parsearDiagnosticoEspecifico,
    construirDiagnosticoGeneral,
    buildInsertPayload,
};

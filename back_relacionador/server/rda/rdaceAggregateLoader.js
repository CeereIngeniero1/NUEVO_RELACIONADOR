'use strict';

/**
 * Carga cabecera RDACE, demografía del paciente, tablas hijas y PDF almacenado (si existe).
 * Usado por FhirBundle, descarga PDF y generación de resumen clínico.
 *
 * @param {import('mssql').ConnectionPool} pool
 * @param {import('mssql')} sql
 * @param {number} id
 * @param {object} [reqBody] Body o query con overrides opcionales (overrideCodigoPrestador).
 */
async function loadRdaceAggregate(pool, sql, id, reqBody = {}) {
    const str = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);

    const mainResult = await pool.request()
        .input('Id', sql.Int, id)
        .query(`
            SELECT
                ce.[Documento Entidad]               AS DocumentoEntidad,
                ce.[Fecha RDA]                       AS FechaRDA,
                ce.[Codigo Prestador]                AS CodigoPrestador,
                ce.[Codigo Admin Plan Beneficios]    AS CodigoAdminPlanBeneficios,
                ce.[Nombre Admin Plan Beneficios]    AS NombreAdminPlanBeneficios,
                ce.[Fecha Hora Inicio Atencion]      AS FechaHoraInicioAtencion,
                ce.[Fecha Hora Fin Atencion]         AS FechaHoraFinAtencion,
                ce.[Tipo Doc Profesional]            AS TipoDocProfesional,
                ce.[Num Doc Profesional]             AS NumDocProfesional,
                ce.[Diagnostico Ingreso CIE11 Codigo]  AS DiagnosticoIngresoCIE11Codigo,
                ce.[Diagnostico Ingreso CIE11 Termino] AS DiagnosticoIngresoCIE11Termino,
                ce.[Tipo Alergia]                    AS TipoAlergia,
                ce.[Entorno Atencion]                AS EntornoAtencion,
                ce.[Tipo Factor Riesgo]              AS TipoFactorRiesgo,
                ce.[Nombre Factor Riesgo]            AS NombreFactorRiesgo,
                ce.[Diagnostico Principal CIE10 Codigo]  AS DiagPrincipalCIE10Codigo,
                ce.[Diagnostico Principal CIE10 Nombre]  AS DiagPrincipalCIE10Nombre,
                ce.[Tipo Diagnostico Principal]      AS TipoDiagnosticoPrincipal,
                ce.[Condicion Destino Egreso]        AS CondicionDestinoEgreso,
                ce.[Codigo Prestador Remite]         AS CodigoPrestadorRemite,
                ce.[Alcance Incapacidad]             AS AlcanceIncapacidad,
                ce.[Dias Incapacidad]                AS DiasIncapacidad,
                ce.[Dias Licencia Maternidad]        AS DiasLicenciaMaternidad,
                ce.[Nombre Documento PDF]            AS NombreDocumentoPDF,
                ce.[Id Modalidad Atencion]           AS IdModalidadAtencion,
                ce.[Id Grupo Servicios]              AS IdGrupoServicios,
                ce.[Id Via Ingreso Usuario]          AS IdViaIngresoUsuario,
                ce.[Id Causa Motivo Atencion]        AS IdCausaMotivoAtencion,
                ce.[Contenido Documento PDF]         AS ContenidoDocumentoPdfBin,
                ce.[Fecha Generacion Documento PDF]   AS FechaGeneracionDocumentoPdf,
                ma.[Codigo]                          AS CodigoModalidadAtencion,
                ma.[NombreModalidadAtencion]         AS NombreModalidadAtencion,
                gs.[Codigo]                          AS CodigoGrupoServicios,
                gs.[NombreGrupoServicios]            AS NombreGrupoServicios,
                via.[Codigo]                         AS CodigoViaIngreso,
                via.[NombreViaIngresoUsuario]        AS NombreViaIngreso,
                causa.[Codigo]                       AS CodigoCausaMotivo,
                causa.[NombreRIPSCausaExternaVersion2] AS NombreCausaMotivo
            FROM [dbo].[Evaluacion Entidad RDA Consulta Externa] ce
            LEFT JOIN [dbo].[Cnsta Relacionador Modalidad Atencion] ma
                ON ma.[IdModalidadAtencion] = ce.[Id Modalidad Atencion]
            LEFT JOIN [dbo].[Cnsta Relacionador ModalidadGrupoServicioTecSal] gs
                ON gs.[IdGrupoServicios] = ce.[Id Grupo Servicios]
            LEFT JOIN [dbo].[Cnsta Relacionador Via Ingreso Usuario] via
                ON via.[IdViaIngresoUsuario] = ce.[Id Via Ingreso Usuario]
            LEFT JOIN [dbo].[Cnsta Relacionador Causa Externa] causa
                ON causa.[Id RIPS Causa Externa Version2] = ce.[Id Causa Motivo Atencion]
            WHERE ce.[Id Evaluacion Entidad RDA Consulta Externa] = @Id
        `);

    if (!mainResult.recordset || !mainResult.recordset.length) {
        const err = new Error('No existe Evaluacion Entidad RDA Consulta Externa para el Id indicado');
        err.code = 'RDACE_NOT_FOUND';
        throw err;
    }

    const row = mainResult.recordset[0];
    const storedPdfBuffer = Buffer.isBuffer(row.ContenidoDocumentoPdfBin) && row.ContenidoDocumentoPdfBin.length
        ? row.ContenidoDocumentoPdfBin
        : null;
    const fechaGeneracionPdf = row.FechaGeneracionDocumentoPdf || null;

    const head = { ...row };
    delete head.ContenidoDocumentoPdfBin;
    delete head.FechaGeneracionDocumentoPdf;

    if ((reqBody || {}).overrideCodigoPrestador != null && String((reqBody || {}).overrideCodigoPrestador).trim()) {
        head.CodigoPrestador = String((reqBody || {}).overrideCodigoPrestador).trim();
    }

    let pdem = {};
    const docPac = str(head.DocumentoEntidad);
    if (docPac) {
        const patResult = await pool.request()
            .input('DocumentoPaciente', sql.VarChar(50), docPac)
            .query(`
                SELECT TOP 1
                    TipoDocumentoBase,
                    PrimerApellidoBase, SegundoApellidoBase,
                    PrimerNombreBase, SegundoNombreBase,
                    [CódigoSexo]              AS CodigoSexo,
                    Sexo,
                    FechaNacimientoBase        AS FechaNacimiento,
                    codigoIdentidadGeneroBase  AS CodigoIdentidadGenero,
                    IdentidadGeneroBase        AS TextoIdentidadGenero,
                    IdSexoIdentidadGenero      AS IdIdentidadGenero,
                    [CódigoZonaResidencia]     AS CodigoZonaResidencia,
                    ZonaResidencia,
                    [CódigoEtnia]              AS CodigoEtnia,
                    Etnia                      AS TextoEtnia,
                    ComunidadEtnica,
                    Codigo                     AS CodigoDiscapacidad,
                    Discapacidad               AS TextoDiscapacidad,
                    CodigoPaisNacionalidad,
                    NombrePaisNACIONALIDAD     AS NombrePaisNacionalidad,
                    CodigoPaisRecidencia       AS CodigoPaisResidencia,
                    NombrePaisRecidencia       AS NombrePaisResidencia,
                    CodigoMunicipioRecidencia  AS CodigoMunicipio,
                    NombreMunicipioRecidencia  AS NombreMunicipio,
                    Direccion,
                    Tel                        AS TelefonoCelular
                FROM [dbo].[Cnsta Relacionador Usuarios Info]
                WHERE DocumentoPaciente = @DocumentoPaciente
            `);
        if (patResult.recordset && patResult.recordset.length) pdem = patResult.recordset[0];
    }

    const [
        diagRelRes,
        medPresRes,
        procPresRes,
        otrasTecRes,
        antSaludRes,
        antFamRes,
        antFarmRes,
    ] = await Promise.all([
        pool.request().input('Id', sql.Int, id).query(`
            SELECT [Codigo CIE10] AS CodigoCIE10, [Nombre CIE10] AS NombreCIE10,
                   [Codigo CIE11] AS CodigoCIE11, [Termino CIE11] AS TerminoCIE11
            FROM [dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados]
            WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT [Codigo Medicamento] AS CodigoMedicamento, [Nombre Medicamento] AS NombreMedicamento,
                   [Descripcion Comun DCI] AS DCI, [Fecha Prescripcion] AS FechaPrescripcion,
                   [Dosis Ordenada] AS DosisOrdenada, [Unidad Medida Dosis] AS UnidadDosis,
                   [Via Administracion] AS ViaAdministracion,
                   [Duracion Cantidad] AS DuracionCantidad, [Duracion Unidad Tiempo] AS DuracionUnidad,
                   [Frecuencia Cantidad] AS FrecuenciaCantidad, [Frecuencia Unidad Tiempo] AS FrecuenciaUnidad,
                   [Finalidad Tec Salud] AS Finalidad
            FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]
            WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT [Codigo Procedimiento] AS CodigoProcedimiento,
                   [Nombre Procedimiento] AS NombreProcedimiento,
                   [Finalidad Tec Salud] AS Finalidad, [Fecha Prescripcion] AS FechaPrescripcion
            FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos]
            WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT [Codigo] AS Codigo, [Nombre] AS Nombre,
                   [Fecha Prescripcion] AS FechaPrescripcion, [Finalidad Tec Salud] AS Finalidad
            FROM [dbo].[Evaluacion Entidad RDA CE Otras Tecnologias]
            WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT [Descripcion] AS Descripcion
            FROM [dbo].[Evaluacion Entidad RDA CE Antecedentes Salud]
            WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT [Parentesco] AS Parentesco, [Descripcion] AS Descripcion
            FROM [dbo].[Evaluacion Entidad RDA CE Antecedentes Familiares]
            WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT [Descripcion] AS Descripcion
            FROM [dbo].[Evaluacion Entidad RDA CE Antecedentes Farmacologicos]
            WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
        `),
    ]);

    return {
        head,
        pdem,
        diagRelacionados: diagRelRes.recordset || [],
        medPrescripciones: medPresRes.recordset || [],
        procPrescripciones: procPresRes.recordset || [],
        otrasTecnologias: otrasTecRes.recordset || [],
        antecedentesSalud: antSaludRes.recordset || [],
        antecedentesFamiliares: antFamRes.recordset || [],
        antecedentesFarmacologicos: antFarmRes.recordset || [],
        storedPdfBuffer,
        fechaGeneracionPdf,
    };
}

module.exports = { loadRdaceAggregate };

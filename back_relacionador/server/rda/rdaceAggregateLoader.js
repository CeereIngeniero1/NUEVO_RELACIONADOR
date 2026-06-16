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

    const cols = await pool.request().query(`
        SELECT
            CASE WHEN COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Contenido Documento PDF') IS NULL THEN 0 ELSE 1 END AS HasContenidoDocumentoPdfBin,
            CASE WHEN COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Fecha Generacion Documento PDF') IS NULL THEN 0 ELSE 1 END AS HasFechaGeneracionDocumentoPdf,
            CASE WHEN COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Contenido Documento PDF Base64') IS NULL THEN 0 ELSE 1 END AS HasContenidoDocumentoPdfBase64,
            CASE WHEN COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Notas Adicionales PDF') IS NULL THEN 0 ELSE 1 END AS HasNotasAdicionalesPdf
    `);
    const colInfo = (cols.recordset && cols.recordset[0]) || {};
    const hasPdfBin = Number(colInfo.HasContenidoDocumentoPdfBin) === 1;
    const hasPdfDate = Number(colInfo.HasFechaGeneracionDocumentoPdf) === 1;
    const hasPdfBase64 = Number(colInfo.HasContenidoDocumentoPdfBase64) === 1;
    const hasNotasAdicionalesPdf = Number(colInfo.HasNotasAdicionalesPdf) === 1;

    const selectPdfBin = hasPdfBin
        ? 'ce.[Contenido Documento PDF]         AS ContenidoDocumentoPdfBin,'
        : 'CAST(NULL AS VARBINARY(MAX))         AS ContenidoDocumentoPdfBin,';
    const selectPdfDate = hasPdfDate
        ? 'ce.[Fecha Generacion Documento PDF]   AS FechaGeneracionDocumentoPdf,'
        : 'CAST(NULL AS DATETIME2(7))            AS FechaGeneracionDocumentoPdf,';
    const selectPdfBase64 = hasPdfBase64
        ? 'ce.[Contenido Documento PDF Base64]   AS ContenidoDocumentoPdfBase64,'
        : 'CAST(NULL AS NVARCHAR(MAX))           AS ContenidoDocumentoPdfBase64,';
    const selectNotasPdf = hasNotasAdicionalesPdf
        ? 'ce.[Notas Adicionales PDF]            AS NotasAdicionalesPdf,'
        : 'CAST(NULL AS NVARCHAR(MAX))           AS NotasAdicionalesPdf,';

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
                ${selectNotasPdf}
                ce.[Id Modalidad Atencion]           AS IdModalidadAtencion,
                ce.[Id Grupo Servicios]              AS IdGrupoServicios,
                ce.[Id Via Ingreso Usuario]          AS IdViaIngresoUsuario,
                ce.[Id Causa Motivo Atencion]        AS IdCausaMotivoAtencion,
                ${selectPdfBin}
                ${selectPdfDate}
                ${selectPdfBase64}
                ma.[Codigo]                          AS CodigoModalidadAtencion,
                ma.[NombreModalidadAtencion]         AS NombreModalidadAtencion,
                gs.[Codigo]                          AS CodigoGrupoServicios,
                gs.[NombreGrupoServicios]            AS NombreGrupoServicios,
                (SELECT TOP 1 gsce.[NombreGrupoServicios]
                 FROM [dbo].[Cnsta Relacionador ModalidadGrupoServicioTecSal] gsce
                 WHERE LTRIM(RTRIM(gsce.[Codigo])) = '01') AS NombreGrupoServiciosPerfilCE,
                via.[Codigo]                         AS CodigoViaIngreso,
                via.[NombreViaIngresoUsuario]        AS NombreViaIngreso,
                causa.[Codigo]                       AS CodigoCausaMotivo,
                causa.[NombreRIPSCausaExternaVersion2] AS NombreCausaMotivo,
                ent.[Descripcion]                    AS NombreEntornoAtencion,
                eg.[Descripcion]                     AS NombreCondicionDestinoEgreso,
                alc.[Descripcion]                    AS NombreAlcanceIncapacidad,
                tal.[Descripcion]                    AS NombreTipoAlergia,
                tdiag.[Descripcion]                  AS NombreTipoDiagnosticoPrincipal,
                eprof.[Primer Apellido Entidad]      AS ProfPrimerApellido,
                eprof.[Segundo Apellido Entidad]     AS ProfSegundoApellido,
                eprof.[Primer Nombre Entidad]        AS ProfPrimerNombre,
                eprof.[Segundo Nombre Entidad]       AS ProfSegundoNombre
            FROM [dbo].[Evaluacion Entidad RDA Consulta Externa] ce
            LEFT JOIN [dbo].[Cnsta Relacionador Modalidad Atencion] ma
                ON ma.[IdModalidadAtencion] = ce.[Id Modalidad Atencion]
            LEFT JOIN [dbo].[Cnsta Relacionador ModalidadGrupoServicioTecSal] gs
                ON gs.[IdGrupoServicios] = ce.[Id Grupo Servicios]
            LEFT JOIN [dbo].[Cnsta Relacionador Via Ingreso Usuario] via
                ON via.[IdViaIngresoUsuario] = ce.[Id Via Ingreso Usuario]
            LEFT JOIN [dbo].[Cnsta Relacionador Causa Externa] causa
                ON causa.[Id RIPS Causa Externa Version2] = ce.[Id Causa Motivo Atencion]
            LEFT JOIN [dbo].[Cnsta Entorno de atencion 1888] ent
                ON LTRIM(RTRIM(ent.Codigo)) = LTRIM(RTRIM(ce.[Entorno Atencion]))
            LEFT JOIN [dbo].[Cnsta Egreso y Remision 1888] eg
                ON LTRIM(RTRIM(eg.Codigo)) = LTRIM(RTRIM(ce.[Condicion Destino Egreso]))
            LEFT JOIN [dbo].[Cnsta Alcance incapacidad 1888] alc
                ON LTRIM(RTRIM(alc.Codigo)) = LTRIM(RTRIM(ce.[Alcance Incapacidad]))
            LEFT JOIN [dbo].[Cnsta Tipo de alergia 1888] tal
                ON LTRIM(RTRIM(tal.Codigo)) = LTRIM(RTRIM(LEFT(LTRIM(RTRIM(ce.[Tipo Alergia])), 2)))
            LEFT JOIN [dbo].[Cnsta Tipo diagnostico principal 1888] tdiag
                ON LTRIM(RTRIM(tdiag.Codigo)) = LTRIM(RTRIM(ce.[Tipo Diagnostico Principal]))
            LEFT JOIN [dbo].[Entidad] eprof
                ON LTRIM(RTRIM(eprof.[Documento Entidad])) = LTRIM(RTRIM(ce.[Num Doc Profesional]))
            WHERE ce.[Id Evaluacion Entidad RDA Consulta Externa] = @Id
        `);

    if (!mainResult.recordset || !mainResult.recordset.length) {
        const err = new Error('No existe Evaluacion Entidad RDA Consulta Externa para el Id indicado');
        err.code = 'RDACE_NOT_FOUND';
        throw err;
    }

    const row = mainResult.recordset[0];
    let storedPdfBuffer = Buffer.isBuffer(row.ContenidoDocumentoPdfBin) && row.ContenidoDocumentoPdfBin.length
        ? row.ContenidoDocumentoPdfBin
        : null;
    if (!storedPdfBuffer && row.ContenidoDocumentoPdfBase64) {
        try {
            const b64 = String(row.ContenidoDocumentoPdfBase64).trim();
            if (b64) {
                const decoded = Buffer.from(b64, 'base64');
                if (decoded && decoded.length) storedPdfBuffer = decoded;
            }
        } catch (_) {
            /* noop: se continúa sin PDF almacenado */
        }
    }
    const fechaGeneracionPdf = row.FechaGeneracionDocumentoPdf || null;

    const head = { ...row };
    delete head.ContenidoDocumentoPdfBin;
    delete head.FechaGeneracionDocumentoPdf;
    delete head.ContenidoDocumentoPdfBase64;

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
                    SexoPaciente,
                    Sexo,
                    IdSexo,
                    FechaNacimientoBase        AS FechaNacimiento,
                    codigoIdentidadGeneroBase  AS CodigoIdentidadGenero,
                    IdentidadGeneroBase        AS TextoIdentidadGenero,
                    IdSexoIdentidadGenero      AS IdIdentidadGenero,
                    [CódigoZonaResidencia]     AS CodigoZonaResidencia,
                    [DescripciónZonaResidencia] AS DescripcionZonaResidencia,
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
                    Tel                        AS TelefonoCelular,
                    [CódigoOcupación]           AS CodigoOcupacion,
                    [Ocupación]                AS Ocupacion
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
            SELECT pm.[Codigo Medicamento] AS CodigoMedicamento, pm.[Nombre Medicamento] AS NombreMedicamento,
                   pm.[Descripcion Comun DCI] AS DCI, pm.[Fecha Prescripcion] AS FechaPrescripcion,
                   pm.[Dosis Ordenada] AS DosisOrdenada, pm.[Unidad Medida Dosis] AS UnidadDosis,
                   pm.[Via Administracion] AS ViaAdministracion,
                   pm.[Duracion Cantidad] AS DuracionCantidad, pm.[Duracion Unidad Tiempo] AS DuracionUnidad,
                   pm.[Frecuencia Cantidad] AS FrecuenciaCantidad, pm.[Frecuencia Unidad Tiempo] AS FrecuenciaUnidad,
                   pm.[Finalidad Tec Salud] AS Finalidad,
                   fin.Codigo AS FinalidadCodigo, fin.Descripcion AS FinalidadDescripcion,
                   umm.Codigo AS UnidadDosisCodigo, umm.Descripcion AS UnidadDosisDescripcion,
                   dur.Codigo AS DuracionUnidadCodigo, dur.Descripcion AS DuracionUnidadDescripcion,
                   freq.Codigo AS FrecuenciaUnidadCodigo, freq.Descripcion AS FrecuenciaUnidadDescripcion
            FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos] pm
            LEFT JOIN [dbo].[Cnsta Finalidad tecnologia salud 1888] fin
                ON LTRIM(RTRIM(fin.Codigo)) = LTRIM(RTRIM(pm.[Finalidad Tec Salud]))
            LEFT JOIN [dbo].[Cnsta Unidad medida dosis 1888] umm
                ON LTRIM(RTRIM(umm.Codigo)) = LTRIM(RTRIM(pm.[Unidad Medida Dosis]))
                OR LTRIM(RTRIM(umm.Descripcion)) = LTRIM(RTRIM(pm.[Unidad Medida Dosis]))
            LEFT JOIN [dbo].[Cnsta Unidad tiempo duracion 1888] dur
                ON LTRIM(RTRIM(dur.Codigo)) = LTRIM(RTRIM(pm.[Duracion Unidad Tiempo]))
                OR LTRIM(RTRIM(dur.Descripcion)) = LTRIM(RTRIM(pm.[Duracion Unidad Tiempo]))
            LEFT JOIN [dbo].[Cnsta Unidad tiempo frecuencia 1888] freq
                ON LTRIM(RTRIM(freq.Codigo)) = LTRIM(RTRIM(pm.[Frecuencia Unidad Tiempo]))
                OR LTRIM(RTRIM(freq.Descripcion)) = LTRIM(RTRIM(pm.[Frecuencia Unidad Tiempo]))
            WHERE pm.[Id Evaluacion Entidad RDA Consulta Externa] = @Id AND pm.[Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT pp.[Codigo Procedimiento] AS CodigoProcedimiento,
                   pp.[Nombre Procedimiento] AS NombreProcedimiento,
                   pp.[Finalidad Tec Salud] AS Finalidad,
                   fin.Codigo AS FinalidadCodigo, fin.Descripcion AS FinalidadDescripcion,
                   pp.[Fecha Prescripcion] AS FechaPrescripcion
            FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos] pp
            LEFT JOIN [dbo].[Cnsta Finalidad tecnologia salud 1888] fin
                ON LTRIM(RTRIM(fin.Codigo)) = LTRIM(RTRIM(pp.[Finalidad Tec Salud]))
                OR LTRIM(RTRIM(fin.Descripcion)) = LTRIM(RTRIM(pp.[Finalidad Tec Salud]))
                OR LTRIM(RTRIM(fin.Codigo)) = LEFT(LTRIM(RTRIM(pp.[Finalidad Tec Salud])), 2)
            WHERE pp.[Id Evaluacion Entidad RDA Consulta Externa] = @Id AND pp.[Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT ot.[Codigo] AS Codigo, ot.[Nombre] AS Nombre,
                   ot.[Fecha Prescripcion] AS FechaPrescripcion, ot.[Finalidad Tec Salud] AS Finalidad,
                   fin.Codigo AS FinalidadCodigo, fin.Descripcion AS FinalidadDescripcion
            FROM [dbo].[Evaluacion Entidad RDA CE Otras Tecnologias] ot
            LEFT JOIN [dbo].[Cnsta Finalidad tecnologia salud 1888] fin
                ON LTRIM(RTRIM(fin.Codigo)) = LTRIM(RTRIM(ot.[Finalidad Tec Salud]))
            WHERE ot.[Id Evaluacion Entidad RDA Consulta Externa] = @Id AND ot.[Id Estado] = 1
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

    let cupsFromRips = null;
    const docPaciente = String(head.DocumentoEntidad || '').trim();
    const fechaAtencion = head.FechaHoraInicioAtencion || head.FechaRDA || null;
    if (docPaciente) {
        const cupsRipsRes = await pool.request()
            .input('DocumentoPaciente', sql.VarChar(50), docPaciente)
            .input('FechaAtencion', sql.DateTime2, fechaAtencion)
            .query(`
                SELECT TOP 1
                    LTRIM(RTRIM(er.[Codigo Rips])) AS CodigoCups,
                    COALESCE(c1888.Nombre, c1888.Descripcion, cr.Nombre, cr.Descripcion) AS NombreCups,
                    LTRIM(RTRIM(s.[Código Servicios])) AS CodigoServicioReps,
                    s.[Nombre Servicios] AS NombreServicioReps
                FROM [dbo].[Evaluación Entidad Rips] er
                INNER JOIN [dbo].[Evaluación Entidad] ee
                    ON ee.[Id Evaluación Entidad] = er.[Id Evaluación Entidad]
                LEFT JOIN [dbo].[Cnsta Relacionador Servicios] s
                    ON s.[Id Servicios] = er.[Id Servicios]
                LEFT JOIN [dbo].[Cnsta Cups 1888] c1888
                    ON LTRIM(RTRIM(c1888.Codigo)) = LTRIM(RTRIM(er.[Codigo Rips]))
                LEFT JOIN [dbo].[Cnsta Relacionador Cups] cr
                    ON LTRIM(RTRIM(cr.Codigo)) = LTRIM(RTRIM(er.[Codigo Rips]))
                WHERE LTRIM(RTRIM(ee.[Documento Entidad])) = LTRIM(RTRIM(@DocumentoPaciente))
                  AND (
                      (er.[Codigo Rips] IS NOT NULL AND LTRIM(RTRIM(er.[Codigo Rips])) NOT IN ('', '0'))
                      OR er.[Id Servicios] IS NOT NULL
                  )
                ORDER BY
                    CASE WHEN @FechaAtencion IS NOT NULL
                         AND CAST(ee.[Fecha Evaluación Entidad] AS DATE) = CAST(@FechaAtencion AS DATE)
                         THEN 0 ELSE 1 END,
                    CASE WHEN @FechaAtencion IS NOT NULL
                         THEN ABS(DATEDIFF(MINUTE, ee.[Fecha Evaluación Entidad], @FechaAtencion))
                         ELSE 999999 END,
                    ee.[Fecha Evaluación Entidad] DESC
            `);
        cupsFromRips = (cupsRipsRes.recordset && cupsRipsRes.recordset[0]) || null;
    }

    let empresaIps = null;
    const codPrest = str(head.CodigoPrestador);
    if (codPrest) {
        const empRes = await pool.request()
            .input('CodPrest', sql.VarChar(50), codPrest)
            .query(`
                SELECT TOP 1
                    e.DocumentoEmpresa,
                    e.RazonSocialEmpresa,
                    e.NombreComercialEmpresa,
                    e.[FechaInscripción}Empresa] AS FechaInscripcionEmpresa,
                    c1888.Codigo AS CodigoMunicipioDivipola,
                    c1888.Nombre AS NombreMunicipio
                FROM [dbo].[Cnsta Empresa 1888] e
                LEFT JOIN [dbo].[Cnsta Ciudad 1888] c1888
                    ON c1888.IdCiudad1888 = e.IdCiudad
                WHERE LTRIM(RTRIM(e.NroIDPrestador)) = LTRIM(RTRIM(@CodPrest))
            `);
        empresaIps = (empRes.recordset && empRes.recordset[0]) || null;
    }

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
        cupsFromRips,
        empresaIps,
        storedPdfBuffer,
        fechaGeneracionPdf,
    };
}

module.exports = { loadRdaceAggregate };

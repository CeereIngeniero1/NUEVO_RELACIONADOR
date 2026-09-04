/*
================================================================================
  VISTAS RELACIONADOR 2275 — INSTALACIÓN IDEMPOTENTE
================================================================================
  Generado a partir de los scripts en back_relacionador/SQL/2275:
    - 3. Query.sql
    - 4. QUERRYS Asignar Rips.sql
    - 5. CREACION_VISTAS_MAESTRO.sql

  Patrón por vista:
    IF OBJECT_ID(...) IS NOT NULL → DROP VIEW → CREATE VIEW

  Cuando un script original tenía CREATE + ALTER, aquí va la versión ALTER
  (definición vigente).

  Prerrequisitos (tablas / columnas que deben existir antes de ejecutar):
    - Tablas RIPS: [RIPS Modalidad Atención], [RIPS Grupo Servicios],
      [RIPS Servicios] (con columna [Codigo Grupo Servicios]),
      [RIPS Via Ingreso Usuario], [RIPS Finalidad Consulta Version2],
      [RIPS Causa Externa Version2], [Tipo de Diagnóstico Principal],
      [Rips Cie10], [Rips Cups], [Tipo Rips], Estado
    - Tablas CeereSIO: [Evaluación Entidad] (columna Rips bit),
      [Evaluación Entidad Rips], Entidad, EntidadII, EntidadIII, Sexo,
      [Tipo de Documento], [Tipo de Evaluación], [Función Por Entidad],
      Función, Factura, EmpresaV, Empresa, [Plan de Tratamiento], etc.
    - Tabla API_RIPS_POR_DEFECTO (script 4)
    - Tablas legacy CeereSIO AC/AP: [Finalidad Consulta], [Causa Externa],
      [Finalidad del Procedimiento]

  Uso en backend (Node):
    - Asignar_RipsRoutes V1/V3/experimental → vistas Cnsta Relacionador *
    - MaestroListasRipsRoutes → VISTA_*
    - historiasClinicasRoutes → ConsultaFacturas/Presupuestos, Usuarios Info
    - rdaceAggregateLoader, RdaPacienteRoutes, RdaConsultaExternaRoutesv2
    - V2 usa además vistas *V2 (NO incluidas aquí; ver NUEVAS TABLAS RIPS.sql)

  Ejecutar contra la base de datos CeereSIO del cliente.
================================================================================
*/

SET NOCOUNT ON;
GO

/* ============================================================================
   SECCIÓN 1 — Vistas legacy CeereSIO (AC/AP)
   Origen: 3. Query.sql
   Uso: formularios CeereSIO desktop (no referenciadas en Node)
   ============================================================================ */

IF OBJECT_ID(N'dbo.[Cnsta VB Todos - Finalidad Consulta - Orden Alfabético]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta VB Todos - Finalidad Consulta - Orden Alfabético];
GO

CREATE VIEW dbo.[Cnsta VB Todos - Finalidad Consulta - Orden Alfabético]
AS
SELECT [Id Finalidad Consulta], [Finalidad Consulta], [Descripción Finalidad Consulta]
FROM dbo.[Finalidad Consulta]
WHERE ([Id Finalidad Consulta] <> 1) AND ([Id Estado] = 7);
GO

IF OBJECT_ID(N'dbo.[Cnsta VB Todos - Causa Externa - Orden Alfabético]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta VB Todos - Causa Externa - Orden Alfabético];
GO

CREATE VIEW dbo.[Cnsta VB Todos - Causa Externa - Orden Alfabético]
AS
SELECT [Id Causa Externa], [Causa Externa], [Descripción Causa Externa]
FROM dbo.[Causa Externa]
WHERE ([Id Causa Externa] <> 1) AND ([Id Estado] = 7);
GO

IF OBJECT_ID(N'dbo.[Cnsta VB Todos - Finalidad del Procedimiento - Orden Alfabético]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta VB Todos - Finalidad del Procedimiento - Orden Alfabético];
GO

CREATE VIEW dbo.[Cnsta VB Todos - Finalidad del Procedimiento - Orden Alfabético]
AS
SELECT [Id Finalidad del Procedimiento], [Finalidad del Procedimiento], [Descripción Finalidad del Procedimiento]
FROM dbo.[Finalidad del Procedimiento]
WHERE ([Id Finalidad del Procedimiento] <> 1) AND ([Id Estado] = 7);
GO

/* ============================================================================
   SECCIÓN 2 — Vistas catálogo Relacionador (Asignar RIPS)
   Origen: 4. QUERRYS Asignar Rips.sql
   Uso: Asignar_RipsRoutes*, rdaceAggregateLoader, RDA
   ============================================================================ */

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Info Evaluacion Usuario]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Info Evaluacion Usuario];
GO

CREATE VIEW dbo.[Cnsta Relacionador Info Evaluacion Usuario]
AS
SELECT
    dbo.[Evaluación Entidad].[Id Evaluación Entidad],
    dbo.[Evaluación Entidad].[Id Tipo de Evaluación],
    dbo.[Tipo de Evaluación].[Tipo de Evaluación],
    dbo.[Evaluación Entidad].[Fecha Evaluación Entidad],
    dbo.[Evaluación Entidad].[Documento Entidad],
    dbo.[Tipo de Documento].[Tipo de Documento] + N' ' + dbo.[Evaluación Entidad].[Documento Entidad] AS Identificacion,
    dbo.[Evaluación Entidad].[Edad Entidad Evaluación Entidad],
    dbo.[Evaluación Entidad].[Acompañante Evaluación Entidad],
    dbo.[Evaluación Entidad].[Id Parentesco],
    dbo.[Evaluación Entidad].[Teléfono Acompañante],
    dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad],
    dbo.[Evaluación Entidad].[Diagnóstico Específico Evaluación Entidad],
    dbo.[Evaluación Entidad].[Manejo de Medicamentos],
    dbo.[Evaluación Entidad].[Dirección Domicilio],
    dbo.[Evaluación Entidad].[Id Ciudad],
    dbo.[Evaluación Entidad].[Teléfono Domicilio],
    dbo.[Evaluación Entidad].[Fecha Nacimiento],
    dbo.[Evaluación Entidad].[Id Unidad de Medida Edad],
    dbo.[Evaluación Entidad].[Id Sexo],
    dbo.[Evaluación Entidad].[Id Estado],
    dbo.[Evaluación Entidad].[Id Estado Civil],
    dbo.[Evaluación Entidad].[Id Ocupación],
    dbo.[Evaluación Entidad].[Documento Aseguradora],
    dbo.[Evaluación Entidad].[Id Tipo de Afiliado],
    dbo.[Evaluación Entidad].[Responsable Evaluación Entidad],
    dbo.[Evaluación Entidad].[Id Parentesco Responsable],
    dbo.[Evaluación Entidad].[Teléfono Responsable],
    dbo.[Evaluación Entidad].[Documento Usuario],
    dbo.[Evaluación Entidad].[Documento Empresa],
    dbo.[Evaluación Entidad].[Id Terminal],
    dbo.[Evaluación Entidad].[Documento Profesional],
    dbo.[Evaluación Entidad].[Id Estado Web],
    dbo.[Evaluación Entidad].[Con Orden],
    dbo.[Evaluación Entidad].[Firma Evaluación Entidad],
    dbo.[Evaluación Entidad].Sincronizado,
    dbo.[Evaluación Entidad].PreguntarControl,
    dbo.[Evaluación Entidad].NombreFormatoAux
FROM dbo.[Evaluación Entidad]
INNER JOIN dbo.Entidad
    ON dbo.[Evaluación Entidad].[Documento Entidad] = dbo.Entidad.[Documento Entidad]
INNER JOIN dbo.[Tipo de Documento]
    ON dbo.Entidad.[Id Tipo de Documento] = dbo.[Tipo de Documento].[Id Tipo de Documento]
INNER JOIN dbo.[Tipo de Evaluación]
    ON dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = dbo.[Tipo de Evaluación].[Id Tipo de Evaluación];
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Usuarios HC]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Usuarios HC];
GO

CREATE VIEW dbo.[Cnsta Relacionador Usuarios HC]
AS
SELECT
    dbo.[Evaluación Entidad].[Fecha Evaluación Entidad] AS FechaEvaluacion,
    dbo.[Evaluación Entidad].[Documento Entidad] AS DocumentoPaciente,
    dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente,
    dbo.[Evaluación Entidad].[Documento Usuario] AS DocumentoUsuario,
    dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips],
    dbo.[Evaluación Entidad].Rips
FROM dbo.[Evaluación Entidad]
INNER JOIN dbo.Entidad
    ON dbo.[Evaluación Entidad].[Documento Entidad] = dbo.Entidad.[Documento Entidad]
LEFT OUTER JOIN dbo.[Evaluación Entidad Rips]
    ON dbo.[Evaluación Entidad].[Id Evaluación Entidad] = dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad]
WHERE (dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips] IS NULL)
  AND (dbo.[Evaluación Entidad].[Id Tipo de Evaluación] <> 2)
  AND (dbo.[Evaluación Entidad].Rips <> 0);
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Usuarios Info]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Usuarios Info];
GO

CREATE VIEW dbo.[Cnsta Relacionador Usuarios Info]
AS
SELECT
    REPLACE(REPLACE(dbo.Entidad.[Documento Entidad], CHAR(13), ''), CHAR(10), '') AS DocumentoPaciente,
    dbo.Entidad.[Primer Apellido Entidad] AS PrimerApellidoPaciente,
    dbo.Entidad.[Segundo Apellido Entidad] AS SegundoApellidoPaciente,
    dbo.Entidad.[Primer Nombre Entidad] AS PrimerNombrePaciente,
    dbo.Entidad.[Segundo Nombre Entidad] AS SegundoNombrePaciente,
    dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente,
    dbo.Sexo.[Descripción Sexo] AS Sexo,
    dbo.EntidadIII.[Edad EntidadIII] AS Edad,
    dbo.EntidadII.[Dirección EntidadII] AS Direccion,
    dbo.EntidadII.[Teléfono Celular EntidadII] AS Tel,
    dbo.[Tipo de Documento].[Tipo de Documento] + N' ' + dbo.Entidad.[Documento Entidad] AS DocumentoTipoDOC
FROM dbo.Entidad
INNER JOIN dbo.EntidadII
    ON dbo.Entidad.[Documento Entidad] = dbo.EntidadII.[Documento Entidad]
INNER JOIN dbo.EntidadIII
    ON dbo.Entidad.[Documento Entidad] = dbo.EntidadIII.[Documento Entidad]
INNER JOIN dbo.Sexo
    ON dbo.EntidadIII.[Id Sexo] = dbo.Sexo.[Id Sexo]
INNER JOIN dbo.[Tipo de Documento]
    ON dbo.Entidad.[Id Tipo de Documento] = dbo.[Tipo de Documento].[Id Tipo de Documento];
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Info Historias]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Info Historias];
GO

CREATE VIEW dbo.[Cnsta Relacionador Info Historias]
AS
SELECT
    FORMAT(dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 'dd/MM/yyyy') AS FechaEvaluacionTexto,
    dbo.[Evaluación Entidad].[Documento Entidad] AS DocumentoPaciente,
    dbo.[Evaluación Entidad].[Id Tipo de Evaluación] AS IdTipodeEvaluacion,
    dbo.[Tipo de Evaluación].[Descripción Tipo de Evaluación] AS DescripcionTipodeEvaluación,
    CASE
        WHEN dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = 4 THEN
            SUBSTRING(
                CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)),
                CHARINDEX('\', CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)),
                    CHARINDEX('\', CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX))) + 1) + 1,
                LEN(CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)))
            )
        ELSE CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX))
    END AS Formato_Diagnostico,
    dbo.[Evaluación Entidad].[Diagnóstico Específico Evaluación Entidad] AS DiagnósticoEspecíficoEvaluacionEntidad,
    dbo.[Evaluación Entidad].[Documento Usuario] AS DocumentoUsuario,
    dbo.[Evaluación Entidad].[Id Evaluación Entidad] AS IdEvaluaciónEntidad,
    RIGHT(CONVERT(VARCHAR(20), dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 100), 7) AS HoraEvaluacion,
    dbo.[Evaluación Entidad].[Fecha Evaluación Entidad] AS FechaEvaluacion,
    dbo.[Evaluación Entidad].Rips
FROM dbo.[Evaluación Entidad]
LEFT OUTER JOIN dbo.[Evaluación Entidad Rips]
    ON dbo.[Evaluación Entidad].[Id Evaluación Entidad] = dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad]
INNER JOIN dbo.[Tipo de Evaluación]
    ON dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = dbo.[Tipo de Evaluación].[Id Tipo de Evaluación]
WHERE (dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips] IS NULL)
  AND (dbo.[Evaluación Entidad].[Id Tipo de Evaluación] <> 2)
  AND (dbo.[Evaluación Entidad].Rips = 1);
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Tipo Rips]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Tipo Rips];
GO

CREATE VIEW dbo.[Cnsta Relacionador Tipo Rips]
AS
SELECT
    [Id Tipo Rips] AS IdTipoRips,
    [Código Tipo Rips] AS CódigoTipoRips,
    [Tipo Rips] AS TipoRips,
    [Descripción Tipo Rips] AS DescripcionTipoRips,
    [Id Estado] AS IdEstado
FROM dbo.[Tipo Rips]
WHERE ([Id Estado] = 7);
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Entidades Rips]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Entidades Rips];
GO

CREATE VIEW dbo.[Cnsta Relacionador Entidades Rips]
AS
SELECT
    dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente,
    dbo.[Función Por Entidad].[Id Función],
    dbo.Función.Función,
    dbo.Entidad.[Documento Entidad] AS DocumentoEntidad,
    MIN(dbo.[Tipo Rips].[Id Tipo Rips]) AS IdTipoRips
FROM dbo.Entidad
INNER JOIN dbo.[Función Por Entidad]
    ON dbo.Entidad.[Documento Entidad] = dbo.[Función Por Entidad].[Documento Entidad]
INNER JOIN dbo.Función
    ON dbo.[Función Por Entidad].[Id Función] = dbo.Función.[Id Función]
INNER JOIN dbo.[Tipo Rips]
    ON dbo.[Función Por Entidad].[Id Función] = dbo.[Tipo Rips].[Código Tipo Rips]
WHERE (dbo.[Función Por Entidad].[Id Función] IN (17, 24, 23))
GROUP BY
    dbo.Entidad.[Nombre Completo Entidad],
    dbo.[Función Por Entidad].[Id Función],
    dbo.Función.Función,
    dbo.Entidad.[Documento Entidad];
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Modalidad Atencion]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Modalidad Atencion];
GO

CREATE VIEW dbo.[Cnsta Relacionador Modalidad Atencion]
AS
SELECT
    [Id Modalidad Atencion] AS IdModalidadAtencion,
    Codigo,
    [Nombre Modalidad Atencion] AS NombreModalidadAtencion,
    [Descripción Modalidad Atencion] AS DescripcionModalidadAtencion,
    [Orden Modalidad Atencion] AS OrdenModalidadAtencion,
    [Id Estado]
FROM dbo.[RIPS Modalidad Atención]
WHERE ([Id Estado] = 7);
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador ModalidadGrupoServicioTecSal]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador ModalidadGrupoServicioTecSal];
GO

CREATE VIEW dbo.[Cnsta Relacionador ModalidadGrupoServicioTecSal]
AS
SELECT
    [Id Grupo Servicios] AS IdGrupoServicios,
    Codigo,
    [Nombre Grupo Servicios] AS NombreGrupoServicios,
    [Descripción Grupo Servicios] AS DescripcionGrupoServicios,
    [Orden Grupo Servicios],
    [Id Estado]
FROM dbo.[RIPS Grupo Servicios]
WHERE ([Id Estado] = 7);
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Servicios]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Servicios];
GO

CREATE VIEW dbo.[Cnsta Relacionador Servicios]
AS
SELECT
    dbo.[RIPS Servicios].[Id Servicios],
    dbo.[RIPS Servicios].[Código Servicios],
    dbo.[RIPS Servicios].[Nombre Servicios],
    dbo.[RIPS Servicios].[Descripción Servicios],
    dbo.[RIPS Servicios].[Id Estado],
    dbo.[RIPS Servicios].[Codigo Grupo Servicios],
    dbo.[RIPS Grupo Servicios].[Id Grupo Servicios]
FROM dbo.[RIPS Servicios]
INNER JOIN dbo.[RIPS Grupo Servicios]
    ON dbo.[RIPS Servicios].[Codigo Grupo Servicios] = dbo.[RIPS Grupo Servicios].Codigo
WHERE (dbo.[RIPS Servicios].[Id Estado] = 7);
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Finalidad]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Finalidad];
GO

CREATE VIEW dbo.[Cnsta Relacionador Finalidad]
AS
SELECT
    [Id Finalidad Consulta] AS IdFinalidadConsulta,
    Codigo,
    [Nombre RIPS Finalidad Consulta Version2] AS NombreRIPSFinalidadConsultaVersion2,
    [Descripción RIPS Finalidad Consulta Version2] AS DescripcionRIPSFinalidadConsultaVersion2,
    [Orden RIPS Finalidad Consulta Version2] AS RIPSFinalidadConsultaVersion2,
    AC,
    AP,
    [Id Estado]
FROM dbo.[RIPS Finalidad Consulta Version2];
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Causa Externa]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Causa Externa];
GO

CREATE VIEW dbo.[Cnsta Relacionador Causa Externa]
AS
SELECT
    [Id RIPS Causa Externa Version2],
    Codigo,
    [Nombre RIPS Causa Externa Version2] AS NombreRIPSCausaExternaVersion2,
    [Descripción RIPS Causa Externa Version2] AS DescripcionRIPSCausaExternaVersion2,
    [Orden RIPS Causa Externa Version2] AS RIPSCausaExternaVersion2,
    [Id Estado]
FROM dbo.[RIPS Causa Externa Version2]
WHERE ([Id Estado] = 7);
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Tipo Diagnostico Principal]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Tipo Diagnostico Principal];
GO

CREATE VIEW dbo.[Cnsta Relacionador Tipo Diagnostico Principal]
AS
SELECT
    [Id Tipo de Diagnóstico Principal] AS IdTipodeDiagnósticoPrincipal,
    [Código Tipo de Diagnóstico Principal] AS CódigoTipodeDiagnósticoPrincipal,
    [Tipo de Diagnóstico Principal] AS TipodeDiagnósticoPrincipal,
    [Descripción Tipo de Diagnóstico Principal] AS DescripcionTipodeDiagnósticoPrincipal,
    [Orden Tipo de Diagnóstico Principal] AS ordenTipodeDiagnósticoPrincipal,
    [Id Estado]
FROM dbo.[Tipo de Diagnóstico Principal]
WHERE ([Id Estado] = 7);
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Via Ingreso Usuario]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Via Ingreso Usuario];
GO

CREATE VIEW dbo.[Cnsta Relacionador Via Ingreso Usuario]
AS
SELECT
    [Id Via Ingreso Usuario] AS IdViaIngresoUsuario,
    Codigo,
    [Nombre Via Ingreso Usuario] AS NombreViaIngresoUsuario,
    [Descripción Via Ingreso Usuario] AS DescripcionViaIngresoUsuario,
    [Orden Via Ingreso Usuario] AS OrdenViaIngresoUsuario,
    [Id Estado]
FROM dbo.[RIPS Via Ingreso Usuario]
WHERE ([Id Estado] = 7);
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Cie10]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Cie10];
GO

CREATE VIEW dbo.[Cnsta Relacionador Cie10]
AS
SELECT
    Codigo,
    Nombre,
    Descripcion,
    AplicaASexo,
    EdadMinima,
    EdadMaxima,
    GrupoMortalidad,
    Extra_V,
    Extra_VI_Capitulo,
    SubGrupo,
    Sexo
FROM dbo.[Rips Cie10];
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Cups]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Cups];
GO

CREATE VIEW dbo.[Cnsta Relacionador Cups]
AS
SELECT Codigo, Descripcion, Nombre, Tipo
FROM dbo.[Rips Cups];
GO

/* ============================================================================
   SECCIÓN 3 — Vistas de negocio (RIPS por defecto, facturas, presupuestos)
   Origen: 4. QUERRYS Asignar Rips.sql
   ============================================================================ */

IF OBJECT_ID(N'dbo.[ConsultarRIPSPorDefecto]', N'V') IS NOT NULL
    DROP VIEW dbo.[ConsultarRIPSPorDefecto];
GO

CREATE VIEW dbo.[ConsultarRIPSPorDefecto]
AS
SELECT
    APIRPD.DocumentoEntidad,
    APIRPD.TipoDeRips,
    TR.[Tipo Rips] AS TipoDeUsuario,
    Ent.[Nombre Completo Entidad] AS Entidad,
    RIPSVIAINU.[Nombre Via Ingreso Usuario] AS ViaIngresoServicioSalud,
    RIPSMA.[Nombre Modalidad Atencion] AS ModalidadGrupoServicioTecnologiaEnSalud,
    RIPSGS.[Nombre Grupo Servicios] AS GrupoServicios,
    RIPSS.[Nombre Servicios] AS CodigoServicio,
    RIPSFCV2.[Nombre RIPS Finalidad Consulta Version2] AS FinalidadTecnologiaSalud,
    RC1.Nombre AS Diagnostico1,
    RC2.Nombre AS Diagnostico2,
    R1C10.Nombre AS Procedimiento1,
    R2C10.Nombre AS Procedimiento2,
    RCEV2.[Nombre RIPS Causa Externa Version2] AS CausaMotivoAtencion,
    TDP.[Descripción Tipo de Diagnóstico Principal] AS TipoDiagnosticoPrincipal
FROM dbo.API_RIPS_POR_DEFECTO AS APIRPD
LEFT OUTER JOIN dbo.[Tipo Rips] AS TR
    ON APIRPD.TipoDeUsuario = TR.[Id Tipo Rips]
LEFT OUTER JOIN dbo.Entidad AS Ent
    ON APIRPD.Entidad = Ent.[Documento Entidad]
LEFT OUTER JOIN dbo.[RIPS Via Ingreso Usuario] AS RIPSVIAINU
    ON APIRPD.ViaIngresoServicioSalud = RIPSVIAINU.Codigo
LEFT OUTER JOIN dbo.[RIPS Modalidad Atención] AS RIPSMA
    ON APIRPD.ModalidadGrupoServicioTecnologiaEnSalud = RIPSMA.Codigo
LEFT OUTER JOIN dbo.[RIPS Grupo Servicios] AS RIPSGS
    ON APIRPD.GrupoServicios = RIPSGS.Codigo
LEFT OUTER JOIN dbo.[RIPS Servicios] AS RIPSS
    ON APIRPD.CodigoServicio = RIPSS.[Id Servicios]
LEFT OUTER JOIN dbo.[RIPS Finalidad Consulta Version2] AS RIPSFCV2
    ON APIRPD.FinalidadTecnologiaSalud = RIPSFCV2.Codigo
LEFT OUTER JOIN dbo.[Rips Cups] AS RC1
    ON APIRPD.Diagnostico1 = RC1.Codigo
LEFT OUTER JOIN dbo.[Rips Cups] AS RC2
    ON APIRPD.Diagnostico2 = RC2.Codigo
LEFT OUTER JOIN dbo.[Rips Cie10] AS R1C10
    ON APIRPD.Procedimiento1 = R1C10.Codigo
LEFT OUTER JOIN dbo.[Rips Cie10] AS R2C10
    ON APIRPD.Procedimiento2 = R2C10.Codigo
LEFT OUTER JOIN dbo.[RIPS Causa Externa Version2] AS RCEV2
    ON APIRPD.CausaMotivoAtencion = RCEV2.Codigo
LEFT OUTER JOIN dbo.[Tipo de Diagnóstico Principal] AS TDP
    ON APIRPD.TipoDiagnosticoPrincipal = TDP.[Código Tipo de Diagnóstico Principal];
GO

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Info Pacientes Facturas]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Info Pacientes Facturas];
GO

CREATE VIEW dbo.[Cnsta Relacionador Info Pacientes Facturas]
AS
SELECT
    en.[Nombre Completo Entidad] AS [Nombre Paciente],
    tp.[Tipo de Documento],
    eve.[Documento Entidad],
    eve.[Fecha Evaluación Entidad],
    fc.[Id Factura],
    eve.[Id Evaluación Entidad],
    em.[Documento Empresa]
FROM dbo.[Evaluación Entidad Rips] AS everips
INNER JOIN dbo.[Evaluación Entidad] AS eve
    ON eve.[Id Evaluación Entidad] = everips.[Id Evaluación Entidad]
INNER JOIN dbo.Entidad AS en
    ON eve.[Documento Entidad] = en.[Documento Entidad]
LEFT OUTER JOIN dbo.Factura AS fc
    ON eve.[Documento Entidad] = fc.[Documento Paciente]
INNER JOIN dbo.[Tipo de Documento] AS tp
    ON en.[Id Tipo de Documento] = tp.[Id Tipo de Documento]
LEFT OUTER JOIN dbo.Empresa AS em
    ON eve.[Documento Empresa] = em.[Documento Empresa];
GO

IF OBJECT_ID(N'dbo.[ConsultaFacturasPaciente]', N'V') IS NOT NULL
    DROP VIEW dbo.[ConsultaFacturasPaciente];
GO

CREATE VIEW dbo.[ConsultaFacturasPaciente]
AS
SELECT
    Fac.[Documento Paciente] AS DocumentoPaciente,
    Fac.[Documento Responsable] AS DocumentoResponsable,
    Fac.[Id Factura] AS Value,
    Fac.[Fecha Factura] AS FechaFactura,
    EmpV.[Prefijo Resolución Facturación EmpresaV] + Fac.[No Factura] + ' - '
        + DATENAME(WEEKDAY, Fac.[Fecha Factura]) + ' '
        + CAST(DAY(Fac.[Fecha Factura]) AS VARCHAR) + ' de '
        + DATENAME(MONTH, Fac.[Fecha Factura]) + ' del '
        + CAST(YEAR(Fac.[Fecha Factura]) AS VARCHAR) AS Text,
    Fac.[Total Factura] AS TotalFactura
FROM dbo.Factura AS Fac
INNER JOIN dbo.EmpresaV AS EmpV
    ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.[Evaluación Entidad Rips] evr
    WHERE evr.[Id Factura] = Fac.[Id Factura]
);
GO

IF OBJECT_ID(N'dbo.[ConsultaPresupuestosPaciente]', N'V') IS NOT NULL
    DROP VIEW dbo.[ConsultaPresupuestosPaciente];
GO

CREATE VIEW dbo.[ConsultaPresupuestosPaciente]
AS
SELECT
    Presupuesto.[Id Plan de Tratamiento] AS Value,
    Presupuesto.[Fecha Inicio Plan de Tratamiento] AS FechaPresupuesto,
    Presupuesto.[Documento Paciente] AS DocumentoPaciente,
    Presupuesto.[Nro Plan de Tratamiento] + ' - '
        + DATENAME(WEEKDAY, Presupuesto.[Fecha Inicio Plan de Tratamiento]) + ' '
        + CAST(DAY(Presupuesto.[Fecha Inicio Plan de Tratamiento]) AS VARCHAR) + ' del '
        + CAST(YEAR(Presupuesto.[Fecha Inicio Plan de Tratamiento]) AS VARCHAR) AS Text,
    SUM(PresupuestoItems.[Valor Plan de Tratamiento Items]) AS TotalPresupuesto,
    PresupuestoTratamientos.[Id Forma de Pago Tratamiento] AS FormaDePago
FROM dbo.[Plan de Tratamiento] AS Presupuesto
INNER JOIN dbo.[Plan de Tratamiento Items] AS PresupuestoItems
    ON Presupuesto.[Id Plan de Tratamiento] = PresupuestoItems.[Id Plan de Tratamiento]
INNER JOIN dbo.[Plan de Tratamiento Tratamientos] AS PresupuestoTratamientos
    ON Presupuesto.[Id Plan de Tratamiento] = PresupuestoTratamientos.[Id Plan de Tratamiento]
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.[Evaluación Entidad Rips] evr
    WHERE evr.[Id Plan de Tratamiento] = Presupuesto.[Id Plan de Tratamiento]
)
GROUP BY
    PresupuestoItems.[Id Plan de Tratamiento],
    Presupuesto.[Id Plan de Tratamiento],
    Presupuesto.[Fecha Inicio Plan de Tratamiento],
    Presupuesto.[Documento Paciente],
    Presupuesto.[Nro Plan de Tratamiento],
    PresupuestoTratamientos.[Id Forma de Pago Tratamiento];
GO

/* ============================================================================
   SECCIÓN 4 — Vistas Maestro Listas RIPS
   Origen: 5. CREACION_VISTAS_MAESTRO.sql
   Uso: MaestroListasRipsRoutes.js
   ============================================================================ */

IF OBJECT_ID(N'dbo.VISTA_CAUSA_MOTIVO_ATENCION', N'V') IS NOT NULL
    DROP VIEW dbo.VISTA_CAUSA_MOTIVO_ATENCION;
GO

CREATE VIEW dbo.VISTA_CAUSA_MOTIVO_ATENCION
AS
SELECT
    dbo.[RIPS Causa Externa Version2].[Id RIPS Causa Externa Version2] AS IdCausaMotivoAtencion,
    dbo.[RIPS Causa Externa Version2].Codigo,
    dbo.[RIPS Causa Externa Version2].[Nombre RIPS Causa Externa Version2] AS NombreMotivoAtencion,
    dbo.Estado.Estado
FROM dbo.[RIPS Causa Externa Version2]
INNER JOIN dbo.Estado
    ON dbo.[RIPS Causa Externa Version2].[Id Estado] = dbo.Estado.[Id Estado];
GO

IF OBJECT_ID(N'dbo.VISTA_FINALIDAD_TECNOLOGIA_SALUD', N'V') IS NOT NULL
    DROP VIEW dbo.VISTA_FINALIDAD_TECNOLOGIA_SALUD;
GO

CREATE VIEW dbo.VISTA_FINALIDAD_TECNOLOGIA_SALUD
AS
SELECT
    dbo.[RIPS Finalidad Consulta Version2].[Id Finalidad Consulta] AS IdFinalidadConsulta,
    dbo.[RIPS Finalidad Consulta Version2].Codigo,
    dbo.[RIPS Finalidad Consulta Version2].[Nombre RIPS Finalidad Consulta Version2] AS NombreFinalidadConsulta,
    dbo.Estado.Estado
FROM dbo.[RIPS Finalidad Consulta Version2]
INNER JOIN dbo.Estado
    ON dbo.[RIPS Finalidad Consulta Version2].[Id Estado] = dbo.Estado.[Id Estado];
GO

IF OBJECT_ID(N'dbo.VISTA_GRUPO_SERVICIOS', N'V') IS NOT NULL
    DROP VIEW dbo.VISTA_GRUPO_SERVICIOS;
GO

CREATE VIEW dbo.VISTA_GRUPO_SERVICIOS
AS
SELECT
    [Id Grupo Servicios] AS IdGrupoServicio,
    [Codigo],
    [Nombre Grupo Servicios] AS NombreGrupoServicio,
    Est.Estado
FROM dbo.[RIPS Grupo Servicios]
INNER JOIN dbo.Estado Est
    ON dbo.[RIPS Grupo Servicios].[Id Estado] = Est.[Id Estado];
GO

IF OBJECT_ID(N'dbo.VISTA_MODALIDAD_ATENCION', N'V') IS NOT NULL
    DROP VIEW dbo.VISTA_MODALIDAD_ATENCION;
GO

CREATE VIEW dbo.VISTA_MODALIDAD_ATENCION
AS
SELECT
    [Id Modalidad Atencion] AS IdModalidadAtencion,
    Codigo,
    [Nombre Modalidad Atencion] AS NombreModalidadAtencion,
    [Descripción Modalidad Atencion] AS DescripcionModalidadAtencion,
    [Orden Modalidad Atencion] AS OrdenModalidadAtencion,
    Est.[Estado] AS Estado
FROM dbo.[RIPS Modalidad Atención]
INNER JOIN dbo.Estado Est
    ON dbo.[RIPS Modalidad Atención].[Id Estado] = Est.[Id Estado];
GO

IF OBJECT_ID(N'dbo.VISTA_SERVICIOS', N'V') IS NOT NULL
    DROP VIEW dbo.VISTA_SERVICIOS;
GO

CREATE VIEW dbo.VISTA_SERVICIOS
AS
SELECT
    dbo.[RIPS Servicios].[Id Servicios] AS IdServicios,
    dbo.[RIPS Servicios].[Código Servicios] AS Codigo,
    dbo.[RIPS Servicios].[Nombre Servicios] AS Descripcion,
    dbo.[RIPS Servicios].[Descripción Servicios] AS Grupo,
    dbo.Estado.Estado
FROM dbo.[RIPS Servicios]
INNER JOIN dbo.Estado
    ON dbo.[RIPS Servicios].[Id Estado] = dbo.Estado.[Id Estado];
GO

IF OBJECT_ID(N'dbo.VISTA_VIA_INGRESO_SERVICIO_SALUD', N'V') IS NOT NULL
    DROP VIEW dbo.VISTA_VIA_INGRESO_SERVICIO_SALUD;
GO

CREATE VIEW dbo.VISTA_VIA_INGRESO_SERVICIO_SALUD
AS
SELECT
    dbo.[RIPS Via Ingreso Usuario].[Id Via Ingreso Usuario] AS IdViaIngresoServicioSalud,
    dbo.[RIPS Via Ingreso Usuario].Codigo,
    dbo.[RIPS Via Ingreso Usuario].[Nombre Via Ingreso Usuario] AS NombreViaIngresoServicioSalud,
    dbo.Estado.Estado
FROM dbo.[RIPS Via Ingreso Usuario]
INNER JOIN dbo.Estado
    ON dbo.[RIPS Via Ingreso Usuario].[Id Estado] = dbo.Estado.[Id Estado];
GO

PRINT 'Vistas Relacionador 2275 instaladas correctamente (28 vistas).';
GO

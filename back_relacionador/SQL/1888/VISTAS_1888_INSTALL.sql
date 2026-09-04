/*
================================================================================
  VISTAS RESOLUCIÓN 1888 / RDA — INSTALACIÓN IDEMPOTENTE
================================================================================
  Generado a partir de:
    - 1888.sql
    - 1888 update a registros malos.sql

  Patrón: IF OBJECT_ID(...) IS NOT NULL → DROP VIEW → CREATE VIEW

  IMPORTANTE: [Cnsta Relacionador Usuarios Info] aquí REEMPLAZA la versión 2275
  con la versión extendida RDA (demografía 1888, Entidad1888, etc.).

  Prerrequisitos: tablas 1888, Entidad1888, RDA_MedicationTime, RDA_UMM,
  RDA_ViaAdministracion, RDA_ColombianTechModality (ver scripts 1888).

  Uso backend: Asignar_RipsRoutes V3, RdaPacienteRoutes, RdaConsultaExternaRoutes,
  rdaceAggregateLoader, rdaFhirCatalogs, historiasClinicasRoutes.
================================================================================
*/

SET NOCOUNT ON;
GO

/* SECCIÓN 1 — Demografía / paciente 1888 */

IF OBJECT_ID(N'dbo.[Cnsta Ciudad 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Ciudad 1888];
GO

CREATE VIEW dbo.[Cnsta Ciudad 1888]
AS
SELECT [Id Ciudad1888] AS IdCiudad1888, Codigo, Nombre, Estado
FROM dbo.Ciudad1888
WHERE (Estado = 7)
GO

IF OBJECT_ID(N'dbo.[Cnsta Pais 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Pais 1888];
GO

CREATE VIEW dbo.[Cnsta Pais 1888]
AS
SELECT [Id Pais1888] AS IdPais1888, Codigo, Nombre, Estado
FROM dbo.País1888
WHERE (Estado = 7)
GO

IF OBJECT_ID(N'dbo.[Cnsta Tipodocumento 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Tipodocumento 1888];
GO

CREATE VIEW dbo.[Cnsta Tipodocumento 1888]
AS
SELECT [Id Tipo de Documento] AS IdTipodeDocumento, [Código Tipo de Documento] AS CódigoTipoDocumento, [Tipo de Documento] AS TipoDocumento, [Descripción Tipo de Documento] AS DescripciónTipoDocumento
FROM dbo.[Tipo de Documento]
WHERE ([Tipo de Documento] = N'CC') OR ([Tipo de Documento] = N'TI') OR ([Tipo de Documento] = N'RC') OR ([Tipo de Documento] = N'CE') OR ([Tipo de Documento] = N'PA') OR ([Tipo de Documento] = N'PE') OR ([Tipo de Documento] = N'PT')
GO

IF OBJECT_ID(N'dbo.[Cnsta Sexo 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Sexo 1888];
GO

CREATE VIEW dbo.[Cnsta Sexo 1888]
AS
SELECT [Id Sexo] AS IdSexo, [Código Sexo] AS CódigoSexo, Sexo, [Descripción Sexo]
FROM dbo.Sexo
WHERE (Sexo = N'F') OR (Sexo = N'M')
GO

IF OBJECT_ID(N'dbo.[Cnsta SexoIdentidad 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta SexoIdentidad 1888];
GO

CREATE VIEW dbo.[Cnsta SexoIdentidad 1888]
AS
SELECT [Id Sexo Identidad Genero] AS IdSexoIdentidadGenero, Codigo, [Identidad Genero] AS IdentidadGenero, [Descripcion Identidad Genero] AS DescripcionIdentidadGenero
FROM dbo.[Sexo Identidad Genero]
GO

IF OBJECT_ID(N'dbo.[Cnsta ZonaResidencia 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta ZonaResidencia 1888];
GO

CREATE VIEW dbo.[Cnsta ZonaResidencia 1888]
AS
SELECT TOP (100) [Id Zona Residencia] AS IdZonaResidencia, [Zona Residencia] AS ZonaResidencia, [Descripción Zona Residencia] AS DescripciónZonaResidencia
FROM dbo.[Zona Residencia]
ORDER BY [Zona Residencia]
GO

IF OBJECT_ID(N'dbo.[Cnsta Etnia 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Etnia 1888];
GO

CREATE VIEW dbo.[Cnsta Etnia 1888]
AS
SELECT [Id Etnia] AS IdEtnia, [Código Etnia] AS CódigoEtnia, Etnia, [Descripción Etnia] AS DescripciónEtnia, [Id Estado] AS IdEstado
FROM dbo.Etnia
WHERE ([Id Estado] = 7)
GO

IF OBJECT_ID(N'dbo.[Cnsta Discapacidad 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Discapacidad 1888];
GO

CREATE VIEW dbo.[Cnsta Discapacidad 1888]
AS
SELECT [Id Discapacidad] AS IdDiscapacidad, Codigo, Discapacidad, [Descripcion Discapacidad] AS DescripcionDiscapacidad
FROM dbo.Discapacidad
WHERE ([Id Estado] = 7)
GO

IF OBJECT_ID(N'dbo.[Cnsta Ocupacion 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Ocupacion 1888];
GO

CREATE VIEW dbo.[Cnsta Ocupacion 1888]
AS
SELECT [Id Ocupación] AS IdOcupacion, [Código Ocupación] AS CodigoOcupacion, Ocupación AS DescripcionOcupacion, [Id Estado]
FROM dbo.Ocupación
WHERE ([Id Estado] = 7)
GO
/* SECCIÓN 2 — Usuarios Info extendida RDA (reemplaza versión 2275) */

IF OBJECT_ID(N'dbo.[Cnsta Relacionador Usuarios Info]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Relacionador Usuarios Info];
GO

CREATE VIEW [dbo].[Cnsta Relacionador Usuarios Info]
AS

SELECT
    e.[Id Tipo de Documento] AS IdTipodeDocumento,
    td.[Descripción Tipo de Documento] AS DescripciTipoDocumento,
    td.[Tipo de Documento] AS TipoDocumentoBase,
    e.[Documento Entidad] AS DocumentoPaciente,
    e.[Primer Apellido Entidad] AS PrimerApellidoBase,
    e.[Segundo Apellido Entidad] AS SegundoApellidoBase,
    e.[Primer Nombre Entidad] AS PrimerNombreBase,
    e.[Segundo Nombre Entidad] AS SegundoNombreBase,
    e.[Nombre Completo Entidad] AS NombreCompletoPaciente,
    sx.[Sexo] AS SexoPaciente,
    sx.[Código Sexo] as CódigoSexo,
   
    sx.[Descripción Sexo] AS Sexo,
    sx.[Id Sexo] AS IdSexo,
    e3.[Edad EntidadIII] AS Edad,
    e2.[Dirección EntidadII] AS Direccion,
    e2.[Teléfono Celular EntidadII] AS Tel,
    ISNULL(td.[Tipo de Documento], '') + N' ' + e.[Documento Entidad] AS DocumentoTipoDOC,
    e3.[Fecha Nacimiento EntidadIII] AS FechaNacimientoBase,
    e3.[Id Sexo],
    e1888.[Id Identidad Genero],
    sig.[Id Sexo Identidad Genero] AS IdSexoIdentidadGenero,
    sig.[Codigo] AS codigoIdentidadGeneroBase,
    sig.[Identidad Genero] AS IdentidadGeneroBase,
    e3.[Id Zona Residencia],
    
    e1888.[Talla],
    e1888.[Peso],
    e1888.[Id Etnia],
    e1888.[Comunidad Etnica] AS ComunidadEtnica,
    e1888.[Id Discapacidad],
    pn.[Id Pais1888] AS IdPaisNacionalidad,
    pn.[Codigo] AS CodigoPaisNacionalidad,
    pn.[Nombre] AS NombrePaisNACIONALIDAD,
    pr.[Id Pais1888] AS IdPaisRecidencia,
    pr.[Codigo] AS CodigoPaisRecidencia,
    pr.[Nombre] AS NombrePaisRecidencia,
    cr.[Id Ciudad1888] AS IdMunicipioRecidencia,
    cr.[Codigo] AS CodigoMunicipioRecidencia,
    cr.[Nombre] AS NombreMunicipioRecidencia,
    zr.[Id Zona Residencia] AS IdZonaResidencia,
    zr.[Descripción Zona Residencia] AS DescripciónZonaResidencia,
    zr.[Código Zona Residencia] AS CódigoZonaResidencia,
    zr.[Zona Residencia] AS ZonaResidencia,
    et.[Id Etnia] AS IdEtnia,
    et.[Código Etnia] AS CódigoEtnia,
    et.[Etnia] AS Etnia,
    et.[Descripción Etnia] AS DescripciónEtnia,
    d.[Id Discapacidad] AS IdDiscapacidad,
    d.[Codigo] AS Codigo,
    d.[Discapacidad] AS Discapacidad,
    d.[Descripcion Discapacidad] AS DescripcionDiscapacidad,
    o.[Id Ocupación] AS IdOcupación,
    o.[Código Ocupación] AS CódigoOcupación,
    o.[Ocupación] AS Ocupación,
    o.[Descripción Ocupación] AS DescripciónOcupación,
    e1888.[Alergias] AS Alergias,
    e1888.[Alergeno] AS Alergeno,
    ec.[Estado Civil] AS EstadoCivil,
    respon.[Nombre Completo Entidad] AS NombreResponsable,
    ParRespo.Parentesco AS ParentescoResponsable
FROM dbo.Entidad e
LEFT JOIN dbo.[Tipo de Documento] td
    ON td.[Id Tipo de Documento] = e.[Id Tipo de Documento]
LEFT JOIN dbo.EntidadII e2
    ON e2.[Documento Entidad] = e.[Documento Entidad]
LEFT JOIN dbo.EntidadIII e3
    ON e3.[Documento Entidad] = e.[Documento Entidad]
LEFT JOIN dbo.Sexo sx
    ON sx.[Id Sexo] = e3.[Id Sexo]
LEFT JOIN dbo.Entidad1888 e1888
    ON LTRIM(RTRIM(e1888.[Documento Entidad])) = LTRIM(RTRIM(e.[Documento Entidad]))
LEFT JOIN dbo.[Sexo Identidad Genero] sig
    ON sig.[Id Sexo Identidad Genero] = e1888.[Id Identidad Genero]
LEFT JOIN dbo.País1888 pn
    ON pn.[Id Pais1888] = e1888.[Id Pais Nacionalidad]
LEFT JOIN dbo.País1888 pr
    ON pr.[Id Pais1888] = e1888.[Id Pais Recidencia]
LEFT JOIN dbo.Ciudad1888 cr
    ON cr.[Id Ciudad1888] = e1888.[Id Municipio Recidencia]
-- EntidadIII.[Id Zona Residencia] guarda el código RIPS (1→01 Urbana, 2→02 Rural), no el PK [Id Zona Residencia] del catálogo.



LEFT JOIN dbo.[Zona Residencia] zr
    ON e3.[Id Zona Residencia] = zr.[Id Zona Residencia]



LEFT JOIN dbo.Etnia et
    ON et.[Id Etnia] = e1888.[Id Etnia]
LEFT JOIN dbo.Discapacidad d
    ON d.[Id Discapacidad] = e1888.[Id Discapacidad]
LEFT JOIN dbo.EntidadVI e6
    ON e6.[Documento Entidad] = e.[Documento Entidad]
LEFT JOIN dbo.Ocupación o
    ON o.[Id Ocupación] = e6.[Id Ocupación]
LEFT JOIN dbo.[Estado Civil] EC 
    ON EC.[Id Estado Civil] = E3.[Id Estado Civil]
LEFT JOIN Entidad Respon 
    ON respon.[Documento Entidad] = e3.[Documento Responsable]
LEFT JOIN dbo.Parentesco ParRespo 
    ON ParRespo.[Id Parentesco] = E3.[Id Parentesco]
GO
/* SECCIÓN 3 — Entidades, EPS, empresa, CUPS, medicamentos */

IF OBJECT_ID(N'dbo.[Cnsta Entidad SSGSSS 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Entidad SSGSSS 1888];
GO

CREATE VIEW dbo.[Cnsta Entidad SSGSSS 1888]
AS
SELECT dbo.[Entidades sgsss 1888].[Id sgsss] AS Idsgsss, dbo.[Entidades sgsss 1888].Codigo, dbo.[Entidades sgsss 1888].Nombre, dbo.[Entidades sgsss 1888].[Id Estado] AS IdEstado, dbo.[Entidades sgsss 1888].[Id Regimen] AS IdRegimen,
       dbo.Regimen.Nombre AS NombreRegimen, dbo.[Entidades sgsss 1888].Nombre + ' (' + dbo.Regimen.Nombre + ') ' AS Descripcion
FROM dbo.[Entidades sgsss 1888]
INNER JOIN dbo.Regimen ON dbo.[Entidades sgsss 1888].[Id Regimen] = dbo.Regimen.[Id Regimen]
GO

IF OBJECT_ID(N'dbo.[Cnsta Empresa 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Empresa 1888];
GO

CREATE VIEW dbo.[Cnsta Empresa 1888]
AS
SELECT [Id Empresa] AS IdEmpresa, [Documento Empresa] AS DocumentoEmpresa, [Id Tipo de Documento] AS IdTipodeDocumento, [Fecha Expedición Empresa] AS FechaExpediciónEmpresa, [Id Ciudad] AS IdCiudad,
       [Nombre Comercial Empresa] AS NombreComercialEmpresa, [Razon Social Empresa] AS RazonSocialEmpresa, [Fecha Inscripción Empresa] AS [FechaInscripción}Empresa], [Código Empresa] AS CódigoEmpresa,
       [Observaciones Empresa] AS ObservacionesEmpresa, [Foto Empresa] AS FotoEmpresa, [Id Estado] AS IdEstado, NroIDPrestador
FROM dbo.Empresa
GO

IF OBJECT_ID(N'dbo.[Cnsta Entidades Prepagadas 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Entidades Prepagadas 1888];
GO

CREATE VIEW dbo.[Cnsta Entidades Prepagadas 1888]
AS
SELECT [Id Entidades Prepagadas 1888] AS IdEntidadesPrepagadas1888, Codigo, Nombre, [Id Estado] AS IdEstado
FROM dbo.[Entidades Prepagadas 1888]
GO

IF OBJECT_ID(N'dbo.[Cnsta sgsss 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta sgsss 1888];
GO

CREATE VIEW dbo.[Cnsta sgsss 1888]
AS
SELECT [Id sgsss] AS Idsgsss, Codigo, Nombre, [Id Estado] AS IdEstado
FROM dbo.[Entidades sgsss 1888]
WHERE ([Id Estado] = 7)
GO

IF OBJECT_ID(N'dbo.[Cnsta Medicamentos DCI 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Medicamentos DCI 1888];
GO

CREATE VIEW dbo.[Cnsta Medicamentos DCI 1888]
AS
SELECT [ID Medicamento DCI 1888] AS IDMedicamentoDCI1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Medicamento DCI 1888]
WHERE ([Id Estado] = 7)
GO

IF OBJECT_ID(N'dbo.[Cnsta Cups 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Cups 1888];
GO

CREATE VIEW dbo.[Cnsta Cups 1888]
AS
SELECT Tabla, Codigo, Nombre, Descripcion, Tipo
FROM dbo.[Rips Cups]
GO
/* SECCIÓN 4 — Catálogos RDA Consulta Externa (Res. 1888) */

IF OBJECT_ID(N'dbo.[Cnsta Factor De Riesgo 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Factor De Riesgo 1888];
GO

CREATE VIEW dbo.[Cnsta Factor De Riesgo 1888]
AS
SELECT [Id Factor De Riesgo 1888] AS IdFactorDeRiesgo1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Factor De Riesgo 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Tipo de tecnología en salud 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Tipo de tecnología en salud 1888];
GO

CREATE VIEW dbo.[Cnsta Tipo de tecnología en salud 1888]
AS
SELECT [Id Tipo de tecnología en salud 1888] AS IdTipoTecnologiaEnSalud1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Tipo de tecnología en salud 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Entorno de atencion 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Entorno de atencion 1888];
GO

CREATE VIEW dbo.[Cnsta Entorno de atencion 1888]
AS
SELECT [Id Entorno de atencion 1888] AS IdEntornoAtencion1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Entorno de atencion 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Tipo de alergia 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Tipo de alergia 1888];
GO

CREATE VIEW dbo.[Cnsta Tipo de alergia 1888]
AS
SELECT [Id Tipo de alergia 1888] AS IdTipoAlergia1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Tipo de alergia 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Parentesco familiar RDA 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Parentesco familiar RDA 1888];
GO

CREATE VIEW dbo.[Cnsta Parentesco familiar RDA 1888]
AS
SELECT [Id Parentesco familiar RDA 1888] AS IdParentescoFamiliarRDA1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Parentesco familiar RDA 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Tipo diagnostico principal 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Tipo diagnostico principal 1888];
GO

CREATE VIEW dbo.[Cnsta Tipo diagnostico principal 1888]
AS
SELECT [Id Tipo diagnostico principal 1888] AS IdTipoDiagnosticoPrincipal1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Tipo diagnostico principal 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Unidad medida dosis 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Unidad medida dosis 1888];
GO

CREATE VIEW dbo.[Cnsta Unidad medida dosis 1888]
AS
SELECT [Id Unidad medida dosis 1888] AS IdUnidadMedidaDosis1888, Codigo, Nombre, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Unidad medida dosis 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Otra tecnologia categoria 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Otra tecnologia categoria 1888];
GO

CREATE VIEW dbo.[Cnsta Otra tecnologia categoria 1888]
AS
SELECT [Id Otra tecnologia categoria 1888] AS IdOtraTecnologiaCategoria1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Otra tecnologia categoria 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Alcance incapacidad 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Alcance incapacidad 1888];
GO

CREATE VIEW dbo.[Cnsta Alcance incapacidad 1888]
AS
SELECT [Id Alcance incapacidad 1888] AS IdAlcanceIncapacidad1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Alcance incapacidad 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Egreso y Remision 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Egreso y Remision 1888];
GO

CREATE VIEW dbo.[Cnsta Egreso y Remision 1888]
AS
SELECT [Id Egreso y Remision 1888] AS IdEgresoRemision1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Egreso y Remision 1888]
GO

IF OBJECT_ID(N'dbo.[Cnsta Via administracion medicamento 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Via administracion medicamento 1888];
GO

CREATE VIEW dbo.[Cnsta Via administracion medicamento 1888]
AS
SELECT [Id Via administracion medicamento 1888] AS IdViaAdministracionMedicamento1888, Codigo, Nombre, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Via administracion medicamento 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Unidad tiempo duracion 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Unidad tiempo duracion 1888];
GO

CREATE VIEW dbo.[Cnsta Unidad tiempo duracion 1888]
AS
SELECT [Id Unidad tiempo duracion 1888] AS IdUnidadTiempoDuracion1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Unidad tiempo duracion 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Unidad tiempo frecuencia 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Unidad tiempo frecuencia 1888];
GO

CREATE VIEW dbo.[Cnsta Unidad tiempo frecuencia 1888]
AS
SELECT [Id Unidad tiempo frecuencia 1888] AS IdUnidadTiempoFrecuencia1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Unidad tiempo frecuencia 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Finalidad tecnologia salud 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Finalidad tecnologia salud 1888];
GO

CREATE VIEW dbo.[Cnsta Finalidad tecnologia salud 1888]
AS
SELECT [Id Finalidad tecnologia salud 1888] AS IdFinalidadTecnologiaSalud1888, Codigo, Nombre, Descripcion, [Id Estado] AS IdEstado
FROM dbo.[Finalidad tecnologia salud 1888]
WHERE [Id Estado] = 7
GO

IF OBJECT_ID(N'dbo.[Cnsta Compromiso VI 1888]', N'V') IS NOT NULL
    DROP VIEW dbo.[Cnsta Compromiso VI 1888];
GO

CREATE VIEW dbo.[Cnsta Compromiso VI 1888]
AS
SELECT TOP (100) PERCENT [Fecha Inicio CompromisoVI] AS Fechaini, [Fecha Fin CompromisoVI] AS Fechafin, [Hora Inicio CompromisoVI] AS Horaini, [Hora Fin CompromisoVI] AS Horafin, [Entidad Atendida] AS Docpaciente, [Id Estado] AS Estado,
                  [Id CompromisoVI]
FROM dbo.CompromisoVI
WHERE ([Id Estado] <> 60 OR [Id Estado] <> 61)
ORDER BY [Id CompromisoVI] DESC
GO
/* SECCIÓN 5 — Vistas FHIR RDA (tablas RDA_*) */

IF OBJECT_ID(N'dbo.VW_RDA_MedicationTime_Activos', N'V') IS NOT NULL
    DROP VIEW dbo.VW_RDA_MedicationTime_Activos;
GO

CREATE VIEW dbo.VW_RDA_MedicationTime_Activos
AS
SELECT id, codigo, display, system_url, fhir_duration_unit, id_estado
FROM dbo.RDA_MedicationTime
WHERE id_estado = 7
GO

IF OBJECT_ID(N'dbo.VW_RDA_UMM_Activos', N'V') IS NOT NULL
    DROP VIEW dbo.VW_RDA_UMM_Activos;
GO

CREATE VIEW dbo.VW_RDA_UMM_Activos
AS
SELECT id, codigo, display, unidad, system_url, id_estado
FROM dbo.RDA_UMM
WHERE id_estado = 7
GO

IF OBJECT_ID(N'dbo.VW_RDA_ViaAdministracion_Activos', N'V') IS NOT NULL
    DROP VIEW dbo.VW_RDA_ViaAdministracion_Activos;
GO

CREATE VIEW dbo.VW_RDA_ViaAdministracion_Activos
AS
SELECT id, codigo, display, system_url, id_estado
FROM dbo.RDA_ViaAdministracion
WHERE id_estado = 7
GO

IF OBJECT_ID(N'dbo.VW_RDA_ColombianTechModality_Activos', N'V') IS NOT NULL
    DROP VIEW dbo.VW_RDA_ColombianTechModality_Activos;
GO

CREATE VIEW dbo.VW_RDA_ColombianTechModality_Activos
AS
SELECT id, codigo, display, system_url, id_estado
FROM dbo.RDA_ColombianTechModality
WHERE id_estado = 7
GO

PRINT 'Vistas Resolución 1888 / RDA instaladas correctamente (34 vistas).';
GO

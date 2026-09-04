/*
==============================================================================
  ALTER RELACIONADOR 1888 — INSTALACIÓN IDEMPOTENTE
==============================================================================
  Columnas adicionales, ALTER COLUMN y constraints idempotentes.

  Orden de ejecución:
    1. TABLAS_1888_INSTALL.sql
    2. ALTER_1888_INSTALL.sql (este)
    3. UPDATES_1888_INSTALL.sql
    4. DATOS_1888_INSTALL.sql
    4b. CATALOGOS_RDA_FHIR_INSTALL.sql
    5. VISTAS_1888_INSTALL.sql

  Prerrequisitos:
    - TABLAS_1888_INSTALL.sql ejecutado

  Fuentes:
    - 1888.sql
    - alter-evaluacion-entidad-rdace-rips-context.sql
    - alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql
    - ALTER_RDACE_NotasAdicionalesPdf.sql
    - ALTER_RDACE_ContenidoDocumentoPdf.sql
    - 1888 update a registros malos.sql

  ---------------------------------------------------------------------------
  HOTFIX CLIENTE (Message 207 — tablas incompletas)
  ---------------------------------------------------------------------------
  Ejecutar ANTES de recrear vistas (o FIX_Entidad1888_columnas_Cnsta_Usuarios_Info.sql):

  -- Entidad1888 (Cnsta Relacionador Usuarios Info)
  IF COL_LENGTH(N'dbo.Entidad1888', N'Id Pais Nacionalidad') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Pais Nacionalidad] INT NULL;
  IF COL_LENGTH(N'dbo.Entidad1888', N'Id Pais Recidencia') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Pais Recidencia] INT NULL;
  IF COL_LENGTH(N'dbo.Entidad1888', N'Id Municipio Recidencia') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Municipio Recidencia] INT NULL;
  IF COL_LENGTH(N'dbo.Entidad1888', N'Alergeno') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD Alergeno VARCHAR(200) NULL;

  -- Entidades Prepagadas 1888 (Cnsta Entidades Prepagadas 1888)
  IF COL_LENGTH(N'dbo.[Entidades Prepagadas 1888]', N'Id Estado') IS NULL
    ALTER TABLE dbo.[Entidades Prepagadas 1888]
      ADD [Id Estado] INT NULL CONSTRAINT DF_EntidadesPrepagadas1888_IdEstado_HF DEFAULT (7);

  Tipos desde 1888.sql.
==============================================================================
*/

SET NOCOUNT ON;
GO

/* --- alter-evaluacion-entidad-rdace-rips-context.sql --- */
-- Contexto RIPS / lista RDA Consulta Externa (modalidad, grupo, vía ingreso, causa motivo)
-- Idempotente: solo agrega columnas si no existen.
-- Tabla: [Evaluacion Entidad RDA Consulta Externa]

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA Consulta Externa' AND c.name = N'Id Modalidad Atencion'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa] ADD [Id Modalidad Atencion] INT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA Consulta Externa' AND c.name = N'Id Grupo Servicios'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa] ADD [Id Grupo Servicios] INT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA Consulta Externa' AND c.name = N'Id Via Ingreso Usuario'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa] ADD [Id Via Ingreso Usuario] INT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA Consulta Externa' AND c.name = N'Id Causa Motivo Atencion'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa] ADD [Id Causa Motivo Atencion] INT NULL;

PRINT 'ALTER RDACE (modalidad/grupo/vía ingreso/causa motivo) aplicado o ya existente.';

GO

/* --- alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql --- */
-- =============================================================================
-- RDA Paciente (1888) — columnas adicionales para FHIR / CompositionPatientStatementRDA
-- Ejecutar en la BD de producción/desarrollo tras respaldo.
-- Idempotente: comprueba sys.columns.
-- =============================================================================

SET NOCOUNT ON;

-- [Evaluacion Entidad RDA]
IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA' AND c.name = N'Id Modalidad Atencion'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA] ADD [Id Modalidad Atencion] INT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA' AND c.name = N'Id Grupo Servicios'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA] ADD [Id Grupo Servicios] INT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA' AND c.name = N'NIT Prestador IPS'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA] ADD [NIT Prestador IPS] NVARCHAR(20) NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA' AND c.name = N'Nombre Prestador IPS'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA] ADD [Nombre Prestador IPS] NVARCHAR(200) NULL;

-- [Evaluacion Entidad RDA Antecedentes Familiares]
IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA Antecedentes Familiares' AND c.name = N'CIE11 Codigo'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Antecedentes Familiares] ADD [CIE11 Codigo] NVARCHAR(50) NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA Antecedentes Familiares' AND c.name = N'CIE11 Termino'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Antecedentes Familiares] ADD [CIE11 Termino] NVARCHAR(300) NULL;

PRINT 'ALTER RDA Paciente (modalidad/grupo/NIT IPS/CIE11 familiar) aplicado o ya existente.';

GO

/* --- ALTER_RDACE_NotasAdicionalesPdf.sql --- */
/* Campo opcional: texto libre incluido en el resumen clínico PDF (sección 8). */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', N'U')
      AND name = N'Notas Adicionales PDF'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa]
        ADD [Notas Adicionales PDF] NVARCHAR(MAX) NULL;
GO

GO

/* --- ALTER_RDACE_ContenidoDocumentoPdf.sql --- */
/*
  RDA Consulta Externa — almacenar PDF del resumen clínico (binario)
  Ejecutar en la misma base donde existe [Evaluacion Entidad RDA Consulta Externa].
*/
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Contenido Documento PDF') IS NULL
BEGIN
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa]
    ADD [Contenido Documento PDF] VARBINARY(MAX) NULL;
END
GO

IF COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Fecha Generacion Documento PDF') IS NULL
BEGIN
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa]
    ADD [Fecha Generacion Documento PDF] DATETIME2(7) NULL;
END
GO

GO

/* --- Entidad1888 columnas adicionales (1888.sql) --- */
IF COL_LENGTH(N'dbo.Entidad1888', N'Id Pais Nacionalidad') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Pais Nacionalidad] INT NULL;
GO
IF COL_LENGTH(N'dbo.Entidad1888', N'Id Pais Recidencia') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Pais Recidencia] INT NULL;
GO
IF COL_LENGTH(N'dbo.Entidad1888', N'Id Municipio Recidencia') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Municipio Recidencia] INT NULL;
GO
IF COL_LENGTH(N'dbo.Entidad1888', N'Alergeno') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD Alergeno VARCHAR(200) NULL;
GO

/* --- Entidades Prepagadas 1888 — Id Estado (1888.sql DEFAULT 7) --- */
IF COL_LENGTH(N'dbo.[Entidades Prepagadas 1888]', N'Id Estado') IS NULL
    ALTER TABLE dbo.[Entidades Prepagadas 1888]
        ADD [Id Estado] INT NULL CONSTRAINT DF_EntidadesPrepagadas1888_IdEstado_Alt DEFAULT (7);
GO

/* --- Entidades sgsss 1888 — columnas vistas Cnsta sgsss / Cnsta Relacionador Entidades --- */
IF COL_LENGTH(N'dbo.[Entidades sgsss 1888]', N'Id Estado') IS NULL
    ALTER TABLE dbo.[Entidades sgsss 1888]
        ADD [Id Estado] INT NOT NULL CONSTRAINT DF_EntidadesSGSSS1888_IdEstado_Alt DEFAULT (7);
GO
IF COL_LENGTH(N'dbo.[Entidades sgsss 1888]', N'Id Regimen') IS NULL
    ALTER TABLE dbo.[Entidades sgsss 1888]
        ADD [Id Regimen] INT NULL;
GO

/* --- Regimen — Id Estado (vista join) --- */
IF COL_LENGTH(N'dbo.Regimen', N'Id Estado') IS NULL
    ALTER TABLE dbo.Regimen
        ADD [Id Estado] INT NOT NULL CONSTRAINT DF_Regimen_IdEstado_Alt DEFAULT (1);
GO

/* Ocupación — ampliar columna */
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Ocupación') AND name = N'Ocupación')
BEGIN
    ALTER TABLE dbo.Ocupación ALTER COLUMN Ocupación NVARCHAR(200) NULL;
END
GO

/* Egreso y Remision — ampliar descripción */
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Egreso y Remision 1888]') AND name = N'Descripcion')
BEGIN
    ALTER TABLE dbo.[Egreso y Remision 1888] ALTER COLUMN Descripcion VARCHAR(200) NULL;
END
GO

/* Unidad medida dosis — columna Nombre */
IF COL_LENGTH(N'dbo.[Unidad medida dosis 1888]', N'Nombre') IS NULL
    ALTER TABLE dbo.[Unidad medida dosis 1888] ADD Nombre VARCHAR(100) NULL;
GO

/* Via administracion — columna Nombre */
IF COL_LENGTH(N'dbo.[Via administracion medicamento 1888]', N'Nombre') IS NULL
    ALTER TABLE dbo.[Via administracion medicamento 1888] ADD Nombre VARCHAR(150) NULL;
GO

/* Finalidad tecnologia salud — columna Nombre */
IF COL_LENGTH(N'dbo.[Finalidad tecnologia salud 1888]', N'Nombre') IS NULL
    ALTER TABLE dbo.[Finalidad tecnologia salud 1888] ADD Nombre VARCHAR(250) NULL;
GO

/* Evaluacion Entidad RDA — columnas envío IHCE */
IF COL_LENGTH(N'dbo.[Evaluacion Entidad RDA]', N'Enviado') IS NULL
    ALTER TABLE dbo.[Evaluacion Entidad RDA] ADD [Enviado] INT NOT NULL
        CONSTRAINT DF_EERDA_Enviado_Alt DEFAULT (0);
GO
IF COL_LENGTH(N'dbo.[Evaluacion Entidad RDA]', N'Enviado pruebas') IS NULL
    ALTER TABLE dbo.[Evaluacion Entidad RDA] ADD [Enviado pruebas] INT NOT NULL
        CONSTRAINT DF_EERDA_EnviadoPruebas_Alt DEFAULT (0);
GO

PRINT N'=== ALTER_1888_INSTALL — instalación completada ===';
GO

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

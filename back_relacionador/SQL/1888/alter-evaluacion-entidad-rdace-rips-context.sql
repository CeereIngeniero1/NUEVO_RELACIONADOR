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

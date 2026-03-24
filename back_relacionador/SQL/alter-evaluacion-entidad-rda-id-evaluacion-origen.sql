-- Id de historia/evolución RIPS (IdEvaluaciónEntidad) asociada al registro RDA / RDACE.
-- Idempotente.

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA' AND c.name = N'Id Evaluacion Entidad Origen'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA] ADD [Id Evaluacion Entidad Origen] INT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'dbo' AND t.name = N'Evaluacion Entidad RDA Consulta Externa' AND c.name = N'Id Evaluacion Entidad Origen'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa] ADD [Id Evaluacion Entidad Origen] INT NULL;

PRINT 'ALTER Id Evaluacion Entidad Origen (RDA + RDACE) aplicado o ya existente.';

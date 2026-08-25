-- Compatible con SQL Server 2014+ (también 2008 R2 / 2012 / 2016 / 2019 / 2022).
-- No usa JSON, STRING_AGG, DROP IF EXISTS ni CREATE OR ALTER.
--
-- [Enviado FevRips]: 0 = no enviado, 1 = enviado OK
-- [CUV FevRips]: Código Único de Validación de MinSalud
-- [Fecha Envio FevRips] / [Ambiente Envio FevRips]: metadata

SET NOCOUNT ON;

DECLARE @Table sysname =
(
    SELECT TOP (1) t.name
    FROM sys.tables t
    WHERE t.name LIKE N'Evaluaci%Entidad Rips'
      AND t.name NOT LIKE N'%V2%'
      AND SCHEMA_NAME(t.schema_id) = N'dbo'
    ORDER BY t.name
);

IF @Table IS NULL
BEGIN
    RAISERROR(N'No se encontró la tabla Evaluación Entidad Rips.', 16, 1);
    RETURN;
END;

PRINT N'Tabla: ' + @Table;

-- COL_LENGTH / OBJECT_ID esperan 'schema.tabla' sin corchetes
DECLARE @TwoPart nvarchar(517) = N'dbo.' + @Table;
DECLARE @sql nvarchar(max);

IF COL_LENGTH(@TwoPart, N'Enviado FevRips') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + QUOTENAME(N'dbo') + N'.' + QUOTENAME(@Table)
        + N' ADD [Enviado FevRips] TINYINT NOT NULL CONSTRAINT [DF_EvaEntRips_EnviadoFevRips] DEFAULT (0);';
    EXEC sys.sp_executesql @sql;
    PRINT N'Columna [Enviado FevRips] creada.';
END
ELSE
    PRINT N'Columna [Enviado FevRips] ya existe.';

IF COL_LENGTH(@TwoPart, N'CUV FevRips') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + QUOTENAME(N'dbo') + N'.' + QUOTENAME(@Table)
        + N' ADD [CUV FevRips] NVARCHAR(100) NULL;';
    EXEC sys.sp_executesql @sql;
    PRINT N'Columna [CUV FevRips] creada.';
END
ELSE
    PRINT N'Columna [CUV FevRips] ya existe.';

IF COL_LENGTH(@TwoPart, N'Fecha Envio FevRips') IS NULL
BEGIN
    -- DATETIME2 existe desde SQL Server 2008; en 2014 está soportado.
    SET @sql = N'ALTER TABLE ' + QUOTENAME(N'dbo') + N'.' + QUOTENAME(@Table)
        + N' ADD [Fecha Envio FevRips] DATETIME2 NULL;';
    EXEC sys.sp_executesql @sql;
    PRINT N'Columna [Fecha Envio FevRips] creada.';
END
ELSE
    PRINT N'Columna [Fecha Envio FevRips] ya existe.';

IF COL_LENGTH(@TwoPart, N'Ambiente Envio FevRips') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + QUOTENAME(N'dbo') + N'.' + QUOTENAME(@Table)
        + N' ADD [Ambiente Envio FevRips] NVARCHAR(20) NULL;';
    EXEC sys.sp_executesql @sql;
    PRINT N'Columna [Ambiente Envio FevRips] creada.';
END
ELSE
    PRINT N'Columna [Ambiente Envio FevRips] ya existe.';

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes i
    WHERE i.name = N'IX_EvaEntRips_EnviadoFevRips'
      AND i.object_id = OBJECT_ID(@TwoPart)
)
BEGIN
    SET @sql = N'CREATE INDEX [IX_EvaEntRips_EnviadoFevRips] ON '
        + QUOTENAME(N'dbo') + N'.' + QUOTENAME(@Table)
        + N' ([Enviado FevRips], [Id Factura]);';
    EXEC sys.sp_executesql @sql;
    PRINT N'Índice IX_EvaEntRips_EnviadoFevRips creado.';
END
ELSE
    PRINT N'Índice IX_EvaEntRips_EnviadoFevRips ya existe.';

PRINT N'Listo.';
GO

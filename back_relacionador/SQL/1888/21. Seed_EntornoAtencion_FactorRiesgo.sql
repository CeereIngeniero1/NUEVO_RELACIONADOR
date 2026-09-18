/*
  Seed idempotente: Entorno de atencion 1888 + Factor De Riesgo 1888 (RDA).
  Solo inserta si el Código no existe; reactiva Id Estado = 7 si ya estaba.
*/
SET NOCOUNT ON;
GO

/* ---- Entorno de atencion 1888 (01-05) ---- */
IF OBJECT_ID(N'dbo.[Entorno de atencion 1888]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[Entorno de atencion 1888] (
        [Id Entorno de atencion 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50) NOT NULL,
        Descripcion VARCHAR(200) NOT NULL,
        [Id Estado] INT NOT NULL CONSTRAINT DF_EntornoAtencion1888_Seed DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'01')
    INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'01', N'Hogar', 7);
ELSE
    UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Hogar', [Id Estado] = 7 WHERE Codigo = N'01';
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'02')
    INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'02', N'Comunitario', 7);
ELSE
    UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Comunitario', [Id Estado] = 7 WHERE Codigo = N'02';
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'03')
    INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'03', N'Escolar', 7);
ELSE
    UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Escolar', [Id Estado] = 7 WHERE Codigo = N'03';
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'04')
    INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'04', N'Laboral', 7);
ELSE
    UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Laboral', [Id Estado] = 7 WHERE Codigo = N'04';
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'05')
    INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'05', N'Institucional', 7);
ELSE
    UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Institucional', [Id Estado] = 7 WHERE Codigo = N'05';
GO

PRINT N'Entorno de atencion 1888: 01-05 listos.';
GO

/* ---- Factor De Riesgo 1888 (01-06) ---- */
IF OBJECT_ID(N'dbo.[Factor De Riesgo 1888]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[Factor De Riesgo 1888] (
        [Id Factor De Riesgo 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50) NULL,
        Descripcion VARCHAR(50) NULL,
        [Id Estado] INT NULL CONSTRAINT DF_FactorRiesgo1888_Seed DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'01')
    INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'01', N'Químicos', 7);
ELSE
    UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Químicos', [Id Estado] = 7 WHERE Codigo = N'01';
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'02')
    INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'02', N'Físicos', 7);
ELSE
    UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Físicos', [Id Estado] = 7 WHERE Codigo = N'02';
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'03')
    INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'03', N'Biomecánicos', 7);
ELSE
    UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Biomecánicos', [Id Estado] = 7 WHERE Codigo = N'03';
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'04')
    INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'04', N'Psicosociales', 7);
ELSE
    UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Psicosociales', [Id Estado] = 7 WHERE Codigo = N'04';
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'05')
    INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'05', N'Biológicos', 7);
ELSE
    UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Biológicos', [Id Estado] = 7 WHERE Codigo = N'05';
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'06')
    INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'06', N'Otro', 7);
ELSE
    UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Otro', [Id Estado] = 7 WHERE Codigo = N'06';
GO

PRINT N'Factor De Riesgo 1888: 01-06 listos.';
GO
PRINT N'Verificar: SELECT * FROM dbo.[Cnsta Entorno de atencion 1888];';
GO
PRINT N'Verificar: SELECT * FROM dbo.[Cnsta Factor De Riesgo 1888];';
GO

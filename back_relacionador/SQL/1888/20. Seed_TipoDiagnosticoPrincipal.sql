/*
  Seed idempotente: Tipo diagnostico principal 1888 (RDA / IHCE).
  Códigos MinSalud: 01, 02, 03.
  Solo inserta si el Código no existe; reactiva Id Estado = 7 si ya estaba.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.[Tipo diagnostico principal 1888]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[Tipo diagnostico principal 1888] (
        [Id Tipo diagnostico principal 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50) NOT NULL,
        Descripcion VARCHAR(200) NOT NULL,
        [Id Estado] INT NOT NULL CONSTRAINT DF_TipoDxPrincipal1888_Seed DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo diagnostico principal 1888] WHERE Codigo = N'01')
    INSERT INTO dbo.[Tipo diagnostico principal 1888] (Codigo, Descripcion, [Id Estado])
    VALUES (N'01', N'Impresión diagnóstica', 7);
ELSE
    UPDATE dbo.[Tipo diagnostico principal 1888]
    SET Descripcion = N'Impresión diagnóstica', [Id Estado] = 7
    WHERE Codigo = N'01';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo diagnostico principal 1888] WHERE Codigo = N'02')
    INSERT INTO dbo.[Tipo diagnostico principal 1888] (Codigo, Descripcion, [Id Estado])
    VALUES (N'02', N'Confirmado nuevo', 7);
ELSE
    UPDATE dbo.[Tipo diagnostico principal 1888]
    SET Descripcion = N'Confirmado nuevo', [Id Estado] = 7
    WHERE Codigo = N'02';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo diagnostico principal 1888] WHERE Codigo = N'03')
    INSERT INTO dbo.[Tipo diagnostico principal 1888] (Codigo, Descripcion, [Id Estado])
    VALUES (N'03', N'Confirmado repetido', 7);
ELSE
    UPDATE dbo.[Tipo diagnostico principal 1888]
    SET Descripcion = N'Confirmado repetido', [Id Estado] = 7
    WHERE Codigo = N'03';
GO

PRINT N'Tipo diagnostico principal 1888: 01/02/03 listos.';
GO

/* También CeereSIO (RIPS Asignar) — vista Cnsta Relacionador Tipo Diagnostico Principal */
IF OBJECT_ID(N'dbo.[Tipo de Diagnóstico Principal]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM dbo.[Tipo de Diagnóstico Principal]
        WHERE [Código Tipo de Diagnóstico Principal] = N'01'
           OR [Descripción Tipo de Diagnóstico Principal] = N'Impresión diagnóstica'
    )
        INSERT INTO dbo.[Tipo de Diagnóstico Principal] (
            [Código Tipo de Diagnóstico Principal],
            [Tipo de Diagnóstico Principal],
            [Descripción Tipo de Diagnóstico Principal],
            [Orden Tipo de Diagnóstico Principal],
            [Id Estado]
        ) VALUES (N'01', N'01', N'Impresión diagnóstica', 1, 7);
    ELSE
        UPDATE dbo.[Tipo de Diagnóstico Principal]
        SET [Código Tipo de Diagnóstico Principal] = N'01',
            [Id Estado] = 7
        WHERE [Descripción Tipo de Diagnóstico Principal] = N'Impresión diagnóstica'
           OR [Código Tipo de Diagnóstico Principal] = N'01';

    IF NOT EXISTS (
        SELECT 1 FROM dbo.[Tipo de Diagnóstico Principal]
        WHERE [Código Tipo de Diagnóstico Principal] = N'02'
           OR [Descripción Tipo de Diagnóstico Principal] = N'Confirmado nuevo'
    )
        INSERT INTO dbo.[Tipo de Diagnóstico Principal] (
            [Código Tipo de Diagnóstico Principal],
            [Tipo de Diagnóstico Principal],
            [Descripción Tipo de Diagnóstico Principal],
            [Orden Tipo de Diagnóstico Principal],
            [Id Estado]
        ) VALUES (N'02', N'02', N'Confirmado nuevo', 2, 7);
    ELSE
        UPDATE dbo.[Tipo de Diagnóstico Principal]
        SET [Código Tipo de Diagnóstico Principal] = N'02',
            [Id Estado] = 7
        WHERE [Descripción Tipo de Diagnóstico Principal] = N'Confirmado nuevo'
           OR [Código Tipo de Diagnóstico Principal] = N'02';

    IF NOT EXISTS (
        SELECT 1 FROM dbo.[Tipo de Diagnóstico Principal]
        WHERE [Código Tipo de Diagnóstico Principal] = N'03'
           OR [Descripción Tipo de Diagnóstico Principal] = N'Confirmado repetido'
    )
        INSERT INTO dbo.[Tipo de Diagnóstico Principal] (
            [Código Tipo de Diagnóstico Principal],
            [Tipo de Diagnóstico Principal],
            [Descripción Tipo de Diagnóstico Principal],
            [Orden Tipo de Diagnóstico Principal],
            [Id Estado]
        ) VALUES (N'03', N'03', N'Confirmado repetido', 3, 7);
    ELSE
        UPDATE dbo.[Tipo de Diagnóstico Principal]
        SET [Código Tipo de Diagnóstico Principal] = N'03',
            [Id Estado] = 7
        WHERE [Descripción Tipo de Diagnóstico Principal] = N'Confirmado repetido'
           OR [Código Tipo de Diagnóstico Principal] = N'03';
END
GO

PRINT N'Verificar RDA: SELECT * FROM dbo.[Cnsta Tipo diagnostico principal 1888];';
GO
PRINT N'Verificar RIPS: SELECT * FROM dbo.[Cnsta Relacionador Tipo Diagnostico Principal];';
GO

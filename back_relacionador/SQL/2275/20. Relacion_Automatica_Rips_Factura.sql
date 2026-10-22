/*
  Relación automática RIPS ↔ Factura (diseño nuevo).

  Reglas:
    - Solo mismo día (fecha calendario).
    - Si hay varios candidatos → el más reciente.
    - RIPS libre: [Id Factura] IS NULL o 0.
    - Solo AC/AP → [Id Acto Quirúrgico] IN (1, 2).
    - Facturas: todas excepto comprobantes cuyo nombre contiene 'Nota'.
    - Si se anula la factura ([Id Estado] = 5) → se desrelaciona el RIPS (siempre).
    - Activación: dbo.ConfigRelacionAutomaticaRipsFactura.Activo (default 0 = apagado).
      UI Relacionador: GET/PUT /apiV3/Rips/relacion-automatica-factura

  Idempotente. SQL Server 2014+.
  Reemplaza triggers antiguos Relacion_Rips_Factura / Relacion_Factura_Rips.
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ========== 1) Config (switch) ========== */
IF OBJECT_ID(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfigRelacionAutomaticaRipsFactura (
        Id TINYINT NOT NULL
            CONSTRAINT PK_ConfigRelacionAutomaticaRipsFactura PRIMARY KEY,
        Activo BIT NOT NULL
            CONSTRAINT DF_ConfigRelacionAuto_Activo DEFAULT (0),
        FechaActualizacion DATETIME2 NOT NULL
            CONSTRAINT DF_ConfigRelacionAuto_Fecha DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_ConfigRelacionAuto_SingleRow CHECK (Id = 1)
    );
    PRINT N'Tabla ConfigRelacionAutomaticaRipsFactura creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ConfigRelacionAutomaticaRipsFactura WHERE Id = 1)
BEGIN
    INSERT INTO dbo.ConfigRelacionAutomaticaRipsFactura (Id, Activo)
    VALUES (1, 0);
    PRINT N'Config semilla: Activo = 0 (apagado).';
END
GO

/* ========== 2) Función: ¿está activo el switch? ========== */
IF OBJECT_ID(N'dbo.fn_RelacionAutoRipsFactura_Activa', N'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_RelacionAutoRipsFactura_Activa;
GO
CREATE FUNCTION dbo.fn_RelacionAutoRipsFactura_Activa ()
RETURNS BIT
AS
BEGIN
    DECLARE @a BIT = 0;
    SELECT @a = CASE WHEN ISNULL(Activo, 0) = 1 THEN 1 ELSE 0 END
    FROM dbo.ConfigRelacionAutomaticaRipsFactura
    WHERE Id = 1;
    RETURN ISNULL(@a, 0);
END;
GO

/* ========== 3) Buscar RIPS AC/AP libre (más reciente) ========== */
IF OBJECT_ID(N'dbo.fn_RelacionAuto_BuscarRipsLibre', N'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_RelacionAuto_BuscarRipsLibre;
GO
CREATE FUNCTION dbo.fn_RelacionAuto_BuscarRipsLibre (
    @DocumentoPaciente NVARCHAR(50),
    @FechaDia DATE
)
RETURNS INT
AS
BEGIN
    DECLARE @IdRips INT = NULL;

    SELECT TOP (1) @IdRips = r.[Id Evaluación Entidad Rips]
    FROM dbo.[Evaluación Entidad Rips] r
    INNER JOIN dbo.[Evaluación Entidad] e
        ON e.[Id Evaluación Entidad] = r.[Id Evaluación Entidad]
    WHERE LTRIM(RTRIM(e.[Documento Entidad])) = LTRIM(RTRIM(@DocumentoPaciente))
      AND CONVERT(DATE, e.[Fecha Evaluación Entidad]) = @FechaDia
      AND r.[Id Acto Quirúrgico] IN (1, 2)  -- AC / AP
      AND (r.[Id Factura] IS NULL OR r.[Id Factura] = 0)
    ORDER BY e.[Fecha Evaluación Entidad] DESC, r.[Id Evaluación Entidad Rips] DESC;

    RETURN @IdRips;
END;
GO

/* ========== 4) Buscar factura libre (más reciente, sin notas) ========== */
IF OBJECT_ID(N'dbo.fn_RelacionAuto_BuscarFacturaLibre', N'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_RelacionAuto_BuscarFacturaLibre;
GO
CREATE FUNCTION dbo.fn_RelacionAuto_BuscarFacturaLibre (
    @DocumentoPaciente NVARCHAR(50),
    @FechaDia DATE
)
RETURNS INT
AS
BEGIN
    DECLARE @IdFactura INT = NULL;

    SELECT TOP (1) @IdFactura = f.[Id Factura]
    FROM dbo.Factura f
    LEFT JOIN dbo.[Tipo de Comprobante] tc
        ON tc.[Id Tipo de Comprobante] = f.[Id Tipo de Comprobante]
    WHERE LTRIM(RTRIM(f.[Documento Paciente])) = LTRIM(RTRIM(@DocumentoPaciente))
      AND CONVERT(DATE, f.[Fecha Factura]) = @FechaDia
      AND ISNULL(f.[Id Estado], 0) <> 5  -- no anulada
      AND (tc.[Tipo de Comprobante] IS NULL OR tc.[Tipo de Comprobante] NOT LIKE N'%Nota%')
      AND NOT EXISTS (
            SELECT 1
            FROM dbo.[Evaluación Entidad Rips] r
            WHERE r.[Id Factura] = f.[Id Factura]
              AND ISNULL(r.[Id Factura], 0) <> 0
        )
    ORDER BY f.[Fecha Factura] DESC, f.[Id Factura] DESC;

    RETURN @IdFactura;
END;
GO

/* ========== 5) Quitar triggers viejos de relación automática ========== */
IF OBJECT_ID(N'dbo.Relacion_Rips_Factura', N'TR') IS NOT NULL
    DROP TRIGGER dbo.Relacion_Rips_Factura;
GO
IF OBJECT_ID(N'dbo.Relacion_Factura_Rips', N'TR') IS NOT NULL
    DROP TRIGGER dbo.Relacion_Factura_Rips;
GO
IF OBJECT_ID(N'dbo.TR_RelacionAuto_Factura_Insert', N'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_RelacionAuto_Factura_Insert;
GO
IF OBJECT_ID(N'dbo.TR_RelacionAuto_Rips_Insert', N'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_RelacionAuto_Rips_Insert;
GO
IF OBJECT_ID(N'dbo.TR_RelacionAuto_Factura_Anulada', N'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_RelacionAuto_Factura_Anulada;
GO

/* ========== 6) Al crear FACTURA → relacionar RIPS libre AC/AP del mismo día ========== */
CREATE TRIGGER dbo.TR_RelacionAuto_Factura_Insert
ON dbo.Factura
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_RelacionAutoRipsFactura_Activa() = 0
        RETURN;

    ;WITH Candidatas AS (
        SELECT
            i.[Id Factura],
            i.[Documento Paciente],
            CONVERT(DATE, i.[Fecha Factura]) AS FechaDia
        FROM inserted i
        LEFT JOIN dbo.[Tipo de Comprobante] tc
            ON tc.[Id Tipo de Comprobante] = i.[Id Tipo de Comprobante]
        WHERE ISNULL(i.[Id Estado], 0) <> 5
          AND (tc.[Tipo de Comprobante] IS NULL OR tc.[Tipo de Comprobante] NOT LIKE N'%Nota%')
          AND NULLIF(LTRIM(RTRIM(i.[Documento Paciente])), N'') IS NOT NULL
    )
    UPDATE r
    SET r.[Id Factura] = c.[Id Factura]
    FROM dbo.[Evaluación Entidad Rips] r
    INNER JOIN Candidatas c
        ON r.[Id Evaluación Entidad Rips] = dbo.fn_RelacionAuto_BuscarRipsLibre(
            c.[Documento Paciente],
            c.FechaDia
        )
    WHERE (r.[Id Factura] IS NULL OR r.[Id Factura] = 0);
END;
GO

/* ========== 7) Al crear RIPS AC/AP → relacionar factura libre del mismo día ========== */
CREATE TRIGGER dbo.TR_RelacionAuto_Rips_Insert
ON dbo.[Evaluación Entidad Rips]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_RelacionAutoRipsFactura_Activa() = 0
        RETURN;

    ;WITH Candidatos AS (
        SELECT
            i.[Id Evaluación Entidad Rips] AS IdRips,
            e.[Documento Entidad] AS DocumentoPaciente,
            CONVERT(DATE, e.[Fecha Evaluación Entidad]) AS FechaDia
        FROM inserted i
        INNER JOIN dbo.[Evaluación Entidad] e
            ON e.[Id Evaluación Entidad] = i.[Id Evaluación Entidad]
        WHERE i.[Id Acto Quirúrgico] IN (1, 2)
          AND (i.[Id Factura] IS NULL OR i.[Id Factura] = 0)
          AND NULLIF(LTRIM(RTRIM(e.[Documento Entidad])), N'') IS NOT NULL
    )
    UPDATE r
    SET r.[Id Factura] = x.IdFactura
    FROM dbo.[Evaluación Entidad Rips] r
    INNER JOIN Candidatos c ON c.IdRips = r.[Id Evaluación Entidad Rips]
    CROSS APPLY (
        SELECT dbo.fn_RelacionAuto_BuscarFacturaLibre(c.DocumentoPaciente, c.FechaDia) AS IdFactura
    ) x
    WHERE x.IdFactura IS NOT NULL
      AND (r.[Id Factura] IS NULL OR r.[Id Factura] = 0);
END;
GO

/* ========== 8) Al ANULAR factura → desrelacionar RIPS (siempre, aunque el switch esté off) ========== */
CREATE TRIGGER dbo.TR_RelacionAuto_Factura_Anulada
ON dbo.Factura
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE([Id Estado])
        RETURN;

    UPDATE r
    SET r.[Id Factura] = NULL
    FROM dbo.[Evaluación Entidad Rips] r
    INNER JOIN inserted i ON i.[Id Factura] = r.[Id Factura]
    INNER JOIN deleted d ON d.[Id Factura] = i.[Id Factura]
    WHERE i.[Id Estado] = 5
      AND ISNULL(d.[Id Estado], 0) <> 5
      AND ISNULL(r.[Id Factura], 0) <> 0;
END;
GO

PRINT N'Relación automática RIPS↔Factura instalada. Switch en ConfigRelacionAutomaticaRipsFactura (default apagado).';
GO

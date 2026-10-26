/*
  Relación automática RIPS ↔ Factura — por LOTE (SP), no por triggers INSERT.

  Reglas:
    - Solo mismo día (fecha calendario).
    - Solo AC/AP ([Id Acto Quirúrgico] IN (1, 2)).
    - RIPS libre: [Id Factura] IS NULL o 0.
    - Facturas: no anuladas; excluye comprobantes con 'Nota' en el nombre.
    - Empate 1:1 (un RIPS ↔ una factura); más recientes primero.
    - TOP (@TopLote, default 50, máx 500) para no saturar la BD.
    - Switch: ConfigRelacionAutomaticaRipsFactura.Activo (default 0).
    - El backend llama usp_RelacionAutomatica_RipsFactura cada IntervaloMinutos
      (default 30) si Activo=1. También: POST .../ejecutar-ahora.
    - Anulación de factura: trigger ligero desrelaciona el RIPS (siempre).
    - Excluye facturas de copago (VwFacturasCopagoNoSalud / script 23).

  Idempotente. SQL Server 2014+.
  Quita triggers INSERT viejos (Relacion_* y TR_RelacionAuto_*_Insert).
  Requiere haber ejecutado 23. Factura_Copago_No_Salud.sql (o ensure-install).
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ========== 1) Config (switch + lote + intervalo) ========== */
IF OBJECT_ID(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfigRelacionAutomaticaRipsFactura (
        Id TINYINT NOT NULL
            CONSTRAINT PK_ConfigRelacionAutomaticaRipsFactura PRIMARY KEY,
        Activo BIT NOT NULL
            CONSTRAINT DF_ConfigRelacionAuto_Activo DEFAULT (0),
        FechaActualizacion DATETIME2 NOT NULL
            CONSTRAINT DF_ConfigRelacionAuto_Fecha DEFAULT (SYSUTCDATETIME()),
        IntervaloMinutos INT NOT NULL
            CONSTRAINT DF_ConfigRelacionAuto_Intervalo DEFAULT (30),
        TopLote INT NOT NULL
            CONSTRAINT DF_ConfigRelacionAuto_TopLote DEFAULT (50),
        UltimaEjecucion DATETIME2 NULL,
        UltimoRelacionados INT NULL,
        UltimoMensaje NVARCHAR(200) NULL,
        CONSTRAINT CK_ConfigRelacionAuto_SingleRow CHECK (Id = 1)
    );
    PRINT N'Tabla ConfigRelacionAutomaticaRipsFactura creada.';
END
GO

IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'IntervaloMinutos') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura
        ADD IntervaloMinutos INT NOT NULL
            CONSTRAINT DF_ConfigRelacionAuto_Intervalo DEFAULT (30);
GO
IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'TopLote') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura
        ADD TopLote INT NOT NULL
            CONSTRAINT DF_ConfigRelacionAuto_TopLote DEFAULT (50);
GO
IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'UltimaEjecucion') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura ADD UltimaEjecucion DATETIME2 NULL;
GO
IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'UltimoRelacionados') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura ADD UltimoRelacionados INT NULL;
GO
IF COL_LENGTH(N'dbo.ConfigRelacionAutomaticaRipsFactura', N'UltimoMensaje') IS NULL
    ALTER TABLE dbo.ConfigRelacionAutomaticaRipsFactura ADD UltimoMensaje NVARCHAR(200) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ConfigRelacionAutomaticaRipsFactura WHERE Id = 1)
BEGIN
    INSERT INTO dbo.ConfigRelacionAutomaticaRipsFactura (Id, Activo, IntervaloMinutos, TopLote)
    VALUES (1, 0, 30, 50);
    PRINT N'Config semilla: Activo=0, Intervalo=30 min, TopLote=50.';
END
GO

/* ========== 2) Función: ¿está activo? ========== */
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

/* ========== 3) Quitar triggers de relación en INSERT (ya no se usan) ========== */
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

/* Funciones de búsqueda usadas solo por triggers viejos: dejar o recrear no hace falta */

IF OBJECT_ID(N'dbo.fn_RelacionAuto_BuscarRipsLibre', N'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_RelacionAuto_BuscarRipsLibre;
GO
IF OBJECT_ID(N'dbo.fn_RelacionAuto_BuscarFacturaLibre', N'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_RelacionAuto_BuscarFacturaLibre;
GO

/* ========== 4) SP principal (lote con TOP) ========== */
IF OBJECT_ID(N'dbo.usp_RelacionAutomatica_RipsFactura', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_RelacionAutomatica_RipsFactura;
GO
CREATE PROCEDURE dbo.usp_RelacionAutomatica_RipsFactura
    @Top INT = NULL,       -- NULL = usa Config.TopLote
    @Forzar BIT = 0       -- 1 = ignora Activo (ejecución manual)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Activo BIT = dbo.fn_RelacionAutoRipsFactura_Activa();
    DECLARE @Limite INT;
    DECLARE @n INT = 0;
    DECLARE @msg NVARCHAR(200);

    IF @Forzar = 0 AND @Activo = 0
    BEGIN
        SET @msg = N'Desactivado';
        UPDATE dbo.ConfigRelacionAutomaticaRipsFactura
        SET UltimaEjecucion = SYSUTCDATETIME(),
            UltimoRelacionados = 0,
            UltimoMensaje = @msg
        WHERE Id = 1;

        SELECT 0 AS Relacionados, @msg AS Mensaje, CAST(0 AS BIT) AS Activo;
        RETURN;
    END

    SELECT @Limite = ISNULL(@Top, ISNULL(TopLote, 50))
    FROM dbo.ConfigRelacionAutomaticaRipsFactura
    WHERE Id = 1;

    IF @Limite IS NULL OR @Limite < 1 SET @Limite = 50;
    IF @Limite > 500 SET @Limite = 500;

    ;WITH Matches AS (
        SELECT
            r.[Id Evaluación Entidad Rips] AS IdRips,
            f.[Id Factura] AS IdFactura,
            ROW_NUMBER() OVER (
                PARTITION BY r.[Id Evaluación Entidad Rips]
                ORDER BY f.[Fecha Factura] DESC, f.[Id Factura] DESC
            ) AS rnRips,
            ROW_NUMBER() OVER (
                PARTITION BY f.[Id Factura]
                ORDER BY e.[Fecha Evaluación Entidad] DESC, r.[Id Evaluación Entidad Rips] DESC
            ) AS rnFac
        FROM dbo.[Evaluación Entidad Rips] r
        INNER JOIN dbo.[Evaluación Entidad] e
            ON e.[Id Evaluación Entidad] = r.[Id Evaluación Entidad]
        INNER JOIN dbo.Factura f
            ON LTRIM(RTRIM(f.[Documento Paciente])) = LTRIM(RTRIM(e.[Documento Entidad]))
           AND CONVERT(DATE, f.[Fecha Factura]) = CONVERT(DATE, e.[Fecha Evaluación Entidad])
        LEFT JOIN dbo.[Tipo de Comprobante] tc
            ON tc.[Id Tipo de Comprobante] = f.[Id Tipo de Comprobante]
        WHERE r.[Id Acto Quirúrgico] IN (1, 2)
          AND (r.[Id Factura] IS NULL OR r.[Id Factura] = 0)
          AND NULLIF(LTRIM(RTRIM(e.[Documento Entidad])), N'') IS NOT NULL
          AND ISNULL(f.[Id Estado], 0) <> 5
          AND (tc.[Tipo de Comprobante] IS NULL OR tc.[Tipo de Comprobante] NOT LIKE N'%Nota%')
          /* Excluir facturas de copago (cuota inicial EPS/prepagada) — no son salud */
          AND NOT EXISTS (
                SELECT 1
                FROM dbo.VwFacturasCopagoNoSalud AS cop
                WHERE cop.[Id Factura] = f.[Id Factura]
            )
          AND NOT EXISTS (
                SELECT 1
                FROM dbo.[Evaluación Entidad Rips] rx
                WHERE rx.[Id Factura] = f.[Id Factura]
                  AND ISNULL(rx.[Id Factura], 0) <> 0
            )
    ),
    Pares AS (
        SELECT TOP (@Limite)
            IdRips,
            IdFactura
        FROM Matches
        WHERE rnRips = 1
          AND rnFac = 1
        ORDER BY IdRips DESC
    )
    UPDATE r
    SET r.[Id Factura] = p.IdFactura
    FROM dbo.[Evaluación Entidad Rips] r
    INNER JOIN Pares p ON p.IdRips = r.[Id Evaluación Entidad Rips]
    WHERE (r.[Id Factura] IS NULL OR r.[Id Factura] = 0);

    SET @n = @@ROWCOUNT;
    SET @msg = N'OK lote TOP ' + CAST(@Limite AS NVARCHAR(10));

    UPDATE dbo.ConfigRelacionAutomaticaRipsFactura
    SET UltimaEjecucion = SYSUTCDATETIME(),
        UltimoRelacionados = @n,
        UltimoMensaje = @msg
    WHERE Id = 1;

    SELECT @n AS Relacionados, @msg AS Mensaje, CAST(1 AS BIT) AS Activo, @Limite AS TopUsado;
END;
GO

/* ========== 5) Anulación factura → desrelacionar RIPS (siempre) ========== */
IF OBJECT_ID(N'dbo.TR_RelacionAuto_Factura_Anulada', N'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_RelacionAuto_Factura_Anulada;
GO
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

PRINT N'Relación automática RIPS↔Factura: SP usp_RelacionAutomatica_RipsFactura (lote). Switch default OFF.';
GO

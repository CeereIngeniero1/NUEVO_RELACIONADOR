/*
  Relaciona en lote RIPS AC/AP con facturas del MISMO paciente y MISMO día (1:1).

  Garantías:
    - Nunca relaciona RIPS de otro paciente.
    - Una factura → a lo sumo un RIPS.
    - Un RIPS → a lo sumo una factura.
    - Solo AC/AP ([Id Acto Quirúrgico] IN (1,2)).
    - Solo RIPS sin factura (NULL o 0).
    - Solo facturas no anuladas ([Id Estado] <> 5), no usadas por otro RIPS,
      y cuyo tipo de comprobante NO contiene 'Nota'.
    - Si hay varios del mismo día: empareja por orden (más reciente con más reciente).
      Los sobrantes quedan sin relacionar.

  Uso:
    1) @Ejecutar = 0  → solo reporte (no modifica).
    2) Revise #Pares.
    3) @Ejecutar = 1  → aplica UPDATE.

  Opcional: filtre con @FechaDesde / @FechaHasta (NULL = sin límite).
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @Ejecutar   BIT  = 0;   -- 0 = solo reporte | 1 = relacionar
DECLARE @FechaDesde DATE = NULL; -- ej. '2026-01-01'
DECLARE @FechaHasta DATE = NULL; -- ej. '2026-10-22'

IF OBJECT_ID(N'tempdb..#Pares') IS NOT NULL DROP TABLE #Pares;

;WITH RipsLibres AS (
    SELECT
        r.[Id Evaluación Entidad Rips] AS IdRips,
        LTRIM(RTRIM(e.[Documento Entidad])) AS DocumentoPaciente,
        CONVERT(DATE, e.[Fecha Evaluación Entidad]) AS FechaDia,
        e.[Fecha Evaluación Entidad] AS FechaRips,
        r.[Id Acto Quirúrgico] AS IdActo,
        CASE r.[Id Acto Quirúrgico] WHEN 1 THEN N'AC' WHEN 2 THEN N'AP' ELSE N'?' END AS Tipo,
        ROW_NUMBER() OVER (
            PARTITION BY LTRIM(RTRIM(e.[Documento Entidad])), CONVERT(DATE, e.[Fecha Evaluación Entidad])
            ORDER BY e.[Fecha Evaluación Entidad] DESC, r.[Id Evaluación Entidad Rips] DESC
        ) AS rn
    FROM dbo.[Evaluación Entidad Rips] r
    INNER JOIN dbo.[Evaluación Entidad] e
        ON e.[Id Evaluación Entidad] = r.[Id Evaluación Entidad]
    WHERE r.[Id Acto Quirúrgico] IN (1, 2)
      AND (r.[Id Factura] IS NULL OR r.[Id Factura] = 0)
      AND NULLIF(LTRIM(RTRIM(e.[Documento Entidad])), N'') IS NOT NULL
      AND (@FechaDesde IS NULL OR CONVERT(DATE, e.[Fecha Evaluación Entidad]) >= @FechaDesde)
      AND (@FechaHasta IS NULL OR CONVERT(DATE, e.[Fecha Evaluación Entidad]) <= @FechaHasta)
),
FacturasLibres AS (
    SELECT
        f.[Id Factura] AS IdFactura,
        LTRIM(RTRIM(f.[Documento Paciente])) AS DocumentoPaciente,
        CONVERT(DATE, f.[Fecha Factura]) AS FechaDia,
        f.[Fecha Factura] AS FechaFactura,
        f.[No Factura] AS NoFactura,
        ROW_NUMBER() OVER (
            PARTITION BY LTRIM(RTRIM(f.[Documento Paciente])), CONVERT(DATE, f.[Fecha Factura])
            ORDER BY f.[Fecha Factura] DESC, f.[Id Factura] DESC
        ) AS rn
    FROM dbo.Factura f
    LEFT JOIN dbo.[Tipo de Comprobante] tc
        ON tc.[Id Tipo de Comprobante] = f.[Id Tipo de Comprobante]
    WHERE ISNULL(f.[Id Estado], 0) <> 5
      AND NULLIF(LTRIM(RTRIM(f.[Documento Paciente])), N'') IS NOT NULL
      AND (tc.[Tipo de Comprobante] IS NULL OR tc.[Tipo de Comprobante] NOT LIKE N'%Nota%')
      AND NOT EXISTS (
            SELECT 1 FROM dbo.VwFacturasCopagoNoSalud cop
            WHERE cop.[Id Factura] = f.[Id Factura]
        )
      AND NOT EXISTS (
            SELECT 1
            FROM dbo.[Evaluación Entidad Rips] r2
            WHERE r2.[Id Factura] = f.[Id Factura]
              AND ISNULL(r2.[Id Factura], 0) <> 0
        )
      AND (@FechaDesde IS NULL OR CONVERT(DATE, f.[Fecha Factura]) >= @FechaDesde)
      AND (@FechaHasta IS NULL OR CONVERT(DATE, f.[Fecha Factura]) <= @FechaHasta)
)
SELECT
    r.IdRips,
    f.IdFactura,
    r.DocumentoPaciente,
    r.FechaDia,
    r.Tipo,
    r.FechaRips,
    f.FechaFactura,
    f.NoFactura
INTO #Pares
FROM RipsLibres r
INNER JOIN FacturasLibres f
    ON f.DocumentoPaciente = r.DocumentoPaciente
   AND f.FechaDia = r.FechaDia
   AND f.rn = r.rn;  -- 1:1 estricto dentro del mismo paciente/día

PRINT N'=== CONFIG ===';
PRINT N'@Ejecutar = ' + CASE WHEN @Ejecutar = 1 THEN N'1 (RELACIONAR)' ELSE N'0 (SOLO REPORTE)' END;
PRINT N'@FechaDesde = ' + ISNULL(CONVERT(NVARCHAR(10), @FechaDesde, 120), N'(sin límite)');
PRINT N'@FechaHasta = ' + ISNULL(CONVERT(NVARCHAR(10), @FechaHasta, 120), N'(sin límite)');
PRINT N'';

PRINT N'=== PARES 1:1 PROPUESTOS (mismo paciente, mismo día) ===';
SELECT TOP (200)
    IdRips,
    IdFactura,
    DocumentoPaciente,
    FechaDia,
    Tipo,
    FechaRips,
    FechaFactura,
    NoFactura
FROM #Pares
ORDER BY FechaDia DESC, DocumentoPaciente, IdRips DESC;

DECLARE @n INT = (SELECT COUNT(*) FROM #Pares);
PRINT N'Total pares a relacionar: ' + CAST(@n AS NVARCHAR(20));

/* Validación de seguridad: no debe haber factura ni RIPS repetidos en #Pares */
DECLARE @dupRips INT = (
    SELECT COUNT(*) FROM (
        SELECT IdRips FROM #Pares GROUP BY IdRips HAVING COUNT(*) > 1
    ) d
);
DECLARE @dupFac INT = (
    SELECT COUNT(*) FROM (
        SELECT IdFactura FROM #Pares GROUP BY IdFactura HAVING COUNT(*) > 1
    ) d
);

IF @dupRips > 0 OR @dupFac > 0
BEGIN
    PRINT N'ERROR: se detectaron duplicados en el emparejamiento. No se aplica UPDATE.';
    PRINT N'RIPS duplicados: ' + CAST(@dupRips AS NVARCHAR(20));
    PRINT N'Facturas duplicadas: ' + CAST(@dupFac AS NVARCHAR(20));
END
ELSE IF @Ejecutar = 1 AND @n > 0
BEGIN
    BEGIN TRAN;

    UPDATE r
    SET r.[Id Factura] = p.IdFactura
    FROM dbo.[Evaluación Entidad Rips] r
    INNER JOIN #Pares p ON p.IdRips = r.[Id Evaluación Entidad Rips]
    WHERE (r.[Id Factura] IS NULL OR r.[Id Factura] = 0)
      /* doble chequeo: la factura sigue libre al momento del UPDATE */
      AND NOT EXISTS (
            SELECT 1
            FROM dbo.[Evaluación Entidad Rips] r3
            WHERE r3.[Id Factura] = p.IdFactura
              AND ISNULL(r3.[Id Factura], 0) <> 0
              AND r3.[Id Evaluación Entidad Rips] <> r.[Id Evaluación Entidad Rips]
        );

    PRINT N'Relacionados: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));

    COMMIT TRAN;
END
ELSE IF @Ejecutar = 0
    PRINT N'Fin reporte. Para aplicar: DECLARE @Ejecutar BIT = 1';
ELSE
    PRINT N'Nada que relacionar.';

/* Resumen de huérfanos (mismo filtro de fechas) */
PRINT N'';
PRINT N'=== RESUMEN (tras emparejar / reporte) ===';
SELECT
    (SELECT COUNT(*) FROM #Pares) AS ParesPropuestos,
    (
        SELECT COUNT(*)
        FROM dbo.[Evaluación Entidad Rips] r
        INNER JOIN dbo.[Evaluación Entidad] e
            ON e.[Id Evaluación Entidad] = r.[Id Evaluación Entidad]
        WHERE r.[Id Acto Quirúrgico] IN (1, 2)
          AND (r.[Id Factura] IS NULL OR r.[Id Factura] = 0)
          AND (@FechaDesde IS NULL OR CONVERT(DATE, e.[Fecha Evaluación Entidad]) >= @FechaDesde)
          AND (@FechaHasta IS NULL OR CONVERT(DATE, e.[Fecha Evaluación Entidad]) <= @FechaHasta)
    ) AS RipsACAP_AunSinFactura;

DROP TABLE #Pares;
GO

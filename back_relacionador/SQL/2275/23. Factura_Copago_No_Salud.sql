/*
==============================================================================
  Facturas de COPAGO (no son facturas en salud) — exclusión global Relacionador
==============================================================================
  Identificación (robusta entre BDs; NO depender solo de Ids numéricos):
    1) Tratamiento con Forma de Pago texto tipo EPS/Prepago/Prepagada
    2) Y Tipo Responsable texto tipo EPS/Prepagada
    3) Y el pago viene de cuota INICIAL (valor) o Descripción FacturaII con 'Copago'

  Nota: la columna Descripcion FacturaII se resuelve por sys.columns (tilde/encoding).

  Objetos:
    - Vista  dbo.VwFacturasCopagoNoSalud
    - Función dbo.fn_EsFacturaCopagoNoSalud(@IdFactura)
    - Actualiza ConsultaFacturasPaciente para no listar copagos

  Idempotente. SQL Server 2014+.
==============================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* Dependientes primero */
IF OBJECT_ID(N'dbo.[ConsultaFacturasPaciente]', N'V') IS NOT NULL
    DROP VIEW dbo.[ConsultaFacturasPaciente];
GO
IF OBJECT_ID(N'dbo.fn_EsFacturaCopagoNoSalud', N'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_EsFacturaCopagoNoSalud;
GO
IF OBJECT_ID(N'dbo.VwFacturasCopagoNoSalud', N'V') IS NOT NULL
    DROP VIEW dbo.VwFacturasCopagoNoSalud;
GO

DECLARE @colDescr SYSNAME =
(
    SELECT TOP 1 c.name
    FROM sys.columns c
    WHERE c.object_id = OBJECT_ID(N'dbo.FacturaII')
      AND c.name LIKE N'Descripci% FacturaII'
);

IF @colDescr IS NULL
    SET @colDescr = N'Descripcion FacturaII'; -- fallback si no existe la columna

DECLARE @sql NVARCHAR(MAX) = N'
CREATE VIEW dbo.VwFacturasCopagoNoSalud
AS
SELECT DISTINCT
    fii.[Id Factura]
FROM dbo.FacturaII AS fii
INNER JOIN dbo.[Plan de Tratamiento Tratamientos] AS ptt
    ON ptt.[Id Plan de Tratamiento] = fii.[Id Plan de Tratamiento]
INNER JOIN dbo.[Forma de Pago Tratamiento] AS fpt
    ON fpt.[Id Forma de Pago Tratamiento] = ptt.[Id Forma de Pago Tratamiento]
INNER JOIN dbo.[Tipo Responsable] AS tr
    ON tr.[Id Tipo Responsable] = ptt.[Id Tipo Responsable]
LEFT JOIN dbo.[Cuotas Pactadas Inicial Tratamiento] AS cpi
    ON cpi.[Id Plan de Tratamiento Tratamientos] = ptt.[Id Plan de Tratamiento Tratamientos]
LEFT JOIN dbo.Factura AS f
    ON f.[Id Factura] = fii.[Id Factura]
WHERE
    (
        ISNULL(fpt.[Forma de Pago Tratamiento], N'''') LIKE N''%EPS%''
        OR ISNULL(fpt.[Forma de Pago Tratamiento], N'''') LIKE N''%Prepago%''
        OR ISNULL(fpt.[Forma de Pago Tratamiento], N'''') LIKE N''%Prepagad%''
    )
    AND (
        ISNULL(tr.[Tipo Responsable], N'''') LIKE N''%EPS%''
        OR ISNULL(tr.[Tipo Responsable], N'''') LIKE N''%Prepag%''
    )
    AND (
        ISNULL(fii.[' + @colDescr + N'], N'''') LIKE N''%Copago%''
        OR (
            cpi.[Id Cuotas Pactadas Inicial Tratamiento] IS NOT NULL
            AND ISNULL(cpi.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento], 0) > 0
            AND (
                ABS(
                    ISNULL(fii.[Valor FacturaII], 0)
                    - ISNULL(cpi.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento], 0)
                ) < 1
                OR ABS(
                    ISNULL(f.[Total Factura], 0)
                    - ISNULL(cpi.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento], 0)
                ) < 1
            )
        )
    );
';

EXEC sys.sp_executesql @sql;
PRINT N'Vista VwFacturasCopagoNoSalud creada (col descr: ' + @colDescr + N').';
GO

CREATE FUNCTION dbo.fn_EsFacturaCopagoNoSalud (@IdFactura INT)
RETURNS BIT
AS
BEGIN
    IF @IdFactura IS NULL OR @IdFactura = 0
        RETURN 0;

    IF EXISTS (
        SELECT 1
        FROM dbo.VwFacturasCopagoNoSalud AS c
        WHERE c.[Id Factura] = @IdFactura
    )
        RETURN 1;

    RETURN 0;
END;
GO

CREATE VIEW dbo.[ConsultaFacturasPaciente]
AS
SELECT
    Fac.[Documento Paciente] AS DocumentoPaciente,
    Fac.[Documento Responsable] AS DocumentoResponsable,
    Fac.[Id Factura] AS Value,
    Fac.[Fecha Factura] AS FechaFactura,
    EmpV.[Prefijo Resolución Facturación EmpresaV] + Fac.[No Factura] + ' - '
        + DATENAME(WEEKDAY, Fac.[Fecha Factura]) + ' '
        + CAST(DAY(Fac.[Fecha Factura]) AS VARCHAR) + ' de '
        + DATENAME(MONTH, Fac.[Fecha Factura]) + ' del '
        + CAST(YEAR(Fac.[Fecha Factura]) AS VARCHAR) AS Text,
    Fac.[Total Factura] AS TotalFactura
FROM dbo.Factura AS Fac
INNER JOIN dbo.EmpresaV AS EmpV
    ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.[Evaluación Entidad Rips] evr
    WHERE evr.[Id Factura] = Fac.[Id Factura]
)
AND NOT EXISTS (
    SELECT 1
    FROM dbo.VwFacturasCopagoNoSalud AS cop
    WHERE cop.[Id Factura] = Fac.[Id Factura]
);
GO

PRINT N'Copago no-salud: VwFacturasCopagoNoSalud + fn + ConsultaFacturasPaciente OK.';
GO

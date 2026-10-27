/*
==============================================================================
  Facturas de plan EPS / Entidad Prepagada (capital o copago)
==============================================================================
  Cualquier factura ligada por FacturaII a un tratamiento con:
    - Forma de Pago texto EPS/Prepago/Prepagada
    - Tipo Responsable texto EPS/Prepagada

  Uso en listados PARTICULAR: excluir estas facturas (van en flujo Prepagada/EPS).
  Los copagos (VwFacturasCopagoNoSalud) son subconjunto; igual se excluyen ambos.

  Idempotente. SQL Server 2014+.
==============================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.[ConsultaFacturasPaciente]', N'V') IS NOT NULL
    DROP VIEW dbo.[ConsultaFacturasPaciente];
GO
IF OBJECT_ID(N'dbo.VwFacturasPlanEpsPrepagada', N'V') IS NOT NULL
    DROP VIEW dbo.VwFacturasPlanEpsPrepagada;
GO

CREATE VIEW dbo.VwFacturasPlanEpsPrepagada
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
WHERE
    (
        ISNULL(fpt.[Forma de Pago Tratamiento], N'') LIKE N'%EPS%'
        OR ISNULL(fpt.[Forma de Pago Tratamiento], N'') LIKE N'%Prepago%'
        OR ISNULL(fpt.[Forma de Pago Tratamiento], N'') LIKE N'%Prepagad%'
    )
    AND (
        ISNULL(tr.[Tipo Responsable], N'') LIKE N'%EPS%'
        OR ISNULL(tr.[Tipo Responsable], N'') LIKE N'%Prepag%'
    );
GO

/* Recrear selector de facturas (Asignar RIPS / particulares): sin copago ni EPS/prepagada */
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
)
AND NOT EXISTS (
    SELECT 1
    FROM dbo.VwFacturasPlanEpsPrepagada AS eps
    WHERE eps.[Id Factura] = Fac.[Id Factura]
);
GO

PRINT N'VwFacturasPlanEpsPrepagada + ConsultaFacturasPaciente OK.';
GO

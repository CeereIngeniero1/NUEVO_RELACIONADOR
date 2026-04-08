/*
  Tipo de diagnóstico principal (RIPS): quita filas "fantasma" del catálogo activo
  (código o descripción vacíos) y endurece la vista de consulta.

  Ejecutar en la base donde vive [Tipo de Diagnóstico Principal].
  Requiere que exista la vista [Cnsta Relacionador Tipo Diagnostico Principal].
*/

SET NOCOUNT ON;

-- 1) Inactivar filas activas sin código o sin descripción (ajuste Id Estado si 8 no es "inactivo" en su modelo).
UPDATE dbo.[Tipo de Diagnóstico Principal]
SET [Id Estado] = 8
WHERE [Id Estado] = 7
  AND (
        NULLIF(LTRIM(RTRIM(CAST([Código Tipo de Diagnóstico Principal] AS NVARCHAR(50)))), N'') IS NULL
     OR NULLIF(LTRIM(RTRIM(CAST([Descripción Tipo de Diagnóstico Principal] AS NVARCHAR(500)))), N'') IS NULL
      );

PRINT N'Filas inactivadas (código/descripcion vacíos): ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
GO

-- 2) Vista: solo filas con código y descripción no vacíos
ALTER VIEW [dbo].[Cnsta Relacionador Tipo Diagnostico Principal]
AS
SELECT
    [Id Tipo de Diagnóstico Principal] AS IdTipodeDiagnósticoPrincipal,
    [Código Tipo de Diagnóstico Principal] AS CódigoTipodeDiagnósticoPrincipal,
    [Tipo de Diagnóstico Principal] AS TipodeDiagnósticoPrincipal,
    [Descripción Tipo de Diagnóstico Principal] AS DescripcionTipodeDiagnósticoPrincipal,
    [Orden Tipo de Diagnóstico Principal] AS ordenTipodeDiagnósticoPrincipal,
    [Id Estado]
FROM dbo.[Tipo de Diagnóstico Principal]
WHERE [Id Estado] = 7
  AND NULLIF(LTRIM(RTRIM(CAST([Código Tipo de Diagnóstico Principal] AS NVARCHAR(50)))), N'') IS NOT NULL
  AND NULLIF(LTRIM(RTRIM(CAST([Descripción Tipo de Diagnóstico Principal] AS NVARCHAR(500)))), N'') IS NOT NULL;
GO

PRINT N'Vista [Cnsta Relacionador Tipo Diagnostico Principal] actualizada.';
GO

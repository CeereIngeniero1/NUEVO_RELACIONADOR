/*
==============================================================================
  UPDATES RELACIONADOR 2275 — INSTALACIÓN IDEMPOTENTE
==============================================================================
  Actualizaciones de catálogos CeereSIO existentes. Condiciones WHERE evitan re-ejecución incorrecta.

  Orden de ejecución:
    1. 14. TABLAS
    2. 15. ALTER
    3. 16. UPDATES (este)
    4. 17. DATOS
    5. 13. VISTAS

  Prerrequisitos:
    - Tablas CeereSIO base con datos de catálogo

  Fuentes:
    - 3. Query.sql
    - 4. QUERRYS Asignar Rips.sql
==============================================================================
*/

SET NOCOUNT ON;
GO

/* País Colombia → código SISPRO 170 */
UPDATE dbo.País SET País = 170
WHERE [Descripción País] = N'Colombia' AND (País IS NULL OR País <> 170);
GO

/* Zona residencia → códigos SISPRO */
UPDATE dbo.[Zona Residencia] SET [Código Zona Residencia] = 1
WHERE [Descripción Zona Residencia] = N'Rural'
  AND ([Código Zona Residencia] IS NULL OR [Código Zona Residencia] <> 1);
GO
UPDATE dbo.[Zona Residencia] SET [Código Zona Residencia] = 2
WHERE [Descripción Zona Residencia] = N'Urbana'
  AND ([Código Zona Residencia] IS NULL OR [Código Zona Residencia] <> 2);
GO

/* Tipo diagnóstico principal → códigos versión 2 */
UPDATE dbo.[Tipo de Diagnóstico Principal]
SET [Código Tipo de Diagnóstico Principal] = CASE [Descripción Tipo de Diagnóstico Principal]
    WHEN N'Impresión diagnóstica' THEN N'01'
    WHEN N'Confirmado nuevo' THEN N'02'
    WHEN N'Confirmado repetido' THEN N'03'
    ELSE [Código Tipo de Diagnóstico Principal] END
WHERE [Descripción Tipo de Diagnóstico Principal] IN (
    N'Impresión diagnóstica', N'Confirmado nuevo', N'Confirmado repetido');
GO

/* Tipo entidad → códigos y estados SISPRO */
UPDATE dbo.[Tipo Entidad]
SET [Código Tipo Entidad] = CASE [Descripción Tipo Entidad]
    WHEN N'Subsidiado' THEN N'04' WHEN N'Particular' THEN N'12'
    ELSE [Código Tipo Entidad] END
WHERE [Descripción Tipo Entidad] IN (N'Subsidiado', N'Particular');
GO
UPDATE dbo.[Tipo Entidad]
SET [Id Estado] = CASE [Descripción Tipo Entidad]
    WHEN N'Subsidiado' THEN 7 WHEN N'Particular' THEN 7
    WHEN N'Contributivo' THEN 8 WHEN N'Vinculado' THEN 8 WHEN N'Otro' THEN 8
    WHEN N'Ecopetrol S.A.' THEN 8 WHEN N'Colsanitas Prepagada' THEN 8
    WHEN N'Extranjero' THEN 8 WHEN N'Plan Odontologico' THEN 8 WHEN N'Medisanitas' THEN 8
    ELSE [Id Estado] END
WHERE [Descripción Tipo Entidad] IN (
    N'Subsidiado', N'Particular', N'Contributivo', N'Vinculado', N'Otro',
    N'Ecopetrol S.A.', N'Colsanitas Prepagada', N'Extranjero', N'Plan Odontologico', N'Medisanitas');
GO

/* Tipo Rips → códigos función */
UPDATE dbo.[Tipo Rips]
SET [Código Tipo Rips] = CASE [Tipo Rips]
    WHEN N'Particulares' THEN N'17'
    WHEN N'Entidad Prepago' THEN N'24'
    WHEN N'EPS' THEN N'23'
    ELSE [Código Tipo Rips] END
WHERE [Tipo Rips] IN (N'Particulares', N'Entidad Prepago', N'EPS');
GO

/* Descripción grupo servicios para join con servicios */
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'CONSULTA EXTERNA'
WHERE Codigo = N'01' AND ISNULL([Descripción Grupo Servicios], N'') <> N'CONSULTA EXTERNA';
GO
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA'
WHERE Codigo = N'02' AND ISNULL([Descripción Grupo Servicios], N'') <> N'APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA';
GO
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'INTERNACION'
WHERE Codigo = N'03' AND ISNULL([Descripción Grupo Servicios], N'') <> N'INTERNACION';
GO
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'QUIRURGICOS'
WHERE Codigo = N'04' AND ISNULL([Descripción Grupo Servicios], N'') <> N'QUIRURGICOS';
GO
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'ATENCION INMEDIATA'
WHERE Codigo = N'05' AND ISNULL([Descripción Grupo Servicios], N'') <> N'ATENCION INMEDIATA';
GO

/* Codigo Grupo Servicios en RIPS Servicios */
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'01'
WHERE [Descripción Servicios] = N'CONSULTA EXTERNA' AND ISNULL([Codigo Grupo Servicios], N'') <> N'01';
GO
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'02'
WHERE [Descripción Servicios] = N'APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA'
  AND ISNULL([Codigo Grupo Servicios], N'') <> N'02';
GO
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'03'
WHERE [Descripción Servicios] = N'INTERNACION' AND ISNULL([Codigo Grupo Servicios], N'') <> N'03';
GO
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'04'
WHERE [Descripción Servicios] = N'QUIRURGICOS' AND ISNULL([Codigo Grupo Servicios], N'') <> N'04';
GO
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'05'
WHERE [Descripción Servicios] = N'ATENCION INMEDIATA' AND ISNULL([Codigo Grupo Servicios], N'') <> N'05';
GO

/* Finalidad consulta legacy — desactivar registros viejos */
UPDATE dbo.[Finalidad Consulta] SET [Id Estado] = 8
WHERE [Descripción Finalidad Consulta] IN (
    N'Deteccion de enfermedad salud oral',
    N'Detección de alteraciones de crecimiento y desarrollo del menor de diez años',
    N'Detección de alteración del desarrollo joven',
    N'Detección de alteraciones del embarazo',
    N'Detección de alteraciones del adulto',
    N'Detección de enfermedad profesional',
    N'No aplica')
  AND [Id Estado] <> 8;
GO

PRINT N'=== UPDATES_2275_INSTALL — instalación completada ===';
GO

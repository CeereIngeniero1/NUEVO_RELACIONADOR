/*
==============================================================================
  UPDATES RELACIONADOR 1888 — INSTALACIÓN IDEMPOTENTE
==============================================================================
  Correcciones de catálogos y datos legacy. Cada bloque documenta su propósito.

  Orden de ejecución:
    1. TABLAS
    2. ALTER
    3. UPDATES (este)
    4. DATOS
    5. VISTAS

  Prerrequisitos:
    - TABLAS y ALTER ejecutados

  Fuentes:
    - 1888.sql
    - 1888 update a registros malos.sql
    - 1888_update_ocupacion_ciuo88ac.sql
    - 1888_replace_ocupacion_ciuo88ac.sql
    - 1888_ocupacion_sin_asignar.sql
    - 1888_update_rips_cups_nombre_desde_cups_codigos.sql
==============================================================================
*/

SET NOCOUNT ON;
GO

/* Zona residencia → códigos RIPS (U/R) */
UPDATE dbo.[Zona Residencia]
SET [Código Zona Residencia] = N'01', [Zona Residencia] = N'U'
WHERE [Descripción Zona Residencia] = N'Urbana'
  AND ([Código Zona Residencia] IS NULL OR [Código Zona Residencia] <> N'01');
GO
UPDATE dbo.[Zona Residencia]
SET [Código Zona Residencia] = N'02', [Zona Residencia] = N'R'
WHERE [Descripción Zona Residencia] = N'Rural'
  AND ([Código Zona Residencia] IS NULL OR [Código Zona Residencia] <> N'02');
GO

/* Etnia legacy → inactivar antes de insertar catálogo 1888 */
UPDATE dbo.Etnia SET [Id Estado] = 8
WHERE [Id Estado] = 7 AND [Código Etnia] NOT IN (N'1',N'2',N'3',N'4',N'5',N'6',N'99');
GO

/* Tipo de Documento — normalizar códigos IHCE (1888 update a registros malos.sql) */
UPDATE dbo.[Tipo de Documento]
SET [Código Tipo de Documento] = CASE [Tipo de Documento]
    WHEN N'CC' THEN N'CC' WHEN N'CE' THEN N'CE' WHEN N'PA' THEN N'PA'
    WHEN N'RC' THEN N'RC' WHEN N'TI' THEN N'TI' WHEN N'AS' THEN N'AS'
    WHEN N'MS' THEN N'MS' WHEN N'UN' THEN N'UN' WHEN N'NI' THEN N'NI'
    WHEN N'NH' THEN N'NH' ELSE [Código Tipo de Documento] END
WHERE [Tipo de Documento] IS NOT NULL;
GO

/* Catálogos 1888 — descripciones corregidas */
UPDATE dbo.[Tipo de alergia 1888]
SET Descripcion = N'Sustancia que entran en contacto con la piel'
WHERE Codigo = N'04' AND Descripcion <> N'Sustancia que entran en contacto con la piel';
GO

UPDATE dbo.[Entorno de atencion 1888]
SET Descripcion = CASE Codigo
    WHEN N'01' THEN N'Hogar' WHEN N'02' THEN N'Comunitario' WHEN N'03' THEN N'Escolar'
    WHEN N'04' THEN N'Laboral' WHEN N'05' THEN N'Institucional' ELSE Descripcion END
WHERE Codigo IN (N'01',N'02',N'03',N'04',N'05');
GO

UPDATE dbo.[Alcance incapacidad 1888]
SET Descripcion = CASE Codigo WHEN N'01' THEN N'Nueva' WHEN N'02' THEN N'Prórroga' ELSE Descripcion END
WHERE Codigo IN (N'01', N'02');
GO
UPDATE dbo.[Alcance incapacidad 1888] SET [Id Estado] = 8
WHERE Codigo NOT IN (N'01', N'02') AND [Id Estado] <> 8;
GO

UPDATE dbo.[Factor De Riesgo 1888]
SET Descripcion = CASE Codigo
    WHEN N'01' THEN N'Químicos' WHEN N'02' THEN N'Físicos' WHEN N'03' THEN N'Biomecánicos'
    WHEN N'04' THEN N'Psicosociales' WHEN N'05' THEN N'Biológicos' WHEN N'06' THEN N'Otro'
    ELSE Descripcion END
WHERE Codigo IN (N'01',N'02',N'03',N'04',N'05',N'06');
GO

UPDATE dbo.[Egreso y Remision 1888]
SET Descripcion = CASE Codigo
    WHEN N'01' THEN N'PACIENTE CON DESTINO A SU DOMICILIO'
    WHEN N'02' THEN N'PACIENTE MUERTO'
    WHEN N'03' THEN N'PACIENTE DERIVADO A OTRO SERVICIO'
    WHEN N'04' THEN N'REFERIDO A OTRA INSTITUCION'
    WHEN N'05' THEN N'CONTRAREFERIDO A OTRA INSTITUCION'
    WHEN N'06' THEN N'DERIVADO O REFERIDO A HOSPITALIZACION DOMICILIARIA'
    WHEN N'07' THEN N'DERIVADO A SERVICIO SOCIAL'
    WHEN N'08' THEN N'PACIENTE CONTINUA EN EL SERVICIO (CORTE FACTURACION)'
    ELSE Descripcion END
WHERE Codigo IN (N'01',N'02',N'03',N'04',N'05',N'06',N'07',N'08');
GO

UPDATE dbo.[Tipo diagnostico principal 1888]
SET Descripcion = CASE Codigo
    WHEN N'01' THEN N'Impresión diagnóstica'
    WHEN N'02' THEN N'Confirmado nuevo'
    WHEN N'03' THEN N'Confirmado repetido'
    ELSE Descripcion END
WHERE Codigo IN (N'01',N'02',N'03');
GO

/* Ocupación CeereSIO — marcar legacy inactivo antes de CIUO88AC */
UPDATE dbo.Ocupación SET [Id Estado] = 8
WHERE [Id Estado] = 7 AND [Código Ocupación] IS NOT NULL;
GO

PRINT N'=== UPDATES_1888_INSTALL — instalación completada ===';
GO

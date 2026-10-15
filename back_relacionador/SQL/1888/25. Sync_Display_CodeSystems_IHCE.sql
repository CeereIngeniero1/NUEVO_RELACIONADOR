/*
  Alinea catálogos con los textos (display) oficiales de los CodeSystem RDA de MinSalud
  (carpeta CODESYSTEM) para que IHCE no devuelva "has incorrect display".
    - País1888: 170 = 'Colombia' (los duplicados los limpia 24. Limpiar_Duplicados_Catalogos.sql).
    - Tipo diagnostico principal 1888 (RIPSTipoDiagnosticoPrincipalVersion2).
    - RIPS Causa Externa Version2 (RIPSCausaExternaVersion2).
    - Egreso y Remision 1888 (CondicionyDestinoUsuarioEgreso).
  Idempotente. No inserta códigos nuevos.
*/
SET NOCOUNT ON;
GO

/* ---- País1888 ---- */
IF OBJECT_ID(N'dbo.[País1888]', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.[País1888] SET Nombre = N'Colombia'
    WHERE LTRIM(RTRIM(Codigo)) = N'170' AND Nombre <> N'Colombia' COLLATE Latin1_General_CS_AS;
END
GO

/* ---- Tipo diagnostico principal 1888 ---- */
IF OBJECT_ID(N'dbo.[Tipo diagnostico principal 1888]', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.[Tipo diagnostico principal 1888]
    SET Descripcion = CASE LTRIM(RTRIM(Codigo))
        WHEN N'01' THEN N'Impresión Diagnóstica'
        WHEN N'02' THEN N'Confirmado Nuevo'
        WHEN N'03' THEN N'Confirmado Repetido'
    END
    WHERE LTRIM(RTRIM(Codigo)) IN (N'01', N'02', N'03');
END
GO

/* ---- RIPS Causa Externa Version2 ---- */
IF OBJECT_ID(N'dbo.[RIPS Causa Externa Version2]', N'U') IS NOT NULL
BEGIN
    DECLARE @Causa TABLE (Codigo NVARCHAR(10) NOT NULL PRIMARY KEY, Nombre NVARCHAR(400) NOT NULL);
    INSERT INTO @Causa (Codigo, Nombre) VALUES
        (N'21', N'ACCIDENTE DE TRABAJO'),
        (N'22', N'ACCIDENTE EN EL HOGAR'),
        (N'23', N'ACCIDENTE DE TRANSITO DE ORIGEN COMUN'),
        (N'24', N'ACCIDENTE DE TRANSITO DE ORIGEN LABORAL'),
        (N'25', N'ACCIDENTE EN EL ENTORNO EDUCATIVO'),
        (N'26', N'OTRO TIPO DE ACCIDENTE'),
        (N'27', N'EVENTO CATASTROFICO DE ORIGEN NATURAL'),
        (N'28', N'LESION POR AGRESION'),
        (N'29', N'LESION AUTO INFLIGIDA'),
        (N'30', N'SOSPECHA DE VIOLENCIA FISICA'),
        (N'31', N'SOSPECHA DE VIOLENCIA PSICOLOGICA'),
        (N'32', N'SOSPECHA DE VIOLENCIA SEXUAL'),
        (N'33', N'SOSPECHA DE NEGLIGENCIA Y ABANDONO'),
        (N'34', N'IVE RELACIONADO CON PELIGRO A LA SALUD O VIDA DE LA MUJER'),
        (N'35', N'IVE POR MALFORMACION CONGENITA INCOMPATIBLE CON LA VIDA'),
        (N'36', N'IVE POR VIOLENCIA SEXUAL, INCESTO O POR INSEMINACION ARTIFICIAL O TRANSFERENCIA DE OVULO FECUNDADO NO CONSENTIDA'),
        (N'37', N'EVENTO ADVERSO EN SALUD'),
        (N'38', N'ENFERMEDAD GENERAL'),
        (N'39', N'ENFERMEDAD LABORAL'),
        (N'40', N'PROMOCION Y MANTENIMIENTO DE LA SALUD - INTERVENCIONES INDIVIDUALES'),
        (N'41', N'INTERVENCION COLECTIVA'),
        (N'42', N'ATENCION DE POBLACION MATERNO PERINATAL'),
        (N'43', N'RIESGO AMBIENTAL'),
        (N'44', N'OTROS EVENTOS CATASTROFICOS'),
        (N'45', N'ACCIDENTE DE MINA ANTIPERSONAL - MAP'),
        (N'46', N'ACCIDENTE DE ARTEFACTO EXPLOSIVO IMPROVISADO - AEI'),
        (N'47', N'ACCIDENTE DE MUNICION SIN EXPLOTAR - MUSE'),
        (N'48', N'OTRA VICTIMA DE CONFLICTO ARMADO COLOMBIANO'),
        (N'49', N'IVE POR DECISION O MANIFESTACION DE VOLUNTAD DE LA PERSONA GESTANTE HASTA LA SEMANA 24 DE GESTACION');

    UPDATE t SET [Nombre RIPS Causa Externa Version2] = c.Nombre
    FROM dbo.[RIPS Causa Externa Version2] t
    INNER JOIN @Causa c ON c.Codigo = LTRIM(RTRIM(t.Codigo));
END
GO

/* ---- Egreso y Remision 1888 (el 06 lleva la ortografía del CodeSystem oficial) ---- */
IF OBJECT_ID(N'dbo.[Egreso y Remision 1888]', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.[Egreso y Remision 1888]
    SET Descripcion = N'DERIVADO O REFERIDO A HOSPITALIZACION DOMICILIRIA'
    WHERE LTRIM(RTRIM(Codigo)) = N'06';
END
GO

PRINT N'=== 25. Sync_Display_CodeSystems_IHCE — completado ===';
GO

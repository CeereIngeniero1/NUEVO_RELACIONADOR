/*
  Seed idempotente de catálogos RDA que el instalador creaba vacíos:
    - Entidades sgsss 1888        (Administrador Plan Beneficios / EPS)
    - Parentesco familiar RDA 1888 (Antecedentes familiares)
    - Tipo de alergia 1888
    - Otra tecnologia categoria 1888
    - Alcance incapacidad 1888
  Solo inserta los Códigos que falten y reactiva Id Estado = 7. No borra nada.
*/
SET NOCOUNT ON;
GO

/* ---- Regimen (requerido por Entidades sgsss 1888) ---- */
IF OBJECT_ID(N'dbo.Regimen', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.Regimen WHERE Nombre = N'Contributivo')
        INSERT INTO dbo.Regimen (Nombre, [Id Estado]) VALUES (N'Contributivo', 1);
    IF NOT EXISTS (SELECT 1 FROM dbo.Regimen WHERE Nombre = N'Subsidiado')
        INSERT INTO dbo.Regimen (Nombre, [Id Estado]) VALUES (N'Subsidiado', 1);
END
GO

/* ---- Entidades sgsss 1888 (EPS contributivo C / subsidiado S) ---- */
IF OBJECT_ID(N'dbo.[Entidades sgsss 1888]', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Regimen', N'U') IS NOT NULL
BEGIN
    DECLARE @Contrib INT = (SELECT [Id Regimen] FROM dbo.Regimen WHERE Nombre = N'Contributivo');
    DECLARE @Subsid  INT = (SELECT [Id Regimen] FROM dbo.Regimen WHERE Nombre = N'Subsidiado');

    DECLARE @Sgsss TABLE (Codigo NVARCHAR(20) NOT NULL PRIMARY KEY, Nombre NVARCHAR(500) NOT NULL, Reg CHAR(1) NOT NULL);
    INSERT INTO @Sgsss (Codigo, Nombre, Reg) VALUES
    (N'CCFC07', N'CAJA DE COMPENSACIÓN FAMILIAR DE CARTAGENA Y BOLÍVAR COMFAMILIAR -CM', 'C'),
    (N'CCFC20', N'CAJA DE COMPENSACIÓN FAMILIAR DEL CHOCÓ -CM', 'C'),
    (N'CCFC23', N'CAJA DE COMPENSACIÓN FAMILIAR DE LA GUAJIRA "COMFAGUAJIRA" -CM', 'C'),
    (N'CCFC24', N'CAJA DE COMPENSACIÓN FAMILIAR DEL HUILA "COMFAMILIAR" -CM', 'C'),
    (N'CCFC27', N'CAJA DE COMPENSACIÓN FAMILIAR DE NARIÑO -CM', 'C'),
    (N'CCFC33', N'CAJA DE COMPENSACIÓN FAMILIAR DE SUCRE -CM', 'C'),
    (N'CCFC50', N'CAJA DE COMPENSACIÓN FAMILIAR DEL ORIENTE COLOMBIANO "COMFAORIENTE" -CM', 'C'),
    (N'CCFC53', N'CAJA DE COMPENSACIÓN FAMILIAR DE CUNDINAMARCA "COMFACUNDI" -CM', 'C'),
    (N'CCFC55', N'CAJA DE COMPENSACIÓN FAMILIAR CAJACOPI ATLÁNTICO -CM', 'C'),
    (N'EAS016', N'EMPRESAS PUBLICAS DE MEDELLIN - DEPARTAMENTO MEDICO', 'C'),
    (N'EAS027', N'FONDO PASIVO SOCIAL DE LOS FERROCARRILES NACIONALES', 'C'),
    (N'EPS001', N'ALIANSALUD EPS S.A.', 'C'),
    (N'EPS002', N'SALUD TOTAL ENTIDAD PROMOTORA DE SALUD DEL REGIMEN CONTRIBUTIVO Y DEL REGIMEN SUBSIDIADO S.A.', 'C'),
    (N'EPS005', N'ENTIDAD PROMOTORA DE SALUD SANITAS S.A.S.', 'C'),
    (N'EPS008', N'CAJA DE COMPENSACIÓN FAMILIAR COMPENSAR', 'C'),
    (N'EPS010', N'EPS SURAMERICANA S.A.', 'C'),
    (N'EPS012', N'CAJA DE COMPENSACION FAMILIAR DEL VALLE DEL CAUCA "COMFENALCO VALLE DE LA GENTE"', 'C'),
    (N'EPS016', N'COOMEVA ENTIDAD PROMOTORA DE SALUD S.A. "COOMEVA E.P.S. S.A."', 'C'),
    (N'EPS017', N'EPS FAMISANAR S.A.S.', 'C'),
    (N'EPS018', N'ENTIDAD PROMOTORA DE SALUD SERVICIO OCCIDENTAL DE SALUD S.A. S.O.S.', 'C'),
    (N'EPS037', N'NUEVA EPS S.A.', 'C'),
    (N'EPS040', N'ALIANZA MEDELLIN ANTIOQUIA EPS S.A.S. "SAVIA SALUD EPS" -CM', 'C'),
    (N'EPS041', N'NUEVA EPS S.A. -CM', 'C'),
    (N'EPS042', N'COOSALUD EPS S.A.', 'C'),
    (N'EPS044', N'MEDIMAS EPS S.A.S.', 'C'),
    (N'EPS045', N'MEDIMAS EPS S.A.S. -CM', 'C'),
    (N'EPS046', N'FUDACIÓN SALUD MIA', 'C'),
    (N'EPS048', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS', 'C'),
    (N'EPSC22', N'ENTIDAD PROMOTORA DE SALUD DEL REGIMEN SUBSIDIADO EPS CONVIDA -CM', 'C'),
    (N'EPSC25', N'CAPRESOCA E.P.S. -CM', 'C'),
    (N'EPSC34', N'CAPITAL SALUD ENTIDAD PROMOTORA DE SALUD DEL RÉGIMEN SUBSIDIADO SAS "CAPITAL SALUD EPS-S S.A.S." -CM', 'C'),
    (N'EPSIC1', N'ASOCIACIÓN DE CABILDOS INDÍGENAS DEL CESAR Y GUAJIRA "DUSAKAWI A.R.S.I." -CM', 'C'),
    (N'EPSIC3', N'ASOCIACIÓN INDÍGENA DEL CAUCA A.I.C. EPSI -CM', 'C'),
    (N'EPSIC4', N'EMPRESA PROMOTORA DE SALUD INDÍGENA ANAS WAYUU EPSI -CM', 'C'),
    (N'EPSIC5', N'ENTIDAD PROMOTORA DE SALUD MALLAMAS EPSI -CM', 'C'),
    (N'EPSIC6', N'PIJAOS SALUD EPSI -CM', 'C'),
    (N'ESSC07', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS -CM', 'C'),
    (N'ESSC18', N'EMSSANAR S.A.S. -CM', 'C'),
    (N'ESSC24', N'COOSALUD EPS S.A. -CM', 'C'),
    (N'ESSC33', N'COOPERATIVA DE SALUD COMUNITARIA EMPRESA PROMOTORA SUBSIDIADA "COMPARTA EPS-S" -CM', 'C'),
    (N'ESSC62', N'ASMET SALUD EPS S.A.S. -CM', 'C'),
    (N'ESSC76', N'ASOCIACIÓN MUTUAL BARRIOS UNIDOS DE QUIBDO AMBUQ EPS - S - ESS - CM', 'C'),
    (N'ESSC91', N'ECOOPSOS EPS SAS -CM', 'C'),
    (N'CCF007', N'CAJA DE COMPENSACIÓN FAMILIAR DE CARTAGENA Y BOLÍVAR COMFAMILIAR', 'S'),
    (N'CCF023', N'CAJA DE COMPENSACIÓN FAMILIAR DE LA GUAJIRA "COMFAGUAJIRA"', 'S'),
    (N'CCF024', N'CAJA DE COMPENSACIÓN FAMILIAR DEL HUILA "COMFAMILIAR"', 'S'),
    (N'CCF027', N'CAJA DE COMPENSACIÓN FAMILIAR DE NARIÑO', 'S'),
    (N'CCF033', N'CAJA DE COMPENSACIÓN FAMILIAR DE SUCRE', 'S'),
    (N'CCF050', N'CAJA DE COMPENSACIÓN FAMILIAR DEL ORIENTE COLOMBIANO "COMFAORIENTE"', 'S'),
    (N'CCF053', N'CAJA DE COMPENSACIÓN FAMILIAR DE CUNDINAMARCA "COMFACUNDI"', 'S'),
    (N'CCF055', N'CAJA DE COMPENSACIÓN FAMILIAR CAJACOPI ATLÁNTICO', 'S'),
    (N'CCF102', N'CAJA DE COMPENSACIÓN FAMILIAR DEL CHOCÓ', 'S'),
    (N'EPS022', N'ENTIDAD PROMOTORA DE SALUD DEL REGIMEN SUBSIDIADO EPS CONVIDA', 'S'),
    (N'EPS025', N'CAPRESOCA E.P.S.', 'S'),
    (N'EPSI01', N'ASOCIACIÓN DE CABILDOS INDÍGENAS DEL CESAR Y GUAJIRA "DUSAKAWI A.R.S.I."', 'S'),
    (N'EPSI03', N'ASOCIACIÓN INDÍGENA DEL CAUCA A.I.C. EPSI', 'S'),
    (N'EPSI04', N'EMPRESA PROMOTORA DE SALUD INDÍGENA ANAS WAYUU EPSI', 'S'),
    (N'EPSI05', N'ENTIDAD PROMOTORA DE SALUD MALLAMAS EPSI', 'S'),
    (N'EPSI06', N'PIJAOS SALUD EPSI', 'S'),
    (N'EPSS01', N'ALIANSALUD EPS S.A. -CM', 'S'),
    (N'EPSS02', N'SALUD TOTAL ENTIDAD PROMOTORA DE SALUD DEL REGIMEN CONTRIBUTIVO Y DEL REGIMEN SUBSIDIADO S.A. -CM', 'S'),
    (N'EPSS05', N'ENTIDAD PROMOTORA DE SALUD SANITAS S.A.S. -CM', 'S'),
    (N'EPSS08', N'CAJA DE COMPENSACIÓN FAMILIAR COMPENSAR -CM', 'S'),
    (N'EPSS10', N'EPS SURAMERICANA S.A. -CM', 'S'),
    (N'EPSS12', N'CAJA DE COMPENSACION FAMILIAR DEL VALLE DEL CAUCA "COMFENALCO VALLE DE LA GENTE" -CM', 'S'),
    (N'EPSS16', N'COOMEVA ENTIDAD PROMOTORA DE SALUD S.A. "COOMEVA E.P.S. S.A." -CM', 'S'),
    (N'EPSS17', N'EPS FAMISANAR S.A.S. -CM', 'S'),
    (N'EPSS18', N'ENTIDAD PROMOTORA DE SALUD SERVICIO OCCIDENTAL DE SALUD S.A. S.O.S. -CM', 'S'),
    (N'EPSS34', N'CAPITAL SALUD ENTIDAD PROMOTORA DE SALUD DEL RÉGIMEN SUBSIDIADO SAS "CAPITAL SALUD EPS-S S.A.S."', 'S'),
    (N'EPSS37', N'NUEVA EPS S.A. -CM', 'S'),
    (N'EPSS40', N'ALIANZA MEDELLIN ANTIOQUIA EPS S.A.S. "SAVIA SALUD EPS"', 'S'),
    (N'EPSS41', N'NUEVA EPS S.A.', 'S'),
    (N'EPSS42', N'COOSALUD EPS S.A. -CM', 'S'),
    (N'EPSS44', N'MEDIMAS EPS S.A.S. -CM', 'S'),
    (N'EPSS45', N'MEDIMAS EPS S.A.S.', 'S'),
    (N'EPSS46', N'FUDACIÓN SALUD MIA -CM', 'S'),
    (N'EPSS48', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS -CM', 'S'),
    (N'ESS024', N'COOSALUD EPS S.A.', 'S'),
    (N'ESS062', N'ASMET SALUD EPS S.A.S.', 'S'),
    (N'ESS076', N'ASOCIACIÓN MUTUAL BARRIOS UNIDOS DE QUIBDO AMBUQ EPS - S - ESS', 'S'),
    (N'ESS091', N'ECOOPSOS EPS SAS', 'S'),
    (N'ESS118', N'EMSSANAR S.A.S.', 'S'),
    (N'ESS133', N'COOPERATIVA DE SALUD COMUNITARIA EMPRESA PROMOTORA SUBSIDIADA "COMPARTA EPS-S"', 'S'),
    (N'ESS207', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS', 'S');

    INSERT INTO dbo.[Entidades sgsss 1888] (Codigo, Nombre, [Id Estado], [Id Regimen])
    SELECT s.Codigo, s.Nombre, 7, CASE s.Reg WHEN 'C' THEN @Contrib ELSE @Subsid END
    FROM @Sgsss s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Entidades sgsss 1888] e WHERE e.Codigo = s.Codigo);

    UPDATE e SET [Id Estado] = 7
    FROM dbo.[Entidades sgsss 1888] e
    INNER JOIN @Sgsss s ON s.Codigo = e.Codigo
    WHERE ISNULL(e.[Id Estado], 0) <> 7;

    DECLARE @TotalSgsss INT = (SELECT COUNT(*) FROM dbo.[Entidades sgsss 1888]);
    PRINT N'Entidades sgsss 1888: ' + CAST(@TotalSgsss AS NVARCHAR(10)) + N' filas.';
END
GO

/* ---- Parentesco familiar RDA 1888 (01-04) ---- */
IF OBJECT_ID(N'dbo.[Parentesco familiar RDA 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Par TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Par VALUES ('01', 'Padres'), ('02', 'Hermanos'), ('03', 'Tíos'), ('04', 'Abuelos');

    INSERT INTO dbo.[Parentesco familiar RDA 1888] (Codigo, Descripcion, [Id Estado])
    SELECT p.Codigo, p.Descripcion, 7 FROM @Par p
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Parentesco familiar RDA 1888] t WHERE t.Codigo = p.Codigo);

    UPDATE t SET Descripcion = p.Descripcion, [Id Estado] = 7
    FROM dbo.[Parentesco familiar RDA 1888] t INNER JOIN @Par p ON p.Codigo = t.Codigo;
END
GO

/* ---- Tipo de alergia 1888 (01-06) ---- */
IF OBJECT_ID(N'dbo.[Tipo de alergia 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Alg TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Alg VALUES
        ('01', 'Medicamento'),
        ('02', 'Alimento'),
        ('03', 'Sustancia del ambiente'),
        ('04', 'Sustancia que entran en contacto con la piel'),
        ('05', 'Picadura de insectos'),
        ('06', 'Otra');

    INSERT INTO dbo.[Tipo de alergia 1888] (Codigo, Descripcion, [Id Estado])
    SELECT a.Codigo, a.Descripcion, 7 FROM @Alg a
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Tipo de alergia 1888] t WHERE t.Codigo = a.Codigo);

    UPDATE t SET Descripcion = a.Descripcion, [Id Estado] = 7
    FROM dbo.[Tipo de alergia 1888] t INNER JOIN @Alg a ON a.Codigo = t.Codigo;
END
GO

/* ---- Otra tecnologia categoria 1888 (03-06) ---- */
IF OBJECT_ID(N'dbo.[Otra tecnologia categoria 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Otr TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Otr VALUES
        ('03', 'Dispositivo médico'),
        ('04', 'Producto biológico'),
        ('05', 'Nutricional'),
        ('06', 'Otro');

    INSERT INTO dbo.[Otra tecnologia categoria 1888] (Codigo, Descripcion, [Id Estado])
    SELECT o.Codigo, o.Descripcion, 7 FROM @Otr o
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Otra tecnologia categoria 1888] t WHERE t.Codigo = o.Codigo);

    UPDATE t SET Descripcion = o.Descripcion, [Id Estado] = 7
    FROM dbo.[Otra tecnologia categoria 1888] t INNER JOIN @Otr o ON o.Codigo = t.Codigo;
END
GO

/* ---- Alcance incapacidad 1888 (01-02) ---- */
IF OBJECT_ID(N'dbo.[Alcance incapacidad 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Alc TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Alc VALUES ('01', 'Nueva'), ('02', 'Prórroga');

    INSERT INTO dbo.[Alcance incapacidad 1888] (Codigo, Descripcion, [Id Estado])
    SELECT a.Codigo, a.Descripcion, 7 FROM @Alc a
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Alcance incapacidad 1888] t WHERE t.Codigo = a.Codigo);

    UPDATE t SET Descripcion = a.Descripcion, [Id Estado] = 7
    FROM dbo.[Alcance incapacidad 1888] t INNER JOIN @Alc a ON a.Codigo = t.Codigo;
END
GO

PRINT N'Verificar: SELECT COUNT(*) FROM dbo.[Cnsta Entidad SSGSSS 1888];  -- 84';
PRINT N'Verificar: SELECT * FROM dbo.[Cnsta Parentesco familiar RDA 1888]; -- 4';
GO

/*
  Seed idempotente de catálogos RDA que el instalador creaba vacíos:
    - Egreso y Remision 1888           (Condición y destino del usuario al egreso, 01-08)
    - Finalidad tecnologia salud 1888  (Finalidad tec. salud en medicamentos / procedimientos, 11-44)
  Solo inserta los Códigos que falten y reactiva Id Estado = 7. No borra nada.
*/
SET NOCOUNT ON;
GO

/* ---- Egreso y Remision 1888 (01-08) ---- */
IF OBJECT_ID(N'dbo.[Egreso y Remision 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Egr TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Egr VALUES
        ('01', 'PACIENTE CON DESTINO A SU DOMICILIO'),
        ('02', 'PACIENTE MUERTO'),
        ('03', 'PACIENTE DERIVADO A OTRO SERVICIO'),
        ('04', 'REFERIDO A OTRA INSTITUCION'),
        ('05', 'CONTRAREFERIDO A OTRA INSTITUCION'),
        ('06', 'DERIVADO O REFERIDO A HOSPITALIZACION DOMICILIARIA'),
        ('07', 'DERIVADO A SERVICIO SOCIAL'),
        ('08', 'PACIENTE CONTINUA EN EL SERVICIO (CORTE FACTURACION)');

    INSERT INTO dbo.[Egreso y Remision 1888] (Codigo, Descripcion, [Id Estado])
    SELECT g.Codigo, g.Descripcion, 7 FROM @Egr g
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Egreso y Remision 1888] t WHERE t.Codigo = g.Codigo);

    UPDATE t SET Descripcion = g.Descripcion, [Id Estado] = 7
    FROM dbo.[Egreso y Remision 1888] t INNER JOIN @Egr g ON g.Codigo = t.Codigo;
END
GO

/* ---- Finalidad tecnologia salud 1888 (11-44) ---- */
IF OBJECT_ID(N'dbo.[Finalidad tecnologia salud 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Fin TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Fin VALUES
        ('11', 'VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO'),
        ('12', 'DETECCION TEMPRANA DE ENFERMEDAD GENERAL'),
        ('13', 'DETECCION TEMPRANA DE ENFERMEDAD LABORAL'),
        ('14', 'PROTECCION ESPECIFICA'),
        ('15', 'DIAGNOSTICO'),
        ('16', 'TRATAMIENTO'),
        ('17', 'REHABILITACION'),
        ('18', 'PALIACION'),
        ('19', 'PLANIFICACION FAMILIAR Y ANTICONCEPCION'),
        ('20', 'PROMOCION Y APOYO A LA LACTANCIA MATERNA'),
        ('21', 'ATENCION BASICA DE ORIENTACION FAMILIAR'),
        ('22', 'ATENCION PARA EL CUIDADO PRECONCEPCIONAL'),
        ('23', 'ATENCION PARA EL CUIDADO PRENATAL'),
        ('24', 'INTERRUPCION VOLUNTARIA DEL EMBARAZO'),
        ('25', 'ATENCION DEL PARTO Y PUERPERIO'),
        ('26', 'ATENCION PARA EL CUIDADO DEL RECIEN NACIDO'),
        ('27', 'ATENCION PARA EL SEGUIMIENTO DEL RECIEN NACIDO'),
        ('28', 'PREPARACION PARA LA MATERNIDAD Y LA PATERNIDAD'),
        ('29', 'PROMOCION DE ACTIVIDAD FISICA'),
        ('30', 'PROMOCION DE LA CESACION DEL TABAQUISMO'),
        ('31', 'PREVENCION DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS'),
        ('32', 'PROMOCION DE LA ALIMENTACION SALUDABLE'),
        ('33', 'PROMOCION PARA EL EJERCICIO DE LOS DERECHOS SEXUALES Y DERECHOS REPRODUCTIVOS'),
        ('34', 'PROMOCION PARA EL DESARROLLO DE HABILIDADES PARA LA VIDA'),
        ('35', 'PROMOCION PARA LA CONSTRUCCION DE ESTRATEGIAS DE AFRONTAMIENTO FRENTE A  SUCESOS VITALES'),
        ('36', 'PROMOCION DE LA SANA CONVIVENCIA Y EL TEJIDO  SOCIAL'),
        ('37', 'PROMOCION DE UN AMBIENTE SEGURO Y DE CUIDADO Y PROTECCION DEL AMBIENTE'),
        ('38', 'PROMOCION DEL EMPODERAMIENTO PARA EL EJERCICIO DEL DERECHO A LA SALUD'),
        ('39', 'PROMOCION PARA LA ADOPCION DE PRACTICAS DE CRIANZA Y CUIDADO PARA LA SALUD'),
        ('40', 'PROMOCION DE LA CAPACIDAD DE LA AGENCIA Y CUIDADO DE LA SALUD'),
        ('41', 'DESARROLLO DE HABILIDADES COGNITIVAS'),
        ('42', 'INTERVENCION COLECTIVA'),
        ('43', 'MODIFICACION DE LA ESTETICA CORPORAL FINES ESTETICOS'),
        ('44', 'OTRA');

    INSERT INTO dbo.[Finalidad tecnologia salud 1888] (Codigo, Nombre, Descripcion, [Id Estado])
    SELECT f.Codigo, f.Descripcion, f.Descripcion, 7 FROM @Fin f
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Finalidad tecnologia salud 1888] t WHERE t.Codigo = f.Codigo);

    UPDATE t SET Nombre = f.Descripcion, Descripcion = f.Descripcion, [Id Estado] = 7
    FROM dbo.[Finalidad tecnologia salud 1888] t INNER JOIN @Fin f ON f.Codigo = t.Codigo;
END
GO

PRINT N'Verificar: SELECT * FROM dbo.[Cnsta Egreso y Remision 1888];          -- 8';
PRINT N'Verificar: SELECT * FROM dbo.[Cnsta Finalidad tecnologia salud 1888]; -- 34';
GO

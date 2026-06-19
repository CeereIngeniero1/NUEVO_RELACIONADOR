

UPDATE [dbo].[Tipo de Documento]
SET [Código Tipo de Documento] = CASE [Tipo de Documento]
    WHEN 'CC' THEN 'CC'
    WHEN 'CE' THEN 'CE'
    WHEN 'PA' THEN 'PA'
    WHEN 'RC' THEN 'RC'
    WHEN 'TI' THEN 'TI'
    WHEN 'AS' THEN 'AS'
    WHEN 'MS' THEN 'MS'
    WHEN 'UN' THEN 'UN'
    WHEN 'NI' THEN 'NI'
    WHEN 'NH' THEN 'NH'
END
WHERE [Tipo de Documento] IS NOT NULL;



UPDATE [dbo].[Tipo de alergia 1888]
SET Descripcion = CASE Codigo
    
    WHEN '04' THEN 'Sustancia que entran en contacto con la piel'
END
WHERE Codigo IN ('04');



UPDATE [dbo].[Entorno de atencion 1888]
SET Descripcion = CASE Codigo
    WHEN '01' THEN 'Hogar'
    WHEN '02' THEN 'Comunitario'
    WHEN '03' THEN 'Escolar'
    WHEN '04' THEN 'Laboral'
    WHEN '05' THEN 'Institucional'
END
WHERE Codigo IN ('01','02','03','04','05');


-- Alcance incapacidad: CodeSystem ColombianLicenseScope (MinSalud)
UPDATE [dbo].[Alcance incapacidad 1888]
SET Descripcion = CASE Codigo
    WHEN '01' THEN 'Nueva'
    WHEN '02' THEN 'Prórroga'
END
WHERE Codigo IN ('01', '02');

UPDATE [dbo].[Alcance incapacidad 1888]
SET [Id Estado] = 8
WHERE Codigo NOT IN ('01', '02');



UPDATE  [Factor De Riesgo 1888] SET
 Descripcion = CASE Codigo
  
WHEN '01'THEN 'Químicos'
WHEN '02'THEN 'Físicos'
WHEN '03'THEN 'Biomecánicos'
WHEN '04'THEN 'Psicosociales'
WHEN '05'THEN 'Biológicos'
WHEN '06'THEN 'Otro'
END
WHERE Codigo IN ('01','02','03','04','05', '06')




ALTER TABLE [dbo].[Egreso y Remision 1888]
ALTER COLUMN [Descripcion] VARCHAR(200) NULL;


UPDATE [dbo].[Egreso y Remision 1888]
SET Descripcion = CASE Codigo
    WHEN '01' THEN 'PACIENTE CON DESTINO A SU DOMICILIO'
    WHEN '02' THEN 'PACIENTE MUERTO'
    WHEN '03' THEN 'PACIENTE DERIVADO A OTRO SERVICIO'
    WHEN '04' THEN 'REFERIDO A OTRA INSTITUCION'
    WHEN '05' THEN 'CONTRAREFERIDO A OTRA INSTITUCION'
    WHEN '06' THEN 'DERIVADO O REFERIDO A HOSPITALIZACION DOMICILIARIA'
    WHEN '07' THEN 'DERIVADO A SERVICIO SOCIAL'
    WHEN '08' THEN 'PACIENTE CONTINUA EN EL SERVICIO (CORTE FACTURACION)'
END
WHERE Codigo IN ('01','02','03','04','05','06','07','08');

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[Egreso y Remision 1888] WHERE Codigo = '08'
)
INSERT INTO [dbo].[Egreso y Remision 1888] (Codigo, Descripcion, [Id Estado])
VALUES ('08', 'PACIENTE CONTINUA EN EL SERVICIO (CORTE FACTURACION)', 7);

DELETE FROM [dbo].[Tipo de tecnología en salud 1888]
WHERE Codigo IN ('01','M','P');

ALTER TABLE [dbo].[Unidad medida dosis 1888]
ADD Nombre VARCHAR(100) NULL;

--OJO SOLO SI ESTAN LOS INCORRECTOS SI ESTAN LOS 273 NO SE NECESITA ELIMINAR
-- DELETE FROM [dbo].[Unidad medida dosis 1888]

IF COL_LENGTH(N'[dbo].[Via administracion medicamento 1888]', N'Nombre') IS NULL
BEGIN
    ALTER TABLE [dbo].[Via administracion medicamento 1888]
    ADD [Nombre] VARCHAR(150) NULL;
END
GO




delete from [dbo].[Unidad tiempo frecuencia 1888]

IF COL_LENGTH(N'[dbo].[Finalidad tecnologia salud 1888]', N'Nombre') IS NULL
BEGIN
    ALTER TABLE [dbo].[Finalidad tecnologia salud 1888]
    ADD [Nombre] VARCHAR(250) NULL;
END
GO
delete from  [Finalidad tecnologia salud 1888]


IF OBJECT_ID(N'[dbo].[Finalidad tecnologia salud 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @FinalidadTecnologiaSalud1888 TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Nombre VARCHAR(250) NULL, Descripcion VARCHAR(250) NOT NULL, IdEstado INT NOT NULL);

    INSERT INTO @FinalidadTecnologiaSalud1888 (Codigo, Nombre, Descripcion, IdEstado)
    VALUES
        ('11', 'VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', 'VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', 7),
        ('12', 'DETECCION TEMPRANA DE ENFERMEDAD GENERAL', 'DETECCION TEMPRANA DE ENFERMEDAD GENERAL', 7),
        ('13', 'DETECCION TEMPRANA DE ENFERMEDAD LABORAL', 'DETECCION TEMPRANA DE ENFERMEDAD LABORAL', 7),
        ('14', 'PROTECCION ESPECIFICA', 'PROTECCION ESPECIFICA', 7),
        ('15', 'DIAGNOSTICO', 'DIAGNOSTICO', 7),
        ('16', 'TRATAMIENTO', 'TRATAMIENTO', 7),
        ('17', 'REHABILITACION', 'REHABILITACION', 7),
        ('18', 'PALIACION', 'PALIACION', 7),
        ('19', 'PLANIFICACION FAMILIAR Y ANTICONCEPCION', 'PLANIFICACION FAMILIAR Y ANTICONCEPCION', 7),
        ('20', 'PROMOCION Y APOYO A LA LACTANCIA MATERNA', 'PROMOCION Y APOYO A LA LACTANCIA MATERNA', 7),
        ('21', 'ATENCION BASICA DE ORIENTACION FAMILIAR', 'ATENCION BASICA DE ORIENTACION FAMILIAR', 7),
        ('22', 'ATENCION PARA EL CUIDADO PRECONCEPCIONAL', 'ATENCION PARA EL CUIDADO PRECONCEPCIONAL', 7),
        ('23', 'ATENCION PARA EL CUIDADO PRENATAL', 'ATENCION PARA EL CUIDADO PRENATAL', 7),
        ('24', 'INTERRUPCION VOLUNTARIA DEL EMBARAZO', 'INTERRUPCION VOLUNTARIA DEL EMBARAZO', 7),
        ('25', 'ATENCION DEL PARTO Y PUERPERIO', 'ATENCION DEL PARTO Y PUERPERIO', 7),
        ('26', 'ATENCION PARA EL CUIDADO DEL RECIEN NACIDO', 'ATENCION PARA EL CUIDADO DEL RECIEN NACIDO', 7),
        ('27', 'ATENCION PARA EL SEGUIMIENTO DEL RECIEN NACIDO', 'ATENCION PARA EL SEGUIMIENTO DEL RECIEN NACIDO', 7),
        ('28', 'PREPARACION PARA LA MATERNIDAD Y LA PATERNIDAD', 'PREPARACION PARA LA MATERNIDAD Y LA PATERNIDAD', 7),
        ('29', 'PROMOCION DE ACTIVIDAD FISICA', 'PROMOCION DE ACTIVIDAD FISICA', 7),
        ('30', 'PROMOCION DE LA CESACION DEL TABAQUISMO', 'PROMOCION DE LA CESACION DEL TABAQUISMO', 7),
        ('31', 'PREVENCION DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS', 'PREVENCION DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS', 7),
        ('32', 'PROMOCION DE LA ALIMENTACION SALUDABLE', 'PROMOCION DE LA ALIMENTACION SALUDABLE', 7),
        ('33', 'PROMOCION PARA EL EJERCICIO DE LOS DERECHOS SEXUALES Y DERECHOS REPRODUCTIVOS', 'PROMOCION PARA EL EJERCICIO DE LOS DERECHOS SEXUALES Y DERECHOS REPRODUCTIVOS', 7),
        ('34', 'PROMOCION PARA EL DESARROLLO DE HABILIDADES PARA LA VIDA', 'PROMOCION PARA EL DESARROLLO DE HABILIDADES PARA LA VIDA', 7),
        ('35', 'PROMOCION PARA LA CONSTRUCCION DE ESTRATEGIAS DE AFRONTAMIENTO FRENTE A  SUCESOS VITALES', 'PROMOCION PARA LA CONSTRUCCION DE ESTRATEGIAS DE AFRONTAMIENTO FRENTE A  SUCESOS VITALES', 7),
        ('36', 'PROMOCION DE LA SANA CONVIVENCIA Y EL TEJIDO  SOCIAL', 'PROMOCION DE LA SANA CONVIVENCIA Y EL TEJIDO  SOCIAL', 7),
        ('37', 'PROMOCION DE UN AMBIENTE SEGURO Y DE CUIDADO Y PROTECCION DEL AMBIENTE', 'PROMOCION DE UN AMBIENTE SEGURO Y DE CUIDADO Y PROTECCION DEL AMBIENTE', 7),
        ('38', 'PROMOCION DEL EMPODERAMIENTO PARA EL EJERCICIO DEL DERECHO A LA SALUD', 'PROMOCION DEL EMPODERAMIENTO PARA EL EJERCICIO DEL DERECHO A LA SALUD', 7),
        ('39', 'PROMOCION PARA LA ADOPCION DE PRACTICAS DE CRIANZA Y CUIDADO PARA LA SALUD', 'PROMOCION PARA LA ADOPCION DE PRACTICAS DE CRIANZA Y CUIDADO PARA LA SALUD', 7),
        ('40', 'PROMOCION DE LA CAPACIDAD DE LA AGENCIA Y CUIDADO DE LA SALUD', 'PROMOCION DE LA CAPACIDAD DE LA AGENCIA Y CUIDADO DE LA SALUD', 7),
        ('41', 'DESARROLLO DE HABILIDADES COGNITIVAS', 'DESARROLLO DE HABILIDADES COGNITIVAS', 7),
        ('42', 'INTERVENCION COLECTIVA', 'INTERVENCION COLECTIVA', 7),
        ('43', 'MODIFICACION DE LA ESTETICA CORPORAL FINES ESTETICOS', 'MODIFICACION DE LA ESTETICA CORPORAL FINES ESTETICOS', 7),
        ('44', 'OTRA', 'OTRA', 7);

    MERGE [dbo].[Finalidad tecnologia salud 1888] AS tgt
    USING @FinalidadTecnologiaSalud1888 AS src
      ON tgt.Codigo = src.Codigo
    WHEN MATCHED THEN
        UPDATE SET
            tgt.Nombre = src.Nombre,
            tgt.Descripcion = src.Descripcion,
            tgt.[Id Estado] = src.IdEstado
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (Codigo, Nombre, Descripcion, [Id Estado])
        VALUES (src.Codigo, src.Nombre, src.Descripcion, src.IdEstado);
END
GO


delete from [Unidad tiempo duracion 1888]

IF NOT EXISTS (SELECT 1 FROM [dbo].[Unidad tiempo duracion 1888])
INSERT INTO [dbo].[Unidad tiempo duracion 1888] (Codigo, Descripcion, [Id Estado])
VALUES
('1', 'Minutos', 7),
('2', 'Horas', 7),
('3', 'Día', 7),
('4', 'Semanas', 7),
('5', 'Mes', 7),
('6', 'Año', 7),
('7', 'Según respuesta al tratamiento', 7);
GO

-- Garantiza creación automática en Entidad1888 cuando nace una Entidad nueva
-- o cuando se actualiza/corrige el documento en Entidad.
CREATE OR ALTER TRIGGER [dbo].[trg_Entidad_AfterInsert_EnsureEntidad1888]
ON [dbo].[Entidad]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[Entidad1888] ([Documento Entidad])
    SELECT LTRIM(RTRIM(i.[Documento Entidad]))
    FROM inserted i
    WHERE i.[Documento Entidad] IS NOT NULL
      AND LTRIM(RTRIM(i.[Documento Entidad])) <> ''
      AND NOT EXISTS (
          SELECT 1
          FROM [dbo].[Entidad1888] e
          WHERE LTRIM(RTRIM(e.[Documento Entidad])) = LTRIM(RTRIM(i.[Documento Entidad]))
      );
END;
GO

-- Evitar solapamiento con triggers legacy que pueden duplicar inserciones
IF OBJECT_ID(N'[dbo].[TR_Entidad_Insert]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TR_Entidad_Insert];
GO

/* ============================================================================
   TRAZABILIDAD JSON ENVIADO A IHCE (RDA Paciente / CE)
   ============================================================================ */
IF OBJECT_ID(N'[dbo].[RDA IHCE Trazabilidad]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[RDA IHCE Trazabilidad]
    (
        [Id Trazabilidad IHCE] INT IDENTITY(1,1) PRIMARY KEY,
        [Tipo RDA] VARCHAR(20) NOT NULL, -- paciente | ce
        [Id Evaluacion Entidad RDA] INT NULL,
        [Id Evaluacion Entidad RDA Consulta Externa] INT NULL,
        [Ambiente] VARCHAR(20) NULL, -- sandbox | prod
        [URL Envio IHCE] NVARCHAR(500) NULL,
        [JSON Enviado] NVARCHAR(MAX) NULL,
        [Hash SHA256 JSON Enviado] CHAR(64) NULL,
        [HTTP Status Respuesta] INT NULL,
        [JSON Respuesta] NVARCHAR(MAX) NULL,
        [Exitoso] BIT NOT NULL CONSTRAINT [DF_RDA_IHCE_Trazabilidad_Exitoso] DEFAULT (0),
        [Error] NVARCHAR(1000) NULL,
        [Fecha Creacion] DATETIME2(0) NOT NULL CONSTRAINT [DF_RDA_IHCE_Trazabilidad_Fecha] DEFAULT (SYSDATETIME())
    );

    CREATE INDEX [IX_RDA_IHCE_Trazabilidad_Tipo_Fecha]
        ON [dbo].[RDA IHCE Trazabilidad]([Tipo RDA], [Fecha Creacion] DESC);

    CREATE INDEX [IX_RDA_IHCE_Trazabilidad_IdRDA]
        ON [dbo].[RDA IHCE Trazabilidad]([Id Evaluacion Entidad RDA], [Id Evaluacion Entidad RDA Consulta Externa]);
END
GO

IF OBJECT_ID(N'[dbo].[TR_Entidad_Update_Doc]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TR_Entidad_Update_Doc];
GO



IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA]', N'U') IS NOT NULL
BEGIN
    DECLARE @dfIdentidadGenero SYSNAME;
    SELECT @dfIdentidadGenero = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON c.object_id = dc.parent_object_id
       AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA]', N'U')
      AND c.name = N'Id Identidad Genero';

    IF @dfIdentidadGenero IS NOT NULL
    BEGIN
        EXEC(N'ALTER TABLE [dbo].[Evaluacion Entidad RDA] DROP CONSTRAINT [' + @dfIdentidadGenero + N']');
    END

    ALTER TABLE [dbo].[Evaluacion Entidad RDA]
    ALTER COLUMN [Id Identidad Genero] INT NULL;
END
GO






-- CREACION DEL PROCEDIMIENTO ALMACENADO PARA GUARDAR LOS DATOS DEL PACIENTE EN LA ENTIDAD1888
-- Aun no esta temrinado se debe modular y se debe hacer un update  por cada dato nuevo ingresado la idea es solo un pa que sea secuencial y que vaya actualizando cada campo nuevo ingresado en la entidad1888

CREATE OR ALTER PROCEDURE  sp_Paciente_Guardar
	@IdTipoDocumento INT, -- Entidad
	@Documento NVARCHAR(50) = NULL,
	@PrimerApellido NVARCHAR(50) = NULL,	-- Entidad
	@SegundoApellido NVARCHAR(50) = NULL,	-- Entidad
	@PrimerNombre NVARCHAR(50) = NULL,	-- Entidad
	@SegundoNombre NVARCHAR(50) = NULL,	-- Entidad 
	@FechaNacimiento DateTime,	-- EntidadIII
	@Edad NVARCHAR(50) = NULL,	-- EntidadIII
	@SexoBio INT,	-- EntidadIII
	@SexoIdenti INT,	-- Entidad1888
	@IdNacionalidad INT, -- Entidad1888
	@Talla NVARCHAR(50) = NULL,	-- Entidad1888
	@Peso NVARCHAR(50) = NULL,	-- Entidad1888
	@IdResidencia INT,	-- Entidad1888
	@IdMunicipio INT,	-- Entidad1888
	@IdZonaTerritorial INT,	-- EntidadIII
	@Direccion NVARCHAR(50) = NULL,	-- EntidadII
	@IdEtnia INT,	-- Entidad1888
	@ComunidadEtnica NVARCHAR(50) = NULL,	-- Entidad1888
	@IdDiscapacidad INT,	-- Entidad1888
	@Telefono NVARCHAR(50) = NULL,	-- EntidadII
	@IdOcupacion INT,	-- EntidadVI
	@Alergias NVARCHAR(90) = NULL,	-- Entidad1888
	@Alergeno NVARCHAR(200) = NULL	-- Entidad1888


AS
BEGIN
    SET NOCOUNT ON;

    -- Validación mínima
    IF ISNULL(LTRIM(RTRIM(@Documento)), '') = ''
    BEGIN
        RAISERROR('El parámetro @Documento es obligatorio.', 16, 1);
        RETURN;
    END;

    -------------------------------------------------------------------
    -- Tabla de resultados por bloque
    -------------------------------------------------------------------
    DECLARE @Resultado TABLE
    (
        Paso NVARCHAR(50),
        Estado NVARCHAR(20),
        Mensaje NVARCHAR(4000),
        FilasAfectadas INT
    );

    -------------------------------------------------------------------
    -- 1. UPDATE ENTIDAD
    -------------------------------------------------------------------
    BEGIN TRY
        UPDATE E
           SET E.[Id Tipo de Documento] = ISNULL(@IdTipoDocumento, E.[Id Tipo de Documento]),
               E.[Primer Apellido Entidad] = @PrimerApellido,
               E.[Segundo Apellido Entidad] = @SegundoApellido,
               E.[Primer Nombre Entidad] = @PrimerNombre,
               E.[Segundo Nombre Entidad] = @SegundoNombre
        FROM Entidad E
        WHERE E.[Documento Entidad] = @Documento;

        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('Entidad', 'OK', 'Actualización correcta', @@ROWCOUNT);
    END TRY
    BEGIN CATCH
        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('Entidad', 'ERROR', ERROR_MESSAGE(), 0);
    END CATCH;

    -------------------------------------------------------------------
    -- 2. UPDATE ENTIDADII
    -------------------------------------------------------------------
    BEGIN TRY
        UPDATE E2
           SET E2.[Dirección EntidadII] = @Direccion,
               E2.[Teléfono Celular EntidadII] = @Telefono
        FROM EntidadII E2
        WHERE E2.[Documento Entidad] = @Documento;

        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('EntidadII', 'OK', 'Actualización correcta', @@ROWCOUNT);
    END TRY
    BEGIN CATCH
        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('EntidadII', 'ERROR', ERROR_MESSAGE(), 0);
    END CATCH;

    -------------------------------------------------------------------
    -- 3. UPDATE ENTIDADIII
    -------------------------------------------------------------------
    BEGIN TRY
        UPDATE E3
           SET E3.[Fecha Nacimiento EntidadIII] = @FechaNacimiento,
               E3.[Edad EntidadIII] = @Edad,
               E3.[Id Sexo] = @SexoBio,
               E3.[Id Zona Residencia] = @IdZonaTerritorial
        FROM EntidadIII E3
        WHERE E3.[Documento Entidad] = @Documento;

        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('EntidadIII', 'OK', 'Actualización correcta', @@ROWCOUNT);
    END TRY
    BEGIN CATCH
        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('EntidadIII', 'ERROR', ERROR_MESSAGE(), 0);
    END CATCH;

    -------------------------------------------------------------------
    -- 4. UPDATE ENTIDAD1888
    -------------------------------------------------------------------
    BEGIN TRY
        UPDATE E1888
           SET E1888.[Id Identidad Genero] = @SexoIdenti,
               E1888.[Id Pais Nacionalidad] = @IdNacionalidad,
               E1888.[Talla] = @Talla,
               E1888.[Peso] = @Peso,
               E1888.[Id Pais Recidencia] = @IdResidencia,
               E1888.[Id Municipio Recidencia] = @IdMunicipio,
               E1888.[Id Etnia] = @IdEtnia,
               E1888.[Comunidad Etnica] = @ComunidadEtnica,
               E1888.[Id Discapacidad] = @IdDiscapacidad,
               E1888.[Alergias] = @Alergias,
               E1888.[Alergeno] = @Alergeno
        FROM Entidad1888 E1888
        WHERE E1888.[Documento Entidad] = @Documento;

        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('Entidad1888', 'OK', 'Actualización correcta', @@ROWCOUNT);
    END TRY
    BEGIN CATCH
        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('Entidad1888', 'ERROR', ERROR_MESSAGE(), 0);
    END CATCH;

    -------------------------------------------------------------------
    -- 5. UPDATE ENTIDADVI
    -------------------------------------------------------------------
    BEGIN TRY
        UPDATE E6
           SET E6.[Id Ocupación] = ISNULL(@IdOcupacion, E6.[Id Ocupación])
        FROM EntidadVI E6
        WHERE E6.[Documento Entidad] = @Documento;

        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('EntidadVI', 'OK', 'Actualización correcta', @@ROWCOUNT);
    END TRY
    BEGIN CATCH
        INSERT INTO @Resultado (Paso, Estado, Mensaje, FilasAfectadas)
        VALUES ('EntidadVI', 'ERROR', ERROR_MESSAGE(), 0);
    END CATCH;

    -------------------------------------------------------------------
    -- Resumen final
    -------------------------------------------------------------------
    SELECT 
        Paso,
        Estado,
        Mensaje,
        FilasAfectadas
    FROM @Resultado;
END;
GO



-- Garantiza creación automática en Entidad1888 cuando nace una Entidad nueva
-- o cuando se actualiza/corrige el documento en Entidad.
CREATE OR ALTER TRIGGER [dbo].[trg_Entidad_AfterInsert_EnsureEntidad1888]
ON [dbo].[Entidad]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[Entidad1888] ([Documento Entidad])
    SELECT LTRIM(RTRIM(i.[Documento Entidad]))
    FROM inserted i
    WHERE i.[Documento Entidad] IS NOT NULL
      AND LTRIM(RTRIM(i.[Documento Entidad])) <> ''
      AND NOT EXISTS (
          SELECT 1
          FROM [dbo].[Entidad1888] e
          WHERE LTRIM(RTRIM(e.[Documento Entidad])) = LTRIM(RTRIM(i.[Documento Entidad]))
      );
END;
GO

-- Evitar solapamiento con triggers legacy que pueden duplicar inserciones
IF OBJECT_ID(N'[dbo].[TR_Entidad_Insert]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TR_Entidad_Insert];
GO

IF OBJECT_ID(N'[dbo].[TR_Entidad_Update_Doc]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TR_Entidad_Update_Doc];
GO





ALTER VIEW [dbo].[Cnsta Relacionador Usuarios Info]
AS

SELECT
    e.[Id Tipo de Documento] AS IdTipodeDocumento,
    td.[Descripción Tipo de Documento] AS DescripciTipoDocumento,
    td.[Tipo de Documento] AS TipoDocumentoBase,
    e.[Documento Entidad] AS DocumentoPaciente,
    e.[Primer Apellido Entidad] AS PrimerApellidoBase,
    e.[Segundo Apellido Entidad] AS SegundoApellidoBase,
    e.[Primer Nombre Entidad] AS PrimerNombreBase,
    e.[Segundo Nombre Entidad] AS SegundoNombreBase,
    e.[Nombre Completo Entidad] AS NombreCompletoPaciente,
    sx.[Sexo] AS SexoPaciente,
    sx.[Código Sexo] as CódigoSexo,
   
    sx.[Descripción Sexo] AS Sexo,
    sx.[Id Sexo] AS IdSexo,
    e3.[Edad EntidadIII] AS Edad,
    e2.[Dirección EntidadII] AS Direccion,
    e2.[Teléfono Celular EntidadII] AS Tel,
    ISNULL(td.[Tipo de Documento], '') + N' ' + e.[Documento Entidad] AS DocumentoTipoDOC,
    e3.[Fecha Nacimiento EntidadIII] AS FechaNacimientoBase,
    e3.[Id Sexo],
    e1888.[Id Identidad Genero],
    sig.[Id Sexo Identidad Genero] AS IdSexoIdentidadGenero,
    sig.[Codigo] AS codigoIdentidadGeneroBase,
    sig.[Identidad Genero] AS IdentidadGeneroBase,
    e3.[Id Zona Residencia],
    
    e1888.[Talla],
    e1888.[Peso],
    e1888.[Id Etnia],
    e1888.[Comunidad Etnica] AS ComunidadEtnica,
    e1888.[Id Discapacidad],
    pn.[Id Pais1888] AS IdPaisNacionalidad,
    pn.[Codigo] AS CodigoPaisNacionalidad,
    pn.[Nombre] AS NombrePaisNACIONALIDAD,
    pr.[Id Pais1888] AS IdPaisRecidencia,
    pr.[Codigo] AS CodigoPaisRecidencia,
    pr.[Nombre] AS NombrePaisRecidencia,
    cr.[Id Ciudad1888] AS IdMunicipioRecidencia,
    cr.[Codigo] AS CodigoMunicipioRecidencia,
    cr.[Nombre] AS NombreMunicipioRecidencia,
    zr.[Id Zona Residencia] AS IdZonaResidencia,
    zr.[Descripción Zona Residencia] AS DescripciónZonaResidencia,
    zr.[Código Zona Residencia] AS CódigoZonaResidencia,
    zr.[Zona Residencia] AS ZonaResidencia,
    et.[Id Etnia] AS IdEtnia,
    et.[Código Etnia] AS CódigoEtnia,
    et.[Etnia] AS Etnia,
    et.[Descripción Etnia] AS DescripciónEtnia,
    d.[Id Discapacidad] AS IdDiscapacidad,
    d.[Codigo] AS Codigo,
    d.[Discapacidad] AS Discapacidad,
    d.[Descripcion Discapacidad] AS DescripcionDiscapacidad,
    o.[Id Ocupación] AS IdOcupación,
    o.[Código Ocupación] AS CódigoOcupación,
    o.[Ocupación] AS Ocupación,
    o.[Descripción Ocupación] AS DescripciónOcupación,
    e1888.[Alergias] AS Alergias,
    e1888.[Alergeno] AS Alergeno,
    ec.[Estado Civil] AS EstadoCivil,
    respon.[Nombre Completo Entidad] AS NombreResponsable,
    ParRespo.Parentesco AS ParentescoResponsable
FROM dbo.Entidad e
LEFT JOIN dbo.[Tipo de Documento] td
    ON td.[Id Tipo de Documento] = e.[Id Tipo de Documento]
LEFT JOIN dbo.EntidadII e2
    ON e2.[Documento Entidad] = e.[Documento Entidad]
LEFT JOIN dbo.EntidadIII e3
    ON e3.[Documento Entidad] = e.[Documento Entidad]
LEFT JOIN dbo.Sexo sx
    ON sx.[Id Sexo] = e3.[Id Sexo]
LEFT JOIN dbo.Entidad1888 e1888
    ON LTRIM(RTRIM(e1888.[Documento Entidad])) = LTRIM(RTRIM(e.[Documento Entidad]))
LEFT JOIN dbo.[Sexo Identidad Genero] sig
    ON sig.[Id Sexo Identidad Genero] = e1888.[Id Identidad Genero]
LEFT JOIN dbo.País1888 pn
    ON pn.[Id Pais1888] = e1888.[Id Pais Nacionalidad]
LEFT JOIN dbo.País1888 pr
    ON pr.[Id Pais1888] = e1888.[Id Pais Recidencia]
LEFT JOIN dbo.Ciudad1888 cr
    ON cr.[Id Ciudad1888] = e1888.[Id Municipio Recidencia]
-- EntidadIII.[Id Zona Residencia] guarda el código RIPS (1→01 Urbana, 2→02 Rural), no el PK [Id Zona Residencia] del catálogo.



LEFT JOIN dbo.[Zona Residencia] zr
    ON e3.[Id Zona Residencia] = zr.[Id Zona Residencia]



LEFT JOIN dbo.Etnia et
    ON et.[Id Etnia] = e1888.[Id Etnia]
LEFT JOIN dbo.Discapacidad d
    ON d.[Id Discapacidad] = e1888.[Id Discapacidad]
LEFT JOIN dbo.EntidadVI e6
    ON e6.[Documento Entidad] = e.[Documento Entidad]
LEFT JOIN dbo.Ocupación o
    ON o.[Id Ocupación] = e6.[Id Ocupación]
LEFT JOIN dbo.[Estado Civil] EC 
    ON EC.[Id Estado Civil] = E3.[Id Estado Civil]
LEFT JOIN Entidad Respon 
    ON respon.[Documento Entidad] = e3.[Documento Responsable]
LEFT JOIN dbo.Parentesco ParRespo 
    ON ParRespo.[Id Parentesco] = E3.[Id Parentesco]
GO



-- aca porfa 

/* ==========================================================================================================
   CATÁLOGOS RDA FHIR — fuente de verdad en BD (MedicationTime, UMM, VAD, ColombianTechModality)
   ========================================================================================================== */

-- 1) MedicationTime (MinSalud + equivalencia FHIR durationUnit)
IF OBJECT_ID('dbo.RDA_MedicationTime', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RDA_MedicationTime (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        codigo VARCHAR(10) NOT NULL,
        display NVARCHAR(150) NOT NULL,
        system_url NVARCHAR(300) NOT NULL,
        fhir_duration_unit VARCHAR(10) NULL,
        id_estado INT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_RDA_MedicationTime_codigo_system UNIQUE (codigo, system_url)
    );
END
GO

IF COL_LENGTH('dbo.RDA_MedicationTime', 'fhir_duration_unit') IS NULL
    ALTER TABLE dbo.RDA_MedicationTime ADD fhir_duration_unit VARCHAR(10) NULL;
GO

MERGE dbo.RDA_MedicationTime AS target
USING (
    SELECT '1' AS codigo, N'Minutos' AS display, N'https://fhir.minsalud.gov.co/rda/CodeSystem/MedicationTime' AS system_url, 'min' AS fhir_duration_unit, 7 AS id_estado
    UNION ALL SELECT '2', N'Horas', N'https://fhir.minsalud.gov.co/rda/CodeSystem/MedicationTime', 'h', 7
    UNION ALL SELECT '3', N'Día', N'https://fhir.minsalud.gov.co/rda/CodeSystem/MedicationTime', 'd', 7
    UNION ALL SELECT '4', N'Semanas', N'https://fhir.minsalud.gov.co/rda/CodeSystem/MedicationTime', 'wk', 7
    UNION ALL SELECT '5', N'Mes', N'https://fhir.minsalud.gov.co/rda/CodeSystem/MedicationTime', 'mo', 7
    UNION ALL SELECT '6', N'Año', N'https://fhir.minsalud.gov.co/rda/CodeSystem/MedicationTime', 'a', 7
    UNION ALL SELECT '7', N'Según respuesta al tratamiento', N'https://fhir.minsalud.gov.co/rda/CodeSystem/MedicationTime', NULL, 7
) AS source
ON target.codigo = source.codigo AND target.system_url = source.system_url
WHEN MATCHED THEN
    UPDATE SET
        target.display = source.display,
        target.fhir_duration_unit = source.fhir_duration_unit,
        target.id_estado = source.id_estado
WHEN NOT MATCHED THEN
    INSERT (codigo, display, system_url, fhir_duration_unit, id_estado)
    VALUES (source.codigo, source.display, source.system_url, source.fhir_duration_unit, source.id_estado);
GO

IF OBJECT_ID('dbo.VW_RDA_MedicationTime_Activos', 'V') IS NOT NULL
    DROP VIEW dbo.VW_RDA_MedicationTime_Activos;
GO

CREATE VIEW dbo.VW_RDA_MedicationTime_Activos
AS
SELECT
    id,
    codigo,
    display,
    system_url,
    fhir_duration_unit,
    id_estado
FROM dbo.RDA_MedicationTime
WHERE id_estado = 7;
GO

-- 2) UMM (unidades de medida medicamento)
IF OBJECT_ID('dbo.RDA_UMM', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RDA_UMM (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        codigo VARCHAR(30) NOT NULL,
        display NVARCHAR(200) NOT NULL,
        unidad NVARCHAR(100) NULL,
        system_url NVARCHAR(300) NOT NULL,
        id_estado INT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_RDA_UMM_codigo_system UNIQUE (codigo, system_url)
    );
END
GO

-- Carga oficial MinSalud UMM (273 conceptos) en RDA_UMM
MERGE dbo.RDA_UMM AS target
USING (
    SELECT codigo, display, unidad, system_url, id_estado
    FROM (VALUES
        (N'1', N'EID50', N'dosis infecciosa de embrión 50', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'10', N'Bq', N'bequerel(ios)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'100', N'l', N'litro(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'101', N'log10 EID50', N'log 10 50% dosis infecciosa de embrión', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'102', N'log10 EID51/dosis', N'log 10 50% dosis infecciosa de embrión/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'103', N'log10 CCID50', N'log10 dosis infecciosa cultivo celular 50', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'104', N'log10 CCID50/dosis', N'log10 dosis infecciosa de cultivo celular 50/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'105', N'log10 unidades ELISA', N'log10 unidad de ensayo inmunoenzimático', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'106', N'log10 unidades ELISA/dosis', N'log10 unidad de ensayo inmunoenzimático/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'107', N'log10 FAI50', N'log10 ensayo fluorescente dosis infecciosa del 50%', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'108', N'log10 FAI50/dosis', N'log10 ensayo fluorescente dosis infecciosa del 50%/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'109', N'log10 PFU', N'log10 unidad(es) formadoras de placa', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'11', N'Bq/g', N'bequerel(ios)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'110', N'log10 PFU/dosis', N'log10 unidad(es) formadoras de placa/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'111', N'log10 TCID50', N'log10 dosis infecciosa de cultivo tisular 50%', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'112', N'log10 TCID50/dosis', N'log10 dosis infecciosa de cultivo tisular 50%/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'113', N'log10/ml', N'log10/ml', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'114', N'LU', N'unidades de loomis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'115', N'LU/g', N'unidades de loomis/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'116', N'LU/ml', N'unidades de loomis/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'117', N'lm', N'lumen', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'118', N'lx', N'lux', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'119', N'unidades MUSP', N'mega; unidad de la Farmacopea de los Estados Unidos', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'12', N'Bq/kg', N'bequerel(ios)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'120', N'MBq', N'megabecquerel(ios)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'121', N'MBq/g', N'megabecquerel(ios)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'122', N'MBq/kg', N'megabecquerel(ios)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'123', N'MBq/l', N'megabecquerel(ios)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'124', N'MBq/µg', N'megabecquerel(ios)/microgramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'125', N'MBq/µl', N'megabecquerel(ios)/microlitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'126', N'MBq/mg', N'megabecquerel(ios)/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'127', N'MBq/ml', N'megabecquerel(ios)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'128', N'm', N'metro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'129', N'µCi', N'microcurio(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'13', N'Bq/l', N'bequerel(ios)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'130', N'µCi/g', N'microcurio(s)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'131', N'µCi/kg', N'microcurio(s)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'132', N'µCi/l', N'microcurio(s)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'133', N'µCi/µg', N'microcurio(s)/microgramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'134', N'µCi/µl', N'microcurio(s)/microlitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'135', N'µCi/mg', N'microcurio(s)/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'136', N'µCi/ml', N'microcurio(s)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'137', N'µg', N'microgramo(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'138', N'µg/m3', N'microgramo(s)/metro cúbico', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'139', N'µg/kg', N'microgramo(s)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'14', N'Bq/µg', N'bequerel(ios)/microgramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'140', N'µg/l', N'microgramo(s)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'141', N'µg/µl', N'microgramo(s)/microlitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'142', N'µg/ml', N'microgramo(s)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'143', N'µg/m2', N'microgramo(s)/metro cuadrado', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'144', N'µkat', N'microkatal', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'145', N'µkat', N'microkatales', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'146', N'µl', N'microlitro(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'147', N'µl/ml', N'microlitro(s)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'148', N'µmol', N'micromol(es)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'149', N'µmol/l', N'micromol(es)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'15', N'Bq/µl', N'bequerel(ios)/microlitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'150', N'µmol/ml', N'micromol(es)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'151', N'mCi', N'milicurio(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'152', N'mCi/g', N'milicurio(s)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'153', N'mCi/kg', N'milicurio(s)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'154', N'mCi/l', N'milicurio(s)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'155', N'mCi/µg', N'milicurio(s)/microgramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'156', N'mCi/µl', N'milicurio(s)/microlitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'157', N'mCi/mg', N'milicurio(s)/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'158', N'mCi/ml', N'milicurio(s)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'159', N'mEq', N'miliequivalente(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'16', N'Bq/mg', N'bequerel(ios)/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'160', N'mEq/g', N'miliequivalente(s)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'161', N'mEq/kg', N'miliequivalente(s)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'162', N'mEq/l', N'miliequivalente(s)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'163', N'mEq/µg', N'miliequivalente(s)/microgramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'164', N'mEq/µl', N'miliequivalente(s)/microlitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'165', N'mEq/mg', N'miliequivalente(s)/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'166', N'mEq/ml', N'miliequivalente(s)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'167', N'mg (titer)', N'miligramo (titer)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'168', N'mg', N'miligramo(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'169', N'mg/m3', N'miligramo(s)/metro cúbico', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'17', N'Bq/ml', N'bequerel(ios)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'170', N'mg/g', N'miligramo(s)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'171', N'mg/kg', N'miligramo(s)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'172', N'mg/l', N'miligramo(s)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'173', N'mg/ml', N'miligramo(s)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'174', N'mg/m2', N'miligramo(s)/metro cuadrado', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'175', N'mkatal', N'milikatal', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'176', N'ml', N'mililitro(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'177', N'ml/cm2', N'mililitro(s)/centímetro cuadrado', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'178', N'mm', N'milimetro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'179', N'mmol', N'milimol(es)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'18', N'billon CFU', N'billon de unidades formadoras de colonia', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'180', N'mmol/g', N'milimol(es)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'181', N'mmol/kg', N'milimol(es)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'182', N'mmol/l', N'milimol(es)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'183', N'mmol/ml', N'milimol(es)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'184', N'millon UFC', N'millones de unidades formadoras de colonias', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'185', N'millon UFC/g', N'millones de unidades formadoras de colonias/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'186', N'millon UFC/ml', N'millones de unidades formadoras de colonias/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'187', N'millon UI', N'millones de unidadades internacionales', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'188', N'millon de organismos', N'millon de organismos', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'189', N'millon de organismos/g', N'millon de organismos/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'19', N'billon CFU/g', N'billon de unidades formadoras de colonia/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'190', N'millon de organismos/mg', N'millon de organismos/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'191', N'millon de organismos/ml', N'millon de organismos/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'192', N'millon de unidades USP', N'millon de unidades de la Farmacopea de los Estados Unidos', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'193', N'millon de unidades', N'millon de unidades', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'194', N'mOsm/kg', N'miliosmol(es)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'195', N'min', N'minuto', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'196', N'mol', N'mol(es)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'197', N'mol/g', N'mol(es)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'198', N'mol/kg', N'mol(es)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'199', N'mol/l', N'mol(es)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'2', N'EID50/dosis', N'dosis infecciosa de embrión 50/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'20', N'billon CFU/ml', N'billon de unidades formadoras de colonia/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'200', N'mol/mg', N'mol(es)/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'201', N'mol/ml', N'mol(es)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'202', N'nCi', N'nanocurio(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'203', N'ng', N'nanogramo(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'204', N'nkat', N'nanokatal', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'205', N'nl', N'nanolitro(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'206', N'nmol', N'nanomol(es)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'207', N'nmol/ml', N'nanomol(es)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'208', N'N', N'newton', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'209', N'unidades NIH/cm2', N'NIH unidades de trombina inactivada/centímetro cuadrado', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'21', N'billon de organismos', N'billon de organismos', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'210', N'?', N'ohmio', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'211', N'OZ', N'onza', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'212', N'PPM', N'parte por millon', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'213', N'PPM', N'pascal', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'214', N'%', N'porcentaje', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'215', N'% (v/v)', N'porcentaje volumen/volumen', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'216', N'% (p/v)', N'porcentaje peso/volumen', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'217', N'% (p/p)', N'porcentaje peso/peso', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'218', N'pg', N'picogramo(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'219', N'pkat', N'picokatal', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'22', N'billon de organismos/g', N'billon de organismos/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'220', N'PFU', N'unidades formadoras de placa', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'221', N'PFU e. 1000 LD50 en ratón', N'unidad formadora de placa equivalente a 1000 DL50 en ratón', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'222', N'PFU/dosis', N'unidades formadoras de placa/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'223', N'PFU/ml', N'unidades formadoras de placa/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'224', N'unidad formadora de viruela', N'unidad(es) formadoras de viruela', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'225', N'LB', N'libra', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'226', N'unidades de presión/ml', N'unidades de presión/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'227', N'PNU/ml', N'unidades de nitrogeno proteico/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'228', N'QS', N'cantidad suficiente', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'229', N'r/min', N'revoluciones/minuto', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'23', N'billon de organismos/mg', N'billon de organismos/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'230', N's', N'segundos', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'231', N'S', N'siemens', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'232', N'Sv', N'sievert', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'233', N'cm2', N'centímetro cuadrado', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'234', N'm2', N'metro cuadrado', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'235', N'T', N'tesla', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'236', N'miles CFU', N'miles de unidades formadoras de colonia', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'237', N'miles CFU/g', N'miles de unidades formadoras de colonia/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'238', N'miles CFU/ml', N'miles de unidades formadoras de colonia/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'239', N'miles de organismos', N'miles de organismos', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'24', N'billon de organismos/ml', N'billon de organismos/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'240', N'miles de organismos/g', N'miles de organismos/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'241', N'miles de organismos/ml', N'miles de organismos/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'242', N'TCID50/dosis', N'dosis infecciosa de cultivo tisular 50/ dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'243', N'titre', N'titre', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'244', N't', N'tonelada', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'245', N'unidad de tuberculina', N'unidad(es) de tuberculina', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'246', N'unidad de tuberculina/ml', N'unidad(es) de tuberculina/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'247', N'U', N'unidades', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'248', N'U/g', N'unidades/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'249', N'U/ml', N'unidades/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'25', N'cd', N'candela', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'250', N'unidades USP', N'unidades de la Farmacopea de los Estados Unidos', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'251', N'V', N'voltio', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'252', N'W', N'vatio', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'253', N'Wb', N'weber', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'254', N'vp', N'Particulas Virales', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'255', N'DLmin', N'Dosis letal minima', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'256', N'DMN', N'Dosis minima necrotizante', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'257', N'vg', N'Genomas vectoriales', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'26', N'CCID50', N'dosis infecciosa cultivo celular 50', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'27', N'CCID50/dosis', N'dosis infecciosa cultivo celular 50/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'28', N'°C', N'temperatura en Celsius', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'29', N'CFU/g', N'unidades formadoras de colonias/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'3', N'AU/ml', N'unidades de alergia/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'30', N'CFU/ml', N'nidades formadoras de colonias/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'31', N'Co', N'culombio', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'32', N'm3', N'metro cúbico', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'33', N'Ci', N'curio(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'34', N'Ci/g', N'curie(s)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'35', N'Ci/kg', N'curie(s)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'36', N'Ci/litro', N'curie(s)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'37', N'Ci/µg', N'curie(s)/microgramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'38', N'Ci/µl', N'curie(s)/microlitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'39', N'Ci/mg', N'curie(s)/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'4', N'A', N'amperio', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'40', N'Ci/ml', N'curie(s)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'41', N'DAgU', N'unidad(es) de Antigeno D', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'42', N'DAgU/ml', N'unidad(es) de Antigeno D/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'43', N'd', N'dia', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'44', N'°', N'grado', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'45', N'DF', N'forma de dosificación', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'46', N'Gtt', N'gota(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'47', N'unidades ELISA', N'unidad de ensayo inmunoenzimático', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'48', N'unidades ELISA/dosis', N'unidad de ensayo inmunoenzimático/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'49', N'unidades ELISA/ml', N'unidad de ensayo inmunoenzimático/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'5', N'AgU', N'unidad(es) de antígeno', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'50', N'F', N'faradio', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'51', N'FAI50', N'ensayo fluorescente dosis infecciosa 50', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'52', N'FAI50/dosis', N'ensayo fluorescente dosis infecciosa 50/dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'53', N'GBq', N'gigabecquerel(ios)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'54', N'GBq/g', N'gigabecquerel/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'55', N'GBq/kg', N'gigabecquerel/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'56', N'GBq/l', N'gigabecquerel/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'57', N'GBq/µg', N'gigabecquerel/microgramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'58', N'GBq/µl', N'gigabecquerel/microlitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'59', N'GBq/mg', N'gigabecquerel/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'6', N'AgU/ml', N'unidad(es) de antígeno/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'60', N'GBq/ml', N'gigabecquerel/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'61', N'g (titre)', N'gramo (titre)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'62', N'g', N'gramo(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'63', N'g/m3', N'gramo/metro cúbico', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'64', N'g/l', N'gramo/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'65', N'g/ml', N'gramo/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'66', N'g/m2', N'gramo/metro cuadrado', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'67', N'Gy', N'gray', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'68', N'H', N'henrio', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'69', N'Hz', N'hertz', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'7', N'ATU', N'unidades de antitrombina', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'70', N'h', N'hora', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'71', N'IOU', N'unidad(es) internacional(es) de opacidad', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'72', N'UI', N'unidad(es) internacional(es)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'73', N'UI/g', N'unidad(es) internacional(es)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'74', N'UI/kg', N'unidad(es) internacional(es)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'75', N'UI/l', N'unidad(es) internacional(es)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'76', N'UI/mg', N'unidad(es) internacional(es)/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'77', N'UI/ml', N'unidad(es) internacional(es)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'78', N'J', N'julio', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'79', N'KIU/ml', N'unidad calicreína inactivador/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'8', N'anti-Xa IU', N'unidades internacionales de actividad anti-Xa', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'80', N'kat', N'katal', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'81', N'K', N'kelvin', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'82', N'kUI', N'unidad internacional de kilo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'83', N'unidades Kusp', N'unidad de la Farmacopea de los Estados Unidos de kilo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'84', N'unidades k', N'unidades kilo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'85', N'kBq', N'kilobecquerel(ios)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'86', N'kBq/g', N'kilobecquerel(ios)/gramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'87', N'kBq/kg', N'kilobecquerel(ios)/kilogramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'88', N'kBq/l', N'kilobecquerel(ios)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'89', N'kBq/µg', N'kilobecquerel(ios)/microgramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9', N'anti-Xa IU/ml', N'unidades internacionales de actividad anti-Xa/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'90', N'kBq/µl', N'kilobecquerel(ios)/microlitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9000', N'Dosis', N'Dosis', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9001', N'TPU', N'TPU', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9002', N'TSU', N'TSU', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9003', N'DBU', N'DBU', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9004', N'SU', N'SU', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9005', N'IR', N'IR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9006', N'DPP', N'DPP', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9007', N'HEP', N'HEP', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9008', N'UT', N'UT', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9009', N'SQ', N'SQ', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9010', N'UB', N'UB', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9011', N'DL50', N'Dosis letal 50', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9012', N'AU', N'Unidades de Alergia', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9013', N'BAU', N'Bioequivalente Unidades de Alergia', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9014', N'PNU', N'Unidades de nitrogeno proteico', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'9015', N'DPU', N'Unidades de diagnostico no estandarizadas biologicamente', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'91', N'kBq/mg', N'kilobecquerel(ios)/miligramo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'92', N'kBq/ml', N'kilobecquerel(ios)/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'93', N'kg', N'kilogramo(s)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'94', N'kg/m3', N'kilogramo(s)/metro cúbico', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'95', N'kg/l', N'kilogramo(s)/litro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'96', N'kg/m2', N'kilogramo(s)/metro cuadrado', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'97', N'LacU', N'unidades de lactasa', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'98', N'LfU', N'unidades de floculación (lime flocculation unit(s))', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7),
        (N'99', N'LfU/ml', N'unidades de floculación (lime flocculation unit(s))/mililitro', N'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM', 7)
    ) AS v(codigo, display, unidad, system_url, id_estado)
) AS source
ON target.codigo = source.codigo AND target.system_url = source.system_url
WHEN MATCHED THEN
    UPDATE SET
        target.display = source.display,
        target.unidad = source.unidad,
        target.id_estado = source.id_estado
WHEN NOT MATCHED THEN
    INSERT (codigo, display, unidad, system_url, id_estado)
    VALUES (source.codigo, source.display, source.unidad, source.system_url, source.id_estado);

PRINT 'OK: RDA_UMM cargado con catálogo oficial MinSalud UMM (273 conceptos).';
GO

IF OBJECT_ID('dbo.VW_RDA_UMM_Activos', 'V') IS NOT NULL
    DROP VIEW dbo.VW_RDA_UMM_Activos;
GO

CREATE VIEW dbo.VW_RDA_UMM_Activos
AS
SELECT
    id,
    codigo,
    display,
    unidad,
    system_url,
    id_estado
FROM dbo.RDA_UMM
WHERE id_estado = 7;
GO

-- 3) VAD (vía de administración)
IF OBJECT_ID('dbo.RDA_ViaAdministracion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RDA_ViaAdministracion (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        codigo VARCHAR(30) NOT NULL,
        display NVARCHAR(200) NOT NULL,
        system_url NVARCHAR(300) NOT NULL,
        id_estado INT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_RDA_ViaAdministracion_codigo_system UNIQUE (codigo, system_url)
    );
END
GO

-- Carga oficial MinSalud VAD (119 conceptos) en RDA_ViaAdministracion
MERGE dbo.RDA_ViaAdministracion AS target
USING (
    SELECT codigo, display, system_url, id_estado
    FROM (VALUES
        (N'001', N'AURICULAR (OTICA)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'002', N'BUCAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'003', N'CUTANEA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'004', N'DENTAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'005', N'ENDOCERVICAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'006', N'ENDOSINUSIAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'007', N'ENDOTRAQUEAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'008', N'EPIDURAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'009', N'EXTRA-AMNIOTICO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'010', N'VIA A TRAVES DE HEMODIALISIS', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'011', N'INTRA CORPUS CAVERNOSO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'012', N'INTRAAMNIOTICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'013', N'INTRAARTERIAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'014', N'INTRAARTICULAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'015', N'INTRAUTERINA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'016', N'INTRACARDIACA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'017', N'INTRACAVERNOSA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'018', N'INTRACEREBRAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'019', N'INTRACERVICAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'020', N'INTRACISTERNAL (CEREBELOMEDULAR)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'021', N'INTRACORNEAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'022', N'INTRACORONARIA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'023', N'INTRADERMICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'024', N'INTRADISCAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'025', N'INTRAHEPATICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'026', N'USO INTRALESIONAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'027', N'USO INTRALINFATICO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'028', N'INTRAMEDULAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'029', N'INTRAMENINGEA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'030', N'INTRAMUSCULAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'031', N'INTRAOCULAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'032', N'INTRAPERICARDIAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'033', N'INTRAPERITONEAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'034', N'INTRAPLEURAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'035', N'INTRASINOVIAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'036', N'INTRATECAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'037', N'INTRATORAXICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'038', N'INTRATRAQUEAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'039', N'INTRATUMORAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'040', N'BOLO INTRAVENOSO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'041', N'GOTEO INTRAVENOSO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'042', N'INTRAVENOSA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'043', N'INTRAVESICAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'044', N'IONTOFORESIS', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'045', N'NASAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'046', N'TECNICA DE VENDAJE OCLUSIVO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'047', N'OFTALMICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'048', N'ORAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'049', N'OROFARINGEA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'050', N'OTRA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'051', N'PARENTERAL*', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'052', N'PERIARTICULAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'053', N'PERINEURAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'054', N'RECTAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'055', N'INHALATORIA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'056', N'RETROBULBAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'057', N'SUBCONJUNTIVAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'058', N'SUBCUTANEA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'060', N'SUBLINGUAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'061', N'TOPICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'062', N'TRANSDERMICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'063', N'TRANSMAMARIA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'064', N'TRANSPLACENTARIA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'066', N'URETRAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'067', N'VAGINAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'068', N'CONJUNTIVAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'069', N'ELECTRO-OSMOSIS', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'070', N'ENTERAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'071', N'GASTROENTERAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'072', N'INTRAGINGIVAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'075', N'IN VITRO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'076', N'INFILTRACION', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'077', N'INTERSTICIAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'078', N'INTRABDOMINAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'079', N'INTRABILIAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'080', N'INTRABRONQUIAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'081', N'INTRABURSAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'082', N'INTRACARTILAGINOSO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'083', N'INTRACAUDAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'084', N'INTRACAVITARIA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'085', N'INTRACORONARIO, DENTAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'086', N'INTRADUCTAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'087', N'INTRADUODENAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'088', N'INTRADURAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'089', N'INTRAEPIDERMAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'090', N'INTRAESOFAGICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'091', N'INTRAGASTRICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'092', N'INTRAILEAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'093', N'INTRAOVARICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'094', N'INTRAPROSTATICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'095', N'INTRAPULMONAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'096', N'INTRASINUSAL (SENOSPARANASALES)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'097', N'INTRAESTERNAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'098', N'INTRATENDINOSA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'099', N'INTRATESTICULAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'100', N'INTRATUBULAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'101', N'INTRATIMPANICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'102', N'INTRAVASCULAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'103', N'INTRAVENTRICULAR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'104', N'INTRAVITREA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'105', N'IRRIGACION', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'106', N'LARINGEO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'107', N'LARINGOFARINGEAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'108', N'SONDA NASOGASTRICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'110', N'USO OROMUCOSA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'111', N'PERCUTANEA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'112', N'PERIDURAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'113', N'PERIODONTAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'114', N'TEJIDO BLANDO', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'115', N'SUBARACNOIDEA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'116', N'SUBMUCOSA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'117', N'TRANSMUCOSA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'118', N'TRANSTRAQUEAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'119', N'TRANSTIMPANICA', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'120', N'URETERAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'500', N'INTRADETRUSOR', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'501', N'USO EPILESIONAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'502', N'INHALATORIA NASAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7),
        (N'503', N'INHALATORIA BUCAL', N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD', 7)
    ) AS v(codigo, display, system_url, id_estado)
) AS source
ON target.codigo = source.codigo AND target.system_url = source.system_url
WHEN MATCHED THEN
    UPDATE SET
        target.display = source.display,
        target.id_estado = source.id_estado
WHEN NOT MATCHED THEN
    INSERT (codigo, display, system_url, id_estado)
    VALUES (source.codigo, source.display, source.system_url, source.id_estado);

PRINT 'OK: RDA_ViaAdministracion cargado con catálogo oficial MinSalud VAD (119 conceptos).';
GO

IF NOT EXISTS (
    SELECT 1 FROM dbo.RDA_ViaAdministracion
    WHERE system_url = N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD'
      AND id_estado = 7 AND codigo = N'042'
)
    PRINT 'ERROR VAD: MERGE incompleto — seleccione y ejecute TODO el bloque MERGE (desde -- Carga oficial MinSalud VAD hasta este GO).';
ELSE
    PRINT 'VERIFICADO VAD: codigo 042 INTRAVENOSA cargado correctamente.';
GO

-- Desactivar códigos legacy SOLO si el catálogo oficial ya está cargado (ej. existe 042 activo)
IF OBJECT_ID('dbo.RDA_ViaAdministracion', 'U') IS NOT NULL
   AND EXISTS (
       SELECT 1 FROM dbo.RDA_ViaAdministracion o
       WHERE o.system_url = N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD'
         AND o.id_estado = 7 AND o.codigo = N'042'
   )
BEGIN
    UPDATE leg
    SET leg.id_estado = 0
    FROM dbo.RDA_ViaAdministracion leg
    WHERE leg.system_url = N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD'
      AND leg.id_estado = 7
      AND EXISTS (
          SELECT 1
          FROM dbo.RDA_ViaAdministracion ofi
          WHERE ofi.system_url = leg.system_url
            AND ofi.id_estado = 7
            AND ofi.codigo <> leg.codigo
            AND TRY_CAST(ofi.codigo AS INT) IS NOT NULL
            AND TRY_CAST(leg.codigo AS INT) IS NOT NULL
            AND TRY_CAST(ofi.codigo AS INT) = TRY_CAST(leg.codigo AS INT)
            AND LEN(LTRIM(RTRIM(ofi.codigo))) > LEN(LTRIM(RTRIM(leg.codigo)))
      );

    UPDATE v
    SET v.id_estado = 0
    FROM dbo.RDA_ViaAdministracion v
    WHERE v.system_url = N'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD'
      AND v.id_estado = 7
      AND v.codigo NOT IN (N'001', N'002', N'003', N'004', N'005', N'006', N'007', N'008', N'009', N'010', N'011', N'012', N'013', N'014', N'015', N'016', N'017', N'018', N'019', N'020', N'021', N'022', N'023', N'024', N'025', N'026', N'027', N'028', N'029', N'030', N'031', N'032', N'033', N'034', N'035', N'036', N'037', N'038', N'039', N'040', N'041', N'042', N'043', N'044', N'045', N'046', N'047', N'048', N'049', N'050', N'051', N'052', N'053', N'054', N'055', N'056', N'057', N'058', N'060', N'061', N'062', N'063', N'064', N'066', N'067', N'068', N'069', N'070', N'071', N'072', N'075', N'076', N'077', N'078', N'079', N'080', N'081', N'082', N'083', N'084', N'085', N'086', N'087', N'088', N'089', N'090', N'091', N'092', N'093', N'094', N'095', N'096', N'097', N'098', N'099', N'100', N'101', N'102', N'103', N'104', N'105', N'106', N'107', N'108', N'110', N'111', N'112', N'113', N'114', N'115', N'116', N'117', N'118', N'119', N'120', N'500', N'501', N'502', N'503');

    PRINT 'OK: RDA_ViaAdministracion — solo catálogo oficial VAD activo (119 conceptos).';
END
ELSE
    PRINT 'AVISO: Omitida limpieza VAD legacy — ejecute primero el MERGE oficial (debe existir codigo 042 activo).';
GO

-- Normalizar vías guardadas con códigos internos (ej. "42") → código oficial VAD (ej. "042")
IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]', N'U') IS NOT NULL
   AND OBJECT_ID('dbo.RDA_ViaAdministracion', 'U') IS NOT NULL
BEGIN
    ;WITH map_ui AS (
        SELECT * FROM (VALUES
            (N'01', N'048'),
            (N'02', N'042'),
            (N'03', N'030'),
            (N'04', N'058'),
            (N'05', N'061'),
            (N'06', N'055'),
            (N'07', N'054'),
            (N'08', N'060'),
            (N'09', N'047'),
            (N'10', N'050')
        ) AS v(codigo_ui, codigo_oficial)
    )
    UPDATE pm
    SET pm.[Via Administracion] = m.codigo_oficial
    FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos] pm
    INNER JOIN map_ui m ON LTRIM(RTRIM(pm.[Via Administracion])) = m.codigo_ui
    INNER JOIN dbo.RDA_ViaAdministracion v
        ON v.id_estado = 7 AND v.codigo = m.codigo_oficial;

    UPDATE pm
    SET pm.[Via Administracion] = v.codigo
    FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos] pm
    INNER JOIN dbo.RDA_ViaAdministracion v
        ON v.id_estado = 7
       AND LTRIM(RTRIM(v.codigo)) = CASE
            WHEN TRY_CAST(LTRIM(RTRIM(pm.[Via Administracion])) AS INT) IS NOT NULL
                 AND LEN(LTRIM(RTRIM(pm.[Via Administracion]))) < 3
            THEN RIGHT(REPLICATE(N'0', 3) + LTRIM(RTRIM(pm.[Via Administracion])), 3)
            ELSE LTRIM(RTRIM(pm.[Via Administracion]))
        END
    WHERE pm.[Via Administracion] IS NOT NULL
      AND LTRIM(RTRIM(pm.[Via Administracion])) <> LTRIM(RTRIM(v.codigo));

    PRINT 'OK: Prescripciones CE — vías normalizadas a códigos VAD oficiales.';
END
GO

IF OBJECT_ID('dbo.VW_RDA_ViaAdministracion_Activos', 'V') IS NOT NULL
    DROP VIEW dbo.VW_RDA_ViaAdministracion_Activos;
GO

CREATE VIEW dbo.VW_RDA_ViaAdministracion_Activos
AS
SELECT
    id,
    codigo,
    display,
    system_url,
    id_estado
FROM dbo.RDA_ViaAdministracion
WHERE id_estado = 7;
GO

-- 4) ColombianTechModality (modalidad de realización tecnología de salud)
IF OBJECT_ID('dbo.RDA_ColombianTechModality', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RDA_ColombianTechModality (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        codigo VARCHAR(10) NOT NULL,
        display NVARCHAR(200) NOT NULL,
        system_url NVARCHAR(300) NOT NULL,
        id_estado INT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_RDA_ColombianTechModality_codigo_system UNIQUE (codigo, system_url)
    );
END
GO

MERGE dbo.RDA_ColombianTechModality AS target
USING (
    SELECT codigo, display, system_url, id_estado
    FROM (VALUES
        (N'01', N'Intramural', N'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality', 7),
        (N'02', N'Extramural unidad móvil', N'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality', 7),
        (N'03', N'Extramural domiciliaria', N'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality', 7),
        (N'04', N'Extramural jornada de salud', N'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality', 7),
        (N'05', N'Extramural (atención pre hospitalaria o transporte asistencial)', N'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality', 7),
        (N'06', N'Telemedicina interactiva', N'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality', 7),
        (N'07', N'Telemedicina no interactiva', N'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality', 7),
        (N'08', N'Telemedicina - Telexperticia', N'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality', 7),
        (N'09', N'Telemedicina - Telemonitoreo', N'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality', 7)
    ) AS v(codigo, display, system_url, id_estado)
) AS source
ON target.codigo = source.codigo AND target.system_url = source.system_url
WHEN MATCHED THEN
    UPDATE SET
        target.display = source.display,
        target.id_estado = source.id_estado
WHEN NOT MATCHED THEN
    INSERT (codigo, display, system_url, id_estado)
    VALUES (source.codigo, source.display, source.system_url, source.id_estado);

PRINT 'OK: RDA_ColombianTechModality cargado con catálogo oficial MinSalud (9 conceptos).';
GO

IF OBJECT_ID('dbo.VW_RDA_ColombianTechModality_Activos', 'V') IS NOT NULL
    DROP VIEW dbo.VW_RDA_ColombianTechModality_Activos;
GO

CREATE VIEW dbo.VW_RDA_ColombianTechModality_Activos
AS
SELECT
    id,
    codigo,
    display,
    system_url,
    id_estado
FROM dbo.RDA_ColombianTechModality
WHERE id_estado = 7;
GO

-- Sincronizar nombres de modalidad RIPS con display oficial FHIR
IF OBJECT_ID(N'[dbo].[RIPS Modalidad Atención]', N'U') IS NOT NULL
   AND OBJECT_ID('dbo.RDA_ColombianTechModality', 'U') IS NOT NULL
BEGIN
    UPDATE ma
    SET ma.[Nombre Modalidad Atencion] = ctm.display
    FROM [dbo].[RIPS Modalidad Atención] ma
    INNER JOIN dbo.RDA_ColombianTechModality ctm
        ON ctm.id_estado = 7
       AND LTRIM(RTRIM(ctm.codigo)) = LTRIM(RTRIM(ma.Codigo));

    PRINT 'OK: [RIPS Modalidad Atención] sincronizado con ColombianTechModality oficial.';
END
GO

-- Corregir abreviaturas guardadas en prescripciones CE → código oficial MedicationTime 1-7
IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]', N'U') IS NOT NULL
   AND OBJECT_ID('dbo.RDA_MedicationTime', 'U') IS NOT NULL
BEGIN
    ;WITH map AS (
        SELECT * FROM (VALUES
            (N'h', N'2'), (N'hr', N'2'), (N'horas', N'2'), (N'hora', N'2'),
            (N'min', N'1'), (N'minutos', N'1'), (N'minuto', N'1'),
            (N'd', N'3'), (N'dia', N'3'), (N'día', N'3'), (N'day', N'3'),
            (N'sem', N'4'), (N'semanas', N'4'), (N'semana', N'4'),
            (N'mes', N'5'),
            (N'año', N'6'), (N'anio', N'6'), (N'ano', N'6'),
            (N'wk', N'4'), (N'mo', N'5'), (N'a', N'6')
        ) AS v(abbrev, codigo_oficial)
    )
    UPDATE pm
    SET pm.[Frecuencia Unidad Tiempo] = m.codigo_oficial
    FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos] pm
    INNER JOIN map m ON LOWER(LTRIM(RTRIM(pm.[Frecuencia Unidad Tiempo]))) = m.abbrev
    WHERE pm.[Frecuencia Unidad Tiempo] IS NOT NULL
      AND LTRIM(RTRIM(pm.[Frecuencia Unidad Tiempo])) NOT IN ('1', '2', '3', '4', '5', '6', '7');

    ;WITH map AS (
        SELECT * FROM (VALUES
            (N'h', N'2'), (N'hr', N'2'), (N'horas', N'2'), (N'hora', N'2'),
            (N'min', N'1'), (N'minutos', N'1'), (N'minuto', N'1'),
            (N'd', N'3'), (N'dia', N'3'), (N'día', N'3'), (N'day', N'3'),
            (N'sem', N'4'), (N'semanas', N'4'), (N'semana', N'4'),
            (N'mes', N'5'),
            (N'año', N'6'), (N'anio', N'6'), (N'ano', N'6'),
            (N'wk', N'4'), (N'mo', N'5'), (N'a', N'6')
        ) AS v(abbrev, codigo_oficial)
    )
    UPDATE pm
    SET pm.[Duracion Unidad Tiempo] = m.codigo_oficial
    FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos] pm
    INNER JOIN map m ON LOWER(LTRIM(RTRIM(pm.[Duracion Unidad Tiempo]))) = m.abbrev
    WHERE pm.[Duracion Unidad Tiempo] IS NOT NULL
      AND LTRIM(RTRIM(pm.[Duracion Unidad Tiempo])) NOT IN ('1', '2', '3', '4', '5', '6', '7');

    PRINT 'OK: Prescripciones CE — unidades de tiempo normalizadas a códigos MedicationTime oficiales.';
END
GO

/* ==========================================================================================================
   CORRECCIÓN CATALOGO: [RIPS Causa Externa Version2]
   - Actualiza nombres incorrectos en BD ya existentes.
   - Inserta códigos faltantes (incluye 49).
   - Mantiene [Id Estado] = 7.
   ========================================================================================================== */
IF OBJECT_ID(N'[dbo].[RIPS Causa Externa Version2]', N'U') IS NOT NULL
BEGIN
    ;WITH src AS (
        SELECT *
        FROM (VALUES
            ('21', 'ACCIDENTE DE TRABAJO', 1, 7),
            ('22', 'ACCIDENTE EN EL HOGAR', 1, 7),
            ('23', 'ACCIDENTE DE TRANSITO DE ORIGEN COMUN', 1, 7),
            ('24', 'ACCIDENTE DE TRANSITO DE ORIGEN LABORAL', 1, 7),
            ('25', 'ACCIDENTE EN EL ENTORNO EDUCATIVO', 1, 7),
            ('26', 'OTRO TIPO DE ACCIDENTE', 1, 7),
            ('27', 'EVENTO CATASTROFICO DE ORIGEN NATURAL', 1, 7),
            ('28', 'LESION POR AGRESION', 1, 7),
            ('29', 'LESION AUTO INFLIGIDA', 1, 7),
            ('30', 'SOSPECHA DE VIOLENCIA FISICA', 1, 7),
            ('31', 'SOSPECHA DE VIOLENCIA PSICOLOGICA', 1, 7),
            ('32', 'SOSPECHA DE VIOLENCIA SEXUAL', 1, 7),
            ('33', 'SOSPECHA DE NEGLIGENCIA Y ABANDONO', 1, 7),
            ('34', 'IVE RELACIONADO CON PELIGRO A LA SALUD O VIDA DE LA MUJER', 1, 7),
            ('35', 'IVE POR MALFORMACION CONGENITA INCOMPATIBLE CON LA VIDA', 1, 7),
            ('36', 'IVE POR VIOLENCIA SEXUAL, INCESTO O POR INSEMINACION ARTIFICIAL O TRANSFERENCIA DE OVULO FECUNDADO NO CONSENTIDA', 1, 7),
            ('37', 'EVENTO ADVERSO EN SALUD', 1, 7),
            ('38', 'ENFERMEDAD GENERAL', 1, 7),
            ('39', 'ENFERMEDAD LABORAL', 1, 7),
            ('40', 'PROMOCION Y MANTENIMIENTO DE LA SALUD - INTERVENCIONES INDIVIDUALES', 1, 7),
            ('41', 'INTERVENCION COLECTIVA', 1, 7),
            ('42', 'ATENCION DE POBLACION MATERNO PERINATAL', 1, 7),
            ('43', 'RIESGO AMBIENTAL', 1, 7),
            ('44', 'OTROS EVENTOS CATASTROFICOS', 1, 7),
            ('45', 'ACCIDENTE DE MINA ANTIPERSONAL - MAP', 1, 7),
            ('46', 'ACCIDENTE DE ARTEFACTO EXPLOSIVO IMPROVISADO - AEI', 1, 7),
            ('47', 'ACCIDENTE DE MUNICION SIN EXPLOTAR- MUSE', 1, 7),
            ('48', 'OTRA VICTIMA DE CONFLICTO ARMADO COLOMBIANO', 1, 7),
            ('49', 'IVE POR DECISION O MANIFESTACION DE VOLUNTAD DE LA PERSONA GESTANTE HASTA LA SEMANA 24 DE GESTACION', 1, 7)
        ) AS v (Codigo, NombreOficial, OrdenOficial, IdEstadoOficial)
    )
    MERGE [dbo].[RIPS Causa Externa Version2] AS tgt
    USING src
        ON LTRIM(RTRIM(tgt.[Codigo])) = src.Codigo
    WHEN MATCHED THEN
        UPDATE SET
            tgt.[Nombre RIPS Causa Externa Version2] = src.NombreOficial,
            tgt.[Orden RIPS Causa Externa Version2] = src.OrdenOficial,
            tgt.[Id Estado] = src.IdEstadoOficial
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (
            [Codigo],
            [Nombre RIPS Causa Externa Version2],
            [Descripción RIPS Causa Externa Version2],
            [Orden RIPS Causa Externa Version2],
            [Id Estado]
        )
        VALUES (
            src.Codigo,
            src.NombreOficial,
            NULL,
            src.OrdenOficial,
            src.IdEstadoOficial
        );

    PRINT 'OK: Catálogo [RIPS Causa Externa Version2] actualizado (21-49).';
END
ELSE
BEGIN
    PRINT 'AVISO: No existe la tabla [dbo].[RIPS Causa Externa Version2].';
END
GO

/* ==========================================================================================================
   CORRECCIÓN CATALOGO: [Tipo de Documento] — display obligatorio para ColombianPersonIdentifier (RDA/IHCE)
   ========================================================================================================== */
IF OBJECT_ID(N'[dbo].[Tipo de Documento]', N'U') IS NOT NULL
BEGIN
    ;WITH src AS (
        SELECT *
        FROM (VALUES
            ('CC', 'Cédula ciudadanía'),
            ('CE', 'Cédula extranjería'),
            ('PA', 'Pasaporte'),
            ('RC', 'Registro civil'),
            ('TI', 'Tarjeta de identidad'),
            ('CD', 'Carné diplomático'),
            ('SC', 'Salvoconducto de permanencia'),
            ('PE', 'Permiso especial de permanencia'),
            ('PT', 'Permiso por protección temporal'),
            ('PPT', 'Permiso por Protección Temporal'),
            ('CN', 'Certificado de nacido vivo'),
            ('DE', 'Documento extranjero'),
            ('AS', 'Adulto sin identificación'),
            ('MS', 'Menor sin identificación'),
            ('SI', 'Sin identificación'),
            ('UN', 'Número único de identificación personal'),
            ('NI', 'Número de identificación tributaria'),
            ('NH', 'Número de historia clínica')
        ) AS v(TipoDoc, DescripcionOficial)
    )
    UPDATE td
       SET td.[Descripción Tipo de Documento] = src.DescripcionOficial
      FROM [dbo].[Tipo de Documento] td
      INNER JOIN src ON src.TipoDoc = td.[Tipo de Documento]
     WHERE td.[Descripción Tipo de Documento] IS NULL
        OR LTRIM(RTRIM(td.[Descripción Tipo de Documento])) = ''
        OR td.[Descripción Tipo de Documento] <> src.DescripcionOficial;

    PRINT 'OK: [Tipo de Documento] — descripciones alineadas con ColombianPersonIdentifier (CC, PA, etc.).';
END
GO




  BEGIN TRAN;

UPDATE [Ocupación]
SET [Código Ocupación] = RIGHT('0000' + LTRIM(RTRIM(CAST([Código Ocupación] AS VARCHAR(20)))), 4)
WHERE [Código Ocupación] IS NOT NULL
  AND LEN(LTRIM(RTRIM(CAST([Código Ocupación] AS VARCHAR(20))))) = 3
  AND LTRIM(RTRIM(CAST([Código Ocupación] AS VARCHAR(20)))) NOT LIKE '%[^0-9]%';

SELECT @@ROWCOUNT AS RegistrosActualizados;

-- Revisa cómo quedaron
SELECT TOP (200)
    [Id Ocupación],
    [Código Ocupación],
    Ocupación,
    [Descripción Ocupación],
    [Orden Ocupación],
    [Id Estado]
FROM [Ocupación]
ORDER BY [Orden Ocupación];

-- Si todo está bien:
COMMIT;

-- Si algo quedó mal, en vez de COMMIT ejecutas:
-- ROLLBACK;

-- =============================================================================
-- Ocupación: alinear display con catálogo CIUO88AC (MinSalud)
-- Ejecutar después del padding de códigos a 4 dígitos (bloque anterior).
-- Ver: 1888_update_ocupacion_ciuo88ac.sql
-- Placeholder Sin asignar (Id 1): 1888_ocupacion_sin_asignar.sql
-- =============================================================================
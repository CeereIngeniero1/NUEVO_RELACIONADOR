

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
    sx.[Descripción Sexo] AS Sexo,
    sx.[Código Sexo] AS CódigoSexo,
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
    e1888.[Alergeno] AS Alergeno
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
-- EntidadIII.[Id Zona Residencia] guarda el código RIPS (1→01 Urbana, 2→02 Rural), no el PK del catálogo.
LEFT JOIN dbo.[Zona Residencia] zr
    ON LTRIM(RTRIM(zr.[Código Zona Residencia])) = RIGHT('0' + CAST(e3.[Id Zona Residencia] AS VARCHAR(2)), 2)
LEFT JOIN dbo.Etnia et
    ON et.[Id Etnia] = e1888.[Id Etnia]
LEFT JOIN dbo.Discapacidad d
    ON d.[Id Discapacidad] = e1888.[Id Discapacidad]
LEFT JOIN dbo.EntidadVI e6
    ON e6.[Documento Entidad] = e.[Documento Entidad]
LEFT JOIN dbo.Ocupación o
    ON o.[Id Ocupación] = e6.[Id Ocupación]
GO


-- aca porfa 

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
            ('34', 'IVE RELACIONADO CON PELIGRO A LA SALUD O  VIDA DE LA MUJER', 1, 7),
            ('35', 'IVE POR MALFORMACION CONGENITA  INCOMPATIBLE CON LA VIDA', 1, 7),
            ('36', 'IVE POR VIOLENCIA SEXUAL, INCESTO O POR INSEMINACION ARTIFICIAL O  TRANSFERENCIA DE OVULO FECUNDADO NO CONSENTIDA', 1, 7),
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


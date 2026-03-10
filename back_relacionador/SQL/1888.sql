

CREATE TABLE [Entidad1888](
	[Id Entidad1888] [int] IDENTITY(1,1) NOT NULL,
	[Documento Entidad] [nvarchar](50) NULL,
	[Id Identidad Genero] int not null,
	[Talla] varchar(10) not null ,
	[Peso] varchar(10) not null ,
	[Id Etnia] int Not null,
	[Comunidad Etnica] varchar (50) not null,
	[Id Discapacidad] int Not null,
    [Alergias] varchar (90) null
	
)

ALTER TABLE Entidad1888
ADD [Id Pais Nacionalidad] INT NULL;
GO

ALTER TABLE Entidad1888
ADD [Id Pais Recidencia] INT NULL;
GO

ALTER TABLE Entidad1888
ADD [Id Municipio Recidencia] INT NULL;
GO

create table Discapacidad (
[Id Discapacidad] int identity(1,1) primary key  not null,
 [Codigo] varchar (10) Null, 
 [Discapacidad] varchar (60) Null,
 [Descripcion Discapacidad] varchar (60) Null,
 [Id Estado] int Null
)

select * from etnia

Create table [Sexo Identidad Genero](
[Id Sexo Identidad Genero] int identity(1,1) primary key not null,
 [Codigo] varchar (10) Null, 
 [Identidad Genero] varchar (30) Null,
 [Descripcion Identidad Genero] varchar (60) Null,
 [Id Estado] int Null

)

alter table Entidad1888 
add constraint Fg_IdentidadGenero 
foreign key ([Id Identidad Genero])
references [Sexo Identidad Genero]


alter table Entidad1888
add constraint fg_Etnia 
foreign key ([Id Etnia])
references Etnia


alter table Entidad1888
 add constraint fg_Discapacidad
 foreign key ([Id Discapacidad])
 references Discapacidad



-- Insert para tablas 

INSERT INTO [dbo].[Sexo Identidad Genero]
           ([Codigo]
           ,[Identidad Genero]
           ,[Descripcion Identidad Genero]
           ,[Id Estado])
     VALUES
           ('01',
           'Masculino',
           'Masculino',
           '7')
           ,
           ('02',
           'Femenino',
           'Femenino',
           '7')
           ,
           ('03',
           'Transgénero',
           'Transgénero',
           '7')
           ,
           ('04',
           'Neutro',
           'Neutro',
           '7')
           ,
           ('05',
           'No lo declara',
           'No lo declara',
           '7')
           ,
           ('06',
            'Sin asignar',
            'Sin asignar',
            '7')
GO



update etnia set [Id Estado] = 8

INSERT INTO [dbo].[Etnia]
           ([Código Etnia]
           ,[Etnia]
           ,[Descripción Etnia]
           ,[Orden Etnia]
           ,[Id Estado])
     VALUES
           ('1',
           'Indigena',
           'Indigena',
           1,
           '7')
           ,
           ('2',
           'ROM (Gitano)',
           'ROM (Gitano)',
           1,
           '7')
           ,
           ('3',
           'Raizal (Archipielago San Andrés y Providencia)',
           'Raizal (Archipielago San Andrés y Providencia)',
           1,
           '7')
           ,
           ('4',
           'Palenquero de San Basilio',
           'Palenquero de San Basilio',
           1,
           '7')
           ,
           ('5',
           'Negro(a) o mulato(a) o afrocolombiano(a) o afrodescendiente',
           'Negro(a) o mulato(a) o afrocolombiano(a) o afrodescendiente',
           1,
           '7')
           ,
           ('6',
           'Otras etnias',
           'Otras etnias',
           1,
           '7')
           ,
           ('7',
           'Sin Asignar',
           'Sin Asignar',
           1,
           '7')
GO

INSERT INTO [dbo].[Discapacidad]
           ([Codigo]
           ,[Discapacidad]
           ,[Descripcion Discapacidad]
           ,[Id Estado])
     VALUES
           ('01',
           'Discapacidad física',
           'Discapacidad física', 
           7)
           ,
            ('02',
           'Discapacidad visual',
           'Discapacidad visual', 
           7)
           ,
            ('03',
           'Discapacidad auditiva',
           'Discapacidad auditiva', 
           7)
           ,
            ('04',
           'Discapacidad intelectual',
           'Discapacidad intelectual', 
           7)
           ,
            ('05',
           'Discapacidad sicosocial (mental)',
           'Discapacidad sicosocial (mental)', 
           7)
           
           ,
            ('06',
           'Sordoceguera',
           'Sordoceguera', 
           7)
           ,
            ('07',
           'Discapacidad múltiple',
           'Discapacidad múltiple', 
           7)
           ,
            ('08',
           'Sin discapacidad',
           'Sin discapacidad', 
           7)
           ,
            ('09',
            'Sin Asignar',
            'Sin Asignar',  
            7)

GO

Create table País1888 
(
[Id Pais1888] int primary key identity(1,1),
Codigo varchar (20),
Nombre varchar (50),
Estado int default 7
)


insert into País1888 values
(170,'COLOMBIA', 7)


Create table Ciudad1888 
(
[Id Ciudad1888] int primary key identity(1,1),
Codigo varchar (20),
Nombre varchar (50),
Estado int default 7
)

CREATE VIEW [dbo].[Cnsta Ciudad 1888]
AS
SELECT [Id Ciudad1888] AS IdCiudad1888, Codigo, Nombre, Estado
FROM     dbo.Ciudad1888
WHERE  (Estado = 7)
GO


CREATE VIEW [dbo].[Cnsta Pais 1888]
AS
SELECT [Id Pais1888] AS IdPais1888, Codigo, Nombre, Estado
FROM     dbo.País1888
WHERE  (Estado = 7)
GO

CREATE VIEW [dbo].[Cnsta Tipodocumento 1888]
AS
SELECT [Id Tipo de Documento] AS IdTipodeDocumento, [Código Tipo de Documento] AS CódigoTipoDocumento, [Tipo de Documento] AS TipoDocumento, [Descripción Tipo de Documento] AS DescripciónTipoDocumento
FROM     dbo.[Tipo de Documento]
WHERE  ([Tipo de Documento] = N'CC') OR
                  ([Tipo de Documento] = N'TI') OR
                  ([Tipo de Documento] = N'RC') OR
                  ([Tipo de Documento] = N'CE') OR
                  ([Tipo de Documento] = N'PA') OR
                  ([Tipo de Documento] = N'PE') OR
                  ([Tipo de Documento] = N'PT')
GO

CREATE VIEW [dbo].[Cnsta Sexo 1888]
AS
SELECT [Id Sexo] AS IdSexo, [Código Sexo] AS CódigoSexo, Sexo, [Descripción Sexo]
FROM     dbo.Sexo
WHERE  (Sexo = N'F') OR
                  (Sexo = N'M')
GO

CREATE VIEW [dbo].[Cnsta SexoIdentidad 1888]
AS
SELECT [Id Sexo Identidad Genero] AS IdSexoIdentidadGenero, Codigo, [Identidad Genero] AS IdentidadGenero, [Descripcion Identidad Genero] AS DescripcionIdentidadGenero
FROM     dbo.[Sexo Identidad Genero]
GO


CREATE VIEW [dbo].[Cnsta ZonaResidencia 1888]
AS
SELECT   TOP (100)  [Id Zona Residencia] as IdZonaResidencia, [Zona Residencia] as ZonaResidencia, [Descripción Zona Residencia] as DescripciónZonaResidencia
FROM         dbo.[Zona Residencia]
ORDER BY [Zona Residencia]
GO


CREATE VIEW [dbo].[Cnsta Etnia 1888]
AS
SELECT [Id Etnia] AS IdEtnia, [Código Etnia] AS CódigoEtnia, Etnia, [Descripción Etnia] AS DescripciónEtnia, [Id Estado] AS IdEstado
FROM     dbo.Etnia
WHERE  ([Id Estado] = 7)
GO

CREATE VIEW [dbo].[Cnsta Discapacidad 1888]
AS
SELECT [Id Discapacidad] AS IdDiscapacidad, Codigo, Discapacidad, [Descripcion Discapacidad] AS DescripcionDiscapacidad
FROM     dbo.Discapacidad
WHERE  ([Id Estado] = 7)
GO


CREATE VIEW [dbo].[Cnsta Ocupacion 1888]
AS
SELECT [Id Ocupación] AS IdOcupacion, [Código Ocupación] AS CodigoOcupacion, Ocupación AS DescripcionOcupacion, [Id Estado]
FROM     dbo.Ocupación
WHERE  ([Id Estado] = 7)
GO


ALTER TABLE [dbo].[Ocupación]
ALTER COLUMN [Ocupación] NVARCHAR(200) NULL;






CREATE VIEW [dbo].[Cnsta Relacionador Usuarios Info]
AS
SELECT dbo.Entidad.[Id Tipo de Documento] AS IdTipodeDocumento, dbo.[Tipo de Documento].[Descripción Tipo de Documento] AS DescripciTipoDocumento, dbo.[Tipo de Documento].[Tipo de Documento] AS TipoDocumentoBase, 
                  dbo.Entidad.[Documento Entidad] AS DocumentoPaciente, dbo.Entidad.[Primer Apellido Entidad] AS PrimerApellidoBase, dbo.Entidad.[Segundo Apellido Entidad] AS SegundoApellidoBase, 
                  dbo.Entidad.[Primer Nombre Entidad] AS PrimerNombreBase, dbo.Entidad.[Segundo Nombre Entidad] AS SegundoNombreBase, dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente, dbo.Sexo.Sexo AS SexoPaciente, 
                  dbo.Sexo.[Descripción Sexo] AS Sexo, dbo.Sexo.[Código Sexo] AS CódigoSexo, dbo.Sexo.[Id Sexo] AS IdSexo, EntidadIII_1.[Edad EntidadIII] AS Edad, dbo.EntidadII.[Dirección EntidadII] AS Direccion, 
                  dbo.EntidadII.[Teléfono Celular EntidadII] AS Tel, dbo.[Tipo de Documento].[Tipo de Documento] + N' ' + dbo.Entidad.[Documento Entidad] AS DocumentoTipoDOC, EntidadIII_1.[Fecha Nacimiento EntidadIII] AS FechaNacimientoBase, 
                  EntidadIII_1.[Id Sexo], dbo.Entidad1888.[Id Identidad Genero], dbo.[Sexo Identidad Genero].[Id Sexo Identidad Genero] AS IdSexoIdentidadGenero, dbo.[Sexo Identidad Genero].Codigo AS codigoIdentidadGeneroBase, 
                  dbo.[Sexo Identidad Genero].[Identidad Genero] AS IdentidadGeneroBase, EntidadIII_1.[Id Zona Residencia], dbo.Entidad1888.Talla, dbo.Entidad1888.Peso, dbo.Entidad1888.[Id Etnia], 
                  dbo.Entidad1888.[Comunidad Etnica] AS ComunidadEtnica, dbo.Entidad1888.[Id Discapacidad], Pais_Nacionalidad.[Id Pais1888] AS IdPaisNacionalidad, Pais_Nacionalidad.Codigo AS CodigoPaisNacionalidad, 
                  Pais_Nacionalidad.Nombre AS NombrePaisNACIONALIDAD, [Pais Recidencia].[Id Pais1888] AS IdPaisRecidencia, [Pais Recidencia].Codigo AS CodigoPaisRecidencia, [Pais Recidencia].Nombre AS NombrePaisRecidencia, 
                  [Ciudad Recidencia].[Id Ciudad1888] AS IdMunicipioRecidencia, [Ciudad Recidencia].Codigo AS CodigoMunicipioRecidencia, [Ciudad Recidencia].Nombre AS NombreMunicipioRecidencia, 
                  dbo.[Zona Residencia].[Id Zona Residencia] AS IdZonaResidencia, dbo.[Zona Residencia].[Descripción Zona Residencia] AS DescripciónZonaResidencia, dbo.[Zona Residencia].[Código Zona Residencia] AS CódigoZonaResidencia, 
                  dbo.[Zona Residencia].[Zona Residencia] AS ZonaResidencia, dbo.Etnia.[Id Etnia] AS IdEtnia, dbo.Etnia.[Código Etnia] AS CódigoEtnia, dbo.Etnia.Etnia, dbo.Etnia.[Descripción Etnia] AS DescripciónEtnia, 
                  dbo.Discapacidad.[Id Discapacidad] AS IdDiscapacidad, dbo.Discapacidad.Codigo, dbo.Discapacidad.Discapacidad, dbo.Discapacidad.[Descripcion Discapacidad] AS DescripcionDiscapacidad, 
                  dbo.Ocupación.[Id Ocupación] AS IdOcupación, dbo.Ocupación.[Código Ocupación] AS CódigoOcupación, dbo.Ocupación.Ocupación, dbo.Ocupación.[Descripción Ocupación] AS DescripciónOcupación
FROM     dbo.Discapacidad RIGHT OUTER JOIN
                  dbo.[Tipo de Documento] RIGHT OUTER JOIN
                  dbo.Entidad INNER JOIN
                  dbo.EntidadII ON dbo.Entidad.[Documento Entidad] = dbo.EntidadII.[Documento Entidad] INNER JOIN
                  dbo.EntidadVI ON dbo.Entidad.[Documento Entidad] = dbo.EntidadVI.[Documento Entidad] INNER JOIN
                  dbo.Ocupación ON dbo.EntidadVI.[Id Ocupación] = dbo.Ocupación.[Id Ocupación] ON dbo.[Tipo de Documento].[Id Tipo de Documento] = dbo.Entidad.[Id Tipo de Documento] LEFT OUTER JOIN
                  dbo.Etnia LEFT OUTER JOIN
                  dbo.Entidad1888 ON dbo.Etnia.[Id Etnia] = dbo.Entidad1888.[Id Etnia] RIGHT OUTER JOIN
                  dbo.País1888 AS [Pais Recidencia] ON dbo.Entidad1888.[Id Pais Recidencia] = [Pais Recidencia].[Id Pais1888] LEFT OUTER JOIN
                  dbo.Ciudad1888 AS [Ciudad Recidencia] ON dbo.Entidad1888.[Id Municipio Recidencia] = [Ciudad Recidencia].[Id Ciudad1888] RIGHT OUTER JOIN
                  dbo.País1888 AS Pais_Nacionalidad ON dbo.Entidad1888.[Id Pais Nacionalidad] = Pais_Nacionalidad.[Id Pais1888] ON dbo.Entidad.[Documento Entidad] = dbo.Entidad1888.[Documento Entidad] LEFT OUTER JOIN
                  dbo.[Sexo Identidad Genero] ON dbo.Entidad1888.[Id Identidad Genero] = dbo.[Sexo Identidad Genero].[Id Sexo Identidad Genero] ON dbo.Discapacidad.[Id Discapacidad] = dbo.Entidad1888.[Id Discapacidad] FULL OUTER JOIN
                  dbo.[Zona Residencia] FULL OUTER JOIN
                  dbo.EntidadIII AS EntidadIII_1 ON dbo.[Zona Residencia].[Id Zona Residencia] = EntidadIII_1.[Id Zona Residencia] ON dbo.Entidad.[Documento Entidad] = EntidadIII_1.[Documento Entidad] FULL OUTER JOIN
                  dbo.Sexo ON EntidadIII_1.[Id Sexo] = dbo.Sexo.[Id Sexo]
GO





-- CREACION DEL PROCEDIMIENTO ALMACENADO PARA GUARDAR LOS DATOS DEL PACIENTE EN LA ENTIDAD1888
-- Aun no esta temrinado se debe modular y se debe hacer un update  por cada dato nuevo ingresado la idea es solo un pa que sea secuencial y que vaya actualizando cada campo nuevo ingresado en la entidad1888

CREATE PROCEDURE  sp_Paciente_Guardar
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
           SET E.[Primer Apellido Entidad] = @PrimerApellido,
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
               E1888.[Id Discapacidad] = @IdDiscapacidad
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
           SET E6.[Id Ocupación] = @IdOcupacion
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



-- Alter table to add Alergeno column
-- Se agrega la columna Alergeno a la tabla Entidad1888 para almacenar información sobre alergias específicas del paciente, con un tamaño máximo de 200 caracteres y permitiendo valores nulos.
alter table [entidad1888] add Alergeno varchar (200) null


-------------------------------------------------------------------
    -- ETNTIDADES SGSSS
    -------------------------------------------------------------------


/*==============================================================
  1) ELIMINAR TABLAS SI YA EXISTEN
==============================================================*/
IF OBJECT_ID('dbo.[Entidades sgsss 1888]', 'U') IS NOT NULL
    DROP TABLE dbo.[Entidades sgsss 1888];
GO

IF OBJECT_ID('dbo.[Regimen]', 'U') IS NOT NULL
    DROP TABLE dbo.[Regimen];
GO

    DROP TABLE dbo.[Regimen];
    DROP TABLE dbo.[Entidades sgsss 1888];


/*==============================================================
  2) TABLA DE REGIMEN
==============================================================*/
CREATE TABLE dbo.[Regimen]
(
    [Id Regimen]             INT IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(100) NOT NULL,
    [Id Estado]        INT NOT NULL,
    CONSTRAINT UQ_Regimen_Nombre UNIQUE (Nombre)
);
GO

/*==============================================================
  3) TABLA DE ENTIDADES SGSSS
==============================================================*/
CREATE TABLE dbo.[Entidades sgsss 1888]
(
    [Id sgsss]            INT IDENTITY(1,1) PRIMARY KEY,
    Codigo          NVARCHAR(20) NOT NULL,
    Nombre          NVARCHAR(500) NOT NULL,
    [Id Estado]        INT NOT NULL,
    [Id Regimen]       INT NOT NULL,
    CONSTRAINT FK_EntidadesSGSSS_Regimen
        FOREIGN KEY ([Id Regimen]) REFERENCES dbo.[Regimen]([Id Regimen]),
    CONSTRAINT UQ_EntidadesSGSSS_Codigo UNIQUE (Codigo)
);
GO

/*==============================================================
  4) INSERTAR REGIMENES
==============================================================*/
INSERT INTO dbo.[Regimen] (Nombre, [Id Estado])
VALUES
    (N'Contributivo', 1),
    (N'Subsidiado', 1);
GO

DECLARE @IdRegimenContributivo INT = (SELECT [Id Regimen] FROM dbo.[Regimen] WHERE Nombre = N'Contributivo');
DECLARE @IdRegimenSubsidiado  INT = (SELECT [Id Regimen] FROM dbo.[Regimen] WHERE Nombre = N'Subsidiado');

/*==============================================================
  5) INSERTAR ENTIDADES - RÉGIMEN CONTRIBUTIVO
==============================================================*/
INSERT INTO dbo.[Entidades sgsss 1888] (Codigo, Nombre, [Id Estado], [Id Regimen])
VALUES
(N'CCFC07', N'CAJA DE COMPENSACIÓN FAMILIAR DE CARTAGENA Y BOLÍVAR COMFAMILIAR -CM', 1, @IdRegimenContributivo),
(N'CCFC20', N'CAJA DE COMPENSACIÓN FAMILIAR DEL CHOCÓ -CM', 1, @IdRegimenContributivo),
(N'CCFC23', N'CAJA DE COMPENSACIÓN FAMILIAR DE LA GUAJIRA "COMFAGUAJIRA" -CM', 1, @IdRegimenContributivo),
(N'CCFC24', N'CAJA DE COMPENSACIÓN FAMILIAR DEL HUILA "COMFAMILIAR" -CM', 1, @IdRegimenContributivo),
(N'CCFC27', N'CAJA DE COMPENSACIÓN FAMILIAR DE NARIÑO -CM', 1, @IdRegimenContributivo),
(N'CCFC33', N'CAJA DE COMPENSACIÓN FAMILIAR DE SUCRE -CM', 1, @IdRegimenContributivo),
(N'CCFC50', N'CAJA DE COMPENSACIÓN FAMILIAR DEL ORIENTE COLOMBIANO "COMFAORIENTE" -CM', 1, @IdRegimenContributivo),
(N'CCFC53', N'CAJA DE COMPENSACIÓN FAMILIAR DE CUNDINAMARCA "COMFACUNDI" -CM', 1, @IdRegimenContributivo),
(N'CCFC55', N'CAJA DE COMPENSACIÓN FAMILIAR CAJACOPI ATLÁNTICO -CM', 1, @IdRegimenContributivo),
(N'EAS016', N'EMPRESAS PUBLICAS DE MEDELLIN - DEPARTAMENTO MEDICO', 1, @IdRegimenContributivo),
(N'EAS027', N'FONDO PASIVO SOCIAL DE LOS FERROCARRILES NACIONALES', 1, @IdRegimenContributivo),
(N'EPS001', N'ALIANSALUD EPS S.A.', 1, @IdRegimenContributivo),
(N'EPS002', N'SALUD TOTAL ENTIDAD PROMOTORA DE SALUD DEL REGIMEN CONTRIBUTIVO Y DEL REGIMEN SUBSIDIADO S.A.', 1, @IdRegimenContributivo),
(N'EPS005', N'ENTIDAD PROMOTORA DE SALUD SANITAS S.A.S.', 1, @IdRegimenContributivo),
(N'EPS008', N'CAJA DE COMPENSACIÓN FAMILIAR COMPENSAR', 1, @IdRegimenContributivo),
(N'EPS010', N'EPS SURAMERICANA S.A.', 1, @IdRegimenContributivo),
(N'EPS012', N'CAJA DE COMPENSACION FAMILIAR DEL VALLE DEL CAUCA "COMFENALCO VALLE DE LA GENTE"', 1, @IdRegimenContributivo),
(N'EPS016', N'COOMEVA ENTIDAD PROMOTORA DE SALUD S.A. "COOMEVA E.P.S. S.A."', 1, @IdRegimenContributivo),
(N'EPS017', N'EPS FAMISANAR S.A.S.', 1, @IdRegimenContributivo),
(N'EPS018', N'ENTIDAD PROMOTORA DE SALUD SERVICIO OCCIDENTAL DE SALUD S.A. S.O.S.', 1, @IdRegimenContributivo),
(N'EPS037', N'NUEVA EPS S.A.', 1, @IdRegimenContributivo),
(N'EPS040', N'ALIANZA MEDELLIN ANTIOQUIA EPS S.A.S. "SAVIA SALUD EPS" -CM', 1, @IdRegimenContributivo),
(N'EPS041', N'NUEVA EPS S.A. -CM', 1, @IdRegimenContributivo),
(N'EPS042', N'COOSALUD EPS S.A.', 1, @IdRegimenContributivo),
(N'EPS044', N'MEDIMAS EPS S.A.S.', 1, @IdRegimenContributivo),
(N'EPS045', N'MEDIMAS EPS S.A.S. -CM', 1, @IdRegimenContributivo),
(N'EPS046', N'FUDACIÓN SALUD MIA', 1, @IdRegimenContributivo),
(N'EPS048', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS', 1, @IdRegimenContributivo),
(N'EPSC22', N'ENTIDAD PROMOTORA DE SALUD DEL REGIMEN SUBSIDIADO EPS CONVIDA -CM', 1, @IdRegimenContributivo),
(N'EPSC25', N'CAPRESOCA E.P.S. -CM', 1, @IdRegimenContributivo),
(N'EPSC34', N'CAPITAL SALUD ENTIDAD PROMOTORA DE SALUD DEL RÉGIMEN SUBSIDIADO SAS "CAPITAL SALUD EPS-S S.A.S." -CM', 1, @IdRegimenContributivo),
(N'EPSIC1', N'ASOCIACIÓN DE CABILDOS INDÍGENAS DEL CESAR Y GUAJIRA "DUSAKAWI A.R.S.I." -CM', 1, @IdRegimenContributivo),
(N'EPSIC3', N'ASOCIACIÓN INDÍGENA DEL CAUCA A.I.C. EPSI -CM', 1, @IdRegimenContributivo),
(N'EPSIC4', N'EMPRESA PROMOTORA DE SALUD INDÍGENA ANAS WAYUU EPSI -CM', 1, @IdRegimenContributivo),
(N'EPSIC5', N'ENTIDAD PROMOTORA DE SALUD MALLAMAS EPSI -CM', 1, @IdRegimenContributivo),
(N'EPSIC6', N'PIJAOS SALUD EPSI -CM', 1, @IdRegimenContributivo),
(N'ESSC07', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS -CM', 1, @IdRegimenContributivo),
(N'ESSC18', N'EMSSANAR S.A.S. -CM', 1, @IdRegimenContributivo),
(N'ESSC24', N'COOSALUD EPS S.A. -CM', 1, @IdRegimenContributivo),
(N'ESSC33', N'COOPERATIVA DE SALUD COMUNITARIA EMPRESA PROMOTORA SUBSIDIADA "COMPARTA EPS-S" -CM', 1, @IdRegimenContributivo),
(N'ESSC62', N'ASMET SALUD EPS S.A.S. -CM', 1, @IdRegimenContributivo),
(N'ESSC76', N'ASOCIACIÓN MUTUAL BARRIOS UNIDOS DE QUIBDO AMBUQ EPS - S - ESS - CM', 1, @IdRegimenContributivo),
(N'ESSC91', N'ECOOPSOS EPS SAS -CM', 1, @IdRegimenContributivo);
GO

/*==============================================================
  6) INSERTAR ENTIDADES - RÉGIMEN SUBSIDIADO
==============================================================*/
DECLARE @IdRegimenSubsidiado2 INT = (SELECT [Id Regimen] FROM dbo.[Regimen] WHERE Nombre = N'Subsidiado');

INSERT INTO dbo.[Entidades sgsss 1888] (Codigo, Nombre, [Id Estado], [Id Regimen])
VALUES
(N'CCF007', N'CAJA DE COMPENSACIÓN FAMILIAR DE CARTAGENA Y BOLÍVAR COMFAMILIAR', 1, @IdRegimenSubsidiado2),
(N'CCF023', N'CAJA DE COMPENSACIÓN FAMILIAR DE LA GUAJIRA "COMFAGUAJIRA"', 1, @IdRegimenSubsidiado2),
(N'CCF024', N'CAJA DE COMPENSACIÓN FAMILIAR DEL HUILA "COMFAMILIAR"', 1, @IdRegimenSubsidiado2),
(N'CCF027', N'CAJA DE COMPENSACIÓN FAMILIAR DE NARIÑO', 1, @IdRegimenSubsidiado2),
(N'CCF033', N'CAJA DE COMPENSACIÓN FAMILIAR DE SUCRE', 1, @IdRegimenSubsidiado2),
(N'CCF050', N'CAJA DE COMPENSACIÓN FAMILIAR DEL ORIENTE COLOMBIANO "COMFAORIENTE"', 1, @IdRegimenSubsidiado2),
(N'CCF053', N'CAJA DE COMPENSACIÓN FAMILIAR DE CUNDINAMARCA "COMFACUNDI"', 1, @IdRegimenSubsidiado2),
(N'CCF055', N'CAJA DE COMPENSACIÓN FAMILIAR CAJACOPI ATLÁNTICO', 1, @IdRegimenSubsidiado2),
(N'CCF102', N'CAJA DE COMPENSACIÓN FAMILIAR DEL CHOCÓ', 1, @IdRegimenSubsidiado2),
(N'EPS022', N'ENTIDAD PROMOTORA DE SALUD DEL REGIMEN SUBSIDIADO EPS CONVIDA', 1, @IdRegimenSubsidiado2),
(N'EPS025', N'CAPRESOCA E.P.S.', 1, @IdRegimenSubsidiado2),
(N'EPSI01', N'ASOCIACIÓN DE CABILDOS INDÍGENAS DEL CESAR Y GUAJIRA "DUSAKAWI A.R.S.I."', 1, @IdRegimenSubsidiado2),
(N'EPSI03', N'ASOCIACIÓN INDÍGENA DEL CAUCA A.I.C. EPSI', 1, @IdRegimenSubsidiado2),
(N'EPSI04', N'EMPRESA PROMOTORA DE SALUD INDÍGENA ANAS WAYUU EPSI', 1, @IdRegimenSubsidiado2),
(N'EPSI05', N'ENTIDAD PROMOTORA DE SALUD MALLAMAS EPSI', 1, @IdRegimenSubsidiado2),
(N'EPSI06', N'PIJAOS SALUD EPSI', 1, @IdRegimenSubsidiado2),
(N'EPSS01', N'ALIANSALUD EPS S.A. -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS02', N'SALUD TOTAL ENTIDAD PROMOTORA DE SALUD DEL REGIMEN CONTRIBUTIVO Y DEL REGIMEN SUBSIDIADO S.A. -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS05', N'ENTIDAD PROMOTORA DE SALUD SANITAS S.A.S. -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS08', N'CAJA DE COMPENSACIÓN FAMILIAR COMPENSAR -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS10', N'EPS SURAMERICANA S.A. -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS12', N'CAJA DE COMPENSACION FAMILIAR DEL VALLE DEL CAUCA "COMFENALCO VALLE DE LA GENTE" -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS16', N'COOMEVA ENTIDAD PROMOTORA DE SALUD S.A. "COOMEVA E.P.S. S.A." -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS17', N'EPS FAMISANAR S.A.S. -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS18', N'ENTIDAD PROMOTORA DE SALUD SERVICIO OCCIDENTAL DE SALUD S.A. S.O.S. -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS34', N'CAPITAL SALUD ENTIDAD PROMOTORA DE SALUD DEL RÉGIMEN SUBSIDIADO SAS "CAPITAL SALUD EPS-S S.A.S."', 1, @IdRegimenSubsidiado2),
(N'EPSS37', N'NUEVA EPS S.A. -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS40', N'ALIANZA MEDELLIN ANTIOQUIA EPS S.A.S. "SAVIA SALUD EPS"', 1, @IdRegimenSubsidiado2),
(N'EPSS41', N'NUEVA EPS S.A.', 1, @IdRegimenSubsidiado2),
(N'EPSS42', N'COOSALUD EPS S.A. -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS44', N'MEDIMAS EPS S.A.S. -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS45', N'MEDIMAS EPS S.A.S.', 1, @IdRegimenSubsidiado2),
(N'EPSS46', N'FUDACIÓN SALUD MIA -CM', 1, @IdRegimenSubsidiado2),
(N'EPSS48', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS -CM', 1, @IdRegimenSubsidiado2),
(N'ESS024', N'COOSALUD EPS S.A.', 1, @IdRegimenSubsidiado2),
(N'ESS062', N'ASMET SALUD EPS S.A.S.', 1, @IdRegimenSubsidiado2),
(N'ESS076', N'ASOCIACIÓN MUTUAL BARRIOS UNIDOS DE QUIBDO AMBUQ EPS - S - ESS', 1, @IdRegimenSubsidiado2),
(N'ESS091', N'ECOOPSOS EPS SAS', 1, @IdRegimenSubsidiado2),
(N'ESS118', N'EMSSANAR S.A.S.', 1, @IdRegimenSubsidiado2),
(N'ESS133', N'COOPERATIVA DE SALUD COMUNITARIA EMPRESA PROMOTORA SUBSIDIADA "COMPARTA EPS-S"', 1, @IdRegimenSubsidiado2),
(N'ESS207', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS', 1, @IdRegimenSubsidiado2);
GO

/*==============================================================
  7) CONSULTA DE VALIDACIÓN
==============================================================*/
SELECT 
    E.Id,
    E.Codigo,
    E.Nombre,
    E.IdEstado,
    R.Nombre AS Regimen
FROM dbo.[Entidades sgsss 1888] E
INNER JOIN dbo.[Regimen] R
    ON E.IdRegimen = R.Id
ORDER BY R.Nombre, E.Codigo;
GO

-------------------------------------------------------------------
    -- FINAL ETNTIDADES SGSSS
    -------------------------------------------------------------------
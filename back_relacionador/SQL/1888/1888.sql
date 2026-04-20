

CREATE TABLE [Entidad1888](
	[Id Entidad1888] [int] IDENTITY(1,1) NOT NULL,
	[Documento Entidad] [nvarchar](50) NULL,
	[Id Identidad Genero] int  null,
	[Talla] varchar(10)  null ,
	[Peso] varchar(10)  null ,
	[Id Etnia] int  null,
	[Comunidad Etnica] varchar (50)  null,
	[Id Discapacidad] int  null,
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

CREATE TABLE [dbo].[Etnia](
	[Id Etnia] [int] IDENTITY(1,1) PRIMARY KEY,
	[Código Etnia] [nvarchar](50) NULL,
	[Etnia] [nvarchar](200) NULL,
	[Descripción Etnia] [nvarchar](200) NULL,
	[Orden Etnia] [int] NULL,
	[Id Estado] [int] NULL
) ON [PRIMARY]
GO


select * from etnia

Create table [Sexo Identidad Genero](
[Id Sexo Identidad Genero] int identity(1,1) primary key not null,
 [Codigo] varchar (10) Null, 
 [Identidad Genero] varchar (30) Null,
 [Descripcion Identidad Genero] varchar (60) Null,
 [Id Estado] int Null

)

-- alter table Entidad1888 
-- add constraint Fg_IdentidadGenero 
-- foreign key ([Id Identidad Genero])
-- references [Sexo Identidad Genero]


-- alter table Entidad1888
-- add constraint fg_Etnia 
-- foreign key ([Id Etnia])
-- references Etnia


-- alter table Entidad1888
--  add constraint fg_Discapacidad
--  foreign key ([Id Discapacidad])
--  references Discapacidad



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






ALTER VIEW [dbo].[Cnsta Relacionador Usuarios Info]
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
	@IdOcupacion INT	-- EntidadVI


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

CREATE VIEW [dbo].[Cnsta Entidad SSGSSS 1888]
AS
SELECT dbo.[Entidades sgsss 1888].[Id sgsss] AS Idsgsss, dbo.[Entidades sgsss 1888].Codigo, dbo.[Entidades sgsss 1888].Nombre, dbo.[Entidades sgsss 1888].[Id Estado] AS IdEstado, dbo.[Entidades sgsss 1888].[Id Regimen] AS IdRegimen, 
                  dbo.Regimen.Nombre AS NombreRegimen, dbo.[Entidades sgsss 1888].Nombre + ' (' + dbo.Regimen.Nombre + ') ' AS Descripcion
FROM     dbo.[Entidades sgsss 1888] INNER JOIN
                  dbo.Regimen ON dbo.[Entidades sgsss 1888].[Id Regimen] = dbo.Regimen.[Id Regimen]
GO





-- Create table [Tipo Antecedentes 1888] (
-- [ID Tipo Antecedentes 1888] INT PRIMARY KEY IDENTITY (1,1) ,
-- [Codigo] varchar (2), 
-- [Descripcion] Varchar (150),
-- [Id Estado] int
-- )

-- Insert into [Tipo Antecedentes 1888]
-- values
-- ('01', 'Antecedentes de Salud', 7),
-- ('02', 'Antecedentes Familiares', 7),
-- ('03', 'Antecedentes Farmacológicos', 7) 


-- CREATE TABLE [Antecedentes 1888] (
--     [ID Antecedente 1888] INT PRIMARY KEY IDENTITY (1,1),
--     [ID Tipo Antecedentes 1888] INT,
--     [Parentesco] VARCHAR(100),
--     [Documento Entidad] nVARCHAR(50),
--     [Descripcion] VARCHAR(200),
--     [Id Estado] INT,

--     CONSTRAINT FK_ANTECEDENTES_ENTIDAD
--     FOREIGN KEY ([Documento Entidad])
--     REFERENCES ENTIDAD([Documento Entidad]),

--     CONSTRAINT FK_Antecedentes_TipoAntecedente
--     FOREIGN KEY ([ID Tipo Antecedentes 1888])
--     REFERENCES [Tipo Antecedentes 1888]([ID Tipo Antecedentes 1888])
-- );


CREATE VIEW [dbo].[Cnsta Empresa 1888]
AS
SELECT [Id Empresa] AS IdEmpresa, [Documento Empresa] AS DocumentoEmpresa, [Id Tipo de Documento] AS IdTipodeDocumento, [Fecha Expedición Empresa] AS FechaExpediciónEmpresa, [Id Ciudad] AS IdCiudad, 
                  [Nombre Comercial Empresa] AS NombreComercialEmpresa, [Razon Social Empresa] AS RazonSocialEmpresa, [Fecha Inscripción Empresa] AS [FechaInscripción}Empresa], [Código Empresa] AS CódigoEmpresa, 
                  [Observaciones Empresa] AS ObservacionesEmpresa, [Foto Empresa] AS FotoEmpresa, [Id Estado] AS IdEstado, NroIDPrestador
FROM     dbo.Empresa
GO


create table [Entidades Prepagadas 1888]
(
[Id Entidades Prepagadas 1888] int identity(1,1) primary key,
[Codigo] varchar (50),
[Nombre]varchar (150),
[Id Estado] int default 7
)


INSERT INTO [Entidades Prepagadas 1888] (Codigo, Nombre)
VALUES
('EMP002','MEDPLUS MEDICINA PREPAGADA S.A.'),
('EMP012','HUMANA GOLDEN CROSS S.A. MEDICINA PREPAGADA'),
('EMP014','MEDISALUD - COMPAÑÍA COLOMBIANA DE MEDICINA PREPAGADA S.A. (en liquidación)'),
('EMP015','MEDISANITAS S A COMPAÑIA DE MEDICINA PREPAGADA'),
('EMP017','COLMEDICA MEDICINA PREPAGADA'),
('EMP021','EPS Y MEDICINA PREPAGADA SURAMERICANA S.A.'),
('EMP022','VIVIR S.A.'),
('EMP023','COMPAÑIA DE MEDICINA PREPAGADA COLSANITAS S.A.'),
('EMP024','SERVICIO DE SALUD INMEDIATO MEDICINA PREPAGADA S.A.'),
('EMP025','PLAN U.H.C.M. MEDICINA PREPAGADA COMFENALCO VALLE'),
('EMP028','COOMEVA MEDICINA PREPAGADA S.A.'),
('EMP029','COLPATRIA MEDICINA PREPAGADA S.A.'),
('SAP008','EMERGENCIA MEDICA INTEGRAL COLOMBIA S.A.'),
('SAP026','EMERMEDICA S.A. SERVICIOS DE AMBULANCIA PREPAGADOS'),
('SAP030','EMPRESA DE MEDICINA INTEGRAL EMI SA SERVICIO DE AMBULANCIA PREPAGADA'),
('SAP031','ASISTENCIA MEDICA INMEDIATA-SERVICIO DE AMBULANCIA PREPAGADA S.A.'),
('SAP032','SERVICIO DE EMERGENCIAS REGIONAL (SERVICIO DE AMBULANCIA PREPAGADO) S.A.'),
('SAP033','COOMEVA EMERGENCIAS MÉDICAS'),
('SAP034','ASISTENCIA MEDICA SAS SERVICIO DE AMBULANCIA PREPAGADO'),
('SAP035','SERVICIO DE ASISTENCIA MEDICA INMEDIATA S.A. - SERVICIO DE AMBULANCIA PREPAGADO'),
('SAP036','SISTEMA DE TRASLADO APOYO DIAGNOSTICO Y TERAPEUTICO EN SALUD TRASMEDICA S.A. S.A.P. EN LIQUIDACION'),
('SAP037','SERVICIOS MEDICOS INTEGRALES DE COLOMBIA SERVICIO DE AMBULANCIAS PREPAGADO S.A.S “SEMI SAP S.A.S.”'),
('SAP038','RED MEDICA MÉDICA VITAL S.A.S. SERVICIO DE AMBULANCIA PREPAGADO (SAP)');





CREATE VIEW [dbo].[Cnsta Entidades Prepagadas 1888]
AS
SELECT [Id Entidades Prepagadas 1888] AS IdEntidadesPrepagadas1888, Codigo, Nombre, [Id Estado] AS IdEstado
FROM     dbo.[Entidades Prepagadas 1888]
GO


CREATE VIEW [dbo].[Cnsta sgsss 1888]
AS
SELECT [Id sgsss] AS Idsgsss, Codigo, Nombre, [Id Estado] AS IdEstado
FROM     dbo.[Entidades sgsss 1888]
WHERE  ([Id Estado] = 7)
GO


CREATE TABLE [Antecedentes Salud 1888] (
    [ID Antecedente Salud 1888] INT PRIMARY KEY IDENTITY(1,1),
    [Documento Entidad] NVARCHAR(50) NOT NULL,
    [Descripcion] VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL,

    CONSTRAINT FK_AntecedentesSalud_Entidad
    FOREIGN KEY ([Documento Entidad])
    REFERENCES ENTIDAD([Documento Entidad])
);

CREATE TABLE [Antecedentes Familiares 1888] (
    [ID Antecedente Familiar 1888] INT PRIMARY KEY IDENTITY(1,1),
    [Documento Entidad] NVARCHAR(50) NOT NULL, 
    [Parentesco] VARCHAR(100) NULL,
    [Descripcion] VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL,

    CONSTRAINT FK_AntecedentesFamiliares_Entidad
    FOREIGN KEY ([Documento Entidad])
    REFERENCES ENTIDAD([Documento Entidad]),
 
);



CREATE TABLE [Antecedentes Farmacologicos 1888] (
    [ID Antecedente Farmacologico 1888] INT PRIMARY KEY IDENTITY(1,1),
    [Documento Entidad] NVARCHAR(50) NOT NULL,
    [Descripcion] VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL,

    CONSTRAINT FK_AntecedentesFarmacologicos_Entidad
    FOREIGN KEY ([Documento Entidad])
    REFERENCES ENTIDAD([Documento Entidad])
);



CREATE VIEW [dbo].[Cnsta Medicamentos DCI 1888]
AS
SELECT [ID Medicamento DCI 1888] AS IDMedicamentoDCI1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM     dbo.[Medicamento DCI 1888]
WHERE  ([Id Estado] = 7)
GO



CREATE VIEW [dbo].[Cnsta Cups 1888]
AS
SELECT Tabla, Codigo, Nombre, Descripcion, Tipo
FROM     dbo.[Rips Cups]
GO



Create Table [Evaluacion Entidad RDA]
(
    [Id Evaluacion Entidad RDA]       INT          IDENTITY(1,1) PRIMARY KEY,
    [Documento Entidad]               VARCHAR(50)  NULL,
    [Fecha RDA]                       DATETIME     NOT NULL,   -- Fecha de ingreso/creación del RDA
    [Id Tipo Documento]               INT          NULL,
    [Primer Apellido Entidad]         NVARCHAR(100) NULL,
    [Segundo Apellido Entidad]        NVARCHAR(100) NULL,
    [Primer Nombre Entidad]           NVARCHAR(100) NULL,
    [Segundo Nombre Entidad]          NVARCHAR(50)  NULL,
    [Fecha Nacimiento]                DATETIME     NULL,
    [Edad]                            FLOAT        NULL,
    [Id Unidad de Medida Edad]        INT          NULL,
    [Id Sexo Biologico]               INT          NULL,
    [Id Identidad Genero]             INT          NOT NULL DEFAULT 0,
    [Id Pais Nacionalidad]            INT          NULL,
    [Talla]                           VARCHAR(10)  NOT NULL DEFAULT '0',
    [Peso]                            VARCHAR(10)  NOT NULL DEFAULT '0',
    [Id Pais Recidencia]              INT          NULL,
    [Id Municipio Recidencia]         INT          NULL,
    [Id Zona Residencia]              INT          NULL,
    [Dirección]                       NVARCHAR(255) NULL,
    [Id Etnia]                        INT          NOT NULL DEFAULT 0,
    [Comunidad Etnica]                VARCHAR(50)  NOT NULL DEFAULT '',
    [Id Discapacidad]                 INT          NOT NULL DEFAULT 0,
    [Teléfono Celular]                NVARCHAR(50) NULL,
    [Alergeno]                        VARCHAR(200) NULL,
    -- Campos RDA Paciente (Resolución 1888)
    [Codigo Prestador]                NVARCHAR(50)  NULL,
    [Codigo Admin Plan Beneficios]    NVARCHAR(50)  NULL,
    [Nombre Admin Plan Beneficios]    NVARCHAR(200) NULL,
    [Fecha Hora Inicio Atencion]      DATETIME     NULL,
    [Fecha Hora Fin Atencion]         DATETIME     NULL,
    [Tipo Doc Profesional]            VARCHAR(10)  NULL,
    [Num Doc Profesional]             NVARCHAR(50) NULL,
    [Diagnostico Ingreso CIE11 Codigo] NVARCHAR(50)  NULL,
    [Diagnostico Ingreso CIE11 Termino] NVARCHAR(200) NULL,
    [Tipo Alergia]                    VARCHAR(5)   NULL,
    -- Contexto atención / custodian IPS (FHIR CompositionPatientStatementRDA + CareDeliveryOrganizationRDA)
    [Id Modalidad Atencion]           INT          NULL,
    [Id Grupo Servicios]              INT          NULL,
    [NIT Prestador IPS]               NVARCHAR(20) NULL,
    [Nombre Prestador IPS]            NVARCHAR(200) NULL
)

-- ============================================================================
-- RDA CONSULTA EXTERNA (Res. 1888) — equivalente a esta tabla pero solo datos CE:
--   Principal: [Evaluacion Entidad RDA Consulta Externa]  (CREATE ~ línea 985)
--   Listas:    [Evaluacion Entidad RDA CE ...]            (antecedentes, Dx rel., prescr., etc.)
-- Script listo para ejecutar aparte:  SQL/Evaluacion Entidad RDA Consulta Externa - CREATE.sql
-- API Node:  POST /apiV3/EvaluacionEntidadRDACE/  →  server/routes/Asignar_RipsRoutes V3.js
-- ============================================================================

-- Si la tabla ya existe, ejecutar estos ALTER TABLE para agregar las columnas nuevas:
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Codigo Prestador]                NVARCHAR(50)  NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Codigo Admin Plan Beneficios]    NVARCHAR(50)  NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Nombre Admin Plan Beneficios]    NVARCHAR(200) NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Fecha Hora Inicio Atencion]      DATETIME     NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Fecha Hora Fin Atencion]         DATETIME     NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Tipo Doc Profesional]            VARCHAR(10)  NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Num Doc Profesional]             NVARCHAR(50) NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Diagnostico Ingreso CIE11 Codigo]  NVARCHAR(50)  NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Diagnostico Ingreso CIE11 Termino] NVARCHAR(200) NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Tipo Alergia]                    VARCHAR(5)   NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Id Modalidad Atencion]           INT          NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Id Grupo Servicios]            INT          NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [NIT Prestador IPS]             NVARCHAR(20) NULL;
-- ALTER TABLE [Evaluacion Entidad RDA] ADD [Nombre Prestador IPS]          NVARCHAR(200) NULL;







CREATE TABLE [Evaluacion Entidad RDA Antecedentes Salud] (
    [ID Antecedente Salud] INT PRIMARY KEY IDENTITY(1,1),
    [Id Evaluacion Entidad RDA] INT ,
    [Documento Entidad] NVARCHAR(50) NOT NULL,
    [Descripcion] VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL,

    

     CONSTRAINT FK_evaentrdaAntecedentesSalud
    FOREIGN KEY ([Id Evaluacion Entidad RDA])
    REFERENCES [Evaluacion Entidad RDA]([Id Evaluacion Entidad RDA])
);

CREATE TABLE [Evaluacion Entidad RDA Antecedentes Familiares] (
    [ID Antecedente Familiar] INT PRIMARY KEY IDENTITY(1,1),
    [Id Evaluacion Entidad RDA] INT ,

    [Documento Entidad] NVARCHAR(50) NOT NULL, 
    [Parentesco] VARCHAR(100) NULL,
    [Descripcion] VARCHAR(200) NOT NULL,
    [CIE11 Codigo] NVARCHAR(50) NULL,
    [CIE11 Termino] NVARCHAR(300) NULL,
    [Id Estado] INT NOT NULL,

   

     CONSTRAINT FK_evaentrdaAntecedentesFamiliares
    FOREIGN KEY ([Id Evaluacion Entidad RDA])
    REFERENCES [Evaluacion Entidad RDA]([Id Evaluacion Entidad RDA])
 
);



CREATE TABLE [Evaluacion Entidad RDA Antecedentes Farmacologicos] (
    [ID Antecedente Farmacologico] INT PRIMARY KEY IDENTITY(1,1),
    [Id Evaluacion Entidad RDA] INT ,
    [Documento Entidad] NVARCHAR(50) NOT NULL,
    [Descripcion] VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL,


   CONSTRAINT FK_evaentrdaAntecedentesFarmacologicos
    FOREIGN KEY ([Id Evaluacion Entidad RDA])
    REFERENCES [Evaluacion Entidad RDA]([Id Evaluacion Entidad RDA])
);


-- =============================================================================
-- RDA CONSULTA EXTERNA — Tabla principal + hijas (misma lógica que RDA Paciente)
-- Idempotente: solo crea si el objeto no existe (reejecutar 1888.sql no falla aquí).
-- Si la tabla principal ya existía sin columnas nuevas, usar alter-evaluacion-entidad-rdace-rips-context.sql
-- =============================================================================

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa](
        [Id Evaluacion Entidad RDA Consulta Externa] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Entidad]               NVARCHAR(50)  NOT NULL,
        [Fecha RDA]                       DATETIME      NOT NULL,
        [Codigo Prestador]                NVARCHAR(50)  NULL,
        [Codigo Admin Plan Beneficios]    NVARCHAR(50)  NULL,
        [Nombre Admin Plan Beneficios]    NVARCHAR(200) NULL,
        [Fecha Hora Inicio Atencion]      DATETIME      NULL,
        [Fecha Hora Fin Atencion]         DATETIME      NULL,
        [Tipo Doc Profesional]            VARCHAR(10)   NULL,
        [Num Doc Profesional]             NVARCHAR(50)  NULL,
        [Diagnostico Ingreso CIE11 Codigo] NVARCHAR(50)  NULL,
        [Diagnostico Ingreso CIE11 Termino] NVARCHAR(500) NULL,
        [Tipo Alergia]                    VARCHAR(10)   NULL,
        [Entorno Atencion]                NVARCHAR(50)  NULL,
        [Tipo Factor Riesgo]              NVARCHAR(50)  NULL,
        [Nombre Factor Riesgo]            NVARCHAR(300) NULL,
        [Diagnostico Principal CIE10 Codigo] NVARCHAR(20) NULL,
        [Diagnostico Principal CIE10 Nombre] NVARCHAR(500) NULL,
        [Tipo Diagnostico Principal]      NVARCHAR(20)  NULL,
        [Condicion Destino Egreso]        NVARCHAR(50)  NULL,
        [Codigo Prestador Remite]         NVARCHAR(50)  NULL,
        [Alcance Incapacidad]             NVARCHAR(20)  NULL,
        [Dias Incapacidad]                INT           NULL,
        [Dias Licencia Maternidad]        INT           NULL,
        [Nombre Documento PDF]            NVARCHAR(300) NULL,
        -- Contexto alineado con RIPS (lista RDA consulta externa)
        [Id Modalidad Atencion]           INT           NULL,
        [Id Grupo Servicios]              INT           NULL,
        [Id Via Ingreso Usuario]          INT           NULL,
        [Id Causa Motivo Atencion]        INT           NULL,
        [Id Estado]                       INT           NOT NULL DEFAULT 1
    );
END;

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Antecedentes Salud]', N'U') IS NULL
BEGIN
CREATE TABLE [Evaluacion Entidad RDA CE Antecedentes Salud] (
    [ID Antecedente Salud CE] INT PRIMARY KEY IDENTITY(1,1),
    [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
    [Documento Entidad] NVARCHAR(50) NOT NULL,
    [Descripcion] VARCHAR(500) NOT NULL,
    [Id Estado] INT NOT NULL,
    CONSTRAINT FK_RDACE_AntecedentesSalud
        FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
        REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
);
END;

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Antecedentes Familiares]', N'U') IS NULL
BEGIN
CREATE TABLE [Evaluacion Entidad RDA CE Antecedentes Familiares] (
    [ID Antecedente Familiar CE] INT PRIMARY KEY IDENTITY(1,1),
    [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
    [Documento Entidad] NVARCHAR(50) NOT NULL,
    [Parentesco] NVARCHAR(100) NULL,
    [Descripcion] VARCHAR(500) NOT NULL,
    [Id Estado] INT NOT NULL,
    CONSTRAINT FK_RDACE_AntecedentesFamiliares
        FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
        REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
);
END;

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Antecedentes Farmacologicos]', N'U') IS NULL
BEGIN
CREATE TABLE [Evaluacion Entidad RDA CE Antecedentes Farmacologicos] (
    [ID Antecedente Farmacologico CE] INT PRIMARY KEY IDENTITY(1,1),
    [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
    [Documento Entidad] NVARCHAR(50) NOT NULL,
    [Descripcion] VARCHAR(500) NOT NULL,
    [Id Estado] INT NOT NULL,
    CONSTRAINT FK_RDACE_AntecedentesFarmacologicos
        FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
        REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
);
END;

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados]', N'U') IS NULL
BEGIN
CREATE TABLE [Evaluacion Entidad RDA CE Diagnosticos Relacionados] (
    [ID Diagnostico Relacionado CE] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
    [Codigo CIE10] NVARCHAR(20) NULL,
    [Nombre CIE10] NVARCHAR(500) NULL,
    [Codigo CIE11] NVARCHAR(50) NULL,
    [Termino CIE11] NVARCHAR(500) NULL,
    [Id Estado] INT NOT NULL DEFAULT 1,
    CONSTRAINT FK_RDACE_DiagnosticosRelacionados
        FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
        REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
);

CREATE TABLE [Evaluacion Entidad RDA CE Prescripcion Medicamentos] (
    [ID Prescripcion Medicamento CE] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
    [Tipo Tec Salud] NVARCHAR(20) NULL,
    [Codigo Medicamento] NVARCHAR(50) NULL,
    [Nombre Medicamento] NVARCHAR(300) NULL,
    [Descripcion Comun DCI] NVARCHAR(500) NULL,
    [Fecha Prescripcion] DATETIME NULL,
    [Dosis Ordenada] NVARCHAR(50) NULL,
    [Unidad Medida Dosis] NVARCHAR(50) NULL,
    [Via Administracion] NVARCHAR(200) NULL,
    [Duracion Cantidad] NVARCHAR(50) NULL,
    [Duracion Unidad Tiempo] NVARCHAR(20) NULL,
    [Frecuencia Cantidad] NVARCHAR(50) NULL,
    [Frecuencia Unidad Tiempo] NVARCHAR(20) NULL,
    [Finalidad Tec Salud] NVARCHAR(100) NULL,
    [Id Estado] INT NOT NULL DEFAULT 1,
    CONSTRAINT FK_RDACE_PrescripcionMedicamentos
        FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
        REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
);
END;

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos]', N'U') IS NULL
BEGIN
CREATE TABLE [Evaluacion Entidad RDA CE Prescripcion Procedimientos] (
    [ID Prescripcion Procedimiento CE] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
    [Tipo Tec Salud] NVARCHAR(100) NULL,
    [Codigo Procedimiento] NVARCHAR(50) NULL,
    [Nombre Procedimiento] NVARCHAR(400) NULL,
    [Finalidad Tec Salud] NVARCHAR(200) NULL,
    [Fecha Prescripcion] DATETIME NULL,
    [Id Estado] INT NOT NULL DEFAULT 1,
    CONSTRAINT FK_RDACE_PrescripcionProcedimientos
        FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
        REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
);
END;

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Otras Tecnologias]', N'U') IS NULL
BEGIN
CREATE TABLE [Evaluacion Entidad RDA CE Otras Tecnologias] (
    [ID Otra Tecnologia CE] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
    [Tipo Tec Salud] NVARCHAR(200) NULL,
    [Codigo] NVARCHAR(100) NULL,
    [Nombre] NVARCHAR(400) NULL,
    [Fecha Prescripcion] DATETIME NULL,
    [Finalidad Tec Salud] NVARCHAR(200) NULL,
    [Id Estado] INT NOT NULL DEFAULT 1,
    CONSTRAINT FK_RDACE_OtrasTecnologias
        FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
        REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
);
END;


CREATE TABLE [Factor De Riesgo 1888]
(
[Id Factor De Riesgo 1888] INT IDENTITY (1,1) PRIMARY KEY,
Codigo varchar (50),
Descripcion varchar (50),
[Id Estado] int default 7
)


INSERT INTO [Factor De Riesgo 1888] (Codigo, Descripcion)
VALUES 
('00', 'Sin factor'),
('01', 'Biológico'),
('02', 'Social'),
('03', 'Ambiental'),
('04', 'Comportamental'),
('05', 'Económico');

create view [dbo].[Cnsta Factor De Riesgo 1888]
as
select [Id Factor De Riesgo 1888] AS IdFactorDeRiesgo1888, Codigo, Descripcion, [Id Estado] AS IdEstado
from [Factor De Riesgo 1888]
where [Id Estado] = 7
go


CREATE TABLE [Tipo de tecnología en salud 1888]
(
[Id Tipo de tecnología en salud 1888] INT IDENTITY (1,1) PRIMARY KEY,
Codigo varchar (50),
Descripcion varchar (50),
[Id Estado] int default 7
)


INSERT INTO [Tipo de tecnología en salud 1888] (Codigo, Descripcion)
VALUES 
('02', 'Registro sanitario'),
('03', 'Vital no disponible'),
('04', 'Preparación magistral'),
('05', 'UNIRS');


create view [dbo].[Cnsta Tipo de tecnología en salud 1888]
as
select [Id Tipo de tecnología en salud 1888] AS IdTipoTecnologiaEnSalud1888, Codigo, Descripcion, [Id Estado] AS IdEstado
from [Tipo de tecnología en salud 1888]
where [Id Estado] = 7
go

-- =============================================================================
-- Catálogos RDA Consulta Externa (Resolución 1888) — listas desde BD
-- Ejecutar después de crear las tablas base. Ajustar [Id Estado] = 7 según su catálogo de estados.
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Entorno de atencion 1888')
CREATE TABLE [dbo].[Entorno de atencion 1888](
    [Id Entorno de atencion 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Entorno de atencion 1888])
INSERT INTO [Entorno de atencion 1888] (Codigo, Descripcion) VALUES
('01', 'Unidad de atención en salud propia'),
('02', 'Domiciliaria'),
('03', 'Comunitaria'),
('04', 'Escolar'),
('05', 'Laboral'),
('06', 'Institución de referencia u otra institución');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Entorno de atencion 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Entorno de atencion 1888] AS
SELECT [Id Entorno de atencion 1888] AS IdEntornoAtencion1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Entorno de atencion 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tipo de alergia 1888')
CREATE TABLE [dbo].[Tipo de alergia 1888](
    [Id Tipo de alergia 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Tipo de alergia 1888])
INSERT INTO [Tipo de alergia 1888] (Codigo, Descripcion) VALUES
('01', 'Medicamento'),
('02', 'Alimento'),
('03', 'Sustancia del ambiente'),
('04', 'Sustancia en contacto con la piel'),
('05', 'Picadura de insectos'),
('06', 'Otra');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Tipo de alergia 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Tipo de alergia 1888] AS
SELECT [Id Tipo de alergia 1888] AS IdTipoAlergia1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Tipo de alergia 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Parentesco familiar RDA 1888')
CREATE TABLE [dbo].[Parentesco familiar RDA 1888](
    [Id Parentesco familiar RDA 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Parentesco familiar RDA 1888])
INSERT INTO [Parentesco familiar RDA 1888] (Codigo, Descripcion) VALUES
('01', 'Padres'),
('02', 'Hermanos'),
('03', 'Tíos'),
('04', 'Abuelos');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Parentesco familiar RDA 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Parentesco familiar RDA 1888] AS
SELECT [Id Parentesco familiar RDA 1888] AS IdParentescoFamiliarRDA1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Parentesco familiar RDA 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tipo diagnostico principal 1888')
CREATE TABLE [dbo].[Tipo diagnostico principal 1888](
    [Id Tipo diagnostico principal 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Tipo diagnostico principal 1888])
INSERT INTO [Tipo diagnostico principal 1888] (Codigo, Descripcion) VALUES
('01', 'Impresión diagnóstica'),
('02', 'Confirmado nuevo'),
('03', 'Confirmado repetido');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Tipo diagnostico principal 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Tipo diagnostico principal 1888] AS
SELECT [Id Tipo diagnostico principal 1888] AS IdTipoDiagnosticoPrincipal1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Tipo diagnostico principal 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Unidad medida dosis 1888')
CREATE TABLE [dbo].[Unidad medida dosis 1888](
    [Id Unidad medida dosis 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Unidad medida dosis 1888])
INSERT INTO [Unidad medida dosis 1888] (Codigo, Descripcion) VALUES
('mg', 'mg — Miligramos'),
('ml', 'ml — Mililitros'),
('g', 'g — Gramos'),
('UI', 'UI — Unidades internacionales'),
('mcg', 'mcg — Microgramos'),
('gotas', 'Gotas');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Unidad medida dosis 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Unidad medida dosis 1888] AS
SELECT [Id Unidad medida dosis 1888] AS IdUnidadMedidaDosis1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Unidad medida dosis 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Via administracion medicamento 1888')
CREATE TABLE [dbo].[Via administracion medicamento 1888](
    [Id Via administracion medicamento 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Via administracion medicamento 1888])
INSERT INTO [Via administracion medicamento 1888] (Codigo, Descripcion) VALUES
('01', 'Oral'),
('02', 'Intravenosa (IV)'),
('03', 'Intramuscular (IM)'),
('04', 'Subcutánea (SC)'),
('05', 'Tópica'),
('06', 'Inhalatoria'),
('07', 'Rectal'),
('08', 'Sublingual'),
('09', 'Oftálmica'),
('10', 'Otra');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Via administracion medicamento 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Via administracion medicamento 1888] AS
SELECT [Id Via administracion medicamento 1888] AS IdViaAdministracionMedicamento1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Via administracion medicamento 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Unidad tiempo duracion 1888')
CREATE TABLE [dbo].[Unidad tiempo duracion 1888](
    [Id Unidad tiempo duracion 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Unidad tiempo duracion 1888])
INSERT INTO [Unidad tiempo duracion 1888] (Codigo, Descripcion) VALUES
('d', 'Días'),
('s', 'Semanas'),
('m', 'Meses');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Unidad tiempo duracion 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Unidad tiempo duracion 1888] AS
SELECT [Id Unidad tiempo duracion 1888] AS IdUnidadTiempoDuracion1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Unidad tiempo duracion 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Unidad tiempo frecuencia 1888')
CREATE TABLE [dbo].[Unidad tiempo frecuencia 1888](
    [Id Unidad tiempo frecuencia 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Unidad tiempo frecuencia 1888])
INSERT INTO [Unidad tiempo frecuencia 1888] (Codigo, Descripcion) VALUES
('h', 'Horas'),
('d', 'Días');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Unidad tiempo frecuencia 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Unidad tiempo frecuencia 1888] AS
SELECT [Id Unidad tiempo frecuencia 1888] AS IdUnidadTiempoFrecuencia1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Unidad tiempo frecuencia 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Finalidad tecnologia salud 1888')
CREATE TABLE [dbo].[Finalidad tecnologia salud 1888](
    [Id Finalidad tecnologia salud 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Finalidad tecnologia salud 1888])
INSERT INTO [Finalidad tecnologia salud 1888] (Codigo, Descripcion) VALUES
('01', 'Diagnóstico'),
('02', 'Terapéutico'),
('03', 'Protección específica'),
('04', 'Detección temprana'),
('05', 'Paliativo');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Finalidad tecnologia salud 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Finalidad tecnologia salud 1888] AS
SELECT [Id Finalidad tecnologia salud 1888] AS IdFinalidadTecnologiaSalud1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Finalidad tecnologia salud 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Otra tecnologia categoria 1888')
CREATE TABLE [dbo].[Otra tecnologia categoria 1888](
    [Id Otra tecnologia categoria 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Otra tecnologia categoria 1888])
INSERT INTO [Otra tecnologia categoria 1888] (Codigo, Descripcion) VALUES
('03', 'Dispositivo médico'),
('04', 'Producto biológico'),
('05', 'Nutricional'),
('06', 'Otro');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Otra tecnologia categoria 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Otra tecnologia categoria 1888] AS
SELECT [Id Otra tecnologia categoria 1888] AS IdOtraTecnologiaCategoria1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Otra tecnologia categoria 1888] WHERE [Id Estado] = 7');
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Alcance incapacidad 1888')
CREATE TABLE [dbo].[Alcance incapacidad 1888](
    [Id Alcance incapacidad 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO
IF NOT EXISTS (SELECT 1 FROM [Alcance incapacidad 1888])
INSERT INTO [Alcance incapacidad 1888] (Codigo, Descripcion) VALUES
('01', 'Laboral'),
('02', 'Escolar'),
('03', 'Laboral y escolar');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Alcance incapacidad 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Alcance incapacidad 1888] AS
SELECT [Id Alcance incapacidad 1888] AS IdAlcanceIncapacidad1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Alcance incapacidad 1888] WHERE [Id Estado] = 7');
GO

-- Tipos de tecnología en salud: códigos usados en RDA (Medicamento / Procedimiento)
IF NOT EXISTS (SELECT 1 FROM [Tipo de tecnología en salud 1888] WHERE Codigo = '01')
INSERT INTO [Tipo de tecnología en salud 1888] (Codigo, Descripcion) VALUES ('01', 'Medicamento');
GO
IF NOT EXISTS (SELECT 1 FROM [Tipo de tecnología en salud 1888] WHERE Codigo = 'M')
INSERT INTO [Tipo de tecnología en salud 1888] (Codigo, Descripcion) VALUES ('M', 'Medicamento');
GO
IF NOT EXISTS (SELECT 1 FROM [Tipo de tecnología en salud 1888] WHERE Codigo = 'P')
INSERT INTO [Tipo de tecnología en salud 1888] (Codigo, Descripcion) VALUES ('P', 'Procedimiento');
GO

 


 --------------------------------------


 CREATE TABLE [dbo].[Egreso y Remision 1888](
	[Id Egreso y Remision 1888] [int] IDENTITY(1,1) NOT NULL,
	[Codigo] [varchar](50) NULL,
	[Descripcion] [varchar](50) NULL,
	[Id Estado] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id Egreso y Remision 1888] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Egreso y Remision 1888] ADD  DEFAULT ((7)) FOR [Id Estado]
GO

INSERT INTO [dbo].[Egreso y Remision 1888] ([Codigo], [Descripcion], [Id Estado])
VALUES
('01', 'Alta médica / domiciliario', 7),
('02', 'Remisión a otra institución', 7),
('03', 'Remisión a urgencias', 7),
('04', 'Remisión a hospitalización', 7),
('05', 'Alta voluntaria', 7),
('06', 'Evasión', 7),
('07', 'Muerte', 7);



CREATE VIEW [dbo].[Cnsta Egreso y Remision 1888]
AS
SELECT [Id Egreso y Remision 1888] AS IdEgresoRemision1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM     dbo.[Egreso y Remision 1888]
GO



-- CREATE TABLE [dbo].[Antecedentes 1888](
-- 	[ID Antecedente 1888] [int] IDENTITY(1,1) NOT NULL,
-- 	[ID Tipo Antecedentes 1888] [int] NULL,
-- 	[Parentesco] [varchar](100) NULL,
-- 	[Documento Entidad] [nvarchar](50) NULL,
-- 	[Descripcion] [varchar](200) NULL,
-- 	[Id Estado] [int] NULL,
-- PRIMARY KEY CLUSTERED 
-- (
-- 	[ID Antecedente 1888] ASC
-- )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
-- ) ON [PRIMARY]
-- GO

-- ALTER TABLE [dbo].[Antecedentes 1888]  WITH CHECK ADD  CONSTRAINT [FK_ANTECEDENTES_ENTIDAD] FOREIGN KEY([Documento Entidad])
-- REFERENCES [dbo].[Entidad] ([Documento Entidad])
-- GO

-- ALTER TABLE [dbo].[Antecedentes 1888] CHECK CONSTRAINT [FK_ANTECEDENTES_ENTIDAD]
-- GO

-- ALTER TABLE [dbo].[Antecedentes 1888]  WITH CHECK ADD  CONSTRAINT [FK_Antecedentes_TipoAntecedente] FOREIGN KEY([ID Tipo Antecedentes 1888])
-- REFERENCES [dbo].[Tipo Antecedentes 1888] ([ID Tipo Antecedentes 1888])
-- GO

-- ALTER TABLE [dbo].[Antecedentes 1888] CHECK CONSTRAINT [FK_Antecedentes_TipoAntecedente]
-- GO

USE AcQuir
GO

/****** Object:  Table [dbo].[Ocupacion 1888]    Script Date: 31/03/2026 11:02:46 a.m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Ocupacion 1888](
	[Id Ocupacion 1888] [int] IDENTITY(1,1) NOT NULL,
	[Codigo] [varchar](20) NULL,
	[Descripcion] [varchar](200) NULL,
	[Id Estado] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id Ocupacion 1888] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Ocupacion 1888] ADD  DEFAULT ((7)) FOR [Id Estado]
GO


-- -----------------------------------------------------------------------------
-- RDA Paciente: marcas de envío exitoso a IHCE (ver RdaPacienteRoutes EnviarIHCE)
--   [Enviado]          = 1 si el envío fue en ambiente producción
--   [Enviado pruebas]  = 1 si el envío fue en sandbox / preproducción
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA]', N'U')
      AND name = N'Enviado'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA] ADD [Enviado] INT NOT NULL CONSTRAINT [DF_EERDA_Enviado] DEFAULT (0);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA]', N'U')
      AND name = N'Enviado pruebas'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA] ADD [Enviado pruebas] INT NOT NULL CONSTRAINT [DF_EERDA_EnviadoPruebas] DEFAULT (0);
GO

-- -----------------------------------------------------------------------------
-- RDA Consulta Externa: marcas de envío exitoso a IHCE (ver RdaConsultaExternaRoutes EnviarIHCE)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', N'U')
      AND name = N'Enviado'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa] ADD [Enviado] INT NOT NULL CONSTRAINT [DF_EERDACE_Enviado] DEFAULT (0);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', N'U')
      AND name = N'Enviado pruebas'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa] ADD [Enviado pruebas] INT NOT NULL CONSTRAINT [DF_EERDACE_EnviadoPruebas] DEFAULT (0);
GO

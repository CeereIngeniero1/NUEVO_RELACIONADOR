

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
           ('99',
           'Ninguna de las anteriores',
           'Ninguna de las anteriores',
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

UPDATE [Zona Residencia]
SET 
    [Código Zona Residencia] = '01',
    [Zona Residencia] = 'U'
WHERE [Descripción Zona Residencia] = 'Urbana';
GO

UPDATE [Zona Residencia]
SET 
    [Código Zona Residencia] = '02',
    [Zona Residencia] = 'R'
WHERE [Descripción Zona Residencia] = 'Rural';
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








-- Alter table to add Alergeno column
-- Se agrega la columna Alergeno a la tabla Entidad1888 para almacenar información sobre alergias específicas del paciente, con un tamaño máximo de 200 caracteres y permitiendo valores nulos.
alter table [entidad1888] add Alergeno varchar (200) null






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
    [Id Identidad Genero]             INT          NULL,
    [Id Pais Nacionalidad]            INT          NULL,
    [Talla]                           VARCHAR(10)  NOT NULL DEFAULT '0',
    [Peso]                            VARCHAR(10)  NOT NULL DEFAULT '0',
    [Id Pais Recidencia]              INT          NULL,
    [Id Municipio Recidencia]         INT          NULL,
    [Id Zona Residencia]              INT          NULL,
    [Dirección]                       NVARCHAR(255) NULL,
    [Id Etnia]                        INT          NULL,
    [Comunidad Etnica]                VARCHAR(50)  NOT NULL DEFAULT '',
    [Id Discapacidad]                 INT          NULL,
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

-- Si la tabla ya existe y fue creada con columnas NOT NULL/DEFAULT 0,
-- ejecutar este bloque para dejarlas nullable (permite guardar sin forzar 0):
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

    DECLARE @dfIdEtnia SYSNAME;
    SELECT @dfIdEtnia = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON c.object_id = dc.parent_object_id
       AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA]', N'U')
      AND c.name = N'Id Etnia';

    IF @dfIdEtnia IS NOT NULL
    BEGIN
        EXEC(N'ALTER TABLE [dbo].[Evaluacion Entidad RDA] DROP CONSTRAINT [' + @dfIdEtnia + N']');
    END

    ALTER TABLE [dbo].[Evaluacion Entidad RDA]
    ALTER COLUMN [Id Etnia] INT NULL;

    DECLARE @dfIdDiscapacidad SYSNAME;
    SELECT @dfIdDiscapacidad = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON c.object_id = dc.parent_object_id
       AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA]', N'U')
      AND c.name = N'Id Discapacidad';

    IF @dfIdDiscapacidad IS NOT NULL
    BEGIN
        EXEC(N'ALTER TABLE [dbo].[Evaluacion Entidad RDA] DROP CONSTRAINT [' + @dfIdDiscapacidad + N']');
    END

    ALTER TABLE [dbo].[Evaluacion Entidad RDA]
    ALTER COLUMN [Id Discapacidad] INT NULL;
END
GO







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
        [Notas Adicionales PDF]           NVARCHAR(MAX) NULL,
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
('01', 'Químicos'),
('02', 'Físicos'),
('03', 'Biomecánicos'),
('04', 'Psicosociales'),
('05', 'Biológicos'),
('06', 'Otro');

create view [dbo].[Cnsta Factor De Riesgo 1888]
as
select [Id Factor De Riesgo 1888] AS IdFactorDeRiesgo1888, Codigo, Descripcion, [Id Estado] AS IdEstado
from [Factor De Riesgo 1888]
where [Id Estado] = 7
go

/* ---------------------------------------------------------------------------
   Hotfix catálogo "Tipo de Documento" para RDA/IHCE (idempotente):
   Normaliza códigos y asegura existencia de tipos conocidos.
--------------------------------------------------------------------------- */
IF OBJECT_ID(N'[dbo].[Tipo de Documento]', N'U') IS NOT NULL
BEGIN
    DECLARE @TiposDoc TABLE
    (
        TipoDoc VARCHAR(10) NOT NULL PRIMARY KEY,
        CodigoTipoDoc VARCHAR(10) NOT NULL,
        Descripcion VARCHAR(120) NOT NULL,
        OrdenTipoDoc INT NOT NULL,
        IdEstado INT NOT NULL,
        CodigoDian INT NULL
    );

    INSERT INTO @TiposDoc (TipoDoc, CodigoTipoDoc, Descripcion, OrdenTipoDoc, IdEstado, CodigoDian)
    VALUES
        ('CC', 'CC', 'Cédula ciudadanía', 1, 7, 13),
        ('CE', 'X',  'Cédula extranjería', 1, 7, 22),
        ('PA', 'P',  'Pasaporte', 1, 7, 41),
        ('RC', 'RC', 'Registro civil', 1, 7, 11),
        ('TI', 'TI', 'Tarjeta de identidad', 1, 7, 12),
        ('AS', 'AS', 'Adulto sin identificación', 1, 7, NULL),
        ('MS', 'MS', 'Menor sin identificación', 1, 7, NULL),
        ('UN', 'UN', 'Número único de identificación personal', 1, 7, NULL),
        ('NI', 'NI', 'Número de identificación tributaria', 1, 7, 31),
        ('NH', 'NH', 'Número de historia clínica', 1, 7, NULL);

    MERGE [dbo].[Tipo de Documento] AS tgt
    USING @TiposDoc AS src
       ON tgt.[Tipo de Documento] = src.TipoDoc
    WHEN MATCHED THEN
        UPDATE SET
            tgt.[Código Tipo de Documento] = src.CodigoTipoDoc,
            tgt.[Descripción Tipo de Documento] =
                CASE
                    WHEN tgt.[Descripción Tipo de Documento] IS NULL OR LTRIM(RTRIM(tgt.[Descripción Tipo de Documento])) = ''
                    THEN src.Descripcion
                    ELSE tgt.[Descripción Tipo de Documento]
                END,
            tgt.[Orden Tipo de Documento] = COALESCE(tgt.[Orden Tipo de Documento], src.OrdenTipoDoc),
            tgt.[Id Estado] = COALESCE(tgt.[Id Estado], src.IdEstado),
            tgt.codigoDian = COALESCE(tgt.codigoDian, src.CodigoDian)
    WHEN NOT MATCHED BY TARGET THEN
        INSERT
        (
            [Código Tipo de Documento],
            [Tipo de Documento],
            [Descripción Tipo de Documento],
            [Orden Tipo de Documento],
            [Id Estado],
            codigoDian
        )
        VALUES
        (
            src.CodigoTipoDoc,
            src.TipoDoc,
            src.Descripcion,
            src.OrdenTipoDoc,
            src.IdEstado,
            src.CodigoDian
        );
END
GO

/* ---------------------------------------------------------------------------
   Hotfix catálogo "Tipo de Documento" para RDA/IHCE:
   - Asegura que Cédula ciudadanía use código "CC" (no "C")
   - Script idempotente: UPDATE si existe, INSERT si no existe
--------------------------------------------------------------------------- */
IF EXISTS (
    SELECT 1
    FROM [dbo].[Tipo de Documento]
    WHERE [Tipo de Documento] = 'CC'
)
BEGIN
    UPDATE [dbo].[Tipo de Documento]
       SET [Código Tipo de Documento] = 'CC',
           [Descripción Tipo de Documento] = COALESCE(NULLIF([Descripción Tipo de Documento], ''), 'Cédula ciudadanía'),
           [Orden Tipo de Documento] = COALESCE([Orden Tipo de Documento], 1),
           [Id Estado] = COALESCE([Id Estado], 7),
           codigoDian = COALESCE(codigoDian, 13)
     WHERE [Tipo de Documento] = 'CC';
END
ELSE
BEGIN
    INSERT INTO [dbo].[Tipo de Documento]
    (
        [Código Tipo de Documento],
        [Tipo de Documento],
        [Descripción Tipo de Documento],
        [Orden Tipo de Documento],
        [Id Estado],
        codigoDian
    )
    VALUES
    (
        'CC',
        'CC',
        'Cédula ciudadanía',
        1,
        7,
        13
    );
END
GO

CREATE TABLE [Tipo de tecnología en salud 1888]
(
[Id Tipo de tecnología en salud 1888] INT IDENTITY (1,1) PRIMARY KEY,
Codigo varchar (50),
Descripcion varchar (50),
[Id Estado] int default 7
)


INSERT INTO [Tipo de tecnología en salud 1888] (Codigo, Descripcion)
VALUES 
('02', 'Medicamento con registro sanitario'),
('03', 'Medicamento Vital no disponible'),
('04', 'Preparación magistral'),
('05', 'Medicamento UNIRS');


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
('01', 'Hogar'),
('02', 'Comunitario'),
('03', 'Escolar'),
('04', 'Laboral'),
('05', 'Institucional')
GO
IF OBJECT_ID(N'[dbo].[Cnsta Entorno de atencion 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Entorno de atencion 1888] AS
SELECT [Id Entorno de atencion 1888] AS IdEntornoAtencion1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Entorno de atencion 1888] WHERE [Id Estado] = 7');
GO

UPDATE [dbo].[Entorno de atencion 1888]
SET Descripcion = CASE Codigo
    WHEN '01' THEN 'Hogar'
    WHEN '02' THEN 'Comunitario'
    WHEN '03' THEN 'Escolar'
    WHEN '04' THEN 'Laboral'
    WHEN '05' THEN 'Institucional'
END
WHERE Codigo IN ('01','02','03','04','05');

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
('04', 'Sustancia que entran en contacto con la piel'),
('05', 'Picadura de insectos'),
('06', 'Otra');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Tipo de alergia 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Tipo de alergia 1888] AS
SELECT [Id Tipo de alergia 1888] AS IdTipoAlergia1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Tipo de alergia 1888] WHERE [Id Estado] = 7');
GO


UPDATE [dbo].[Tipo de alergia 1888]
SET Descripcion = CASE Codigo
    
    WHEN '04' THEN 'Sustancia que entran en contacto con la piel'
END
WHERE Codigo IN ('04');

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
('01', 'Impresión Diagnóstica'),
('02', 'Confirmado Nuevo'),
('03', 'Confirmado Repetido');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Tipo diagnostico principal 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Tipo diagnostico principal 1888] AS
SELECT [Id Tipo diagnostico principal 1888] AS IdTipoDiagnosticoPrincipal1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Tipo diagnostico principal 1888] WHERE [Id Estado] = 7');
GO

UPDATE [Tipo diagnostico principal 1888]
SET Descripcion = CASE Codigo
    WHEN '01' THEN 'Impresión Diagnóstica'
    WHEN '02' THEN 'Confirmado Nuevo'
    WHEN '03' THEN 'Confirmado Repetido'
END
WHERE Codigo IN ('01', '02', '03');

GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Unidad medida dosis 1888')
CREATE TABLE [dbo].[Unidad medida dosis 1888](
    [Id Unidad medida dosis 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(100) NOT NULL,
    Nombre VARCHAR(100) NULL,
    Descripcion VARCHAR(300) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO

IF OBJECT_ID(N'[dbo].[Unidad medida dosis 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @UnidadMedidaDosis1888 TABLE (Codigo VARCHAR(100) NOT NULL PRIMARY KEY, Nombre VARCHAR(100) NULL, Descripcion VARCHAR(300) NOT NULL, IdEstado INT NOT NULL);

    INSERT INTO @UnidadMedidaDosis1888 (Codigo, Nombre, Descripcion, IdEstado)
    VALUES
        ('1', 'EID50', 'dosis infecciosa de embrión 50', 7),
        ('4', 'A', 'amperio', 7),
        ('5', 'AgU', 'unidad(es) de antígeno', 7),
        ('7', 'ATU', 'unidades de antitrombina', 7),
        ('8', 'anti-Xa IU', 'unidades internacionales de actividad anti-Xa', 7),
        ('10', 'Bq', 'bequerel(ios)', 7),
        ('18', 'billon CFU', 'billon de unidades formadoras de colonia', 7),
        ('21', 'billon de organismos', 'billon de organismos', 7),
        ('25', 'cd', 'candela', 7),
        ('26', 'CCID50', 'dosis infecciosa cultivo celular 50', 7),
        ('28', '°C', 'temperatura en Celsius', 7),
        ('31', 'Co', 'culombio', 7),
        ('32', 'm3', 'metro cúbico', 7),
        ('33', 'Ci', 'curio(s)', 7),
        ('41', 'DAgU', 'unidad(es) de Antigeno D', 7),
        ('43', 'd', 'dia', 7),
        ('44', '°', 'grado', 7),
        ('45', 'DF', 'forma de dosificación', 7),
        ('46', 'Gtt', 'gota(s)', 7),
        ('47', 'unidades ELISA', 'unidad de ensayo inmunoenzimático', 7),
        ('50', 'F', 'faradio', 7),
        ('51', 'FAI50', 'ensayo fluorescente dosis infecciosa 50', 7),
        ('53', 'GBq', 'gigabecquerel(ios)', 7),
        ('61', 'g (titre)', 'gramo (titre)', 7),
        ('62', 'g', 'gramo(s)', 7),
        ('67', 'Gy', 'gray', 7),
        ('68', 'H', 'henrio', 7),
        ('69', 'Hz', 'hertz', 7),
        ('70', 'h', 'hora', 7),
        ('71', 'IOU', 'unidad(es) internacional(es) de opacidad', 7),
        ('72', 'UI', 'unidad(es) internacional(es)', 7),
        ('78', 'J', 'julio', 7),
        ('80', 'kat', 'katal', 7),
        ('81', 'K', 'kelvin', 7),
        ('82', 'kUI', 'unidad internacional de kilo', 7),
        ('83', 'unidades Kusp', 'unidad de la Farmacopea de los Estados Unidos de kilo', 7),
        ('84', 'unidades k', 'unidades kilo', 7),
        ('85', 'kBq', 'kilobecquerel(ios)', 7),
        ('93', 'kg', 'kilogramo(s)', 7),
        ('97', 'LacU', 'unidades de lactasa', 7),
        ('98', 'LfU', 'unidades de floculación (lime flocculation unit(s))', 7),
        ('100', 'l', 'litro(s)', 7),
        ('101', 'log10 EID50', 'log 10 50% dosis infecciosa de embrión', 7),
        ('103', 'log10 CCID50', 'log10 dosis infecciosa cultivo celular 50', 7),
        ('105', 'log10 unidades ELISA', 'log10 unidad de ensayo inmunoenzimático', 7),
        ('107', 'log10 FAI50', 'log10 ensayo fluorescente dosis infecciosa del 50%', 7),
        ('109', 'log10 PFU', 'log10 unidad(es) formadoras de placa', 7),
        ('111', 'log10 TCID50', 'log10 dosis infecciosa de cultivo tisular 50%', 7),
        ('114', 'LU', 'unidades de loomis', 7),
        ('117', 'lm', 'lumen', 7),
        ('118', 'lx', 'lux', 7),
        ('119', 'unidades MUSP', '"""mega; unidad de la Farmacopea de los Estados Unidos"""', 7),
        ('120', 'MBq', 'megabecquerel(ios)', 7),
        ('128', 'm', 'metro', 7),
        ('129', 'µCi', 'microcurio(s)', 7),
        ('137', 'µg', 'microgramo(s)', 7),
        ('144', 'µkat', 'microkatal', 7),
        ('145', 'µkat', 'microkatales', 7),
        ('146', 'µl', 'microlitro(s)', 7),
        ('148', 'µmol', 'micromol(es)', 7),
        ('151', 'mCi', 'milicurio(s)', 7),
        ('159', 'mEq', 'miliequivalente(s)', 7),
        ('167', 'mg (titer)', 'miligramo (titer)', 7),
        ('168', 'mg', 'miligramo(s)', 7),
        ('175', 'mkatal', 'milikatal', 7),
        ('176', 'ml', 'mililitro(s)', 7),
        ('178', 'mm', 'milimetro', 7),
        ('179', 'mmol', 'milimol(es)', 7),
        ('184', 'millon UFC', 'millones de unidades formadoras de colonias', 7),
        ('187', 'millon UI', 'millones de unidadades internacionales', 7),
        ('188', 'millon de organismos', 'millon de organismos', 7),
        ('192', 'millon de unidades USP', 'millon de unidades de la Farmacopea de los Estados Unidos', 7),
        ('193', 'millon de unidades', 'millon de unidades', 7),
        ('195', 'min', 'minuto', 7),
        ('196', 'mol', 'mol(es)', 7),
        ('202', 'nCi', 'nanocurio(s)', 7),
        ('203', 'ng', 'nanogramo(s)', 7),
        ('204', 'nkat', 'nanokatal', 7),
        ('205', 'nl', 'nanolitro(s)', 7),
        ('206', 'nmol', 'nanomol(es)', 7),
        ('208', 'N', 'newton', 7),
        ('210', '?', 'ohmio', 7),
        ('211', 'OZ', 'onza', 7),
        ('212', 'PPM', 'parte por millon', 7),
        ('213', 'PPM', 'pascal', 7),
        ('214', '%', 'porcentaje', 7),
        ('218', 'pg', 'picogramo(s)', 7),
        ('219', 'pkat', 'picokatal', 7),
        ('220', 'PFU', 'unidades formadoras de placa', 7),
        ('221', 'PFU e. 1000 LD50 en ratón', 'unidad formadora de placa equivalente a 1000 DL50 en ratón', 7),
        ('224', 'unidad formadora de viruela', 'unidad(es) formadoras de viruela', 7),
        ('225', 'LB', 'libra', 7),
        ('228', 'QS', 'cantidad suficiente', 7),
        ('230', 's', 'segundos', 7),
        ('231', 'S', 'siemens', 7),
        ('232', 'Sv', 'sievert', 7),
        ('233', 'cm2', 'centímetro cuadrado', 7),
        ('234', 'm2', 'metro cuadrado', 7),
        ('235', 'T', 'tesla', 7),
        ('236', 'miles CFU', 'miles de unidades formadoras de colonia', 7),
        ('239', 'miles de organismos', 'miles de organismos', 7),
        ('243', 'titre', 'titre', 7),
        ('244', 't', 'tonelada', 7),
        ('245', 'unidad de tuberculina', 'unidad(es) de tuberculina', 7),
        ('247', 'U', 'unidades', 7),
        ('250', 'unidades USP', 'unidades de la Farmacopea de los Estados Unidos', 7),
        ('251', 'V', 'voltio', 7),
        ('252', 'W', 'vatio', 7),
        ('253', 'Wb', 'weber', 7),
        ('254', 'vp', 'Particulas Virales', 7),
        ('255', 'DLmin', 'Dosis letal minima', 7),
        ('256', 'DMN', 'Dosis minima necrotizante', 7),
        ('257', 'vg', 'Genomas vectoriales', 7),
        ('9000', 'Dosis', 'Dosis', 7),
        ('9001', 'TPU', 'TPU', 7),
        ('9002', 'TSU', 'TSU', 7),
        ('9003', 'DBU', 'DBU', 7),
        ('9004', 'SU', 'SU', 7),
        ('9005', 'IR', 'IR', 7),
        ('9006', 'DPP', 'DPP', 7),
        ('9007', 'HEP', 'HEP', 7),
        ('9008', 'UT', 'UT', 7),
        ('9009', 'SQ', 'SQ', 7),
        ('9010', 'UB', 'UB', 7),
        ('9011', 'DL50', 'Dosis letal 50', 7),
        ('9012', 'AU', 'Unidades de Alergia', 7),
        ('9013', 'BAU', 'Bioequivalente Unidades de Alergia', 7),
        ('9014', 'PNU', 'Unidades de nitrogeno proteico', 7),
        ('9015', 'DPU', 'Unidades de diagnostico no estandarizadas biologicamente', 7);

    MERGE [dbo].[Unidad medida dosis 1888] AS tgt
    USING @UnidadMedidaDosis1888 AS src
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
('01', 'Nueva'),
('02', 'Prórroga');
GO
IF OBJECT_ID(N'[dbo].[Cnsta Alcance incapacidad 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Alcance incapacidad 1888] AS
SELECT [Id Alcance incapacidad 1888] AS IdAlcanceIncapacidad1888, Codigo, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Alcance incapacidad 1888] WHERE [Id Estado] = 7');
GO

-- ColombianLicenseScope (MinSalud): 01 Nueva, 02 Prórroga
UPDATE [dbo].[Alcance incapacidad 1888]
SET Descripcion = CASE Codigo
    WHEN '01' THEN 'Nueva'
    WHEN '02' THEN 'Prórroga'
END
WHERE Codigo IN ('01', '02');

UPDATE [dbo].[Alcance incapacidad 1888]
SET [Id Estado] = 8
WHERE Codigo NOT IN ('01', '02');
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
	[Descripcion] [varchar](200) NULL,
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
('01', 'PACIENTE CON DESTINO A SU DOMICILIO', 7),
('02', 'PACIENTE MUERTO', 7),
('03', 'PACIENTE DERIVADO A OTRO SERVICIO', 7),
('04', 'REFERIDO A OTRA INSTITUCION', 7),
('05', 'CONTRAREFERIDO A OTRA INSTITUCION', 7),
('06', 'DERIVADO O REFERIDO A HOSPITALIZACION DOMICILIARIA', 7),
('07', 'DERIVADO A SERVICIO SOCIAL', 7),
('08', 'PACIENTE CONTINUA EN EL SERVICIO (CORTE FACTURACION)', 7);

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

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', N'U')
      AND name = N'Contenido Documento PDF Base64'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa] ADD [Contenido Documento PDF Base64] NVARCHAR(MAX) NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', N'U')
      AND name = N'Notas Adicionales PDF'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa] ADD [Notas Adicionales PDF] NVARCHAR(MAX) NULL;
GO

/* ---------------------------------------------------------------------------
   Normalización consolidada de catálogos RDA 1888 (idempotente)
--------------------------------------------------------------------------- */
IF OBJECT_ID(N'[dbo].[Entorno de atencion 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @EntornoAtencion1888 TABLE
    (
        Codigo VARCHAR(50) NOT NULL PRIMARY KEY,
        Descripcion VARCHAR(200) NOT NULL,
        IdEstado INT NOT NULL
    );

    INSERT INTO @EntornoAtencion1888 (Codigo, Descripcion, IdEstado)
    VALUES
        ('01', 'Hogar', 7),
        ('02', 'Comunitario', 7),
        ('03', 'Escolar', 7),
        ('04', 'Laboral', 7),
        ('05', 'Institucional', 7)

    MERGE [dbo].[Entorno de atencion 1888] AS tgt
    USING @EntornoAtencion1888 AS src
      ON tgt.Codigo = src.Codigo
    WHEN MATCHED THEN
        UPDATE SET
            tgt.Descripcion = src.Descripcion,
            tgt.[Id Estado] = COALESCE(tgt.[Id Estado], src.IdEstado)
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (Codigo, Descripcion, [Id Estado])
        VALUES (src.Codigo, src.Descripcion, src.IdEstado);
END
GO

IF OBJECT_ID(N'[dbo].[Tipo de alergia 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @TipoAlergia1888 TABLE
    (
        Codigo VARCHAR(50) NOT NULL PRIMARY KEY,
        Descripcion VARCHAR(200) NOT NULL,
        IdEstado INT NOT NULL
    );

    INSERT INTO @TipoAlergia1888 (Codigo, Descripcion, IdEstado)
    VALUES
        ('01', 'Medicamento', 7),
        ('02', 'Alimento', 7),
        ('03', 'Sustancia del ambiente', 7),
        ('04', 'Sustancia en contacto con la piel', 7),
        ('05', 'Picadura de insectos', 7),
        ('06', 'Otra', 7);

    MERGE [dbo].[Tipo de alergia 1888] AS tgt
    USING @TipoAlergia1888 AS src
      ON tgt.Codigo = src.Codigo
    WHEN MATCHED THEN
        UPDATE SET
            tgt.Descripcion = src.Descripcion,
            tgt.[Id Estado] = COALESCE(tgt.[Id Estado], src.IdEstado)
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (Codigo, Descripcion, [Id Estado])
        VALUES (src.Codigo, src.Descripcion, src.IdEstado);
END
GO

IF OBJECT_ID(N'[dbo].[Tipo diagnostico principal 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @TipoDxPrincipal1888 TABLE
    (
        Codigo VARCHAR(50) NOT NULL PRIMARY KEY,
        Descripcion VARCHAR(200) NOT NULL,
        IdEstado INT NOT NULL
    );

    INSERT INTO @TipoDxPrincipal1888 (Codigo, Descripcion, IdEstado)
    VALUES
        ('01', 'Impresión diagnóstica', 7),
        ('02', 'Confirmado nuevo', 7),
        ('03', 'Confirmado repetido', 7);

    MERGE [dbo].[Tipo diagnostico principal 1888] AS tgt
    USING @TipoDxPrincipal1888 AS src
      ON tgt.Codigo = src.Codigo
    WHEN MATCHED THEN
        UPDATE SET
            tgt.Descripcion = src.Descripcion,
            tgt.[Id Estado] = COALESCE(tgt.[Id Estado], src.IdEstado)
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (Codigo, Descripcion, [Id Estado])
        VALUES (src.Codigo, src.Descripcion, src.IdEstado);
END
GO

IF OBJECT_ID(N'[dbo].[Tipo de Documento]', N'U') IS NOT NULL
BEGIN
    DECLARE @TiposDoc1888 TABLE
    (
        TipoDoc VARCHAR(10) NOT NULL PRIMARY KEY,
        CodigoTipoDoc VARCHAR(10) NOT NULL,
        Descripcion VARCHAR(120) NOT NULL,
        OrdenTipoDoc INT NOT NULL,
        IdEstado INT NOT NULL,
        CodigoDian INT NULL
    );

    INSERT INTO @TiposDoc1888 (TipoDoc, CodigoTipoDoc, Descripcion, OrdenTipoDoc, IdEstado, CodigoDian)
    VALUES
        ('CC', 'CC', 'Cédula ciudadanía', 1, 7, 13),
        ('CE', 'X',  'Cédula extranjería', 1, 7, 22),
        ('PA', 'P',  'Pasaporte', 1, 7, 41),
        ('RC', 'RC', 'Registro civil', 1, 7, 11),
        ('TI', 'TI', 'Tarjeta de identidad', 1, 7, 12),
        ('AS', 'AS', 'Adulto sin identificación', 1, 7, NULL),
        ('MS', 'MS', 'Menor sin identificación', 1, 7, NULL),
        ('CD', 'CD', 'Carné diplomático', 1, 7, NULL),
        ('SC', 'SC', 'Salvoconducto de permanencia', 1, 7, NULL),
        ('PE', 'PT', 'Permiso especial de permanencia', 1, 7, NULL),
        ('PT', 'PT', 'Permiso por protección temporal', 1, 7, NULL),
        ('CN', 'CN', 'Certificado de nacido vivo', 1, 7, NULL),
        ('DE', 'DE', 'Documento extranjero', 1, 7, NULL),
        ('SI', 'SI', 'Sin identificación', 1, 7, NULL),
        ('NIT', 'NI', 'Número de identificación tributaria', 1, 7, 31),
        ('NI', 'NI', 'Número de identificación tributaria', 1, 7, 31),
        ('UN', 'UN', 'Número único de identificación personal', 1, 7, NULL),
        ('NH', 'NH', 'Número de historia clínica', 1, 7, NULL);

    MERGE [dbo].[Tipo de Documento] AS tgt
    USING @TiposDoc1888 AS src
      ON tgt.[Tipo de Documento] = src.TipoDoc
    WHEN MATCHED THEN
        UPDATE SET
            tgt.[Código Tipo de Documento] = src.CodigoTipoDoc,
            tgt.[Descripción Tipo de Documento] = src.Descripcion,
            tgt.[Orden Tipo de Documento] = COALESCE(tgt.[Orden Tipo de Documento], src.OrdenTipoDoc),
            tgt.[Id Estado] = COALESCE(tgt.[Id Estado], src.IdEstado),
            tgt.codigoDian = COALESCE(tgt.codigoDian, src.CodigoDian)
    WHEN NOT MATCHED BY TARGET THEN
        INSERT
        (
            [Código Tipo de Documento],
            [Tipo de Documento],
            [Descripción Tipo de Documento],
            [Orden Tipo de Documento],
            [Id Estado],
            codigoDian
        )
        VALUES
        (
            src.CodigoTipoDoc,
            src.TipoDoc,
            src.Descripcion,
            src.OrdenTipoDoc,
            src.IdEstado,
            src.CodigoDian
        );
END
GO


IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Via administracion medicamento 1888')
CREATE TABLE [dbo].[Via administracion medicamento 1888](
    [Id Via administracion medicamento 1888] [int] IDENTITY(1,1) NOT NULL,
    [Codigo] [varchar](50) NOT NULL,
    [Nombre] [varchar](150) NULL,
    [Descripcion] [varchar](400) NOT NULL,
    [Id Estado] [int] NOT NULL,
PRIMARY KEY CLUSTERED
(
    [Id Via administracion medicamento 1888] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

IF COL_LENGTH(N'[dbo].[Via administracion medicamento 1888]', N'Nombre') IS NULL
ALTER TABLE [dbo].[Via administracion medicamento 1888] ADD [Nombre] [varchar](150) NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID(N'[dbo].[Via administracion medicamento 1888]')
      AND name = N'DF_ViaAdministracionMedicamento1888_IdEstado'
)
ALTER TABLE [dbo].[Via administracion medicamento 1888]
ADD CONSTRAINT [DF_ViaAdministracionMedicamento1888_IdEstado] DEFAULT ((7)) FOR [Id Estado]
GO

IF OBJECT_ID(N'[dbo].[Via administracion medicamento 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @ViaAdministracionMedicamento1888 TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Nombre VARCHAR(150) NULL, Descripcion VARCHAR(400) NOT NULL, IdEstado INT NOT NULL);

    INSERT INTO @ViaAdministracionMedicamento1888 (Codigo, Nombre, Descripcion, IdEstado)
    VALUES
        ('1', 'AURICULAR (OTICA)', 'Administración a través de la oreja', 7),
        ('2', 'BUCAL', 'Administración dirigida al carrillo, generalmente desde dentro de la boca', 7),
        ('3', 'CUTANEA', 'Administración en la piel', 7),
        ('4', 'DENTAL', 'Administración para los dientes', 7),
        ('5', 'ENDOCERVICAL', 'Administración dentro del canal del cuello uterino. Sinónimo del término Intracervical', 7),
        ('6', 'ENDOSINUSIAL', 'Administración dentro de los senos nasales de la cabeza', 7),
        ('7', 'ENDOTRAQUEAL', 'Administración directamente en la traquea', 7),
        ('8', 'EPIDURAL', 'Administración sobre o a través de la duramadre', 7),
        ('9', 'EXTRA-AMNIOTICO', 'Administración en el exterior de la membrana que envuelve el feto', 7),
        ('10', 'VIA A TRAVES DE HEMODIALISIS', 'Administración a través del líquido para hemodiálisis', 7),
        ('11', 'INTRA CORPUS CAVERNOSO', 'Administración dentro de los espacios dilatables de los cuerpos cavernosos del pene', 7),
        ('12', 'INTRAAMNIOTICA', 'Administración dentro del saco amniótico', 7),
        ('13', 'INTRAARTERIAL', 'Administración dentro de una arteria o arterias', 7),
        ('14', 'INTRAARTICULAR', 'Administración dentro de una articulación', 7),
        ('15', 'INTRAUTERINA', 'Administración dentro del útero', 7),
        ('16', 'INTRACARDIACA', 'Administración en el corazón', 7),
        ('17', 'INTRACAVERNOSA', 'Administración dentro de una cavidad patológica, tal como ocurre en el pulmón en tuberculosis', 7),
        ('18', 'INTRACEREBRAL', 'Administración en el cerebro', 7),
        ('19', 'INTRACERVICAL', 'Administración  dentro del canal del cuello uterino', 7),
        ('20', 'INTRACISTERNAL (CEREBELOMEDULAR)', 'Administración dentro de la cisterna magna cerebellomedular', 7),
        ('21', 'INTRACORNEAL', 'Administración dentro de la cornea (La estructura Transparente que forma la parte anterior  de la túnica fibrosa del ojo)', 7),
        ('22', 'INTRACORONARIA', 'Administración dentro de las arterias coronarias', 7),
        ('23', 'INTRADERMICA', 'Administración dentro de la dermis', 7),
        ('24', 'INTRADISCAL', 'Administración a dentro de un disco', 7),
        ('25', 'INTRAHEPATICA', 'Administración dentro del hígado, a través de la vena hepática o arteria', 7),
        ('26', 'USO INTRALESIONAL', 'Administración dentro de una lesión localizada', 7),
        ('27', 'USO INTRALINFATICO', 'Administración dentro del líquido linfático', 7),
        ('28', 'INTRAMEDULAR', 'Administración dentro de la cavidad de la médula ósea de un hueso', 7),
        ('29', 'INTRAMENINGEA', 'Administración dentro de las meninges (las tres membranas que envuelven el cerebro y la médula espinal', 7),
        ('30', 'INTRAMUSCULAR', 'Administración dentro del músculo', 7),
        ('31', 'INTRAOCULAR', 'Administración dentro del ojo', 7),
        ('32', 'INTRAPERICARDIAL', 'Administración dentro del pericardio', 7),
        ('33', 'INTRAPERITONEAL', 'Administración dentro de la cavidad peritoneal', 7),
        ('34', 'INTRAPLEURAL', 'Administración dentro de la pleura', 7),
        ('35', 'INTRASINOVIAL', 'Administración dentro de la cavidad sinovial de una articulación', 7),
        ('36', 'INTRATECAL', 'Administración en el líquido cefalorraquideo en cualquier nivel de medular, incluyendo inyección en los ventriculos cerebrales', 7),
        ('37', 'INTRATORAXICA', '"Administración en el torax (interno a la costillas); sinónimo de  endotorácico"', 7),
        ('39', 'INTRATUMORAL', 'Administración dentro de un tumor', 7),
        ('40', 'BOLO INTRAVENOSO', 'Administración dentro o en una vena o venas en un solo momento', 7),
        ('41', 'GOTEO INTRAVENOSO', 'Administración en una vena o varias venas durante un periodo continuo de tiempo', 7),
        ('42', 'INTRAVENOSA', 'Administración dentro o en una vena o venas', 7),
        ('43', 'INTRAVESICAL', 'Administración dentro de la vejiga', 7),
        ('44', 'IONTOFORESIS', 'Administración mediante una corriente eléctrica donde migran iones de sales solubles en los tejidos del cuerpo', 7),
        ('45', 'NASAL', '"Administración a la nariz; administrado por medio de la nariz"', 7),
        ('46', 'TECNICA DE VENDAJE OCLUSIVO', 'Administración por vía tópica con un vendaje que ocluye el área', 7),
        ('47', 'OFTALMICA', 'Administración para la zona externa del ojo', 7),
        ('48', 'ORAL', 'Administración en o a través de la boca', 7),
        ('50', 'OTRA', 'Administración es diferente de otros contemplados en ésta lista', 7),
        ('52', 'PERIARTICULAR', 'Administración alrededor de una articulación', 7),
        ('53', 'PERINEURAL', 'Administracion alrededor de un nervio o nervios', 7),
        ('54', 'RECTAL', 'Administración directa en el recto', 7),
        ('56', 'RETROBULBAL', 'Administración en la zona posterior del globo ocular o del puente de Varolio.', 7),
        ('57', 'SUBCONJUNTIVAL', 'Administración por debajo bajo de la conjuntiva', 7),
        ('58', 'SUBCUTANEA', 'Administración por debajo de la piel: hipodérmica. Sinónimo con el término Subdermal', 7),
        ('60', 'SUBLINGUAL', 'Administracíon debajo de la lengua', 7),
        ('61', 'TOPICA', 'Administración en un punto particular de la superficie externa del cuerpo.', 7),
        ('62', 'TRANSDERMICA', 'Administración a través de la capa dérmica de la piel que desemboca a la circulación sistémica por difusión', 7),
        ('63', 'TRANSMAMARIA', 'Administración en el cuerpo a través del calostro o leche', 7),
        ('64', 'TRANSPLACENTARIA', 'Administración a través de la placenta', 7),
        ('66', 'URETRAL', 'Administración a través de la uretra', 7),
        ('67', 'VAGINAL', 'Administración dentro de la vagina', 7),
        ('68', 'CONJUNTIVAL', 'Administración a través de la conjuntiva, es decir, la delicada membra que recubre los párpados y la superficie del globo ocular', 7),
        ('69', 'ELECTRO-OSMOSIS', 'Administración por medio de la difusión de una sustancia a través de una membrana en un campo eléctrico', 7),
        ('70', 'ENTERAL', 'Administración directamente en el tubo digestivo', 7),
        ('71', 'GASTROENTERAL', 'Administracion en tracto gastroenteral', 7),
        ('72', 'INTRAGINGIVAL', 'Administración dentro de la encía', 7),
        ('75', 'IN VITRO', 'Administración  en un entorno artificial fuera de un organismo vivo.', 7),
        ('76', 'INFILTRACION', 'Administración que tiene como resultado  sustancias que pasan  a los tejidos o espacio intercelular.', 7),
        ('77', 'INTERSTICIAL', 'Administración hacia o en los intersticios de un tejido', 7),
        ('78', 'INTRABDOMINAL', 'Administración dentro del abdomen', 7),
        ('79', 'INTRABILIAR', 'Administración dentro de la bilis, los conductos biliares o la vesícula biliar', 7),
        ('80', 'INTRABRONQUIAL', 'Administración dentro de un bronquio', 7),
        ('81', 'INTRABURSAL', 'Administración dentro de la bolsa sinovial', 7),
        ('82', 'INTRACARTILAGINOSO', '"Administración dentro de un cartílago; se usa como un sinónimo de endocondral"', 7),
        ('83', 'INTRACAUDAL', 'Administración dentro de la cauda equina', 7),
        ('84', 'INTRACAVITARIA', 'Administración dentro de una cavidad no patológica, como el del cuello uterino, útero o el pene, o como el que se forma como resultado de una herida', 7),
        ('85', 'INTRACORONARIO, DENTAL', 'Administración de un fármaco en una parte de un diente que está cubierta por esmalte y que está separada de las raices por una región ligeramente estrecha conocida como cuello.', 7),
        ('86', 'INTRADUCTAL', 'Administración dentro del conducto de alguna glándula', 7),
        ('87', 'INTRADUODENAL', 'Administración dentro del duodeno', 7),
        ('88', 'INTRADURAL', 'Administración dentro o debajo de la duramadre', 7),
        ('89', 'INTRAEPIDERMAL', 'Administración dentro de la epidermis', 7),
        ('90', 'INTRAESOFAGICA', 'Administración dentro del esófago', 7),
        ('91', 'INTRAGASTRICA', 'Administración dentro del estómago', 7),
        ('92', 'INTRAILEAL', 'Administración dentro de la porción distal del intestino delgado el íleo, es decir desde el yeyuno hasta el ciego.', 7),
        ('93', 'INTRAOVARICA', 'Administración dentro del ovario', 7),
        ('94', 'INTRAPROSTATICA', 'Administración dentro de la próstata', 7),
        ('95', 'INTRAPULMONAR', 'Administración dentro de los pulmones o sus bronquios', 7),
        ('96', 'INTRASINUSAL (SENOSPARANASALES)', 'Administración dentro de los seno nasales o periorbitarios', 7),
        ('97', 'INTRAESTERNAL', 'Administración dentro de la médula ósea del esternón', 7),
        ('98', 'INTRATENDINOSA', 'Administración dentro de un tendón', 7),
        ('99', 'INTRATESTICULAR', 'Administración en el testículo', 7),
        ('100', 'INTRATUBULAR', 'Administración dentro de los túbulos de algún órgano', 7),
        ('101', 'INTRATIMPANICA', 'Administración dentro del oído medio', 7),
        ('102', 'INTRAVASCULAR', 'Administración dentro de un vaso o vasos', 7),
        ('103', 'INTRAVENTRICULAR', 'Administración dentro de un ventrículo', 7),
        ('104', 'INTRAVITREA', 'Administracion en el cuerpo vítreo del ojo', 7),
        ('105', 'IRRIGACION', 'Administración para bañarse o lavar las heridas abiertas o cavidades corporales', 7),
        ('106', 'LARINGEO', 'Administración directamente sobre la larínge', 7),
        ('107', 'LARINGOFARINGEAL', 'Administracion directamente sobre la porción más baja de la faringe, laringofaringe', 7),
        ('108', 'SONDA NASOGASTRICA', 'Administración desde la nariz hasta el estómago, generalmente por medio de un tubo', 7),
        ('110', 'USO OROMUCOSA', 'Administración a través de la mucosa de la cavidad oral', 7),
        ('111', 'PERCUTANEA', 'Administración a través de la piel', 7),
        ('112', 'PERIDURAL', 'Administración en el exterior de la duramadre de la médula espinal', 7),
        ('113', 'PERIODONTAL', 'Administración alrededor de un diente', 7),
        ('114', 'TEJIDO BLANDO', 'Administración en cualquier tejido blando', 7),
        ('115', 'SUBARACNOIDEA', 'Administración por debajo bajo de la aracnoides', 7),
        ('116', 'SUBMUCOSA', 'Administración debajo de la membrana de la mucosa', 7),
        ('117', 'TRANSMUCOSA', 'Administración a través de la mucosa', 7),
        ('118', 'TRANSTRAQUEAL', 'Administración a través de la pared de la traquea', 7),
        ('119', 'TRANSTIMPANICA', 'Administración a través de la cavidad timpánica', 7),
        ('120', 'URETERAL', 'Administración a través del uréter', 7),
        ('500', 'INTRADETRUSOR', 'Administración en el músculo destrusor', 7),
        ('501', 'USO EPILESIONAL', 'Administracion sobre la lesión, o en lechos sangrantes', 7),
        ('502', 'INHALATORIA NASAL', 'Administración dentro de las vías respiratorias por inhalación nasal con efecto local o sistémico', 7),
        ('503', 'INHALATORIA BUCAL', 'Administración dentro de las vías respiratorias por inhalación bucal con efecto local o sistémico', 7),
        ('504', 'BUCOFARINGEA', 'Administración directamente a la boca y la faringe.', 7),
        ('505', 'IMPLANTACION', 'Administración de un medicamento por insercción debajo de la piel', 7),
        ('506', 'NEBULIZACION', 'Administración de un medicamento por inhalación en el tracto respiratorio a través de la nariz y boca', 7),
        ('507', 'INTRACEREBROVENTRICULAR', 'Administración por una técnica de inyección invasiva de sustancias directamente en el líquido cefalorraquídeo de los ventrículos cerebrales para evitar la barrera hematoencefálica', 7);

    MERGE [dbo].[Via administracion medicamento 1888] AS tgt
    USING @ViaAdministracionMedicamento1888 AS src
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

IF OBJECT_ID(N'[dbo].[Cnsta Via administracion medicamento 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Via administracion medicamento 1888] AS
SELECT [Id Via administracion medicamento 1888] AS IdViaAdministracionMedicamento1888, Codigo, Nombre, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Via administracion medicamento 1888]
WHERE [Id Estado] = 7');
GO



IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Unidad tiempo duracion 1888')
CREATE TABLE [dbo].[Unidad tiempo duracion 1888](
    [Id Unidad tiempo duracion 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO

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

IF OBJECT_ID(N'[dbo].[Cnsta Unidad tiempo duracion 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Unidad tiempo duracion 1888] AS
SELECT
    [Id Unidad tiempo duracion 1888] AS IdUnidadTiempoDuracion1888,
    Codigo,
    Descripcion,
    [Id Estado] AS IdEstado
FROM [dbo].[Unidad tiempo duracion 1888]
WHERE [Id Estado] = 7');
GO


IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Unidad tiempo frecuencia 1888')
CREATE TABLE [dbo].[Unidad tiempo frecuencia 1888](
    [Id Unidad tiempo frecuencia 1888] INT IDENTITY(1,1) PRIMARY KEY,
    Codigo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200) NOT NULL,
    [Id Estado] INT NOT NULL DEFAULT 7
);
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Unidad tiempo frecuencia 1888])
INSERT INTO [dbo].[Unidad tiempo frecuencia 1888] (Codigo, Descripcion, [Id Estado])
VALUES
('1', 'Minutos', 7),
('2', 'Horas', 7),
('3', 'Día', 7),
('4', 'Semanas', 7),
('5', 'Mes', 7),
('6', 'Año', 7),
('7', 'Según respuesta al tratamiento', 7);
GO

IF OBJECT_ID(N'[dbo].[Cnsta Unidad tiempo frecuencia 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Unidad tiempo frecuencia 1888] AS
SELECT
    [Id Unidad tiempo frecuencia 1888] AS IdUnidadTiempoFrecuencia1888,
    Codigo,
    Descripcion,
    [Id Estado] AS IdEstado
FROM [dbo].[Unidad tiempo frecuencia 1888]
WHERE [Id Estado] = 7');
GO


IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Finalidad tecnologia salud 1888')
CREATE TABLE [dbo].[Finalidad tecnologia salud 1888](
    [Id Finalidad tecnologia salud 1888] [int] IDENTITY(1,1) NOT NULL,
    [Codigo] [varchar](50) NOT NULL,
    [Nombre] [varchar](250) NULL,
    [Descripcion] [varchar](250) NOT NULL,
    [Id Estado] [int] NOT NULL,
PRIMARY KEY CLUSTERED
(
    [Id Finalidad tecnologia salud 1888] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

IF COL_LENGTH(N'[dbo].[Finalidad tecnologia salud 1888]', N'Nombre') IS NULL
ALTER TABLE [dbo].[Finalidad tecnologia salud 1888] ADD [Nombre] [varchar](250) NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID(N'[dbo].[Finalidad tecnologia salud 1888]')
      AND name = N'DF_FinalidadTecnologiaSalud1888_IdEstado'
)
ALTER TABLE [dbo].[Finalidad tecnologia salud 1888]
ADD CONSTRAINT [DF_FinalidadTecnologiaSalud1888_IdEstado] DEFAULT ((7)) FOR [Id Estado]
GO

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

IF OBJECT_ID(N'[dbo].[Cnsta Finalidad tecnologia salud 1888]', N'V') IS NULL
EXEC('CREATE VIEW [dbo].[Cnsta Finalidad tecnologia salud 1888] AS
SELECT [Id Finalidad tecnologia salud 1888] AS IdFinalidadTecnologiaSalud1888, Codigo, Nombre, Descripcion, [Id Estado] AS IdEstado
FROM [dbo].[Finalidad tecnologia salud 1888]
WHERE [Id Estado] = 7');
GO




CREATE VIEW [dbo].[Cnsta Compromiso VI 1888]
AS
SELECT TOP (100) PERCENT [Fecha Inicio CompromisoVI] AS Fechaini, [Fecha Fin CompromisoVI] AS Fechafin, [Hora Inicio CompromisoVI] AS Horaini, [Hora Fin CompromisoVI] AS Horafin, [Entidad Atendida] AS Docpaciente, [Id Estado] AS Estado, 
                  [Id CompromisoVI]
FROM     dbo.CompromisoVI
WHERE  ([Id Estado] <> 60 OR
                  [Id Estado] <> 61)
ORDER BY [Id CompromisoVI] DESC
GO



--Ejecutar en importante para poder generar el pdf con las notas adicionales

-- back_relacionador/SQL/1888/ALTER_RDACE_NotasAdicionalesPdf.sql
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', N'U')
      AND name = N'Notas Adicionales PDF'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa]
        ADD [Notas Adicionales PDF] NVARCHAR(MAX) NULL;


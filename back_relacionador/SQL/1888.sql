

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

ALTER VIEW [dbo].[Cnsta Relacionador Usuarios Info]
AS
SELECT dbo.Entidad.[Id Tipo de Documento], dbo.[Tipo de Documento].[Tipo de Documento], dbo.Entidad.[Documento Entidad] AS DocumentoPaciente, dbo.Entidad.[Primer Apellido Entidad] AS PrimerApellidoPaciente, 
                  dbo.Entidad.[Segundo Apellido Entidad] AS SegundoApellidoPaciente, dbo.Entidad.[Primer Nombre Entidad] AS PrimerNombrePaciente, dbo.Entidad.[Segundo Nombre Entidad] AS SegundoNombrePaciente, 
                  dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente, dbo.Sexo.[Descripción Sexo] AS Sexo, dbo.EntidadIII.[Edad EntidadIII] AS Edad, dbo.EntidadII.[Dirección EntidadII] AS Direccion, 
                  dbo.EntidadII.[Teléfono Celular EntidadII] AS Tel, dbo.[Tipo de Documento].[Tipo de Documento] + N' ' + dbo.Entidad.[Documento Entidad] AS DocumentoTipoDOC, dbo.EntidadIII.[Fecha Nacimiento EntidadIII], dbo.EntidadIII.[Id Sexo], 
                  dbo.Entidad1888.[Id Identidad Genero], dbo.[Sexo Identidad Genero].Codigo, dbo.[Sexo Identidad Genero].[Identidad Genero], País_recidencia.[Id País] AS id_País_recidencia, País_recidencia.[Código País] AS codigoPaís_recidencia, 
                  País_recidencia.País AS País_recidencia, Pais_Nacionalidad.[Id País] AS id_Pais_Nacionalidad, Pais_Nacionalidad.[Código País] AS CodigoPais_Nacionalidad, Pais_Nacionalidad.País AS Pais_Nacionalidad, 
                  dbo.EntidadIII.[Id Zona Residencia], dbo.[Zona Residencia].[Código Zona Residencia], dbo.[Zona Residencia].[Zona Residencia], dbo.Entidad1888.Talla, dbo.Entidad1888.Peso, dbo.Entidad1888.[Id Etnia], dbo.Etnia.[Código Etnia], 
                  dbo.Etnia.Etnia, dbo.Entidad1888.[Comunidad Etnica], dbo.Entidad1888.[Id Discapacidad], dbo.Discapacidad.Codigo AS codigoDiscapacidad, dbo.Discapacidad.Discapacidad
FROM     dbo.Entidad INNER JOIN
                  dbo.EntidadII ON dbo.Entidad.[Documento Entidad] = dbo.EntidadII.[Documento Entidad] INNER JOIN
                  dbo.EntidadIII ON dbo.Entidad.[Documento Entidad] = dbo.EntidadIII.[Documento Entidad] INNER JOIN
                  dbo.Sexo ON dbo.EntidadIII.[Id Sexo] = dbo.Sexo.[Id Sexo] INNER JOIN
                  dbo.[Tipo de Documento] ON dbo.Entidad.[Id Tipo de Documento] = dbo.[Tipo de Documento].[Id Tipo de Documento] INNER JOIN
                  dbo.Entidad1888 ON dbo.Entidad.[Documento Entidad] = dbo.Entidad1888.[Documento Entidad] INNER JOIN
                  dbo.[Sexo Identidad Genero] ON dbo.Entidad1888.[Id Identidad Genero] = dbo.[Sexo Identidad Genero].[Id Sexo Identidad Genero] INNER JOIN
                  dbo.Ciudad AS [Ciudad Recidencia] ON dbo.Entidad1888.[Id Municipio Recidencia] = [Ciudad Recidencia].[Id Ciudad] INNER JOIN
                  dbo.[Zona Residencia] ON dbo.EntidadIII.[Id Zona Residencia] = dbo.[Zona Residencia].[Id Zona Residencia] INNER JOIN
                  dbo.Etnia ON dbo.Entidad1888.[Id Etnia] = dbo.Etnia.[Id Etnia] INNER JOIN
                  dbo.Discapacidad ON dbo.Entidad1888.[Id Discapacidad] = dbo.Discapacidad.[Id Discapacidad] LEFT OUTER JOIN
                  dbo.País AS País_recidencia ON dbo.Entidad1888.[Id Pais Recidencia] = País_recidencia.[Id País] LEFT OUTER JOIN
                  dbo.País AS Pais_Nacionalidad ON dbo.Entidad1888.[Id Pais Nacionalidad] = Pais_Nacionalidad.[Id País]
GO



/*-- Info de Usuarios Segun documento seleccionado*/
ALTER VIEW [dbo].[Cnsta Relacionador Usuarios Info]
AS
SELECT dbo.Entidad.[Id Tipo de Documento], dbo.[Tipo de Documento].[Tipo de Documento] AS TipoDocumentoBase, dbo.Entidad.[Documento Entidad] AS DocumentoPaciente, dbo.Entidad.[Primer Apellido Entidad] AS PrimerApellidoBase, 
                  dbo.Entidad.[Segundo Apellido Entidad] AS SegundoApellidoBase, dbo.Entidad.[Primer Nombre Entidad] AS PrimerNombreBase, dbo.Entidad.[Segundo Nombre Entidad] AS SegundoNombreBase, 
                  dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente, dbo.Sexo.[Descripción Sexo] AS Sexo, dbo.EntidadIII.[Edad EntidadIII] AS Edad, dbo.EntidadII.[Dirección EntidadII] AS Direccion, 
                  dbo.EntidadII.[Teléfono Celular EntidadII] AS Tel, dbo.[Tipo de Documento].[Tipo de Documento] + N' ' + dbo.Entidad.[Documento Entidad] AS DocumentoTipoDOC, dbo.EntidadIII.[Fecha Nacimiento EntidadIII] AS FechaNacimientoBase, 
                  dbo.EntidadIII.[Id Sexo], dbo.Entidad1888.[Id Identidad Genero], dbo.[Sexo Identidad Genero].Codigo AS codigoIdentidadGeneroBase, dbo.[Sexo Identidad Genero].[Identidad Genero] AS IdentidadGeneroBase, 
                  País_recidencia.[Id País] AS id_País_recidencia, País_recidencia.[Código País] AS codigoPaís_recidencia, País_recidencia.País AS País_recidencia, Pais_Nacionalidad.[Id País] AS id_Pais_Nacionalidad, 
                  Pais_Nacionalidad.[Código País] AS CodigoPais_Nacionalidad, Pais_Nacionalidad.País AS Pais_Nacionalidad, dbo.EntidadIII.[Id Zona Residencia], dbo.[Zona Residencia].[Código Zona Residencia], dbo.[Zona Residencia].[Zona Residencia], 
                  dbo.Entidad1888.Talla, dbo.Entidad1888.Peso, dbo.Entidad1888.[Id Etnia], dbo.Etnia.[Código Etnia], dbo.Etnia.Etnia, dbo.Entidad1888.[Comunidad Etnica], dbo.Entidad1888.[Id Discapacidad], 
                  dbo.Discapacidad.Codigo AS codigoDiscapacidad, dbo.Discapacidad.Discapacidad, dbo.Sexo.Sexo AS SexoPaciente
FROM     dbo.Entidad INNER JOIN
                  dbo.EntidadII ON dbo.Entidad.[Documento Entidad] = dbo.EntidadII.[Documento Entidad] LEFT OUTER JOIN
                  dbo.EntidadIII ON dbo.Entidad.[Documento Entidad] = dbo.EntidadIII.[Documento Entidad] LEFT OUTER JOIN
                  dbo.Sexo ON dbo.EntidadIII.[Id Sexo] = dbo.Sexo.[Id Sexo] LEFT OUTER JOIN
                  dbo.[Tipo de Documento] ON dbo.Entidad.[Id Tipo de Documento] = dbo.[Tipo de Documento].[Id Tipo de Documento] LEFT OUTER JOIN
                  dbo.Entidad1888 ON dbo.Entidad.[Documento Entidad] = dbo.Entidad1888.[Documento Entidad] LEFT OUTER JOIN
                  dbo.[Sexo Identidad Genero] ON dbo.Entidad1888.[Id Identidad Genero] = dbo.[Sexo Identidad Genero].[Id Sexo Identidad Genero] LEFT OUTER JOIN
                  dbo.Ciudad AS [Ciudad Recidencia] ON dbo.Entidad1888.[Id Municipio Recidencia] = [Ciudad Recidencia].[Id Ciudad] LEFT OUTER JOIN
                  dbo.[Zona Residencia] ON dbo.EntidadIII.[Id Zona Residencia] = dbo.[Zona Residencia].[Id Zona Residencia] LEFT OUTER JOIN
                  dbo.Etnia ON dbo.Entidad1888.[Id Etnia] = dbo.Etnia.[Id Etnia] LEFT OUTER JOIN
                  dbo.Discapacidad ON dbo.Entidad1888.[Id Discapacidad] = dbo.Discapacidad.[Id Discapacidad] LEFT OUTER JOIN
                  dbo.País AS País_recidencia ON dbo.Entidad1888.[Id Pais Recidencia] = País_recidencia.[Id País] LEFT OUTER JOIN
                  dbo.País AS Pais_Nacionalidad ON dbo.Entidad1888.[Id Pais Nacionalidad] = Pais_Nacionalidad.[Id País]
GO


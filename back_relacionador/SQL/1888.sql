

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


create table Discapacidad (
[Id Discapacidad] int identity(1,1) primary key  not null,
 [Codigo] varchar (10) Null, 
 [Discapacidad] varchar (30) Null,
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
GO

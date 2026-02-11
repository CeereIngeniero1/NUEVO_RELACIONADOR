Create table [Sexo Identidad Genero](
[Id Sexo Identidad Genero] int identity(1,1) not null,
 [Codigo] varchar (10) Null, 
 [Identidad Genero] varchar (30) Null,
 [Descripcion Identidad Genero] varchar (60) Null,
 [Id Estado] int Null

)



create table Discapacidad (
[Id Discapacidad] int identity(1,1) not null,
 [Codigo] varchar (10) Null, 
 [Discapacidad] varchar (30) Null,
 [Descripcion Discapacidad] varchar (60) Null,
 [Id Estado] int Null
)



CREATE TABLE [Entidad1888](
	[Id Entidad1888] [int] IDENTITY(1,1) NOT NULL,
	[Documento Entidad] [nvarchar](50) NULL,
	[Id Identidad Genero] int not null,
	[Talla] varchar(10) not null ,
	[Peso] varchar(10) not null ,
	[Id Etnia] int Not null,
	[Comunidad Etnica] varchar (50) not null,
	[Id Discapacidad] int Not null
	
)
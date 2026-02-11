

CREATE TABLE [Entidad1888](
	[Id Entidad1888] [int] IDENTITY(1,1) NOT NULL,
	[Documento Entidad] [nvarchar](50) NULL,
	[Id Identidad Genero] int not null,
	[Talla] varchar(10) not null ,
	[Peso] varchar(10) not null ,
	[Id Etnia] int Not null,
	[Comunidad Etnica] varchar (50) not null,
	[Id Discapacidad] int Not null
    [Alergias] varchar (90) null,
	
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

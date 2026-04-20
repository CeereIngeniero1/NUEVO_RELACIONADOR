CREATE TABLE Entidad_Rips_2275 
(
    Documento_Entidad NVARCHAR (50) PRIMARY KEY NOT NULL
)

INSERT INTO Entidad_Rips_2275 SELECT [Documento entidad] FROM entidad;

CREATE TABLE RIPS_Tipo_De_Archivo
(
Id_RIPS_Tipo_De_Archivo INT IDENTITY(1,1) PRIMARY KEY,
Codigo_Tipo_Rips nvarchar(2) not null,
Descripcion_Rips nvarchar(50) not null,
Estado int
)

INSERT INTO RIPS_Tipo_De_Archivo
VALUES
('AC','Archivo de Consulta',7),
('AP','Archivo de Procedimiento',7)


INSERT INTO Entidad_Rips_2275 SELECT [Documento entidad] FROM entidad;

ALTER TABLE [RIPS Finalidad Consulta Version2]
ADD CONSTRAINT PK_FINALIDAD_V2 PRIMARY KEY ([Id Finalidad Consulta])

ALTER TABLE [RIPS Causa Externa Version2]
ADD CONSTRAINT PK_CausA_Externa_V2 PRIMARY KEY ([Id RIPS Causa Externa Version2])

CREATE TABLE Rips_2275
(
    Id_Rips_2275 INT IDENTITY(1, 1) PRIMARY KEY,
    Id_Evaluacion_Entidad INT NOT NULL,
    Id_Evaluacion_Entidad_Rips INT NOT NULL,
    Documento_Paciente NVARCHAR(50) NOT NULL,
    Constraint FK_Doc_Paciente_2275
    foreign key (Documento_Paciente)
    references Entidad_Rips_2275
    ON UPDATE CASCADE,
    
    Fecha_Creacion_Rips DATETIME DEFAULT GETDATE() NOT NULL,
    Fecha_Evaluacion_Entidad DATETIME NULL,
    Id_Tipo_De_Archivo INT NOT NULL,
    CONSTRAINT FK_Id_Tipo_De_Archivo
    FOREIGN KEY (Id_Tipo_De_Archivo)
    REFERENCES RIPS_Tipo_De_Archivo
    ON UPDATE CASCADE,

    Id_Tipo_De_Rips INT NOT NULL,
    CONSTRAINT FK_Id_Tipo_De_Rips
    FOREIGN KEY (Id_Tipo_De_Rips)
    REFERENCES [Tipo Rips]
    ON UPDATE CASCADE,
    Documento_Tipo_Rips NVARCHAR(50) NOT NULL,
    --Constraint FK_Documento_Tipo_Rips
    --foreign key (Documento_Tipo_Rips)
    --references Entidad_Rips_2275
    --ON UPDATE CASCADE,
    Id_Modalidad_Atencion INT NOT NULL,
    Constraint FK_Id_Modalidad_Atencion
    foreign key (Id_Modalidad_Atencion)
    references [RIPS Modalidad Atención]
    ON UPDATE CASCADE,
    Id_Grupo_Servicios INT NOT NULL,
    Constraint FK_Id_Grupo_Servicios
    foreign key (Id_Grupo_Servicios)
    references [RIPS Grupo Servicios]
    ON UPDATE CASCADE,
    Id_Servicios INT NOT NULL,
    Constraint FK_Id_Servicios
    foreign key (Id_Servicios)
    references [RIPS Servicios]
    ON UPDATE CASCADE,
    Id_Finalidad_Consulta_Version2 INT NOT NULL,
    Constraint FK_Id_Finalidad_Consulta_Version2
    foreign key (Id_Finalidad_Consulta_Version2)
    references [RIPS Finalidad Consulta Version2]
    ON UPDATE CASCADE,
    Id_Causa_Externa_Version2 INT NULL,
    Constraint FK_Id_Causa_Externa_Version2
    foreign key (Id_Causa_Externa_Version2)
    references [RIPS Causa Externa Version2]
    ON UPDATE CASCADE,
    Id_Tipo_Diagnostico_Principal INT NOT NULL,
    Constraint FK_Id_Tipo_Diagnostico_Principal
    foreign key (Id_Tipo_Diagnostico_Principal)
    references [Tipo de Diagnóstico Principal]
    ON UPDATE CASCADE,
    Id_Via_Ingreso_Usuario INT NULL,
    Constraint FK_Id_Via_Ingreso_Usuario
    foreign key (Id_Via_Ingreso_Usuario)
    references [RIPS Via Ingreso Usuario]
    ON UPDATE CASCADE,
);
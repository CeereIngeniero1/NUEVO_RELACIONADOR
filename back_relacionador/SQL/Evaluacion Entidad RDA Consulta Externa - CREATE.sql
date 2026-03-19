/*
  RDA Consulta Externa — tablas (Resolución 1888)
  ------------------------------------------------
  Misma lógica que [Evaluacion Entidad RDA] + tablas de antecedentes:
    - Una fila principal por registro de consulta externa (campos del formulario RDACE).
    - Varias filas en tablas hijas para listas (antecedentes, diagnósticos relacionados, etc.).

  Nombre del objeto (equivale a "Evaluacion Entidad RDA consulta externa"; SQL Server no distingue mayúsculas):
    [Evaluacion Entidad RDA Consulta Externa]

  Ejecutar UNA VEZ en la base donde vive el relacionador. Si las tablas ya existen, omitir o eliminar los CREATE.

  Backend: POST /apiV3/EvaluacionEntidadRDACE/ y subrutas en Asignar_RipsRoutes V3.js
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* Tabla principal: todos los campos escalares del formulario RDACE */
IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa](
        [Id Evaluacion Entidad RDA Consulta Externa] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_EvaluacionEntidadRDAConsultaExterna PRIMARY KEY,
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
        [Id Estado]                       INT           NOT NULL CONSTRAINT DF_RDACE_IdEstado DEFAULT (1)
    );
END
GO

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Antecedentes Salud]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Evaluacion Entidad RDA CE Antecedentes Salud] (
        [ID Antecedente Salud CE] INT NOT NULL IDENTITY(1,1)
            CONSTRAINT PK_RDACE_AntecedentesSalud PRIMARY KEY,
        [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
        [Documento Entidad] NVARCHAR(50) NOT NULL,
        [Descripcion] VARCHAR(500) NOT NULL,
        [Id Estado] INT NOT NULL,
        CONSTRAINT FK_RDACE_AntecedentesSalud
            FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
            REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
    );
END
GO

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Antecedentes Familiares]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Evaluacion Entidad RDA CE Antecedentes Familiares] (
        [ID Antecedente Familiar CE] INT NOT NULL IDENTITY(1,1)
            CONSTRAINT PK_RDACE_AntecedentesFamiliares PRIMARY KEY,
        [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
        [Documento Entidad] NVARCHAR(50) NOT NULL,
        [Parentesco] NVARCHAR(100) NULL,
        [Descripcion] VARCHAR(500) NOT NULL,
        [Id Estado] INT NOT NULL,
        CONSTRAINT FK_RDACE_AntecedentesFamiliares
            FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
            REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
    );
END
GO

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Antecedentes Farmacologicos]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Evaluacion Entidad RDA CE Antecedentes Farmacologicos] (
        [ID Antecedente Farmacologico CE] INT NOT NULL IDENTITY(1,1)
            CONSTRAINT PK_RDACE_AntecedentesFarmacologicos PRIMARY KEY,
        [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
        [Documento Entidad] NVARCHAR(50) NOT NULL,
        [Descripcion] VARCHAR(500) NOT NULL,
        [Id Estado] INT NOT NULL,
        CONSTRAINT FK_RDACE_AntecedentesFarmacologicos
            FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
            REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
    );
END
GO

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados] (
        [ID Diagnostico Relacionado CE] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RDACE_DiagnosticosRelacionados PRIMARY KEY,
        [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
        [Codigo CIE10] NVARCHAR(20) NULL,
        [Nombre CIE10] NVARCHAR(500) NULL,
        [Codigo CIE11] NVARCHAR(50) NULL,
        [Termino CIE11] NVARCHAR(500) NULL,
        [Id Estado] INT NOT NULL CONSTRAINT DF_RDACE_DxRel_IdEstado DEFAULT (1),
        CONSTRAINT FK_RDACE_DiagnosticosRelacionados
            FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
            REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
    );
END
GO

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos] (
        [ID Prescripcion Medicamento CE] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RDACE_PrescripcionMedicamentos PRIMARY KEY,
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
        [Id Estado] INT NOT NULL CONSTRAINT DF_RDACE_PresMed_IdEstado DEFAULT (1),
        CONSTRAINT FK_RDACE_PrescripcionMedicamentos
            FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
            REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
    );
END
GO

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos] (
        [ID Prescripcion Procedimiento CE] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RDACE_PrescripcionProcedimientos PRIMARY KEY,
        [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
        [Tipo Tec Salud] NVARCHAR(100) NULL,
        [Codigo Procedimiento] NVARCHAR(50) NULL,
        [Nombre Procedimiento] NVARCHAR(400) NULL,
        [Finalidad Tec Salud] NVARCHAR(200) NULL,
        [Fecha Prescripcion] DATETIME NULL,
        [Id Estado] INT NOT NULL CONSTRAINT DF_RDACE_PresProc_IdEstado DEFAULT (1),
        CONSTRAINT FK_RDACE_PrescripcionProcedimientos
            FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
            REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
    );
END
GO

IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Otras Tecnologias]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Evaluacion Entidad RDA CE Otras Tecnologias] (
        [ID Otra Tecnologia CE] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RDACE_OtrasTecnologias PRIMARY KEY,
        [Id Evaluacion Entidad RDA Consulta Externa] INT NOT NULL,
        [Tipo Tec Salud] NVARCHAR(200) NULL,
        [Codigo] NVARCHAR(100) NULL,
        [Nombre] NVARCHAR(400) NULL,
        [Fecha Prescripcion] DATETIME NULL,
        [Finalidad Tec Salud] NVARCHAR(200) NULL,
        [Id Estado] INT NOT NULL CONSTRAINT DF_RDACE_OtrasTec_IdEstado DEFAULT (1),
        CONSTRAINT FK_RDACE_OtrasTecnologias
            FOREIGN KEY ([Id Evaluacion Entidad RDA Consulta Externa])
            REFERENCES [Evaluacion Entidad RDA Consulta Externa]([Id Evaluacion Entidad RDA Consulta Externa])
    );
END
GO

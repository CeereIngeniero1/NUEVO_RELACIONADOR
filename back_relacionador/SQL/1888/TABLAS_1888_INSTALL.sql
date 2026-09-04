/*
==============================================================================
  TABLAS RELACIONADOR 1888 — INSTALACIÓN IDEMPOTENTE
==============================================================================
  Crea tablas Resolución 1888 / RDA sin DROP ni USE AcQuir.

  Orden de ejecución:
    1. TABLAS_1888_INSTALL.sql (este)
    2. ALTER_1888_INSTALL.sql
    3. UPDATES_1888_INSTALL.sql
    4. DATOS_1888_INSTALL.sql
    4b. CATALOGOS_RDA_FHIR_INSTALL.sql
    5. VISTAS_1888_INSTALL.sql

  Prerrequisitos:
    - Base CeereSIO (dbo)
    - Opcional: tablas RIPS 2275 si RDACE usa modalidad/grupo/vía

  Fuentes:
    - 1888.sql
    - Evaluacion Entidad RDA Consulta Externa - CREATE.sql
    - 1888 update a registros malos.sql (catálogos RDA FHIR)

  Nota: datos MERGE de RDA_* van en CATALOGOS_RDA_FHIR_INSTALL.sql (paso 4b).
==============================================================================
*/

SET NOCOUNT ON;
GO

/* ============================================================================
   Entidad1888 y catálogos demográficos
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Entidad1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Entidad1888 (
        [Id Entidad1888] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Entidad1888 PRIMARY KEY,
        [Documento Entidad] NVARCHAR(50) NULL,
        [Id Identidad Genero] INT NULL,
        Talla VARCHAR(10) NULL,
        Peso VARCHAR(10) NULL,
        [Id Etnia] INT NULL,
        [Comunidad Etnica] VARCHAR(50) NULL,
        [Id Discapacidad] INT NULL,
        Alergias VARCHAR(90) NULL,
        [Id Pais Nacionalidad] INT NULL,
        [Id Pais Recidencia] INT NULL,
        [Id Municipio Recidencia] INT NULL,
        Alergeno VARCHAR(200) NULL
    );
    PRINT N'Tabla Entidad1888 creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Discapacidad' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Discapacidad (
        [Id Discapacidad] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(10) NULL,
        Discapacidad VARCHAR(60) NULL,
        [Descripcion Discapacidad] VARCHAR(60) NULL,
        [Id Estado] INT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Etnia' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Etnia (
        [Id Etnia] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Código Etnia] NVARCHAR(50) NULL,
        Etnia NVARCHAR(200) NULL,
        [Descripción Etnia] NVARCHAR(200) NULL,
        [Orden Etnia] INT NULL,
        [Id Estado] INT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Sexo Identidad Genero' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Sexo Identidad Genero] (
        [Id Sexo Identidad Genero] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(10) NULL,
        [Identidad Genero] VARCHAR(30) NULL,
        [Descripcion Identidad Genero] VARCHAR(60) NULL,
        [Id Estado] INT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'País1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.País1888 (
        [Id Pais1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(20) NULL,
        Nombre VARCHAR(50) NULL,
        Estado INT NOT NULL CONSTRAINT DF_Pais1888_Estado DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Ciudad1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Ciudad1888 (
        [Id Ciudad1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(20) NULL,
        Nombre VARCHAR(50) NULL,
        Estado INT NOT NULL CONSTRAINT DF_Ciudad1888_Estado DEFAULT (7)
    );
END
GO

/* Regimen y EPS SGSSS */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Regimen' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Regimen (
        [Id Regimen] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        [Id Estado] INT NOT NULL,
        CONSTRAINT UQ_Regimen_Nombre UNIQUE (Nombre)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Entidades sgsss 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Entidades sgsss 1888] (
        [Id sgsss] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo NVARCHAR(20) NOT NULL,
        Nombre NVARCHAR(500) NOT NULL,
        [Id Estado] INT NOT NULL,
        [Id Regimen] INT NOT NULL,
        CONSTRAINT FK_EntidadesSGSSS_Regimen
            FOREIGN KEY ([Id Regimen]) REFERENCES dbo.Regimen ([Id Regimen]),
        CONSTRAINT UQ_EntidadesSGSSS_Codigo UNIQUE (Codigo)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Entidades Prepagadas 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Entidades Prepagadas 1888] (
        [Id Entidades Prepagadas 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo NVARCHAR(20) NULL,
        Nombre NVARCHAR(500) NULL,
        [Id Estado] INT NULL CONSTRAINT DF_EntidadesPrepagadas1888_IdEstado DEFAULT (7)
    );
END
GO

/* Antecedentes plantilla */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Antecedentes Salud 1888' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Antecedentes Salud 1888] (
        [ID Antecedente Salud 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Entidad] NVARCHAR(50) NULL,
        Descripcion VARCHAR(500) NULL,
        [Id Estado] INT NULL
    );
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Antecedentes Familiares 1888' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Antecedentes Familiares 1888] (
        [ID Antecedente Familiar 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Entidad] NVARCHAR(50) NULL,
        Parentesco NVARCHAR(100) NULL,
        Descripcion VARCHAR(500) NULL,
        [Id Estado] INT NULL
    );
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Antecedentes Farmacologicos 1888' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Antecedentes Farmacologicos 1888] (
        [ID Antecedente Farmacologico 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Entidad] NVARCHAR(50) NULL,
        Descripcion VARCHAR(500) NULL,
        [Id Estado] INT NULL
    );
GO

/* Evaluacion Entidad RDA Paciente */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Evaluacion Entidad RDA' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Evaluacion Entidad RDA] (
        [Id Evaluacion Entidad RDA] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Entidad] VARCHAR(50) NULL,
        [Fecha RDA] DATETIME NOT NULL,
        [Id Tipo Documento] INT NULL,
        [Primer Apellido Entidad] NVARCHAR(100) NULL,
        [Segundo Apellido Entidad] NVARCHAR(100) NULL,
        [Primer Nombre Entidad] NVARCHAR(100) NULL,
        [Segundo Nombre Entidad] NVARCHAR(50) NULL,
        [Fecha Nacimiento] DATETIME NULL,
        Edad FLOAT NULL,
        [Id Unidad de Medida Edad] INT NULL,
        [Id Sexo Biologico] INT NULL,
        [Id Identidad Genero] INT NULL,
        [Id Pais Nacionalidad] INT NULL,
        Talla VARCHAR(10) NOT NULL CONSTRAINT DF_EERDA_Talla DEFAULT (N'0'),
        Peso VARCHAR(10) NOT NULL CONSTRAINT DF_EERDA_Peso DEFAULT (N'0'),
        [Id Pais Recidencia] INT NULL,
        [Id Municipio Recidencia] INT NULL,
        [Id Zona Residencia] INT NULL,
        Dirección NVARCHAR(255) NULL,
        [Id Etnia] INT NULL,
        [Comunidad Etnica] VARCHAR(50) NOT NULL CONSTRAINT DF_EERDA_Comunidad DEFAULT (N''),
        [Id Discapacidad] INT NULL,
        [Teléfono Celular] NVARCHAR(50) NULL,
        Alergeno VARCHAR(200) NULL,
        [Codigo Prestador] NVARCHAR(50) NULL,
        [Codigo Admin Plan Beneficios] NVARCHAR(50) NULL,
        [Nombre Admin Plan Beneficios] NVARCHAR(200) NULL,
        [Fecha Hora Inicio Atencion] DATETIME NULL,
        [Fecha Hora Fin Atencion] DATETIME NULL,
        [Tipo Doc Profesional] VARCHAR(10) NULL,
        [Num Doc Profesional] NVARCHAR(50) NULL,
        [Diagnostico Ingreso CIE11 Codigo] NVARCHAR(50) NULL,
        [Diagnostico Ingreso CIE11 Termino] NVARCHAR(200) NULL,
        [Tipo Alergia] VARCHAR(5) NULL,
        [Id Modalidad Atencion] INT NULL,
        [Id Grupo Servicios] INT NULL,
        [NIT Prestador IPS] NVARCHAR(20) NULL,
        [Nombre Prestador IPS] NVARCHAR(200) NULL,
        [Enviado] INT NOT NULL CONSTRAINT DF_EERDA_Enviado DEFAULT (0),
        [Enviado pruebas] INT NOT NULL CONSTRAINT DF_EERDA_EnviadoPruebas DEFAULT (0)
    );
END
GO

/* Hijos RDA Paciente */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Evaluacion Entidad RDA Antecedentes Salud' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Evaluacion Entidad RDA Antecedentes Salud] (
        [ID Antecedente Salud] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Id Evaluacion Entidad RDA] INT NOT NULL,
        [Documento Entidad] NVARCHAR(50) NOT NULL,
        Descripcion VARCHAR(500) NOT NULL,
        [Id Estado] INT NOT NULL
    );
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Evaluacion Entidad RDA Antecedentes Familiares' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Evaluacion Entidad RDA Antecedentes Familiares] (
        [ID Antecedente Familiar] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Id Evaluacion Entidad RDA] INT NOT NULL,
        [Documento Entidad] NVARCHAR(50) NOT NULL,
        Parentesco NVARCHAR(100) NULL,
        Descripcion VARCHAR(500) NOT NULL,
        [CIE11 Codigo] NVARCHAR(50) NULL,
        [CIE11 Termino] NVARCHAR(300) NULL,
        [Id Estado] INT NOT NULL
    );
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Evaluacion Entidad RDA Antecedentes Farmacologicos' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Evaluacion Entidad RDA Antecedentes Farmacologicos] (
        [ID Antecedente Farmacologico] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Id Evaluacion Entidad RDA] INT NOT NULL,
        [Documento Entidad] NVARCHAR(50) NOT NULL,
        Descripcion VARCHAR(500) NOT NULL,
        [Id Estado] INT NOT NULL
    );
GO

/* Catálogos CodeSystem 1888 */

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Factor De Riesgo 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Factor De Riesgo 1888] (
        [Id Factor De Riesgo 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_FactorRiesgo1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Tipo de tecnología en salud 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Tipo de tecnología en salud 1888] (
        [Id Tipo de tecnología en salud 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_TipoTecSalud1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Entorno de atencion 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Entorno de atencion 1888] (
        [Id Entorno de atencion 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_EntornoAtencion1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Tipo de alergia 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Tipo de alergia 1888] (
        [Id Tipo de alergia 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_TipoAlergia1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Parentesco familiar RDA 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Parentesco familiar RDA 1888] (
        [Id Parentesco familiar RDA 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_ParentescoFamiliar1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Tipo diagnostico principal 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Tipo diagnostico principal 1888] (
        [Id Tipo diagnostico principal 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_TipoDxPrincipal1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Unidad medida dosis 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Unidad medida dosis 1888] (
        [Id Unidad medida dosis 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50), Descripcion VARCHAR(200), Nombre VARCHAR(100) NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_UMDosis1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Otra tecnologia categoria 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Otra tecnologia categoria 1888] (
        [Id Otra tecnologia categoria 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_OtraTecCat1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Alcance incapacidad 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Alcance incapacidad 1888] (
        [Id Alcance incapacidad 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_AlcanceIncap1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Egreso y Remision 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Egreso y Remision 1888] (
        [Id Egreso y Remision 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_EgresoRemision1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Ocupacion 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Ocupacion 1888] (
        [Id Ocupacion 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(20), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_Ocupacion1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Via administracion medicamento 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Via administracion medicamento 1888] (
        [Id Via administracion medicamento 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50), Descripcion VARCHAR(200), Nombre VARCHAR(150) NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_ViaAdmMed1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Unidad tiempo duracion 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Unidad tiempo duracion 1888] (
        [Id Unidad tiempo duracion 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_UTDuracion1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Unidad tiempo frecuencia 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Unidad tiempo frecuencia 1888] (
        [Id Unidad tiempo frecuencia 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_UTFrecuencia1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Finalidad tecnologia salud 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Finalidad tecnologia salud 1888] (
        [Id Finalidad tecnologia salud 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50), Descripcion VARCHAR(200), Nombre VARCHAR(250) NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_FinalidadTecSalud1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Medicamento DCI 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Medicamento DCI 1888] (
        [Id Medicamento DCI 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(50), Descripcion VARCHAR(500), [Id Estado] INT NOT NULL CONSTRAINT DF_MedicamentoDCI1888 DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'CUPS_Codigos' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[CUPS_Codigos] (
        IdCUPS INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo NVARCHAR(50) NOT NULL, Nombre NVARCHAR(500) NOT NULL, DefinicionUrl NVARCHAR(1000) NULL, IdEstado INT NOT NULL CONSTRAINT DF_CUPS_Codigos_IdEstado DEFAULT (7), FechaCarga DATETIME2(0) NOT NULL CONSTRAINT DF_CUPS_Codigos_FechaCarga DEFAULT (SYSDATETIME())
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'CIE11_Codigos' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[CIE11_Codigos] (
        IdCIE11 INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo NVARCHAR(50) NOT NULL, Nombre NVARCHAR(500) NOT NULL, DefinicionUrl NVARCHAR(1000) NULL, IdEstado INT NOT NULL CONSTRAINT DF_CIE11_Codigos_IdEstado DEFAULT (7), FechaCarga DATETIME2(0) NOT NULL CONSTRAINT DF_CIE11_Codigos_FechaCarga DEFAULT (SYSDATETIME())
    );
END
GO

/* ============================================================================
   RDA Consulta Externa y tablas hijas (Evaluacion Entidad RDA Consulta Externa - CREATE.sql)
   ============================================================================ */

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
        [Notas Adicionales PDF]           NVARCHAR(MAX) NULL,
        [Contenido Documento PDF]       VARBINARY(MAX) NULL,
        [Fecha Generacion Documento PDF]  DATETIME2(7)   NULL,
        [Id Modalidad Atencion]           INT           NULL,
        [Id Grupo Servicios]              INT           NULL,
        [Id Via Ingreso Usuario]          INT           NULL,
        [Id Causa Motivo Atencion]        INT           NULL,
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

/* ============================================================================
   Catálogos RDA FHIR (MedicationTime, UMM, VAD, ColombianTechModality)
   Datos: CATALOGOS_RDA_FHIR_INSTALL.sql
   ============================================================================ */

IF OBJECT_ID(N'dbo.RDA_MedicationTime', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RDA_MedicationTime (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        codigo VARCHAR(10) NOT NULL,
        display NVARCHAR(150) NOT NULL,
        system_url NVARCHAR(300) NOT NULL,
        fhir_duration_unit VARCHAR(10) NULL,
        id_estado INT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_RDA_MedicationTime_codigo_system UNIQUE (codigo, system_url)
    );
END
GO

IF OBJECT_ID(N'dbo.RDA_UMM', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RDA_UMM (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        codigo VARCHAR(30) NOT NULL,
        display NVARCHAR(200) NOT NULL,
        unidad NVARCHAR(100) NULL,
        system_url NVARCHAR(300) NOT NULL,
        id_estado INT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_RDA_UMM_codigo_system UNIQUE (codigo, system_url)
    );
END
GO

IF OBJECT_ID(N'dbo.RDA_ViaAdministracion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RDA_ViaAdministracion (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        codigo VARCHAR(30) NOT NULL,
        display NVARCHAR(200) NOT NULL,
        system_url NVARCHAR(300) NOT NULL,
        id_estado INT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_RDA_ViaAdministracion_codigo_system UNIQUE (codigo, system_url)
    );
END
GO

IF OBJECT_ID(N'dbo.RDA_ColombianTechModality', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RDA_ColombianTechModality (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        codigo VARCHAR(10) NOT NULL,
        display NVARCHAR(200) NOT NULL,
        system_url NVARCHAR(300) NOT NULL,
        id_estado INT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_RDA_ColombianTechModality_codigo_system UNIQUE (codigo, system_url)
    );
END
GO

PRINT N'=== TABLAS_1888_INSTALL — instalación completada ===';
GO

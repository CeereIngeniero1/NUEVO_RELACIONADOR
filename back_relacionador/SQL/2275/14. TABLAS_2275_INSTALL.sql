/*
==============================================================================
  TABLAS RELACIONADOR 2275 — INSTALACIÓN IDEMPOTENTE
==============================================================================
  Crea tablas nuevas del módulo RIPS 2275 sin DROP ni USE de base.

  Orden de ejecución (carpeta 2275 / 1888):
    1. 14. TABLAS_2275_INSTALL.sql (este archivo)
    2. 15. ALTER_2275_INSTALL.sql
    3. 16. UPDATES_2275_INSTALL.sql
    4. 17. DATOS_2275_INSTALL.sql
    5. 13. VISTAS_2275_INSTALL.sql

  Prerrequisitos:
    - Base de datos CeereSIO del cliente (esquema dbo)
    - Tablas CeereSIO existentes: [Tipo Rips], [Tipo de Diagnóstico Principal], Entidad, etc.

  Fuentes analizadas:
    - 2. Datos de las tablas de rips y cups.sql
    - 3. Query.sql
    - 4. QUERRYS Asignar Rips.sql
    - 7. Querys tablas nuevas (No necesario).sql
    - 8. Facturador.sql
    - 9. CredencialesSisproFevRips.sql
    - 11. Tabla_Rips_2275.sql
==============================================================================
*/

SET NOCOUNT ON;
GO

/* ============================================================================
   Catálogos RIPS base (Query.sql)
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RIPS Via Ingreso Usuario' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[RIPS Via Ingreso Usuario](
        [Id Via Ingreso Usuario] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RIPS_ViaIngresoUsuario PRIMARY KEY,
        [Codigo] NVARCHAR(50) NULL,
        [Nombre Via Ingreso Usuario] NVARCHAR(100) NULL,
        [Descripción Via Ingreso Usuario] NVARCHAR(200) NULL,
        [Orden Via Ingreso Usuario] INT NULL,
        [Id Estado] INT NULL
    );
    PRINT N'Tabla [RIPS Via Ingreso Usuario] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RIPS Modalidad Atención' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[RIPS Modalidad Atención](
        [Id Modalidad Atencion] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RIPS_ModalidadAtencion PRIMARY KEY,
        [Codigo] NVARCHAR(50) NULL,
        [Nombre Modalidad Atencion] NVARCHAR(100) NULL,
        [Descripción Modalidad Atencion] NVARCHAR(200) NULL,
        [Orden Modalidad Atencion] INT NULL
            CONSTRAINT DF_ModalidadAtencion_OrdenModalidadAtencion DEFAULT (1),
        [Id Estado] INT NULL
            CONSTRAINT DF_ModalidadAtencion_IdEstado DEFAULT (7)
    );
    PRINT N'Tabla [RIPS Modalidad Atención] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RIPS Grupo Servicios' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[RIPS Grupo Servicios](
        [Id Grupo Servicios] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RIPS_GrupoServicios PRIMARY KEY,
        [Codigo] NVARCHAR(50) NULL,
        [Nombre Grupo Servicios] NVARCHAR(100) NULL,
        [Descripción Grupo Servicios] NVARCHAR(200) NULL,
        [Orden Grupo Servicios] INT NULL
            CONSTRAINT DF_GrupoServicios_OrdenGrupoServicios DEFAULT (1),
        [Id Estado] INT NULL
            CONSTRAINT DF_GrupoServicios_IdEstado DEFAULT (7)
    );
    PRINT N'Tabla [RIPS Grupo Servicios] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RIPS Servicios' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[RIPS Servicios](
        [Id Servicios] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RIPS_Servicios PRIMARY KEY,
        [Código Servicios] NVARCHAR(20) NULL,
        [Nombre Servicios] NVARCHAR(500) NULL,
        [Descripción Servicios] NVARCHAR(100) NULL,
        [Id Estado] INT NULL
    );
    PRINT N'Tabla [RIPS Servicios] creada.';
END
GO

/* ============================================================================
   CIE10 y CUPS legacy RIPS (Datos de las tablas de rips y cups.sql)
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Rips Cie10' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Rips Cie10] (
        Tabla VARCHAR(50),
        Codigo VARCHAR(10),
        Nombre VARCHAR(255),
        Descripcion VARCHAR(255),
        AplicaASexo INT,
        EdadMinima INT,
        EdadMaxima INT,
        GrupoMortalidad INT,
        Extra_V VARCHAR(255),
        Extra_VI_Capitulo VARCHAR(10),
        SubGrupo VARCHAR(10),
        Sexo CHAR(1)
    );
    PRINT N'Tabla [Rips Cie10] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Rips Cups' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Rips Cups] (
        Tabla VARCHAR(50),
        Codigo VARCHAR(10),
        Nombre VARCHAR(255),
        Descripcion VARCHAR(255),
        Tipo VARCHAR(50)
    );
    PRINT N'Tabla [Rips Cups] creada.';
END
GO

/* ============================================================================
   Catálogos Version2 y API (QUERRYS Asignar Rips.sql, Querys tablas nuevas)
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RIPS Finalidad Consulta Version2' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[RIPS Finalidad Consulta Version2](
        [Id Finalidad Consulta] INT IDENTITY(1,1) NOT NULL,
        [Codigo] NVARCHAR(50) NULL,
        [Nombre RIPS Finalidad Consulta Version2] NVARCHAR(100) NULL,
        [Descripción RIPS Finalidad Consulta Version2] NVARCHAR(200) NULL,
        [Orden RIPS Finalidad Consulta Version2] INT NULL,
        [AC] NVARCHAR(10) NULL,
        [AP] NVARCHAR(10) NULL,
        [Id Estado] INT NULL,
        CONSTRAINT PK_FINALIDAD_V2 PRIMARY KEY ([Id Finalidad Consulta])
    );
    PRINT N'Tabla [RIPS Finalidad Consulta Version2] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RIPS Causa Externa Version2' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[RIPS Causa Externa Version2](
        [Id RIPS Causa Externa Version2] INT IDENTITY(1,1) NOT NULL,
        [Codigo] NVARCHAR(50) NULL,
        [Nombre RIPS Causa Externa Version2] NVARCHAR(200) NULL,
        [Descripción RIPS Causa Externa Version2] NVARCHAR(200) NULL,
        [Orden RIPS Causa Externa Version2] INT NULL,
        [Id Estado] INT NULL,
        CONSTRAINT PK_CausA_Externa_V2 PRIMARY KEY ([Id RIPS Causa Externa Version2])
    );
    PRINT N'Tabla [RIPS Causa Externa Version2] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Concepto Recaudo' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Concepto Recaudo](
        [Id Concepto Recaudo] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Codigo] NVARCHAR(50) NULL,
        [Nombre Concepto Recaudo] NVARCHAR(100) NULL,
        [Descripción Concepto Recaudo] NVARCHAR(200) NULL,
        [Orden Concepto Recaudo] INT NULL
            CONSTRAINT DF_conceptoRecaudo_OrdenconceptoRecaudo DEFAULT (1),
        [Id Estado] INT NULL
            CONSTRAINT DF_conceptoRecaudo_IdEstado DEFAULT (7)
    );
    PRINT N'Tabla [Concepto Recaudo] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Tipo Pago Moderador' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Tipo Pago Moderador](
        [Id Tipo Pago Moderador] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Codigo] NVARCHAR(50) NULL,
        [Nombre Tipo Pago Moderador] NVARCHAR(200) NULL,
        [Descripción Tipo Pago Moderador] NVARCHAR(200) NULL,
        [Orden Tipo Pago Moderador] INT NULL
            CONSTRAINT DF_TipoPagoModerador_OrdenTipoPagoModerador DEFAULT (1),
        [Id Estado] INT NULL
            CONSTRAINT DF_TipoPagoModerador_IdEstado DEFAULT (7)
    );
    PRINT N'Tabla [Tipo Pago Moderador] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RIPS CUPS' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[RIPS CUPS](
        [Id Cups] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Código Cups] NVARCHAR(20) NULL,
        [Nombre Cups] NVARCHAR(500) NULL,
        [Uso Código Cups] NVARCHAR(20) NULL,
        [Id Estado] INT NULL
    );
    PRINT N'Tabla [RIPS CUPS] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RIPS CIE' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[RIPS CIE](
        [Id Cie] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Código Cie] NVARCHAR(20) NULL,
        [Nombre Cie] NVARCHAR(500) NULL,
        [Id Estado] INT NULL
    );
    PRINT N'Tabla [RIPS CIE] creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'CredencialesWSDLFacturaTech' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.CredencialesWSDLFacturaTech (
        [Id Credenciales WSDL] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Usuario] NVARCHAR(100) NULL,
        [Contrasena] NVARCHAR(100) NULL,
        [Documento Empresa] NVARCHAR(50) NULL,
        [URL SOAP] NVARCHAR(200) NULL
    );
    PRINT N'Tabla CredencialesWSDLFacturaTech creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Facturador' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Facturador (
        [Id Facturador] INT NOT NULL
            CONSTRAINT PK_Facturador PRIMARY KEY,
        [Facturador] VARCHAR(80) NOT NULL
    );
    PRINT N'Tabla Facturador creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'CredencialesSisproFevRips' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.CredencialesSisproFevRips (
        [Id Credenciales Sispro] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Empresa] NVARCHAR(50) NOT NULL,
        [Tipo Documento] NVARCHAR(10) NOT NULL
            CONSTRAINT DF_CredSispro_TipoDoc DEFAULT (N'CC'),
        [Numero Documento] NVARCHAR(50) NOT NULL,
        [Clave] NVARCHAR(200) NOT NULL,
        [Nit] NVARCHAR(50) NOT NULL,
        [Tipo Usuario] NVARCHAR(10) NOT NULL
            CONSTRAINT DF_CredSispro_TipoUsr DEFAULT (N'RE'),
        [Activo] BIT NOT NULL
            CONSTRAINT DF_CredSispro_Activo DEFAULT (1),
        [Fecha Actualizacion] DATETIME2 NOT NULL
            CONSTRAINT DF_CredSispro_Fecha DEFAULT (SYSUTCDATETIME())
    );
    CREATE UNIQUE INDEX UX_CredencialesSisproFevRips_Empresa
        ON dbo.CredencialesSisproFevRips ([Documento Empresa]);
    PRINT N'Tabla CredencialesSisproFevRips creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'API_RIPS_POR_DEFECTO' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.API_RIPS_POR_DEFECTO (
        [IdApiRipsPorDefecto] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_API_RIPS_POR_DEFECTO PRIMARY KEY,
        [DocumentoEntidad] NVARCHAR(50) NOT NULL,
        [TipoDeRips] INT NULL,
        [TipoDeUsuario] INT NULL,
        [Entidad] NVARCHAR(50) NULL,
        [ViaIngresoServicioSalud] NVARCHAR(10) NULL,
        [ModalidadGrupoServicioTecnologiaEnSalud] NVARCHAR(10) NULL,
        [GrupoServicios] NVARCHAR(10) NULL,
        [CodigoServicio] NVARCHAR(10) NULL,
        [FinalidadTecnologiaSalud] NVARCHAR(10) NULL,
        [CausaMotivoAtencion] NVARCHAR(10) NULL,
        [TipoDiagnosticoPrincipal] NVARCHAR(10) NULL,
        [Diagnostico1] NVARCHAR(10) NULL,
        [Diagnostico2] NVARCHAR(10) NULL,
        [Procedimiento1] NVARCHAR(10) NULL,
        [Procedimiento2] NVARCHAR(10) NULL
    );
    PRINT N'Tabla API_RIPS_POR_DEFECTO creada.';
END
GO

/* ============================================================================
   Tablas de seguimiento RIPS 2275 (Tabla_Rips_2275.sql)
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Entidad_Rips_2275' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Entidad_Rips_2275 (
        Documento_Entidad NVARCHAR(50) NOT NULL
            CONSTRAINT PK_Entidad_Rips_2275 PRIMARY KEY
    );
    PRINT N'Tabla Entidad_Rips_2275 creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'RIPS_Tipo_De_Archivo' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.RIPS_Tipo_De_Archivo (
        Id_RIPS_Tipo_De_Archivo INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RIPS_Tipo_De_Archivo PRIMARY KEY,
        Codigo_Tipo_Rips NVARCHAR(2) NOT NULL,
        Descripcion_Rips NVARCHAR(50) NOT NULL,
        Estado INT NULL
    );
    PRINT N'Tabla RIPS_Tipo_De_Archivo creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Rips_2275' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Rips_2275 (
        Id_Rips_2275 INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Rips_2275 PRIMARY KEY,
        Id_Evaluacion_Entidad INT NOT NULL,
        Id_Evaluacion_Entidad_Rips INT NOT NULL,
        Documento_Paciente NVARCHAR(50) NOT NULL,
        CONSTRAINT FK_Doc_Paciente_2275
            FOREIGN KEY (Documento_Paciente) REFERENCES dbo.Entidad_Rips_2275 (Documento_Entidad)
            ON UPDATE CASCADE,
        Fecha_Creacion_Rips DATETIME NOT NULL
            CONSTRAINT DF_Rips_2275_FechaCreacion DEFAULT (GETDATE()),
        Fecha_Evaluacion_Entidad DATETIME NULL,
        Id_Tipo_De_Archivo INT NOT NULL,
        CONSTRAINT FK_Id_Tipo_De_Archivo
            FOREIGN KEY (Id_Tipo_De_Archivo) REFERENCES dbo.RIPS_Tipo_De_Archivo (Id_RIPS_Tipo_De_Archivo)
            ON UPDATE CASCADE,
        Id_Tipo_De_Rips INT NOT NULL,
        CONSTRAINT FK_Id_Tipo_De_Rips
            FOREIGN KEY (Id_Tipo_De_Rips) REFERENCES dbo.[Tipo Rips] ([Id Tipo Rips])
            ON UPDATE CASCADE,
        Documento_Tipo_Rips NVARCHAR(50) NOT NULL,
        Id_Modalidad_Atencion INT NOT NULL,
        CONSTRAINT FK_Id_Modalidad_Atencion
            FOREIGN KEY (Id_Modalidad_Atencion) REFERENCES dbo.[RIPS Modalidad Atención] ([Id Modalidad Atencion])
            ON UPDATE CASCADE,
        Id_Grupo_Servicios INT NOT NULL,
        CONSTRAINT FK_Id_Grupo_Servicios
            FOREIGN KEY (Id_Grupo_Servicios) REFERENCES dbo.[RIPS Grupo Servicios] ([Id Grupo Servicios])
            ON UPDATE CASCADE,
        Id_Servicios INT NOT NULL,
        CONSTRAINT FK_Id_Servicios
            FOREIGN KEY (Id_Servicios) REFERENCES dbo.[RIPS Servicios] ([Id Servicios])
            ON UPDATE CASCADE,
        Id_Finalidad_Consulta_Version2 INT NOT NULL,
        CONSTRAINT FK_Id_Finalidad_Consulta_Version2
            FOREIGN KEY (Id_Finalidad_Consulta_Version2) REFERENCES dbo.[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta])
            ON UPDATE CASCADE,
        Id_Causa_Externa_Version2 INT NULL,
        CONSTRAINT FK_Id_Causa_Externa_Version2
            FOREIGN KEY (Id_Causa_Externa_Version2) REFERENCES dbo.[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2])
            ON UPDATE CASCADE,
        Id_Tipo_Diagnostico_Principal INT NOT NULL,
        CONSTRAINT FK_Id_Tipo_Diagnostico_Principal
            FOREIGN KEY (Id_Tipo_Diagnostico_Principal) REFERENCES dbo.[Tipo de Diagnóstico Principal] ([Id Tipo de Diagnóstico Principal])
            ON UPDATE CASCADE,
        Id_Via_Ingreso_Usuario INT NULL,
        CONSTRAINT FK_Id_Via_Ingreso_Usuario
            FOREIGN KEY (Id_Via_Ingreso_Usuario) REFERENCES dbo.[RIPS Via Ingreso Usuario] ([Id Via Ingreso Usuario])
            ON UPDATE CASCADE
    );
    PRINT N'Tabla Rips_2275 creada.';
END
GO

PRINT N'=== TABLAS_2275_INSTALL — instalación completada ===';
GO

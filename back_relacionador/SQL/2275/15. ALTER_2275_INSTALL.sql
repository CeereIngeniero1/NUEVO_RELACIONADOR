/*
==============================================================================
  ALTER RELACIONADOR 2275 — INSTALACIÓN IDEMPOTENTE
==============================================================================
  Agrega columnas, constraints e índices sin DROP de tablas.

  Orden de ejecución:
    1. 14. TABLAS_2275_INSTALL.sql
    2. 15. ALTER_2275_INSTALL.sql (este)
    3. 16. UPDATES_2275_INSTALL.sql
    4. 17. DATOS_2275_INSTALL.sql
    5. 13. VISTAS_2275_INSTALL.sql

  Prerrequisitos:
    - 14. TABLAS_2275_INSTALL.sql ejecutado previamente

  Fuentes:
    - 1. SCRIPT PARA RIPS AUTOMATICOS.sql
    - 3. Query.sql
    - 4. QUERRYS Asignar Rips.sql
    - 6. PARA_CONSECUTIVO.sql
    - 8. Facturador.sql
    - 9. Para Fenalco (Opcional).sql
    - 11. Tabla_Rips_2275.sql
    - 12. Alter_EvaluacionEntidadRips_FevRips_CUV.sql
==============================================================================
*/

SET NOCOUNT ON;
GO

/* --- [Evaluación Entidad Rips] — columnas RIPS automáticos y FEV-RIPS --- */

IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Factura') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Factura] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Plan de Tratamiento') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Plan de Tratamiento] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Modalidad Atencion') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Modalidad Atencion] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Grupo Servicios') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Grupo Servicios] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Servicios') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Servicios] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Via Ingreso Usuario') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Via Ingreso Usuario] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'ConsecutivoRipsFacturaEnCero') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD ConsecutivoRipsFacturaEnCero INT NULL;
GO

/* FEV-RIPS (12. Alter_EvaluacionEntidadRips_FevRips_CUV.sql) */
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Enviado FevRips') IS NULL
BEGIN
    ALTER TABLE dbo.[Evaluación Entidad Rips]
        ADD [Enviado FevRips] TINYINT NOT NULL
            CONSTRAINT DF_EvaEntRips_EnviadoFevRips DEFAULT (0);
END
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'CUV FevRips') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [CUV FevRips] NVARCHAR(100) NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Fecha Envio FevRips') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Fecha Envio FevRips] DATETIME2 NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Ambiente Envio FevRips') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Ambiente Envio FevRips] NVARCHAR(20) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_EvaEntRips_EnviadoFevRips'
    AND object_id = OBJECT_ID(N'dbo.[Evaluación Entidad Rips]'))
    CREATE INDEX IX_EvaEntRips_EnviadoFevRips
        ON dbo.[Evaluación Entidad Rips] ([Enviado FevRips], [Id Factura]);
GO

/* --- Empresa --- */
IF COL_LENGTH(N'dbo.Empresa', N'NroIDPrestador') IS NULL
    ALTER TABLE dbo.Empresa ADD NroIDPrestador NVARCHAR(50) NULL;
GO

/* --- EmpresaV (Fenalco opcional) --- */
IF COL_LENGTH(N'dbo.EmpresaV', N'idnumeracionFenalco') IS NULL
    ALTER TABLE dbo.EmpresaV ADD idnumeracionFenalco INT NULL;
GO

/* --- [Evaluación Entidad] — flag Rips --- */
IF COL_LENGTH(N'dbo.[Evaluación Entidad]', N'Rips') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad] ADD Rips BIT NOT NULL
        CONSTRAINT DF_EvaluacionEntidad_Rips DEFAULT (1);
GO

/* --- [RIPS Servicios] — relación con grupo --- */
IF COL_LENGTH(N'dbo.[RIPS Servicios]', N'Codigo Grupo Servicios') IS NULL
    ALTER TABLE dbo.[RIPS Servicios] ADD [Codigo Grupo Servicios] NVARCHAR(50) NULL;
GO

/* --- CredencialesWSDLFacturaTech --- */
IF COL_LENGTH(N'dbo.CredencialesWSDLFacturaTech', N'Id Facturador') IS NULL
    ALTER TABLE dbo.CredencialesWSDLFacturaTech ADD [Id Facturador] INT NULL;
GO

/* --- Defaults en catálogos Version2 (si tabla existe sin defaults) --- */
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RIPSFinalidadConsultaVersion2_OrdenRIPSFinalidadConsultaVersion2')
   AND OBJECT_ID(N'dbo.[RIPS Finalidad Consulta Version2]', N'U') IS NOT NULL
    ALTER TABLE dbo.[RIPS Finalidad Consulta Version2]
        ADD CONSTRAINT DF_RIPSFinalidadConsultaVersion2_OrdenRIPSFinalidadConsultaVersion2
        DEFAULT (1) FOR [Orden RIPS Finalidad Consulta Version2];
GO
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RIPSFinalidadConsultaVersion2_IdEstado')
   AND OBJECT_ID(N'dbo.[RIPS Finalidad Consulta Version2]', N'U') IS NOT NULL
    ALTER TABLE dbo.[RIPS Finalidad Consulta Version2]
        ADD CONSTRAINT DF_RIPSFinalidadConsultaVersion2_IdEstado DEFAULT (7) FOR [Id Estado];
GO
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RIPSCausaExternaVersion2_OrdenRIPSCausaExternaVersion2')
   AND OBJECT_ID(N'dbo.[RIPS Causa Externa Version2]', N'U') IS NOT NULL
    ALTER TABLE dbo.[RIPS Causa Externa Version2]
        ADD CONSTRAINT DF_RIPSCausaExternaVersion2_OrdenRIPSCausaExternaVersion2
        DEFAULT (1) FOR [Orden RIPS Causa Externa Version2];
GO
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RIPSCausaExternaVersion2_IdEstado')
   AND OBJECT_ID(N'dbo.[RIPS Causa Externa Version2]', N'U') IS NOT NULL
    ALTER TABLE dbo.[RIPS Causa Externa Version2]
        ADD CONSTRAINT DF_RIPSCausaExternaVersion2_IdEstado DEFAULT (7) FOR [Id Estado];
GO

/* --- PK en catálogos Version2 si faltan (11. Tabla_Rips_2275.sql) --- */
IF OBJECT_ID(N'dbo.[RIPS Finalidad Consulta Version2]', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_FINALIDAD_V2')
    ALTER TABLE dbo.[RIPS Finalidad Consulta Version2]
        ADD CONSTRAINT PK_FINALIDAD_V2 PRIMARY KEY ([Id Finalidad Consulta]);
GO
IF OBJECT_ID(N'dbo.[RIPS Causa Externa Version2]', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_CausA_Externa_V2')
    ALTER TABLE dbo.[RIPS Causa Externa Version2]
        ADD CONSTRAINT PK_CausA_Externa_V2 PRIMARY KEY ([Id RIPS Causa Externa Version2]);
GO

PRINT N'=== ALTER_2275_INSTALL — instalación completada ===';
GO

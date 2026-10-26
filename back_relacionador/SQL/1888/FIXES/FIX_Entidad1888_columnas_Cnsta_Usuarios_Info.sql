/*
==============================================================================
  HOTFIX — columnas faltantes para vistas 1888 (Message 207)
==============================================================================
  Cliente típico: tablas creadas incompletas (CREATE base sin ALTER / TABLAS
  antiguo) → falla al crear:
    - [Cnsta Relacionador Usuarios Info]  (Entidad1888)
    - [Cnsta Entidades Prepagadas 1888]   (Entidades Prepagadas 1888)

  Ejecutar en la BD del cliente, luego recrear vistas (VISTAS_1888_INSTALL.sql).
==============================================================================
*/

SET NOCOUNT ON;
GO

/* Entidad1888 — país / municipio / Alergeno */
IF COL_LENGTH(N'dbo.Entidad1888', N'Id Pais Nacionalidad') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Pais Nacionalidad] INT NULL;
GO

IF COL_LENGTH(N'dbo.Entidad1888', N'Id Pais Recidencia') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Pais Recidencia] INT NULL;
GO

IF COL_LENGTH(N'dbo.Entidad1888', N'Id Municipio Recidencia') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Municipio Recidencia] INT NULL;
GO

IF COL_LENGTH(N'dbo.Entidad1888', N'Alergeno') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD Alergeno VARCHAR(200) NULL;
GO

/* Entidades Prepagadas 1888 — Id Estado (DEFAULT 7 como 1888.sql) */
IF COL_LENGTH(N'dbo.[Entidades Prepagadas 1888]', N'Id Estado') IS NULL
    ALTER TABLE dbo.[Entidades Prepagadas 1888]
        ADD [Id Estado] INT NULL CONSTRAINT DF_EntidadesPrepagadas1888_IdEstado_HF DEFAULT (7);
GO

PRINT N'Hotfix: Entidad1888 + Entidades Prepagadas Id Estado verificados/agregados.';
GO

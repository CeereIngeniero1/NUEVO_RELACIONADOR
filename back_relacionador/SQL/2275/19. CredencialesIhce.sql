-- Credenciales IHCE (OAuth/APIM + custodian) por empresa y ambiente.
-- Reemplaza IHCE_SANDBOX_* / IHCE_PROD_* del .env en runtime RDA.
-- Ejecutar en la BD del Relacionador.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'CredencialesIhce' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.CredencialesIhce (
        [Id Credenciales Ihce] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_CredencialesIhce PRIMARY KEY,
        [Documento Empresa] NVARCHAR(50) NOT NULL,
        [Ambiente] NVARCHAR(20) NOT NULL,
        [Base Url] NVARCHAR(300) NULL,
        [Tenant Id] NVARCHAR(100) NULL,
        [Client Id] NVARCHAR(100) NULL,
        [Client Secret] NVARCHAR(500) NULL,
        [Scope] NVARCHAR(300) NULL,
        [Subscription Key] NVARCHAR(200) NULL,
        [Custodian Reps] NVARCHAR(50) NULL,
        [Custodian Nit] NVARCHAR(50) NULL,
        [Custodian Name] NVARCHAR(200) NULL,
        [Activo] BIT NOT NULL
            CONSTRAINT DF_CredencialesIhce_Activo DEFAULT (1),
        [Fecha Actualizacion] DATETIME2 NOT NULL
            CONSTRAINT DF_CredencialesIhce_Fecha DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_CredencialesIhce_Ambiente
            CHECK ([Ambiente] IN (N'sandbox', N'prod'))
    );

    CREATE UNIQUE INDEX UX_CredencialesIhce_Empresa_Ambiente
        ON dbo.CredencialesIhce ([Documento Empresa], [Ambiente]);

    PRINT N'Tabla CredencialesIhce creada.';
END
GO

/*
  Semilla inicial: una fila sandbox + una prod por cada empresa en dbo.Empresa.
  Solo Base Url genérica IHCE; Tenant/Client/Secret/Scope/Subscription/Custodian
  quedan NULL — completar por empresa en la UI Credenciales IHCE.
*/
;WITH Ambientes AS (
    SELECT N'sandbox' AS Ambiente
    UNION ALL
    SELECT N'prod'
),
Empresas AS (
    SELECT DISTINCT LTRIM(RTRIM([Documento Empresa])) AS DocumentoEmpresa
    FROM dbo.Empresa
    WHERE [Documento Empresa] IS NOT NULL
      AND LTRIM(RTRIM([Documento Empresa])) <> N''
)
INSERT INTO dbo.CredencialesIhce (
    [Documento Empresa],
    [Ambiente],
    [Base Url],
    [Tenant Id],
    [Client Id],
    [Client Secret],
    [Scope],
    [Subscription Key],
    [Custodian Reps],
    [Custodian Nit],
    [Custodian Name],
    [Activo]
)
SELECT
    e.DocumentoEmpresa,
    a.Ambiente,
    CASE WHEN a.Ambiente = N'sandbox'
        THEN N'https://sandbox.ihcecol.gov.co/ihce'
        ELSE N'https://www.ihcecol.gov.co/ihce'
    END,
    NULL, -- Tenant Id
    NULL, -- Client Id
    NULL, -- Client Secret
    NULL, -- Scope
    NULL, -- Subscription Key
    NULL, -- Custodian Reps
    NULL, -- Custodian Nit
    NULL, -- Custodian Name
    1
FROM Empresas e
CROSS JOIN Ambientes a
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.CredencialesIhce c
    WHERE c.[Documento Empresa] = e.DocumentoEmpresa
      AND c.[Ambiente] = a.Ambiente
);
GO

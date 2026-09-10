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
  Semilla inicial (sin secretos): URLs/tenant/clientId/scope/custodian de referencia Cliniq
  hacia TODAS las empresas en dbo.Empresa (sandbox + prod).
  Client Secret y Subscription Key quedan vacíos: cargarlas por empresa desde la UI
  Credenciales IHCE (Envío RDA) o con UPDATE controlado (no commitear secretos).
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
    N'3d4b3d76-b910-426c-bd8f-bd964e3e1b53',
    CASE WHEN a.Ambiente = N'sandbox'
        THEN N'b3b273e0-3afa-42d8-b081-e7c6ce246f9f'
        ELSE N'5db52798-a826-41b3-96a8-a0e1374cc718'
    END,
    N'', -- Client Secret: configurar por UI / UPDATE (no versionar)
    CASE WHEN a.Ambiente = N'sandbox'
        THEN N'api://ca9a5155-3135-4e44-a644-b92175eb4d21/.default'
        ELSE N'api://0789435e-b8df-40b1-8eac-76dc233bad0b/.default'
    END,
    N'', -- Subscription Key: configurar por UI / UPDATE (no versionar)
    N'0500110244',
    N'900063460',
    N'CLINIQ DERMOESTETICA Y LASER S.A',
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

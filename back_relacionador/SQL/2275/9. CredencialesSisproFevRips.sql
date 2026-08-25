-- Credenciales LoginSISPRO por empresa (API Docker FEV-RIPS)
-- Ejecutar una vez en la BD del Relacionador.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CredencialesSisproFevRips')
BEGIN
    CREATE TABLE CredencialesSisproFevRips (
        [Id Credenciales Sispro] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Empresa] NVARCHAR(50) NOT NULL,
        [Tipo Documento] NVARCHAR(10) NOT NULL CONSTRAINT DF_CredSispro_TipoDoc DEFAULT (N'CC'),
        [Numero Documento] NVARCHAR(50) NOT NULL,
        [Clave] NVARCHAR(200) NOT NULL,
        [Nit] NVARCHAR(50) NOT NULL,
        [Tipo Usuario] NVARCHAR(10) NOT NULL CONSTRAINT DF_CredSispro_TipoUsr DEFAULT (N'RE'),
        [Activo] BIT NOT NULL CONSTRAINT DF_CredSispro_Activo DEFAULT (1),
        [Fecha Actualizacion] DATETIME2 NOT NULL CONSTRAINT DF_CredSispro_Fecha DEFAULT (SYSUTCDATETIME())
    );

    CREATE UNIQUE INDEX UX_CredencialesSisproFevRips_Empresa
        ON CredencialesSisproFevRips ([Documento Empresa]);
END
GO

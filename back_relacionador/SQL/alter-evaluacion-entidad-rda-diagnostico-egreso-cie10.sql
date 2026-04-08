-- Resolución 1888 — RDA Paciente: diagnóstico principal al egreso (CIE-10) + tipo (01–03).
-- Idempotente: solo agrega columnas que aún no existen (puede ejecutarse varias veces).
--
-- Si ejecutó antes un ALTER "plain" y volvió a ejecutarlo, obtendrá Msg 2705:
-- significa que la columna ya está en la tabla; use este script en su lugar.

SET NOCOUNT ON;

DECLARE @oid INT = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA]', N'U');
IF @oid IS NULL
BEGIN
    RAISERROR(N'No existe la tabla [dbo].[Evaluacion Entidad RDA]. Revise la base de datos activa.', 16, 1);
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @oid AND name = N'Diagnostico Principal Egreso CIE10 Codigo')
BEGIN
    ALTER TABLE [dbo].[Evaluacion Entidad RDA]
    ADD [Diagnostico Principal Egreso CIE10 Codigo] NVARCHAR(20) NULL;
    PRINT N'Agregado: Diagnostico Principal Egreso CIE10 Codigo';
END
ELSE
    PRINT N'Ya existe (omitido): Diagnostico Principal Egreso CIE10 Codigo';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @oid AND name = N'Diagnostico Principal Egreso CIE10 Nombre')
BEGIN
    ALTER TABLE [dbo].[Evaluacion Entidad RDA]
    ADD [Diagnostico Principal Egreso CIE10 Nombre] NVARCHAR(500) NULL;
    PRINT N'Agregado: Diagnostico Principal Egreso CIE10 Nombre';
END
ELSE
    PRINT N'Ya existe (omitido): Diagnostico Principal Egreso CIE10 Nombre';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @oid AND name = N'Tipo Diagnostico Principal Egreso')
BEGIN
    ALTER TABLE [dbo].[Evaluacion Entidad RDA]
    ADD [Tipo Diagnostico Principal Egreso] NVARCHAR(20) NULL;
    PRINT N'Agregado: Tipo Diagnostico Principal Egreso';
END
ELSE
    PRINT N'Ya existe (omitido): Tipo Diagnostico Principal Egreso';

GO

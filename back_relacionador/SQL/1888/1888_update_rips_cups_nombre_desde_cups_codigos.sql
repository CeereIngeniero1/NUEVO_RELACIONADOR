/* Corrige Nombre en [Rips Cups] usando CUPS_Codigos (MinSalud / FHIR) cuando el código coincide */
SET NOCOUNT ON;

-- 1) Vista previa: filas que cambiarían (ejecutar primero y revisar)
SELECT
    r.Tabla,
    r.Codigo,
    r.Nombre AS NombreActual,
    LEFT(c.Nombre, 255) AS NombreNuevo,
    r.Descripcion,
    r.Tipo
FROM dbo.[Rips Cups] AS r
INNER JOIN dbo.CUPS_Codigos AS c
    ON LTRIM(RTRIM(r.Codigo)) = LTRIM(RTRIM(c.Codigo))
WHERE r.Nombre <> LEFT(c.Nombre, 255)
ORDER BY r.Codigo;

-- Resumen previo
SELECT
    COUNT(1) AS FilasACorregir
FROM dbo.[Rips Cups] AS r
INNER JOIN dbo.CUPS_Codigos AS c
    ON LTRIM(RTRIM(r.Codigo)) = LTRIM(RTRIM(c.Codigo))
WHERE r.Nombre <> LEFT(c.Nombre, 255);

SELECT
    COUNT(1) AS FilasRipsCupsSinMatchEnCUPS_Codigos
FROM dbo.[Rips Cups] AS r
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.CUPS_Codigos AS c
    WHERE LTRIM(RTRIM(c.Codigo)) = LTRIM(RTRIM(r.Codigo))
);

GO

-- 2) Actualización (descomentar COMMIT cuando el SELECT anterior se vea bien)
BEGIN TRAN;

UPDATE r
SET r.Nombre = LEFT(c.Nombre, 255)
FROM dbo.[Rips Cups] AS r
INNER JOIN dbo.CUPS_Codigos AS c
    ON LTRIM(RTRIM(r.Codigo)) = LTRIM(RTRIM(c.Codigo))
WHERE r.Nombre <> LEFT(c.Nombre, 255);

SELECT @@ROWCOUNT AS FilasActualizadas;

COMMIT;
GO

-- 3) Verificación rápida
SELECT TOP (200)
    Tabla,
    Codigo,
    Nombre,
    Descripcion,
    Tipo
FROM dbo.[Rips Cups]
ORDER BY Codigo;

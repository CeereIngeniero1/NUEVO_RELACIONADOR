INSERT INTO Entidad1888
(
    [Documento Entidad],
    [Id Identidad Genero],
    Talla,
    Peso,
    [Id Etnia],
    [Comunidad Etnica],
    [Id Discapacidad],
    Alergias
)
SELECT
    e.[Documento Entidad],
    6,      -- Id Identidad Genero (ajustar si aplica)
    0,         -- Talla
    0,         -- Peso
    15,        -- Id Etnia
    'No',      -- Comunidad Etnica
    9,         -- Id Discapacidad
    'No'       -- Alergias
FROM Entidad e
LEFT JOIN Entidad1888 e1888
    ON LTRIM(RTRIM(e1888.[Documento Entidad])) = LTRIM(RTRIM(e.[Documento Entidad]))
WHERE e1888.[Documento Entidad] IS NULL;



-- Trigger canónico para INSERT/UPDATE quedó centralizado en:
-- [dbo].[trg_Entidad_AfterInsert_EnsureEntidad1888]
-- (ver archivo "1888 update a registros malos.sql")

Update Ocupación set [Id Estado] = 8




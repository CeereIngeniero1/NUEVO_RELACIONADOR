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
    ON e1888.[Id Entidad1888] = e.[Id Entidad]
WHERE e1888.[Id Entidad1888] IS NULL;



Create TRIGGER TR_Entidad_Update_Doc
ON Entidad
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE([Documento Entidad])
    BEGIN
        UPDATE e1888
        SET e1888.[Documento Entidad] = i.[Documento Entidad]
        FROM Entidad1888 e1888
        INNER JOIN deleted d
            ON e1888.[Documento Entidad] = d.[Documento Entidad]
        INNER JOIN inserted i
            ON i.[Id Entidad] = d.[Id Entidad];
    END
END;
GO


CREATE TRIGGER TR_Entidad_Insert
ON Entidad
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

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
        i.[Documento Entidad],
        6,                    -- Id Identidad Genero (definir si aplica)
        0,                       -- Talla
        0,                       -- Peso
        15,                      -- Id Etnia
        'No',                    -- Comunidad Etnica
        9,                       -- Id Discapacidad
        'No'                     -- Alergias
    FROM inserted i;
END;
GO

Update Ocupación set [Id Estado] = 8




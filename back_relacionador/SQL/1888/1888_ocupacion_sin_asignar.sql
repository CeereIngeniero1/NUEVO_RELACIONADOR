-- Placeholder "Sin asignar" en [Ocupación] (Res. 1888)
-- Id Ocupación = 1 reservado. Sin código CIUO → no se envía Observation a IHCE.
-- La sección Composition 74208-0 sigue obligatoria con emptyReason.

BEGIN TRANSACTION;

IF EXISTS (SELECT 1 FROM [dbo].[Ocupación] WHERE [Id Ocupación] = 1)
BEGIN
    UPDATE [dbo].[Ocupación]
    SET
        [Código Ocupación] = NULL,
        [Ocupación] = N'Sin asignar',
        [Descripción Ocupación] = N'Sin asignar',
        [Orden Ocupación] = 0,
        [Id Estado] = 7
    WHERE [Id Ocupación] = 1;
END
ELSE
BEGIN
    SET IDENTITY_INSERT [dbo].[Ocupación] ON;

    INSERT INTO [dbo].[Ocupación] (
        [Id Ocupación],
        [Código Ocupación],
        [Ocupación],
        [Descripción Ocupación],
        [Orden Ocupación],
        [Id Estado]
    )
    VALUES (1, NULL, N'Sin asignar', N'Sin asignar', 0, 7);

    SET IDENTITY_INSERT [dbo].[Ocupación] OFF;
END;

SELECT [Id Ocupación], [Código Ocupación], [Ocupación], [Descripción Ocupación], [Orden Ocupación], [Id Estado]
FROM [dbo].[Ocupación]
WHERE [Id Ocupación] = 1;

COMMIT TRANSACTION;

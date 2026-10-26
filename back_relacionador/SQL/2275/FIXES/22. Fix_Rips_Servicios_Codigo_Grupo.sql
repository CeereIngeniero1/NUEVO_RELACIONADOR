/*
==============================================================================
  FIX: CodServicio vacio + duplicados en [RIPS Servicios]
==============================================================================
  1) Asigna [Codigo Grupo Servicios] (01-05) segun Descripcion.
     Sin eso, [Cnsta Relacionador Servicios] (INNER JOIN) no lista nada.
  2) Elimina duplicados por [Código Servicios] (deja el Id mas bajo).
     Tipico si se corrio 00_INSTALL y luego 3. Query.sql (157 x 2 = 314).

  Ejecutar una vez en la BD del cliente.
==============================================================================
*/
SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.[RIPS Servicios]', N'Codigo Grupo Servicios') IS NULL
    ALTER TABLE dbo.[RIPS Servicios] ADD [Codigo Grupo Servicios] NVARCHAR(50) NULL;
GO

/* ---- 1) Asignar Codigo Grupo (columna Descripcion con/sin tilde) ---- */
DECLARE @colDescr SYSNAME =
(
    SELECT TOP 1 c.name
    FROM sys.columns c
    WHERE c.object_id = OBJECT_ID(N'dbo.[RIPS Servicios]')
      AND c.name LIKE N'Descripci% Servicios'
);

IF @colDescr IS NULL
BEGIN
    RAISERROR(N'No se encontro la columna Descripcion Servicios en [RIPS Servicios].', 16, 1);
    RETURN;
END

DECLARE @sql NVARCHAR(MAX) = N'
UPDATE dbo.[RIPS Servicios]
SET [Codigo Grupo Servicios] = CASE LTRIM(RTRIM([' + @colDescr + N']))
    WHEN N''CONSULTA EXTERNA'' THEN N''01''
    WHEN N''APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA'' THEN N''02''
    WHEN N''INTERNACION'' THEN N''03''
    WHEN N''QUIRURGICOS'' THEN N''04''
    WHEN N''ATENCION INMEDIATA'' THEN N''05''
    ELSE [Codigo Grupo Servicios]
END
WHERE LTRIM(RTRIM([' + @colDescr + N'])) IN (
    N''CONSULTA EXTERNA'',
    N''APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA'',
    N''INTERNACION'',
    N''QUIRURGICOS'',
    N''ATENCION INMEDIATA''
);';

EXEC sys.sp_executesql @sql;
PRINT N'Codigo Grupo actualizados: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
GO

/* ---- 2) Quitar duplicados por Código Servicios (conserva Id menor) ---- */
;WITH d AS (
    SELECT
        [Id Servicios],
        ROW_NUMBER() OVER (
            PARTITION BY LTRIM(RTRIM([Código Servicios]))
            ORDER BY [Id Servicios]
        ) AS rn
    FROM dbo.[RIPS Servicios]
)
DELETE FROM d WHERE rn > 1;

PRINT N'Duplicados eliminados: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
GO

/* ---- Verificacion ---- */
SELECT
    [Codigo Grupo Servicios] AS CodGrupo,
    COUNT(*) AS Cantidad
FROM dbo.[RIPS Servicios]
WHERE [Id Estado] = 7
GROUP BY [Codigo Grupo Servicios]
ORDER BY CodGrupo;

SELECT COUNT(*) AS TotalActivos
FROM dbo.[RIPS Servicios]
WHERE [Id Estado] = 7;

PRINT N'Fix aplicado. Esperado ~157 filas y CodGrupo 01-05 sin NULL. Recargue Asignar RIPS.';
GO

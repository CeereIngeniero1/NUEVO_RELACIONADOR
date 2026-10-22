/*
  Depura datos que IHCE / RDA rechazan con frecuencia.

  Uso:
    1) Deje @Ejecutar = 0  → solo reporte (no modifica nada).
    2) Revise el resultado.
    3) Ponga @Ejecutar = 1 → aplica correcciones idempotentes.

  Corrige:
    A) Identidad de género código 06 "Sin asignar" (NO existe en MinSalud)
         → en RDA Paciente pendientes pasa a 05 "No lo declara"
         → en catálogo deja 06 inactivo (Id Estado = 8) si la columna existe
    B) Teléfono celular inválido en Evaluacion Entidad RDA
         → deja solo dígitos; si queda un celular CO válido (3 + 9 dígitos) lo guarda
         → si no se puede autolimpiar, solo lo reporta
    C) Codigo Prestador cuando tiene la cédula/NIT persona
         en lugar del REPS de CredencialesIhce.Custodian Reps
         → aplica a RDA Paciente y RDA Consulta Externa (pendientes)
         (el NIT del custodio persona puede ser correcto; no se toca)

  No toca secretos IHCE. No borra filas de catálogo (solo inactiva 06).
  Compatible SQL Server 2014+.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @Ejecutar BIT = 0;  -- 0 = solo reporte | 1 = corregir

DECLARE @Id05 INT = NULL;
DECLARE @Reps NVARCHAR(50) = NULL;
DECLARE @NitCustodio NVARCHAR(50) = NULL;
DECLARE @n INT;

/* ---------- helpers: Id 05 y REPS desde CredencialesIhce ---------- */
IF OBJECT_ID(N'dbo.[Sexo Identidad Genero]', N'U') IS NOT NULL
    SELECT TOP 1 @Id05 = [Id Sexo Identidad Genero]
    FROM dbo.[Sexo Identidad Genero]
    WHERE LTRIM(RTRIM(Codigo)) = N'05'
    ORDER BY [Id Sexo Identidad Genero];

IF OBJECT_ID(N'dbo.CredencialesIhce', N'U') IS NOT NULL
    SELECT TOP 1
        @Reps = NULLIF(LTRIM(RTRIM([Custodian Reps])), N''),
        @NitCustodio = NULLIF(LTRIM(RTRIM([Custodian Nit])), N'')
    FROM dbo.CredencialesIhce
    WHERE ISNULL([Activo], 1) = 1
      AND NULLIF(LTRIM(RTRIM([Custodian Reps])), N'') IS NOT NULL
    ORDER BY CASE WHEN [Ambiente] = N'prod' THEN 0 ELSE 1 END,
             [Id Credenciales Ihce];

PRINT N'=== CONFIG ===';
PRINT N'@Ejecutar = ' + CASE WHEN @Ejecutar = 1 THEN N'1 (CORREGIR)' ELSE N'0 (SOLO REPORTE)' END;
PRINT N'Id identidad 05 = ' + ISNULL(CAST(@Id05 AS NVARCHAR(20)), N'(no encontrado)');
PRINT N'Custodian Reps  = ' + ISNULL(@Reps, N'(sin CredencialesIhce.Custodian Reps)');
PRINT N'Custodian Nit   = ' + ISNULL(@NitCustodio, N'(n/a)');
PRINT N'';

/* ================================================================== */
/* A) IDENTIDAD DE GÉNERO 06                                           */
/* ================================================================== */
PRINT N'=== A) IDENTIDAD DE GENERO 06 (no oficial MinSalud) ===';

IF OBJECT_ID(N'dbo.[Sexo Identidad Genero]', N'U') IS NOT NULL
BEGIN
    SELECT
        [Id Sexo Identidad Genero] AS Id,
        Codigo,
        [Identidad Genero] AS Nombre,
        CASE WHEN LTRIM(RTRIM(Codigo)) = N'06' THEN N'ERRONEO: no existe en ValueSet IHCE' ELSE N'OK' END AS Estado
    FROM dbo.[Sexo Identidad Genero]
    ORDER BY Codigo;
END

IF OBJECT_ID(N'dbo.[Evaluacion Entidad RDA]', N'U') IS NOT NULL
BEGIN
    SELECT
        e.[Id Evaluacion Entidad RDA] AS Id,
        e.[Documento Entidad] AS Documento,
        e.[Id Identidad Genero] AS IdIG,
        sig.Codigo AS CodigoIG,
        sig.[Identidad Genero] AS TextoIG,
        e.[Enviado],
        N'Cambiar a 05 No lo declara' AS AccionSugerida
    FROM dbo.[Evaluacion Entidad RDA] e
    INNER JOIN dbo.[Sexo Identidad Genero] sig
        ON sig.[Id Sexo Identidad Genero] = e.[Id Identidad Genero]
    WHERE LTRIM(RTRIM(sig.Codigo)) = N'06'
    ORDER BY e.[Id Evaluacion Entidad RDA];

    SELECT @n = COUNT(*)
    FROM dbo.[Evaluacion Entidad RDA] e
    INNER JOIN dbo.[Sexo Identidad Genero] sig
        ON sig.[Id Sexo Identidad Genero] = e.[Id Identidad Genero]
    WHERE LTRIM(RTRIM(sig.Codigo)) = N'06'
      AND ISNULL(e.[Enviado], 0) = 0;

    PRINT N'Pendientes RDA Paciente con IG=06: ' + CAST(ISNULL(@n, 0) AS NVARCHAR(20));

    IF @Ejecutar = 1 AND @Id05 IS NOT NULL AND ISNULL(@n, 0) > 0
    BEGIN
        UPDATE e
        SET e.[Id Identidad Genero] = @Id05
        FROM dbo.[Evaluacion Entidad RDA] e
        INNER JOIN dbo.[Sexo Identidad Genero] sig
            ON sig.[Id Sexo Identidad Genero] = e.[Id Identidad Genero]
        WHERE LTRIM(RTRIM(sig.Codigo)) = N'06'
          AND ISNULL(e.[Enviado], 0) = 0;
        PRINT N'Corregidos RDA Paciente IG 06→05: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
    END
END

/* Inactivar código 06 en catálogo (sigue existiendo por FK, pero no debería usarse) */
IF @Ejecutar = 1
   AND OBJECT_ID(N'dbo.[Sexo Identidad Genero]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.[Sexo Identidad Genero]', N'Id Estado') IS NOT NULL
BEGIN
    UPDATE dbo.[Sexo Identidad Genero]
    SET [Id Estado] = 8
    WHERE LTRIM(RTRIM(Codigo)) = N'06'
      AND ISNULL([Id Estado], 7) <> 8;
    PRINT N'Catálogo IG 06 inactivado (Id Estado=8): ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
END

PRINT N'';

/* ================================================================== */
/* B) TELÉFONOS RDA PACIENTE                                           */
/* ================================================================== */
PRINT N'=== B) TELEFONO CELULAR (debe ser 10 digitos iniciando en 3) ===';

IF OBJECT_ID(N'dbo.[Evaluacion Entidad RDA]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.[Evaluacion Entidad RDA]', N'Teléfono Celular') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'tempdb..#TelAudit') IS NOT NULL DROP TABLE #TelAudit;
    CREATE TABLE #TelAudit (
        Id INT NOT NULL,
        Documento NVARCHAR(50) NULL,
        TelOriginal NVARCHAR(50) NULL,
        SoloDigitos NVARCHAR(50) NULL,
        TelLimpio NVARCHAR(50) NULL,
        Estado NVARCHAR(20) NOT NULL,
        Enviado INT NULL,
        AccionSugerida NVARCHAR(100) NULL
    );

    DECLARE @IdTel INT, @DocTel NVARCHAR(50), @TelOrig NVARCHAR(50), @EnvTel INT;
    DECLARE @s NVARCHAR(100), @i INT, @ch NCHAR(1), @digits NVARCHAR(50);
    DECLARE @estado NVARCHAR(20), @limpio NVARCHAR(50), @accion NVARCHAR(100);

    DECLARE curTel CURSOR LOCAL FAST_FORWARD FOR
        SELECT
            e.[Id Evaluacion Entidad RDA],
            e.[Documento Entidad],
            e.[Teléfono Celular],
            e.[Enviado]
        FROM dbo.[Evaluacion Entidad RDA] e;

    OPEN curTel;
    FETCH NEXT FROM curTel INTO @IdTel, @DocTel, @TelOrig, @EnvTel;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @s = LTRIM(RTRIM(ISNULL(@TelOrig, N'')));
        SET @digits = N'';
        SET @i = 1;
        WHILE @i <= LEN(@s)
        BEGIN
            SET @ch = SUBSTRING(@s, @i, 1);
            IF @ch LIKE N'[0-9]' SET @digits = @digits + @ch;
            SET @i = @i + 1;
        END;

        IF @digits = N''
            SET @estado = N'VACIO';
        ELSE IF LEN(@digits) = 10 AND LEFT(@digits, 1) = N'3'
            SET @estado = N'VALIDO';
        ELSE
            SET @estado = N'INVALIDO';

        SET @limpio = CASE WHEN @estado = N'VALIDO' THEN @digits ELSE NULL END;
        SET @accion = CASE
            WHEN @estado = N'VALIDO' AND @s <> @digits THEN N'Normalizar a ' + @digits
            WHEN @estado = N'VALIDO' THEN N'(ok)'
            ELSE N'Revisar manualmente en pantalla'
        END;

        IF @estado <> N'VALIDO' OR (@limpio IS NOT NULL AND @s <> @limpio)
            INSERT INTO #TelAudit (Id, Documento, TelOriginal, SoloDigitos, TelLimpio, Estado, Enviado, AccionSugerida)
            VALUES (@IdTel, @DocTel, @TelOrig, @digits, @limpio, @estado, @EnvTel, @accion);

        FETCH NEXT FROM curTel INTO @IdTel, @DocTel, @TelOrig, @EnvTel;
    END;
    CLOSE curTel;
    DEALLOCATE curTel;

    SELECT * FROM #TelAudit ORDER BY Id;

    SELECT @n = COUNT(*)
    FROM #TelAudit
    WHERE TelLimpio IS NOT NULL
      AND ISNULL(Enviado, 0) = 0
      AND (TelOriginal IS NULL OR LTRIM(RTRIM(TelOriginal)) <> TelLimpio);

    PRINT N'Teléfonos pendientes normalizables: ' + CAST(ISNULL(@n, 0) AS NVARCHAR(20));

    IF @Ejecutar = 1 AND ISNULL(@n, 0) > 0
    BEGIN
        UPDATE e
        SET e.[Teléfono Celular] = a.TelLimpio
        FROM dbo.[Evaluacion Entidad RDA] e
        INNER JOIN #TelAudit a ON a.Id = e.[Id Evaluacion Entidad RDA]
        WHERE a.TelLimpio IS NOT NULL
          AND ISNULL(e.[Enviado], 0) = 0
          AND (e.[Teléfono Celular] IS NULL OR LTRIM(RTRIM(e.[Teléfono Celular])) <> a.TelLimpio);
        PRINT N'Teléfonos normalizados: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
    END

    DROP TABLE #TelAudit;
END
ELSE
    PRINT N'(tabla/columna Teléfono Celular no disponible)';

PRINT N'';

/* ================================================================== */
/* C) CODIGO PRESTADOR / NIT (debe ser REPS, no cédula)                */
/* ================================================================== */
PRINT N'=== C) CODIGO PRESTADOR (REPS vs cedula/NIT persona) ===';

IF @Reps IS NULL
    PRINT N'SIN Custodian Reps en CredencialesIhce: no se puede autogenerar corrección de prestador.';
ELSE
BEGIN
    /* RDA Paciente */
    IF OBJECT_ID(N'dbo.[Evaluacion Entidad RDA]', N'U') IS NOT NULL
    BEGIN
        SELECT
            e.[Id Evaluacion Entidad RDA] AS Id,
            e.[Documento Entidad] AS Documento,
            e.[Codigo Prestador] AS CodigoPrestador,
            e.[NIT Prestador IPS] AS NitPrestador,
            e.[Num Doc Profesional] AS NumDocProf,
            e.[Enviado],
            N'RDA Paciente' AS Origen,
            @Reps AS RepsCorrecto
        INTO #PrestAudit
        FROM dbo.[Evaluacion Entidad RDA] e
        WHERE ISNULL(e.[Enviado], 0) = 0
          AND (
                LTRIM(RTRIM(ISNULL(e.[Codigo Prestador], N''))) IN (ISNULL(@NitCustodio, N'__none__'), LTRIM(RTRIM(ISNULL(e.[Num Doc Profesional], N''))))
             OR LTRIM(RTRIM(ISNULL(e.[Codigo Prestador], N''))) = N''
             OR (
                    LEN(LTRIM(RTRIM(ISNULL(e.[Codigo Prestador], N'')))) BETWEEN 5 AND 10
                    AND LTRIM(RTRIM(e.[Codigo Prestador])) NOT LIKE N'0%'
                    AND LTRIM(RTRIM(e.[Codigo Prestador])) <> @Reps
                )
             OR LTRIM(RTRIM(ISNULL(e.[NIT Prestador IPS], N''))) IN (ISNULL(@NitCustodio, N'__none__'), LTRIM(RTRIM(ISNULL(e.[Num Doc Profesional], N''))))
          );

        SELECT * FROM #PrestAudit ORDER BY Id;
        SELECT @n = COUNT(*) FROM #PrestAudit;
        PRINT N'RDA Paciente pendientes con prestador sospechoso: ' + CAST(ISNULL(@n, 0) AS NVARCHAR(20));

        IF @Ejecutar = 1 AND ISNULL(@n, 0) > 0
        BEGIN
            UPDATE e
            SET e.[Codigo Prestador] = @Reps
            FROM dbo.[Evaluacion Entidad RDA] e
            INNER JOIN #PrestAudit a ON a.Id = e.[Id Evaluacion Entidad RDA];
            PRINT N'RDA Paciente Codigo Prestador → REPS: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
        END
        DROP TABLE #PrestAudit;
    END

    /* RDA Consulta Externa */
    IF OBJECT_ID(N'dbo.[Evaluacion Entidad RDA Consulta Externa]', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.[Evaluacion Entidad RDA Consulta Externa]', N'Codigo Prestador') IS NOT NULL
    BEGIN
        SELECT
            e.[Id Evaluacion Entidad RDA Consulta Externa] AS Id,
            e.[Documento Entidad] AS Documento,
            e.[Codigo Prestador] AS CodigoPrestador,
            e.[Enviado],
            N'RDA CE' AS Origen,
            @Reps AS RepsCorrecto
        INTO #PrestAuditCE
        FROM dbo.[Evaluacion Entidad RDA Consulta Externa] e
        WHERE ISNULL(e.[Enviado], 0) = 0
          AND (
                LTRIM(RTRIM(ISNULL(e.[Codigo Prestador], N''))) = ISNULL(@NitCustodio, N'__none__')
             OR LTRIM(RTRIM(ISNULL(e.[Codigo Prestador], N''))) = N''
             OR (
                    LEN(LTRIM(RTRIM(ISNULL(e.[Codigo Prestador], N'')))) BETWEEN 5 AND 10
                    AND LTRIM(RTRIM(e.[Codigo Prestador])) NOT LIKE N'0%'
                    AND LTRIM(RTRIM(e.[Codigo Prestador])) <> @Reps
                )
          );

        SELECT * FROM #PrestAuditCE ORDER BY Id;
        SELECT @n = COUNT(*) FROM #PrestAuditCE;
        PRINT N'RDA CE pendientes con prestador sospechoso: ' + CAST(ISNULL(@n, 0) AS NVARCHAR(20));

        IF @Ejecutar = 1 AND ISNULL(@n, 0) > 0
        BEGIN
            UPDATE e
            SET e.[Codigo Prestador] = @Reps
            FROM dbo.[Evaluacion Entidad RDA Consulta Externa] e
            INNER JOIN #PrestAuditCE a ON a.Id = e.[Id Evaluacion Entidad RDA Consulta Externa];
            PRINT N'RDA CE prestador corregido a REPS: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
        END
        DROP TABLE #PrestAuditCE;
    END
END

PRINT N'';

/* ================================================================== */
/* D) VERIFICACIÓN FINAL (siempre)                                     */
/* ================================================================== */
PRINT N'=== D) RESUMEN FINAL ===';

IF OBJECT_ID(N'dbo.[Evaluacion Entidad RDA]', N'U') IS NOT NULL
BEGIN
    SELECT
        SUM(CASE WHEN sig.Codigo = N'06' AND ISNULL(e.[Enviado],0)=0 THEN 1 ELSE 0 END) AS PendientesIG06,
        SUM(CASE
            WHEN ISNULL(e.[Enviado],0)=0
             AND NOT (
                REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(e.[Teléfono Celular],N''),N' ',N''),N'-',N''),N'(',N''),N')',N''),N'+',N'')
                LIKE N'3_________'
             ) THEN 1 ELSE 0 END) AS PendientesTelMalo,
        SUM(CASE
            WHEN ISNULL(e.[Enviado],0)=0
             AND @Reps IS NOT NULL
             AND LTRIM(RTRIM(ISNULL(e.[Codigo Prestador],N''))) <> @Reps THEN 1 ELSE 0 END) AS PendientesPrestadorDistintoREPS
    FROM dbo.[Evaluacion Entidad RDA] e
    LEFT JOIN dbo.[Sexo Identidad Genero] sig
        ON sig.[Id Sexo Identidad Genero] = e.[Id Identidad Genero];
END

IF @Ejecutar = 0
    PRINT N'Fin reporte. Para aplicar correcciones: DECLARE @Ejecutar BIT = 1 al inicio del script.';
ELSE
    PRINT N'Fin correcciones. Vuelva a generar/enviar los RDA pendientes.';
GO

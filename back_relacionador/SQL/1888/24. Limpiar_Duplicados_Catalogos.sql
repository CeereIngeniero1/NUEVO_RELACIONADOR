/*
  Limpieza de duplicados en los catálogos del Relacionador (RIPS 2275 + RDA 1888).
  Duplicado = mismo Código (sin espacios) dentro del mismo catálogo. Códigos vacíos se ignoran.

  Por cada Código se conserva UNA fila: la activa (Estado = 7) de menor Id.
    1. Las referencias por Id en tablas del Relacionador (Entidad1888, Evaluacion Entidad RDA,
       Evaluacion Entidad RDA Consulta Externa, Evaluación Entidad Rips) se reapuntan a esa fila.
    2. Las copias se eliminan. Si una copia sigue referenciada en una columna que CeereSIO también
       usa para otra tabla (Evaluación Entidad Rips.[Id Finalidad Consulta], [Id Causa Externa], ...)
       no se borra: se inactiva (Estado = 8) para no romper RIPS ya generados.
    3. Catálogos sin Id (Rips Cie10, Rips Cups): se deja una sola fila por Código.

  No toca tablas propias de CeereSIO (País, Ciudad, Ocupación, Sexo, contabilidad, facturación...).
  @Ejecutar = 0 -> solo muestra el reporte, no modifica nada.
  Todo corre en una sola transacción: si algo falla no queda nada a medias.
  Recomendado: copia de seguridad de la BD antes de ejecutar con @Ejecutar = 1.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Ejecutar BIT = 1;

IF OBJECT_ID(N'tempdb..#Cat') IS NOT NULL DROP TABLE #Cat;
IF OBJECT_ID(N'tempdb..#Ref') IS NOT NULL DROP TABLE #Ref;
IF OBJECT_ID(N'tempdb..#Map') IS NOT NULL DROP TABLE #Map;
IF OBJECT_ID(N'tempdb..#Res') IS NOT NULL DROP TABLE #Res;

CREATE TABLE #Cat (
    Orden INT IDENTITY(1,1) NOT NULL,
    Tabla SYSNAME NOT NULL PRIMARY KEY,
    ColId SYSNAME NULL,
    ColCodigo SYSNAME NOT NULL,
    ColEstado SYSNAME NULL
);
INSERT INTO #Cat (Tabla, ColId, ColCodigo, ColEstado) VALUES
    (N'País1888',                            N'Id Pais1888',                            N'Codigo',           N'Estado'),
    (N'Ciudad1888',                          N'Id Ciudad1888',                          N'Codigo',           N'Estado'),
    (N'Etnia',                               N'Id Etnia',                               N'Código Etnia',     N'Id Estado'),
    (N'Sexo Identidad Genero',               N'Id Sexo Identidad Genero',               N'Codigo',           N'Id Estado'),
    (N'Discapacidad',                        N'Id Discapacidad',                        N'Codigo',           N'Id Estado'),
    (N'Ocupacion 1888',                      N'Id Ocupacion 1888',                      N'Codigo',           N'Id Estado'),
    (N'Medicamento DCI 1888',                N'ID Medicamento DCI 1888',                N'Codigo',           N'Id Estado'),
    (N'Tipo de tecnología en salud 1888',    N'Id Tipo de tecnología en salud 1888',    N'Codigo',           N'Id Estado'),
    (N'Tipo diagnostico principal 1888',     N'Id Tipo diagnostico principal 1888',     N'Codigo',           N'Id Estado'),
    (N'Entorno de atencion 1888',            N'Id Entorno de atencion 1888',            N'Codigo',           N'Id Estado'),
    (N'Factor De Riesgo 1888',               N'Id Factor De Riesgo 1888',               N'Codigo',           N'Id Estado'),
    (N'Egreso y Remision 1888',              N'Id Egreso y Remision 1888',              N'Codigo',           N'Id Estado'),
    (N'Alcance incapacidad 1888',            N'Id Alcance incapacidad 1888',            N'Codigo',           N'Id Estado'),
    (N'Tipo de alergia 1888',                N'Id Tipo de alergia 1888',                N'Codigo',           N'Id Estado'),
    (N'Finalidad tecnologia salud 1888',     N'Id Finalidad tecnologia salud 1888',     N'Codigo',           N'Id Estado'),
    (N'Via administracion medicamento 1888', N'Id Via administracion medicamento 1888', N'Codigo',           N'Id Estado'),
    (N'Otra tecnologia categoria 1888',      N'Id Otra tecnologia categoria 1888',      N'Codigo',           N'Id Estado'),
    (N'Unidad medida dosis 1888',            N'Id Unidad medida dosis 1888',            N'Codigo',           N'Id Estado'),
    (N'Unidad tiempo duracion 1888',         N'Id Unidad tiempo duracion 1888',         N'Codigo',           N'Id Estado'),
    (N'Unidad tiempo frecuencia 1888',       N'Id Unidad tiempo frecuencia 1888',       N'Codigo',           N'Id Estado'),
    (N'Parentesco familiar RDA 1888',        N'Id Parentesco familiar RDA 1888',        N'Codigo',           N'Id Estado'),
    (N'Entidades sgsss 1888',                N'Id sgsss',                               N'Codigo',           N'Id Estado'),
    (N'Entidades Prepagadas 1888',           N'Id Entidades Prepagadas 1888',           N'Codigo',           N'Id Estado'),
    (N'CIE11_Codigos',                       N'IdCIE11',                                N'Codigo',           NULL),
    (N'CUPS_Codigos',                        N'IdCUPS',                                 N'Codigo',           N'IdEstado'),
    (N'RIPS Finalidad Consulta Version2',    N'Id Finalidad Consulta',                  N'Codigo',           N'Id Estado'),
    (N'RIPS Causa Externa Version2',         N'Id RIPS Causa Externa Version2',         N'Codigo',           N'Id Estado'),
    (N'RIPS Via Ingreso Usuario',            N'Id Via Ingreso Usuario',                 N'Codigo',           N'Id Estado'),
    (N'RIPS Modalidad Atención',             N'Id Modalidad Atencion',                  N'Codigo',           N'Id Estado'),
    (N'RIPS Grupo Servicios',                N'Id Grupo Servicios',                     N'Codigo',           N'Id Estado'),
    (N'RIPS Servicios',                      N'Id Servicios',                           N'Código Servicios', N'Id Estado'),
    (N'Rips Cie10',                          NULL,                                      N'Codigo',           NULL),
    (N'Rips Cups',                           NULL,                                      N'Codigo',           NULL);

/* Compartida = 1: la columna también guarda Ids de tablas de CeereSIO; no se reapunta. */
CREATE TABLE #Ref (Tabla SYSNAME NOT NULL, TablaRef SYSNAME NOT NULL, ColRef SYSNAME NOT NULL, Compartida BIT NOT NULL);
INSERT INTO #Ref (Tabla, TablaRef, ColRef, Compartida) VALUES
    (N'País1888',              N'Entidad1888',                             N'Id Pais Nacionalidad',          0),
    (N'País1888',              N'Entidad1888',                             N'Id Pais Recidencia',            0),
    (N'País1888',              N'Evaluacion Entidad RDA',                  N'Id Pais Nacionalidad',          0),
    (N'País1888',              N'Evaluacion Entidad RDA',                  N'Id Pais Recidencia',            0),
    (N'Ciudad1888',            N'Entidad1888',                             N'Id Municipio Recidencia',       0),
    (N'Ciudad1888',            N'Evaluacion Entidad RDA',                  N'Id Municipio Recidencia',       0),
    (N'Etnia',                 N'Entidad1888',                             N'Id Etnia',                      0),
    (N'Etnia',                 N'Evaluacion Entidad RDA',                  N'Id Etnia',                      0),
    (N'Sexo Identidad Genero', N'Entidad1888',                             N'Id Identidad Genero',           0),
    (N'Sexo Identidad Genero', N'Evaluacion Entidad RDA',                  N'Id Identidad Genero',           0),
    (N'Discapacidad',          N'Entidad1888',                             N'Id Discapacidad',               0),
    (N'Discapacidad',          N'Evaluacion Entidad RDA',                  N'Id Discapacidad',               0),
    (N'RIPS Causa Externa Version2', N'Evaluacion Entidad RDA Consulta Externa', N'Id Causa Motivo Atencion', 0),
    (N'RIPS Causa Externa Version2', N'Evaluación Entidad Rips',           N'Id Causa Externa Version2',     0),
    (N'RIPS Causa Externa Version2', N'Evaluación Entidad Rips',           N'Id Causa Externa',              1),
    (N'RIPS Finalidad Consulta Version2', N'Evaluación Entidad Rips',      N'Id Finalidad Consulta',         1),
    (N'RIPS Finalidad Consulta Version2', N'Evaluación Entidad Rips',      N'Id Finalidad Consulta Version2', 1),
    (N'RIPS Via Ingreso Usuario', N'Evaluación Entidad Rips',              N'Id Via Ingreso Usuario',        0),
    (N'RIPS Via Ingreso Usuario', N'Evaluacion Entidad RDA',               N'Id Via Ingreso Usuario',        0),
    (N'RIPS Via Ingreso Usuario', N'Evaluacion Entidad RDA Consulta Externa', N'Id Via Ingreso Usuario',     0),
    (N'RIPS Modalidad Atención', N'Evaluación Entidad Rips',               N'Id Modalidad Atencion',         0),
    (N'RIPS Modalidad Atención', N'Evaluacion Entidad RDA',                N'Id Modalidad Atencion',         0),
    (N'RIPS Modalidad Atención', N'Evaluacion Entidad RDA Consulta Externa', N'Id Modalidad Atencion',       0),
    (N'RIPS Grupo Servicios',  N'Evaluación Entidad Rips',                 N'Id Grupo Servicios',            0),
    (N'RIPS Grupo Servicios',  N'Evaluacion Entidad RDA',                  N'Id Grupo Servicios',            0),
    (N'RIPS Grupo Servicios',  N'Evaluacion Entidad RDA Consulta Externa', N'Id Grupo Servicios',            0),
    (N'RIPS Servicios',        N'Evaluación Entidad Rips',                 N'Id Servicios',                  0);

CREATE TABLE #Map (IdDup INT NOT NULL PRIMARY KEY, IdKeep INT NOT NULL, Referenciada BIT NOT NULL DEFAULT (0));
CREATE TABLE #Res (
    Orden INT NOT NULL, Tabla SYSNAME NOT NULL, Filas INT NULL, CodigosDuplicados INT NULL, FilasSobrantes INT NULL,
    Reapuntadas INT NOT NULL DEFAULT (0), Eliminadas INT NOT NULL DEFAULT (0), Inactivadas INT NOT NULL DEFAULT (0)
);

DECLARE @Orden INT, @Tabla SYSNAME, @ColId SYSNAME, @ColCodigo SYSNAME, @ColEstado SYSNAME;
DECLARE @Obj NVARCHAR(400), @Cod NVARCHAR(600), @Key NVARCHAR(800), @OrdenFila NVARCHAR(600);
DECLARE @sql NVARCHAR(MAX), @n INT, @Filas INT, @Codigos INT, @Sobrantes INT, @Reap INT, @Elim INT, @Inact INT;
DECLARE @TablaRef SYSNAME, @ColRef SYSNAME, @Compartida BIT;

BEGIN TRY
    BEGIN TRAN;

    DECLARE curCat CURSOR LOCAL FAST_FORWARD FOR
        SELECT Orden, Tabla, ColId, ColCodigo, ColEstado FROM #Cat ORDER BY Orden;
    OPEN curCat;
    FETCH NEXT FROM curCat INTO @Orden, @Tabla, @ColId, @ColCodigo, @ColEstado;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @Obj = N'dbo.' + QUOTENAME(@Tabla);
        IF OBJECT_ID(@Obj, N'U') IS NULL
           OR COL_LENGTH(@Obj, @ColCodigo) IS NULL
           OR (@ColId IS NOT NULL AND COL_LENGTH(@Obj, @ColId) IS NULL)
            GOTO Siguiente;
        IF @ColEstado IS NOT NULL AND COL_LENGTH(@Obj, @ColEstado) IS NULL
            SET @ColEstado = NULL;

        SET @Cod = QUOTENAME(@ColCodigo);
        SET @Key = N'LTRIM(RTRIM(CAST(' + @Cod + N' AS NVARCHAR(400))))';
        SELECT @Reap = 0, @Elim = 0, @Inact = 0;

        SET @sql = N'SELECT @F = COUNT(*) FROM ' + @Obj + N';
            SELECT @C = COUNT(*), @S = ISNULL(SUM(n - 1), 0)
            FROM (SELECT COUNT(*) AS n FROM ' + @Obj + N'
                  WHERE ' + @Cod + N' IS NOT NULL AND ' + @Key + N' <> N''''
                  GROUP BY ' + @Key + N' HAVING COUNT(*) > 1) x;';
        EXEC sp_executesql @sql, N'@F INT OUTPUT, @C INT OUTPUT, @S INT OUTPUT',
            @F = @Filas OUTPUT, @C = @Codigos OUTPUT, @S = @Sobrantes OUTPUT;

        IF @Sobrantes > 0 AND @Ejecutar = 1
        BEGIN
            IF @ColId IS NULL
            BEGIN
                SET @sql = N';WITH x AS (
                        SELECT ROW_NUMBER() OVER (PARTITION BY ' + @Key + N' ORDER BY (SELECT NULL)) AS rn
                        FROM ' + @Obj + N'
                        WHERE ' + @Cod + N' IS NOT NULL AND ' + @Key + N' <> N'''')
                    DELETE FROM x WHERE rn > 1;
                    SET @E = @@ROWCOUNT;';
                EXEC sp_executesql @sql, N'@E INT OUTPUT', @E = @Elim OUTPUT;
            END
            ELSE
            BEGIN
                TRUNCATE TABLE #Map;
                SET @OrdenFila = CASE WHEN @ColEstado IS NULL THEN N''
                                      ELSE N'CASE WHEN ' + QUOTENAME(@ColEstado) + N' = 7 THEN 0 ELSE 1 END, ' END
                               + QUOTENAME(@ColId);
                SET @sql = N';WITH x AS (
                        SELECT ' + QUOTENAME(@ColId) + N' AS Id,
                               ROW_NUMBER() OVER (PARTITION BY ' + @Key + N' ORDER BY ' + @OrdenFila + N') AS rn,
                               FIRST_VALUE(' + QUOTENAME(@ColId) + N') OVER (PARTITION BY ' + @Key + N' ORDER BY ' + @OrdenFila + N'
                                   ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS IdKeep
                        FROM ' + @Obj + N'
                        WHERE ' + @Cod + N' IS NOT NULL AND ' + @Key + N' <> N'''')
                    INSERT INTO #Map (IdDup, IdKeep) SELECT Id, IdKeep FROM x WHERE rn > 1;';
                EXEC sp_executesql @sql;

                DECLARE curRef CURSOR LOCAL FAST_FORWARD FOR
                    SELECT TablaRef, ColRef, Compartida FROM #Ref WHERE Tabla = @Tabla;
                OPEN curRef;
                FETCH NEXT FROM curRef INTO @TablaRef, @ColRef, @Compartida;
                WHILE @@FETCH_STATUS = 0
                BEGIN
                    IF OBJECT_ID(N'dbo.' + QUOTENAME(@TablaRef), N'U') IS NOT NULL
                       AND COL_LENGTH(N'dbo.' + QUOTENAME(@TablaRef), @ColRef) IS NOT NULL
                    BEGIN
                        IF @Compartida = 0
                        BEGIN
                            SET @sql = N'UPDATE r SET ' + QUOTENAME(@ColRef) + N' = m.IdKeep
                                FROM dbo.' + QUOTENAME(@TablaRef) + N' r
                                INNER JOIN #Map m
                                    ON LTRIM(RTRIM(CAST(r.' + QUOTENAME(@ColRef) + N' AS NVARCHAR(50)))) = CAST(m.IdDup AS NVARCHAR(50));
                                SET @R = @@ROWCOUNT;';
                            EXEC sp_executesql @sql, N'@R INT OUTPUT', @R = @n OUTPUT;
                            SET @Reap = @Reap + @n;
                        END
                        ELSE
                        BEGIN
                            SET @sql = N'UPDATE m SET Referenciada = 1 FROM #Map m
                                WHERE EXISTS (SELECT 1 FROM dbo.' + QUOTENAME(@TablaRef) + N' r
                                    WHERE LTRIM(RTRIM(CAST(r.' + QUOTENAME(@ColRef) + N' AS NVARCHAR(50)))) = CAST(m.IdDup AS NVARCHAR(50)));';
                            EXEC sp_executesql @sql;
                        END
                    END
                    FETCH NEXT FROM curRef INTO @TablaRef, @ColRef, @Compartida;
                END
                CLOSE curRef;
                DEALLOCATE curRef;

                IF @ColEstado IS NULL
                    UPDATE #Map SET Referenciada = 0;

                SET @sql = N'DELETE t FROM ' + @Obj + N' t
                    INNER JOIN #Map m ON m.IdDup = t.' + QUOTENAME(@ColId) + N' AND m.Referenciada = 0;
                    SET @E = @@ROWCOUNT;';
                EXEC sp_executesql @sql, N'@E INT OUTPUT', @E = @Elim OUTPUT;

                IF @ColEstado IS NOT NULL
                BEGIN
                    SET @sql = N'UPDATE t SET ' + QUOTENAME(@ColEstado) + N' = 8 FROM ' + @Obj + N' t
                        INNER JOIN #Map m ON m.IdDup = t.' + QUOTENAME(@ColId) + N' AND m.Referenciada = 1
                        WHERE ISNULL(t.' + QUOTENAME(@ColEstado) + N', 0) <> 8;
                        SET @I = @@ROWCOUNT;';
                    EXEC sp_executesql @sql, N'@I INT OUTPUT', @I = @Inact OUTPUT;
                END
            END
        END

        INSERT INTO #Res (Orden, Tabla, Filas, CodigosDuplicados, FilasSobrantes, Reapuntadas, Eliminadas, Inactivadas)
        VALUES (@Orden, @Tabla, @Filas, @Codigos, @Sobrantes, @Reap, @Elim, @Inact);

        Siguiente:
        FETCH NEXT FROM curCat INTO @Orden, @Tabla, @ColId, @ColCodigo, @ColEstado;
    END
    CLOSE curCat;
    DEALLOCATE curCat;

    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    DECLARE @Err NVARCHAR(4000) = N'Limpieza de duplicados cancelada (' + ISNULL(@Tabla, N'?') + N'): ' + ERROR_MESSAGE();
    RAISERROR(@Err, 16, 1);
END CATCH;

IF EXISTS (SELECT 1 FROM #Res WHERE FilasSobrantes > 0)
    SELECT Tabla, Filas AS [Filas antes], CodigosDuplicados AS [Códigos duplicados], FilasSobrantes AS [Filas sobrantes],
           Reapuntadas AS [Referencias reapuntadas], Eliminadas, Inactivadas,
           CASE WHEN @Ejecutar = 1 THEN FilasSobrantes - Eliminadas ELSE 0 END AS [Quedan inactivas (usadas por RIPS)]
    FROM #Res WHERE FilasSobrantes > 0 ORDER BY Orden;

DECLARE @Total INT, @TotElim INT, @TotInact INT, @TotReap INT;
SELECT @Total = ISNULL(SUM(FilasSobrantes), 0), @TotElim = ISNULL(SUM(Eliminadas), 0),
       @TotInact = ISNULL(SUM(Inactivadas), 0), @TotReap = ISNULL(SUM(Reapuntadas), 0)
FROM #Res;
PRINT CASE
    WHEN @Total = 0 THEN N'Limpieza de duplicados: no se encontraron duplicados.'
    WHEN @Ejecutar = 0 THEN N'Limpieza de duplicados (solo reporte): ' + CAST(@Total AS NVARCHAR(20)) + N' filas sobrantes. Cambie @Ejecutar = 1 para corregir.'
    ELSE N'Limpieza de duplicados: ' + CAST(@TotElim AS NVARCHAR(20)) + N' eliminadas, '
         + CAST(@TotInact AS NVARCHAR(20)) + N' inactivadas, ' + CAST(@TotReap AS NVARCHAR(20)) + N' referencias reapuntadas; '
         + CAST(@Total - @TotElim AS NVARCHAR(20)) + N' copias quedan inactivas porque RIPS existentes las usan.'
END;
GO

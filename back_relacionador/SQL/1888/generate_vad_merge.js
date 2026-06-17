const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'CODESYSTEM', 'VAD.json');
const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const SYS = 'https://fhir.minsalud.gov.co/rda/CodeSystem/VAD';
const esc = (s) => String(s == null ? '' : s).replace(/'/g, "''");

const rows = j.concept.map(
  (c) =>
    `(N'${esc(c.code)}', N'${esc(c.display)}', N'${SYS}', 7)`
);

const mergeSql = `-- Carga oficial MinSalud VAD (${rows.length} conceptos) en RDA_ViaAdministracion
MERGE dbo.RDA_ViaAdministracion AS target
USING (
    SELECT codigo, display, system_url, id_estado
    FROM (VALUES
        ${rows.join(',\n        ')}
    ) AS v(codigo, display, system_url, id_estado)
) AS source
ON target.codigo = source.codigo AND target.system_url = source.system_url
WHEN MATCHED THEN
    UPDATE SET
        target.display = source.display,
        target.id_estado = source.id_estado
WHEN NOT MATCHED THEN
    INSERT (codigo, display, system_url, id_estado)
    VALUES (source.codigo, source.display, source.system_url, source.id_estado);

PRINT 'OK: RDA_ViaAdministracion cargado con catálogo oficial MinSalud VAD (${rows.length} conceptos).';
GO`;

const officialCodes = j.concept.map((c) => `N'${esc(c.code)}'`).join(', ');

const cleanupSql = `
-- Desactivar códigos legacy SOLO si el catálogo oficial ya está cargado (ej. existe 042 activo)
IF OBJECT_ID('dbo.RDA_ViaAdministracion', 'U') IS NOT NULL
   AND EXISTS (
       SELECT 1 FROM dbo.RDA_ViaAdministracion o
       WHERE o.system_url = N'${SYS}'
         AND o.id_estado = 7 AND o.codigo = N'042'
   )
BEGIN
    UPDATE leg
    SET leg.id_estado = 0
    FROM dbo.RDA_ViaAdministracion leg
    WHERE leg.system_url = N'${SYS}'
      AND leg.id_estado = 7
      AND EXISTS (
          SELECT 1
          FROM dbo.RDA_ViaAdministracion ofi
          WHERE ofi.system_url = leg.system_url
            AND ofi.id_estado = 7
            AND ofi.codigo <> leg.codigo
            AND TRY_CAST(ofi.codigo AS INT) IS NOT NULL
            AND TRY_CAST(leg.codigo AS INT) IS NOT NULL
            AND TRY_CAST(ofi.codigo AS INT) = TRY_CAST(leg.codigo AS INT)
            AND LEN(LTRIM(RTRIM(ofi.codigo))) > LEN(LTRIM(RTRIM(leg.codigo)))
      );

    UPDATE v
    SET v.id_estado = 0
    FROM dbo.RDA_ViaAdministracion v
    WHERE v.system_url = N'${SYS}'
      AND v.id_estado = 7
      AND v.codigo NOT IN (${officialCodes});

    PRINT 'OK: RDA_ViaAdministracion — solo catálogo oficial VAD activo (${rows.length} conceptos).';
END
ELSE
    PRINT 'AVISO: Omitida limpieza VAD legacy — ejecute primero el MERGE oficial (debe existir codigo 042 activo).';
GO`;

const migrationSql = `
-- Normalizar vías guardadas con códigos UI legacy del select (ej. "02" = Intravenosa) → VAD oficial
IF OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]', N'U') IS NOT NULL
   AND OBJECT_ID('dbo.RDA_ViaAdministracion', 'U') IS NOT NULL
BEGIN
    ;WITH map_ui AS (
        SELECT * FROM (VALUES
            (N'01', N'048'),
            (N'02', N'042'),
            (N'03', N'030'),
            (N'04', N'058'),
            (N'05', N'061'),
            (N'06', N'055'),
            (N'07', N'054'),
            (N'08', N'060'),
            (N'09', N'047'),
            (N'10', N'050')
        ) AS v(codigo_ui, codigo_oficial)
    )
    UPDATE pm
    SET pm.[Via Administracion] = m.codigo_oficial
    FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos] pm
    INNER JOIN map_ui m ON LTRIM(RTRIM(pm.[Via Administracion])) = m.codigo_ui
    INNER JOIN dbo.RDA_ViaAdministracion v
        ON v.id_estado = 7 AND v.codigo = m.codigo_oficial;

    UPDATE pm
    SET pm.[Via Administracion] = v.codigo
    FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos] pm
    INNER JOIN dbo.RDA_ViaAdministracion v
        ON v.id_estado = 7
       AND LTRIM(RTRIM(v.codigo)) = CASE
            WHEN TRY_CAST(LTRIM(RTRIM(pm.[Via Administracion])) AS INT) IS NOT NULL
                 AND LEN(LTRIM(RTRIM(pm.[Via Administracion]))) < 3
            THEN RIGHT(REPLICATE(N'0', 3) + LTRIM(RTRIM(pm.[Via Administracion])), 3)
            ELSE LTRIM(RTRIM(pm.[Via Administracion]))
        END
    WHERE pm.[Via Administracion] IS NOT NULL
      AND LTRIM(RTRIM(pm.[Via Administracion])) <> LTRIM(RTRIM(v.codigo));

    PRINT 'OK: Prescripciones CE — vías normalizadas a códigos VAD oficiales.';
END
GO`;

const out = `${mergeSql}\n${cleanupSql}\n${migrationSql}`;
const outPath = path.join(__dirname, '_vad_merge_snippet.sql');
fs.writeFileSync(outPath, out, 'utf8');
console.log('written', rows.length, 'rows to', outPath);

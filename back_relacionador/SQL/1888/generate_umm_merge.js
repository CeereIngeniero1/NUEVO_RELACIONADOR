const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'CODESYSTEM', 'UMM.json');
const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const SYS = 'https://fhir.minsalud.gov.co/rda/CodeSystem/UMM';
const esc = (s) => String(s == null ? '' : s).replace(/'/g, "''");

const rows = j.concept.map(
  (c) =>
    `(N'${esc(c.code)}', N'${esc(c.display)}', N'${esc(c.definition || c.display)}', N'${SYS}', 7)`
);

const out = `-- Carga oficial MinSalud UMM (${rows.length} conceptos) en RDA_UMM
MERGE dbo.RDA_UMM AS target
USING (
    SELECT codigo, display, unidad, system_url, id_estado
    FROM (VALUES
        ${rows.join(',\n        ')}
    ) AS v(codigo, display, unidad, system_url, id_estado)
) AS source
ON target.codigo = source.codigo AND target.system_url = source.system_url
WHEN MATCHED THEN
    UPDATE SET
        target.display = source.display,
        target.unidad = source.unidad,
        target.id_estado = source.id_estado
WHEN NOT MATCHED THEN
    INSERT (codigo, display, unidad, system_url, id_estado)
    VALUES (source.codigo, source.display, source.unidad, source.system_url, source.id_estado);
GO
`;

const outPath = path.join(__dirname, '_umm_merge_snippet.sql');
fs.writeFileSync(outPath, out, 'utf8');
console.log('written', rows.length, 'rows to', outPath);

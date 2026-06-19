const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'SQL', '1888', 'CODESYSTEM', 'CIUO88AC.json');
const outPath = path.join(__dirname, '..', 'SQL', '1888', '1888_update_ocupacion_ciuo88ac.sql');

const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const rows = [];

function walk(concepts) {
    if (!Array.isArray(concepts)) return;
    for (const c of concepts) {
        const children = Array.isArray(c.concept) ? c.concept : [];
        const isLeaf = children.length === 0;
        if (isLeaf && c.code && c.display) {
            rows.push({ code: String(c.code).trim(), display: String(c.display).trim() });
        }
        if (children.length) walk(children);
    }
}

walk(json.concept);

function pad4(code) {
    const digits = code.replace(/\D/g, '');
    if (!digits || digits.length !== 4) return null;
    return digits;
}

const byPad = new Map();
for (const row of rows) {
    const padded = pad4(row.code);
    if (!padded) continue;
    byPad.set(padded, row);
}

const esc = (s) => s.replace(/'/g, "''");
const sorted = [...byPad.entries()].sort((a, b) => a[0].localeCompare(b[0]));

const valueLines = sorted.map(
    ([code, row]) => `        (N'${code}', N'${esc(row.display)}')`
);

const sql = `-- Alinea [Ocupación] y [Descripción Ocupación] con CIUO88AC (MinSalud)
-- Fuente: SQL/1888/CODESYSTEM/CIUO88AC.json
-- Regenerar: node tools/genOcupacionCiou88acUpdate.js
-- Match por código normalizado a 4 dígitos (ej. 110 -> 0110)
-- Nota: no usar WHERE con <> en collation CI; IHCE valida display con mayúsculas exactas.

BEGIN TRANSACTION;

UPDATE o
SET
    o.[Ocupación] = v.[Display],
    o.[Descripción Ocupación] = v.[Display]
FROM [dbo].[Ocupación] AS o
INNER JOIN (
    VALUES
${valueLines.join(',\n')}
) AS v([Codigo], [Display])
    ON RIGHT(
        REPLICATE(N'0', 4) + LTRIM(RTRIM(CAST(o.[Código Ocupación] AS NVARCHAR(20)))),
        4
    ) = v.[Codigo];

SELECT @@ROWCOUNT AS RegistrosActualizados;

-- Verificación rápida (código 0110)
SELECT [Id Ocupación], [Código Ocupación], [Ocupación], [Descripción Ocupación]
FROM [dbo].[Ocupación]
WHERE RIGHT(REPLICATE(N'0', 4) + LTRIM(RTRIM([Código Ocupación])), 4) = N'0110';

COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION;
`;

fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${outPath} (${sorted.length} códigos)`);

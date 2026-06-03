/**
 * Genera 1888_create_cups_tabla_con_datos.sql desde CODESYSTEM/Cups.json
 * Uso: node tools/generate_cups_sql.js
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../SQL/1888/CODESYSTEM/Cups.json');
const outPath = path.join(__dirname, '../SQL/1888/1888_create_cups_tabla_con_datos.sql');
const CS_URL = 'https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS';

function sqlStr(s) {
    return "N'" + String(s ?? '').replace(/'/g, "''") + "'";
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const concepts = Array.isArray(data.concept) ? data.concept : [];

const seen = new Set();
const rows = [];
for (const c of concepts) {
    const code = String(c.code || '').trim();
    const name = String(c.display || c.code || '').trim();
    if (!code) continue;
    const key = code.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
        code,
        name: name.slice(0, 500),
        url: `${CS_URL}#${code}`,
    });
}

rows.sort((a, b) => a.code.localeCompare(b.code, 'es', { numeric: true }));

const header = `/* Script autocontenido CUPS: crea tabla y carga datos embebidos */
/* Generado desde CODESYSTEM/Cups.json — ${rows.length} conceptos */
SET NOCOUNT ON;
GO
IF OBJECT_ID('dbo.CUPS_Codigos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CUPS_Codigos (
        IdCUPS INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo NVARCHAR(50) NOT NULL,
        Nombre NVARCHAR(500) NOT NULL,
        DefinicionUrl NVARCHAR(1000) NULL,
        IdEstado INT NOT NULL CONSTRAINT DF_CUPS_Codigos_IdEstado DEFAULT (7),
        FechaCarga DATETIME2(0) NOT NULL CONSTRAINT DF_CUPS_Codigos_FechaCarga DEFAULT (SYSDATETIME())
    );
    CREATE UNIQUE INDEX UX_CUPS_Codigos_Codigo ON dbo.CUPS_Codigos(Codigo);
END
GO
BEGIN TRAN;
MERGE dbo.CUPS_Codigos AS tgt
USING (VALUES
`;

const valueLines = rows.map(
    (r) => `    (${sqlStr(r.code)}, ${sqlStr(r.name)}, ${sqlStr(r.url)})`
);

const footer = `
) AS src (Codigo, Nombre, DefinicionUrl)
ON tgt.Codigo = src.Codigo
WHEN MATCHED THEN
    UPDATE SET
        tgt.Nombre = src.Nombre,
        tgt.DefinicionUrl = src.DefinicionUrl
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Codigo, Nombre, DefinicionUrl)
    VALUES (src.Codigo, src.Nombre, src.DefinicionUrl);
COMMIT;
SELECT COUNT(1) AS TotalRegistros FROM dbo.CUPS_Codigos;
GO
`;

fs.writeFileSync(outPath, header + valueLines.join(',\n') + footer, 'utf8');
console.log(`OK: ${rows.length} registros -> ${outPath}`);

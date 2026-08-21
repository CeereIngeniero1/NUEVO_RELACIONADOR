'use strict';

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'SQL', '1888', 'CODESYSTEM', 'CIUO88AC.json');
const outPath = path.join(__dirname, '..', 'SQL', '1888', '1888_replace_ocupacion_ciuo88ac.sql');

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

const inserts = sorted
    .map(([code, row], i) => {
        const orden = i + 1;
        const d = esc(row.display);
        return (
            'INSERT INTO [dbo].[Ocupación] ' +
            '([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) ' +
            `VALUES (N'${code}', N'${d}', N'${d}', ${orden}, 7);`
        );
    })
    .join('\n');

const sql = `-- Reemplaza TODO el catálogo [Ocupación] por CIUO88AC oficial (MinSalud) + Sin asignar (Id=1).
-- Fuente: SQL/1888/CODESYSTEM/CIUO88AC.json
-- Regenerar: node tools/genOcupacionCiou88acReplace.js
--
-- PRERREQUISITO: las tablas que referencian [Id Ocupación] deben apuntar a 1
-- (Sin asignar) antes de correr este script, para que el DELETE no falle por FK.
-- Este script NO borra Id=1: solo borra el resto y lo recrea con códigos oficiales.

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 1) Borrar todo EXCEPTO Id=1 (las FKs que apuntan a 1 seguirán válidas)
DELETE FROM [dbo].[Ocupación]
WHERE [Id Ocupación] <> 1;

-- 2) Asegurar Sin asignar en Id=1
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

-- 3) Oficiales CIUO88AC (${sorted.length} códigos)
${inserts}

-- 4) Verificación
SELECT COUNT(*) AS TotalOcupaciones FROM [dbo].[Ocupación]; -- esperado: ${sorted.length + 1}

SELECT [Id Ocupación], [Código Ocupación], [Ocupación], [Orden Ocupación], [Id Estado]
FROM [dbo].[Ocupación]
WHERE [Id Ocupación] = 1
   OR [Código Ocupación] IN (N'0110', N'9333')
ORDER BY [Id Ocupación], [Código Ocupación];

COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION;
`;

fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${outPath} (${sorted.length} códigos + Sin asignar)`);

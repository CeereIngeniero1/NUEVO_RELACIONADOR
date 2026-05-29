const { loadDotEnvFromCandidates } = require('../server/config/envLoader');
loadDotEnvFromCandidates();
const { poolPromise } = require('../server/db2');

const doc = process.argv[2] || '43722664';

(async () => {
    const pool = await poolPromise;
    const r = await pool.request()
        .input('Doc', require('mssql').VarChar(50), doc)
        .query(`
            SELECT TOP 10
                ee.[Id Evaluación Entidad],
                er.[Codigo Rips],
                ee.[Fecha Evaluación Entidad]
            FROM [dbo].[Evaluación Entidad Rips] er
            INNER JOIN [dbo].[Evaluación Entidad] ee
                ON ee.[Id Evaluación Entidad] = er.[Id Evaluación Entidad]
            WHERE ee.[Documento Entidad] = @Doc
            ORDER BY ee.[Fecha Evaluación Entidad] DESC
        `);
    console.table(r.recordset);
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

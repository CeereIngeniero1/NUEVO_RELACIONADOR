const sql = require('mssql');

const server = process.env.DB_SERVER;
const database = process.env.DB_DATABASE;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const port = parseInt(process.env.DB_PORT || '1433', 10);
const encrypt = process.env.DB_ENCRYPT === 'true';
const trustServerCertificate = process.env.DB_TRUST_CERT !== 'false';

if (!server || !database || !user || !password) {
    throw new Error('[db2.js] Faltan DB_SERVER, DB_DATABASE, DB_USER o DB_PASSWORD (cargar .env / envLoader antes de importar db2)');
}

const config = {
    user,
    password,
    server,
    database,
    port,
    options: {
        encrypt,
        trustServerCertificate,
        language: 'Spanish',
        requestTimeout: 300000,
    },
    pool: {
        max: 20,
        min: 1,
        idleTimeoutMillis: 30000,
    },
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(async (pool) => {
        console.log('✅ Pool de conexión creado (mssql)');
        console.log(`   → Servidor (.env DB_SERVER): ${server}`);
        console.log(`   → Base (.env DB_DATABASE):   ${database}`);
        try {
            const r = await pool.request().query('SELECT @@SERVERNAME AS sn, DB_NAME() AS db');
            const row = r.recordset[0] || {};
            console.log(`   → Conectado realmente a:       ${row.sn} / ${row.db}`);
        } catch (e) {
            console.warn('   → No se pudo leer @@SERVERNAME / DB_NAME():', e.message);
        }
        return pool;
    })
    .catch((err) => {
        console.error('❌ Error creando el pool:', err.message);
        throw err;
    });

module.exports = {
    sql,
    poolPromise,
};

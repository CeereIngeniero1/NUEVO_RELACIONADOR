// // npm install tedious@latest
// const { Connection, Request, TYPES } = require('tedious');
// const fs = require('fs');

// // Ruta completa al archivo CRInfo.ini
// const filePath = 'C:/CeereSio/CRInfo.ini';

// // Leer el contenido del archivo de manera síncrona
// const fileContent = fs.readFileSync(filePath, 'utf-8');

// // Buscar la línea que contiene "DataSource"
// const dataSourceLine = fileContent.split('\n').find(line => line.includes('DataSource'));
// const dataSourceValue = dataSourceLine.split('=')[1].split('\\')[0].trim();

// // Buscar la línea que contiene exactamente Catalog
// const CatalogLine = fileContent.split('\n').find(line => line.trim().startsWith('Catalog='));
// const CatalogLineValue = CatalogLine.split('=')[1].split('\\')[0].trim();

// console.log(CatalogLineValue);

// const config = {
//     server: dataSourceValue,
//     authentication: {
//         type: 'default',
//         options: {
//             userName: 'CeereRIPS',
//             password: 'crsoft'
//         }
//     },
//     options: { 
//         port: 1433,
//         database: CatalogLineValue,
//         encrypt: false,
//         requestTimeout: 30000000,
//         language: 'Spanish' // Esto puede no funcionar en todas las versiones
//     }
// };

// // Crear una conexión
// const connection = new Connection(config);

// connection.connect(err => {
//     if (err) {
//         console.error('Error al conectar:', err.message);
//     } else {
//         console.log('Conectado a la base de datos');
//     }
// });

// // Exportar la conexión
// module.exports = connection;



const sql = require('mssql');
const fs = require('fs');

// Leer configuración desde el archivo INI
const filePath = 'C:/CeereSio/CRInfo.ini';
const fileContent = fs.readFileSync(filePath, 'utf-8');

const dataSourceLine = fileContent.split('\n').find(line => line.includes('DataSource'));
const dataSourceValue = dataSourceLine?.split('=')[1]?.trim();

const catalogLine = fileContent.split('\n').find(line => line.trim().startsWith('Catalog='));
const catalogLineValue = catalogLine?.split('=')[1]?.trim();

// Configuración del pool
const config = {
    user: 'CeereRIPS',
    password: 'crsoft',
    server: dataSourceValue,
    database: catalogLineValue,
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true, // útil para entornos locales
        language: 'Spanish', // Esto puede no funcionar en todas las versiones
        requestTimeout: 300000,
    },
    pool: {
        max: 20,
        min: 1,
        idleTimeoutMillis: 30000
    },
};

// Crear pool de conexión
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Pool de conexión creado');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error creando el pool:', err.message);
        throw err;
    });

module.exports = {
    sql, poolPromise
};

const { Connection, Request, TYPES } = require('tedious');

const server = process.env.DB_SERVER;
const database = process.env.DB_DATABASE;
const userName = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const encrypt = process.env.DB_ENCRYPT === 'true';
const trustServerCertificate = process.env.DB_TRUST_CERT !== 'false';

if (!server || !database || !userName || !password) {
    throw new Error('[db.js] Faltan DB_SERVER, DB_DATABASE, DB_USER o DB_PASSWORD (cargar .env / envLoader antes de importar db)');
}

const connections = [];

const config = {
    server,
    authentication: {
        type: 'default',
        options: {
            userName,
            password,
        },
    },
    options: {
        database,
        encrypt,
        trustServerCertificate,
        language: 'Spanish',
        requestTimeout: 300000,
    },
};

const connection = new Connection(config);

connection.connect();

connection.on('connect', (err) => {
    if (err) {
        console.error('Error al conectarse a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos (tedious)');
    }
});

/**
 * Tedious no permite ejecutar requests concurrentes sobre la misma conexión.
 * Serializamos execSql para evitar:
 * "Requests can only be made in the LoggedIn state, not the SentClientRequest state".
 */
const execSqlOriginal = connection.execSql.bind(connection);
let tediousQueue = Promise.resolve();

connection.execSql = function execSqlQueued(request) {
    tediousQueue = tediousQueue
        .catch(() => undefined)
        .then(
            () =>
                new Promise((resolve) => {
                    let settled = false;
                    const done = () => {
                        if (settled) return;
                        settled = true;
                        resolve();
                    };
                    request.once('requestCompleted', done);
                    request.once('error', done);
                    try {
                        execSqlOriginal(request);
                    } catch (e) {
                        done();
                        throw e;
                    }
                })
        );
    return tediousQueue;
};

module.exports = connection;

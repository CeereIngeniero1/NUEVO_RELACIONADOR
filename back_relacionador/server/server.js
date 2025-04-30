const express = require('express');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Worker } = require('worker_threads');  // Importa Worker para trabajar en un hilo diferente
const compression = require('compression'); //Comprime las respuestas HTTP que se envían al cliente

// Se incluyen las rutas de ejecución
const loginRoutes = require('./routes/loginRoutes');
const descargarArchivosRIPSRoutes = require('./routes/descargarArchivosRIPSRoutes');
const DescargarXMLSPorLaAPIDeFacturaTechRoutes = require('./routes/descargarXMLSporAPIFacturatechRoutes');
const InfoPacientesRoutes = require('./routes/infoPacientesRoutes');
const epsRoutes = require('./routes/epsRoutes');
const AsignarRips = require('./routes/Asignar_RipsRoutes');
const MaestroListasRIPS = require('./routes/MaestroListasRipsRoutes');


/* =========================================================================================================== */
// Se crea un nuevo worker que ejecutará el archivo asignarNombreServidorRoutes.js
// const AsignarNombreDeServidor = new Worker(path.join(__dirname, './routes/asignarNombreServidorRoutes.js')); //Esto ya se haría desde el front_end
/* =========================================================================================================== */
// Se crea un nuevo worker que ejecutará el archivo prepararArchivosDeEnvioRoutes.js
const PrepararArchivosDeEnvio = new Worker(path.join(__dirname, './routes/prepararArchivosDeEnvioRoutes.js'));
/* =========================================================================================================== */

const app = express();

// Usar el middleware de compresión
app.use(compression());

// Configuración de express-session
app.use(session({
    secret: 'Cr1026*', // Reemplaza esto con una clave secreta segura
    resave: false,
    saveUninitialized: true,
}));

app.use(cors());
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));
app.set('view engine', 'ejs');

let connections = [];

// Endpoint para ejecutar una consulta (debe ser implementado)
app.get('/api/executeQuery', (req, res) => {
    executeQuery();
    res.send('Funciono el envio');
}); 

// Endpoint para establecer la conexión SSE
app.get('/api/sse', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // Mantener la conexión abierta
    res.write('\n');

    // Limpiar la lista de conexiones al iniciar una nueva conexión SSE
    connections.length = 0;

    // Almacenar la respuesta del cliente para futuras actualizaciones
    connections.push(res);

    // Manejar la desconexión del cliente
    req.on('close', () => {
        const index = connections.indexOf(res);
        if (index !== -1) {
            connections.splice(index, 1);
        }
    });
});

// Middleware para verificar el token antes de permitir el acceso
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    jwt.verify(token, 'secretKey', (err, user) => {
        if (err) {
            console.error('Error al verificar el token:', err.message);
            return res.status(403).json({ error: 'Token inválido' });
        }

        req.user = user;
        next();
    });
};

// Ruta protegida que requiere token
app.get('/protected', authenticateToken, (req, res) => {
    const user = req.user; // Usamos req.user para obtener la información del usuario
    res.json({ message: 'Acceso permitido', user });
});

// Ruta protegida (ejemplo con index.html)
app.get('/index', authenticateToken, (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.use('/api', loginRoutes);

app.use('/RIPS', descargarArchivosRIPSRoutes);

app.use('/XMLS', DescargarXMLSPorLaAPIDeFacturaTechRoutes);

app.use('/api', InfoPacientesRoutes);

app.use('/api', epsRoutes);

app.use('/api', AsignarRips);

app.use('/api', MaestroListasRIPS);

const port = 3000;

/* Funcionamiento para lanzar servicio del FrontEnd */
    // // Servir archivos estáticos
    // app.use(express.static(path.join(__dirname, '../')));

    // // Ruta comodín para el SPA
    // app.get('*', (req, res) => {
    //     res.sendFile(path.join(__dirname, '../index.html'));
    // });

    // app.listen(port, () => {
    //     console.log(`Servidor escuchando en http://localhost:${port}`);
    // });
/* FIN FIN FIN */

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
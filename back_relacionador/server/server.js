const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const { ensureBackendEnv } = require('./config/envLoader');
ensureBackendEnv();
const { Worker } = require('worker_threads');  // Importa Worker para trabajar en un hilo diferente
const compression = require('compression'); //Comprime las respuestas HTTP que se envían al cliente

// Se incluyen las rutas de ejecución
const loginRoutes = require('./routes/loginRoutes');
const descargarArchivosRIPSRoutes = require('./routes/descargarArchivosRIPSRoutes');
const descargarArchivosRIPSRoutesv2 = require('./routes/descargarArchivosRIPSRoutes V2');
const DescargarXMLSPorLaAPIDeFacturaTechRoutes = require('./routes/descargarXMLSporAPIFacturatechRoutes');
const descargarXMLSporAPIFenalcoRoutes = require('./routes/descargarXMLSporAPIFenalcoRoutes');
const InfoPacientesRoutes = require('./routes/infoPacientesRoutes');
const InfoPacientesRoutesv2 = require('./routes/infoPacientesRoutes V2');
const epsRoutes = require('./routes/epsRoutes');
const epsRoutesv2 = require('./routes/epsRoutes V2');
const AsignarRips = require('./routes/Asignar_RipsRoutes');
const AsignarRipsv2 = require('./routes/Asignar_RipsRoutes V2');
const AsignarRipsv3 = require('./routes/Asignar_RipsRoutes V3');
const HistoriasClinicasRoutes = require('./routes/historiasClinicasRoutes');
const AsignarRipsv3Experimental = require('./routes/Asignar_RipsRoutes V3 experimental');
const DesrelacionadorRoutes = require('./routes/desrelacionadorRoutes');
const VisorIhceRoutes = require('./routes/VisorIhceRoutes');
const MaestroListasRIPS = require('./routes/MaestroListasRipsRoutes');
const Facturador = require('./routes/FacturadorRoutes');

/* =========================================================================================================== */
// Se crea un nuevo worker que ejecutará el archivo asignarNombreServidorRoutes.js
// const AsignarNombreDeServidor = new Worker(path.join(__dirname, './routes/asignarNombreServidorRoutes.js')); //Esto ya se haría desde el front_end
/* =========================================================================================================== */
// Se crea un nuevo worker que ejecutará el archivo prepararArchivosDeEnvioRoutes.js
let PrepararArchivosDeEnvio = null;
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

/** Salud del servicio (monitoreo y smoke tests HTTP sin tocar BD). */
app.get('/health', (req, res) => {
    res.status(200).json({ ok: true, service: 'back_relacionador' });
});

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

const { authenticateToken } = require('./middleware/authenticateToken');

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

app.use('/RIPSv2', descargarArchivosRIPSRoutesv2);

app.use('/XMLS', DescargarXMLSPorLaAPIDeFacturaTechRoutes);

app.use('/XMLS', descargarXMLSporAPIFenalcoRoutes);

app.use('/api', InfoPacientesRoutes);

app.use('/apiV2', InfoPacientesRoutesv2);

app.use('/api', epsRoutes);

app.use('/apiv2', epsRoutesv2);

app.use('/api', AsignarRips);

app.use('/apiV2', AsignarRipsv2);
app.use('/apiV3', AsignarRipsv3);
app.use('/apiV3', HistoriasClinicasRoutes);
app.use('/apiV3', DesrelacionadorRoutes);
app.use('/apiV3', VisorIhceRoutes);
app.use('/apiV3Experimental', AsignarRipsv3Experimental);

app.use('/api', MaestroListasRIPS);

app.use('/XMLS', Facturador);

const port = parseInt(process.env.BACK_PORT || process.env.PORT || '3000', 10);

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

module.exports = app;

if (require.main === module) {
    // Worker solo cuando el servidor corre en modo standalone (evita colgar suites de prueba).
    PrepararArchivosDeEnvio = new Worker(path.join(__dirname, './routes/prepararArchivosDeEnvioRoutes.js'));

    app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port}`);
    });
}
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const compression = require('compression');
const { Worker } = require('worker_threads');  // Importa Worker para trabajar en un hilo diferente

/* =========================================================================================================== */
// Se crea un nuevo worker que ejecutará el archivo asignarNombreServidorRoutes.js
const AsignarNombreDeServidor = new Worker(path.join(__dirname, './controlador/asignarNombreServidorRoutes.js'));

AsignarNombreDeServidor.on('message', msg => {
    console.log("📢 Worker dice:", msg);
});

AsignarNombreDeServidor.on('error', err => {
    console.error("❌ Error del Worker:", err);
});

AsignarNombreDeServidor.on('exit', code => {
    console.log("🚪 Worker finalizó con código:", code);
});
/* =========================================================================================================== */


const app = express();

// Middleware para compresión
app.use(compression());

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ limit: '1000mb', extended: true }));

// Configuración de express-session
app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultSecret', // Usa una variable de entorno
    resave: false,
    saveUninitialized: true,
}));

// Configuración de CORS
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Middleware para servir archivos estáticos con caché
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Cachear por 1 día
    etag: false
}));

let connections = [];

// Endpoint para ejecutar una consulta (debe ser implementado)
app.get('/api/executeQuery', (req, res) => {
    executeQuery()
        .then(result => res.send(result))
        .catch(err => res.status(500).send('Error al ejecutar la consulta: ' + err.message));
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

    jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret', (err, user) => {
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

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta protegida (ejemplo con index.html)
app.get('/index', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Asegúrate de que la ruta sea correcta
});

// Ruta principal
app.get('/', (req, res) => {
    console.log('SE VISITÓ LA PAGINA');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/Asignar_RIPS.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Asignar_RIPS.html'))
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

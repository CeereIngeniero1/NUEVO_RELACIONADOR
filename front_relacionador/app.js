const fs = require('fs');
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const compression = require('compression');
const { Worker } = require('worker_threads');  // Importa Worker para trabajar en un hilo diferente

(function loadFrontDotEnv() {
    const candidates = [
        path.join(__dirname, '.env'),
        path.join(process.cwd(), 'front_relacionador', '.env'),
        path.join(process.cwd(), '.env'),
    ];
    for (const envPath of candidates) {
        try {
            if (!fs.existsSync(envPath)) continue;
            const text = fs.readFileSync(envPath, 'utf8');
            for (const line of text.split(/\r?\n/)) {
                const s = line.replace(/^\uFEFF/, '').trim();
                if (!s || s.startsWith('#')) continue;
                const eq = s.indexOf('=');
                if (eq <= 0) continue;
                const key = s.slice(0, eq).trim();
                let val = s.slice(eq + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                const cur = process.env[key];
                const vacio = cur === undefined || cur === null || String(cur).trim() === '';
                if (vacio) process.env[key] = val;
            }
            break;
        } catch (err) {
            console.warn('[front .env] Lectura fallida:', envPath, err && err.message ? err.message : err);
        }
    }
})();

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

/**
 * Configuración para el navegador: API_BASE_URL y BACK_PORT (fallback).
 * Debe registrarse antes de express.static para no servir un archivo estático con el mismo nombre.
 */
app.get('/config.js', (req, res) => {
    res.type('application/javascript');
    res.set('Cache-Control', 'no-store');
    const explicit = (process.env.API_BASE_URL || '').trim();
    const backPort = process.env.BACK_PORT || process.env.PORT || '3000';
    let apiBase;
    if (explicit) {
        apiBase = explicit.replace(/\/$/, '');
    } else {
        const proto = req.protocol || 'http';
        const host = req.hostname || 'localhost';
        apiBase = `${proto}://${host}:${backPort}`;
    }
    const body =
        'window.__APP_CONFIG__=' +
        JSON.stringify({
            API_BASE_URL: apiBase,
            BACK_PORT: String(backPort),
            IHCE_FORCE_SANDBOX_ONLY: ['1', 'true', 'yes', 'on'].includes(
                String(process.env.IHCE_FORCE_SANDBOX_ONLY || '').trim().toLowerCase()
            ),
            IHCE_FORCE_PROD_ONLY: ['1', 'true', 'yes', 'on'].includes(
                String(process.env.IHCE_FORCE_PROD_ONLY || '').trim().toLowerCase()
            ),
        }) +
        ';';
    res.send(body);
});

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

// Middleware para servir archivos estáticos — SIN caché en desarrollo
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: 0,
    etag: true,
    lastModified: true,
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

// Ruta protegida (ejemplo con index.html)
app.get('/index', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Asegúrate de que la ruta sea correcta
});

// Ruta principal
app.get('/', (req, res) => {
    console.log('SE VISITÓ LA PAGINA');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/Asignar_RIPS', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Asignar_RIPS V3.html'))
});

app.get('/Asignar_RIPS.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Asignar_RIPS V3.html'))
});

const PORT = parseInt(process.env.FRONT_PORT || process.env.PORT || '3100', 10);
let frontServer = null;

function startFrontServer() {
    if (frontServer && frontServer.listening) return;
    frontServer = app.listen(PORT, () => {
        console.log(`Front escuchando en el puerto ${PORT} (config: FRONT_PORT / API_BASE_URL / BACK_PORT en .env)`);
    });

    // Si algo externo cierra el socket, intentar levantar de nuevo.
    frontServer.on('close', () => {
        console.error('⚠️ Servidor front cerrado inesperadamente. Reintentando en 1s...');
        setTimeout(() => {
            startFrontServer();
        }, 1000);
    });

    frontServer.on('error', (err) => {
        console.error('❌ Error del servidor front:', err && err.message ? err.message : err);
    });
}

startFrontServer();

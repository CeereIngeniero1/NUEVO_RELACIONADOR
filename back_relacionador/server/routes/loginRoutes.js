const { Request, TYPES } = require('tedious');
const jwt = require('jsonwebtoken');
const Router = require('express').Router;
const connection = require('../db');

const router = Router();

// Endpoint para el inicio de sesión
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Realizar la autenticación en la base de datos
    const request = new Request(
        'SELECT [Nombre de Usuario], [Documento Entidad], Contraseña, [Id Nivel] FROM Contraseña WHERE [Nombre de Usuario] = @username AND Contraseña = @password',
        (err) => {
            if (err) {
                console.error(err.message);
                if (!res.headersSent) {
                    return res.status(500).json({ error: 'Error en la autenticación' });
                }
            }
        }
    );

    request.addParameter('username', TYPES.VarChar, username);
    request.addParameter('password', TYPES.VarChar, password);

    let rowFound = false;

    request.on('row', (columns) => {
        // Extraer las columnas necesarias
        const usernameColumn = columns.find(col => col.metadata.colName === 'Nombre de Usuario');
        const passwordColumn = columns.find(col => col.metadata.colName === 'Contraseña');
        const idNivelColumn = columns.find(col => col.metadata.colName === 'Id Nivel');
        const documentoEntidadColumn = columns.find(col => col.metadata.colName === 'Documento Entidad');

        if (!usernameColumn || !passwordColumn || !idNivelColumn || !documentoEntidadColumn) {
            console.error('Column not found in result set');
            if (!res.headersSent) {
                return res.status(500).json({ error: 'Error en la autenticación' });
            }
        }

        // Si las credenciales son válidas, generamos un token JWT
        const token = jwt.sign({ username }, 'secretKey', { expiresIn: '8h' });

        // Obtener el nivel de usuario de las columnas
        const userLevel = idNivelColumn.value;

        const documentousuariologeado = documentoEntidadColumn.value;

        // Verificar el nivel de usuario
        if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(userLevel)) {
            if (!res.headersSent) {
                return res.status(403).json({ error: 'Nivel de usuario no reconocido'});
            }
        }

        // Enviar el token y el nivel de usuario al cliente
        if (!res.headersSent) {
            res.json({ token, userLevel,  documentousuariologeado});
        }

        // Almacena información adicional del usuario en la sesión
        req.session.user = { username, userLevel };

        // Indicar que se encontró una fila
        rowFound = true;
    });

    request.on('requestCompleted', () => {
        // Si no se encontraron filas, significa que las credenciales no son válidas
        if (!rowFound && !res.headersSent) {
            res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    });

    connection.execSql(request);
});

module.exports = router;
const jwt = require('jsonwebtoken');

/**
 * Mismo criterio que en server.js: Authorization header con JWT firmado con secretKey.
 */
function authenticateToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    jwt.verify(token, 'secretKey', (err, user) => {
        if (err) {
            console.error('Error al verificar el token:', err.message);
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

module.exports = { authenticateToken };

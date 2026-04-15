const path = require('path');

/**
 * Raíz de datos RIPS (subcarpetas ARCHIVOS_RIPS, ARCHIVOS_RIPS_JSON, XMLS, ARCHIVOS_DE_ENVIO).
 * Obligatorio en .env: CEERE_RIPS_DATA_ROOT o RIPS_2275_ROOT (sin valor por defecto en código).
 */
function getRipsDataRoot() {
    const raw = process.env.CEERE_RIPS_DATA_ROOT || process.env.RIPS_2275_ROOT;
    const trimmed = raw != null ? String(raw).trim() : '';
    if (!trimmed) {
        throw new Error(
            '[paths] Defina CEERE_RIPS_DATA_ROOT (o RIPS_2275_ROOT) en back_relacionador/.env con la ruta base de las carpetas RIPS. Ejemplo: CEERE_RIPS_DATA_ROOT=C:\\CeereSio\\RIPS_2275'
        );
    }
    return path.normalize(trimmed);
}

module.exports = { getRipsDataRoot };

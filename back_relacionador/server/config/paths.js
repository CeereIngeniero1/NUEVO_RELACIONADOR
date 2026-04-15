const path = require('path');

/**
 * Raíz de datos RIPS (equivale a la antigua `C:\CeereSio\RIPS_2275`).
 * Configurable con CEERE_RIPS_DATA_ROOT o RIPS_2275_ROOT en .env
 */
function getRipsDataRoot() {
    const raw = process.env.CEERE_RIPS_DATA_ROOT || process.env.RIPS_2275_ROOT;
    if (raw && String(raw).trim()) {
        return path.normalize(String(raw).trim());
    }
    return path.join('C:', 'CeereSio', 'RIPS_2275');
}

module.exports = { getRipsDataRoot };

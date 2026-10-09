const { Request: TediousRequest } = require('tedious');

const VALOR_ERROR_CARGA = 'ERROR AL CARGAR';

// Un throw dentro del evento 'row' de tedious tumba todo el proceso de Node.
class Request extends TediousRequest {
    on(evento, handler) {
        if (evento !== 'row') return super.on(evento, handler);
        return super.on(evento, (columns) => {
            try {
                handler(columns);
            } catch (err) {
                console.error('❌ RIPS: fila omitida por error al leer datos:', err);
            }
        });
    }
}

function valorRipsTexto(columna, campo) {
    const v = columna ? columna.value : null;
    if (v === null || v === undefined || String(v).trim() === '') {
        console.warn(`⚠️ RIPS: ${campo} vacío en BD → "${VALOR_ERROR_CARGA}"`);
        return VALOR_ERROR_CARGA;
    }
    return String(v);
}

module.exports = { Request, valorRipsTexto, VALOR_ERROR_CARGA };

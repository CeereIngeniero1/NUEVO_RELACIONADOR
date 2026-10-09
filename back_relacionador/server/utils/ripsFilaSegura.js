const { Request: TediousRequest } = require('tedious');

const VALOR_ERROR_CARGA = 'ERROR AL CARGAR';

function registrarErrorEvento(evento, err) {
    if (evento === 'row') {
        console.error('❌ RIPS: fila omitida por error al leer datos:', err);
    } else {
        console.error(`❌ RIPS: error en evento '${evento}':`, err);
    }
}

// Solo eventos de la app: tedious hace once/removeListener sobre 'cancel' y no debe envolverse.
const EVENTOS_PROTEGIDOS = new Set(['row', 'requestCompleted', 'error', 'done', 'doneInProc', 'doneProc']);

// Un throw (o promesa rechazada) dentro de un evento de tedious tumba todo el proceso de Node.
class Request extends TediousRequest {
    on(evento, handler) {
        if (!EVENTOS_PROTEGIDOS.has(evento)) return super.on(evento, handler);
        return super.on(evento, (...args) => {
            try {
                const r = handler(...args);
                if (r && typeof r.catch === 'function') {
                    r.catch((err) => registrarErrorEvento(evento, err));
                }
            } catch (err) {
                registrarErrorEvento(evento, err);
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

/** Devuelve el arreglo de servicios o VALOR_ERROR_CARGA si la consulta interna falla. */
async function obtenerServiciosRips(url, etiqueta) {
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (!Array.isArray(data)) throw new Error('respuesta no es un arreglo');
        return data;
    } catch (err) {
        console.error(`❌ RIPS: error al cargar ${etiqueta} → "${VALOR_ERROR_CARGA}":`, err.message || err);
        return VALOR_ERROR_CARGA;
    }
}

/** Asigna el resultado de obtenerServiciosRips en usuario.servicios[clave]. */
function asignarServiciosRips(usuario, clave, data) {
    if (data === VALOR_ERROR_CARGA) {
        usuario.servicios[clave] = VALOR_ERROR_CARGA;
    } else if (data.length > 0) {
        usuario.servicios[clave].push(...data);
    } else {
        delete usuario.servicios[clave];
    }
}

module.exports = {
    Request,
    valorRipsTexto,
    obtenerServiciosRips,
    asignarServiciosRips,
    VALOR_ERROR_CARGA,
};

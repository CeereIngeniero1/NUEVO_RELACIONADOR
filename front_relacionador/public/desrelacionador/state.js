/**
 * Estado mínimo del desrelacionador (último listado cargado).
 * Permite extender filtros, caché o telemetría sin acoplar la UI al fetch.
 */

/** @type {object[] | null} */
let ultimasRelaciones = null;

export function setUltimasRelaciones(items) {
  ultimasRelaciones = items ? [...items] : null;
}

export function getUltimasRelaciones() {
  return ultimasRelaciones ? [...ultimasRelaciones] : null;
}

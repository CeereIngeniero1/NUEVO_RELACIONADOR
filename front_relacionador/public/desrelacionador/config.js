/**
 * Configuración del módulo Desrelacionador RIPS (host API).
 * Misma fuente que el resto del front: NombreEquipoServidor + fallback.
 */

export function getServidorHost() {
  return (
    localStorage.getItem("NombreEquipoServidor") ||
    window.location.hostname ||
    "localhost"
  );
}

export function getApiBaseUrl() {
  return `http://${getServidorHost()}:3000`;
}

export function getApiV3BaseUrl() {
  return `${getApiBaseUrl()}/apiV3`;
}

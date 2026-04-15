/**
 * Configuración del módulo Desrelacionador RIPS (host API).
 * Misma fuente que el resto del front: __APP_CONFIG__ + fallback.
 */
import { getApiBaseUrl } from "../rda/api/apiBaseUrl.js";

export { getApiBaseUrl };

export function getServidorHost() {
  return (
    localStorage.getItem("NombreEquipoServidor") ||
    window.location.hostname ||
    "localhost"
  );
}

export function getApiV3BaseUrl() {
  return `${getApiBaseUrl()}/apiV3`;
}

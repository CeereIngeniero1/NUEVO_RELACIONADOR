/**
 * Base URL del API backend (sin barra final).
 * Depende de window.__APP_CONFIG__ inyectado por GET /config.js (Express).
 */
(function (global) {
  global.__APP_CONFIG__ = global.__APP_CONFIG__ || {};

  function getApiBaseUrl() {
    var cfg = global.__APP_CONFIG__ || {};
    var explicit = (cfg.API_BASE_URL || "").replace(/\/$/, "");
    if (explicit) return explicit;
    var h =
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("NombreEquipoServidor")) ||
      (typeof global.location !== "undefined" && global.location.hostname) ||
      "localhost";
    var p =
      cfg.BACK_PORT != null && cfg.BACK_PORT !== ""
        ? String(cfg.BACK_PORT)
        : "3000";
    return "http://" + h + ":" + p;
  }

  global.getApiBaseUrl = getApiBaseUrl;
})(typeof window !== "undefined" ? window : globalThis);

/**
 * Misma lógica que /apiConfig.js para módulos ES (RDA).
 * Requiere que /config.js se haya cargado antes (window.__APP_CONFIG__).
 */
export function getApiBaseUrl() {
  const cfg =
    typeof window !== "undefined" ? window.__APP_CONFIG__ || {} : {};
  const explicit = (cfg.API_BASE_URL || "").replace(/\/$/, "");
  if (explicit) return explicit;
  const h =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("NombreEquipoServidor")) ||
    (typeof window !== "undefined" && window.location.hostname) ||
    "localhost";
  const p =
    cfg.BACK_PORT != null && cfg.BACK_PORT !== ""
      ? String(cfg.BACK_PORT)
      : "3000";
  return `http://${h}:${p}`;
}

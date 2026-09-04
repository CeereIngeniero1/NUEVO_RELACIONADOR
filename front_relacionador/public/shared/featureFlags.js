/**
 * Feature flags de producto (RIPS / RDA) desde window.__APP_CONFIG__ (/config.js).
 * Por defecto ambos quedan habilitados si la clave no viene o está vacía.
 */

function parseCfgBool(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw);
}

export function getFeatureFlags() {
  const cfg = (typeof window !== "undefined" && window.__APP_CONFIG__) || {};
  return {
    enableRips: parseCfgBool(cfg.ENABLE_RIPS, true),
    enableRda: parseCfgBool(cfg.ENABLE_RDA, true),
  };
}

/** Primera página permitida según flags (href relativo al public/). */
export function getDefaultLandingHref({ basePath = "" } = {}) {
  const { enableRips, enableRda } = getFeatureFlags();
  const join = (href) => {
    if (!basePath) return href;
    return `${basePath}${href}`;
  };
  if (enableRips) return join("RIPS.html");
  if (enableRda) return join("Asignar_RIPS V3.html");
  return join("HistoriasClinicas.html");
}

/**
 * Redirige fuera de páginas prohibidas.
 * @returns {boolean} true si se redirigió (el caller debe abortar)
 */
export function guardPageAccess({ requireRips = false, requireRda = false, basePath = "" } = {}) {
  const { enableRips, enableRda } = getFeatureFlags();
  if (requireRips && !enableRips) {
    window.location.replace(getDefaultLandingHref({ basePath }));
    return true;
  }
  if (requireRda && !enableRda) {
    window.location.replace(getDefaultLandingHref({ basePath }));
    return true;
  }
  if (requireRips === false && requireRda === false) {
    // página "asignar": necesita al menos uno
  }
  return false;
}

/** Oculta UI RIPS/RDA en la página actual según flags. */
export function applyProductUiGates() {
  const { enableRips, enableRda } = getFeatureFlags();

  const hide = (el) => {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("hidden", "hidden");
    el.setAttribute("aria-hidden", "true");
  };

  if (!enableRda) {
    hide(document.getElementById("cardRDA"));
    document.querySelectorAll("[data-feature='rda']").forEach(hide);
  }

  if (!enableRips) {
    hide(document.getElementById("cardHistoriaClinica"));
    hide(document.getElementById("hcRipsFab"));
    hide(document.getElementById("hcRipsPanel"));
    hide(document.getElementById("hcRipsOverlay"));
    document.querySelectorAll("[data-feature='rips']").forEach(hide);
  }

  // Topbar breadcrumbs (si el sidebar no los ocultó)
  document.querySelectorAll("a[href='EnvioRdaPendientes.html'], a[href='visor/visor.html'], a[href*='Corregir_RDA']").forEach((a) => {
    if (!enableRda) hide(a);
  });
  document.querySelectorAll("a[href='RIPS.html'], a[href='EnviarFevRips.html'], a[href='DesrelacionarV2.html']").forEach((a) => {
    if (!enableRips) hide(a);
  });

  return { enableRips, enableRda };
}

export default {
  getFeatureFlags,
  getDefaultLandingHref,
  guardPageAccess,
  applyProductUiGates,
};

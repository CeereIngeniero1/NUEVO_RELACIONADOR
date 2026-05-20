/**
 * API RIPS para Historias Clínicas (JSON) y utilidades compartidas.
 */
(function (global) {
  function apiBase() {
    return typeof getApiBaseUrl === "function" ? getApiBaseUrl() : "";
  }

  async function fetchJson(url, options) {
    const resp = await fetch(url, options);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || data.ok === false) {
      throw new Error(data.message || data.error || `Error ${resp.status}`);
    }
    return data;
  }

  async function consultarRipsEvaluacion(idEvaluacionEntidad) {
    return fetchJson(
      `${apiBase()}/apiV3/historiasClinicas/rips/evaluacion/${encodeURIComponent(idEvaluacionEntidad)}`
    );
  }

  async function registrarRips(body) {
    return fetchJson(`${apiBase()}/apiV3/historiasClinicas/rips/registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function marcarSinRips(idEvaluacionEntidad) {
    return fetchJson(`${apiBase()}/apiV3/historiasClinicas/rips/sin-registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idEvaluacionEntidad }),
    });
  }

  function llenarSelect(el, items, valueKey, textKey, placeholder) {
    if (!el) return;
    el.innerHTML = "";
    const def = document.createElement("option");
    def.value = placeholder?.value ?? "";
    def.textContent = placeholder?.text ?? "Sin Seleccionar";
    el.appendChild(def);
    (items || []).forEach((row) => {
      const opt = document.createElement("option");
      opt.value = row[valueKey];
      opt.textContent = row[textKey];
      el.appendChild(opt);
    });
  }

  async function fetchLista(path) {
    const resp = await fetch(`${apiBase()}${path}`);
    if (!resp.ok) throw new Error(`Error ${resp.status} en ${path}`);
    return resp.json();
  }

  global.RipsApi = {
    fetchJson,
    fetchLista,
    llenarSelect,
    consultarRipsEvaluacion,
    registrarRips,
    marcarSinRips,
  };
})(window);

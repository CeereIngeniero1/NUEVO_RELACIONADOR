/**
 * Empresa de trabajo en sesión (sessionStorage).
 * Debe pedirse tras login en cualquier producto (RIPS y/o RDA).
 */
import { getApiBaseUrl } from "../rda/api/apiBaseUrl.js";

const KEY_DOC = "empresaTrabajarExecuted";
const KEY_NOMBRE = "empresaTrabajarNombre";

export function getDocumentoEmpresaSesion() {
  return String(sessionStorage.getItem(KEY_DOC) || "").trim();
}

export function getNombreEmpresaSesion() {
  return String(sessionStorage.getItem(KEY_NOMBRE) || "").trim();
}

/** true si hay documento de empresa usable (no el bug histórico "true"). */
export function tieneEmpresaSesion() {
  const doc = getDocumentoEmpresaSesion();
  if (!doc) return false;
  const lower = doc.toLowerCase();
  if (lower === "true" || lower === "false") return false;
  return true;
}

export function limpiarEmpresaSesion() {
  sessionStorage.removeItem(KEY_DOC);
  sessionStorage.removeItem(KEY_NOMBRE);
}

export function guardarEmpresaSesion(documento, nombre) {
  const doc = String(documento || "").trim();
  const nom = String(nombre || "").trim();
  if (!doc) return false;
  sessionStorage.setItem(KEY_DOC, doc);
  if (nom) sessionStorage.setItem(KEY_NOMBRE, nom);
  actualizarUiEmpresaSesion();
  return true;
}

export function actualizarUiEmpresaSesion() {
  const nombre = getNombreEmpresaSesion();
  const doc = getDocumentoEmpresaSesion();
  const label = nombre || doc;
  if (!label) return;

  const elTrabajo = document.getElementById("EmpresaDeTrabajo");
  if (elTrabajo) elTrabajo.textContent = label;

  const brand = document.querySelector(".cr-sidebar-app");
  if (brand && brand.dataset) {
    const base = brand.dataset.brandBase || brand.textContent.trim();
    brand.dataset.brandBase = base.replace(/\s+[—-]\s+.+$/, "").trim() || base;
    brand.textContent = `${brand.dataset.brandBase} — ${label}`;
  }
}

function dedupeEmpresas(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const doc = String(row.DocumentoEmpresa || row.documentoEmpresa || "").trim();
    if (!doc || map.has(doc)) continue;
    const nombre = String(
      row.NombreComercialEmpresa || row.nombreComercialEmpresa || doc
    ).trim();
    map.set(doc, { DocumentoEmpresa: doc, NombreComercialEmpresa: nombre });
  }
  return [...map.values()];
}

let _promptEnCurso = null;

/**
 * Si no hay empresa en sesión (o force), muestra el selector y espera confirmación.
 * Llamadas concurrentes comparten el mismo diálogo.
 * @returns {Promise<string|null>} documento empresa o null
 */
export async function asegurarEmpresaSesion({ force = false } = {}) {
  if (!force && tieneEmpresaSesion()) {
    actualizarUiEmpresaSesion();
    return getDocumentoEmpresaSesion();
  }

  if (_promptEnCurso) return _promptEnCurso;

  _promptEnCurso = (async () => {
    try {
      if (typeof Swal === "undefined") {
        console.warn("[empresaSesion] SweetAlert2 no está cargado; no se puede pedir empresa.");
        return null;
      }

      let empresas = [];
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/XMLS/mostrar-empresas-con-resoluciones-vigentes`
        );
        if (!response.ok) {
          const raw = await response.text();
          let detail = `HTTP ${response.status}`;
          try {
            const body = JSON.parse(raw);
            if (body && body.message) detail = String(body.message);
          } catch (_) {
            if (raw) detail = raw.slice(0, 200);
          }
          throw new Error(detail);
        }
        const rawOk = await response.text();
        empresas = dedupeEmpresas(JSON.parse(rawOk || "[]"));
      } catch (err) {
        console.error("[empresaSesion] Error listando empresas:", err);
        await Swal.fire({
          icon: "error",
          title: "No se pudieron cargar las empresas",
          text: err.message || String(err),
        });
        return null;
      }

      if (empresas.length === 0) {
        await Swal.fire({
          icon: "warning",
          title: "Sin empresas",
          text: "No hay empresas con resolución vigente para seleccionar.",
        });
        return null;
      }

      // Re-check por si otra pestaña/flujo guardó mientras cargábamos
      if (!force && tieneEmpresaSesion()) {
        actualizarUiEmpresaSesion();
        return getDocumentoEmpresaSesion();
      }

      const result = await Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        icon: "question",
        title: "¿En qué empresa desea trabajar?",
        html: `<select id="EmpresaATrabajar" class="swal2-input"></select>`,
        confirmButtonText: "IR",
        didOpen: () => {
          const select = document.getElementById("EmpresaATrabajar");
          if (!select) return;
          const def = document.createElement("option");
          def.value = "";
          def.textContent = "Seleccione una empresa";
          select.appendChild(def);
          empresas.forEach((empresa) => {
            const option = document.createElement("option");
            option.value = empresa.DocumentoEmpresa;
            option.textContent = empresa.NombreComercialEmpresa;
            select.appendChild(option);
          });
        },
        preConfirm: () => {
          const select = document.getElementById("EmpresaATrabajar");
          const value = select ? select.value : "";
          if (!value) {
            Swal.showValidationMessage("Debe seleccionar una empresa");
            return false;
          }
          const nombre = select.options[select.selectedIndex]?.text || value;
          return { documento: value, nombre };
        },
      });

      if (!result.isConfirmed || !result.value) return null;

      const { documento, nombre } = result.value;
      guardarEmpresaSesion(documento, nombre);
      return documento;
    } finally {
      _promptEnCurso = null;
    }
  })();

  return _promptEnCurso;
}

export default asegurarEmpresaSesion;

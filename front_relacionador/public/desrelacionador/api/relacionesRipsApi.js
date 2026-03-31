/**
 * Llamadas HTTP al backend apiV3 para listar / eliminar vínculos RIPS.
 */

import { getApiV3BaseUrl } from "../config.js";

/**
 * @returns {Promise<{ ok: boolean, items?: object[], error?: string }>}
 */
export async function fetchRelacionesRips({
  documentoPaciente,
  documentoUsuario,
  fechaInicio,
  fechaFin,
}) {
  const base = getApiV3BaseUrl();
  const url = `${base}/relacionesRipsDesrelacionador/${encodeURIComponent(documentoPaciente)}/${encodeURIComponent(documentoUsuario)}/${encodeURIComponent(fechaInicio)}/${encodeURIComponent(fechaFin)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `HTTP ${res.status} ${res.statusText}`,
    };
  }
  return { ok: true, items: data.items || [] };
}

/**
 * Pacientes con relaciones RIPS en el rango (para buscar por fechas).
 * @returns {Promise<{ ok: boolean, items?: { documentoPaciente: string, nombrePaciente?: string }[], error?: string }>}
 */
export async function fetchPacientesConRelaciones({ documentoUsuario, fechaInicio, fechaFin }) {
  const base = getApiV3BaseUrl();
  const url = `${base}/relacionesRipsDesrelacionador/pacientes/${encodeURIComponent(documentoUsuario)}/${encodeURIComponent(fechaInicio)}/${encodeURIComponent(fechaFin)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `HTTP ${res.status} ${res.statusText}`,
    };
  }
  return { ok: true, items: data.items || [] };
}

/**
 * @returns {Promise<{ ok: boolean, message?: string, error?: string }>}
 */
export async function deleteRelacionRips({ idRipsRelacion, origenTabla, documentoPaciente }) {
  const base = getApiV3BaseUrl();
  const res = await fetch(`${base}/relacionesRipsDesrelacionador`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idRipsRelacion,
      documentoPaciente,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `HTTP ${res.status} ${res.statusText}`,
    };
  }
  return { ok: true, message: data.message || "RIPS desrelacionado." };
}

/**
 * Quita el vínculo de factura/plan sin borrar el registro RIPS.
 * @returns {Promise<{ ok: boolean, message?: string, error?: string }>}
 */
export async function unlinkFacturaRelacionRips({ idRipsRelacion, origenTabla, documentoPaciente }) {
  const base = getApiV3BaseUrl();
  const url = `${base}/relacionesRipsDesrelacionador/factura`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idRipsRelacion,
      documentoPaciente,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `HTTP ${res.status} ${res.statusText} (${url})`,
    };
  }
  return { ok: true, message: data.message || "Factura desrelacionada." };
}

/**
 * Filas de [Cnsta Relacionador Usuarios Info] para un documento paciente.
 * @returns {Promise<object[]>}
 */
export async function fetchPacientePorDocumento(documento) {
  const base = getApiV3BaseUrl();
  const res = await fetch(
    `${base}/DatosdeUsuarioHC/${encodeURIComponent(documento)}`
  );
  if (!res.ok) return [];
  return res.json();
}

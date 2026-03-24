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
    return { ok: false, error: data.error || res.statusText };
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
      origenTabla,
      documentoPaciente,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || res.statusText };
  }
  return { ok: true, message: data.message || "RIPS desrelacionado." };
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

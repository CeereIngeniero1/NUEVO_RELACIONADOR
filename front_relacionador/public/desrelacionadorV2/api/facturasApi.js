/**
 * Desrelacionar factura de un RIPS (PATCH).
 * Particular: solo Id Factura → 0
 * Prepagada/EPS: Id Factura + Id Plan → 0
 */

import { getApiV3BaseUrl } from "../config.js";

export async function fetchFacturasEnviadas({ documentoEmpresa, fechaInicio, fechaFin }) {
  const base = getApiV3BaseUrl();
  const url = `${base}/relacionesRipsDesrelacionador/v2/facturas/${encodeURIComponent(documentoEmpresa)}/${encodeURIComponent(fechaInicio)}/${encodeURIComponent(fechaFin)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || `HTTP ${res.status}` };
  }
  return { ok: true, items: data.items || [] };
}

export async function fetchDetalleFactura(idFactura) {
  const base = getApiV3BaseUrl();
  const url = `${base}/relacionesRipsDesrelacionador/v2/factura/${encodeURIComponent(idFactura)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || `HTTP ${res.status}` };
  }
  return { ok: true, ...data };
}

/**
 * @param {{ idRipsRelacion: number, documentoPaciente: string, limpiarPlan: boolean }} args
 */
export async function desrelacionarFacturaRips({ idRipsRelacion, documentoPaciente, limpiarPlan }) {
  const base = getApiV3BaseUrl();
  const res = await fetch(`${base}/relacionesRipsDesrelacionador/factura`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idRipsRelacion,
      documentoPaciente,
      limpiarPlan: !!limpiarPlan,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || `HTTP ${res.status}` };
  }
  return { ok: true, message: data.message || "Desrelacionado." };
}

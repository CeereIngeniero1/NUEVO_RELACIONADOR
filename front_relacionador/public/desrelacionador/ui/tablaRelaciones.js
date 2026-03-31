/**
 * Tabla de relaciones RIPS y acción desrelacionar.
 */

import { deleteRelacionRips, unlinkFacturaRelacionRips } from "../api/relacionesRipsApi.js";
import { escapeHtml, formatCOP, formatFechaEval } from "../utils/format.js";

function badgeFactura(tipo, etiqueta) {
  if (tipo === "sin" || !etiqueta) {
    return `<span class="text-muted">Sin factura</span>`;
  }
  const cls =
    tipo === "eps"
      ? "cr-des-badge cr-des-badge-eps"
      : "cr-des-badge cr-des-badge-fev";
  return `<span class="${cls}">${escapeHtml(etiqueta)}</span>`;
}

/**
 * @param {object[]} items
 * @param {{ getDocumentoPaciente: () => string, onRefrescar: () => Promise<void> }} deps
 */
export function renderTablaRelaciones(items, deps) {
  const tbody = document.getElementById("tablaRelacionesBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!items.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center py-4 cr-des-tabla-placeholder">No hay relaciones RIPS en el rango seleccionado.</td></tr>';
    return;
  }

  items.forEach((row) => {
    const tr = document.createElement("tr");
    const idEvalTxt = `${row.prefijoEvalDisplay}-${row.idEvaluacion}`;
    const tieneFactura = row.facturaTipo && row.facturaTipo !== "sin";
    tr.innerHTML = `
      <td class="font-monospace">${row.idRipsRelacion}</td>
      <td class="font-monospace fw-semibold">${escapeHtml(idEvalTxt)}</td>
      <td>${escapeHtml(formatFechaEval(row.fechaEvaluacion))}</td>
      <td class="small">${escapeHtml(row.cupsCie || "—")}</td>
      <td>${badgeFactura(row.facturaTipo, row.facturaEtiqueta)}</td>
      <td class="text-end">${formatCOP(row.valorReportado)}</td>
      <td>
        <div class="d-flex flex-column gap-1 align-items-start">
          <button type="button" class="btn btn-sm btn-outline-danger cr-des-btn-unlink" title="Eliminar relación RIPS (volver a pendientes)"
            data-id="${row.idRipsRelacion}"
            data-eval="${row.idEvaluacion}">
            <i class="ri-link-unlink-m"></i> Eliminar relación
          </button>
          ${
            tieneFactura
              ? `<button type="button" class="btn btn-sm btn-outline-warning cr-des-btn-unlink-factura" title="Quitar factura/plan (conservar relación)"
                  data-id="${row.idRipsRelacion}"
                  >
                  <i class="ri-receipt-line"></i> Quitar factura/plan
                </button>`
              : ""
          }
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".cr-des-btn-unlink").forEach((btn) => {
    btn.addEventListener("click", () => onDesrelacionarClick(btn, deps));
  });
  tbody.querySelectorAll(".cr-des-btn-unlink-factura").forEach((btn) => {
    btn.addEventListener("click", () => onQuitarFacturaClick(btn, deps));
  });
}

async function onDesrelacionarClick(btn, deps) {
  const idRipsRelacion = parseInt(btn.getAttribute("data-id"), 10);
  const doc = deps.getDocumentoPaciente().trim();

  const r = await Swal.fire({
    icon: "warning",
    title: "¿Eliminar la relación RIPS de esta historia?",
    html: `Se eliminará la relación del RIPS <strong>${idRipsRelacion}</strong> con la historia clínica. La historia volverá a <strong>pendientes</strong> en <strong>Asignar RIPS</strong>.`,
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar relación",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc3545",
  });

  if (!r.isConfirmed) return;

  try {
    Swal.fire({ title: "Procesando…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const result = await deleteRelacionRips({
      idRipsRelacion,
      documentoPaciente: doc,
    });
    Swal.close();

    if (!result.ok) {
      throw new Error(result.error || "Error");
    }
    await Swal.fire({ icon: "success", title: "Listo", text: result.message || "Relación eliminada correctamente." });
    await deps.onRefrescar();
  } catch (e) {
    Swal.close();
    Swal.fire({ icon: "error", title: "No se pudo eliminar la relación", text: String(e.message || e) });
  }
}

async function onQuitarFacturaClick(btn, deps) {
  const idRipsRelacion = parseInt(btn.getAttribute("data-id"), 10);
  const doc = deps.getDocumentoPaciente().trim();

  const r = await Swal.fire({
    icon: "warning",
    title: "¿Quitar factura/plan de este RIPS?",
    html: `Se eliminará la asociación de <strong>factura/plan</strong> del RIPS <strong>${idRipsRelacion}</strong>, pero <strong>se conservará</strong> la relación con la historia clínica.`,
    showCancelButton: true,
    confirmButtonText: "Sí, quitar factura/plan",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#f0ad4e",
  });

  if (!r.isConfirmed) return;

  try {
    Swal.fire({ title: "Procesando…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const result = await unlinkFacturaRelacionRips({
      idRipsRelacion,
      documentoPaciente: doc,
    });
    Swal.close();

    if (!result.ok) {
      throw new Error(result.error || "Error");
    }
    await Swal.fire({ icon: "success", title: "Listo", text: result.message || "Factura/plan quitados correctamente." });
    await deps.onRefrescar();
  } catch (e) {
    Swal.close();
    Swal.fire({ icon: "error", title: "No se pudo quitar la factura/plan", text: String(e.message || e) });
  }
}

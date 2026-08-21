/**
 * Tabla de facturas ENVIADAS (V2).
 */

import { escapeHtml, formatCOP, formatFecha } from "../utils/format.js";

function badgeIndicador(ind) {
  if (ind === "sinRips") {
    return `<span class="cr-des-badge" style="background:#fde8e8;color:#b00020;">Sin RIPS</span>`;
  }
  if (ind === "revisar") {
    return `<span class="cr-des-badge" style="background:#fff3cd;color:#856404;">Revisar</span>`;
  }
  return `<span class="cr-des-badge cr-des-badge-fev">OK</span>`;
}

/**
 * @param {object[]} items
 * @param {{ onSelect: (idFactura: number) => void }} deps
 */
export function renderTablaFacturas(items, deps) {
  const tbody = document.getElementById("tablaFacturasV2Body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!items.length) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center py-4 cr-des-tabla-placeholder">No hay facturas enviadas en el rango.</td></tr>';
    return;
  }

  items.forEach((row) => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.title = "Ver detalle RIPS / tratamientos";
    const noFull = `${escapeHtml(row.prefijo || "")}${escapeHtml(row.noFactura || "")}`;
    tr.innerHTML = `
      <td class="font-monospace">${row.idFactura}</td>
      <td class="font-monospace fw-semibold">${noFull || "—"}</td>
      <td>${escapeHtml(formatFecha(row.fechaFactura))}</td>
      <td class="small">${escapeHtml(row.tipoFactura || "—")}</td>
      <td class="small text-truncate" style="max-width:180px;" title="${escapeHtml(row.nombrePaciente)}">${escapeHtml(row.nombrePaciente || "—")}</td>
      <td class="text-center">${row.cantidadRips}</td>
      <td class="text-end">${formatCOP(row.totalFactura)}</td>
      <td>${badgeIndicador(row.indicador)}</td>
    `;
    tr.addEventListener("click", () => deps.onSelect(Number(row.idFactura)));
    tbody.appendChild(tr);
  });
}

/**
 * Detalle factura / RIPS en modal emergente (SweetAlert).
 */

import { desrelacionarFacturaRips } from "../api/facturasApi.js";
import { escapeHtml, formatCOP, formatFecha } from "../utils/format.js";

const COLUMNAS = [
  { key: "nombrePaciente", label: "Paciente", type: "text" },
  { key: "documentoPaciente", label: "Documento", type: "text" },
  { key: "idPlanTratamiento", label: "Id trat.", type: "num" },
  { key: "idRipsRelacion", label: "Id RIPS", type: "num" },
  { key: "idEvaluacion", label: "Id eval.", type: "num" },
  { key: "fechaEvaluacion", label: "Fecha HC", type: "fecha" },
  { key: "cupsCie", label: "CUPS/CIE", type: "text" },
];

function parseFechaSort(raw) {
  const s = String(raw || "").trim();
  if (!s) return 0;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

function valorSort(row, key) {
  if (key === "idRipsRelacion") {
    return row.tieneRips && row.idRipsRelacion ? Number(row.idRipsRelacion) : -1;
  }
  if (key === "idPlanTratamiento" || key === "idEvaluacion") {
    return Number(row[key] || 0);
  }
  if (key === "fechaEvaluacion") return parseFechaSort(row.fechaEvaluacion);
  return String(row[key] ?? "");
}

/**
 * @param {object} data
 * @param {{ onRefrescar: () => Promise<void> }} deps
 */
export async function mostrarDetalleFacturaModal(data, deps) {
  const f = data.factura || {};
  const filas = Array.isArray(data.filas) ? [...data.filas] : [];
  const esEps = !!f.esEps;
  const limpiarPlan = !!f.limpiarPlan;
  let sortKey = "idPlanTratamiento";
  let sortAsc = false; // por defecto Id trat. DESC

  const modoTxt = limpiarPlan
    ? "Se pondrán en 0 el <b>Id Factura</b> y el <b>Id Plan de Tratamiento</b>."
    : "Se pondrá en 0 solo el <b>Id Factura</b> (Particular).";

  let avisoHtml = "";
  if (esEps && filas.some((r) => r.tratamientoDuplicado)) {
    avisoHtml = `<div class="alert alert-warning py-2 px-3 mb-2 text-start" style="font-size:0.85rem;">
      <strong>Atención (EPS):</strong> hay Id tratamiento repetidos. Cada tratamiento debe tener un solo RIPS.
    </div>`;
  } else if (f.cantidadRips === 0) {
    avisoHtml = `<div class="alert alert-secondary py-2 px-3 mb-2 text-start" style="font-size:0.85rem;">
      Esta factura <strong>no tiene RIPS</strong> relacionados.
    </div>`;
  }

  const metaHtml = `
    <div class="d-flex flex-wrap gap-3 align-items-baseline justify-content-center mb-2" style="font-size:0.9rem;">
      <div><span class="text-muted small">Id factura</span><div class="font-monospace fw-bold">${f.idFactura}</div></div>
      <div><span class="text-muted small">No.</span><div class="fw-semibold">${escapeHtml(f.prefijo || "")}${escapeHtml(f.noFactura || "")}</div></div>
      <div><span class="text-muted small">Fecha</span><div>${escapeHtml(formatFecha(f.fechaFactura))}</div></div>
      <div><span class="text-muted small">Tipo</span><div>${escapeHtml(f.tipoFactura || "—")}</div></div>
      <div><span class="text-muted small">Total</span><div>${formatCOP(f.totalFactura)}</div></div>
      <div><span class="text-muted small">RIPS</span><div class="fw-bold">${f.cantidadRips ?? 0}</div></div>
      ${esEps ? `<div><span class="text-muted small">Tratamientos</span><div class="fw-bold">${f.cantidadTratamientos ?? 0}</div></div>` : ""}
    </div>
    <p class="small text-muted mb-2">${modoTxt}</p>
    <p class="small text-muted mb-2">Clic en una columna para ordenar (asc / desc).</p>
    ${avisoHtml}
  `;

  function aplicarOrden() {
    const col = COLUMNAS.find((c) => c.key === sortKey) || COLUMNAS[2];
    const dir = sortAsc ? 1 : -1;
    filas.sort((a, b) => {
      const av = valorSort(a, col.key);
      const bv = valorSort(b, col.key);
      let cmp = 0;
      if (col.type === "num" || col.type === "fecha") {
        cmp = Number(av) - Number(bv);
      } else {
        cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return cmp * dir;
    });
  }

  function thHtml(col) {
    const active = sortKey === col.key;
    const flecha = active ? (sortAsc ? " ▲" : " ▼") : "";
    const weight = active ? "700" : "600";
    return `<th data-des-v2-sort="${col.key}" title="Ordenar por ${col.label}"
      style="cursor:pointer;user-select:none;white-space:nowrap;font-weight:${weight};">
      ${col.label}${flecha}
    </th>`;
  }

  function rowsHtml() {
    if (!filas.length) {
      return `<tr><td colspan="8" class="text-center py-3 text-muted">Sin RIPS para mostrar.</td></tr>`;
    }
    return filas
      .map((row) => {
        const dup = esEps && row.tratamientoDuplicado;
        const tieneRips = !!(row.tieneRips && row.idRipsRelacion);
        const idRipsTxt = tieneRips ? String(row.idRipsRelacion) : "NO TIENE";
        const idEvalTxt = row.idEvaluacion ? `HC-${row.idEvaluacion}` : "—";
        const trStyle = dup ? ' class="cr-des-v2-dup"' : "";
        const planCls = dup ? "text-danger fw-bold" : "fw-semibold";
        return `
        <tr${trStyle}>
          <td class="small text-start">${escapeHtml(row.nombrePaciente || "—")}</td>
          <td class="font-monospace small">${escapeHtml(row.documentoPaciente || "—")}</td>
          <td class="font-monospace ${planCls}">${row.idPlanTratamiento || "—"}</td>
          <td class="font-monospace">${escapeHtml(idRipsTxt)}</td>
          <td class="font-monospace small">${escapeHtml(idEvalTxt)}</td>
          <td class="small">${escapeHtml(formatFecha(row.fechaEvaluacion))}</td>
          <td class="small text-start">${escapeHtml(row.cupsCie || "—")}</td>
          <td>
            ${
              tieneRips
                ? `<button type="button" class="btn btn-sm btn-warning cr-des-v2-desrel"
                    data-id="${row.idRipsRelacion}"
                    data-doc="${escapeHtml(row.documentoPaciente || "")}"
                    data-limpiar-plan="${limpiarPlan ? "1" : "0"}">
                    <i class="ri-link-unlink"></i> Desrelacionar
                  </button>`
                : `<span class="text-muted small">Sin RIPS</span>`
            }
          </td>
        </tr>`;
      })
      .join("");
  }

  function tableHtml() {
    return `
    <div style="overflow:auto;max-height:min(50vh,420px);">
      <table class="table table-sm table-hover mb-0 align-middle" style="font-size:0.8rem;">
        <thead>
          <tr>
            ${COLUMNAS.map(thHtml).join("")}
            <th>Acción</th>
          </tr>
        </thead>
        <tbody id="desV2DetalleBody">${rowsHtml()}</tbody>
      </table>
    </div>`;
  }

  function wireTable(container) {
    if (!container) return;
    container.querySelectorAll(".cr-des-v2-desrel").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await onDesrelacionar(btn, deps);
      });
    });
    container.querySelectorAll("[data-des-v2-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-des-v2-sort");
        if (sortKey === key) {
          sortAsc = !sortAsc;
        } else {
          sortKey = key;
          sortAsc = true;
        }
        aplicarOrden();
        refreshTable();
      });
    });
  }

  function refreshTable() {
    const container = Swal.getHtmlContainer();
    if (!container) return;
    container.innerHTML = metaHtml + tableHtml();
    wireTable(container);
  }

  aplicarOrden();

  const result = await Swal.fire({
    title: "Detalle factura / RIPS",
    html: metaHtml + tableHtml(),
    width: "96%",
    showConfirmButton: true,
    confirmButtonText: "Cerrar",
    allowOutsideClick: true,
    allowEscapeKey: true,
    didOpen: () => wireTable(Swal.getHtmlContainer()),
  });

  return result;
}

export function hideDetalleFactura() {
  if (Swal.isVisible()) Swal.close();
}

async function onDesrelacionar(btn, deps) {
  const idRipsRelacion = parseInt(btn.getAttribute("data-id"), 10);
  const documentoPaciente = String(btn.getAttribute("data-doc") || "").trim();
  const limpiarPlan = btn.getAttribute("data-limpiar-plan") === "1";

  if (!idRipsRelacion || !documentoPaciente) {
    await Swal.fire({
      icon: "error",
      title: "Datos incompletos",
      text: "Falta Id RIPS o documento paciente.",
    });
    return;
  }

  const detalleHtml = limpiarPlan
    ? `Se pondrán en <b>0</b> el <b>Id Factura</b> y el <b>Id Plan de Tratamiento</b> del RIPS <strong>${idRipsRelacion}</strong> (Prepagada/EPS).`
    : `Se pondrá en <b>0</b> el <b>Id Factura</b> del RIPS <strong>${idRipsRelacion}</strong> (Particular).`;

  const conf = await Swal.fire({
    icon: "warning",
    title: "¿Desrelacionar factura?",
    html: detalleHtml,
    showCancelButton: true,
    confirmButtonText: "Sí, desrelacionar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#f0ad4e",
  });
  if (!conf.isConfirmed) return;

  try {
    Swal.fire({ title: "Procesando…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const result = await desrelacionarFacturaRips({
      idRipsRelacion,
      documentoPaciente,
      limpiarPlan,
    });
    Swal.close();
    if (!result.ok) throw new Error(result.error || "Error");
    await Swal.fire({ icon: "success", title: "Listo", text: result.message });
    await deps.onRefrescar();
  } catch (e) {
    Swal.close();
    await Swal.fire({ icon: "error", title: "Error", text: String(e.message || e) });
  }
}

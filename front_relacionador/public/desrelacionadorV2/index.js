/**
 * Desrelacionador RIPS V2 — entrada.
 */

import { fetchDetalleFactura, fetchFacturasEnviadas } from "./api/facturasApi.js";
import { mountAppSidebar } from "../shared/appSidebar.js";
import { hideDetalleFactura, mostrarDetalleFacturaModal } from "./ui/detalleFactura.js";
import { ensureAuth } from "./ui/shell.js";
import { renderTablaFacturas } from "./ui/tablaFacturas.js";

let ultimaIdFactura = null;

function getDocumentoEmpresa() {
  return (
    sessionStorage.getItem("empresaTrabajarExecuted") ||
    (typeof window.documentoEmpresaSeleccionada !== "undefined"
      ? window.documentoEmpresaSeleccionada
      : "") ||
    ""
  );
}

async function buscarFacturas({ preserveDetalle = false } = {}) {
  const fi = document.getElementById("fechaInicioV2")?.value;
  const ff = document.getElementById("fechaFinV2")?.value;
  const docEmp = String(getDocumentoEmpresa() || "").trim();

  if (!fi || !ff) {
    Swal.fire({ icon: "warning", title: "Fechas requeridas", text: "Seleccione fecha inicio y fin." });
    return;
  }
  if (!docEmp) {
    Swal.fire({
      icon: "error",
      title: "Empresa",
      text: "No hay empresa de trabajo en sesión. Vuelva a Inicio y seleccione empresa.",
    });
    return;
  }

  if (!preserveDetalle) {
    hideDetalleFactura();
    ultimaIdFactura = null;
  }

  try {
    if (!preserveDetalle) {
      Swal.fire({ title: "Buscando facturas…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    }
    const r = await fetchFacturasEnviadas({
      documentoEmpresa: docEmp,
      fechaInicio: fi,
      fechaFin: ff,
    });
    if (!preserveDetalle) Swal.close();
    if (!r.ok) throw new Error(r.error || "Error al buscar");

    renderTablaFacturas(r.items || [], {
      onSelect: (idFactura) => abrirDetalle(idFactura),
    });
  } catch (e) {
    if (!preserveDetalle) Swal.close();
    Swal.fire({ icon: "error", title: "Error", text: String(e.message || e) });
  }
}

async function abrirDetalle(idFactura) {
  ultimaIdFactura = idFactura;
  try {
    Swal.fire({ title: "Cargando detalle…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const r = await fetchDetalleFactura(idFactura);
    Swal.close();
    if (!r.ok) throw new Error(r.error || "Error al cargar detalle");

    await mostrarDetalleFacturaModal(r, {
      onRefrescar: async () => {
        const id = ultimaIdFactura;
        await buscarFacturas({ preserveDetalle: true });
        if (id) await abrirDetalle(id);
      },
    });
  } catch (e) {
    Swal.close();
    Swal.fire({ icon: "error", title: "Error", text: String(e.message || e) });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (localStorage.getItem("ceere_theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  mountAppSidebar({ active: "desrelacionar" });
  await ensureAuth();

  document.getElementById("btnBuscarFacturasV2")?.addEventListener("click", () => buscarFacturas());
  document.getElementById("desV2RegresarInicio")?.addEventListener("click", () => {
    window.location.href = "RIPS.html";
  });
});

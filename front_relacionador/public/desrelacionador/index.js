/**
 * Desrelacionador RIPS — punto de entrada ES module.
 * Carga: <script type="module" src="desrelacionador/index.js"></script>
 */

import { fetchRelacionesRips } from "./api/relacionesRipsApi.js";
import { getUltimasRelaciones, setUltimasRelaciones } from "./state.js";
import { initNombrePacienteResolver } from "./ui/filtrosPaciente.js";
import { ensureAuth, initThemeToggle } from "./ui/shell.js";
import { renderTablaRelaciones } from "./ui/tablaRelaciones.js";

function getDocumentoPaciente() {
  const el = document.getElementById("inputDocumentoPaciente");
  return el ? el.value : "";
}

async function buscarRelaciones() {
  const doc = getDocumentoPaciente().trim();
  const fi = document.getElementById("fechaInicio")?.value;
  const ff = document.getElementById("fechaFin")?.value;
  const docUsr = sessionStorage.getItem("documentousuariologeado") || "";

  if (!doc) {
    Swal.fire({ icon: "warning", title: "Documento requerido", text: "Ingrese el documento del paciente." });
    return;
  }
  if (!fi || !ff) {
    Swal.fire({ icon: "warning", title: "Fechas requeridas", text: "Seleccione fecha inicio y fin." });
    return;
  }
  if (!docUsr) {
    Swal.fire({
      icon: "error",
      title: "Sesión",
      text: "No se encontró el documento del usuario. Vuelva a iniciar sesión.",
    });
    return;
  }

  try {
    Swal.fire({ title: "Buscando…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const { ok, items, error } = await fetchRelacionesRips({
      documentoPaciente: doc,
      documentoUsuario: docUsr,
      fechaInicio: fi,
      fechaFin: ff,
    });
    Swal.close();

    if (!ok) {
      throw new Error(error || "Error al buscar");
    }
    const list = items || [];
    setUltimasRelaciones(list);
    renderTablaRelaciones(list, {
      getDocumentoPaciente,
      onRefrescar: buscarRelaciones,
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
  initThemeToggle();
  await ensureAuth();

  initNombrePacienteResolver();

  document.getElementById("desRegresarInicio")?.addEventListener("click", () => {
    window.location.href = "RIPS.html";
  });

  const btn = document.getElementById("btnBuscarRelaciones");
  if (btn) btn.addEventListener("click", buscarRelaciones);
});

window.DesrelacionadorRips = {
  buscarRelaciones,
  getUltimasRelaciones,
};

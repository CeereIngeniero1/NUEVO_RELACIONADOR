/**
 * Desrelacionador RIPS — punto de entrada ES module.
 * Carga: <script type="module" src="desrelacionador/index.js"></script>
 */

import { fetchPacientesConRelaciones, fetchRelacionesRips } from "./api/relacionesRipsApi.js";
import { getUltimasRelaciones, setUltimasRelaciones } from "./state.js";
import { initNombrePacienteResolver } from "./ui/filtrosPaciente.js";
import { ensureAuth, initThemeToggle } from "./ui/shell.js";
import { renderTablaRelaciones } from "./ui/tablaRelaciones.js";

function getDocumentoPaciente() {
  const el = document.getElementById("inputDocumentoPaciente");
  return el ? el.value : "";
}

function hidePacientesResultados() {
  const wrap = document.getElementById("pacientesResultadosWrapper");
  const list = document.getElementById("pacientesResultados");
  if (list) list.innerHTML = "";
  if (wrap) wrap.classList.add("d-none");
}

function showPacientesResultados(items, { onSelect } = {}) {
  const wrap = document.getElementById("pacientesResultadosWrapper");
  const list = document.getElementById("pacientesResultados");
  if (!wrap || !list) return;

  list.innerHTML = "";
  wrap.classList.remove("d-none");

  if (!items || !items.length) {
    list.innerHTML =
      '<div class="list-group-item text-muted">No se encontraron pacientes en el rango seleccionado.</div>';
    return;
  }

  items.forEach((it) => {
    const doc = String(it.documentoPaciente || "").trim();
    if (!doc) return;
    const nombre = String(it.nombrePaciente || "").trim();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "list-group-item list-group-item-action";
    btn.innerHTML = `
      <div class="d-flex w-100 justify-content-between align-items-center gap-2">
        <div class="fw-semibold font-monospace">${doc}</div>
        <div class="small text-muted text-truncate flex-grow-1">${nombre || "—"}</div>
        <span class="badge bg-secondary">Cargar</span>
      </div>
    `;
    btn.addEventListener("click", () => onSelect && onSelect({ documentoPaciente: doc, nombrePaciente: nombre }));
    list.appendChild(btn);
  });
}

async function buscarRelaciones() {
  const doc = getDocumentoPaciente().trim();
  const fi = document.getElementById("fechaInicio")?.value;
  const ff = document.getElementById("fechaFin")?.value;
  const docUsr = sessionStorage.getItem("documentousuariologeado") || "";

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

  // Si no hay documento, ofrecer búsqueda por fechas (lista de pacientes con relaciones en el rango)
  if (!doc) {
    try {
      const r = await fetchPacientesConRelaciones({ documentoUsuario: docUsr, fechaInicio: fi, fechaFin: ff });
      if (!r.ok) throw new Error(r.error || "Error al buscar pacientes");

      const items = r.items || [];
      showPacientesResultados(items, {
        onSelect: ({ documentoPaciente }) => {
          const input = document.getElementById("inputDocumentoPaciente");
          if (input) {
            input.value = documentoPaciente;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
          hidePacientesResultados();
          buscarRelaciones();
        },
      });
      return;
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: String(e.message || e) });
      return;
    }
  } else {
    hidePacientesResultados();
  }

  try {
    Swal.fire({ title: "Buscando…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const { ok, items, error } = await fetchRelacionesRips({
      documentoPaciente: getDocumentoPaciente().trim(),
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

  document.getElementById("inputDocumentoPaciente")?.addEventListener("input", () => {
    if (getDocumentoPaciente().trim()) hidePacientesResultados();
  });

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

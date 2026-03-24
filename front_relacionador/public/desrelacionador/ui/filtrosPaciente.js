/**
 * Documento paciente → nombre (blur/change).
 */

import { fetchPacientePorDocumento } from "../api/relacionesRipsApi.js";

export function initNombrePacienteResolver() {
  const input = document.getElementById("inputDocumentoPaciente");
  if (!input) return;

  const resolver = async () => {
    const doc = input.value.trim();
    const nombreEl = document.getElementById("nombrePacienteDisplay");
    if (!nombreEl) return;
    nombreEl.textContent = "";
    nombreEl.classList.remove("text-danger");
    if (!doc) {
      nombreEl.textContent = "";
      return;
    }

    try {
      const rows = await fetchPacientePorDocumento(doc);
      if (!rows || !rows.length) {
        nombreEl.textContent = "Paciente no encontrado";
        nombreEl.classList.add("text-danger");
        return;
      }
      const r = rows[0];
      const nombre =
        r.NombreCompletoPaciente ||
        [r.PrimerNombreBase, r.SegundoNombreBase, r.PrimerApellidoBase, r.SegundoApellidoBase]
          .filter(Boolean)
          .join(" ")
          .trim();
      nombreEl.textContent = nombre || "—";
    } catch (e) {
      console.error(e);
      nombreEl.textContent = "Error al consultar paciente";
      nombreEl.classList.add("text-danger");
    }
  };

  input.addEventListener("blur", resolver);
  input.addEventListener("change", resolver);
}

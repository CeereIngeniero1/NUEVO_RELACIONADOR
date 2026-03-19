/**
 * ==========================================================================
 * RDA V3 — Resumen Digital de Atención (Resolución 1888)
 * ==========================================================================
 * Punto de entrada ES module.
 * Importa todos los sub-módulos, los inicializa y expone window.RDA
 * como API pública para el resto de la aplicación.
 *
 * Carga: <script type="module" src="rda/index.js"></script>
 * ==========================================================================
 */

import * as stateModule from "./state.js";

const {
    getAntecedentes,
    getAntecedentesFamiliares,
    getMedicamentos,
    getDiagRelacionados,
    getPrescripcionMedicamentos,
    getPrescripcionProcedimientos,
    getOtrasTecnologias,
} = stateModule;

import { initBiometria } from "./ui/biometria.js";
import { initControlRda } from "./ui/controlRda.js";
import { initListasPaciente } from "./ui/listasPaciente.js";
import { initListasConsultaExterna } from "./ui/listasConsultaExterna.js";
import { buildRda1888 } from "./json/build1888.js";

// ── Inicialización (el script se carga al final del body, DOM ya existe) ──
initBiometria();
initControlRda();
initListasPaciente();
initListasConsultaExterna();

console.log(
    "%c[RDA V3] Módulo cargado correctamente",
    "color: #4CAF50; font-weight: bold; font-size: 14px;"
);

function buildPacienteBundle(formValues) {
    return buildRda1888({
        tipoRda: "paciente",
        state: stateModule,
        formValues: formValues || {},
    });
}

// ── API pública (contrato con el resto de la aplicación) ──────────────────
window.RDA = {
    getAntecedentes,
    getAntecedentesFamiliares,
    getMedicamentos,
    getDiagRelacionados,
    getPrescripcionMedicamentos,
    getPrescripcionProcedimientos,
    getOtrasTecnologias,
    buildPacienteBundle,
};

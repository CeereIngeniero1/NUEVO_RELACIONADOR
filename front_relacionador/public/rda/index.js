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
    getAntecedentesCE,
    getAntecedentesFamiliaresCE,
    getMedicamentosCE,
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
import { inicializarSelectsRDA } from "./api/selectsRda.js";
import { initAsignarRdaWireup } from "./bootstrap/initAsignarWireup.js";
import { getRdaApiVersion, isRdaV2 } from "./api/rdaConfig.js";
import { initIhceAsignarWindow } from "./asignar/ihceAsignar.js";
import { wireRdaFechaAtencionGlobal } from "./asignar/rdaFechaAtencion.js";
import { wireGuardarPaciente } from "./asignar/guardarPaciente.js";
import { wireGuardarRdace } from "./asignar/guardarRdace.js";

// ── Inicialización (el script se carga al final del body, DOM ya existe) ──
// Orden documentado: módulos internos primero, luego wireup de página.
initBiometria();
initControlRda();
initListasPaciente();
initListasConsultaExterna();
inicializarSelectsRDA();
initAsignarRdaWireup();

// Persistencia RDA + IHCE (antes inline en Asignar_RIPS V3.html)
wireRdaFechaAtencionGlobal();
initIhceAsignarWindow();
wireGuardarPaciente();
wireGuardarRdace();

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
    // RDA Paciente
    getAntecedentes,
    getAntecedentesFamiliares,
    getMedicamentos,
    // RDA Consulta Externa — Antecedentes
    getAntecedentesCE,
    getAntecedentesFamiliaresCE,
    getMedicamentosCE,
    // RDA Consulta Externa — Diagnósticos / Prescripciones
    getDiagRelacionados,
    getPrescripcionMedicamentos,
    getPrescripcionProcedimientos,
    getOtrasTecnologias,
    // FHIR Bundle builder
    buildPacienteBundle,
    // Feature flag (localStorage RDA_API_VERSION o __APP_CONFIG__.RDA_API_VERSION)
    getRdaApiVersion,
    isRdaV2,
};

/**
 * initAsignarWireup.js — Orquesta la inicialización de cableado RDA
 * dentro de la página Asignar RIPS V3.
 *
 * Orden de llamada (documentado):
 *   1. wireCieSelect2          — helpers CIE-10 / CIE-11 (sin deps RIPS)
 *   2. wireRdaceCatalogs       — catálogos RDACE (Catalogo1888, egreso, etc.)
 *   3. wireSyncRips            — sincronía Asignar RIPS → RDA / RDACE
 *   4. wireDemografiaPaciente  — selects demografía paciente + ActualizarPaciente
 *
 * Se invoca desde rda/index.js después de inicializarSelectsRDA().
 */

import { wireCieSelect2 } from "./wireCieSelect2.js";
import { wireRdaceCatalogs } from "./wireRdaceCatalogs.js";
import { wireSyncRips } from "./wireSyncRips.js";
import { wireDemografiaPaciente } from "./wireDemografiaPaciente.js";

export function initAsignarRdaWireup() {
    wireCieSelect2();
    wireRdaceCatalogs();
    wireSyncRips();
    wireDemografiaPaciente();
}

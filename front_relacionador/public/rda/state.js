/**
 * state.js — Estado centralizado de RDA (Resolución 1888)
 *
 * Todos los arrays de listas dinámicas viven aquí.
 * Otros módulos acceden al estado exclusivamente a través de las
 * funciones exportadas (getters, add, remove, reset).
 */

// ── RDA Paciente ───────────────────────────────────────────
const listaAntecedentes = [];
const listaAntecedentesFam = [];
const listaMedicamentos = [];

// ── RDA Consulta Externa ───────────────────────────────────
const listaDiagRelacionados = [];
const listaPrescripcionMed = [];
const listaPrescripcionProc = [];
const listaOtrasTec = [];

// Mapa interno para acceso genérico por nombre
const _lists = {
    antecedentes: listaAntecedentes,
    antecedentesFam: listaAntecedentesFam,
    medicamentos: listaMedicamentos,
    diagRelacionados: listaDiagRelacionados,
    prescripcionMed: listaPrescripcionMed,
    prescripcionProc: listaPrescripcionProc,
    otrasTec: listaOtrasTec,
};

// ── Getters ────────────────────────────────────────────────
export function getAntecedentes() { return listaAntecedentes; }
export function getAntecedentesFamiliares() { return listaAntecedentesFam; }
export function getMedicamentos() { return listaMedicamentos; }
export function getDiagRelacionados() { return listaDiagRelacionados; }
export function getPrescripcionMedicamentos() { return listaPrescripcionMed; }
export function getPrescripcionProcedimientos() { return listaPrescripcionProc; }
export function getOtrasTecnologias() { return listaOtrasTec; }

// ── Mutaciones ─────────────────────────────────────────────
export function addAntecedente(item) { listaAntecedentes.push(item); }
export function addAntecedenteFamiliar(item) { listaAntecedentesFam.push(item); }
export function addMedicamento(item) { listaMedicamentos.push(item); }
export function addDiagRelacionado(item) { listaDiagRelacionados.push(item); }
export function addPrescripcionMed(item) { listaPrescripcionMed.push(item); }
export function addPrescripcionProc(item) { listaPrescripcionProc.push(item); }
export function addOtraTecnologia(item) { listaOtrasTec.push(item); }

/**
 * Elimina un elemento por índice de cualquier lista registrada.
 * @param {string} listName — clave en el mapa interno (e.g. "antecedentes").
 * @param {number} index
 */
export function removeItem(listName, index) {
    const list = _lists[listName];
    if (list && index >= 0 && index < list.length) {
        list.splice(index, 1);
    }
}

/**
 * Vacía todas las listas (útil al cambiar de paciente).
 */
export function resetAll() {
    Object.values(_lists).forEach(list => { list.length = 0; });
}

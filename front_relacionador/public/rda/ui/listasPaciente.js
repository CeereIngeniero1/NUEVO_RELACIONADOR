/**
 * listasPaciente.js — Listas dinámicas de RDA Paciente
 *
 * Antecedentes de Salud, Antecedentes Familiares, Medicamentos.
 * Delega el estado a state.js y el renderizado a renderBadges.js.
 */

import {
    getAntecedentes,
    getAntecedentesFamiliares,
    getMedicamentos,
    addAntecedente,
    addAntecedenteFamiliar,
    addMedicamento,
    removeItem,
} from "../state.js";

import { renderBadgeList } from "./renderBadges.js";

function clearSelect2(selector) {
    if (typeof $ !== "undefined") {
        try {
            $(selector).val(null).trigger("change");
        } catch (_) {
            /* noop */
        }
    } else {
        const el = document.querySelector(selector);
        if (el) el.value = "";
    }
}

function readCie11FromSelect(elementId) {
    const el = document.getElementById(elementId);
    if (!el || typeof $ === "undefined" || !$(el).data("select2")) {
        return { cie11Codigo: "", cie11Termino: "" };
    }
    const d = $(el).select2("data")[0];
    if (!d) return { cie11Codigo: "", cie11Termino: "" };
    return {
        cie11Codigo: d.id != null ? String(d.id) : "",
        cie11Termino: d.text || "",
    };
}

function rerender(container, items, kind) {
    renderBadgeList(container, items, kind, (index) => {
        removeItem(kind === "antecedente" ? "antecedentes"
            : kind === "familiar" ? "antecedentesFam"
            : "medicamentos", index);
        rerender(container, items, kind);
    });
}

export function initListasPaciente() {
    // ── Antecedentes de Salud ──────────────────────────────
    const btnAntecedente = document.getElementById("RDA_BtnAgregarAntecedente");
    const inputCIE10 = document.getElementById("RDA_AntecedenteSaludCIE10");
    const inputDesc = document.getElementById("RDA_AntecedenteSaludDescripcion");
    const contenedorLista = document.getElementById("RDA_ListaAntecedentes");

    btnAntecedente?.addEventListener("click", () => {
        const codigo = inputCIE10?.value?.trim();
        if (!codigo) return;

        addAntecedente({ codigo, descripcion: inputDesc?.value || "" });
        rerender(contenedorLista, getAntecedentes(), "antecedente");

        if (inputCIE10) inputCIE10.value = "";
        if (inputDesc) inputDesc.value = "";
    });

    // ── Antecedentes Familiares ────────────────────────────
    const btnFam = document.getElementById("RDA_BtnAgregarAntecedenteFam");
    const selectParentesco = document.getElementById("RDA_ParentescoFamiliar");
    const inputFamCIE10 = document.getElementById("RDA_AntecedenteFamiliarCIE10");
    const inputFamDesc = document.getElementById("RDA_AntecedenteFamiliarDescripcion");
    const contenedorFam = document.getElementById("RDA_ListaAntecedentesFamiliares");

    btnFam?.addEventListener("click", () => {
        const parentesco = selectParentesco?.value;
        const codigo = inputFamCIE10?.value?.trim();
        if (!parentesco || !codigo) return;

        const textoParentesco =
            selectParentesco?.options[selectParentesco.selectedIndex]?.text || "";

        const c11 = readCie11FromSelect("RDA_AntecedenteFamiliarCIE11");
        const item = {
            parentesco,
            textoParentesco,
            codigo,
            descripcion: inputFamDesc?.value || "",
        };
        if (c11.cie11Codigo) item.cie11Codigo = c11.cie11Codigo;
        if (c11.cie11Termino) item.cie11Termino = c11.cie11Termino;

        addAntecedenteFamiliar(item);
        rerender(contenedorFam, getAntecedentesFamiliares(), "familiar");

        if (selectParentesco) selectParentesco.value = "";
        clearSelect2("#RDA_AntecedenteFamiliarCIE10");
        clearSelect2("#RDA_AntecedenteFamiliarCIE11");
        if (inputFamDesc) inputFamDesc.value = "";
    });

    // ── Medicamentos ───────────────────────────────────────
    const btnMed = document.getElementById("RDA_BtnAgregarMedicamento");
    const inputDCI = document.getElementById("RDA_MedicamentoDCI");
    const inputObs = document.getElementById("RDA_MedicamentoObservacion");
    const contenedorMed = document.getElementById("RDA_ListaMedicamentos");

    btnMed?.addEventListener("click", () => {
        const nombre = inputDCI?.value?.trim();
        if (!nombre) return;

        addMedicamento({ nombre, observacion: inputObs?.value || "" });
        rerender(contenedorMed, getMedicamentos(), "medicamento");

        if (inputDCI) inputDCI.value = "";
        if (inputObs) inputObs.value = "";
    });
}

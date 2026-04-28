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
    const inputFamCIE11Manual = document.getElementById("RDA_AntecedenteFamiliarCIE11CodigoManual");
    const contenedorFam = document.getElementById("RDA_ListaAntecedentesFamiliares");

    btnFam?.addEventListener("click", () => {
        const parentesco = selectParentesco?.value;
        const codigo = inputFamCIE10?.value?.trim() || "";
        if (!parentesco) return;

        let cie11Codigo = inputFamCIE11Manual?.value?.trim() || "";
        let cie11Termino = "";
        const inputFamCIE11 = document.getElementById("RDA_AntecedenteFamiliarCIE11");
        if (inputFamCIE11 && typeof $ !== "undefined" && $(inputFamCIE11).data("select2")) {
            const d11 = $(inputFamCIE11).select2("data")[0];
            if (d11) {
                cie11Codigo = cie11Codigo || (d11.id != null ? String(d11.id).trim() : "");
                cie11Termino = d11.text || "";
            }
        }
        if (!codigo && !cie11Codigo && !cie11Termino) return;

        const textoParentesco =
            selectParentesco?.options[selectParentesco.selectedIndex]?.text || "";

        addAntecedenteFamiliar({
            parentesco,
            textoParentesco,
            codigo,
            descripcion: inputFamDesc?.value || "",
            cie11Codigo: cie11Codigo || undefined,
            cie11Termino: cie11Termino || undefined,
        });
        rerender(contenedorFam, getAntecedentesFamiliares(), "familiar");

        if (selectParentesco) selectParentesco.value = "";
        if (inputFamCIE10) inputFamCIE10.value = "";
        if (inputFamCIE11Manual) inputFamCIE11Manual.value = "";
        if (inputFamCIE11 && typeof $ !== "undefined") $(inputFamCIE11).val(null).trigger("change");
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

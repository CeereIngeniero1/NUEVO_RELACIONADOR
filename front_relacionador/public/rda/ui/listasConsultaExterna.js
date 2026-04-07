/**
 * listasConsultaExterna.js — Listas dinámicas de RDA Consulta Externa
 *
 * Diagnósticos Relacionados, Prescripción Medicamentos,
 * Prescripción Procedimientos, Otras Tecnologías en Salud.
 * Delega el estado a state.js y el renderizado a renderBadges.js.
 */

import {
    getAntecedentesCE,
    getAntecedentesFamiliaresCE,
    getMedicamentosCE,
    addAntecedenteCE,
    addAntecedenteFamiliarCE,
    addMedicamentoCE,
    getDiagRelacionados,
    getPrescripcionMedicamentos,
    getPrescripcionProcedimientos,
    getOtrasTecnologias,
    addDiagRelacionado,
    addPrescripcionMed,
    addPrescripcionProc,
    addOtraTecnologia,
    removeItem,
} from "../state.js";

import { renderBadgeList } from "./renderBadges.js";

const STATE_KEY = {
    antecedente: "antecedentesCE",
    familiar: "antecedentesFamCE",
    medicamento: "medicamentosCE",
    diagRel: "diagRelacionados",
    medCE: "prescripcionMed",
    procCE: "prescripcionProc",
    otraCE: "otrasTec",
};

function rerender(container, items, kind) {
    renderBadgeList(container, items, kind, (index) => {
        removeItem(STATE_KEY[kind], index);
        rerender(container, items, kind);
    });
}

function clearFields(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (typeof $ !== "undefined" && $(el).data("select2")) {
            $(el).val(null).trigger("change");
        } else {
            el.value = "";
        }
    });
}

function getSelectText(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    if (typeof $ !== "undefined" && $(el).data("select2")) {
        const d = $(el).select2("data")[0];
        return d ? (d.text || "") : "";
    }
    return el.options[el.selectedIndex]?.text || "";
}

function getSelectValue(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    if (typeof $ !== "undefined" && $(el).data("select2")) {
        const d = $(el).select2("data")[0];
        return d && d.id != null ? String(d.id) : "";
    }
    return el.value || "";
}

function clearSelect2(selector) {
    if (typeof $ !== "undefined") {
        try { $(selector).val(null).trigger("change"); } catch (_) { /* noop */ }
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

export function initListasConsultaExterna() {

    // ── Antecedentes de Salud CE ────────────────────────────
    const btnAntCE = document.getElementById("RDACE_BtnAgregarAntecedente");
    const inputCIE10CE = document.getElementById("RDACE_AntecedenteSaludCIE10");
    const inputDescCE = document.getElementById("RDACE_AntecedenteSaludDescripcion");
    const contAntCE = document.getElementById("RDACE_ListaAntecedentes");

    btnAntCE?.addEventListener("click", () => {
        const codigo = inputCIE10CE?.value?.trim();
        if (!codigo) return;

        addAntecedenteCE({ codigo, descripcion: inputDescCE?.value || "" });
        rerender(contAntCE, getAntecedentesCE(), "antecedente");

        clearSelect2("#RDACE_AntecedenteSaludCIE10");
        if (inputDescCE) inputDescCE.value = "";
    });

    // ── Antecedentes Familiares CE ──────────────────────────
    const btnFamCE = document.getElementById("RDACE_BtnAgregarAntecedenteFam");
    const inputFamCIE10CE = document.getElementById("RDACE_AntecedenteFamiliarCIE10");
    const inputFamDescCE = document.getElementById("RDACE_AntecedenteFamiliarDescripcion");
    const contFamCE = document.getElementById("RDACE_ListaAntecedentesFamiliares");

    btnFamCE?.addEventListener("click", () => {
        const parentesco = getSelectValue("RDACE_ParentescoFamiliar");
        const codigo = inputFamCIE10CE?.value?.trim();
        if (!parentesco || !codigo) return;

        const textoParentesco = getSelectText("RDACE_ParentescoFamiliar") || "";
        const c11 = readCie11FromSelect("RDACE_AntecedenteFamiliarCIE11");
        const item = {
            parentesco,
            textoParentesco,
            codigo,
            descripcion: inputFamDescCE?.value || "",
        };
        if (c11.cie11Codigo) item.cie11Codigo = c11.cie11Codigo;
        if (c11.cie11Termino) item.cie11Termino = c11.cie11Termino;

        addAntecedenteFamiliarCE(item);
        rerender(contFamCE, getAntecedentesFamiliaresCE(), "familiar");

        clearSelect2("#RDACE_ParentescoFamiliar");
        clearSelect2("#RDACE_AntecedenteFamiliarCIE10");
        clearSelect2("#RDACE_AntecedenteFamiliarCIE11");
        if (inputFamDescCE) inputFamDescCE.value = "";
    });

    // ── Medicamentos (Antecedentes Farmacológicos) CE ───────
    const btnMedCEAnt = document.getElementById("RDACE_BtnAgregarMedicamento");
    const selectDCICE = document.getElementById("RDACE_MedicamentoDCI");
    const inputObsCE = document.getElementById("RDACE_MedicamentoObservacion");
    const contMedCEAnt = document.getElementById("RDACE_ListaMedicamentos");

    btnMedCEAnt?.addEventListener("click", () => {
        let nombre = "";
        if (selectDCICE && typeof $ !== "undefined") {
            const selData = $(selectDCICE).select2("data")[0];
            nombre = selData ? selData.text : ($(selectDCICE).val() || "");
        } else {
            nombre = selectDCICE?.value || "";
        }
        if (!nombre || !String(nombre).trim()) return;

        addMedicamentoCE({ nombre: String(nombre).trim(), observacion: inputObsCE?.value || "" });
        rerender(contMedCEAnt, getMedicamentosCE(), "medicamento");

        clearSelect2("#RDACE_MedicamentoDCI");
        if (inputObsCE) inputObsCE.value = "";
    });

    // ── Diagnósticos Relacionados ──────────────────────────
    const btnDiagRel = document.getElementById("RDACE_BtnAgregarDiagRelacionado");
    const contDiagRel = document.getElementById("RDACE_ListaDiagRelacionados");

    btnDiagRel?.addEventListener("click", () => {
        const codCIE10 = document.getElementById("RDACE_DiagRelacionadoCIE10Codigo")?.value?.trim();
        if (!codCIE10) return;

        addDiagRelacionado({
            codigoCIE10: codCIE10,
            nombreCIE10: document.getElementById("RDACE_DiagRelacionadoCIE10Nombre")?.value || "",
            codigoCIE11: document.getElementById("RDACE_DiagRelacionadoCIE11Codigo")?.value?.trim() || "",
            terminoCIE11: document.getElementById("RDACE_DiagRelacionadoCIE11Termino")?.value?.trim() || "",
        });
        rerender(contDiagRel, getDiagRelacionados(), "diagRel");

        clearFields([
            "RDACE_DiagRelacionadoCIE10Codigo",
            "RDACE_DiagRelacionadoCIE10Nombre",
            "RDACE_DiagRelacionadoCIE11Codigo",
            "RDACE_DiagRelacionadoCIE11Termino",
        ]);
    });

    // ── Prescripción de Medicamentos ───────────────────────
    const btnMedCE = document.getElementById("RDACE_BtnAgregarPrescripcionMed");
    const contMedCE = document.getElementById("RDACE_ListaPrescripcionMedicamentos");

    btnMedCE?.addEventListener("click", () => {
        const codigo = document.getElementById("RDACE_CodigoMedicamento")?.value?.trim();
        const nombre = document.getElementById("RDACE_NombreMedicamento")?.value?.trim();
        if (!codigo && !nombre) return;

        addPrescripcionMed({
            tipo: document.getElementById("RDACE_TipoTecSaludMed")?.value || "M",
            codigo: codigo || "",
            nombre: nombre || "",
            dci: document.getElementById("RDACE_DescripcionComunMed")?.value || "",
            fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionMed")?.value || "",
            dosis: document.getElementById("RDACE_DosisOrdenadaMed")?.value || "",
            unidadDosis: getSelectValue("RDACE_UnidadMedidaDosis"),
            via: getSelectText("RDACE_ViaAdministracionMed"),
            duracionCant: document.getElementById("RDACE_DuracionCantidadMed")?.value || "",
            duracionUnid: getSelectValue("RDACE_DuracionUnidadTiempoMed"),
            frecuenciaCant: document.getElementById("RDACE_FrecuenciaCantidadMed")?.value || "",
            frecuenciaUnid: getSelectValue("RDACE_FrecuenciaUnidadTiempoMed"),
            finalidad: getSelectValue("RDACE_FinalidadTecSaludMed"),
        });
        rerender(contMedCE, getPrescripcionMedicamentos(), "medCE");

        clearFields([
            "RDACE_CodigoMedicamento", "RDACE_NombreMedicamento", "RDACE_DescripcionComunMed",
            "RDACE_FechaPrescripcionMed", "RDACE_DosisOrdenadaMed",
            "RDACE_UnidadMedidaDosis", "RDACE_ViaAdministracionMed", "RDACE_DuracionUnidadTiempoMed",
            "RDACE_FrecuenciaUnidadTiempoMed", "RDACE_FinalidadTecSaludMed", "RDACE_TipoTecSaludMed",
            "RDACE_DuracionCantidadMed", "RDACE_FrecuenciaCantidadMed",
        ]);
    });

    // ── Prescripción de Procedimientos ─────────────────────
    const btnProcCE = document.getElementById("RDACE_BtnAgregarPrescripcionProc");
    const contProcCE = document.getElementById("RDACE_ListaPrescripcionProcedimientos");

    btnProcCE?.addEventListener("click", () => {
        const codigo = document.getElementById("RDACE_CodigoProcedimiento")?.value?.trim();
        if (!codigo) return;

        addPrescripcionProc({
            tipo: "Procedimiento",
            codigo,
            nombre: document.getElementById("RDACE_NombreProcedimiento")?.value || "",
            finalidad: getSelectText("RDACE_FinalidadTecSaludProc"),
            fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionProc")?.value || "",
        });
        rerender(contProcCE, getPrescripcionProcedimientos(), "procCE");

        clearFields([
            "RDACE_CodigoProcedimiento", "RDACE_NombreProcedimiento",
            "RDACE_TipoTecSaludProc", "RDACE_FinalidadTecSaludProc", "RDACE_FechaPrescripcionProc",
        ]);
    });

    // ── Otras Tecnologías en Salud ─────────────────────────
    const btnOtraCE = document.getElementById("RDACE_BtnAgregarOtraTecnologia");
    const contOtraCE = document.getElementById("RDACE_ListaOtrasTecnologias");

    btnOtraCE?.addEventListener("click", () => {
        const codigo = document.getElementById("RDACE_CodigoOtraTecnologia")?.value?.trim();
        if (!codigo) return;

        addOtraTecnologia({
            tipo: getSelectText("RDACE_TipoTecSaludOtra"),
            codigo,
            nombre: document.getElementById("RDACE_NombreOtraTecnologia")?.value || "",
            fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionOtra")?.value || "",
            finalidad: getSelectText("RDACE_FinalidadTecSaludOtra"),
        });
        rerender(contOtraCE, getOtrasTecnologias(), "otraCE");

        clearFields([
            "RDACE_CodigoOtraTecnologia", "RDACE_NombreOtraTecnologia",
            "RDACE_TipoTecSaludOtra", "RDACE_FechaPrescripcionOtra",
            "RDACE_FinalidadTecSaludOtra",
        ]);
    });
}

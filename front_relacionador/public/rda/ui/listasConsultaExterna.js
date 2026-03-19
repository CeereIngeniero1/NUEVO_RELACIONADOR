/**
 * listasConsultaExterna.js — Listas dinámicas de RDA Consulta Externa
 *
 * Diagnósticos Relacionados, Prescripción Medicamentos,
 * Prescripción Procedimientos, Otras Tecnologías en Salud.
 * Delega el estado a state.js y el renderizado a renderBadges.js.
 */

import {
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

export function initListasConsultaExterna() {

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

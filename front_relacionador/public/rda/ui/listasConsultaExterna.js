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

function parseNombreFromTipoText(text) {
    const t = String(text || "").trim();
    if (!t) return "";
    const idx = t.indexOf(" - ");
    return idx >= 0 ? t.slice(idx + 3).trim() : t;
}

function syncOtraTecCodigoNombreFromTipo() {
    const codigo = getSelectValue("RDACE_TipoTecSaludOtra");
    const texto = getSelectText("RDACE_TipoTecSaludOtra");
    const codEl = document.getElementById("RDACE_CodigoOtraTecnologia");
    const nomEl = document.getElementById("RDACE_NombreOtraTecnologia");
    if (codEl) codEl.value = codigo || "";
    if (nomEl) nomEl.value = codigo ? parseNombreFromTipoText(texto) : "";
}

function wireOtraTecnologiaTipoSync() {
    const el = document.getElementById("RDACE_TipoTecSaludOtra");
    if (!el || el.dataset.otraTecWired === "1") return;
    el.dataset.otraTecWired = "1";
    el.addEventListener("change", syncOtraTecCodigoNombreFromTipo);
    if (typeof $ !== "undefined") {
        $(el).on("select2:select select2:clear", syncOtraTecCodigoNombreFromTipo);
    }
}

function clearSelect2(selector) {
    if (typeof $ !== "undefined") {
        try { $(selector).val(null).trigger("change"); } catch (_) { /* noop */ }
    } else {
        const el = document.querySelector(selector);
        if (el) el.value = "";
    }
}

function digitsOnly(value) {
    if (value == null) return "";
    return String(value).replace(/\D+/g, "");
}

function getSelectCatalogData(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (typeof $ !== "undefined" && $(el).data("select2")) {
        const d = $(el).select2("data")[0];
        if (!d) return null;
        return {
            codigo: (d.codigo || d.id || "").toString().trim(),
            display: (d.display || "").toString().trim(),
            systemUrl: (d.systemUrl || "").toString().trim(),
            fhirDurationUnit: (d.fhirDurationUnit || "").toString().trim(),
            unidad: (d.unidad || "").toString().trim(),
        };
    }
    const codigo = (el.value || "").trim();
    if (!codigo) return null;
    const text = el.options[el.selectedIndex]?.text || "";
    return { codigo, display: text, systemUrl: "", fhirDurationUnit: "", unidad: "" };
}

function isPrescripcionMedFormComplete() {
    const codigo = document.getElementById("RDACE_CodigoMedicamento")?.value?.trim();
    const nombre = document.getElementById("RDACE_NombreMedicamento")?.value?.trim();
    if (!codigo && !nombre) return false;

    const umm = getSelectCatalogData("RDACE_UnidadMedidaDosis");
    const vad = getSelectCatalogData("RDACE_ViaAdministracionMed");
    const dur = getSelectCatalogData("RDACE_DuracionUnidadTiempoMed");
    const freq = getSelectCatalogData("RDACE_FrecuenciaUnidadTiempoMed");

    return Boolean(
        digitsOnly(document.getElementById("RDACE_DosisOrdenadaMed")?.value || "") &&
        umm && umm.codigo &&
        vad && vad.codigo &&
        digitsOnly(document.getElementById("RDACE_DuracionCantidadMed")?.value || "") &&
        dur && dur.codigo && dur.codigo !== "7" && dur.fhirDurationUnit &&
        digitsOnly(document.getElementById("RDACE_FrecuenciaCantidadMed")?.value || "") &&
        freq && freq.codigo && freq.codigo !== "7" &&
        getSelectValue("RDACE_FinalidadTecSaludMed")
    );
}

function attachDigitsOnlyFilter(input) {
    if (!input || input.dataset?.digitsOnlyAttached === "1") return;
    try { input.dataset.digitsOnlyAttached = "1"; } catch (_) { /* noop */ }

    // Bloquear caracteres no numéricos al teclear
    input.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const allowed = [
            "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            "Home", "End", "Tab", "Enter",
        ];
        if (allowed.includes(e.key)) return;
        if (/^\d$/.test(e.key)) return;
        e.preventDefault();
    });

    // Bloquear inserciones no numéricas (IME/drag/drop/input methods)
    input.addEventListener("beforeinput", (e) => {
        const t = e.inputType || "";
        if (!t.startsWith("insert")) return;
        const data = e.data ?? "";
        if (data && /\D/.test(String(data))) {
            e.preventDefault();
        }
    });

    // Sanitizar lo pegado: solo dígitos
    input.addEventListener("paste", (e) => {
        const txt = e.clipboardData?.getData("text") ?? "";
        const d = digitsOnly(txt);
        e.preventDefault();

        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const next = (input.value.slice(0, start) + d + input.value.slice(end));
        input.value = digitsOnly(next);
        try {
            const caret = start + d.length;
            input.setSelectionRange(caret, caret);
        } catch (_) { /* noop */ }
    });

    // Capa final: si por cualquier medio entró algo raro, lo limpia.
    input.addEventListener("input", () => {
        const next = digitsOnly(input.value);
        if (next !== input.value) input.value = next;
    });
}

function initDigitsOnlyInputs() {
    [
        "RDACE_DosisOrdenadaMed",
        "RDACE_DuracionCantidadMed",
        "RDACE_FrecuenciaCantidadMed",
    ].forEach((id) => attachDigitsOnlyFilter(document.getElementById(id)));
}

export function initListasConsultaExterna() {
    initDigitsOnlyInputs();
    wireOtraTecnologiaTipoSync();

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
    const selectParentescoCE = document.getElementById("RDACE_ParentescoFamiliar");
    const inputFamCIE10CE = document.getElementById("RDACE_AntecedenteFamiliarCIE10");
    const inputFamCIE11CE = document.getElementById("RDACE_AntecedenteFamiliarCIE11");
    const inputFamDescCE = document.getElementById("RDACE_AntecedenteFamiliarDescripcion");
    const inputFamCIE11ManualCE = document.getElementById("RDACE_AntecedenteFamiliarCIE11CodigoManual");
    const contFamCE = document.getElementById("RDACE_ListaAntecedentesFamiliares");

    btnFamCE?.addEventListener("click", () => {
        const parentesco = selectParentescoCE?.value || "";
        const textoParentesco =
            selectParentescoCE?.options?.[selectParentescoCE.selectedIndex]?.text || "";

        const codigo = inputFamCIE10CE?.value?.trim() || "";
        const descripcion = inputFamDescCE?.value || "";

        let cie11Codigo = inputFamCIE11ManualCE?.value?.trim() || "";
        let cie11Termino = "";
        try {
            if (inputFamCIE11CE && typeof $ !== "undefined" && $(inputFamCIE11CE).data("select2")) {
                const d11 = $(inputFamCIE11CE).select2("data")[0];
                if (d11) {
                    cie11Codigo = d11.id != null ? String(d11.id) : "";
                    cie11Termino = d11.text || "";
                }
            } else if (inputFamCIE11CE) {
                cie11Termino = inputFamCIE11CE.value || "";
            }
        } catch (_) {
            // ignore
        }

        if (!parentesco) return;
        // Permitir solo CIE-11, solo CIE-10 o ambos.
        if (!codigo && !cie11Codigo && !cie11Termino) return;

        addAntecedenteFamiliarCE({
            parentesco,
            textoParentesco,
            codigo,
            descripcion,
            cie11Codigo: cie11Codigo || undefined,
            cie11Termino: cie11Termino || undefined,
        });
        rerender(contFamCE, getAntecedentesFamiliaresCE(), "familiar");

        clearSelect2("#RDACE_AntecedenteFamiliarCIE10");
        if (inputFamCIE11CE && typeof $ !== "undefined") $(inputFamCIE11CE).val(null).trigger("change");
        if (inputFamCIE11ManualCE) inputFamCIE11ManualCE.value = "";
        if (selectParentescoCE && typeof $ !== "undefined" && $(selectParentescoCE).data("select2")) {
            $(selectParentescoCE).val(null).trigger("change");
        } else if (selectParentescoCE) {
            selectParentescoCE.value = "";
        }
        if (inputFamDescCE) inputFamDescCE.value = "";
    });

    // ── Medicamentos (Antecedentes Farmacológicos) CE ───────
    const btnMedCEAnt = document.getElementById("RDACE_BtnAgregarMedicamento");
    const selectDCICE = document.getElementById("RDACE_MedicamentoDCI");
    const inputObsCE = document.getElementById("RDACE_MedicamentoObservacion");
    const contMedCEAnt = document.getElementById("RDACE_ListaMedicamentos");

    btnMedCEAnt?.addEventListener("click", () => {
        let nombre = "";
        let codigo = "";
        if (selectDCICE && typeof $ !== "undefined") {
            const selData = $(selectDCICE).select2("data")[0];
            if (selData) {
                codigo = (selData.codigo || "").trim();
                const label = (selData.text || "").trim();
                if (label) {
                    const m = label.match(/^(\S+)\s*-\s*(.+)$/);
                    if (m) {
                        codigo = codigo || m[1].trim();
                        nombre = m[2].trim();
                    } else {
                        nombre = label;
                    }
                }
            }
            if (!nombre) {
                nombre = selData ? (selData.text || $(selectDCICE).val() || "") : "";
            }
        } else {
            nombre = selectDCICE?.value || "";
        }
        if (!nombre || !String(nombre).trim()) return;

        addMedicamentoCE({
            codigo,
            nombre: String(nombre).trim(),
            observacion: inputObsCE?.value || "",
        });
        rerender(contMedCEAnt, getMedicamentosCE(), "medicamento");

        clearSelect2("#RDACE_MedicamentoDCI");
        if (inputObsCE) inputObsCE.value = "";
    });

    // ── Diagnósticos Relacionados ──────────────────────────
    const btnDiagRel = document.getElementById("RDACE_BtnAgregarDiagRelacionado");
    const contDiagRel = document.getElementById("RDACE_ListaDiagRelacionados");

    btnDiagRel?.addEventListener("click", () => {
        const codCIE10 = document.getElementById("RDACE_DiagRelacionadoCIE10Codigo")?.value?.trim() || "";
        const codCIE11 = document.getElementById("RDACE_DiagRelacionadoCIE11Codigo")?.value?.trim() || "";

        let termCIE11 = "";
        const elTerm = document.getElementById("RDACE_DiagRelacionadoCIE11Termino");
        try {
            if (elTerm && typeof $ !== "undefined" && $(elTerm).data("select2")) {
                const td = $(elTerm).select2("data")[0];
                termCIE11 = td ? (td.text || "") : "";
            } else {
                termCIE11 = elTerm?.value?.trim() || "";
            }
        } catch (_) {
            termCIE11 = elTerm?.value?.trim() || "";
        }

        // Permitir guardar con solo CIE-11 (sin CIE-10) o con ambos.
        if (!codCIE10 && !codCIE11 && !termCIE11) return;

        addDiagRelacionado({
            codigoCIE10: codCIE10,
            nombreCIE10: document.getElementById("RDACE_DiagRelacionadoCIE10Nombre")?.value || "",
            codigoCIE11: codCIE11,
            terminoCIE11: termCIE11,
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
        if (!isPrescripcionMedFormComplete()) {
            alert(
                "Complete dosis, UMM, vía (VAD), duración, frecuencia y finalidad desde catálogos oficiales. " +
                "La duración requiere unidad con equivalencia FHIR (no use «Según respuesta al tratamiento»)."
            );
            return;
        }

        const umm = getSelectCatalogData("RDACE_UnidadMedidaDosis");
        const vad = getSelectCatalogData("RDACE_ViaAdministracionMed");
        const dur = getSelectCatalogData("RDACE_DuracionUnidadTiempoMed");
        const freq = getSelectCatalogData("RDACE_FrecuenciaUnidadTiempoMed");

        addPrescripcionMed({
            tipo: document.getElementById("RDACE_TipoTecSaludMed")?.value || "M",
            codigo: codigo || "",
            nombre: nombre || "",
            dci: document.getElementById("RDACE_DescripcionComunMed")?.value || "",
            fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionMed")?.value || "",
            dosis: digitsOnly(document.getElementById("RDACE_DosisOrdenadaMed")?.value || ""),
            unidadDosis: umm?.codigo || "",
            unidadDosisDisplay: umm?.display || "",
            unidadDosisSystemUrl: umm?.systemUrl || "",
            viaCodigo: vad?.codigo || "",
            viaDisplay: vad?.display || "",
            viaSystemUrl: vad?.systemUrl || "",
            duracionCant: digitsOnly(document.getElementById("RDACE_DuracionCantidadMed")?.value || ""),
            duracionUnid: dur?.codigo || "",
            duracionDisplay: dur?.display || "",
            duracionFhirUnit: dur?.fhirDurationUnit || "",
            frecuenciaCant: digitsOnly(document.getElementById("RDACE_FrecuenciaCantidadMed")?.value || ""),
            frecuenciaUnid: freq?.codigo || "",
            frecuenciaDisplay: freq?.display || "",
            frecuenciaSystemUrl: freq?.systemUrl || "",
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
        if (!getSelectValue("RDACE_FinalidadTecSaludProc")) {
            alert("Seleccione la finalidad de la tecnología en salud antes de agregar el procedimiento.");
            return;
        }

        addPrescripcionProc({
            tipo: "Procedimiento",
            codigo,
            nombre: document.getElementById("RDACE_NombreProcedimiento")?.value || "",
            finalidad: getSelectValue("RDACE_FinalidadTecSaludProc"),
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
        syncOtraTecCodigoNombreFromTipo();
        const tipoCodigo = getSelectValue("RDACE_TipoTecSaludOtra");
        if (!tipoCodigo) return;

        const codigo = document.getElementById("RDACE_CodigoOtraTecnologia")?.value?.trim() || tipoCodigo;
        const nombre = document.getElementById("RDACE_NombreOtraTecnologia")?.value?.trim()
            || parseNombreFromTipoText(getSelectText("RDACE_TipoTecSaludOtra"));

        addOtraTecnologia({
            tipo: getSelectText("RDACE_TipoTecSaludOtra"),
            tipoCodigo,
            codigo,
            nombre,
            fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionOtra")?.value || "",
            finalidad: getSelectValue("RDACE_FinalidadTecSaludOtra"),
        });
        rerender(contOtraCE, getOtrasTecnologias(), "otraCE");

        clearFields([
            "RDACE_TipoTecSaludOtra", "RDACE_FechaPrescripcionOtra",
            "RDACE_FinalidadTecSaludOtra",
        ]);
        syncOtraTecCodigoNombreFromTipo();
    });
}

export function refreshListasAntecedentesCE() {
    rerender(document.getElementById("RDACE_ListaAntecedentes"), getAntecedentesCE(), "antecedente");
    rerender(document.getElementById("RDACE_ListaAntecedentesFamiliares"), getAntecedentesFamiliaresCE(), "familiar");
    rerender(document.getElementById("RDACE_ListaMedicamentos"), getMedicamentosCE(), "medicamento");
}

/**
 * wireCieSelect2.js — Inicializa Select2 AJAX para campos CIE-10 y CIE-11
 * usados en formularios RDA Paciente y RDA Consulta Externa.
 *
 * Endpoints:
 *   GET /apiV3/icd11/search/:term  (CIE-11)
 *   GET /apiV3/Cie/:term           (CIE-10)
 */

import { getServidor } from "../api/servidor.js";

const servidor = getServidor();

function initCIE11Select2(selector, codeSelector, descSelector) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: "Busque un diagnóstico CIE-11",
        allowClear: true,
        minimumInputLength: 0,
        ajax: {
            delay: 500,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                const url = term.length < 3
                    ? `http://${servidor}:3000/apiV3/icd11/search/`
                    : `http://${servidor}:3000/apiV3/icd11/search/${encodeURIComponent(term)}`;

                fetch(url)
                    .then(r => r.json())
                    .then(data => {
                        const results = (data || []).map(item => ({
                            id: item.theCode || item.id,
                            text: item.title ? item.title.replace(/<[^>]*>?/gm, '') : 'Sin descripción',
                            code: item.theCode
                        }));
                        success({ results: results });
                    })
                    .catch(error => {
                        console.error('Error en búsqueda CIE-11:', error);
                        failure(error);
                    });
            },
            processResults: function (data) {
                return { results: data.results };
            }
        }
    });

    $(selector).on("select2:select", function (e) {
        const data = e.params.data;
        if (data.code && codeSelector) {
            $(codeSelector).val(data.code).trigger('change');
        }
        if (data.text && descSelector) {
            $(descSelector).val(data.text).trigger('change');
        }
    });
}

function initCIE10Select2(selector, descSelector) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: "Buscar diagnóstico CIE-10...",
        allowClear: true,
        minimumInputLength: 2,
        ajax: {
            delay: 300,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                if (term.length < 2) {
                    success({ results: [] });
                    return;
                }
                const url = `http://${servidor}:3000/apiV3/Cie/${encodeURIComponent(term)}`;
                fetch(url)
                    .then(r => r.json())
                    .then(data => success({ results: data }))
                    .catch(failure);
            },
            processResults: function (data) {
                const arr = data.results || data;
                return {
                    results: arr.map(item => ({
                        id: item.Codigo,
                        text: (item.Codigo || "") + " - " + (item.Nombre || item.Descripcion || ""),
                        codigo: item.Codigo,
                        nombre: item.Nombre || item.Descripcion || ""
                    }))
                };
            }
        },
        templateSelection: function (selection) {
            if (!selection.id) return selection.text;
            return selection.text.length > 50 ? selection.text.substring(0, 50) + "..." : selection.text;
        }
    });

    if (descSelector) {
        $(selector).on("select2:select", function (e) {
            const d = e.params.data;
            $(descSelector).val(d.nombre || "").trigger("change");
        });
        $(selector).on("select2:clear", function () {
            $(descSelector).val("").trigger("change");
        });
    }
}

export function wireCieSelect2() {
    // CIE-11
    initCIE11Select2("#RDA_DiagnosticoIngresoCIE11Termino", "#RDA_DiagnosticoIngresoCIE11Codigo");
    initCIE11Select2("#RDACE_DiagnosticoIngresoCIE11Termino", "#RDACE_DiagnosticoIngresoCIE11Codigo");
    initCIE11Select2("#RDACE_DiagRelacionadoCIE11Termino", "#RDACE_DiagRelacionadoCIE11Codigo");
    initCIE11Select2("#RDA_AntecedenteFamiliarCIE11", null, "#RDA_AntecedenteFamiliarDescripcion");
    initCIE11Select2("#RDACE_AntecedenteFamiliarCIE11", null, "#RDACE_AntecedenteFamiliarDescripcion");

    // CIE-10
    initCIE10Select2("#RDA_AntecedenteSaludCIE10", "#RDA_AntecedenteSaludDescripcion");
    initCIE10Select2("#RDA_AntecedenteFamiliarCIE10", "#RDA_AntecedenteFamiliarDescripcion");
    initCIE10Select2("#RDACE_AntecedenteSaludCIE10", "#RDACE_AntecedenteSaludDescripcion");
    initCIE10Select2("#RDACE_AntecedenteFamiliarCIE10", "#RDACE_AntecedenteFamiliarDescripcion");
    initCIE10Select2("#RDACE_DiagPrincipalCIE10Codigo", "#RDACE_DiagPrincipalCIE10Nombre");
    initCIE10Select2("#RDACE_DiagRelacionadoCIE10Codigo", "#RDACE_DiagRelacionadoCIE10Nombre");
}

/**
 * wireRdaceCatalogs.js — Select2 AJAX para catálogos usados en RDA / RDACE.
 *
 * Incluye: MedicamentosDCI, Cups1888, Profesionales, EgresoRemision,
 * Catalogo1888 (genérico), FactorDeRiesgo, TipoTecnologiaEnSalud.
 */

import { getApiBaseUrl } from "../api/apiBaseUrl.js";

// ── Medicamentos DCI ──────────────────────────────────────────────────────

function initMedicamentosDCISelect2(selector, fillCodigoId, fillNombreId) {
    if ($(selector).data("select2")) return;
    const select = $(selector);
    select.select2({
        placeholder: "Buscar medicamento DCI...",
        allowClear: true,
        minimumInputLength: 2,
        ajax: {
            delay: 300,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                const url = term.length
                    ? `${getApiBaseUrl()}/apiV3/MedicamentosDCI/${encodeURIComponent(term)}`
                    : `${getApiBaseUrl()}/apiV3/MedicamentosDCI/`;
                fetch(url)
                    .then(r => r.json())
                    .then(data => success({ results: data }))
                    .catch(failure);
            },
            processResults: function (data) {
                const arr = data.results || data;
                return {
                    results: arr.map(m => ({
                        id: m.Descripcion,
                        text: (m.Codigo ? m.Codigo + " - " : "") + m.Descripcion,
                        codigo: m.Codigo || "",
                        descripcion: m.Descripcion || ""
                    }))
                };
            }
        }
    });
    if (fillCodigoId || fillNombreId) {
        select.on("select2:select", function (e) {
            const d = e.params.data;
            if (fillCodigoId) $(fillCodigoId).val(d.codigo || "");
            if (fillNombreId) $(fillNombreId).val(d.descripcion || "");
        });
        select.on("select2:clear", function () {
            if (fillCodigoId) $(fillCodigoId).val("");
            if (fillNombreId) $(fillNombreId).val("");
        });
    }
}

// ── CUPS 1888 (Procedimientos) ────────────────────────────────────────────

function initCups1888Select2(selector, fillNombreId) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: "Buscar procedimiento CUPS...",
        width: "100%",
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
                const url = `${getApiBaseUrl()}/apiV3/Cups1888/${encodeURIComponent(term)}`;
                fetch(url)
                    .then(r => r.json())
                    .then(data => success({ results: data }))
                    .catch(failure);
            },
            processResults: function (data) {
                const arr = data.results || data;
                return {
                    results: arr.map(m => ({
                        id: m.Codigo,
                        text: (m.Codigo ? m.Codigo + " - " : "") + (m.Nombre || m.Descripcion || ""),
                        codigo: m.Codigo || "",
                        nombre: m.Nombre || m.Descripcion || ""
                    }))
                };
            }
        },
        templateSelection: function (selection) {
            if (!selection.id) return selection.text;
            return selection.text.length > 72 ? selection.text.substring(0, 72) + "..." : selection.text;
        }
    });
    if (fillNombreId) {
        $(selector).on("select2:select", function (e) {
            const d = e.params.data;
            $(fillNombreId).val(d.nombre || "").trigger("change");
        });
        $(selector).on("select2:clear", function () {
            $(fillNombreId).val("").trigger("change");
        });
    }
}

// ── Profesionales ─────────────────────────────────────────────────────────

function initProfesionalesSelect2(selector, tipoDocInputSelector) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: "Buscar por nombre o documento...",
        allowClear: true,
        minimumInputLength: 0,
        ajax: {
            delay: 250,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                const url = term
                    ? `${getApiBaseUrl()}/apiV3/Profesionales/${encodeURIComponent(term)}`
                    : `${getApiBaseUrl()}/apiV3/Profesionales/`;
                fetch(url)
                    .then(r => r.json())
                    .then(data => success({ results: data || [] }))
                    .catch(failure);
            },
            processResults: function (data) {
                const arr = data.results || data || [];
                return {
                    results: arr.map(p => ({
                        id: p.Documento,
                        text: `${p.Nombres || ""} (${p.Documento || ""})`,
                        tipoDocProfesional: p.TipoDocProfesional || p.TipoDocumento || "",
                        codigoTipoDocProfesional: p.CodigoTipoDocProfesional || p.CodigoTipoDocumento || "",
                    }))
                };
            }
        }
    });

    if (tipoDocInputSelector) {
        const $tipo = $(tipoDocInputSelector);

        const escogerTipo = (row) => {
            const codigo = row && row.CodigoTipoDocProfesional != null ? String(row.CodigoTipoDocProfesional).trim() : "";
            const tipo = row && row.TipoDocProfesional != null ? String(row.TipoDocProfesional).trim() : "";
            return codigo || tipo || "";
        };

        const setTipoDocValue = (raw) => {
            const v = raw != null ? String(raw).trim() : "";
            if (!v) {
                $tipo.val("").trigger("change");
                return;
            }
            // Soporta <input> o <select>: si es select y no hay match por value, intentar por texto de opción.
            const el = $tipo.get(0);
            if (el && el.tagName === "SELECT") {
                $tipo.val(v);
                if ($tipo.val() === v) {
                    $tipo.trigger("change");
                    return;
                }
                const needle = v.toLowerCase();
                let matchedVal = "";
                $tipo.find("option").each(function () {
                    const ov = ($(this).attr("value") || "").trim();
                    const ot = ($(this).text() || "").trim().toLowerCase();
                    if (!ov) return;
                    if (ov.toLowerCase() === needle || ot === needle || ot.includes(needle)) {
                        matchedVal = ov;
                        return false;
                    }
                });
                $tipo.val(matchedVal || "").trigger("change");
                return;
            }
            $tipo.val(v).trigger("change");
        };

        $(selector).on("select2:select", async function (e) {
            const d = (e && e.params && e.params.data) ? e.params.data : {};
            const doc = d && d.id != null ? String(d.id).trim() : "";

            // Si la lista ya trae el tipo/código, usarlo directo.
            const localTipo = escogerTipo({
                CodigoTipoDocProfesional: d.codigoTipoDocProfesional,
                TipoDocProfesional: d.tipoDocProfesional,
            });
            if (localTipo) {
                setTipoDocValue(localTipo);
                return;
            }

            if (!doc) {
                setTipoDocValue("");
                return;
            }

            // Fallback: consultar endpoint por documento.
            try {
                const url = `${getApiBaseUrl()}/apiV3/Profesionales/TipoDocumento/${encodeURIComponent(doc)}`;
                const r = await fetch(url);
                if (!r.ok) throw new Error(`status ${r.status}`);
                const data = await r.json();
                const tipoFinal = escogerTipo(data);
                setTipoDocValue(tipoFinal);
            } catch (err) {
                console.warn("[RDA V3] No se pudo cargar tipo de documento del profesional:", err);
                setTipoDocValue("");
            }
        });

        $(selector).on("select2:clear", function () {
            setTipoDocValue("");
        });
    }
}

async function prefillLoggedInProfessional(selector, tipoDocInputSelector) {
    const docUser = String(sessionStorage.getItem("documentousuariologeado") || "").trim();
    if (!docUser) return;

    const $sel = $(selector);
    if (!$sel.length) return;

    // No pisar selección manual o datos ya cargados.
    const currentVal = String($sel.val() || "").trim();
    if (currentVal) return;

    try {
        const url = `${getApiBaseUrl()}/apiV3/Profesionales/${encodeURIComponent(docUser)}`;
        const r = await fetch(url);
        if (!r.ok) return;
        const arr = await r.json();
        if (!Array.isArray(arr) || !arr.length) return;

        const row = arr.find((p) => String(p.Documento || "").trim() === docUser) || arr[0];
        const doc = String(row.Documento || "").trim();
        if (!doc) return;
        const nombre = String(row.Nombres || "").trim();
        const optionText = `${nombre || doc} (${doc})`;

        // Insertar opción y seleccionarla en Select2.
        const opt = new Option(optionText, doc, true, true);
        $sel.append(opt).trigger("change");
        $sel.trigger({
            type: "select2:select",
            params: {
                data: {
                    id: doc,
                    text: optionText,
                    tipoDocProfesional: row.TipoDocProfesional || row.TipoDocumento || "",
                    codigoTipoDocProfesional: row.CodigoTipoDocProfesional || row.CodigoTipoDocumento || "",
                },
            },
        });

        if (tipoDocInputSelector) {
            const $tipo = $(tipoDocInputSelector);
            if ($tipo.length) {
                const tipo = String(
                    row.CodigoTipoDocProfesional || row.TipoDocProfesional || row.CodigoTipoDocumento || row.TipoDocumento || ""
                ).trim();
                if (tipo) {
                    $tipo.val(tipo).trigger("change");
                    if (String($tipo.val() || "").trim() !== tipo) {
                        const needle = tipo.toLowerCase();
                        let match = "";
                        $tipo.find("option").each(function () {
                            const ov = String($(this).attr("value") || "").trim();
                            const ot = String($(this).text() || "").trim().toLowerCase();
                            if (!ov) return;
                            if (ov.toLowerCase() === needle || ot === needle || ot.includes(needle)) {
                                match = ov;
                                return false;
                            }
                        });
                        $tipo.val(match || "").trigger("change");
                    }
                }
            }
        }
    } catch (err) {
        console.warn("[RDA V3] No se pudo autoseleccionar profesional logueado:", err);
    }
}

// ── Egreso y Remisión ─────────────────────────────────────────────────────

function initEgresoRemisionSelect2(selector, placeholderText) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: placeholderText || "Buscar condición y destino al egreso...",
        allowClear: true,
        width: "100%",
        minimumInputLength: 0,
        ajax: {
            delay: 250,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                const base = `${getApiBaseUrl()}/apiV3/EgresoRemision`;
                const url = term ? `${base}?q=${encodeURIComponent(term)}` : base;
                fetch(url)
                    .then(r => {
                        if (!r.ok) throw new Error(r.statusText);
                        return r.json();
                    })
                    .then(data => success({ results: data || [] }))
                    .catch(failure);
            },
            processResults: function (data) {
                const arr = data.results || data || [];
                return {
                    results: arr.map(item => {
                        const cod = item.Codigo != null ? String(item.Codigo) : "";
                        const desc = item.Descripcion || "";
                        const text = cod ? `${cod} - ${desc}` : desc;
                        return { id: cod, text: text || cod };
                    })
                };
            }
        }
    });
}

// ── Catálogos RDA CE (genérico vía Catalogo1888/:clave) ──────────────────

function initRdaceCatalogSelect2(selector, claveCatalogo, placeholderText) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: placeholderText || "Buscar...",
        allowClear: true,
        width: "100%",
        minimumInputLength: 0,
        ajax: {
            delay: 250,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                const base = `${getApiBaseUrl()}/apiV3/Catalogo1888/${claveCatalogo}`;
                const url = term ? `${base}?q=${encodeURIComponent(term)}` : base;
                fetch(url)
                    .then(r => {
                        if (!r.ok) throw new Error(r.statusText);
                        return r.json();
                    })
                    .then(data => success({ results: data || [] }))
                    .catch(failure);
            },
            processResults: function (data) {
                const arr = data.results || data || [];
                return {
                    results: arr.map(item => {
                        const cod = item.Codigo != null ? String(item.Codigo) : "";
                        const desc = item.Descripcion || "";
                        const text = cod ? `${cod} - ${desc}` : desc;
                        return { id: cod, text: text || cod };
                    })
                };
            }
        }
    });
}

// ── Factor de Riesgo ──────────────────────────────────────────────────────

function initFactorDeRiesgoSelect2() {
    const $tipo = $("#RDACE_TipoFactorRiesgo");
    const $nombre = $("#RDACE_NombreFactorRiesgo");
    if ($tipo.data("select2")) return;
    $tipo.select2({
        placeholder: "Buscar tipo de factor de riesgo...",
        allowClear: true,
        width: "100%",
        minimumInputLength: 0,
        ajax: {
            delay: 250,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                const base = `${getApiBaseUrl()}/apiV3/FactorDeRiesgo`;
                const url = term ? `${base}?q=${encodeURIComponent(term)}` : base;
                fetch(url)
                    .then(r => {
                        if (!r.ok) throw new Error(r.statusText);
                        return r.json();
                    })
                    .then(data => success({ results: data || [] }))
                    .catch(failure);
            },
            processResults: function (data) {
                const arr = data.results || data || [];
                return {
                    results: arr.map(item => {
                        const cod = item.Codigo != null ? String(item.Codigo) : "";
                        const desc = item.Descripcion || "";
                        const text = cod ? `${cod} - ${desc}` : desc;
                        return { id: cod, text: text || cod, descripcion: desc };
                    })
                };
            }
        }
    });
    $tipo.on("select2:select", function (e) {
        const d = e.params.data;
        if ($nombre.length && d.descripcion != null) {
            $nombre.val(d.descripcion);
        }
    });
    $tipo.on("select2:clear", function () {
        if ($nombre.length) $nombre.val("");
    });
}

// ── Tipo de Tecnología en Salud ───────────────────────────────────────────

function initTipoTecnologiaEnSaludSelect2(selector, placeholderText) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: placeholderText || "Buscar tipo de tecnología en salud...",
        allowClear: true,
        width: "100%",
        minimumInputLength: 0,
        ajax: {
            delay: 250,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                const base = `${getApiBaseUrl()}/apiV3/TipoTecnologiaEnSalud`;
                const url = term ? `${base}?q=${encodeURIComponent(term)}` : base;
                fetch(url)
                    .then(r => {
                        if (!r.ok) throw new Error(r.statusText);
                        return r.json();
                    })
                    .then(data => success({ results: data || [] }))
                    .catch(failure);
            },
            processResults: function (data) {
                const arr = data.results || data || [];
                return {
                    results: arr.map(item => {
                        const cod = item.Codigo != null ? String(item.Codigo) : "";
                        const desc = item.Descripcion || "";
                        const text = cod ? `${cod} - ${desc}` : desc;
                        return { id: cod, text: text || cod };
                    })
                };
            }
        }
    });
}

// ── Exportación principal ─────────────────────────────────────────────────

export function wireRdaceCatalogs() {
    // Medicamentos DCI
    initMedicamentosDCISelect2("#RDA_MedicamentoDCI");
    initMedicamentosDCISelect2("#RDACE_MedicamentoDCI");
    initMedicamentosDCISelect2("#RDACE_DescripcionComunMed", "#RDACE_CodigoMedicamento", "#RDACE_NombreMedicamento");

    // CUPS 1888
    initCups1888Select2("#RDACE_CodigoProcedimiento", "#RDACE_NombreProcedimiento");

    // Profesionales
    initProfesionalesSelect2("#RDA_NumDocProfesional", "#RDA_TipoDocProfesional");
    initProfesionalesSelect2("#RDACE_NumDocProfesional", "#RDACE_TipoDocProfesional");
    prefillLoggedInProfessional("#RDA_NumDocProfesional", "#RDA_TipoDocProfesional");
    prefillLoggedInProfessional("#RDACE_NumDocProfesional", "#RDACE_TipoDocProfesional");

    // Egreso y Remisión
    initEgresoRemisionSelect2("#RDACE_CondicionDestinoEgreso", "Buscar condición y destino al egreso...");

    // Catálogos RDA CE
    initRdaceCatalogSelect2("#RDACE_EntornoAtencion", "EntornoAtencion", "Buscar entorno de atención...");
    initRdaceCatalogSelect2("#RDACE_TipoAlergia", "TipoAlergia", "Tipo de alergia...");
    initRdaceCatalogSelect2("#RDACE_ParentescoFamiliar", "ParentescoFamiliar", "Parentesco...");
    initRdaceCatalogSelect2("#RDACE_TipoDiagPrincipalCIE10", "TipoDiagnosticoPrincipal", "Tipo diagnóstico principal...");
    initRdaceCatalogSelect2("#RDACE_UnidadMedidaDosis", "UnidadMedidaDosis", "Unidad de medida de dosis...");
    initRdaceCatalogSelect2("#RDACE_ViaAdministracionMed", "ViaAdministracionMedicamento", "Vía de administración...");
    initRdaceCatalogSelect2("#RDACE_DuracionUnidadTiempoMed", "UnidadTiempoDuracion", "Unidad de duración...");
    initRdaceCatalogSelect2("#RDACE_FrecuenciaUnidadTiempoMed", "UnidadTiempoFrecuencia", "Unidad de frecuencia...");
    initRdaceCatalogSelect2("#RDACE_FinalidadTecSaludMed", "FinalidadTecnologiaSalud", "Finalidad tecnología en salud...");
    initRdaceCatalogSelect2("#RDACE_FinalidadTecSaludProc", "FinalidadTecnologiaSalud", "Finalidad tecnología en salud...");
    initRdaceCatalogSelect2("#RDACE_FinalidadTecSaludOtra", "FinalidadTecnologiaSalud", "Finalidad tecnología en salud...");
    initRdaceCatalogSelect2("#RDACE_TipoTecSaludOtra", "OtraTecnologiaCategoria", "Categoría otra tecnología...");
    initRdaceCatalogSelect2("#RDACE_AlcanceIncapacidad", "AlcanceIncapacidad", "Alcance de la incapacidad...");

    // Factor de Riesgo
    initFactorDeRiesgoSelect2();

    // Tipo de Tecnología en Salud
    initTipoTecnologiaEnSaludSelect2("#RDACE_TipoTecSaludMed", "Buscar tipo de tecnología en salud...");
    initTipoTecnologiaEnSaludSelect2("#RDACE_TipoTecSaludProc", "Buscar tipo (ej. Procedimiento)...");
}

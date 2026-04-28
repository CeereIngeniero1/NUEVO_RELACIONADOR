/**
 * wireCieSelect2.js — Inicializa Select2 AJAX para campos CIE-10 y CIE-11
 * usados en formularios RDA Paciente y RDA Consulta Externa.
 *
 * Endpoints:
 *   GET /apiV3/icd11/search/:term  (CIE-11)
 *   GET /apiV3/Cie/:term           (CIE-10)
 */

import { getApiBaseUrl } from "../api/apiBaseUrl.js";

function authHeaders() {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const headers = {};
    if (token) headers.Authorization = token;
    return headers;
}

function initCIE11Select2(selector, codeSelector, descSelector) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: "Busque un diagnóstico CIE-11",
        width: "100%",
        dropdownAutoWidth: true,
        allowClear: true,
        minimumInputLength: 0,
        ajax: {
            delay: 500,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                const looksLikeCode = /^[A-Z0-9][A-Z0-9.\-]{1,15}$/i.test(term);
                const normalizeCode = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
                const termNorm = normalizeCode(term);
                const titleOf = (item) => {
                    const t = item && item.title;
                    if (typeof t === "string") return t;
                    if (t && typeof t === "object") return t["@value"] || t.value || "";
                    return "";
                };
                const toResult = (item) => ({
                    id: item.theCode || item.id,
                    text: String(titleOf(item) || "Sin descripción").replace(/<[^>]*>?/gm, ""),
                    code: item.theCode || item.id
                });
                // Permite buscar tanto por término como por código (incluye códigos cortos).
                const url = term.length === 0
                    ? `${getApiBaseUrl()}/apiV3/icd11/search/`
                    : `${getApiBaseUrl()}/apiV3/icd11/search/${encodeURIComponent(term)}`;
                const getJson = (u) => fetch(u, { headers: authHeaders() }).then(r => r.json()).catch(() => []);

                fetch(url, { headers: authHeaders() })
                    .then(r => r.json())
                    .then(async (data) => {
                        let list = Array.isArray(data) ? data : [];

                        // Fallback de UI: si consulta por código no devuelve nada,
                        // traer sugerencias y filtrar local por prefijo de código.
                        if (looksLikeCode && termNorm && list.length === 0) {
                            try {
                                const seedResp = await fetch(`${getApiBaseUrl()}/apiV3/icd11/search/`, { headers: authHeaders() });
                                const seedData = await seedResp.json();
                                const seedList = Array.isArray(seedData) ? seedData : [];
                                list = seedList.filter((item) => {
                                    const c = normalizeCode(item && (item.theCode || item.id));
                                    return c.startsWith(termNorm);
                                });
                            } catch (e) {
                                // silencioso: deja lista vacía
                            }
                        }

                        // Fallback fuerte: consultar varios prefijos y filtrar por código.
                        if (looksLikeCode && termNorm && list.length === 0) {
                            try {
                                const probes = Array.from(new Set([
                                    termNorm.slice(0, 1),
                                    termNorm.slice(0, 2),
                                    termNorm.slice(0, 3),
                                ].filter(Boolean)));
                                const buckets = await Promise.all(
                                    probes.map((p) => getJson(`${getApiBaseUrl()}/apiV3/icd11/search/${encodeURIComponent(p)}`))
                                );
                                const merged = buckets.flatMap((b) => (Array.isArray(b) ? b : []));
                                const seen = new Set();
                                list = merged.filter((item) => {
                                    const codeRaw = item && (item.theCode || item.id);
                                    const codeNorm = normalizeCode(codeRaw);
                                    if (!codeNorm || seen.has(codeNorm)) return false;
                                    const match = codeNorm.startsWith(termNorm) || codeNorm.includes(termNorm);
                                    if (match) seen.add(codeNorm);
                                    return match;
                                });
                            } catch (e) {
                                // silencioso
                            }
                        }

                        const results = (list || []).map(toResult);
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
        },
        templateResult: function (item) {
            if (!item || item.loading) return item && item.text ? item.text : "";
            const code = item.code ? String(item.code).trim() : "";
            const text = item.text ? String(item.text).trim() : "";
            return code ? `${code} - ${text}` : text;
        },
        templateSelection: function (selection) {
            const code = selection && selection.code ? String(selection.code).trim() : "";
            const text = selection && selection.text ? String(selection.text) : "";
            const t = code ? `${code} - ${text}` : text;
            return t.length > 72 ? t.substring(0, 72) + "..." : t;
        },
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

function normalizeCie11Code(v) {
    return String(v || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function resolveCie11ByCode(rawCode) {
    const code = String(rawCode || "").trim().toUpperCase();
    if (!code) return null;
    try {
        const direct = await fetch(`${getApiBaseUrl()}/apiV3/icd11/code/${encodeURIComponent(code)}`, { headers: authHeaders() })
            .then((r) => r.json())
            .catch(() => null);
        if (direct && direct.ok && direct.item) {
            return {
                code: String(direct.item.theCode || code).trim().toUpperCase(),
                text: String(direct.item.title || direct.item.theCode || code).replace(/<[^>]*>?/gm, "").trim(),
            };
        }
    } catch (_) {
        // fallback a search legacy
    }
    const resp = await fetch(`${getApiBaseUrl()}/apiV3/icd11/search/${encodeURIComponent(code)}`, { headers: authHeaders() });
    const data = await resp.json().catch(() => []);
    const list = Array.isArray(data) ? data : [];
    if (!list.length) return null;
    const wanted = normalizeCie11Code(code);
    const exact = list.find((x) => normalizeCie11Code(x && (x.theCode || x.id)) === wanted);
    const starts = list.find((x) => normalizeCie11Code(x && (x.theCode || x.id)).startsWith(wanted));
    const hit = exact || starts || list[0];
    if (!hit) return null;
    const c = String(hit.theCode || hit.id || code).trim().toUpperCase();
    const tRaw = hit.title;
    const t = (typeof tRaw === "string" ? tRaw : (tRaw && (tRaw["@value"] || tRaw.value) ? (tRaw["@value"] || tRaw.value) : ""))
        .replace(/<[^>]*>?/gm, "")
        .trim();
    return { code: c, text: t || c };
}

function wireManualCie11CodeLookup(inputSelector, selectSelector, descSelector) {
    const input = document.querySelector(inputSelector);
    const select = document.querySelector(selectSelector);
    if (!input || !select) return;

    let busy = false;
    const runLookup = async () => {
        if (busy) return;
        const raw = String(input.value || "").trim();
        if (!raw) return;
        busy = true;
        try {
            const hit = await resolveCie11ByCode(raw);
            if (hit) {
                input.value = hit.code;
                if (typeof $ !== "undefined" && $(select).data("select2")) {
                    const opt = new Option(`${hit.code} - ${hit.text}`, hit.code, true, true);
                    $(select).append(opt).trigger("change");
                    $(select).trigger({
                        type: "select2:select",
                        params: { data: { id: hit.code, code: hit.code, text: hit.text } },
                    });
                } else {
                    select.value = hit.code;
                }
                if (descSelector) {
                    const d = document.querySelector(descSelector);
                    if (d) d.value = hit.text;
                }
            } else {
                // Mantener el código digitado para guardado manual.
                input.value = raw.toUpperCase();
            }
        } catch (_) {
            input.value = raw.toUpperCase();
        } finally {
            busy = false;
        }
    };

    input.addEventListener("blur", runLookup);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            runLookup();
        }
    });
}

function initCIE10Select2(selector, descSelector) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: "Buscar diagnóstico CIE-10...",
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
                const url = `${getApiBaseUrl()}/apiV3/Cie/${encodeURIComponent(term)}`;
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
            return selection.text.length > 72 ? selection.text.substring(0, 72) + "..." : selection.text;
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
    initCIE11Select2("#RDA_AntecedenteFamiliarCIE11", "#RDA_AntecedenteFamiliarCIE11CodigoManual", "#RDA_AntecedenteFamiliarDescripcion");
    initCIE11Select2("#RDACE_AntecedenteFamiliarCIE11", "#RDACE_AntecedenteFamiliarCIE11CodigoManual", "#RDACE_AntecedenteFamiliarDescripcion");
    wireManualCie11CodeLookup("#RDA_AntecedenteFamiliarCIE11CodigoManual", "#RDA_AntecedenteFamiliarCIE11", "#RDA_AntecedenteFamiliarDescripcion");
    wireManualCie11CodeLookup("#RDACE_AntecedenteFamiliarCIE11CodigoManual", "#RDACE_AntecedenteFamiliarCIE11", "#RDACE_AntecedenteFamiliarDescripcion");
    // También habilitar búsqueda por código en campos estándar (ingreso/diagnóstico relacionado)
    wireManualCie11CodeLookup("#RDA_DiagnosticoIngresoCIE11Codigo", "#RDA_DiagnosticoIngresoCIE11Termino", null);
    wireManualCie11CodeLookup("#RDACE_DiagnosticoIngresoCIE11Codigo", "#RDACE_DiagnosticoIngresoCIE11Termino", null);
    wireManualCie11CodeLookup("#RDACE_DiagRelacionadoCIE11Codigo", "#RDACE_DiagRelacionadoCIE11Termino", null);

    // CIE-10
    initCIE10Select2("#RDA_AntecedenteSaludCIE10", "#RDA_AntecedenteSaludDescripcion");
    initCIE10Select2("#RDA_AntecedenteFamiliarCIE10", "#RDA_AntecedenteFamiliarDescripcion");
    initCIE10Select2("#RDACE_AntecedenteSaludCIE10", "#RDACE_AntecedenteSaludDescripcion");
    initCIE10Select2("#RDACE_AntecedenteFamiliarCIE10", "#RDACE_AntecedenteFamiliarDescripcion");
    initCIE10Select2("#RDACE_DiagPrincipalCIE10Codigo", "#RDACE_DiagPrincipalCIE10Nombre");
    initCIE10Select2("#RDACE_DiagRelacionadoCIE10Codigo", "#RDACE_DiagRelacionadoCIE10Nombre");
}

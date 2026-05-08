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

async function openCie11CatalogWindow() {
    const popup = window.open("", "_blank", "width=1100,height=760,resizable=yes,scrollbars=yes");
    if (!popup) {
        alert("No se pudo abrir la ventana. Verifique que el navegador permita ventanas emergentes.");
        return;
    }

    popup.document.write(`
        <!doctype html>
        <html lang="es">
        <head>
            <meta charset="utf-8" />
            <title>Catalogo CIE-11</title>
            <style>
                html, body { height: 100%; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 12px; color: #1f2937; display: flex; flex-direction: column; box-sizing: border-box; }
                h2 { margin: 0 0 8px; }
                .nota { margin: 0 0 10px; color: #b91c1c; font-weight: 700; font-size: 13px; }
                .nota-link { margin: 0 0 10px; font-size: 13px; }
                .nota-link a { color: #0b57d0; text-decoration: underline; }
                .toolbar { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
                input { padding: 8px; min-width: 340px; }
                .status { margin-left: auto; font-size: 12px; color: #6b7280; }
                .table-wrap { flex: 1 1 auto; min-height: 0; overflow: auto; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; font-size: 13px; }
                th { background: #f3f4f6; position: sticky; top: 0; }
                tbody tr:nth-child(even) { background: #fafafa; }
            </style>
        </head>
        <body>
            <h2>Catalogo completo CIE-11 (BD)</h2>
            <p class="nota">Recuerde: hasta la fecha estos son los CIE11CO. Conforme vayan actualizando e ingresando mas, se incorporaran en su base de datos.</p>
            <p class="nota-link">Esta es la pagina oficial del Ministerio para mas informacion o consultas de codigos: <a href="https://vulcano.ihcecol.gov.co/CodeSystem-ICD11CO" target="_blank" rel="noopener noreferrer">https://vulcano.ihcecol.gov.co/CodeSystem-ICD11CO</a></p>
            <div class="toolbar">
                <input id="filtro" type="text" placeholder="Filtrar por codigo o descripcion..." />
                <span id="status" class="status">Cargando...</span>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th style="width:160px;">Codigo</th><th>Descripcion</th></tr></thead>
                    <tbody id="rows"></tbody>
                </table>
            </div>
        </body>
        </html>
    `);
    popup.document.close();

    const statusEl = popup.document.getElementById("status");
    const rowsEl = popup.document.getElementById("rows");
    const filtroEl = popup.document.getElementById("filtro");

    try {
        const resp = await fetch(`${getApiBaseUrl()}/apiV3/icd11/catalog`, { headers: authHeaders() });
        const data = await resp.json();
        const items = Array.isArray(data && data.items) ? data.items : [];
        let filtered = items.slice();

        const render = () => {
            const html = filtered.map((it) => {
                const c = String(it && it.theCode ? it.theCode : "").trim();
                const t = String(it && it.title ? it.title : "").trim();
                return `<tr><td>${c}</td><td>${t}</td></tr>`;
            }).join("");
            rowsEl.innerHTML = html || `<tr><td colspan="2">Sin datos.</td></tr>`;
            statusEl.textContent = `${filtered.length} de ${items.length} registros`;
        };

        filtroEl.addEventListener("input", () => {
            const q = String(filtroEl.value || "").trim().toLowerCase();
            if (!q) {
                filtered = items.slice();
            } else {
                filtered = items.filter((it) => {
                    const c = String(it && it.theCode ? it.theCode : "").toLowerCase();
                    const t = String(it && it.title ? it.title : "").toLowerCase();
                    return c.includes(q) || t.includes(q);
                });
            }
            render();
        });

        render();
    } catch (e) {
        statusEl.textContent = "Error cargando catalogo";
        rowsEl.innerHTML = `<tr><td colspan="2">No fue posible consultar el catalogo CIE-11.</td></tr>`;
    }
}

function ensureCie11CatalogButton(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    if (target.dataset.cie11CatalogBtn === "1") return;
    target.dataset.cie11CatalogBtn = "1";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary btn-sm mt-1";
    btn.textContent = "Ver todos los CIE11CO aqui";
    btn.addEventListener("click", openCie11CatalogWindow);

    target.insertAdjacentElement("afterend", btn);
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

    ensureCie11CatalogButton(selector);
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

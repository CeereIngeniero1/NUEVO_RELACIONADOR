/**
 * selectsRda.js — Carga de selects de Prestador y Administrador de Plan de Beneficios.
 *
 * Consume endpoints:
 *   GET /apiV3/Empresas/   → poblar RDA_CodigoPrestador / RDACE_CodigoPrestador
 *   GET /apiV3/SSGSSS/     → poblar RDA_CodigoAdminPlanBeneficios / RDACE_CodigoAdminPlanBeneficios
 */

import { getApiBaseUrl } from "./apiBaseUrl.js";

/**
 * Select2 con búsqueda (misma idea que CIE / selects largos en Asignar RIPS V3).
 */
function aplicarSelect2AdministradorPlanBeneficios(selector) {
    if (typeof window.jQuery === "undefined") return;
    const $ = window.jQuery;
    const $el = $(selector);
    if (!$el.length) return;
    if ($el.data("select2")) {
        $el.select2("destroy");
    }
    $el.select2({
        width: "100%",
        dropdownAutoWidth: true,
        placeholder: "Buscar por código o nombre…",
        allowClear: false,
        language: {
            noResults: function () {
                return "Sin coincidencias";
            },
            searching: function () {
                return "Buscando…";
            },
        },
        templateSelection: function (data) {
            const t = data.text || "";
            const truncated = t.length > 55 ? `${t.substring(0, 55)}…` : t;
            return $("<span>").text(truncated);
        },
    });
}

/**
 * Select2 no siempre deja al listener nativo `change` sincronizado con data-* de la opción.
 * Enlazar change + select2:select (jQuery) tras init de Select2.
 */
function vincularNombreAdministradorPlanBeneficios(selectEl, inputEl) {
    if (!selectEl || !inputEl) return;
    const sync = () => {
        const opt = selectEl.options[selectEl.selectedIndex];
        const nombre =
            opt && opt.dataset && opt.dataset.nombre != null ? String(opt.dataset.nombre) : "";
        inputEl.value = nombre.trim() ? nombre : "";
    };
    if (typeof window.jQuery !== "undefined") {
        const $ = window.jQuery;
        $(selectEl)
            .off(".rdaAdminNombreSync")
            .on("change.rdaAdminNombreSync select2:select.rdaAdminNombreSync", sync);
    } else {
        selectEl.addEventListener("change", sync);
    }
    sync();
}

async function inicializarListaPrestadores() {
    const selectPrestador = document.getElementById("RDA_CodigoPrestador");
    const selectPrestadorCE = document.getElementById("RDACE_CodigoPrestador");
    if (!selectPrestador && !selectPrestadorCE) return;

    try {
        const respuesta = await fetch(`${getApiBaseUrl()}/apiV3/Empresas/`);
        if (!respuesta.ok) throw new Error("Error al obtener Empresas: " + respuesta.statusText);

        const empresas = await respuesta.json();

        const optionsHTML = ['<option value="">Seleccionar Prestador</option>'];
        empresas.forEach(emp => {
            const nombreMostrar = emp.NombreComercialEmpresa || emp.RazonSocialEmpresa || "";
            const documentoEmpresa = (emp.DocumentoEmpresa != null ? String(emp.DocumentoEmpresa).trim() : "");
            optionsHTML.push(
                `<option value="${emp.NroIDPrestador}" data-documento-empresa="${documentoEmpresa}">${emp.NroIDPrestador} - ${nombreMostrar}</option>`
            );
        });

        const html = optionsHTML.join("");
        if (selectPrestador) selectPrestador.innerHTML = html;
        if (selectPrestadorCE) selectPrestadorCE.innerHTML = html;

        // Prefill con empresa elegida al iniciar sesión.
        const empresaSesion = String(sessionStorage.getItem("empresaTrabajarExecuted") || "").trim();
        const preselect = (sel) => {
            if (!sel || !empresaSesion) return;
            if (String(sel.value || "").trim()) return; // no pisar selección existente

            // 1) intento directo por value (cuando empresaTrabajarExecuted coincide con NroIDPrestador)
            sel.value = empresaSesion;
            if (String(sel.value || "").trim() === empresaSesion) {
                sel.dispatchEvent(new Event("change", { bubbles: true }));
                return;
            }

            // 2) fallback por data-documento-empresa (cuando sesión guarda DocumentoEmpresa)
            const opt = Array.from(sel.options).find(o =>
                String(o.getAttribute("data-documento-empresa") || "").trim() === empresaSesion
            );
            if (opt && opt.value) {
                sel.value = String(opt.value).trim();
                sel.dispatchEvent(new Event("change", { bubbles: true }));
            }
        };
        preselect(selectPrestador);
        preselect(selectPrestadorCE);
    } catch (error) {
        console.error("[RDA V3] Error al cargar prestadores (Empresas):", error);
    }
}

async function inicializarListaAdministradores() {
    const selectAdmin = document.getElementById("RDA_CodigoAdminPlanBeneficios");
    const inputNombreAdmin = document.getElementById("RDA_NombreAdminPlanBeneficios");

    const selectAdminCE = document.getElementById("RDACE_CodigoAdminPlanBeneficios");
    const inputNombreAdminCE = document.getElementById("RDACE_NombreAdminPlanBeneficios");

    if (!selectAdmin && !selectAdminCE) return;

    try {
        const respuesta = await fetch(`${getApiBaseUrl()}/apiV3/SSGSSS/`);
        if (!respuesta.ok) throw new Error("Error al obtener Administradores: " + respuesta.statusText);

        const administradores = await respuesta.json();

        let optionsHTML = '<option value="">Seleccionar Administrador</option>';
        administradores.forEach(adm => {
            optionsHTML += `<option value="${adm.Codigo}" data-nombre="${adm.Nombre}">${adm.Codigo} - ${adm.Nombre}</option>`;
        });

        const rellenarOpciones = (sel) => {
            if (sel) sel.innerHTML = optionsHTML;
        };
        rellenarOpciones(selectAdmin);
        rellenarOpciones(selectAdminCE);

        aplicarSelect2AdministradorPlanBeneficios("#RDA_CodigoAdminPlanBeneficios");
        aplicarSelect2AdministradorPlanBeneficios("#RDACE_CodigoAdminPlanBeneficios");

        vincularNombreAdministradorPlanBeneficios(selectAdmin, inputNombreAdmin);
        vincularNombreAdministradorPlanBeneficios(selectAdminCE, inputNombreAdminCE);
    } catch (error) {
        console.error("[RDA V3] Error al cargar administradores (SSGSSS):", error);
    }
}

export async function inicializarSelectsRDA() {
    await inicializarListaPrestadores();
    await inicializarListaAdministradores();
}

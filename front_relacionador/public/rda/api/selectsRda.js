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
            optionsHTML.push(
                `<option value="${emp.NroIDPrestador}">${emp.NroIDPrestador} - ${nombreMostrar}</option>`
            );
        });

        const html = optionsHTML.join("");
        if (selectPrestador) selectPrestador.innerHTML = html;
        if (selectPrestadorCE) selectPrestadorCE.innerHTML = html;
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

        const setupSelect = (sel, inp) => {
            if (!sel) return;
            sel.innerHTML = optionsHTML;
            sel.addEventListener("change", function () {
                const selectedOption = sel.options[sel.selectedIndex];
                if (inp) {
                    inp.value = selectedOption.dataset.nombre || "";
                }
            });
        };

        setupSelect(selectAdmin, inputNombreAdmin);
        setupSelect(selectAdminCE, inputNombreAdminCE);

        aplicarSelect2AdministradorPlanBeneficios("#RDA_CodigoAdminPlanBeneficios");
        aplicarSelect2AdministradorPlanBeneficios("#RDACE_CodigoAdminPlanBeneficios");
    } catch (error) {
        console.error("[RDA V3] Error al cargar administradores (SSGSSS):", error);
    }
}

export async function inicializarSelectsRDA() {
    await inicializarListaPrestadores();
    await inicializarListaAdministradores();
}

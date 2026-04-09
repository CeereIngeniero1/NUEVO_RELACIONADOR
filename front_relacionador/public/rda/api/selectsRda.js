/**
 * selectsRda.js — Carga de selects de Prestador y Administrador de Plan de Beneficios.
 *
 * Consume endpoints:
 *   GET /apiV3/Empresas/   → poblar RDA_CodigoPrestador / RDACE_CodigoPrestador
 *   GET /apiV3/SSGSSS/     → poblar RDA_CodigoAdminPlanBeneficios / RDACE_CodigoAdminPlanBeneficios
 */

import { getServidor } from "./servidor.js";

async function inicializarListaPrestadores() {
    const selectPrestador = document.getElementById("RDA_CodigoPrestador");
    const selectPrestadorCE = document.getElementById("RDACE_CodigoPrestador");
    if (!selectPrestador && !selectPrestadorCE) return;

    try {
        const respuesta = await fetch(`http://${getServidor()}:3000/apiV3/Empresas/`);
        if (!respuesta.ok) throw new Error("Error al obtener Empresas: " + respuesta.statusText);

        const empresas = await respuesta.json();

        const optionsHTML = ['<option value="">Seleccionar Prestador</option>'];
        empresas.forEach(emp => {
            const nombreMostrar = emp.NombreComercialEmpresa || emp.RazonSocialEmpresa || "";
            optionsHTML.push(
                `<option value="${emp.NroIDPrestador}" data-nit="${emp.NroIDPrestador}" data-nombre="${nombreMostrar}">${emp.NroIDPrestador} - ${nombreMostrar}</option>`
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
        const respuesta = await fetch(`http://${getServidor()}:3000/apiV3/SSGSSS/`);
        if (!respuesta.ok) throw new Error("Error al obtener Administradores: " + respuesta.statusText);

        const administradores = await respuesta.json();

        let optionsHTML = '<option value="">Seleccionar Administrador</option>';
        administradores.forEach(adm => {
            optionsHTML += `<option value="${adm.Codigo}" data-nombre="${adm.Nombre}">${adm.Codigo} - ${adm.Nombre}</option>`;
        });

        const syncNombreAdmin = (sel, inp) => {
            if (!sel || !inp) return;
            const opt = sel.options[sel.selectedIndex];
            inp.value = opt?.dataset?.nombre || "";
        };

        const setupSelect = (sel, inp) => {
            if (!sel) return;
            sel.innerHTML = optionsHTML;
            sel.onchange = () => syncNombreAdmin(sel, inp);
            syncNombreAdmin(sel, inp);
        };

        setupSelect(selectAdmin, inputNombreAdmin);
        setupSelect(selectAdminCE, inputNombreAdminCE);
    } catch (error) {
        console.error("[RDA V3] Error al cargar administradores (SSGSSS):", error);
    }
}

export async function inicializarSelectsRDA() {
    await inicializarListaPrestadores();
    await inicializarListaAdministradores();
}

/**
 * ==========================================================================
 * RDA V3 — Resumen Digital de Atención (Resolución 1888)
 * ==========================================================================
 * Archivo independiente. NO depende de Asignar_RIPS V3.js
 * Toda la lógica vive dentro de un IIFE para evitar colisión de variables.
 *
 * Punto de contacto con el exterior: window.RDA
 * ==========================================================================
 */

(function () {
    "use strict";

    // ============================================
    // 1. BIOMETRÍA (Cálculo automático de IMC)
    // ============================================

    function inicializarBiometria() {
        const inputTalla = document.getElementById("TallaPaciente");
        const inputPeso = document.getElementById("PesoPaciente");
        const inputIMC = document.getElementById("IMCPaciente");

        function calcularIMC() {
            const tallaCm = parseFloat(inputTalla?.value);
            const pesoKg = parseFloat(inputPeso?.value);

            if (tallaCm > 0 && pesoKg > 0) {
                const tallaM = tallaCm / 100;
                const imc = pesoKg / (tallaM * tallaM);
                if (inputIMC) inputIMC.value = imc.toFixed(2);
            } else {
                if (inputIMC) inputIMC.value = "";
            }
        }

        inputTalla?.addEventListener("input", calcularIMC);
        inputPeso?.addEventListener("input", calcularIMC);
    }

    // ============================================
    // 2. CONTROL DE FLUJO RDA
    //    - Checkbox "¿Generar RDA?" activa/desactiva radios
    //    - Radios muestran la sección correspondiente
    // ============================================

    function inicializarControlRDA() {
        const checkGenerarRDA = document.getElementById("GenerarRDABase");
        const radiosTipoRDA = document.querySelectorAll('input[name="tipoRDA"]');
        const contenidoRDA = document.getElementById("ContenidoRDA");
        const seccionPaciente = document.getElementById("SeccionRDAPaciente");
        const seccionConsultaExt = document.getElementById("SeccionRDAConsultaExterna");

        // --- Toggle principal: Checkbox "¿Generar RDA?" ---
        function toggleRDA() {
            const activo = checkGenerarRDA?.checked || false;

            // Habilitar/deshabilitar radios
            radiosTipoRDA.forEach(function (radio) {
                radio.disabled = !activo;
                if (!activo) radio.checked = false;
            });

            // Si se desactiva, ocultar todo
            if (!activo) {
                contenidoRDA?.classList.add("d-none");
                seccionPaciente?.classList.add("d-none");
                seccionConsultaExt?.classList.add("d-none");
            }
        }

        // --- Cambio de tipo de RDA (radio buttons) ---
        function onTipoRDAChange(e) {
            const tipo = e.target.value; // "paciente" o "consultaExterna"

            // Mostrar contenedor principal
            contenidoRDA?.classList.remove("d-none");

            // Intercambiar secciones
            if (tipo === "paciente") {
                seccionPaciente?.classList.remove("d-none");
                seccionConsultaExt?.classList.add("d-none");
            } else if (tipo === "consultaExterna") {
                seccionConsultaExt?.classList.remove("d-none");
                seccionPaciente?.classList.add("d-none");
            }

            console.log(
                "%c[RDA] Sección activa: " + tipo,
                "color: #2196F3; font-weight: bold;"
            );
        }

        // --- Wiring de eventos ---
        checkGenerarRDA?.addEventListener("change", toggleRDA);

        radiosTipoRDA.forEach(function (radio) {
            radio.addEventListener("change", onTipoRDAChange);
        });

        // Estado inicial: desactivado
        toggleRDA();
    }

    // ============================================
    // 3. RDA PACIENTES — Listas dinámicas
    //    (Agregar / eliminar antecedentes, familiares, medicamentos)
    // ============================================

    // Almacenamiento interno (arrays)
    var listaAntecedentes = [];
    var listaAntecedentesFam = [];
    var listaMedicamentos = [];

    function inicializarListasDinamicas() {
        // --- Antecedentes de Salud ---
        var btnAntecedente = document.getElementById("RDA_BtnAgregarAntecedente");
        var inputCIE10 = document.getElementById("RDA_AntecedenteSaludCIE10");
        var inputDesc = document.getElementById("RDA_AntecedenteSaludDescripcion");
        var contenedorLista = document.getElementById("RDA_ListaAntecedentes");

        btnAntecedente?.addEventListener("click", function () {
            var codigo = inputCIE10?.value?.trim();
            if (!codigo) return;

            var item = { codigo: codigo, descripcion: inputDesc?.value || "" };
            listaAntecedentes.push(item);
            renderizarLista(contenedorLista, listaAntecedentes, "antecedente");

            if (inputCIE10) inputCIE10.value = "";
            if (inputDesc) inputDesc.value = "";
        });

        // --- Antecedentes Familiares ---
        var btnFam = document.getElementById("RDA_BtnAgregarAntecedenteFam");
        var selectParentesco = document.getElementById("RDA_ParentescoFamiliar");
        var inputFamCIE10 = document.getElementById("RDA_AntecedenteFamiliarCIE10");
        var inputFamDesc = document.getElementById(
            "RDA_AntecedenteFamiliarDescripcion"
        );
        var contenedorFam = document.getElementById(
            "RDA_ListaAntecedentesFamiliares"
        );

        btnFam?.addEventListener("click", function () {
            var parentesco = selectParentesco?.value;
            var codigo = inputFamCIE10?.value?.trim();
            if (!parentesco || !codigo) return;

            var textoParentesco =
                selectParentesco?.options[selectParentesco.selectedIndex]?.text || "";
            var item = {
                parentesco: parentesco,
                textoParentesco: textoParentesco,
                codigo: codigo,
                descripcion: inputFamDesc?.value || "",
            };
            listaAntecedentesFam.push(item);
            renderizarLista(contenedorFam, listaAntecedentesFam, "familiar");

            if (selectParentesco) selectParentesco.value = "";
            if (inputFamCIE10) inputFamCIE10.value = "";
            if (inputFamDesc) inputFamDesc.value = "";
        });

        // --- Medicamentos ---
        var btnMed = document.getElementById("RDA_BtnAgregarMedicamento");
        var inputDCI = document.getElementById("RDA_MedicamentoDCI");
        var inputObs = document.getElementById("RDA_MedicamentoObservacion");
        var contenedorMed = document.getElementById("RDA_ListaMedicamentos");

        btnMed?.addEventListener("click", function () {
            var nombre = inputDCI?.value?.trim();
            if (!nombre) return;

            var item = { nombre: nombre, observacion: inputObs?.value || "" };
            listaMedicamentos.push(item);
            renderizarLista(contenedorMed, listaMedicamentos, "medicamento");

            if (inputDCI) inputDCI.value = "";
            if (inputObs) inputObs.value = "";
        });
    }

    // --- Renderizado genérico de listas con badges ---
    function renderizarLista(contenedor, lista, tipo) {
        if (!contenedor) return;
        contenedor.innerHTML = "";

        lista.forEach(function (item, index) {
            var badge = document.createElement("span");
            badge.className =
                "badge bg-light text-dark border border-secondary me-1 mb-1 d-inline-flex align-items-center";
            badge.style.fontSize = "0.85em";

            var texto = "";
            if (tipo === "antecedente") {
                texto = item.codigo + (item.descripcion ? " - " + item.descripcion : "");
            } else if (tipo === "familiar") {
                texto =
                    item.textoParentesco +
                    " | " +
                    item.codigo +
                    (item.descripcion ? " - " + item.descripcion : "");
            } else if (tipo === "medicamento") {
                texto =
                    item.nombre + (item.observacion ? " (" + item.observacion + ")" : "");
            }

            badge.innerHTML =
                texto +
                ' <button type="button" class="btn-close btn-close-sm ms-2" style="font-size:0.6em;" data-idx="' +
                index +
                '"></button>';

            // Botón eliminar
            badge.querySelector("button").addEventListener("click", function () {
                lista.splice(index, 1);
                renderizarLista(contenedor, lista, tipo);
            });

            contenedor.appendChild(badge);
        });
    }

    // ============================================
    // 4. RDA CONSULTA EXTERNA — Campos adicionales
    // ============================================

    // TODO: Validaciones específicas de consulta externa
    // TODO: Control de campos obligatorios según 1888

    // ============================================
    // 5. GENERACIÓN JSON 1888
    // ============================================

    // TODO: Función que construye el JSON final según el tipo de RDA

    // ============================================
    // 6. API (fetch exclusivos de RDA)
    // ============================================

    // TODO: Guardar/consultar datos de la tabla Entidad1888

    // ============================================
    // 7. INICIALIZACIÓN
    // ============================================

    // Ejecutar inmediatamente (el script se carga al final del body, DOM ya existe)
    inicializarBiometria();
    inicializarControlRDA();
    inicializarListasDinamicas();

    console.log(
        "%c[RDA V3] Módulo cargado correctamente",
        "color: #4CAF50; font-weight: bold; font-size: 14px;"
    );


    // ============================================
    // 8. API PÚBLICA (punto de contacto controlado)
    // ============================================

    window.RDA = {
        // Se irán exponiendo funciones conforme se necesiten
        getAntecedentes: function () {
            return listaAntecedentes;
        },
        getAntecedentesFamiliares: function () {
            return listaAntecedentesFam;
        },
        getMedicamentos: function () {
            return listaMedicamentos;
        },
    };
})();

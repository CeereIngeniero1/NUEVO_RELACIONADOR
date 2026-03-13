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

            if (inputCIE10) $(inputCIE10).val("").trigger("change");
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
            if (inputFamCIE10) $(inputFamCIE10).val("").trigger("change");
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
    // 4. RDA CONSULTA EXTERNA — Listas dinámicas
    // ============================================

    var listaAntecedentesCE = [];
    var listaAntecedentesFamCE = [];
    var listaDiagRelacionados = [];
    var listaPrescripcionMed = [];
    var listaPrescripcionProc = [];
    var listaOtrasTec = [];

    function inicializarListasCE() {
        // --- Antecedentes de Salud RDACE ---
        var btnAntecedenteCE = document.getElementById("RDACE_BtnAgregarAntecedente");
        var inputCIE10CE = document.getElementById("RDACE_AntecedenteSaludCIE10");
        var inputDescCE = document.getElementById("RDACE_AntecedenteSaludDescripcion");
        var contenedorListaCE = document.getElementById("RDACE_ListaAntecedentes");

        btnAntecedenteCE?.addEventListener("click", function () {
            var codigo = inputCIE10CE?.value?.trim();
            if (!codigo) return;
            var item = { codigo: codigo, descripcion: inputDescCE?.value || "" };
            listaAntecedentesCE.push(item);
            renderizarLista(contenedorListaCE, listaAntecedentesCE, "antecedente");
            if (inputCIE10CE) $(inputCIE10CE).val("").trigger("change");
            if (inputDescCE) inputDescCE.value = "";
        });

        // --- Antecedentes Familiares RDACE ---
        var btnFamCE = document.getElementById("RDACE_BtnAgregarAntecedenteFam");
        var inputFamCIE10CE = document.getElementById("RDACE_AntecedenteFamiliarCIE10");
        var inputFamDescCE = document.getElementById("RDACE_AntecedenteFamiliarDescripcion");
        var contenedorFamCE = document.getElementById("RDACE_ListaAntecedentesFamiliares");

        btnFamCE?.addEventListener("click", function () {
            var codigo = inputFamCIE10CE?.value?.trim();
            if (!codigo) return;
            var item = { codigo: codigo, descripcion: inputFamDescCE?.value || "" };
            listaAntecedentesFamCE.push(item);
            renderizarLista(contenedorFamCE, listaAntecedentesFamCE, "antecedente");
            if (inputFamCIE10CE) $(inputFamCIE10CE).val("").trigger("change");
            if (inputFamDescCE) inputFamDescCE.value = "";
        });

        // --- Diagnósticos Relacionados ---
        var btnDiagRel = document.getElementById("RDACE_BtnAgregarDiagRelacionado");
        var inputDiagCIE10Cod = document.getElementById("RDACE_DiagRelacionadoCIE10Codigo");
        var inputDiagCIE10Nom = document.getElementById("RDACE_DiagRelacionadoCIE10Nombre");
        var inputDiagCIE11Cod = document.getElementById("RDACE_DiagRelacionadoCIE11Codigo");
        var inputDiagCIE11Term = document.getElementById("RDACE_DiagRelacionadoCIE11Termino");
        var contDiagRel = document.getElementById("RDACE_ListaDiagRelacionados");

        btnDiagRel?.addEventListener("click", function () {
            var codCIE10 = inputDiagCIE10Cod?.value?.trim();
            if (!codCIE10) return;

            listaDiagRelacionados.push({
                codigoCIE10: codCIE10,
                nombreCIE10: inputDiagCIE10Nom?.value || "",
                codigoCIE11: inputDiagCIE11Cod?.value?.trim() || "",
                terminoCIE11: inputDiagCIE11Term?.value?.trim() || ""
            });
            renderizarListaCE(contDiagRel, listaDiagRelacionados, "diagRel");

            if (inputDiagCIE10Cod) inputDiagCIE10Cod.value = "";
            if (inputDiagCIE10Nom) inputDiagCIE10Nom.value = "";
            if (inputDiagCIE11Cod) inputDiagCIE11Cod.value = "";
            if (inputDiagCIE11Term) inputDiagCIE11Term.value = "";
        });

        // --- Prescripción de Medicamentos ---
        var btnMedCE = document.getElementById("RDACE_BtnAgregarPrescripcionMed");
        var contMedCE = document.getElementById("RDACE_ListaPrescripcionMedicamentos");

        btnMedCE?.addEventListener("click", function () {
            var codigo = document.getElementById("RDACE_CodigoMedicamento")?.value?.trim();
            var nombre = document.getElementById("RDACE_NombreMedicamento")?.value?.trim();
            if (!codigo && !nombre) return;

            listaPrescripcionMed.push({
                tipo: document.getElementById("RDACE_TipoTecSaludMed")?.value || "M",
                codigo: codigo || "",
                nombre: nombre || "",
                dci: document.getElementById("RDACE_DescripcionComunMed")?.value || "",
                fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionMed")?.value || "",
                dosis: document.getElementById("RDACE_DosisOrdenadaMed")?.value || "",
                unidadDosis: document.getElementById("RDACE_UnidadMedidaDosis")?.value || "",
                via: document.getElementById("RDACE_ViaAdministracionMed")?.options[
                    document.getElementById("RDACE_ViaAdministracionMed")?.selectedIndex
                ]?.text || "",
                duracionCant: document.getElementById("RDACE_DuracionCantidadMed")?.value || "",
                duracionUnid: document.getElementById("RDACE_DuracionUnidadTiempoMed")?.value || "",
                frecuenciaCant: document.getElementById("RDACE_FrecuenciaCantidadMed")?.value || "",
                frecuenciaUnid: document.getElementById("RDACE_FrecuenciaUnidadTiempoMed")?.value || "",
                finalidad: document.getElementById("RDACE_FinalidadTecSaludMed")?.value || ""
            });
            renderizarListaCE(contMedCE, listaPrescripcionMed, "medCE");

            // Limpiar campos
            ["RDACE_CodigoMedicamento", "RDACE_NombreMedicamento", "RDACE_DescripcionComunMed",
                "RDACE_FechaPrescripcionMed", "RDACE_DosisOrdenadaMed"].forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el) el.value = "";
                });
            ["RDACE_UnidadMedidaDosis", "RDACE_ViaAdministracionMed", "RDACE_DuracionUnidadTiempoMed",
                "RDACE_FrecuenciaUnidadTiempoMed", "RDACE_FinalidadTecSaludMed"].forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el) el.value = "";
                });
            var durCant = document.getElementById("RDACE_DuracionCantidadMed");
            var freqCant = document.getElementById("RDACE_FrecuenciaCantidadMed");
            if (durCant) durCant.value = "";
            if (freqCant) freqCant.value = "";
        });

        // --- Prescripción de Procedimientos ---
        var btnProcCE = document.getElementById("RDACE_BtnAgregarPrescripcionProc");
        var contProcCE = document.getElementById("RDACE_ListaPrescripcionProcedimientos");

        btnProcCE?.addEventListener("click", function () {
            var codigo = document.getElementById("RDACE_CodigoProcedimiento")?.value?.trim();
            if (!codigo) return;

            listaPrescripcionProc.push({
                tipo: "Procedimiento",
                codigo: codigo,
                nombre: document.getElementById("RDACE_NombreProcedimiento")?.value || "",
                finalidad: document.getElementById("RDACE_FinalidadTecSaludProc")?.options[
                    document.getElementById("RDACE_FinalidadTecSaludProc")?.selectedIndex
                ]?.text || "",
                fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionProc")?.value || ""
            });
            renderizarListaCE(contProcCE, listaPrescripcionProc, "procCE");

            var codProc = document.getElementById("RDACE_CodigoProcedimiento");
            var nomProc = document.getElementById("RDACE_NombreProcedimiento");
            var finProc = document.getElementById("RDACE_FinalidadTecSaludProc");
            var fechProc = document.getElementById("RDACE_FechaPrescripcionProc");
            if (codProc) codProc.value = "";
            if (nomProc) nomProc.value = "";
            if (finProc) finProc.value = "";
            if (fechProc) fechProc.value = "";
        });

        // --- Otras Tecnologías en Salud ---
        var btnOtraCE = document.getElementById("RDACE_BtnAgregarOtraTecnologia");
        var contOtraCE = document.getElementById("RDACE_ListaOtrasTecnologias");

        btnOtraCE?.addEventListener("click", function () {
            var codigo = document.getElementById("RDACE_CodigoOtraTecnologia")?.value?.trim();
            if (!codigo) return;

            listaOtrasTec.push({
                tipo: document.getElementById("RDACE_TipoTecSaludOtra")?.options[
                    document.getElementById("RDACE_TipoTecSaludOtra")?.selectedIndex
                ]?.text || "",
                codigo: codigo,
                nombre: document.getElementById("RDACE_NombreOtraTecnologia")?.value || "",
                fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionOtra")?.value || "",
                finalidad: document.getElementById("RDACE_FinalidadTecSaludOtra")?.options[
                    document.getElementById("RDACE_FinalidadTecSaludOtra")?.selectedIndex
                ]?.text || ""
            });
            renderizarListaCE(contOtraCE, listaOtrasTec, "otraCE");

            var codOtra = document.getElementById("RDACE_CodigoOtraTecnologia");
            var nomOtra = document.getElementById("RDACE_NombreOtraTecnologia");
            var tipOtra = document.getElementById("RDACE_TipoTecSaludOtra");
            var fechOtra = document.getElementById("RDACE_FechaPrescripcionOtra");
            var finOtra = document.getElementById("RDACE_FinalidadTecSaludOtra");
            if (codOtra) codOtra.value = "";
            if (nomOtra) nomOtra.value = "";
            if (tipOtra) tipOtra.value = "";
            if (fechOtra) fechOtra.value = "";
            if (finOtra) finOtra.value = "";
        });
    }

    // --- Renderizado de listas para Consulta Externa ---
    function renderizarListaCE(contenedor, lista, tipo) {
        if (!contenedor) return;
        contenedor.innerHTML = "";

        lista.forEach(function (item, index) {
            var badge = document.createElement("span");
            badge.className =
                "badge bg-light text-dark border border-secondary me-1 mb-1 d-inline-flex align-items-center";
            badge.style.fontSize = "0.85em";

            var texto = "";
            if (tipo === "diagRel") {
                texto = item.codigoCIE10;
                if (item.nombreCIE10) texto += " - " + item.nombreCIE10;
                if (item.codigoCIE11) texto += " | CIE-11: " + item.codigoCIE11;
            } else if (tipo === "medCE") {
                texto = (item.codigo || "") + " " + (item.nombre || item.dci || "");
                if (item.dosis) texto += " | " + item.dosis + " " + (item.unidadDosis || "");
                if (item.via) texto += " | " + item.via;
            } else if (tipo === "procCE") {
                texto = item.codigo + " - " + (item.nombre || "");
                if (item.finalidad) texto += " | " + item.finalidad;
            } else if (tipo === "otraCE") {
                texto = (item.tipo || "") + " | " + item.codigo + " - " + (item.nombre || "");
            }

            badge.innerHTML =
                texto +
                ' <button type="button" class="btn-close btn-close-sm ms-2" style="font-size:0.6em;" data-idx="' +
                index +
                '"></button>';

            badge.querySelector("button").addEventListener("click", function () {
                lista.splice(index, 1);
                renderizarListaCE(contenedor, lista, tipo);
            });

            contenedor.appendChild(badge);
        });
    }

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
    inicializarListasCE();

    console.log(
        "%c[RDA V3] Módulo cargado correctamente",
        "color: #4CAF50; font-weight: bold; font-size: 14px;"
    );


    // ============================================
    // 8. API PÚBLICA (punto de contacto controlado)
    // ============================================

    window.RDA = {
        // RDA Paciente
        getAntecedentes: function () { return listaAntecedentes; },
        getAntecedentesFamiliares: function () { return listaAntecedentesFam; },
        getMedicamentos: function () { return listaMedicamentos; },
        // RDA Consulta Externa
        getAntecedentesCE: function () { return listaAntecedentesCE; },
        getAntecedentesFamiliaresCE: function () { return listaAntecedentesFamCE; },
        getDiagRelacionados: function () { return listaDiagRelacionados; },
        getPrescripcionMedicamentos: function () { return listaPrescripcionMed; },
        getPrescripcionProcedimientos: function () { return listaPrescripcionProc; },
        getOtrasTecnologias: function () { return listaOtrasTec; },
    };
})();

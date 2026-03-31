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

    function clearFieldById(id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (typeof $ !== "undefined" && $(el).data("select2")) {
            $(el).val(null).trigger("change");
        } else {
            el.value = "";
        }
    }

    function getSelectTextOrValue(id, preferText) {
        var el = document.getElementById(id);
        if (!el) return "";
        if (typeof $ !== "undefined" && $(el).data("select2")) {
            var d = $(el).select2("data")[0];
            if (d && preferText) return d.text || "";
            if (d && !preferText) return d.id != null ? String(d.id) : "";
        }
        if (preferText) return el.options[el.selectedIndex]?.text || "";
        return el.value || "";
    }

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
        const btnGenerar = document.getElementById("RDA_BtnGenerar");
        const radiosTipoRDA = document.querySelectorAll('input[name="tipoRDA"]');
        const contenidoRDA = document.getElementById("ContenidoRDA");
        const seccionPaciente = document.getElementById("SeccionRDAPaciente");
        const seccionConsultaExt = document.getElementById("SeccionRDAConsultaExterna");

        var lastTipoRDA = "paciente";

        function updateBtnGenerarLabel() {
            if (!btnGenerar || !checkGenerarRDA) return;
            var on = checkGenerarRDA.checked;
            btnGenerar.textContent = on ? "Desactivar RDA" : "Generar RDA";
            btnGenerar.classList.toggle("btn-success", !on);
            btnGenerar.classList.toggle("btn-secondary", on);
        }

        function onTipoRDAChange(e) {
            var tipo = e.target.value;
            lastTipoRDA = tipo;
            contenidoRDA?.classList.remove("d-none");
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

        function toggleRDA() {
            var activo = checkGenerarRDA?.checked || false;
            if (!activo) {
                radiosTipoRDA.forEach(function (r) {
                    if (r.checked) lastTipoRDA = r.value;
                });
            }
            radiosTipoRDA.forEach(function (radio) {
                radio.disabled = !activo;
                if (!activo) radio.checked = false;
            });
            if (!activo) {
                contenidoRDA?.classList.add("d-none");
                seccionPaciente?.classList.add("d-none");
                seccionConsultaExt?.classList.add("d-none");
            } else {
                var arr = Array.prototype.slice.call(radiosTipoRDA);
                var pick = null;
                for (var i = 0; i < arr.length; i += 1) {
                    if (arr[i].value === lastTipoRDA) {
                        pick = arr[i];
                        break;
                    }
                }
                if (!pick && arr.length) pick = arr[0];
                if (pick) {
                    pick.checked = true;
                    onTipoRDAChange({ target: pick });
                }
            }
            updateBtnGenerarLabel();
        }

        btnGenerar?.addEventListener("click", function () {
            if (!checkGenerarRDA) return;
            checkGenerarRDA.checked = !checkGenerarRDA.checked;
            checkGenerarRDA.dispatchEvent(new Event("change", { bubbles: true }));
        });

        checkGenerarRDA?.addEventListener("change", toggleRDA);

        radiosTipoRDA.forEach(function (radio) {
            radio.addEventListener("change", onTipoRDAChange);
        });

        toggleRDA();
        updateBtnGenerarLabel();
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
        var inputFamCIE11 = document.getElementById("RDA_AntecedenteFamiliarCIE11");
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
            var cie11Codigo = "";
            var cie11Termino = "";
            if (inputFamCIE11 && typeof $ !== "undefined" && $(inputFamCIE11).data("select2")) {
                var d11 = $(inputFamCIE11).select2("data")[0];
                if (d11) {
                    cie11Codigo = d11.id != null ? String(d11.id) : "";
                    cie11Termino = d11.text || "";
                }
            }
            var item = {
                parentesco: parentesco,
                textoParentesco: textoParentesco,
                codigo: codigo,
                descripcion: inputFamDesc?.value || "",
                cie11Codigo: cie11Codigo || undefined,
                cie11Termino: cie11Termino || undefined,
            };
            listaAntecedentesFam.push(item);
            renderizarLista(contenedorFam, listaAntecedentesFam, "familiar");

            if (selectParentesco) selectParentesco.value = "";
            if (inputFamCIE10) $(inputFamCIE10).val("").trigger("change");
            if (inputFamCIE11) $(inputFamCIE11).val(null).trigger("change");
            if (inputFamDesc) inputFamDesc.value = "";
        });

        // --- Medicamentos ---
        var btnMed = document.getElementById("RDA_BtnAgregarMedicamento");
        var selectDCI = document.getElementById("RDA_MedicamentoDCI");
        var inputObs = document.getElementById("RDA_MedicamentoObservacion");
        var contenedorMed = document.getElementById("RDA_ListaMedicamentos");

        btnMed?.addEventListener("click", function () {
            var nombre = "";
            if (selectDCI && typeof $ !== "undefined") {
                var selData = $(selectDCI).select2("data")[0];
                nombre = selData ? selData.text : ($(selectDCI).val() || "");
            } else {
                nombre = selectDCI?.value || "";
            }
            if (!nombre || !String(nombre).trim()) return;

            var item = { nombre: String(nombre).trim(), observacion: inputObs?.value || "" };
            listaMedicamentos.push(item);
            renderizarLista(contenedorMed, listaMedicamentos, "medicamento");

            if (selectDCI && typeof $ !== "undefined") $(selectDCI).val(null).trigger("change");
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
                if (item.cie11Codigo) {
                    texto += " | CIE-11: " + item.cie11Codigo + (item.cie11Termino ? " " + item.cie11Termino : "");
                }
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
    var listaMedicamentosCE = [];
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
        var selectParentCE = document.getElementById("RDACE_ParentescoFamiliar");
        var inputFamCIE10CE = document.getElementById("RDACE_AntecedenteFamiliarCIE10");
        var inputFamDescCE = document.getElementById("RDACE_AntecedenteFamiliarDescripcion");
        var contenedorFamCE = document.getElementById("RDACE_ListaAntecedentesFamiliares");

        btnFamCE?.addEventListener("click", function () {
            var codigo = inputFamCIE10CE?.value?.trim();
            if (!codigo) return;
            var parentescoVal = selectParentCE?.value || "";
            var parentescoTexto = selectParentCE?.options?.[selectParentCE.selectedIndex]?.text || "";
            var item = {
                parentesco: parentescoVal,
                textoParentesco: parentescoTexto,
                codigo: codigo,
                descripcion: inputFamDescCE?.value || ""
            };
            listaAntecedentesFamCE.push(item);
            renderizarLista(contenedorFamCE, listaAntecedentesFamCE, "antecedente");
            if (inputFamCIE10CE) $(inputFamCIE10CE).val("").trigger("change");
            if (inputFamDescCE) inputFamDescCE.value = "";
            if (selectParentCE && typeof $ !== "undefined" && $(selectParentCE).data("select2")) {
                $(selectParentCE).val(null).trigger("change");
            } else if (selectParentCE) selectParentCE.value = "";
        });

        // --- Medicamentos (Antecedentes Farmacológicos) RDACE ---
        var btnMedCE = document.getElementById("RDACE_BtnAgregarMedicamento");
        var selectDCICE = document.getElementById("RDACE_MedicamentoDCI");
        var inputObsCE = document.getElementById("RDACE_MedicamentoObservacion");
        var contenedorMedCE = document.getElementById("RDACE_ListaMedicamentos");

        btnMedCE?.addEventListener("click", function () {
            var nombre = "";
            if (selectDCICE && typeof $ !== "undefined") {
                var selData = $(selectDCICE).select2("data")[0];
                nombre = selData ? selData.text : ($(selectDCICE).val() || "");
            } else {
                nombre = selectDCICE?.value || "";
            }
            if (!nombre || !String(nombre).trim()) return;

            var item = { nombre: String(nombre).trim(), observacion: inputObsCE?.value || "" };
            listaMedicamentosCE.push(item);
            renderizarLista(contenedorMedCE, listaMedicamentosCE, "medicamento");

            if (selectDCICE && typeof $ !== "undefined") $(selectDCICE).val(null).trigger("change");
            if (inputObsCE) inputObsCE.value = "";
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

            var termCIE11 = "";
            if (inputDiagCIE11Term && typeof $ !== "undefined" && $(inputDiagCIE11Term).data("select2")) {
                var td = $(inputDiagCIE11Term).select2("data")[0];
                termCIE11 = td ? (td.text || "") : "";
            } else {
                termCIE11 = inputDiagCIE11Term?.value?.trim() || "";
            }
            listaDiagRelacionados.push({
                codigoCIE10: codCIE10,
                nombreCIE10: inputDiagCIE10Nom?.value || "",
                codigoCIE11: inputDiagCIE11Cod?.value?.trim() || "",
                terminoCIE11: termCIE11
            });
            renderizarListaCE(contDiagRel, listaDiagRelacionados, "diagRel");

            if (inputDiagCIE10Cod && typeof $ !== "undefined") $(inputDiagCIE10Cod).val(null).trigger("change");
            else if (inputDiagCIE10Cod) inputDiagCIE10Cod.value = "";
            if (inputDiagCIE10Nom) inputDiagCIE10Nom.value = "";
            if (inputDiagCIE11Cod) inputDiagCIE11Cod.value = "";
            if (inputDiagCIE11Term && typeof $ !== "undefined") $(inputDiagCIE11Term).val(null).trigger("change");
            else if (inputDiagCIE11Term) inputDiagCIE11Term.value = "";
        });

        // --- Prescripción de Medicamentos ---
        var btnMedCE = document.getElementById("RDACE_BtnAgregarPrescripcionMed");
        var contMedCE = document.getElementById("RDACE_ListaPrescripcionMedicamentos");

        btnMedCE?.addEventListener("click", function () {
            var codigo = document.getElementById("RDACE_CodigoMedicamento")?.value?.trim();
            var nombre = document.getElementById("RDACE_NombreMedicamento")?.value?.trim();
            if (!codigo && !nombre) return;

            var elDCI = document.getElementById("RDACE_DescripcionComunMed");
            var dciVal = (elDCI && typeof $ !== "undefined") ? $(elDCI).val() : (elDCI?.value || "");
            listaPrescripcionMed.push({
                tipo: document.getElementById("RDACE_TipoTecSaludMed")?.value || "M",
                codigo: codigo || "",
                nombre: nombre || "",
                dci: dciVal ? String(dciVal).trim() : "",
                fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionMed")?.value || "",
                dosis: document.getElementById("RDACE_DosisOrdenadaMed")?.value || "",
                unidadDosis: document.getElementById("RDACE_UnidadMedidaDosis")?.value || "",
                via: getSelectTextOrValue("RDACE_ViaAdministracionMed", true),
                duracionCant: document.getElementById("RDACE_DuracionCantidadMed")?.value || "",
                duracionUnid: document.getElementById("RDACE_DuracionUnidadTiempoMed")?.value || "",
                frecuenciaCant: document.getElementById("RDACE_FrecuenciaCantidadMed")?.value || "",
                frecuenciaUnid: document.getElementById("RDACE_FrecuenciaUnidadTiempoMed")?.value || "",
                finalidad: getSelectTextOrValue("RDACE_FinalidadTecSaludMed", false)
            });
            renderizarListaCE(contMedCE, listaPrescripcionMed, "medCE");

            // Limpiar campos
            if (elDCI && typeof $ !== "undefined") $(elDCI).val(null).trigger("change");
            ["RDACE_CodigoMedicamento", "RDACE_NombreMedicamento",
                "RDACE_FechaPrescripcionMed", "RDACE_DosisOrdenadaMed"].forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el) el.value = "";
                });
            ["RDACE_UnidadMedidaDosis", "RDACE_ViaAdministracionMed", "RDACE_DuracionUnidadTiempoMed",
                "RDACE_FrecuenciaUnidadTiempoMed", "RDACE_FinalidadTecSaludMed", "RDACE_TipoTecSaludMed"].forEach(clearFieldById);
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
                tipo: getSelectTextOrValue("RDACE_TipoTecSaludProc", true) || "Procedimiento",
                codigo: codigo,
                nombre: document.getElementById("RDACE_NombreProcedimiento")?.value || "",
                finalidad: getSelectTextOrValue("RDACE_FinalidadTecSaludProc", true),
                fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionProc")?.value || ""
            });
            renderizarListaCE(contProcCE, listaPrescripcionProc, "procCE");

            var codProc = document.getElementById("RDACE_CodigoProcedimiento");
            var nomProc = document.getElementById("RDACE_NombreProcedimiento");
            var fechProc = document.getElementById("RDACE_FechaPrescripcionProc");
            if (codProc && typeof $ !== "undefined") $(codProc).val(null).trigger("change");
            else if (codProc) codProc.value = "";
            if (nomProc) nomProc.value = "";
            clearFieldById("RDACE_TipoTecSaludProc");
            clearFieldById("RDACE_FinalidadTecSaludProc");
            if (fechProc) fechProc.value = "";
        });

        // --- Otras Tecnologías en Salud ---
        var btnOtraCE = document.getElementById("RDACE_BtnAgregarOtraTecnologia");
        var contOtraCE = document.getElementById("RDACE_ListaOtrasTecnologias");

        btnOtraCE?.addEventListener("click", function () {
            var codigo = document.getElementById("RDACE_CodigoOtraTecnologia")?.value?.trim();
            if (!codigo) return;

            listaOtrasTec.push({
                tipo: getSelectTextOrValue("RDACE_TipoTecSaludOtra", true),
                codigo: codigo,
                nombre: document.getElementById("RDACE_NombreOtraTecnologia")?.value || "",
                fechaPrescripcion: document.getElementById("RDACE_FechaPrescripcionOtra")?.value || "",
                finalidad: getSelectTextOrValue("RDACE_FinalidadTecSaludOtra", true)
            });
            renderizarListaCE(contOtraCE, listaOtrasTec, "otraCE");

            var codOtra = document.getElementById("RDACE_CodigoOtraTecnologia");
            var nomOtra = document.getElementById("RDACE_NombreOtraTecnologia");
            var fechOtra = document.getElementById("RDACE_FechaPrescripcionOtra");
            if (codOtra) codOtra.value = "";
            if (nomOtra) nomOtra.value = "";
            clearFieldById("RDACE_TipoTecSaludOtra");
            if (fechOtra) fechOtra.value = "";
            clearFieldById("RDACE_FinalidadTecSaludOtra");
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

    async function inicializarListaPrestadores() {
        const selectPrestador = document.getElementById("RDA_CodigoPrestador");
        const selectPrestadorCE = document.getElementById("RDACE_CodigoPrestador");
        if (!selectPrestador && !selectPrestadorCE) return;

        const servidor = localStorage.getItem('NombreEquipoServidor') || 'localhost';
        function escapeHtmlAttr(s) {
            if (s == null || s === "") return "";
            return String(s)
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;");
        }

        try {
            const respuesta = await fetch(`http://${servidor}:3000/apiV3/Empresas/`);
            if (!respuesta.ok) throw new Error("Error al obtener Empresas: " + respuesta.statusText);
            
            const empresas = await respuesta.json();
            
            const optionsHTML = ['<option value="">Seleccionar Prestador</option>'];
            empresas.forEach(emp => {
                const nombreMostrar = emp.NombreComercialEmpresa || emp.RazonSocialEmpresa || "";
                const reps = emp.NroIDPrestador != null ? String(emp.NroIDPrestador).trim() : "";
                if (!reps) return;
                const nitDoc =
                    emp.DocumentoEmpresa != null && String(emp.DocumentoEmpresa).trim()
                        ? String(emp.DocumentoEmpresa).trim()
                        : reps;
                optionsHTML.push(
                    `<option value="${escapeHtmlAttr(reps)}" data-nit="${escapeHtmlAttr(
                        nitDoc
                    )}" data-nombre="${escapeHtmlAttr(nombreMostrar)}">${escapeHtmlAttr(
                        reps
                    )} - ${escapeHtmlAttr(nombreMostrar)}</option>`
                );
            });

            if (selectPrestador) {
                selectPrestador.innerHTML = optionsHTML.join("");
            }
            if (selectPrestadorCE) {
                selectPrestadorCE.innerHTML = optionsHTML.join("");
            }

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

        const servidor = localStorage.getItem('NombreEquipoServidor') || 'localhost';
        try {
            const respuesta = await fetch(`http://${servidor}:3000/apiV3/SSGSSS/`);
            if (!respuesta.ok) throw new Error("Error al obtener Administradores: " + respuesta.statusText);
            
            const administradores = await respuesta.json();
            
            let optionsHTML = '<option value="">Seleccionar Administrador</option>';
            administradores.forEach(adm => {
                optionsHTML += `<option value="${adm.Codigo}" data-nombre="${adm.Nombre}">${adm.Codigo} - ${adm.Nombre}</option>`;
            });

            const setupSelect = (sel, inp) => {
                if (!sel) return;
                sel.innerHTML = optionsHTML;
                sel.addEventListener("change", function() {
                    const selectedOption = sel.options[sel.selectedIndex];
                    if (inp) {
                        inp.value = selectedOption.dataset.nombre || "";
                    }
                });
            };

            setupSelect(selectAdmin, inputNombreAdmin);
            setupSelect(selectAdminCE, inputNombreAdminCE);

        } catch (error) {
            console.error("[RDA V3] Error al cargar administradores (SSGSSS):", error);
        }
    }

    // TODO: Guardar/consultar datos de la tabla Entidad1888

    async function inicializarRDA() {
        // Ejecutamos secuencialmente para evitar saturar el canal de comunicación
        // y asegurar que ambas listas se carguen correctamente.
        await inicializarListaPrestadores();
        await inicializarListaAdministradores();
    }

    // ============================================
    // 7. INICIALIZACIÓN
    // ============================================

    // Ejecutar inmediatamente (el script se carga al final del body, DOM ya existe)
    inicializarBiometria();
    var rdaControlApi = inicializarControlRDA();
    inicializarListasDinamicas();
    inicializarListasCE();
    inicializarRDA();

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
        getMedicamentosCE: function () { return listaMedicamentosCE; },
        getDiagRelacionados: function () { return listaDiagRelacionados; },
        getPrescripcionMedicamentos: function () { return listaPrescripcionMed; },
        getPrescripcionProcedimientos: function () { return listaPrescripcionProc; },
        getOtrasTecnologias: function () { return listaOtrasTec; },
    };
})();

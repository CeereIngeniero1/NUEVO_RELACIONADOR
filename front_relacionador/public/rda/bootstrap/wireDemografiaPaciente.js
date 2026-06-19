/**
 * wireDemografiaPaciente.js — Select2 para datos demográficos del paciente
 * y lógica de edición / actualización (ActualizarPaciente).
 *
 * Campos: TipoDocumento, Sexo, IdentidadGenero, País Nacionalidad,
 * País Residencia, Municipio, ZonaTerritorial, Etnia, Discapacidad,
 * Ocupación + botón Actualizar Paciente.
 */

import { getApiBaseUrl } from "../api/apiBaseUrl.js";
import { validarPacienteDemografia, resolveIdOcupacionParaGuardar } from "../../shared/pacienteDemografiaValidation.js";

// ── Helpers genéricos para select2 demográfico ────────────────────────────

function initDemografiaSelect2(selector, placeholder, endpoint, mapFn) {
    if ($(selector).data("select2")) return;
    $(selector).select2({
        placeholder: placeholder,
        allowClear: true,
        minimumInputLength: 0,
        ajax: {
            delay: 250,
            transport: function (params, success, failure) {
                const term = (params.data.term || "").trim();
                const q = term.length ? term : endpoint.defaultQuery || "";
                fetch(`${getApiBaseUrl()}/apiV3/${endpoint.path}/${encodeURIComponent(q)}`)
                    .then(r => r.json())
                    .then(data => success({ results: data }))
                    .catch(failure);
            },
            processResults: function (data) {
                return {
                    results: (data.results || data).map(mapFn)
                };
            }
        }
    });
}

// ── Geografía ─────────────────────────────────────────────────────────────

function initGeografiaSelects() {
    const paisMapper = p => ({ id: p.IdPais1888, text: p.Nombre });
    const ciudadMapper = p => ({ id: p.IdCiudad1888, text: p.Nombre });

    initDemografiaSelect2(
        "#SelectNombrePaisNacionalidadBase",
        "Selecciona un país",
        { path: "Paises", defaultQuery: "a" },
        paisMapper
    );
    initDemografiaSelect2(
        "#SelectNombrePaisResidenciaBase",
        "Selecciona un país",
        { path: "Paises", defaultQuery: "a" },
        paisMapper
    );
    initDemografiaSelect2(
        "#SelectNombreMunicipioResidenciaBase",
        "Selecciona un Municipio",
        { path: "Ciudades", defaultQuery: "a" },
        ciudadMapper
    );
}

// ── Demografía ────────────────────────────────────────────────────────────

function initDemografiaSelectsFinos() {
    initDemografiaSelect2(
        "#TipoDocumentoBase",
        "Selecciona Tipo Documento",
        { path: "TipoDocumento", defaultQuery: "" },
        p => ({ id: p.IdTipodeDocumento, text: p.DescripciónTipoDocumento })
    );

    initDemografiaSelect2(
        "#SexoPaciente",
        "Selecciona Sexo",
        { path: "Sexo", defaultQuery: "" },
        p => ({ id: p.IdSexo, text: p.Sexo })
    );

    initDemografiaSelect2(
        "#IdentidadGeneroBase",
        "Selecciona Identidad de Género",
        { path: "identidadSexo", defaultQuery: "" },
        p => ({ id: p.IdSexoIdentidadGenero, text: p.DescripcionIdentidadGenero })
    );

    initDemografiaSelect2(
        "#ListaZonaTerritorialBase",
        "Selecciona Zona Territorial",
        { path: "ZonaTerritorial", defaultQuery: "U" },
        p => ({ id: p.IdZonaResidencia, text: p.DescripciónZonaResidencia })
    );

    initDemografiaSelect2(
        "#EtniaBase",
        "Selecciona Etnia",
        { path: "Etnia", defaultQuery: "" },
        p => ({ id: p.IdEtnia, text: p.DescripciónEtnia })
    );

    initDemografiaSelect2(
        "#DiscapacidadBase",
        "Selecciona DiscapacidadBase",
        { path: "Discapacidad", defaultQuery: "" },
        p => ({ id: p.IdDiscapacidad, text: p.DescripcionDiscapacidad })
    );

    initDemografiaSelect2(
        "#OcupacionBase",
        "Selecciona Ocupación",
        { path: "ocupacion", defaultQuery: "" },
        p => ({ id: p.IdOcupacion, text: p.DescripcionOcupacion })
    );
}

// ── Actualizar Paciente ───────────────────────────────────────────────────

function initActualizarPaciente(options = {}) {
    const { enableUpdate = true } = options;
    let modoEdicionPaciente = false;
    const inputFechaNacimiento = document.getElementById("FechaNacimientoBase");
    const inputEdadPaciente = document.getElementById("EdadPaciente");

    const calcularEdadDesdeTextoFecha = (valor) => {
        if (!valor) return "";
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) return "";
        const hoy = new Date();
        let edad = hoy.getFullYear() - fecha.getFullYear();
        const m = hoy.getMonth() - fecha.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;
        return String(edad < 0 ? 0 : edad);
    };

    const recalcularEdadPaciente = () => {
        if (!inputFechaNacimiento || !inputEdadPaciente) return;
        inputEdadPaciente.value = calcularEdadDesdeTextoFecha(inputFechaNacimiento.value);
    };

    if (inputFechaNacimiento && !inputFechaNacimiento.dataset.ageCalcBound) {
        inputFechaNacimiento.addEventListener("change", recalcularEdadPaciente);
        inputFechaNacimiento.addEventListener("input", recalcularEdadPaciente);
        inputFechaNacimiento.dataset.ageCalcBound = "1";
    }

    const camposPaciente = [
        "TipoDocumentoBase",
        "PrimerApellidoBase",
        "SegundoApellidoBase",
        "PrimerNombreBase",
        "SegundoNombreBase",
        "FechaNacimientoBase",
        "SexoPaciente",
        "IdentidadGeneroBase",
        "SelectNombrePaisNacionalidadBase",
        "TallaPaciente",
        "PesoPaciente",
        "SelectNombrePaisResidenciaBase",
        "SelectNombreMunicipioResidenciaBase",
        "ListaZonaTerritorialBase",
        "DireccionPaciente",
        "EtniaBase",
        "ComunidadEtnicaBase",
        "DiscapacidadBase",
        "TelefonoPaciente",
        "OcupacionBase",
        "NombreAlergenoBase"
    ];

    const txtNombreAlergeno = document.getElementById("NombreAlergenoBase");

    function setCamposPacienteDisabled(disabled) {
        camposPaciente.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = disabled;
        });
        const documento = document.getElementById("DocumentoPaciente");
        if (documento) documento.disabled = true;
        const edad = document.getElementById("EdadPaciente");
        if (edad) edad.disabled = true;
    }

    function obtenerPayloadPaciente() {
        recalcularEdadPaciente();
        const alergenoTexto = txtNombreAlergeno ? txtNombreAlergeno.value.trim() : "";
        const tieneAlergia = alergenoTexto.length > 0;
        return {
            IdTipoDocumento: parseInt(document.getElementById("TipoDocumentoBase").value) || null,
            Documento: document.getElementById("DocumentoPaciente").value.trim(),
            PrimerApellido: document.getElementById("PrimerApellidoBase").value.trim(),
            SegundoApellido: document.getElementById("SegundoApellidoBase").value.trim(),
            PrimerNombre: document.getElementById("PrimerNombreBase").value.trim(),
            SegundoNombre: document.getElementById("SegundoNombreBase").value.trim(),
            FechaNacimiento: document.getElementById("FechaNacimientoBase").value || null,
            Edad: document.getElementById("EdadPaciente").value.trim(),
            SexoBio: parseInt(document.getElementById("SexoPaciente").value) || null,
            SexoIdenti: parseInt(document.getElementById("IdentidadGeneroBase").value) || null,
            IdNacionalidad: parseInt(document.getElementById("SelectNombrePaisNacionalidadBase").value) || null,
            Talla: document.getElementById("TallaPaciente").value.trim(),
            Peso: document.getElementById("PesoPaciente").value.trim(),
            IdResidencia: parseInt(document.getElementById("SelectNombrePaisResidenciaBase").value) || null,
            IdMunicipio: parseInt(document.getElementById("SelectNombreMunicipioResidenciaBase").value) || null,
            IdZonaTerritorial: parseInt(document.getElementById("ListaZonaTerritorialBase").value) || null,
            Direccion: document.getElementById("DireccionPaciente").value.trim(),
            IdEtnia: parseInt(document.getElementById("EtniaBase").value) || null,
            ComunidadEtnica: document.getElementById("ComunidadEtnicaBase").value.trim(),
            IdDiscapacidad: parseInt(document.getElementById("DiscapacidadBase").value) || null,
            Telefono: document.getElementById("TelefonoPaciente").value.trim(),
            IdOcupacion: resolveIdOcupacionParaGuardar(
                document.getElementById("OcupacionBase")?.value
            ),
            Alergias: tieneAlergia ? "Si" : "No",
            Alergeno: tieneAlergia ? (alergenoTexto || null) : null
        };
    }

    function validarObligatoriosPaciente() {
        const { faltantes, corruptos } = validarPacienteDemografia();
        if (corruptos.length) {
            alert(
                "Hay campos con valor «null» (dato inválido de la base de datos). Corríjalos antes de guardar:\n- "
                + corruptos.join("\n- ")
            );
            return ["__corrupt__"];
        }
        if (faltantes.length) {
            alert(`Completa los campos obligatorios antes de guardar:\n- ${faltantes.join("\n- ")}`);
            return faltantes;
        }
        return [];
    }

    async function guardarPaciente() {
        const payload = obtenerPayloadPaciente();

        if (!payload.Documento) {
            alert("Debe existir un documento antes de actualizar.");
            return;
        }

        const faltantes = validarObligatoriosPaciente();
        if (faltantes.length > 0) {
            return;
        }

        try {
            const respuesta = await fetch(`${getApiBaseUrl()}/apiV3/ActualizarPaciente`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await respuesta.json();

            if (!respuesta.ok || !data.success) {
                throw new Error(data.message || data.error || "No se pudo actualizar el paciente");
            }

            alert(data.message || "Paciente actualizado correctamente");
            setCamposPacienteDisabled(true);
            modoEdicionPaciente = false;
            $("#BtnActualizarPaciente").html('<span class="icon">⟳</span> Actualizar datos paciente');
        } catch (error) {
            console.error("Error al guardar paciente:", error);
            alert(error.message || "Error al guardar los cambios");
        }
    }

    setCamposPacienteDisabled(true);
    modoEdicionPaciente = false;

    const btnActualizar = document.getElementById("BtnActualizarPaciente");
    if (!enableUpdate || !btnActualizar) {
        return;
    }

    $("#BtnActualizarPaciente").html('<span class="icon">⟳</span> Actualizar datos paciente');

    $("#BtnActualizarPaciente").click(async function () {
        const documento = document.getElementById("DocumentoPaciente").value.trim();

        if (!documento) {
            alert("Primero consulta un paciente.");
            return;
        }

        if (!modoEdicionPaciente) {
            setCamposPacienteDisabled(false);
            modoEdicionPaciente = true;
            $(this).html('<span class="icon">💾</span> Guardar cambios');
        } else {
            await guardarPaciente();
        }
    });
}

// ── Exportación ───────────────────────────────────────────────────────────

export function wireDemografiaPaciente(options = {}) {
    const { enableUpdate = true } = options;
    initGeografiaSelects();
    initDemografiaSelectsFinos();
    initActualizarPaciente({ enableUpdate });
}

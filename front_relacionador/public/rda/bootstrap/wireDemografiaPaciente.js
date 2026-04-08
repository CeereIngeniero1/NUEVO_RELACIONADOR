/**
 * wireDemografiaPaciente.js — Select2 para datos demográficos del paciente
 * y lógica de edición / actualización (ActualizarPaciente).
 *
 * Campos: TipoDocumento, Sexo, IdentidadGenero, País Nacionalidad,
 * País Residencia, Municipio, ZonaTerritorial, Etnia, Discapacidad,
 * Ocupación + botón Actualizar Paciente.
 */

import { getServidor } from "../api/servidor.js";

const servidor = getServidor();

/** Valor del select con Select2 (lectura fiable frente a document.getElementById().value). */
function parseSelect2Int(elementId) {
    const $el = $("#" + elementId);
    const raw = $el.length ? $el.val() : null;
    if (raw == null || raw === "") return null;
    const n = parseInt(String(raw), 10);
    return Number.isNaN(n) ? null : n;
}

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
                fetch(`http://${servidor}:3000/apiV3/${endpoint.path}/${encodeURIComponent(q)}`)
                    .then(r => {
                        if (!r.ok) throw new Error(`HTTP ${r.status}`);
                        return r.json();
                    })
                    .then(data => success({ results: data }))
                    .catch(failure);
            },
            processResults: function (data) {
                const rows = data.results || data;
                const list = Array.isArray(rows) ? rows : [];
                return {
                    results: list.map(mapFn).filter(r => r != null && r.id != null && r.id !== "")
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
        { path: "Ocupacion", defaultQuery: "" },
        p => ({ id: p.IdOcupacion, text: p.DescripcionOcupacion })
    );
}

// ── Actualizar Paciente ───────────────────────────────────────────────────

function initActualizarPaciente() {
    let modoEdicionPaciente = false;

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
        "OcupacionBase"
    ];

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
            IdOcupacion: parseSelect2Int("OcupacionBase")
        };
    }

    async function guardarPaciente() {
        const payload = obtenerPayloadPaciente();

        if (!payload.Documento) {
            alert("Debe existir un documento antes de actualizar.");
            return;
        }

        try {
            const respuesta = await fetch(`http://${servidor}:3000/apiV3/ActualizarPaciente`, {
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
            $("#OcupacionBase").trigger("change");
            $(this).html('<span class="icon">💾</span> Guardar cambios');
        } else {
            await guardarPaciente();
        }
    });
}

// ── Exportación ───────────────────────────────────────────────────────────

export function wireDemografiaPaciente() {
    initGeografiaSelects();
    initDemografiaSelectsFinos();
    initActualizarPaciente();
}

/**
 * Relleno de campos demográficos del paciente (misma lógica que Asignar_RIPS V3.js).
 */
(function (global) {
  function setSelect2Option(selector, text, id) {
    if (id == null || id === "") return;
    const idStr = String(id).trim();
    if (!idStr || idStr.toLowerCase() === "null" || idStr.toLowerCase() === "undefined") return;
    const n = parseInt(idStr, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    const textStr = text == null ? "" : String(text).trim();
    if (!textStr || textStr.toLowerCase() === "null" || textStr.toLowerCase() === "undefined") return;
    const $el = $(selector);
    if (!$el.length) return;
    const opt = new Option(textStr, idStr, true, true);
    $el.append(opt).trigger("change");
  }

  function setOcupacionPaciente(text, id) {
    const $el = $("#OcupacionBase");
    if (!$el.length) return;
    $el.empty();
    const idStr = id != null ? String(id).trim() : "";
    const idNum = parseInt(idStr, 10);
    const textStr = text != null ? String(text).trim() : "";
    const isCorrupt = (v) => {
      if (v == null) return false;
      const s = String(v).trim().toLowerCase();
      return s === "null" || s === "undefined";
    };
    const sinAsignar = (idNum === 1) || /^sin\s+asignar$/i.test(textStr);
    const idOk = Number.isFinite(idNum) && idNum > 0 && !isCorrupt(idStr);
    const textOk = textStr && !isCorrupt(textStr);
    if (idOk && textOk && !sinAsignar) {
      $el.append(new Option(textStr, String(idNum), true, true)).trigger("change");
    } else {
      $el.append(new Option("Sin asignar", "1", true, true)).trigger("change");
    }
  }

  function aplicarDatosPacienteV3(row) {
    if (!row) return;

    const nombrePaciente = document.getElementById("NombrePaciente");
    const documentoPaciente = document.getElementById("DocumentoPaciente");
    const edadPaciente = document.getElementById("EdadPaciente");
    const direccionPaciente = document.getElementById("DireccionPaciente");
    const telefonoPaciente = document.getElementById("TelefonoPaciente");
    const nombreAlergenoBase = document.getElementById("NombreAlergenoBase");

    const primerApellidoBase = document.getElementById("PrimerApellidoBase");
    const segundoApellidoBase = document.getElementById("SegundoApellidoBase");
    const primerNombreBase = document.getElementById("PrimerNombreBase");
    const segundoNombreBase = document.getElementById("SegundoNombreBase");
    const fechaNacimientoBase = document.getElementById("FechaNacimientoBase");
    const tallaPaciente = document.getElementById("TallaPaciente");
    const pesoPaciente = document.getElementById("PesoPaciente");
    const comunidadEtnicaBase = document.getElementById("ComunidadEtnicaBase");

    if (nombrePaciente) nombrePaciente.value = row.NombreCompletoPaciente || "";
    if (documentoPaciente) documentoPaciente.value = row.DocumentoPaciente || "";
    if (edadPaciente) edadPaciente.value = row.Edad != null ? row.Edad : "";

    setSelect2Option("#SexoPaciente", row.Sexo, row.IdSexo);
    setSelect2Option(
      "#IdentidadGeneroBase",
      row.IdentidadGeneroBase,
      row.IdSexoIdentidadGenero
    );
    setSelect2Option(
      "#SelectNombrePaisNacionalidadBase",
      row.NombrePaisNACIONALIDAD,
      row.IdPaisNacionalidad
    );
    setSelect2Option(
      "#SelectNombrePaisResidenciaBase",
      row.NombrePaisRecidencia,
      row.IdPaisRecidencia
    );
    setSelect2Option(
      "#SelectNombreMunicipioResidenciaBase",
      row.NombreMunicipioRecidencia,
      row.IdMunicipioRecidencia
    );
    setSelect2Option(
      "#ListaZonaTerritorialBase",
      row.DescripciónZonaResidencia,
      row.IdZonaResidencia
    );
    setSelect2Option("#EtniaBase", row.DescripciónEtnia, row.IdEtnia);
    setSelect2Option(
      "#DiscapacidadBase",
      row.DescripcionDiscapacidad,
      row.IdDiscapacidad
    );
    setOcupacionPaciente(row.DescripciónOcupación, row.IdOcupación);
    setSelect2Option(
      "#TipoDocumentoBase",
      row.DescripciTipoDocumento,
      row.IdTipodeDocumento
    );

    if (tallaPaciente) tallaPaciente.value = row.Talla != null ? row.Talla : "";
    if (pesoPaciente) pesoPaciente.value = row.Peso != null ? row.Peso : "";
    if (nombreAlergenoBase) {
      nombreAlergenoBase.value = String(row.Alergeno ?? "").trim();
    }
    if (comunidadEtnicaBase) {
      comunidadEtnicaBase.value = row.ComunidadEtnica != null ? row.ComunidadEtnica : "";
    }
    if (telefonoPaciente) telefonoPaciente.value = row.Tel != null ? row.Tel : "";
    if (direccionPaciente) direccionPaciente.value = row.Direccion != null ? row.Direccion : "";

    if (primerApellidoBase) primerApellidoBase.value = row.PrimerApellidoBase || "";
    if (segundoApellidoBase) segundoApellidoBase.value = row.SegundoApellidoBase || "";
    if (primerNombreBase) primerNombreBase.value = row.PrimerNombreBase || "";
    if (segundoNombreBase) segundoNombreBase.value = row.SegundoNombreBase || "";
    if (fechaNacimientoBase && row.FechaNacimientoBase) {
      fechaNacimientoBase.value = String(row.FechaNacimientoBase).slice(0, 16);
    }
  }

  function limpiarDatosPacienteV3() {
    const idsText = [
      "NombrePaciente",
      "DocumentoPaciente",
      "EdadPaciente",
      "DireccionPaciente",
      "TelefonoPaciente",
      "NombreAlergenoBase",
      "PrimerApellidoBase",
      "SegundoApellidoBase",
      "PrimerNombreBase",
      "SegundoNombreBase",
      "FechaNacimientoBase",
      "TallaPaciente",
      "PesoPaciente",
      "ComunidadEtnicaBase",
    ];
    idsText.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    const idsSelect2 = [
      "#SexoPaciente",
      "#IdentidadGeneroBase",
      "#SelectNombrePaisNacionalidadBase",
      "#SelectNombrePaisResidenciaBase",
      "#SelectNombreMunicipioResidenciaBase",
      "#ListaZonaTerritorialBase",
      "#EtniaBase",
      "#DiscapacidadBase",
      "#OcupacionBase",
      "#TipoDocumentoBase",
    ];
    idsSelect2.forEach((sel) => {
      const $el = $(sel);
      if ($el.length) {
        $el.val(null).trigger("change");
      }
    });
  }

  global.aplicarDatosPacienteV3 = aplicarDatosPacienteV3;
  global.setOcupacionPacienteV3 = setOcupacionPaciente;
  global.limpiarDatosPacienteV3 = limpiarDatosPacienteV3;
})(window);

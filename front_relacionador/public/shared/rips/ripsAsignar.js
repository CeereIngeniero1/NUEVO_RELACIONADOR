/**
 * Validación y armado de payload RIPS desde el formulario HC.
 */
(function (global) {
  const ID_BORRADOR = "__nueva__";

  function val(id) {
    const e = document.getElementById(id);
    return e ? String(e.value || "").trim() : "";
  }

  function requiere(v) {
    return v && v !== "Sin Seleccionar";
  }

  function facturaPresupuesto() {
    const porFactura = document.getElementById("BuscarPorFacturas");
    const porPresupuesto = document.getElementById("BuscarPorPresupuestos");
    let idFactura = null;
    let idPresupuesto = null;
    if (porFactura?.checked) {
      const v = val("FacturaARelacionar");
      idFactura = v && v !== "Sin Seleccionar" ? v : null;
      if (!idFactura) throw new Error("Seleccione una factura para relacionar el RIPS.");
    }
    if (porPresupuesto?.checked) {
      const v = val("PresupuestoARelacionar");
      idPresupuesto = v && v !== "Sin Seleccionar" ? v : null;
      if (!idPresupuesto) throw new Error("Seleccione un presupuesto para relacionar el RIPS.");
    }
    if (!porFactura?.checked && !porPresupuesto?.checked) {
      throw new Error("Active Facturas o Presupuestos en la selección de paciente.");
    }
    return { idFactura, idPresupuesto };
  }

  function tipoRipsActivo() {
    if (document.getElementById("hcRipsAP")?.checked) return "AP";
    if (document.getElementById("hcRipsAC")?.checked) return "AC";
    return "";
  }

  function validarYArmarPayload(idEvaluacionEntidad) {
    const tipo = tipoRipsActivo();
    if (!tipo) throw new Error("Seleccione tipo de RIPS (AC o AP).");
    const { idFactura, idPresupuesto } = facturaPresupuesto();

    if (tipo === "AC") {
      const faltan = [];
      if (!requiere(val("SelectTipoUsuarioRIPS"))) faltan.push("Tipo de usuario");
      if (!requiere(val("SelectEntidad"))) faltan.push("Entidad");
      if (!requiere(val("SelectModalidadGrupoServicioTecnologiaSalud")))
        faltan.push("Modalidad");
      if (!requiere(val("SelectGrupoServiciosAC"))) faltan.push("Grupo servicios");
      if (!requiere(val("SelectServiciosAC"))) faltan.push("Servicios");
      if (!requiere(val("SelectFinalidadTecnologiaSaludAC"))) faltan.push("Finalidad");
      if (!requiere(val("SelectCausaMotivoAtencion"))) faltan.push("Causa");
      if (!requiere(val("SelectTipoDiagnosticoPrincipalAC")))
        faltan.push("Tipo diagnóstico");
      if (!requiere(val("SelectConsultaRIPSAC1"))) faltan.push("Consulta RIPS 1");
      if (!requiere(val("SelectDiagnosticoRIPSAC1"))) faltan.push("Diagnóstico RIPS 1");
      if (faltan.length) throw new Error("Campos obligatorios AC: " + faltan.join(", "));

      let cups2 = val("SelectConsultaRIPSAC2");
      let cie2 = val("SelectDiagnosticoRIPSAC2");
      return {
        idEvaluacionEntidad,
        tipoRips: "AC",
        tipoUsuario: val("SelectTipoUsuarioRIPS"),
        entidad: val("SelectEntidad"),
        modalidadGrupoServicioTecSal: val("SelectModalidadGrupoServicioTecnologiaSalud"),
        grupoServicios: val("SelectGrupoServiciosAC"),
        codServicio: val("SelectServiciosAC"),
        finalidadTecnologiaSalud: val("SelectFinalidadTecnologiaSaludAC"),
        causaMotivoAtencion: val("SelectCausaMotivoAtencion"),
        tipoDiagnosticoPrincipal: val("SelectTipoDiagnosticoPrincipalAC"),
        viaIngresoServicioSalud: 0,
        cups1: val("SelectConsultaRIPSAC1"),
        cups2: cups2 || "0",
        cie1: val("SelectDiagnosticoRIPSAC1"),
        cie2: cie2 || "0",
        idFactura,
        idPresupuesto,
      };
    }

    const faltan = [];
    if (!requiere(val("SelectTipoUsurioRIPSAP"))) faltan.push("Tipo de usuario");
    if (!requiere(val("SelectEntidadAP"))) faltan.push("Entidad");
    if (!requiere(val("SelectViaIngresoServicioSaludAP"))) faltan.push("Vía ingreso");
    if (!requiere(val("SelectModalidadGrupoServicioTecSalAP"))) faltan.push("Modalidad");
    if (!requiere(val("SelectGrupoServiciosAP"))) faltan.push("Grupo servicios");
    if (!requiere(val("SelectServicioAP"))) faltan.push("Servicios");
    if (!requiere(val("SelectFinalidadTecnologiaSaludAP"))) faltan.push("Finalidad");
    if (!requiere(val("SelectProcedimientoRIPSAP1"))) faltan.push("Procedimiento RIPS 1");
    if (!requiere(val("SelectDiagnosticoRIPSAP1"))) faltan.push("Diagnóstico RIPS 1");
    if (faltan.length) throw new Error("Campos obligatorios AP: " + faltan.join(", "));

    let cups2 = val("SelectProcedimientoRIPSAP2");
    let cie2 = val("SelectDiagnosticoRIPSAP2");
    return {
      idEvaluacionEntidad,
      tipoRips: "AP",
      tipoUsuario: val("SelectTipoUsurioRIPSAP"),
      entidad: val("SelectEntidadAP"),
      modalidadGrupoServicioTecSal: val("SelectModalidadGrupoServicioTecSalAP"),
      grupoServicios: val("SelectGrupoServiciosAP"),
      codServicio: val("SelectServicioAP"),
      finalidadTecnologiaSalud: val("SelectFinalidadTecnologiaSaludAP"),
      causaMotivoAtencion: 0,
      tipoDiagnosticoPrincipal: 0,
      viaIngresoServicioSalud: val("SelectViaIngresoServicioSaludAP"),
      cups1: val("SelectProcedimientoRIPSAP1"),
      cups2: cups2 || "0",
      cie1: val("SelectDiagnosticoRIPSAP1"),
      cie2: cie2 || "0",
      idFactura,
      idPresupuesto,
    };
  }

  /** Solo validación de campos (sin id de evaluación). */
  function validarFormularioCompleto() {
    validarYArmarPayload(1);
    return true;
  }

  global.RipsAsignar = {
    ID_BORRADOR,
    tipoRipsActivo,
    validarYArmarPayload,
    validarFormularioCompleto,
    facturaPresupuesto,
  };
})(window);

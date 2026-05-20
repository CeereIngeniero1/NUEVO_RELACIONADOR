/**
 * RIPS por defecto del profesional (cargar al formulario HC + CRUD en modal).
 */
(function (global) {
  const { fetchLista } = global.RipsApi;

  function docProfesional() {
    return sessionStorage.getItem("documentousuariologeado") || "";
  }

  function selectByText(selectId, text) {
    const sel = document.getElementById(selectId);
    if (!sel || !text) return false;
    const t = String(text).trim();
    const opt = Array.from(sel.options).find((o) => {
      if (o.text === t) return true;
      const after = o.text.split(" - ")[1]?.trim();
      return after === t || o.text.includes(t);
    });
    if (opt) {
      if (global.RipsSelect2) {
        global.RipsSelect2.asignarValor(`#${selectId}`, opt.value, opt.text);
      } else {
        sel.value = opt.value;
      }
      return true;
    }
    const codigo = t.split(" - ")[0]?.trim() || t;
    if (global.RipsSelect2 && codigo) {
      global.RipsSelect2.asignarValor(`#${selectId}`, codigo, t);
      return true;
    }
    return false;
  }

  function tipoRipsNumero() {
    if (document.getElementById("hcRipsAP")?.checked) return { n: 2, nombre: "AP" };
    if (document.getElementById("hcRipsAC")?.checked) return { n: 1, nombre: "AC" };
    return null;
  }

  async function aplicarPorDefectoAC(row) {
    selectByText("SelectTipoUsuarioRIPS", row.TipoDeUsuario);
    selectByText("SelectEntidad", row.Entidad);
    selectByText("SelectModalidadGrupoServicioTecnologiaSalud", row.ModalidadGrupoServicioTecnologiaEnSalud);
    selectByText("SelectGrupoServiciosAC", row.GrupoServicios);
    selectByText("SelectServiciosAC", row.CodigoServicio);
    selectByText("SelectFinalidadTecnologiaSaludAC", row.FinalidadTecnologiaSalud);
    selectByText("SelectCausaMotivoAtencion", row.CausaMotivoAtencion);
    selectByText("SelectTipoDiagnosticoPrincipalAC", row.TipoDiagnosticoPrincipal);
    selectByText("SelectConsultaRIPSAC1", row.Diagnostico1);
    selectByText("SelectConsultaRIPSAC2", row.Diagnostico2);
    selectByText("SelectDiagnosticoRIPSAC1", row.Procedimiento1);
    selectByText("SelectDiagnosticoRIPSAC2", row.Procedimiento2);
  }

  async function aplicarPorDefectoAP(row) {
    selectByText("SelectTipoUsurioRIPSAP", row.TipoDeUsuario);
    selectByText("SelectEntidadAP", row.Entidad);
    selectByText("SelectViaIngresoServicioSaludAP", row.ViaIngresoServicioSalud);
    selectByText("SelectModalidadGrupoServicioTecSalAP", row.ModalidadGrupoServicioTecnologiaEnSalud);
    selectByText("SelectGrupoServiciosAP", row.GrupoServicios);
    selectByText("SelectServicioAP", row.CodigoServicio);
    selectByText("SelectFinalidadTecnologiaSaludAP", row.FinalidadTecnologiaSalud);
    selectByText("SelectProcedimientoRIPSAP1", row.Diagnostico1);
    selectByText("SelectProcedimientoRIPSAP2", row.Diagnostico2);
    selectByText("SelectDiagnosticoRIPSAP1", row.Procedimiento1);
    selectByText("SelectDiagnosticoRIPSAP2", row.Procedimiento2);
  }

  async function cargarAlFormulario() {
    const tipo = tipoRipsNumero();
    if (!tipo) {
      Swal.fire({
        icon: "warning",
        title: "Tipo RIPS",
        text: "Seleccione AC o AP antes de cargar RIPS por defecto.",
      });
      return;
    }
    const doc = docProfesional();
    const resp = await fetch(
      `${getApiBaseUrl()}/apiV3/ConsultarRIPSPorDefecto/${encodeURIComponent(doc)}/${tipo.n}`
    );
    if (!resp.ok) throw new Error("No se pudo consultar RIPS por defecto.");
    const rows = await resp.json();
    if (!rows.length) {
      Swal.fire({
        icon: "info",
        title: "Sin RIPS por defecto",
        text: `No hay RIPS ${tipo.nombre} por defecto para este profesional.`,
      });
      return;
    }
    if (tipo.nombre === "AC") await aplicarPorDefectoAC(rows[0]);
    else await aplicarPorDefectoAP(rows[0]);
    Swal.fire({
      icon: "success",
      title: "Cargado",
      text: `Valores RIPS ${tipo.nombre} por defecto aplicados al formulario.`,
      timer: 2000,
      showConfirmButton: false,
    });
  }

  function togglePanelesModalPorDefecto() {
    const v = document.getElementById("SelectTipoRIPSPorDefecto")?.value;
    const ac = document.getElementById("ACPorDefecto");
    const ap = document.getElementById("APPorDefecto");
    if (ac) ac.classList.toggle("d-none", v !== "1");
    if (ap) ap.classList.toggle("d-none", v !== "2");
  }

  async function guardarDesdeModal() {
    const tipo = document.getElementById("SelectTipoRIPSPorDefecto")?.value;
    if (!tipo) {
      Swal.fire({ icon: "warning", text: "Seleccione tipo AC o AP en el modal." });
      return;
    }
    let datos = {
      DocumentoProfesional: docProfesional(),
      TipoRIPS: tipo,
    };
    if (tipo === "1") {
      datos = {
        ...datos,
        TipoUsuario: document.getElementById("SelectPorDefectoTipoUsuarioRIPS")?.value,
        Entidad: document.getElementById("SelectPorDefectoEntidadAC")?.value,
        ViaIngresoServicioSalud: "",
        ModalidadGrupoServicioTecSal: document.getElementById(
          "SelectPorDefectoModalidadGrupoServicioTecSalAC"
        )?.value,
        GrupoServicio: document.getElementById("SelectPoDefectoGrupoServiciosAC")?.value,
        CodigoServicio: document.getElementById("SelectPorDefectoCodigoServicioAC")?.value,
        FinalidadTecnologiaSalud: document.getElementById(
          "SelectPorDefectoFinalidadTecnologiaSaludAC"
        )?.value,
        CausaMotivoAtencion: document.getElementById("SelectPorDefectoCausaMotivoAtencionAC")
          ?.value,
        TipoDiagnosticoPrincipal: document.getElementById(
          "SelectPorDefectoTipoDiagnosticoPrincipalAC"
        )?.value,
        ConsultaRIPS1: document.getElementById("SelectPorDefectoConsultaRIPS1AC")?.value,
        ConsultaRIPS2: document.getElementById("SelectPorDefectoConsultaRIPS2AC")?.value,
        DiagnosticoRIPS1: document.getElementById("SelectPorDefectoDiagnosticoRIPSAC1")?.value,
        DiagnosticoRIPS2: document.getElementById("SelectPorDefectoDiagnosticoRIPSAC2")?.value,
      };
    } else {
      datos = {
        ...datos,
        TipoUsuario: document.getElementById("SelectPorDefectoTipoUsuarioRIPSAP")?.value,
        Entidad: document.getElementById("SelectPorDefectoEntidadAP")?.value,
        ViaIngresoServicioSalud: document.getElementById(
          "SelectPorDefectoViaIngresoServicioSaludAP"
        )?.value,
        ModalidadGrupoServicioTecSal: document.getElementById(
          "SelectPorDefectoModalidadGrupoServicioTecSalAP"
        )?.value,
        GrupoServicio: document.getElementById("SelectPorDefectoGrupoServiciosAP")?.value,
        CodigoServicio: document.getElementById("SelectPorDefectoCodigoServicioAP")?.value,
        FinalidadTecnologiaSalud: document.getElementById(
          "SelectPorDefectoFinalidadTecnologiaSaludAP"
        )?.value,
        CausaMotivoServicioSalud: document.getElementById(
          "SelectPorDefectoViaIngresoServicioSaludAP"
        )?.value,
        ConsultaRIPS1: document.getElementById("SelectPorDefectoProcedimientoRIPSAP1")?.value,
        ConsultaRIPS2: document.getElementById("SelectPorDefectoProcedimientoRIPSAP2")?.value,
        DiagnosticoRIPS1: document.getElementById("SelectPorDefectoDiagnosticoRIPSAP1")?.value,
        DiagnosticoRIPS2: document.getElementById("SelectPorDefectoDiagnosticoRIPSAP2")?.value,
      };
    }
    const resp = await fetch(`${getApiBaseUrl()}/apiV3/GuardarRIPSPorDefecto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.message || "Error al guardar RIPS por defecto.");
    Swal.fire({ icon: "success", title: "Guardado", text: "RIPS por defecto guardado." });
  }

  function initPorDefectoHc() {
    document.getElementById("BotonCargarRIPSPorDefecto")?.addEventListener("click", () => {
      cargarAlFormulario().catch((e) => {
        Swal.fire({ icon: "error", title: "RIPS por defecto", text: e.message });
      });
    });
    document
      .getElementById("SelectTipoRIPSPorDefecto")
      ?.addEventListener("change", togglePanelesModalPorDefecto);
    document.getElementById("BotonGuardarRIPSPorDefecto")?.addEventListener("click", () => {
      guardarDesdeModal().catch((e) =>
        Swal.fire({ icon: "error", title: "Error", text: e.message })
      );
    });
    togglePanelesModalPorDefecto();
  }

  global.RipsPorDefecto = {
    initPorDefectoHc,
    cargarAlFormulario,
  };
})(window);

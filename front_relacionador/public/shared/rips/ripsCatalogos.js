/**
 * Carga catálogos RIPS (AC/AP) — mismos endpoints y campos que Asignar RIPS V3.
 */
(function (global) {
  const { fetchLista } = global.RipsApi;

  function el(id) {
    return document.getElementById(id);
  }

  function llenarDesdeArray(select, rows, mapFn, placeholder) {
    if (!select) return;
    if (select.id && global.RipsSelect2) {
      global.RipsSelect2.destruir(`#${select.id}`);
    }
    select.innerHTML = "";
    const def = document.createElement("option");
    def.value = "";
    def.textContent = placeholder || "Sin Seleccionar";
    select.appendChild(def);
    (rows || []).forEach((row) => {
      const m = mapFn(row);
      if (m == null || m.value == null || m.value === "" || !m.text) return;
      const opt = document.createElement("option");
      opt.value = m.value;
      opt.textContent = m.text;
      if (m.extra) {
        Object.keys(m.extra).forEach((k) => opt.setAttribute(k, m.extra[k]));
      }
      select.appendChild(opt);
    });
  }

  async function cargarSeguro(nombre, fn) {
    try {
      await fn();
    } catch (err) {
      console.error(`[RipsCatalogos] ${nombre}:`, err);
    }
  }

  async function cargarTiposUsuario(selectId) {
    const rows = await fetchLista("/apiV3/TipodeRips");
    llenarDesdeArray(el(selectId), rows, (r) => ({
      value: r.IdTipoRips,
      text: r.TipoRips,
    }));
  }

  async function cargarEntidades(selectId) {
    const rows = await fetchLista("/apiV3/Entidad");
    rows.sort((a, b) =>
      String(a.NombreCompletoPaciente || "").localeCompare(
        String(b.NombreCompletoPaciente || "")
      )
    );
    llenarDesdeArray(el(selectId), rows, (r) => ({
      value: r.DocumentoEntidad,
      text: r.NombreCompletoPaciente,
      extra: { "data-category": r["IdTipoRips"] },
    }));
  }

  async function cargarModalidad(selectId) {
    const rows = await fetchLista("/apiV3/ModalidadAtencion");
    llenarDesdeArray(el(selectId), rows, (r) => ({
      value: r.IdModalidadAtencion,
      text: r.NombreModalidadAtencion,
    }));
  }

  async function cargarGrupoServicios(selectId) {
    const rows = await fetchLista("/apiV3/GrupoServicios");
    llenarDesdeArray(el(selectId), rows, (r) => ({
      value: r.IdGrupoServicios,
      text: r.NombreGrupoServicios,
    }));
  }

  async function cargarServicios(selectId) {
    const rows = await fetchLista("/apiV3/Servicios");
    llenarDesdeArray(el(selectId), rows, (r) => ({
      value: r["Id Servicios"],
      text: r["Nombre Servicios"],
    }));
  }

  /** V3: GET /apiV3/FinalidadV2/AC o /AP */
  async function cargarFinalidad(selectId, tipoRips) {
    const rows = await fetchLista(
      `/apiV3/FinalidadV2/${encodeURIComponent(tipoRips)}`
    );
    rows.sort((a, b) =>
      String(a.NombreRIPSFinalidadConsultaVersion2 || "").localeCompare(
        String(b.NombreRIPSFinalidadConsultaVersion2 || "")
      )
    );
    llenarDesdeArray(el(selectId), rows, (r) => ({
      value: r.IdFinalidadConsulta,
      text: r.NombreRIPSFinalidadConsultaVersion2,
    }));
  }

  /** V3: GET /apiV3/CausaExterna */
  async function cargarCausa(selectId) {
    const rows = await fetchLista("/apiV3/CausaExterna");
    rows.sort((a, b) =>
      String(a.NombreRIPSCausaExternaVersion2 || "").localeCompare(
        String(b.NombreRIPSCausaExternaVersion2 || "")
      )
    );
    llenarDesdeArray(el(selectId), rows, (r) => ({
      value: r.IdRIPSCausaExternaVersion2,
      text: r.NombreRIPSCausaExternaVersion2,
    }));
  }

  /** V3: GET /apiV3/DXPrincipal — value = CódigoTipodeDiagnósticoPrincipal */
  async function cargarTipoDiagnostico(selectId) {
    const rows = await fetchLista("/apiV3/DXPrincipal");
    rows.sort((a, b) =>
      String(a.DescripcionTipodeDiagnósticoPrincipal || "").localeCompare(
        String(b.DescripcionTipodeDiagnósticoPrincipal || "")
      )
    );
    llenarDesdeArray(el(selectId), rows, (r) => ({
      value: r.CódigoTipodeDiagnósticoPrincipal,
      text: r.DescripcionTipodeDiagnósticoPrincipal,
    }));
  }

  /** V3: GET /apiV3/ViaIngresoUsuario */
  async function cargarViaIngreso(selectId) {
    const rows = await fetchLista("/apiV3/ViaIngresoUsuario");
    rows.sort((a, b) =>
      String(a.NombreViaIngresoUsuario || "").localeCompare(
        String(b.NombreViaIngresoUsuario || "")
      )
    );
    llenarDesdeArray(el(selectId), rows, (r) => ({
      value: r.IdViaIngresoUsuario,
      text: r.NombreViaIngresoUsuario,
    }));
  }

  async function cargarCatalogosAC() {
    await cargarSeguro("tipo usuario AC", () => cargarTiposUsuario("SelectTipoUsuarioRIPS"));
    await cargarSeguro("entidad AC", () => cargarEntidades("SelectEntidad"));
    await cargarSeguro("modalidad AC", () =>
      cargarModalidad("SelectModalidadGrupoServicioTecnologiaSalud")
    );
    await cargarSeguro("grupo servicios AC", () =>
      cargarGrupoServicios("SelectGrupoServiciosAC")
    );
    await cargarSeguro("servicios AC", () => cargarServicios("SelectServiciosAC"));
    await cargarSeguro("finalidad AC", () =>
      cargarFinalidad("SelectFinalidadTecnologiaSaludAC", "AC")
    );
    await cargarSeguro("causa AC", () => cargarCausa("SelectCausaMotivoAtencion"));
    await cargarSeguro("tipo dx AC", () =>
      cargarTipoDiagnostico("SelectTipoDiagnosticoPrincipalAC")
    );
    if (global.RipsSelect2) global.RipsSelect2.inicializarFormularioHc("AC");
  }

  async function cargarCatalogosAP() {
    await cargarSeguro("tipo usuario AP", () =>
      cargarTiposUsuario("SelectTipoUsurioRIPSAP")
    );
    await cargarSeguro("entidad AP", () => cargarEntidades("SelectEntidadAP"));
    await cargarSeguro("via ingreso AP", () =>
      cargarViaIngreso("SelectViaIngresoServicioSaludAP")
    );
    await cargarSeguro("modalidad AP", () =>
      cargarModalidad("SelectModalidadGrupoServicioTecSalAP")
    );
    await cargarSeguro("grupo servicios AP", () =>
      cargarGrupoServicios("SelectGrupoServiciosAP")
    );
    await cargarSeguro("servicios AP", () => cargarServicios("SelectServicioAP"));
    await cargarSeguro("finalidad AP", () =>
      cargarFinalidad("SelectFinalidadTecnologiaSaludAP", "AP")
    );
    if (global.RipsSelect2) global.RipsSelect2.inicializarFormularioHc("AP");
  }

  function mostrarPanelTipo(tipo) {
    const ac = document.getElementById("TipoAC");
    const ap = document.getElementById("TipoAP");
    if (ac) ac.style.display = tipo === "AC" ? "block" : "none";
    if (ap) ap.style.display = tipo === "AP" ? "block" : "none";
  }

  function resetCache() {
    return { AC: false, AP: false };
  }

  global.RipsCatalogos = {
    cargarCatalogosAC,
    cargarCatalogosAP,
    mostrarPanelTipo,
    resetCache,
  };
})(window);

/**
 * RIPS anclado a la evolución HC activa (Historias Clínicas).
 */
(function (global) {
  const ID_BORRADOR = "__nueva__";
  const ID_ESTADO_CERRADO = 7;

  const LS_EXIGIR_RIPS = "hc_rips_exigir_antes_guardar";

  let evolucionActiva = null;
  let ripsInfo = null;
  let catalogosCargados = { AC: false, AP: false };
  let panelAbierto = false;

  function isExigirRipsAntesGuardarHc() {
    const el = document.getElementById("hcRipsExigirAntesGuardar");
    if (el) return el.checked;
    return localStorage.getItem(LS_EXIGIR_RIPS) === "1";
  }

  function setExigirRipsAntesGuardarHc(valor) {
    localStorage.setItem(LS_EXIGIR_RIPS, valor ? "1" : "0");
    const el = document.getElementById("hcRipsExigirAntesGuardar");
    if (el) el.checked = !!valor;
  }

  function formularioRipsCompleto() {
    try {
      global.RipsAsignar.validarFormularioCompleto();
      return true;
    } catch {
      return false;
    }
  }

  function ripsResueltoParaHc() {
    if (ripsInfo?.tieneRipsRegistrado || ripsInfo?.marcadaSinRips) return true;
    return formularioRipsCompleto();
  }

  function isRipsProductEnabled() {
    const cfg = global.__APP_CONFIG__ || {};
    const raw = cfg.ENABLE_RIPS;
    if (raw === undefined || raw === null || raw === "") return true;
    if (typeof raw === "boolean") return raw;
    return ["1", "true", "yes", "on"].includes(String(raw).trim().toLowerCase());
  }

  function puedeGuardarHcSegunRips() {
    if (!isRipsProductEnabled()) return { ok: true };
    if (!isExigirRipsAntesGuardarHc()) return { ok: true };
    if (!getDocumentoPaciente()) return { ok: true };
    if (!evolucionActiva) {
      return {
        ok: false,
        message:
          "Seleccione o cree una evolución y complete el RIPS (o márquelo sin RIPS) antes de guardar la historia clínica.",
      };
    }
    if (Number(evolucionActiva.idEstado) === ID_ESTADO_CERRADO) return { ok: true };
    if (ripsResueltoParaHc()) return { ok: true };
    try {
      global.RipsAsignar.validarFormularioCompleto();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        message:
          (err.message || "Complete el formulario RIPS.") +
          " Abra el botón flotante RIPS para diligenciarlo.",
      };
    }
  }

  function actualizarFab() {
    const fab = document.getElementById("hcRipsFab");
    const badge = document.getElementById("hcRipsFabBadge");
    if (!fab || !badge) return;

    if (!getDocumentoPaciente()) {
      fab.disabled = true;
      badge.classList.add("d-none");
      return;
    }
    fab.disabled = false;

    if (ripsInfo?.tieneRipsRegistrado) {
      badge.classList.remove("d-none", "warn");
      badge.classList.add("ok");
      fab.title = "RIPS registrado — Abrir panel";
      return;
    }
    if (ripsInfo?.marcadaSinRips) {
      badge.classList.remove("d-none", "warn");
      badge.classList.add("ok");
      fab.title = "Sin RIPS (marcado) — Abrir panel";
      return;
    }
    if (formularioRipsCompleto()) {
      badge.classList.remove("d-none", "warn");
      badge.classList.add("ok");
      fab.title = "RIPS completo — Abrir panel";
    } else if (evolucionActiva && isExigirRipsAntesGuardarHc()) {
      badge.classList.remove("d-none", "ok");
      badge.classList.add("warn");
      fab.title = "RIPS pendiente — Abrir panel";
    } else {
      badge.classList.add("d-none");
      fab.title = "Abrir asignación RIPS";
    }
  }

  function abrirPanelRipsHc() {
    const overlay = document.getElementById("hcRipsOverlay");
    const fab = document.getElementById("hcRipsFab");
    if (!overlay) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    panelAbierto = true;
    fab?.classList.add("is-open");
    const card = document.getElementById("cardRipsHc");
    if (card?.classList.contains("rda-module-collapsed")) {
      card.classList.remove("rda-module-collapsed");
    }
  }

  function cerrarPanelRipsHc() {
    const overlay = document.getElementById("hcRipsOverlay");
    const fab = document.getElementById("hcRipsFab");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    panelAbierto = false;
    fab?.classList.remove("is-open");
    actualizarFab();
  }

  function togglePanelRipsHc() {
    if (panelAbierto) cerrarPanelRipsHc();
    else abrirPanelRipsHc();
  }

  function setEvolucionActiva(detail) {
    evolucionActiva = detail || null;
    actualizarAncla();
    actualizarEstadoRips();
    actualizarBotones();
    setFormularioHabilitado(permiteEditarRips());
    cargarCatalogosTipoActivo(false).catch(console.error);
    actualizarFab();
  }

  global.getHcEvolucionActiva = function () {
    return evolucionActiva ? { ...evolucionActiva } : null;
  };

  function permiteEditarRips() {
    if (!evolucionActiva) return false;
    if (!getDocumentoPaciente()) return false;
    if (evolucionActiva.esBorrador) return true;
    if (Number(evolucionActiva.idEstado) === ID_ESTADO_CERRADO) return false;
    if (ripsInfo?.tieneRipsRegistrado) return false;
    if (ripsInfo?.marcadaSinRips) return false;
    return true;
  }

  function getDocumentoPaciente() {
    if (typeof global.getDocumentoPacienteActivoHc === "function") {
      return String(global.getDocumentoPacienteActivoHc() || "").trim();
    }
    return String(document.getElementById("DocumentoPaciente")?.value || "").trim();
  }

  function actualizarAncla() {
    const box = document.getElementById("hcRipsAnclaEvolucion");
    if (!box) return;
    if (!evolucionActiva) {
      box.innerHTML =
        '<span class="text-muted">Seleccione o cree una evolución en el panel izquierdo.</span>';
      return;
    }
    if (evolucionActiva.esBorrador) {
      box.innerHTML = `
        <div class="fw-semibold">Nueva evolución <span class="badge bg-primary ms-1">Sin guardar</span></div>
        <div class="text-muted mt-1">Al registrar RIPS se guardará primero la historia clínica.</div>
      `;
      return;
    }
    const fmt = evolucionActiva.nombreFormato
      ? `<div class="text-muted small text-truncate" title="${evolucionActiva.nombreFormato}">${evolucionActiva.nombreFormato}</div>`
      : "";
    box.innerHTML = `
      <div class="fw-semibold">#${evolucionActiva.idEvaluacionEntidad} · ${evolucionActiva.estadoTexto || ""}</div>
      <div class="small">${evolucionActiva.fechaTexto || ""} ${evolucionActiva.horaTexto || ""}</div>
      ${fmt}
    `;
  }

  async function actualizarEstadoRips() {
    const el = document.getElementById("hcRipsEstadoRips");
    if (!el) return;
    if (!evolucionActiva || evolucionActiva.esBorrador) {
      ripsInfo = null;
      el.textContent = "";
      return;
    }
    try {
      ripsInfo = await global.RipsApi.consultarRipsEvaluacion(
        evolucionActiva.idEvaluacionEntidad
      );
      el.textContent = ripsInfo.resumen || "";
      el.classList.toggle("text-warning", ripsInfo.tieneRipsRegistrado);
      el.classList.toggle("text-info", ripsInfo.marcadaSinRips);
    } catch (err) {
      ripsInfo = null;
      el.textContent = "";
      console.warn("[ripsHc] estado rips:", err);
    }
  }

  function actualizarBotones() {
    const card = document.getElementById("cardRipsHc");
    if (card) card.classList.toggle("hc-rips-card-disabled", !getDocumentoPaciente());
    actualizarFab();
  }

  function setFormularioHabilitado(habilitado) {
    const body = document.getElementById("hcRipsCardBody");
    if (!body) return;
    body.querySelectorAll("select, input, button").forEach((el) => {
      if (el.closest(".modal")) return;
      el.disabled = !habilitado;
    });
  }

  async function asegurarCatalogos(tipo, forzar) {
    if (!tipo) return;
    if (!forzar && catalogosCargados[tipo]) return;
    if (tipo === "AC") await global.RipsCatalogos.cargarCatalogosAC();
    else await global.RipsCatalogos.cargarCatalogosAP();
    catalogosCargados[tipo] = true;
  }

  async function cargarCatalogosTipoActivo(forzar) {
    const tipo = global.RipsAsignar.tipoRipsActivo();
    global.RipsCatalogos.mostrarPanelTipo(tipo);
    if (!tipo) return;
    await asegurarCatalogos(tipo, forzar);
  }

  async function onTipoRipsChange() {
    await cargarCatalogosTipoActivo(false);
  }

  function initRipsHc() {
    if (!isRipsProductEnabled()) {
      ["hcRipsFab", "hcRipsPanel", "hcRipsOverlay", "cardRipsHc"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = "none";
          el.setAttribute("hidden", "hidden");
        }
      });
      return;
    }
    const card = document.getElementById("cardRipsHc");
    if (!card) return;
    if (card.dataset.ripsHcBound === "1") return;
    card.dataset.ripsHcBound = "1";

    document.getElementById("hcRipsAC")?.addEventListener("change", () => {
      onTipoRipsChange().catch(console.error);
    });
    document.getElementById("hcRipsAP")?.addEventListener("change", () => {
      onTipoRipsChange().catch(console.error);
    });
    document.addEventListener("hc-evolucion-activa", (ev) => {
      setEvolucionActiva(ev.detail);
    });

    document.addEventListener("hc-paciente-cargado", () => {
      if (!evolucionActiva) setEvolucionActiva(null);
      actualizarBotones();
    });

    global.RipsCatalogos.mostrarPanelTipo("");
    setEvolucionActiva(null);

    if (global.RipsPorDefecto?.initPorDefectoHc) {
      global.RipsPorDefecto.initPorDefectoHc();
    }
    document.getElementById("ModalRIPSPorDefecto")?.addEventListener("shown.bs.modal", () => {
      if (global.RipsSelect2) global.RipsSelect2.inicializarModalPorDefecto();
    });

    const ac = document.getElementById("hcRipsAC");
    const ap = document.getElementById("hcRipsAP");
    if (!ac?.checked && !ap?.checked && ac) {
      ac.checked = true;
    }
    catalogosCargados = { AC: false, AP: false };
    cargarCatalogosTipoActivo(true).catch(console.error);

    const exigirEl = document.getElementById("hcRipsExigirAntesGuardar");
    if (exigirEl) {
      exigirEl.checked = localStorage.getItem(LS_EXIGIR_RIPS) === "1";
      exigirEl.addEventListener("change", () => {
        setExigirRipsAntesGuardarHc(exigirEl.checked);
        actualizarFab();
      });
    }

    document.getElementById("hcRipsFab")?.addEventListener("click", togglePanelRipsHc);
    document.getElementById("hcRipsOverlayCerrar")?.addEventListener("click", cerrarPanelRipsHc);
    document.getElementById("hcRipsOverlayBackdrop")?.addEventListener("click", cerrarPanelRipsHc);
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && panelAbierto) cerrarPanelRipsHc();
    });

    const body = document.getElementById("hcRipsCardBody");
    body?.addEventListener("change", () => actualizarFab());
    body?.addEventListener("input", () => actualizarFab());

    actualizarFab();
  }

  global.initRipsHc = initRipsHc;
  global.actualizarRipsHcDesdeEvolucion = setEvolucionActiva;
  global.abrirPanelRipsHc = abrirPanelRipsHc;
  global.cerrarPanelRipsHc = cerrarPanelRipsHc;
  global.puedeGuardarHcSegunRips = puedeGuardarHcSegunRips;
  global.isExigirRipsAntesGuardarHc = isExigirRipsAntesGuardarHc;
})(window);

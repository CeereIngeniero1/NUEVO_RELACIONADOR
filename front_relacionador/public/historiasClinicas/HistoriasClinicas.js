/**
 * Módulo Historias Clínicas — formatos HC, vista previa y autollenado de campos T*.
 */
(function () {
  let ultimaFilaPaciente = null;
  let ultimoFormatoSeleccionado = "";
  let resizePreviewTimer = null;
  let hcModoSoloLectura = false;
  let hcEvaluacionActivaId = null;
  let hcEvaluacionActivaAbierta = false;

  const PREVIEW_STYLE_ID = "ceere-hc-preview-adapt";
  const ID_ESTADO_CERRADO_HC = 7;
  const ID_ESTADO_ABIERTO_HC = 8;

  function inyectarEstilosVistaPrevia(doc) {
    if (!doc || !doc.head) return;
    if (doc.getElementById(PREVIEW_STYLE_ID)) return;
    const style = doc.createElement("style");
    style.id = PREVIEW_STYLE_ID;
    style.textContent = `
      html, body {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        box-sizing: border-box;
        width: 100% !important;
      }
      body {
        margin: 0 !important;
        padding: 16px !important;
      }
      table { width: 100% !important; max-width: 100% !important; }
      img { max-width: 100%; height: auto; }
      body.hc-solo-lectura input:not([type="hidden"]):not([type="button"]):not([type="submit"]),
      body.hc-solo-lectura textarea,
      body.hc-solo-lectura select {
        cursor: not-allowed !important;
      }
    `;
    doc.head.appendChild(style);
  }

  function esEvolucionCerrada(det) {
    if (!det) return false;
    return (
      Number(det.idEstado) === ID_ESTADO_CERRADO_HC || String(det.estadoClase || "") === "cerrado"
    );
  }

  function aplicarSoloLecturaDocumento(doc, soloLectura) {
    if (!doc || !doc.body) return;
    doc.body.classList.toggle("hc-solo-lectura", soloLectura);
    const campos = doc.querySelectorAll(
      'input, textarea, select, button, [contenteditable="true"]'
    );
    campos.forEach((el) => {
      if (el.tagName === "INPUT" && el.type === "hidden") return;
      if (soloLectura) {
        if (
          el.tagName === "SELECT" ||
          el.tagName === "BUTTON" ||
          (el.tagName === "INPUT" &&
            ["button", "submit", "checkbox", "radio", "file"].includes(
              String(el.type || "").toLowerCase()
            ))
        ) {
          el.disabled = true;
        } else if (el.isContentEditable) {
          el.contentEditable = "false";
        } else {
          el.readOnly = true;
        }
      } else {
        el.disabled = false;
        el.readOnly = false;
        if (el.isContentEditable) el.contentEditable = "true";
      }
    });
  }

  function aplicarSoloLecturaIframe(iframe) {
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      aplicarSoloLecturaDocumento(doc, hcModoSoloLectura);
    } catch (err) {
      console.warn("[HistoriasClinicas] solo lectura iframe:", err);
    }
  }

  function setModoEdicionHc(soloLectura, opciones) {
    hcModoSoloLectura = !!soloLectura;
    const btn = document.getElementById("btnGuardarHistoriaClinica");
    const select = document.getElementById("selectFormatoHC");
    const wrapper = document.getElementById("previewFormatoHCWrapper");
    const estadoEl = document.getElementById("guardarHcEstado");

    if (btn) {
      btn.disabled = soloLectura;
      btn.title = soloLectura
        ? "No se puede guardar: la evolución está cerrada"
        : "Guardar en Evaluación Entidad (nueva evaluación)";
    }
    if (select) select.disabled = soloLectura;
    if (wrapper) wrapper.classList.toggle("hc-preview-solo-lectura", soloLectura);

    aplicarSoloLecturaIframe(document.getElementById("previewFormatoHCIframe"));

    if (estadoEl && opciones && opciones.mensaje) {
      estadoEl.textContent = opciones.mensaje;
      estadoEl.classList.remove("text-info", "text-muted");
      estadoEl.classList.add(soloLectura ? "text-warning" : "text-muted");
    }
    actualizarBotonCerrarHc();
  }

  function emitHcEvolucionActiva(detail) {
    document.dispatchEvent(
      new CustomEvent("hc-evolucion-activa", { detail: detail || null })
    );
  }

  function setEvolucionActivaHc(idEvaluacion, idEstado, extra) {
    const id = Number.parseInt(idEvaluacion, 10);
    if (Number.isNaN(id) || id <= 0) {
      hcEvaluacionActivaId = null;
      hcEvaluacionActivaAbierta = false;
      emitHcEvolucionActiva(null);
    } else {
      hcEvaluacionActivaId = id;
      const estado = Number.parseInt(idEstado, 10);
      hcEvaluacionActivaAbierta = estado === ID_ESTADO_ABIERTO_HC;
      emitHcEvolucionActiva({
        idEvaluacionEntidad: id,
        idEstado: estado,
        esBorrador: false,
        estadoTexto: extra?.estadoTexto,
        estadoClase: extra?.estadoClase,
        nombreFormato: extra?.nombreFormato || ultimoFormatoSeleccionado,
        fechaTexto: extra?.fechaTexto,
        horaTexto: extra?.horaTexto,
      });
    }
    actualizarBotonCerrarHc();
  }

  function actualizarBotonCerrarHc() {
    const btn = document.getElementById("btnCerrarHistoriaClinica");
    if (!btn) return;
    const puedeCerrar =
      hcEvaluacionActivaAbierta && hcEvaluacionActivaId != null && !hcModoSoloLectura;
    btn.disabled = !puedeCerrar;
    btn.title = puedeCerrar
      ? `Cerrar evolución #${hcEvaluacionActivaId} (pasa a estado Cerrado)`
      : "Seleccione una evolución abierta guardada para cerrarla";
  }

  function rellenarPacienteEnIframe(iframe) {
    if (hcModoSoloLectura) return;
    if (!iframe || typeof buildValoresHcDesdePacienteEnPantalla !== "function") return;
    try {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;
      const valores = buildValoresHcDesdePacienteEnPantalla(ultimaFilaPaciente);
      if (typeof applyValoresADocumento === "function") {
        applyValoresADocumento(doc, valores);
      }
    } catch (err) {
      console.warn("[HistoriasClinicas] rellenar iframe:", err);
    }
  }

  function ajustarTamanoVistaPrevia() {
    const iframe = document.getElementById("previewFormatoHCIframe");
    const container = document.getElementById("previewFormatoHCContainer");
    if (!iframe || !container) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;

      inyectarEstilosVistaPrevia(doc);
      rellenarPacienteEnIframe(iframe);
      aplicarSoloLecturaDocumento(doc, hcModoSoloLectura);

      const contentH = Math.max(
        doc.body.scrollHeight,
        doc.body.offsetHeight,
        doc.documentElement.scrollHeight
      );

      iframe.style.width = "100%";
      iframe.style.transform = "none";
      iframe.style.height = `${Math.max(contentH, 200)}px`;
      container.style.height = iframe.style.height;
    } catch (err) {
      console.warn("[HistoriasClinicas] ajustar vista previa:", err);
      iframe.style.width = "100%";
      iframe.style.height = "min(80vh, 900px)";
      iframe.style.transform = "none";
    }
  }

  function programarAjusteVistaPrevia() {
    clearTimeout(resizePreviewTimer);
    resizePreviewTimer = setTimeout(ajustarTamanoVistaPrevia, 80);
  }

  function enlazarIframeVistaPrevia(iframe) {
    if (!iframe || iframe.dataset.hcPreviewBound === "1") return;
    iframe.dataset.hcPreviewBound = "1";
    iframe.addEventListener("load", function () {
      rellenarPacienteEnIframe(iframe);
      aplicarSoloLecturaIframe(iframe);
      programarAjusteVistaPrevia();
    });
    window.addEventListener("resize", programarAjusteVistaPrevia);
  }

  function mostrarInformeCampos(analisis, nombreArchivo) {
    const panel = document.getElementById("informeCamposHC");
    const body = document.getElementById("informeCamposHCBody");
    if (!panel || !body) return;

    if (!analisis || !nombreArchivo) {
      panel.classList.add("d-none");
      return;
    }

    const cat = window.CATALOGO_CAMPOS_HC || {};
    const filasMapeables = (analisis.mapeables || []).map((n) => {
      const meta = cat[n] || {};
      const etiqueta = meta.etiqueta || n;
      const origen = meta.origen || "";
      const pendiente = origen === "pendiente_sql" || origen === "pendiente_imagen";
      return `<li><code>${n}</code> — ${etiqueta}${pendiente ? ' <span class="text-warning">(sin dato en consulta)</span>' : ""}</li>`;
    });

    const sinCatalogo = (analisis.enHtmlSinCatalogo || [])
      .map((n) => `<li><code>${n}</code> — no está en Campos Historia Clínica.txt</li>`)
      .join("");

    const sinName =
      analisis.camposEnHtml.length === 0
        ? `<p class="text-warning mb-2">Este formato no usa atributos <code>name</code> (T1, T2…). Los inputs no se autollenan; conviene agregar <code>name</code> según el catálogo.</p>`
        : "";

    body.innerHTML = `
      <p class="small text-muted mb-2">Archivo: <strong>${nombreArchivo}</strong></p>
      ${sinName}
      <p class="small fw-semibold mb-1">Campos en el HTML (catálogo CeereSio)</p>
      <ul class="small mb-3">${filasMapeables.length ? filasMapeables.join("") : "<li class='text-muted'>Ninguno</li>"}</ul>
      ${
        sinCatalogo
          ? `<p class="small fw-semibold mb-1 text-warning">En HTML pero fuera del catálogo</p><ul class="small mb-0">${sinCatalogo}</ul>`
          : ""
      }
      <p class="small text-muted mt-3 mb-0">Informe completo: <code>docs/campos-historia-clinica.md</code></p>
    `;
    panel.classList.remove("d-none");
  }

  function valoresDesdeDiagnosticoEspecifico(cadena) {
    if (typeof parsearDiagnosticoEspecifico !== "function" || !cadena) return {};
    const mapa = parsearDiagnosticoEspecifico(cadena);
    const valores = {};
    Object.keys(mapa).forEach((k) => {
      valores[k] = mapa[k].valor;
    });
    return valores;
  }

  async function cargarVistaPreviaFormato(nombreArchivo, valoresOpcionales) {
    const placeholder = document.getElementById("previewFormatoHCPlaceholder");
    const wrapper = document.getElementById("previewFormatoHCWrapper");
    const iframe = document.getElementById("previewFormatoHCIframe");
    const titulo = document.getElementById("previewFormatoHCTitulo");
    const archivoLabel = document.getElementById("previewFormatoHCArchivo");

    const nombre = String(nombreArchivo || "").trim();
    ultimoFormatoSeleccionado = nombre;

    if (!nombre) {
      if (wrapper) wrapper.classList.add("d-none");
      if (placeholder) placeholder.classList.remove("d-none");
      if (iframe) {
        iframe.removeAttribute("src");
        iframe.removeAttribute("srcdoc");
      }
      mostrarInformeCampos(null, "");
      if (!hcModoSoloLectura) setModoEdicionHc(false);
      return;
    }

    const url = `${getApiBaseUrl()}/apiV3/formatosHC/vista/${encodeURIComponent(nombre)}`;

    if (titulo) titulo.textContent = "Vista previa del formato";
    if (archivoLabel) archivoLabel.textContent = nombre;

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`No se pudo cargar el formato (${resp.status}).`);
      const html = await resp.text();

      const usarSoloOpcionales =
        valoresOpcionales && Object.keys(valoresOpcionales).length > 0;
      const valores = usarSoloOpcionales
        ? valoresOpcionales
        : typeof buildValoresHcDesdePacienteEnPantalla === "function"
          ? buildValoresHcDesdePacienteEnPantalla(ultimaFilaPaciente)
          : {};

      const htmlConPaciente =
        typeof applyValoresAFormatoHtml === "function"
          ? applyValoresAFormatoHtml(html, valores)
          : html;

      if (iframe) {
        enlazarIframeVistaPrevia(iframe);
        iframe.removeAttribute("src");
        iframe.style.transform = "none";
        iframe.style.height = "0";
        const container = document.getElementById("previewFormatoHCContainer");
        if (container) container.style.height = "120px";
        iframe.srcdoc = htmlConPaciente;
        programarAjusteVistaPrevia();
        setTimeout(programarAjusteVistaPrevia, 350);
        setTimeout(programarAjusteVistaPrevia, 900);
        setTimeout(function () {
          aplicarSoloLecturaIframe(iframe);
        }, 120);
        setTimeout(function () {
          aplicarSoloLecturaIframe(iframe);
        }, 400);
      }

      if (typeof analizarCoberturaFormato === "function") {
        const analisis = analizarCoberturaFormato(html);
        mostrarInformeCampos(analisis, nombre);
      }

      if (placeholder) placeholder.classList.add("d-none");
      if (wrapper) wrapper.classList.remove("d-none");
    } catch (err) {
      console.error("[HistoriasClinicas] vista previa:", err);
      Swal.fire({
        icon: "error",
        title: "Vista previa",
        text: err.message || "Error al cargar el formato.",
      });
    }
  }

  async function cargarFormatosHC() {
    const select = document.getElementById("selectFormatoHC");
    const rutaInfo = document.getElementById("formatoHcRutaInfo");
    if (!select) return;

    select.innerHTML = "";
    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = "Sin seleccionar";
    select.appendChild(optDefault);

    try {
      const resp = await fetch(`${getApiBaseUrl()}/apiV3/formatosHC`);
      const data = await resp.json();

      if (rutaInfo) {
        rutaInfo.textContent = data.ruta ? `Ruta: ${data.ruta}` : "";
      }

      if (!resp.ok || !data.ok) {
        Swal.fire({
          icon: "warning",
          title: "Formatos HC",
          text: data.message || "No se pudieron cargar los formatos.",
        });
        return;
      }

      const archivos = data.archivos || [];
      if (archivos.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "(No hay archivos .htm / .html en la carpeta)";
        opt.disabled = true;
        select.appendChild(opt);
        return;
      }

      archivos.forEach((archivo) => {
        const opt = document.createElement("option");
        opt.value = archivo.nombre;
        opt.textContent = archivo.nombre;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error("[HistoriasClinicas] formatosHC:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error al consultar formatos de historia clínica.",
      });
    }
  }

  function initSelectorFormatoHC() {
    const select = document.getElementById("selectFormatoHC");
    if (!select) return;
    select.addEventListener("change", function () {
      cargarVistaPreviaFormato(this.value);
      if (typeof window.actualizarBorradorEvolucionHc === "function") {
        window.actualizarBorradorEvolucionHc(this.value);
      }
    });
  }

  function iniciarNuevaEvolucionHc(opciones) {
    setEvolucionActivaHc(null);
    setModoEdicionHc(false);
    const conservarFormato = opciones && opciones.conservarFormato;
    const select = document.getElementById("selectFormatoHC");
    const estadoEl = document.getElementById("guardarHcEstado");
    const titulo = document.getElementById("previewFormatoHCTitulo");

    if (!conservarFormato) {
      if (select) select.value = "";
      ultimoFormatoSeleccionado = "";
      cargarVistaPreviaFormato("");
      if (titulo) titulo.textContent = "Nueva evolución";
    } else if (titulo) {
      titulo.textContent = "Nueva evolución (sin guardar)";
    }

    if (estadoEl) {
      estadoEl.textContent = "Sin guardar — seleccione formato y complete los campos.";
      estadoEl.classList.remove("text-muted");
      estadoEl.classList.add("text-info");
    }

    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    emitHcEvolucionActiva({
      idEvaluacionEntidad: "__nueva__",
      esBorrador: true,
      estadoTexto: "Sin guardar",
      estadoClase: "sin-guardar",
      nombreFormato: select ? select.value : "",
      fechaTexto: `${y}-${mo}-${day}`,
      horaTexto: "",
    });
  }

  function obtenerSesionGuardarHc() {
    return {
      documentoUsuario: sessionStorage.getItem("documentousuariologeado") || "",
      documentoProfesional: sessionStorage.getItem("documentousuariologeado") || "",
      documentoEmpresa: sessionStorage.getItem("empresaTrabajarExecuted") || "",
      idTerminal: sessionStorage.getItem("idterminal") || sessionStorage.getItem("IdTerminal") || "",
    };
  }

  async function guardarHistoriaClinica(opciones) {
    const silencioso = opciones && opciones.silencioso;
    if (hcModoSoloLectura) {
      if (!silencioso) {
        Swal.fire({
          icon: "info",
          title: "Solo lectura",
          text: "Esta evolución está cerrada. No se puede modificar ni guardar de nuevo.",
        });
      }
      return null;
    }

    const docFn =
      typeof getDocumentoPacienteActivoHc === "function"
        ? getDocumentoPacienteActivoHc
        : null;
    const documentoPaciente = docFn
      ? docFn()
      : String(document.getElementById("DocumentoPaciente")?.value || "").trim();

    const nombreFormato = ultimoFormatoSeleccionado;
    const iframe = document.getElementById("previewFormatoHCIframe");
    const estadoEl = document.getElementById("guardarHcEstado");

    if (!documentoPaciente) {
      if (!silencioso) {
        Swal.fire({
          icon: "warning",
          title: "Paciente",
          text: "Consulte un paciente por documento antes de guardar.",
        });
      }
      return null;
    }
    if (!nombreFormato) {
      if (!silencioso) {
        Swal.fire({
          icon: "warning",
          title: "Formato",
          text: "Seleccione un formato de historia clínica.",
        });
      }
      return null;
    }

    if (!silencioso && typeof window.puedeGuardarHcSegunRips === "function") {
      const ripsGate = window.puedeGuardarHcSegunRips();
      if (!ripsGate.ok) {
        const res = await Swal.fire({
          icon: "warning",
          title: "RIPS pendiente",
          html: ripsGate.message,
          showCancelButton: true,
          confirmButtonText: "Abrir RIPS",
          cancelButtonText: "Cerrar",
        });
        if (res.isConfirmed && typeof window.abrirPanelRipsHc === "function") {
          window.abrirPanelRipsHc();
        }
        return null;
      }
    }

    let serializado = "";
    let cantidadCampos = 0;
    try {
      const extraido =
        typeof extraerSerializacionDesdeIframe === "function"
          ? extraerSerializacionDesdeIframe(iframe)
          : null;
      if (!extraido) throw new Error("No está disponible la serialización del formato.");
      serializado = extraido.serializado;
      cantidadCampos = extraido.cantidadCampos;
    } catch (err) {
      if (!silencioso) {
        Swal.fire({
          icon: "error",
          title: "Formato",
          text:
            err.message ||
            "No se pudo leer el formulario. Verifique que el formato tenga campos con atributo name.",
        });
      }
      return null;
    }

    if (cantidadCampos === 0) {
      if (!silencioso) {
        Swal.fire({
          icon: "warning",
          title: "Sin campos",
          text:
            "El formato no tiene inputs con atributo name. No se puede guardar en Diagnóstico Específico.",
        });
      }
      return null;
    }

    if (!silencioso) {
      const confirm = await Swal.fire({
        icon: "question",
        title: "Guardar historia clínica",
        html: `Paciente: <strong>${documentoPaciente}</strong><br>Formato: <strong>${nombreFormato}</strong><br>Campos: <strong>${cantidadCampos}</strong>`,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
      });
      if (!confirm.isConfirmed) return null;
    }

    if (estadoEl) estadoEl.textContent = "Guardando…";

    try {
      const resp = await fetch(`${getApiBaseUrl()}/apiV3/historiasClinicas/guardar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentoPaciente,
          nombreFormato,
          diagnosticoEspecifico: serializado,
          session: obtenerSesionGuardarHc(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.message || `Error ${resp.status}`);
      }

      if (estadoEl) {
        estadoEl.textContent = `Guardado — Id ${data.idEvaluacionEntidad}`;
      }

      if (!silencioso) {
        Swal.fire({
          icon: "success",
          title: "Historia guardada",
          html: `Id Evaluación Entidad: <strong>${data.idEvaluacionEntidad}</strong>`,
        });
      }

      setEvolucionActivaHc(data.idEvaluacionEntidad, ID_ESTADO_ABIERTO_HC, {
        estadoTexto: "Abierto",
        estadoClase: "abierto",
        nombreFormato,
      });

      if (typeof window.limpiarBorradorEvolucionHc === "function") {
        window.limpiarBorradorEvolucionHc();
      }
      document.dispatchEvent(new CustomEvent("hc-evoluciones-refrescar"));
      const estadoElAfter = document.getElementById("guardarHcEstado");
      if (estadoElAfter) {
        estadoElAfter.classList.remove("text-info");
        estadoElAfter.classList.add("text-muted");
      }
      return data;
    } catch (err) {
      console.error("[HistoriasClinicas] guardar:", err);
      if (estadoEl) estadoEl.textContent = "";
      if (!silencioso) {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          text: err.message || String(err),
        });
      }
      throw err;
    }
  }

  function initBotonGuardarHc() {
    const btn = document.getElementById("btnGuardarHistoriaClinica");
    if (!btn) return;
    btn.addEventListener("click", function () {
      guardarHistoriaClinica();
    });
  }

  async function cerrarHistoriaClinica() {
    if (!hcEvaluacionActivaId || !hcEvaluacionActivaAbierta || hcModoSoloLectura) {
      Swal.fire({
        icon: "info",
        title: "Cerrar HC",
        text: "Seleccione una evolución guardada en estado Abierto para cerrarla.",
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Cerrar historia clínica",
      html: `¿Cerrar la evolución <strong>#${hcEvaluacionActivaId}</strong>?<br><span class="text-muted small">Quedará en estado <strong>Cerrado</strong> y no podrá editarse.</span>`,
      showCancelButton: true,
      confirmButtonText: "Cerrar HC",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#e67e22",
    });
    if (!confirm.isConfirmed) return;

    const estadoEl = document.getElementById("guardarHcEstado");
    if (estadoEl) estadoEl.textContent = "Cerrando…";

    try {
      const resp = await fetch(`${getApiBaseUrl()}/apiV3/historiasClinicas/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idEvaluacionEntidad: hcEvaluacionActivaId }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.message || `Error ${resp.status}`);
      }

      hcEvaluacionActivaAbierta = false;
      setModoEdicionHc(true, {
        mensaje: "Historia cerrada — solo lectura.",
      });
      emitHcEvolucionActiva({
        idEvaluacionEntidad: hcEvaluacionActivaId,
        idEstado: ID_ESTADO_CERRADO_HC,
        esBorrador: false,
        estadoTexto: "Cerrado",
        estadoClase: "cerrado",
        nombreFormato: ultimoFormatoSeleccionado,
      });

      const titulo = document.getElementById("previewFormatoHCTitulo");
      if (titulo) {
        titulo.textContent = `Evolución #${hcEvaluacionActivaId} (Cerrado)`;
      }

      Swal.fire({
        icon: "success",
        title: "HC cerrada",
        text: `La evolución #${hcEvaluacionActivaId} quedó en estado Cerrado.`,
      });

      document.dispatchEvent(new CustomEvent("hc-evoluciones-refrescar"));
    } catch (err) {
      console.error("[HistoriasClinicas] cerrar:", err);
      if (estadoEl) estadoEl.textContent = "";
      Swal.fire({
        icon: "error",
        title: "Error al cerrar",
        text: err.message || String(err),
      });
    }
  }

  function initBotonCerrarHc() {
    const btn = document.getElementById("btnCerrarHistoriaClinica");
    if (!btn) return;
    btn.addEventListener("click", cerrarHistoriaClinica);
    actualizarBotonCerrarHc();
  }

  function crToggleCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const header = card.querySelector(".cr-card-header");
    if (header) header.classList.toggle("collapsed");
    const body = card.querySelector(".cr-card-body");
    if (body) body.classList.toggle("d-none");
  }

  async function abrirEvolucionHcGuardada(idEvaluacionEntidad) {
    try {
      const resp = await fetch(
        `${getApiBaseUrl()}/apiV3/historiasClinicas/evoluciones/detalle/${encodeURIComponent(idEvaluacionEntidad)}`
      );
      const det = await resp.json();
      if (!resp.ok || !det.ok) {
        throw new Error(det.message || "No se pudo cargar la evolución.");
      }

      const nombreFormato = String(det.nombreFormato || "").trim();
      if (!nombreFormato) {
        Swal.fire({
          icon: "warning",
          title: "Formato",
          text: "Esta evolución no tiene nombre de archivo de formato asociado.",
        });
        return;
      }

      const select = document.getElementById("selectFormatoHC");
      if (select) {
        let existe = false;
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === nombreFormato) {
            existe = true;
            break;
          }
        }
        if (!existe) {
          const opt = document.createElement("option");
          opt.value = nombreFormato;
          opt.textContent = nombreFormato;
          select.appendChild(opt);
        }
        select.value = nombreFormato;
      }

      const cerrada = esEvolucionCerrada(det);
      const valoresGuardados = valoresDesdeDiagnosticoEspecifico(det.diagnosticoEspecifico);
      await cargarVistaPreviaFormato(nombreFormato, valoresGuardados);

      const titulo = document.getElementById("previewFormatoHCTitulo");
      if (titulo) {
        titulo.textContent = `Evolución #${det.idEvaluacionEntidad} (${det.estadoTexto || ""})`;
      }

      const fe = det.fechaEvaluacion ? new Date(det.fechaEvaluacion) : null;
      let fechaTexto = "";
      let horaTexto = "";
      if (fe && !Number.isNaN(fe.getTime())) {
        fechaTexto = fe.toISOString().slice(0, 10);
        horaTexto = fe.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      }
      setEvolucionActivaHc(det.idEvaluacionEntidad, det.idEstado, {
        estadoTexto: det.estadoTexto,
        estadoClase: det.estadoClase,
        nombreFormato,
        fechaTexto,
        horaTexto,
      });

      if (cerrada) {
        hcEvaluacionActivaAbierta = false;
        setModoEdicionHc(true, {
          mensaje: "Solo lectura — esta evolución está cerrada.",
        });
      } else {
        setModoEdicionHc(false);
        const estadoEl = document.getElementById("guardarHcEstado");
        if (estadoEl) {
          estadoEl.textContent =
            "Evolución abierta — puede editar, guardar copia nueva o usar Cerrar HC.";
          estadoEl.classList.remove("text-info", "text-warning");
          estadoEl.classList.add("text-muted");
        }
      }
    } catch (err) {
      console.error("[HistoriasClinicas] abrir evolución:", err);
      Swal.fire({
        icon: "error",
        title: "Evolución",
        text: err.message || String(err),
      });
    }
  }

  window.crToggleCard = crToggleCard;
  window.abrirEvolucionHcGuardada = abrirEvolucionHcGuardada;
  window.iniciarNuevaEvolucionHc = iniciarNuevaEvolucionHc;
  window.guardarHistoriaClinicaHc = guardarHistoriaClinica;
  window.setEvolucionActivaHc = setEvolucionActivaHc;
  window.refrescarVistaPreviaFormatoHC = function () {
    if (ultimoFormatoSeleccionado) cargarVistaPreviaFormato(ultimoFormatoSeleccionado);
  };

  document.addEventListener("hc-paciente-cargado", function (ev) {
    ultimaFilaPaciente = ev.detail && ev.detail.row ? ev.detail.row : null;
    if (ultimoFormatoSeleccionado) {
      setTimeout(function () {
        cargarVistaPreviaFormato(ultimoFormatoSeleccionado);
      }, 200);
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof initPacienteSeleccionV3 === "function") {
      initPacienteSeleccionV3();
    }
    enlazarIframeVistaPrevia(document.getElementById("previewFormatoHCIframe"));
    cargarFormatosHC();
    initSelectorFormatoHC();
    initBotonGuardarHc();
    initBotonCerrarHc();
  });
})();

/**

 * Panel izquierdo: evoluciones / formatos HC guardados del paciente.

 */

(function (global) {

  const ID_BORRADOR = "__nueva__";

  let evolucionActivaId = null;

  let evolucionesGuardadas = [];

  let borradorNueva = null;



  function getDocumentoPaciente() {

    if (typeof global.getDocumentoPacienteActivoHc === "function") {

      return String(global.getDocumentoPacienteActivoHc() || "").trim();

    }

    return String(document.getElementById("DocumentoPaciente")?.value || "").trim();

  }



  function formatearFechaHora(fechaRaw) {

    if (!fechaRaw) return { fecha: "—", hora: "" };

    const d = fechaRaw instanceof Date ? fechaRaw : new Date(fechaRaw);

    if (Number.isNaN(d.getTime())) return { fecha: "—", hora: "" };

    const y = d.getFullYear();

    const mo = String(d.getMonth() + 1).padStart(2, "0");

    const day = String(d.getDate()).padStart(2, "0");

    let h = d.getHours();

    const m = String(d.getMinutes()).padStart(2, "0");

    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12;

    if (h === 0) h = 12;

    return {

      fecha: `${y}-${mo}-${day}`,

      hora: `${String(h).padStart(2, "0")}:${m} ${ampm}`,

    };

  }



  function listaParaRender() {

    const lista = [...evolucionesGuardadas];

    if (borradorNueva) {

      lista.unshift({

        idEvaluacionEntidad: ID_BORRADOR,

        fechaEvaluacion: borradorNueva.fechaEvaluacion,

        nombreFormato: borradorNueva.nombreFormato || "",

        estadoTexto: "Sin guardar",

        estadoClase: "sin-guardar",

        esBorrador: true,

      });

    }

    return lista;

  }



  function actualizarContador() {

    const contador = document.getElementById("evolucionesHcContador");

    if (!contador) return;

    const total = evolucionesGuardadas.length + (borradorNueva ? 1 : 0);

    contador.textContent = `${total} registro(s)`;

  }



  function actualizarBotonNueva() {

    const btn = document.getElementById("btnNuevaEvolucionHc");

    if (!btn) return;

    const tienePaciente = !!getDocumentoPaciente();

    btn.disabled = !tienePaciente;

    btn.title = tienePaciente

      ? "Crear una nueva evolución sin guardar"

      : "Consulte un paciente para crear una nueva evolución";

  }



  function expandirPanelEvoluciones() {

    const layout = document.querySelector(".hc-formato-layout");

    const panel = document.getElementById("panelEvolucionesHc");

    const header = document.getElementById("hcEvolucionesHeaderToggle");

    if (!layout || !panel || !header) return;

    panel.classList.remove("is-collapsed");

    layout.classList.remove("is-evoluciones-collapsed");

    header.setAttribute("aria-expanded", "true");

    header.title = "Ocultar evoluciones previas (clic para comprimir)";

    try {

      sessionStorage.setItem("hc-evoluciones-collapsed", "0");

    } catch (_) {

      /* ignore */

    }

  }



  function renderLista() {

    const lista = document.getElementById("listaEvolucionesHc");

    if (!lista) return;



    const evoluciones = listaParaRender();

    actualizarContador();

    lista.innerHTML = "";



    if (!evoluciones.length) {

      const empty = document.createElement("div");

      empty.className = "hc-evoluciones-empty";

      empty.textContent = getDocumentoPaciente()

        ? "Este paciente no tiene historias clínicas guardadas aún."

        : "Consulte un paciente para ver sus historias guardadas.";

      lista.appendChild(empty);

      return;

    }



    evoluciones.forEach((ev) => {

      const id = ev.idEvaluacionEntidad;

      const { fecha, hora } = formatearFechaHora(ev.fechaEvaluacion);

      const item = document.createElement("button");

      item.type = "button";

      const esBorrador = id === ID_BORRADOR || ev.esBorrador;

      item.className = "hc-evolucion-item w-100 text-start";

      if (esBorrador) item.classList.add("sin-guardar");

      if (evolucionActivaId === id) item.classList.add("active");

      item.dataset.idEvaluacion = String(id);



      const badgeClass = ev.estadoClase || "otro";

      const formato = ev.nombreFormato || "";

      const formatoHtml = formato

        ? `<div class="hc-evolucion-formato w-100" title="${formato}">${formato}</div>`

        : "";



      item.innerHTML = `

        <div class="hc-evolucion-body min-w-0">

          <div class="hc-evolucion-meta">

            <span class="hc-evolucion-fecha">${fecha}</span>

            <span class="hc-evolucion-hora">${hora}</span>

          </div>

          ${formatoHtml}

          <span class="hc-evolucion-badge ${badgeClass}">${ev.estadoTexto || "—"}</span>

        </div>

      `;



      item.addEventListener("click", function () {

        evolucionActivaId = id;

        renderLista();

        if (esBorrador) {

          if (typeof global.iniciarNuevaEvolucionHc === "function") {

            global.iniciarNuevaEvolucionHc({ conservarFormato: true });

          }

        } else if (typeof global.abrirEvolucionHcGuardada === "function") {

          global.abrirEvolucionHcGuardada(id);

        }

      });



      lista.appendChild(item);

    });

  }



  function crearBorradorNuevaEvolucion() {

    const select = document.getElementById("selectFormatoHC");

    const nombreFormato = select ? String(select.value || "").trim() : "";

    borradorNueva = {

      fechaEvaluacion: new Date(),

      nombreFormato,

    };

    evolucionActivaId = ID_BORRADOR;

    expandirPanelEvoluciones();

    renderLista();

    if (typeof global.iniciarNuevaEvolucionHc === "function") {

      global.iniciarNuevaEvolucionHc({ conservarFormato: false });

    }

  }



  global.actualizarBorradorEvolucionHc = function (nombreFormato) {

    if (!borradorNueva || evolucionActivaId !== ID_BORRADOR) return;

    borradorNueva.nombreFormato = String(nombreFormato || "").trim();

    renderLista();

  };



  global.limpiarBorradorEvolucionHc = function () {

    borradorNueva = null;

    if (evolucionActivaId === ID_BORRADOR) evolucionActivaId = null;

    renderLista();

  };



  global.tieneBorradorEvolucionHcActivo = function () {

    return !!borradorNueva && evolucionActivaId === ID_BORRADOR;

  };



  async function cargarEvolucionesPaciente(documentoPaciente) {

    const lista = document.getElementById("listaEvolucionesHc");

    if (!documentoPaciente) {

      evolucionActivaId = null;

      evolucionesGuardadas = [];

      borradorNueva = null;

      actualizarBotonNueva();

      if (lista) {

        lista.innerHTML = "";

        const empty = document.createElement("div");

        empty.className = "hc-evoluciones-empty";

        empty.id = "evolucionesHcPlaceholder";

        empty.textContent = "Consulte un paciente para ver sus historias guardadas.";

        lista.appendChild(empty);

      }

      actualizarContador();

      return;

    }



    try {

      const resp = await fetch(

        `${getApiBaseUrl()}/apiV3/historiasClinicas/evoluciones/${encodeURIComponent(documentoPaciente)}`

      );

      const data = await resp.json();

      if (!resp.ok || !data.ok) {

        throw new Error(data.message || `Error ${resp.status}`);

      }

      evolucionesGuardadas = data.evoluciones || [];

      renderLista();

    } catch (err) {

      console.error("[evolucionesPacienteHc]", err);

      evolucionesGuardadas = [];

      if (lista) {

        lista.innerHTML = "";

        const empty = document.createElement("div");

        empty.className = "hc-evoluciones-empty text-danger";

        empty.textContent = err.message || "Error al cargar evoluciones.";

        lista.appendChild(empty);

      }

    }

    actualizarBotonNueva();

  }



  global.refrescarEvolucionesHcPaciente = function (documentoPaciente) {

    const doc =

      documentoPaciente != null ? String(documentoPaciente).trim() : getDocumentoPaciente();

    borradorNueva = null;

    if (evolucionActivaId === ID_BORRADOR) evolucionActivaId = null;

    return cargarEvolucionesPaciente(doc);

  };



  function initBotonNuevaEvolucion() {

    const btn = document.getElementById("btnNuevaEvolucionHc");

    if (!btn) return;

    btn.addEventListener("click", function (e) {

      e.stopPropagation();

      if (!getDocumentoPaciente()) {

        if (typeof Swal !== "undefined") {

          Swal.fire({

            icon: "warning",

            title: "Paciente",

            text: "Consulte un paciente por documento antes de crear una nueva evolución.",

          });

        }

        return;

      }

      crearBorradorNuevaEvolucion();

    });

  }



  function initTogglePanelEvoluciones() {

    const layout = document.querySelector(".hc-formato-layout");

    const panel = document.getElementById("panelEvolucionesHc");

    const header = document.getElementById("hcEvolucionesHeaderToggle");

    if (!layout || !panel || !header) return;



    const STORAGE_KEY = "hc-evoluciones-collapsed";



    function setCollapsed(collapsed) {

      panel.classList.toggle("is-collapsed", collapsed);

      layout.classList.toggle("is-evoluciones-collapsed", collapsed);

      header.setAttribute("aria-expanded", collapsed ? "false" : "true");

      header.title = collapsed

        ? "Mostrar evoluciones previas (clic para expandir)"

        : "Ocultar evoluciones previas (clic para comprimir)";

      try {

        sessionStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");

      } catch (_) {

        /* ignore */

      }

    }



    try {

      setCollapsed(sessionStorage.getItem(STORAGE_KEY) === "1");

    } catch (_) {

      setCollapsed(false);

    }



    header.addEventListener("click", function () {

      setCollapsed(!panel.classList.contains("is-collapsed"));

    });

    header.addEventListener("keydown", function (e) {

      if (e.key === "Enter" || e.key === " ") {

        e.preventDefault();

        setCollapsed(!panel.classList.contains("is-collapsed"));

      }

    });

  }



  document.addEventListener("hc-paciente-cargado", function (ev) {

    const doc = ev.detail?.row?.DocumentoPaciente || "";

    evolucionActivaId = null;

    borradorNueva = null;

    cargarEvolucionesPaciente(doc);

    actualizarBotonNueva();

  });



  document.addEventListener("hc-evoluciones-refrescar", function () {

    global.refrescarEvolucionesHcPaciente();

  });



  document.addEventListener("DOMContentLoaded", function () {

    cargarEvolucionesPaciente("");

    initTogglePanelEvoluciones();

    initBotonNuevaEvolucion();

    actualizarBotonNueva();

  });

})(window);



/**
 * Selección de paciente por documento (módulo Historias Clínicas).
 * Facturas / presupuestos se vinculan al documento consultado, no a listaHC.
 */
(function (global) {
  let documentoPacienteActivo = "";

  function getDocumentoPacienteActivo() {
    if (documentoPacienteActivo) return documentoPacienteActivo;
    const input = document.getElementById("inputBuscarDocumentoPaciente");
    const docInput = document.getElementById("DocumentoPaciente");
    const raw = (input && input.value) || (docInput && docInput.value) || "";
    return String(raw).trim();
  }

  function agregarOpcionPorDefecto(select) {
    if (!select) return;
    select.innerHTML = "";
    const opt = document.createElement("option");
    opt.textContent = "Sin Seleccionar";
    opt.value = "Sin Seleccionar";
    select.appendChild(opt);
  }

  function setControlesFacturaPresupuesto(habilitado) {
    const buscarFacturas = document.getElementById("BuscarPorFacturas");
    const buscarPresupuestos = document.getElementById("BuscarPorPresupuestos");
    const facturaSelect = document.getElementById("FacturaARelacionar");
    const presupuestoSelect = document.getElementById("PresupuestoARelacionar");

    if (buscarFacturas) {
      buscarFacturas.disabled = !habilitado;
      if (!habilitado) buscarFacturas.checked = false;
    }
    if (buscarPresupuestos) {
      buscarPresupuestos.disabled = !habilitado;
      if (!habilitado) buscarPresupuestos.checked = false;
    }
    if (facturaSelect) facturaSelect.disabled = !habilitado;
    if (presupuestoSelect) presupuestoSelect.disabled = !habilitado;

    const facturasDiv = document.getElementById("Facturas");
    const presupuestosDiv = document.getElementById("Presupuestos");
    if (facturasDiv) facturasDiv.style.display = "none";
    if (presupuestosDiv) presupuestosDiv.style.display = "none";

    if (!habilitado) {
      agregarOpcionPorDefecto(facturaSelect);
      agregarOpcionPorDefecto(presupuestoSelect);
    }
  }

  function normalizarListaFacturas(respuesta) {
    if (!respuesta) return [];
    if (Array.isArray(respuesta)) return respuesta;
    if (Array.isArray(respuesta.recordset)) return respuesta.recordset;
    return [];
  }

  async function traerFacturasPaciente(select, documentoPaciente) {
    if (!select) return;
    if (!documentoPaciente) {
      Swal.fire({
        icon: "info",
        title: "Paciente",
        text: "Primero consulte un paciente por documento.",
      });
      return;
    }
    try {
      const url = `${getApiBaseUrl()}/apiV3/ConsultarFacturas/${encodeURIComponent(documentoPaciente)}`;
      const resp = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
      if (!resp.ok) {
        const errorResponse = await resp.text();
        Swal.fire({ icon: "error", html: `<span style="color:#fff;">${errorResponse}</span>` });
        agregarOpcionPorDefecto(select);
        return;
      }
      const raw = await resp.json();
      const lista = normalizarListaFacturas(raw);
      agregarOpcionPorDefecto(select);

      if (lista.length === 0) {
        console.warn("[HC] ConsultarFacturas sin filas:", url, raw);
        return;
      }

      lista.forEach((factura) => {
        const text = factura.Text ?? factura.text ?? "";
        const value = factura.Value ?? factura.value ?? "";
        const total = factura.TotalFactura ?? factura.totalFactura ?? "";
        const option = document.createElement("option");
        option.textContent = `${text} - $${total}`;
        option.value = String(value);
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Error en facturas:", error);
      Swal.fire({ icon: "error", title: "Facturas", text: error.message || String(error) });
    }
  }

  async function traerPresupuestosPaciente(select, documentoPaciente) {
    if (!documentoPaciente) {
      Swal.fire({
        icon: "info",
        title: "Paciente",
        text: "Primero consulte un paciente por documento.",
      });
      return;
    }
    try {
      const resp = await fetch(
        `${getApiBaseUrl()}/apiV3/ConsultarPresupuestos/${encodeURIComponent(documentoPaciente)}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!resp.ok) {
        const errorResponse = await resp.text();
        Swal.fire({ icon: "error", html: `<span style="color:#fff;">${errorResponse}</span>` });
        agregarOpcionPorDefecto(select);
        return;
      }
      const respuesta = await resp.json();
      agregarOpcionPorDefecto(select);
      respuesta.forEach((presupuesto) => {
        const option = document.createElement("option");
        option.textContent = `${presupuesto.Text} - $${presupuesto.TotalPresupuesto}`;
        option.value = presupuesto.Value;
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Error en presupuestos:", error);
    }
  }

  function actualizarResumenPaciente(row) {
    const el = document.getElementById("pacienteConsultadoResumen");
    if (!el) return;
    if (!row) {
      el.textContent = "Ningún paciente consultado.";
      el.classList.add("text-muted", "fst-italic");
      return;
    }
    const nombre = row.NombreCompletoPaciente || "";
    const doc = row.DocumentoPaciente || "";
    const tipo = row.TipoDocumentoPaciente || row.DescripciTipoDocumento || "";
    el.classList.remove("text-muted", "fst-italic");
    el.innerHTML = `<strong>Paciente:</strong> ${nombre} &nbsp;|&nbsp; <strong>Documento:</strong> ${tipo} ${doc}`;
  }

  function refrescarFacturasPresupuestosSiMarcados() {
    if (!getDocumentoPacienteActivo()) return;
    const origen = document.getElementById("BuscarPorFacturas")?.checked
      ? "BuscarPorFacturas"
      : document.getElementById("BuscarPorPresupuestos")?.checked
        ? "BuscarPorPresupuestos"
        : null;
    if (origen) aplicarEstadoCheckboxesFacturaPresupuesto(origen);
  }

  async function buscarPacientePorDocumentoManual() {
    const input = document.getElementById("inputBuscarDocumentoPaciente");
    const doc = String(input ? input.value : "").trim();
    if (!doc) {
      Swal.fire({ icon: "warning", title: "Documento", text: "Ingrese el documento del paciente." });
      return;
    }

    try {
      const resp = await fetch(
        `${getApiBaseUrl()}/apiV3/DatosdeUsuarioHC/${encodeURIComponent(doc)}`
      );
      if (!resp.ok) {
        documentoPacienteActivo = "";
        setControlesFacturaPresupuesto(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `No se pudo consultar el paciente (${resp.status}).`,
        });
        return;
      }
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        documentoPacienteActivo = "";
        setControlesFacturaPresupuesto(false);
        actualizarResumenPaciente(null);
        if (typeof limpiarDatosPacienteV3 === "function") limpiarDatosPacienteV3();
        Swal.fire({
          icon: "warning",
          title: "Sin datos",
          text: "No se encontró el paciente en el directorio de usuarios para ese documento.",
        });
        return;
      }

      const row = data[0];
      documentoPacienteActivo = String(
        row.DocumentoPaciente != null ? row.DocumentoPaciente : doc
      ).trim();

      if (input && documentoPacienteActivo) {
        input.value = documentoPacienteActivo;
      }

      if (typeof aplicarDatosPacienteV3 === "function") {
        aplicarDatosPacienteV3(row);
      }
      document.dispatchEvent(
        new CustomEvent("hc-paciente-cargado", { detail: { row } })
      );
      actualizarResumenPaciente(row);
      setControlesFacturaPresupuesto(true);
      refrescarFacturasPresupuestosSiMarcados();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Paciente cargado",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      documentoPacienteActivo = "";
      setControlesFacturaPresupuesto(false);
      Swal.fire({ icon: "error", title: "Error", text: err && err.message ? err.message : String(err) });
    }
  }

  function aplicarEstadoCheckboxesFacturaPresupuesto(origenId) {
    const doc = getDocumentoPacienteActivo();
    const buscarFacturas = document.getElementById("BuscarPorFacturas");
    const buscarPresupuestos = document.getElementById("BuscarPorPresupuestos");
    const facturaSelect = document.getElementById("FacturaARelacionar");
    const presupuestoSelect = document.getElementById("PresupuestoARelacionar");
    const facturasDiv = document.getElementById("Facturas");
    const presupuestosDiv = document.getElementById("Presupuestos");

    if (!doc) {
      if (buscarFacturas) buscarFacturas.checked = false;
      if (buscarPresupuestos) buscarPresupuestos.checked = false;
      if (facturasDiv) facturasDiv.style.display = "none";
      if (presupuestosDiv) presupuestosDiv.style.display = "none";
      return;
    }

    const facturasOn = buscarFacturas && buscarFacturas.checked;
    const presupuestosOn = buscarPresupuestos && buscarPresupuestos.checked;

    if (origenId === "BuscarPorFacturas" && facturasOn && presupuestosOn && buscarPresupuestos) {
      buscarPresupuestos.checked = false;
    }
    if (origenId === "BuscarPorPresupuestos" && presupuestosOn && facturasOn && buscarFacturas) {
      buscarFacturas.checked = false;
    }

    const facturasFinal = buscarFacturas && buscarFacturas.checked;
    const presupuestosFinal = buscarPresupuestos && buscarPresupuestos.checked;

    if (facturasDiv) facturasDiv.style.display = facturasFinal ? "block" : "none";
    if (presupuestosDiv) presupuestosDiv.style.display = presupuestosFinal ? "block" : "none";

    if (facturasFinal) {
      traerFacturasPaciente(facturaSelect, doc);
    } else {
      agregarOpcionPorDefecto(facturaSelect);
    }

    if (presupuestosFinal) {
      traerPresupuestosPaciente(presupuestoSelect, doc);
    } else {
      agregarOpcionPorDefecto(presupuestoSelect);
    }
  }

  function initWireFacturasPresupuestos() {
    ["BuscarPorFacturas", "BuscarPorPresupuestos"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", function () {
        if (!getDocumentoPacienteActivo()) {
          this.checked = false;
          aplicarEstadoCheckboxesFacturaPresupuesto(id);
          Swal.fire({
            icon: "info",
            title: "Paciente",
            text: "Primero consulte un paciente por documento con el botón Buscar.",
          });
          return;
        }
        aplicarEstadoCheckboxesFacturaPresupuesto(id);
      });
    });
  }

  function initPacienteSeleccionV3() {
    const token = localStorage.getItem("token");
    if (!token) {
      const contenido = document.getElementById("Contenido");
      if (contenido) contenido.style.display = "none";
      Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        icon: "warning",
        html: `<h4 style="color: #FFFFFF">Primero debes iniciar sesión para acceder a esta página</h4>`,
        showConfirmButton: false,
      });
      setTimeout(() => {
        window.location.href = "index.html";
      }, 5000);
      return;
    }

    setControlesFacturaPresupuesto(false);
    initWireFacturasPresupuestos();

    const btnBuscarDoc = document.getElementById("btnBuscarPacientePorDocumento");
    const inputBuscarDoc = document.getElementById("inputBuscarDocumentoPaciente");
    if (btnBuscarDoc) btnBuscarDoc.addEventListener("click", buscarPacientePorDocumentoManual);
    if (inputBuscarDoc) {
      inputBuscarDoc.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          buscarPacientePorDocumentoManual();
        }
      });
    }

    const regresar = document.getElementById("RegresarAPrincipal");
    if (regresar) {
      regresar.addEventListener("click", () => {
        window.location.href = "RIPS.html";
      });
    }
  }

  global.initPacienteSeleccionV3 = initPacienteSeleccionV3;
  global.buscarPacientePorDocumentoManual = buscarPacientePorDocumentoManual;
  global.getDocumentoPacienteActivoHc = getDocumentoPacienteActivo;
})(window);

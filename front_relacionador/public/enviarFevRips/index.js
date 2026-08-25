/**
 * Módulo Enviar FEV-RIPS — modos independientes Con factura / Sin factura.
 */

import { mountAppSidebar } from "../shared/appSidebar.js";
import { ensureAuthAndSyncTopbar } from "../shared/shell.js";

let paquetesCache = [];
let ultimoRango = { fi: "", ff: "" };
let modoActual = "con_factura"; // con_factura | sin_factura

function apiBase() {
  return window.getApiBaseUrl ? window.getApiBaseUrl() : "";
}

function getDocumentoEmpresa() {
  return String(sessionStorage.getItem("empresaTrabajarExecuted") || "").trim();
}

function esSinFactura() {
  return modoActual === "sin_factura";
}

function itemListo(p) {
  if (esSinFactura()) return Boolean(p.tieneJson);
  return Boolean(p.tieneXml && p.tieneJson);
}

function badgeClass(estado) {
  if (
    estado === "Enviado OK" ||
    estado === "OK" ||
    estado === "OK con avisos" ||
    estado === "XML descargado" ||
    estado === "JSON listo" ||
    estado === "Listo" ||
    estado === "Sí"
  ) {
    return "fevrips-badge fevrips-badge-ok";
  }
  if (
    estado === "Rechazado" ||
    estado === "Con errores" ||
    estado === "Sin XML" ||
    /error|omitido|no/i.test(estado || "")
  ) {
    return "fevrips-badge fevrips-badge-err";
  }
  if (estado === "Incompleto" || estado === "Sin JSON") return "fevrips-badge fevrips-badge-inc";
  return "fevrips-badge fevrips-badge-pend";
}

function aplicarUiModo() {
  const sin = esSinFactura();
  document.querySelectorAll("[data-modo-only='con_factura']").forEach((el) => {
    el.classList.toggle("d-none", sin);
  });
  document.querySelectorAll(".col-xml").forEach((el) => {
    el.classList.toggle("d-none", sin);
  });

  document.getElementById("btnModoConFactura")?.classList.toggle("is-active", !sin);
  document.getElementById("btnModoSinFactura")?.classList.toggle("is-active", sin);

  const dashTotal = document.getElementById("dashLabelTotal");
  if (dashTotal) dashTotal.textContent = sin ? "Total paquetes" : "Total facturas";

  const btnBuscar = document.getElementById("btnBuscarFevRips");
  if (btnBuscar) btnBuscar.textContent = sin ? "Buscar paquetes" : "Buscar facturas";

  const hint = document.getElementById("fevripsBuscarHint");
  if (hint) {
    hint.textContent = sin
      ? "Paquetes RIPS Sin Factura (JSON) empaquetados o en lotes cuyo rango solapa las fechas."
      : "Facturas con RIPS en el rango. Muestra si el XML ya está en caché empresa; descarga solo los que falten.";
  }

  const info = document.getElementById("fevripsInfoText");
  if (info) {
    const apiEl = document.getElementById("fevripsApiBaseLabel");
    const ambEl = document.getElementById("fevripsAmbienteLabel");
    const apiTxt = apiEl?.textContent || "—";
    const ambTxt = ambEl?.textContent || "—";
    if (sin) {
      info.innerHTML = `
        Modo <strong>Sin factura</strong>: lista JSON <code>SinFactura_*</code> en
        <code>ARCHIVOS_DE_ENVIO/.../SIN_FACTURA</code> o lotes JSON.
        Envía con <code>CargarRipsSinFactura</code> (sin XML).
        API: <code id="fevripsApiBaseLabel">${apiTxt}</code> · Ambiente:
        <strong id="fevripsAmbienteLabel">${ambTxt}</strong>`;
    } else {
      info.innerHTML = `
        Modo <strong>Con factura</strong>: lista facturas con RIPS y estado del <strong>XML</strong> en
        <code>XMLS/{empresa}/</code>. Envía con <code>CargarFevRips</code> (XML+JSON).
        API: <code id="fevripsApiBaseLabel">${apiTxt}</code> · Ambiente:
        <strong id="fevripsAmbienteLabel">${ambTxt}</strong>`;
    }
  }
}

function setModo(modo) {
  const next = modo === "sin_factura" ? "sin_factura" : "con_factura";
  if (next === modoActual) return;
  modoActual = next;
  paquetesCache = [];
  aplicarUiModo();
  renderDashboard({});
  const tbody = document.getElementById("tbodyFevRips");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${esSinFactura() ? 8 : 9}" class="text-center py-4 text-muted">
          Modo <strong>${esSinFactura() ? "Sin factura" : "Con factura"}</strong>.
          Seleccione fechas y pulse <strong>${esSinFactura() ? "Buscar paquetes" : "Buscar facturas"}</strong>.
        </td>
      </tr>`;
  }
  updateActionButtons();
}

function renderDashboard(d) {
  const dash = d || {};
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(v ?? 0);
  };
  set("dashTotal", dash.total);
  set("dashConXml", dash.conXml);
  set("dashSinXml", dash.sinXml);
  set("dashConJson", dash.conJson);
  set("dashListos", dash.listos);
  set("dashOk", dash.enviadosOk || 0);

  const valOk = paquetesCache.filter((p) => p.prevalidacion?.ok === true).length;
  const valErr = paquetesCache.filter((p) => p.prevalidacion && p.prevalidacion.ok === false).length;
  set("dashValidados", valOk);
  set("dashValErr", valErr);

  const btnDl = document.getElementById("btnDescargarXmlFaltantes");
  if (btnDl) btnDl.disabled = esSinFactura() || !(dash.sinXml > 0);
}

function selectedItems() {
  return [...document.querySelectorAll(".fev-chk:checked")].map((el) => ({
    clave: el.getAttribute("data-clave"),
    reporte: el.getAttribute("data-reporte") || "",
    Prefijo: el.getAttribute("data-prefijo") || "",
    NoFactura: el.getAttribute("data-folio") || "",
    tipo: esSinFactura() ? "SIN_FACTURA" : "CON_FACTURA",
  }));
}

function itemsPrevalidadosOk(fromSelection = false) {
  const base = fromSelection
    ? selectedItems()
    : paquetesCache.filter(itemListo).map((p) => ({
        clave: p.clave,
        reporte: p.reporte || "",
        Prefijo: p.Prefijo || "",
        NoFactura: p.NoFactura,
        tipo: esSinFactura() ? "SIN_FACTURA" : "CON_FACTURA",
      }));
  return base.filter((it) => {
    const p = paquetesCache.find((x) => x.clave === it.clave);
    return p?.prevalidacion?.ok === true;
  });
}

function scopeValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el?.value || "seleccionados";
}

function updateActionButtons() {
  const listos = paquetesCache.filter(itemListo).length;
  const sel = selectedItems().length;
  const valOkAll = paquetesCache.filter((p) => p.prevalidacion?.ok === true).length;
  const valOkSel = itemsPrevalidadosOk(true).length;
  const scopeVal = scopeValue("scopeValidarFev");
  const scopeEnv = scopeValue("scopeEnviarFev");

  const btnVal = document.getElementById("btnValidarFev");
  const btnEnv = document.getElementById("btnEnviarFev");

  if (btnVal) {
    btnVal.disabled = scopeVal === "todos" ? listos === 0 : sel === 0;
  }
  if (btnEnv) {
    btnEnv.disabled = scopeEnv === "todos" ? valOkAll === 0 : valOkSel === 0;
  }
}

function itemsParaValidarSegunScope() {
  const scope = scopeValue("scopeValidarFev");
  if (scope === "todos") {
    return paquetesCache.filter(itemListo).map((p) => ({
      clave: p.clave,
      reporte: p.reporte || "",
      Prefijo: p.Prefijo || "",
      NoFactura: p.NoFactura,
      tipo: esSinFactura() ? "SIN_FACTURA" : "CON_FACTURA",
    }));
  }
  return selectedItems();
}

function itemsParaEnviarSegunScope() {
  const scope = scopeValue("scopeEnviarFev");
  return itemsPrevalidadosOk(scope === "seleccionados");
}

function renderTabla(paquetes) {
  const tbody = document.getElementById("tbodyFevRips");
  if (!tbody) return;
  paquetesCache = Array.isArray(paquetes) ? paquetes : [];
  const cols = esSinFactura() ? 8 : 9;

  if (!paquetesCache.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${cols}" class="text-center py-4 text-muted">
          ${
            esSinFactura()
              ? "No hay paquetes Sin Factura en ese rango."
              : "No hay facturas con RIPS en ese rango para la empresa de trabajo."
          }
        </td>
      </tr>`;
    updateActionButtons();
    return;
  }

  tbody.innerHTML = paquetesCache
    .map((p) => {
      const prev = p.prevalidacion;
      const prevLabel = prev
        ? prev.estadoValidacion || (prev.ok ? "OK" : "Con errores")
        : "Sin validar";
      const prevDetail = prev?.detalle || "—";
      const cuv = p.ultimoEnvio?.codigoUnicoValidacion || p.ultimoEnvio?.detalle || "—";
      const xmlLabel = p.tieneXml ? "Sí" : "No";
      const jsonLabel = p.tieneJson ? "Sí" : "No";
      const puedeValidar = itemListo(p);
      const fecha = p.FechaFactura || p.fechaInicioLote || "—";
      const xmlCell = esSinFactura()
        ? ""
        : `<td><span class="${badgeClass(xmlLabel === "Sí" ? "XML descargado" : "Sin XML")}">${xmlLabel}</span></td>`;
      return `
      <tr data-clave="${p.clave}">
        <td>
          <input type="checkbox" class="fev-chk form-check-input" data-clave="${p.clave}"
            data-reporte="${String(p.reporte || "").replace(/"/g, "&quot;")}"
            data-prefijo="${String(p.Prefijo || "").replace(/"/g, "&quot;")}"
            data-folio="${String(p.NoFactura ?? "").replace(/"/g, "&quot;")}" checked>
        </td>
        <td><span class="fevrips-clave">${p.clave}</span></td>
        <td class="small">${fecha}</td>
        ${xmlCell}
        <td title="${p.estadoJson || ""}"><span class="${badgeClass(jsonLabel === "Sí" ? "JSON listo" : "Sin JSON")}">${jsonLabel}</span></td>
        <td title="${String(prevDetail).replace(/"/g, "&quot;")}">
          <span class="${badgeClass(prevLabel)}">${prevLabel}</span>
        </td>
        <td><span class="${badgeClass(p.estadoUi)}">${p.estadoUi || "—"}</span></td>
        <td class="small" style="max-width:180px;word-break:break-all;">${String(
          p.cuvFevRips || cuv
        ).replace(/</g, "&lt;")}</td>
        <td class="text-end text-nowrap">
          <button type="button" class="btn btn-sm btn-outline-warning btn-validar-uno"
            data-clave="${p.clave}" data-reporte="${String(p.reporte || "").replace(/"/g, "&quot;")}"
            data-prefijo="${String(p.Prefijo || "").replace(/"/g, "&quot;")}"
            data-folio="${String(p.NoFactura ?? "").replace(/"/g, "&quot;")}"
            ${puedeValidar ? "" : "disabled"}>Validar</button>
          <button type="button" class="btn btn-sm btn-outline-success btn-enviar-uno"
            data-clave="${p.clave}" data-reporte="${String(p.reporte || "").replace(/"/g, "&quot;")}"
            data-prefijo="${String(p.Prefijo || "").replace(/"/g, "&quot;")}"
            data-folio="${String(p.NoFactura ?? "").replace(/"/g, "&quot;")}"
            ${p.prevalidacion?.ok ? "" : "disabled"}>Enviar</button>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".btn-validar-uno").forEach((btn) => {
    btn.addEventListener("click", () => {
      validarItems([
        {
          clave: btn.getAttribute("data-clave"),
          reporte: btn.getAttribute("data-reporte"),
          Prefijo: btn.getAttribute("data-prefijo"),
          NoFactura: btn.getAttribute("data-folio"),
          tipo: esSinFactura() ? "SIN_FACTURA" : "CON_FACTURA",
        },
      ]);
    });
  });
  tbody.querySelectorAll(".btn-enviar-uno").forEach((btn) => {
    btn.addEventListener("click", () => {
      enviarItems([
        {
          clave: btn.getAttribute("data-clave"),
          reporte: btn.getAttribute("data-reporte"),
          Prefijo: btn.getAttribute("data-prefijo"),
          NoFactura: btn.getAttribute("data-folio"),
          tipo: esSinFactura() ? "SIN_FACTURA" : "CON_FACTURA",
        },
      ]);
    });
  });
  tbody.querySelectorAll(".fev-chk").forEach((chk) => {
    chk.addEventListener("change", updateActionButtons);
  });
  updateActionButtons();
}

function aplicarPrevalidacion(items) {
  const byKey = new Map(items.map((i) => [i.clave, i]));
  paquetesCache = paquetesCache.map((p) => {
    const hit = byKey.get(p.clave);
    if (!hit) return p;
    return {
      ...p,
      prevalidacion: {
        ok: hit.ok,
        estadoValidacion: hit.estadoValidacion,
        errors: hit.errors || [],
        warnings: hit.warnings || [],
        detalle: hit.detalle,
      },
    };
  });
  renderTabla(paquetesCache);
}

async function cargarConfig() {
  try {
    const res = await fetch(`${apiBase()}/RIPS/fevrips/config`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const a = document.getElementById("fevripsApiBaseLabel");
      const b = document.getElementById("fevripsAmbienteLabel");
      if (a) a.textContent = data.apiBaseUrl || "—";
      if (b) b.textContent = data.ambiente || "—";
    }
  } catch (_) {
    /* ignore */
  }
}

async function buscarPaquetes() {
  const fi = document.getElementById("fechaInicioFev")?.value;
  const ff = document.getElementById("fechaFinFev")?.value;
  const doc = getDocumentoEmpresa();

  if (!fi || !ff) {
    Swal.fire({ icon: "warning", title: "Fechas", text: "Seleccione fecha inicio y fin." });
    return;
  }
  if (!doc) {
    Swal.fire({
      icon: "error",
      title: "Empresa",
      text: "No hay empresa de trabajo. Vuelva a Inicio y seleccione empresa.",
    });
    return;
  }

  ultimoRango = { fi, ff };
  const titulo = esSinFactura() ? "Buscando paquetes Sin Factura…" : "Buscando facturas…";
  Swal.fire({ title: titulo, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    const qs = new URLSearchParams({
      fechaInicio: fi,
      fechaFin: ff,
      documentoEmpresa: doc,
      modo: modoActual,
    });
    const res = await fetch(`${apiBase()}/RIPS/fevrips/paquetes-rango?${qs}`);
    const data = await res.json().catch(() => ({}));
    Swal.close();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

    renderDashboard(data.dashboard || {});
    renderTabla((data.paquetes || []).map((p) => ({ ...p, prevalidacion: null })));
  } catch (err) {
    Swal.close();
    Swal.fire({ icon: "error", title: "Error", text: err.message || String(err) });
  }
}

async function buscarFacturador() {
  const doc = getDocumentoEmpresa();
  const res = await fetch(`${apiBase()}/XMLS/Facturador/${encodeURIComponent(doc)}`);
  if (!res.ok) throw new Error("No se pudo determinar el facturador de la empresa");
  const arr = await res.json();
  return arr?.[0]?.Facturador || "";
}

async function descargarXmlsFaltantes() {
  if (esSinFactura()) return;
  const doc = getDocumentoEmpresa();
  const { fi, ff } = ultimoRango;
  const sinXml = paquetesCache.filter((p) => !p.tieneXml).length;
  if (!fi || !ff) {
    Swal.fire({ icon: "warning", text: "Busque primero un rango de fechas." });
    return;
  }
  if (!sinXml) {
    Swal.fire({ icon: "info", text: "No hay XMLs faltantes en este listado." });
    return;
  }

  const conf = await Swal.fire({
    icon: "question",
    title: "Descargar XMLs faltantes",
    html: `<p>Se descargarán hasta <strong>${sinXml}</strong> XML(s) ausentes del rango<br><code>${fi}</code> → <code>${ff}</code></p>
           <p class="small text-muted">Los que ya estén en la carpeta empresa se omiten.</p>`,
    showCancelButton: true,
    confirmButtonText: "Descargar",
  });
  if (!conf.isConfirmed) return;

  let facturador;
  try {
    facturador = await buscarFacturador();
  } catch (e) {
    Swal.fire({ icon: "error", text: e.message || String(e) });
    return;
  }
  const esFenalco = /fenalco/i.test(facturador);
  const pathSegment = esFenalco
    ? "descargarxmls-stream-fenalco-sin-prefijo"
    : "descargarxmls-stream-facturatech-sin-prefijo";

  Swal.fire({
    title: "Descargando XMLs…",
    html: `<p id="fevDlProg">Conectando (${facturador || "API"})…</p>`,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const response = await fetch(
      `${apiBase()}/XMLS/${pathSegment}/${fi}/${ff}/${encodeURIComponent(doc)}`,
      { method: "POST" }
    );
    if (!response.ok || !response.body) {
      throw new Error(`Error HTTP ${response.status}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        let ev;
        try {
          ev = JSON.parse(line);
        } catch (_) {
          continue;
        }
        if (ev.type === "progress" || ev.type === "factura") {
          const el = document.getElementById("fevDlProg");
          if (el) {
            el.textContent = `${ev.Prefijo || ""}${ev.NoFactura || ev.factura || ""} — ${ev.estado || ev.message || ""}`;
          }
        }
        if (ev.type === "error" && ev.message) {
          console.warn("[fevrips xml]", ev.message);
        }
      }
    }
    await buscarPaquetes();
    Swal.fire({
      icon: "success",
      title: "Descarga finalizada",
      text: "Se actualizó el estado de XMLs. Revise la columna XML.",
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Error descarga", text: err.message || String(err) });
  }
}

async function editarCredenciales() {
  const doc = getDocumentoEmpresa();
  if (!doc) {
    Swal.fire({ icon: "warning", text: "Seleccione empresa de trabajo en Inicio." });
    return;
  }
  let actual = {};
  try {
    const res = await fetch(`${apiBase()}/RIPS/fevrips/credenciales/${encodeURIComponent(doc)}`);
    if (res.ok) actual = await res.json();
  } catch (_) {
    /* ignore */
  }

  const { value: form } = await Swal.fire({
    title: "Credenciales SISPRO",
    html: `
      <p class="small text-start">Empresa: <code>${doc}</code></p>
      <input id="swalTipoDoc" class="swal2-input" placeholder="Tipo doc (CC)" value="${actual.tipoDocumento || "CC"}">
      <input id="swalNumDoc" class="swal2-input" placeholder="Número documento" value="${actual.numeroDocumento || ""}">
      <input id="swalClave" class="swal2-input" type="password" placeholder="Clave SISPRO">
      <input id="swalNit" class="swal2-input" placeholder="NIT" value="${actual.nit || doc}">
      <input id="swalTipoUsr" class="swal2-input" placeholder="Tipo usuario (RE)" value="${actual.tipoUsuario || "RE"}">
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar",
    preConfirm: () => ({
      tipoDocumento: document.getElementById("swalTipoDoc").value.trim() || "CC",
      numeroDocumento: document.getElementById("swalNumDoc").value.trim(),
      clave: document.getElementById("swalClave").value,
      nit: document.getElementById("swalNit").value.trim() || doc,
      tipoUsuario: document.getElementById("swalTipoUsr").value.trim() || "RE",
    }),
  });
  if (!form) return;
  if (!form.numeroDocumento || !form.clave) {
    Swal.fire({ icon: "warning", text: "Documento y clave obligatorios." });
    return;
  }
  const res = await fetch(`${apiBase()}/RIPS/fevrips/credenciales/${encodeURIComponent(doc)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    Swal.fire({ icon: "error", text: data.message || "No se guardó" });
    return;
  }
  Swal.fire({ icon: "success", text: "Credenciales guardadas." });
}

async function validarItems(items) {
  if (!items?.length) {
    Swal.fire({
      icon: "warning",
      text: esSinFactura() ? "Seleccione al menos un paquete." : "Seleccione al menos una factura.",
    });
    return;
  }
  Swal.fire({
    title: "Prevalidando…",
    html: esSinFactura()
      ? "Revisión local de JSON Sin Factura (sin enviar a MinSalud)."
      : "Revisión local de JSON/XML (sin enviar a MinSalud).",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });
  try {
    const res = await fetch(`${apiBase()}/RIPS/fevrips/validar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentoEmpresa: getDocumentoEmpresa(),
        modo: modoActual,
        items,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    aplicarPrevalidacion(data.items || []);
    const r = data.resumen || {};
    Swal.fire({
      icon: r.conErrores ? "warning" : "success",
      title: "Prevalidación local",
      html: `
        <p>OK: <strong>${r.ok || 0}</strong> · Con avisos: <strong>${r.okConAvisos || 0}</strong> · Con errores: <strong>${r.conErrores || 0}</strong></p>
        <p class="small text-muted mb-0">${
          esSinFactura()
            ? "Solo se requiere JSON SinFactura listo."
            : "Si falta JSON, genérelo/empaquete antes de enviar. El XML debe estar en caché."
        }</p>`,
    });
  } catch (err) {
    Swal.fire({ icon: "error", text: err.message || String(err) });
  }
}

function mostrarResultado(data) {
  const items = data.items || [];
  const r = data.resumen || {};
  const rows = items
    .map(
      (i) => `
    <tr>
      <td><code>${i.clave || ""}</code></td>
      <td>${i.estado || ""}</td>
      <td style="font-size:0.75rem;word-break:break-all;">${i.codigoUnicoValidacion || "—"}</td>
      <td style="font-size:0.75rem;">${String(i.detalle || "").replace(/</g, "&lt;")}</td>
    </tr>`
    )
    .join("");

  Swal.fire({
    icon: r.errores || r.rechazados || r.omitidosPrevalidacion ? "warning" : "success",
    title: "Resultado envío",
    width: "90%",
    html: `
      <p>OK: <strong>${r.ok || 0}</strong> · Rechazados: <strong>${r.rechazados || 0}</strong> · Errores: <strong>${r.errores || 0}</strong> · Omitidos: <strong>${r.omitidosPrevalidacion || 0}</strong></p>
      <div style="max-height:360px;overflow:auto;text-align:left;">
        <table class="table table-sm"><thead><tr><th>Clave</th><th>Estado</th><th>CUV</th><th>Detalle</th></tr></thead>
        <tbody>${rows || "<tr><td colspan=4>Sin ítems</td></tr>"}</tbody></table>
      </div>`,
  });
}

async function enviarItems(items) {
  const doc = getDocumentoEmpresa();
  if (!doc) {
    Swal.fire({ icon: "warning", text: "Sin empresa de trabajo." });
    return;
  }
  const okItems = items.filter((it) => {
    const p = paquetesCache.find((x) => x.clave === it.clave);
    return p?.prevalidacion?.ok === true;
  });
  if (!okItems.length) {
    Swal.fire({
      icon: "warning",
      title: "Sin prevalidados",
      text: esSinFactura()
        ? "Primero valide. Solo se envían paquetes con prevalidación OK (JSON)."
        : "Primero valide. Solo se envían facturas con prevalidación OK (XML + JSON).",
    });
    return;
  }

  const conf = await Swal.fire({
    icon: "question",
    title: "¿Enviar a MinSalud?",
    html: `<p>${okItems.length} ${esSinFactura() ? "paquete(s) Sin Factura" : "factura(s)"} → API Docker FEV-RIPS</p>
           <p class="small text-muted">${esSinFactura() ? "CargarRipsSinFactura" : "CargarFevRips"}</p>`,
    showCancelButton: true,
    confirmButtonText: "Enviar",
  });
  if (!conf.isConfirmed) return;

  Swal.fire({
    title: "Enviando…",
    html: "No cierre esta ventana.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await fetch(`${apiBase()}/RIPS/fevrips/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentoEmpresa: doc, modo: modoActual, items: okItems }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      Swal.fire({ icon: "error", title: "Error", text: data.message || `HTTP ${res.status}` });
      return;
    }
    mostrarResultado(data);
    await buscarPaquetes();
  } catch (err) {
    Swal.fire({ icon: "error", text: err.message || String(err) });
  }
}

async function init() {
  await ensureAuthAndSyncTopbar();
  mountAppSidebar({ active: "enviar-fevrips" });

  const doc = getDocumentoEmpresa();
  const empLabel = document.getElementById("fevripsEmpresaLabel");
  if (empLabel) {
    empLabel.textContent = doc
      ? `Empresa de trabajo: ${doc}`
      : "Empresa: no seleccionada (vaya a Inicio)";
  }

  await cargarConfig();
  aplicarUiModo();

  document.getElementById("btnModoConFactura")?.addEventListener("click", () => setModo("con_factura"));
  document.getElementById("btnModoSinFactura")?.addEventListener("click", () => setModo("sin_factura"));
  document.getElementById("btnBuscarFevRips")?.addEventListener("click", buscarPaquetes);
  document.getElementById("btnDescargarXmlFaltantes")?.addEventListener("click", descargarXmlsFaltantes);
  document.getElementById("btnCredencialesFev")?.addEventListener("click", editarCredenciales);
  document.getElementById("btnValidarFev")?.addEventListener("click", () => {
    validarItems(itemsParaValidarSegunScope());
  });
  document.getElementById("btnEnviarFev")?.addEventListener("click", () => {
    enviarItems(itemsParaEnviarSegunScope());
  });
  document.querySelectorAll('input[name="scopeValidarFev"], input[name="scopeEnviarFev"]').forEach((el) => {
    el.addEventListener("change", updateActionButtons);
  });
  document.getElementById("fevCheckAll")?.addEventListener("change", (ev) => {
    document.querySelectorAll(".fev-chk:not(:disabled)").forEach((chk) => {
      chk.checked = ev.target.checked;
    });
    updateActionButtons();
  });
}

init().catch((e) => console.error(e));

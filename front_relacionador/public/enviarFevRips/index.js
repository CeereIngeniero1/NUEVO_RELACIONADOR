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

async function cargarEmpresasFev() {
  const res = await fetch(`${apiBase()}/XMLS/mostrar-empresas-con-resoluciones-vigentes`);
  if (!res.ok) throw new Error("No se pudieron cargar las empresas");
  const rows = await res.json();
  const map = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    const doc = String(r.DocumentoEmpresa || "").trim();
    if (!doc || map.has(doc)) continue;
    const nombre = String(r.NombreComercialEmpresa || "").trim();
    map.set(doc, { documento: doc, nombre });
  }
  return [...map.values()].sort((a, b) =>
    (a.nombre || a.documento).localeCompare(b.nombre || b.documento, "es")
  );
}

async function cargarTiposDocumentoFev() {
  const res = await fetch(`${apiBase()}/apiV3/TipoDocumento`);
  if (!res.ok) throw new Error("No se pudo cargar tipos de documento");
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : [])
    .map((r) => {
      const codigo = String(
        r.CódigoTipoDocumento || r.CodigoTipoDocumento || r.TipoDocumento || ""
      ).trim();
      const desc = String(
        r.DescripciónTipoDocumento || r.DescripcionTipoDocumento || r.TipoDocumento || codigo
      ).trim();
      return codigo ? { codigo, desc } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"));
}

async function cargarCredencialesPublicas(documentoEmpresa) {
  if (!documentoEmpresa) return {};
  try {
    const res = await fetch(
      `${apiBase()}/RIPS/fevrips/credenciales/${encodeURIComponent(documentoEmpresa)}`
    );
    if (!res.ok) return {};
    return await res.json();
  } catch (_) {
    return {};
  }
}

function optionsHtml(items, selected, mapFn) {
  return items
    .map((it) => {
      const { value, label } = mapFn(it);
      const sel = String(value) === String(selected || "") ? " selected" : "";
      return `<option value="${String(value).replace(/"/g, "&quot;")}"${sel}>${String(label).replace(/</g, "&lt;")}</option>`;
    })
    .join("");
}

async function editarCredenciales() {
  let empresas = [];
  let tiposDoc = [];
  try {
    Swal.fire({
      title: "Cargando…",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    [empresas, tiposDoc] = await Promise.all([cargarEmpresasFev(), cargarTiposDocumentoFev()]);
    Swal.close();
  } catch (err) {
    Swal.fire({ icon: "error", text: err.message || String(err) });
    return;
  }

  if (!empresas.length) {
    Swal.fire({ icon: "warning", text: "No hay empresas con resolución vigente." });
    return;
  }
  if (!tiposDoc.length) {
    Swal.fire({ icon: "warning", text: "No hay tipos de documento en el catálogo." });
    return;
  }

  const TIPOS_USUARIO_SISPRO = [
    { codigo: "RE", label: "Representante de la Entidad" },
    { codigo: "PIN", label: "Profesional Independiente Nacional" },
    { codigo: "PINx", label: "Profesional Independiente Nacional de Excepción" },
    { codigo: "PIE", label: "Profesional Independiente Extranjero" },
  ];

  const docTrabajo = getDocumentoEmpresa();
  const empresaInicial =
    empresas.find((e) => e.documento === docTrabajo)?.documento || empresas[0].documento;
  const actual = await cargarCredencialesPublicas(empresaInicial);
  const tipoInicial = actual.tipoDocumento || "CC";
  const tipoUsrInicial = actual.tipoUsuario || "RE";

  const htmlEmpresas = optionsHtml(empresas, empresaInicial, (e) => ({
    value: e.documento,
    label: e.nombre ? `${e.nombre} (${e.documento})` : e.documento,
  }));
  const htmlTipos = optionsHtml(tiposDoc, tipoInicial, (t) => ({
    value: t.codigo,
    label: t.desc && t.desc !== t.codigo ? `${t.codigo} — ${t.desc}` : t.codigo,
  }));
  const htmlTipoUsr = optionsHtml(TIPOS_USUARIO_SISPRO, tipoUsrInicial, (t) => ({
    value: t.codigo,
    label: `${t.label} (${t.codigo})`,
  }));

  const { value: form } = await Swal.fire({
    title: "Credenciales SISPRO",
    width: "30rem",
    html: `
      <div class="fevrips-cred-form text-start">
        <p class="fevrips-cred-hint">Mismos datos del login del validador MinSalud (LoginSISPRO).</p>

        <label class="fevrips-cred-label" for="swalEmpresa">Empresa a vincular</label>
        <select id="swalEmpresa" class="fevrips-cred-control">${htmlEmpresas}</select>

        <label class="fevrips-cred-label" for="swalTipoUsr">Tipo usuario</label>
        <select id="swalTipoUsr" class="fevrips-cred-control">${htmlTipoUsr}</select>

        <label class="fevrips-cred-label" for="swalTipoDoc">Tipo identificación</label>
        <select id="swalTipoDoc" class="fevrips-cred-control">${htmlTipos}</select>

        <label class="fevrips-cred-label" for="swalNumDoc">No. identificación</label>
        <input id="swalNumDoc" class="swal2-input fevrips-cred-control" placeholder="No. identificación"
          value="${String(actual.numeroDocumento || "").replace(/"/g, "&quot;")}">

        <label class="fevrips-cred-label" for="swalClave">Contraseña</label>
        <input id="swalClave" class="swal2-input fevrips-cred-control" type="password"
          placeholder="${actual.tieneClave ? "•••••••• (dejar vacío para no cambiar)" : "Contraseña SISPRO"}">

        <label class="fevrips-cred-label" for="swalNit">Nit / No. identificación</label>
        <input id="swalNit" class="swal2-input fevrips-cred-control" placeholder="NIT de la entidad"
          value="${String(actual.nit || empresaInicial).replace(/"/g, "&quot;")}">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar",
    didOpen: () => {
      const selEmp = document.getElementById("swalEmpresa");
      const selTipo = document.getElementById("swalTipoDoc");
      const selUsr = document.getElementById("swalTipoUsr");
      const numDoc = document.getElementById("swalNumDoc");
      const nit = document.getElementById("swalNit");
      const clave = document.getElementById("swalClave");

      selEmp?.addEventListener("change", async () => {
        const doc = selEmp.value;
        const cred = await cargarCredencialesPublicas(doc);
        if (selTipo) {
          const codigo = cred.tipoDocumento || "CC";
          if ([...selTipo.options].some((o) => o.value === codigo)) selTipo.value = codigo;
        }
        if (selUsr) {
          const tu = cred.tipoUsuario || "RE";
          if ([...selUsr.options].some((o) => o.value === tu)) selUsr.value = tu;
          else selUsr.value = "RE";
        }
        if (numDoc) numDoc.value = cred.numeroDocumento || "";
        if (nit) nit.value = cred.nit || doc;
        if (clave) {
          clave.value = "";
          clave.placeholder = cred.tieneClave
            ? "•••••••• (dejar vacío para no cambiar)"
            : "Contraseña SISPRO";
        }
      });
    },
    preConfirm: () => {
      const documentoEmpresa = document.getElementById("swalEmpresa")?.value?.trim();
      const tipoDocumento = document.getElementById("swalTipoDoc")?.value?.trim();
      const numeroDocumento = document.getElementById("swalNumDoc")?.value?.trim();
      const clave = document.getElementById("swalClave")?.value || "";
      const nit = document.getElementById("swalNit")?.value?.trim();
      const tipoUsuario = document.getElementById("swalTipoUsr")?.value?.trim() || "RE";
      if (!documentoEmpresa) {
        Swal.showValidationMessage("Seleccione la empresa a vincular");
        return false;
      }
      if (!tipoUsuario) {
        Swal.showValidationMessage("Seleccione el tipo de usuario");
        return false;
      }
      if (!tipoDocumento) {
        Swal.showValidationMessage("Seleccione el tipo de identificación");
        return false;
      }
      if (!numeroDocumento) {
        Swal.showValidationMessage("Número de identificación obligatorio");
        return false;
      }
      if (!nit) {
        Swal.showValidationMessage("NIT obligatorio");
        return false;
      }
      return { documentoEmpresa, tipoDocumento, numeroDocumento, clave, nit, tipoUsuario };
    },
  });
  if (!form) return;

  const prev = await cargarCredencialesPublicas(form.documentoEmpresa);
  if (!form.clave && !prev.tieneClave) {
    Swal.fire({ icon: "warning", text: "Contraseña obligatoria la primera vez." });
    return;
  }

  const res = await fetch(
    `${apiBase()}/RIPS/fevrips/credenciales/${encodeURIComponent(form.documentoEmpresa)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
        clave: form.clave,
        nit: form.nit,
        tipoUsuario: form.tipoUsuario,
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    Swal.fire({ icon: "error", text: data.message || "No se guardó" });
    return;
  }
  Swal.fire({
    icon: "success",
    text: `Credenciales guardadas para ${form.documentoEmpresa}.`,
  });
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

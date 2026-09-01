/**
 * Módulo Enviar FEV-RIPS — modos independientes Con factura / Sin factura.
 */

import { mountAppSidebar } from "../shared/appSidebar.js";
import { ensureAuthAndSyncTopbar } from "../shared/shell.js";

let paquetesCache = [];
let ultimoRango = { fi: "", ff: "" };
let modoActual = "con_factura"; // con_factura | sin_factura
let tabDesgloseActiva = "en_trabajo";

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

function cuvValido(cuv) {
  if (cuv == null || cuv === "") return false;
  const s = String(cuv).trim();
  if (!s || /^no aplica$/i.test(s)) return false;
  return true;
}

function tieneCuv(p) {
  if (cuvValido(p?.cuvFevRips)) return true;
  if (cuvValido(p?.ultimoEnvio?.codigoUnicoValidacion)) return true;
  const det = String(p?.ultimoEnvio?.detalle || "").trim();
  const m = det.match(/CUV:\s*(\S+)/i);
  return m ? cuvValido(m[1]) : false;
}

function esEnviadoOk(p) {
  return (
    p.estadoUi === "Enviado OK" ||
    p.enviadoFevRips ||
    p.ultimoEnvio?.estado === "Enviado OK" ||
    tieneCuv(p)
  );
}

function puedeEnviarPaquete(p) {
  return p?.prevalidacion?.ok === true && !esEnviadoOk(p) && !tieneCuv(p);
}

function paqueteSinModificarDesdeError(p) {
  return Boolean(p?.prevalidacion?.archivosSinModificar ?? p?.prevalidacion?.jsonSinModificar);
}

function esSinJsonTab(p) {
  if (esEnviadoOk(p)) return false;
  if (esSinFactura()) return !p.tieneJson;
  return Boolean(p.tieneXml && !p.tieneJson);
}

function paquetesPorTab(tab) {
  if (tab === "enviados_ok") return paquetesCache.filter(esEnviadoOk);
  if (tab === "sin_json") return paquetesCache.filter(esSinJsonTab);
  return paquetesCache.filter((p) => !esEnviadoOk(p) && !esSinJsonTab(p));
}

function paqueteToItem(p) {
  return {
    clave: p.clave,
    reporte: p.reporte || "",
    Prefijo: p.Prefijo || "",
    NoFactura: p.NoFactura,
    tipo: esSinFactura() ? "SIN_FACTURA" : "CON_FACTURA",
  };
}

function tablaColspan() {
  const base = esSinFactura() ? 8 : 9;
  return tabDesgloseActiva === "en_trabajo" ? base : base - 1;
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

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function truncarTexto(s, max = 52) {
  const t = String(s || "").trim();
  if (!t) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function htmlTablaValidacionesDetalle(items) {
  const rows = (Array.isArray(items) ? items : []).filter(
    (v) => v && (v.descripcion || v.observaciones || v.codigo || v.pathFuente)
  );
  if (!rows.length) return "";

  const body = rows
    .map((v) => {
      const clase = String(v.clase || "").toLowerCase();
      const badge =
        clase.includes("rechaz")
          ? "fevrips-badge fevrips-badge-err"
          : clase.includes("notif")
            ? "fevrips-badge fevrips-badge-pend"
            : "fevrips-badge";
      return `<tr>
        <td class="text-nowrap"><span class="${badge}">${escapeHtml(v.codigo || "—")}</span>
          ${v.clase ? `<div class="small text-muted">${escapeHtml(v.clase)}</div>` : ""}</td>
        <td>${escapeHtml(v.descripcion || "—")}</td>
        <td>${escapeHtml(v.observaciones || "—")}</td>
        <td><code class="fevrips-path-src">${escapeHtml(v.pathFuente || "—")}</code></td>
      </tr>`;
    })
    .join("");

  return `
    <h6 class="fevrips-det-title">Validaciones MinSalud</h6>
    <div class="fevrips-val-table-wrap">
      <table class="table table-sm fevrips-val-table mb-2">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Observaciones</th>
            <th>PathFuente</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

function puedeVerDetalle(p) {
  const prev = p?.prevalidacion;
  if (prev && (prev.errors?.length || prev.warnings?.length || prev.ok === false)) {
    return true;
  }
  const u = p?.ultimoEnvio;
  if (u && /error|rechaz|omitido/i.test(String(u.estado || ""))) return true;
  const det = String(u?.detalle || p?.cuvFevRips || "").trim();
  if (det && det !== "—") return true;
  if (Array.isArray(u?.resultadosValidacion) && u.resultadosValidacion.length) return true;
  return false;
}

function rutasParaCopiar(rutas, destino = "json_xml") {
  const dest = String(destino || "json_xml").toLowerCase();
  const out = [];
  if ((dest === "json" || dest === "json_xml") && rutas?.rutaJson) out.push(rutas.rutaJson);
  if ((dest === "xml" || dest === "json_xml") && rutas?.rutaXml) out.push(rutas.rutaXml);
  return out;
}

async function copiarRutasAlPortapapeles(rutas, destino = "json_xml") {
  const paths = rutasParaCopiar(rutas, destino);
  if (!paths.length || !navigator.clipboard?.writeText) return false;
  await navigator.clipboard.writeText(paths.join("\r\n"));
  return true;
}

async function obtenerRutasArchivos(clave, p) {
  const doc = getDocumentoEmpresa();
  if (!doc) return null;
  const qs = new URLSearchParams({ documentoEmpresa: doc });
  if (p?.reporte) qs.set("reporte", p.reporte);
  if (p?.Prefijo) qs.set("prefijo", p.Prefijo);
  if (p?.NoFactura != null) qs.set("folio", String(p.NoFactura));
  if (esSinFactura() || /^SinFactura_/i.test(clave)) qs.set("modo", "sin_factura");
  const res = await fetch(
    `${apiBase()}/RIPS/fevrips/rutas-archivos/${encodeURIComponent(clave)}?${qs}`
  );
  if (!res.ok) return null;
  return res.json();
}

async function abrirCarpetaArchivos(clave, destino = "json_xml") {
  const p = paquetesCache.find((x) => x.clave === clave);
  const doc = getDocumentoEmpresa();
  if (!doc) {
    Swal.fire({ icon: "warning", title: "Empresa", text: "Seleccione la empresa de trabajo." });
    return;
  }
  try {
    const res = await fetch(`${apiBase()}/RIPS/fevrips/abrir-carpeta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentoEmpresa: doc,
        clave,
        reporte: p?.reporte || "",
        modo: esSinFactura() || /^SinFactura_/i.test(clave) ? "sin_factura" : "con_factura",
        destino,
        prefijo: p?.Prefijo || "",
        folio: p?.NoFactura,
        rutaJson: p?.rutaJson || undefined,
        rutaXml: p?.rutaXml || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    let rutas = data.rutas || null;
    if (!rutas) rutas = await obtenerRutasArchivos(clave, p);

    const copiado = rutas ? await copiarRutasAlPortapapeles(rutas, destino).catch(() => false) : false;
    const paths = rutas ? rutasParaCopiar(rutas, destino) : [];

    if (!res.ok) {
      if (copiado) {
        Swal.fire({
          icon: "info",
          title: "Ruta copiada",
          html: `<p class="small mb-0">Se copió al portapapeles:</p><code class="fevrips-path-code">${escapeHtml(paths.join("\n"))}</code><p class="small mt-2 mb-0 text-muted">No se pudo abrir el explorador en el servidor.</p>`,
        });
        return;
      }
      throw new Error(data.message || "No se pudo abrir la carpeta");
    }

    const abrioAmbos = data.opened?.length === 2 && !data.rutas?.mismaCarpeta;
    const msgAbrir = abrioAmbos
      ? "Se abrieron las ubicaciones del JSON y del XML."
      : "Se abrió el explorador con el archivo seleccionado.";
    Swal.fire({
      icon: "success",
      title: copiado ? "Ruta copiada y explorador abierto" : "Explorador abierto",
      html: copiado
        ? `<p class="small mb-1">${msgAbrir}</p><code class="fevrips-path-code">${escapeHtml(paths.join("\n"))}</code><p class="small mt-2 mb-0 text-muted">La ruta quedó en el portapapeles.</p>`
        : `<p class="small mb-0">${msgAbrir}</p>`,
      timer: copiado ? undefined : 2400,
      showConfirmButton: copiado,
      confirmButtonText: "Cerrar",
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Abrir carpeta", text: err.message || String(err) });
  }
}

async function verDetallePaquete(clave) {
  const p = paquetesCache.find((x) => x.clave === clave);
  const doc = getDocumentoEmpresa();
  let html = "";

  if (p?.prevalidacion) {
    const prev = p.prevalidacion;
    if (prev.errors?.length) {
      html += `<h6 class="fevrips-det-title">Prevalidación — errores</h6><ul class="fevrips-det-list">${prev.errors
        .map((e) => `<li>${escapeHtml(e)}</li>`)
        .join("")}</ul>`;
    }
    if (prev.warnings?.length) {
      html += `<h6 class="fevrips-det-title">Prevalidación — avisos</h6><ul class="fevrips-det-list">${prev.warnings
        .map((e) => `<li>${escapeHtml(e)}</li>`)
        .join("")}</ul>`;
    }
    if (prev.detalle && prev.ok === false && !prev.errors?.length) {
      html += `<p class="small mb-2">${escapeHtml(prev.detalle)}</p>`;
    }
  }

  if (doc) {
    try {
      const res = await fetch(
        `${apiBase()}/RIPS/fevrips/resultado/${encodeURIComponent(clave)}?documentoEmpresa=${encodeURIComponent(doc)}`
      );
      if (res.ok) {
        const data = await res.json();
        html += `<h6 class="fevrips-det-title">Último envío${data.fecha ? ` · ${escapeHtml(data.fecha)}` : ""}</h6>`;
        html += `<p class="small mb-1"><strong>Estado:</strong> ${escapeHtml(data.resumen?.estado || "—")}</p>`;
        if (data.resumen?.httpStatus) {
          html += `<p class="small mb-1"><strong>HTTP:</strong> ${escapeHtml(data.resumen.httpStatus)}</p>`;
        }
        if (data.resumen?.codigoUnicoValidacion) {
          html += `<p class="small mb-1"><strong>CUV:</strong> <code>${escapeHtml(data.resumen.codigoUnicoValidacion)}</code></p>`;
        }
        if (data.resumen?.detalle) {
          html += `<p class="small mb-2">${escapeHtml(data.resumen.detalle)}</p>`;
        }
        if (data.errorDetalle?.errors?.length) {
          html += `<h6 class="fevrips-det-title">Errores técnicos</h6><ul class="fevrips-det-list">${data.errorDetalle.errors
            .map((e) => `<li>${escapeHtml(e)}</li>`)
            .join("")}</ul>`;
        } else         if (data.errorDetalle?.message) {
          html += `<p class="small text-danger mb-2">${escapeHtml(data.errorDetalle.message)}</p>`;
        }
        const tablaVal = htmlTablaValidacionesDetalle(data.validacionesDetalle);
        if (tablaVal) {
          html += tablaVal;
        } else {
          const vals = [...(data.rechazos || []), ...(data.validaciones || [])];
          const uniq = [...new Set(vals.filter(Boolean))];
          if (uniq.length) {
            html += `<h6 class="fevrips-det-title">Validaciones MinSalud</h6><ul class="fevrips-det-list fevrips-det-scroll">${uniq
              .map((v) => `<li>${escapeHtml(v)}</li>`)
              .join("")}</ul>`;
          }
        }
      } else if (!html) {
        const errData = await res.json().catch(() => ({}));
        html = `<p class="small">${escapeHtml(errData.message || "Sin detalle guardado.")}</p>`;
      }
    } catch (err) {
      if (!html) html = `<p class="small text-danger">${escapeHtml(err.message || String(err))}</p>`;
    }
  }

  if (!html && p?.ultimoEnvio?.detalle) {
    html = `<p class="small">${escapeHtml(p.ultimoEnvio.detalle)}</p>`;
  }

  if (paqueteSinModificarDesdeError(p)) {
    const msg = p.prevalidacion?.mensajeSinModificar;
    html += `<div class="alert alert-warning py-2 px-3 small mb-0 mt-2">${escapeHtml(
      msg ||
        "El JSON/XML no cambió desde el último rechazo o error. Corrija el RIPS y vuelva a validar."
    )}</div>`;
  }

  if (doc) {
    try {
      const qsRutas = new URLSearchParams({ documentoEmpresa: doc });
      if (p?.reporte) qsRutas.set("reporte", p.reporte);
      if (p?.Prefijo) qsRutas.set("prefijo", p.Prefijo);
      if (p?.NoFactura != null) qsRutas.set("folio", String(p.NoFactura));
      if (esSinFactura() || /^SinFactura_/i.test(clave)) qsRutas.set("modo", "sin_factura");
      const rr = await fetch(
        `${apiBase()}/RIPS/fevrips/rutas-archivos/${encodeURIComponent(clave)}?${qsRutas}`
      );
      if (rr.ok) {
        const rutasArchivos = await rr.json();
        if (rutasArchivos.tieneJson || rutasArchivos.tieneXml) {
          html += `<h6 class="fevrips-det-title">Archivos para corregir</h6>`;
          html += `<p class="small mb-1">Modifique el JSON/XML en disco, luego pulse <strong>Validar</strong> y <strong>Enviar</strong>.</p>`;
          if (rutasArchivos.rutaJson) {
            html += `<p class="small mb-1"><strong>JSON:</strong><br><code class="fevrips-path-code">${escapeHtml(rutasArchivos.rutaJson)}</code></p>`;
          }
          if (rutasArchivos.rutaXml) {
            html += `<p class="small mb-1"><strong>XML:</strong><br><code class="fevrips-path-code">${escapeHtml(rutasArchivos.rutaXml)}</code></p>`;
          }
          html += `<div class="fevrips-archivos-btns mt-2 mb-1">`;
          if (rutasArchivos.tieneJson && rutasArchivos.tieneXml) {
            html += `<button type="button" class="btn btn-sm btn-outline-secondary me-1 mb-1 btn-abrir-archivo" data-clave="${escapeHtml(clave)}" data-destino="json_xml">Abrir JSON y XML</button>`;
            html += `<button type="button" class="btn btn-sm btn-outline-secondary me-1 mb-1 btn-abrir-archivo" data-clave="${escapeHtml(clave)}" data-destino="json">Solo JSON</button>`;
            html += `<button type="button" class="btn btn-sm btn-outline-secondary mb-1 btn-abrir-archivo" data-clave="${escapeHtml(clave)}" data-destino="xml">Solo XML</button>`;
          } else if (rutasArchivos.tieneJson) {
            html += `<button type="button" class="btn btn-sm btn-outline-secondary btn-abrir-archivo" data-clave="${escapeHtml(clave)}" data-destino="json">Abrir carpeta JSON</button>`;
          } else {
            html += `<button type="button" class="btn btn-sm btn-outline-secondary btn-abrir-archivo" data-clave="${escapeHtml(clave)}" data-destino="xml">Abrir carpeta XML</button>`;
          }
          html += `</div>`;
        }
      }
    } catch (_) {
      /* ignore */
    }
  }

  if (doc) {
    try {
      const qs = new URLSearchParams({ documentoEmpresa: doc });
      if (p?.reporte) qs.set("reporte", p.reporte);
      if (esSinFactura() || /^SinFactura_/i.test(clave)) qs.set("modo", "sin_factura");
      const vr = await fetch(
        `${apiBase()}/RIPS/fevrips/validador/${encodeURIComponent(clave)}?${qs}`
      );
      const vd = await vr.json().catch(() => ({}));
      if (vd.rutaDir) {
        html += `<h6 class="fevrips-det-title">Carpeta validador MinSalud</h6>`;
        if (vd.listo) {
          const soloJson = vd.sinFactura || esSinFactura();
          html += `<p class="small mb-1">Cargue en el validador FEV-RIPS ${
            soloJson ? "el JSON de esta carpeta" : "los archivos de esta carpeta"
          }:</p>`;
          html += `<code class="fevrips-path-code">${escapeHtml(vd.rutaDir)}</code>`;
          html += soloJson
            ? `<p class="small text-muted mb-0 mt-1"><strong>${escapeHtml(clave)}.json</strong> (Sin factura — solo JSON)</p>`
            : `<p class="small text-muted mb-0 mt-1"><strong>${escapeHtml(clave)}.xml</strong> + <strong>${escapeHtml(clave)}.json</strong></p>`;
        } else if (vd.exportado?.errores?.length) {
          html += `<p class="small text-warning mb-0">${escapeHtml(vd.exportado.errores.join(" · "))}</p>`;
        }
      }
    } catch (_) {
      /* ignore */
    }
  }

  if (!html) {
    Swal.fire({ icon: "info", title: clave, text: "Sin detalle disponible." });
    return;
  }

  Swal.fire({
    icon: "info",
    title: `Detalle — ${clave}`,
    html: `<div class="text-start fevrips-detalle-modal">${html}</div>`,
    width: "920px",
    confirmButtonText: "Cerrar",
    didOpen: (popup) => {
      popup.querySelectorAll(".btn-abrir-archivo").forEach((btn) => {
        btn.addEventListener("click", () => {
          abrirCarpetaArchivos(
            btn.getAttribute("data-clave"),
            btn.getAttribute("data-destino") || "json_xml"
          );
        });
      });
    },
  });
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
      : "Facturas con RIPS en el rango. Preparar descarga XML faltante, genera JSON (EPS + Particulares) y empaqueta.";
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
        Modo <strong>Con factura</strong>: lista facturas con RIPS, XML en <code>XMLS/{empresa}/</code> y JSON
        empaquetado. Use <strong>Preparar XML + JSON</strong> antes de validar. Envía con <code>CargarFevRips</code>.
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
  tabDesgloseActiva = "en_trabajo";
  aplicarUiModo();
  renderDashboard({});
  const tbody = document.getElementById("tbodyFevRips");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${tablaColspan()}" class="text-center py-4 text-muted">
          Modo <strong>${esSinFactura() ? "Sin factura" : "Con factura"}</strong>.
          Seleccione fechas y pulse <strong>${esSinFactura() ? "Buscar paquetes" : "Buscar facturas"}</strong>.
        </td>
      </tr>`;
  }
  actualizarTabsDesglose();
  actualizarUiTabDesglose();
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

  const sinJson = Math.max(0, (dash.total || 0) - (dash.conJson || 0));
  const btnPrep = document.getElementById("btnPrepararArchivos");
  const btnValExp = document.getElementById("btnExportarValidador");
  const listosValidador = esSinFactura()
    ? paquetesCache.filter((p) => p.tieneJson).length
    : paquetesCache.filter((p) => p.tieneXml && p.tieneJson).length;
  if (btnPrep) btnPrep.disabled = esSinFactura() || (!dash.sinXml && !sinJson);
  if (btnValExp) btnValExp.disabled = listosValidador === 0;
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
    : paquetesCache.filter((p) => itemListo(p) && !esEnviadoOk(p)).map(paqueteToItem);
  return base.filter((it) => {
    const p = paquetesCache.find((x) => x.clave === it.clave);
    return p?.prevalidacion?.ok === true && !esEnviadoOk(p);
  });
}

function scopeValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el?.value || "seleccionados";
}

function updateActionButtons() {
  const listosParaValidar = itemsParaValidarTodosListos().length;
  const valOkAll = itemsPrevalidadosOk(false).length;
  const valOkSel = itemsPrevalidadosOk(true).length;
  const scopeEnv = scopeValue("scopeEnviarFev");

  const btnVal = document.getElementById("btnValidarFev");
  const btnEnv = document.getElementById("btnEnviarFev");

  if (btnVal) btnVal.disabled = listosParaValidar === 0;
  if (btnEnv) btnEnv.disabled = scopeEnv === "todos" ? valOkAll === 0 : valOkSel === 0;
}

function itemsParaValidarTodosListos() {
  return paquetesCache.filter((p) => itemListo(p) && !esEnviadoOk(p)).map(paqueteToItem);
}

function itemsParaEnviarSegunScope() {
  const scope = scopeValue("scopeEnviarFev");
  return itemsPrevalidadosOk(scope === "seleccionados");
}

function actualizarTabsDesglose() {
  const counts = {
    en_trabajo: paquetesPorTab("en_trabajo").length,
    sin_json: paquetesPorTab("sin_json").length,
    enviados_ok: paquetesPorTab("enviados_ok").length,
  };
  document.querySelectorAll(".fevrips-tab-desglose").forEach((btn) => {
    const tab = btn.getAttribute("data-tab");
    const countEl = btn.querySelector(".fevrips-tab-count");
    if (countEl && tab) countEl.textContent = String(counts[tab] ?? 0);
    const active = tab === tabDesgloseActiva;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function actualizarUiTabDesglose() {
  const enTrabajo = tabDesgloseActiva === "en_trabajo";
  document.getElementById("fevCheckAllWrap")?.classList.toggle("d-none", !enTrabajo);
  document.querySelectorAll(".col-chk").forEach((el) => {
    el.classList.toggle("d-none", !enTrabajo);
  });
}

function setTabDesglose(tab) {
  tabDesgloseActiva = tab;
  actualizarUiTabDesglose();
  actualizarTabsDesglose();
  renderCuerpoTabla();
}

function renderTabla(paquetes) {
  paquetesCache = Array.isArray(paquetes) ? paquetes : [];
  actualizarTabsDesglose();
  actualizarUiTabDesglose();
  renderCuerpoTabla();
}

function renderCuerpoTabla() {
  const tbody = document.getElementById("tbodyFevRips");
  if (!tbody) return;
  const cols = tablaColspan();
  const enTrabajo = tabDesgloseActiva === "en_trabajo";
  const visibles = paquetesPorTab(tabDesgloseActiva);

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

  if (!visibles.length) {
    const msg =
      tabDesgloseActiva === "enviados_ok"
        ? "No hay envíos exitosos en este rango."
        : tabDesgloseActiva === "sin_json"
          ? esSinFactura()
            ? "No hay paquetes sin JSON en este rango."
            : "No hay facturas con XML listo pero sin JSON."
          : "No hay registros en esta vista.";
    tbody.innerHTML = `
      <tr>
        <td colspan="${cols}" class="text-center py-4 text-muted">${msg}</td>
      </tr>`;
    updateActionButtons();
    return;
  }

  tbody.innerHTML = visibles
    .map((p) => {
      const prev = p.prevalidacion;
      const prevLabel = prev
        ? prev.estadoValidacion || (prev.ok ? "OK" : "Con errores")
        : "Sin validar";
      const prevDetail = prev?.detalle || "—";
      const detalleEnvio = tieneCuv(p)
        ? `CUV: ${p.cuvFevRips || p.ultimoEnvio?.codigoUnicoValidacion || "—"}`
        : p.cuvFevRips || p.ultimoEnvio?.detalle || "—";
      const detalleCorto = truncarTexto(detalleEnvio);
      const verDet = puedeVerDetalle(p);
      const xmlLabel = p.tieneXml ? "Sí" : "No";
      const jsonLabel = p.tieneJson ? "Sí" : "No";
      const puedeValidar = itemListo(p) && !esEnviadoOk(p);
      const puedeEnviar = puedeEnviarPaquete(p);
      const fecha = p.FechaFactura || p.fechaInicioLote || "—";
      const xmlCell = esSinFactura()
        ? ""
        : `<td><span class="${badgeClass(xmlLabel === "Sí" ? "XML descargado" : "Sin XML")}">${xmlLabel}</span></td>`;
      const chkHabilitado = itemListo(p) && !esEnviadoOk(p);
      const chkCell = enTrabajo
        ? `<td class="col-chk">
          <input type="checkbox" class="fev-chk form-check-input" data-clave="${p.clave}"
            data-reporte="${String(p.reporte || "").replace(/"/g, "&quot;")}"
            data-prefijo="${String(p.Prefijo || "").replace(/"/g, "&quot;")}"
            data-folio="${String(p.NoFactura ?? "").replace(/"/g, "&quot;")}"
            ${chkHabilitado ? "checked" : "disabled"}>
        </td>`
        : "";
      const puedeAbrirArchivos = p.tieneJson || p.tieneXml;
      const btnArchivos = puedeAbrirArchivos
        ? `<button type="button" class="btn btn-sm btn-outline-secondary btn-abrir-archivos me-1" data-clave="${p.clave}" title="Abrir carpeta del JSON/XML en el explorador del servidor">Archivos</button>`
        : "";
      const accionesEnTrabajo = enTrabajo
        ? `${btnArchivos}${verDet ? `<button type="button" class="btn btn-sm btn-outline-info btn-ver-detalle me-1" data-clave="${p.clave}" title="Ver error o validación">Detalle</button>` : ""}
          <button type="button" class="btn btn-sm btn-outline-warning btn-validar-uno"
            data-clave="${p.clave}" data-reporte="${String(p.reporte || "").replace(/"/g, "&quot;")}"
            data-prefijo="${String(p.Prefijo || "").replace(/"/g, "&quot;")}"
            data-folio="${String(p.NoFactura ?? "").replace(/"/g, "&quot;")}"
            ${puedeValidar ? "" : "disabled"}>Validar</button>
          <button type="button" class="btn btn-sm btn-outline-success btn-enviar-uno"
            data-clave="${p.clave}" data-reporte="${String(p.reporte || "").replace(/"/g, "&quot;")}"
            data-prefijo="${String(p.Prefijo || "").replace(/"/g, "&quot;")}"
            data-folio="${String(p.NoFactura ?? "").replace(/"/g, "&quot;")}"
            ${puedeEnviar ? "" : "disabled"}>Enviar</button>`
        : `${btnArchivos}${
            verDet
              ? `<button type="button" class="btn btn-sm btn-outline-info btn-ver-detalle" data-clave="${p.clave}" title="Ver detalle">Detalle</button>`
              : ""
          }`;
      return `
      <tr data-clave="${p.clave}">
        ${chkCell}
        <td><span class="fevrips-clave">${p.clave}</span></td>
        <td class="small">${fecha}</td>
        ${xmlCell}
        <td title="${p.estadoJson || ""}"><span class="${badgeClass(jsonLabel === "Sí" ? "JSON listo" : "Sin JSON")}">${jsonLabel}</span></td>
        <td title="${String(prevDetail).replace(/"/g, "&quot;")}">
          <span class="${badgeClass(prevLabel)}">${prevLabel}</span>
        </td>
        <td><span class="${badgeClass(p.estadoUi)}">${p.estadoUi || "—"}</span>
          ${
            paqueteSinModificarDesdeError(p)
              ? `<div class="small mt-1"><span class="fevrips-badge fevrips-badge-pend" title="${escapeHtml(p.prevalidacion?.mensajeSinModificar || "")}">JSON/XML sin modificar</span></div>`
              : ""
          }
        </td>
        <td class="small fevrips-detalle-cell" style="max-width:200px;word-break:break-word;">
          <span title="${escapeHtml(detalleEnvio)}">${escapeHtml(detalleCorto)}</span>
          ${
            verDet
              ? `<button type="button" class="btn btn-link btn-sm p-0 ms-1 align-baseline btn-ver-detalle" data-clave="${p.clave}">Ver detalle</button>`
              : ""
          }
        </td>
        <td class="text-end text-nowrap">${accionesEnTrabajo}</td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".btn-ver-detalle").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      verDetallePaquete(btn.getAttribute("data-clave"));
    });
  });
  tbody.querySelectorAll(".btn-abrir-archivos").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      abrirCarpetaArchivos(btn.getAttribute("data-clave"), "json_xml");
    });
  });
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
        jsonSinModificar: Boolean(hit.archivosSinModificar ?? hit.jsonSinModificar),
        archivosSinModificar: Boolean(hit.archivosSinModificar ?? hit.jsonSinModificar),
        xmlSinModificar: hit.xmlSinModificar ?? null,
        mensajeSinModificar: hit.mensajeSinModificar || null,
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

function abrirProgresoPreparar() {
  Swal.fire({
    title: "Preparando archivos…",
    html: `
      <p id="fevPrepFase" class="small fw-semibold mb-1">Iniciando…</p>
      <p id="fevPrepDet" class="small text-muted mb-0">—</p>`,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });
}

function actualizarProgresoPreparar(fase, detalle) {
  const f = document.getElementById("fevPrepFase");
  const d = document.getElementById("fevPrepDet");
  if (f && fase) f.textContent = fase;
  if (d && detalle) d.textContent = detalle;
}

async function leerNdjsonStream(response, onEvent) {
  if (!response.body?.getReader) {
    const text = await response.text();
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      onEvent(JSON.parse(line));
    }
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        onEvent(JSON.parse(line));
      } catch (e) {
        console.warn("[fevrips] NDJSON inválido:", line, e);
      }
    }
  }
  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer));
    } catch (_) {
      /* ignore */
    }
  }
}

function facturasDesdeCache() {
  return paquetesCache.map((p) => ({
    Prefijo: p.Prefijo || "",
    NoFactura: p.NoFactura,
    FechaFactura: p.FechaFactura,
    clave: p.clave,
  }));
}

async function descargarXmlsStream(fi, ff, doc, facturador) {
  const esFenalco = /fenalco/i.test(facturador);
  const pathSegment = esFenalco
    ? "descargarxmls-stream-fenalco-sin-prefijo"
    : "descargarxmls-stream-facturatech-sin-prefijo";

  const response = await fetch(
    `${apiBase()}/XMLS/${pathSegment}/${fi}/${ff}/${encodeURIComponent(doc)}`,
    { method: "POST" }
  );

  if (!response.ok && !String(response.headers.get("content-type") || "").includes("ndjson")) {
    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      /* ignore */
    }
    return {
      ok: false,
      message: (data && (data.message || data.error)) || `Error HTTP ${response.status}`,
      facturas: [],
      batchFolders: [],
    };
  }

  let streamError = null;
  let batchFolders = [];
  const facturas = [];

  await leerNdjsonStream(response, (ev) => {
    if (ev.type === "start") {
      batchFolders = Array.isArray(ev.batchFolders) ? ev.batchFolders : [];
      actualizarProgresoPreparar(
        `1/3 Descargando XMLs (${facturador || "API"})`,
        `Encontradas ${ev.total || 0} factura(s) en el rango`
      );
    } else if (ev.type === "progress" || ev.type === "factura") {
      const clave = `${ev.Prefijo || ""}${ev.NoFactura || ev.factura || ""}`;
      actualizarProgresoPreparar(
        `1/3 Descargando XMLs (${facturador || "API"})`,
        `${clave} — ${ev.estado || ev.message || ev.mensaje || ""}`
      );
      if (ev.type === "factura") {
        facturas.push({
          Prefijo: ev.Prefijo || "",
          NoFactura: ev.NoFactura,
          FechaFactura: ev.FechaFactura,
          estado: ev.estado,
          batchFolder: ev.batchFolder,
          batchFolders: ev.batchFolders,
        });
        if (ev.batchFolder && !batchFolders.includes(ev.batchFolder)) {
          batchFolders.push(ev.batchFolder);
        }
        if (Array.isArray(ev.batchFolders)) {
          ev.batchFolders.forEach((bf) => {
            if (bf && !batchFolders.includes(bf)) batchFolders.push(bf);
          });
        }
      }
    } else if (ev.type === "done") {
      if (Array.isArray(ev.batchFolders) && ev.batchFolders.length) {
        batchFolders = ev.batchFolders;
      }
      if (Array.isArray(ev.facturas) && ev.facturas.length) {
        facturas.length = 0;
        facturas.push(...ev.facturas);
      }
    } else if (ev.type === "error") {
      streamError = ev.message || "Error en descarga XML";
    }
  });

  if (streamError && facturas.length === 0) {
    return { ok: false, message: streamError, facturas, batchFolders };
  }
  return {
    ok: !streamError,
    message: streamError || "Descarga XML finalizada",
    facturas,
    batchFolders,
  };
}

async function generarJsonRango(fi, ff, doc) {
  const placeholderResolucion = "TODO";
  const base = apiBase();
  let dataEps = [];
  let dataPart = [];
  const errores = [];

  actualizarProgresoPreparar("2/3 Generando JSON RIPS", "Consultando EPS…");

  try {
    const resEps = await fetch(
      `${base}/RIPS/usuarios/rips/${fi}/${ff}/${placeholderResolucion}/${doc}`
    );
    if (!resEps.ok) throw new Error(`EPS HTTP ${resEps.status}`);
    const raw = await resEps.json();
    dataEps = Array.isArray(raw) ? raw : [];
    actualizarProgresoPreparar(
      "2/3 Generando JSON RIPS",
      `EPS: ${dataEps.length} registro(s). Consultando Particulares…`
    );
  } catch (err) {
    errores.push(`EPS: ${err.message || err}`);
    actualizarProgresoPreparar("2/3 Generando JSON RIPS", errores[errores.length - 1]);
  }

  try {
    const resPart = await fetch(
      `${base}/RIPS/usuarios/ripsParticular/${fi}/${ff}/${placeholderResolucion}/${doc}`
    );
    if (!resPart.ok) throw new Error(`Particulares HTTP ${resPart.status}`);
    const raw = await resPart.json();
    dataPart = Array.isArray(raw) ? raw : [];
    actualizarProgresoPreparar(
      "2/3 Generando JSON RIPS",
      `EPS ${dataEps.length} + Particulares ${dataPart.length}. Escribiendo archivos…`
    );
  } catch (err) {
    errores.push(`Particulares: ${err.message || err}`);
    actualizarProgresoPreparar("2/3 Generando JSON RIPS", errores[errores.length - 1]);
  }

  const data = [...dataEps, ...dataPart];
  if (data.length === 0) {
    const msg = errores.length
      ? `Sin datos JSON. ${errores.join(" | ")}`
      : "Sin datos JSON EPS ni Particulares en el rango.";
    return { ok: false, message: msg, batchFolders: [], partialErrors: errores };
  }

  const zipRes = await fetch(`${base}/RIPS/generar-zip-todo-en-uno/${fi}/${ff}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eps: dataEps, particulares: dataPart }),
  });

  if (!zipRes.ok) {
    return {
      ok: false,
      message: `Error al generar JSON: HTTP ${zipRes.status}`,
      batchFolders: [],
      partialErrors: errores,
    };
  }

  const zipData = await zipRes.json();
  const batchFolders = Array.isArray(zipData?.batchFolders) ? zipData.batchFolders : [];
  actualizarProgresoPreparar(
    "2/3 Generando JSON RIPS",
    `JSON listo (${batchFolders.length} carpeta(s): ${batchFolders.join(", ") || "—"})`
  );

  return {
    ok: errores.length === 0,
    message: errores.length ? `Parcial: ${errores.join(" | ")}` : "JSON generado",
    batchFolders,
    partialErrors: errores,
    conteoTotal: data.length,
  };
}

async function empaquetarArchivos(fi, ff, { facturas, batchFolders, xmlError, jsonError, doc }) {
  actualizarProgresoPreparar(
    "3/3 Empaquetando",
    "Juntando XML + JSON en ARCHIVOS_DE_ENVIO…"
  );

  const res = await fetch(`${apiBase()}/RIPS/cerrar-todo-en-uno/${fi}/${ff}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      facturas,
      xmlError,
      jsonError,
      batchFolders,
      documentoEmpresa: doc,
    }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }

  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || `Error HTTP ${res.status}`);
  }
  return data;
}

async function prepararArchivosFaltantes() {
  if (esSinFactura()) return;
  const doc = getDocumentoEmpresa();
  const { fi, ff } = ultimoRango;
  const sinXml = paquetesCache.filter((p) => !p.tieneXml).length;
  const sinJson = paquetesCache.filter((p) => !p.tieneJson).length;

  if (!fi || !ff) {
    Swal.fire({ icon: "warning", text: "Busque primero un rango de fechas." });
    return;
  }
  if (!sinXml && !sinJson) {
    Swal.fire({ icon: "info", text: "No faltan XML ni JSON en este listado." });
    return;
  }

  const pasos = [];
  if (sinXml) pasos.push(`Descargar hasta <strong>${sinXml}</strong> XML(s)`);
  if (sinJson) pasos.push(`Generar JSON del rango (EPS + Particulares)`);
  pasos.push("Empaquetar en <code>ARCHIVOS_DE_ENVIO</code>");

  const conf = await Swal.fire({
    icon: "question",
    title: "Preparar XML + JSON",
    html: `<p>Rango <code>${fi}</code> → <code>${ff}</code></p>
           <ul class="text-start small">${pasos.map((p) => `<li>${p}</li>`).join("")}</ul>`,
    showCancelButton: true,
    confirmButtonText: "Preparar",
  });
  if (!conf.isConfirmed) return;

  let xmlError = null;
  let jsonError = null;
  let batchFolders = [];
  let facturas = facturasDesdeCache();

  abrirProgresoPreparar();

  try {
    if (sinXml) {
      let facturador;
      try {
        facturador = await buscarFacturador();
      } catch (e) {
        Swal.close();
        Swal.fire({ icon: "error", text: e.message || String(e) });
        return;
      }

      const xmlResult = await descargarXmlsStream(fi, ff, doc, facturador);
      if (xmlResult.batchFolders?.length) {
        batchFolders = [...new Set([...batchFolders, ...xmlResult.batchFolders])];
      }
      if (xmlResult.facturas?.length) {
        facturas = xmlResult.facturas;
      }
      if (!xmlResult.ok) {
        xmlError = xmlResult.message || "Error al descargar XMLs";
      }
    }

    if (sinJson) {
      const jsonResult = await generarJsonRango(fi, ff, doc);
      if (jsonResult.batchFolders?.length) {
        batchFolders = [...new Set([...batchFolders, ...jsonResult.batchFolders])];
      }
      if (!jsonResult.ok && !jsonResult.batchFolders?.length) {
        jsonError = jsonResult.message || "Error al generar JSON";
      } else if (jsonResult.partialErrors?.length) {
        jsonError = jsonResult.message;
      }
    }

    const estado = await empaquetarArchivos(fi, ff, {
      facturas,
      batchFolders,
      xmlError,
      jsonError,
      doc,
    });

    Swal.close();
    await buscarPaquetes();
    await exportarValidadorItems(
      paquetesCache.filter((p) => p.tieneXml && p.tieneJson).map((p) => ({
        clave: p.clave,
        Prefijo: p.Prefijo,
        NoFactura: p.NoFactura,
      })),
      { silencioso: true }
    );

    const resumen = estado?.resumen || {};
    const huboAlerta = !!(xmlError || jsonError || estado?.empaquetadoError);
    Swal.fire({
      icon: huboAlerta ? "warning" : "success",
      title: huboAlerta ? "Preparación con alertas" : "Preparación completada",
      html: `
        <p>XML OK: <strong>${resumen.xmlOk ?? "—"}</strong> ·
           JSON OK: <strong>${resumen.jsonOk ?? "—"}</strong> ·
           Empaquetados: <strong>${resumen.empaquetadoOk ?? "—"}</strong></p>
        ${xmlError ? `<p class="small text-danger mb-1">XML: ${String(xmlError).replace(/</g, "&lt;")}</p>` : ""}
        ${jsonError ? `<p class="small text-danger mb-1">JSON: ${String(jsonError).replace(/</g, "&lt;")}</p>` : ""}
        ${estado?.empaquetadoError ? `<p class="small text-danger mb-0">Empaquetado: ${String(estado.empaquetadoError).replace(/</g, "&lt;")}</p>` : ""}
        <p class="small text-muted mt-2 mb-0">Carpetas en <code>PAQUETES_VALIDADOR</code> para el validador manual. Luego pulse <strong>Validar</strong>.</p>`,
    });
  } catch (err) {
    Swal.close();
    Swal.fire({ icon: "error", title: "Error", text: err.message || String(err) });
  }
}

function itemsParaExportarValidador(fromSelection = false) {
  const base = fromSelection
    ? selectedItems()
    : paquetesCache.filter((p) => (esSinFactura() ? p.tieneJson : p.tieneXml && p.tieneJson));
  return base.map((p) => ({
    clave: p.clave,
    Prefijo: p.Prefijo || "",
    NoFactura: p.NoFactura,
    reporte: p.reporte || "",
    tipo: esSinFactura() ? "SIN_FACTURA" : "CON_FACTURA",
  }));
}

async function exportarValidadorItems(items, { silencioso = false } = {}) {
  const doc = getDocumentoEmpresa();
  if (!doc) return null;
  const list = Array.isArray(items) ? items.filter((i) => i?.clave) : [];
  if (!list.length) {
    if (!silencioso) {
      Swal.fire({
        icon: "info",
        text: esSinFactura()
          ? "No hay paquetes Sin Factura con JSON para exportar."
          : "No hay facturas con XML y JSON para exportar.",
      });
    }
    return null;
  }

  if (!silencioso) {
    Swal.fire({
      title: "Generando carpetas validador…",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  }

  try {
    const res = await fetch(`${apiBase()}/RIPS/fevrips/exportar-validador`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentoEmpresa: doc, items: list }),
    });
    const data = await res.json().catch(() => ({}));
    if (!silencioso) Swal.close();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

    paquetesCache = paquetesCache.map((p) => {
      const hit = (data.items || []).find((i) => i.clave === p.clave && i.ok);
      if (!hit) return p;
      return {
        ...p,
        paqueteValidador: {
          listo: true,
          rutaDir: hit.rutaDir,
          rutaJson: hit.rutaJson,
          rutaXml: hit.rutaXml,
        },
      };
    });

    if (!silencioso) {
      const r = data.resumen || {};
      const ejemplos = (data.items || [])
        .filter((i) => i.ok)
        .slice(0, 3)
        .map((i) => `<code>${escapeHtml(i.rutaDir)}</code>`)
        .join("<br>");
      Swal.fire({
        icon: r.fallidos ? "warning" : "success",
        title: "Carpetas validador",
        html: `
          <p>OK: <strong>${r.ok ?? 0}</strong> · Fallidos: <strong>${r.fallidos ?? 0}</strong></p>
          <p class="small text-start mb-1">Raíz:</p>
          <code class="fevrips-path-code">${escapeHtml(data.root || "")}\\${escapeHtml(doc)}</code>
          ${ejemplos ? `<p class="small text-start mt-2 mb-0">Ejemplos:<br>${ejemplos}</p>` : ""}
          <p class="small text-muted mt-2 mb-0">Abra la carpeta de la factura en el validador FEV-RIPS de MinSalud.</p>`,
        width: "640px",
      });
    }
    return data;
  } catch (err) {
    if (!silencioso) Swal.close();
    if (!silencioso) Swal.fire({ icon: "error", text: err.message || String(err) });
    return null;
  }
}

async function exportarCarpetasValidador() {
  const sel = selectedItems();
  const items = sel.length ? itemsParaExportarValidador(true) : itemsParaExportarValidador(false);
  const filtrados = items.filter((it) => {
    const p = paquetesCache.find((x) => x.clave === it.clave);
    return esSinFactura() ? p?.tieneJson : p?.tieneXml && p?.tieneJson;
  });
  await exportarValidadorItems(filtrados);
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
      text: esSinFactura()
        ? "No hay paquetes listos para validar."
        : "No hay facturas listas para validar (XML + JSON, no enviadas).",
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
    const sinMod = r.archivosSinModificar || r.jsonSinModificar || 0;
    Swal.fire({
      icon: r.conErrores ? "warning" : sinMod ? "warning" : "success",
      title: "Prevalidación local",
      html: `
        <p>OK: <strong>${r.ok || 0}</strong> · Con avisos: <strong>${r.okConAvisos || 0}</strong> · Con errores: <strong>${r.conErrores || 0}</strong></p>
        ${
          sinMod
            ? `<p class="small text-warning mb-2"><strong>${sinMod}</strong> con JSON/XML sin modificar desde el último rechazo o error. Corrija los archivos y vuelva a validar antes de enviar.</p>`
            : ""
        }
        <p class="small text-muted mb-0">${
          esSinFactura()
            ? "Solo se requiere JSON SinFactura listo."
            : "Si falta XML o JSON, use <strong>Preparar XML + JSON</strong>. Luego valide antes de enviar."
        }</p>`,
    });
  } catch (err) {
    Swal.fire({ icon: "error", text: err.message || String(err) });
  }
}

function aplicarResultadoEnvio(items) {
  const byKey = new Map(items.map((i) => [i.clave, i]));
  paquetesCache = paquetesCache.map((p) => {
    const hit = byKey.get(p.clave);
    if (!hit) return p;
    return {
      ...p,
      ultimoEnvio: {
        fecha: new Date().toISOString(),
        estado: hit.estado,
        codigoUnicoValidacion: hit.codigoUnicoValidacion,
        detalle: hit.detalle,
        resultadosValidacion: hit.resultadosValidacion,
      },
      estadoUi:
        hit.estado === "Enviado OK"
          ? "Enviado OK"
          : hit.estado === "Rechazado"
            ? "Rechazado"
            : hit.estado || p.estadoUi,
    };
  });
}

function mostrarResultado(data) {
  const items = data.items || [];
  const r = data.resumen || {};
  const rows = items
    .map(
      (i) => `
    <tr>
      <td><code>${escapeHtml(i.clave || "")}</code></td>
      <td>${escapeHtml(i.estado || "")}</td>
      <td style="font-size:0.75rem;word-break:break-all;">${escapeHtml(i.codigoUnicoValidacion || "—")}</td>
      <td style="font-size:0.75rem;">
        <span>${escapeHtml(truncarTexto(i.detalle, 80))}</span>
        ${
          i.clave
            ? `<button type="button" class="btn btn-link btn-sm p-0 ms-1 fev-res-ver-detalle" data-clave="${escapeHtml(i.clave)}">Ver detalle</button>`
            : ""
        }
      </td>
    </tr>`
    )
    .join("");

  Swal.fire({
    icon: r.errores || r.rechazados || r.omitidosPrevalidacion ? "warning" : "success",
    title: "Resultado envío",
    width: "90%",
      html: `
      <p>OK: <strong>${r.ok || 0}</strong> · Rechazados: <strong>${r.rechazados || 0}</strong> · Errores: <strong>${r.errores || 0}</strong> · Omitidos: <strong>${r.omitidosPrevalidacion || 0}</strong>${r.omitidosSinModificar ? ` · Sin modificar: <strong>${r.omitidosSinModificar}</strong>` : ""}</p>
      <div style="max-height:360px;overflow:auto;text-align:left;">
        <table class="table table-sm"><thead><tr><th>Clave</th><th>Estado</th><th>CUV</th><th>Detalle</th></tr></thead>
        <tbody>${rows || "<tr><td colspan=4>Sin ítems</td></tr>"}</tbody></table>
      </div>`,
    didOpen: () => {
      document.querySelectorAll(".fev-res-ver-detalle").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          verDetallePaquete(btn.getAttribute("data-clave"));
        });
      });
    },
  });
}

async function enviarItems(items, opts = {}) {
  const doc = getDocumentoEmpresa();
  if (!doc) {
    Swal.fire({ icon: "warning", text: "Sin empresa de trabajo." });
    return;
  }
  const prevalidados = items.filter((it) => {
    const p = paquetesCache.find((x) => x.clave === it.clave);
    return p?.prevalidacion?.ok === true;
  });
  const okItems = prevalidados.filter((it) => {
    const p = paquetesCache.find((x) => x.clave === it.clave);
    return !tieneCuv(p);
  });
  const saltadosCuv = prevalidados.length - okItems.length;

  if (!okItems.length) {
    Swal.fire({
      icon: "warning",
      title: saltadosCuv ? "Ya enviados (CUV)" : "Sin prevalidados",
      text: saltadosCuv
        ? "Los seleccionados ya tienen CUV registrado. No se reenvían a MinSalud."
        : esSinFactura()
          ? "Primero valide. Solo se envían paquetes con prevalidación OK (JSON)."
          : "Primero valide. Solo se envían facturas con prevalidación OK (XML + JSON).",
    });
    return;
  }

  const sinModificar = okItems.filter((it) => {
    const p = paquetesCache.find((x) => x.clave === it.clave);
    return paqueteSinModificarDesdeError(p);
  });
  let itemsParaEnvio = okItems;
  let confirmarReenvioSinCambios = Boolean(opts.confirmarReenvioSinCambios);

  if (sinModificar.length && !confirmarReenvioSinCambios) {
    const filas = sinModificar
      .map((it) => {
        const p = paquetesCache.find((x) => x.clave === it.clave);
        const msg = truncarTexto(p?.prevalidacion?.mensajeSinModificar || "", 80);
        return `<li><code>${escapeHtml(it.clave)}</code>${msg ? ` — ${escapeHtml(msg)}` : ""}</li>`;
      })
      .join("");
    const adv = await Swal.fire({
      icon: "warning",
      title: "JSON/XML sin modificar",
      html: `<p class="text-start small mb-2">Estos paquetes no cambiaron desde el último rechazo o error (ni el JSON ni el XML). Hay riesgo de obtener el mismo resultado en MinSalud:</p>
        <ul class="text-start small fevrips-det-list mb-2">${filas}</ul>
        <p class="text-start small text-muted mb-0">Corrija el JSON o el XML en disco, y luego pulse <strong>Validar</strong> de nuevo.</p>`,
      showCancelButton: true,
      showDenyButton: sinModificar.length < okItems.length,
      confirmButtonText: "Enviar de todos modos",
      denyButtonText: "Solo los modificados",
      cancelButtonText: "Cancelar",
      width: "640px",
    });
    if (adv.isDismissed) return;
    if (adv.isConfirmed) {
      confirmarReenvioSinCambios = true;
    } else if (adv.isDenied) {
      const sinSet = new Set(sinModificar.map((it) => it.clave));
      itemsParaEnvio = okItems.filter((it) => !sinSet.has(it.clave));
      if (!itemsParaEnvio.length) {
        Swal.fire({
          icon: "info",
          title: "Nada que enviar",
          text: "Todos los seleccionados tienen el JSON/XML sin modificar. Corrija al menos uno antes de enviar.",
        });
        return;
      }
    }
  }

  const conf = await Swal.fire({
    icon: "question",
    title: "¿Enviar a MinSalud?",
    html: `<p>${itemsParaEnvio.length} ${esSinFactura() ? "paquete(s) Sin Factura" : "factura(s)"} → API Docker FEV-RIPS</p>
           ${
             saltadosCuv
               ? `<p class="small text-warning mb-1">${saltadosCuv} omitido(s): ya tienen CUV.</p>`
               : ""
           }
           ${
             sinModificar.length && itemsParaEnvio.length < okItems.length
               ? `<p class="small text-warning mb-1">${okItems.length - itemsParaEnvio.length} omitido(s): JSON/XML sin modificar.</p>`
               : ""
           }
           ${
             sinModificar.length && confirmarReenvioSinCambios
               ? `<p class="small text-warning mb-1">${sinModificar.length} con JSON/XML sin modificar (reenvío forzado).</p>`
               : ""
           }
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
      body: JSON.stringify({
        documentoEmpresa: doc,
        modo: modoActual,
        items: itemsParaEnvio,
        confirmarReenvioSinCambios: confirmarReenvioSinCambios,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      Swal.fire({ icon: "error", title: "Error", text: data.message || `HTTP ${res.status}` });
      return;
    }
    aplicarResultadoEnvio(data.items || []);
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
  actualizarTabsDesglose();
  actualizarUiTabDesglose();

  document.getElementById("btnModoConFactura")?.addEventListener("click", () => setModo("con_factura"));
  document.getElementById("btnModoSinFactura")?.addEventListener("click", () => setModo("sin_factura"));
  document.getElementById("btnBuscarFevRips")?.addEventListener("click", buscarPaquetes);
  document.getElementById("btnPrepararArchivos")?.addEventListener("click", prepararArchivosFaltantes);
  document.getElementById("btnExportarValidador")?.addEventListener("click", exportarCarpetasValidador);
  document.getElementById("btnCredencialesFev")?.addEventListener("click", editarCredenciales);
  document.getElementById("btnValidarFev")?.addEventListener("click", () => {
    validarItems(itemsParaValidarTodosListos());
  });
  document.getElementById("btnEnviarFev")?.addEventListener("click", () => {
    enviarItems(itemsParaEnviarSegunScope());
  });
  document.querySelectorAll('input[name="scopeEnviarFev"]').forEach((el) => {
    el.addEventListener("change", updateActionButtons);
  });
  document.querySelectorAll(".fevrips-tab-desglose").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      if (tab && tab !== tabDesgloseActiva) setTabDesglose(tab);
    });
  });
  document.getElementById("fevCheckAll")?.addEventListener("change", (ev) => {
    document.querySelectorAll(".fev-chk:not(:disabled)").forEach((chk) => {
      chk.checked = ev.target.checked;
    });
    updateActionButtons();
  });
}

init().catch((e) => console.error(e));

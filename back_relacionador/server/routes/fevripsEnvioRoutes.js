/**
 * Listar / enviar paquetes ARCHIVOS_DE_ENVIO → API Docker FEV-RIPS.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Router = require('express').Router;
const { getRipsDataRoot } = require('../config/paths');
const {
  obtenerCredencialesPublicas,
  guardarCredenciales,
} = require('../utils/fevripsCredenciales');
const {
  baseUrl,
  ambienteConfigurado,
  assertAmbientePermitido,
  loginSispro,
  cargarFevRips,
  cargarRipsSinFactura,
  clearTokenCache,
} = require('../utils/fevripsApiClient');
const { validarPaqueteLocal } = require('../utils/fevripsValidarLocal');
const {
  listarFacturasConEstadoXml,
  encontrarJsonParaClave,
  encontrarJsonSinFactura,
  listarSinFacturaPorRango,
} = require('../utils/fevripsFacturasXml');
const { existeXmlEmpresa, claveXml } = require('../utils/xmlCache');
const { marcarEnviadoTrasEnvioOk } = require('../utils/fevripsMarcarEnviado');
const {
  formatErrMessage,
  formatResultDetalle,
  resumenValidaciones,
  detalleValidaciones,
  serializarError,
} = require('../utils/fevripsErrorFormat');
const {
  exportarPaquetesValidador,
  exportarPaqueteValidador,
  infoPaqueteValidador,
} = require('../utils/fevripsPaquetesValidador');
const {
  cuvValido,
  buscarCuvEnArchivosResultado,
  resolverCuvExistente,
  resolverCuvDesdeCampos,
} = require('../utils/fevripsCuvExistente');

const router = Router();

function envioRoot() {
  return path.join(getRipsDataRoot(), 'ARCHIVOS_DE_ENVIO');
}

function resultadosRoot() {
  return path.join(getRipsDataRoot(), 'FEVRIPS_RESULTADOS');
}

function safeListDirs(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((n) => {
      try {
        return fs.statSync(path.join(dir, n)).isDirectory();
      } catch (_) {
        return false;
      }
    });
  } catch (_) {
    return [];
  }
}

function safeListFiles(dir, ext) {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(ext));
  } catch (_) {
    return [];
  }
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function xmlToBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  return buf.toString('base64');
}

/** Extrae fechas YYYY-MM-DD del nombre REPORTE (... --- fi --- ff) */
function extractFechasFromReporte(nombre) {
  const m = String(nombre || '').match(/(\d{4}-\d{2}-\d{2})\s*---\s*(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  return { fechaInicio: m[1], fechaFin: m[2] };
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

function listarPaquetesEnReporte(reporteNombre) {
  const reporteDir = path.join(envioRoot(), reporteNombre);
  if (!fs.existsSync(reporteDir)) return [];

  const items = [];
  const fechas = extractFechasFromReporte(reporteNombre);

  const conFactura = path.join(reporteDir, 'CON_FACTURA');
  for (const clave of safeListDirs(conFactura)) {
    const dir = path.join(conFactura, clave);
    const jsonPath = path.join(dir, `${clave}.json`);
    const xmlPath = path.join(dir, `${clave}.xml`);
    const hasJson = fs.existsSync(jsonPath);
    const hasXml = fs.existsSync(xmlPath);
    items.push({
      tipo: 'CON_FACTURA',
      clave,
      reporte: reporteNombre,
      fechaInicioLote: fechas?.fechaInicio || null,
      fechaFinLote: fechas?.fechaFin || null,
      rutaDir: dir,
      rutaJson: hasJson ? jsonPath : null,
      rutaXml: hasXml ? xmlPath : null,
      listo: hasJson && hasXml,
      endpoint: 'CargarFevRips',
      procesoEnvio: 'Factura Electrónica de Venta',
    });
  }

  const sinFactura = path.join(reporteDir, 'SIN_FACTURA');
  for (const sub of safeListDirs(sinFactura)) {
    const dir = path.join(sinFactura, sub);
    for (const jf of safeListFiles(dir, '.json')) {
      const jsonPath = path.join(dir, jf);
      const clave = path.basename(jf, '.json');
      items.push({
        tipo: 'SIN_FACTURA',
        clave,
        reporte: reporteNombre,
        fechaInicioLote: fechas?.fechaInicio || null,
        fechaFinLote: fechas?.fechaFin || null,
        rutaDir: dir,
        rutaJson: jsonPath,
        rutaXml: null,
        listo: true,
        endpoint: 'CargarRipsSinFactura',
        procesoEnvio: 'Rips Sin Factura',
      });
    }
  }

  return items;
}

function listarTodosLosReportes() {
  return safeListDirs(envioRoot())
    .filter((n) => n.startsWith('REPORTE'))
    .sort((a, b) => b.localeCompare(a));
}

function listarPaquetesPorRango(fechaInicio, fechaFin) {
  const fi = String(fechaInicio || '').slice(0, 10);
  const ff = String(fechaFin || '').slice(0, 10);
  const out = [];
  for (const nombre of listarTodosLosReportes()) {
    const fechas = extractFechasFromReporte(nombre);
    if (fi && ff && fechas) {
      if (!rangesOverlap(fechas.fechaInicio, fechas.fechaFin, fi, ff)) continue;
    } else if (fi && ff && !fechas) {
      continue;
    }
    out.push(...listarPaquetesEnReporte(nombre));
  }
  return out;
}

/** Último resultado guardado por clave (escaneo liviano). */
function mapaUltimosResultados(documentoEmpresa) {
  const map = new Map();
  const root = path.join(
    resultadosRoot(),
    String(documentoEmpresa || 'SIN_EMPRESA').trim() || 'SIN_EMPRESA'
  );
  if (!fs.existsSync(root)) return map;

  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch (_) {
      return;
    }
    for (const name of entries) {
      const full = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(full);
      } catch (_) {
        continue;
      }
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.toLowerCase().endsWith('.json')) continue;
      try {
        const data = JSON.parse(fs.readFileSync(full, 'utf8'));
        const clave = data?.paquete?.clave || name.split('_')[0];
        if (!clave) continue;
        const prev = map.get(clave);
        const ts = data.fecha || '';
        if (!prev || String(ts) > String(prev.fecha || '')) {
          const r = data.resultado || {};
          map.set(clave, {
            fecha: ts,
            estado: r.ok
              ? 'Enviado OK'
              : r.httpError
                ? 'Error HTTP'
                : r.resultState === false
                  ? 'Rechazado'
                  : r.error
                    ? 'Error'
                    : 'Desconocido',
            codigoUnicoValidacion: r.codigoUnicoValidacion || null,
            detalle: formatResultDetalle(r),
            resultadosValidacion: r.resultadosValidacion || [],
            rechazos: r.rechazos || [],
            httpStatus: r.httpStatus || null,
            errorDetalle: r.errorDetalle || (r.errors ? { errors: r.errors } : null),
            archivo: full,
          });
        }
      } catch (_) { /* ignore */ }
    }
  };
  walk(root);
  return map;
}

function enriquecerPublico(paquetes, documentoEmpresa) {
  const ultimos = documentoEmpresa ? mapaUltimosResultados(documentoEmpresa) : new Map();
  const doc = String(documentoEmpresa || 'SIN_EMPRESA').trim() || 'SIN_EMPRESA';
  const resRoot = documentoEmpresa ? path.join(resultadosRoot(), doc) : null;

  return paquetes.map((p) => {
    const u = ultimos.get(p.clave);
    const cuvArch =
      resRoot && p.clave ? buscarCuvEnArchivosResultado(resRoot, p.clave) : null;
    const cuv =
      resolverCuvDesdeCampos({
        ...p,
        cuvFevRips: p.cuvFevRips || cuvArch || null,
        ultimoEnvio: u,
      }) ||
      cuvArch ||
      null;
    const tieneCuv = cuvValido(cuv);
    const enviado = Boolean(p.enviadoFevRips || tieneCuv);

    let estadoUi;
    if (!p.listo) estadoUi = 'Incompleto';
    else if (enviado || u?.estado === 'Enviado OK') estadoUi = 'Enviado OK';
    else if (u?.estado === 'Rechazado') estadoUi = 'Rechazado';
    else if (u) estadoUi = u.estado;
    else if (p.estadoUi) estadoUi = p.estadoUi;
    else estadoUi = 'Pendiente';

    return {
      tipo: p.tipo,
      clave: p.clave,
      reporte: p.reporte,
      fechaInicioLote: p.fechaInicioLote,
      fechaFinLote: p.fechaFinLote,
      listo: p.listo,
      endpoint: p.endpoint,
      procesoEnvio: p.procesoEnvio,
      tieneJson: Boolean(p.rutaJson),
      tieneXml: Boolean(p.rutaXml),
      cuvFevRips: cuv || p.cuvFevRips || null,
      enviadoFevRips: enviado,
      ultimoEnvio: u || null,
      estadoUi,
    };
  });
}

function resumenDashboard(paquetesPublicos) {
  return {
    total: paquetesPublicos.length,
    listos: paquetesPublicos.filter((p) => p.listo).length,
    incompletos: paquetesPublicos.filter((p) => !p.listo).length,
    conFactura: paquetesPublicos.filter((p) => p.tipo === 'CON_FACTURA').length,
    sinFactura: paquetesPublicos.filter((p) => p.tipo === 'SIN_FACTURA').length,
    enviadosOk: paquetesPublicos.filter((p) => p.estadoUi === 'Enviado OK').length,
    rechazados: paquetesPublicos.filter((p) => p.estadoUi === 'Rechazado').length,
    pendientes: paquetesPublicos.filter((p) => p.estadoUi === 'Pendiente' || p.estadoUi === 'Incompleto').length,
  };
}

function persistirResultado(documentoEmpresa, item, resultado) {
  const dir = path.join(
    resultadosRoot(),
    String(documentoEmpresa || 'SIN_EMPRESA').trim() || 'SIN_EMPRESA',
    item.reporte || '_sin_reporte'
  );
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${item.clave || 'paquete'}_${stamp}.json`);
  const payload = {
    guardadoEn: file,
    fecha: new Date().toISOString(),
    documentoEmpresa,
    ambiente: ambienteConfigurado(),
    apiBase: baseUrl(),
    paquete: {
      tipo: item.tipo,
      clave: item.clave,
      reporte: item.reporte,
      endpoint: item.endpoint,
    },
    resultado,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return file;
}

async function enviarPaquetesLista(documentoEmpresa, paquetes) {
  const items = [];
  const resRoot = path.join(
    resultadosRoot(),
    String(documentoEmpresa || 'SIN_EMPRESA').trim() || 'SIN_EMPRESA'
  );

  for (const p of paquetes) {
    const row = {
      tipo: p.tipo,
      clave: p.clave,
      reporte: p.reporte,
      endpoint: p.endpoint,
      procesoEnvio: p.procesoEnvio,
      estado: 'Pendiente',
      codigoUnicoValidacion: null,
      resultState: null,
      detalle: '',
      resultadosValidacion: [],
      archivoResultado: null,
    };

    try {
      const existente = await resolverCuvExistente(documentoEmpresa, p, { resultadosRoot: resRoot });
      if (cuvValido(existente.cuv)) {
        row.estado = 'Omitido';
        row.codigoUnicoValidacion = existente.cuv;
        row.detalle = `Ya tiene CUV (${existente.origen || 'registrado'}): ${existente.cuv}`;
        items.push(row);
        continue;
      }

      const rips = readJsonFile(p.rutaJson);
      let resultado;
      if (p.tipo === 'CON_FACTURA') {
        if (!p.rutaXml || !fs.existsSync(p.rutaXml)) {
          throw new Error('XML ausente en paquete CON_FACTURA');
        }
        resultado = await cargarFevRips(documentoEmpresa, rips, xmlToBase64(p.rutaXml));
      } else {
        resultado = await cargarRipsSinFactura(documentoEmpresa, rips);
      }

      row.resultState = resultado.resultState;
      row.codigoUnicoValidacion = resultado.codigoUnicoValidacion;
      row.resultadosValidacion = resultado.resultadosValidacion || [];
      row.validacionesDetalle = detalleValidaciones(
        resultado.resultadosValidacion?.length
          ? resultado.resultadosValidacion
          : resultado.rechazos || []
      );
      row.procesoId = resultado.procesoId;
      row.ambienteApi = resultado.ambiente;
      row.httpStatus = resultado.httpStatus;

      if (resultado.ok) {
        row.estado = 'Enviado OK';
        row.detalle = resultado.codigoUnicoValidacion
          ? `CUV: ${resultado.codigoUnicoValidacion}`
          : 'ResultState true';
        try {
          // Prefijo/folio: del paquete o derivados de la clave (FE16196)
          let prefijo = p.Prefijo;
          let noFactura = p.NoFactura;
          if ((!prefijo || noFactura == null || noFactura === '') && p.clave) {
            const m = String(p.clave).match(/^([A-Za-z]+)(\d+)$/);
            if (m) {
              prefijo = prefijo || m[1];
              noFactura = noFactura != null && noFactura !== '' ? noFactura : m[2];
            }
          }
          const mark = await marcarEnviadoTrasEnvioOk({
            documentoEmpresa,
            paquete: { ...p, Prefijo: prefijo, NoFactura: noFactura },
            cuv: resultado.codigoUnicoValidacion,
            ambiente: resultado.ambiente || ambienteConfigurado(),
            ripsJson: rips,
          });
          row.bdActualizada = mark.filas;
          row.bdModo = mark.modo;
          if (mark.filas > 0) {
            row.detalle += ` · BD: ${mark.filas} RIPS marcado(s)`;
          } else {
            row.detalle += ' · BD: sin filas actualizadas (¿ejecutó el ALTER SQL?)';
          }
        } catch (dbErr) {
          console.error('[fevrips] No se pudo marcar Enviado/CUV en BD:', dbErr.message || dbErr);
          row.detalle += ` · BD: error (${dbErr.message || dbErr})`;
        }
      } else if (resultado.httpError) {
        row.estado = 'Error HTTP';
        row.detalle = resultado.message || 'Error HTTP';
      } else {
        row.estado = 'Rechazado';
        row.rechazos = resultado.rechazos || [];
        const msgs = resumenValidaciones(resultado.rechazos || resultado.resultadosValidacion);
        row.detalle = msgs.slice(0, 5).join(' | ') || 'ResultState false';
      }
      row.archivoResultado = persistirResultado(documentoEmpresa, p, resultado);
    } catch (err) {
      row.estado = 'Error';
      const errInfo = serializarError(err);
      row.detalle = errInfo.message;
      row.errorDetalle = errInfo;
      try {
        row.archivoResultado = persistirResultado(documentoEmpresa, p, {
          ok: false,
          error: errInfo.message,
          code: errInfo.code,
          errors: errInfo.errors,
          errorDetalle: errInfo,
        });
      } catch (_) { /* ignore */ }
    }
    items.push(row);
  }
  return items;
}

router.get('/fevrips/config', (req, res) => {
  try {
    assertAmbientePermitido();
    res.json({
      apiBaseUrl: baseUrl(),
      ambiente: ambienteConfigurado(),
      tlsRejectUnauthorized: !['0', 'false', 'no', 'off'].includes(
        String(process.env.FEVRIPS_TLS_REJECT_UNAUTHORIZED || 'false').trim().toLowerCase()
      ),
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message, code: err.code });
  }
});

router.get('/fevrips/credenciales/:documentoEmpresa', async (req, res) => {
  try {
    const pub = await obtenerCredencialesPublicas(req.params.documentoEmpresa);
    if (!pub) return res.status(404).json({ message: 'Sin credenciales configuradas' });
    res.json(pub);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || String(err) });
  }
});

router.put('/fevrips/credenciales/:documentoEmpresa', async (req, res) => {
  try {
    const saved = await guardarCredenciales(req.params.documentoEmpresa, req.body || {});
    clearTokenCache(req.params.documentoEmpresa);
    res.json({ message: 'Credenciales SISPRO guardadas', credenciales: saved });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || String(err) });
  }
});

router.post('/fevrips/login-test/:documentoEmpresa', async (req, res) => {
  try {
    assertAmbientePermitido();
    const token = await loginSispro(req.params.documentoEmpresa);
    res.json({
      ok: true,
      message: 'LoginSISPRO OK',
      tokenPreview: `${String(token).slice(0, 12)}…`,
      ambiente: ambienteConfigurado(),
      apiBaseUrl: baseUrl(),
    });
  } catch (err) {
    res.status(err.status || 500).json({
      ok: false,
      message: err.message || String(err),
      code: err.code,
      detail: err.detail,
    });
  }
});

router.get('/fevrips/reportes', (req, res) => {
  try {
    const root = envioRoot();
    const reportes = listarTodosLosReportes().map((nombre) => {
      const paquetes = listarPaquetesEnReporte(nombre);
      const fechas = extractFechasFromReporte(nombre);
      return {
        nombre,
        ruta: path.join(root, nombre),
        fechaInicio: fechas?.fechaInicio || null,
        fechaFin: fechas?.fechaFin || null,
        total: paquetes.length,
        listos: paquetes.filter((p) => p.listo).length,
        conFactura: paquetes.filter((p) => p.tipo === 'CON_FACTURA').length,
        sinFactura: paquetes.filter((p) => p.tipo === 'SIN_FACTURA').length,
      };
    });
    res.json({ reportes, dataRoot: getRipsDataRoot() });
  } catch (err) {
    res.status(500).json({ message: err.message || String(err) });
  }
});

router.get('/fevrips/paquetes', (req, res) => {
  try {
    const reporte = String(req.query.reporte || '').trim();
    if (!reporte) {
      return res.status(400).json({ message: 'Query reporte requerido' });
    }
    const documentoEmpresa = String(req.query.documentoEmpresa || '').trim();
    const paquetes = enriquecerPublico(listarPaquetesEnReporte(reporte), documentoEmpresa);
    res.json({
      reporte,
      paquetes,
      total: paquetes.length,
      dashboard: resumenDashboard(paquetes),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || String(err) });
  }
});

/**
 * GET /RIPS/fevrips/paquetes-rango?fechaInicio&fechaFin&documentoEmpresa&modo=con_factura|sin_factura
 */
router.get('/fevrips/paquetes-rango', async (req, res) => {
  try {
    const fechaInicio = String(req.query.fechaInicio || '').slice(0, 10);
    const fechaFin = String(req.query.fechaFin || '').slice(0, 10);
    const documentoEmpresa = String(req.query.documentoEmpresa || '').trim();
    const modo = String(req.query.modo || 'con_factura').trim().toLowerCase();
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: 'fechaInicio y fechaFin requeridos (YYYY-MM-DD)' });
    }
    if (!documentoEmpresa) {
      return res.status(400).json({ message: 'documentoEmpresa requerido' });
    }

    if (modo === 'sin_factura') {
      const { items, dashboard } = listarSinFacturaPorRango(fechaInicio, fechaFin);
      const conUltimo = enriquecerPublico(items, documentoEmpresa).map((pub, idx) => ({
        ...items[idx],
        ...pub,
        estadoUi: pub.estadoUi || items[idx].estadoUi,
        cuvFevRips: pub.cuvFevRips || items[idx].cuvFevRips,
        enviadoFevRips: pub.enviadoFevRips || items[idx].enviadoFevRips,
        ultimoEnvio: pub.ultimoEnvio,
        paqueteValidador: infoPaqueteValidador(documentoEmpresa, items[idx].clave, items[idx]),
      }));
      return res.json({
        fechaInicio,
        fechaFin,
        documentoEmpresa,
        modo: 'sin_factura',
        paquetes: conUltimo,
        total: conUltimo.length,
        dashboard,
        ambiente: ambienteConfigurado(),
        apiBaseUrl: baseUrl(),
      });
    }

    const { items, dashboard } = await listarFacturasConEstadoXml(
      documentoEmpresa,
      fechaInicio,
      fechaFin
    );
    const conUltimo = enriquecerPublico(
      items.map((i) => ({
        ...i,
        rutaJson: i.rutaJson,
        rutaXml: i.tieneXml ? i.rutaXml : null,
      })),
      documentoEmpresa
    ).map((pub, idx) => ({
      ...items[idx],
      ...pub,
      estadoUi: pub.estadoUi || items[idx].estadoUi,
      cuvFevRips: pub.cuvFevRips || items[idx].cuvFevRips,
      enviadoFevRips: pub.enviadoFevRips || items[idx].enviadoFevRips,
      ultimoEnvio: pub.ultimoEnvio,
      paqueteValidador: infoPaqueteValidador(documentoEmpresa, items[idx].clave, items[idx]),
    }));

    res.json({
      fechaInicio,
      fechaFin,
      documentoEmpresa,
      modo: 'con_factura',
      paquetes: conUltimo,
      total: conUltimo.length,
      dashboard,
      ambiente: ambienteConfigurado(),
      apiBaseUrl: baseUrl(),
    });
  } catch (err) {
    console.error('[fevrips] paquetes-rango:', err);
    res.status(500).json({ message: err.message || String(err) });
  }
});

/**
 * POST /RIPS/fevrips/resolver-para-envio
 * Asegura XML en caché + localiza JSON. Body: { documentoEmpresa, items: [{ Prefijo, NoFactura, clave }] }
 */
router.post('/fevrips/resolver-para-envio', (req, res) => {
  try {
    const documentoEmpresa = String(req.body?.documentoEmpresa || '').trim();
    const itemsIn = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!documentoEmpresa) {
      return res.status(400).json({ message: 'documentoEmpresa requerido' });
    }
    const root = getRipsDataRoot();
    const items = itemsIn.map((it) => {
      const prefijo = String(it.Prefijo || it.prefijo || '').trim();
      const no = it.NoFactura != null ? it.NoFactura : it.folio;
      const clave = String(it.clave || claveXml(prefijo, no)).trim();
      const xmlPath = existeXmlEmpresa(root, documentoEmpresa, prefijo, no);
      const jsonInfo = encontrarJsonParaClave(clave);
      return {
        clave,
        Prefijo: prefijo,
        NoFactura: no,
        tieneXml: Boolean(xmlPath),
        tieneJson: Boolean(jsonInfo.rutaJson),
        rutaXml: xmlPath,
        rutaJson: jsonInfo.rutaJson,
        reporte: jsonInfo.reporte,
        listo: Boolean(xmlPath && jsonInfo.rutaJson),
        detalle: !xmlPath
          ? 'Falta XML'
          : !jsonInfo.rutaJson
            ? 'Falta JSON RIPS (genérelo / empaquete antes de enviar)'
            : 'OK',
      };
    });
    res.json({ items, listos: items.filter((i) => i.listo).length });
  } catch (err) {
    res.status(500).json({ message: err.message || String(err) });
  }
});

/**
 * Prevalidación local (no llama al API Docker / MinSalud).
 * Body: { items?: [{reporte,clave}], fechaInicio?, fechaFin?, reporte?, claves? }
 */
router.post('/fevrips/validar', (req, res) => {
  try {
    let paquetes = [];
    const itemsSel = Array.isArray(req.body?.items) ? req.body.items : null;
    const documentoEmpresa = String(req.body?.documentoEmpresa || '').trim();
    const modo = String(req.body?.modo || '').trim().toLowerCase();
    const root = getRipsDataRoot();

    if (itemsSel && itemsSel.length) {
      for (const it of itemsSel) {
        const tipoReq = String(it.tipo || '').trim().toUpperCase();
        const esSin =
          modo === 'sin_factura' ||
          tipoReq === 'SIN_FACTURA' ||
          /^SinFactura_/i.test(String(it.clave || ''));
        const prefijo = String(it.Prefijo || it.prefijo || '').trim();
        const no = it.NoFactura != null ? it.NoFactura : it.folio;
        const clave = String(it.clave || claveXml(prefijo, no)).trim();
        const rep = String(it.reporte || '').trim();

        if (esSin) {
          const jsonInfo = encontrarJsonSinFactura(clave, rep);
          paquetes.push({
            tipo: 'SIN_FACTURA',
            clave,
            reporte: jsonInfo.reporte || rep || '',
            Prefijo: '',
            NoFactura: '',
            rutaJson: jsonInfo.rutaJson,
            rutaXml: null,
            listo: Boolean(jsonInfo.rutaJson),
            procesoEnvio: 'Rips Sin Factura',
            endpoint: 'CargarRipsSinFactura',
          });
          continue;
        }

        const jsonInfo = encontrarJsonParaClave(clave);
        const xmlPath =
          (prefijo || no != null) && documentoEmpresa
            ? existeXmlEmpresa(root, documentoEmpresa, prefijo, no)
            : null;
        let rutaXml = xmlPath;
        if (!rutaXml && jsonInfo.rutaJson) {
          const side = path.join(path.dirname(jsonInfo.rutaJson), `${clave}.xml`);
          if (fs.existsSync(side)) rutaXml = side;
        }
        paquetes.push({
          tipo: 'CON_FACTURA',
          clave,
          reporte: jsonInfo.reporte || rep || '',
          Prefijo: prefijo,
          NoFactura: no,
          rutaJson: jsonInfo.rutaJson,
          rutaXml,
          listo: Boolean(jsonInfo.rutaJson && rutaXml),
          procesoEnvio: 'Factura Electrónica de Venta',
        });
      }
    } else {
      const reporte = String(req.body?.reporte || '').trim();
      const fi = String(req.body?.fechaInicio || '').slice(0, 10);
      const ff = String(req.body?.fechaFin || '').slice(0, 10);
      if (reporte) paquetes = listarPaquetesEnReporte(reporte);
      else if (fi && ff) paquetes = listarPaquetesPorRango(fi, ff);
      else {
        return res.status(400).json({
          message: 'Indique items[{clave,Prefijo,NoFactura}], o reporte, o fechaInicio+fechaFin',
        });
      }
      const claves = Array.isArray(req.body?.claves)
        ? req.body.claves.map((c) => String(c)).filter(Boolean)
        : null;
      if (claves && claves.length) {
        const set = new Set(claves);
        paquetes = paquetes.filter((p) => set.has(p.clave));
      }
    }

    const items = paquetes.map((p) => {
      const v = validarPaqueteLocal(p);
      return {
        tipo: p.tipo,
        clave: p.clave,
        reporte: p.reporte,
        Prefijo: p.Prefijo,
        NoFactura: p.NoFactura,
        procesoEnvio: p.procesoEnvio,
        listo: p.listo,
        ok: v.ok,
        estadoValidacion: v.estadoValidacion,
        errors: v.errors,
        warnings: v.warnings,
        detalle: v.detalle,
      };
    });

    const resumen = {
      total: items.length,
      ok: items.filter((i) => i.ok && i.estadoValidacion === 'OK').length,
      okConAvisos: items.filter((i) => i.ok && i.estadoValidacion === 'OK con avisos').length,
      conErrores: items.filter((i) => !i.ok).length,
    };

    res.json({
      message: 'Prevalidación local finalizada (sin envío a MinSalud)',
      resumen,
      items,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || String(err) });
  }
});

/**
 * Body:
 * {
 *   documentoEmpresa,
 *   reporte?, claves?, tipos?,
 *   fechaInicio?, fechaFin?,
 *   items?: [{ reporte, clave }],
 *   soloValidados?: boolean  // si true, rechaza ítems sin prevalidación OK en body.validaciones
 * }
 */
router.post('/fevrips/enviar', async (req, res) => {
  try {
    assertAmbientePermitido();
    const documentoEmpresa = String(req.body?.documentoEmpresa || '').trim();
    if (!documentoEmpresa) {
      return res.status(400).json({ message: 'documentoEmpresa requerido' });
    }

    let paquetes = [];
    const omitidos = [];
    const itemsSel = Array.isArray(req.body?.items) ? req.body.items : null;

    if (itemsSel && itemsSel.length) {
      const root = getRipsDataRoot();
      const modo = String(req.body?.modo || '').trim().toLowerCase();
      for (const it of itemsSel) {
        const tipoReq = String(it.tipo || '').trim().toUpperCase();
        const esSin =
          modo === 'sin_factura' ||
          tipoReq === 'SIN_FACTURA' ||
          /^SinFactura_/i.test(String(it.clave || ''));
        const prefijo = String(it.Prefijo || it.prefijo || '').trim();
        const no = it.NoFactura != null ? it.NoFactura : it.folio;
        const clave = String(it.clave || claveXml(prefijo, no)).trim();
        const rep = String(it.reporte || '').trim();

        let matched = null;
        if (esSin) {
          if (rep) {
            matched =
              listarPaquetesEnReporte(rep).find(
                (p) => p.clave === clave && p.tipo === 'SIN_FACTURA' && p.listo
              ) || null;
          }
          if (!matched) {
            const jsonInfo = encontrarJsonSinFactura(clave, rep);
            if (jsonInfo.rutaJson) {
              matched = {
                tipo: 'SIN_FACTURA',
                clave,
                reporte: jsonInfo.reporte || rep || '',
                rutaJson: jsonInfo.rutaJson,
                rutaXml: null,
                listo: true,
                endpoint: 'CargarRipsSinFactura',
                procesoEnvio: 'Rips Sin Factura',
              };
            }
          }
        } else {
          if (rep) {
            matched =
              listarPaquetesEnReporte(rep).find(
                (p) => p.clave === clave && p.tipo === 'CON_FACTURA' && p.listo
              ) || null;
          }
          if (!matched) {
            const jsonInfo = encontrarJsonParaClave(clave);
            const xmlPath =
              prefijo || no != null
                ? existeXmlEmpresa(root, documentoEmpresa, prefijo, no)
                : null;
            let rutaXml = xmlPath;
            if (!rutaXml && jsonInfo.rutaJson) {
              const side = path.join(path.dirname(jsonInfo.rutaJson), `${clave}.xml`);
              if (fs.existsSync(side)) rutaXml = side;
            }
            if (jsonInfo.rutaJson && rutaXml) {
              matched = {
                tipo: 'CON_FACTURA',
                clave,
                Prefijo: prefijo,
                NoFactura: no,
                reporte: jsonInfo.reporte || rep || '',
                rutaJson: jsonInfo.rutaJson,
                rutaXml,
                listo: true,
                endpoint: 'CargarFevRips',
                procesoEnvio: 'Factura Electrónica de Venta',
              };
            }
          }
        }
        if (matched) paquetes.push(matched);
        else {
          omitidos.push({
            clave,
            reporte: rep,
            estado: 'Omitido',
            detalle: esSin
              ? 'No se encontró JSON SinFactura listo para envío'
              : 'No se encontró par XML+JSON listo para envío',
          });
        }
      }
    } else {
      const reporte = String(req.body?.reporte || '').trim();
      const fi = String(req.body?.fechaInicio || '').slice(0, 10);
      const ff = String(req.body?.fechaFin || '').slice(0, 10);

      if (reporte) {
        paquetes = listarPaquetesEnReporte(reporte).filter((p) => p.listo);
      } else if (fi && ff) {
        paquetes = listarPaquetesPorRango(fi, ff).filter((p) => p.listo);
      } else {
        return res.status(400).json({
          message: 'Indique items[{reporte,clave}], o reporte, o fechaInicio+fechaFin',
        });
      }

      const tipos = Array.isArray(req.body?.tipos) ? req.body.tipos.map(String) : null;
      if (tipos && tipos.length) {
        paquetes = paquetes.filter((p) => tipos.includes(p.tipo));
      }
      const claves = Array.isArray(req.body?.claves)
        ? req.body.claves.map((c) => String(c)).filter(Boolean)
        : null;
      if (claves && claves.length) {
        const set = new Set(claves);
        paquetes = paquetes.filter((p) => set.has(p.clave));
      }
    }

    const forzar = ['1', 'true', 'yes', 'on'].includes(
      String(req.body?.forzarEnvioSinPrevalidacion || '').trim().toLowerCase()
    );
    if (!forzar) {
      const filtrados = [];
      for (const p of paquetes) {
        const v = validarPaqueteLocal(p);
        if (!v.ok) {
          omitidos.push({
            clave: p.clave,
            reporte: p.reporte,
            estado: 'Omitido',
            detalle: `Prevalidación falló: ${v.detalle}`,
            errors: v.errors,
          });
        } else {
          filtrados.push(p);
        }
      }
      paquetes = filtrados;
    }

    const items = await enviarPaquetesLista(documentoEmpresa, paquetes);
    const resumen = {
      total: items.length + omitidos.length,
      ok: items.filter((i) => i.estado === 'Enviado OK').length,
      rechazados: items.filter((i) => i.estado === 'Rechazado').length,
      errores: items.filter((i) => i.estado === 'Error' || i.estado === 'Error HTTP').length,
      omitidosPrevalidacion: omitidos.length,
      omitidosCuv: items.filter((i) => i.estado === 'Omitido' && /CUV/i.test(String(i.detalle || ''))).length,
    };

    res.json({
      message: 'Envío FEV-RIPS finalizado',
      documentoEmpresa,
      ambiente: ambienteConfigurado(),
      apiBaseUrl: baseUrl(),
      resumen,
      items: [...items, ...omitidos],
      omitidos,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || String(err),
      code: err.code,
      detail: err.detail,
    });
  }
});

/**
 * GET /RIPS/fevrips/resultado/:clave?documentoEmpresa=
 * Devuelve el último JSON guardado de envío/prevalidación fallida para una clave.
 */
router.get('/fevrips/resultado/:clave', (req, res) => {
  try {
    const clave = String(req.params.clave || '').trim();
    const documentoEmpresa = String(req.query.documentoEmpresa || '').trim();
    if (!clave) return res.status(400).json({ message: 'clave requerida' });
    if (!documentoEmpresa) return res.status(400).json({ message: 'documentoEmpresa requerido' });

    const ultimos = mapaUltimosResultados(documentoEmpresa);
    const hit = ultimos.get(clave);
    if (!hit?.archivo || !fs.existsSync(hit.archivo)) {
      return res.status(404).json({ message: 'Sin resultado guardado para esta clave' });
    }

    const data = JSON.parse(fs.readFileSync(hit.archivo, 'utf8'));
    const r = data.resultado || {};
    const validacionesRaw =
      (Array.isArray(r.resultadosValidacion) && r.resultadosValidacion.length
        ? r.resultadosValidacion
        : null) ||
      (Array.isArray(r.rechazos) && r.rechazos.length ? r.rechazos : []);

    res.json({
      clave,
      fecha: data.fecha,
      ambiente: data.ambiente,
      paquete: data.paquete,
      resumen: {
        estado: hit.estado,
        detalle: hit.detalle,
        codigoUnicoValidacion: r.codigoUnicoValidacion || null,
        httpStatus: r.httpStatus || null,
      },
      resultado: r,
      validaciones: resumenValidaciones(validacionesRaw),
      validacionesDetalle: detalleValidaciones(validacionesRaw),
      rechazos: resumenValidaciones(r.rechazos || []),
      errorDetalle: r.errorDetalle || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || String(err) });
  }
});

/**
 * POST /RIPS/fevrips/exportar-validador
 * Copia XML+JSON a PAQUETES_VALIDADOR/{empresa}/{clave}/ para el validador MinSalud.
 */
router.post('/fevrips/exportar-validador', (req, res) => {
  try {
    const documentoEmpresa = String(req.body?.documentoEmpresa || '').trim();
    const itemsIn = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!documentoEmpresa) {
      return res.status(400).json({ message: 'documentoEmpresa requerido' });
    }
    if (!itemsIn.length) {
      return res.status(400).json({ message: 'items requerido (al menos una clave)' });
    }

    const data = exportarPaquetesValidador(documentoEmpresa, itemsIn);
    res.json({
      message: 'Paquetes copiados para validador manual',
      root: data.root,
      documentoEmpresa: data.documentoEmpresa,
      resumen: { total: data.total, ok: data.ok, fallidos: data.fallidos },
      items: data.items,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || String(err) });
  }
});

/**
 * GET /RIPS/fevrips/validador/:clave?documentoEmpresa=
 * Devuelve ruta del paquete; si no existe, intenta exportarlo.
 */
router.get('/fevrips/validador/:clave', (req, res) => {
  try {
    const clave = String(req.params.clave || '').trim();
    const documentoEmpresa = String(req.query.documentoEmpresa || '').trim();
    const reporte = String(req.query.reporte || '').trim();
    const modo = String(req.query.modo || '').trim().toLowerCase();
    if (!clave) return res.status(400).json({ message: 'clave requerida' });
    if (!documentoEmpresa) return res.status(400).json({ message: 'documentoEmpresa requerido' });

    const item = {
      clave,
      reporte: reporte || undefined,
      tipo: modo === 'sin_factura' || /^SinFactura_/i.test(clave) ? 'SIN_FACTURA' : 'CON_FACTURA',
    };

    let info = infoPaqueteValidador(documentoEmpresa, clave, item);
    let exportado = null;
    if (!info.listo) {
      exportado = exportarPaqueteValidador(documentoEmpresa, item);
      info = infoPaqueteValidador(documentoEmpresa, clave, item);
    }
    res.json({ ...info, exportado });
  } catch (err) {
    res.status(500).json({ message: err.message || String(err) });
  }
});

module.exports = router;

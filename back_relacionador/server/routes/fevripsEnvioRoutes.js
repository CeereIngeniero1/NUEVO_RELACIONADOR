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
  evaluarRechazoCuvDuplicado,
} = require('../utils/fevripsCuvExistente');
const {
  huellaPaqueteEnDisco,
  evaluarReenvioSinCambios,
} = require('../utils/fevripsHashPaquete');
const {
  resolverRutasPaquete,
  normalizarRutasPaquete,
  abrirCarpetasPaquete,
} = require('../utils/fevripsRutasArchivos');

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
          const dup = evaluarRechazoCuvDuplicado(r);
          const okEfectivo = r.ok || dup.esDuplicado;
          const cuvFinal = dup.cuv || r.codigoUnicoValidacion || null;
          map.set(clave, {
            fecha: ts,
            estado: okEfectivo
              ? 'Enviado OK'
              : r.httpError
                ? 'Error HTTP'
                : r.resultState === false
                  ? 'Rechazado'
                  : r.error
                    ? 'Error'
                    : 'Desconocido',
            codigoUnicoValidacion: cuvFinal,
            detalle:
              okEfectivo && dup.esDuplicado && !r.ok
                ? cuvFinal
                  ? `CUV: ${cuvFinal} (ya registrado en MinSalud — RVG18/RVG02)`
                  : 'CUV ya registrado en MinSalud (RVG18/RVG02)'
                : formatResultDetalle({ ...r, ok: okEfectivo, codigoUnicoValidacion: cuvFinal }),
            resultadosValidacion: r.resultadosValidacion || [],
            rechazos: r.rechazos || [],
            httpStatus: r.httpStatus || null,
            errorDetalle: r.errorDetalle || (r.errors ? { errors: r.errors } : null),
            contenidoEnviado: data.contenidoEnviado || null,
            cuvRecuperadoDeRechazo: dup.esDuplicado && !r.ok,
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

function persistirResultado(documentoEmpresa, item, resultado, contenidoEnviado) {
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
    contenidoEnviado: contenidoEnviado || null,
    resultado,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return file;
}

async function enviarPaquetesLista(documentoEmpresa, paquetes, opts = {}) {
  const confirmarSinCambios = Boolean(opts.confirmarSinCambios);
  const items = [];
  const resRoot = path.join(
    resultadosRoot(),
    String(documentoEmpresa || 'SIN_EMPRESA').trim() || 'SIN_EMPRESA'
  );

  for (const p of paquetes) {
    const paquete = normalizarRutasPaquete(documentoEmpresa, p);
    const row = {
      tipo: paquete.tipo,
      clave: paquete.clave,
      reporte: paquete.reporte,
      endpoint: paquete.endpoint,
      procesoEnvio: paquete.procesoEnvio,
      estado: 'Pendiente',
      codigoUnicoValidacion: null,
      resultState: null,
      detalle: '',
      resultadosValidacion: [],
      archivoResultado: null,
    };

    try {
      const existente = await resolverCuvExistente(documentoEmpresa, paquete, { resultadosRoot: resRoot });
      if (cuvValido(existente.cuv)) {
        row.estado = 'Omitido';
        row.codigoUnicoValidacion = existente.cuv;
        row.detalle = `Ya tiene CUV (${existente.origen || 'registrado'}): ${existente.cuv}`;
        items.push(row);
        continue;
      }

      const contenidoEnviado = huellaPaqueteEnDisco(paquete);
      const ultimos = mapaUltimosResultados(documentoEmpresa);
      const evalReenvio = evaluarReenvioSinCambios(paquete, ultimos.get(paquete.clave));
      if (evalReenvio.sinModificar && !confirmarSinCambios) {
        row.estado = 'Omitido';
        row.advertenciaSinModificar = true;
        row.detalle =
          evalReenvio.mensaje ||
          'JSON/XML sin modificar desde el último error. Corrija el RIPS antes de reenviar.';
        items.push(row);
        continue;
      }

      const rips = readJsonFile(paquete.rutaJson);
      let resultado;
      if (paquete.tipo === 'CON_FACTURA') {
        if (!paquete.rutaXml || !fs.existsSync(paquete.rutaXml)) {
          throw new Error('XML ausente en paquete CON_FACTURA');
        }
        resultado = await cargarFevRips(documentoEmpresa, rips, xmlToBase64(paquete.rutaXml));
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

      const dupCuv = evaluarRechazoCuvDuplicado(resultado);
      const envioOk = resultado.ok || dupCuv.esDuplicado;

      if (envioOk) {
        const cuvFinal = dupCuv.cuv || resultado.codigoUnicoValidacion || null;
        row.estado = 'Enviado OK';
        row.codigoUnicoValidacion = cuvFinal;
        row.cuvRecuperadoDeRechazo = dupCuv.esDuplicado && !resultado.ok;
        row.detalle = cuvFinal
          ? row.cuvRecuperadoDeRechazo
            ? `CUV: ${cuvFinal} (ya registrado en MinSalud — RVG18/RVG02)`
            : `CUV: ${cuvFinal}`
          : row.cuvRecuperadoDeRechazo
            ? 'CUV ya registrado en MinSalud (RVG18/RVG02)'
            : 'ResultState true';
        resultado = {
          ...resultado,
          ok: true,
          codigoUnicoValidacion: cuvFinal,
          cuvRecuperadoDeRechazo: row.cuvRecuperadoDeRechazo,
        };
        try {
          // Prefijo/folio: del paquete o derivados de la clave (FE16196)
          let prefijo = paquete.Prefijo;
          let noFactura = paquete.NoFactura;
          if ((!prefijo || noFactura == null || noFactura === '') && paquete.clave) {
            const m = String(paquete.clave).match(/^([A-Za-z]+)(\d+)$/);
            if (m) {
              prefijo = prefijo || m[1];
              noFactura = noFactura != null && noFactura !== '' ? noFactura : m[2];
            }
          }
          const mark = await marcarEnviadoTrasEnvioOk({
            documentoEmpresa,
            paquete: { ...paquete, Prefijo: prefijo, NoFactura: noFactura },
            cuv: cuvFinal,
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
      row.archivoResultado = persistirResultado(documentoEmpresa, paquete, resultado, contenidoEnviado);
    } catch (err) {
      row.estado = 'Error';
      const errInfo = serializarError(err);
      row.detalle = errInfo.message;
      row.errorDetalle = errInfo;
      try {
        const contenidoEnviado = huellaPaqueteEnDisco(paquete);
        row.archivoResultado = persistirResultado(
          documentoEmpresa,
          paquete,
          {
            ok: false,
            error: errInfo.message,
            code: errInfo.code,
            errors: errInfo.errors,
            errorDetalle: errInfo,
          },
          contenidoEnviado
        );
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
        paquetes.push(
          normalizarRutasPaquete(documentoEmpresa, {
            tipo: 'CON_FACTURA',
            clave,
            reporte: jsonInfo.reporte || rep || '',
            Prefijo: prefijo,
            NoFactura: no,
            rutaJson: jsonInfo.rutaJson,
            rutaXml: null,
            listo: Boolean(jsonInfo.rutaJson),
            procesoEnvio: 'Factura Electrónica de Venta',
            endpoint: 'CargarFevRips',
          })
        );
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

    if (documentoEmpresa) {
      paquetes = paquetes.map((p) => normalizarRutasPaquete(documentoEmpresa, p));
    }

    const items = paquetes.map((p) => {
      const v = validarPaqueteLocal(p);
      let archivosSinModificar = false;
      let jsonSinModificar = false;
      let xmlSinModificar = null;
      let mensajeSinModificar = null;
      if (documentoEmpresa) {
        const ultimos = mapaUltimosResultados(documentoEmpresa);
        const evalReenvio = evaluarReenvioSinCambios(p, ultimos.get(p.clave));
        archivosSinModificar = Boolean(evalReenvio.sinModificar);
        jsonSinModificar = archivosSinModificar;
        xmlSinModificar =
          evalReenvio.xmlSinModificar != null ? Boolean(evalReenvio.xmlSinModificar) : null;
        mensajeSinModificar = evalReenvio.mensaje || null;
      }
      const warnings = [...(v.warnings || [])];
      if (archivosSinModificar) {
        warnings.push(
          mensajeSinModificar ||
            'El JSON/XML no cambió desde el último rechazo o error. Riesgo de repetir el mismo resultado en MinSalud.'
        );
      }
      let estadoValidacion = v.estadoValidacion;
      if (v.ok && archivosSinModificar && estadoValidacion === 'OK') {
        estadoValidacion = 'OK con avisos';
      }
      return {
        tipo: p.tipo,
        clave: p.clave,
        reporte: p.reporte,
        Prefijo: p.Prefijo,
        NoFactura: p.NoFactura,
        procesoEnvio: p.procesoEnvio,
        listo: p.listo,
        ok: v.ok,
        estadoValidacion,
        errors: v.errors,
        warnings,
        detalle: v.detalle,
        archivosSinModificar,
        jsonSinModificar: archivosSinModificar,
        xmlSinModificar,
        mensajeSinModificar,
      };
    });

    const resumen = {
      total: items.length,
      ok: items.filter((i) => i.ok && i.estadoValidacion === 'OK').length,
      okConAvisos: items.filter((i) => i.ok && i.estadoValidacion === 'OK con avisos').length,
      conErrores: items.filter((i) => !i.ok).length,
      jsonSinModificar: items.filter((i) => i.archivosSinModificar).length,
      archivosSinModificar: items.filter((i) => i.archivosSinModificar).length,
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

    paquetes = paquetes.map((p) => {
      const n = normalizarRutasPaquete(documentoEmpresa, p);
      const esSin =
        String(n.tipo || '').toUpperCase() === 'SIN_FACTURA' ||
        /^SinFactura_/i.test(String(n.clave || ''));
      return {
        ...n,
        listo: esSin ? Boolean(n.rutaJson) : Boolean(n.rutaJson && n.rutaXml),
      };
    });

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

    const confirmarSinCambios = ['1', 'true', 'yes', 'on'].includes(
      String(req.body?.confirmarReenvioSinCambios || '').trim().toLowerCase()
    );

    const items = await enviarPaquetesLista(documentoEmpresa, paquetes, { confirmarSinCambios });
    const resumen = {
      total: items.length + omitidos.length,
      ok: items.filter((i) => i.estado === 'Enviado OK').length,
      rechazados: items.filter((i) => i.estado === 'Rechazado').length,
      errores: items.filter((i) => i.estado === 'Error' || i.estado === 'Error HTTP').length,
      omitidosPrevalidacion: omitidos.length,
      omitidosCuv: items.filter((i) => i.estado === 'Omitido' && /CUV/i.test(String(i.detalle || ''))).length,
      omitidosSinModificar: items.filter((i) => i.advertenciaSinModificar).length,
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

function itemRutasDesdeRequest(params) {
  const clave = String(params.clave || '').trim();
  const reporte = String(params.reporte || '').trim();
  const modo = String(params.modo || '').trim().toLowerCase();
  const prefijo = String(params.prefijo || params.Prefijo || '').trim();
  const folioRaw = params.folio != null ? params.folio : params.NoFactura;
  return {
    clave,
    reporte: reporte || undefined,
    tipo: modo === 'sin_factura' || /^SinFactura_/i.test(clave) ? 'SIN_FACTURA' : 'CON_FACTURA',
    Prefijo: prefijo || undefined,
    NoFactura: folioRaw != null && String(folioRaw).trim() !== '' ? folioRaw : undefined,
    rutaJson: params.rutaJson || undefined,
    rutaXml: params.rutaXml || undefined,
  };
}

/**
 * GET /RIPS/fevrips/rutas-archivos/:clave?documentoEmpresa=&reporte=&modo=
 * Rutas absolutas del JSON/XML del paquete en disco.
 */
router.get('/fevrips/rutas-archivos/:clave', (req, res) => {
  try {
    const clave = String(req.params.clave || '').trim();
    const documentoEmpresa = String(req.query.documentoEmpresa || '').trim();
    if (!clave) return res.status(400).json({ message: 'clave requerida' });
    if (!documentoEmpresa) return res.status(400).json({ message: 'documentoEmpresa requerido' });

    const item = itemRutasDesdeRequest({ clave, ...req.query });
    const rutas = resolverRutasPaquete(documentoEmpresa, item);
    res.json(rutas);
  } catch (err) {
    res.status(500).json({ message: err.message || String(err) });
  }
});

/**
 * POST /RIPS/fevrips/abrir-carpeta
 * Abre el explorador de archivos en la PC del servidor (JSON, XML o ambos).
 */
router.post('/fevrips/abrir-carpeta', async (req, res) => {
  let rutas = null;
  try {
    const body = req.body || {};
    const clave = String(body.clave || '').trim();
    const documentoEmpresa = String(body.documentoEmpresa || '').trim();
    const destino = String(body.destino || 'json_xml').trim().toLowerCase();
    if (!clave) return res.status(400).json({ message: 'clave requerida' });
    if (!documentoEmpresa) return res.status(400).json({ message: 'documentoEmpresa requerido' });

    const item = itemRutasDesdeRequest({ clave, ...body });
    rutas = resolverRutasPaquete(documentoEmpresa, item);
    const opened = await abrirCarpetasPaquete(rutas, destino);
    res.json({ ok: true, opened, rutas });
  } catch (err) {
    res.status(500).json({ message: err.message || String(err), rutas });
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

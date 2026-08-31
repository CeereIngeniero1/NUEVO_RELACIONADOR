/**
 * Facturas con RIPS en rango + estado XML en caché empresa + JSON empaquetado si existe.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { getRipsDataRoot } = require('../config/paths');
const { claveXml, existeXmlEmpresa, rutaXmlEmpresa } = require('./xmlCache');
const { cuvValido } = require('./fevripsCuvExistente');

function envioRoot() {
  return path.join(getRipsDataRoot(), 'ARCHIVOS_DE_ENVIO');
}

function jsonRoot() {
  return path.join(getRipsDataRoot(), 'ARCHIVOS_RIPS_JSON');
}

function safeWalkFiles(dir, predicate, acc = [], depth = 0) {
  if (depth > 6 || !fs.existsSync(dir)) return acc;
  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch (_) {
    return acc;
  }
  for (const name of entries) {
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(full);
    } catch (_) {
      continue;
    }
    if (st.isDirectory()) safeWalkFiles(full, predicate, acc, depth + 1);
    else if (predicate(name, full)) acc.push(full);
  }
  return acc;
}

/**
 * Busca JSON empaquetado o en lotes JSON para una clave (FE16196).
 * @returns {{ rutaJson: string|null, reporte: string|null, origen: string|null }}
 */
function encontrarJsonParaClave(clave) {
  const base = String(clave || '').replace(/\.json$/i, '');
  if (!base) return { rutaJson: null, reporte: null, origen: null };

  const envio = envioRoot();
  if (fs.existsSync(envio)) {
    for (const rep of fs.readdirSync(envio)) {
      const cand = path.join(envio, rep, 'CON_FACTURA', base, `${base}.json`);
      if (fs.existsSync(cand)) {
        return { rutaJson: cand, reporte: rep, origen: 'ARCHIVOS_DE_ENVIO' };
      }
    }
  }

  const hits = safeWalkFiles(jsonRoot(), (name) => name.toLowerCase() === `${base.toLowerCase()}.json`);
  if (hits.length) {
    const rutaJson = hits[0];
    const lote = path.basename(path.dirname(rutaJson));
    return {
      rutaJson,
      reporte: lote.startsWith('REPORTE') ? lote : `REPORTE (${lote})`,
      origen: 'ARCHIVOS_RIPS_JSON',
    };
  }

  return { rutaJson: null, reporte: null, origen: null };
}

/**
 * Localiza JSON SinFactura por clave (nombre archivo sin .json) y reporte opcional.
 */
function encontrarJsonSinFactura(clave, reportePreferido) {
  const base = String(clave || '').replace(/\.json$/i, '');
  if (!base) return { rutaJson: null, reporte: null, origen: null };

  const envio = envioRoot();
  const reps = [];
  if (reportePreferido && fs.existsSync(path.join(envio, reportePreferido))) {
    reps.push(reportePreferido);
  }
  if (fs.existsSync(envio)) {
    for (const rep of fs.readdirSync(envio)) {
      if (!reps.includes(rep)) reps.push(rep);
    }
  }

  for (const rep of reps) {
    const sinDir = path.join(envio, rep, 'SIN_FACTURA');
    if (!fs.existsSync(sinDir)) continue;
    const hits = safeWalkFiles(sinDir, (name) => name.toLowerCase() === `${base.toLowerCase()}.json`, [], 0);
    if (hits.length) {
      return { rutaJson: hits[0], reporte: rep, origen: 'SIN_FACTURA' };
    }
  }

  const hitsJson = safeWalkFiles(jsonRoot(), (name) => name.toLowerCase() === `${base.toLowerCase()}.json`);
  if (hitsJson.length) {
    const rutaJson = hitsJson[0];
    const lote = path.basename(path.dirname(rutaJson));
    return {
      rutaJson,
      reporte: lote.startsWith('REPORTE') ? lote : `REPORTE (${lote})`,
      origen: 'ARCHIVOS_RIPS_JSON',
    };
  }

  return { rutaJson: null, reporte: null, origen: null };
}

async function listarFacturasConEstadoXml(documentoEmpresa, fechaInicio, fechaFin) {
  const { sql, poolPromise } = require('../db2');
  const pool = await poolPromise;
  const fi = String(fechaInicio).slice(0, 10);
  const ff = String(fechaFin).slice(0, 10);
  const doc = String(documentoEmpresa).trim();

  const colCheck = await pool.request().query(`
    SELECT
      COL_LENGTH(N'dbo.Evaluación Entidad Rips', N'Enviado FevRips') AS Enviado,
      COL_LENGTH(N'dbo.Evaluación Entidad Rips', N'CUV FevRips') AS Cuv
  `);
  const tieneColsFev = Boolean(colCheck.recordset?.[0]?.Enviado && colCheck.recordset?.[0]?.Cuv);

  const selectEnv = tieneColsFev
    ? `
        ISNULL(Env.EnviadoFevRips, 0) AS EnviadoFevRips,
        Env.CuvFevRips AS CuvFevRips,
        Env.FechaEnvioFevRips AS FechaEnvioFevRips
      `
    : `
        CAST(0 AS INT) AS EnviadoFevRips,
        CAST(NULL AS NVARCHAR(100)) AS CuvFevRips,
        CAST(NULL AS DATETIME2) AS FechaEnvioFevRips
      `;

  const applyEnv = tieneColsFev
    ? `
      OUTER APPLY (
        SELECT
          MAX(CAST(ISNULL(RIPS.[Enviado FevRips], 0) AS INT)) AS EnviadoFevRips,
          MAX(RIPS.[CUV FevRips]) AS CuvFevRips,
          MAX(RIPS.[Fecha Envio FevRips]) AS FechaEnvioFevRips
        FROM [Evaluación Entidad Rips] RIPS
        WHERE RIPS.[Id Factura] = Fac.[Id Factura]
      ) Env
      `
    : '';

  const result = await pool
    .request()
    .input('FechaInicial', sql.Date, new Date(fi))
    .input('FechaFinal', sql.Date, new Date(ff))
    .input('DocumentoEmpresa', sql.NVarChar(50), doc)
    .query(`
      SELECT
        Fac.[Id Factura] AS IdFactura,
        Fac.[No Factura] AS NoFactura,
        CONVERT(varchar(10), Fac.[Fecha Factura], 23) AS FechaFactura,
        EmpV.[Prefijo Resolución Facturación EmpresaV] AS Prefijo,
        ${selectEnv}
      FROM Factura Fac
      INNER JOIN EmpresaV EmpV ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
      INNER JOIN Empresa Emp ON EmpV.[Documento Empresa] = Emp.[Documento Empresa]
      ${applyEnv}
      WHERE Fac.EstadoFacturaElectronica >= 1
        AND CAST(Fac.[Fecha Factura] AS DATE) BETWEEN @FechaInicial AND @FechaFinal
        AND Emp.[Documento Empresa] = @DocumentoEmpresa
        AND EXISTS (
          SELECT 1 FROM [Evaluación Entidad Rips] RIPS
          WHERE RIPS.[Id Factura] = Fac.[Id Factura]
        )
      ORDER BY Fac.[Fecha Factura], Fac.[No Factura]
    `);

  const root = getRipsDataRoot();
  const items = (result.recordset || []).map((row) => {
    const prefijo = String(row.Prefijo || '').trim();
    const noFactura = row.NoFactura;
    const clave = claveXml(prefijo, noFactura);
    const xmlPath = existeXmlEmpresa(root, doc, prefijo, noFactura);
    const jsonInfo = encontrarJsonParaClave(clave);
    const tieneXml = Boolean(xmlPath);
    const tieneJson = Boolean(jsonInfo.rutaJson);
    const enviadoBd = Number(row.EnviadoFevRips || 0) === 1;
    const cuvBd = row.CuvFevRips || null;
    let estadoUi = !tieneXml ? 'Sin XML' : !tieneJson ? 'Sin JSON' : 'Listo';
    if (enviadoBd || cuvValido(cuvBd)) estadoUi = 'Enviado OK';
    return {
      tipo: 'CON_FACTURA',
      procesoEnvio: 'Factura Electrónica de Venta',
      endpoint: 'CargarFevRips',
      idFactura: row.IdFactura,
      Prefijo: prefijo,
      NoFactura: noFactura,
      clave,
      FechaFactura: row.FechaFactura,
      tieneXml,
      rutaXml: xmlPath || rutaXmlEmpresa(root, doc, prefijo, noFactura),
      tieneJson,
      rutaJson: jsonInfo.rutaJson,
      reporte: jsonInfo.reporte,
      origenJson: jsonInfo.origen,
      listo: tieneXml && tieneJson,
      estadoXml: tieneXml ? 'XML descargado' : 'Sin XML',
      estadoJson: tieneJson ? 'JSON listo' : 'JSON pendiente (se arma al generar/empaquetar)',
      enviadoFevRips: enviadoBd,
      cuvFevRips: cuvBd,
      fechaEnvioFevRips: row.FechaEnvioFevRips || null,
      estadoUi,
    };
  });

  const dashboard = {
    total: items.length,
    conXml: items.filter((i) => i.tieneXml).length,
    sinXml: items.filter((i) => !i.tieneXml).length,
    conJson: items.filter((i) => i.tieneJson).length,
    sinJson: items.filter((i) => !i.tieneJson).length,
    listos: items.filter((i) => i.listo && !i.enviadoFevRips).length,
    conFactura: items.length,
    sinFactura: 0,
    enviadosOk: items.filter((i) => i.enviadoFevRips).length,
    rechazados: 0,
    pendientes: items.filter((i) => !i.listo).length,
  };

  return {
    items,
    dashboard,
    fechaInicio: fi,
    fechaFin: ff,
    documentoEmpresa: doc,
    columnasFevRips: tieneColsFev,
  };
}

function extractFechasFromName(nombre) {
  const m = String(nombre || '').match(/(\d{4}-\d{2}-\d{2})\s*---\s*(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  return { fechaInicio: m[1], fechaFin: m[2] };
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

/**
 * RIPS sin factura empaquetados / en lotes JSON cuyo nombre de carpeta solapa el rango.
 */
function listarSinFacturaPorRango(fechaInicio, fechaFin) {
  const fi = String(fechaInicio || '').slice(0, 10);
  const ff = String(fechaFin || '').slice(0, 10);
  const items = [];
  const seen = new Set();

  const pushItem = (clave, rutaJson, reporte, fechaInicioLote, fechaFinLote) => {
    const key = `${reporte}||${clave}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      tipo: 'SIN_FACTURA',
      procesoEnvio: 'Rips Sin Factura',
      endpoint: 'CargarRipsSinFactura',
      clave,
      Prefijo: '',
      NoFactura: '',
      FechaFactura: fechaInicioLote || null,
      fechaInicioLote: fechaInicioLote || null,
      fechaFinLote: fechaFinLote || null,
      tieneXml: false,
      rutaXml: null,
      tieneJson: true,
      rutaJson,
      reporte,
      origenJson: 'SIN_FACTURA',
      listo: true,
      estadoXml: 'N/A',
      estadoJson: 'JSON listo',
      estadoUi: 'Listo',
    });
  };

  const envio = envioRoot();
  if (fs.existsSync(envio)) {
    for (const rep of fs.readdirSync(envio)) {
      const fechas = extractFechasFromName(rep);
      if (fi && ff && fechas && !rangesOverlap(fechas.fechaInicio, fechas.fechaFin, fi, ff)) {
        continue;
      }
      if (fi && ff && !fechas) continue;
      const sinDir = path.join(envio, rep, 'SIN_FACTURA');
      if (!fs.existsSync(sinDir)) continue;
      for (const sub of fs.readdirSync(sinDir)) {
        const subPath = path.join(sinDir, sub);
        if (!fs.statSync(subPath).isDirectory()) continue;
        for (const f of fs.readdirSync(subPath)) {
          if (!/^SinFactura_/i.test(f) || !f.toLowerCase().endsWith('.json')) continue;
          const clave = path.basename(f, '.json');
          pushItem(
            clave,
            path.join(subPath, f),
            rep,
            fechas?.fechaInicio,
            fechas?.fechaFin
          );
        }
      }
    }
  }

  const jsonBase = jsonRoot();
  if (fs.existsSync(jsonBase)) {
    for (const lote of fs.readdirSync(jsonBase)) {
      const fechas = extractFechasFromName(lote);
      if (fi && ff && fechas && !rangesOverlap(fechas.fechaInicio, fechas.fechaFin, fi, ff)) {
        continue;
      }
      if (fi && ff && !fechas) continue;
      const lotePath = path.join(jsonBase, lote);
      if (!fs.statSync(lotePath).isDirectory()) continue;
      for (const f of fs.readdirSync(lotePath)) {
        if (!/^SinFactura_/i.test(f) || !f.toLowerCase().endsWith('.json')) continue;
        const clave = path.basename(f, '.json');
        const reporte = `REPORTE (${lote})`;
        pushItem(clave, path.join(lotePath, f), reporte, fechas?.fechaInicio, fechas?.fechaFin);
      }
    }
  }

  const dashboard = {
    total: items.length,
    conXml: 0,
    sinXml: 0,
    conJson: items.length,
    sinJson: 0,
    listos: items.length,
    conFactura: 0,
    sinFactura: items.length,
    enviadosOk: 0,
    rechazados: 0,
    pendientes: 0,
  };

  return { items, dashboard, fechaInicio: fi, fechaFin: ff };
}

module.exports = {
  encontrarJsonParaClave,
  encontrarJsonSinFactura,
  listarFacturasConEstadoXml,
  listarSinFacturaPorRango,
};

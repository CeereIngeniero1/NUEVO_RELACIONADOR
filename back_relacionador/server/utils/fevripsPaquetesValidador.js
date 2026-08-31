/**
 * Copia XML + JSON por factura a PAQUETES_VALIDADOR/{empresa}/{clave}/
 * para cargar manualmente en el validador MinSalud.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { getRipsDataRoot } = require('../config/paths');
const { claveXml, existeXmlEmpresa } = require('./xmlCache');
const { encontrarJsonParaClave, encontrarJsonSinFactura } = require('./fevripsFacturasXml');

function esSinFacturaItem(item) {
  const tipo = String(item?.tipo || '').toUpperCase();
  if (tipo === 'SIN_FACTURA') return true;
  return /^SinFactura_/i.test(String(item?.clave || ''));
}

function rootValidador() {
  return path.join(getRipsDataRoot(), 'PAQUETES_VALIDADOR');
}

function dirPaqueteValidador(documentoEmpresa, clave) {
  const doc = String(documentoEmpresa || 'SIN_EMPRESA').trim() || 'SIN_EMPRESA';
  const key = String(clave || '').trim();
  return path.join(rootValidador(), doc, key);
}

function resolverRutasOrigen(documentoEmpresa, item) {
  const prefijo = String(item.Prefijo || item.prefijo || '').trim();
  const no = item.NoFactura != null ? item.NoFactura : item.folio;
  const clave = String(item.clave || claveXml(prefijo, no)).trim();
  const root = getRipsDataRoot();

  if (esSinFacturaItem({ ...item, clave })) {
    const reporte = String(item.reporte || '').trim();
    const jsonInfo = encontrarJsonSinFactura(clave, reporte || null);
    return {
      clave,
      rutaJson: jsonInfo.rutaJson,
      rutaXml: null,
      reporte: jsonInfo.reporte,
      origenJson: jsonInfo.origen,
      sinFactura: true,
    };
  }

  const jsonInfo = encontrarJsonParaClave(clave);
  let rutaJson = jsonInfo.rutaJson;

  let rutaXml =
    prefijo || no != null ? existeXmlEmpresa(root, documentoEmpresa, prefijo, no) : null;

  if (!rutaXml && jsonInfo.rutaJson) {
    const side = path.join(path.dirname(jsonInfo.rutaJson), `${clave}.xml`);
    if (fs.existsSync(side)) rutaXml = side;
  }

  if (!rutaXml && jsonInfo.reporte) {
    const cand = path.join(
      getRipsDataRoot(),
      'ARCHIVOS_DE_ENVIO',
      jsonInfo.reporte,
      'CON_FACTURA',
      clave,
      `${clave}.xml`
    );
    if (fs.existsSync(cand)) rutaXml = cand;
  }

  return {
    clave,
    rutaJson,
    rutaXml,
    reporte: jsonInfo.reporte,
    origenJson: jsonInfo.origen,
    sinFactura: false,
  };
}

/**
 * @returns {{ clave, ok, rutaDir, rutaJson, rutaXml, errores: string[] }}
 */
function exportarPaqueteValidador(documentoEmpresa, item) {
  const { clave, rutaJson, rutaXml, sinFactura } = resolverRutasOrigen(documentoEmpresa, item);
  const errores = [];
  const destDir = dirPaqueteValidador(documentoEmpresa, clave);
  const destJson = path.join(destDir, `${clave}.json`);
  const destXml = path.join(destDir, `${clave}.xml`);

  if (!clave) {
    return {
      clave: '',
      ok: false,
      sinFactura: Boolean(sinFactura),
      rutaDir: destDir,
      rutaJson: null,
      rutaXml: null,
      errores: ['Clave vacía'],
    };
  }
  if (!rutaJson || !fs.existsSync(rutaJson)) {
    errores.push('JSON no encontrado');
  }
  if (!sinFactura && (!rutaXml || !fs.existsSync(rutaXml))) {
    errores.push('XML no encontrado');
  }
  if (errores.length) {
    return {
      clave,
      ok: false,
      sinFactura: Boolean(sinFactura),
      rutaDir: destDir,
      rutaJson: null,
      rutaXml: null,
      errores,
    };
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(rutaJson, destJson);
  if (!sinFactura && rutaXml) {
    fs.copyFileSync(rutaXml, destXml);
  }

  return {
    clave,
    ok: true,
    sinFactura: Boolean(sinFactura),
    rutaDir: destDir,
    rutaJson: destJson,
    rutaXml: sinFactura ? null : destXml,
    errores: [],
  };
}

function exportarPaquetesValidador(documentoEmpresa, items) {
  const list = Array.isArray(items) ? items : [];
  const resultados = list.map((it) => exportarPaqueteValidador(documentoEmpresa, it));
  return {
    root: rootValidador(),
    documentoEmpresa,
    total: resultados.length,
    ok: resultados.filter((r) => r.ok).length,
    fallidos: resultados.filter((r) => !r.ok).length,
    items: resultados,
  };
}

function infoPaqueteValidador(documentoEmpresa, clave, item = null) {
  const key = String(clave || '').trim();
  const sinFactura = esSinFacturaItem(item || { clave: key });
  const destDir = dirPaqueteValidador(documentoEmpresa, key);
  const destJson = path.join(destDir, `${key}.json`);
  const destXml = path.join(destDir, `${key}.xml`);
  const tieneJson = fs.existsSync(destJson);
  const tieneXml = fs.existsSync(destXml);
  const listo = sinFactura ? tieneJson : tieneJson && tieneXml;
  return {
    clave: key,
    documentoEmpresa,
    sinFactura,
    root: rootValidador(),
    rutaDir: destDir,
    rutaJson: tieneJson ? destJson : null,
    rutaXml: tieneXml ? destXml : null,
    listo,
  };
}

module.exports = {
  rootValidador,
  dirPaqueteValidador,
  esSinFacturaItem,
  exportarPaqueteValidador,
  exportarPaquetesValidador,
  infoPaqueteValidador,
};

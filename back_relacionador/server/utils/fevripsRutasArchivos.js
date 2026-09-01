/**
 * Resuelve rutas JSON/XML de un paquete y abre el explorador de archivos (servidor local).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { getRipsDataRoot } = require('../config/paths');
const { encontrarJsonParaClave, encontrarJsonSinFactura } = require('./fevripsFacturasXml');
const { existeXmlEmpresa } = require('./xmlCache');

const execFileAsync = promisify(execFile);

function esSinFacturaItem(item) {
  const tipo = String(item?.tipo || '').toUpperCase();
  if (tipo === 'SIN_FACTURA') return true;
  return /^SinFactura_/i.test(String(item?.clave || ''));
}

function assertUnderRipsRoot(absPath) {
  if (!absPath) return;
  const root = path.resolve(getRipsDataRoot());
  const normalized = path.resolve(absPath);
  if (normalized !== root && !normalized.startsWith(`${root}${path.sep}`)) {
    throw new Error('Ruta fuera del directorio RIPS permitido');
  }
}

function prefijoFolioDesdeClave(clave) {
  const m = String(clave || '').match(/^([A-Za-z]+)(\d+)$/);
  if (!m) return { prefijo: '', folio: null };
  return { prefijo: m[1], folio: m[2] };
}

function resolverRutasPaquete(documentoEmpresa, item) {
  const clave = String(item?.clave || '').trim();
  const reporte = String(item?.reporte || '').trim();
  const desdeClave = prefijoFolioDesdeClave(clave);
  const prefijo = String(item?.Prefijo || item?.prefijo || desdeClave.prefijo || '').trim();
  const no =
    item?.NoFactura != null && item?.NoFactura !== ''
      ? item.NoFactura
      : item?.folio != null && item?.folio !== ''
        ? item.folio
        : desdeClave.folio;
  const root = getRipsDataRoot();
  const esSin = esSinFacturaItem(item);

  let rutaJson = item?.rutaJson || null;
  let rutaXml = item?.rutaXml || null;
  let origenJson = null;

  if (esSin) {
    if (!rutaJson || !fs.existsSync(rutaJson)) {
      const j = encontrarJsonSinFactura(clave, reporte || null);
      rutaJson = j.rutaJson;
      origenJson = j.origen;
    }
  } else {
    if (!rutaJson || !fs.existsSync(rutaJson)) {
      const j = encontrarJsonParaClave(clave);
      rutaJson = j.rutaJson;
      origenJson = j.origen;
    }
    if (!rutaXml || !fs.existsSync(rutaXml)) {
      rutaXml =
        (prefijo || no != null) && documentoEmpresa
          ? existeXmlEmpresa(root, documentoEmpresa, prefijo, no)
          : null;
      if (!rutaXml && rutaJson) {
        const side = path.join(path.dirname(rutaJson), `${clave}.xml`);
        if (fs.existsSync(side)) rutaXml = side;
      }
    }
  }

  if (rutaJson) assertUnderRipsRoot(rutaJson);
  if (rutaXml) assertUnderRipsRoot(rutaXml);

  const jsonOk = Boolean(rutaJson && fs.existsSync(rutaJson));
  const xmlOk = Boolean(rutaXml && fs.existsSync(rutaXml));

  return {
    clave,
    reporte: reporte || null,
    tipo: esSin ? 'SIN_FACTURA' : 'CON_FACTURA',
    rutaJson: jsonOk ? path.resolve(rutaJson) : null,
    rutaXml: xmlOk ? path.resolve(rutaXml) : null,
    carpetaJson: jsonOk ? path.dirname(path.resolve(rutaJson)) : null,
    carpetaXml: xmlOk ? path.dirname(path.resolve(rutaXml)) : null,
    nombreJson: jsonOk ? path.basename(rutaJson) : null,
    nombreXml: xmlOk ? path.basename(rutaXml) : null,
    origenJson,
    tieneJson: jsonOk,
    tieneXml: xmlOk,
    mismaCarpeta: jsonOk && xmlOk && path.dirname(rutaJson) === path.dirname(rutaXml),
  };
}

async function abrirEnExplorador(archivoAbsoluto) {
  assertUnderRipsRoot(archivoAbsoluto);
  const normalized = path.resolve(archivoAbsoluto);
  if (!fs.existsSync(normalized)) {
    throw new Error(`Archivo no encontrado: ${normalized}`);
  }
  if (process.platform === 'win32') {
    await execFileAsync('explorer.exe', [`/select,${normalized}`], { windowsHide: true });
    return;
  }
  if (process.platform === 'darwin') {
    await execFileAsync('open', ['-R', normalized]);
    return;
  }
  await execFileAsync('xdg-open', [path.dirname(normalized)]);
}

async function abrirCarpetasPaquete(rutas, destino = 'json_xml') {
  const dest = String(destino || 'json_xml').toLowerCase();
  const opened = [];

  if ((dest === 'json' || dest === 'json_xml') && rutas.rutaJson) {
    await abrirEnExplorador(rutas.rutaJson);
    opened.push('json');
  }
  if ((dest === 'xml' || dest === 'json_xml') && rutas.rutaXml) {
    if (dest === 'json_xml' && opened.length) {
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
    await abrirEnExplorador(rutas.rutaXml);
    opened.push('xml');
  }
  if (!opened.length) {
    throw new Error('No se encontraron archivos JSON/XML para abrir en el explorador');
  }
  return opened;
}

/**
 * Alinea rutaJson/rutaXml con las mismas reglas de envío (XMLS primero, luego copia junto al JSON).
 */
function normalizarRutasPaquete(documentoEmpresa, item) {
  const rutas = resolverRutasPaquete(documentoEmpresa, item);
  return {
    ...item,
    rutaJson: rutas.rutaJson || item?.rutaJson || null,
    rutaXml: rutas.rutaXml || item?.rutaXml || null,
  };
}

module.exports = {
  prefijoFolioDesdeClave,
  resolverRutasPaquete,
  normalizarRutasPaquete,
  abrirEnExplorador,
  abrirCarpetasPaquete,
  esSinFacturaItem,
};

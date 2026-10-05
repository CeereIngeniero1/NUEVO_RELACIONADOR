/**
 * Alinea numFactura del RIPS JSON con el número que trae el XML de la FEV
 * (evita RVC004 cuando uno trae ceros a la izquierda y el otro no: FEVP0945 vs FEVP945).
 */
'use strict';

const fs = require('fs');

function normalizarClave(numFactura) {
  const s = String(numFactura || '').replace(/\s/g, '');
  const m = s.match(/^([A-Za-z]+)0*(\d+)$/);
  if (m) return `${m[1]}${parseInt(m[2], 10)}`;
  if (/^\d+$/.test(s)) return String(parseInt(s, 10));
  return s;
}

/** AttachedDocument → ParentDocumentID; Invoice directo → primer cbc:ID fuera de UBLExtensions. */
function leerNumFacturaDeXmlTexto(xml) {
  if (!xml) return null;
  const texto = String(xml).replace(/<ext:UBLExtensions[\s\S]*?<\/ext:UBLExtensions>/gi, '');
  const parent = texto.match(/<cbc:ParentDocumentID[^>]*>\s*([^<\s]+)\s*</i);
  if (parent) return parent[1];
  const id = texto.match(/<cbc:ID[^>]*>\s*([^<\s]+)\s*</i);
  return id ? id[1] : null;
}

function leerNumFacturaXml(xmlPath) {
  try {
    if (!xmlPath || !fs.existsSync(xmlPath)) return null;
    return leerNumFacturaDeXmlTexto(fs.readFileSync(xmlPath, 'utf8'));
  } catch (_) {
    return null;
  }
}

/**
 * Devuelve el RIPS con numFactura igual al del XML (solo si es la misma factura
 * salvo ceros a la izquierda). Si no aplica, devuelve el mismo objeto.
 */
function alinearRipsConXml(rips, xmlPath) {
  if (!rips || typeof rips !== 'object' || !rips.numFactura) return rips;
  const numXml = leerNumFacturaXml(xmlPath);
  if (!numXml || rips.numFactura === numXml) return rips;
  if (normalizarClave(rips.numFactura) !== normalizarClave(numXml)) return rips;
  return { ...rips, numFactura: numXml };
}

/** Reescribe en disco el JSON si su numFactura difiere del XML. @returns {boolean} si cambió */
function alinearArchivoJsonConXml(jsonPath, xmlPath) {
  try {
    if (!jsonPath || !fs.existsSync(jsonPath)) return false;
    const raw = fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '');
    const rips = JSON.parse(raw);
    const alineado = alinearRipsConXml(rips, xmlPath);
    if (alineado === rips) return false;
    fs.writeFileSync(jsonPath, JSON.stringify(alineado, null, 2), 'utf8');
    console.log(`[numFactura] ${rips.numFactura} → ${alineado.numFactura} (según XML) en ${jsonPath}`);
    return true;
  } catch (err) {
    console.warn('[numFactura] No se pudo alinear JSON con XML:', jsonPath, err.message || err);
    return false;
  }
}

module.exports = {
  normalizarClave,
  leerNumFacturaDeXmlTexto,
  leerNumFacturaXml,
  alinearRipsConXml,
  alinearArchivoJsonConXml,
};

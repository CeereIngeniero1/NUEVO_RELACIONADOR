/**
 * Huellas SHA-256 de JSON/XML enviados para detectar reenvíos sin corrección.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');

function esEstadoFallidoEnvio(estado) {
  const e = String(estado || '').trim();
  return e === 'Rechazado' || e === 'Error' || e === 'Error HTTP' || e === 'Desconocido';
}

function esSinFacturaPaquete(paquete) {
  const tipo = String(paquete?.tipo || '').toUpperCase();
  if (tipo === 'SIN_FACTURA') return true;
  return /^SinFactura_/i.test(String(paquete?.clave || ''));
}

function hashArchivo(ruta) {
  if (!ruta || !fs.existsSync(ruta)) return null;
  try {
    const buf = fs.readFileSync(ruta);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch (_) {
    return null;
  }
}

function mtimeMs(ruta) {
  if (!ruta || !fs.existsSync(ruta)) return null;
  try {
    return fs.statSync(ruta).mtimeMs;
  } catch (_) {
    return null;
  }
}

/**
 * Huella del contenido actual en disco (JSON obligatorio; XML si existe).
 */
function huellaPaqueteEnDisco(paquete) {
  const rutaJson = paquete?.rutaJson || null;
  const rutaXml = paquete?.rutaXml || null;
  return {
    jsonHash: hashArchivo(rutaJson),
    xmlHash: rutaXml ? hashArchivo(rutaXml) : null,
    rutaJson,
    rutaXml,
    jsonMtimeMs: mtimeMs(rutaJson),
    xmlMtimeMs: rutaXml ? mtimeMs(rutaXml) : null,
  };
}

function archivoSinCambioDesde(fechaFallo, mtimeArchivo) {
  if (!mtimeArchivo || !fechaFallo) return true;
  const ts = Date.parse(fechaFallo);
  if (Number.isNaN(ts)) return true;
  return mtimeArchivo <= ts + 2000;
}

/**
 * Compara huellas guardadas vs actuales (JSON y XML por separado).
 */
function compararHuellasEnvio(stored, actual, paquete) {
  const esSin = esSinFacturaPaquete(paquete);
  const out = {
    jsonIgual: false,
    xmlIgual: null,
    sinModificar: false,
    jsonModificado: false,
    xmlModificado: false,
  };

  if (!stored?.jsonHash || !actual?.jsonHash) {
    return out;
  }

  out.jsonIgual = stored.jsonHash === actual.jsonHash;
  out.jsonModificado = !out.jsonIgual;

  if (esSin) {
    out.sinModificar = out.jsonIgual;
    return out;
  }

  if (actual.xmlHash) {
    if (!stored.xmlHash) {
      out.xmlIgual = false;
      out.xmlModificado = true;
      out.sinModificar = false;
      return out;
    }
    out.xmlIgual = stored.xmlHash === actual.xmlHash;
    out.xmlModificado = !out.xmlIgual;
    out.sinModificar = out.jsonIgual && out.xmlIgual;
    return out;
  }

  out.sinModificar = out.jsonIgual;
  return out;
}

function huellasEquivalentes(stored, actual) {
  return compararHuellasEnvio(stored, actual, {}).sinModificar;
}

function mensajeSinModificar(ultimoEnvio, cmp) {
  const det = String(ultimoEnvio.detalle || '').trim();
  const fecha = ultimoEnvio.fecha || '—';
  const estado = ultimoEnvio.estado || 'error';
  const partes = [];
  if (cmp.jsonIgual) partes.push('JSON');
  if (cmp.xmlIgual) partes.push('XML');
  const archivos =
    partes.length === 2 ? 'El JSON y el XML' : partes.length === 1 ? `El ${partes[0]}` : 'Los archivos';

  if (det) {
    return `${archivos} no cambiaron desde el último ${estado} (${fecha}). Riesgo de repetir: ${det.slice(0, 120)}`;
  }
  return `${archivos} no cambiaron desde el último ${estado}. Corrija el RIPS (JSON y/o XML) antes de reenviar.`;
}

function mensajeHeuristicaSinModificar(ultimoEnvio, actual) {
  const fecha = ultimoEnvio.fecha || '—';
  const estado = ultimoEnvio.estado || 'error';
  const jsonQuieto = archivoSinCambioDesde(ultimoEnvio.fecha, actual.jsonMtimeMs);
  const xmlQuieto = !actual.xmlMtimeMs || archivoSinCambioDesde(ultimoEnvio.fecha, actual.xmlMtimeMs);
  if (jsonQuieto && xmlQuieto) {
    if (actual.xmlMtimeMs) {
      return `El JSON y el XML no parecen haberse modificado después del último ${estado} (${fecha}). Verifique y corrija antes de reenviar.`;
    }
    return `El JSON no parece haberse modificado después del último ${estado} (${fecha}). Verifique y corrija antes de reenviar.`;
  }
  return null;
}

/**
 * Compara paquete actual con el último envío fallido guardado.
 * @returns {{ sinModificar: boolean, jsonSinModificar?: boolean, xmlSinModificar?: boolean|null, mensaje?: string, ultimoEstado?: string, ultimaFecha?: string }}
 */
function evaluarReenvioSinCambios(paquete, ultimoEnvio) {
  if (!ultimoEnvio || !esEstadoFallidoEnvio(ultimoEnvio.estado)) {
    return { sinModificar: false };
  }

  let stored = ultimoEnvio.contenidoEnviado || null;
  if (!stored?.jsonHash && ultimoEnvio.archivo && fs.existsSync(ultimoEnvio.archivo)) {
    try {
      const data = JSON.parse(fs.readFileSync(ultimoEnvio.archivo, 'utf8'));
      stored = data.contenidoEnviado || null;
    } catch (_) {
      /* ignore */
    }
  }

  const actual = huellaPaqueteEnDisco(paquete);
  if (!actual.jsonHash) {
    return { sinModificar: false };
  }

  if (stored?.jsonHash) {
    const cmp = compararHuellasEnvio(stored, actual, paquete);
    if (cmp.sinModificar) {
      return {
        sinModificar: true,
        jsonSinModificar: cmp.jsonIgual,
        xmlSinModificar: cmp.xmlIgual,
        ultimoEstado: ultimoEnvio.estado,
        ultimaFecha: ultimoEnvio.fecha || null,
        mensaje: mensajeSinModificar(ultimoEnvio, cmp),
      };
    }
    return {
      sinModificar: false,
      jsonSinModificar: cmp.jsonIgual,
      xmlSinModificar: cmp.xmlIgual,
      jsonModificado: cmp.jsonModificado,
      xmlModificado: cmp.xmlModificado,
    };
  }

  // Resultados antiguos sin hash: heurística por mtime (JSON y XML)
  if (ultimoEnvio.fecha) {
    const jsonQuieto = archivoSinCambioDesde(ultimoEnvio.fecha, actual.jsonMtimeMs);
    const xmlQuieto = !actual.xmlMtimeMs || archivoSinCambioDesde(ultimoEnvio.fecha, actual.xmlMtimeMs);
    if (jsonQuieto && xmlQuieto) {
      const mensaje = mensajeHeuristicaSinModificar(ultimoEnvio, actual);
      if (mensaje) {
        return {
          sinModificar: true,
          jsonSinModificar: jsonQuieto,
          xmlSinModificar: actual.xmlMtimeMs ? xmlQuieto : null,
          ultimoEstado: ultimoEnvio.estado,
          ultimaFecha: ultimoEnvio.fecha,
          mensaje,
          heuristica: true,
        };
      }
    }
  }

  return { sinModificar: false };
}

module.exports = {
  esEstadoFallidoEnvio,
  esSinFacturaPaquete,
  hashArchivo,
  huellaPaqueteEnDisco,
  compararHuellasEnvio,
  huellasEquivalentes,
  evaluarReenvioSinCambios,
};

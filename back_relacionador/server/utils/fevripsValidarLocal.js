/**
 * Prevalidación local de paquetes FEV-RIPS (antes del envío al API Docker).
 * El MinSalud valida reglas de negocio en Cargar*; aquí solo integridad de archivos.
 */
'use strict';

const fs = require('fs');
const { esXmlVacioOInvalido } = require('./xmlCache');

function pushErr(errors, msg) {
  errors.push(msg);
}

function validarRipsJson(rips, tipo) {
  const errors = [];
  const warnings = [];
  if (!rips || typeof rips !== 'object' || Array.isArray(rips)) {
    pushErr(errors, 'JSON RIPS no es un objeto');
    return { ok: false, errors, warnings };
  }
  if (!rips.numDocumentoIdObligado) {
    pushErr(errors, 'Falta numDocumentoIdObligado');
  }
  if (!Array.isArray(rips.usuarios) || rips.usuarios.length === 0) {
    pushErr(errors, 'Falta usuarios[] o está vacío');
  } else {
    rips.usuarios.forEach((u, i) => {
      if (!u || typeof u !== 'object') {
        pushErr(errors, `usuarios[${i}] inválido`);
        return;
      }
      if (!u.numDocumentoIdentificacion) {
        pushErr(errors, `usuarios[${i}] sin numDocumentoIdentificacion`);
      }
      if (!u.servicios || typeof u.servicios !== 'object') {
        warnings.push(`usuarios[${i}] sin servicios`);
      }
    });
  }

  if (tipo === 'CON_FACTURA') {
    if (!rips.numFactura) {
      pushErr(errors, 'CON_FACTURA: falta numFactura');
    }
  } else if (tipo === 'SIN_FACTURA') {
    if (rips.numFactura != null && String(rips.numFactura).trim() !== '') {
      warnings.push('SIN_FACTURA: numFactura debería ir vacío/null');
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

function validarXmlContenido(xmlUtf8, clave) {
  const errors = [];
  const warnings = [];
  if (esXmlVacioOInvalido(xmlUtf8)) {
    pushErr(errors, 'XML vacío o inválido');
    return { ok: false, errors, warnings };
  }
  const s = String(xmlUtf8);
  const hasAttached = /AttachedDocument/i.test(s);
  const hasInvoice = /<(cac:)?Invoice\b/i.test(s) || /Invoice/i.test(s);
  if (!hasAttached && !hasInvoice) {
    warnings.push('XML no parece AttachedDocument/Invoice (revisar contenido)');
  }
  if (clave) {
    const claveNorm = String(clave).replace(/^([A-Za-z]+)0+(\d+)$/, (_, p, n) => `${p}${parseInt(n, 10)}`);
    // No exigir coincidencia estricta (el XML puede tener ceros a la izquierda)
    if (claveNorm.length >= 3 && !s.includes(claveNorm.replace(/^[A-Za-z]+/, '')) && !s.includes(clave)) {
      warnings.push('No se encontró referencia clara al número de factura en el XML');
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

/**
 * @param {object} paquete — item con rutaJson, rutaXml, tipo, clave
 */
function validarPaqueteLocal(paquete) {
  const errors = [];
  const warnings = [];
  let rips = null;

  if (!paquete?.rutaJson || !fs.existsSync(paquete.rutaJson)) {
    pushErr(errors, 'JSON ausente');
  } else {
    try {
      rips = JSON.parse(fs.readFileSync(paquete.rutaJson, 'utf8'));
      const vr = validarRipsJson(rips, paquete.tipo);
      errors.push(...vr.errors);
      warnings.push(...vr.warnings);
    } catch (e) {
      pushErr(errors, `JSON no parseable: ${e.message || e}`);
    }
  }

  if (paquete.tipo === 'CON_FACTURA') {
    if (!paquete.rutaXml || !fs.existsSync(paquete.rutaXml)) {
      pushErr(errors, 'XML ausente');
    } else {
      try {
        const xml = fs.readFileSync(paquete.rutaXml, 'utf8');
        const vx = validarXmlContenido(xml, paquete.clave);
        errors.push(...vx.errors);
        warnings.push(...vx.warnings);
      } catch (e) {
        pushErr(errors, `No se pudo leer XML: ${e.message || e}`);
      }
    }
  }

  if (rips && paquete.tipo === 'CON_FACTURA' && rips.numFactura && paquete.clave) {
    const nf = String(rips.numFactura).replace(/\s/g, '');
    const m = nf.match(/^([A-Za-z]+)0*(\d+)$/);
    const claveEsperada = m ? `${m[1]}${parseInt(m[2], 10)}` : nf;
    if (claveEsperada && paquete.clave !== claveEsperada && !paquete.clave.includes(String(parseInt(m?.[2] || '0', 10)))) {
      warnings.push(`Clave carpeta (${paquete.clave}) ≠ numFactura JSON (${rips.numFactura})`);
    }
  }

  const ok = errors.length === 0;
  return {
    ok,
    estadoValidacion: ok ? (warnings.length ? 'OK con avisos' : 'OK') : 'Con errores',
    errors,
    warnings,
    detalle: ok
      ? warnings.length
        ? warnings.slice(0, 4).join(' | ')
        : 'Prevalidación local OK'
      : errors.slice(0, 5).join(' | '),
  };
}

module.exports = {
  validarPaqueteLocal,
  validarRipsJson,
  validarXmlContenido,
};

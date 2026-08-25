/**
 * Caché estable de XML por empresa:
 *   RIPS_ROOT/XMLS/{documentoEmpresa}/{Prefijo}{folio}.xml
 * Ej: .../XMLS/900123/FE16196.xml
 *
 * Un XML vacío/inválido no se guarda; si ya existe en disco se elimina
 * para no bloquear una descarga posterior de la factura real.
 */
const fs = require('fs');
const path = require('path');

/** Tamaño mínimo razonable de un XML de factura electrónica (bytes UTF-8). */
const MIN_XML_BYTES = 80;

function sanitizeEmpresa(documentoEmpresa) {
  const s = String(documentoEmpresa || '')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.+$/g, '');
  return s || 'SIN_EMPRESA';
}

function claveXml(prefijo, folio) {
  const p = String(prefijo || '').trim();
  const n = parseInt(String(folio), 10);
  if (p && !Number.isNaN(n)) return `${p}${n}`;
  if (p && folio != null && folio !== '') return `${p}${folio}`;
  return String(folio || '');
}

function fileNameXml(prefijo, folio) {
  return `${claveXml(prefijo, folio)}.xml`;
}

function rutaDirEmpresa(ripsRoot, documentoEmpresa) {
  return path.join(ripsRoot, 'XMLS', sanitizeEmpresa(documentoEmpresa));
}

function rutaXmlEmpresa(ripsRoot, documentoEmpresa, prefijo, folio) {
  return path.join(rutaDirEmpresa(ripsRoot, documentoEmpresa), fileNameXml(prefijo, folio));
}

/**
 * true si el contenido no sirve como XML de factura (vacío, solo espacios, sin tags).
 */
function esXmlVacioOInvalido(contenido) {
  if (contenido == null) return true;
  const s = Buffer.isBuffer(contenido)
    ? contenido.toString('utf8')
    : String(contenido);
  const trimmed = s.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return true;
  if (Buffer.byteLength(trimmed, 'utf8') < MIN_XML_BYTES) return true;
  // Debe parecer XML: al menos un tag de apertura
  if (!/<[A-Za-z_?]/.test(trimmed)) return true;
  return false;
}

/**
 * Si el archivo existe pero está vacío/inválido, lo elimina y retorna true.
 * @returns {boolean} true si se eliminó (o no era usable)
 */
function eliminarSiXmlVacio(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return false;
    const st = fs.statSync(filePath);
    if (!st.isFile()) return false;
    if (st.size === 0 || st.size < MIN_XML_BYTES) {
      fs.unlinkSync(filePath);
      console.warn('[xmlCache] XML vacío eliminado:', filePath);
      return true;
    }
    const sampleSize = Math.min(st.size, 64 * 1024);
    let invalido = false;
    const fd = fs.openSync(filePath, 'r');
    try {
      const buf = Buffer.alloc(sampleSize);
      fs.readSync(fd, buf, 0, sampleSize, 0);
      invalido = esXmlVacioOInvalido(buf);
    } finally {
      fs.closeSync(fd);
    }
    if (invalido) {
      fs.unlinkSync(filePath);
      console.warn('[xmlCache] XML inválido eliminado:', filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[xmlCache] Error al validar/eliminar XML:', filePath, err.message || err);
    return false;
  }
}

function existeXmlEmpresa(ripsRoot, documentoEmpresa, prefijo, folio) {
  const p = rutaXmlEmpresa(ripsRoot, documentoEmpresa, prefijo, folio);
  if (!fs.existsSync(p)) return null;
  if (eliminarSiXmlVacio(p)) return null;
  return p;
}

/**
 * Guarda XML en carpeta empresa. Si el contenido está vacío/inválido,
 * no escribe (y elimina uno previo vacío) y lanza Error.
 * @returns {string} ruta guardada
 */
function guardarXmlEmpresa(ripsRoot, documentoEmpresa, prefijo, folio, contenidoUtf8) {
  const dir = rutaDirEmpresa(ripsRoot, documentoEmpresa);
  const dest = path.join(dir, fileNameXml(prefijo, folio));

  if (esXmlVacioOInvalido(contenidoUtf8)) {
    if (fs.existsSync(dest)) {
      try {
        fs.unlinkSync(dest);
      } catch (_) { /* ignore */ }
    }
    const err = new Error('XML vacío o inválido; no se guardó (se reintentará en otra descarga)');
    err.code = 'XML_VACIO';
    throw err;
  }

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dest, contenidoUtf8, { encoding: 'utf8' });

  if (eliminarSiXmlVacio(dest)) {
    const err = new Error('XML vacío tras guardar; archivo eliminado');
    err.code = 'XML_VACIO';
    throw err;
  }

  return dest;
}

/**
 * Resuelve path de XML en carpeta empresa a partir de nombre de archivo o clave.
 * @param {string} claveOrFile — "FE16196" o "FE16196.xml"
 */
function rutaXmlEmpresaPorClave(ripsRoot, documentoEmpresa, claveOrFile) {
  const base = String(claveOrFile || '').replace(/\.xml$/i, '');
  if (!base) return null;
  const p = path.join(rutaDirEmpresa(ripsRoot, documentoEmpresa), `${base}.xml`);
  if (!fs.existsSync(p)) return null;
  if (eliminarSiXmlVacio(p)) return null;
  return p;
}

module.exports = {
  sanitizeEmpresa,
  claveXml,
  fileNameXml,
  rutaDirEmpresa,
  rutaXmlEmpresa,
  esXmlVacioOInvalido,
  eliminarSiXmlVacio,
  existeXmlEmpresa,
  guardarXmlEmpresa,
  rutaXmlEmpresaPorClave,
  MIN_XML_BYTES,
};

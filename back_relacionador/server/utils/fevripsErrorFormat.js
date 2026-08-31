'use strict';

/**
 * Extrae mensaje legible de Error, AggregateError, cause, etc.
 */
function formatErrMessage(err, depth = 0) {
  if (err == null) return '';
  if (typeof err === 'string') return err.trim();
  if (depth > 4) return String(err.message || err);

  const parts = [];

  const push = (s) => {
    const t = String(s || '').trim();
    if (!t || t === 'AggregateError') return;
    if (!parts.includes(t)) parts.push(t);
  };

  push(err.message);
  if (err.code) push(String(err.code));

  if (Array.isArray(err.errors)) {
    for (const e of err.errors) {
      push(formatErrMessage(e, depth + 1));
    }
  }

  if (err.cause && err.cause !== err) {
    push(formatErrMessage(err.cause, depth + 1));
  }

  if (err.originalError && err.originalError !== err) {
    push(formatErrMessage(err.originalError, depth + 1));
  }

  if (parts.length) return parts.join(' · ');
  return String(err.message || err);
}

function resumenValidaciones(validaciones) {
  return detalleValidaciones(validaciones).map((v) => v.resumen).filter(Boolean);
}

function pickField(obj, names) {
  if (!obj || typeof obj !== 'object') return '';
  for (const n of names) {
    const val = obj[n];
    if (val != null && String(val).trim()) return String(val).trim();
  }
  return '';
}

/**
 * Estructura completa como el validador MinSalud (Descripción, Observaciones, PathFuente).
 */
function detalleValidaciones(validaciones) {
  const arr = Array.isArray(validaciones) ? validaciones : [];
  return arr.map((v) => {
    const codigo = pickField(v, ['Codigo', 'codigo', 'CodigoValidacion', 'codigoValidacion']);
    const descripcion = pickField(v, [
      'Descripcion',
      'descripcion',
      'Mensaje',
      'mensaje',
      'Description',
    ]);
    const observaciones = pickField(v, [
      'Observaciones',
      'observaciones',
      'Observacion',
      'observacion',
      'Detalle',
      'detalle',
    ]);
    const pathFuente = pickField(v, [
      'PathFuente',
      'pathFuente',
      'Path',
      'path',
      'Fuente',
      'fuente',
      'Campo',
      'campo',
    ]);
    const clase = pickField(v, ['Clase', 'clase', 'Tipo', 'tipo']);
    const resumen = [codigo, descripcion, clase].filter(Boolean).join(' — ');
    return {
      codigo,
      descripcion,
      observaciones,
      pathFuente,
      clase,
      resumen,
    };
  });
}

function formatResultDetalle(resultado) {
  const r = resultado && typeof resultado === 'object' ? resultado : {};
  if (r.ok && r.codigoUnicoValidacion) {
    return `CUV: ${r.codigoUnicoValidacion}`;
  }
  if (r.message && r.message !== 'AggregateError') return r.message;
  if (r.error && r.error !== 'AggregateError') return formatErrMessage(r.error);
  if (r.code) return String(r.code);

  const rechazos = r.rechazos || [];
  if (Array.isArray(rechazos) && rechazos.length) {
    return resumenValidaciones(rechazos).slice(0, 5).join(' | ');
  }

  const vals = resumenValidaciones(r.resultadosValidacion);
  if (vals.length) return vals.slice(0, 5).join(' | ');

  if (r.rawText) return String(r.rawText).slice(0, 300);
  if (Array.isArray(r.errors) && r.errors.length) {
    return r.errors.map((e) => formatErrMessage(e)).filter(Boolean).slice(0, 3).join(' | ');
  }

  return formatErrMessage(r) || 'Error en envío';
}

function serializarError(err) {
  return {
    message: formatErrMessage(err),
    code: err?.code || null,
    errors: Array.isArray(err?.errors)
      ? err.errors.map((e) => formatErrMessage(e)).filter(Boolean)
      : [],
  };
}

module.exports = {
  formatErrMessage,
  formatResultDetalle,
  resumenValidaciones,
  detalleValidaciones,
  serializarError,
};

/**
 * Normalización de numFactura RIPS vs FEV (facturación nueva sin ceros a la izquierda).
 *
 * Env: RIPS_NUM_FACTURA_SIN_CEROS=true|1|yes|si
 * - false (default): conserva folio con ceros (MR0009219) — clientes con facturación antigua
 * - true: MR0009219 → MR9219 — alinea JSON con XML/FEV del facturador nuevo
 */

function ripsNumFacturaSinCerosEnabled() {
  const v = String(process.env.RIPS_NUM_FACTURA_SIN_CEROS || '')
    .trim()
    .toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'si' || v === 'sí';
}

/**
 * Prefijo + folio numérico sin ceros a la izquierda.
 * Ej: MR0009219 → MR9219; 0009219 → 9219
 */
function normalizarNumFacturaSinCeros(numFactura) {
  if (numFactura == null) return numFactura;
  const s = String(numFactura).trim();
  if (!s) return s;
  if (s === 'SinFactura' || s.startsWith('SinFactura') || /^RipSin/i.test(s)) {
    return s;
  }
  const conPrefijo = s.match(/^([A-Za-z]+)0*(\d+)$/);
  if (conPrefijo) {
    return `${conPrefijo[1]}${parseInt(conPrefijo[2], 10)}`;
  }
  if (/^\d+$/.test(s)) {
    return String(parseInt(s, 10));
  }
  return s;
}

/** Aplica normalización solo si la env está activa. */
function aplicarNumFacturaSegunEnv(numFactura) {
  if (numFactura == null) return numFactura;
  if (!ripsNumFacturaSinCerosEnabled()) return numFactura;
  return normalizarNumFacturaSinCeros(numFactura);
}

/**
 * Clona el objeto RIPS y normaliza numFactura en el JSON a escribir en disco.
 */
function conNumFacturaSegunEnv(consulta) {
  if (!consulta || typeof consulta !== 'object') return consulta;
  if (!ripsNumFacturaSinCerosEnabled()) return consulta;
  const normalizado = normalizarNumFacturaSinCeros(consulta.numFactura);
  if (normalizado === consulta.numFactura) return consulta;
  return { ...consulta, numFactura: normalizado };
}

module.exports = {
  ripsNumFacturaSinCerosEnabled,
  normalizarNumFacturaSinCeros,
  aplicarNumFacturaSegunEnv,
  conNumFacturaSegunEnv,
};

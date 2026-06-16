'use strict';

/**
 * Clasificación heurística CIE-10 vs CIE-11 para codings FHIR.
 * CIE-10 Colombia: letra + 2–4 dígitos (ej. A042, A01.0).
 * CIE-11: capítulo numérico al inicio (ej. 1A08) u otras formas alfanuméricas WHO.
 */
function classifyIcdCode(code) {
    const c = String(code || '').trim().toUpperCase();
    if (!c) return null;
    if (/^\d/.test(c)) return 'icd-11';
    if (/^[A-Z]\d{2,4}(\.\d+)?$/.test(c)) return 'icd-10';
    if (/^[A-Z]\d[A-Z0-9.]+$/i.test(c)) return 'icd-11';
    return null;
}

function isIcd10Code(code) {
    return classifyIcdCode(code) === 'icd-10';
}

function isIcd11Code(code) {
    return classifyIcdCode(code) === 'icd-11';
}

module.exports = { classifyIcdCode, isIcd10Code, isIcd11Code };

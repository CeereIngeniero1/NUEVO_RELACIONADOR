'use strict';

const fs = require('fs');
const path = require('path');

let displayByCode = null;

/** Display oficial MinSalud (TipoAlergia.json en repo). */
function loadTipoAlergiaDisplayMap() {
    if (displayByCode) return displayByCode;
    displayByCode = new Map();
    const jsonPath = path.join(__dirname, '..', '..', 'SQL', '1888', 'CODESYSTEM', 'TipoAlergia.json');
    try {
        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const concepts = Array.isArray(raw.concept) ? raw.concept : [];
        concepts.forEach((c) => {
            const code = c && c.code != null ? String(c.code).trim() : '';
            const display = c && c.display != null ? String(c.display).trim() : '';
            if (code && display) displayByCode.set(code, display);
        });
    } catch (err) {
        console.warn('[tipoAlergiaCatalog] No se pudo leer TipoAlergia.json:', err && err.message ? err.message : err);
    }
    return displayByCode;
}

function normalizeTipoAlergiaCode(raw) {
    const s = raw != null ? String(raw).trim() : '';
    if (!s) return '';
    const m = s.match(/^(\d{2})/);
    return m ? m[1] : s.slice(0, 2);
}

/**
 * Display para FHIR/IHCE: catálogo oficial MinSalud primero (texto exacto que valida IHCE),
 * luego descripción de BD/UI si el código no está en el JSON oficial.
 */
function resolveTipoAlergiaDisplay(codigo, descripcionBd) {
    const code = normalizeTipoAlergiaCode(codigo);
    const official = code ? (loadTipoAlergiaDisplayMap().get(code) || '') : '';
    if (official) return official;
    const fromBd = descripcionBd != null ? String(descripcionBd).trim() : '';
    return fromBd;
}

/** Categoría FHIR AllergyIntolerance (no es el display del catálogo). */
function allergyTypeToCategory(tipoAlergiaCodigo) {
    const map = {
        '01': 'medication',
        '02': 'food',
        '03': 'environment',
        '04': 'environment',
        '05': 'biologic',
        '06': 'environment',
    };
    const code = normalizeTipoAlergiaCode(tipoAlergiaCodigo);
    return map[code] || null;
}

module.exports = {
    normalizeTipoAlergiaCode,
    resolveTipoAlergiaDisplay,
    allergyTypeToCategory,
};

'use strict';

/** Mantener claves en sync con front_relacionador/public/rda/utils/sanitizePlainText.js */
const PRESETS = {
    comunidadEtnica: {
        maxLength: 50,
        extraChars: "-'",
        collapseWhitespace: true
    }
};

function escapeCharClassChunk(ch) {
    if (/[\]\\^-]/.test(ch)) return '\\' + ch;
    return ch;
}

function buildExtraCharClass(extraChars) {
    if (!extraChars) return '';
    return Array.from(extraChars).map(escapeCharClassChunk).join('');
}

function sanitizePlainText(raw, options = {}) {
    const maxLength =
        options.maxLength != null && options.maxLength >= 0
            ? options.maxLength
            : 500;
    const extraChars = options.extraChars != null ? options.extraChars : '';
    const collapseWhitespace = options.collapseWhitespace !== false;
    const extraClass = buildExtraCharClass(extraChars);

    if (raw == null) return '';
    let s = String(raw);
    s = s.replace(/[\r\n\t\v\f]+/g, ' ');
    s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    s = s.trim();

    try {
        const re = new RegExp(`[^\\p{L}\\p{N}\\s${extraClass}]`, 'gu');
        s = s.replace(re, '');
    } catch {
        const reFb = new RegExp(
            `[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ\\s${extraClass}]`,
            'g'
        );
        s = s.replace(reFb, '');
    }

    if (collapseWhitespace) {
        s = s.replace(/\s+/g, ' ').trim();
    }
    return s.slice(0, maxLength);
}

function sanitizeComunidadEtnica(value) {
    return sanitizePlainText(value, PRESETS.comunidadEtnica);
}

module.exports = {
    sanitizePlainText,
    PRESETS,
    sanitizeComunidadEtnica
};

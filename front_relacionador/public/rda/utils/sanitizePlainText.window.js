/**
 * Bridge para scripts clásicos (Asignar_RIPS V3.js): misma lógica que
 * sanitizePlainText.js — mantener alineado con ese archivo.
 */
(function (w) {
    "use strict";

    var PRESETS = {
        comunidadEtnica: {
            maxLength: 50,
            extraChars: "-'",
            collapseWhitespace: true
        }
    };

    function escapeCharClassChunk(ch) {
        if (/[\]\\^-]/.test(ch)) return "\\" + ch;
        return ch;
    }

    function buildExtraCharClass(extraChars) {
        if (!extraChars) return "";
        return Array.from(extraChars).map(escapeCharClassChunk).join("");
    }

    function sanitizePlainText(raw, options) {
        options = options || {};
        var maxLength =
            options.maxLength != null && options.maxLength >= 0
                ? options.maxLength
                : 500;
        var extraChars = options.extraChars != null ? options.extraChars : "";
        var collapseWhitespace = options.collapseWhitespace !== false;
        var extraClass = buildExtraCharClass(extraChars);

        if (raw == null) return "";
        var s = String(raw);
        s = s.replace(/[\r\n\t\v\f]+/g, " ");
        s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
        s = s.trim();

        try {
            var re = new RegExp("[^\\p{L}\\p{N}\\s" + extraClass + "]", "gu");
            s = s.replace(re, "");
        } catch (e) {
            var reFb = new RegExp(
                "[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ\\s" + extraClass + "]",
                "g"
            );
            s = s.replace(reFb, "");
        }

        if (collapseWhitespace) {
            s = s.replace(/\s+/g, " ").trim();
        }
        return s.slice(0, maxLength);
    }

    function sanitizeComunidadEtnica(raw) {
        return sanitizePlainText(raw, PRESETS.comunidadEtnica);
    }

    w.PRESETS_SANITIZE_PLAIN_TEXT = PRESETS;
    w.sanitizePlainText = sanitizePlainText;
    w.sanitizeComunidadEtnica = sanitizeComunidadEtnica;
})(typeof window !== "undefined" ? window : globalThis);

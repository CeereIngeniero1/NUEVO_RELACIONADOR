'use strict';

const fs = require('fs');
const path = require('path');

const CS_COLOMBIAN_PERSON_IDENTIFIER = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier';
const NS_RNEC = 'https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC';
const V2_PN_SYSTEM = 'http://terminology.hl7.org/CodeSystem/v2-0203';

let displayByCode = null;

class PersonIdentifierDisplayError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'PersonIdentifierDisplayError';
        this.code = 'RDA_PERSON_IDENTIFIER_DISPLAY_MISSING';
        this.docTypeCode = code || '';
    }
}

/** Display oficial MinSalud (ColombianPersonIdentifier.json en repo). */
function loadColombianPersonIdentifierDisplayMap() {
    if (displayByCode) return displayByCode;
    displayByCode = new Map();
    const jsonPath = path.join(__dirname, '..', '..', 'SQL', '1888', 'CODESYSTEM', 'ColombianPersonIdentifier.json');
    try {
        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const concepts = Array.isArray(raw.concept) ? raw.concept : [];
        concepts.forEach((c) => {
            const code = c && c.code != null ? String(c.code).trim().toUpperCase() : '';
            const display = c && c.display != null ? String(c.display).trim() : '';
            if (code && display) displayByCode.set(code, display);
        });
    } catch (err) {
        console.warn('[colombianPersonIdentifierCatalog] No se pudo leer ColombianPersonIdentifier.json:', err && err.message ? err.message : err);
    }
    return displayByCode;
}

function normalizeDocTypeCode(raw) {
    const s = raw != null ? String(raw).trim().toUpperCase() : '';
    return s;
}

/**
 * Display para ColombianPersonIdentifier: BD ([Descripción Tipo de Documento]) primero,
 * luego catálogo oficial. Sin fallback al code — error controlado si falta display.
 */
function resolveColombianPersonIdentifierDisplay(code, displayFromBd) {
    const normalized = normalizeDocTypeCode(code);
    if (!normalized) {
        throw new PersonIdentifierDisplayError(
            'Tipo de documento requerido para identifier ColombianPersonIdentifier.',
            '',
        );
    }
    const fromBd = displayFromBd != null ? String(displayFromBd).trim() : '';
    if (fromBd) return fromBd;
    const official = loadColombianPersonIdentifierDisplayMap().get(normalized);
    if (official) return official;
    throw new PersonIdentifierDisplayError(
        `Falta display para tipo de documento "${normalized}". `
        + 'Configure [Tipo de Documento].[Descripción Tipo de Documento] en BD o el catálogo ColombianPersonIdentifier.',
        normalized,
    );
}

function buildColombianPersonIdentifierCoding(code, displayFromBd) {
    const normalized = normalizeDocTypeCode(code);
    const display = resolveColombianPersonIdentifierDisplay(normalized, displayFromBd);
    return {
        system: CS_COLOMBIAN_PERSON_IDENTIFIER,
        code: normalized,
        display,
    };
}

/**
 * IG PatientRDA / PractitionerRDA: Required Pattern RNEC para identifier.system
 * (incluye PA — Pasaporte; no usar otro NamingSystem salvo actualización explícita de la IG).
 */
function resolvePersonIdentifierNamingSystem(/* docTypeCode */) {
    return NS_RNEC;
}

/**
 * Identifier NationalPersonIdentifier-0 con type.coding PN + ColombianPersonIdentifier completos.
 * @returns {object|null} null si value vacío
 */
function buildNationalPersonIdentifier({ docTypeCode, value, displayFromBd, id = 'NationalPersonIdentifier-0' }) {
    const val = value != null ? String(value).trim() : '';
    if (!val) return null;
    const colombianCoding = buildColombianPersonIdentifierCoding(docTypeCode, displayFromBd);
    return {
        id,
        use: 'official',
        type: {
            coding: [
                { system: V2_PN_SYSTEM, code: 'PN', display: 'Person number' },
                colombianCoding,
            ],
        },
        system: resolvePersonIdentifierNamingSystem(colombianCoding.code),
        value: val,
    };
}

module.exports = {
    CS_COLOMBIAN_PERSON_IDENTIFIER,
    NS_RNEC,
    PersonIdentifierDisplayError,
    normalizeDocTypeCode,
    resolveColombianPersonIdentifierDisplay,
    buildColombianPersonIdentifierCoding,
    buildNationalPersonIdentifier,
    resolvePersonIdentifierNamingSystem,
    loadColombianPersonIdentifierDisplayMap,
};

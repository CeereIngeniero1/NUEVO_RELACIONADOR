'use strict';

const FHIR_BY_GRUPO = Object.freeze({ '01': 'male', '02': 'female', '03': 'unknown' });
const DISPLAY_BY_GRUPO = Object.freeze({
    '01': 'Hombre',
    '02': 'Mujer',
    '03': 'Indeterminado o Intersexual',
});

/**
 * Mapea catálogo Sexo 1888 / ColombianGenderGroup a Patient.gender y extensión biológica alineados (IHCE err-000).
 * @param {{ codigoSexo?: string, letraSexo?: string, descripcionSexo?: string }} input
 * @returns {{ fhirGender: string|undefined, bioGender: { code: string, display: string }|null }}
 */
function patientGenderFromCatalog(input) {
    const codigoCatalogo = input && input.codigoSexo != null ? String(input.codigoSexo).trim() : '';
    const letraSexo = input && input.letraSexo != null ? String(input.letraSexo).trim() : '';
    const display = input && input.descripcionSexo != null ? String(input.descripcionSexo).trim() : '';

    let grupoCode = null;
    if (codigoCatalogo) {
        const c = codigoCatalogo;
        if (/^0?[1-3]$/.test(c)) {
            grupoCode = String(parseInt(c, 10)).padStart(2, '0');
        } else if (/^(01|02|03)$/i.test(c)) {
            grupoCode = c.toUpperCase();
        } else if (/^[MF]$/i.test(c)) {
            grupoCode = c.toUpperCase() === 'M' ? '01' : '02';
        }
    }
    if (!grupoCode && letraSexo && /^[MF]$/i.test(letraSexo)) {
        grupoCode = letraSexo.toUpperCase() === 'M' ? '01' : '02';
    }
    if (!grupoCode) return { fhirGender: undefined, bioGender: null };

    return {
        fhirGender: FHIR_BY_GRUPO[grupoCode],
        bioGender: {
            code: grupoCode,
            display: display || DISPLAY_BY_GRUPO[grupoCode],
        },
    };
}

module.exports = { patientGenderFromCatalog, FHIR_BY_GRUPO, DISPLAY_BY_GRUPO };

'use strict';

const VALID_FHIR_DURATION_UNITS = new Set(['min', 'h', 'd', 'wk', 'mo', 'a']);
const INVALID_MEDICATION_TIME_ABBREVS = new Set([
    'h', 'd', 'min', 'ml', 'sem', 'mes', 'hr', 'day', 'm', 'wk', 'mo', 'a', 's', 'anio', 'ano', 'año',
]);

function trimOrNull(v) {
    if (v == null) return null;
    const s = String(v).trim();
    return s || null;
}

function rowToMap(recordset, keyField = 'codigo') {
    const byCode = {};
    (recordset || []).forEach((row) => {
        const code = trimOrNull(row[keyField]);
        if (code) byCode[code] = row;
    });
    return byCode;
}

async function loadMedicationTimeCatalog(pool) {
    const result = await pool.request().query(`
        SELECT codigo, display, system_url, fhir_duration_unit
        FROM dbo.VW_RDA_MedicationTime_Activos
    `);
    return rowToMap(result.recordset);
}

async function loadUmmCatalog(pool) {
    const result = await pool.request().query(`
        SELECT codigo, display, unidad, system_url
        FROM dbo.VW_RDA_UMM_Activos
    `);
    return rowToMap(result.recordset);
}

async function loadVadCatalog(pool) {
    const result = await pool.request().query(`
        SELECT codigo, display, system_url
        FROM dbo.VW_RDA_ViaAdministracion_Activos
    `);
    return rowToMap(result.recordset);
}

async function loadColombianTechModalityCatalog(pool) {
    const result = await pool.request().query(`
        SELECT codigo, display, system_url
        FROM dbo.VW_RDA_ColombianTechModality_Activos
    `);
    return rowToMap(result.recordset);
}

async function loadRdaceMedicationCatalogs(pool) {
    const [medicationTime, umm, vad] = await Promise.all([
        loadMedicationTimeCatalog(pool),
        loadUmmCatalog(pool),
        loadVadCatalog(pool),
    ]);
    return { medicationTime, umm, vad };
}

function lookupCatalogCode(catalogByCode, rawCode, rawDisplay) {
    const code = trimOrNull(rawCode);
    if (code && catalogByCode[code]) return catalogByCode[code];
    if (rawDisplay) {
        const disp = String(rawDisplay).trim().toLowerCase();
        const found = Object.values(catalogByCode).find((row) =>
            String(row.display || '').trim().toLowerCase() === disp
        );
        if (found) return found;
    }
    return null;
}

function resolveMedicationTimeFromRow(row, catalogByCode) {
    const rawCode = row && (
        row.FrecuenciaMedicationTimeCodigo
        || row.FrecuenciaUnidadCodigo
        || row.FrecuenciaUnidad
    );
    const cat = lookupCatalogCode(catalogByCode, rawCode, row && row.FrecuenciaUnidadDescripcion);
    if (!cat) return null;
    return {
        codigo: trimOrNull(cat.codigo),
        display: trimOrNull(cat.display),
        system_url: trimOrNull(cat.system_url),
        fhir_duration_unit: trimOrNull(cat.fhir_duration_unit),
    };
}

function resolveDurationMedicationTimeFromRow(row, catalogByCode) {
    const rawCode = row && (row.DuracionUnidadCodigo || row.DuracionUnidad);
    const cat = lookupCatalogCode(catalogByCode, rawCode, row && row.DuracionUnidadDescripcion);
    if (!cat) return null;
    return {
        codigo: trimOrNull(cat.codigo),
        display: trimOrNull(cat.display),
        system_url: trimOrNull(cat.system_url),
        fhir_duration_unit: trimOrNull(cat.fhir_duration_unit),
    };
}

function resolveUmmFromRow(row, catalogByCode) {
    const cat = lookupCatalogCode(
        catalogByCode,
        row && (row.UnidadDosisCodigo || row.UnidadDosis),
        row && row.UnidadDosisDescripcion
    );
    if (!cat) return null;
    return {
        codigo: trimOrNull(cat.codigo),
        display: trimOrNull(cat.display),
        unidad: trimOrNull(cat.unidad) || trimOrNull(cat.display),
        system_url: trimOrNull(cat.system_url),
    };
}

function resolveVadFromRow(row, catalogByCode) {
    const cat = lookupCatalogCode(
        catalogByCode,
        row && row.ViaAdministracionCodigo,
        null
    ) || lookupCatalogCode(
        catalogByCode,
        row && row.ViaAdministracion,
        null
    );
    if (!cat) return null;
    return {
        codigo: trimOrNull(cat.codigo),
        display: trimOrNull(cat.display),
        system_url: trimOrNull(cat.system_url),
    };
}

function catalogHasCode(catalogByCode, rawCode) {
    const code = trimOrNull(rawCode);
    return Boolean(code && catalogByCode && catalogByCode[code]);
}

function validatePrescripcionMedicamentoCatalogCodes(body, catalogs) {
    const via = trimOrNull(body && body.via);
    const umm = trimOrNull(body && body.unidadDosis);
    const dur = trimOrNull(body && body.duracionUnid);
    const freq = trimOrNull(body && body.frecuenciaUnid);

    if (via && !catalogHasCode(catalogs.vad, via)) {
        return `Vía de administración "${via}" no existe en VW_RDA_ViaAdministracion_Activos.`;
    }
    if (umm && !catalogHasCode(catalogs.umm, umm)) {
        return `Unidad de medida dosis "${umm}" no existe en VW_RDA_UMM_Activos.`;
    }
    if (dur) {
        if (!catalogHasCode(catalogs.medicationTime, dur)) {
            return `Duración unidad tiempo "${dur}" no existe en VW_RDA_MedicationTime_Activos.`;
        }
        if (dur === '7') return 'Duración no admite código 7 (Según respuesta al tratamiento).';
    }
    if (freq) {
        if (!catalogHasCode(catalogs.medicationTime, freq)) {
            return `Frecuencia unidad tiempo "${freq}" no existe en VW_RDA_MedicationTime_Activos.`;
        }
        if (freq === '7') return 'Frecuencia no admite código 7 (Según respuesta al tratamiento).';
    }
    return '';
}

function isCompleteMedicationPrescriptionRow(row, catalogs) {
    const s = (v) => trimOrNull(v);
    if (!s(row.CodigoMedicamento)) return false;
    if (!s(row.DosisOrdenada)) return false;
    if (!s(row.FrecuenciaCantidad)) return false;
    if (!s(row.DuracionCantidad)) return false;
    if (!s(row.FinalidadCodigo) && !s(row.Finalidad)) return false;

    const medTime = resolveMedicationTimeFromRow(row, catalogs.medicationTime);
    if (!medTime || !medTime.codigo) return false;
    if (medTime.codigo === '7') return false;

    const durTime = resolveDurationMedicationTimeFromRow(row, catalogs.medicationTime);
    if (!durTime || !durTime.fhir_duration_unit) return false;
    if (durTime.codigo === '7') return false;

    const umm = resolveUmmFromRow(row, catalogs.umm);
    if (!umm || !umm.codigo || !umm.system_url) return false;

    const vad = resolveVadFromRow(row, catalogs.vad);
    if (!vad || !vad.codigo || !vad.system_url) return false;

    return true;
}

function validateMedicationDosageFromCatalogs(dosageInstruction, catalogs) {
    if (!dosageInstruction || typeof dosageInstruction !== 'object') {
        return 'MedicationRequestRDA sin dosageInstruction.';
    }

    const routeCoding = dosageInstruction.route
        && Array.isArray(dosageInstruction.route.coding)
        ? dosageInstruction.route.coding[0]
        : null;
    if (!routeCoding || !routeCoding.code) {
        return 'route.coding requiere código VAD desde catálogo BD.';
    }
    const routeCode = trimOrNull(routeCoding.code);
    const vadRow = catalogs.vad && catalogs.vad[routeCode];
    if (!vadRow) {
        return `VAD código "${routeCode}" no existe en VW_RDA_ViaAdministracion_Activos.`;
    }
    if (trimOrNull(routeCoding.system) !== trimOrNull(vadRow.system_url)) {
        return 'route.coding.system no coincide con system_url del catálogo VAD.';
    }
    if (vadRow.display && routeCoding.display
        && trimOrNull(routeCoding.display) !== trimOrNull(vadRow.display)) {
        return `route.coding display "${routeCoding.display}" no coincide con catálogo VAD para código ${routeCode}.`;
    }

    const timing = dosageInstruction.timing;
    const repeat = timing && timing.repeat;
    const durationUnit = repeat && trimOrNull(repeat.durationUnit);
    if (!durationUnit) return 'timing.repeat.durationUnit es obligatorio.';
    if (durationUnit === 'm') return 'timing.repeat.durationUnit no admite "m"; use "mo" para mes.';
    if (!VALID_FHIR_DURATION_UNITS.has(durationUnit)) {
        return `timing.repeat.durationUnit "${durationUnit}" no es válido (min, h, d, wk, mo, a).`;
    }

    const timingCoding = timing && timing.code && Array.isArray(timing.code.coding)
        ? timing.code.coding[0]
        : null;
    if (!timingCoding || !timingCoding.code) {
        return 'timing.code.coding requiere código MedicationTime desde catálogo BD.';
    }
    const code = trimOrNull(timingCoding.code);
    if (INVALID_MEDICATION_TIME_ABBREVS.has(String(code).toLowerCase())) {
        return `MedicationTime no admite abreviatura "${code}" como código.`;
    }
    const medRow = catalogs.medicationTime && catalogs.medicationTime[code];
    if (!medRow) return `MedicationTime código "${code}" no existe en VW_RDA_MedicationTime_Activos.`;
    if (trimOrNull(timingCoding.system) !== trimOrNull(medRow.system_url)) {
        return 'timing.code.coding.system no coincide con system_url del catálogo MedicationTime.';
    }
    if (medRow.display && timingCoding.display
        && trimOrNull(timingCoding.display) !== trimOrNull(medRow.display)) {
        return `timing.code display "${timingCoding.display}" no coincide con catálogo para código ${code}.`;
    }

    const dar = Array.isArray(dosageInstruction.doseAndRate) ? dosageInstruction.doseAndRate[0] : null;
    const doseQty = dar && dar.doseQuantity;
    if (!doseQty || doseQty.code == null) return 'doseQuantity requiere código UMM desde catálogo BD.';
    const ummRow = catalogs.umm && catalogs.umm[trimOrNull(doseQty.code)];
    if (!ummRow) return `UMM código "${doseQty.code}" no existe en VW_RDA_UMM_Activos.`;
    if (trimOrNull(doseQty.system) !== trimOrNull(ummRow.system_url)) {
        return 'doseQuantity.system no coincide con system_url del catálogo UMM.';
    }

    const rateQty = dar && dar.rateQuantity;
    if (!rateQty || !rateQty.code) return 'rateQuantity requiere código MedicationTime desde catálogo BD.';
    const rateCode = trimOrNull(rateQty.code);
    const rateRow = catalogs.medicationTime && catalogs.medicationTime[rateCode];
    if (!rateRow) return `rateQuantity código "${rateCode}" no existe en VW_RDA_MedicationTime_Activos.`;
    if (trimOrNull(rateQty.system) !== trimOrNull(rateRow.system_url)) {
        return 'rateQuantity.system no coincide con system_url del catálogo MedicationTime.';
    }

    return '';
}

module.exports = {
    VALID_FHIR_DURATION_UNITS,
    INVALID_MEDICATION_TIME_ABBREVS,
    loadMedicationTimeCatalog,
    loadUmmCatalog,
    loadVadCatalog,
    loadColombianTechModalityCatalog,
    loadRdaceMedicationCatalogs,
    resolveMedicationTimeFromRow,
    resolveDurationMedicationTimeFromRow,
    resolveUmmFromRow,
    resolveVadFromRow,
    catalogHasCode,
    validatePrescripcionMedicamentoCatalogCodes,
    isCompleteMedicationPrescriptionRow,
    validateMedicationDosageFromCatalogs,
};

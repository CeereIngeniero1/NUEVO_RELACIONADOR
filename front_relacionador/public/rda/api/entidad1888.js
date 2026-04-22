/**
 * Persistencia RDA 1888 — cabecera + subrecursos (misma ruta que legacy).
 * Usa httpClient (JSON + token).
 */
import { postJson, getApiV3Base, authJsonHeaders } from './httpClient.js';

export const RDA_RUTAS = {
    evaluacionPaciente: '/EvaluacionEntidadRDA/',
    antecedentesSaludPac: '/EvaluacionEntidadRDA/AntecedentesSalud',
    antecedentesFamPac: '/EvaluacionEntidadRDA/AntecedentesFamiliares',
    antecedentesFarmPac: '/EvaluacionEntidadRDA/AntecedentesFarmacologicos',
    evaluacionCE: '/EvaluacionEntidadRDACE/',
    antecedentesSaludCE: '/EvaluacionEntidadRDACE/AntecedentesSalud',
    antecedentesFamCE: '/EvaluacionEntidadRDACE/AntecedentesFamiliares',
    antecedentesFarmCE: '/EvaluacionEntidadRDACE/AntecedentesFarmacologicos',
    diagnosticosCE: '/EvaluacionEntidadRDACE/DiagnosticosRelacionados',
    prescripcionMedCE: '/EvaluacionEntidadRDACE/PrescripcionMedicamentos',
    prescripcionProcCE: '/EvaluacionEntidadRDACE/PrescripcionProcedimientos',
    otrasTecCE: '/EvaluacionEntidadRDACE/OtrasTecnologias',
};

export async function guardarEvaluacionPacientePrincipal(payload) {
    return postJson(RDA_RUTAS.evaluacionPaciente, payload);
}

export async function postAntecedenteSaludPac(body) {
    return postJson(RDA_RUTAS.antecedentesSaludPac, body);
}
export async function postAntecedenteFamPac(body) {
    return postJson(RDA_RUTAS.antecedentesFamPac, body);
}
export async function postAntecedenteFarmPac(body) {
    return postJson(RDA_RUTAS.antecedentesFarmPac, body);
}

export async function guardarEvaluacionCEPrincipal(payload) {
    return postJson(RDA_RUTAS.evaluacionCE, payload);
}

export async function postAntecedenteSaludCE(body) {
    return postJson(RDA_RUTAS.antecedentesSaludCE, body);
}
export async function postAntecedenteFamCE(body) {
    return postJson(RDA_RUTAS.antecedentesFamCE, body);
}
export async function postAntecedenteFarmCE(body) {
    return postJson(RDA_RUTAS.antecedentesFarmCE, body);
}
export async function postDiagnosticoRelacionadoCE(body) {
    return postJson(RDA_RUTAS.diagnosticosCE, body);
}
export async function postPrescripcionMedCE(body) {
    return postJson(RDA_RUTAS.prescripcionMedCE, body);
}
export async function postPrescripcionProcCE(body) {
    return postJson(RDA_RUTAS.prescripcionProcCE, body);
}
export async function postOtraTecCE(body) {
    return postJson(RDA_RUTAS.otrasTecCE, body);
}

/** URL absoluta para descarga PDF CE (GET, sin body). */
export function urlResumenClinicoPdf(id) {
    return `${getApiV3Base()}/EvaluacionEntidadRDACE/${id}/ResumenClinico.pdf`;
}

/**
 * @param {string} url
 * @returns {Promise<Blob>}
 */
export async function fetchBlobAuthenticated(url) {
    const h = { ...authJsonHeaders() };
    const r = await fetch(url, { method: 'GET', headers: h });
    if (!r.ok) throw new Error(r.statusText || 'Error HTTP');
    return r.blob();
}

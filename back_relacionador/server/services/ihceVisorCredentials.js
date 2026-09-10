const { loadDotEnvFromCandidates } = require('../config/envLoader');

function parseBoolEnv(val) {
    return ['1', 'true', 'yes', 'on'].includes(String(val || '').trim().toLowerCase());
}

function normalizeIhceAmbiente(val) {
    const s = String(val || '').trim().toLowerCase();
    return s === 'prod' || s === 'produccion' || s === 'production' ? 'prod' : 'sandbox';
}

/**
 * Ambiente IHCE por defecto (visor, consultas) cuando el cliente no envía `ambiente`.
 * Prioridad: IHCE_FORCE_PROD_ONLY > IHCE_FORCE_SANDBOX_ONLY > IHCE_DEFAULT_AMBIENTE > sandbox.
 */
function resolveIhceDefaultAmbiente() {
    loadDotEnvFromCandidates();
    if (parseBoolEnv(process.env.IHCE_FORCE_PROD_ONLY)) return 'prod';
    if (parseBoolEnv(process.env.IHCE_FORCE_SANDBOX_ONLY)) return 'sandbox';
    return normalizeIhceAmbiente(process.env.IHCE_DEFAULT_AMBIENTE || 'sandbox');
}

/**
 * Credenciales IHCE (sandbox/prod) desde BD CredencialesIhce.
 * @param {'sandbox'|'prod'|'produccion'} ambiente
 * @param {string} documentoEmpresa
 */
async function resolveIhceEnv(ambiente, documentoEmpresa) {
    const { getIhceCredentials, normalizeAmbiente } = require('../utils/ihceCredenciales');
    const amb = normalizeAmbiente(ambiente);
    const cred = await getIhceCredentials(documentoEmpresa, amb);
    return {
        envPrefix: cred.envPrefix,
        baseUrl: cred.baseUrl,
        tenantId: cred.tenantId,
        clientId: cred.clientId,
        clientSecret: cred.clientSecret,
        scope: cred.scope,
        subscriptionKey: cred.subscriptionKey,
        documentoEmpresa: cred.documentoEmpresa,
        ambiente: cred.ambiente,
        custodianReps: cred.custodianReps,
        custodianNit: cred.custodianNit,
        custodianName: cred.custodianName,
    };
}

module.exports = { resolveIhceEnv, resolveIhceDefaultAmbiente, normalizeIhceAmbiente };

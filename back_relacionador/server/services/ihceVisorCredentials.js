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
 * Resuelve credenciales IHCE (sandbox/prod) reutilizando las mismas variables que RdaPaciente/EnviarIHCE.
 * @param {'sandbox'|'prod'|'produccion'} ambiente
 */
function resolveIhceEnv(ambiente) {
    loadDotEnvFromCandidates();

    const envPrefix =
        String(ambiente || 'sandbox').toLowerCase() === 'prod' ||
        String(ambiente || '').toLowerCase() === 'produccion'
            ? 'IHCE_PROD_'
            : 'IHCE_SANDBOX_';

    const firstEnv = (...keys) => {
        for (let i = 0; i < keys.length; i += 1) {
            const v = process.env[keys[i]];
            if (v != null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    };

    let baseUrl;
    let tenantId;
    let clientId;
    let clientSecret;
    let scope;
    let subscriptionKey;

    if (envPrefix === 'IHCE_SANDBOX_') {
        baseUrl = firstEnv('IHCE_SANDBOX_BASE_URL', 'IHCE_API_BASE_URL', 'IHCE_BASE_URL');
        tenantId = firstEnv('IHCE_SANDBOX_TENANT_ID', 'IHCE_TENANT_ID');
        clientId = firstEnv('IHCE_SANDBOX_CLIENT_ID', 'IHCE_CLIENT_ID');
        clientSecret = firstEnv('IHCE_SANDBOX_CLIENT_SECRET', 'IHCE_CLIENT_SECRET');
        scope = firstEnv('IHCE_SANDBOX_SCOPE', 'IHCE_SCOPE');
        subscriptionKey = firstEnv(
            'IHCE_SANDBOX_SUBSCRIPTION_KEY',
            'IHCE_APIM_SUBSCRIPTION_KEY',
            'IHCE_SUBSCRIPTION_KEY',
            'OCP_APIM_SUBSCRIPTION_KEY',
        );
    } else {
        baseUrl = firstEnv('IHCE_PROD_BASE_URL', 'IHCE_API_BASE_URL_PROD');
        tenantId = firstEnv('IHCE_PROD_TENANT_ID');
        clientId = firstEnv('IHCE_PROD_CLIENT_ID');
        clientSecret = firstEnv('IHCE_PROD_CLIENT_SECRET');
        scope = firstEnv('IHCE_PROD_SCOPE');
        subscriptionKey = firstEnv('IHCE_PROD_SUBSCRIPTION_KEY', 'IHCE_APIM_SUBSCRIPTION_KEY_PROD');
    }

    return {
        envPrefix,
        baseUrl: baseUrl.replace(/\/$/, ''),
        tenantId,
        clientId,
        clientSecret,
        scope,
        subscriptionKey,
    };
}

module.exports = { resolveIhceEnv, resolveIhceDefaultAmbiente, normalizeIhceAmbiente };

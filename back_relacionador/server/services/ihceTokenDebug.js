'use strict';

const { URLSearchParams } = require('url');

/**
 * Resuelve credenciales IHCE (misma lógica que EnviarIHCE en RdaPaciente / RDACE).
 * @param {'sandbox'|'prod'} effectiveAmb
 */
function resolveIhceCreds(effectiveAmb) {
    const envPrefix = effectiveAmb === 'prod' ? 'IHCE_PROD_' : 'IHCE_SANDBOX_';

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

    return { envPrefix, baseUrl, tenantId, clientId, clientSecret, scope, subscriptionKey };
}

/**
 * Objeto copiable para depuración: el token IHCE se pide como x-www-form-urlencoded, no JSON.
 * @param {'sandbox'|'prod'} effectiveAmb Ambiente ya normalizado (p. ej. el que usa RdaEnvioMasivo).
 */
function buildIhceTokenRequestDebug(effectiveAmb) {
    const amb = effectiveAmb === 'prod' ? 'prod' : 'sandbox';
    const { envPrefix, baseUrl, tenantId, clientId, clientSecret, scope, subscriptionKey } = resolveIhceCreds(amb);

    const missing = [
        !tenantId && 'TENANT_ID',
        !clientId && 'CLIENT_ID',
        !clientSecret && 'CLIENT_SECRET',
        !scope && 'SCOPE',
    ].filter(Boolean);

    const tokenUrl = tenantId
        ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
        : '';

    const bodyParams = {
        grant_type: 'client_credentials',
        client_id: clientId || null,
        client_secret: clientSecret ? '***REDACTADO***' : null,
        scope: scope || null,
    };

    const bodyUrlEncodedRedacted = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId || '',
        client_secret: clientSecret ? '***REDACTADO***' : '',
        scope: scope || '',
    }).toString();

    return {
        descripcion: 'Solicitud OAuth2 client_credentials (Microsoft Entra) para token IHCE',
        ambienteEfectivo: amb,
        envPrefix,
        nota:
            'El servidor envía application/x-www-form-urlencoded (no JSON). ' +
            'Los campos equivalentes van en bodyParams y en bodyUrlEncodedRedacted (client_secret oculto).',
        method: 'POST',
        url: tokenUrl || null,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        bodyFormat: 'application/x-www-form-urlencoded',
        bodyParams,
        bodyUrlEncodedRedacted: bodyUrlEncodedRedacted || null,
        faltanVariables: missing.length ? missing : null,
        ihceApiBaseUrlResuelto: baseUrl || null,
        subscriptionKeyPresente: Boolean(subscriptionKey && String(subscriptionKey).trim()),
        notaSubscriptionKey:
            'Ocp-Apim-Subscription-Key no se envía en esta petición de token; se usa en las llamadas FHIR posteriores.',
    };
}

module.exports = { buildIhceTokenRequestDebug };

'use strict';

const { URLSearchParams } = require('url');
const {
    getIhceCredentials,
    normalizeAmbiente,
    resolveDocumentoEmpresaFromRda,
} = require('../utils/ihceCredenciales');

/**
 * Resuelve credenciales IHCE desde BD.
 * @param {'sandbox'|'prod'} effectiveAmb
 * @param {string} documentoEmpresa
 */
async function resolveIhceCreds(effectiveAmb, documentoEmpresa) {
    const cred = await getIhceCredentials(documentoEmpresa, effectiveAmb);
    return {
        envPrefix: cred.envPrefix,
        baseUrl: cred.baseUrl,
        tenantId: cred.tenantId,
        clientId: cred.clientId,
        clientSecret: cred.clientSecret,
        scope: cred.scope,
        subscriptionKey: cred.subscriptionKey,
        documentoEmpresa: cred.documentoEmpresa,
        custodianReps: cred.custodianReps,
        custodianNit: cred.custodianNit,
        custodianName: cred.custodianName,
    };
}

/**
 * Objeto copiable para depuración: el token IHCE se pide como x-www-form-urlencoded, no JSON.
 * @param {'sandbox'|'prod'} effectiveAmb
 * @param {string} [documentoEmpresa]
 */
async function buildIhceTokenRequestDebug(effectiveAmb, documentoEmpresa) {
    const amb = normalizeAmbiente(effectiveAmb);
    let creds;
    let resolveError = null;
    try {
        const doc =
            documentoEmpresa
            || (await resolveDocumentoEmpresaFromRda({
                documentoEmpresaBody: process.env.IHCE_DEFAULT_DOCUMENTO_EMPRESA,
            }));
        creds = await resolveIhceCreds(amb, doc);
    } catch (err) {
        resolveError = err.message || String(err);
        creds = {
            envPrefix: amb === 'prod' ? 'IHCE_PROD_' : 'IHCE_SANDBOX_',
            baseUrl: '',
            tenantId: '',
            clientId: '',
            clientSecret: '',
            scope: '',
            subscriptionKey: '',
        };
    }

    const missing = [
        !creds.tenantId && 'TENANT_ID',
        !creds.clientId && 'CLIENT_ID',
        !creds.clientSecret && 'CLIENT_SECRET',
        !creds.scope && 'SCOPE',
    ].filter(Boolean);

    const tokenUrl = creds.tenantId
        ? `https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`
        : '';

    const bodyParams = {
        grant_type: 'client_credentials',
        client_id: creds.clientId || null,
        client_secret: creds.clientSecret ? '***REDACTADO***' : null,
        scope: creds.scope || null,
    };

    const bodyUrlEncodedRedacted = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: creds.clientId || '',
        client_secret: creds.clientSecret ? '***REDACTADO***' : '',
        scope: creds.scope || '',
    }).toString();

    return {
        descripcion: 'Solicitud OAuth2 client_credentials (Microsoft Entra) para token IHCE',
        ambienteEfectivo: amb,
        envPrefix: creds.envPrefix,
        documentoEmpresa: creds.documentoEmpresa || documentoEmpresa || null,
        fuente: 'CredencialesIhce (BD)',
        resolveError,
        nota:
            'El servidor envía application/x-www-form-urlencoded (no JSON). '
            + 'Los campos equivalentes van en bodyParams y en bodyUrlEncodedRedacted (client_secret oculto).',
        method: 'POST',
        url: tokenUrl || null,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        bodyFormat: 'application/x-www-form-urlencoded',
        bodyParams,
        bodyUrlEncodedRedacted: bodyUrlEncodedRedacted || null,
        faltanVariables: missing.length ? missing : null,
        ihceApiBaseUrlResuelto: creds.baseUrl || null,
        subscriptionKeyPresente: Boolean(creds.subscriptionKey && String(creds.subscriptionKey).trim()),
        notaSubscriptionKey:
            'Ocp-Apim-Subscription-Key no se envía en esta petición de token; se usa en las llamadas FHIR posteriores.',
    };
}

module.exports = { buildIhceTokenRequestDebug, resolveIhceCreds };

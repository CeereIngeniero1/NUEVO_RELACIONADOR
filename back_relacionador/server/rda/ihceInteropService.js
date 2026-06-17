'use strict';

const https = require('https');
const { URL, URLSearchParams } = require('url');
const { resolveIhceCreds } = require('../services/ihceTokenDebug');
const { resolvePrestadorForIhce } = require('./rdaBundleIpsHelpers');

function str(v) {
    return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function outboundTimeoutMs() {
    const n = Number(process.env.IHCE_OUTBOUND_TIMEOUT_MS);
    return Number.isFinite(n) && n > 0 ? n : 45000;
}

function isForceSandboxOnly() {
    return ['1', 'true', 'yes', 'on'].includes(
        String(process.env.IHCE_FORCE_SANDBOX_ONLY || '').trim().toLowerCase()
    );
}
function isForceProdOnly() {
    return ['1', 'true', 'yes', 'on'].includes(
        String(process.env.IHCE_FORCE_PROD_ONLY || '').trim().toLowerCase()
    );
}

function httpsPostFormUrlEncoded(urlString, bodyString) {
    return new Promise((resolve, reject) => {
        const ms = outboundTimeoutMs();
        let settled = false;
        let req;
        const timer = setTimeout(() => {
            if (req) req.destroy();
            const err = new Error(`Token OAuth: timeout (${ms} ms)`);
            err.code = 'IHCE_OUTBOUND_TIMEOUT';
            err.status = 504;
            finish(err);
        }, ms);

        const finish = (err, val) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (err) reject(err);
            else resolve(val);
        };

        const u = new URL(urlString);
        req = https.request(
            {
                hostname: u.hostname,
                path: u.pathname + (u.search || ''),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(bodyString, 'utf8'),
                },
            },
            (res) => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => finish(null, { status: res.statusCode || 0, body: data }));
            }
        );
        req.on('error', (e) => finish(e));
        req.write(bodyString);
        req.end();
    });
}

function httpsPostFhirJson(urlString, accessToken, subscriptionKey, jsonBody) {
    const body = typeof jsonBody === 'string' ? jsonBody : JSON.stringify(jsonBody);
    return new Promise((resolve, reject) => {
        const ms = outboundTimeoutMs();
        let settled = false;
        let req;
        const timer = setTimeout(() => {
            if (req) req.destroy();
            const err = new Error(`Llamada FHIR IHCE: timeout (${ms} ms)`);
            err.code = 'IHCE_OUTBOUND_TIMEOUT';
            err.status = 504;
            finish(err);
        }, ms);

        const finish = (err, val) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (err) reject(err);
            else resolve(val);
        };

        const u = new URL(urlString);
        req = https.request(
            {
                hostname: u.hostname,
                path: u.pathname + (u.search || ''),
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Content-Type': 'application/fhir+json',
                    Accept: 'application/fhir+json',
                    'Content-Length': Buffer.byteLength(body, 'utf8'),
                },
            },
            (res) => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => finish(null, { status: res.statusCode || 0, body: data }));
            }
        );
        req.on('error', (e) => finish(e));
        req.write(body);
        req.end();
    });
}

function buildConsultarProfesionalParametersPayload(tipoDocumento, numeroDocumento, humanuser) {
    const tipo = str(tipoDocumento).toUpperCase();
    const num = str(numeroDocumento);
    if (!tipo || !num) return null;
    const parameter = [{
        name: 'identifier',
        part: [
            { name: 'type', valueString: tipo },
            { name: 'value', valueString: num },
        ],
    }];
    if (humanuser != null && str(humanuser)) {
        parameter.push({ name: 'humanuser', valueString: str(humanuser) });
    }
    return { resourceType: 'Parameters', parameter };
}

function buildConsultarOrganizacionParameters(ambiente, body = {}) {
    const b = body && typeof body === 'object' ? body : {};
    const p = resolvePrestadorForIhce(ambiente, {
        overrideCodigoPrestador:
            b.HealthcareProviderIdentifier ?? b.reps ?? b.codigoPrestador ?? b.CodigoPrestador ?? b.overrideCodigoPrestador,
        overrideNitPrestadorIPS:
            b.TaxIdentifier ?? b.taxId ?? b.nit ?? b.NitPrestadorIPS ?? b.overrideNitPrestadorIPS,
        overrideNombrePrestadorIPS:
            b.name ?? b.nombre ?? b.NombrePrestadorIPS ?? b.overrideNombrePrestadorIPS,
    });
    const taxId = p.nit;
    const reps = p.reps;
    const name = p.name;
    if (!taxId && !reps && !name) {
        const err = new Error(
            'Envíe en el body al menos uno de: TaxIdentifier/nit, HealthcareProviderIdentifier/reps/codigoPrestador, name/nombre; '
            + 'o defina IHCE_*_CUSTODIAN_* / IHCE_RDACE_DEFAULT_* en .env.',
        );
        err.code = 'ORG_PARAMETROS_INCOMPLETOS';
        err.status = 400;
        throw err;
    }
    const parameter = [];
    if (taxId) parameter.push({ name: 'TaxIdentifier', valueString: taxId });
    if (reps) parameter.push({ name: 'HealthcareProviderIdentifier', valueString: reps });
    if (name) parameter.push({ name: 'name', valueString: name });
    return {
        payload: { resourceType: 'Parameters', parameter },
        env_usado: {
            TaxIdentifier: taxId || null,
            HealthcareProviderIdentifier: reps || null,
            name: name || null,
        },
    };
}

async function solicitarTokenIhceShared(ambiente) {
    const creds = resolveIhceCreds(ambiente === 'prod' ? 'prod' : 'sandbox');
    const missing = [
        !creds.tenantId && 'TENANT_ID',
        !creds.clientId && 'CLIENT_ID',
        !creds.clientSecret && 'CLIENT_SECRET',
        !creds.scope && 'SCOPE',
    ].filter(Boolean);
    if (missing.length) {
        const err = new Error(`Faltan variables en .env: ${missing.join(', ')}`);
        err.code = 'IHCE_ENV_INCOMPLETO';
        err.status = 400;
        throw err;
    }
    const tokenUrl = `https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        scope: creds.scope,
    }).toString();
    const resp = await httpsPostFormUrlEncoded(tokenUrl, body);
    const parsed = JSON.parse(resp.body || '{}');
    if (resp.status < 200 || resp.status >= 300) {
        const err = new Error(parsed.error_description || parsed.error || `Token HTTP ${resp.status}`);
        err.code = 'TOKEN_IHCE_ERROR';
        err.status = resp.status >= 400 && resp.status < 600 ? resp.status : 502;
        err.details = parsed;
        throw err;
    }
    return {
        ambiente: ambiente === 'prod' ? 'produccion' : 'sandbox',
        env_prefix: creds.envPrefix,
        token_url: tokenUrl,
        ihce_base_url: creds.baseUrl || null,
        subscription_key_configurada: Boolean(creds.subscriptionKey && str(creds.subscriptionKey)),
        token_type: parsed.token_type || null,
        expires_in: parsed.expires_in != null ? parsed.expires_in : null,
        ext_expires_in: parsed.ext_expires_in != null ? parsed.ext_expires_in : null,
        access_token: parsed.access_token || null,
        scope_respuesta: parsed.scope || null,
    };
}

async function ihceConsultarProfesionalSaludShared(ambiente, body) {
    const tipo = body.tipoDocumentoProfesional ?? body.tipoDocumento ?? body.tipoDocProfesional ?? body.tipo;
    const numero = body.numeroDocumentoProfesional ?? body.numeroDocumento ?? body.documentoProfesional ?? body.documento ?? body.numDocProfesional ?? body.numero;
    const humanuser = body.humanuser ?? body.humanUser ?? null;
    const payload = buildConsultarProfesionalParametersPayload(tipo, numero, humanuser);
    if (!payload) {
        const err = new Error('Se requiere tipo y número de documento del profesional.');
        err.code = 'PARAMETROS_INCOMPLETOS';
        err.status = 400;
        throw err;
    }
    const tokenOut = await solicitarTokenIhceShared(ambiente);
    const creds = resolveIhceCreds(ambiente === 'prod' ? 'prod' : 'sandbox');
    if (!str(creds.baseUrl) || !str(creds.subscriptionKey)) {
        const err = new Error('Falta BASE_URL o SUBSCRIPTION_KEY IHCE.');
        err.code = 'IHCE_CONFIG_INCOMPLETA';
        err.status = 400;
        throw err;
    }
    const opUrl = `${String(creds.baseUrl).replace(/\/$/, '')}/Practitioner/$consultar-profesional-salud`;
    const ihceResp = await httpsPostFhirJson(opUrl, tokenOut.access_token, creds.subscriptionKey, payload);
    let parsedBody;
    try { parsedBody = ihceResp.body ? JSON.parse(ihceResp.body) : null; } catch (_) { parsedBody = { raw: ihceResp.body }; }
    return {
        ok: ihceResp.status >= 200 && ihceResp.status < 300,
        status: ihceResp.status,
        ambiente: ambiente === 'prod' ? 'produccion' : 'sandbox',
        ihce_url: opUrl,
        request_parameters: payload,
        ihce_response: parsedBody,
    };
}

async function ihceConsultarOrganizacionShared(ambiente, body = {}) {
    const { payload, env_usado } = buildConsultarOrganizacionParameters(ambiente, body);
    const tokenOut = await solicitarTokenIhceShared(ambiente);
    const creds = resolveIhceCreds(ambiente === 'prod' ? 'prod' : 'sandbox');
    if (!str(creds.baseUrl) || !str(creds.subscriptionKey)) {
        const err = new Error('Falta BASE_URL o SUBSCRIPTION_KEY IHCE.');
        err.code = 'IHCE_CONFIG_INCOMPLETA';
        err.status = 400;
        throw err;
    }
    const opUrl = `${String(creds.baseUrl).replace(/\/$/, '')}/Organization/$consultar-organizacion`;
    const ihceResp = await httpsPostFhirJson(opUrl, tokenOut.access_token, creds.subscriptionKey, payload);
    let parsedBody;
    try { parsedBody = ihceResp.body ? JSON.parse(ihceResp.body) : null; } catch (_) { parsedBody = { raw: ihceResp.body }; }
    return {
        ok: ihceResp.status >= 200 && ihceResp.status < 300,
        status: ihceResp.status,
        ambiente: ambiente === 'prod' ? 'produccion' : 'sandbox',
        ihce_url: opUrl,
        request_parameters: payload,
        env_usado,
        ihce_response: parsedBody,
    };
}

module.exports = {
    isForceSandboxOnly,
    isForceProdOnly,
    solicitarTokenIhceShared,
    ihceConsultarProfesionalSaludShared,
    ihceConsultarOrganizacionShared,
};


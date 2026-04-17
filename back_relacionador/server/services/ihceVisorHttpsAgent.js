const https = require('https');
const http = require('http');
const { URL } = require('url');
const { resolveIhceEnv } = require('./ihceVisorCredentials');

function createAgent() {
    return new https.Agent({ rejectUnauthorized: false });
}

/**
 * Petición HTTP(S) con cuerpo string; devuelve objeto tipo Response (ok, status, json, text).
 */
function requestLikeFetch(urlString, options = {}) {
    const u = new URL(urlString);
    const isHttps = u.protocol === 'https:';
    const lib = isHttps ? https : http;
    const agent = isHttps ? createAgent() : undefined;

    return new Promise((resolve, reject) => {
        const req = lib.request(
            {
                hostname: u.hostname,
                port: u.port || (isHttps ? 443 : 80),
                path: u.pathname + (u.search || ''),
                method: options.method || 'GET',
                headers: options.headers || {},
                agent,
            },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    const bodyBuf = Buffer.concat(chunks);
                    const bodyStr = bodyBuf.toString('utf8');
                    const status = res.statusCode || 0;
                    resolve({
                        ok: status >= 200 && status < 300,
                        status,
                        statusText: res.statusMessage || '',
                        headers: res.headers,
                        text: async () => bodyStr,
                        json: async () => JSON.parse(bodyStr),
                    });
                });
            },
        );
        req.on('error', reject);
        if (options.body != null) req.write(options.body);
        req.end();
    });
}

/**
 * Agente compatible con el visor ESM: token OAuth2 y peticiones firmadas a IHCE.
 * Los parámetros clientId/clientSecret/subscriptionKey en las firmas del servicio FHIR se ignoran;
 * siempre se usan las variables de entorno del ambiente elegido.
 */
function createIhceHttpsAgent(ambiente) {
    const creds = resolveIhceEnv(ambiente);

    return {
        creds,

        async getAccessToken() {
            const missing = [
                !creds.tenantId && 'TENANT_ID',
                !creds.clientId && 'CLIENT_ID',
                !creds.clientSecret && 'CLIENT_SECRET',
                !creds.scope && 'SCOPE',
            ].filter(Boolean);
            if (missing.length) {
                throw new Error(`Faltan variables IHCE (${missing.join(', ')}) para el visor.`);
            }

            const tokenUrl = `https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`;
            const body = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: creds.clientId,
                client_secret: creds.clientSecret,
                scope: creds.scope,
            }).toString();

            const response = await requestLikeFetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body),
                },
                body,
            });

            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(
                    `Token IHCE: respuesta no JSON (HTTP ${response.status}): ${String(text).slice(0, 400)}`,
                );
            }
            if (!response.ok) {
                throw new Error(
                    `Token IHCE HTTP ${response.status}: ${(data && (data.error_description || data.error)) || text.slice(0, 300)}`,
                );
            }
            if (!data.access_token) {
                throw new Error(`No se pudo obtener token IHCE: ${JSON.stringify(data)}`);
            }
            return data.access_token;
        },

        async authenticatedRequest(url, token, _subscriptionKeyIgnored, options = {}) {
            const key = creds.subscriptionKey || _subscriptionKeyIgnored;
            if (!key) {
                throw new Error('Falta SUBSCRIPTION_KEY en variables IHCE.');
            }
            const defaultHeaders = {
                Authorization: `Bearer ${token}`,
                'Ocp-Apim-Subscription-Key': key,
                Accept: 'application/json',
            };
            const merged = {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...(options.headers || {}),
                },
            };
            if (merged.body != null && merged.headers['Content-Length'] == null) {
                merged.headers['Content-Length'] = Buffer.byteLength(
                    typeof merged.body === 'string' ? merged.body : String(merged.body),
                );
            }
            return requestLikeFetch(url, merged);
        },

        async authenticatedRequestPOST(url, token, _subscriptionKeyIgnored, bodyObj) {
            const key = creds.subscriptionKey || _subscriptionKeyIgnored;
            if (!key) {
                throw new Error('Falta SUBSCRIPTION_KEY en variables IHCE.');
            }
            const body = JSON.stringify(bodyObj);
            return requestLikeFetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
                body,
            });
        },
    };
}

module.exports = { createIhceHttpsAgent, requestLikeFetch };

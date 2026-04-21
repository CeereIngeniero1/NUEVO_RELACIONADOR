/**
 * RDA Consulta Externa — rutas V2 (token IHCE desde .env).
 *
 * Montaje: router.use(require('./rda/RdaConsultaExternaRoutesv2'));
 *
 * Seguridad: devuelven access_token y respuestas IHCE; restringir en producción (auth de API, red interna).
 *
 * Consulta profesional: POST a IHCE `Practitioner/$consultar-profesional-salud` (cuerpo FHIR Parameters),
 * alineado con colección Interoperabilidad MinSalud Prestadores.
 *
 * Consulta organización: POST a IHCE `Organization/$consultar-organizacion`; parámetros solo desde .env
 * (IHCE_*_CUSTODIAN_NIT / REPS / NAME e IHCE_RDACE_DEFAULT_* como respaldo).
 */
 
 use strict';
 
 onst https = require('https');
 onst { URL, URLSearchParams } = require('url');
 onst Router = require('express').Router;
const { loadDotEnvFromCandidates } = require('../../config/envLoader');
const { resolveIhceCreds } = require('../../services/ihceTokenDebug');

function outboundTimeoutMs() {
    const n = Number(process.env.IHCE_OUTBOUND_TIMEOUT_MS);
    return Number.isFinite(n) && n > 0 ? n : 45000;
}

function httpsPostFormUrlEncoded(urlString, bodyString) {
    return new Promise((resolve, reject) => {
        const ms = outboundTimeoutMs();
        let settled = false;
        let req;
        const finish = (err, val) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (err) reject(err);
            else resolve(val);
        };
        const timer = setTimeout(() => {
            if (req) req.destroy();
            const err = new Error(
                `Token OAuth (Microsoft): tiempo de espera agotado (${ms} ms). Revise red o aumente IHCE_OUTBOUND_TIMEOUT_MS.`
            );
            err.code = 'IHCE_OUTBOUND_TIMEOUT';
            err.status = 504;
            finish(err);
        }, ms);

        const u = new URL(urlString);
        req = https.request(
                {
                    hostname: u.hostname,
                    path: u.pathname + (u.search || ''),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(bodyString, 'utf8'),
                        
                    
                (res) => {
                    let data = '';
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        finish(null, { status: res.statusCode || 0, body: data });
                        
                    
                
            req.on('error', (e) => finish(e));
        req.write(bodyString);
        req.end();
    
    
    
        psPostFhirJson(urlString, accessToken, subscriptionKey, jsonBody) {
             typeof jsonBody === 'string' ? jsonBody : JSON.stringify(jsonBody);
            romise((resolve, reject) => {
             = outboundTimeoutMs();
            let settled = false;
            let req;
            const finish = (err, val) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (err) reject(err);
                else resolve(val);
            };
            const timer = setTimeout(() => {
                if (req) req.destroy();
                const err = new Error(
                    `Llamada FHIR IHCE: tiempo de espera agotado (${ms} ms). Revise IHCE_*_BASE_URL, red o aumente IHCE_OUTBOUND_TIMEOUT_MS.`
                );
                err.code = 'IHCE_OUTBOUND_TIMEOUT';
                err.status = 504;
                finish(err);
            }, ms);

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
                            
                            
                        ) => {
                        let data = '';
                        res.setEncoding('utf8');
                        res.on('data', (chunk) => { data += chunk; });
                        res.on('end', () => {
                            finish(null, { status: res.statusCode || 0, body: data });
                        });
                            
                        
                    on('error', (e) => finish(e));
                req.write(body);
            req.end();
            
                
                
                s para $consultar-profesional-salud (tipo + número documento del profesional). */
                tarProfesionalParametersPayload(tipoDocumento, numeroDocumento, humanuser) {
                ing(tipoDocumento || '').trim().toUpperCase();
            String(numeroDocumento || '').trim();
        o || !num) return null;
        rameter = [
            
            : 'identifier',
            : [
            { name: 'type', valueString: tipo },
                me: 'value', valueString: num },
            
        
    
    humanuser != null && String(humanuser).trim() !== '') {
    parameter.push({ name: 'humanuser', valueString: String(humanuser).trim() });
    
    return { resourceType: 'Parameters', parameter };
}

function firstEnvKey(...keys) {
    for (let i = 0; i < keys.length; i += 1) {
        const v = process.env[keys[i]];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

/**
 * Parameters para Organization/$consultar-organizacion (colección Prestadores).
 * Sin body HTTP: NIT, código habilitación (REPS) y nombre salen del .env.
 */
function buildConsultarOrganizacionParametersFromEnv(ambiente) {
    const prod = ambiente === 'prod';
    const pfx = prod ? 'IHCE_PROD_' : 'IHCE_SANDBOX_';
                let taxId = firstEnvKey(`${pfx}CUSTODIAN_NIT`, 'IHCE_RDACE_DEFAULT_NIT_IPS');
                let reps = firstEnvKey(`${pfx}CUSTODIAN_REPS`, 'IHCE_RDACE_DEFAULT_CODIGO_PRESTADOR');
                let name = firstEnvKey(`${pfx}CUSTODIAN_NAME`, 'IHCE_RDACE_DEFAULT_NOMBRE_IPS');
                // Mismo prestador: a menudo solo existen IHCE_SANDBOX_CUSTODIAN_*; en prod reutilizar por campo si falta PROD_*.
                if (prod) {
                    if (!taxId) taxId = firstEnvKey('IHCE_SANDBOX_CUSTODIAN_NIT');
                    if (!reps) reps = firstEnvKey('IHCE_SANDBOX_CUSTODIAN_REPS');
                    if (!name) name = firstEnvKey('IHCE_SANDBOX_CUSTODIAN_NAME');
                }
                if (!taxId && !reps && !name) {
                    const err = new Error(
                        `Defina al menos uno en .env: ${pfx}CUSTODIAN_NIT, ${pfx}CUSTODIAN_REPS o ${pfx}CUSTODIAN_NAME ` +
                        '(o IHCE_RDACE_DEFAULT_*). En producción, si no hay IHCE_PROD_CUSTODIAN_*, se intentan IHCE_SANDBOX_CUSTODIAN_* por campo.'
        );
                    err.code = 'ORG_ENV_INCOMPLETO';
                    err.status = 400;
                    throw err;
                        
                        ter = [];
    if (taxId) parameter.push({ name: 'TaxIdentifier', valueString: taxId });
                    reps) parameter.push({ name: 'HealthcareProviderIdentifier', valueString: reps });
                    name) parameter.push({ name: 'name', valueString: name });
                return {
            payload: { resourceType: 'Parameters', parameter },
        env_usado: {
            TaxIdentifier: taxId || null,
            HealthcareProviderIdentifier: reps || null,
                    name: name || null,
                },
            };
            
                
                    on solicitarTokenIhce(ambiente) {
                    eds = resolveIhceCreds(ambiente === 'prod' ? 'prod' : 'sandbox');
                        g = [
                        enantId && 'TENANT_ID (IHCE_SANDBOX_TENANT_ID / IHCE_PROD_TENANT_ID o alias)',
                    ds.clientId && 'CLIENT_ID',
                !creds.clientSecret && 'CLIENT_SECRET',
                !creds.scope && 'SCOPE',
            ].filter(Boolean);
                missing.length) {
                const err = new Error(`Faltan variables en .env: ${missing.join(', ')}`);
                    err.code = 'IHCE_ENV_INCOMPLETO';
                    err.status = 400;
                    throw err;
                    
                
                const tokenUrl = `https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`;
                const body = new URLSearchParams({
        grant_type: 'client_credentials',
                    client_id: creds.clientId,
                    client_secret: creds.clientSecret,
                    scope: creds.scope,
                }).toString();
            
                const resp = await httpsPostFormUrlEncoded(tokenUrl, body);
                let parsed;
                try {
                    parsed = JSON.parse(resp.body);
                } catch (_) {
                    const err = new Error('Respuesta del token no es JSON válido');
                    err.code = 'TOKEN_RESPUESTA_INVALIDA';
                        status = 502;
                        ils = resp.body;
                    throw err;
                    
                    
                    resp.status < 200 || resp.status >= 300) {
                    const err = new Error(parsed.error_description || parsed.error || `Token HTTP ${resp.status}`);
                    err.code = 'TOKEN_IHCE_ERROR';
                    err.status = resp.status >= 400 && resp.status < 600 ? resp.status : 502;
                    err.details = parsed;
                    throw err;
                }
                    
                    rn {
                        ente: ambiente === 'prod' ? 'produccion' : 'sandbox',
                        refix: creds.envPrefix,
                        n_url: tokenUrl,
                    ihce_base_url: creds.baseUrl || null,
                    subscription_key_configurada: Boolean(creds.subscriptionKey && String(creds.subscriptionKey).trim()),
                    token_type: parsed.token_type || null,
        expires_in: parsed.expires_in != null ? parsed.expires_in : null,
                    ext_expires_in: parsed.ext_expires_in != null ? parsed.ext_expires_in : null,
                    access_token: parsed.access_token || null,
                    scope_respuesta: parsed.scope || null,
                    
                
                
            async function ihceConsultarProfesionalSalud(ambiente, body) {
    const tipo =
                    body.tipoDocumentoProfesional
                    ?? body.tipoDocumento
                    ?? body.tipoDocProfesional
                    ?? body.tipo;
                const numero =
                    body.numeroDocumentoProfesional
                    ?? body.numeroDocumento
                    ?? body.documentoProfesional
                    ?? body.documento
                    ?? body.numDocProfesional
                    ?? body.numero;
                    t humanuser = body.humanuser ?? body.humanUser ?? null;
                        
                        d = buildConsultarProfesionalParametersPayload(tipo, numero, humanuser);
                    !payload) {
                    const err = new Error(
                        'Se requiere tipo y número de documento del profesional (p. ej. tipoDocumento + numeroDocumento, o tipoDocumentoProfesional + numeroDocumentoProfesional).'
                    );
                    err.code = 'PARAMETROS_INCOMPLETOS';
                    err.status = 400;
                    throw err;
                }
                
                const tokenOut = await solicitarTokenIhce(ambiente === 'prod' ? 'prod' : 'sandbox');
                    !tokenOut.access_token) {
                    const err = new Error('No se obtuvo access_token');
                        status = 502;
                        w err;
                        
                    
                const creds = resolveIhceCreds(ambiente === 'prod' ? 'prod' : 'sandbox');
                if (!creds.baseUrl || !String(creds.baseUrl).trim()) {
        const err = new Error('Falta IHCE_*_BASE_URL (o alias) en .env para llamar a la API FHIR.');
                err.code = 'IHCE_BASE_URL_FALTANTE';
                err.status = 400;
        throw err;
    }
            if (!creds.subscriptionKey || !String(creds.subscriptionKey).trim()) {
                const err = new Error('Falta SUBSCRIPTION_KEY IHCE en .env.');
                err.code = 'IHCE_SUBSCRIPTION_KEY_FALTANTE';
                err.status = 400;
                    w err;
                        
                        
                         String(creds.baseUrl).replace(/\/$/, '');
                        = `${base}/Practitioner/$consultar-profesional-salud`;
                             await httpsPostFhirJson(
                            
                            ess_token,
                            iptionKey,
                            
                        
                    
                    edBody;
                        
                        dy = ihceResp.body ? JSON.parse(ihceResp.body) : null;
                        {
                        dy = { raw: ihceResp.body };
                            
                        
                    
                ok: ihceResp.status >= 200 && ihceResp.status < 300,
                status: ihceResp.status,
                ambiente: ambiente === 'prod' ? 'produccion' : 'sandbox',
                ihce_url: opUrl,
                request_parameters: payload,
                ihce_response: parsedBody,
    };
}

            c function ihceConsultarOrganizacion(ambiente) {
            const { payload, env_usado } = buildConsultarOrganizacionParametersFromEnv(ambiente);
            
            const tokenOut = await solicitarTokenIhce(ambiente === 'prod' ? 'prod' : 'sandbox');
                !tokenOut.access_token) {
                    t err = new Error('No se obtuvo access_token');
                    status = 502;
                        r;
                        
                    
                t creds = resolveIhceCreds(ambiente === 'prod' ? 'prod' : 'sandbox');
            if (!creds.baseUrl || !String(creds.baseUrl).trim()) {
                const err = new Error('Falta IHCE_*_BASE_URL (o alias) en .env para llamar a la API FHIR.');
                err.code = 'IHCE_BASE_URL_FALTANTE';
                err.status = 400;
                throw err;
            }
    if (!creds.subscriptionKey || !String(creds.subscriptionKey).trim()) {
        const err = new Error('Falta SUBSCRIPTION_KEY IHCE en .env.');
        err.code = 'IHCE_SUBSCRIPTION_KEY_FALTANTE';
        err.status = 400;
        throw err;
    }
    
        const base = String(creds.baseUrl).replace(/\/$/, '');
            t opUrl = `${base}/Organization/$consultar-organizacion`;
            t ihceResp = await httpsPostFhirJson(
            opUrl,
            tokenOut.access_token,
            creds.subscriptionKey,
            payload
            
            
            parsedBody;
            {
            parsedBody = ihceResp.body ? JSON.parse(ihceResp.body) : null;
        } catch (_) {
        parsedBody = { raw: ihceResp.body };
        }
        
            rn {
                ihceResp.status >= 200 && ihceResp.status < 300,
            status: ihceResp.status,
            ambiente: ambiente === 'prod' ? 'produccion' : 'sandbox',
            ihce_url: opUrl,
            request_parameters: payload,
            env_usado,
        ihce_response: parsedBody,
        };
        
            
            const router = Router();
                
router.post('/RdaConsultaExterna/IhceToken/sandbox', async (req, res) => {
                try {
                    loadDotEnvFromCandidates();
                    const out = await solicitarTokenIhce('sandbox');
                    if (!out.access_token) {
                        return res.status(502).json({ ok: false, error: 'Respuesta sin access_token', details: out });
                    }
        return res.json({ ok: true, ...out });
                } catch (e) {
                    const status = e.status || 500;
                    if (e.code === 'IHCE_ENV_INCOMPLETO') {
                        return res.status(status).json({ ok: false, error: e.message, code: e.code });
                    }
                    return res.status(status).json({
                        ok: false,
                        error: e.message || String(e),
                        code: e.code || undefined,
                        ...(e.details ? { details: e.details } : {}),
                    });
                    
                

                er.post('/RdaConsultaExterna/IhceToken/produccion', async (req, res) => {
                try {
                    loadDotEnvFromCandidates();
                    const forceSandboxOnly = ['1', 'true', 'yes', 'on'].includes(
                        String(process.env.IHCE_FORCE_SANDBOX_ONLY || '').trim().toLowerCase()
                    );
                    if (forceSandboxOnly) {
                        return res.status(403).json({
                ok: false,
                            code: 'IHCE_FORCE_SANDBOX_ONLY',
                            error: 'IHCE_FORCE_SANDBOX_ONLY está activo: no se permite solicitar token de producción desde este endpoint.',
                        });
                    }
                    const out = await solicitarTokenIhce('prod');
                    if (!out.access_token) {
            return res.status(502).json({ ok: false, error: 'Respuesta sin access_token', details: out });
                    }
                    return res.json({ ok: true, ...out });
                    tch (e) {
                    const status = e.status || 500;
                    if (e.code === 'IHCE_ENV_INCOMPLETO') {
                        return res.status(status).json({ ok: false, error: e.message, code: e.code });
                    }
                    return res.status(status).json({
                        ok: false,
                        error: e.message || String(e),
            code: e.code || undefined,
                        ...(e.details ? { details: e.details } : {}),
                    });
    }
                
                
                    ost('/RdaConsultaExterna/IhceConsultarProfesional/sandbox', async (req, res) => {
                    {
                    loadDotEnvFromCandidates();
                    const out = await ihceConsultarProfesionalSalud('sandbox', req.body || {});
        const httpStatus = out.status > 0 ? out.status : 502;
                    return res.status(httpStatus).json(out);
                } catch (e) {
                    const status = e.status || 500;
                    return res.status(status).json({
                        ok: false,
                        error: e.message || String(e),
                        code: e.code || undefined,
                    });
                    
                    
                    
                    ost('/RdaConsultaExterna/IhceConsultarProfesional/produccion', async (req, res) => {
                try {
        loadDotEnvFromCandidates();
                    const forceSandboxOnly = ['1', 'true', 'yes', 'on'].includes(
                        String(process.env.IHCE_FORCE_SANDBOX_ONLY || '').trim().toLowerCase()
                    );
                    if (forceSandboxOnly) {
                        return res.status(403).json({
                            ok: false,
                            code: 'IHCE_FORCE_SANDBOX_ONLY',
                            error: 'IHCE_FORCE_SANDBOX_ONLY está activo: no se permite consultar profesional en producción desde este endpoint.',
            });
                    }
                    const out = await ihceConsultarProfesionalSalud('prod', req.body || {});
                    const httpStatus = out.status > 0 ? out.status : 502;
                    return res.status(httpStatus).json(out);
                    tch (e) {
                    const status = e.status || 500;
        return res.status(status).json({
                        ok: false,
                        error: e.message || String(e),
                        code: e.code || undefined,
                    });
                    
                    
                    
                    ost('/RdaConsultaExterna/IhceConsultarOrganizacion/sandbox', async (req, res) => {
                try {
                    loadDotEnvFromCandidates();
        const out = await ihceConsultarOrganizacion('sandbox');
            const httpStatus = out.status > 0 ? out.status : 502;
            return res.status(httpStatus).json(out);
        } catch (e) {
        const status = e.status || 500;
            return res.status(status).json({
                ok: false,
                error: e.message || String(e),
                code: e.code || undefined,
            });
            
        
        
            nction handleIhceConsultarOrganizacionProduccion(req, res) {
            {
            loadDotEnvFromCandidates();
            const forceSandboxOnly = ['1', 'true', 'yes', 'on'].includes(
                String(process.env.IHCE_FORCE_SANDBOX_ONLY || '').trim().toLowerCase()
        );
                if (forceSandboxOnly) {
                    return res.status(403).json({
                        ok: false,
                        code: 'IHCE_FORCE_SANDBOX_ONLY',
                        error: 'IHCE_FORCE_SANDBOX_ONLY está activo: no se permite consultar organización en producción desde este endpoint.',
                    });
                }
                    t out = await ihceConsultarOrganizacion('prod');
                        tpStatus = out.status > 0 ? out.status : 502;
                        es.status(httpStatus).json(out);
                        {
                    t status = e.status || 500;
                return res.status(status).json({
                    ok: false,
                    error: e.message || String(e),
                    code: e.code || undefined,
                });
                
                
                    
                    '/RdaConsultaExterna/IhceConsultarOrganizacion/produccion', handleIhceConsultarOrganizacionProduccion);
                    r URL mal escrita (p. ej. `/produc` sin `cion`); preferir `/produccion`. */
                ost('/RdaConsultaExterna/IhceConsultarOrganizacion/produc', handleIhceConsultarOrganizacionProduccion);
            
        module.exports = router;        
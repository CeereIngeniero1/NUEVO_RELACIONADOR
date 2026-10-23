'use strict';

/**
 * Diagnóstico IHCE (equivalente a Postman InteropAPI Minsalud Sandbox).
 * Solo rutas de consulta / token / terminología. PROHIBIDO cualquier $enviar-*.
 */
const https = require('https');
const { URL } = require('url');
const Router = require('express').Router;
const router = Router();

const {
    solicitarTokenIhceShared,
    ihceConsultarOrganizacionShared,
    ihceConsultarProfesionalSaludShared,
} = require('../../rda/ihceInteropService');
const { normalizeAmbiente, sanitizeEmpresa } = require('../../utils/ihceCredenciales');

/** Operaciones permitidas (colección Postman sin envíos). */
const ALLOWED = Object.freeze({
    'obtener-token': { method: 'TOKEN', path: null },
    'consultar-organizacion': { method: 'POST', path: '/Organization/$consultar-organizacion' },
    'consultar-eapb': { method: 'POST', path: '/Organization/$consultar-eapb' },
    'consultar-paciente-exacto': { method: 'POST', path: '/Patient/$consultar-paciente-exacto' },
    'consultar-paciente-similar': { method: 'POST', path: '/Patient/$consultar-paciente-similar' },
    'consultar-profesional-salud': { method: 'POST', path: '/Practitioner/$consultar-profesional-salud' },
    'consultar-inmunizacion': { method: 'POST', path: '/Immunization/$consultar-inmunizacion' },
    'consultar-dispensacion-paciente': {
        method: 'POST',
        path: '/MedicationDispense/$consultar-dispensacion-paciente',
    },
    'listar-rdas-pacientes-composition': {
        method: 'POST',
        path: '/Composition/$consultar-rda-paciente',
    },
    'listar-rdas-encuentros-clinicos-composition': {
        method: 'POST',
        path: '/Composition/$consultar-rda-encuentros-clinicos',
    },
    'listar-document-reference-index': {
        method: 'POST',
        path: '/DocumentReference/$document-reference-index-query',
    },
    'terminologia-lookup': { method: 'POST', path: '/CodeSystem/$lookup' },
    'terminologia-consultar-codificacion': { method: 'GET', path: '/CodeSystem/IUM' },
    'terminologia-consultar-codificaciones-modificadas': {
        method: 'GET',
        path: '/CodeSystem',
        query: 'since=2026-04-01',
    },
    'terminologia-validate-code': {
        method: 'GET',
        path: '/CodeSystem/IUM/$validate-code',
        queryFromBody: true,
    },
    'consultar-rda-por-id-composition': {
        method: 'GET',
        pathTemplate: '/Composition/{id}/$document',
    },
});

const BLOCKED_HINT =
    'Operación de envío bloqueada en este módulo (enviar-rda-*, nota-aclaratoria, etc.). '
    + 'Use Asignar RIPS & RDA / Envío pendientes para envíos.';

function str(v) {
    return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function outboundTimeoutMs() {
    const n = Number(process.env.IHCE_OUTBOUND_TIMEOUT_MS);
    return Number.isFinite(n) && n > 0 ? n : 45000;
}

function httpsFhir(method, urlString, accessToken, subscriptionKey, jsonBody) {
    const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
    const body = hasBody
        ? (typeof jsonBody === 'string' ? jsonBody : JSON.stringify(jsonBody || {}))
        : null;
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
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            Accept: 'application/fhir+json',
        };
        if (hasBody) {
            headers['Content-Type'] = 'application/fhir+json';
            headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
        }

        req = https.request(
            {
                hostname: u.hostname,
                path: u.pathname + (u.search || ''),
                method,
                headers,
            },
            (res) => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => finish(null, { status: res.statusCode || 0, body: data }));
            }
        );
        req.on('error', (e) => finish(e));
        if (hasBody) req.write(body);
        req.end();
    });
}

function isSendLike(opId) {
    const s = String(opId || '').toLowerCase();
    return /enviar|nota-aclaratoria|\$enviar/.test(s);
}

function buildPatientParameters(body) {
    const tipo = str(body.tipoDocumento || body.tipo || 'CC').toUpperCase();
    const value = str(body.numeroDocumento || body.documento || body.value);
    const humanuser = str(body.humanuser || body.humanUser || '');
    if (!value) {
        const err = new Error('numeroDocumento (paciente) es obligatorio');
        err.status = 400;
        throw err;
    }
    const parameter = [
        {
            name: 'identifier',
            part: [
                { name: 'type', valueString: tipo },
                { name: 'value', valueString: value },
            ],
        },
    ];
    if (humanuser) parameter.push({ name: 'humanuser', valueString: humanuser });
    return { resourceType: 'Parameters', parameter };
}

function resolveAmbAndDoc(body) {
    const amb = normalizeAmbiente(body.ambiente || body.Ambiente || 'sandbox');
    const doc = sanitizeEmpresa(body.documentoEmpresa || body.DocumentoEmpresa || '');
    return { amb, doc };
}

/** GET /apiV3/Rda/ihce-diagnostico/operaciones */
router.get('/Rda/ihce-diagnostico/operaciones', (req, res) => {
    const list = Object.keys(ALLOWED).map((id) => ({
        id,
        method: ALLOWED[id].method,
        path: ALLOWED[id].path || ALLOWED[id].pathTemplate || '(token OAuth)',
        descripcion:
            id === 'obtener-token'
                ? 'OAuth client_credentials con CredencialesIhce (BD)'
                : `IHCE ${ALLOWED[id].method} ${ALLOWED[id].path || ALLOWED[id].pathTemplate}`,
    }));
    return res.json({
        ok: true,
        fuente: 'CredencialesIhce (BD) — el .env IHCE_* no se usa para estas pruebas',
        bloqueado: [
            'enviar-rda-paciente',
            'enviar-rda-consulta-externa',
            'enviar-rda-hospitalizacion',
            'enviar-rda-urgencias',
            'enviar-nota-aclaratoria',
        ],
        operaciones: list,
    });
});

/**
 * POST /apiV3/Rda/ihce-diagnostico/probar
 * body: { operacion, ambiente, documentoEmpresa, ...params }
 */
router.post('/Rda/ihce-diagnostico/probar', async (req, res) => {
    const started = Date.now();
    try {
        const body = req.body || {};
        const opId = str(body.operacion || body.op || body.id).toLowerCase();

        if (!opId) {
            return res.status(400).json({ ok: false, error: 'operacion es requerida' });
        }
        if (isSendLike(opId) || !ALLOWED[opId]) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_DIAG_ENVIO_BLOQUEADO',
                error: BLOCKED_HINT,
                operacion: opId,
            });
        }

        const { amb, doc } = resolveAmbAndDoc(body);
        const spec = ALLOWED[opId];

        if (opId === 'obtener-token') {
            const tokenOut = await solicitarTokenIhceShared(amb, doc);
            return res.json({
                ok: true,
                operacion: opId,
                ambiente: amb,
                documentoEmpresa: doc || tokenOut._meta?.documentoEmpresa || null,
                ms: Date.now() - started,
                fuente: 'CredencialesIhce (BD)',
                resultado: {
                    token_type: tokenOut.token_type,
                    expires_in: tokenOut.expires_in,
                    scope_respuesta: tokenOut.scope_respuesta,
                    ihce_base_url: tokenOut.ihce_base_url,
                    subscription_key_configurada: tokenOut.subscription_key_configurada,
                    access_token_preview: tokenOut.access_token
                        ? `${String(tokenOut.access_token).slice(0, 24)}…`
                        : null,
                },
            });
        }

        if (opId === 'consultar-organizacion') {
            const out = await ihceConsultarOrganizacionShared(amb, {
                ...body,
                documentoEmpresa: doc || body.documentoEmpresa,
            });
            return res.json({
                ok: out.ok,
                operacion: opId,
                ambiente: amb,
                documentoEmpresa: doc || null,
                ms: Date.now() - started,
                ihce_url: out.ihce_url,
                status: out.status,
                request: out.request_parameters,
                env_usado: out.env_usado,
                response: out.ihce_response,
            });
        }

        if (opId === 'consultar-profesional-salud') {
            const out = await ihceConsultarProfesionalSaludShared(amb, { ...body, documentoEmpresa: doc });
            return res.json({
                ok: out.ok,
                operacion: opId,
                ambiente: amb,
                documentoEmpresa: doc || null,
                ms: Date.now() - started,
                ihce_url: out.ihce_url,
                status: out.status,
                request: out.request_parameters,
                response: out.ihce_response,
            });
        }

        // Resto: token + POST/GET genérico
        const tokenOut = await solicitarTokenIhceShared(amb, doc);
        const baseUrl = String(tokenOut._meta?.baseUrl || '').replace(/\/$/, '');
        const subKey = tokenOut._meta?.subscriptionKey || '';
        if (!baseUrl || !subKey) {
            return res.status(400).json({
                ok: false,
                error: 'Falta BASE_URL o SUBSCRIPTION_KEY en CredencialesIhce',
            });
        }

        let path = spec.path || '';
        if (spec.pathTemplate) {
            const idComp = str(body.compositionId || body.idComposition || body.id);
            if (!idComp) {
                return res.status(400).json({ ok: false, error: 'compositionId es obligatorio' });
            }
            path = spec.pathTemplate.replace('{id}', encodeURIComponent(idComp));
        }

        let query = spec.query || '';
        if (spec.queryFromBody) {
            const code = str(body.code || '1A1000101000100');
            query = `code=${encodeURIComponent(code)}`;
        }
        if (body.since) {
            query = `since=${encodeURIComponent(str(body.since))}`;
        }

        const url = `${baseUrl}${path}${query ? `?${query}` : ''}`;

        let payload = body.parameters || body.payload || null;
        if (
            !payload
            && (opId === 'consultar-paciente-exacto' || opId === 'consultar-paciente-similar')
        ) {
            payload = buildPatientParameters(body);
        }
        if (!payload && spec.method === 'POST') {
            // Si no hay payload, intentar Parameters vacíos solo para terminología-lookup con code
            if (opId === 'terminologia-lookup') {
                const system = str(body.system || 'http://id.who.int/icd/release/11/mms');
                const code = str(body.code || '');
                payload = {
                    resourceType: 'Parameters',
                    parameter: [
                        { name: 'system', valueUri: system },
                        ...(code ? [{ name: 'code', valueCode: code }] : []),
                    ],
                };
            } else if (
                opId === 'listar-document-reference-index'
                || opId === 'listar-rdas-pacientes-composition'
                || opId === 'listar-rdas-encuentros-clinicos-composition'
                || opId === 'consultar-dispensacion-paciente'
                || opId === 'consultar-inmunizacion'
                || opId === 'consultar-eapb'
            ) {
                if (body.numeroDocumento || body.documento) {
                    payload = buildPatientParameters(body);
                } else if (typeof body.parametersJson === 'string' && body.parametersJson.trim()) {
                    payload = JSON.parse(body.parametersJson);
                } else {
                    return res.status(400).json({
                        ok: false,
                        error:
                            'Envíe numeroDocumento (+ humanuser) o parameters/parametersJson (FHIR Parameters)',
                    });
                }
            } else {
                return res.status(400).json({
                    ok: false,
                    error: 'Envíe parameters o parametersJson (FHIR Parameters)',
                });
            }
        }

        const ihceResp = await httpsFhir(
            spec.method,
            url,
            tokenOut.access_token,
            subKey,
            spec.method === 'POST' ? payload : null
        );
        let parsed;
        try {
            parsed = ihceResp.body ? JSON.parse(ihceResp.body) : null;
        } catch (_) {
            parsed = { raw: ihceResp.body };
        }

        return res.json({
            ok: ihceResp.status >= 200 && ihceResp.status < 300,
            operacion: opId,
            ambiente: amb,
            documentoEmpresa: doc || tokenOut._meta?.documentoEmpresa || null,
            ms: Date.now() - started,
            ihce_url: url,
            status: ihceResp.status,
            request: payload,
            response: parsed,
        });
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({
            ok: false,
            error: err.message || String(err),
            code: err.code,
            ms: Date.now() - started,
            details: err.details || undefined,
        });
    }
});

module.exports = router;

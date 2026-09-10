'use strict';

const Router = require('express').Router;
const {
    listIhceCredentialsByEmpresa,
    upsertIhceCredentials,
    sanitizeEmpresa,
    normalizeAmbiente,
} = require('../../utils/ihceCredenciales');

const router = Router();

/**
 * GET /Rda/credenciales-ihce/:documentoEmpresa
 * Devuelve sandbox + prod (secretos enmascarados).
 */
router.get('/Rda/credenciales-ihce/:documentoEmpresa', async (req, res) => {
    try {
        const doc = sanitizeEmpresa(req.params.documentoEmpresa);
        if (!doc) {
            return res.status(400).json({ ok: false, error: 'documentoEmpresa requerido' });
        }
        const data = await listIhceCredentialsByEmpresa(doc);
        return res.json({ ok: true, ...data });
    } catch (err) {
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message || String(err),
            code: err.code,
        });
    }
});

/**
 * PUT /Rda/credenciales-ihce/:documentoEmpresa
 * Body: { ambiente: 'sandbox'|'prod', baseUrl, tenantId, clientId, clientSecret?,
 *         scope, subscriptionKey?, custodianReps, custodianNit, custodianName }
 * Secretos vacíos = no cambiar.
 */
router.put('/Rda/credenciales-ihce/:documentoEmpresa', async (req, res) => {
    try {
        const doc = sanitizeEmpresa(req.params.documentoEmpresa);
        if (!doc) {
            return res.status(400).json({ ok: false, error: 'documentoEmpresa requerido' });
        }
        const body = req.body || {};
        const ambiente = normalizeAmbiente(body.ambiente || body.Ambiente || 'sandbox');
        const saved = await upsertIhceCredentials(doc, ambiente, {
            baseUrl: body.baseUrl ?? body['Base Url'],
            tenantId: body.tenantId ?? body['Tenant Id'],
            clientId: body.clientId ?? body['Client Id'],
            clientSecret: body.clientSecret ?? body['Client Secret'],
            scope: body.scope ?? body.Scope,
            subscriptionKey: body.subscriptionKey ?? body['Subscription Key'],
            custodianReps: body.custodianReps ?? body['Custodian Reps'],
            custodianNit: body.custodianNit ?? body['Custodian Nit'],
            custodianName: body.custodianName ?? body['Custodian Name'],
        });
        return res.json({
            ok: true,
            message: `Credenciales IHCE ${ambiente} guardadas`,
            credenciales: saved,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message || String(err),
            code: err.code,
        });
    }
});

module.exports = router;

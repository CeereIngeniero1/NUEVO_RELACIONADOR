'use strict';

const Router = require('express').Router;
const {
    listIhceCredentialsByEmpresa,
    upsertIhceCredentials,
    sanitizeEmpresa,
    normalizeAmbiente,
    ensureCredencialesIhceTable,
    credencialesIhceTableExists,
    isCredencialesIhceTableMissingError,
} = require('../../utils/ihceCredenciales');

const router = Router();

/**
 * POST /Rda/credenciales-ihce/ensure-table
 * Crea dbo.CredencialesIhce si no existe (idempotente) y siembra filas vacías por Empresa.
 */
router.post('/Rda/credenciales-ihce/ensure-table', async (req, res) => {
    try {
        const seedEmpresas = !['0', 'false', 'no', 'off'].includes(
            String(req.body?.seedEmpresas ?? 'true').trim().toLowerCase()
        );
        const result = await ensureCredencialesIhceTable({ seedEmpresas });
        return res.json(result);
    } catch (err) {
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message || String(err),
            code: err.code || 'IHCE_ENSURE_TABLE_ERROR',
        });
    }
});

/**
 * GET /Rda/credenciales-ihce/status
 * Indica si la tabla existe (sin secretos).
 */
router.get('/Rda/credenciales-ihce/status', async (req, res) => {
    try {
        const exists = await credencialesIhceTableExists();
        return res.json({ ok: true, tableExists: exists });
    } catch (err) {
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message || String(err),
            code: err.code,
        });
    }
});

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
        const status = err.code === 'IHCE_TABLA_AUSENTE' ? 409 : (err.status || 500);
        return res.status(status).json({
            ok: false,
            error: err.message || String(err),
            code: err.code || (isCredencialesIhceTableMissingError(err) ? 'IHCE_TABLA_AUSENTE' : undefined),
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
        const status = err.code === 'IHCE_TABLA_AUSENTE' ? 409 : (err.status || 500);
        return res.status(status).json({
            ok: false,
            error: err.message || String(err),
            code: err.code || (isCredencialesIhceTableMissingError(err) ? 'IHCE_TABLA_AUSENTE' : undefined),
        });
    }
});

module.exports = router;

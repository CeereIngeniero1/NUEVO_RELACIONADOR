'use strict';

const express = require('express');
const {
    isForceSandboxOnly,
    isForceProdOnly,
    solicitarTokenIhceShared,
    ihceConsultarProfesionalSaludShared,
    ihceConsultarOrganizacionShared,
} = require('../../rda/ihceInteropService');

const router = express.Router();

router.post('/RdaLogin/IhceToken/sandbox', async (req, res) => {
    try {
        if (isForceProdOnly()) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_PROD_ONLY',
                error: 'Sandbox deshabilitado por seguridad (IHCE_FORCE_PROD_ONLY=true).',
            });
        }
        const out = await solicitarTokenIhceShared('sandbox');
        return res.json({ ok: true, ...out });
    } catch (e) {
        return res.status(e.status || 500).json({ ok: false, error: e.message, code: e.code || 'TOKEN_ERROR', details: e.details || null });
    }
});

router.post('/RdaLogin/IhceToken/produccion', async (req, res) => {
    try {
        if (isForceSandboxOnly()) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_SANDBOX_ONLY',
                error: 'Producción deshabilitada por seguridad (IHCE_FORCE_SANDBOX_ONLY=true).',
            });
        }
        const out = await solicitarTokenIhceShared('prod');
        return res.json({ ok: true, ...out });
    } catch (e) {
        return res.status(e.status || 500).json({ ok: false, error: e.message, code: e.code || 'TOKEN_ERROR', details: e.details || null });
    }
});

router.post('/RdaLogin/IhceConsultarProfesional/sandbox', async (req, res) => {
    try {
        if (isForceProdOnly()) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_PROD_ONLY',
                error: 'Sandbox deshabilitado por seguridad (IHCE_FORCE_PROD_ONLY=true).',
            });
        }
        const out = await ihceConsultarProfesionalSaludShared('sandbox', req.body || {});
        return res.status(out.status >= 200 && out.status < 300 ? 200 : out.status).json(out);
    } catch (e) {
        return res.status(e.status || 500).json({ ok: false, error: e.message, code: e.code || 'CONSULTA_PROFESIONAL_ERROR', details: e.details || null });
    }
});

router.post('/RdaLogin/IhceConsultarProfesional/produccion', async (req, res) => {
    try {
        if (isForceSandboxOnly()) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_SANDBOX_ONLY',
                error: 'Producción deshabilitada por seguridad (IHCE_FORCE_SANDBOX_ONLY=true).',
            });
        }
        const out = await ihceConsultarProfesionalSaludShared('prod', req.body || {});
        return res.status(out.status >= 200 && out.status < 300 ? 200 : out.status).json(out);
    } catch (e) {
        return res.status(e.status || 500).json({ ok: false, error: e.message, code: e.code || 'CONSULTA_PROFESIONAL_ERROR', details: e.details || null });
    }
});

router.post('/RdaLogin/IhceConsultarOrganizacion/sandbox', async (req, res) => {
    try {
        if (isForceProdOnly()) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_PROD_ONLY',
                error: 'Sandbox deshabilitado por seguridad (IHCE_FORCE_PROD_ONLY=true).',
            });
        }
        const out = await ihceConsultarOrganizacionShared('sandbox');
        return res.status(out.status >= 200 && out.status < 300 ? 200 : out.status).json(out);
    } catch (e) {
        return res.status(e.status || 500).json({ ok: false, error: e.message, code: e.code || 'CONSULTA_ORGANIZACION_ERROR', details: e.details || null });
    }
});

router.post('/RdaLogin/IhceConsultarOrganizacion/produccion', async (req, res) => {
    try {
        if (isForceSandboxOnly()) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_SANDBOX_ONLY',
                error: 'Producción deshabilitada por seguridad (IHCE_FORCE_SANDBOX_ONLY=true).',
            });
        }
        const out = await ihceConsultarOrganizacionShared('prod');
        return res.status(out.status >= 200 && out.status < 300 ? 200 : out.status).json(out);
    } catch (e) {
        return res.status(e.status || 500).json({ ok: false, error: e.message, code: e.code || 'CONSULTA_ORGANIZACION_ERROR', details: e.details || null });
    }
});

module.exports = router;


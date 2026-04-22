/**
 * Envío masivo de RDA pendientes (Paciente + Consulta Externa).
 * GET listados por [Fecha RDA]; POST reenvía en serie a EnviarIHCE (legacy) o rutas V2 si RDA_ENVIO_MASIVO_VERSION=v2.
 */
'use strict';

const http = require('http');
const Router = require('express').Router;
const { sql, poolPromise } = require('../../db2');
const { loadDotEnvFromCandidates } = require('../../config/envLoader');
const { buildIhceTokenRequestDebug } = require('../../services/ihceTokenDebug');

const router = Router();

const MAX_IDS = 50;
const BODY_TRUNC = 4000;
const FORCE_SANDBOX_ONLY = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.IHCE_FORCE_SANDBOX_ONLY || '').trim().toLowerCase()
);
const FORCE_PROD_ONLY = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.IHCE_FORCE_PROD_ONLY || '').trim().toLowerCase()
);

/**
 * `legacy` (default): POST interno a `/RdaPaciente/EnviarIHCE` y `/RdaConsultaExterna/EnviarIHCE` con `ambiente` en body.
 * `v2`: delega a las rutas V2 (`/RdaPacienteV2/EnviarIhce*V2` y CE `.../EnviarIhce*V2`, sin `ambiente` en body).
 * Alinear con el piloto: `RDA_ENVIO_MASIVO_VERSION=v2` en el servidor; rollback: quitar o `legacy`.
 * Ver `back_relacionador/docs/RDA-V2-Migracion-Contratos.md`.
 */
function rdaEnvioMasivoVersion() {
    const v = String(process.env.RDA_ENVIO_MASIVO_VERSION || 'legacy')
        .trim()
        .toLowerCase();
    return v === 'v2' ? 'v2' : 'legacy';
}

const internalPort = () => parseInt(process.env.BACK_PORT || process.env.PORT || '3000', 10);

const normalizeAmbiente = (a) => {
    if (FORCE_PROD_ONLY) return 'prod';
    if (FORCE_SANDBOX_ONLY) return 'sandbox';
    const s = String(a || 'sandbox').toLowerCase();
    if (s === 'prod' || s === 'produccion' || s === 'production') return 'prod';
    return 'sandbox';
};

/** Rango inclusive en días calendario: [desde 00:00, hasta+1 exclusivo). */
const parseFechaRango = (fechaDesde, fechaHasta) => {
    if (!fechaDesde || !fechaHasta) return null;
    const d1 = new Date(String(fechaDesde));
    const d2 = new Date(String(fechaHasta));
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
    const desde = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 0, 0, 0, 0);
    const hastaDate = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 0, 0, 0, 0);
    if (hastaDate < desde) return null;
    const hastaExclusivo = new Date(hastaDate);
    hastaExclusivo.setDate(hastaExclusivo.getDate() + 1);
    return { desde, hastaExclusivo };
};

const internalPostJson = (path, bodyObj) =>
    new Promise((resolve, reject) => {
        const payload = JSON.stringify(bodyObj);
        const req = http.request(
            {
                method: 'POST',
                hostname: '127.0.0.1',
                port: internalPort(),
                path: `/apiV3${path}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            (resp) => {
                let data = '';
                resp.on('data', (c) => {
                    data += c;
                });
                resp.on('end', () => resolve({ status: resp.statusCode || 0, body: data }));
            }
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
    });

router.get('/RdaEnvioMasivo/paciente/pendientes', async (req, res) => {
    try {
        const ambiente = normalizeAmbiente(req.query.ambiente);
        const rango = parseFechaRango(req.query.fechaDesde, req.query.fechaHasta);
        if (!rango) {
            return res.status(400).json({
                ok: false,
                error: 'fechaDesde y fechaHasta requeridos (formato fecha válido); fechaDesde ≤ fechaHasta.',
            });
        }
        const pool = await poolPromise;
        const pendClause =
            ambiente === 'prod'
                ? 'ISNULL(e.[Enviado], 0) = 0'
                : 'ISNULL(e.[Enviado pruebas], 0) = 0';
        const result = await pool
            .request()
            .input('Desde', sql.DateTime2, rango.desde)
            .input('HastaExcl', sql.DateTime2, rango.hastaExclusivo)
            .query(`
                SELECT
                    e.[Id Evaluacion Entidad RDA] AS id,
                    e.[Documento Entidad] AS documento,
                    e.[Primer Nombre Entidad] AS primerNombre,
                    e.[Segundo Nombre Entidad] AS segundoNombre,
                    e.[Primer Apellido Entidad] AS primerApellido,
                    e.[Segundo Apellido Entidad] AS segundoApellido,
                    e.[Fecha RDA] AS fechaRda,
                    e.[Codigo Prestador] AS codigoPrestador,
                    e.[Nombre Admin Plan Beneficios] AS nombreAdminPlanBeneficios,
                    e.[Fecha Hora Inicio Atencion] AS fechaHoraInicioAtencion,
                    e.[Fecha Hora Fin Atencion] AS fechaHoraFinAtencion,
                    ISNULL(e.[Enviado], 0) AS enviado,
                    ISNULL(e.[Enviado pruebas], 0) AS enviadoPruebas
                FROM [dbo].[Evaluacion Entidad RDA] e
                WHERE e.[Fecha RDA] >= @Desde
                  AND e.[Fecha RDA] < @HastaExcl
                  AND ${pendClause}
                ORDER BY e.[Fecha RDA], e.[Id Evaluacion Entidad RDA]
            `);
        return res.json({ ok: true, ambiente, filas: result.recordset || [] });
    } catch (err) {
        console.error('❌ [RdaEnvioMasivo] paciente/pendientes:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
});

router.get('/RdaEnvioMasivo/ce/pendientes', async (req, res) => {
    try {
        const ambiente = normalizeAmbiente(req.query.ambiente);
        const rango = parseFechaRango(req.query.fechaDesde, req.query.fechaHasta);
        if (!rango) {
            return res.status(400).json({
                ok: false,
                error: 'fechaDesde y fechaHasta requeridos (formato fecha válido); fechaDesde ≤ fechaHasta.',
            });
        }
        const pool = await poolPromise;
        const pendClause =
            ambiente === 'prod'
                ? 'ISNULL(e.[Enviado], 0) = 0'
                : 'ISNULL(e.[Enviado pruebas], 0) = 0';
        const result = await pool
            .request()
            .input('Desde', sql.DateTime2, rango.desde)
            .input('HastaExcl', sql.DateTime2, rango.hastaExclusivo)
            .query(`
                SELECT
                    e.[Id Evaluacion Entidad RDA Consulta Externa] AS id,
                    e.[Documento Entidad] AS documento,
                    e.[Fecha RDA] AS fechaRda,
                    e.[Codigo Prestador] AS codigoPrestador,
                    e.[Nombre Admin Plan Beneficios] AS nombreAdminPlanBeneficios,
                    e.[Fecha Hora Inicio Atencion] AS fechaHoraInicioAtencion,
                    e.[Fecha Hora Fin Atencion] AS fechaHoraFinAtencion,
                    ISNULL(e.[Enviado], 0) AS enviado,
                    ISNULL(e.[Enviado pruebas], 0) AS enviadoPruebas
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa] e
                WHERE e.[Fecha RDA] >= @Desde
                  AND e.[Fecha RDA] < @HastaExcl
                  AND ${pendClause}
                ORDER BY e.[Fecha RDA], e.[Id Evaluacion Entidad RDA Consulta Externa]
            `);
        return res.json({ ok: true, ambiente, filas: result.recordset || [] });
    } catch (err) {
        console.error('❌ [RdaEnvioMasivo] ce/pendientes:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
});

router.post('/RdaEnvioMasivo/paciente/enviar', async (req, res) => {
    try {
        const ambiente = normalizeAmbiente((req.body || {}).ambiente);
        const ids = Array.isArray((req.body || {}).ids) ? (req.body || {}).ids : [];
        const numeric = ids
            .map((x) => parseInt(x, 10))
            .filter((n) => Number.isFinite(n));
        if (numeric.length === 0) {
            return res.status(400).json({ ok: false, error: 'ids debe ser un array no vacío de números.' });
        }
        if (numeric.length > MAX_IDS) {
            return res.status(400).json({
                ok: false,
                error: `Máximo ${MAX_IDS} ids por solicitud.`,
                maxIds: MAX_IDS,
            });
        }
        loadDotEnvFromCandidates();
        const ihceTokenRequestDebug = buildIhceTokenRequestDebug(ambiente);
        const resultados = [];
        const v = rdaEnvioMasivoVersion();
        for (let i = 0; i < numeric.length; i += 1) {
            const id = numeric[i];
            let sendResp;
            if (v === 'v2') {
                const path =
                    ambiente === 'prod'
                        ? '/RdaPacienteV2/EnviarIhceProduccionV2'
                        : '/RdaPacienteV2/EnviarIhceSandboxV2';
                sendResp = await internalPostJson(path, { IdEvaluacionEntidadRDA: id });
            } else {
                sendResp = await internalPostJson('/RdaPaciente/EnviarIHCE', {
                    IdEvaluacionEntidadRDA: id,
                    ambiente: ambiente === 'prod' ? 'prod' : 'sandbox',
                });
            }
            const ok = sendResp.status >= 200 && sendResp.status < 300;
            let cuerpoTextoTruncado = String(sendResp.body || '');
            if (cuerpoTextoTruncado.length > BODY_TRUNC) {
                cuerpoTextoTruncado = `${cuerpoTextoTruncado.slice(0, BODY_TRUNC)}…`;
            }
            resultados.push({
                id,
                ok,
                httpStatus: sendResp.status,
                cuerpoTextoTruncado,
            });
        }
        return res.json({ ok: true, ambiente, ihceTokenRequestDebug, resultados });
    } catch (err) {
        console.error('❌ [RdaEnvioMasivo] paciente/enviar:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
});

router.post('/RdaEnvioMasivo/ce/enviar', async (req, res) => {
    try {
        const ambiente = normalizeAmbiente((req.body || {}).ambiente);
        const ids = Array.isArray((req.body || {}).ids) ? (req.body || {}).ids : [];
        const numeric = ids
            .map((x) => parseInt(x, 10))
            .filter((n) => Number.isFinite(n));
        if (numeric.length === 0) {
            return res.status(400).json({ ok: false, error: 'ids debe ser un array no vacío de números.' });
        }
        if (numeric.length > MAX_IDS) {
            return res.status(400).json({
                ok: false,
                error: `Máximo ${MAX_IDS} ids por solicitud.`,
                maxIds: MAX_IDS,
            });
        }
        loadDotEnvFromCandidates();
        const ihceTokenRequestDebug = buildIhceTokenRequestDebug(ambiente);
        const resultados = [];
        const v = rdaEnvioMasivoVersion();
        for (let i = 0; i < numeric.length; i += 1) {
            const id = numeric[i];
            let sendResp;
            if (v === 'v2') {
                const path =
                    ambiente === 'prod'
                        ? '/RdaConsultaExterna/EnviarIhceProduccionV2'
                        : '/RdaConsultaExterna/EnviarIhceSandboxV2';
                sendResp = await internalPostJson(path, { IdEvaluacionEntidadRDACE: id });
            } else {
                sendResp = await internalPostJson('/RdaConsultaExterna/EnviarIHCE', {
                    IdEvaluacionEntidadRDACE: id,
                    ambiente: ambiente === 'prod' ? 'prod' : 'sandbox',
                });
            }
            const ok = sendResp.status >= 200 && sendResp.status < 300;
            let cuerpoTextoTruncado = String(sendResp.body || '');
            if (cuerpoTextoTruncado.length > BODY_TRUNC) {
                cuerpoTextoTruncado = `${cuerpoTextoTruncado.slice(0, BODY_TRUNC)}…`;
            }
            resultados.push({
                id,
                ok,
                httpStatus: sendResp.status,
                cuerpoTextoTruncado,
            });
        }
        return res.json({ ok: true, ambiente, ihceTokenRequestDebug, resultados });
    } catch (err) {
        console.error('❌ [RdaEnvioMasivo] ce/enviar:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
});

module.exports = router;

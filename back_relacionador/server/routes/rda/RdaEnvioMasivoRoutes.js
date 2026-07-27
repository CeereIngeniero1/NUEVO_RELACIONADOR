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
const {
    RDA_ENVIO_NO_REENVIBLE,
    isIhceNoReenviableResponse,
    setRdaEnvioMarca,
} = require('../../rda/rdaEnvioEstado');

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

/**
 * Si IHCE responde already exist / periodo inválido, marcar Enviado*=2
 * para que no vuelva a salir en pendientes (independiente de legacy/v2).
 */
async function marcarNoReenviableSiAplica({ kind, id, ambiente, bodyText }) {
    if (!isIhceNoReenviableResponse(bodyText)) {
        return { noReenviable: false, marcado: false };
    }
    try {
        const pool = await poolPromise;
        await setRdaEnvioMarca({
            pool,
            sql,
            kind,
            id,
            ambiente,
            valor: RDA_ENVIO_NO_REENVIBLE,
        });
        return { noReenviable: true, marcado: true };
    } catch (err) {
        console.error(
            `❌ [RdaEnvioMasivo] No se pudo marcar ${kind} id=${id} como no reenviable:`,
            err && err.message ? err.message : err
        );
        return { noReenviable: true, marcado: false, error: err.message || String(err) };
    }
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

const toIntOrNull = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
};

const toTrimmedOrNull = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
    return s;
};

async function contarRdaEnRango(pool, { tabla, rango, ambiente }) {
    const enviadoCol = ambiente === 'prod' ? '[Enviado]' : '[Enviado pruebas]';
    const result = await pool
        .request()
        .input('Desde', sql.DateTime2, rango.desde)
        .input('HastaExcl', sql.DateTime2, rango.hastaExclusivo)
        .query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN ISNULL(e.${enviadoCol}, 0) = 1 THEN 1 ELSE 0 END) AS enviados,
                SUM(CASE WHEN ISNULL(e.${enviadoCol}, 0) = 0 THEN 1 ELSE 0 END) AS pendientes
            FROM ${tabla} e
            WHERE e.[Fecha RDA] >= @Desde
              AND e.[Fecha RDA] < @HastaExcl
        `);
    const row = (result.recordset && result.recordset[0]) || {};
    return {
        total: Number(row.total) || 0,
        enviados: Number(row.enviados) || 0,
        pendientes: Number(row.pendientes) || 0,
    };
}

router.get('/RdaEnvioMasivo/dashboard', async (req, res) => {
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
        const [paciente, ce] = await Promise.all([
            contarRdaEnRango(pool, {
                tabla: '[dbo].[Evaluacion Entidad RDA]',
                rango,
                ambiente,
            }),
            contarRdaEnRango(pool, {
                tabla: '[dbo].[Evaluacion Entidad RDA Consulta Externa]',
                rango,
                ambiente,
            }),
        ]);
        const combinado = {
            total: paciente.total + ce.total,
            enviados: paciente.enviados + ce.enviados,
            pendientes: paciente.pendientes + ce.pendientes,
        };
        return res.json({
            ok: true,
            ambiente,
            ambienteLabel: ambiente === 'prod' ? 'Producción' : 'Sandbox (pruebas)',
            fechaDesde: req.query.fechaDesde,
            fechaHasta: req.query.fechaHasta,
            columnaEnvio: ambiente === 'prod' ? 'Enviado' : 'Enviado pruebas',
            config: {
                ihceForceSandboxOnly: FORCE_SANDBOX_ONLY,
                ihceForceProdOnly: FORCE_PROD_ONLY,
                envioMasivoVersion: rdaEnvioMasivoVersion(),
            },
            paciente,
            ce,
            combinado,
        });
    } catch (err) {
        console.error('❌ [RdaEnvioMasivo] dashboard:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
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
                    e.[Num Doc Profesional] AS numDocProfesional,
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
                    e.[Num Doc Profesional] AS numDocProfesional,
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
            const marca = ok
                ? { noReenviable: false, marcado: false }
                : await marcarNoReenviableSiAplica({
                    kind: 'paciente',
                    id,
                    ambiente,
                    bodyText: sendResp.body,
                });
            const yaExistia = Boolean(marca.noReenviable);
            // Tri-estado para UI: ok | ya_existia | error (ya_existia ⇒ Enviado*=2, sale de pendientes)
            resultados.push({
                id,
                ok,
                estado: ok ? 'ok' : (yaExistia ? 'ya_existia' : 'error'),
                httpStatus: sendResp.status,
                cuerpoTextoTruncado,
                noReenviable: yaExistia,
                marcadoNoReenviable: Boolean(marca.marcado),
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
            const marca = ok
                ? { noReenviable: false, marcado: false }
                : await marcarNoReenviableSiAplica({
                    kind: 'rdace',
                    id,
                    ambiente,
                    bodyText: sendResp.body,
                });
            const yaExistia = Boolean(marca.noReenviable);
            resultados.push({
                id,
                ok,
                estado: ok ? 'ok' : (yaExistia ? 'ya_existia' : 'error'),
                httpStatus: sendResp.status,
                cuerpoTextoTruncado,
                noReenviable: yaExistia,
                marcadoNoReenviable: Boolean(marca.marcado),
            });
        }
        return res.json({ ok: true, ambiente, ihceTokenRequestDebug, resultados });
    } catch (err) {
        console.error('❌ [RdaEnvioMasivo] ce/enviar:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
});

router.get('/RdaEnvioMasivo/:tipo/:id', async (req, res) => {
    try {
        const tipo = String(req.params.tipo || '').toLowerCase();
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'Id inválido.' });
        }

        const pool = await poolPromise;
        if (tipo === 'paciente') {
            const rs = await pool.request().input('Id', sql.Int, id).query(`
                SELECT TOP (1) *
                FROM [dbo].[Evaluacion Entidad RDA]
                WHERE [Id Evaluacion Entidad RDA] = @Id
            `);
            const registroPaciente = (rs.recordset || [])[0] || null;
            const documento = registroPaciente ? String(registroPaciente['Documento Entidad'] || '').trim() : '';
            let registroCe = null;
            if (documento) {
                const rsCe = await pool.request().input('Documento', sql.NVarChar(50), documento).query(`
                    SELECT TOP (1) *
                    FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                    WHERE LTRIM(RTRIM([Documento Entidad])) = LTRIM(RTRIM(@Documento))
                    ORDER BY [Fecha RDA] DESC, [Id Evaluacion Entidad RDA Consulta Externa] DESC
                `);
                registroCe = (rsCe.recordset || [])[0] || null;
            }
            return res.json({
                ok: true,
                tipo,
                documento,
                registro: registroPaciente,
                registroPaciente,
                registroCe,
                idPaciente: registroPaciente ? registroPaciente['Id Evaluacion Entidad RDA'] : null,
                idCe: registroCe ? registroCe['Id Evaluacion Entidad RDA Consulta Externa'] : null,
            });
        }
        if (tipo === 'ce') {
            const rs = await pool.request().input('Id', sql.Int, id).query(`
                SELECT TOP (1) *
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id
            `);
            const registroCe = (rs.recordset || [])[0] || null;
            const documento = registroCe ? String(registroCe['Documento Entidad'] || '').trim() : '';
            let registroPaciente = null;
            if (documento) {
                const rsPac = await pool.request().input('Documento', sql.NVarChar(50), documento).query(`
                    SELECT TOP (1) *
                    FROM [dbo].[Evaluacion Entidad RDA]
                    WHERE LTRIM(RTRIM([Documento Entidad])) = LTRIM(RTRIM(@Documento))
                    ORDER BY [Fecha RDA] DESC, [Id Evaluacion Entidad RDA] DESC
                `);
                registroPaciente = (rsPac.recordset || [])[0] || null;
            }
            return res.json({
                ok: true,
                tipo,
                documento,
                registro: registroCe,
                registroPaciente,
                registroCe,
                idPaciente: registroPaciente ? registroPaciente['Id Evaluacion Entidad RDA'] : null,
                idCe: registroCe ? registroCe['Id Evaluacion Entidad RDA Consulta Externa'] : null,
            });
        }
        return res.status(400).json({ ok: false, error: 'Tipo inválido. Use paciente o ce.' });
    } catch (err) {
        console.error('❌ [RdaEnvioMasivo] detalle:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
});

router.post('/RdaEnvioMasivo/:tipo/:id/corregir', async (req, res) => {
    try {
        const tipo = String(req.params.tipo || '').toLowerCase();
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'Id inválido.' });
        }

        const body = req.body || {};
        const pool = await poolPromise;

        if (tipo === 'paciente') {
            await pool.request()
                .input('Id', sql.Int, id)
                .input('DocumentoEntidad', sql.NVarChar(50), toTrimmedOrNull(body.DocumentoEntidad))
                .input('IdTipoDocumento', sql.Int, toIntOrNull(body.IdTipoDocumento))
                .input('PrimerApellidoEntidad', sql.NVarChar(100), toTrimmedOrNull(body.PrimerApellidoEntidad))
                .input('SegundoApellidoEntidad', sql.NVarChar(100), toTrimmedOrNull(body.SegundoApellidoEntidad))
                .input('PrimerNombreEntidad', sql.NVarChar(100), toTrimmedOrNull(body.PrimerNombreEntidad))
                .input('SegundoNombreEntidad', sql.NVarChar(50), toTrimmedOrNull(body.SegundoNombreEntidad))
                .input('FechaNacimiento', sql.DateTime, body.FechaNacimiento ? new Date(body.FechaNacimiento) : null)
                .input('Edad', sql.Float, body.Edad != null && String(body.Edad).trim() !== '' ? Number(body.Edad) : null)
                .input('IdSexoBiologico', sql.Int, toIntOrNull(body.IdSexoBiologico))
                .input('IdIdentidadGenero', sql.Int, toIntOrNull(body.IdIdentidadGenero))
                .input('IdPaisNacionalidad', sql.Int, toIntOrNull(body.IdPaisNacionalidad))
                .input('IdPaisRecidencia', sql.Int, toIntOrNull(body.IdPaisRecidencia))
                .input('IdMunicipioRecidencia', sql.Int, toIntOrNull(body.IdMunicipioRecidencia))
                .input('IdZonaResidencia', sql.Int, toIntOrNull(body.IdZonaResidencia))
                .input('IdEtnia', sql.Int, toIntOrNull(body.IdEtnia))
                .input('IdDiscapacidad', sql.Int, toIntOrNull(body.IdDiscapacidad))
                .input('Direccion', sql.NVarChar(255), toTrimmedOrNull(body.Direccion))
                .input('TelefonoCelular', sql.NVarChar(50), toTrimmedOrNull(body.TelefonoCelular))
                .input('Talla', sql.VarChar(10), toTrimmedOrNull(body.Talla))
                .input('Peso', sql.VarChar(10), toTrimmedOrNull(body.Peso))
                .query(`
                    UPDATE [dbo].[Evaluacion Entidad RDA]
                    SET [Documento Entidad] = COALESCE(@DocumentoEntidad, [Documento Entidad]),
                        [Id Tipo Documento] = COALESCE(@IdTipoDocumento, [Id Tipo Documento]),
                        [Primer Apellido Entidad] = COALESCE(@PrimerApellidoEntidad, [Primer Apellido Entidad]),
                        [Segundo Apellido Entidad] = COALESCE(@SegundoApellidoEntidad, [Segundo Apellido Entidad]),
                        [Primer Nombre Entidad] = COALESCE(@PrimerNombreEntidad, [Primer Nombre Entidad]),
                        [Segundo Nombre Entidad] = COALESCE(@SegundoNombreEntidad, [Segundo Nombre Entidad]),
                        [Fecha Nacimiento] = COALESCE(@FechaNacimiento, [Fecha Nacimiento]),
                        [Edad] = COALESCE(@Edad, [Edad]),
                        [Id Sexo Biologico] = COALESCE(@IdSexoBiologico, [Id Sexo Biologico]),
                        [Id Identidad Genero] = COALESCE(@IdIdentidadGenero, [Id Identidad Genero]),
                        [Id Pais Nacionalidad] = COALESCE(@IdPaisNacionalidad, [Id Pais Nacionalidad]),
                        [Id Pais Recidencia] = COALESCE(@IdPaisRecidencia, [Id Pais Recidencia]),
                        [Id Municipio Recidencia] = COALESCE(@IdMunicipioRecidencia, [Id Municipio Recidencia]),
                        [Id Zona Residencia] = COALESCE(@IdZonaResidencia, [Id Zona Residencia]),
                        [Id Etnia] = COALESCE(@IdEtnia, [Id Etnia]),
                        [Id Discapacidad] = COALESCE(@IdDiscapacidad, [Id Discapacidad]),
                        [Dirección] = COALESCE(@Direccion, [Dirección]),
                        [Teléfono Celular] = COALESCE(@TelefonoCelular, [Teléfono Celular]),
                        [Talla] = COALESCE(@Talla, [Talla]),
                        [Peso] = COALESCE(@Peso, [Peso])
                    WHERE [Id Evaluacion Entidad RDA] = @Id
                `);
            return res.json({ ok: true });
        }

        if (tipo === 'ce') {
            await pool.request()
                .input('Id', sql.Int, id)
                .input('DocumentoEntidad', sql.NVarChar(50), toTrimmedOrNull(body.DocumentoEntidad))
                .input('CodigoPrestador', sql.NVarChar(50), toTrimmedOrNull(body.CodigoPrestador))
                .input('CodigoAdminPlanBeneficios', sql.NVarChar(50), toTrimmedOrNull(body.CodigoAdminPlanBeneficios))
                .input('NombreAdminPlanBeneficios', sql.NVarChar(200), toTrimmedOrNull(body.NombreAdminPlanBeneficios))
                .input('FechaHoraInicioAtencion', sql.DateTime, body.FechaHoraInicioAtencion ? new Date(body.FechaHoraInicioAtencion) : null)
                .input('FechaHoraFinAtencion', sql.DateTime, body.FechaHoraFinAtencion ? new Date(body.FechaHoraFinAtencion) : null)
                .input('TipoDocProfesional', sql.VarChar(10), toTrimmedOrNull(body.TipoDocProfesional))
                .input('NumDocProfesional', sql.NVarChar(50), toTrimmedOrNull(body.NumDocProfesional))
                .input('DiagnosticoIngresoCIE11Codigo', sql.NVarChar(50), toTrimmedOrNull(body.DiagnosticoIngresoCIE11Codigo))
                .input('DiagnosticoIngresoCIE11Termino', sql.NVarChar(200), toTrimmedOrNull(body.DiagnosticoIngresoCIE11Termino))
                .input('IdModalidadAtencion', sql.Int, toIntOrNull(body.IdModalidadAtencion))
                .input('IdGrupoServicios', sql.Int, toIntOrNull(body.IdGrupoServicios))
                .input('IdViaIngresoUsuario', sql.Int, toIntOrNull(body.IdViaIngresoUsuario))
                .input('IdCausaMotivoAtencion', sql.Int, toIntOrNull(body.IdCausaMotivoAtencion))
                .query(`
                    UPDATE [dbo].[Evaluacion Entidad RDA Consulta Externa]
                    SET [Documento Entidad] = COALESCE(@DocumentoEntidad, [Documento Entidad]),
                        [Codigo Prestador] = COALESCE(@CodigoPrestador, [Codigo Prestador]),
                        [Codigo Admin Plan Beneficios] = COALESCE(@CodigoAdminPlanBeneficios, [Codigo Admin Plan Beneficios]),
                        [Nombre Admin Plan Beneficios] = COALESCE(@NombreAdminPlanBeneficios, [Nombre Admin Plan Beneficios]),
                        [Fecha Hora Inicio Atencion] = COALESCE(@FechaHoraInicioAtencion, [Fecha Hora Inicio Atencion]),
                        [Fecha Hora Fin Atencion] = COALESCE(@FechaHoraFinAtencion, [Fecha Hora Fin Atencion]),
                        [Tipo Doc Profesional] = COALESCE(@TipoDocProfesional, [Tipo Doc Profesional]),
                        [Num Doc Profesional] = COALESCE(@NumDocProfesional, [Num Doc Profesional]),
                        [Diagnostico Ingreso CIE11 Codigo] = COALESCE(@DiagnosticoIngresoCIE11Codigo, [Diagnostico Ingreso CIE11 Codigo]),
                        [Diagnostico Ingreso CIE11 Termino] = COALESCE(@DiagnosticoIngresoCIE11Termino, [Diagnostico Ingreso CIE11 Termino]),
                        [Id Modalidad Atencion] = COALESCE(@IdModalidadAtencion, [Id Modalidad Atencion]),
                        [Id Grupo Servicios] = COALESCE(@IdGrupoServicios, [Id Grupo Servicios]),
                        [Id Via Ingreso Usuario] = COALESCE(@IdViaIngresoUsuario, [Id Via Ingreso Usuario]),
                        [Id Causa Motivo Atencion] = COALESCE(@IdCausaMotivoAtencion, [Id Causa Motivo Atencion])
                    WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id
                `);
            return res.json({ ok: true });
        }

        return res.status(400).json({ ok: false, error: 'Tipo inválido. Use paciente o ce.' });
    } catch (err) {
        console.error('❌ [RdaEnvioMasivo] corregir:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
});

module.exports = router;

const path = require('path');
const fs = require('fs').promises;
const { Router } = require('express');
const { sql, poolPromise } = require('../db2');
const { guardarHistoriaClinica } = require('../historiasClinicas/guardarEvaluacionEntidad');
const { cerrarHistoriaClinica } = require('../historiasClinicas/cerrarEvaluacionEntidad');
const { registrarRipsHc, marcarSinRipsHc } = require('../historiasClinicas/registrarRipsHc');
const { consultarRipsPorEvaluacion } = require('../historiasClinicas/consultarRipsHc');
const {
    listarEvolucionesHc,
    obtenerDetalleEvolucion,
} = require('../historiasClinicas/listarEvolucionesPaciente');

const router = Router();

const DEFAULT_FORMATOS_HC_PATH = 'C:\\CeereSio\\Formatos HC';
const EXTENSIONES_PERMITIDAS = new Set(['.htm', '.html']);

/** Catálogo CeereSio — Campos Historia Clínica.txt */
const CATALOGO_CAMPOS_HC = {
    T1: 'Nombre Completo',
    T2: 'No Historia',
    T3: 'Edad',
    T4: 'Fecha de Historia',
    T5: 'Identificación',
    T6: 'Dir Domicilio',
    T7: 'Ciudad',
    T8: 'Tel Domicilio',
    T9: 'Fecha de Nacimiento',
    T10: 'Sexo',
    T11: 'Estado Civil',
    T12: 'Ocupación',
    T13: 'Aseguradora',
    T14: 'Tipo Vinculación',
    T15: 'Acompañante',
    T16: 'Parentesco Acompañante',
    T17: 'Tel Acompañante',
    T18: 'Responsable',
    T19: 'Parentesco Responsable',
    T20: 'Tel Responsable',
    T21: 'Nombre de Usuario',
    T22: 'Hora de Historia',
    T23: 'Lugar Nacimiento Paciente',
    T24: 'Barrio Paciente',
    T25: 'Telefono 2 Paciente',
    T26: 'Celular Paciente',
    T27: 'Tipo Documento Paciente',
    T28: 'Tipo Usuario',
    T29: 'Registro Medico',
    RegistroMédico: 'Registro Medico',
    RegistroMedico: 'Registro Medico',
    T30: 'Fecha Historia Numerica',
    T31: 'Codigo Diagnostico Rips',
    T32: 'Descripcion Diagnostico Rips',
    T33: 'Codigo Diagnostico Rips2',
    T34: 'Edad Gestacional',
    T36: 'Correo electrónico',
    Entidad1: 'Foto del paciente',
    Entidad2: 'Firma del paciente',
    Entidad3: 'Firma Usuario',
};

/** Columnas disponibles hoy en [Cnsta Relacionador Usuarios Info] / formulario HC */
const CAMPOS_CON_DATO_ACTUAL = new Set([
    'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T18', 'T19', 'T21', 'T22', 'T27', 'T30',
]);

function extraerNombresCamposHc(html) {
    const found = new Set();
    const re = /\bname\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const n = m[1].trim();
        if (/^T\d+$/i.test(n) || /^Entidad\d+$/i.test(n) || /^RegistroM[eé]dico$/i.test(n)) {
            found.add(n);
        }
    }
    return [...found].sort();
}

function getFormatosHcRoot() {
    const raw = process.env.CEERE_FORMATOS_HC_PATH;
    const trimmed = raw != null ? String(raw).trim() : '';
    return path.resolve(trimmed || DEFAULT_FORMATOS_HC_PATH);
}

/** Evita path traversal; solo .htm / .html en la carpeta configurada. */
function resolveSafeFormatoFile(nombre) {
    const root = getFormatosHcRoot();
    const safeName = path.basename(String(nombre || '').trim());
    if (!safeName) {
        throw new Error('Nombre de archivo inválido.');
    }
    const ext = path.extname(safeName).toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.has(ext)) {
        throw new Error('Solo se permiten archivos .htm o .html.');
    }
    const fullPath = path.resolve(root, safeName);
    if (!fullPath.startsWith(root)) {
        throw new Error('Ruta de archivo no permitida.');
    }
    return { root, fullPath, safeName };
}

/**
 * GET /apiV3/formatosHC
 * Lista archivos .htm / .html en la carpeta de formatos de historia clínica.
 */
router.get('/formatosHC', async (req, res) => {
    const ruta = getFormatosHcRoot();
    try {
        const stat = await fs.stat(ruta);
        if (!stat.isDirectory()) {
            return res.status(400).json({
                ok: false,
                message: 'La ruta configurada no es un directorio.',
                ruta,
            });
        }

        const entries = await fs.readdir(ruta, { withFileTypes: true });
        const archivos = entries
            .filter((e) => e.isFile())
            .map((e) => {
                const ext = path.extname(e.name).toLowerCase();
                return { nombre: e.name, extension: ext };
            })
            .filter((a) => EXTENSIONES_PERMITIDAS.has(a.extension))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

        return res.json({ ok: true, ruta, archivos });
    } catch (err) {
        if (err && err.code === 'ENOENT') {
            return res.status(404).json({
                ok: false,
                message: 'No se encontró la carpeta de formatos. Verifique CEERE_FORMATOS_HC_PATH en .env.',
                ruta,
            });
        }
        console.error('[formatosHC]', err);
        return res.status(500).json({
            ok: false,
            message: err.message || 'Error al leer formatos de historia clínica.',
            ruta,
        });
    }
});

/**
 * GET /apiV3/formatosHC/vista/:nombre
 * Sirve el HTML del formato para vista previa (iframe en Historias Clínicas).
 */
/**
 * GET /apiV3/formatosHC/analisis-campos
 * Escanea formatos en la carpeta raíz y reporta campos name vs catálogo CeereSio.
 */
router.get('/formatosHC/analisis-campos', async (req, res) => {
    const ruta = getFormatosHcRoot();
    try {
        const entries = await fs.readdir(ruta, { withFileTypes: true });
        const archivos = entries
            .filter((e) => e.isFile() && EXTENSIONES_PERMITIDAS.has(path.extname(e.name).toLowerCase()))
            .map((e) => e.name)
            .sort((a, b) => a.localeCompare(b, 'es'));

        const porArchivo = [];
        const todosEnHtml = new Set();

        for (const nombre of archivos) {
            const { fullPath } = resolveSafeFormatoFile(nombre);
            const html = await fs.readFile(fullPath, 'utf8');
            const enHtml = extraerNombresCamposHc(html);
            enHtml.forEach((n) => todosEnHtml.add(n));

            const enCatalogo = enHtml.filter((n) => CATALOGO_CAMPOS_HC[n]);
            const sinCatalogo = enHtml.filter((n) => !CATALOGO_CAMPOS_HC[n]);
            const conDato = enCatalogo.filter((n) => CAMPOS_CON_DATO_ACTUAL.has(n));
            const sinDatoConsulta = enCatalogo.filter((n) => !CAMPOS_CON_DATO_ACTUAL.has(n));

            porArchivo.push({
                archivo: nombre,
                camposEnHtml: enHtml,
                enCatalogo,
                conDatoDisponible: conDato,
                sinDatoEnConsultaActual: sinDatoConsulta,
                enHtmlSinCatalogo: sinCatalogo,
                sinAtributosName: enHtml.length === 0,
            });
        }

        const catalogoKeys = Object.keys(CATALOGO_CAMPOS_HC);
        const enCatalogoNoUsados = catalogoKeys.filter((k) => !todosEnHtml.has(k));
        const pendientesSql = catalogoKeys.filter((k) => !CAMPOS_CON_DATO_ACTUAL.has(k));

        return res.json({
            ok: true,
            ruta,
            catalogo: CATALOGO_CAMPOS_HC,
            camposConDatoDisponible: [...CAMPOS_CON_DATO_ACTUAL],
            pendientesAgregarAConsulta: pendientesSql.map((k) => ({
                name: k,
                etiqueta: CATALOGO_CAMPOS_HC[k],
            })),
            porArchivo,
            resumen: {
                totalArchivos: archivos.length,
                camposUnicosEnHtml: [...todosEnHtml].sort(),
                catalogoNoPresenteEnNingunFormato: enCatalogoNoUsados,
            },
        });
    } catch (err) {
        console.error('[formatosHC/analisis-campos]', err);
        return res.status(500).json({
            ok: false,
            message: err.message || 'Error al analizar campos de formatos.',
            ruta,
        });
    }
});

router.get('/formatosHC/vista/:nombre', async (req, res) => {
    try {
        const { fullPath, safeName } = resolveSafeFormatoFile(req.params.nombre);
        const html = await fs.readFile(fullPath, 'utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.send(html);
    } catch (err) {
        if (err && err.code === 'ENOENT') {
            return res.status(404).send(
                `<html><body style="font-family:sans-serif;padding:1rem;"><p>No se encontró el archivo de formato.</p></body></html>`
            );
        }
        console.error('[formatosHC/vista]', err);
        res.status(400).send(
            `<html><body style="font-family:sans-serif;padding:1rem;color:#b00;"><p>${err.message || 'Error al abrir formato.'}</p></body></html>`
        );
    }
});

function metaConexionBd() {
    return {
        server: process.env.DB_SERVER || null,
        database: process.env.DB_DATABASE || null,
        nota: 'Compare con la base donde ejecutó SSMS (debe coincidir database).',
    };
}

/**
 * Rutas de depuración — NO requieren token (probar en navegador o Postman).
 * Misma consulta que Asignar_RipsRoutes V3.
 */
router.get('/debug/conexion', async (req, res) => {
    try {
        const pool = await poolPromise;
        const info = await pool.request().query('SELECT @@SERVERNAME AS serverName, DB_NAME() AS databaseName');
        const row = info.recordset[0] || {};
        res.json({
            ok: true,
            sinToken: true,
            env: metaConexionBd(),
            sqlServer: {
                serverName: row.serverName,
                databaseName: row.databaseName,
            },
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message, env: metaConexionBd() });
    }
});

router.get('/debug/ConsultarFacturas/:DocumentoPaciente', async (req, res) => {
    const documento = String(req.params.DocumentoPaciente || '').trim();
    try {
        const pool = await poolPromise;
        const [vista, cruda, enRips] = await Promise.all([
            pool
                .request()
                .input('DocumentoPaciente', sql.VarChar, documento)
                .query(`
                    SELECT *
                    FROM [ConsultaFacturasPaciente]
                    WHERE [DocumentoPaciente] = @DocumentoPaciente
                    ORDER BY [FechaFactura] DESC
                `),
            pool
                .request()
                .input('DocumentoPaciente', sql.VarChar, documento)
                .query(`
                    SELECT TOP 20
                        [Id Factura] AS IdFactura,
                        [Documento Paciente] AS DocumentoPaciente,
                        [No Factura] AS NoFactura,
                        [Fecha Factura] AS FechaFactura,
                        [Total Factura] AS TotalFactura,
                        [Id EmpresaV] AS IdEmpresaV
                    FROM dbo.Factura
                    WHERE [Documento Paciente] = @DocumentoPaciente
                    ORDER BY [Fecha Factura] DESC
                `),
            pool
                .request()
                .input('DocumentoPaciente', sql.VarChar, documento)
                .query(`
                    SELECT evr.[Id Factura], evr.[Id Evaluación Entidad Rips]
                    FROM [Evaluación Entidad Rips] evr
                    INNER JOIN dbo.Factura f ON f.[Id Factura] = evr.[Id Factura]
                    WHERE f.[Documento Paciente] = @DocumentoPaciente
                `),
        ]);

        const info = await pool.request().query('SELECT DB_NAME() AS databaseName');
        res.json({
            ok: true,
            sinToken: true,
            endpoint: 'GET /apiV3/debug/ConsultarFacturas/:DocumentoPaciente',
            conexion: metaConexionBd(),
            databaseNameActiva: info.recordset[0]?.databaseName,
            documentoPaciente: documento,
            vistaConsultaFacturasPaciente: {
                total: vista.recordset.length,
                filas: vista.recordset,
            },
            tablaFacturaCruda: {
                total: cruda.recordset.length,
                filas: cruda.recordset,
            },
            facturasYaEnRips: {
                total: enRips.recordset.length,
                filas: enRips.recordset,
            },
            /** Compat: mismo shape que antes */
            total: vista.recordset.length,
            filas: vista.recordset,
        });
    } catch (error) {
        console.error('[debug ConsultarFacturas]', error);
        res.status(500).json({
            ok: false,
            sinToken: true,
            documentoPaciente: documento,
            conexion: metaConexionBd(),
            error: error.message || 'Error al consultar facturas.',
        });
    }
});

router.get('/debug/ConsultarPresupuestos/:DocumentoPaciente', async (req, res) => {
    const documento = String(req.params.DocumentoPaciente || '').trim();
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('DocumentoPaciente', sql.VarChar, documento)
            .query(`
                SELECT *
                FROM [ConsultaPresupuestosPaciente]
                WHERE [DocumentoPaciente] = @DocumentoPaciente
                  AND [FormaDePago] = 5
                ORDER BY [FechaPresupuesto] DESC
            `);
        res.json({
            ok: true,
            sinToken: true,
            endpoint: 'GET /apiV3/debug/ConsultarPresupuestos/:DocumentoPaciente',
            documentoPaciente: documento,
            total: result.recordset.length,
            filas: result.recordset,
        });
    } catch (error) {
        console.error('[debug ConsultarPresupuestos]', error);
        res.status(500).json({
            ok: false,
            sinToken: true,
            documentoPaciente: documento,
            error: error.message || 'Error al consultar presupuestos.',
        });
    }
});

/**
 * GET /apiV3/historiasClinicas/evoluciones/detalle/:idEvaluacionEntidad
 * (Ruta fija antes de :documentoPaciente para evitar colisión con "detalle".)
 */
router.get('/historiasClinicas/evoluciones/detalle/:idEvaluacionEntidad', async (req, res) => {
    try {
        const detalle = await obtenerDetalleEvolucion(req.params.idEvaluacionEntidad);
        if (!detalle) {
            return res.status(404).json({ ok: false, message: 'Evaluación no encontrada.' });
        }
        return res.json({ ok: true, ...detalle });
    } catch (error) {
        console.error('[historiasClinicas/evoluciones/detalle]', error);
        return res.status(400).json({
            ok: false,
            message: error.message || 'Error al consultar detalle.',
        });
    }
});

/**
 * GET /apiV3/historiasClinicas/rips/evaluacion/:idEvaluacionEntidad
 */
router.get('/historiasClinicas/rips/evaluacion/:idEvaluacionEntidad', async (req, res) => {
    try {
        const data = await consultarRipsPorEvaluacion(req.params.idEvaluacionEntidad);
        if (!data) {
            return res.status(404).json({ ok: false, message: 'Evaluación no encontrada.' });
        }
        return res.json({ ok: true, ...data });
    } catch (error) {
        console.error('[historiasClinicas/rips/evaluacion]', error);
        return res.status(400).json({
            ok: false,
            message: error.message || 'Error al consultar RIPS.',
        });
    }
});

/**
 * POST /apiV3/historiasClinicas/rips/registrar
 */
router.post('/historiasClinicas/rips/registrar', async (req, res) => {
    try {
        const resultado = await registrarRipsHc(req.body || {});
        return res.json({
            ok: true,
            message: 'RIPS registrado correctamente.',
            ...resultado,
        });
    } catch (error) {
        console.error('[historiasClinicas/rips/registrar]', error);
        return res.status(400).json({
            ok: false,
            message: error.message || 'Error al registrar RIPS.',
        });
    }
});

/**
 * POST /apiV3/historiasClinicas/rips/sin-registrar
 */
router.post('/historiasClinicas/rips/sin-registrar', async (req, res) => {
    try {
        const id =
            req.body?.idEvaluacionEntidad ?? req.body?.idEvaluacion ?? null;
        const resultado = await marcarSinRipsHc(id);
        return res.json({
            ok: true,
            message: 'Historia marcada sin RIPS.',
            ...resultado,
        });
    } catch (error) {
        console.error('[historiasClinicas/rips/sin-registrar]', error);
        return res.status(400).json({
            ok: false,
            message: error.message || 'Error al marcar sin RIPS.',
        });
    }
});

/**
 * GET /apiV3/historiasClinicas/evoluciones/:documentoPaciente
 * Lista HC guardadas del paciente (tipo evaluación 4).
 */
router.get('/historiasClinicas/evoluciones/:documentoPaciente', async (req, res) => {
    const documento = String(req.params.documentoPaciente || '').trim();
    try {
        if (!documento) {
            return res.status(400).json({ ok: false, message: 'Documento de paciente requerido.' });
        }
        const evoluciones = await listarEvolucionesHc(documento);
        return res.json({
            ok: true,
            documentoPaciente: documento,
            total: evoluciones.length,
            evoluciones,
        });
    } catch (error) {
        console.error('[historiasClinicas/evoluciones]', error);
        return res.status(500).json({
            ok: false,
            message: error.message || 'Error al listar evoluciones.',
        });
    }
});

/**
 * POST /apiV3/historiasClinicas/guardar
 * INSERT en [Evaluación Entidad] (tipo evaluación 4 = formato HC).
 */
router.post('/historiasClinicas/guardar', async (req, res) => {
    try {
        const body = req.body || {};
        const resultado = await guardarHistoriaClinica(body);
        return res.json({
            ok: true,
            message: 'Historia clínica guardada correctamente.',
            ...resultado,
        });
    } catch (error) {
        console.error('[historiasClinicas/guardar]', error);
        return res.status(400).json({
            ok: false,
            message: error.message || 'Error al guardar la historia clínica.',
        });
    }
});

/**
 * POST /apiV3/historiasClinicas/cerrar
 * UPDATE [Id Estado] = 7 (Cerrado) en evaluación HC abierta (8).
 */
router.post('/historiasClinicas/cerrar', async (req, res) => {
    try {
        const idEvaluacionEntidad =
            req.body?.idEvaluacionEntidad ?? req.body?.idEvaluacion ?? null;
        const resultado = await cerrarHistoriaClinica(idEvaluacionEntidad);
        return res.json({
            ok: true,
            message: 'Historia clínica cerrada correctamente.',
            ...resultado,
        });
    } catch (error) {
        console.error('[historiasClinicas/cerrar]', error);
        return res.status(400).json({
            ok: false,
            message: error.message || 'Error al cerrar la historia clínica.',
        });
    }
});

router.get('/debug/DatosdeUsuarioHC/:DocumentoPaciente', async (req, res) => {
    const documento = String(req.params.DocumentoPaciente || '').trim();
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('DocumentoPaciente', sql.VarChar, documento)
            .query(`
                SELECT *
                FROM [Cnsta Relacionador Usuarios Info]
                WHERE [DocumentoPaciente] = @DocumentoPaciente
            `);
        res.json({
            ok: true,
            sinToken: true,
            endpoint: 'GET /apiV3/debug/DatosdeUsuarioHC/:DocumentoPaciente',
            documentoPaciente: documento,
            total: result.recordset.length,
            filas: result.recordset,
        });
    } catch (error) {
        console.error('[debug DatosdeUsuarioHC]', error);
        res.status(500).json({
            ok: false,
            sinToken: true,
            documentoPaciente: documento,
            error: error.message || 'Error al consultar paciente.',
        });
    }
});

module.exports = router;

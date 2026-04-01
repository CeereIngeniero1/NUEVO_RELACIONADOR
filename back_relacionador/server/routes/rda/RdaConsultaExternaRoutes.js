/**
 * RDA Consulta Externa — Router independiente (Resolución 1888)
 *
 * Rutas incluidas:
 *  POST  /EvaluacionEntidadRDACE/                      — cabecera
 *  POST  /EvaluacionEntidadRDACE/AntecedentesSalud
 *  POST  /EvaluacionEntidadRDACE/AntecedentesFamiliares
 *  POST  /EvaluacionEntidadRDACE/AntecedentesFarmacologicos
 *  POST  /EvaluacionEntidadRDACE/DiagnosticosRelacionados
 *  POST  /EvaluacionEntidadRDACE/PrescripcionMedicamentos
 *  POST  /EvaluacionEntidadRDACE/PrescripcionProcedimientos
 *  POST  /EvaluacionEntidadRDACE/OtrasTecnologias
 *  GET   /EgresoRemision                               — catálogo 1888
 *  GET   /FactorDeRiesgo                               — catálogo 1888
 *  GET   /TipoTecnologiaEnSalud                        — catálogo 1888
 *  GET   /Catalogo1888/:clave                          — catálogos 1888 genéricos
 *  POST  /RdaConsultaExterna/FhirBundle                — construcción Bundle FHIR
 *
 * Pendientes (agregar en este mismo archivo cuando estén listos):
 *  POST  /RdaConsultaExterna/EnviarIHCE                — envío IHCE ($enviar-rda-consulta)
 *
 * Montaje en el router principal:
 *   router.use(require('./rda/RdaConsultaExternaRoutes'));
 *
 * IG: https://vulcano.ihcecol.gov.co/RDA-consulta.html
 */

'use strict';

const Router      = require('express').Router;
const { sql, poolPromise } = require('../../db2');

const router = Router();

// ---------------------------------------------------------------------------
// Helper: convierte string a Date para DateTime2 (devuelve null si inválido)
// ---------------------------------------------------------------------------
const toDateTimeRDACE = (str) => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

// ===========================================================================
// PERSISTENCIA — tablas RDACE
// ===========================================================================

// Cabecera principal
router.post('/EvaluacionEntidadRDACE/', async (req, res) => {
    const {
        DocumentoEntidad, FechaRDA,
        CodigoPrestador, CodigoAdminPlanBeneficios, NombreAdminPlanBeneficios,
        FechaHoraInicioAtencion, FechaHoraFinAtencion,
        TipoDocProfesional, NumDocProfesional,
        DiagnosticoIngresoCIE11Codigo, DiagnosticoIngresoCIE11Termino,
        TipoAlergia,
        EntornoAtencion, TipoFactorRiesgo, NombreFactorRiesgo,
        DiagnosticoPrincipalCIE10Codigo, DiagnosticoPrincipalCIE10Nombre, TipoDiagnosticoPrincipal,
        CondicionDestinoEgreso, CodigoPrestadorRemite,
        AlcanceIncapacidad, DiasIncapacidad, DiasLicenciaMaternidad,
        NombreDocumentoPDF,
        IdModalidadAtencion, IdGrupoServicios, IdViaIngresoUsuario, IdCausaMotivoAtencion,
    } = req.body;

    const rdaceIntOrNull = (v) => {
        if (v == null || v === '') return null;
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : null;
    };

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('FechaRDA', sql.DateTime2, toDateTimeRDACE(FechaRDA) || new Date())
            .input('CodigoPrestador', sql.NVarChar, CodigoPrestador || null)
            .input('CodigoAdminPlanBeneficios', sql.NVarChar, CodigoAdminPlanBeneficios || null)
            .input('NombreAdminPlanBeneficios', sql.NVarChar, NombreAdminPlanBeneficios || null)
            .input('FechaHoraInicioAtencion', sql.DateTime2, toDateTimeRDACE(FechaHoraInicioAtencion))
            .input('FechaHoraFinAtencion', sql.DateTime2, toDateTimeRDACE(FechaHoraFinAtencion))
            .input('TipoDocProfesional', sql.NVarChar, TipoDocProfesional || null)
            .input('NumDocProfesional', sql.NVarChar, NumDocProfesional || null)
            .input('DiagnosticoIngresoCIE11Codigo', sql.NVarChar, DiagnosticoIngresoCIE11Codigo || null)
            .input('DiagnosticoIngresoCIE11Termino', sql.NVarChar, DiagnosticoIngresoCIE11Termino || null)
            .input('TipoAlergia', sql.NVarChar, TipoAlergia || null)
            .input('EntornoAtencion', sql.NVarChar, EntornoAtencion || null)
            .input('TipoFactorRiesgo', sql.NVarChar, TipoFactorRiesgo || null)
            .input('NombreFactorRiesgo', sql.NVarChar, NombreFactorRiesgo || null)
            .input('DiagnosticoPrincipalCIE10Codigo', sql.NVarChar, DiagnosticoPrincipalCIE10Codigo || null)
            .input('DiagnosticoPrincipalCIE10Nombre', sql.NVarChar, DiagnosticoPrincipalCIE10Nombre || null)
            .input('TipoDiagnosticoPrincipal', sql.NVarChar, TipoDiagnosticoPrincipal || null)
            .input('CondicionDestinoEgreso', sql.NVarChar, CondicionDestinoEgreso || null)
            .input('CodigoPrestadorRemite', sql.NVarChar, CodigoPrestadorRemite || null)
            .input('AlcanceIncapacidad', sql.NVarChar, AlcanceIncapacidad || null)
            .input('DiasIncapacidad', sql.Int, DiasIncapacidad != null && DiasIncapacidad !== '' ? parseInt(DiasIncapacidad, 10) : null)
            .input('DiasLicenciaMaternidad', sql.Int, DiasLicenciaMaternidad != null && DiasLicenciaMaternidad !== '' ? parseInt(DiasLicenciaMaternidad, 10) : null)
            .input('NombreDocumentoPDF', sql.NVarChar, NombreDocumentoPDF || null)
            .input('IdModalidadAtencion', sql.Int, rdaceIntOrNull(IdModalidadAtencion))
            .input('IdGrupoServicios', sql.Int, rdaceIntOrNull(IdGrupoServicios))
            .input('IdViaIngresoUsuario', sql.Int, rdaceIntOrNull(IdViaIngresoUsuario))
            .input('IdCausaMotivoAtencion', sql.Int, rdaceIntOrNull(IdCausaMotivoAtencion))
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA Consulta Externa]
                (
                    [Documento Entidad], [Fecha RDA],
                    [Codigo Prestador], [Codigo Admin Plan Beneficios], [Nombre Admin Plan Beneficios],
                    [Fecha Hora Inicio Atencion], [Fecha Hora Fin Atencion],
                    [Tipo Doc Profesional], [Num Doc Profesional],
                    [Diagnostico Ingreso CIE11 Codigo], [Diagnostico Ingreso CIE11 Termino],
                    [Tipo Alergia],
                    [Entorno Atencion], [Tipo Factor Riesgo], [Nombre Factor Riesgo],
                    [Diagnostico Principal CIE10 Codigo], [Diagnostico Principal CIE10 Nombre], [Tipo Diagnostico Principal],
                    [Condicion Destino Egreso], [Codigo Prestador Remite],
                    [Alcance Incapacidad], [Dias Incapacidad], [Dias Licencia Maternidad],
                    [Nombre Documento PDF],
                    [Id Modalidad Atencion], [Id Grupo Servicios], [Id Via Ingreso Usuario], [Id Causa Motivo Atencion]
                )
                OUTPUT INSERTED.[Id Evaluacion Entidad RDA Consulta Externa]
                VALUES
                (
                    @DocumentoEntidad, @FechaRDA,
                    @CodigoPrestador, @CodigoAdminPlanBeneficios, @NombreAdminPlanBeneficios,
                    @FechaHoraInicioAtencion, @FechaHoraFinAtencion,
                    @TipoDocProfesional, @NumDocProfesional,
                    @DiagnosticoIngresoCIE11Codigo, @DiagnosticoIngresoCIE11Termino,
                    @TipoAlergia,
                    @EntornoAtencion, @TipoFactorRiesgo, @NombreFactorRiesgo,
                    @DiagnosticoPrincipalCIE10Codigo, @DiagnosticoPrincipalCIE10Nombre, @TipoDiagnosticoPrincipal,
                    @CondicionDestinoEgreso, @CodigoPrestadorRemite,
                    @AlcanceIncapacidad, @DiasIncapacidad, @DiasLicenciaMaternidad,
                    @NombreDocumentoPDF,
                    @IdModalidadAtencion, @IdGrupoServicios, @IdViaIngresoUsuario, @IdCausaMotivoAtencion
                )
            `);
        const idInsertado = result.recordset[0]['Id Evaluacion Entidad RDA Consulta Externa'];
        res.json({ ok: true, IdEvaluacionEntidadRDACE: idInsertado });
    } catch (error) {
        console.error('❌ Error al insertar Evaluacion Entidad RDA Consulta Externa:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/AntecedentesSalud', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion', sql.NVarChar, Descripcion || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Salud]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdRDACE, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Antecedente Salud:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/AntecedentesFamiliares', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Parentesco, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Parentesco', sql.NVarChar, Parentesco || null)
            .input('Descripcion', sql.NVarChar, Descripcion || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Familiares]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Parentesco], [Descripcion], [Id Estado])
                VALUES (@IdRDACE, @DocumentoEntidad, @Parentesco, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Antecedente Familiar:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/AntecedentesFarmacologicos', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion', sql.NVarChar, Descripcion || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Farmacologicos]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdRDACE, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Antecedente Farmacológico:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/DiagnosticosRelacionados', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, CodigoCIE10, NombreCIE10, CodigoCIE11, TerminoCIE11, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('CodigoCIE10', sql.NVarChar, CodigoCIE10 || null)
            .input('NombreCIE10', sql.NVarChar, NombreCIE10 || null)
            .input('CodigoCIE11', sql.NVarChar, CodigoCIE11 || null)
            .input('TerminoCIE11', sql.NVarChar, TerminoCIE11 || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Codigo CIE10], [Nombre CIE10], [Codigo CIE11], [Termino CIE11], [Id Estado])
                VALUES (@IdRDACE, @CodigoCIE10, @NombreCIE10, @CodigoCIE11, @TerminoCIE11, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Diagnóstico relacionado:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/PrescripcionMedicamentos', async (req, res) => {
    const {
        IdEvaluacionEntidadRDACE,
        tipo, codigo, nombre, dci, fechaPrescripcion,
        dosis, unidadDosis, via,
        duracionCant, duracionUnid, frecuenciaCant, frecuenciaUnid, finalidad,
        IdEstado,
    } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('TipoTec', sql.NVarChar, tipo || null)
            .input('CodigoMed', sql.NVarChar, codigo || null)
            .input('NombreMed', sql.NVarChar, nombre || null)
            .input('Dci', sql.NVarChar, dci || null)
            .input('FechaPresc', sql.DateTime2, toDateTimeRDACE(fechaPrescripcion))
            .input('Dosis', sql.NVarChar, dosis != null ? String(dosis) : null)
            .input('UnidadDosis', sql.NVarChar, unidadDosis || null)
            .input('Via', sql.NVarChar, via || null)
            .input('DurCant', sql.NVarChar, duracionCant != null ? String(duracionCant) : null)
            .input('DurUnid', sql.NVarChar, duracionUnid || null)
            .input('FreqCant', sql.NVarChar, frecuenciaCant != null ? String(frecuenciaCant) : null)
            .input('FreqUnid', sql.NVarChar, frecuenciaUnid || null)
            .input('Finalidad', sql.NVarChar, finalidad != null ? String(finalidad) : null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]
                (
                    [Id Evaluacion Entidad RDA Consulta Externa],
                    [Tipo Tec Salud], [Codigo Medicamento], [Nombre Medicamento], [Descripcion Comun DCI],
                    [Fecha Prescripcion], [Dosis Ordenada], [Unidad Medida Dosis], [Via Administracion],
                    [Duracion Cantidad], [Duracion Unidad Tiempo], [Frecuencia Cantidad], [Frecuencia Unidad Tiempo],
                    [Finalidad Tec Salud], [Id Estado]
                )
                VALUES
                (
                    @IdRDACE,
                    @TipoTec, @CodigoMed, @NombreMed, @Dci,
                    @FechaPresc, @Dosis, @UnidadDosis, @Via,
                    @DurCant, @DurUnid, @FreqCant, @FreqUnid,
                    @Finalidad, @IdEstado
                )
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Prescripción medicamento:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/PrescripcionProcedimientos', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, tipo, codigo, nombre, finalidad, fechaPrescripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('TipoTec', sql.NVarChar, tipo || null)
            .input('CodigoProc', sql.NVarChar, codigo || null)
            .input('NombreProc', sql.NVarChar, nombre || null)
            .input('Finalidad', sql.NVarChar, finalidad || null)
            .input('FechaPresc', sql.DateTime2, toDateTimeRDACE(fechaPrescripcion))
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Tipo Tec Salud], [Codigo Procedimiento], [Nombre Procedimiento], [Finalidad Tec Salud], [Fecha Prescripcion], [Id Estado])
                VALUES (@IdRDACE, @TipoTec, @CodigoProc, @NombreProc, @Finalidad, @FechaPresc, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Prescripción procedimiento:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

router.post('/EvaluacionEntidadRDACE/OtrasTecnologias', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, tipo, codigo, nombre, fechaPrescripcion, finalidad, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('TipoTec', sql.NVarChar, tipo || null)
            .input('Codigo', sql.NVarChar, codigo || null)
            .input('Nombre', sql.NVarChar, nombre || null)
            .input('FechaPresc', sql.DateTime2, toDateTimeRDACE(fechaPrescripcion))
            .input('Finalidad', sql.NVarChar, finalidad || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Otras Tecnologias]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Tipo Tec Salud], [Codigo], [Nombre], [Fecha Prescripcion], [Finalidad Tec Salud], [Id Estado])
                VALUES (@IdRDACE, @TipoTec, @Codigo, @Nombre, @FechaPresc, @Finalidad, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Otra tecnología:', error);
        if (!res.headersSent) res.status(500).json({ ok: false, error: error.message });
    }
});

// ===========================================================================
// CATÁLOGOS 1888
// ===========================================================================

// Egreso y Remisión — sin ?q = todo; con ?q = filtro
router.get('/EgresoRemision', async (req, res) => {
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Egreso y Remision 1888]`);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Egreso y Remision 1888] WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda`);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Egreso y Remisión:', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

router.get('/FactorDeRiesgo', async (req, res) => {
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Factor De Riesgo 1888]`);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Factor De Riesgo 1888] WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda`);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Factor De Riesgo:', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

router.get('/TipoTecnologiaEnSalud', async (req, res) => {
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Tipo de tecnología en salud 1888]`);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`SELECT Codigo, Descripcion, IdEstado FROM [Cnsta Tipo de tecnología en salud 1888] WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda`);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Tipo de tecnología en salud:', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

const RDACE_CATALOGOS_1888 = {
    EntornoAtencion:             '[Cnsta Entorno de atencion 1888]',
    TipoAlergia:                 '[Cnsta Tipo de alergia 1888]',
    ParentescoFamiliar:          '[Cnsta Parentesco familiar RDA 1888]',
    TipoDiagnosticoPrincipal:    '[Cnsta Tipo diagnostico principal 1888]',
    UnidadMedidaDosis:           '[Cnsta Unidad medida dosis 1888]',
    ViaAdministracionMedicamento:'[Cnsta Via administracion medicamento 1888]',
    UnidadTiempoDuracion:        '[Cnsta Unidad tiempo duracion 1888]',
    UnidadTiempoFrecuencia:      '[Cnsta Unidad tiempo frecuencia 1888]',
    FinalidadTecnologiaSalud:    '[Cnsta Finalidad tecnologia salud 1888]',
    OtraTecnologiaCategoria:     '[Cnsta Otra tecnologia categoria 1888]',
    AlcanceIncapacidad:          '[Cnsta Alcance incapacidad 1888]',
};

router.get('/Catalogo1888/:clave', async (req, res) => {
    const viewName = RDACE_CATALOGOS_1888[req.params.clave];
    if (!viewName) return res.status(404).json({ error: 'Catálogo no encontrado', clave: req.params.clave });
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`SELECT Codigo, Descripcion, IdEstado FROM ${viewName}`);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`SELECT Codigo, Descripcion, IdEstado FROM ${viewName} WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda`);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error catálogo 1888', req.params.clave, error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

// ===========================================================================
// FHIR BUNDLE — construcción local (sin envío a IHCE)
// ===========================================================================
// Body:  { "IdEvaluacionEntidadRDACE": 123,
//          "overrideNombrePrestadorIPS": "...",   // opcional
//          "overrideNitPrestadorIPS":   "..." }   // opcional
// Envío IHCE (pendiente): POST /Composition/$enviar-rda-consulta
router.post('/RdaConsultaExterna/FhirBundle', async (req, res) => {
    const { IdEvaluacionEntidadRDACE } = req.body || {};
    const id = IdEvaluacionEntidadRDACE != null ? parseInt(IdEvaluacionEntidadRDACE, 10) : NaN;
    if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
    }

    const { randomUUID } = require('crypto');
    const newUuid = () => {
        try { if (typeof randomUUID === 'function') return randomUUID(); } catch (_) {}
        return `uuid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };
    const makeEntry = (resource) => { resource.id = resource.id || newUuid(); return { resource }; };
    const refOf = (entryOrId) => {
        if (typeof entryOrId === 'string') return `#${entryOrId}`;
        const r = entryOrId && entryOrId.resource ? entryOrId.resource : entryOrId;
        const rid = r && r.id ? String(r.id) : '';
        if (!rid) throw new Error('[RDACE] No se puede referenciar un recurso sin id');
        return `#${rid}`;
    };

    const nowIso        = new Date().toISOString();
    const str           = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);
    const toIsoDateTime = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); };
    const toIsoDate     = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]; };

    const RDA_SD       = 'https://fhir.minsalud.gov.co/rda/StructureDefinition';
    const CS_MODALITY  = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality';
    const CS_GRUPO_SVC = 'https://fhir.minsalud.gov.co/rda/CodeSystem/GrupoServicios';
    const CS_ENTORNO   = 'https://fhir.minsalud.gov.co/rda/CodeSystem/EntornoAtencion';
    const CS_CAUSA_EXT = 'https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSCausaExternaVersion2';
    const CS_DIAG_ROLE = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDiagnosisRole';
    const CS_TIPO_DIAG = 'https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSTipoDiagnosticoPrincipalVersion2';
    const CS_EGRESO    = 'https://fhir.minsalud.gov.co/rda/CodeSystem/CondicionyDestinoUsuarioEgreso';
    const ICD10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10';
    const ICD11_SYSTEM = 'http://hl7.org/fhir/sid/icd-11';

    try {
        const pool = await poolPromise;

        // 1) Cabecera RDACE + catálogos de modalidad, grupo, vía, causa
        const mainResult = await pool.request()
            .input('Id', sql.Int, id)
            .query(`
                SELECT
                    ce.[Documento Entidad]               AS DocumentoEntidad,
                    ce.[Fecha RDA]                       AS FechaRDA,
                    ce.[Codigo Prestador]                AS CodigoPrestador,
                    ce.[Codigo Admin Plan Beneficios]    AS CodigoAdminPlanBeneficios,
                    ce.[Nombre Admin Plan Beneficios]    AS NombreAdminPlanBeneficios,
                    ce.[Fecha Hora Inicio Atencion]      AS FechaHoraInicioAtencion,
                    ce.[Fecha Hora Fin Atencion]         AS FechaHoraFinAtencion,
                    ce.[Tipo Doc Profesional]            AS TipoDocProfesional,
                    ce.[Num Doc Profesional]             AS NumDocProfesional,
                    ce.[Diagnostico Ingreso CIE11 Codigo]  AS DiagnosticoIngresoCIE11Codigo,
                    ce.[Diagnostico Ingreso CIE11 Termino] AS DiagnosticoIngresoCIE11Termino,
                    ce.[Tipo Alergia]                    AS TipoAlergia,
                    ce.[Entorno Atencion]                AS EntornoAtencion,
                    ce.[Tipo Factor Riesgo]              AS TipoFactorRiesgo,
                    ce.[Nombre Factor Riesgo]            AS NombreFactorRiesgo,
                    ce.[Diagnostico Principal CIE10 Codigo]  AS DiagPrincipalCIE10Codigo,
                    ce.[Diagnostico Principal CIE10 Nombre]  AS DiagPrincipalCIE10Nombre,
                    ce.[Tipo Diagnostico Principal]      AS TipoDiagnosticoPrincipal,
                    ce.[Condicion Destino Egreso]        AS CondicionDestinoEgreso,
                    ce.[Codigo Prestador Remite]         AS CodigoPrestadorRemite,
                    ce.[Alcance Incapacidad]             AS AlcanceIncapacidad,
                    ce.[Dias Incapacidad]                AS DiasIncapacidad,
                    ce.[Dias Licencia Maternidad]        AS DiasLicenciaMaternidad,
                    ce.[Id Modalidad Atencion]           AS IdModalidadAtencion,
                    ce.[Id Grupo Servicios]              AS IdGrupoServicios,
                    ce.[Id Via Ingreso Usuario]          AS IdViaIngresoUsuario,
                    ce.[Id Causa Motivo Atencion]        AS IdCausaMotivoAtencion,
                    ma.[Codigo]                          AS CodigoModalidadAtencion,
                    ma.[NombreModalidadAtencion]         AS NombreModalidadAtencion,
                    gs.[Codigo]                          AS CodigoGrupoServicios,
                    gs.[NombreGrupoServicios]            AS NombreGrupoServicios,
                    via.[Codigo]                         AS CodigoViaIngreso,
                    via.[NombreViaIngresoUsuario]        AS NombreViaIngreso,
                    causa.[Codigo]                       AS CodigoCausaMotivo,
                    causa.[NombreRIPSCausaExternaVersion2] AS NombreCausaMotivo
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa] ce
                LEFT JOIN [dbo].[Cnsta Relacionador Modalidad Atencion] ma
                    ON ma.[IdModalidadAtencion] = ce.[Id Modalidad Atencion]
                LEFT JOIN [dbo].[Cnsta Relacionador ModalidadGrupoServicioTecSal] gs
                    ON gs.[IdGrupoServicios] = ce.[Id Grupo Servicios]
                LEFT JOIN [dbo].[Cnsta Relacionador Via Ingreso Usuario] via
                    ON via.[IdViaIngresoUsuario] = ce.[Id Via Ingreso Usuario]
                LEFT JOIN [dbo].[Cnsta Relacionador Causa Externa] causa
                    ON causa.[Id RIPS Causa Externa Version2] = ce.[Id Causa Motivo Atencion]
                WHERE ce.[Id Evaluacion Entidad RDA Consulta Externa] = @Id
            `);

        if (!mainResult.recordset || !mainResult.recordset.length) {
            return res.status(404).json({ ok: false, error: 'No existe Evaluacion Entidad RDA Consulta Externa para el Id indicado' });
        }
        const head = mainResult.recordset[0];

        // 2) Demographics del paciente desde [Cnsta Relacionador Usuarios Info]
        let pdem = {};
        const docPac = str(head.DocumentoEntidad);
        if (docPac) {
            const patResult = await pool.request()
                .input('DocumentoPaciente', sql.VarChar(50), docPac)
                .query(`
                    SELECT TOP 1
                        TipoDocumentoBase,
                        PrimerApellidoBase, SegundoApellidoBase,
                        PrimerNombreBase, SegundoNombreBase,
                        [CódigoSexo]              AS CodigoSexo,
                        Sexo,
                        FechaNacimientoBase        AS FechaNacimiento,
                        codigoIdentidadGeneroBase  AS CodigoIdentidadGenero,
                        IdentidadGeneroBase        AS TextoIdentidadGenero,
                        IdSexoIdentidadGenero      AS IdIdentidadGenero,
                        [CódigoZonaResidencia]     AS CodigoZonaResidencia,
                        ZonaResidencia,
                        [CódigoEtnia]              AS CodigoEtnia,
                        Etnia                      AS TextoEtnia,
                        ComunidadEtnica,
                        Codigo                     AS CodigoDiscapacidad,
                        Discapacidad               AS TextoDiscapacidad,
                        CodigoPaisNacionalidad,
                        NombrePaisNACIONALIDAD     AS NombrePaisNacionalidad,
                        CodigoPaisRecidencia       AS CodigoPaisResidencia,
                        NombrePaisRecidencia       AS NombrePaisResidencia,
                        CodigoMunicipioRecidencia  AS CodigoMunicipio,
                        NombreMunicipioRecidencia  AS NombreMunicipio,
                        Direccion,
                        Tel                        AS TelefonoCelular
                    FROM [dbo].[Cnsta Relacionador Usuarios Info]
                    WHERE DocumentoPaciente = @DocumentoPaciente
                `);
            if (patResult.recordset && patResult.recordset.length) pdem = patResult.recordset[0];
        }

        // 3) Overrides opcionales de IPS (no hay tabla dedicada en RDACE)
        const codPrest       = str(head.CodigoPrestador);
        const nitIpsOverride = str((req.body || {}).overrideNitPrestadorIPS);
        const nomIpsOverride = str((req.body || {}).overrideNombrePrestadorIPS);

        // 4) Tablas hijas en paralelo
        const [diagRelRes, medPresRes, procPresRes, otrasTecRes] = await Promise.all([
            pool.request().input('Id', sql.Int, id).query(`
                SELECT [Codigo CIE10] AS CodigoCIE10, [Nombre CIE10] AS NombreCIE10,
                       [Codigo CIE11] AS CodigoCIE11, [Termino CIE11] AS TerminoCIE11
                FROM [dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
            `),
            pool.request().input('Id', sql.Int, id).query(`
                SELECT [Codigo Medicamento] AS CodigoMedicamento, [Nombre Medicamento] AS NombreMedicamento,
                       [Descripcion Comun DCI] AS DCI, [Fecha Prescripcion] AS FechaPrescripcion,
                       [Dosis Ordenada] AS DosisOrdenada, [Unidad Medida Dosis] AS UnidadDosis,
                       [Via Administracion] AS ViaAdministracion,
                       [Duracion Cantidad] AS DuracionCantidad, [Duracion Unidad Tiempo] AS DuracionUnidad,
                       [Frecuencia Cantidad] AS FrecuenciaCantidad, [Frecuencia Unidad Tiempo] AS FrecuenciaUnidad,
                       [Finalidad Tec Salud] AS Finalidad
                FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
            `),
            pool.request().input('Id', sql.Int, id).query(`
                SELECT [Codigo Procedimiento] AS CodigoProcedimiento,
                       [Nombre Procedimiento] AS NombreProcedimiento,
                       [Finalidad Tec Salud] AS Finalidad, [Fecha Prescripcion] AS FechaPrescripcion
                FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
            `),
            pool.request().input('Id', sql.Int, id).query(`
                SELECT [Codigo] AS Codigo, [Nombre] AS Nombre,
                       [Fecha Prescripcion] AS FechaPrescripcion, [Finalidad Tec Salud] AS Finalidad
                FROM [dbo].[Evaluacion Entidad RDA CE Otras Tecnologias]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1
            `),
        ]);

        const diagRelacionados   = diagRelRes.recordset  || [];
        const medPrescripciones  = medPresRes.recordset  || [];
        const procPrescripciones = procPresRes.recordset || [];
        const otrasTecnologias   = otrasTecRes.recordset || [];

        // =======================================================================
        // CONSTRUCCIÓN DE RECURSOS FHIR
        // =======================================================================

        // Organization EAPB
        const orgId = str(head.CodigoAdminPlanBeneficios) || newUuid();
        const eapbOrgEntry = str(head.NombreAdminPlanBeneficios) ? makeEntry({
            resourceType: 'Organization',
            id: orgId,
            meta: { profile: [`${RDA_SD}/HealthBenefitPlanAdminOrganizationRDA`] },
            identifier: str(head.CodigoAdminPlanBeneficios) ? [{
                use: 'official',
                type: { coding: [
                    { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'NIIP', display: 'National Insurance Payor Identifier' },
                    { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'EAPB', display: 'Entidad Administradora de Planes de Beneficios' },
                ] },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/EAPB',
                value: str(head.CodigoAdminPlanBeneficios),
            }] : undefined,
            active: true,
            name: str(head.NombreAdminPlanBeneficios),
        }) : null;

        // Organization IPS
        const ipsId = codPrest || newUuid();
        let ipsOrgEntry = null;
        if (codPrest) {
            const nitIps    = nitIpsOverride || null;
            const nombreIps = nomIpsOverride || `IPS (${codPrest})`;
            ipsOrgEntry = makeEntry({
                resourceType: 'Organization',
                id: ipsId,
                meta: { profile: [`${RDA_SD}/CareDeliveryOrganizationRDA`] },
                active: true,
                name: nombreIps,
                identifier: [
                    ...(nitIps ? [{
                        id: 'TaxIdentifier', use: 'official',
                        type: { coding: [
                            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'TAX', display: 'Tax ID number' },
                            { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'NIT', display: 'Número de Identificación Tributaria' },
                        ] },
                        system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/DIAN',
                        value: nitIps,
                    }] : []),
                    {
                        id: 'HealthcareProviderIdentifier', use: 'official',
                        type: { coding: [
                            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                            { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'CodigoPrestador', display: 'Código de habilitación de prestador de servicios de salud' },
                        ] },
                        system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                        value: codPrest,
                    },
                ],
            });
        }

        // Patient
        const docTypeLabels = {
            CC: 'Cédula ciudadanía', TI: 'Tarjeta de identidad', RC: 'Registro civil',
            CE: 'Cédula de extranjería', PA: 'Pasaporte', PE: 'Permiso especial de permanencia',
            PT: 'Permiso temporal de permanencia', CD: 'Carné diplomático', SC: 'Salvo conducto',
            PPT: 'Permiso por Protección Temporal', AS: 'Adulto sin identificación',
            MS: 'Menor sin identificación', SI: 'Sin identificación',
        };
        const docTypeCode  = str(pdem.TipoDocumentoBase) || 'SI';
        const pacienteId   = `${docTypeCode}-${docPac || 'NO-INFORMADO'}`;
        const sexCode      = str(pdem.CodigoSexo) || str(pdem.Sexo);
        const fhirGender   = sexCode ? ({ F: 'female', M: 'male' }[sexCode.toUpperCase()] || 'other') : undefined;
        const bioGenderMap = { F: { code: '02', display: 'Mujer' }, M: { code: '01', display: 'Hombre' } };
        const bioGender    = sexCode ? (bioGenderMap[sexCode.toUpperCase()] || { code: '03', display: 'Indeterminado o Intersexual' }) : null;
        const zonaText     = str(pdem.ZonaResidencia) || str(pdem.CodigoZonaResidencia) || '';
        const zonaLower    = zonaText.toLowerCase();
        const zonaCode     = (zonaLower === 'r' || zonaLower.includes('rural')) ? '02' : (zonaLower === 'u' || zonaLower.includes('urban')) ? '01' : (zonaText ? '01' : null);
        const zonaDisplay  = zonaCode === '02' ? 'Rural' : zonaCode === '01' ? 'Urbana' : undefined;

        const patExt = [];
        if (str(pdem.CodigoPaisNacionalidad)) patExt.push({ url: `${RDA_SD}/ExtensionPatientNationality`,   valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661',                       code: str(pdem.CodigoPaisNacionalidad), display: str(pdem.NombrePaisNacionalidad) || undefined } });
        if (str(pdem.CodigoEtnia))            patExt.push({ url: `${RDA_SD}/ExtensionPatientEthnicity`,     valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianEthnicGroup',           code: str(pdem.CodigoEtnia),            display: str(pdem.TextoEtnia)            || undefined } });
        if (str(pdem.ComunidadEtnica))        patExt.push({ url: `${RDA_SD}/ExtensionPatientEthnicCommunity`, valueString: str(pdem.ComunidadEtnica) });
        if (str(pdem.CodigoDiscapacidad))     patExt.push({ url: `${RDA_SD}/ExtensionPatientDisability`,    valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDisabilityClassification', code: str(pdem.CodigoDiscapacidad),    display: str(pdem.TextoDiscapacidad)     || undefined } });
        if (str(pdem.CodigoIdentidadGenero) && pdem.IdIdentidadGenero && pdem.IdIdentidadGenero !== 0) patExt.push({ url: `${RDA_SD}/ExtensionPatientGenderIdentity`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderIdentity', code: str(pdem.CodigoIdentidadGenero), display: str(pdem.TextoIdentidadGenero) || undefined } });

        const primerApellido  = str(pdem.PrimerApellidoBase)  || '';
        const segundoApellido = str(pdem.SegundoApellidoBase) || '';
        const primerNombre    = str(pdem.PrimerNombreBase)    || '';
        const segundoNombre   = str(pdem.SegundoNombreBase)   || '';
        const familyText      = primerApellido || undefined;
        const givenArr        = [primerNombre, segundoNombre].filter(Boolean);
        const familyExtArr    = [
            ...(primerApellido  ? [{ url: `${RDA_SD}/ExtensionFathersFamilyName`, valueString: primerApellido  }] : []),
            ...(segundoApellido ? [{ url: `${RDA_SD}/ExtensionMothersFamilyName`, valueString: segundoApellido }] : []),
        ];
        const hasAddr  = str(pdem.CodigoPaisResidencia) || str(pdem.NombreMunicipio) || str(pdem.Direccion);
        const homeAddr = hasAddr ? (() => {
            const addr = { id: 'HomeAddress-0', use: 'home', type: 'physical' };
            if (zonaCode) addr.extension = [{ url: `${RDA_SD}/ExtensionResidenceZone`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianResidenceZone', code: zonaCode, display: zonaDisplay } }];
            if (str(pdem.Direccion)) addr.line = [str(pdem.Direccion)];
            if (str(pdem.NombreMunicipio)) {
                addr.city = str(pdem.NombreMunicipio);
                if (str(pdem.CodigoMunicipio)) addr._city = { extension: [{ url: `${RDA_SD}/ExtensionDivipolaMunicipality`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/DIVIPOLA', code: str(pdem.CodigoMunicipio) } }] };
            }
            if (str(pdem.CodigoPaisResidencia)) {
                addr.country  = str(pdem.NombrePaisResidencia) || str(pdem.CodigoPaisResidencia);
                addr._country = { extension: [{ url: `${RDA_SD}/ExtensionCountryCode`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661', code: str(pdem.CodigoPaisResidencia) } }] };
            }
            return addr;
        })() : null;

        const patientEntry = makeEntry({
            resourceType: 'Patient',
            id: pacienteId,
            meta: { profile: [`${RDA_SD}/PatientRDA`] },
            ...(patExt.length > 0 ? { extension: patExt } : {}),
            identifier: docPac ? [{
                id: 'NationalPersonIdentifier-0', use: 'official',
                type: { coding: [
                    { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PN', display: 'Person number' },
                    ...(docTypeCode ? [{ system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier', code: docTypeCode, display: docTypeLabels[docTypeCode] || docTypeCode }] : []),
                ] },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC',
                value: docPac,
            }] : undefined,
            active: true,
            ...(familyText || givenArr.length > 0 ? { name: [{ use: 'official', ...(familyText ? { family: familyText } : {}), ...(familyExtArr.length > 0 ? { _family: { extension: familyExtArr } } : {}), ...(givenArr.length > 0 ? { given: givenArr } : {}) }] } : {}),
            ...(fhirGender ? { gender: fhirGender } : {}),
            ...(bioGender  ? { _gender: { extension: [{ url: `${RDA_SD}/ExtensionBiologicalGender`, valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderGroup', code: bioGender.code, display: bioGender.display } }] } } : {}),
            ...(() => {
                const birthIso = toIsoDate(pdem.FechaNacimiento);
                if (!birthIso) return {};
                const out = { birthDate: birthIso };
                const bd = new Date(pdem.FechaNacimiento);
                if (!isNaN(bd.getTime()) && (bd.getUTCHours() || bd.getUTCMinutes() || bd.getUTCSeconds())) {
                    out._birthDate = { extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/patient-birthTime', valueDateTime: bd.toISOString() }] };
                }
                return out;
            })(),
            deceasedBoolean: false,
            ...(str(pdem.TelefonoCelular) ? { telecom: [{ system: 'phone', value: str(pdem.TelefonoCelular) }] } : {}),
            ...(homeAddr    ? { address: [homeAddr] } : {}),
            ...(eapbOrgEntry ? { managingOrganization: { reference: refOf(eapbOrgEntry), display: str(head.NombreAdminPlanBeneficios) || undefined } } : {}),
        });

        // Practitioner
        const tipoProf = str(head.TipoDocProfesional) || 'SI';
        const numProf  = str(head.NumDocProfesional)  || 'NO-INFORMADO';
        const practId  = `${tipoProf}-${numProf}`;
        const practitionerEntry = makeEntry({
            resourceType: 'Practitioner',
            id: practId,
            meta: { profile: [`${RDA_SD}/PractitionerRDA`] },
            identifier: [{ id: 'NationalPersonIdentifier-0', use: 'official',
                type: { coding: [
                    { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PN', display: 'Person number' },
                    { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier', code: tipoProf, display: docTypeLabels[tipoProf] || tipoProf },
                ] },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC',
                value: numProf,
            }],
            active: true,
        });

        // Condition principal (CIE-10 + CIE-11)
        const condPrincipalEntry = (str(head.DiagPrincipalCIE10Codigo) || str(head.DiagnosticoIngresoCIE11Codigo)) ? makeEntry({
            resourceType: 'Condition',
            id: 'Condition-0',
            meta: { profile: [`${RDA_SD}/ConditionStatementRDA`] },
            subject: { reference: `#${pacienteId}` },
            code: {
                coding: [
                    ...(str(head.DiagPrincipalCIE10Codigo)     ? [{ system: ICD10_SYSTEM, code: str(head.DiagPrincipalCIE10Codigo),     display: str(head.DiagPrincipalCIE10Nombre)       || undefined }] : []),
                    ...(str(head.DiagnosticoIngresoCIE11Codigo) ? [{ system: ICD11_SYSTEM, code: str(head.DiagnosticoIngresoCIE11Codigo), display: str(head.DiagnosticoIngresoCIE11Termino) || undefined }] : []),
                ],
                text: str(head.DiagPrincipalCIE10Nombre) || str(head.DiagnosticoIngresoCIE11Termino) || str(head.DiagPrincipalCIE10Codigo) || undefined,
            },
        }) : null;

        // Conditions relacionadas
        const condRelacionadasEntries = diagRelacionados.map((r, idx) => {
            const c10 = str(r.CodigoCIE10); const c11 = str(r.CodigoCIE11);
            if (!c10 && !c11) return null;
            return makeEntry({
                resourceType: 'Condition',
                id: `Condition-Rel-${idx}`,
                meta: { profile: [`${RDA_SD}/ConditionStatementRDA`] },
                subject: { reference: `#${pacienteId}` },
                code: {
                    coding: [
                        ...(c10 ? [{ system: ICD10_SYSTEM, code: c10, display: str(r.NombreCIE10)   || undefined }] : []),
                        ...(c11 ? [{ system: ICD11_SYSTEM, code: c11, display: str(r.TerminoCIE11) || undefined }] : []),
                    ],
                    text: str(r.NombreCIE10) || str(r.TerminoCIE11) || c10 || c11,
                },
            });
        }).filter(Boolean);

        // AllergyIntolerance
        const tipoAlergia    = str(head.TipoAlergia);
        const allergyTypeCat = (code) => ({ '01': 'medication', '02': 'food', '03': 'environment', '04': 'environment', '05': 'biologic', '06': 'environment' })[String(code || '').trim()] || null;
        const allergyEntry   = tipoAlergia ? makeEntry({
            resourceType: 'AllergyIntolerance',
            id: 'AllergyIntolerance-0',
            meta: { profile: [`${RDA_SD}/AllergyIntoleranceRDA`] },
            clinicalStatus:     { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',     code: 'active'    }] },
            verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }] },
            ...(allergyTypeCat(tipoAlergia) ? { category: [allergyTypeCat(tipoAlergia)] } : {}),
            code: { text: tipoAlergia },
            patient: { reference: `#${pacienteId}` },
        }) : null;

        // RiskAssessment
        const tipoRiesgo   = str(head.TipoFactorRiesgo);
        const nombreRiesgo = str(head.NombreFactorRiesgo);
        const riskEntry    = (tipoRiesgo || nombreRiesgo) ? makeEntry({
            resourceType: 'RiskAssessment',
            id: 'RiskAssessment-0',
            meta: { profile: [`${RDA_SD}/RiskFactorRDA`] },
            status: 'final',
            subject: { reference: `#${pacienteId}` },
            code: {
                coding: tipoRiesgo ? [{ system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/TipoFactorRiesgo', code: tipoRiesgo }] : [],
                text: nombreRiesgo || tipoRiesgo || undefined,
            },
            prediction: [],
        }) : null;

        // MedicationRequest
        const medRequestEntries = medPrescripciones.map((m, idx) => {
            const medCode = str(m.CodigoMedicamento);
            const medName = str(m.NombreMedicamento) || str(m.DCI) || medCode || 'Medicamento';
            const medReq  = {
                resourceType: 'MedicationRequest',
                id: `MedicationRequest-${idx}`,
                meta: { profile: [`${RDA_SD}/MedicationRequestRDA`] },
                status: 'active', intent: 'order',
                medicationCodeableConcept: {
                    coding: medCode ? [{ system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/MIPRES', code: medCode, display: medName }] : [],
                    text: medName,
                },
                subject: { reference: `#${pacienteId}` },
                ...(toIsoDateTime(m.FechaPrescripcion) ? { authoredOn: toIsoDateTime(m.FechaPrescripcion) } : {}),
            };
            const dosis = str(m.DosisOrdenada); const via = str(m.ViaAdministracion);
            const durCant = str(m.DuracionCantidad); const durUnid = str(m.DuracionUnidad);
            const freqCant = str(m.FrecuenciaCantidad); const freqUnid = str(m.FrecuenciaUnidad);
            if (dosis || via || durCant || freqCant) {
                const dosageInst = {};
                if (via)   dosageInst.route       = { text: via };
                if (dosis) dosageInst.doseAndRate = [{ doseQuantity: { value: parseFloat(dosis) || undefined, unit: str(m.UnidadDosis) || undefined } }];
                if (freqCant || durCant) {
                    dosageInst.timing = { repeat: {
                        ...(freqCant ? { frequency:    parseFloat(freqCant) || 1       } : {}),
                        ...(freqUnid ? { periodUnit:   freqUnid                        } : {}),
                        ...(durCant  ? { duration:     parseFloat(durCant)  || undefined } : {}),
                        ...(durUnid  ? { durationUnit: durUnid                         } : {}),
                    } };
                }
                medReq.dosageInstruction = [dosageInst];
            }
            return makeEntry(medReq);
        });

        // ServiceRequest: procedimientos
        const serviceRequestEntries = procPrescripciones.map((p, idx) => {
            const cprod = str(p.CodigoProcedimiento);
            return makeEntry({
                resourceType: 'ServiceRequest',
                id: `ServiceRequest-Proc-${idx}`,
                meta: { profile: [`${RDA_SD}/ServiceRequestRDA`] },
                status: 'active', intent: 'order',
                code: {
                    coding: cprod ? [{ system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS', code: cprod, display: str(p.NombreProcedimiento) || undefined }] : [],
                    text: str(p.NombreProcedimiento) || cprod || 'Procedimiento',
                },
                subject: { reference: `#${pacienteId}` },
                ...(toIsoDateTime(p.FechaPrescripcion) ? { authoredOn: toIsoDateTime(p.FechaPrescripcion) } : {}),
            });
        });

        // ServiceRequest: otras tecnologías
        const otrasTecEntries = otrasTecnologias.map((o, idx) => {
            const cotra = str(o.Codigo);
            return makeEntry({
                resourceType: 'ServiceRequest',
                id: `ServiceRequest-Otra-${idx}`,
                meta: { profile: [`${RDA_SD}/OtherTechnologyServiceRequestRDA`] },
                status: 'active', intent: 'order',
                code: {
                    coding: cotra ? [{ system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/OtrasTecnologias', code: cotra, display: str(o.Nombre) || undefined }] : [],
                    text: str(o.Nombre) || cotra || 'Otra tecnología',
                },
                subject: { reference: `#${pacienteId}` },
                ...(toIsoDateTime(o.FechaPrescripcion) ? { authoredOn: toIsoDateTime(o.FechaPrescripcion) } : {}),
            });
        });

        // Observation: incapacidad
        const alcanceIncapacidad = str(head.AlcanceIncapacidad);
        const diasIncapacidad    = head.DiasIncapacidad        != null ? parseInt(head.DiasIncapacidad, 10)        : null;
        const diasLicencia       = head.DiasLicenciaMaternidad != null ? parseInt(head.DiasLicenciaMaternidad, 10) : null;
        const incapacidadEntry   = (alcanceIncapacidad || (diasIncapacidad != null && !isNaN(diasIncapacidad)) || (diasLicencia != null && !isNaN(diasLicencia))) ? makeEntry({
            resourceType: 'Observation',
            id: 'Observation-Incapacidad-0',
            meta: { profile: [`${RDA_SD}/AttendanceAllowanceRDA`] },
            status: 'final',
            code: { coding: [{ system: 'http://loinc.org', code: '105583-9', display: 'Worker Sick leave form' }], text: 'Datos de incapacidad' },
            subject: { reference: `#${pacienteId}` },
            ...(alcanceIncapacidad ? { valueCodeableConcept: { coding: [{ system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/AlcanceIncapacidad', code: alcanceIncapacidad }] } } : {}),
            ...((diasIncapacidad != null && !isNaN(diasIncapacidad)) ? {
                component: [
                    { code: { coding: [{ system: 'http://loinc.org', code: '74010-0', display: 'Disability days'       }] }, valueQuantity: { value: diasIncapacidad, unit: 'd', system: 'http://unitsofmeasure.org', code: 'd' } },
                    ...((diasLicencia != null && !isNaN(diasLicencia)) ? [{ code: { coding: [{ system: 'http://loinc.org', code: '52473-6', display: 'Maternity leave days' }] }, valueQuantity: { value: diasLicencia, unit: 'd', system: 'http://unitsofmeasure.org', code: 'd' } }] : []),
                ],
            } : {}),
        }) : null;

        // Encounter (EncounterAmbulatoryRDA) — OBLIGATORIO en RDA Consulta
        const allConditionEntries = [...(condPrincipalEntry ? [condPrincipalEntry] : []), ...condRelacionadasEntries];
        const condicionEgreso     = str(head.CondicionDestinoEgreso);
        const codPrestRemite      = str(head.CodigoPrestadorRemite);
        const encounterExt        = [];
        if (condicionEgreso) {
            const egresExt = [{ url: 'DispositionCode', valueCoding: { system: CS_EGRESO, code: condicionEgreso } }];
            if (codPrestRemite) egresExt.push({ url: 'ReferenceOrganization', valueReference: { reference: `#${codPrestRemite}` } });
            encounterExt.push({ url: `${RDA_SD}/ExtensionDischargeDisposition`, extension: egresExt });
        }
        const encounterTypes = [];
        if (str(head.CodigoModalidadAtencion)) encounterTypes.push({ coding: [{ system: CS_MODALITY,  code: str(head.CodigoModalidadAtencion), display: str(head.NombreModalidadAtencion) || undefined }] });
        if (str(head.CodigoGrupoServicios))    encounterTypes.push({ coding: [{ system: CS_GRUPO_SVC, code: str(head.CodigoGrupoServicios),    display: str(head.NombreGrupoServicios)    || undefined }] });
        const entorno = str(head.EntornoAtencion);
        if (entorno) encounterTypes.push({ coding: [{ system: CS_ENTORNO, code: entorno }] });

        const encounterEntry = makeEntry({
            resourceType: 'Encounter',
            id: 'Encounter-0',
            meta: { profile: [`${RDA_SD}/EncounterAmbulatoryRDA`] },
            ...(encounterExt.length > 0 ? { extension: encounterExt } : {}),
            identifier: [{ id: 'EncounterIdentifier', use: 'usual', system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/Encounters', value: `RDACE-${id}` }],
            status: 'finished',
            class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
            ...(encounterTypes.length > 0 ? { type: encounterTypes } : {}),
            subject: { reference: `#${pacienteId}` },
            participant: [{
                id: 'AttenderPhysician',
                type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType', code: 'ATND', display: 'attender' }] }],
                individual: { reference: `#${practId}` },
            }],
            ...(toIsoDateTime(head.FechaHoraInicioAtencion) || toIsoDateTime(head.FechaHoraFinAtencion) ? {
                period: {
                    ...(toIsoDateTime(head.FechaHoraInicioAtencion) ? { start: toIsoDateTime(head.FechaHoraInicioAtencion) } : {}),
                    ...(toIsoDateTime(head.FechaHoraFinAtencion)    ? { end:   toIsoDateTime(head.FechaHoraFinAtencion)    } : {}),
                },
            } : {}),
            ...(str(head.CodigoCausaMotivo) ? { reasonCode: [{ coding: [{ system: CS_CAUSA_EXT, code: str(head.CodigoCausaMotivo), display: str(head.NombreCausaMotivo) || undefined }] }] } : {}),
            ...(condPrincipalEntry ? { diagnosis: [{
                id: 'MainDiagnosis',
                ...(str(head.TipoDiagnosticoPrincipal) ? { extension: [{ url: `${RDA_SD}/ExtensionDiagnosisType`, valueCodeableConcept: { coding: [{ system: CS_TIPO_DIAG, code: str(head.TipoDiagnosticoPrincipal) }] } }] } : {}),
                condition: { reference: refOf(condPrincipalEntry) },
                use: { coding: [{ system: CS_DIAG_ROLE, code: '8319008', display: 'diagnóstico primario' }] },
                rank: 1,
            }] } : {}),
            ...(ipsOrgEntry ? { serviceProvider: { reference: `#${ipsId}` } } : {}),
        });

        // Composition (CompositionAmbulatoryRDA) — 9 secciones
        const compositionDateIso = toIsoDateTime(head.FechaRDA) || nowIso;
        const emptySection = (title, loinc, display) => ({
            title,
            code: { coding: [{ system: 'http://loinc.org', code: loinc, display }] },
            emptyReason: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason', code: 'nilknown', display: 'Nil Known' }], text: 'Sin información registrada' },
        });

        const allMedEntries     = medRequestEntries;
        const allServiceEntries = [...serviceRequestEntries, ...otrasTecEntries];

        const sections = [
            eapbOrgEntry
                ? { title: 'Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)', code: { coding: [{ system: 'http://loinc.org', code: '48768-6', display: 'Payment sources Document' }] }, entry: [{ reference: refOf(eapbOrgEntry) }] }
                : emptySection('Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)', '48768-6', 'Payment sources Document'),
            emptySection('Otros datos demográficos', '74208-0', 'Demographic information + History of occupation Document'),
            incapacidadEntry
                ? { title: 'Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)', code: { coding: [{ system: 'http://loinc.org', code: '105583-9', display: 'Worker Sick leave form' }] }, entry: [{ reference: refOf(incapacidadEntry) }] }
                : emptySection('Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)', '105583-9', 'Worker Sick leave form'),
            allConditionEntries.length > 0
                ? { title: 'Historial de diagnósticos de problemas de salud', code: { coding: [{ system: 'http://loinc.org', code: '11450-4', display: 'Problem list - Reported' }] }, entry: allConditionEntries.map((c) => ({ reference: refOf(c) })) }
                : emptySection('Historial de diagnósticos de problemas de salud', '11450-4', 'Problem list - Reported'),
            allergyEntry
                ? { title: 'Historial de alergias, intolerancias y reacciones adversas', code: { coding: [{ system: 'http://loinc.org', code: '48765-2', display: 'Allergies and adverse reactions Document' }] }, entry: [{ reference: refOf(allergyEntry) }] }
                : emptySection('Historial de alergias, intolerancias y reacciones adversas', '48765-2', 'Allergies and adverse reactions Document'),
            riskEntry
                ? { title: 'Factores de riesgo', code: { coding: [{ system: 'http://loinc.org', code: '75492-9', display: 'Risk assessment and screening note' }] }, entry: [{ reference: refOf(riskEntry) }] }
                : emptySection('Factores de riesgo', '75492-9', 'Risk assessment and screening note'),
            allMedEntries.length > 0
                ? { title: 'Historial de medicamentos', code: { coding: [{ system: 'http://loinc.org', code: '10160-0', display: 'History of Medication use Narrative' }] }, entry: allMedEntries.map((m) => ({ reference: refOf(m) })) }
                : emptySection('Historial de medicamentos', '10160-0', 'History of Medication use Narrative'),
            allServiceEntries.length > 0
                ? { title: 'Órdenes, prescripciones o solicitudes de servicio', code: { coding: [{ system: 'http://loinc.org', code: '61146-1', display: 'Orders for services Document' }] }, entry: allServiceEntries.map((s) => ({ reference: refOf(s) })) }
                : emptySection('Órdenes, prescripciones o solicitudes de servicio', '61146-1', 'Orders for services Document'),
            // PDF pendiente: DocumentReferenceEPIRDA
            emptySection('Documentos de soporte', '55107-7', 'Addendum Document'),
        ];

        const compositionEntry = makeEntry({
            resourceType: 'Composition',
            id: 'Composition-0',
            meta: { profile: [`${RDA_SD}/CompositionAmbulatoryRDA`] },
            status: 'final',
            type: { coding: [{ system: 'http://loinc.org', code: '51845-6', display: 'Outpatient Consult note' }] },
            subject:         { reference: `#${pacienteId}` },
            encounter:       { reference: refOf(encounterEntry) },
            date:            compositionDateIso,
            author:          [{ reference: `#${practId}` }],
            title:           'Resumen Digital de Atención en Salud - RDA de consulta externa',
            confidentiality: 'N',
            attester:        [{ mode: 'legal', party: { reference: `#${practId}` } }],
            custodian:       ipsOrgEntry ? { reference: `#${ipsId}` } : { reference: `#${practId}` },
            event:           [{ period: {
                ...(toIsoDateTime(head.FechaHoraInicioAtencion) ? { start: toIsoDateTime(head.FechaHoraInicioAtencion) } : {}),
                ...(toIsoDateTime(head.FechaHoraFinAtencion)    ? { end:   toIsoDateTime(head.FechaHoraFinAtencion)    } : {}),
            } }],
            section: sections,
        });

        return res.json({
            resourceType: 'Bundle',
            type: 'document',
            timestamp: compositionDateIso,
            entry: [
                compositionEntry,
                patientEntry,
                encounterEntry,
                practitionerEntry,
                ...(ipsOrgEntry      ? [ipsOrgEntry]      : []),
                ...(eapbOrgEntry     ? [eapbOrgEntry]     : []),
                ...allConditionEntries,
                ...(allergyEntry     ? [allergyEntry]     : []),
                ...(riskEntry        ? [riskEntry]        : []),
                ...allMedEntries,
                ...allServiceEntries,
                ...(incapacidadEntry ? [incapacidadEntry] : []),
            ],
        });

    } catch (error) {
        console.error('❌ [RDACE] Error al construir Bundle FHIR RDA Consulta Externa:', error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
    }
});

module.exports = router;

'use strict';

/**
 * Edición in-place de RDA Paciente / CE pendientes (Enviado=0).
 * GET agregado + PUT cabecera + reemplazo de tablas hijas (Id Estado).
 */

const Router = require('express').Router;
const { sql, poolPromise } = require('../../db2');
const { loadRdaceAggregate } = require('../../rda/rdaceAggregateLoader');
const { loadRdaPacienteAggregate } = require('../../rda/rdaPacienteAggregateLoader');
const { validatePeriodoAtencionNoFuturo } = require('../../rda/rdaPeriodoAtencion');

const router = Router();

function toIntOrNull(v) {
    if (v == null || v === '') return null;
    const n = parseInt(String(v).trim(), 10);
    return Number.isFinite(n) ? n : null;
}

function toTrimmedOrNull(v) {
    if (v == null) return null;
    const s = String(v).trim();
    return s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' ? null : s;
}

function toDateOrNull(v) {
    if (v == null || v === '') return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}

function parseCodigoDesc(descripcion) {
    const t = String(descripcion || '').trim();
    if (!t) return { codigo: '', descripcion: '' };
    const m = t.match(/^([A-Za-z0-9.+]+)\s*-\s*(.*)$/);
    if (m) return { codigo: m[1].trim(), descripcion: (m[2] || '').trim() };
    return { codigo: '', descripcion: t };
}

function parseMedicamentoDesc(descripcion) {
    const t = String(descripcion || '').trim();
    const obsMatch = t.match(/^(.*?)\s*\((.*)\)\s*$/);
    const base = obsMatch ? obsMatch[1].trim() : t;
    const observacion = obsMatch ? (obsMatch[2] || '').trim() : '';
    const parsed = parseCodigoDesc(base);
    return {
        codigo: parsed.codigo,
        nombre: parsed.descripcion || (parsed.codigo ? '' : base),
        observacion,
    };
}

function assertEditablePendiente(enviado, enviadoPruebas, ambiente) {
    const env = String(ambiente || 'prod').toLowerCase() === 'sandbox' ? 'sandbox' : 'prod';
    const flag = env === 'sandbox' ? Number(enviadoPruebas || 0) : Number(enviado || 0);
    if (flag === 1 || flag === 2) {
        const err = new Error(
            flag === 2
                ? 'Este RDA no es reenviable (Enviado=2). No se puede editar desde este módulo.'
                : 'Este RDA ya fue enviado correctamente (Enviado=1). La edición v1 solo aplica a pendientes.'
        );
        err.status = 409;
        throw err;
    }
}

async function withTransaction(pool, fn) {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
        const result = await fn(transaction);
        await transaction.commit();
        return result;
    } catch (e) {
        try {
            await transaction.rollback();
        } catch (_) {
            /* noop */
        }
        throw e;
    }
}

function requestTx(transaction) {
    return new sql.Request(transaction);
}

/** GET /RdaEdicion/paciente/:id */
router.get('/RdaEdicion/paciente/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'Id inválido.' });
        }
        const pool = await poolPromise;
        const agg = await loadRdaPacienteAggregate(pool, sql, id);
        const c = agg.cabecera;

        const listas = {
            antecedentesSalud: (agg.antecedentesSalud || []).map((r) => {
                const p = parseCodigoDesc(r.Descripcion);
                return { codigo: p.codigo, descripcion: p.descripcion, raw: r.Descripcion };
            }),
            antecedentesFamiliares: (agg.antecedentesFamiliares || []).map((r) => {
                const p = parseCodigoDesc(r.Descripcion);
                return {
                    parentesco: r.Parentesco || '',
                    textoParentesco: r.Parentesco || '',
                    codigo: p.codigo,
                    descripcion: p.descripcion,
                    cie11Codigo: r.CIE11Codigo || '',
                    cie11Termino: r.CIE11Termino || '',
                    raw: r.Descripcion,
                };
            }),
            antecedentesFarmacologicos: (agg.antecedentesFarmacologicos || []).map((r) => {
                const p = parseMedicamentoDesc(r.Descripcion);
                return {
                    codigo: p.codigo,
                    nombre: p.nombre,
                    observacion: p.observacion,
                    raw: r.Descripcion,
                };
            }),
        };

        return res.json({
            ok: true,
            tipo: 'paciente',
            id,
            enviado: Number(c.Enviado || 0),
            enviadoPruebas: Number(c.EnviadoPruebas || 0),
            cabecera: c,
            listas,
        });
    } catch (err) {
        if (err && err.code === 'RDA_PAC_NOT_FOUND') {
            return res.status(404).json({ ok: false, error: err.message });
        }
        console.error('❌ [RdaEdicion] GET paciente:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
});

/** GET /RdaEdicion/ce/:id */
router.get('/RdaEdicion/ce/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'Id inválido.' });
        }
        const includePdf = ['1', 'true', 'yes'].includes(
            String(req.query.includePdf || '').trim().toLowerCase()
        );
        const pool = await poolPromise;

        const envRow = await pool
            .request()
            .input('Id', sql.Int, id)
            .query(`
                SELECT [Enviado] AS Enviado, [Enviado pruebas] AS EnviadoPruebas
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id
            `);
        if (!envRow.recordset || !envRow.recordset.length) {
            return res.status(404).json({ ok: false, error: 'No existe RDA Consulta Externa para el Id indicado.' });
        }

        const agg = await loadRdaceAggregate(pool, sql, id, {});
        const h = agg.head || {};

        const cabecera = {
            IdEvaluacionEntidadRDACE: id,
            DocumentoEntidad: h.DocumentoEntidad,
            FechaRDA: h.FechaRDA,
            CodigoPrestador: h.CodigoPrestador,
            CodigoAdminPlanBeneficios: h.CodigoAdminPlanBeneficios,
            NombreAdminPlanBeneficios: h.NombreAdminPlanBeneficios,
            FechaHoraInicioAtencion: h.FechaHoraInicioAtencion,
            FechaHoraFinAtencion: h.FechaHoraFinAtencion,
            TipoDocProfesional: h.TipoDocProfesional,
            NumDocProfesional: h.NumDocProfesional,
            DiagnosticoIngresoCIE11Codigo: h.DiagnosticoIngresoCIE11Codigo,
            DiagnosticoIngresoCIE11Termino: h.DiagnosticoIngresoCIE11Termino,
            TipoAlergia: h.TipoAlergia,
            EntornoAtencion: h.EntornoAtencion,
            TipoFactorRiesgo: h.TipoFactorRiesgo,
            NombreFactorRiesgo: h.NombreFactorRiesgo,
            DiagnosticoPrincipalCIE10Codigo: h.DiagPrincipalCIE10Codigo,
            DiagnosticoPrincipalCIE10Nombre: h.DiagPrincipalCIE10Nombre,
            TipoDiagnosticoPrincipal: h.TipoDiagnosticoPrincipal,
            CondicionDestinoEgreso: h.CondicionDestinoEgreso,
            CodigoPrestadorRemite: h.CodigoPrestadorRemite,
            AlcanceIncapacidad: h.AlcanceIncapacidad,
            DiasIncapacidad: h.DiasIncapacidad,
            DiasLicenciaMaternidad: h.DiasLicenciaMaternidad,
            NombreDocumentoPDF: h.NombreDocumentoPDF,
            NotasAdicionalesPdf: h.NotasAdicionalesPdf,
            IdModalidadAtencion: h.IdModalidadAtencion,
            IdGrupoServicios: h.IdGrupoServicios,
            IdViaIngresoUsuario: h.IdViaIngresoUsuario,
            IdCausaMotivoAtencion: h.IdCausaMotivoAtencion,
            NombreTipoAlergia: h.NombreTipoAlergia,
            NombreEntornoAtencion: h.NombreEntornoAtencion,
            NombreTipoDiagnosticoPrincipal: h.NombreTipoDiagnosticoPrincipal,
            NombreCondicionDestinoEgreso: h.NombreCondicionDestinoEgreso,
            NombreAlcanceIncapacidad: h.NombreAlcanceIncapacidad,
        };

        const demografia = agg.pdem || {};

        const listas = {
            antecedentesSalud: (agg.antecedentesSalud || []).map((r) => {
                const p = parseCodigoDesc(r.Descripcion);
                return { codigo: p.codigo, descripcion: p.descripcion, raw: r.Descripcion };
            }),
            antecedentesFamiliares: (agg.antecedentesFamiliares || []).map((r) => {
                const p = parseCodigoDesc(r.Descripcion);
                return {
                    parentesco: r.Parentesco || '',
                    textoParentesco: r.Parentesco || '',
                    codigo: p.codigo,
                    descripcion: p.descripcion,
                    raw: r.Descripcion,
                };
            }),
            antecedentesFarmacologicos: (agg.antecedentesFarmacologicos || []).map((r) => {
                const p = parseMedicamentoDesc(r.Descripcion);
                return {
                    codigo: p.codigo,
                    nombre: p.nombre,
                    observacion: p.observacion,
                    raw: r.Descripcion,
                };
            }),
            diagRelacionados: (agg.diagRelacionados || []).map((r) => ({
                codigoCIE10: r.CodigoCIE10 || '',
                nombreCIE10: r.NombreCIE10 || '',
                codigoCIE11: r.CodigoCIE11 || '',
                terminoCIE11: r.TerminoCIE11 || '',
            })),
            prescripcionMed: (agg.medPrescripciones || []).map((r) => ({
                tipo: 'M',
                codigo: r.CodigoMedicamento || '',
                nombre: r.NombreMedicamento || '',
                dci: r.DCI || '',
                fechaPrescripcion: r.FechaPrescripcion || null,
                dosis: r.DosisOrdenada != null ? String(r.DosisOrdenada) : '',
                unidadDosis: r.UnidadDosisCodigo || r.UnidadDosis || '',
                unidadDosisDisplay: r.UnidadDosisDescripcion || '',
                viaCodigo: r.ViaAdministracionCodigo || r.ViaAdministracion || '',
                viaDisplay: r.ViaAdministracionDescripcion || '',
                via: r.ViaAdministracionCodigo || r.ViaAdministracion || '',
                duracionCant: r.DuracionCantidad != null ? String(r.DuracionCantidad) : '',
                duracionUnid: r.DuracionUnidadCodigo || r.DuracionUnidad || '',
                duracionDisplay: r.DuracionUnidadDescripcion || '',
                frecuenciaCant: r.FrecuenciaCantidad != null ? String(r.FrecuenciaCantidad) : '',
                frecuenciaUnid: r.FrecuenciaUnidadCodigo || r.FrecuenciaUnidad || '',
                frecuenciaDisplay: r.FrecuenciaUnidadDescripcion || '',
                finalidad: r.FinalidadCodigo || r.Finalidad || '',
            })),
            prescripcionProc: (agg.procPrescripciones || []).map((r) => ({
                tipo: 'Procedimiento',
                codigo: r.CodigoProcedimiento || '',
                nombre: r.NombreProcedimiento || '',
                finalidad: r.FinalidadCodigo || r.Finalidad || '',
                fechaPrescripcion: r.FechaPrescripcion || null,
            })),
            otrasTec: (agg.otrasTecnologias || []).map((r) => ({
                tipoCodigo: r.Codigo || '',
                codigo: r.Codigo || '',
                nombre: r.Nombre || '',
                finalidad: r.FinalidadCodigo || r.Finalidad || '',
                fechaPrescripcion: r.FechaPrescripcion || null,
            })),
        };

        const payload = {
            ok: true,
            tipo: 'ce',
            id,
            enviado: Number(envRow.recordset[0].Enviado || 0),
            enviadoPruebas: Number(envRow.recordset[0].EnviadoPruebas || 0),
            cabecera,
            demografia,
            listas,
        };
        if (includePdf && agg.storedPdfBuffer && Buffer.isBuffer(agg.storedPdfBuffer)) {
            payload.pdfBase64 = agg.storedPdfBuffer.toString('base64');
            payload.fechaGeneracionPdf = agg.fechaGeneracionPdf || null;
        }
        return res.json(payload);
    } catch (err) {
        if (err && err.code === 'RDACE_NOT_FOUND') {
            return res.status(404).json({ ok: false, error: err.message });
        }
        console.error('❌ [RdaEdicion] GET ce:', err);
        return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
});

/** PUT /RdaEdicion/paciente/:id — body: { cabecera, listas, ambiente? } */
router.put('/RdaEdicion/paciente/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'Id inválido.' });
        }
        const body = req.body || {};
        const cab = body.cabecera || body;
        const listas = body.listas || {};
        const ambiente = body.ambiente || 'prod';

        const pool = await poolPromise;
        const cur = await pool
            .request()
            .input('Id', sql.Int, id)
            .query(`
                SELECT [Enviado] AS Enviado, [Enviado pruebas] AS EnviadoPruebas,
                       [Documento Entidad] AS DocumentoEntidad
                FROM [dbo].[Evaluacion Entidad RDA]
                WHERE [Id Evaluacion Entidad RDA] = @Id
            `);
        if (!cur.recordset || !cur.recordset.length) {
            return res.status(404).json({ ok: false, error: 'RDA Paciente no encontrado.' });
        }
        assertEditablePendiente(cur.recordset[0].Enviado, cur.recordset[0].EnviadoPruebas, ambiente);

        const dInicio = toDateOrNull(cab.FechaHoraInicioAtencion);
        const dFin = toDateOrNull(cab.FechaHoraFinAtencion);
        const periodoOk = validatePeriodoAtencionNoFuturo(dInicio, dFin);
        if (!periodoOk.ok) {
            return res.status(400).json({ ok: false, error: periodoOk.error });
        }

        const documento =
            toTrimmedOrNull(cab.DocumentoEntidad) ||
            toTrimmedOrNull(cur.recordset[0].DocumentoEntidad);
        if (!documento) {
            return res.status(400).json({ ok: false, error: 'DocumentoEntidad es obligatorio.' });
        }
        if (!toTrimmedOrNull(cab.CodigoPrestador)) {
            return res.status(400).json({ ok: false, error: 'CodigoPrestador es obligatorio.' });
        }
        if (!Number.isFinite(toIntOrNull(cab.IdModalidadAtencion))) {
            return res.status(400).json({ ok: false, error: 'IdModalidadAtencion es obligatorio.' });
        }
        if (!Number.isFinite(toIntOrNull(cab.IdGrupoServicios))) {
            return res.status(400).json({ ok: false, error: 'IdGrupoServicios es obligatorio.' });
        }

        const antSalud = Array.isArray(listas.antecedentesSalud) ? listas.antecedentesSalud : [];
        const antFam = Array.isArray(listas.antecedentesFamiliares) ? listas.antecedentesFamiliares : [];
        const antFarm = Array.isArray(listas.antecedentesFarmacologicos)
            ? listas.antecedentesFarmacologicos
            : [];

        await withTransaction(pool, async (tx) => {
            await requestTx(tx)
                .input('Id', sql.Int, id)
                .input('DocumentoEntidad', sql.NVarChar(50), documento)
                .input('FechaRDA', sql.DateTime2, toDateOrNull(cab.FechaRDA) || new Date())
                .input('IdTipoDocumento', sql.Int, toIntOrNull(cab.IdTipoDocumento))
                .input('PrimerApellidoEntidad', sql.NVarChar(100), toTrimmedOrNull(cab.PrimerApellidoEntidad))
                .input('SegundoApellidoEntidad', sql.NVarChar(100), toTrimmedOrNull(cab.SegundoApellidoEntidad))
                .input('PrimerNombreEntidad', sql.NVarChar(100), toTrimmedOrNull(cab.PrimerNombreEntidad))
                .input('SegundoNombreEntidad', sql.NVarChar(50), toTrimmedOrNull(cab.SegundoNombreEntidad))
                .input('FechaNacimiento', sql.DateTime2, toDateOrNull(cab.FechaNacimiento))
                .input('Edad', sql.Float, cab.Edad != null && String(cab.Edad).trim() !== '' ? Number(cab.Edad) : null)
                .input('IdUnidaddeMedidaEdad', sql.Int, toIntOrNull(cab.IdUnidaddeMedidaEdad))
                .input('IdSexoBiologico', sql.Int, toIntOrNull(cab.IdSexoBiologico))
                .input('IdIdentidadGenero', sql.Int, toIntOrNull(cab.IdIdentidadGenero))
                .input('IdPaisNacionalidad', sql.Int, toIntOrNull(cab.IdPaisNacionalidad))
                .input('Talla', sql.VarChar(10), toTrimmedOrNull(cab.Talla) || '0')
                .input('Peso', sql.VarChar(10), toTrimmedOrNull(cab.Peso) || '0')
                .input('IdPaisRecidencia', sql.Int, toIntOrNull(cab.IdPaisRecidencia))
                .input('IdMunicipioRecidencia', sql.Int, toIntOrNull(cab.IdMunicipioRecidencia))
                .input('IdZonaResidencia', sql.Int, toIntOrNull(cab.IdZonaResidencia))
                .input('Direccion', sql.NVarChar(255), toTrimmedOrNull(cab.Direccion))
                .input('IdEtnia', sql.Int, toIntOrNull(cab.IdEtnia))
                .input('ComunidadEtnica', sql.VarChar(50), toTrimmedOrNull(cab.ComunidadEtnica) || '')
                .input('IdDiscapacidad', sql.Int, toIntOrNull(cab.IdDiscapacidad))
                .input('TelefonoCelular', sql.NVarChar(50), toTrimmedOrNull(cab.TelefonoCelular))
                .input('Alergeno', sql.VarChar(200), toTrimmedOrNull(cab.Alergeno))
                .input('CodigoPrestador', sql.NVarChar(50), toTrimmedOrNull(cab.CodigoPrestador))
                .input('CodigoAdminPlanBeneficios', sql.NVarChar(50), toTrimmedOrNull(cab.CodigoAdminPlanBeneficios))
                .input('NombreAdminPlanBeneficios', sql.NVarChar(200), toTrimmedOrNull(cab.NombreAdminPlanBeneficios))
                .input('FechaHoraInicioAtencion', sql.DateTime2, dInicio)
                .input('FechaHoraFinAtencion', sql.DateTime2, dFin)
                .input('TipoDocProfesional', sql.VarChar(10), toTrimmedOrNull(cab.TipoDocProfesional))
                .input('NumDocProfesional', sql.NVarChar(50), toTrimmedOrNull(cab.NumDocProfesional))
                .input('DiagnosticoIngresoCIE11Codigo', sql.NVarChar(50), toTrimmedOrNull(cab.DiagnosticoIngresoCIE11Codigo))
                .input('DiagnosticoIngresoCIE11Termino', sql.NVarChar(200), toTrimmedOrNull(cab.DiagnosticoIngresoCIE11Termino))
                .input('TipoAlergia', sql.VarChar(5), toTrimmedOrNull(cab.TipoAlergia))
                .input('IdModalidadAtencion', sql.Int, toIntOrNull(cab.IdModalidadAtencion))
                .input('IdGrupoServicios', sql.Int, toIntOrNull(cab.IdGrupoServicios))
                .input('NitPrestadorIPS', sql.NVarChar(20), toTrimmedOrNull(cab.NitPrestadorIPS))
                .input('NombrePrestadorIPS', sql.NVarChar(200), toTrimmedOrNull(cab.NombrePrestadorIPS))
                .query(`
                    UPDATE [dbo].[Evaluacion Entidad RDA]
                    SET
                        [Documento Entidad] = @DocumentoEntidad,
                        [Fecha RDA] = @FechaRDA,
                        [Id Tipo Documento] = @IdTipoDocumento,
                        [Primer Apellido Entidad] = @PrimerApellidoEntidad,
                        [Segundo Apellido Entidad] = @SegundoApellidoEntidad,
                        [Primer Nombre Entidad] = @PrimerNombreEntidad,
                        [Segundo Nombre Entidad] = @SegundoNombreEntidad,
                        [Fecha Nacimiento] = @FechaNacimiento,
                        [Edad] = @Edad,
                        [Id Unidad de Medida Edad] = @IdUnidaddeMedidaEdad,
                        [Id Sexo Biologico] = @IdSexoBiologico,
                        [Id Identidad Genero] = @IdIdentidadGenero,
                        [Id Pais Nacionalidad] = @IdPaisNacionalidad,
                        [Talla] = @Talla,
                        [Peso] = @Peso,
                        [Id Pais Recidencia] = @IdPaisRecidencia,
                        [Id Municipio Recidencia] = @IdMunicipioRecidencia,
                        [Id Zona Residencia] = @IdZonaResidencia,
                        [Dirección] = @Direccion,
                        [Id Etnia] = @IdEtnia,
                        [Comunidad Etnica] = @ComunidadEtnica,
                        [Id Discapacidad] = @IdDiscapacidad,
                        [Teléfono Celular] = @TelefonoCelular,
                        [Alergeno] = @Alergeno,
                        [Codigo Prestador] = @CodigoPrestador,
                        [Codigo Admin Plan Beneficios] = @CodigoAdminPlanBeneficios,
                        [Nombre Admin Plan Beneficios] = @NombreAdminPlanBeneficios,
                        [Fecha Hora Inicio Atencion] = @FechaHoraInicioAtencion,
                        [Fecha Hora Fin Atencion] = @FechaHoraFinAtencion,
                        [Tipo Doc Profesional] = @TipoDocProfesional,
                        [Num Doc Profesional] = @NumDocProfesional,
                        [Diagnostico Ingreso CIE11 Codigo] = @DiagnosticoIngresoCIE11Codigo,
                        [Diagnostico Ingreso CIE11 Termino] = @DiagnosticoIngresoCIE11Termino,
                        [Tipo Alergia] = @TipoAlergia,
                        [Id Modalidad Atencion] = @IdModalidadAtencion,
                        [Id Grupo Servicios] = @IdGrupoServicios,
                        [NIT Prestador IPS] = @NitPrestadorIPS,
                        [Nombre Prestador IPS] = @NombrePrestadorIPS
                    WHERE [Id Evaluacion Entidad RDA] = @Id
                `);

            const childTables = [
                '[Evaluacion Entidad RDA Antecedentes Salud]',
                '[Evaluacion Entidad RDA Antecedentes Familiares]',
                '[Evaluacion Entidad RDA Antecedentes Farmacologicos]',
            ];
            for (const t of childTables) {
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .query(`UPDATE ${t} SET [Id Estado] = 0 WHERE [Id Evaluacion Entidad RDA] = @Id AND [Id Estado] = 1`);
            }

            for (const item of antSalud) {
                const codigo = toTrimmedOrNull(item.codigo) || '';
                const descItem = toTrimmedOrNull(item.descripcion) || '';
                const desc =
                    toTrimmedOrNull(item.raw) ||
                    (codigo ? (descItem ? `${codigo} - ${descItem}` : codigo) : descItem) ||
                    'Sin descripción';
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('DocumentoEntidad', sql.NVarChar(50), documento)
                    .input('Descripcion', sql.VarChar(500), desc.slice(0, 500))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA Antecedentes Salud]
                        ([Id Evaluacion Entidad RDA], [Documento Entidad], [Descripcion], [Id Estado])
                        VALUES (@Id, @DocumentoEntidad, @Descripcion, 1)
                    `);
            }

            for (const item of antFam) {
                const codigo = toTrimmedOrNull(item.codigo) || '';
                const descItem = toTrimmedOrNull(item.descripcion) || '';
                const desc =
                    toTrimmedOrNull(item.raw) ||
                    (codigo ? (descItem ? `${codigo} - ${descItem}` : codigo) : descItem) ||
                    'Sin descripción';
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('DocumentoEntidad', sql.NVarChar(50), documento)
                    .input('Parentesco', sql.NVarChar(100), toTrimmedOrNull(item.parentesco))
                    .input('Descripcion', sql.VarChar(500), desc.slice(0, 500))
                    .input('CIE11Codigo', sql.NVarChar(50), toTrimmedOrNull(item.cie11Codigo))
                    .input('CIE11Termino', sql.NVarChar(300), toTrimmedOrNull(item.cie11Termino))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA Antecedentes Familiares]
                        ([Id Evaluacion Entidad RDA], [Documento Entidad], [Parentesco], [Descripcion],
                         [CIE11 Codigo], [CIE11 Termino], [Id Estado])
                        VALUES (@Id, @DocumentoEntidad, @Parentesco, @Descripcion, @CIE11Codigo, @CIE11Termino, 1)
                    `);
            }

            for (const item of antFarm) {
                const codigo = toTrimmedOrNull(item.codigo) || '';
                const nombre = toTrimmedOrNull(item.nombre) || '';
                const obs = toTrimmedOrNull(item.observacion) || '';
                let desc = toTrimmedOrNull(item.raw);
                if (!desc) {
                    const base = codigo ? (nombre ? `${codigo} - ${nombre}` : codigo) : nombre;
                    desc = obs ? `${base} (${obs})` : base;
                }
                if (!desc) desc = 'Sin descripción';
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('DocumentoEntidad', sql.NVarChar(50), documento)
                    .input('Descripcion', sql.VarChar(500), desc.slice(0, 500))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA Antecedentes Farmacologicos]
                        ([Id Evaluacion Entidad RDA], [Documento Entidad], [Descripcion], [Id Estado])
                        VALUES (@Id, @DocumentoEntidad, @Descripcion, 1)
                    `);
            }
        });

        return res.json({
            ok: true,
            id,
            IdEvaluacionEntidadRDA: id,
            message: 'RDA Paciente actualizado.',
            counts: {
                antecedentesSalud: antSalud.length,
                antecedentesFamiliares: antFam.length,
                antecedentesFarmacologicos: antFarm.length,
            },
        });
    } catch (err) {
        const status = err.status || 500;
        if (status >= 500) console.error('❌ [RdaEdicion] PUT paciente:', err);
        return res.status(status).json({ ok: false, error: err.message || String(err) });
    }
});

/** PUT /RdaEdicion/ce/:id */
router.put('/RdaEdicion/ce/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'Id inválido.' });
        }
        const body = req.body || {};
        const cab = body.cabecera || body;
        const listas = body.listas || {};
        const ambiente = body.ambiente || 'prod';

        const pool = await poolPromise;
        const cur = await pool
            .request()
            .input('Id', sql.Int, id)
            .query(`
                SELECT [Enviado] AS Enviado, [Enviado pruebas] AS EnviadoPruebas,
                       [Documento Entidad] AS DocumentoEntidad
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id
            `);
        if (!cur.recordset || !cur.recordset.length) {
            return res.status(404).json({ ok: false, error: 'RDA Consulta Externa no encontrado.' });
        }
        assertEditablePendiente(cur.recordset[0].Enviado, cur.recordset[0].EnviadoPruebas, ambiente);

        const dInicio = toDateOrNull(cab.FechaHoraInicioAtencion);
        const dFin = toDateOrNull(cab.FechaHoraFinAtencion);
        const periodoOk = validatePeriodoAtencionNoFuturo(dInicio, dFin);
        if (!periodoOk.ok) {
            return res.status(400).json({ ok: false, error: periodoOk.error });
        }

        const documento =
            toTrimmedOrNull(cab.DocumentoEntidad) ||
            toTrimmedOrNull(cur.recordset[0].DocumentoEntidad);
        if (!documento) {
            return res.status(400).json({ ok: false, error: 'DocumentoEntidad es obligatorio.' });
        }
        if (!toTrimmedOrNull(cab.CodigoPrestador)) {
            return res.status(400).json({ ok: false, error: 'CodigoPrestador es obligatorio.' });
        }

        const antSalud = Array.isArray(listas.antecedentesSalud) ? listas.antecedentesSalud : [];
        const antFam = Array.isArray(listas.antecedentesFamiliares) ? listas.antecedentesFamiliares : [];
        const antFarm = Array.isArray(listas.antecedentesFarmacologicos)
            ? listas.antecedentesFarmacologicos
            : [];
        const diagRel = Array.isArray(listas.diagRelacionados) ? listas.diagRelacionados : [];
        const meds = Array.isArray(listas.prescripcionMed) ? listas.prescripcionMed : [];
        const procs = Array.isArray(listas.prescripcionProc) ? listas.prescripcionProc : [];
        const otras = Array.isArray(listas.otrasTec) ? listas.otrasTec : [];

        await withTransaction(pool, async (tx) => {
            await requestTx(tx)
                .input('Id', sql.Int, id)
                .input('DocumentoEntidad', sql.NVarChar(50), documento)
                .input('FechaRDA', sql.DateTime2, toDateOrNull(cab.FechaRDA) || new Date())
                .input('CodigoPrestador', sql.NVarChar(50), toTrimmedOrNull(cab.CodigoPrestador))
                .input('CodigoAdminPlanBeneficios', sql.NVarChar(50), toTrimmedOrNull(cab.CodigoAdminPlanBeneficios))
                .input('NombreAdminPlanBeneficios', sql.NVarChar(200), toTrimmedOrNull(cab.NombreAdminPlanBeneficios))
                .input('FechaHoraInicioAtencion', sql.DateTime2, dInicio)
                .input('FechaHoraFinAtencion', sql.DateTime2, dFin)
                .input('TipoDocProfesional', sql.NVarChar(10), toTrimmedOrNull(cab.TipoDocProfesional))
                .input('NumDocProfesional', sql.NVarChar(50), toTrimmedOrNull(cab.NumDocProfesional))
                .input('DiagnosticoIngresoCIE11Codigo', sql.NVarChar(50), toTrimmedOrNull(cab.DiagnosticoIngresoCIE11Codigo))
                .input('DiagnosticoIngresoCIE11Termino', sql.NVarChar(200), toTrimmedOrNull(cab.DiagnosticoIngresoCIE11Termino))
                .input('TipoAlergia', sql.NVarChar(5), toTrimmedOrNull(cab.TipoAlergia))
                .input('EntornoAtencion', sql.NVarChar(50), toTrimmedOrNull(cab.EntornoAtencion))
                .input('TipoFactorRiesgo', sql.NVarChar(50), toTrimmedOrNull(cab.TipoFactorRiesgo))
                .input('NombreFactorRiesgo', sql.NVarChar(200), toTrimmedOrNull(cab.NombreFactorRiesgo))
                .input('DiagnosticoPrincipalCIE10Codigo', sql.NVarChar(50), toTrimmedOrNull(cab.DiagnosticoPrincipalCIE10Codigo))
                .input('DiagnosticoPrincipalCIE10Nombre', sql.NVarChar(300), toTrimmedOrNull(cab.DiagnosticoPrincipalCIE10Nombre))
                .input('TipoDiagnosticoPrincipal', sql.NVarChar(50), toTrimmedOrNull(cab.TipoDiagnosticoPrincipal))
                .input('CondicionDestinoEgreso', sql.NVarChar(50), toTrimmedOrNull(cab.CondicionDestinoEgreso))
                .input('CodigoPrestadorRemite', sql.NVarChar(50), toTrimmedOrNull(cab.CodigoPrestadorRemite))
                .input('AlcanceIncapacidad', sql.NVarChar(50), toTrimmedOrNull(cab.AlcanceIncapacidad))
                .input('DiasIncapacidad', sql.Int, toIntOrNull(cab.DiasIncapacidad))
                .input('DiasLicenciaMaternidad', sql.Int, toIntOrNull(cab.DiasLicenciaMaternidad))
                .input('NombreDocumentoPDF', sql.NVarChar(200), toTrimmedOrNull(cab.NombreDocumentoPDF))
                .input('NotasAdicionalesPdf', sql.NVarChar(sql.MAX), toTrimmedOrNull(cab.NotasAdicionalesPdf))
                .input('IdModalidadAtencion', sql.Int, toIntOrNull(cab.IdModalidadAtencion))
                .input('IdGrupoServicios', sql.Int, toIntOrNull(cab.IdGrupoServicios))
                .input('IdViaIngresoUsuario', sql.Int, toIntOrNull(cab.IdViaIngresoUsuario))
                .input('IdCausaMotivoAtencion', sql.Int, toIntOrNull(cab.IdCausaMotivoAtencion))
                .query(`
                    UPDATE [dbo].[Evaluacion Entidad RDA Consulta Externa]
                    SET
                        [Documento Entidad] = @DocumentoEntidad,
                        [Fecha RDA] = @FechaRDA,
                        [Codigo Prestador] = @CodigoPrestador,
                        [Codigo Admin Plan Beneficios] = @CodigoAdminPlanBeneficios,
                        [Nombre Admin Plan Beneficios] = @NombreAdminPlanBeneficios,
                        [Fecha Hora Inicio Atencion] = @FechaHoraInicioAtencion,
                        [Fecha Hora Fin Atencion] = @FechaHoraFinAtencion,
                        [Tipo Doc Profesional] = @TipoDocProfesional,
                        [Num Doc Profesional] = @NumDocProfesional,
                        [Diagnostico Ingreso CIE11 Codigo] = @DiagnosticoIngresoCIE11Codigo,
                        [Diagnostico Ingreso CIE11 Termino] = @DiagnosticoIngresoCIE11Termino,
                        [Tipo Alergia] = @TipoAlergia,
                        [Entorno Atencion] = @EntornoAtencion,
                        [Tipo Factor Riesgo] = @TipoFactorRiesgo,
                        [Nombre Factor Riesgo] = @NombreFactorRiesgo,
                        [Diagnostico Principal CIE10 Codigo] = @DiagnosticoPrincipalCIE10Codigo,
                        [Diagnostico Principal CIE10 Nombre] = @DiagnosticoPrincipalCIE10Nombre,
                        [Tipo Diagnostico Principal] = @TipoDiagnosticoPrincipal,
                        [Condicion Destino Egreso] = @CondicionDestinoEgreso,
                        [Codigo Prestador Remite] = @CodigoPrestadorRemite,
                        [Alcance Incapacidad] = @AlcanceIncapacidad,
                        [Dias Incapacidad] = @DiasIncapacidad,
                        [Dias Licencia Maternidad] = @DiasLicenciaMaternidad,
                        [Nombre Documento PDF] = @NombreDocumentoPDF,
                        [Notas Adicionales PDF] = @NotasAdicionalesPdf,
                        [Id Modalidad Atencion] = @IdModalidadAtencion,
                        [Id Grupo Servicios] = @IdGrupoServicios,
                        [Id Via Ingreso Usuario] = @IdViaIngresoUsuario,
                        [Id Causa Motivo Atencion] = @IdCausaMotivoAtencion
                    WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id
                `);

            const childTables = [
                '[Evaluacion Entidad RDA CE Antecedentes Salud]',
                '[Evaluacion Entidad RDA CE Antecedentes Familiares]',
                '[Evaluacion Entidad RDA CE Antecedentes Farmacologicos]',
                '[Evaluacion Entidad RDA CE Diagnosticos Relacionados]',
                '[Evaluacion Entidad RDA CE Prescripcion Medicamentos]',
                '[Evaluacion Entidad RDA CE Prescripcion Procedimientos]',
                '[Evaluacion Entidad RDA CE Otras Tecnologias]',
            ];
            for (const t of childTables) {
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .query(
                        `UPDATE ${t} SET [Id Estado] = 0 WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @Id AND [Id Estado] = 1`
                    );
            }

            for (const item of antSalud) {
                const codigo = toTrimmedOrNull(item.codigo) || '';
                const descItem = toTrimmedOrNull(item.descripcion) || '';
                const desc =
                    toTrimmedOrNull(item.raw) ||
                    (codigo ? (descItem ? `${codigo} - ${descItem}` : codigo) : descItem) ||
                    'Sin descripción';
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('DocumentoEntidad', sql.NVarChar(50), documento)
                    .input('Descripcion', sql.NVarChar(500), desc.slice(0, 500))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Salud]
                        ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Descripcion], [Id Estado])
                        VALUES (@Id, @DocumentoEntidad, @Descripcion, 1)
                    `);
            }

            for (const item of antFam) {
                const codigo = toTrimmedOrNull(item.codigo) || '';
                const descItem = toTrimmedOrNull(item.descripcion) || '';
                const desc =
                    toTrimmedOrNull(item.raw) ||
                    (codigo ? (descItem ? `${codigo} - ${descItem}` : codigo) : descItem) ||
                    'Sin descripción';
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('DocumentoEntidad', sql.NVarChar(50), documento)
                    .input('Parentesco', sql.NVarChar(100), toTrimmedOrNull(item.parentesco))
                    .input('Descripcion', sql.NVarChar(500), desc.slice(0, 500))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Familiares]
                        ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Parentesco], [Descripcion], [Id Estado])
                        VALUES (@Id, @DocumentoEntidad, @Parentesco, @Descripcion, 1)
                    `);
            }

            for (const item of antFarm) {
                const codigo = toTrimmedOrNull(item.codigo) || '';
                const nombre = toTrimmedOrNull(item.nombre) || '';
                const obs = toTrimmedOrNull(item.observacion) || '';
                let desc = toTrimmedOrNull(item.raw);
                if (!desc) {
                    const base = codigo ? (nombre ? `${codigo} - ${nombre}` : codigo) : nombre;
                    desc = obs ? `${base} (${obs})` : base;
                }
                if (!desc) desc = 'Sin descripción';
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('DocumentoEntidad', sql.NVarChar(50), documento)
                    .input('Descripcion', sql.NVarChar(500), desc.slice(0, 500))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Farmacologicos]
                        ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Descripcion], [Id Estado])
                        VALUES (@Id, @DocumentoEntidad, @Descripcion, 1)
                    `);
            }

            for (const item of diagRel) {
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('CodigoCIE10', sql.NVarChar(50), toTrimmedOrNull(item.codigoCIE10 || item.codigo))
                    .input('NombreCIE10', sql.NVarChar(300), toTrimmedOrNull(item.nombreCIE10 || item.nombre))
                    .input('CodigoCIE11', sql.NVarChar(50), toTrimmedOrNull(item.codigoCIE11))
                    .input('TerminoCIE11', sql.NVarChar(300), toTrimmedOrNull(item.terminoCIE11))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados]
                        ([Id Evaluacion Entidad RDA Consulta Externa], [Codigo CIE10], [Nombre CIE10],
                         [Codigo CIE11], [Termino CIE11], [Id Estado])
                        VALUES (@Id, @CodigoCIE10, @NombreCIE10, @CodigoCIE11, @TerminoCIE11, 1)
                    `);
            }

            for (const item of meds) {
                const via = toTrimmedOrNull(item.viaCodigo || item.via || item.viaAdministracion);
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('TipoTec', sql.NVarChar(20), toTrimmedOrNull(item.tipo) || 'M')
                    .input('CodigoMedicamento', sql.NVarChar(50), toTrimmedOrNull(item.codigo))
                    .input('NombreMedicamento', sql.NVarChar(300), toTrimmedOrNull(item.nombre))
                    .input('DCI', sql.NVarChar(300), toTrimmedOrNull(item.dci))
                    .input('FechaPrescripcion', sql.DateTime2, toDateOrNull(item.fechaPrescripcion))
                    .input('DosisOrdenada', sql.NVarChar(50), toTrimmedOrNull(item.dosis))
                    .input('UnidadDosis', sql.NVarChar(50), toTrimmedOrNull(item.unidadDosis))
                    .input('ViaAdministracion', sql.NVarChar(50), via)
                    .input('DuracionCantidad', sql.NVarChar(50), toTrimmedOrNull(item.duracionCant || item.duracionCantidad))
                    .input('DuracionUnidad', sql.NVarChar(50), toTrimmedOrNull(item.duracionUnid || item.duracionUnidad))
                    .input('FrecuenciaCantidad', sql.NVarChar(50), toTrimmedOrNull(item.frecuenciaCant || item.frecuenciaCantidad))
                    .input('FrecuenciaUnidad', sql.NVarChar(50), toTrimmedOrNull(item.frecuenciaUnid || item.frecuenciaUnidad))
                    .input('Finalidad', sql.NVarChar(50), toTrimmedOrNull(item.finalidad))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]
                        (
                            [Id Evaluacion Entidad RDA Consulta Externa],
                            [Tipo Tec Salud], [Codigo Medicamento], [Nombre Medicamento], [Descripcion Comun DCI],
                            [Fecha Prescripcion], [Dosis Ordenada], [Unidad Medida Dosis],
                            [Via Administracion], [Duracion Cantidad], [Duracion Unidad Tiempo],
                            [Frecuencia Cantidad], [Frecuencia Unidad Tiempo], [Finalidad Tec Salud],
                            [Id Estado]
                        )
                        VALUES (
                            @Id, @TipoTec, @CodigoMedicamento, @NombreMedicamento, @DCI,
                            @FechaPrescripcion, @DosisOrdenada, @UnidadDosis,
                            @ViaAdministracion, @DuracionCantidad, @DuracionUnidad,
                            @FrecuenciaCantidad, @FrecuenciaUnidad, @Finalidad, 1
                        )
                    `);
            }

            for (const item of procs) {
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('TipoTec', sql.NVarChar(50), toTrimmedOrNull(item.tipo) || 'Procedimiento')
                    .input('CodigoProcedimiento', sql.NVarChar(50), toTrimmedOrNull(item.codigo))
                    .input('NombreProcedimiento', sql.NVarChar(300), toTrimmedOrNull(item.nombre))
                    .input('Finalidad', sql.NVarChar(50), toTrimmedOrNull(item.finalidad))
                    .input('FechaPrescripcion', sql.DateTime2, toDateOrNull(item.fechaPrescripcion))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos]
                        (
                            [Id Evaluacion Entidad RDA Consulta Externa],
                            [Tipo Tec Salud], [Codigo Procedimiento], [Nombre Procedimiento],
                            [Finalidad Tec Salud], [Fecha Prescripcion], [Id Estado]
                        )
                        VALUES (@Id, @TipoTec, @CodigoProcedimiento, @NombreProcedimiento, @Finalidad, @FechaPrescripcion, 1)
                    `);
            }

            for (const item of otras) {
                await requestTx(tx)
                    .input('Id', sql.Int, id)
                    .input('TipoTec', sql.NVarChar(100), toTrimmedOrNull(item.tipo) || toTrimmedOrNull(item.tipoCodigo))
                    .input('Codigo', sql.NVarChar(50), toTrimmedOrNull(item.codigo || item.tipoCodigo))
                    .input('Nombre', sql.NVarChar(300), toTrimmedOrNull(item.nombre))
                    .input('Finalidad', sql.NVarChar(50), toTrimmedOrNull(item.finalidad))
                    .input('FechaPrescripcion', sql.DateTime2, toDateOrNull(item.fechaPrescripcion))
                    .query(`
                        INSERT INTO [dbo].[Evaluacion Entidad RDA CE Otras Tecnologias]
                        (
                            [Id Evaluacion Entidad RDA Consulta Externa],
                            [Tipo Tec Salud], [Codigo], [Nombre], [Finalidad Tec Salud], [Fecha Prescripcion], [Id Estado]
                        )
                        VALUES (@Id, @TipoTec, @Codigo, @Nombre, @Finalidad, @FechaPrescripcion, 1)
                    `);
            }
        });

        return res.json({
            ok: true,
            id,
            IdEvaluacionEntidadRDACE: id,
            message: 'RDA Consulta Externa actualizado.',
            counts: {
                antecedentesSalud: antSalud.length,
                antecedentesFamiliares: antFam.length,
                antecedentesFarmacologicos: antFarm.length,
                diagRelacionados: diagRel.length,
                prescripcionMed: meds.length,
                prescripcionProc: procs.length,
                otrasTec: otras.length,
            },
        });
    } catch (err) {
        const status = err.status || 500;
        if (status >= 500) console.error('❌ [RdaEdicion] PUT ce:', err);
        return res.status(status).json({ ok: false, error: err.message || String(err) });
    }
});

module.exports = router;

/**
 * RDA Paciente V2 — construcción modular por secciones (sin token/envío).
 *
 * Objetivo:
 * - Construir y validar el JSON clínico sección por sección.
 * - Dejar el envío/token fuera de este archivo (se reutiliza lo existente).
 *
 * Montaje sugerido:
 *   router.use(require('./rda/RdaPacienteRoutesV2'));
 */

'use strict';

const Router = require('express').Router;
const { sql, poolPromise } = require('../../db2');
const http = require('http');

const router = Router();

function str(v) {
    return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function sectionTextDiv(msg) {
    return {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${msg}</div>`,
    };
}

function emptySection(title, loinc, display) {
    return {
        title,
        code: { coding: [{ system: 'http://loinc.org', code: loinc, display }] },
        text: sectionTextDiv('Sin información registrada'),
        emptyReason: {
            coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
                code: 'nilknown',
                display: 'Nil Known',
            }],
            text: 'Sin información registrada',
        },
    };
}

function parseNombreObservacion(raw) {
    const input = str(raw);
    if (!input) return { nombre: '', observacion: '' };
    const idx = input.indexOf('-');
    if (idx > 0) {
        return {
            nombre: str(input.slice(0, idx)),
            observacion: str(input.slice(idx + 1)),
        };
    }
    return { nombre: input, observacion: '' };
}

function parseCodigoDescripcion(raw) {
    const input = str(raw);
    if (!input) return { codigo: '', descripcion: '' };
    const parts = input.split(' - ');
    if (parts.length >= 2) {
        return {
            codigo: str(parts[0]),
            descripcion: str(parts.slice(1).join(' - ')),
        };
    }
    return { codigo: input, descripcion: '' };
}

function buildConditionCodings({ cie10Code, cie10Display, cie11Code, cie11Display }) {
    const codings = [];
    const c10 = str(cie10Code);
    const d10 = str(cie10Display);
    const c11 = str(cie11Code);
    const d11 = str(cie11Display);
    if (c10) {
        codings.push({
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: c10,
            ...(d10 ? { display: d10 } : {}),
        });
    }
    if (c11) {
        codings.push({
            system: 'http://hl7.org/fhir/sid/icd-11',
            code: c11,
            ...(d11 ? { display: d11 } : {}),
        });
    }
    return codings;
}

function parseParentescoAntecedente(value) {
    const s = str(value);
    if (!s) return '';
    const m = s.match(/^(\d{2})/);
    return m ? m[1] : s;
}

function postLocalJson(path, bodyObj) {
    return new Promise((resolve, reject) => {
        const localBase = `http://localhost:${process.env.BACK_PORT || process.env.PORT || 3000}`;
        const payload = JSON.stringify(bodyObj || {});
        const req = http.request(
            `${localBase}${path}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            (resp) => {
                let data = '';
                resp.on('data', (c) => { data += c; });
                resp.on('end', () => resolve({ status: resp.statusCode || 0, body: data }));
            }
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function allergyTypeToCategory(tipoAlergiaCodigo) {
    const map = {
        '01': 'medication',
        '02': 'food',
        '03': 'environment',
        '04': 'environment',
        '05': 'biologic',
        '06': 'environment',
    };
    const code = str(tipoAlergiaCodigo);
    return map[code] || null;
}

function allergyTypeDisplay(tipoAlergiaCodigo) {
    const map = {
        '01': 'Medicamento',
        '02': 'Alimento',
        '03': 'Sustancia del ambiente',
        '04': 'Producto biologico',
        '05': 'Sustancia quimica',
        '06': 'Otro',
    };
    const code = str(tipoAlergiaCodigo);
    return map[code] || '';
}

/**
 * Lista breve de trabajo (orden recomendado).
 * NOTA: esta lista corresponde al núcleo del RDA Paciente según la guía.
 */
const PLAN_SECCIONES_RDA_PACIENTE_V2 = [
    {
        orden: 1,
        seccion: 'Antecedentes farmacológicos',
        loinc: '10160-0',
        recursoPrincipal: 'MedicationStatement',
        estado: 'pendiente',
    },
    {
        orden: 2,
        seccion: 'Antecedentes alérgicos',
        loinc: '48765-2',
        recursoPrincipal: 'AllergyIntolerance',
        estado: 'pendiente',
    },
    {
        orden: 3,
        seccion: 'Antecedentes patológicos',
        loinc: '11450-4',
        recursoPrincipal: 'Condition',
        estado: 'pendiente',
    },
    {
        orden: 4,
        seccion: 'Antecedentes familiares',
        loinc: '10157-6',
        recursoPrincipal: 'FamilyMemberHistory',
        estado: 'pendiente',
    },
];

router.get('/RdaPacienteV2/PlanSecciones', async (req, res) => {
    return res.json({
        ok: true,
        modulo: 'RdaPacienteV2',
        incluyeTokenYEnvio: false,
        totalSecciones: PLAN_SECCIONES_RDA_PACIENTE_V2.length,
        secciones: PLAN_SECCIONES_RDA_PACIENTE_V2,
        nota: 'Trabajar sección por sección. Token/envío se mantiene en rutas existentes.',
    });
});

/**
 * Sección 1: Antecedentes farmacológicos (LOINC 10160-0)
 */
router.post('/RdaPacienteV2/Seccion1AntecedentesFarmacologicos', async (req, res) => {
    try {
        const id = req.body && req.body.IdEvaluacionEntidadRDA != null
            ? parseInt(req.body.IdEvaluacionEntidadRDA, 10)
            : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
        }

        const pool = await poolPromise;

        const evalRes = await pool
            .request()
            .input('IdEvaluacionEntidadRDA', sql.Int, id)
            .query(`
                SELECT TOP (1)
                    [Id Evaluacion Entidad RDA] AS IdEvaluacionEntidadRDA,
                    [Documento Entidad] AS DocumentoEntidad
                FROM [dbo].[Evaluacion Entidad RDA]
                WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
            `);

        if (!evalRes.recordset || evalRes.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDA Paciente con IdEvaluacionEntidadRDA=${id}`,
            });
        }

        const head = evalRes.recordset[0] || {};
        const subjectReference = `#CC-${str(head.DocumentoEntidad) || '00000000'}`;

        const medsRes = await pool
            .request()
            .input('IdEvaluacionEntidadRDA', sql.Int, id)
            .query(`
                SELECT [Descripcion]
                FROM [dbo].[Evaluacion Entidad RDA Antecedentes Farmacologicos]
                WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
                  AND [Id Estado] = 1
            `);

        const meds = (medsRes.recordset || [])
            .map((r) => parseNombreObservacion(r.Descripcion))
            .filter((m) => str(m.nombre));

        if (meds.length === 0) {
            return res.json({
                ok: true,
                IdEvaluacionEntidadRDA: id,
                loinc: '10160-0',
                sectionIndex: 1,
                section: emptySection(
                    'Antecedentes farmacológicos',
                    '10160-0',
                    'History of Medication use Narrative'
                ),
                resources: [],
            });
        }

        const resources = meds.map((m, idx) => ({
            resourceType: 'MedicationStatement',
            id: `MedicationStatement-${idx}`,
            meta: {
                profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/MedicationStatementRDA'],
            },
            // OBLIGATORIO
            status: 'active',
            // OBLIGATORIO
            subject: { reference: subjectReference },
            // OBLIGATORIO
            medicationCodeableConcept: { text: m.nombre },
            // OPCIONAL
            ...(str(m.observacion) ? { note: [{ text: m.observacion }] } : {}),
        }));

        const section = {
            title: 'Antecedentes farmacológicos',
            code: {
                coding: [{ system: 'http://loinc.org', code: '10160-0', display: 'History of Medication use Narrative' }],
            },
            entry: resources.map((r) => ({ reference: `#${r.id}` })),
        };

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDA: id,
            loinc: '10160-0',
            sectionIndex: 1,
            section,
            resources,
        });
    } catch (e) {
        return res.status(500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

/**
 * Sección 2: Antecedentes alérgicos (LOINC 48765-2)
 */
router.post('/RdaPacienteV2/Seccion2AntecedentesAlergicos', async (req, res) => {
    try {
        const id = req.body && req.body.IdEvaluacionEntidadRDA != null
            ? parseInt(req.body.IdEvaluacionEntidadRDA, 10)
            : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
        }

        const pool = await poolPromise;
        const rs = await pool
            .request()
            .input('IdEvaluacionEntidadRDA', sql.Int, id)
            .query(`
                SELECT TOP (1)
                    [Documento Entidad] AS DocumentoEntidad,
                    [Alergeno] AS Alergeno,
                    [Tipo Alergia] AS TipoAlergia
                FROM [dbo].[Evaluacion Entidad RDA]
                WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
            `);

        const head = rs.recordset && rs.recordset[0] ? rs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDA Paciente con IdEvaluacionEntidadRDA=${id}`,
            });
        }

        const rawAlergeno = str(head.Alergeno);
        const rawTipoAlergia = str(head.TipoAlergia);
        const tipoAlergiaCode = (rawTipoAlergia.match(/^(\d{2})/) || [])[1]
            || (rawTipoAlergia ? rawTipoAlergia.slice(0, 2) : '');
        const tipoAlergiaText = allergyTypeDisplay(tipoAlergiaCode) || rawTipoAlergia;
        const categoryCode = allergyTypeToCategory(tipoAlergiaCode);
        const patientReference = `#CC-${str(head.DocumentoEntidad) || '00000000'}`;

        let section;
        const resources = [];
        if (!rawAlergeno && !rawTipoAlergia) {
            section = emptySection(
                'Antecedentes alérgicos',
                '48765-2',
                'Allergies and adverse reactions Document'
            );
        } else {
            const allergy = {
                resourceType: 'AllergyIntolerance',
                id: 'AllergyIntolerance-0',
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/AllergyIntoleranceStatementRDA'],
                },
                // OBLIGATORIO
                clinicalStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                        code: 'active',
                        display: 'Active',
                    }],
                },
                // OBLIGATORIO
                verificationStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                        code: 'confirmed',
                        display: 'Confirmed',
                    }],
                },
                // OPCIONAL
                ...(categoryCode ? { category: [categoryCode] } : {}),
                // OBLIGATORIO
                code: {
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/TipoAlergia',
                        code: tipoAlergiaCode || '99',
                        display: tipoAlergiaText || 'No especificado',
                    }],
                    text: rawAlergeno || tipoAlergiaText || 'No especificado',
                },
                // OBLIGATORIO
                patient: { reference: patientReference },
            };
            resources.push(allergy);

            section = {
                title: 'Antecedentes alérgicos',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '48765-2',
                        display: 'Allergies and adverse reactions Document',
                    }],
                },
                entry: [{ reference: `#${allergy.id}` }],
            };
        }

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDA: id,
            loinc: '48765-2',
            sectionIndex: 2,
            section,
            resources,
            notes: !resources.length
                ? ['Sección devuelta en modo vacío: no hay alérgeno/tipo de alergia registrados.']
                : [],
        });
    } catch (e) {
        return res.status(500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

/**
 * Sección 3: Antecedentes patológicos (LOINC 11450-4)
 */
router.post('/RdaPacienteV2/Seccion3AntecedentesPatologicos', async (req, res) => {
    try {
        const id = req.body && req.body.IdEvaluacionEntidadRDA != null
            ? parseInt(req.body.IdEvaluacionEntidadRDA, 10)
            : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
        }

        const pool = await poolPromise;
        const evalRes = await pool
            .request()
            .input('IdEvaluacionEntidadRDA', sql.Int, id)
            .query(`
                SELECT TOP (1)
                    [Documento Entidad] AS DocumentoEntidad
                FROM [dbo].[Evaluacion Entidad RDA]
                WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
            `);

        const head = evalRes.recordset && evalRes.recordset[0] ? evalRes.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDA Paciente con IdEvaluacionEntidadRDA=${id}`,
            });
        }

        const antRes = await pool
            .request()
            .input('IdEvaluacionEntidadRDA', sql.Int, id)
            .query(`
                SELECT [Descripcion]
                FROM [dbo].[Evaluacion Entidad RDA Antecedentes Salud]
                WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
                  AND [Id Estado] = 1
            `);

        const antecedentes = (antRes.recordset || [])
            .map((r) => parseCodigoDescripcion(r.Descripcion))
            .filter((a) => str(a.codigo) || str(a.descripcion));

        if (antecedentes.length === 0) {
            return res.json({
                ok: true,
                IdEvaluacionEntidadRDA: id,
                loinc: '11450-4',
                sectionIndex: 3,
                section: emptySection(
                    'Antecedentes patológicos',
                    '11450-4',
                    'Problem list - Reported'
                ),
                resources: [],
            });
        }

        const patientReference = `#CC-${str(head.DocumentoEntidad) || '00000000'}`;
        const resources = antecedentes.map((a, idx) => {
            const codings = buildConditionCodings({
                cie10Code: a.codigo,
                cie10Display: a.descripcion,
            });
            return {
                resourceType: 'Condition',
                id: `Condition-${idx}`,
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/ConditionStatementRDA'],
                },
                // OBLIGATORIO
                subject: { reference: patientReference },
                // OBLIGATORIO
                code: {
                    ...(codings.length ? { coding: codings } : {}),
                    text: str(a.descripcion) || str(a.codigo) || 'Antecedente patológico',
                },
            };
        });

        const section = {
            title: 'Antecedentes patológicos',
            code: {
                coding: [{
                    system: 'http://loinc.org',
                    code: '11450-4',
                    display: 'Problem list - Reported',
                }],
            },
            entry: resources.map((r) => ({ reference: `#${r.id}` })),
        };

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDA: id,
            loinc: '11450-4',
            sectionIndex: 3,
            section,
            resources,
        });
    } catch (e) {
        return res.status(500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

/**
 * Sección 4: Antecedentes familiares (LOINC 10157-6)
 */
router.post('/RdaPacienteV2/Seccion4AntecedentesFamiliares', async (req, res) => {
    try {
        const id = req.body && req.body.IdEvaluacionEntidadRDA != null
            ? parseInt(req.body.IdEvaluacionEntidadRDA, 10)
            : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
        }

        const pool = await poolPromise;
        const [evalRes, famRes, parentescosRes] = await Promise.all([
            pool
                .request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT TOP (1)
                        [Documento Entidad] AS DocumentoEntidad
                    FROM [dbo].[Evaluacion Entidad RDA]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
                `),
            pool
                .request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT
                        [Parentesco] AS Parentesco,
                        [Descripcion] AS Descripcion,
                        [CIE11 Codigo] AS CIE11Codigo,
                        [CIE11 Termino] AS CIE11Termino
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Familiares]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
                      AND [Id Estado] = 1
                `),
            pool.request().query(`
                SELECT Codigo, Descripcion
                FROM [dbo].[Cnsta Parentesco familiar RDA 1888]
            `),
        ]);

        const head = evalRes.recordset && evalRes.recordset[0] ? evalRes.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDA Paciente con IdEvaluacionEntidadRDA=${id}`,
            });
        }

        const parentescoMap = new Map(
            (parentescosRes.recordset || []).map((r) => [str(r.Codigo), str(r.Descripcion)])
        );

        const antecedentesFam = (famRes.recordset || []).map((r) => {
            const parsed = parseCodigoDescripcion(r.Descripcion);
            return {
                parentesco: str(r.Parentesco),
                textoParentesco: parentescoMap.get(str(r.Parentesco)) || '',
                codigo: parsed.codigo,
                descripcion: parsed.descripcion,
                cie11Codigo: str(r.CIE11Codigo),
                cie11Termino: str(r.CIE11Termino),
            };
        }).filter((a) => str(a.codigo) || str(a.descripcion) || str(a.cie11Codigo));

        if (antecedentesFam.length === 0) {
            return res.json({
                ok: true,
                IdEvaluacionEntidadRDA: id,
                loinc: '10157-6',
                sectionIndex: 4,
                section: emptySection(
                    'Antecedentes familiares',
                    '10157-6',
                    'History of family member diseases Narrative'
                ),
                resources: [],
            });
        }

        const patientReference = `#CC-${str(head.DocumentoEntidad) || '00000000'}`;
        const resources = antecedentesFam.map((a, idx) => {
            const codings = buildConditionCodings({
                cie10Code: a.codigo,
                cie10Display: a.descripcion,
                cie11Code: a.cie11Codigo,
                cie11Display: a.cie11Termino,
            });
            return {
                resourceType: 'FamilyMemberHistory',
                id: `FamilyMemberHistory-${idx}`,
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/FamilyMemberHistoryRDA'],
                },
                // OBLIGATORIO
                status: 'completed',
                // OBLIGATORIO
                patient: { reference: patientReference },
                // OBLIGATORIO
                relationship: {
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ParentescoAntecedente',
                        code: parseParentescoAntecedente(a.parentesco) || '99',
                        ...(str(a.textoParentesco) ? { display: a.textoParentesco } : {}),
                    }],
                },
                // OBLIGATORIO
                condition: [{
                    code: {
                        ...(codings.length ? { coding: codings } : {}),
                        text: str(a.descripcion) || str(a.codigo) || str(a.cie11Codigo) || 'Antecedente familiar',
                    },
                }],
            };
        });

        const section = {
            title: 'Antecedentes familiares',
            code: {
                coding: [{
                    system: 'http://loinc.org',
                    code: '10157-6',
                    display: 'History of family member diseases Narrative',
                }],
            },
            entry: resources.map((r) => ({ reference: `#${r.id}` })),
        };

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDA: id,
            loinc: '10157-6',
            sectionIndex: 4,
            section,
            resources,
        });
    } catch (e) {
        return res.status(500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

/**
 * Construye el JSON consolidado del RDA Paciente V2 (4 secciones).
 */
router.post('/RdaPacienteV2/JsonCompleto', async (req, res) => {
    try {
        const id = req.body && req.body.IdEvaluacionEntidadRDA != null
            ? parseInt(req.body.IdEvaluacionEntidadRDA, 10)
            : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
        }

        const pool = await poolPromise;
        const [evalRes, medsRes, antRes, famRes, parentescosRes] = await Promise.all([
            pool
                .request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT TOP (1)
                        [Documento Entidad] AS DocumentoEntidad,
                        [Alergeno] AS Alergeno,
                        [Tipo Alergia] AS TipoAlergia
                    FROM [dbo].[Evaluacion Entidad RDA]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
                `),
            pool
                .request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT [Descripcion]
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Farmacologicos]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
                      AND [Id Estado] = 1
                `),
            pool
                .request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT [Descripcion]
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Salud]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
                      AND [Id Estado] = 1
                `),
            pool
                .request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT
                        [Parentesco] AS Parentesco,
                        [Descripcion] AS Descripcion,
                        [CIE11 Codigo] AS CIE11Codigo,
                        [CIE11 Termino] AS CIE11Termino
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Familiares]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
                      AND [Id Estado] = 1
                `),
            pool.request().query(`
                SELECT Codigo, Descripcion
                FROM [dbo].[Cnsta Parentesco familiar RDA 1888]
            `),
        ]);

        const head = evalRes.recordset && evalRes.recordset[0] ? evalRes.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDA Paciente con IdEvaluacionEntidadRDA=${id}`,
            });
        }

        const patientReference = `#CC-${str(head.DocumentoEntidad) || '00000000'}`;
        const sections = [];
        const resources = [];
        const notas = [];

        // Sección 1: farmacológicos
        const meds = (medsRes.recordset || [])
            .map((r) => parseNombreObservacion(r.Descripcion))
            .filter((m) => str(m.nombre));
        if (!meds.length) {
            sections.push(emptySection('Antecedentes farmacológicos', '10160-0', 'History of Medication use Narrative'));
            notas.push('Sección 1 vacía: sin antecedentes farmacológicos.');
        } else {
            const s1Resources = meds.map((m, idx) => ({
                resourceType: 'MedicationStatement',
                id: `MedicationStatement-${idx}`,
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/MedicationStatementRDA'],
                },
                status: 'active',
                subject: { reference: patientReference },
                medicationCodeableConcept: { text: m.nombre },
                ...(str(m.observacion) ? { note: [{ text: m.observacion }] } : {}),
            }));
            resources.push(...s1Resources);
            sections.push({
                title: 'Antecedentes farmacológicos',
                code: {
                    coding: [{ system: 'http://loinc.org', code: '10160-0', display: 'History of Medication use Narrative' }],
                },
                entry: s1Resources.map((r) => ({ reference: `#${r.id}` })),
            });
        }

        // Sección 2: alérgicos
        const rawAlergeno = str(head.Alergeno);
        const rawTipoAlergia = str(head.TipoAlergia);
        const tipoAlergiaCode = (rawTipoAlergia.match(/^(\d{2})/) || [])[1]
            || (rawTipoAlergia ? rawTipoAlergia.slice(0, 2) : '');
        const tipoAlergiaText = allergyTypeDisplay(tipoAlergiaCode) || rawTipoAlergia;
        const categoryCode = allergyTypeToCategory(tipoAlergiaCode);
        if (!rawAlergeno && !rawTipoAlergia) {
            sections.push(emptySection('Antecedentes alérgicos', '48765-2', 'Allergies and adverse reactions Document'));
            notas.push('Sección 2 vacía: sin alérgeno/tipo de alergia.');
        } else {
            const allergy = {
                resourceType: 'AllergyIntolerance',
                id: 'AllergyIntolerance-0',
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/AllergyIntoleranceStatementRDA'],
                },
                clinicalStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                        code: 'active',
                        display: 'Active',
                    }],
                },
                verificationStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                        code: 'confirmed',
                        display: 'Confirmed',
                    }],
                },
                ...(categoryCode ? { category: [categoryCode] } : {}),
                code: {
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/TipoAlergia',
                        code: tipoAlergiaCode || '99',
                        display: tipoAlergiaText || 'No especificado',
                    }],
                    text: rawAlergeno || tipoAlergiaText || 'No especificado',
                },
                patient: { reference: patientReference },
            };
            resources.push(allergy);
            sections.push({
                title: 'Antecedentes alérgicos',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '48765-2',
                        display: 'Allergies and adverse reactions Document',
                    }],
                },
                entry: [{ reference: '#AllergyIntolerance-0' }],
            });
        }

        // Sección 3: patológicos
        const antecedentes = (antRes.recordset || [])
            .map((r) => parseCodigoDescripcion(r.Descripcion))
            .filter((a) => str(a.codigo) || str(a.descripcion));
        if (!antecedentes.length) {
            sections.push(emptySection('Antecedentes patológicos', '11450-4', 'Problem list - Reported'));
            notas.push('Sección 3 vacía: sin antecedentes patológicos.');
        } else {
            const s3Resources = antecedentes.map((a, idx) => {
                const codings = buildConditionCodings({
                    cie10Code: a.codigo,
                    cie10Display: a.descripcion,
                });
                return {
                    resourceType: 'Condition',
                    id: `Condition-${idx}`,
                    meta: {
                        profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/ConditionStatementRDA'],
                    },
                    subject: { reference: patientReference },
                    code: {
                        ...(codings.length ? { coding: codings } : {}),
                        text: str(a.descripcion) || str(a.codigo) || 'Antecedente patológico',
                    },
                };
            });
            resources.push(...s3Resources);
            sections.push({
                title: 'Antecedentes patológicos',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '11450-4',
                        display: 'Problem list - Reported',
                    }],
                },
                entry: s3Resources.map((r) => ({ reference: `#${r.id}` })),
            });
        }

        // Sección 4: familiares
        const parentescoMap = new Map(
            (parentescosRes.recordset || []).map((r) => [str(r.Codigo), str(r.Descripcion)])
        );
        const antecedentesFam = (famRes.recordset || []).map((r) => {
            const parsed = parseCodigoDescripcion(r.Descripcion);
            return {
                parentesco: str(r.Parentesco),
                textoParentesco: parentescoMap.get(str(r.Parentesco)) || '',
                codigo: parsed.codigo,
                descripcion: parsed.descripcion,
                cie11Codigo: str(r.CIE11Codigo),
                cie11Termino: str(r.CIE11Termino),
            };
        }).filter((a) => str(a.codigo) || str(a.descripcion) || str(a.cie11Codigo));
        if (!antecedentesFam.length) {
            sections.push(emptySection('Antecedentes familiares', '10157-6', 'History of family member diseases Narrative'));
            notas.push('Sección 4 vacía: sin antecedentes familiares.');
        } else {
            const s4Resources = antecedentesFam.map((a, idx) => {
                const codings = buildConditionCodings({
                    cie10Code: a.codigo,
                    cie10Display: a.descripcion,
                    cie11Code: a.cie11Codigo,
                    cie11Display: a.cie11Termino,
                });
                return {
                    resourceType: 'FamilyMemberHistory',
                    id: `FamilyMemberHistory-${idx}`,
                    meta: {
                        profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/FamilyMemberHistoryRDA'],
                    },
                    status: 'completed',
                    patient: { reference: patientReference },
                    relationship: {
                        coding: [{
                            system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ParentescoAntecedente',
                            code: parseParentescoAntecedente(a.parentesco) || '99',
                            ...(str(a.textoParentesco) ? { display: a.textoParentesco } : {}),
                        }],
                    },
                    condition: [{
                        code: {
                            ...(codings.length ? { coding: codings } : {}),
                            text: str(a.descripcion) || str(a.codigo) || str(a.cie11Codigo) || 'Antecedente familiar',
                        },
                    }],
                };
            });
            resources.push(...s4Resources);
            sections.push({
                title: 'Antecedentes familiares',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '10157-6',
                        display: 'History of family member diseases Narrative',
                    }],
                },
                entry: s4Resources.map((r) => ({ reference: `#${r.id}` })),
            });
        }

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDA: id,
            patientReference,
            totalSections: sections.length,
            sections,
            totalResources: resources.length,
            resources,
            notes: notas,
        });
    } catch (e) {
        return res.status(500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

/**
 * JsonCompletoEstricto:
 * Falla con 400 si todas las secciones vienen vacías (sin resources).
 */
router.post('/RdaPacienteV2/JsonCompletoEstricto', async (req, res) => {
    try {
        const id = req.body && req.body.IdEvaluacionEntidadRDA != null
            ? parseInt(req.body.IdEvaluacionEntidadRDA, 10)
            : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
        }

        const out = await postLocalJson('/apiV3/RdaPacienteV2/JsonCompleto', { IdEvaluacionEntidadRDA: id });
        let json;
        try {
            json = JSON.parse(out.body || '{}');
        } catch (_) {
            return res.status(500).json({
                ok: false,
                error: 'Respuesta inválida construyendo JsonCompleto de RdaPacienteV2.',
                details: out.body,
            });
        }
        if (out.status < 200 || out.status >= 300 || !json || json.ok !== true) {
            return res.status(out.status || 500).json({
                ok: false,
                error: 'No se pudo construir JsonCompleto para validación estricta.',
                details: json || out.body,
            });
        }

        const totalResources = Array.isArray(json.resources) ? json.resources.length : 0;
        if (totalResources === 0) {
            return res.status(400).json({
                ok: false,
                code: 'RDA_PACIENTE_SIN_CONTENIDO_CLINICO',
                error: 'Modo estricto activo: el RDA Paciente no contiene recursos clínicos en las 4 secciones.',
                details: {
                    IdEvaluacionEntidadRDA: id,
                    totalSections: json.totalSections || 4,
                    totalResources,
                    notes: json.notes || [],
                },
            });
        }

        return res.json({
            ...json,
            strictMode: true,
        });
    } catch (e) {
        return res.status(500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

/**
 * Envío IHCE V2:
 * Reutiliza el flujo estable de RdaPacienteRoutes.js (enviar modular).
 */
async function enviarIhceDesdeV2(req, res, ambiente) {
    try {
        const id = req.body && req.body.IdEvaluacionEntidadRDA != null
            ? parseInt(req.body.IdEvaluacionEntidadRDA, 10)
            : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
        }

        const strictOut = await postLocalJson('/apiV3/RdaPacienteV2/JsonCompletoEstricto', { IdEvaluacionEntidadRDA: id });
        if (strictOut.status < 200 || strictOut.status >= 300) {
            let strictJson;
            try { strictJson = JSON.parse(strictOut.body || '{}'); } catch (_) { strictJson = { raw: strictOut.body }; }
            return res.status(strictOut.status || 400).json({
                ok: false,
                error: 'Falló validación estricta antes de enviar a IHCE.',
                details: strictJson,
            });
        }

        const sendPayload = {
            IdEvaluacionEntidadRDA: id,
            ambiente: ambiente === 'prod' ? 'prod' : 'sandbox',
            // Forzamos modo modular completo para mantener consistencia con V2.
            incluirConditionIngreso: true,
            incluirConditions: true,
            incluirFamilyHistory: true,
            incluirAllergy: true,
            incluirObservations: true,
        };
        const sendOut = await postLocalJson('/apiV3/RdaPaciente/EnviarIHCEModular', sendPayload);
        let parsed;
        try { parsed = JSON.parse(sendOut.body || '{}'); } catch (_) { parsed = null; }

        if (parsed && typeof parsed === 'object') {
            return res.status(sendOut.status || 502).json({
                ...parsed,
                rdaPacienteV2: true,
                delegatedTo: '/apiV3/RdaPaciente/EnviarIHCEModular',
            });
        }
        return res.status(sendOut.status || 502).send(sendOut.body || '');
    } catch (e) {
        return res.status(500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
}

router.post('/RdaPacienteV2/EnviarIhceSandboxV2', async (req, res) => enviarIhceDesdeV2(req, res, 'sandbox'));
router.post('/RdaPacienteV2/EnviarIhceProduccionV2', async (req, res) => enviarIhceDesdeV2(req, res, 'prod'));

module.exports = router;


'use strict';

const https = require('https');
const { URL, URLSearchParams } = require('url');
const Router = require('express').Router;
const { poolPromise, sql } = require('../../db2');
const { loadDotEnvFromCandidates } = require('../../config/envLoader');
const { resolveIhceCreds } = require('../../services/ihceTokenDebug');
const {
    isForceSandboxOnly,
    isForceProdOnly,
    solicitarTokenIhceShared,
    ihceConsultarProfesionalSaludShared,
    ihceConsultarOrganizacionShared,
} = require('../../rda/ihceInteropService');
const { resolveTipoAlergiaDisplay, normalizeTipoAlergiaCode } = require('../../rda/tipoAlergiaCatalog');
const {
    buildNationalPersonIdentifier,
    PersonIdentifierDisplayError,
    normalizeDocTypeCode,
} = require('../../rda/colombianPersonIdentifierCatalog');

const router = Router();

function outboundTimeoutMs() {
    const n = Number(process.env.IHCE_OUTBOUND_TIMEOUT_MS);
    return Number.isFinite(n) && n > 0 ? n : 45000;
}

function str(v) {
    return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function firstEnvKey(...keys) {
    for (let i = 0; i < keys.length; i += 1) {
        const v = process.env[keys[i]];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function httpsPostFormUrlEncoded(urlString, bodyString) {
    return new Promise((resolve, reject) => {
        const ms = outboundTimeoutMs();
        let settled = false;
        let req;
        const timer = setTimeout(() => {
            if (req) req.destroy();
            const err = new Error(
                `Token OAuth (Microsoft): tiempo de espera agotado (${ms} ms). Revise red o aumente IHCE_OUTBOUND_TIMEOUT_MS.`
            );
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
        req = https.request(
            {
                hostname: u.hostname,
                path: u.pathname + (u.search || ''),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(bodyString, 'utf8'),
                },
            },
            (res) => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => finish(null, { status: res.statusCode || 0, body: data }));
            }
        );
        req.on('error', (e) => finish(e));
        req.write(bodyString);
        req.end();
    });
}

function httpsPostFhirJson(urlString, accessToken, subscriptionKey, jsonBody) {
    const body = typeof jsonBody === 'string' ? jsonBody : JSON.stringify(jsonBody);
    return new Promise((resolve, reject) => {
        const ms = outboundTimeoutMs();
        let settled = false;
        let req;
        const timer = setTimeout(() => {
            if (req) req.destroy();
            const err = new Error(
                `Llamada FHIR IHCE: tiempo de espera agotado (${ms} ms). Revise IHCE_*_BASE_URL, red o aumente IHCE_OUTBOUND_TIMEOUT_MS.`
            );
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
        req = https.request(
            {
                hostname: u.hostname,
                path: u.pathname + (u.search || ''),
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Content-Type': 'application/fhir+json',
                    Accept: 'application/fhir+json',
                    'Content-Length': Buffer.byteLength(body, 'utf8'),
                },
            },
            (res) => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => finish(null, { status: res.statusCode || 0, body: data }));
            }
        );
        req.on('error', (e) => finish(e));
        req.write(body);
        req.end();
    });
}

function buildConsultarProfesionalParametersPayload(tipoDocumento, numeroDocumento, humanuser) {
    const tipo = str(tipoDocumento).toUpperCase();
    const num = str(numeroDocumento);
    if (!tipo || !num) return null;
    const parameter = [{
        name: 'identifier',
        part: [
            { name: 'type', valueString: tipo },
            { name: 'value', valueString: num },
        ],
    }];
    if (humanuser != null && str(humanuser)) {
        parameter.push({ name: 'humanuser', valueString: str(humanuser) });
    }
    return { resourceType: 'Parameters', parameter };
}

function buildConsultarOrganizacionParametersFromEnv(ambiente) {
    const prod = ambiente === 'prod';
    const pfx = prod ? 'IHCE_PROD_' : 'IHCE_SANDBOX_';
    let taxId = firstEnvKey(`${pfx}CUSTODIAN_NIT`, 'IHCE_RDACE_DEFAULT_NIT_IPS');
    let reps = firstEnvKey(`${pfx}CUSTODIAN_REPS`, 'IHCE_RDACE_DEFAULT_CODIGO_PRESTADOR');
    let name = firstEnvKey(`${pfx}CUSTODIAN_NAME`, 'IHCE_RDACE_DEFAULT_NOMBRE_IPS');

    if (prod) {
        if (!taxId) taxId = firstEnvKey('IHCE_SANDBOX_CUSTODIAN_NIT');
        if (!reps) reps = firstEnvKey('IHCE_SANDBOX_CUSTODIAN_REPS');
        if (!name) name = firstEnvKey('IHCE_SANDBOX_CUSTODIAN_NAME');
    }

    if (!taxId && !reps && !name) {
        const err = new Error(
            `Defina al menos uno en .env: ${pfx}CUSTODIAN_NIT, ${pfx}CUSTODIAN_REPS o ${pfx}CUSTODIAN_NAME`
        );
        err.code = 'ORG_ENV_INCOMPLETO';
        err.status = 400;
        throw err;
    }

    const parameter = [];
    if (taxId) parameter.push({ name: 'TaxIdentifier', valueString: taxId });
    if (reps) parameter.push({ name: 'HealthcareProviderIdentifier', valueString: reps });
    if (name) parameter.push({ name: 'name', valueString: name });

    return {
        payload: { resourceType: 'Parameters', parameter },
        env_usado: {
            TaxIdentifier: taxId || null,
            HealthcareProviderIdentifier: reps || null,
            name: name || null,
        },
    };
}

async function solicitarTokenIhce(ambiente) {
    const creds = resolveIhceCreds(ambiente === 'prod' ? 'prod' : 'sandbox');
    const missing = [
        !creds.tenantId && 'TENANT_ID',
        !creds.clientId && 'CLIENT_ID',
        !creds.clientSecret && 'CLIENT_SECRET',
        !creds.scope && 'SCOPE',
    ].filter(Boolean);
    if (missing.length) {
        const err = new Error(`Faltan variables en .env: ${missing.join(', ')}`);
        err.code = 'IHCE_ENV_INCOMPLETO';
        err.status = 400;
        throw err;
    }

    const tokenUrl = `https://login.microsoftonline.com/${creds.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        scope: creds.scope,
    }).toString();

    const resp = await httpsPostFormUrlEncoded(tokenUrl, body);
    let parsed;
    try {
        parsed = JSON.parse(resp.body);
    } catch (_) {
        const err = new Error('Respuesta del token no es JSON válido');
        err.code = 'TOKEN_RESPUESTA_INVALIDA';
        err.status = 502;
        err.details = resp.body;
        throw err;
    }

    if (resp.status < 200 || resp.status >= 300) {
        const err = new Error(parsed.error_description || parsed.error || `Token HTTP ${resp.status}`);
        err.code = 'TOKEN_IHCE_ERROR';
        err.status = resp.status >= 400 && resp.status < 600 ? resp.status : 502;
        err.details = parsed;
        throw err;
    }

    return {
        ambiente: ambiente === 'prod' ? 'produccion' : 'sandbox',
        env_prefix: creds.envPrefix,
        token_url: tokenUrl,
        ihce_base_url: creds.baseUrl || null,
        subscription_key_configurada: Boolean(creds.subscriptionKey && str(creds.subscriptionKey)),
        token_type: parsed.token_type || null,
        expires_in: parsed.expires_in != null ? parsed.expires_in : null,
        ext_expires_in: parsed.ext_expires_in != null ? parsed.ext_expires_in : null,
        access_token: parsed.access_token || null,
        scope_respuesta: parsed.scope || null,
    };
}

async function ihceConsultarProfesionalSalud(ambiente, body) {
    const tipo = body.tipoDocumentoProfesional ?? body.tipoDocumento ?? body.tipoDocProfesional ?? body.tipo;
    const numero = body.numeroDocumentoProfesional ?? body.numeroDocumento ?? body.documentoProfesional ?? body.documento ?? body.numDocProfesional ?? body.numero;
    const humanuser = body.humanuser ?? body.humanUser ?? null;
    const payload = buildConsultarProfesionalParametersPayload(tipo, numero, humanuser);

    if (!payload) {
        const err = new Error('Se requiere tipo y número de documento del profesional.');
        err.code = 'PARAMETROS_INCOMPLETOS';
        err.status = 400;
        throw err;
    }

    const tokenOut = await solicitarTokenIhce(ambiente === 'prod' ? 'prod' : 'sandbox');
    if (!tokenOut.access_token) {
        const err = new Error('No se obtuvo access_token');
        err.status = 502;
        throw err;
    }

    const creds = resolveIhceCreds(ambiente === 'prod' ? 'prod' : 'sandbox');
    if (!str(creds.baseUrl)) {
        const err = new Error('Falta IHCE_*_BASE_URL en .env.');
        err.code = 'IHCE_BASE_URL_FALTANTE';
        err.status = 400;
        throw err;
    }
    if (!str(creds.subscriptionKey)) {
        const err = new Error('Falta SUBSCRIPTION_KEY IHCE en .env.');
        err.code = 'IHCE_SUBSCRIPTION_KEY_FALTANTE';
        err.status = 400;
        throw err;
    }

    const base = String(creds.baseUrl).replace(/\/$/, '');
    const opUrl = `${base}/Practitioner/$consultar-profesional-salud`;
    const ihceResp = await httpsPostFhirJson(opUrl, tokenOut.access_token, creds.subscriptionKey, payload);
    let parsedBody;
    try {
        parsedBody = ihceResp.body ? JSON.parse(ihceResp.body) : null;
    } catch (_) {
        parsedBody = { raw: ihceResp.body };
    }

    return {
        ok: ihceResp.status >= 200 && ihceResp.status < 300,
        status: ihceResp.status,
        ambiente: ambiente === 'prod' ? 'produccion' : 'sandbox',
        ihce_url: opUrl,
        request_parameters: payload,
        ihce_response: parsedBody,
    };
}

async function ihceConsultarOrganizacion(ambiente) {
    const { payload, env_usado } = buildConsultarOrganizacionParametersFromEnv(ambiente);
    const tokenOut = await solicitarTokenIhce(ambiente === 'prod' ? 'prod' : 'sandbox');
    if (!tokenOut.access_token) {
        const err = new Error('No se obtuvo access_token');
        err.status = 502;
        throw err;
    }

    const creds = resolveIhceCreds(ambiente === 'prod' ? 'prod' : 'sandbox');
    if (!str(creds.baseUrl)) {
        const err = new Error('Falta IHCE_*_BASE_URL en .env.');
        err.code = 'IHCE_BASE_URL_FALTANTE';
        err.status = 400;
        throw err;
    }
    if (!str(creds.subscriptionKey)) {
        const err = new Error('Falta SUBSCRIPTION_KEY IHCE en .env.');
        err.code = 'IHCE_SUBSCRIPTION_KEY_FALTANTE';
        err.status = 400;
        throw err;
    }

    const base = String(creds.baseUrl).replace(/\/$/, '');
    const opUrl = `${base}/Organization/$consultar-organizacion`;
    const ihceResp = await httpsPostFhirJson(opUrl, tokenOut.access_token, creds.subscriptionKey, payload);
    let parsedBody;
    try {
        parsedBody = ihceResp.body ? JSON.parse(ihceResp.body) : null;
    } catch (_) {
        parsedBody = { raw: ihceResp.body };
    }

    return {
        ok: ihceResp.status >= 200 && ihceResp.status < 300,
        status: ihceResp.status,
        ambiente: ambiente === 'prod' ? 'produccion' : 'sandbox',
        ihce_url: opUrl,
        request_parameters: payload,
        env_usado,
        ihce_response: parsedBody,
    };
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

router.post('/RdaConsultaExterna/Seccion1EAPB', async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consultar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }

        const pool = await poolPromise;
        const rs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Codigo Admin Plan Beneficios] AS CodigoAdminPlanBeneficios,
                    [Nombre Admin Plan Beneficios] AS NombreAdminPlanBeneficios
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = rs.recordset && rs.recordset[0] ? rs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        // OPCIONAL (BD): código EAPB; si viene vacío, se omite identifier y se usa id fallback.
        const codigoEapb = str(head.CodigoAdminPlanBeneficios);
        // REGLA PRÁCTICA: para crear el recurso EAPB exigimos nombre; sin nombre se envía sección vacía.
        const nombreEapb = str(head.NombreAdminPlanBeneficios);

        const eapbOrganization = nombreEapb ? {
            resourceType: 'Organization',
            id: codigoEapb || `EAPB-${id}`,
            meta: {
                profile: [
                    'https://fhir.minsalud.gov.co/rda/StructureDefinition/HealthBenefitPlanAdminOrganizationRDA',
                ],
            },
            identifier: codigoEapb ? [{
                use: 'official',
                type: {
                    coding: [
                        {
                            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                            code: 'NIIP',
                            display: 'National Insurance Payor Identifier',
                        },
                        {
                            system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers',
                            code: 'EAPB',
                            display: 'Entidad Administradora de Planes de Beneficios',
                        },
                    ],
                },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/EAPB',
                value: codigoEapb,
            }] : undefined,
            active: true,
            name: nombreEapb,
        } : null;

        const section = eapbOrganization
            ? {
                // OBLIGATORIO (sección cuando hay dato): título + code LOINC + entry.
                title: 'Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '48768-6',
                        display: 'Payment sources Document',
                    }],
                },
                entry: [{ reference: `#${eapbOrganization.id}` }],
            }
            : emptySection(
                'Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)',
                '48768-6',
                'Payment sources Document'
            );

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            loinc: '48768-6',
            sectionIndex: 1,
            section,
            resources: eapbOrganization ? [eapbOrganization] : [],
        });
    } catch (e) {
        const status = e.code === 'RDACE_NOT_FOUND' ? 404 : (e.status || 500);
        return res.status(status).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/Seccion2OtrosDemograficos', async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consultar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }

        const pool = await poolPromise;
        const rs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Documento Entidad] AS DocumentoEntidad
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = rs.recordset && rs.recordset[0] ? rs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        // OPCIONAL (BD): ocupación del paciente; si Id Ocupación es null, no se incluye en el Bundle.
        let idOcupacion = null;
        let ocupacionCodigo = '';
        let ocupacionNombre = '';
        const docPaciente = str(head.DocumentoEntidad);
        if (docPaciente) {
            const usuarioRs = await pool
                .request()
                .input('DocumentoPaciente', sql.VarChar(50), docPaciente)
                .query(`
                    SELECT TOP 1
                        [IdOcupación] AS IdOcupacion,
                        [CódigoOcupación] AS CodigoOcupacion,
                        [Ocupación] AS Ocupacion
                    FROM [Cnsta Relacionador Usuarios Info]
                    WHERE DocumentoPaciente = @DocumentoPaciente
                `);
            const usuario = usuarioRs.recordset && usuarioRs.recordset[0] ? usuarioRs.recordset[0] : null;
            if (usuario) {
                const idParsed = usuario.IdOcupacion != null ? parseInt(String(usuario.IdOcupacion).trim(), 10) : NaN;
                if (Number.isFinite(idParsed) && idParsed > 0) {
                    idOcupacion = idParsed;
                    ocupacionCodigo = str(usuario.CodigoOcupacion);
                    ocupacionNombre = str(usuario.Ocupacion);
                }
            }
        }

        // OPCIONAL (request fallback): permite pruebas manuales si BD no trae ocupación.
        if (idOcupacion != null) {
            if (!ocupacionCodigo) ocupacionCodigo = str(req.body && req.body.ocupacionCodigo);
            if (!ocupacionNombre) ocupacionNombre = str(req.body && req.body.ocupacionNombre);
        }
        // OPCIONAL (request): referencia del paciente para el Observation.subject.
        const patientRef = str(req.body && req.body.patientReference) || (docPaciente ? `#CC-${docPaciente}` : '');

        let section;
        const resources = [];
        if (idOcupacion != null && (ocupacionCodigo || ocupacionNombre)) {
            const observation = {
                resourceType: 'Observation',
                id: 'Observation-ocupacion-0',
                meta: {
                    profile: [
                        'https://fhir.minsalud.gov.co/rda/StructureDefinition/PatientOccupationAtEncounterRDA',
                    ],
                },
                status: 'final',
                code: {
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: '184104002',
                        display: 'ocupación del paciente',
                    }],
                    text: 'Ocupación del paciente en el momento de la atención',
                },
                valueCodeableConcept: {
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/CIUO88AC',
                        // OPCIONAL: code/display pueden variar según disponibilidad de dato en fuente.
                        ...(ocupacionCodigo ? { code: ocupacionCodigo } : {}),
                        ...(ocupacionNombre ? { display: ocupacionNombre } : {}),
                    }],
                    ...(ocupacionNombre ? { text: ocupacionNombre } : {}),
                },
                ...(patientRef ? { subject: { reference: patientRef } } : {}),
            };
            resources.push(observation);
            section = {
                title: 'Otros datos demográficos',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '74208-0',
                        display: 'Demographic information + History of occupation Document',
                    }],
                },
                entry: [{ reference: `#${observation.id}` }],
            };
        } else {
            section = null;
        }

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            loinc: '74208-0',
            sectionIndex: 2,
            section,
            resources,
            notes: !resources.length
                ? ['Ocupación omitida: Id Ocupación no informado o sin código/nombre (sección opcional 0..1).']
                : [],
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/Seccion3IncapacidadSIPE', async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consultar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }

        const pool = await poolPromise;
        const rs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Documento Entidad] AS DocumentoEntidad,
                    [Alcance Incapacidad] AS AlcanceIncapacidad,
                    [Dias Incapacidad] AS DiasIncapacidad,
                    [Dias Licencia Maternidad] AS DiasLicenciaMaternidad
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = rs.recordset && rs.recordset[0] ? rs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        // OPCIONAL (BD): si no existen estos datos, la sección se envía vacía.
        const LICENSE_SCOPE_DISPLAY = { '01': 'Nueva', '02': 'Prórroga' };
        const alcance = str(head.AlcanceIncapacidad);
        const diasIncapacidad = Number(head.DiasIncapacidad);
        const diasLicencia = Number(head.DiasLicenciaMaternidad);

        // OPCIONAL (request): referencias para enlazar en pruebas aisladas.
        const docPaciente = str(head.DocumentoEntidad);
        const patientRef = str(req.body && req.body.patientReference) || (docPaciente ? `#CC-${docPaciente}` : '');
        const encounterRef = str(req.body && req.body.encounterReference) || '#Encounter-0';

        let section;
        const resources = [];
        const tieneIncapacidad = Boolean(
            alcance ||
            Number.isFinite(diasIncapacidad) ||
            Number.isFinite(diasLicencia)
        );

        if (tieneIncapacidad) {
            const components = [];
            if (alcance) {
                // OPCIONAL: mapeo simple, priorizando dato clínico legible sobre catálogo estricto por ahora.
                components.push({
                    id: 'LicenseScope',
                    code: {
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: '255590007',
                            display: 'alcance',
                        }],
                        text: 'Incapacidad - Alcance de la incapacidad',
                    },
                    valueCodeableConcept: {
                        coding: [{
                            system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianLicenseScope',
                            code: alcance,
                            display: LICENSE_SCOPE_DISPLAY[alcance] || alcance,
                        }],
                        text: LICENSE_SCOPE_DISPLAY[alcance] || alcance,
                    },
                });
            }
            if (Number.isFinite(diasIncapacidad)) {
                components.push({
                    id: 'DisabilityDays',
                    code: {
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: '410670007',
                            display: 'tiempo',
                        }],
                        text: 'Días de incapacidad',
                    },
                    valueQuantity: {
                        value: diasIncapacidad,
                        unit: 'días',
                        system: 'http://unitsofmeasure.org',
                        code: 'd',
                    },
                });
            }
            if (Number.isFinite(diasLicencia)) {
                components.push({
                    id: 'MaternityLicenceTime',
                    code: {
                        coding: [{
                            system: 'http://snomed.info/sct',
                            code: '410670007',
                            display: 'tiempo',
                        }],
                        text: 'Días de licencia de maternidad',
                    },
                    valueQuantity: {
                        value: diasLicencia,
                        unit: 'días',
                        system: 'http://unitsofmeasure.org',
                        code: 'd',
                    },
                });
            }

            const observation = {
                resourceType: 'Observation',
                id: 'Observation-incapacidad-0',
                meta: {
                    profile: [
                        'https://fhir.minsalud.gov.co/rda/StructureDefinition/AttendanceAllowanceRDA',
                    ],
                },
                status: 'final',
                code: {
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: '160983005',
                        display: 'permiso de concurrencia',
                    }],
                    text: 'Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)',
                },
                ...(patientRef ? { subject: { reference: patientRef } } : {}),
                ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
                ...(components.length ? { component: components } : {}),
            };

            resources.push(observation);
            section = {
                title: 'Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '105583-9',
                        display: 'Worker Sick leave form',
                    }],
                },
                entry: [{ reference: `#${observation.id}` }],
            };
        } else {
            section = emptySection(
                'Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)',
                '105583-9',
                'Worker Sick leave form'
            );
        }

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            loinc: '105583-9',
            sectionIndex: 3,
            section,
            resources,
            notes: !resources.length
                ? ['Sección devuelta en modo vacío: no hay datos de alcance/días de incapacidad en la evaluación.']
                : [],
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/Seccion4Diagnosticos', async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consultar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }

        const pool = await poolPromise;
        const headRs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Documento Entidad] AS DocumentoEntidad,
                    [Diagnostico Principal CIE10 Codigo] AS DiagPrincipalCIE10Codigo,
                    [Diagnostico Principal CIE10 Nombre] AS DiagPrincipalCIE10Nombre,
                    [Diagnostico Ingreso CIE11 Codigo] AS DiagnosticoIngresoCIE11Codigo,
                    [Diagnostico Ingreso CIE11 Termino] AS DiagnosticoIngresoCIE11Termino
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = headRs.recordset && headRs.recordset[0] ? headRs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        const relRs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT
                    [Codigo CIE10] AS CodigoCIE10,
                    [Nombre CIE10] AS NombreCIE10,
                    [Codigo CIE11] AS CodigoCIE11,
                    [Termino CIE11] AS TerminoCIE11
                FROM [dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
                  AND [Id Estado] = 1
            `);
        const relacionados = relRs.recordset || [];

        const docPaciente = str(head.DocumentoEntidad);
        const patientRef = str(req.body && req.body.patientReference) || (docPaciente ? `#CC-${docPaciente}` : '');

        const ICD10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10';
        const ICD11_SYSTEM = 'http://id.who.int/icd/release/11/mms';
        const CONDITION_PROFILE = 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ConditionRDA';

        const conditionBase = {
            clinicalStatus: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code: 'active',
                    display: 'Active',
                }],
            },
            verificationStatus: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                    code: 'confirmed',
                    display: 'Confirmed',
                }],
            },
            category: [{
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                    code: 'encounter-diagnosis',
                    display: 'Encounter Diagnosis',
                }],
            }],
        };

        const resources = [];
        let seq = 0;

        // OPCIONAL (BD): diagnóstico principal; si existe, se agrega como primer Condition.
        const pC10 = str(head.DiagPrincipalCIE10Codigo);
        const pN10 = str(head.DiagPrincipalCIE10Nombre);
        const pC11 = str(head.DiagnosticoIngresoCIE11Codigo);
        const pN11 = str(head.DiagnosticoIngresoCIE11Termino);
        if (pC10 || pC11) {
            resources.push({
                resourceType: 'Condition',
                id: `Condition-${seq++}`,
                meta: { profile: [CONDITION_PROFILE] },
                ...conditionBase,
                ...(patientRef ? { subject: { reference: patientRef } } : {}),
                code: {
                    coding: [
                        ...(pC10 ? [{ system: ICD10_SYSTEM, code: pC10, display: pN10 || undefined }] : []),
                        ...(pC11 ? [{ system: ICD11_SYSTEM, code: pC11, display: pN11 || undefined }] : []),
                    ],
                    text: pN10 || pN11 || pC10 || pC11 || undefined,
                },
            });
        }

        // OPCIONAL (BD): diagnósticos relacionados; se agregan como Condition adicionales.
        for (const r of relacionados) {
            const c10 = str(r.CodigoCIE10);
            const n10 = str(r.NombreCIE10);
            const c11 = str(r.CodigoCIE11);
            const n11 = str(r.TerminoCIE11);
            if (!c10 && !c11) continue;
            resources.push({
                resourceType: 'Condition',
                id: `Condition-${seq++}`,
                meta: { profile: [CONDITION_PROFILE] },
                ...conditionBase,
                ...(patientRef ? { subject: { reference: patientRef } } : {}),
                code: {
                    coding: [
                        ...(c10 ? [{ system: ICD10_SYSTEM, code: c10, display: n10 || undefined }] : []),
                        ...(c11 ? [{ system: ICD11_SYSTEM, code: c11, display: n11 || undefined }] : []),
                    ],
                    text: n10 || n11 || c10 || c11 || undefined,
                },
            });
        }

        const section = resources.length
            ? {
                // OBLIGATORIO (sección cuando hay dato): título + code LOINC + entry.
                title: 'Historial de diagnósticos de problemas de salud',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '11450-4',
                        display: 'Problem list - Reported',
                    }],
                },
                entry: resources.map((c) => ({ reference: `#${c.id}` })),
            }
            : emptySection(
                'Historial de diagnósticos de problemas de salud',
                '11450-4',
                'Problem list - Reported'
            );

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            loinc: '11450-4',
            sectionIndex: 4,
            section,
            resources,
            notes: !resources.length
                ? ['Sección devuelta en modo vacío: no hay diagnóstico principal ni diagnósticos relacionados activos.']
                : [],
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/Seccion5Alergias', async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consultar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }

        const pool = await poolPromise;
        const rs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Documento Entidad] AS DocumentoEntidad,
                    [Tipo Alergia] AS TipoAlergia
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = rs.recordset && rs.recordset[0] ? rs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        // OPCIONAL (BD): tipo alergia; si no existe se envía sección vacía.
        const rawTipoAlergia = str(head.TipoAlergia);
        const tipoAlergiaCode = normalizeTipoAlergiaCode(rawTipoAlergia);
        const tipoAlergiaText = resolveTipoAlergiaDisplay(tipoAlergiaCode, str(head.NombreTipoAlergia)) || rawTipoAlergia;

        const docPaciente = str(head.DocumentoEntidad);
        // OPCIONAL (request): permite forzar referencia del paciente para pruebas.
        const patientRef = str(req.body && req.body.patientReference) || (docPaciente ? `#CC-${docPaciente}` : '');

        let section;
        const resources = [];
        if (rawTipoAlergia) {
            const allergy = {
                resourceType: 'AllergyIntolerance',
                id: 'AllergyIntolerance-0',
                meta: {
                    profile: [
                        'https://fhir.minsalud.gov.co/rda/StructureDefinition/AllergyIntoleranceRDA',
                    ],
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
                code: {
                    // AJUSTE RECOMENDADO (calidad/validador IHCE):
                    // Evitar enviar code/display/text como "06" (u otro código crudo) sin descripción.
                    // Ideal: mapear TipoAlergia y enviar display/text descriptivo según catálogo oficial.
                    // Si aún no hay catálogo mapeado completo, usar display/text legible temporal
                    // (ej. "No especificado") en lugar del número.
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/TipoAlergia',
                        code: tipoAlergiaCode || '99',
                        display: tipoAlergiaText || 'No especificado',
                    }],
                    text: tipoAlergiaText || rawTipoAlergia || undefined,
                },
                ...(patientRef ? { patient: { reference: patientRef } } : {}),
            };
            resources.push(allergy);

            section = {
                // OBLIGATORIO (sección cuando hay dato): título + code LOINC + entry.
                title: 'Historial de alergias, intolerancias y reacciones adversas',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '48765-2',
                        display: 'Allergies and adverse reactions Document',
                    }],
                },
                entry: [{ reference: `#${allergy.id}` }],
            };
        } else {
            section = emptySection(
                'Historial de alergias, intolerancias y reacciones adversas',
                '48765-2',
                'Allergies and adverse reactions Document'
            );
        }

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            loinc: '48765-2',
            sectionIndex: 5,
            section,
            resources,
            notes: !resources.length
                ? ['Sección devuelta en modo vacío: no hay tipo de alergia registrado en la evaluación.']
                : [],
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/Seccion6FactoresRiesgo', async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consultar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }

        const pool = await poolPromise;
        const rs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Documento Entidad] AS DocumentoEntidad,
                    [Tipo Factor Riesgo] AS TipoFactorRiesgo,
                    [Nombre Factor Riesgo] AS NombreFactorRiesgo
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = rs.recordset && rs.recordset[0] ? rs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        // OPCIONAL (BD): tipo/nombre de factor de riesgo; si no hay, sección vacía.
        const tipoRiesgo = str(head.TipoFactorRiesgo);
        const nombreRiesgo = str(head.NombreFactorRiesgo);
        const docPaciente = str(head.DocumentoEntidad);

        // OPCIONAL (request): referencias para pruebas aisladas.
        const subjectRef = str(req.body && req.body.patientReference) || (docPaciente ? `#CC-${docPaciente}` : '');
        const encounterRef = str(req.body && req.body.encounterReference) || '#Encounter-0';

        // Mapeo inicial simple (pueden ajustar con catálogo oficial de FactorRiesgo).
        const mapFactorRiesgoCode = (raw) => {
            const v = str(raw).toUpperCase();
            if (v.startsWith('01')) return { code: '01', display: 'Químicos' };
            if (v.startsWith('02')) return { code: '02', display: 'Físicos' };
            if (v.startsWith('03')) return { code: '03', display: 'Biológicos' };
            if (v.startsWith('04')) return { code: '04', display: 'Biomecánicos' };
            if (v.startsWith('05')) return { code: '05', display: 'Psicosociales' };
            return { code: v || '99', display: nombreRiesgo || v || 'No especificado' };
        };

        let section;
        const resources = [];
        if (tipoRiesgo || nombreRiesgo) {
            const fr = mapFactorRiesgoCode(tipoRiesgo || nombreRiesgo);
            const risk = {
                resourceType: 'RiskAssessment',
                id: 'RiskAssessment-0',
                meta: {
                    profile: [
                        'https://fhir.minsalud.gov.co/rda/StructureDefinition/RiskFactorRDA',
                    ],
                },
                status: 'registered',
                ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
                ...(subjectRef ? { subject: { reference: subjectRef } } : {}),
                code: {
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/FactorRiesgo',
                        code: fr.code,
                        display: fr.display,
                    }],
                    // AJUSTE RECOMENDADO: mantener text alineado con display para evitar inconsistencias.
                    text: fr.display,
                },
                prediction: [],
            };
            resources.push(risk);

            section = {
                // OBLIGATORIO (sección cuando hay dato): título + code LOINC + entry.
                title: 'Factores de riesgo',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '75492-9',
                        display: 'Risk assessment and screening note',
                    }],
                },
                entry: [{ reference: `#${risk.id}` }],
            };
        } else {
            section = emptySection(
                'Factores de riesgo',
                '75492-9',
                'Risk assessment and screening note'
            );
        }

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            loinc: '75492-9',
            sectionIndex: 6,
            section,
            resources,
            notes: !resources.length
                ? ['Sección devuelta en modo vacío: no hay tipo/nombre de factor de riesgo en la evaluación.']
                : [],
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/Seccion7Medicamentos', async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consultar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }

        const pool = await poolPromise;
        const headRs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Documento Entidad] AS DocumentoEntidad,
                    [Fecha RDA] AS FechaRDA,
                    [Fecha Hora Inicio Atencion] AS FechaHoraInicioAtencion,
                    [Fecha Hora Fin Atencion] AS FechaHoraFinAtencion,
                    [Tipo Doc Profesional] AS TipoDocProfesional,
                    [Num Doc Profesional] AS NumDocProfesional
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = headRs.recordset && headRs.recordset[0] ? headRs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        const medsRs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT
                    [Codigo Medicamento] AS CodigoMedicamento,
                    [Nombre Medicamento] AS NombreMedicamento,
                    [Descripcion Comun DCI] AS DCI,
                    [Fecha Prescripcion] AS FechaPrescripcion,
                    [Dosis Ordenada] AS DosisOrdenada,
                    [Unidad Medida Dosis] AS UnidadDosis,
                    [Via Administracion] AS ViaAdministracion,
                    [Duracion Cantidad] AS DuracionCantidad,
                    [Duracion Unidad Tiempo] AS DuracionUnidad,
                    [Frecuencia Cantidad] AS FrecuenciaCantidad,
                    [Frecuencia Unidad Tiempo] AS FrecuenciaUnidad,
                    [Finalidad Tec Salud] AS Finalidad
                FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
                  AND [Id Estado] = 1
            `);
        const meds = medsRs.recordset || [];

        const docPaciente = str(head.DocumentoEntidad);
        const profTipo = str(head.TipoDocProfesional);
        const profNum = str(head.NumDocProfesional);

        // OPCIONAL (request): referencias para pruebas aisladas.
        const subjectRef = str(req.body && req.body.patientReference) || (docPaciente ? `#CC-${docPaciente}` : '');
        const encounterRef = str(req.body && req.body.encounterReference) || '#Encounter-0';
        const requesterRef = str(req.body && req.body.practitionerReference) || ((profTipo && profNum) ? `#${profTipo}-${profNum}` : '');

        const toIsoDateTime = (v) => {
            if (!v) return null;
            const d = new Date(v);
            return Number.isNaN(d.getTime()) ? null : d.toISOString();
        };
        // OBLIGATORIO práctico para MedicationRequest.authoredOn cuando falte fecha por fila.
        const authoredOnFallback = toIsoDateTime(head.FechaRDA)
            || toIsoDateTime(head.FechaHoraInicioAtencion)
            || toIsoDateTime(head.FechaHoraFinAtencion)
            || new Date().toISOString();

        const resources = [];
        let seq = 0;
        for (const m of meds) {
            const medCode = str(m.CodigoMedicamento);
            // OBLIGATORIO práctico: sin código oficial no construimos MedicationRequest.
            if (!medCode) continue;

            const medName = str(m.NombreMedicamento) || str(m.DCI) || medCode;
            const authoredOn = toIsoDateTime(m.FechaPrescripcion) || authoredOnFallback;
            const dosis = str(m.DosisOrdenada);
            const via = str(m.ViaAdministracion);

            const medReq = {
                resourceType: 'MedicationRequest',
                id: `MedicationRequest-${seq++}`,
                meta: {
                    profile: [
                        'https://fhir.minsalud.gov.co/rda/StructureDefinition/MedicationRequestRDA',
                    ],
                },
                status: 'active',
                intent: 'order',
                category: [{
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianHealthTechnologyCategory',
                        code: '02',
                        display: 'Medicamento con registro sanitario',
                    }],
                }],
                reportedBoolean: false,
                medicationCodeableConcept: {
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/MipresINN',
                        code: medCode,
                        display: medName,
                    }],
                    text: medName,
                },
                ...(subjectRef ? { subject: { reference: subjectRef } } : {}),
                ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
                authoredOn,
                ...(requesterRef ? { requester: { reference: requesterRef } } : {}),
            };

            // OPCIONAL: si hay datos de dosis/vía, se agrega una instrucción simple.
            if (dosis || via) {
                medReq.dosageInstruction = [{
                    ...(via ? { route: { text: via } } : {}),
                    ...(dosis ? { text: `Dosis ordenada: ${dosis}` } : {}),
                }];
            }

            resources.push(medReq);
        }

        const section = resources.length
            ? {
                // OBLIGATORIO (sección cuando hay dato): título + code LOINC + entry.
                title: 'Historial de medicamentos',
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: '10160-0',
                        display: 'History of Medication use Narrative',
                    }],
                },
                entry: resources.map((m) => ({ reference: `#${m.id}` })),
            }
            : emptySection(
                'Historial de medicamentos',
                '10160-0',
                'History of Medication use Narrative'
            );

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            loinc: '10160-0',
            sectionIndex: 7,
            section,
            resources,
            notes: !resources.length
                ? ['Sección devuelta en modo vacío: no hay prescripciones de medicamentos activas con código oficial.']
                : [],
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/Seccion8OrdenesSolicitudes', async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consultar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }

        const pool = await poolPromise;
        const headRs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Documento Entidad] AS DocumentoEntidad,
                    [Fecha RDA] AS FechaRDA,
                    [Fecha Hora Inicio Atencion] AS FechaHoraInicioAtencion,
                    [Fecha Hora Fin Atencion] AS FechaHoraFinAtencion,
                    [Tipo Doc Profesional] AS TipoDocProfesional,
                    [Num Doc Profesional] AS NumDocProfesional
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = headRs.recordset && headRs.recordset[0] ? headRs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        const procRs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT
                    [Codigo Procedimiento] AS CodigoProcedimiento,
                    [Nombre Procedimiento] AS NombreProcedimiento,
                    [Finalidad Tec Salud] AS Finalidad,
                    [Fecha Prescripcion] AS FechaPrescripcion
                FROM [dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
                  AND [Id Estado] = 1
            `);
        const procRows = procRs.recordset || [];

        const otrasRs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT
                    [Codigo] AS Codigo,
                    [Nombre] AS Nombre,
                    [Finalidad Tec Salud] AS Finalidad,
                    [Fecha Prescripcion] AS FechaPrescripcion
                FROM [dbo].[Evaluacion Entidad RDA CE Otras Tecnologias]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
                  AND [Id Estado] = 1
            `);
        const otrasRows = otrasRs.recordset || [];

        const docPaciente = str(head.DocumentoEntidad);
        const profTipo = str(head.TipoDocProfesional);
        const profNum = str(head.NumDocProfesional);

        // OPCIONAL (request): referencias para pruebas aisladas.
        const subjectRef = str(req.body && req.body.patientReference) || (docPaciente ? `#CC-${docPaciente}` : '');
        const encounterRef = str(req.body && req.body.encounterReference) || '#Encounter-0';
        const requesterRef = str(req.body && req.body.practitionerReference) || ((profTipo && profNum) ? `#${profTipo}-${profNum}` : '');

        const toIsoDateTime = (v) => {
            if (!v) return null;
            const d = new Date(v);
            return Number.isNaN(d.getTime()) ? null : d.toISOString();
        };
        const authoredOnFallback = toIsoDateTime(head.FechaRDA)
            || toIsoDateTime(head.FechaHoraInicioAtencion)
            || toIsoDateTime(head.FechaHoraFinAtencion)
            || new Date().toISOString();

        const resources = [];
        let seq = 0;

        // Prescripción de procedimientos -> ServiceRequestRDA
        for (const p of procRows) {
            const codigo = str(p.CodigoProcedimiento);
            if (!codigo) continue; // OBLIGATORIO práctico para este tipo.
            const nombre = str(p.NombreProcedimiento) || codigo;
            resources.push({
                resourceType: 'ServiceRequest',
                id: `ServiceRequest-${seq++}`,
                meta: {
                    profile: [
                        'https://fhir.minsalud.gov.co/rda/StructureDefinition/ServiceRequestRDA',
                    ],
                },
                status: 'active',
                intent: 'order',
                category: [{
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianHealthTechnologyCategory',
                        code: '01',
                        display: 'Procedimiento en salud',
                    }],
                }],
                code: {
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS',
                        code: codigo,
                        display: nombre,
                    }],
                    text: nombre,
                },
                ...(subjectRef ? { subject: { reference: subjectRef } } : {}),
                ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
                authoredOn: toIsoDateTime(p.FechaPrescripcion) || authoredOnFallback,
                ...(requesterRef ? { requester: { reference: requesterRef } } : {}),
            });
        }

        // Otras tecnologías -> OtherTechnologyServiceRequestRDA
        for (const o of otrasRows) {
            const nombre = str(o.Nombre);
            const codigo = str(o.Codigo);
            if (!nombre && !codigo) continue;
            resources.push({
                resourceType: 'ServiceRequest',
                id: `ServiceRequest-${seq++}`,
                meta: {
                    profile: [
                        'https://fhir.minsalud.gov.co/rda/StructureDefinition/OtherTechnologyServiceRequestRDA',
                    ],
                },
                status: 'active',
                intent: 'order',
                category: [{
                    coding: [{
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianHealthTechnologyCategory',
                        code: '06',
                        display: 'Dispositivo médico',
                    }],
                }],
                code: {
                    ...(codigo ? { coding: [{ code: codigo, display: nombre || codigo }] } : {}),
                    text: nombre || codigo || 'Otra tecnología',
                },
                ...(subjectRef ? { subject: { reference: subjectRef } } : {}),
                ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
                authoredOn: toIsoDateTime(o.FechaPrescripcion) || authoredOnFallback,
                ...(requesterRef ? { requester: { reference: requesterRef } } : {}),
            });
        }

        // REGLA CRÍTICA IHCE: sección 61146-1 debe tener al menos un entry.
        if (!resources.length) {
            resources.push({
                resourceType: 'ServiceRequest',
                id: 'ServiceRequest-0',
                meta: {
                    profile: [
                        'https://fhir.minsalud.gov.co/rda/StructureDefinition/ServiceRequestRDA',
                    ],
                },
                status: 'active',
                intent: 'order',
                code: {
                    text: 'Orden de servicio sin detalle clínico reportado',
                },
                ...(subjectRef ? { subject: { reference: subjectRef } } : {}),
                ...(encounterRef ? { encounter: { reference: encounterRef } } : {}),
                authoredOn: authoredOnFallback,
                ...(requesterRef ? { requester: { reference: requesterRef } } : {}),
            });
        }

        const section = {
            // OBLIGATORIO: en 61146-1 siempre enviar entry (no solo emptyReason).
            title: 'Órdenes, prescripciones o solicitudes de servicio',
            code: {
                coding: [{
                    system: 'http://loinc.org',
                    code: '61146-1',
                    display: 'Orders for services Document',
                }],
            },
            entry: resources.map((r) => ({ reference: `#${r.id}` })),
        };

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            loinc: '61146-1',
            sectionIndex: 8,
            section,
            resources,
            notes: resources.length === 1 && resources[0].id === 'ServiceRequest-0'
                ? ['Se incluyó placeholder para cumplir regla IHCE de mínimo un entry en sección 61146-1.']
                : [],
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/Seccion9DocumentosSoporte', async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consultar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }

        const pool = await poolPromise;
        const headRs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Documento Entidad] AS DocumentoEntidad,
                    [Nombre Documento PDF] AS NombreDocumentoPDF
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = headRs.recordset && headRs.recordset[0] ? headRs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        const docPaciente = str(head.DocumentoEntidad);
        const patientRef = str(req.body && req.body.patientReference) || (docPaciente ? `#CC-${docPaciente}` : '');
        const encounterRef = str(req.body && req.body.encounterReference) || '#Encounter-0';
        const nombrePdf = str(head.NombreDocumentoPDF) || 'Documento de soporte asociado al encuentro';

        // OPCIONAL (request): permitir enviar base64 manual en pruebas.
        let pdfBase64 = str(req.body && req.body.pdfBase64);
        // OPCIONAL (BD): intentar usar binario almacenado si existe columna (sin romper si no existe).
        if (!pdfBase64) {
            try {
                const pdfRs = await pool
                    .request()
                    .input('IdEvaluacionEntidadRDACE', sql.Int, id)
                    .query(`
                        SELECT TOP 1
                            [Contenido Documento PDF] AS ContenidoDocumentoPdfBin
                        FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                        WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
                    `);
                const row = pdfRs.recordset && pdfRs.recordset[0] ? pdfRs.recordset[0] : null;
                const buf = row && row.ContenidoDocumentoPdfBin;
                if (buf && Buffer.isBuffer(buf) && buf.length) {
                    pdfBase64 = buf.toString('base64');
                }
            } catch (_) {
                // Sin bloqueo: algunas BD no tienen esta columna o permisos.
            }
        }

        // REGLA CRÍTICA: sección 55107-7 debe tener entry 1..1 (no emptyReason).
        const documentReference = {
            resourceType: 'DocumentReference',
            id: 'DocumentReference-0',
            meta: {
                profile: [
                    'https://fhir.minsalud.gov.co/rda/StructureDefinition/DocumentReferenceEPIRDA',
                ],
            },
            status: 'current',
            type: {
                coding: [
                    { system: 'http://loinc.org', code: '18842-5', display: 'Discharge summary' },
                    {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDocumentTypes',
                        code: 'EPI',
                        display: 'Epicrisis',
                    },
                ],
            },
            category: [{
                coding: [{ system: 'http://loinc.org', code: '55108-5', display: 'Clinical presentation Document' }],
            }],
            description: nombrePdf,
            ...(patientRef ? { subject: { reference: patientRef } } : {}),
            content: [{
                attachment: {
                    contentType: 'application/pdf',
                    title: nombrePdf,
                    ...(pdfBase64 ? { data: pdfBase64 } : {}),
                },
                format: {
                    system: 'urn:ietf:bcp:13',
                    code: 'application/pdf',
                    display: 'PDF',
                },
            }],
            ...(encounterRef ? { context: { encounter: [{ reference: encounterRef }] } } : {}),
        };

        const section = {
            title: 'Documentos de soporte',
            code: {
                coding: [{
                    system: 'http://loinc.org',
                    code: '55107-7',
                    display: 'Addendum Document',
                }],
            },
            text: sectionTextDiv(nombrePdf),
            entry: [{ reference: '#DocumentReference-0' }],
        };

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            loinc: '55107-7',
            sectionIndex: 9,
            section,
            resources: [documentReference],
            notes: !pdfBase64
                ? ['No se encontró PDF en BD ni en body.pdfBase64; se devuelve DocumentReference sin attachment.data para validación estructural.']
                : [],
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post(['/RdaConsultaExterna/JsonCompleto', '/RdaConsultaExterna/JsonCompletoEstricto'], async (req, res) => {
    try {
        // OBLIGATORIO (request): Id de la evaluación a consolidar.
        const id = req.body && req.body.IdEvaluacionEntidadRDACE != null
            ? parseInt(req.body.IdEvaluacionEntidadRDACE, 10)
            : NaN;
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDACE requerido (number)' });
        }
        const strictPdfMode = /JsonCompletoEstricto$/i.test(req.path);

        const pool = await poolPromise;
        const headRs = await pool
            .request()
            .input('IdEvaluacionEntidadRDACE', sql.Int, id)
            .query(`
                SELECT TOP 1
                    [Documento Entidad] AS DocumentoEntidad,
                    [Nombre Documento PDF] AS NombreDocumentoPDF,
                    [Tipo Doc Profesional] AS TipoDocProfesional,
                    [Num Doc Profesional] AS NumDocProfesional,
                    [Fecha RDA] AS FechaRDA,
                    [Fecha Hora Inicio Atencion] AS FechaHoraInicioAtencion,
                    [Fecha Hora Fin Atencion] AS FechaHoraFinAtencion
                FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
            `);
        const head = headRs.recordset && headRs.recordset[0] ? headRs.recordset[0] : null;
        if (!head) {
            return res.status(404).json({
                ok: false,
                error: `No existe evaluación RDACE con IdEvaluacionEntidadRDACE=${id}`,
                code: 'RDACE_NOT_FOUND',
            });
        }

        // PDF soporte para sección 9:
        // 1) body.pdfBase64, 2) columna base64 en BD, 3) generación en caliente y persistencia.
        let pdfBase64 = str(req.body && req.body.pdfBase64);
        if (!pdfBase64) {
            try {
                const pdf64Rs = await pool
                    .request()
                    .input('IdEvaluacionEntidadRDACE', sql.Int, id)
                    .query(`
                        SELECT TOP 1
                            [Contenido Documento PDF Base64] AS ContenidoDocumentoPdfBase64
                        FROM [dbo].[Evaluacion Entidad RDA Consulta Externa]
                        WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
                    `);
                const row = pdf64Rs.recordset && pdf64Rs.recordset[0] ? pdf64Rs.recordset[0] : null;
                pdfBase64 = str(row && row.ContenidoDocumentoPdfBase64);
            } catch (_) {
                // La columna puede no existir aún si no se ha ejecutado el ALTER.
            }
        }
        if (!pdfBase64) {
            try {
                const PDFDocument = require('pdfkit');
                const toIsoDateTime = (v) => {
                    if (!v) return null;
                    const d = new Date(v);
                    return Number.isNaN(d.getTime()) ? null : d.toISOString();
                };
                const pdfBuffer = await new Promise((resolve, reject) => {
                    const chunks = [];
                    const doc = new PDFDocument({ size: 'A4', margin: 40 });
                    doc.on('data', (c) => chunks.push(c));
                    doc.on('end', () => resolve(Buffer.concat(chunks)));
                    doc.on('error', reject);
                    doc.fontSize(14).text('Resumen de soporte - RDA Consulta Externa', { align: 'left' });
                    doc.moveDown(0.5);
                    doc.fontSize(10).text(`IdEvaluacionEntidadRDACE: ${id}`);
                    doc.text(`Documento Entidad: ${str(head.DocumentoEntidad) || 'N/D'}`);
                    doc.text(`Profesional: ${str(head.TipoDocProfesional) || 'N/D'}-${str(head.NumDocProfesional) || 'N/D'}`);
                    doc.text(`Fecha RDA: ${toIsoDateTime(head.FechaRDA) || 'N/D'}`);
                    doc.text(`Inicio atención: ${toIsoDateTime(head.FechaHoraInicioAtencion) || 'N/D'}`);
                    doc.text(`Fin atención: ${toIsoDateTime(head.FechaHoraFinAtencion) || 'N/D'}`);
                    doc.moveDown();
                    doc.text('Documento generado automáticamente para soporte de RDA (base64).');
                    doc.end();
                });
                pdfBase64 = pdfBuffer.toString('base64');
            } catch (_) {
                // Si no se logra generar, se continúa en modo estructural.
            }
        }
        if (pdfBase64) {
            try {
                await pool
                    .request()
                    .input('IdEvaluacionEntidadRDACE', sql.Int, id)
                    .input('PdfBase64', sql.NVarChar(sql.MAX), pdfBase64)
                    .query(`
                        UPDATE [dbo].[Evaluacion Entidad RDA Consulta Externa]
                        SET [Contenido Documento PDF Base64] = @PdfBase64
                        WHERE [Id Evaluacion Entidad RDA Consulta Externa] = @IdEvaluacionEntidadRDACE
                    `);
            } catch (_) {
                // No bloquear construcción del JSON por fallo de persistencia.
            }
        }
        if (strictPdfMode && !pdfBase64) {
            return res.status(400).json({
                ok: false,
                error: 'Modo estricto activo: falta PDF de soporte para DocumentReference (attachment.data en base64).',
                code: 'PDF_SOPORTE_REQUERIDO',
            });
        }

        const localBase = `http://localhost:${process.env.BACK_PORT || process.env.PORT || 3000}`;
        const sectionUrls = [
            '/apiV3/RdaConsultaExterna/Seccion1EAPB',
            '/apiV3/RdaConsultaExterna/Seccion2OtrosDemograficos',
            '/apiV3/RdaConsultaExterna/Seccion3IncapacidadSIPE',
            '/apiV3/RdaConsultaExterna/Seccion4Diagnosticos',
            '/apiV3/RdaConsultaExterna/Seccion5Alergias',
            '/apiV3/RdaConsultaExterna/Seccion6FactoresRiesgo',
            '/apiV3/RdaConsultaExterna/Seccion7Medicamentos',
            '/apiV3/RdaConsultaExterna/Seccion8OrdenesSolicitudes',
            '/apiV3/RdaConsultaExterna/Seccion9DocumentosSoporte',
        ];

        const postLocalJson = (url, bodyObj) => new Promise((resolve, reject) => {
            const http = require('http');
            const payload = JSON.stringify(bodyObj);
            const req2 = http.request(
                `${localBase}${url}`,
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
            req2.on('error', reject);
            req2.write(payload);
            req2.end();
        });

        const sectionResults = [];
        const sectionBuildBody = { ...(req.body || {}), pdfBase64 };
        for (const url of sectionUrls) {
            const out = await postLocalJson(url, sectionBuildBody);
            if (out.status < 200 || out.status >= 300) {
                return res.status(500).json({
                    ok: false,
                    error: `Fallo construyendo sección desde ${url} (status ${out.status})`,
                    details: out.body,
                });
            }
            let parsed;
            try {
                parsed = JSON.parse(out.body);
            } catch (_) {
                return res.status(500).json({
                    ok: false,
                    error: `Respuesta inválida al construir sección desde ${url}`,
                    details: out.body,
                });
            }
            sectionResults.push(parsed);
        }

        const sections = sectionResults
            .sort((a, b) => (a.sectionIndex || 999) - (b.sectionIndex || 999))
            .map((s) => s.section)
            .filter(Boolean);

        const resourceMap = new Map();
        for (const s of sectionResults) {
            const list = Array.isArray(s.resources) ? s.resources : [];
            for (const r of list) {
                if (!r || !r.resourceType || !r.id) continue;
                resourceMap.set(`${r.resourceType}/${r.id}`, r);
            }
        }

        const documento = str(head.DocumentoEntidad);
        const profTipo = normalizeDocTypeCode(head.TipoDocProfesional) || 'CC';
        const profNum = str(head.NumDocProfesional) || 'NO-INFORMADO';

        let docTypePaciente = 'CC';
        let docTypeDisplayBd = '';
        if (documento) {
            const tdRs = await pool
                .request()
                .input('DocumentoPaciente', sql.VarChar(50), documento)
                .query(`
                    SELECT TOP 1
                        TipoDocumentoBase,
                        DescripciTipoDocumento
                    FROM [dbo].[Cnsta Relacionador Usuarios Info]
                    WHERE DocumentoPaciente = @DocumentoPaciente
                `);
            const tdRow = tdRs.recordset && tdRs.recordset[0] ? tdRs.recordset[0] : null;
            if (tdRow) {
                docTypePaciente = normalizeDocTypeCode(tdRow.TipoDocumentoBase) || docTypePaciente;
                docTypeDisplayBd = str(tdRow.DescripciTipoDocumento);
            }
        }

        const patientId = documento ? `${docTypePaciente}-${documento}` : `Paciente-${id}`;
        const practitionerId = `${profTipo}-${profNum}`;

        const toIsoDateTime = (v) => {
            if (!v) return null;
            const d = new Date(v);
            return Number.isNaN(d.getTime()) ? null : d.toISOString();
        };
        const compositionDate = toIsoDateTime(head.FechaRDA)
            || toIsoDateTime(head.FechaHoraInicioAtencion)
            || toIsoDateTime(head.FechaHoraFinAtencion)
            || new Date().toISOString();

        const patientIdentifier = documento
            ? buildNationalPersonIdentifier({
                docTypeCode: docTypePaciente,
                value: documento,
                displayFromBd: docTypeDisplayBd,
            })
            : null;
        const practitionerIdentifier = buildNationalPersonIdentifier({
            docTypeCode: profTipo,
            value: profNum,
        });

        // Recursos de contexto mínimos para el documento completo.
        const patient = {
            resourceType: 'Patient',
            id: patientId,
            meta: {
                profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/PatientRDA'],
            },
            ...(patientIdentifier ? { identifier: [patientIdentifier] } : {}),
            active: true,
        };
        const practitioner = {
            resourceType: 'Practitioner',
            id: practitionerId,
            meta: {
                profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/PractitionerRDA'],
            },
            active: true,
            identifier: [practitionerIdentifier],
        };
        const encounter = {
            resourceType: 'Encounter',
            id: 'Encounter-0',
            meta: {
                profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/EncounterAmbulatoryRDA'],
            },
            status: 'finished',
            class: {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                code: 'AMB',
                display: 'ambulatory',
            },
            subject: { reference: `#${patientId}` },
            participant: [{ individual: { reference: `#${practitionerId}` } }],
            ...(toIsoDateTime(head.FechaHoraInicioAtencion) || toIsoDateTime(head.FechaHoraFinAtencion)
                ? {
                    period: {
                        ...(toIsoDateTime(head.FechaHoraInicioAtencion) ? { start: toIsoDateTime(head.FechaHoraInicioAtencion) } : {}),
                        ...(toIsoDateTime(head.FechaHoraFinAtencion) ? { end: toIsoDateTime(head.FechaHoraFinAtencion) } : {}),
                    },
                }
                : {}),
        };

        const composition = {
            resourceType: 'Composition',
            id: 'Composition-0',
            meta: {
                profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/CompositionAmbulatoryRDA'],
            },
            status: 'final',
            type: {
                coding: [{ system: 'http://loinc.org', code: '51845-6', display: 'Outpatient Consult note' }],
            },
            subject: { reference: `#${patientId}` },
            encounter: { reference: '#Encounter-0' },
            date: compositionDate,
            author: [{ reference: `#${practitionerId}` }],
            title: 'Resumen Digital de Atención en Salud - RDA de consulta externa',
            confidentiality: 'N',
            section: sections,
        };

        const finalResources = [patient, encounter, practitioner];
        for (const r of resourceMap.values()) finalResources.push(r);

        const bundle = {
            resourceType: 'Bundle',
            type: 'document',
            timestamp: compositionDate,
            entry: [
                { resource: composition },
                ...finalResources.map((r) => ({ resource: r })),
            ],
        };

        return res.json({
            ok: true,
            IdEvaluacionEntidadRDACE: id,
            message: strictPdfMode
                ? 'Bundle RDA Consulta Externa (modo estricto) construido con secciones 1..9'
                : 'Bundle RDA Consulta Externa construido con secciones 1..9',
            bundle,
            diagnostics: {
                strictPdfMode,
                pdfBase64Included: Boolean(pdfBase64),
                totalSections: sections.length,
                totalResources: finalResources.length + 1,
                sectionNotes: sectionResults
                    .filter((s) => Array.isArray(s.notes) && s.notes.length)
                    .map((s) => ({ sectionIndex: s.sectionIndex, notes: s.notes })),
            },
        });
    } catch (e) {
        if (e instanceof PersonIdentifierDisplayError) {
            return res.status(400).json({
                ok: false,
                code: e.code,
                error: e.message,
                docTypeCode: e.docTypeCode,
            });
        }
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

async function buildBundleEstrictoLocal(body) {
    const localBase = `http://localhost:${process.env.BACK_PORT || process.env.PORT || 3000}`;
    return new Promise((resolve, reject) => {
        const http = require('http');
        const payload = JSON.stringify(body || {});
        const req2 = http.request(
            `${localBase}/apiV3/RdaConsultaExterna/JsonCompletoEstricto`,
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
        req2.on('error', reject);
        req2.write(payload);
        req2.end();
    });
}

async function enviarIhceDesdeV2(req, res, ambiente) {
    try {
        loadDotEnvFromCandidates();
        const isProd = ambiente === 'prod';
        const forceSandboxOnly = isForceSandboxOnly();
        const forceProdOnly = isForceProdOnly();
        if (!isProd && forceProdOnly) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_PROD_ONLY',
                error: 'IHCE_FORCE_PROD_ONLY está activo: no se permite envío a sandbox desde este endpoint.',
            });
        }
        if (isProd && forceSandboxOnly) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_SANDBOX_ONLY',
                error: 'IHCE_FORCE_SANDBOX_ONLY está activo: no se permite envío a producción desde este endpoint.',
            });
        }

        const buildOut = await buildBundleEstrictoLocal(req.body || {});
        let buildJson;
        try {
            buildJson = JSON.parse(buildOut.body);
        } catch (_) {
            return res.status(500).json({
                ok: false,
                error: 'Respuesta inválida construyendo JsonCompletoEstricto',
                details: buildOut.body,
            });
        }
        if (buildOut.status < 200 || buildOut.status >= 300 || !buildJson || !buildJson.bundle) {
            return res.status(buildOut.status || 500).json({
                ok: false,
                error: 'No se pudo construir el Bundle estricto antes del envío.',
                details: buildJson || buildOut.body,
            });
        }

        const tokenOut = await solicitarTokenIhceShared(isProd ? 'prod' : 'sandbox');
        if (!tokenOut.access_token) {
            return res.status(502).json({ ok: false, error: 'No se obtuvo access_token' });
        }

        const creds = resolveIhceCreds(isProd ? 'prod' : 'sandbox');
        if (!str(creds.baseUrl)) {
            return res.status(400).json({ ok: false, error: 'Falta IHCE_*_BASE_URL en .env.' });
        }
        if (!str(creds.subscriptionKey)) {
            return res.status(400).json({ ok: false, error: 'Falta SUBSCRIPTION_KEY IHCE en .env.' });
        }

        const sendUrl = `${String(creds.baseUrl).replace(/\/$/, '')}/Composition/$enviar-rda-consulta`;
        const ihceResp = await httpsPostFhirJson(
            sendUrl,
            tokenOut.access_token,
            creds.subscriptionKey,
            buildJson.bundle
        );

        let parsedBody;
        try {
            parsedBody = ihceResp.body ? JSON.parse(ihceResp.body) : null;
        } catch (_) {
            parsedBody = { raw: ihceResp.body };
        }

        return res.status(ihceResp.status > 0 ? ihceResp.status : 502).json({
            ok: ihceResp.status >= 200 && ihceResp.status < 300,
            status: ihceResp.status,
            ambiente: isProd ? 'produccion' : 'sandbox',
            ihce_url: sendUrl,
            ihce_response: parsedBody,
            diagnostics: buildJson.diagnostics || undefined,
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
            ...(e.details ? { details: e.details } : {}),
        });
    }
}

router.post('/RdaConsultaExterna/EnviarIhceSandboxV2', async (req, res) => enviarIhceDesdeV2(req, res, 'sandbox'));
router.post('/RdaConsultaExterna/EnviarIhceProduccionV2', async (req, res) => enviarIhceDesdeV2(req, res, 'prod'));

router.post('/RdaConsultaExterna/IhceToken/sandbox', async (req, res) => {
    try {
        loadDotEnvFromCandidates();
        const forceProdOnly = isForceProdOnly();
        if (forceProdOnly) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_PROD_ONLY',
                error: 'IHCE_FORCE_PROD_ONLY está activo: no se permite solicitar token de sandbox desde este endpoint.',
            });
        }
        const out = await solicitarTokenIhceShared('sandbox');
        if (!out.access_token) {
            return res.status(502).json({ ok: false, error: 'Respuesta sin access_token', details: out });
        }
        return res.json({ ok: true, ...out });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
            ...(e.details ? { details: e.details } : {}),
        });
    }
});

router.post('/RdaConsultaExterna/IhceToken/produccion', async (req, res) => {
    try {
        loadDotEnvFromCandidates();
        const forceSandboxOnly = isForceSandboxOnly();
        if (forceSandboxOnly) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_SANDBOX_ONLY',
                error: 'IHCE_FORCE_SANDBOX_ONLY está activo: no se permite solicitar token de producción desde este endpoint.',
            });
        }
        const out = await solicitarTokenIhceShared('prod');
        if (!out.access_token) {
            return res.status(502).json({ ok: false, error: 'Respuesta sin access_token', details: out });
        }
        return res.json({ ok: true, ...out });
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
            ...(e.details ? { details: e.details } : {}),
        });
    }
});

router.post('/RdaConsultaExterna/IhceConsultarProfesional/sandbox', async (req, res) => {
    try {
        loadDotEnvFromCandidates();
        const forceProdOnly = isForceProdOnly();
        if (forceProdOnly) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_PROD_ONLY',
                error: 'IHCE_FORCE_PROD_ONLY está activo: no se permite consultar profesional en sandbox desde este endpoint.',
            });
        }
        const out = await ihceConsultarProfesionalSaludShared('sandbox', req.body || {});
        return res.status(out.status > 0 ? out.status : 502).json(out);
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/IhceConsultarProfesional/produccion', async (req, res) => {
    try {
        loadDotEnvFromCandidates();
        const forceSandboxOnly = isForceSandboxOnly();
        if (forceSandboxOnly) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_SANDBOX_ONLY',
                error: 'IHCE_FORCE_SANDBOX_ONLY está activo: no se permite consultar profesional en producción desde este endpoint.',
            });
        }
        const out = await ihceConsultarProfesionalSaludShared('prod', req.body || {});
        return res.status(out.status > 0 ? out.status : 502).json(out);
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

router.post('/RdaConsultaExterna/IhceConsultarOrganizacion/sandbox', async (req, res) => {
    try {
        loadDotEnvFromCandidates();
        const forceProdOnly = isForceProdOnly();
        if (forceProdOnly) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_PROD_ONLY',
                error: 'IHCE_FORCE_PROD_ONLY está activo: no se permite consultar organización en sandbox desde este endpoint.',
            });
        }
        const out = await ihceConsultarOrganizacionShared('sandbox');
        return res.status(out.status > 0 ? out.status : 502).json(out);
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
});

async function handleIhceConsultarOrganizacionProduccion(req, res) {
    try {
        loadDotEnvFromCandidates();
        const forceSandboxOnly = isForceSandboxOnly();
        if (forceSandboxOnly) {
            return res.status(403).json({
                ok: false,
                code: 'IHCE_FORCE_SANDBOX_ONLY',
                error: 'IHCE_FORCE_SANDBOX_ONLY está activo: no se permite consultar organización en producción desde este endpoint.',
            });
        }
        const out = await ihceConsultarOrganizacionShared('prod');
        return res.status(out.status > 0 ? out.status : 502).json(out);
    } catch (e) {
        return res.status(e.status || 500).json({
            ok: false,
            error: e.message || String(e),
            code: e.code || undefined,
        });
    }
}

router.post('/RdaConsultaExterna/IhceConsultarOrganizacion/produccion', handleIhceConsultarOrganizacionProduccion);
router.post('/RdaConsultaExterna/IhceConsultarOrganizacion/produc', handleIhceConsultarOrganizacionProduccion);

module.exports = router;
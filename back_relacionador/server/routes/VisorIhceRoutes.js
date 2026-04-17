const express = require('express');
const { authenticateToken } = require('../middleware/authenticateToken');
const { createIhceHttpsAgent } = require('../services/ihceVisorHttpsAgent');
const { resolveIhceEnv } = require('../services/ihceVisorCredentials');
const { VisorIhceFhirService, mergeReferencedResources } = require('../services/visorIhceFhirService');

const router = express.Router();

/** Estado de paginación (mismo criterio que el visor standalone). */
const recursosAcumulados = new Map();

function normalizeAmbiente(body, query) {
    const a = (body && body.ambiente) || (query && query.ambiente) || 'sandbox';
    return String(a).toLowerCase() === 'prod' || String(a).toLowerCase() === 'produccion' ? 'prod' : 'sandbox';
}

function assertIhceBase(creds) {
    if (!creds.baseUrl) {
        const err = new Error(
            'Falta configuración IHCE (BASE_URL). Defina IHCE_SANDBOX_BASE_URL o IHCE_API_BASE_URL, etc.',
        );
        err.status = 500;
        throw err;
    }
    if (!creds.subscriptionKey) {
        const err = new Error(
            'Falta SUBSCRIPTION_KEY IHCE (IHCE_SANDBOX_SUBSCRIPTION_KEY / IHCE_APIM_SUBSCRIPTION_KEY, etc.).',
        );
        err.status = 500;
        throw err;
    }
}

router.use(authenticateToken);

/**
 * POST /apiV3/VisorIHCE/composition
 * Body: { payload, ambiente?: 'sandbox'|'prod' }
 */
router.post('/VisorIHCE/composition', async (req, res) => {
    try {
        const ambiente = normalizeAmbiente(req.body, req.query);
        const creds = resolveIhceEnv(ambiente);
        assertIhceBase(creds);

        const { payload } = req.body || {};
        if (!payload) {
            return res.status(400).json({ error: 'payload es requerido con los parámetros de búsqueda' });
        }

        const fhirService = new VisorIhceFhirService(ambiente);
        const dummy = 'env';

        const rdaResults = await fhirService.consultarRDACompleto(payload, dummy, dummy, dummy);

        const allEntries = [];
        const entriesPaciente = [];
        const entriesEncuentros = [];
        let paginationLinks = [];

        if (rdaResults.paciente.status === 'fulfilled' && rdaResults.paciente.data?.entry) {
            if (rdaResults.paciente.data.link?.length) {
                paginationLinks = rdaResults.paciente.data.link;
            }
            rdaResults.paciente.data.entry.forEach((entry) => {
                const taggedEntry = {
                    ...entry,
                    _source: 'rda-paciente',
                    _sourceLabel: 'RDA de antecedentes manifestados por el paciente',
                };
                allEntries.push(taggedEntry);
                entriesPaciente.push(taggedEntry);
            });
        }

        if (rdaResults.encuentros.status === 'fulfilled' && rdaResults.encuentros.data?.entry) {
            if (!paginationLinks.length && rdaResults.encuentros.data.link?.length) {
                paginationLinks = rdaResults.encuentros.data.link;
            }
            rdaResults.encuentros.data.entry.forEach((entry) => {
                const taggedEntry = {
                    ...entry,
                    _source: 'rda-encuentros',
                    _sourceLabel: 'RDA de encuentros clínicos',
                };
                allEntries.push(taggedEntry);
                entriesEncuentros.push(taggedEntry);
            });
        }

        const combinedBundle = {
            resourceType: 'Bundle',
            type: 'searchset',
            total: allEntries.length,
            entry: allEntries,
        };

        let allReferencedResources = {
            patients: [],
            encounters: [],
            practitioners: [],
            practitionerRoles: [],
            organizations: [],
            locations: [],
            conditions: [],
            allergyIntolerances: [],
            medicationStatements: [],
            medicationAdministrations: [],
            medicationRequests: [],
            familyMemberHistories: [],
            procedures: [],
            observations: [],
            riskAssessments: [],
            serviceRequests: [],
            documentReferences: [],
        };

        if (allEntries.length > 0) {
            try {
                allReferencedResources = await fhirService.obtenerRecursosReferenciados(
                    combinedBundle,
                    dummy,
                    dummy,
                    dummy,
                );
            } catch (refError) {
                /* continuar sin referencias */
            }
        }

        const completeResult = {
            ...combinedBundle,
            link: paginationLinks,
            entriesBySource: {
                paciente: entriesPaciente,
                encuentros: entriesEncuentros,
            },
            rdaDetails: {
                paciente: {
                    status: rdaResults.paciente.status,
                    total: rdaResults.paciente.data?.total || 0,
                    entries: entriesPaciente.length,
                    error: rdaResults.paciente.error,
                },
                encuentros: {
                    status: rdaResults.encuentros.status,
                    total: rdaResults.encuentros.data?.total || 0,
                    entries: entriesEncuentros.length,
                    error: rdaResults.encuentros.error,
                },
            },
            referencedResources: allReferencedResources,
            summary: {
                totalCompositions: allEntries.filter((e) => e.resource?.resourceType === 'Composition').length,
                compositionsPaciente: entriesPaciente.filter((e) => e.resource?.resourceType === 'Composition').length,
                compositionsEncuentros: entriesEncuentros.filter((e) => e.resource?.resourceType === 'Composition')
                    .length,
                ...fhirService.getResourceSummary(allReferencedResources),
            },
        };

        res.json(completeResult);
    } catch (error) {
        console.error('❌ Error VisorIHCE composition:', error);
        const status = error.status || 500;
        res.status(status).json({
            error: error.message || 'Error interno del servidor',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

/**
 * POST /apiV3/VisorIHCE/inmunizacion
 * Body: { payload, ambiente?: 'sandbox'|'prod' }
 */
router.post('/VisorIHCE/inmunizacion', async (req, res) => {
    try {
        const ambiente = normalizeAmbiente(req.body, req.query);
        const creds = resolveIhceEnv(ambiente);
        assertIhceBase(creds);

        const { payload } = req.body || {};
        if (!payload?.parameter) {
            return res.status(400).json({ error: 'payload (Parameters) es requerido' });
        }

        const httpsAgent = createIhceHttpsAgent(ambiente);
        const url = `${creds.baseUrl}/Immunization/$consultar-inmunizacion`;
        const token = await httpsAgent.getAccessToken();
        const response = await httpsAgent.authenticatedRequest(url, token, creds.subscriptionKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
        });

        const text = await response.text();
        let data = null;
        try {
            data = JSON.parse(text);
        } catch {
            /* vacío o no JSON */
        }

        if (!response.ok) {
            const detalle = (data && (data.message || data.error)) || text || `HTTP ${response.status}`;
            return res.status(response.status).json({ error: detalle });
        }

        if (data?.entry?.length) {
            data.entry = data.entry.map((e) => ({
                ...e,
                _source: 'inmunizacion',
                _sourceLabel: 'Registro de inmunización',
            }));
        }

        return res.json(data);
    } catch (error) {
        console.error('❌ Error VisorIHCE inmunizacion:', error);
        const status = error.status || 500;
        return res.status(status).json({ error: error.message || 'Error interno consultando inmunización' });
    }
});

/**
 * GET /apiV3/VisorIHCE/pagina
 * Query: url, patientId|sessionId, ambiente?
 */
router.get('/VisorIHCE/pagina', async (req, res) => {
    try {
        const ambiente = normalizeAmbiente(req.body, req.query);
        const creds = resolveIhceEnv(ambiente);
        assertIhceBase(creds);

        const { url, patientId, sessionId } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'Falta parámetro requerido: url' });
        }

        const cacheKey = patientId || sessionId;
        if (!cacheKey) {
            return res.status(400).json({
                error: 'Se requiere patientId o sessionId para mantener recursos referenciados entre páginas',
            });
        }

        const fhirService = new VisorIhceFhirService(ambiente);
        const dummy = 'env';
        const token = await fhirService.getToken();

        const httpsAgent = createIhceHttpsAgent(ambiente);
        const response = await httpsAgent.authenticatedRequest(url, token, creds.subscriptionKey);

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: 'Error desde servidor FHIR',
                status: response.status,
                details: errorText,
            });
        }

        const bundle = await response.json();

        const newReferenced = await fhirService.obtenerRecursosReferenciados(bundle, dummy, dummy, dummy);

        let accumulated = recursosAcumulados.get(cacheKey) || {
            patients: [],
            practitioners: [],
            practitionerRoles: [],
            organizations: [],
            locations: [],
            encounters: [],
            procedures: [],
            medicationAdministrations: [],
            familyMemberHistories: [],
            medicationStatements: [],
            allergyIntolerances: [],
            conditions: [],
            medicationRequests: [],
            observations: [],
            riskAssessments: [],
            serviceRequests: [],
            documentReferences: [],
        };

        mergeReferencedResources(accumulated, newReferenced);
        recursosAcumulados.set(cacheKey, accumulated);

        const completeResult = {
            ...bundle,
            referencedResources: accumulated,
            pageReferencedCount: Object.values(newReferenced).reduce((sum, arr) => sum + arr.length, 0),
            accumulatedCount: Object.values(accumulated).reduce((sum, arr) => sum + arr.length, 0),
        };

        res.json(completeResult);
    } catch (error) {
        console.error('❌ Error VisorIHCE pagina:', error);
        const status = error.status || 500;
        res.status(status).json({
            error: error.message || 'Error interno al cargar página',
            details: error.message,
        });
    }
});

module.exports = router;

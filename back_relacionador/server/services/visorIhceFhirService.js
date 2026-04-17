const { createIhceHttpsAgent } = require('./ihceVisorHttpsAgent');

/**
 * Misma lógica que Visor/.../documentReference.js (FHIRService), con credenciales IHCE solo desde env.
 */
class VisorIhceFhirService {
    /**
     * @param {'sandbox'|'prod'|'produccion'} ambiente
     */
    constructor(ambiente) {
        this._agent = createIhceHttpsAgent(ambiente);
        this.baseUrl = this._agent.creds.baseUrl;
    }

    async getToken() {
        return this._agent.getAccessToken();
    }

    async authenticatedRequest(endpointOrUrl, _c1, _c2, _sub, options = {}) {
        const token = await this.getToken();
        const url = endpointOrUrl.startsWith('http')
            ? endpointOrUrl
            : `${this.baseUrl}/${endpointOrUrl}`;
        return this._agent.authenticatedRequest(url, token, _sub, options);
    }

    async authenticatedPOST(endpoint, _c1, _c2, _sub, body) {
        const token = await this.getToken();
        const url = `${this.baseUrl}/${endpoint}`;
        return this._agent.authenticatedRequestPOST(url, token, _sub, body);
    }

    async consultarRDAPaciente(payload, clientId, clientSecret, subscriptionKey) {
        const response = await this.authenticatedPOST(
            'Composition/$consultar-rda-paciente',
            clientId,
            clientSecret,
            subscriptionKey,
            payload,
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Error del servidor FHIR (paciente): ${response.status} ${response.statusText} - ${errorBody}`,
            );
        }
        return response.json();
    }

    async consultarRDAEncuentros(payload, clientId, clientSecret, subscriptionKey) {
        const response = await this.authenticatedPOST(
            'Composition/$consultar-rda-encuentros-clinicos',
            clientId,
            clientSecret,
            subscriptionKey,
            payload,
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Error del servidor FHIR (encuentros): ${response.status} ${response.statusText} - ${errorBody}`,
            );
        }
        return response.json();
    }

    async consultarRDACompleto(payload, clientId, clientSecret, subscriptionKey) {
        const [resultPaciente, resultEncuentros] = await Promise.allSettled([
            this.consultarRDAPaciente(payload, clientId, clientSecret, subscriptionKey),
            this.consultarRDAEncuentros(payload, clientId, clientSecret, subscriptionKey),
        ]);

        return {
            paciente: {
                status: resultPaciente.status,
                data: resultPaciente.status === 'fulfilled' ? resultPaciente.value : null,
                error: resultPaciente.status === 'rejected' ? resultPaciente.reason.message : null,
            },
            encuentros: {
                status: resultEncuentros.status,
                data: resultEncuentros.status === 'fulfilled' ? resultEncuentros.value : null,
                error: resultEncuentros.status === 'rejected' ? resultEncuentros.reason.message : null,
            },
        };
    }

    extractReferences(compositionBundle) {
        const allReferences = new Set();
        if (!compositionBundle.entry) return allReferences;

        compositionBundle.entry.forEach((entry) => {
            if (entry.resource?.resourceType === 'Composition') {
                const comp = entry.resource;

                [comp.subject?.reference, comp.encounter?.reference, comp.custodian?.reference]
                    .filter(Boolean)
                    .forEach((ref) => allReferences.add(ref));

                (comp.author || [])
                    .map((a) => a.reference)
                    .filter(Boolean)
                    .forEach((ref) => allReferences.add(ref));
                (comp.attester || [])
                    .map((a) => a.party?.reference)
                    .filter(Boolean)
                    .forEach((ref) => allReferences.add(ref));

                (comp.section || [])
                    .flatMap((section) => section.entry || [])
                    .map((e) => e.reference)
                    .filter(Boolean)
                    .forEach((ref) => allReferences.add(ref));
            }
        });

        return allReferences;
    }

    async fetchSingleResource(reference, token, subscriptionKey) {
        const resourceUrl = reference.startsWith('http') ? reference : `${this.baseUrl}/${reference}`;
        const response = await this._agent.authenticatedRequest(resourceUrl, token, subscriptionKey);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    categorizeResource(resource, referencedResources) {
        if (!resource) return;

        const typeMap = {
            Patient: 'patients',
            Encounter: 'encounters',
            Practitioner: 'practitioners',
            PractitionerRole: 'practitionerRoles',
            Organization: 'organizations',
            Location: 'locations',
            Condition: 'conditions',
            AllergyIntolerance: 'allergyIntolerances',
            MedicationStatement: 'medicationStatements',
            MedicationAdministration: 'medicationAdministrations',
            MedicationRequest: 'medicationRequests',
            FamilyMemberHistory: 'familyMemberHistories',
            Procedure: 'procedures',
            Observation: 'observations',
            RiskAssessment: 'riskAssessments',
            ServiceRequest: 'serviceRequests',
            DocumentReference: 'documentReferences',
        };

        const category = typeMap[resource.resourceType];
        if (category) {
            const exists = referencedResources[category].some(
                (existing) => existing.id === resource.id,
            );
            if (!exists) {
                referencedResources[category].push(resource);
            }
        }
    }

    async obtenerRecursosReferenciados(compositionBundle, clientId, clientSecret, subscriptionKey) {
        const token = await this.getToken();
        const referencedResources = {
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

        const embeddedIndex = new Map();
        if (compositionBundle?.entry?.length) {
            for (const e of compositionBundle.entry) {
                const r = e.resource;
                if (r?.resourceType && r?.id) {
                    embeddedIndex.set(`${r.resourceType}/${r.id}`, r);
                }
            }
        }

        const allReferences = this.extractReferences(compositionBundle);

        const fetchPromises = Array.from(allReferences)
            .filter((ref) => {
                if (ref.startsWith('http')) return true;
                const key = ref.replace(/^\/*/, '');
                return !embeddedIndex.has(key);
            })
            .map((reference) =>
                this.fetchSingleResource(reference, token, subscriptionKey)
                    .then((resource) => this.categorizeResource(resource, referencedResources))
                    .catch((error) =>
                        console.warn(`⚠️ No se pudo obtener recurso ${reference}:`, error.message),
                    ),
            );

        for (const [, resource] of embeddedIndex.entries()) {
            this.categorizeResource(resource, referencedResources);
        }

        await Promise.all(fetchPromises);
        return referencedResources;
    }

    getResourceSummary(resources) {
        return {
            patients: resources.patients.length,
            encounters: resources.encounters.length,
            practitioners: resources.practitioners.length,
            organizations: resources.organizations.length,
            conditions: resources.conditions.length,
            allergies: resources.allergyIntolerances.length,
            medications:
                resources.medicationStatements.length +
                resources.medicationAdministrations.length +
                resources.medicationRequests.length,
            familyHistory: resources.familyMemberHistories.length,
            procedures: resources.procedures.length,
            observations: resources.observations.length,
            locations: resources.locations.length,
            riskAssessments: resources.riskAssessments.length,
            serviceRequests: resources.serviceRequests.length,
            documentReferences: resources.documentReferences.length,
        };
    }
}

function mergeReferencedResources(target, source) {
    for (const [key, newItems] of Object.entries(source || {})) {
        if (!target[key]) target[key] = [];
        newItems.forEach((newItem) => {
            const exists = target[key].some(
                (existing) => existing.id === newItem.id && existing.resourceType === newItem.resourceType,
            );
            if (!exists) target[key].push(newItem);
        });
    }
}

module.exports = { VisorIhceFhirService, mergeReferencedResources };

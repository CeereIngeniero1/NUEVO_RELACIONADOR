'use strict';

const {
    getIhceCredentialsPublicas,
    sanitizeEmpresa,
} = require('../utils/ihceCredenciales');

function str(v) {
    return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

/** @returns {'sandbox'|'prod'} */
function normalizeIhceAmbiente(ambiente) {
    const a = String(ambiente || 'sandbox').trim().toLowerCase();
    return a === 'prod' || a === 'produccion' ? 'prod' : 'sandbox';
}

/**
 * @deprecated Ya no lee .env; usar resolvePrestadorForIhceAsync con documentoEmpresa.
 */
function resolveIhcePrestadorFromEnv(ambiente) {
    const amb = normalizeIhceAmbiente(ambiente);
    return {
        reps: '',
        nit: '',
        name: '',
        envPrefix: amb === 'prod' ? 'IHCE_PROD_' : 'IHCE_SANDBOX_',
        configured: false,
    };
}

/**
 * Prioridad: overrides del body > custodian BD (si viene en sources) > cabecera RDA.
 * @param {'sandbox'|'prod'} ambiente
 * @param {object} [sources]
 */
function resolvePrestadorForIhce(ambiente, sources = {}) {
    const amb = normalizeIhceAmbiente(ambiente);
    const reps =
        str(sources.overrideCodigoPrestador)
        || str(sources.dbCustodianReps)
        || str(sources.codigoPrestador)
        || '';
    const nit =
        str(sources.overrideNitPrestadorIPS)
        || str(sources.dbCustodianNit)
        || str(sources.nitPrestadorIPS)
        || '';
    const name =
        str(sources.overrideNombrePrestadorIPS)
        || str(sources.dbCustodianName)
        || str(sources.nombrePrestadorIPS)
        || '';
    return {
        reps,
        nit,
        name,
        envPrefix: amb === 'prod' ? 'IHCE_PROD_' : 'IHCE_SANDBOX_',
    };
}

/**
 * Carga custodian desde CredencialesIhce y resuelve prestador.
 */
async function resolvePrestadorForIhceAsync(ambiente, sources = {}) {
    const doc = sanitizeEmpresa(sources.documentoEmpresa);
    const next = { ...sources };
    if (doc) {
        try {
            const pub = await getIhceCredentialsPublicas(doc, ambiente);
            if (pub) {
                next.dbCustodianReps = pub.custodianReps || '';
                next.dbCustodianNit = pub.custodianNit || '';
                next.dbCustodianName = pub.custodianName || '';
            }
        } catch (_) {
            /* noop */
        }
    }
    return resolvePrestadorForIhce(ambiente, next);
}

/**
 * Aplica REPS/NIT/nombre de cabecera RDA Paciente (antes de armar el bundle).
 */
function mergePrestadorHeadFromEnv(head, ambiente, bodyOverrides = {}) {
    if (!head || typeof head !== 'object') return head;
    const p = resolvePrestadorForIhce(ambiente, {
        overrideCodigoPrestador: bodyOverrides.overrideCodigoPrestador,
        overrideNitPrestadorIPS: bodyOverrides.overrideNitPrestadorIPS,
        overrideNombrePrestadorIPS: bodyOverrides.overrideNombrePrestadorIPS,
        dbCustodianReps: bodyOverrides.dbCustodianReps,
        dbCustodianNit: bodyOverrides.dbCustodianNit,
        dbCustodianName: bodyOverrides.dbCustodianName,
        codigoPrestador: head.CodigoPrestador,
        nitPrestadorIPS: head.NitPrestadorIPS,
        nombrePrestadorIPS: head.NombrePrestadorIPS,
    });
    if (p.reps) head.CodigoPrestador = p.reps;
    if (p.nit) head.NitPrestadorIPS = p.nit;
    if (p.name) head.NombrePrestadorIPS = p.name;
    return head;
}

async function mergePrestadorHeadFromDb(head, ambiente, bodyOverrides = {}) {
    if (!head || typeof head !== 'object') return head;
    const p = await resolvePrestadorForIhceAsync(ambiente, {
        ...bodyOverrides,
        codigoPrestador: head.CodigoPrestador,
        nitPrestadorIPS: head.NitPrestadorIPS,
        nombrePrestadorIPS: head.NombrePrestadorIPS,
    });
    if (p.reps) head.CodigoPrestador = p.reps;
    if (p.nit) head.NitPrestadorIPS = p.nit;
    if (p.name) head.NombrePrestadorIPS = p.name;
    return head;
}

/**
 * Alinea Composition.attester con Composition.custodian.
 */
function syncCompositionAttesterWithCustodian(bundle) {
    if (!bundle || !Array.isArray(bundle.entry)) return;
    const compEntry = bundle.entry.find(
        (e) => e && e.resource && e.resource.resourceType === 'Composition',
    );
    if (!compEntry || !compEntry.resource) return;
    const custodian = compEntry.resource.custodian;
    if (!custodian || !String(custodian.reference || '').trim()) return;
    compEntry.resource.attester = [{ mode: 'legal', party: custodian }];
}

/**
 * Sobrescribe custodian / Organization IPS en un bundle ya construido.
 * @param {object} bundle
 * @param {{ reps?: string, nit?: string, name?: string }} prestador
 * @param {{ rdace?: boolean }} [opts] rdace=true ajusta Encounter/DocumentReference
 */
function rewriteLocalRefs(node, rewriteMap) {
    if (!node || typeof node !== 'object' || !rewriteMap || !rewriteMap.size) return;
    if (Array.isArray(node)) {
        node.forEach((x) => rewriteLocalRefs(x, rewriteMap));
        return;
    }
    if (typeof node.reference === 'string' && node.reference.trim().startsWith('#')) {
        const rid = node.reference.trim().slice(1);
        if (rewriteMap.has(rid)) {
            node.reference = `#${rewriteMap.get(rid)}`;
        }
    }
    Object.keys(node).forEach((k) => {
        if (k === 'reference') return;
        rewriteLocalRefs(node[k], rewriteMap);
    });
}

function applyPrestadorToBundle(bundle, prestador, opts = {}) {
    const reps = str(prestador && prestador.reps);
    if (!reps || !bundle) return bundle;

    const nit = str(prestador && prestador.nit);
    const name = str(prestador && prestador.name) || `IPS (${reps})`;
    const rdace = opts.rdace === true;

    const entries = Array.isArray(bundle.entry) ? bundle.entry : [];
    const ipsProfileToken = 'CareDeliveryOrganizationRDA';

    // Ids IPS viejos (p. ej. NIT en formulario) → REPS real; también Location {id}-01
    const rewriteMap = new Map();
    entries.forEach((e) => {
        if (!e || !e.resource || e.resource.resourceType !== 'Organization') return;
        const profiles = e.resource.meta && Array.isArray(e.resource.meta.profile) ? e.resource.meta.profile : [];
        const isIpsOrg = profiles.some((p) => String(p || '').includes(ipsProfileToken));
        if (!isIpsOrg) return;
        const oldId = str(e.resource.id);
        if (oldId && oldId !== reps) {
            rewriteMap.set(oldId, reps);
            rewriteMap.set(`${oldId}-01`, `${reps}-01`);
        }
    });
    // Si no había Organization IPS aún, pero hay Location tipo {nit}-01
    entries.forEach((e) => {
        if (!e || !e.resource || e.resource.resourceType !== 'Location') return;
        const locId = str(e.resource.id);
        const m = locId.match(/^(.+)-01$/);
        if (m && m[1] && m[1] !== reps) {
            rewriteMap.set(m[1], reps);
            rewriteMap.set(locId, `${reps}-01`);
        }
    });

    const compEntry = entries.find((e) => e && e.resource && e.resource.resourceType === 'Composition');
    if (compEntry && compEntry.resource) {
        compEntry.resource.custodian = { reference: `#${reps}` };
        if (rdace) {
            compEntry.resource.author = [{ reference: `#${reps}` }];
        }
    }

    if (rdace) {
        const encE = entries.find((e) => e && e.resource && e.resource.resourceType === 'Encounter');
        if (encE && encE.resource) encE.resource.serviceProvider = { reference: `#${reps}` };
        const docRefE = entries.find((e) => e && e.resource && e.resource.resourceType === 'DocumentReference');
        if (docRefE && docRefE.resource) {
            const drCust = {
                identifier: {
                    use: 'official',
                    type: {
                        coding: [
                            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                            {
                                system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers',
                                code: 'CodigoPrestador',
                                display: 'Código de habilitación de prestador de servicios de salud',
                            },
                        ],
                    },
                    system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                    value: reps,
                },
                display: name,
            };
            docRefE.resource.custodian = drCust;
            docRefE.resource.author = [drCust];
        }
    }

    let orgEntry = entries.find(
        (e) => e && e.resource && e.resource.resourceType === 'Organization' && e.resource.id === reps,
    );
    if (!orgEntry) {
        orgEntry = { resource: { resourceType: 'Organization', id: reps } };
        entries.push(orgEntry);
        bundle.entry = entries;
    }
    orgEntry.resource.active = true;
    orgEntry.resource.meta = orgEntry.resource.meta || {
        profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/CareDeliveryOrganizationRDA'],
    };
    orgEntry.resource.name = name;
    if (nit) {
        orgEntry.resource.identifier = [
            {
                id: 'TaxIdentifier',
                use: 'official',
                type: {
                    coding: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'TAX', display: 'Tax ID number' },
                        {
                            system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers',
                            code: 'NIT',
                            display: 'Número de Identificación Tributaria',
                        },
                    ],
                },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/DIAN',
                value: nit,
            },
            {
                id: 'HealthcareProviderIdentifier',
                use: 'official',
                type: {
                    coding: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                        {
                            system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers',
                            code: 'CodigoPrestador',
                            display: 'Código de habilitación de prestador de servicios de salud',
                        },
                    ],
                },
                system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                value: reps,
            },
        ];
    } else {
        orgEntry.resource.identifier = orgEntry.resource.identifier || [
            { system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS', value: reps },
        ];
    }

    // Location: renombrar id NIT-01 → REPS-01 y apuntar managingOrganization al REPS
    entries.forEach((e) => {
        if (!e || !e.resource || e.resource.resourceType !== 'Location') return;
        const loc = e.resource;
        const locId = str(loc.id);
        if (rewriteMap.has(locId)) {
            loc.id = rewriteMap.get(locId);
        } else if (locId && locId !== `${reps}-01` && /^.+-01$/.test(locId)) {
            loc.id = `${reps}-01`;
        }
        if (loc.identifier && Array.isArray(loc.identifier)) {
            loc.identifier.forEach((idObj) => {
                if (idObj && idObj.system && String(idObj.system).includes('REPS')) {
                    idObj.value = loc.id || `${reps}-01`;
                }
            });
        }
        loc.managingOrganization = { reference: `#${reps}` };
        if (!str(loc.name) || /^Sede\s+/i.test(str(loc.name))) {
            loc.name = name || `Sede ${reps}`;
        }
    });

    bundle.entry = (Array.isArray(bundle.entry) ? bundle.entry : []).filter((e) => {
        if (!e || !e.resource || e.resource.resourceType !== 'Organization') return true;
        const profiles = e.resource.meta && Array.isArray(e.resource.meta.profile) ? e.resource.meta.profile : [];
        const isIpsOrg = profiles.some((p) => String(p || '').includes(ipsProfileToken));
        if (!isIpsOrg) return true;
        return String(e.resource.id || '') === reps;
    });

    if (rewriteMap.size) {
        rewriteLocalRefs(bundle, rewriteMap);
    }

    syncCompositionAttesterWithCustodian(bundle);
    return bundle;
}

/**
 * Aplica prestador resuelto (BD + overrides + cabecera) sobre el bundle.
 */
function applyEnvCustodianIfConfigured(bundle, ambiente, bodyOverrides = {}, opts = {}) {
    const prestador = resolvePrestadorForIhce(ambiente, bodyOverrides);
    if (!prestador.reps) return bundle;
    return applyPrestadorToBundle(bundle, prestador, opts);
}

async function applyDbCustodianIfConfigured(bundle, ambiente, bodyOverrides = {}, opts = {}) {
    const prestador = await resolvePrestadorForIhceAsync(ambiente, bodyOverrides);
    if (!prestador.reps) return bundle;
    return applyPrestadorToBundle(bundle, prestador, opts);
}

module.exports = {
    normalizeIhceAmbiente,
    resolveIhcePrestadorFromEnv,
    resolvePrestadorForIhce,
    resolvePrestadorForIhceAsync,
    mergePrestadorHeadFromEnv,
    mergePrestadorHeadFromDb,
    syncCompositionAttesterWithCustodian,
    applyPrestadorToBundle,
    applyEnvCustodianIfConfigured,
    applyDbCustodianIfConfigured,
};

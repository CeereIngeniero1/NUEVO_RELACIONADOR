/**
 * build1888.js — Construcción del JSON final según Resolución 1888
 *
 * A partir del estado de las listas dinámicas (state.js) y de los valores del
 * formulario HTML (formValues), construye un Bundle FHIR de tipo "document"
 * conforme a la Guía de Implementación del RDA Paciente:
 * `https://vulcano.ihcecol.gov.co/RDA-paciente`.
 *
 * Implementa el caso "paciente" como FHIR Bundle:
 *   - Bundle (type=document)
 *   - Composition (perfil CompositionPatientStatementRDA)
 *   - Patient (perfil PatientRDA)
 *   - FamilyMemberHistory (Antecedentes familiares)
 *   - Condition (Antecedentes patológicos)
 *   - MedicationStatement (Antecedentes farmacológicos)
 *
 * @param {Object} params
 * @param {string} params.tipoRda     — "paciente" | "consultaExterna"
 * @param {Object} params.state       — referencia al módulo state (getters)
 * @param {Object} params.formValues  — valores del contexto de paciente/IPS
 *
 * formValues (contrato mínimo recomendado):
 *   - pacienteId:        ID interno del paciente (si existe)
 *   - pacienteNombre:    Nombre completo del paciente
 *   - pacienteDocumento: Documento de identidad
 *   - pacienteTipoId:    Código de tipo de documento (mapa interno → v2-0203)
 *   - ipsId:             Identificador de la IPS
 *   - ipsNombre:         Nombre de la IPS
 *   - eapbId (opcional): Identificador de la EAPB / pagador
 *   - eapbNombre (opcional): Nombre de la EAPB / pagador
 * @returns {Object} JSON (Bundle) conforme a la Resolución 1888 / RDA Paciente
 */
export function buildRda1888({ tipoRda, state, formValues } = {}) {
    if (!tipoRda) {
        throw new Error("[RDA] buildRda1888 requiere tipoRda");
    }
    if (!state) {
        throw new Error("[RDA] buildRda1888 requiere el módulo de state");
    }

    if (tipoRda !== "paciente") {
        throw new Error(`[RDA] buildRda1888: tipoRda no soportado: ${tipoRda}`);
    }

    const now = new Date().toISOString();

    function newUuid() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
        return `uuid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function makeEntry(resource) {
        const id = resource.id || newUuid();
        resource.id = id;
        return {
            fullUrl: `urn:uuid:${id}`,
            resource,
        };
    }

    const pacienteId = formValues?.pacienteId || newUuid();
    const pacienteNombre = formValues?.pacienteNombre || "";
    const pacienteIdentificador = formValues?.pacienteDocumento || "";
    const pacienteTipoId = formValues?.pacienteTipoId || "";

    const patientResource = {
        resourceType: "Patient",
        id: pacienteId,
        meta: {
            profile: ["https://minsalud.fhir.co/rda/StructureDefinition/PatientRDA"],
        },
        identifier: pacienteIdentificador
            ? [
                  {
                      system: "http://minsalud.gov.co/identificacion",
                      value: pacienteIdentificador,
                      type: pacienteTipoId
                          ? {
                                coding: [
                                    {
                                        system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                                        code: pacienteTipoId,
                                    },
                                ],
                            }
                          : undefined,
                  },
              ]
            : undefined,
        name: pacienteNombre
            ? [
                  {
                      text: pacienteNombre,
                  },
              ]
            : undefined,
    };

    const organizationName = formValues?.ipsNombre || formValues?.eapbNombre || "";
    const organizationId = formValues?.ipsId || formValues?.eapbId || newUuid();

    const organizationResource = organizationName
        ? {
              resourceType: "Organization",
              id: organizationId,
              name: organizationName,
          }
        : null;

    const antecedentes = state.getAntecedentes ? state.getAntecedentes() : [];
    const antecedentesFam = state.getAntecedentesFamiliares ? state.getAntecedentesFamiliares() : [];
    const medicamentos = state.getMedicamentos ? state.getMedicamentos() : [];

    const conditionEntries = antecedentes.map((item) =>
        makeEntry({
            resourceType: "Condition",
            meta: {
                profile: ["https://minsalud.fhir.co/rda/StructureDefinition/ConditionStatementRDA"],
            },
            subject: {
                reference: `urn:uuid:${pacienteId}`,
            },
            code: {
                coding: [
                    {
                        system: "http://hl7.org/fhir/sid/icd-10",
                        code: item.codigo,
                        display: item.descripcion || undefined,
                    },
                ],
                text: item.descripcion || item.codigo,
            },
        })
    );

    const familyHistoryEntries = antecedentesFam.map((item) =>
        makeEntry({
            resourceType: "FamilyMemberHistory",
            meta: {
                profile: ["https://minsalud.fhir.co/rda/StructureDefinition/FamilyMemberHistoryRDA"],
            },
            status: "completed",
            patient: {
                reference: `urn:uuid:${pacienteId}`,
            },
            relationship: {
                coding: item.parentesco
                    ? [
                          {
                              system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
                              code: item.parentesco,
                              display: item.textoParentesco || undefined,
                          },
                      ]
                    : undefined,
                text: item.textoParentesco || undefined,
            },
            condition: [
                {
                    code: {
                        coding: [
                            {
                                system: "http://hl7.org/fhir/sid/icd-10",
                                code: item.codigo,
                                display: item.descripcion || undefined,
                            },
                        ],
                        text: item.descripcion || item.codigo,
                    },
                },
            ],
        })
    );

    const medicationStatementEntries = medicamentos.map((item) =>
        makeEntry({
            resourceType: "MedicationStatement",
            meta: {
                profile: ["https://minsalud.fhir.co/rda/StructureDefinition/MedicationStatementRDA"],
            },
            status: "active",
            subject: {
                reference: `urn:uuid:${pacienteId}`,
            },
            medicationCodeableConcept: {
                text: item.nombre,
            },
            note: item.observacion
                ? [
                      {
                          text: item.observacion,
                      },
                  ]
                : undefined,
        })
    );

    const compositionId = newUuid();

    const compositionResource = {
        resourceType: "Composition",
        id: compositionId,
        meta: {
            profile: [
                "https://minsalud.fhir.co/rda/StructureDefinition/CompositionPatientStatementRDA",
            ],
        },
        status: "final",
        type: {
            coding: [
                {
                    system: "http://loinc.org",
                    code: "60591-5",
                    display: "Patient summary Document",
                },
            ],
            text: "RDA Paciente - Autoreporte de datos de salud",
        },
        date: now,
        title: "Resumen Digital de Atención en Salud - RDA Paciente",
        subject: {
            reference: `urn:uuid:${pacienteId}`,
        },
        author: [
            {
                reference: `urn:uuid:${pacienteId}`,
            },
        ],
        section: [
            {
                title: "Antecedentes farmacológicos",
                entry: medicationStatementEntries.map((e) => ({
                    reference: e.fullUrl,
                })),
            },
            {
                title: "Antecedentes alérgicos",
                entry: [],
            },
            {
                title: "Antecedentes patológicos",
                entry: conditionEntries.map((e) => ({
                    reference: e.fullUrl,
                })),
            },
            {
                title: "Antecedentes familiares",
                entry: familyHistoryEntries.map((e) => ({
                    reference: e.fullUrl,
                })),
            },
        ],
    };

    const bundleEntries = [
        makeEntry(compositionResource),
        makeEntry(patientResource),
        ...(organizationResource ? [makeEntry(organizationResource)] : []),
        ...conditionEntries,
        ...familyHistoryEntries,
        ...medicationStatementEntries,
    ];

    const bundle = {
        resourceType: "Bundle",
        type: "document",
        timestamp: now,
        entry: bundleEntries,
    };

    return bundle;
}


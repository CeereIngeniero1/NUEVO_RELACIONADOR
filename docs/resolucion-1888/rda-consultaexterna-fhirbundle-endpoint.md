# Endpoint: POST /apiV3/RdaConsultaExterna/FhirBundle

**Ubicación del código**: el handler vive en `back_relacionador/server/routes/rda/RdaConsultaExternaRoutes.js`, montado desde `Asignar_RipsRoutes V3.js`. Para el mapa completo de routers RDA (Paciente + Consulta Externa) ver [rda-backend-rutas-modulares.md](rda-backend-rutas-modulares.md).

## Descripción

Construye el **Bundle FHIR tipo `document`** para **RDA Consulta Externa** (Resolución 1888) a partir de los datos almacenados en las tablas `[Evaluacion Entidad RDA Consulta Externa]` y sus tablas hijas.

- **Perfil Composition**: [`CompositionAmbulatoryRDA`](https://fhir.minsalud.gov.co/rda/StructureDefinition/CompositionAmbulatoryRDA)
- **Perfil Encounter**: [`EncounterAmbulatoryRDA`](https://fhir.minsalud.gov.co/rda/StructureDefinition/EncounterAmbulatoryRDA) — **obligatorio** (diferencia clave con RDA Paciente)
- **Referencia IG**: https://vulcano.ihcecol.gov.co/RDA-consulta.html
- **Envío IHCE (futuro)**: `POST /Composition/$enviar-rda-consulta`

---

## Request

```
POST http://localhost:3000/apiV3/RdaConsultaExterna/FhirBundle
Content-Type: application/json
```

### Body mínimo
```json
{
  "IdEvaluacionEntidadRDACE": 1
}
```

### Body completo (con overrides opcionales de IPS)
```json
{
  "IdEvaluacionEntidadRDACE": 1,
  "overrideNombrePrestadorIPS": "CLINICA XYZ S.A.",
  "overrideNitPrestadorIPS": "900123456"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `IdEvaluacionEntidadRDACE` | number | ✅ | PK de la tabla `[Evaluacion Entidad RDA Consulta Externa]` |
| `overrideNombrePrestadorIPS` | string | No | Nombre de la IPS. Si se omite, se usa `"IPS (<CodigoPrestador>)"` |
| `overrideNitPrestadorIPS` | string | No | NIT de la IPS para el identificador TAX de la Organization IPS |

---

## Response

Bundle FHIR tipo `document` con los siguientes recursos en `entry[]`:

| # | Recurso | Perfil | Descripción |
|---|---|---|---|
| 1 | `Composition` | `CompositionAmbulatoryRDA` | Cabecera del documento, 9 secciones |
| 2 | `Patient` | `PatientRDA` | Demographics desde `[Cnsta Relacionador Usuarios Info]` |
| 3 | `Encounter` | `EncounterAmbulatoryRDA` | Encuentro ambulatorio (OBLIGATORIO en consulta externa) |
| 4 | `Practitioner` | `PractitionerRDA` | Profesional de salud (TipoDoc+NumDoc del campo RDACE) |
| 5 | `Organization` (IPS) | `CareDeliveryOrganizationRDA` | IPS: id=CodigoPrestador |
| 6 | `Organization` (EAPB) | `HealthBenefitPlanAdminOrganizationRDA` | EAPB: id=CodigoAdminPlanBeneficios |
| 7+ | `Condition` x N | `ConditionStatementRDA` | Diagnóstico principal (CIE-10 + CIE-11) + relacionados |
| N | `AllergyIntolerance` | `AllergyIntoleranceRDA` | Si TipoAlergia tiene valor |
| N | `RiskAssessment` | `RiskFactorRDA` | Si TipoFactorRiesgo o NombreFactorRiesgo tienen valor |
| N+ | `MedicationRequest` x N | `MedicationRequestRDA` | Una por fila en `[...CE Prescripcion Medicamentos]` |
| N+ | `ServiceRequest` x N | `ServiceRequestRDA` | Una por fila en `[...CE Prescripcion Procedimientos]` |
| N+ | `ServiceRequest` x N | `OtherTechnologyServiceRequestRDA` | Una por fila en `[...CE Otras Tecnologias]` |
| N | `Observation` | `AttendanceAllowanceRDA` | Si AlcanceIncapacidad/DiasIncapacidad tienen valor |

---

## Secciones del Composition

El Composition siempre tiene exactamente **9 secciones** en el orden definido por la IG:

| # | Título | LOINC | Contenido |
|---|---|---|---|
| 1 | Entidad(es) responsable(s) por el plan de beneficios en salud (consulta) | `48768-6` | EAPB Organization |
| 2 | Otros datos demográficos | `74208-0` | **vacío** (ocupación pendiente) |
| 3 | Datos incapacidad (SIPE) | `105583-9` | Observation incapacidad (si aplica) |
| 4 | Historial de diagnósticos de problemas de salud | `11450-4` | Conditions (principal + relacionados) |
| 5 | Historial de alergias, intolerancias y reacciones adversas | `48765-2` | AllergyIntolerance (si aplica) |
| 6 | Factores de riesgo | `75492-9` | RiskAssessment (si aplica) |
| 7 | Historial de medicamentos | `10160-0` | MedicationRequests |
| 8 | Órdenes, prescripciones o solicitudes de servicio | `61146-1` | ServiceRequests (procedimientos + otras tec.) |
| 9 | Documentos de soporte | `55107-7` | **vacío** (PDF DocumentReferenceEPIRDA pendiente) |

Las secciones vacías incluyen `emptyReason` con código `nilknown`.

---

## Diferencias clave respecto a RDA Paciente

| Aspecto | RDA Paciente | RDA Consulta Externa |
|---|---|---|
| `Composition.encounter` | **ausente** | **obligatorio** (`#Encounter-0`) |
| Perfil Composition | `CompositionRDA` | `CompositionAmbulatoryRDA` |
| Tipo LOINC | (propio) | `51845-6` "Outpatient Consult note" |
| Recurso Encounter | No incluido | `EncounterAmbulatoryRDA` incluido |
| Patient demographics | Desde `[Evaluacion Entidad RDA]` | Desde `[Cnsta Relacionador Usuarios Info]` |
| NIT/Nombre IPS | Almacenado en tabla RDA | Override opcional en body |

---

## Fuente de datos (tablas BD)

| Datos | Tabla |
|---|---|
| Cabecera RDACE | `[Evaluacion Entidad RDA Consulta Externa]` |
| Demographics paciente | `[Cnsta Relacionador Usuarios Info]` |
| Modalidad atención | `[Cnsta Relacionador Modalidad Atencion]` |
| Grupo servicios | `[Cnsta Relacionador ModalidadGrupoServicioTecSal]` |
| Vía ingreso | `[Cnsta Relacionador Via Ingreso Usuario]` |
| Causa motivo atención | `[Cnsta Relacionador Causa Externa]` |
| Diagnósticos relacionados | `[Evaluacion Entidad RDA CE Diagnosticos Relacionados]` |
| Prescripciones medicamentos | `[Evaluacion Entidad RDA CE Prescripcion Medicamentos]` |
| Prescripciones procedimientos | `[Evaluacion Entidad RDA CE Prescripcion Procedimientos]` |
| Otras tecnologías | `[Evaluacion Entidad RDA CE Otras Tecnologias]` |

---

## Pendientes

- [ ] **`DocumentReferenceEPIRDA`** (sección 9): adjuntar PDF de soporte cuando esté disponible el `[Nombre Documento PDF]`
- [ ] **Sección "Otros datos demográficos"** (sección 2): requiere recurso `PatientOccupationAtEncounterRDA` (Observation de ocupación)
- [ ] **Endpoint de envío a IHCE**: `POST /Composition/$enviar-rda-consulta` — operation URL del Manual de Operaciones de Interoperabilidad IHCE v1.2
- [ ] **Endpoint de previsualización RDACE**: análogo a `/apiV3/RdaPaciente/PreviewFhirBundle`
- [ ] **Endpoint de envío modular RDACE**: análogo a `/apiV3/RdaPaciente/EnviarIHCEModular`

---

## Ejemplo de respuesta (estructura)

```json
{
  "resourceType": "Bundle",
  "type": "document",
  "timestamp": "2026-04-01T09:00:00.000Z",
  "entry": [
    { "resource": { "resourceType": "Composition", "id": "Composition-0", ... } },
    { "resource": { "resourceType": "Patient", "id": "CC-80189301", ... } },
    { "resource": { "resourceType": "Encounter", "id": "Encounter-0", ... } },
    { "resource": { "resourceType": "Practitioner", "id": "CC-22699214", ... } },
    { "resource": { "resourceType": "Organization", "id": "4443000277", ... } },
    { "resource": { "resourceType": "Organization", "id": "CCFC33", ... } },
    { "resource": { "resourceType": "Condition", "id": "Condition-0", ... } },
    { "resource": { "resourceType": "AllergyIntolerance", "id": "AllergyIntolerance-0", ... } },
    { "resource": { "resourceType": "RiskAssessment", "id": "RiskAssessment-0", ... } },
    { "resource": { "resourceType": "MedicationRequest", "id": "MedicationRequest-0", ... } },
    { "resource": { "resourceType": "ServiceRequest", "id": "ServiceRequest-Proc-0", ... } },
    { "resource": { "resourceType": "Observation", "id": "Observation-Incapacidad-0", ... } }
  ]
}
```

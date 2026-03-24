# Lista RDA Paciente vs JSON FHIR (`/RdaPaciente/FhirBundle`)

Este documento cruza cada ítem de [`docs/lista rda paciente.txt`](../lista%20rda%20paciente.txt) con lo que **incluye hoy** el JSON generado por `POST /apiV3/RdaPaciente/FhirBundle` en [`Asignar_RipsRoutes V3.js`](../../back_relacionador/server/routes/Asignar_RipsRoutes%20V3.js).

---

## Estado del proyecto (resumen — JSON RDA Paciente)

| Aspecto | Estado |
|---------|--------|
| **Bundle `document` + CompositionPatientStatementRDA** | Implementado: `type` LOINC `102089-0`, `title` IG, `confidentiality: N`, `date` desde `[Fecha RDA]`, `event` (periodo + modalidad + grupo), `author` → **PractitionerRDA**, `custodian` → **CareDeliveryOrganizationRDA** (si hay NIT IPS + código prestador). |
| **PatientRDA + Organization EAPB** | Implementado. |
| **Practitioner + Organization IPS** | Implementado como entradas propias en el Bundle. |
| **Antecedentes** | Farmacológicos / patológicos / familiares / alérgicos con **`emptyReason`** cuando la lista está vacía (excepto que alergias ya tenía lógica explícita). |
| **CIE-11 ingreso** | `Condition` + sección en `Composition` cuando hay código en BD. |
| **CIE-11 familiar** | Segundo `coding` en `FamilyMemberHistory` cuando existen columnas y datos (`CIE11 Codigo` / `CIE11 Termino`). |
| **Talla / peso** | `Observation` LOINC 8302-2 y 29463-7 (sin `meta.profile` RDA dedicado hasta confirmar perfil en IG). |
| **`meta.profile`** | Unificado a `https://fhir.minsalud.gov.co/rda/StructureDefinition/...` en recursos RDA del bundle (salvo Observation talla/peso). |
| **Ejemplo real de salida** | Ver [`jsonsalida3.md`](../../jsonsalida3.md) en la raíz del repo (prueba con paciente/HC nueva, marzo 2026). |
| **Conformidad formal IG** | **Pendiente:** ejecutar validador FHIR con paquete `minsalud.fhir.co.rda` (p. ej. 0.7.2) y corregir hallazgos de terminología/perfil. |

### Conteo rápido frente a la lista TXT (41 ítems numerados en la tabla inferior)

| Resultado | Cantidad (aprox.) | Comentario |
|-----------|-------------------|------------|
| **Sí** (cubierto en el JSON) | ~34 | Incluye composición clínica principal del RDA Paciente autoreportado. |
| **Parcial** | ~3 | Alergia “código sí/no”, DCI solo texto, modalidad/grupo con respaldo `01` si falta FK. |
| **N/A lista** | 3 | Ítems 35–37 (diagnóstico egreso): no son objetivo del bundle actual de **RDA Paciente**. |
| **No** (explícito en lista) | 0 para ítems 1–34 y 38–41 dentro del alcance del documento paciente | Egreso CIE-10 queda como N/A. |

---

## Requisitos de despliegue

**Migración BD:** ejecutar [`back_relacionador/SQL/alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql`](../../back_relacionador/SQL/alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql) si la base se creó antes de incorporar columnas de modalidad, grupo, NIT/nombre IPS y CIE-11 en antecedentes familiares. Sin ello, pueden fallar el `INSERT`/`SELECT` que las usan.

**Código:** backend (`Asignar_RipsRoutes V3.js`) + frontend RDA Paciente (`Asignar_RIPS V3.html`, `Asignar_RIPS V3.js`, `rda-v3.js`) deben estar desplegados con la versión que genera este bundle.

---

## Leyenda

| Estado | Significado |
|--------|-------------|
| **Sí** | Va al Bundle de forma explícita (elemento estándar o extensión del perfil). |
| **Parcial** | El dato existe en BD o se deduce, pero no equivale del todo al ítem o falta parte (p. ej. solo texto sin coding, o placeholders). |
| **No** | No se consulta de BD para este endpoint **o** no se serializa en ningún recurso del Bundle. |
| **N/A lista** | El ítem es más propio de **RDA Consulta Externa** u otro documento; en **RDA Paciente** no aplica el mismo alcance. |

---

## Tabla ítem por ítem

| # | Ítem (lista RDA Paciente) | ¿En el JSON FHIR hoy? | Dónde / notas |
|---|---------------------------|----------------------|---------------|
| 1 | Código del prestador de servicios de salud | **Sí** | `Organization` **CareDeliveryOrganizationRDA**: `identifier` REPS + valor `[Codigo Prestador]`. Requiere **NIT IPS** en BD para armar también el NIT (DIAN); sin ambos no hay `custodian`. |
| 2 | Código administrador plan de beneficios (SGSSS) | **Sí** | `Organization` EAPB: `identifier` EAPBS. |
| 3 | Nombre administrador plan de beneficios (SGSSS) | **Sí** | `Organization.name`; `Patient.managingOrganization.display`. |
| 4 | Tipo de documento de identificación | **Sí** | `Patient.identifier.type` → **ColombianPersonIdentifier**. |
| 5 | Número de documento de identificación | **Sí** | `Patient.identifier.value` (RNEC). |
| 6 | Primer apellido | **Sí** | `Patient.name` + **ExtensionFathersFamilyName**. |
| 7 | Segundo apellido | **Sí** | `Patient.name.family` + **ExtensionMothersFamilyName**. |
| 8 | Primer nombre | **Sí** | `Patient.name.given[0]`. |
| 9 | Segundo nombre | **Sí** | `Patient.name.given[1]` (si existe). |
| 10 | Fecha y hora de nacimiento | **Sí / Parcial** | `birthDate` (fecha). Si la BD trae hora no trivial → `_birthDate.extension` **patient-birthTime**. |
| 11 | Código país nacionalidad | **Sí** | **ExtensionPatientNationality** (ISO 3166-1). |
| 12 | Nombre país nacionalidad | **Sí** | Misma extensión (`display`). |
| 13 | Sexo biológico | **Sí** | `Patient.gender` + **ExtensionBiologicalGender**. |
| 14 | Identidad de género | **Sí** | **ExtensionPatientGenderIdentity** (si aplica en BD). |
| 15 | Etnia | **Sí** | **ExtensionPatientEthnicity**. |
| 16 | Comunidad étnica | **Sí** | **ExtensionPatientEthnicCommunity**. |
| 17 | Categoría de discapacidad | **Sí** | **ExtensionPatientDisability**. |
| 18 | Código país residencia habitual | **Sí** | **ExtensionCountryCode** en dirección. |
| 19 | Nombre país residencia habitual | **Sí** | `address.country` (texto). |
| 20 | Código municipio residencia habitual | **Sí** | **ExtensionDivipolaMunicipality**. |
| 21 | Nombre municipio residencia habitual | **Sí** | `address.city`. |
| 22 | Zona territorial de residencia | **Sí** | **ExtensionResidenceZone**. |
| 23 | Dirección | **Sí** | `address.line[]`. |
| 24 | Teléfono | **Sí** | `telecom` teléfono. |
| 25 | Fecha y hora inicio de la atención | **Sí** | `Composition.event[0].period.start` (respaldo: `[Fecha RDA]`). |
| 26 | Fecha y hora finalización de la atención | **Sí** | `Composition.event[0].period.end` (mismo respaldo). |
| 27 | Modalidad de realización de la tecnología en salud | **Sí / Parcial** | Primer `code` del `event`: **ColombianTechModality** desde catálogo; si no hay FK → código `01` (validar vs ValueSet). |
| 28 | Grupo de servicios | **Sí / Parcial** | Segundo `code`: **GrupoServicios** desde catálogo; respaldo `01` si falta FK. |
| 29 | Código que indica si la persona tiene alergia | **Parcial** | No hay elemento booleano dedicado; se infiere por presencia de `AllergyIntolerance` vs `emptyReason` en la sección. |
| 30 | Nombre del alérgeno | **Sí** (si hay dato) | `AllergyIntolerance.code.text` + `category` según tipo. |
| 31 | Condición de salud familiar CIE-10 | **Sí** | `FamilyMemberHistory.condition` con ICD-10. |
| 32 | Condición de salud familiar CIE-11 | **Sí** (si hay dato) | Columnas BD + segundo `coding` ICD-11 MMS. |
| 33 | Parentesco del antecedente familiar | **Sí** | `relationship.coding` (catálogo local + display). *Validar perfil vs sistema terminológico exigido.* |
| 34 | Descripción común del medicamento (DCI) | **Parcial** | `MedicationStatement.medicationCodeableConcept.text` solamente; sin `coding` DCI aún. |
| 35 | Código diagnóstico principal al egreso CIE-10 | **N/A lista** | No modelado en este bundle (**RDA Consulta Externa** / egreso). |
| 36 | Nombre diagnóstico principal egreso CIE-10 | **N/A lista** | Igual. |
| 37 | Tipo diagnóstico principal al egreso CIE-10 | **N/A lista** | Igual. |
| 38 | Código diagnóstico principal ingreso CIE-11 | **Sí** (si hay dato) | `Condition` + sección **Diagnóstico de ingreso (CIE-11)**. |
| 39 | Término diagnóstico principal ingreso CIE-11 | **Sí** | `Condition.code.display` / `text`. |
| 40 | Tipo documento THS | **Sí / Parcial** | `Practitioner.identifier.type` (ColombianPersonIdentifier). Si falta en BD → `SI` (placeholder). |
| 41 | Número documento THS | **Sí / Parcial** | `Practitioner.identifier.value`. Desde Select2 de profesional; si falta → `NO-INFORMADO` (placeholder). |

---

## Lo que sigue siendo riesgo o mejora (calidad del JSON)

| Tema | Detalle |
|------|---------|
| **NIT IPS** | Debe ser un **NIT válido** (formato numérico DIAN). Texto libre en el campo rompe semántica del identificador (ej. en pruebas). |
| **Modalidad / grupo `01`** | Si el usuario no elige catálogo, el respaldo puede **no** pasar validación terminológica. |
| **Placeholders THS** | `SI` / `NO-INFORMADO` pueden fallar en validador; conviene exigir tipo + documento reales en negocio. |
| **Observation talla/peso** | Sin perfil RDA en `meta.profile`; confirmar en IG si existe recurso perfilado obligatorio. |
| **DCI codificado** | Pendiente `coding` en medicamentos si la IG lo exige. |
| **Validador oficial** | Paso recomendado antes de producción: `minsalud.fhir.co.rda` + reglas del snapshot **CompositionPatientStatementRDA**. |

---

## Referencias

- Lista fuente: [`docs/lista rda paciente.txt`](../lista%20rda%20paciente.txt)
- Comparación con IG: [`comparacion-json-rda-paciente-vs-ig-ministerio.md`](./comparacion-json-rda-paciente-vs-ig-ministerio.md)
- Ejemplo de respuesta JSON: [`jsonsalida3.md`](../../jsonsalida3.md)
- Endpoint: `POST /apiV3/RdaPaciente/FhirBundle`
- Script ALTER: [`alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql`](../../back_relacionador/SQL/alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql)

---

*Última actualización: marzo 2026 — estado alineado con el bundle generado tras implementación de brechas lista vs IG (Composition `event`/`custodian`/`author`, Practitioner, IPS, CIE-11, emptyReason, Observation talla/peso, perfiles `fhir.minsalud.gov.co`).*

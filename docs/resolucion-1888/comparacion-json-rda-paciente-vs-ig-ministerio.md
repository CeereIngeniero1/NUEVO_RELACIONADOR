# Comparación: JSON RDA Paciente vs. Guía del Ministerio (IG)

Este documento relaciona lo que exige la **Guía de Implementación FHIR RDA Paciente** con lo que genera el backend (`POST /apiV3/RdaPaciente/FhirBundle`) y con ejemplos en el repo.

**IG oficial (v0.7.2):** [RDA Paciente – vulcano.ihcecol.gov.co](https://vulcano.ihcecol.gov.co/RDA-paciente)  
**Paquete FHIR:** `minsalud.fhir.co.rda` (misma versión que referencia la IG).

**Ejemplos de salida en el repo**

| Archivo | Uso |
|---------|-----|
| [`jsonsalida.md`](../../jsonsalida.md) | Instantánea antigua; solo referencia histórica. |
| [`jsonsalida3.md`](../../jsonsalida3.md) | Ejemplo reciente post–ajustes (Composition, custodian, event, etc.). |

**Prueba sugerida:** construir un Bundle con Insomnia/Postman (`POST /apiV3/RdaPaciente/FhirBundle` con `IdEvaluacionEntidadRDA`) y validar contra el validador FHIR con paquete **`minsalud.fhir.co.rda#0.7.2`** (o la versión que indique la IG en vulcano). Revisar especialmente **CompositionPatientStatementRDA** (título, `type` LOINC 102089-0, `event`, `author` PractitionerRDA, `custodian` CareDeliveryOrganizationRDA).

---

## 1. Contexto

Según la IG, el **RDA Paciente** es un documento basado en `Composition` que se transmite como **`Bundle` tipo `document`**, con el `Composition` raíz, el `Patient` (perfil **PatientRDA**) y todos los recursos referenciados en las secciones. Debe alinearse con la **Resolución 1888 de 2025** y las reglas de la guía.

### 1.1. Datos en pantalla / BD vs. JSON FHIR

En el formulario **“Datos del paciente”** se capturan documento, nombres, nacimiento, sexo, identidad de género, nacionalidad, talla, peso, residencia, etnia, discapacidad, etc. Esa información **se persiste** en `[Evaluacion Entidad RDA]` (y catálogos `Cnsta * 1888`). Campos adicionales para conformidad con **CompositionPatientStatementRDA** incluyen **modalidad**, **grupo de servicios**, **NIT/nombre IPS** (columnas en BD), fechas de atención, diagnóstico ingreso CIE-11 y documento del profesional (ver `Asignar_RIPS V3.html` y script SQL de migración en `back_relacionador/SQL/alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql`).

**Mapeo actual en UI (RDA Paciente)** — coherente con decisión de negocio de reutilizar campos ya existentes:

| Columna / API | Origen en pantalla RDA Paciente |
|---------------|----------------------------------|
| `CodigoPrestador` | Select **Código Prestador**. |
| `CodigoAdminPlanBeneficios` / `NombreAdminPlanBeneficios` | Select **Administrador Plan Beneficios** + nombre (readonly) asociado. |
| `NitPrestadorIPS` / `NombrePrestadorIPS` | El guardado envía el **mismo valor de Código Prestador** en `NitPrestadorIPS` y el **nombre del administrador** en `NombrePrestadorIPS` (ver payload en `Asignar_RIPS V3.html`). |

En el **JSON FHIR**, el backend sigue interpretando `NitPrestadorIPS` como valor del identificador **DIAN (NIT)** y `CodigoPrestador` como **REPS (código habilitación)**. Si ambos quedan iguales por este mapeo, el bundle **sí los incluye**, pero un validador estricto puede marcar inconsistencia semántica (NIT numérico vs. código de prestador). Conviene alinear datos reales (NIT DIAN vs. código REPS) cuando el negocio lo defina.

**Modalidad y grupo de servicios**

- Se persisten `Id Modalidad Atencion` e `Id Grupo Servicios` y el `SELECT` del bundle resuelve **código y nombre** vía JOIN a catálogos (`CodigoModalidadAtencion`, `NombreModalidadAtencion`, `CodigoGrupoServicios`, `NombreGrupoServicios`).
- En **frontend** (`Asignar_RIPS V3.js`), los selects **Modalidad atención (RDA / FHIR)** y **Grupo servicios (RDA / FHIR)** intentan **copiar y sincronizar** las listas y el valor desde los mismos controles del flujo **Asignar RIPS** (bloques AC/AP: `SelectModalidadGrupoServicioTecnologiaSalud` / `SelectGrupoServiciosAC`, etc.), con **fallback** a `/apiV3/ModalidadAtencion` y `/apiV3/GrupoServicios` si hiciera falta.
- Si en BD no hay FK o código, el backend usa **`01`** como código por defecto en `Composition.event` (riesgo de validación terminológica).

### 1.2. Archivos `jsonsalida*.md`

`jsonsalida.md` es una **instantánea** antigua. Para comparar con la IG, use una respuesta nueva de `POST /apiV3/RdaPaciente/FhirBundle` o el ejemplo [`jsonsalida3.md`](../../jsonsalida3.md).

---

## 2. Lo que pide la IG (resumen [RDA Paciente](https://vulcano.ihcecol.gov.co/RDA-paciente))

| Elemento de la IG | Perfil / recurso | Cómo lo cubre el backend hoy |
|-------------------|------------------|------------------------------|
| Paquete transaccional | `Bundle` `type: document` | Sí: `timestamp` + `entry[]` en orden fijo (ver §3.5). |
| Documento raíz | `Composition` → **CompositionPatientStatementRDA** | Sí: `status`, `type` LOINC **102089-0** (display acorde a IG), `title` fijado, `confidentiality: N`, `date` desde `[Fecha RDA]`, `subject` → Patient, **`event`** (periodo inicio/fin o fallback a `date` + codings **ColombianTechModality** y **GrupoServicios**), **`author`** → **PractitionerRDA**, **`custodian`** → **CareDeliveryOrganizationRDA** si hay **NIT Prestador IPS** y **Código Prestador** en cabecera. |
| Sección medicamentos | **MedicationStatementRDA** | Sí; si la lista está vacía → **`emptyReason`** (`nilknown`). |
| Sección alergias | **AllergyIntoleranceStatementRDA** o vacío documentado | Sí: recurso si hay `Alergeno`; categoría según **Tipo de Alergia** cuando aplica; si no hay alergia registrada, `emptyReason`. |
| Sección patológicos | **ConditionStatementRDA** | Sí (CIE-10 en `coding`); si vacío → `emptyReason`. |
| Sección familiares | **FamilyMemberHistoryRDA** | Sí; si vacío → `emptyReason`; segundo `coding` CIE-11 si hay columnas en BD. |
| Diagnóstico ingreso CIE-11 | **ConditionStatementRDA** | Sí: `Condition` + sección **“Diagnóstico de ingreso (CIE-11)”** en `Composition` cuando hay código en BD (`http://id.who.int/icd/release/11/mms`). |
| Paciente | **PatientRDA** | Sí: identificador RNEC, extensiones, `birthDate` + **patient-birthTime** si la fecha de nacimiento incluye hora; **`managingOrganization`** → organización EAPB si existe (requiere nombre admin). |
| Autor clínico | **PractitionerRDA** | Sí: `Composition.author` apunta siempre a **Practitioner**; si faltan datos THS se usan valores por defecto (`SI` / `NO-INFORMADO`) — riesgo ante validador estricto. |
| IPS (custodian) | **CareDeliveryOrganizationRDA** | Sí **solo si** hay valor en **NIT Prestador IPS** y en **Codigo Prestador**; `identifier`: slice **DIAN (NIT)** + **REPS (código habilitación)**; `name` desde nombre IPS o placeholder. |
| Participantes (EAPB) | **HealthBenefitPlanAdminOrganizationRDA** | Parcial condicionado: la entrada **Organization** EAPB se crea si hay **`NombreAdminPlanBeneficios`**; el `identifier` EAPBS solo si hay **`CodigoAdminPlanBeneficios`**. |
| Talla / peso | Observation (LOINC) | Parcial: **Observation** (LOINC 8302-2 / 29463-7, categoría vital-signs) **sin** `meta.profile` RDA hasta confirmar perfil en la IG. |

**Ejemplo de referencia PatientRDA en la IG:** [Patient-92a8e277 (JSON)](https://vulcano.ihcecol.gov.co/Patient-92a8e277-af20-4854-a3fb-02cbe9fb8d49.json.html).

---

## 3. Detalle de implementación actual (backend)

### 3.1. `Patient` (PatientRDA)

Origen principal: fila de `[Evaluacion Entidad RDA]` + JOINs a catálogos 1888 y, para `Composition.event`, JOINs a **modalidad** y **grupo de servicios** RIPS.

| Área FHIR | Contenido |
|-----------|-----------|
| `meta.profile` | `https://fhir.minsalud.gov.co/rda/StructureDefinition/PatientRDA` |
| `birthDate` / `_birthDate` | Fecha ISO; extensión **http://hl7.org/fhir/StructureDefinition/patient-birthTime** si la fecha-hora de nacimiento incluye hora. |
| `managingOrganization` | Referencia a la `Organization` EAPB (`urn:uuid:...`) si se construyó por nombre de administrador. |

### 3.2. `Organization` (EAPB)

| Área | Contenido |
|------|-----------|
| `meta.profile` | `https://fhir.minsalud.gov.co/rda/StructureDefinition/HealthBenefitPlanAdminOrganizationRDA` |
| `name` | `NombreAdminPlanBeneficios` (condición para crear el recurso). |
| `identifier` | Opcional: sistema **EAPBS** + `CodigoAdminPlanBeneficios` si viene informado. |

### 3.3. `Organization` (IPS / custodian)

| Área | Contenido |
|------|-----------|
| `meta.profile` | `CareDeliveryOrganizationRDA` |
| `identifier` | Slice **TaxIdentifier** (DIAN / NIT ← `NitPrestadorIPS`) + **HealthcareProviderIdentifier** (REPS ← `CodigoPrestador`). |
| `name` | `NombrePrestadorIPS` o texto derivado del código prestador. |

### 3.4. Otros recursos del Bundle

- **Composition**, **Condition**, **FamilyMemberHistory**, **MedicationStatement**, **AllergyIntolerance**, **Practitioner**: `meta.profile` bajo `https://fhir.minsalud.gov.co/rda/StructureDefinition/...`.
- **Observation** (talla/peso): sin perfil RDA en `meta.profile`.

### 3.5. Orden de `Bundle.entry` (implementado)

1. `Composition`  
2. `Patient`  
3. `Practitioner`  
4. `Organization` IPS (si aplica)  
5. `Organization` EAPB (si aplica)  
6. `Observation` (talla / peso, si aplica)  
7. `Condition` diagnóstico ingreso CIE-11 (si aplica)  
8. `Condition` antecedentes patológicos  
9. `FamilyMemberHistory`  
10. `MedicationStatement`  
11. `AllergyIntolerance` (si aplica)

---

## 4. Brechas y mejoras (conformidad / IG)

| Tema | Estado |
|------|--------|
| **NIT IPS vs. código prestador (UI → BD)** | El formulario puede enviar el mismo valor en columnas usadas para DIAN y REPS; conviene separar captura o mapear NIT real y código REPS según normativa. |
| **Modalidad / grupo por defecto** | Si no hay FK/código en BD, se usa **`01`** en los CodeSystems de la IG — puede fallar validación terminológica; conviene obligar captura o asegurar catálogo. |
| **Practitioner sin documento válido** | Placeholders (`SI` / `NO-INFORMADO`) — riesgo en validador; el usuario debe completar **Tipo** + documento del profesional coherentes con RNEC. |
| **Observation talla/peso** | Sin perfil RDA dedicado; confirmar en la IG si existe **Observation** perfilado obligatorio. |
| **Medicamentos y condiciones codificados** | Medicamentos principalmente en texto; patológicos CIE-10 según almacenamiento. |
| **Ocupación** | Puede existir en UI; persistencia en `[Evaluacion Entidad RDA]` no cubierta en el alcance actual del bundle. |
| **Sincronización modalidad/grupo (UI)** | Depende de visibilidad AC/AP y carga asíncrona; si algo no refleja, revisar consola y que los selects RIPS tengan opciones antes de abrir RDA. |
| **Validación formal** | Ejecutar el Bundle contra el validador con **`minsalud.fhir.co.rda#0.7.2`**. |

---

## 5. Próximos pasos sugeridos

1. Validar un Bundle real con el validador FHIR y el paquete de la IG.
2. Definir captura explícita de **NIT DIAN** vs. **código prestador REPS** para custodian IPS y ajustar payload/UI si hace falta.
3. Evitar placeholders en **Practitioner** exigiendo datos THS coherentes con RNEC.
4. Confirmar códigos por defecto de modalidad/grupo o hacerlos obligatorios en negocio.
5. Añadir perfil RDA a **Observation** de talla/peso si la IG lo publica.
6. Decidir modelo para **ocupación** y codificación DCI de medicamentos.

---

## 6. Referencias en el repo

| Recurso | Ubicación |
|---------|-----------|
| Handler del Bundle | [`back_relacionador/server/routes/Asignar_RipsRoutes V3.js`](../../back_relacionador/server/routes/Asignar_RipsRoutes%20V3.js) — `router.post('/RdaPaciente/FhirBundle', ...)` |
| Formulario + payload RDA Paciente | [`front_relacionador/public/Asignar_RIPS V3.html`](../../front_relacionador/public/Asignar_RIPS%20V3.html) |
| Sincronización modalidad/grupo RDA ↔ RIPS | [`front_relacionador/public/Asignar_RIPS V3.js`](../../front_relacionador/public/Asignar_RIPS%20V3.js) |
| DDL RDA Paciente | [`back_relacionador/SQL/1888.sql`](../../back_relacionador/SQL/1888.sql) |
| ALTER FHIR / modalidad / CIE-11 familiar | [`back_relacionador/SQL/alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql`](../../back_relacionador/SQL/alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql) |
| Lista normativa vs JSON (línea a línea) | [`rda-paciente-lista-vs-json-fhir.md`](./rda-paciente-lista-vs-json-fhir.md) |
| Ejemplo de bundle reciente | [`jsonsalida3.md`](../../jsonsalida3.md) |

---

*Proyecto NUEVO_RELACIONADOR. Última revisión del documento: marzo 2026. Actualizar cuando cambie la versión de la IG o el paquete `minsalud.fhir.co.rda`.*

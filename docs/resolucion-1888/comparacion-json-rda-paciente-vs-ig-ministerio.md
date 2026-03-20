# Comparación: JSON RDA Paciente vs. Guía de Implementación del Ministerio

Este documento resume la comparación entre un **Bundle FHIR** generado por el sistema (ejemplo en [`jsonsalida.md`](../../jsonsalida.md) en la raíz del repositorio) y lo descrito en la **Guía de Implementación FHIR RDA Paciente** publicada por el Ministerio de Salud y Protección Social.

**Referencia oficial de la IG:**  
[RDA Paciente – Resumen Digital de Atención en Salud (RDA) v0.7.2](https://vulcano.ihcecol.gov.co/RDA-paciente)

---

## 1. Contexto

La página del Ministerio indica que el **documento RDA Paciente** es un perfil de `Composition` para el **autoreporte del paciente**, transmitido como un **`Bundle` de tipo `document`** que incluye el `Composition`, el `Patient` y todos los recursos referenciados en las secciones (medicamentos, alergias, problemas de salud, antecedentes familiares, etc.).

El documento debe alinearse con la **Resolución 1888 de 2025** y la sintaxis/semántica de la guía FHIR RDA.

---

## 2. Lo que ya está alineado con la guía

| Tema | Lo que pide la IG | Observación sobre el JSON de ejemplo |
|------|-------------------|--------------------------------------|
| **Paquete** | `Bundle` tipo **`document`**, contenedor transaccional | Incluye `type: "document"` y `timestamp`. |
| **Raíz del documento** | `Composition` con perfil **CompositionPatientStatementRDA** | Declara el perfil correcto y `status: final`. |
| **`Composition.type`** | Identifica el documento como autoreporte (código definido en el perfil; en la práctica LOINC `60591-5` es coherente con “patient summary”) | Presente con `coding` y `text` acorde a RDA Paciente. |
| **`subject` y `author`** | El sujeto es el paciente; el **paciente puede figurar como autor** (`Patient` o en algunos casos `RelatedPerson`) | `subject` y `author` apuntan al mismo recurso `Patient`. |
| **Cuatro secciones principales** | Antecedentes farmacológicos, alérgicos, patológicos y familiares | Mismo orden y contenido conceptual. |
| **Perfiles en recursos clínicos** | `MedicationStatementRDA`, `AllergyIntoleranceStatementRDA`, `ConditionStatementRDA`, `FamilyMemberHistoryRDA` | Los `Condition`, `FamilyMemberHistory` y `MedicationStatement` del ejemplo declaran los perfiles RDA correspondientes. |
| **Sección sin alergias** | Si no hay información o no se conocen alergias, documentarlo con **`emptyReason`** | La sección “Antecedentes alérgicos” usa `emptyReason` con código `nilknown` y texto explicativo. |
| **Referencias resolubles** | Las entradas de cada `section` deben referenciar recursos presentes en el mismo `Bundle` | Los `reference: urn:uuid:...` coinciden con `fullUrl` / `id` de entradas del bundle. |
| **Recursos incluidos** | Además del `Composition`, deben viajar `Patient` y los recursos citados en las secciones | El ejemplo incluye `Patient`, `Organization`, `Condition`, `FamilyMemberHistory`, `MedicationStatement`. |

En conjunto, la **forma de documento FHIR** (document bundle + composición + secciones + uso de `emptyReason` cuando no hay alergias) es **coherente** con la descripción general de [RDA Paciente](https://vulcano.ihcecol.gov.co/RDA-paciente).

---

## 3. Diferencias o riesgos frente a la IG (validación estricta)

Estos puntos no implican que el JSON esté “mal” para pruebas internas, pero suelen aparecer cuando se usa el **validador FHIR** contra las **StructureDefinition** del paquete `minsalud.fhir.co.rda`.

### 3.1. `Organization` sin perfil RDA

La guía contempla organizaciones participantes (por ejemplo **IPS** y **EAPB**) con perfiles específicos del paquete RDA.

En el ejemplo, `Organization` solo tiene `resourceType`, `id` y `name`, **sin** `meta.profile` apuntando al perfil de organización que exija la IG. Eso puede generar **errores de conformidad** en validación estricta.

### 3.2. `Patient` muy reducido

El perfil **PatientRDA** suele **restringir u obligar** más elementos que un simple identificador y `name.text` (por ejemplo datos demográficos, forma canónica del identificador según tipo de documento, etc.).

Conviene validar el recurso contra la definición oficial **PatientRDA** en la IG y completar lo que el snapshot marque como obligatorio.

### 3.3. Codificación de medicamentos y condiciones

La documentación de la guía enfatiza **conformidad semántica** y, como ejemplo, menciona terminologías estandarizadas (p. ej. códigos preferidos para alergias o medicamentos).

- **Medicamentos:** solo `medicationCodeableConcept.text` puede ser insuficiente si el perfil exige `coding` con un sistema y código obligatorios.
- **Condiciones (CIE-10):** códigos como `A020`, `A000` pueden no coincidir con el value set o formato que espere el validador para **ConditionStatementRDA**.

### 3.4. `FamilyMemberHistory.relationship`

El ejemplo usa el sistema **`http://terminology.hl7.org/CodeSystem/v3-RoleCode`** con códigos **`01`**, **`03`** y textos como “Padres”, “Tíos”.

El catálogo **v3-RoleCode** de HL7 **no** es el mismo que el catálogo colombiano de parentesco de la resolución/RDA. El perfil **FamilyMemberHistoryRDA** puede exigir otro **system** o un **value set** distinto. Hay que revisar la StructureDefinition y las terminologías enlazadas en la IG.

### 3.5. `fullUrl` e identificadores en el `Bundle`

En el ejemplo aparece algo como `fullUrl: urn:uuid:EPS010` donde el segmento final **no es un UUID** estándar. Para referencias internas puede funcionar en algunos escenarios, pero **mezclar el prefijo `urn:uuid:` con identificadores no UUID** puede ser rechazado por herramientas o por reglas del receptor.

### 3.6. Contexto de atención en `Composition`

El texto de la guía relaciona el RDA con un **evento de atención** (y la normativa 1888). El perfil **CompositionPatientStatementRDA** puede incluir elementos de contexto (por ejemplo encuentro, custodio, participantes adicionales) que **no** están presentes en el JSON de ejemplo.

Solo la validación contra el **snapshot** del perfil confirma qué elementos son obligatorios u opcionales.

---

## 4. Resumen

| Aspecto | Valoración breve |
|--------|-------------------|
| **Estructura del documento FHIR** (`Bundle` document + `Composition` + secciones + referencias) | Alineada con la descripción general de la IG. |
| **Sección de alergias sin datos** (`emptyReason`) | Alineada con lo indicado en la guía para “no conocidas” / sin información. |
| **Autor = paciente** | Coherente con lo que permite la propia página RDA Paciente. |
| **Conformidad al 100 % con perfiles y terminologías** | Requiere validación formal; los puntos 3.1–3.6 son los focos típicos de mejora. |

---

## 5. Próximos pasos recomendados

1. **Validar el Bundle** con el validador FHIR usando el paquete de implementación **minsalud.fhir.co.rda** (misma versión que use el Ministerio en producción, p. ej. la referenciada en vulcano).
2. Revisar cada **StructureDefinition** usada: `CompositionPatientStatementRDA`, `PatientRDA`, perfiles de `Organization`, `MedicationStatementRDA`, `ConditionStatementRDA`, `FamilyMemberHistoryRDA`, `AllergyIntoleranceStatementRDA`.
3. Ajustar el **generador en backend** para cubrir cardinalidades y value sets obligatorios que marque cada perfil.
4. Mantener un **ejemplo validado** (o export del validador sin errores) como referencia de regresión.

---

## 6. Referencias

- [RDA Paciente – IG Ministerio (vulcano)](https://vulcano.ihcecol.gov.co/RDA-paciente)
- Ejemplo de salida analizado: [`jsonsalida.md`](../../jsonsalida.md) (raíz del repositorio)
- Documentación interna de campos UI RDA Paciente: [`rda_paciente.md`](./rda_paciente.md)

---

*Documento generado para el proyecto NUEVO_RELACIONADOR. Actualizar si cambia la versión de la IG o el paquete FHIR del Ministerio.*

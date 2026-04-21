# Plan: construcción del JSON RDA Consulta Externa — sección por sección

Documento de **planificación** para revisar, validar y evolucionar el **Bundle FHIR** tipo `document` que genera el backend antes de enviarlo a IHCE (`Composition/$enviar-rda-consulta`). Complementa el flujo operativo en `RDA-CE-Flujo-IHCE-Paso-a-Paso.md` (paso 4) y la referencia de endpoints en `RDA-Consulta-Externa-endpoints.md`.

**Código fuente de referencia:** `server/routes/rda/RdaConsultaExternaRoutes.js` (armado de `Composition.section` y `Bundle.entry`).

---

## 1. Objetivo y alcance

| Meta | Descripción |
|------|-------------|
| Validar datos | Cada sección del `Composition` debe reflejar datos correctos de RDACE (SQL Server) y reglas de negocio. |
| Validar FHIR | Perfiles MinSalud / RDA (`CompositionAmbulatoryRDA`, recursos referenciados) y restricciones del validador IHCE. |
| Iterar con seguridad | Usar `FhirBundle` y `JsonEnviarIHCE` para inspeccionar JSON **sin** enviar a producción hasta checklist completo. |

**Fuera de alcance de este plan:** autenticación OAuth, consulta organización/profesional (ya cubierto en el flujo IHCE paso a paso).

---

## 2. Cómo obtener el JSON en cada fase

| Fase | Ruta local (prefijo `/apiV3`) | Qué devuelve |
|------|-------------------------------|--------------|
| A. Bundle “crudo” desde BD | `POST /RdaConsultaExterna/FhirBundle` | `Bundle` `document` sin normalizaciones propias del envío IHCE. |
| B. Igual que enviaría IHCE | `POST /RdaConsultaExterna/JsonEnviarIHCE` (o alias documentados) | Mismo pipeline que `EnviarIHCE` hasta antes del POST a IHCE (incluye normalización). |
| C. Variante modular | `POST /RdaConsultaExterna/JsonEnviarIHCEModular` | Mismos cuerpos que documentan rutas *Modular*; útil para aislar tipos de recurso. |

Cuerpo típico mínimo:

```json
{
  "IdEvaluacionEntidadRDACE": 1,
  "ambiente": "sandbox"
```

`ambiente` aplica sobre todo a la ruta **B**; en **A** influye menos en la forma del bundle salvo overrides de prestador.

---

## 3. Estructura global del `Bundle`

Orden conceptual (el código usa `makeEntry` + referencias `#id`):

1. **Primer `entry`:** `Composition` (`CompositionAmbulatoryRDA`) — incluye `section[]` en el **mismo orden** que la tabla del §4.
2. **Recursos fijos habituales:** `Patient`, `Encounter`, `Practitioner`, opcionalmente `Organization` (IPS custodian), EAPB si aplica.
3. **Recursos por dominio clínico:** `Condition`, `AllergyIntolerance`, `RiskAssessment`, `MedicationRequest`, `ServiceRequest` / otras tecnologías, SIPE (`Observation` u otros según implementación), `DocumentReference` (epicrisis PDF).

**Reglas críticas ya codificadas (no olvidar al planear):**

- Sección **61146-1 (órdenes):** debe existir **al menos un** `entry`; no basta con `emptyReason` solo.
- Sección **55107-7 (documentos de soporte):** perfil / validador suele exigir **exactamente** un `entry` al DocumentReference; tratar PDF y metadatos con cuidado.
- **Referencias:** coherencia entre `Bundle.entry` y referencias en `Composition` / recursos (evitar mezclar estilos de referencia que rompan validación IHCE).
- **Alergias:** workaround documentado con `IHCE_RDACE_OMIT_ALLERGY_INTOLERANCE` y flags `incluirAllergyIntolerance` en el body.

---

## 4. Plan por sección (orden real en `Composition.section`)

La siguiente tabla es el **plan de trabajo**: completar columnas “Datos RDACE / SQL”, “Estado” y “Notas validador” según vuestro entorno.

| # | LOINC | Título (Composition) | Recurso(s) típicos en `entry` | Datos RDACE / SQL (completar) | Estado (pendiente / OK sandbox / OK prod) | Notas IHCE / código |
|---|-------|------------------------|-------------------------------|-------------------------------|---------------------------------------------|----------------------|
| 1 | `48768-6` | Entidad(es) responsable(s) por el plan de beneficios en salud (consulta) | `Organization` (EAPB) | Cabecera evaluación / vínculo pagador | | Si no hay datos → sección vacía con `emptyReason` |
| 2 | `74208-0` | Otros datos demográficos | *(hoy narrativa vacía en código)* | Ocupación, extensiones demográficas según IG | | En implementación actual suele ser **solo** sección vacía; planear si se enriquece con `Patient` / Observation |
| 3 | `105583-9` | Datos incapacidad (SIPE) | `Observation` (o recurso definido en código) | Tablas incapacidad / SIPE ligadas a evaluación | | Condicional a `incapacidadEntry` |
| 4 | `11450-4` | Historial de diagnósticos de problemas de salud | `Condition` (lista) | `DiagnosticosRelacionados` + principal en cabecera | | Múltiples `entry` si varios diagnósticos |
| 5 | `48765-2` | Historial de alergias, intolerancias y reacciones adversas | `AllergyIntolerance` | Antecedentes / alergias en RDACE | | Validación `verificationStatus`; ver `.env` y flags de inclusión |
| 6 | `75492-9` | Factores de riesgo | `RiskAssessment` | Factores de riesgo en RDACE | | |
| 7 | `10160-0` | Historial de medicamentos | `MedicationRequest` (lista) | Prescripción medicamentos | | |
| 8 | `61146-1` | Órdenes, prescripciones o solicitudes de servicio | `ServiceRequest`, otras tecnologías, placeholder si aplica | Prescripción procedimientos, otras tecnologías, CUPS | | **Mínimo un entry**; revisar placeholder de órdenes en código |
| 9 | `55107-7` | Documentos de soporte | `DocumentReference` (EPI / PDF) | PDF epicrisis, `NombreDocumentoPDF`, etc. | | `attachment.data` base64; `format` PDF; sin depender solo de URL |

> **Nota:** el orden anterior coincide con el arreglo `sections` en `RdaConsultaExternaRoutes.js` (no con versiones antiguas de tablas del flujo donde medicamentos iba antes que alergias).

---

## 5. Checklist por iteración (copiar en PR o ticket)

Para un `IdEvaluacionEntidadRDACE` concreto:

- [ ] **A** `FhirBundle`: revisar `Composition.section` fila a fila (tabla §4).
- [ ] **B** `JsonEnviarIHCE`: diff razonable respecto a A; revisar normalización (custodian, refs, omisiones).
- [ ] **Cabecera documento:** `Encounter.period`, `Composition.event`, autor, custodian alineados con prestador real.
- [ ] **Patient:** identificadores, género, edad/fecha nacimiento según reglas IG.
- [ ] **61146-1:** al menos una orden / solicitud coherente con el encuentro.
- [ ] **55107-7:** PDF legible, tamaño y tipo; error 503 si falta `pdfkit` en servidor (ver doc endpoints).
- [ ] **Sandbox IHCE:** `EnviarIHCE` solo cuando lo anterior esté OK.

---

## 6. Roadmap sugerido (documento vivo)

| Prioridad | Entrega | Descripción |
|-----------|---------|-------------|
| P0 | Mantener esta tabla | Actualizar “Estado” y “Notas” cuando MinSalud o IHCE cambien validaciones. |
| P1 | Endpoints de depuración opcionales | Rutas que devuelvan **solo** un fragmento (p. ej. una sección o un recurso) para acelerar QA — cuando existan, enlazarlos desde §2 y desde `RDA-CE-Flujo-IHCE-Paso-a-Paso.md`. |
| P2 | Sección `74208-0` | Definir si debe enlazar explícitamente a `Patient` u observaciones demográficas según guía RDA. |
| P3 | Pruebas automatizadas | Snapshots JSON redactados de evaluaciones de prueba (sin datos personales reales). |

---

## 7. Referencias cruzadas

- Flujo ordenado (token → org → profesional → secciones → envío): `RDA-CE-Flujo-IHCE-Paso-a-Paso.md`
- Contratos HTTP y variables `.env`: `RDA-Consulta-Externa-endpoints.md`
- Tokens y consultas proxy V2: `server/routes/rda/RdaConsultaExternaRoutesv2.js`

---

*Última alineación con el orden de secciones en `RdaConsultaExternaRoutes.js` (bloque `Composition` / `sections`). Actualizar si el router cambia el orden o los LOINC.*

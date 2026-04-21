# RDA Consulta Externa (RDACE) — Endpoints API

Montaje: las rutas viven en `server/routes/rda/RdaConsultaExternaRoutes.js` y se exponen bajo el prefijo del router V3.

**URL base (local típico):** `http://localhost:3000/apiV3`

**Cabecera común:** `Content-Type: application/json` en todos los `POST` con cuerpo JSON.

---

## 1. FHIR — Bundle documento (sin IHCE)

Construye el `Bundle` tipo `document` desde SQL Server según el id de evaluación. **No** aplica la misma normalización que el envío a IHCE (p. ej. filtros de alergia, `Patient.address`, secciones vacías, etc.).

| Método | Ruta |
|--------|------|
| `POST` | `/RdaConsultaExterna/FhirBundle` |

### Cuerpo JSON

```json
{
  "IdEvaluacionEntidadRDACE": 1,
  "overrideNitPrestadorIPS": "900479959",
  "overrideNombrePrestadorIPS": "NOMBRE IPS SEGÚN IHCE"
}
```

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `IdEvaluacionEntidadRDACE` | Sí | Entero: id en `[Evaluacion Entidad RDA Consulta Externa]`. |
| `overrideNitPrestadorIPS` | No | NIT de la IPS si no está solo en BD / alinear con token IHCE. |
| `overrideNombrePrestadorIPS` | No | Razón social IPS. |

Si faltan NIT/nombre en cabecera, el código puede usar variables de entorno `IHCE_RDACE_DEFAULT_NIT_IPS` y `IHCE_RDACE_DEFAULT_NOMBRE_IPS`.

### Respuesta

JSON: `Bundle` FHIR o `400`/`404`/`500` con `{ ok: false, error: "..." }`.

---

## 2. IHCE — Enviar RDA consulta externa (`$enviar-rda-consulta`)

Obtiene token OAuth, construye el bundle llamando a `FhirBundle` internamente, **normaliza** el bundle (reglas IHCE), aplica overrides de custodian si hay `.env`, y hace `POST` a IHCE.

| Método | Ruta (cualquiera; mismo handler) |
|--------|----------------------------------|
| `POST` | `/RdaConsultaExterna/EnviarIHCE` |
| `POST` | `/RdaConsultaExterna/EnviarIhce` |

### Cuerpo JSON

```json
{
  "IdEvaluacionEntidadRDACE": 1,
  "ambiente": "sandbox",
  "overrideNitPrestadorIPS": "900479959",
  "overrideNombrePrestadorIPS": "NOMBRE IPS",
  "incluirAllergyIntolerance": true,
  "incluirConditions": true,
  "incluirRiskAssessment": true,
  "incluirMedications": true,
  "incluirObservations": true
}
```

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `IdEvaluacionEntidadRDACE` | Sí | Id de la evaluación RDACE. |
| `ambiente` | No | `"sandbox"` (defecto) o `"prod"` / `"produccion"` para variables `IHCE_PROD_*`. |
| `overrideNitPrestadorIPS` | No | Se reenvían a la llamada interna `FhirBundle`. |
| `overrideNombrePrestadorIPS` | No | Igual. |
| `incluirAllergyIntolerance` | No | `false`: no incluye `AllergyIntolerance`. `true`: fuerza incluir (anula `IHCE_RDACE_OMIT_ALLERGY_INTOLERANCE`). Si se omite, aplica lógica con `.env` (ver abajo). |
| `incluirConditions` | No | En ruta **no modular** se ignoran (siempre se incluyen condiciones). En **Modular** controla `Condition`. |
| `incluirRiskAssessment` | No | Igual: solo **Modular**. |
| `incluirMedications` | No | Igual: solo **Modular**. |
| `incluirObservations` | No | Igual: solo **Modular**. |

### Respuesta

- Cuerpo tal cual devuelve IHCE (p. ej. `Bundle` `transaction-response` con `201`/`200` en entries) y el **mismo código HTTP** que IHCE (`200`, `400`, `409`, etc.).
- Errores previos (token, bundle local): JSON `{ ok: false, error: "..." }` con `502`/`500`.

### Variables de entorno relevantes

- **Sandbox:** `IHCE_SANDBOX_BASE_URL` (o `IHCE_API_BASE_URL`), `IHCE_SANDBOX_TENANT_ID`, `IHCE_SANDBOX_CLIENT_ID`, `IHCE_SANDBOX_CLIENT_SECRET`, `IHCE_SANDBOX_SCOPE`, `IHCE_SANDBOX_SUBSCRIPTION_KEY` (o `IHCE_APIM_SUBSCRIPTION_KEY`).
- **RDACE IPS por defecto:** `IHCE_RDACE_DEFAULT_NIT_IPS`, `IHCE_RDACE_DEFAULT_NOMBRE_IPS`.
- **Alergia (workaround validador):** `IHCE_RDACE_OMIT_ALLERGY_INTOLERANCE=true` — omite alergia si el body no fuerza `incluirAllergyIntolerance: true`.
- **Custodian forzado (opcional):** `IHCE_SANDBOX_CUSTODIAN_REPS`, `IHCE_SANDBOX_CUSTODIAN_NIT`, `IHCE_SANDBOX_CUSTODIAN_NAME` (y equivalentes `IHCE_PROD_*` en prod).

---

## 3. Mismo JSON que envía IHCE — sin llamar a IHCE (preview / payload)

Mismo handler que `EnviarIHCE`, pero **solo** devuelve el `Bundle` ya normalizado. Útil para Insomnia, auditoría o diff. Respuesta con `Content-Type: application/fhir+json`.

| Método | Ruta |
|--------|------|
| `POST` | `/RdaConsultaExterna/JsonEnviarIHCE` |
| `POST` | `/RdaConsultaExterna/JsonEnviarIhce` |
| `POST` | `/RdaConsultaExterna/BundlePayloadIHCE` |
| `POST` | `/RdaConsultaExterna/PayloadParaIHCE` |

### Cuerpo JSON

**Igual que la sección 2** (`IdEvaluacionEntidadRDACE`, `ambiente`, overrides, flags que apliquen a ruta estándar).

Ejemplo mínimo:

```json
{
  "IdEvaluacionEntidadRDACE": 1,
  "ambiente": "sandbox"
}
```

Ejemplo forzando sin alergia si no usas `.env`:

```json
{
  "IdEvaluacionEntidadRDACE": 1,
  "ambiente": "sandbox",
  "incluirAllergyIntolerance": false
}
```

---

## 4. IHCE — Rutas **Modular** (mismos bodies, flags sí aplican)

En estas rutas los booleanos `incluirConditions`, `incluirAllergyIntolerance`, `incluirRiskAssessment`, `incluirMedications`, `incluirObservations` **sí** filtran tipos de recurso. `ServiceRequest` no se puede excluir (sección de órdenes obligatoria).

### Enviar (IHCE)

| Método | Ruta |
|--------|------|
| `POST` | `/RdaConsultaExterna/EnviarIHCEModular` |
| `POST` | `/RdaConsultaExterna/EnviarIhceModular` |

### Payload preview (sin IHCE)

| Método | Ruta |
|--------|------|
| `POST` | `/RdaConsultaExterna/JsonEnviarIHCEModular` |
| `POST` | `/RdaConsultaExterna/JsonEnviarIhceModular` |
| `POST` | `/RdaConsultaExterna/BundlePayloadIHCEModular` |
| `POST` | `/RdaConsultaExterna/PayloadParaIHCEModular` |

### Cuerpo JSON de ejemplo

```json
{
  "IdEvaluacionEntidadRDACE": 1,
  "ambiente": "sandbox",
  "incluirConditions": true,
  "incluirAllergyIntolerance": false,
  "incluirRiskAssessment": true,
  "incluirMedications": true,
  "incluirObservations": true
}
```

---

## 5. Persistencia RDACE (carga de datos previos al bundle)

Todos bajo `POST` y prefijo `/apiV3`. Resumen de rutas y cuerpos típicos:

| Ruta | Uso |
|------|-----|
| `/EvaluacionEntidadRDACE/` | Cabecera principal (documento paciente, fechas, prestador, diagnósticos, etc.). Devuelve id insertado. |
| `/EvaluacionEntidadRDACE/AntecedentesSalud` | `IdEvaluacionEntidadRDACE`, `DocumentoEntidad`, `Descripcion`, `IdEstado` |
| `/EvaluacionEntidadRDACE/AntecedentesFamiliares` | `IdEvaluacionEntidadRDACE`, `DocumentoEntidad`, `Parentesco`, `Descripcion`, `IdEstado` |
| `/EvaluacionEntidadRDACE/AntecedentesFarmacologicos` | `IdEvaluacionEntidadRDACE`, `DocumentoEntidad`, `Descripcion`, `IdEstado` |
| `/EvaluacionEntidadRDACE/DiagnosticosRelacionados` | `IdEvaluacionEntidadRDACE`, `CodigoCIE10`, `NombreCIE10`, `CodigoCIE11`, `TerminoCIE11`, `IdEstado` |
| `/EvaluacionEntidadRDACE/PrescripcionMedicamentos` | Campos de medicamento según `req.body` del router (código Mi Prescripción, dosis, fechas, etc.) |
| `/EvaluacionEntidadRDACE/PrescripcionProcedimientos` | `IdEvaluacionEntidadRDACE`, `tipo`, `codigo`, `nombre`, `finalidad`, `fechaPrescripcion`, `IdEstado` |
| `/EvaluacionEntidadRDACE/OtrasTecnologias` | `IdEvaluacionEntidadRDACE`, `tipo`, `codigo`, `nombre`, `fechaPrescripcion`, `finalidad`, `IdEstado` |

### Catálogos GET (1888 / apoyo)

| Método | Ruta |
|--------|------|
| `GET` | `/EgresoRemision` |
| `GET` | `/FactorDeRiesgo` |
| `GET` | `/TipoTecnologiaEnSalud` |
| `GET` | `/Catalogo1888/:clave?q=...` |

---

## 5.1 Token OAuth IHCE (desde `.env`, archivo `RdaConsultaExternaRoutesv2.js`)

`POST` sin cuerpo JSON. Cargan variables con `loadDotEnvFromCandidates()` y usan la misma resolución de credenciales que `ihceTokenDebug.resolveIhceCreds` (equivalente a `EnviarIHCE`).

| Método | Ruta | Variables |
|--------|------|-----------|
| `POST` | `/RdaConsultaExterna/IhceToken/sandbox` | `IHCE_SANDBOX_*` / alias `IHCE_TENANT_ID`, etc. |
| `POST` | `/RdaConsultaExterna/IhceToken/produccion` | `IHCE_PROD_*` |

Respuesta exitosa (`200`): JSON con `ok`, `access_token`, `expires_in`, `token_type`, `token_url`, `ihce_base_url`, `subscription_key_configurada`, `ambiente`.

Si `IHCE_FORCE_SANDBOX_ONLY=true`, la ruta **producción** responde `403` y no pide token a Microsoft.

**Advertencia:** el `access_token` es secreto; exponer estos endpoints en internet sin autenticación adicional es riesgoso.

---

## 5.2 Consultar profesional de la salud (IHCE, proxy desde `.env`)

`POST` con JSON. El backend pide token OAuth, luego llama a **`POST {IHCE_BASE}/Practitioner/$consultar-profesional-salud`** con un recurso **`Parameters`** (misma forma que la colección Interoperabilidad Prestadores).

| Método | Ruta |
|--------|------|
| `POST` | `/RdaConsultaExterna/IhceConsultarProfesional/sandbox` |
| `POST` | `/RdaConsultaExterna/IhceConsultarProfesional/produccion` |

### Cuerpo JSON (campos aceptados)

Obligatorios (cualquiera de los alias por par):

| Concepto | Nombres aceptados |
|----------|-------------------|
| Tipo documento profesional | `tipoDocumentoProfesional`, `tipoDocumento`, `tipoDocProfesional`, `tipo` |
| Número documento profesional | `numeroDocumentoProfesional`, `numeroDocumento`, `documentoProfesional`, `documento`, `numDocProfesional`, `numero` |

Opcional:

| Campo | Uso |
|--------|-----|
| `humanuser` o `humanUser` | Cadena `TIPO-NUMERO` del usuario humano que consulta (algunas versiones de la operación lo exigen). Si no se envía, no se incluye el parámetro en el `Parameters`. |

Ejemplo mínimo:

```json
{
  "tipoDocumento": "CC",
  "numeroDocumento": "1143131723"
}
```

Respuesta: JSON con `ok`, `status` (HTTP devuelto por IHCE), `ambiente`, `ihce_url`, `request_parameters` (payload enviado), `ihce_response` (cuerpo parseado o `raw` si no es JSON).

Si `IHCE_FORCE_SANDBOX_ONLY=true`, la ruta **producción** responde `403`.

---

## 5.3 Consultar organización (IHCE, solo `.env`)

`POST` **sin cuerpo JSON**. El backend arma el recurso **`Parameters`** para **`POST {IHCE_BASE}/Organization/$consultar-organizacion`** con valores leídos del `.env` (misma colección Interoperabilidad Prestadores).

| Método | Ruta |
|--------|------|
| `POST` | `/RdaConsultaExterna/IhceConsultarOrganizacion/sandbox` |
| `POST` | `/RdaConsultaExterna/IhceConsultarOrganizacion/produccion` |

La palabra completa es **`produccion`** (no `/produc`). Por compatibilidad, **`/produc`** también está registrado y ejecuta el mismo handler.

Las peticiones salientes (token Microsoft y POST FHIR) usan tiempo máximo por defecto **45 s**; se puede cambiar con **`IHCE_OUTBOUND_TIMEOUT_MS`** en `.env`. Si se agota, el backend responde **504** con `code: IHCE_OUTBOUND_TIMEOUT`.

### Variables usadas (en orden de preferencia)

Por ambiente, prefijo **`IHCE_SANDBOX_`** o **`IHCE_PROD_`**:

| Parámetro FHIR | Variable principal | Respaldo |
|----------------|-------------------|----------|
| `TaxIdentifier` (NIT) | `{pfx}CUSTODIAN_NIT` | `IHCE_RDACE_DEFAULT_NIT_IPS` |
| `HealthcareProviderIdentifier` (REPS / habilitación) | `{pfx}CUSTODIAN_REPS` | `IHCE_RDACE_DEFAULT_CODIGO_PRESTADOR` |
| `name` (razón social) | `{pfx}CUSTODIAN_NAME` | `IHCE_RDACE_DEFAULT_NOMBRE_IPS` |

En **`produccion`**, si un campo sigue vacío tras lo anterior, se intenta el equivalente **`IHCE_SANDBOX_CUSTODIAN_*`** solo para ese campo (mismo prestador sin duplicar variables `IHCE_PROD_CUSTODIAN_*`).

Solo se envían entradas **no vacías**. Debe existir **al menos un** criterio (NIT, REPS o nombre) entre las variables anteriores; si no, el backend responde **`400`** con mensaje indicando qué definir.

La URL FHIR coincide con la colección oficial: `{IHCE_*_BASE_URL}/Organization/$consultar-organizacion` (p. ej. base `https://www.ihcecol.gov.co/ihce` en prod). El **401** en Postman sin `Authorization: Bearer` y sin `Ocp-Apim-Subscription-Key` es esperado; el proxy del backend añade ambos.

Respuesta: JSON con `ok`, `status`, `ambiente`, `ihce_url`, `request_parameters`, `env_usado` (valores efectivos usados), `ihce_response`.

Si `IHCE_FORCE_SANDBOX_ONLY=true`, la ruta **producción** responde `403`.

---

## 6. Notas rápidas

- **Duplicados en IHCE:** Si reenvías el mismo encuentro (mismo paciente + periodo + prestador), IHCE puede responder `409` “already exist”.
- **JSON inválido:** Un `}` de más en el body produce `400` con error de `body-parser` antes de llegar al handler.
- **PDF epicrisis:** Hoy se usa un PDF mínimo en base64 en el `DocumentReference` EPI salvo que integren el archivo real desde BD.

Documento generado para el proyecto **NUEVO_RELACIONADOR** — revisar siempre el código fuente ante cambios futuros.

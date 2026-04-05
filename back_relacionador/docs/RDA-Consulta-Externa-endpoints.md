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

## 6. Notas rápidas

- **Duplicados en IHCE:** Si reenvías el mismo encuentro (mismo paciente + periodo + prestador), IHCE puede responder `409` “already exist”.
- **JSON inválido:** Un `}` de más en el body produce `400` con error de `body-parser` antes de llegar al handler.
- **PDF epicrisis:** Hoy se usa un PDF mínimo en base64 en el `DocumentReference` EPI salvo que integren el archivo real desde BD.

Documento generado para el proyecto **NUEVO_RELACIONADOR** — revisar siempre el código fuente ante cambios futuros.

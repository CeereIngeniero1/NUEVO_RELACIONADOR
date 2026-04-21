# RDA Consulta Externa (RDACE) — Flujo IHCE paso a paso

Guía ordenada para **probar y construir** la integración con IHCE (sandbox o producción): token OAuth, consultas previas recomendadas por interoperabilidad, **construcción del documento por secciones**, y envío final.

**Referencia técnica de rutas locales:** `docs/RDA-Consulta-Externa-endpoints.md`  
**Código del envío y del token en backend:** `server/routes/rda/RdaConsultaExternaRoutes.js` (handler `EnviarIHCE` y construcción `FhirBundle`).

**URL base API Relacionador (típico):** `http://localhost:3000/apiV3`  
(Ajustar host y puerto según `BACK_PORT` / `PORT` en tu entorno.)

---

## 0. Prerrequisitos

1. **Base de datos:** registro en `[Evaluacion Entidad RDA Consulta Externa]` y datos asociados según el alcance que vayas a probar.
2. **Variables de entorno** en `.env` del backend (o variables del proceso), según ambiente:

### Sandbox (nombres que resuelve el código)

| Variable | Rol |
|----------|-----|
| `IHCE_SANDBOX_BASE_URL` o `IHCE_API_BASE_URL` o `IHCE_BASE_URL` | URL base API FHIR IHCE (sin barra final recomendable). |
| `IHCE_SANDBOX_TENANT_ID` o `IHCE_TENANT_ID` | Tenant Azure AD. |
| `IHCE_SANDBOX_CLIENT_ID` o `IHCE_CLIENT_ID` | Client id de la app registrada. |
| `IHCE_SANDBOX_CLIENT_SECRET` o `IHCE_CLIENT_SECRET` | Secreto (solo servidor). |
| `IHCE_SANDBOX_SCOPE` o `IHCE_SCOPE` | Scope OAuth (p. ej. `api://…/.default`). |
| `IHCE_SANDBOX_SUBSCRIPTION_KEY` o `IHCE_APIM_SUBSCRIPTION_KEY` | Cabecera `Ocp-Apim-Subscription-Key` hacia APIM. |

### Producción

Prefijo **`IHCE_PROD_`** para las mismas ideas: `IHCE_PROD_BASE_URL`, `IHCE_PROD_TENANT_ID`, `IHCE_PROD_CLIENT_ID`, `IHCE_PROD_CLIENT_SECRET`, `IHCE_PROD_SCOPE`, `IHCE_PROD_SUBSCRIPTION_KEY`.

### Opcionales útiles para alinear bundle con lo que espera IHCE

- `IHCE_RDACE_DEFAULT_NIT_IPS`, `IHCE_RDACE_DEFAULT_NOMBRE_IPS`  
- `IHCE_FORCE_SANDBOX_ONLY=true` — evita usar prod aunque el body pida `prod`.  
- `IHCE_RDACE_OMIT_ALLERGY_INTOLERANCE=true` — workaround validador alergias (ver endpoint doc).

---

## Paso 1 — Solicitar el token OAuth (client credentials)

IHCE usa **Microsoft Entra ID**. El token **no** se obtiene desde una ruta inventada del Relacionador: es el endpoint estándar de Azure.

### 1.1 URL del token

```http
POST https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
```

Sustituir `{TENANT_ID}` por el GUID del directorio (mismo valor que `IHCE_SANDBOX_TENANT_ID` o `IHCE_PROD_TENANT_ID`).

### 1.2 Cuerpo (Postman / Insomnia)

- Tipo: **`x-www-form-urlencoded`** (no JSON).
- Campos:

| Campo | Valor |
|--------|--------|
| `grant_type` | `client_credentials` |
| `client_id` | El de tu `.env` (`IHCE_*_CLIENT_ID`). |
| `client_secret` | El de tu `.env` (`IHCE_*_CLIENT_SECRET`). |
| `scope` | El de tu `.env` (`IHCE_*_SCOPE`). |

### 1.3 Respuesta esperada

- HTTP **200** y JSON con `access_token` (y normalmente `expires_in`).
- Copiar **`access_token`** para los pasos 2 y 4 (cabecera `Authorization: Bearer …`).

### 1.4 Opcional — mismo token desde el backend Relacionador

Si el `.env` ya tiene las variables IHCE, puedes probar sin Postman a Microsoft:

- Sandbox: `POST http://localhost:3000/apiV3/RdaConsultaExterna/IhceToken/sandbox` (sin body).
- Producción: `POST http://localhost:3000/apiV3/RdaConsultaExterna/IhceToken/produccion` (sin body; bloqueado si `IHCE_FORCE_SANDBOX_ONLY=true`).

Implementación: `server/routes/rda/RdaConsultaExternaRoutesv2.js`.

### 1.5 Misma lógica en el backend

En `RdaConsultaExternaRoutes.js` el envío a IHCE arma exactamente esta petición:

- `tokenUrl = https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
- Cuerpo: `URLSearchParams` con `grant_type`, `client_id`, `client_secret`, `scope`.

Si Postman falla pero el backend funciona (o al revés), compara **mismo tenant, client_id, scope y ambiente** (sandbox vs prod).

---

## Paso 2 — Consultar organización (recomendado antes del envío)

Sirve para validar que el **token**, la **subscription key** y la **URL base** son correctos frente a la operación de organización que expone la API de interoperabilidad (nombre exacto según guía MinSalud / colección Postman oficial).

### 2.1 Patrón habitual (FHIR)

Muchas implementaciones exponen una operación tipo:

```http
POST {IHCE_BASE_URL}/Organization/$consultar-organizacion
```

- **Headers:**  
  - `Authorization: Bearer {access_token}`  
  - `Ocp-Apim-Subscription-Key: {subscription_key}`  
  - `Content-Type: application/fhir+json`  
  - `Accept: application/fhir+json`

- **Body:** parámetros según **esquema de la operación** en la documentación o colección Postman que use tu proyecto (tipo documento, REPS, NIT, etc.).

> Si tu colección usa otra ruta literal (p. ej. variante de mayúsculas o nombre en español), **sigue la colección vigente**; el importante es el mismo `BASE_URL`, token y key que usarás en el paso 4.

### 2.2 Proxy en el Relacionador (sin body: todo desde `.env`)

Si ya tienes `IHCE_SANDBOX_*` / `IHCE_PROD_*` y los datos de prestador (`IHCE_*_CUSTODIAN_*` o `IHCE_RDACE_DEFAULT_*`), puedes probar la misma operación sin armar el JSON a mano:

- Sandbox: `POST http://localhost:3000/apiV3/RdaConsultaExterna/IhceConsultarOrganizacion/sandbox` (sin body).
- Producción: `POST .../IhceConsultarOrganizacion/produccion` (sin body; bloqueado si `IHCE_FORCE_SANDBOX_ONLY=true`).

Variables que alimentan el `Parameters`: ver `RDA-Consulta-Externa-endpoints.md` §5.3. Implementación: `server/routes/rda/RdaConsultaExternaRoutesv2.js`.

### 2.3 Criterio de éxito

- Respuesta **2xx** con recurso `Organization` o `Bundle` / `Parameters` según defina la operación.
- Si aquí obtienes **401/403**, corrige token, scope o key antes de construir el RDA consulta externa.

---

## Paso 3 — Consultar profesional de la salud (recomendado)

Misma idea: operación FHIR de **Practitioner** para verificar identidad del profesional que luego debe ser coherente con el `Practitioner` del bundle RDACE.

### 3.1 Patrón habitual

```http
POST {IHCE_BASE_URL}/Practitioner/$consultar-profesional-salud
```

(El segmento exacto puede variar según versión de la API; alinear con **Interop / Prestadores** MinSalud.)

**Proxy en el Relacionador (mismo `.env` que el token):**

- Sandbox: `POST http://localhost:3000/apiV3/RdaConsultaExterna/IhceConsultarProfesional/sandbox`  
  Body JSON: `{ "tipoDocumento": "CC", "numeroDocumento": "1143131723" }` (ver alias en `RDA-Consulta-Externa-endpoints.md` §5.2).
- Producción: `POST .../IhceConsultarProfesional/produccion` (bloqueado si `IHCE_FORCE_SANDBOX_ONLY=true`).

### 3.2 Headers

Igual que en el paso 2: `Authorization`, `Ocp-Apim-Subscription-Key`, `Content-Type` / `Accept` FHIR JSON.

### 3.3 Criterio de éxito

Datos del profesional alineados con lo que guardas en RDACE (`Tipo Doc Profesional`, `Num Doc Profesional`, etc.) para reducir rechazos en `$enviar-rda-consulta`.

---

## Paso 4 — Construir el RDA consulta externa **sección por sección** (antes de enviar)

**Plan detallado (tabla por LOINC, checklist, roadmap):** `RDA-CE-Plan-Construccion-JSON-Secciones.md`.

Objetivo: validar cada bloque del **Composition** (guía RDA Consulta Externa / Vulcano) contra datos de BD y reglas FHIR, **sin** llamar aún a IHCE con el envío final.

### 4.1 Orden sugerido de trabajo (alineado con el documento clínico)

| Orden | Sección (título típico en Composition) | LOINC (referencia) | Notas |
|------|----------------------------------------|--------------------|--------|
| 1 | Entidad(es) responsable(s) por el plan de beneficios (consulta) | 48768-6 | EAPB / pagador desde cabecera RDACE. |
| 2 | Otros datos demográficos | 74208-0 | Patient, ocupación/extensiones según IG. |
| 3 | Datos incapacidad (SIPE) | 105583-9 | Observation / alcance y días si aplica. |
| 4 | Historial de medicamentos | 10160-0 | `MedicationRequest` según prescripciones. |
| 5 | Alergias | 48765-2 | Política de omisión vs `emptyReason` (ver `.env` workaround). |
| 6 | Diagnósticos | 11450-4 | Principal + relacionados. |
| 7 | Factores de riesgo | 75492-9 | |
| 8 | Órdenes / prescripciones / solicitudes | 61146-1 | CUPS / otras tecnologías; la IG suele exigir al menos una entrada. |
| 9 | Documentos de soporte (epicrisis) | 55107-7 + DocumentReference | PDF / adjunto según perfil. |

En cada paso: revisar datos en SQL, reglas de negocio y el recurso FHIR que corresponda en el bundle generado localmente.

### 4.2 Cómo ver el bundle completo en local (sin IHCE)

```http
POST {API_BASE}/apiV3/RdaConsultaExterna/FhirBundle
Content-Type: application/json
```

```json
{
  "IdEvaluacionEntidadRDACE": 1,
  "overrideNitPrestadorIPS": "…",
  "overrideNombrePrestadorIPS": "…"
}
```

- Devuelve el **Bundle** `document` tal como lo arma el backend desde BD.
- Úsalo para revisar **sección por sección** en el `Composition.section` y en los `entry` referenciados.

### 4.3 Cómo ver el mismo JSON que se enviaría a IHCE (sin enviar)

```http
POST {API_BASE}/apiV3/RdaConsultaExterna/JsonEnviarIHCE
```

Mismo cuerpo que `EnviarIHCE` (incluido `"ambiente": "sandbox"` o `"prod"`). El backend construye el bundle, **normaliza** reglas IHCE y devuelve el JSON (útil para diff contra validaciones).

Cuando en futuras iteraciones existan rutas **Debug** por sección, se documentarán aquí o en `RDA-Consulta-Externa-endpoints.md`.

---

## Paso 5 — Enviar RDA consulta externa a IHCE

Cuando las secciones y el PDF/documento de soporte estén validados en los pasos anteriores:

```http
POST {API_BASE}/apiV3/RdaConsultaExterna/EnviarIHCE
Content-Type: application/json
```

```json
{
  "IdEvaluacionEntidadRDACE": 1,
  "ambiente": "sandbox",
  "incluirAllergyIntolerance": false
}
```

### 5.1 Qué hace el backend (resumen)

1. Carga credenciales según `ambiente` (`IHCE_SANDBOX_*` vs `IHCE_PROD_*`).
2. Construye y normaliza el **Bundle** (equivalente al flujo de `JsonEnviarIHCE`).
3. **Paso 1 de esta guía por dentro:** `POST` a `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`.
4. **Envío:** `POST {IHCE_BASE_URL}/Composition/$enviar-rda-consulta` con:
   - `Authorization: Bearer {access_token}`
   - `Ocp-Apim-Subscription-Key: {subscription_key}`
   - Cuerpo: el Bundle `application/fhir+json`

5. Si IHCE responde **2xx**, marca en BD `Enviado` o `Enviado pruebas` según ambiente.

### 5.2 Respuesta

- En éxito: cuerpo y **código HTTP** devueltos por IHCE (p. ej. `Bundle` transaction-response).
- En fallos previos (token, configuración): JSON `{ "ok": false, "error": "…" }` con `502` / `500` según caso.

---

## Checklist rápido antes del primer envío real

- [ ] Token OAuth 200 en Postman con los mismos valores que `.env`.
- [ ] Consulta organización OK con ese token y `Ocp-Apim-Subscription-Key`.
- [ ] Consulta profesional OK y datos alineados con la evaluación RDACE.
- [ ] `JsonEnviarIHCE` revisado sección por sección (sin error 500 local).
- [ ] PDF / `DocumentReference` cumple reglas del validador (tamaño, `format`, etc.).
- [ ] Decisión explícita `sandbox` vs `prod` y, si aplica, `IHCE_FORCE_SANDBOX_ONLY`.

---

## Siguiente documentación

- Ir completando **una fila por sección** en una tabla “sección → datos BD → recurso FHIR → probado sandbox S/N”.
- Cuando se añadan endpoints de depuración por LOINC en el repo, enlazarlos desde la tabla del paso 4.1.

---

*Documento generado para retomar el flujo RDACE/IHCE tras alinear el repositorio con `main`; actualizar rutas si MinSalud publica nueva versión de la API.*

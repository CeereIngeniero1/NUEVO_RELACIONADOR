# RDA Login - Guia de pruebas

Fecha: 2026-04-22  
Archivo de rutas: `server/routes/rda/RdaLoginRoutes.js`  
Servicio compartido: `server/rda/ihceInteropService.js`

## Objetivo

Validar los endpoints centralizados de:

- Token IHCE
- Consulta de profesional de salud
- Consulta de organizacion

Esto permite que tanto `RdaConsultaExternaRoutesV2` como `RdaPacienteRoutes` usen la misma logica y evitar codigo duplicado.

## Base URL

- Local: `http://localhost:3000/apiV3`

## Endpoints disponibles

### 1) Token sandbox

- Endpoint: `POST /RdaLogin/IhceToken/sandbox`
- URL completa: `http://localhost:3000/apiV3/RdaLogin/IhceToken/sandbox`
- Body: vacio (`{}`)

Respuesta esperada (resumen):

- `ok: true`
- `ambiente: "sandbox"`
- `access_token` con valor

### 2) Token produccion

- Endpoint: `POST /RdaLogin/IhceToken/produccion`
- URL completa: `http://localhost:3000/apiV3/RdaLogin/IhceToken/produccion`
- Body: vacio (`{}`)

Respuesta esperada:

- `ok: true` y `access_token`

Nota importante:

- Si `IHCE_FORCE_SANDBOX_ONLY=true`, responde `403` con `code: "IHCE_FORCE_SANDBOX_ONLY"` (comportamiento esperado por seguridad).

### 3) Consultar profesional sandbox

- Endpoint: `POST /RdaLogin/IhceConsultarProfesional/sandbox`
- URL completa: `http://localhost:3000/apiV3/RdaLogin/IhceConsultarProfesional/sandbox`

Body minimo recomendado:

```json
{
  "tipoDocumentoProfesional": "CC",
  "numeroDocumentoProfesional": "71733864"
}
```

Tambien soporta (alias):

- `tipoDocumento`, `tipoDocProfesional`, `tipo`
- `numeroDocumento`, `documentoProfesional`, `documento`, `numDocProfesional`, `numero`
- `humanuser` (opcional)

Respuesta esperada (resumen):

- `ok: true` (si IHCE responde 2xx)
- `status`
- `ihce_response` con el resultado de la operacion FHIR

### 4) Consultar profesional produccion

- Endpoint: `POST /RdaLogin/IhceConsultarProfesional/produccion`
- URL completa: `http://localhost:3000/apiV3/RdaLogin/IhceConsultarProfesional/produccion`
- Body: igual al de sandbox

Nota:

- Si `IHCE_FORCE_SANDBOX_ONLY=true`, responde `403` (esperado).

### 5) Consultar organizacion sandbox

- Endpoint: `POST /RdaLogin/IhceConsultarOrganizacion/sandbox`
- URL completa: `http://localhost:3000/apiV3/RdaLogin/IhceConsultarOrganizacion/sandbox`
- Body: vacio (`{}`)

La operacion usa datos desde `.env`:

- `IHCE_SANDBOX_CUSTODIAN_NIT`
- `IHCE_SANDBOX_CUSTODIAN_REPS`
- `IHCE_SANDBOX_CUSTODIAN_NAME`

Fallback soportado:

- `IHCE_RDACE_DEFAULT_NIT_IPS`
- `IHCE_RDACE_DEFAULT_CODIGO_PRESTADOR`
- `IHCE_RDACE_DEFAULT_NOMBRE_IPS`

Respuesta esperada:

- `ok: true` (si IHCE responde 2xx)
- `env_usado` con los parametros enviados
- `ihce_response` con la respuesta IHCE

### 6) Consultar organizacion produccion

- Endpoint: `POST /RdaLogin/IhceConsultarOrganizacion/produccion`
- URL completa: `http://localhost:3000/apiV3/RdaLogin/IhceConsultarOrganizacion/produccion`
- Body: vacio (`{}`)

Variables esperadas:

- `IHCE_PROD_CUSTODIAN_NIT`
- `IHCE_PROD_CUSTODIAN_REPS`
- `IHCE_PROD_CUSTODIAN_NAME`

Nota:

- Si `IHCE_FORCE_SANDBOX_ONLY=true`, responde `403` (esperado).

## Checklist rapido de validacion

- Token sandbox retorna `access_token`.
- Consulta profesional sandbox retorna `status` y `ihce_response`.
- Consulta organizacion sandbox retorna `env_usado` e `ihce_response`.
- Produccion respeta bloqueo cuando `IHCE_FORCE_SANDBOX_ONLY=true`.
- Los mismos resultados son consumibles desde:
  - `RdaConsultaExternaRoutesV2`
  - `RdaPacienteRoutes`

## Errores comunes y diagnostico

- `IHCE_ENV_INCOMPLETO`: faltan variables de token (`TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`, `SCOPE`).
- `IHCE_CONFIG_INCOMPLETA`: falta `BASE_URL` o `SUBSCRIPTION_KEY`.
- `ORG_ENV_INCOMPLETO`: faltan variables de custodio para consulta de organizacion.
- `TOKEN_IHCE_ERROR`: error de Entra/Azure al pedir token (ejemplo: tenant incorrecto).
- `IHCE_OUTBOUND_TIMEOUT`: timeout de red; revisar conectividad o aumentar `IHCE_OUTBOUND_TIMEOUT_MS`.

## Recomendacion final

Mantener todos los cambios de autenticacion y consultas IHCE dentro de `ihceInteropService.js`.  
Asi se preserva una sola fuente de verdad para RDA Paciente y RDA Consulta Externa.


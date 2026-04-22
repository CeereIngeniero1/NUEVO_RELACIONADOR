# RDA Login - Postman rapido (6 requests)

## 1) Crea estas variables en Postman Environment

- `baseUrl` = `http://localhost:3000/apiV3`
- `tipoDocProfesional` = `CC`
- `numDocProfesional` = `71733864`

## 2) Requests (copiar y pegar)

### Request 1 - Token Sandbox

- Method: `POST`
- URL: `{{baseUrl}}/RdaLogin/IhceToken/sandbox`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):

```json
{}
```

### Request 2 - Token Produccion

- Method: `POST`
- URL: `{{baseUrl}}/RdaLogin/IhceToken/produccion`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):

```json
{}
```

### Request 3 - Consultar Profesional Sandbox

- Method: `POST`
- URL: `{{baseUrl}}/RdaLogin/IhceConsultarProfesional/sandbox`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):

```json
{
  "tipoDocumentoProfesional": "{{tipoDocProfesional}}",
  "numeroDocumentoProfesional": "{{numDocProfesional}}"
}
```

### Request 4 - Consultar Profesional Produccion

- Method: `POST`
- URL: `{{baseUrl}}/RdaLogin/IhceConsultarProfesional/produccion`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):

```json
{
  "tipoDocumentoProfesional": "{{tipoDocProfesional}}",
  "numeroDocumentoProfesional": "{{numDocProfesional}}"
}
```

### Request 5 - Consultar Organizacion Sandbox

- Method: `POST`
- URL: `{{baseUrl}}/RdaLogin/IhceConsultarOrganizacion/sandbox`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):

```json
{}
```

### Request 6 - Consultar Organizacion Produccion

- Method: `POST`
- URL: `{{baseUrl}}/RdaLogin/IhceConsultarOrganizacion/produccion`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):

```json
{}
```

## 3) Validaciones rapidas esperadas

- En Token Sandbox: `ok=true` y `access_token` presente.
- En Consultar Profesional: respuesta con `status`, `ihce_url` y `ihce_response`.
- En Consultar Organizacion: respuesta con `env_usado` y `ihce_response`.

## 4) Nota de seguridad

Si tienes `IHCE_FORCE_SANDBOX_ONLY=true`, las rutas de produccion deben responder `403` con `code: "IHCE_FORCE_SANDBOX_ONLY"` (esto es correcto).


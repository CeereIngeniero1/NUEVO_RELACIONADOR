# RDA V2 - Contratos, feature flag y compatibilidad

Fecha: 2026-04-24

## Feature flag: versionado de API RDA (frontend)

El frontend resuelve la variante con:

1. `localStorage.setItem('RDA_API_VERSION', 'v2' | 'legacy')` (tiene prioridad)
2. `window.__APP_CONFIG__.RDA_API_VERSION` (inyectado vía `config` del backend si aplica)
3. Valor por defecto: `legacy` (migración segura; activar `v2` en pilotaje)

Código: `front_relacionador/public/rda/api/rdaConfig.js`

## Comportamiento por modo

| Acción | `legacy` | `v2` |
|--------|----------|------|
| Envío IHCE RDA Paciente | `POST /apiV3/RdaPaciente/EnviarIHCE` | `POST /apiV3/RdaPacienteV2/EnviarIhceSandboxV2` o `.../EnviarIhceProduccionV2` |
| Envío IHCE RDACE | `POST /apiV3/RdaConsultaExterna/EnviarIHCE` | `POST /apiV3/RdaConsultaExterna/EnviarIhceSandboxV2` o `.../EnviarIhceProduccionV2` |
| Preview "JSON / Bundle" enviado (modal) | `JsonEnviarIHCE` (paciente/CE) | Mismo (alineado con el Bundle FHIR generado en backend) |
| Construcción secciones (debug) | vía endpoints sueltos o legacy | `RdaPacienteV2/JsonCompleto` (opcional) |

**Nota:** En modo `v2` el envío de Paciente aplica validación estricta en backend (`JsonCompletoEstricto` interno) antes de delegar a `RdaPaciente/EnviarIHCEModular`, por lo que puede fallar con `RDA_PACIENTE_SIN_CONTENIDO_CLINICO` si no hay datos clínicos.

## Contratos mínimos (cuerpos)

### Guardar (sin cambio de ruta)
- `POST /apiV3/EvaluacionEntidadRDA/` y subrecursos `.../AntecedentesSalud`, etc.
- `POST /apiV3/EvaluacionEntidadRDACE/` y subrecursos equivalentes

### Rda Paciente V2 (solo lectura / envío)
- `POST /apiV3/RdaPacienteV2/JsonCompleto` body: `{ "IdEvaluacionEntidadRDA": number }`
- `POST /apiV3/RdaPacienteV2/JsonCompletoEstricto` — falla 400 sin contenido clínico
- `POST /apiV3/RdaPacienteV2/EnviarIhceSandboxV2` / `EnviarIhceProduccionV2` body: `{ "IdEvaluacionEntidadRDA": number }`

### RDA CE V2
- `POST /apiV3/RdaConsultaExterna/JsonCompleto` / `JsonCompletoEstricto`
- `POST /apiV3/RdaConsultaExterna/EnviarIhceSandboxV2` / `EnviarIhceProduccionV2` body: `{ "IdEvaluacionEntidadRDACE": number }`

### Auth
Todas las peticiones `fetch` desde módulos RDA usan `Authorization: <token>` si `localStorage.token` existe, más `Content-Type: application/json`.

## Rollback
- Poner `RDA_API_VERSION=legacy` en `localStorage` o `__APP_CONFIG__` y recargar.

## Envío masivo (`RdaEnvioMasivo/*`)

El listado y la UI (`EnvioRdaPendientes.js`) no cambian de ruta. El **servidor** decide si cada envío en lote usa las mismas rutas legacy o V2:

| Variable de entorno | Comportamiento |
|---------------------|----------------|
| `RDA_ENVIO_MASIVO_VERSION` omitida o `legacy` | `POST` interno a `/RdaPaciente/EnviarIHCE` y `/RdaConsultaExterna/EnviarIHCE` (cuerpo con `ambiente`) |
| `RDA_ENVIO_MASIVO_VERSION=v2` | `POST` interno a `RdaPacienteV2/EnviarIhceSandboxV2` o `...ProduccionV2` y análogo para CE |

**Rollback masivo:** quitar la variable o poner `legacy` y reiniciar el backend.

**Preview "Ver JSON enviado"** en la pantalla masiva sigue usando `JsonEnviarIHCE` (mismo criterio que `Asignar` y el documento de preview arriba).

## Referencia backend
- `back_relacionador/server/routes/rda/RdaPacienteRoutesV2.js`
- `back_relacionador/server/routes/rda/RdaConsultaExternaRoutesV2.js`
- `back_relacionador/server/rda/ihceInteropService.js`

# RDA - Campos obligatorios y opcionales (envio IHCE)

Fecha: 2026-04-22

Este documento resume el criterio operativo implementado en backend para:
- `RdaPaciente/EnviarIHCE` (incluye variantes `JsonEnviar*` y `*Modular`)
- `RdaConsultaExterna/EnviarIHCE` (incluye variantes `JsonEnviar*` y `*Modular`)

## Regla general

- `Preview JSON` (`JsonEnviar*`, `BundlePayload*`, `PayloadPara*`): permite depurar estructura sin bloquear por obligatorios de envio real.
- `Envio real IHCE` (`EnviarIHCE*`): valida obligatorios y bloquea con `400` si faltan (si `RDA_STRICT_REQUIRED_FIELDS=true`).
- Campos opcionales: si vienen vacios o invalidos en estructura, se omiten/sanean (no se inventan valores).

### Flag de control para pruebas internas

- `RDA_STRICT_REQUIRED_FIELDS=true` (default): bloquea envio real cuando faltan obligatorios.
- `RDA_STRICT_REQUIRED_FIELDS=false`: no bloquea por obligatorios (se recomienda solo en QA/interno).
- `RDACE_STRUCTURAL_FALLBACK=true` (temporal QA): en CE completa mínimos técnicos de cardinalidad
  (`Condition` principal fallback, `Encounter.type` modalidad/entorno fallback) para probar estructura.

## RDA Paciente

### Obligatorios para envio real

- `Bundle.entry` presente.
- Recurso `Composition` presente.
- Recurso `Patient` presente.
- `Patient.id` con patron `TipoDocumento-NumeroDocumento` (ej: `CC-123456`).
- `Composition.subject.reference` presente.
- `Composition.custodian.reference` presente.
- `ExtensionPatientEthnicity` presente en `Patient.extension`:
  - con `valueCoding.code` no vacio,
  - y distinto de `7` / "Sin asignar".
- El `custodian` de `Composition` debe apuntar a una `Organization` existente dentro del mismo `Bundle`.

### Opcionales (se sanean)

- `Patient.telecom` sin `value` se elimina.
- `Patient.address` vacias (sin ciudad/pais/extension) se eliminan.
- `Patient.extension` opcionales vacias:
  - extensiones con `valueString` vacio se eliminan,
  - extensiones con `valueCoding.code` vacio se eliminan.
- `ExtensionPatientEthnicCommunity` solo viaja si hay valor real.

## RDA Consulta Externa

### Obligatorios para envio real

- `Bundle.entry` presente.
- Recurso `Composition` presente.
- Recurso `Patient` presente.
- `Patient.id` con patron `TipoDocumento-NumeroDocumento` (ej: `CC-123456`).
- `Composition.subject.reference` presente.
- `Composition.custodian.reference` presente.
- `ExtensionPatientEthnicity` presente en `Patient.extension`:
  - con `valueCoding.code` no vacio,
  - y distinto de `7` / "Sin asignar".
- El `custodian` de `Composition` debe apuntar a una `Organization` existente dentro del mismo `Bundle`.

### Opcionales (se sanean)

- `Patient.telecom` sin `value` se elimina.
- `Patient.address` vacias (sin ciudad/pais/extension) se eliminan.
- `Patient.extension` opcionales vacias:
  - extensiones con `valueString` vacio se eliminan,
  - extensiones con `valueCoding.code` vacio se eliminan.
- `ExtensionPatientEthnicCommunity` solo viaja si hay valor real.

## Mensajes de error implementados

- Paciente: `RDA_PACIENTE_VALIDACION_OBLIGATORIOS`
- Consulta Externa: `RDACE_VALIDACION_OBLIGATORIOS`

Con el detalle exacto de que campo/condicion faltante impide el envio.

## Payload minimo de prueba (envio real)

Estos ejemplos son para invocar endpoints de envio; el bundle interno se construye en backend.

### RDA Paciente

Endpoint: `POST /apiV3/RdaPaciente/EnviarIHCE`

```json
{
  "IdEvaluacionEntidadRDA": 12345,
  "ambiente": "prod"
}
```

Notas:
- El registro `IdEvaluacionEntidadRDA` debe tener paciente y cabecera validos.
- Etnia no puede estar vacia ni en "Sin asignar".

### RDA Consulta Externa

Endpoint: `POST /apiV3/RdaConsultaExterna/EnviarIHCE`

```json
{
  "IdEvaluacionEntidadRDACE": 67890,
  "ambiente": "prod"
}
```

Notas:
- El registro `IdEvaluacionEntidadRDACE` debe tener datos minimos validos para construir el bundle.
- Etnia no puede estar vacia ni en "Sin asignar".

### Preview tecnico (sin enviar a IHCE)

- Paciente: `POST /apiV3/RdaPaciente/JsonEnviarIHCE`
- CE: `POST /apiV3/RdaConsultaExterna/JsonEnviarIHCE`

Usan el mismo body de ejemplo cambiando solo el `Id...`.

## Payload minimo de prueba (rutas V2)

En V2 el ambiente se define por la ruta; el body solo lleva el id.

### Paciente V2

- Sandbox: `POST /apiV3/RdaPacienteV2/EnviarIhceSandboxV2`
- Produccion: `POST /apiV3/RdaPacienteV2/EnviarIhceProduccionV2`

```json
{
  "IdEvaluacionEntidadRDA": 12345
}
```

### Consulta Externa V2

- Sandbox: `POST /apiV3/RdaConsultaExterna/EnviarIhceSandboxV2`
- Produccion: `POST /apiV3/RdaConsultaExterna/EnviarIhceProduccionV2`

```json
{
  "IdEvaluacionEntidadRDACE": 67890
}
```

Notas V2:
- Tambien aplican las validaciones de obligatorios de datos clinicos.
- Si esta activo `IHCE_FORCE_PROD_ONLY=true`, solo se permite produccion.
- Si esta activo `IHCE_FORCE_SANDBOX_ONLY=true`, solo se permite sandbox.

# RDA Consulta Externa V2 - Avance por secciones

Fecha: 2026-04-22  
Archivo de trabajo principal: `server/routes/rda/RdaConsultaExternaRoutesV2.js`

## Objetivo de este avance

Se construyo el flujo de RDA Consulta Externa por secciones, endpoint por endpoint, para validar estructura y datos de forma incremental antes del ensamblado final del Bundle completo.

## Endpoints implementados (seccion por seccion)

Todos los endpoints reciben como base:

```json
{
  "IdEvaluacionEntidadRDACE": 27
}
```

### Seccion 1 - EAPB (`48768-6`)

- Endpoint: `POST /apiV3/RdaConsultaExterna/Seccion1EAPB`
- Resultado: OK
- Comportamiento:
  - Si hay EAPB (codigo/nombre), crea `Organization` y referencia en `section.entry`.
  - Si no hay datos, devuelve `emptyReason`.

Observacion:
- Estructura y referencia `#id` validada correctamente.

### Seccion 2 - Otros datos demograficos (`74208-0`)

- Endpoint: `POST /apiV3/RdaConsultaExterna/Seccion2OtrosDemograficos`
- Resultado: OK
- Comportamiento:
  - Busca ocupacion en `Cnsta Relacionador Usuarios Info` a partir de `Documento Entidad`.
  - Si encuentra, crea `Observation` (`PatientOccupationAtEncounterRDA`) y la agrega en `entry`.
  - Si no encuentra, devuelve `emptyReason`.

Observacion:
- Quedo ajustado para funcionar con solo `IdEvaluacionEntidadRDACE`.

### Seccion 3 - Incapacidad SIPE (`105583-9`)

- Endpoint: `POST /apiV3/RdaConsultaExterna/Seccion3IncapacidadSIPE`
- Resultado: OK
- Comportamiento:
  - Construye `Observation` (`AttendanceAllowanceRDA`) con alcance/dias cuando hay datos.
  - Si no hay datos, devuelve `emptyReason`.

Observaciones:
- Estructura correcta.
- Recomendado mapear `AlcanceIncapacidad` a display descriptivo de catalogo (evitar texto "03" como display final).

### Seccion 4 - Diagnosticos (`11450-4`)

- Endpoint: `POST /apiV3/RdaConsultaExterna/Seccion4Diagnosticos`
- Resultado: OK
- Comportamiento:
  - Incluye diagnostico principal y diagnosticos relacionados activos como `Condition`.
  - Si no hay diagnosticos, devuelve `emptyReason`.

Observacion:
- Detectado posible duplicado entre principal y relacionado con mismo codigo.
- Recomendado deduplicar por `system+code`.

### Seccion 5 - Alergias (`48765-2`)

- Endpoint: `POST /apiV3/RdaConsultaExterna/Seccion5Alergias`
- Resultado: OK
- Comportamiento:
  - Si hay `Tipo Alergia`, crea `AllergyIntolerance`.
  - Si no hay dato, devuelve `emptyReason`.

Observaciones:
- Se agrego comentario en codigo sobre calidad de dato.
- Recomendado enviar `display/text` descriptivo del catalogo TipoAlergia (no dejar solo "06", "03", etc.).

### Seccion 6 - Factores de riesgo (`75492-9`)

- Endpoint: `POST /apiV3/RdaConsultaExterna/Seccion6FactoresRiesgo`
- Resultado: OK
- Comportamiento:
  - Si hay tipo/nombre de riesgo, construye `RiskAssessment` (`RiskFactorRDA`).
  - Si no hay datos, devuelve `emptyReason`.

Observacion:
- Correcta consistencia entre `code.display` y `code.text`.

### Seccion 7 - Medicamentos (`10160-0`)

- Endpoint: `POST /apiV3/RdaConsultaExterna/Seccion7Medicamentos`
- Resultado: OK
- Comportamiento:
  - Lee prescripciones activas de medicamentos y crea `MedicationRequest`.
  - Si no hay registros validos, devuelve `emptyReason`.

Observaciones:
- Correcto para avance.
- Recomendado mejorar luego:
  - `route` codificada (no solo texto).
  - posible normalizacion de fecha/huso horario.

### Seccion 8 - Ordenes / solicitudes (`61146-1`)

- Endpoint: `POST /apiV3/RdaConsultaExterna/Seccion8OrdenesSolicitudes`
- Resultado: OK
- Comportamiento:
  - Construye `ServiceRequest` de procedimientos y otras tecnologias.
  - Si no hay datos, incluye placeholder para cumplir regla de minimo un `entry`.

Observacion:
- Cumple regla critica de IHCE para seccion `61146-1`.

### Seccion 9 - Documentos de soporte (`55107-7`)

- Endpoint: `POST /apiV3/RdaConsultaExterna/Seccion9DocumentosSoporte`
- Resultado: Estructuralmente OK
- Comportamiento:
  - Siempre devuelve seccion con `entry` a `DocumentReference-0`.
  - Intenta usar PDF desde BD (`Contenido Documento PDF`) o `body.pdfBase64`.

Observacion critica:
- Actualmente se obtuvo `DocumentReference` sin `attachment.data` en algunas pruebas.
- Para validacion estructural local puede pasar, pero para envio real a IHCE es alto riesgo de rechazo.

## Regla clave discutida: secciones obligatorias

- En el `Composition` deben ir todas las secciones.
- Cuando no hay informacion clinica de una seccion, se debe enviar con `emptyReason` + `text`.
- Excepciones operativas criticas:
  - `61146-1`: debe tener al menos un `entry`.
  - `55107-7`: debe tener `entry` a `DocumentReference`.

## Comentarios de implementacion agregados

Se dejaron comentarios en el codigo para identificar:

- datos OBLIGATORIOS,
- datos OPCIONALES,
- recomendaciones de calidad para validador IHCE.

## Pendiente prioritario (IMPORTANTE)

Se debe buscar e implementar la forma definitiva de incluir el documento soporte PDF dentro del RDA:

- `DocumentReference.content[0].attachment.data` con base64 valido,
- `contentType = application/pdf`,
- metadata consistente (`title`, `format`, `description`).

Sin este punto, el envio real de la seccion 9 puede no ser aceptado por IHCE.

## Siguiente paso sugerido

1. Cerrar la fuente oficial del PDF (BD, servicio de generacion o carga por backend).  
2. Hacer validacion estricta en seccion 9 para no permitir salida sin `attachment.data` en modo envio real.  
3. Crear endpoint ensamblador de las 9 secciones para pruebas integradas del documento completo.

## Endpoints de envio final a IHCE (V2)

Se agregaron dos endpoints de envio final, ambos usando construccion estricta del bundle (requiere PDF de soporte):

- `POST /apiV3/RdaConsultaExterna/EnviarIhceSandboxV2`
- `POST /apiV3/RdaConsultaExterna/EnviarIhceProduccionV2`

Body minimo para ambos:

```json
{
  "IdEvaluacionEntidadRDACE": 27
}
```

Comportamiento:

- Construyen internamente `JsonCompletoEstricto`.
- Obtienen token del ambiente correspondiente.
- Envían a `Composition/$enviar-rda-consulta`.

Nota de seguridad importante:

- Si `IHCE_FORCE_SANDBOX_ONLY=true`, el endpoint de produccion responde `403` por proteccion operativa.


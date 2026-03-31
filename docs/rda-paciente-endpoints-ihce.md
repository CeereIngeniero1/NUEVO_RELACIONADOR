# RDA Paciente - Endpoints IHCE y JSON de parametros

Base local sugerida: `http://localhost:3000/apiV3`

## 1) Construccion de Bundle base (sin envio)

- Endpoint: `POST /RdaPaciente/FhirBundle`
- Uso: construir el Bundle RDA Paciente desde BD/UI.

JSON minimo:

```json
{
  "IdEvaluacionEntidadRDA": 4
}
```

JSON con overrides de prestador:

```json
{
  "IdEvaluacionEntidadRDA": 4,
  "overrideCodigoPrestador": "0500112124",
  "overrideNitPrestadorIPS": "900479959",
  "overrideNombrePrestadorIPS": "GRUPO MEDICO ESPECIALIZADO MEDELLIN S.A.S"
}
```

---

## 2) Envio IHCE estable (productivo actual)

- Endpoint recomendado: `POST /RdaPaciente/IHCE/EnviarPacienteAntecedentes`
- Alias legacy: `POST /RdaPaciente/EnviarIHCE`, `POST /RdaPaciente/EnviarIhce`
- Uso: envia a IHCE con normalizaciones de compatibilidad.

JSON minimo:

```json
{
  "IdEvaluacionEntidadRDA": 4,
  "ambiente": "sandbox"
}
```

JSON con overrides:

```json
{
  "IdEvaluacionEntidadRDA": 4,
  "ambiente": "sandbox",
  "overrideCodigoPrestador": "0500112124",
  "overrideNitPrestadorIPS": "900479959",
  "overrideNombrePrestadorIPS": "GRUPO MEDICO ESPECIALIZADO MEDELLIN S.A.S"
}
```

---

## 3) Preview exacto del JSON que se enviaria (sin enviar)

- Endpoint recomendado: `POST /RdaPaciente/IHCE/PreviewPacienteAntecedentes`
- Alias legacy: `POST /RdaPaciente/JsonEnviarIHCE`, `POST /RdaPaciente/JsonEnviarIhce`
- Uso: devuelve exactamente el Bundle final ya normalizado que se enviaria a IHCE.

JSON:

```json
{
  "IdEvaluacionEntidadRDA": 4,
  "ambiente": "sandbox"
}
```

---

## 4) Endpoint de pruebas por modulos (incremental)

Uso recomendado: trabajar con el endpoint modular (seccion 5), que permite activar/desactivar bloques por `true/false`.

Flags disponibles:

- `incluirConditionIngreso`
- `incluirConditions`
- `incluirFamilyHistory`
- `incluirAllergy`
- `incluirObservations`

JSON base:

```json
{
  "IdEvaluacionEntidadRDA": 4,
  "ambiente": "sandbox"
}
```

JSON incremental recomendado (estable):

```json
{
  "IdEvaluacionEntidadRDA": 4,
  "ambiente": "sandbox",
  "incluirConditionIngreso": true,
  "incluirConditions": true,
  "incluirFamilyHistory": true,
  "incluirAllergy": true
}
```

JSON todo en true (para pruebas):

```json
{
  "IdEvaluacionEntidadRDA": 4,
  "ambiente": "sandbox",
  "incluirConditionIngreso": true,
  "incluirConditions": true,
  "incluirFamilyHistory": true,
  "incluirAllergy": true,
  "incluirObservations": true
}
```

Nota: actualmente `incluirObservations: true` puede generar `BUNDLE-005` en IHCE para `Observation-Talla-0`.

---

## 5) Endpoint definitivo modular (depuracion y operacion)

- Endpoint recomendado: `POST /RdaPaciente/IHCE/EnviarPacienteAntecedentesModular`
- Alias legacy: `POST /RdaPaciente/EnviarIHCEModular`, `POST /RdaPaciente/EnviarIhceModular`
- Uso: misma idea modular del endpoint de prueba, pero como endpoint definitivo.

- Preview modular:
  - recomendado: `POST /RdaPaciente/IHCE/PreviewPacienteAntecedentesModular`
  - legacy: `POST /RdaPaciente/JsonEnviarIHCEModular`, `POST /RdaPaciente/JsonEnviarIhceModular`

JSON recomendado estable:

```json
{
  "IdEvaluacionEntidadRDA": 4,
  "ambiente": "sandbox",
  "incluirConditionIngreso": true,
  "incluirConditions": true,
  "incluirFamilyHistory": true,
  "incluirAllergy": true
}
```

JSON todo en true:

```json
{
  "IdEvaluacionEntidadRDA": 4,
  "ambiente": "sandbox",
  "incluirConditionIngreso": true,
  "incluirConditions": true,
  "incluirFamilyHistory": true,
  "incluirAllergy": true,
  "incluirObservations": true
}
```

---

## Resumen final de endpoints recomendados (4)

1. `POST /RdaPaciente/IHCE/EnviarPacienteAntecedentes`
2. `POST /RdaPaciente/IHCE/PreviewPacienteAntecedentes`
3. `POST /RdaPaciente/IHCE/EnviarPacienteAntecedentesModular`
4. `POST /RdaPaciente/IHCE/PreviewPacienteAntecedentesModular`

# Rutas RDA en backend (estructura modular)

## Objetivo

Las rutas de **RDA Paciente** y **RDA Consulta Externa** (Resolución 1888) ya no viven en un solo archivo enorme. Están en routers dedicados bajo `back_relacionador/server/routes/rda/`, montados desde `Asignar_RipsRoutes V3.js`, para facilitar mantenimiento y evolución sin seguir inflando el monolito.

## Montaje en Express

En `server.js` el router V3 se expone con el prefijo **`/apiV3`**:

```163:163:back_relacionador/server/server.js
app.use('/apiV3', AsignarRipsv3);
```

Al final de `Asignar_RipsRoutes V3.js` se registran los dos sub-routers RDA (orden: primero Paciente, luego Consulta Externa):

```2818:2821:back_relacionador/server/routes/Asignar_RipsRoutes V3.js
// --- RDA Paciente — rutas en archivo separado (rda/RdaPacienteRoutes.js) ---
router.use(require('./rda/RdaPacienteRoutes'));
// --- RDA Consulta Externa — rutas en archivo separado (rda/RdaConsultaExternaRoutes.js) ---
router.use(require('./rda/RdaConsultaExternaRoutes'));
```

**URL final**: prefijo `POST/GET https://<host>:<puerto>/apiV3` + ruta relativa del cuadro siguiente (por ejemplo `POST /apiV3/RdaPaciente/FhirBundle`).

## Dependencias compartidas

Ambos archivos usan el mismo pool SQL que el resto del backend:

- `require('../../db2')` → `sql`, `poolPromise`

No hay registro duplicado en `server.js`: solo se carga `Asignar_RipsRoutes V3.js` y este delega en los sub-routers.

---

## `rda/RdaPacienteRoutes.js`

Persistencia en `[Evaluacion Entidad RDA]` y tablas de antecedentes; construcción del Bundle FHIR tipo documento para **antecedentes del paciente**; envío/preview hacia IHCE.

| Método | Ruta relativa | Descripción |
|--------|---------------|-------------|
| POST | `/EvaluacionEntidadRDA/` | Inserta cabecera RDA Paciente |
| POST | `/EvaluacionEntidadRDA/AntecedentesSalud` | Antecedentes de salud |
| POST | `/EvaluacionEntidadRDA/AntecedentesFamiliares` | Antecedentes familiares |
| POST | `/EvaluacionEntidadRDA/AntecedentesFarmacologicos` | Antecedentes farmacológicos |
| POST | `/RdaPaciente/FhirBundle` | Genera Bundle FHIR desde BD (body: `IdEvaluacionEntidadRDA`, overrides opcionales de prestador) |

Las siguientes rutas comparten **un mismo handler** (variantes de nombre para compatibilidad con front u operaciones IHCE):

| POST (alias del mismo handler) |
|--------------------------------|
| `/RdaPaciente/EnviarIHCE`, `/RdaPaciente/EnviarIhce` |
| `/RdaPaciente/JsonEnviarIHCE`, `/RdaPaciente/JsonEnviarIhce` |
| `/RdaPaciente/IHCE/EnviarPacienteAntecedentes`, `/RdaPaciente/IHCE/PreviewPacienteAntecedentes` |
| `/RdaPaciente/EnviarIHCEModular`, `/RdaPaciente/EnviarIhceModular` |
| `/RdaPaciente/JsonEnviarIHCEModular`, `/RdaPaciente/JsonEnviarIhceModular` |
| `/RdaPaciente/IHCE/EnviarPacienteAntecedentesModular`, `/RdaPaciente/IHCE/PreviewPacienteAntecedentesModular` |

**IHCE**: operación documentada en el Manual de interoperabilidad — `POST .../Composition/$enviar-rda-paciente`. Variables de entorno (`IHCE_SANDBOX_*`, `IHCE_PROD_*`, etc.) se leen dentro de ese handler.

**Nota interna**: el envío a IHCE reconstruye el Bundle llamando por HTTP al propio servidor en `http://localhost:<PORT>/apiV3/RdaPaciente/FhirBundle` (mismo proceso).

**IG**: [RDA Paciente (Vulcano)](https://vulcano.ihcecol.gov.co/RDA-paciente.html)

---

## `rda/RdaConsultaExternaRoutes.js`

Persistencia en `[Evaluacion Entidad RDA Consulta Externa]` y tablas hijas; catálogos 1888 usados por el formulario; Bundle FHIR para **consulta externa**.

| Método | Ruta relativa | Descripción |
|--------|---------------|-------------|
| POST | `/EvaluacionEntidadRDACE/` | Cabecera RDACE |
| POST | `/EvaluacionEntidadRDACE/AntecedentesSalud` | Tabla hija |
| POST | `/EvaluacionEntidadRDACE/AntecedentesFamiliares` | Tabla hija |
| POST | `/EvaluacionEntidadRDACE/AntecedentesFarmacologicos` | Tabla hija |
| POST | `/EvaluacionEntidadRDACE/DiagnosticosRelacionados` | Tabla hija |
| POST | `/EvaluacionEntidadRDACE/PrescripcionMedicamentos` | Tabla hija |
| POST | `/EvaluacionEntidadRDACE/PrescripcionProcedimientos` | Tabla hija |
| POST | `/EvaluacionEntidadRDACE/OtrasTecnologias` | Tabla hija |
| GET | `/EgresoRemision` | Catálogo (query opcional `?q=`) |
| GET | `/FactorDeRiesgo` | Catálogo (`?q=` opcional) |
| GET | `/TipoTecnologiaEnSalud` | Catálogo (`?q=` opcional) |
| GET | `/Catalogo1888/:clave` | Catálogos whitelist (ver código: `EntornoAtencion`, `TipoAlergia`, etc.) |
| POST | `/RdaConsultaExterna/FhirBundle` | Bundle FHIR local (body: `IdEvaluacionEntidadRDACE`, overrides IPS opcionales) |

Las siguientes rutas comparten **un mismo handler** de envío/preview (variantes de nombre para compatibilidad):

| POST (alias del mismo handler) |
|--------------------------------|
| `/RdaConsultaExterna/EnviarIHCE`, `/RdaConsultaExterna/EnviarIhce` |
| `/RdaConsultaExterna/JsonEnviarIHCE`, `/RdaConsultaExterna/JsonEnviarIhce` |
| `/RdaConsultaExterna/EnviarIHCEModular`, `/RdaConsultaExterna/EnviarIhceModular` |
| `/RdaConsultaExterna/JsonEnviarIHCEModular`, `/RdaConsultaExterna/JsonEnviarIhceModular` |

**Operación IHCE**: `POST .../Composition/$enviar-rda-consulta` (Manual de interoperabilidad v1.2, punto 4). Usa las mismas variables de entorno `IHCE_SANDBOX_*` / `IHCE_PROD_*` que RDA Paciente.

**Normalización RDACE vs Paciente**: a diferencia de RDA Paciente (que elimina `Encounter`), la normalización de consulta externa **mantiene el `Encounter`** (obligatorio según IG). Los flags modular (`incluirConditions`, `incluirAllergyIntolerance`, `incluirRiskAssessment`, `incluirMedications`, `incluirServiceRequests`, `incluirObservations`) permiten enviar subconjuntos para depuración sandbox.

**Preview (sin enviar)**: usar `JsonEnviarIHCE` o `JsonEnviarIHCEModular`; devuelve exactamente el JSON normalizado que se enviaría.

Detalle del endpoint FhirBundle: [rda-consultaexterna-fhirbundle-endpoint.md](rda-consultaexterna-fhirbundle-endpoint.md).

**IG**: [RDA Consulta Externa (Vulcano)](https://vulcano.ihcecol.gov.co/RDA-consulta.html)

---

## Cómo añadir rutas nuevas

1. **RDA Paciente** → editar solo `RdaPacienteRoutes.js`.
2. **RDA Consulta Externa** → editar solo `RdaConsultaExternaRoutes.js`.
3. **Resto de API V3 (RIPS, etc.)** → `Asignar_RipsRoutes V3.js`.

No hace falta tocar `server.js` salvo que se cree un prefijo o router totalmente nuevo.

---

## Convención de nombres

- **RDA Paciente**: rutas bajo `EvaluacionEntidadRDA` (sin “CE”) y `RdaPaciente/*`.
- **RDA Consulta Externa**: rutas bajo `EvaluacionEntidadRDACE` y `RdaConsultaExterna/*`, más catálogos GET sin prefijo `Rda` que son específicos del flujo RDACE en la práctica actual del proyecto.

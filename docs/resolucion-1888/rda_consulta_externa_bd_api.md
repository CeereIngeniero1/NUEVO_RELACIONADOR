# RDA Consulta Externa — persistencia (SQL + API)

## Tablas

- **Incluido en** `back_relacionador/SQL/1888.sql` (bloque ~línea 985), justo después de las tablas de RDA paciente.
- **Script autocontenido (recomendado si solo quieres crear RDACE):** `back_relacionador/SQL/Evaluacion Entidad RDA Consulta Externa - CREATE.sql` (usa `IF OBJECT_ID ... IS NULL` por tabla).

El nombre en SQL Server es **`[Evaluacion Entidad RDA Consulta Externa]`** (mayúsculas/minúsculas no importan; es el equivalente a “Evaluacion Entidad RDA consulta externa”).

En `1888.sql`, el bloque queda después de `[Evaluacion Entidad RDA Antecedentes Farmacologicos]`:

| Tabla | Descripción |
|-------|-------------|
| `[Evaluacion Entidad RDA Consulta Externa]` | Registro principal RDACE (paciente, prestador, diagnósticos, egreso, incapacidad, PDF, etc.) |
| `[Evaluacion Entidad RDA CE Antecedentes Salud]` | Misma idea que antecedentes salud RDA paciente |
| `[Evaluacion Entidad RDA CE Antecedentes Familiares]` | + columna `Parentesco` |
| `[Evaluacion Entidad RDA CE Antecedentes Farmacologicos]` | Igual patrón |
| `[Evaluacion Entidad RDA CE Diagnosticos Relacionados]` | CIE-10 / CIE-11 por fila |
| `[Evaluacion Entidad RDA CE Prescripcion Medicamentos]` | Detalle prescripción medicamentos |
| `[Evaluacion Entidad RDA CE Prescripcion Procedimientos]` | Detalle procedimientos CUPS |
| `[Evaluacion Entidad RDA CE Otras Tecnologias]` | Otras tecnologías en salud |

Todas las hijas referencian `[Id Evaluacion Entidad RDA Consulta Externa]`.

## API (`/apiV3`)

| Método | Ruta | Body (JSON) |
|--------|------|-------------|
| POST | `/EvaluacionEntidadRDACE/` | Campos camelCase del formulario principal → devuelve `{ ok, IdEvaluacionEntidadRDACE }` |
| POST | `/EvaluacionEntidadRDACE/AntecedentesSalud` | `IdEvaluacionEntidadRDACE`, `DocumentoEntidad`, `Descripcion`, `IdEstado?` |
| POST | `/EvaluacionEntidadRDACE/AntecedentesFamiliares` | + `Parentesco` |
| POST | `/EvaluacionEntidadRDACE/AntecedentesFarmacologicos` | igual patrón salud |
| POST | `/EvaluacionEntidadRDACE/DiagnosticosRelacionados` | `CodigoCIE10`, `NombreCIE10`, `CodigoCIE11`, `TerminoCIE11` |
| POST | `/EvaluacionEntidadRDACE/PrescripcionMedicamentos` | `tipo`, `codigo`, `nombre`, `dci`, `fechaPrescripcion`, `dosis`, `unidadDosis`, `via`, `duracionCant`, `duracionUnid`, `frecuenciaCant`, `frecuenciaUnid`, `finalidad` (alineado con `window.RDA` / listas CE) |
| POST | `/EvaluacionEntidadRDACE/PrescripcionProcedimientos` | `tipo`, `codigo`, `nombre`, `finalidad`, `fechaPrescripcion` |
| POST | `/EvaluacionEntidadRDACE/OtrasTecnologias` | `tipo`, `codigo`, `nombre`, `fechaPrescripcion`, `finalidad` |

**Flujo:** 1) POST principal → obtener `IdEvaluacionEntidadRDACE`. 2) Por cada ítem de listas en memoria, POST al sub-recurso correspondiente con el mismo id y `DocumentoEntidad` del paciente cuando aplique.

## Frontend (`Asignar_RIPS V3.html`)

- Botón **Guardar RDA Consulta Externa**: `#RDACE_BtnGuardarConsultaExterna` (al final de `#SeccionRDAConsultaExterna`, después del bloque PDF).
- Script inline: función `guardarRDACE()` — usa `localStorage.NombreEquipoServidor` y `http://{servidor}:3000/apiV3` igual que el guardado del RDA paciente.
- Listas en memoria vía `window.RDA`: `getAntecedentesCE`, `getAntecedentesFamiliaresCE`, `getMedicamentosCE`, `getDiagRelacionados`, `getPrescripcionMedicamentos`, `getPrescripcionProcedimientos`, `getOtrasTecnologias`.

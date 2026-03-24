# Comparación: RDA Consulta Externa vs. lista normativa e IG Ministerio

Este documento enlaza la lista [`lista rda consulta externa.txt`](../lista%20rda%20consulta%20externa.txt) con la **implementación actual** en pantalla y BD, y deja claro qué falta respecto a un **Bundle FHIR** de consulta externa (cuando exista endpoint análogo al de RDA Paciente).

**IG RDA (referencia general):** [RDA – vulcano.ihcecol.gov.co](https://vulcano.ihcecol.gov.co/RDA-paciente) (perfiles específicos de “consulta externa” pueden variar según la guía publicada).

---

## 1. Ítems “dentro de RIPS” migrados a Consulta Externa

En la lista TXT, al final se indican como capturados en el flujo **Asignar RIPS**. Esos mismos datos pueden **replicarse en RDA Consulta Externa** para persistirlos con el registro RDACE:

| Lista TXT | Campo en BD (`[Evaluacion Entidad RDA Consulta Externa]`) | UI (IDs `RDACE_*`) | Sincronización |
|-----------|-----------------------------------------------------------|--------------------|----------------|
| Modalidad de realización de la tecnología de salud | `[Id Modalidad Atencion]` | `RDACE_IdModalidadAtencion` | Copia / sync desde selects RIPS (AC/AP) o `/apiV3/ModalidadAtencion` |
| Grupo de servicios | `[Id Grupo Servicios]` | `RDACE_IdGrupoServicios` | Igual que modalidad + `/apiV3/GrupoServicios` |
| Vía de ingreso del usuario al servicio de salud | `[Id Via Ingreso Usuario]` | `RDACE_IdViaIngresoUsuario` | Selects RIPS AP / por defecto o `/apiV3/ViaIngresoUsuario` |
| Causa que motiva la atención | `[Id Causa Motivo Atencion]` | `RDACE_IdCausaMotivoAtencion` | `SelectCausaMotivoAtencion` / por defecto AC o `/apiV3/CausaExterna` |

**Guardado:** `POST /apiV3/EvaluacionEntidadRDACE/` recibe `IdModalidadAtencion`, `IdGrupoServicios`, `IdViaIngresoUsuario`, `IdCausaMotivoAtencion` (además del resto del payload RDACE).

**Historia / evaluación de origen:** el formulario expone `RDA_HistoriaClinica` (sincronizado con `HistoriasSinRIPS`). El guardado RDACE envía `IdEvaluacionEntidadOrigen` para persistir en `[Id Evaluacion Entidad Origen]` (trazabilidad respecto a la evaluación/historia elegida en RIPS).

**Migración SQL en BD ya existente:** ejecutar [`back_relacionador/SQL/alter-evaluacion-entidad-rdace-rips-context.sql`](../../back_relacionador/SQL/alter-evaluacion-entidad-rdace-rips-context.sql). Para la columna de historia/origen, ejecutar además [`back_relacionador/SQL/alter-evaluacion-entidad-rda-id-evaluacion-origen.sql`](../../back_relacionador/SQL/alter-evaluacion-entidad-rda-id-evaluacion-origen.sql) (incluye RDA Paciente y RDACE).

**Instalaciones nuevas:** columnas incluidas en [`back_relacionador/SQL/1888.sql`](../../back_relacionador/SQL/1888.sql) y en [`back_relacionador/SQL/Evaluacion Entidad RDA Consulta Externa - CREATE.sql`](../../back_relacionador/SQL/Evaluacion%20Entidad%20RDA%20Consulta%20Externa%20-%20CREATE.sql).

---

## 2. Estado respecto a JSON FHIR (IG)

| Tema | Estado actual |
|------|----------------|
| **Bundle FHIR RDA Consulta Externa** | No implementado en este cambio (no hay `POST` equivalente a `RdaPaciente/FhirBundle` para RDACE en el código revisado). |
| **Persistencia lista 1888 / formulario** | Sí: cabecera RDACE + tablas hijas (antecedentes, diagnósticos relacionados, prescripciones, etc.) según [`Asignar_RipsRoutes V3.js`](../../back_relacionador/server/routes/Asignar_RipsRoutes%20V3.js). La cabecera puede incluir `[Id Evaluacion Entidad Origen]` (`IdEvaluacionEntidadOrigen` en JSON) enlazado a `RDA_HistoriaClinica`. |
| **Alineación IG** | Cuando se defina el perfil Composition/recursos para consulta externa, habrá que mapear explícitamente modalidad, grupo, vía y causa (y el resto de la lista) desde la fila RDACE + hijas. |

---

## 3. Referencias en el repo

| Recurso | Ubicación |
|---------|-----------|
| Formulario RDACE + `guardarRDACE` | [`front_relacionador/public/Asignar_RIPS V3.html`](../../front_relacionador/public/Asignar_RIPS%20V3.html) |
| Sync RIPS → RDACE (4 campos) | [`front_relacionador/public/Asignar_RIPS V3.js`](../../front_relacionador/public/Asignar_RIPS%20V3.js) — `cargarYSincronizarRipsContextRdace` |
| API RDACE | [`back_relacionador/server/routes/Asignar_RipsRoutes V3.js`](../../back_relacionador/server/routes/Asignar_RipsRoutes%20V3.js) — `POST /EvaluacionEntidadRDACE/` |
| Campos documentados | [`rda_consulta_externa.md`](./rda_consulta_externa.md) |
| Lista normativa | [`lista rda consulta externa.txt`](../lista%20rda%20consulta%20externa.txt) |

---

*Última actualización: marzo 2026 — contexto RIPS en RDACE; persistencia `IdEvaluacionEntidadOrigen` / historia clínica en tarjeta RDA.*

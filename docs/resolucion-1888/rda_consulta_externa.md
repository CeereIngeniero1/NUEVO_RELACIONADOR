# RDA Consulta Externa — Campos Resolución 1888

Campos implementados en la sección `#SeccionRDAConsultaExterna` del HTML. Todos los IDs llevan prefijo `RDACE_`.

---

## Activación y tipo RDA (compartido con RDA Paciente)

Los controles **Generar RDA** y **tipo de RDA** están en la tarjeta `#cardRDA` (ver [`rda_paciente.md`](./rda_paciente.md) — sección “Tarjeta RDA”). El RDA no se asocia a historia/evolución en la UI.

---

## Campos Compartidos con RDA Paciente

Misma estructura que RDA Paciente, con IDs prefijados `RDACE_` en lugar de `RDA_`.

| # | Campo | ID HTML |
|---|---|---|
| 1 | Código Prestador | `RDACE_CodigoPrestador` |
| 2 | Código Admin. Plan Beneficios | `RDACE_CodigoAdminPlanBeneficios` |
| 3 | Nombre Admin. Plan Beneficios | `RDACE_NombreAdminPlanBeneficios` |
| 4 | Fecha de atención (mismo día para inicio/fin) | `RDACE_FechaAtencion` |
| 5 | Hora inicio atención | `RDACE_HoraInicioAtencion` |
| 6 | Hora fin atención | `RDACE_HoraFinAtencion` |
| 7 | Modalidad tecnología salud (mismo catálogo que RIPS) | `RDACE_IdModalidadAtencion` |
| 8 | Grupo servicios (mismo catálogo que RIPS) | `RDACE_IdGrupoServicios` |
| 9 | Vía ingreso usuario (RIPS) | `RDACE_IdViaIngresoUsuario` |
| 10 | Causa motivo atención (RIPS) | `RDACE_IdCausaMotivoAtencion` |
| 11 | Tipo Doc Profesional | `RDACE_TipoDocProfesional` |
| 12 | Número Doc Profesional | `RDACE_NumDocProfesional` |
| 13 | Diag. Ingreso CIE-11 Código | `RDACE_DiagnosticoIngresoCIE11Codigo` |
| 14 | Diag. Ingreso CIE-11 Término | `RDACE_DiagnosticoIngresoCIE11Termino` |
| 15 | Tipo Alergia | `RDACE_TipoAlergia` |
| 16-23 | Antecedentes (Salud, Familiares, Farmacológicos) | `RDACE_Antecedente*`, `RDACE_Medicamento*` |

> Al guardar, el cliente compone `FechaHoraInicioAtencion` y `FechaHoraFinAtencion` como en RDA Paciente.

---

## Campos Exclusivos de Consulta Externa

### Entorno y Factores de Riesgo

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 1 | Entorno de Atención | `RDACE_EntornoAtencion` | Select (01-06) |
| 2 | Tipo Factor de Riesgo | `RDACE_TipoFactorRiesgo` | Select (01-05) |
| 3 | Nombre Factor de Riesgo | `RDACE_NombreFactorRiesgo` | Input texto |

### Diagnóstico Principal CIE-10

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 4 | Código Diag. Principal CIE-10 | `RDACE_DiagPrincipalCIE10Codigo` | Input texto |
| 5 | Nombre Diag. Principal CIE-10 | `RDACE_DiagPrincipalCIE10Nombre` | Input texto (readonly) |
| 6 | Tipo Diag. Principal | `RDACE_TipoDiagPrincipalCIE10` | Select (01-03) |

### Diagnósticos Relacionados (lista dinámica)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 7 | Código Diag. Relacionado CIE-10 | `RDACE_DiagRelacionadoCIE10Codigo` | Input texto |
| 8 | Nombre Diag. Relacionado CIE-10 | `RDACE_DiagRelacionadoCIE10Nombre` | Input texto (readonly) |
| 9 | Código Diag. Relacionado CIE-11 | `RDACE_DiagRelacionadoCIE11Codigo` | Input texto |
| 10 | Término Diag. Relacionado CIE-11 | `RDACE_DiagRelacionadoCIE11Termino` | Input texto |

### Egreso y Remisión

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 11 | Condición/Destino Egreso | `RDACE_CondicionDestinoEgreso` | Select (01-07) |
| 12 | Código Prestador Remisión | `RDACE_CodigoPrestadorRemite` | Input texto |

### Prescripción de Medicamentos (lista dinámica, 12 campos por ítem)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 13 | Tipo Tec. Salud | `RDACE_TipoTecSaludMed` | Select (fijo: Medicamento) |
| 14 | Código Medicamento | `RDACE_CodigoMedicamento` | Input texto |
| 15 | Nombre Medicamento | `RDACE_NombreMedicamento` | Input texto |
| 16 | Descripción Común (DCI) | `RDACE_DescripcionComunMed` | Input texto |
| 17 | Fecha Prescripción | `RDACE_FechaPrescripcionMed` | datetime-local |
| 18 | Dosis Ordenada | `RDACE_DosisOrdenadaMed` | Input number |
| 19 | Unidad Medida Dosis | `RDACE_UnidadMedidaDosis` | Select (mg, ml, g, UI, mcg, gotas) |
| 20 | Vía Administración | `RDACE_ViaAdministracionMed` | Select (01-10) |
| 21 | Duración — Cantidad | `RDACE_DuracionCantidadMed` | Input number |
| 22 | Duración — Unidad Tiempo | `RDACE_DuracionUnidadTiempoMed` | Select (d, s, m) |
| 23 | Frecuencia — Cantidad | `RDACE_FrecuenciaCantidadMed` | Input number |
| 24 | Frecuencia — Unidad Tiempo | `RDACE_FrecuenciaUnidadTiempoMed` | Select (h, d) |
| 25 | Finalidad Tec. Salud | `RDACE_FinalidadTecSaludMed` | Select (01-05) |

### Prescripción de Procedimientos (lista dinámica)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 26 | Tipo Tec. Salud | `RDACE_TipoTecSaludProc` | Select (fijo: Procedimiento) |
| 27 | Código Procedimiento (CUPS) | `RDACE_CodigoProcedimiento` | Input texto |
| 28 | Nombre Procedimiento | `RDACE_NombreProcedimiento` | Input texto (readonly) |
| 29 | Finalidad | `RDACE_FinalidadTecSaludProc` | Select (01-05) |
| 30 | Fecha Prescripción | `RDACE_FechaPrescripcionProc` | datetime-local |

### Otras Tecnologías en Salud (lista dinámica)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 31 | Tipo Tec. Salud | `RDACE_TipoTecSaludOtra` | Select (03-06) |
| 32 | Código | `RDACE_CodigoOtraTecnologia` | Input texto |
| 33 | Nombre | `RDACE_NombreOtraTecnologia` | Input texto |
| 34 | Fecha Prescripción | `RDACE_FechaPrescripcionOtra` | datetime-local |
| 35 | Finalidad | `RDACE_FinalidadTecSaludOtra` | Select (01-05) |

### Incapacidad y Licencia

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 36 | Alcance Incapacidad | `RDACE_AlcanceIncapacidad` | Select (01-03) |
| 37 | Días de Incapacidad | `RDACE_DiasIncapacidad` | Input number |
| 38 | Días Licencia Maternidad | `RDACE_DiasLicenciaMaternidad` | Input number |

### Documento PDF

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 39 | Nombre Documento PDF | `RDACE_NombreDocumentoPDF` | Input texto |

---

*Total campos exclusivos: 37 de datos + 4 botones + 4 contenedores de listas dinámicas*

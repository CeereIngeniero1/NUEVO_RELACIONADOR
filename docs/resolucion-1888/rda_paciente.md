# RDA Paciente — Campos Resolución 1888

Campos implementados en la sección `#SeccionRDAPaciente` del HTML. Todos los IDs llevan prefijo `RDA_`.

---

## Tarjeta RDA (fuera de las secciones Paciente / Consulta Externa)

Estos controles viven en `#cardRDA` **por encima** de `#SeccionRDAPaciente` y `#SeccionRDAConsultaExterna`, de modo que al alternar el tipo de RDA no se pierde la historia elegida.

| Control | ID | Notas |
|---------|-----|--------|
| Historia / evolución asociada al RDA | `RDA_HistoriaClinica` | Mismas opciones y valor que `HistoriasSinRIPS` (RIPS); sincronización bidireccional. Tras `LlenarSelectDeHistoriasClinicas` en `Asignar_RIPS V3.js` se llama `window.RDA.syncHistoriaClinicaDesdeRips()`. |
| Activar flujo RDA (barra de progreso) | `GenerarRDABase` | Checkbox oculto; la UI usa el botón `RDA_BtnGenerar` (“Generar RDA” / “Desactivar RDA”). |
| Tipo de RDA | `input[name="tipoRDA"]` | Radios en `#ContenedorTipoRDA`. |

**Persistencia en BD:** al guardar RDA Paciente (`POST /apiV3/EvaluacionEntidadRDA/`), el payload incluye `IdEvaluacionEntidadOrigen` (entero o `null`), almacenado en la columna `[Id Evaluacion Entidad Origen]` de `[Evaluacion Entidad RDA]`.

---

## Campos Compartidos (también en RDA Consulta Externa)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 1 | Código Prestador | `RDA_CodigoPrestador` | Input texto |
| 2 | Código Admin. Plan Beneficios SGSSS | `RDA_CodigoAdminPlanBeneficios` | Input texto |
| 3 | Nombre Admin. Plan Beneficios SGSSS | `RDA_NombreAdminPlanBeneficios` | Input texto |
| 4 | Fecha y Hora Inicio Atención | `RDA_FechaHoraInicioAtencion` | datetime-local |
| 5 | Fecha y Hora Fin Atención | `RDA_FechaHoraFinAtencion` | datetime-local |
| 6 | Tipo Documento Profesional | `RDA_TipoDocProfesional` | Select (CC, TI, CE, PA, PE, SI, …) |
| 7 | Número Documento Profesional | `RDA_NumDocProfesional` | Select2 (búsqueda profesional / documento) |

## Contexto FHIR (Composition.event / custodian)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| - | Modalidad atención | `RDA_IdModalidadAtencion` | Select (GET `/apiV3/ModalidadAtencion`) |
| - | Grupo servicios | `RDA_IdGrupoServicios` | Select (GET `/apiV3/GrupoServicios`) |
| - | NIT IPS (DIAN) | `RDA_NitPrestadorIPS` | Input texto |
| - | Nombre IPS | `RDA_NombrePrestadorIPS` | Input texto |

## Diagnóstico Principal Ingreso CIE-11

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 8 | Código Diagnóstico Ingreso CIE-11 | `RDA_DiagnosticoIngresoCIE11Codigo` | Input texto |
| 9 | Término Diagnóstico Ingreso CIE-11 | `RDA_DiagnosticoIngresoCIE11Termino` | Input texto |

## Tipo de Alergia

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 10 | Tipo de Alergia (complemento) | `RDA_TipoAlergia` | Select (01-06) |

## Antecedentes de Salud (lista dinámica)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 11 | Condición de Salud CIE-10 | `RDA_AntecedenteSaludCIE10` | Input texto |
| 12 | Descripción | `RDA_AntecedenteSaludDescripcion` | Input texto (readonly) |
| - | Botón Agregar | `RDA_BtnAgregarAntecedente` | Button |
| - | Lista renderizada | `RDA_ListaAntecedentes` | Div contenedor |

## Antecedentes Familiares (lista dinámica)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 13 | Parentesco | `RDA_ParentescoFamiliar` | Select (01-04) |
| 14 | Condición Salud CIE-10 | `RDA_AntecedenteFamiliarCIE10` | Input texto |
| 15 | Condición Salud CIE-11 | `RDA_AntecedenteFamiliarCIE11` | Input texto |
| 16 | Descripción | `RDA_AntecedenteFamiliarDescripcion` | Input texto (readonly) |
| - | Botón Agregar | `RDA_BtnAgregarAntecedenteFam` | Button |
| - | Lista renderizada | `RDA_ListaAntecedentesFamiliares` | Div contenedor |

## Antecedentes Farmacológicos (lista dinámica)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 17 | Descripción Común Medicamento (DCI) | `RDA_MedicamentoDCI` | Input texto |
| 18 | Observaciones | `RDA_MedicamentoObservacion` | Input texto |
| - | Botón Agregar | `RDA_BtnAgregarMedicamento` | Button |
| - | Lista renderizada | `RDA_ListaMedicamentos` | Div contenedor |

---

*Total: 18 campos de datos + 3 botones de acción + 3 contenedores de listas dinámicas*

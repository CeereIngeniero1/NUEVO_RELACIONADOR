# RDA Paciente — Campos Resolución 1888

Campos implementados en la sección `#SeccionRDAPaciente` del HTML. Todos los IDs llevan prefijo `RDA_`.

---

## Tarjeta RDA (activación y tipo)

Controles en `#cardRDA` **por encima** de `#SeccionRDAPaciente` y `#SeccionRDAConsultaExterna`. El **RDA no se enlaza** a una historia o evolución en pantalla; la selección de historia para **RIPS** sigue en `HistoriasSinRIPS`.

> Nota: si ya existía un vínculo previo entre historia clínica y el flujo de RIPS (incluyendo escenarios RDA), la reversión se realiza desde el módulo **`Desrelacionar`** en el frontend (ver [`docs/desrelacionador/descripcion.md`](../desrelacionador/descripcion.md)).

| Control | ID | Notas |
|---------|-----|--------|
| Activar flujo RDA (barra de progreso) | `GenerarRDABase` | Checkbox oculto; la UI usa el botón `RDA_BtnGenerar` (“Generar RDA” / “Desactivar RDA”). |
| Tipo de RDA | `input[name="tipoRDA"]` | Segmentado en `#ContenedorTipoRDA` (`rda/ui/controlRda.js`). |

---

## Campos Compartidos (también en RDA Consulta Externa)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 1 | Código Prestador | `RDA_CodigoPrestador` | Input texto |
| 2 | Código Admin. Plan Beneficios SGSSS | `RDA_CodigoAdminPlanBeneficios` | Input texto |
| 3 | Nombre Admin. Plan Beneficios SGSSS | `RDA_NombreAdminPlanBeneficios` | Input texto |
| 4 | Fecha de atención (mismo día para inicio/fin) | `RDA_FechaAtencion` | date |
| 5 | Hora inicio atención | `RDA_HoraInicioAtencion` | time |
| 6 | Hora fin atención | `RDA_HoraFinAtencion` | time |
| 7 | Tipo Documento Profesional | `RDA_TipoDocProfesional` | Select (CC, TI, CE, PA, PE, SI, …) |
| 8 | Número Documento Profesional | `RDA_NumDocProfesional` | Select2 (búsqueda profesional / documento) |

> Al guardar, el cliente compone `FechaHoraInicioAtencion` y `FechaHoraFinAtencion` (mismo contrato JSON/API que antes) a partir de fecha + horas; los tres campos deben ir completos o los tres vacíos, y hora fin &gt; hora inicio el mismo día.

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
| 9 | Código Diagnóstico Ingreso CIE-11 | `RDA_DiagnosticoIngresoCIE11Codigo` | Input texto |
| 10 | Término Diagnóstico Ingreso CIE-11 | `RDA_DiagnosticoIngresoCIE11Termino` | Input texto |

## Diagnóstico principal al egreso (CIE-10)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| — | Código diagnóstico principal egreso CIE-10 | `RDA_DiagPrincipalEgresoCIE10Codigo` | Select2 (CIE-10) |
| — | Nombre diagnóstico principal egreso CIE-10 | `RDA_DiagPrincipalEgresoCIE10Nombre` | Input (readonly) |
| — | Tipo diagnóstico principal al egreso (01–03, Res. 866) | `RDA_TipoDiagPrincipalEgresoCIE10` | Select2 catálogo `TipoDiagnosticoPrincipal` |

## Tipo de Alergia

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 11 | Tipo de Alergia (complemento) | `RDA_TipoAlergia` | Select (01-06) |

## Antecedentes de Salud (lista dinámica)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 12 | Condición de Salud CIE-10 | `RDA_AntecedenteSaludCIE10` | Input texto |
| 13 | Descripción | `RDA_AntecedenteSaludDescripcion` | Input texto (readonly) |
| - | Botón Agregar | `RDA_BtnAgregarAntecedente` | Button |
| - | Lista renderizada | `RDA_ListaAntecedentes` | Div contenedor |

## Antecedentes Familiares (lista dinámica)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 14 | Parentesco | `RDA_ParentescoFamiliar` | Select (01-04) |
| 15 | Condición Salud CIE-10 | `RDA_AntecedenteFamiliarCIE10` | Input texto |
| 16 | Condición Salud CIE-11 | `RDA_AntecedenteFamiliarCIE11` | Input texto |
| 17 | Descripción | `RDA_AntecedenteFamiliarDescripcion` | Input texto (readonly) |
| - | Botón Agregar | `RDA_BtnAgregarAntecedenteFam` | Button |
| - | Lista renderizada | `RDA_ListaAntecedentesFamiliares` | Div contenedor |

## Antecedentes Farmacológicos (lista dinámica)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 18 | Descripción Común Medicamento (DCI) | `RDA_MedicamentoDCI` | Input texto |
| 19 | Observaciones | `RDA_MedicamentoObservacion` | Input texto |
| - | Botón Agregar | `RDA_BtnAgregarMedicamento` | Button |
| - | Lista renderizada | `RDA_ListaMedicamentos` | Div contenedor |

---

*Total: 18 campos de datos + 3 botones de acción + 3 contenedores de listas dinámicas*

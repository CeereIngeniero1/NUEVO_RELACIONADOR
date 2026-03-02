# RDA Paciente — Campos Resolución 1888

Campos implementados en la sección `#SeccionRDAPaciente` del HTML. Todos los IDs llevan prefijo `RDA_`.

---

## Campos Compartidos (también en RDA Consulta Externa)

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 1 | Código Prestador | `RDA_CodigoPrestador` | Input texto |
| 2 | Código Admin. Plan Beneficios SGSSS | `RDA_CodigoAdminPlanBeneficios` | Input texto |
| 3 | Nombre Admin. Plan Beneficios SGSSS | `RDA_NombreAdminPlanBeneficios` | Input texto |
| 4 | Fecha y Hora Inicio Atención | `RDA_FechaHoraInicioAtencion` | datetime-local |
| 5 | Fecha y Hora Fin Atención | `RDA_FechaHoraFinAtencion` | datetime-local |
| 6 | Tipo Documento Profesional | `RDA_TipoDocProfesional` | Select (CC, CE, PA, PE) |
| 7 | Número Documento Profesional | `RDA_NumDocProfesional` | Input texto |

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

# Análisis de Campos — RDA Consulta Externa (Resolución 1888)

> **Estado:** ✅ Implementación completada — Los 37 campos faltantes ya fueron agregados al HTML y la lógica JS.

Cruce original de la lista proporcionada (~47 campos) contra los campos existentes en `Asignar_RIPS V3.html`.

---

## ✅ CAMPOS QUE YA EXISTÍAN (antes de la implementación)

| # | Campo | Ubicación | ID |
|---|---|---|---|
| 1 | Código del prestador | RDA CE | `RDACE_CodigoPrestador` |
| 2 | Código admin. plan beneficios | RDA CE | `RDACE_CodigoAdminPlanBeneficios` |
| 3 | Nombre admin. plan beneficios | RDA CE | `RDACE_NombreAdminPlanBeneficios` |
| 4 | Código diag. ingreso CIE-11 | RDA CE | `RDACE_DiagnosticoIngresoCIE11Codigo` |
| 5 | Término diag. ingreso CIE-11 | RDA CE | `RDACE_DiagnosticoIngresoCIE11Termino` |
| 6 | Tipo diag. principal CIE-10 | RIPS AC | `SelectTipoDiagnosticoPrincipalAC` |
| 7 | DCI medicamento | RDA CE | `RDACE_MedicamentoDCI` |
| 8 | Tipo doc profesional | RDA CE | `RDACE_TipoDocProfesional` |
| 9 | Número doc profesional | RDA CE | `RDACE_NumDocProfesional` |
| 10 | Diagnóstico RIPS AC 1 | RIPS AC | `SelectDiagnosticoRIPSAC1` |
| 11 | Diagnóstico RIPS AC 2 | RIPS AC | `SelectDiagnosticoRIPSAC2` |
| 12 | Finalidad tec. salud AC | RIPS AC | `SelectFinalidadTecnologiaSaludAC` |

---

## ✅ CAMPOS IMPLEMENTADOS (37 campos agregados)

Agregados en `Asignar_RIPS V3.html` organizados en 9 cards temáticas. Lógica de listas dinámicas en `rda-v3.js`.

| Card | Campos | IDs principales |
|---|---|---|
| Entorno y Factores de Riesgo | 3 | `RDACE_EntornoAtencion`, `RDACE_TipoFactorRiesgo`, `RDACE_NombreFactorRiesgo` |
| Diagnóstico Principal CIE-10 | 3 | `RDACE_DiagPrincipalCIE10Codigo/Nombre`, `RDACE_TipoDiagPrincipalCIE10` |
| Diagnósticos Relacionados | 4 + lista dinámica | `RDACE_DiagRelacionadoCIE10/CIE11` |
| Egreso y Remisión | 2 | `RDACE_CondicionDestinoEgreso`, `RDACE_CodigoPrestadorRemite` |
| Prescripción Medicamentos | 13 + lista dinámica | `RDACE_CodigoMedicamento`, `RDACE_DosisOrdenada`, etc. |
| Prescripción Procedimientos | 5 + lista dinámica | `RDACE_CodigoProcedimiento`, etc. |
| Otras Tecnologías | 5 + lista dinámica | `RDACE_CodigoOtraTecnologia`, etc. |
| Incapacidad y Licencia | 3 | `RDACE_AlcanceIncapacidad`, `RDACE_DiasIncapacidad`, `RDACE_DiasLicenciaMaternidad` |
| Documento PDF | 1 | `RDACE_NombreDocumentoPDF` |

---

## Resumen

| Estado | Cantidad |
|---|---|
| Ya existían | 12 |
| Implementados | 37 |
| **Total** | **49** |

> Ver detalle completo de IDs en [rda_consulta_externa.md](../resolucion-1888/rda_consulta_externa.md)
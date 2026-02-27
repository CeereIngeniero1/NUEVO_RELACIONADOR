# Análisis de Campos — RDA Consulta Externa (Resolución 1888)

Cruce de la lista proporcionada (~47 campos) contra los campos ya existentes en `Asignar_RIPS V3.html`.

---

## ✅ CAMPOS QUE YA EXISTEN

| # | Campo Solicitado | Ubicación actual | ID del elemento |
|---|---|---|---|
| 1 | Código del prestador de servicios de salud | RDA Consulta Externa | `RDACE_CodigoPrestador` |
| 2 | Código admin. plan beneficios SGSSS | RDA Consulta Externa | `RDACE_CodigoAdminPlanBeneficios` |
| 3 | Nombre admin. plan beneficios SGSSS | RDA Consulta Externa | `RDACE_NombreAdminPlanBeneficios` |
| 4 | Código diagnóstico principal ingreso CIE-11 | RDA Consulta Externa | `RDACE_DiagnosticoIngresoCIE11Codigo` |
| 5 | Término diagnóstico principal ingreso CIE-11 | RDA Consulta Externa | `RDACE_DiagnosticoIngresoCIE11Termino` |
| 6 | Tipo diagnóstico principal CIE-10 | Sección RIPS AC | `SelectTipoDiagnosticoPrincipalAC` |
| 7 | Descripción común del medicamento (DCI) | RDA Consulta Externa | `RDACE_MedicamentoDCI` |
| 8 | Tipo documento talento humano (profesional) | RDA Consulta Externa | `RDACE_TipoDocProfesional` |
| 9 | Número documento talento humano (profesional) | RDA Consulta Externa | `RDACE_NumDocProfesional` |
| 10 | Diagnóstico RIPS AC 1 (código diagnóstico CIE-10) | Sección RIPS AC | `SelectDiagnosticoRIPSAC1` |
| 11 | Diagnóstico RIPS AC 2 (diagnóstico relacionado CIE-10) | Sección RIPS AC | `SelectDiagnosticoRIPSAC2` |
| 12 | Finalidad tecnología en salud (RIPS AC) | Sección RIPS AC | `SelectFinalidadTecnologiaSaludAC` |

---

## ❌ CAMPOS QUE FALTAN POR AGREGAR

| # | Campo Solicitado | Notas |
|---|---|---|
| 1 | Entorno donde se realizó la atención | Select: intramural, extramural, telemedicina, etc. |
| 2 | Tipo de factor de riesgo | Select nuevo |
| 3 | Nombre del factor de riesgo | Input texto |
| 4 | Código diagnóstico principal CIE-10 | Ya existe `SelectDiagnosticoRIPSAC1` como select RIPS, pero necesita un campo explícito en la sección RDA CE con ID propio |
| 5 | Nombre del diagnóstico principal CIE-10 | Input texto auto-fill asociado al código anterior |
| 6 | Diagnósticos relacionados CIE-10 — código | Lista dinámica (puede haber varios). Actualmente solo está `SelectDiagnosticoRIPSAC2` en RIPS |
| 7 | Diagnósticos relacionados CIE-10 — nombre | Nombre auto-fill del diagnóstico relacionado |
| 8 | Código diagnóstico relacionado CIE-11 | Input texto — NO existe en ninguna sección |
| 9 | Término diagnóstico relacionado CIE-11 | Input texto — NO existe en ninguna sección |
| 10 | Condición y destino del usuario al egreso | Select nuevo |
| 11 | Código del prestador a donde se remite | Input texto |
| 12 | Tipo de tecnología en salud (medicamento) | Select: 01-Medicamento, 02-Procedimiento, 03-Dispositivo, etc. |
| 13 | Código del medicamento (código tecnología salud) | Input texto / select |
| 14 | Nombre del medicamento | Input texto |
| 15 | Fecha de prescripción del medicamento | Input datetime-local |
| 16 | Dosis ordenada del medicamento | Input number |
| 17 | Código unidad de medida de la dosis | Select (mg, ml, g, UI, etc.) |
| 18 | Vía de administración del medicamento | Select (oral, IV, IM, subcutánea, etc.) |
| 19 | Duración prescrita del medicamento — cantidad | Input number |
| 20 | Duración prescrita del medicamento — código unidad de tiempo | Select (días, semanas, meses) |
| 21 | Frecuencia administración del medicamento — cantidad | Input number |
| 22 | Frecuencia administración del medicamento — código unidad de tiempo | Select (horas, días) |
| 23 | Finalidad tecnología en salud (medicamento) | Select |
| 24 | Tipo de tecnología en salud (procedimiento) | Select |
| 25 | Código del procedimiento (código tecnología salud) | Input / select CUPS |
| 26 | Nombre del procedimiento (nombre tecnología salud) | Input texto auto-fill |
| 27 | Finalidad tecnología en salud (procedimiento) | Select |
| 28 | Fecha de prescripción del procedimiento | Input datetime-local |
| 29 | Tipo de tecnología en salud (otras tecnologías) | Select |
| 30 | Código de las otras tecnologías en salud | Input texto |
| 31 | Nombre de las otras tecnologías en salud | Input texto |
| 32 | Fecha de prescripción de las otras tecnologías | Input datetime-local |
| 33 | Finalidad tecnología en salud (otras tecnologías) | Select |
| 34 | Incapacidad — alcance de la incapacidad | Select |
| 35 | Días de incapacidad | Input number |
| 36 | Días de licencia de maternidad | Input number |
| 37 | Nombre documento PDF | Input texto / generado automáticamente |

---

## Resumen

| Estado | Cantidad |
|---|---|
| ✅ Ya existen | 12 |
| ❌ Faltan | 37 |
| **Total** | **49** |

> [!IMPORTANT]
> Este documento es de **análisis solamente**. NO se han hecho cambios al código.  
> Cuando el usuario lo apruebe, se comenzará la implementación de los 37 campos faltantes.

# Campos RIPS — AC (Consultas) y AP (Procedimientos)

Campos actualmente implementados en las secciones RIPS del HTML. Estos son los campos de la Resolución 2275.

---

## RIPS AC — Consultas

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 1 | Tipo de usuario | `SelectTipoUsuarioRIPS` | Select |
| 2 | Entidad | `SelectEntidad` | Select |
| 3 | Modalidad Grupo Servicio Tec. Salud | `SelectModalidadGrupoServicioTecnologiaSalud` | Select |
| 4 | Grupo de Servicios | `SelectGrupoServiciosAC` | Select |
| 5 | Código de Servicio | `SelectServiciosAC` | Select |
| 6 | Finalidad Tecnología en Salud | `SelectFinalidadTecnologiaSaludAC` | Select |
| 7 | Causa/Motivo de Atención | `SelectCausaMotivoAtencion` | Select |
| 8 | Tipo Diagnóstico Principal | `SelectTipoDiagnosticoPrincipalAC` | Select |
| 9 | Consulta RIPS 1 | `SelectConsultaRIPSAC1` | Select |
| 10 | Consulta RIPS 2 | `SelectConsultaRIPSAC2` | Select |
| 11 | Diagnóstico RIPS 1 | `SelectDiagnosticoRIPSAC1` | Select |
| 12 | Diagnóstico RIPS 2 | `SelectDiagnosticoRIPSAC2` | Select |

---

## RIPS AP — Procedimientos

| # | Campo | ID HTML | Tipo |
|---|---|---|---|
| 1 | Tipo de usuario | `SelectTipoUsurioRIPSAP` | Select |
| 2 | Entidad | `SelectEntidadAP` | Select |
| 3 | Vía Ingreso Servicio Salud | `SelectViaIngresoServicioSaludAP` | Select |
| 4 | Modalidad Grupo Servicio Tec. Salud | `SelectModalidadGrupoServicioTecSalAP` | Select |
| 5 | Grupo de Servicios | `SelectGrupoServiciosAP` | Select |
| 6 | Código de Servicio | `SelectServicioAP` | Select |
| 7 | Finalidad Tecnología en Salud | `SelectFinalidadTecnologiaSaludAP` | Select |
| 8 | Procedimiento RIPS 1 | `SelectProcedimientoRIPSAP1` | Select |
| 9 | Procedimiento RIPS 2 | `SelectProcedimientoRIPSAP2` | Select |
| 10 | Diagnóstico RIPS 1 | `SelectDiagnosticoRIPSAP1` | Select |
| 11 | Diagnóstico RIPS 2 | `SelectDiagnosticoRIPSAP2` | Select |

---

*Estos selectores se llenan dinámicamente desde la API del backend con los catálogos RIPS.*

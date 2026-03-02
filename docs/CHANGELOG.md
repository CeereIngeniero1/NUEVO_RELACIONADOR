# Historial de Versiones — Relacionador RIPS

---

## v3.1.1 — 2026-02-27
- **Datos paciente:** Agregados campos Código y Nombre de Ocupación (CIUO) en HTML y JS
- **Documentación:** Reorganización completa de `docs/` con subcarpetas por resolución

## v3.1.0 — 2026-02-27
- **RDA Consulta Externa:** 37 campos exclusivos en 9 cards temáticas
  - Entorno y Factores de Riesgo (3 campos)
  - Diagnóstico Principal CIE-10 (3 campos)
  - Diagnósticos Relacionados CIE-10 y CIE-11 (4 campos + lista dinámica)
  - Egreso y Remisión (2 campos)
  - Prescripción de Medicamentos (13 campos + lista dinámica)
  - Prescripción de Procedimientos CUPS (5 campos + lista dinámica)
  - Otras Tecnologías en Salud (5 campos + lista dinámica)
  - Incapacidad y Licencia de Maternidad (3 campos)
  - Nombre del Documento PDF (1 campo)
- **rda-v3.js:** `inicializarListasCE()` + `renderizarListaCE()` + 4 getters en API pública

## v3.0.0 — 2026-02-24
- **RDA Paciente:** 18 campos de la Resolución 1888
  - Código Prestador, Admin. Plan Beneficios (código + nombre)
  - Fecha/Hora Inicio y Fin Atención
  - Profesional de Salud (tipo doc + número doc)
  - Diagnóstico Principal Ingreso CIE-11 (código + término)
  - Tipo Alergia
  - Antecedentes de Salud CIE-10 (lista dinámica)
  - Antecedentes Familiares CIE-10/CIE-11 + parentesco (lista dinámica)
  - Antecedentes Farmacológicos DCI (lista dinámica)
- **RDA Consulta Externa:** Estructura base duplicada de RDA Paciente con prefijo `RDACE_`
- **rda-v3.js:** Nuevo archivo independiente (IIFE)
  - Cálculo automático de IMC
  - Control de flujo RDA (checkbox + radios)
  - Listas dinámicas con badges
  - API pública `window.RDA`
- **Datos del paciente:** Sección rediseñada con 20+ campos editables

## v2.0.0
- Implementación de RIPS V2 con campos básicos del paciente
- Asignación de RIPS AC y AP
- Separación de `Asignar_RIPS V2.html` / `V2.js`

---

## Versiones del motor RIPS (pre-V3)

### v1.0.6
- Corrección código postal (>5 dígitos, ej: 0505001)
- Separación de consecutivos EPS y particulares en generador JSON
- Corrección cálculo de valores de servicios (copago + valor total)
- Función SQL `[dbo].[Documento_EPS]` para separar EPS de particular

### v1.0.5
- Incorporación de opción RipSin en el generador de JSON

---

*Formato: [Keep a Changelog](https://keepachangelog.com/)*

# Resolución 1888 — Resumen Digital de Atención (RDA)

## ¿Qué es?

La Resolución 1888 de 2025 establece el **Resumen Digital de Atención (RDA)**, un complemento a los RIPS (Resolución 2275) que amplía la información clínica y administrativa reportada por cada atención en salud.

## ¿Qué agrega sobre la 2275?

| Área | 2275 (antes) | 1888 (ahora) |
|---|---|---|
| **Identificación** | Tipo doc, número, nombre | + Ocupación (CIUO), nacionalidad detallada |
| **Diagnósticos** | Solo CIE-10 (código) | + CIE-11 (código + término), diagnósticos relacionados |
| **Antecedentes** | No existía | Salud CIE-10, familiares (con parentesco), farmacológicos (DCI) |
| **Prescripciones** | No existía | Medicamentos (dosis, vía, frecuencia, duración), procedimientos CUPS, otras tecnologías |
| **Atención** | Solo fecha inicio | + Fecha fin, entorno, profesional, factores de riesgo |
| **Egreso** | No existía | Condición/destino al egreso, código prestador remisión |
| **Incapacidad** | No existía | Días incapacidad, licencia maternidad |
| **Biometría** | No existía | Talla, peso, IMC (cálculo automático) |
| **Alergias** | No existía | Tipo alergia, nombre alérgeno |

## Tipos de RDA implementados

| Tipo | Sección HTML | Prefijo IDs | Campos | Estado |
|---|---|---|---|---|
| **RDA Paciente** | `#SeccionRDAPaciente` | `RDA_` | 18 campos | ✅ Completo |
| **RDA Consulta Externa** | `#SeccionRDAConsultaExterna` | `RDACE_` | 18 compartidos + 37 exclusivos | ✅ Completo |

## ¿Dónde vive en el código?

| Componente | Archivo | Responsabilidad |
|---|---|---|
| HTML (campos) | `Asignar_RIPS V3.html` | Estructura visual dentro de `#ContenidoRDA` |
| JS (lógica RDA) | `rda-v3.js` | Biometría, control de flujo, listas dinámicas, API `window.RDA` |
| JS (datos paciente) | `Asignar_RIPS V3.js` | Carga de datos del paciente desde backend (incluyendo ocupación) |

## Control de flujo RDA

```
[✓] Generar RDA? → Habilita radios
    ( ) RDA Paciente       → Muestra #SeccionRDAPaciente
    ( ) Consulta Externa   → Muestra #SeccionRDAConsultaExterna
```

Solo se puede seleccionar un tipo de RDA a la vez. La lógica vive en `rda-v3.js → inicializarControlRDA()`.

---

*Ver campos detallados en:*
- [rda_paciente.md](rda_paciente.md) — 18 campos con IDs
- [rda_consulta_externa.md](rda_consulta_externa.md) — 37 campos exclusivos + compartidos
- [campos_analisis.md](campos_analisis.md) — Análisis existentes vs implementados
- [pdfs/](pdfs/) — Documentos PDF originales de la resolución

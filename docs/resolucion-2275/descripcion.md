# Resolución 2275 — RIPS Clásico

## ¿Qué es?

La Resolución 2275 establece el estándar de reporte de servicios de salud en Colombia. Define la estructura de archivos JSON que los prestadores deben generar por cada atención realizada a un paciente.

## Tipos de RIPS que maneja el sistema

| Tipo | Código | Descripción | Sección HTML |
|---|---|---|---|
| **AC** | Consultas | Registro de consultas médicas ambulatorias | `#TipoAC` |
| **AP** | Procedimientos | Registro de procedimientos quirúrgicos y no quirúrgicos | `#TipoAP` |

## ¿Dónde vive en el código?

| Componente | Archivo | Descripción |
|---|---|---|
| HTML (formulario) | `Asignar_RIPS V3.html` | Secciones `#TipoAC` y `#TipoAP` con selects RIPS |
| JS (lógica) | `Asignar_RIPS V3.js` | Carga catálogos, asignación, registro, descarga JSON |
| JS (catálogos) | `MaestroListasRIPS.js` | Opciones de los selects RIPS |
| Backend (API) | `back_relacionador/server/routes/` | Endpoints para consultar servicios y generar JSON |

## Flujo de uso

```
1. Seleccionar paciente → Cargar datos
2. Seleccionar historia clínica sin RIPS
3. Elegir tipo: AC o AP
4. Llenar campos del RIPS (selects de catálogos)
5. Registrar RIPS → Asocia el RIPS a la historia clínica
6. Descargar JSON → Genera archivo según estructura 2275
```

## Relación con la 1888

La Resolución 1888 **NO reemplaza** la 2275. La complementa agregando:
- Más datos del paciente (antecedentes, alergias, biometría, ocupación)
- Diagnósticos en CIE-11 (además de CIE-10)
- Prescripciones detalladas de medicamentos y procedimientos
- Incapacidades y licencias

Los campos de la 2275 siguen siendo obligatorios. Los campos de la 1888 se agregan como datos complementarios en el RDA (Resumen Digital de Atención).

---

*Ver campos detallados en:* [campos_rips_ac_ap.md](campos_rips_ac_ap.md)

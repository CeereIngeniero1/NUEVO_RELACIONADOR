# Plan de Refactorización Frontend — Estado Actual

> **Estado:** ⏸️ En pausa — Se priorizó la implementación de campos RDA (Res. 1888) antes de refactorizar.

## Diagnóstico Original

`Asignar_RIPS V3.js` tiene **~5,600 líneas** en un solo archivo (God Object).

## Lo que se hizo (parcial)

| Acción | Estado |
|---|---|
| Crear `rda-v3.js` como módulo independiente | ✅ Hecho |
| Separar lógica RDA del archivo principal | ✅ Hecho |
| Separar API service, utils, rips-logic | ❌ No iniciado |

## Lo que falta

La refactorización completa (separar en 4+1 archivos) queda pendiente para después de completar la implementación de la Res. 1888. Ver [pendientes.md](../pendientes.md).

## Arquitectura propuesta (referencia futura)

| Archivo | Responsabilidad |
|---|---|
| `api-service-v3.js` | Solo `fetch()`, sin DOM |
| `rips-logic-v3.js` | Lógica RIPS AC/AP, validaciones |
| `rda-v3.js` | Lógica RDA 1888 *(ya existe)* |
| `utils-ui-v3.js` | Helpers visuales reutilizables |
| `main-v3.js` | Orquestador de eventos |

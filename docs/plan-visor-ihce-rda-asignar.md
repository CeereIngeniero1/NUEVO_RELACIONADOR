# Integración Visor IHCE en módulo RDA (Asignar RIPS V3)

**Estado:** Implementado (Fase 1 — iframe embebido)  
**Fecha:** 2026-06-16

## Uso

1. Cargar paciente en **Asignar RIPS & RDA**.
2. En el card **Resumen Digital de Atención (RDA)**, pulsar **Consultar RDA IHCE**.
3. Se abre modal fullscreen; consulta IHCE automática con documento del paciente activo.

## Archivos

| Archivo | Rol |
|---------|-----|
| `front_relacionador/public/Asignar_RIPS V3.html` | Botón + modal iframe |
| `front_relacionador/public/rda/visor/ihceVisorModal.js` | Orquestación modal |
| `front_relacionador/public/rda/index.js` | Wire + `RDA.setPacienteActivoIhce` |
| `front_relacionador/public/Asignar_RIPS V3.js` | Paciente activo al cargar HC |
| `front_relacionador/public/visor/visor.html` | Modo embed + barra consulta |
| `front_relacionador/public/visor/consultas_rda.js` | Auto-consulta `?embed=1&auto=1` |
| `front_relacionador/public/visor/styles.css` | Estilos embed |
| `front_relacionador/public/Asignar_RIPS.css` | Estilos modal/iframe |

## URL iframe

```
visor/visor.html?embed=1&auto=1&tipo=CC&doc=1026161053
```

## Fase 2 (pendiente)

Integración nativa sin iframe: extraer `initVisorIhce()` desde `consultas_rda.js`.

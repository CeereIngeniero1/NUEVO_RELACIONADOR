# Refactorización Frontend RIPS V3 — Manifiesto

## Fase 0: Análisis y Planificación
- [x] Analizar estructura de `Asignar_RIPS V3.js` (5379 líneas, ~175 bloques)
- [x] Mapear funciones por módulo destino (api-service, rips-logic, paciente-rda, utils-ui, main)
- [x] Definir reglas del Manifiesto de Refactorización
- [/] Someter plan para revisión del usuario

## Fase 1: Crear Módulos Base (Estructura Vacía)
- [ ] Crear carpeta `js/v3/` y archivos vacíos con estructura
- [ ] Actualizar `Asignar_RIPS V3.html` para cargar los nuevos scripts

## Fase 2: Migración (Patrón Estrangulador)
- [ ] Migrar `utils-ui-v3.js`: helpers UI, Select2 init, `poblarSelect()`
- [ ] Migrar `api-service-v3.js`: las ~20 funciones `get*()`
- [ ] Migrar `paciente-rda-v3.js`: IMC, toggleRDA, campos 1888
- [ ] Migrar `rips-logic-v3.js`: AsignarRIPS, flujos AC/AP
- [ ] Migrar `main-v3.js`: Login, Cargar(), wiring de eventos

## Fase 3: Funcionalidad Nueva (RDA 1888)
- [ ] Implementar lógica RDA Pacientes en `paciente-rda-v3.js`
- [ ] Implementar lógica RDA Consulta Externa
- [ ] Generación de JSON 1888

## Verificación
- [ ] Probar flujo completo AC/AP tras cada migración
- [ ] Probar generación de JSON RDA
- [ ] Recorrido final

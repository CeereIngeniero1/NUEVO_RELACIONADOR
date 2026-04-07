# Checklist de regresión manual

Marcar cada ítem: **OK** / **Falla** / **N/A**. Priorice ejecutar esto antes de fusionar o publicar cambios grandes.

Referencias normativas y de campos:

- [RDA Paciente (1888)](resolucion-1888/rda_paciente.md)
- [RDA Consulta externa (1888)](resolucion-1888/rda_consulta_externa.md)
- [Endpoints RDA consulta externa / IHCE](../back_relacionador/docs/RDA-Consulta-Externa-endpoints.md)
- [Módulo UI RDA `rda/`](../front_relacionador/public/rda/README.md)

## Auth y sesión

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Login con credenciales válidas: recibe token y entra al flujo principal | |
| 2 | Login con credenciales inválidas: mensaje claro, sin bloqueo del navegador | |
| 3 | Acción que requiera sesión/token tras expirar o sin login: comportamiento controlado (401/403 o redirección) | |

## RIPS clásico (2275)

| # | Caso | Resultado |
|---|------|-----------|
| 4 | Cargar datos de paciente / historias según flujo habitual del equipo | |
| 5 | Asignar o registrar RIPS en un caso de prueba conocido (AC/AP según uso real) | |
| 6 | Descarga o validación de archivos RIPS que usen en producción (si aplica) | |

## RDA Paciente (1888)

| # | Caso | Resultado |
|---|------|-----------|
| 7 | Mostrar/ocultar secciones RDA según tipo de RIPS / control de UI | |
| 8 | Completar diagnóstico ingreso CIE-11 (código + término) y verificar que persiste en el armado del mensaje | |
| 9 | Añadir al menos un ítem a una lista dinámica (p. ej. antecedente o medicamento) y eliminarlo | |

## RDA Consulta externa (1888)

| # | Caso | Resultado |
|---|------|-----------|
| 10 | Campos propios CE: diagnóstico ingreso CIE-11 (`RDACE_*`) coherente con catálogo | |
| 11 | Diagnóstico relacionado CIE-11 y antecedente familiar (si los usan): carga y envío sin error | |
| 12 | Revisar contra [RDA-Consulta-Externa-endpoints.md](../back_relacionador/docs/RDA-Consulta-Externa-endpoints.md) al menos una operación crítica (consulta o envío según su flujo) | |

## Salud del sistema

| # | Caso | Resultado |
|---|------|-----------|
| 13 | `GET /health` en backend devuelve `ok: true` | |
| 14 | Front en 3100 y API en 3000: sin errores CORS en acciones típicas (Network) | |
| 15 | Consola del backend sin excepciones no capturadas en el flujo probado | |

---

**Nota:** Los casos 4–12 pueden necesitar datos de prueba en SQL Server; mantenga un paciente/evaluación de laboratorio documentado para no depender de producción.

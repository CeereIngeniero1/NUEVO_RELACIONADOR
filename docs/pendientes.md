# Tareas Pendientes — Relacionador RIPS

---

## Pendientes de la Aplicación

| # | Tarea | Prioridad | Estado |
|---|---|---|---|
| 1 | Finalizar la descarga por parte de Factible | Alta | ⏳ Pendiente |
| 2 | Separar la descarga por parte de Factible | Alta | ⏳ Pendiente |
| 3 | Separar descarga JSON para Particulares y EPS | Alta | ⏳ Pendiente |
| 4 | Módulo para liberar RIPS de factura o presupuestos | Media | ⏳ Pendiente |
| 5 | Reporte para validar los RIPS realizados | Media | ⏳ Pendiente |
| 6 | Manuales de procesos del Relacionador | Baja | ⏳ Pendiente |

---

## Bugs Reportados

| # | Bug | Detalle técnico | Estado |
|---|---|---|---|
| 1 | Relación automática busca facturas anuladas | Agregar exclusión WHERE para no anulados | ⏳ Pendiente |
| 2 | Error descarga JSON para EPS | Nombre de archivo muy largo → reducir `nombreArchivo` | ⏳ Pendiente |
| 3 | Consulta AC: faltan 3 datos | Valor servicio, tipo pago moderador, valor pago moderador | ⏳ Pendiente |
| 4 | Consulta AC: sin filtro acto quirúrgico | Agregar filtro en query SQL | ⏳ Pendiente |

---

## Pendientes RDA (Resolución 1888)

| # | Tarea | Estado |
|---|---|---|
| 1 | Campos RDA Paciente (18 campos) | ✅ Hecho |
| 2 | Campos RDA Consulta Externa (37 exclusivos) | ✅ Hecho |
| 3 | Campos Ocupación (código + nombre CIUO) | ✅ Hecho |
| 4 | Listas dinámicas CE en rda-v3.js | ✅ Hecho |
| 5 | Conectar campos RDA al backend (tabla Entidad1888) | ⏳ Pendiente |
| 6 | Búsqueda/autocompletado CIE-10, CIE-11, CUPS, medicamentos | ⏳ Pendiente |
| 7 | Validar campos obligatorios según la 1888 | ⏳ Pendiente |
| 8 | Generar JSON final estructura 1888 | ⏳ Pendiente |
| 9 | Implementar RDA para otros tipos de atención (urgencias, hospitalización) | ⏳ Futuro |

---

## Pendientes de Documentación

| # | Tarea | Estado |
|---|---|---|
| 1 | Reorganizar docs/ con subcarpetas por resolución | ✅ Hecho |
| 2 | Eliminar archivos obsoletos de la raíz | ✅ Hecho |
| 3 | README unificado | ✅ Hecho |
| 4 | CHANGELOG estándar | ✅ Hecho |
| 5 | Eliminar carpeta `Pendientes/` de la raíz | ⏳ Pendiente |
| 6 | Eliminar `refactorizacion-v3/` (archivos ya migrados) | ⏳ Pendiente |

---

*Última actualización: 27 de febrero de 2026*

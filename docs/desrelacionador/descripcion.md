# Desrelacionador RIPS (UI) — Guía rápida

## ¿Qué es?

El **Desrelacionador RIPS** es una herramienta en el frontend para **revertir un vínculo** entre una **historia clínica (HC)** y un **registro RIPS**.

Cuando se elimina el vínculo:
- La historia vuelve al flujo de **historias pendientes por asignar** en **`Asignar RIPS`**.
- El registro RIPS queda sin la asociación previa, para que se reasigne correctamente.

## ¿Dónde está?

- Página: `front_relacionador/public/Desrelacionar.html`
- Módulo JS: `front_relacionador/public/desrelacionador/`

Acceso típico (si el frontend está en puerto 3100):
- `http://localhost:3100/Desrelacionar.html`

## Flujo de uso

1. Abrir **Desrelacionar**.
2. Llenar:
   - Documento paciente (`Documento paciente`)
   - Rango de fechas (`Fecha inicio` / `Fecha fin`)
3. Presionar **`Buscar relaciones`**.
4. Revisar la tabla **`Relaciones RIPS detectadas`**.
5. Para cada fila, usar el botón **`Desrelacionar`**.
6. Confirmar el cuadro de diálogo para eliminar el vínculo.

## Endpoints usados (backend /apiV3)

El módulo consume estos endpoints:

1. Listado de relaciones:
   - `GET /apiV3/relacionesRipsDesrelacionador/:documentoPaciente/:documentoUsuario/:fechaInicio/:fechaFin`
2. Eliminación del vínculo:
   - `DELETE /apiV3/relacionesRipsDesrelacionador`
   - Body JSON:
     - `idRipsRelacion` (number)
     - `origenTabla` (`"Rips"` o `"RipsV2"`; según la fila)
     - `documentoPaciente` (string)


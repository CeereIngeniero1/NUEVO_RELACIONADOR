# Desrelacionador RIPS (UI) — Guía rápida

## ¿Qué es?

El **Desrelacionador RIPS** es una herramienta en el frontend para **revertir un vínculo** entre una **historia clínica (HC)** y un **registro RIPS**.

Acciones disponibles:
- **Eliminar relación (HC ↔ RIPS)**: elimina el registro RIPS asociado a la evaluación. La historia vuelve a **pendientes** en **`Asignar RIPS`**.
- **Quitar factura/plan (mantener HC ↔ RIPS)**: elimina únicamente la asociación de **factura/plan** dentro del registro RIPS, sin borrar el vínculo HC↔RIPS.

Cuando se elimina la relación HC↔RIPS:
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
   - Documento paciente (`Documento paciente`) *(opcional si busca solo por fechas)*
   - Rango de fechas (`Fecha inicio` / `Fecha fin`)
3. Presionar **`Buscar relaciones`**.
4. Si NO ingresó documento, el sistema mostrará una **lista de pacientes** (en la misma pantalla) encontrados en el rango. Seleccione uno para cargar las relaciones.
5. Revisar la tabla **`Relaciones RIPS detectadas`**.
6. Para cada fila, usar:
   - **`Eliminar relación`** para borrar el vínculo HC↔RIPS (vuelve a pendientes).
   - **`Quitar factura/plan`** para remover factura/plan manteniendo el vínculo HC↔RIPS.

## Endpoints usados (backend /apiV3)

El módulo consume estos endpoints:

1. Listado de relaciones (por documento + rango):
   - `GET /apiV3/relacionesRipsDesrelacionador/:documentoPaciente/:documentoUsuario/:fechaInicio/:fechaFin`
2. Pacientes con relaciones en rango (búsqueda solo por fechas):
   - `GET /apiV3/relacionesRipsDesrelacionador/pacientes/:documentoUsuario/:fechaInicio/:fechaFin`
3. Eliminación del vínculo HC↔RIPS:
   - `DELETE /apiV3/relacionesRipsDesrelacionador`
   - Body JSON:
     - `idRipsRelacion` (number)
     - `documentoPaciente` (string)
4. Quitar factura/plan (mantener vínculo HC↔RIPS):
   - `PATCH /apiV3/relacionesRipsDesrelacionador/factura`
   - Body JSON:
     - `idRipsRelacion` (number)
     - `documentoPaciente` (string)

### Respuestas (contrato esperado)

- `GET .../pacientes/...`:

```json
{ "items": [{ "documentoPaciente": "10203040", "nombrePaciente": "NOMBRE APELLIDO" }] }
```

- `GET .../:documentoPaciente/...`:

```json
{
  "items": [
    {
      "idRipsRelacion": 456,
      "idEvaluacion": 123,
      "prefijoEvalDisplay": "HC",
      "fechaEvaluacion": "2026-04-15T00:00:00.000Z",
      "cupsCie": "890201 / A09",
      "facturaTipo": "sin | fev | eps",
      "facturaEtiqueta": "Sin factura | <No Factura> | Plan #<id>",
      "valorReportado": 0
    }
  ]
}
```

- `DELETE` / `PATCH` (éxito):

```json
{ "message": "..." }
```

- Errores:

```json
{ "error": "..." }
```

## Implementación en backend (referencia)

- Rutas: `back_relacionador/server/routes/desrelacionadorRoutes.js`
- Montaje: `back_relacionador/server/server.js` (montado bajo `app.use('/apiV3', ...)`)

## Verificación rápida (local)

- Salud del backend:
  - `GET http://localhost:3000/health`
- Smoke tests HTTP:
  - `cd back_relacionador && node --test test/http.smoke.test.js`

## Nota importante — facturas “automáticas”

Si en la tabla se ve una **Factura relacionada** aunque el usuario no la haya vinculado manualmente, NO es la UI:

- El backend y la UI solo muestran lo que ya existe en SQL Server en `[Evaluación Entidad Rips]` (`Id Factura` / `Id Plan de Tratamiento`).
- En algunas instalaciones existe lógica en base de datos (triggers) que **auto-asocia** factura/plan al momento de insertar el RIPS.

Referencia en scripts del repo:
- `back_relacionador/SQL/1. SCRIPT PARA RIPS AUTOMATICOS.sql`
  - Trigger `[dbo].[Relacion_Factura_Rips]` (sobre `[Evaluación Entidad Rips]`): si el RIPS se inserta con `Id Factura = 0`, busca una factura del paciente por fecha (`FuncionBuscarFacturaPaciente`) y hace `UPDATE` para asignarla.
  - También existen triggers relacionados para EPS/prepagadas (plan de tratamiento), según configuración de cada BD.


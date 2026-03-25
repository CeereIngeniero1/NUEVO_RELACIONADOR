# Cambios SQL — RDA FHIR y desrelacionador (main)

## Rango comparado (main)
- Antes del merge: `aa590bc`
- Después del merge: `abaf366`
- Commits con cambios en SQL dentro del rango: `6eff0fc`, `abaf366`

## Archivos SQL afectados (y qué pasó en cada uno)

### `back_relacionador/SQL/1888.sql`

**Commit `6eff0fc`**
- Líneas (numstat): `+75 / -30`
- Agregado / actualizado:
  - En la tabla `[dbo].[Evaluacion Entidad RDA]` se agregaron columnas de contexto para FHIR/Composition:
    - `[Id Modalidad Atencion]`
    - `[Id Grupo Servicios]`
    - `[NIT Prestador IPS]`
    - `[Nombre Prestador IPS]`
  - Se agregaron columnas para antecedentes familiares CIE-11:
    - `[CIE11 Codigo]`
    - `[CIE11 Termino]`
  - Se ajustó la definición de **RDA Consulta Externa** para que sea idempotente:
    - La creación de `[Evaluacion Entidad RDA Consulta Externa]` pasa a estar envuelta en `IF OBJECT_ID(... ) IS NULL BEGIN ... END`.
    - Las tablas hijas de RDA CE también se envuelven con `IF OBJECT_ID(... ) IS NULL`.
  - Se incluyó inicialmente la columna `[Id Evaluacion Entidad Origen]` (relacionada con vínculo HC/RDA) dentro del bloque de RDACE.

**Commit `abaf366`**
- Líneas (numstat): `+1 / -8`
- Eliminado:
  - Se eliminó del script `1888.sql` el uso/definición asociada a `[Id Evaluacion Entidad Origen]` en el contexto de la RDA (dejando la configuración como base).

**Total `aa590bc..abaf366`**
- Líneas (numstat): `+68 / -30`

---

### `back_relacionador/SQL/Evaluacion Entidad RDA Consulta Externa - CREATE.sql`

**Commit `6eff0fc`**
- Líneas (numstat): `+5 / -0`
- Agregado:
  - Columnas añadidas al `CREATE TABLE [Evaluacion Entidad RDA Consulta Externa]`:
    - `[Id Modalidad Atencion]`
    - `[Id Grupo Servicios]`
    - `[Id Via Ingreso Usuario]`
    - `[Id Causa Motivo Atencion]`
    - `[Id Evaluacion Entidad Origen]` (vínculo HC/RDA)

**Commit `abaf366`**
- Líneas (numstat): `+0 / -1`
- Eliminado:
  - Se eliminó la columna `[Id Evaluacion Entidad Origen]` del `CREATE TABLE` (se conserva el resto de columnas de contexto).

**Total `aa590bc..abaf366`**
- Líneas (numstat): `+4 / -0`

---

### `back_relacionador/SQL/alter-evaluacion-entidad-rda-id-evaluacion-origen.sql`

**Commit `6eff0fc`**
- Estado: **AGREGADO** (archivo nuevo)
- Líneas: `+20 / -0`
- Agregado (contenido del script):
  - Añade de forma idempotente `[Id Evaluacion Entidad Origen]`:
    - A `[dbo].[Evaluacion Entidad RDA]`
    - A `[dbo].[Evaluacion Entidad RDA Consulta Externa]`

**Commit `abaf366`**
- Estado: **ELIMINADO** (archivo borrado)
- Líneas: `+0 / -20`
- Motivo funcional (según commit): eliminar relación HC↔RDA (dejándolo como estaba de base).

---

### `back_relacionador/SQL/alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql`

**Commit `6eff0fc`**
- Estado: **AGREGADO** (archivo nuevo)
- Líneas: `+59 / -0`
- Agregado (contenido del script):
  - Idempotente con `sys.columns` para:
    - En `[dbo].[Evaluacion Entidad RDA]` agregar:
      - `[Id Modalidad Atencion]`
      - `[Id Grupo Servicios]`
      - `[NIT Prestador IPS]`
      - `[Nombre Prestador IPS]`
    - En `[dbo].[Evaluacion Entidad RDA Antecedentes Familiares]` agregar:
      - `[CIE11 Codigo]`
      - `[CIE11 Termino]`

---

### `back_relacionador/SQL/alter-evaluacion-entidad-rdace-rips-context.sql`

**Commit `6eff0fc`**
- Estado: **AGREGADO** (archivo nuevo)
- Líneas: `+37 / -0`
- Agregado (contenido del script):
  - Idempotente con `sys.columns` para:
    - En `[dbo].[Evaluacion Entidad RDA Consulta Externa]` agregar:
      - `[Id Modalidad Atencion]`
      - `[Id Grupo Servicios]`
      - `[Id Via Ingreso Usuario]`
      - `[Id Causa Motivo Atencion]`

---

## Nota
Este documento describe los cambios en SQL que quedaron incluidos en `main` a partir de `aa590bc` y finalizando en `abaf366` (combinando `6eff0fc` + `abaf366`).


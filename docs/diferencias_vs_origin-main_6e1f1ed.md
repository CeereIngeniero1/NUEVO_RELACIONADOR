# Diferencias: local vs `origin/main@6e1f1ed`

Generado: 2026-03-30  
Repo: `C:\NUEVO_RELACIONADOR`

## Referencias comparadas

- **Base**: `origin/main` en commit `6e1f1ed` (`Punto previo a programar el envío de JSON`)
- **Tu HEAD actual**: `97b0d126231d9af83fc691c90ea37710ab287570` (rama: `sebastian-rda-sobre-main`)

> Nota: Esta comparación es **git** (historia + árbol de trabajo). Además incluye un apartado de **cambios locales sin commit**.

## Estado local (working tree)

Salida relevante:

```text
## sebastian-rda-sobre-main...origin/sebastian-rda-sobre-main [ahead 2]
 M "back_relacionador/server/routes/Asignar_RipsRoutes V3.js"
```

- **La rama local está ahead 2** frente a `origin/sebastian-rda-sobre-main`.
- **Hay 1 archivo modificado sin commit**: `back_relacionador/server/routes/Asignar_RipsRoutes V3.js`.

## Comparación de commits (historia) — `6e1f1ed...HEAD`

Esto muestra commits que existen en **un lado pero no en el otro**:

```text
> 40988c0 Nuevo módulo desrelacionador listo; más cambios UI
> 962550e RDA/FHIR V3: alinear con main; docs token SISPRO (sin secretos)
< ef5b995 fix(RDA): cargar Modalidad/Grupo sin AC/AP
< 9bd9c81 Doc: cambios SQL RDA FHIR y desrelacionador
< e59ced6 Actualiza documentación: desrelacionador, RDA FHIR y endpoints
< abaf366 Se elimina relación entre HC y RDA dejándolo como estaba de base
< 6c47e02 Nuevo módulo desrelacionador listo; más cambios UI
< 6eff0fc RDA: historia clínica sincronizada con RIPS, IdEvaluacionEntidadOrigen en BD/API, UI toolbar y AC/AP segmentado
< 1bd9c5e Respaldo: primera parte construcción del JSON (RDA paciente)
< 09b6180 Punto seguro antes de cambio importante
< aa590bc Unificar modulo RDA en el frontend
< 53a94cc cambios reales fernando
< 3cc60fb dasdasd
< 22ac3c6 Unificar UI de historia/tipo RIPS y corregir 500 AP por defecto
< d520877 Restaurar módulos RDA (state/ui/api) y doc arquitectura desde historial
< 9441970 cambios Fernando bien melo
< e0f4a92 Merge branch 'sebastian-rda-sobre-main'
```

Interpretación:

- `>` **solo está en tu rama actual** (no en `6e1f1ed`).
- `<` **solo está en `6e1f1ed`** (no en tu rama actual).
- Esto indica una **divergencia**: no es solo “mi rama encima de main”, sino que hay commits distintos en ambos lados.

## Resumen global de archivos — `6e1f1ed..HEAD`

```text
37 files changed, 666 insertions(+), 3627 deletions(-)
```

Diffstat (por archivo):

```text
 back_relacionador/SQL/1888.sql                     | 495 +-------------
 ...acion Entidad RDA Consulta Externa - CREATE.sql | 189 ------
 ...aluacion-entidad-rda-rda-paciente-fhir-1888.sql |  59 --
 ...alter-evaluacion-entidad-rdace-rips-context.sql |  37 --
 .../server/routes/Asignar_RipsRoutes V3.js         | 289 ++++++++-
 consulta_token_sispro.md                           |  33 +
 docs/CHANGELOG.md                                  |   6 -
 docs/Envio/consulta_token_sispro.md                |  33 +
 docs/README.md                                     |   4 +-
 docs/arquitectura/api_endpoints.md                 |  39 --
 docs/arquitectura/arquitectura_actual_resumen.md   | 187 ------
 docs/cambios-sql-rda-fhir-desrelacionador.md       | 112 ----
 docs/desrelacionador/descripcion.md                |  42 --
 docs/lista rda consulta externa.txt                |  90 ---
 docs/lista rda paciente.txt                        |  45 --
 docs/resolucion-1888/catalogos_rdace_api.md        |  29 -
 ...on-json-rda-consultaexterna-vs-ig-ministerio.md |  50 --
 ...mparacion-json-rda-paciente-vs-ig-ministerio.md | 159 -----
 .../rda-paciente-lista-vs-json-fhir.md             | 123 ----
 docs/resolucion-1888/rda_consulta_externa.md       |  10 -
 .../resolucion-1888/rda_consulta_externa_bd_api.md |  44 --
 docs/resolucion-1888/rda_paciente.md               |  26 +-
 .../public/Asignar_RIPS V3 experimental.html       |  40 +-
 front_relacionador/public/Asignar_RIPS V3.html     | 529 ++++++---------
 front_relacionador/public/Asignar_RIPS V3.js       | 721 ++-------------------
 front_relacionador/public/Asignar_RIPS.css         |   4 +
 front_relacionador/public/rda-v3.js                | 171 ++---
 front_relacionador/public/rda/api/entidad1888.js   |  23 -
 front_relacionador/public/rda/api/selectsRda.js    |  81 ---
 front_relacionador/public/rda/index.js             |  12 -
 front_relacionador/public/rda/state.js             |  80 ---
 front_relacionador/public/rda/ui/biometria.js      |  25 -
 front_relacionador/public/rda/ui/controlRda.js     |  90 ---
 .../public/rda/ui/listasConsultaExterna.js         | 251 -------
 front_relacionador/public/rda/ui/listasPaciente.js |  91 ---
 front_relacionador/public/rda/ui/renderBadges.js   |  74 ---
 jsonsalida.md                                      |   0
```

## Lista completa de archivos afectados (estado) — `6e1f1ed..HEAD`

`M`=modificado, `A`=agregado, `D`=eliminado.

```text
M	back_relacionador/SQL/1888.sql
D	back_relacionador/SQL/Evaluacion Entidad RDA Consulta Externa - CREATE.sql
D	back_relacionador/SQL/alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql
D	back_relacionador/SQL/alter-evaluacion-entidad-rdace-rips-context.sql
M	back_relacionador/server/routes/Asignar_RipsRoutes V3.js
A	consulta_token_sispro.md
M	docs/CHANGELOG.md
A	docs/Envio/consulta_token_sispro.md
M	docs/README.md
M	docs/arquitectura/api_endpoints.md
D	docs/arquitectura/arquitectura_actual_resumen.md
D	docs/cambios-sql-rda-fhir-desrelacionador.md
D	docs/desrelacionador/descripcion.md
D	docs/lista rda consulta externa.txt
D	docs/lista rda paciente.txt
D	docs/resolucion-1888/catalogos_rdace_api.md
D	docs/resolucion-1888/comparacion-json-rda-consultaexterna-vs-ig-ministerio.md
D	docs/resolucion-1888/comparacion-json-rda-paciente-vs-ig-ministerio.md
D	docs/resolucion-1888/rda-paciente-lista-vs-json-fhir.md
M	docs/resolucion-1888/rda_consulta_externa.md
D	docs/resolucion-1888/rda_consulta_externa_bd_api.md
M	docs/resolucion-1888/rda_paciente.md
M	front_relacionador/public/Asignar_RIPS V3 experimental.html
M	front_relacionador/public/Asignar_RIPS V3.html
M	front_relacionador/public/Asignar_RIPS V3.js
M	front_relacionador/public/Asignar_RIPS.css
M	front_relacionador/public/rda-v3.js
D	front_relacionador/public/rda/api/entidad1888.js
D	front_relacionador/public/rda/api/selectsRda.js
M	front_relacionador/public/rda/index.js
D	front_relacionador/public/rda/state.js
D	front_relacionador/public/rda/ui/biometria.js
D	front_relacionador/public/rda/ui/controlRda.js
D	front_relacionador/public/rda/ui/listasConsultaExterna.js
D	front_relacionador/public/rda/ui/listasPaciente.js
D	front_relacionador/public/rda/ui/renderBadges.js
D	jsonsalida.md
```

## Numstat (líneas agregadas / eliminadas) — `6e1f1ed..HEAD`

Esto ayuda a ver **dónde está lo “más grande”**:

```text
1	494	back_relacionador/SQL/1888.sql
259	30	back_relacionador/server/routes/Asignar_RipsRoutes V3.js
190	339	front_relacionador/public/Asignar_RIPS V3.html
68	653	front_relacionador/public/Asignar_RIPS V3.js
51	120	front_relacionador/public/rda-v3.js
24	16	front_relacionador/public/Asignar_RIPS V3 experimental.html
4	0	front_relacionador/public/Asignar_RIPS.css
33	0	consulta_token_sispro.md
33	0	docs/Envio/consulta_token_sispro.md
2	24	docs/resolucion-1888/rda_paciente.md
1	3	docs/README.md
0	6	docs/CHANGELOG.md
0	39	docs/arquitectura/api_endpoints.md
0	189	back_relacionador/SQL/Evaluacion Entidad RDA Consulta Externa - CREATE.sql
0	59	back_relacionador/SQL/alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql
0	37	back_relacionador/SQL/alter-evaluacion-entidad-rdace-rips-context.sql
0	187	docs/arquitectura/arquitectura_actual_resumen.md
0	112	docs/cambios-sql-rda-fhir-desrelacionador.md
0	42	docs/desrelacionador/descripcion.md
0	90	docs/lista rda consulta externa.txt
0	45	docs/lista rda paciente.txt
0	29	docs/resolucion-1888/catalogos_rdace_api.md
0	50	docs/resolucion-1888/comparacion-json-rda-consultaexterna-vs-ig-ministerio.md
0	159	docs/resolucion-1888/comparacion-json-rda-paciente-vs-ig-ministerio.md
0	123	docs/resolucion-1888/rda-paciente-lista-vs-json-fhir.md
0	10	docs/resolucion-1888/rda_consulta_externa.md
0	44	docs/resolucion-1888/rda_consulta_externa_bd_api.md
0	23	front_relacionador/public/rda/api/entidad1888.js
0	81	front_relacionador/public/rda/api/selectsRda.js
0	12	front_relacionador/public/rda/index.js
0	80	front_relacionador/public/rda/state.js
0	25	front_relacionador/public/rda/ui/biometria.js
0	90	front_relacionador/public/rda/ui/controlRda.js
0	251	front_relacionador/public/rda/ui/listasConsultaExterna.js
0	91	front_relacionador/public/rda/ui/listasPaciente.js
0	74	front_relacionador/public/rda/ui/renderBadges.js
0	0	jsonsalida.md
```

## Diffs “a detalle” (extractos)

Por tamaño, aquí incluyo extractos iniciales (primeras ~250 líneas) de los diffs más representativos.  
Si necesitas **el diff completo** de un archivo, conviene generarlo por archivo (porque `Asignar_RIPS V3.html/js` son muy largos).

### 1) Backend — `back_relacionador/server/routes/Asignar_RipsRoutes V3.js` (vs `6e1f1ed`)

Puntos que se alcanzan a ver en el extracto:

- Se cambia construcción del Bundle FHIR para **no incluir `fullUrl`** en `entry` (IHCE no lo acepta según el texto).
- Se introduce `refOf(...)` para referencias internas con `#<id>`.
- Se agregan `id` determinísticos a recursos (ej. `Condition-0`, `Encounter-0`, etc.).
- Se agrega `Encounter` y se referencia desde `Composition.encounter`.

Extracto del diff:

```diff
diff --git a/back_relacionador/server/routes/Asignar_RipsRoutes V3.js b/back_relacionador/server/routes/Asignar_RipsRoutes V3.js
index aa25440..e98509c 100644
--- a/back_relacionador/server/routes/Asignar_RipsRoutes V3.js
+++ b/back_relacionador/server/routes/Asignar_RipsRoutes V3.js
@@ -3014,13 +3014,19 @@ router.post('/RdaPaciente/FhirBundle', async (req, res) => {
     const makeEntry = (resource) => {
         const entryId = resource.id || newUuid();
         resource.id = entryId;
-        return {
-            fullUrl: `urn:uuid:${entryId}`,
-            resource,
-        };
+        return { resource };
     };
+
+    const refOf = (entryOrResource) => {
+        const r = entryOrResource && entryOrResource.resource ? entryOrResource.resource : entryOrResource;
+        const id = r && r.id ? String(r.id) : '';
+        if (!id) throw new Error('[RDA] No se puede referenciar un recurso sin id');
+        return `#${id}`;
+    };
@@ -3318,27 +3332,39 @@ router.post('/RdaPaciente/FhirBundle', async (req, res) => {
-        const compositionId = newUuid();
+        const compositionId = 'Composition-0';
+
+        // Encounter es requerido por IHCE para deduplicación y validaciones del RDA
+        const encounterEntry = makeEntry({
+            resourceType: 'Encounter',
+            id: 'Encounter-0',
+            status: 'finished',
+            subject: { reference: refOf(patientEntry) },
+            period: { start: periodStart, end: periodEnd },
+            ...(organizationIps ? { serviceProvider: { reference: refOf(organizationIps) } } : {}),
+            participant: practitioner ? [{ individual: { reference: refOf(practitioner) } }] : undefined,
+        });
```

### 2) Frontend — `front_relacionador/public/Asignar_RIPS V3.html` (vs `6e1f1ed`)

Puntos visibles:

- Se separa “CARD 3” (historia clínica/tipo RIPS) y se crea una “CARD 4” para **Asignación de RIPS**.
- Cambian controles de **tipo de RIPS**: pasa de un “segmented” bootstrap a radios más simples (en el extracto se ve un `name` inconsistente: `tipoRipsss` vs `tipoRips`).
- En “CARD 5 — RDA” se simplifica el header/toolbar y se cambia UI de selección tipo RDA.
- Se eliminan selects de modalidad/grupo/vía/causa en varias secciones del RDA.

Extracto del diff:

```diff
diff --git a/front_relacionador/public/Asignar_RIPS V3.html b/front_relacionador/public/Asignar_RIPS V3.html
index 792252e..16574b6 100644
--- a/front_relacionador/public/Asignar_RIPS V3.html
+++ b/front_relacionador/public/Asignar_RIPS V3.html
@@ -483,15 +483,10 @@
-                            <label class="fw-bold d-block mb-1" id="ripsTipoLabel">Tipo de rips a diligenciar</label>
-                            <div class="btn-group rips-tipo-segmented" role="group" aria-labelledby="ripsTipoLabel">
-                                <input type="radio" class="btn-check" name="tipoRips" id="AC" value="AC"
-                                    autocomplete="off">
-                                <label class="btn btn-outline-success btn-sm rips-tipo-segmented__btn" for="AC">AC</label>
-                                <input type="radio" class="btn-check" name="tipoRips" id="AP" value="AP"
-                                    autocomplete="off">
-                                <label class="btn btn-outline-success btn-sm rips-tipo-segmented__btn" for="AP">AP</label>
-                            </div>
+                            <label for="">Tipo de rips a diligenciar</label>
+                            <br>
+                            <label for="ac">AC <input type="radio" name="tipoRipsss" id="AC"></label>
+                            <label for="ap">AP <input type="radio" name="tipoRips" id="AP"></label>
@@ -794,8 +789,21 @@
+            <!-- ... CARD 4 — Asignación de RIPS ... -->
```

### 3) Frontend — `front_relacionador/public/Asignar_RIPS V3.js` (vs `6e1f1ed`)

En el extracto se ve un cambio grande:

- Se elimina un bloque grande de lógica de **cargar/sincronizar** catálogos de Modalidad/Grupo para RDA Paciente y contexto RIPS para RDACE.

Extracto del diff:

```diff
diff --git a/front_relacionador/public/Asignar_RIPS V3.js b/front_relacionador/public/Asignar_RIPS V3.js
index a79d8be..6f77759 100644
--- a/front_relacionador/public/Asignar_RIPS V3.js
+++ b/front_relacionador/public/Asignar_RIPS V3.js
@@ -832,650 +832,6 @@ $(document).ready(function () {
   initProfesionalesSelect2("#RDA_NumDocProfesional");
   initProfesionalesSelect2("#RDACE_NumDocProfesional");
-
-  /** Modalidad / Grupo servicios RDA:
-   *  - Reutiliza los catálogos del módulo Asignar RIPS si ya existen.
-   *  - Si no están cargados, hace fallback a /apiV3.
-   *  - Sincroniza valor automáticamente desde Asignar RIPS -> RDA Paciente.
-   */
-  (async function cargarYSincronizarModalidadYGrupoRdaPaciente() {
-    // ... (muchas líneas removidas) ...
-  })();
-
-  /** RDA Consulta Externa: modalidad, grupo, vía ingreso, causa motivo (mismos catálogos / selects que Asignar RIPS). */
-  (async function cargarYSincronizarRipsContextRdace() {
-    // ... (muchas líneas removidas) ...
-  })();
```

## Cambios locales sin commit (working tree) — `Asignar_RipsRoutes V3.js`

Esto es **lo que tienes modificado localmente** además del `HEAD`:

Puntos visibles:

- `custodianRef` ahora se exige: si falta, **lanza error** (antes era opcional).
- `Encounter.serviceProvider` ahora se setea siempre (en vez de condicional).
- Se refactoriza la construcción de `Organization.identifier` para incluir NIT solo si existe.

Extracto del diff (local vs `HEAD`):

```diff
diff --git a/back_relacionador/server/routes/Asignar_RipsRoutes V3.js b/back_relacionador/server/routes/Asignar_RipsRoutes V3.js
index e98509c..fe1f65b 100644
--- a/back_relacionador/server/routes/Asignar_RipsRoutes V3.js
+++ b/back_relacionador/server/routes/Asignar_RipsRoutes V3.js
@@ -3333,12 +3333,17 @@ router.post('/RdaPaciente/FhirBundle', async (req, res) => {
         const practitionerRef = practitioner ? { reference: refOf(practitioner) } : null;
-        const custodianRef = organizationIps ? { reference: refOf(organizationIps) } : undefined;
+        const custodianRef = organizationIps ? { reference: refOf(organizationIps) } : null;
@@
+        if (!custodianRef) {
+            throw new Error(
+                'No se pudo construir Composition.custodian (IPS). Verifique NitPrestadorIPS y CodigoPrestador en la cabecera RDA.'
+            );
+        }
@@ -3349,7 +3354,7 @@ router.post('/RdaPaciente/FhirBundle', async (req, res) => {
-            ...(organizationIps ? { serviceProvider: { reference: refOf(organizationIps) } } : {}),
+            serviceProvider: { reference: refOf(organizationIps) },
```


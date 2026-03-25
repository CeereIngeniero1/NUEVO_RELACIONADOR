# API Endpoints — Backend Relacionador RIPS

Puerto: `3000`. Todos los endpoints devuelven JSON.

---

## Autenticación

| Método | Prefijo + Ruta | Descripción |
|---|---|---|
| POST | `/api/login` | Login con usuario/contraseña → devuelve JWT + nivel |

> Token JWT con expiración de 8 horas. Ruta protegida de ejemplo: `GET /protected` (requiere header `Authorization`).

---

## Pacientes e Historias Clínicas

**Prefijo:** `/apiV3` (V3 activa) | `/apiV2` (V2)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/pruebaHC` | Test de conexión |
| GET | `/DatosUsuario/:IdEvaluacion` | Datos de usuario por ID evaluación |
| GET | `/UsuariosHC/:DocUsuario/:fechaInicio/:fechaFin` | Listar usuarios con HC en rango de fechas |
| GET | `/DatosdeUsuarioHC/:DocPaciente` | Datos completos del paciente (incluye 1888: género, etnia, discapacidad, residencia, nacionalidad) |
| GET | `/DatosdeHC/:DocPaciente/:DocUsuario/:fechaInicio/:fechaFin` | Historias clínicas del paciente |
| GET | `/ConsultarFacturas/:DocPaciente` | Facturas sin RIPS del paciente |
| GET | `/ConsultarPresupuestos/:DocPaciente` | Presupuestos del paciente |

---

## Catálogos RIPS

**Prefijo:** `/apiV3`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/TipodeRips` | Tipos de RIPS (AC, AP) |
| GET | `/Entidad/:Tipo` | Entidades por tipo |
| GET | `/Entidad` | Todas las entidades |
| GET | `/ModalidadAtencion` | Modalidades de atención |
| GET | `/GrupoServicios` | Grupos de servicios |
| GET | `/Servicios/:Tipo` | Servicios por tipo |
| GET | `/Servicios` | Todos los servicios |
| GET | `/FinalidadV2/:Tipo` | Finalidad tecnología salud |
| GET | `/CausaExterna` | Causas externas |
| GET | `/DXPrincipal` | Tipos de diagnóstico principal |
| GET | `/ViaIngresoUsuario` | Vías de ingreso |
| GET | `/Cups/:Tipo` | Procedimientos CUPS por tipo |
| GET | `/Cie` | Diagnósticos CIE |

---

## Catálogos 1888 (solo en V3)

**Prefijo:** `/apiV3`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/Paises` | Todos los países |
| GET | `/Paises/:NombrePais` | Buscar país por nombre |
| GET | `/Ciudades` | Todos los municipios |
| GET | `/Ciudades/:NombreCiudad` | Buscar municipio por nombre |
| GET | `/TipoDocumento` | Tipos de documento |
| GET | `/TipoDocumento/:Nombre` | Buscar tipo documento |
| GET | `/Sexo/:Sexo` | Buscar sexo |
| GET | `/Sexo/` | Todos los sexos |
| GET | `/identidadSexo/:identidad` | Buscar identidad de género |
| GET | `/identidadSexo/` | Todas las identidades de género |

---

## Asignación de RIPS

**Prefijo:** `/apiV3`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/RegistrarRips/:IdEvaluacion/:TipoUsuario/:Entidad/...` | Registrar RIPS completo (18 parámetros en URL) |
| POST | `/TieneRips/:IdEvaluacion` | Verificar si la evaluación ya tiene RIPS |

## RIPS por Defecto

**Prefijo:** `/apiV3`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/ConsultarRIPSPorDefecto/:DocProfesional/:TipoRIPS` | Consultar RIPS preestablecidos |
| POST | `/GuardarRIPSPorDefecto/:DocProfesional/:TipoRIPS` | Guardar RIPS por defecto |
| POST | `/ActualizarRIPSPorDefecto/:DocProfesional/:TipoRIPS` | Actualizar RIPS por defecto |
| POST | `/EliminarRIPSPorDefecto/:DocProfesional/:TipoRIPS` | Eliminar RIPS por defecto |

---

## Info Pacientes (Particulares)

**Prefijo:** `/apiV2`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/pacientes/:fechaInicio/:fechaFin/:docEmpresa` | Listar pacientes con HC sin RIPS |
| GET | `/evaluaciones/:documento/:fechaInicio/:fechaFin` | Evaluaciones del paciente |
| GET | `/facturas/:documento` | Facturas del paciente |
| GET | `/usuarios/factura/:idFactura` | Detalles de una factura |
| GET | `/buscarFacturas/:documento` | Buscar facturas del paciente |
| POST | `/relacionar` | Relacionar RIPS con factura |
| POST | `/facturaCero/:docEmpresa` | Asignar factura 0 |

---

## EPS / Prepagadas

**Prefijo:** `/apiv2`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/EPS/:fechaInicio/:fechaFin` | Listar EPS con facturas pendientes |
| GET | `/pacientesEPS/:idFactura` | Pacientes de una factura EPS |
| GET | `/hcPacientesEPS/:docPaciente` | HC del paciente EPS |
| POST | `/relacionarEPS/:idFactura/:idEveRips/:idTratamiento` | Relacionar RIPS EPS |
| GET | `/PacientesTratamientosFacturaEps/:idFactura` | Tratamientos de factura EPS |
| GET | `/RipsPacientesTratamientosEps/:DocPaciente/:DocEPS/:IdTrat` | RIPS de tratamiento EPS |

---

## Descarga de RIPS (JSON)

**Prefijo:** `/RIPS` (V1) | `/RIPSv2` (V2)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/usuarios/ripsParticular/:fechaInicio/:fechaFin/:Resoluciones/:docEmpresa` | Generar JSON RIPS particulares |
| GET | `/usuarios/rips/:fechaInicio/:fechaFin/:Resoluciones/:docEmpresa` | Generar JSON RIPS general |
| GET | `/servicios/ripsAC/:idEvaRips/:IdTrata/:IdFactura/:numDoc` | Datos servicio AC |
| GET | `/servicios/ripsAP/:idEvaRips/:IdTrata/:IdFactura/:numDoc` | Datos servicio AP |
| GET | `/serviciosEPS/ripsAC/:idEvaRips/:IdTrata/:IdFactura/:numDoc` | Datos servicio AC (EPS) |
| GET | `/serviciosEPS/ripsAP/:idEvaRips/:IdTrata/:IdFactura/:numDoc` | Datos servicio AP (EPS) |
| POST | `/generar-zip/:fechaInicio/:fechaFin/:prefijo` | Generar ZIP de archivos RIPS |

---

## Maestro de Listas RIPS

**Prefijo:** `/api`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/ListarMaestroRIPS?Tipo=X` | Listar catálogo (Tipo: ModalidadGrupoServicioTecSal, GrupoServicios, Servicios, FinalidadTecnologiaSalud, CausaMotivoAtencion, ViaIngresoServicioSalud) |
| POST | `/ActualizarElemento` | Activar/desactivar un elemento del catálogo |
| POST | `/ActualizarTodo` | Activar/desactivar todo un catálogo |

---

## XMLS (Facturación Electrónica)

**Prefijo:** `/XMLS`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/mostrar-empresas-con-resoluciones-vigentes` | Empresas con resoluciones activas |
| GET | `/mostrar-resoluciones-vigentes-segun-empresa-seleccionada/:empresa` | Resoluciones de una empresa |
| POST | `/descargarxmls-api-facturatech/:prefijo/:fechaInicio/:fechaFin` | Descargar XMLs vía Facturatech |
| POST | `/descargarxmls-api-fenalco/:prefijo/:fechaInicio/:fechaFin/:docEmpresa` | Descargar XMLs vía Fenalco |
| GET | `/Facturador/:DocEmpresa` | Info facturador |

---

## SSE (Server-Sent Events)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/sse` | Conexión SSE para actualizaciones en tiempo real |

---

## RDA Paciente — FHIR Bundle (V3)

**Prefijo:** `/apiV3`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/RdaPaciente/FhirBundle` | Construye un `Bundle` FHIR tipo `document` (Composition + Patient + recursos clínicos) a partir de `IdEvaluacionEntidadRDA` en BD. |

**Body recomendado:**
```json
{ "IdEvaluacionEntidadRDA": 123 }
```

---

## Desrelacionador de RIPS (V3)

**Prefijo:** `/apiV3`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/relacionesRipsDesrelacionador/:documentoPaciente/:documentoUsuario/:fechaInicio/:fechaFin` | Lista relaciones RIPS detectadas para el documento paciente y rango de fechas. |
| DELETE | `/relacionesRipsDesrelacionador` | Desvincula (elimina vínculo) de una relación RIPS. |

**Body DELETE:**
```json
{
  "idRipsRelacion": 456,
  "origenTabla": "Rips",
  "documentoPaciente": "10203040"
}
```

---

## Nota sobre versiones

El backend tiene **3 versiones activas simultáneas** de las rutas de asignación de RIPS:

| Prefijo | Archivo | Usado por |
|---|---|---|
| `/api` | `Asignar_RipsRoutes.js` | V1 (obsoleta) |
| `/apiV2` | `Asignar_RipsRoutes V2.js` | V2 (obsoleta) |
| `/apiV3` | `Asignar_RipsRoutes V3.js` | **V3 (activa)** |

Solo las rutas con prefijo `/apiV3` incluyen los endpoints de la Resolución 1888 (Países, Ciudades, Sexo, Identidad de Género).

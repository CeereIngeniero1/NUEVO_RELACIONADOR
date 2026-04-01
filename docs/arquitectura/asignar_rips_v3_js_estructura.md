# Estructura logica - `Asignar_RIPS V3.js`

Referencia para orientarse en el script de la pantalla **Asignar RIPS V3** sin recorrer miles de lineas de corrido. Complementa la descripcion del markup en [asignar_rips_v3_html_estructura.md](./asignar_rips_v3_html_estructura.md).

- **Archivo:** `front_relacionador/public/Asignar_RIPS V3.js`
- **Orden de magnitud:** ~5 479 lineas (tras refactor RDA a `rda/bootstrap/`)
- **Dependencias globales:** `servidor` (`localStorage.NombreEquipoServidor`), jQuery, SweetAlert2 / Swal, Bootstrap modal, Select2
- **RDA y biometria:** delegados al modulo ES `public/rda/index.js` y su subcarpeta `rda/bootstrap/` (antes estaban incrustados en el `$(document).ready` de este archivo)

Los numeros de linea son orientativos (revisiones del repo pueden desplazarlos ligeramente).

---

## 1. Mapa por bloques (lineas aproximadas)

| Rango | Rol |
|--------|-----|
| 1-270 | Configuracion (`servidor`), utilidades (`setLoadingState`), `VerificarLogin`, modal "consultar", `Cargar` (pacientes con HC sin RIPS via `GET .../apiV3/UsuariosHC/...`) |
| 273-544 | `LlenarSelectDeHistoriasClinicas` (`GET .../DatosdeHC/...`), carga de datos de paciente (`DatosdeUsuarioHC`), referencias DOM (contenedores AC/AP) |
| 545-613 | `$(document).ready`: solo Select2 para selects RIPS con texto largo (CUPS, diagnosticos, modal RIPS por defecto). El cableado RDA que antes vivia aqui (~1321 lineas) fue extraido a `rda/bootstrap/` |
| 615-1244 | `radioAC` y `radioAP`: cascadas de selects AC/AP (`TipodeRips`, `Entidad`, `ModalidadAtencion`, `GrupoServicios`, `Servicios`, `FinalidadV2`, `CausaExterna`, `DXPrincipal`, `Cups`, `Cie`, `ViaIngresoUsuario`, ...) |
| 1246-1722 | Definiciones de listas tipo "card", `pruebaAlert`, **`AsignarRIPS`** (POST masivo a `RegistrarRips`), `btnRegistrarRIPS`, `NoAsignarRIPS` |
| 1724-2195 | **`RegistrarRIPS`** (flujo tarjetas) -> **`insertarRIPSHC`** -> `POST .../apiV3/insertarRIPS/:tipo` |
| 2195-3097 | Helpers "tablet/card": `ejecutarConsultasAC/AP`, `getEvaluaciones`, `getTipoUsuario`, `getTipoEntidad`, `getCodConsulta`, ..., SweetAlert rango de fechas |
| 3097-4387 | **RIPS por defecto** (modal): `ConsultarRIPSPorDefecto`, `TraerInfoParaRIPSACPorDefecto` / AP, ver resumen (Bootbox) |
| 4387-4425 | Cierre modal: `reiniciarSelect` |
| 4427-5363 | CRUD RIPS por defecto: `GuardarRIPSPorDefecto`, `ActualizarRIPSPorDefecto`, `EliminarRIPSPorDefecto`, `CargarRIPSPorDefecto` |
| 5365-5459 | `TraerFacturasPaciente`, `TraerPresupuestosPaciente`, `AgregarOpcionPorDefecto` |
| 5474-5479 | Comentario: RDA/biometria en `rda/index.js` |

---

## 2. Dos vias de "asignar" RIPS (importante)

En la misma pagina conviven **dos UX** con **contratos distintos** al backend:

1. **Formulario principal** (historia en `#HistoriasSinRIPS`, radios AC/AP, selects con prefijos `Select...`):
   - Entrada: **`AsignarRIPS`**.
   - Salida: **`POST`** a `http://${servidor}:3000/apiV3/RegistrarRips/${...}` con muchos segmentos en el path (incluye `Id Factura` / `Id Presupuesto` y documento paciente al final).
   - Disparo: **`btnRegistrarRIPS`** llama directamente a `AsignarRIPS()`.

2. **Tarjetas colapsables** (IDs tipo `#listaHC`, `#listaTipoUsuario`, `#listaEntidad`, `#listaCodConsulta`, ...):
   - Entrada: **`RegistrarRIPS`**, pensado para usarse tras confirmacion en **`pruebaAlert`**.
   - Salida: **`insertarRIPSHC('AC'|'AP')`** -> **`POST .../apiV3/insertarRIPS/${tipoInsertar}`** con cuerpo JSON.

Para mantenimiento: al cambiar reglas de negocio o validacion, hay que revisar **ambas** rutas si la pagina sigue usando las dos.

---

## 3. Patrones de API (`/apiV3`)

- **URL base:** `http://${servidor}:3000/apiV3` donde `servidor = localStorage.getItem("NombreEquipoServidor")`.
- **Catalogos RIPS:** `TipodeRips`, `Entidad`, `ModalidadAtencion`, `GrupoServicios`, `Servicios`, `FinalidadV2/...`, `CausaExterna`, `DXPrincipal`, `Cups`, `Cie`, `ViaIngresoUsuario`, etc.
- **Pacientes / HC:** `UsuariosHC`, `DatosdeHC`, `DatosdeUsuarioHC`, `evaluacionesRIPS`.
- **Paciente / RDA CE (1888):** ahora en `rda/bootstrap/` (`Paises`, `Ciudades`, `MedicamentosDCI`, `Cups1888`, `Profesionales`, `Catalogo1888/:clave`, `FactorDeRiesgo`, `TipoTecnologiaEnSalud`, `EgresoRemision`, `icd11/search`, `ActualizarPaciente`, etc.)
- **RIPS por defecto:** `ConsultarRIPSPorDefecto/:doc/:tipo`, `GuardarRIPSPorDefecto`, actualizar/eliminar/cargar.

---

## 4. Select2 y modales

- Varios `<select>` de texto largo usan **Select2** con plantilla que trunca a 50 caracteres.
- Los Select2 del **modal RIPS por defecto** usan `dropdownParent: $("#ModalRIPSPorDefecto")` para que el desplegable no quede bajo el backdrop.

---

## 5. Modulo RDA extraido (`rda/bootstrap/`)

La logica RDA que antes ocupaba ~1321 lineas dentro de `$(document).ready` fue movida a modulos ES bajo `front_relacionador/public/rda/bootstrap/`:

| Archivo | Responsabilidad |
|---------|-----------------|
| `initAsignarWireup.js` | Orquestador: llama los 4 sub-modulos en orden |
| `wireCieSelect2.js` | `initCIE11Select2` / `initCIE10Select2` para campos `RDA_*` / `RDACE_*` |
| `wireRdaceCatalogs.js` | MedicamentosDCI, Cups1888, Profesionales, EgresoRemision, Catalogo1888 (generico), FactorDeRiesgo, TipoTecnologiaEnSalud |
| `wireSyncRips.js` | Sync selects Asignar RIPS -> campos RDA/RDACE (modalidad, grupo, via ingreso, causa) |
| `wireDemografiaPaciente.js` | Selects demograficos (pais, municipio, tipo doc, sexo, etnia, discapacidad, ocupacion, etc.) + `ActualizarPaciente` |

Se invocan desde `rda/index.js` via `initAsignarRdaWireup()`, despues de los init internos de RDA.

---

## 6. Escalabilidad para nuevos tipos RDA

Para agregar un nuevo tipo (ej. `RDAURG_` para urgencias):

1. Crear seccion HTML con prefijo `RDAURG_` en IDs
2. Agregar rama en `rda/ui/controlRda.js` (radio + seccion)
3. Crear `rda/bootstrap/wireRdaurgCatalogs.js` (o equivalente) e importar en `initAsignarWireup.js`
4. Extender `rda/state.js` si el nuevo tipo tiene listas dinamicas
5. Extender `rda/json/build1888.js` si genera JSON FHIR

---

*Ultima revision alineada al archivo de ~5 479 lineas en el workspace.*

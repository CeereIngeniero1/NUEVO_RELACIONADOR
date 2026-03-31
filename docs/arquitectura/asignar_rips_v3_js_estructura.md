# Estructura lógica — `Asignar_RIPS V3.js`

Referencia para orientarse en el script de la pantalla **Asignar RIPS V3** sin recorrer ~6 800 líneas de corrido. Complementa la descripción del markup en [asignar_rips_v3_html_estructura.md](./asignar_rips_v3_html_estructura.md).

- **Archivo:** `front_relacionador/public/Asignar_RIPS V3.js`
- **Orden de magnitud:** ~6 801 líneas
- **Dependencias globales:** `servidor` (`localStorage.NombreEquipoServidor`), jQuery, SweetAlert2 / Swal, Bootstrap modal, Select2
- **RDA y biometría:** no están implementados en este archivo; al final del JS se indica delegación al módulo ES `public/rda/index.js`

Los números de línea son orientativos (revisiones del repo pueden desplazarlos ligeramente).

---

## 1. Mapa por bloques (líneas aproximadas)

| Rango | Rol |
|--------|-----|
| 1–270 | Configuración (`servidor`), utilidades (`setLoadingState`), `VerificarLogin`, modal “consultar”, `Cargar` (pacientes con HC sin RIPS vía `GET .../apiV3/UsuariosHC/...`) |
| 273–544 | `LlenarSelectDeHistoriasClinicas` (`GET .../DatosdeHC/...`), carga de datos de paciente (`DatosdeUsuarioHC`), referencias DOM (diagnósticos RDA, contenedores AC/AP) |
| 545–1934 | `$(document).ready)`: Select2 (CUPS, CIE, país/municipio, medicamentos DCI, profesionales, catálogos RDA CE, etc.), muchos `fetch` a `/apiV3/...`, `ActualizarPaciente`, inicialización CIE-10/CIE-11 |
| 1936–2565 | `radioAC` → cascada de selects AC (`TipodeRips`, `Entidad`, `ModalidadAtencion`, `GrupoServicios`, `Servicios`, `FinalidadV2`, `CausaExterna`, `DXPrincipal`, `Cups`, `Cie`, …) |
| 2567–3043 | `radioAP` → cascada AP (incluye `ViaIngresoUsuario`, procedimientos/diagnósticos); listeners de filtrado entidad/grupo/servicio con `data-category` y eventos `CustomEvent` para valores por defecto |
| 3046–3516 | Definiciones de listas tipo “card”, `pruebaAlert` (confirmación → `RegistrarRIPS`), **`AsignarRIPS`** (POST masivo a `RegistrarRips`), `btnRegistrarRIPS` → `AsignarRIPS` |
| 3518–3600 | `NoAsignarRIPS`, botón “no registrar” |
| 3603–3831 | **`RegistrarRIPS`** (flujo tarjetas `#listaTipoUsuario`, etc.) → **`insertarRIPSHC`** → `POST .../apiV3/insertarRIPS/:tipo` |
| 3833–4417 | Helpers “tablet/card”: `ejecutarConsultasAC` / `ejecutarConsultasAP`, `getEvaluaciones` (`evaluacionesRIPS`), `getTipoUsuario`, `getTipoEntidad`, `getCodConsulta`, …, SweetAlert rango de fechas |
| 4418–5708 | **RIPS por defecto** (modal): `ConsultarRIPSPorDefecto`, `TraerInfoParaRIPSACPorDefecto` / AP, ver resumen (Bootbox), selectores paralelos a los del formulario principal |
| 5710–5746 | Cierre modal: `reiniciarSelect` |
| 5748–6684 | CRUD RIPS por defecto: `GuardarRIPSPorDefecto`, `ActualizarRIPSPorDefecto`, `EliminarRIPSPorDefecto`, `CargarRIPSPorDefecto` (`POST .../GuardarRIPSPorDefecto`, etc.) |
| 6686–6780 | `TraerFacturasPaciente`, `TraerPresupuestosPaciente`, `AgregarOpcionPorDefecto` |
| 6795–6800 | Comentario: RDA/biometría en `rda/index.js` |

---

## 2. Dos vías de “asignar” RIPS (importante)

En la misma página conviven **dos UX** con **contratos distintos** al backend:

1. **Formulario principal** (historia en `#HistoriasSinRIPS`, radios AC/AP, selects con prefijos `Select…`):
   - Entrada: **`AsignarRIPS`** (aprox. línea 3116).
   - Salida: **`POST`** a `http://${servidor}:3000/apiV3/RegistrarRips/${...}` con muchos segmentos en el path (incluye `Id Factura` / `Id Presupuesto` y documento paciente al final).
   - Disparo: **`btnRegistrarRIPS`** llama directamente a `AsignarRIPS()` (no pasa por el `Swal` de `pruebaAlert` salvo que otro código lo use).

2. **Tarjetas colapsables** (IDs tipo `#listaHC`, `#listaTipoUsuario`, `#listaEntidad`, `#listaCodConsulta`, …):
   - Entrada: **`RegistrarRIPS`** (aprox. línea 3603), pensado para usarse tras confirmación en **`pruebaAlert`**.
   - Salida: **`insertarRIPSHC('AC'|'AP')`** → **`POST .../apiV3/insertarRIPS/${tipoInsertar}`** con cuerpo JSON (`opcionListaHC`, `opcionListaTipoUsuario`, …).

Para mantenimiento: al cambiar reglas de negocio o validación, hay que revisar **ambas** rutas si la pantalla sigue usando las dos.

---

## 3. Patrones de API (`/apiV3`)

- **URL base:** ``http://${servidor}:3000/apiV3`` donde `servidor = localStorage.getItem("NombreEquipoServidor")`.
- **Catálogos RIPS:** `TipodeRips`, `Entidad`, `ModalidadAtencion`, `GrupoServicios`, `Servicios`, `FinalidadV2/...`, `CausaExterna`, `DXPrincipal`, `Cups`, `Cie`, `ViaIngresoUsuario`, etc.
- **Pacientes / HC:** `UsuariosHC`, `DatosdeHC`, `DatosdeUsuarioHC`, `evaluacionesRIPS`.
- **Paciente / RDA CE (1888):** `Paises`, `Ciudades`, `MedicamentosDCI`, `Cups1888`, `Profesionales`, `Catalogo1888/:clave`, `FactorDeRiesgo`, `TipoTecnologiaEnSalud`, `ViaIngresoUsuario`, `EgresoRemision`, diagnósticos `icd11/search`, `ActualizarPaciente`, etc.
- **RIPS por defecto:** `ConsultarRIPSPorDefecto/:doc/:tipo`, `GuardarRIPSPorDefecto`, actualizar/eliminar/cargar (rutas declaradas más abajo en el mismo archivo según el caso).

---

## 4. Select2 y modales

- Varios `<select>` de texto largo usan **Select2** con plantilla que trunca a 50 caracteres.
- Los Select2 del **modal RIPS por defeto** usan `dropdownParent: $("#ModalRIPSPorDefecto")` para que el desplegable no quede bajo el backdrop.

---

## 5. Funciones nombradas (índice rápido)

| Función | Ubicación aprox. | Nota |
|---------|------------------|------|
| `setLoadingState` | ~5 | Estado carga en botones |
| `VerificarLogin` | ~17 | Token; redirección a `index.html` |
| `MostrarMensajeDeCarga` | ~57 | Swal con loader |
| `Cargar` | ~160 | Lista pacientes HC sin RIPS |
| `LlenarSelectDeHistoriasClinicas` | ~273 | HC del paciente elegido en `listaHC` |
| `ejecutarConsultasAC` / `ejecutarConsultasAP` | ~3833 | Poblar selects del flujo “lista*” |
| `AsignarRIPS` | ~3116 | POST `RegistrarRips` (path largo) |
| `NoAsignarRIPS` | ~3521 | Marcar historia sin asignar RIPS (API en el cuerpo de la función) |
| `RegistrarRIPS` | ~3603 | Validación tarjetas → `insertarRIPSHC` |
| `insertarRIPSHC` | ~3758 | POST `insertarRIPS` |
| `GuardarRIPSPorDefecto` / `ActualizarRIPSPorDefecto` / `EliminarRIPSPorDefecto` | ~5750+ | CRUD plantillas |
| `CargarRIPSPorDefecto` | ~6207 | Aplicar plantilla a formulario |
| `TraerFacturasPaciente` / `TraerPresupuestosPaciente` | ~6686 | Opciones factura/presupuesto |

---

## 6. Relación con RDA

Al cierre del archivo, un comentario bloque señala que la **lógica V3 de RDA y biometría** vive en el módulo ES **`public/rda/index.js`** (y archivos que este importe). Este `Asignar_RIPS V3.js` se limita a cablear catálogos y formularios que el HTML expone.

---

*Última revisión alineada al archivo de ~6 801 líneas en el workspace.*

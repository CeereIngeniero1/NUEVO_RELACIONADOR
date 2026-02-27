# Relacionador RIPS - Version 3 (V3)

Documento que describe las funcionalidades incluidas en la version V3 y las que estan pendientes por implementar.

---

## Que incluye actualmente la V3

### 1. Nueva seccion de Datos del Paciente (RDA)

La seccion "Datos del paciente" fue completamente rediseñada para cumplir con los requisitos del **Resumen Digital de Atencion (RDA)**. En V2 solo se mostraban 6 campos de solo lectura. En V3 se expandio a mas de 20 campos editables organizados en filas logicas.

#### Campos de Identificacion y Nombres
| Campo | ID | Tipo | Nuevo en V3 |
|---|---|---|---|
| Tipo Documento | `TipoDocumentoBase` | Select (CC, TI, RC, CE, PA, PE, PT) | Si |
| Numero Documento | `DocumentoPaciente` | Input texto | No (existia) |
| Primer Apellido | `PrimerApellidoBase` | Input texto | Si |
| Segundo Apellido | `SegundoApellidoBase` | Input texto | Si |
| Primer Nombre | `PrimerNombreBase` | Input texto | Si |
| Segundo Nombre | `SegundoNombreBase` | Input texto | Si |

> En V2 solo existia un campo "Nombre completo" (`NombrePaciente`). En V3 se separo en campos individuales para cumplir con el estandar RDA.

#### Campos de Nacimiento, Genero y Nacionalidad
| Campo | ID | Tipo | Nuevo en V3 |
|---|---|---|---|
| Fecha y Hora Nacimiento | `FechaNacimientoBase` | datetime-local | Si |
| Edad | `EdadPaciente` | Input (readonly) | No (existia) |
| Sexo Biologico | `SexoPaciente` | Select (M/F) | Modificado |
| Identidad de Genero | `IdentidadGeneroBase` | Select (5 opciones) | Si |
| Nacionalidad (Pais) | `CodPaisNacionalidadBase` / `NombrePaisNacionalidadBase` | Input doble (Cod + Nombre) | Si |

#### Datos Biometricos (Nuevo en V3)
| Campo | ID | Tipo |
|---|---|---|
| Talla (cm) | `TallaPaciente` | Input numerico |
| Peso (kg) | `PesoPaciente` | Input numerico (step 0.1) |
| IMC | `IMCPaciente` | Input (readonly, calculo automatico) |

#### Campos de Ubicacion y Demografia
| Campo | ID | Tipo | Nuevo en V3 |
|---|---|---|---|
| Pais Residencia | `CodPaisResidenciaBase` / `NombrePaisResidenciaBase` | Input doble (Cod + Nombre) | Si |
| Municipio Residencia | `CodMunicipioResidenciaBase` / `NombreMunicipioResidenciaBase` | Input doble (Cod + Nombre) | Si |
| Zona Territorial | `ZonaTerritorialBase` | Select (Urbana/Rural) | Si |
| Direccion | `DireccionPaciente` | Input texto | No (existia) |

#### Campos de Demografia Social
| Campo | ID | Tipo |
|---|---|---|
| Etnia | `EtniaBase` | Select (6 opciones: Indigena, Rrom, Raizal, Palenquero, Afro, Ninguno) |
| Comunidad Etnica | `ComunidadEtnicaBase` | Input texto |
| Discapacidad | `DiscapacidadBase` | Select (8 opciones: No aplica, Fisica, Auditiva, Visual, Sordoceguera, Intelectual, Mental, Multiple) |
| Telefono | `TelefonoPaciente` | Input texto |

#### Seccion de Alergias (Nueva en V3)
| Campo | ID | Tipo |
|---|---|---|
| Tiene Alergias? | `TieneAlergiaBase` | Checkbox |
| Nombre del Alergeno / Detalles | `NombreAlergenoBase` | Input texto (habilitado al marcar checkbox, agregar con ENTER) |

### 2. Archivo JavaScript dedicado (V3.js)

Se creo un nuevo archivo `Asignar_RIPS V3.js` (219 KB) dedicado a V3, separado del `Asignar_RIPS V2.js` (217 KB), para incorporar la logica adicional de los nuevos campos RDA sin afectar la version estable en produccion.

### 3. Compatibilidad con version anterior

Se mantiene un input oculto `NombrePaciente` (`type="hidden"`) para compatibilidad temporal con el JS existente, permitiendo una transicion gradual.

### 4. Mejoras de estructura HTML

La seccion de datos del paciente ahora esta encapsulada dentro de su propia `div.row`, separada logicamente de las secciones de:
- Seleccion de historia clinica y tipo de RIPS
- Asignacion de RIPS (AC/AP)
- Registro de RIPS

### 5. Funcionalidades heredadas de V2 (se mantienen)

- Seleccion de paciente con buscador
- Busqueda por Facturas (Particular) y Presupuestos (EPS)
- Asignacion de RIPS tipo AC (Consultas)
- Asignacion de RIPS tipo AP (Procedimientos)
- RIPS por defecto (Asignar, Cargar, Guardar, Actualizar, Eliminar)
- Seleccion de Consulta RIPS, Diagnostico RIPS, Procedimiento RIPS
- Selectores con buscador (Select2)
- Registro y no registro de RIPS a historia
- Boton Regresar a pantalla principal

---

## Que falta por implementar

### Pendientes de la aplicacion

| # | Tarea | Estado |
|---|---|---|
| 1 | Finalizar la descarga por parte de Factible | Pendiente |
| 2 | Separar la descarga por parte de Factible | Pendiente |
| 3 | Separar la descarga de los JSON para Particulares y EPS | Pendiente |
| 4 | Realizar modulo para liberar RIPS de factura o presupuestos | Pendiente |
| 5 | Realizar reporte para validar los RIPS realizados | Pendiente |
| 6 | Realizar manuales de todos los procesos en el Relacionador | Pendiente |

### Pendientes tecnicos (reportados)

| # | Tarea | Estado |
|---|---|---|
| 1 | La relacion automatica busca facturas y presupuestos anulados - agregar exclusion | Pendiente |
| 2 | Error de descarga de JSON cuando es EPS (nombre de archivo muy largo) - modificar nombres de archivo en la descarga | Pendiente |
| 3 | Consulta AC: faltan 3 datos (valor servicio, tipo pago moderador, valor pago moderador) | Pendiente |
| 4 | Consulta AC: falta filtro de acto quirurgico | Pendiente |

### Pendientes de la seccion RDA (V3)

| # | Tarea | Estado |
|---|---|---|
| 1 | Conectar la carga automatica de datos del paciente a los nuevos campos RDA desde el backend | Pendiente |
| 2 | Implementar calculo automatico de IMC a partir de Talla y Peso | Pendiente |
| 3 | Implementar logica de alergias (agregar/eliminar alergenos con ENTER) | Pendiente |
| 4 | Validar y mapear los datos RDA al JSON de salida para envio | Pendiente |
| 5 | Implementar busqueda/autocompletado para campos de pais y municipio con codigos DANE | Pendiente |

---

## Estructura de archivos V3

```
front_relacionador/public/
  Asignar_RIPS V3.html   (59 KB)  -- Pagina principal V3
  Asignar_RIPS V3.js     (219 KB) -- Logica JavaScript V3
  Asignar_RIPS.css        (1 KB)  -- Estilos compartidos

Archivos de referencia (raiz):
  SECCION_DATOS_PACIENTE_RDA.html  -- Plantilla HTML de la seccion RDA
  NOTA_CAMBIOS.txt                 -- Notas internas de cambios
  Version                          -- Historial de versiones (hasta v1.0.6)
  Pendientes/                      -- Tareas pendientes documentadas
```

---

## Historial de versiones previas

| Version | Cambios principales |
|---|---|
| **1.0.5** | Incorporacion de opcion RipSin en el generador de JSON |
| **1.0.6** | Correccion codigo postal (>5 digitos), separacion consecutivos EPS/particulares, correccion calculo valores de servicios (copago + valor total) |

---

*Documento generado el 24 de febrero de 2026*

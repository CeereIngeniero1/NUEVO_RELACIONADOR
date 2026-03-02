# Guía de Scripts SQL

Orden de ejecución y propósito de cada script en `back_relacionador/SQL/`.

---

## ⚠️ Antes de ejecutar

- Hacer **backup** de la base de datos
- Ejecutar en **SQL Server Management Studio (SSMS)**
- Algunos scripts usan `CREATE`, cambiar a `ALTER` si el objeto ya existe
- Verificar que la instancia esté configurada (ver [backend.md](backend.md))

---

## Orden de ejecución — Primera instalación

### Fase 1: Estructura base (obligatorio)

| Orden | Archivo | Qué hace | Tamaño |
|---|---|---|---|
| **1** | `1. SCRIPT PARA RIPS AUTOMATICOS.sql` | Crea funciones y triggers para la relación automática factura↔RIPS (particular y EPS/prepagada) | 17 KB |
| **2** | `2. Datos de las tablas de rips y cups.sql` | Inserta los catálogos RIPS y CUPS completos | **8 MB** ⚠️ |
| **3** | `3. Query.sql` | Queries principales del relacionador | 30 KB |
| **4** | `4. QUERRYS Asignar Rips.sql` | Queries para asignación de RIPS AC/AP | 48 KB |
| **5** | `5. CREACION_VISTAS_MAESTRO.sql` | Crea 6 vistas para el maestro de listas RIPS (modalidad, servicios, grupo servicios, causa motivo, finalidad, vía ingreso) | 3 KB |
| **6** | `6. PARA_CONSECUTIVO.sql` | Agrega columna `ConsecutivoRipsFacturaEnCero` a la tabla de RIPS | 0.4 KB |

### Fase 2: Tablas V2 (obligatorio para V2+)

| Orden | Archivo | Qué hace | Tamaño |
|---|---|---|---|
| **7** | `NUEVAS TABLAS RIPS.sql` | Crea tabla `[Evaluación Entidad Rips V2]`, vista `Cnsta Relacionador Servicios V2`, vistas de historias V2 | 9 KB |
| **8** | `11. Tabla_Rips_2275.sql` | Crea tabla `Rips_2275` con todas las FK, tabla `RIPS_Tipo_De_Archivo`, tabla `Entidad_Rips_2275` | 3 KB |
| **9** | `Funciones_Vistas_SQL_SERVER.sql` | Funciones `CalcularEdadPaciente`, `CalcularUnidadDeMedidaDeLaEdad` + consultas RIPS (AC, AP, AF, US) | 10 KB |
| **10** | `10. Funcion consecutivos Eps particular.sql` | Función `Documento_EPS` para separar consecutivos EPS/particular | 0.3 KB |

### Fase 3: Resolución 1888 (obligatorio para V3 + RDA)

| Orden | Archivo | Qué hace | Tamaño |
|---|---|---|---|
| **11** | `1888.sql` | Crea tablas: `Entidad1888`, `Discapacidad`, `Sexo Identidad Genero`, `Etnia`, tablas de países y municipios. ALTER para agregar columnas de nacionalidad/residencia | 10 KB |
| **12** | `1888 Insertar.sql` | Inserta registros iniciales en `Entidad1888` para todos los pacientes. Crea triggers: `TR_Entidad_Update_Doc` (sincroniza doc), `TR_Entidad_Insert` (inserta automático al crear paciente) | 2 KB |
| **13** | `insert_paises.sql` | Inserta catálogo de países (códigos ISO) | 22 KB |
| **14** | `insert_ciudad1888_municipios.sql` | Inserta catálogo de municipios colombianos (códigos DANE) | 34 KB |

### Fase 4: Datos complementarios

| Orden | Archivo | Qué hace | Tamaño |
|---|---|---|---|
| **15** | `INSERT TABLAS RIPS CUPS.sql` | Inserta datos de tablas RIPS y CUPS | **1 MB** |
| **16** | `INSERTAR TABLA RIPS CIE.sql` | Inserta datos de tablas RIPS CIE (diagnósticos) | **955 KB** |
| **17** | `scrips de rips y cups.sql` | Script completo de RIPS y CUPS | **21 MB** ⚠️ |

---

## Opcionales

| Archivo | Cuándo usar |
|---|---|
| `8. Facturador.sql` | Solo si se usa el módulo facturador |
| `9. Para Fenalco (Opcional).sql` | Solo para clientes Fenalco |
| `7. Querys tablas nuevas (No necesario).sql` | Queries de referencia, no ejecutar |
| `QUERRYS Asignar Rips No sincronizados (No necesario).sql` | Queries de referencia, no ejecutar |
| `QUERY FACTURACIÓN ELECTRONICA LAURELES(opcional).sql` | Solo para el cliente Laureles |

---

## Carpeta adicional: `QUERYS_ACTUALIZAR_CODIGOS_LOCALIZACION/`

Contiene 37 scripts para actualizar códigos de localización (departamentos, ciudades). Ejecutar **solo si los códigos DANE cambian** o en la primera instalación si los datos no coinciden.

---

## Tablas principales del sistema

| Tabla | Resolución | Propósito |
|---|---|---|
| `[Evaluación Entidad Rips]` | 2275 (V1) | RIPS originales vinculados a historia clínica |
| `[Evaluación Entidad Rips V2]` | 2275 (V2) | RIPS V2 con campos adicionales |
| `Rips_2275` | 2275 | Tabla consolidada con FK |
| `Entidad1888` | 1888 | Datos extendidos del paciente (género, etnia, discapacidad, alergias, biometría) |
| `Discapacidad` | 1888 | Catálogo de discapacidades |
| `[Sexo Identidad Genero]` | 1888 | Catálogo de identidad de género |
| `Etnia` | 1888 | Catálogo de etnias |
| `Ciudad1888` | 1888 | Municipios colombianos |
| `Pais` | 1888 | Países ISO |

---

## Triggers activos

| Trigger | Tabla | Qué hace |
|---|---|---|
| `Relacion_Rips_Factura` | `Factura` | Vincula RIPS a factura automáticamente al facturar (particular) |
| `Relacion_Factura_Rips` | `Evaluación Entidad Rips` | Busca factura al insertar RIPS |
| `Tr_Relacion_Historia_Eps_Prepagada_RIPS` | `Evaluación Entidad Rips` | Vincula RIPS a plan de tratamiento (EPS/prepagada) |
| `Tr_Relacion_Historia_Eps_Prepagada_` | `Plan de Tratamiento Tratamientos` | Vincula plan de tratamiento a RIPS |
| `Relacion_Rips_Factura_EPS` | `FacturaII` | Vincula RIPS EPS a factura |
| `TR_Entidad_Insert` | `Entidad` | Inserta automáticamente en `Entidad1888` al crear paciente |
| `TR_Entidad_Update_Doc` | `Entidad` | Sincroniza documento en `Entidad1888` al modificar paciente |
| `trg_UpdateFacturaOnEmpresaVChange` | `EmpresaV` | Actualiza factura 0 al cambiar resolución |

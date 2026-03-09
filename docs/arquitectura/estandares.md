# Estándares de Diseño y Código — Relacionador RIPS

> **Propósito:** Este documento define las reglas visuales y de código que todo desarrollo nuevo debe seguir. Cualquier cambio visual o funcional debe respetar estas convenciones.

---

## 1. Paleta de Colores

### Colores principales

| Nombre | Variable CSS | Hex | Uso |
|---|---|---|---|
| **Primario** | `--color-primary` | `#007E82` | Botones, bordes activos, navbar, links, iconos principales |
| **Primario hover** | `--color-primary-hover` | `#006568` | Hover de botones primarios |
| **Primario claro** | `--color-primary-light` | `#E0F4F4` | Fondos suaves, badges, cards destacadas |

### Colores de estado

| Nombre | Variable CSS | Hex | Uso |
|---|---|---|---|
| **Éxito** | `--color-success` | `#28A745` | Confirmaciones, RIPS asignado, campos completos |
| **Error** | `--color-danger` | `#F74040` | Validación fallida, campos faltantes, errores |
| **Advertencia** | `--color-warning` | `#FFC107` | Alertas, campos opcionales pendientes |
| **Info** | `--color-info` | `#049DB6` | Mensajes informativos, tooltips |

### Colores neutros

| Nombre | Variable CSS | Hex | Uso |
|---|---|---|---|
| **Texto principal** | `--color-text` | `#1D2020` | Títulos, texto de cuerpo |
| **Texto secundario** | `--color-text-secondary` | `#5A6060` | Labels, placeholders, texto de apoyo |
| **Borde** | `--color-border` | `#A2A7A7` | Bordes de inputs inactivos, separadores |
| **Fondo tabla** | `--color-bg-row` | `#F2F2F2` | Filas de tabla alternadas |
| **Fondo hover tabla** | `--color-bg-row-hover` | `#D9D9D9` | Hover en filas de tabla |
| **Fila seleccionada** | `--color-selected` | `#A3D3FF` | Fila seleccionada en tabla |
| **Fondo página** | `--color-bg` | `#FFFFFF` | Fondo general |

### Reglas de uso de color

- ✅ **Siempre** usar la variable CSS, nunca el hex directo
- ✅ El color primario `#007E82` es el **único** color de marca. No usar azul Bootstrap como primario
- ❌ **Nunca** usar `blue`, `red`, `green` como literales en CSS
- ❌ **Nunca** poner colores inline en el HTML (`style="color: red"`)

---

## 2. Tipografía

| Elemento | Fuente | Peso | Tamaño |
|---|---|---|---|
| **Base (todo)** | `Roboto`, sans-serif | 400 | 14px |
| **Títulos h1-h3** | `Roboto`, sans-serif | 700 | 24px / 20px / 16px |
| **Labels de formulario** | `Roboto`, sans-serif | 600 | 13px |
| **Inputs** | `Roboto`, sans-serif | 400 | 14px |
| **Badges / chips** | `Roboto`, sans-serif | 500 | 12px |

### Reglas de tipografía

- ✅ Usar **solo `Roboto`** en toda la aplicación
- ❌ No usar `Roboto Condensed`, `Alegreya Sans`, ni `Be Vietnam Pro`
- ✅ Importar desde Google Fonts: `https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap`

---

## 3. Componentes

### Botones

| Tipo | Clase | Apariencia |
|---|---|---|
| **Primario** | `.btn-primary-custom` | Fondo `--color-primary`, texto blanco |
| **Secundario** | `.btn-outline-custom` | Fondo transparente, borde `--color-primary`, texto `--color-primary` |
| **Peligro** | `.btn-danger` | Bootstrap default (rojo) |
| **Éxito** | `.btn-success` | Bootstrap default (verde) |

### Reglas de botones

- ✅ Border-radius: `6px` (no usar `8px` ni `0`)
- ✅ Transición: `all 0.3s ease`
- ✅ Hover: invertir colores (fondo ↔ texto)
- ❌ No usar `btn-primary` de Bootstrap (es azul, no es nuestro color primario)

### Inputs

- ✅ Usar clases Bootstrap: `form-control`, `form-select`
- ✅ Borde activo/focus: `--color-primary` (2px solid)
- ✅ Borde inactivo: `--color-border` (1px solid)
- ✅ Validación fallida: clase `.campo-faltante` → borde `--color-danger` 2px solid
- ❌ No usar `outline-color` — usar `border-color` + `box-shadow`

### Cards (secciones RDA)

- ✅ Usar `card` de Bootstrap con `border-left: 4px solid --color-primary`
- ✅ Header con `card-header` y fondo `--color-primary-light`
- ✅ Padding interno: `1rem`

### Tablas

- ✅ Usar `table` de Bootstrap
- ✅ Header: fondo `--color-bg-row`, texto `--color-text`
- ✅ Hover: `--color-bg-row-hover`
- ✅ Fila seleccionada: `--color-selected`

---

## 4. Espaciado

| Token | Valor | Uso |
|---|---|---|
| `--space-xs` | `4px` | Padding interno de badges |
| `--space-sm` | `8px` | Gap entre inputs del mismo grupo |
| `--space-md` | `16px` | Margen entre secciones menores |
| `--space-lg` | `24px` | Margen entre secciones principales |
| `--space-xl` | `32px` | Margen entre bloques grandes (ej: entre datos paciente y RIPS) |

---

## 5. Convenciones de IDs y Clases HTML

### IDs

| Área | Prefijo | Ejemplo |
|---|---|---|
| Datos del paciente | (sin prefijo) | `NombrePacienteBase`, `TelefonoBase` |
| RIPS AC | `Select...AC` | `SelectDiagnosticoRIPSAC1` |
| RIPS AP | `Select...AP` | `SelectFinalidadTecnologiaSaludAP` |
| RDA Paciente | `RDA_` | `RDA_CodigoPrestador` |
| RDA Consulta Externa | `RDACE_` | `RDACE_EntornoAtencion` |

### Reglas de nombrado

- ✅ IDs en **PascalCase**: `NombrePacienteBase`
- ✅ Clases CSS propias en **kebab-case**: `.campo-faltante`, `.lista-dinamica`
- ✅ Clases Bootstrap tal cual: `form-control`, `btn-outline-primary`
- ❌ No mezclar idiomas en un mismo ID: o todo en español o todo en inglés (preferir español para campos de negocio)

---

## 6. Convenciones de JavaScript

### Nombres de variables

| Tipo | Convención | Ejemplo |
|---|---|---|
| Variables locales | camelCase | `let nombrePaciente` |
| Constantes | UPPER_SNAKE_CASE | `const SERVIDOR_URL` |
| Funciones | camelCase (verbo+nombre) | `cargarPacientes()`, `registrarRips()` |
| Elementos DOM | camelCase con sufijo `El` o sin sufijo si es obvio | `const selectPacientes` |
| Datos del backend | PascalCase (como viene del SQL) | `resultado.DocumentoPaciente` |

### Reglas de JS

- ✅ Usar `const` por defecto, `let` solo si se reasigna
- ❌ No usar `var`
- ✅ Usar `async/await` en lugar de `.then()` encadenado
- ✅ Usar optional chaining `?.` para accesos al DOM
- ✅ Usar template literals `` `texto ${variable}` `` en lugar de concatenación
- ✅ Usar `fetch()` nativo para llamadas HTTP
- ❌ No usar XMLHttpRequest
- ✅ Manejar errores con `try/catch`
- ❌ No dejar `catch` vacíos (`catch (error) { }`)

### Estructura de archivos JS

| Archivo | Responsabilidad |
|---|---|
| `Asignar_RIPS V3.js` | Solo lógica RIPS (Res. 2275) |
| `rda-v3.js` | Solo lógica RDA (Res. 1888) |
| Archivos nuevos | Una responsabilidad por archivo |

---

## 7. Convenciones de CSS

### Reglas generales

- ✅ Usar variables CSS (`var(--color-primary)`)
- ✅ Los estilos propios van en `Asignar_RIPS.css` o en un archivo nuevo si es un módulo independiente
- ❌ No poner estilos inline en el HTML
- ❌ No usar `!important` excepto para sobrescribir Bootstrap cuando sea estrictamente necesario
- ✅ Usar clases, no IDs, para estilar (los IDs son para JS)
- ✅ Prefijo para clases propias del proyecto: `.cr-` (CeereRIPS)

### Ejemplo de clase propia

```css
/* ✅ Correcto */
.cr-btn-primary {
    background-color: var(--color-primary);
    color: #fff;
    border: 1px solid var(--color-primary);
    border-radius: 6px;
    transition: all 0.3s ease;
}

.cr-btn-primary:hover {
    background-color: var(--color-primary-hover);
}

/* ❌ Incorrecto */
#miBoton {
    background-color: #007E82;
    border-radius: 8px;
    transition: 2ms;
}
```

---

## 8. Convenciones de Commits

Formato: `tipo(área): descripción breve`

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Cambios de formato/CSS (sin cambio de lógica) |
| `refactor` | Reestructuración de código sin cambio funcional |
| `chore` | Tareas de mantenimiento |

**Ejemplos:**
```
feat(paciente): Agregar campos Código y Nombre de Ocupación
fix(rips): Corregir filtro de acto quirúrgico en consulta AC
docs: Actualizar guía de scripts SQL
style(rda): Unificar colores de botones a paleta primaria
```

---

*Última actualización: 2 de marzo de 2026*

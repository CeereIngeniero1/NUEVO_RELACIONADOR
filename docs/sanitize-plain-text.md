# Saneo de texto plano (`sanitizePlainText`)

Utilidad compartida para campos alfanuméricos (y texto libre acotado) en formularios y APIs, alineada con límites SQL y con envíos RDA/FHIR. Evita saltos de línea, caracteres de control y entradas demasiado largas.

## Archivos

| Ubicación | Rol |
|-----------|-----|
| `front_relacionador/public/rda/utils/sanitizePlainText.js` | Implementación ES modules: `sanitizePlainText`, `PRESETS`, `sanitizeComunidadEtnica`. |
| `front_relacionador/public/rda/utils/sanitizePlainText.window.js` | Puente para scripts **sin** módulo (`Asignar_RIPS V3.js`): expone `window.sanitizePlainText`, `window.PRESETS_SANITIZE_PLAIN_TEXT`, `window.sanitizeComunidadEtnica`. Cargar **antes** de `Asignar_RIPS V3.js` en el HTML. |
| `front_relacionador/public/rda/utils/sanitizeComunidadEtnica.js` | Reexporta desde `sanitizePlainText.js` (compatibilidad de imports). |
| `back_relacionador/server/utils/sanitizePlainText.js` | Misma lógica en Node (CommonJS). Exporta `sanitizePlainText`, `PRESETS`, `sanitizeComunidadEtnica`. |

**Importante:** si cambias reglas o presets, mantén **alineados** el `.js` de front (ESM), el de **servidor** y, si aplica, `sanitizePlainText.window.js` (misma lógica para páginas que no usan import).

## API

### `sanitizePlainText(raw, options?)`

- **`raw`**: valor del usuario (string u otro; `null`/`undefined` → `""`).
- **`options`** (opcional):
  - **`maxLength`**: número máximo de caracteres (por defecto `500` si no se pasa o es inválido).
  - **`extraChars`**: string con caracteres **extra** permitidos además de letras Unicode (`\p{L}`), números (`\p{N}`) y espacios. Ejemplo: `"-'"` para guión y apóstrofe.
  - **`collapseWhitespace`**: si es `true` (por defecto), colapsa espacios internos a un solo espacio y hace `trim`.

Pasos internos: sustituye retornos de carro/tab por espacio, elimina caracteres de control, aplica filtro alfanumérico + extras, recorta a `maxLength`.

### `PRESETS`

Objeto con configuraciones por campo. Cada clave debe documentar el origen (tabla/columna o resolución).

Preset actual de ejemplo:

- **`comunidadEtnica`**: `maxLength: 50`, `extraChars: "-'"`, acorde a `[Comunidad Etnica]` en `Entidad1888` (varchar 50).

### Wrappers

Funciones que llaman a `sanitizePlainText(raw, PRESETS.<nombre>)`, por ejemplo `sanitizeComunidadEtnica`, para no repetir el objeto de opciones en cada llamada.

## Uso en front (módulo ES)

```javascript
import {
  sanitizePlainText,
  PRESETS,
  sanitizeComunidadEtnica
} from "../utils/sanitizePlainText.js";

const limpio = sanitizeComunidadEtnica(input.value);
const otro = sanitizePlainText(input.value, { maxLength: 100, extraChars: "#" });
```

## Uso en scripts clásicos (sin `import`)

Tras cargar `sanitizePlainText.window.js`:

```javascript
var x = window.sanitizePlainText(document.getElementById("campo").value, window.PRESETS_SANITIZE_PLAIN_TEXT.comunidadEtnica);
```

## Uso en servidor (Express)

```javascript
const { sanitizePlainText, PRESETS, sanitizeComunidadEtnica } = require("../utils/sanitizePlainText");

// ...
.input("ComunidadEtnica", sql.NVarChar, sanitizeComunidadEtnica(req.body.ComunidadEtnica))
// o
.input("MiCampo", sql.NVarChar, sanitizePlainText(req.body.MiCampo, PRESETS.miCampo) || null)
```

## Añadir un nuevo campo (checklist)

1. **Definir contrato**: longitud máxima (revisar SQL / guía Ministerio) y qué símbolos extra son aceptables (direcciones suelen permitir `#`, `.`, `,`, etc.; teléfonos solo dígitos y separadores — quizá otro helper en el futuro).
2. **Añadir preset** en `front_relacionador/public/rda/utils/sanitizePlainText.js` dentro de `PRESETS` con la **misma clave** y mismos valores en `back_relacionador/server/utils/sanitizePlainText.js`.
3. **Opcional**: exportar `sanitizeMiCampo(raw) { return sanitizePlainText(raw, PRESETS.miCampo); }` en el mismo archivo front.
4. **Aplicar** al leer del DOM o del `req.body` antes de persistir o armar el JSON RDA.
5. Si el campo se usa desde **`Asignar_RIPS V3.js`** o HTML inline sin módulos, actualizar **`sanitizePlainText.window.js`** (copiar el nuevo preset en el objeto `PRESETS` del IIFE) para que `window` tenga la misma definición.
6. **HTML**: `maxlength` acorde a `maxLength` del preset y `title` o ayuda visible para el usuario.

## Integración ya cableada

- **Actualizar paciente** (`wireDemografiaPaciente.js` → `POST /apiV3/ActualizarPaciente`): comunidad étnica saneada en payload; `Asignar_RipsRoutes V3.js` vuelve a sanear en servidor.
- **Evaluación RDA paciente** (`RdaPacienteRoutes.js`): `ComunidadEtnica` al insertar cabecera.
- **Guardar RDA** (payload en `Asignar_RIPS V3.html`): usa `window.sanitizeComunidadEtnica` cuando está disponible.

## Limitaciones

- No sustituye validación de negocio (códigos de catálogo, formatos de fecha, etc.).
- Campos muy específicos (solo dígitos, email) pueden requerir otro helper o una regex distinta; este utilitario está pensado para **texto plano** con límite y conjunto de caracteres controlado.

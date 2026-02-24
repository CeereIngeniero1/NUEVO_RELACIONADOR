# Plan de Refactorización Frontend - Manifiesto V3

## Diagnóstico del Archivo Actual

`Asignar_RIPS V3.js` tiene **5,379 líneas** con **~175 funciones/bloques** en un solo archivo. Es un God Object clásico.

### Mapa de Bloques Identificados (Archivo Actual)

| Bloque | Líneas | Responsabilidad | Módulo Destino |
|---|---|---|---|
| Auth/Login | L1-36 | `VerificarLogin()`, constante `servidor` | `main-v3.js` |
| Utilidades UI | L41-145 | `Esperar()`, `MostrarMensajeDeCarga()`, `Consultar()` | `utils-ui-v3.js` |
| Carga Pacientes | L147-365 | `Cargar()`, `LlenarSelectDeHistoriasClinicas()`, evento `SelectPacientes.change` | `main-v3.js` |
| Select2 Init | L392-462 | Inicialización jQuery Select2 para dropdowns largos | `utils-ui-v3.js` |
| Flujo AC (dropdowns) | L464-964 | `radioAC.change` → carga ~12 selects (fetch+sort+populate) | `rips-logic-v3.js` |
| Flujo AP (dropdowns) | L1082-1564 | `radioAP.change` → carga ~12 selects (fetch+sort+populate) | `rips-logic-v3.js` |
| Registro RIPS | L1567-2037 | `pruebaAlert()`, `AsignarRIPS()` (400 líneas, validación + POST) | `rips-logic-v3.js` |
| No-RIPS | L2040-2121 | `NoAsignarRIPS()` | `rips-logic-v3.js` |
| Validación Legacy | L2124-2385 | `RegistrarRIPS()`, `insertarRIPSHC()`, `ejecutarConsultasAC/AP()` | `rips-logic-v3.js` |
| Funciones get/update | L2387-2893 | ~20 pares `getTipoUsuario()`/`updateTipoUsuario()` | `api-service-v3.js` |
| RIPS Por Defecto | L2938-5307 | UI y lógica para RIPS preestablecidos AC/AP (~2400 líneas!) | `rips-defaults-v3.js` |
| **Lógica V3 RDA** | **L5321-5379** | `calcularIMC()`, `toggleRDA()` | `paciente-rda-v3.js` |

---

## Arquitectura Propuesta (4+1 Archivos)

Basada en el **Manifiesto de Refactorización** del usuario:

### 1. `api-service-v3.js` — Solo Datos
> **Regla**: Prohibido `document.getElementById()`. Solo `fetch()` + retorno de datos.

```javascript
// Ejemplo de función limpia
export async function obtenerTiposUsuario() {
    const res = await fetch(`http://${getServidor()}:3000/apiv2/TipodeRips`);
    if (!res.ok) throw new Error(`Error: ${res.statusText}`);
    return res.json();
}
```

**Contendría**: Todas las ~20 funciones `getTipoUsuario()`, `getCodConsulta()`, `getServicios()`, etc.

---

### 2. `rips-logic-v3.js` — Solo Lógica de RIPS
> **Regla**: No hace `fetch()`. Recibe datos, manipula el DOM de RIPS y empaqueta JSON.

**Contendría**: `AsignarRIPS()`, `RegistrarRIPS()`, `NoAsignarRIPS()`, lógica de radio AC/AP, validaciones de campos.

---

### 3. `paciente-rda-v3.js` — Solo Lógica RDA 1888
> **Regla**: No hace `fetch()`. Maneja los >20 campos de paciente y biometría.

**Contendría**: `calcularIMC()`, `toggleRDA()`, validaciones de campos 1888, empaquetado JSON RDA.

---

### 4. `utils-ui-v3.js` — Solo Helpers Visuales
> **Regla**: Funciones puras y reutilizables. Sin lógica de negocio.

**Contendría**: `MostrarMensajeDeCarga()`, `Esperar()`, `AgregarOpcionPorDefecto()`, inicialización Select2, `quitarBordeRojo()`.

**Función estrella** (elimina ~1000 líneas de código duplicado):
```javascript
export function poblarSelect(selectElement, datos, { campoValor, campoTexto, ordenarPor, textoDefecto }) {
    selectElement.innerHTML = '';
    // Opción por defecto
    const def = document.createElement('option');
    def.textContent = textoDefecto || 'Sin Seleccionar';
    def.value = '';
    selectElement.appendChild(def);
    // Ordenar y poblar
    datos.sort((a, b) => (a[ordenarPor] || '').localeCompare(b[ordenarPor] || ''));
    datos.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item[campoValor];
        opt.textContent = item[campoTexto];
        selectElement.appendChild(opt);
    });
}
```

---

### 5. `main-v3.js` — El Orquestador
> **Regla**: Solo escucha eventos y coordina entre módulos. Cero lógica compleja.

**Contendría**: `VerificarLogin()`, `Cargar()`, wiring de botones (`btnRegistrarRIPS.click → ripsLogic.AsignarRIPS()`).

---

## Reglas del Manifiesto Aplicadas

| Regla | Cómo se Aplica |
|---|---|
| **Responsabilidad Única** | Cada archivo tiene un propósito exclusivo (ver tabla arriba) |
| **Cero Variables Globales** | Se usará `export`/`import` con ES Modules o patrón IIFE |
| **Optional Chaining** | Todo acceso al DOM usará `?.` para evitar explosiones |
| **Archivo Viejo Congelado** | Código nuevo solo en los módulos nuevos |
| **Patrón Estrangulador** | Migrar una función por sesión (ver orden abajo) |

---

## Orden de Migración (Patrón Estrangulador)

Priorizado por impacto y riesgo:

1. **`utils-ui-v3.js`**: Mover `MostrarMensajeDeCarga`, `Esperar`, `AgregarOpcionPorDefecto`, `quitarBordeRojo`. Crear `poblarSelect()`. *(Bajo riesgo, alto impacto)*
2. **`api-service-v3.js`**: Mover las ~20 funciones `get*()`. *(Bajo riesgo, elimina duplicación)*
3. **`paciente-rda-v3.js`**: Mover `calcularIMC()`, `toggleRDA()`. Agregar nuevos campos 1888 aquí. *(Medio riesgo, necesario para avanzar con RDA)*
4. **`rips-logic-v3.js`**: Mover `AsignarRIPS()`, flujos AC/AP. *(Alto riesgo, necesita testing cuidadoso)*
5. **`main-v3.js`**: Último, cuando los módulos estén estables. *(Riesgo mínimo si los módulos ya están probados)*

---

## Carga en el HTML

```html
<!-- Librerías externas (sin cambio) -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="node_modules/bootstrap/dist/js/bootstrap.min.js"></script>
<script src="node_modules/alertifyjs/build/alertify.min.js"></script>
<script src="./NombreEquipoServidor.js"></script>

<!-- Módulos V3 (nuevos, orden importa) -->
<script src="js/v3/utils-ui-v3.js"></script>
<script src="js/v3/api-service-v3.js"></script>
<script src="js/v3/paciente-rda-v3.js"></script>
<script src="js/v3/rips-logic-v3.js"></script>
<script src="js/v3/main-v3.js"></script>

<!-- Archivo legacy (se va vaciando progresivamente) -->
<script src="Asignar_RIPS V3.js"></script>
```

> [!IMPORTANT]
> El archivo legacy se carga **al final** para que las funciones migradas a los módulos nuevos tengan prioridad. A medida que se extraigan funciones, se eliminan del archivo viejo.

## Verificación

- Tras cada migración, verificar que la funcionalidad siga operando correctamente en el navegador.
- Verificar que no haya errores en la consola del navegador (`F12`).
- Probar flujo completo: seleccionar paciente → asignar RIPS AC → asignar RIPS AP → guardar sin RIPS.

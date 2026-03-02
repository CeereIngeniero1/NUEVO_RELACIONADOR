# Arquitectura del Frontend — Versiones y Flujos

## Las 3 generaciones de archivos

El frontend tiene **3 generaciones** de código que coexisten en `front_relacionador/public/`. Solo **V3 es la versión activa**.

| Generación | HTML | JS | Tamaño JS | Estado |
|---|---|---|---|---|
| **V1 (original)** | `Asignar_RIPS.html` | `Asignar_RIPS.js` | 216 KB | ❌ Obsoleta |
| **V2** | `Asignar_RIPS V2.html` | `Asignar_RIPS V2.js` | 217 KB | ❌ Obsoleta |
| **V3 (activa)** | `Asignar_RIPS V3.html` | `Asignar_RIPS V3.js` + `rda-v3.js` | 230 KB + 21 KB | ✅ Activa |

> V1 y V2 se mantienen como referencia histórica pero **NO se deben modificar**.

---

## Archivos del Frontend Activo (V3)

```
front_relacionador/public/
├── Asignar_RIPS V3.html      ← Página principal (114 KB)
├── Asignar_RIPS V3.js        ← Lógica RIPS + datos paciente (230 KB)
├── rda-v3.js                 ← Módulo RDA independiente (21 KB)
├── Asignar_RIPS.css           ← Estilos
├── NombreEquipoServidor.js    ← Config. servidor (localStorage)
├── MaestroListasRIPS.js       ← Catálogos RIPS
├── RIPS.html / RIPS.js        ← Pantalla principal de navegación
├── index.html                 ← Login
├── main.js / script.js        ← Lógica del login
└── style.css / style_login.css ← Estilos generales y login
```

---

## Separación de responsabilidades JS

| Archivo | Responsabilidad |
|---|---|
| `Asignar_RIPS V3.js` | Todo lo de la Res. 2275 (RIPS AC/AP), carga de datos del paciente, selects, registro |
| `rda-v3.js` | Todo lo de la Res. 1888 (RDA), listas dinámicas, biometría, API pública `window.RDA` |
| `NombreEquipoServidor.js` | Define la variable del servidor en `localStorage` |
| `MaestroListasRIPS.js` | Catálogos de opciones para los selects de RIPS |

---

## Diagrama de interacción entre archivos

```mermaid
graph TB
    subgraph "Navegador"
        LOGIN["index.html<br/>Login"]
        NAV["RIPS.html<br/>Navegación"]
        MAIN["Asignar_RIPS V3.html<br/>Página Principal"]
    end

    subgraph "JavaScript V3"
        CONFIG["NombreEquipoServidor.js<br/>Config servidor"]
        MAESTRO["MaestroListasRIPS.js<br/>Catálogos"]
        V3JS["Asignar_RIPS V3.js<br/>230 KB - Res. 2275"]
        RDA["rda-v3.js<br/>21 KB - Res. 1888"]
    end

    subgraph "Backend :3000"
        API["/apiV3 - RIPS"]
        API2["/apiV2 - Pacientes"]
        RIPS_DL["/RIPS - Descarga JSON"]
    end

    LOGIN -->|JWT Token| NAV
    NAV --> MAIN
    MAIN --> CONFIG
    CONFIG --> V3JS
    CONFIG --> MAESTRO
    V3JS -->|fetch| API
    V3JS -->|fetch| API2
    V3JS -->|fetch| RIPS_DL
    RDA -->|window.RDA| V3JS
    MAESTRO --> MAIN
```

---

## Flujo completo de asignación de RIPS

```mermaid
sequenceDiagram
    actor U as Usuario
    participant HTML as Asignar_RIPS V3.html
    participant V3 as Asignar_RIPS V3.js
    participant RDA as rda-v3.js
    participant API as Backend :3000

    U->>HTML: Selecciona paciente
    HTML->>V3: SelectPacientes.change
    V3->>API: GET /apiV3/DatosdeUsuarioHC/:doc
    API-->>V3: JSON datos paciente
    V3->>HTML: Llena campos (nombre, doc, edad, género, etc.)
    V3->>HTML: Llena campos 1888 (etnia, discapacidad, residencia)

    U->>HTML: Selecciona historia clínica
    U->>HTML: Elige tipo RIPS (AC o AP)

    alt AC - Consulta
        V3->>API: GET /apiV3/TipodeRips, Entidad, Modalidad...
        API-->>V3: Catálogos JSON
        V3->>HTML: Llena selects AC
        U->>HTML: Selecciona valores en selects
    else AP - Procedimiento
        V3->>API: GET /apiV3/TipodeRips, ViaIngreso, Cups...
        API-->>V3: Catálogos JSON
        V3->>HTML: Llena selects AP
        U->>HTML: Selecciona valores en selects
    end

    opt RDA (Res. 1888)
        U->>HTML: Marca checkbox "Generar RDA"
        RDA->>HTML: Muestra sección RDA
        U->>HTML: Selecciona tipo RDA (Paciente o CE)
        RDA->>HTML: Muestra campos correspondientes
        U->>HTML: Llena campos RDA
    end

    U->>HTML: Click "Registrar RIPS"
    V3->>API: POST /apiV3/RegistrarRips/...
    API-->>V3: OK
    V3->>HTML: SweetAlert "RIPS registrado"
```

---

## Estructura del HTML principal

```mermaid
graph TD
    PAGE["Asignar_RIPS V3.html"]
    
    PAGE --> SEC1["Selección de Paciente<br/>#SelectPacientes"]
    PAGE --> SEC2["Datos del Paciente<br/>20+ campos editables"]
    PAGE --> SEC3["Alergias<br/>#TieneAlergiaBase"]
    PAGE --> SEC4["Selección HC + Tipo RIPS<br/>#SelectHistoriasSinRIPS"]
    PAGE --> SEC5["Asignación RIPS<br/>#TipoAC / #TipoAP"]
    PAGE --> SEC6["RDA - Res. 1888<br/>#ContenidoRDA"]
    
    SEC6 --> RDA_P["RDA Paciente<br/>#SeccionRDAPaciente<br/>18 campos"]
    SEC6 --> RDA_CE["RDA Consulta Externa<br/>#SeccionRDAConsultaExterna<br/>37 campos exclusivos"]
```

---

## Orden de carga de scripts (en el HTML)

```html
<!-- 1. Librerías externas -->
<script src="sweetalert2"></script>
<script src="bootstrap"></script>
<script src="alertify"></script>

<!-- 2. Configuración -->
<script src="NombreEquipoServidor.js"></script>

<!-- 3. Lógica principal RIPS (Res. 2275) -->
<script src="Asignar_RIPS V3.js"></script>

<!-- 4. Módulo RDA (Res. 1888) - carga al final -->
<script src="rda-v3.js"></script>
```

> `rda-v3.js` se carga **después** de `Asignar_RIPS V3.js` y se ejecuta inmediatamente (sin `DOMContentLoaded`) porque el DOM ya existe cuando llega al final del `<body>`.

---

## API pública de rda-v3.js

`rda-v3.js` expone un objeto global `window.RDA` que puede ser consultado desde otros archivos:

```javascript
window.RDA = {
    // Getters RDA Paciente
    getAntecedentes: function() { ... },
    getAntecedentesFamiliares: function() { ... },
    getMedicamentosDCI: function() { ... },

    // Getters RDA Consulta Externa
    getDiagRelacionados: function() { ... },
    getPrescripcionMed: function() { ... },
    getPrescripcionProc: function() { ... },
    getOtrasTecnologias: function() { ... }
};
```

Cada getter retorna un array de objetos con los datos de las listas dinámicas.

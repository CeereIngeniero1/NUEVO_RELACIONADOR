# Relacionador RIPS — Documentación del Proyecto

Sistema web para **asignación, validación y descarga de RIPS** (Registro Individual de Prestación de Servicios de Salud) en Colombia. Desarrollado con Node.js, Express y SQL Server.

---

## Contexto Normativo

Este proyecto implementa dos resoluciones del Ministerio de Salud y Protección Social:

| Resolución | Nombre | ¿Qué define? | Documentación |
|---|---|---|---|
| **2275** | RIPS Clásico | Estructura de archivos JSON para reportar servicios AC (Consultas) y AP (Procedimientos) | [Ver detalles](resolucion-2275/descripcion.md) |
| **1888** | Resumen Digital de Atención (RDA) | Campos clínicos adicionales: diagnósticos CIE-11, antecedentes, prescripciones, incapacidades | [Ver detalles](resolucion-1888/descripcion.md) |

> **Importante:** La 1888 se construyó **sobre** la 2275. No la reemplaza, la complementa. Ambas conviven en el sistema.

---

## Instalación

### Requisitos previos
- **Node.js** v16 o superior
- **pnpm** (gestor de paquetes)
- **SQL Server** con la base de datos del sistema configurada

### Pasos

```bash
# 1. Instalar pnpm globalmente
npm i -g pnpm

# 2. Instalar dependencias (desde la raíz del proyecto)
pnpm install

# 3. Configurar nombre del servidor
# Editar front_relacionador/public/NombreEquipoServidor.js
# Cambiar el valor por el nombre o IP del equipo donde corre el backend
```

---

## Ejecución

### Backend (Puerto 3000)

```bash
cd back_relacionador
node server/index.js
```

El backend se conecta a SQL Server y expone la API REST en `http://localhost:3000`.

> **Producción (Windows Service):** Se puede registrar como servicio de Windows usando NSSM:
> ```bash
> nssm install RelacionadorBackend "C:\Program Files\nodejs\node.exe" "C:\NUEVO_RELACIONADOR\back_relacionador\server\index.js"
> ```

### Frontend (Puerto 3100)

```bash
cd front_relacionador
node app.js
```

El frontend sirve los archivos estáticos de `public/` en `http://localhost:3100`.

> **Acceso directo:** `http://localhost:3100/Asignar_RIPS%20V3.html`

---

## Estructura del Proyecto

```
NUEVO_RELACIONADOR/
│
├── front_relacionador/              ← Frontend
│   ├── public/
│   │   ├── Asignar_RIPS V3.html       Página principal (V3 activa)
│   │   ├── Asignar_RIPS V3.js         Lógica RIPS + datos paciente (Res. 2275)
│   │   ├── rda-v3.js                  Módulo RDA independiente (Res. 1888)
│   │   ├── MaestroListasRIPS.js       Catálogos de opciones RIPS
│   │   ├── NombreEquipoServidor.js    Configuración del servidor
│   │   ├── RIPS.html / RIPS.js        Pantalla de navegación principal
│   │   ├── index.html                 Login
│   │   └── Asignar_RIPS V2.*          Versión anterior (solo referencia)
│   └── app.js                         Servidor Express (puerto 3100)
│
├── back_relacionador/               ← Backend
│   ├── server/
│   │   ├── routes/                    Endpoints API REST
│   │   ├── config/                    Configuración de conexión BD
│   │   └── index.js                   Punto de entrada (puerto 3000)
│   ├── SQL/                           Scripts SQL de referencia
│   └── QUERYS_ACTUALIZAR_CODIGOS_LOCALIZACION/  Scripts de actualización
│
├── docs/                            ← Documentación (este directorio)
│   ├── README.md                      Este archivo
│   ├── CHANGELOG.md                   Historial de versiones
│   ├── pendientes.md                  Tareas pendientes consolidadas
│   ├── resolucion-2275/               Docs de RIPS clásico
│   ├── resolucion-1888/               Docs del RDA + PDFs originales
│   └── arquitectura/                  Docs técnicos del frontend
│
└── package.json                       Monorepo (pnpm workspaces)
```

---

## Índice de Documentación

### Resolución 2275 (RIPS)
| Documento | Descripción |
|---|---|
| [Descripción](resolucion-2275/descripcion.md) | Qué es la 2275 y su relación con la 1888 |
| [Campos AC y AP](resolucion-2275/campos_rips_ac_ap.md) | Mapa de campos RIPS con IDs HTML |

### Resolución 1888 (RDA)
| Documento | Descripción |
|---|---|
| [Descripción](resolucion-1888/descripcion.md) | Qué es la 1888 y qué agrega |
| [RDA Paciente](resolucion-1888/rda_paciente.md) | 18 campos con IDs y tipos |
| [RDA Consulta Externa](resolucion-1888/rda_consulta_externa.md) | 37 campos exclusivos + compartidos |
| [Análisis de Campos](resolucion-1888/campos_analisis.md) | Existentes vs. faltantes |
| [PDFs Originales](resolucion-1888/pdfs/) | Documentos oficiales de la resolución |

### Técnicos
| Documento | Descripción |
|---|---|
| [Arquitectura Frontend](arquitectura/estructura_frontend.md) | 3 versiones del frontend, cuál es activa, orden de carga |
| [Arquitectura Backend](arquitectura/backend.md) | Conexión BD, despliegue PM2, configuración SQL Server |
| [API Endpoints](arquitectura/api_endpoints.md) | Documentación completa de rutas REST |
| [Estándares de Proyecto](arquitectura/estandares.md) | Reglas obligatorias de CSS, colores, tipografía y naming |
| [Guía Scripts SQL](arquitectura/scripts_sql.md) | Orden de ejecución, tablas principales, triggers activos |
| [Pendientes](pendientes.md) | Tareas y bugs consolidados |
| [Historial de Versiones](CHANGELOG.md) | Desde v1.0.5 hasta la versión actual |

---

*Última actualización: 27 de febrero de 2026*

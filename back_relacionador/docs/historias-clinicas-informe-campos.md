# Informe: campos Historia Clínica (formatos HTML)

> **Documento principal actualizado:** [`campos-historia-clinica.md`](./campos-historia-clinica.md)  
> Este archivo se conserva como referencia histórica breve.

---

**Ruta formatos:** `C:\CeereSio\Formatos HC` (variable `CEERE_FORMATOS_HC_PATH`)  
**Catálogo:** `C:\CeereSio\Campos Historia Clínica.txt`  
**API análisis:** `GET /apiV3/formatosHC/analisis-campos`

Generado para el módulo **Historias Clínicas** — autollenado al seleccionar paciente + formato.

---

## Formatos en carpeta raíz (listados por el sistema)

| Archivo | Campos `name` en HTML | Autollenado |
|---------|----------------------|-------------|
| `Periodontograma.htm` | `T1` | Sí (nombre completo) |
| `perio.html` | *(ninguno)* | No — inputs sin `name` |
| `perio_modificado.html` | *(ninguno)* | No — inputs sin `name` |

> Los formatos en subcarpetas (ej. `Viejos/`) **no** aparecen en el selector hasta moverlos a la raíz o ampliar el listado del backend.

---

## Catálogo CeereSio (T1–T36, Entidad1–3)

| Campo | Significado | ¿Dato hoy? | Origen actual |
|-------|-------------|------------|---------------|
| **T1** | Nombre Completo | Sí | `NombreCompletoPaciente` / formulario |
| **T2** | No Historia | Sí | `DocumentoPaciente` |
| **T3** | Edad | Sí | `Edad` / `#EdadPaciente` |
| **T4** | Fecha de Historia | Sí | Fecha del sistema al abrir formato |
| **T5** | Identificación | Sí | Tipo documento + número |
| **T6** | Dir Domicilio | Sí | `Direccion` |
| **T7** | Ciudad | Sí | Municipio residencia |
| **T8** | Tel Domicilio | Sí | `Tel` |
| **T9** | Fecha de Nacimiento | Sí | `FechaNacimientoBase` |
| **T10** | Sexo | Sí | `Sexo` / select sexo |
| **T11** | Estado Civil | **No** | Agregar a vista SQL |
| **T12** | Ocupación | Sí | `DescripciónOcupación` |
| **T13** | Aseguradora | **No** | EPS / empresa — SQL |
| **T14** | Tipo Vinculación | **No** | SQL |
| **T15** | Acompañante | **No** | SQL |
| **T16** | Parentesco Acompañante | **No** | SQL |
| **T17** | Tel Acompañante | **No** | SQL |
| **T18** | Responsable | **No** | SQL |
| **T19** | Parentesco Responsable | **No** | SQL |
| **T20** | Tel Responsable | **No** | SQL |
| **T21** | Nombre de Usuario | Sí | Sesión (`nombreusuariologeado`) |
| **T22** | Hora de Historia | Sí | Hora del sistema |
| **T23** | Lugar Nacimiento | **No** | SQL |
| **T24** | Barrio | **No** | SQL |
| **T25** | Teléfono 2 | **No** | SQL |
| **T26** | Celular | **No** | SQL |
| **T27** | Tipo Documento | Sí | `DescripciTipoDocumento` |
| **T28** | Tipo Usuario | **No** | SQL |
| **T29** / **RegistroMédico** | Registro Médico | **No** | Profesional logueado — SQL/sesión |
| **T30** | Fecha Historia Numérica | Sí | `YYYYMMDD` sistema |
| **T31** | Código Dx RIPS | **No** | Al relacionar RIPS |
| **T32** | Descripción Dx RIPS | **No** | Al relacionar RIPS |
| **T33** | Código Dx RIPS 2 | **No** | Al relacionar RIPS |
| **T34** | Edad Gestacional | **No** | SQL |
| **T36** | Correo electrónico | **No** | SQL |
| **Entidad1** | Foto paciente | **No** | Imagen / blob |
| **Entidad2** | Firma paciente | **No** | Imagen |
| **Entidad3** | Firma usuario | **No** | Imagen |

---

## Campos a agregar en la consulta (`[Cnsta Relacionador Usuarios Info]`)

Prioridad sugerida para completar encabezados de HC:

1. `T11` — Estado civil  
2. `T13` — Aseguradora (nombre EPS / contrato)  
3. `T14` — Tipo vinculación  
4. `T15`–`T20` — Acompañante y responsable  
5. `T23` — Lugar de nacimiento (municipio/país)  
6. `T24` — Barrio  
7. `T25`, `T26` — Teléfono adicional y celular  
8. `T28` — Tipo usuario (contributivo, subsidiado, etc.)  
9. `T29` / `RegistroMédico` — Registro del profesional  
10. `T36` — Correo  

Diagnósticos **T31–T33** pueden salir del flujo RIPS cuando exista evaluación seleccionada.

---

## Formatos viejos (referencia, no en selector raíz)

En `Viejos/Historia medica.htm` y `Viejos/Odontologia.htm` aparecen muchos `name` adicionales (`T1034`, `T8000`, etc.) que **no** están en `Campos Historia Clínica.txt`. Si se reactivan esos formatos, conviene documentar cada `name` extra o unificarlos al catálogo T1–T36.

---

## Comportamiento implementado

1. Al **Buscar** paciente, se dispara `hc-paciente-cargado` y se rellena la vista previa si ya hay formato seleccionado.  
2. Al elegir **formato**, se descarga el HTML, se aplican valores por `name`/`id` y se muestra en el iframe (`srcdoc`).  
3. Panel **Informe de campos del formato** en la pantalla + este documento.

**Archivos:**  
- `front_relacionador/public/historiasClinicas/camposHistoriaClinica.js`  
- `front_relacionador/public/historiasClinicas/HistoriasClinicas.js`

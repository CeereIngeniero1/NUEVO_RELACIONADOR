# Catálogos RDA Consulta Externa (1888)

## SQL

Scripts en `back_relacionador/SQL/1888.sql` (final del archivo):

- Tablas + vistas `Cnsta ... 1888` para listas que antes estaban fijas en HTML.
- Inserciones iniciales según Resolución 1888 / formulario RDACE.
- Ajustar `[Id Estado] = 7` en vistas si su catálogo de estados usa otro valor activo.

## API (`/apiV3`)

| Clave URL | Uso en front (ejemplo) |
|-----------|-------------------------|
| `GET /Catalogo1888/EntornoAtencion?q=` | `#RDACE_EntornoAtencion` |
| `GET /Catalogo1888/TipoAlergia?q=` | `#RDACE_TipoAlergia` |
| `GET /Catalogo1888/ParentescoFamiliar?q=` | `#RDACE_ParentescoFamiliar` |
| `GET /Catalogo1888/TipoDiagnosticoPrincipal?q=` | `#RDACE_TipoDiagPrincipalCIE10` |
| `GET /Catalogo1888/UnidadMedidaDosis?q=` | `#RDACE_UnidadMedidaDosis` |
| `GET /Catalogo1888/ViaAdministracionMedicamento?q=` | `#RDACE_ViaAdministracionMed` |
| `GET /Catalogo1888/UnidadTiempoDuracion?q=` | `#RDACE_DuracionUnidadTiempoMed` |
| `GET /Catalogo1888/UnidadTiempoFrecuencia?q=` | `#RDACE_FrecuenciaUnidadTiempoMed` |
| `GET /Catalogo1888/FinalidadTecnologiaSalud?q=` | Finalidades med / proc / otra |
| `GET /Catalogo1888/OtraTecnologiaCategoria?q=` | `#RDACE_TipoTecSaludOtra` |
| `GET /Catalogo1888/AlcanceIncapacidad?q=` | `#RDACE_AlcanceIncapacidad` |

Sin `q` devuelve el catálogo completo; con `q` filtra por `Descripcion` o `Codigo`.

Otros endpoints ya existentes para RDACE: `EgresoRemision`, `FactorDeRiesgo`, `TipoTecnologiaEnSalud`, `Profesionales`, CIE/CUPS/DCI, etc.

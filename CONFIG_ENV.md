# Configuración por entorno (`.env` + `CRINFO.ini`)

## Backend (`back_relacionador`)

1. Copia [`.env.example`](back_relacionador/.env.example) a `back_relacionador/.env` y ajusta valores.
2. Al arrancar, se cargan variables en este orden:
   - Valores ya definidos en el sistema operativo (no se sobrescriben).
   - Archivo `.env` en `back_relacionador/.env` (u otras rutas candidatas del loader).
3. Si **falta** `DB_SERVER`, `DB_DATABASE`, `DB_USER` o `DB_PASSWORD`, se intenta leer `DataSource` y `Catalog` desde:
   - `C:/ceeresio/crinfo.ini`, y si no existe, `C:/CeereSio/CRInfo.ini`.
   - Opcional: `CRINFO_INI_PATH` apunta a otro archivo INI.
4. Los valores obtenidos del INI (y credenciales por defecto si aplican) se **escriben en** `.env` para que el fallback solo ocurra la primera vez en un servidor nuevo.
5. Puerto del API: `BACK_PORT` (o `PORT` como compatibilidad), por defecto `3000`.
6. Rutas de archivos RIPS (ZIP, JSON, XML, envío): la raíz es **`CEERE_RIPS_DATA_ROOT`** (alias **`RIPS_2275_ROOT`**). Si no se define, se usa `C:\CeereSio\RIPS_2275`. Afecta a descarga de RIPS/XML y al worker de preparación de envío. Implementación en [`back_relacionador/server/config/paths.js`](back_relacionador/server/config/paths.js).

## Frontend (`front_relacionador`)

1. Copia [`.env.example`](front_relacionador/.env.example) a `front_relacionador/.env`.
2. `FRONT_PORT` (o `PORT`) define el puerto del servidor Express del front (por defecto `3100`).
3. El navegador obtiene la configuración en runtime desde **`GET /config.js`** (sin caché), que define `window.__APP_CONFIG__`:
   - Si `API_BASE_URL` está en `.env`, se usa tal cual (URL base del backend).
   - Si no, se construye como `{protocolo}://{hostname del request}:{BACK_PORT}` (útil en LAN).
4. Los scripts estáticos usan `getApiBaseUrl()` ([`public/apiConfig.js`](front_relacionador/public/apiConfig.js)) o el módulo [`public/rda/api/apiBaseUrl.js`](front_relacionador/public/rda/api/apiBaseUrl.js).

## Comprobaciones rápidas

| Caso | Comportamiento esperado |
|------|-------------------------|
| A — `.env` del backend completo | No se lee el INI. |
| B — `.env` incompleto, INI presente | Se completan variables faltantes y se persisten en `.env`. |
| C — `.env` incompleto y sin INI válido | Error claro al arrancar el backend. |

Tras clonar en un servidor nuevo: deja `.env` vacío o sin claves de BD; con `crinfo.ini` en la ruta indicada, la primera ejecución rellenará `.env` automáticamente.

<p align="center">
  <span style="color:#ff0000;font-size:48px;font-weight:900;line-height:1.15;display:block;">
    ⚠ ESTO YA NO SE UTILIZA ⚠
  </span>
  <span style="color:#ff0000;font-size:32px;font-weight:800;line-height:1.2;display:block;margin-top:8px;">
    SE CREA ESTA GUÍA SOLO PARA REFERENCIAS FUTURAS DE LA API DE LA OMS
  </span>
</p>

> **Estado actual (producción RDA):** CIE-11 se consulta **únicamente** desde `dbo.CIE11_Codigos`:
> ```sql
> SELECT Codigo, Nombre FROM dbo.CIE11_Codigos WITH (NOLOCK)
> ```
> Fuente oficial: [https://vulcano.ihcecol.gov.co/CodeSystem-ICD11CO](https://vulcano.ihcecol.gov.co/CodeSystem-ICD11CO)  
> Fallbacks OMS / IHCE / mapping: **desactivados** en listas y catálogo.

---

# Guía de implementación — API CIE-11 de la OMS (histórica)

Documento de referencia de cómo se integró la [ICD API](https://icd.who.int/icdapi) de la Organización Mundial de la Salud en el Relacionador. **No usar en flujos RDA/IHCE actuales.**

## 1. Por qué se desactivó

MinSalud / IHCE delimita los códigos CIE-11 aceptables al CodeSystem **ICD11CO**.  
Códigos válidos en OMS pero fuera de ICD11CO (ej. `GB23`) provocaban selecciones inválidas para envío RDA.

Fuente vigente en código:

| Método | Fuente activa |
|--------|----------------|
| `search(q)` | `SELECT ... FROM dbo.CIE11_Codigos` |
| `findByCode(code)` | `SELECT ... FROM dbo.CIE11_Codigos WHERE Codigo = @code` |
| Fallback OMS | **OFF** (salvo `ICD11_WHO_API_ENABLED=1`) |

Archivos:

- `server/routes/Asignar_RipsRoutes V3.js` (producción)
- `server/routes/Asignar_RipsRoutes V3 experimental.js` (experimental; también desactivado)

## 2. Endpoints OMS usados

Base release MMS:

```text
https://id.who.int/icd/release/11/2024-01/mms
```

| Operación | URL | Uso en Relacionador |
|-----------|-----|---------------------|
| OAuth2 token | `POST https://icdaccessmanagement.who.int/connect/token` | `getWhoAccessToken()` / `getAccessToken()` |
| Búsqueda | `GET {baseUrl}/search?q={term}` | `search()` |
| Info por código | `GET {baseUrl}/codeinfo/{code}` | `findByCode()` |
| Entidad (título) | `GET {stemId}` (HTTPS) | Resolver `title` tras `codeinfo` |

Headers típicos en llamadas a la API:

```http
Authorization: Bearer {access_token}
Accept: application/json
Accept-Language: es
API-Version: v2
```

## 3. Autenticación OAuth2

Registro de cliente en el portal ICD API de la OMS. Flujo **client credentials**:

```http
POST https://icdaccessmanagement.who.int/connect/token
Content-Type: application/x-www-form-urlencoded

client_id=...
&client_secret=...
&scope=icdapi_access
&grant_type=client_credentials
```

Respuesta esperada:

```json
{
  "access_token": "...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

En el código el token se cacheaba en memoria (`whoToken` / `token` + `whoTokenExpiry` / `tokenExpiry`).

> **Seguridad:** no versionar `client_id` / `client_secret` en git. Preferir variables de entorno si algún día se reactiva.

## 4. Flujo histórico en el Relacionador

### 4.1 Rutas Express (`/apiV3`)

| Ruta | Comportamiento histórico |
|------|---------------------------|
| `GET /icd11/search/:query?` | Sin término → lista seed / TOP local; con término → `search()` (BD y luego OMS) |
| `GET /icd11/code/:code` | `findByCode()` (BD y luego OMS) |
| `GET /icd11/validate/:code` | Misma resolución que `code` |

Front (Select2): `front_relacionador/public/rda/bootstrap/wireCieSelect2.js`

- Búsqueda AJAX → `/apiV3/icd11/search/...`
- Lookup manual del campo código (blur/Enter) → `/apiV3/icd11/code/...`  
  **Este último era el que resolvía códigos fuera de ICD11CO vía OMS** (caso `GB23`).

### 4.2 Pseudocódigo del fallback (ya no activo)

```js
// search
const local = await queryCIE11_Codigos(q);
if (local.length) return local;

const token = await getWhoAccessToken();
const res = await fetch(`${baseUrl}/search?q=${encodeURIComponent(q)}`, { headers });
const data = await res.json();
return data.destinationEntities; // { theCode, title, ... }

// findByCode
const row = await queryCIE11_CodigosExact(code);
if (row) return { theCode, title };

const token = await getWhoAccessToken();
const info = await fetch(`${baseUrl}/codeinfo/${code}`).then(r => r.json());
const stem = await fetch(info.stemId).then(r => r.json());
return { theCode: info.code, title: stem.title };
```

### 4.3 Forma de resultado esperada por el front

```json
[
  { "theCode": "1A01", "title": "Infección intestinal por otro Vibrio" }
]
```

Select2 mapea `theCode` → `id`/`code` y `title` → texto mostrado.

## 5. Cómo se desactivó (julio 2026)

En el constructor de `ICD11_API`:

```js
this.whoApiEnabled = String(process.env.ICD11_WHO_API_ENABLED || '').trim() === '1';
```

- Por defecto: `false` → no pide token OMS; `search`/`findByCode` solo usan `dbo.CIE11_Codigos`.
- Si no hay fila local: `search` → `[]`, `findByCode` → `null`.

## 6. Cómo reactivar (solo laboratorio / referencia)

**No usar en producción RDA.**

1. En `.env` del backend:

```env
ICD11_WHO_API_ENABLED=1
```

2. Reiniciar `node server.js`.
3. Verificar con:

```http
GET /apiV3/icd11/code/GB23
```

Si la OMS responde, verás título en español aunque el código **no** esté en ICD11CO.

4. Apagar de nuevo:

```env
# ICD11_WHO_API_ENABLED=1
```

o eliminar la variable y reiniciar.

## 7. Fuente vigente recomendada (ICD11CO)

1. Mantener `dbo.CIE11_Codigos` sincronizada con ICD11CO.  
2. Script de carga: `SQL/1888/1888_create_cie11_tabla_con_datos.sql` (o carga propia desde Vulcano).  
3. Endpoints Relacionador actuales siguen siendo `/apiV3/icd11/search` y `/apiV3/icd11/code`, pero **solo BD**.

Consulta de control:

```sql
SELECT COUNT(1) AS Total FROM dbo.CIE11_Codigos;
SELECT TOP 20 Codigo, Nombre FROM dbo.CIE11_Codigos ORDER BY Codigo;
```

## 8. Checklist si alguien pide “volver a la OMS”

- [ ] Confirmar con MinSalud/IHCE si aceptan códigos fuera de ICD11CO.
- [ ] Credenciales OMS en entorno seguro (no hardcode).
- [ ] Feature flag `ICD11_WHO_API_ENABLED=1` solo en ambiente de prueba.
- [ ] Validación al guardar RDA: código ∈ `CIE11_Codigos` aunque OMS esté ON.
- [ ] Documentar impacto en bundles FHIR / rechazo IHCE.

## 9. Referencias externas

- Portal ICD API: https://icd.who.int/icdapi  
- CodeSystem Colombia ICD11CO: https://vulcano.ihcecol.gov.co/CodeSystem-ICD11CO  
- Código Relacionador: `server/routes/Asignar_RipsRoutes V3.js` → clase `ICD11_API`

---

*Documento generado como archivo histórico. La implementación activa de búsqueda CIE-11 es exclusivamente local (ICD11CO).*

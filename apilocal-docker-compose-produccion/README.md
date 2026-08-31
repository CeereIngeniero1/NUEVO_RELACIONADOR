# Guía: API Docker FEV-RIPS (MinSalud) — Production local

Instalación del contenedor **FEV-RIPS** en Windows para usarlo con el **Relacionador CEERE** (`Enviar a MinSalud`).

> **Recomendado:** seguir el video paso a paso y usar este documento como checklist y referencia de comandos.  
> **Video:** [Instalación API Docker FEV-RIPS (YouTube)](https://www.youtube.com/watch?v=gi3nihBKaNU)  
> **Referencia escrita (OpenSSL / certificado):** [Gist Javier Llanos](https://gist.github.com/javierllns/0fc9879253a74aa6c031e71c8e2f1158)

---

## Carpeta de trabajo en este repo

```
NUEVO_RELACIONADOR/apilocal-docker-compose-produccion/
├── apilocal-dockercompose.Production.yml   ← Compose Production (MinSalud)
├── Certificates/
│   └── server.pfx                            ← Certificado SSL local
├── Guia                                      ← Comandos OpenSSL usados
└── README.md                                 ← Este archivo
```

El Relacionador **no incluye** el API dentro del código: lo consume por HTTPS en `https://localhost:9443`.

---

## Requisitos de hardware

| Recurso | Mínimo orientativo |
|---------|-------------------|
| RAM     | 16 GB (cada contenedor pide ~9 GB en el compose) |
| CPU     | 4 núcleos |
| Disco   | ~5 GB libres para imágenes |

---

## Paso 1 — Instalar WSL 2

Docker Desktop en Windows usa **WSL 2** como motor.

Abrir **PowerShell como administrador**:

```powershell
wsl --install
```

Reiniciar el PC si lo pide Windows.

Verificar:

```powershell
wsl --status
wsl --version
```

Debe indicar WSL 2. Si ya tenías WSL 1, actualiza:

```powershell
wsl --set-default-version 2
```

---

## Paso 2 — Instalar Docker Desktop

1. Descargar **Docker Desktop for Windows** desde [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).
2. Instalar con la opción **Use WSL 2 instead of Hyper-V** (recomendado).
3. Abrir Docker Desktop y esperar **Engine running** (ballena verde).

Verificar en PowerShell:

```powershell
docker version
docker compose version
```

---

## Paso 3 — Instalar OpenSSL (Light, 64-bit)

Necesario para generar el certificado **PFX** que usa el contenedor de la API.

1. Descargar **OpenSSL Light 64-bit** para Windows (instalador `.exe`).
2. Durante la instalación, en **“Copy OpenSSL DLLs to”** elegir:
   - **The OpenSSL binaries (/bin) directory** ← recomendado
3. Finalizar instalación.

Verificar:

```powershell
openssl version
```

Si no está en el PATH:

```powershell
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" version
```

> Usar **PowerShell** o **CMD**. Evitar Git Bash para OpenSSL (puede dar problemas de rutas).

---

## Paso 4 — Generar certificado SSL (`server.pfx`)

Seguir el video / [gist](https://gist.github.com/javierllns/0fc9879253a74aa6c031e71c8e2f1158). Resumen de comandos (desde esta carpeta):

```powershell
cd "C:\Fernando\Ceere\Relacionador REAL\NUEVO_RELACIONADOR\apilocal-docker-compose-produccion"

# 1. Clave privada
openssl genrsa -out server.key 2048

# 2. Solicitud de certificado (CSR) — completar datos interactivos
openssl req -new -key server.key -out server.csr
```

**Datos de ejemplo** (ajustar a la IPS):

| Campo | Ejemplo |
|-------|---------|
| Country | `CO` |
| State | `Antioquia` |
| City | `Medellin` |
| Organization | `CeereSoftware` |
| Common Name | `localhost` |
| Challenge password | `Ceere1026` (debe coincidir con el compose) |

```powershell
# 3. Firmar certificado autofirmado
openssl req -x509 -newkey rsa:2048 -keyout rootCA.key -out rootCA.pem -days 825 -nodes -subj "/CN=My Root CA"
openssl x509 -req -in server.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out server.crt -days 825 -sha256

# 4. Exportar PFX
openssl pkcs12 -export -out server.pfx -inkey server.key -in server.crt -certfile rootCA.pem

# 5. Copiar a la carpeta que monta Docker
New-Item -ItemType Directory -Force -Path .\Certificates
Copy-Item server.pfx .\Certificates\server.pfx
```

Los comandos detallados también están en el archivo `Guia` de esta carpeta.

### Coherencia con el compose

En `apilocal-dockercompose.Production.yml` deben coincidir:

```yaml
- ASPNETCORE_Kestrel__Certificates__Default__Password=Ceere1026   # = challenge password OpenSSL
- ASPNETCORE_Kestrel__Certificates__Default__Path=/certificates/server.pfx
volumes:
  - ./Certificates:/certificates
```

---

## Paso 5 — Login al registry de Production (MinSalud)

Desde esta carpeta, usar las credenciales del **manual MinSalud** (línea comentada al inicio del YML):

```powershell
cd "C:\Fernando\Ceere\Relacionador REAL\NUEVO_RELACIONADOR\apilocal-docker-compose-produccion"

docker login crmspsgovcoprd.azurecr.io -u puller -p "<PASSWORD_ACR>"
```

Debe responder **Login Succeeded**.

> **Seguridad:** no subir contraseñas del ACR a git. Idealmente mover secretos a un archivo `.env` local (ver nota al final).

---

## Paso 6 — Descargar imágenes y levantar contenedores

```powershell
docker compose -f apilocal-dockercompose.Production.yml pull
docker compose -f apilocal-dockercompose.Production.yml up -d
```

Esperar **2–3 minutos** (SQL Server tarda en iniciar).

Verificar:

```powershell
docker ps --filter "name=fevrips"
```

Resultado esperado:

| Contenedor | Estado | Puertos |
|------------|--------|---------|
| `fevrips-db` | Up | — |
| `fevrips-api` | Up | `0.0.0.0:9443->5100/tcp` |

Si `fevrips-api` no queda Up:

```powershell
docker logs fevrips-db --tail 30
docker logs fevrips-api --tail 40
```

Reintento manual (orden DB → API):

```powershell
docker start fevrips-db
Start-Sleep -Seconds 90
docker start fevrips-api
```

---

## Paso 7 — Verificar que la API responde

```powershell
Test-NetConnection localhost -Port 9443
curl.exe -k -I https://localhost:9443
```

En el navegador (aceptar certificado autofirmado):

**https://localhost:9443/swagger/index.html**

Si Swagger carga, el contenedor está bien.

---

## Paso 8 — Conectar el Relacionador

En `back_relacionador/.env`:

```env
FEVRIPS_API_BASE_URL=https://localhost:9443
FEVRIPS_AMBIENTE=prod
FEVRIPS_ALLOW_PRODUCTION=1
FEVRIPS_TLS_REJECT_UNAUTHORIZED=false
FEVRIPS_TIMEOUT_MS=120000
```

Reiniciar backend:

```powershell
cd "C:\Fernando\Ceere\Relacionador REAL\NUEVO_RELACIONADOR\back_relacionador"
node .\server.js
```

En la UI **Enviar a MinSalud (FEV-RIPS)**:

1. Configurar **Credenciales SISPRO** (usuario real del prestador en producción).
2. Buscar facturas → **Preparar XML + JSON** → **Validar** → **Enviar**.

Documentación adicional del módulo: `deploy/fevrips/README.md`.

---

## Comandos útiles del día a día

```powershell
# Ver estado
docker ps --filter "name=fevrips"

# Detener
docker compose -f apilocal-dockercompose.Production.yml down

# Arrancar de nuevo
docker compose -f apilocal-dockercompose.Production.yml up -d

# Actualizar imagen (cuando MinSalud publique versión nueva)
docker login crmspsgovcoprd.azurecr.io -u puller -p "<PASSWORD_ACR>"
docker compose -f apilocal-dockercompose.Production.yml pull
docker compose -f apilocal-dockercompose.Production.yml up -d

# Limpiar instalación previa (borra contenedores; no borra imágenes)
docker compose -f apilocal-dockercompose.Production.yml down
docker rm -f fevrips-api fevrips-db
```

---

## Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---------|------------------|-----------|
| `ECONNREFUSED` / `AggregateError` al enviar | Contenedores apagados o puerto 9443 cerrado | `docker ps`, levantar stack |
| `fevrips-api` Exited al instante | PFX ausente o contraseña incorrecta | Verificar `Certificates/server.pfx` y password en YML |
| Swagger no abre | API aún iniciando o certificado | Esperar 2–3 min, revisar logs |
| Login SISPRO falla | Credenciales prestador incorrectas | Revisar en UI **Credenciales SISPRO** |
| Envío rechazado con reglas | JSON/XML/RIPS inválidos | **Ver detalle** en la tabla FEV-RIPS |

---

## Notas de seguridad

- El archivo `apilocal-dockercompose.Production.yml` puede contener **contraseñas en texto plano** (ACR, SQL SA). No committear secretos reales al repositorio.
- Para producción local, considerar un `.env` junto al compose:

  ```env
  FEVRIPS_MSSQL_SA_PASSWORD=...
  FEVRIPS_PFX_PASSWORD=...
  ```

  Y referenciar `${FEVRIPS_PFX_PASSWORD}` en el YML en lugar de valores fijos.

- **Production** envía a MinSalud real. Usar solo cuando la IPS esté autorizada para ello.

---

## Referencias

- Video instalación: https://www.youtube.com/watch?v=gi3nihBKaNU
- Gist OpenSSL / certificado: https://gist.github.com/javierllns/0fc9879253a74aa6c031e71c8e2f1158
- Manual MinSalud: *Manual de consumo API-Docker-FEV-RIPS* (versión vigente en SISPRO)
- Relacionador: `deploy/fevrips/README.md`

---

*Última actualización: Ceere — carpeta `apilocal-docker-compose-produccion`.*

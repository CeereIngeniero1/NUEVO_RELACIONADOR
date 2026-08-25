# API Docker FEV-RIPS (MinSalud) — despliegue local

El Relacionador **no embebe** este API: lo consume por HTTPS en `FEVRIPS_API_BASE_URL` (por defecto `https://localhost:9443`).

Manual de referencia: *Manual de consumo API-Docker-FEV-RIPS V4.3*.

## Requisitos

1. Docker Engine + Compose en Windows.
2. Certificado `fevripsapilocal.pfx` en `C:\Certificates` (o la ruta del volumen del compose).
3. Credenciales de pull del Azure Container Registry (Stage o Production) — **no** versionar en git.
4. Recursos elevados: ~4 CPU / 9 GB por contenedor (DB + API).
5. Usuario SISPRO del prestador (LoginSISPRO) configurado en el Relacionador.

## Variables del Relacionador (`back_relacionador/.env`)

```env
FEVRIPS_API_BASE_URL=https://localhost:9443
FEVRIPS_AMBIENTE=stage
# Solo para apuntar a Production (compose Production + flag explícito):
# FEVRIPS_ALLOW_PRODUCTION=1
# Si el PFX es autofirmado (habitual en local):
FEVRIPS_TLS_REJECT_UNAUTHORIZED=false
FEVRIPS_TIMEOUT_MS=120000
```

## Arranque Stage (pruebas)

1. Copiar [`apilocal-dockercompose.Stage.example.yml`](apilocal-dockercompose.Stage.example.yml) a un archivo local (fuera de git o con secretos vía `.env` de compose).
2. Sustituir placeholders de login ACR / contraseñas según la documentación oficial MinSalud (no pegar tokens en el repo).
3. Colocar el PFX en la carpeta montada (`C:\Certificates` por defecto).
4. Ejecutar:

```bash
docker login <ACR_STAGE> -u <usuario> -p <password>
docker compose -f apilocal-dockercompose.Stage.yml pull
docker compose -f apilocal-dockercompose.Stage.yml up -d
```

5. Health: `https://localhost:9443` (el cliente del Relacionador usa `/api/Auth/LoginSISPRO`).

## Arranque Production

Usar [`apilocal-dockercompose.Production.example.yml`](apilocal-dockercompose.Production.example.yml) solo cuando:

- `FEVRIPS_AMBIENTE=prod`
- `FEVRIPS_ALLOW_PRODUCTION=1` en el `.env` del Relacionador

## Credenciales SISPRO en Relacionador

- SQL: ejecutar [`../../back_relacionador/SQL/2275/9. CredencialesSisproFevRips.sql`](../../back_relacionador/SQL/2275/9.%20CredencialesSisproFevRips.sql)
- O archivo (fallback): `{CEERE_RIPS_DATA_ROOT}/config/credenciales-sispro-fevrips.json`

API Relacionador:

- `GET/PUT /RIPS/fevrips/credenciales/:documentoEmpresa`
- `GET /RIPS/fevrips/reportes`
- `GET /RIPS/fevrips/paquetes?reporte=...`
- `POST /RIPS/fevrips/enviar` (uno o lote)

## Seguridad

- No committear YML con passwords ACR, SA SQL ni password del PFX.
- Empezar siempre en **Stage**.
- Las claves SISPRO solo viven en backend / SQL / archivo de data root (nunca en el front).

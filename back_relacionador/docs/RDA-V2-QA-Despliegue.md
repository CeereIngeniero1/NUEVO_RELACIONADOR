# RDA V2 — QA por fase, despliegue gradual y rollback

Fecha: 2026-04-24

## Checklist manual (por fase)

### Fase 0 — Contratos
- [ ] Revisar `docs/RDA-V2-Migracion-Contratos.md` (matriz legacy vs V2, flags).

### Fase 1 — Capa API / Asignar
- [ ] `Asignar_RIPS V3.html` carga sin errores en consola; `rda/index.js` se ejecuta después de SweetAlert.
- [ ] `localStorage.RDA_API_VERSION` responde en consola: `window.RDA?.getRdaApiVersion()` / `window.RDA?.isRdaV2()`.

### Fase 2 — Paciente V2
- [ ] Con `RDA_API_VERSION=v2`: guardar RDA paciente, previsualizar JSON (`JsonEnviarIHCE`), envío sandbox (y prod si aplica y no `IHCE_FORCE_SANDBOX_ONLY`).
- [ ] Error esperado sin contenido clínico: respuesta alineada con backend (`RDA_PACIENTE_SIN_CONTENIDO_CLINICO` u homólogo).
- [ ] Rollback: `RDA_API_VERSION=legacy` → envío vuelve a `RdaPaciente/EnviarIHCE`.

### Fase 3 — CE V2
- [ ] Con `v2`: guardar RDACE, preview, envío sandbox/prod como en Paciente.
- [ ] Paridad de mensajes SweetAlert vs Paciente en fallos de red / 401.

### Fase 4 — Masivo + visor
- [ ] `EnvioRdaPendientes`: búsqueda de pendientes, envío en lote con backend en `RDA_ENVIO_MASIVO_VERSION=legacy` (default).
- [ ] Piloto masivo V2: `RDA_ENVIO_MASIVO_VERSION=v2`, mismos flujos; verificar logs/BD.
- [ ] Visor IHCE: consulta documentos (no depende de rutas RDA V2; solo coherencia de ambiente sandbox/prod).

### Fase 5 — Limpieza
- [ ] `rda-v3.js` no usado en producción (`Asignar_RIPS V3.html` usa `rda/index.js`).
- [ ] Página experimental solo referencia legacy a propósito.

## Despliegue gradual (recomendado)

1. **Entorno de prueba:** `RDA_API_VERSION=v2` en `__APP_CONFIG__` o `localStorage` para usuarios piloto; backend default `RDA_ENVIO_MASIVO_VERSION` omitido hasta validar masivo.
2. **48–72 h:** monitorizar tasa de guardado OK, envío IHCE OK, errores por endpoint (logs).
3. **Masivo V2:** activar `RDA_ENVIO_MASIVO_VERSION=v2` solo tras paridad en Asignar.

## Rollback rápido

| Ámbito | Acción |
|--------|--------|
| UI Asignar | `localStorage.setItem('RDA_API_VERSION','legacy')` + F5, o `__APP_CONFIG__.RDA_API_VERSION` |
| Envío masivo servidor | Quitar `RDA_ENVIO_MASIVO_VERSION` o `=legacy` + reinicio |
| Forzar solo sandbox IHCE | `IHCE_FORCE_SANDBOX_ONLY` (ya documentado en app) |

## Referencias
- `docs/RDA-V2-Migracion-Contratos.md`
- `front_relacionador/public/rda/api/rdaConfig.js`
- `back_relacionador/server/routes/rda/RdaEnvioMasivoRoutes.js`

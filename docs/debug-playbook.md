# Guía corta de depuración

Cuando algo “no funciona”, el objetivo es **reproducir** el fallo y **saber en qué capa está** (navegador → API → SQL / servicios externos).

## 1. Reproducir

Anotar en una sola nota:

| Campo | Qué escribir |
|--------|----------------|
| Pasos | Qué pantalla, botón, orden exacto |
| Esperado | Qué debería pasar |
| Obtenido | Qué pasó (mensaje, pantalla en blanco, etc.) |

Si no se puede repetir, no es un bug “cerrado” todavía.

## 2. Navegador (capa cliente)

1. **Red (Network):** filtrar por `Fetch/XHR`.
   - Anotar **URL completa**, **método** (GET/POST), **código HTTP** (401, 500, etc.).
   - Abrir **Respuesta** y **Cuerpo de la petición** si es POST.
2. **Consola:** errores en rojo (JS, recursos 404, CORS suelen aparecer aquí o en Network).

Para el módulo RDA (1888), el mapa de archivos está en [`front_relacionador/public/rda/README.md`](../front_relacionador/public/rda/README.md).

## 3. Backend (capa API)

1. En el repo, buscar el fragmento de ruta en `back_relacionador/server/routes/` (nombre del archivo suele coincidir con el módulo: RIPS, Asignar, etc.).
2. Revisar el handler: validaciones, `try/catch`, `res.status(...)`.
3. Mirar la **consola del proceso Node** cuando se reproduce el error (stack traces, mensajes `console.error`).

## 4. Datos (SQL / terceros)

- Si la API responde 500 o datos vacíos: ¿existen filas esperadas en la BD? ¿El paciente / evaluación / factura usados en la prueba son válidos?
- Rutas que llaman IHCE u otros externos: revisar variables en `.env` ([`.env.example`](../back_relacionador/.env.example)) y logs del servidor.

**No asumir** que el JSON que arma el front es correcto hasta compararlo con la documentación del endpoint.

## 5. Plantilla para reportar un bug

Copiar y rellenar:

```
Pasos:
1.
2.

Esperado:

Obtenido:

Peticiones relevantes (URL + status):
-

Captura / recorte de respuesta JSON (sin datos personales reales):
-
```

## 6. Referencias útiles

- Endpoints consulta externa / IHCE: [`back_relacionador/docs/RDA-Consulta-Externa-endpoints.md`](../back_relacionador/docs/RDA-Consulta-Externa-endpoints.md)
- Campos RDA paciente: [`docs/resolucion-1888/rda_paciente.md`](resolucion-1888/rda_paciente.md)
- Campos RDA consulta externa: [`docs/resolucion-1888/rda_consulta_externa.md`](resolucion-1888/rda_consulta_externa.md)

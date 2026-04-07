# Smoke test local

Objetivo: comprobar en pocos minutos que **backend (3000)** y **frontend (3100)** arrancan y se hablan sin errores obvios de CORS o rutas.

## 1. Prerrequisitos

- Node.js 18 o superior recomendado (tests del backend usan `node --test`).
- SQL Server y configuración que ya usa el proyecto (p. ej. `CRInfo.ini` según [Arquitectura Backend](arquitectura/backend.md)).
- `back_relacionador/.env` a partir de [`.env.example`](../back_relacionador/.env.example) si trabajas con IHCE / RDACE.
- En el front, `front_relacionador/public/NombreEquipoServidor.js` apuntando al host donde corre el API (típicamente `localhost` o la IP del servidor 3000).

## 2. Arranque

Terminal 1 — backend:

```bash
cd back_relacionador
npm install
npm run dev
```

Terminal 2 — frontend:

```bash
cd front_relacionador
npm install
node app.js
```

## 3. Comprobaciones mínimas

### 3.1 Backend sin navegador

- Abrir o pedir con curl / navegador: `http://localhost:3000/health`
- **Esperado:** JSON con `"ok": true`.

### 3.2 Frontend + API en DevTools

1. Abrir `http://localhost:3100/Asignar_RIPS%20V3.html` (o la ruta que usen en su despliegue).
2. Abrir **Herramientas de desarrollador → Red (Network)**.
3. **Login:** realizar inicio de sesión habitual.
   - Debe aparecer una petición tipo `POST .../api/login` hacia el host del backend.
   - **Esperado:** estado `200` y cuerpo con `token` (o `401` si credenciales de prueba incorrectas, pero sin error de red/CORS).
4. **Catálogo API V3:** acción que cargue listas RDA (p. ej. abrir sección que dispare catálogos) o pegar en la barra de direcciones del navegador solo para probar conectividad:
   - Ejemplo: `http://localhost:3000/apiV3/TipodeRips` (puede requerir datos en BD; lo importante en smoke es que **no sea fallo de conexión** ni CORS).

Si el front llama a otro puerto u host, revisar `NombreEquipoServidor.js` y que el backend tenga `cors()` activo (ya está en `server/server.js`).

## 4. Tests HTTP automáticos (backend)

Desde `back_relacionador`, el script `npm test` usa `node --test --test-force-exit` para que el proceso termine aunque la carga del servidor abra Workers y pool de BD.

```bash
cd back_relacionador
npm test
```

No sustituyen pruebas manuales con BD ni flujo completo; solo validan rutas básicas montadas en la app Express. Usan `node --test` y `fetch` integrado (Node 18+); no añaden dependencias npm extra.

## 5. Siguientes pasos

- Depuración sistemática: [debug-playbook.md](debug-playbook.md).
- Regresión antes de cambios grandes: [regression-checklist-manual.md](regression-checklist-manual.md).

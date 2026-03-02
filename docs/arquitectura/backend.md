# Arquitectura del Backend

## Tecnología

- **Runtime:** Node.js con Express
- **Base de datos:** SQL Server (vía `tedious`)
- **Puerto:** 3000
- **Autenticación:** JWT (`jsonwebtoken`) + sesiones (`express-session`)

---

## Estructura de archivos

```
back_relacionador/
├── server/
│   ├── server.js               ← Punto de entrada (Express, middlewares, rutas)
│   ├── db.js                   ← Conexión principal a SQL Server (tedious)
│   ├── db2.js                  ← Conexión secundaria (pool)
│   └── routes/
│       ├── loginRoutes.js                    → /api
│       ├── infoPacientesRoutes.js            → /api
│       ├── infoPacientesRoutes V2.js         → /apiV2
│       ├── epsRoutes.js                      → /api
│       ├── epsRoutes V2.js                   → /apiv2
│       ├── Asignar_RipsRoutes.js             → /api
│       ├── Asignar_RipsRoutes V2.js          → /apiV2
│       ├── Asignar_RipsRoutes V3.js          → /apiV3  (activa)
│       ├── MaestroListasRipsRoutes.js        → /api
│       ├── descargarArchivosRIPSRoutes.js    → /RIPS
│       ├── descargarArchivosRIPSRoutes V2.js → /RIPSv2
│       ├── descargarXMLSporAPIFacturatechRoutes.js → /XMLS
│       ├── descargarXMLSporAPIFenalcoRoutes.js     → /XMLS
│       ├── FacturadorRoutes.js               → /XMLS
│       └── prepararArchivosDeEnvioRoutes.js  (Worker Thread)
├── SQL/                         ← Scripts SQL (ver guía abajo)
├── QUERYS_ACTUALIZAR_CODIGOS_LOCALIZACION/  ← Scripts de actualización
└── Redme.txt                    ← Instrucciones originales de despliegue
```

---

## Conexión a la base de datos

La conexión se configura en `db.js`. Lee automáticamente el servidor y catálogo desde:

```
C:/CeereSio/CRInfo.ini
```

**Credenciales SQL:** Login `CeereRIPS` / Password `crsoft`

---

## Configuración inicial de SQL Server

### 1. Habilitar TCP/IP

1. Abrir **SQL Server Configuration Manager**
2. Ir a `SQL Server Network Configuration` → seleccionar la instancia
3. Click derecho en `TCP/IP` → Propiedades → pestaña `IP Addresses`
4. En cada IP: `TCP Dynamic Ports` = `0`, `TCP Port` = `1433`
5. **Reiniciar la instancia**

### 2. Autenticación mixta

1. En SQL Management Studio: click derecho en la instancia → Propiedades
2. Ir a `Security` → seleccionar "SQL Server and Windows Authentication mode"
3. **Reiniciar la instancia**

### 3. Crear login

```sql
CREATE LOGIN CeereRIPS WITH PASSWORD = 'crsoft';
-- Asignar permisos necesarios sobre la base de datos
```

---

## Carpetas requeridas en el servidor

Deben existir antes de usar la descarga de RIPS:

```powershell
New-Item -ItemType Directory -Path "C:\CeereSio\RIPS_2275" -Force
New-Item -ItemType Directory -Path "C:\CeereSio\RIPS_2275\ARCHIVOS_RIPS" -Force
New-Item -ItemType Directory -Path "C:\CeereSio\RIPS_2275\ARCHIVOS_RIPS_JSON" -Force
New-Item -ItemType Directory -Path "C:\CeereSio\RIPS_2275\XMLS" -Force
New-Item -ItemType Directory -Path "C:\CeereSio\RIPS_2275\ARCHIVOS_DE_ENVIO" -Force
```

---

## Despliegue como servicio de Windows (PM2)

### Instalación

```bash
# 1. Crear carpeta para PM2
mkdir C:\.pm2

# 2. Variable de entorno
# Windows → Variables de entorno del sistema → Nueva
#   Nombre: pm2_home
#   Valor:  c:\.pm2

# 3. Instalar PM2
npm install pm2 -g

# 4. Cargar el backend
pm2 start C:\ruta\al\server.js --name "Back_Relacionador"

# 5. Guardar estado
pm2 save

# 6. Instalar como servicio
npm install pm2-windows-service -g
pm2-service-install -n Relacionador_Servicio
# IMPORTANTE: En PM2_SERVICE_SCRIPTS? → responder "No"
```

### Configurar servicio en Windows

1. `Win+R` → `services.msc`
2. Buscar `Relacionador_Servicio`
3. Propiedades → Tipo inicio: **Automático (inicio retrasado)**
4. Pestaña Recuperación → Primer/Segundo/Siguientes errores: **Reiniciar el servicio**

### Comandos útiles PM2

```bash
pm2 list        # Ver procesos
pm2 status      # Estado del daemon
pm2 resurrect   # Reiniciar tras bloqueo
echo %PM2_HOME% # Verificar variable
```

---

## Factura 0 (solo clientes CeereSoftware)

Para el checkbox de Factura 0, se requiere ejecutar un INSERT/UPDATE en la tabla `[dbo].[Factura]`. Consultar el archivo `back_relacionador/Redme.txt` líneas 21-203 para el SQL completo y las variables a configurar.

### Trigger asociado

```sql
CREATE TRIGGER trg_UpdateFacturaOnEmpresaVChange
ON EmpresaV AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted WHERE [Id Estado] = 7)
    BEGIN
        UPDATE Factura
        SET [Id EmpresaV] = i.[Id EmpresaV]
        FROM inserted i
        WHERE Factura.[No Factura] = '0000000'
        AND i.[Id Estado] = 7;
    END
END;
```

---

## Referencia adicional

- Scripts SQL: ver [scripts_sql.md](scripts_sql.md) *(pendiente)*
- API endpoints: pendiente de documentar
- Archivo original completo: `back_relacionador/Redme.txt`

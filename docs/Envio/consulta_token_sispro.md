# Informe de Consulta de Token - SISPRO

Información obtenida de la página: `https://ihcecol.sispro.gov.co/AdminTokens/inicio/menu-principal/admin-tokens/consultar-token`

## Información de la Entidad
- **Entidad:** 0500112124 - GRUPO MEDICO ESPECIALIZADO MEDELLÍN S.A.S : Antioquia-MEDELLÍN
- **Estado de Inscripción:** Se ha asignado el token
- **Usuario que consultó:** ISABEL CRISTINA BUILES ZABALA

---

## 🧪 PARÁMETROS DE PREPRODUCCIÓN
- **ClientID:** `57476781-93bc-43c9-b3cd-d361f8411735`
- **ClientSecret:** `<no commitear — usar variable de entorno o cofre de secretos>`
- **Fecha de expiración:** 03/18/2027 00:00:00
- **EndPoint:** `https://sandbox.ihcecol.gov.co/ihce`
- **TenantID:** `3d4b3d76-b910-426c-bd8f-bd964e3e1b53`
- **Scope:** `api://ca9a5155-3135-4e44-a644-b92175eb4d21/.default`
- **APIMsubskey:** `<no commitear — configurar fuera del repositorio>`

---

## 🚀 PARÁMETROS DE PRODUCCIÓN
- **ClientID:** `2ecde51d-172a-41b3-8dec-5b82233270a9`
- **ClientSecret:** `<no commitear — usar variable de entorno o cofre de secretos>`
- **Fecha de expiración:** 03/18/2027 00:00:00
- **EndPoint:** `https://www.ihcecol.gov.co/ihce`
- **TenantID:** `3d4b3d76-b910-426c-bd8f-bd964e3e1b53`
- **Scope:** `api://0789435e-b8df-40b1-8eac-76dc233bad0b/.default`
- **APIMsubskey:** `<no commitear — configurar fuera del repositorio>`

---

## Colección Postman oficial (sandbox prestadores v1.3)

Material de referencia enviado por el Ministerio (IHCE / interoperabilidad): colección importable en Postman con **obtener-token**, **$enviar-rda-paciente**, **$enviar-rda-hospitalización**, **$enviar-rda-urgencias** y **$enviar-rda-consulta** (consulta externa).

Archivo versionado en este repositorio (sin secretos del cliente: sustituir variables `clientid`, `clientsecret`, `APIMsubsKey`, `APIkey` —Azure Functions—, etc. con los valores de SISPRO del prestador que estén validando). En el JSON original de MinSalud algunos query params traían una function key literal; aquí quedó referenciada como `{{APIkey}}` para que GitHub no bloquee el push.

- [InteropAPI_Minsalud_Sandbox_Prestadores_v1_3.postman_collection.json](./InteropAPI_Minsalud_Sandbox_Prestadores_v1_3.postman_collection.json)

Flujo sugerido: definir variables de la colección → ejecutar **obtener-token** → probar **enviar-rda-consulta-externa** con el cuerpo de ejemplo; si responde bien en Postman y falla el Relacionador, comparar custodian / REPS y el JSON generado por `JsonEnviarIHCE`.

---
*Archivo generado automáticamente por Antigravity el 26 de marzo de 2026.*

# FIXES — scripts de arreglo (no son el instalador completo)

Ejecutar solo cuando haga falta corregir una BD ya instalada.
No sustituyen `00_INSTALL_*_COMPLETO.sql`.

## 2275
- `18. Fix_ConsultarRIPSPorDefecto_IdOrCodigo.sql` — vista RIPS por defecto (Id o Codigo)
- `22. Fix_Rips_Servicios_Codigo_Grupo.sql` — CodServicio vacio (Codigo Grupo Servicios NULL)

Instalador (no FIX): `2275/23. Factura_Copago_No_Salud.sql` — excluye facturas de copago
(cuota inicial EPS/prepagada) de relación, asignación y descargas.

## 1888
- `FIX_Entidad1888_columnas_Cnsta_Usuarios_Info.sql` — columnas Entidad1888 / Cnsta
- `27. Depurar_Datos_RDA_IHCE.sql` — depuracion datos RDA/IHCE

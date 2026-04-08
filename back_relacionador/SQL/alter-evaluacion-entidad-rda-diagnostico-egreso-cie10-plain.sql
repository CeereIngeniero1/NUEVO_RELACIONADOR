-- NO ejecute ALTER ADD repetidos sobre las mismas columnas: obtendrá Msg 2705 si ya existen.
--
-- 1) Compruebe si la migración ya está aplicada (deberían aparecer las tres filas):
SELECT c.column_id,
       c.name
FROM sys.columns AS c
WHERE c.object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA]', N'U')
  AND (
        c.name = N'Diagnostico Principal Egreso CIE10 Codigo'
     OR c.name = N'Diagnostico Principal Egreso CIE10 Nombre'
     OR c.name = N'Tipo Diagnostico Principal Egreso'
      )
ORDER BY c.column_id;
--
-- Si las tres columnas ya salen en el resultado: no hace falta ejecutar nada más.
--
-- 2) Para agregar solo lo que falta (seguro, reejecutable):
--    Ejecute el archivo:  alter-evaluacion-entidad-rda-diagnostico-egreso-cie10.sql

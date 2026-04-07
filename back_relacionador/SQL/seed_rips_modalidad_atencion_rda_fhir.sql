-- seed_rips_modalidad_atencion_rda_fhir.sql
-- UPSERT catálogo oficial (Ministerio) para RDA/FHIR ColombianTechModality (01-09).
-- Incluye el valor 05 (Extramural prehospitalaria / transporte asistencial).

;WITH src AS (
    SELECT * FROM (VALUES
        (N'01', N'Intramural',                                                     1, 7),
        (N'02', N'Extramural unidad móvil',                                        2, 7),
        (N'03', N'Extramural domiciliaria',                                        3, 7),
        (N'04', N'Extramural jornada de salud',                                    4, 7),
        (N'05', N'Extramural (atención prehospitalaria o transporte asistencial)', 5, 7),
        (N'06', N'Telemedicina interactiva',                                       6, 7),
        (N'07', N'Telemedicina no interactiva',                                    7, 7),
        (N'08', N'Telemedicina telexperticia',                                     8, 7),
        (N'09', N'Telemedicina telemonitoreo',                                     9, 7)
    ) v(Codigo, Nombre, Orden, IdEstado)
)
MERGE [dbo].[RIPS Modalidad Atención] AS t
USING src AS s
ON (t.Codigo = s.Codigo)
WHEN MATCHED THEN
    UPDATE SET
        t.[Nombre Modalidad Atencion] = s.Nombre,
        t.[Orden Modalidad Atencion]  = s.Orden,
        t.[Id Estado]                 = s.IdEstado
WHEN NOT MATCHED THEN
    INSERT (Codigo, [Nombre Modalidad Atencion], [Orden Modalidad Atencion], [Id Estado])
    VALUES (s.Codigo, s.Nombre, s.Orden, s.IdEstado);

-- Verificación:
-- SELECT Codigo, [Nombre Modalidad Atencion], [Orden Modalidad Atencion], [Id Estado]
-- FROM [dbo].[RIPS Modalidad Atención]
-- ORDER BY Codigo;


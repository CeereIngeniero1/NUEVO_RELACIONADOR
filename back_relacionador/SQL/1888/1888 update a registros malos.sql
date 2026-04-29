

UPDATE [dbo].[Tipo de Documento]
SET [Código Tipo de Documento] = CASE [Tipo de Documento]
    WHEN 'CC' THEN 'CC'
    WHEN 'CE' THEN 'CE'
    WHEN 'PA' THEN 'PA'
    WHEN 'RC' THEN 'RC'
    WHEN 'TI' THEN 'TI'
    WHEN 'AS' THEN 'AS'
    WHEN 'MS' THEN 'MS'
    WHEN 'UN' THEN 'UN'
    WHEN 'NI' THEN 'NI'
    WHEN 'NH' THEN 'NH'
END
WHERE [Tipo de Documento] IS NOT NULL;



UPDATE [dbo].[Tipo de alergia 1888]
SET Descripcion = CASE Codigo
    
    WHEN '04' THEN 'Sustancia que entran en contacto con la piel'
END
WHERE Codigo IN ('04');



UPDATE [dbo].[Entorno de atencion 1888]
SET Descripcion = CASE Codigo
    WHEN '01' THEN 'Hogar'
    WHEN '02' THEN 'Comunitario'
    WHEN '03' THEN 'Escolar'
    WHEN '04' THEN 'Laboral'
    WHEN '05' THEN 'Institucional'
END
WHERE Codigo IN ('01','02','03','04','05');




UPDATE  [Factor De Riesgo 1888] SET
 Descripcion = CASE Codigo
  
WHEN '01'THEN 'Químicos'
WHEN '02'THEN 'Físicos'
WHEN '03'THEN 'Biomecánicos'
WHEN '04'THEN 'Psicosociales'
WHEN '05'THEN 'Biológicos'
WHEN '06'THEN 'Otro'
END
WHERE Codigo IN ('01','02','03','04','05', '06')




ALTER TABLE [dbo].[Egreso y Remision 1888]
ALTER COLUMN [Descripcion] VARCHAR(200) NULL;


UPDATE [dbo].[Egreso y Remision 1888]
SET Descripcion = CASE Codigo
    WHEN '01' THEN 'PACIENTE CON DESTINO A SU DOMICILIO'
    WHEN '02' THEN 'PACIENTE MUERTO'
    WHEN '03' THEN 'PACIENTE DERIVADO A OTRO SERVICIO'
    WHEN '04' THEN 'REFERIDO A OTRA INSTITUCION'
    WHEN '05' THEN 'CONTRAREFERIDO A OTRA INSTITUCION'
    WHEN '06' THEN 'DERIVADO O REFERIDO A HOSPITALIZACION DOMICILIARIA'
    WHEN '07' THEN 'DERIVADO A SERVICIO SOCIAL'
    WHEN '08' THEN 'PACIENTE CONTINUA EN EL SERVICIO (CORTE FACTURACION)'
END
WHERE Codigo IN ('01','02','03','04','05','06','07','08');

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[Egreso y Remision 1888] WHERE Codigo = '08'
)
INSERT INTO [dbo].[Egreso y Remision 1888] (Codigo, Descripcion, [Id Estado])
VALUES ('08', 'PACIENTE CONTINUA EN EL SERVICIO (CORTE FACTURACION)', 7);

DELETE FROM [dbo].[Tipo de tecnología en salud 1888]
WHERE Codigo IN ('01','M','P');

ALTER TABLE [dbo].[Unidad medida dosis 1888]
ADD Nombre VARCHAR(100) NULL;

--OJO SOLO SI ESTAN LOS INCORRECTOS SI ESTAN LOS 273 NO SE NECESITA ELIMINAR
-- DELETE FROM [dbo].[Unidad medida dosis 1888]

IF COL_LENGTH(N'[dbo].[Via administracion medicamento 1888]', N'Nombre') IS NULL
BEGIN
    ALTER TABLE [dbo].[Via administracion medicamento 1888]
    ADD [Nombre] VARCHAR(150) NULL;
END
GO




delete from [dbo].[Unidad tiempo frecuencia 1888]

IF COL_LENGTH(N'[dbo].[Finalidad tecnologia salud 1888]', N'Nombre') IS NULL
BEGIN
    ALTER TABLE [dbo].[Finalidad tecnologia salud 1888]
    ADD [Nombre] VARCHAR(250) NULL;
END
GO
delete from  [Finalidad tecnologia salud 1888]




delete from [Unidad tiempo duracion 1888]

IF NOT EXISTS (SELECT 1 FROM [dbo].[Unidad tiempo duracion 1888])
INSERT INTO [dbo].[Unidad tiempo duracion 1888] (Codigo, Descripcion, [Id Estado])
VALUES
('1', 'Minutos', 7),
('2', 'Horas', 7),
('3', 'Día', 7),
('4', 'Semanas', 7),
('5', 'Mes', 7),
('6', 'Año', 7),
('7', 'Según respuesta al tratamiento', 7);
GO

-- Garantiza creación automática en Entidad1888 cuando nace una Entidad nueva
-- o cuando se actualiza/corrige el documento en Entidad.
CREATE OR ALTER TRIGGER [dbo].[trg_Entidad_AfterInsert_EnsureEntidad1888]
ON [dbo].[Entidad]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[Entidad1888] ([Documento Entidad])
    SELECT LTRIM(RTRIM(i.[Documento Entidad]))
    FROM inserted i
    WHERE i.[Documento Entidad] IS NOT NULL
      AND LTRIM(RTRIM(i.[Documento Entidad])) <> ''
      AND NOT EXISTS (
          SELECT 1
          FROM [dbo].[Entidad1888] e
          WHERE LTRIM(RTRIM(e.[Documento Entidad])) = LTRIM(RTRIM(i.[Documento Entidad]))
      );
END;
GO

-- Evitar solapamiento con triggers legacy que pueden duplicar inserciones
IF OBJECT_ID(N'[dbo].[TR_Entidad_Insert]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TR_Entidad_Insert];
GO

IF OBJECT_ID(N'[dbo].[TR_Entidad_Update_Doc]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TR_Entidad_Update_Doc];
GO




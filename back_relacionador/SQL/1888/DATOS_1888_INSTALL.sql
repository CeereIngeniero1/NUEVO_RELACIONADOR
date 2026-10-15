/*
==============================================================================
  DATOS RELACIONADOR 1888 — INSTALACIÓN IDEMPOTENTE
==============================================================================
  Inserts de catálogos y población Entidad1888. Scripts MERGE grandes se referencian al final.

  Orden de ejecución:
    1. TABLAS
    2. ALTER
    3. UPDATES
    4. DATOS (este)
    4b. CATALOGOS_RDA_FHIR_INSTALL.sql
    5. VISTAS

  Prerrequisitos:
    - Scripts anteriores ejecutados

  Fuentes:
    - 1888.sql
    - 1888 Insertar.sql
    - insert_paises.sql
    - 1888_insert_ocupacion_tabla.sql
    - 1888_create_cups_tabla_con_datos.sql
    - 1888_create_cie11_tabla_con_datos.sql
    - 1888_insert_medicamentos_dci.sql
    - 1888_insert_ciudad_municipios.sql
==============================================================================
*/

SET NOCOUNT ON;
GO

/* Sexo Identidad Genero */
IF NOT EXISTS (SELECT 1 FROM dbo.[Sexo Identidad Genero] WHERE Codigo = N'01')
    INSERT INTO dbo.[Sexo Identidad Genero] (Codigo,[Identidad Genero],[Descripcion Identidad Genero],[Id Estado])
    VALUES (N'01', N'Masculino', N'Masculino', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Sexo Identidad Genero] WHERE Codigo = N'02')
    INSERT INTO dbo.[Sexo Identidad Genero] (Codigo,[Identidad Genero],[Descripcion Identidad Genero],[Id Estado])
    VALUES (N'02', N'Femenino', N'Femenino', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Sexo Identidad Genero] WHERE Codigo = N'03')
    INSERT INTO dbo.[Sexo Identidad Genero] (Codigo,[Identidad Genero],[Descripcion Identidad Genero],[Id Estado])
    VALUES (N'03', N'Transgénero', N'Transgénero', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Sexo Identidad Genero] WHERE Codigo = N'04')
    INSERT INTO dbo.[Sexo Identidad Genero] (Codigo,[Identidad Genero],[Descripcion Identidad Genero],[Id Estado])
    VALUES (N'04', N'Neutro', N'Neutro', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Sexo Identidad Genero] WHERE Codigo = N'05')
    INSERT INTO dbo.[Sexo Identidad Genero] (Codigo,[Identidad Genero],[Descripcion Identidad Genero],[Id Estado])
    VALUES (N'05', N'No lo declara', N'No lo declara', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Sexo Identidad Genero] WHERE Codigo = N'06')
    INSERT INTO dbo.[Sexo Identidad Genero] (Codigo,[Identidad Genero],[Descripcion Identidad Genero],[Id Estado])
    VALUES (N'06', N'Sin asignar', N'Sin asignar', 7);
GO

/* Etnia */
IF NOT EXISTS (SELECT 1 FROM dbo.Etnia WHERE [Código Etnia] = N'1')
    INSERT INTO dbo.Etnia ([Código Etnia],Etnia,[Descripción Etnia],[Orden Etnia],[Id Estado])
    VALUES (N'1', N'Indigena', N'Indigena', 1, 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Etnia WHERE [Código Etnia] = N'2')
    INSERT INTO dbo.Etnia ([Código Etnia],Etnia,[Descripción Etnia],[Orden Etnia],[Id Estado])
    VALUES (N'2', N'ROM (Gitano)', N'ROM (Gitano)', 1, 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Etnia WHERE [Código Etnia] = N'3')
    INSERT INTO dbo.Etnia ([Código Etnia],Etnia,[Descripción Etnia],[Orden Etnia],[Id Estado])
    VALUES (N'3', N'Raizal (Archipielago San Andrés y Providencia)', N'Raizal (Archipielago San Andrés y Providencia)', 1, 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Etnia WHERE [Código Etnia] = N'4')
    INSERT INTO dbo.Etnia ([Código Etnia],Etnia,[Descripción Etnia],[Orden Etnia],[Id Estado])
    VALUES (N'4', N'Palenquero de San Basilio', N'Palenquero de San Basilio', 1, 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Etnia WHERE [Código Etnia] = N'5')
    INSERT INTO dbo.Etnia ([Código Etnia],Etnia,[Descripción Etnia],[Orden Etnia],[Id Estado])
    VALUES (N'5', N'Negro(a) o mulato(a) o afrocolombiano(a) o afrodescendiente', N'Negro(a) o mulato(a) o afrocolombiano(a) o afrodescendiente', 1, 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Etnia WHERE [Código Etnia] = N'6')
    INSERT INTO dbo.Etnia ([Código Etnia],Etnia,[Descripción Etnia],[Orden Etnia],[Id Estado])
    VALUES (N'6', N'Otras etnias', N'Otras etnias', 1, 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Etnia WHERE [Código Etnia] = N'99')
    INSERT INTO dbo.Etnia ([Código Etnia],Etnia,[Descripción Etnia],[Orden Etnia],[Id Estado])
    VALUES (N'99', N'Ninguna de las anteriores', N'Ninguna de las anteriores', 1, 7);
GO

/* Discapacidad */
IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'01')
    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])
    VALUES (N'01', N'Discapacidad física', N'Discapacidad física', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'02')
    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])
    VALUES (N'02', N'Discapacidad visual', N'Discapacidad visual', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'03')
    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])
    VALUES (N'03', N'Discapacidad auditiva', N'Discapacidad auditiva', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'04')
    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])
    VALUES (N'04', N'Discapacidad intelectual', N'Discapacidad intelectual', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'05')
    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])
    VALUES (N'05', N'Discapacidad sicosocial (mental)', N'Discapacidad sicosocial (mental)', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'06')
    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])
    VALUES (N'06', N'Sordoceguera', N'Sordoceguera', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'07')
    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])
    VALUES (N'07', N'Discapacidad múltiple', N'Discapacidad múltiple', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'08')
    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])
    VALUES (N'08', N'Sin discapacidad', N'Sin discapacidad', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'09')
    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])
    VALUES (N'09', N'Sin Asignar', N'Sin Asignar', 7);
GO

/* País Colombia default */
IF NOT EXISTS (SELECT 1 FROM dbo.País1888 WHERE Codigo = N'170')
    INSERT INTO dbo.País1888 (Codigo, Nombre, Estado) VALUES (N'170', N'Colombia', 7);
GO

/* Regimen */
IF NOT EXISTS (SELECT 1 FROM dbo.Regimen WHERE Nombre = N'Contributivo')
    INSERT INTO dbo.Regimen (Nombre, [Id Estado]) VALUES (N'Contributivo', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Regimen WHERE Nombre = N'Subsidiado')
    INSERT INTO dbo.Regimen (Nombre, [Id Estado]) VALUES (N'Subsidiado', 1);
GO

/* Entidad1888 — poblar desde Entidad (1888 Insertar.sql) */
INSERT INTO dbo.Entidad1888 (
    [Documento Entidad],[Id Identidad Genero],Talla,Peso,[Id Etnia],
    [Comunidad Etnica],[Id Discapacidad],Alergias)
SELECT e.[Documento Entidad], 6, N'0', N'0', 15, N'No', 9, N'No'
FROM dbo.Entidad e
LEFT JOIN dbo.Entidad1888 e1888
    ON LTRIM(RTRIM(e1888.[Documento Entidad])) = LTRIM(RTRIM(e.[Documento Entidad]))
WHERE e1888.[Documento Entidad] IS NULL;
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo de tecnología en salud 1888] WHERE Codigo = '01')
    INSERT INTO dbo.[Tipo de tecnología en salud 1888] (Codigo, Descripcion) VALUES ('01', 'Medicamento');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo de tecnología en salud 1888] WHERE Codigo = 'M')
    INSERT INTO dbo.[Tipo de tecnología en salud 1888] (Codigo, Descripcion) VALUES ('M', 'Medicamento');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo de tecnología en salud 1888] WHERE Codigo = 'P')
    INSERT INTO dbo.[Tipo de tecnología en salud 1888] (Codigo, Descripcion) VALUES ('P', 'Procedimiento');
GO

/* Países ISO (insert_paises.sql) */
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'004')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('004', N'Afghanistan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'008')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('008', N'Albania', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'010')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('010', N'Antarctica', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'012')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('012', N'Algeria', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'016')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('016', N'American Samoa', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'020')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('020', N'Andorra', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'024')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('024', N'Angola', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'028')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('028', N'Antigua and Barbuda', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'031')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('031', N'Azerbaijan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'032')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('032', N'Argentina', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'036')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('036', N'Australia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'040')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('040', N'Austria', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'044')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('044', N'Bahamas', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'048')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('048', N'Bahrain', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'050')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('050', N'Bangladesh', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'051')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('051', N'Armenia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'052')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('052', N'Barbados', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'056')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('056', N'Belgium', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'060')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('060', N'Bermuda', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'064')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('064', N'Bhutan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'068')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('068', N'Bolivia, Plurinational State of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'070')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('070', N'Bosnia and Herzegovina', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'072')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('072', N'Botswana', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'074')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('074', N'Bouvet Island', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'076')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('076', N'Brazil', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'084')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('084', N'Belize', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'086')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('086', N'British Indian Ocean Territory', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'090')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('090', N'Solomon Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'092')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('092', N'Virgin Islands, British', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'096')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('096', N'Brunei Darussalam', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'100')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('100', N'Bulgaria', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'104')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('104', N'Myanmar', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'108')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('108', N'Burundi', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'112')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('112', N'Belarus', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'116')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('116', N'Cambodia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'120')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('120', N'Cameroon', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'124')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('124', N'Canada', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'132')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('132', N'Cabo Verde', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'136')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('136', N'Cayman Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'140')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('140', N'Central African Republic', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'144')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('144', N'Sri Lanka', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'148')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('148', N'Chad', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'152')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('152', N'Chile', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'156')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('156', N'China', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'158')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('158', N'Taiwan, Province of China', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'162')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('162', N'Christmas Island', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'166')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('166', N'Cocos (Keeling) Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'170')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('170', N'Colombia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'174')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('174', N'Comoros', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'175')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('175', N'Mayotte', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'178')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('178', N'Congo', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'180')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('180', N'Congo, the Democratic Republic of the', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'184')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('184', N'Cook Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'188')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('188', N'Costa Rica', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'191')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('191', N'Croatia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'192')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('192', N'Cuba', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'196')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('196', N'Cyprus', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'203')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('203', N'Czechia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'204')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('204', N'Benin', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'208')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('208', N'Denmark', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'212')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('212', N'Dominica', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'214')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('214', N'Dominican Republic', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'218')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('218', N'Ecuador', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'222')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('222', N'El Salvador', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'226')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('226', N'Equatorial Guinea', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'231')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('231', N'Ethiopia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'232')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('232', N'Eritrea', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'233')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('233', N'Estonia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'234')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('234', N'Faroe Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'238')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('238', N'Falkland Islands (Malvinas)', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'239')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('239', N'South Georgia and the South Sandwich Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'242')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('242', N'Fiji', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'246')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('246', N'Finland', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'248')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('248', N'Åland Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'250')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('250', N'France', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'254')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('254', N'French Guiana', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'258')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('258', N'French Polynesia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'260')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('260', N'French Southern Territories', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'262')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('262', N'Djibouti', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'266')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('266', N'Gabon', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'268')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('268', N'Georgia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'270')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('270', N'Gambia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'275')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('275', N'Palestine, State of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'276')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('276', N'Germany', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'288')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('288', N'Ghana', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'292')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('292', N'Gibraltar', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'296')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('296', N'Kiribati', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'300')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('300', N'Greece', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'304')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('304', N'Greenland', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'308')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('308', N'Grenada', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'312')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('312', N'Guadeloupe', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'316')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('316', N'Guam', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'320')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('320', N'Guatemala', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'324')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('324', N'Guinea', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'328')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('328', N'Guyana', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'332')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('332', N'Haiti', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'334')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('334', N'Heard Island and McDonald Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'336')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('336', N'Holy See', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'340')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('340', N'Honduras', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'344')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('344', N'Hong Kong', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'348')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('348', N'Hungary', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'352')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('352', N'Iceland', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'356')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('356', N'India', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'360')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('360', N'Indonesia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'364')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('364', N'Iran, Islamic Republic of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'368')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('368', N'Iraq', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'372')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('372', N'Ireland', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'376')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('376', N'Israel', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'380')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('380', N'Italy', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'384')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('384', N'Côte d''Ivoire', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'388')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('388', N'Jamaica', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'392')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('392', N'Japan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'398')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('398', N'Kazakhstan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'400')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('400', N'Jordan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'404')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('404', N'Kenya', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'408')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('408', N'Korea, Democratic People''s Republic of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'410')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('410', N'Korea, Republic of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'414')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('414', N'Kuwait', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'417')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('417', N'Kyrgyzstan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'418')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('418', N'Lao People''s Democratic Republic', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'422')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('422', N'Lebanon', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'426')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('426', N'Lesotho', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'428')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('428', N'Latvia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'430')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('430', N'Liberia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'434')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('434', N'Libya', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'438')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('438', N'Liechtenstein', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'440')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('440', N'Lithuania', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'442')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('442', N'Luxembourg', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'446')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('446', N'Macao', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'450')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('450', N'Madagascar', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'454')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('454', N'Malawi', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'458')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('458', N'Malaysia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'462')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('462', N'Maldives', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'466')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('466', N'Mali', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'470')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('470', N'Malta', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'474')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('474', N'Martinique', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'478')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('478', N'Mauritania', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'480')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('480', N'Mauritius', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'484')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('484', N'Mexico', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'492')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('492', N'Monaco', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'496')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('496', N'Mongolia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'498')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('498', N'Moldova, Republic of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'499')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('499', N'Montenegro', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'500')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('500', N'Montserrat', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'504')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('504', N'Morocco', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'508')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('508', N'Mozambique', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'512')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('512', N'Oman', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'516')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('516', N'Namibia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'520')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('520', N'Nauru', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'524')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('524', N'Nepal', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'528')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('528', N'Netherlands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'531')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('531', N'Curaçao', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'533')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('533', N'Aruba', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'534')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('534', N'Sint Maarten (Dutch part)', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'535')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('535', N'Bonaire, Sint Eustatius and Saba', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'540')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('540', N'New Caledonia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'548')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('548', N'Vanuatu', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'554')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('554', N'New Zealand', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'558')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('558', N'Nicaragua', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'562')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('562', N'Niger', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'566')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('566', N'Nigeria', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'570')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('570', N'Niue', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'574')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('574', N'Norfolk Island', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'578')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('578', N'Norway', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'580')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('580', N'Northern Mariana Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'581')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('581', N'United States Minor Outlying Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'583')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('583', N'Micronesia, Federated States of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'584')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('584', N'Marshall Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'585')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('585', N'Palau', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'586')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('586', N'Pakistan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'591')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('591', N'Panama', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'598')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('598', N'Papua New Guinea', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'600')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('600', N'Paraguay', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'604')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('604', N'Peru', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'608')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('608', N'Philippines', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'612')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('612', N'Pitcairn', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'616')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('616', N'Poland', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'620')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('620', N'Portugal', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'624')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('624', N'Guinea-Bissau', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'626')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('626', N'Timor-Leste', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'630')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('630', N'Puerto Rico', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'634')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('634', N'Qatar', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'638')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('638', N'Réunion', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'642')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('642', N'Romania', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'643')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('643', N'Russian Federation', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'646')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('646', N'Rwanda', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'652')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('652', N'Saint Barthélemy', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'654')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('654', N'Saint Helena, Ascension and Tristan da Cunha', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'659')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('659', N'Saint Kitts and Nevis', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'660')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('660', N'Anguilla', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'662')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('662', N'Saint Lucia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'663')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('663', N'Saint Martin (French part)', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'666')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('666', N'Saint Pierre and Miquelon', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'670')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('670', N'Saint Vincent and the Grenadines', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'674')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('674', N'San Marino', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'678')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('678', N'Sao Tome and Principe', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'682')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('682', N'Saudi Arabia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'686')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('686', N'Senegal', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'688')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('688', N'Serbia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'690')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('690', N'Seychelles', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'694')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('694', N'Sierra Leone', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'702')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('702', N'Singapore', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'703')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('703', N'Slovakia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'704')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('704', N'Viet Nam', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'705')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('705', N'Slovenia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'706')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('706', N'Somalia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'710')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('710', N'South Africa', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'716')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('716', N'Zimbabwe', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'724')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('724', N'Spain', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'728')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('728', N'South Sudan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'729')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('729', N'Sudan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'732')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('732', N'Western Sahara', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'740')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('740', N'Suriname', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'744')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('744', N'Svalbard and Jan Mayen', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'748')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('748', N'Swaziland', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'752')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('752', N'Sweden', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'756')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('756', N'Switzerland', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'760')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('760', N'Syrian Arab Republic', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'762')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('762', N'Tajikistan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'764')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('764', N'Thailand', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'768')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('768', N'Togo', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'772')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('772', N'Tokelau', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'776')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('776', N'Tonga', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'780')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('780', N'Trinidad and Tobago', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'784')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('784', N'United Arab Emirates', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'788')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('788', N'Tunisia', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'792')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('792', N'Turkey', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'795')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('795', N'Turkmenistan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'796')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('796', N'Turks and Caicos Islands', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'798')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('798', N'Tuvalu', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'800')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('800', N'Uganda', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'804')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('804', N'Ukraine', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'807')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('807', N'Macedonia, the former Yugoslav Republic of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'818')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('818', N'Egypt', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'826')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('826', N'United Kingdom', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'831')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('831', N'Guernsey', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'832')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('832', N'Jersey', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'833')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('833', N'Isle of Man', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'834')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('834', N'Tanzania, United Republic of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'840')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('840', N'United States of America', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'850')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('850', N'Virgin Islands, U.S.', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'854')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('854', N'Burkina Faso', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'858')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('858', N'Uruguay', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'860')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('860', N'Uzbekistan', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'862')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('862', N'Venezuela, Bolivarian Republic of', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'876')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('876', N'Wallis and Futuna', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'882')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('882', N'Samoa', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'887')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('887', N'Yemen', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[País1888] WHERE Codigo = N'894')
    INSERT INTO dbo.[País1888] (Codigo, Nombre, Estado) VALUES ('894', N'Zambia', 7);
GO

/* Ocupación CIUO88AC (1888_insert_ocupacion_tabla.sql) */
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'110')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('110','Oficiales de las fuerzas militares','Oficiales de las fuerzas militares',1,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1110')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1110','Miembros del poder ejecutivo y de los cuerpos legislativos','Miembros del poder ejecutivo y de los cuerpos legislativos',2,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1121')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1121','Directores generales, de empresas o entidades de la administración pública','Directores generales, de empresas o entidades de la administración pública',3,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1122')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1122','Directores de regionales, sucursales, oficinas y afines de la administración pública','Directores de regionales, sucursales, oficinas y afines de la administración pública',4,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1130')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1130','Jefes de comunidades indígenas, etnias especiales y afines','Jefes de comunidades indígenas, etnias especiales y afines',5,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1141')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1141','Dirigentes y administradores de partidos políticos','Dirigentes y administradores de partidos políticos',6,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1142')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1142','Dirigentes y administradores de organizaciones de empleadores, de trabajadores y de otras de interés socioeconómico','Dirigentes y administradores de organizaciones de empleadores, de trabajadores y de otras de interés socioeconómico',7,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1143')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1143','Dirigentes y administradores de organizaciones humanitarias y de otras organizaciones especializadas','Dirigentes y administradores de organizaciones humanitarias y de otras organizaciones especializadas',8,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'120')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('120','Suboficiales de las fuerzas militares','Suboficiales de las fuerzas militares',9,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1211')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1211','Dierectores y gerentes generales de empresas privadas','Dierectores y gerentes generales de empresas privadas',10,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1212')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1212','Directores de regionales,sucursales,oficinas y afines de empresas privadas','Directores de regionales,sucursales,oficinas y afines de empresas privadas',11,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'130')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('130','Soldados de las fuerzas militares','Soldados de las fuerzas militares',12,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1311')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1311','Directores de departamentos de producción y operaciones en agricultura, caza, silvicultura y pesca','Directores de departamentos de producción y operaciones en agricultura, caza, silvicultura y pesca',13,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1312')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1312','Directores de departamentos de producción y operaciones en industrias manufactureras y extractivas','Directores de departamentos de producción y operaciones en industrias manufactureras y extractivas',14,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1313')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1313','Directores de departamentos de producción y operaciones en construcción y obras públicas','Directores de departamentos de producción y operaciones en construcción y obras públicas',15,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1314')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1314','Directores de departamentos de producción y operaciones en comercio mayorista y minorista','Directores de departamentos de producción y operaciones en comercio mayorista y minorista',16,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1315')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1315','Directores de departamentos de producción y operaciones en restaurantes, hoteles y afines','Directores de departamentos de producción y operaciones en restaurantes, hoteles y afines',17,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1316')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1316','Directores de departamentos de producción y operaciones en transporte, almacenamiento y comunicaciones','Directores de departamentos de producción y operaciones en transporte, almacenamiento y comunicaciones',18,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1317')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1317','Directores de departamentos de producción y operaciones en empresas de intermediación financiera y servicios a empresas','Directores de departamentos de producción y operaciones en empresas de intermediación financiera y servicios a empresas',19,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1318')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1318','Directores de departamentos de producción y operaciones en servicios de salud, educación y recreación','Directores de departamentos de producción y operaciones en servicios de salud, educación y recreación',20,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1319')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1319','Directores de departamentos de producción y operaciones, no clasificados bajo otros epígrafes','Directores de departamentos de producción y operaciones, no clasificados bajo otros epígrafes',21,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1321')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1321','Directores de departamentos financieros y administrativos','Directores de departamentos financieros y administrativos',22,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1322')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1322','Directores de departamentos de personal y de relaciones laborales','Directores de departamentos de personal y de relaciones laborales',23,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1323')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1323','Directores de departamentos de ventas y comercialización','Directores de departamentos de ventas y comercialización',24,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1324')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1324','Directores de departamentos de publicidad y de relaciones públicas','Directores de departamentos de publicidad y de relaciones públicas',25,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1325')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1325','Directores de departamentos de abastecimiento y distribución','Directores de departamentos de abastecimiento y distribución',26,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1326')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1326','Directores de departamentos de servicios de informática','Directores de departamentos de servicios de informática',27,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1327')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1327','Directores de departamentos de investigaciones y desarrollo','Directores de departamentos de investigaciones y desarrollo',28,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1329')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1329','Otros directores de departamentos, no clasificados bajo otros epígrafes','Otros directores de departamentos, no clasificados bajo otros epígrafes',29,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1411')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1411','Coordinadores y supervisores financieros y administrativos','Coordinadores y supervisores financieros y administrativos',30,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1412')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1412','Coordinadores y supervisores de  ventas y comercialización','Coordinadores y supervisores de  ventas y comercialización',31,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1413')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1413','Coordinadores y supervisores de publicidad, información, relaciones públicas y servicio al cliente','Coordinadores y supervisores de publicidad, información, relaciones públicas y servicio al cliente',32,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1414')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1414','Coordinadores y supervisores de  almacenamiento, abastecimiento y distribución','Coordinadores y supervisores de  almacenamiento, abastecimiento y distribución',33,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1415')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1415','Coordinadores y supervisores de informática,  investigación y desarrollo','Coordinadores y supervisores de informática,  investigación y desarrollo',34,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1416')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1416','Coordinadores y supervisores de servicios sociales, educación y salud','Coordinadores y supervisores de servicios sociales, educación y salud',35,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1419')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1419','Otros coordinadores y supervisores en mandos medios de empresas públicas y privadas, no clasificados bajo otros epígrafes','Otros coordinadores y supervisores en mandos medios de empresas públicas y privadas, no clasificados bajo otros epígrafes',36,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1420')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1420','Comerciantes al por mayor y al por menor','Comerciantes al por mayor y al por menor',37,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1421')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1421','Coordinadores y supervisores de producción y operaciones en aprovechamiento agrícola, pecuario y silvícola','Coordinadores y supervisores de producción y operaciones en aprovechamiento agrícola, pecuario y silvícola',38,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1422')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1422','Coordinadores y supervisores de  producción y operaciones en explotación  procesamiento y transporte de minerales, petroleo y gas','Coordinadores y supervisores de  producción y operaciones en explotación  procesamiento y transporte de minerales, petroleo y gas',39,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1423')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1423','Coordinadores y supervisores de producción y operaciones en  procesamiento, fabricación y ensamble','Coordinadores y supervisores de producción y operaciones en  procesamiento, fabricación y ensamble',40,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1424')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1424','Coordinadores y supervisores de  producción y operaciones en construcción y obras públicas','Coordinadores y supervisores de  producción y operaciones en construcción y obras públicas',41,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1425')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1425','Coordinadores y supervisores de producción y operaciones en  instalación, mantenimiento y reparación mecánica, electrica y electrónica','Coordinadores y supervisores de producción y operaciones en  instalación, mantenimiento y reparación mecánica, electrica y electrónica',42,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1426')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1426','Coordinadores y supervisores de  producción y operaciones en restaurantes, hotéles hospitales y afines','Coordinadores y supervisores de  producción y operaciones en restaurantes, hotéles hospitales y afines',43,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1427')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1427','Coordinadores y supervisores de producción y operaciones  en transporte y comunicaciones','Coordinadores y supervisores de producción y operaciones  en transporte y comunicaciones',44,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1428')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1428','Coordinadores y supervisores de producción y operaciones en cuidados personales, limpieza y servicios similares','Coordinadores y supervisores de producción y operaciones en cuidados personales, limpieza y servicios similares',45,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'1429')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('1429','Coordinadores y supervisores  en mandos medios de producción y operaciones en empresas públicas y privadas, no clasificados bajo otros epígrafes','Coordinadores y supervisores  en mandos medios de producción y operaciones en empresas públicas y privadas, no clasificados bajo otros epígrafes',46,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'210')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('210','Oficiales de la policía nacional','Oficiales de la policía nacional',47,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2111')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2111','Físicos y astrónomos','Físicos y astrónomos',48,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2112')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2112','Meteorólogos','Meteorólogos',49,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2113')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2113','Químicos y afines','Químicos y afines',50,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2114')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2114','Geólogos y geofísicos','Geólogos y geofísicos',51,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2121')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2121','Matemáticos y actuarios','Matemáticos y actuarios',52,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2122')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2122','Estadísticos','Estadísticos',53,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2130')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2130','Profesionales de la informática','Profesionales de la informática',54,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2141')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2141','Arquitectos y urbanistas','Arquitectos y urbanistas',55,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2142')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2142','Ingenieros civiles, ingenieros de transporte y afines','Ingenieros civiles, ingenieros de transporte y afines',56,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2143')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2143','Ingenieros eléctricos, ingenieros electrónicos de telecomunicaciones y afines','Ingenieros eléctricos, ingenieros electrónicos de telecomunicaciones y afines',57,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2144')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2144','Ingenieros mecánicos','Ingenieros mecánicos',58,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2145')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2145','Ingenieros industriales y afines','Ingenieros industriales y afines',59,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2146')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2146','Ingenieros químicos y afines','Ingenieros químicos y afines',60,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2147')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2147','Ingenieros de minas, ingenieros metalúrgicos y afines','Ingenieros de minas, ingenieros metalúrgicos y afines',61,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2148')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2148','Ingenieros catastrales, ingenieros geógrafos y afines','Ingenieros catastrales, ingenieros geógrafos y afines',62,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2149')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2149','Arquitectos, ingenieros y afines, no clasificados bajo otros epígrafes','Arquitectos, ingenieros y afines, no clasificados bajo otros epígrafes',63,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'220')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('220','Suboficiales de la policía nacional','Suboficiales de la policía nacional',64,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2211')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2211','Biólogos, botánicos, zoólogos y afines','Biólogos, botánicos, zoólogos y afines',65,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2212')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2212','Especialistas en patología y afines','Especialistas en patología y afines',66,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2213')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2213','Agrónomos y afines','Agrónomos y afines',67,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2221')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2221','Médicos','Médicos',68,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2222')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2222','Odontólogos','Odontólogos',69,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2223')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2223','Médicos veterinarios  y zootecnistas','Médicos veterinarios  y zootecnistas',70,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2224')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2224','Optómetras','Optómetras',71,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2225')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2225','Fonoaudíologos, fisioterapeutas y afines','Fonoaudíologos, fisioterapeutas y afines',72,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2226')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2226','Enfermeros(as) profesionales','Enfermeros(as) profesionales',73,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2227')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2227','Nutricionistas y dietistas','Nutricionistas y dietistas',74,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2229')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2229','Médicos, profesionales en ciencias de la salud y afines, no clasificados bajo otros epígrafes','Médicos, profesionales en ciencias de la salud y afines, no clasificados bajo otros epígrafes',75,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'230')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('230','Agentes de la policía nacional','Agentes de la policía nacional',76,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2311')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2311','Profesores de universidades y otros establecimientos de educación superior','Profesores de universidades y otros establecimientos de educación superior',77,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2312')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2312','Profesores de educación  secundaria','Profesores de educación  secundaria',78,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2313')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2313','Profesores de educación  primaria','Profesores de educación  primaria',79,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2314')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2314','Profesores de educación  preescolar','Profesores de educación  preescolar',80,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2320')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2320','Profesores e instructores de educación especial','Profesores e instructores de educación especial',81,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2331')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2331','Especialistas en métodos pedagógicos y material didáctico','Especialistas en métodos pedagógicos y material didáctico',82,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2332')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2332','Inspectores de la educación','Inspectores de la educación',83,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2333')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2333','Consejeros educativos','Consejeros educativos',84,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2339')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2339','Profesionales de la educación, no clasificados bajo otros epígrafes','Profesionales de la educación, no clasificados bajo otros epígrafes',85,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'240')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('240','Auxiliares de la policia nacional','Auxiliares de la policia nacional',86,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2411')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2411','Contadores','Contadores',87,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2412')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2412','Especialistas en políticas, servicios de personal y afines','Especialistas en políticas, servicios de personal y afines',88,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2413')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2413','Analistas y agentes financieros','Analistas y agentes financieros',89,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2419')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2419','Especialistas en organización, administración de empresas, análisis financiero y afines, no clasificados bajo otros epígrafes','Especialistas en organización, administración de empresas, análisis financiero y afines, no clasificados bajo otros epígrafes',90,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2421')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2421','Abogados','Abogados',91,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2422')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2422','Jueces','Jueces',92,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2429')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2429','Profesionales del derecho, no clasificados bajo otros epígrafes','Profesionales del derecho, no clasificados bajo otros epígrafes',93,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2431')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2431','Catalogadores de piezas de museos, archivos y afines','Catalogadores de piezas de museos, archivos y afines',94,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2432')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2432','Bibliotecarios, documentalistas y afines','Bibliotecarios, documentalistas y afines',95,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2441')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2441','Economistas','Economistas',96,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2442')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2442','Sociólogos, antropólogos y afines','Sociólogos, antropólogos y afines',97,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2443')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2443','Filósofos, historiadores y especialistas en ciencias políticas','Filósofos, historiadores y especialistas en ciencias políticas',98,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2444')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2444','Filólogos, traductores e intérpretes','Filólogos, traductores e intérpretes',99,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2445')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2445','Psicólogos','Psicólogos',100,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2446')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2446','Trabajadores sociales y afines','Trabajadores sociales y afines',101,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2449')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2449','Especialistas en ciencias economicas sociales y humanas, no clasificados bajo otros epígrafes','Especialistas en ciencias economicas sociales y humanas, no clasificados bajo otros epígrafes',102,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2451')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2451','Escritores, periodistas y afines','Escritores, periodistas y afines',103,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2452')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2452','Escultores, pintores y afines','Escultores, pintores y afines',104,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2453')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2453','Compositores, músicos y cantantes','Compositores, músicos y cantantes',105,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2454')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2454','Coreógrafos y bailarines','Coreógrafos y bailarines',106,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2455')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2455','Actores y directores de cine, radio, teatro, televisión y afines','Actores y directores de cine, radio, teatro, televisión y afines',107,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'2460')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('2460','Sacerdotes y religiosos de distintas doctrinas','Sacerdotes y religiosos de distintas doctrinas',108,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3111')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3111','Técnicos, postsecundarios no universitarios en ciencias físicas, químicas y afines','Técnicos, postsecundarios no universitarios en ciencias físicas, químicas y afines',109,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3112')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3112','Técnicos, postsecundarios no universitarios en ingeniería civil, arquitectura, agrimensores y afines','Técnicos, postsecundarios no universitarios en ingeniería civil, arquitectura, agrimensores y afines',110,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3113')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3113','Electrotécnicos','Electrotécnicos',111,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3114')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3114','Técnicos y postsecundarios no universitarios en electrónica y telecomunicaciones','Técnicos y postsecundarios no universitarios en electrónica y telecomunicaciones',112,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3115')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3115','Técnicos y postsecundarios no universitarios en mecánica y construcción mecánica','Técnicos y postsecundarios no universitarios en mecánica y construcción mecánica',113,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3116')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3116','Técnicos y postsecundarios no universitarios en ingeniería  industrial y química industrial','Técnicos y postsecundarios no universitarios en ingeniería  industrial y química industrial',114,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3117')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3117','Técnicos y postsecundarios no universitarios en ingeniería de minas y metalurgia','Técnicos y postsecundarios no universitarios en ingeniería de minas y metalurgia',115,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3118')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3118','Delineantes y dibujantes técnicos','Delineantes y dibujantes técnicos',116,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3119')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3119','Técnicos y postsecundarios no universitarios en ciencias físicas, químicas e ingenierías, no clasificados bajo otros epígrafes','Técnicos y postsecundarios no universitarios en ciencias físicas, químicas e ingenierías, no clasificados bajo otros epígrafes',117,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3121')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3121','Analistas de sistemas informáticos','Analistas de sistemas informáticos',118,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3122')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3122','Técnicos en programación informática','Técnicos en programación informática',119,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3123')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3123','Técnicos en control de equipos informáticos','Técnicos en control de equipos informáticos',120,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3124')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3124','Técnicos en control de robots industriales','Técnicos en control de robots industriales',121,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3131')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3131','Fotógrafos y operadores de equipos de grabación de imagen y sonido','Fotógrafos y operadores de equipos de grabación de imagen y sonido',122,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3132')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3132','Operadores de equipos de radiodifusión, televisión y telecomunicaciones','Operadores de equipos de radiodifusión, televisión y telecomunicaciones',123,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3133')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3133','Operadores de aparatos de diagnóstico y tratamiento médicos','Operadores de aparatos de diagnóstico y tratamiento médicos',124,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3139')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3139','Operadores de equipos ópticos y electrónicos, no clasificados bajo otros epígrafes','Operadores de equipos ópticos y electrónicos, no clasificados bajo otros epígrafes',125,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3141')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3141','Oficiales maquinistas','Oficiales maquinistas',126,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3142')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3142','Capitanes, oficiales de cubierta y prácticos','Capitanes, oficiales de cubierta y prácticos',127,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3143')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3143','Pilotos de aviación y afines','Pilotos de aviación y afines',128,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3144')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3144','Controladores de tráfico aéreo y maritimo','Controladores de tráfico aéreo y maritimo',129,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3145')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3145','Técnicos en seguridad aeronáutica','Técnicos en seguridad aeronáutica',130,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3151')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3151','Inspectores de edificios y de prevención e investigación de incendios','Inspectores de edificios y de prevención e investigación de incendios',131,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3152')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3152','Inspectores de seguridad y salud y control de calidad','Inspectores de seguridad y salud y control de calidad',132,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3211')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3211','Técnicos en ciencias biológicas y afines','Técnicos en ciencias biológicas y afines',133,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3212')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3212','Técnicos en agronomía, zootecnia y silvicultura','Técnicos en agronomía, zootecnia y silvicultura',134,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3221')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3221','Practicantes y asistentes médicos','Practicantes y asistentes médicos',135,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3222')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3222','Higienistas y promotores de salud','Higienistas y promotores de salud',136,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3223')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3223','Técnicos en optometría y ópticos','Técnicos en optometría y ópticos',137,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3224')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3224','Técnicos e higienistas dentales','Técnicos e higienistas dentales',138,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3225')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3225','Técnicos terapeutas, quiroprácticos y afines','Técnicos terapeutas, quiroprácticos y afines',139,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3226')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3226','Técnicos y asistentes veterinarios','Técnicos y asistentes veterinarios',140,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3227')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3227','Técnicos y asistentes en farmacia','Técnicos y asistentes en farmacia',141,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3229')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3229','Técnicos, postsecundarios no universitarios y asistentes de la medicina moderna y la salud (excepto el personal de partería), no clasificados bajo otros epígrafes','Técnicos, postsecundarios no universitarios y asistentes de la medicina moderna y la salud (excepto el personal de partería), no clasificados bajo otros epígrafes',142,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3231')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3231','Practicantes de la medicina tradicional','Practicantes de la medicina tradicional',143,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3232')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3232','Curanderos','Curanderos',144,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3233')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3233','Parteras','Parteras',145,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3311')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3311','Asistentes de enseñanza en educación  superior, secundaria y primaria','Asistentes de enseñanza en educación  superior, secundaria y primaria',146,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3312')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3312','Asistentes de enseñanza en educación preescolar','Asistentes de enseñanza en educación preescolar',147,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3320')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3320','Asistentes de educación especial','Asistentes de educación especial',148,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3331')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3331','Instructores de educación vocacional artística y técnica','Instructores de educación vocacional artística y técnica',149,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3332')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3332','Instructores de educación vocacional artesanal','Instructores de educación vocacional artesanal',150,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3333')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3333','Instructores medios de transporte y afines','Instructores medios de transporte y afines',151,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3411')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3411','Agentes de seguros','Agentes de seguros',152,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3412')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3412','Agentes inmobiliarios','Agentes inmobiliarios',153,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3413')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3413','Agentes de viajes','Agentes de viajes',154,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3414')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3414','Representantes comerciales y técnicos de ventas','Representantes comerciales y técnicos de ventas',155,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3415')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3415','Compradores','Compradores',156,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3416')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3416','Tasadores y subastadores','Tasadores y subastadores',157,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3419')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3419','Técnicos, postsecundarios no universitarios y asistentes en operaciones comerciales, no clasificados bajo otros epígrafes','Técnicos, postsecundarios no universitarios y asistentes en operaciones comerciales, no clasificados bajo otros epígrafes',158,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3421')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3421','Agentes de compras, intermediarios y consignatarios','Agentes de compras, intermediarios y consignatarios',159,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3422')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3422','Asistentes de comercio exterior','Asistentes de comercio exterior',160,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3423')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3423','Agentes públicos y privados de colocación y contratistas de mano de obra','Agentes públicos y privados de colocación y contratistas de mano de obra',161,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3429')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3429','Agentes comerciales y corredores, no clasificados bajo otros epígrafes','Agentes comerciales y corredores, no clasificados bajo otros epígrafes',162,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3431')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3431','Técnicos, postsecundarios no universitarios y asistentes de servicios administrativos y afines','Técnicos, postsecundarios no universitarios y asistentes de servicios administrativos y afines',163,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3432')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3432','Técnicos, postsecundarios no universitarios y asistentes del derecho y servicios legales y afines','Técnicos, postsecundarios no universitarios y asistentes del derecho y servicios legales y afines',164,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3434')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3434','Técnicos, postsecundarios no universitarios y asistentes de servicios estadísticos, matemáticos y afines','Técnicos, postsecundarios no universitarios y asistentes de servicios estadísticos, matemáticos y afines',165,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3439')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3439','Técnicos, postsecundarios no universitarios y asistentes de servicios de administración, no clasificados bajo otros epígrafes','Técnicos, postsecundarios no universitarios y asistentes de servicios de administración, no clasificados bajo otros epígrafes',166,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3441')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3441','Agentes de aduana e inspectores de fronteras','Agentes de aduana e inspectores de fronteras',167,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3442')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3442','Funcionarios del fisco','Funcionarios del fisco',168,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3443')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3443','Funcionarios de servicios de seguridad social','Funcionarios de servicios de seguridad social',169,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3444')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3444','Funcionarios de servicios de expedición de licencias y permisos','Funcionarios de servicios de expedición de licencias y permisos',170,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3449')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3449','Agentes de la administración pública en aduanas, impuestos y afines, no clasificados bajo otros epígrafes','Agentes de la administración pública en aduanas, impuestos y afines, no clasificados bajo otros epígrafes',171,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3450')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3450','Inspectores de policía y detectives','Inspectores de policía y detectives',172,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3460')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3460','Asistentes en trabajo social y comunitario','Asistentes en trabajo social y comunitario',173,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3471')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3471','Técnicos en diseño y decoradores','Técnicos en diseño y decoradores',174,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3472')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3472','Locutores de radio,  televisión y afines','Locutores de radio,  televisión y afines',175,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3473')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3473','Músicos, cantantes y bailarines callejeros, de cabaret y afines','Músicos, cantantes y bailarines callejeros, de cabaret y afines',176,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3474')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3474','Recreacionistas, payasos, acróbatas, prestidigitadores y afines','Recreacionistas, payasos, acróbatas, prestidigitadores y afines',177,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3475')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3475','Atletas, deportistas y afines','Atletas, deportistas y afines',178,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3476')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3476','Asistentes de cine, teatro, televisión y artes escénicas','Asistentes de cine, teatro, televisión y artes escénicas',179,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'3480')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('3480','Auxiliares laicos de los cultos','Auxiliares laicos de los cultos',180,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4111')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4111','Mecanógrafos, transcriptores de textos y afines','Mecanógrafos, transcriptores de textos y afines',181,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4112')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4112','Operadores de calculadoras y entrada de datos','Operadores de calculadoras y entrada de datos',182,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4113')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4113','Secretarios (as)','Secretarios (as)',183,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4121')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4121','Auxiliares de contabilidad y cálculo de costos','Auxiliares de contabilidad y cálculo de costos',184,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4122')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4122','Auxiliares de servicios estadísticos y financieros','Auxiliares de servicios estadísticos y financieros',185,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4123')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4123','Auxiliares administrativos y afines','Auxiliares administrativos y afines',186,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4131')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4131','Encargados de control de abastecimientos e inventario','Encargados de control de abastecimientos e inventario',187,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4132')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4132','Encargados de servicios de apoyo a la producción','Encargados de servicios de apoyo a la producción',188,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4133')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4133','Encargados de servicios de transporte','Encargados de servicios de transporte',189,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4141')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4141','Empleados de bibliotecas y archivos','Empleados de bibliotecas y archivos',190,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4142')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4142','Empleados de servicios de correo','Empleados de servicios de correo',191,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4143')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4143','Codificadores de datos, correctores de pruebas de imprenta y afines','Codificadores de datos, correctores de pruebas de imprenta y afines',192,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4144')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4144','Escribientes públicos y afines','Escribientes públicos y afines',193,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4211')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4211','Cajeros y expendedores de billetes','Cajeros y expendedores de billetes',194,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4212')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4212','Taquilleros','Taquilleros',195,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4213')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4213','Receptores de apuestas y afines','Receptores de apuestas y afines',196,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4214')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4214','Prestamistas','Prestamistas',197,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4215')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4215','Cobradores y afines','Cobradores y afines',198,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4221')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4221','Empleados de servicios de lineas de viajes aéreas, marítimas y terrestres','Empleados de servicios de lineas de viajes aéreas, marítimas y terrestres',199,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4222')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4222','Recepcionistas, empleados de información y servicio al cliente','Recepcionistas, empleados de información y servicio al cliente',200,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'4223')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('4223','Empleados telefonistas y de servicios de internet','Empleados telefonistas y de servicios de internet',201,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5111')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5111','Personal de servicio a pasajeros','Personal de servicio a pasajeros',202,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5112')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5112','Revisores, guardas y cobradores de los servicios de transporte','Revisores, guardas y cobradores de los servicios de transporte',203,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5113')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5113','Guías','Guías',204,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5121')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5121','Cocineros y afines','Cocineros y afines',205,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5122')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5122','Meseros, taberneros y afines','Meseros, taberneros y afines',206,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5131')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5131','Niñeras y cuidadoras infantiles','Niñeras y cuidadoras infantiles',207,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5132')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5132','Auxiliares de enfermería y odontología','Auxiliares de enfermería y odontología',208,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5139')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5139','Trabajadores de los cuidados personales y afines, no clasificados bajo otros epígrafes','Trabajadores de los cuidados personales y afines, no clasificados bajo otros epígrafes',209,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5141')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5141','Peluqueros, especialistas en tratamientos de belleza y afines','Peluqueros, especialistas en tratamientos de belleza y afines',210,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5142')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5142','Acompañantes','Acompañantes',211,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5143')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5143','Personal de pompas fúnebres y embalsamadores','Personal de pompas fúnebres y embalsamadores',212,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5149')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5149','Otros trabajadores de servicios personales a particulares, no clasificados bajo otros epígrafes','Otros trabajadores de servicios personales a particulares, no clasificados bajo otros epígrafes',213,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5150')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5150','Astrólogos, adivinadores, quirománticos y afines','Astrólogos, adivinadores, quirománticos y afines',214,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5211')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5211','Bomberos y rescatistas','Bomberos y rescatistas',215,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5212')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5212','Agentes y policias de transito','Agentes y policias de transito',216,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5213')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5213','Guardianes de prisión','Guardianes de prisión',217,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5219')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5219','Personal de los servicios de protección y seguridad, no clasificado bajo otros epígrafes','Personal de los servicios de protección y seguridad, no clasificado bajo otros epígrafes',218,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5310')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5310','Modelos de modas, arte y publicidad','Modelos de modas, arte y publicidad',219,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5320')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5320','Vendedores, demostradores de tiendas y almacenes','Vendedores, demostradores de tiendas y almacenes',220,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5330')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5330','Vendedores en quioscos y puestos de mercado','Vendedores en quioscos y puestos de mercado',221,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5341')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5341','Vendedores ambulantes','Vendedores ambulantes',222,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'5342')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('5342','Vendedores a domicilio y por teléfono','Vendedores a domicilio y por teléfono',223,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6111')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6111','Agricultores de cultivos transitorios','Agricultores de cultivos transitorios',224,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6112')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6112','Agricultores de cultivos permanentes (plantaciones de árboles y arbustos)','Agricultores de cultivos permanentes (plantaciones de árboles y arbustos)',225,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6113')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6113','Trabajadores de huertas, invernaderos, viveros y jardines','Trabajadores de huertas, invernaderos, viveros y jardines',226,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6114')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6114','Trabajadores forestales','Trabajadores forestales',227,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6115')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6115','Trabajadores agropecuarios','Trabajadores agropecuarios',228,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6121')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6121','Criadores de ganado y trabajadores de la cría de animales domésticos diversos','Criadores de ganado y trabajadores de la cría de animales domésticos diversos',229,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6122')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6122','Avicultores','Avicultores',230,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6123')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6123','Criadores de insectos, apicultores, sericicultores y afines','Criadores de insectos, apicultores, sericicultores y afines',231,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6129')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6129','Trabajadores pecuarios, ganaderos y afines, no clasificados bajo otros epígrafes','Trabajadores pecuarios, ganaderos y afines, no clasificados bajo otros epígrafes',232,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6131')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6131','Criadores de especies acuáticas','Criadores de especies acuáticas',233,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6132')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6132','Pescadores','Pescadores',234,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6133')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6133','Cazadores y tramperos','Cazadores y tramperos',235,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6211')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6211','Obreros y peones agropecuarios de labranza y de invernadero','Obreros y peones agropecuarios de labranza y de invernadero',236,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6212')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6212','Obreros forestales','Obreros forestales',237,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'6213')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('6213','Obreros de pesca, caza y trampa','Obreros de pesca, caza y trampa',238,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7111')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7111','Mineros y canteros','Mineros y canteros',239,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7112')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7112','Pegadores cargas explosivas','Pegadores cargas explosivas',240,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7113')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7113','Tronzadores, labrantes y grabadores de piedra','Tronzadores, labrantes y grabadores de piedra',241,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7211')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7211','Albañiles, mamposteros y afines','Albañiles, mamposteros y afines',242,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7212')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7212','Operarios en cemento armado, enfoscadores y afines','Operarios en cemento armado, enfoscadores y afines',243,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7213')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7213','Carpinteros de armar y de blanco','Carpinteros de armar y de blanco',244,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7219')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7219','Oficiales y operarios de la construcción y afines, no clasificados bajo otros epígrafes','Oficiales y operarios de la construcción y afines, no clasificados bajo otros epígrafes',245,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7221')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7221','Techadores','Techadores',246,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7222')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7222','Parqueteros y colocadores de suelos','Parqueteros y colocadores de suelos',247,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7223')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7223','Instaladores de material aislante y de insonorización','Instaladores de material aislante y de insonorización',248,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7224')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7224','Cristaleros','Cristaleros',249,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7225')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7225','Fontaneros e instaladores de tuberías','Fontaneros e instaladores de tuberías',250,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7226')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7226','Electricistas de obras y afines','Electricistas de obras y afines',251,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7231')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7231','Revocadores','Revocadores',252,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7232')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7232','Pintores, empapeladores y afines','Pintores, empapeladores y afines',253,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7233')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7233','Limpiadores de fachadas y deshollinadores','Limpiadores de fachadas y deshollinadores',254,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7311')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7311','Moldeadores y macheros','Moldeadores y macheros',255,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7312')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7312','Soldadores y oxicortadores','Soldadores y oxicortadores',256,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7313')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7313','Chapistas y caldereros','Chapistas y caldereros',257,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7314')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7314','Montadores de estructuras metálicas','Montadores de estructuras metálicas',258,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7315')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7315','Aparejadores y empalmadores de cables','Aparejadores y empalmadores de cables',259,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7316')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7316','Pintores,  barnizadores y enlacadores de artículos metálicos y afines','Pintores,  barnizadores y enlacadores de artículos metálicos y afines',260,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7321')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7321','Herreros y forjadores','Herreros y forjadores',261,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7322')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7322','Herramentistas y afines','Herramentistas y afines',262,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7323')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7323','Pulidores de metales y afiladores de herramientas','Pulidores de metales y afiladores de herramientas',263,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7411')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7411','Mecánicos y ajustadores de vehículos de motor','Mecánicos y ajustadores de vehículos de motor',264,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7412')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7412','Mecánicos y ajustadores de motores de avión','Mecánicos y ajustadores de motores de avión',265,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7413')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7413','Mecánicos y ajustadores de máquinas agrícolas e industriales','Mecánicos y ajustadores de máquinas agrícolas e industriales',266,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7414')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7414','Mecánicos y ajustadores de máquinas, herramientas','Mecánicos y ajustadores de máquinas, herramientas',267,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7421')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7421','Mecánicos y ajustadores eléctricos','Mecánicos y ajustadores eléctricos',268,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7422')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7422','Mecánicos, reparadores y ajustadores de aparatos electrónicos','Mecánicos, reparadores y ajustadores de aparatos electrónicos',269,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7423')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7423','Instaladores y reparadores de telégrafos, teléfonos y líneas electricas','Instaladores y reparadores de telégrafos, teléfonos y líneas electricas',270,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7511')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7511','Mecánicos y reparadores de instrumentos de precisión','Mecánicos y reparadores de instrumentos de precisión',271,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7512')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7512','Fabricantes y afinadores de instrumentos musicales','Fabricantes y afinadores de instrumentos musicales',272,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7521')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7521','Cajistas, tipógrafos y afines','Cajistas, tipógrafos y afines',273,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7522')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7522','Estereotipistas y galvanotipistas','Estereotipistas y galvanotipistas',274,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7523')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7523','Grabadores de imprenta y fotograbadores','Grabadores de imprenta y fotograbadores',275,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7524')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7524','Operarios de la fotografía y afines','Operarios de la fotografía y afines',276,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7525')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7525','Encuadernadores y afines','Encuadernadores y afines',277,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7526')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7526','Impresores de sericigrafía y estampadores a la plancha y en textiles','Impresores de sericigrafía y estampadores a la plancha y en textiles',278,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7611')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7611','Alfareros y afines (barro, arcilla y abrasivos)','Alfareros y afines (barro, arcilla y abrasivos)',279,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7612')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7612','Sopladores, modeladores, laminadores, cortadores y pulidores de vidrio','Sopladores, modeladores, laminadores, cortadores y pulidores de vidrio',280,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7613')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7613','Grabadores de vidrio','Grabadores de vidrio',281,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7614')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7614','Pintores decoradores de vidrio, cerámica y otros materiales','Pintores decoradores de vidrio, cerámica y otros materiales',282,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7621')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7621','Cesteros, bruceros y afines','Cesteros, bruceros y afines',283,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7622')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7622','Artesanos de la madera y materiales similares','Artesanos de la madera y materiales similares',284,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7631')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7631','Artesanos de los tejidos, el cuero y materiales similares','Artesanos de los tejidos, el cuero y materiales similares',285,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7632')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7632','Bordadores y afines','Bordadores y afines',286,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7641')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7641','Joyeros, orfebres y plateros','Joyeros, orfebres y plateros',287,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7642')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7642','Floristas y arreglistas florales','Floristas y arreglistas florales',288,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7649')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7649','Otros artesanos, no clasificados bajo otros epígrafes','Otros artesanos, no clasificados bajo otros epígrafes',289,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7711')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7711','Carniceros, pescaderos y afines','Carniceros, pescaderos y afines',290,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7712')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7712','Panaderos, pasteleros y confiteros','Panaderos, pasteleros y confiteros',291,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7713')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7713','Operarios de la elaboración de productos lácteos','Operarios de la elaboración de productos lácteos',292,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7714')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7714','Operarios de la conservación de frutas, legumbres, verduras y afines','Operarios de la conservación de frutas, legumbres, verduras y afines',293,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7715')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7715','Catadores y clasificadores de alimentos y bebidas','Catadores y clasificadores de alimentos y bebidas',294,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7716')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7716','Preparadores y elaboradores de tabaco y sus productos','Preparadores y elaboradores de tabaco y sus productos',295,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7721')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7721','Preparadores de fibras','Preparadores de fibras',296,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7722')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7722','Tejedores con telares o de tejidos de punto y afines','Tejedores con telares o de tejidos de punto y afines',297,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7723')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7723','Sastres, modistos costureros sombrereros y afines','Sastres, modistos costureros sombrereros y afines',298,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7724')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7724','Peleteros y afines','Peleteros y afines',299,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7725')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7725','Tapiceros, colchoneros y afines','Tapiceros, colchoneros y afines',300,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7731')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7731','Apelambradores, pellejeros y curtidores','Apelambradores, pellejeros y curtidores',301,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7732')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7732','Zapateros y afines','Zapateros y afines',302,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7741')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7741','Operarios del tratamiento de la madera','Operarios del tratamiento de la madera',303,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7742')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7742','Ebanistas y afines','Ebanistas y afines',304,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'7743')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('7743','Ajustadores y operadores de máquinas de labrar madera','Ajustadores y operadores de máquinas de labrar madera',305,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8111')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8111','Operadores de instalaciones mineras','Operadores de instalaciones mineras',306,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8112')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8112','Operadores de instalaciones de procesamiento de minerales y rocas','Operadores de instalaciones de procesamiento de minerales y rocas',307,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8113')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8113','Perforadores y sondistas de pozos y afines','Perforadores y sondistas de pozos y afines',308,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8121')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8121','Operadores de hornos de minerales y de hornos de primera fusión de metales','Operadores de hornos de minerales y de hornos de primera fusión de metales',309,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8122')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8122','Operadores de hornos de segunda fusión, máquinas de colar y moldear metales y trenes de laminación','Operadores de hornos de segunda fusión, máquinas de colar y moldear metales y trenes de laminación',310,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8123')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8123','Operadores de instalaciones de tratamiento térmico de metales','Operadores de instalaciones de tratamiento térmico de metales',311,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8124')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8124','Operadores de máquinas trefiladoras y estiradoras de metales','Operadores de máquinas trefiladoras y estiradoras de metales',312,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8131')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8131','Operadores de mezcladoras y de hornos de vidriería  y afines','Operadores de mezcladoras y de hornos de vidriería  y afines',313,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8132')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8132','Operadores de mezcladoras y de  hornos de cerámica y afines','Operadores de mezcladoras y de  hornos de cerámica y afines',314,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8139')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8139','Operadores de instalaciones de vidriería, cerámica y afines, no clasificados bajo otros epígrafes','Operadores de instalaciones de vidriería, cerámica y afines, no clasificados bajo otros epígrafes',315,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8141')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8141','Operadores de instalaciones de procesamiento de la madera','Operadores de instalaciones de procesamiento de la madera',316,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8142')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8142','Operadores de instalaciones para la preparación de pasta o pulpa para papel','Operadores de instalaciones para la preparación de pasta o pulpa para papel',317,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8143')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8143','Operadores de instalaciones para la fabricación de papel','Operadores de instalaciones para la fabricación de papel',318,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8151')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8151','Operadores de instalaciones quebrantadoras, trituradoras y mezcladoras de sustancias químicas','Operadores de instalaciones quebrantadoras, trituradoras y mezcladoras de sustancias químicas',319,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8152')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8152','Operadores de instalaciones de tratamiento químico térmico','Operadores de instalaciones de tratamiento químico térmico',320,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8153')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8153','Operadores de equipos de filtración y separación de sustancias químicas','Operadores de equipos de filtración y separación de sustancias químicas',321,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8154')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8154','Operadores de equipos de destilación y de reacción química (excepto petróleo y gas natural)','Operadores de equipos de destilación y de reacción química (excepto petróleo y gas natural)',322,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8155')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8155','Operadores de instalaciones de refinación de petróleo y gas natural','Operadores de instalaciones de refinación de petróleo y gas natural',323,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8159')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8159','Operadores de instalaciones de tratamientos químicos no clasificados bajo otros epígrafes','Operadores de instalaciones de tratamientos químicos no clasificados bajo otros epígrafes',324,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8161')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8161','Operadores de instalaciones de producción de energía','Operadores de instalaciones de producción de energía',325,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8162')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8162','Operadores de máquinas de vapor y calderas','Operadores de máquinas de vapor y calderas',326,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8163')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8163','Operadores de incineradores','Operadores de incineradores',327,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8164')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8164','Operadores de  instalaciones de tratamiento de agua y afines','Operadores de  instalaciones de tratamiento de agua y afines',328,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8165')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8165','Operadores de instalaciones de refrigeración, calefacción y ventilación','Operadores de instalaciones de refrigeración, calefacción y ventilación',329,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8170')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8170','Operadores de cadenas de montaje automatizadas e intalaciones mecánicas y de robots industriales','Operadores de cadenas de montaje automatizadas e intalaciones mecánicas y de robots industriales',330,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8211')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8211','Operadores de máquinas herramientas y afines','Operadores de máquinas herramientas y afines',331,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8212')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8212','Operadores de máquinas para fabricar productos de cemento y otros productos minerales','Operadores de máquinas para fabricar productos de cemento y otros productos minerales',332,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8221')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8221','Operadores de máquinas para fabricar productos farmacéuticos y cosméticos','Operadores de máquinas para fabricar productos farmacéuticos y cosméticos',333,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8222')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8222','Operadores de máquinas para fabricar municiones y explosivos','Operadores de máquinas para fabricar municiones y explosivos',334,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8223')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8223','Operadores de máquinas pulidoras, galvanizadoras y recubridoras de metales','Operadores de máquinas pulidoras, galvanizadoras y recubridoras de metales',335,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8229')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8229','Operadores de máquinas para fabricar productos químicos, no clasificados bajo otros epígrafes','Operadores de máquinas para fabricar productos químicos, no clasificados bajo otros epígrafes',336,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8231')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8231','Operadores de máquinas para fabricar productos de caucho','Operadores de máquinas para fabricar productos de caucho',337,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8232')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8232','Operadores de máquinas para fabricar productos de plástico','Operadores de máquinas para fabricar productos de plástico',338,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8240')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8240','Operadores de máquinas para fabricar productos de madera','Operadores de máquinas para fabricar productos de madera',339,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8251')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8251','Operadores de máquinas de imprenta, reproducción fotográfica y afines','Operadores de máquinas de imprenta, reproducción fotográfica y afines',340,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8252')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8252','Operadores de máquinas de encuadernación','Operadores de máquinas de encuadernación',341,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8253')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8253','Operadores de máquinas para fabricar productos de papel y afines','Operadores de máquinas para fabricar productos de papel y afines',342,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8261')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8261','Operadores de máquinas de preparación de fibras, hilado y devanado','Operadores de máquinas de preparación de fibras, hilado y devanado',343,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8262')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8262','Operadores de telares y otras máquinas tejedoras','Operadores de telares y otras máquinas tejedoras',344,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8263')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8263','Operadores de máquinas para coser','Operadores de máquinas para coser',345,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8264')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8264','Operadores de máquinas de blanqueo, teñido y tintura','Operadores de máquinas de blanqueo, teñido y tintura',346,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8265')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8265','Operadores de máquinas de tratamiento de pieles y cueros','Operadores de máquinas de tratamiento de pieles y cueros',347,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8266')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8266','Operadores de máquinas para la fabricación de calzado y afines','Operadores de máquinas para la fabricación de calzado y afines',348,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8267')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8267','Patronistas, cortadores de tela, cuero y afines','Patronistas, cortadores de tela, cuero y afines',349,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8269')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8269','Operadores de máquinas para fabricar productos textiles y artículos de piel y cuero, no clasificados bajo otros epígrafes','Operadores de máquinas para fabricar productos textiles y artículos de piel y cuero, no clasificados bajo otros epígrafes',350,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8271')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8271','Operadores de máquinas para procesar carne, pescado y mariscos','Operadores de máquinas para procesar carne, pescado y mariscos',351,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8272')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8272','Operadores de máquinas para elaborar productos lácteos','Operadores de máquinas para elaborar productos lácteos',352,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8273')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8273','Operadores de máquinas para moler cereales y especias','Operadores de máquinas para moler cereales y especias',353,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8274')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8274','Operadores de máquinas para procesar cereales, productos de panadería, repostería y confitería','Operadores de máquinas para procesar cereales, productos de panadería, repostería y confitería',354,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8275')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8275','Operadores de máquinas para procesar frutos húmedos, secos y hortalizas','Operadores de máquinas para procesar frutos húmedos, secos y hortalizas',355,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8276')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8276','Operadores de máquinas para fabricar azúcares','Operadores de máquinas para fabricar azúcares',356,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8277')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8277','Operadores de máquinas para elaborar té, café y cacao','Operadores de máquinas para elaborar té, café y cacao',357,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8278')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8278','Operadores de máquinas para elaborar cerveza, vinos y otras bebidas','Operadores de máquinas para elaborar cerveza, vinos y otras bebidas',358,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8279')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8279','Operadores de máquinas para elaborar productos del tabaco','Operadores de máquinas para elaborar productos del tabaco',359,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8281')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8281','Ensambladores de mecanismos y elementos mecánicos de máquinas','Ensambladores de mecanismos y elementos mecánicos de máquinas',360,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8282')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8282','Ensambladores de equipos eléctricos','Ensambladores de equipos eléctricos',361,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8283')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8283','Ensambladores de equipos electrónicos','Ensambladores de equipos electrónicos',362,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8284')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8284','Ensambladores de productos metálicos, de caucho y plástico','Ensambladores de productos metálicos, de caucho y plástico',363,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8285')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8285','Ensambladores de productos de madera y materiales afines','Ensambladores de productos de madera y materiales afines',364,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8286')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8286','Ensambladores de productos de cartón, textiles y materiales afines','Ensambladores de productos de cartón, textiles y materiales afines',365,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8290')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8290','Otros operadores de máquinas y ensambladores','Otros operadores de máquinas y ensambladores',366,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8311')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8311','Maquinistas de vehículos por riel','Maquinistas de vehículos por riel',367,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8312')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8312','Guardafrenos, guardagujas y agentes de maniobras','Guardafrenos, guardagujas y agentes de maniobras',368,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8321')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8321','Conductores de camionetas y vehículos livianos','Conductores de camionetas y vehículos livianos',369,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8322')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8322','Conductores de taxis','Conductores de taxis',370,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8323')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8323','Conductores de buses, microbuses y colectivos','Conductores de buses, microbuses y colectivos',371,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8324')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8324','Conductores de camiones y vehículos pesados','Conductores de camiones y vehículos pesados',372,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8331')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8331','Operadores de maquinaria agrícola y forestal motorizada','Operadores de maquinaria agrícola y forestal motorizada',373,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8332')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8332','Operadores de máquinas de movimiento de tierras, construcción vías y afines','Operadores de máquinas de movimiento de tierras, construcción vías y afines',374,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8333')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8333','Operadores de grúas, de aparatos elevadores y afines','Operadores de grúas, de aparatos elevadores y afines',375,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8334')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8334','Operadores de carretillas elevadoras','Operadores de carretillas elevadoras',376,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'8340')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('8340','Marineros de cubierta y afines','Marineros de cubierta y afines',377,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9111')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9111','Ayudante de taller, mecánica, vehículos de motor y afines','Ayudante de taller, mecánica, vehículos de motor y afines',378,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9112')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9112','Ayudantes en reparación y mecánica en general (excepto vehículos de motor)','Ayudantes en reparación y mecánica en general (excepto vehículos de motor)',379,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9120')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9120','Limpiabotas y otros trabajadores callejeros','Limpiabotas y otros trabajadores callejeros',380,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9131')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9131','Mensajeros, porteadores y repartidores','Mensajeros, porteadores y repartidores',381,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9132')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9132','Porteros , conserjes y afines','Porteros , conserjes y afines',382,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9133')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9133','Vigilantes y celadores','Vigilantes y celadores',383,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9134')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9134','Recolectores y surtidores de aparatos automáticos','Recolectores y surtidores de aparatos automáticos',384,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9135')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9135','Lectores de medidortes','Lectores de medidortes',385,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9141')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9141','Recolectores de basura','Recolectores de basura',386,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9142')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9142','Barrenderos y afines','Barrenderos y afines',387,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9143')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9143','Recolectores de material reciclable','Recolectores de material reciclable',388,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9210')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9210','Personal doméstico','Personal doméstico',389,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9221')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9221','Aseadores y fumigadores de oficinas, hoteles y otros establecimientos','Aseadores y fumigadores de oficinas, hoteles y otros establecimientos',390,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9222')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9222','Lavanderos y planchadores manuales','Lavanderos y planchadores manuales',391,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9223')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9223','Lavadores de vehículos, ventanas y afines','Lavadores de vehículos, ventanas y afines',392,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9311')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9311','Obreros de minas y canteras','Obreros de minas y canteras',393,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9312')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9312','Obreros de obras públicas y mantenimiento: carreteras, presas y obras similares','Obreros de obras públicas y mantenimiento: carreteras, presas y obras similares',394,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9313')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9313','Obreros de la construcción de edificios','Obreros de la construcción de edificios',395,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9321')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9321','Obreros de ensamble','Obreros de ensamble',396,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9322')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9322','Embaladores manuales y otros obreros de la industria manufacturera','Embaladores manuales y otros obreros de la industria manufacturera',397,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9331')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9331','Conductores de vehículos accionados a pedal o a brazo','Conductores de vehículos accionados a pedal o a brazo',398,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9332')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9332','Conductores de vehículos de tracción animal','Conductores de vehículos de tracción animal',399,7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'9333')
    INSERT INTO [Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado]) VALUES ('9333','Obreros de carga','Obreros de carga',400,7);
GO

/* Tipo diagnostico principal 1888 — 01/02/03 (idempotente por Codigo) */
IF OBJECT_ID(N'dbo.[Tipo diagnostico principal 1888]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo diagnostico principal 1888] WHERE Codigo = N'01')
        INSERT INTO dbo.[Tipo diagnostico principal 1888] (Codigo, Descripcion, [Id Estado])
        VALUES (N'01', N'Impresión Diagnóstica', 7);
    ELSE
        UPDATE dbo.[Tipo diagnostico principal 1888]
        SET Descripcion = N'Impresión Diagnóstica', [Id Estado] = 7 WHERE Codigo = N'01';

    IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo diagnostico principal 1888] WHERE Codigo = N'02')
        INSERT INTO dbo.[Tipo diagnostico principal 1888] (Codigo, Descripcion, [Id Estado])
        VALUES (N'02', N'Confirmado Nuevo', 7);
    ELSE
        UPDATE dbo.[Tipo diagnostico principal 1888]
        SET Descripcion = N'Confirmado Nuevo', [Id Estado] = 7 WHERE Codigo = N'02';

    IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo diagnostico principal 1888] WHERE Codigo = N'03')
        INSERT INTO dbo.[Tipo diagnostico principal 1888] (Codigo, Descripcion, [Id Estado])
        VALUES (N'03', N'Confirmado Repetido', 7);
    ELSE
        UPDATE dbo.[Tipo diagnostico principal 1888]
        SET Descripcion = N'Confirmado Repetido', [Id Estado] = 7 WHERE Codigo = N'03';
END
GO

/* Entorno de atencion 1888 — 01-05 (idempotente por Codigo) */
IF OBJECT_ID(N'dbo.[Entorno de atencion 1888]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'01')
        INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'01', N'Hogar', 7);
    ELSE UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Hogar', [Id Estado] = 7 WHERE Codigo = N'01';
    IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'02')
        INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'02', N'Comunitario', 7);
    ELSE UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Comunitario', [Id Estado] = 7 WHERE Codigo = N'02';
    IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'03')
        INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'03', N'Escolar', 7);
    ELSE UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Escolar', [Id Estado] = 7 WHERE Codigo = N'03';
    IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'04')
        INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'04', N'Laboral', 7);
    ELSE UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Laboral', [Id Estado] = 7 WHERE Codigo = N'04';
    IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'05')
        INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'05', N'Institucional', 7);
    ELSE UPDATE dbo.[Entorno de atencion 1888] SET Descripcion = N'Institucional', [Id Estado] = 7 WHERE Codigo = N'05';
END
GO

/* Factor De Riesgo 1888 — 01-06 (idempotente por Codigo) */
IF OBJECT_ID(N'dbo.[Factor De Riesgo 1888]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'01')
        INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'01', N'Químicos', 7);
    ELSE UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Químicos', [Id Estado] = 7 WHERE Codigo = N'01';
    IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'02')
        INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'02', N'Físicos', 7);
    ELSE UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Físicos', [Id Estado] = 7 WHERE Codigo = N'02';
    IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'03')
        INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'03', N'Biomecánicos', 7);
    ELSE UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Biomecánicos', [Id Estado] = 7 WHERE Codigo = N'03';
    IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'04')
        INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'04', N'Psicosociales', 7);
    ELSE UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Psicosociales', [Id Estado] = 7 WHERE Codigo = N'04';
    IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'05')
        INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'05', N'Biológicos', 7);
    ELSE UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Biológicos', [Id Estado] = 7 WHERE Codigo = N'05';
    IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'06')
        INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado]) VALUES (N'06', N'Otro', 7);
    ELSE UPDATE dbo.[Factor De Riesgo 1888] SET Descripcion = N'Otro', [Id Estado] = 7 WHERE Codigo = N'06';
END
GO

/* Entidades sgsss 1888 — EPS contributivo (C) / subsidiado (S), idempotente por Codigo */
IF OBJECT_ID(N'dbo.[Entidades sgsss 1888]', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Regimen', N'U') IS NOT NULL
BEGIN
    DECLARE @Contrib INT = (SELECT [Id Regimen] FROM dbo.Regimen WHERE Nombre = N'Contributivo');
    DECLARE @Subsid  INT = (SELECT [Id Regimen] FROM dbo.Regimen WHERE Nombre = N'Subsidiado');

    DECLARE @Sgsss TABLE (Codigo NVARCHAR(20) NOT NULL PRIMARY KEY, Nombre NVARCHAR(500) NOT NULL, Reg CHAR(1) NOT NULL);
    INSERT INTO @Sgsss (Codigo, Nombre, Reg) VALUES
    (N'CCFC07', N'CAJA DE COMPENSACIÓN FAMILIAR DE CARTAGENA Y BOLÍVAR COMFAMILIAR -CM', 'C'),
    (N'CCFC20', N'CAJA DE COMPENSACIÓN FAMILIAR DEL CHOCÓ -CM', 'C'),
    (N'CCFC23', N'CAJA DE COMPENSACIÓN FAMILIAR DE LA GUAJIRA "COMFAGUAJIRA" -CM', 'C'),
    (N'CCFC24', N'CAJA DE COMPENSACIÓN FAMILIAR DEL HUILA "COMFAMILIAR" -CM', 'C'),
    (N'CCFC27', N'CAJA DE COMPENSACIÓN FAMILIAR DE NARIÑO -CM', 'C'),
    (N'CCFC33', N'CAJA DE COMPENSACIÓN FAMILIAR DE SUCRE -CM', 'C'),
    (N'CCFC50', N'CAJA DE COMPENSACIÓN FAMILIAR DEL ORIENTE COLOMBIANO "COMFAORIENTE" -CM', 'C'),
    (N'CCFC53', N'CAJA DE COMPENSACIÓN FAMILIAR DE CUNDINAMARCA "COMFACUNDI" -CM', 'C'),
    (N'CCFC55', N'CAJA DE COMPENSACIÓN FAMILIAR CAJACOPI ATLÁNTICO -CM', 'C'),
    (N'EAS016', N'EMPRESAS PUBLICAS DE MEDELLIN - DEPARTAMENTO MEDICO', 'C'),
    (N'EAS027', N'FONDO PASIVO SOCIAL DE LOS FERROCARRILES NACIONALES', 'C'),
    (N'EPS001', N'ALIANSALUD EPS S.A.', 'C'),
    (N'EPS002', N'SALUD TOTAL ENTIDAD PROMOTORA DE SALUD DEL REGIMEN CONTRIBUTIVO Y DEL REGIMEN SUBSIDIADO S.A.', 'C'),
    (N'EPS005', N'ENTIDAD PROMOTORA DE SALUD SANITAS S.A.S.', 'C'),
    (N'EPS008', N'CAJA DE COMPENSACIÓN FAMILIAR COMPENSAR', 'C'),
    (N'EPS010', N'EPS SURAMERICANA S.A.', 'C'),
    (N'EPS012', N'CAJA DE COMPENSACION FAMILIAR DEL VALLE DEL CAUCA "COMFENALCO VALLE DE LA GENTE"', 'C'),
    (N'EPS016', N'COOMEVA ENTIDAD PROMOTORA DE SALUD S.A. "COOMEVA E.P.S. S.A."', 'C'),
    (N'EPS017', N'EPS FAMISANAR S.A.S.', 'C'),
    (N'EPS018', N'ENTIDAD PROMOTORA DE SALUD SERVICIO OCCIDENTAL DE SALUD S.A. S.O.S.', 'C'),
    (N'EPS037', N'NUEVA EPS S.A.', 'C'),
    (N'EPS040', N'ALIANZA MEDELLIN ANTIOQUIA EPS S.A.S. "SAVIA SALUD EPS" -CM', 'C'),
    (N'EPS041', N'NUEVA EPS S.A. -CM', 'C'),
    (N'EPS042', N'COOSALUD EPS S.A.', 'C'),
    (N'EPS044', N'MEDIMAS EPS S.A.S.', 'C'),
    (N'EPS045', N'MEDIMAS EPS S.A.S. -CM', 'C'),
    (N'EPS046', N'FUDACIÓN SALUD MIA', 'C'),
    (N'EPS048', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS', 'C'),
    (N'EPSC22', N'ENTIDAD PROMOTORA DE SALUD DEL REGIMEN SUBSIDIADO EPS CONVIDA -CM', 'C'),
    (N'EPSC25', N'CAPRESOCA E.P.S. -CM', 'C'),
    (N'EPSC34', N'CAPITAL SALUD ENTIDAD PROMOTORA DE SALUD DEL RÉGIMEN SUBSIDIADO SAS "CAPITAL SALUD EPS-S S.A.S." -CM', 'C'),
    (N'EPSIC1', N'ASOCIACIÓN DE CABILDOS INDÍGENAS DEL CESAR Y GUAJIRA "DUSAKAWI A.R.S.I." -CM', 'C'),
    (N'EPSIC3', N'ASOCIACIÓN INDÍGENA DEL CAUCA A.I.C. EPSI -CM', 'C'),
    (N'EPSIC4', N'EMPRESA PROMOTORA DE SALUD INDÍGENA ANAS WAYUU EPSI -CM', 'C'),
    (N'EPSIC5', N'ENTIDAD PROMOTORA DE SALUD MALLAMAS EPSI -CM', 'C'),
    (N'EPSIC6', N'PIJAOS SALUD EPSI -CM', 'C'),
    (N'ESSC07', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS -CM', 'C'),
    (N'ESSC18', N'EMSSANAR S.A.S. -CM', 'C'),
    (N'ESSC24', N'COOSALUD EPS S.A. -CM', 'C'),
    (N'ESSC33', N'COOPERATIVA DE SALUD COMUNITARIA EMPRESA PROMOTORA SUBSIDIADA "COMPARTA EPS-S" -CM', 'C'),
    (N'ESSC62', N'ASMET SALUD EPS S.A.S. -CM', 'C'),
    (N'ESSC76', N'ASOCIACIÓN MUTUAL BARRIOS UNIDOS DE QUIBDO AMBUQ EPS - S - ESS - CM', 'C'),
    (N'ESSC91', N'ECOOPSOS EPS SAS -CM', 'C'),
    (N'CCF007', N'CAJA DE COMPENSACIÓN FAMILIAR DE CARTAGENA Y BOLÍVAR COMFAMILIAR', 'S'),
    (N'CCF023', N'CAJA DE COMPENSACIÓN FAMILIAR DE LA GUAJIRA "COMFAGUAJIRA"', 'S'),
    (N'CCF024', N'CAJA DE COMPENSACIÓN FAMILIAR DEL HUILA "COMFAMILIAR"', 'S'),
    (N'CCF027', N'CAJA DE COMPENSACIÓN FAMILIAR DE NARIÑO', 'S'),
    (N'CCF033', N'CAJA DE COMPENSACIÓN FAMILIAR DE SUCRE', 'S'),
    (N'CCF050', N'CAJA DE COMPENSACIÓN FAMILIAR DEL ORIENTE COLOMBIANO "COMFAORIENTE"', 'S'),
    (N'CCF053', N'CAJA DE COMPENSACIÓN FAMILIAR DE CUNDINAMARCA "COMFACUNDI"', 'S'),
    (N'CCF055', N'CAJA DE COMPENSACIÓN FAMILIAR CAJACOPI ATLÁNTICO', 'S'),
    (N'CCF102', N'CAJA DE COMPENSACIÓN FAMILIAR DEL CHOCÓ', 'S'),
    (N'EPS022', N'ENTIDAD PROMOTORA DE SALUD DEL REGIMEN SUBSIDIADO EPS CONVIDA', 'S'),
    (N'EPS025', N'CAPRESOCA E.P.S.', 'S'),
    (N'EPSI01', N'ASOCIACIÓN DE CABILDOS INDÍGENAS DEL CESAR Y GUAJIRA "DUSAKAWI A.R.S.I."', 'S'),
    (N'EPSI03', N'ASOCIACIÓN INDÍGENA DEL CAUCA A.I.C. EPSI', 'S'),
    (N'EPSI04', N'EMPRESA PROMOTORA DE SALUD INDÍGENA ANAS WAYUU EPSI', 'S'),
    (N'EPSI05', N'ENTIDAD PROMOTORA DE SALUD MALLAMAS EPSI', 'S'),
    (N'EPSI06', N'PIJAOS SALUD EPSI', 'S'),
    (N'EPSS01', N'ALIANSALUD EPS S.A. -CM', 'S'),
    (N'EPSS02', N'SALUD TOTAL ENTIDAD PROMOTORA DE SALUD DEL REGIMEN CONTRIBUTIVO Y DEL REGIMEN SUBSIDIADO S.A. -CM', 'S'),
    (N'EPSS05', N'ENTIDAD PROMOTORA DE SALUD SANITAS S.A.S. -CM', 'S'),
    (N'EPSS08', N'CAJA DE COMPENSACIÓN FAMILIAR COMPENSAR -CM', 'S'),
    (N'EPSS10', N'EPS SURAMERICANA S.A. -CM', 'S'),
    (N'EPSS12', N'CAJA DE COMPENSACION FAMILIAR DEL VALLE DEL CAUCA "COMFENALCO VALLE DE LA GENTE" -CM', 'S'),
    (N'EPSS16', N'COOMEVA ENTIDAD PROMOTORA DE SALUD S.A. "COOMEVA E.P.S. S.A." -CM', 'S'),
    (N'EPSS17', N'EPS FAMISANAR S.A.S. -CM', 'S'),
    (N'EPSS18', N'ENTIDAD PROMOTORA DE SALUD SERVICIO OCCIDENTAL DE SALUD S.A. S.O.S. -CM', 'S'),
    (N'EPSS34', N'CAPITAL SALUD ENTIDAD PROMOTORA DE SALUD DEL RÉGIMEN SUBSIDIADO SAS "CAPITAL SALUD EPS-S S.A.S."', 'S'),
    (N'EPSS37', N'NUEVA EPS S.A. -CM', 'S'),
    (N'EPSS40', N'ALIANZA MEDELLIN ANTIOQUIA EPS S.A.S. "SAVIA SALUD EPS"', 'S'),
    (N'EPSS41', N'NUEVA EPS S.A.', 'S'),
    (N'EPSS42', N'COOSALUD EPS S.A. -CM', 'S'),
    (N'EPSS44', N'MEDIMAS EPS S.A.S. -CM', 'S'),
    (N'EPSS45', N'MEDIMAS EPS S.A.S.', 'S'),
    (N'EPSS46', N'FUDACIÓN SALUD MIA -CM', 'S'),
    (N'EPSS48', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS -CM', 'S'),
    (N'ESS024', N'COOSALUD EPS S.A.', 'S'),
    (N'ESS062', N'ASMET SALUD EPS S.A.S.', 'S'),
    (N'ESS076', N'ASOCIACIÓN MUTUAL BARRIOS UNIDOS DE QUIBDO AMBUQ EPS - S - ESS', 'S'),
    (N'ESS091', N'ECOOPSOS EPS SAS', 'S'),
    (N'ESS118', N'EMSSANAR S.A.S.', 'S'),
    (N'ESS133', N'COOPERATIVA DE SALUD COMUNITARIA EMPRESA PROMOTORA SUBSIDIADA "COMPARTA EPS-S"', 'S'),
    (N'ESS207', N'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUD ENTIDAD PROMOTORA DE SALUD - MUTUAL SER EPS', 'S');

    INSERT INTO dbo.[Entidades sgsss 1888] (Codigo, Nombre, [Id Estado], [Id Regimen])
    SELECT s.Codigo, s.Nombre, 7, CASE s.Reg WHEN 'C' THEN @Contrib ELSE @Subsid END
    FROM @Sgsss s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Entidades sgsss 1888] e WHERE e.Codigo = s.Codigo);

    UPDATE e SET [Id Estado] = 7
    FROM dbo.[Entidades sgsss 1888] e
    INNER JOIN @Sgsss s ON s.Codigo = e.Codigo
    WHERE ISNULL(e.[Id Estado], 0) <> 7;
END
GO

/* Parentesco familiar RDA 1888 — 01-04 (idempotente por Codigo) */
IF OBJECT_ID(N'dbo.[Parentesco familiar RDA 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Par TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Par VALUES ('01', 'Padres'), ('02', 'Hermanos'), ('03', 'Tíos'), ('04', 'Abuelos');

    INSERT INTO dbo.[Parentesco familiar RDA 1888] (Codigo, Descripcion, [Id Estado])
    SELECT p.Codigo, p.Descripcion, 7 FROM @Par p
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Parentesco familiar RDA 1888] t WHERE t.Codigo = p.Codigo);

    UPDATE t SET Descripcion = p.Descripcion, [Id Estado] = 7
    FROM dbo.[Parentesco familiar RDA 1888] t INNER JOIN @Par p ON p.Codigo = t.Codigo;
END
GO

/* Tipo de alergia 1888 — 01-06 (idempotente por Codigo) */
IF OBJECT_ID(N'dbo.[Tipo de alergia 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Alg TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Alg VALUES
        ('01', 'Medicamento'),
        ('02', 'Alimento'),
        ('03', 'Sustancia del ambiente'),
        ('04', 'Sustancia que entran en contacto con la piel'),
        ('05', 'Picadura de insectos'),
        ('06', 'Otra');

    INSERT INTO dbo.[Tipo de alergia 1888] (Codigo, Descripcion, [Id Estado])
    SELECT a.Codigo, a.Descripcion, 7 FROM @Alg a
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Tipo de alergia 1888] t WHERE t.Codigo = a.Codigo);

    UPDATE t SET Descripcion = a.Descripcion, [Id Estado] = 7
    FROM dbo.[Tipo de alergia 1888] t INNER JOIN @Alg a ON a.Codigo = t.Codigo;
END
GO

/* Otra tecnologia categoria 1888 — 03-06 (idempotente por Codigo) */
IF OBJECT_ID(N'dbo.[Otra tecnologia categoria 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Otr TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Otr VALUES
        ('03', 'Dispositivo médico'),
        ('04', 'Producto biológico'),
        ('05', 'Nutricional'),
        ('06', 'Otro');

    INSERT INTO dbo.[Otra tecnologia categoria 1888] (Codigo, Descripcion, [Id Estado])
    SELECT o.Codigo, o.Descripcion, 7 FROM @Otr o
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Otra tecnologia categoria 1888] t WHERE t.Codigo = o.Codigo);

    UPDATE t SET Descripcion = o.Descripcion, [Id Estado] = 7
    FROM dbo.[Otra tecnologia categoria 1888] t INNER JOIN @Otr o ON o.Codigo = t.Codigo;
END
GO

/* Alcance incapacidad 1888 — 01-02 (idempotente por Codigo) */
IF OBJECT_ID(N'dbo.[Alcance incapacidad 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Alc TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Alc VALUES ('01', 'Nueva'), ('02', 'Prórroga');

    INSERT INTO dbo.[Alcance incapacidad 1888] (Codigo, Descripcion, [Id Estado])
    SELECT a.Codigo, a.Descripcion, 7 FROM @Alc a
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Alcance incapacidad 1888] t WHERE t.Codigo = a.Codigo);

    UPDATE t SET Descripcion = a.Descripcion, [Id Estado] = 7
    FROM dbo.[Alcance incapacidad 1888] t INNER JOIN @Alc a ON a.Codigo = t.Codigo;
END
GO

/* Egreso y Remision 1888 — 01-08 (idempotente por Codigo) */
IF OBJECT_ID(N'dbo.[Egreso y Remision 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Egr TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Egr VALUES
        ('01', 'PACIENTE CON DESTINO A SU DOMICILIO'),
        ('02', 'PACIENTE MUERTO'),
        ('03', 'PACIENTE DERIVADO A OTRO SERVICIO'),
        ('04', 'REFERIDO A OTRA INSTITUCION'),
        ('05', 'CONTRAREFERIDO A OTRA INSTITUCION'),
        ('06', 'DERIVADO O REFERIDO A HOSPITALIZACION DOMICILIRIA'),
        ('07', 'DERIVADO A SERVICIO SOCIAL'),
        ('08', 'PACIENTE CONTINUA EN EL SERVICIO (CORTE FACTURACION)');

    INSERT INTO dbo.[Egreso y Remision 1888] (Codigo, Descripcion, [Id Estado])
    SELECT g.Codigo, g.Descripcion, 7 FROM @Egr g
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Egreso y Remision 1888] t WHERE t.Codigo = g.Codigo);

    UPDATE t SET Descripcion = g.Descripcion, [Id Estado] = 7
    FROM dbo.[Egreso y Remision 1888] t INNER JOIN @Egr g ON g.Codigo = t.Codigo;
END
GO

/* Finalidad tecnologia salud 1888 — 11-44 (idempotente por Codigo) */
IF OBJECT_ID(N'dbo.[Finalidad tecnologia salud 1888]', N'U') IS NOT NULL
BEGIN
    DECLARE @Fin TABLE (Codigo VARCHAR(50) NOT NULL PRIMARY KEY, Descripcion VARCHAR(200) NOT NULL);
    INSERT INTO @Fin VALUES
        ('11', 'VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO'),
        ('12', 'DETECCION TEMPRANA DE ENFERMEDAD GENERAL'),
        ('13', 'DETECCION TEMPRANA DE ENFERMEDAD LABORAL'),
        ('14', 'PROTECCION ESPECIFICA'),
        ('15', 'DIAGNOSTICO'),
        ('16', 'TRATAMIENTO'),
        ('17', 'REHABILITACION'),
        ('18', 'PALIACION'),
        ('19', 'PLANIFICACION FAMILIAR Y ANTICONCEPCION'),
        ('20', 'PROMOCION Y APOYO A LA LACTANCIA MATERNA'),
        ('21', 'ATENCION BASICA DE ORIENTACION FAMILIAR'),
        ('22', 'ATENCION PARA EL CUIDADO PRECONCEPCIONAL'),
        ('23', 'ATENCION PARA EL CUIDADO PRENATAL'),
        ('24', 'INTERRUPCION VOLUNTARIA DEL EMBARAZO'),
        ('25', 'ATENCION DEL PARTO Y PUERPERIO'),
        ('26', 'ATENCION PARA EL CUIDADO DEL RECIEN NACIDO'),
        ('27', 'ATENCION PARA EL SEGUIMIENTO DEL RECIEN NACIDO'),
        ('28', 'PREPARACION PARA LA MATERNIDAD Y LA PATERNIDAD'),
        ('29', 'PROMOCION DE ACTIVIDAD FISICA'),
        ('30', 'PROMOCION DE LA CESACION DEL TABAQUISMO'),
        ('31', 'PREVENCION DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS'),
        ('32', 'PROMOCION DE LA ALIMENTACION SALUDABLE'),
        ('33', 'PROMOCION PARA EL EJERCICIO DE LOS DERECHOS SEXUALES Y DERECHOS REPRODUCTIVOS'),
        ('34', 'PROMOCION PARA EL DESARROLLO DE HABILIDADES PARA LA VIDA'),
        ('35', 'PROMOCION PARA LA CONSTRUCCION DE ESTRATEGIAS DE AFRONTAMIENTO FRENTE A  SUCESOS VITALES'),
        ('36', 'PROMOCION DE LA SANA CONVIVENCIA Y EL TEJIDO  SOCIAL'),
        ('37', 'PROMOCION DE UN AMBIENTE SEGURO Y DE CUIDADO Y PROTECCION DEL AMBIENTE'),
        ('38', 'PROMOCION DEL EMPODERAMIENTO PARA EL EJERCICIO DEL DERECHO A LA SALUD'),
        ('39', 'PROMOCION PARA LA ADOPCION DE PRACTICAS DE CRIANZA Y CUIDADO PARA LA SALUD'),
        ('40', 'PROMOCION DE LA CAPACIDAD DE LA AGENCIA Y CUIDADO DE LA SALUD'),
        ('41', 'DESARROLLO DE HABILIDADES COGNITIVAS'),
        ('42', 'INTERVENCION COLECTIVA'),
        ('43', 'MODIFICACION DE LA ESTETICA CORPORAL FINES ESTETICOS'),
        ('44', 'OTRA');

    INSERT INTO dbo.[Finalidad tecnologia salud 1888] (Codigo, Nombre, Descripcion, [Id Estado])
    SELECT f.Codigo, f.Descripcion, f.Descripcion, 7 FROM @Fin f
    WHERE NOT EXISTS (SELECT 1 FROM dbo.[Finalidad tecnologia salud 1888] t WHERE t.Codigo = f.Codigo);

    UPDATE t SET Nombre = f.Descripcion, Descripcion = f.Descripcion, [Id Estado] = 7
    FROM dbo.[Finalidad tecnologia salud 1888] t INNER JOIN @Fin f ON f.Codigo = t.Codigo;
END
GO

/* ============================================================================
   SCRIPTS MERGE AUTÓNOMOS (ya idempotentes — ejecutar si faltan datos masivos)
   ============================================================================
   Después de este script, en el mismo servidor ejecutar si aplica:

   1. 1888_create_cups_tabla_con_datos.sql   → dbo.CUPS_Codigos (~10k filas)
   2. 1888_create_cie11_tabla_con_datos.sql  → dbo.CIE11_Codigos
   3. 1888_insert_medicamentos_dci.sql       → dbo.[Medicamento DCI 1888]
   4. 1888_insert_ciudad_municipios.sql      → dbo.Ciudad1888
   5. CATALOGOS_RDA_FHIR_INSTALL.sql         → RDA_MedicationTime / UMM / VAD / TechModality
      (obligatorio antes de VISTAS_1888_INSTALL.sql — vistas VW_RDA_*)

   Esos archivos usan MERGE / IF NOT EXISTS y son seguros de re-ejecutar.
   ============================================================================ */

PRINT N'=== DATOS_1888_INSTALL — instalación completada ===';
GO

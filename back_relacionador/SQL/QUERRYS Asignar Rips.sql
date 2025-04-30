


CREATE VIEW [dbo].[Cnsta Relacionador Info Evaluacion Usuario]
AS
SELECT        dbo.[Evaluación Entidad].[Id Evaluación Entidad], dbo.[Evaluación Entidad].[Id Tipo de Evaluación], dbo.[Tipo de Evaluación].[Tipo de Evaluación], dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 
                         dbo.[Evaluación Entidad].[Documento Entidad], dbo.[Tipo de Documento].[Tipo de Documento] + N' ' + dbo.[Evaluación Entidad].[Documento Entidad] AS Identificacion, dbo.[Evaluación Entidad].[Edad Entidad Evaluación Entidad], 
                         dbo.[Evaluación Entidad].[Acompañante Evaluación Entidad], dbo.[Evaluación Entidad].[Id Parentesco], dbo.[Evaluación Entidad].[Teléfono Acompañante], dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad], 
                         dbo.[Evaluación Entidad].[Diagnóstico Específico Evaluación Entidad], dbo.[Evaluación Entidad].[Manejo de Medicamentos], dbo.[Evaluación Entidad].[Dirección Domicilio], dbo.[Evaluación Entidad].[Id Ciudad], 
                         dbo.[Evaluación Entidad].[Teléfono Domicilio], dbo.[Evaluación Entidad].[Fecha Nacimiento], dbo.[Evaluación Entidad].[Id Unidad de Medida Edad], dbo.[Evaluación Entidad].[Id Sexo], dbo.[Evaluación Entidad].[Id Estado], 
                         dbo.[Evaluación Entidad].[Id Estado Civil], dbo.[Evaluación Entidad].[Id Ocupación], dbo.[Evaluación Entidad].[Documento Aseguradora], dbo.[Evaluación Entidad].[Id Tipo de Afiliado], 
                         dbo.[Evaluación Entidad].[Responsable Evaluación Entidad], dbo.[Evaluación Entidad].[Id Parentesco Responsable], dbo.[Evaluación Entidad].[Teléfono Responsable], dbo.[Evaluación Entidad].[Documento Usuario], 
                         dbo.[Evaluación Entidad].[Documento Empresa], dbo.[Evaluación Entidad].[Id Terminal], dbo.[Evaluación Entidad].[Documento Profesional], dbo.[Evaluación Entidad].[Id Estado Web], dbo.[Evaluación Entidad].[Con Orden], 
                         dbo.[Evaluación Entidad].[Firma Evaluación Entidad], dbo.[Evaluación Entidad].Sincronizado, dbo.[Evaluación Entidad].PreguntarControl, dbo.[Evaluación Entidad].NombreFormatoAux
FROM            dbo.[Evaluación Entidad] INNER JOIN
                         dbo.Entidad ON dbo.[Evaluación Entidad].[Documento Entidad] = dbo.Entidad.[Documento Entidad] INNER JOIN
                         dbo.[Tipo de Documento] ON dbo.Entidad.[Id Tipo de Documento] = dbo.[Tipo de Documento].[Id Tipo de Documento] INNER JOIN
                         dbo.[Tipo de Evaluación] ON dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = dbo.[Tipo de Evaluación].[Id Tipo de Evaluación]






---- Lista para selecionar paciente con hc sin rips segun fecha y usuario

CREATE VIEW [dbo].[Cnsta Relacionador Usuarios HC]
AS
SELECT        dbo.[Evaluación Entidad].[Fecha Evaluación Entidad] AS FechaEvaluacion, dbo.[Evaluación Entidad].[Documento Entidad] AS DocumentoPaciente, dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente, 
                         dbo.[Evaluación Entidad].[Documento Usuario] AS DocumentoUsuario, dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips]
FROM            dbo.[Evaluación Entidad] INNER JOIN
                         dbo.Entidad ON dbo.[Evaluación Entidad].[Documento Entidad] = dbo.Entidad.[Documento Entidad] LEFT OUTER JOIN
                         dbo.[Evaluación Entidad Rips] ON dbo.[Evaluación Entidad].[Id Evaluación Entidad] = dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad]
WHERE        (dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips] IS NULL) AND (dbo.[Evaluación Entidad].[Id Tipo de Evaluación] <> 2)
GO


---- Info de Usuarios Segun documento seleccionado
CREATE VIEW [dbo].[Cnsta Relacionador Usuarios Info]
AS
SELECT        dbo.Entidad.[Documento Entidad] AS DocumentoPaciente, dbo.Entidad.[Primer Apellido Entidad] AS PrimerApellidoPaciente, dbo.Entidad.[Segundo Apellido Entidad] AS SegundoApellidoPaciente, 
                         dbo.Entidad.[Primer Nombre Entidad] AS PrimerNombrePaciente, dbo.Entidad.[Segundo Nombre Entidad] AS SegundoNombrePaciente, dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente, 
                         dbo.Sexo.[Descripción Sexo] AS Sexo, dbo.EntidadIII.[Edad EntidadIII] AS Edad, dbo.EntidadII.[Dirección EntidadII] AS Direccion, dbo.EntidadII.[Teléfono Celular EntidadII] AS Tel, 
                         dbo.[Tipo de Documento].[Tipo de Documento] + N' ' + dbo.Entidad.[Documento Entidad] AS DocumentoTipoDOC
FROM            dbo.Entidad INNER JOIN
                         dbo.EntidadII ON dbo.Entidad.[Documento Entidad] = dbo.EntidadII.[Documento Entidad] INNER JOIN
                         dbo.EntidadIII ON dbo.Entidad.[Documento Entidad] = dbo.EntidadIII.[Documento Entidad] INNER JOIN
                         dbo.Sexo ON dbo.EntidadIII.[Id Sexo] = dbo.Sexo.[Id Sexo] INNER JOIN
                         dbo.[Tipo de Documento] ON dbo.Entidad.[Id Tipo de Documento] = dbo.[Tipo de Documento].[Id Tipo de Documento]


----- Info de hc segun usuario y segun paciente

CREATE VIEW [dbo].[Cnsta Relacionador Info Historias]
AS
SELECT        FORMAT(dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 'dd/MM/yyyy') AS FechaEvaluacionTexto, dbo.[Evaluación Entidad].[Documento Entidad] AS DocumentoPaciente, 
                         dbo.[Evaluación Entidad].[Id Tipo de Evaluación] AS IdTipodeEvaluacion, dbo.[Tipo de Evaluación].[Descripción Tipo de Evaluación] AS DescripcionTipodeEvaluación, 
                         CASE WHEN dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = 4 THEN SUBSTRING(CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)), CHARINDEX('\', 
                         CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)), CHARINDEX('\', CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX))) + 1) + 1, 
                         LEN(CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)))) ELSE CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)) END AS Formato_Diagnostico,
                          dbo.[Evaluación Entidad].[Diagnóstico Específico Evaluación Entidad] AS DiagnósticoEspecíficoEvaluacionEntidad, dbo.[Evaluación Entidad].[Documento Usuario] AS DocumentoUsuario, 
                         dbo.[Evaluación Entidad].[Id Evaluación Entidad] AS IdEvaluaciónEntidad, RIGHT(CONVERT(VARCHAR(20), dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 100), 7) AS HoraEvaluacion, 
                         dbo.[Evaluación Entidad].[Fecha Evaluación Entidad] AS FechaEvaluacion
FROM            dbo.[Evaluación Entidad] LEFT OUTER JOIN
                         dbo.[Evaluación Entidad Rips] ON dbo.[Evaluación Entidad].[Id Evaluación Entidad] = dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad] INNER JOIN
                         dbo.[Tipo de Evaluación] ON dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = dbo.[Tipo de Evaluación].[Id Tipo de Evaluación]
WHERE        (dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips] IS NULL) AND (dbo.[Evaluación Entidad].[Id Tipo de Evaluación] <> 2)

--lista de Tipo rips Activos estdo = 7

CREATE VIEW [dbo].[Cnsta Relacionador Tipo Rips]
AS
SELECT        [Id Tipo Rips] AS IdTipoRips, [Código Tipo Rips] AS CódigoTipoRips, [Tipo Rips] AS TipoRips, [Descripción Tipo Rips] AS DescripcionTipoRips, [Id Estado] AS IdEstado
FROM            dbo.[Tipo Rips]
WHERE        ([Id Estado] = 7)
GO


-- para que los tipo rips no se dañen :P
Update [Tipo Rips] set [Código Tipo Rips] = 17 where  [Tipo Rips] = 'Particulares'
Update [Tipo Rips] set [Código Tipo Rips] = 24 where  [Tipo Rips] = 'Entidad Prepago'
Update [Tipo Rips] set [Código Tipo Rips] = 23 where  [Tipo Rips] = 'Entidad Prepago'


---- ENTIDADES TIPO RIPS
CREATE VIEW [dbo].[Cnsta Relacionador Entidades Rips]
AS
SELECT        dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente, dbo.[Función Por Entidad].[Id Función], dbo.Función.Función, dbo.Entidad.[Documento Entidad] AS DocumentoEntidad, MIN(dbo.[Tipo Rips].[Id Tipo Rips]) 
                         AS IdTipoRips
FROM            dbo.Entidad INNER JOIN
                         dbo.[Función Por Entidad] ON dbo.Entidad.[Documento Entidad] = dbo.[Función Por Entidad].[Documento Entidad] INNER JOIN
                         dbo.Función ON dbo.[Función Por Entidad].[Id Función] = dbo.Función.[Id Función] INNER JOIN
                         dbo.[Tipo Rips] ON dbo.[Función Por Entidad].[Id Función] = dbo.[Tipo Rips].[Código Tipo Rips]
WHERE        (dbo.[Función Por Entidad].[Id Función] IN (17, 24, 23))
GROUP BY dbo.Entidad.[Nombre Completo Entidad], dbo.[Función Por Entidad].[Id Función], dbo.Función.Función, dbo.Entidad.[Documento Entidad]
GO

----Modalidad atencion

CREATE VIEW [dbo].[Cnsta Relacionador Modalidad Atencion]
AS
SELECT        [Id Modalidad Atencion] AS IdModalidadAtencion, Codigo, [Nombre Modalidad Atencion] AS NombreModalidadAtencion, [Descripción Modalidad Atencion] AS DescripcionModalidadAtencion, 
                         [Orden Modalidad Atencion] AS OrdenModalidadAtencion, [Id Estado]
FROM            dbo.[RIPS Modalidad Atención]
WHERE        ([Id Estado] = 7)



--Estos updates son para que se pueda relacion grupo servicios con servicios
Update  [RIPS Grupo Servicios] set [Descripción Grupo Servicios] = 'CONSULTA EXTERNA'
WHERE Codigo = '01'

Update  [RIPS Grupo Servicios] set [Descripción Grupo Servicios] = 'APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA'
WHERE Codigo = '02'

Update  [RIPS Grupo Servicios] set [Descripción Grupo Servicios] = 'INTERNACION'
WHERE Codigo = '03'

Update  [RIPS Grupo Servicios] set [Descripción Grupo Servicios] = 'QUIRURGICOS'
WHERE Codigo = '04'

Update  [RIPS Grupo Servicios] set [Descripción Grupo Servicios] = 'ATENCION INMEDIATA'
WHERE Codigo = '05'

-- -- cnsta grupo servicios
    CREATE VIEW [dbo].[Cnsta Relacionador ModalidadGrupoServicioTecSal]
AS
SELECT        [Id Grupo Servicios] AS IdGrupoServicios, Codigo, [Nombre Grupo Servicios] AS NombreGrupoServicios, [Descripción Grupo Servicios] AS DescripcionGrupoServicios, [Orden Grupo Servicios], [Id Estado]
FROM            dbo.[RIPS Grupo Servicios]
WHERE        ([Id Estado] = 7)
GO


--cnsta servicios

CREATE VIEW [dbo].[Cnsta Relacionador Servicios]
AS
SELECT        [Id Servicios], [Código Servicios], [Nombre Servicios], [Descripción Servicios], [Id Estado]
FROM            dbo.[RIPS Servicios]
WHERE        ([Id Estado] = 7)
GO

GO
CREATE TABLE [dbo].[RIPS Finalidad Consulta Version2](
	[Id Finalidad Consulta] [int] IDENTITY(1,1) NOT NULL,
	[Codigo] [nvarchar](50) NULL,
	[Nombre RIPS Finalidad Consulta Version2] [nvarchar](100) NULL,
	[Descripción RIPS Finalidad Consulta Version2] [nvarchar](200) NULL,
	[Orden RIPS Finalidad Consulta Version2] [int] NULL,
	[AC] [nvarchar](10) NULL,
	[AP] [nvarchar](10) NULL,
	[Id Estado] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id Finalidad Consulta] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[RIPS Finalidad Consulta Version2] ON 

INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (1, N'11', N'VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (2, N'12', N'DETECCION TEMPRANA DE ENFERMEDAD GENERAL', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (3, N'13', N'DETECCION TEMPRANA DE ENFERMEDAD LABORAL', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (4, N'14', N'PROTECCION ESPECIFICA', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (5, N'15', N'DIAGNOSTICO', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (6, N'16', N'TRATAMIENTO', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (7, N'17', N'REHABILITACION', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (8, N'18', N'PALIACION', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (9, N'19', N'PLANIFICACION FAMILIAR Y ANTICONCEPCION', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (10, N'20', N'PROMOCION Y APOYO A LA LACTANCIA MATERNA', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (11, N'21', N'ATENCION BASICA DE ORIENTACION FAMILIAR', NULL, 1, N'SI', N'NO', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (12, N'22', N'ATENCION PARA EL CUIDADO PRECONCEPCIONAL', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (13, N'23', N'ATENCION PARA EL CUIDADO PRENATAL', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (14, N'24', N'INTERRUPCION VOLUNTARIA DEL EMBARAZO', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (15, N'25', N'ATENCION DEL PARTO Y PUERPERIO', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (16, N'26', N'ATENCION PARA EL CUIDADO DEL RECIEN NACIDO', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (17, N'27', N'ATENCION PARA EL SEGUIMIENTO DEL RECIEN NACIDO', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (18, N'28', N'PREPARACION PARA LA MATERNIDAD Y LA PATERNIDAD', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (19, N'29', N'PROMOCION DE ACTIVIDAD FISICA', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (20, N'30', N'PROMOCION DE LA CESACION DEL TABAQUISMO', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (21, N'31', N'PREVENCION DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (22, N'32', N'PROMOCION DE LA ALIMENTACION SALUDABLE', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (23, N'33', N'PROMOCION PARA EL EJERCICIO DE LOS DERECHOS SEXUALES Y DERECHOS REPRODUCTIVOS', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (24, N'34', N'PROMOCION PARA EL DESARROLLO DE HABILIDADES PARA LA VIDA', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (25, N'35', N'PROMOCION PARA LA CONSTRUCCION DE ESTRATEGIAS DE AFRONTAMIENTO FRENTE A SUCESOS VITALES', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (26, N'36', N'PROMOCION DE LA SANA CONVIVENCIA Y EL TEJIDO SOCIAL', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (27, N'37', N'PROMOCION DE UN AMBIENTE SEGURO Y DE CUIDADO Y PROTECCION DEL AMBIENTE', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (28, N'38', N'PROMOCION DEL EMPODERAMIENTO PARA EL EJERCICIO DEL DERECHO A LA SALUD', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (29, N'39', N'PROMOCION PARA LA ADOPCION DE PRACTICAS DE CRIANZA Y CUIDADO PARA LA SALUD', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (30, N'40', N'PROMOCION DE LA CAPACIDAD DE LA AGENCIA Y CUIDADO DE LA SALUD', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (31, N'41', N'DESARROLLO DE HABILIDADES COGNITIVAS', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (32, N'42', N'INTERVENCION COLECTIVA', NULL, 1, N'NO', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (33, N'43', N'MODIFICACION DE LA ESTETICA CORPORAL (FINES ESTETICOS)', NULL, 1, N'SI', N'SI', 7)
INSERT [dbo].[RIPS Finalidad Consulta Version2] ([Id Finalidad Consulta], [Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado]) VALUES (34, N'44', N'OTRA', NULL, 1, N'SI', N'SI', 7)
SET IDENTITY_INSERT [dbo].[RIPS Finalidad Consulta Version2] OFF
GO
ALTER TABLE [dbo].[RIPS Finalidad Consulta Version2] ADD  CONSTRAINT [DF_RIPSFinalidadConsultaVersion2_OrdenRIPSFinalidadConsultaVersion2]  DEFAULT ((1)) FOR [Orden RIPS Finalidad Consulta Version2]
GO
ALTER TABLE [dbo].[RIPS Finalidad Consulta Version2] ADD  CONSTRAINT [DF_RIPSFinalidadConsultaVersion2_IdEstado]  DEFAULT ((7)) FOR [Id Estado]
GO

-- cnsta finalidad V2
CREATE VIEW [dbo].[Cnsta Relacionador Finalidad]
AS
SELECT        [Id Finalidad Consulta] AS IdFinalidadConsulta, Codigo, [Nombre RIPS Finalidad Consulta Version2] AS NombreRIPSFinalidadConsultaVersion2, 
                         [Descripción RIPS Finalidad Consulta Version2] AS DescripcionRIPSFinalidadConsultaVersion2, [Orden RIPS Finalidad Consulta Version2] AS RIPSFinalidadConsultaVersion2, AC, AP, [Id Estado]
FROM            dbo.[RIPS Finalidad Consulta Version2]
GO

CREATE TABLE [dbo].[RIPS Causa Externa Version2](
	[Id RIPS Causa Externa Version2] [int] IDENTITY(1,1) NOT NULL,
	[Codigo] [nvarchar](50) NULL,
	[Nombre RIPS Causa Externa Version2] [nvarchar](200) NULL,
	[Descripción RIPS Causa Externa Version2] [nvarchar](200) NULL,
	[Orden RIPS Causa Externa Version2] [int] NULL,
	[Id Estado] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id RIPS Causa Externa Version2] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[RIPS Causa Externa Version2] ON 

INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (1, N'21', N'Accidente de trabajo', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (2, N'22', N'Accidente en el hogar', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (3, N'23', N'Accidente de tránsito de origen común', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (4, N'24', N'Accidente de tránsito de origen laboral', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (5, N'25', N'Accidente en el entorno educativo', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (6, N'26', N'Otro tipo de accidente', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (7, N'27', N'Evento catastrófico de origen natural', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (8, N'28', N'Lesión por agresión', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (9, N'29', N'Lesión auto infligida', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (10, N'30', N'Sospecha de violencia física', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (11, N'31', N'Sospecha de violencia psicológica', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (12, N'32', N'Sospecha de violencia sexual', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (13, N'33', N'Sospecha de negligencia y abandono', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (14, N'34', N'IVE relacionado con peligro a la Salud o vida de la mujer', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (15, N'35', N'IVE por malformación congénita incompatible con la vida', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (16, N'36', N'IVE por violencia sexual, incesto o por inseminación artificial o transferencia de ovulo fecundado no consentida', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (17, N'37', N'Evento adverso en salud', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (18, N'38', N'Enfermedad general', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (19, N'39', N'Enfermedad laboral', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (20, N'40', N'Promoción y mantenimiento de la salud - intervenciones individuales', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (21, N'41', N'Intervención colectiva', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (22, N'42', N'Atención de población materno perinatal', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (23, N'43', N'Riesgo ambiental', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (24, N'44', N'Otros eventos Catastróficos', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (25, N'45', N'Accidente de mina antipersonal - MAP', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (26, N'46', N'Accidente de Artefacto Explosivo Improvisado - AEI', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (27, N'47', N'Accidente de Munición Sin Explotar - MUSE', NULL, 1, 7)
INSERT [dbo].[RIPS Causa Externa Version2] ([Id RIPS Causa Externa Version2], [Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado]) VALUES (28, N'48', N'Otra víctima de conflicto armado colombiano', NULL, 1, 7)
SET IDENTITY_INSERT [dbo].[RIPS Causa Externa Version2] OFF
GO
ALTER TABLE [dbo].[RIPS Causa Externa Version2] ADD  CONSTRAINT [DF_RIPSCausaExternaVersion2_OrdenRIPSCausaExternaVersion2]  DEFAULT ((1)) FOR [Orden RIPS Causa Externa Version2]
GO
ALTER TABLE [dbo].[RIPS Causa Externa Version2] ADD  CONSTRAINT [DF_RIPSCausaExternaVersion2_IdEstado]  DEFAULT ((7)) FOR [Id Estado]
GO


--CNsta causa externa V2
CREATE VIEW [dbo].[Cnsta Relacionador Causa Externa]
AS
SELECT        [Id RIPS Causa Externa Version2], Codigo, [Nombre RIPS Causa Externa Version2] AS NombreRIPSCausaExternaVersion2, [Descripción RIPS Causa Externa Version2] AS DescripcionRIPSCausaExternaVersion2, 
                         [Orden RIPS Causa Externa Version2] AS RIPSCausaExternaVersion2, [Id Estado]
FROM            dbo.[RIPS Causa Externa Version2]
WHERE        ([Id Estado] = 7)


-- Cnosta DX PRINCIPAL

CREATE VIEW [dbo].[Cnsta Relacionador Tipo Diagnostico Principal]
AS
SELECT        [Id Tipo de Diagnóstico Principal] AS IdTipodeDiagnósticoPrincipal, [Código Tipo de Diagnóstico Principal] AS CódigoTipodeDiagnósticoPrincipal, [Tipo de Diagnóstico Principal] AS TipodeDiagnósticoPrincipal, 
                         [Descripción Tipo de Diagnóstico Principal] AS DescripcionTipodeDiagnósticoPrincipal, [Orden Tipo de Diagnóstico Principal] AS ordenTipodeDiagnósticoPrincipal, [Id Estado]
FROM            dbo.[Tipo de Diagnóstico Principal]
WHERE        ([Id Estado] = 7)


----Consta Via ingreso Usuario
CREATE VIEW [dbo].[Cnsta Relacionador Via Ingreso Usuario]
AS
SELECT        [Id Via Ingreso Usuario] AS IdViaIngresoUsuario, Codigo, [Nombre Via Ingreso Usuario] AS NombreViaIngresoUsuario, [Descripción Via Ingreso Usuario] AS DescripcionViaIngresoUsuario, 
                         [Orden Via Ingreso Usuario] AS OrdenViaIngresoUsuario, [Id Estado]
FROM            dbo.[RIPS Via Ingreso Usuario]
WHERE        ([Id Estado] = 7)



--TABLA Rips
CREATE TABLE [Rips Cie10] (
    Tabla VARCHAR(50),
    Codigo VARCHAR(10),
    Nombre VARCHAR(255),
    Descripcion VARCHAR(255),
    AplicaASexo INT,
    EdadMinima INT,
    EdadMaxima INT,
    GrupoMortalidad INT,
    Extra_V VARCHAR(255),
    Extra_VI_Capitulo VARCHAR(10),
    SubGrupo VARCHAR(10),
    Sexo CHAR(1)
);
--tabla Cups
--Si esta tabla existe ELIMINELA Por uqe no sirve pa un joropo
CREATE TABLE [Rips Cups] (
    Tabla VARCHAR(50),
    Codigo VARCHAR(10),
    Nombre VARCHAR(255),
    Descripcion VARCHAR(255),
    Tipo VARCHAR(50)
);

--¡¡¡¡ OJO !!!!recuerde que en otro script llamado Datos de las tablas de rips y cups se encuentran los datos de estas tablas 


--cie
CREATE VIEW [dbo].[Cnsta Relacionador Cie10]
AS
SELECT        Codigo, Nombre, Descripcion, AplicaASexo, EdadMinima, EdadMaxima, GrupoMortalidad, Extra_V, Extra_VI_Capitulo, SubGrupo, Sexo
FROM            dbo.[Rips Cie10]
GO

--cups
CREATE VIEW [dbo].[Cnsta Relacionador Cups]
AS
SELECT        Codigo, Descripcion, Nombre, Tipo
FROM            dbo.[Rips Cups]
GO



ALTER TABLE [RIPS Servicios] 
ADD [Codigo Grupo Servicios] nvarchar(50);


UPDATE [RIPS Servicios] SET [Codigo Grupo Servicios] = '01'
WHERE [Descripción Servicios] = 'CONSULTA EXTERNA'


UPDATE [RIPS Servicios] SET [Codigo Grupo Servicios] = '02'
WHERE [Descripción Servicios] = 'APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA'


UPDATE [RIPS Servicios] SET [Codigo Grupo Servicios] = '03'
WHERE [Descripción Servicios] = 'INTERNACION'



UPDATE [RIPS Servicios] SET [Codigo Grupo Servicios] = '04'
WHERE [Descripción Servicios] = 'QUIRURGICOS'


UPDATE [RIPS Servicios] SET [Codigo Grupo Servicios] = '05'
WHERE [Descripción Servicios] = 'ATENCION INMEDIATA'


ALTER VIEW [dbo].[Cnsta Relacionador Servicios]
AS
SELECT        dbo.[RIPS Servicios].[Id Servicios], dbo.[RIPS Servicios].[Código Servicios], dbo.[RIPS Servicios].[Nombre Servicios], dbo.[RIPS Servicios].[Descripción Servicios], dbo.[RIPS Servicios].[Id Estado], 
                         dbo.[RIPS Servicios].[Codigo Grupo Servicios], dbo.[RIPS Grupo Servicios].[Id Grupo Servicios]
FROM            dbo.[RIPS Servicios] INNER JOIN
                         dbo.[RIPS Grupo Servicios] ON dbo.[RIPS Servicios].[Codigo Grupo Servicios] = dbo.[RIPS Grupo Servicios].Codigo
WHERE        (dbo.[RIPS Servicios].[Id Estado] = 7)
GO


--Esto es para habilitar o des habilitar historia con rips  o sin rips 
alter table [Evaluación Entidad] 
add Rips bit not null default 1;




ALTER VIEW [dbo].[Cnsta Relacionador Info Historias]
AS
SELECT        FORMAT(dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 'dd/MM/yyyy') AS FechaEvaluacionTexto, dbo.[Evaluación Entidad].[Documento Entidad] AS DocumentoPaciente, 
                         dbo.[Evaluación Entidad].[Id Tipo de Evaluación] AS IdTipodeEvaluacion, dbo.[Tipo de Evaluación].[Descripción Tipo de Evaluación] AS DescripcionTipodeEvaluación, 
                         CASE WHEN dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = 4 THEN SUBSTRING(CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)), CHARINDEX('\', 
                         CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)), CHARINDEX('\', CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX))) + 1) + 1, 
                         LEN(CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)))) ELSE CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)) END AS Formato_Diagnostico,
                          dbo.[Evaluación Entidad].[Diagnóstico Específico Evaluación Entidad] AS DiagnósticoEspecíficoEvaluacionEntidad, dbo.[Evaluación Entidad].[Documento Usuario] AS DocumentoUsuario, 
                         dbo.[Evaluación Entidad].[Id Evaluación Entidad] AS IdEvaluaciónEntidad, RIGHT(CONVERT(VARCHAR(20), dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 100), 7) AS HoraEvaluacion, 
                         dbo.[Evaluación Entidad].[Fecha Evaluación Entidad] AS FechaEvaluacion, dbo.[Evaluación Entidad].Rips
FROM            dbo.[Evaluación Entidad] LEFT OUTER JOIN
                         dbo.[Evaluación Entidad Rips] ON dbo.[Evaluación Entidad].[Id Evaluación Entidad] = dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad] INNER JOIN
                         dbo.[Tipo de Evaluación] ON dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = dbo.[Tipo de Evaluación].[Id Tipo de Evaluación]
WHERE        (dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips] IS NULL) AND (dbo.[Evaluación Entidad].[Id Tipo de Evaluación] <> 2) AND (dbo.[Evaluación Entidad].Rips = 1)
GO




ALTER VIEW [dbo].[Cnsta Relacionador Usuarios HC]
AS
SELECT        dbo.[Evaluación Entidad].[Fecha Evaluación Entidad] AS FechaEvaluacion, dbo.[Evaluación Entidad].[Documento Entidad] AS DocumentoPaciente, dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente, 
                         dbo.[Evaluación Entidad].[Documento Usuario] AS DocumentoUsuario, dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips], dbo.[Evaluación Entidad].Rips
FROM            dbo.[Evaluación Entidad] INNER JOIN
                         dbo.Entidad ON dbo.[Evaluación Entidad].[Documento Entidad] = dbo.Entidad.[Documento Entidad] LEFT OUTER JOIN
                         dbo.[Evaluación Entidad Rips] ON dbo.[Evaluación Entidad].[Id Evaluación Entidad] = dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad]
WHERE        (dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips] IS NULL) AND (dbo.[Evaluación Entidad].[Id Tipo de Evaluación] <> 2) AND (dbo.[Evaluación Entidad].Rips <> 0)
GO


-- CREACIÓN DE TABLA PARA RIPS POR DEFECTO
CREATE TABLE API_RIPS_POR_DEFECTO (
    [IdApiRipsPorDefecto] [INT] PRIMARY KEY IDENTITY,
	[DocumentoEntidad] [NVARCHAR] (50) NOT NULL,
	[TipoDeRips] [INT] NULL,
	[TipoDeUsuario] [INT] NULL,
	[Entidad] [NVARCHAR] (50) NULL,
	[ViaIngresoServicioSalud] [NVARCHAR] (10) NULL,
	[ModalidadGrupoServicioTecnologiaEnSalud] [NVARCHAR] (10) NULL,
	[GrupoServicios] [NVARCHAR] (10) NULL,
	[CodigoServicio] [NVARCHAR] (10) NULL,
	[FinalidadTecnologiaSalud] [NVARCHAR] (10) NULL,
	[CausaMotivoAtencion] [NVARCHAR] (10) NULL,
	[TipoDiagnosticoPrincipal] [NVARCHAR] (10) NULL,
	[Diagnostico1] [NVARCHAR] (10) NULL,
	[Diagnostico2] [NVARCHAR] (10) NULL,
	[Procedimiento1] [NVARCHAR] (10) NULL,
	[Procedimiento2] [NVARCHAR] (10) NULL,
);


-- CREACIÓN DE VISTA PARA INTERACTUAR CON LOS RIPS POR DEFECTO, TANTO AP COMO AC
CREATE VIEW [dbo].[ConsultarRIPSPorDefecto]
AS
SELECT APIRPD.DocumentoEntidad, APIRPD.TipoDeRips, TR.[Tipo Rips] AS TipoDeUsuario, Ent.[Nombre Completo Entidad] AS Entidad, RIPSVIAINU.[Nombre Via Ingreso Usuario] AS ViaIngresoServicioSalud, 
                  RIPSMA.[Nombre Modalidad Atencion] AS ModalidadGrupoServicioTecnologiaEnSalud, RIPSGS.[Nombre Grupo Servicios] AS GrupoServicios, RIPSS.[Nombre Servicios] AS CodigoServicio, 
                  RIPSFCV2.[Nombre RIPS Finalidad Consulta Version2] AS FinalidadTecnologiaSalud, RC1.Nombre AS Diagnostico1, RC2.Nombre AS Diagnostico2, R1C10.Nombre AS Procedimiento1, R2C10.Nombre AS Procedimiento2, 
                  RCEV2.[Nombre RIPS Causa Externa Version2] AS CausaMotivoAtencion, TDP.[Descripción Tipo de Diagnóstico Principal] AS TipoDiagnosticoPrincipal
FROM     dbo.API_RIPS_POR_DEFECTO AS APIRPD LEFT OUTER JOIN
                  dbo.[Tipo Rips] AS TR ON APIRPD.TipoDeUsuario = TR.[Id Tipo Rips] LEFT OUTER JOIN
                  dbo.Entidad AS Ent ON APIRPD.Entidad = Ent.[Documento Entidad] LEFT OUTER JOIN
                  dbo.[RIPS Via Ingreso Usuario] AS RIPSVIAINU ON APIRPD.ViaIngresoServicioSalud = RIPSVIAINU.Codigo LEFT OUTER JOIN
                  dbo.[RIPS Modalidad Atención] AS RIPSMA ON APIRPD.ModalidadGrupoServicioTecnologiaEnSalud = RIPSMA.Codigo LEFT OUTER JOIN
                  dbo.[RIPS Grupo Servicios] AS RIPSGS ON APIRPD.GrupoServicios = RIPSGS.Codigo LEFT OUTER JOIN
                  dbo.[RIPS Servicios] AS RIPSS ON APIRPD.CodigoServicio = RIPSS.[Id Servicios] LEFT OUTER JOIN
                  dbo.[RIPS Finalidad Consulta Version2] AS RIPSFCV2 ON APIRPD.FinalidadTecnologiaSalud = RIPSFCV2.Codigo LEFT OUTER JOIN
                  dbo.[Rips Cups] AS RC1 ON APIRPD.Diagnostico1 = RC1.Codigo LEFT OUTER JOIN
                  dbo.[Rips Cups] AS RC2 ON APIRPD.Diagnostico2 = RC2.Codigo LEFT OUTER JOIN
                  dbo.[Rips Cie10] AS R1C10 ON APIRPD.Procedimiento1 = R1C10.Codigo LEFT OUTER JOIN
                  dbo.[Rips Cie10] AS R2C10 ON APIRPD.Procedimiento2 = R2C10.Codigo LEFT OUTER JOIN
                  dbo.[RIPS Causa Externa Version2] AS RCEV2 ON APIRPD.CausaMotivoAtencion = RCEV2.Codigo LEFT OUTER JOIN
                  dbo.[Tipo de Diagnóstico Principal] AS TDP ON APIRPD.TipoDiagnosticoPrincipal = TDP.[Código Tipo de Diagnóstico Principal]
GO


CREATE VIEW [dbo].[Cnsta Relacionador Info Pacientes Facturas]
AS
SELECT        en.[Nombre Completo Entidad] AS [Nombre Paciente], tp.[Tipo de Documento], eve.[Documento Entidad], eve.[Fecha Evaluación Entidad], fc.[Id Factura], eve.[Id Evaluación Entidad], 
                         em.[Documento Empresa]
FROM            dbo.[Evaluación Entidad Rips] AS everips INNER JOIN
                         dbo.[Evaluación Entidad] AS eve ON eve.[Id Evaluación Entidad] = everips.[Id Evaluación Entidad] INNER JOIN
                         dbo.Entidad AS en ON eve.[Documento Entidad] = en.[Documento Entidad] LEFT OUTER JOIN
                         dbo.Factura AS fc ON eve.[Documento Entidad] = fc.[Documento Paciente] INNER JOIN
                         dbo.[Tipo de Documento] AS tp ON en.[Id Tipo de Documento] = tp.[Id Tipo de Documento] LEFT OUTER JOIN
                         dbo.Empresa AS em ON eve.[Documento Empresa] = em.[Documento Empresa]

GO



-- CREACIÓN DE VISTAS PARA CONSULTAR LAS FACTURAS DE PACIENTE
CREATE VIEW [dbo].[ConsultaFacturasPaciente]
AS
SELECT Fac.[Documento Paciente] AS DocumentoPaciente, Fac.[Documento Responsable] AS DocumentoResponsable, Fac.[Id Factura] AS Value, Fac.[Fecha Factura] AS FechaFactura, 
                  EmpV.[Prefijo Resolución Facturación EmpresaV] + Fac.[No Factura] + ' - ' + DATENAME(WEEKDAY, Fac.[Fecha Factura]) + ' ' + CAST(DAY(Fac.[Fecha Factura]) AS VARCHAR) + ' de ' + DATENAME(MONTH, Fac.[Fecha Factura]) 
                  + ' del ' + CAST(YEAR(Fac.[Fecha Factura]) AS VARCHAR) AS Text, Fac.[Total Factura] AS TotalFactura
FROM     dbo.Factura AS Fac INNER JOIN
                  dbo.EmpresaV AS EmpV ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
WHERE  NOT EXISTS (SELECT 1 FROM [Evaluación Entidad Rips] evr where evr.[Id Factura]= FAC.[Id Factura] )
GO

-- CREACIÓN DE VISTAS PARA CONSULTAR LOS PRESUPUESTOS DE PACIENTE
CREATE VIEW [dbo].[ConsultaPresupuestosPaciente]
AS
SELECT Presupuesto.[Id Plan de Tratamiento] AS Value, Presupuesto.[Fecha Inicio Plan de Tratamiento] AS FechaPresupuesto, Presupuesto.[Documento Paciente] AS DocumentoPaciente, 
                  Presupuesto.[Nro Plan de Tratamiento] + ' - ' + DATENAME(WEEKDAY, Presupuesto.[Fecha Inicio Plan de Tratamiento]) + ' ' + CAST(DAY(Presupuesto.[Fecha Inicio Plan de Tratamiento]) AS VARCHAR) 
                  + ' del ' + CAST(YEAR(Presupuesto.[Fecha Inicio Plan de Tratamiento]) AS VARCHAR) AS Text, SUM(PresupuestoItems.[Valor Plan de Tratamiento Items]) AS TotalPresupuesto, 
                  PresupuestoTratamientos.[Id Forma de Pago Tratamiento] AS FormaDePago
FROM     dbo.[Plan de Tratamiento] AS Presupuesto INNER JOIN
                  dbo.[Plan de Tratamiento Items] AS PresupuestoItems ON Presupuesto.[Id Plan de Tratamiento] = PresupuestoItems.[Id Plan de Tratamiento] INNER JOIN
                  dbo.[Plan de Tratamiento Tratamientos] AS PresupuestoTratamientos ON Presupuesto.[Id Plan de Tratamiento] = PresupuestoTratamientos.[Id Plan de Tratamiento]
				  WHERE  NOT EXISTS (SELECT 1 FROM [Evaluación Entidad Rips] evr where evr.[Id Plan de Tratamiento] = Presupuesto.[Id Plan de Tratamiento] )
GROUP BY PresupuestoItems.[Id Plan de Tratamiento], Presupuesto.[Id Plan de Tratamiento], Presupuesto.[Fecha Inicio Plan de Tratamiento], Presupuesto.[Documento Paciente], Presupuesto.[Nro Plan de Tratamiento], 
                  PresupuestoTratamientos.[Id Forma de Pago Tratamiento]

GO



 

ALTER VIEW [dbo].[Cnsta Relacionador Usuarios Info]
AS
SELECT        REPLACE(REPLACE(dbo.Entidad.[Documento Entidad], CHAR(13), ''), CHAR(10), '') AS DocumentoPaciente, dbo.Entidad.[Primer Apellido Entidad] AS PrimerApellidoPaciente, 
                         dbo.Entidad.[Segundo Apellido Entidad] AS SegundoApellidoPaciente, dbo.Entidad.[Primer Nombre Entidad] AS PrimerNombrePaciente, dbo.Entidad.[Segundo Nombre Entidad] AS SegundoNombrePaciente, 
                         dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente, dbo.Sexo.[Descripción Sexo] AS Sexo, dbo.EntidadIII.[Edad EntidadIII] AS Edad, dbo.EntidadII.[Dirección EntidadII] AS Direccion, 
                         dbo.EntidadII.[Teléfono Celular EntidadII] AS Tel, dbo.[Tipo de Documento].[Tipo de Documento] + N' ' + dbo.Entidad.[Documento Entidad] AS DocumentoTipoDOC
FROM            dbo.Entidad INNER JOIN
                         dbo.EntidadII ON dbo.Entidad.[Documento Entidad] = dbo.EntidadII.[Documento Entidad] INNER JOIN
                         dbo.EntidadIII ON dbo.Entidad.[Documento Entidad] = dbo.EntidadIII.[Documento Entidad] INNER JOIN
                         dbo.Sexo ON dbo.EntidadIII.[Id Sexo] = dbo.Sexo.[Id Sexo] INNER JOIN
                         dbo.[Tipo de Documento] ON dbo.Entidad.[Id Tipo de Documento] = dbo.[Tipo de Documento].[Id Tipo de Documento]


                         
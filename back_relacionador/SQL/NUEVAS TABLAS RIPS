CREATE TABLE [Tipo Atencion Rips]  (
	[Id Tipo Atencion Rips] [int] IDENTITY(1,1) NOT NULL,
	[Tipo] nvarchar(10) NULL,
	[Descripcion] nvarchar(50) NULL,

)

INSERT INTO [Tipo Atencion Rips]  values
('AC','Archivo de consulta'),
('AP','Archivo de procedimiento')


select * from [Tipo Atencion Rips]

SELECT * FROM [RIPS Finalidad Consulta Version2]
SELECT * FROM [RIPS Grupo Servicios]
SELECT * FROM [RIPS Servicios]

SELECT * FROM [RIPS Modalidad Atención]
SELECT * FROM [RIPS Causa Externa Version2]
SELECT * FROM [RIPS Via Ingreso Usuario]

CREATE TABLE [dbo].[Evaluación Entidad Rips V2](
	[Id Evaluación Entidad Rips] [int] IDENTITY(1,1) NOT NULL,
	[Id Evaluación Entidad] [int] NULL,
	[Fecha Creacion Rips] Date null default GETDATE(),

	[Cups] [nvarchar](50) NOT NULL,
	[Cups 2] [nvarchar](50) NULL,
	[Cups 3] [nvarchar](50) NULL,
	[Cie] [nvarchar](50) NOT NULL,
	[Cie 2] [nvarchar](50) NULL,
	[Cie 3] [nvarchar](50) NULL,
	[Id Tipo Atencion Rips] [int] NOT NULL,
	[Id Tipo de Rips] [int] NOT NULL,
	[Documento Tipo Rips] [nvarchar](50) NULL,
	[Id Modalidad Atencion] [int] NOT NULL,
	[Id Grupo Servicios] [int] NOT NULL,
	[Id Servicios] [int] NOT NULL,
	[Id Finalidad Consulta Version2] [int] NOT NULL,
	[Id Causa Externa Version2] [int]  NULL,
	[Id Tipo de Diagnóstico Principal] [int] NULL,
	[Id Via Ingreso Usuario] [int] NULL,

	[Id Factura] [int] NULL,
	[Id Plan de Tratamiento] [int] NULL
	)
	
Alter table [Evaluación Entidad Rips V2] add [Documento Entidad] nvarchar(50)
	
    ALTER TABLE [RIPS Servicios]
ADD [Id Grupo Servicios] INT

UPDATE S
SET S.[Id Grupo Servicios] = G.[Id Grupo Servicios]
FROM [RIPS Servicios] AS S
INNER JOIN [RIPS Grupo Servicios] AS G
    ON S.[Codigo Grupo Servicios] = G.Codigo;


	Create VIEW [dbo].[Cnsta Relacionador Servicios V2]
AS
SELECT dbo.[RIPS Servicios].[Id Servicios], dbo.[RIPS Servicios].[Código Servicios], dbo.[RIPS Servicios].[Nombre Servicios], dbo.[RIPS Servicios].[Descripción Servicios], dbo.[RIPS Servicios].[Id Estado], 
                  dbo.[RIPS Servicios].[Codigo Grupo Servicios], dbo.[RIPS Servicios].[Id Grupo Servicios]
FROM     dbo.[RIPS Servicios] INNER JOIN
                  dbo.[RIPS Grupo Servicios] ON dbo.[RIPS Servicios].[Codigo Grupo Servicios] = dbo.[RIPS Grupo Servicios].Codigo
WHERE  (dbo.[RIPS Servicios].[Id Estado] = 7)
GO


--Esto que viene es para cambiar la funcion que muestra las historias disponibles para haberle rips
--Por que?
--Resualpa pasa ya acontese que cuando a una hc se le hace una modificacion cualquiera el sistema no actualiza sino que crea una nueva version de la historia clinica
--Entonces si una historia clinica tiene rips y se le hace una modificacion, la nueva version de la historia clinica no tiene rips, pero la vista anterior no lo tenia en cuenta y no la mostraba
--Entonces se modifica esta vista para que SOLO pueda hacerse rips a las historias que esten cerradas, que no tengan rips y que ademas sean la ultima version de la historia clinica

ALTER VIEW [dbo].[Cnsta Relacionador Info Historias]
AS
SELECT FORMAT(dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 'dd/MM/yyyy') AS FechaEvaluacionTexto, dbo.[Evaluación Entidad].[Documento Entidad] AS DocumentoPaciente, 
                  dbo.[Evaluación Entidad].[Id Tipo de Evaluación] AS IdTipodeEvaluacion, dbo.[Tipo de Evaluación].[Descripción Tipo de Evaluación] AS DescripcionTipodeEvaluación, 
                  CASE WHEN dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = 4 THEN SUBSTRING(CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)), CHARINDEX('\', 
                  CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)), CHARINDEX('\', CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX))) + 1) + 1, 
                  LEN(CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)))) ELSE CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)) END AS Formato_Diagnostico, 
                  dbo.[Evaluación Entidad].[Diagnóstico Específico Evaluación Entidad] AS DiagnósticoEspecíficoEvaluacionEntidad, dbo.[Evaluación Entidad].[Documento Usuario] AS DocumentoUsuario, 
                  dbo.[Evaluación Entidad].[Id Evaluación Entidad] AS IdEvaluaciónEntidad, RIGHT(CONVERT(VARCHAR(20), dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 100), 7) AS HoraEvaluacion, 
                  dbo.[Evaluación Entidad].[Fecha Evaluación Entidad] AS FechaEvaluacion, dbo.[Evaluación Entidad].Rips
FROM     dbo.[Evaluación Entidad] LEFT OUTER JOIN
                  dbo.[Evaluación Entidad Rips] ON dbo.[Evaluación Entidad].[Id Evaluación Entidad] = dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad] INNER JOIN
                  dbo.[Tipo de Evaluación] ON dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = dbo.[Tipo de Evaluación].[Id Tipo de Evaluación]
WHERE  (dbo.[Evaluación Entidad Rips].[Id Evaluación Entidad Rips] IS NULL) AND (dbo.[Evaluación Entidad].[Id Tipo de Evaluación] <> 2) AND (dbo.[Evaluación Entidad].Rips = 1) AND (dbo.[Evaluación Entidad].[Id Estado] = 7)
GO




--nuevo filtro para la nueva tabla de rips v2 
--posiblemente temporal  you know

CREATE VIEW [dbo].[Cnsta Relacionador Info Historias V2]
AS
SELECT FORMAT(dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 'dd/MM/yyyy') AS FechaEvaluacionTexto, dbo.[Evaluación Entidad].[Documento Entidad] AS DocumentoPaciente, 
                  dbo.[Evaluación Entidad].[Id Tipo de Evaluación] AS IdTipodeEvaluacion, dbo.[Tipo de Evaluación].[Descripción Tipo de Evaluación] AS DescripcionTipodeEvaluación, 
                  CASE WHEN dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = 4 THEN SUBSTRING(CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)), CHARINDEX('\', 
                  CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)), CHARINDEX('\', CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX))) + 1) + 1, 
                  LEN(CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)))) ELSE CAST(dbo.[Evaluación Entidad].[Diagnóstico General Evaluación Entidad] AS nvarchar(MAX)) END AS Formato_Diagnostico, 
                  dbo.[Evaluación Entidad].[Diagnóstico Específico Evaluación Entidad] AS DiagnósticoEspecíficoEvaluacionEntidad, dbo.[Evaluación Entidad].[Documento Usuario] AS DocumentoUsuario, 
                  dbo.[Evaluación Entidad].[Id Evaluación Entidad] AS IdEvaluaciónEntidad, RIGHT(CONVERT(VARCHAR(20), dbo.[Evaluación Entidad].[Fecha Evaluación Entidad], 100), 7) AS HoraEvaluacion, 
                  dbo.[Evaluación Entidad].[Fecha Evaluación Entidad] AS FechaEvaluacion, dbo.[Evaluación Entidad].Rips, dbo.[Evaluación Entidad Rips V2].[Id Evaluación Entidad]
FROM     dbo.[Evaluación Entidad] INNER JOIN
                  dbo.[Tipo de Evaluación] ON dbo.[Evaluación Entidad].[Id Tipo de Evaluación] = dbo.[Tipo de Evaluación].[Id Tipo de Evaluación] LEFT OUTER JOIN
                  dbo.[Evaluación Entidad Rips V2] ON dbo.[Evaluación Entidad].[Id Evaluación Entidad] = dbo.[Evaluación Entidad Rips V2].[Id Evaluación Entidad]
WHERE  (dbo.[Evaluación Entidad].[Id Tipo de Evaluación] <> 2) AND (dbo.[Evaluación Entidad].Rips = 1) AND (dbo.[Evaluación Entidad].[Id Estado] = 7) AND (dbo.[Evaluación Entidad Rips V2].[Id Evaluación Entidad] IS NULL)
GO




CREATE VIEW [dbo].[Cnsta Relacionador Usuarios HC V2]
AS
SELECT TOP (100) PERCENT dbo.[Evaluación Entidad].[Fecha Evaluación Entidad] AS FechaEvaluacion, dbo.[Evaluación Entidad].[Documento Entidad] AS DocumentoPaciente, 
                  dbo.Entidad.[Nombre Completo Entidad] AS NombreCompletoPaciente, dbo.[Evaluación Entidad].[Documento Usuario] AS DocumentoUsuario, dbo.[Evaluación Entidad Rips V2].[Id Evaluación Entidad Rips], dbo.[Evaluación Entidad].Rips, 
                  dbo.[Evaluación Entidad].[Id Estado], dbo.[Evaluación Entidad].[Id Evaluación Entidad]
FROM     dbo.[Evaluación Entidad] INNER JOIN
                  dbo.Entidad ON dbo.[Evaluación Entidad].[Documento Entidad] = dbo.Entidad.[Documento Entidad] LEFT OUTER JOIN
                  dbo.[Evaluación Entidad Rips V2] ON dbo.[Evaluación Entidad].[Id Evaluación Entidad] = dbo.[Evaluación Entidad Rips V2].[Id Evaluación Entidad]
WHERE  (dbo.[Evaluación Entidad].[Id Tipo de Evaluación] <> 2) AND (dbo.[Evaluación Entidad].Rips <> 0) AND (dbo.[Evaluación Entidad Rips V2].[Id Evaluación Entidad Rips] IS NULL) AND (dbo.[Evaluación Entidad].[Id Estado] = 7)
GO

ALTER TABLE [Evaluación Entidad Rips V2]
ADD ConsecutivoRipsFacturaEnCero INT NULL;


-- NOTA: LAS SIGUIENTES VISTAS SE DEBEN CREAR PARA PODER OPERAR CON EL MAESTRO DE LISTAS RIPS 

--- CREACIÓN DE VISTA PARA LISTAR TODO LO QUE CONTIENE LA TABLA [RIPS Causa Externa Version2]
CREATE VIEW [dbo].[VISTA_CAUSA_MOTIVO_ATENCION]
AS
SELECT dbo.[RIPS Causa Externa Version2].[Id RIPS Causa Externa Version2] AS IdCausaMotivoAtencion, dbo.[RIPS Causa Externa Version2].Codigo, 
                  dbo.[RIPS Causa Externa Version2].[Nombre RIPS Causa Externa Version2] AS NombreMotivoAtencion, dbo.Estado.Estado
FROM     dbo.[RIPS Causa Externa Version2] INNER JOIN
                  dbo.Estado ON dbo.[RIPS Causa Externa Version2].[Id Estado] = dbo.Estado.[Id Estado]
GO

--- CREACIÓN DE VISTA PARA LISTAR TODO LO QUE CONTIENE LA TABLA [RIPS Finalidad Consulta Version2]
CREATE VIEW [dbo].[VISTA_FINALIDAD_TECNOLOGIA_SALUD]
AS
SELECT dbo.[RIPS Finalidad Consulta Version2].[Id Finalidad Consulta] AS IdFinalidadConsulta, dbo.[RIPS Finalidad Consulta Version2].Codigo, 
                  dbo.[RIPS Finalidad Consulta Version2].[Nombre RIPS Finalidad Consulta Version2] AS NombreFinalidadConsulta, dbo.Estado.Estado
FROM     dbo.[RIPS Finalidad Consulta Version2] INNER JOIN
                  dbo.Estado ON dbo.[RIPS Finalidad Consulta Version2].[Id Estado] = dbo.Estado.[Id Estado]
GO

--- CREACIÓN DE VISTA PARA LISTAR TODO LO QUE CONTIENE LA TABLA [RIPS Grupo Servicios]
CREATE VIEW [dbo].[VISTA_GRUPO_SERVICIOS]
AS
SELECT 
	[Id Grupo Servicios] AS IdGrupoServicio,
	[Codigo],
	[Nombre Grupo Servicios] AS NombreGrupoServicio,
	Est.Estado
FROM 
	[RIPS Grupo Servicios]
INNER JOIN
	Estado Est ON dbo.[RIPS Grupo Servicios].[Id Estado] = Est.[Id Estado]
GO

--- CREACIÓN DE VISTA PARA LISTAR TODO LO QUE CONTIENE LA TABLA [RIPS Modalidad Atención]
CREATE VIEW [dbo].[VISTA_MODALIDAD_ATENCION] 
AS
SELECT [Id Modalidad Atencion] AS IdModalidadAtencion, Codigo, [Nombre Modalidad Atencion] AS NombreModalidadAtencion, [Descripción Modalidad Atencion] AS DescripcionModalidadAtencion, 
                  [Orden Modalidad Atencion] AS OrdenModalidadAtencion, Est.[Estado] AS Estado
FROM     dbo.[RIPS Modalidad Atención]
INNER JOIN
	Estado Est ON dbo.[RIPS Modalidad Atención].[Id Estado] = Est.[Id Estado]
GO

--- CREACIÓN DE VISTA PARA LISTAR TODO LO QUE CONTIENE LA TABLA [RIPS Servicios]
CREATE VIEW [dbo].[VISTA_SERVICIOS]
AS
SELECT dbo.[RIPS Servicios].[Id Servicios] AS IdServicios, dbo.[RIPS Servicios].[Código Servicios] AS Codigo, dbo.[RIPS Servicios].[Nombre Servicios] AS Descripcion, dbo.[RIPS Servicios].[Descripción Servicios] AS Grupo, dbo.Estado.Estado
FROM     dbo.[RIPS Servicios] INNER JOIN
                  dbo.Estado ON dbo.[RIPS Servicios].[Id Estado] = dbo.Estado.[Id Estado]
GO

--- CREACIÓN DE VISTA PARA LISTAR TODO LO QUE CONTIENE LA TABLA [RIPS Via Ingreso Usuario]
CREATE VIEW [dbo].[VISTA_VIA_INGRESO_SERVICIO_SALUD]
AS
SELECT dbo.[RIPS Via Ingreso Usuario].[Id Via Ingreso Usuario] AS IdViaIngresoServicioSalud, dbo.[RIPS Via Ingreso Usuario].Codigo, dbo.[RIPS Via Ingreso Usuario].[Nombre Via Ingreso Usuario] AS NombreViaIngresoServicioSalud, 
                  dbo.Estado.Estado
FROM     dbo.[RIPS Via Ingreso Usuario] INNER JOIN
                  dbo.Estado ON dbo.[RIPS Via Ingreso Usuario].[Id Estado] = dbo.Estado.[Id Estado]
GO
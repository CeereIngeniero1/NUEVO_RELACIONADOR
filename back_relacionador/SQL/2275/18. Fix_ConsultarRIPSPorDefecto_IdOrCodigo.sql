/*
  Fix: ConsultarRIPSPorDefecto resolvía Modalidad/Grupo/Finalidad/Causa/Via
  solo por Codigo, pero el front reciente guarda Id → Ver/Cargar dejan
  "Sin asignar" y no rellenan Modalidad→Grupo→CodServicio.

  Esta vista acepta Codigo O Id (datos viejos y nuevos).
*/
IF OBJECT_ID(N'dbo.[ConsultarRIPSPorDefecto]', N'V') IS NOT NULL
    DROP VIEW dbo.[ConsultarRIPSPorDefecto];
GO

CREATE VIEW dbo.[ConsultarRIPSPorDefecto]
AS
SELECT
    APIRPD.IdApiRipsPorDefecto,
    APIRPD.DocumentoEntidad,
    APIRPD.TipoDeRips,
    TR.[Tipo Rips] AS TipoDeUsuario,
    Ent.[Nombre Completo Entidad] AS Entidad,
    RIPSVIAINU.[Nombre Via Ingreso Usuario] AS ViaIngresoServicioSalud,
    RIPSMA.[Nombre Modalidad Atencion] AS ModalidadGrupoServicioTecnologiaEnSalud,
    RIPSGS.[Nombre Grupo Servicios] AS GrupoServicios,
    RIPSS.[Nombre Servicios] AS CodigoServicio,
    RIPSFCV2.[Nombre RIPS Finalidad Consulta Version2] AS FinalidadTecnologiaSalud,
    RC1.Nombre AS Diagnostico1,
    RC2.Nombre AS Diagnostico2,
    R1C10.Nombre AS Procedimiento1,
    R2C10.Nombre AS Procedimiento2,
    RCEV2.[Nombre RIPS Causa Externa Version2] AS CausaMotivoAtencion,
    TDP.[Descripción Tipo de Diagnóstico Principal] AS TipoDiagnosticoPrincipal
FROM dbo.API_RIPS_POR_DEFECTO AS APIRPD
LEFT OUTER JOIN dbo.[Tipo Rips] AS TR
    ON APIRPD.TipoDeUsuario = TR.[Id Tipo Rips]
LEFT OUTER JOIN dbo.Entidad AS Ent
    ON APIRPD.Entidad = Ent.[Documento Entidad]
LEFT OUTER JOIN dbo.[RIPS Via Ingreso Usuario] AS RIPSVIAINU
    ON APIRPD.ViaIngresoServicioSalud = RIPSVIAINU.Codigo
    OR APIRPD.ViaIngresoServicioSalud = CAST(RIPSVIAINU.[Id Via Ingreso Usuario] AS nvarchar(20))
LEFT OUTER JOIN dbo.[RIPS Modalidad Atención] AS RIPSMA
    ON APIRPD.ModalidadGrupoServicioTecnologiaEnSalud = RIPSMA.Codigo
    OR APIRPD.ModalidadGrupoServicioTecnologiaEnSalud = CAST(RIPSMA.[Id Modalidad Atencion] AS nvarchar(20))
LEFT OUTER JOIN dbo.[RIPS Grupo Servicios] AS RIPSGS
    ON APIRPD.GrupoServicios = RIPSGS.Codigo
    OR APIRPD.GrupoServicios = CAST(RIPSGS.[Id Grupo Servicios] AS nvarchar(20))
LEFT OUTER JOIN dbo.[RIPS Servicios] AS RIPSS
    ON APIRPD.CodigoServicio = RIPSS.[Id Servicios]
    OR APIRPD.CodigoServicio = CAST(RIPSS.[Código Servicios] AS nvarchar(50))
LEFT OUTER JOIN dbo.[RIPS Finalidad Consulta Version2] AS RIPSFCV2
    ON APIRPD.FinalidadTecnologiaSalud = RIPSFCV2.Codigo
    OR APIRPD.FinalidadTecnologiaSalud = CAST(RIPSFCV2.[Id Finalidad Consulta] AS nvarchar(20))
LEFT OUTER JOIN dbo.[Rips Cups] AS RC1
    ON APIRPD.Diagnostico1 = RC1.Codigo
LEFT OUTER JOIN dbo.[Rips Cups] AS RC2
    ON APIRPD.Diagnostico2 = RC2.Codigo
LEFT OUTER JOIN dbo.[Rips Cie10] AS R1C10
    ON APIRPD.Procedimiento1 = R1C10.Codigo
LEFT OUTER JOIN dbo.[Rips Cie10] AS R2C10
    ON APIRPD.Procedimiento2 = R2C10.Codigo
LEFT OUTER JOIN dbo.[RIPS Causa Externa Version2] AS RCEV2
    ON APIRPD.CausaMotivoAtencion = RCEV2.Codigo
    OR APIRPD.CausaMotivoAtencion = CAST(RCEV2.[Id RIPS Causa Externa Version2] AS nvarchar(20))
LEFT OUTER JOIN dbo.[Tipo de Diagnóstico Principal] AS TDP
    ON APIRPD.TipoDiagnosticoPrincipal = TDP.[Código Tipo de Diagnóstico Principal];
GO

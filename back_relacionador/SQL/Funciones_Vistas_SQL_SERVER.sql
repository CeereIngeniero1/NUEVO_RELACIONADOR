USE [CeereSio]
GO
/****** Object:  UserDefinedFunction [dbo].[CalcularEdadPaciente]    Script Date: 25/01/2024 4:27:32 p.m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[CalcularEdadPaciente]
(
    @FechaNacimiento date
)
RETURNS NVARCHAR (100)
AS
BEGIN 
    DECLARE @EdadEnDias INT
    DECLARE @Resultado NVARCHAR(100)

    -- SE CALCULA LA DIFERENCIA EN DÍAS
    SELECT @EdadEnDias = DATEDIFF(DAY, @FechaNacimiento, GETDATE())

    -- SE CONTRUYE EL RESULTADO QUE SE RETORNA
    SET @Resultado = 
        CASE
            WHEN @EdadEnDias < 30 THEN CAST(@EdadEnDias AS NVARCHAR(10))
            WHEN @EdadEnDias < 365 THEN CAST(@EdadEnDias / 30 AS NVARCHAR(10))
            ELSE CAST(@EdadEnDias / 365 AS NVARCHAR(10))
        END

    -- SI LA EDAD ES 0 DÍAS, DEVUELVE (0 Día(s))
    IF @Resultado = '0 Día(s)'
        SET @Resultado = '0'

    RETURN @Resultado
END
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
USE [Laureles]
GO
/****** Object:  UserDefinedFunction [dbo].[CalcularUnidadDeMedidaDeLaEdad]    Script Date: 25/01/2024 4:28:17 p.m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[CalcularUnidadDeMedidaDeLaEdad](@FechaNacimiento DATETIME)
RETURNS NVARCHAR(50)
AS
BEGIN
    DECLARE @Hoy DATETIME = GETDATE()
    DECLARE @EdadEnDias INT = DATEDIFF(DAY, @FechaNacimiento, @Hoy)
    DECLARE @EdadEnMeses INT = DATEDIFF(MONTH, @FechaNacimiento, @Hoy)
    DECLARE @Resultado NVARCHAR(50)

    IF @EdadEnDias < 30
        SET @Resultado = '3'
    ELSE IF @EdadEnMeses < 12
        SET @Resultado = '2'
    ELSE
        SET @Resultado = '1'

    RETURN @Resultado
END;
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Nombre Consulta: Cnsta CR RIPS AC PARTICULAR 2024
SELECT F.[No Factura] AS [Número de la Factura], Em.[Código Empresa] AS [Código del Prestador de Servicios de Salud], TD.[Tipo de Documento] AS [Tipo de Identificación del Usuario], 
                  EE.[Documento Entidad] AS [Número de Identificación del Usuario en el Sistema], CONVERT(VARCHAR, EE.[Fecha Evaluación Entidad], 103) AS [Fecha de la Consulta], '' AS [Número de Autorización], 
                  EER.[Codigo Rips] AS [Código de la Consulta], FC.[Finalidad Consulta] AS [Finalidad de la Consulta], CE.[Causa Externa], EER.[Diagnostico Rips] AS [Código del Diagnóstico Principal], '' AS [Código del Diagnóstico Relacionado No.1], 
                  '' AS [Código del Diagnóstico Relacionado No.2], '' AS [Código del Diagnóstico Relacionado No.3], TDP.[Tipo de Diagnóstico Principal], '' AS [Valor de la Consulta], '' AS [Valor de la Cuota Moderadora], 
                  F.[Total Factura] AS [Valor Neto a Pagar]
FROM     dbo.[Evaluación Entidad Rips] AS EER INNER JOIN
                  dbo.[Evaluación Entidad] AS EE ON EER.[Id Evaluación Entidad] = EE.[Id Evaluación Entidad] INNER JOIN
                  dbo.Entidad AS En ON EE.[Documento Entidad] = En.[Documento Entidad] INNER JOIN
                  dbo.[Tipo de Documento] AS TD ON En.[Id Tipo de Documento] = TD.[Id Tipo de Documento] INNER JOIN
                  dbo.Factura AS F ON EER.[Id Factura] = F.[Id Factura] INNER JOIN
                  dbo.Empresa AS Em ON F.[Documento Empresa] = Em.[Documento Empresa] INNER JOIN
                  dbo.[Finalidad Consulta] AS FC ON EER.[Id Finalidad Consulta] = FC.[Id Finalidad Consulta] INNER JOIN
                  dbo.[Causa Externa] AS CE ON EER.[Id Causa Externa] = CE.[Id Causa Externa] INNER JOIN
                  dbo.[Tipo de Diagnóstico Principal] AS TDP ON EER.[Id Tipo de Diagnóstico Principal] = TDP.[Id Tipo de Diagnóstico Principal]
WHERE  (EER.[Id Acto Quirúrgico] = 1)
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Nombre Consulta: Cnsta CR RIPS AF PARTICULAR 2024
SELECT Em.[Código Empresa] AS [Código del Prestador de Servicios de Salud], UPPER(Em.[Razon Social Empresa]) AS [Razón Social o Apellidos y Nombre del Prestador de Servicios de Salud], 
                  TD.[Tipo de Documento] AS [Tipo de Identificación del Prestador de Servicios de Salud], SUBSTRING(Em.[Documento Empresa], 1, 9) AS [Número de Identificación del Prestador], F.[No Factura] AS [Número de la Factura], 
                  CONVERT(VARCHAR, F.[Fecha Factura], 103) AS [Fecha de Expedición de la Factura], '' AS [Fecha de Inicio], '' AS [Fecha Final], '05001' AS [Código Entidad Administradora], '' AS [Nombre Entidad Administradora], 
                  '' AS [Número del Contrato], '' AS [Plan de Beneficios], '' AS [Número de la Poliza], '' AS [Valor Total del Pago Compartido (copago)], '' AS [Valor de la Comisión], '' AS [Valor Total de Descuentos], 
                  F.[Total Factura] AS [Valor Neto a Pagar por la Entidad Contratante]
FROM     dbo.[Evaluación Entidad Rips] AS EER INNER JOIN
                  dbo.Factura AS F ON EER.[Id Factura] = F.[Id Factura] INNER JOIN
                  dbo.Empresa AS Em ON F.[Documento Empresa] = Em.[Documento Empresa] INNER JOIN
                  dbo.[Tipo de Documento] AS TD ON Em.[Id Tipo de Documento] = TD.[Id Tipo de Documento] INNER JOIN
                  dbo.EntidadIII AS E3 ON F.[Documento Paciente] = E3.[Documento Entidad] INNER JOIN
                  dbo.[Tipo Entidad] AS TE ON E3.[Id Tipo Entidad] = TE.[Id Tipo Entidad]
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Nombre Consulta: Cnsta CR RIPS AP PARTICULAR 2024

SELECT F.[No Factura] AS [Número de la Factura], Em.[Código Empresa] AS [Código del Prestador de Servicios de Salud], TD.[Tipo de Documento] AS [Tipo de Identificación del Usuario], 
                  EE.[Documento Entidad] AS [Número de Identificación del Usuario en el Sistema], CONVERT(VARCHAR, EE.[Fecha Evaluación Entidad], 103) AS [Fecha del Procedimiento], '' AS [Número de Autorización], 
                  EER.[Codigo Rips] AS [Código del Procedimiento], ARP.[Ambito de Realización del Procedimiento] AS [Ámbito de Realización del Procedimiento], PA.[Persona que Atiende] AS [Personal que Atiende], 
                  EER.[Codigo Rips] AS [Diagnóstico Principal], FP.[Finalidad del Procedimiento], AQ.[Acto Quirúrgico] AS [Forma de Realización del Acto Quirúrgico], '' AS [Diagnóstico Relacionado], '' AS Complicación, 
                  F.[Total Factura] AS [Valor del Procedimiento]
FROM     dbo.[Evaluación Entidad Rips] AS EER INNER JOIN
                  dbo.[Evaluación Entidad] AS EE ON EER.[Id Evaluación Entidad] = EE.[Id Evaluación Entidad] INNER JOIN
                  dbo.Factura AS F ON EER.[Id Factura] = F.[Id Factura] INNER JOIN
                  dbo.Empresa AS Em ON EE.[Documento Empresa] = Em.[Documento Empresa] INNER JOIN
                  dbo.Entidad AS En ON EE.[Documento Entidad] = En.[Documento Entidad] INNER JOIN
                  dbo.[Tipo de Documento] AS TD ON En.[Id Tipo de Documento] = TD.[Id Tipo de Documento] INNER JOIN
                  dbo.[Ambito de Realización del Procedimiento] AS ARP ON EER.[Id Finalidad Consulta] = ARP.[Id Ambito de Realización del Procedimiento] INNER JOIN
                  dbo.[Persona que Atiende] AS PA ON EER.[Id Tipo de Diagnóstico Principal] = PA.[Id Persona que Atiende] INNER JOIN
                  dbo.[Finalidad del Procedimiento] AS FP ON EER.[Id Causa Externa] = FP.[Id Finalidad del Procedimiento] INNER JOIN
                  dbo.[Acto Quirúrgico] AS AQ ON EER.[Id Acto Quirúrgico] = AQ.[Id Acto Quirúrgico]
WHERE  (EER.[Id Acto Quirúrgico] >= 2)
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Nombre Consulta: Cnsta CR RIPS US PARTICULAR 2024
SELECT MIN(EE.[Id Evaluación Entidad]) AS Id, EE.[Documento Entidad], MIN(EE.[Fecha Evaluación Entidad]) AS [Fecha Evaluación Entidad], TD.[Tipo de Documento] AS [Tipo de Identificación del Usuario], 
                  '05001' AS [Código Entidad Administradora], TE.[Tipo Entidad], UPPER(E.[Primer Apellido Entidad]) AS [Primer Apellido del Usuario], UPPER(E.[Segundo Apellido Entidad]) AS [Segundo Apellido del Usuario], 
                  UPPER(E.[Primer Nombre Entidad]) AS [Primer Nombre del Usuario], UPPER(E.[Segundo Nombre Entidad]) AS [Segundo Nombre del Usuario], dbo.CalcularEdadPaciente(E3.[Fecha Nacimiento EntidadIII]) AS Edad, 
                  dbo.CalcularUnidadDeMedidaDeLaEdad(E3.[Fecha Nacimiento EntidadIII]) AS [Unidad de Medida de la Edad], dbo.Sexo.Sexo, D.[Código Departamento] AS [Código del Departamento de Residencia Habitual], 
                  C.[Código Ciudad] AS [Código del Municipio de Residencia Habitual], ZR.[Zona Residencia] AS [Zona de Residencia Habitual]
FROM     dbo.[Evaluación Entidad Rips] AS EER INNER JOIN
                  dbo.[Evaluación Entidad] AS EE ON EER.[Id Evaluación Entidad] = EE.[Id Evaluación Entidad] INNER JOIN
                  dbo.Entidad AS E ON EE.[Documento Entidad] = E.[Documento Entidad] INNER JOIN
                  dbo.[Tipo de Documento] AS TD ON E.[Id Tipo de Documento] = TD.[Id Tipo de Documento] INNER JOIN
                  dbo.EntidadIII AS E3 ON E.[Documento Entidad] = E3.[Documento Entidad] INNER JOIN
                  dbo.Sexo ON E3.[Id Sexo] = dbo.Sexo.[Id Sexo] INNER JOIN
                  dbo.Ciudad AS C ON E3.[Id Ciudad] = C.[Id Ciudad] INNER JOIN
                  dbo.Departamento AS D ON C.[Id Departamento] = D.[Id Departamento] INNER JOIN
                  dbo.[Zona Residencia] AS ZR ON E3.[Id Zona Residencia] = ZR.[Id Zona Residencia] INNER JOIN
                  dbo.[Tipo Entidad] AS TE ON E3.[Id Tipo Entidad] = TE.[Id Tipo Entidad]
GROUP BY EE.[Documento Entidad], TD.[Tipo de Documento], TE.[Tipo Entidad], E.[Primer Apellido Entidad], E.[Segundo Apellido Entidad], E.[Primer Nombre Entidad], E.[Segundo Nombre Entidad], E3.[Fecha Nacimiento EntidadIII], dbo.Sexo.Sexo, 
                  C.[Código Ciudad], D.[Código Departamento], ZR.[Zona Residencia]



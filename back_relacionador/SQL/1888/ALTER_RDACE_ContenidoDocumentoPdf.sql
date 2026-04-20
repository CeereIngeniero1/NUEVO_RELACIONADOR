/*
  RDA Consulta Externa — almacenar PDF del resumen clínico (binario)
  Ejecutar en la misma base donde existe [Evaluacion Entidad RDA Consulta Externa].
*/
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Contenido Documento PDF') IS NULL
BEGIN
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa]
    ADD [Contenido Documento PDF] VARBINARY(MAX) NULL;
END
GO

IF COL_LENGTH(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', 'Fecha Generacion Documento PDF') IS NULL
BEGIN
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa]
    ADD [Fecha Generacion Documento PDF] DATETIME2(7) NULL;
END
GO

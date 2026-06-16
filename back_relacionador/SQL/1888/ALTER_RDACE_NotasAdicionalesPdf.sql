/* Campo opcional: texto libre incluido en el resumen clínico PDF (sección 8). */
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Evaluacion Entidad RDA Consulta Externa]', N'U')
      AND name = N'Notas Adicionales PDF'
)
    ALTER TABLE [dbo].[Evaluacion Entidad RDA Consulta Externa]
        ADD [Notas Adicionales PDF] NVARCHAR(MAX) NULL;
GO

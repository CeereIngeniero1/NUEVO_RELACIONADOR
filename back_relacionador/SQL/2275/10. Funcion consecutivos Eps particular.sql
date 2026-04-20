Create FUNCTION [dbo].[Documento_EPS]
(
	@Documento NVARCHAR(50)
)
RETURNS INT 
AS
BEGIN 
	DECLARE @existe INT;

	IF EXISTS (
		SELECT 1 
		FROM [Función Por Entidad]
		WHERE [Id Función] IN (23, 24) AND [Documento Entidad] = @Documento
	)
		SET @existe = 1;
	ELSE
		SET @existe = 0;

	RETURN @existe;
END;

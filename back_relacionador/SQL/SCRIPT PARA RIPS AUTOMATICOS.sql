
-- se ingresa columna
ALTER TABLE [Evaluación Entidad Rips]
ADD [Id Factura] int Null;

ALTER TABLE [Evaluación Entidad Rips]
ADD [Id Plan de Tratamiento] int Null;

/****** Object:  UserDefinedFunction [dbo].[FuncionBuscarRelacionRips]    Script Date: 20/03/2024 7:26:55 a.m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[FuncionBuscarRelacionRips]
(
	@DocumentoPaciente NVARCHAR(50),
	@FechaEvaluacionPaciente DATE
)

RETURNS INT
AS
BEGIN 
	DECLARE @IdEvaluacionEntidad INT;  -- VARIABLE PARA ALMACENAR EL ID DE LA EVALUACIÓN ENTIDAD
	DECLARE @ResultadoExisteRelacionRips INT;

	-- SE CAPTURA EL ID DE LA EVALUACIÓN ENTIDAD
	SELECT 
		@IdEvaluacionEntidad = [Evaluación Entidad].[Id Evaluación Entidad] 
	FROM 
		[Evaluación Entidad]
	INNER JOIN 
		[Evaluación Entidad Rips] ON [Evaluación Entidad].[Id Evaluación Entidad] = [Evaluación Entidad Rips].[Id Evaluación Entidad]
	WHERE 
		[Documento Entidad] = @DocumentoPaciente 
		AND CONVERT(DATE, [Fecha Evaluación Entidad]) = @FechaEvaluacionPaciente
		AND [Evaluación Entidad Rips].[Id Factura] is NULL;

	
	-- ASIGNA EL RESULTADO (1 SI EXISTE, 0 SI NO EXISTE) A LA VARIABLE
	SET @ResultadoExisteRelacionRips = CASE WHEN @IdEvaluacionEntidad IS NOT NULL THEN 1 ELSE 0 END;


	-- RETORNA EL ID DE LA EVALUACIÓN ENTIDAD SI LA RELACIÓN EXISTE, DE LO CONTRARIO, RETORNA 0
	RETURN CASE WHEN @ResultadoExisteRelacionRips = 1 THEN @IdEvaluacionEntidad ELSE 0 END;
END;
GO


CREATE FUNCTION [dbo].[FuncionBuscarFacturaPaciente]
(
	@DocumentoPaciente NVARCHAR(50),
	@FechaFactura DATE
)

RETURNS INT
AS 
BEGIN

	--DECLARE @ResultadoExisteFactura INT;
	DECLARE @ResultadoExisteFactura INT;

	SELECT @ResultadoExisteFactura = (SELECT TOP (1) [Id Factura] FROM Factura WHERE [Documento Paciente] = @DocumentoPaciente AND CONVERT(DATE, [Fecha Factura]) = @FechaFactura 
	AND  NOT EXISTS  (select [Id Factura] from [Evaluación Entidad Rips] where ([Evaluación Entidad Rips].[Id Factura] = Factura.[Id Factura]) ));

	RETURN @ResultadoExisteFactura;

END;

GO


CREATE TRIGGER [dbo].[Relacion_Rips_Factura]
ON [dbo].[Factura]
AFTER  insert
--NOT FOR REPLICATION
AS
begin
declare @IDFactura int;
declare  @documentoPaciente nvarchar(50);
declare @FechaFACTURA datetime;
declare @IdEvaluacion  int;

Select @documentoPaciente = [Documento Paciente],
@FechaFACTURA = [Fecha Factura],
@IDFactura = [Id Factura]
FROM inserted

SELECT @IdEvaluacion =   dbo.FuncionBuscarRelacionRips(@documentoPaciente, @FechaFACTURA) ;

update [Evaluación Entidad Rips] set [Id Factura] = @IDFactura
	where [Id Evaluación Entidad] = @IdEvaluacion

	END
GO

ALTER TABLE [dbo].[Factura] ENABLE TRIGGER [Relacion_Rips_Factura]
GO


ALTER TRIGGER [dbo].[Relacion_Factura_Rips]
ON [dbo].[Evaluación Entidad Rips]
AFTER  insert
--NOT FOR REPLICATION
AS
begin

declare @IDFactura int;
declare @IDpresupuesto int;
declare @IDpresupues int;
declare  @documentoPaciente nvarchar(50);
declare @FechaEvaluacionEntidad datetime;
declare @IdEvaluacion  int;




select  @documentoPaciente = [Evaluación Entidad].[Documento Entidad],
@FechaEvaluacionEntidad = [Evaluación Entidad].[Fecha Evaluación Entidad],
@IdEvaluacion = inserted.[Id Evaluación Entidad Rips],
@IDFactura = inserted.[Id Factura]
--@IDpresupuesto = inserted.[Id Plan de Tratamiento]
from Inserted inner join [Evaluación Entidad Rips] on [Evaluación Entidad Rips].[Id Evaluación Entidad rips] = inserted.[Id Evaluación Entidad Rips]
inner join [Evaluación Entidad] on [Evaluación Entidad Rips].[Id Evaluación Entidad] = [Evaluación Entidad].[Id Evaluación Entidad]

	

	IF(@IDFactura IS NOT NULL)
	BEGIN
		--IF (@IDFactura = 0)
		--	BEGIN
		--		update [Evaluación Entidad Rips] set [Id Factura] = NULL
		--			where [Id Evaluación Entidad Rips] = @IdEvaluacion
		--	END
	

		--if(@IDFactura IS NULL) 
		IF (@IDFactura = 0)
			BEGIN
				SELECT @IDFactura =   dbo.FuncionBuscarFacturaPaciente(@documentoPaciente, @FechaEvaluacionEntidad) ;	
	
				IF(@IDFactura IS NOT NULL)
					BEGIN
						update [Evaluación Entidad Rips] set [Id Factura] = @IDFactura
						where [Id Evaluación Entidad Rips] = @IdEvaluacion
					END
					ELSE
					BEGIN
						update [Evaluación Entidad Rips] set [Id Factura] = NULL
						where [Id Evaluación Entidad Rips] = @IdEvaluacion
					END
			END
	END
	
END;

ALTER TABLE [dbo].[Evaluación Entidad Rips] ENABLE TRIGGER [Relacion_Factura_Rips]




----------------------TRIGER PARA LA EVALUACION ENTIDAD RIPS PARA LAS PREPAGADAS

CREATE TRIGGER [dbo].[Tr_Relacion_Historia_Eps_Prepagada_RIPS]
   ON  [dbo].[Evaluación Entidad Rips]
   AFTER INSERT
AS
BEGIN
      -- Declarar variables
      DECLARE @idPlandetratamiento INT  ,
              @documentoPaciente NVARCHAR(50),
              @FechaInicioRIPS DATE,
              @IdEvaluacion INT,
              @documentoEps NVARCHAR(50),
			  @IdEvaluacionentidad int,
			  @TipoRips int;





			 
      -- Asignar valores desde la tabla inserted (solo se espera una fila)
      SELECT @IdEvaluacionentidad = [Id Evaluación Entidad],
	  @TipoRips = [Id Tipo de Rips],
	  @documentoEps = [Documento Tipo Rips],
	  @idPlandetratamiento = [Id Plan de Tratamiento]
      FROM inserted;
	
	if(@idPlandetratamiento IS NULL)
	BEGIN
		IF (@idPlandetratamiento = 0)
		BEGIN
			update [Evaluación Entidad Rips] set [Id Plan de Tratamiento] = NULL
				where [Id Evaluación Entidad Rips] = @IdEvaluacion
		END

			
	    IF @TipoRips = 3
	   BEGIN
		  SELECT @FechaInicioRIPS = CONVERT (DATE,[Fecha Evaluación Entidad], 101),
		  @documentoPaciente = [Documento Entidad] 
		  FROM [Evaluación Entidad]
		  WHERE  [Id Evaluación Entidad] = @IdEvaluacionentidad
		  
			SELECT @idPlandetratamiento = [Plan de Tratamiento].[Id Plan de Tratamiento]
			FROM [Plan de Tratamiento] 
			INNER JOIN [Plan de Tratamiento Tratamientos] 
				ON [Plan de Tratamiento].[Id Plan de Tratamiento] = [Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento]
			WHERE CONVERT(DATE, [Fecha Inicio Plan de Tratamiento], 101) 
					BETWEEN DATEADD(DAY, -15, @FechaInicioRIPS) 
						AND DATEADD(DAY, 15, @FechaInicioRIPS)
			AND [Documento Paciente] = @documentoPaciente 
			AND [Id Tipo Responsable] = 5 
			AND [Documento Responsable] = @documentoEps;
		  

		  -- Verificar si se obtuvo un documento de EPS válido
		  IF @idPlandetratamiento IS NOT NULL
		  BEGIN
			

			 
				UPDATE [Evaluación Entidad Rips]
				SET [Id Plan de Tratamiento] = @idPlandetratamiento
				WHERE [Id Evaluación Entidad] = @IdEvaluacionentidad;

			     
		  END 
		END
	END	  
END;


------------------------FUNCION PARA BUSCAR PACIENTES PREPAGADAS 


CREATE FUNCTION [dbo].[Buscar_Paciente_EPS]
(
	@idtratamiento int
)
RETURNS nvarchar(50)
AS
BEGIN 
	DECLARE @documentoPaciente nvarchar(50);  -- VARIABLE PARA ALMACENAR EL ID DE LA EVALUACIÓN ENTIDAD

	-- SE CAPTURA EL ID DE LA EVALUACIÓN ENTIDAD
	SELECT 
		@documentoPaciente =  [Documento Paciente] 
	FROM 
		[Plan de Tratamiento]
	WHERE 
		[Id Plan de Tratamiento] = @idtratamiento

	-- RETORNA EL DOCUMENTO EPS SI EXISTE, DE LO CONTRARIO, RETORNA NULL
	RETURN @documentoPaciente;
END;


-------------------FUNCION PARA TRIGER ANTERIOR 
CREATE FUNCTION [dbo].[FuncionBuscartratamientoPaciente]
(
	@DocumentoPaciente NVARCHAR(50),
	@FechaEvaluacionEntidad DATE,
	@DocumentoEPS NVARCHAR(50)
)

RETURNS nvarchar(50)
AS 
BEGIN
	 DECLARE @ResultadoExisteTratamiento nvarchar(50);

SELECT @ResultadoExisteTratamiento = (
    SELECT TOP (1) [Plan de Tratamiento].[Id Plan de Tratamiento] 
    FROM [Plan de Tratamiento] 
    INNER JOIN [Plan de Tratamiento Tratamientos] 
        ON [Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento] = [Plan de Tratamiento].[Id Plan de Tratamiento]
    WHERE [Documento Paciente] = @DocumentoPaciente
        AND [Documento Responsable] = @DocumentoEPS
        AND CONVERT(DATE, [Fecha Inicio Plan de Tratamiento]) 
            BETWEEN DATEADD(DAY, -15, @FechaEvaluacionEntidad) 
                AND DATEADD(DAY, 15, @FechaEvaluacionEntidad)
        AND NOT EXISTS (
            SELECT [Id Plan de Tratamiento]
            FROM [Evaluación Entidad Rips] 
            WHERE [Evaluación Entidad Rips].[Id Plan de Tratamiento] = [Plan de Tratamiento].[Id Plan de Tratamiento]
        )
);

	RETURN @ResultadoExisteTratamiento;

END;



----------------------------------TRIGER PARA PLAN DE TRATAMIENTO (PREPAGADAS)


CREATE TRIGGER [dbo].[Tr_Relacion_Historia_Eps_Prepagada_]
   ON  [dbo].[Plan de Tratamiento Tratamientos]
   AFTER INSERT
AS
BEGIN
      -- Declarar variables
      DECLARE @idPlandetratamiento INT,
              @documentoPaciente NVARCHAR(50),
              @FechaInicioTratamiento DATE,
              @IdEvaluacion INT,
              @documentoEps NVARCHAR(50);

      -- Asignar valores desde la tabla inserted (solo se espera una fila)
      SELECT @idPlandetratamiento = [Id Plan de Tratamiento],
             @documentoEps = [Documento Responsable],
             @FechaInicioTratamiento = [Fecha Inicio Plan de Tratamiento Tratamientos]
      FROM inserted;

	  -- Llamar a la función para obtener el documento del Paciente
      SET @documentoPaciente = dbo.[Buscar_Paciente_EPS](@idPlandetratamiento);
      -- Verificar si se obtuvo un documento de EPS válido
      IF @documentoEps IS NOT NULL
      BEGIN
         -- Llamar a la función para obtener el Id de Evaluación
         SET @IdEvaluacion = dbo.FuncionBuscarRelaciontratamientoRips(@documentoPaciente, @FechaInicioTratamiento, @documentoEps);

         -- Si se encuentra un Id de Evaluación válido, HACE LA  actualización
         IF @IdEvaluacion IS NOT NULL AND @IdEvaluacion > 0
         BEGIN
            UPDATE [Evaluación Entidad Rips]
            SET [Id Plan de Tratamiento] = @idPlandetratamiento
            WHERE [Id Evaluación Entidad] = @IdEvaluacion;

         END      
      END 
END;


-----------------------------------------FUNCION PARA TRIGER DE LAS PREPAGADAS EN PLAN DE TRATAMIENTO


CREATE FUNCTION [dbo].[FuncionBuscarRelaciontratamientoRips]
(
	@DocumentoPaciente NVARCHAR(50),
	@FechaInicioTratamiento DATE,
	@Documentoeps NVARCHAR(50)
)
RETURNS INT
AS
BEGIN 
	DECLARE @IdEvaluacionEntidad INT;  -- VARIABLE PARA ALMACENAR EL ID DE LA EVALUACIÓN ENTIDAD
	DECLARE @ResultadoExisteRelacionRips INT;

	-- SE CAPTURA EL ID DE LA EVALUACIÓN ENTIDAD
	SELECT 
		@IdEvaluacionEntidad = [Evaluación Entidad].[Id Evaluación Entidad] 
	FROM 
		[Evaluación Entidad]
	INNER JOIN 
		[Evaluación Entidad Rips] ON [Evaluación Entidad].[Id Evaluación Entidad] = [Evaluación Entidad Rips].[Id Evaluación Entidad]
	WHERE 
		[Documento Entidad] = @DocumentoPaciente 
		AND CONVERT(DATE, [Fecha Evaluación Entidad]) = @FechaInicioTratamiento
		AND [Evaluación Entidad Rips].[Id Plan de Tratamiento] IS NULL
		AND [Documento Tipo Rips] = @Documentoeps
		AND ([Evaluación Entidad Rips].[Id Tipo de Rips] = 3 OR [Evaluación Entidad Rips].[Id Tipo de Rips] = 4);

	-- ASIGNA EL RESULTADO (1 SI EXISTE, 0 SI NO EXISTE) A LA VARIABLE
	SET @ResultadoExisteRelacionRips = CASE WHEN @IdEvaluacionEntidad IS NOT NULL THEN 1 ELSE 0 END;

	-- RETORNA EL ID DE LA EVALUACIÓN ENTIDAD SI LA RELACIÓN EXISTE, DE LO CONTRARIO, RETORNA 0
	RETURN CASE WHEN @ResultadoExisteRelacionRips = 1 THEN @IdEvaluacionEntidad ELSE 0 END;
END;
GO


-------------------TRIGER PARA FACTURAII DONDE SE ADJUNTA AL FACTURA A LOS RIPS QUE ESTAN CON LOS TRATAMIENTOS D ELA PREPAGADAS 


CREATE TRIGGER [dbo].[Relacion_Rips_Factura_EPS]
ON [dbo].[FacturaII]
AFTER  insert
--NOT FOR REPLICATION
AS
begin
declare @IDFactura int;
declare @IdTratamiento int;
Declare @docResponFactura nvarchar(50);
Declare @EsPrepagada bit;

SET @EsPrepagada = 0;

Select @IdTratamiento = [Id Plan de Tratamiento],
@IDFactura = inserted.[Id Factura],
@docResponFactura = Factura.[Documento Responsable]
 FROM            dbo.[Función Por Entidad] INNER JOIN
                         dbo.Función ON dbo.[Función Por Entidad].[Id Función] = dbo.Función.[Id Función] INNER JOIN
                         dbo.Factura INNER JOIN
                         inserted ON dbo.Factura.[Id Factura] = inserted.[Id Factura] ON dbo.[Función Por Entidad].[Documento Entidad] = dbo.Factura.[Documento Responsable]
WHERE        (dbo.Función.[Id Función] = 24)
--From inserted

set @EsPrepagada = (SELECT 1 FROM [Función Por Entidad] WHERE ([Documento Entidad] = @docResponFactura) AND ([Id Función] = 24));

IF @EsPrepagada = 1
	BEGIN
		 UPDATE [Evaluación Entidad Rips] 
		SET [Id Factura] = @IDFactura
		WHERE [Id Plan de Tratamiento] = @IdTratamiento  
		AND ([Id Tipo de Rips] = 3 OR [Id Tipo de Rips] = 4);
	END

END



---------------------------------------------------------------------------------------------
------------------ESTE SCRIPT ES SOLO PARA CLIENTE QUE DESEAN AMPLIAR RANGO DE RELACION DE RIPS COMO LO INDICO MEDIMUJER---------------------------

ALTER FUNCTION [dbo].[FuncionBuscarRelacionRips]
(
	@DocumentoPaciente NVARCHAR(50),
	@FechaEvaluacionPaciente DATE
)

RETURNS INT
AS
BEGIN 
	DECLARE @IdEvaluacionEntidad INT;  -- VARIABLE PARA ALMACENAR EL ID DE LA EVALUACIÓN ENTIDAD
	DECLARE @ResultadoExisteRelacionRips INT;

	-- SE CAPTURA EL ID DE LA EVALUACIÓN ENTIDAD
	SELECT 
		@IdEvaluacionEntidad = [Evaluación Entidad].[Id Evaluación Entidad] 
	FROM 
		[Evaluación Entidad]
	INNER JOIN 
		[Evaluación Entidad Rips] ON [Evaluación Entidad].[Id Evaluación Entidad] = [Evaluación Entidad Rips].[Id Evaluación Entidad]
	WHERE 
		[Documento Entidad] = @DocumentoPaciente 
		AND CONVERT(DATE, [Fecha Evaluación Entidad]) BETWEEN DATEADD(DAY, -10, @FechaEvaluacionPaciente) 
                                                      AND DATEADD(DAY, 10, @FechaEvaluacionPaciente)

		AND [Evaluación Entidad Rips].[Id Factura] is NULL;

	
	-- ASIGNA EL RESULTADO (1 SI EXISTE, 0 SI NO EXISTE) A LA VARIABLE
	SET @ResultadoExisteRelacionRips = CASE WHEN @IdEvaluacionEntidad IS NOT NULL THEN 1 ELSE 0 END;


	-- RETORNA EL ID DE LA EVALUACIÓN ENTIDAD SI LA RELACIÓN EXISTE, DE LO CONTRARIO, RETORNA 0
	RETURN CASE WHEN @ResultadoExisteRelacionRips = 1 THEN @IdEvaluacionEntidad ELSE 0 END;
END;

--------------------------------------Funcion ------------------------------------

ALTER FUNCTION [dbo].[FuncionBuscarFacturaPaciente]
(
	@DocumentoPaciente NVARCHAR(50),
	@FechaFactura DATE
)

RETURNS INT
AS 
BEGIN

	--DECLARE @ResultadoExisteFactura INT;
	DECLARE @ResultadoExisteFactura INT;

	SELECT @ResultadoExisteFactura = 
(
    SELECT TOP (1) [Id Factura] 
    FROM Factura 
    WHERE [Documento Paciente] = @DocumentoPaciente 
    AND CONVERT(DATE, [Fecha Factura]) 
        BETWEEN DATEADD(DAY, -10, @FechaFactura) 
            AND DATEADD(DAY, 10, @FechaFactura)
    AND NOT EXISTS  
    (
        SELECT [Id Factura] 
        FROM [Evaluación Entidad Rips] 
        WHERE [Evaluación Entidad Rips].[Id Factura] = Factura.[Id Factura]
    ) 
);


	RETURN @ResultadoExisteFactura;

END;


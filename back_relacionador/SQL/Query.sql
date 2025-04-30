USE CeereSio

--=========================SCRIPT PARA CREAR TABLAS DE LA 2275 EN RIPS UNIÓN AC=======================

-- se ingresa columna
ALTER TABLE [Evaluación Entidad Rips]
ADD [Id Factura] int Null;


-- INSERTAR DATOS FALTANTES EN VIA DE INGRESOS

INSERT INTO [dbo].[Vía de Ingreso] ([Código Vía de Ingreso], [Vía de Ingreso], [Descripción Vía de Ingreso], [Orden Vía de Ingreso], [Id Estado])
VALUES
	(NULL ,'3', 'Remitido',  1, 7),
	(NULL ,'4', 'Nacido en la Institución', 1, 7);


--ACTUALIZAR DATOS DEL PAIS SEGÚN CÓDIGO DEL SISPRO ->

UPDATE País SET País = 170
WHERE [Descripción País] = 'Colombia';

--ACTUALIZAR DATOS DEL MUNICIPIO SEGÚN CÓDIGO DEL SISPRO ->

UPDATE Ciudad SET [Código Ciudad] = '05001'
WHERE Ciudad = 'Medellín';

--ACTUALIZAR DATOS DE LA ZONA DE RESIDENCIA SEGÚN CÓDIGO DEL SISPRO ->

UPDATE [Zona Residencia] SET [Código Zona Residencia] = 01
WHERE [Descripción Zona Residencia] = 'Rural';

UPDATE [Zona Residencia] SET [Código Zona Residencia] = 02
WHERE [Descripción Zona Residencia] = 'Urbana';

-- CREAR COLUMNA PARA LA DEL ID DEL PRESTADO EN EMPRESA

ALTER TABLE Empresa
ADD NroIDPrestador NVARCHAR(50) NULL;

--PARA SABER EL NÚMERO DEL NroIDPrestado SE DEBE IR AL SIGUIENTE LINK

-- https://web.sispro.gov.co/WebPublico/Consultas/ConsultarDetalleReferenciaBasica.aspx?Code=IPSCodHabilitacion

-- Y AHÍ BUSCAR LA EMPRESA Y LA COLUMNA Extra_II:NroIDPrestador	

--SE INGRESA A LA BASE DE DATOS Y SE COLOCA EL NÚMERO EN LA TABLA EMPRESA 

------------------------------------------------------------------------------------

-- CREAR TABLA VIA INGRESO USUARIO
CREATE TABLE [dbo].[RIPS Via Ingreso Usuario](
    [Id Via Ingreso Usuario] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Codigo] [nvarchar](50) NULL,
    [Nombre Via Ingreso Usuario] [nvarchar](100) NULL,
    [Descripción Via Ingreso Usuario] [nvarchar](200) NULL,
    [Orden Via Ingreso Usuario] [int] NULL,
    [Id Estado] [int] NULL
);

INSERT INTO [dbo].[RIPS Via Ingreso Usuario] ([Codigo], [Nombre Via Ingreso Usuario], [Descripción Via Ingreso Usuario], [Orden Via Ingreso Usuario], [Id Estado])
VALUES
    ('01', 'Demanda espontánea', NULL, 1, 7),
    ('02', 'Derivado de consulta externa', NULL, 1, 7),
	('03', 'Derivado de urgencias', NULL, 1, 7),
	('04', 'Derivado de hospitalización', NULL, 1, 7),
	('05', 'Derivado de sala de cirugía', NULL, 1, 7),
	('06', 'Derivado de sala de partos', NULL, 1, 7),
	('07', 'Recién nacido en la institución', NULL, 1, 7),
	('08', 'Recién nacido en otra institución', NULL, 1, 7),
	('09', 'Derivado o referido de hospitalización domiciliaria', NULL, 1, 7),
    ('10', 'Derivado de atención domiciliaria', NULL, 1, 7),
    ('11', 'Derivado de telemedicina', NULL, 1, 7),
    ('12', 'Derivado de jornada de salud', NULL, 1, 7),
    ('13', 'Referido de otra institución', NULL, 1, 7),
    ('14', 'Contrarreferido de otra institución', NULL, 1, 7)


-- CREAR TABLA VIA MODALIDAD ATENCIÓN
CREATE TABLE [dbo].[RIPS Modalidad Atención](
    [Id Modalidad Atencion] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Codigo] [nvarchar](50) NULL,
    [Nombre Modalidad Atencion] [nvarchar](100) NULL,
    [Descripción Modalidad Atencion] [nvarchar](200) NULL,
    [Orden Modalidad Atencion] [int] NULL CONSTRAINT [DF_ModalidadAtencion_OrdenModalidadAtencion] DEFAULT (1),
    [Id Estado] [int] NULL CONSTRAINT [DF_ModalidadAtencion_IdEstado] DEFAULT (7)
);

INSERT INTO [dbo].[RIPS Modalidad Atención] ([Codigo], [Nombre Modalidad Atencion], [Descripción Modalidad Atencion], [Orden Modalidad Atencion], [Id Estado])
VALUES
    ('01', 'Intramural', NULL, 1, 7),
    ('02', 'Extramural unidad móvil', NULL, 1, 7),
	('03', 'Extramural domiciliaria', NULL, 1, 7),
	('04', 'Extramural jornada de salud', NULL, 1, 7),
	('06', 'Telemedicina interactiva', NULL, 1, 7),
	('07', 'Telemedicina no interactiva', NULL, 1, 7),
	('08', 'Telemedicina telexperticia', NULL, 1, 7),
	('09', 'Telemedicina telemonitoreo', NULL, 1, 7);


-- CREAR TABLA GRUPO DE SERVICIOS
CREATE TABLE [dbo].[RIPS Grupo Servicios](
    [Id Grupo Servicios] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Codigo] [nvarchar](50) NULL,
    [Nombre Grupo Servicios] [nvarchar](100) NULL,
    [Descripción Grupo Servicios] [nvarchar](200) NULL,
    [Orden Grupo Servicios] [int] NULL CONSTRAINT [DF_GrupoServicios_OrdenGrupoServicios] DEFAULT (1),
    [Id Estado] [int] NULL CONSTRAINT [DF_GrupoServicios_IdEstado] DEFAULT (7)
);

INSERT INTO [dbo].[RIPS Grupo Servicios] ([Codigo], [Nombre Grupo Servicios], [Descripción Grupo Servicios], [Orden Grupo Servicios], [Id Estado])
VALUES
    ('01', 'Consulta externa', NULL, 1, 7),
    ('02', 'Apoyo diagnóstico y complementación terapéutica', NULL, 1, 7),
	('03', 'Internación', NULL, 1, 7),
	('04', 'Quirúrgico', NULL, 1, 7),
	('05', 'Atención inmediata', NULL, 1, 7);


-- CREAR TABLA SERVICIOS QUE CORRESPONDE AL CODSERVICIO QUE ES UN CAMPO DE LOS RIPS
CREATE TABLE [dbo].[RIPS Servicios](
	[Id Servicios] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[Código Servicios] [nvarchar](20) NULL,
	[Nombre Servicios] [nvarchar](500) NULL,
	[Descripción Servicios] [nvarchar](100) NULL,
	[Id Estado] [INT] NULL
	)


INSERT INTO [dbo].[RIPS Servicios] ([Código Servicios], [Nombre Servicios], [Descripción Servicios], [Id Estado])
VALUES

('105','CUIDADO INTERMEDIO NEONATAL','INTERNACION',7),
('106','CUIDADO INTERMEDIO PEDIATRICO','INTERNACION',7),
('107','CUIDADO INTERMEDIO ADULTOS','INTERNACION',7),
('108','CUIDADO INTENSIVO NEONATAL','INTERNACION',7),
('109','CUIDADO INTENSIVO PEDIATRICO','INTERNACION',7),
('110','CUIDADO INTENSIVO ADULTOS','INTERNACION',7),
('1101','ATENCION DEL PARTO','ATENCION INMEDIATA',7),
('1102','URGENCIAS','ATENCION INMEDIATA',7),
('1103','TRANSPORTE ASISTENCIAL BASICO','ATENCION INMEDIATA',7),
('1104','TRANSPORTE ASISTENCIAL MEDICALIZADO','ATENCION INMEDIATA',7),
('1105','ATENCION PREHOSPITALARIA','ATENCION INMEDIATA',7),
('120','CUIDADO BASICO NEONATAL','INTERNACION',7),
('129','HOSPITALIZACION ADULTOS','INTERNACION',7),
('130','HOSPITALIZACION PEDIATRICA','INTERNACION',7),
('131','HOSPITALIZACION EN SALUD MENTAL','INTERNACION',7),
('132','HOSPITALIZACION PARCIAL','INTERNACION',7),
('133','HOSPITALIZACION PACIENTE CRONICO CON VENTILADOR','INTERNACION',7),
('134','HOSPITALIZACION PACIENTE CRONICO SIN VENTILADOR','INTERNACION',7),
('135','HOSPITALIZACION EN  CONSUMO DE SUSTANCIAS PSICOACTIVAS','INTERNACION',7),
('138','CUIDADO BASICO DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS','INTERNACION',7),
('201','CIRUGIA DE CABEZA Y CUELLO','QUIRURGICOS',7),
('202','CIRUGIA CARDIOVASCULAR','QUIRURGICOS',7),
('203','CIRUGIA GENERAL','QUIRURGICOS',7),
('204','CIRUGIA GINECOLOGICA','QUIRURGICOS',7),
('205','CIRUGIA MAXILOFACIAL','QUIRURGICOS',7),
('207','CIRUGIA ORTOPEDICA','QUIRURGICOS',7),
('208','CIRUGIA OFTALMOLOGICA','QUIRURGICOS',7),
('209','CIRUGIA OTORRINOLARINGOLOGIA','QUIRURGICOS',7),
('210','CIRUGIA ONCOLOGICA','QUIRURGICOS',7),
('211','CIRUGIA ORAL','QUIRURGICOS',7),
('212','CIRUGIA PEDIATRICA','QUIRURGICOS',7),
('213','CIRUGIA PLASTICA Y ESTETICA','QUIRURGICOS',7),
('214','CIRUGIA VASCULAR Y ANGIOLOGICA','QUIRURGICOS',7),
('215','CIRUGIA UROLOGICA','QUIRURGICOS',7),
('217','OTRAS CIRUGIAS','QUIRURGICOS',7),
('218','CIRUGIA ENDOVASCULAR NEUROLOGICA','QUIRURGICOS',7),
('227','CIRUGIA ONCOLOGICA PEDIATRICA','QUIRURGICOS',7),
('231','CIRUGIA DE LA MANO','QUIRURGICOS',7),
('232','CIRUGIA DE MAMA Y TUMORES TEJIDOS BLANDOS','QUIRURGICOS',7),
('233','CIRUGIA DERMATOLOGICA','QUIRURGICOS',7),
('234','CIRUGIA DE TORAX','QUIRURGICOS',7),
('235','CIRUGIA GASTROINTESTINAL','QUIRURGICOS',7),
('237','CIRUGIA PLASTICA ONCOLOGICA','QUIRURGICOS',7),
('245','NEUROCIRUGIA','QUIRURGICOS',7),
('301','ANESTESIA','CONSULTA EXTERNA',7),
('302','CARDIOLOGIA','CONSULTA EXTERNA',7),
('303','CIRUGIA CARDIOVASCULAR','CONSULTA EXTERNA',7),
('304','CIRUGIA GENERAL','CONSULTA EXTERNA',7),
('306','CIRUGIA PEDIATRICA','CONSULTA EXTERNA',7),
('308','DERMATOLOGIA','CONSULTA EXTERNA',7),
('309','DOLOR Y CUIDADOS PALIATIVOS','CONSULTA EXTERNA',7),
('310','ENDOCRINOLOGIA','CONSULTA EXTERNA',7),
('311','ENDODONCIA','CONSULTA EXTERNA',7),
('312','ENFERMERIA','CONSULTA EXTERNA',7),
('313','ESTOMATOLOGIA','CONSULTA EXTERNA',7),
('316','GASTROENTEROLOGIA','CONSULTA EXTERNA',7),
('317','GENETICA','CONSULTA EXTERNA',7),
('318','GERIATRIA','CONSULTA EXTERNA',7),
('320','GINECOBSTETRICIA','CONSULTA EXTERNA',7),
('321','HEMATOLOGIA','CONSULTA EXTERNA',7),
('323','INFECTOLOGIA','CONSULTA EXTERNA',7),
('324','INMUNOLOGIA','CONSULTA EXTERNA',7),
('325','MEDICINA FAMILIAR','CONSULTA EXTERNA',7),
('326','MEDICINA FISICA Y DEL DEPORTE','CONSULTA EXTERNA',7),
('327','MEDICINA FISICA Y REHABILITACION','CONSULTA EXTERNA',7),
('328','MEDICINA GENERAL','CONSULTA EXTERNA',7),
('329','MEDICINA INTERNA','CONSULTA EXTERNA',7),
('330','NEFROLOGIA','CONSULTA EXTERNA',7),
('331','NEUMOLOGIA','CONSULTA EXTERNA',7),
('332','NEUROLOGIA','CONSULTA EXTERNA',7),
('333','NUTRICION Y DIETETICA','CONSULTA EXTERNA',7),
('334','ODONTOLOGIA GENERAL','CONSULTA EXTERNA',7),
('335','OFTALMOLOGIA','CONSULTA EXTERNA',7),
('336','ONCOLOGIA CLINICA','CONSULTA EXTERNA',7),
('337','OPTOMETRIA','CONSULTA EXTERNA',7),
('338','ORTODONCIA','CONSULTA EXTERNA',7),
('339','ORTOPEDIA Y/O TRAUMATOLOGIA','CONSULTA EXTERNA',7),
('340','OTORRINOLARINGOLOGIA','CONSULTA EXTERNA',7),
('342','PEDIATRIA','CONSULTA EXTERNA',7),
('343','PERIODONCIA','CONSULTA EXTERNA',7),
('344','PSICOLOGIA','CONSULTA EXTERNA',7),
('345','PSIQUIATRIA','CONSULTA EXTERNA',7),
('346','REHABILITACION ONCOLOGICA','CONSULTA EXTERNA',7),
('347','REHABILITACION ORAL','CONSULTA EXTERNA',7),
('348','REUMATOLOGIA','CONSULTA EXTERNA',7),
('354','TOXICOLOGIA','CONSULTA EXTERNA',7),
('355','UROLOGIA','CONSULTA EXTERNA',7),
('356','OTRAS CONSULTAS DE ESPECIALIDAD','CONSULTA EXTERNA',7),
('361','CARDIOLOGIA PEDIATRICA','CONSULTA EXTERNA',7),
('362','CIRUGIA DE CABEZA Y CUELLO','CONSULTA EXTERNA',7),
('363','CIRUGIA DE MANO','CONSULTA EXTERNA',7),
('364','CIRUGIA DE MAMA Y TUMORES TEJIDOS BLANDOS','CONSULTA EXTERNA',7),
('365','CIRUGIA DERMATOLOGICA','CONSULTA EXTERNA',7),
('366','CIRUGIA DE TORAX','CONSULTA EXTERNA',7),
('367','CIRUGIA GASTROINTESTINAL','CONSULTA EXTERNA',7),
('368','CIRUGIA GINECOLOGICA LAPAROSCOPICA','CONSULTA EXTERNA',7),
('369','CIRUGIA PLASTICA Y ESTETICA','CONSULTA EXTERNA',7),
('370','CIRUGIA PLASTICA ONCOLOGICA','CONSULTA EXTERNA',7),
('371','OTRAS CONSULTAS GENERALES','CONSULTA EXTERNA',7),
('372','CIRUGIA VASCULAR','CONSULTA EXTERNA',7),
('373','CIRUGIA ONCOLOGICA','CONSULTA EXTERNA',7),
('374','CIRUGIA ONCOLOGICA PEDIATRICA','CONSULTA EXTERNA',7),
('375','DERMATOLOGIA ONCOLOGICA','CONSULTA EXTERNA',7),
('377','COLOPROCTOLOGIA','CONSULTA EXTERNA',7),
('379','GINECOLOGIA ONCOLOGICA','CONSULTA EXTERNA',7),
('383','MEDICINA NUCLEAR','CONSULTA EXTERNA',7),
('384','NEFROLOGIA PEDIATRICA','CONSULTA EXTERNA',7),
('385','NEONATOLOGIA','CONSULTA EXTERNA',7),
('386','NEUMOLOGIA PEDIATRICA','CONSULTA EXTERNA',7),
('387','NEUROCIRUGIA','CONSULTA EXTERNA',7),
('388','NEUROPEDIATRIA','CONSULTA EXTERNA',7),
('390','OFTALMOLOGIA ONCOLOGICA','CONSULTA EXTERNA',7),
('391','ONCOLOGIA Y HEMATOLOGIA PEDIATRICA','CONSULTA EXTERNA',7),
('393','ORTOPEDIA ONCOLOGICA','CONSULTA EXTERNA',7),
('395','UROLOGIA ONCOLOGICA','CONSULTA EXTERNA',7),
('396','ODONTOPEDIATRIA','CONSULTA EXTERNA',7),
('397','MEDICINA ESTETICA','CONSULTA EXTERNA',7),
('406','HEMATOLOGIA ONCOLOGICA','CONSULTA EXTERNA',7),
('407','MEDICINA DEL TRABAJO Y MEDICINA LABORAL','CONSULTA EXTERNA',7),
('408','RADIOTERAPIA','CONSULTA EXTERNA',7),
('409','ORTOPEDIA PEDIATRICA','CONSULTA EXTERNA',7),
('410','CIRUGIA ORAL','CONSULTA EXTERNA',7),
('411','CIRUGIA MAXILOFACIAL','CONSULTA EXTERNA',7),
('412','MEDICINA ALTERNATIVA Y COMPLEMENTARIA - HOMEOPATICA','CONSULTA EXTERNA',7),
('413','MEDICINA ALTERNATIVA Y COMPLEMENTARIA - AYURVEDICA','CONSULTA EXTERNA',7),
('414','MEDICINA ALTERNATIVA Y COMPLEMENTARIA - TRADICIONAL CHINA','CONSULTA EXTERNA',7),
('415','MEDICINA ALTERNATIVA Y COMPLEMENTARIA - NATUROPATICA','CONSULTA EXTERNA',7),
('416','MEDICINA ALTERNATIVA Y COMPLEMENTARIA - NEURALTERAPEUTICA','CONSULTA EXTERNA',7),
('417','TERAPIAS ALTERNATIVAS Y COMPLEMENTARIAS - BIOENERGETICA','CONSULTA EXTERNA',7),
('418','TERAPIAS ALTERNATIVAS Y COMPLEMENTARIAS - TERAPIA  CON FILTROS','CONSULTA EXTERNA',7),
('419','TERAPIAS ALTERNATIVAS Y COMPLEMENTARIAS - TERAPIAS  MANUALES','CONSULTA EXTERNA',7),
('420','VACUNACION','CONSULTA EXTERNA',7),
('421','PATOLOGIA','CONSULTA EXTERNA',7),
('422','MEDICINA ALTERNATIVA Y COMPLEMENTARIA - OSTEOPATICA','CONSULTA EXTERNA',7),
('423','SEGURIDAD Y SALUD EN EL TRABAJO','CONSULTA EXTERNA',7),
('706','LABORATORIO CLINICO','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('709','QUIMIOTERAPIA','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('711','RADIOTERAPIA','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('712','TOMA DE MUESTRAS DE LABORATORIO CLINICO','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('714','SERVICIO FARMACEUTICO','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('715','MEDICINA NUCLEAR','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('717','LABORATORIO CITOLOGIAS CERVICO-UTERINAS','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('728','TERAPIA OCUPACIONAL','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('729','TERAPIA RESPIRATORIA','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('731','LABORATORIO DE HISTOTECNOLOGIA','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('733','HEMODIALISIS','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('734','DIALISIS PERITONEAL','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('739','FISIOTERAPIA','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('740','FONOAUDIOLOGIA Y/O TERAPIA DEL LENGUAJE','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('742','DIAGNOSTICO VASCULAR','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('743','HEMODINAMIA E INTERVENCIONISMO','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('744','IMAGENES DIAGNOSTICAS- IONIZANTES','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('745','IMAGENES DIAGNOSTICAS - NO IONIZANTES','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('746','GESTION PRE-TRANSFUSIONAL','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('747','PATOLOGIA','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('748','RADIOLOGIA ODONTOLOGICA','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7),
('749','TOMA DE MUESTRAS DE CUELLO UTERINO Y GINECOLOGICAS','APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA',7)


-- ACTUALIZAR LOS CÓDIGOS DEL TIPO DE DIAGNOSTICO

UPDATE dbo.[Tipo de Diagnóstico Principal]
SET [Código Tipo de Diagnóstico Principal] = 
    CASE
        WHEN [Descripción Tipo de Diagnóstico Principal] = 'Impresión diagnóstica' THEN '01'
        WHEN [Descripción Tipo de Diagnóstico Principal] = 'Confirmado nuevo' THEN '02'
        WHEN [Descripción Tipo de Diagnóstico Principal] = 'Confirmado repetido' THEN '03'
        ELSE [Código Tipo de Diagnóstico Principal] -- Puedes añadir un ELSE si quieres dejar el valor actual en otros casos
    END;


UPDATE dbo.[Tipo Entidad]
SET [Código Tipo Entidad] = 
    CASE
        WHEN [Descripción Tipo Entidad] = 'Subsidiado' THEN '04'
        WHEN [Descripción Tipo Entidad] = 'Particular' THEN '12'
        ELSE [Código Tipo Entidad] -- Puedes añadir un ELSE si quieres dejar el valor actual en otros casos
    END;

UPDATE dbo.[Tipo Entidad]
SET [Id Estado] = 
    CASE

		WHEN [Descripción Tipo Entidad] = 'Subsidiado' THEN '7'
		WHEN [Descripción Tipo Entidad] = 'Particular' THEN '7'
		WHEN [Descripción Tipo Entidad] = 'Contributivo' THEN '8'
		WHEN [Descripción Tipo Entidad] = 'Vinculado' THEN '8'
		WHEN [Descripción Tipo Entidad] = 'Otro' THEN '8'
		WHEN [Descripción Tipo Entidad] = 'Ecopetrol S.A.' THEN '8'
		WHEN [Descripción Tipo Entidad] = 'Colsanitas Prepagada' THEN '8'
		WHEN [Descripción Tipo Entidad] = 'Extranjero' THEN '8'
		WHEN [Descripción Tipo Entidad] = 'Plan Odontologico' THEN '8'
		WHEN [Descripción Tipo Entidad] = 'Medisanitas' THEN '8'
    END;


-- INSERTAR LOS TIPOS DE USUARIO DE ACUERDO A LA NUEVA VERSION TIPOUSUARIOVERSIÓN2

INSERT INTO [dbo].[Tipo Entidad] ([Código Tipo Entidad], [Tipo Entidad], [Descripción Tipo Entidad], [Orden Tipo Entidad], [Id Estado])
VALUES
    ('01', '11', 'Contributivo cotizante', 1, 7),
	('02', '12', 'Contributivo beneficiario', 1, 7),
	('03', '13', 'Contributivo adicional', 1, 7),
	('05', '14', 'No afiliado', 1, 7),
	('06', '15', 'Especial o Excepción cotizante', 1, 7),
	('07', '16', 'Especial o Excepción beneficiario', 1, 7),
	('08', '13', 'Personas privadas de la libertad a cargo del Fondo Nacional de Salud', 1, 7),
	('09', '13', 'Tomador / Amparado ARL', 1, 7),
	('10', '13', 'Tomador / Amparado SOAT', 1, 7),
	('11', '13', 'Tomador / Amparado Planes voluntarios de salud', 1, 7)

--ACTUALIZAR LOS CODIGOS DE TIPO RIPS
UPDATE dbo.[Tipo Rips]
SET [Código Tipo Rips] = 
    CASE

		WHEN [Tipo Rips] = 'Particulares' THEN '17'
		WHEN [Tipo Rips] = 'Entidad Prepago' THEN '24'
		WHEN [Tipo Rips] = 'EPS' THEN '23'

    END;

--AGREGAR COLUMNAS EN EVALUACIÓN ENTIDAD RIPS 
ALTER TABLE [Evaluación Entidad Rips]
ADD [Id Modalidad Atencion] Int NULL

ALTER TABLE [Evaluación Entidad Rips]
ADD [Id Grupo Servicios] Int NULL

ALTER TABLE [Evaluación Entidad Rips]
ADD [Id Servicios] Int NULL

ALTER TABLE [Evaluación Entidad Rips]
ADD [Id Via Ingreso Usuario] Int NULL



-- =============================================
-- Author:		Fernando De Jesus Palacio Suarez
-- Create date: 30-07-2024
-- Description:	Yeison NO SABE HACER ESTO
-- =============================================
CREATE TRIGGER [dbo].[TRI_ingreso_RIPS_Via_Sio]
	ON  [dbo].[Evaluación Entidad Rips]
	AFTER   INSERT 
AS 
BEGIN
	
	Declare @viaIngresoServicioSalud Int
	Declare @modalidadGrupoServicioTecSal Int
	Declare @grupoServicios Int
	Declare @codServicio Int
	Declare @IdRIPS int

	SELECT @IdRIPS =   [Id Evaluación Entidad Rips],
	@viaIngresoServicioSalud = [Id Via Ingreso Usuario] ,
	@modalidadGrupoServicioTecSal = [Id Modalidad Atencion],
	@grupoServicios = [Id Grupo Servicios],
	@codServicio = [Id Servicios]

	FROM inserted;

	if @viaIngresoServicioSalud IS NULL
		BEGIN
			UPDATE  [Evaluación Entidad Rips]
			SET [Id Via Ingreso Usuario] = 1
			WHERE  [Id Evaluación Entidad Rips] = @IdRIPS

		END 
	ELSE
		BEGIN
			PRINT 'NADA'
		END
		if @modalidadGrupoServicioTecSal IS NULL
		BEGIN
			UPDATE  [Evaluación Entidad Rips]
			SET  [Id Modalidad Atencion] = 1
			WHERE  [Id Evaluación Entidad Rips] = @IdRIPS

		END 
	ELSE
		BEGIN
			PRINT 'NADA'
		END
		if @grupoServicios IS NULL
		BEGIN
			UPDATE  [Evaluación Entidad Rips]
			SET [Id Grupo Servicios] = 1
			WHERE  [Id Evaluación Entidad Rips] = @IdRIPS

		END 
	ELSE
		BEGIN
			PRINT 'NADA'
		END
		if @codServicio IS NULL
		BEGIN
			UPDATE  [Evaluación Entidad Rips]
			SET  [Id Servicios] = 99
			WHERE  [Id Evaluación Entidad Rips] = @IdRIPS

		END 
	ELSE
		BEGIN
			PRINT 'NADA'
		END


	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for trigger here

END


-- =============================================
-- Author:		Fernando
-- Create date: 01/08/2024
-- Description:	SE realiza por que el ceeresio al crear una hitoria nueva y no seleccionar una eps y dejar la que aparece por defecto 
--hace que aparezca el nombre de la aseguradora en evaluacion entidad y no el documento 
-- =============================================
Create TRIGGER triger_sol_dc_Aseguradora 
	ON  [Evaluación Entidad] 
	AFTER   INSERT 
AS 
BEGIN
	Declare @idevaluacion int
	Declare @DocumentoAseguradora nvarchar(50)
	Declare @DocumentoAseguradoraENTIDAD nvarchar(50)
	DECLARE @Busqueda NVARCHAR(52);
	--Se  traen datos del insert
	select @idevaluacion = [Id Evaluación Entidad],
	@DocumentoAseguradora = [Documento Aseguradora]
	from inserted
	--Se realiza contatenacion para hacer la busqueda
	SET @Busqueda = '%' + @DocumentoAseguradora + '%';
	--Condicion para evaluar si existe almenos uno que el documentoaseguradira de evaluacio sea practicamente el nombre
	IF EXISTS (SELECT 1 FROM Entidad WHERE [Nombre Completo Entidad] like @Busqueda)
		BEGIN
		--Se consulta cual  el documento de ese nombre de documento aseguradora que se guarno erroneamente
		select @DocumentoAseguradoraENTIDAD = [Documento Entidad] From Entidad Where [Nombre Completo Entidad] like @Busqueda
			UPDATE [Evaluación Entidad]  SET [Documento Aseguradora] = @DocumentoAseguradoraENTIDAD Where   [Id Evaluación Entidad] = @idevaluacion 
		END
		

	SET NOCOUNT ON;

    -- Insert statements for trigger here

END
GO
--Fernando 
--monda para all


-- ESTE SE ACTUALIZA APARTIR DEL 1RO DE OCTUBRE 

-- ACTUALIZAR VISTA QUE CARGA LA LISTA DE FINALIDAD CONSULTA EN LOS AC DEL CEERESIO

ALTER VIEW [dbo].[Cnsta VB Todos - Finalidad Consulta - Orden Alfabético]
AS
SELECT        [Id Finalidad Consulta], [Finalidad Consulta], [Descripción Finalidad Consulta]
FROM            dbo.[Finalidad Consulta]
WHERE        ([Id Finalidad Consulta] <> 1) AND ([Id Estado] = 7)


-- ACTUALIZAR LA TABLA FINALIDAD CONSULTA CON LOS DATOS A LA FECHA 07-03-2024 DEL SISPRO

INSERT INTO [dbo].[Finalidad Consulta] ([Código Finalidad Consulta], [Finalidad Consulta], [Descripción Finalidad Consulta], [Orden Finalidad Consulta], [Id Estado])
VALUES
    ('11', '11', 'VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', 1, 7),
	('12', '12', 'DETECCION TEMPRANA DE ENFERMEDAD GENERAL', 1, 7),
	('13', '13', 'DETECCION TEMPRANA DE ENFERMEDAD LABORAL', 1, 8),
	('14', '14', 'PROTECCION ESPECIFICA', 1, 7),
	('15', '15', 'DIAGNOSTICO', 1, 7),
	('16', '16', 'TRATAMIENTO', 1, 7),
	('17', '17', 'REHABILITACION', 1, 7),
	('18', '18', 'PALIACION', 1, 7),
	('19', '19', 'PLANIFICACION FAMILIAR Y ANTICONCEPCION', 1, 7),
	('20', '20', 'PROMOCION Y APOYO A LA LACTANCIA MATERNA', 1, 7),
	('21', '21', 'ATENCION BASICA DE ORIENTACION FAMILIAR', 1, 7),
	('22', '22', 'ATENCION PARA EL CUIDADO PRECONCEPCIONAL', 1, 7),
	('23', '23', 'ATENCION PARA EL CUIDADO PRENATAL', 1, 7),
	('24', '24', 'INTERRUPCION VOLUNTARIA DEL EMBARAZO', 1, 7),
	('25', '25', 'ATENCION DEL PARTO Y PUERPERIO', 1, 7),
	('26', '26', 'ATENCION PARA EL CUIDADO DEL RECIEN NACIDO', 1, 7),
	('27', '27', 'ATENCION PARA EL SEGUIMIENTO DEL RECIEN NACIDO', 1, 7),
	('28', '28', 'PREPARACION PARA LA MATERNIDAD Y LA PATERNIDAD', 1, 8),
	('29', '29', 'PROMOCION DE ACTIVIDAD FISICA', 1, 8),
	('30', '30', 'PROMOCION DE LA CESACION DEL TABAQUISMO', 1, 8),
	('31', '31', 'PREVENCION DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS', 1, 8),
	('32', '32', 'PROMOCION DE LA ALIMENTACION SALUDABLE', 1, 8),
	('33', '33', 'PROMOCION PARA EL EJERCICIO DE LOS DERECHOS SEXUALES Y DERECHOS REPRODUCTIVOS', 1, 8),
	('34', '34', 'PROMOCION PARA EL DESARROLLO DE HABILIDADES PARA LA VIDA', 1, 8),
	('35', '35', 'PROMOCION PARA LA CONSTRUCCION DE ESTRATEGIAS DE AFRONTAMIENTO FRENTE A SUCESOS VITALES', 1, 8),
	('36', '36', 'PROMOCION DE LA SANA CONVIVENCIA Y EL TEJIDO SOCIAL', 1, 8),
	('38', '38', 'PROMOCION DE UN AMBIENTE SEGURO Y DE CUIDADO Y PROTECCION DEL AMBIENTE', 1, 8),
	('38', '38', 'PROMOCION DEL EMPODERAMIENTO PARA EL EJERCICIO DEL DERECHO A LA SALUD', 1, 8),
	('39', '39', 'PROMOCION PARA LA ADOPCION DE PRACTICAS DE CRIANZA Y CUIDADO PARA LA SALUD', 1, 8),
	('40', '40', 'PROMOCION DE LA CAPACIDAD DE LA AGENCIA Y CUIDADO DE LA SALUD', 1, 8),
	('41', '41', 'DESARROLLO DE HABILIDADES COGNITIVAS', 1, 8),
	('42', '42', 'INTERVENCION COLECTIVA', 1, 8),
	('43', '43', 'MODIFICACION DE LA ESTETICA CORPORAL (FINES ESTETICOS)', 1, 7),
	('44', '44', 'OTRA', 1, 7);

-- ACTUALIZAR EL ESTADO DE LOS FINALIDAD CONSULTA VIEJOS A 8

UPDATE dbo.[Finalidad Consulta]
SET [Id Estado] = 
    CASE

		WHEN [Descripción Finalidad Consulta] = 'Deteccion de enfermedad salud oral' THEN '8'
		WHEN [Descripción Finalidad Consulta] = 'Detección de alteraciones de crecimiento y desarrollo del menor de diez años' THEN '8'
		WHEN [Descripción Finalidad Consulta] = 'Detección de alteración del desarrollo joven' THEN '8'
		WHEN [Descripción Finalidad Consulta] = 'Detección de alteraciones del embarazo' THEN '8'
		WHEN [Descripción Finalidad Consulta] = 'Detección de alteraciones del adulto' THEN '8'
		WHEN [Descripción Finalidad Consulta] = 'Detección de enfermedad profesional' THEN '8'
		WHEN [Descripción Finalidad Consulta] = 'No aplica' THEN '8'

    END;


-- ACTUALIZAR VISTA QUE CARGA LA LISTA DE CAUSA EXTERNA CONSULTA EN LOS AC DEL CEERESIO

ALTER VIEW [dbo].[Cnsta VB Todos - Causa Externa - Orden Alfabético]
AS
SELECT     [Id Causa Externa], [Causa Externa], [Descripción Causa Externa]
FROM         dbo.[Causa Externa]
WHERE        ([Id Causa Externa] <> 1) AND ([Id Estado] = 7)

-- ACTUALIZAR LA TABLA CAUSA EXTERNA CON LOS DATOS A LA FECHA 07-03-2024 DEL SISPRO

INSERT INTO [dbo].[Causa Externa] ([Código Causa Externa], [Causa Externa], [Descripción Causa Externa], [Orden Causa Externa], [Id Estado])
VALUES
	('21', '21', 'Accidente de trabajo', 1, 7),
	('22', '22', 'Accidente en el hogar', 1, 7),
	('23', '23', 'Accidente de tránsito de origen común', 1, 7),
	('24', '24', 'Accidente de tránsito de origen laboral', 1, 7),
	('25', '25', 'Accidente en el entorno educativo', 1, 7),
	('26', '26', 'Otro tipo de accidente', 1, 7),
	('27', '27', 'Evento catastrófico de origen natural', 1, 7),
	('28', '28', 'Lesión por agresión', 1, 7),
	('29', '29', 'Lesión auto infligida', 1, 7),
	('30', '30', 'Sospecha de violencia física', 1, 7),
	('31', '31', 'Sospecha de violencia psicológica', 1, 7),
	('32', '32', 'Sospecha de violencia sexual', 1, 7),
	('33', '33', 'Sospecha de negligencia y abandono', 1, 7),
	('34', '34', 'IVE relacionado con peligro a la Salud o vida de la mujer', 1, 7),
	('35', '35', 'IVE por malformación congénita incompatible con la vida', 1, 7),
	('36', '36', 'IVE por violencia sexual, incesto o por inseminación artificial o transferencia de ovulo fecundado no consentida', 1, 7),
	('37', '37', 'Evento adverso en salud', 1, 7),
	('38', '38', 'Enfermedad general', 1, 7),
	('39', '39', 'Enfermedad laboral', 1, 7),
	('40', '40', 'Promoción y mantenimiento de la salud - intervenciones individuales', 1, 7),
	('41', '41', 'Intervención colectiva', 1, 7),
	('42', '42', 'Atención de población materno perinatal', 1, 7),
	('43', '43', 'Riesgo ambiental', 1, 7),
	('44', '44', 'Otros eventos Catastróficos', 1, 7),
	('45', '45', 'Accidente de mina antipersonal - MAP', 1, 7),
	('46', '46', 'Accidente de Artefacto Explosivo Improvisado - AEI', 1, 7),
	('47', '47', 'Accidente de Munición Sin Explotar - MUSE', 1, 7),
	('48', '48', 'Otra víctima de conflicto armado colombiano', 1, 7);

	
-- INSERTAR FINALIDAD PROCEDIMIENTOS QUE SON LA FINALIDAD DEL PROCEDIMIENTO

INSERT INTO [dbo].[Finalidad del Procedimiento] ([Código Finalidad del Procedimiento], [Finalidad del Procedimiento], [Descripción Finalidad del Procedimiento], [Orden Finalidad del Procedimiento], [Id Estado])
VALUES
    ('11', '11', 'VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', 1, 7),
	('12', '12', 'DETECCION TEMPRANA DE ENFERMEDAD GENERAL', 1, 7),
	('13', '13', 'DETECCION TEMPRANA DE ENFERMEDAD LABORAL', 1, 7),
	('14', '14', 'PROTECCION ESPECIFICA', 1, 7),
	('15', '15', 'DIAGNOSTICO', 1, 7),
	('16', '16', 'TRATAMIENTO', 1, 7),
	('17', '17', 'REHABILITACION', 1, 7),
	('18', '18', 'PALIACION', 1, 7),
	('19', '19', 'PLANIFICACION FAMILIAR Y ANTICONCEPCION', 1, 7),
	('20', '20', 'PROMOCION Y APOYO A LA LACTANCIA MATERNA', 1, 7),
	('21', '21', 'ATENCION BASICA DE ORIENTACION FAMILIAR', 1, 8),
	('22', '22', 'ATENCION PARA EL CUIDADO PRECONCEPCIONAL', 1, 7),
	('23', '23', 'ATENCION PARA EL CUIDADO PRENATAL', 1, 7),
	('24', '24', 'INTERRUPCION VOLUNTARIA DEL EMBARAZO', 1, 7),
	('25', '25', 'ATENCION DEL PARTO Y PUERPERIO', 1, 7),
	('26', '26', 'ATENCION PARA EL CUIDADO DEL RECIEN NACIDO', 1, 7),
	('27', '27', 'ATENCION PARA EL SEGUIMIENTO DEL RECIEN NACIDO', 1, 7),
	('28', '28', 'PREPARACION PARA LA MATERNIDAD Y LA PATERNIDAD', 1, 7),
	('29', '29', 'PROMOCION DE ACTIVIDAD FISICA', 1, 7),
	('30', '30', 'PROMOCION DE LA CESACION DEL TABAQUISMO', 1, 7),
	('31', '31', 'PREVENCION DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS', 1, 7),
	('32', '32', 'PROMOCION DE LA ALIMENTACION SALUDABLE', 1, 7),
	('33', '33', 'PROMOCION PARA EL EJERCICIO DE LOS DERECHOS SEXUALES Y DERECHOS REPRODUCTIVOS', 1, 7),
	('34', '34', 'PROMOCION PARA EL DESARROLLO DE HABILIDADES PARA LA VIDA', 1, 7),
	('35', '35', 'PROMOCION PARA LA CONSTRUCCION DE ESTRATEGIAS DE AFRONTAMIENTO FRENTE A SUCESOS VITALES', 1, 7),
	('36', '36', 'PROMOCION DE LA SANA CONVIVENCIA Y EL TEJIDO SOCIAL', 1, 7),
	('37', '37', 'PROMOCION DE UN AMBIENTE SEGURO Y DE CUIDADO Y PROTECCION DEL AMBIENTE', 1, 7),
	('38', '38', 'PROMOCION DEL EMPODERAMIENTO PARA EL EJERCICIO DEL DERECHO A LA SALUD', 1, 7),
	('39', '39', 'PROMOCION PARA LA ADOPCION DE PRACTICAS DE CRIANZA Y CUIDADO PARA LA SALUD', 1, 7),
	('40', '40', 'PROMOCION DE LA CAPACIDAD DE LA AGENCIA Y CUIDADO DE LA SALUD', 1, 7),
	('41', '41', 'DESARROLLO DE HABILIDADES COGNITIVAS', 1, 7),
	('42', '42', 'INTERVENCION COLECTIVA', 1, 7),
	('43', '43', 'MODIFICACION DE LA ESTETICA CORPORAL (FINES ESTETICOS)', 1, 7),
	('44', '44', 'OTRA', 1, 7);

-- ACTUALIZAR VISTA QUE CARGA LA LISTA DE FINALIDAD DEL PROCEDIMIENTO EN LOS AP DEL CEERESIO

ALTER VIEW [dbo].[Cnsta VB Todos - Finalidad del Procedimiento - Orden Alfabético]
AS
SELECT     [Id Finalidad del Procedimiento], [Finalidad del Procedimiento], [Descripción Finalidad del Procedimiento]
FROM         dbo.[Finalidad del Procedimiento]
WHERE     ([Id Finalidad del Procedimiento] <> 1) AND ([Id Estado] = 7)




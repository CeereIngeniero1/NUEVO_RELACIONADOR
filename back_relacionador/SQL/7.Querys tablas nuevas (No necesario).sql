-- CREAR TABLA FINALIDAD CONSULTA VERSION2
CREATE TABLE [dbo].[RIPS Finalidad Consulta Version2](
    [Id Finalidad Consulta] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Codigo] [nvarchar](50) NULL,
    [Nombre RIPS Finalidad Consulta Version2] [nvarchar](100) NULL,
    [Descripción RIPS Finalidad Consulta Version2] [nvarchar](200) NULL,
    [Orden RIPS Finalidad Consulta Version2] [int] NULL CONSTRAINT [DF_RIPSFinalidadConsultaVersion2_OrdenRIPSFinalidadConsultaVersion2] DEFAULT (1),
	[AC] [nvarchar](10) NULL,
	[AP] [nvarchar](10) NULL,
    [Id Estado] [int] NULL CONSTRAINT [DF_RIPSFinalidadConsultaVersion2_IdEstado] DEFAULT (7)
);

INSERT INTO [dbo].[RIPS Finalidad Consulta Version2] ([Codigo], [Nombre RIPS Finalidad Consulta Version2], [Descripción RIPS Finalidad Consulta Version2], [Orden RIPS Finalidad Consulta Version2], [AC], [AP], [Id Estado])
VALUES
    ('11', 'VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', NULL, 1, 'SI', 'SI', 7),
	('12', 'DETECCION TEMPRANA DE ENFERMEDAD GENERAL', NULL, 1, 'SI', 'SI', 7),
	('13', 'DETECCION TEMPRANA DE ENFERMEDAD LABORAL', NULL, 1, 'SI', 'SI', 7),
	('14', 'PROTECCION ESPECIFICA', NULL, 1, 'NO', 'SI', 7),
	('15', 'DIAGNOSTICO', NULL, 1, 'SI', 'SI', 7),
	('16', 'TRATAMIENTO', NULL, 1, 'SI', 'SI', 7),
	('17', 'REHABILITACION', NULL, 1, 'SI', 'SI', 7),
	('18', 'PALIACION', NULL, 1, 'SI', 'SI', 7),
	('19', 'PLANIFICACION FAMILIAR Y ANTICONCEPCION', NULL, 1, 'SI', 'SI', 7),
	('20', 'PROMOCION Y APOYO A LA LACTANCIA MATERNA', NULL, 1, 'SI', 'SI', 7),
	('21', 'ATENCION BASICA DE ORIENTACION FAMILIAR', NULL, 1, 'SI', 'NO', 7),
	('22', 'ATENCION PARA EL CUIDADO PRECONCEPCIONAL', NULL, 1, 'SI', 'SI', 7),
	('23', 'ATENCION PARA EL CUIDADO PRENATAL', NULL, 1, 'SI', 'SI', 7),
	('24', 'INTERRUPCION VOLUNTARIA DEL EMBARAZO', NULL, 1, 'SI', 'SI', 7),
	('25', 'ATENCION DEL PARTO Y PUERPERIO', NULL, 1, 'SI', 'SI', 7),
	('26', 'ATENCION PARA EL CUIDADO DEL RECIEN NACIDO', NULL, 1, 'NO', 'SI', 7),
	('27', 'ATENCION PARA EL SEGUIMIENTO DEL RECIEN NACIDO', NULL, 1, 'SI', 'SI', 7),
	('28', 'PREPARACION PARA LA MATERNIDAD Y LA PATERNIDAD', NULL, 1, 'NO', 'SI', 7),
	('29', 'PROMOCION DE ACTIVIDAD FISICA', NULL, 1, 'NO', 'SI', 7),
	('30', 'PROMOCION DE LA CESACION DEL TABAQUISMO', NULL, 1, 'NO', 'SI', 7),
	('31', 'PREVENCION DEL CONSUMO DE SUSTANCIAS PSICOACTIVAS', NULL, 1, 'NO', 'SI', 7),
	('32', 'PROMOCION DE LA ALIMENTACION SALUDABLE', NULL, 1, 'NO', 'SI', 7),
	('33', 'PROMOCION PARA EL EJERCICIO DE LOS DERECHOS SEXUALES Y DERECHOS REPRODUCTIVOS', NULL, 1, 'NO', 'SI', 7),
	('34', 'PROMOCION PARA EL DESARROLLO DE HABILIDADES PARA LA VIDA', NULL, 1, 'NO', 'SI', 7),
	('35', 'PROMOCION PARA LA CONSTRUCCION DE ESTRATEGIAS DE AFRONTAMIENTO FRENTE A SUCESOS VITALES', NULL, 1, 'NO', 'SI', 7),
	('36', 'PROMOCION DE LA SANA CONVIVENCIA Y EL TEJIDO SOCIAL', NULL, 1, 'NO', 'SI', 7),
	('37', 'PROMOCION DE UN AMBIENTE SEGURO Y DE CUIDADO Y PROTECCION DEL AMBIENTE', NULL, 1, 'NO', 'SI', 7),
	('38', 'PROMOCION DEL EMPODERAMIENTO PARA EL EJERCICIO DEL DERECHO A LA SALUD', NULL, 1, 'NO', 'SI', 7),
	('39', 'PROMOCION PARA LA ADOPCION DE PRACTICAS DE CRIANZA Y CUIDADO PARA LA SALUD', NULL, 1, 'NO', 'SI', 7),
	('40', 'PROMOCION DE LA CAPACIDAD DE LA AGENCIA Y CUIDADO DE LA SALUD', NULL, 1, 'NO', 'SI', 7),
	('41', 'DESARROLLO DE HABILIDADES COGNITIVAS', NULL, 1, 'NO', 'SI', 7),
	('42', 'INTERVENCION COLECTIVA', NULL, 1, 'NO', 'SI', 7),
	('43', 'MODIFICACION DE LA ESTETICA CORPORAL (FINES ESTETICOS)', NULL, 1, 'SI', 'SI', 7),
	('44', 'OTRA', NULL, 1, 'SI', 'SI', 7);

    -- CREAR TABLA DE CONCEPTO RECAUDO

CREATE TABLE [dbo].[Concepto Recaudo](
    [Id Concepto Recaudo] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Codigo] [nvarchar](50) NULL,
    [Nombre Concepto Recaudo] [nvarchar](100) NULL,
    [Descripción Concepto Recaudo] [nvarchar](200) NULL,
    [Orden Concepto Recaudo] [int] NULL CONSTRAINT [DF_conceptoRecaudo_OrdenconceptoRecaudo] DEFAULT (1),
    [Id Estado] [int] NULL CONSTRAINT [DF_conceptoRecaudo_IdEstado] DEFAULT (7)
);

INSERT INTO [dbo].[Concepto Recaudo] ([Codigo], [Nombre Concepto Recaudo], [Descripción Concepto Recaudo], [Orden Concepto Recaudo], [Id Estado])
VALUES
    ('01', 'VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', NULL, 1, 7),
	('02', 'DETECCION TEMPRANA DE ENFERMEDAD GENERAL', NULL, 1, 7),
	('03', 'DETECCION TEMPRANA DE ENFERMEDAD LABORAL', NULL, 1, 7),
	('04', 'PROTECCION ESPECIFICA', NULL, 1, 7),
	('05', 'DIAGNOSTICO', NULL, 1, 7);

--===================SCRIPT PARA CREAR TABLAS DE LA 2275 EN RIPS UNIÓN AC=================

-- CREAR TABLA RIPS CAUSA EXTERNA VERSION2

CREATE TABLE [dbo].[RIPS Causa Externa Version2](
    [Id RIPS Causa Externa Version2] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Codigo] [nvarchar](50) NULL,
    [Nombre RIPS Causa Externa Version2] [nvarchar](200) NULL,
    [Descripción RIPS Causa Externa Version2] [nvarchar](200) NULL,
    [Orden RIPS Causa Externa Version2] [int] NULL CONSTRAINT [DF_RIPSCausaExternaVersion2_OrdenRIPSCausaExternaVersion2] DEFAULT (1),
    [Id Estado] [int] NULL CONSTRAINT [DF_RIPSCausaExternaVersion2_IdEstado] DEFAULT (7)
);

INSERT INTO [dbo].[RIPS Causa Externa Version2] ([Codigo], [Nombre RIPS Causa Externa Version2], [Descripción RIPS Causa Externa Version2], [Orden RIPS Causa Externa Version2], [Id Estado])
VALUES
	('21', 'Accidente de trabajo', NULL, 1, 7),
	('22', 'Accidente en el hogar', NULL, 1, 7),
	('23', 'Accidente de tránsito de origen común', NULL, 1, 7),
	('24', 'Accidente de tránsito de origen laboral', NULL, 1, 7),
	('25', 'Accidente en el entorno educativo', NULL, 1, 7),
	('26', 'Otro tipo de accidente', NULL, 1, 7),
	('27', 'Evento catastrófico de origen natural', NULL, 1, 7),
	('28', 'Lesión por agresión', NULL, 1, 7),
	('29', 'Lesión auto infligida', NULL, 1, 7),
	('30', 'Sospecha de violencia física', NULL, 1, 7),
	('31', 'Sospecha de violencia psicológica', NULL, 1, 7),
	('32', 'Sospecha de violencia sexual', NULL, 1, 7),
	('33', 'Sospecha de negligencia y abandono', NULL, 1, 7),
	('34', 'IVE relacionado con peligro a la Salud o vida de la mujer', NULL, 1, 7),
	('35', 'IVE por malformación congénita incompatible con la vida', NULL, 1, 7),
	('36', 'IVE por violencia sexual, incesto o por inseminación artificial o transferencia de ovulo fecundado no consentida', NULL, 1, 7),
	('37', 'Evento adverso en salud', NULL, 1, 7),
	('38', 'Enfermedad general', NULL, 1, 7),
	('39', 'Enfermedad laboral', NULL, 1, 7),
	('40', 'Promoción y mantenimiento de la salud - intervenciones individuales', NULL, 1, 7),
	('41', 'Intervención colectiva', NULL, 1, 7),
	('42', 'Atención de población materno perinatal', NULL, 1, 7),
	('43', 'Riesgo ambiental', NULL, 1, 7),
	('44', 'Otros eventos Catastróficos', NULL, 1, 7),
	('45', 'Accidente de mina antipersonal - MAP', NULL, 1, 7),
	('46', 'Accidente de Artefacto Explosivo Improvisado - AEI', NULL, 1, 7),
	('47', 'Accidente de Munición Sin Explotar - MUSE', NULL, 1, 7),
	('48', 'Otra víctima de conflicto armado colombiano', NULL, 1, 7);

-- CREAR TABLA TIPO PAGO MODERADOR

CREATE TABLE [dbo].[Tipo Pago Moderador](
    [Id Tipo Pago Moderador] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Codigo] [nvarchar](50) NULL,
    [Nombre Tipo Pago Moderador] [nvarchar](200) NULL,
    [Descripción Tipo Pago Moderador] [nvarchar](200) NULL,
    [Orden Tipo Pago Moderador] [int] NULL CONSTRAINT [DF_TipoPagoModerador_OrdenTipoPagoModerador] DEFAULT (1),
    [Id Estado] [int] NULL CONSTRAINT [DF_TipoPagoModerador_IdEstado] DEFAULT (7)
);

INSERT INTO [dbo].[Tipo Pago Moderador] ([Codigo], [Nombre Tipo Pago Moderador], [Descripción Tipo Pago Moderador], [Orden Tipo Pago Moderador], [Id Estado])
VALUES
	('01', 'Cuota moderadora', NULL, 1, 7),
	('02', 'Copago', NULL, 1, 7),
	('03', 'Bono o vale de plan voluntario', NULL, 1, 7),
	('04', 'No aplica pago moderador', NULL, 1, 7);

-- CREAR TABLA CUPS QUE TENDRA LOS RIPS DE PROCEDIMIENTO ACTUALIZADOS
CREATE TABLE [dbo].[RIPS CUPS](
	[Id Cups] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[Código Cups] [nvarchar](20) NULL,
	[Nombre Cups] [nvarchar](500) NULL,
	[Uso Código Cups] [nvarchar](20) NULL,
	[Id Estado] [INT] NULL
    
	)

-- CREAR TABLA CUPS QUE TENDRA LOS RIPS DE DIAGNOSTICOS ACTUALIZADOS
CREATE TABLE [dbo].[RIPS CIE](
	[Id Cie] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[Código Cie] [nvarchar](20) NULL,
	[Nombre Cie] [nvarchar](500) NULL,
	[Id Estado] [INT] NULL
	)

-- CREAR TABLA PARA ALMACENAR LAS CREDENCIALES DEL WSDL DE FACTURATECH
CREATE TABLE CredencialesWSDLFacturaTech (
	[Id Credenciales WSDL] [INT] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[Usuario] [NVARCHAR] (100),
	[Contrasena] [NVARCHAR] (100),
	[Documento Empresa] [NVARCHAR] (50),
	[URL SOAP] [NVARCHAR] (200)
)
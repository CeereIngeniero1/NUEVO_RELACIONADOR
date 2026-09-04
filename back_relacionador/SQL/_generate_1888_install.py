#!/usr/bin/env python3
"""Genera scripts 1888: TABLAS, ALTER, UPDATES, DATOS."""
import re
from pathlib import Path

D1888 = Path(__file__).parent / "1888"


def hdr(title, purpose, order, prereqs, sources):
    L = ["/*", "=" * 78, f"  {title}", "=" * 78, f"  {purpose}", "", "  Orden de ejecución:"]
    for i, s in enumerate(order, 1):
        L.append(f"    {i}. {s}")
    L += ["", "  Prerrequisitos:"]
    for p in prereqs:
        L.append(f"    - {p}")
    L += ["", "  Fuentes:"]
    for s in sources:
        L.append(f"    - {s}")
    L += ["=" * 78, "*/", "", "SET NOCOUNT ON;", "GO", ""]
    return "\n".join(L)


def foot(n):
    return f"\nPRINT N'=== {n} — instalación completada ===';\nGO\n"


def wc(p):
    return len(p.read_text(encoding="utf-8").splitlines())


def gen_tablas():
    rdace = (D1888 / "Evaluacion Entidad RDA Consulta Externa - CREATE.sql").read_text(encoding="utf-8")
    # Strip redundant header from rdace, keep from SET ANSI_NULLS
    idx = rdace.find("SET ANSI_NULLS ON")
    rdace_body = rdace[idx:] if idx >= 0 else rdace

    c = hdr(
        "TABLAS RELACIONADOR 1888 — INSTALACIÓN IDEMPOTENTE",
        "Crea tablas Resolución 1888 / RDA sin DROP ni USE AcQuir.",
        ["TABLAS_1888_INSTALL.sql (este)", "ALTER_1888_INSTALL.sql",
         "UPDATES_1888_INSTALL.sql", "DATOS_1888_INSTALL.sql", "VISTAS_1888_INSTALL.sql"],
        ["Base CeereSIO (dbo)", "Opcional: tablas RIPS 2275 si RDACE usa modalidad/grupo/vía"],
        ["1888.sql", "Evaluacion Entidad RDA Consulta Externa - CREATE.sql"],
    )

    c += r"""
/* ============================================================================
   Entidad1888 y catálogos demográficos
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Entidad1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Entidad1888 (
        [Id Entidad1888] INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Entidad1888 PRIMARY KEY,
        [Documento Entidad] NVARCHAR(50) NULL,
        [Id Identidad Genero] INT NULL,
        Talla VARCHAR(10) NULL,
        Peso VARCHAR(10) NULL,
        [Id Etnia] INT NULL,
        [Comunidad Etnica] VARCHAR(50) NULL,
        [Id Discapacidad] INT NULL,
        Alergias VARCHAR(90) NULL,
        [Id Pais Nacionalidad] INT NULL,
        [Id Pais Recidencia] INT NULL,
        [Id Municipio Recidencia] INT NULL,
        Alergeno VARCHAR(200) NULL
    );
    PRINT N'Tabla Entidad1888 creada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Discapacidad' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Discapacidad (
        [Id Discapacidad] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(10) NULL,
        Discapacidad VARCHAR(60) NULL,
        [Descripcion Discapacidad] VARCHAR(60) NULL,
        [Id Estado] INT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Etnia' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Etnia (
        [Id Etnia] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Código Etnia] NVARCHAR(50) NULL,
        Etnia NVARCHAR(200) NULL,
        [Descripción Etnia] NVARCHAR(200) NULL,
        [Orden Etnia] INT NULL,
        [Id Estado] INT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Sexo Identidad Genero' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Sexo Identidad Genero] (
        [Id Sexo Identidad Genero] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(10) NULL,
        [Identidad Genero] VARCHAR(30) NULL,
        [Descripcion Identidad Genero] VARCHAR(60) NULL,
        [Id Estado] INT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'País1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.País1888 (
        [Id Pais1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(20) NULL,
        Nombre VARCHAR(50) NULL,
        Estado INT NOT NULL CONSTRAINT DF_Pais1888_Estado DEFAULT (7)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Ciudad1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Ciudad1888 (
        [Id Ciudad1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo VARCHAR(20) NULL,
        Nombre VARCHAR(50) NULL,
        Estado INT NOT NULL CONSTRAINT DF_Ciudad1888_Estado DEFAULT (7)
    );
END
GO

/* Regimen y EPS SGSSS */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Regimen' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.Regimen (
        [Id Regimen] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        [Id Estado] INT NOT NULL,
        CONSTRAINT UQ_Regimen_Nombre UNIQUE (Nombre)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Entidades sgsss 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Entidades sgsss 1888] (
        [Id sgsss] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo NVARCHAR(20) NOT NULL,
        Nombre NVARCHAR(500) NOT NULL,
        [Id Estado] INT NOT NULL,
        [Id Regimen] INT NOT NULL,
        CONSTRAINT FK_EntidadesSGSSS_Regimen
            FOREIGN KEY ([Id Regimen]) REFERENCES dbo.Regimen ([Id Regimen]),
        CONSTRAINT UQ_EntidadesSGSSS_Codigo UNIQUE (Codigo)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Entidades Prepagadas 1888' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Entidades Prepagadas 1888] (
        [Id Entidades Prepagadas 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Codigo NVARCHAR(20) NULL,
        Nombre NVARCHAR(500) NULL
    );
END
GO

/* Antecedentes plantilla */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Antecedentes Salud 1888' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Antecedentes Salud 1888] (
        [ID Antecedente Salud 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Entidad] NVARCHAR(50) NULL,
        Descripcion VARCHAR(500) NULL,
        [Id Estado] INT NULL
    );
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Antecedentes Familiares 1888' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Antecedentes Familiares 1888] (
        [ID Antecedente Familiar 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Entidad] NVARCHAR(50) NULL,
        Parentesco NVARCHAR(100) NULL,
        Descripcion VARCHAR(500) NULL,
        [Id Estado] INT NULL
    );
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Antecedentes Farmacologicos 1888' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Antecedentes Farmacologicos 1888] (
        [ID Antecedente Farmacologico 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Entidad] NVARCHAR(50) NULL,
        Descripcion VARCHAR(500) NULL,
        [Id Estado] INT NULL
    );
GO

/* Evaluacion Entidad RDA Paciente */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Evaluacion Entidad RDA' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[Evaluacion Entidad RDA] (
        [Id Evaluacion Entidad RDA] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Documento Entidad] VARCHAR(50) NULL,
        [Fecha RDA] DATETIME NOT NULL,
        [Id Tipo Documento] INT NULL,
        [Primer Apellido Entidad] NVARCHAR(100) NULL,
        [Segundo Apellido Entidad] NVARCHAR(100) NULL,
        [Primer Nombre Entidad] NVARCHAR(100) NULL,
        [Segundo Nombre Entidad] NVARCHAR(50) NULL,
        [Fecha Nacimiento] DATETIME NULL,
        Edad FLOAT NULL,
        [Id Unidad de Medida Edad] INT NULL,
        [Id Sexo Biologico] INT NULL,
        [Id Identidad Genero] INT NULL,
        [Id Pais Nacionalidad] INT NULL,
        Talla VARCHAR(10) NOT NULL CONSTRAINT DF_EERDA_Talla DEFAULT (N'0'),
        Peso VARCHAR(10) NOT NULL CONSTRAINT DF_EERDA_Peso DEFAULT (N'0'),
        [Id Pais Recidencia] INT NULL,
        [Id Municipio Recidencia] INT NULL,
        [Id Zona Residencia] INT NULL,
        Dirección NVARCHAR(255) NULL,
        [Id Etnia] INT NULL,
        [Comunidad Etnica] VARCHAR(50) NOT NULL CONSTRAINT DF_EERDA_Comunidad DEFAULT (N''),
        [Id Discapacidad] INT NULL,
        [Teléfono Celular] NVARCHAR(50) NULL,
        Alergeno VARCHAR(200) NULL,
        [Codigo Prestador] NVARCHAR(50) NULL,
        [Codigo Admin Plan Beneficios] NVARCHAR(50) NULL,
        [Nombre Admin Plan Beneficios] NVARCHAR(200) NULL,
        [Fecha Hora Inicio Atencion] DATETIME NULL,
        [Fecha Hora Fin Atencion] DATETIME NULL,
        [Tipo Doc Profesional] VARCHAR(10) NULL,
        [Num Doc Profesional] NVARCHAR(50) NULL,
        [Diagnostico Ingreso CIE11 Codigo] NVARCHAR(50) NULL,
        [Diagnostico Ingreso CIE11 Termino] NVARCHAR(200) NULL,
        [Tipo Alergia] VARCHAR(5) NULL,
        [Id Modalidad Atencion] INT NULL,
        [Id Grupo Servicios] INT NULL,
        [NIT Prestador IPS] NVARCHAR(20) NULL,
        [Nombre Prestador IPS] NVARCHAR(200) NULL,
        [Enviado] INT NOT NULL CONSTRAINT DF_EERDA_Enviado DEFAULT (0),
        [Enviado pruebas] INT NOT NULL CONSTRAINT DF_EERDA_EnviadoPruebas DEFAULT (0)
    );
END
GO

/* Hijos RDA Paciente */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Evaluacion Entidad RDA Antecedentes Salud' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Evaluacion Entidad RDA Antecedentes Salud] (
        [ID Antecedente Salud] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Id Evaluacion Entidad RDA] INT NOT NULL,
        [Documento Entidad] NVARCHAR(50) NOT NULL,
        Descripcion VARCHAR(500) NOT NULL,
        [Id Estado] INT NOT NULL
    );
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Evaluacion Entidad RDA Antecedentes Familiares' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Evaluacion Entidad RDA Antecedentes Familiares] (
        [ID Antecedente Familiar] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Id Evaluacion Entidad RDA] INT NOT NULL,
        [Documento Entidad] NVARCHAR(50) NOT NULL,
        Parentesco NVARCHAR(100) NULL,
        Descripcion VARCHAR(500) NOT NULL,
        [CIE11 Codigo] NVARCHAR(50) NULL,
        [CIE11 Termino] NVARCHAR(300) NULL,
        [Id Estado] INT NOT NULL
    );
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Evaluacion Entidad RDA Antecedentes Farmacologicos' AND schema_id = SCHEMA_ID(N'dbo'))
    CREATE TABLE dbo.[Evaluacion Entidad RDA Antecedentes Farmacologicos] (
        [ID Antecedente Farmacologico] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Id Evaluacion Entidad RDA] INT NOT NULL,
        [Documento Entidad] NVARCHAR(50) NOT NULL,
        Descripcion VARCHAR(500) NOT NULL,
        [Id Estado] INT NOT NULL
    );
GO

/* Catálogos CodeSystem 1888 */
"""
    catalogs = [
        ("Factor De Riesgo 1888", "Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_FactorRiesgo1888 DEFAULT (7)"),
        ("Tipo de tecnología en salud 1888", "Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_TipoTecSalud1888 DEFAULT (7)"),
        ("Entorno de atencion 1888", "Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_EntornoAtencion1888 DEFAULT (7)"),
        ("Tipo de alergia 1888", "Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_TipoAlergia1888 DEFAULT (7)"),
        ("Parentesco familiar RDA 1888", "Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_ParentescoFamiliar1888 DEFAULT (7)"),
        ("Tipo diagnostico principal 1888", "Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_TipoDxPrincipal1888 DEFAULT (7)"),
        ("Unidad medida dosis 1888", "Codigo VARCHAR(50), Descripcion VARCHAR(200), Nombre VARCHAR(100) NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_UMDosis1888 DEFAULT (7)"),
        ("Otra tecnologia categoria 1888", "Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_OtraTecCat1888 DEFAULT (7)"),
        ("Alcance incapacidad 1888", "Codigo VARCHAR(50) NOT NULL, Descripcion VARCHAR(200) NOT NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_AlcanceIncap1888 DEFAULT (7)"),
        ("Egreso y Remision 1888", "Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_EgresoRemision1888 DEFAULT (7)"),
        ("Ocupacion 1888", "Codigo VARCHAR(20), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_Ocupacion1888 DEFAULT (7)"),
        ("Via administracion medicamento 1888", "Codigo VARCHAR(50), Descripcion VARCHAR(200), Nombre VARCHAR(150) NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_ViaAdmMed1888 DEFAULT (7)"),
        ("Unidad tiempo duracion 1888", "Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_UTDuracion1888 DEFAULT (7)"),
        ("Unidad tiempo frecuencia 1888", "Codigo VARCHAR(50), Descripcion VARCHAR(200), [Id Estado] INT NOT NULL CONSTRAINT DF_UTFrecuencia1888 DEFAULT (7)"),
        ("Finalidad tecnologia salud 1888", "Codigo VARCHAR(50), Descripcion VARCHAR(200), Nombre VARCHAR(250) NULL, [Id Estado] INT NOT NULL CONSTRAINT DF_FinalidadTecSalud1888 DEFAULT (7)"),
        ("Medicamento DCI 1888", "Codigo VARCHAR(50), Descripcion VARCHAR(500), [Id Estado] INT NOT NULL CONSTRAINT DF_MedicamentoDCI1888 DEFAULT (7)"),
        ("CUPS_Codigos", "Codigo NVARCHAR(50) NOT NULL, Nombre NVARCHAR(500) NOT NULL, DefinicionUrl NVARCHAR(1000) NULL, IdEstado INT NOT NULL CONSTRAINT DF_CUPS_Codigos_IdEstado DEFAULT (7), FechaCarga DATETIME2(0) NOT NULL CONSTRAINT DF_CUPS_Codigos_FechaCarga DEFAULT (SYSDATETIME())"),
        ("CIE11_Codigos", "Codigo NVARCHAR(50) NOT NULL, Nombre NVARCHAR(500) NOT NULL, DefinicionUrl NVARCHAR(1000) NULL, IdEstado INT NOT NULL CONSTRAINT DF_CIE11_Codigos_IdEstado DEFAULT (7), FechaCarga DATETIME2(0) NOT NULL CONSTRAINT DF_CIE11_Codigos_FechaCarga DEFAULT (SYSDATETIME())"),
    ]
    for name, cols in catalogs:
        pk = f"Id_{name.replace(' ', '_').replace('ó','o')}"
        id_col = f"[Id {name}]" if "1888" in name else f"Id{name.replace(' ', '')}"
        if name == "CUPS_Codigos":
            id_col = "IdCUPS"
        elif name == "CIE11_Codigos":
            id_col = "IdCIE11"
        c += f"""
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'{name}' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.[{name}] (
        {id_col} INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        {cols}
    );
END
GO
"""

    c += "\n/* ============================================================================\n"
    c += "   RDA Consulta Externa y tablas hijas (Evaluacion Entidad RDA Consulta Externa - CREATE.sql)\n"
    c += "   ============================================================================ */\n\n"
    c += rdace_body
    c += foot("TABLAS_1888_INSTALL")
    p = D1888 / "TABLAS_1888_INSTALL.sql"
    p.write_text(c, encoding="utf-8")
    return wc(p)


def gen_alter():
    c = hdr(
        "ALTER RELACIONADOR 1888 — INSTALACIÓN IDEMPOTENTE",
        "Columnas adicionales, ALTER COLUMN y constraints idempotentes.",
        ["TABLAS_1888_INSTALL.sql", "ALTER_1888_INSTALL.sql (este)",
         "UPDATES_1888_INSTALL.sql", "DATOS_1888_INSTALL.sql", "VISTAS_1888_INSTALL.sql"],
        ["TABLAS_1888_INSTALL.sql ejecutado"],
        ["1888.sql", "alter-evaluacion-entidad-rdace-rips-context.sql",
         "alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql",
         "ALTER_RDACE_NotasAdicionalesPdf.sql", "ALTER_RDACE_ContenidoDocumentoPdf.sql",
         "1888 update a registros malos.sql"],
    )

    # Embed idempotent alter files
    for fn in [
        "alter-evaluacion-entidad-rdace-rips-context.sql",
        "alter-evaluacion-entidad-rda-rda-paciente-fhir-1888.sql",
        "ALTER_RDACE_NotasAdicionalesPdf.sql",
        "ALTER_RDACE_ContenidoDocumentoPdf.sql",
    ]:
        fp = D1888 / fn
        if fp.exists():
            c += f"\n/* --- {fn} --- */\n"
            c += fp.read_text(encoding="utf-8")
            c += "\nGO\n"

    c += r"""
/* --- Entidad1888 columnas adicionales (1888.sql) --- */
IF COL_LENGTH(N'dbo.Entidad1888', N'Id Pais Nacionalidad') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Pais Nacionalidad] INT NULL;
GO
IF COL_LENGTH(N'dbo.Entidad1888', N'Id Pais Recidencia') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Pais Recidencia] INT NULL;
GO
IF COL_LENGTH(N'dbo.Entidad1888', N'Id Municipio Recidencia') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD [Id Municipio Recidencia] INT NULL;
GO
IF COL_LENGTH(N'dbo.Entidad1888', N'Alergeno') IS NULL
    ALTER TABLE dbo.Entidad1888 ADD Alergeno VARCHAR(200) NULL;
GO

/* Ocupación — ampliar columna */
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Ocupación') AND name = N'Ocupación')
BEGIN
    ALTER TABLE dbo.Ocupación ALTER COLUMN Ocupación NVARCHAR(200) NULL;
END
GO

/* Egreso y Remision — ampliar descripción */
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Egreso y Remision 1888]') AND name = N'Descripcion')
BEGIN
    ALTER TABLE dbo.[Egreso y Remision 1888] ALTER COLUMN Descripcion VARCHAR(200) NULL;
END
GO

/* Unidad medida dosis — columna Nombre */
IF COL_LENGTH(N'dbo.[Unidad medida dosis 1888]', N'Nombre') IS NULL
    ALTER TABLE dbo.[Unidad medida dosis 1888] ADD Nombre VARCHAR(100) NULL;
GO

/* Via administracion — columna Nombre */
IF COL_LENGTH(N'dbo.[Via administracion medicamento 1888]', N'Nombre') IS NULL
    ALTER TABLE dbo.[Via administracion medicamento 1888] ADD Nombre VARCHAR(150) NULL;
GO

/* Finalidad tecnologia salud — columna Nombre */
IF COL_LENGTH(N'dbo.[Finalidad tecnologia salud 1888]', N'Nombre') IS NULL
    ALTER TABLE dbo.[Finalidad tecnologia salud 1888] ADD Nombre VARCHAR(250) NULL;
GO

/* Evaluacion Entidad RDA — columnas envío IHCE */
IF COL_LENGTH(N'dbo.[Evaluacion Entidad RDA]', N'Enviado') IS NULL
    ALTER TABLE dbo.[Evaluacion Entidad RDA] ADD [Enviado] INT NOT NULL
        CONSTRAINT DF_EERDA_Enviado_Alt DEFAULT (0);
GO
IF COL_LENGTH(N'dbo.[Evaluacion Entidad RDA]', N'Enviado pruebas') IS NULL
    ALTER TABLE dbo.[Evaluacion Entidad RDA] ADD [Enviado pruebas] INT NOT NULL
        CONSTRAINT DF_EERDA_EnviadoPruebas_Alt DEFAULT (0);
GO
"""
    c += foot("ALTER_1888_INSTALL")
    p = D1888 / "ALTER_1888_INSTALL.sql"
    p.write_text(c, encoding="utf-8")
    return wc(p)


def gen_updates():
    c = hdr(
        "UPDATES RELACIONADOR 1888 — INSTALACIÓN IDEMPOTENTE",
        "Correcciones de catálogos y datos legacy. Cada bloque documenta su propósito.",
        ["TABLAS", "ALTER", "UPDATES (este)", "DATOS", "VISTAS"],
        ["TABLAS y ALTER ejecutados"],
        ["1888.sql", "1888 update a registros malos.sql", "1888_update_ocupacion_ciuo88ac.sql",
         "1888_replace_ocupacion_ciuo88ac.sql", "1888_ocupacion_sin_asignar.sql",
         "1888_update_rips_cups_nombre_desde_cups_codigos.sql"],
    )

    c += r"""
/* Zona residencia → códigos RIPS (U/R) */
UPDATE dbo.[Zona Residencia]
SET [Código Zona Residencia] = N'01', [Zona Residencia] = N'U'
WHERE [Descripción Zona Residencia] = N'Urbana'
  AND ([Código Zona Residencia] IS NULL OR [Código Zona Residencia] <> N'01');
GO
UPDATE dbo.[Zona Residencia]
SET [Código Zona Residencia] = N'02', [Zona Residencia] = N'R'
WHERE [Descripción Zona Residencia] = N'Rural'
  AND ([Código Zona Residencia] IS NULL OR [Código Zona Residencia] <> N'02');
GO

/* Etnia legacy → inactivar antes de insertar catálogo 1888 */
UPDATE dbo.Etnia SET [Id Estado] = 8
WHERE [Id Estado] = 7 AND [Código Etnia] NOT IN (N'1',N'2',N'3',N'4',N'5',N'6',N'99');
GO

/* Tipo de Documento — normalizar códigos IHCE (1888 update a registros malos.sql) */
UPDATE dbo.[Tipo de Documento]
SET [Código Tipo de Documento] = CASE [Tipo de Documento]
    WHEN N'CC' THEN N'CC' WHEN N'CE' THEN N'CE' WHEN N'PA' THEN N'PA'
    WHEN N'RC' THEN N'RC' WHEN N'TI' THEN N'TI' WHEN N'AS' THEN N'AS'
    WHEN N'MS' THEN N'MS' WHEN N'UN' THEN N'UN' WHEN N'NI' THEN N'NI'
    WHEN N'NH' THEN N'NH' ELSE [Código Tipo de Documento] END
WHERE [Tipo de Documento] IS NOT NULL;
GO

/* Catálogos 1888 — descripciones corregidas */
UPDATE dbo.[Tipo de alergia 1888]
SET Descripcion = N'Sustancia que entran en contacto con la piel'
WHERE Codigo = N'04' AND Descripcion <> N'Sustancia que entran en contacto con la piel';
GO

UPDATE dbo.[Entorno de atencion 1888]
SET Descripcion = CASE Codigo
    WHEN N'01' THEN N'Hogar' WHEN N'02' THEN N'Comunitario' WHEN N'03' THEN N'Escolar'
    WHEN N'04' THEN N'Laboral' WHEN N'05' THEN N'Institucional' ELSE Descripcion END
WHERE Codigo IN (N'01',N'02',N'03',N'04',N'05');
GO

UPDATE dbo.[Alcance incapacidad 1888]
SET Descripcion = CASE Codigo WHEN N'01' THEN N'Nueva' WHEN N'02' THEN N'Prórroga' ELSE Descripcion END
WHERE Codigo IN (N'01', N'02');
GO
UPDATE dbo.[Alcance incapacidad 1888] SET [Id Estado] = 8
WHERE Codigo NOT IN (N'01', N'02') AND [Id Estado] <> 8;
GO

UPDATE dbo.[Factor De Riesgo 1888]
SET Descripcion = CASE Codigo
    WHEN N'01' THEN N'Químicos' WHEN N'02' THEN N'Físicos' WHEN N'03' THEN N'Biomecánicos'
    WHEN N'04' THEN N'Psicosociales' WHEN N'05' THEN N'Biológicos' WHEN N'06' THEN N'Otro'
    ELSE Descripcion END
WHERE Codigo IN (N'01',N'02',N'03',N'04',N'05',N'06');
GO

UPDATE dbo.[Egreso y Remision 1888]
SET Descripcion = CASE Codigo
    WHEN N'01' THEN N'PACIENTE CON DESTINO A SU DOMICILIO'
    WHEN N'02' THEN N'PACIENTE MUERTO'
    WHEN N'03' THEN N'PACIENTE DERIVADO A OTRO SERVICIO'
    WHEN N'04' THEN N'REFERIDO A OTRA INSTITUCION'
    WHEN N'05' THEN N'CONTRAREFERIDO A OTRA INSTITUCION'
    WHEN N'06' THEN N'DERIVADO O REFERIDO A HOSPITALIZACION DOMICILIARIA'
    WHEN N'07' THEN N'DERIVADO A SERVICIO SOCIAL'
    WHEN N'08' THEN N'PACIENTE CONTINUA EN EL SERVICIO (CORTE FACTURACION)'
    ELSE Descripcion END
WHERE Codigo IN (N'01',N'02',N'03',N'04',N'05',N'06',N'07',N'08');
GO

UPDATE dbo.[Tipo diagnostico principal 1888]
SET Descripcion = CASE Codigo
    WHEN N'01' THEN N'Impresión diagnóstica'
    WHEN N'02' THEN N'Confirmado nuevo'
    WHEN N'03' THEN N'Confirmado repetido'
    ELSE Descripcion END
WHERE Codigo IN (N'01',N'02',N'03');
GO

/* Ocupación CeereSIO — marcar legacy inactivo antes de CIUO88AC */
UPDATE dbo.Ocupación SET [Id Estado] = 8
WHERE [Id Estado] = 7 AND [Código Ocupación] IS NOT NULL;
GO
"""
    c += foot("UPDATES_1888_INSTALL")
    p = D1888 / "UPDATES_1888_INSTALL.sql"
    p.write_text(c, encoding="utf-8")
    return wc(p)


def wrap_inserts_from_file(path, table, cod_col="Codigo"):
    out = []
    if not path.exists():
        return ""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            s = line.strip()
            if not s.upper().startswith("INSERT"):
                continue
            m = re.search(r"VALUES\s*\([^)]*N?'([^']+)'", s, re.I)
            if not m:
                m = re.search(r"VALUES\s*\(\s*'([^']+)'", s, re.I)
            if m:
                cod = m.group(1)
                out.append(
                    f"IF NOT EXISTS (SELECT 1 FROM dbo.[{table}] WHERE {cod_col} = N'{cod}')\n"
                    f"    {s.rstrip(';')};\nGO\n"
                )
    return "".join(out)


def gen_datos():
    c = hdr(
        "DATOS RELACIONADOR 1888 — INSTALACIÓN IDEMPOTENTE",
        "Inserts de catálogos y población Entidad1888. Scripts MERGE grandes se referencian al final.",
        ["TABLAS", "ALTER", "UPDATES", "DATOS (este)", "VISTAS"],
        ["Scripts anteriores ejecutados"],
        ["1888.sql", "1888 Insertar.sql", "insert_paises.sql", "1888_insert_ocupacion_tabla.sql",
         "1888_create_cups_tabla_con_datos.sql", "1888_create_cie11_tabla_con_datos.sql",
         "1888_insert_medicamentos_dci.sql", "1888_insert_ciudad_municipios.sql"],
    )

    # Sexo identidad genero
    sig = [
        ('01','Masculino'),('02','Femenino'),('03','Transgénero'),
        ('04','Neutro'),('05','No lo declara'),('06','Sin asignar'),
    ]
    c += "\n/* Sexo Identidad Genero */\n"
    for cod, nom in sig:
        c += f"IF NOT EXISTS (SELECT 1 FROM dbo.[Sexo Identidad Genero] WHERE Codigo = N'{cod}')\n"
        c += f"    INSERT INTO dbo.[Sexo Identidad Genero] (Codigo,[Identidad Genero],[Descripcion Identidad Genero],[Id Estado])\n"
        c += f"    VALUES (N'{cod}', N'{nom}', N'{nom}', 7);\nGO\n"

    # Etnia
    etnias = [
        ('1','Indigena'),('2','ROM (Gitano)'),
        ('3','Raizal (Archipielago San Andrés y Providencia)'),
        ('4','Palenquero de San Basilio'),
        ('5','Negro(a) o mulato(a) o afrocolombiano(a) o afrodescendiente'),
        ('6','Otras etnias'),('99','Ninguna de las anteriores'),
    ]
    c += "\n/* Etnia */\n"
    for cod, nom in etnias:
        c += f"IF NOT EXISTS (SELECT 1 FROM dbo.Etnia WHERE [Código Etnia] = N'{cod}')\n"
        c += f"    INSERT INTO dbo.Etnia ([Código Etnia],Etnia,[Descripción Etnia],[Orden Etnia],[Id Estado])\n"
        c += f"    VALUES (N'{cod}', N'{nom}', N'{nom}', 1, 7);\nGO\n"

    # Discapacidad
    disc = [
        ('01','Discapacidad física'),('02','Discapacidad visual'),('03','Discapacidad auditiva'),
        ('04','Discapacidad intelectual'),('05','Discapacidad sicosocial (mental)'),
        ('06','Sordoceguera'),('07','Discapacidad múltiple'),('08','Sin discapacidad'),('09','Sin Asignar'),
    ]
    c += "\n/* Discapacidad */\n"
    for cod, nom in disc:
        c += f"IF NOT EXISTS (SELECT 1 FROM dbo.Discapacidad WHERE Codigo = N'{cod}')\n"
        c += f"    INSERT INTO dbo.Discapacidad (Codigo,Discapacidad,[Descripcion Discapacidad],[Id Estado])\n"
        c += f"    VALUES (N'{cod}', N'{nom}', N'{nom}', 7);\nGO\n"

    c += r"""
/* País Colombia default */
IF NOT EXISTS (SELECT 1 FROM dbo.País1888 WHERE Codigo = N'170')
    INSERT INTO dbo.País1888 (Codigo, Nombre, Estado) VALUES (N'170', N'COLOMBIA', 7);
GO

/* Regimen */
IF NOT EXISTS (SELECT 1 FROM dbo.Regimen WHERE Nombre = N'Contributivo')
    INSERT INTO dbo.Regimen (Nombre, [Id Estado]) VALUES (N'Contributivo', 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Regimen WHERE Nombre = N'Subsidiado')
    INSERT INTO dbo.Regimen (Nombre, [Id Estado]) VALUES (N'Subsidiado', 1);
GO

/* Entidad1888 — poblar desde Entidad (1888 Insertar.sql) */
INSERT INTO dbo.Entidad1888 (
    [Documento Entidad],[Id Identidad Genero],Talla,Peso,[Id Etnia],
    [Comunidad Etnica],[Id Discapacidad],Alergias)
SELECT e.[Documento Entidad], 6, N'0', N'0', 15, N'No', 9, N'No'
FROM dbo.Entidad e
LEFT JOIN dbo.Entidad1888 e1888
    ON LTRIM(RTRIM(e1888.[Documento Entidad])) = LTRIM(RTRIM(e.[Documento Entidad]))
WHERE e1888.[Documento Entidad] IS NULL;
GO
"""

    # Factor riesgo, tipo tec salud, etc from simple inserts
    c += wrap_inserts_from_file(D1888 / "1888.sql", "Factor De Riesgo 1888")
    # Parse multi-value inserts from 1888.sql for specific tables - use file insert_paises
    c += "\n/* Países ISO (insert_paises.sql) */\n"
    c += wrap_inserts_from_file(D1888 / "insert_paises.sql", "País1888", "Codigo")

    c += "\n/* Ocupación CIUO88AC (1888_insert_ocupacion_tabla.sql) */\n"
    c += wrap_inserts_from_file(D1888 / "1888_insert_ocupacion_tabla.sql", "Ocupación", "[Código Ocupación]")

    c += r"""
/* ============================================================================
   SCRIPTS MERGE AUTÓNOMOS (ya idempotentes — ejecutar si faltan datos masivos)
   ============================================================================
   Después de este script, en el mismo servidor ejecutar si aplica:

   1. 1888_create_cups_tabla_con_datos.sql   → dbo.CUPS_Codigos (~10k filas)
   2. 1888_create_cie11_tabla_con_datos.sql  → dbo.CIE11_Codigos
   3. 1888_insert_medicamentos_dci.sql       → dbo.[Medicamento DCI 1888]
   4. 1888_insert_ciudad_municipios.sql      → dbo.Ciudad1888

   Esos archivos usan MERGE / IF NOT EXISTS y son seguros de re-ejecutar.
   ============================================================================ */
"""
    c += foot("DATOS_1888_INSTALL")
    p = D1888 / "DATOS_1888_INSTALL.sql"
    p.write_text(c, encoding="utf-8")
    return wc(p)


if __name__ == "__main__":
    for name, fn in [
        ("TABLAS_1888_INSTALL.sql", gen_tablas),
        ("ALTER_1888_INSTALL.sql", gen_alter),
        ("UPDATES_1888_INSTALL.sql", gen_updates),
        ("DATOS_1888_INSTALL.sql", gen_datos),
    ]:
        print(f"{name}: {fn()} lines")

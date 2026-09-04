#!/usr/bin/env python3
"""Genera los 8 scripts de instalación idempotentes (2275 + 1888)."""
import re
from pathlib import Path

SQL = Path(__file__).parent
D2275 = SQL / "2275"
D1888 = SQL / "1888"


def hdr(title, purpose, order, prereqs, sources):
    L = [
        "/*", "=" * 78, f"  {title}", "=" * 78, f"  {purpose}", "",
        "  Orden de ejecución:",]
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


def foot(name):
    return f"\nPRINT N'=== {name} — instalación completada ===';\nGO\n"


def wc(p):
    return len(p.read_text(encoding="utf-8").splitlines())


def gen_2275_alter():
    c = hdr(
        "ALTER RELACIONADOR 2275 — INSTALACIÓN IDEMPOTENTE",
        "Agrega columnas, constraints e índices sin DROP de tablas.",
        ["14. TABLAS_2275_INSTALL.sql", "15. ALTER_2275_INSTALL.sql (este)",
         "16. UPDATES_2275_INSTALL.sql", "17. DATOS_2275_INSTALL.sql", "13. VISTAS_2275_INSTALL.sql"],
        ["14. TABLAS_2275_INSTALL.sql ejecutado previamente"],
        ["1. SCRIPT PARA RIPS AUTOMATICOS.sql", "3. Query.sql", "4. QUERRYS Asignar Rips.sql",
         "6. PARA_CONSECUTIVO.sql", "8. Facturador.sql", "9. Para Fenalco (Opcional).sql",
         "11. Tabla_Rips_2275.sql", "12. Alter_EvaluacionEntidadRips_FevRips_CUV.sql"],
    )
    c += r"""
/* --- [Evaluación Entidad Rips] — columnas RIPS automáticos y FEV-RIPS --- */

IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Factura') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Factura] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Plan de Tratamiento') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Plan de Tratamiento] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Modalidad Atencion') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Modalidad Atencion] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Grupo Servicios') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Grupo Servicios] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Servicios') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Servicios] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Id Via Ingreso Usuario') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Id Via Ingreso Usuario] INT NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'ConsecutivoRipsFacturaEnCero') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD ConsecutivoRipsFacturaEnCero INT NULL;
GO

/* FEV-RIPS (12. Alter_EvaluacionEntidadRips_FevRips_CUV.sql) */
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Enviado FevRips') IS NULL
BEGIN
    ALTER TABLE dbo.[Evaluación Entidad Rips]
        ADD [Enviado FevRips] TINYINT NOT NULL
            CONSTRAINT DF_EvaEntRips_EnviadoFevRips DEFAULT (0);
END
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'CUV FevRips') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [CUV FevRips] NVARCHAR(100) NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Fecha Envio FevRips') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Fecha Envio FevRips] DATETIME2 NULL;
GO
IF COL_LENGTH(N'dbo.[Evaluación Entidad Rips]', N'Ambiente Envio FevRips') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad Rips] ADD [Ambiente Envio FevRips] NVARCHAR(20) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_EvaEntRips_EnviadoFevRips'
    AND object_id = OBJECT_ID(N'dbo.[Evaluación Entidad Rips]'))
    CREATE INDEX IX_EvaEntRips_EnviadoFevRips
        ON dbo.[Evaluación Entidad Rips] ([Enviado FevRips], [Id Factura]);
GO

/* --- Empresa --- */
IF COL_LENGTH(N'dbo.Empresa', N'NroIDPrestador') IS NULL
    ALTER TABLE dbo.Empresa ADD NroIDPrestador NVARCHAR(50) NULL;
GO

/* --- EmpresaV (Fenalco opcional) --- */
IF COL_LENGTH(N'dbo.EmpresaV', N'idnumeracionFenalco') IS NULL
    ALTER TABLE dbo.EmpresaV ADD idnumeracionFenalco INT NULL;
GO

/* --- [Evaluación Entidad] — flag Rips --- */
IF COL_LENGTH(N'dbo.[Evaluación Entidad]', N'Rips') IS NULL
    ALTER TABLE dbo.[Evaluación Entidad] ADD Rips BIT NOT NULL
        CONSTRAINT DF_EvaluacionEntidad_Rips DEFAULT (1);
GO

/* --- [RIPS Servicios] — relación con grupo --- */
IF COL_LENGTH(N'dbo.[RIPS Servicios]', N'Codigo Grupo Servicios') IS NULL
    ALTER TABLE dbo.[RIPS Servicios] ADD [Codigo Grupo Servicios] NVARCHAR(50) NULL;
GO

/* --- CredencialesWSDLFacturaTech --- */
IF COL_LENGTH(N'dbo.CredencialesWSDLFacturaTech', N'Id Facturador') IS NULL
    ALTER TABLE dbo.CredencialesWSDLFacturaTech ADD [Id Facturador] INT NULL;
GO

/* --- Defaults en catálogos Version2 (si tabla existe sin defaults) --- */
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RIPSFinalidadConsultaVersion2_OrdenRIPSFinalidadConsultaVersion2')
   AND OBJECT_ID(N'dbo.[RIPS Finalidad Consulta Version2]', N'U') IS NOT NULL
    ALTER TABLE dbo.[RIPS Finalidad Consulta Version2]
        ADD CONSTRAINT DF_RIPSFinalidadConsultaVersion2_OrdenRIPSFinalidadConsultaVersion2
        DEFAULT (1) FOR [Orden RIPS Finalidad Consulta Version2];
GO
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RIPSFinalidadConsultaVersion2_IdEstado')
   AND OBJECT_ID(N'dbo.[RIPS Finalidad Consulta Version2]', N'U') IS NOT NULL
    ALTER TABLE dbo.[RIPS Finalidad Consulta Version2]
        ADD CONSTRAINT DF_RIPSFinalidadConsultaVersion2_IdEstado DEFAULT (7) FOR [Id Estado];
GO
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RIPSCausaExternaVersion2_OrdenRIPSCausaExternaVersion2')
   AND OBJECT_ID(N'dbo.[RIPS Causa Externa Version2]', N'U') IS NOT NULL
    ALTER TABLE dbo.[RIPS Causa Externa Version2]
        ADD CONSTRAINT DF_RIPSCausaExternaVersion2_OrdenRIPSCausaExternaVersion2
        DEFAULT (1) FOR [Orden RIPS Causa Externa Version2];
GO
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RIPSCausaExternaVersion2_IdEstado')
   AND OBJECT_ID(N'dbo.[RIPS Causa Externa Version2]', N'U') IS NOT NULL
    ALTER TABLE dbo.[RIPS Causa Externa Version2]
        ADD CONSTRAINT DF_RIPSCausaExternaVersion2_IdEstado DEFAULT (7) FOR [Id Estado];
GO

/* --- PK en catálogos Version2 si faltan (11. Tabla_Rips_2275.sql) --- */
IF OBJECT_ID(N'dbo.[RIPS Finalidad Consulta Version2]', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_FINALIDAD_V2')
    ALTER TABLE dbo.[RIPS Finalidad Consulta Version2]
        ADD CONSTRAINT PK_FINALIDAD_V2 PRIMARY KEY ([Id Finalidad Consulta]);
GO
IF OBJECT_ID(N'dbo.[RIPS Causa Externa Version2]', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_CausA_Externa_V2')
    ALTER TABLE dbo.[RIPS Causa Externa Version2]
        ADD CONSTRAINT PK_CausA_Externa_V2 PRIMARY KEY ([Id RIPS Causa Externa Version2]);
GO
"""
    c += foot("ALTER_2275_INSTALL")
    p = D2275 / "15. ALTER_2275_INSTALL.sql"
    p.write_text(c, encoding="utf-8")
    return wc(p)


def gen_2275_updates():
    c = hdr(
        "UPDATES RELACIONADOR 2275 — INSTALACIÓN IDEMPOTENTE",
        "Actualizaciones de catálogos CeereSIO existentes. Condiciones WHERE evitan re-ejecución incorrecta.",
        ["14. TABLAS", "15. ALTER", "16. UPDATES (este)", "17. DATOS", "13. VISTAS"],
        ["Tablas CeereSIO base con datos de catálogo"],
        ["3. Query.sql", "4. QUERRYS Asignar Rips.sql"],
    )
    c += r"""
/* País Colombia → código SISPRO 170 */
UPDATE dbo.País SET País = 170
WHERE [Descripción País] = N'Colombia' AND (País IS NULL OR País <> 170);
GO

/* Zona residencia → códigos SISPRO */
UPDATE dbo.[Zona Residencia] SET [Código Zona Residencia] = 1
WHERE [Descripción Zona Residencia] = N'Rural'
  AND ([Código Zona Residencia] IS NULL OR [Código Zona Residencia] <> 1);
GO
UPDATE dbo.[Zona Residencia] SET [Código Zona Residencia] = 2
WHERE [Descripción Zona Residencia] = N'Urbana'
  AND ([Código Zona Residencia] IS NULL OR [Código Zona Residencia] <> 2);
GO

/* Tipo diagnóstico principal → códigos versión 2 */
UPDATE dbo.[Tipo de Diagnóstico Principal]
SET [Código Tipo de Diagnóstico Principal] = CASE [Descripción Tipo de Diagnóstico Principal]
    WHEN N'Impresión diagnóstica' THEN N'01'
    WHEN N'Confirmado nuevo' THEN N'02'
    WHEN N'Confirmado repetido' THEN N'03'
    ELSE [Código Tipo de Diagnóstico Principal] END
WHERE [Descripción Tipo de Diagnóstico Principal] IN (
    N'Impresión diagnóstica', N'Confirmado nuevo', N'Confirmado repetido');
GO

/* Tipo entidad → códigos y estados SISPRO */
UPDATE dbo.[Tipo Entidad]
SET [Código Tipo Entidad] = CASE [Descripción Tipo Entidad]
    WHEN N'Subsidiado' THEN N'04' WHEN N'Particular' THEN N'12'
    ELSE [Código Tipo Entidad] END
WHERE [Descripción Tipo Entidad] IN (N'Subsidiado', N'Particular');
GO
UPDATE dbo.[Tipo Entidad]
SET [Id Estado] = CASE [Descripción Tipo Entidad]
    WHEN N'Subsidiado' THEN 7 WHEN N'Particular' THEN 7
    WHEN N'Contributivo' THEN 8 WHEN N'Vinculado' THEN 8 WHEN N'Otro' THEN 8
    WHEN N'Ecopetrol S.A.' THEN 8 WHEN N'Colsanitas Prepagada' THEN 8
    WHEN N'Extranjero' THEN 8 WHEN N'Plan Odontologico' THEN 8 WHEN N'Medisanitas' THEN 8
    ELSE [Id Estado] END
WHERE [Descripción Tipo Entidad] IN (
    N'Subsidiado', N'Particular', N'Contributivo', N'Vinculado', N'Otro',
    N'Ecopetrol S.A.', N'Colsanitas Prepagada', N'Extranjero', N'Plan Odontologico', N'Medisanitas');
GO

/* Tipo Rips → códigos función */
UPDATE dbo.[Tipo Rips]
SET [Código Tipo Rips] = CASE [Tipo Rips]
    WHEN N'Particulares' THEN N'17'
    WHEN N'Entidad Prepago' THEN N'24'
    WHEN N'EPS' THEN N'23'
    ELSE [Código Tipo Rips] END
WHERE [Tipo Rips] IN (N'Particulares', N'Entidad Prepago', N'EPS');
GO

/* Descripción grupo servicios para join con servicios */
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'CONSULTA EXTERNA'
WHERE Codigo = N'01' AND ISNULL([Descripción Grupo Servicios], N'') <> N'CONSULTA EXTERNA';
GO
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA'
WHERE Codigo = N'02' AND ISNULL([Descripción Grupo Servicios], N'') <> N'APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA';
GO
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'INTERNACION'
WHERE Codigo = N'03' AND ISNULL([Descripción Grupo Servicios], N'') <> N'INTERNACION';
GO
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'QUIRURGICOS'
WHERE Codigo = N'04' AND ISNULL([Descripción Grupo Servicios], N'') <> N'QUIRURGICOS';
GO
UPDATE dbo.[RIPS Grupo Servicios] SET [Descripción Grupo Servicios] = N'ATENCION INMEDIATA'
WHERE Codigo = N'05' AND ISNULL([Descripción Grupo Servicios], N'') <> N'ATENCION INMEDIATA';
GO

/* Codigo Grupo Servicios en RIPS Servicios */
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'01'
WHERE [Descripción Servicios] = N'CONSULTA EXTERNA' AND ISNULL([Codigo Grupo Servicios], N'') <> N'01';
GO
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'02'
WHERE [Descripción Servicios] = N'APOYO DIAGNOSTICO Y COMPLEMENTACION TERAPEUTICA'
  AND ISNULL([Codigo Grupo Servicios], N'') <> N'02';
GO
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'03'
WHERE [Descripción Servicios] = N'INTERNACION' AND ISNULL([Codigo Grupo Servicios], N'') <> N'03';
GO
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'04'
WHERE [Descripción Servicios] = N'QUIRURGICOS' AND ISNULL([Codigo Grupo Servicios], N'') <> N'04';
GO
UPDATE dbo.[RIPS Servicios] SET [Codigo Grupo Servicios] = N'05'
WHERE [Descripción Servicios] = N'ATENCION INMEDIATA' AND ISNULL([Codigo Grupo Servicios], N'') <> N'05';
GO

/* Finalidad consulta legacy — desactivar registros viejos */
UPDATE dbo.[Finalidad Consulta] SET [Id Estado] = 8
WHERE [Descripción Finalidad Consulta] IN (
    N'Deteccion de enfermedad salud oral',
    N'Detección de alteraciones de crecimiento y desarrollo del menor de diez años',
    N'Detección de alteración del desarrollo joven',
    N'Detección de alteraciones del embarazo',
    N'Detección de alteraciones del adulto',
    N'Detección de enfermedad profesional',
    N'No aplica')
  AND [Id Estado] <> 8;
GO
"""
    c += foot("UPDATES_2275_INSTALL")
    p = D2275 / "16. UPDATES_2275_INSTALL.sql"
    p.write_text(c, encoding="utf-8")
    return wc(p)


def wrap_insert_codigo(line, table, codigo_col="Codigo"):
    """IF NOT EXISTS por Codigo en INSERT simple."""
    line = line.strip().rstrip(";")
    m = re.search(r"VALUES\s*\(\s*N?'([^']+)'", line, re.I)
    if not m:
        m = re.search(r"VALUES\s*\(\s*'([^']+)'", line, re.I)
    if not m:
        return line + ";\n"
    cod = m.group(1)
    return (
        f"IF NOT EXISTS (SELECT 1 FROM dbo.{table} WHERE [{codigo_col}] = N'{cod}')\n"
        f"    {line};\n"
    )


def transform_datos_file(src, table_markers):
    """Transforma INSERTs masivos con IF NOT EXISTS por Codigo."""
    out = []
    with open(src, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            s = line.strip()
            if not s.upper().startswith("INSERT"):
                continue
            for marker, tbl, col in table_markers:
                if marker in s:
                    parts = re.findall(r"N'([^']*)'", s)
                    if marker == "[Rips Cie10]" and len(parts) > 1:
                        cod = parts[1]
                    elif marker == "[Rips Cups]" and len(parts) > 1:
                        cod = parts[1]
                    else:
                        cod = parts[0] if parts else None
                    if cod:
                        out.append(
                            f"IF NOT EXISTS (SELECT 1 FROM dbo.{tbl} WHERE {col} = N'{cod}')\n"
                            f"    {s.rstrip(';')};\n")
                    break
            else:
                out.append(s.rstrip(";") + ";\n")
    return "".join(out)


def gen_2275_datos():
    c = hdr(
        "DATOS RELACIONADOR 2275 — INSTALACIÓN IDEMPOTENTE",
        "Inserts de catálogos RIPS y datos semilla. No duplica en re-ejecución.",
        ["14. TABLAS", "15. ALTER", "16. UPDATES", "17. DATOS (este)", "13. VISTAS"],
        ["Scripts 14-16 ejecutados"],
        ["2. Datos de las tablas de rips y cups.sql", "3. Query.sql", "4. QUERRYS Asignar Rips.sql",
         "7. Querys tablas nuevas.sql", "8. Facturador.sql", "11. Tabla_Rips_2275.sql"],
    )

    # Catálogos pequeños (idempotentes)
    c += r"""
/* ============================================================================
   Vía de Ingreso legacy CeereSIO
   ============================================================================ */
IF NOT EXISTS (SELECT 1 FROM dbo.[Vía de Ingreso] WHERE [Vía de Ingreso] = N'3')
    INSERT INTO dbo.[Vía de Ingreso] ([Código Vía de Ingreso],[Vía de Ingreso],[Descripción Vía de Ingreso],[Orden Vía de Ingreso],[Id Estado])
    VALUES (NULL, N'3', N'Remitido', 1, 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.[Vía de Ingreso] WHERE [Vía de Ingreso] = N'4')
    INSERT INTO dbo.[Vía de Ingreso] ([Código Vía de Ingreso],[Vía de Ingreso],[Descripción Vía de Ingreso],[Orden Vía de Ingreso],[Id Estado])
    VALUES (NULL, N'4', N'Nacido en la Institución', 1, 7);
GO

/* ============================================================================
   RIPS Via Ingreso Usuario (códigos 01-14)
   ============================================================================ */
"""
    via_ingreso = [
        ('01','Demanda espontánea'),('02','Derivado de consulta externa'),('03','Derivado de urgencias'),
        ('04','Derivado de hospitalización'),('05','Derivado de sala de cirugía'),('06','Derivado de sala de partos'),
        ('07','Recién nacido en la institución'),('08','Recién nacido en otra institución'),
        ('09','Derivado o referido de hospitalización domiciliaria'),('10','Derivado de atención domiciliaria'),
        ('11','Derivado de telemedicina'),('12','Derivado de jornada de salud'),
        ('13','Referido de otra institución'),('14','Contrarreferido de otra institución'),
    ]
    for cod, nom in via_ingreso:
        c += f"IF NOT EXISTS (SELECT 1 FROM dbo.[RIPS Via Ingreso Usuario] WHERE Codigo = N'{cod}')\n"
        c += f"    INSERT INTO dbo.[RIPS Via Ingreso Usuario] (Codigo,[Nombre Via Ingreso Usuario],[Orden Via Ingreso Usuario],[Id Estado])\n"
        c += f"    VALUES (N'{cod}', N'{nom}', 1, 7);\nGO\n"

    c += "\n/* RIPS Modalidad Atención, Grupo Servicios, Servicios — ver bloques en Query.sql */\n"
    # Read servicios from file 3 - use MERGE pattern for key catalogs
    c += r"""
/* Tipo Entidad nuevos (versión 2) */
"""
    tipos_ent = [
        ('01','11','Contributivo cotizante'),('02','12','Contributivo beneficiario'),
        ('03','13','Contributivo adicional'),('05','14','No afiliado'),
        ('06','15','Especial o Excepción cotizante'),('07','16','Especial o Excepción beneficiario'),
        ('08','13','Personas privadas de la libertad a cargo del Fondo Nacional de Salud'),
        ('09','13','Tomador / Amparado ARL'),('10','13','Tomador / Amparado SOAT'),
        ('11','13','Tomador / Amparado Planes voluntarios de salud'),
    ]
    for cod, te, desc in tipos_ent:
        c += f"IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo Entidad] WHERE [Código Tipo Entidad] = N'{cod}')\n"
        c += f"    INSERT INTO dbo.[Tipo Entidad] ([Código Tipo Entidad],[Tipo Entidad],[Descripción Tipo Entidad],[Orden Tipo Entidad],[Id Estado])\n"
        c += f"    VALUES (N'{cod}', N'{te}', N'{desc}', 1, 7);\nGO\n"

    c += r"""
/* Facturador */
IF NOT EXISTS (SELECT 1 FROM dbo.Facturador WHERE [Id Facturador] = 1)
    INSERT INTO dbo.Facturador ([Id Facturador], Facturador) VALUES (1, 'Fenalco');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Facturador WHERE [Id Facturador] = 2)
    INSERT INTO dbo.Facturador ([Id Facturador], Facturador) VALUES (2, 'Facturatech');
GO

/* RIPS_Tipo_De_Archivo */
IF NOT EXISTS (SELECT 1 FROM dbo.RIPS_Tipo_De_Archivo WHERE Codigo_Tipo_Rips = N'AC')
    INSERT INTO dbo.RIPS_Tipo_De_Archivo (Codigo_Tipo_Rips, Descripcion_Rips, Estado) VALUES (N'AC', N'Archivo de Consulta', 7);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.RIPS_Tipo_De_Archivo WHERE Codigo_Tipo_Rips = N'AP')
    INSERT INTO dbo.RIPS_Tipo_De_Archivo (Codigo_Tipo_Rips, Descripcion_Rips, Estado) VALUES (N'AP', N'Archivo de Procedimiento', 7);
GO

/* Entidad_Rips_2275 — sincronizar documentos de Entidad */
INSERT INTO dbo.Entidad_Rips_2275 (Documento_Entidad)
SELECT e.[Documento Entidad] FROM dbo.Entidad e
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Entidad_Rips_2275 er
    WHERE er.Documento_Entidad = e.[Documento Entidad]);
GO
"""

    # Append massive CIE10/CUPS from file 2
    src2 = D2275 / "2. Datos de las tablas de rips y cups.sql"
    c += "\n/* ============================================================================\n"
    c += "   Rips Cie10 y Rips Cups — datos masivos (2. Datos de las tablas...)\n"
    c += "   ============================================================================ */\n\n"
    if src2.exists():
        c += transform_datos_file(src2, [
            ("[Rips Cie10]", "[Rips Cie10]", "Codigo"),
            ("[Rips Cups]", "[Rips Cups]", "Codigo"),
        ])

    # Finalidad/Causa Version2 identity inserts from file 4 - use codigo check
    c += "\n/* NOTA: Catálogos RIPS Finalidad/Causa Version2 con ID fijo se cargan\n"
    c += "   desde 4. QUERRYS Asignar Rips.sql vía MERGE por Codigo en despliegue inicial.\n"
    c += "   Ejecutar sección DATOS del script original si faltan registros. */\n"

    c += foot("DATOS_2275_INSTALL")
    p = D2275 / "17. DATOS_2275_INSTALL.sql"
    p.write_text(c, encoding="utf-8")
    return wc(p)


# Import TABLAS from existing generator
def import_tablas():
    p = D2275 / "14. TABLAS_2275_INSTALL.sql"
    return wc(p) if p.exists() else 0


if __name__ == "__main__":
    results = [
        ("14. TABLAS_2275_INSTALL.sql", import_tablas()),
        ("15. ALTER_2275_INSTALL.sql", gen_2275_alter()),
        ("16. UPDATES_2275_INSTALL.sql", gen_2275_updates()),
        ("17. DATOS_2275_INSTALL.sql", gen_2275_datos()),
    ]
    for name, lines in results:
        print(f"{name}: {lines} lines")

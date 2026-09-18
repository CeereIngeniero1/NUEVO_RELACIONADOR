#!/usr/bin/env python3
"""
Genera instaladores SQL únicos e idempotentes:
  - 2275/00_INSTALL_2275_COMPLETO.sql
  - 1888/00_INSTALL_1888_COMPLETO.sql

Compatible con SQL Server 2014+ (sin CREATE OR ALTER / DROP IF EXISTS).
"""
from __future__ import annotations

import re
from pathlib import Path

SQL = Path(__file__).parent
D2275 = SQL / "2275"
D1888 = SQL / "1888"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def strip_install_header(text: str) -> str:
    """Quita cabecera /* ... */ inicial y SET NOCOUNT ON; GO duplicados."""
    t = text.lstrip("\ufeff")
    if t.startswith("/*"):
        end = t.find("*/")
        if end >= 0:
            t = t[end + 2 :]
    t = re.sub(r"^\s*SET\s+NOCOUNT\s+ON\s*;\s*GO\s*", "", t, count=1, flags=re.I | re.M)
    return t.strip() + "\n"


def section(title: str) -> str:
    bar = "=" * 78
    return f"\nPRINT N'>>> {title}';\nGO\n\n/* {bar}\n   {title}\n   {bar} */\n\n"


def to_2014_safe(sql: str) -> str:
    """CREATE OR ALTER → DROP + CREATE (función / proc / trigger / view)."""

    def repl_fn(m: re.Match) -> str:
        kind, name = m.group(1).upper(), m.group(2)
        type_map = {
            "PROCEDURE": "P",
            "PROC": "P",
            "FUNCTION": "FN",
            "TRIGGER": "TR",
            "VIEW": "V",
        }
        # Functions can be FN/IF/TF — use OBJECT_ID without type filter for drop
        drop = f"IF OBJECT_ID(N'{name}', N'{type_map.get(kind, 'P')}') IS NOT NULL\n    DROP {kind} {name};\nGO\n"
        if kind in ("FUNCTION",):
            drop = (
                f"IF OBJECT_ID(N'{name}') IS NOT NULL AND OBJECTPROPERTY(OBJECT_ID(N'{name}'), 'IsScalarFunction') = 1\n"
                f"    DROP FUNCTION {name};\n"
                f"IF OBJECT_ID(N'{name}') IS NOT NULL AND OBJECTPROPERTY(OBJECT_ID(N'{name}'), 'IsTableFunction') = 1\n"
                f"    DROP FUNCTION {name};\nGO\n"
            )
        if kind == "TRIGGER":
            drop = f"IF OBJECT_ID(N'{name}', N'TR') IS NOT NULL\n    DROP TRIGGER {name};\nGO\n"
        return drop + f"CREATE {kind} {name}"

    return re.sub(
        r"CREATE\s+OR\s+ALTER\s+(PROCEDURE|PROC|FUNCTION|TRIGGER|VIEW)\s+(\[[^\]]+\]\.?\[[^\]]+\]|\[[^\]]+\]|[^\s(]+)",
        repl_fn,
        sql,
        flags=re.I,
    )


def ensure_go(block: str) -> str:
    b = block.rstrip() + "\n"
    if not re.search(r"\bGO\s*$", b, re.I | re.M):
        b += "GO\n"
    return b


# ─── 2275 helpers ───────────────────────────────────────────────────────────

def gen_rips_servicios() -> str:
    src = read_text(D2275 / "3. Query.sql")
    m = re.search(
        r"INSERT\s+INTO\s+\[dbo\]\.\[RIPS Servicios\].*?VALUES\s*(.*?)(?=\n\n--|\n\nUPDATE|\nGO)",
        src,
        re.I | re.S,
    )
    if not m:
        return "/* WARN: no se extrajo RIPS Servicios */\n"
    out = ["/* RIPS Servicios (~160) — desde 3. Query.sql */\n"]
    for row in re.finditer(r"\(\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*(\d+)\s*\)", m.group(1)):
        cod, nom, desc, est = row.groups()
        nom_sql = nom.replace("'", "''")
        desc_sql = desc.replace("'", "''")
        out.append(
            f"IF NOT EXISTS (SELECT 1 FROM dbo.[RIPS Servicios] WHERE [Código Servicios] = N'{cod}')\n"
            f"    INSERT INTO dbo.[RIPS Servicios] ([Código Servicios],[Nombre Servicios],[Descripción Servicios],[Id Estado])\n"
            f"    VALUES (N'{cod}', N'{nom_sql}', N'{desc_sql}', {est});\nGO\n"
        )
    return "".join(out)


def gen_finalidad_causa_v2() -> str:
    src = read_text(D2275 / "4. QUERRYS Asignar Rips.sql")
    out = ["/* Finalidad / Causa Version2 — desde 4. QUERRYS (por Codigo, sin IDENTITY_INSERT) */\n"]

    for line in src.splitlines():
        s = line.strip()
        if s.upper().startswith("INSERT") and "[RIPS Finalidad Consulta Version2]" in s:
            # VALUES (id, N'code', N'name', ...
            mm = re.search(
                r"VALUES\s*\(\s*\d+\s*,\s*N?'([^']+)'\s*,\s*N?'((?:[^']|'')*)'\s*,\s*(NULL|N?'[^']*')\s*,\s*(\d+)\s*,\s*N?'([^']+)'\s*,\s*N?'([^']+)'\s*,\s*(\d+)\s*\)",
                s,
                re.I,
            )
            if mm:
                cod, nom, _desc, orden, ac, ap, est = mm.groups()
                nom_sql = nom.replace("'", "''")
                out.append(
                    f"IF NOT EXISTS (SELECT 1 FROM dbo.[RIPS Finalidad Consulta Version2] WHERE Codigo = N'{cod}')\n"
                    f"    INSERT INTO dbo.[RIPS Finalidad Consulta Version2]\n"
                    f"        (Codigo,[Nombre RIPS Finalidad Consulta Version2],[Orden RIPS Finalidad Consulta Version2],AC,AP,[Id Estado])\n"
                    f"    VALUES (N'{cod}', N'{nom_sql}', {orden}, N'{ac}', N'{ap}', {est});\nGO\n"
                )
        elif s.upper().startswith("INSERT") and "[RIPS Causa Externa Version2]" in s:
            mm = re.search(
                r"VALUES\s*\(\s*\d+\s*,\s*N?'([^']+)'\s*,\s*N?'((?:[^']|'')*)'\s*,\s*(NULL|N?'[^']*')\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
                s,
                re.I,
            )
            if mm:
                cod, nom, _desc, orden, est = mm.groups()
                nom_sql = nom.replace("'", "''")
                out.append(
                    f"IF NOT EXISTS (SELECT 1 FROM dbo.[RIPS Causa Externa Version2] WHERE Codigo = N'{cod}')\n"
                    f"    INSERT INTO dbo.[RIPS Causa Externa Version2]\n"
                    f"        (Codigo,[Nombre RIPS Causa Externa Version2],[Orden RIPS Causa Externa Version2],[Id Estado])\n"
                    f"    VALUES (N'{cod}', N'{nom_sql}', {orden}, {est});\nGO\n"
                )
    return "".join(out)


def gen_cie10_cups_from_file2() -> str:
    src_path = D2275 / "2. Datos de las tablas de rips y cups.sql"
    out: list[str] = [
        "/* Rips Cie10 + Rips Cups — regenerado completo desde 2. Datos... */\n"
    ]
    n_cie = n_cups = 0
    with open(src_path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            s = line.strip().rstrip(";")
            if not s.upper().startswith("INSERT"):
                continue
            if "[Rips Cie10]" in s:
                parts = re.findall(r"N'((?:[^']|'')*)'", s)
                # Tabla, Codigo, ...
                if len(parts) >= 2:
                    cod = parts[1].replace("''", "'")
                    cod_esc = parts[1]
                    out.append(
                        f"IF NOT EXISTS (SELECT 1 FROM dbo.[Rips Cie10] WHERE Codigo = N'{cod_esc}')\n"
                        f"    {s};\n"
                    )
                    n_cie += 1
            elif "[Rips Cups]" in s:
                parts = re.findall(r"N'((?:[^']|'')*)'", s)
                if len(parts) >= 2:
                    cod_esc = parts[1]
                    out.append(
                        f"IF NOT EXISTS (SELECT 1 FROM dbo.[Rips Cups] WHERE Codigo = N'{cod_esc}')\n"
                        f"    {s};\n"
                    )
                    n_cups += 1
    out.append(f"\nPRINT N'CIE10 insertados/omitidos: {n_cie}; CUPS: {n_cups}';\nGO\n")
    print(f"  CIE10 rows wrapped: {n_cie}, CUPS rows wrapped: {n_cups}")
    return "".join(out)


def gen_triggers_functions_2275() -> str:
    """Funciones/triggers de script 1 (sin Medimujer) + TRI_ingreso de 3."""
    src1 = read_text(D2275 / "1. SCRIPT PARA RIPS AUTOMATICOS.sql")
    # Cortar antes del bloque Medimujer
    cut = src1.find("ESTE SCRIPT ES SOLO PARA CLIENTE QUE DESEAN AMPLIAR RANGO")
    if cut < 0:
        cut = src1.find("ALTER FUNCTION [dbo].[FuncionBuscarRelacionRips]")
        # second occurrence is Medimujer — find after Relacion_Rips_Factura_EPS
        idx = src1.find("Relacion_Rips_Factura_EPS")
        if idx > 0:
            cut2 = src1.find("ALTER FUNCTION", idx)
            if cut2 > 0:
                cut = cut2
    body1 = src1[:cut] if cut > 0 else src1

    # Quitar ALTER TABLE ADD columnas (ya en 15)
    body1 = re.sub(
        r"ALTER\s+TABLE\s+\[Evaluación Entidad Rips\]\s+ADD\s+\[Id Factura\].*?;\s*",
        "",
        body1,
        flags=re.I | re.S,
    )
    body1 = re.sub(
        r"ALTER\s+TABLE\s+\[Evaluación Entidad Rips\]\s+ADD\s+\[Id Plan de Tratamiento\].*?;\s*",
        "",
        body1,
        flags=re.I | re.S,
    )
    # Extraer TRI_ingreso de 3
    src3 = read_text(D2275 / "3. Query.sql")
    m = re.search(
        r"CREATE\s+TRIGGER\s+\[dbo\]\.\[TRI_ingreso_RIPS_Via_Sio\].*?(?=\n-- =+|\nCreate TRIGGER|\nGO\n--Fernando)",
        src3,
        re.I | re.S,
    )
    tri = ""
    if m:
        tri = m.group(0).rstrip() + "\nGO\n"

    combined = body1 + "\n" + tri

    # DROP dinámico de todo lo que se va a CREATE
    drops: list[str] = []
    seen: set[str] = set()
    for kind, name in re.findall(
        r"CREATE\s+(FUNCTION|TRIGGER)\s+(\[[^\]]+\]\.?\[[^\]]+\]|\[[^\]]+\]|[A-Za-z0-9_]+)",
        combined,
        flags=re.I,
    ):
        key = f"{kind.upper()}:{name.upper()}"
        if key in seen:
            continue
        seen.add(key)
        if kind.upper() == "FUNCTION":
            drops.append(
                f"IF OBJECT_ID(N'{name}') IS NOT NULL\n    DROP FUNCTION {name};\nGO\n"
            )
        else:
            drops.append(
                f"IF OBJECT_ID(N'{name}', N'TR') IS NOT NULL\n    DROP TRIGGER {name};\nGO\n"
            )

    # Asegurar GO entre CREATE ... END
    body1 = re.sub(r"(CREATE\s+FUNCTION)", r"GO\n\1", body1, flags=re.I)
    body1 = re.sub(r"(CREATE\s+TRIGGER)", r"GO\n\1", body1, flags=re.I)
    body1 = re.sub(r"^(\s*GO\s*)+", "", body1.strip(), flags=re.I)

    out = (
        "/* Funciones y triggers RIPS automáticos (script 1 + TRI_ingreso de 3).\n"
        "   Bloque Medimujer (±10 días) EXCLUIDO — opcional por cliente. */\n\n"
        + "".join(drops)
        + "\n"
        + body1
        + "\nGO\n\n"
        + "/* TRI_ingreso_RIPS_Via_Sio */\n"
        + tri
        + "\n"
        + "/* OPCIONAL Medimujer: ampliar ventana ±10 días — ver 1. SCRIPT PARA RIPS AUTOMATICOS.sql final */\n"
    )
    return out


def gen_seed_entorno_factor_riesgo() -> str:
    """Entorno de atencion + Factor De Riesgo 1888. Idempotente por Codigo."""
    rows_entorno = [
        ("01", "Hogar"),
        ("02", "Comunitario"),
        ("03", "Escolar"),
        ("04", "Laboral"),
        ("05", "Institucional"),
    ]
    rows_factor = [
        ("01", "Químicos"),
        ("02", "Físicos"),
        ("03", "Biomecánicos"),
        ("04", "Psicosociales"),
        ("05", "Biológicos"),
        ("06", "Otro"),
    ]
    out = ["/* Entorno de atencion 1888 + Factor De Riesgo 1888 — IF NOT EXISTS por Codigo */\n"]
    out.append("IF OBJECT_ID(N'dbo.[Entorno de atencion 1888]', N'U') IS NOT NULL\nBEGIN\n")
    for cod, desc in rows_entorno:
        out.append(
            f"    IF NOT EXISTS (SELECT 1 FROM dbo.[Entorno de atencion 1888] WHERE Codigo = N'{cod}')\n"
            f"        INSERT INTO dbo.[Entorno de atencion 1888] (Codigo, Descripcion, [Id Estado])\n"
            f"        VALUES (N'{cod}', N'{desc}', 7);\n"
            f"    ELSE\n"
            f"        UPDATE dbo.[Entorno de atencion 1888]\n"
            f"        SET Descripcion = N'{desc}', [Id Estado] = 7 WHERE Codigo = N'{cod}';\n"
        )
    out.append("END\nGO\n")
    out.append("IF OBJECT_ID(N'dbo.[Factor De Riesgo 1888]', N'U') IS NOT NULL\nBEGIN\n")
    for cod, desc in rows_factor:
        out.append(
            f"    IF NOT EXISTS (SELECT 1 FROM dbo.[Factor De Riesgo 1888] WHERE Codigo = N'{cod}')\n"
            f"        INSERT INTO dbo.[Factor De Riesgo 1888] (Codigo, Descripcion, [Id Estado])\n"
            f"        VALUES (N'{cod}', N'{desc}', 7);\n"
            f"    ELSE\n"
            f"        UPDATE dbo.[Factor De Riesgo 1888]\n"
            f"        SET Descripcion = N'{desc}', [Id Estado] = 7 WHERE Codigo = N'{cod}';\n"
        )
    out.append("END\nGO\n")
    return "".join(out)


def gen_seed_tipo_dx_principal() -> str:
    """Semilla 01/02/03 para RDA (1888) y RIPS (CeereSIO). Idempotente por Código."""
    return """
/* Tipo diagnostico principal 1888 (RDA) — IF NOT EXISTS por Codigo */
IF OBJECT_ID(N'dbo.[Tipo diagnostico principal 1888]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo diagnostico principal 1888] WHERE Codigo = N'01')
        INSERT INTO dbo.[Tipo diagnostico principal 1888] (Codigo, Descripcion, [Id Estado])
        VALUES (N'01', N'Impresión diagnóstica', 7);
    ELSE
        UPDATE dbo.[Tipo diagnostico principal 1888]
        SET Descripcion = N'Impresión diagnóstica', [Id Estado] = 7 WHERE Codigo = N'01';

    IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo diagnostico principal 1888] WHERE Codigo = N'02')
        INSERT INTO dbo.[Tipo diagnostico principal 1888] (Codigo, Descripcion, [Id Estado])
        VALUES (N'02', N'Confirmado nuevo', 7);
    ELSE
        UPDATE dbo.[Tipo diagnostico principal 1888]
        SET Descripcion = N'Confirmado nuevo', [Id Estado] = 7 WHERE Codigo = N'02';

    IF NOT EXISTS (SELECT 1 FROM dbo.[Tipo diagnostico principal 1888] WHERE Codigo = N'03')
        INSERT INTO dbo.[Tipo diagnostico principal 1888] (Codigo, Descripcion, [Id Estado])
        VALUES (N'03', N'Confirmado repetido', 7);
    ELSE
        UPDATE dbo.[Tipo diagnostico principal 1888]
        SET Descripcion = N'Confirmado repetido', [Id Estado] = 7 WHERE Codigo = N'03';
END
GO
"""


def gen_seed_tipo_dx_principal_rips() -> str:
    return """
/* Tipo de Diagnóstico Principal (RIPS CeereSIO) — IF NOT EXISTS por Código */
IF OBJECT_ID(N'dbo.[Tipo de Diagnóstico Principal]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM dbo.[Tipo de Diagnóstico Principal]
        WHERE [Código Tipo de Diagnóstico Principal] = N'01'
           OR [Descripción Tipo de Diagnóstico Principal] = N'Impresión diagnóstica'
    )
        INSERT INTO dbo.[Tipo de Diagnóstico Principal] (
            [Código Tipo de Diagnóstico Principal], [Tipo de Diagnóstico Principal],
            [Descripción Tipo de Diagnóstico Principal], [Orden Tipo de Diagnóstico Principal], [Id Estado]
        ) VALUES (N'01', N'01', N'Impresión diagnóstica', 1, 7);
    ELSE
        UPDATE dbo.[Tipo de Diagnóstico Principal]
        SET [Código Tipo de Diagnóstico Principal] = N'01', [Id Estado] = 7
        WHERE [Descripción Tipo de Diagnóstico Principal] = N'Impresión diagnóstica'
           OR [Código Tipo de Diagnóstico Principal] = N'01';

    IF NOT EXISTS (
        SELECT 1 FROM dbo.[Tipo de Diagnóstico Principal]
        WHERE [Código Tipo de Diagnóstico Principal] = N'02'
           OR [Descripción Tipo de Diagnóstico Principal] = N'Confirmado nuevo'
    )
        INSERT INTO dbo.[Tipo de Diagnóstico Principal] (
            [Código Tipo de Diagnóstico Principal], [Tipo de Diagnóstico Principal],
            [Descripción Tipo de Diagnóstico Principal], [Orden Tipo de Diagnóstico Principal], [Id Estado]
        ) VALUES (N'02', N'02', N'Confirmado nuevo', 2, 7);
    ELSE
        UPDATE dbo.[Tipo de Diagnóstico Principal]
        SET [Código Tipo de Diagnóstico Principal] = N'02', [Id Estado] = 7
        WHERE [Descripción Tipo de Diagnóstico Principal] = N'Confirmado nuevo'
           OR [Código Tipo de Diagnóstico Principal] = N'02';

    IF NOT EXISTS (
        SELECT 1 FROM dbo.[Tipo de Diagnóstico Principal]
        WHERE [Código Tipo de Diagnóstico Principal] = N'03'
           OR [Descripción Tipo de Diagnóstico Principal] = N'Confirmado repetido'
    )
        INSERT INTO dbo.[Tipo de Diagnóstico Principal] (
            [Código Tipo de Diagnóstico Principal], [Tipo de Diagnóstico Principal],
            [Descripción Tipo de Diagnóstico Principal], [Orden Tipo de Diagnóstico Principal], [Id Estado]
        ) VALUES (N'03', N'03', N'Confirmado repetido', 3, 7);
    ELSE
        UPDATE dbo.[Tipo de Diagnóstico Principal]
        SET [Código Tipo de Diagnóstico Principal] = N'03', [Id Estado] = 7
        WHERE [Descripción Tipo de Diagnóstico Principal] = N'Confirmado repetido'
           OR [Código Tipo de Diagnóstico Principal] = N'03';
END
GO
"""


def gen_credenciales_ihce_seed() -> str:
    src = read_text(D2275 / "19. CredencialesIhce.sql")
    # Tabla ya en 14 — solo semilla (desde ;WITH Ambientes)
    idx = src.find(";WITH Ambientes")
    if idx < 0:
        idx = src.find("WITH Ambientes")
    if idx < 0:
        return "/* WARN: no seed CredencialesIhce */\n"
    seed = src[idx:]
    # Quitar CREATE TABLE block if somehow included
    return (
        "/* CredencialesIhce — semilla por empresa (secretos vacíos; completar por UI) */\n"
        + "IF OBJECT_ID(N'dbo.CredencialesIhce', N'U') IS NULL\n"
        + "BEGIN\n"
        + "    RAISERROR(N'Falta tabla CredencialesIhce (sección TABLAS).', 16, 1);\n"
        + "    RETURN;\n"
        + "END\nGO\n\n"
        + seed
    )


def build_2275() -> Path:
    print("Building 2275 unified installer...")
    parts: list[str] = []
    parts.append(
        """/*
==============================================================================
  00_INSTALL_2275_COMPLETO.sql — INSTALADOR ÚNICO RIPS 2275
==============================================================================
  Idempotente. SQL Server 2014+. Sin USE (ejecutar en la BD del cliente).

  Orden interno:
    1. TABLAS
    2. ALTER
    3. UPDATES
    4. DATOS (catálogos cortos + Servicios + Finalidad/Causa + CIE10/CUPS)
    5. FUNCIONES Y TRIGGERS
    6. VISTAS
    7. CredencialesIhce (semilla)

  Prerrequisitos CeereSIO: Entidad, Evaluación Entidad, Evaluación Entidad Rips,
  Factura, Tipo Rips, Estado, País, Zona Residencia, etc.

  Después: ejecutar 00_INSTALL_1888_COMPLETO.sql si aplica RDA/1888.
==============================================================================
*/

SET NOCOUNT ON;
GO

PRINT N'=== INICIO INSTALL 2275 COMPLETO ===';
GO
"""
    )

    parts.append(section("1/7 TABLAS_2275"))
    parts.append(strip_install_header(read_text(D2275 / "14. TABLAS_2275_INSTALL.sql")))

    parts.append(section("2/7 ALTER_2275"))
    parts.append(strip_install_header(read_text(D2275 / "15. ALTER_2275_INSTALL.sql")))

    parts.append(section("3/7 UPDATES_2275"))
    parts.append(strip_install_header(read_text(D2275 / "16. UPDATES_2275_INSTALL.sql")))

    parts.append(section("4/7 DATOS_2275 - catalogos cortos"))
    datos17 = read_text(D2275 / "17. DATOS_2275_INSTALL.sql")
    # Cortar ANTES del comentario que abre el bloque CIE10/CUPS (no a mitad del /* */)
    cut_marker = "Rips Cie10 y Rips Cups"
    cut = datos17.find(cut_marker)
    if cut > 0:
        open_c = datos17.rfind("/*", 0, cut)
        if open_c >= 0:
            cut = open_c
        small = datos17[:cut]
        small = strip_install_header(small)
        # Cerrar comentario huérfano si quedó abierto
        if small.count("/*") > small.count("*/"):
            small = small.rstrip() + "\n*/\n"
        parts.append(small.rstrip() + "\nGO\n")
    else:
        parts.append(strip_install_header(datos17))

    parts.append(section("4b/7 DATOS — RIPS Servicios"))
    parts.append(gen_rips_servicios())

    parts.append(section("4c/7 DATOS — Finalidad/Causa Version2"))
    parts.append(gen_finalidad_causa_v2())

    parts.append(section("4c2/7 DATOS — Tipo Diagnostico Principal RIPS"))
    parts.append(gen_seed_tipo_dx_principal_rips())

    parts.append(section("4d/7 DATOS — CIE10 y CUPS completos"))
    parts.append(gen_cie10_cups_from_file2())

    parts.append(section("5/7 FUNCIONES Y TRIGGERS"))
    parts.append(gen_triggers_functions_2275())

    parts.append(section("6/7 VISTAS_2275"))
    parts.append(strip_install_header(read_text(D2275 / "13. VISTAS_2275_INSTALL.sql")))

    parts.append(section("7/7 CredencialesIhce seed"))
    parts.append(gen_credenciales_ihce_seed())

    parts.append(
        "\nPRINT N'=== INSTALL 2275 COMPLETO - finalizado ===';\nGO\n"
        "PRINT N'Verificar: SELECT TOP 1 IdApiRipsPorDefecto FROM dbo.[ConsultarRIPSPorDefecto];';\nGO\n"
    )

    out_path = D2275 / "00_INSTALL_2275_COMPLETO.sql"
    text = "".join(parts)
    # Sanity: no CREATE OR ALTER
    text = to_2014_safe(text)
    out_path.write_text(text, encoding="utf-8")
    print(f"  Wrote {out_path.name}: {len(text.splitlines())} lines, {out_path.stat().st_size // 1024} KB")
    return out_path


# ─── 1888 helpers ───────────────────────────────────────────────────────────

def gen_1888_runtime() -> str:
    src = read_text(D1888 / "1888 update a registros malos.sql")
    chunks: list[str] = ["/* RUNTIME 1888 — trigger, SP, trazabilidad (sin DELETE masivos) */\n"]

    # Trazabilidad table
    m = re.search(
        r"IF OBJECT_ID\(N'\[dbo\]\.\[RDA IHCE Trazabilidad\]'.*?END\s*GO",
        src,
        re.I | re.S,
    )
    if m:
        chunks.append(m.group(0).rstrip() + "\nGO\n\n")

    # sp_Paciente_Guardar
    m = re.search(
        r"CREATE\s+OR\s+ALTER\s+PROCEDURE\s+sp_Paciente_Guardar.*?END;\s*GO",
        src,
        re.I | re.S,
    )
    if m:
        proc = m.group(0)
        proc = re.sub(
            r"CREATE\s+OR\s+ALTER\s+PROCEDURE\s+sp_Paciente_Guardar",
            "CREATE PROCEDURE [dbo].[sp_Paciente_Guardar]",
            proc,
            count=1,
            flags=re.I,
        )
        chunks.append(
            "IF OBJECT_ID(N'dbo.sp_Paciente_Guardar', N'P') IS NOT NULL\n"
            "    DROP PROCEDURE dbo.sp_Paciente_Guardar;\nGO\n"
        )
        chunks.append(proc if proc.rstrip().upper().endswith("GO") else proc.rstrip() + "\nGO\n")
        chunks.append("\n")

    # Trigger
    chunks.append(
        "IF OBJECT_ID(N'dbo.trg_Entidad_AfterInsert_EnsureEntidad1888', N'TR') IS NOT NULL\n"
        "    DROP TRIGGER dbo.trg_Entidad_AfterInsert_EnsureEntidad1888;\nGO\n"
    )
    chunks.append(
        """
CREATE TRIGGER [dbo].[trg_Entidad_AfterInsert_EnsureEntidad1888]
ON [dbo].[Entidad]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[Entidad1888] ([Documento Entidad])
    SELECT LTRIM(RTRIM(i.[Documento Entidad]))
    FROM inserted i
    WHERE i.[Documento Entidad] IS NOT NULL
      AND LTRIM(RTRIM(i.[Documento Entidad])) <> ''
      AND NOT EXISTS (
          SELECT 1
          FROM [dbo].[Entidad1888] e
          WHERE LTRIM(RTRIM(e.[Documento Entidad])) = LTRIM(RTRIM(i.[Documento Entidad]))
      );
END;
GO

IF OBJECT_ID(N'[dbo].[TR_Entidad_Insert]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TR_Entidad_Insert];
GO
IF OBJECT_ID(N'[dbo].[TR_Entidad_Update_Doc]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TR_Entidad_Update_Doc];
GO
"""
    )
    return "".join(chunks)


def gen_ocupacion_ciuo_safe() -> str:
    """Sin asignar + MERGE por código (sin DELETE masivo)."""
    out = [read_text(D1888 / "1888_ocupacion_sin_asignar.sql"), "\nGO\n"]
    src = read_text(D1888 / "1888_replace_ocupacion_ciuo88ac.sql")
    out.append("\n/* Ocupación CIUO88AC — IF NOT EXISTS por Código (sin DELETE) */\n")
    for line in src.splitlines():
        s = line.strip()
        if not s.upper().startswith("INSERT INTO"):
            continue
        if "[Ocupación]" not in s and "[Ocupacion]" not in s:
            continue
        mm = re.search(
            r"VALUES\s*\(\s*N?'([^']+)'\s*,\s*N?'((?:[^']|'')*)'\s*,\s*N?'((?:[^']|'')*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
            s,
            re.I,
        )
        if not mm:
            continue
        cod, nom, desc, orden, est = mm.groups()
        out.append(
            f"IF NOT EXISTS (SELECT 1 FROM dbo.[Ocupación] WHERE [Código Ocupación] = N'{cod}')\n"
            f"    INSERT INTO dbo.[Ocupación] ([Código Ocupación],[Ocupación],[Descripción Ocupación],[Orden Ocupación],[Id Estado])\n"
            f"    VALUES (N'{cod}', N'{nom}', N'{desc}', {orden}, {est});\nGO\n"
        )
    # Activar las que tengan código CIUO
    out.append(
        "\nUPDATE dbo.[Ocupación] SET [Id Estado] = 7\n"
        "WHERE [Código Ocupación] IS NOT NULL AND LTRIM(RTRIM([Código Ocupación])) <> N'' AND ISNULL([Id Estado], 0) <> 7;\nGO\n"
    )
    return "".join(out)


def gen_medicamentos_idempotent() -> str:
    src = read_text(D1888 / "1888_insert_medicamentos_dci.sql")
    out = [
        "/* Medicamento DCI 1888 — idempotente */\n",
        "IF OBJECT_ID(N'dbo.[Medicamento DCI 1888]', N'U') IS NULL\n",
        "BEGIN\n",
        "    CREATE TABLE dbo.[Medicamento DCI 1888] (\n",
        "        [ID Medicamento DCI 1888] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,\n",
        "        Codigo VARCHAR(20) NULL,\n",
        "        Descripcion VARCHAR(200) NULL,\n",
        "        [Id Estado] INT NULL CONSTRAINT DF_MedicamentoDCI1888_Estado DEFAULT (7)\n",
        "    );\n",
        "END\nGO\n",
    ]
    n = 0
    for line in src.splitlines():
        s = line.strip()
        if not s.upper().startswith("INSERT"):
            continue
        mm = re.search(r"VALUES\s*\(\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'\s*\)", s)
        if not mm:
            continue
        cod, desc = mm.groups()
        desc_esc = desc.replace("'", "''")
        out.append(
            f"IF NOT EXISTS (SELECT 1 FROM dbo.[Medicamento DCI 1888] WHERE Codigo = N'{cod}')\n"
            f"    INSERT INTO dbo.[Medicamento DCI 1888] (Codigo, Descripcion) VALUES (N'{cod}', N'{desc_esc}');\n"
        )
        n += 1
        if n % 500 == 0:
            out.append("GO\n")
    out.append(f"\nPRINT N'Medicamentos DCI procesados: {n}';\nGO\n")
    print(f"  Medicamentos wrapped: {n}")
    return "".join(out)


def gen_municipios_idempotent() -> str:
    src = read_text(D1888 / "1888_insert_ciudad_municipios.sql")
    out = ["/* Ciudad1888 municipios — IF NOT EXISTS por Codigo */\n"]
    # Extraer pares ('code','name',estado)
    n = 0
    for mm in re.finditer(r"\(\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'\s*,\s*(\d+)\s*\)", src):
        cod, nom, est = mm.groups()
        nom_esc = nom.replace("'", "''")
        out.append(
            f"IF NOT EXISTS (SELECT 1 FROM dbo.Ciudad1888 WHERE Codigo = N'{cod}')\n"
            f"    INSERT INTO dbo.Ciudad1888 (Codigo, Nombre, Estado) VALUES (N'{cod}', N'{nom_esc}', {est});\n"
        )
        n += 1
        if n % 200 == 0:
            out.append("GO\n")
    out.append(f"\nPRINT N'Municipios procesados: {n}';\nGO\n")
    print(f"  Municipios wrapped: {n}")
    return "".join(out)


def strip_datos_1888_ocupacion(text: str) -> str:
    """DATOS sin bloque ocupación legacy buggy + sin referencias a scripts externos."""
    t = strip_install_header(text)
    cut = t.find("/* Ocupación CIUO88AC")
    if cut < 0:
        cut = t.find("Ocupación CIUO88AC")
    if cut > 0:
        t = t[:cut]
    # Quitar footer de referencias
    cut2 = t.find("SCRIPTS MERGE AUTÓNOMOS")
    if cut2 > 0:
        t = t[:cut2]
    return t.rstrip() + "\nGO\n"


def strip_massive_table_create(sql: str) -> str:
    """CIE11/CUPS scripts ya crean tabla si falta — dejar tal cual (MERGE)."""
    return sql


def build_1888() -> Path:
    print("Building 1888 unified installer...")
    parts: list[str] = []
    parts.append(
        """/*
==============================================================================
  00_INSTALL_1888_COMPLETO.sql — INSTALADOR ÚNICO RESOLUCIÓN 1888 / RDA
==============================================================================
  Idempotente. SQL Server 2014+. Sin USE (ejecutar en la BD del cliente).

  PRERREQUISITO: 00_INSTALL_2275_COMPLETO.sql (o paquete 14→15→16→17→13).

  Orden interno:
    1. TABLAS
    2. ALTER
    3. RUNTIME (trazabilidad IHCE, sp_Paciente_Guardar, trigger Entidad1888)
    4. UPDATES
    5. DATOS base (sin ocupación legacy)
    6. Ocupación CIUO88AC + Sin asignar
    7. Municipios / Medicamentos / CIE11 / CUPS_Codigos
    8. CATALOGOS_RDA_FHIR
    9. VISTAS

  Timeout SSMS: 0. Preferible sqlcmd -I para archivos grandes.
==============================================================================
*/

SET NOCOUNT ON;
GO

PRINT N'=== INICIO INSTALL 1888 COMPLETO ===';
GO
"""
    )

    parts.append(section("1/9 TABLAS_1888"))
    parts.append(strip_install_header(read_text(D1888 / "TABLAS_1888_INSTALL.sql")))

    parts.append(section("2/9 ALTER_1888"))
    parts.append(strip_install_header(read_text(D1888 / "ALTER_1888_INSTALL.sql")))

    parts.append(section("3/9 RUNTIME_1888"))
    parts.append(gen_1888_runtime())

    parts.append(section("4/9 UPDATES_1888"))
    parts.append(strip_install_header(read_text(D1888 / "UPDATES_1888_INSTALL.sql")))

    parts.append(section("5/9 DATOS_1888 base"))
    parts.append(strip_datos_1888_ocupacion(read_text(D1888 / "DATOS_1888_INSTALL.sql")))

    parts.append(section("5b/9 Seed Tipo diagnostico principal 1888"))
    parts.append(gen_seed_tipo_dx_principal())

    parts.append(section("5c/9 Seed Entorno + Factor Riesgo 1888"))
    parts.append(gen_seed_entorno_factor_riesgo())

    parts.append(section("6/9 Ocupación CIUO88AC"))
    parts.append(gen_ocupacion_ciuo_safe())

    parts.append(section("7a/9 Ciudad1888 municipios"))
    parts.append(gen_municipios_idempotent())

    parts.append(section("7b/9 Medicamento DCI"))
    parts.append(gen_medicamentos_idempotent())

    parts.append(section("7c/9 CIE11_Codigos"))
    parts.append(strip_massive_table_create(read_text(D1888 / "1888_create_cie11_tabla_con_datos.sql")))
    parts.append("\nGO\n")

    parts.append(section("7d/9 CUPS_Codigos"))
    parts.append(strip_massive_table_create(read_text(D1888 / "1888_create_cups_tabla_con_datos.sql")))
    parts.append("\nGO\n")

    parts.append(section("8/9 CATALOGOS_RDA_FHIR"))
    parts.append(strip_install_header(read_text(D1888 / "CATALOGOS_RDA_FHIR_INSTALL.sql")))

    parts.append(section("9/9 VISTAS_1888"))
    parts.append(strip_install_header(read_text(D1888 / "VISTAS_1888_INSTALL.sql")))

    parts.append(
        "\n/* OPCIONAL: sincronizar nombres [Rips Cups] desde CUPS_Codigos\n"
        "   Ver 1888_update_rips_cups_nombre_desde_cups_codigos.sql */\n"
        "PRINT N'=== INSTALL 1888 COMPLETO - finalizado ===';\nGO\n"
        "PRINT N'Verificar: SELECT OBJECT_ID(N''dbo.sp_Paciente_Guardar'', N''P'');';\nGO\n"
        "PRINT N'Verificar: SELECT COUNT(*) FROM dbo.CIE11_Codigos;';\nGO\n"
    )

    out_path = D1888 / "00_INSTALL_1888_COMPLETO.sql"
    text = to_2014_safe("".join(parts))
    out_path.write_text(text, encoding="utf-8")
    print(f"  Wrote {out_path.name}: {len(text.splitlines())} lines, {out_path.stat().st_size // 1024} KB")
    return out_path


def validate(path: Path) -> None:
    text = read_text(path)
    issues = []
    if re.search(r"CREATE\s+OR\s+ALTER", text, re.I):
        issues.append("contiene CREATE OR ALTER")
    if re.search(r"DROP\s+VIEW\s+IF\s+EXISTS", text, re.I):
        issues.append("contiene DROP VIEW IF EXISTS")
    # Truncation check: last non-empty line should have GO or PRINT
    lines = [ln for ln in text.splitlines() if ln.strip()]
    if lines and not re.search(r"GO|PRINT|completat|finalizado", lines[-1], re.I):
        # check last 5
        tail = "\n".join(lines[-5:])
        if "finalizado" not in tail.lower() and "GO" not in tail:
            issues.append(f"posible truncado (cola: {lines[-1][:80]!r})")
    if path.name.startswith("00_INSTALL_2275"):
        if "ConsultarRIPSPorDefecto" not in text:
            issues.append("falta vista ConsultarRIPSPorDefecto")
        if "RIPS Servicios" not in text:
            issues.append("falta RIPS Servicios")
        if text.rstrip().endswith("[C") or text.rstrip().endswith("[Ta"):
            issues.append("archivo truncado al final")
        # Count CUPS wraps
        n_cups = text.count("FROM dbo.[Rips Cups] WHERE Codigo")
        n_cie = text.count("FROM dbo.[Rips Cie10] WHERE Codigo")
        print(f"  validate 2275: Cie10 IF-blocks={n_cie}, Cups IF-blocks={n_cups}")
        if n_cie < 10000:
            issues.append(f"CIE10 demasiado pocos ({n_cie})")
        if n_cups < 10000:
            issues.append(f"CUPS demasiado pocos ({n_cups})")
    if path.name.startswith("00_INSTALL_1888"):
        for needle in ("sp_Paciente_Guardar", "RDA IHCE Trazabilidad", "CIE11_Codigos", "trg_Entidad_AfterInsert"):
            if needle not in text:
                issues.append(f"falta {needle}")
    if issues:
        print(f"  VALIDATION ISSUES {path.name}:")
        for i in issues:
            print(f"    - {i}")
    else:
        print(f"  Validation OK: {path.name}")


if __name__ == "__main__":
    p2275 = build_2275()
    validate(p2275)
    p1888 = build_1888()
    validate(p1888)
    print("Done.")

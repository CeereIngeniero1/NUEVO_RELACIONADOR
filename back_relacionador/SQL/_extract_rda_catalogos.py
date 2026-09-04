# -*- coding: utf-8 -*-
"""Extract RDA FHIR catalog CREATE+MERGE into CATALOGOS_RDA_FHIR_INSTALL.sql"""
from pathlib import Path
import re

base = Path(__file__).resolve().parent / "1888"
src = base / "1888 update a registros malos.sql"
out = base / "CATALOGOS_RDA_FHIR_INSTALL.sql"

text = src.read_text(encoding="utf-8")
lines = text.splitlines(keepends=True)

start = end = None
for i, line in enumerate(lines):
    if "CATÁLOGOS RDA FHIR" in line or "CATALOGOS RDA FHIR" in line:
        # include the comment block start a few lines earlier if present
        start = i
        while start > 0 and lines[start - 1].strip().startswith("/*"):
            start -= 1
            break
        # Prefer the line with /* ===
        j = i
        while j > 0 and "====" not in lines[j]:
            j -= 1
        if "====" in lines[j]:
            start = j
    if start is not None and "Sincronizar nombres de modalidad RIPS" in line:
        end = i
        break

if start is None or end is None:
    raise SystemExit(f"bounds not found start={start} end={end}")

chunk = "".join(lines[start:end])

# Remove VIEW drop/create blocks
chunk = re.sub(
    r"IF OBJECT_ID\(['\"]dbo\.VW_RDA_[^)]+\)[\s\S]*?WHERE id_estado = 7;\s*GO\s*",
    "",
    chunk,
)

# Remove CE prescription via normalization (depends on optional tables; keep in update script)
chunk = re.sub(
    r"-- Normalizar vías guardadas[\s\S]*?(?=-- 4\) ColombianTechModality)",
    "",
    chunk,
)

header = """/*
==============================================================================
  CATÁLOGOS RDA FHIR — INSTALACIÓN IDEMPOTENTE
==============================================================================
  Crea y carga:
    - dbo.RDA_MedicationTime (+ fhir_duration_unit)
    - dbo.RDA_UMM
    - dbo.RDA_ViaAdministracion  (incluye limpieza legacy VAD)
    - dbo.RDA_ColombianTechModality

  Orden de ejecución (paquete 1888):
    1. TABLAS_1888_INSTALL.sql
    2. ALTER_1888_INSTALL.sql
    3. UPDATES_1888_INSTALL.sql
    4. DATOS_1888_INSTALL.sql
    4b. CATALOGOS_RDA_FHIR_INSTALL.sql  (este)  ← requerido antes de VISTAS FHIR
    5. VISTAS_1888_INSTALL.sql

  Fuente: 1888 update a registros malos.sql (sección CATÁLOGOS RDA FHIR).
  Las vistas VW_RDA_*_Activos se crean en VISTAS_1888_INSTALL.sql.
==============================================================================
*/

SET NOCOUNT ON;
GO

"""

footer = """
PRINT N'=== CATALOGOS_RDA_FHIR_INSTALL — instalación completada ===';
GO
"""

out.write_text(header + chunk.rstrip() + "\n" + footer, encoding="utf-8")
print(f"Wrote {out}")
print(f"chars={out.stat().st_size}")
print("CREATE MedicationTime", "CREATE TABLE dbo.RDA_MedicationTime" in chunk)
print("CREATE UMM", "CREATE TABLE dbo.RDA_UMM" in chunk)
print("CREATE Via", "CREATE TABLE dbo.RDA_ViaAdministracion" in chunk)
print("CREATE Tech", "CREATE TABLE dbo.RDA_ColombianTechModality" in chunk)
print("has VW_", "VW_RDA_" in chunk)
print("has Normalizar", "Normalizar vías" in chunk)

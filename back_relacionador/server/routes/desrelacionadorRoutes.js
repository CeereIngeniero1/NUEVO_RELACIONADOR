const Router = require("express").Router;
const { sql, poolPromise } = require("../db2");

const router = Router();

function parseDateParam(s) {
  // UI manda YYYY-MM-DD; si mandan basura, mejor fallar 400.
  const d = new Date(String(s));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * GET /relacionesRipsDesrelacionador/pacientes/:documentoUsuario/:fechaInicio/:fechaFin
 * Lista pacientes que tienen al menos un RIPS (Evaluación Entidad Rips) en el rango.
 */
router.get(
  "/relacionesRipsDesrelacionador/pacientes/:documentoUsuario/:fechaInicio/:fechaFin",
  async (req, res) => {
    try {
      const { documentoUsuario, fechaInicio, fechaFin } = req.params;
      const fi = parseDateParam(fechaInicio);
      const ff = parseDateParam(fechaFin);
      if (!documentoUsuario || !fi || !ff) {
        return res.status(400).json({ error: "Parámetros inválidos." });
      }

      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("DocumentoUsuario", sql.VarChar(50), String(documentoUsuario))
        .input("FechaInicio", sql.Date, fi)
        .input("FechaFin", sql.Date, ff)
        .query(`
          SELECT DISTINCT
            EE.[Documento Entidad] AS documentoPaciente,
            EN.[Nombre Completo Entidad] AS nombrePaciente
          FROM [Evaluación Entidad] EE
          INNER JOIN [Evaluación Entidad Rips] EER
            ON EER.[Id Evaluación Entidad] = EE.[Id Evaluación Entidad]
          INNER JOIN Entidad EN
            ON EN.[Documento Entidad] = EE.[Documento Entidad]
          WHERE
            EE.[Documento Usuario] = @DocumentoUsuario
            AND CAST(EE.[Fecha Evaluación Entidad] AS DATE) BETWEEN @FechaInicio AND @FechaFin
          ORDER BY EN.[Nombre Completo Entidad] ASC
        `);

      return res.json({ items: result.recordset || [] });
    } catch (error) {
      console.error("❌ relacionesRipsDesrelacionador/pacientes:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  }
);

/**
 * GET /relacionesRipsDesrelacionador/:documentoPaciente/:documentoUsuario/:fechaInicio/:fechaFin
 * Lista relaciones RIPS para un paciente y rango.
 */
router.get(
  "/relacionesRipsDesrelacionador/:documentoPaciente/:documentoUsuario/:fechaInicio/:fechaFin",
  async (req, res) => {
    try {
      const { documentoPaciente, documentoUsuario, fechaInicio, fechaFin } = req.params;
      const fi = parseDateParam(fechaInicio);
      const ff = parseDateParam(fechaFin);
      if (!documentoPaciente || !documentoUsuario || !fi || !ff) {
        return res.status(400).json({ error: "Parámetros inválidos." });
      }

      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("DocumentoPaciente", sql.VarChar(50), String(documentoPaciente))
        .input("DocumentoUsuario", sql.VarChar(50), String(documentoUsuario))
        .input("FechaInicio", sql.Date, fi)
        .input("FechaFin", sql.Date, ff)
        .query(`
          SELECT
            EER.[Id Evaluación Entidad Rips] AS idRipsRelacion,
            EE.[Id Evaluación Entidad] AS idEvaluacion,
            EE.[Fecha Evaluación Entidad] AS fechaEvaluacion,
            'HC' AS prefijoEvalDisplay,
            LTRIM(RTRIM(
              CONCAT(
                NULLIF(EER.[Codigo Rips], ''),
                CASE WHEN NULLIF(EER.[Diagnostico Rips], '') IS NULL THEN '' ELSE ' / ' END,
                NULLIF(EER.[Diagnostico Rips], '')
              )
            )) AS cupsCie,
            EER.[Id Factura] AS idFactura,
            F.[No Factura] AS noFactura,
            F.[Total Factura] AS totalFactura,
            EER.[Id Plan de Tratamiento] AS idPlanTratamiento
          FROM [Evaluación Entidad] EE
          INNER JOIN [Evaluación Entidad Rips] EER
            ON EER.[Id Evaluación Entidad] = EE.[Id Evaluación Entidad]
          LEFT JOIN Factura F
            ON F.[Id Factura] = EER.[Id Factura]
          WHERE
            EE.[Documento Entidad] = @DocumentoPaciente
            AND EE.[Documento Usuario] = @DocumentoUsuario
            AND CAST(EE.[Fecha Evaluación Entidad] AS DATE) BETWEEN @FechaInicio AND @FechaFin
          ORDER BY EE.[Fecha Evaluación Entidad] DESC, EER.[Id Evaluación Entidad Rips] DESC
        `);

      const items = (result.recordset || []).map((r) => {
        const idFactura = Number(r.idFactura || 0);
        const idPlan = Number(r.idPlanTratamiento || 0);
        let facturaTipo = "sin";
        let facturaEtiqueta = "";
        let valorReportado = 0;

        if (idFactura > 0) {
          facturaTipo = "fev";
          facturaEtiqueta = String(r.noFactura || `Factura #${idFactura}`);
          valorReportado = Number(r.totalFactura || 0);
        } else if (idPlan > 0) {
          facturaTipo = "eps";
          facturaEtiqueta = `Plan #${idPlan}`;
          valorReportado = 0;
        }

        return {
          idRipsRelacion: Number(r.idRipsRelacion),
          idEvaluacion: Number(r.idEvaluacion),
          prefijoEvalDisplay: String(r.prefijoEvalDisplay || "HC"),
          fechaEvaluacion: r.fechaEvaluacion,
          cupsCie: r.cupsCie || "",
          facturaTipo,
          facturaEtiqueta,
          valorReportado,
        };
      });

      return res.json({ items });
    } catch (error) {
      console.error("❌ relacionesRipsDesrelacionador:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  }
);

/**
 * DELETE /relacionesRipsDesrelacionador
 * Body: { idRipsRelacion: number, documentoPaciente: string }
 */
router.delete("/relacionesRipsDesrelacionador", async (req, res) => {
  try {
    const { idRipsRelacion, documentoPaciente } = req.body || {};
    const id = Number(idRipsRelacion);
    const doc = String(documentoPaciente || "").trim();
    if (!id || !doc) {
      return res.status(400).json({ error: "Parámetros inválidos." });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("IdRipsRelacion", sql.Int, id)
      .input("DocumentoPaciente", sql.VarChar(50), doc)
      .query(`
        DELETE EER
        FROM [Evaluación Entidad Rips] EER
        INNER JOIN [Evaluación Entidad] EE
          ON EE.[Id Evaluación Entidad] = EER.[Id Evaluación Entidad]
        WHERE
          EER.[Id Evaluación Entidad Rips] = @IdRipsRelacion
          AND EE.[Documento Entidad] = @DocumentoPaciente
      `);

    const rows = Number(result.rowsAffected?.[0] || 0);
    if (rows === 0) {
      return res.status(404).json({ error: "No se encontró la relación RIPS para eliminar." });
    }
    return res.json({ message: "RIPS desrelacionado." });
  } catch (error) {
    console.error("❌ DELETE relacionesRipsDesrelacionador:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

/**
 * PATCH /relacionesRipsDesrelacionador/factura
 * Body: { idRipsRelacion: number, documentoPaciente: string }
 */
router.patch("/relacionesRipsDesrelacionador/factura", async (req, res) => {
  try {
    const { idRipsRelacion, documentoPaciente } = req.body || {};
    const id = Number(idRipsRelacion);
    const doc = String(documentoPaciente || "").trim();
    if (!id || !doc) {
      return res.status(400).json({ error: "Parámetros inválidos." });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("IdRipsRelacion", sql.Int, id)
      .input("DocumentoPaciente", sql.VarChar(50), doc)
      .query(`
        UPDATE EER
        SET
          EER.[Id Factura] = 0,
          EER.[Id Plan de Tratamiento] = 0
        FROM [Evaluación Entidad Rips] EER
        INNER JOIN [Evaluación Entidad] EE
          ON EE.[Id Evaluación Entidad] = EER.[Id Evaluación Entidad]
        WHERE
          EER.[Id Evaluación Entidad Rips] = @IdRipsRelacion
          AND EE.[Documento Entidad] = @DocumentoPaciente
      `);

    const rows = Number(result.rowsAffected?.[0] || 0);
    if (rows === 0) {
      return res.status(404).json({ error: "No se encontró el RIPS para actualizar." });
    }
    return res.json({ message: "Factura/plan quitados correctamente." });
  } catch (error) {
    console.error("❌ PATCH relacionesRipsDesrelacionador/factura:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;


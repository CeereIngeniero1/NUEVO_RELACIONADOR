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
 * GET /relacionesRipsDesrelacionador/v2/facturas/:documentoEmpresa/:fechaInicio/:fechaFin
 * Facturas ENVIADAS (EstadoFacturaElectronica >= 1) en el rango, con conteo RIPS/tratamientos.
 */
router.get(
  "/relacionesRipsDesrelacionador/v2/facturas/:documentoEmpresa/:fechaInicio/:fechaFin",
  async (req, res) => {
    try {
      const { documentoEmpresa, fechaInicio, fechaFin } = req.params;
      const fi = parseDateParam(fechaInicio);
      const ff = parseDateParam(fechaFin);
      if (!documentoEmpresa || !fi || !ff) {
        return res.status(400).json({ error: "Parámetros inválidos." });
      }

      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("DocumentoEmpresa", sql.VarChar(50), String(documentoEmpresa))
        .input("FechaInicio", sql.Date, fi)
        .input("FechaFin", sql.Date, ff)
        .query(`
          SELECT
            F.[Id Factura] AS idFactura,
            F.[No Factura] AS noFactura,
            F.[Fecha Factura] AS fechaFactura,
            F.[Total Factura] AS totalFactura,
            F.[Documento Paciente] AS documentoPaciente,
            EN.[Nombre Completo Entidad] AS nombrePaciente,
            EV.[Prefijo Resolución Facturación EmpresaV] AS prefijo,
            ISNULL((
              SELECT COUNT(*)
              FROM [Evaluación Entidad Rips] EER
              WHERE EER.[Id Factura] = F.[Id Factura]
            ), 0) AS cantidadRips,
            ISNULL((
              SELECT COUNT(*)
              FROM FacturaII FII
              WHERE FII.[Id Factura] = F.[Id Factura]
            ), 0) AS cantidadTratamientos,
            CASE WHEN EXISTS (
              SELECT 1
              FROM FacturaII FII
              INNER JOIN [Plan de Tratamiento] PT
                ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento]
              INNER JOIN [Plan de Tratamiento Tratamientos] PTT
                ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
              INNER JOIN [Tipo Responsable] TR
                ON TR.[Id Tipo Responsable] = PTT.[Id Tipo Responsable]
              WHERE FII.[Id Factura] = F.[Id Factura]
                AND TR.[Tipo Responsable] IN ('Entidad Prepagada', 'EPS')
            ) THEN 1 ELSE 0 END AS esEps
          FROM Factura F
          INNER JOIN EmpresaV EV ON EV.[Id EmpresaV] = F.[Id EmpresaV]
          INNER JOIN Empresa EM ON EM.[Documento Empresa] = EV.[Documento Empresa]
          LEFT JOIN Entidad EN ON EN.[Documento Entidad] = F.[Documento Paciente]
          WHERE
            EM.[Documento Empresa] = @DocumentoEmpresa
            AND F.EstadoFacturaElectronica >= 1
            AND CAST(F.[Fecha Factura] AS DATE) BETWEEN @FechaInicio AND @FechaFin
          ORDER BY F.[Fecha Factura] DESC, F.[Id Factura] DESC
        `);

      const items = (result.recordset || []).map((r) => {
        const cantidadRips = Number(r.cantidadRips || 0);
        const cantidadTratamientos = Number(r.cantidadTratamientos || 0);
        const esEps = Number(r.esEps || 0) === 1;
        let indicador = "ok";
        if (cantidadRips === 0) indicador = "sinRips";
        else if (esEps && cantidadTratamientos > 0 && cantidadRips !== cantidadTratamientos) {
          indicador = "revisar";
        }

        return {
          idFactura: Number(r.idFactura),
          noFactura: String(r.noFactura || ""),
          fechaFactura: r.fechaFactura,
          totalFactura: Number(r.totalFactura || 0),
          documentoPaciente: String(r.documentoPaciente || ""),
          nombrePaciente: String(r.nombrePaciente || ""),
          prefijo: String(r.prefijo || ""),
          cantidadRips,
          cantidadTratamientos,
          esEps,
          tipoFactura: esEps ? "EPS/Prepagada" : "Particular",
          indicador,
        };
      });

      return res.json({ items });
    } catch (error) {
      console.error("❌ relacionesRipsDesrelacionador/v2/facturas:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  }
);

/**
 * GET /relacionesRipsDesrelacionador/v2/factura/:idFactura
 * Detalle: tratamientos + RIPS, con flag de Id tratamiento duplicado (EPS).
 */
router.get("/relacionesRipsDesrelacionador/v2/factura/:idFactura", async (req, res) => {
  try {
    const idFactura = Number(req.params.idFactura);
    if (!idFactura) {
      return res.status(400).json({ error: "Id factura inválido." });
    }

    const pool = await poolPromise;

    const cabeceraResult = await pool
      .request()
      .input("IdFactura", sql.Int, idFactura)
      .query(`
        SELECT
          F.[Id Factura] AS idFactura,
          F.[No Factura] AS noFactura,
          F.[Fecha Factura] AS fechaFactura,
          F.[Total Factura] AS totalFactura,
          F.[Documento Paciente] AS documentoPaciente,
          EN.[Nombre Completo Entidad] AS nombrePaciente,
          EV.[Prefijo Resolución Facturación EmpresaV] AS prefijo,
          CASE WHEN EXISTS (
            SELECT 1
            FROM FacturaII FII
            INNER JOIN [Plan de Tratamiento] PT
              ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento]
            INNER JOIN [Plan de Tratamiento Tratamientos] PTT
              ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
            INNER JOIN [Tipo Responsable] TR
              ON TR.[Id Tipo Responsable] = PTT.[Id Tipo Responsable]
            WHERE FII.[Id Factura] = F.[Id Factura]
              AND TR.[Tipo Responsable] IN ('Entidad Prepagada', 'EPS')
          ) THEN 1 ELSE 0 END AS esEps,
          CASE WHEN EXISTS (
            SELECT 1
            FROM FacturaII FII
            INNER JOIN [Plan de Tratamiento] PT
              ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento]
            INNER JOIN [Plan de Tratamiento Tratamientos] PTT
              ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
            INNER JOIN [Tipo Responsable] TR
              ON TR.[Id Tipo Responsable] = PTT.[Id Tipo Responsable]
            WHERE FII.[Id Factura] = F.[Id Factura]
              AND TR.[Tipo Responsable] = 'Entidad Prepagada'
          ) THEN 1 ELSE 0 END AS esPrepagada
        FROM Factura F
        LEFT JOIN EmpresaV EV ON EV.[Id EmpresaV] = F.[Id EmpresaV]
        LEFT JOIN Entidad EN ON EN.[Documento Entidad] = F.[Documento Paciente]
        WHERE F.[Id Factura] = @IdFactura
      `);

    const cab = cabeceraResult.recordset?.[0];
    if (!cab) {
      return res.status(404).json({ error: "Factura no encontrada." });
    }

    const esEps = Number(cab.esEps || 0) === 1;
    const esPrepagada = Number(cab.esPrepagada || 0) === 1;
    // Desrelacionar: Particular → solo Id Factura; Prepagada/EPS → Factura + Plan
    const limpiarPlan = esEps || esPrepagada;

    const tratamientosResult = await pool
      .request()
      .input("IdFactura", sql.Int, idFactura)
      .query(`
        SELECT
          FII.[Id Plan de Tratamiento] AS idPlanTratamiento,
          PT.[Nro Plan de Tratamiento] AS nroPlan,
          PT.[Documento Paciente] AS documentoPaciente,
          EN.[Nombre Completo Entidad] AS nombrePaciente,
          PTT.[Documento Responsable] AS documentoEps,
          EER.[Id Evaluación Entidad Rips] AS idRipsRelacion,
          EER.[Id Evaluación Entidad] AS idEvaluacion,
          EE.[Fecha Evaluación Entidad] AS fechaEvaluacion,
          LTRIM(RTRIM(
            CONCAT(
              NULLIF(EER.[Codigo Rips], ''),
              CASE WHEN NULLIF(EER.[Diagnostico Rips], '') IS NULL THEN '' ELSE ' / ' END,
              NULLIF(EER.[Diagnostico Rips], '')
            )
          )) AS cupsCie
        FROM FacturaII FII
        INNER JOIN [Plan de Tratamiento] PT
          ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento]
        LEFT JOIN [Plan de Tratamiento Tratamientos] PTT
          ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
        LEFT JOIN Entidad EN
          ON EN.[Documento Entidad] = PT.[Documento Paciente]
        LEFT JOIN [Evaluación Entidad Rips] EER
          ON EER.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento]
          AND EER.[Id Factura] = FII.[Id Factura]
        LEFT JOIN [Evaluación Entidad] EE
          ON EE.[Id Evaluación Entidad] = EER.[Id Evaluación Entidad]
        WHERE FII.[Id Factura] = @IdFactura
        ORDER BY PT.[Documento Paciente], FII.[Id Plan de Tratamiento]
      `);

    const ripsResult = await pool
      .request()
      .input("IdFactura", sql.Int, idFactura)
      .query(`
        SELECT
          EER.[Id Evaluación Entidad Rips] AS idRipsRelacion,
          EER.[Id Evaluación Entidad] AS idEvaluacion,
          EER.[Id Plan de Tratamiento] AS idPlanTratamiento,
          EER.[Id Factura] AS idFactura,
          EE.[Documento Entidad] AS documentoPaciente,
          EN.[Nombre Completo Entidad] AS nombrePaciente,
          EE.[Fecha Evaluación Entidad] AS fechaEvaluacion,
          LTRIM(RTRIM(
            CONCAT(
              NULLIF(EER.[Codigo Rips], ''),
              CASE WHEN NULLIF(EER.[Diagnostico Rips], '') IS NULL THEN '' ELSE ' / ' END,
              NULLIF(EER.[Diagnostico Rips], '')
            )
          )) AS cupsCie
        FROM [Evaluación Entidad Rips] EER
        INNER JOIN [Evaluación Entidad] EE
          ON EE.[Id Evaluación Entidad] = EER.[Id Evaluación Entidad]
        LEFT JOIN Entidad EN
          ON EN.[Documento Entidad] = EE.[Documento Entidad]
        WHERE EER.[Id Factura] = @IdFactura
        ORDER BY EER.[Id Evaluación Entidad Rips]
      `);

    const tratamientosRaw = tratamientosResult.recordset || [];
    const ripsRaw = ripsResult.recordset || [];

    // Contar repeticiones de Id Plan entre RIPS de esta factura
    const countByPlan = new Map();
    for (const r of ripsRaw) {
      const plan = Number(r.idPlanTratamiento || 0);
      if (plan > 0) {
        countByPlan.set(plan, (countByPlan.get(plan) || 0) + 1);
      }
    }

    const rips = ripsRaw.map((r) => {
      const idPlan = Number(r.idPlanTratamiento || 0);
      const tratamientoDuplicado = esEps && idPlan > 0 && (countByPlan.get(idPlan) || 0) > 1;
      return {
        idRipsRelacion: Number(r.idRipsRelacion),
        idEvaluacion: Number(r.idEvaluacion || 0),
        idPlanTratamiento: idPlan,
        idFactura: Number(r.idFactura || idFactura),
        documentoPaciente: String(r.documentoPaciente || ""),
        nombrePaciente: String(r.nombrePaciente || ""),
        fechaEvaluacion: r.fechaEvaluacion,
        cupsCie: r.cupsCie || "",
        tratamientoDuplicado,
        tieneRips: true,
      };
    });

    const tratamientos = tratamientosRaw.map((t) => {
      const idPlan = Number(t.idPlanTratamiento || 0);
      const idRips = t.idRipsRelacion != null ? Number(t.idRipsRelacion) : null;
      const tratamientoDuplicado = esEps && idPlan > 0 && (countByPlan.get(idPlan) || 0) > 1;
      return {
        idPlanTratamiento: idPlan,
        nroPlan: String(t.nroPlan || ""),
        documentoPaciente: String(t.documentoPaciente || ""),
        nombrePaciente: String(t.nombrePaciente || ""),
        documentoEps: String(t.documentoEps || ""),
        idRipsRelacion: idRips,
        idEvaluacion: t.idEvaluacion != null ? Number(t.idEvaluacion) : null,
        fechaEvaluacion: t.fechaEvaluacion || null,
        cupsCie: t.cupsCie || "",
        tieneRips: !!idRips,
        tratamientoDuplicado,
      };
    });

    // Particular: filas = RIPS por Id Factura (aunque haya FacturaII).
    // EPS/Prepagada: tratamientos + RIPS no emparejados.
    let filas;
    if (!esEps) {
      filas = rips.map((r) => ({
        idPlanTratamiento: r.idPlanTratamiento,
        nroPlan: "",
        documentoPaciente: r.documentoPaciente,
        nombrePaciente: r.nombrePaciente,
        documentoEps: "",
        idRipsRelacion: r.idRipsRelacion,
        idEvaluacion: r.idEvaluacion,
        fechaEvaluacion: r.fechaEvaluacion,
        cupsCie: r.cupsCie,
        tieneRips: true,
        tratamientoDuplicado: false,
      }));
    } else {
      filas = [...tratamientos];
      const seen = new Set(
        tratamientos.filter((t) => t.idRipsRelacion).map((t) => t.idRipsRelacion)
      );
      for (const r of rips) {
        if (!seen.has(r.idRipsRelacion)) {
          filas.push({
            idPlanTratamiento: r.idPlanTratamiento,
            nroPlan: "",
            documentoPaciente: r.documentoPaciente,
            nombrePaciente: r.nombrePaciente,
            documentoEps: "",
            idRipsRelacion: r.idRipsRelacion,
            idEvaluacion: r.idEvaluacion,
            fechaEvaluacion: r.fechaEvaluacion,
            cupsCie: r.cupsCie,
            tieneRips: true,
            tratamientoDuplicado: r.tratamientoDuplicado,
          });
        }
      }
    }

    const cantidadRips = rips.length;
    const cantidadTratamientos = tratamientos.length;
    let indicador = "ok";
    if (cantidadRips === 0) indicador = "sinRips";
    else if (esEps && cantidadTratamientos > 0 && cantidadRips !== cantidadTratamientos) {
      indicador = "revisar";
    } else if (esEps && rips.some((x) => x.tratamientoDuplicado)) {
      indicador = "revisar";
    }

    const tipoFactura = esPrepagada
      ? "Prepagada"
      : esEps
        ? "EPS"
        : "Particular";

    return res.json({
      factura: {
        idFactura: Number(cab.idFactura),
        noFactura: String(cab.noFactura || ""),
        fechaFactura: cab.fechaFactura,
        totalFactura: Number(cab.totalFactura || 0),
        documentoPaciente: String(cab.documentoPaciente || ""),
        nombrePaciente: String(cab.nombrePaciente || ""),
        prefijo: String(cab.prefijo || ""),
        esEps,
        esPrepagada,
        limpiarPlan,
        tipoFactura,
        cantidadRips,
        cantidadTratamientos,
        indicador,
      },
      filas,
      rips,
    });
  } catch (error) {
    console.error("❌ relacionesRipsDesrelacionador/v2/factura:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

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
 * Body: { idRipsRelacion, documentoPaciente, limpiarPlan?: boolean }
 * - Particular (limpiarPlan false): solo Id Factura = 0
 * - Prepagada/EPS (limpiarPlan true, default): Id Factura + Id Plan = 0
 */
router.patch("/relacionesRipsDesrelacionador/factura", async (req, res) => {
  try {
    const { idRipsRelacion, documentoPaciente, limpiarPlan } = req.body || {};
    const id = Number(idRipsRelacion);
    const doc = String(documentoPaciente || "").trim();
    const tambienPlan = limpiarPlan !== false && limpiarPlan !== 0 && limpiarPlan !== "0";
    if (!id || !doc) {
      return res.status(400).json({ error: "Parámetros inválidos." });
    }

    const pool = await poolPromise;
    const setSql = tambienPlan
      ? `
          EER.[Id Factura] = 0,
          EER.[Id Plan de Tratamiento] = 0
        `
      : `
          EER.[Id Factura] = 0
        `;

    const result = await pool
      .request()
      .input("IdRipsRelacion", sql.Int, id)
      .input("DocumentoPaciente", sql.VarChar(50), doc)
      .query(`
        UPDATE EER
        SET ${setSql}
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
    return res.json({
      message: tambienPlan
        ? "Factura y plan desrelacionados."
        : "Factura desrelacionada.",
    });
  } catch (error) {
    console.error("❌ PATCH relacionesRipsDesrelacionador/factura:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;


/**
 * Marca Evaluación Entidad Rips como enviados a MinSalud (FEV-RIPS)
 * y guarda el CUV tras un envío exitoso.
 */
'use strict';

const { sql, poolPromise } = require('../db2');
const { claveXml } = require('./xmlCache');

/**
 * Actualiza por factura (CON_FACTURA): Prefijo + NoFactura → Id Factura → todos los RIPS.
 */
async function marcarEnviadoPorFactura({
  documentoEmpresa,
  prefijo,
  noFactura,
  cuv,
  ambiente,
}) {
  const pool = await poolPromise;
  const pref = String(prefijo || '').trim();
  const folio = noFactura;
  const clave = claveXml(pref, folio);

  const result = await pool
    .request()
    .input('DocumentoEmpresa', sql.NVarChar(50), String(documentoEmpresa || '').trim())
    .input('Prefijo', sql.NVarChar(20), pref)
    .input('NoFactura', sql.NVarChar(50), String(folio ?? '').trim())
    .input('Clave', sql.NVarChar(50), clave)
    .input('Cuv', sql.NVarChar(100), cuv ? String(cuv).slice(0, 100) : null)
    .input('Ambiente', sql.NVarChar(20), ambiente ? String(ambiente).slice(0, 20) : null)
    .query(`
      UPDATE eer
      SET
        [Enviado FevRips] = 1,
        [CUV FevRips] = @Cuv,
        [Fecha Envio FevRips] = SYSUTCDATETIME(),
        [Ambiente Envio FevRips] = @Ambiente
      FROM [Evaluación Entidad Rips] eer
      INNER JOIN Factura Fac ON eer.[Id Factura] = Fac.[Id Factura]
      INNER JOIN EmpresaV EmpV ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
      INNER JOIN Empresa Emp ON EmpV.[Documento Empresa] = Emp.[Documento Empresa]
      WHERE Emp.[Documento Empresa] = @DocumentoEmpresa
        AND (
          (
            LTRIM(RTRIM(ISNULL(EmpV.[Prefijo Resolución Facturación EmpresaV], ''))) = @Prefijo
            AND (
              LTRIM(RTRIM(CAST(Fac.[No Factura] AS NVARCHAR(50)))) = @NoFactura
              OR CAST(TRY_CAST(Fac.[No Factura] AS INT) AS NVARCHAR(50)) = @NoFactura
            )
          )
          OR (
            LTRIM(RTRIM(ISNULL(EmpV.[Prefijo Resolución Facturación EmpresaV], '')))
              + CAST(TRY_CAST(Fac.[No Factura] AS INT) AS NVARCHAR(50))
          ) = @Clave
          OR (
            LTRIM(RTRIM(ISNULL(EmpV.[Prefijo Resolución Facturación EmpresaV], '')))
              + LTRIM(RTRIM(CAST(Fac.[No Factura] AS NVARCHAR(50))))
          ) = @Clave
        );

      SELECT @@ROWCOUNT AS filas;
    `);

  return Number(result.recordset?.[0]?.filas || 0);
}

/**
 * Actualiza por Id Evaluación Entidad Rips (SIN_FACTURA / RipSin{id}).
 */
async function marcarEnviadoPorIdEvaRips({ idEvaRips, cuv, ambiente }) {
  const id = parseInt(idEvaRips, 10);
  if (!id || Number.isNaN(id)) return 0;

  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('IdEvaRips', sql.Int, id)
    .input('Cuv', sql.NVarChar(100), cuv ? String(cuv).slice(0, 100) : null)
    .input('Ambiente', sql.NVarChar(20), ambiente ? String(ambiente).slice(0, 20) : null)
    .query(`
      UPDATE [Evaluación Entidad Rips]
      SET
        [Enviado FevRips] = 1,
        [CUV FevRips] = @Cuv,
        [Fecha Envio FevRips] = SYSUTCDATETIME(),
        [Ambiente Envio FevRips] = @Ambiente
      WHERE [Id Evaluación Entidad Rips] = @IdEvaRips;

      SELECT @@ROWCOUNT AS filas;
    `);

  return Number(result.recordset?.[0]?.filas || 0);
}

/**
 * Intenta marcar según tipo de paquete enviado.
 * @returns {{ filas: number, modo: string }}
 */
async function marcarEnviadoTrasEnvioOk({
  documentoEmpresa,
  paquete,
  cuv,
  ambiente,
  ripsJson,
}) {
  if (!cuv && cuv !== 0) {
    // Aun sin CUV, si MinSalud dijo OK marcamos enviado (CUV null)
  }

  const tipo = String(paquete?.tipo || '').toUpperCase();
  const clave = String(paquete?.clave || '');

  if (tipo === 'CON_FACTURA') {
    const filas = await marcarEnviadoPorFactura({
      documentoEmpresa,
      prefijo: paquete.Prefijo,
      noFactura: paquete.NoFactura,
      cuv,
      ambiente,
    });
    return { filas, modo: 'factura' };
  }

  // Sin factura: RipSin{id} en clave / numNota / JSON
  const ripSinMatch =
    clave.match(/RipSin(\d+)/i) ||
    String(ripsJson?.numNota || '').match(/RipSin(\d+)/i) ||
    String(ripsJson?.numFactura || '').match(/RipSin(\d+)/i);

  if (ripSinMatch) {
    const filas = await marcarEnviadoPorIdEvaRips({
      idEvaRips: ripSinMatch[1],
      cuv,
      ambiente,
    });
    return { filas, modo: 'idEvaRips' };
  }

  // Fallback: varios ids en usuarios[].servicios si el generador los incluye
  const ids = new Set();
  const usuarios = Array.isArray(ripsJson?.usuarios) ? ripsJson.usuarios : [];
  for (const u of usuarios) {
    const servicios = u?.servicios || {};
    for (const key of Object.keys(servicios)) {
      const arr = servicios[key];
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        const id =
          item?.idEvaluacionEntidadRips ||
          item?.IdEvaluacionEntidadRips ||
          item?.idEvaRips;
        if (id != null) ids.add(parseInt(id, 10));
      }
    }
  }

  let filas = 0;
  for (const id of ids) {
    if (!id || Number.isNaN(id)) continue;
    filas += await marcarEnviadoPorIdEvaRips({ idEvaRips: id, cuv, ambiente });
  }
  return { filas, modo: ids.size ? 'idsJson' : 'ninguno' };
}

module.exports = {
  marcarEnviadoPorFactura,
  marcarEnviadoPorIdEvaRips,
  marcarEnviadoTrasEnvioOk,
};

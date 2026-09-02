/**
 * Detecta CUV ya registrado (BD o historial de envíos) para evitar reenvíos duplicados.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { sql, poolPromise } = require('../db2');
const { claveXml } = require('./xmlCache');

function cuvValido(cuv) {
  if (cuv == null || cuv === '') return false;
  const s = String(cuv).trim();
  if (!s || /^no aplica$/i.test(s)) return false;
  return true;
}

function extraerCuvDeDetalle(detalle) {
  return extraerCuvDeTexto(detalle);
}

function extraerCuvDeTexto(text) {
  const s = String(text || '');
  const m1 = s.match(/CUV[:\s]+([a-f0-9]{32,128})/i);
  if (m1 && cuvValido(m1[1])) return m1[1].trim();
  const m2 = s.match(
    /C[oó]digo\s+[Uu][nÚn]ico\s+de\s+[Vv]alidaci[oó]n[^a-f0-9]*([a-f0-9]{32,128})/i
  );
  if (m2 && cuvValido(m2[1])) return m2[1].trim();
  return null;
}

function esValidacionRechazoCuvExistente(v) {
  const codigo = String(v?.Codigo || v?.codigo || '').trim().toUpperCase();
  const desc = String(v?.Descripcion || v?.descripcion || '');
  const obs = String(v?.Observaciones || v?.observaciones || '');
  const texto = `${desc} ${obs}`;

  if (codigo === 'RVG18') return true;
  if (
    codigo === 'RVG02' &&
    /CUV|ya se encuentra registrado|aprobado previamente|ya fue aprobado/i.test(texto)
  ) {
    return true;
  }
  return false;
}

/**
 * MinSalud rechaza con RVG18/RVG02 cuando el CUV ya existe; equivale a envío OK.
 * @returns {{ esDuplicado: boolean, cuv: string|null }}
 */
function evaluarRechazoCuvDuplicado(resultado) {
  if (!resultado || typeof resultado !== 'object') {
    return { esDuplicado: false, cuv: null };
  }
  if (resultado.ok) return { esDuplicado: false, cuv: null };

  if (cuvValido(resultado.codigoUnicoValidacion)) {
    return { esDuplicado: true, cuv: String(resultado.codigoUnicoValidacion).trim() };
  }

  const vals = [
    ...(Array.isArray(resultado.resultadosValidacion) ? resultado.resultadosValidacion : []),
    ...(Array.isArray(resultado.rechazos) ? resultado.rechazos : []),
  ];
  if (!vals.some(esValidacionRechazoCuvExistente)) {
    return { esDuplicado: false, cuv: null };
  }

  for (const v of vals) {
    const cuv = extraerCuvDeTexto(
      [v?.Observaciones, v?.observaciones, v?.Descripcion, v?.descripcion]
        .filter(Boolean)
        .join(' ')
    );
    if (cuvValido(cuv)) return { esDuplicado: true, cuv };
  }

  return { esDuplicado: true, cuv: null };
}

function esEnvioOkEfectivo(resultado) {
  if (!resultado) return false;
  if (resultado.ok) return true;
  return evaluarRechazoCuvDuplicado(resultado).esDuplicado;
}

/**
 * Escanea todos los JSON de resultados guardados y devuelve el CUV más reciente con envío OK.
 */
function buscarCuvEnArchivosResultado(resultadosRoot, clave) {
  const key = String(clave || '').trim();
  if (!key || !resultadosRoot || !fs.existsSync(resultadosRoot)) return null;

  let mejor = null;

  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch (_) {
      return;
    }
    for (const name of entries) {
      const full = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(full);
      } catch (_) {
        continue;
      }
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.toLowerCase().endsWith('.json')) continue;
      if (!name.startsWith(key)) continue;
      try {
        const data = JSON.parse(fs.readFileSync(full, 'utf8'));
        const claveArch = data?.paquete?.clave;
        if (claveArch !== key) continue;
        const r = data.resultado || {};
        const dup = evaluarRechazoCuvDuplicado(r);
        const okEfectivo = r.ok || dup.esDuplicado;
        if (!okEfectivo) continue;
        const cuv =
          dup.cuv ||
          r.codigoUnicoValidacion ||
          extraerCuvDeTexto(
            (Array.isArray(r.resultadosValidacion) ? r.resultadosValidacion : [])
              .map((v) => v?.Observaciones || v?.observaciones || '')
              .join(' ')
          ) ||
          extraerCuvDeDetalle(r.detalle);
        if (!cuvValido(cuv)) continue;
        const ts = String(data.fecha || '');
        if (!mejor || ts > String(mejor.fecha || '')) {
          mejor = { cuv: String(cuv).trim(), fecha: ts };
        }
      } catch (_) {
        /* ignore */
      }
    }
  };

  walk(resultadosRoot);
  return mejor?.cuv || null;
}

async function consultarCuvPorFactura({ documentoEmpresa, prefijo, noFactura }) {
  const pool = await poolPromise;
  const pref = String(prefijo || '').trim();
  const folio = String(noFactura ?? '').trim();
  const clave = claveXml(pref, noFactura);

  const result = await pool
    .request()
    .input('DocumentoEmpresa', sql.NVarChar(50), String(documentoEmpresa || '').trim())
    .input('Prefijo', sql.NVarChar(20), pref)
    .input('NoFactura', sql.NVarChar(50), folio)
    .input('Clave', sql.NVarChar(50), clave)
    .query(`
      SELECT TOP 1 RIPS.[CUV FevRips] AS Cuv
      FROM [Evaluación Entidad Rips] RIPS
      INNER JOIN Factura Fac ON RIPS.[Id Factura] = Fac.[Id Factura]
      INNER JOIN EmpresaV EmpV ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
      INNER JOIN Empresa Emp ON EmpV.[Documento Empresa] = Emp.[Documento Empresa]
      WHERE Emp.[Documento Empresa] = @DocumentoEmpresa
        AND RIPS.[CUV FevRips] IS NOT NULL
        AND LTRIM(RTRIM(RIPS.[CUV FevRips])) <> ''
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
        )
      ORDER BY RIPS.[Fecha Envio FevRips] DESC;
    `);

  const cuv = result.recordset?.[0]?.Cuv;
  return cuvValido(cuv) ? String(cuv).trim() : null;
}

async function consultarCuvPorIdEvaRips(idEvaRips) {
  const id = parseInt(idEvaRips, 10);
  if (!id || Number.isNaN(id)) return null;

  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('IdEvaRips', sql.Int, id)
    .query(`
      SELECT TOP 1 [CUV FevRips] AS Cuv
      FROM [Evaluación Entidad Rips]
      WHERE [Id Evaluación Entidad Rips] = @IdEvaRips
        AND [CUV FevRips] IS NOT NULL
        AND LTRIM(RTRIM([CUV FevRips])) <> '';
    `);

  const cuv = result.recordset?.[0]?.Cuv;
  return cuvValido(cuv) ? String(cuv).trim() : null;
}

function idsEvaRipsDesdePaquete(paquete, ripsJson) {
  const ids = new Set();
  const clave = String(paquete?.clave || '');
  const ripSinMatch =
    clave.match(/RipSin(\d+)/i) ||
    String(ripsJson?.numNota || '').match(/RipSin(\d+)/i) ||
    String(ripsJson?.numFactura || '').match(/RipSin(\d+)/i);
  if (ripSinMatch) ids.add(parseInt(ripSinMatch[1], 10));

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
  return [...ids].filter((id) => id && !Number.isNaN(id));
}

/**
 * Resuelve CUV existente: campo del paquete, BD o archivos de resultado.
 */
async function resolverCuvExistente(documentoEmpresa, paquete, opts = {}) {
  const { resultadosRoot, ripsJson } = opts;

  if (cuvValido(paquete?.cuvFevRips)) {
    return { cuv: String(paquete.cuvFevRips).trim(), origen: 'paquete' };
  }

  const u = paquete?.ultimoEnvio;
  if (cuvValido(u?.codigoUnicoValidacion)) {
    return { cuv: String(u.codigoUnicoValidacion).trim(), origen: 'ultimoEnvio' };
  }
  const detCuv = extraerCuvDeDetalle(u?.detalle);
  if (detCuv) return { cuv: detCuv, origen: 'ultimoEnvioDetalle' };

  const tipo = String(paquete?.tipo || '').toUpperCase();
  try {
    if (tipo === 'CON_FACTURA') {
      const cuvBd = await consultarCuvPorFactura({
        documentoEmpresa,
        prefijo: paquete.Prefijo,
        noFactura: paquete.NoFactura,
      });
      if (cuvBd) return { cuv: cuvBd, origen: 'bd_factura' };
    } else {
      let json = ripsJson;
      if (!json && paquete?.rutaJson && fs.existsSync(paquete.rutaJson)) {
        try {
          json = JSON.parse(fs.readFileSync(paquete.rutaJson, 'utf8'));
        } catch (_) {
          /* ignore */
        }
      }
      for (const id of idsEvaRipsDesdePaquete(paquete, json)) {
        const cuvBd = await consultarCuvPorIdEvaRips(id);
        if (cuvBd) return { cuv: cuvBd, origen: 'bd_idEvaRips' };
      }
    }
  } catch (err) {
    console.warn('[fevrips] resolverCuvExistente BD:', err.message || err);
  }

  if (resultadosRoot && paquete?.clave) {
    const cuvArch = buscarCuvEnArchivosResultado(resultadosRoot, paquete.clave);
    if (cuvArch) return { cuv: cuvArch, origen: 'archivo' };
  }

  return { cuv: null, origen: null };
}

function resolverCuvDesdeCampos(paquete) {
  if (cuvValido(paquete?.cuvFevRips)) return String(paquete.cuvFevRips).trim();
  const u = paquete?.ultimoEnvio;
  if (cuvValido(u?.codigoUnicoValidacion)) return String(u.codigoUnicoValidacion).trim();
  return extraerCuvDeDetalle(u?.detalle) || extraerCuvDeDetalle(paquete?.cuvFevRips);
}

module.exports = {
  cuvValido,
  extraerCuvDeDetalle,
  extraerCuvDeTexto,
  esValidacionRechazoCuvExistente,
  evaluarRechazoCuvDuplicado,
  esEnvioOkEfectivo,
  buscarCuvEnArchivosResultado,
  resolverCuvExistente,
  resolverCuvDesdeCampos,
  consultarCuvPorFactura,
  consultarCuvPorIdEvaRips,
};

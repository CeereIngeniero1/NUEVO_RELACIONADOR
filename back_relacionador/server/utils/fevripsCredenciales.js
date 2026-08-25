/**
 * Credenciales LoginSISPRO por empresa (API Docker FEV-RIPS).
 * Prioridad: SQL CredencialesSisproFevRips → archivo JSON en data root.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { getRipsDataRoot } = require('../config/paths');

function sanitizeEmpresa(doc) {
  return String(doc || '')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.+$/g, '') || '';
}

function filePathCredenciales() {
  return path.join(getRipsDataRoot(), 'config', 'credenciales-sispro-fevrips.json');
}

function normalizeCred(raw, documentoEmpresa) {
  if (!raw || typeof raw !== 'object') return null;
  const tipoDocumento = String(raw.tipoDocumento || raw.TipoDocumento || raw['Tipo Documento'] || 'CC').trim();
  const numeroDocumento = String(raw.numeroDocumento || raw.NumeroDocumento || raw['Numero Documento'] || '').trim();
  const clave = String(raw.clave || raw.Clave || '').trim();
  const nit = String(raw.nit || raw.Nit || documentoEmpresa || '').trim();
  const tipoUsuario = String(raw.tipoUsuario || raw.TipoUsuario || raw['Tipo Usuario'] || 'RE').trim() || 'RE';
  if (!numeroDocumento || !clave || !nit) return null;
  return {
    documentoEmpresa: String(documentoEmpresa || raw.documentoEmpresa || '').trim(),
    tipoDocumento,
    numeroDocumento,
    clave,
    nit,
    tipoUsuario,
  };
}

function readFileStore() {
  const p = filePathCredenciales();
  try {
    if (!fs.existsSync(p)) return {};
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return data && typeof data === 'object' ? data : {};
  } catch (err) {
    console.error('[fevripsCredenciales] Error leyendo archivo:', err.message || err);
    return {};
  }
}

function writeFileStore(store) {
  const p = filePathCredenciales();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf8');
}

async function getFromSql(documentoEmpresa) {
  try {
    const { sql, poolPromise } = require('../db2');
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('DocumentoEmpresa', sql.NVarChar(50), String(documentoEmpresa))
      .query(`
        SELECT TOP 1
          [Documento Empresa] AS documentoEmpresa,
          [Tipo Documento] AS tipoDocumento,
          [Numero Documento] AS numeroDocumento,
          [Clave] AS clave,
          [Nit] AS nit,
          [Tipo Usuario] AS tipoUsuario
        FROM CredencialesSisproFevRips
        WHERE [Documento Empresa] = @DocumentoEmpresa
          AND ISNULL([Activo], 1) = 1
      `);
    const row = result.recordset && result.recordset[0];
    return normalizeCred(row, documentoEmpresa);
  } catch (err) {
    // Tabla ausente u otro error SQL → fallback archivo
    if (!/Invalid object name|no existe|does not exist/i.test(String(err.message || err))) {
      console.warn('[fevripsCredenciales] SQL no disponible, usando archivo:', err.message || err);
    }
    return null;
  }
}

async function upsertSql(cred) {
  try {
    const { sql, poolPromise } = require('../db2');
    const pool = await poolPromise;
    await pool
      .request()
      .input('DocumentoEmpresa', sql.NVarChar(50), cred.documentoEmpresa)
      .input('TipoDocumento', sql.NVarChar(10), cred.tipoDocumento)
      .input('NumeroDocumento', sql.NVarChar(50), cred.numeroDocumento)
      .input('Clave', sql.NVarChar(200), cred.clave)
      .input('Nit', sql.NVarChar(50), cred.nit)
      .input('TipoUsuario', sql.NVarChar(10), cred.tipoUsuario)
      .query(`
        MERGE CredencialesSisproFevRips AS t
        USING (SELECT @DocumentoEmpresa AS [Documento Empresa]) AS s
          ON t.[Documento Empresa] = s.[Documento Empresa]
        WHEN MATCHED THEN UPDATE SET
          [Tipo Documento] = @TipoDocumento,
          [Numero Documento] = @NumeroDocumento,
          [Clave] = @Clave,
          [Nit] = @Nit,
          [Tipo Usuario] = @TipoUsuario,
          [Activo] = 1,
          [Fecha Actualizacion] = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT (
          [Documento Empresa], [Tipo Documento], [Numero Documento], [Clave], [Nit], [Tipo Usuario], [Activo]
        ) VALUES (
          @DocumentoEmpresa, @TipoDocumento, @NumeroDocumento, @Clave, @Nit, @TipoUsuario, 1
        );
      `);
    return true;
  } catch (err) {
    console.warn('[fevripsCredenciales] No se pudo guardar en SQL:', err.message || err);
    return false;
  }
}

/**
 * @returns {Promise<object|null>} credenciales normalizadas (incluye clave)
 */
async function obtenerCredenciales(documentoEmpresa) {
  const key = sanitizeEmpresa(documentoEmpresa);
  if (!key) return null;

  const fromSql = await getFromSql(key);
  if (fromSql) return fromSql;

  const store = readFileStore();
  return normalizeCred(store[key], key);
}

/**
 * Guarda en SQL (si existe) y siempre en archivo como respaldo.
 */
async function guardarCredenciales(documentoEmpresa, payload) {
  const key = sanitizeEmpresa(documentoEmpresa);
  if (!key) {
    const err = new Error('documentoEmpresa requerido');
    err.status = 400;
    throw err;
  }

  const prev = await obtenerCredenciales(key);
  const merged = {
    ...(prev || {}),
    ...payload,
    documentoEmpresa: key,
  };
  // Si no envían clave nueva, conservar la anterior
  if (!String(merged.clave || '').trim() && prev?.clave) {
    merged.clave = prev.clave;
  }

  const cred = normalizeCred(merged, key);
  if (!cred) {
    const err = new Error('Faltan tipoDocumento, numeroDocumento, clave o nit');
    err.status = 400;
    throw err;
  }
  await upsertSql(cred);
  const store = readFileStore();
  store[key] = {
    tipoDocumento: cred.tipoDocumento,
    numeroDocumento: cred.numeroDocumento,
    clave: cred.clave,
    nit: cred.nit,
    tipoUsuario: cred.tipoUsuario,
  };
  writeFileStore(store);
  return {
    documentoEmpresa: key,
    tipoDocumento: cred.tipoDocumento,
    numeroDocumento: cred.numeroDocumento,
    nit: cred.nit,
    tipoUsuario: cred.tipoUsuario,
  };
}

/** Vista pública (sin clave). */
async function obtenerCredencialesPublicas(documentoEmpresa) {
  const c = await obtenerCredenciales(documentoEmpresa);
  if (!c) return null;
  return {
    documentoEmpresa: c.documentoEmpresa,
    tipoDocumento: c.tipoDocumento,
    numeroDocumento: c.numeroDocumento,
    nit: c.nit,
    tipoUsuario: c.tipoUsuario,
    tieneClave: Boolean(c.clave),
  };
}

module.exports = {
  obtenerCredenciales,
  obtenerCredencialesPublicas,
  guardarCredenciales,
  filePathCredenciales,
};

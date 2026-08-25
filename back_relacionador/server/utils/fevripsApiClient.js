/**
 * Cliente HTTP hacia API Docker FEV-RIPS (MinSalud).
 * LoginSISPRO + CargarFevRips / CargarRipsSinFactura (body gzip).
 */
'use strict';

const https = require('https');
const http = require('http');
const zlib = require('zlib');
const { URL } = require('url');
const { obtenerCredenciales } = require('./fevripsCredenciales');

const tokenCache = new Map(); // documentoEmpresa -> { token, expiresAt }

function baseUrl() {
  return String(process.env.FEVRIPS_API_BASE_URL || 'https://localhost:9443').replace(/\/+$/, '');
}

function ambienteConfigurado() {
  return String(process.env.FEVRIPS_AMBIENTE || 'stage').trim().toLowerCase() || 'stage';
}

function assertAmbientePermitido() {
  const amb = ambienteConfigurado();
  if (amb === 'prod' || amb === 'production') {
    const allow = ['1', 'true', 'yes', 'on'].includes(
      String(process.env.FEVRIPS_ALLOW_PRODUCTION || '').trim().toLowerCase()
    );
    if (!allow) {
      const err = new Error(
        'FEVRIPS en producción bloqueado. Defina FEVRIPS_ALLOW_PRODUCTION=1 y FEVRIPS_AMBIENTE=prod'
      );
      err.status = 403;
      err.code = 'FEVRIPS_PROD_BLOCKED';
      throw err;
    }
  }
  return amb;
}

function timeoutMs() {
  const n = Number(process.env.FEVRIPS_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : 120000;
}

function tlsRejectUnauthorized() {
  const v = String(process.env.FEVRIPS_TLS_REJECT_UNAUTHORIZED || 'false').trim().toLowerCase();
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return true;
}

function extractToken(body) {
  if (body == null) return null;
  if (typeof body === 'string') {
    const t = body.trim();
    if (!t) return null;
    if (t.startsWith('{')) {
      try {
        return extractToken(JSON.parse(t));
      } catch (_) {
        return t.replace(/^"|"$/g, '');
      }
    }
    return t.replace(/^"|"$/g, '');
  }
  if (typeof body !== 'object') return null;
  const candidates = [
    body.token,
    body.Token,
    body.accessToken,
    body.access_token,
    body.jwt,
    body.Jwt,
    body.bearerToken,
    body.data && (body.data.token || body.data.Token || body.data.accessToken),
    body.result && (body.result.token || body.result.Token),
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
}

function requestRaw({ method, urlString, headers, bodyBuffer }) {
  return new Promise((resolve, reject) => {
    const ms = timeoutMs();
    let settled = false;
    let req;
    const timer = setTimeout(() => {
      if (req) req.destroy();
      const err = new Error(`FEVRIPS timeout (${ms} ms)`);
      err.code = 'FEVRIPS_TIMEOUT';
      err.status = 504;
      finish(err);
    }, ms);

    const finish = (err, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(err);
      else resolve(val);
    };

    let u;
    try {
      u = new URL(urlString);
    } catch (e) {
      return finish(e);
    }

    const isHttps = u.protocol === 'https:';
    const lib = isHttps ? https : http;
    const opts = {
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + (u.search || ''),
      method: method || 'POST',
      headers: headers || {},
      rejectUnauthorized: isHttps ? tlsRejectUnauthorized() : undefined,
    };

    req = lib.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const text = buf.toString('utf8');
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (_) {
          json = null;
        }
        finish(null, {
          status: res.statusCode || 0,
          headers: res.headers,
          text,
          json,
        });
      });
    });
    req.on('error', (e) => finish(e));
    if (bodyBuffer && bodyBuffer.length) req.write(bodyBuffer);
    req.end();
  });
}

function gzipJson(obj) {
  const json = Buffer.from(JSON.stringify(obj), 'utf8');
  return zlib.gzipSync(json);
}

function normalizeCargarResponse(json, httpStatus) {
  const r = json && typeof json === 'object' ? json : {};
  const resultState = r.ResultState === true || r.resultState === true;
  const cuv = r.CodigoUnicoValidacion || r.codigoUnicoValidacion || null;
  const validaciones = r.ResultadosValidacion || r.resultadosValidacion || [];
  const rechazos = (Array.isArray(validaciones) ? validaciones : []).filter((v) =>
    /rechaz/i.test(String(v.Clase || v.clase || ''))
  );
  return {
    ok: resultState,
    httpStatus,
    resultState,
    procesoId: r.ProcesoId != null ? r.ProcesoId : r.procesoId,
    numFactura: r.NumFactura || r.numFactura || null,
    codigoUnicoValidacion: typeof cuv === 'string' && !/no aplica/i.test(cuv) ? cuv : resultState ? cuv : null,
    fechaRadicacion: r.FechaRadicacion || r.fechaRadicacion || null,
    ambiente: r.Ambiente || r.ambiente || null,
    modulo: r.Modulo || r.modulo || null,
    resultadosValidacion: validaciones,
    rechazos,
    raw: r,
  };
}

async function loginSispro(documentoEmpresa) {
  assertAmbientePermitido();
  const key = String(documentoEmpresa || '').trim();
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > Date.now() && cached.token) {
    return cached.token;
  }

  const cred = await obtenerCredenciales(key);
  if (!cred) {
    const err = new Error(
      `Sin credenciales SISPRO para empresa ${key}. Configure GET/PUT /RIPS/fevrips/credenciales/${key}`
    );
    err.status = 400;
    err.code = 'FEVRIPS_NO_CREDS';
    throw err;
  }

  const body = {
    persona: {
      identificacion: {
        tipo: cred.tipoDocumento,
        numero: cred.numeroDocumento,
      },
    },
    clave: cred.clave,
    nit: cred.nit,
    tipoUsuario: cred.tipoUsuario || 'RE',
  };

  const url = `${baseUrl()}/api/Auth/LoginSISPRO`;
  const payload = Buffer.from(JSON.stringify(body), 'utf8');
  const res = await requestRaw({
    method: 'POST',
    urlString: url,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
    },
    bodyBuffer: payload,
  });

  if (res.status < 200 || res.status >= 300) {
    const err = new Error(
      `LoginSISPRO HTTP ${res.status}: ${(res.text || '').slice(0, 400)}`
    );
    err.status = 502;
    err.code = 'FEVRIPS_LOGIN_FAILED';
    err.detail = res.json || res.text;
    throw err;
  }

  const token = extractToken(res.json != null ? res.json : res.text);
  if (!token) {
    const err = new Error('LoginSISPRO no devolvió token reconocible');
    err.status = 502;
    err.code = 'FEVRIPS_NO_TOKEN';
    err.detail = res.json || res.text;
    throw err;
  }

  tokenCache.set(key, { token, expiresAt: Date.now() + 25 * 60 * 1000 });
  return token;
}

async function postPaqueteGzip(pathSuffix, token, bodyObj) {
  assertAmbientePermitido();
  const gz = gzipJson(bodyObj);
  const url = `${baseUrl()}${pathSuffix}`;
  const res = await requestRaw({
    method: 'POST',
    urlString: url,
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
      Authorization: `Bearer ${token}`,
      'Content-Length': gz.length,
    },
    bodyBuffer: gz,
  });

  if (res.status < 200 || res.status >= 300) {
    return {
      ...normalizeCargarResponse(res.json || {}, res.status),
      ok: false,
      httpError: true,
      message: `HTTP ${res.status}: ${(res.text || '').slice(0, 500)}`,
      rawText: res.text,
    };
  }

  return normalizeCargarResponse(res.json || {}, res.status);
}

/**
 * @param {string} documentoEmpresa
 * @param {object} rips — JSON RIPS 2275
 * @param {string} xmlBase64 — AttachedDocument en Base64
 */
async function cargarFevRips(documentoEmpresa, rips, xmlBase64) {
  const token = await loginSispro(documentoEmpresa);
  return postPaqueteGzip('/api/PaquetesFevRips/CargarFevRips', token, {
    rips,
    xmlFevFile: xmlBase64 || '',
  });
}

async function cargarRipsSinFactura(documentoEmpresa, rips) {
  const token = await loginSispro(documentoEmpresa);
  return postPaqueteGzip('/api/PaquetesFevRips/CargarRipsSinFactura', token, {
    rips,
    xmlFevFile: '',
  });
}

function clearTokenCache(documentoEmpresa) {
  if (documentoEmpresa) tokenCache.delete(String(documentoEmpresa).trim());
  else tokenCache.clear();
}

module.exports = {
  baseUrl,
  ambienteConfigurado,
  assertAmbientePermitido,
  loginSispro,
  cargarFevRips,
  cargarRipsSinFactura,
  normalizeCargarResponse,
  clearTokenCache,
  extractToken,
};

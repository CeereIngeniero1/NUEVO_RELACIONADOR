const { Request, TYPES } = require('tedious');
const Router = require('express').Router;
const connection = require('../db');
// const pool = require('../db2');
// const { connectToDatabase, config } = require('../db2');
const { sql, poolPromise } = require('../db2');
const { loadDotEnvFromCandidates } = require('../config/envLoader');
const https = require('https');
const fs = require('fs');
const path = require('path');

loadDotEnvFromCandidates();

const httpRaw = (url, { method = 'GET', headers = {}, body = null } = {}) =>
    new Promise((resolve, reject) => {
        try {
            const u = new URL(url);
            const opts = {
                method,
                hostname: u.hostname,
                path: `${u.pathname}${u.search || ''}`,
                headers,
            };
            const req = https.request(opts, (resp) => {
                let data = '';
                resp.on('data', (chunk) => { data += chunk; });
                resp.on('end', () => {
                    resolve({
                        status: resp.statusCode || 0,
                        headers: resp.headers || {},
                        body: data || '',
                    });
                });
            });
            req.on('error', reject);
            if (body) req.write(body);
            req.end();
        } catch (e) {
            reject(e);
        }
    });

class ICD11_API {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.whoToken = null;
        this.whoTokenExpiry = null;
        this.baseUrl = 'https://id.who.int/icd/release/11/2024-01/mms';
        this.ihceCatalogCache = null;
        this.ihceCatalogExpiry = 0;
        this.ihceToken = null;
        this.ihceTokenExpiry = 0;
        this.lastIhceError = '';
        this.localCatalogCache = null;
        this.localCatalogExpiry = 0;
        this.dbCatalogCache = null;
        this.dbCatalogExpiry = 0;
        this.dbTableEnsured = false;
    }

    async getWhoAccessToken() {
        if (this.whoToken && Date.now() < this.whoTokenExpiry) {
            return this.whoToken;
        }

        const authUrl = 'https://icdaccessmanagement.who.int/connect/token';
        const params = new URLSearchParams({
            'client_id': this.clientId,
            'client_secret': this.clientSecret,
            'scope': 'icdapi_access',
            'grant_type': 'client_credentials'
        });

        try {
            const response = await fetch(authUrl, {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const data = await response.json();
            this.whoToken = data.access_token;
            this.whoTokenExpiry = Date.now() + (data.expires_in * 1000);
            return this.whoToken;
        } catch (error) {
            console.error('Error obteniendo el token:', error);
        }
    }

    resolveIhceConfig() {
        const firstEnv = (...keys) => {
            for (const k of keys) {
                const v = process.env[k];
                if (v != null && String(v).trim() !== '') return String(v).trim();
            }
            return '';
        };
        // CIE-11 catálogo: forzado a PRODUCCIÓN (sin fallback a sandbox).
        const preferProd = true;
        const prefix = 'IHCE_PROD_';

        const baseUrl = firstEnv(`${prefix}BASE_URL`, 'IHCE_API_BASE_URL_PROD', 'IHCE_API_BASE_URL', 'IHCE_BASE_URL');
        const tenantId = firstEnv(`${prefix}TENANT_ID`, 'IHCE_TENANT_ID');
        const clientId = firstEnv(`${prefix}CLIENT_ID`, 'IHCE_CLIENT_ID');
        const clientSecret = firstEnv(`${prefix}CLIENT_SECRET`, 'IHCE_CLIENT_SECRET');
        const scope = firstEnv(`${prefix}SCOPE`, 'IHCE_SCOPE');
        const subscriptionKey = firstEnv(
            `${prefix}SUBSCRIPTION_KEY`,
            'IHCE_APIM_SUBSCRIPTION_KEY_PROD',
            'IHCE_APIM_SUBSCRIPTION_KEY',
            'IHCE_SUBSCRIPTION_KEY',
            'OCP_APIM_SUBSCRIPTION_KEY'
        );
        const codeSystem = firstEnv('IHCE_ICD11_CODESYSTEM') || 'ICD11Codes';
        return { baseUrl, tenantId, clientId, clientSecret, scope, subscriptionKey, codeSystem, preferProd };
    }

    async getIhceAccessToken() {
        if (this.ihceToken && Date.now() < this.ihceTokenExpiry) return this.ihceToken;
        const cfg = this.resolveIhceConfig();
        if (!cfg.tenantId || !cfg.clientId || !cfg.clientSecret || !cfg.scope) {
            this.lastIhceError = 'Faltan credenciales OAuth2 IHCE en variables de entorno.';
            return null;
        }
        const authUrl = `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`;
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: cfg.clientId,
            client_secret: cfg.clientSecret,
            scope: cfg.scope,
        }).toString();
        const resp = await httpRaw(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
            body,
        });
        if (resp.status !== 200) {
            this.lastIhceError = `Token IHCE fallo (HTTP ${resp.status}).`;
            return null;
        }
        const json = (() => {
            try { return JSON.parse(resp.body || '{}'); } catch (_) { return null; }
        })();
        const token = json && json.access_token ? String(json.access_token) : '';
        if (!token) {
            this.lastIhceError = 'Token IHCE sin access_token.';
            return null;
        }
        this.ihceToken = token;
        this.ihceTokenExpiry = Date.now() + ((Number(json.expires_in) || 3000) * 1000);
        return this.ihceToken;
    }

    flattenConcepts(concepts, out) {
        const list = Array.isArray(concepts) ? concepts : [];
        list.forEach((c) => {
            const code = c && c.code != null ? String(c.code).trim() : '';
            const display = c && c.display != null ? String(c.display).trim() : '';
            if (code) out.push({ theCode: code, title: display || code });
            if (c && Array.isArray(c.concept) && c.concept.length) this.flattenConcepts(c.concept, out);
        });
    }

    flattenExpansionContains(contains, out) {
        const list = Array.isArray(contains) ? contains : [];
        list.forEach((c) => {
            const code = c && c.code != null ? String(c.code).trim() : '';
            const display = c && c.display != null ? String(c.display).trim() : '';
            if (code) out.push({ theCode: code, title: display || code });
            if (c && Array.isArray(c.contains) && c.contains.length) this.flattenExpansionContains(c.contains, out);
        });
    }

    async getIhceCatalog(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && this.ihceCatalogCache && now < this.ihceCatalogExpiry) {
            return this.ihceCatalogCache;
        }
        const cfg = this.resolveIhceConfig();
        if (!cfg.baseUrl || !cfg.subscriptionKey) {
            this.lastIhceError = 'Faltan BASE_URL o SUBSCRIPTION_KEY para IHCE.';
            return null;
        }
        const token = await this.getIhceAccessToken();
        if (!token) return null;
        const base = cfg.baseUrl.replace(/\/$/, '');
        const headers = {
            Authorization: `Bearer ${token}`,
            'Ocp-Apim-Subscription-Key': cfg.subscriptionKey,
            Accept: 'application/fhir+json',
        };

        let flat = [];
        let lastStatus = 0;

        // 1) Intento por CodeSystem (algunos ambientes lo exponen así)
        try {
            const urlCodeSystem = `${base}/CodeSystem/${encodeURIComponent(cfg.codeSystem)}`;
            const resp = await httpRaw(urlCodeSystem, { headers });
            lastStatus = resp.status || 0;
            if (resp.status >= 200 && resp.status < 300) {
                const json = (() => {
                    try { return JSON.parse(resp.body || '{}'); } catch (_) { return null; }
                })();
                if (json) this.flattenConcepts(json.concept, flat);
            }
        } catch (_) {}

        // 2) Fallback por ValueSet/$expand (más común para ICD11Codes en IHCE)
        if (!flat.length) {
            try {
                const urlVsExpand = `${base}/ValueSet/${encodeURIComponent(cfg.codeSystem)}/$expand`;
                const resp = await httpRaw(urlVsExpand, { headers });
                lastStatus = resp.status || lastStatus;
                if (resp.status >= 200 && resp.status < 300) {
                    const json = (() => {
                        try { return JSON.parse(resp.body || '{}'); } catch (_) { return null; }
                    })();
                    if (json && json.expansion) this.flattenExpansionContains(json.expansion.contains, flat);
                }
            } catch (_) {}
        }

        // 3) Fallback POST /ValueSet/$expand con Parameters(url)
        if (!flat.length) {
            try {
                const urlVsExpandPost = `${base}/ValueSet/$expand`;
                const body = JSON.stringify({
                    resourceType: 'Parameters',
                    parameter: [
                        { name: 'url', valueUri: `https://fhir.minsalud.gov.co/rda/ValueSet/${cfg.codeSystem}` },
                    ],
                });
                const resp = await httpRaw(urlVsExpandPost, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/fhir+json', 'Content-Length': Buffer.byteLength(body) },
                    body,
                });
                lastStatus = resp.status || lastStatus;
                if (resp.status >= 200 && resp.status < 300) {
                    const json = (() => {
                        try { return JSON.parse(resp.body || '{}'); } catch (_) { return null; }
                    })();
                    if (json && json.expansion) this.flattenExpansionContains(json.expansion.contains, flat);
                }
            } catch (_) {}
        }

        if (!flat.length) {
            this.lastIhceError = `Catalogo ICD11Codes fallo (HTTP ${lastStatus || 0}) en ${cfg.preferProd ? 'prod' : 'sandbox'}.`;
            return null;
        }

        // deduplicar por código
        const dedup = [];
        const seen = new Set();
        flat.forEach((x) => {
            const k = String(x && x.theCode ? x.theCode : '').trim().toUpperCase();
            if (!k || seen.has(k)) return;
            seen.add(k);
            dedup.push({ theCode: x.theCode, title: x.title || x.theCode });
        });
        flat = dedup;

        this.lastIhceError = '';
        this.ihceCatalogCache = flat;
        this.ihceCatalogExpiry = now + (15 * 60 * 1000);
        return flat;
    }

    resolveMappingCatalogPath() {
        const candidates = [
            process.env.ICD11_MAPPING_FILE,
            path.resolve(__dirname, '..', '..', 'data', 'mapping-cie10-cie-11', '11To10MapToOneCategory.txt'),
            path.resolve(__dirname, '..', '..', 'data', 'mapping-cie10-cie-11', '10To11MapToOneCategory.txt'),
            'C:/Users/ceere/Downloads/mapping-cie10-cie-11/11To10MapToOneCategory.txt',
            'C:/Users/ceere/Downloads/mapping-cie10-cie-11/10To11MapToOneCategory.txt',
        ].filter(Boolean);
        return candidates.find((p) => {
            try { return fs.existsSync(p); } catch (_) { return false; }
        }) || '';
    }

    loadLocalCatalogFromMapping(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && this.localCatalogCache && now < this.localCatalogExpiry) {
            return this.localCatalogCache;
        }
        const filePath = this.resolveMappingCatalogPath();
        if (!filePath) return null;
        try {
            const txt = fs.readFileSync(filePath, 'utf8');
            const lines = txt.split(/\r?\n/).filter((x) => String(x || '').trim() !== '');
            if (lines.length < 2) return null;
            const header = lines[0].split('\t').map((x) => String(x || '').trim().toLowerCase());
            const idxCode = header.findIndex((h) => h.includes('icd11code') || h === 'icd11code');
            const idxTitle = header.findIndex((h) => h.includes('icd11title') || h === 'icd11title');
            if (idxCode < 0 || idxTitle < 0) return null;
            const out = [];
            const seen = new Set();
            for (let i = 1; i < lines.length; i += 1) {
                const cols = lines[i].split('\t');
                const code = String(cols[idxCode] || '').trim();
                const title = String(cols[idxTitle] || '').trim();
                if (!code) continue;
                const key = code.toUpperCase();
                if (seen.has(key)) continue;
                seen.add(key);
                out.push({ theCode: code, title: title || code });
            }
            if (!out.length) return null;
            this.localCatalogCache = out;
            this.localCatalogExpiry = now + (30 * 60 * 1000);
            return out;
        } catch (_) {
            return null;
        }
    }

    async ensureDbCatalogTable() {
        if (this.dbTableEnsured) return;
        const pool = await poolPromise;
        await pool.request().query(`
            IF OBJECT_ID('dbo.CIE11_Codigos', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.CIE11_Codigos
                (
                    IdCIE11 INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    Codigo NVARCHAR(50) NOT NULL,
                    Nombre NVARCHAR(500) NOT NULL,
                    DefinicionUrl NVARCHAR(1000) NULL,
                    FechaCarga DATETIME2(0) NOT NULL CONSTRAINT DF_CIE11_Codigos_FechaCarga DEFAULT (SYSDATETIME())
                );
                CREATE UNIQUE INDEX UX_CIE11_Codigos_Codigo ON dbo.CIE11_Codigos(Codigo);
                CREATE INDEX IX_CIE11_Codigos_Nombre ON dbo.CIE11_Codigos (Nombre);
            END
        `);
        this.dbTableEnsured = true;
    }

    async loadCatalogFromDb(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && this.dbCatalogCache && now < this.dbCatalogExpiry) {
            return this.dbCatalogCache;
        }
        await this.ensureDbCatalogTable();
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT Codigo, Nombre
            FROM dbo.CIE11_Codigos WITH (NOLOCK)
            ORDER BY Codigo
        `);
        const rows = Array.isArray(result.recordset) ? result.recordset : [];
        if (!rows.length) return [];
        const list = rows.map((r) => ({
            theCode: String(r.Codigo || '').trim(),
            title: String(r.Nombre || '').trim() || String(r.Codigo || '').trim(),
        })).filter((x) => x.theCode);
        this.dbCatalogCache = list;
        this.dbCatalogExpiry = now + (20 * 60 * 1000);
        return list;
    }

    async replaceCatalogInDb(list, source) {
        const arr = Array.isArray(list) ? list : [];
        if (!arr.length) return;
        await this.ensureDbCatalogTable();
        const pool = await poolPromise;
        await pool.request().query(`TRUNCATE TABLE dbo.CIE11_Codigos;`);
        const table = new sql.Table('dbo.CIE11_Codigos');
        table.create = false;
        table.columns.add('Codigo', sql.NVarChar(50), { nullable: false });
        table.columns.add('Nombre', sql.NVarChar(500), { nullable: false });
        table.columns.add('DefinicionUrl', sql.NVarChar(1000), { nullable: true });
        table.columns.add('FechaCarga', sql.DateTime2(0), { nullable: false });
        const now = new Date();
        arr.forEach((x) => {
            const code = String(x && x.theCode ? x.theCode : '').trim();
            const title = String(x && x.title ? x.title : code).trim();
            if (!code) return;
            table.rows.add(code, title || code, null, now);
        });
        await pool.request().bulk(table);
        this.dbCatalogCache = arr.map((x) => ({ theCode: x.theCode, title: x.title }));
        this.dbCatalogExpiry = Date.now() + (20 * 60 * 1000);
    }

    async resolveCatalogForUse(forceRefresh = false) {
        // 1) BD (fuente principal)
        const dbList = await this.loadCatalogFromDb(forceRefresh);
        if (Array.isArray(dbList) && dbList.length) {
            return { list: dbList, source: 'db' };
        }
        // 2) IHCE prod (si disponible), y persistir a BD
        const ihceList = await this.getIhceCatalog(forceRefresh);
        if (Array.isArray(ihceList) && ihceList.length) {
            await this.replaceCatalogInDb(ihceList, 'ihce-prod');
            return { list: ihceList, source: 'ihce-prod' };
        }
        // 3) Mapping local como bootstrap de BD
        const localList = this.loadLocalCatalogFromMapping(forceRefresh);
        if (Array.isArray(localList) && localList.length) {
            await this.replaceCatalogInDb(localList, 'mapping-local');
            return { list: localList, source: 'mapping-local' };
        }
        return { list: [], source: 'none' };
    }

    async search(query) {
        const q = String(query || '').trim();

        // Fuente principal: tabla local 1888 (dbo.CIE11_Codigos).
        try {
            await this.ensureDbCatalogTable();
            const pool = await poolPromise;
            if (!q) {
                const topRs = await pool.request().query(`
                    SELECT TOP (50) Codigo, Nombre
                    FROM dbo.CIE11_Codigos WITH (NOLOCK)
                    ORDER BY Codigo
                `);
                const topRows = Array.isArray(topRs.recordset) ? topRs.recordset : [];
                if (topRows.length) {
                    return topRows.map((r) => ({
                        theCode: String(r.Codigo || '').trim(),
                        title: String(r.Nombre || '').trim() || String(r.Codigo || '').trim(),
                    })).filter((x) => x.theCode);
                }
            } else {
                const rs = await pool.request()
                    .input('q', sql.NVarChar(200), `%${q}%`)
                    .query(`
                        SELECT TOP (120) Codigo, Nombre
                        FROM dbo.CIE11_Codigos WITH (NOLOCK)
                        WHERE Codigo LIKE @q
                           OR Nombre LIKE @q
                        ORDER BY
                            CASE WHEN Codigo LIKE REPLACE(@q, '%', '') + '%' THEN 0 ELSE 1 END,
                            Codigo
                    `);
                const rows = Array.isArray(rs.recordset) ? rs.recordset : [];
                if (rows.length) {
                    return rows.map((r) => ({
                        theCode: String(r.Codigo || '').trim(),
                        title: String(r.Nombre || '').trim() || String(r.Codigo || '').trim(),
                    })).filter((x) => x.theCode);
                }
            }
        } catch (dbErr) {
            console.error('Error buscando CIE-11 en tabla dbo.CIE11_Codigos:', dbErr);
        }

        // Fallback: API OMS si la tabla no tiene datos.
        const token = await this.getWhoAccessToken();
        if (!token || !q) return [];
        try {
            const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(q)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Accept-Language': 'es',
                    'API-Version': 'v2'
                }
            });
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data && data.destinationEntities) ? data.destinationEntities : [];
        } catch (error) {
            console.error('Error en la búsqueda CIE-11 (OMS):', error);
            return [];
        }
    }

    async findByCode(code) {
        const q = String(code || '').trim();
        if (!q) return null;

        // Fuente principal: tabla local 1888 (dbo.CIE11_Codigos).
        try {
            await this.ensureDbCatalogTable();
            const pool = await poolPromise;
            const local = await pool.request()
                .input('code', sql.NVarChar(50), q)
                .query(`
                    SELECT TOP (1) Codigo, Nombre
                    FROM dbo.CIE11_Codigos WITH (NOLOCK)
                    WHERE UPPER(LTRIM(RTRIM(Codigo))) = UPPER(LTRIM(RTRIM(@code)))
                `);
            const row = local && Array.isArray(local.recordset) ? local.recordset[0] : null;
            if (row && row.Codigo) {
                const codeResolved = String(row.Codigo || '').trim().toUpperCase();
                return {
                    theCode: codeResolved,
                    title: String(row.Nombre || '').trim() || codeResolved,
                };
            }
        } catch (dbErr) {
            console.error('Error validando CIE-11 en tabla dbo.CIE11_Codigos:', dbErr);
        }

        // Fallback: API OMS.
        const token = await this.getWhoAccessToken();
        if (!token) return null;
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Accept-Language': 'es',
                'API-Version': 'v2'
            };
            const response = await fetch(`${this.baseUrl}/codeinfo/${encodeURIComponent(q)}`, {
                headers
            });
            if (!response.ok) return null;
            const info = await response.json();
            const stemId = info && info.stemId ? String(info.stemId).trim() : '';
            let title = '';
            if (stemId) {
                const stemResp = await fetch(stemId.replace('http://', 'https://'), { headers });
                if (stemResp.ok) {
                    const stem = await stemResp.json();
                    const t = stem && stem.title;
                    title = typeof t === 'string' ? t : (t && (t['@value'] || t.value) ? (t['@value'] || t.value) : '');
                }
            }
            const codeResolved = (info && info.code ? String(info.code).trim() : q).toUpperCase();
            return {
                theCode: codeResolved,
                title: title || codeResolved
            };
        } catch (error) {
            console.error('Error buscando CIE-11 por código (OMS):', error);
            return null;
        }
    }
}

const icd11 = new ICD11_API(
    '1913f18a-af2d-48d8-9df4-9433f2bf9731_5f1075a7-1c1d-4769-b8ad-b781f383f2cd',
    'BG8b5btjWH12ePWemxjurAfyOLXTllz7HL4C2BpohUk='
);
//se deja como ejemplo de retorno de la API de ICD-11
//Aca se configura los Ripos por defecto, ojo en el futuro se debe habilitar la manera para que esto se haga desde el 
//relacionador y exista rips por defecto para cada profesional
const defaultCIE11 = [
    // { theCode: '1B10', title: 'Tuberculosis de los pulmones' },
    // { theCode: '5A11', title: 'Diabetes mellitus tipo 2' },
    // { theCode: 'BA41', title: 'Insuficiencia cardíaca' },
    // { theCode: '1D0Z', title: 'Infección viral de sitio no especificado' },
    // { theCode: '6D70', title: 'Trastorno de ansiedad generalizada' }
];

const router = Router();

router.get('/icd11/code/:code', async (req, res) => {
    try {
        const code = req.params.code;
        if (!code || !String(code).trim()) return res.json({ ok: false, item: null });
        const item = await icd11.findByCode(String(code).trim());
        return res.json({ ok: Boolean(item), item: item || null });
    } catch (error) {
        console.error('Error en ruta CIE-11 por código:', error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
    }
});

router.get('/icd11/validate/:code', async (req, res) => {
    try {
        const code = String(req.params.code || '').trim();
        if (!code) return res.json({ ok: false, valid: false, item: null });
        const item = await icd11.findByCode(code);
        return res.json({ ok: true, valid: Boolean(item), item: item || null });
    } catch (error) {
        console.error('Error validando CIE-11:', error);
        return res.status(500).json({ ok: false, valid: false, error: error.message || String(error) });
    }
});

router.get('/icd11/catalog', async (req, res) => {
    try {
        const forceRefresh = String(req.query.refresh || '').trim() === '1';
        const resolved = await icd11.resolveCatalogForUse(forceRefresh);
        const list = resolved.list;
        const source = resolved.source;
        if (!Array.isArray(list) || !list.length) {
            return res.status(503).json({
                ok: false,
                error: 'No se pudo cargar el catálogo ICD11 Colombia desde BD, IHCE o mapping local.',
                details: icd11.lastIhceError || undefined,
            });
        }
        return res.json({ ok: true, source, total: list.length, items: list });
    } catch (error) {
        console.error('Error cargando catálogo CIE-11 Colombia:', error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
    }
});

router.get('/icd11/catalog.txt', async (req, res) => {
    try {
        const forceRefresh = String(req.query.refresh || '').trim() === '1';
        const resolved = await icd11.resolveCatalogForUse(forceRefresh);
        const list = Array.isArray(resolved.list) ? resolved.list : [];
        if (!list.length) {
            return res.status(503).send('No fue posible obtener catalogo ICD11 Colombia.');
        }
        const lines = ['Codigo\tTitulo'];
        list.forEach((x) => {
            const code = String(x && x.theCode ? x.theCode : '').trim();
            const title = String(x && x.title ? x.title : '').replace(/\r?\n/g, ' ').trim();
            if (!code) return;
            lines.push(`${code}\t${title}`);
        });
        const content = lines.join('\n');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=\"cie11_colombia_catalogo.txt\"');
        return res.status(200).send(content);
    } catch (error) {
        console.error('Error generando TXT de catalogo ICD-11:', error);
        return res.status(500).send(error.message || String(error));
    }
});

router.get('/icd11/search/:query?', async (req, res) => {
    try {
        const query = req.params.query;
        if (!query || query.trim() === "" || query === "undefined") {
            const seedResults = await icd11.search('');
            if (Array.isArray(seedResults) && seedResults.length > 0) {
                return res.json(seedResults.slice(0, 20));
            }
            return res.json([]);
        }
        const results = await icd11.search(query);
        const arr = Array.isArray(results) ? results : [];

        // Si no hay coincidencias por texto, intentar resolución directa por código (ej: PK9B.3).
        if (!arr.length && query) {
            const direct = await icd11.findByCode(query);
            if (direct) return res.json([direct]);
        }

        // Priorizar coincidencias de código cuando el usuario busca con código.
        const needle = String(query || '').trim().toUpperCase();
        const looksLikeCode = /^[A-Z0-9][A-Z0-9.\-]{1,15}$/i.test(needle);
        if (needle) {
            let ranked = arr
                .map((x) => ({ item: x, code: String(x && x.theCode ? x.theCode : '').toUpperCase() }))
                .sort((a, b) => {
                    const aStarts = a.code.startsWith(needle) ? 1 : 0;
                    const bStarts = b.code.startsWith(needle) ? 1 : 0;
                    if (aStarts !== bStarts) return bStarts - aStarts;
                    return a.code.localeCompare(b.code);
                })
                .map((x) => x.item);

            // Fallback extra para búsquedas por código: pedir un universo mayor por prefijo y filtrar por code.
            if (looksLikeCode && ranked.length === 0) {
                const probes = Array.from(new Set([
                    needle.slice(0, 1).toLowerCase(),
                    needle.slice(0, 2).toLowerCase(),
                    needle.replace(/\./g, '').slice(0, 2).toLowerCase(),
                ].filter(Boolean)));
                for (const p of probes) {
                    const bucket = await icd11.search(p);
                    const list = Array.isArray(bucket) ? bucket : [];
                    const filtered = list.filter((x) => {
                        const c = String(x && x.theCode ? x.theCode : '').toUpperCase();
                        return c.startsWith(needle) || c.startsWith(needle.replace(/\./g, ''));
                    });
                    if (filtered.length) {
                        ranked = filtered;
                        break;
                    }
                }
            }
            return res.json(ranked);
        }
        res.json(arr);
    } catch (error) {
        console.error('Error en ruta de búsqueda CIE-11:', error);
        res.status(500).send(error.message);
    }
});

router.get('/pruebaHC', async (req, res) => {

    try {
        const request = new Request(
            `SELECT TOP(10) [Id Evaluación Entidad],
            [Documento Entidad], 
            [Fecha Evaluación Entidad] 
            FROM [Evaluación Entidad]`,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }
        );

        const resultados = [];

        request.on('row', (columns) => {
            const hc = {
                idevaluacion: columns[0].value,
                fechaevaluacion: columns[1].value,
                DocPaciente: columns[2].value
            };
            resultados.push(hc);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta:');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);  // Envía la respuesta solo si no se ha enviado antes
                // res.status(200).send("holas")
            }
        });

        request.on('error', (err) => {
            console.error('Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });

        connection.execSql(request);
    } catch (error) {
        console.error('Error en la conexión o en la ejecución de la consulta:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


router.get('/DatosUsuario/:IdEvaluacion', async (req, res) => {
    try {
        const IdEvaluacion = req.params.IdEvaluacion;

        const request = new Request(
            `SELECT 
                        [Id Evaluación Entidad], [Id Tipo de Evaluación], [Tipo de Evaluación], [Fecha Evaluación Entidad], [Documento Entidad], Identificacion, [Edad Entidad Evaluación Entidad], [Acompañante Evaluación Entidad], 
                        [Id Parentesco], [Teléfono Acompañante], [Diagnóstico General Evaluación Entidad], [Diagnóstico Específico Evaluación Entidad], [Manejo de Medicamentos], [Dirección Domicilio], [Id Ciudad], [Teléfono Domicilio], 
                        [Fecha Nacimiento], [Id Unidad de Medida Edad], [Id Sexo], [Id Estado], [Id Estado Civil], [Id Ocupación], [Documento Aseguradora], [Id Tipo de Afiliado], [Responsable Evaluación Entidad], [Id Parentesco Responsable], 
                        [Teléfono Responsable], [Documento Usuario], [Documento Empresa], [Id Terminal], [Documento Profesional], [Id Estado Web], [Con Orden], [Firma Evaluación Entidad], Sincronizado, PreguntarControl, NombreFormatoAux
        FROM            [Cnsta Relacionador Info Evaluacion Usuario]
        WHERE        ([Id Evaluación Entidad] = ${IdEvaluacion})
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        console.log(resultados);
        connection.execSql(request);
        // pool.execSql(request);

    } catch (error) {

    }

});

router.get('/UsuariosHC/:DocumentoUsuario/:fechaInicio/:fechaFin', async (req, res) => {
    try {
        const DocumentoUsuario = req.params.DocumentoUsuario;
        const fechaInicio = req.params.fechaInicio;
        const fechaFin = req.params.fechaFin;

        const request = new Request(
            `SELECT  
                [DocumentoPaciente]
                ,[NombreCompletoPaciente]
            FROM [Cnsta Relacionador Usuarios HC]
            WHERE DocumentoUsuario = '${DocumentoUsuario}' AND CAST(FechaEvaluacion AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            GROUP BY DocumentoPaciente , NombreCompletoPaciente
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                // row[column.metadata.colName] = column.value;
                row[column.metadata.colName] = String(column.value).replace(/[\n\r\t]/g, '');
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


// router.get('/DatosdeUsuarioHC/:DocumentoPaciente', async (req, res) => {
//     try {
//         const DocumentoPaciente = req.params.DocumentoPaciente;


//         const request = new Request(
//             `
//         SELECT        DocumentoPaciente, PrimerApellidoPaciente, 
//         SegundoApellidoPaciente, PrimerNombrePaciente, SegundoNombrePaciente, 
//         NombreCompletoPaciente, Sexo, Edad, Direccion, Tel, DocumentoTipoDOC
//         FROM            [Cnsta Relacionador Usuarios Info]
//         WHERE        (DocumentoPaciente = '${DocumentoPaciente}')
//         `,
//             (err) => {
//                 if (err) {
//                     console.error(`Error de ejecución: ${err}`);
//                     // En caso de error, enviamos una respuesta y salimos de la función
//                     if (!res.headersSent) {
//                         res.status(500).send('Error interno del servidor');
//                     }
//                 }
//             }

//         );
//         const resultados = [];
//         request.on('row', (columns) => {
//             const row = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             resultados.push(row);
//         });

//         request.on('requestCompleted', () => {
//             res.json(resultados);
//         })
//         console.log(resultados);
//         connection.execSql(request);
//     } catch (error) {

//     }

// });
router.get('/DatosdeUsuarioHC/:DocumentoPaciente', async (req, res) => {
    try {
        const DocumentoPaciente = req.params.DocumentoPaciente;
        const documentoPacienteLimpio = (DocumentoPaciente || '').trim();

        const calcularEdadDesdeFecha = (valorFecha) => {
            if (!valorFecha) return null;
            const fecha = valorFecha instanceof Date ? valorFecha : new Date(valorFecha);
            if (isNaN(fecha.getTime())) return null;
            const hoy = new Date();
            let edad = hoy.getFullYear() - fecha.getFullYear();
            const m = hoy.getMonth() - fecha.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;
            return edad < 0 ? 0 : edad;
        };

        const pool = await poolPromise;

        const queryUsuarioInfo = `
                SELECT TOP (1)
                    IdTipodeDocumento, DescripciTipoDocumento, TipoDocumentoBase, DocumentoPaciente, PrimerApellidoBase, SegundoApellidoBase,
                    PrimerNombreBase, SegundoNombreBase, NombreCompletoPaciente, SexoPaciente, Sexo, CódigoSexo, IdSexo, Edad, Direccion, Tel,
                    DocumentoTipoDOC, FechaNacimientoBase, [Id Sexo], [Id Identidad Genero], IdSexoIdentidadGenero, codigoIdentidadGeneroBase,
                    IdentidadGeneroBase, [Id Zona Residencia], Talla, Peso, [Id Etnia], ComunidadEtnica, [Id Discapacidad], IdPaisNacionalidad,
                    CodigoPaisNacionalidad, NombrePaisNACIONALIDAD, IdPaisRecidencia, CodigoPaisRecidencia, NombrePaisRecidencia,
                    IdMunicipioRecidencia, CodigoMunicipioRecidencia, NombreMunicipioRecidencia, IdZonaResidencia, DescripciónZonaResidencia,
                    CódigoZonaResidencia, ZonaResidencia, IdEtnia, CódigoEtnia, Etnia, DescripciónEtnia, IdDiscapacidad, Codigo, Discapacidad,
                    DescripcionDiscapacidad, IdOcupación, CódigoOcupación, Ocupación, DescripciónOcupación, Alergias, Alergeno,
                    EstadoCivil, NombreResponsable, ParentescoResponsable
                FROM [dbo].[Cnsta Relacionador Usuarios Info]
                WHERE LTRIM(RTRIM(DocumentoPaciente)) = LTRIM(RTRIM(@DocumentoPaciente))
            `;

        let result = await pool.request()
            .input('DocumentoPaciente', sql.VarChar(50), DocumentoPaciente) // Usa el tipo y longitud adecuados
            .query(queryUsuarioInfo);

        const sincronizarEdadEntidadIII = async () => {
            if (!Array.isArray(result.recordset) || result.recordset.length === 0) return;
            const fila = result.recordset[0];
            const edadCalculada = calcularEdadDesdeFecha(fila?.FechaNacimientoBase);
            if (edadCalculada == null) return;

            const edadActual = Number.parseInt(fila?.Edad, 10);
            if (Number.isNaN(edadActual) || edadActual !== edadCalculada) {
                try {
                    await pool.request()
                        .input('DocumentoPaciente', sql.NVarChar(50), documentoPacienteLimpio)
                        .input('EdadCalculada', sql.Int, edadCalculada)
                        .query(`
                            UPDATE [dbo].[EntidadIII]
                            SET [Edad EntidadIII] = @EdadCalculada
                            WHERE LTRIM(RTRIM([Documento Entidad])) = @DocumentoPaciente
                        `);
                } catch (syncErr) {
                    console.error('⚠️ No se pudo sincronizar Edad en EntidadIII:', syncErr);
                }
            }
            fila.Edad = edadCalculada;
        };

        const normalizarUbicacionPorDefecto = async () => {
            if (!Array.isArray(result.recordset) || result.recordset.length === 0) return;
            const fila = result.recordset[0];
            const sinPaisNacionalidad = !fila?.IdPaisNacionalidad;
            const sinPaisResidencia = !fila?.IdPaisRecidencia;
            const sinMunicipioResidencia = !fila?.IdMunicipioRecidencia;
            if (!sinPaisNacionalidad && !sinPaisResidencia && !sinMunicipioResidencia) return;

            try {
                const defaultsRs = await pool.request().query(`
                    SELECT
                        (
                            SELECT TOP (1) p.[Id Pais1888]
                            FROM [dbo].[País1888] p
                            WHERE p.[Nombre] COLLATE Latin1_General_CI_AI = N'Colombia'
                               OR p.[Nombre] COLLATE Latin1_General_CI_AI LIKE N'%Colombia%'
                            ORDER BY CASE WHEN p.[Nombre] COLLATE Latin1_General_CI_AI = N'Colombia' THEN 0 ELSE 1 END, p.[Id Pais1888]
                        ) AS IdPaisColombia,
                        (
                            SELECT TOP (1) p.[Codigo]
                            FROM [dbo].[País1888] p
                            WHERE p.[Nombre] COLLATE Latin1_General_CI_AI = N'Colombia'
                               OR p.[Nombre] COLLATE Latin1_General_CI_AI LIKE N'%Colombia%'
                            ORDER BY CASE WHEN p.[Nombre] COLLATE Latin1_General_CI_AI = N'Colombia' THEN 0 ELSE 1 END, p.[Id Pais1888]
                        ) AS CodigoPaisColombia,
                        (
                            SELECT TOP (1) p.[Nombre]
                            FROM [dbo].[País1888] p
                            WHERE p.[Nombre] COLLATE Latin1_General_CI_AI = N'Colombia'
                               OR p.[Nombre] COLLATE Latin1_General_CI_AI LIKE N'%Colombia%'
                            ORDER BY CASE WHEN p.[Nombre] COLLATE Latin1_General_CI_AI = N'Colombia' THEN 0 ELSE 1 END, p.[Id Pais1888]
                        ) AS NombrePaisColombia,
                        (
                            SELECT TOP (1) c.[Id Ciudad1888]
                            FROM [dbo].[Ciudad1888] c
                            WHERE c.[Nombre] COLLATE Latin1_General_CI_AI = N'Medellin'
                               OR c.[Nombre] COLLATE Latin1_General_CI_AI = N'Medellín'
                               OR c.[Nombre] COLLATE Latin1_General_CI_AI LIKE N'Medellin%'
                               OR c.[Nombre] COLLATE Latin1_General_CI_AI LIKE N'Medellín%'
                            ORDER BY CASE WHEN c.[Nombre] COLLATE Latin1_General_CI_AI IN (N'Medellin', N'Medellín') THEN 0 ELSE 1 END, c.[Id Ciudad1888]
                        ) AS IdCiudadMedellin,
                        (
                            SELECT TOP (1) c.[Codigo]
                            FROM [dbo].[Ciudad1888] c
                            WHERE c.[Nombre] COLLATE Latin1_General_CI_AI = N'Medellin'
                               OR c.[Nombre] COLLATE Latin1_General_CI_AI = N'Medellín'
                               OR c.[Nombre] COLLATE Latin1_General_CI_AI LIKE N'Medellin%'
                               OR c.[Nombre] COLLATE Latin1_General_CI_AI LIKE N'Medellín%'
                            ORDER BY CASE WHEN c.[Nombre] COLLATE Latin1_General_CI_AI IN (N'Medellin', N'Medellín') THEN 0 ELSE 1 END, c.[Id Ciudad1888]
                        ) AS CodigoCiudadMedellin,
                        (
                            SELECT TOP (1) c.[Nombre]
                            FROM [dbo].[Ciudad1888] c
                            WHERE c.[Nombre] COLLATE Latin1_General_CI_AI = N'Medellin'
                               OR c.[Nombre] COLLATE Latin1_General_CI_AI = N'Medellín'
                               OR c.[Nombre] COLLATE Latin1_General_CI_AI LIKE N'Medellin%'
                               OR c.[Nombre] COLLATE Latin1_General_CI_AI LIKE N'Medellín%'
                            ORDER BY CASE WHEN c.[Nombre] COLLATE Latin1_General_CI_AI IN (N'Medellin', N'Medellín') THEN 0 ELSE 1 END, c.[Id Ciudad1888]
                        ) AS NombreCiudadMedellin
                `);

                const d = defaultsRs?.recordset?.[0];
                if (!d) return;

                const idPais = d.IdPaisColombia || null;
                const idCiudad = d.IdCiudadMedellin || null;
                if (!idPais && !idCiudad) return;

                await pool.request()
                    .input('DocumentoPaciente', sql.NVarChar(50), documentoPacienteLimpio)
                    .input('IdPaisColombia', sql.Int, idPais)
                    .input('IdCiudadMedellin', sql.Int, idCiudad)
                    .query(`
                        UPDATE [dbo].[Entidad1888]
                        SET [Id Pais Nacionalidad] = CASE
                                WHEN ([Id Pais Nacionalidad] IS NULL OR [Id Pais Nacionalidad] = 0) AND @IdPaisColombia IS NOT NULL
                                    THEN @IdPaisColombia
                                ELSE [Id Pais Nacionalidad]
                            END,
                            [Id Pais Recidencia] = CASE
                                WHEN ([Id Pais Recidencia] IS NULL OR [Id Pais Recidencia] = 0) AND @IdPaisColombia IS NOT NULL
                                    THEN @IdPaisColombia
                                ELSE [Id Pais Recidencia]
                            END,
                            [Id Municipio Recidencia] = CASE
                                WHEN ([Id Municipio Recidencia] IS NULL OR [Id Municipio Recidencia] = 0) AND @IdCiudadMedellin IS NOT NULL
                                    THEN @IdCiudadMedellin
                                ELSE [Id Municipio Recidencia]
                            END
                        WHERE LTRIM(RTRIM([Documento Entidad])) = @DocumentoPaciente
                    `);

                if (sinPaisNacionalidad && idPais) {
                    fila.IdPaisNacionalidad = idPais;
                    fila.CodigoPaisNacionalidad = d.CodigoPaisColombia || fila.CodigoPaisNacionalidad || '';
                    fila.NombrePaisNACIONALIDAD = d.NombrePaisColombia || fila.NombrePaisNACIONALIDAD || 'COLOMBIA';
                }
                if (sinPaisResidencia && idPais) {
                    fila.IdPaisRecidencia = idPais;
                    fila.CodigoPaisRecidencia = d.CodigoPaisColombia || fila.CodigoPaisRecidencia || '';
                    fila.NombrePaisRecidencia = d.NombrePaisColombia || fila.NombrePaisRecidencia || 'COLOMBIA';
                }
                if (sinMunicipioResidencia && idCiudad) {
                    fila.IdMunicipioRecidencia = idCiudad;
                    fila.CodigoMunicipioRecidencia = d.CodigoCiudadMedellin || fila.CodigoMunicipioRecidencia || '';
                    fila.NombreMunicipioRecidencia = d.NombreCiudadMedellin || fila.NombreMunicipioRecidencia || 'MEDELLIN';
                }
            } catch (ubicacionErr) {
                console.error('⚠️ No se pudo aplicar ubicación por defecto (Colombia/Medellín):', ubicacionErr);
            }
        };

        // Si no existe en el directorio de usuarios, validar si está en Entidad y crear fila base en Entidad1888.
        if (!Array.isArray(result.recordset) || result.recordset.length === 0) {
            const existsEntidad = await pool.request()
                .input('DocumentoPaciente', sql.VarChar(50), DocumentoPaciente)
                .query(`
                    SELECT TOP (1) [Documento Entidad] AS DocumentoEntidad
                    FROM [dbo].[Entidad]
                    WHERE [Documento Entidad] = @DocumentoPaciente
                `);

            if (existsEntidad.recordset && existsEntidad.recordset.length > 0) {
                await pool.request()
                    .input('DocumentoPaciente', sql.VarChar(50), DocumentoPaciente)
                    .query(`
                        IF NOT EXISTS (
                            SELECT 1
                            FROM [dbo].[Entidad1888]
                            WHERE [Documento Entidad] = @DocumentoPaciente
                        )
                        BEGIN
                            INSERT INTO [dbo].[Entidad1888] ([Documento Entidad])
                            VALUES (@DocumentoPaciente)
                        END
                    `);

                // Reintentar lectura desde la vista después de crear Entidad1888.
                result = await pool.request()
                    .input('DocumentoPaciente', sql.VarChar(50), DocumentoPaciente)
                    .query(queryUsuarioInfo);

                // Fallback final: si la vista aún no devuelve fila, armar registro base desde Entidad.
                if (!Array.isArray(result.recordset) || result.recordset.length === 0) {
                    const baseRs = await pool.request()
                        .input('DocumentoPaciente', sql.VarChar(50), DocumentoPaciente)
                        .query(`
                            SELECT TOP (1)
                                e.[Id Tipo de Documento]                 AS IdTipodeDocumento,
                                td.[Descripción Tipo de Documento]       AS DescripciTipoDocumento,
                                td.[Tipo de Documento]                   AS TipoDocumentoBase,
                                e.[Documento Entidad]                    AS DocumentoPaciente,
                                e.[Primer Apellido Entidad]              AS PrimerApellidoBase,
                                e.[Segundo Apellido Entidad]             AS SegundoApellidoBase,
                                e.[Primer Nombre Entidad]                AS PrimerNombreBase,
                                e.[Segundo Nombre Entidad]               AS SegundoNombreBase,
                                e.[Nombre Completo Entidad]              AS NombreCompletoPaciente
                            FROM [dbo].[Entidad] e
                            LEFT JOIN [dbo].[Tipo de Documento] td
                                ON td.[Id Tipo de Documento] = e.[Id Tipo de Documento]
                            WHERE e.[Documento Entidad] = @DocumentoPaciente
                        `);

                    const b = baseRs.recordset && baseRs.recordset[0] ? baseRs.recordset[0] : null;
                    if (b) {
                        result.recordset = [{
                            IdTipodeDocumento: b.IdTipodeDocumento || null,
                            DescripciTipoDocumento: b.DescripciTipoDocumento || '',
                            TipoDocumentoBase: b.TipoDocumentoBase || '',
                            DocumentoPaciente: b.DocumentoPaciente || DocumentoPaciente,
                            PrimerApellidoBase: b.PrimerApellidoBase || '',
                            SegundoApellidoBase: b.SegundoApellidoBase || '',
                            PrimerNombreBase: b.PrimerNombreBase || '',
                            SegundoNombreBase: b.SegundoNombreBase || '',
                            NombreCompletoPaciente: b.NombreCompletoPaciente || [
                                b.PrimerNombreBase || '',
                                b.SegundoNombreBase || '',
                                b.PrimerApellidoBase || '',
                                b.SegundoApellidoBase || '',
                            ].join(' ').replace(/\s+/g, ' ').trim(),
                            SexoPaciente: '',
                            Sexo: '',
                            CódigoSexo: '',
                            IdSexo: null,
                            Edad: '',
                            Direccion: '',
                            Tel: '',
                            DocumentoTipoDOC: `${b.TipoDocumentoBase || ''} ${b.DocumentoPaciente || DocumentoPaciente}`.trim(),
                            FechaNacimientoBase: '',
                            'Id Sexo': null,
                            'Id Identidad Genero': null,
                            IdSexoIdentidadGenero: null,
                            codigoIdentidadGeneroBase: '',
                            IdentidadGeneroBase: '',
                            'Id Zona Residencia': null,
                            Talla: '',
                            Peso: '',
                            'Id Etnia': null,
                            ComunidadEtnica: '',
                            'Id Discapacidad': null,
                            IdPaisNacionalidad: null,
                            CodigoPaisNacionalidad: '',
                            NombrePaisNACIONALIDAD: '',
                            IdPaisRecidencia: null,
                            CodigoPaisRecidencia: '',
                            NombrePaisRecidencia: '',
                            IdMunicipioRecidencia: null,
                            CodigoMunicipioRecidencia: '',
                            NombreMunicipioRecidencia: '',
                            IdZonaResidencia: null,
                            DescripciónZonaResidencia: '',
                            CódigoZonaResidencia: '',
                            ZonaResidencia: '',
                            IdEtnia: null,
                            CódigoEtnia: '',
                            Etnia: '',
                            DescripciónEtnia: '',
                            IdDiscapacidad: null,
                            Codigo: '',
                            Discapacidad: '',
                            DescripcionDiscapacidad: '',
                            IdOcupación: null,
                            CódigoOcupación: '',
                            Ocupación: '',
                            DescripciónOcupación: '',
                            Alergias: '',
                            Alergeno: '',
                        }];
                    }
                }
            }
        }

        await sincronizarEdadEntidadIII();
        await normalizarUbicacionPorDefecto();

        res.json(result.recordset);

    } catch (error) {
        console.error('❌ Error al obtener datos del usuario HC:', error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/DatosdeHC/:DocumentoPaciente/:DocumentoUsuario/:fechaInicio/:fechaFin', async (req, res) => {
    try {
        const DocumentoPaciente = req.params.DocumentoPaciente;
        const DocumentoUsuario = req.params.DocumentoUsuario;
        const fechaInicio = req.params.fechaInicio;
        const fechaFin = req.params.fechaFin;
        const request = new Request(
            `
        SELECT          [FechaEvaluacionTexto]
                ,[DocumentoPaciente]
                ,[IdTipodeEvaluacion]
                ,[DescripcionTipodeEvaluación]
                ,[Formato_Diagnostico]
                ,[DiagnósticoEspecíficoEvaluacionEntidad]
                ,[DocumentoUsuario]
                ,[IdEvaluaciónEntidad]
                ,[HoraEvaluacion]
        FROM            [Cnsta Relacionador Info Historias]
        WHERE        (DocumentoPaciente  like '%${DocumentoPaciente}%') 
        AND (CAST(FechaEvaluacion AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}') 
        AND (DocumentoUsuario = N'${DocumentoUsuario}')

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

///////////////////////Endpoint para listas de Rips
router.get('/TipodeRips', async (req, res) => {
    try {
        const request = new Request(
            `
            SELECT        IdTipoRips, CódigoTipoRips, TipoRips, 
            DescripcionTipoRips, IdEstado
            FROM            [Cnsta Relacionador Tipo Rips]
            

            `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
                    }
                }
            }
        );

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(request);

    } catch (error) {
        console.error('Error en la conexion o en la ejecucion de la consulta ');
        if (!res.headersSent) {
            res.status(500).send('Error  interno dels servidor')
        }
    }
});

router.get('/Entidad/:Tipo', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;

        const request = new Request(
            `
                SELECT         NombreCompletoPaciente, [Id Función], Función, DocumentoEntidad, IdTipoRips
                FROM            [Cnsta Relacionador Entidades Rips]
                WHERE        (IdTipoRips = ${Tipo})
                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        // res.status(500).send("Error interno de servidor");
                        res.status(500).json(`Error interno de servidor: ${err}`);
                    }
                }
            }
        );

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(request);



    } catch (error) {

    }
});

router.get('/Entidad', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;

        const request = new Request(
            `
                SELECT         NombreCompletoPaciente, [Id Función], Función, DocumentoEntidad, IdTipoRips
                FROM            [Cnsta Relacionador Entidades Rips]
                --WHERE        (IdTipoRips = ${Tipo})
                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        // res.status(500).send("Error interno de servidor");
                        res.status(500).json(`Error interno de servidor: ${err}`);
                    }
                }
            }
        );

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(request);



    } catch (error) {

    }
});

// ModalidadAtencion + GrupoServicios: usar pool mssql (db2), no connection.execSql.
// El front (wireSyncRips.js) hace Promise.all de ambos; tedious solo admite un request a la vez por conexión → 500 en paralelo.
router.get('/ModalidadAtencion', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT IdModalidadAtencion, Codigo, NombreModalidadAtencion,
                   DescripcionModalidadAtencion, OrdenModalidadAtencion, [Id Estado]
            FROM [Cnsta Relacionador Modalidad Atencion]
        `);
        res.json(result.recordset || []);
    } catch (error) {
        console.error('❌ ModalidadAtencion (pool):', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

router.get('/GrupoServicios', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT IdGrupoServicios, Codigo, NombreGrupoServicios,
                   DescripcionGrupoServicios, [Orden Grupo Servicios], [Id Estado]
            FROM [Cnsta Relacionador ModalidadGrupoServicioTecSal]
        `);
        res.json(result.recordset || []);
    } catch (error) {
        console.error('❌ GrupoServicios (pool):', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});


// router.get('/Servicios/:Tipo', async (req, res) => {
//     try {
//         const Tipo = req.params.Tipo;
//         console.log("Este es el tipo ", Tipo);
//         const request = new Request(
//             `
//                 SELECT        [Id Servicios], [Código Servicios], [Nombre Servicios], [Descripción Servicios], [Id Estado], [Codigo Grupo Servicios],  [Id Grupo Servicios]
//                 FROM            [Cnsta Relacionador Servicios]
//                 WHERE        ( [Id Grupo Servicios] = N'${Tipo}')
//                 `,
//             (err) => {
//                 if (err) {
//                     console.error(`Error de ejecución: ${err}`);
//                     if (!res.headersSent) {
//                         // res.status(500).send("Error interno de servidor");
//                         res.status(500).json(`Error interno de servidor => ${err}`);
//                     }
//                 }
//             }
//         );

//         const resultados = [];
//         request.on('row', (columns) => {
//             const row = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             resultados.push(row);
//         });

//         request.on('requestCompleted', () => {
//             console.log('Resultados de la consulta');
//             console.log(resultados);
//             if (!res.headersSent) {
//                 res.json(resultados);
//             }
//         });

//         request.on('error', (err) => {
//             console.error(' Error en la consulta:', err);
//             if (!res.headersSent) {
//                 // res.status(500).send(`Error interno del servidor => ${err}`);
//                 res.status(500).json(`Error interno de servidor => ${err}`);
//             }
//         });
//         connection.execSql(request);



//     } catch (error) {

//     }
// });


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/Servicios/:Tipo', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;
        console.log("Este es el tipo", Tipo);

        const query = `
            SELECT 
                [Id Servicios], [Código Servicios], [Nombre Servicios], 
                [Descripción Servicios], [Id Estado], [Codigo Grupo Servicios],  
                [Id Grupo Servicios]
            FROM 
                [Cnsta Relacionador Servicios]
            WHERE 
                [Id Grupo Servicios] = @Tipo
        `;

        const request = new Request(query, (err) => {
            if (err) {
                console.error(`Error de ejecución: ${err}`);
                if (!res.headersSent) {
                    res.status(500).json(`Error interno de servidor => ${err}`);
                }
            }
        });

        request.addParameter('Tipo', TYPES.NVarChar, Tipo);

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error('Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).json(`Error interno de servidor => ${err}`);
            }
        });

        // Verificar el estado de la conexión antes de ejecutar
        if (connection.state.name === 'LoggedIn') {
            connection.execSql(request);
        } else {
            console.error('La conexión no está en el estado LoggedIn');
            res.status(500).send('Error interno del servidor: Conexión no disponible');
        }

    } catch (error) {
        console.error('Error interno del servidor:', error);
        if (!res.headersSent) {
            res.status(500).json(`Error interno de servidor => ${err}`);
        }
    }
});

router.get('/Servicios', async (req, res) => {
    try {
        // const Tipo = req.params.Tipo;
        // console.log("Este es el tipo", Tipo);

        const query = `
            SELECT 
                [Id Servicios], [Código Servicios], [Nombre Servicios], 
                [Descripción Servicios], [Id Estado], [Codigo Grupo Servicios],  
                [Id Grupo Servicios]
            FROM 
                [Cnsta Relacionador Servicios]
            --WHERE 
            --    [Id Grupo Servicios] = @Tipo
        `;

        const request = new Request(query, (err) => {
            if (err) {
                console.error(`Error de ejecución: ${err}`);
                if (!res.headersSent) {
                    res.status(500).json(`Error interno de servidor => ${err}`);
                }
            }
        });

        // request.addParameter('Tipo', TYPES.NVarChar, Tipo);

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error('Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).json(`Error interno de servidor => ${err}`);
            }
        });

        // Verificar el estado de la conexión antes de ejecutar
        if (connection.state.name === 'LoggedIn') {
            connection.execSql(request);
        } else {
            console.error('La conexión no está en el estado LoggedIn');
            res.status(500).send('Error interno del servidor: Conexión no disponible');
        }

    } catch (error) {
        console.error('Error interno del servidor:', error);
        if (!res.headersSent) {
            res.status(500).json(`Error interno de servidor => ${err}`);
        }
    }
});

router.get('/FinalidadV2/:Tipo', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;

        const request = new Request(
            `
                
                SELECT        IdFinalidadConsulta, Codigo, NombreRIPSFinalidadConsultaVersion2, DescripcionRIPSFinalidadConsultaVersion2, RIPSFinalidadConsultaVersion2, AC, AP, [Id Estado]
                FROM            [Cnsta Relacionador Finalidad]
                WHERE        (${Tipo} = N'Si')

                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
                    }
                }
            }
        );

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(request);



    } catch (error) {

    }
});

router.get('/CausaExterna', async (req, res) => {
    try {


        const request = new Request(
            `
              SELECT       [Id RIPS Causa Externa Version2] AS IdRIPSCausaExternaVersion2, Codigo, 
              NombreRIPSCausaExternaVersion2, DescripcionRIPSCausaExternaVersion2, 
              RIPSCausaExternaVersion2, [Id Estado]
                FROM            [Cnsta Relacionador Causa Externa]

                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
                    }
                }
            }
        );

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(request);



    } catch (error) {

    }
});


router.get('/DXPrincipal', async (req, res) => {
    try {


        const request = new Request(
            `
              SELECT        IdTipodeDiagnósticoPrincipal, CódigoTipodeDiagnósticoPrincipal, 
              TipodeDiagnósticoPrincipal, DescripcionTipodeDiagnósticoPrincipal,
               ordenTipodeDiagnósticoPrincipal, [Id Estado]
                FROM            [Cnsta Relacionador Tipo Diagnostico Principal]

                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
                    }
                }
            }
        );

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(request);



    } catch (error) {

    }
});


router.get('/ViaIngresoUsuario', async (req, res) => {
    try {


        const request = new Request(
            `
             SELECT        IdViaIngresoUsuario, Codigo, NombreViaIngresoUsuario,
             DescripcionViaIngresoUsuario, OrdenViaIngresoUsuario, [Id Estado]
            FROM            [Cnsta Relacionador Via Ingreso Usuario]
                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
                    }
                }
            }
        );

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(request);



    } catch (error) {

    }
});

// router.get('/Cups/:Tipo', async (req, res) => {
//     try {
//         const Tipo = req.params.Tipo;

//         const request = new Request(
//             `
//         SELECT        Codigo, Descripcion, Nombre, Tipo
// FROM            [Cnsta Relacionador Cups]
// WHERE        (Tipo = '${Tipo}')
//             `,
//             (err) => {
//                 if (err) {
//                     console.error(`Error de ejecución: ${err}`);
//                     if (!res.headersSent) {
//                         res.status(500).send("Error interno de servidor");
//                     }
//                 }
//             }
//         );

//         const resultados = [];
//         request.on('row', (columns) => {
//             const row = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             resultados.push(row);
//         });

//         request.on('requestCompleted', () => {
//             console.log('Resultados de la consulta');
//             console.log(resultados);
//             if (!res.headersSent) {
//                 res.json(resultados);
//             }
//         });

//         request.on('error', (err) => {
//             console.error(' Error en la consulta:', err);
//             if (!res.headersSent) {
//                 res.status(500).send('Error interno del servidor');
//             }
//         });
//         connection.execSql(request);



//     } catch (error) {

//     }
// });

// router.get('/Cie', async (req, res) => {
//     try {


//         const request = new Request(
//             `
//         SELECT         Codigo, Nombre, Descripcion, AplicaASexo, EdadMinima, EdadMaxima, 
//         GrupoMortalidad, Extra_V, Extra_VI_Capitulo, SubGrupo, Sexo
// FROM            [Cnsta Relacionador Cie10]
//             `,
//             (err) => {
//                 if (err) {
//                     console.error(`Error de ejecución: ${err}`);
//                     if (!res.headersSent) {
//                         res.status(500).send("Error interno de servidor");
//                     }
//                 }
//             }
//         );

//         const resultados = [];
//         request.on('row', (columns) => {
//             const row = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             resultados.push(row);
//         });

//         request.on('requestCompleted', () => {
//             console.log('Resultados de la consulta');
//             // console.log(resultados);
//             if (!res.headersSent) {
//                 res.json(resultados);
//             }
//         });

//         request.on('error', (err) => {
//             console.error(' Error en la consulta:', err);
//             if (!res.headersSent) {
//                 res.status(500).send('Error interno del servidor');
//             }
//         });
//         connection.execSql(request);



//     } catch (error) {

//     }
// });
/** TOP inicial para Select2 (Historias Clínicas / búsqueda comprimida) */
router.get('/Cups/:Tipo/inicio', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Tipo', sql.VarChar, Tipo)
            .query(`
                SELECT TOP (50) Codigo, Descripcion, Nombre, Tipo
                FROM [Cnsta Relacionador Cups]
                WHERE Tipo = @Tipo
                ORDER BY Nombre
            `);
        res.json(result.recordset || []);
    } catch (error) {
        console.error('Error Cups inicio:', error);
        res.status(500).json({ error: 'Error al obtener Cups inicio' });
    }
});

router.get('/Cups/:Tipo/buscar/:Busqueda', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;
        const Busqueda = String(req.params.Busqueda || '').trim();
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Tipo', sql.VarChar, Tipo)
            .input('Busqueda', sql.VarChar, `%${Busqueda}%`)
            .query(`
                SELECT TOP (100) Codigo, Descripcion, Nombre, Tipo
                FROM [Cnsta Relacionador Cups]
                WHERE Tipo = @Tipo
                  AND (Codigo LIKE @Busqueda OR Nombre LIKE @Busqueda OR Descripcion LIKE @Busqueda)
                ORDER BY Nombre
            `);
        res.json(result.recordset || []);
    } catch (error) {
        console.error('Error Cups buscar:', error);
        res.status(500).json({ error: 'Error al buscar Cups' });
    }
});

router.get('/Cups/:Tipo', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;

        // Esperar a que se resuelva el pool de conexión
        const pool = await poolPromise;  // Asumiendo que tienes un poolPromise configurado

        // Ejecutar la consulta con el pool
        const result = await pool.request()
            .input('Tipo', sql.VarChar, Tipo)  // Usar parámetros para evitar inyecciones SQL
            .query(`
                SELECT 
                    Codigo, Descripcion, Nombre, Tipo
                FROM [Cnsta Relacionador Cups]
                WHERE Tipo = @Tipo
            `);

        // Enviar los resultados
        res.json(result.recordset);  // 'recordset' contiene los datos de la consulta

    } catch (error) {
        console.error('Error al consultar los datos de Cups:', error);
        res.status(500).json({ error: 'Error al obtener los datos de Cups' });
    }
});

router.get('/Cie/inicio', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP (50) Codigo, Nombre, Descripcion
            FROM [Cnsta Relacionador Cie10]
            ORDER BY Codigo
        `);
        res.json(result.recordset || []);
    } catch (error) {
        console.error('Error CIE inicio:', error);
        res.status(500).json({ error: 'Error al obtener CIE inicio' });
    }
});

router.get('/Cie', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT 
                    Codigo, Nombre, Descripcion, AplicaASexo, EdadMinima, EdadMaxima, 
                    GrupoMortalidad, Extra_V, Extra_VI_Capitulo, SubGrupo, Sexo
                FROM [Cnsta Relacionador Cie10]
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al consultar los datos CIE:', error);
        res.status(500).json({ error: 'Error al obtener los datos del CIE' });
    }
});

router.get('/Cie/:Busqueda', async (req, res) => {
    const Busqueda = req.params.Busqueda;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + Busqueda + '%')
            .query(`
                SELECT TOP 100 Codigo, Nombre, Descripcion, AplicaASexo, EdadMinima, EdadMaxima, 
                    GrupoMortalidad, Extra_V, Extra_VI_Capitulo, SubGrupo, Sexo
                FROM [Cnsta Relacionador Cie10]
                WHERE Codigo LIKE @Busqueda OR Nombre LIKE @Busqueda OR Descripcion LIKE @Busqueda
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al buscar CIE:', error);
        res.status(500).json({ error: 'Error al buscar CIE' });
    }
});

router.post('/RegistrarRips/:IdEvaluacion/:TipoUsuario/:Entidad/:ModalidadGrupoServicioTecSal/:GrupoServicios/:CodServicio/:FinalidadTecnologiaSalud/:CausaMotivoAtencion/:TipoDiagnosticoPrincipal/:ViaIngresoServicioSalud/:Cups1/:Cups2/:Cie1/:Cie2/:TipoRips/:Idfactura/:Idpresupuesto/:DocumentoEntidad', (req, res) => {




    const IdEvaluacion = req.params.IdEvaluacion;
    const TipoUsuario = req.params.TipoUsuario;
    const Entidad = req.params.Entidad;
    const ModalidadGrupoServicioTecSal = req.params.ModalidadGrupoServicioTecSal;
    const GrupoServicios = req.params.GrupoServicios;
    const CodServicio = req.params.CodServicio;
    const FinalidadTecnologiaSalud = req.params.FinalidadTecnologiaSalud;
    const CausaMotivoAtencion = req.params.CausaMotivoAtencion;
    const TipoDiagnosticoPrincipal = req.params.TipoDiagnosticoPrincipal;
    const ViaIngresoServicioSalud = req.params.ViaIngresoServicioSalud;

    const idfactura = req.params.Idfactura;

    const Idpresupuesto = req.params.Idpresupuesto;

    const DocumentoEntidad = req.params.DocumentoEntidad;

    const Cups1 = req.params.Cups1;
    let Cups2 = req.params.Cups2;
    //Se evalua si viene = 0 para hacerlo NULL
    if (Cups2 == 0) { Cups2 = 'null' }
    const Cie1 = req.params.Cie1.trim();
    let Cie2 = req.params.Cie2;
    if (Cie2 == 0) { Cie2 = 'null' }
    const TipoRips = req.params.TipoRips;
    var Actoquirurgico;
    if (TipoRips == 'AC') {
        Actoquirurgico = 1;
    } else if (TipoRips == 'AP') {
        Actoquirurgico = 2;
    }
    // console.log(`IdEvaluacion ${IdEvaluacion}`);
    // console.log(`TipoUsuario ${TipoUsuario}`);
    // console.log(`Entidad ${Entidad}`);
    // console.log(`ModalidadGrupoServicioTecSal ${ModalidadGrupoServicioTecSal}`);
    // console.log(`GrupoServicios ${GrupoServicios}`);
    // console.log(`CodServicio ${CodServicio}`);
    // console.log(`FinalidadTecnologiaSalud ${FinalidadTecnologiaSalud}`);
    // console.log(`CausaMotivoAtencion ${CausaMotivoAtencion}`);
    // console.log(`TipoDiagnosticoPrincipal ${TipoDiagnosticoPrincipal}`);
    // console.log(`ViaIngresoServicioSalud ${ViaIngresoServicioSalud}`);
    // console.log(`Cups1 ${Cups1}`);
    // console.log(`Cups2 ${Cups2}`);
    // console.log(`Cie1 ${Cie1}`);
    // console.log(`Cie2 ${Cie2}`);
    // console.log(`TipoRips ${TipoRips}`);
    // console.log(`IdEvaluacion ${IdEvaluacion}`);

    const requestInsert = new Request(
        `
    INSERT INTO [Evaluación Entidad Rips] 
    (
    [Id Evaluación Entidad] ,
    [Codigo Rips],
    [Codigo Rips2],
    [Diagnostico Rips],
    [Diagnostico Rips2],
    [Id Tipo de Rips],
    [Documento Tipo Rips],
    [Id Causa Externa],
    [Id Tipo de Diagnóstico Principal],
    [Id Finalidad Consulta],
    [Id Acto Quirúrgico],
    [Id Modalidad Atencion],
    [Id Grupo Servicios],
    [Id Servicios],
    [Id Via Ingreso Usuario], 
    [Id Factura],
    [Id Plan de Tratamiento] 
    )
    VALUES 
    (
    @IdEvaluacion,
    @Cups1,
    @Cups2,
    @Cie1,
    @Cie2,
    @TipoUsuario,
    @Entidad,
    @CausaMotivoAtencion,
    @TipoDiagnosticoPrincipal,
    @FinalidadTecnologiaSalud,
    @Actoquirurgico, 
    @ModalidadGrupoServicioTecSal,
    @GrupoServicios,
    @CodServicio,
    @ViaIngresoServicioSalud,
    @IdFactura,
    @idpresupuesto
    ) 
    `, (err) => {
        if (err) {
            console.error('Error al insertar el Rips:', err.message);
            res.status(500).json({ error: 'Error al insertar el RIPS' });
        } else {
            console.log('Inserción ejecutada con éxito');
            res.json({ success: true, message: 'Rips insertado correctamente' });
        }
    });

    // Ajustar los parámetros según las columnas y datos que estás insertando
    requestInsert.addParameter('IdEvaluacion', TYPES.Int, IdEvaluacion);
    requestInsert.addParameter('TipoUsuario', TYPES.Int, TipoUsuario);
    requestInsert.addParameter('Entidad', TYPES.NVarChar, Entidad);
    requestInsert.addParameter('ModalidadGrupoServicioTecSal', TYPES.Int, ModalidadGrupoServicioTecSal);
    requestInsert.addParameter('GrupoServicios', TYPES.Int, GrupoServicios);
    requestInsert.addParameter('CodServicio', TYPES.Int, CodServicio);
    requestInsert.addParameter('FinalidadTecnologiaSalud', TYPES.Int, FinalidadTecnologiaSalud);
    requestInsert.addParameter('CausaMotivoAtencion', TYPES.Int, CausaMotivoAtencion);
    requestInsert.addParameter('TipoDiagnosticoPrincipal', TYPES.Int, TipoDiagnosticoPrincipal);
    requestInsert.addParameter('ViaIngresoServicioSalud', TYPES.Int, ViaIngresoServicioSalud);
    requestInsert.addParameter('Cups1', TYPES.NVarChar, Cups1);
    requestInsert.addParameter('Cups2', TYPES.NVarChar, Cups2);
    requestInsert.addParameter('Cie1', TYPES.NVarChar, Cie1);
    requestInsert.addParameter('Cie2', TYPES.NVarChar, Cie2);
    requestInsert.addParameter('Actoquirurgico', TYPES.Int, Actoquirurgico);
    // console.log(idfactura);
    // const idFacturaValor = Number.isInteger(idfactura) ? idfactura : 0;
    // requestInsert.addParameter('IdFactura', TYPES.Int, idFacturaValor);
    let IdPresupuestoValor = (Idpresupuesto?.toLowerCase?.() === 'null' || Idpresupuesto == null) ? 0 : Idpresupuesto;
    let idFacturaValor = (idfactura?.toLowerCase?.() === 'null' || idfactura == null) ? 0 : idfactura;

    console.log(IdPresupuestoValor);
    requestInsert.addParameter('IdFactura', TYPES.Int, idFacturaValor);
    requestInsert.addParameter('Idpresupuesto', TYPES.Int, IdPresupuestoValor);


    connection.execSql(requestInsert);
});


router.post('/TieneRips/:IdEvaluacion', (req, res) => {

    const IdEvaluacion = req.params.IdEvaluacion;
    console.log("sI ENTRE Y MIRA", IdEvaluacion);
    const requestUpdate = new Request(
        `UPDATE [Evaluación Entidad] 
        SET  [Rips] = 0
        WHERE  [Id Evaluación Entidad] = ${IdEvaluacion}`,
        (err) => {
            if (err) {
                console.error('Error al actualizar la historia:', err.message);
                res.status(500).json({ error: 'Error añ actualiza la historia' });
            } else {
                console.log('Actualizacion ejecutada con exito');
                res.json({ success: true, message: 'Historia ACTUALIZADA Correctamente' })
            }
        }
    );


    connection.execSql(requestUpdate);

});


// APIS PARA MANEJAR LOS RIPS POR DEFECTO/PREDEFINIDOS
router.get('/ConsultarRIPSPorDefecto/:DocumentoProfesional/:TipoRIPS', async (req, res) => {

    try {
        const DocumentoProfesional = req.params.DocumentoProfesional;
        const TipoRIPS = req.params.TipoRIPS;
        const Consulta = new Request(
            `
                SELECT 
                    *
                FROM
                    [ConsultarRIPSPorDefecto]
                WHERE
                    [DocumentoEntidad] = @DocumentoProfesional 
                    AND [TipoDeRips] = @TipoRIPS
            `,
            (err) => {
                if (err) {
                    console.error(`Error al traer los rips predefinidos.. => [${err}]`)
                    if (!res.headersSent) {
                        res.status(500).send(`Error interno de servidor... ${err} `);
                    }
                }
            }
        );

        Consulta.addParameter('DocumentoProfesional', TYPES.NVarChar, DocumentoProfesional);
        Consulta.addParameter('TipoRIPS', TYPES.NVarChar, TipoRIPS);

        const resultados = [];
        Consulta.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        Consulta.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        Consulta.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(Consulta);

    } catch (Error) {

    }
})

// CRUD PARA RIPS POR DEFECTO
// Guardar
// router.post('/GuardarRIPSPorDefecto/:DocumentoProfesional/:TipoRIPS', async (req, res) => {
router.post('/GuardarRIPSPorDefecto', async (req, res) => {
    // Se reciben los datos enviados por el cliente
    const {
        DocumentoProfesional,
        TipoRIPS,
        TipoUsuario,
        Entidad,
        ViaIngresoServicioSalud,
        ModalidadGrupoServicioTecSal,
        GrupoServicio,
        CodigoServicio,
        FinalidadTecnologiaSalud,
        CausaMotivoAtencion,
        TipoDiagnosticoPrincipal,
        ConsultaRIPS1,
        ConsultaRIPS2,
        DiagnosticoRIPS1,
        DiagnosticoRIPS2
    } = req.body;

    // Se ejecuta la consulta para guardar los datos en la base de datos
    try {
        const GuardarRIPSPorDefecto = new Request(`
            INSERT INTO [dbo].[API_RIPS_POR_DEFECTO]
                ([DocumentoEntidad]
                ,[TipoDeRips]
                ,[TipoDeUsuario]
                ,[Entidad]
                ,[ViaIngresoServicioSalud]
                ,[ModalidadGrupoServicioTecnologiaEnSalud]
                ,[GrupoServicios]
                ,[CodigoServicio]
                ,[FinalidadTecnologiaSalud]
                ,[CausaMotivoAtencion]
                ,[TipoDiagnosticoPrincipal]
                ,[Diagnostico1]
                ,[Diagnostico2]
                ,[Procedimiento1]
                ,[Procedimiento2])
            VALUES
                (
                    @DocumentoProfesional,
                    @TipoRIPS,
                    @TipoUsuario,
                    @Entidad,
                    @ViaIngresoServicioSalud,
                    @ModalidadGrupoServicioTecSal,
                    @GrupoServicio,
                    @CodigoServicio,
                    @FinalidadTecnologiaSalud,
                    @CausaMotivoAtencion,
                    @TipoDiagnosticoPrincipal,
                    @Diagnostico1,
                    @Diagnostico2,
                    @Procedimiento1,
                    @Procedimiento2
                )
        `, (err) => {
            if (err) {
                console.error('Error al guardar los rips predefinidos:', err.message);
                return res.status(500).json({ error: 'Error al guardar los rips predefinidos' });
            }
            console.log('Datos guardados correctamente');
            return res.status(200).json({ message: 'Datos guardados correctamente', DocumentoProfesional, TipoRIPS });
        });

        // Se le pasan los parámetros
        GuardarRIPSPorDefecto.addParameter('DocumentoProfesional', TYPES.NVarChar, DocumentoProfesional);
        GuardarRIPSPorDefecto.addParameter('TipoRIPS', TYPES.NVarChar, TipoRIPS);
        GuardarRIPSPorDefecto.addParameter('TipoUsuario', TYPES.NVarChar, TipoUsuario);
        GuardarRIPSPorDefecto.addParameter('Entidad', TYPES.NVarChar, Entidad);
        GuardarRIPSPorDefecto.addParameter('ViaIngresoServicioSalud', TYPES.NVarChar, ViaIngresoServicioSalud);
        GuardarRIPSPorDefecto.addParameter('ModalidadGrupoServicioTecSal', TYPES.NVarChar, ModalidadGrupoServicioTecSal);
        GuardarRIPSPorDefecto.addParameter('GrupoServicio', TYPES.NVarChar, GrupoServicio);
        GuardarRIPSPorDefecto.addParameter('CodigoServicio', TYPES.NVarChar, CodigoServicio);
        GuardarRIPSPorDefecto.addParameter('FinalidadTecnologiaSalud', TYPES.NVarChar, FinalidadTecnologiaSalud);
        GuardarRIPSPorDefecto.addParameter('CausaMotivoAtencion', TYPES.NVarChar, CausaMotivoAtencion);
        GuardarRIPSPorDefecto.addParameter('TipoDiagnosticoPrincipal', TYPES.NVarChar, TipoDiagnosticoPrincipal);
        GuardarRIPSPorDefecto.addParameter('Diagnostico1', TYPES.NVarChar, ConsultaRIPS1);
        GuardarRIPSPorDefecto.addParameter('Diagnostico2', TYPES.NVarChar, ConsultaRIPS2);
        GuardarRIPSPorDefecto.addParameter('Procedimiento1', TYPES.NVarChar, DiagnosticoRIPS1);
        GuardarRIPSPorDefecto.addParameter('Procedimiento2', TYPES.NVarChar, DiagnosticoRIPS2);

        // Se ejecuta la consulta
        connection.execSql(GuardarRIPSPorDefecto);
    } catch (Error) {
        console.error('Error en el guardado:', Error);
        return res.status(500).json({ error: 'Error en el guardado' });
    }
    // res.status(200).json({ message: 'Datos recibidos correctamente', DocumentoProfesional, TipoRIPS });
    // console.log(res);
    const InformacionRecibida = {
        DocumentoProfesional,
        TipoRIPS,
        TipoUsuario,
        Entidad,
        ModalidadGrupoServicioTecSal,
        GrupoServicio,
        CodigoServicio,
        FinalidadTecnologiaSalud,
        CausaMotivoAtencion,
        TipoDiagnosticoPrincipal,
        ConsultaRIPS1,
        ConsultaRIPS2,
        DiagnosticoRIPS1,
        DiagnosticoRIPS2
    }
    console.log(InformacionRecibida);
})
// Actualizar
// router.post('/ActualizarRIPSPorDefecto/:DocumentoProfesional/:TipoRIPS', async (req, res) => {
router.post('/ActualizarRIPSPorDefecto', async (req, res) => {
    const {
        DocumentoProfesional,
        TipoRIPS,
        TipoUsuario,
        Entidad,
        ViaIngresoServicioSalud,
        ModalidadGrupoServicioTecSal,
        GrupoServicio,
        CodigoServicio,
        FinalidadTecnologiaSalud,
        CausaMotivoAtencion,
        TipoDiagnosticoPrincipal,
        ConsultaRIPS1,
        ConsultaRIPS2,
        DiagnosticoRIPS1,
        DiagnosticoRIPS2
    } = req.body;

    try {
        const ActualizarRIPSPorDefecto = new Request(`
            UPDATE [dbo].[API_RIPS_POR_DEFECTO]
            SET [DocumentoEntidad] = @DocumentoEntidad,
                [TipoDeRips] = @TipoDeRips,
                [TipoDeUsuario] = @TipoDeUsuario,
                [Entidad] = @Entidad,
                [ViaIngresoServicioSalud] = @ViaIngresoServicioSalud,
                [ModalidadGrupoServicioTecnologiaEnSalud] = @ModalidadGrupoServicioTecnologiaEnSalud,
                [GrupoServicios] = @GrupoServicios,
                [CodigoServicio] = @CodigoServicio,
                [FinalidadTecnologiaSalud] = @FinalidadTecnologiaSalud,
                [CausaMotivoAtencion] = @CausaMotivoAtencion,
                [TipoDiagnosticoPrincipal] = @TipoDiagnosticoPrincipal,
                [Diagnostico1] = @Diagnostico1,
                [Diagnostico2] = @Diagnostico2,
                [Procedimiento1] = @Procedimiento1,
                [Procedimiento2] = @Procedimiento2
            WHERE
                [DocumentoEntidad] = @DocumentoEntidad AND
                [TipoDeRips] = @TipoDeRips
        `, (err) => {
            if (err) {
                console.error('Error al actualizar los rips predefinidos:', err.message);
                return res.status(500).json({ error: 'Error al actualizar los rips predefinidos' });
            }
            console.log('Datos actualizados correctamente');
            return res.status(200).json({ message: 'Datos actualizados correctamente' });
        })
        // Se le pasan los parámetros
        ActualizarRIPSPorDefecto.addParameter('DocumentoEntidad', TYPES.NVarChar, req.body.DocumentoProfesional);
        ActualizarRIPSPorDefecto.addParameter('TipoDeRips', TYPES.NVarChar, req.body.TipoRIPS);
        ActualizarRIPSPorDefecto.addParameter('TipoDeUsuario', TYPES.NVarChar, req.body.TipoUsuario);
        ActualizarRIPSPorDefecto.addParameter('Entidad', TYPES.NVarChar, req.body.Entidad);
        ActualizarRIPSPorDefecto.addParameter('ViaIngresoServicioSalud', TYPES.NVarChar, req.body.ViaIngresoServicioSalud);
        ActualizarRIPSPorDefecto.addParameter('ModalidadGrupoServicioTecnologiaEnSalud', TYPES.NVarChar, req.body.ModalidadGrupoServicioTecSal);
        ActualizarRIPSPorDefecto.addParameter('GrupoServicios', TYPES.NVarChar, req.body.GrupoServicio);
        ActualizarRIPSPorDefecto.addParameter('CodigoServicio', TYPES.NVarChar, req.body.CodigoServicio);
        ActualizarRIPSPorDefecto.addParameter('FinalidadTecnologiaSalud', TYPES.NVarChar, req.body.FinalidadTecnologiaSalud);
        ActualizarRIPSPorDefecto.addParameter('CausaMotivoAtencion', TYPES.NVarChar, req.body.CausaMotivoAtencion);
        ActualizarRIPSPorDefecto.addParameter('TipoDiagnosticoPrincipal', TYPES.NVarChar, req.body.TipoDiagnosticoPrincipal);
        ActualizarRIPSPorDefecto.addParameter('Diagnostico1', TYPES.NVarChar, req.body.ConsultaRIPS1);
        ActualizarRIPSPorDefecto.addParameter('Diagnostico2', TYPES.NVarChar, req.body.ConsultaRIPS2);
        ActualizarRIPSPorDefecto.addParameter('Procedimiento1', TYPES.NVarChar, req.body.DiagnosticoRIPS1);
        ActualizarRIPSPorDefecto.addParameter('Procedimiento2', TYPES.NVarChar, req.body.DiagnosticoRIPS2);
        // Se ejecuta la consulta
        connection.execSql(ActualizarRIPSPorDefecto);
    } catch (Error) {
        console.error('Error en la actualización:', Error);
        return res.status(500).json({ error: `Error en la actualización => ${Error}` });
    }
})
// Eliminar
// router.post('/EliminarRIPSPorDefecto/:DocumentoProfesional/:TipoRIPS', async (req, res) => {
router.post('/EliminarRIPSPorDefecto', async (req, res) => {
    const {
        DocumentoProfesional,
        TipoRIPS
    } = req.body;

    try {
        const EliminarRIPSPorDefecto = new Request(`
            DELETE FROM [dbo].[API_RIPS_POR_DEFECTO]
            WHERE
                [DocumentoEntidad] = @DocumentoProfesional
                AND [TipoDeRips] = @TipoRIPS
        `, (err) => {
            if (err) {
                console.error('Error al eliminar los rips predefinidos:', err.message);
                return res.status(500).json({ error: 'Error al eliminar los rips predefinidos' });
            }
            console.log('Datos eliminados correctamente');
            return res.status(200).json({ message: 'Datos eliminados correctamente' });
        })

        // Se le pasan los parámetros
        EliminarRIPSPorDefecto.addParameter('DocumentoProfesional', TYPES.NVarChar, DocumentoProfesional);
        EliminarRIPSPorDefecto.addParameter('TipoRIPS', TYPES.NVarChar, TipoRIPS);
        // Se ejecuta la consulta
        connection.execSql(EliminarRIPSPorDefecto);
    } catch (Error) {
        console.error('Error al eliminar los rips predefinidos:', Error.message);
        return res.status(500).json({ error: 'Error al eliminar los rips predefinidos' });
    }
})



router.get('/ConsultarFacturas/:DocumentoPaciente', async (req, res) => {
    try {
        const DocumentoPaciente = req.params.DocumentoPaciente;

        // Esperar el pool de conexión
        const pool = await poolPromise;

        // Ejecutar la consulta
        const result = await pool.request()
            .input('DocumentoPaciente', sql.VarChar, DocumentoPaciente)
            .query(`
            SELECT *
            FROM [ConsultaFacturasPaciente]
            WHERE [DocumentoPaciente] = @DocumentoPaciente
            ORDER BY [FechaFactura] DESC
        `);

        // Enviar resultados
        res.json(result.recordset);
    } catch (error) {
        console.error(`❌ Error al consultar facturas para el documento ${req.params.DocumentoPaciente}:`, error);
        res.status(500).json({ error: 'Error al consultar las facturas del paciente.' });
    }
});




router.get('/ConsultarPresupuestos/:DocumentoPaciente', async (req, res) => {
    try {
        const DocumentoPaciente = req.params.DocumentoPaciente;

        // Esperar el pool de conexión
        const pool = await poolPromise;

        // Ejecutar la consulta
        const result = await pool.request()
            .input('DocumentoPaciente', sql.VarChar, DocumentoPaciente)
            .query(`
                SELECT 
                    *
                FROM 
                    [ConsultaPresupuestosPaciente]
                WHERE
                    ( [DocumentoPaciente] = @DocumentoPaciente ) AND
                    ( [FormaDePago] = 5 )
                ORDER BY
                    [FechaPresupuesto] DESC
            `);

        // Enviar resultados
        res.json(result.recordset);

    } catch (error) {
        console.error(`❌ Error al consultar presupuestos para el documento ${req.params.DocumentoPaciente}:`, error);
        res.status(500).json({ error: 'Error al consultar los presupuestos del paciente.' });
    }
});

// =================================================================================================
// =====ReSOLUCION 1888======


router.get('/Paises', async (req, res) => {

    try {

        const request = new Request(
            `
        SELECT  IdPais1888, Codigo, Nombre + ' (' + Codigo + ')' as Nombre, Estado
        FROM     [Cnsta Pais 1888]

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/Paises/:NombrePais', async (req, res) => {
    const NombrePais = req.params.NombrePais;
    try {

        const request = new Request(
            `
        SELECT  IdPais1888, Codigo, Nombre + ' (' + Codigo + ')' as Nombre, Estado
        FROM     [Cnsta Pais 1888]
        Where Nombre like '%${NombrePais}%' OR Codigo like '%${NombrePais}%'

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Ciudades', async (req, res) => {
    try {

        const request = new Request(
            `
        SELECT  IdCiudad1888, Codigo, Nombre + ' (' + Codigo + ')' as Nombre, Estado
        FROM     [Cnsta Ciudad 1888]

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Ciudades/:NombreCiudad', async (req, res) => {
    const NombreCiudad = req.params.NombreCiudad;
    try {

        const request = new Request(
            `
        SELECT  IdCiudad1888, Codigo, Nombre + ' (' + Codigo + ')' as Nombre, Estado
        FROM     [Cnsta Ciudad 1888]
        Where Nombre like '%${NombreCiudad}%' OR Codigo like '%${NombreCiudad}%'

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/TipoDocumento', async (req, res) => {
    try {

        const request = new Request(
            `
        SELECT  IdTipodeDocumento, CódigoTipoDocumento, TipoDocumento, DescripciónTipoDocumento
            FROM     [Cnsta Tipodocumento 1888]

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/TipoDocumento/:NombreTipoDocumento', async (req, res) => {
    const NombreTipoDocumento = req.params.NombreTipoDocumento;
    try {

        const request = new Request(
            `
        SELECT  IdTipodeDocumento, CódigoTipoDocumento, TipoDocumento, DescripciónTipoDocumento
            FROM     [Cnsta Tipodocumento 1888]
            where TipoDocumento like '%${NombreTipoDocumento}%' OR CódigoTipoDocumento like '%${NombreTipoDocumento}%'

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Sexo/:Sexo', async (req, res) => {
    const Sexo = req.params.Sexo;
    try {

        const request = new Request(
            `
        SELECT   IdSexo, CódigoSexo, Sexo, [Descripción Sexo]
        FROM     [Cnsta Sexo 1888]
            where Sexo like '%${Sexo}%'

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Sexo/', async (req, res) => {

    try {

        const request = new Request(
            `
        SELECT   IdSexo,   Sexo as CódigoSexo, [Descripción Sexo] as Sexo
        FROM     [Cnsta Sexo 1888] 

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/identidadSexo/:identidadSexo', async (req, res) => {
    const identidadSexo = req.params.identidadSexo;
    try {

        const request = new Request(
            `
        SELECT   IdSexoIdentidadGenero, Codigo, IdentidadGenero, DescripcionIdentidadGenero
        FROM     [Cnsta SexoIdentidad 1888]
            where DescripcionIdentidadGenero like '%${identidadSexo}%'

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/identidadSexo/', async (req, res) => {

    try {

        const request = new Request(
            `
         SELECT   IdSexoIdentidadGenero, Codigo, IdentidadGenero, DescripcionIdentidadGenero
        FROM     [Cnsta SexoIdentidad 1888] 

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/ZonaTerritorial/', async (req, res) => {

    try {

        const request = new Request(
            `
      SELECT   IdZonaResidencia, ZonaResidencia, DescripciónZonaResidencia
FROM     [Cnsta ZonaResidencia 1888]
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/ZonaTerritorial/:ZonaTerritorial', async (req, res) => {

    const ZonaTerritorial = req.params.ZonaTerritorial;
    try {

        const request = new Request(
            `
        SELECT    IdZonaResidencia, ZonaResidencia, DescripciónZonaResidencia
FROM     [Cnsta ZonaResidencia 1888]
            where DescripciónZonaResidencia like '%${ZonaTerritorial}%'
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/Etnia/:Etnia', async (req, res) => {

    const Etnia = req.params.Etnia;
    try {

        const request = new Request(
            ` 
            SELECT  IdEtnia, CódigoEtnia, Etnia, DescripciónEtnia, IdEstado
FROM     [Cnsta Etnia 1888]
where DescripciónEtnia like '%${Etnia}%' OR CódigoEtnia like '%${Etnia}%'
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Etnia', async (req, res) => {

    try {

        const request = new Request(
            ` 
            SELECT  IdEtnia, CódigoEtnia, Etnia, DescripciónEtnia, IdEstado
FROM     [Cnsta Etnia 1888] 
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Discapacidad/', async (req, res) => {

    try {

        const request = new Request(
            ` 
           SELECT  IdDiscapacidad, Codigo, Discapacidad, DescripcionDiscapacidad
FROM     [Cnsta Discapacidad 1888] 
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Discapacidad/:Discapacidad', async (req, res) => {

    const Discapacidad = req.params.Discapacidad;
    try {

        const request = new Request(
            ` 
          SELECT   IdDiscapacidad, Codigo, Discapacidad, DescripcionDiscapacidad
FROM     [Cnsta Discapacidad 1888]
where DescripcionDiscapacidad like '%${Discapacidad}%' OR Codigo like '%${Discapacidad}%'
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Ocupacion/', async (req, res) => {

    try {

        const request = new Request(
            ` 
         SELECT   IdOcupacion, CodigoOcupacion, DescripcionOcupacion, [Id Estado]
FROM     [Cnsta Ocupacion 1888]
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/Ocupacion/:Ocupacion', async (req, res) => {

    const Ocupacion = req.params.Ocupacion;
    try {

        const request = new Request(
            ` 
         SELECT   IdOcupacion, CodigoOcupacion, DescripcionOcupacion, [Id Estado]
FROM     [Cnsta Ocupacion 1888]
where DescripcionOcupacion like '%${Ocupacion}%' OR CodigoOcupacion like '%${Ocupacion}%'
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

// =================================================================================================

// ==============================Actualizar paciente desde asignar rips ==============

router.post('/ActualizarPaciente', async (req, res) => {
    const {
        IdTipoDocumento,
        Documento,
        PrimerApellido,
        SegundoApellido,
        PrimerNombre,
        SegundoNombre,
        FechaNacimiento,
        Edad,
        SexoBio,
        SexoIdenti,
        IdNacionalidad,
        Talla,
        Peso,
        IdResidencia,
        IdMunicipio,
        IdZonaTerritorial,
        Direccion,
        IdEtnia,
        ComunidadEtnica,
        IdDiscapacidad,
        Telefono,
        IdOcupacion,
        Alergias,
        Alergeno
    } = req.body;

    const isEmptyRequired = (v) => {
        if (v === null || v === undefined) return true;
        const s = String(v).trim().toLowerCase();
        return s === '' || s === 'null' || s === 'undefined';
    };

    console.log(req.body);
    console.log(IdOcupacion);
    const fechaNacimientoValida = FechaNacimiento ? new Date(FechaNacimiento) : null;
    const calcularEdadDesdeFecha = (fecha) => {
        if (!fecha || isNaN(fecha.getTime())) return null;
        const hoy = new Date();
        let edad = hoy.getFullYear() - fecha.getFullYear();
        const m = hoy.getMonth() - fecha.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;
        return edad < 0 ? 0 : edad;
    };
    const edadCalculada = fechaNacimientoValida ? calcularEdadDesdeFecha(fechaNacimientoValida) : null;
    const edadParaGuardar = edadCalculada != null
        ? String(edadCalculada)
        : (Edad != null && String(Edad).trim() !== '' ? String(Edad).trim() : null);
    const idTipoDocumentoSeguro = (IdTipoDocumento != null && String(IdTipoDocumento).trim() !== '' && !Number.isNaN(parseInt(String(IdTipoDocumento).trim(), 10)))
        ? parseInt(String(IdTipoDocumento).trim(), 10)
        : null;
    const idOcupacionSeguro = (IdOcupacion != null && String(IdOcupacion).trim() !== '' && !Number.isNaN(parseInt(String(IdOcupacion).trim(), 10)))
        ? parseInt(String(IdOcupacion).trim(), 10)
        : null;

    if (FechaNacimiento && isNaN(fechaNacimientoValida.getTime())) {
        return res.status(400).json({
            success: false,
            message: 'FechaNacimiento no tiene un formato válido'
        });
    }


    if (!Documento || Documento.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El campo Documento es obligatorio'
        });
    }

    const requiredFields = [
        { key: 'IdTipoDocumento', value: IdTipoDocumento, label: 'Tipo Documento' },
        { key: 'PrimerApellido', value: PrimerApellido, label: 'Primer Apellido' },
        { key: 'PrimerNombre', value: PrimerNombre, label: 'Primer Nombre' },
        { key: 'FechaNacimiento', value: FechaNacimiento, label: 'Fecha y Hora Nacimiento' },
        { key: 'SexoBio', value: SexoBio, label: 'Sexo Biológico' },
        { key: 'IdNacionalidad', value: IdNacionalidad, label: 'Nacionalidad (País)' },
        { key: 'IdResidencia', value: IdResidencia, label: 'País Residencia' },
        { key: 'IdMunicipio', value: IdMunicipio, label: 'Municipio Residencia' },
        { key: 'IdZonaTerritorial', value: IdZonaTerritorial, label: 'Zona Territorial' },
        // { key: 'IdEtnia', value: IdEtnia, label: 'Etnia' },
        // { key: 'IdDiscapacidad', value: IdDiscapacidad, label: 'Discapacidad' },
    ];
    const missing = requiredFields.filter(f => isEmptyRequired(f.value));
    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Faltan campos obligatorios: ${missing.map(m => m.label).join(', ')}`
        });
    }

    // Asegurar fila base para que el UPDATE de sp_Paciente_Guardar sí tenga a quién actualizar.
    // Si no existe Entidad1888 para el documento, se crea con valores mínimos.
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('DocumentoPaciente', sql.NVarChar(50), Documento.trim())
            .query(`
                IF NOT EXISTS (
                    SELECT 1
                    FROM [dbo].[Entidad1888]
                    WHERE [Documento Entidad] = @DocumentoPaciente
                )
                BEGIN
                    INSERT INTO [dbo].[Entidad1888] ([Documento Entidad])
                    VALUES (@DocumentoPaciente)
                END
            `);
    } catch (ensureErr) {
        console.error('❌ Error asegurando fila en Entidad1888 antes de actualizar:', ensureErr);
    }

    const resultados = [];

    const request = new Request('sp_Paciente_Guardar', (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar el procedimiento:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Error al ejecutar el procedimiento almacenado'
            });
        }
        (async () => {
            try {
                // Refuerzo: upsert explícito en Entidad1888 para evitar que quede en null
                // cuando el SP no encuentra fila para UPDATE.
                const pool = await poolPromise;
                await pool.request()
                    .input('Documento', sql.NVarChar(50), Documento ? String(Documento).trim() : null)
                    .input('FechaNacimiento', sql.DateTime, fechaNacimientoValida)
                    .input('EdadCalculada', sql.Int, edadCalculada)
                    .input('SexoIdenti', sql.Int, SexoIdenti != null ? parseInt(SexoIdenti, 10) : null)
                    .input('Talla', sql.VarChar(10), Talla != null && String(Talla).trim() !== '' ? String(Talla).trim() : null)
                    .input('Peso', sql.VarChar(10), Peso != null && String(Peso).trim() !== '' ? String(Peso).trim() : null)
                    .input('IdEtnia', sql.Int, IdEtnia != null && String(IdEtnia).trim() !== '' ? parseInt(IdEtnia, 10) : null)
                    .input('ComunidadEtnica', sql.VarChar(50), ComunidadEtnica != null && String(ComunidadEtnica).trim() !== '' ? String(ComunidadEtnica).trim() : null)
                    .input('IdDiscapacidad', sql.Int, IdDiscapacidad != null && String(IdDiscapacidad).trim() !== '' ? parseInt(IdDiscapacidad, 10) : null)
                    .input('IdNacionalidad', sql.Int, IdNacionalidad != null && String(IdNacionalidad).trim() !== '' ? parseInt(IdNacionalidad, 10) : null)
                    .input('IdResidencia', sql.Int, IdResidencia != null && String(IdResidencia).trim() !== '' ? parseInt(IdResidencia, 10) : null)
                    .input('IdMunicipio', sql.Int, IdMunicipio != null && String(IdMunicipio).trim() !== '' ? parseInt(IdMunicipio, 10) : null)
                    .input('Alergias', sql.VarChar(90), Alergias != null && String(Alergias).trim() !== '' ? String(Alergias).trim() : null)
                    .input('Alergeno', sql.VarChar(150), Alergeno != null && String(Alergeno).trim() !== '' ? String(Alergeno).trim() : null)
                    .query(`
                        UPDATE [dbo].[EntidadIII]
                        SET [Fecha Nacimiento EntidadIII] = ISNULL(@FechaNacimiento, [Fecha Nacimiento EntidadIII]),
                            [Edad EntidadIII] = ISNULL(@EdadCalculada, [Edad EntidadIII])
                        WHERE [Documento Entidad] = @Documento;

                        IF EXISTS (SELECT 1 FROM [dbo].[Entidad1888] WHERE [Documento Entidad] = @Documento)
                        BEGIN
                            UPDATE [dbo].[Entidad1888]
                            SET [Id Identidad Genero] = @SexoIdenti,
                                [Talla] = @Talla,
                                [Peso] = @Peso,
                                [Id Etnia] = @IdEtnia,
                                [Comunidad Etnica] = @ComunidadEtnica,
                                [Id Discapacidad] = @IdDiscapacidad,
                                [Id Pais Nacionalidad] = @IdNacionalidad,
                                [Id Pais Recidencia] = @IdResidencia,
                                [Id Municipio Recidencia] = @IdMunicipio,
                                [Alergias] = @Alergias,
                                [Alergeno] = @Alergeno
                            WHERE [Documento Entidad] = @Documento
                        END
                        ELSE
                        BEGIN
                            INSERT INTO [dbo].[Entidad1888]
                            (
                                [Documento Entidad], [Id Identidad Genero], [Talla], [Peso], [Id Etnia],
                                [Comunidad Etnica], [Id Discapacidad], [Id Pais Nacionalidad],
                                [Id Pais Recidencia], [Id Municipio Recidencia], [Alergias], [Alergeno]
                            )
                            VALUES
                            (
                                @Documento, @SexoIdenti, @Talla, @Peso, @IdEtnia,
                                @ComunidadEtnica, @IdDiscapacidad, @IdNacionalidad,
                                @IdResidencia, @IdMunicipio, @Alergias, @Alergeno
                            )
                        END
                    `);
            } catch (eUpsert1888) {
                console.error('❌ Error en upsert de Entidad1888 (post-SP):', eUpsert1888);
            }

            console.log('Procedimiento ejecutado con éxito');
            return res.json({
                success: true,
                message: 'Paciente guardado correctamente',
                rowsAffected: rowCount,
                data: resultados
            });
        })();
    });

    request.addParameter('IdTipoDocumento', TYPES.Int, idTipoDocumentoSeguro);
    request.addParameter('Documento', TYPES.NVarChar, Documento);
    request.addParameter('PrimerApellido', TYPES.NVarChar, PrimerApellido || null);
    request.addParameter('SegundoApellido', TYPES.NVarChar, SegundoApellido || null);
    request.addParameter('PrimerNombre', TYPES.NVarChar, PrimerNombre || null);
    request.addParameter('SegundoNombre', TYPES.NVarChar, SegundoNombre || null);
    request.addParameter('FechaNacimiento', TYPES.DateTime, fechaNacimientoValida);
    request.addParameter('Edad', TYPES.NVarChar, edadParaGuardar);
    request.addParameter('SexoBio', TYPES.Int, SexoBio);
    request.addParameter('SexoIdenti', TYPES.Int, SexoIdenti);
    request.addParameter('IdNacionalidad', TYPES.Int, IdNacionalidad);
    request.addParameter('Talla', TYPES.NVarChar, Talla || null);
    request.addParameter('Peso', TYPES.NVarChar, Peso || null);
    request.addParameter('IdResidencia', TYPES.Int, IdResidencia);
    request.addParameter('IdMunicipio', TYPES.Int, IdMunicipio);
    request.addParameter('IdZonaTerritorial', TYPES.Int, IdZonaTerritorial);
    request.addParameter('Direccion', TYPES.NVarChar, Direccion || null);
    request.addParameter('IdEtnia', TYPES.Int, IdEtnia);
    request.addParameter('ComunidadEtnica', TYPES.NVarChar, ComunidadEtnica || null);
    request.addParameter('IdDiscapacidad', TYPES.Int, IdDiscapacidad);
    request.addParameter('Telefono', TYPES.NVarChar, Telefono || null);
    request.addParameter('IdOcupacion', TYPES.Int, idOcupacionSeguro);

    request.on('row', columns => {
        const fila = {};

        columns.forEach(column => {
            fila[column.metadata.colName] = column.value;
        });

        resultados.push(fila);
    });

    connection.callProcedure(request);
});


// =================================================================================================


// ==============================RDA PACIENTE ==============




router.get('/SSGSSS/:SSGSSS', async (req, res) => {

    const SSGSSS = req.params.SSGSSS;
    try {

        const request = new Request(
            ` 
         SELECT   Idsgsss, Codigo, Nombre, IdEstado, IdRegimen, NombreRegimen, Descripcion
            FROM     [Cnsta Entidad SSGSSS 1888]
            where Descripcion like '%${SSGSSS}%' OR Codigo like '%${SSGSSS}%'
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/SSGSSS/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT Idsgsss, Codigo, Nombre, IdEstado, IdRegimen, NombreRegimen, Descripcion
            FROM [Cnsta Entidad SSGSSS 1888]
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener SSGSSS:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});



router.get('/Profesionales/:Profesional', async (req, res) => {

    const Profesional = req.params.Profesional;
    try {

        const request = new Request(
            ` 
         SELECT   Documento, Nombres
            FROM     [Cnsta VB Todos - Profesional - Orden Alfabético]
            where Nombres like '%${Profesional}%' OR Documento like '%${Profesional}%'
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Profesionales/', async (req, res) => {

    try {

        const request = new Request(
            ` 
         SELECT   Documento, Nombres
            FROM     [Cnsta VB Todos - Profesional - Orden Alfabético]
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

// Devuelve el tipo de documento del profesional por número de documento.
// Útil para autollenar RDA_TipoDocProfesional / RDACE_TipoDocProfesional al seleccionar en Select2.
router.get('/Profesionales/TipoDocumento/:Documento', async (req, res) => {
    try {
        const documento = (req.params.Documento || '').toString().trim();
        if (!documento) {
            return res.status(400).json({ ok: false, error: 'Documento requerido' });
        }

        const pool = await poolPromise;
        const q = await pool
            .request()
            .input('Documento', sql.NVarChar(50), documento)
            .query(`
                SELECT TOP 1
                    e.[Documento Entidad]          AS Documento,
                    td.[Tipo de Documento]         AS TipoDocumento,
                    td.[Código Tipo de Documento]  AS CodigoTipoDocumento
                FROM [Entidad] e
                LEFT JOIN [Tipo de Documento] td
                    ON td.[Id Tipo de Documento] = e.[Id Tipo de Documento]
                WHERE e.[Documento Entidad] = @Documento
            `);

        const row = (q.recordset && q.recordset[0]) || null;
        if (!row) {
            return res.status(404).json({ ok: false, error: 'Profesional no encontrado' });
        }

        const tipo = row.TipoDocumento != null ? String(row.TipoDocumento).trim() : '';
        const codigo = row.CodigoTipoDocumento != null ? String(row.CodigoTipoDocumento).trim() : '';

        return res.json({
            ok: true,
            Documento: row.Documento,
            TipoDocProfesional: tipo || null,
            CodigoTipoDocProfesional: codigo || null,
        });
    } catch (error) {
        console.error('❌ Error al obtener tipo de documento del profesional:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: 'Error interno del servidor' });
        }
    }
});

// =================================================================================================
// ==========================RDA=====================================

router.get('/Empresas/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT IdEmpresa, DocumentoEmpresa, IdTipodeDocumento, FechaExpediciónEmpresa, IdCiudad, NombreComercialEmpresa, RazonSocialEmpresa, [FechaInscripción}Empresa], CódigoEmpresa, ObservacionesEmpresa, 
                   FotoEmpresa, IdEstado, NroIDPrestador 
            FROM [Cnsta Empresa 1888]
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Empresas:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


// =================================================================================================
// ==========================Medicamentos DCI=====================================

router.get('/MedicamentosDCI/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT   IDMedicamentoDCI1888, Codigo, Descripcion, IdEstado
            FROM     [Cnsta Medicamentos DCI 1888]
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Medicamentos DCI:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});

router.get('/MedicamentosDCI/:MedicamentoDCI', async (req, res) => {
    const MedicamentoDCI = req.params.MedicamentoDCI;
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT  IDMedicamentoDCI1888, Codigo, Descripcion, IdEstado
            FROM     [Cnsta Medicamentos DCI 1888]
            Where Descripcion like '%${MedicamentoDCI}%' OR Codigo like '%${MedicamentoDCI}%'
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Medicamentos DCI:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


router.get('/Cups1888/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT Tabla, Codigo, Nombre, Descripcion, Tipo
            FROM [Cnsta Cups 1888]
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Cups:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});

router.get('/Cups1888/:Cups', async (req, res) => {
    const Cups = req.params.Cups;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + Cups + '%')
            .query(`
            SELECT TOP 100 Tabla, Codigo, Nombre, Descripcion, Tipo
            FROM [Cnsta Cups 1888]
            WHERE Descripcion LIKE @Busqueda OR Codigo LIKE @Busqueda OR Nombre LIKE @Busqueda
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Cups:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});



router.get(['/compromisoVI/:Documentopaciente', '/compromisoVI/:Documentopaciente    '], async (req, res) => {
    const Documentopaciente = req.params.Documentopaciente;
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('Documentopaciente', sql.VarChar, Documentopaciente).query(`
            SELECT TOP (200) 
    Fechaini, Fechafin, Horaini, Horafin, Docpaciente, Estado, [Id CompromisoVI]
FROM [Cnsta Compromiso VI 1888]
WHERE Docpaciente = @Documentopaciente
AND CAST(Fechaini AS DATE) = CAST(GETDATE() AS DATE)
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener compromiso VI:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


// --- RDA Paciente — rutas en archivo separado (rda/RdaPacienteRoutes.js) ---
router.use(require('./rda/RdaPacienteRoutes'));
router.use(require('./rda/RdaPacienteRoutesV2'));
// --- RDA Login compartido (token + consultas de profesional/organización) ---
router.use(require('./rda/RdaLoginRoutes'));
// --- RDA Consulta Externa — rutas en archivo separado (rda/RdaConsultaExternaRoutes.js) ---
router.use(require('./rda/RdaConsultaExternaRoutes'));
router.use(require('./rda/RdaConsultaExternaRoutesv2'));
// --- Envío masivo RDA pendientes (listado + lotes vía EnviarIHCE) ---
router.use(require('./rda/RdaEnvioMasivoRoutes'));

module.exports = router;
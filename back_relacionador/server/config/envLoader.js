/**
 * Carga .env, completa desde CRINFO.ini solo lo que falte y persiste en .env una vez.
 * Debe ejecutarse antes de importar db/db2/rutas.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_CRINFO_PATHS = [
    'C:/ceeresio/crinfo.ini',
    'C:/CeereSio/CRInfo.ini',
];

const LEGACY_DB_USER = 'CeereRIPS';
const LEGACY_DB_PASSWORD = 'crsoft';

function loadDotEnvFromCandidates() {
    const candidates = [
        path.resolve(__dirname, '..', '..', '.env'),
        path.join(process.cwd(), 'back_relacionador', '.env'),
        path.join(process.cwd(), '.env'),
    ];
    for (const envPath of candidates) {
        try {
            if (!fs.existsSync(envPath)) continue;
            const text = fs.readFileSync(envPath, 'utf8');
            for (const line of text.split(/\r?\n/)) {
                const s = line.replace(/^\uFEFF/, '').trim();
                if (!s || s.startsWith('#')) continue;
                const eq = s.indexOf('=');
                if (eq <= 0) continue;
                const key = s.slice(0, eq).trim();
                let val = s.slice(eq + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                // IHCE / APIM: el .env del backend debe poder sustituir variables de sistema (a veces vacías o viejas).
                const ihceOrApimKey =
                    key.startsWith('IHCE') ||
                    key.startsWith('OCP_APIM') ||
                    key === 'OCP_APIM_SUBSCRIPTION_KEY' ||
                    key === 'OCP_APIM_SUBSCRIPTION_KEY_PROD';
                if (ihceOrApimKey && String(val).trim() !== '') {
                    process.env[key] = val;
                    continue;
                }
                const cur = process.env[key];
                const vacio = cur === undefined || cur === null || String(cur).trim() === '';
                if (vacio) process.env[key] = val;
            }
            return envPath;
        } catch (err) {
            console.warn('[envLoader] Lectura .env fallida:', envPath, err && err.message ? err.message : err);
        }
    }
    return null;
}

function isEmpty(v) {
    return v === undefined || v === null || String(v).trim() === '';
}

/**
 * Extrae DataSource y Catalog del contenido INI (misma lógica que el código legacy).
 */
function parseCrInfoContent(fileContent) {
    const lines = fileContent.split(/\r?\n/);
    const dataSourceLine = lines.find((line) => line.includes('DataSource'));
    const catalogLine = lines.find((line) => line.trim().startsWith('Catalog='));

    if (!dataSourceLine || !catalogLine) {
        return null;
    }
    const rawDs = dataSourceLine.split('=').slice(1).join('=').trim();
    const rawCat = catalogLine.split('=').slice(1).join('=').trim();
    const dataSource = rawDs.split('\\')[0].trim();
    const catalog = rawCat.split('\\')[0].trim();
    if (!dataSource || !catalog) return null;
    return { dataSource, catalog };
}

function readFirstExistingIni() {
    const extra = process.env.CRINFO_INI_PATH;
    const paths = extra ? [extra, ...DEFAULT_CRINFO_PATHS] : [...DEFAULT_CRINFO_PATHS];
    const unique = [...new Set(paths)];
    for (const p of unique) {
        try {
            if (fs.existsSync(p)) {
                const content = fs.readFileSync(p, 'utf8');
                const parsed = parseCrInfoContent(content);
                if (parsed) {
                    return { path: p, ...parsed };
                }
            }
        } catch (e) {
            console.warn('[envLoader] No se pudo leer INI:', p, e && e.message);
        }
    }
    return null;
}

function resolveEnvFilePath(preferredPath) {
    if (preferredPath && fs.existsSync(preferredPath)) return preferredPath;
    const createAt = path.join(__dirname, '..', '..', '.env');
    return createAt;
}

function appendOrUpdateDotEnv(envPath, updates) {
    let existing = '';
    try {
        if (fs.existsSync(envPath)) existing = fs.readFileSync(envPath, 'utf8');
    } catch (_) {}

    const lines = existing.split(/\r?\n/);
    const keysToWrite = Object.keys(updates);
    const map = new Map();
    for (const line of lines) {
        const s = line.trim();
        if (!s || s.startsWith('#')) continue;
        const eq = s.indexOf('=');
        if (eq <= 0) continue;
        const k = s.slice(0, eq).trim();
        map.set(k, line);
    }

    const out = [...lines];
    if (out.length && out[out.length - 1] !== '') out.push('');

    const header = '\n# Auto-generado por envLoader (fallback CRINFO.ini)\n';
    let added = false;
    for (const key of keysToWrite) {
        const val = updates[key];
        if (val === undefined || val === null) continue;
        const newLine = `${key}=${String(val).replace(/\r?\n/g, ' ')}`;
        if (map.has(key)) {
            const idx = out.findIndex((l) => l.trim().startsWith(`${key}=`));
            if (idx >= 0) out[idx] = newLine;
        } else {
            if (!added) {
                out.push(header.trimEnd());
                added = true;
            }
            out.push(newLine);
        }
    }
    fs.writeFileSync(envPath, out.join('\n'), 'utf8');
    console.log('[envLoader] Variables persistidas en:', envPath);
}

/**
 * Sincroniza process.env y opcionalmente .env desde INI si faltan claves.
 */
function ensureBackendEnv() {
    const envPath = loadDotEnvFromCandidates();

    const needDb = ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD'].some((k) => isEmpty(process.env[k]));
    const missing = [];
    if (isEmpty(process.env.DB_SERVER)) missing.push('DB_SERVER');
    if (isEmpty(process.env.DB_DATABASE)) missing.push('DB_DATABASE');
    if (isEmpty(process.env.DB_USER)) missing.push('DB_USER');
    if (isEmpty(process.env.DB_PASSWORD)) missing.push('DB_PASSWORD');

    if (!needDb) {
        return { envPath, filledFromIni: false };
    }

    const ini = readFirstExistingIni();
    if (!ini) {
        throw new Error(
            '[envLoader] Faltan DB_SERVER/DB_DATABASE/DB_USER/DB_PASSWORD en .env y no se encontró CRINFO.ini válido en ' +
                DEFAULT_CRINFO_PATHS.join(', ') +
                (process.env.CRINFO_INI_PATH ? ` (CRINFO_INI_PATH=${process.env.CRINFO_INI_PATH})` : '')
        );
    }

    const updates = {};
    if (isEmpty(process.env.DB_SERVER)) {
        process.env.DB_SERVER = ini.dataSource;
        updates.DB_SERVER = ini.dataSource;
    }
    if (isEmpty(process.env.DB_DATABASE)) {
        process.env.DB_DATABASE = ini.catalog;
        updates.DB_DATABASE = ini.catalog;
    }
    if (isEmpty(process.env.DB_USER)) {
        process.env.DB_USER = LEGACY_DB_USER;
        updates.DB_USER = LEGACY_DB_USER;
    }
    if (isEmpty(process.env.DB_PASSWORD)) {
        process.env.DB_PASSWORD = LEGACY_DB_PASSWORD;
        updates.DB_PASSWORD = LEGACY_DB_PASSWORD;
    }

    const targetEnv = resolveEnvFilePath(envPath);
    appendOrUpdateDotEnv(targetEnv, updates);

    console.log('[envLoader] Configuración completada desde INI:', ini.path);
    return { envPath: targetEnv, filledFromIni: true };
}

module.exports = {
    ensureBackendEnv,
    loadDotEnvFromCandidates,
    parseCrInfoContent,
};

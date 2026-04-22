/**
 * Base /apiV3 y cabeceras JSON + token (alineado con EnvioRdaPendientes).
 */

export function getApiV3Base() {
    const g = typeof window !== 'undefined' && typeof window.getApiBaseUrl === 'function'
        ? String(window.getApiBaseUrl() || '')
        : '';
    const b = g.replace(/\/$/, '');
    return `${b}/apiV3`;
}

export function authJsonHeaders(extra) {
    const h = { 'Content-Type': 'application/json', ...(extra || {}) };
    try {
        const t = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
        if (t) h.Authorization = t;
    } catch (e) {
        /* ignore */
    }
    return h;
}

/**
 * @param {string} path - ej. "/EvaluacionEntidadRDA/" (con o sin barra inicial)
 * @param {object} [body]
 */
export async function postJson(path, body) {
    const base = getApiV3Base();
    const p = path.startsWith('/') ? path : `/${path}`;
    const url = `${base}${p}`;
    const r = await fetch(url, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: body != null ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        data = { raw: text };
    }
    if (!r.ok || data.ok === false) {
        const err = new Error(data.error || r.statusText || 'Error en petición');
        err.status = r.status;
        err.data = data;
        throw err;
    }
    return data;
}

/**
 * @param {string} path
 * @param {object} [body]
 */
export async function postJsonLoose(path, body) {
    const base = getApiV3Base();
    const p = path.startsWith('/') ? path : `/${path}`;
    const r = await fetch(`${base}${p}`, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: body != null ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        data = { raw: text };
    }
    return { ok: r.ok, status: r.status, data, text };
}

/**
 * Feature flag: 'legacy' | 'v2'
 * Prioridad: localStorage RDA_API_VERSION > __APP_CONFIG__.RDA_API_VERSION > 'legacy'
 */
export function getRdaApiVersion() {
    try {
        const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('RDA_API_VERSION') : null;
        if (ls && String(ls).trim()) {
            const v = String(ls).trim().toLowerCase();
            return v === 'v2' ? 'v2' : 'legacy';
        }
    } catch (e) {
        /* ignore */
    }
    const cfg = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};
    const v = String(cfg.RDA_API_VERSION || 'legacy').trim().toLowerCase();
    return v === 'v2' ? 'v2' : 'legacy';
}

export function isRdaV2() {
    return getRdaApiVersion() === 'v2';
}

export function isRdaLegacy() {
    return getRdaApiVersion() === 'legacy';
}

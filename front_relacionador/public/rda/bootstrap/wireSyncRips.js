/**
 * wireSyncRips.js — Sincroniza selects RIPS (Asignar) → campos RDA / RDACE.
 *
 * Dos flujos:
 *   1. RDA Paciente: modalidad + grupo servicios
 *   2. RDA Consulta Externa: modalidad + grupo + vía ingreso + causa motivo
 *
 * Cada flujo intenta copiar opciones de selects RIPS existentes; si no están
 * cargados, hace fallback a /apiV3. Observa cambios con MutationObserver +
 * polling temporizado para cubrir cargas asíncronas.
 */

import { getApiBaseUrl } from "../api/apiBaseUrl.js";

// ── Helpers compartidos ───────────────────────────────────────────────────

const isVisible = (el) => !!(el && el.offsetParent !== null);

function getPreferredFlow() {
    const tipoAC = document.getElementById("TipoAC");
    const tipoAP = document.getElementById("TipoAP");
    if (isVisible(tipoAC)) return "AC";
    if (isVisible(tipoAP)) return "AP";
    return null;
}

function findFirstAvailableSelect(ids) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.tagName === "SELECT") return el;
    }
    return null;
}

function hasRealOptions(selectEl) {
    const opts = Array.from(selectEl?.options || []);
    return opts.some((opt) => {
        const v = String(opt.value ?? "").trim();
        const t = String(opt.textContent ?? "").trim();
        if (!v || !t) return false;
        return !/sin\s*seleccionar|seleccionar/i.test(t.toLowerCase());
    });
}

function populateFromSource(target, source) {
    if (!target || !source || !source.options) return false;
    if (!hasRealOptions(source)) return false;
    target.innerHTML = "";
    Array.from(source.options).forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.textContent;
        target.appendChild(o);
    });
    return true;
}

function syncValue(target, source) {
    if (!target || !source) return;
    const v = source.value;
    if (!v || v === "Sin Seleccionar") return;
    if (target.querySelector(`option[value="${v}"]`)) target.value = v;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJsonWithRetry(url, attempts = 5) {
    let lastErr;
    for (let i = 1; i <= attempts; i += 1) {
        try {
            const res = await fetch(url);
            const text = await res.text();
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
            try {
                return JSON.parse(text);
            } catch (parseErr) {
                throw new Error(`JSON parse failed: ${text.slice(0, 200)}`);
            }
        } catch (e) {
            lastErr = e;
            if (i < attempts) await sleep(400 * i);
        }
    }
    throw lastErr;
}

function observeAndPoll(sourceEls, refreshFn) {
    sourceEls.forEach((el) => {
        if (!el) return;
        el.addEventListener("change", refreshFn);
        const obs = new MutationObserver(refreshFn);
        obs.observe(el, { childList: true, subtree: true, attributes: true });
    });

    let retries = 0;
    const syncTimer = setInterval(() => {
        retries += 1;
        refreshFn();
        if (retries >= 20) clearInterval(syncTimer);
    }, 500);
}

// ── Sync 1: RDA Paciente (modalidad + grupo) ─────────────────────────────

async function cargarYSincronizarModalidadYGrupoRdaPaciente() {
    const sm = document.getElementById("RDA_IdModalidadAtencion");
    const sg = document.getElementById("RDA_IdGrupoServicios");
    if (!sm || !sg) return;

    const sourceModalidadIds = [
        "listaModalidadAtencion",
        "SelectModalidadGrupoServicioTecnologiaSalud",
        "SelectModalidadGrupoServicioTecSalAP",
        "SelectPorDefectoModalidadGrupoServicioTecSalAC",
        "SelectPorDefectoModalidadGrupoServicioTecSalAP",
    ];
    const sourceGrupoIds = [
        "listaGrupoServicios",
        "SelectGrupoServiciosAC",
        "SelectGrupoServiciosAP",
        "SelectPoDefectoGrupoServiciosAC",
        "SelectPorDefectoGrupoServiciosAP",
    ];

    const findBestSource = (ids) => {
        const candidates = ids
            .map((id) => document.getElementById(id))
            .filter((el) => el && el.tagName === "SELECT");
        if (!candidates.length) return null;
        const flow = getPreferredFlow();
        if (flow === "AC") {
            const x = candidates.find((el) => /TecnologiaSalud|GrupoServiciosAC/.test(el.id));
            if (x && (x.options?.length || 0) > 1) return x;
        }
        if (flow === "AP") {
            const x = candidates.find((el) => /TecSalAP|GrupoServiciosAP/.test(el.id));
            if (x && (x.options?.length || 0) > 1) return x;
        }
        const withOptions = candidates.find((el) => (el.options?.length || 0) > 1);
        return withOptions || candidates[0];
    };

    let sourceModalidad = findBestSource(sourceModalidadIds) || findFirstAvailableSelect(sourceModalidadIds);
    let sourceGrupo = findBestSource(sourceGrupoIds) || findFirstAvailableSelect(sourceGrupoIds);

    const copiedModalidad = populateFromSource(sm, sourceModalidad);
    const copiedGrupo = populateFromSource(sg, sourceGrupo);
    syncValue(sm, sourceModalidad);
    syncValue(sg, sourceGrupo);

    if (!copiedModalidad || !copiedGrupo) {
        const base = `${getApiBaseUrl()}/apiV3`;
        try {
            const [modRaw, grpRaw] = await Promise.all([
                fetchJsonWithRetry(`${base}/ModalidadAtencion`),
                fetchJsonWithRetry(`${base}/GrupoServicios`),
            ]);
            const modalidades = Array.isArray(modRaw) ? modRaw : [];
            const grupos = Array.isArray(grpRaw) ? grpRaw : [];
            modalidades.sort((a, b) =>
                String(a.NombreModalidadAtencion || "").localeCompare(String(b.NombreModalidadAtencion || ""))
            );
            grupos.sort((a, b) =>
                String(a.NombreGrupoServicios || "").localeCompare(String(b.NombreGrupoServicios || ""))
            );

            if (!copiedModalidad) {
                sm.innerHTML = '<option value="">Seleccionar</option>';
                modalidades.forEach((m) => {
                    const o = document.createElement("option");
                    o.value = m.IdModalidadAtencion;
                    o.textContent = m.NombreModalidadAtencion || m.Codigo || m.IdModalidadAtencion;
                    sm.appendChild(o);
                });
            }
            if (!copiedGrupo) {
                sg.innerHTML = '<option value="">Seleccionar</option>';
                grupos.forEach((g) => {
                    const o = document.createElement("option");
                    o.value = g.IdGrupoServicios;
                    o.textContent = g.NombreGrupoServicios || g.Codigo || g.IdGrupoServicios;
                    sg.appendChild(o);
                });
            }
        } catch (e) {
            console.warn("[RDA] No se pudieron cargar/sincronizar Modalidad/GrupoServicios:", e);
        }
    }

    const refreshSync = () => {
        sourceModalidad = findBestSource(sourceModalidadIds) || findFirstAvailableSelect(sourceModalidadIds);
        sourceGrupo = findBestSource(sourceGrupoIds) || findFirstAvailableSelect(sourceGrupoIds);
        if (sourceModalidad) { populateFromSource(sm, sourceModalidad); syncValue(sm, sourceModalidad); }
        if (sourceGrupo) { populateFromSource(sg, sourceGrupo); syncValue(sg, sourceGrupo); }
    };

    refreshSync();
    observeAndPoll([sourceModalidad, sourceGrupo], refreshSync);
}

// ── Sync 2: RDACE (modalidad + grupo + vía ingreso + causa) ──────────────

async function cargarYSincronizarRipsContextRdace() {
    const sm = document.getElementById("RDACE_IdModalidadAtencion");
    const sg = document.getElementById("RDACE_IdGrupoServicios");
    const sv = document.getElementById("RDACE_IdViaIngresoUsuario");
    const sc = document.getElementById("RDACE_IdCausaMotivoAtencion");
    if (!sm || !sg || !sv || !sc) return;

    const base = `${getApiBaseUrl()}/apiV3`;

    const sourceModalidadIds = [
        "listaModalidadAtencion",
        "SelectModalidadGrupoServicioTecnologiaSalud",
        "SelectModalidadGrupoServicioTecSalAP",
        "SelectPorDefectoModalidadGrupoServicioTecSalAC",
        "SelectPorDefectoModalidadGrupoServicioTecSalAP",
    ];
    const sourceGrupoIds = [
        "listaGrupoServicios",
        "SelectGrupoServiciosAC",
        "SelectGrupoServiciosAP",
        "SelectPoDefectoGrupoServiciosAC",
        "SelectPorDefectoGrupoServiciosAP",
    ];
    const sourceViaIds = ["SelectViaIngresoServicioSaludAP", "SelectPorDefectoViaIngresoServicioSaludAP"];
    const sourceCausaIds = ["SelectCausaMotivoAtencion", "SelectPorDefectoCausaMotivoAtencionAC"];

    const findBestSource = (ids, kind) => {
        const candidates = ids
            .map((id) => document.getElementById(id))
            .filter((el) => el && el.tagName === "SELECT");
        if (!candidates.length) return null;
        const flow = getPreferredFlow();
        if (kind === "modalidad") {
            if (flow === "AC") {
                const x = candidates.find((el) => /TecnologiaSalud|TecSalAC|Defecto.*AC/i.test(el.id));
                if (x && (x.options?.length || 0) > 1) return x;
            }
            if (flow === "AP") {
                const x = candidates.find((el) => /TecSalAP|Defecto.*AP/i.test(el.id));
                if (x && (x.options?.length || 0) > 1) return x;
            }
        }
        if (kind === "grupo") {
            if (flow === "AC") {
                const x = candidates.find((el) => /GrupoServiciosAC|DefectoGrupo.*AC/i.test(el.id));
                if (x && (x.options?.length || 0) > 1) return x;
            }
            if (flow === "AP") {
                const x = candidates.find((el) => /GrupoServiciosAP|DefectoGrupo.*AP/i.test(el.id));
                if (x && (x.options?.length || 0) > 1) return x;
            }
        }
        const withOptions = candidates.find((el) => (el.options?.length || 0) > 1);
        return withOptions || candidates[0];
    };

    const fillModalidadApi = async () => {
        const modRaw = await fetchJsonWithRetry(`${base}/ModalidadAtencion`);
        const modalidades = Array.isArray(modRaw) ? modRaw : [];
        modalidades.sort((a, b) =>
            String(a.NombreModalidadAtencion || "").localeCompare(String(b.NombreModalidadAtencion || ""))
        );
        sm.innerHTML = '<option value="">Seleccionar</option>';
        modalidades.forEach((m) => {
            const o = document.createElement("option");
            o.value = m.IdModalidadAtencion;
            o.textContent = m.NombreModalidadAtencion || m.Codigo || m.IdModalidadAtencion;
            sm.appendChild(o);
        });
    };
    const fillGrupoApi = async () => {
        const grpRaw = await fetchJsonWithRetry(`${base}/GrupoServicios`);
        const grupos = Array.isArray(grpRaw) ? grpRaw : [];
        grupos.sort((a, b) =>
            String(a.NombreGrupoServicios || "").localeCompare(String(b.NombreGrupoServicios || ""))
        );
        sg.innerHTML = '<option value="">Seleccionar</option>';
        grupos.forEach((g) => {
            const o = document.createElement("option");
            o.value = g.IdGrupoServicios;
            o.textContent = g.NombreGrupoServicios || g.Codigo || g.IdGrupoServicios;
            sg.appendChild(o);
        });
    };
    const fillViaApi = async () => {
        const raw = await fetch(`${base}/ViaIngresoUsuario`).then((r) => r.json());
        const rows = Array.isArray(raw) ? raw : [];
        rows.sort((a, b) =>
            String(a.NombreViaIngresoUsuario || "").localeCompare(String(b.NombreViaIngresoUsuario || ""))
        );
        sv.innerHTML = '<option value="">Seleccionar</option>';
        rows.forEach((row) => {
            const o = document.createElement("option");
            o.value = row.IdViaIngresoUsuario;
            o.textContent = row.NombreViaIngresoUsuario || row.Codigo || row.IdViaIngresoUsuario;
            sv.appendChild(o);
        });
    };
    const fillCausaApi = async () => {
        const raw = await fetch(`${base}/CausaExterna`).then((r) => r.json());
        const rows = Array.isArray(raw) ? raw : [];
        rows.sort((a, b) =>
            String(a.NombreRIPSCausaExternaVersion2 || "").localeCompare(String(b.NombreRIPSCausaExternaVersion2 || ""))
        );
        sc.innerHTML = '<option value="">Seleccionar</option>';
        rows.forEach((row) => {
            const o = document.createElement("option");
            o.value = row.IdRIPSCausaExternaVersion2;
            o.textContent = row.NombreRIPSCausaExternaVersion2 || row.Codigo || row.IdRIPSCausaExternaVersion2;
            sc.appendChild(o);
        });
    };

    let sourceModalidad = findBestSource(sourceModalidadIds, "modalidad") || findFirstAvailableSelect(sourceModalidadIds);
    let sourceGrupo = findBestSource(sourceGrupoIds, "grupo") || findFirstAvailableSelect(sourceGrupoIds);
    let sourceVia = findBestSource(sourceViaIds, "via") || findFirstAvailableSelect(sourceViaIds);
    let sourceCausa = findBestSource(sourceCausaIds, "causa") || findFirstAvailableSelect(sourceCausaIds);

    let copiedM = populateFromSource(sm, sourceModalidad);
    let copiedG = populateFromSource(sg, sourceGrupo);
    let copiedV = populateFromSource(sv, sourceVia);
    let copiedC = populateFromSource(sc, sourceCausa);
    syncValue(sm, sourceModalidad);
    syncValue(sg, sourceGrupo);
    syncValue(sv, sourceVia);
    syncValue(sc, sourceCausa);

    try {
        if (!copiedM) await fillModalidadApi();
        if (!copiedG) await fillGrupoApi();
        if (!copiedV) await fillViaApi();
        if (!copiedC) await fillCausaApi();
    } catch (e) {
        console.warn("[RDACE] No se pudieron cargar catálogos RIPS/contexto:", e);
    }

    const refreshSync = () => {
        sourceModalidad = findBestSource(sourceModalidadIds, "modalidad") || findFirstAvailableSelect(sourceModalidadIds);
        sourceGrupo = findBestSource(sourceGrupoIds, "grupo") || findFirstAvailableSelect(sourceGrupoIds);
        sourceVia = findBestSource(sourceViaIds, "via") || findFirstAvailableSelect(sourceViaIds);
        sourceCausa = findBestSource(sourceCausaIds, "causa") || findFirstAvailableSelect(sourceCausaIds);
        if (sourceModalidad) { populateFromSource(sm, sourceModalidad); syncValue(sm, sourceModalidad); }
        if (sourceGrupo) { populateFromSource(sg, sourceGrupo); syncValue(sg, sourceGrupo); }
        if (sourceVia) { populateFromSource(sv, sourceVia); syncValue(sv, sourceVia); }
        if (sourceCausa) { populateFromSource(sc, sourceCausa); syncValue(sc, sourceCausa); }
    };

    refreshSync();
    observeAndPoll([sourceModalidad, sourceGrupo, sourceVia, sourceCausa], refreshSync);
}

// ── Exportación ───────────────────────────────────────────────────────────

export function wireSyncRips() {
    cargarYSincronizarModalidadYGrupoRdaPaciente();
    cargarYSincronizarRipsContextRdace();
}

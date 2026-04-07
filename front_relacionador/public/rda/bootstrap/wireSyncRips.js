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

import { getServidor } from "../api/servidor.js";

const servidor = getServidor();

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

    // Para evitar tomar datos "quemados" de otros selects RIPS en pantalla,
    // estos campos RDA se cargan directamente desde la API (catálogos en BD).
    const base = `http://${servidor}:3000/apiV3`;
    try {
        const [modRaw, grpRaw] = await Promise.all([
            fetchJsonWithRetry(`${base}/ModalidadAtencion`),
            fetchJsonWithRetry(`${base}/GrupoServicios`),
        ]);
        const modalidades = Array.isArray(modRaw) ? modRaw : [];
        const grupos = Array.isArray(grpRaw) ? grpRaw : [];

        // Ordenar por código para mantener el orden ministerial 01-09.
        const codeKey = (x) => String(x?.Codigo ?? "").trim();
        modalidades.sort((a, b) => codeKey(a).localeCompare(codeKey(b), "es", { numeric: true }));
        grupos.sort((a, b) => String(a?.Codigo ?? "").localeCompare(String(b?.Codigo ?? ""), "es", { numeric: true }));

        sm.innerHTML = '<option value="">Seleccionar</option>';
        modalidades.forEach((m) => {
            const o = document.createElement("option");
            o.value = m.IdModalidadAtencion;
            const cod = String(m.Codigo || "").trim();
            const nom = String(m.NombreModalidadAtencion || "").trim();
            o.textContent = cod && nom ? `${cod} - ${nom}` : (nom || cod || m.IdModalidadAtencion);
            sm.appendChild(o);
        });

        sg.innerHTML = '<option value="">Seleccionar</option>';
        grupos.forEach((g) => {
            const o = document.createElement("option");
            o.value = g.IdGrupoServicios;
            const cod = String(g.Codigo || "").trim();
            const nom = String(g.NombreGrupoServicios || "").trim();
            o.textContent = cod && nom ? `${cod} - ${nom}` : (nom || cod || g.IdGrupoServicios);
            sg.appendChild(o);
        });
    } catch (e) {
        console.warn("[RDA] No se pudieron cargar Modalidad/GrupoServicios desde API:", e);
    }
}

// ── Sync 2: RDACE (modalidad + grupo + vía ingreso + causa) ──────────────

async function cargarYSincronizarRipsContextRdace() {
    const sm = document.getElementById("RDACE_IdModalidadAtencion");
    const sg = document.getElementById("RDACE_IdGrupoServicios");
    const sv = document.getElementById("RDACE_IdViaIngresoUsuario");
    const sc = document.getElementById("RDACE_IdCausaMotivoAtencion");
    if (!sm || !sg || !sv || !sc) return;

    const base = `http://${servidor}:3000/apiV3`;

    const fillModalidadApi = async () => {
        const modRaw = await fetchJsonWithRetry(`${base}/ModalidadAtencion`);
        const modalidades = Array.isArray(modRaw) ? modRaw : [];
        const codeKey = (x) => String(x?.Codigo ?? "").trim();
        modalidades.sort((a, b) => codeKey(a).localeCompare(codeKey(b), "es", { numeric: true }));
        sm.innerHTML = '<option value="">Seleccionar</option>';
        modalidades.forEach((m) => {
            const o = document.createElement("option");
            o.value = m.IdModalidadAtencion;
            const cod = String(m.Codigo || "").trim();
            const nom = String(m.NombreModalidadAtencion || "").trim();
            o.textContent = cod && nom ? `${cod} - ${nom}` : (nom || cod || m.IdModalidadAtencion);
            sm.appendChild(o);
        });
    };
    const fillGrupoApi = async () => {
        const grpRaw = await fetchJsonWithRetry(`${base}/GrupoServicios`);
        const grupos = Array.isArray(grpRaw) ? grpRaw : [];
        grupos.sort((a, b) => String(a?.Codigo ?? "").localeCompare(String(b?.Codigo ?? ""), "es", { numeric: true }));
        sg.innerHTML = '<option value="">Seleccionar</option>';
        grupos.forEach((g) => {
            const o = document.createElement("option");
            o.value = g.IdGrupoServicios;
            const cod = String(g.Codigo || "").trim();
            const nom = String(g.NombreGrupoServicios || "").trim();
            o.textContent = cod && nom ? `${cod} - ${nom}` : (nom || cod || g.IdGrupoServicios);
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

    try {
        // Igual que RDA Paciente: cargar directo desde API para evitar copiar
        // selects RIPS que pueden venir "quemados".
        await fillModalidadApi();
        await fillGrupoApi();
        await fillViaApi();
        await fillCausaApi();
    } catch (e) {
        console.warn("[RDACE] No se pudieron cargar catálogos RIPS/contexto:", e);
    }
}

// ── Exportación ───────────────────────────────────────────────────────────

export function wireSyncRips() {
    cargarYSincronizarModalidadYGrupoRdaPaciente();
    cargarYSincronizarRipsContextRdace();
}

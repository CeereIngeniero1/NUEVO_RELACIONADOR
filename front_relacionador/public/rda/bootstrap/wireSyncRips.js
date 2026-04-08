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

/** Copia .value de source a target solo si existe la opción (evita CSS frágil con comillas). */
function syncSelectValueFromSource(target, source) {
    if (!target || !source) return;
    const v = String(source.value ?? "").trim();
    if (!v || v === "Sin Seleccionar") return;
    const ok = Array.from(target.options).some((o) => o.value === v);
    if (ok) target.value = v;
}

function syncValue(target, source) {
    syncSelectValueFromSource(target, source);
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
        pushRipsAcModalidadGrupoToRdaPaciente();
    } catch (e) {
        console.warn("[RDA] No se pudieron cargar Modalidad/GrupoServicios desde API:", e);
    }
}

// RIPS AC → RDA Paciente (mismos IdModalidadAtencion / IdGrupoServicios que en Asignar_RIPS V3.js)
function pushRipsAcModalidadGrupoToRdaPaciente() {
    if (getPreferredFlow() !== "AC") return;
    const srcMod = document.getElementById("SelectModalidadGrupoServicioTecnologiaSalud");
    const srcGrp = document.getElementById("SelectGrupoServiciosAC");
    const dstMod = document.getElementById("RDA_IdModalidadAtencion");
    const dstGrp = document.getElementById("RDA_IdGrupoServicios");
    syncSelectValueFromSource(dstMod, srcMod);
    syncSelectValueFromSource(dstGrp, srcGrp);
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
        pushRipsAcModalidadGrupoCausaToRdace();
    } catch (e) {
        console.warn("[RDACE] No se pudieron cargar catálogos RIPS/contexto:", e);
    }
}

/** RIPS AC → RDACE: modalidad, grupo y causa (mismos IDs que en los selects RIPS). Vía ingreso AC no tiene select en el bloque RIPS AC (ViaIngreso fijo "0" en URL); RDACE vía queda manual. */
function pushRipsAcModalidadGrupoCausaToRdace() {
    if (getPreferredFlow() !== "AC") return;
    const srcMod = document.getElementById("SelectModalidadGrupoServicioTecnologiaSalud");
    const srcGrp = document.getElementById("SelectGrupoServiciosAC");
    const srcCausa = document.getElementById("SelectCausaMotivoAtencion");
    const dstMod = document.getElementById("RDACE_IdModalidadAtencion");
    const dstGrp = document.getElementById("RDACE_IdGrupoServicios");
    const dstCausa = document.getElementById("RDACE_IdCausaMotivoAtencion");
    syncSelectValueFromSource(dstMod, srcMod);
    syncSelectValueFromSource(dstGrp, srcGrp);
    syncSelectValueFromSource(dstCausa, srcCausa);
}

function wireRipsAcModalidadGrupoCausaListeners() {
    if (typeof window !== "undefined" && window.__wireSyncRipsAcModalidadGrupoBound) return;
    const srcMod = document.getElementById("SelectModalidadGrupoServicioTecnologiaSalud");
    const srcGrp = document.getElementById("SelectGrupoServiciosAC");
    const srcCausa = document.getElementById("SelectCausaMotivoAtencion");
    const sources = [srcMod, srcGrp, srcCausa].filter(Boolean);
    if (sources.length === 0) return;
    if (typeof window !== "undefined") window.__wireSyncRipsAcModalidadGrupoBound = true;

    const refresh = () => {
        pushRipsAcModalidadGrupoToRdaPaciente();
        pushRipsAcModalidadGrupoCausaToRdace();
    };
    observeAndPoll(sources, refresh);
    refresh();
}

// ── Sync 3: Tipo diagnóstico principal (RIPS AC ↔ RDA Paciente / RDACE) ──
// Misma clave que Catalogo1888/TipoDiagnosticoPrincipal: código 01, 02, 03.

function wireTipoDiagnosticoPrincipalBidir() {
    const rips = document.getElementById("SelectTipoDiagnosticoPrincipalAC");
    if (!rips || typeof window.$ === "undefined" || !window.$) return;

    const $ = window.$;
    const rda = "#RDA_TipoDiagPrincipalEgresoCIE10";
    const rdace = "#RDACE_TipoDiagPrincipalCIE10";

    let syncing = false;

    function displayForRipsCode(code) {
        const hit = Array.from(rips.options).find((o) => o.value === code);
        if (!hit) return code;
        const t = String(hit.textContent || "").trim();
        return t || code;
    }

    function ensureSelect2Option($el, code, displayText) {
        if (!$el.length || !$el.data("select2")) return;
        const c = code != null ? String(code).trim() : "";
        if (!c) {
            $el.val(null).trigger("change");
            return;
        }
        const disp =
            displayText && String(displayText).trim()
                ? String(displayText).trim()
                : displayForRipsCode(c);
        const has =
            $el.find("option").filter(function optValMatch() {
                return this.value === c;
            }).length > 0;
        if (!has) {
            $el.append(new Option(disp, c, true, true));
        }
        $el.val(c).trigger("change");
    }

    function pushRipsToSelect2Pair() {
        const code = String(rips.value || "").trim();
        const opt = rips.selectedOptions[0];
        const label = opt ? String(opt.textContent || "").trim() : "";
        syncing = true;
        try {
            if (
                !code &&
                !hasRealOptions(rips) &&
                ($(rda).val() || $(rdace).val())
            ) {
                /* Catálogo RIPS aún no cargado: no borrar lo ya elegido en RDA/RDACE. */
                return;
            }
            ensureSelect2Option($(rda), code, label);
            ensureSelect2Option($(rdace), code, label);
        } finally {
            syncing = false;
        }
    }

    /**
     * @param {boolean} isRda - true si el cambio vino de RDA Paciente; false si de RDACE.
     */
    function pullFromSelect2(isRda) {
        if (syncing) return;
        const $src = $(isRda ? rda : rdace);
        const $oth = $(isRda ? rdace : rda);
        const codeRaw = $src.val();
        const code = codeRaw != null ? String(codeRaw).trim() : "";
        let label = "";
        try {
            const d = $src.select2("data");
            if (d && d[0] && d[0].text) label = String(d[0].text);
        } catch (_) {
            /* ignore */
        }
        if (!label && code) label = displayForRipsCode(code);

        syncing = true;
        try {
            if (!code) {
                rips.selectedIndex = 0;
                $oth.val(null).trigger("change");
            } else {
                const hit = Array.from(rips.options).find((o) => o.value === code);
                if (hit) rips.value = code;
                ensureSelect2Option($oth, code, label);
            }
        } finally {
            syncing = false;
        }
    }

    function onRipsDomMaybeUpdated() {
        if (syncing) return;
        const $rda = $(rda);
        const $rdace = $(rdace);
        const fromFhir =
            ($rda.val() && String($rda.val()).trim()) ||
            ($rdace.val() && String($rdace.val()).trim()) ||
            "";
        const v = String(fromFhir || "").trim();
        if (v && !String(rips.value || "").trim()) {
            const hit = Array.from(rips.options).find((o) => o.value === v);
            if (hit) {
                syncing = true;
                try {
                    rips.value = v;
                } finally {
                    syncing = false;
                }
            }
        }
        pushRipsToSelect2Pair();
    }

    rips.addEventListener("change", () => {
        if (syncing) return;
        pushRipsToSelect2Pair();
    });

    $(rda).on("change", () => {
        if (syncing) return;
        pullFromSelect2(true);
    });
    $(rdace).on("change", () => {
        if (syncing) return;
        pullFromSelect2(false);
    });

    observeAndPoll([rips], onRipsDomMaybeUpdated);
}

// ── Exportación ───────────────────────────────────────────────────────────

export function wireSyncRips() {
    wireRipsAcModalidadGrupoCausaListeners();
    cargarYSincronizarModalidadYGrupoRdaPaciente();
    cargarYSincronizarRipsContextRdace();
    wireTipoDiagnosticoPrincipalBidir();
}

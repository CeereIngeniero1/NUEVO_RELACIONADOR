/**
 * ihceVisorModal.js — Visor IHCE embebido en Asignar RIPS V3 (módulo RDA).
 * Cachea la consulta por paciente: no re-consulta IHCE al reabrir el modal
 * salvo que cambie o se borre el documento activo.
 */
import { getApiBaseUrl } from "../api/apiBaseUrl.js";
import { handleIhceAntecedentesMessage, resetIhceAntecedentesImportSession } from "./ihceAntecedentesImport.js";

const IHCE_TIPOS_VALIDOS = new Set(["CC", "TI", "CE", "PA", "RC", "PT", "SC", "PE"]);

let tipoDocumentoCache = null;

/** Sesión cargada en el iframe: tipo|documento */
let visorCache = {
    sessionKey: "",
    loadComplete: false,
};

function trimOrEmpty(v) {
    return v == null ? "" : String(v).trim();
}

function normalizeIhceTipo(raw) {
    const s = trimOrEmpty(raw).toUpperCase();
    if (!s) return "";
    if (IHCE_TIPOS_VALIDOS.has(s)) return s;
    if (s.length <= 3) return s;
    const m = s.match(/\b(CC|TI|CE|PA|RC|PT|SC|PE)\b/);
    return m ? m[1] : "";
}

function buildSessionKey(tipoIhce, documento) {
    const doc = trimOrEmpty(documento);
    if (!doc) return "";
    const tipo = normalizeIhceTipo(tipoIhce) || "CC";
    return `${tipo}|${doc}`;
}

function isModalOpen() {
    const modalEl = document.getElementById("modalVisorIHCE");
    return Boolean(modalEl && modalEl.classList.contains("show"));
}

function getIframe() {
    return document.getElementById("iframeVisorIHCE");
}

function isIframeBlank(iframe) {
    if (!iframe) return true;
    const src = trimOrEmpty(iframe.getAttribute("src") || iframe.src);
    return !src || src === "about:blank";
}

function clearVisorCache({ clearIframe = true } = {}) {
    visorCache = { sessionKey: "", loadComplete: false };
    resetIhceAntecedentesImportSession();
    if (clearIframe) {
        const iframe = getIframe();
        if (iframe) iframe.src = "about:blank";
    }
}

async function loadTipoDocumentoMap() {
    if (tipoDocumentoCache) return tipoDocumentoCache;
    try {
        const res = await fetch(`${getApiBaseUrl()}/apiV3/TipoDocumento`);
        if (!res.ok) return {};
        const rows = await res.json();
        const map = {};
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            const id = row.IdTipodeDocumento;
            const codigo =
                row["CódigoTipoDocumento"] ||
                row.CodigoTipoDocumento ||
                row.CódigoTipoDocumento ||
                "";
            if (id != null && codigo) map[String(id)] = trimOrEmpty(codigo).toUpperCase();
        });
        tipoDocumentoCache = map;
        return map;
    } catch (_) {
        return {};
    }
}

async function resolveTipoIhceFromSelect() {
    const el = document.getElementById("TipoDocumentoBase");
    if (!el) return "";

    const activo = window.__pacienteActivoIhce || {};
    const fromActivo = normalizeIhceTipo(activo.tipoIhce);
    if (fromActivo) return fromActivo;

    const idTipo = trimOrEmpty(el.value);
    if (idTipo) {
        const map = await loadTipoDocumentoMap();
        if (map[idTipo]) return map[idTipo];
    }

    try {
        const $ = window.jQuery;
        if ($ && $(el).data("select2")) {
            const data = $(el).select2("data");
            const text = data?.[0]?.text || "";
            const fromText = normalizeIhceTipo(text);
            if (fromText) return fromText;
        }
    } catch (_) { /* noop */ }

    return "";
}

function getActivePatientDocument() {
    const fromField = trimOrEmpty(document.getElementById("DocumentoPaciente")?.value);
    if (fromField) return fromField;
    return trimOrEmpty(window.__pacienteActivoIhce?.documento);
}

export async function resolvePatientIdentityForIhce() {
    const documento = getActivePatientDocument();
    const activo = window.__pacienteActivoIhce || {};
    let tipoIhce = normalizeIhceTipo(activo.tipoIhce);

    if (!tipoIhce) tipoIhce = await resolveTipoIhceFromSelect();
    if (!tipoIhce && activo.idTipoDocumento != null) {
        const map = await loadTipoDocumentoMap();
        tipoIhce = map[String(activo.idTipoDocumento)] || "";
    }
    if (!tipoIhce) tipoIhce = "CC";

    const nombre =
        trimOrEmpty(activo.nombre) ||
        trimOrEmpty(document.getElementById("NombrePaciente")?.value) ||
        trimOrEmpty(
            [
                document.getElementById("PrimerNombreBase")?.value,
                document.getElementById("PrimerApellidoBase")?.value,
            ].filter(Boolean).join(" ")
        );

    return { documento, tipoIhce, nombre };
}

function buildVisorIframeUrl(tipoIhce, documento) {
    const params = new URLSearchParams({
        embed: "1",
        auto: "1",
        tipo: tipoIhce,
        doc: documento,
    });
    return `visor/visor.html?${params.toString()}`;
}

function loadVisorSession(tipoIhce, documento) {
    const iframe = getIframe();
    if (!iframe || !documento) return;

    const sessionKey = buildSessionKey(tipoIhce, documento);
    const sameSession =
        visorCache.sessionKey === sessionKey &&
        visorCache.loadComplete &&
        !isIframeBlank(iframe);

    if (sameSession) return;

    visorCache = { sessionKey, loadComplete: false };
    const url = buildVisorIframeUrl(tipoIhce, documento);

    const onLoad = () => {
        if (visorCache.sessionKey === sessionKey) {
            visorCache.loadComplete = true;
        }
        iframe.removeEventListener("load", onLoad);
    };
    iframe.addEventListener("load", onLoad);
    iframe.src = url;
}

/**
 * Si cambia o desaparece el documento activo, limpia el visor.
 * Si el modal está abierto y hay nuevo paciente, recarga solo entonces.
 */
async function onPatientIdentityMaybeChanged() {
    const { documento, tipoIhce } = await resolvePatientIdentityForIhce();
    const newKey = buildSessionKey(tipoIhce, documento);

    syncIhceVisorButtonState();

    if (!documento) {
        clearVisorCache({ clearIframe: true });
        if (isModalOpen()) {
            const modalEl = document.getElementById("modalVisorIHCE");
            window.bootstrap?.Modal?.getInstance(modalEl)?.hide();
        }
        return;
    }

    if (newKey === visorCache.sessionKey) return;

    clearVisorCache({ clearIframe: true });

    if (isModalOpen()) {
        loadVisorSession(tipoIhce, documento);
        updateModalPatientLabel();
    }
}

function updateModalPatientLabel() {
    resolvePatientIdentityForIhce().then(({ documento, tipoIhce, nombre }) => {
        const label = document.getElementById("modalVisorIHCEPacienteLabel");
        if (!label || !documento) return;
        label.textContent = nombre
            ? `${tipoIhce} ${documento} — ${nombre}`
            : `${tipoIhce} ${documento}`;
    });
}

export function syncIhceVisorButtonState() {
    const btn = document.getElementById("RDA_BtnVisorIHCE");
    if (!btn) return;
    const doc = getActivePatientDocument();
    btn.disabled = !doc;
    btn.setAttribute("aria-disabled", doc ? "false" : "true");

    const currentKey = buildSessionKey(
        window.__pacienteActivoIhce?.tipoIhce || "CC",
        doc
    );
    const hasCache = doc && visorCache.sessionKey === currentKey && visorCache.loadComplete;

    btn.title = !doc
        ? "Seleccione un paciente para consultar IHCE"
        : hasCache
            ? "Ver historial RDA ya consultado en IHCE (sin volver a cargar)"
            : "Consultar historial RDA del paciente en IHCE";
}

async function openIhceVisorModal() {
    const { documento, tipoIhce, nombre } = await resolvePatientIdentityForIhce();

    if (!documento) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "warning",
                title: "Paciente requerido",
                text: "Seleccione o cargue un paciente antes de consultar el RDA en IHCE.",
            });
        } else {
            alert("Seleccione un paciente antes de consultar IHCE.");
        }
        return;
    }

    const modalEl = document.getElementById("modalVisorIHCE");
    if (!modalEl) return;

    const label = document.getElementById("modalVisorIHCEPacienteLabel");
    if (label) {
        label.textContent = nombre
            ? `${tipoIhce} ${documento} — ${nombre}`
            : `${tipoIhce} ${documento}`;
    }

    const bsModal = window.bootstrap?.Modal?.getOrCreateInstance(modalEl);
    if (!bsModal) {
        console.error("[IHCE Visor] Bootstrap Modal no disponible");
        return;
    }

    bsModal.show();
}

function onModalShown() {
    resolvePatientIdentityForIhce().then(({ documento, tipoIhce }) => {
        if (!documento) return;
        loadVisorSession(tipoIhce, documento);
    });
}

/** No limpiar iframe al cerrar: conservar consulta para el mismo paciente. */
function onModalHidden() {
    /* noop — la sesión queda en el iframe hasta cambiar de paciente */
}

/** Cierra el modal del visor IHCE (desde el iframe o la página padre). */
export function closeIhceVisorModal() {
    const modalEl = document.getElementById("modalVisorIHCE");
    if (!modalEl) return;
    window.bootstrap?.Modal?.getInstance(modalEl)?.hide();
}

export function wireIhceVisorModal() {
    const btn = document.getElementById("RDA_BtnVisorIHCE");
    const modalEl = document.getElementById("modalVisorIHCE");
    const docInput = document.getElementById("DocumentoPaciente");

    if (!btn || !modalEl) return;

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openIhceVisorModal();
    });

    modalEl.addEventListener("shown.bs.modal", onModalShown);
    modalEl.addEventListener("hidden.bs.modal", onModalHidden);

    if (docInput) {
        docInput.addEventListener("input", () => onPatientIdentityMaybeChanged());
        docInput.addEventListener("change", () => onPatientIdentityMaybeChanged());
    }

    const listaHC = document.getElementById("listaHC");
    if (listaHC) {
        listaHC.addEventListener("change", () => {
            setTimeout(() => onPatientIdentityMaybeChanged(), 0);
        });
    }

    document.addEventListener("paciente-activo-ihce-updated", () => {
        onPatientIdentityMaybeChanged();
    });

    window.addEventListener("message", (event) => {
        if (event.data?.type === "ihce-visor-close") {
            closeIhceVisorModal();
            return;
        }
        if (event.data?.type === "ihce-visor-antecedentes") {
            handleIhceAntecedentesMessage(event.data.payload);
        }
    });

    syncIhceVisorButtonState();
    setTimeout(syncIhceVisorButtonState, 300);
    setTimeout(syncIhceVisorButtonState, 1200);
}

/** Llamar al cargar paciente desde Asignar_RIPS V3.js */
export function setPacienteActivoIhce(payload) {
    const documento = trimOrEmpty(payload?.documento);
    const tipoIhce = normalizeIhceTipo(payload?.tipoIhce);
    const newKey = buildSessionKey(tipoIhce, documento);
    const prevKey = visorCache.sessionKey;

    window.__pacienteActivoIhce = {
        documento,
        tipoIhce,
        idTipoDocumento: payload?.idTipoDocumento ?? null,
        nombre: trimOrEmpty(payload?.nombre),
    };

    if (newKey !== prevKey && prevKey) {
        clearVisorCache({ clearIframe: true });
    }

    document.dispatchEvent(new CustomEvent("paciente-activo-ihce-updated"));
}

/** Forzar nueva consulta IHCE (mismo paciente) — opcional desde consola/UI futura */
export function refreshIhceVisorConsulta() {
    clearVisorCache({ clearIframe: true });
    if (isModalOpen()) onModalShown();
}

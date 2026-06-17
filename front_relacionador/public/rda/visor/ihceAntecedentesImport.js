/**
 * ihceAntecedentesImport.js — Extrae antecedentes del último RDA IHCE
 * y los carga en los formularios RDA Paciente y RDA Consulta Externa.
 */
import {
    replaceAntecedentesPaciente,
    replaceAntecedentesCE,
    getAntecedentes,
    getAntecedentesFamiliares,
    getMedicamentos,
    getAntecedentesCE,
    getAntecedentesFamiliaresCE,
    getMedicamentosCE,
} from "../state.js";
import { refreshListasAntecedentesPaciente } from "../ui/listasPaciente.js";
import { refreshListasAntecedentesCE } from "../ui/listasConsultaExterna.js";

function safeArr(a) {
    return Array.isArray(a) ? a : [];
}

function getText(s) {
    return typeof s === "string" ? s : "";
}

function compositionDateKey(entry) {
    const r = entry?.resource;
    return getText(r?.date) || getText(r?.meta?.lastUpdated) || "";
}

function pickLatestComposition(entries, withEncounter) {
    const list = safeArr(entries).filter((e) => {
        const r = e?.resource;
        if (!r || r.resourceType !== "Composition") return false;
        const hasEnc = Boolean(getText(r.encounter?.reference));
        return withEncounter ? hasEnc : !hasEnc;
    });
    list.sort((a, b) => compositionDateKey(b).localeCompare(compositionDateKey(a)));
    return list[0] || null;
}

function collectSectionReferenceIds(composition, titleFragment) {
    const ids = new Set();
    const fragment = titleFragment ? getText(titleFragment).toLowerCase() : "";
    safeArr(composition?.section).forEach((sec) => {
        const title = getText(sec?.title).toLowerCase();
        if (fragment && !title.includes(fragment)) return;
        safeArr(sec?.entry).forEach((e) => {
            const ref = getText(e?.reference);
            if (!ref) return;
            const id = ref.includes("/") ? ref.split("/").pop() : ref.replace(/^#/, "");
            if (id) ids.add(id);
        });
    });
    return ids;
}

function mapAllergyToForm(allergy) {
    if (!allergy) return null;
    const codings = safeArr(allergy?.code?.coding);
    const tipoCoding =
        codings.find((c) => String(c?.system || "").includes("TipoAlergia")) || codings[0];
    const tipoCodigo = getText(tipoCoding?.code).trim();
    const tipoDisplay = getText(tipoCoding?.display).trim();
    const alergeno =
        getText(allergy?.code?.text).trim() ||
        safeArr(allergy?.reaction)
            .map((r) => getText(r?.manifestation?.[0]?.text || r?.description))
            .filter(Boolean)
            .join(", ");
    if (!tipoCodigo && !alergeno) return null;
    return { tipoCodigo, tipoDisplay, alergeno };
}

function pickPrimaryAllergy(allergyResources) {
    const list = safeArr(allergyResources);
    if (!list.length) return null;
    const activeIdx = list.findIndex((a) => {
        const status = getText(a?.clinicalStatus?.coding?.[0]?.code).toLowerCase();
        return !status || status === "active";
    });
    const chosen = activeIdx >= 0 ? list[activeIdx] : list[0];
    return mapAllergyToForm(chosen);
}

function mapConditionToAntecedente(condition) {
    const codings = safeArr(condition?.code?.coding);
    const icd = codings.find((c) => String(c?.system || "").includes("icd-10")) || codings[0];
    const codigo = getText(icd?.code).trim();
    const descripcion = getText(icd?.display || condition?.code?.text).trim();
    if (!codigo && !descripcion) return null;
    return { codigo: codigo || descripcion, descripcion };
}

function mapFamilyMemberToAntecedente(fmh) {
    const rel = fmh?.relationship?.coding?.[0];
    const condCoding = fmh?.condition?.[0]?.code?.coding?.[0];
    const codigo = getText(condCoding?.code).trim();
    const descripcion = getText(condCoding?.display || fmh?.condition?.[0]?.code?.text).trim();
    const parentesco = getText(rel?.code).trim();
    const textoParentesco = getText(rel?.display || fmh?.relationship?.text).trim();
    if (!parentesco && !codigo && !descripcion) return null;
    return {
        parentesco: parentesco || textoParentesco,
        textoParentesco: textoParentesco || parentesco,
        codigo,
        descripcion,
    };
}

function mapMedicationToAntecedente(ms) {
    const coding = ms?.medicationCodeableConcept?.coding?.[0];
    const nombre = getText(
        ms?.medicationCodeableConcept?.text || coding?.display || coding?.code
    ).trim();
    if (!nombre) return null;
    const observacion = safeArr(ms?.note)
        .map((n) => getText(n?.text))
        .filter(Boolean)
        .join(" | ");
    return {
        codigo: getText(coding?.code).trim(),
        nombre,
        observacion,
    };
}

function extractAntecedentesFromCompositionEntry(entry, bundle) {
    const composition = entry?.resource;
    if (!composition || composition.resourceType !== "Composition") {
        return { salud: [], familiares: [], medicamentos: [], alergia: null };
    }

    const refs = bundle?.referencedResources || {};
    const sectionIds = collectSectionReferenceIds(composition);
    let allergySectionIds = collectSectionReferenceIds(composition, "alerg");
    if (allergySectionIds.size === 0) allergySectionIds = sectionIds;

    const conditions = safeArr(refs.conditions).filter((c) => sectionIds.has(c?.id));
    const family = safeArr(refs.familyMemberHistories).filter((f) => sectionIds.has(f?.id));
    const meds = safeArr(refs.medicationStatements).filter((m) => sectionIds.has(m?.id));
    const allergies = safeArr(refs.allergyIntolerances).filter((a) => allergySectionIds.has(a?.id));

    const salud = conditions.map(mapConditionToAntecedente).filter(Boolean);
    const familiares = family.map(mapFamilyMemberToAntecedente).filter(Boolean);
    const medicamentos = meds.map(mapMedicationToAntecedente).filter(Boolean);
    const alergia = pickPrimaryAllergy(allergies);

    return { salud, familiares, medicamentos, alergia };
}

function blockItemCount(data) {
    if (!data) return 0;
    return (
        (data.salud?.length || 0) +
        (data.familiares?.length || 0) +
        (data.medicamentos?.length || 0) +
        (data.alergia ? 1 : 0)
    );
}

function packSource(entry, data) {
    if (!entry) return null;
    const total = blockItemCount(data);
    return {
        fecha: compositionDateKey(entry),
        titulo: getText(entry?.resource?.title) || "RDA",
        total,
        ...data,
    };
}

/**
 * @param {object} bundle — respuesta IHCE (AppState.datosGlobalesFHIR)
 */
export function extractAntecedentesFromIhceBundle(bundle) {
    const entries = safeArr(bundle?.entry);
    const latestPaciente = pickLatestComposition(entries, false);
    const latestEncuentro = pickLatestComposition(entries, true);

    const pacienteData = latestPaciente
        ? extractAntecedentesFromCompositionEntry(latestPaciente, bundle)
        : { salud: [], familiares: [], medicamentos: [], alergia: null };
    const ceData = latestEncuentro
        ? extractAntecedentesFromCompositionEntry(latestEncuentro, bundle)
        : { salud: [], familiares: [], medicamentos: [], alergia: null };

    return {
        paciente: packSource(latestPaciente, pacienteData),
        consultaExterna: packSource(latestEncuentro, ceData),
    };
}

function countItems(block) {
    return blockItemCount(block);
}

function getSelectValue(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    const $ = window.jQuery;
    if ($ && $(el).data("select2")) {
        const v = $(el).val();
        return v != null ? String(v).trim() : "";
    }
    return getText(el.value).trim();
}

function setCatalogSelect2(selectId, codigo, display) {
    const el = document.getElementById(selectId);
    if (!el || !codigo) return false;
    const $ = window.jQuery;
    const label = display ? `${codigo} - ${display}` : codigo;
    if ($ && $(el).data("select2")) {
        if (!$(el).find(`option[value="${codigo}"]`).length) {
            $(el).append(new Option(label, codigo, true, true));
        }
        $(el).val(codigo).trigger("change");
        return true;
    }
    el.value = codigo;
    return true;
}

function applyAllergyPaciente(alergia) {
    if (!alergia) return false;
    let applied = false;
    if (alergia.tipoCodigo) {
        applied = setCatalogSelect2("RDA_TipoAlergia", alergia.tipoCodigo, alergia.tipoDisplay) || applied;
    }
    const alergenoEl = document.getElementById("NombreAlergenoBase");
    if (alergenoEl && alergia.alergeno) {
        alergenoEl.disabled = false;
        alergenoEl.value = alergia.alergeno;
        applied = true;
    }
    return applied;
}

function applyAllergyCE(alergia) {
    if (!alergia?.tipoCodigo) return false;
    return setCatalogSelect2("RDACE_TipoAlergia", alergia.tipoCodigo, alergia.tipoDisplay);
}

function formsHaveExistingData() {
    return (
        listsHaveAntecedentes() ||
        Boolean(getSelectValue("RDA_TipoAlergia")) ||
        Boolean(getSelectValue("RDACE_TipoAlergia")) ||
        Boolean(getText(document.getElementById("NombreAlergenoBase")?.value).trim())
    );
}

function listsHaveAntecedentes() {
    return (
        getAntecedentes().length > 0 ||
        getAntecedentesFamiliares().length > 0 ||
        getMedicamentos().length > 0 ||
        getAntecedentesCE().length > 0 ||
        getAntecedentesFamiliaresCE().length > 0 ||
        getMedicamentosCE().length > 0
    );
}

function applyBlock(replaceFn, refreshFn, block) {
    if (!block || countItems(block) === 0) return 0;
    replaceFn({
        salud: block.salud || [],
        familiares: block.familiares || [],
        medicamentos: block.medicamentos || [],
    });
    refreshFn();
    return countItems(block);
}

let lastImportFingerprint = "";

export function resetIhceAntecedentesImportSession() {
    lastImportFingerprint = "";
}

function buildFingerprint(payload) {
    const p = payload?.paciente;
    const c = payload?.consultaExterna;
    return [
        p?.fecha,
        p?.total,
        p?.alergia?.tipoCodigo,
        c?.fecha,
        c?.total,
        c?.alergia?.tipoCodigo,
    ].join("|");
}

/**
 * Carga antecedentes en RDA Paciente (último RDA sin encuentro)
 * y RDA CE (último RDA con encuentro clínico).
 */
export async function applyAntecedentesFromIhce(payload, { force = false } = {}) {
    if (!payload) return { applied: false, reason: "empty" };

    const fingerprint = buildFingerprint(payload);
    if (!force && fingerprint && fingerprint === lastImportFingerprint) {
        return { applied: false, reason: "already-imported" };
    }

    const nPac = countItems(payload.paciente);
    const nCe = countItems(payload.consultaExterna);
    if (nPac === 0 && nCe === 0) {
        return { applied: false, reason: "no-antecedentes" };
    }

    const needsConfirm = !force && formsHaveExistingData();
    if (needsConfirm && typeof Swal !== "undefined") {
        const parts = [];
        if (nPac > 0) {
            const det = [];
            if (payload.paciente?.alergia) det.push("alergia");
            parts.push(
                `<b>RDA Paciente</b> (${payload.paciente?.fecha?.slice(0, 10) || "último"}): ${nPac} ítem(s)${det.length ? ` incl. ${det.join(", ")}` : ""}`
            );
        }
        if (nCe > 0) {
            const det = [];
            if (payload.consultaExterna?.alergia) det.push("alergia");
            parts.push(
                `<b>RDA Consulta Externa</b> (${payload.consultaExterna?.fecha?.slice(0, 10) || "último"}): ${nCe} ítem(s)${det.length ? ` incl. ${det.join(", ")}` : ""}`
            );
        }
        const result = await Swal.fire({
            icon: "question",
            title: "Importar datos desde IHCE",
            html:
                "Se tomarán solo los antecedentes y alergias del <b>último RDA</b> en IHCE (no el historial completo).<br>"
                + "Si hay varias alergias, se importa la principal (activa).<br><br>"
                + parts.join("<br>")
                + "<br><br>¿Reemplazar los datos actuales en el formulario?",
            showCancelButton: true,
            confirmButtonText: "Sí, importar",
            cancelButtonText: "No",
        });
        if (!result.isConfirmed) {
            return { applied: false, reason: "cancelled" };
        }
    }

    let appliedPac = 0;
    let appliedCe = 0;
    let appliedAlergiaPac = false;
    let appliedAlergiaCe = false;

    if (nPac > 0) {
        appliedPac = applyBlock(replaceAntecedentesPaciente, refreshListasAntecedentesPaciente, payload.paciente);
    }
    if (payload.paciente?.alergia) {
        appliedAlergiaPac = applyAllergyPaciente(payload.paciente.alergia);
    }

    if (nCe > 0) {
        appliedCe = applyBlock(replaceAntecedentesCE, refreshListasAntecedentesCE, payload.consultaExterna);
    }
    if (payload.consultaExterna?.alergia) {
        appliedAlergiaCe = applyAllergyCE(payload.consultaExterna.alergia);
    }

    lastImportFingerprint = fingerprint;

    if (
        typeof Swal !== "undefined" &&
        (appliedPac > 0 || appliedCe > 0 || appliedAlergiaPac || appliedAlergiaCe)
    ) {
        const lines = [];
        if (appliedPac > 0) lines.push(`RDA Paciente: ${appliedPac} antecedente(s)`);
        if (appliedAlergiaPac) {
            const a = payload.paciente.alergia;
            lines.push(`RDA Paciente — alergia: ${a.tipoDisplay || a.tipoCodigo || "importada"}${a.alergeno ? ` (${a.alergeno})` : ""}`);
        }
        if (appliedCe > 0) lines.push(`RDA Consulta Externa: ${appliedCe} antecedente(s)`);
        if (appliedAlergiaCe) {
            const a = payload.consultaExterna.alergia;
            lines.push(`RDA Consulta Externa — alergia: ${a.tipoDisplay || a.tipoCodigo || "importada"}`);
        }
        Swal.fire({
            icon: "success",
            title: "Datos importados desde IHCE",
            html: lines.join("<br>"),
            timer: 4000,
            showConfirmButton: false,
        });
    }

    return {
        applied: true,
        appliedPac,
        appliedCe,
        appliedAlergiaPac,
        appliedAlergiaCe,
    };
}

export function handleIhceAntecedentesMessage(payload) {
    return applyAntecedentesFromIhce(payload);
}

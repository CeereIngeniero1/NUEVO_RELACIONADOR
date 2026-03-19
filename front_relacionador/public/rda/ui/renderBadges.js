/**
 * renderBadges.js — Renderizado genérico de badges para listas dinámicas RDA.
 *
 * Unifica las antiguas renderizarLista() y renderizarListaCE() en una sola
 * función parametrizada por tipo ("kind") con formateadores específicos.
 */

const BADGE_CLASS =
    "badge bg-light text-dark border border-secondary me-1 mb-1 d-inline-flex align-items-center";

// ── Formateadores por tipo ─────────────────────────────────
const formatters = {
    antecedente(item) {
        return item.codigo + (item.descripcion ? ` - ${item.descripcion}` : "");
    },
    familiar(item) {
        return `${item.textoParentesco} | ${item.codigo}` +
            (item.descripcion ? ` - ${item.descripcion}` : "");
    },
    medicamento(item) {
        return item.nombre + (item.observacion ? ` (${item.observacion})` : "");
    },
    diagRel(item) {
        let t = item.codigoCIE10;
        if (item.nombreCIE10) t += ` - ${item.nombreCIE10}`;
        if (item.codigoCIE11) t += ` | CIE-11: ${item.codigoCIE11}`;
        return t;
    },
    medCE(item) {
        let t = `${item.codigo || ""} ${item.nombre || item.dci || ""}`;
        if (item.dosis) t += ` | ${item.dosis} ${item.unidadDosis || ""}`;
        if (item.via) t += ` | ${item.via}`;
        return t;
    },
    procCE(item) {
        let t = `${item.codigo} - ${item.nombre || ""}`;
        if (item.finalidad) t += ` | ${item.finalidad}`;
        return t;
    },
    otraCE(item) {
        return `${item.tipo || ""} | ${item.codigo} - ${item.nombre || ""}`;
    },
};

/**
 * Renderiza una lista de items como badges dentro de un contenedor DOM.
 *
 * @param {HTMLElement|null} container — el elemento donde se pintan los badges.
 * @param {Array}            items    — array de objetos a renderizar.
 * @param {string}           kind     — clave del formateador (e.g. "antecedente", "medCE").
 * @param {function}         onRemove — callback(index) invocado al eliminar un badge.
 */
export function renderBadgeList(container, items, kind, onRemove) {
    if (!container) return;
    container.innerHTML = "";

    const format = formatters[kind] || (() => "");

    items.forEach((item, index) => {
        const badge = document.createElement("span");
        badge.className = BADGE_CLASS;
        badge.style.fontSize = "0.85em";

        badge.innerHTML =
            format(item) +
            ` <button type="button" class="btn-close btn-close-sm ms-2" style="font-size:0.6em;" data-idx="${index}"></button>`;

        badge.querySelector("button").addEventListener("click", () => {
            onRemove(index);
        });

        container.appendChild(badge);
    });
}

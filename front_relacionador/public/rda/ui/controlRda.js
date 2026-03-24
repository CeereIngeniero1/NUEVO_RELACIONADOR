/**
 * controlRda.js — Control de flujo RDA
 *
 * Botón "Generar RDA" sincroniza con checkbox oculto #GenerarRDABase (barra de progreso).
 * Radios tipo RDA + secciones. Memoria del último tipo al desactivar.
 * Select #RDA_HistoriaClinica sincronizado con #HistoriasSinRIPS (bidireccional).
 */

export function initControlRda() {
    const checkGenerarRDA = document.getElementById("GenerarRDABase");
    const btnGenerar = document.getElementById("RDA_BtnGenerar");
    const radiosTipoRDA = document.querySelectorAll('input[name="tipoRDA"]');
    const contenidoRDA = document.getElementById("ContenidoRDA");
    const seccionPaciente = document.getElementById("SeccionRDAPaciente");
    const seccionConsultaExt = document.getElementById("SeccionRDAConsultaExterna");
    const histRips = document.getElementById("HistoriasSinRIPS");
    const histRda = document.getElementById("RDA_HistoriaClinica");

    let lastTipoRDA = "paciente";
    let syncingHc = false;

    function updateBtnGenerarLabel() {
        if (!btnGenerar || !checkGenerarRDA) return;
        const on = checkGenerarRDA.checked;
        btnGenerar.textContent = on ? "Desactivar RDA" : "Generar RDA";
        btnGenerar.classList.toggle("btn-success", !on);
        btnGenerar.classList.toggle("btn-secondary", on);
    }

    function onTipoRDAChange(e) {
        const tipo = e.target.value;
        lastTipoRDA = tipo;

        contenidoRDA?.classList.remove("d-none");

        if (tipo === "paciente") {
            seccionPaciente?.classList.remove("d-none");
            seccionConsultaExt?.classList.add("d-none");
        } else if (tipo === "consultaExterna") {
            seccionConsultaExt?.classList.remove("d-none");
            seccionPaciente?.classList.add("d-none");
        }

        console.log(
            `%c[RDA] Sección activa: ${tipo}`,
            "color: #2196F3; font-weight: bold;"
        );
    }

    function toggleRDA() {
        const activo = checkGenerarRDA?.checked || false;

        if (!activo) {
            radiosTipoRDA.forEach((r) => {
                if (r.checked) lastTipoRDA = r.value;
            });
        }

        radiosTipoRDA.forEach((radio) => {
            radio.disabled = !activo;
            if (!activo) radio.checked = false;
        });

        if (!activo) {
            contenidoRDA?.classList.add("d-none");
            seccionPaciente?.classList.add("d-none");
            seccionConsultaExt?.classList.add("d-none");
        } else {
            const arr = Array.from(radiosTipoRDA);
            const pick = arr.find((r) => r.value === lastTipoRDA) || arr[0];
            if (pick) {
                pick.checked = true;
                onTipoRDAChange({ target: pick });
            }
        }

        updateBtnGenerarLabel();
    }

    function copySelectOptions(target, source) {
        if (!target || !source || !source.options?.length) return false;
        target.innerHTML = "";
        Array.from(source.options).forEach((opt) => {
            const o = document.createElement("option");
            o.value = opt.value;
            o.textContent = opt.textContent;
            target.appendChild(o);
        });
        return true;
    }

    function syncHistoriaClinicaDesdeRips() {
        if (!histRips || !histRda) return;
        copySelectOptions(histRda, histRips);
        const v = histRips.value;
        if (v && histRda.querySelector(`option[value="${v}"]`)) {
            histRda.value = v;
        }
    }

    btnGenerar?.addEventListener("click", () => {
        if (!checkGenerarRDA) return;
        checkGenerarRDA.checked = !checkGenerarRDA.checked;
        checkGenerarRDA.dispatchEvent(new Event("change", { bubbles: true }));
    });

    checkGenerarRDA?.addEventListener("change", toggleRDA);

    radiosTipoRDA.forEach((radio) => {
        radio.addEventListener("change", onTipoRDAChange);
    });

    histRips?.addEventListener("change", () => {
        if (syncingHc) return;
        syncingHc = true;
        syncHistoriaClinicaDesdeRips();
        syncingHc = false;
    });

    histRda?.addEventListener("change", () => {
        if (syncingHc) return;
        syncingHc = true;
        const v = histRda.value;
        if (histRips && v && histRips.querySelector(`option[value="${v}"]`)) {
            histRips.value = v;
        }
        syncingHc = false;
    });

    if (histRips && histRda) {
        const obs = new MutationObserver(() => {
            if (syncingHc) return;
            syncingHc = true;
            syncHistoriaClinicaDesdeRips();
            syncingHc = false;
        });
        obs.observe(histRips, { childList: true, subtree: true });
    }

    toggleRDA();
    updateBtnGenerarLabel();
    syncHistoriaClinicaDesdeRips();

    return { syncHistoriaClinicaDesdeRips };
}

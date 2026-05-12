/**
 * controlRda.js — Control de flujo RDA
 *
 * Botón "Generar RDA" sincroniza con checkbox oculto #GenerarRDABase (barra de progreso).
 * Radios tipo RDA + secciones. Memoria del último tipo al desactivar.
 */

export function initControlRda() {
    const checkGenerarRDA = document.getElementById("GenerarRDABase");
    const btnGenerar = document.getElementById("RDA_BtnGenerar");
    const radiosTipoRDA = document.querySelectorAll('input[name="tipoRDA"]');
    const contenidoRDA = document.getElementById("ContenidoRDA");
    const seccionPaciente = document.getElementById("SeccionRDAPaciente");
    const seccionConsultaExt = document.getElementById("SeccionRDAConsultaExterna");
    const radioPaciente = document.getElementById("RDATipoPaciente");
    const labelRadioPaciente = document.querySelector('label[for="RDATipoPaciente"]');

    /** true (default): solo flujo CE en pantalla; envío IHCE puede ir paciente+CE junto. false: muestra RDA Paciente y CE por separado. */
    const cfg = typeof window !== "undefined" ? window.__APP_CONFIG__ || {} : {};
    const ihceUnifiedSend = cfg.RDA_IHCE_UNIFIED_SEND !== false;

    if (ihceUnifiedSend) {
        if (radioPaciente) radioPaciente.classList.add("d-none");
        if (labelRadioPaciente) labelRadioPaciente.classList.add("d-none");
    } else {
        if (radioPaciente) radioPaciente.classList.remove("d-none");
        if (labelRadioPaciente) labelRadioPaciente.classList.remove("d-none");
    }

    let lastTipoRDA = "consultaExterna";

    function updateBtnGenerarLabel() {
        if (!btnGenerar || !checkGenerarRDA) return;
        const on = checkGenerarRDA.checked;
        btnGenerar.textContent = on ? "Desactivar RDA" : "Generar RDA";
        btnGenerar.classList.toggle("btn-success", !on);
        btnGenerar.classList.toggle("btn-secondary", on);
    }

    function onTipoRDAChange(e) {
        let tipo = e.target.value;
        if (ihceUnifiedSend && tipo === "paciente") tipo = "consultaExterna";
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
            const visible = arr.filter((r) => !r.classList.contains("d-none"));
            const pool = visible.length ? visible : arr;
            let pick = pool.find((r) => r.value === lastTipoRDA) || pool[0];
            if (ihceUnifiedSend) {
                pick = pool.find((r) => r.value === "consultaExterna") || pick;
            }
            if (pick) {
                pick.checked = true;
                onTipoRDAChange({ target: pick });
            }
        }

        updateBtnGenerarLabel();
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

    toggleRDA();
    updateBtnGenerarLabel();
}

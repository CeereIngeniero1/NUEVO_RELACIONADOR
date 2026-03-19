/**
 * controlRda.js — Control de flujo RDA
 *
 * Checkbox "¿Generar RDA?" activa/desactiva radios.
 * Los radios muestran la sección correspondiente (Paciente o Consulta Externa).
 */

export function initControlRda() {
    const checkGenerarRDA = document.getElementById("GenerarRDABase");
    const radiosTipoRDA = document.querySelectorAll('input[name="tipoRDA"]');
    const contenidoRDA = document.getElementById("ContenidoRDA");
    const seccionPaciente = document.getElementById("SeccionRDAPaciente");
    const seccionConsultaExt = document.getElementById("SeccionRDAConsultaExterna");

    function toggleRDA() {
        const activo = checkGenerarRDA?.checked || false;

        radiosTipoRDA.forEach(radio => {
            radio.disabled = !activo;
            if (!activo) radio.checked = false;
        });

        if (!activo) {
            contenidoRDA?.classList.add("d-none");
            seccionPaciente?.classList.add("d-none");
            seccionConsultaExt?.classList.add("d-none");
        }
    }

    function onTipoRDAChange(e) {
        const tipo = e.target.value;

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

    checkGenerarRDA?.addEventListener("change", toggleRDA);
    radiosTipoRDA.forEach(radio => {
        radio.addEventListener("change", onTipoRDAChange);
    });

    toggleRDA();
}

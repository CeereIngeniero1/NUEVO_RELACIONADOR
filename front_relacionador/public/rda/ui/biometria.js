/**
 * biometria.js — Cálculo automático de IMC
 */

export function initBiometria() {
    const inputTalla = document.getElementById("TallaPaciente");
    const inputPeso = document.getElementById("PesoPaciente");
    const inputIMC = document.getElementById("IMCPaciente");

    function calcularIMC() {
        const tallaCm = parseFloat(inputTalla?.value);
        const pesoKg = parseFloat(inputPeso?.value);

        if (tallaCm > 0 && pesoKg > 0) {
            const tallaM = tallaCm / 100;
            const imc = pesoKg / (tallaM * tallaM);
            if (inputIMC) inputIMC.value = imc.toFixed(2);
        } else {
            if (inputIMC) inputIMC.value = "";
        }
    }

    inputTalla?.addEventListener("input", calcularIMC);
    inputPeso?.addEventListener("input", calcularIMC);
}

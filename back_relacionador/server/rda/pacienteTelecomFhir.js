/** Mensaje estándar cuando telecom del Patient no cumple perfil IHCE. */
const TELEFONO_PACIENTE_IHCE_MSG =
    'Falta el teléfono del paciente o el teléfono no es válido. '
    + 'Use un celular colombiano de 10 dígitos que inicie en 3 (ejemplo: 3001234567).';

function soloDigitosTelefono(value) {
    return String(value == null ? '' : value).replace(/\D/g, '');
}

/** Celular Colombia: 10 dígitos, inicia en 3. */
function isTelefonoPacienteValidoParaFhir(value) {
    const digits = soloDigitosTelefono(value);
    return /^3\d{9}$/.test(digits);
}

/** Valor normalizado para Patient.telecom o null si no es válido. */
function telefonoPacienteParaFhir(value) {
    const digits = soloDigitosTelefono(value);
    return isTelefonoPacienteValidoParaFhir(digits) ? digits : null;
}

function mensajeErrorTelefonoPacienteIhce() {
    return TELEFONO_PACIENTE_IHCE_MSG;
}

/** Detecta OperationOutcome IHCE por Patient.telecom (cardinality 0..0). */
function esErrorIhcePatientTelecom(text) {
    const t = String(text || '');
    if (!/Patient\.telecom/i.test(t)) return false;
    return /cardinality|0\.\.0|Instance count/i.test(t);
}

function mensajeAmigableErrorIhcePatientTelecom() {
    return TELEFONO_PACIENTE_IHCE_MSG;
}

module.exports = {
    TELEFONO_PACIENTE_IHCE_MSG,
    isTelefonoPacienteValidoParaFhir,
    telefonoPacienteParaFhir,
    mensajeErrorTelefonoPacienteIhce,
    esErrorIhcePatientTelecom,
    mensajeAmigableErrorIhcePatientTelecom,
};

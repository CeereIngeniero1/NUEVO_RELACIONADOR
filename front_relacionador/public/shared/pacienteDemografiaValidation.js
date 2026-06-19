/**
 * Validación demografía paciente (RDA / Asignar RIPS V3).
 * - Campos obligatorios (*): no pueden estar vacíos.
 * - Cualquier campo con valor literal "null"/"undefined" (dato corrupto de BD): bloquea guardar/enviar.
 * - Ocupación opcional: vacío o "Sin asignar" es válido; no va al JSON FHIR.
 */

export const SIN_ASIGNAR_OCUPACION = 'Sin asignar';
/** Id reservado en [Ocupación]; sin código CIUO — no va al JSON FHIR. */
export const ID_OCUPACION_SIN_ASIGNAR = 1;

export function isOcupacionSinAsignar(id, text) {
    const idNum = id != null ? parseInt(String(id).trim(), 10) : NaN;
    if (Number.isFinite(idNum) && idNum === ID_OCUPACION_SIN_ASIGNAR) return true;
    const t = String(text || '').trim().toLowerCase();
    return t === SIN_ASIGNAR_OCUPACION.toLowerCase();
}

/** Valor a persistir en BD: vacío → Id 1 (Sin asignar). */
export function resolveIdOcupacionParaGuardar(raw) {
    const s = raw == null ? '' : String(raw).trim();
    if (!s) return ID_OCUPACION_SIN_ASIGNAR;
    const n = parseInt(s, 10);
    if (!Number.isFinite(n) || n <= 0) return ID_OCUPACION_SIN_ASIGNAR;
    return n;
}

let _isPacienteEdicionPendiente = () => {
    const btn = document.getElementById('BtnActualizarPaciente');
    if (!btn) return false;
    const text = (btn.textContent || btn.innerText || '').trim();
    return /guardar\s*cambios/i.test(text);
};

let _resetPacienteEdicion = null;

/** Registra estado de edición (wireDemografiaPaciente). */
export function registerPacienteEdicionHandlers({ isPendiente, reset } = {}) {
    if (typeof isPendiente === 'function') _isPacienteEdicionPendiente = isPendiente;
    if (typeof reset === 'function') _resetPacienteEdicion = reset;
}

export function isPacienteEdicionPendiente() {
    return _isPacienteEdicionPendiente();
}

/** Sale del modo edición al cargar otro paciente (descarta cambios locales). */
export function resetPacienteEdicionSiActiva() {
    if (typeof _resetPacienteEdicion === 'function') _resetPacienteEdicion();
}

/**
 * Bloquea guardar/enviar RDA si el botón está en «Guardar cambios».
 * @returns {boolean} true si puede continuar
 */
export function bloquearSiPacienteSinGuardar() {
    if (!isPacienteEdicionPendiente()) return true;
    const html = 'Tiene cambios en <b>Datos del paciente</b> sin guardar. '
        + 'Haga clic en <b>Guardar cambios</b> antes de guardar o enviar el RDA.';
    if (typeof window.Swal !== 'undefined') {
        window.Swal.fire({
            icon: 'warning',
            title: 'Cambios del paciente sin guardar',
            html,
        });
    } else {
        alert('Tiene cambios en Datos del paciente sin guardar. Haga clic en Guardar cambios antes de guardar o enviar el RDA.');
    }
    return false;
}

/** @type {{ id: string, label: string, required?: boolean, select2?: boolean }[]} */
export const PACIENTE_DEMOGRAFIA_CAMPOS = [
    { id: 'TipoDocumentoBase', label: 'Tipo Documento', required: true, select2: true },
    { id: 'DocumentoPaciente', label: 'Número Documento', required: true },
    { id: 'PrimerApellidoBase', label: 'Primer Apellido', required: true },
    { id: 'SegundoApellidoBase', label: 'Segundo Apellido' },
    { id: 'PrimerNombreBase', label: 'Primer Nombre', required: true },
    { id: 'SegundoNombreBase', label: 'Segundo Nombre' },
    { id: 'FechaNacimientoBase', label: 'Fecha y Hora Nacimiento', required: true },
    { id: 'SexoPaciente', label: 'Sexo Biológico', required: true, select2: true },
    { id: 'IdentidadGeneroBase', label: 'Identidad de Género', select2: true },
    { id: 'SelectNombrePaisNacionalidadBase', label: 'Nacionalidad (País)', required: true, select2: true },
    { id: 'SelectNombrePaisResidenciaBase', label: 'País Residencia', required: true, select2: true },
    { id: 'SelectNombreMunicipioResidenciaBase', label: 'Municipio Residencia', required: true, select2: true },
    { id: 'ListaZonaTerritorialBase', label: 'Zona Territorial', required: true, select2: true },
    { id: 'DireccionPaciente', label: 'Dirección' },
    { id: 'EtniaBase', label: 'Etnia', required: true, select2: true },
    { id: 'ComunidadEtnicaBase', label: 'Comunidad Étnica' },
    { id: 'DiscapacidadBase', label: 'Discapacidad', required: true, select2: true },
    { id: 'TelefonoPaciente', label: 'Teléfono' },
    { id: 'OcupacionBase', label: 'Ocupación', select2: true },
    { id: 'NombreAlergenoBase', label: 'Alérgeno' },
];

export function isCorruptNullDisplay(v) {
    if (v == null) return false;
    const s = String(v).trim().toLowerCase();
    return s === 'null' || s === 'undefined';
}

export function isEmptyRequiredValue(v) {
    if (v == null) return true;
    return String(v).trim() === '';
}

export function getCampoValor(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    try {
        const $ = window.jQuery;
        if ($ && $(el).data('select2')) {
            const d = $(el).select2('data')[0];
            if (d && d.id != null && String(d.id).trim() !== '') {
                return String(d.id);
            }
        }
    } catch (e) { /* ignore */ }
    const raw = el.value;
    return raw == null ? '' : String(raw);
}

export function getCampoTexto(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    try {
        const $ = window.jQuery;
        if ($ && $(el).data('select2')) {
            const d = $(el).select2('data')[0];
            if (d && d.text != null) return String(d.text);
        }
    } catch (e) { /* ignore */ }
    if (el.tagName === 'SELECT' && el.selectedIndex >= 0) {
        return String(el.options[el.selectedIndex].text || '');
    }
    return String(el.value || '');
}

export function marcarCampoInvalido(id, invalid) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('is-invalid', !!invalid);
    try {
        if (invalid) el.style.borderColor = '#dc3545';
        else el.style.removeProperty('border-color');
    } catch (e) { /* ignore */ }
}

/**
 * @returns {{ faltantes: string[], corruptos: string[] }}
 */
export function validarPacienteDemografia() {
    const faltantes = [];
    const corruptos = [];

    PACIENTE_DEMOGRAFIA_CAMPOS.forEach((campo) => {
        const el = document.getElementById(campo.id);
        if (!el) return;

        const valor = getCampoValor(campo.id);
        const texto = campo.select2 ? getCampoTexto(campo.id) : valor;
        const textoNorm = String(texto || '').trim().toLowerCase();
        const sinAsignar = campo.id === 'OcupacionBase'
            && (isEmptyRequiredValue(valor)
                || isOcupacionSinAsignar(valor, texto));

        const corrupto = !sinAsignar && (
            isCorruptNullDisplay(valor)
            || isCorruptNullDisplay(texto)
        );
        const falta = campo.required && !corrupto && isEmptyRequiredValue(valor);

        marcarCampoInvalido(campo.id, corrupto || falta);
        if (corrupto) corruptos.push(campo.label);
        else if (falta) faltantes.push(campo.label);
    });

    return { faltantes, corruptos };
}

/** Carga ocupación válida o "Sin asignar" (Id 1; no se envía al JSON FHIR). */
export function aplicarOcupacionPaciente(text, id) {
    const $el = window.jQuery ? window.jQuery('#OcupacionBase') : null;
    if (!$el || !$el.length) return;

    $el.empty();
    const idStr = id != null ? String(id).trim() : '';
    const idNum = parseInt(idStr, 10);
    const textStr = text != null ? String(text).trim() : '';
    const idOk = Number.isFinite(idNum) && idNum > 0 && !isCorruptNullDisplay(idStr);
    const textOk = textStr && !isCorruptNullDisplay(textStr);

    if (idOk && textOk && !isOcupacionSinAsignar(idNum, textStr)) {
        $el.append(new Option(textStr, String(idNum), true, true)).trigger('change');
    } else {
        $el.append(new Option(
            SIN_ASIGNAR_OCUPACION,
            String(ID_OCUPACION_SIN_ASIGNAR),
            true,
            true
        )).trigger('change');
    }
}

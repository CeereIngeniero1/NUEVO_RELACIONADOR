import { isRdaV2 } from './rdaConfig.js';
import { getApiV3Base } from './httpClient.js';

function ambLogical(ambienteUi) {
    return ambienteUi === 'prod' ? 'prod' : 'sandbox';
}

/**
 * Resuelve URL de envío IHCE según feature flag.
 * @param {'paciente'|'rdace'} kind
 * @param {'sandbox'|'prod'} ambienteUi — valor lógico de UI
 */
export function urlEnviarIhce(kind, ambienteUi) {
    const base = getApiV3Base();
    const v2 = isRdaV2();
    if (kind === 'rdace') {
        if (v2) {
            return ambienteUi === 'prod'
                ? `${base}/RdaConsultaExterna/EnviarIhceProduccionV2`
                : `${base}/RdaConsultaExterna/EnviarIhceSandboxV2`;
        }
        return `${base}/RdaConsultaExterna/EnviarIHCE`;
    }
    if (v2) {
        return ambienteUi === 'prod'
            ? `${base}/RdaPacienteV2/EnviarIhceProduccionV2`
            : `${base}/RdaPacienteV2/EnviarIhceSandboxV2`;
    }
    return `${base}/RdaPaciente/EnviarIHCE`;
}

/**
 * Cuerpo JSON para envío. Legacy incluye `ambiente`; V2 solo ID (ruta fija sandbox/prod).
 * @param {'paciente'|'rdace'} kind
 * @param {number} id
 * @param {'sandbox'|'prod'} ambienteUi
 */
export function bodyEnviarIhce(kind, id, ambienteUi) {
    const amb = ambLogical(ambienteUi);
    if (isRdaV2()) {
        return kind === 'rdace' ? { IdEvaluacionEntidadRDACE: id } : { IdEvaluacionEntidadRDA: id };
    }
    return kind === 'rdace'
        ? { IdEvaluacionEntidadRDACE: id, ambiente: amb }
        : { IdEvaluacionEntidadRDA: id, ambiente: amb };
}

/**
 * Preview del JSON/Bundle generado (igual que el envío real legacy).
 * @param {'paciente'|'rdace'} kind
 */
export function urlJsonEnviarPreview(kind) {
    const base = getApiV3Base();
    return kind === 'rdace'
        ? `${base}/RdaConsultaExterna/JsonEnviarIHCE`
        : `${base}/RdaPaciente/JsonEnviarIHCE`;
}

export function bodyJsonEnviarPreview(kind, id, ambiente) {
    if (kind === 'rdace') {
        return { IdEvaluacionEntidadRDACE: id, ambiente };
    }
    return { IdEvaluacionEntidadRDA: id, ambiente };
}

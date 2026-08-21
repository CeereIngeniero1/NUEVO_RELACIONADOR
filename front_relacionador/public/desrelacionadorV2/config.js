/**
 * Config Desrelacionador V2 — misma API base que V1.
 */
import { getApiBaseUrl } from "../rda/api/apiBaseUrl.js";

export { getApiBaseUrl };

export function getApiV3BaseUrl() {
  return `${getApiBaseUrl()}/apiV3`;
}

import fetch from "node-fetch";
import https from "https";

/**
 * Servicio para manejar la autenticación OAuth2
 */
class HttpsAgent {
  constructor() {
    this.clientId = "suministrar credenciales asignadas";
    this.clientSecret = "suministrar credenciales asignadas";

    this.tenantId = "3d4b3d76-b910-426c-bd8f-bd964e3e1b53";
    // Scope para producción
    this.scope = "api://ca9a5155-3135-4e44-a644-b92175eb4d21/.default";
    // Para DEV usar: 'api://1a4db865-cf02-4a4c-905b-61cf1fafce94/.default'

    // ⚠️ OPCIÓN 1: ignorar validación (solo sandbox / pruebas)
    this.agent = new https.Agent({
      rejectUnauthorized: false,
    });

    // ✅ OPCIÓN 2: usar certificado raíz oficial (si lo tienes)
    // this.agent = new https.Agent({
    //   ca: fs.readFileSync("./certs/ca-root.pem"),
    // });
  }

  async getAccessToken() {
    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "client_credentials",
        scope: this.scope,
      }),
    });

    const tokenData = await response.json();
    if (!tokenData.access_token) {
      throw new Error(
        "No se pudo obtener el token de acceso: " + JSON.stringify(tokenData)
      );
    }

    return tokenData.access_token;
  }

  async authenticatedRequest(url, token, subscriptionKey, options = {}) {
    const defaultHeaders = {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      Accept: "application/json",
    };

    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      agent: this.agent, // 👈 agregado aquí
    };

    return fetch(url, mergedOptions);
  }

  async authenticatedRequestPOST(url, token, subscriptionKey, body) {
    return fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      agent: this.agent, // 👈 corregido con coma
    });
  }
}

export default new HttpsAgent();

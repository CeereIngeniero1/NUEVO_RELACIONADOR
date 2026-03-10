const axios = require('axios');

class ICD11_API {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.token = null;
        this.tokenExpiry = null;
        this.baseUrl = 'https://id.who.int/icd/release/11/2024-01/mms';
    }

    // 1. Obtener o refrescar el Token de acceso
    async getAccessToken() {
        // Si el token existe y no ha expirado, lo reusamos
        if (this.token && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        const authUrl = 'https://icdaccessmanagement.who.int/connect/token';
        const params = new URLSearchParams({
            'client_id': this.clientId,
            'client_secret': this.clientSecret,
            'scope': 'icdapi_access',
            'grant_type': 'client_credentials'
        });

        try {
            const response = await axios.post(authUrl, params);
            this.token = response.data.access_token;
            // El token suele durar 3600 segundos (1 hora)
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            return this.token;
        } catch (error) {
            console.error('Error obteniendo el token:', error.response?.data || error.message);
        }
    }

    // 2. Método para buscar un término médico
    async search(query) {
        const token = await this.getAccessToken();

        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: { q: query },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Accept-Language': 'es', // Importante para resultados en español
                    'API-Version': 'v2'
                }
            });
            return response.data.destinationEntities; // Aquí están los resultados
        } catch (error) {
            console.error('Error en la búsqueda:', error.response?.data || error.message);
        }
    }
}

// --- EJEMPLO DE USO ---
(async () => {
    const icd = new ICD11_API(
        '1913f18a-af2d-48d8-9df4-9433f2bf9731_5f1075a7-1c1d-4769-b8ad-b781f383f2cd',
        'BG8b5btjWH12ePWemxjurAfyOLXTllz7HL4C2BpohUk='
    );

    console.log('Buscando "diabetes"...');
    const resultados = await icd.search('diabetes');

    if (resultados) {
        resultados.slice(0, 5).forEach(item => {
            console.log(`- [${item.theCode}] ${item.title.replace(/<[^>]*>?/gm, '')}`);
        });
    }
})();
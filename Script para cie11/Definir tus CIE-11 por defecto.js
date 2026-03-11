// 1. Definir tus "CIE-11 por defecto"
// Puedes crear un array con los diagnósticos más comunes en tu región o especialidad.

const defaultCIE11 = [
    { code: '1B10', title: 'Tuberculosis de los pulmones' },
    { code: '5A11', status: 'Diabetes mellitus tipo 2' },
    { code: 'BA41', title: 'Insuficiencia cardíaca' },
    { code: '1D0Z', title: 'Infección viral de sitio no especificado' },
    { code: '6D70', title: 'Trastorno de ansiedad generalizada' }
];



// 2. Crear el Endpoint en Node.js
// Este endpoint decidirá si entrega la lista estática o si llama a la API de la OMS.

 
const express = require('express');
const app = express();

// Suponiendo que ya tienes la clase ICD11_API que hicimos antes
const icd11 = new ICD11_API(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

app.get('/api/diagnosticos', async (req, res) => {
    const { busqueda } = req.query;

    try {
        // SI NO HAY TEXTO: Devolvemos los códigos por defecto
        if (!busqueda || busqueda.trim() === "") {
            return res.json({
                source: 'local_defaults',
                results: defaultCIE11
            });
        }

        // SI HAY TEXTO: Consultamos la API real de la OMS
        const resultadosOMS = await icd11.search(busqueda);
        
        // Mapeamos la respuesta para que tenga el mismo formato que los locales
        const formatoFinal = resultadosOMS.map(item => ({
            code: item.theCode,
            title: item.title.replace(/<[^>]*>?/gm, '') // Limpiamos el HTML
        }));

        res.json({
            source: 'who_api',
            results: formatoFinal
        });

    } catch (error) {
        res.status(500).json({ error: 'Error consultando diagnósticos' });
    }
});

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));



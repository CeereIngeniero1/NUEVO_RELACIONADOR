
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import fhirRoutes from './src/routes/index.js';
import documentReferenceRoutes from './src/routes/documentReference.js';

const app = express();

app.use(express.json());
app.use(cors());

// __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Frontend estático
app.use(express.static(path.join(__dirname, 'src', 'public')));

// API: un solo montaje por router (antes había duplicado el mismo router como inmunizacionRouter + fhirRoutes)
app.use('/api', fhirRoutes);
app.use('/api', documentReferenceRoutes);

app.use('/visor', express.static(path.join(__dirname, 'src', 'pages')));

// Ruta principal del visor
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'visor.html'));
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));

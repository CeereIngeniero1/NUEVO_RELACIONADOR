const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const { getRipsDataRoot } = require('../config/paths');
const { rutaXmlEmpresaPorClave } = require('../utils/xmlCache');

// Rutas de las carpetas (raíz: CEERE_RIPS_DATA_ROOT en .env — ver server/config/paths.js)
const RIPS_ROOT = getRipsDataRoot();
const carpeta1 = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS_JSON');
const carpeta2 = path.join(RIPS_ROOT, 'XMLS');
const carpeta3 = path.join(RIPS_ROOT, 'ARCHIVOS_DE_ENVIO');

// Verificar que las carpetas existen
function verificarCarpetas(...carpetas) {
    carpetas.forEach(carpeta => {
        if (!fs.existsSync(carpeta)) {
            console.error(`La carpeta ${carpeta} no existe. Por favor, verifica las rutas.`);
            process.exit(1); // Salir del programa si alguna carpeta no existe
        }
    });
}

/** Carpetas empresa bajo XMLS (no lotes con " --- ") */
function listDocumentoEmpresaDirs() {
    try {
        return fs.readdirSync(carpeta2).filter((name) => {
            const full = path.join(carpeta2, name);
            return fs.statSync(full).isDirectory() && !String(name).includes(' --- ');
        });
    } catch (_) {
        return [];
    }
}

/**
 * XML canónico: XMLS/{documentoEmpresa}/{clave}.xml
 * Fallback legacy: XMLS/{lote}/{clave}.xml (carpetas de rango antiguas)
 */
function resolverXmlParaClave(clave, loteOpcional) {
    for (const doc of listDocumentoEmpresaDirs()) {
        const p = rutaXmlEmpresaPorClave(RIPS_ROOT, doc, clave);
        if (p) return p;
    }
    if (loteOpcional) {
        const legacy = path.join(carpeta2, loteOpcional, `${clave}.xml`);
        if (fs.existsSync(legacy)) return legacy;
    }
    return null;
}

function procesarArchivosSinFactura(rutaJsonLote, rutaReporteSinFacturas) {
    let archivos1 = [];
    try {
        archivos1 = fs.readdirSync(rutaJsonLote);
    } catch (_) {
        return;
    }

    archivos1.forEach((archivo1) => {
        if (archivo1.includes('SinFactura_') && archivo1.endsWith('.json')) {
            const nombreSubcarpeta = archivo1.replace('.json', '');
            const rutaSubcarpeta = path.join(rutaReporteSinFacturas, nombreSubcarpeta);
            fs.mkdirSync(rutaSubcarpeta, { recursive: true });
            fs.copyFileSync(path.join(rutaJsonLote, archivo1), path.join(rutaSubcarpeta, archivo1));
        }
    });
}

// Empaqueta por lote JSON: XML desde carpeta empresa (o legacy lote)
function crearSubcarpetasYCopiarArchivos() {
    let lotesJson = [];
    try {
        lotesJson = fs.readdirSync(carpeta1).filter((name) => {
            const full = path.join(carpeta1, name);
            return fs.statSync(full).isDirectory();
        });
    } catch (_) {
        return;
    }

    lotesJson.forEach((lote) => {
        const rutaJson = path.join(carpeta1, lote);
        const rutaReporte = path.join(carpeta3, `REPORTE (${lote})`);
        const rutaReporteConFacturas = path.join(rutaReporte, 'CON_FACTURA');
        const rutaReporteSinFacturas = path.join(rutaReporte, 'SIN_FACTURA');

        fs.mkdirSync(rutaReporte, { recursive: true });
        fs.mkdirSync(rutaReporteConFacturas, { recursive: true });
        fs.mkdirSync(rutaReporteSinFacturas, { recursive: true });

        let jsonFiles = [];
        try {
            jsonFiles = fs.readdirSync(rutaJson).filter((f) => f.toLowerCase().endsWith('.json'));
        } catch (_) {
            return;
        }

        for (const jf of jsonFiles) {
            if (jf.includes('SinFactura_')) continue;

            const clave = path.basename(jf, '.json');
            const xmlPath = resolverXmlParaClave(clave, lote);
            if (!xmlPath) continue;

            const destDir = path.join(rutaReporteConFacturas, clave);
            fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(path.join(rutaJson, jf), path.join(destDir, jf));
            fs.copyFileSync(xmlPath, path.join(destDir, `${clave}.xml`));
        }

        procesarArchivosSinFactura(rutaJson, rutaReporteSinFacturas);
    });
}

// Función para verificar y eliminar archivos en ARCHIVOS_DE_ENVIO si sus correspondientes XML han sido eliminados
function verificarYEliminarArchivosEnEnvio() {
    if (!fs.existsSync(carpeta3)) return;
    const archivosEnvio = fs.readdirSync(carpeta3);

    archivosEnvio.forEach((subcarpeta) => {
        const rutaSubcarpeta = path.join(carpeta3, subcarpeta);

        if (!fs.statSync(rutaSubcarpeta).isDirectory()) return;

        const conFactura = path.join(rutaSubcarpeta, 'CON_FACTURA');
        if (!fs.existsSync(conFactura)) return;

        let claves = [];
        try {
            claves = fs.readdirSync(conFactura).filter((n) =>
                fs.statSync(path.join(conFactura, n)).isDirectory()
            );
        } catch (_) {
            return;
        }

        claves.forEach((clave) => {
            const xmlPath = resolverXmlParaClave(clave);
            if (xmlPath) return;
            const destDir = path.join(conFactura, clave);
            try {
                console.log(`Eliminando empaquetado de ${clave} porque no hay XML en carpeta empresa.`);
                fs.rmSync(destDir, { recursive: true, force: true });
            } catch (err) {
                console.error(`No se pudo eliminar ${destDir}:`, err.message || err);
            }
        });
    });
}

// Verificar las carpetas antes de ejecutar
verificarCarpetas(carpeta1, carpeta2, carpeta3);

// Ejecutar inicialmente
crearSubcarpetasYCopiarArchivos();

// Usar chokidar para observar cambios
const watcher1 = chokidar.watch(carpeta1, { persistent: true });
const watcher2 = chokidar.watch(carpeta2, { persistent: true });

watcher1.on('all', () => {
    crearSubcarpetasYCopiarArchivos();
});

watcher2.on('all', () => {
    crearSubcarpetasYCopiarArchivos();
});

// Ejecutar la verificación inicial de archivos en ARCHIVOS_DE_ENVIO
verificarYEliminarArchivosEnEnvio();

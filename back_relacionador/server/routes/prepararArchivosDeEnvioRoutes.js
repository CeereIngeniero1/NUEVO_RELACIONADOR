const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

// Rutas de las carpetas
const carpeta1 = path.join('C:', 'CeereSio', 'RIPS_2275', 'ARCHIVOS_RIPS_JSON');
const carpeta2 = path.join('C:', 'CeereSio', 'RIPS_2275', 'XMLS');
const carpeta3 = path.join('C:', 'CeereSio', 'RIPS_2275', 'ARCHIVOS_DE_ENVIO');

// Verificar que las carpetas existen
function verificarCarpetas(...carpetas) {
    carpetas.forEach(carpeta => {
        if (!fs.existsSync(carpeta)) {
            console.error(`La carpeta ${carpeta} no existe. Por favor, verifica las rutas.`);
            process.exit(1); // Salir del programa si alguna carpeta no existe
        }
    });
}

// Función para encontrar archivos con nombres similares
function encontrarArchivosSimilares(carpeta1, carpeta2) {
    const archivos1 = fs.readdirSync(carpeta1);
    const archivos2 = fs.readdirSync(carpeta2);

    const archivosSimilares = {};

    archivos1.forEach(archivo1 => {
        archivos2.forEach(archivo2 => {
            const nombreArchivo1 = path.basename(archivo1, path.extname(archivo1));
            const nombreArchivo2 = path.basename(archivo2, path.extname(archivo2));

            if (nombreArchivo1.includes(nombreArchivo2) || nombreArchivo2.includes(nombreArchivo1)) {
                if (!archivosSimilares[nombreArchivo2]) {
                    archivosSimilares[nombreArchivo2] = [];
                }
                archivosSimilares[nombreArchivo2].push(archivo1);
            }
        });
    });

    return archivosSimilares;
}

// Función para crear subcarpetas y copiar archivos
function crearSubcarpetasYCopiarArchivos() {
    const carpetasXML = fs.readdirSync(carpeta2).filter(file => fs.statSync(path.join(carpeta2, file)).isDirectory());

    carpetasXML.forEach(subcarpeta => {
        const rutaSubcarpeta1 = path.join(carpeta1, subcarpeta);
        const rutaSubcarpeta2 = path.join(carpeta2, subcarpeta);

        if (fs.existsSync(rutaSubcarpeta1)) {
            const archivosSimilares = encontrarArchivosSimilares(rutaSubcarpeta1, rutaSubcarpeta2);
            const rutaReporte = path.join(carpeta3, `REPORTE (${subcarpeta})`);
            const rutaReporteConFacturas = path.join(rutaReporte, `CON_FACTURA`);
            const rutaReporteSinFacturas = path.join(rutaReporte, `SIN_FACTURA`);

            fs.mkdirSync(rutaReporte, { recursive: true });
            fs.mkdirSync(rutaReporteConFacturas, { recursive: true });
            fs.mkdirSync(rutaReporteSinFacturas, { recursive: true });

            Object.keys(archivosSimilares).forEach(llave => {
                const rutaReporteLlave = path.join(rutaReporteConFacturas, llave);
                fs.mkdirSync(rutaReporteLlave, { recursive: true });

                archivosSimilares[llave].forEach(archivo1 => {
                    const rutaArchivo1 = path.join(rutaSubcarpeta1, archivo1);
                    const rutaArchivo2 = path.join(rutaSubcarpeta2, llave + '.xml');

                    fs.copyFileSync(rutaArchivo1, path.join(rutaReporteLlave, archivo1));
                    fs.copyFileSync(rutaArchivo2, path.join(rutaReporteLlave, llave + '.xml'));
                });
            });

            procesarArchivosSinFactura(rutaSubcarpeta1, rutaReporteSinFacturas);
        }
    });
}

// Función para procesar archivos "SinFactura_"
function procesarArchivosSinFactura(carpeta1, carpeta3) {
    const archivos1 = fs.readdirSync(carpeta1);

    archivos1.forEach(archivo1 => {
        if (archivo1.includes('SinFactura_') && archivo1.endsWith('.json')) {
            const nombreSubcarpeta = archivo1.replace('.json', '');
            const rutaSubcarpeta = path.join(carpeta3, nombreSubcarpeta);
            fs.mkdirSync(rutaSubcarpeta, { recursive: true });
            fs.copyFileSync(path.join(carpeta1, archivo1), path.join(rutaSubcarpeta, archivo1));
        }
    });
}

// Función para verificar y eliminar archivos en ARCHIVOS_DE_ENVIO si sus correspondientes XML han sido eliminados
function verificarYEliminarArchivosEnEnvio() {
    const archivosEnvio = fs.readdirSync(carpeta3);

    archivosEnvio.forEach(subcarpeta => {
        const rutaSubcarpeta = path.join(carpeta3, subcarpeta);

        if (fs.statSync(rutaSubcarpeta).isDirectory()) {
            const archivosEnSubcarpeta = fs.readdirSync(rutaSubcarpeta);

            archivosEnSubcarpeta.forEach(archivo => {
                if (archivo.endsWith('.json')) {
                    const nombreArchivo = path.basename(archivo, '.json');
                    const rutaXML = path.join(carpeta2, nombreArchivo + '.xml');

                    if (!fs.existsSync(rutaXML)) {
                        console.log(`Eliminando ${archivo} porque su archivo XML correspondiente ha sido eliminado.`);
                        fs.unlinkSync(path.join(rutaSubcarpeta, archivo));
                    }
                }
            });
        }
    });
}

// Verificar las carpetas antes de ejecutar
verificarCarpetas(carpeta1, carpeta2, carpeta3);

// Ejecutar inicialmente
crearSubcarpetasYCopiarArchivos();

// Usar chokidar para observar cambios
const watcher1 = chokidar.watch(carpeta1, { persistent: true });
const watcher2 = chokidar.watch(carpeta2, { persistent: true });

watcher1.on('all', (event, path) => {
    // console.log(`Se detectó un evento de tipo ${event} en la carpeta ${carpeta1}`);
    crearSubcarpetasYCopiarArchivos();
});

watcher2.on('all', (event, path) => {
    // console.log(`Se detectó un evento de tipo ${event} en la carpeta ${carpeta2}`);
    crearSubcarpetasYCopiarArchivos();
});

// Ejecutar la verificación inicial de archivos en ARCHIVOS_DE_ENVIO
verificarYEliminarArchivosEnEnvio();
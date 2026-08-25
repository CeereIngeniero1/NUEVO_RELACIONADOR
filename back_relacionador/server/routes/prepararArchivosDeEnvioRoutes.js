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

let empaquetadoTimer = null;

function verificarCarpetas(...carpetas) {
  carpetas.forEach((carpeta) => {
    if (!fs.existsSync(carpeta)) {
      console.error(`La carpeta ${carpeta} no existe. Por favor, verifica las rutas.`);
      process.exit(1);
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
 * Solo XML canónico en XMLS/{documentoEmpresa}/{clave}.xml
 * (no usa lotes legacy: eso provocaba crear → borrar en cada arranque).
 */
function resolverXmlEmpresa(clave) {
  for (const doc of listDocumentoEmpresaDirs()) {
    const p = rutaXmlEmpresaPorClave(RIPS_ROOT, doc, clave);
    if (p) return p;
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

/** Empaqueta CON_FACTURA solo si el XML está en carpeta empresa. */
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
      const xmlPath = resolverXmlEmpresa(clave);
      if (!xmlPath) continue;

      const destDir = path.join(rutaReporteConFacturas, clave);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(path.join(rutaJson, jf), path.join(destDir, jf));
      fs.copyFileSync(xmlPath, path.join(destDir, `${clave}.xml`));
    }

    procesarArchivosSinFactura(rutaJson, rutaReporteSinFacturas);
  });
}

/**
 * Quita CON_FACTURA sin XML en carpeta empresa.
 * Solo loguea un resumen (no una línea por factura).
 */
function verificarYEliminarArchivosEnEnvio() {
  if (!fs.existsSync(carpeta3)) return 0;
  const archivosEnvio = fs.readdirSync(carpeta3);
  let eliminados = 0;

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
      if (resolverXmlEmpresa(clave)) return;
      const destDir = path.join(conFactura, clave);
      try {
        fs.rmSync(destDir, { recursive: true, force: true });
        eliminados += 1;
      } catch (err) {
        console.error(`No se pudo eliminar ${destDir}:`, err.message || err);
      }
    });
  });

  return eliminados;
}

function programarEmpaquetado() {
  if (empaquetadoTimer) clearTimeout(empaquetadoTimer);
  empaquetadoTimer = setTimeout(() => {
    empaquetadoTimer = null;
    crearSubcarpetasYCopiarArchivos();
  }, 800);
}

verificarCarpetas(carpeta1, carpeta2, carpeta3);

// Arranque: primero limpiar huérfanos (una vez), luego empaquetar solo con XML empresa.
const n = verificarYEliminarArchivosEnEnvio();
if (n > 0) {
  console.log(
    `[empaquetado] Se eliminaron ${n} carpeta(s) CON_FACTURA sin XML en carpeta empresa.`
  );
} else {
  console.log('[empaquetado] Sin carpetas huérfanas CON_FACTURA que limpiar.');
}

crearSubcarpetasYCopiarArchivos();

const watchOpts = {
  persistent: true,
  ignoreInitial: true, // no re-disparar por cada archivo ya existente al arrancar
  awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 100 },
};

const watcher1 = chokidar.watch(carpeta1, watchOpts);
const watcher2 = chokidar.watch(carpeta2, watchOpts);

watcher1.on('all', () => programarEmpaquetado());
watcher2.on('all', () => programarEmpaquetado());

module.exports = {};

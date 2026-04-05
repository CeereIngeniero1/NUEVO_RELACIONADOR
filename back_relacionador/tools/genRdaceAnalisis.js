/**
 * @deprecated Preferir `tools/exportRdaceReporte.js` (bundle + faltantes con tipo_dato).
 * Lee rdace-envio-normalizado-id*.json (salida de JsonEnviarIHCE) y genera:
 *   - rdace-envio-normalizado-id{N}.pretty.json
 *   - rdace-envio-analisis-id{N}.json
 * Uso: node tools/genRdaceAnalisis.js [id]
 */
const fs = require('fs');
const path = require('path');

const idArg = process.argv[2] || '1';
const baseDir = path.join(__dirname, '..');
const inFile = path.join(baseDir, `rdace-envio-normalizado-id${idArg}.json`);
if (!fs.existsSync(inFile)) {
    console.error('No existe:', inFile);
    process.exit(1);
}

const bundle = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const byId = {};
for (const e of bundle.entry || []) {
    const r = e && e.resource;
    if (r && r.id) byId[r.id] = r;
}

const comp = (bundle.entry || []).find((e) => e.resource && e.resource.resourceType === 'Composition')?.resource;
if (!comp) {
    console.error('Bundle sin Composition');
    process.exit(1);
}

function resumenRecurso(ref) {
    const id = String(ref || '').replace(/^#/, '');
    const res = byId[id];
    if (!res) return { referencia: ref, problema: 'REFERENCIA_ROTA_en_bundle' };
    const rt = res.resourceType;
    const base = { referencia: ref, resourceType: rt, id };
    if (rt === 'Organization') return { ...base, nombre: res.name || null };
    if (rt === 'Condition') {
        const cod = (res.code && res.code.coding) || [];
        return {
            ...base,
            codigos: cod.map((c) => ({ system: c.system, code: c.code, display: c.display })),
            verificationStatus: res.verificationStatus,
        };
    }
    if (rt === 'DocumentReference') {
        const att = res.content && res.content[0] && res.content[0].attachment;
        return {
            ...base,
            description: res.description,
            pdfTitulo: att && att.title,
            contentType: att && att.contentType,
            nota: att && att.data ? 'Incluye data base64 (PDF); revisar si es documento real o plantilla mínima del sistema.' : null,
        };
    }
    if (rt === 'Observation') return { ...base, code: res.code, componentCount: (res.component || []).length };
    if (rt === 'AllergyIntolerance') return { ...base, code: res.code };
    if (rt === 'RiskAssessment') return { ...base, predictionCount: (res.prediction || []).length, code: res.code };
    if (rt === 'MedicationRequest') return { ...base, medication: res.medicationCodeableConcept };
    if (rt === 'ServiceRequest') return { ...base, code: res.code };
    return base;
}

const secciones = (comp.section || []).map((s, i) => {
    const loinc = s.code && s.code.coding && s.code.coding[0];
    const entries = s.entry || [];
    const div = (s.text && s.text.div) || '';
    const sinInfoNarrativa = div.includes('Sin información registrada');
    return {
        indice: i,
        titulo: s.title,
        loinc: loinc ? { code: loinc.code, display: loinc.display } : null,
        tieneEmptyReason: !!s.emptyReason,
        cantidadEntry: entries.length,
        narrativa_indica_sin_informacion: sinInfoNarrativa,
        recursos: entries.map((r) => resumenRecurso(r.reference)),
    };
});

const advertencias = [];
for (const sec of secciones) {
    if (sec.tieneEmptyReason && sec.loinc && sec.loinc.code === '74208-0') {
        advertencias.push({
            seccion: sec.titulo,
            loinc: '74208-0',
            mensaje:
                'Sin datos demográficos/occupación en esta sección: el generador usa emptyReason + texto "Sin información registrada". Si la IG o el validador exigen contenido, hay que capturar y mapear esos campos desde el formulario/BD.',
        });
    }
    if (sec.cantidadEntry === 0 && !sec.tieneEmptyReason) {
        advertencias.push({ seccion: sec.titulo, mensaje: 'Sección sin entry ni emptyReason (revisar reglas cmp-1 / IG).' });
    }
    for (const r of sec.recursos) {
        if (r.problema === 'REFERENCIA_ROTA_en_bundle') {
            advertencias.push({ seccion: sec.titulo, mensaje: `Referencia rota: ${r.referencia}` });
        }
    }
}

const docRefs = (bundle.entry || []).filter((e) => e.resource && e.resource.resourceType === 'DocumentReference');
if (docRefs.length === 0) {
    advertencias.push({
        seccion: 'Documentos de soporte',
        mensaje:
            'No hay recurso DocumentReference en el bundle: IHCE suele exigir entry 1..1 en la sección 55107-7. Verificar normalización EnviarIHCE (DocumentReference debe conservarse).',
    });
} else {
    const dr = docRefs[0].resource;
    const data = dr.content && dr.content[0] && dr.content[0].attachment && dr.content[0].attachment.data;
    if (data && data.length < 500) {
        advertencias.push({
            seccion: 'Documentos de soporte',
            mensaje:
                'El PDF adjunto parece plantilla mínima generada en backend cuando no hay archivo en origen. Para producción, adjuntar el PDF real en BD y mapearlo a DocumentReference.',
        });
    }
}

const analisis = {
    meta: {
        descripcion: 'Análisis del JSON que se enviaría a IHCE (misma normalización que EnviarIHCE, sin POST a sandbox).',
        endpointOrigen: 'POST /apiV3/RdaConsultaExterna/JsonEnviarIHCE',
        IdEvaluacionEntidadRDACE: parseInt(idArg, 10),
        generadoUtc: new Date().toISOString(),
    },
    resumen: {
        totalEntriesEnBundle: (bundle.entry || []).length,
        tiposEnBundle: [...new Set((bundle.entry || []).map((e) => e.resource && e.resource.resourceType).filter(Boolean))].sort(),
    },
    secciones_composition: secciones,
    advertencias_y_huecos: advertencias,
    como_obtener_este_json_en_insomnia: {
        metodo: 'POST',
        url: 'http://localhost:3000/apiV3/RdaConsultaExterna/JsonEnviarIHCE',
        headers: { 'Content-Type': 'application/json' },
        body: { IdEvaluacionEntidadRDACE: parseInt(idArg, 10), ambiente: 'sandbox' },
    },
};

const prettyFile = path.join(baseDir, `rdace-envio-normalizado-id${idArg}.pretty.json`);
const analisisFile = path.join(baseDir, `rdace-envio-analisis-id${idArg}.json`);

fs.writeFileSync(prettyFile, JSON.stringify(bundle, null, 2), 'utf8');
fs.writeFileSync(analisisFile, JSON.stringify(analisis, null, 2), 'utf8');

console.log('Escrito:', prettyFile);
console.log('Escrito:', analisisFile);

/**
 * Genera en back_relacionador/:
 *   1) rdace-bundle-id{N}.json          — Bundle FHIR (indentado) = lo que sale de JsonEnviarIHCE
 *   2) rdace-reporte-id{N}.json         — Mismo contexto + array faltantes con tipo_dato_fhir y tipo_dato_origen
 *
 * Uso:
 *   node tools/exportRdaceReporte.js 1
 *   node tools/exportRdaceReporte.js 5 --port 3000
 *   node tools/exportRdaceReporte.js 1 --file ./rdace-envio-normalizado-id1.json   (sin llamar al API)
 *
 * Requiere API en marcha salvo --file.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const idArg = parseInt(process.argv[2] || '1', 10);
const baseDir = path.join(__dirname, '..');
let fileOverride = null;
let port = parseInt(process.env.PORT || '3000', 10);
for (let i = 3; i < process.argv.length; i += 1) {
    if (process.argv[i] === '--file' && process.argv[i + 1]) {
        fileOverride = path.resolve(baseDir, process.argv[i + 1]);
        i += 1;
    } else if (process.argv[i] === '--port' && process.argv[i + 1]) {
        port = parseInt(process.argv[i + 1], 10);
        i += 1;
    }
}

function fetchJsonEnviarIhce(id) {
    const body = JSON.stringify({ IdEvaluacionEntidadRDACE: id, ambiente: 'sandbox' });
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                hostname: '127.0.0.1',
                port,
                path: '/apiV3/RdaConsultaExterna/JsonEnviarIHCE',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body, 'utf8'),
                },
            },
            (res) => {
                let data = '';
                res.on('data', (c) => { data += c; });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error(`JSON inválido (status ${res.statusCode}): ${(e && e.message) || e}`));
                        }
                    } else {
                        reject(new Error(`JsonEnviarIHCE status ${res.statusCode}: ${data.slice(0, 500)}`));
                    }
                });
            },
        );
        req.on('error', reject);
        req.write(body, 'utf8');
        req.end();
    });
}

function buildById(bundle) {
    const byId = {};
    for (const e of bundle.entry || []) {
        const r = e && e.resource;
        if (r && r.id) byId[r.id] = r;
    }
    return byId;
}

function armarFaltantes(bundle, byId) {
    const comp = (bundle.entry || []).find((e) => e.resource && e.resource.resourceType === 'Composition')?.resource;
    if (!comp) {
        return [{ codigo: 'SIN-COMPOSITION', prioridad: 'critico', descripcion: 'El bundle no contiene Composition.', tipo_dato_fhir: 'Bundle.entry → Composition', tipo_dato_origen: 'n/a', esta_cubierto: false }];
    }

    const faltantes = [];

    const sec74208 = (comp.section || []).find((s) => (s.code && s.code.coding && s.code.coding[0] && s.code.coding[0].code) === '74208-0');
    if (sec74208) {
        const sinEntry = !(sec74208.entry && sec74208.entry.length > 0);
        const soloVacio = !!sec74208.emptyReason || (sec74208.text && String(sec74208.text.div || '').includes('Sin información registrada'));
        if (sinEntry || soloVacio) {
            faltantes.push({
                codigo: 'SECC-74208-OCUPACION-DEMOGRAFICOS',
                prioridad: 'alta',
                ubicacion_fhir: 'Composition.section[LOINC 74208-0 "Otros datos demográficos"]',
                descripcion_negocio:
                    'La sección va sin recursos clínicos: solo emptyReason o texto genérico. La IG titula la sección como datos demográficos e historia de ocupación.',
                tipo_dato_fhir:
                    'Según perfil MinSalud: típicamente referencias (entry) a Observation u otros recursos autorizados por CompositionAmbulatoryRDA para esa sección; hoy: 0..* sin instancias útiles.',
                tipo_dato_origen:
                    'En tu stack ya existe catálogo GET /apiV3/Ocupacion/ → tabla [Cnsta Ocupacion 1888] (IdOcupacion, CodigoOcupacion, DescripcionOcupacion). Falta columna en [Evaluacion Entidad RDA Consulta Externa] (o tabla hija) + mapeo en RdaConsultaExternaRoutes.js a Observation/CodeableConcept u estructura que exija la IG.',
                esta_cubierto: false,
                ejemplo_valor_origen_sql: 'IdOcupacion INT + descripción texto; o código CNO si la IG lo exige explícitamente',
            });
        }
    }

    const docE = (bundle.entry || []).find((e) => e.resource && e.resource.resourceType === 'DocumentReference');
    if (docE) {
        const att = docE.resource.content && docE.resource.content[0] && docE.resource.content[0].attachment;
        const dataB64 = att && att.data ? String(att.data) : '';
        if (dataB64.length > 0 && dataB64.length < 600) {
            faltantes.push({
                codigo: 'DOC-PDF-PLANTILLA-MINIMA',
                prioridad: 'media',
                ubicacion_fhir: 'DocumentReference.content[0].attachment (data, contentType)',
                descripcion_negocio:
                    'El adjunto es muy pequeño: el backend genera un PDF mínimo válido cuando no hay archivo cargado en origen.',
                tipo_dato_fhir:
                    'Attachment: contentType = código MIME (p. ej. application/pdf); data = base64Binary (contenido real del PDF).',
                tipo_dato_origen:
                    'Binario PDF en BD o ruta de almacenamiento + campo [Nombre Documento PDF] / blob asociado a la evaluación RDACE; mapear bytes reales a attachment.data.',
                esta_cubierto: false,
                nota: 'Cumple cardinalidad entry en Composition; el contenido puede no ser aceptable para auditoría clínica.',
            });
        }
        if (!dataB64) {
            faltantes.push({
                codigo: 'DOC-SIN-DATA',
                prioridad: 'alta',
                ubicacion_fhir: 'DocumentReference.content[0].attachment.data',
                descripcion_negocio: 'DocumentReference sin data en el adjunto.',
                tipo_dato_fhir: 'base64Binary',
                tipo_dato_origen: 'Archivo PDF asociado al RDA en BD.',
                esta_cubierto: false,
            });
        }
    } else {
        faltantes.push({
            codigo: 'DOC-SIN-RECURSO',
            prioridad: 'critico',
            ubicacion_fhir: 'Bundle.entry → DocumentReference',
            descripcion_negocio: 'No hay DocumentReference en el bundle (fallará sección 55107-7 en IHCE si se filtra al enviar).',
            tipo_dato_fhir: 'ResourceType DocumentReference + perfil DocumentReferenceEPIRDA',
            tipo_dato_origen: 'Metadatos PDF + binario en evaluación RDACE.',
            esta_cubierto: false,
        });
    }

    for (const e of bundle.entry || []) {
        const r = e.resource;
        if (!r || r.resourceType !== 'RiskAssessment') continue;
        const preds = r.prediction || [];
        if (preds.length === 0) {
            faltantes.push({
                codigo: `RISK-${r.id || '0'}-PREDICTION-VACIO`,
                prioridad: 'baja',
                ubicacion_fhir: `RiskAssessment/${r.id}.prediction`,
                descripcion_negocio: 'Factor de riesgo registrado pero sin elementos en prediction (puede ser válido según IG; revisar RiskFactorRDA).',
                tipo_dato_fhir: 'BackboneElement prediction[] (estructura según perfil)',
                tipo_dato_origen: 'Texto/código de factor de riesgo en cabecera RDACE ([Tipo Factor Riesgo], [Nombre Factor Riesgo]) ampliado si la IG exige outcome/probability.',
                esta_cubierto: 'parcial',
            });
        }
        const codeText = r.code && r.code.text;
        const codeDisp = r.code && r.code.coding && r.code.coding[0] && r.code.coding[0].display;
        if (codeText && codeDisp && String(codeText).trim() !== String(codeDisp).trim()) {
            faltantes.push({
                codigo: `RISK-${r.id || '0'}-CODE-TEXT-INCONSISTENTE`,
                prioridad: 'baja',
                ubicacion_fhir: `RiskAssessment/${r.id}.code`,
                descripcion_negocio: `code.coding display ("${codeDisp}") y code.text ("${codeText}") no coinciden.`,
                tipo_dato_fhir: 'CodeableConcept (text + coding[].display alineados)',
                tipo_dato_origen: 'Un solo origen de verdad en BD para el factor de riesgo.',
                esta_cubierto: false,
            });
        }
    }

    for (const e of bundle.entry || []) {
        const r = e.resource;
        if (!r || r.resourceType !== 'AllergyIntolerance') continue;
        const t = r.code && r.code.text;
        if (t != null && String(t).trim().length <= 3 && /^\d+$/.test(String(t).trim())) {
            faltantes.push({
                codigo: `ALLERGY-${r.id || '0'}-TEXTO-DEBIL`,
                prioridad: 'baja',
                ubicacion_fhir: `AllergyIntolerance/${r.id}.code.text`,
                descripcion_negocio: 'El texto legible del código de alergia es solo numérico/corto.',
                tipo_dato_fhir: 'string (narrativa humana complementaria a coding)',
                tipo_dato_origen: 'Descripción alergia además del código en [Tipo Alergia] / detalle clínico.',
                esta_cubierto: false,
            });
        }
    }

    const ipsOrg = (bundle.entry || []).find((e) => e.resource && e.resource.resourceType === 'Organization' && (e.resource.meta && e.resource.meta.profile || []).some((p) => String(p).includes('CareDeliveryOrganizationRDA')));
    if (ipsOrg && ipsOrg.resource.name && /^IPS\s*\(/i.test(String(ipsOrg.resource.name))) {
        faltantes.push({
            codigo: 'ORG-IPS-NOMBRE-GENERICO',
            prioridad: 'baja',
            ubicacion_fhir: 'Organization (CareDeliveryOrganizationRDA).name',
            descripcion_negocio: 'Nombre de IPS por defecto "IPS (código prestador)" sin razón social.',
            tipo_dato_fhir: 'string (1..1 human-readable name)',
            tipo_dato_origen: 'Razón social IPS en maestro de prestadores o overrideNombrePrestadorIPS en el body de JsonEnviarIHCE.',
            esta_cubierto: false,
        });
    }

    const refsRotas = [];
    for (const s of comp.section || []) {
        for (const ref of s.entry || []) {
            const id = String(ref.reference || '').replace(/^#/, '');
            if (id && !byId[id]) refsRotas.push({ seccion: s.title, referencia: ref.reference });
        }
    }
    for (const rr of refsRotas) {
        faltantes.push({
            codigo: 'REF-ROTA',
            prioridad: 'critico',
            ubicacion_fhir: `Composition.section → entry → ${rr.referencia}`,
            descripcion_negocio: `La referencia ${rr.referencia} no tiene recurso en bundle.entry (sección "${rr.seccion}").`,
            tipo_dato_fhir: 'Reference (local #id debe existir en Bundle.entry)',
            tipo_dato_origen: 'Consistencia entre generador de Composition y lista entry[].',
            esta_cubierto: false,
        });
    }

    return faltantes;
}

function seccionesResumen(bundle, byId) {
    const comp = (bundle.entry || []).find((e) => e.resource && e.resource.resourceType === 'Composition')?.resource;
    if (!comp) return [];
    return (comp.section || []).map((s, i) => {
        const loinc = s.code && s.code.coding && s.code.coding[0];
        const entries = s.entry || [];
        return {
            indice: i,
            titulo: s.title,
            loinc: loinc ? `${loinc.code} — ${loinc.display || ''}` : null,
            tiene_emptyReason: !!s.emptyReason,
            num_entries: entries.length,
            referencias_ok: entries.every((r) => {
                const id = String(r.reference || '').replace(/^#/, '');
                return !id || !!byId[id];
            }),
        };
    });
}

async function main() {
    let bundle;
    if (fileOverride) {
        if (!fs.existsSync(fileOverride)) {
            console.error('No existe archivo:', fileOverride);
            process.exit(1);
        }
        bundle = JSON.parse(fs.readFileSync(fileOverride, 'utf8'));
    } else {
        try {
            bundle = await fetchJsonEnviarIhce(idArg);
        } catch (err) {
            console.error('No se pudo llamar al API:', err.message);
            console.error('Arranque el servidor (puerto ' + port + ') o use: node tools/exportRdaceReporte.js ' + idArg + ' --file ./rdace-envio-normalizado-id' + idArg + '.json');
            process.exit(1);
        }
    }

    if (!bundle || bundle.resourceType !== 'Bundle') {
        console.error('La respuesta no es un Bundle FHIR.');
        process.exit(1);
    }

    const byId = buildById(bundle);
    const faltantes = armarFaltantes(bundle, byId);
    const bundleFile = path.join(baseDir, `rdace-bundle-id${idArg}.json`);
    const reporteFile = path.join(baseDir, `rdace-reporte-id${idArg}.json`);

    const reporte = {
        meta: {
            generadoUtc: new Date().toISOString(),
            IdEvaluacionEntidadRDACE: idArg,
            archivos_generados: {
                bundle_indentado: path.basename(bundleFile),
                este_reporte: path.basename(reporteFile),
            },
            como_regenerar: {
                comando: `node tools/exportRdaceReporte.js ${idArg}`,
                api: `POST http://localhost:${port}/apiV3/RdaConsultaExterna/JsonEnviarIHCE`,
                body_json: { IdEvaluacionEntidadRDACE: idArg, ambiente: 'sandbox' },
            },
        },
        leyenda_faltantes: {
            prioridad_critico: 'Impide o rompe validación / referencias FHIR.',
            prioridad_alta: 'Hueco de negocio claro o rechazo probable en validador estricto.',
            prioridad_media: 'Contenido sustituto o incompleto (p. ej. PDF placeholder).',
            prioridad_baja: 'Calidad de datos / alineación narrativa; suele pasar validación técnica.',
            tipo_dato_fhir: 'Qué construcción FHIR R4 se espera en esa ruta.',
            tipo_dato_origen: 'Qué guardarías en SQL o formulario para llenarlo.',
            esta_cubierto: 'true = OK; false = falta; "parcial" = hay recurso pero incompleto.',
        },
        resumen: {
            total_faltantes_detectados: faltantes.length,
            por_prioridad: ['critico', 'alta', 'media', 'baja'].reduce((acc, p) => {
                acc[p] = faltantes.filter((f) => f.prioridad === p).length;
                return acc;
            }, {}),
            entries_en_bundle: (bundle.entry || []).length,
        },
        faltantes,
        secciones_composition_resumen: seccionesResumen(bundle, byId),
    };

    fs.writeFileSync(bundleFile, JSON.stringify(bundle, null, 2), 'utf8');
    fs.writeFileSync(reporteFile, JSON.stringify(reporte, null, 2), 'utf8');

    console.log('Escrito:', bundleFile);
    console.log('Escrito:', reporteFile);
    console.log('Faltantes detectados:', faltantes.length);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

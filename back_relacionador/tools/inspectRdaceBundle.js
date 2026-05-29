/**
 * Busca RDACE por documento, genera bundle vía JsonEnviarIHCE y lista todos los code "01".
 * Uso: node tools/inspectRdaceBundle.js 43722664
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const doc = process.argv[2] || '43722664';
const port = parseInt(process.env.PORT || '3000', 10);

const { loadDotEnvFromCandidates } = require('../server/config/envLoader');
loadDotEnvFromCandidates();
const { poolPromise } = require('../server/db2');

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
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error(`JSON inválido: ${e.message}`));
                        }
                    } else {
                        reject(new Error(`JsonEnviarIHCE ${res.statusCode}: ${data.slice(0, 1000)}`));
                    }
                });
            },
        );
        req.on('error', reject);
        req.write(body, 'utf8');
        req.end();
    });
}

function collectCode01(obj, trail, hits) {
    if (!obj || typeof obj !== 'object') return;
    if (Object.prototype.hasOwnProperty.call(obj, 'code') && String(obj.code) === '01') {
        hits.push({ trail, snippet: JSON.stringify(obj).slice(0, 200) });
    }
    if (Array.isArray(obj)) {
        obj.forEach((v, i) => collectCode01(v, `${trail}[${i}]`, hits));
        return;
    }
    for (const [k, v] of Object.entries(obj)) {
        collectCode01(v, trail ? `${trail}.${k}` : k, hits);
    }
}

(async () => {
    const pool = await poolPromise;
    const r = await pool.request()
        .input('Doc', require('mssql').VarChar(50), doc)
        .query(`
            SELECT TOP 5
                ce.[Id Evaluacion Entidad RDA Consulta Externa] AS Id,
                ce.[Documento Entidad] AS Doc,
                gs.[Codigo] AS CodigoGrupoServicios,
                gs.[NombreGrupoServicios] AS NombreGrupoServicios,
                ma.[Codigo] AS CodigoModalidadAtencion,
                ce.[Entorno Atencion] AS EntornoAtencion
            FROM [dbo].[Evaluacion Entidad RDA Consulta Externa] ce
            LEFT JOIN [dbo].[Cnsta Relacionador ModalidadGrupoServicioTecSal] gs
                ON gs.[IdGrupoServicios] = ce.[Id Grupo Servicios]
            LEFT JOIN [dbo].[Cnsta Relacionador Modalidad Atencion] ma
                ON ma.[IdModalidadAtencion] = ce.[Id Modalidad Atencion]
            WHERE ce.[Documento Entidad] = @Doc
            ORDER BY ce.[Id Evaluacion Entidad RDA Consulta Externa] DESC
        `);

    console.log('RDACE en BD para documento', doc);
    console.table(r.recordset);

    const id = r.recordset[0] && r.recordset[0].Id;
    if (!id) {
        console.error('Sin registros RDACE para ese documento');
        process.exit(1);
    }

    console.log('\nGenerando bundle IdEvaluacionEntidadRDACE =', id);
    const bundle = await fetchJsonEnviarIhce(id);
    const outPath = path.join(__dirname, '..', `rdace-bundle-doc-${doc}-id${id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2), 'utf8');
    console.log('Guardado:', outPath);

    const byId = {};
    for (const e of bundle.entry || []) {
        const res = e && e.resource;
        if (res && res.id) byId[res.id] = res;
    }
    const patient = byId['Patient-0'] || (bundle.entry || []).map((e) => e.resource).find((x) => x && x.resourceType === 'Patient');
    const encounter = byId['Encounter-0'];

    console.log('\n--- Patient.address[0].extension (zona) ---');
    console.log(JSON.stringify(patient && patient.address && patient.address[0] && patient.address[0].extension, null, 2));

    console.log('\n--- Encounter.type (modalidad / grupo / entorno) ---');
    console.log(JSON.stringify(encounter && encounter.type, null, 2));

    console.log('\n--- Encounter.serviceType (debe ser CUPS, no GrupoServicios) ---');
    console.log(JSON.stringify(encounter && encounter.serviceType, null, 2));

    const hits = [];
    collectCode01(bundle, 'bundle', hits);
    console.log(`\n--- Todos los "code": "01" en el bundle (${hits.length}) ---`);
    hits.forEach((h, i) => {
        console.log(`${i + 1}. ${h.trail}`);
        console.log(`   ${h.snippet}`);
    });

    process.exit(0);
})().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
});

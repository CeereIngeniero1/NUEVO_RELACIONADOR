const { Request, TYPES } = require('tedious');
const Router = require('express').Router;
const connection = require('../db');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip'); // PARA GENERAR ARCHIVOS ZIP
const yauzl = require('yauzl');
const fsExtra = require('fs-extra');
const { promisify } = require('util');
const { Console } = require('console');
const pipelineAsync = promisify(require('stream').pipeline);
const { getRipsDataRoot } = require('../config/paths');
const { rutaXmlEmpresaPorClave, rutaDirEmpresa } = require('../utils/xmlCache');

const INTERNAL_API_BASE = `http://localhost:${process.env.BACK_PORT || process.env.PORT || 3000}`;
const RIPS_ROOT = getRipsDataRoot();

const router = Router();

// Endpoint para obtener datos de usuarios RIPS

router.get('/usuarios/ripsParticular/:fechaInicio/:fechaFin/:ResolucionesRips/:documentoEmpresaSeleccionada', async (req, res) => {
    console.log("entre a los particulares");

    const fechaInicio = new Date(req.params.fechaInicio).toISOString().split('T')[0];
    const fechaFin = new Date(req.params.fechaFin).toISOString().split('T')[0];
    const ResolucionesRips = req.params.ResolucionesRips;
    const documentoEmpresaSeleccionada = req.params.documentoEmpresaSeleccionada;

    const request = new Request(
        `SELECT 
        em.NroIDPrestador,   
        --EmpV.[Prefijo Resolución Facturación EmpresaV] +  fc.[No Factura]   AS [numFactura], 
        --cambio realizado por resoluciones que superan los digitos y colocan un 0 adelante del numero de la factura
       -- EmpV.[Prefijo Resolución Facturación EmpresaV] + CAST(CAST(fc.[No Factura] AS INT ) AS nvarchar(10)) AS [numFactura],
        EmpV.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] AS [numFactura],

        -- CASE WHEN  fc.[No Factura] = '0000000' THEN '111111' ELSE NULL END AS [numNota],
        --CASE WHEN  fc.[No Factura] = '0000000' THEN everips.ConsecutivoRipsFacturaEnCero ELSE NULL END AS [numNota],
        CASE WHEN  fc.[No Factura] = '0000000' THEN 'RipSin' + cast(everips.[Id Evaluación Entidad Rips] as varchar) ELSE NULL END AS [numNota],
        CASE WHEN  fc.[No Factura] = '0000000' THEN 'RS' ELSE NULL END [tipoNota], tpd.[Tipo de Documento] as [tipoDocumentoIdentificacion],
        en.[Documento Entidad] as [numDocumentoIdentificacion],  
        --CASE 
        --    WHEN LEN(tpe.[Código Tipo Entidad]) > 1 THEN tpe.[Código Tipo Entidad] 
        --    ELSE '0' + tpe.[Código Tipo Entidad] END AS [tipoUsuario],
        '12' AS [tipoUsuario],
        CONVERT(VARCHAR, en3.[Fecha Nacimiento EntidadIII], 23) AS [fechaNacimiento], Sexo.[Sexo] AS [codSexo], 
        País.País AS [codPaisResidencia], Dep.[Código Departamento] +  Ciu.[Código Ciudad] AS [codMunicipioResidencia], 
		CASE WHEN zr.[Código Zona Residencia]  IS NULL THEN '02' ELSE   zr.[Código Zona Residencia] END AS  [codZonaTerritorialResidencia], 
		'NO' AS incapacidad,

        --DENSE_RANK() OVER (ORDER BY en.[Documento Entidad] DESC) 
        --CAST(DENSE_RANK() OVER (ORDER BY en.[Documento Entidad] DESC) AS INT)
        1 AS consecutivo,
        --DENSE_RANK() OVER (ORDER BY en.[Documento Entidad]) AS [consecutivo],
	    --Cast(ROW_NUMBER() OVER (PARTITION BY FC.[Id Factura]  ORDER BY FC.[Id Factura] ) as int) AS consecutivo,
         pais2.País AS [codPaisOrigen], eve.[Id Evaluación Entidad], everips.[Id Tipo de Rips], 
		CASE
			WHEN fc.[Documento Responsable] in (select [Documento Entidad] from [Función Por Entidad] where [Id Función] in ( select [Id Función] from Función where Función like ('%eps%' ) or Función like ('%prepa%') )) 
				THEN 1 
			ELSE 0
		END AS 'Prepagada',
        everips.[Id Evaluación Entidad Rips] AS IDEVARIPS,
        everips.[Id Plan de Tratamiento] AS IDPLANTRATA,
        everips.[Id Factura] AS IDfactura,
        CASE WHEN  fc.[No Factura] = '0000000' THEN 1 ELSE 0 END AS [Rips Sin Factura]

        FROM Entidad as en

        LEFT JOIN [Tipo de Documento] as tpd ON en.[Id Tipo de Documento] = tpd.[Id Tipo de Documento]
        LEFT JOIN [Evaluación Entidad] as eve ON en.[Documento Entidad] = eve.[Documento Entidad]
        LEFT JOIN Empresa as em ON eve.[Documento Empresa] = em.[Documento Empresa]
        INNER JOIN [Evaluación Entidad Rips] as everips ON eve.[Id Evaluación Entidad] = everips.[Id Evaluación Entidad]
        INNER JOIN Factura as fc ON everips.[Id Factura] = fc.[Id Factura]
        LEFT JOIN EntidadII as en2 ON en.[Documento Entidad] = en2.[Documento Entidad]
        LEFT JOIN EntidadIII as en3 ON en.[Documento Entidad] = en3.[Documento Entidad]
        LEFT JOIN [Tipo Entidad] as tpe ON en3.[Id Tipo Entidad] = tpe.[Id Tipo Entidad]
        LEFT JOIN Sexo ON en3.[Id Sexo] = Sexo.[Id Sexo]
        LEFT JOIN Ciudad AS Ciu ON en2.[Id Ciudad] = Ciu.[Id Ciudad] 
        LEFT JOIN Departamento AS Dep ON Dep.[Id Departamento] = Ciu.[Id Departamento]  
        LEFT JOIN Departamento AS Depart ON Ciu.[Id Departamento] = Depart.[Id Departamento] 
        LEFT JOIN País ON Depart.[Id País] = País.[Id País] 
        LEFT JOIN [Zona Residencia] AS zr ON en3.[Id Zona Residencia] = zr.[Id Zona Residencia]
        LEFT JOIN Ciudad AS ciu2 ON en2.[Id Ciudad] = ciu2.[Id Ciudad]
        LEFT JOIN Departamento AS Depart2 ON ciu2.[Id Departamento] = Depart2.[Id Departamento]
        LEFT JOIN País AS pais2 ON Depart2.[Id País] = pais2.[Id País]
        LEFT JOIN EmpresaV AS EmpV ON fc.[Id EmpresaV] = EmpV.[Id EmpresaV] 

        WHERE CONVERT(DATE, eve.[Fecha Evaluación Entidad], 23) BETWEEN @fechaInicio AND @fechaFin
        AND eve.[Documento Empresa] = @documentoEmpresaSeleccionada
        ORDER BY en.[Documento Entidad] DESC
        `,
        (err) => {
            if (err) {
                console.error('Error executing patient query:', err);
                res.status(500).send('Internal Server Error');
            }
        }
    );

    request.addParameter('fechaInicio', TYPES.Date, fechaInicio);
    request.addParameter('fechaFin', TYPES.Date, fechaFin);
    request.addParameter('documentoEmpresaSeleccionada', TYPES.VarChar, documentoEmpresaSeleccionada);

    const resultados = {};
    const facturasOriginales = [];

    request.on('row', (columns) => {
        let numFactura = columns[1].value;
        const originalNumFactura = numFactura;
        const DocumentoPaciente = columns[5].value;
        const idTipoRips = columns[16].value;
        const idEvaRips = columns[18].value;
        const IdTrata = columns[19].value;
        const IdFacrua = columns[20].value;
        const Sinfactura = columns[21].value;
        // let Sinfactura = 0;
        // console.log(`Se supone que este es el documento paciente ${DocumentoPaciente}`);
        // console.log(`Se supone que este es el  id factura ${IdFacrua}`);
        // console.log(`Se supone que este es el  num factura ${numFactura}`);



        //         if (Sinfactura === 1 || numFactura === null || numFactura === undefined || String(numFactura).trim() === '') {
        //     numFactura = null;
        //     // Sinfactura = 1;
        // }
        // Determina si se debe cambiar el numFactura a null
        // El patrón /0/ marcaba como "sin factura" a cualquier número con ceros y duplicaba RIPS con factura.
        // if (numFactura === null || /000000/.test(numFactura) || /0/.test(numFactura)) {
        if (Sinfactura === 1 || numFactura === null || numFactura === undefined || String(numFactura).trim() === '') {
            numFactura = null;
            // Sinfactura = 1;
        }



        // console.log(`Se supone que este es el nuevo  num factura ${numFactura}`);

        // Determina la clave de la factura
        let facturaKey;
        if (numFactura === null) {
            facturaKey = `null_${originalNumFactura}_${columns[5].value}`;
        } else {
            facturaKey = numFactura;
        }

        if (!resultados[facturaKey]) {
            resultados[facturaKey] = {
                numDocumentoIdObligado: columns[0].value,
                numFactura: numFactura,
                numNota: columns[2].value,
                tipoNota: columns[3].value,
                usuarios: []
            };
        }

        const usuario = {
            tipoDocumentoIdentificacion: columns[4].value,
            numDocumentoIdentificacion: columns[5].value,
            tipoUsuario: columns[6].value,
            fechaNacimiento: columns[7].value,
            codSexo: columns[8].value,
            codPaisResidencia: columns[9].value,
            codMunicipioResidencia: columns[10].value,
            codZonaTerritorialResidencia: columns[11].value,
            incapacidad: columns[12].value,
            // consecutivo: parseInt(columns[13].value, 10),
            consecutivo: columns[13].value,
            codPaisOrigen: columns[14].value,
            servicios: {
                consultas: [],
                procedimientos: []
            }
        };

        // Fusiona los servicios si ya existe el usuario
        const existingUser = resultados[facturaKey].usuarios.find(u => u.numDocumentoIdentificacion === usuario.numDocumentoIdentificacion);
        if (existingUser) {
            existingUser.servicios.consultas.push(...usuario.servicios.consultas);
            existingUser.servicios.procedimientos.push(...usuario.servicios.procedimientos);
        } else {
            resultados[facturaKey].usuarios.push(usuario);
        }
        // facturasOriginales.push({ originalNumFactura, idTipoRips });

        facturasOriginales.push({ originalNumFactura, idTipoRips, idEvaRips, IdTrata, IdFacrua, Sinfactura, fechaInicio, fechaFin, DocumentoPaciente });
    });
    console.log(" ripsEPS");
    request.on('requestCompleted', async () => {
        for (let factura in resultados) {
            const consulta = resultados[factura];
            console.log(" ");

            // console.log(factura);
            // Buscar la factura en facturasOriginales
            const facturaData = facturasOriginales.find(f => `null_${f.originalNumFactura}_${consulta.usuarios[0].numDocumentoIdentificacion}` === factura || f.originalNumFactura === factura);
            // console.log('facturas que hay ', facturaData);
            if (facturaData) {
                // const { originalNumFactura, idTipoRips } = facturaData;

                const { fechaInicio, fechaFin, idEvaRips, IdTrata, IdFacrua, Sinfactura, DocumentoPaciente } = facturaData;

                for (const usuario of consulta.usuarios) {
                    try {
                        let consultasResponse;
                        if (Sinfactura === 1) {
                           console.log(`DOCUMENTO DEL PACIENTE ${DocumentoPaciente} SIN FACTURA ? ${Sinfactura}`);

                            consultasResponse = await fetch(`${INTERNAL_API_BASE}/RIPS/servicios/ripsACSinfactura/${IdFacrua}/${DocumentoPaciente}/${fechaInicio}/${fechaFin}`);
                        } else {
                            consultasResponse = await fetch(`${INTERNAL_API_BASE}/RIPS/servicios/ripsAC/${idEvaRips}/${IdTrata}/${IdFacrua}/${DocumentoPaciente}`);
                        }

                        const consultasData = await consultasResponse.json();

                        if (consultasData.length > 0) {
                            usuario.servicios.consultas.push(...consultasData);
                        } else {
                            delete usuario.servicios.consultas;
                        }
                    } catch (error) {
                        console.error('Error al obtener consultas:', error);
                    }

                    try {
                        let procedimientosResponse;
                        if (Sinfactura === 1) {
                            // console.log(`Se supone que esta es la fecha pa ${IdFacrua} ${DocumentoPaciente}  ${fechaInicio}  ${fechaFin} `);

                            procedimientosResponse = await fetch(`${INTERNAL_API_BASE}/RIPS/servicios/ripsAPSinFactura/${IdFacrua}/${DocumentoPaciente}/${fechaInicio}/${fechaFin}`);

                        } else {
                            procedimientosResponse = await fetch(`${INTERNAL_API_BASE}/RIPS/servicios/ripsAP/${idEvaRips}/${IdTrata}/${IdFacrua}/${DocumentoPaciente}`);

                        }
                        const procedimientosData = await procedimientosResponse.json();

                        if (procedimientosData.length > 0) {
                            usuario.servicios.procedimientos.push(...procedimientosData);
                        } else {
                            delete usuario.servicios.procedimientos;
                        }
                    } catch (error) {
                        console.error('Error al obtener procedimientos:', error);
                    }
                }
            } else {
                console.error(`Factura con clave ${factura} no encontrada en facturasOriginales.`);
            }
        }

        res.json(Object.values(resultados));
    });


    connection.execSql(request);
});


router.get('/usuarios/rips/:fechaInicio/:fechaFin/:ResolucionesRips/:documentoEmpresaSeleccionada', async (req, res) => {


    const fechaInicio = new Date(req.params.fechaInicio).toISOString().split('T')[0];
    const fechaFin = new Date(req.params.fechaFin).toISOString().split('T')[0];
    const ResolucionesRips = req.params.ResolucionesRips;
    const documentoEmpresaSeleccionada = req.params.documentoEmpresaSeleccionada;

    const request = new Request(
        `SELECT 
    em.NroIDPrestador, 
    --EmpV.[Prefijo Resolución Facturación EmpresaV] +  fc.[No Factura]   AS [numFactura], 
    --cambio realizado por resoluciones que superan los digitos y colocan un 0 adelante del numero de la factura
    --EmpV.[Prefijo Resolución Facturación EmpresaV] + CAST(CAST(fc.[No Factura] AS INT ) AS nvarchar(10)) AS [numFactura],
    --aplica para algunos para otros no 
    EmpV.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] AS [numFactura],
    NULL AS [numNota], 
    NULL AS [tipoNota], 
    tpd.[Tipo de Documento] AS [tipoDocumentoIdentificacion],
    en.[Documento Entidad] AS [numDocumentoIdentificacion], 
     --CASE 
        --WHEN LEN(tpe.[Tipo Entidad]) > 1 THEN tpe.[Tipo Entidad] 
        --ELSE '0' + tpe.[Tipo Entidad] END AS [tipoUsuario],
        '11' AS [tipoUsuario],
    CONVERT(VARCHAR, en3.[Fecha Nacimiento EntidadIII], 23) AS [fechaNacimiento], 
    Sexo.[Sexo] AS [codSexo], 
    País.País AS [codPaisResidencia], 
CASE 
    WHEN LEN(Ciu.[Código Ciudad]) > 3 
         THEN Ciu.[Código Ciudad]            -- Ya viene completo (ej: 05001)
    ELSE Depart.[Código Departamento] 
         + Ciu.[Código Ciudad]               -- Si viene corto (ej: 001)
END AS codMunicipioResidencia,

    CASE WHEN zr.[Código Zona Residencia]  IS NULL THEN '02' ELSE   zr.[Código Zona Residencia] END AS  [codZonaTerritorialResidencia],  
    'NO' AS [incapacidad],
    --DENSE_RANK() OVER (ORDER BY en.[Documento Entidad]) AS [consecutivo],
	--ROW_NUMBER() OVER (PARTITION BY FC.[Id Factura]  ORDER BY FC.[Id Factura] ) AS consecutivo,
        DENSE_RANK() OVER (
    PARTITION BY FC.[Id Factura] 
    ORDER BY en.[Documento Entidad]
) AS consecutivo,
    pais2.País AS [codPaisOrigen], 
    eve.[Id Evaluación Entidad], 
    everips.[Id Tipo de Rips], 
    CASE
        WHEN fc.[Documento Responsable] IN (
            SELECT [Documento Entidad] 
            FROM [Función Por Entidad] 
            WHERE [Id Función] IN (
                SELECT [Id Función] 
                FROM Función 
                WHERE Función LIKE ('%eps%') OR Función LIKE ('%prepa%')
            )
        ) THEN 1 
        ELSE 0
    END AS [Prepagada],
	everips.[Id Evaluación Entidad Rips] AS IDEVARIPS,
	everips.[Id Plan de Tratamiento] AS IDPLANTRATA,
	everips.[Id Factura] AS IDfactura
FROM 
    Entidad AS en
LEFT JOIN  [Tipo de Documento] AS tpd ON en.[Id Tipo de Documento] = tpd.[Id Tipo de Documento]
LEFT JOIN  [Evaluación Entidad] AS eve ON en.[Documento Entidad] = eve.[Documento Entidad]
LEFT JOIN  Empresa AS em ON eve.[Documento Empresa] = em.[Documento Empresa]
INNER JOIN  [Evaluación Entidad Rips] AS everips ON eve.[Id Evaluación Entidad] = everips.[Id Evaluación Entidad]
INNER JOIN  Factura AS fc ON everips.[Id Factura] = fc.[Id Factura]
LEFT JOIN  EntidadII AS en2 ON en.[Documento Entidad] = en2.[Documento Entidad]
LEFT JOIN  EntidadIII AS en3 ON en.[Documento Entidad] = en3.[Documento Entidad]
LEFT JOIN  [Tipo Entidad] AS tpe ON en3.[Id Tipo Entidad] = tpe.[Id Tipo Entidad]
LEFT JOIN  Sexo ON en3.[Id Sexo] = Sexo.[Id Sexo]
LEFT JOIN  Ciudad AS Ciu ON en2.[Id Ciudad] = Ciu.[Id Ciudad] 
LEFT JOIN  Departamento AS Depart ON Ciu.[Id Departamento] = Depart.[Id Departamento] 
LEFT JOIN  País ON Depart.[Id País] = País.[Id País] 
LEFT JOIN  [Zona Residencia] AS zr ON en3.[Id Zona Residencia] = zr.[Id Zona Residencia]
LEFT JOIN  Ciudad AS ciu2 ON en2.[Id Ciudad] = ciu2.[Id Ciudad]
LEFT JOIN Departamento AS Depart2 ON ciu2.[Id Departamento] = Depart2.[Id Departamento]
--LEFT JOIN  Departamento AS Depart2 ON ciu2.[Id Departamento] = Depart2.[Id Departamento]
LEFT JOIN  País AS pais2 ON Depart2.[Id País] = pais2.[Id País]
LEFT JOIN   EmpresaV AS EmpV ON fc.[Id EmpresaV] = EmpV.[Id EmpresaV]

WHERE 
    CASE
        WHEN fc.[Documento Responsable] IN (
            SELECT [Documento Entidad] 
            FROM [Función Por Entidad] 
            WHERE [Id Función] IN (
                SELECT [Id Función] 
                FROM Función 
                WHERE Función LIKE ('%eps%') OR Función LIKE ('%prepa%')
            )
        ) THEN 1 
        ELSE 0
    END = 1 AND
       -- WHERE 
        CONVERT(DATE, FC.[Fecha Factura], 23) BETWEEN @fechaInicio AND @fechaFin
        AND FC.[Documento Empresa] = @documentoEmpresaSeleccionada
         ORDER BY fc.[Id Factura], en.[Documento Entidad] ASC
        `,
        (err) => {
            if (err) {
                console.error('Error executing patient query:', err);
                res.status(500).send('Internal Server Error');
            }
        }
    );

    request.addParameter('fechaInicio', TYPES.Date, fechaInicio);
    request.addParameter('fechaFin', TYPES.Date, fechaFin);
    request.addParameter('documentoEmpresaSeleccionada', TYPES.VarChar, documentoEmpresaSeleccionada);

    const resultados = {};
    const facturasOriginales = [];

    request.on('row', (columns) => {
        let numFactura = columns[1].value;
        const originalNumFactura = numFactura;
        const idTipoRips = columns[16].value;
        const idEvaRips = columns[18].value;
        const IdTrata = columns[19].value;
        const IdFacrua = columns[20].value;



        // Determina si se debe cambiar el numFactura a null
        if (numFactura === null || /000000/.test(numFactura)) {
            numFactura = null;
        }

        // Determina la clave de la factura
        let facturaKey;
        if (numFactura === null) {
            facturaKey = `null_${originalNumFactura}_${columns[5].value}`;
        } else {
            facturaKey = numFactura;
        }

        if (!resultados[facturaKey]) {
            resultados[facturaKey] = {
                numDocumentoIdObligado: columns[0].value,
                numFactura: numFactura,
                numNota: columns[2].value,
                tipoNota: columns[3].value,
                usuarios: []
            };
        }

        const usuario = {
            tipoDocumentoIdentificacion: columns[4].value,
            numDocumentoIdentificacion: columns[5].value.trim().replace(/\r?\n|\r/g, ''),
            tipoUsuario: columns[6].value,
            fechaNacimiento: columns[7].value,
            codSexo: columns[8].value,
            codPaisResidencia: columns[9].value,
            codMunicipioResidencia: columns[10].value,
            codZonaTerritorialResidencia: columns[11].value,
            incapacidad: columns[12].value,
            consecutivo: parseInt(columns[13].value, 10),
            codPaisOrigen: columns[14].value,
            servicios: {
                consultas: [],
                procedimientos: []
            }
        };

        // Fusiona los servicios si ya existe el usuario
        const existingUser = resultados[facturaKey].usuarios.find(u => u.numDocumentoIdentificacion === usuario.numDocumentoIdentificacion);
        if (existingUser) {
            existingUser.servicios.consultas.push(...usuario.servicios.consultas);
            existingUser.servicios.procedimientos.push(...usuario.servicios.procedimientos);
        } else {
            resultados[facturaKey].usuarios.push(usuario);
        }
        // facturasOriginales.push({ originalNumFactura, idTipoRips });

        facturasOriginales.push({ originalNumFactura, idTipoRips, idEvaRips, IdTrata, IdFacrua });
    });
    console.log(" ripsEPS");
    request.on('requestCompleted', async () => {
        for (let factura in resultados) {
            const consulta = resultados[factura];
            console.log(" ");

            // console.log(factura);
            // Buscar la factura en facturasOriginales
            const facturaData = facturasOriginales.find(f => `null_${f.originalNumFactura}_${consulta.usuarios[0].numDocumentoIdentificacion}` === factura || f.originalNumFactura === factura);
            console.log('facturas que hay ', facturaData);
            if (facturaData) {
                // const { originalNumFactura, idTipoRips } = facturaData;

                const { originalNumFactura, idTipoRips, idEvaRips, IdTrata, IdFacrua } = facturaData;

                for (const usuario of consulta.usuarios) {
                    try {
                        // const consultasResponse = await fetch(`${INTERNAL_API_BASE}/RIPS/serviciosEPS/ripsAC/${originalNumFactura}/${usuario.numDocumentoIdentificacion}/${fechaInicio}/${fechaFin}/${ResolucionesRips}`);
                        const consultasResponse = await fetch(`${INTERNAL_API_BASE}/RIPS/serviciosEPS/ripsAC/${idEvaRips}/${IdTrata}/${IdFacrua}/${usuario.numDocumentoIdentificacion}`);
                        const consultasData = await consultasResponse.json();

                        if (consultasData.length > 0) {

                            usuario.servicios.consultas.push(...consultasData);
                        } else {
                            delete usuario.servicios.consultas;
                        }
                    } catch (error) {
                        console.error('Error al obtener consultas:', error);
                    }

                    try {
                        const procedimientosResponse = await fetch(`${INTERNAL_API_BASE}/RIPS/serviciosEPS/ripsAP/${idEvaRips}/${IdTrata}/${IdFacrua}/${usuario.numDocumentoIdentificacion}`);
                        const procedimientosData = await procedimientosResponse.json();

                        if (procedimientosData.length > 0) {
                            usuario.servicios.procedimientos.push(...procedimientosData);
                        } else {
                            delete usuario.servicios.procedimientos;
                        }
                    } catch (error) {
                        console.error('Error al obtener procedimientos:', error);
                    }
                }
            } else {
                console.error(`Factura con clave ${factura} no encontrada en facturasOriginales.`);
            }
        }

        res.json(Object.values(resultados));
    });


    connection.execSql(request);
});




router.get('/servicios/ripsACSinfactura/:IdFacrua/:numDocumentoIdentificacion/:fechaInicio/:fechaFin', (req, res) => {

    console.log(' AC Sin factura');
    const IdFacrua = req.params.IdFacrua;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    // console.log(`Se supone que esta es el documento  ${numDocumentoIdentificacion} `);
    // console.log(`Se supone que esta es el id factura  ${IdFacrua} `);

    // console.log("factura ", IdFacrua);
    // console.log("numDocumentoIdentificacion ", numDocumentoIdentificacion);
    const request = new Request(
        `
        --ac correcto 
          SELECT 
            EMP.[Código Empresa] AS codPrestador, 
            --EVA.[Fecha Evaluación Entidad] AS fechaInicioAtencion,
             --SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) AS fechaInicioAtencion, 
			CASE  
			WHEN FC.[Fecha Factura] IS NULL 
			THEN SUBSTRING(CONVERT(VARCHAR,EVA.[Fecha Evaluación Entidad], 120), 1, 16) 
			ELSE  SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) END AS fechaInicioAtencion,
            --PTC.[Nro Autorización Plan de Tratamiento Copago] AS numAutorizacion,
            '0' AS numAutorizacion,
            EVR.[Codigo RIPS] AS codConsulta,
            MODA.Codigo AS modalidadGrupoServicioTecSal, 
            GP.Codigo   AS grupoServicios, 
            Serv.[Código Servicios] AS codServicio,
            evr.[Id Finalidad Consulta] AS finalidadTecnologiaSalud, 
            --evr.[Id Causa Externa]  AS causaMotivoAtencion,
            Cau.Codigo AS causaMotivoAtencion,
            evr.[Diagnostico Rips] AS codDiagnosticoPrincipal, 
            Null  AS codDiagnosticoRelacionado1,
            NULL AS codDiagnosticoRelacionado2,
            NULL AS codDiagnosticoRelacionado3, 
            tdp.[Código Tipo de Diagnóstico Principal] AS tipoDiagnosticoPrincipal,
            tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, eva.[Documento Profesional] AS numDocumentoIdentificacion, 
            --FII.[Valor FacturaII] AS vrServicio,
            fc.[SubTotal Factura] AS vrServicio,
            '05' AS tipoPagoModerador, '0' AS valorPagoModerador, 
            NULL  AS numFEVPagoModerador, 
            ROW_NUMBER() OVER (ORDER BY EVR.[Id Evaluación Entidad RIPS]) AS consecutivo


            FROM [Evaluación Entidad Rips] EVR 
            INNER JOIN [Evaluación Entidad] EVA ON EVA.[Id Evaluación Entidad] = EVR.[Id Evaluación Entidad]
            INNER JOIN Factura FC ON FC.[Id Factura] = EVR.[Id Factura]
            --INNER JOIN FacturaII FII ON FII.[Id Factura] = EVR.[Id Factura] 
            --AND FII.[Id Plan de Tratamiento] = EVR.[Id Plan de Tratamiento] 
            --LEFT JOIN [Plan de Tratamiento] PT ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento] 
            --LEFT JOIN [Plan de Tratamiento Tratamientos] PTT ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
            --LEFT JOIN [Plan de Tratamiento Copago] PTC ON PTC.[Id Plan de Tratamiento Tratamientos] = PTT.[Id Plan de Tratamiento Tratamientos]
            INNER JOIN Empresa EMP ON EMP.[Documento Empresa] = FC.[Documento Empresa]
            INNER JOIN EmpresaV EmpV ON EmpV.[Id EmpresaV] = FC.[Id EmpresaV]
            LEFT JOIN [RIPS Modalidad Atención] MODA ON MODA.[Id Modalidad Atencion] = EVR.[Id Modalidad Atencion]
            LEFT JOIN [RIPS Grupo Servicios] GP ON GP.[Id Grupo Servicios] = EVR.[Id Grupo Servicios]
            left join [RIPS Servicios] AS Serv ON serv.[Id Servicios]  = evr.[Id Servicios]
            LEFT JOIN [RIPS Causa Externa Version2] as Cau on Cau.[Id RIPS Causa Externa Version2] = evr.[Id Causa Externa]
            LEFT JOIN [Tipo de Diagnóstico Principal] as tdp ON evr.[Id Tipo de Diagnóstico Principal] = tdp.[Tipo de Diagnóstico Principal]
            INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eva.[Documento Profesional]
            left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 
                                
            WHERE evr.[Id Acto Quirúrgico] = 1 
            AND EVR.[Id Factura] = @IdFacrua
            AND EVA.[Documento Entidad] = @numDocumentoIdentificacion
            AND CONVERT(DATE, EVA.[Fecha Evaluación Entidad], 23) BETWEEN @fechaInicio AND @fechaFin
            ORDER BY EVR.[Id Evaluación Entidad RIPS]
        `,
        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('IdFacrua', TYPES.Int, IdFacrua);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);
    request.addParameter('fechaInicio', TYPES.Date, fechaInicio);
    request.addParameter('fechaFin', TYPES.Date, fechaFin);
    // request.addParameter('ResolucionesRips', TYPES.VarChar, ResolucionesRips); 


    const resultadosServicios = [];

    request.on('row', (columns) => {
        // console.log('Fila de servicios:', columns);

        const servicio = {
            codPrestador: columns[0].value,
            fechaInicioAtencion: columns[1].value,
            numAutorizacion: columns[2].value,
            codConsulta: columns[3].value,
            modalidadGrupoServicioTecSal: columns[4].value,
            grupoServicios: columns[5].value,
            codServicio: parseInt(columns[6].value, 10),
            finalidadTecnologiaSalud: columns[7].value.toString(),
            causaMotivoAtencion: columns[8].value.toString(),
            codDiagnosticoPrincipal: columns[9].value,
            codDiagnosticoRelacionado1: columns[10].value,
            codDiagnosticoRelacionado2: columns[11].value,
            codDiagnosticoRelacionado3: columns[12].value,
            tipoDiagnosticoPrincipal: columns[13].value,
            tipoDocumentoIdentificacion: columns[14].value,
            numDocumentoIdentificacion: columns[15].value,
            vrServicio: columns[16].value,
            conceptoRecaudo: columns[17].value,
            valorPagoModerador: parseInt(columns[18].value, 10),
            numFEVPagoModerador: columns[19].value,
            consecutivo: parseInt(columns[20].value, 10) // Convertir a entero
        };

        resultadosServicios.push(servicio);
    });

    request.on('requestCompleted', () => {
        // console.log('Resultados de servicios:', resultadosServicios);
        res.json(resultadosServicios);
    });

    // Añade este bloque para verificar si hay errores en la ejecución de la consulta de servicios
    request.on('error', (err) => {
        console.error('Error en la consulta de servicios:', err);
        res.status(500).send('Error interno del servidor');
    });

    connection.execSql(request);
});

router.get('/servicios/ripsAC/:idEvaRips/:IdTrata/:IdFacrua/:numDocumentoIdentificacion', (req, res) => {

    console.log(' AC ');
    const IdFacrua = req.params.IdFacrua;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;
    console.log("factura ", IdFacrua);
    console.log("numDocumentoIdentificacion ", numDocumentoIdentificacion);
    const request = new Request(
        `
        --ac correcto 
         SELECT 
            EMP.[Código Empresa] AS codPrestador, 
            --EVA.[Fecha Evaluación Entidad] AS fechaInicioAtencion,
             --SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) AS fechaInicioAtencion, 
			CASE  
			WHEN FC.[Fecha Factura] IS NULL 
			THEN SUBSTRING(CONVERT(VARCHAR,EVA.[Fecha Evaluación Entidad], 120), 1, 16) 
			ELSE  SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) END AS fechaInicioAtencion,
            --PTC.[Nro Autorización Plan de Tratamiento Copago] AS numAutorizacion,
            '0' AS numAutorizacion,
            EVR.[Codigo RIPS] AS codConsulta,
            MODA.Codigo AS modalidadGrupoServicioTecSal, 
            GP.Codigo   AS grupoServicios, 
            Serv.[Código Servicios] AS codServicio,
            FIN.Codigo AS finalidadTecnologiaSalud, 
            --evr.[Id Causa Externa]  AS causaMotivoAtencion,
            Cau.Codigo AS causaMotivoAtencion,
            evr.[Diagnostico Rips] AS codDiagnosticoPrincipal, 
            Null  AS codDiagnosticoRelacionado1,
            NULL AS codDiagnosticoRelacionado2,
            NULL AS codDiagnosticoRelacionado3, 
            tdp.[Código Tipo de Diagnóstico Principal] AS tipoDiagnosticoPrincipal,
            tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, eva.[Documento Profesional] AS numDocumentoIdentificacion, 
            --FII.[Valor FacturaII] AS vrServicio,
            fc.[SubTotal Factura] AS vrServicio,
            '05' AS tipoPagoModerador, '0' AS valorPagoModerador, 
            NULL  AS numFEVPagoModerador, 
            ROW_NUMBER() OVER (ORDER BY EVR.[Id Evaluación Entidad RIPS]) AS consecutivo


            FROM [Evaluación Entidad Rips] EVR 
            INNER JOIN [Evaluación Entidad] EVA ON EVA.[Id Evaluación Entidad] = EVR.[Id Evaluación Entidad]
            INNER JOIN Factura FC ON FC.[Id Factura] = EVR.[Id Factura]
            --INNER JOIN FacturaII FII ON FII.[Id Factura] = EVR.[Id Factura] 
            --AND FII.[Id Plan de Tratamiento] = EVR.[Id Plan de Tratamiento] 
            --LEFT JOIN [Plan de Tratamiento] PT ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento] 
            --LEFT JOIN [Plan de Tratamiento Tratamientos] PTT ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
            --LEFT JOIN [Plan de Tratamiento Copago] PTC ON PTC.[Id Plan de Tratamiento Tratamientos] = PTT.[Id Plan de Tratamiento Tratamientos]
            INNER JOIN Empresa EMP ON EMP.[Documento Empresa] = FC.[Documento Empresa]
            INNER JOIN EmpresaV EmpV ON EmpV.[Id EmpresaV] = FC.[Id EmpresaV]
            LEFT JOIN [RIPS Modalidad Atención] MODA ON MODA.[Id Modalidad Atencion] = EVR.[Id Modalidad Atencion]
            LEFT JOIN [RIPS Grupo Servicios] GP ON GP.[Id Grupo Servicios] = EVR.[Id Grupo Servicios]
            left join [RIPS Servicios] AS Serv ON serv.[Id Servicios]  = evr.[Id Servicios]
            LEFT JOIN [RIPS Causa Externa Version2] as Cau on Cau.[Id RIPS Causa Externa Version2] = evr.[Id Causa Externa]
            LEFT JOIN [Tipo de Diagnóstico Principal] as tdp ON evr.[Id Tipo de Diagnóstico Principal] = tdp.[Tipo de Diagnóstico Principal]
            INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eva.[Documento Profesional]
            left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 
             LEFT JOIN [RIPS Finalidad Consulta Version2] FIN ON FIN.[Id Finalidad Consulta] = EVR.[Id Finalidad Consulta]
                      
            WHERE evr.[Id Acto Quirúrgico] = 1 
            AND EVR.[Id Factura] = @IdFacrua
            --AND EVA.[Documento Entidad] = @numDocumentoIdentificacion


        `,
        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('IdFacrua', TYPES.Int, IdFacrua);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);


    const resultadosServicios = [];

    request.on('row', (columns) => {
        // console.log('Fila de servicios:', columns);

        const servicio = {
            codPrestador: columns[0].value,
            fechaInicioAtencion: columns[1].value,
            numAutorizacion: columns[2].value,
            codConsulta: columns[3].value,
            modalidadGrupoServicioTecSal: columns[4].value,
            grupoServicios: columns[5].value,
            codServicio: parseInt(columns[6].value, 10),
            finalidadTecnologiaSalud: columns[7].value.toString(),
            causaMotivoAtencion: columns[8].value.toString(),
            codDiagnosticoPrincipal: columns[9].value,
            codDiagnosticoRelacionado1: columns[10].value,
            codDiagnosticoRelacionado2: columns[11].value,
            codDiagnosticoRelacionado3: columns[12].value,
            tipoDiagnosticoPrincipal: columns[13].value,
            tipoDocumentoIdentificacion: columns[14].value,
            numDocumentoIdentificacion: columns[15].value,
            vrServicio: columns[16].value,
            conceptoRecaudo: columns[17].value,
            valorPagoModerador: parseInt(columns[18].value, 10),
            numFEVPagoModerador: columns[19].value,
            consecutivo: parseInt(columns[20].value, 10) // Convertir a entero
        };

        resultadosServicios.push(servicio);
    });

    request.on('requestCompleted', () => {
        // console.log('Resultados de servicios:', resultadosServicios);
        res.json(resultadosServicios);
    });

    // Añade este bloque para verificar si hay errores en la ejecución de la consulta de servicios
    request.on('error', (err) => {
        console.error('Error en la consulta de servicios:', err);
        res.status(500).send('Error interno del servidor');
    });

    connection.execSql(request);
});



router.get('/servicios/ripsAPSinFactura/:IdFacrua/:numDocumentoIdentificacion/:fechaInicio/:fechaFin', (req, res) => {
    console.log(' AP sin factura');

    const IdFacrua = req.params.IdFacrua;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    // console.log(`Se supone que esta es la fecha pa  ${fechaFin} ${fechaInicio}`);
    // console.log(`Se supone que esta es el documento  ${numDocumentoIdentificacion} `);
    // console.log(`Se supone que esta es el id factura  ${IdFacrua} `);

    const request = new Request(
        `
        --ap correcto 
             SELECT 
                EMP.[Código Empresa] AS codPrestador, 
                --EVA.[Fecha Evaluación Entidad] AS fechaInicioAtencion,
                 --SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) AS fechaInicioAtencion, 
			CASE  
			WHEN FC.[Fecha Factura] IS NULL 
			THEN SUBSTRING(CONVERT(VARCHAR,EVA.[Fecha Evaluación Entidad], 120), 1, 16) 
			ELSE  SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) END AS fechaInicioAtencion, 
				NULL AS idMIPRES,
                --PTC.[Nro Autorización Plan de Tratamiento Copago] AS numAutorizacion,
                '0'  AS numAutorizacion,
				evr.[Codigo Rips] AS codProcedimiento,
				VIAI.Codigo AS viaIngresoServicioSalud, 
				MODA.Codigo AS modalidadGrupoServicioTecSal, 
				GP.Codigo AS grupoServicios,
				Serv.[Código Servicios] AS codServicio,
				EVR.[Id Finalidad Consulta] AS finalidadTecnologiaSalud,
				tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, 
				eva.[Documento Profesional] AS numDocumentoIdentificacion, 
				EVR.[Diagnostico Rips] AS codDiagnosticoPrincipal, 
				NULL   AS codDiagnosticoRelacionado, 
				NULL AS codComplicacion, 
				--FII.[Valor FacturaII] AS vrServicio,
            fc.[SubTotal Factura] AS vrServicio,
				'05' AS tipoPagoModerador, -- ESTO DESPUES SE TIENE QUE CAMBIAR POR QUE SI EXISTE EN ALGUNOS CASO TIPOS DE PAGO
				'0' AS valorPagoModerador, -- ESTO DESPUES SE TIENE QUE CAMBIAR POR QUE SI EXISTE EN ALGUNOS CASO VALORES DE PAGO SEGUN EL TIPO PAGO
				NULL AS numFEVPagoModerador,  
				ROW_NUMBER() OVER (ORDER BY EVR.[Id Evaluación Entidad RIPS]) AS consecutivo,
				EVA.[Id Evaluación Entidad]

                FROM [Evaluación Entidad Rips] EVR 
                INNER JOIN [Evaluación Entidad] EVA ON EVA.[Id Evaluación Entidad] = EVR.[Id Evaluación Entidad]
                INNER JOIN Factura FC ON FC.[Id Factura] = EVR.[Id Factura]
                --INNER JOIN FacturaII FII ON FII.[Id Factura] = EVR.[Id Factura] 
                --AND FII.[Id Plan de Tratamiento] = EVR.[Id Plan de Tratamiento] 
                --LEFT JOIN [Plan de Tratamiento] PT ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento] 
                --LEFT JOIN [Plan de Tratamiento Tratamientos] PTT ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
                --LEFT JOIN [Plan de Tratamiento Copago] PTC ON PTC.[Id Plan de Tratamiento Tratamientos] = PTT.[Id Plan de Tratamiento Tratamientos]
                INNER JOIN Empresa EMP ON EMP.[Documento Empresa] = FC.[Documento Empresa]
                INNER JOIN EmpresaV EmpV ON EmpV.[Id EmpresaV] = FC.[Id EmpresaV]
                LEFT JOIN [RIPS Modalidad Atención] MODA ON MODA.[Id Modalidad Atencion] = EVR.[Id Modalidad Atencion]
                LEFT JOIN [RIPS Grupo Servicios] GP ON GP.[Id Grupo Servicios] = EVR.[Id Grupo Servicios]
                left join [RIPS Servicios] AS Serv ON serv.[Id Servicios]  = evr.[Id Servicios]
                LEFT JOIN [RIPS Causa Externa Version2] as Cau on Cau.[Id RIPS Causa Externa Version2] = evr.[Id Causa Externa]
                LEFT JOIN [Tipo de Diagnóstico Principal] as tdp ON evr.[Id Tipo de Diagnóstico Principal] = tdp.[Id Tipo de Diagnóstico Principal]
                INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eva.[Documento Profesional]
                left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 
                left join [RIPS Via Ingreso Usuario]   viaI ON VIAI.[Id Via Ingreso Usuario] = EVR.[Id Via Ingreso Usuario]     
				LEFT JOIN [RIPS Finalidad Consulta Version2] as fp ON EVR.[Id Finalidad Consulta] = fp.Codigo

                WHERE evr.[Id Acto Quirúrgico] <> 1 
                AND EVR.[Id Factura] = @IdFacrua
                AND EVA.[Documento Entidad] = @numDocumentoIdentificacion   
                AND CONVERT(DATE, EVA.[Fecha Evaluación Entidad], 23) BETWEEN @fechaInicio AND @fechaFin
                ORDER BY EVR.[Id Evaluación Entidad RIPS]

        `,

        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('IdFacrua', TYPES.Int, IdFacrua);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);
    request.addParameter('fechaInicio', TYPES.Date, fechaInicio);
    request.addParameter('fechaFin', TYPES.Date, fechaFin);
    // request.addParameter('ResolucionesRips', TYPES.VarChar, ResolucionesRips);

    const resultadosServicios = [];

    request.on('row', (columns) => {
        const servicio = {
            codPrestador: columns[0].value,
            fechaInicioAtencion: columns[1].value,
            idMIPRES: columns[2].value,
            numAutorizacion: columns[3].value,
            codProcedimiento: columns[4].value,
            viaIngresoServicioSalud: columns[5].value,
            modalidadGrupoServicioTecSal: columns[6].value,
            grupoServicios: columns[7].value,
            codServicio: parseInt(columns[8].value, 10),
            finalidadTecnologiaSalud: columns[9].value.toString(),
            tipoDocumentoIdentificacion: columns[10].value,
            numDocumentoIdentificacion: columns[11].value,
            codDiagnosticoPrincipal: columns[12].value,
            codDiagnosticoRelacionado: columns[13].value,
            codComplicacion: columns[14].value,
            vrServicio: columns[15].value,
            conceptoRecaudo: columns[16].value,
            valorPagoModerador: parseInt(columns[17].value, 10),
            numFEVPagoModerador: columns[18].value,
            consecutivo: parseInt(columns[19].value, 10) // Convertir a entero
        };

        resultadosServicios.push(servicio);
        console.log("Si estoy llegando aca");
        console.log(resultadosServicios);
    });

    request.on('requestCompleted', () => {
        res.json(resultadosServicios);
    });

    // Añade este bloque para verificar si hay errores en la ejecución de la consulta de servicios
    request.on('error', (err) => {
        console.error('Error en la consulta de servicios:', err);
        res.status(500).send('Error interno del servidor');
    });

    connection.execSql(request);
});

router.get('/servicios/ripsAP/:idEvaRips/:IdTrata/:IdFacrua/:numDocumentoIdentificacion', (req, res) => {
    console.log(' AP ');

    const IdFacrua = req.params.IdFacrua;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;

    console.log("Estoy en el Ap de ");
    console.log("factura ", IdFacrua);
    console.log("documento ", numDocumentoIdentificacion);

    const request = new Request(
        `
        --ap correcto 
             SELECT 
                EMP.[Código Empresa] AS codPrestador, 
                --EVA.[Fecha Evaluación Entidad] AS fechaInicioAtencion,
                 --SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) AS fechaInicioAtencion, 
			CASE  
			WHEN FC.[Fecha Factura] IS NULL 
			THEN SUBSTRING(CONVERT(VARCHAR,EVA.[Fecha Evaluación Entidad], 120), 1, 16) 
			ELSE  SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) END AS fechaInicioAtencion, 
				NULL AS idMIPRES,
                --PTC.[Nro Autorización Plan de Tratamiento Copago] AS numAutorizacion,
                '0'  AS numAutorizacion,
				evr.[Codigo Rips] AS codProcedimiento,
				VIAI.Codigo AS viaIngresoServicioSalud, 
				MODA.Codigo AS modalidadGrupoServicioTecSal, 
				GP.Codigo AS grupoServicios,
				Serv.[Código Servicios] AS codServicio,
				EVR.[Id Finalidad Consulta] AS finalidadTecnologiaSalud,
				tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, 
				eva.[Documento Profesional] AS numDocumentoIdentificacion, 
				EVR.[Diagnostico Rips] AS codDiagnosticoPrincipal, 
				NULL   AS codDiagnosticoRelacionado, 
				NULL AS codComplicacion, 
				--FII.[Valor FacturaII] AS vrServicio,
            fc.[SubTotal Factura] AS vrServicio,
				'05' AS tipoPagoModerador, -- ESTO DESPUES SE TIENE QUE CAMBIAR POR QUE SI EXISTE EN ALGUNOS CASO TIPOS DE PAGO
				'0' AS valorPagoModerador, -- ESTO DESPUES SE TIENE QUE CAMBIAR POR QUE SI EXISTE EN ALGUNOS CASO VALORES DE PAGO SEGUN EL TIPO PAGO
				NULL AS numFEVPagoModerador,  
				ROW_NUMBER() OVER (ORDER BY EVR.[Id Evaluación Entidad RIPS]) AS consecutivo,
				EVA.[Id Evaluación Entidad]

                FROM [Evaluación Entidad Rips] EVR 
                INNER JOIN [Evaluación Entidad] EVA ON EVA.[Id Evaluación Entidad] = EVR.[Id Evaluación Entidad]
                INNER JOIN Factura FC ON FC.[Id Factura] = EVR.[Id Factura]
                --INNER JOIN FacturaII FII ON FII.[Id Factura] = EVR.[Id Factura] 
                --AND FII.[Id Plan de Tratamiento] = EVR.[Id Plan de Tratamiento] 
                --LEFT JOIN [Plan de Tratamiento] PT ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento] 
                --LEFT JOIN [Plan de Tratamiento Tratamientos] PTT ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
                --LEFT JOIN [Plan de Tratamiento Copago] PTC ON PTC.[Id Plan de Tratamiento Tratamientos] = PTT.[Id Plan de Tratamiento Tratamientos]
                INNER JOIN Empresa EMP ON EMP.[Documento Empresa] = FC.[Documento Empresa]
                INNER JOIN EmpresaV EmpV ON EmpV.[Id EmpresaV] = FC.[Id EmpresaV]
                LEFT JOIN [RIPS Modalidad Atención] MODA ON MODA.[Id Modalidad Atencion] = EVR.[Id Modalidad Atencion]
                LEFT JOIN [RIPS Grupo Servicios] GP ON GP.[Id Grupo Servicios] = EVR.[Id Grupo Servicios]
                left join [RIPS Servicios] AS Serv ON serv.[Id Servicios]  = evr.[Id Servicios]
                LEFT JOIN [RIPS Causa Externa Version2] as Cau on Cau.[Id RIPS Causa Externa Version2] = evr.[Id Causa Externa]
                LEFT JOIN [Tipo de Diagnóstico Principal] as tdp ON evr.[Id Tipo de Diagnóstico Principal] = tdp.[Id Tipo de Diagnóstico Principal]
                INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eva.[Documento Profesional]
                left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 
                left join [RIPS Via Ingreso Usuario]   viaI ON VIAI.[Id Via Ingreso Usuario] = EVR.[Id Via Ingreso Usuario]     
				--LEFT JOIN [RIPS Finalidad Consulta Version2] as fp ON EVR.[Id Finalidad Consulta] = fp.Codigo

                WHERE evr.[Id Acto Quirúrgico] <> 1 
                AND EVR.[Id Factura] = @IdFacrua
                --AND EVA.[Documento Entidad] = @numDocumentoIdentificacion

        `,

        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('IdFacrua', TYPES.Int, IdFacrua);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);

    const resultadosServicios = [];

    request.on('row', (columns) => {
        const servicio = {
            codPrestador: columns[0].value,
            fechaInicioAtencion: columns[1].value,
            idMIPRES: columns[2].value,
            numAutorizacion: columns[3].value,
            codProcedimiento: columns[4].value,
            viaIngresoServicioSalud: columns[5].value,
            modalidadGrupoServicioTecSal: columns[6].value,
            grupoServicios: columns[7].value,
            codServicio: parseInt(columns[8].value, 10),
            finalidadTecnologiaSalud: columns[9].value.toString(),
            tipoDocumentoIdentificacion: columns[10].value,
            numDocumentoIdentificacion: columns[11].value,
            codDiagnosticoPrincipal: columns[12].value,
            codDiagnosticoRelacionado: columns[13].value,
            codComplicacion: columns[14].value,
            vrServicio: columns[15].value,
            conceptoRecaudo: columns[16].value,
            valorPagoModerador: parseInt(columns[17].value, 10),
            numFEVPagoModerador: columns[18].value,
            consecutivo: parseInt(columns[19].value, 10) // Convertir a entero
        };

        resultadosServicios.push(servicio);
        console.log("Si estoy llegando aca");
        console.log(resultadosServicios);
    });

    request.on('requestCompleted', () => {
        res.json(resultadosServicios);
    });

    // Añade este bloque para verificar si hay errores en la ejecución de la consulta de servicios
    request.on('error', (err) => {
        console.error('Error en la consulta de servicios:', err);
        res.status(500).send('Error interno del servidor');
    });

    connection.execSql(request);
});

router.get('/serviciosEPS/ripsAP/:idEvaRips/:IdTrata/:IdFacrua/:numDocumentoIdentificacion', (req, res) => {
    console.log('EPS AP ');

    const IdFacrua = req.params.IdFacrua;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;

    console.log("Estoy en el Ap de ");
    console.log("factura ", IdFacrua);
    console.log("documento ", numDocumentoIdentificacion);

    const request = new Request(
        `
        --ap correcto 
            SELECT 
                EMP.[Código Empresa] AS codPrestador, 
                --EVA.[Fecha Evaluación Entidad] AS fechaInicioAtencion,
                SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) AS fechaInicioAtencion, 
				NULL AS idMIPRES,
                PTC.[Nro Autorización Plan de Tratamiento Copago] AS numAutorizacion,
				evr.[Codigo Rips] AS codProcedimiento,
				VIAI.Codigo AS viaIngresoServicioSalud, 
				MODA.Codigo AS modalidadGrupoServicioTecSal, 
				GP.Codigo AS grupoServicios,
				Serv.[Código Servicios] AS codServicio,
				EVR.[Id Finalidad Consulta] AS finalidadTecnologiaSalud,
				tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, 
				eva.[Documento Profesional] AS numDocumentoIdentificacion, 
				EVR.[Diagnostico Rips] AS codDiagnosticoPrincipal, 
				NULL   AS codDiagnosticoRelacionado, 
				NULL AS codComplicacion, 
				--FII.[Valor FacturaII] AS vrServicio,
                case when cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento] is null then FII.[Valor FacturaII] else FII.[Valor FacturaII]+ cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento]  END AS vrServicio,
				case when cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento] is null then '05' else '03' END AS tipoPagoModerador,
				--'05' AS tipoPagoModerador, -- ESTO DESPUES SE TIENE QUE CAMBIAR POR QUE SI EXISTE EN ALGUNOS CASO TIPOS DE PAGO
				case when cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento] is null then 0 else cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento]  END AS valorPagoModerador,
				--'0' AS valorPagoModerador, -- ESTO DESPUES SE TIENE QUE CAMBIAR POR QUE SI EXISTE EN ALGUNOS CASO VALORES DE PAGO SEGUN EL TIPO PAGO
				NULL AS numFEVPagoModerador,  
				ROW_NUMBER() OVER (ORDER BY EVR.[Id Evaluación Entidad RIPS]) AS consecutivo,
				EVA.[Id Evaluación Entidad]

                FROM [Evaluación Entidad Rips] EVR 
                INNER JOIN [Evaluación Entidad] EVA ON EVA.[Id Evaluación Entidad] = EVR.[Id Evaluación Entidad]
                INNER JOIN Factura FC ON FC.[Id Factura] = EVR.[Id Factura]
                INNER JOIN FacturaII FII ON FII.[Id Factura] = EVR.[Id Factura] AND FII.[Id Plan de Tratamiento] = EVR.[Id Plan de Tratamiento] 
                INNER JOIN [Plan de Tratamiento] PT ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento] 
                INNER JOIN [Plan de Tratamiento Tratamientos] PTT ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
                INNER JOIN [Plan de Tratamiento Copago] PTC ON PTC.[Id Plan de Tratamiento Tratamientos] = PTT.[Id Plan de Tratamiento Tratamientos]
				left join  [Cuotas Pactadas Inicial Tratamiento] cpit on cpit.[Id Plan de Tratamiento Tratamientos] = ptt.[Id Plan de Tratamiento Tratamientos]
				left join  [Cuotas Pactadas Tratamiento] cpt on cpt.[Id Plan de Tratamiento Tratamientos] = ptt.[Id Plan de Tratamiento Tratamientos]
                INNER JOIN Empresa EMP ON EMP.[Documento Empresa] = FC.[Documento Empresa]
                INNER JOIN EmpresaV EmpV ON EmpV.[Id EmpresaV] = FC.[Id EmpresaV]
                LEFT JOIN [RIPS Modalidad Atención] MODA ON MODA.[Id Modalidad Atencion] = EVR.[Id Modalidad Atencion]
                LEFT JOIN [RIPS Grupo Servicios] GP ON GP.[Id Grupo Servicios] = EVR.[Id Grupo Servicios]
                left join [RIPS Servicios] AS Serv ON serv.[Id Servicios]  = evr.[Id Servicios]
                LEFT JOIN [RIPS Causa Externa Version2] as Cau on Cau.[Id RIPS Causa Externa Version2] = evr.[Id Causa Externa]
                LEFT JOIN [Tipo de Diagnóstico Principal] as tdp ON evr.[Id Tipo de Diagnóstico Principal] = tdp.[Id Tipo de Diagnóstico Principal]
                INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eva.[Documento Profesional]
                left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 
                left join [RIPS Via Ingreso Usuario]   viaI ON VIAI.[Id Via Ingreso Usuario] = EVR.[Id Via Ingreso Usuario]     
				--LEFT JOIN [RIPS Finalidad Consulta Version2] as fp ON EVR.[Id Finalidad Consulta] = fp.Codigo
					   

                WHERE evr.[Id Acto Quirúrgico] <> 1 
                AND EVR.[Id Factura] = @IdFacrua
                AND EVA.[Documento Entidad] = @numDocumentoIdentificacion

        `,

        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('IdFacrua', TYPES.Int, IdFacrua);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);

    const resultadosServicios = [];

    request.on('row', (columns) => {
        const servicio = {
            codPrestador: columns[0].value,
            fechaInicioAtencion: columns[1].value,
            idMIPRES: columns[2].value,
            numAutorizacion: columns[3].value,
            codProcedimiento: columns[4].value,
            viaIngresoServicioSalud: columns[5].value,
            modalidadGrupoServicioTecSal: columns[6].value,
            grupoServicios: columns[7].value,
            codServicio: parseInt(columns[8].value, 10),
            finalidadTecnologiaSalud: columns[9].value.toString(),
            tipoDocumentoIdentificacion: columns[10].value,
            numDocumentoIdentificacion: columns[11].value,
            codDiagnosticoPrincipal: columns[12].value,
            codDiagnosticoRelacionado: columns[13].value,
            codComplicacion: columns[14].value,
            vrServicio: columns[15].value,
            conceptoRecaudo: columns[16].value,
            valorPagoModerador: parseInt(columns[17].value, 10),
            numFEVPagoModerador: columns[18].value,
            consecutivo: parseInt(columns[19].value, 10) // Convertir a entero
        };

        resultadosServicios.push(servicio);
        console.log("Si estoy llegando aca");
        console.log(resultadosServicios);
    });

    request.on('requestCompleted', () => {
        res.json(resultadosServicios);
    });

    // Añade este bloque para verificar si hay errores en la ejecución de la consulta de servicios
    request.on('error', (err) => {
        console.error('Error en la consulta de servicios:', err);
        res.status(500).send('Error interno del servidor');
    });

    connection.execSql(request);
});

router.get('/serviciosEPS/ripsAC/:idEvaRips/:IdTrata/:IdFacrua/:numDocumentoIdentificacion', (req, res) => {

    console.log('EPS AC ');
    const IdFacrua = req.params.IdFacrua;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;
    console.log("factura ", IdFacrua);
    console.log("numDocumentoIdentificacion ", numDocumentoIdentificacion);
    const request = new Request(
        `
        --ac correcto 
         SELECT 
            EMP.[Código Empresa] AS codPrestador, 
            --EVA.[Fecha Evaluación Entidad] AS fechaInicioAtencion,
            SUBSTRING(CONVERT(VARCHAR, FC.[Fecha Factura], 120), 1, 16) AS fechaInicioAtencion, 
            PTC.[Nro Autorización Plan de Tratamiento Copago] AS numAutorizacion,
            EVR.[Codigo RIPS] AS codConsulta,
            MODA.Codigo AS modalidadGrupoServicioTecSal, 
            GP.Codigo   AS grupoServicios, 
            Serv.[Código Servicios] AS codServicio,
            evr.[Id Finalidad Consulta] AS finalidadTecnologiaSalud, 
            --evr.[Id Causa Externa]  AS causaMotivoAtencion,
            Cau.Codigo AS causaMotivoAtencion,
            evr.[Diagnostico Rips] AS codDiagnosticoPrincipal, 
            Null  AS codDiagnosticoRelacionado1,
            NULL AS codDiagnosticoRelacionado2,
            NULL AS codDiagnosticoRelacionado3, 
            tdp.[Código Tipo de Diagnóstico Principal] AS tipoDiagnosticoPrincipal,
            tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, eva.[Documento Profesional] AS numDocumentoIdentificacion, 
            --FII.[Valor FacturaII] AS vrServicio,
            case when cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento] is null then FII.[Valor FacturaII] else FII.[Valor FacturaII]+ cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento]  END AS vrServicio,
            	case when cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento] is null then '05' else '03' END AS tipoPagoModerador,
				--'05' AS tipoPagoModerador, -- ESTO DESPUES SE TIENE QUE CAMBIAR POR QUE SI EXISTE EN ALGUNOS CASO TIPOS DE PAGO
				case when cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento] is null then 0 else cpit.[Valor de Cuota Cuotas Pactadas Inicial Tratamiento]  END AS valorPagoModerador,
				--'0' AS valorPagoModerador, -- ESTO DESPUES SE TIENE QUE CAMBIAR POR QUE SI EXISTE EN ALGUNOS CASO VALORES DE PAGO SEGUN EL TIPO PAGO
				 NULL  AS numFEVPagoModerador, 
            ROW_NUMBER() OVER (ORDER BY EVR.[Id Evaluación Entidad RIPS]) AS consecutivo


            FROM [Evaluación Entidad Rips] EVR 
            INNER JOIN [Evaluación Entidad] EVA ON EVA.[Id Evaluación Entidad] = EVR.[Id Evaluación Entidad]
            INNER JOIN Factura FC ON FC.[Id Factura] = EVR.[Id Factura]
            INNER JOIN FacturaII FII ON FII.[Id Factura] = EVR.[Id Factura] AND FII.[Id Plan de Tratamiento] = EVR.[Id Plan de Tratamiento] 
            INNER JOIN [Plan de Tratamiento] PT ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento] 
            INNER JOIN [Plan de Tratamiento Tratamientos] PTT ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
            INNER JOIN [Plan de Tratamiento Copago] PTC ON PTC.[Id Plan de Tratamiento Tratamientos] = PTT.[Id Plan de Tratamiento Tratamientos]
			left join  [Cuotas Pactadas Inicial Tratamiento] cpit on cpit.[Id Plan de Tratamiento Tratamientos] = ptt.[Id Plan de Tratamiento Tratamientos]
			left join  [Cuotas Pactadas Tratamiento] cpt on cpt.[Id Plan de Tratamiento Tratamientos] = ptt.[Id Plan de Tratamiento Tratamientos]
            INNER JOIN Empresa EMP ON EMP.[Documento Empresa] = FC.[Documento Empresa]
            INNER JOIN EmpresaV EmpV ON EmpV.[Id EmpresaV] = FC.[Id EmpresaV]
            LEFT JOIN [RIPS Modalidad Atención] MODA ON MODA.[Id Modalidad Atencion] = EVR.[Id Modalidad Atencion]
            LEFT JOIN [RIPS Grupo Servicios] GP ON GP.[Id Grupo Servicios] = EVR.[Id Grupo Servicios]
            left join [RIPS Servicios] AS Serv ON serv.[Id Servicios]  = evr.[Id Servicios]
            LEFT JOIN [RIPS Causa Externa Version2] as Cau on Cau.[Id RIPS Causa Externa Version2] = evr.[Id Causa Externa]
            LEFT JOIN [Tipo de Diagnóstico Principal] as tdp ON evr.[Id Tipo de Diagnóstico Principal] = tdp.[Tipo de Diagnóstico Principal]
            INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eva.[Documento Profesional]
            left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 
                                
            WHERE evr.[Id Acto Quirúrgico] = 1 
            AND EVR.[Id Factura] = @IdFacrua
            AND EVA.[Documento Entidad] = @numDocumentoIdentificacion


        `,
        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('IdFacrua', TYPES.Int, IdFacrua);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);


    const resultadosServicios = [];

    request.on('row', (columns) => {
        // console.log('Fila de servicios:', columns);

        const servicio = {
            codPrestador: columns[0].value,
            fechaInicioAtencion: columns[1].value,
            numAutorizacion: columns[2].value,
            codConsulta: columns[3].value,
            modalidadGrupoServicioTecSal: columns[4].value,
            grupoServicios: columns[5].value,
            codServicio: parseInt(columns[6].value, 10),
            finalidadTecnologiaSalud: columns[7].value.toString(),
            causaMotivoAtencion: columns[8].value.toString(),
            codDiagnosticoPrincipal: columns[9].value,
            codDiagnosticoRelacionado1: columns[10].value,
            codDiagnosticoRelacionado2: columns[11].value,
            codDiagnosticoRelacionado3: columns[12].value,
            tipoDiagnosticoPrincipal: columns[13].value,
            tipoDocumentoIdentificacion: columns[14].value,
            numDocumentoIdentificacion: columns[15].value,
            vrServicio: columns[16].value,
            conceptoRecaudo: columns[17].value,
            valorPagoModerador: parseInt(columns[18].value, 10),
            numFEVPagoModerador: columns[19].value,
            consecutivo: parseInt(columns[20].value, 10) // Convertir a entero
        };

        resultadosServicios.push(servicio);
    });

    request.on('requestCompleted', () => {
        // console.log('Resultados de servicios:', resultadosServicios);
        res.json(resultadosServicios);
    });

    // Añade este bloque para verificar si hay errores en la ejecución de la consulta de servicios
    request.on('error', (err) => {
        console.error('Error en la consulta de servicios:', err);
        res.status(500).send('Error interno del servidor');
    });

    connection.execSql(request);
});

/* DESCOMPRESIÓN COMPLETA DE LOS ARCHIVOS JSON */
const descomprimirZip = async (rutaZips, rutaBaseDestino) => {
    try {
        for (const rutaZip of rutaZips) {
            const nombreArchivoZip = path.basename(rutaZip, '.zip');
            const rutaDestino = path.join(rutaBaseDestino, nombreArchivoZip);
            await fsExtra.ensureDir(rutaDestino);

            await new Promise((resolve, reject) => {
                yauzl.open(rutaZip, { lazyEntries: true }, (err, zipfile) => {
                    if (err) return reject(err);

                    zipfile.readEntry();

                    zipfile.on('entry', async (entry) => {
                        const filePath = path.join(rutaDestino, entry.fileName);

                        if (/\/$/.test(entry.fileName)) {
                            // Es un directorio
                            await fsExtra.ensureDir(filePath);
                            zipfile.readEntry();
                        } else {
                            // Es un archivo
                            zipfile.openReadStream(entry, async (err, readStream) => {
                                if (err) return reject(err);

                                // Asegura que el directorio exista
                                await fsExtra.ensureDir(path.dirname(filePath));

                                // Crea un stream de escritura
                                const writeStream = fs.createWriteStream(filePath);

                                // Utiliza pipeline para manejar el flujo de datos y errores
                                await pipelineAsync(readStream, writeStream);

                                zipfile.readEntry();
                            });
                        }
                    });

                    zipfile.on('end', () => {
                        console.log(`Se descomprimió el archivo => ${rutaZip} y se guardó en => ${rutaDestino}`);
                        resolve();
                    });

                    zipfile.on('error', (err) => {
                        console.error('Error al descomprimir:', err);
                        reject(err);
                    });
                });
            });
        }
    } catch (error) {
        console.error('Error durante el proceso de descompresión:', error);
    }
};

router.post('/generar-zip/:fechaInicio/:fechaFin/:prefijo', async (req, res) => {
    const fechaInicio = new Date(req.params.fechaInicio).toISOString().split('T')[0];
    const fechaFin = new Date(req.params.fechaFin).toISOString().split('T')[0];
    const prefijo = req.params.prefijo;

    const data = req.body;
    const zip = new JSZip();

    // Agrupar por numFactura y combinar documentos
    const facturasAgrupadas = data.reduce((acc, consulta) => {

        const numFacturaConsulta = consulta.numFactura || 'SinFactura';
        if (!acc[numFacturaConsulta]) {
            acc[numFacturaConsulta] = [];
        }
        acc[numFacturaConsulta].push(consulta);
        return acc;
    }, {});

    // Generar archivos JSON combinados
    for (const [numFacturaConsulta, consultas] of Object.entries(facturasAgrupadas)) {
        if (numFacturaConsulta === 'SinFactura') {
            consultas.forEach((consulta, index) => {
                const documentos = consulta.usuarios ? consulta.usuarios.map(usuario => usuario.numDocumentoIdentificacion) : [];
                documentos.forEach((documento, docIndex) => {
                    const nombreArchivo = `${numFacturaConsulta}_${documento}.json`;
                    // const nombreArchivo = `${numFacturaConsulta}_${documento}_${docIndex + 1}.json`;
                    const contenidoJSON = JSON.stringify(consulta, null, 2); // Genera el JSON del objeto consulta en lugar de un array
                    zip.file(nombreArchivo, contenidoJSON);
                });
            });
        } else {
            const documentos = consultas.flatMap(consulta => consulta.usuarios ? consulta.usuarios.map(usuario => usuario.numDocumentoIdentificacion) : []);
            const nombreArchivoCombinado = `${numFacturaConsulta}.json`;
            // const nombreArchivoCombinado = `${numFacturaConsulta}_${documentos.join('_')}.json`;
            const contenidoJSONCombinado = JSON.stringify(consultas[0], null, 2); // Toma solo el primer elemento del array para generar el JSON
            zip.file(nombreArchivoCombinado, contenidoJSONCombinado);
        }
    }

    // Crear y enviar el archivo ZIP
    const fechaActual = new Date();
    const fechaFormateada = `${fechaActual.getFullYear()}-${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}-${fechaActual.getDate().toString().padStart(2, '0')}`;
    const nombreArchivo = `${prefijo} --- ${fechaInicio} --- ${fechaFin}.zip`;

    const rutaArchivo = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS', nombreArchivo);
    const nombreCarpetaDeAlmacenadoJSON = `${fechaInicio} --- ${fechaFin}`;

    try {
        // Generar el archivo ZIP
        const content = await zip.generateAsync({ type: 'nodebuffer' });
        fs.writeFileSync(rutaArchivo, content);

        // Descomprimir los archivos ZIP
        const rutasZips = [rutaArchivo]; // Aquí se pueden agregar más rutas de archivos ZIP
        const rutaBaseDestino = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS_JSON');
        await descomprimirZip(rutasZips, rutaBaseDestino);
        const NombreArchivoIgualdadCarpetaParaXMLS = `${prefijo} --- ${fechaInicio} --- ${fechaFin}`;

        // XML vive en XMLS/{documentoEmpresa}/; solo se crea el lote JSON
        const carpetaJson = path.join(rutaBaseDestino, NombreArchivoIgualdadCarpetaParaXMLS);
        let archivosJson = [];
        try {
            if (fs.existsSync(carpetaJson)) {
                archivosJson = fs.readdirSync(carpetaJson).filter((f) => f.toLowerCase().endsWith('.json'));
            }
        } catch (_) { /* ignore */ }

        res.json({
            mensaje: 'Archivo ZIP generado y almacenado',
            ruta: rutaArchivo,
            batchFolder: NombreArchivoIgualdadCarpetaParaXMLS,
            archivosJson,
        });

    } catch (error) {
        console.error('Error al generar o almacenar el archivo ZIP:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno al generar el archivo ZIP');
        }
    }
});

/**
 * Todo en uno: escribe JSON separado EPS vs PARTICULAR (carpetas distintas).
 * Body: { eps: [], particulares: [] } (también acepta array legacy = solo EPS).
 * Nombres de archivo: Prefijo + folio sin ceros (alineado a XML).
 */
router.post('/generar-zip-todo-en-uno/:fechaInicio/:fechaFin', async (req, res) => {
    const fechaInicio = new Date(req.params.fechaInicio).toISOString().split('T')[0];
    const fechaFin = new Date(req.params.fechaFin).toISOString().split('T')[0];

    let dataEps = [];
    let dataPart = [];
    if (Array.isArray(req.body)) {
        dataEps = req.body;
    } else if (req.body && typeof req.body === 'object') {
        dataEps = Array.isArray(req.body.eps) ? req.body.eps : [];
        dataPart = Array.isArray(req.body.particulares) ? req.body.particulares : [];
    }

    const extractPrefijo = (numFactura) => {
        if (numFactura == null || numFactura === 'SinFactura') return null;
        const m = String(numFactura).match(/^([A-Za-z]+)/);
        return m ? m[1] : null;
    };

    const normalizeClave = (numFactura) => {
        if (numFactura == null) return 'SinFactura';
        const s = String(numFactura);
        if (s === 'SinFactura' || s.startsWith('SinFactura')) return s;
        const m = s.match(/^([A-Za-z]+)0*(\d+)$/);
        if (m) return `${m[1]}${parseInt(m[2], 10)}`;
        return s;
    };

    const batchFolderOf = (prefijo, tipo) => `${prefijo || 'SIN'} --- ${tipo} --- ${fechaInicio} --- ${fechaFin}`;

    const agrupar = (data) => {
        const byPrefijo = {};
        const sinFacturaFiles = [];
        const facturasAgrupadas = data.reduce((acc, consulta) => {
            const raw = consulta.numFactura || 'SinFactura';
            const key = raw === 'SinFactura' || String(raw).startsWith('SinFactura')
                ? `SinFactura:${(consulta.usuarios && consulta.usuarios[0] && consulta.usuarios[0].numDocumentoIdentificacion) || Math.random()}`
                : normalizeClave(raw);
            if (!acc[key]) acc[key] = [];
            acc[key].push(consulta);
            return acc;
        }, {});

        for (const [key, consultas] of Object.entries(facturasAgrupadas)) {
            if (key.startsWith('SinFactura')) {
                const consulta = consultas[0];
                const docs = consulta.usuarios
                    ? consulta.usuarios.map((u) => u.numDocumentoIdentificacion)
                    : ['unknown'];
                docs.forEach((documento) => {
                    sinFacturaFiles.push({
                        nombre: `SinFactura_${documento}.json`,
                        contenido: JSON.stringify(consulta, null, 2),
                    });
                });
                continue;
            }
            const prefijo = extractPrefijo(consultas[0].numFactura) || extractPrefijo(key) || 'SIN';
            const clave = normalizeClave(consultas[0].numFactura || key);
            if (!byPrefijo[prefijo]) byPrefijo[prefijo] = [];
            byPrefijo[prefijo].push({
                clave,
                contenido: JSON.stringify(consultas[0], null, 2),
            });
        }
        return { byPrefijo, sinFacturaFiles };
    };

    const escribirTipo = async (tipo, data) => {
        const { byPrefijo, sinFacturaFiles } = agrupar(data);
        const batchFolders = [];
        const archivosJson = [];

        for (const [prefijo, files] of Object.entries(byPrefijo)) {
            const batchFolder = batchFolderOf(prefijo, tipo);
            batchFolders.push(batchFolder);

            const rutaJsonDir = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS_JSON', batchFolder);
            fs.mkdirSync(rutaJsonDir, { recursive: true });

            const zip = new JSZip();
            for (const f of files) {
                const nombre = `${f.clave}.json`;
                zip.file(nombre, f.contenido);
                fs.writeFileSync(path.join(rutaJsonDir, nombre), f.contenido, 'utf8');
                archivosJson.push({ batchFolder, tipo, nombre });
            }

            const zipPath = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS', `${batchFolder}.zip`);
            const content = await zip.generateAsync({ type: 'nodebuffer' });
            fs.writeFileSync(zipPath, content);
        }

        // SinFactura solo aplica a PARTICULAR (pacientes sin factura)
        if (tipo === 'PARTICULAR' && sinFacturaFiles.length) {
            const targets = batchFolders.length ? batchFolders : [batchFolderOf('SIN', 'PARTICULAR')];
            for (const batchFolder of targets) {
                const rutaJsonDir = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS_JSON', batchFolder);
                fs.mkdirSync(rutaJsonDir, { recursive: true });
                for (const f of sinFacturaFiles) {
                    fs.writeFileSync(path.join(rutaJsonDir, f.nombre), f.contenido, 'utf8');
                    archivosJson.push({ batchFolder, tipo, nombre: f.nombre });
                }
            }
            if (!batchFolders.length) batchFolders.push(batchFolderOf('SIN', 'PARTICULAR'));
        }

        return { batchFolders, archivosJson };
    };

    try {
        const outEps = await escribirTipo('EPS', dataEps);
        const outPart = await escribirTipo('PARTICULAR', dataPart);
        const batchFolders = [...outEps.batchFolders, ...outPart.batchFolders];
        const archivosJson = [...outEps.archivosJson, ...outPart.archivosJson];

        res.json({
            mensaje: 'JSON todo-en-uno generado por prefijo y tipo (EPS / PARTICULAR)',
            batchFolders,
            batchFoldersEps: outEps.batchFolders,
            batchFoldersParticular: outPart.batchFolders,
            archivosJson,
            conteoArchivos: archivosJson.length,
            conteoEps: dataEps.length,
            conteoParticulares: dataPart.length,
        });
    } catch (error) {
        console.error('Error generar-zip-todo-en-uno:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno al generar JSON todo-en-uno');
        }
    }
});

/**
 * Empaqueta lotes JSON + XML desde XMLS/{documentoEmpresa}/ y reporta estado por factura.
 * Body: { facturas, xmlError, jsonError, batchFolders?, documentoEmpresa }
 */
router.post('/cerrar-todo-en-uno/:fechaInicio/:fechaFin', async (req, res) => {
    const fechaInicio = new Date(req.params.fechaInicio).toISOString().split('T')[0];
    const fechaFin = new Date(req.params.fechaFin).toISOString().split('T')[0];
    const suffix = ` --- ${fechaInicio} --- ${fechaFin}`;
    const documentoEmpresa = String(req.body?.documentoEmpresa || req.body?.documentoempresa || '').trim();
    const facturasXml = Array.isArray(req.body?.facturas) ? req.body.facturas : [];
    const jsonErrorGlobal = typeof req.body?.jsonError === 'string' ? req.body.jsonError : null;
    const xmlErrorGlobal = typeof req.body?.xmlError === 'string' ? req.body.xmlError : null;

    const safeList = (dir, ext) => {
        try {
            if (!fs.existsSync(dir)) return [];
            return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(ext));
        } catch (_) {
            return [];
        }
    };

    const discoverBatchFolders = () => {
        const set = new Set();
        if (Array.isArray(req.body?.batchFolders)) {
            req.body.batchFolders.filter(Boolean).forEach((b) => set.add(b));
        }
        for (const f of facturasXml) {
            if (f.batchFolder) set.add(f.batchFolder);
            if (Array.isArray(f.batchFolders)) f.batchFolders.forEach((b) => set.add(b));
            const pref = f.Prefijo || f.prefijo;
            if (pref) {
                set.add(`${pref} --- EPS${suffix}`);
                set.add(`${pref} --- PARTICULAR${suffix}`);
            }
        }
        // Solo JSON por lote (XML ya no vive en carpetas de rango)
        const root = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS_JSON');
        try {
            if (fs.existsSync(root)) {
                for (const name of fs.readdirSync(root)) {
                    const full = path.join(root, name);
                    if (fs.statSync(full).isDirectory() && name.endsWith(suffix)) {
                        set.add(name);
                    }
                }
            }
        } catch (_) { /* ignore */ }
        return [...set];
    };

    const batchFolders = discoverBatchFolders();
    const claveFromFactura = (f) => {
        const prefijo = f.Prefijo || f.prefijo || '';
        const no = f.NoFactura != null ? f.NoFactura : (f.factura != null ? f.factura : '');
        const n = parseInt(String(no), 10);
        if (prefijo && !Number.isNaN(n)) return `${prefijo}${n}`;
        if (prefijo && no !== '') return `${prefijo}${no}`;
        return String(no || '');
    };

    const rowsByClave = new Map();
    const upsert = (clave, patch) => {
        if (!clave) return;
        const prev = rowsByClave.get(clave) || {
            clave,
            NoFactura: '',
            Prefijo: '',
            FechaFactura: '',
            batchFolder: '',
            estadoXml: 'Sin XML',
            rutaXml: '',
            estadoJson: 'Sin JSON',
            rutaJson: '',
            estadoEmpaquetado: 'No juntado',
            rutaEmpaquetado: '',
            detalle: '',
        };
        rowsByClave.set(clave, { ...prev, ...patch });
    };

    for (const f of facturasXml) {
        const clave = claveFromFactura(f);
        const estadoXmlRaw = f.estado || f.Estado || xmlErrorGlobal || 'Desconocido';
        const xmlOk = /exitos|ya existe/i.test(String(estadoXmlRaw));
        const rutaXmlEmpresa = documentoEmpresa
            ? rutaXmlEmpresaPorClave(RIPS_ROOT, documentoEmpresa, clave)
            : null;
        upsert(clave, {
            NoFactura: String(f.NoFactura != null ? f.NoFactura : (f.factura || '')),
            Prefijo: f.Prefijo || f.prefijo || '',
            FechaFactura: f.FechaFactura || f.fechaFactura || '',
            batchFolder: f.batchFolder || (f.Prefijo ? `${f.Prefijo}${suffix}` : ''),
            estadoXml: estadoXmlRaw,
            rutaXml: f.filePath || rutaXmlEmpresa || '',
            detalle: xmlOk ? '' : String(estadoXmlRaw),
        });
    }

    let empaquetadoError = null;

    for (const batchFolder of batchFolders) {
        const rutaJson = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS_JSON', batchFolder);
        const rutaReporte = path.join(RIPS_ROOT, 'ARCHIVOS_DE_ENVIO', `REPORTE (${batchFolder})`);
        const rutaConFactura = path.join(rutaReporte, 'CON_FACTURA');
        const jsonFiles = safeList(rutaJson, '.json');

        try {
            if (fs.existsSync(rutaJson)) {
                fs.mkdirSync(rutaConFactura, { recursive: true });
                fs.mkdirSync(path.join(rutaReporte, 'SIN_FACTURA'), { recursive: true });

                for (const jf of jsonFiles) {
                    if (jf.includes('SinFactura_')) {
                        const nombreSub = jf.replace(/\.json$/i, '');
                        const dest = path.join(rutaReporte, 'SIN_FACTURA', nombreSub);
                        fs.mkdirSync(dest, { recursive: true });
                        fs.copyFileSync(path.join(rutaJson, jf), path.join(dest, jf));
                        continue;
                    }

                    const clave = path.basename(jf, '.json');
                    const xmlPath = documentoEmpresa
                        ? rutaXmlEmpresaPorClave(RIPS_ROOT, documentoEmpresa, clave)
                        : null;
                    if (!xmlPath) continue;

                    const destDir = path.join(rutaConFactura, clave);
                    fs.mkdirSync(destDir, { recursive: true });
                    fs.copyFileSync(path.join(rutaJson, jf), path.join(destDir, jf));
                    fs.copyFileSync(xmlPath, path.join(destDir, `${clave}.xml`));
                }
            }
        } catch (err) {
            console.error('Error empaquetando batch', batchFolder, err);
            empaquetadoError = [empaquetadoError, `${batchFolder}: ${err.message || err}`].filter(Boolean).join(' | ');
        }

        // Marcar JSON del lote en filas
        for (const jf of jsonFiles) {
            if (jf.includes('SinFactura_')) continue;
            const clave = path.basename(jf, '.json');
            const xmlPath = documentoEmpresa
                ? rutaXmlEmpresaPorClave(RIPS_ROOT, documentoEmpresa, clave)
                : null;
            if (rowsByClave.has(clave)) {
                const row = rowsByClave.get(clave);
                if (!Array.isArray(row.batchFoldersSeen)) row.batchFoldersSeen = [];
                if (!row.batchFoldersSeen.includes(batchFolder)) row.batchFoldersSeen.push(batchFolder);
                if (xmlPath) {
                    row.rutaXml = row.rutaXml || xmlPath;
                    if (/sin xml/i.test(row.estadoXml)) row.estadoXml = 'XML en carpeta empresa';
                }
            } else {
                const m = clave.match(/^([A-Za-z]+)(\d+)$/);
                upsert(clave, {
                    NoFactura: m ? m[2] : clave,
                    Prefijo: m ? m[1] : '',
                    batchFolder,
                    batchFoldersSeen: [batchFolder],
                    estadoXml: xmlPath ? 'XML en carpeta empresa' : 'Sin XML',
                    rutaXml: xmlPath || '',
                    estadoJson: 'JSON generado',
                    rutaJson: path.join(rutaJson, jf),
                });
            }
        }
    }

    // Indexar XML presentes en carpeta empresa (aunque no hayan venido en facturasXml)
    if (documentoEmpresa) {
        const dirEmp = rutaDirEmpresa(RIPS_ROOT, documentoEmpresa);
        for (const xf of safeList(dirEmp, '.xml')) {
            const clave = path.basename(xf, '.xml');
            const full = path.join(dirEmp, xf);
            if (rowsByClave.has(clave)) {
                const row = rowsByClave.get(clave);
                if (!row.rutaXml) row.rutaXml = full;
                if (/sin xml/i.test(row.estadoXml)) row.estadoXml = 'XML en carpeta empresa';
            }
        }
    }

    // Reconciliar: mirar EPS y PARTICULAR (JSON) + XML en carpeta empresa
    const tipoDeCarpeta = (bf) => {
        if (String(bf).includes(' --- PARTICULAR --- ')) return 'PARTICULAR';
        if (String(bf).includes(' --- EPS --- ')) return 'EPS';
        return '';
    };

    for (const [clave, row] of rowsByClave.entries()) {
        const pref = row.Prefijo || '';
        const carpetasRelevantes = batchFolders.filter((bf) => {
            if (Array.isArray(row.batchFoldersSeen) && row.batchFoldersSeen.includes(bf)) return true;
            if (pref && bf.startsWith(`${pref} ---`)) return true;
            return false;
        });

        let mejorJson = null;
        let mejorEnvio = null;
        const tiposJson = [];
        const tiposEnvio = [];

        const xmlEmpresa = documentoEmpresa
            ? rutaXmlEmpresaPorClave(RIPS_ROOT, documentoEmpresa, clave)
            : (row.rutaXml && fs.existsSync(row.rutaXml) ? row.rutaXml : null);
        if (xmlEmpresa) {
            row.rutaXml = xmlEmpresa;
            if (/sin xml|desconocido/i.test(row.estadoXml || '')) {
                row.estadoXml = 'XML en carpeta empresa';
            }
        }

        for (const bf of carpetasRelevantes) {
            const rutaJsonDir = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS_JSON', bf);
            const jsonFilesDir = safeList(rutaJsonDir, '.json');
            const fuzzy = jsonFilesDir.find((j) => path.basename(j, '.json') === clave)
                || jsonFilesDir.find((j) => {
                    const jb = path.basename(j, '.json');
                    return jb.includes(clave) || clave.includes(jb);
                });
            if (fuzzy) {
                mejorJson = path.join(rutaJsonDir, fuzzy);
                const t = tipoDeCarpeta(bf);
                if (t && !tiposJson.includes(t)) tiposJson.push(t);
            }

            const destDir = path.join(RIPS_ROOT, 'ARCHIVOS_DE_ENVIO', `REPORTE (${bf})`, 'CON_FACTURA', clave);
            if (fs.existsSync(destDir)) {
                const files = fs.readdirSync(destDir);
                const hasXml = files.some((x) => x.toLowerCase().endsWith('.xml'));
                const hasJson = files.some((x) => x.toLowerCase().endsWith('.json'));
                if (hasXml && hasJson) {
                    mejorEnvio = destDir;
                    const t = tipoDeCarpeta(bf);
                    if (t && !tiposEnvio.includes(t)) tiposEnvio.push(t);
                }
            }
        }

        if (jsonErrorGlobal && !mejorJson) {
            row.estadoJson = `Error: ${jsonErrorGlobal}`;
            row.detalle = [row.detalle, `JSON: ${jsonErrorGlobal}`].filter(Boolean).join(' | ');
        } else if (mejorJson) {
            row.estadoJson = tiposJson.length
                ? `JSON generado (${tiposJson.join(' + ')})`
                : 'JSON generado';
            row.rutaJson = mejorJson;
            row.detalle = String(row.detalle || '')
                .split(' | ')
                .filter((part) => part && !/no se encontró json/i.test(part))
                .join(' | ');
        } else {
            row.estadoJson = 'Sin JSON';
            if (!/no se encontró json/i.test(row.detalle || '')) {
                row.detalle = [row.detalle, 'No se encontró JSON para esta factura'].filter(Boolean).join(' | ');
            }
        }

        if (mejorEnvio) {
            row.estadoEmpaquetado = tiposEnvio.length
                ? `Juntado OK (${tiposEnvio.join(' + ')})`
                : 'Juntado OK';
            row.rutaEmpaquetado = mejorEnvio;
            row.detalle = String(row.detalle || '')
                .split(' | ')
                .filter((part) => part && !/no se empaquetaron|envío incompleta/i.test(part))
                .join(' | ');
        } else if (empaquetadoError) {
            row.estadoEmpaquetado = `Error: ${empaquetadoError}`;
        } else if (/json generado/i.test(row.estadoJson) && /exitos|ya existe|en carpeta/i.test(row.estadoXml)) {
            row.estadoEmpaquetado = 'No juntado';
            if (!/no se empaquetaron/i.test(row.detalle || '')) {
                row.detalle = [row.detalle, 'XML y JSON existen pero no se empaquetaron'].filter(Boolean).join(' | ');
            }
        } else {
            row.estadoEmpaquetado = 'No juntado';
        }

        if (row.batchFoldersSeen && row.batchFoldersSeen.length) {
            row.batchFolder = row.batchFoldersSeen.join(', ');
        }
    }

    for (const batchFolder of batchFolders) {
        const rutaJsonDir = path.join(RIPS_ROOT, 'ARCHIVOS_RIPS_JSON', batchFolder);
        const jsonFilesDir = safeList(rutaJsonDir, '.json');
        for (const jf of jsonFilesDir) {
            if (jf.includes('SinFactura_')) continue;
            const clave = path.basename(jf, '.json');
            const already = [...rowsByClave.keys()].some((k) => k === clave || k.includes(clave) || clave.includes(k));
            if (already) continue;
            const tipo = tipoDeCarpeta(batchFolder);
            const xmlPath = documentoEmpresa
                ? rutaXmlEmpresaPorClave(RIPS_ROOT, documentoEmpresa, clave)
                : null;
            upsert(clave, {
                NoFactura: clave,
                batchFolder,
                estadoXml: xmlPath ? 'XML en carpeta empresa' : 'Sin XML',
                rutaXml: xmlPath || '',
                estadoJson: tipo ? `JSON generado (${tipo})` : 'JSON generado',
                rutaJson: path.join(rutaJsonDir, jf),
                estadoEmpaquetado: 'No juntado',
                detalle: 'JSON sin fila XML previa',
            });
        }
    }

    const items = [...rowsByClave.values()].sort((a, b) =>
        String(a.NoFactura).localeCompare(String(b.NoFactura), undefined, { numeric: true })
    );

    const resumen = {
        total: items.length,
        xmlOk: items.filter((i) => /exitos|ya existe|en carpeta/i.test(i.estadoXml)).length,
        jsonOk: items.filter((i) => /json generado/i.test(i.estadoJson)).length,
        empaquetadoOk: items.filter((i) => /juntado ok/i.test(i.estadoEmpaquetado)).length,
        conError: items.filter((i) => i.detalle).length,
    };

    res.json({
        message: 'Estado del proceso todo en uno',
        batchFolders,
        batchFolder: batchFolders.join(', '),
        documentoEmpresa,
        resumen,
        items,
        xmlErrorGlobal,
        jsonErrorGlobal,
        empaquetadoError,
    });
});


module.exports = router;

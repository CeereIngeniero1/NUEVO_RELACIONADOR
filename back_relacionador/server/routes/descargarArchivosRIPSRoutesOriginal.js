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


const router = Router();

// Endpoint para obtener datos de usuarios RIPS

router.get('/usuarios/rips/:fechaInicio/:fechaFin/:ResolucionesRips/:documentoEmpresaSeleccionada', async (req, res) => {
   
    const fechaInicio = new Date(req.params.fechaInicio).toISOString().split('T')[0];
    const fechaFin = new Date(req.params.fechaFin).toISOString().split('T')[0];
    const ResolucionesRips = req.params.ResolucionesRips;
    const documentoEmpresaSeleccionada = req.params.documentoEmpresaSeleccionada;

    const request = new Request(
        `SELECT  
em.NroIDPrestador, EmpV.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] AS [numFactura], 
-- CASE WHEN  fc.[No Factura] = '0000000' THEN '111111' ELSE NULL END AS [numNota],
--CASE WHEN  fc.[No Factura] = '0000000' THEN everips.ConsecutivoRipsFacturaEnCero ELSE NULL END AS [numNota],
CASE WHEN  fc.[No Factura] = '0000000' THEN 'CLINI' + CONVERT(NVARCHAR, everips.[Id Evaluación Entidad Rips], 1) ELSE NULL END AS [numNota],
CASE WHEN  fc.[No Factura] = '0000000' THEN 'RS' ELSE NULL END [tipoNota], tpd.[Tipo de Documento] as [tipoDocumentoIdentificacion],
        en.[Documento Entidad] as [numDocumentoIdentificacion], '0' + tpe.[Tipo Entidad] as [tipoUsuario],
        CONVERT(VARCHAR, en3.[Fecha Nacimiento EntidadIII], 23) AS [fechaNacimiento], Sexo.[Sexo] AS [codSexo], 
        País.País AS [codPaisResidencia], Dep.[Código Departamento] +  Ciu.[Código Ciudad] AS [codMunicipioResidencia], 
		CASE WHEN zr.[Código Zona Residencia]  IS NULL THEN '02' ELSE  '0' + zr.[Código Zona Residencia] END AS  [codZonaTerritorialResidencia], 
		'NO' AS incapacidad,

        --DENSE_RANK() OVER (ORDER BY en.[Documento Entidad] DESC) 
        --CAST(DENSE_RANK() OVER (ORDER BY en.[Documento Entidad] DESC) AS INT)
        1 AS consecutivo, pais2.País AS [codPaisOrigen], eve.[Id Evaluación Entidad], everips.[Id Tipo de Rips], 
		CASE
			WHEN fc.[Documento Responsable] in (select [Documento Entidad] from [Función Por Entidad] where [Id Función] in ( select [Id Función] from Función where Función like ('%eps%' ) or Función like ('%prepa%') )) 
				THEN 1 
			ELSE 0
		END AS 'Prepagada'

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
        AND FC.[Documento Empresa] = @documentoEmpresaSeleccionada
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
        const idTipoRips = columns[16].value;

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
            numDocumentoIdentificacion: columns[5].value,
            tipoUsuario: columns[6].value,
            fechaNacimiento: columns[7].value,
            codSexo: columns[8].value,
            codPaisResidencia: columns[9].value,
            codMunicipioResidencia: columns[10].value,
            codZonaTerritorialResidencia: columns[11].value,
            incapacidad: columns[12].value,
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

        facturasOriginales.push({ originalNumFactura, idTipoRips });
    });

    request.on('requestCompleted', async () => {
        for (let factura in resultados) {
            const consulta = resultados[factura];
    
            // Buscar la factura en facturasOriginales
            const facturaData = facturasOriginales.find(f => `null_${f.originalNumFactura}_${consulta.usuarios[0].numDocumentoIdentificacion}` === factura || f.originalNumFactura === factura);
    
            if (facturaData) {
                const { originalNumFactura, idTipoRips } = facturaData;
    
                for (const usuario of consulta.usuarios) {
                    try {
                        const consultasResponse = await fetch(`http://localhost:3000/RIPS/servicios/rips/${originalNumFactura}/${usuario.numDocumentoIdentificacion}/${fechaInicio}/${fechaFin}/${ResolucionesRips}`);
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
                        const procedimientosResponse = await fetch(`http://localhost:3000/RIPS/serviciosAP/rips/${originalNumFactura}/${usuario.numDocumentoIdentificacion}/${fechaInicio}/${fechaFin}/${ResolucionesRips}`);
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


router.get('/usuarios/ripsEps/:fechaInicio/:fechaFin/:ResolucionesRips/:documentoEmpresaSeleccionada', async (req, res) => {
    console.log ("Bro si estoy entrando sisabe ripsEPS");
    const fechaInicio = new Date(req.params.fechaInicio).toISOString().split('T')[0];
    const fechaFin = new Date(req.params.fechaFin).toISOString().split('T')[0];
    const ResolucionesRips = req.params.ResolucionesRips;
    const documentoEmpresaSeleccionada = req.params.documentoEmpresaSeleccionada;

    const request = new Request(
        `SELECT 
    em.NroIDPrestador, 
    EmpV.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] AS [numFactura], 
    NULL AS [numNota], 
    NULL AS [tipoNota], 
    tpd.[Tipo de Documento] AS [tipoDocumentoIdentificacion],
    en.[Documento Entidad] AS [numDocumentoIdentificacion], 
    '0' + tpe.[Tipo Entidad] AS [tipoUsuario],
    CONVERT(VARCHAR, en3.[Fecha Nacimiento EntidadIII], 23) AS [fechaNacimiento], 
    Sexo.[Sexo] AS [codSexo], 
    País.País AS [codPaisResidencia], 
    Depart.[Código Departamento] +  Ciu.[Código Ciudad] AS [codMunicipioResidencia], 
    CASE WHEN zr.[Código Zona Residencia]  IS NULL THEN '02' ELSE  '0' + zr.[Código Zona Residencia] END AS  [codZonaTerritorialResidencia],  
    'NO' AS [incapacidad],
    DENSE_RANK() OVER (ORDER BY en.[Documento Entidad]) AS [consecutivo],
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
    END AS [Prepagada]
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
        CONVERT(DATE, eve.[Fecha Evaluación Entidad], 23) BETWEEN @fechaInicio AND @fechaFin
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
        const idTipoRips = columns[16].value;

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
            numDocumentoIdentificacion: columns[5].value,
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

        facturasOriginales.push({ originalNumFactura, idTipoRips });
    });

    request.on('requestCompleted', async () => {
        for (let factura in resultados) {
            const consulta = resultados[factura];
    
            // Buscar la factura en facturasOriginales
            const facturaData = facturasOriginales.find(f => `null_${f.originalNumFactura}_${consulta.usuarios[0].numDocumentoIdentificacion}` === factura || f.originalNumFactura === factura);
    
            if (facturaData) {
                const { originalNumFactura, idTipoRips } = facturaData;
    
                for (const usuario of consulta.usuarios) {
                    try {
                        const consultasResponse = await fetch(`http://localhost:3000/RIPS/servicios/ripsEPSAC/${originalNumFactura}/${usuario.numDocumentoIdentificacion}/${fechaInicio}/${fechaFin}/${ResolucionesRips}`);
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
                        const procedimientosResponse = await fetch(`http://localhost:3000/RIPS/servicios/ripsEPSAP/${originalNumFactura}/${usuario.numDocumentoIdentificacion}/${fechaInicio}/${fechaFin}/${ResolucionesRips}`);
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


router.get('/servicios/rips/:numFactura/:numDocumentoIdentificacion/:fechaInicio/:fechaFin/:ResolucionesRips', (req, res) => {
    const numFactura = req.params.numFactura;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    const ResolucionesRips = req.params.ResolucionesRips;

    // console.log(`En AC el num factura es: ${numFactura}`)

    const request = new Request(
        `
        SELECT    
        em2.[Código Empresa] AS codPrestador, 
        --SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura] , 120), 1, 16) AS fechaInicioAtencion, 

        CASE WHEN SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura] , 120), 1, 16) IS NULL THEN SUBSTRING(CONVERT(VARCHAR, EVE.[Fecha Evaluación Entidad] , 120), 1, 16)
        ELSE SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura] , 120), 1, 16) END  AS fechaInicioAtencion, 
        
        NULL AS numAutorizacion, everips.[Codigo RIPS] AS codConsulta,
        '01' AS modalidadGrupoServicioTecSal, '01' AS grupoServicios, Serv.[Código Servicios] AS codServicio,
        everips.[Id Finalidad Consulta] AS finalidadTecnologiaSalud, CASE WHEN CAU.Codigo IS NULL THEN 38 ELSE Cau.Codigo END AS causaMotivoAtencion,
        everips.[Diagnostico Rips] AS codDiagnosticoPrincipal, 
        Null  AS codDiagnosticoRelacionado1, 
        --CASE WHEN everips.[Diagnostico Rips2] = NULL THEN NULL ELSE everips.[Diagnostico Rips2] END AS codDiagnosticoRelacionado1, 
        NULL AS codDiagnosticoRelacionado2, NULL AS codDiagnosticoRelacionado3, 
        --tdp.[Código Tipo de Diagnóstico Principal] AS tipoDiagnosticoPrincipal,
		Case when tdp.[Código Tipo de Diagnóstico Principal] IS NULL THEN '02' ELSE tdp.[Código Tipo de Diagnóstico Principal] END AS tipoDiagnosticoPrincipal,


        tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, eve.[Documento Profesional] AS numDocumentoIdentificacion, 
        fc.[Total Factura] AS vrServicio, '05' AS tipoPagoModerador, '0' AS valorPagoModerador, 
        NULL  AS numFEVPagoModerador, 
        -- ROW_NUMBER() OVER (ORDER BY everips.[Id Evaluación Entidad RIPS]) 
        1 AS consecutivo

        FROM [Evaluación Entidad] as eve

        INNER JOIN [Evaluación Entidad Rips] as everips ON eve.[Id Evaluación Entidad] = everips.[Id Evaluación Entidad]
        LEFT JOIN Entidad ON eve.[Documento Entidad] = Entidad.[Documento Entidad]
        LEFT JOIN [Tipo de Documento] as tp ON Entidad.[Id Tipo de Documento] = tp.[Id Tipo de Documento]
        LEFT JOIN Factura as fc ON everips.[Id Factura] = fc.[Id Factura]
		LEFT JOIN Empresa ON fc.[Documento Empresa] = Empresa.[Documento Empresa]
		LEFT JOIN Empresa as em2 ON eve.[Documento Empresa] = em2.[Documento Empresa]
        INNER JOIN EmpresaV as EmpV ON Empresa.[Documento Empresa] = EmpV.[Documento Empresa]
        LEFT JOIN [Tipo de Diagnóstico Principal] as tdp ON everips.[Id Tipo de Diagnóstico Principal] = tdp.[Id Tipo de Diagnóstico Principal]
		LEFT JOIN [RIPS Causa Externa Version2] as Cau on Cau.[Id RIPS Causa Externa Version2] = everips.[Id Causa Externa]

		INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eve.[Documento Profesional]
		left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 

		left join [RIPS Servicios] AS Serv ON serv.[Id Servicios]  = everips.[Id Servicios] 
        
        WHERE everips.[Id Acto Quirúrgico] = 1 
        AND EmpV.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] = @numFactura
        AND eve.[Documento Entidad] = @numDocumentoIdentificacion
        AND CONVERT(DATE, eve.[Fecha Evaluación Entidad]) BETWEEN @fechaInicio AND @fechaFin
        AND EmpV.[Resolución Facturación EmpresaV] = @ResolucionesRips

        `,
        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('numFactura', TYPES.VarChar, numFactura);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);
    request.addParameter('fechaInicio', TYPES.Date, fechaInicio);
    request.addParameter('fechaFin', TYPES.Date, fechaFin);
    request.addParameter('ResolucionesRips', TYPES.VarChar, ResolucionesRips);
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
            finalidadTecnologiaSalud: columns[7].value.toString() ,
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
            consecutivo: 1,
            // consecutivo: 6,
            // consecutivo: parseInt(columns[20].value, 10) // Convertir a entero
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

router.get('/servicios/ripsEPSAC/:numFactura/:numDocumentoIdentificacion/:fechaInicio/:fechaFin/:ResolucionesRips', (req, res) => {
     
    const numFactura = req.params.numFactura;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    const ResolucionesRips = req.params.ResolucionesRips; 

    const request = new Request(
        `
        SELECT em2.[Código Empresa] AS codPrestador, 
        --SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura] , 120), 1, 16) AS fechaInicioAtencion, 

        CASE WHEN SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura] , 120), 1, 16) IS NULL THEN SUBSTRING(CONVERT(VARCHAR, EVE.[Fecha Evaluación Entidad] , 120), 1, 16)
        ELSE SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura] , 120), 1, 16) END  AS fechaInicioAtencion, 

        NULL AS numAutorizacion, everips.[Codigo RIPS] AS codConsulta,
        '01' AS modalidadGrupoServicioTecSal, '01' AS grupoServicios, Serv.[Código Servicios] AS codServicio,
        everips.[Id Finalidad Consulta] AS finalidadTecnologiaSalud, CASE WHEN CAU.Codigo IS NULL THEN 38 ELSE Cau.Codigo END AS causaMotivoAtencion,
        everips.[Diagnostico Rips] AS codDiagnosticoPrincipal, 
        Null  AS codDiagnosticoRelacionado1, 
        --CASE WHEN everips.[Diagnostico Rips2] = NULL THEN NULL ELSE everips.[Diagnostico Rips2] END AS codDiagnosticoRelacionado1,  
        NULL AS codDiagnosticoRelacionado2, NULL AS codDiagnosticoRelacionado3, 
        --tdp.[Código Tipo de Diagnóstico Principal] AS tipoDiagnosticoPrincipal,
		Case when tdp.[Código Tipo de Diagnóstico Principal] IS NULL THEN '02' ELSE tdp.[Código Tipo de Diagnóstico Principal] END AS tipoDiagnosticoPrincipal,
        tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, eve.[Documento Profesional] AS numDocumentoIdentificacion, 
        PT.[Valor Plan de Tratamiento Items] AS vrServicio, '05' AS tipoPagoModerador, '0' AS valorPagoModerador, 
        NULL  AS numFEVPagoModerador, ROW_NUMBER() OVER (ORDER BY everips.[Id Evaluación Entidad RIPS]) AS consecutivo

        FROM [Evaluación Entidad] as eve

        INNER JOIN [Evaluación Entidad Rips] as everips ON eve.[Id Evaluación Entidad] = everips.[Id Evaluación Entidad]
        LEFT JOIN Entidad ON eve.[Documento Entidad] = Entidad.[Documento Entidad]
        LEFT JOIN [Tipo de Documento] as tp ON Entidad.[Id Tipo de Documento] = tp.[Id Tipo de Documento]
        LEFT JOIN Factura as fc ON everips.[Id Factura] = fc.[Id Factura]
		LEFT JOIN Empresa ON fc.[Documento Empresa] = Empresa.[Documento Empresa]
		LEFT JOIN Empresa as em2 ON eve.[Documento Empresa] = em2.[Documento Empresa]
        INNER JOIN EmpresaV as EmpV ON fc.[Documento Empresa] = EmpV.[Documento Empresa]
        LEFT JOIN [Tipo de Diagnóstico Principal] as tdp ON everips.[Id Tipo de Diagnóstico Principal] = tdp.[Id Tipo de Diagnóstico Principal]
		LEFT JOIN FacturaII FII ON FII.[Id Factura] = FC.[Id Factura] 
		left join [Plan de Tratamiento Items] PT ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento]
		left join [Plan de Tratamiento] Tr ON Tr.[Id Plan de Tratamiento] = fii.[Id Plan de Tratamiento]
		left join [RIPS Servicios] AS Serv ON serv.[Id Servicios]  = everips.[Id Servicios]
        LEFT JOIN [RIPS Causa Externa Version2] as Cau on Cau.[Id RIPS Causa Externa Version2] = everips.[Id Causa Externa]
        
        INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eve.[Documento Profesional]
		left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 
        
        WHERE everips.[Id Acto Quirúrgico] = 1 
        AND EmpV.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] = @numFactura
        AND eve.[Documento Entidad] = @numDocumentoIdentificacion
        AND CONVERT(DATE, eve.[Fecha Evaluación Entidad]) BETWEEN @fechaInicio AND @fechaFin
        AND EmpV.[Resolución Facturación EmpresaV] = @ResolucionesRips
        AND Tr.[Documento Paciente] = eve.[Documento Entidad]

        `,
        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('numFactura', TYPES.VarChar, numFactura);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);
    request.addParameter('fechaInicio', TYPES.Date, fechaInicio);
    request.addParameter('fechaFin', TYPES.Date, fechaFin);
    request.addParameter('ResolucionesRips', TYPES.VarChar, ResolucionesRips);
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
            finalidadTecnologiaSalud: columns[7].value.toString() ,
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
        console.log('Resultados de servicios:', resultadosServicios);
        res.json(resultadosServicios);
    });

    // Añade este bloque para verificar si hay errores en la ejecución de la consulta de servicios
    request.on('error', (err) => {
        console.error('Error en la consulta de servicios:', err);
        res.status(500).send('Error interno del servidor');
    });
    
    connection.execSql(request);
});

router.get('/serviciosAP/rips/:numFactura/:numDocumentoIdentificacion/:fechaInicio/:fechaFin/:ResolucionesRips', (req, res) => {
    const numFactura = req.params.numFactura;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    const ResolucionesRips = req.params.ResolucionesRips


    const request = new Request(
        `SELECT em2.[Código Empresa] AS codPrestador, 
        --SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura], 120), 1, 16) AS fechaInicioAtencion,
        CASE WHEN  SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura], 120), 1, 16) IS NULL THEN  SUBSTRING(CONVERT(VARCHAR, EVE.[Fecha Evaluación Entidad], 120), 1, 16)
        ELSE  SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura], 120), 1, 16) END  AS fechaInicioAtencion, 
        NULL AS idMIPRES, NULL AS numAutorizacion, 
        everips.[Codigo RIPS] AS codProcedimiento, '01' AS viaIngresoServicioSalud, '01' AS modalidadGrupoServicioTecSal, 
        '01' AS grupoServicios, '371' AS codServicio, 
		--fp.Codigo AS finalidadTecnologiaSalud, 
		CASE WHEN fp.Codigo IS NULL THEN '44' ELSE fp.Codigo END AS finalidadTecnologiaSalud, 

        tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, eve.[Documento Profesional] AS numDocumentoIdentificacion, 
        everips.[Diagnostico Rips] AS codDiagnosticoPrincipal, 

        NULL   AS codDiagnosticoRelacionado, 
        --CASE WHEN everips.[Diagnostico Rips2] = NULL THEN NULL ELSE everips.[Diagnostico Rips2] END AS codDiagnosticoRelacionado, 
        NULL AS codComplicacion, fc.[Total Factura] AS vrServicio, '05' AS tipoPagoModerador, 
        '0' AS valorPagoModerador, NULL AS numFEVPagoModerador,  ROW_NUMBER() OVER (ORDER BY everips.[Id Evaluación Entidad RIPS]) AS consecutivo, eve.[Id Evaluación Entidad]

        FROM  [Evaluación Entidad Rips] as everips
        
        INNER JOIN [Evaluación Entidad] as eve ON everips.[Id Evaluación Entidad] = eve.[Id Evaluación Entidad]
        LEFT JOIN [RIPS Finalidad Consulta Version2] as fp ON everips.[Id Finalidad Consulta] = fp.Codigo
        LEFT JOIN Entidad ON eve.[Documento Entidad] = Entidad.[Documento Entidad]
        LEFT JOIN [Tipo de Documento] as tp ON Entidad.[Id Tipo de Documento] = tp.[Id Tipo de Documento]
        LEFT JOIN Factura as fc ON fc.[Id Factura] = everips.[Id Factura]
		LEFT JOIN Empresa ON fc.[Documento Empresa] = Empresa.[Documento Empresa]
		LEFT JOIN Empresa as em2 ON eve.[Documento Empresa] = em2.[Documento Empresa]
        LEFT JOIN EmpresaV as EmpV ON Empresa.[Documento Empresa] = EmpV.[Documento Empresa]
		INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eve.[Documento Profesional]
		left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 
        
        WHERE everips.[Id Acto Quirúrgico] <> 1 
        AND EmpV.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] = @numFactura 
        AND eve.[Documento Entidad] = @numDocumentoIdentificacion
        AND CONVERT(DATE, eve.[Fecha Evaluación Entidad]) BETWEEN @fechaInicio AND @fechaFin
        AND EmpV.[Resolución Facturación EmpresaV] = @ResolucionesRips

        `,

        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('numFactura', TYPES.VarChar, numFactura);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);
    request.addParameter('fechaInicio', TYPES.Date, fechaInicio);
    request.addParameter('fechaFin', TYPES.Date, fechaFin);
    request.addParameter('ResolucionesRips', TYPES.VarChar, ResolucionesRips);

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
            finalidadTecnologiaSalud: columns[9].value.toString() ,
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

router.get('/servicios/ripsEPSAP/:numFactura/:numDocumentoIdentificacion/:fechaInicio/:fechaFin/:ResolucionesRips', (req, res) => {
    console.log("bueno so ripsEPSAP");
    const numFactura = req.params.numFactura;
    const numDocumentoIdentificacion = req.params.numDocumentoIdentificacion;
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    const ResolucionesRips = req.params.ResolucionesRips

    // console.log(`En AP el num factura es: ${numFactura}`)

    const request = new Request(
        `SELECT em2.[Código Empresa] AS codPrestador, 
        --SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura], 120), 1, 16) AS fechaInicioAtencion,
        CASE WHEN  SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura], 120), 1, 16) IS NULL THEN  SUBSTRING(CONVERT(VARCHAR, EVE.[Fecha Evaluación Entidad], 120), 1, 16)
        ELSE  SUBSTRING(CONVERT(VARCHAR, fc.[Fecha Factura], 120), 1, 16) END  AS fechaInicioAtencion, 
        NULL AS idMIPRES, NULL AS numAutorizacion, 
        everips.[Codigo RIPS] AS codProcedimiento, '01' AS viaIngresoServicioSalud, '01' AS modalidadGrupoServicioTecSal, 
        '01' AS grupoServicios, '371' AS codServicio, 
		--fp.Codigo AS finalidadTecnologiaSalud, 
		CASE WHEN fp.Codigo IS NULL THEN '44' ELSE fp.Codigo END AS finalidadTecnologiaSalud, 
        tpp.[Tipo de Documento] AS tipoDocumentoIdentificacion, eve.[Documento Profesional] AS numDocumentoIdentificacion, 
        everips.[Diagnostico Rips] AS codDiagnosticoPrincipal, 
        NULL AS codDiagnosticoRelacionado, 
        --CASE WHEN everips.[Diagnostico Rips2] = NULL THEN NULL ELSE everips.[Diagnostico Rips2] END AS codDiagnosticoRelacionado, 
        NULL AS codComplicacion, fc.[Total Factura] AS vrServicio, '05' AS tipoPagoModerador, 
        '0' AS valorPagoModerador, NULL AS numFEVPagoModerador,  ROW_NUMBER() OVER (ORDER BY everips.[Id Evaluación Entidad RIPS]) AS consecutivo, eve.[Id Evaluación Entidad]

        FROM  [Evaluación Entidad Rips] as everips
        
        INNER JOIN [Evaluación Entidad] as eve ON everips.[Id Evaluación Entidad] = eve.[Id Evaluación Entidad]
        LEFT JOIN [RIPS Finalidad Consulta Version2] as fp ON everips.[Id Finalidad Consulta] = fp.Codigo
        LEFT JOIN Entidad ON eve.[Documento Entidad] = Entidad.[Documento Entidad]
        LEFT JOIN [Tipo de Documento] as tp ON Entidad.[Id Tipo de Documento] = tp.[Id Tipo de Documento]
        LEFT JOIN Factura as fc ON fc.[Id Factura] = everips.[Id Factura]
		LEFT JOIN Empresa ON fc.[Documento Empresa] = Empresa.[Documento Empresa]
		LEFT JOIN Empresa as em2 ON eve.[Documento Empresa] = em2.[Documento Empresa]
        LEFT JOIN EmpresaV as EmpV ON Empresa.[Documento Empresa] = EmpV.[Documento Empresa]
		INNER JOIN Entidad as Profe ON Profe.[Documento Entidad] = eve.[Documento Profesional]
		left join [Tipo de Documento] AS tpp ON Profe.[Id Tipo de Documento] = tpp.[Id Tipo de Documento] 
        
        WHERE everips.[Id Acto Quirúrgico] <> 1 
        AND EmpV.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] = @numFactura 
        AND eve.[Documento Entidad] = @numDocumentoIdentificacion
        AND CONVERT(DATE, eve.[Fecha Evaluación Entidad]) BETWEEN @fechaInicio AND @fechaFin
        AND EmpV.[Resolución Facturación EmpresaV] = @ResolucionesRips

        `,

        (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta de servicios:', err);
                res.status(500).send('Error interno del servidor');
            }
        });

    request.addParameter('numFactura', TYPES.VarChar, numFactura);
    request.addParameter('numDocumentoIdentificacion', TYPES.VarChar, numDocumentoIdentificacion);
    request.addParameter('fechaInicio', TYPES.Date, fechaInicio);
    request.addParameter('fechaFin', TYPES.Date, fechaFin);
    request.addParameter('ResolucionesRips', TYPES.VarChar, ResolucionesRips);

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
            finalidadTecnologiaSalud: columns[9].value.toString() ,
            tipoDocumentoIdentificacion: columns[10].value,
            numDocumentoIdentificacion: columns[11].value,
            codDiagnosticoPrincipal: columns[12].value,
            codDiagnosticoRelacionado: columns[13].value,
            codComplicacion: columns[14].value,
            vrServicio: columns[15].value,
            conceptoRecaudo: columns[16].value,
            valorPagoModerador: parseInt(columns[17].value, 10),
            numFEVPagoModerador: columns[18].value,
            consecutivo: 6
            // consecutivo: parseInt(columns[19].value, 10) // Convertir a entero
        };

        resultadosServicios.push(servicio);
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
                    const nombreArchivo = `${numFacturaConsulta}_${documento}_${docIndex + 1}.json`;
                    const contenidoJSON = JSON.stringify(consulta, null, 2); // Genera el JSON del objeto consulta en lugar de un array
                    zip.file(nombreArchivo, contenidoJSON);
                });
            });
        } else {
            const documentos = consultas.flatMap(consulta => consulta.usuarios ? consulta.usuarios.map(usuario => usuario.numDocumentoIdentificacion) : []);
            const nombreArchivoCombinado = `${numFacturaConsulta}_${documentos.join('_')}.json`;
            const contenidoJSONCombinado = JSON.stringify(consultas[0], null, 2); // Toma solo el primer elemento del array para generar el JSON
            zip.file(nombreArchivoCombinado, contenidoJSONCombinado);
        }
    }

    // Crear y enviar el archivo ZIP
    const fechaActual = new Date();
    const fechaFormateada = `${fechaActual.getFullYear()}-${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}-${fechaActual.getDate().toString().padStart(2, '0')}`;
    const nombreArchivo = `${prefijo} --- ${fechaInicio} --- ${fechaFin}.zip`;
    const rutaArchivo = path.join('C:', 'CeereSio', 'RIPS_2275', 'ARCHIVOS_RIPS', nombreArchivo);
    const nombreCarpetaDeAlmacenadoJSON = `${fechaInicio} --- ${fechaFin}`;

    try {
        // Generar el archivo ZIP
        const content = await zip.generateAsync({ type: 'nodebuffer' });
        fs.writeFileSync(rutaArchivo, content);
        res.json({ mensaje: 'Archivo ZIP generado y almacenado', ruta: rutaArchivo });

        // Descomprimir los archivos ZIP
        const rutasZips = [rutaArchivo]; // Aquí se pueden agregar más rutas de archivos ZIP
        const rutaBaseDestino = path.join('C:', 'CeereSio', 'RIPS_2275', 'ARCHIVOS_RIPS_JSON');
        await descomprimirZip(rutasZips, rutaBaseDestino);
        const NombreArchivoIgualdadCarpetaParaXMLS = `${prefijo} --- ${fechaInicio} --- ${fechaFin}`;
        const IgualdadCarpetaParaXMLS = path.join('C:', 'CeereSio', 'RIPS_2275', 'XMLS', NombreArchivoIgualdadCarpetaParaXMLS);
        fs.mkdirSync(IgualdadCarpetaParaXMLS, { recursive: true });

    } catch (error) {
        console.error('Error al generar o almacenar el archivo ZIP:', error);
        res.status(500).send('Error interno al generar el archivo ZIP');
    }
});



module.exports = router;
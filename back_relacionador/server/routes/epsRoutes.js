const { Request, TYPES } = require('tedious');
const Router = require('express').Router;
const connection = require('../db');

const router = Router();

// SERVIDOR DE OPCIÓN PREPAGADA
router.get('/EPS/:fechaInicio/:fechaFin', (req, res) => {
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    const EPSData = [];
    const EPSVistos = new Set(); // Utilizar un conjunto para rastrear nombres únicos

    const request = new Request(`SELECT fc.[Id Factura], en.[Nombre Completo Entidad] + ' ' + EV.[Prefijo Resolución Facturación EmpresaV]+ fc.[No Factura] as [Nombre EPS]

    FROM Factura as fc
    
    INNER JOIN FacturaII as fc2 ON fc.[Id Factura] = fc2.[Id Factura]
    INNER JOIN Entidad as en ON fc.[Documento Paciente] = en.[Documento Entidad]
    INNER JOIN [Plan de Tratamiento] as pt ON fc2.[Id Plan de Tratamiento] = pt.[Id Plan de Tratamiento]
    INNER JOIN [Plan de Tratamiento Tratamientos] as ptt ON pt.[Id Plan de Tratamiento] = ptt.[Id Plan de Tratamiento]
    INNER JOIN [Tipo Responsable] as tr ON ptt.[Id Tipo Responsable] = tr.[Id Tipo Responsable]
	INNER JOIN  EmpresaV EV ON EV.[Id EmpresaV] = FC.[Id EmpresaV] 
    
    WHERE tr.[Tipo Responsable] IN ('Entidad Prepagada', 'EPS') AND fc.[Fecha Factura] BETWEEN @fechaInicio AND @fechaFin
    `, (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar la consulta de las EPS:', err.message);
            res.status(500).json({ error: 'Error al obtener datos de pacientes' });
        } else {
            console.log(`Consulta de EPS ejecutada con éxito. Filas afectadas: ${rowCount}`);

            // Filtrar duplicados basados en el nombre
            const pacientesUnicos = EPSData.filter(Eps => {
                if (!EPSVistos.has(Eps['Nombre EPS'])) {
                    EPSVistos.add(Eps['Nombre EPS']);
                    return true;
                }
                return false;
            });

            // Enviar los datos de pacientes únicos como respuesta JSON
            res.json(pacientesUnicos.map(row => ({
                idFacturaEPS: row['Id Factura'],
                nombreEPS: row['Nombre EPS']
            })));

            // console.log(pacientesUnicos);
        }
    });

    // Ajustar los parámetros según las columnas y datos que estás insertando
    request.addParameter('FechaInicio', TYPES.DateTime, fechaInicio);
    request.addParameter('FechaFin', TYPES.DateTime, fechaFin);

    // Manejar cada fila de resultados
    request.on('row', (columns) => {
        const EPS = {};
        columns.forEach((column) => {
            EPS[column.metadata.colName] = column.value;
        });
        EPSData.push(EPS);
    });

    connection.execSql(request);
});

router.get('/pacientesEPS/:idFacturaEPS', (req, res) => {
    const idFacturaEPS = req.params.idFacturaEPS;
    // const fechaInicio = req.params.fechaInicio;
    // const fechaFin = req.params.fechaFin;
    const pacientesEPSData = []; // Crear un array para almacenar los resultados

    const request = new Request(`SELECT en.[Documento Entidad], en.[Nombre Completo Entidad] as [Nombre Paciente]

    FROM FacturaII as fc2
        
    INNER JOIN Factura as fc ON fc2.[Id Factura] = fc.[Id Factura]
    LEFT JOIN [Plan de Tratamiento] as pt ON fc2.[Id Plan de Tratamiento] = pt.[Id Plan de Tratamiento]
    LEFT JOIN Entidad as en ON pt.[Documento Paciente] = en.[Documento Entidad]
    LEFT JOIN [Evaluación Entidad Rips] as everips ON fc.[Id Factura] = everips.[Id Factura]

    
    WHERE fc2.[Id Factura] = @idFacturaEPS
    AND everips.[Id Factura] IS NULL
    
    ORDER BY fc2.[Id Plan de Tratamiento] ASC`, (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar la consulta de evaluaciones:', err.message);
            res.status(500).json({ error: 'Error al obtener datos de pacientes EPS' });
        } else {
            console.log(`Consulta de pacientes EPS ejecutada con éxito. Filas afectadas: ${rowCount}`);

            // Enviar los datos de evaluaciones como respuesta JSON
            res.json(pacientesEPSData.map(row => ({
                documentoPacienteEPS: row['Documento Entidad'],
                nombrePacienteEPS: row['Nombre Paciente']
            })));
        }
    });

    // Ajustar los parámetros según las columnas y datos que estás insertando
    request.addParameter('idFacturaEPS', TYPES.VarChar, idFacturaEPS);
    // request.addParameter('FechaInicio', TYPES.DateTime, fechaInicio);
    // request.addParameter('FechaFin', TYPES.DateTime, fechaFin);

    // Manejar cada fila de resultados
    request.on('row', (columns) => {
        const pacienteEPS = {};
        columns.forEach((column) => {
            pacienteEPS[column.metadata.colName] = column.value;
        });
        pacientesEPSData.push(pacienteEPS);
    });

    connection.execSql(request);
});

router.get('/hcPacientesEPS/:documentoPacienteEPS', (req, res) => {
    const documentoPacienteEPS = req.params.documentoPacienteEPS;
    const historiasEPSData = []; // Crear un array para almacenar los resultados

    const request = new Request(`SELECT everips.[Id Evaluación Entidad Rips], everips.[Id Evaluación Entidad], eve.[Fecha Evaluación Entidad], everips.[Id Factura]

    FROM [Evaluación Entidad Rips] as everips
    
    INNER JOIN [Evaluación Entidad] as eve ON everips.[Id Evaluación Entidad] = eve.[Id Evaluación Entidad]
    
    WHERE eve.[Documento Entidad] = @documentoPacienteEPS AND everips.[Id Factura] IS NULL`, (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar la consulta de historias clinicas EPS:', err.message);
            res.status(500).json({ error: 'Error al obtener datos de historias clinicas EPS' });
        } else {
            console.log(`Consulta de historias clinicas EPS ejecutada con éxito. Filas afectadas: ${rowCount}`);

            // Enviar los datos de evaluaciones como respuesta JSON
            res.json(historiasEPSData.map(row => ({
                idEveRips: row['Id Evaluación Entidad Rips'],
                fechaEveRips: row['Fecha Evaluación Entidad']
            })));
        }
    });

    // Ajustar los parámetros según las columnas y datos que estás insertando
    request.addParameter('documentoPacienteEPS', TYPES.VarChar, documentoPacienteEPS);
    // request.addParameter('FechaInicio', TYPES.DateTime, fechaInicio);
    // request.addParameter('FechaFin', TYPES.DateTime, fechaFin);

    // Manejar cada fila de resultados
    request.on('row', (columns) => {
        const historiasEPS = {};
        columns.forEach((column) => {
            historiasEPS[column.metadata.colName] = column.value;
        });
        historiasEPSData.push(historiasEPS);
    });

    connection.execSql(request);
});

router.post('/relacionarEPS/:idFacturaEPS/:idEveRips', (req, res) => {
    const idFacturaEPS = req.params.idFacturaEPS
    const idEveRips = req.params.idEveRips

    // Realizar la inserción en la tabla [Evaluación Entidad Rips]
    const requestInsert = new Request(`UPDATE [Evaluación Entidad Rips] SET [Id Factura] = @idFacturaEPS

    WHERE [Id Evaluación Entidad Rips] = @idEveRips`, (err) => {
        if (err) {
            console.error('Error al insertar el id factura de las EPS:', err.message);
            res.status(500).json({ error: 'Error al insertar el id factura de las EPS:' });
        } else {
            console.log('Inserción ejecutada con éxito');
            res.json({ success: true, message: 'Factura e historia relacionadas correctamente' });
        }
    });

    // Ajustar los parámetros según las columnas y datos que estás insertando
    requestInsert.addParameter('idFacturaEPS', TYPES.Int, idFacturaEPS);
    requestInsert.addParameter('idEveRips', TYPES.Int, idEveRips);

    console.log('Este es el Id Rips: ' + idEveRips);
    console.log('Este es el Id de la factura: ' + idFacturaEPS);


    // Ejecutar la solicitud de inserción
    connection.execSql(requestInsert);
});


//Actualizaciones Fernando
//Este endpoint es para consultar los pacientes de los tratamientos que se encuentran dentro de la factura seleccionada
router.get('/PacientesTratamientosFacturaEps/:IdFactura', (req, res) => {
    const IdFactura = req.params.IdFactura;

    const PacientesData = []; // Crear un array para almacenar los resultados

    const request = new Request(`SELECT ENT.[Nombre Completo Entidad] AS [NombrePaciente],  PTT.[Documento Responsable] AS [DocumentoEPS], PT.[Documento Paciente] AS [DocumentoPaciente], COUNT(PT.[Documento Paciente]) FROM FacturaII FII
    INNER JOIN [Plan de Tratamiento] PT ON PT.[Id Plan de Tratamiento] = FII.[Id Plan de Tratamiento]
    INNER JOIN [Plan de Tratamiento Tratamientos] PTT ON PTT.[Id Plan de Tratamiento] = PT.[Id Plan de Tratamiento]
    INNER JOIN Entidad ENT ON ENT.[Documento Entidad] = PT.[Documento Paciente]
    WHERE FII.[Id Factura] = @idfactura
    GROUP BY PT.[Documento Paciente], PTT.[Documento Responsable], ENT.[Nombre Completo Entidad] `, (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar la consulta de historias clinicas EPS:', err.message);
            res.status(500).json({ error: 'Error al obtener datos de historias clinicas EPS' });
        } else {
            console.log(`Consulta de historias clinicas EPS ejecutada con éxito. Filas afectadas: ${rowCount}`);

            // Enviar los datos de evaluaciones como respuesta JSON
            res.json(PacientesData.map(row => ({
                DocumentoPaciente: row['DocumentoPaciente'],
                NombrePaciente: row['NombrePaciente'],
                DocumentoEps: row['DocumentoEPS']
            })));
        }
    });

    
    request.addParameter('idfactura', TYPES.Int, IdFactura);
    
    // Manejar cada fila de resultados
    request.on('row', (columns) => {
        const Pacientes = {};
        columns.forEach((column) => {
            Pacientes[column.metadata.colName] = column.value;
        });
        PacientesData.push(Pacientes);
    });

    connection.execSql(request);
});


//aca seran las hc con rips de los pacientes de la anterior consulta  que tambien tengan documentotipo rips la entidad prepagada
router.get('/RipsPacientesTratamientosEps/:DocumentoPaciente/:DocumentoEPS', (req, res) => {
    const DocumentoPaciente = req.params.DocumentoPaciente;
    const DocumentoEPS = req.params.DocumentoEPS;

    const PacienteRipsData = []; // Crear un array para almacenar los resultados
    

    const request = new Request(`SELECT EVR.[Id Evaluación Entidad Rips] AS [idEveRips], EVA.[Fecha Evaluación Entidad] AS [FechaHC], TE.[Tipo de Evaluación] AS [TipoEvaluacion]
        FROM [Evaluación Entidad Rips] EVR 
        INNER JOIN [Evaluación Entidad] EVA ON EVA.[Id Evaluación Entidad] = EVR.[Id Evaluación Entidad]
        INNER JOIN [Tipo de Evaluación] TE ON TE.[Id Tipo de Evaluación] = EVA.[Id Tipo de Evaluación]
        WHERE EVA.[Documento Entidad] = @DocumentoPaciente AND EVR.[Documento Tipo Rips] = @DocumentoEPS
        AND EVR.[Id Factura] IS NULL AND EVR.[Id Plan de Tratamiento] IS NULL`, (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar la consulta de historias clinicas EPS:', err.message);
            res.status(500).json({ error: 'Error al obtener datos de historias clinicas EPS' });
        } else {
            console.log(`Consulta de historias clinicas EPS ejecutada con éxito. Filas afectadas: ${rowCount}`);

            // Enviar los datos de evaluaciones como respuesta JSON
            res.json(PacienteRipsData.map(row => ({
                idEveRips: row['idEveRips'],
                fechaEveRips: row['FechaHC'],
                TipoEvaluacion: row['TipoEvaluacion'] 
            })));
        }
    });

    
    request.addParameter('DocumentoPaciente', TYPES.VarChar, DocumentoPaciente);
    request.addParameter('DocumentoEPS', TYPES.VarChar, DocumentoEPS);
    
    // Manejar cada fila de resultados
    request.on('row', (columns) => {
        const PacienteRips = {};
        columns.forEach((column) => {
            PacienteRips[column.metadata.colName] = column.value;
        });
        PacienteRipsData.push(PacienteRips);
    });

    connection.execSql(request);
});






module.exports = router;
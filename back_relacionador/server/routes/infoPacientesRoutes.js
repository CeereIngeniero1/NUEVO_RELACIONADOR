const { Request, TYPES } = require('tedious');
const Router = require('express').Router;
const connection = require('../db');
const { sql, poolPromise } = require('../db2');


const router = Router();

router.get('/pacientes/:fechaInicio/:fechaFin/:documentoEmpresaSeleccionada', (req, res) => {
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    const documentoEmpresaSeleccionada = req.params.documentoEmpresaSeleccionada;
    const pacientesData = [];
    const nombresVistos = new Set(); // Utilizar un conjunto para rastrear nombres únicos

    const request = new Request(`SELECT en.[Nombre Completo Entidad] AS [Nombre Paciente], tp.[Tipo de Documento], eve.[Documento Entidad], eve.[Fecha Evaluación Entidad], fc.[Id Factura], eve.[Id Evaluación Entidad] 

    FROM [Evaluación Entidad Rips]  AS everips 

    INNER JOIN [Evaluación Entidad] AS eve ON eve.[Id Evaluación Entidad] = everips.[Id Evaluación Entidad] 
    INNER JOIN Entidad AS en ON eve.[Documento Entidad] = en.[Documento Entidad] 
    LEFT JOIN Factura as fc ON eve.[Documento Entidad] = fc.[Documento Paciente] 
    INNER JOIN [Tipo de Documento] as tp ON en.[Id Tipo de Documento] = tp.[Id Tipo de Documento]
    LEFT JOIN Empresa as em ON eve.[Documento Empresa] = em.[Documento Empresa]

    WHERE CONVERT(DATE, eve.[Fecha Evaluación Entidad],101) BETWEEN @FechaInicio AND @FechaFin 
    AND EXISTS (SELECT 1 FROM [Evaluación Entidad Rips] AS rips WHERE rips.[Id Evaluación Entidad] = eve.[Id Evaluación Entidad]) 
    AND everips.[Id Factura] IS NULL 
    AND em.[Documento Empresa] = @documentoEmpresaSeleccionada
    ORDER BY [Nombre Paciente] ASC`, (err, rowCount) => {

        if (err) {
            console.error('Error al ejecutar la consulta de pacientes:', err.message);
            res.status(500).json({ error: 'Error al obtener datos de pacientes' });
        }
        else {
            console.log(`Consulta de pacientes ejecutada con éxito. Filas afectadas: ${rowCount}`);

            // Filtrar duplicados basados en el nombre
            const pacientesUnicos = pacientesData.filter(paciente => {
                if (!nombresVistos.has(paciente['Nombre Paciente'])) {
                    nombresVistos.add(paciente['Nombre Paciente']);
                    return true;
                }
                return false;
            });

            // Enviar los datos de pacientes únicos como respuesta JSON
            res.json(pacientesUnicos.map(row => ({
                nombre: row['Nombre Paciente'],
                tipoDocumento: row['Tipo de Documento'],
                documento: row['Documento Entidad'],
                fechaEvaluacion: row['Fecha Evaluación Entidad']

            })));

            // console.log(pacientesUnicos);
        }
    });

    // Ajustar los parámetros según las columnas y datos que estás insertando
    request.addParameter('FechaInicio', TYPES.DateTime, fechaInicio);
    request.addParameter('FechaFin', TYPES.DateTime, fechaFin);
    request.addParameter('documentoEmpresaSeleccionada', TYPES.VarChar, documentoEmpresaSeleccionada);

    // Manejar cada fila de resultados
    request.on('row', (columns) => {
        const paciente = {};
        columns.forEach((column) => {
            paciente[column.metadata.colName] = column.value;
        });
        pacientesData.push(paciente);
    });

    connection.execSql(request);
});

// router.get('/pacientes/:fechaInicio/:fechaFin/:documentoEmpresaSeleccionada', (req, res) => {
//     const fechaInicio = req.params.fechaInicio;
//     const fechaFin = req.params.fechaFin;
//     const documentoEmpresaSeleccionada = req.params.documentoEmpresaSeleccionada;
//     const pacientesData = [];
//     const nombresVistos = new Set(); // Utilizar un conjunto para rastrear nombres únicos

//       // Parámetros de paginación con valores por defecto
//       const page = parseInt(req.query.page) || 1;   // Página actual (por defecto 1)
//       const limit = parseInt(req.query.limit) || 100; // Registros por página (por defecto 100)
//       const offset = (page - 1) * limit; // Calcular desde qué registro comenzar
  

//     const request = new Request(`
//         SELECT   [Nombre Paciente]
//     ,[Tipo de Documento]
//     ,[Documento Entidad]
//     ,[Fecha Evaluación Entidad]
//     ,[Id Factura]
//     ,[Id Evaluación Entidad]
//     ,[Documento Empresa]
// FROM  [Cnsta Relacionador Info Pacientes Facturas] Const

//   WHERE CONVERT(DATE, Const.[Fecha Evaluación Entidad],101) BETWEEN @FechaInicio AND @FechaFin 
//   AND EXISTS (SELECT 1 FROM [Evaluación Entidad Rips] AS rips WHERE rips.[Id Evaluación Entidad] = Const.[Id Evaluación Entidad]) 
//   --AND NOT EXISTS (SELECT 1 FROM [RIPS Unión AC] AS ripsAC WHERE ripsAC.[Id Evaluación Entidad] = eve.[Id Evaluación Entidad]) 
//   --AND NOT EXISTS (SELECT 1 FROM [RIPS Unión AP] AS rips WHERE rips.[Id Evaluación Entidad] = eve.[Id Evaluación Entidad]) 
//   AND Const.[Id Factura] IS NULL 
//   AND Const.[Documento Empresa] = @documentoEmpresaSeleccionada
//   ORDER BY [Nombre Paciente] ASC
//   OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;`, (err, rowCount) => {

//         if (err) {
//             console.error('Error al ejecutar la consulta de pacientes:', err.message);
//             res.status(500).json({ error: 'Error al obtener datos de pacientes' });
//         }
//         else {
//             console.log(`Consulta de pacientes ejecutada con éxito. Filas afectadas: ${rowCount}`);

//             // Filtrar duplicados basados en el nombre
//             const pacientesUnicos = pacientesData.filter(paciente => {
//                 if (!nombresVistos.has(paciente['Nombre Paciente'])) {
//                     nombresVistos.add(paciente['Nombre Paciente']);
//                     return true;
//                 }
//                 return false;
//             });

//             // Enviar los datos de pacientes únicos como respuesta JSON
//             res.json(pacientesUnicos.map(row => ({
//                 nombre: row['Nombre Paciente'],
//                 tipoDocumento: row['Tipo de Documento'],
//                 documento: row['Documento Entidad'],
//                 fechaEvaluacion: row['Fecha Evaluación Entidad']

//             })));

//             // console.log(pacientesUnicos);
//         }
//     });

//     // Ajustar los parámetros según las columnas y datos que estás insertando
//     request.addParameter('FechaInicio', TYPES.DateTime, fechaInicio);
//     request.addParameter('FechaFin', TYPES.DateTime, fechaFin);
//     request.addParameter('documentoEmpresaSeleccionada', TYPES.VarChar, documentoEmpresaSeleccionada);
//     request.addParameter('Offset', TYPES.Int, offset);
//     request.addParameter('Limit', TYPES.Int, limit);

//     // Manejar cada fila de resultados
//     request.on('row', (columns) => {
//         const paciente = {};
//         columns.forEach((column) => {
//             paciente[column.metadata.colName] = column.value;
//         });
//         pacientesData.push(paciente);
//     });

//     connection.execSql(request);
// });

router.get('/evaluaciones/:documento/:fechaInicio/:fechaFin', (req, res) => {
    const documento = req.params.documento;
    const fechaInicio = req.params.fechaInicio;
    const fechaFin = req.params.fechaFin;
    const evaluacionData = []; // Crear un array para almacenar los resultados

    const request = new Request(`SELECT eve.[Documento Entidad], eve.[Fecha Evaluación Entidad] AS [Fecha Evaluación Entidad], eve.[Id Evaluación Entidad], 
    everips.[Id Evaluación Entidad Rips], everips.[Id Factura], Entidad.[Nombre Completo Entidad] AS [Nombre Usuario]

    FROM [Evaluación Entidad] AS eve 
    
    INNER JOIN [Evaluación Entidad Rips] AS everips ON eve.[Id Evaluación Entidad] = everips.[Id Evaluación Entidad]
    INNER JOIN Entidad ON eve.[Documento Usuario] = Entidad.[Documento Entidad]
    
    WHERE eve.[Documento Entidad] = @Documento 
    AND everips.[Id Tipo de Rips] = 2 
    AND everips.[Id Factura] IS NULL  
    AND CONVERT(DATE, eve.[Fecha Evaluación Entidad],101) BETWEEN @FechaInicio AND @FechaFin`, (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar la consulta de evaluaciones:', err.message);
            res.status(500).json({ error: 'Error al obtener datos de evaluaciones' });
        } else {
            console.log(`Consulta de evaluaciones ejecutada con éxito. Filas afectadas: ${rowCount}`);
            // Enviar los datos de evaluaciones como respuesta JSON
            res.json(evaluacionData.map(row => ({
                fechaEvaluacion: row['Fecha Evaluación Entidad'],
                idEvaluacion: row['Id Evaluación Entidad Rips'],
                nombreUsuario: row['Nombre Usuario']
            })));
        }
    });

    // Ajustar los parámetros según las columnas y datos que estás insertando
    request.addParameter('Documento', TYPES.VarChar, documento);
    request.addParameter('FechaInicio', TYPES.DateTime, fechaInicio);
    request.addParameter('FechaFin', TYPES.DateTime, fechaFin);

    // Manejar cada fila de resultados
    request.on('row', (columns) => {
        const evaluacion = {};
        columns.forEach((column) => {
            evaluacion[column.metadata.colName] = column.value;
        });
        evaluacionData.push(evaluacion);
    });

    connection.execSql(request);
});

router.get('/facturas/:documento', (req, res) => {
    const documento = req.params.documento;
    const facturasData = []; // Crear un array para almacenar los resultados

    const request = new Request(`SELECT fc.[Id Factura], fc.[No Factura], fc.[Total Factura], emV.[Prefijo Resolución Facturación EmpresaV] AS [Prefijo], fc.[Fecha Factura],
    Entidad.[Nombre Completo Entidad] AS [Nombre Usuario]
    
    FROM Factura AS fc 
    
    INNER JOIN EmpresaV as emV ON fc.[Id EmpresaV] = emV.[Id EmpresaV]
    INNER JOIN Entidad ON fc.[Documento Usuario] = Entidad.[Documento Entidad]
    
    WHERE fc.[Documento Paciente] = @Documento
    AND NOT EXISTS (SELECT 1 FROM dbo.[Evaluación Entidad Rips] AS ap WHERE fc.[Id Factura] = ap.[Id Factura])
    ORDER BY fc.[Fecha Factura] DESC
    `, (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar la consulta de facturas:', err.message);
            res.status(500).json({ error: 'Error al obtener datos de evaluaciones' });
        } else {
            console.log(`Consulta de facturas ejecutada con éxito. Filas afectadas: ${rowCount}`);
            // Enviar los datos de evaluaciones como respuesta JSON
            res.json(facturasData.map(row => ({
                noFactura: row['No Factura'],
                idFactura: row['Id Factura'],
                totalFactura: row['Total Factura'],
                prefijo: row['Prefijo'],
                fechaFactura: row['Fecha Factura'],
                nombreUsuario: row['Nombre Usuario']
            })));
        }
    });

    // Ajustar los parámetros según las columnas y datos que estás insertando
    request.addParameter('Documento', TYPES.VarChar, documento);

    // Manejar cada fila de resultados
    request.on('row', (columns) => {
        const factura = {};
        columns.forEach((column) => {
            factura[column.metadata.colName] = column.value;
        });
        facturasData.push(factura);
    });

    connection.execSql(request);
});

// Agrega esta ruta para obtener detalles de la factura según el ID
router.get('/usuarios/factura/:idFactura', (req, res) => {
    const idFactura = req.params.idFactura;

    // Realiza la consulta a la base de datos y devuelve los detalles de la factura
    obtenerDetallesFacturaPorId(idFactura)
        .then(detallesFactura => {
            res.json(detallesFactura);
        })
        .catch(error => {
            console.error('Error al obtener detalles de factura:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        });
});

// Función para obtener detalles de factura según el ID
async function obtenerDetallesFacturaPorId(idFactura) {
    return new Promise((resolve, reject) => {
        const consultaSQL = `
            SELECT
                emp.[Nombre Comercial Empresa],
                fc.[Documento Empresa],
                empV.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] AS [No Factura],
                CONVERT(DATE, fc.[Fecha Factura], 101),
                CONVERT(DATE, fc.[Fecha Vencimiento Factura], 101),
                en.[Nombre Completo Entidad] AS [Nombre Paciente],
                fc.[Documento Paciente],
                enll.[Nombre Completo Entidad] AS [Nombre Responsable],
                fc.[Documento Responsable],
                fc2.[Descripción FacturaII],
                fc.[Cantidad de Artículos Factura] AS Cantidad,
                fc.[Iva Factura] AS [Valor Iva],
                fc.[Total Factura] AS [Valor Total],
                fc.[Observaciones Factura]
            FROM Factura as fc
            INNER JOIN Empresa as emp ON fc.[Documento Empresa] = emp.[Documento Empresa]
            INNER JOIN EmpresaV as empV ON fc.[Id EmpresaV] = empV.[Id EmpresaV]
            INNER JOIN Entidad as en ON fc.[Documento Paciente] = en.[Documento Entidad]
            INNER JOIN Entidad as enll ON fc.[Documento Responsable] = enll.[Documento Entidad]
            INNER JOIN FacturaII as fc2 ON fc.[Id Factura] = fc2.[Id Factura]
            WHERE fc.[Id Factura] = @idFactura
        `;

        const request = new Request(consultaSQL, (err) => {
            if (err) {
                reject(err);
            }
        });

        request.addParameter('idFactura', TYPES.Int, idFactura);

        const detallesFactura = {};

        request.on('row', (columns) => {
            // Llenar detallesFactura con los resultados de la consulta
            detallesFactura.nombreEmpresa = columns[0].value;
            detallesFactura.documentoEmpresa = columns[1].value;
            detallesFactura.noFactura = columns[2].value;
            // Formatear la fecha de la factura
            detallesFactura.fechaFactura = new Date(columns[3].value).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            detallesFactura.fechaVencimientoFactura = new Date(columns[4].value).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            detallesFactura.nombrePaciente = columns[5].value;
            detallesFactura.documentoPaciente = columns[6].value;
            detallesFactura.nombreResponsable = columns[7].value;
            detallesFactura.documentoResponsable = columns[8].value;
            detallesFactura.descripcionFactura = columns[9].value;
            detallesFactura.cantidad = columns[10].value;
            detallesFactura.valorIva = columns[11].value;
            detallesFactura.valorTotal = columns[12].value;
            detallesFactura.observacionesFactura = columns[13].value;
        });


        request.on('requestCompleted', () => {
            resolve(detallesFactura);
        });

        connection.execSql(request);
    });
}

router.get('/buscarFacturas/:documento', (req, res) => {
    const documento = req.params.documento;
    const facturasData = []; // Crear un array para almacenar los resultados

    const request = new Request(`SELECT fc.[Id Factura], en.[Nombre Completo Entidad] as [Nombre Paciente], em5.[Prefijo Resolución Facturación EmpresaV] + fc.[No Factura] as [No Factura], fc.[Fecha Factura], fc.[Total Factura]

    FROM Factura AS fc 

    INNER JOIN EmpresaV  as em5 ON fc.[Id EmpresaV] = em5.[Id EmpresaV]
    INNER JOIN Entidad as en ON fc.[Documento Paciente] = en.[Documento Entidad]

    WHERE fc.[Documento Paciente] = @Documento`, (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar la consulta de facturas:', err.message);
            res.status(500).json({ error: 'Error al obtener datos de facturas' });
        } else {
            console.log(`Consulta de facturas ejecutada con éxito. Filas afectadas: ${rowCount}`);
            // Enviar los datos de evaluaciones como respuesta JSON
            res.json(facturasData.map(row => ({
                idFactura: row['Id Factura'],
                nombrePaciente: row['Nombre Paciente'],
                noFactura: row['No Factura'],
                fechaFactura: row['Fecha Factura'],
                totalFactura: row['Total Factura']
            })));

        }
    });

    
    // Ajustar los parámetros según las columnas y datos que estás insertando
    request.addParameter('Documento', TYPES.VarChar, documento);

    // Manejar cada fila de resultados
    request.on('row', (columns) => {
        const factura = {};
        columns.forEach((column) => {
            factura[column.metadata.colName] = column.value;
        });
        facturasData.push(factura);
    });

    connection.execSql(request);
});

router.post('/relacionar', (req, res) => {
    const { paciente, evaluacion, factura } = req.body;

    // Realizar la inserción en la tabla [Evaluación Entidad Rips]
    const requestInsert = new Request('UPDATE [Evaluación Entidad Rips] SET [Id Factura] = @IdFactura WHERE [Id Evaluación Entidad Rips] = @IdEvaluacion', (err) => {
        if (err) {
            console.error('Error al ejecutar la inserción:', err.message);
            res.status(500).json({ error: 'Error al relacionar datos' });
        } else {
            console.log('Inserción ejecutada con éxito');
            res.json({ success: true, message: 'Datos relacionados correctamente' });
        }
    });

    // Ajustar los parámetros según las columnas y datos que estás insertando
    requestInsert.addParameter('IdEvaluacion', TYPES.Int, evaluacion);
    requestInsert.addParameter('IdFactura', TYPES.Int, factura);

    console.log('Este es el Id Rips: ' + evaluacion);
    console.log('Este es el Id de la factura: ' + factura);


    // Ejecutar la solicitud de inserción
    connection.execSql(requestInsert);
});

router.post('/facturaCeroORIGINAL/:documentoEmpresaSeleccionada', async (req, res) => {
    try {
        const { evaluacion } = req.body;
        const idFactura = [];
        const documentoEmpresaSeleccionada = req.params.documentoEmpresaSeleccionada;


        // Realizar la consulta para obtener el Id Factura
        const requestSelect = new Request(`SELECT [Id Factura] FROM Factura WHERE [No Factura] = '0000000' AND [Documento Empresa] = @documentoEmpresaSeleccionada `, (err) => {
            if (err) {
                console.error('Error al ejecutar la consulta:', err.message);
                return res.status(500).json({ error: 'Error al obtener el Id Factura' });
            }

            else {
                if (idFactura.length > 0) {
                    const facturaId = idFactura[0]['Id Factura'];
                    console.log(facturaId)
                    res.json({ idFactura: facturaId });
                    console.log('IdFactura devuelto por la consulta:', facturaId);

                    // Realizar la inserción en la tabla [Evaluación Entidad Rips]
                    const requestInsert = new Request('UPDATE [Evaluación Entidad Rips] SET [Id Factura] = @IdFactura WHERE [Id Evaluación Entidad Rips] = @IdEvaluacion', (err) => {
                        if (err) {
                            console.error('Error al ejecutar la inserción:', err.message);
                            return res.status(500).json({ error: 'Error al relacionar datos - Inserción' });
                        }

                        console.log('Inserción ejecutada con éxito');
                    });

                    // Ajustar los parámetros según las columnas y datos que estás insertando
                    requestInsert.addParameter('IdEvaluacion', TYPES.Int, evaluacion);
                    requestInsert.addParameter('IdFactura', TYPES.Int, facturaId);


                    // Ejecutar la solicitud de inserción
                    connection.execSql(requestInsert);
                }

                else {

                    return res.status(500).json({ error: 'No se encontró ninguna factura con [No Factura] = 0' });
                }
            }
        });
        
        requestSelect.addParameter('documentoEmpresaSeleccionada', TYPES.VarChar, documentoEmpresaSeleccionada);
        // Agregar un manejador de eventos para recibir los resultados de la consulta
        requestSelect.on('row', (columns) => {
            columns.forEach(column => {
                idFactura.push({ [column.metadata.colName]: column.value });
            });
        });

        // // Agregar un parámetro de salida para almacenar el Id Factura
        // requestSelect.addOutputParameter('IdFactura', TYPES.Int);

        // Ejecutar la solicitud de consulta
        connection.execSql(requestSelect);
    }

    catch (ex) {
        console.error(ex);
        console.error(ex.stack);
        return res.status(500).json({ error: 'Error interno del servidor - Catch' });
    }
});

router.post('/facturaCero/:documentoEmpresaSeleccionada', async (req, res) => {
    const { evaluacion } = req.body;
    const documentoEmpresaSeleccionada = req.params.documentoEmpresaSeleccionada;

    try {
        // Obtener conexión del pool
        const pool = await poolPromise;
        
        // Realizar la consulta para obtener el Id Factura
        const resultSelect = await pool.request()
            .input('documentoEmpresaSeleccionada', sql.VarChar, documentoEmpresaSeleccionada)
            .query(`SELECT [Id Factura] FROM Factura WHERE [No Factura] = '0000000' AND [Documento Empresa] = @documentoEmpresaSeleccionada`);

        const idFactura = resultSelect.recordset;

        if (idFactura.length > 0) {
            const facturaId = idFactura[0]['Id Factura'];
            console.log('IdFactura devuelto por la consulta:', facturaId);

            // Consulta para obtener el máximo consecutivo
            const resultMax = await pool.request()
                .query(`SELECT MAX(ConsecutivoRipsFacturaEnCero) AS MaxConsecutivo FROM [Evaluación Entidad Rips]`);

            let maxConsecutivo = resultMax.recordset[0].MaxConsecutivo;
            const nuevoConsecutivo = (maxConsecutivo === null) ? 1 : maxConsecutivo + 1;

            // Realizar la inserción en la tabla [Evaluación Entidad Rips]
            const resultInsert = await pool.request()
                .input('IdEvaluacion', sql.Int, evaluacion)
                .input('IdFactura', sql.Int, facturaId)
                .input('NuevoConsecutivo', sql.Int, nuevoConsecutivo)
                .query(`UPDATE [Evaluación Entidad Rips] SET [Id Factura] = @IdFactura, [ConsecutivoRipsFacturaEnCero] = @NuevoConsecutivo WHERE [Id Evaluación Entidad Rips] = @IdEvaluacion`);

            console.log('Inserción ejecutada con éxito');
            return res.json({ idFactura: facturaId, nuevoConsecutivo });
        } else {
            return res.status(404).json({ error: 'No se encontró ninguna factura con [No Factura] = 0' });
        }
    } catch (error) {
        console.error('Error en la operación:', error.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});



module.exports = router;
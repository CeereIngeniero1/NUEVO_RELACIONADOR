const { Request, TYPES } = require('tedious');
// const jwt = require('jsonwebtoken');
const Router = require('express').Router;
const connection = require('../db');
// const dbConfig = require('../db'); // Asegúrate de importar tu configuración de la BD

const router = Router();

// Endpoint para listar todo lo que hay en la tabla [VISTA_MODALIDAD_ATENCION]
router.get('/ListarMaestroRIPS', async (req, res) => {
    const TipoLista = req.query.Tipo;
    try {
        let Query;
        switch (TipoLista) {
            case 'ModalidadGrupoServicioTecSal':
                Query = 'SELECT * FROM [VISTA_MODALIDAD_ATENCION]';
            break;
            case 'GrupoServicios':
                Query = 'SELECT * FROM [VISTA_GRUPO_SERVICIOS]';
            break;
            case 'CodServicio':
                Query = 'SELECT * FROM [VISTA_SERVICIOS]';
            break;
            case 'FinalidadTecnologiaSalud':
                Query = 'SELECT * FROM [VISTA_FINALIDAD_TECNOLOGIA_SALUD]';
            break;
            case 'CausaMotivoAtencion':
                Query = 'SELECT * FROM [VISTA_CAUSA_MOTIVO_ATENCION]';
            break;     
            case 'ViaIngresoServicioSalud':
                Query = 'SELECT * FROM [VISTA_VIA_INGRESO_SERVICIO_SALUD]';
            break;
        }
        const request = new Request(
            Query,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send(`Error interno del servidor: ${err}`);
                    }
                }
            }
        );

        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.status(200).json(resultados);
                // res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(request);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error obteniendo la lista de modalidades de atención.');
    }
})
// FIN


// Endpoint para actualizar el estdo del elemento
// BUENO BUENO
// router.post('/ActualizarElemento', async (req, res) => {
//     const { Tabla: TablaAActualizar, Id: IdElementoAActualizar, Estado: EstadoAAsignar } = req.body;
//     try {
//         let Query;
//         switch (TablaAActualizar) {
//             case 'ModalidadGrupoServicioTecSal':
//                 Query = `UPDATE [RIPS Modalidad Atención] SET [Id Estado] = @EstadoAAsignar WHERE [Id Modalidad Atencion] = @IdElementoAActualizar`;
//                 break;
//             case 'GrupoServicios':
//                 Query = `UPDATE [RIPS Grupo Servicios] SET [Id Estado] = @EstadoAAsignar WHERE [Id Grupo Servicios] = @IdElementoAActualizar`;
//             break;
//             default:
//                 return res.status(400).send('Tabla no válida');
//         }

//         const request = new Request(Query, (err) => {
//             if (err) {
//                 console.error(`Error de ejecución: ${err}`);
//                 if (!res.headersSent) {
//                     // res.status(500).send(`Error interno del servidor: ${err}`);
//                     res.status(500).json({error: err});
//                 }
//             }
//         });

//         // Agregar parámetros a la consulta
//         request.addParameter('EstadoAAsignar', TYPES.Int, EstadoAAsignar);
//         request.addParameter('IdElementoAActualizar', TYPES.Int, IdElementoAActualizar);

//         request.on('requestCompleted', () => {
//             console.log('Elemento actualizado correctamente');
//             if (!res.headersSent) {
//                 // res.status(200).send('Elemento actualizado correctamente');
//                 res.status(200).json({message: 'Elemento actualizado correctamente'});
//             }
//         });

//         request.on('error', (err) => {
//             console.error('Error en la consulta:', err);
//             if (!res.headersSent) {
//                 res.status(500).send('Error interno del servidor');
//             }
//         });

//         connection.execSql(request);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error actualizando el estado del elemento.');
//     }
// });
//FIN


router.post('/ActualizarElemento', async (req, res) => {
    const { Tabla: TablaAActualizar, Id: IdElementoAActualizar, Estado: EstadoAAsignar } = req.body;

    // Verificar si la conexión está en el estado correcto
    if (connection.state.name !== 'LoggedIn') {
        return res.status(500).json({ error: 'La conexión a la base de datos no está lista.' });
    }

    let Query;
    switch (TablaAActualizar) {
        case 'ModalidadGrupoServicioTecSal':
            Query = `UPDATE [RIPS Modalidad Atención] SET [Id Estado] = @EstadoAAsignar WHERE [Id Modalidad Atencion] = @IdElementoAActualizar`;
        break;
        case 'GrupoServicios':
            Query = `UPDATE [RIPS Grupo Servicios] SET [Id Estado] = @EstadoAAsignar WHERE [Id Grupo Servicios] = @IdElementoAActualizar`;
        break;
        case 'CodServicio':
            Query = `UPDATE [RIPS Servicios] SET [Id Estado] = @EstadoAAsignar WHERE [Id Servicios] = @IdElementoAActualizar`;
        break;
        case 'FinalidadTecnologiaSalud':
            Query = `UPDATE [RIPS Finalidad Consulta Version2] SET [Id Estado] = @EstadoAAsignar WHERE [Id Finalidad Consulta] = @IdElementoAActualizar`;
        break;
        case 'CausaMotivoAtencion':
            Query = `UPDATE [RIPS Causa Externa Version2] SET [Id Estado] = @EstadoAAsignar WHERE [Id RIPS Causa Externa Version2] = @IdElementoAActualizar`;
        break;
        case 'ViaIngresoServicioSalud':
            Query = `UPDATE [RIPS Via Ingreso Usuario] SET [Id Estado] = @EstadoAAsignar WHERE [Id Via Ingreso Usuario] = @IdElementoAActualizar`;
        break;
        default:
            return res.status(400).json({ error: 'Tabla no válida' });
    }

    const request = new Request(Query, (err) => {
        if (err) {
            console.error(`Error de ejecución: ${err}`);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error ejecutando la consulta.' });
            }
        }
    });

    // Agregar parámetros
    request.addParameter('EstadoAAsignar', TYPES.Int, EstadoAAsignar);
    request.addParameter('IdElementoAActualizar', TYPES.Int, IdElementoAActualizar);

    request.on('requestCompleted', () => {
        console.log('Elemento actualizado correctamente');
        if (!res.headersSent) {
            res.status(200).json({ message: 'Elemento actualizado correctamente' });
        }
    });

    request.on('error', (err) => {
        console.error('Error en la consulta:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // Ejecutar la consulta con la conexión global
    connection.execSql(request);
});

router.post('/ActualizarTodo', async (req, res) => {
    const { Tabla: TablaAActualizar, Estado: EstadoAAsignar} = req.body;
    // Verificar si la conexión está en el estado correcto
    if (connection.state.name !== 'LoggedIn') {
        return res.status(500).json({ error: 'La conexión a la base de datos no está lista.' });
    }

    console.log(`Tabla => ${TablaAActualizar} Estdo => ${EstadoAAsignar}`);
    
    let Query;
    switch (TablaAActualizar) {
        case 'ModalidadGrupoServicioTecSal':
            Query = `UPDATE [RIPS Modalidad Atención] SET [Id Estado] = @EstadoAAsignar`;
        break;
        case 'GrupoServicios':
            Query = `UPDATE [RIPS Grupo Servicios] SET [Id Estado] = @EstadoAAsignar`;
        break;
        case 'CodServicio':
            Query = `UPDATE [RIPS Servicios] SET [Id Estado] = @EstadoAAsignar`;
        break;
        case 'FinalidadTecnologiaSalud':
            Query = `UPDATE [RIPS Finalidad Consulta Version2] SET [Id Estado] = @EstadoAAsignar`;
        break;
        case 'CausaMotivoAtencion':
            Query = `UPDATE [RIPS Causa Externa Version2] SET [Id Estado] = @EstadoAAsignar`;
        break;
        case 'ViaIngresoServicioSalud':
            Query = `UPDATE [RIPS Via Ingreso Usuario] SET [Id Estado] = @EstadoAAsignar`;
        break;
        default:
            return res.status(400).json({ error: 'Tabla no válida', consulta: `${Query}` });
    }

    const request = new Request(Query, (err) => {
        if (err) {
            console.error(`Error de ejecución: ${err}`);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error ejecutando la consulta.' });
            }
        }
    });

    // Agregar parámetros
    request.addParameter('EstadoAAsignar', TYPES.Int, EstadoAAsignar);
    // request.addParameter('IdElementoAActualizar', TYPES.Int, IdElementoAActualizar);

    request.on('requestCompleted', () => {
        console.log('Elemento actualizado correctamente');
        if (!res.headersSent) {
            res.status(200).json({ message: 'Elemento actualizado correctamente' });
        }
    });

    request.on('error', (err) => {
        console.error('Error en la consulta:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // Ejecutar la consulta con la conexión global
    connection.execSql(request);
});


module.exports = router;
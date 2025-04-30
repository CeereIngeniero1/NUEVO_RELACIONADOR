const { Request, TYPES } = require('tedious');
const Router = require('express').Router;
const connection = require('../db');
// const pool = require('../db2');
// const { connectToDatabase, config } = require('../db2');
const { sql, poolPromise } = require('../db2'); // Asegúrate de exportar correctamente tu conexión

const router = Router();

router.get('/pruebaHC', async (req, res) => {

    try {
        const request = new Request(
            `SELECT TOP(10) [Id Evaluación Entidad],
            [Documento Entidad], 
            [Fecha Evaluación Entidad] 
            FROM [Evaluación Entidad]`,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }
        );

        const resultados = [];

        request.on('row', (columns) => {
            const hc = {
                idevaluacion: columns[0].value,
                fechaevaluacion: columns[1].value,
                DocPaciente: columns[2].value
            };
            resultados.push(hc);
        });

        request.on('requestCompleted', () => {
            console.log('Resultados de la consulta:');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);  // Envía la respuesta solo si no se ha enviado antes
                // res.status(200).send("holas")
            }
        });

        request.on('error', (err) => {
            console.error('Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });

        connection.execSql(request);
    } catch (error) {
        console.error('Error en la conexión o en la ejecución de la consulta:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


router.get('/DatosUsuario/:IdEvaluacion', async (req, res) => {
    try {
        const IdEvaluacion = req.params.IdEvaluacion;

        const request = new Request(
            `SELECT 
                        [Id Evaluación Entidad], [Id Tipo de Evaluación], [Tipo de Evaluación], [Fecha Evaluación Entidad], [Documento Entidad], Identificacion, [Edad Entidad Evaluación Entidad], [Acompañante Evaluación Entidad], 
                        [Id Parentesco], [Teléfono Acompañante], [Diagnóstico General Evaluación Entidad], [Diagnóstico Específico Evaluación Entidad], [Manejo de Medicamentos], [Dirección Domicilio], [Id Ciudad], [Teléfono Domicilio], 
                        [Fecha Nacimiento], [Id Unidad de Medida Edad], [Id Sexo], [Id Estado], [Id Estado Civil], [Id Ocupación], [Documento Aseguradora], [Id Tipo de Afiliado], [Responsable Evaluación Entidad], [Id Parentesco Responsable], 
                        [Teléfono Responsable], [Documento Usuario], [Documento Empresa], [Id Terminal], [Documento Profesional], [Id Estado Web], [Con Orden], [Firma Evaluación Entidad], Sincronizado, PreguntarControl, NombreFormatoAux
        FROM            [Cnsta Relacionador Info Evaluacion Usuario]
        WHERE        ([Id Evaluación Entidad] = ${IdEvaluacion})
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
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
            res.json(resultados);
        })
        console.log(resultados);
        connection.execSql(request);
        // pool.execSql(request);

    } catch (error) {

    }

});

router.get('/UsuariosHC/:DocumentoUsuario/:fechaInicio/:fechaFin', async (req, res) => {
    try {
        const DocumentoUsuario = req.params.DocumentoUsuario;
        const fechaInicio = req.params.fechaInicio;
        const fechaFin = req.params.fechaFin;

        const request = new Request(
            `SELECT  
                [DocumentoPaciente]
                ,[NombreCompletoPaciente]
            FROM [Cnsta Relacionador Usuarios HC]
            WHERE DocumentoUsuario = '${DocumentoUsuario}' AND CAST(FechaEvaluacion AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}'
            GROUP BY DocumentoPaciente , NombreCompletoPaciente
        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
                    }
                }
            }

        );
        const resultados = [];
        request.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                // row[column.metadata.colName] = column.value;
                row[column.metadata.colName] = String(column.value).replace(/[\n\r\t]/g, '');
            });
            resultados.push(row);
        });

        request.on('requestCompleted', () => {
            res.json(resultados);
        })
        console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


// router.get('/DatosdeUsuarioHC/:DocumentoPaciente', async (req, res) => {
//     try {
//         const DocumentoPaciente = req.params.DocumentoPaciente;
        

//         const request = new Request(
//             `
//         SELECT        DocumentoPaciente, PrimerApellidoPaciente, 
//         SegundoApellidoPaciente, PrimerNombrePaciente, SegundoNombrePaciente, 
//         NombreCompletoPaciente, Sexo, Edad, Direccion, Tel, DocumentoTipoDOC
//         FROM            [Cnsta Relacionador Usuarios Info]
//         WHERE        (DocumentoPaciente = '${DocumentoPaciente}')
//         `,
//             (err) => {
//                 if (err) {
//                     console.error(`Error de ejecución: ${err}`);
//                     // En caso de error, enviamos una respuesta y salimos de la función
//                     if (!res.headersSent) {
//                         res.status(500).send('Error interno del servidor');
//                     }
//                 }
//             }

//         );
//         const resultados = [];
//         request.on('row', (columns) => {
//             const row = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             resultados.push(row);
//         });

//         request.on('requestCompleted', () => {
//             res.json(resultados);
//         })
//         console.log(resultados);
//         connection.execSql(request);
//     } catch (error) {

//     }

// });
router.get('/DatosdeUsuarioHC/:DocumentoPaciente', async (req, res) => {
    try {
        const DocumentoPaciente = req.params.DocumentoPaciente;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('DocumentoPaciente', sql.VarChar(50), DocumentoPaciente) // Usa el tipo y longitud adecuados
            .query(`
                SELECT 
                    DocumentoPaciente, PrimerApellidoPaciente, SegundoApellidoPaciente, 
                    PrimerNombrePaciente, SegundoNombrePaciente, NombreCompletoPaciente, 
                    Sexo, Edad, Direccion, Tel, DocumentoTipoDOC
                FROM [Cnsta Relacionador Usuarios Info]
                WHERE DocumentoPaciente = @DocumentoPaciente
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error('❌ Error al obtener datos del usuario HC:', error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/DatosdeHC/:DocumentoPaciente/:DocumentoUsuario/:fechaInicio/:fechaFin', async (req, res) => {
    try {
        const DocumentoPaciente = req.params.DocumentoPaciente;
        const DocumentoUsuario = req.params.DocumentoUsuario;
        const fechaInicio = req.params.fechaInicio;
        const fechaFin = req.params.fechaFin;
        const request = new Request(
            `
        SELECT          [FechaEvaluacionTexto]
                ,[DocumentoPaciente]
                ,[IdTipodeEvaluacion]
                ,[DescripcionTipodeEvaluación]
                ,[Formato_Diagnostico]
                ,[DiagnósticoEspecíficoEvaluacionEntidad]
                ,[DocumentoUsuario]
                ,[IdEvaluaciónEntidad]
                ,[HoraEvaluacion]
        FROM            [Cnsta Relacionador Info Historias]
        WHERE        (DocumentoPaciente  like '%${DocumentoPaciente}%') 
        AND (CAST(FechaEvaluacion AS DATE) BETWEEN '${fechaInicio}' AND '${fechaFin}') 
        AND (DocumentoUsuario = N'${DocumentoUsuario}')

        `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    // En caso de error, enviamos una respuesta y salimos de la función
                    if (!res.headersSent) {
                        res.status(500).send('Error interno del servidor');
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
            res.json(resultados);
        })
        console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

///////////////////////Endpoint para listas de Rips
router.get('/TipodeRips', async (req, res) => {
    try {
        const request = new Request(
            `
            SELECT        IdTipoRips, CódigoTipoRips, TipoRips, 
            DescripcionTipoRips, IdEstado
            FROM            [Cnsta Relacionador Tipo Rips]
            

            `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
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
                res.json(resultados);
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
        console.error('Error en la conexion o en la ejecucion de la consulta ');
        if (!res.headersSent) {
            res.status(500).send('Error  interno dels servidor')
        }
    }
});

router.get('/Entidad/:Tipo', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;

        const request = new Request(
            `
                SELECT         NombreCompletoPaciente, [Id Función], Función, DocumentoEntidad, IdTipoRips
                FROM            [Cnsta Relacionador Entidades Rips]
                WHERE        (IdTipoRips = ${Tipo})
                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        // res.status(500).send("Error interno de servidor");
                        res.status(500).json(`Error interno de servidor: ${err}`);
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
                res.json(resultados);
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

    }
});

router.get('/Entidad', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;

        const request = new Request(
            `
                SELECT         NombreCompletoPaciente, [Id Función], Función, DocumentoEntidad, IdTipoRips
                FROM            [Cnsta Relacionador Entidades Rips]
                --WHERE        (IdTipoRips = ${Tipo})
                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        // res.status(500).send("Error interno de servidor");
                        res.status(500).json(`Error interno de servidor: ${err}`);
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
                res.json(resultados);
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

    }
});

router.get('/ModalidadAtencion', async (req, res) => {
    try {


        const request = new Request(
            `
             SELECT        IdModalidadAtencion, Codigo, NombreModalidadAtencion, 
             DescripcionModalidadAtencion, OrdenModalidadAtencion, [Id Estado]
                FROM            [Cnsta Relacionador Modalidad Atencion]
                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
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
                res.json(resultados);
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

    }
});

router.get('/GrupoServicios', async (req, res) => {
    try {


        const request = new Request(
            `
              SELECT        IdGrupoServicios, Codigo, NombreGrupoServicios, 
              DescripcionGrupoServicios, [Orden Grupo Servicios], [Id Estado]
                FROM            [Cnsta Relacionador ModalidadGrupoServicioTecSal]
                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
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
                res.json(resultados);
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

    }
});


// router.get('/Servicios/:Tipo', async (req, res) => {
//     try {
//         const Tipo = req.params.Tipo;
//         console.log("Este es el tipo ", Tipo);
//         const request = new Request(
//             `
//                 SELECT        [Id Servicios], [Código Servicios], [Nombre Servicios], [Descripción Servicios], [Id Estado], [Codigo Grupo Servicios],  [Id Grupo Servicios]
//                 FROM            [Cnsta Relacionador Servicios]
//                 WHERE        ( [Id Grupo Servicios] = N'${Tipo}')
//                 `,
//             (err) => {
//                 if (err) {
//                     console.error(`Error de ejecución: ${err}`);
//                     if (!res.headersSent) {
//                         // res.status(500).send("Error interno de servidor");
//                         res.status(500).json(`Error interno de servidor => ${err}`);
//                     }
//                 }
//             }
//         );

//         const resultados = [];
//         request.on('row', (columns) => {
//             const row = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             resultados.push(row);
//         });

//         request.on('requestCompleted', () => {
//             console.log('Resultados de la consulta');
//             console.log(resultados);
//             if (!res.headersSent) {
//                 res.json(resultados);
//             }
//         });

//         request.on('error', (err) => {
//             console.error(' Error en la consulta:', err);
//             if (!res.headersSent) {
//                 // res.status(500).send(`Error interno del servidor => ${err}`);
//                 res.status(500).json(`Error interno de servidor => ${err}`);
//             }
//         });
//         connection.execSql(request);



//     } catch (error) {

//     }
// });


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/Servicios/:Tipo', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;
        console.log("Este es el tipo", Tipo);

        const query = `
            SELECT 
                [Id Servicios], [Código Servicios], [Nombre Servicios], 
                [Descripción Servicios], [Id Estado], [Codigo Grupo Servicios],  
                [Id Grupo Servicios]
            FROM 
                [Cnsta Relacionador Servicios]
            WHERE 
                [Id Grupo Servicios] = @Tipo
        `;

        const request = new Request(query, (err) => {
            if (err) {
                console.error(`Error de ejecución: ${err}`);
                if (!res.headersSent) {
                    res.status(500).json(`Error interno de servidor => ${err}`);
                }
            }
        });

        request.addParameter('Tipo', TYPES.NVarChar, Tipo);

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
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error('Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).json(`Error interno de servidor => ${err}`);
            }
        });

        // Verificar el estado de la conexión antes de ejecutar
        if (connection.state.name === 'LoggedIn') {
            connection.execSql(request);
        } else {
            console.error('La conexión no está en el estado LoggedIn');
            res.status(500).send('Error interno del servidor: Conexión no disponible');
        }

    } catch (error) {
        console.error('Error interno del servidor:', error);
        if (!res.headersSent) {
            res.status(500).json(`Error interno de servidor => ${err}`);
        }
    }
});

router.get('/Servicios', async (req, res) => {
    try {
        // const Tipo = req.params.Tipo;
        // console.log("Este es el tipo", Tipo);

        const query = `
            SELECT 
                [Id Servicios], [Código Servicios], [Nombre Servicios], 
                [Descripción Servicios], [Id Estado], [Codigo Grupo Servicios],  
                [Id Grupo Servicios]
            FROM 
                [Cnsta Relacionador Servicios]
            --WHERE 
            --    [Id Grupo Servicios] = @Tipo
        `;

        const request = new Request(query, (err) => {
            if (err) {
                console.error(`Error de ejecución: ${err}`);
                if (!res.headersSent) {
                    res.status(500).json(`Error interno de servidor => ${err}`);
                }
            }
        });

        // request.addParameter('Tipo', TYPES.NVarChar, Tipo);

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
                res.json(resultados);
            }
        });

        request.on('error', (err) => {
            console.error('Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).json(`Error interno de servidor => ${err}`);
            }
        });

        // Verificar el estado de la conexión antes de ejecutar
        if (connection.state.name === 'LoggedIn') {
            connection.execSql(request);
        } else {
            console.error('La conexión no está en el estado LoggedIn');
            res.status(500).send('Error interno del servidor: Conexión no disponible');
        }

    } catch (error) {
        console.error('Error interno del servidor:', error);
        if (!res.headersSent) {
            res.status(500).json(`Error interno de servidor => ${err}`);
        }
    }
});

router.get('/FinalidadV2/:Tipo', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;

        const request = new Request(
            `
                
                SELECT        IdFinalidadConsulta, Codigo, NombreRIPSFinalidadConsultaVersion2, DescripcionRIPSFinalidadConsultaVersion2, RIPSFinalidadConsultaVersion2, AC, AP, [Id Estado]
                FROM            [Cnsta Relacionador Finalidad]
                WHERE        (${Tipo} = N'Si')

                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
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
                res.json(resultados);
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

    }
});

router.get('/CausaExterna', async (req, res) => {
    try {


        const request = new Request(
            `
              SELECT       [Id RIPS Causa Externa Version2], Codigo, 
              NombreRIPSCausaExternaVersion2, DescripcionRIPSCausaExternaVersion2, 
              RIPSCausaExternaVersion2, [Id Estado]
                FROM            [Cnsta Relacionador Causa Externa]

                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
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
                res.json(resultados);
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

    }
});


router.get('/DXPrincipal', async (req, res) => {
    try {


        const request = new Request(
            `
              SELECT        IdTipodeDiagnósticoPrincipal, CódigoTipodeDiagnósticoPrincipal, 
              TipodeDiagnósticoPrincipal, DescripcionTipodeDiagnósticoPrincipal,
               ordenTipodeDiagnósticoPrincipal, [Id Estado]
                FROM            [Cnsta Relacionador Tipo Diagnostico Principal]

                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
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
                res.json(resultados);
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

    }
});


router.get('/ViaIngresoUsuario', async (req, res) => {
    try {


        const request = new Request(
            `
             SELECT        IdViaIngresoUsuario, Codigo, NombreViaIngresoUsuario,
             DescripcionViaIngresoUsuario, OrdenViaIngresoUsuario, [Id Estado]
            FROM            [Cnsta Relacionador Via Ingreso Usuario]
                `,
            (err) => {
                if (err) {
                    console.error(`Error de ejecución: ${err}`);
                    if (!res.headersSent) {
                        res.status(500).send("Error interno de servidor");
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
                res.json(resultados);
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

    }
});

// router.get('/Cups/:Tipo', async (req, res) => {
//     try {
//         const Tipo = req.params.Tipo;

//         const request = new Request(
//             `
//         SELECT        Codigo, Descripcion, Nombre, Tipo
// FROM            [Cnsta Relacionador Cups]
// WHERE        (Tipo = '${Tipo}')
//             `,
//             (err) => {
//                 if (err) {
//                     console.error(`Error de ejecución: ${err}`);
//                     if (!res.headersSent) {
//                         res.status(500).send("Error interno de servidor");
//                     }
//                 }
//             }
//         );

//         const resultados = [];
//         request.on('row', (columns) => {
//             const row = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             resultados.push(row);
//         });

//         request.on('requestCompleted', () => {
//             console.log('Resultados de la consulta');
//             console.log(resultados);
//             if (!res.headersSent) {
//                 res.json(resultados);
//             }
//         });

//         request.on('error', (err) => {
//             console.error(' Error en la consulta:', err);
//             if (!res.headersSent) {
//                 res.status(500).send('Error interno del servidor');
//             }
//         });
//         connection.execSql(request);



//     } catch (error) {

//     }
// });

// router.get('/Cie', async (req, res) => {
//     try {


//         const request = new Request(
//             `
//         SELECT         Codigo, Nombre, Descripcion, AplicaASexo, EdadMinima, EdadMaxima, 
//         GrupoMortalidad, Extra_V, Extra_VI_Capitulo, SubGrupo, Sexo
// FROM            [Cnsta Relacionador Cie10]
//             `,
//             (err) => {
//                 if (err) {
//                     console.error(`Error de ejecución: ${err}`);
//                     if (!res.headersSent) {
//                         res.status(500).send("Error interno de servidor");
//                     }
//                 }
//             }
//         );

//         const resultados = [];
//         request.on('row', (columns) => {
//             const row = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             resultados.push(row);
//         });

//         request.on('requestCompleted', () => {
//             console.log('Resultados de la consulta');
//             // console.log(resultados);
//             if (!res.headersSent) {
//                 res.json(resultados);
//             }
//         });

//         request.on('error', (err) => {
//             console.error(' Error en la consulta:', err);
//             if (!res.headersSent) {
//                 res.status(500).send('Error interno del servidor');
//             }
//         });
//         connection.execSql(request);



//     } catch (error) {

//     }
// });
router.get('/Cups/:Tipo', async (req, res) => {
    try {
        const Tipo = req.params.Tipo;

        // Esperar a que se resuelva el pool de conexión
        const pool = await poolPromise;  // Asumiendo que tienes un poolPromise configurado

        // Ejecutar la consulta con el pool
        const result = await pool.request()
            .input('Tipo', sql.VarChar, Tipo)  // Usar parámetros para evitar inyecciones SQL
            .query(`
                SELECT 
                    Codigo, Descripcion, Nombre, Tipo
                FROM [Cnsta Relacionador Cups]
                WHERE Tipo = @Tipo
            `);

        // Enviar los resultados
        res.json(result.recordset);  // 'recordset' contiene los datos de la consulta

    } catch (error) {
        console.error('Error al consultar los datos de Cups:', error);
        res.status(500).json({ error: 'Error al obtener los datos de Cups' });
    }
});

router.get('/Cie', async (req, res) => {
    try {
        // Esperar a que se resuelva el pool de conexión
        const pool = await poolPromise;  // Asumiendo que tienes un poolPromise configurado

        // Ejecutar la consulta con el pool
        const result = await pool.request()
            .query(`
                SELECT 
                    Codigo, Nombre, Descripcion, AplicaASexo, EdadMinima, EdadMaxima, 
                    GrupoMortalidad, Extra_V, Extra_VI_Capitulo, SubGrupo, Sexo
                FROM [Cnsta Relacionador Cie10]
            `);

        // Enviar los resultados
        res.json(result.recordset);  // 'recordset' contiene los datos de la consulta

    } catch (error) {
        console.error('Error al consultar los datos CIE:', error);
        res.status(500).json({ error: 'Error al obtener los datos del CIE' });
    }
});
router.post('/RegistrarRips/:IdEvaluacion/:TipoUsuario/:Entidad/:ModalidadGrupoServicioTecSal/:GrupoServicios/:CodServicio/:FinalidadTecnologiaSalud/:CausaMotivoAtencion/:TipoDiagnosticoPrincipal/:ViaIngresoServicioSalud/:Cups1/:Cups2/:Cie1/:Cie2/:TipoRips/:Idfactura/:Idpresupuesto',  (req, res) => {
   


    
    const IdEvaluacion = req.params.IdEvaluacion;
    const TipoUsuario = req.params.TipoUsuario;
    const Entidad = req.params.Entidad;
    const ModalidadGrupoServicioTecSal = req.params.ModalidadGrupoServicioTecSal;
    const GrupoServicios = req.params.GrupoServicios;
    const CodServicio = req.params.CodServicio;
    const FinalidadTecnologiaSalud = req.params.FinalidadTecnologiaSalud;
    const CausaMotivoAtencion = req.params.CausaMotivoAtencion;
    const TipoDiagnosticoPrincipal = req.params.TipoDiagnosticoPrincipal;
    const ViaIngresoServicioSalud = req.params.ViaIngresoServicioSalud;

    const idfactura = req.params.Idfactura;
    
    const Idpresupuesto = req.params.Idpresupuesto;

    const Cups1 = req.params.Cups1;
    let Cups2 = req.params.Cups2;
    //Se evalua si viene = 0 para hacerlo NULL
    if(Cups2 == 0){Cups2 = 'null' }
    const Cie1 = req.params.Cie1.trim();
    let Cie2 = req.params.Cie2;
    if(Cie2 == 0){Cie2 = 'null' }
    const TipoRips = req.params.TipoRips;
    var Actoquirurgico;
    if (TipoRips == 'AC') {
        Actoquirurgico = 1;
    } else if(TipoRips == 'AP') {
        Actoquirurgico = 2;
    }
    // console.log(`IdEvaluacion ${IdEvaluacion}`);
    // console.log(`TipoUsuario ${TipoUsuario}`);
    // console.log(`Entidad ${Entidad}`);
    // console.log(`ModalidadGrupoServicioTecSal ${ModalidadGrupoServicioTecSal}`);
    // console.log(`GrupoServicios ${GrupoServicios}`);
    // console.log(`CodServicio ${CodServicio}`);
    // console.log(`FinalidadTecnologiaSalud ${FinalidadTecnologiaSalud}`);
    // console.log(`CausaMotivoAtencion ${CausaMotivoAtencion}`);
    // console.log(`TipoDiagnosticoPrincipal ${TipoDiagnosticoPrincipal}`);
    // console.log(`ViaIngresoServicioSalud ${ViaIngresoServicioSalud}`);
    // console.log(`Cups1 ${Cups1}`);
    // console.log(`Cups2 ${Cups2}`);
    // console.log(`Cie1 ${Cie1}`);
    // console.log(`Cie2 ${Cie2}`);
    // console.log(`TipoRips ${TipoRips}`);
    // console.log(`IdEvaluacion ${IdEvaluacion}`);

    const requestInsert = new Request(
        `
    INSERT INTO [Evaluación Entidad Rips] 
    (
    [Id Evaluación Entidad] ,
    [Codigo Rips],
    [Codigo Rips2],
    [Diagnostico Rips],
    [Diagnostico Rips2],
    [Id Tipo de Rips],
    [Documento Tipo Rips],
    [Id Causa Externa],
    [Id Tipo de Diagnóstico Principal],
    [Id Finalidad Consulta],
    [Id Acto Quirúrgico],
    [Id Modalidad Atencion],
    [Id Grupo Servicios],
    [Id Servicios],
    [Id Via Ingreso Usuario], 
    [Id Factura],
    [Id Plan de Tratamiento] 
    )
    VALUES 
    (
    @IdEvaluacion,
    @Cups1,
    @Cups2,
    @Cie1,
    @Cie2,
    @TipoUsuario,
    @Entidad,
    @CausaMotivoAtencion,
    @TipoDiagnosticoPrincipal,
    @FinalidadTecnologiaSalud,
    @Actoquirurgico, 
    @ModalidadGrupoServicioTecSal,
    @GrupoServicios,
    @CodServicio,
    @ViaIngresoServicioSalud,
    @IdFactura,
    @idpresupuesto
    ) 
    `, (err) => {
        if (err) {
            console.error('Error al insertar el Rips:', err.message);
            res.status(500).json({ error: 'Error al insertar el RIPS' });
        } else {
            console.log('Inserción ejecutada con éxito');
            res.json({ success: true, message: 'Rips insertado correctamente' });
        }
    });

      // Ajustar los parámetros según las columnas y datos que estás insertando
    requestInsert.addParameter('IdEvaluacion', TYPES.Int, IdEvaluacion);
    requestInsert.addParameter('TipoUsuario', TYPES.Int, TipoUsuario);
    requestInsert.addParameter('Entidad', TYPES.NVarChar, Entidad);
    requestInsert.addParameter('ModalidadGrupoServicioTecSal', TYPES.Int, ModalidadGrupoServicioTecSal);
    requestInsert.addParameter('GrupoServicios', TYPES.Int, GrupoServicios);
    requestInsert.addParameter('CodServicio', TYPES.Int, CodServicio);
    requestInsert.addParameter('FinalidadTecnologiaSalud', TYPES.Int, FinalidadTecnologiaSalud);
    requestInsert.addParameter('CausaMotivoAtencion', TYPES.Int, CausaMotivoAtencion);
    requestInsert.addParameter('TipoDiagnosticoPrincipal', TYPES.Int, TipoDiagnosticoPrincipal);
    requestInsert.addParameter('ViaIngresoServicioSalud', TYPES.Int, ViaIngresoServicioSalud);
    requestInsert.addParameter('Cups1', TYPES.NVarChar, Cups1);
    requestInsert.addParameter('Cups2', TYPES.NVarChar, Cups2);
    requestInsert.addParameter('Cie1', TYPES.NVarChar, Cie1);
    requestInsert.addParameter('Cie2', TYPES.NVarChar, Cie2);
    requestInsert.addParameter('Actoquirurgico', TYPES.Int, Actoquirurgico);
    // console.log(idfactura);
    // const idFacturaValor = Number.isInteger(idfactura) ? idfactura : 0;
    // requestInsert.addParameter('IdFactura', TYPES.Int, idFacturaValor);
    let IdPresupuestoValor = (Idpresupuesto?.toLowerCase?.() === 'null' || Idpresupuesto == null) ? 0 : Idpresupuesto;
    let idFacturaValor     = (idfactura?.toLowerCase?.() === 'null' || idfactura == null) ? 0 : idfactura;

    console.log(IdPresupuestoValor);
    requestInsert.addParameter('IdFactura', TYPES.Int, idFacturaValor);
    requestInsert.addParameter('Idpresupuesto', TYPES.Int, IdPresupuestoValor);

    
connection.execSql(requestInsert);
});


router.post('/TieneRips/:IdEvaluacion', (req, res) =>{
    
    const IdEvaluacion = req.params.IdEvaluacion;
    console.log("sI ENTRE Y MIRA", IdEvaluacion);
    const requestUpdate = new Request(
        `UPDATE [Evaluación Entidad] 
        SET  [Rips] = 0
        WHERE  [Id Evaluación Entidad] = ${IdEvaluacion}`,
        (err) => {
            if (err) {
                console.error('Error al actualizar la historia:', err.message);
                res.status(500).json({error: 'Error añ actualiza la historia'});
            }else{
                console.log('Actualizacion ejecutada con exito');
                res.json({success: true, message: 'Historia ACTUALIZADA Correctamente'})
            }
        }
    );


    connection.execSql(requestUpdate);

});


// APIS PARA MANEJAR LOS RIPS POR DEFECTO/PREDEFINIDOS
router.get('/ConsultarRIPSPorDefecto/:DocumentoProfesional/:TipoRIPS', async (req, res) => {

    try {
        const DocumentoProfesional = req.params.DocumentoProfesional;
        const TipoRIPS = req.params.TipoRIPS;
        const Consulta = new Request(
            `
                SELECT 
                    *
                FROM
                    [ConsultarRIPSPorDefecto]
                WHERE
                    [DocumentoEntidad] = @DocumentoProfesional 
                    AND [TipoDeRips] = @TipoRIPS
            `,
            (err) => {
                if (err) {
                    console.error(`Error al traer los rips predefinidos.. => [${err}]`)
                    if (!res.headersSent) {
                        res.status(500).send(`Error interno de servidor... ${err} `);
                    }
                }
            }
        );

        Consulta.addParameter('DocumentoProfesional', TYPES.NVarChar, DocumentoProfesional);
        Consulta.addParameter('TipoRIPS', TYPES.NVarChar, TipoRIPS);

        const resultados = [];
        Consulta.on('row', (columns) => {
            const row = {};
            columns.forEach((column) => {
                row[column.metadata.colName] = column.value;
            });
            resultados.push(row);
        });

        Consulta.on('requestCompleted', () => {
            console.log('Resultados de la consulta');
            console.log(resultados);
            if (!res.headersSent) {
                res.json(resultados);
            }
        });

        Consulta.on('error', (err) => {
            console.error(' Error en la consulta:', err);
            if (!res.headersSent) {
                res.status(500).send('Error interno del servidor');
            }
        });
        connection.execSql(Consulta);

    } catch (Error) {

    }
})

// CRUD PARA RIPS POR DEFECTO
// Guardar
// router.post('/GuardarRIPSPorDefecto/:DocumentoProfesional/:TipoRIPS', async (req, res) => {
router.post('/GuardarRIPSPorDefecto', async (req, res) => {
    // Se reciben los datos enviados por el cliente
    const { 
        DocumentoProfesional,
        TipoRIPS,
        TipoUsuario,
        Entidad,
        ViaIngresoServicioSalud,
        ModalidadGrupoServicioTecSal,
        GrupoServicio,
        CodigoServicio,
        FinalidadTecnologiaSalud,
        CausaMotivoAtencion,
        TipoDiagnosticoPrincipal,
        ConsultaRIPS1,
        ConsultaRIPS2,
        DiagnosticoRIPS1,
        DiagnosticoRIPS2
    } = req.body;

    // Se ejecuta la consulta para guardar los datos en la base de datos
    try {
        const GuardarRIPSPorDefecto = new Request(`
            INSERT INTO [dbo].[API_RIPS_POR_DEFECTO]
                ([DocumentoEntidad]
                ,[TipoDeRips]
                ,[TipoDeUsuario]
                ,[Entidad]
                ,[ViaIngresoServicioSalud]
                ,[ModalidadGrupoServicioTecnologiaEnSalud]
                ,[GrupoServicios]
                ,[CodigoServicio]
                ,[FinalidadTecnologiaSalud]
                ,[CausaMotivoAtencion]
                ,[TipoDiagnosticoPrincipal]
                ,[Diagnostico1]
                ,[Diagnostico2]
                ,[Procedimiento1]
                ,[Procedimiento2])
            VALUES
                (
                    @DocumentoProfesional,
                    @TipoRIPS,
                    @TipoUsuario,
                    @Entidad,
                    @ViaIngresoServicioSalud,
                    @ModalidadGrupoServicioTecSal,
                    @GrupoServicio,
                    @CodigoServicio,
                    @FinalidadTecnologiaSalud,
                    @CausaMotivoAtencion,
                    @TipoDiagnosticoPrincipal,
                    @Diagnostico1,
                    @Diagnostico2,
                    @Procedimiento1,
                    @Procedimiento2
                )
        `, (err) => {
            if (err) {
                console.error('Error al guardar los rips predefinidos:', err.message);
                return res.status(500).json({ error: 'Error al guardar los rips predefinidos' });
            }
            console.log('Datos guardados correctamente');
            return res.status(200).json({ message: 'Datos guardados correctamente', DocumentoProfesional, TipoRIPS });
        });

        // Se le pasan los parámetros
        GuardarRIPSPorDefecto.addParameter('DocumentoProfesional', TYPES.NVarChar, DocumentoProfesional);
        GuardarRIPSPorDefecto.addParameter('TipoRIPS', TYPES.NVarChar, TipoRIPS);
        GuardarRIPSPorDefecto.addParameter('TipoUsuario', TYPES.NVarChar, TipoUsuario);
        GuardarRIPSPorDefecto.addParameter('Entidad', TYPES.NVarChar, Entidad);
        GuardarRIPSPorDefecto.addParameter('ViaIngresoServicioSalud', TYPES.NVarChar, ViaIngresoServicioSalud);
        GuardarRIPSPorDefecto.addParameter('ModalidadGrupoServicioTecSal', TYPES.NVarChar, ModalidadGrupoServicioTecSal);
        GuardarRIPSPorDefecto.addParameter('GrupoServicio', TYPES.NVarChar, GrupoServicio);
        GuardarRIPSPorDefecto.addParameter('CodigoServicio', TYPES.NVarChar, CodigoServicio);
        GuardarRIPSPorDefecto.addParameter('FinalidadTecnologiaSalud', TYPES.NVarChar, FinalidadTecnologiaSalud);
        GuardarRIPSPorDefecto.addParameter('CausaMotivoAtencion', TYPES.NVarChar, CausaMotivoAtencion);
        GuardarRIPSPorDefecto.addParameter('TipoDiagnosticoPrincipal', TYPES.NVarChar, TipoDiagnosticoPrincipal);
        GuardarRIPSPorDefecto.addParameter('Diagnostico1', TYPES.NVarChar, ConsultaRIPS1);
        GuardarRIPSPorDefecto.addParameter('Diagnostico2', TYPES.NVarChar, ConsultaRIPS2);
        GuardarRIPSPorDefecto.addParameter('Procedimiento1', TYPES.NVarChar, DiagnosticoRIPS1);
        GuardarRIPSPorDefecto.addParameter('Procedimiento2', TYPES.NVarChar, DiagnosticoRIPS2);

        // Se ejecuta la consulta
        connection.execSql(GuardarRIPSPorDefecto);
    } catch (Error) {
        console.error('Error en el guardado:', Error);
        return res.status(500).json({ error: 'Error en el guardado' });
    }
    // res.status(200).json({ message: 'Datos recibidos correctamente', DocumentoProfesional, TipoRIPS });
    // console.log(res);
    const InformacionRecibida = {
        DocumentoProfesional,
        TipoRIPS,
        TipoUsuario,
        Entidad,
        ModalidadGrupoServicioTecSal,
        GrupoServicio,
        CodigoServicio,
        FinalidadTecnologiaSalud,
        CausaMotivoAtencion,
        TipoDiagnosticoPrincipal,
        ConsultaRIPS1,
        ConsultaRIPS2,
        DiagnosticoRIPS1,
        DiagnosticoRIPS2
    }
    console.log(InformacionRecibida);
})
// Actualizar
// router.post('/ActualizarRIPSPorDefecto/:DocumentoProfesional/:TipoRIPS', async (req, res) => {
router.post('/ActualizarRIPSPorDefecto', async (req, res) => {    
    const {
        DocumentoProfesional,
        TipoRIPS,
        TipoUsuario,
        Entidad,
        ViaIngresoServicioSalud,
        ModalidadGrupoServicioTecSal,
        GrupoServicio,
        CodigoServicio,
        FinalidadTecnologiaSalud,
        CausaMotivoAtencion,
        TipoDiagnosticoPrincipal,
        ConsultaRIPS1,
        ConsultaRIPS2,
        DiagnosticoRIPS1,
        DiagnosticoRIPS2
    } = req.body;

    try {
        const ActualizarRIPSPorDefecto = new Request(`
            UPDATE [dbo].[API_RIPS_POR_DEFECTO]
            SET [DocumentoEntidad] = @DocumentoEntidad,
                [TipoDeRips] = @TipoDeRips,
                [TipoDeUsuario] = @TipoDeUsuario,
                [Entidad] = @Entidad,
                [ViaIngresoServicioSalud] = @ViaIngresoServicioSalud,
                [ModalidadGrupoServicioTecnologiaEnSalud] = @ModalidadGrupoServicioTecnologiaEnSalud,
                [GrupoServicios] = @GrupoServicios,
                [CodigoServicio] = @CodigoServicio,
                [FinalidadTecnologiaSalud] = @FinalidadTecnologiaSalud,
                [CausaMotivoAtencion] = @CausaMotivoAtencion,
                [TipoDiagnosticoPrincipal] = @TipoDiagnosticoPrincipal,
                [Diagnostico1] = @Diagnostico1,
                [Diagnostico2] = @Diagnostico2,
                [Procedimiento1] = @Procedimiento1,
                [Procedimiento2] = @Procedimiento2
            WHERE
                [DocumentoEntidad] = @DocumentoEntidad AND
                [TipoDeRips] = @TipoDeRips
        `, (err) => {
            if (err) {
                console.error('Error al actualizar los rips predefinidos:', err.message);
                return res.status(500).json({ error: 'Error al actualizar los rips predefinidos' });
            }
            console.log('Datos actualizados correctamente');
            return res.status(200).json({ message: 'Datos actualizados correctamente' });
        })
        // Se le pasan los parámetros
        ActualizarRIPSPorDefecto.addParameter('DocumentoEntidad', TYPES.NVarChar, req.body.DocumentoProfesional);
        ActualizarRIPSPorDefecto.addParameter('TipoDeRips', TYPES.NVarChar, req.body.TipoRIPS);
        ActualizarRIPSPorDefecto.addParameter('TipoDeUsuario', TYPES.NVarChar, req.body.TipoUsuario);
        ActualizarRIPSPorDefecto.addParameter('Entidad', TYPES.NVarChar, req.body.Entidad);
        ActualizarRIPSPorDefecto.addParameter('ViaIngresoServicioSalud', TYPES.NVarChar, req.body.ViaIngresoServicioSalud);
        ActualizarRIPSPorDefecto.addParameter('ModalidadGrupoServicioTecnologiaEnSalud', TYPES.NVarChar, req.body.ModalidadGrupoServicioTecSal);
        ActualizarRIPSPorDefecto.addParameter('GrupoServicios', TYPES.NVarChar, req.body.GrupoServicio);
        ActualizarRIPSPorDefecto.addParameter('CodigoServicio', TYPES.NVarChar, req.body.CodigoServicio);
        ActualizarRIPSPorDefecto.addParameter('FinalidadTecnologiaSalud', TYPES.NVarChar, req.body.FinalidadTecnologiaSalud);
        ActualizarRIPSPorDefecto.addParameter('CausaMotivoAtencion', TYPES.NVarChar, req.body.CausaMotivoAtencion);
        ActualizarRIPSPorDefecto.addParameter('TipoDiagnosticoPrincipal', TYPES.NVarChar, req.body.TipoDiagnosticoPrincipal);
        ActualizarRIPSPorDefecto.addParameter('Diagnostico1', TYPES.NVarChar, req.body.ConsultaRIPS1);
        ActualizarRIPSPorDefecto.addParameter('Diagnostico2', TYPES.NVarChar, req.body.ConsultaRIPS2);
        ActualizarRIPSPorDefecto.addParameter('Procedimiento1', TYPES.NVarChar, req.body.DiagnosticoRIPS1);
        ActualizarRIPSPorDefecto.addParameter('Procedimiento2', TYPES.NVarChar, req.body.DiagnosticoRIPS2);
        // Se ejecuta la consulta
        connection.execSql(ActualizarRIPSPorDefecto);
    } catch (Error) {
        console.error('Error en la actualización:', Error);
        return res.status(500).json({ error: `Error en la actualización => ${Error}`  });
    }
})
// Eliminar
// router.post('/EliminarRIPSPorDefecto/:DocumentoProfesional/:TipoRIPS', async (req, res) => {
router.post('/EliminarRIPSPorDefecto', async (req, res) => {
    const {
        DocumentoProfesional,
        TipoRIPS
    } = req.body;

    try {
        const EliminarRIPSPorDefecto = new Request(`
            DELETE FROM [dbo].[API_RIPS_POR_DEFECTO]
            WHERE
                [DocumentoEntidad] = @DocumentoProfesional
                AND [TipoDeRips] = @TipoRIPS
        `, (err) => {
            if (err) {
                console.error('Error al eliminar los rips predefinidos:', err.message);
                return res.status(500).json({ error: 'Error al eliminar los rips predefinidos' });
            }
            console.log('Datos eliminados correctamente');
            return res.status(200).json({ message: 'Datos eliminados correctamente' });
        })

        // Se le pasan los parámetros
        EliminarRIPSPorDefecto.addParameter('DocumentoProfesional', TYPES.NVarChar, DocumentoProfesional);
        EliminarRIPSPorDefecto.addParameter('TipoRIPS', TYPES.NVarChar, TipoRIPS);
        // Se ejecuta la consulta
        connection.execSql(EliminarRIPSPorDefecto);
    } catch (Error) {
        console.error('Error al eliminar los rips predefinidos:', Error.message);
        return res.status(500).json({ error: 'Error al eliminar los rips predefinidos' });
    }
})


// FUNCIONALIDAD PARA CONUSLTAR FACTURAS Y PRESUPUESTOS DEL PACIENTE
// router.get('/ConsultarFacturas/:DocumentoPaciente', (req, res) => {
//     const DocumentoPaciente = req.params.DocumentoPaciente;

//     // Crear la consulta
//     const request = new Request(`
//         SELECT *
//         FROM [ConsultaFacturasPaciente]
//         WHERE [DocumentoPaciente] = @DocumentoPaciente
//         ORDER BY [FechaFactura] DESC
//     `, (err) => {
//         if (err) {
//             console.error(`Error al traer las facturas del paciente con documento ${DocumentoPaciente}. => [${err}]`);
//             if (!res.headersSent) {
//                 res.status(500).json(`Error al consultar las facturas del paciente con documento => ${DocumentoPaciente}. Error => ${err.message}`);
//             }
//         }
//     });

//     // Agregar el parámetro a la consulta
//     request.addParameter('DocumentoPaciente', TYPES.VarChar, DocumentoPaciente);

//     const resultados = [];
//     request.on('row', (columns) => {
//         const row = {};
//         columns.forEach((column) => {
//             row[column.metadata.colName] = column.value;
//         });
//         resultados.push(row);
//     });

//     request.on('requestCompleted', () => {
//         console.log('Resultados de la consulta:', resultados);
//         if (!res.headersSent) {
//             res.json(resultados);
//         }
//     });

//     request.on('error', (err) => {
//         console.error('Error en la consulta:', err);
//         if (!res.headersSent) {
//             res.status(500).send('Error interno del servidor');
//         }
//     });

//     // Ejecutar la consulta usando el pool
//     pool.execSql(request);
// });

router.get('/ConsultarFacturas/:DocumentoPaciente', async (req, res) => {
    try {
        const DocumentoPaciente = req.params.DocumentoPaciente;

                // Esperar el pool de conexión
                const pool = await poolPromise;

                        // Ejecutar la consulta
        const result = await pool.request()
        .input('DocumentoPaciente', sql.VarChar, DocumentoPaciente)
        .query(`
            SELECT *
            FROM [ConsultaFacturasPaciente]
            WHERE [DocumentoPaciente] = @DocumentoPaciente
            ORDER BY [FechaFactura] DESC
        `);

                // Enviar resultados
                res.json(result.recordset);
    } catch (error) {
        console.error(`❌ Error al consultar facturas para el documento ${req.params.DocumentoPaciente}:`, error);
        res.status(500).json({ error: 'Error al consultar las facturas del paciente.' });
    }
});


// router.get('/ConsultarPresupuestos/:DocumentoPaciente', async (req, res) => {
//     try {
//         const DocumentoPaciente = req.params.DocumentoPaciente;
//         const request = new Request(`
//             SELECT 
//                 *
//             FROM 
//                 [ConsultaPresupuestosPaciente]
//             WHERE
//                 ( [DocumentoPaciente] = @DocumentoPaciente ) AND
//                 ( [FormaDePago] = 5 )
//             ORDER BY
//                 [FechaPresupuesto] DESC
//         `, (err) => {
//             if (err) {
//                 console.error(`Error al traer los presupuestos del paciente con documento ${req.params.DocumentoPaciente}. => [${err}]`);
//                 if (!res.headersSent) {
//                     res.status(500).json(`Error al consultar los presupuestos del paciente con documento => ${req.params.DocumentoPaciente}. Error => ${err.message}`);
//                 }
//             }
//         });

//         // Agregar el parámetro a la consulta
//         request.addParameter('DocumentoPaciente', TYPES.VarChar, DocumentoPaciente);
//         const resultados = [];
//         request.on('row', (columns) => {
//             const row = {};
//             columns.forEach((column) => {
//                 row[column.metadata.colName] = column.value;
//             });
//             resultados.push(row);
//         });

//         request.on('requestCompleted', () => {
//             console.log('Resultados de la consulta:', resultados);
//             if (!res.headersSent) {
//                 res.json(resultados);
//             }
//         });

//         request.on('error', (err) => {
//             console.error('Error en la consulta:', err);
//             if (!res.headersSent) {
//                 res.status(500).send('Error interno del servidor');
//             }
//         });

//         // Ejecutar la consulta usando el pool
//         pool.execSql(request);
//     } catch (Error) {
//         console.error('Error en la consulta de presupuestos:', Error);
//         return res.status(500).json({ error: `Error en la consulta de presupuestos => ${Error}` });
//     }
// });

router.get('/ConsultarPresupuestos/:DocumentoPaciente', async (req, res) => {
    try {
        const DocumentoPaciente = req.params.DocumentoPaciente;

        // Esperar el pool de conexión
        const pool = await poolPromise;

        // Ejecutar la consulta
        const result = await pool.request()
            .input('DocumentoPaciente', sql.VarChar, DocumentoPaciente)
            .query(`
                SELECT 
                    *
                FROM 
                    [ConsultaPresupuestosPaciente]
                WHERE
                    ( [DocumentoPaciente] = @DocumentoPaciente ) AND
                    ( [FormaDePago] = 5 )
                ORDER BY
                    [FechaPresupuesto] DESC
            `);

        // Enviar resultados
        res.json(result.recordset);

    } catch (error) {
        console.error(`❌ Error al consultar presupuestos para el documento ${req.params.DocumentoPaciente}:`, error);
        res.status(500).json({ error: 'Error al consultar los presupuestos del paciente.' });
    }
});
// =================================================================================================
module.exports = router;
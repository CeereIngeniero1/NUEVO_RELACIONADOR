const { Request, TYPES } = require('tedious');
const Router = require('express').Router;
const connection = require('../db');
// const pool = require('../db2');
// const { connectToDatabase, config } = require('../db2');
const { sql, poolPromise } = require('../db2');

class ICD11_API {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.token = null;
        this.tokenExpiry = null;
        this.baseUrl = 'https://id.who.int/icd/release/11/2024-01/mms';
    }

    async getAccessToken() {
        if (this.token && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        const authUrl = 'https://icdaccessmanagement.who.int/connect/token';
        const params = new URLSearchParams({
            'client_id': this.clientId,
            'client_secret': this.clientSecret,
            'scope': 'icdapi_access',
            'grant_type': 'client_credentials'
        });

        try {
            const response = await fetch(authUrl, {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const data = await response.json();
            this.token = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000);
            return this.token;
        } catch (error) {
            console.error('Error obteniendo el token:', error);
        }
    }

    async search(query) {
        const token = await this.getAccessToken();

        try {
            const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Accept-Language': 'es',
                    'API-Version': 'v2'
                }
            });
            const data = await response.json();
            return data.destinationEntities;
        } catch (error) {
            console.error('Error en la búsqueda:', error);
        }
    }
}

const icd11 = new ICD11_API(
    '1913f18a-af2d-48d8-9df4-9433f2bf9731_5f1075a7-1c1d-4769-b8ad-b781f383f2cd',
    'BG8b5btjWH12ePWemxjurAfyOLXTllz7HL4C2BpohUk='
);

const defaultCIE11 = [
    { theCode: '1B10', title: 'Tuberculosis de los pulmones' },
    { theCode: '5A11', title: 'Diabetes mellitus tipo 2' },
    { theCode: 'BA41', title: 'Insuficiencia cardíaca' },
    { theCode: '1D0Z', title: 'Infección viral de sitio no especificado' },
    { theCode: '6D70', title: 'Trastorno de ansiedad generalizada' }
];

const router = Router();

router.get('/icd11/search/:query?', async (req, res) => {
    try {
        const query = req.params.query;
        if (!query || query.trim() === "" || query === "undefined") {
            return res.json(defaultCIE11);
        }
        const results = await icd11.search(query);
        res.json(results || []);
    } catch (error) {
        console.error('Error en ruta de búsqueda CIE-11:', error);
        res.status(500).send(error.message);
    }
});

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
                 IdTipodeDocumento, DescripciTipoDocumento, TipoDocumentoBase, DocumentoPaciente, PrimerApellidoBase, SegundoApellidoBase, PrimerNombreBase, SegundoNombreBase, NombreCompletoPaciente, SexoPaciente, Sexo, 
                  CódigoSexo, IdSexo, Edad, Direccion, Tel, DocumentoTipoDOC, FechaNacimientoBase, [Id Sexo], [Id Identidad Genero], IdSexoIdentidadGenero, codigoIdentidadGeneroBase, IdentidadGeneroBase, [Id Zona Residencia], Talla, Peso, 
                  [Id Etnia], ComunidadEtnica, [Id Discapacidad], IdPaisNacionalidad, CodigoPaisNacionalidad, NombrePaisNACIONALIDAD, IdPaisRecidencia, CodigoPaisRecidencia, NombrePaisRecidencia, IdMunicipioRecidencia, 
                  CodigoMunicipioRecidencia, NombreMunicipioRecidencia, IdZonaResidencia, DescripciónZonaResidencia, CódigoZonaResidencia, ZonaResidencia, IdEtnia, CódigoEtnia, Etnia, DescripciónEtnia, IdDiscapacidad, Codigo, Discapacidad, 
                  DescripcionDiscapacidad, IdOcupación, CódigoOcupación, Ocupación, DescripciónOcupación
FROM     [Cnsta Relacionador Usuarios Info]
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
              SELECT       [Id RIPS Causa Externa Version2] AS IdRIPSCausaExternaVersion2, Codigo, 
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
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT 
                    Codigo, Nombre, Descripcion, AplicaASexo, EdadMinima, EdadMaxima, 
                    GrupoMortalidad, Extra_V, Extra_VI_Capitulo, SubGrupo, Sexo
                FROM [Cnsta Relacionador Cie10]
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al consultar los datos CIE:', error);
        res.status(500).json({ error: 'Error al obtener los datos del CIE' });
    }
});

router.get('/Cie/:Busqueda', async (req, res) => {
    const Busqueda = req.params.Busqueda;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + Busqueda + '%')
            .query(`
                SELECT TOP 100 Codigo, Nombre, Descripcion, AplicaASexo, EdadMinima, EdadMaxima, 
                    GrupoMortalidad, Extra_V, Extra_VI_Capitulo, SubGrupo, Sexo
                FROM [Cnsta Relacionador Cie10]
                WHERE Codigo LIKE @Busqueda OR Nombre LIKE @Busqueda OR Descripcion LIKE @Busqueda
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al buscar CIE:', error);
        res.status(500).json({ error: 'Error al buscar CIE' });
    }
});
router.post('/RegistrarRips/:IdEvaluacion/:TipoUsuario/:Entidad/:ModalidadGrupoServicioTecSal/:GrupoServicios/:CodServicio/:FinalidadTecnologiaSalud/:CausaMotivoAtencion/:TipoDiagnosticoPrincipal/:ViaIngresoServicioSalud/:Cups1/:Cups2/:Cie1/:Cie2/:TipoRips/:Idfactura/:Idpresupuesto/:DocumentoEntidad', (req, res) => {




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

    const DocumentoEntidad = req.params.DocumentoEntidad;

    const Cups1 = req.params.Cups1;
    let Cups2 = req.params.Cups2;
    //Se evalua si viene = 0 para hacerlo NULL
    if (Cups2 == 0) { Cups2 = 'null' }
    const Cie1 = req.params.Cie1.trim();
    let Cie2 = req.params.Cie2;
    if (Cie2 == 0) { Cie2 = 'null' }
    const TipoRips = req.params.TipoRips;
    var Actoquirurgico;
    if (TipoRips == 'AC') {
        Actoquirurgico = 1;
    } else if (TipoRips == 'AP') {
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
    let idFacturaValor = (idfactura?.toLowerCase?.() === 'null' || idfactura == null) ? 0 : idfactura;

    console.log(IdPresupuestoValor);
    requestInsert.addParameter('IdFactura', TYPES.Int, idFacturaValor);
    requestInsert.addParameter('Idpresupuesto', TYPES.Int, IdPresupuestoValor);


    connection.execSql(requestInsert);
});


router.post('/TieneRips/:IdEvaluacion', (req, res) => {

    const IdEvaluacion = req.params.IdEvaluacion;
    console.log("sI ENTRE Y MIRA", IdEvaluacion);
    const requestUpdate = new Request(
        `UPDATE [Evaluación Entidad] 
        SET  [Rips] = 0
        WHERE  [Id Evaluación Entidad] = ${IdEvaluacion}`,
        (err) => {
            if (err) {
                console.error('Error al actualizar la historia:', err.message);
                res.status(500).json({ error: 'Error añ actualiza la historia' });
            } else {
                console.log('Actualizacion ejecutada con exito');
                res.json({ success: true, message: 'Historia ACTUALIZADA Correctamente' })
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
        return res.status(500).json({ error: `Error en la actualización => ${Error}` });
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
// =====ReSOLUCION 1888======


router.get('/Paises', async (req, res) => {

    try {

        const request = new Request(
            `
        SELECT  IdPais1888, Codigo, Nombre + ' (' + Codigo + ')' as Nombre, Estado
        FROM     [Cnsta Pais 1888]

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/Paises/:NombrePais', async (req, res) => {
    const NombrePais = req.params.NombrePais;
    try {

        const request = new Request(
            `
        SELECT  IdPais1888, Codigo, Nombre + ' (' + Codigo + ')' as Nombre, Estado
        FROM     [Cnsta Pais 1888]
        Where Nombre like '%${NombrePais}%' OR Codigo like '%${NombrePais}%'

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Ciudades', async (req, res) => {
    try {

        const request = new Request(
            `
        SELECT  IdCiudad1888, Codigo, Nombre + ' (' + Codigo + ')' as Nombre, Estado
        FROM     [Cnsta Ciudad 1888]

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Ciudades/:NombreCiudad', async (req, res) => {
    const NombreCiudad = req.params.NombreCiudad;
    try {

        const request = new Request(
            `
        SELECT  IdCiudad1888, Codigo, Nombre + ' (' + Codigo + ')' as Nombre, Estado
        FROM     [Cnsta Ciudad 1888]
        Where Nombre like '%${NombreCiudad}%' OR Codigo like '%${NombreCiudad}%'

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/TipoDocumento', async (req, res) => {
    try {

        const request = new Request(
            `
        SELECT  IdTipodeDocumento, CódigoTipoDocumento, TipoDocumento, DescripciónTipoDocumento
            FROM     [Cnsta Tipodocumento 1888]

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/TipoDocumento/:NombreTipoDocumento', async (req, res) => {
    const NombreTipoDocumento = req.params.NombreTipoDocumento;
    try {

        const request = new Request(
            `
        SELECT  IdTipodeDocumento, CódigoTipoDocumento, TipoDocumento, DescripciónTipoDocumento
            FROM     [Cnsta Tipodocumento 1888]
            where TipoDocumento like '%${NombreTipoDocumento}%' OR CódigoTipoDocumento like '%${NombreTipoDocumento}%'

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Sexo/:Sexo', async (req, res) => {
    const Sexo = req.params.Sexo;
    try {

        const request = new Request(
            `
        SELECT   IdSexo, CódigoSexo, Sexo, [Descripción Sexo]
        FROM     [Cnsta Sexo 1888]
            where Sexo like '%${Sexo}%'

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Sexo/', async (req, res) => {

    try {

        const request = new Request(
            `
        SELECT   IdSexo,   Sexo as CódigoSexo, [Descripción Sexo] as Sexo
        FROM     [Cnsta Sexo 1888] 

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/identidadSexo/:identidadSexo', async (req, res) => {
    const identidadSexo = req.params.identidadSexo;
    try {

        const request = new Request(
            `
        SELECT   IdSexoIdentidadGenero, Codigo, IdentidadGenero, DescripcionIdentidadGenero
        FROM     [Cnsta SexoIdentidad 1888]
            where DescripcionIdentidadGenero like '%${identidadSexo}%'

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/identidadSexo/', async (req, res) => {

    try {

        const request = new Request(
            `
         SELECT   IdSexoIdentidadGenero, Codigo, IdentidadGenero, DescripcionIdentidadGenero
        FROM     [Cnsta SexoIdentidad 1888] 

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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/ZonaTerritorial/', async (req, res) => {

    try {

        const request = new Request(
            `
      SELECT   IdZonaResidencia, ZonaResidencia, DescripciónZonaResidencia
FROM     [Cnsta ZonaResidencia 1888]
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/ZonaTerritorial/:ZonaTerritorial', async (req, res) => {

    const ZonaTerritorial = req.params.ZonaTerritorial;
    try {

        const request = new Request(
            `
        SELECT    IdZonaResidencia, ZonaResidencia, DescripciónZonaResidencia
FROM     [Cnsta ZonaResidencia 1888]
            where DescripciónZonaResidencia like '%${ZonaTerritorial}%'
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/Etnia/:Etnia', async (req, res) => {

    const Etnia = req.params.Etnia;
    try {

        const request = new Request(
            ` 
            SELECT  IdEtnia, CódigoEtnia, Etnia, DescripciónEtnia, IdEstado
FROM     [Cnsta Etnia 1888]
where DescripciónEtnia like '%${Etnia}%' OR CódigoEtnia like '%${Etnia}%'
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Etnia', async (req, res) => {

    try {

        const request = new Request(
            ` 
            SELECT  IdEtnia, CódigoEtnia, Etnia, DescripciónEtnia, IdEstado
FROM     [Cnsta Etnia 1888] 
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Discapacidad/', async (req, res) => {

    try {

        const request = new Request(
            ` 
           SELECT  IdDiscapacidad, Codigo, Discapacidad, DescripcionDiscapacidad
FROM     [Cnsta Discapacidad 1888] 
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Discapacidad/:Discapacidad', async (req, res) => {

    const Discapacidad = req.params.Discapacidad;
    try {

        const request = new Request(
            ` 
          SELECT   IdDiscapacidad, Codigo, Discapacidad, DescripcionDiscapacidad
FROM     [Cnsta Discapacidad 1888]
where DescripcionDiscapacidad like '%${Discapacidad}%' OR Codigo like '%${Discapacidad}%'
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Ocupacion/', async (req, res) => {

    try {

        const request = new Request(
            ` 
         SELECT   IdOcupacion, CodigoOcupacion, DescripcionOcupacion, [Id Estado]
FROM     [Cnsta Ocupacion 1888]
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});


router.get('/Ocupacion/:Ocupacion', async (req, res) => {

    const Ocupacion = req.params.Ocupacion;
    try {

        const request = new Request(
            ` 
         SELECT   IdOcupacion, CodigoOcupacion, DescripcionOcupacion, [Id Estado]
FROM     [Cnsta Ocupacion 1888]
where DescripcionOcupacion like '%${Ocupacion}%' OR CodigoOcupacion like '%${Ocupacion}%'
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

// =================================================================================================

// ==============================Actualizar paciente desde asignar rips ==============

router.post('/ActualizarPaciente', async (req, res) => {
    const {
        IdTipoDocumento,
        Documento,
        PrimerApellido,
        SegundoApellido,
        PrimerNombre,
        SegundoNombre,
        FechaNacimiento,
        Edad,
        SexoBio,
        SexoIdenti,
        IdNacionalidad,
        Talla,
        Peso,
        IdResidencia,
        IdMunicipio,
        IdZonaTerritorial,
        Direccion,
        IdEtnia,
        ComunidadEtnica,
        IdDiscapacidad,
        Telefono,
        IdOcupacion
    } = req.body;

    const fechaNacimientoValida = FechaNacimiento ? new Date(FechaNacimiento) : null;

    if (FechaNacimiento && isNaN(fechaNacimientoValida.getTime())) {
        return res.status(400).json({
            success: false,
            message: 'FechaNacimiento no tiene un formato válido'
        });
    }


    if (!Documento || Documento.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El campo Documento es obligatorio'
        });
    }

    const resultados = [];

    const request = new Request('sp_Paciente_Guardar', (err, rowCount) => {
        if (err) {
            console.error('Error al ejecutar el procedimiento:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Error al ejecutar el procedimiento almacenado'
            });
        }

        console.log('Procedimiento ejecutado con éxito');
        return res.json({
            success: true,
            message: 'Paciente guardado correctamente',
            rowsAffected: rowCount,
            data: resultados
        });
    });

    request.addParameter('IdTipoDocumento', TYPES.Int, IdTipoDocumento);
    request.addParameter('Documento', TYPES.NVarChar, Documento);
    request.addParameter('PrimerApellido', TYPES.NVarChar, PrimerApellido || null);
    request.addParameter('SegundoApellido', TYPES.NVarChar, SegundoApellido || null);
    request.addParameter('PrimerNombre', TYPES.NVarChar, PrimerNombre || null);
    request.addParameter('SegundoNombre', TYPES.NVarChar, SegundoNombre || null);
    request.addParameter('FechaNacimiento', TYPES.DateTime, fechaNacimientoValida);
    request.addParameter('Edad', TYPES.NVarChar, Edad || null);
    request.addParameter('SexoBio', TYPES.Int, SexoBio);
    request.addParameter('SexoIdenti', TYPES.Int, SexoIdenti);
    request.addParameter('IdNacionalidad', TYPES.Int, IdNacionalidad);
    request.addParameter('Talla', TYPES.NVarChar, Talla || null);
    request.addParameter('Peso', TYPES.NVarChar, Peso || null);
    request.addParameter('IdResidencia', TYPES.Int, IdResidencia);
    request.addParameter('IdMunicipio', TYPES.Int, IdMunicipio);
    request.addParameter('IdZonaTerritorial', TYPES.Int, IdZonaTerritorial);
    request.addParameter('Direccion', TYPES.NVarChar, Direccion || null);
    request.addParameter('IdEtnia', TYPES.Int, IdEtnia);
    request.addParameter('ComunidadEtnica', TYPES.NVarChar, ComunidadEtnica || null);
    request.addParameter('IdDiscapacidad', TYPES.Int, IdDiscapacidad);
    request.addParameter('Telefono', TYPES.NVarChar, Telefono || null);
    request.addParameter('IdOcupacion', TYPES.Int, IdOcupacion);

    request.on('row', columns => {
        const fila = {};

        columns.forEach(column => {
            fila[column.metadata.colName] = column.value;
        });

        resultados.push(fila);
    });

    connection.callProcedure(request);
});


// =================================================================================================


// ==============================RDA PACIENTE ==============




router.get('/SSGSSS/:SSGSSS', async (req, res) => {

    const SSGSSS = req.params.SSGSSS;
    try {

        const request = new Request(
            ` 
         SELECT   Idsgsss, Codigo, Nombre, IdEstado, IdRegimen, NombreRegimen, Descripcion
            FROM     [Cnsta Entidad SSGSSS 1888]
            where Descripcion like '%${SSGSSS}%' OR Codigo like '%${SSGSSS}%'
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/SSGSSS/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT Idsgsss, Codigo, Nombre, IdEstado, IdRegimen, NombreRegimen, Descripcion
            FROM [Cnsta Entidad SSGSSS 1888]
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener SSGSSS:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});



router.get('/Profesionales/:Profesional', async (req, res) => {

    const Profesional = req.params.Profesional;
    try {

        const request = new Request(
            ` 
         SELECT   Documento, Nombres
            FROM     [Cnsta VB Todos - Profesional - Orden Alfabético]
            where Nombres like '%${Profesional}%' OR Documento like '%${Profesional}%'
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

router.get('/Profesionales/', async (req, res) => {

    try {

        const request = new Request(
            ` 
         SELECT   Documento, Nombres
            FROM     [Cnsta VB Todos - Profesional - Orden Alfabético]
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
        // console.log(resultados);
        connection.execSql(request);
    } catch (error) {

    }

});

// =================================================================================================
// ==========================RDA=====================================

router.get('/Empresas/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT IdEmpresa, DocumentoEmpresa, IdTipodeDocumento, FechaExpediciónEmpresa, IdCiudad, NombreComercialEmpresa, RazonSocialEmpresa, [FechaInscripción}Empresa], CódigoEmpresa, ObservacionesEmpresa, 
                   FotoEmpresa, IdEstado, NroIDPrestador 
            FROM [Cnsta Empresa 1888]
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Empresas:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


// =================================================================================================
// ==========================Medicamentos DCI=====================================

router.get('/MedicamentosDCI/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT   IDMedicamentoDCI1888, Codigo, Descripcion, IdEstado
            FROM     [Cnsta Medicamentos DCI 1888]
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Medicamentos DCI:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});

router.get('/MedicamentosDCI/:MedicamentoDCI', async (req, res) => {
    const MedicamentoDCI = req.params.MedicamentoDCI;
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT  IDMedicamentoDCI1888, Codigo, Descripcion, IdEstado
            FROM     [Cnsta Medicamentos DCI 1888]
            Where Descripcion like '%${MedicamentoDCI}%' OR Codigo like '%${MedicamentoDCI}%'
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Medicamentos DCI:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


router.get('/Cups1888/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT Tabla, Codigo, Nombre, Descripcion, Tipo
            FROM [Cnsta Cups 1888]
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Cups:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});

router.get('/Cups1888/:Cups', async (req, res) => {
    const Cups = req.params.Cups;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + Cups + '%')
            .query(`
            SELECT TOP 100 Tabla, Codigo, Nombre, Descripcion, Tipo
            FROM [Cnsta Cups 1888]
            WHERE Descripcion LIKE @Busqueda OR Codigo LIKE @Busqueda OR Nombre LIKE @Busqueda
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Cups:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


router.post('/EvaluacionEntidadRDA/', async (req, res) => {
    const {
        DocumentoEntidad, FechaRDA, IdTipoDocumento,
        PrimerApellidoEntidad, SegundoApellidoEntidad, PrimerNombreEntidad, SegundoNombreEntidad,
        FechaNacimiento, Edad, IdUnidaddeMedidaEdad, IdSexoBiologico, IdIdentidadGenero,
        IdPaisNacionalidad, Talla, Peso, IdPaisRecidencia, IdMunicipioRecidencia,
        IdZonaResidencia, Direccion, IdEtnia, ComunidadEtnica, IdDiscapacidad,
        TelefonoCelular, Alergeno,
        // Campos RDA Paciente (Resolución 1888)
        CodigoPrestador, CodigoAdminPlanBeneficios, NombreAdminPlanBeneficios,
        FechaHoraInicioAtencion, FechaHoraFinAtencion,
        TipoDocProfesional, NumDocProfesional,
        DiagnosticoIngresoCIE11Codigo, DiagnosticoIngresoCIE11Termino,
        TipoAlergia,
        IdModalidadAtencion, IdGrupoServicios,
        NitPrestadorIPS, NombrePrestadorIPS,
    } = req.body;

    // Convierte un string de fecha en objeto Date; null si no es válido
    const toDate = (str) => {
        if (!str) return null;
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    };

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('DocumentoEntidad',              sql.NVarChar,  DocumentoEntidad                 || null)
            .input('FechaRDA',                      sql.DateTime2, toDate(FechaRDA)                 || new Date())
            .input('IdTipoDocumento',               sql.Int,       IdTipoDocumento                  ? parseInt(IdTipoDocumento)         : null)
            .input('PrimerApellidoEntidad',         sql.NVarChar,  PrimerApellidoEntidad            || null)
            .input('SegundoApellidoEntidad',        sql.NVarChar,  SegundoApellidoEntidad           || null)
            .input('PrimerNombreEntidad',           sql.NVarChar,  PrimerNombreEntidad              || null)
            .input('SegundoNombreEntidad',          sql.NVarChar,  SegundoNombreEntidad             || null)
            .input('FechaNacimiento',               sql.DateTime2, toDate(FechaNacimiento)          || null)
            .input('Edad',                          sql.Float,     Edad                             ? parseFloat(Edad) : null)
            .input('IdUnidaddeMedidaEdad',          sql.Int,       IdUnidaddeMedidaEdad             ? parseInt(IdUnidaddeMedidaEdad)    : null)
            .input('IdSexoBiologico',               sql.Int,       IdSexoBiologico                  ? parseInt(IdSexoBiologico)         : null)
            .input('IdIdentidadGenero',             sql.Int,       IdIdentidadGenero                ? parseInt(IdIdentidadGenero)       : 0)
            .input('IdPaisNacionalidad',            sql.Int,       IdPaisNacionalidad               ? parseInt(IdPaisNacionalidad)      : null)
            .input('Talla',                         sql.NVarChar,  Talla                            || '0')
            .input('Peso',                          sql.NVarChar,  Peso                             || '0')
            .input('IdPaisRecidencia',              sql.Int,       IdPaisRecidencia                 ? parseInt(IdPaisRecidencia)        : null)
            .input('IdMunicipioRecidencia',         sql.Int,       IdMunicipioRecidencia            ? parseInt(IdMunicipioRecidencia)   : null)
            .input('IdZonaResidencia',              sql.Int,       IdZonaResidencia                 ? parseInt(IdZonaResidencia)        : null)
            .input('Direccion',                     sql.NVarChar,  Direccion                        || null)
            .input('IdEtnia',                       sql.Int,       IdEtnia                          ? parseInt(IdEtnia)                 : 0)
            .input('ComunidadEtnica',               sql.NVarChar,  ComunidadEtnica                  || '')
            .input('IdDiscapacidad',                sql.Int,       IdDiscapacidad                   ? parseInt(IdDiscapacidad)          : 0)
            .input('TelefonoCelular',               sql.NVarChar,  TelefonoCelular                  || null)
            .input('Alergeno',                      sql.NVarChar,  Alergeno                         || null)
            // Campos RDA Paciente (Resolución 1888)
            .input('CodigoPrestador',               sql.NVarChar,  CodigoPrestador                  || null)
            .input('CodigoAdminPlanBeneficios',     sql.NVarChar,  CodigoAdminPlanBeneficios        || null)
            .input('NombreAdminPlanBeneficios',     sql.NVarChar,  NombreAdminPlanBeneficios        || null)
            .input('FechaHoraInicioAtencion',       sql.DateTime2, toDate(FechaHoraInicioAtencion)  || null)
            .input('FechaHoraFinAtencion',          sql.DateTime2, toDate(FechaHoraFinAtencion)     || null)
            .input('TipoDocProfesional',            sql.NVarChar,  TipoDocProfesional               || null)
            .input('NumDocProfesional',             sql.NVarChar,  NumDocProfesional                || null)
            .input('DiagnosticoIngresoCIE11Codigo', sql.NVarChar,  DiagnosticoIngresoCIE11Codigo    || null)
            .input('DiagnosticoIngresoCIE11Termino',sql.NVarChar,  DiagnosticoIngresoCIE11Termino   || null)
            .input('TipoAlergia',                   sql.NVarChar,  TipoAlergia                      || null)
            .input('IdModalidadAtencion',           sql.Int,       IdModalidadAtencion != null && IdModalidadAtencion !== '' ? parseInt(IdModalidadAtencion, 10) : null)
            .input('IdGrupoServicios',              sql.Int,       IdGrupoServicios != null && IdGrupoServicios !== '' ? parseInt(IdGrupoServicios, 10) : null)
            .input('NitPrestadorIPS',               sql.NVarChar,  NitPrestadorIPS                  || null)
            .input('NombrePrestadorIPS',            sql.NVarChar,  NombrePrestadorIPS               || null)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA]
                (
                    [Documento Entidad], [Fecha RDA], [Id Tipo Documento],
                    [Primer Apellido Entidad], [Segundo Apellido Entidad],
                    [Primer Nombre Entidad], [Segundo Nombre Entidad],
                    [Fecha Nacimiento], [Edad], [Id Unidad de Medida Edad],
                    [Id Sexo Biologico], [Id Identidad Genero], [Id Pais Nacionalidad],
                    [Talla], [Peso], [Id Pais Recidencia], [Id Municipio Recidencia],
                    [Id Zona Residencia], [Dirección], [Id Etnia], [Comunidad Etnica],
                    [Id Discapacidad], [Teléfono Celular], [Alergeno],
                    [Codigo Prestador], [Codigo Admin Plan Beneficios], [Nombre Admin Plan Beneficios],
                    [Fecha Hora Inicio Atencion], [Fecha Hora Fin Atencion],
                    [Tipo Doc Profesional], [Num Doc Profesional],
                    [Diagnostico Ingreso CIE11 Codigo], [Diagnostico Ingreso CIE11 Termino],
                    [Tipo Alergia],
                    [Id Modalidad Atencion], [Id Grupo Servicios],
                    [NIT Prestador IPS], [Nombre Prestador IPS]
                )
                OUTPUT INSERTED.[Id Evaluacion Entidad RDA]
                VALUES
                (
                    @DocumentoEntidad, @FechaRDA, @IdTipoDocumento,
                    @PrimerApellidoEntidad, @SegundoApellidoEntidad,
                    @PrimerNombreEntidad, @SegundoNombreEntidad,
                    @FechaNacimiento, @Edad, @IdUnidaddeMedidaEdad,
                    @IdSexoBiologico, @IdIdentidadGenero, @IdPaisNacionalidad,
                    @Talla, @Peso, @IdPaisRecidencia, @IdMunicipioRecidencia,
                    @IdZonaResidencia, @Direccion, @IdEtnia, @ComunidadEtnica,
                    @IdDiscapacidad, @TelefonoCelular, @Alergeno,
                    @CodigoPrestador, @CodigoAdminPlanBeneficios, @NombreAdminPlanBeneficios,
                    @FechaHoraInicioAtencion, @FechaHoraFinAtencion,
                    @TipoDocProfesional, @NumDocProfesional,
                    @DiagnosticoIngresoCIE11Codigo, @DiagnosticoIngresoCIE11Termino,
                    @TipoAlergia,
                    @IdModalidadAtencion, @IdGrupoServicios,
                    @NitPrestadorIPS, @NombrePrestadorIPS
                )
            `);
        const idInsertado = result.recordset[0]['Id Evaluacion Entidad RDA'];
        res.json({ ok: true, IdEvaluacionEntidadRDA: idInsertado });
    } catch (error) {
        console.error('❌ Error al insertar Evaluacion Entidad RDA:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDA/AntecedentesSalud', async (req, res) => {
    const { IdEvaluacionEntidadRDA, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdEvaluacionEntidadRDA', sql.Int,      parseInt(IdEvaluacionEntidadRDA))
            .input('DocumentoEntidad',       sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion',            sql.NVarChar, Descripcion      || null)
            .input('IdEstado',               sql.Int,      IdEstado ? parseInt(IdEstado) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA Antecedentes Salud]
                ([Id Evaluacion Entidad RDA], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdEvaluacionEntidadRDA, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error al insertar Antecedente Salud:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDA/AntecedentesFamiliares', async (req, res) => {
    const { IdEvaluacionEntidadRDA, DocumentoEntidad, Parentesco, Descripcion, IdEstado, CIE11Codigo, CIE11Termino } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdEvaluacionEntidadRDA', sql.Int,      parseInt(IdEvaluacionEntidadRDA))
            .input('DocumentoEntidad',       sql.NVarChar, DocumentoEntidad || null)
            .input('Parentesco',             sql.NVarChar, Parentesco       || null)
            .input('Descripcion',            sql.NVarChar, Descripcion      || null)
            .input('CIE11Codigo',            sql.NVarChar, CIE11Codigo      || null)
            .input('CIE11Termino',           sql.NVarChar, CIE11Termino     || null)
            .input('IdEstado',               sql.Int,      IdEstado ? parseInt(IdEstado) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA Antecedentes Familiares]
                ([Id Evaluacion Entidad RDA], [Documento Entidad], [Parentesco], [Descripcion], [CIE11 Codigo], [CIE11 Termino], [Id Estado])
                VALUES (@IdEvaluacionEntidadRDA, @DocumentoEntidad, @Parentesco, @Descripcion, @CIE11Codigo, @CIE11Termino, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error al insertar Antecedente Familiar:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDA/AntecedentesFarmacologicos', async (req, res) => {
    const { IdEvaluacionEntidadRDA, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdEvaluacionEntidadRDA', sql.Int,      parseInt(IdEvaluacionEntidadRDA))
            .input('DocumentoEntidad',       sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion',            sql.NVarChar, Descripcion      || null)
            .input('IdEstado',               sql.Int,      IdEstado ? parseInt(IdEstado) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA Antecedentes Farmacologicos]
                ([Id Evaluacion Entidad RDA], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdEvaluacionEntidadRDA, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error al insertar Antecedente Farmacologico:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

// ======================================================================================
// RDA PACIENTE — Construcción FHIR Bundle desde BD
// ======================================================================================
// Body (recomendado): { "IdEvaluacionEntidadRDA": 123 }
// Opcional (solo pruebas / alinear custodian IHCE sin UPDATE en BD):
//   overrideCodigoPrestador, overrideNitPrestadorIPS, overrideNombrePrestadorIPS
// Devuelve: Bundle FHIR type="document" (paciente) con Composition + Patient + entradas
// (Condition, FamilyMemberHistory, MedicationStatement).
router.post('/RdaPaciente/FhirBundle', async (req, res) => {
    const { IdEvaluacionEntidadRDA } = req.body || {};

    const id = IdEvaluacionEntidadRDA != null ? parseInt(IdEvaluacionEntidadRDA, 10) : NaN;
    if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
    }

    const { randomUUID } = require('crypto');
    const newUuid = () => {
        try {
            if (typeof randomUUID === 'function') return randomUUID();
        } catch (_) {
            // ignore
        }
        return `uuid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    // IHCE (manual operativo) valida que las entradas del Bundle solo incluyan `resource`
    // (no acepta `fullUrl`). Las referencias internas se manejan con el patrón `#<id>`.
    const makeEntry = (resource) => {
        const entryId = resource.id || newUuid();
        resource.id = entryId;
        return { resource };
    };

    const refOf = (entryOrResource) => {
        const r = entryOrResource && entryOrResource.resource ? entryOrResource.resource : entryOrResource;
        const id = r && r.id ? String(r.id) : '';
        if (!id) throw new Error('[RDA] No se puede referenciar un recurso sin id');
        return `#${id}`;
    };

    const nowIso = new Date().toISOString();

    const parseCodigoDescripcion = (text) => {
        const s = (text ?? '').toString().trim();
        if (!s) return { codigo: '', descripcion: '' };
        // En el frontend se guardan así: `${codigo} - ${descripcion}`
        const parts = s.split(' - ');
        if (parts.length >= 2) {
            return {
                codigo: (parts[0] ?? '').trim(),
                descripcion: parts.slice(1).join(' - ').trim(),
            };
        }
        return { codigo: s, descripcion: '' };
    };

    const parseNombreObservacion = (text) => {
        const s = (text ?? '').toString().trim();
        if (!s) return { nombre: '', observacion: '' };
        // En el frontend se guarda así: `nombre (observacion)`
        if (s.endsWith(')')) {
            const idx = s.lastIndexOf(' (');
            if (idx > -1) {
                return {
                    nombre: s.slice(0, idx).trim(),
                    observacion: s.slice(idx + 3, -1).trim(),
                };
            }
        }
        return { nombre: s, observacion: '' };
    };

    // Maps Tipo Alergia codes (01-06) to FHIR AllergyIntolerance category values
    const allergyTypeToCategory = (tipoAlergiaCodigo) => {
        const map = {
            '01': 'medication',
            '02': 'food',
            '03': 'environment',
            '04': 'environment',
            '05': 'biologic',
            '06': 'environment',
        };
        const code = (tipoAlergiaCodigo ?? '').toString().trim();
        return map[code] || null;
    };

    const RDA_SD = 'https://fhir.minsalud.gov.co/rda/StructureDefinition';
    const CS_MODALITY = 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality';
    const CS_GRUPO_SVC = 'https://fhir.minsalud.gov.co/rda/CodeSystem/GrupoServicios';
    const ICD11_SYSTEM = 'http://id.who.int/icd/release/11/mms';

    const toIsoDateTime = (v) => {
        if (v == null || v === '') return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d.toISOString();
    };

    const emptySectionNilKnown = (texto) => ({
        emptyReason: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
                    code: 'nilknown',
                    display: 'Nil Known',
                },
            ],
            text: texto || 'Sin información registrada',
        },
    });

    const buildRdaPacienteBundle = ({
        paciente,
        organizationEapb,
        organizationIps,
        practitioner,
        head,
        antecedents,
        antecedentsFam,
        medications,
        alergia,
    }) => {
        const patientEntry = makeEntry(paciente.resource);
        const patientId = patientEntry.resource.id;
        const compositionDateIso = toIsoDateTime(head && head.FechaRDA) || nowIso;
        const bundleTs = compositionDateIso;

        const conditionEntries = (antecedents || []).map((item, idx) =>
            makeEntry({
                resourceType: 'Condition',
                id: `Condition-${idx}`,
                meta: {
                    profile: [`${RDA_SD}/ConditionStatementRDA`],
                },
                subject: { reference: refOf(patientEntry) },
                code: {
                    coding: [
                        {
                            system: 'http://hl7.org/fhir/sid/icd-10',
                            code: item.codigo,
                            display: item.descripcion || undefined,
                        },
                    ],
                    text: item.descripcion || item.codigo,
                },
            })
        );

        const c11Ingreso = head && (head.DiagnosticoIngresoCIE11Codigo || '').toString().trim();
        const conditionIngresoEntry = c11Ingreso
            ? makeEntry({
                resourceType: 'Condition',
                id: 'ConditionIngreso-0',
                meta: {
                    profile: [`${RDA_SD}/ConditionStatementRDA`],
                },
                subject: { reference: refOf(patientEntry) },
                code: {
                    coding: [
                        {
                            system: ICD11_SYSTEM,
                            code: c11Ingreso,
                            display: head.DiagnosticoIngresoCIE11Termino
                                ? String(head.DiagnosticoIngresoCIE11Termino)
                                : undefined,
                        },
                    ],
                    text: head.DiagnosticoIngresoCIE11Termino
                        ? String(head.DiagnosticoIngresoCIE11Termino)
                        : c11Ingreso,
                },
            })
            : null;

        const familyHistoryEntries = (antecedentsFam || []).map((item, idx) => {
            const codings = [
                {
                    system: 'http://hl7.org/fhir/sid/icd-10',
                    code: item.codigo,
                    display: item.descripcion || undefined,
                },
            ];
            if (item.cie11Codigo) {
                codings.push({
                    system: ICD11_SYSTEM,
                    code: item.cie11Codigo,
                    display: item.cie11Termino || undefined,
                });
            }
            return makeEntry({
                resourceType: 'FamilyMemberHistory',
                id: `FamilyMemberHistory-${idx}`,
                meta: {
                    profile: [`${RDA_SD}/FamilyMemberHistoryRDA`],
                },
                status: 'completed',
                patient: { reference: refOf(patientEntry) },
                relationship: {
                    coding: [
                        {
                            system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
                            code: item.parentesco,
                            display: item.textoParentesco || undefined,
                        },
                    ],
                    text: item.textoParentesco || undefined,
                },
                condition: [
                    {
                        code: {
                            coding: codings,
                            text: item.descripcion || item.codigo,
                        },
                    },
                ],
            });
        });

        const medicationStatementEntries = (medications || []).map((item, idx) =>
            makeEntry({
                resourceType: 'MedicationStatement',
                id: `MedicationStatement-${idx}`,
                meta: {
                    profile: [`${RDA_SD}/MedicationStatementRDA`],
                },
                status: 'active',
                subject: { reference: refOf(patientEntry) },
                medicationCodeableConcept: { text: item.nombre },
                note: item.observacion ? [{ text: item.observacion }] : undefined,
            })
        );

        const observationEntries = [];
        const parseNum = (x) => {
            const n = parseFloat(String(x || '').replace(',', '.'));
            return Number.isFinite(n) ? n : null;
        };
        const tallaN = head ? parseNum(head.Talla) : null;
        const pesoN = head ? parseNum(head.Peso) : null;
        if (tallaN != null && tallaN > 0) {
            observationEntries.push(
                makeEntry({
                    resourceType: 'Observation',
                    id: `Observation-Talla-0`,
                    status: 'final',
                    category: [
                        {
                            coding: [
                                {
                                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                                    code: 'vital-signs',
                                    display: 'Vital Signs',
                                },
                            ],
                        },
                    ],
                    code: {
                        coding: [
                            {
                                system: 'http://loinc.org',
                                code: '8302-2',
                                display: 'Body height',
                            },
                        ],
                    },
                    subject: { reference: refOf(patientEntry) },
                    valueQuantity: { value: tallaN, unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' },
                })
            );
        }
        if (pesoN != null && pesoN > 0) {
            observationEntries.push(
                makeEntry({
                    resourceType: 'Observation',
                    id: `Observation-Peso-0`,
                    status: 'final',
                    category: [
                        {
                            coding: [
                                {
                                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                                    code: 'vital-signs',
                                    display: 'Vital Signs',
                                },
                            ],
                        },
                    ],
                    code: {
                        coding: [
                            {
                                system: 'http://loinc.org',
                                code: '29463-7',
                                display: 'Body weight',
                            },
                        ],
                    },
                    subject: { reference: refOf(patientEntry) },
                    valueQuantity: { value: pesoN, unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' },
                })
            );
        }

        const hasAlergia = alergia && (alergia.alergeno || '').toString().trim().length > 0;
        const allergyEntry = hasAlergia
            ? (() => {
                const category = allergyTypeToCategory(alergia.tipoAlergia);
                return makeEntry({
                    resourceType: 'AllergyIntolerance',
                    id: 'AllergyIntolerance-0',
                    meta: {
                        profile: [`${RDA_SD}/AllergyIntoleranceStatementRDA`],
                    },
                    clinicalStatus: {
                        coding: [
                            {
                                system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                                code: 'active',
                            },
                        ],
                    },
                    verificationStatus: {
                        coding: [
                            {
                                system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                                code: 'confirmed',
                            },
                        ],
                    },
                    ...(category ? { category: [category] } : {}),
                    code: { text: alergia.alergeno.toString().trim() },
                    patient: { reference: refOf(patientEntry) },
                });
            })()
            : null;

        const periodStart =
            toIsoDateTime(head && head.FechaHoraInicioAtencion) || compositionDateIso;
        const periodEnd =
            toIsoDateTime(head && head.FechaHoraFinAtencion) || periodStart;
        const modCode = (head && head.CodigoModalidadAtencion && String(head.CodigoModalidadAtencion).trim()) || '01';
        const modDisplay = head && head.NombreModalidadAtencion ? String(head.NombreModalidadAtencion) : undefined;
        const grpCode = (head && head.CodigoGrupoServicios && String(head.CodigoGrupoServicios).trim()) || '01';
        const grpDisplay = head && head.NombreGrupoServicios ? String(head.NombreGrupoServicios) : undefined;

        const practitionerRef = practitioner ? { reference: refOf(practitioner) } : null;
        const custodianRef = organizationIps ? { reference: refOf(organizationIps) } : null;
        if (!practitionerRef) {
            throw new Error(
                'No se pudo construir Composition.author (PractitionerRDA). Verifique Tipo/Num documento del profesional en el RDA o datos mínimos del autor.'
            );
        }
        if (!custodianRef) {
            throw new Error(
                'No se pudo construir Composition.custodian (IPS). Verifique NitPrestadorIPS y CodigoPrestador en la cabecera RDA.'
            );
        }

        const compositionId = 'Composition-0';

        // RDA Paciente (CompositionPatientStatementRDA): encounter tiene cardinalidad 0 en el IG IHCE;
        // incluir Encounter provoca BUNDLE-005 (“Prior creation in FHIR service”). Modalidad/grupo van en Composition.event.
        const sections = [];
        if (conditionIngresoEntry) {
            sections.push({
                title: 'Diagnóstico de ingreso (CIE-11)',
                entry: [{ reference: refOf(conditionIngresoEntry) }],
            });
        }
        sections.push(
            medicationStatementEntries.length
                ? {
                    title: 'Antecedentes farmacológicos',
                    entry: medicationStatementEntries.map((e) => ({ reference: refOf(e) })),
                }
                : {
                    title: 'Antecedentes farmacológicos',
                    ...emptySectionNilKnown('No se registran antecedentes farmacológicos'),
                }
        );
        sections.push(
            allergyEntry
                ? {
                    title: 'Antecedentes alérgicos',
                    entry: [{ reference: refOf(allergyEntry) }],
                }
                : {
                    title: 'Antecedentes alérgicos',
                    ...emptySectionNilKnown('No se conocen alergias'),
                }
        );
        sections.push(
            conditionEntries.length
                ? {
                    title: 'Antecedentes patológicos',
                    entry: conditionEntries.map((e) => ({ reference: refOf(e) })),
                }
                : {
                    title: 'Antecedentes patológicos',
                    ...emptySectionNilKnown('No se registran antecedentes patológicos'),
                }
        );
        sections.push(
            familyHistoryEntries.length
                ? {
                    title: 'Antecedentes familiares',
                    entry: familyHistoryEntries.map((e) => ({ reference: refOf(e) })),
                }
                : {
                    title: 'Antecedentes familiares',
                    ...emptySectionNilKnown('No se registran antecedentes familiares'),
                }
        );

        const compositionResource = {
            resourceType: 'Composition',
            id: compositionId,
            meta: {
                profile: [`${RDA_SD}/CompositionPatientStatementRDA`],
            },
            status: 'final',
            type: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '102089-0',
                        display: 'FHIR resource patient medical record',
                    },
                ],
                text: 'FHIR resource patient medical record',
            },
            date: compositionDateIso,
            title: 'Resumen Digital de Atención en Salud - RDA de antecedentes manifestados por el paciente',
            confidentiality: 'N',
            event: [
                {
                    period: {
                        start: periodStart,
                        end: periodEnd,
                    },
                    code: [
                        {
                            coding: [
                                {
                                    system: CS_MODALITY,
                                    code: modCode,
                                    display: modDisplay,
                                },
                            ],
                            text: modDisplay || modCode,
                        },
                        {
                            coding: [
                                {
                                    system: CS_GRUPO_SVC,
                                    code: grpCode,
                                    display: grpDisplay,
                                },
                            ],
                            text: grpDisplay || grpCode,
                        },
                    ],
                },
            ],
            subject: { reference: refOf(patientEntry) },
            custodian: custodianRef,
            author: [practitionerRef],
            section: sections,
        };

        const compositionEntry = makeEntry(compositionResource);

        const bundleEntries = [
            compositionEntry,
            patientEntry,
            ...(practitioner ? [practitioner] : []),
            ...(organizationIps ? [organizationIps] : []),
            ...(organizationEapb ? [organizationEapb] : []),
            ...observationEntries,
            ...(conditionIngresoEntry ? [conditionIngresoEntry] : []),
            ...conditionEntries,
            ...familyHistoryEntries,
            ...medicationStatementEntries,
            ...(allergyEntry ? [allergyEntry] : []),
        ];

        return {
            resourceType: 'Bundle',
            type: 'document',
            timestamp: bundleTs,
            entry: bundleEntries,
        };
    };

    try {
        const pool = await poolPromise;

        // Verificación temprana: si las tablas RDA no existen en BD,
        // el SQL falla con "El nombre de objeto ... no es válido".
        const existsCheck = await pool
            .request()
            .query(`
                SELECT
                    OBJECT_ID('dbo.[Evaluacion Entidad RDA]') AS oidMain,
                    OBJECT_ID('dbo.[Evaluacion Entidad RDA Antecedentes Salud]') AS oidAntSalud,
                    OBJECT_ID('dbo.[Evaluacion Entidad RDA Antecedentes Familiares]') AS oidAntFam,
                    OBJECT_ID('dbo.[Evaluacion Entidad RDA Antecedentes Farmacologicos]') AS oidAntFarm
            `);

        const chk = existsCheck.recordset && existsCheck.recordset[0] ? existsCheck.recordset[0] : null;
        if (!chk || chk.oidMain == null) {
            return res.status(500).json({
                ok: false,
                error:
                    'Faltan tablas de RDA Paciente en la BD. Verifica haber ejecutado los scripts SQL de RDA (tabla Evaluacion Entidad RDA).',
            });
        }

        // 1) Cabecera (Patient + Organization base)
        const main = await pool
            .request()
            .input('IdEvaluacionEntidadRDA', sql.Int, id)
            .query(`
                SELECT
                    e.[Id Evaluacion Entidad RDA]      AS IdEvaluacionEntidadRDA,
                    e.[Documento Entidad]              AS DocumentoEntidad,
                    e.[Primer Apellido Entidad]        AS PrimerApellidoEntidad,
                    e.[Segundo Apellido Entidad]       AS SegundoApellidoEntidad,
                    e.[Primer Nombre Entidad]          AS PrimerNombreEntidad,
                    e.[Segundo Nombre Entidad]         AS SegundoNombreEntidad,
                    e.[Id Tipo Documento]              AS IdTipoDocumento,
                    t.[CódigoTipoDocumento]            AS CodigoTipoDocumento,
                    t.[TipoDocumento]                  AS TipoDocumento,
                    e.[Fecha Nacimiento]               AS FechaNacimiento,
                    e.[Id Sexo Biologico]              AS IdSexoBiologico,
                    sx.[CódigoSexo]                   AS CodigoSexo,
                    sx.[Sexo]                          AS Sexo,
                    e.[Id Identidad Genero]            AS IdIdentidadGenero,
                    gi.[Codigo]                        AS CodigoIdentidadGenero,
                    gi.[IdentidadGenero]               AS TextoIdentidadGenero,
                    e.[Id Pais Nacionalidad]           AS IdPaisNacionalidad,
                    pn.[Codigo]                        AS CodigoPaisNacionalidad,
                    pn.[Nombre]                        AS NombrePaisNacionalidad,
                    e.[Id Pais Recidencia]             AS IdPaisResidencia,
                    pr.[Codigo]                        AS CodigoPaisResidencia,
                    pr.[Nombre]                        AS NombrePaisResidencia,
                    e.[Id Municipio Recidencia]        AS IdMunicipioResidencia,
                    c.[Codigo]                         AS CodigoMunicipio,
                    c.[Nombre]                         AS NombreMunicipio,
                    e.[Id Zona Residencia]             AS IdZonaResidencia,
                    z.[ZonaResidencia]                 AS ZonaResidencia,
                    e.[Dirección]                      AS Direccion,
                    e.[Id Etnia]                       AS IdEtnia,
                    et.[CódigoEtnia]                  AS CodigoEtnia,
                    et.[Etnia]                         AS TextoEtnia,
                    e.[Comunidad Etnica]               AS ComunidadEtnica,
                    e.[Id Discapacidad]                AS IdDiscapacidad,
                    d.[Codigo]                         AS CodigoDiscapacidad,
                    d.[Discapacidad]                   AS TextoDiscapacidad,
                    e.[Teléfono Celular]               AS TelefonoCelular,
                    e.[Talla]                          AS Talla,
                    e.[Peso]                           AS Peso,
                    e.[Codigo Prestador]               AS CodigoPrestador,
                    e.[Codigo Admin Plan Beneficios]   AS CodigoAdminPlanBeneficios,
                    e.[Nombre Admin Plan Beneficios]   AS NombreAdminPlanBeneficios,
                    e.[Fecha RDA]                      AS FechaRDA,
                    e.[Alergeno]                       AS Alergeno,
                    e.[Tipo Alergia]                   AS TipoAlergia,
                    e.[Fecha Hora Inicio Atencion]     AS FechaHoraInicioAtencion,
                    e.[Fecha Hora Fin Atencion]        AS FechaHoraFinAtencion,
                    e.[Tipo Doc Profesional]           AS TipoDocProfesional,
                    e.[Num Doc Profesional]            AS NumDocProfesional,
                    e.[Diagnostico Ingreso CIE11 Codigo]  AS DiagnosticoIngresoCIE11Codigo,
                    e.[Diagnostico Ingreso CIE11 Termino] AS DiagnosticoIngresoCIE11Termino,
                    e.[Id Modalidad Atencion]          AS IdModalidadAtencion,
                    e.[Id Grupo Servicios]             AS IdGrupoServicios,
                    e.[NIT Prestador IPS]              AS NitPrestadorIPS,
                    e.[Nombre Prestador IPS]           AS NombrePrestadorIPS,
                    ma.[Codigo]                        AS CodigoModalidadAtencion,
                    ma.[NombreModalidadAtencion]       AS NombreModalidadAtencion,
                    gs.[Codigo]                        AS CodigoGrupoServicios,
                    gs.[NombreGrupoServicios]          AS NombreGrupoServicios
                FROM [dbo].[Evaluacion Entidad RDA] e
                LEFT JOIN [dbo].[Cnsta Tipodocumento 1888] t
                    ON t.[IdTipodeDocumento] = e.[Id Tipo Documento]
                LEFT JOIN [dbo].[Cnsta Sexo 1888] sx
                    ON sx.[IdSexo] = e.[Id Sexo Biologico]
                LEFT JOIN [dbo].[Cnsta SexoIdentidad 1888] gi
                    ON gi.[IdSexoIdentidadGenero] = e.[Id Identidad Genero]
                LEFT JOIN [dbo].[Cnsta Pais 1888] pn
                    ON pn.[IdPais1888] = e.[Id Pais Nacionalidad]
                LEFT JOIN [dbo].[Cnsta Pais 1888] pr
                    ON pr.[IdPais1888] = e.[Id Pais Recidencia]
                LEFT JOIN [dbo].[Cnsta Ciudad 1888] c
                    ON c.[IdCiudad1888] = e.[Id Municipio Recidencia]
                LEFT JOIN [dbo].[Cnsta ZonaResidencia 1888] z
                    ON z.[IdZonaResidencia] = e.[Id Zona Residencia]
                LEFT JOIN [dbo].[Cnsta Etnia 1888] et
                    ON et.[IdEtnia] = e.[Id Etnia]
                LEFT JOIN [dbo].[Cnsta Discapacidad 1888] d
                    ON d.[IdDiscapacidad] = e.[Id Discapacidad]
                LEFT JOIN [dbo].[Cnsta Relacionador Modalidad Atencion] ma
                    ON ma.[IdModalidadAtencion] = e.[Id Modalidad Atencion]
                LEFT JOIN [dbo].[Cnsta Relacionador ModalidadGrupoServicioTecSal] gs
                    ON gs.[IdGrupoServicios] = e.[Id Grupo Servicios]
                WHERE e.[Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA
            `);

        if (!main.recordset || !main.recordset.length) {
            return res.status(404).json({ ok: false, error: 'No existe Evaluacion Entidad RDA para el Id indicado' });
        }

        const head = main.recordset[0];

        const ob = req.body || {};
        if (ob.overrideCodigoPrestador != null && String(ob.overrideCodigoPrestador).trim()) {
            head.CodigoPrestador = String(ob.overrideCodigoPrestador).trim();
        }
        if (ob.overrideNitPrestadorIPS != null && String(ob.overrideNitPrestadorIPS).trim()) {
            head.NitPrestadorIPS = String(ob.overrideNitPrestadorIPS).trim();
        }
        if (ob.overrideNombrePrestadorIPS != null && String(ob.overrideNombrePrestadorIPS).trim()) {
            head.NombrePrestadorIPS = String(ob.overrideNombrePrestadorIPS).trim();
        }

        const codPrestHdr = head.CodigoPrestador != null ? String(head.CodigoPrestador).trim() : '';
        if (!codPrestHdr || codPrestHdr.toLowerCase() === 'null') {
            return res.status(400).json({
                ok: false,
                error:
                    'La cabecera RDA no tiene Código Prestador (REPS). Vuelva a guardar el RDA eligiendo el prestador IPS en el formulario.',
            });
        }
        if (head.IdModalidadAtencion == null) {
            return res.status(400).json({
                ok: false,
                error:
                    'Falta modalidad de atención en la cabecera RDA. Complétela en el formulario antes de generar el Bundle FHIR.',
            });
        }
        if (head.IdGrupoServicios == null) {
            return res.status(400).json({
                ok: false,
                error:
                    'Falta grupo de servicios en la cabecera RDA. Compléntelo en el formulario antes de generar el Bundle FHIR.',
            });
        }

        // 2) Listas
        const [antecedentsRes, antecedentsFamRes, medsRes, parentescosRes] = await Promise.all([
            pool.request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT [Descripcion]
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Salud]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA AND [Id Estado] = 1
                `),
            pool.request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT [Parentesco], [Descripcion], [CIE11 Codigo] AS CIE11Codigo, [CIE11 Termino] AS CIE11Termino
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Familiares]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA AND [Id Estado] = 1
                `),
            pool.request()
                .input('IdEvaluacionEntidadRDA', sql.Int, id)
                .query(`
                    SELECT [Descripcion]
                    FROM [dbo].[Evaluacion Entidad RDA Antecedentes Farmacologicos]
                    WHERE [Id Evaluacion Entidad RDA] = @IdEvaluacionEntidadRDA AND [Id Estado] = 1
                `),
            pool.request().query(`
                SELECT Codigo, Descripcion
                FROM [dbo].[Cnsta Parentesco familiar RDA 1888]
            `)
        ]);

        const parentescosMap = new Map(
            (parentescosRes.recordset || []).map((r) => [String(r.Codigo), String(r.Descripcion)])
        );

        const antecedentes = (antecedentsRes.recordset || []).map((r) => {
            const parsed = parseCodigoDescripcion(r.Descripcion);
            return { codigo: parsed.codigo, descripcion: parsed.descripcion };
        });

        const antecedentesFam = (antecedentsFamRes.recordset || []).map((r) => {
            const parsed = parseCodigoDescripcion(r.Descripcion);
            const parentescoCodigo = r.Parentesco != null ? String(r.Parentesco) : '';
            const c11c = r.CIE11Codigo != null ? String(r.CIE11Codigo).trim() : '';
            const c11t = r.CIE11Termino != null ? String(r.CIE11Termino).trim() : '';
            return {
                parentesco: parentescoCodigo,
                textoParentesco: parentescosMap.get(parentescoCodigo) || undefined,
                codigo: parsed.codigo,
                descripcion: parsed.descripcion,
                cie11Codigo: c11c || undefined,
                cie11Termino: c11t || undefined,
            };
        });

        const medicamentos = (medsRes.recordset || []).map((r) => {
            const parsed = parseNombreObservacion(r.Descripcion);
            return { nombre: parsed.nombre, observacion: parsed.observacion };
        });

        // 3) Resources base (Patient + Organization)
        // IHCE recomienda referencias por tipo y número de identificación para Patient/Practitioner
        const docTypePaciente = (head.CodigoTipoDocumento || head.TipoDocumento || 'SI').toString().trim();
        const docNumPaciente = (head.DocumentoEntidad || 'NO-INFORMADO').toString().trim();
        const pacienteId = `${docTypePaciente}-${docNumPaciente}`;

        // Para EAPB se usa el código (EAPBS) cuando exista
        const orgId = head.CodigoAdminPlanBeneficios != null && String(head.CodigoAdminPlanBeneficios).trim()
            ? String(head.CodigoAdminPlanBeneficios).trim()
            : newUuid();

        // -----------------------------------------------------------------------
        // Helper: builds a PatientRDA-conformant resource from the enriched head
        // row (includes catalog JOIN columns).
        // Reference profile example: https://vulcano.ihcecol.gov.co/Patient-92a8e277...
        // -----------------------------------------------------------------------
        const buildPatientRdaFromHead = (h, pid, orgEntry) => {
            // Primitive helpers
            const str  = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);
            const toIsoDate = (v) => {
                if (!v) return null;
                const d = new Date(v);
                return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
            };

            // gender: DB sexo code (F/M) → FHIR administrative gender + BiologicalGender extension
            const sexCode = str(h.CodigoSexo) || str(h.Sexo);
            const fhirGender = sexCode
                ? ({ F: 'female', M: 'male' }[sexCode.toUpperCase()] || 'other')
                : undefined;
            const biologicalGenderMap = { F: { code: '02', display: 'Mujer' }, M: { code: '01', display: 'Hombre' } };
            const biologicalGender = sexCode ? (biologicalGenderMap[sexCode.toUpperCase()] || { code: '03', display: 'Indeterminado o Intersexual' }) : null;

            // Document type display label for ColombianPersonIdentifier
            const docTypeLabels = {
                CC: 'Cédula ciudadanía', TI: 'Tarjeta de identidad',
                RC: 'Registro civil',    CE: 'Cédula de extranjería',
                PA: 'Pasaporte',         PE: 'Permiso especial de permanencia',
                PT: 'Permiso temporal de permanencia', CD: 'Carné diplomático',
                SC: 'Salvo conducto',    PPT: 'Permiso por Protección Temporal',
                AS: 'Adulto sin identificación', MS: 'Menor sin identificación',
                SI: 'Sin identificación',
            };
            const docTypeCode = str(h.TipoDocumento) || str(h.CodigoTipoDocumento);

            // Residence zone: map DB value (U/R or Urbana/Rural) to ColombianResidenceZone code
            const zonaText = str(h.ZonaResidencia) || '';
            const zonaLower = zonaText.toLowerCase();
            const zonaCode = (zonaLower === 'r' || zonaLower.includes('rural'))  ? '02'
                           : (zonaLower === 'u' || zonaLower.includes('urban'))  ? '01'
                           : (zonaText ? '01' : null);
            const zonaDisplay = zonaCode === '02' ? 'Rural' : zonaCode === '01' ? 'Urbana' : undefined;

            // Build Patient-level extensions
            const patExt = [];
            if (str(h.CodigoPaisNacionalidad)) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientNationality',
                    valueCoding: {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661',
                        code: str(h.CodigoPaisNacionalidad),
                        display: str(h.NombrePaisNacionalidad) || undefined,
                    },
                });
            }
            if (str(h.CodigoEtnia)) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientEthnicity',
                    valueCoding: {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianEthnicGroup',
                        code: str(h.CodigoEtnia),
                        display: str(h.TextoEtnia) || undefined,
                    },
                });
            }
            if (str(h.ComunidadEtnica)) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientEthnicCommunity',
                    valueString: str(h.ComunidadEtnica),
                });
            }
            if (str(h.CodigoDiscapacidad)) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientDisability',
                    valueCoding: {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDisabilityClassification',
                        code: str(h.CodigoDiscapacidad),
                        display: str(h.TextoDiscapacidad) || undefined,
                    },
                });
            }
            if (str(h.CodigoIdentidadGenero) && h.IdIdentidadGenero && h.IdIdentidadGenero !== 0) {
                patExt.push({
                    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientGenderIdentity',
                    valueCoding: {
                        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderIdentity',
                        code: str(h.CodigoIdentidadGenero),
                        display: str(h.TextoIdentidadGenero) || undefined,
                    },
                });
            }

            // Name
            const primerApellido  = str(h.PrimerApellidoEntidad)  || '';
            const segundoApellido = str(h.SegundoApellidoEntidad) || '';
            const primerNombre    = str(h.PrimerNombreEntidad)    || '';
            const segundoNombre   = str(h.SegundoNombreEntidad)   || '';
            // IHCE (MPI-002): Patient.name.family debe ser solo el primer apellido; el segundo va en ExtensionMothersFamilyName.
            const familyText      = primerApellido || undefined;
            const givenArr        = [primerNombre, segundoNombre].filter(Boolean);
            const familyExtArr    = [
                ...(primerApellido  ? [{ url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionFathersFamilyName', valueString: primerApellido }]  : []),
                ...(segundoApellido ? [{ url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionMothersFamilyName', valueString: segundoApellido }] : []),
            ];

            // Address
            const hasAddr = str(h.CodigoPaisResidencia) || str(h.NombreMunicipio) || str(h.Direccion);
            const homeAddr = hasAddr ? (() => {
                const addr = { id: 'HomeAddress-0', use: 'home', type: 'physical' };
                if (zonaCode) {
                    addr.extension = [{
                        url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionResidenceZone',
                        valueCoding: {
                            system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianResidenceZone',
                            code: zonaCode,
                            display: zonaDisplay,
                        },
                    }];
                }
                if (str(h.Direccion)) addr.line = [str(h.Direccion)];
                if (str(h.NombreMunicipio)) {
                    addr.city = str(h.NombreMunicipio);
                    if (str(h.CodigoMunicipio)) {
                        addr._city = { extension: [{ url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionDivipolaMunicipality', valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/DIVIPOLA', code: str(h.CodigoMunicipio) } }] };
                    }
                }
                if (str(h.CodigoPaisResidencia)) {
                    addr.country = str(h.NombrePaisResidencia) || str(h.CodigoPaisResidencia);
                    addr._country = { extension: [{ url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionCountryCode', valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661', code: str(h.CodigoPaisResidencia) } }] };
                }
                return addr;
            })() : null;

            // Telecom
            const phoneVal = str(h.TelefonoCelular);

            // Compose resource
            return {
                resourceType: 'Patient',
                id: pid,
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/PatientRDA'],
                },
                ...(patExt.length > 0 ? { extension: patExt } : {}),
                identifier: str(h.DocumentoEntidad)
                    ? [{
                        id: 'NationalPersonIdentifier-0',
                        use: 'official',
                        type: {
                            coding: [
                                { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PN', display: 'Person number' },
                                ...(docTypeCode ? [{ system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier', code: docTypeCode, display: docTypeLabels[docTypeCode] || docTypeCode }] : []),
                            ],
                        },
                        system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC',
                        value: str(h.DocumentoEntidad),
                    }]
                    : undefined,
                active: true,
                ...(familyText || givenArr.length > 0
                    ? { name: [{
                        use: 'official',
                        ...(familyText ? { family: familyText } : {}),
                        ...(familyExtArr.length > 0 ? { _family: { extension: familyExtArr } } : {}),
                        ...(givenArr.length > 0 ? { given: givenArr } : {}),
                    }] }
                    : {}),
                ...(fhirGender ? { gender: fhirGender } : {}),
                ...(biologicalGender ? { _gender: { extension: [{ url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionBiologicalGender', valueCoding: { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderGroup', code: biologicalGender.code, display: biologicalGender.display } }] } } : {}),
                ...(() => {
                    const birthIso = toIsoDate(h.FechaNacimiento);
                    if (!birthIso) return {};
                    const out = { birthDate: birthIso };
                    const birthDt = new Date(h.FechaNacimiento);
                    if (!isNaN(birthDt.getTime())) {
                        const hasTime =
                            birthDt.getUTCHours() ||
                            birthDt.getUTCMinutes() ||
                            birthDt.getUTCSeconds() ||
                            birthDt.getUTCMilliseconds();
                        if (hasTime) {
                            out._birthDate = {
                                extension: [
                                    {
                                        url: 'http://hl7.org/fhir/StructureDefinition/patient-birthTime',
                                        valueDateTime: birthDt.toISOString(),
                                    },
                                ],
                            };
                        }
                    }
                    return out;
                })(),
                deceasedBoolean: false,
                ...(phoneVal ? { telecom: [{ system: 'phone', value: phoneVal }] } : {}),
                ...(homeAddr ? { address: [homeAddr] } : {}),
                ...(orgEntry ? { managingOrganization: { reference: orgEntry.fullUrl, display: str(h.NombreAdminPlanBeneficios) || undefined } } : {}),
            };
        };

        // Organization resource (EAPB) — use a generated UUID so fullUrl is valid
        const organizationName = head.NombreAdminPlanBeneficios || '';
        const organizationResource = organizationName
            ? {
                resourceType: 'Organization',
                id: orgId,
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/HealthBenefitPlanAdminOrganizationRDA'],
                },
                identifier: head.CodigoAdminPlanBeneficios
                    ? [{ system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/EAPBS', value: String(head.CodigoAdminPlanBeneficios) }]
                    : undefined,
                active: true,
                name: organizationName,
            }
            : null;

        // Build a temporary Organization entry reference so Patient.managingOrganization can point to it
        const orgEntryRef = organizationResource ? { fullUrl: `#${orgId}` } : null;

        const patientResource = buildPatientRdaFromHead(head, pacienteId, orgEntryRef);

        const docTypeLabelsProf = {
            CC: 'Cédula ciudadanía',
            TI: 'Tarjeta de identidad',
            RC: 'Registro civil',
            CE: 'Cédula de extranjería',
            PA: 'Pasaporte',
            PE: 'Permiso especial de permanencia',
            PT: 'Permiso temporal de permanencia',
            CD: 'Carné diplomático',
            SC: 'Salvo conducto',
            PPT: 'Permiso por Protección Temporal',
            AS: 'Adulto sin identificación',
            MS: 'Menor sin identificación',
            SI: 'Sin identificación',
        };
        const tipoProf = (head.TipoDocProfesional || 'SI').toString().trim();
        const numProf = (head.NumDocProfesional || 'NO-INFORMADO').toString().trim();
        const practId = `${tipoProf}-${numProf}`;
        const practitionerResource = {
            resourceType: 'Practitioner',
            id: practId,
            meta: {
                profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/PractitionerRDA'],
            },
            identifier: [
                {
                    id: 'NationalPersonIdentifier-0',
                    use: 'official',
                    type: {
                        coding: [
                            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PN', display: 'Person number' },
                            {
                                system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier',
                                code: tipoProf,
                                display: docTypeLabelsProf[tipoProf] || tipoProf,
                            },
                        ],
                    },
                    system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC',
                    value: numProf,
                },
            ],
            active: true,
        };
        const practitionerEntry = makeEntry(practitionerResource);

        const nitIps = head.NitPrestadorIPS != null ? String(head.NitPrestadorIPS).trim() : '';
        const codPrest = head.CodigoPrestador != null ? String(head.CodigoPrestador).trim() : '';
        const ipsId = codPrest || newUuid();
        let organizationIpsEntry = null;
        if (codPrest) {
            const nombreIps =
                head.NombrePrestadorIPS != null && String(head.NombrePrestadorIPS).trim()
                    ? String(head.NombrePrestadorIPS).trim()
                    : `IPS (${codPrest})`;
            const identifiers = [
                ...(nitIps
                    ? [
                        {
                            id: 'TaxIdentifier',
                            use: 'official',
                            type: {
                                coding: [
                                    { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'TAX', display: 'Tax ID number' },
                                    { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'NIT', display: 'Número de Identificación Tributaria' },
                                ],
                            },
                            system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/DIAN',
                            value: nitIps,
                        },
                    ]
                    : []),
                {
                    id: 'HealthcareProviderIdentifier',
                    use: 'official',
                    type: {
                        coding: [
                            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                            { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'CodigoPrestador', display: 'Código de habilitación de prestador de servicios de salud' },
                        ],
                    },
                    system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                    value: codPrest,
                },
            ];

            const ipsResource = {
                resourceType: 'Organization',
                id: ipsId,
                meta: {
                    profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/CareDeliveryOrganizationRDA'],
                },
                active: true,
                name: nombreIps,
                identifier: identifiers,
            };
            organizationIpsEntry = makeEntry(ipsResource);
        }

        if (organizationResource && head.CodigoAdminPlanBeneficios) {
            organizationResource.id = String(head.CodigoAdminPlanBeneficios).trim();
        }
        const organizationEapbEntry = organizationResource ? makeEntry(organizationResource) : null;

        const bundle = buildRdaPacienteBundle({
            paciente: { id: pacienteId, resource: patientResource },
            organizationEapb: organizationEapbEntry,
            organizationIps: organizationIpsEntry,
            practitioner: practitionerEntry,
            head,
            antecedents: antecedentes,
            antecedentsFam: antecedentesFam,
            medications: medicamentos,
            alergia: { alergeno: head.Alergeno, tipoAlergia: head.TipoAlergia },
        });

        return res.json(bundle);
    } catch (error) {
        console.error('❌ [RDA] Error al construir Bundle FHIR RDA Paciente:', error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
    }
});

// ======================================================================================
// RDA PACIENTE — Envío a IHCE (sandbox/prod) desde backend
// ======================================================================================
// Body: { "IdEvaluacionEntidadRDA": 123, "ambiente": "sandbox" | "prod",
//   opcional: overrideCodigoPrestador, overrideNitPrestadorIPS, overrideNombrePrestadorIPS (se reenvían a FhirBundle) }
// Requiere variables de entorno por ambiente:
//   IHCE_SANDBOX_BASE_URL, IHCE_SANDBOX_TENANT_ID, IHCE_SANDBOX_CLIENT_ID, IHCE_SANDBOX_CLIENT_SECRET, IHCE_SANDBOX_SCOPE, IHCE_SANDBOX_SUBSCRIPTION_KEY
//   IHCE_PROD_BASE_URL,    IHCE_PROD_TENANT_ID,    IHCE_PROD_CLIENT_ID,    IHCE_PROD_CLIENT_SECRET,    IHCE_PROD_SCOPE,    IHCE_PROD_SUBSCRIPTION_KEY
router.post(['/RdaPaciente/EnviarIHCE', '/RdaPaciente/EnviarIhce'], async (req, res) => {
    const https = require('https');

    const {
        IdEvaluacionEntidadRDA,
        ambiente,
        overrideCodigoPrestador,
        overrideNitPrestadorIPS,
        overrideNombrePrestadorIPS,
    } = req.body || {};
    const id = IdEvaluacionEntidadRDA != null ? parseInt(IdEvaluacionEntidadRDA, 10) : NaN;
    if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: 'IdEvaluacionEntidadRDA requerido (number)' });
    }

    const envPrefix = (String(ambiente || 'sandbox').toLowerCase() === 'prod' || String(ambiente || '').toLowerCase() === 'produccion')
        ? 'IHCE_PROD_'
        : 'IHCE_SANDBOX_';

    /** Primer valor de entorno no vacío (trim). Orden importa. */
    const firstEnv = (...keys) => {
        for (let i = 0; i < keys.length; i += 1) {
            const v = process.env[keys[i]];
            if (v != null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    };

    let baseUrl;
    let tenantId;
    let clientId;
    let clientSecret;
    let scope;
    let subscriptionKey;
    if (envPrefix === 'IHCE_SANDBOX_') {
        baseUrl = firstEnv('IHCE_SANDBOX_BASE_URL', 'IHCE_API_BASE_URL', 'IHCE_BASE_URL');
        tenantId = firstEnv('IHCE_SANDBOX_TENANT_ID', 'IHCE_TENANT_ID');
        clientId = firstEnv('IHCE_SANDBOX_CLIENT_ID', 'IHCE_CLIENT_ID');
        clientSecret = firstEnv('IHCE_SANDBOX_CLIENT_SECRET', 'IHCE_CLIENT_SECRET');
        scope = firstEnv('IHCE_SANDBOX_SCOPE', 'IHCE_SCOPE');
        subscriptionKey = firstEnv(
            'IHCE_SANDBOX_SUBSCRIPTION_KEY',
            'IHCE_APIM_SUBSCRIPTION_KEY',
            'IHCE_SUBSCRIPTION_KEY',
            'OCP_APIM_SUBSCRIPTION_KEY',
        );
    } else {
        baseUrl = firstEnv('IHCE_PROD_BASE_URL', 'IHCE_API_BASE_URL_PROD');
        tenantId = firstEnv('IHCE_PROD_TENANT_ID');
        clientId = firstEnv('IHCE_PROD_CLIENT_ID');
        clientSecret = firstEnv('IHCE_PROD_CLIENT_SECRET');
        scope = firstEnv('IHCE_PROD_SCOPE');
        subscriptionKey = firstEnv('IHCE_PROD_SUBSCRIPTION_KEY', 'IHCE_APIM_SUBSCRIPTION_KEY_PROD');
    }

    const forceCustodianNIT = firstEnv(`${envPrefix}CUSTODIAN_NIT`);
    const forceCustodianREPS = firstEnv(`${envPrefix}CUSTODIAN_REPS`);
    const forceCustodianName = firstEnv(`${envPrefix}CUSTODIAN_NAME`);

    const missing = [
        !baseUrl && 'BASE_URL',
        !tenantId && 'TENANT_ID',
        !clientId && 'CLIENT_ID',
        !clientSecret && 'CLIENT_SECRET',
        !scope && 'SCOPE',
        !subscriptionKey && 'SUBSCRIPTION_KEY',
    ].filter(Boolean);
    if (missing.length) {
        const hint =
            envPrefix === 'IHCE_SANDBOX_'
                ? ' Sandbox: IHCE_SANDBOX_* o IHCE_API_BASE_URL, IHCE_TENANT_ID, IHCE_CLIENT_ID, IHCE_CLIENT_SECRET, IHCE_SCOPE, IHCE_APIM_SUBSCRIPTION_KEY.'
                : ' Producción: IHCE_PROD_BASE_URL, IHCE_PROD_TENANT_ID, IHCE_PROD_CLIENT_ID, IHCE_PROD_CLIENT_SECRET, IHCE_PROD_SCOPE, IHCE_PROD_SUBSCRIPTION_KEY.';
        return res.status(500).json({
            ok: false,
            error: `Faltan variables de entorno IHCE (${missing.join(', ')}).${hint}`,
        });
    }

    const httpJson = (url, { method = 'GET', headers = {}, body = null } = {}) =>
        new Promise((resolve, reject) => {
            const u = new URL(url);
            const opts = {
                method,
                hostname: u.hostname,
                path: u.pathname + (u.search || ''),
                headers,
            };
            const req2 = https.request(opts, (resp) => {
                let data = '';
                resp.on('data', (chunk) => (data += chunk));
                resp.on('end', () => resolve({ status: resp.statusCode || 0, headers: resp.headers, body: data }));
            });
            req2.on('error', reject);
            if (body) req2.write(body);
            req2.end();
        });

    try {
        // 1) Obtener Bundle desde el endpoint interno (mismo backend)
        const localBase = `http://localhost:${process.env.PORT || 3000}`;
        const bundleResp = await new Promise((resolve, reject) => {
            const http = require('http');
            const bundleBody = { IdEvaluacionEntidadRDA: id };
            if (overrideCodigoPrestador != null && String(overrideCodigoPrestador).trim()) {
                bundleBody.overrideCodigoPrestador = String(overrideCodigoPrestador).trim();
            }
            if (overrideNitPrestadorIPS != null && String(overrideNitPrestadorIPS).trim()) {
                bundleBody.overrideNitPrestadorIPS = String(overrideNitPrestadorIPS).trim();
            }
            if (overrideNombrePrestadorIPS != null && String(overrideNombrePrestadorIPS).trim()) {
                bundleBody.overrideNombrePrestadorIPS = String(overrideNombrePrestadorIPS).trim();
            }
            const payload = JSON.stringify(bundleBody);
            const req3 = http.request(
                `${localBase}/apiV3/RdaPaciente/FhirBundle`,
                { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
                (resp) => {
                    let data = '';
                    resp.on('data', (c) => (data += c));
                    resp.on('end', () => resolve({ status: resp.statusCode || 0, body: data }));
                }
            );
            req3.on('error', reject);
            req3.write(payload);
            req3.end();
        });
        if (bundleResp.status < 200 || bundleResp.status >= 300) {
            return res.status(500).json({ ok: false, error: `No se pudo construir el Bundle local (status ${bundleResp.status})`, details: bundleResp.body });
        }
        const bundle = JSON.parse(bundleResp.body);

        // IG IHCE RDA Paciente: sin Encounter en el documento; si llega (código viejo en memoria u otro build), quitarlo o BUNDLE-005.
        if (bundle && Array.isArray(bundle.entry)) {
            bundle.entry = bundle.entry.filter(
                (e) => !(e && e.resource && e.resource.resourceType === 'Encounter')
            );
            const compEntry = bundle.entry.find(
                (e) => e && e.resource && e.resource.resourceType === 'Composition'
            );
            if (compEntry && compEntry.resource && compEntry.resource.encounter != null) {
                delete compEntry.resource.encounter;
            }
        }

        // Opcional: forzar custodian para que coincida con el token del prestador (IHCE valida coherencia).
        // Se usa cuando los datos en BD/UI aún no están alineados (NIT/REPS).
        if (forceCustodianREPS && String(forceCustodianREPS).trim()) {
            const reps = String(forceCustodianREPS).trim();
            const nit = forceCustodianNIT != null ? String(forceCustodianNIT).trim() : '';
            const name = forceCustodianName != null && String(forceCustodianName).trim()
                ? String(forceCustodianName).trim()
                : `IPS (${reps})`;

            const entries = Array.isArray(bundle.entry) ? bundle.entry : [];
            const compEntry = entries.find((e) => e && e.resource && e.resource.resourceType === 'Composition');
            if (compEntry && compEntry.resource) {
                compEntry.resource.custodian = { reference: `#${reps}` };
            }

            let orgEntry = entries.find((e) => e && e.resource && e.resource.resourceType === 'Organization' && e.resource.id === reps);
            if (!orgEntry) {
                orgEntry = { resource: { resourceType: 'Organization', id: reps } };
                entries.push(orgEntry);
                bundle.entry = entries;
            }
            orgEntry.resource.active = true;
            orgEntry.resource.meta = orgEntry.resource.meta || { profile: ['https://fhir.minsalud.gov.co/rda/StructureDefinition/CareDeliveryOrganizationRDA'] };
            orgEntry.resource.name = name;
            if (nit) {
                orgEntry.resource.identifier = [
                    {
                        id: 'TaxIdentifier',
                        use: 'official',
                        type: {
                            coding: [
                                { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'TAX', display: 'Tax ID number' },
                                { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'NIT', display: 'Número de Identificación Tributaria' },
                            ],
                        },
                        system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/DIAN',
                        value: nit,
                    },
                    {
                        id: 'HealthcareProviderIdentifier',
                        use: 'official',
                        type: {
                            coding: [
                                { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PRN', display: 'Provider number' },
                                { system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers', code: 'CodigoPrestador', display: 'Código de habilitación de prestador de servicios de salud' },
                            ],
                        },
                        system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                        value: reps,
                    },
                ];
            } else {
                orgEntry.resource.identifier = orgEntry.resource.identifier || [
                    {
                        system: 'https://fhir.minsalud.gov.co/rda/NamingSystem/REPS',
                        value: reps,
                    },
                ];
            }
        }

        // 2) Obtener token Entra (client_credentials)
        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const tokenBody = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            scope,
        }).toString();

        const tokenResp = await httpJson(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(tokenBody) },
            body: tokenBody,
        });
        if (tokenResp.status !== 200) {
            return res.status(502).json({ ok: false, error: `Token IHCE falló (status ${tokenResp.status})`, details: tokenResp.body });
        }
        const tokenJson = JSON.parse(tokenResp.body);
        const accessToken = tokenJson.access_token;
        if (!accessToken) {
            return res.status(502).json({ ok: false, error: 'Token IHCE: respuesta sin access_token', details: tokenJson });
        }

        // 3) Enviar a IHCE
        const sendUrl = `${baseUrl.replace(/\/$/, '')}/Composition/$enviar-rda-paciente`;
        const sendBody = JSON.stringify(bundle);
        const sendResp = await httpJson(sendUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Content-Type': 'application/fhir+json',
                Accept: 'application/fhir+json',
                'Content-Length': Buffer.byteLength(sendBody),
            },
            body: sendBody,
        });

        // Devolver lo que IHCE responde (útil para depurar OperationOutcome)
        return res.status(sendResp.status || 502).send(sendResp.body || '');
    } catch (error) {
        console.error('❌ [RDA] Error en EnviarIHCE:', error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
    }
});

// --- RDA Consulta Externa (tabla principal + hijas, análogo a Evaluacion Entidad RDA) ---
const toDateTimeRDACE = (str) => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

router.post('/EvaluacionEntidadRDACE/', async (req, res) => {
    const {
        DocumentoEntidad, FechaRDA,
        CodigoPrestador, CodigoAdminPlanBeneficios, NombreAdminPlanBeneficios,
        FechaHoraInicioAtencion, FechaHoraFinAtencion,
        TipoDocProfesional, NumDocProfesional,
        DiagnosticoIngresoCIE11Codigo, DiagnosticoIngresoCIE11Termino,
        TipoAlergia,
        EntornoAtencion, TipoFactorRiesgo, NombreFactorRiesgo,
        DiagnosticoPrincipalCIE10Codigo, DiagnosticoPrincipalCIE10Nombre, TipoDiagnosticoPrincipal,
        CondicionDestinoEgreso, CodigoPrestadorRemite,
        AlcanceIncapacidad, DiasIncapacidad, DiasLicenciaMaternidad,
        NombreDocumentoPDF,
        IdModalidadAtencion, IdGrupoServicios, IdViaIngresoUsuario, IdCausaMotivoAtencion,
    } = req.body;

    const rdaceIntOrNull = (v) => {
        if (v == null || v === '') return null;
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : null;
    };

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('FechaRDA', sql.DateTime2, toDateTimeRDACE(FechaRDA) || new Date())
            .input('CodigoPrestador', sql.NVarChar, CodigoPrestador || null)
            .input('CodigoAdminPlanBeneficios', sql.NVarChar, CodigoAdminPlanBeneficios || null)
            .input('NombreAdminPlanBeneficios', sql.NVarChar, NombreAdminPlanBeneficios || null)
            .input('FechaHoraInicioAtencion', sql.DateTime2, toDateTimeRDACE(FechaHoraInicioAtencion))
            .input('FechaHoraFinAtencion', sql.DateTime2, toDateTimeRDACE(FechaHoraFinAtencion))
            .input('TipoDocProfesional', sql.NVarChar, TipoDocProfesional || null)
            .input('NumDocProfesional', sql.NVarChar, NumDocProfesional || null)
            .input('DiagnosticoIngresoCIE11Codigo', sql.NVarChar, DiagnosticoIngresoCIE11Codigo || null)
            .input('DiagnosticoIngresoCIE11Termino', sql.NVarChar, DiagnosticoIngresoCIE11Termino || null)
            .input('TipoAlergia', sql.NVarChar, TipoAlergia || null)
            .input('EntornoAtencion', sql.NVarChar, EntornoAtencion || null)
            .input('TipoFactorRiesgo', sql.NVarChar, TipoFactorRiesgo || null)
            .input('NombreFactorRiesgo', sql.NVarChar, NombreFactorRiesgo || null)
            .input('DiagnosticoPrincipalCIE10Codigo', sql.NVarChar, DiagnosticoPrincipalCIE10Codigo || null)
            .input('DiagnosticoPrincipalCIE10Nombre', sql.NVarChar, DiagnosticoPrincipalCIE10Nombre || null)
            .input('TipoDiagnosticoPrincipal', sql.NVarChar, TipoDiagnosticoPrincipal || null)
            .input('CondicionDestinoEgreso', sql.NVarChar, CondicionDestinoEgreso || null)
            .input('CodigoPrestadorRemite', sql.NVarChar, CodigoPrestadorRemite || null)
            .input('AlcanceIncapacidad', sql.NVarChar, AlcanceIncapacidad || null)
            .input('DiasIncapacidad', sql.Int, DiasIncapacidad != null && DiasIncapacidad !== '' ? parseInt(DiasIncapacidad, 10) : null)
            .input('DiasLicenciaMaternidad', sql.Int, DiasLicenciaMaternidad != null && DiasLicenciaMaternidad !== '' ? parseInt(DiasLicenciaMaternidad, 10) : null)
            .input('NombreDocumentoPDF', sql.NVarChar, NombreDocumentoPDF || null)
            .input('IdModalidadAtencion', sql.Int, rdaceIntOrNull(IdModalidadAtencion))
            .input('IdGrupoServicios', sql.Int, rdaceIntOrNull(IdGrupoServicios))
            .input('IdViaIngresoUsuario', sql.Int, rdaceIntOrNull(IdViaIngresoUsuario))
            .input('IdCausaMotivoAtencion', sql.Int, rdaceIntOrNull(IdCausaMotivoAtencion))
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA Consulta Externa]
                (
                    [Documento Entidad], [Fecha RDA],
                    [Codigo Prestador], [Codigo Admin Plan Beneficios], [Nombre Admin Plan Beneficios],
                    [Fecha Hora Inicio Atencion], [Fecha Hora Fin Atencion],
                    [Tipo Doc Profesional], [Num Doc Profesional],
                    [Diagnostico Ingreso CIE11 Codigo], [Diagnostico Ingreso CIE11 Termino],
                    [Tipo Alergia],
                    [Entorno Atencion], [Tipo Factor Riesgo], [Nombre Factor Riesgo],
                    [Diagnostico Principal CIE10 Codigo], [Diagnostico Principal CIE10 Nombre], [Tipo Diagnostico Principal],
                    [Condicion Destino Egreso], [Codigo Prestador Remite],
                    [Alcance Incapacidad], [Dias Incapacidad], [Dias Licencia Maternidad],
                    [Nombre Documento PDF],
                    [Id Modalidad Atencion], [Id Grupo Servicios], [Id Via Ingreso Usuario], [Id Causa Motivo Atencion]
                )
                OUTPUT INSERTED.[Id Evaluacion Entidad RDA Consulta Externa]
                VALUES
                (
                    @DocumentoEntidad, @FechaRDA,
                    @CodigoPrestador, @CodigoAdminPlanBeneficios, @NombreAdminPlanBeneficios,
                    @FechaHoraInicioAtencion, @FechaHoraFinAtencion,
                    @TipoDocProfesional, @NumDocProfesional,
                    @DiagnosticoIngresoCIE11Codigo, @DiagnosticoIngresoCIE11Termino,
                    @TipoAlergia,
                    @EntornoAtencion, @TipoFactorRiesgo, @NombreFactorRiesgo,
                    @DiagnosticoPrincipalCIE10Codigo, @DiagnosticoPrincipalCIE10Nombre, @TipoDiagnosticoPrincipal,
                    @CondicionDestinoEgreso, @CodigoPrestadorRemite,
                    @AlcanceIncapacidad, @DiasIncapacidad, @DiasLicenciaMaternidad,
                    @NombreDocumentoPDF,
                    @IdModalidadAtencion, @IdGrupoServicios, @IdViaIngresoUsuario, @IdCausaMotivoAtencion
                )
            `);
        const idInsertado = result.recordset[0]['Id Evaluacion Entidad RDA Consulta Externa'];
        res.json({ ok: true, IdEvaluacionEntidadRDACE: idInsertado });
    } catch (error) {
        console.error('❌ Error al insertar Evaluacion Entidad RDA Consulta Externa:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDACE/AntecedentesSalud', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion', sql.NVarChar, Descripcion || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Salud]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdRDACE, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Antecedente Salud:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDACE/AntecedentesFamiliares', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Parentesco, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Parentesco', sql.NVarChar, Parentesco || null)
            .input('Descripcion', sql.NVarChar, Descripcion || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Familiares]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Parentesco], [Descripcion], [Id Estado])
                VALUES (@IdRDACE, @DocumentoEntidad, @Parentesco, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Antecedente Familiar:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDACE/AntecedentesFarmacologicos', async (req, res) => {
    const { IdEvaluacionEntidadRDACE, DocumentoEntidad, Descripcion, IdEstado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('DocumentoEntidad', sql.NVarChar, DocumentoEntidad || null)
            .input('Descripcion', sql.NVarChar, Descripcion || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Antecedentes Farmacologicos]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Documento Entidad], [Descripcion], [Id Estado])
                VALUES (@IdRDACE, @DocumentoEntidad, @Descripcion, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Antecedente Farmacológico:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDACE/DiagnosticosRelacionados', async (req, res) => {
    const {
        IdEvaluacionEntidadRDACE,
        CodigoCIE10, NombreCIE10, CodigoCIE11, TerminoCIE11,
        IdEstado
    } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('CodigoCIE10', sql.NVarChar, CodigoCIE10 || null)
            .input('NombreCIE10', sql.NVarChar, NombreCIE10 || null)
            .input('CodigoCIE11', sql.NVarChar, CodigoCIE11 || null)
            .input('TerminoCIE11', sql.NVarChar, TerminoCIE11 || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Diagnosticos Relacionados]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Codigo CIE10], [Nombre CIE10], [Codigo CIE11], [Termino CIE11], [Id Estado])
                VALUES (@IdRDACE, @CodigoCIE10, @NombreCIE10, @CodigoCIE11, @TerminoCIE11, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Diagnóstico relacionado:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDACE/PrescripcionMedicamentos', async (req, res) => {
    const {
        IdEvaluacionEntidadRDACE,
        tipo, codigo, nombre, dci, fechaPrescripcion,
        dosis, unidadDosis, via,
        duracionCant, duracionUnid, frecuenciaCant, frecuenciaUnid, finalidad,
        IdEstado
    } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('TipoTec', sql.NVarChar, tipo || null)
            .input('CodigoMed', sql.NVarChar, codigo || null)
            .input('NombreMed', sql.NVarChar, nombre || null)
            .input('Dci', sql.NVarChar, dci || null)
            .input('FechaPresc', sql.DateTime2, toDateTimeRDACE(fechaPrescripcion))
            .input('Dosis', sql.NVarChar, dosis != null ? String(dosis) : null)
            .input('UnidadDosis', sql.NVarChar, unidadDosis || null)
            .input('Via', sql.NVarChar, via || null)
            .input('DurCant', sql.NVarChar, duracionCant != null ? String(duracionCant) : null)
            .input('DurUnid', sql.NVarChar, duracionUnid || null)
            .input('FreqCant', sql.NVarChar, frecuenciaCant != null ? String(frecuenciaCant) : null)
            .input('FreqUnid', sql.NVarChar, frecuenciaUnid || null)
            .input('Finalidad', sql.NVarChar, finalidad != null ? String(finalidad) : null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Prescripcion Medicamentos]
                (
                    [Id Evaluacion Entidad RDA Consulta Externa],
                    [Tipo Tec Salud], [Codigo Medicamento], [Nombre Medicamento], [Descripcion Comun DCI],
                    [Fecha Prescripcion], [Dosis Ordenada], [Unidad Medida Dosis], [Via Administracion],
                    [Duracion Cantidad], [Duracion Unidad Tiempo], [Frecuencia Cantidad], [Frecuencia Unidad Tiempo],
                    [Finalidad Tec Salud], [Id Estado]
                )
                VALUES
                (
                    @IdRDACE,
                    @TipoTec, @CodigoMed, @NombreMed, @Dci,
                    @FechaPresc, @Dosis, @UnidadDosis, @Via,
                    @DurCant, @DurUnid, @FreqCant, @FreqUnid,
                    @Finalidad, @IdEstado
                )
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Prescripción medicamento:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDACE/PrescripcionProcedimientos', async (req, res) => {
    const {
        IdEvaluacionEntidadRDACE,
        tipo, codigo, nombre, finalidad, fechaPrescripcion,
        IdEstado
    } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('TipoTec', sql.NVarChar, tipo || null)
            .input('CodigoProc', sql.NVarChar, codigo || null)
            .input('NombreProc', sql.NVarChar, nombre || null)
            .input('Finalidad', sql.NVarChar, finalidad || null)
            .input('FechaPresc', sql.DateTime2, toDateTimeRDACE(fechaPrescripcion))
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Prescripcion Procedimientos]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Tipo Tec Salud], [Codigo Procedimiento], [Nombre Procedimiento], [Finalidad Tec Salud], [Fecha Prescripcion], [Id Estado])
                VALUES (@IdRDACE, @TipoTec, @CodigoProc, @NombreProc, @Finalidad, @FechaPresc, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Prescripción procedimiento:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});

router.post('/EvaluacionEntidadRDACE/OtrasTecnologias', async (req, res) => {
    const {
        IdEvaluacionEntidadRDACE,
        tipo, codigo, nombre, fechaPrescripcion, finalidad,
        IdEstado
    } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdRDACE', sql.Int, parseInt(IdEvaluacionEntidadRDACE, 10))
            .input('TipoTec', sql.NVarChar, tipo || null)
            .input('Codigo', sql.NVarChar, codigo || null)
            .input('Nombre', sql.NVarChar, nombre || null)
            .input('FechaPresc', sql.DateTime2, toDateTimeRDACE(fechaPrescripcion))
            .input('Finalidad', sql.NVarChar, finalidad || null)
            .input('IdEstado', sql.Int, IdEstado ? parseInt(IdEstado, 10) : 1)
            .query(`
                INSERT INTO [dbo].[Evaluacion Entidad RDA CE Otras Tecnologias]
                ([Id Evaluacion Entidad RDA Consulta Externa], [Tipo Tec Salud], [Codigo], [Nombre], [Fecha Prescripcion], [Finalidad Tec Salud], [Id Estado])
                VALUES (@IdRDACE, @TipoTec, @Codigo, @Nombre, @FechaPresc, @Finalidad, @IdEstado)
            `);
        res.json({ ok: true });
    } catch (error) {
        console.error('❌ Error RDACE Otra tecnología:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message });
        }
    }
});


// Egreso y Remisión 1888 — un solo GET: sin q = todo; con ?q= = filtro (evita conflicto de rutas /:param)
router.get('/EgresoRemision', async (req, res) => {
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`
                SELECT  Codigo, Descripcion, IdEstado
                FROM [Cnsta Egreso y Remision 1888]
            `);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`
                SELECT  Codigo, Descripcion, IdEstado
                FROM [Cnsta Egreso y Remision 1888]
                WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Egreso y Remisión:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


router.get('/FactorDeRiesgo', async (req, res) => {
    const q = req.query.q != null ? String(req.query.q).trim() : '';

    try {
        const pool = await poolPromise;

        if (!q) {
            const result = await pool.request().query(`
                SELECT Codigo, Descripcion, IdEstado
                FROM [Cnsta Factor De Riesgo 1888]
            `);
            return res.json(result.recordset);
        }

        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`
                SELECT Codigo, Descripcion, IdEstado
                FROM [Cnsta Factor De Riesgo 1888]
                WHERE Descripcion LIKE @Busqueda 
                   OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error('❌ Error al obtener Factor De Riesgo:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});


router.get('/TipoTecnologiaEnSalud', async (req, res) => {
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`
                SELECT Codigo, Descripcion, IdEstado
                FROM [Cnsta Tipo de tecnología en salud 1888]
            `);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`
                SELECT Codigo, Descripcion, IdEstado
                FROM [Cnsta Tipo de tecnología en salud 1888]
                WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener Tipo de tecnología en salud:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});

/** Catálogos RDA Consulta Externa — vista [Cnsta ... 1888], ?q= opcional (whitelist) */
const RDACE_CATALOGOS_1888 = {
    EntornoAtencion: '[Cnsta Entorno de atencion 1888]',
    TipoAlergia: '[Cnsta Tipo de alergia 1888]',
    ParentescoFamiliar: '[Cnsta Parentesco familiar RDA 1888]',
    TipoDiagnosticoPrincipal: '[Cnsta Tipo diagnostico principal 1888]',
    UnidadMedidaDosis: '[Cnsta Unidad medida dosis 1888]',
    ViaAdministracionMedicamento: '[Cnsta Via administracion medicamento 1888]',
    UnidadTiempoDuracion: '[Cnsta Unidad tiempo duracion 1888]',
    UnidadTiempoFrecuencia: '[Cnsta Unidad tiempo frecuencia 1888]',
    FinalidadTecnologiaSalud: '[Cnsta Finalidad tecnologia salud 1888]',
    OtraTecnologiaCategoria: '[Cnsta Otra tecnologia categoria 1888]',
    AlcanceIncapacidad: '[Cnsta Alcance incapacidad 1888]',
};

router.get('/Catalogo1888/:clave', async (req, res) => {
    const viewName = RDACE_CATALOGOS_1888[req.params.clave];
    if (!viewName) {
        return res.status(404).json({ error: 'Catálogo no encontrado', clave: req.params.clave });
    }
    const q = req.query.q != null ? String(req.query.q).trim() : '';
    try {
        const pool = await poolPromise;
        if (!q) {
            const result = await pool.request().query(`
                SELECT Codigo, Descripcion, IdEstado
                FROM ${viewName}
            `);
            return res.json(result.recordset);
        }
        const result = await pool.request()
            .input('Busqueda', sql.VarChar, '%' + q + '%')
            .query(`
                SELECT Codigo, Descripcion, IdEstado
                FROM ${viewName}
                WHERE Descripcion LIKE @Busqueda OR CAST(Codigo AS NVARCHAR(50)) LIKE @Busqueda
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error catálogo 1888', req.params.clave, error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
});

// ============================== Desrelacionador RIPS (listado + borrado) ==============================
function mapRowDesrelacionadorRips(row, origenTabla) {
    const idFactura = row.IdFactura != null ? Number(row.IdFactura) : 0;
    const idPlan = row.IdPlanTratamiento != null ? Number(row.IdPlanTratamiento) : 0;
    const totalCab = row.TotalFacturaCabecera != null ? Number(row.TotalFacturaCabecera) : null;
    const valII = row.ValorFacturaII != null ? Number(row.ValorFacturaII) : null;

    let facturaTipo = 'sin';
    let facturaEtiqueta = 'Sin factura';
    let valorReportado = null;

    if (idPlan > 0) {
        facturaTipo = 'eps';
        const nro = row.NroPlanTratamiento != null ? String(row.NroPlanTratamiento).trim() : String(idPlan);
        facturaEtiqueta = `PLAN-TR-${nro} (EPS)`;
        valorReportado = valII != null && !Number.isNaN(valII) ? valII : totalCab;
    } else if (idFactura > 0) {
        facturaTipo = 'particular';
        const pref = row.PrefijoFactura != null ? String(row.PrefijoFactura).trim() : '';
        const nof = row.NoFactura != null ? String(row.NoFactura).trim() : '';
        facturaEtiqueta = nof ? `FEV-${pref}${nof}` : `FEV-ID${idFactura}`;
        valorReportado = totalCab != null && !Number.isNaN(totalCab) ? totalCab : valII;
    }

    const cups1 = row.Cups1 != null ? String(row.Cups1).trim() : '';
    const cups2 = row.Cups2 != null ? String(row.Cups2).trim() : '';
    const cie1 = row.Cie1 != null ? String(row.Cie1).trim() : '';
    const cie2 = row.Cie2 != null ? String(row.Cie2).trim() : '';
    const parts = [];
    if (cups1) parts.push(cups1);
    if (cups2 && cups2 !== 'null') parts.push(cups2);
    const cupsStr = parts.length ? parts.join(' + ') : '';
    const cieParts = [cie1, cie2 && cie2 !== 'null' ? cie2 : ''].filter(Boolean);
    const cieStr = cieParts.join(' / ');
    const cupsCie = [cupsStr, cieStr].filter(Boolean).join(' — ') || '—';

    const esEv = row.EsEvolucion === 1 || row.EsEvolucion === true;
    const prefijoEval = esEv ? 'EV' : 'HC';

    return {
        origenTabla,
        idRipsRelacion: row.IdRipsRelacion,
        idEvaluacion: row.IdEvaluacion,
        fechaEvaluacion: row.FechaEvaluacion,
        prefijoEvalDisplay: prefijoEval,
        idTipoEvaluacion: row.IdTipoEvaluacion,
        descripcionTipoEvaluacion: row.DescripcionTipoEvaluacion,
        cupsCie,
        facturaTipo,
        facturaEtiqueta,
        valorReportado,
        idFactura: idFactura > 0 ? idFactura : null,
        idPlanTratamiento: idPlan > 0 ? idPlan : null,
    };
}

router.get('/relacionesRipsDesrelacionador/:documentoPaciente/:documentoUsuario/:fechaInicio/:fechaFin', async (req, res) => {
    try {
        const documentoPaciente = (req.params.documentoPaciente || '').trim();
        const documentoUsuario = (req.params.documentoUsuario || '').trim();
        const fechaInicio = req.params.fechaInicio;
        const fechaFin = req.params.fechaFin;

        if (!documentoPaciente || !documentoUsuario || !fechaInicio || !fechaFin) {
            return res.status(400).json({ ok: false, error: 'Parámetros incompletos' });
        }

        const pool = await poolPromise;

        const sqlV1 = `
            SELECT
                er.[Id Evaluación Entidad Rips] AS IdRipsRelacion,
                er.[Id Evaluación Entidad] AS IdEvaluacion,
                ee.[Fecha Evaluación Entidad] AS FechaEvaluacion,
                ee.[Id Tipo de Evaluación] AS IdTipoEvaluacion,
                te.[Descripción Tipo de Evaluación] AS DescripcionTipoEvaluacion,
                CASE WHEN te.[Descripción Tipo de Evaluación] LIKE N'%voluc%' THEN 1 ELSE 0 END AS EsEvolucion,
                er.[Codigo Rips] AS Cups1,
                er.[Codigo Rips2] AS Cups2,
                er.[Diagnostico Rips] AS Cie1,
                er.[Diagnostico Rips2] AS Cie2,
                er.[Id Factura] AS IdFactura,
                er.[Id Plan de Tratamiento] AS IdPlanTratamiento,
                f.[No Factura] AS NoFactura,
                ev.[Prefijo Resolución Facturación EmpresaV] AS PrefijoFactura,
                f.[Total Factura] AS TotalFacturaCabecera,
                fii.[Valor FacturaII] AS ValorFacturaII,
                pt.[Nro Plan de Tratamiento] AS NroPlanTratamiento
            FROM [Evaluación Entidad Rips] er
            INNER JOIN [Evaluación Entidad] ee ON ee.[Id Evaluación Entidad] = er.[Id Evaluación Entidad]
            LEFT JOIN [Tipo de Evaluación] te ON te.[Id Tipo de Evaluación] = ee.[Id Tipo de Evaluación]
            LEFT JOIN Factura f ON f.[Id Factura] = er.[Id Factura] AND NULLIF(er.[Id Factura], 0) IS NOT NULL
            LEFT JOIN EmpresaV ev ON f.[Id EmpresaV] = ev.[Id EmpresaV]
            LEFT JOIN FacturaII fii ON fii.[Id Factura] = er.[Id Factura]
                AND fii.[Id Plan de Tratamiento] = er.[Id Plan de Tratamiento]
                AND NULLIF(er.[Id Plan de Tratamiento], 0) IS NOT NULL
            LEFT JOIN [Plan de Tratamiento] pt ON pt.[Id Plan de Tratamiento] = er.[Id Plan de Tratamiento]
            WHERE ee.[Documento Entidad] = @docPac
              AND ee.[Documento Usuario] = @docUsr
              AND CAST(ee.[Fecha Evaluación Entidad] AS DATE) BETWEEN CAST(@fechaIni AS DATE) AND CAST(@fechaFin AS DATE)
        `;

        const sqlV2 = `
            SELECT
                er.[Id Evaluación Entidad Rips] AS IdRipsRelacion,
                er.[Id Evaluación Entidad] AS IdEvaluacion,
                ee.[Fecha Evaluación Entidad] AS FechaEvaluacion,
                ee.[Id Tipo de Evaluación] AS IdTipoEvaluacion,
                te.[Descripción Tipo de Evaluación] AS DescripcionTipoEvaluacion,
                CASE WHEN te.[Descripción Tipo de Evaluación] LIKE N'%voluc%' THEN 1 ELSE 0 END AS EsEvolucion,
                er.[Cups] AS Cups1,
                er.[Cups 2] AS Cups2,
                er.[Cie] AS Cie1,
                er.[Cie 2] AS Cie2,
                er.[Id Factura] AS IdFactura,
                er.[Id Plan de Tratamiento] AS IdPlanTratamiento,
                f.[No Factura] AS NoFactura,
                ev.[Prefijo Resolución Facturación EmpresaV] AS PrefijoFactura,
                f.[Total Factura] AS TotalFacturaCabecera,
                fii.[Valor FacturaII] AS ValorFacturaII,
                pt.[Nro Plan de Tratamiento] AS NroPlanTratamiento
            FROM [Evaluación Entidad Rips V2] er
            INNER JOIN [Evaluación Entidad] ee ON ee.[Id Evaluación Entidad] = er.[Id Evaluación Entidad]
            LEFT JOIN [Tipo de Evaluación] te ON te.[Id Tipo de Evaluación] = ee.[Id Tipo de Evaluación]
            LEFT JOIN Factura f ON f.[Id Factura] = er.[Id Factura] AND NULLIF(er.[Id Factura], 0) IS NOT NULL
            LEFT JOIN EmpresaV ev ON f.[Id EmpresaV] = ev.[Id EmpresaV]
            LEFT JOIN FacturaII fii ON fii.[Id Factura] = er.[Id Factura]
                AND fii.[Id Plan de Tratamiento] = er.[Id Plan de Tratamiento]
                AND NULLIF(er.[Id Plan de Tratamiento], 0) IS NOT NULL
            LEFT JOIN [Plan de Tratamiento] pt ON pt.[Id Plan de Tratamiento] = er.[Id Plan de Tratamiento]
            WHERE ee.[Documento Entidad] = @docPac
              AND ee.[Documento Usuario] = @docUsr
              AND CAST(ee.[Fecha Evaluación Entidad] AS DATE) BETWEEN CAST(@fechaIni AS DATE) AND CAST(@fechaFin AS DATE)
        `;

        const reqBase = pool.request()
            .input('docPac', sql.NVarChar(50), documentoPaciente)
            .input('docUsr', sql.NVarChar(50), documentoUsuario)
            .input('fechaIni', sql.VarChar(10), fechaInicio)
            .input('fechaFin', sql.VarChar(10), fechaFin);

        const r1 = await reqBase.query(sqlV1);
        let r2 = { recordset: [] };
        try {
            r2 = await pool.request()
                .input('docPac', sql.NVarChar(50), documentoPaciente)
                .input('docUsr', sql.NVarChar(50), documentoUsuario)
                .input('fechaIni', sql.VarChar(10), fechaInicio)
                .input('fechaFin', sql.VarChar(10), fechaFin)
                .query(sqlV2);
        } catch (e2) {
            console.warn('relacionesRipsDesrelacionador: consulta V2 omitida o tabla no disponible:', e2.message);
        }

        const out = [];
        (r1.recordset || []).forEach((row) => out.push(mapRowDesrelacionadorRips(row, 'Rips')));
        (r2.recordset || []).forEach((row) => out.push(mapRowDesrelacionadorRips(row, 'RipsV2')));

        out.sort((a, b) => new Date(b.fechaEvaluacion) - new Date(a.fechaEvaluacion));
        res.json({ ok: true, items: out });
    } catch (error) {
        console.error('❌ relacionesRipsDesrelacionador GET:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message || 'Error interno' });
        }
    }
});

router.delete('/relacionesRipsDesrelacionador', async (req, res) => {
    try {
        const idRipsRelacion = parseInt(req.body?.idRipsRelacion, 10);
        const origenTabla = req.body?.origenTabla === 'RipsV2' ? 'RipsV2' : 'Rips';
        const documentoPaciente = (req.body?.documentoPaciente || '').trim();

        if (!idRipsRelacion || Number.isNaN(idRipsRelacion) || !documentoPaciente) {
            return res.status(400).json({ ok: false, error: 'idRipsRelacion, origenTabla y documentoPaciente son requeridos' });
        }

        const tabla = origenTabla === 'RipsV2' ? '[Evaluación Entidad Rips V2]' : '[Evaluación Entidad Rips]';

        const pool = await poolPromise;
        const check = await pool.request()
            .input('idRips', sql.Int, idRipsRelacion)
            .input('docPac', sql.NVarChar(50), documentoPaciente)
            .query(`
                SELECT ee.[Documento Entidad] AS DocumentoPaciente
                FROM ${tabla} er
                INNER JOIN [Evaluación Entidad] ee ON ee.[Id Evaluación Entidad] = er.[Id Evaluación Entidad]
                WHERE er.[Id Evaluación Entidad Rips] = @idRips
            `);

        if (!check.recordset || check.recordset.length === 0) {
            return res.status(404).json({ ok: false, error: 'Registro RIPS no encontrado' });
        }

        const docDb = (check.recordset[0].DocumentoPaciente || '').trim();
        if (docDb !== documentoPaciente) {
            return res.status(403).json({ ok: false, error: 'El documento no coincide con el registro' });
        }

        await pool.request()
            .input('idRips', sql.Int, idRipsRelacion)
            .query(`DELETE FROM ${tabla} WHERE [Id Evaluación Entidad Rips] = @idRips`);

        res.json({ ok: true, message: 'RIPS desrelacionado correctamente' });
    } catch (error) {
        console.error('❌ relacionesRipsDesrelacionador DELETE:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: error.message || 'Error al eliminar' });
        }
    }
});

// =================================================================================================
module.exports = router;
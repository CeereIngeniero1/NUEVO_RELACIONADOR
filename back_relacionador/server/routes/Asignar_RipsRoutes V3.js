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
//se deja como ejemplo de retorno de la API de ICD-11
//Aca se configura los Ripos por defecto, ojo en el futuro se debe habilitar la manera para que esto se haga desde el 
//relacionador y exista rips por defecto para cada profesional
const defaultCIE11 = [
    // { theCode: '1B10', title: 'Tuberculosis de los pulmones' },
    // { theCode: '5A11', title: 'Diabetes mellitus tipo 2' },
    // { theCode: 'BA41', title: 'Insuficiencia cardíaca' },
    // { theCode: '1D0Z', title: 'Infección viral de sitio no especificado' },
    // { theCode: '6D70', title: 'Trastorno de ansiedad generalizada' }
];

const router = Router();

router.get('/icd11/search/:query?', async (req, res) => {
    try {
        const query = req.params.query;
        if (!query || query.trim() === "" || query === "undefined") {
            if (Array.isArray(defaultCIE11) && defaultCIE11.length > 0) {
                return res.json(defaultCIE11);
            }
            // No depender de defaults: obtener sugerencias iniciales desde API CIE-11.
            const seedTerms = ['a', 'e', 's'];
            for (const seed of seedTerms) {
                const seedResults = await icd11.search(seed);
                if (Array.isArray(seedResults) && seedResults.length > 0) {
                    return res.json(seedResults.slice(0, 20));
                }
            }
            return res.json([]);
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

// ModalidadAtencion + GrupoServicios: usar pool mssql (db2), no connection.execSql.
// El front (wireSyncRips.js) hace Promise.all de ambos; tedious solo admite un request a la vez por conexión → 500 en paralelo.
router.get('/ModalidadAtencion', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT IdModalidadAtencion, Codigo, NombreModalidadAtencion,
                   DescripcionModalidadAtencion, OrdenModalidadAtencion, [Id Estado]
            FROM [Cnsta Relacionador Modalidad Atencion]
        `);
        res.json(result.recordset || []);
    } catch (error) {
        console.error('❌ ModalidadAtencion (pool):', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
    }
});

router.get('/GrupoServicios', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT IdGrupoServicios, Codigo, NombreGrupoServicios,
                   DescripcionGrupoServicios, [Orden Grupo Servicios], [Id Estado]
            FROM [Cnsta Relacionador ModalidadGrupoServicioTecSal]
        `);
        res.json(result.recordset || []);
    } catch (error) {
        console.error('❌ GrupoServicios (pool):', error);
        if (!res.headersSent) res.status(500).send('Error interno del servidor');
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

    console.log(req.body);
    console.log(IdOcupacion);
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


// --- RDA Paciente — rutas en archivo separado (rda/RdaPacienteRoutes.js) ---
router.use(require('./rda/RdaPacienteRoutes'));
// --- RDA Consulta Externa — rutas en archivo separado (rda/RdaConsultaExternaRoutes.js) ---
router.use(require('./rda/RdaConsultaExternaRoutes'));
// --- Envío masivo RDA pendientes (listado + lotes vía EnviarIHCE) ---
router.use(require('./rda/RdaEnvioMasivoRoutes'));

module.exports = router;
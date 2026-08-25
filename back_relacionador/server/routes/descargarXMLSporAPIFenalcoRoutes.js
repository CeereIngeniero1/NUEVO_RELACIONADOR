const { Request, TYPES } = require('tedious');
const Router = require('express').Router;
const connection = require('../db'); // Reutilizamos la conexión existente
const fs = require('fs');
const path = require('path');
const soap = require('soap');
const { getRipsDataRoot } = require('../config/paths');
const {
    existeXmlEmpresa,
    guardarXmlEmpresa,
} = require('../utils/xmlCache');

const RIPS_ROOT = getRipsDataRoot();

const router = Router();

/* ENDPOINT PARA DESCARGAR LOS XMLS POR LA API DE FACTURATECH BY: CAMILO FLEZLADE */
router.get('/mostrar-empresas-con-resoluciones-vigentes', async (req, res) => {
    try {
        if (connection.state.name !== 'LoggedIn') {
            return res.status(500).send('La conexión a la base de datos no está en un estado válido');
        }

        const query = `
            SELECT
                Emp.[Nombre Comercial Empresa] AS NombreComercialEmpresa,
                Emp.[Documento Empresa] AS DocumentoEmpresa,
                EmpV.[Id EmpresaV] AS IdEmpresaV,
                EmpV.[Prefijo Resolución Facturación EmpresaV] + EmpV.[Resolución Facturación EmpresaV] AS ResolucionFacturacion
            FROM
                Empresa Emp
            INNER JOIN 
                EmpresaV EmpV ON Emp.[Documento Empresa] = EmpV.[Documento Empresa]
            WHERE 
                EmpV.[Id Estado] = 7
        `;

        const result = [];
        const request = new Request(query, (err, rowCount) => {
            if (err) {
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error ejecutando la consulta');
            }

            res.json(result);
        });

        request.on('row', columns => {
            const rowObject = {};
            columns.forEach(column => {
                rowObject[column.metadata.colName] = column.value;
            });
            result.push(rowObject);
        });

        connection.execSql(request);
    } catch (error) {
        console.error('Error inesperado:', error);
        res.status(500).send('Error inesperado');
    }
});

router.get('/mostrar-resoluciones-vigentes-segun-empresa-seleccionada/:empresa', async (req, res) => {
    const EmpresaSeleccionadaPorElCliente = req.params.empresa;
    if (!EmpresaSeleccionadaPorElCliente) {
        return res.status(400).send('Debe seleccionar una empresa');
    }

    try {
        if (connection.state.name !== 'LoggedIn') {
            return res.status(500).send('La conexión a la base de datos no está en un estado válido');
        }

        const query = `
            SELECT 
                EmpV.[Resolución Facturación EmpresaV] as Resolucion,
                EmpV.[Prefijo Resolución Facturación EmpresaV] + EmpV.[Resolución Facturación EmpresaV] AS ResolucionVigente,
                EmpV.[Prefijo Resolución Facturación EmpresaV] AS PrefijoResolucionVigente
            FROM 
                EmpresaV EmpV
            INNER JOIN
                Empresa Emp ON EmpV.[Documento Empresa] = Emp.[Documento Empresa]
            WHERE
                EmpV.[Id Estado] = 7 AND EmpV.[Documento Empresa] = @EmpresaSeleccionada
        `;

        const result = [];
        const request = new Request(query, (err, rowCount) => {
            if (err) {
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error ejecutando la consulta');
            }

            res.json(result);
        });

        // Añadir el parámetro a la consulta
        request.addParameter('EmpresaSeleccionada', TYPES.NVarChar, EmpresaSeleccionadaPorElCliente);

        request.on('row', columns => {
            const rowObject = {};
            columns.forEach(column => {
                rowObject[column.metadata.colName] = column.value;
            });
            result.push(rowObject);
        });

        connection.execSql(request);
    } catch (error) {
        console.error('Error inesperado:', error);
        res.status(500).send('Error inesperado');
    }
});

router.post('/descargarxmls-api-fenalco/:prefijo/:fechainicial/:fechafinal/:documentoempresa', async (req, res) => {
    const { prefijo, fechainicial, fechafinal, documentoempresa } = req.params;
    console.log(`Prefijo: ${prefijo}, Fecha Inicial: ${fechainicial}, Fecha Final: ${fechafinal}, Documento Empresa: ${documentoempresa}`);

    try {
        if (connection.state.name !== 'LoggedIn') {
            return res.status(500).send('La conexión a la base de datos no está en un estado válido');
        }

        // Consulta de facturas
        const queryFacturas = `
            SELECT 
                Fac.[No Factura] AS NoFactura, 
                CONVERT(VARCHAR, Fac.[Fecha Factura], 103) AS FechaFactura, 
                EmpV.[Prefijo Resolución Facturación EmpresaV] AS Prefijo,
                Empv.idnumeracionFenalco
            FROM 
                Factura Fac
            INNER JOIN 
                EmpresaV EmpV ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
            INNER JOIN 
                Empresa Emp ON EmpV.[Documento Empresa] = Emp.[Documento Empresa]
            WHERE 
                ( EmpV.[Id Estado] = 7 ) AND
                ( Fac.EstadoFacturaElectronica >= 1 ) AND
                ( CAST(Fac.[Fecha Factura] AS DATE) BETWEEN @FechaInicial AND @FechaFinal ) AND 
                ( EmpV.[Prefijo Resolución Facturación EmpresaV] = @Prefijo ) 
                -- AND
				-- ( EXISTS ( SELECT 1 FROM [Evaluación Entidad Rips] RIPS WHERE RIPS.[Id Factura] = Fac.[Id -- Factura] ) )
        `;
        // console.log(queryFacturas);

        const facturas = [];
        const requestFacturas = new Request(queryFacturas, (err, rowCount) => {
            if (err) {
                console.error('Error ejecutando la consulta de facturas:', err);
                return res.status(500).send({ message: `Error ejecutando la consulta de facturas. Detalles => ${err}` });
            }

            if (rowCount === 0) {
                console.log('No se encontraron facturas');
                return res.status(404).send({ message: 'No se encontraron facturas aptas en el rango de fechas ingresado.' });
            }

            // Si hay facturas, ejecutar la consulta de credenciales
            consultarCredenciales();
        });

        requestFacturas.on('row', columns => {
            const rowObject = {};
            columns.forEach(column => {
                rowObject[column.metadata.colName] = column.value;
            });
            facturas.push(rowObject);
        });

        requestFacturas.addParameter('Prefijo', TYPES.NVarChar, prefijo);
        requestFacturas.addParameter('FechaInicial', TYPES.Date, new Date(fechainicial));
        requestFacturas.addParameter('FechaFinal', TYPES.Date, new Date(fechafinal));
        connection.execSql(requestFacturas);

        const ContenidoCredenciales = [];
        // Función para consultar credenciales
        const consultarCredenciales = () => {
            const queryCredenciales = `
                SELECT 
                    [Usuario], [Contrasena], [Documento Empresa], [URL SOAP] AS 'URLSOAP'
                FROM
                    [CredencialesWSDLFacturaTech]
                WHERE
                    [Documento Empresa] = @DocumentoEmpresa
            `;

            // const ContenidoCredenciales = [];
            const requestCredenciales = new Request(queryCredenciales, (err, rowCount) => {
                if (err) {
                    console.error('Error ejecutando la consulta de credenciales:', err);
                    return res.status(500).send({ message: `Error ejecutando la consulta de credenciales. Detalles => ${err}` });
                }

                if (rowCount === 0) {
                    console.log('No se encontraron credenciales');
                    return res.status(404).send({ message: 'No se encontraron credenciales de WSDL asociadas a la empresa de trabajo. Tabla [CredencialesWSDLFacturaTech]' });
                }

                // Procesar las facturas después de obtener las credenciales
                processFacturas();
            });

            requestCredenciales.on('row', columns => {
                const FilaCapturada = {};
                columns.forEach(column => {
                    FilaCapturada[column.metadata.colName] = column.value;
                });
                ContenidoCredenciales.push(FilaCapturada);
                console.log(`Fila Capturada: ${JSON.stringify(FilaCapturada)}`);
            });

            requestCredenciales.on('doneInProc', () => {
                console.log('----------------------------------------------------------------');
                console.log('Contenido Credenciales:', JSON.stringify(ContenidoCredenciales, null, 2));
                console.log('----------------------------------------------------------------');
            });

            requestCredenciales.addParameter('DocumentoEmpresa', TYPES.NVarChar, documentoempresa);
            connection.execSql(requestCredenciales);
        };

        let processedCount = 0;
        const resultadosFinales = [];
        const processNextFactura = (listfacturas, token, wsdlUrl) => {
            if (!Array.isArray(listfacturas) || listfacturas.length === 0) {
                return res.status(200).json({
                    message: 'No hay facturas para procesar.',
                    facturas: []
                });
            }

            try {
                if (Array.isArray(listfacturas)) {
                    // console.log(listfacturas);
                    let promises = listfacturas.map(Factura => {
                        let Parametros = {
                            token: token,
                            idnumeracion: Factura.idnumeracionFenalco,
                            numero: Factura.NoFactura
                        };

                        const cached = existeXmlEmpresa(RIPS_ROOT, documentoempresa, Factura.Prefijo, Factura.NoFactura);

                        if (cached) {
                            console.log('El archivo XML ya existe (carpeta empresa):', cached);
                            let resultado = {
                                factura: Factura.NoFactura,
                                estado: 'El archivo XML ya existe',
                                filePath: cached
                            };
                            resultadosFinales.push(resultado);
                            return Promise.resolve();
                        }


                        return new Promise((resolve, reject) => {
                            soap.createClient(wsdlUrl, (err, client) => {
                                if (err) {
                                    console.error(`Error al crear el cliente SOAP para la factura ${Factura.NoFactura}:`, err);
                                    return reject(err);
                                }

                                client.setEndpoint('https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService');

                                client.obtenerApplicationResponseyAttachedDocument2(Parametros, (err, result) => {
                                    if (err) {
                                        console.error(`Error al obtener ApplicationResponseyAttachedDocument2 para la factura ${Factura.NoFactura}:`, err);
                                        return reject(err);
                                    }

                                    try {
                                        const response = JSON.parse(result.return);
                                        let base64 = response.data.attachedDocument;
                                        let buffer = Buffer.from(base64, 'base64');
                                        let xmlcontenido = buffer.toString('utf8');
                                        const saved = guardarXmlEmpresa(
                                            RIPS_ROOT,
                                            documentoempresa,
                                            Factura.Prefijo,
                                            Factura.NoFactura,
                                            xmlcontenido
                                        );
                                        resultadosFinales.push({
                                            factura: Factura.NoFactura,
                                            estado: 'XML guardado exitosamente',
                                            filePath: saved,
                                        });
                                        resolve(response.data.attachedDocument);
                                    } catch (parseError) {
                                        console.error(`Error al parsear la respuesta de la factura ${Factura.NoFactura}:`, parseError);
                                        reject(parseError);
                                    }
                                });
                            });
                        });
                    });


                    Promise.all(promises)
                        .then(() => {
                            return res.status(200).json({
                                message: 'Proceso finalizado',
                                facturas: resultadosFinales, // <- usa la variable externa que construiste tú mismo
                            });
                        })
                        .catch(err => {
                            console.error(`Error procesando factura ${Factura.NoFactura}:`, err);
                            resultadosFinales.push({
                                factura: Factura.NoFactura,
                                estado: 'Error',
                                error: err.message || err
                            });
                            resolve(); // resolver aún si falló, para no detener Promise.all
                        });

                    // Promise.all(promises)
                    //     .then(() => console.log("Todas las facturas han sido procesadas exitosamente."))
                    //     .catch(err => console.error("Error procesando las facturas:", err));

                }



            } catch (error) {
                console.error('Error procesando los datos recibidos:', error);
                // factura.estado = 'Error procesando los datos recibidos';
                // resultadosFinales.push(factura);  // Agrega la factura a los resultados
                // processedCount++;
                // processNextFactura(facturas[processedCount]);
            }

            // processNextFactura(facturas[0]);
        }










        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        const processFacturas = () => {
            if (facturas.length === 0) {
                return res.status(404).send('No se encontraron facturas para procesar');
            }



            const wsdlUrl = 'https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService?wsdl';
            let Token;
            const loginData = {
                login: ContenidoCredenciales[0].Usuario, // Reemplaza con tu usuario real
                password: ContenidoCredenciales[0].Contrasena // Reemplaza con tu contraseña real
            };

            soap.createClient(wsdlUrl, (err, client) => {
                if (err) {
                    console.error('Error al crear el cliente SOAP:', err);
                    return;
                }

                client.setEndpoint('https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService');

                client.autenticar(loginData, (err, result) => {
                    if (err) {
                        console.error('Error al autenticar:', err);
                        return "prueba";
                    }

                    try {
                        const response = JSON.parse(result.return);
                        console.log('Token de autenticación:', response.data.salida);
                        Token = response.data.salida;

                        console.log('Token de autenticación:', Token);
                        console.log(facturas);

                        processNextFactura(facturas, response.data.salida, wsdlUrl);
                    } catch (parseError) {
                        console.error('Error al parsear la respuesta:', parseError);
                        return parseError;
                    }
                });


            });



        };



    } catch (error) {
        console.error('Error inesperado:', error);
        res.status(500).send('Error inesperado');
    }
});

/** Todo en uno: XMLs sin filtro de resolución/prefijo; carpeta RIPS --- fechas */
router.post('/descargarxmls-api-fenalco-sin-prefijo/:fechainicial/:fechafinal/:documentoempresa', async (req, res) => {
    const { fechainicial, fechafinal, documentoempresa } = req.params;
    const batchFolder = `RIPS --- ${fechainicial} --- ${fechafinal}`;
    console.log(`[sin-prefijo Fenalco] Fechas: ${fechainicial} - ${fechafinal}, Empresa: ${documentoempresa}`);

    try {
        if (connection.state.name !== 'LoggedIn') {
            return res.status(500).send('La conexión a la base de datos no está en un estado válido');
        }

        const queryFacturas = `
            SELECT 
                Fac.[No Factura] AS NoFactura, 
                CONVERT(VARCHAR, Fac.[Fecha Factura], 103) AS FechaFactura, 
                EmpV.[Prefijo Resolución Facturación EmpresaV] AS Prefijo,
                Empv.idnumeracionFenalco
            FROM 
                Factura Fac
            INNER JOIN 
                EmpresaV EmpV ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
            INNER JOIN 
                Empresa Emp ON EmpV.[Documento Empresa] = Emp.[Documento Empresa]
            WHERE 
                ( Fac.EstadoFacturaElectronica >= 1 ) AND
                ( CAST(Fac.[Fecha Factura] AS DATE) BETWEEN @FechaInicial AND @FechaFinal ) AND 
                ( Emp.[Documento Empresa] = @DocumentoEmpresa ) AND
                ( EXISTS ( SELECT 1 FROM [Evaluación Entidad Rips] RIPS WHERE RIPS.[Id Factura] = Fac.[Id Factura] ) )
        `;

        const facturas = [];
        const requestFacturas = new Request(queryFacturas, (err, rowCount) => {
            if (err) {
                console.error('Error ejecutando la consulta de facturas:', err);
                return res.status(500).send({ message: `Error ejecutando la consulta de facturas. Detalles => ${err}` });
            }

            if (rowCount === 0) {
                console.log('No se encontraron facturas');
                return res.status(404).send({ message: 'No se encontraron facturas aptas en el rango de fechas ingresado.' });
            }

            consultarCredenciales();
        });

        requestFacturas.on('row', columns => {
            const rowObject = {};
            columns.forEach(column => {
                rowObject[column.metadata.colName] = column.value;
            });
            facturas.push(rowObject);
        });

        requestFacturas.addParameter('FechaInicial', TYPES.Date, new Date(fechainicial));
        requestFacturas.addParameter('FechaFinal', TYPES.Date, new Date(fechafinal));
        requestFacturas.addParameter('DocumentoEmpresa', TYPES.NVarChar, documentoempresa);
        connection.execSql(requestFacturas);

        const ContenidoCredenciales = [];
        const consultarCredenciales = () => {
            const queryCredenciales = `
                SELECT 
                    [Usuario], [Contrasena], [Documento Empresa], [URL SOAP] AS 'URLSOAP'
                FROM
                    [CredencialesWSDLFacturaTech]
                WHERE
                    [Documento Empresa] = @DocumentoEmpresa
            `;

            const requestCredenciales = new Request(queryCredenciales, (err, rowCount) => {
                if (err) {
                    console.error('Error ejecutando la consulta de credenciales:', err);
                    return res.status(500).send({ message: `Error ejecutando la consulta de credenciales. Detalles => ${err}` });
                }

                if (rowCount === 0) {
                    return res.status(404).send({ message: 'No se encontraron credenciales de WSDL asociadas a la empresa de trabajo. Tabla [CredencialesWSDLFacturaTech]' });
                }

                processFacturas();
            });

            requestCredenciales.on('row', columns => {
                const FilaCapturada = {};
                columns.forEach(column => {
                    FilaCapturada[column.metadata.colName] = column.value;
                });
                ContenidoCredenciales.push(FilaCapturada);
            });

            requestCredenciales.addParameter('DocumentoEmpresa', TYPES.NVarChar, documentoempresa);
            connection.execSql(requestCredenciales);
        };

        const resultadosFinales = [];
        const processNextFactura = (listfacturas, token, wsdlUrl) => {
            if (!Array.isArray(listfacturas) || listfacturas.length === 0) {
                return res.status(200).json({
                    message: 'No hay facturas para procesar.',
                    facturas: [],
                    batchFolder,
                });
            }

            const promises = listfacturas.map(Factura => {
                const cached = existeXmlEmpresa(RIPS_ROOT, documentoempresa, Factura.Prefijo, Factura.NoFactura);

                if (cached) {
                    resultadosFinales.push({
                        factura: Factura.NoFactura,
                        Prefijo: Factura.Prefijo,
                        estado: 'El archivo XML ya existe',
                        filePath: cached
                    });
                    return Promise.resolve();
                }

                const Parametros = {
                    token: token,
                    idnumeracion: Factura.idnumeracionFenalco,
                    numero: Factura.NoFactura
                };

                return new Promise((resolve, reject) => {
                    soap.createClient(wsdlUrl, (err, client) => {
                        if (err) {
                            resultadosFinales.push({
                                factura: Factura.NoFactura,
                                Prefijo: Factura.Prefijo,
                                estado: 'Error',
                                error: err.message || String(err)
                            });
                            return resolve();
                        }

                        client.setEndpoint('https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService');

                        client.obtenerApplicationResponseyAttachedDocument2(Parametros, (err, result) => {
                            if (err) {
                                resultadosFinales.push({
                                    factura: Factura.NoFactura,
                                    Prefijo: Factura.Prefijo,
                                    estado: 'Error',
                                    error: err.message || String(err)
                                });
                                return resolve();
                            }

                            try {
                                const response = JSON.parse(result.return);
                                const base64 = response.data.attachedDocument;
                                const buffer = Buffer.from(base64, 'base64');
                                const xmlcontenido = buffer.toString('utf8');
                                const saved = guardarXmlEmpresa(
                                    RIPS_ROOT,
                                    documentoempresa,
                                    Factura.Prefijo,
                                    Factura.NoFactura,
                                    xmlcontenido
                                );
                                resultadosFinales.push({
                                    factura: Factura.NoFactura,
                                    Prefijo: Factura.Prefijo,
                                    estado: 'XML guardado exitosamente',
                                    filePath: saved
                                });
                                resolve();
                            } catch (parseError) {
                                resultadosFinales.push({
                                    factura: Factura.NoFactura,
                                    Prefijo: Factura.Prefijo,
                                    estado: 'Error',
                                    error: parseError.message || String(parseError)
                                });
                                resolve();
                            }
                        });
                    });
                });
            });

            Promise.all(promises)
                .then(() => {
                    return res.status(200).json({
                        message: 'Proceso finalizado',
                        facturas: resultadosFinales,
                        batchFolder,
                    });
                })
                .catch(err => {
                    console.error('Error procesando facturas Fenalco sin-prefijo:', err);
                    return res.status(500).send({ message: 'Error procesando facturas', error: err.message || String(err) });
                });
        };

        const processFacturas = () => {
            if (facturas.length === 0) {
                return res.status(404).send('No se encontraron facturas para procesar');
            }

            const wsdlUrl = 'https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService?wsdl';
            const loginData = {
                login: ContenidoCredenciales[0].Usuario,
                password: ContenidoCredenciales[0].Contrasena
            };

            soap.createClient(wsdlUrl, (err, client) => {
                if (err) {
                    console.error('Error al crear el cliente SOAP:', err);
                    return res.status(500).send({ message: 'Error al crear el cliente SOAP Fenalco' });
                }

                client.setEndpoint('https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService');

                client.autenticar(loginData, (err, result) => {
                    if (err) {
                        console.error('Error al autenticar:', err);
                        return res.status(500).send({ message: 'Error al autenticar en Fenalco' });
                    }

                    try {
                        const response = JSON.parse(result.return);
                        processNextFactura(facturas, response.data.salida, wsdlUrl);
                    } catch (parseError) {
                        console.error('Error al parsear la respuesta:', parseError);
                        return res.status(500).send({ message: 'Error al parsear autenticación Fenalco' });
                    }
                });
            });
        };
    } catch (error) {
        console.error('Error inesperado:', error);
        res.status(500).send('Error inesperado');
    }
});

router.post('/descargarxmls-api-fenalco Respaldo/:prefijo/:fechainicial/:fechafinal/:documentoempresa', async (req, res) => {
    const { prefijo, fechainicial, fechafinal, documentoempresa } = req.params;
    console.log(`Prefijo: ${prefijo}, Fecha Inicial: ${fechainicial}, Fecha Final: ${fechafinal}, Documento Empresa: ${documentoempresa}`);

    try {
        if (connection.state.name !== 'LoggedIn') {
            return res.status(500).send('La conexión a la base de datos no está en un estado válido');
        }

        // Consulta de facturas
        const queryFacturas = `
            SELECT 
                Fac.[No Factura] AS NoFactura, 
                CONVERT(VARCHAR, Fac.[Fecha Factura], 103) AS FechaFactura, 
                EmpV.[Prefijo Resolución Facturación EmpresaV] AS Prefijo,
                Empv.idnumeracionFenalco
            FROM 
                Factura Fac
            INNER JOIN 
                EmpresaV EmpV ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
            INNER JOIN 
                Empresa Emp ON EmpV.[Documento Empresa] = Emp.[Documento Empresa]
            WHERE 
                ( EmpV.[Id Estado] = 7 ) AND
                ( Fac.EstadoFacturaElectronica >= 1 ) AND
                ( CAST(Fac.[Fecha Factura] AS DATE) BETWEEN @FechaInicial AND @FechaFinal ) AND 
                ( EmpV.[Prefijo Resolución Facturación EmpresaV] = @Prefijo ) 
                -- AND
				-- ( EXISTS ( SELECT 1 FROM [Evaluación Entidad Rips] RIPS WHERE RIPS.[Id Factura] = Fac.[Id -- Factura] ) )
        `;
        // console.log(queryFacturas);

        const facturas = [];
        const requestFacturas = new Request(queryFacturas, (err, rowCount) => {
            if (err) {
                console.error('Error ejecutando la consulta de facturas:', err);
                return res.status(500).send({ message: `Error ejecutando la consulta de facturas. Detalles => ${err}` });
            }

            if (rowCount === 0) {
                console.log('No se encontraron facturas');
                return res.status(404).send({ message: 'No se encontraron facturas aptas en el rango de fechas ingresado.' });
            }

            // Si hay facturas, ejecutar la consulta de credenciales
            consultarCredenciales();
        });

        requestFacturas.on('row', columns => {
            const rowObject = {};
            columns.forEach(column => {
                rowObject[column.metadata.colName] = column.value;
            });
            facturas.push(rowObject);
        });

        requestFacturas.addParameter('Prefijo', TYPES.NVarChar, prefijo);
        requestFacturas.addParameter('FechaInicial', TYPES.Date, new Date(fechainicial));
        requestFacturas.addParameter('FechaFinal', TYPES.Date, new Date(fechafinal));
        connection.execSql(requestFacturas);

        const ContenidoCredenciales = [];
        // Función para consultar credenciales
        const consultarCredenciales = () => {
            const queryCredenciales = `
                SELECT 
                    [Usuario], [Contrasena], [Documento Empresa], [URL SOAP] AS 'URLSOAP'
                FROM
                    [CredencialesWSDLFacturaTech]
                WHERE
                    [Documento Empresa] = @DocumentoEmpresa
            `;

            // const ContenidoCredenciales = [];
            const requestCredenciales = new Request(queryCredenciales, (err, rowCount) => {
                if (err) {
                    console.error('Error ejecutando la consulta de credenciales:', err);
                    return res.status(500).send({ message: `Error ejecutando la consulta de credenciales. Detalles => ${err}` });
                }

                if (rowCount === 0) {
                    console.log('No se encontraron credenciales');
                    return res.status(404).send({ message: 'No se encontraron credenciales de WSDL asociadas a la empresa de trabajo. Tabla [CredencialesWSDLFacturaTech]' });
                }

                // Procesar las facturas después de obtener las credenciales
                processFacturas();
            });

            requestCredenciales.on('row', columns => {
                const FilaCapturada = {};
                columns.forEach(column => {
                    FilaCapturada[column.metadata.colName] = column.value;
                });
                ContenidoCredenciales.push(FilaCapturada);
                console.log(`Fila Capturada: ${JSON.stringify(FilaCapturada)}`);
            });

            requestCredenciales.on('doneInProc', () => {
                console.log('----------------------------------------------------------------');
                console.log('Contenido Credenciales:', JSON.stringify(ContenidoCredenciales, null, 2));
                console.log('----------------------------------------------------------------');
            });

            requestCredenciales.addParameter('DocumentoEmpresa', TYPES.NVarChar, documentoempresa);
            connection.execSql(requestCredenciales);
        };

        let processedCount = 0;
        const resultadosFinales = [];
        const processNextFactura = (listfacturas, token, wsdlUrl) => {
            if (!listfacturas) {
                // Al finalizar todas las facturas, devolver los resultados al cliente.
                return res.status(200).json({
                    message: 'Proceso finalizado',
                    facturas: resultadosFinales,
                });
            }

            try {
                if (Array.isArray(listfacturas)) {
                    // console.log(listfacturas);
                    let promises = listfacturas.map(Factura => {
                        let Parametros = {
                            token: token,
                            idnumeracion: Factura.idnumeracionFenalco,
                            numero: Factura.NoFactura
                        };

                        const cached = existeXmlEmpresa(RIPS_ROOT, documentoempresa, Factura.Prefijo, Factura.NoFactura);

                        if (cached) {
                            console.log('El archivo XML ya existe (carpeta empresa):', cached);
                            resultadosFinales.push({
                                factura: Factura.NoFactura,
                                estado: 'El archivo XML ya existe',
                                filePath: cached,
                            });
                            processedCount++;
                            return Promise.resolve();
                        }

                        return new Promise((resolve, reject) => {
                            soap.createClient(wsdlUrl, (err, client) => {
                                if (err) {
                                    console.error(`Error al crear el cliente SOAP para la factura ${Factura.NoFactura}:`, err);
                                    return reject(err);
                                }

                                client.setEndpoint('https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService');

                                client.obtenerApplicationResponseyAttachedDocument2(Parametros, (err, result) => {
                                    if (err) {
                                        console.error(`Error al obtener ApplicationResponseyAttachedDocument2 para la factura ${Factura.NoFactura}:`, err);
                                        return reject(err);
                                    }

                                    try {
                                        const response = JSON.parse(result.return);
                                        let base64 = response.data.attachedDocument;
                                        let buffer = Buffer.from(base64, 'base64');
                                        let xmlcontenido = buffer.toString('utf8');
                                        const saved = guardarXmlEmpresa(
                                            RIPS_ROOT,
                                            documentoempresa,
                                            Factura.Prefijo,
                                            Factura.NoFactura,
                                            xmlcontenido
                                        );
                                        resultadosFinales.push({
                                            factura: Factura.NoFactura,
                                            estado: 'XML guardado exitosamente',
                                            filePath: saved,
                                        });
                                        resolve(response.data.attachedDocument);
                                    } catch (parseError) {
                                        console.error(`Error al parsear la respuesta de la factura ${Factura.NoFactura}:`, parseError);
                                        reject(parseError);
                                    }
                                });
                            });
                        });
                    });


                    Promise.all(promises)
                        .then((resultadosFinales) => {
                            return res.status(200).json({
                                message: 'Proceso finalizado',
                                facturas: resultadosFinales,
                            });
                        })
                        .catch(err => {
                            console.error("Error procesando las facturas:", err);
                            return res.status(500).json({
                                message: 'Error al procesar las facturas',
                                error: err.message || err
                            });
                        });

                    // Promise.all(promises)
                    //     .then(() => console.log("Todas las facturas han sido procesadas exitosamente."))
                    //     .catch(err => console.error("Error procesando las facturas:", err));

                }



            } catch (error) {
                console.error('Error procesando los datos recibidos:', error);
                // factura.estado = 'Error procesando los datos recibidos';
                // resultadosFinales.push(factura);  // Agrega la factura a los resultados
                // processedCount++;
                // processNextFactura(facturas[processedCount]);
            }

            // processNextFactura(facturas[0]);
        }










        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        const processFacturas = () => {
            if (facturas.length === 0) {
                return res.status(404).send('No se encontraron facturas para procesar');
            }



            const wsdlUrl = 'https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService?wsdl';
            let Token;
            const loginData = {
                login: ContenidoCredenciales[0].Usuario, // Reemplaza con tu usuario real
                password: ContenidoCredenciales[0].Contrasena // Reemplaza con tu contraseña real
            };

            soap.createClient(wsdlUrl, (err, client) => {
                if (err) {
                    console.error('Error al crear el cliente SOAP:', err);
                    return;
                }

                client.setEndpoint('https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService');

                client.autenticar(loginData, (err, result) => {
                    if (err) {
                        console.error('Error al autenticar:', err);
                        return "prueba";
                    }

                    try {
                        const response = JSON.parse(result.return);
                        console.log('Token de autenticación:', response.data.salida);
                        Token = response.data.salida;

                        console.log('Token de autenticación:', Token);
                        console.log(facturas);

                        processNextFactura(facturas, response.data.salida, wsdlUrl);
                    } catch (parseError) {
                        console.error('Error al parsear la respuesta:', parseError);
                        return parseError;
                    }
                });


            });



        };



    } catch (error) {
        console.error('Error inesperado:', error);
        res.status(500).send('Error inesperado');
    }
});


/** Stream NDJSON: progreso factura a factura (todo en uno / Fenalco) */
router.post('/descargarxmls-stream-fenalco-sin-prefijo/:fechainicial/:fechafinal/:documentoempresa', async (req, res) => {
    const { fechainicial, fechafinal, documentoempresa } = req.params;
    const batchFolderOf = (prefijo, tipo) => `${prefijo || 'SIN'} --- ${tipo} --- ${fechainicial} --- ${fechafinal}`;
    const batchFoldersOf = (prefijo) => [
        batchFolderOf(prefijo, 'EPS'),
        batchFolderOf(prefijo, 'PARTICULAR'),
    ];
    const batchFoldersSet = new Set();

    const send = (obj) => {
        if (!res.writableEnded) {
            res.write(`${JSON.stringify(obj)}\n`);
            if (typeof res.flush === 'function') res.flush();
        }
    };

    try {
        if (connection.state.name !== 'LoggedIn') {
            res.status(500);
            return res.end(`${JSON.stringify({ type: 'error', message: 'La conexión a la base de datos no está en un estado válido' })}\n`);
        }

        res.status(200);
        res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('X-Accel-Buffering', 'no');
        if (typeof res.flushHeaders === 'function') res.flushHeaders();

        const queryFacturas = `
            SELECT 
                Fac.[No Factura] AS NoFactura, 
                CONVERT(VARCHAR, Fac.[Fecha Factura], 103) AS FechaFactura, 
                EmpV.[Prefijo Resolución Facturación EmpresaV] AS Prefijo,
                Empv.idnumeracionFenalco
            FROM Factura Fac
            INNER JOIN EmpresaV EmpV ON Fac.[Id EmpresaV] = EmpV.[Id EmpresaV]
            INNER JOIN Empresa Emp ON EmpV.[Documento Empresa] = Emp.[Documento Empresa]
            WHERE 
                ( Fac.EstadoFacturaElectronica >= 1 ) AND
                ( CAST(Fac.[Fecha Factura] AS DATE) BETWEEN @FechaInicial AND @FechaFinal ) AND 
                ( Emp.[Documento Empresa] = @DocumentoEmpresa ) AND
                ( EXISTS ( SELECT 1 FROM [Evaluación Entidad Rips] RIPS WHERE RIPS.[Id Factura] = Fac.[Id Factura] ) )
        `;

        const facturas = [];
        const requestFacturas = new Request(queryFacturas, (err, rowCount) => {
            if (err) {
                send({ type: 'error', message: `Error consultando facturas: ${err.message || err}` });
                return res.end();
            }
            if (rowCount === 0) {
                send({ type: 'error', message: 'No se encontraron facturas aptas en el rango de fechas ingresado.', status: 404 });
                return res.end();
            }
            consultarCredenciales();
        });

        requestFacturas.on('row', columns => {
            const rowObject = {};
            columns.forEach(column => {
                rowObject[column.metadata.colName] = column.value;
            });
            facturas.push(rowObject);
        });

        requestFacturas.addParameter('FechaInicial', TYPES.Date, new Date(fechainicial));
        requestFacturas.addParameter('FechaFinal', TYPES.Date, new Date(fechafinal));
        requestFacturas.addParameter('DocumentoEmpresa', TYPES.NVarChar, documentoempresa);
        connection.execSql(requestFacturas);

        const ContenidoCredenciales = [];
        const consultarCredenciales = () => {
            const queryCredenciales = `
                SELECT [Usuario], [Contrasena], [Documento Empresa], [URL SOAP] AS 'URLSOAP'
                FROM [CredencialesWSDLFacturaTech]
                WHERE [Documento Empresa] = @DocumentoEmpresa
            `;
            const requestCredenciales = new Request(queryCredenciales, (err, rowCount) => {
                if (err) {
                    send({ type: 'error', message: `Error consultando credenciales: ${err.message || err}` });
                    return res.end();
                }
                if (rowCount === 0) {
                    send({ type: 'error', message: 'No se encontraron credenciales de WSDL asociadas a la empresa.' });
                    return res.end();
                }
                autenticarYProcesar();
            });
            requestCredenciales.on('row', columns => {
                const FilaCapturada = {};
                columns.forEach(column => {
                    FilaCapturada[column.metadata.colName] = column.value;
                });
                ContenidoCredenciales.push(FilaCapturada);
            });
            requestCredenciales.addParameter('DocumentoEmpresa', TYPES.NVarChar, documentoempresa);
            connection.execSql(requestCredenciales);
        };

        const descargarUna = (Factura, token, wsdlUrl) => new Promise((resolve) => {
            const folders = batchFoldersOf(Factura.Prefijo);
            folders.forEach((bf) => batchFoldersSet.add(bf));
            const cached = existeXmlEmpresa(RIPS_ROOT, documentoempresa, Factura.Prefijo, Factura.NoFactura);

            if (cached) {
                return resolve({
                    NoFactura: Factura.NoFactura,
                    Prefijo: Factura.Prefijo,
                    FechaFactura: Factura.FechaFactura,
                    estado: 'El archivo XML ya existe',
                    filePath: cached,
                    batchFolder: folders[0],
                    batchFolders: folders,
                });
            }

            const Parametros = {
                token,
                idnumeracion: Factura.idnumeracionFenalco,
                numero: Factura.NoFactura,
            };

            soap.createClient(wsdlUrl, (err, client) => {
                if (err) {
                    return resolve({
                        NoFactura: Factura.NoFactura,
                        Prefijo: Factura.Prefijo,
                        FechaFactura: Factura.FechaFactura,
                        estado: `Error creando cliente SOAP: ${err.message || err}`,
                        batchFolder: folders[0],
                        batchFolders: folders,
                    });
                }

                client.setEndpoint('https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService');
                client.obtenerApplicationResponseyAttachedDocument2(Parametros, (err2, result) => {
                    if (err2) {
                        return resolve({
                            NoFactura: Factura.NoFactura,
                            Prefijo: Factura.Prefijo,
                            FechaFactura: Factura.FechaFactura,
                            estado: `Error SOAP: ${err2.message || err2}`,
                            batchFolder: folders[0],
                            batchFolders: folders,
                        });
                    }
                    try {
                        const response = JSON.parse(result.return);
                        const base64 = response.data.attachedDocument;
                        const xmlcontenido = Buffer.from(base64, 'base64').toString('utf8');
                        const primaryPath = guardarXmlEmpresa(
                            RIPS_ROOT,
                            documentoempresa,
                            Factura.Prefijo,
                            Factura.NoFactura,
                            xmlcontenido
                        );
                        resolve({
                            NoFactura: Factura.NoFactura,
                            Prefijo: Factura.Prefijo,
                            FechaFactura: Factura.FechaFactura,
                            estado: 'XML guardado exitosamente',
                            filePath: primaryPath,
                            batchFolder: folders[0],
                            batchFolders: folders,
                        });
                    } catch (parseError) {
                        resolve({
                            NoFactura: Factura.NoFactura,
                            Prefijo: Factura.Prefijo,
                            FechaFactura: Factura.FechaFactura,
                            estado: `Error parseando respuesta: ${parseError.message || parseError}`,
                            batchFolder: folders[0],
                            batchFolders: folders,
                        });
                    }
                });
            });
        });

        const autenticarYProcesar = () => {
            const wsdlUrl = 'https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService?wsdl';
            const loginData = {
                login: ContenidoCredenciales[0].Usuario,
                password: ContenidoCredenciales[0].Contrasena,
            };

            soap.createClient(wsdlUrl, (err, client) => {
                if (err) {
                    send({ type: 'error', message: 'Error al crear el cliente SOAP Fenalco' });
                    return res.end();
                }
                client.setEndpoint('https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService');
                client.autenticar(loginData, async (errAuth, result) => {
                    if (errAuth) {
                        send({ type: 'error', message: 'Error al autenticar en Fenalco' });
                        return res.end();
                    }
                    try {
                        const response = JSON.parse(result.return);
                        const token = response.data.salida;
                        const total = facturas.length;
                        send({ type: 'start', total, batchFolders: [], facturador: 'Fenalco' });

                        const resultadosFinales = [];
                        for (let i = 0; i < facturas.length; i++) {
                            const Factura = facturas[i];
                            send({
                                type: 'progress',
                                index: i + 1,
                                total,
                                NoFactura: Factura.NoFactura,
                                Prefijo: Factura.Prefijo,
                                mensaje: `Descargando ${Factura.Prefijo || ''}${Factura.NoFactura} → EPS + PARTICULAR`,
                            });
                            const row = await descargarUna(Factura, token, wsdlUrl);
                            resultadosFinales.push(row);
                            send({
                                type: 'factura',
                                index: i + 1,
                                total,
                                NoFactura: row.NoFactura,
                                Prefijo: row.Prefijo,
                                FechaFactura: row.FechaFactura,
                                estado: row.estado,
                                filePath: row.filePath || '',
                                batchFolder: row.batchFolder,
                                batchFolders: row.batchFolders || [],
                            });
                        }

                        send({ type: 'done', message: 'Proceso finalizado', facturas: resultadosFinales, batchFolders: [...batchFoldersSet] });
                        res.end();
                    } catch (parseError) {
                        send({ type: 'error', message: 'Error al parsear autenticación Fenalco' });
                        res.end();
                    }
                });
            });
        };
    } catch (error) {
        console.error('Error inesperado stream Fenalco:', error);
        if (!res.headersSent) res.status(500);
        send({ type: 'error', message: error.message || 'Error inesperado' });
        if (!res.writableEnded) res.end();
    }
});


module.exports = router;
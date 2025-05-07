const { Request, TYPES } = require('tedious');
const Router = require('express').Router;
const connection = require('../db'); // Reutilizamos la conexión existente
const fs = require('fs');
const path = require('path');
const soap = require('soap');

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





router.post('/descargarxmls-api-facturatech/:prefijo/:fechainicial/:fechafinal/:documentoempresa', async (req, res) => {
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
                ( EmpV.[Prefijo Resolución Facturación EmpresaV] = @Prefijo ) AND
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
                    return res.status(500).send({message: `Error ejecutando la consulta de credenciales. Detalles => ${err}`});
                }

                if (rowCount === 0) {
                    console.log('No se encontraron credenciales');
                    return res.status(404).send({message: 'No se encontraron credenciales de WSDL asociadas a la empresa de trabajo. Tabla [CredencialesWSDLFacturaTech]'});
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

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        const processFacturas = () => {
            if (facturas.length === 0) {
                return res.status(404).send('No se encontraron facturas para procesar');
            }
        
            let processedCount = 0;
            const resultadosFinales = [];
        
            const processNextFactura = (factura, token) => {
                if (!factura) {
                    // Al finalizar todas las facturas, devolver los resultados al cliente.
                    return res.status(200).json({
                        message: 'Proceso finalizado',
                        facturas: resultadosFinales,
                    });
                }
        
                const RutaVerificarSiExisteElXML = path.join('C:', 'CeereSio', 'RIPS_2275', 'XMLS', `${prefijo} --- ${fechainicial} --- ${fechafinal}`, `${factura.Prefijo}${factura.NoFactura}.xml`);
        
                if (fs.existsSync(RutaVerificarSiExisteElXML)) {
                    console.log('El archivo XML ya existe:', RutaVerificarSiExisteElXML);
                    factura.estado = 'El archivo XML ya existe';
                    factura.filePath = RutaVerificarSiExisteElXML;
                    resultadosFinales.push(factura);  // Agrega la factura a los resultados
                    processedCount++;
                    processNextFactura(facturas[processedCount]);
                    return;
                }
        
                let soapUrl = ContenidoCredenciales[0].URLSOAP || 'https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService?wsdl';
        
                const args = {
                    token: token,
                    idnumeracion: factura.idnumeracionFenalco, 
                    numero: factura.NoFactura
                };
        
                soap.createClient(soapUrl, async (err, client) => {

                    await delay(100);
                    if (err) {
                        console.error('Error creando el cliente SOAP:', err);
                        factura.estado = 'Error creando el cliente SOAP';
                        resultadosFinales.push(factura);  // Agrega la factura a los resultados
                        processedCount++;
                        processNextFactura(facturas[processedCount]);
                        return;
                    }
                    
                    client.setEndpoint('https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService');

                    client.obtenerApplicationResponseyAttachedDocument2(args, (err, result) => {
                        const archivo = path.join(carpeta, `${numero.toString()}.xml` );
    
                        if (err) {
                            console.error(`Error al obtener ApplicationResponseyAttachedDocument2 para la factura ${numero}:`, err);
                            return reject(err);
                        }
    
                        try {
                            const response = JSON.parse(result.return);
                            // console.log(`Factura ${numero} - XML en base 64:`, response.data.attachedDocument);
                            // console.log(`Factura ${numero} - XML en base 64:`, response.data.attachedDocument);
                            let base64 = response.data.attachedDocument;
                            let buffer = Buffer.from(base64, 'base64');
                            let xmlcontenido = buffer.toString('utf8');
                            // console.log(xmlcontenido);
                            if(!fs.existsSync(carpeta)){
                                fs.mkdirSync(carpeta, { recursive: true});
                            }
                            
                            fs.writeFileSync(archivo, xmlcontenido, 'utf8');
                            resolve(response.data.attachedDocument);
                        } catch (parseError) {
                            console.error(`Error al parsear la respuesta de la factura ${numero}:`, parseError);
                            reject(parseError);
                        }
                    });
                    /////////////Esto sepára
        
                    client['SERVICES-FACTURATECH']['SERVICES-FACTURATECHPort']['FtechAction.downloadXMLFile'](args, (err, result) => {
                        if (err) {
                            console.error('Error llamando a FtechAction.downloadXMLFile:', err);
                            factura.estado = 'Error en la llamada SOAP';
                            resultadosFinales.push(factura);  // Agrega la factura a los resultados
                            processedCount++;
                            processNextFactura(facturas[processedCount]);
                            return;
                        }
        
                        if (!result || !result.return) {
                            console.error('Respuesta del servicio incompleta o nula:', result);
                            factura.estado = 'Respuesta del servicio incompleta o nula';
                            resultadosFinales.push(factura);  // Agrega la factura a los resultados
                            processedCount++;
                            processNextFactura(facturas[processedCount]);
                            return;
                        }
        
                        const code = result.return.code.$value;
                        const error = result.return.error?.$value || '';
        
                        const NotificarProblemasConAPI = false;
        
                        if (code !== "201" && (error.toLowerCase().includes('password') || error.toLowerCase().includes('usuario'))) {
                            if (NotificarProblemasConAPI) {
                                console.error(`Error en la respuesta SOAP: Código ${code}, Error: ${error}`);
                            }
                            // factura.estado = `Error en la respuesta SOAP: Código ${code}, Error: ${error}`;
                            // resultadosFinales.push(factura);  // Agrega la factura a los resultados
                            // processedCount++;
                            // processNextFactura(facturas[processedCount]);
                            // return;
                            return res.status(404).send({message: `Error en la respuesta SOAP: Código ${code}, Error: ${error}`});
                        }
        
                        if (code === "409" || error.toLowerCase().includes('no ha sido procesado')) {
                            factura.estado = error;
                        } else {
                            factura.estado = 'XML guardado exitosamente';
                        }
        
                        const resourceData = result.return.resourceData;
        
                        if (!resourceData || !resourceData.$value) {
                            console.log('No se recibió ningún dato válido del servicio.');
                            // factura.estado = 'No se recibió ningún dato válido del servicio';
                            factura.estado = error;
                            resultadosFinales.push(factura);  // Agrega la factura a los resultados
                            processedCount++;
                            processNextFactura(facturas[processedCount]);
                            return;
                        }
        
                        try {
                            const base64Data = resourceData.$value;
                            const xmlData = Buffer.from(base64Data, 'base64').toString('utf8');
                            const carpetaPath = path.join('C:', 'CeereSio', 'RIPS_2275', 'XMLS', `${prefijo} --- ${fechainicial} --- ${fechafinal}`);
                            fs.mkdirSync(carpetaPath, { recursive: true });
                            const filePath = path.join(carpetaPath, `${args.prefijo}${args.folio}.xml`);
        
                            fs.writeFile(filePath, xmlData, { encoding: 'utf8' }, (err) => {
                                if (err) {
                                    console.error('Error guardando archivo XML:', err);
                                    factura.estado = 'Error guardando archivo XML';
                                } else {
                                    console.log('Archivo XML guardado exitosamente:', filePath);
                                    factura.filePath = filePath;
                                    factura.estado = 'XML guardado exitosamente';
                                }
                                resultadosFinales.push(factura);  // Agrega la factura a los resultados
                                processedCount++;
                                processNextFactura(facturas[processedCount]);
                            });
                        } catch (error) {
                            console.error('Error procesando los datos recibidos:', error);
                            factura.estado = 'Error procesando los datos recibidos';
                            resultadosFinales.push(factura);  // Agrega la factura a los resultados
                            processedCount++;
                            processNextFactura(facturas[processedCount]);
                        }
                    });
                });
        
            };

            const auntenticacion = (facturas) => {
                const wsdlUrl = 'https://factible.fenalcoantioquia.com/FactibleWebService/FacturacionWebService?wsdl';
                    let Token ;
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
                                return;
                            }
                            
                            try {
                                const response = JSON.parse(result.return);
                                console.log('Token de autenticación:', response.data.salida );
                                Token = response.data.salida;
                               // processNextFactura(facturas, response.data.salida);
                               console.log();
                            } catch (parseError) {
                                console.error('Error al parsear la respuesta:', parseError);
                            }
                        });

                        
                    });
            };
        
            auntenticacion(facturas[0]);
        };
        
        

    } catch (error) {
        console.error('Error inesperado:', error);
        res.status(500).send('Error inesperado');
    }
});

module.exports = router;
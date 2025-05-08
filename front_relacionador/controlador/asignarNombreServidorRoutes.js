const fs = require("fs");
const path = require("path");
const os = require('os');


/* FUNCIONAMIENTO PARA CAPTURAR EL NOMBRE DEL EQUIPO Y ASIGNARLO A LAS VARIABLES DE LOS ARCHIVOS NECESARIOS */

    // Obtener el nombre del equipo
    const hostname = os.hostname();
    const Servidor = hostname;
    console.log(Servidor);

    // Nombre/Ruta de los archivos que se van a modificar
    // const ArchivosAModificar = ['./public/RIPS.js', './public/script.js','./public/Asignar_RIPS.js','./public/MaestroListasRIPS.js'];
    const ArchivosAModificar = ['./public/NombreEquipoServidor.js'];


    // const RutaArchivos = "public\\";

    for (const element of ArchivosAModificar) {
        const filePath = element;
        const fileName = path.basename(filePath, '.js');
        const tempFilePath = path.join(path.dirname(filePath), `${fileName}_temp.js`);

        // Leer el contenido del archivo
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error al leer el archivo:', err);
                return;
            }

            // let updatedContent = data.replace(/const servidor\s*=\s*".*";/, `const servidor = "${Servidor}";`);
            let updatedContent = data.replace(/const NombreServidor\s*=\s*".*";/, `const NombreServidor = "${Servidor}";`);


            // Escribir el contenido actualizado en el archivo temporal
            fs.writeFile(tempFilePath, updatedContent, 'utf8', (err) => {
                if (err) {
                    console.error('Error al escribir en el archivo temporal:', err);
                    return;
                }

                // Reemplazar el archivo original con el archivo temporal
                fs.rename(tempFilePath, filePath, (err) => {
                    if (err) {
                        console.error('Error al reemplazar el archivo original:', err);
                    } else {
                        console.log(`Archivo ${filePath} actualizado correctamente`);
                    }
                });
            });
        });
    }
/* FIN FIN FIN */
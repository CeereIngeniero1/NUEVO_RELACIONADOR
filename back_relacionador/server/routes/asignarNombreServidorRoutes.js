const fs = require("fs");
const path = require("path");
const os = require('os');


/* FUNCIONAMIENTO PARA CAPTURAR EL NOMBRE DEL EQUIPO Y ASIGNARLO A LAS VARIABLES DE LOS ARCHIVOS NECESARIOS */

    // Obtener el nombre del equipo
    const hostname = os.hostname();
    const Servidor = hostname;
    console.log(Servidor);

    // Nombre/Ruta de los archivos que se van a modificar
    const ArchivosAModificar = ['../RIPS.js', '../script.js','../Asignar_RIPS.js','../MaestroListasRIPS.js'];



    for (let c = 0; c < ArchivosAModificar.length; c++) {
        const filePath = ArchivosAModificar[c];
        const fileName = path.basename(filePath, '.js');
        const tempFilePath = path.join(path.dirname(filePath), `${fileName}_temp.js`);

        // Leer el contenido del archivo
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error al leer el archivo:', err);
                return;
            }

            let updatedContent = data.replace(/const servidor\s*=\s*".*";/, `const servidor = "${Servidor}";`);


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
const servidor = "HPRED241";

// Funcionalidad para incorporar buscador en el select de los pacientes
$(document).ready(function(e) {
    $('#listaPaciente').select2({
        width: '100%', // Ajusta el ancho al contenedor
        dropdownAutoWidth: true, // Ajusta automáticamente el ancho del menú
        // placeholder: "Buscar",
        templateSelection: function (data) {
            // Truncar el texto a 50 caracteres y añadir puntos suspensivos
            var truncatedText = data.text.length > 50 ? data.text.substring(0, 50) + '...' : data.text;
            return $('<span>' + truncatedText + '</span>');
        }
    })
})

const checkboxParticular = document.getElementById('checkbox1')
const checkboxPrepagada = document.getElementById('checkbox2')
const span_paciente = document.getElementById('span_paciente')
const tabla = document.querySelector('.tabla')
const listasPrepagada = document.querySelector('.listasPrepagada')
const facturaCero = document.querySelector('.facturaCero')

checkboxParticular.addEventListener('change', () => {
    if (checkboxParticular.checked) {
        checkboxPrepagada.checked = false;
        span_paciente.textContent = 'Seleccionar paciente:';
        tabla.style.display = 'flex';
        listasPrepagada.style.display = 'none';
        facturaCero.style.display = 'flex';
        alerta();
    }
});

checkboxPrepagada.addEventListener('change', () => {
    if (checkboxPrepagada.checked) {
        checkboxParticular.checked = false
        span_paciente.textContent = 'Seleccionar EPS:'
        alerta();
        tabla.style.display = 'none';
        listasPrepagada.style.display = 'flex';
        facturaCero.style.display = 'none';
    }
})

if (checkboxPrepagada.checked) {
    tabla.style.display = 'none';
    facturaCero.style.display = 'none';
}

if (checkboxParticular.checked) {

}

// const updatePacientesSelect = (pacientes) => {
//     const selectPaciente = document.querySelector('#listaPaciente');
//     selectPaciente.innerHTML = ""; // Limpiar opciones antiguas

//     // Agregar opción "Sin Seleccionar" al principio
//     const optionSinSeleccionar = document.createElement("option");
//     optionSinSeleccionar.value = "Sin Seleccionar";
//     optionSinSeleccionar.text = "Sin Seleccionar";
//     selectPaciente.appendChild(optionSinSeleccionar);

//     // Agregar opciones al select
//     pacientes.forEach((paciente) => {
//         const option = document.createElement("option");
//         option.value = paciente.documento;
//         option.text = `${paciente.nombre} - ${paciente.tipoDocumento} ${paciente.documento} `;
//         selectPaciente.appendChild(option);
//     });
// };
const updatePacientesSelect = (pacientes) => {
    const selectPaciente = document.querySelector('#listaPaciente');
    selectPaciente.innerHTML = ""; // Limpiar opciones antiguas

    // Agregar opción "Sin Seleccionar" al principio
    const optionSinSeleccionar = document.createElement("option");
    optionSinSeleccionar.value = "Sin Seleccionar";
    optionSinSeleccionar.text = "Sin Seleccionar";
    selectPaciente.appendChild(optionSinSeleccionar);

    // Crear un array de opciones con texto y documento
    const opciones = pacientes.map((paciente) => ({
        value: paciente.documento,
        text: `${paciente.nombre} - ${paciente.tipoDocumento} ${paciente.documento}`
    }));

    // Ordenar el array de opciones por el texto
    opciones.sort((a, b) => a.text.localeCompare(b.text));

    // Agregar opciones ordenadas al select
    opciones.forEach((opcion) => {
        const option = document.createElement("option");
        option.value = opcion.value;
        option.text = opcion.text;
        selectPaciente.appendChild(option);
    });
};

const getPacientes = async (fechaInicio, fechaFin) => {
    try {
        const response = await fetch(`http://${servidor}:3000/api/pacientes/${fechaInicio}/${fechaFin}/${documentoEmpresaSeleccionada}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los datos de pacientes: ${response.statusText}`);
        }

        const pacientes = await response.json();
        updatePacientesSelect(pacientes);
        Swal.fire("Pacientes Cargados correctamente");

    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message} - ${response}`);
    }
};

const updateEvaluacionesTablet = (evaluaciones) => {
    const tablaFilas = document.querySelector('#tablaFilas');
    tablaFilas.innerHTML = ""; // Limpiar filas antiguas

    evaluaciones.forEach((evaluacion) => {
        const fila = document.createElement("tr");

        // Columna de CheckBox
        const columnaCheckBox = document.createElement("td");
        const checkBox = document.createElement("input");
        checkBox.type = "checkbox";
        checkBox.classList.add('checkboxColumn')
        columnaCheckBox.appendChild(checkBox);
        fila.appendChild(columnaCheckBox);

        // const columnaRadioButton = document.createElement("td");
        // const radioButton = document.createElement("input");
        // radioButton.type = "radio";
        // radioButton.id = "radioButtonColumn"; // Asigna el id en lugar de la clase
        // radioButton.name = "radioButtonColumn"; // Asigna el id en lugar de la clase
        // columnaRadioButton.appendChild(radioButton);
        // fila.appendChild(columnaRadioButton);


        // Columna deL ID de la HC
        const columnaIdHC = document.createElement("td");
        columnaIdHC.textContent = evaluacion.idEvaluacion; // Cambiar por el campo adecuado
        fila.appendChild(columnaIdHC);

        tablaFilas.appendChild(fila);

        // Columna del nombre del usuario que realizo la HC
        const coumnaHCUsuario = document.createElement("td");
        coumnaHCUsuario.textContent = evaluacion.nombreUsuario; // Cambiar por el campo adecuado
        fila.appendChild(coumnaHCUsuario);

        tablaFilas.appendChild(fila);


        // Columna de la fecha de la HC
        const columnaHC = document.createElement("td");
        const fechaFormateada = 'Fecha: ' + new Date(evaluacion.fechaEvaluacion).toISOString().replace(/T/, ' ').replace(/\..+/, '');
        columnaHC.textContent = fechaFormateada; // Cambiar por el campo adecuado
        fila.appendChild(columnaHC);

        tablaFilas.appendChild(fila);
    });
};

const getEvaluaciones = async (documento, fechaInicio, fechaFin) => {
    try {
        const response = await fetch(`http://${servidor}:3000/api/evaluaciones/${documento}/${fechaInicio}/${fechaFin}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los datos de evaluaciones: ${response.statusText}`);
        }

        const evaluaciones = await response.json();

        updateEvaluacionesTablet(evaluaciones); // Llama a la función para actualizar la tabla

    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

const updateFacturasTable = (facturas) => {
    const tablaFilas = document.querySelector('#tablaFilasFacturas');
    tablaFilas.innerHTML = ""; // Limpiar filas antiguas

    facturas.forEach((factura) => {
        const fila = document.createElement("tr");

        // Columna de CheckBox
        const columnaCheckBox = document.createElement("td");
        const checkBox = document.createElement("input");
        checkBox.type = "checkbox";
        checkBox.classList.add('checkboxColumn');
        columnaCheckBox.appendChild(checkBox);
        fila.appendChild(columnaCheckBox);

        // Columna del ID de la Factura
        const columnaIdFactura = document.createElement("td");
        columnaIdFactura.textContent = factura.idFactura; // Cambiar por el campo adecuado
        fila.appendChild(columnaIdFactura);

        tablaFilas.appendChild(fila);

        // Columna del usuario que realizo la Factura
        const columnaUsuarioFactura = document.createElement("td");
        columnaUsuarioFactura.textContent = factura.nombreUsuario; // Cambiar por el campo adecuado
        fila.appendChild(columnaUsuarioFactura);

        tablaFilas.appendChild(fila);

        // Columna de Factura
        const columnaFactura = document.createElement("td");
        const fechaFormateada = new Date(factura.fechaFactura).toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const fechaTexto = `${factura.prefijo} No. ${factura.noFactura} - Valor: ($${factura.totalFactura}) - Fecha: ${fechaFormateada}`;
        columnaFactura.textContent = fechaTexto; // Cambiar por el campo adecuado
        fila.appendChild(columnaFactura);

        tablaFilas.appendChild(fila);

        const columnaVerFactura = document.createElement("td");
        const btnVer = document.createElement("button")
        btnVer.setAttribute("data-bs-toggle", "modal");
        btnVer.setAttribute("data-bs-target", "#exampleModal");
        btnVer.textContent = "Factura"
        btnVer.classList.add("verFactura");
        columnaVerFactura.appendChild(btnVer);
        fila.appendChild(columnaVerFactura)

        tablaFilas.appendChild(fila);
    });
}

const getFacturas = async (documento) => {
    try {
        const response = await fetch(`http://${servidor}:3000/api/facturas/${documento}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los datos de las facturas: ${response.statusText}`);
        }

        const factura = await response.json();
        // Lógica para actualizar el tercer select (Facturas) con las nuevas evaluaciones
        updateFacturasTable(factura);
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

const selectPaciente = document.querySelector('#listaPaciente');

// // Agrega este evento change
// selectPaciente.addEventListener('change', async () => {

//     if (checkboxParticular.checked) {
//         const documentoSeleccionado = selectPaciente.value;
//         await getEvaluaciones(documentoSeleccionado, fechaInicio, fechaFin);
//         await getFacturas(documentoSeleccionado);
//         document.querySelector('#documentoInput').value = '';
//     }

//     if (checkboxPrepagada.checked) {
//         const idFacturaSeleccionada = selectPaciente.value;
//         await getPacientesEPS(idFacturaSeleccionada);


//     }
// });

$(document).ready(function() {

    $('#listaPaciente').on('change', async function() {
        const documentoSeleccionado = $(this).val(); // Obtener el valor seleccionado
        console.log(documentoSeleccionado);

        // Usar .prop() para acceder a la propiedad checked
        if ($('#checkboxParticular').prop('checked', true)) {
            console.log("ESTA MARCADOOO");
            await getEvaluaciones(documentoSeleccionado, fechaInicio, fechaFin);
            await getFacturas(documentoSeleccionado);
            document.querySelector('#documentoInput').value = '';
        } else {
            console.log("NO ESTA MARCADOOO");
        }

        if ($('#checkboxPrepagada').prop('checked', true)) {
            await getPacientesEPS(documentoSeleccionado);
        }
    });
});


const relacionarDatosFacturaCero = async () => {
    const evaluacionesSeleccionadas = obtenerFilasSeleccionadas('#tablaFilas');

    try {
        const response = await fetch(`http://${servidor}:3000/api/facturaCero/${documentoEmpresaSeleccionada}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                evaluacion: evaluacionesSeleccionadas[0], // Tomar solo la primera evaluación seleccionada (puedes ajustar según tus necesidades)
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error al relacionar datos: ${data.error}`);
        }

        // Lógica adicional después de la inserción (si es necesaria)

        Swal.fire({
            text: "Datos relacionados correctamente",
            icon: "success",
            confirmButtonText: "OK"
        }).then((result) => {

            if (result.isConfirmed) {
                location.reload();
            }
        });
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

const btnRelacionar = document.querySelector('#btnRelacionar');
const checkboxFacturaCero = document.querySelector('#checkboxFacturaCero')

// Modifica la función obtenerFilasSeleccionadas
const obtenerFilasSeleccionadas = (idTabla) => {
    const tabla = document.querySelector(idTabla);
    const filas = tabla.querySelectorAll('tr');

    // Filtrar solo las filas que tienen la casilla de verificación (CheckBox) marcada
    const filasSeleccionadas = Array.from(filas).filter((fila) => {
        const checkBox = fila.querySelector('input[type="checkbox"]');
        return checkBox.checked;
    });

    // Obtener los valores específicos de cada fila seleccionada (puedes ajustar según tus necesidades)
    const valoresSeleccionados = filasSeleccionadas.map((fila) => {
        const id = fila.querySelector('td:nth-child(2)').textContent; // Ajusta según la posición de tu columna de ID
        return id;
    });

    return valoresSeleccionados;
};

// Función para obtener el valor del ID de la fila seleccionada
function obtenerIdSeleccionado(idTabla) {
    const tabla = document.querySelector(idTabla);
    const filaSeleccionada = tabla.querySelector('tr input[type="checkbox"]:checked');

    // Obtener el valor específico de la segunda columna de la fila seleccionada
    const id = filaSeleccionada ? filaSeleccionada.closest('tr').querySelector('td:nth-child(4)').textContent : null; // Ajusta según la posición de tu columna de ID

    return id;
}

// Función para enviar la petición al servidor y hacer la relación de facturas
const relacionarDatos = async () => {

    // Obtener las filas seleccionadas de la tabla de evaluaciones
    const evaluacionesSeleccionadas = obtenerFilasSeleccionadas('#tablaFilas');
    // Obtener las filas seleccionadas de la tabla de facturas
    const facturasSeleccionadas = obtenerFilasSeleccionadas('#tablaFilasFacturas');

    // Realizar la solicitud al servidor para relacionar evaluaciones y facturas
    try {
        const response = await fetch(`http://${servidor}:3000/api/relacionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                evaluacion: evaluacionesSeleccionadas[0], // Tomar solo la primera evaluación seleccionada (puedes ajustar según tus necesidades)
                factura: facturasSeleccionadas[0], // Tomar solo la primera factura seleccionada (puedes ajustar según tus necesidades)
            }),
        });

        if (!response.ok) {
            throw new Error(`Error al relacionar datos: ${response.statusText}`);
        }

        Swal.fire({
            text: "Datos relacionados correctamente",
            icon: "success",
            confirmButtonText: "OK"
        }).then((result) => {
            if (result.isConfirmed) {
                location.reload();
            }
        });
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
}

const relacionarFacturaManual = async () => {

    // Obtener las filas seleccionadas de la tabla de evaluaciones
    const evaluacionesSeleccionadas = obtenerFilasSeleccionadas('#tablaFilas');
    // Obtener las filas seleccionadas de la tabla de facturas
    const facturasSeleccionadas = document.getElementById('selectBuscarFacturas').value

    // Realizar la solicitud al servidor para relacionar evaluaciones y facturas
    try {
        const response = await fetch(`http://${servidor}:3000/api/relacionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                evaluacion: evaluacionesSeleccionadas[0], // Tomar solo la primera evaluación seleccionada (puedes ajustar según tus necesidades)
                factura: facturasSeleccionadas,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error al relacionar datos: ${response.statusText}`);
        }

        Swal.fire({
            text: "Datos relacionados correctamente",
            icon: "success",
            confirmButtonText: "OK"
        }).then((result) => {
            if (result.isConfirmed) {
                location.reload();
            }
        });
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
}

// BUTTON RELACIONAR TABLAS =>
btnRelacionar.addEventListener('click', async () => {
    // Obtener las filas seleccionadas de la tabla de evaluaciones
    const evaluacionesSeleccionadas = obtenerFilasSeleccionadas('#tablaFilas');
    // Obtener las filas seleccionadas de la tabla de facturas
    const facturasSeleccionadas = obtenerFilasSeleccionadas('#tablaFilasFacturas');

    if (checkboxFacturaCero.checked) {

        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success",
                cancelButton: "btn btn-danger",
                // Agrega una clase personalizada para cambiar el color del texto en HTML
                htmlContainer: "html-container-custom"
            },
            buttonsStyling: false
        });

        // Construir el mensaje con los textos seleccionados y aplicar estilos
        const evaluacionSeleccionadaText = obtenerIdSeleccionado('#tablaFilas')
        const mensaje = `<span style="color: #fff;">La Historia con (${evaluacionSeleccionadaText}) con una Factura en 0?</span>`;

        const result = await swalWithBootstrapButtons.fire({
            title: "¿Está seguro de querer relacionar?",
            // Usar el formato HTML para aplicar estilos
            html: mensaje,
            icon: "warning",
            showCancelButton: true,
            cancelButtonText: "No relacionar",
            confirmButtonText: "Sí, realizar la relación de RIPS",
            reverseButtons: true
        });

        if (result.isConfirmed) {
            // Llamar a la función para realizar la inserción en la tabla
            await relacionarDatosFacturaCero();

        } else if (result.dismiss === Swal.DismissReason.cancel) {
            swalWithBootstrapButtons.fire({
                title: "Cancelado",
                text: "La relación de RIPS ha sido cancelada.",
                icon: "error"
            });
        }
    }

    else {

        if (checkboxPrepagada.checked) {
            const idFactura = document.getElementById('listaPaciente').value
            const idEveRips2 = document.getElementById('listaHistoriaClinica')
            const idEveRips = document.getElementById('listaHistoriaClinica').value
            const textoSeleccionadoHistoriaClinica = idEveRips2.selectedOptions[0].textContent;


            const swalWithBootstrapButtons = Swal.mixin({
                customClass: {
                    confirmButton: "btn btn-success",
                    cancelButton: "btn btn-danger",
                    // Agrega una clase personalizada para cambiar el color del texto en HTML
                    htmlContainer: "html-container-custom"
                },
                buttonsStyling: false
            });

            // Construir el mensaje con los textos seleccionados y aplicar estilos
            const mensaje = `<span style="color: #fff;">La Factura (${idFactura}) con la historia del (${textoSeleccionadoHistoriaClinica})?</span>`;

            const result = await swalWithBootstrapButtons.fire({
                title: "¿Está seguro de querer relacionar?",
                // Usar el formato HTML para aplicar estilos
                html: mensaje,
                icon: "warning",
                showCancelButton: true,
                cancelButtonText: "No relacionar",
                confirmButtonText: "Sí, realizar la relación de RIPS",
                reverseButtons: true
            });

            if (result.isConfirmed) {

                await relacionarRIPSEPS(idFactura, idEveRips)

            } else if (result.dismiss === Swal.DismissReason.cancel) {
                swalWithBootstrapButtons.fire({
                    title: "Cancelado",
                    text: "La relación de RIPS ha sido cancelada.",
                    icon: "error"
                });
            }
        } else {

            // Verificar si al menos una evaluación y una factura están seleccionadas
            if (evaluacionesSeleccionadas.length === 0 || facturasSeleccionadas.length === 0) {
                alert('Por favor, selecciona al menos una evaluación y una factura para relacionar.');
                return;
            } else {
                const idHC = obtenerIdSeleccionado('#tablaFilas'); // Reemplaza '#tablaFilas' con el selector adecuado
                const idFactura = obtenerIdSeleccionado('#tablaFilasFacturas'); // Reemplaza '#tablaFilasFacturas' con el selector adecuado

                const swalWithBootstrapButtons = Swal.mixin({
                    customClass: {
                        confirmButton: "btn btn-success",
                        cancelButton: "btn btn-danger",
                        // Agrega una clase personalizada para cambiar el color del texto en HTML
                        htmlContainer: "html-container-custom"
                    },
                    buttonsStyling: false
                });

                // Construir el mensaje con los textos seleccionados y aplicar estilos
                const mensaje = `<span style="color: #fff;">La Factura (${idFactura}) con la historia del (${idHC})?</span>`;

                const result = await swalWithBootstrapButtons.fire({
                    title: "¿Está seguro de querer relacionar?",
                    // Usar el formato HTML para aplicar estilos
                    html: mensaje,
                    icon: "warning",
                    showCancelButton: true,
                    cancelButtonText: "No relacionar",
                    confirmButtonText: "Sí, realizar la relación de RIPS",
                    reverseButtons: true
                });

                if (result.isConfirmed) {

                    await relacionarDatos();

                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    swalWithBootstrapButtons.fire({
                        title: "Cancelado",
                        text: "La relación de RIPS ha sido cancelada.",
                        icon: "error"
                    });
                }
            }
        }

    }

})

//Yeison dejo eso asi y eso no esta definido en ningun lado
// por ende mr comentarios es decir Fernando
// procede a comentar esto que no sive para nada y tira error 
//pasito

// checkboxFacturaCero.addEventListener('change', () => {
//     if (checkboxFacturaCero.checked) {
//         selectFacturas.disabled = true;

//     } else {
//         selectFacturas.disabled = false;

//     }
// })

const selectBuscarFacturas = document.querySelector('#selectBuscarFacturas');

const updateBuscarFacturasSelect = (facturas) => {
    const selectBuscarFacturas = document.querySelector('#selectBuscarFacturas');
    selectBuscarFacturas.innerHTML = ""; // Limpiar opciones antiguas


    // Agregar opciones al select
    facturas.forEach((factura) => {
        const fechaFormateada = 'Fecha: ' + new Date(factura.fechaFactura).toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const option = document.createElement("option");
        option.value = factura.idFactura; // Ajustar según tu estructura de datos
        option.text = `${factura.noFactura} - ${fechaFormateada} - ($${factura.totalFactura})`;

        selectBuscarFacturas.appendChild(option);
        document.getElementById('tituloPaciente').textContent = `Facturas de ${factura.nombrePaciente}`

    });
};

const getBuscarFacturas = async (documento) => {
    try {
        const response = await fetch(`http://${servidor}:3000/api/buscarFacturas/${documento}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los datos de las facturas: ${response.statusText}`);
        }


        const factura = await response.json();
        updateBuscarFacturasSelect(factura);
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

const btnBuscar = document.querySelector('#btnBuscar');

btnBuscar.addEventListener('click', async () => {
    const pacienteSeleccionado = selectPaciente.value;
    // Validar que se hayan seleccionado todos los valores necesarios
    if (pacienteSeleccionado !== "Sin Seleccionar") {
        // Llamar a la función para realizar la inserción en la tabla
        await getBuscarFacturas(pacienteSeleccionado);
    } else {
        // Mostrar un mensaje si falta alguna selección
        Swal.fire("Por favor, seleccione un paciente");
    }
});

let fechaInicio;
let fechaFin;

const alerta = async () => {
    // Obtener las fechas almacenadas en localStorage
    const storedFechaInicio = localStorage.getItem("fechaInicio");
    const storedFechaFin = localStorage.getItem("fechaFin");

    const { value: formValues } = await Swal.fire({
        title: "Seleccione el rango de fecha para cargar los pacientes",
        html: `
            <label style="color: white;">FECHA INICIO</label>
            <input type="date" id="swal-input1" class="swal2-input" value="${storedFechaInicio || ''}">

            <label style="color: white;">FECHA FIN</label>
            <input type="date" id="swal-input2" class="swal2-input" value="${storedFechaFin || ''}">
        `,
        focusConfirm: false,
        preConfirm: async () => {
            fechaInicio = document.getElementById("swal-input1").value;
            fechaFin = document.getElementById("swal-input2").value;

            // Validar que se hayan seleccionado ambas fechas
            if (fechaInicio && fechaFin) {
                // Almacenar las fechas en localStorage
                localStorage.setItem("fechaInicio", fechaInicio);
                localStorage.setItem("fechaFin", fechaFin);

                if (checkboxParticular.checked) {

                    await MensajeDeCarga('Cargando Pacientes')
                    // Llamar a la función getPacientes con el rango de fechas seleccionado
                    getPacientes(fechaInicio, fechaFin);

                }

                if (checkboxPrepagada.checked) {
                    getEPS(fechaInicio, fechaFin);
                }


            } else {
                // Mostrar un mensaje si falta alguna de las fechas
                Swal.showValidationMessage("Por favor, seleccione ambas fechas");
            }
        }
    });

    // if (formValues) {
    //     Swal.fire("Pacientes Cargados correctamente");
    // }
};

document.getElementById("documentoInput").addEventListener("input", buscarPacientePorDocumento);

function buscarPacientePorDocumento() {
    var inputDocumento = document.getElementById("documentoInput").value;
    var selectPacientes = document.getElementById("listaPaciente");

    // Iterar sobre las opciones del select y seleccionar la que coincide con el documento ingresado
    for (var i = 0; i < selectPacientes.options.length; i++) {
        var documentoPaciente = selectPacientes.options[i].value;

        if (documentoPaciente === inputDocumento) {
            selectPacientes.selectedIndex = i; // Seleccionar la opción si coincide
            return; // Salir de la función, ya que se encontró una coincidencia
        }
    }

    // Si no se encuentra una coincidencia, seleccionar la primera opción
    selectPacientes.selectedIndex = 0;
}

// Función para verificar si el usuario está autenticado
const checkAuthentication = async () => {
    try {
        const response = await fetch(`http://${servidor}:3000/protected`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token'), // Incluimos el token en la solicitud
            },
        });

        if (response.ok) {
            const { user } = await response.json();
            console.log('Usuario autenticado:', user);
            document.querySelector('#nombreUsuarioLink').textContent = `Hola, ${user.username}`
        } else {
            console.error('Error al obtener información del usuario:', response.statusText);
        }
    } catch (error) {
        console.error('Error al obtener información del usuario:', error.message);
    }
};

// Función para verificar si hay un token almacenado
const isTokenAvailable = () => {
    const token = localStorage.getItem('token');
    return token !== null && token !== undefined;
};

// Llamar a la función para verificar si hay un token disponible
if (isTokenAvailable()) {
    // Hay un token disponible, el usuario está autenticado
    console.log('El usuario está autenticado.');
} else {
    // No hay un token disponible, el usuario no está autenticado
    console.log('El usuario no está autenticado.');
}

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', isTokenAvailable);

// Función para cerrar sesión y eliminar el token
const logout = () => {
    // Eliminar el token del localStorage
    localStorage.removeItem('token');

    // Se elimina la empresa almacenada en SessionStorage
    sessionStorage.removeItem('empresaTrabajarExecuted');

    // Se elimina el nombre de la empresa almacenado en localStorage
    sessionStorage.removeItem('empresaTrabajarNombre');

    // Redirigir al usuario a la página de inicio de sesión u otra página deseada
    window.location.href = 'index.html'; // Cambia esto a la página de inicio de sesión o la página que prefieras
};

// Asociar la función a un botón de cierre de sesión (puedes cambiar el selector según tu HTML)
document.getElementById('closeSesion').addEventListener('click', logout);

/** FUNCIÓN PARA LA DESCARGA DE LOS ARCHIVOS JSON */
async function DescargarArchivosJSON() {
    console.log('funcionando');

    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinInput = document.getElementById('fechaFin');

    const fechaInicioValue = fechaInicioInput.value;
    const fechaFinValue = fechaFinInput.value;

    if (!fechaInicioValue || !fechaFinValue) {
        console.error('Fechas inválidas.');
        return;
    }

    localStorage.setItem("fechaInicio", fechaInicioValue);
    localStorage.setItem("fechaFin", fechaFinValue);

    let SelectResolucionesRips = document.getElementById('ResolucionesRips').value

    let CampoResolucion = document.getElementById('ResolucionesRips');
    let CampoResolucionTexto = CampoResolucion.options[CampoResolucion.selectedIndex].text;
    let TextoPrefijo = CampoResolucionTexto.match(/^[A-Za-z]+/)[0];

    const CamposFaltantes = [];
    if (!fechaInicioValue) CamposFaltantes.push('Fecha Inicio.');
    if (!fechaFinValue) CamposFaltantes.push('Fecha Fin.');
    if (SelectResolucionesRips === null || SelectResolucionesRips === "") CamposFaltantes.push('Resolución RIPS.');

    if (CamposFaltantes.length > 0) {
        Swal.fire({
            icon: 'info',
            html: `
                <h5 style="color: #ffffff"><b> Los siguientes campos son necesarios: </b></h5>
                <br>
                <ul style="color: #FFFFFF; text-align: left;">
                    ${CamposFaltantes.map((campo) => `<li style="color: #FFFFFF;">${campo}</li>`).join("")}
                </ul>
            `
        })
        return;
    }

    try {
        MensajeDeCarga("Descargando JSON...");
        await Esperar(1000);
        // const response = await fetch(`http://${servidor}:3000/RIPS/usuarios/ripsEPS/${fechaInicioValue}/${fechaFinValue}/${SelectResolucionesRips}/${documentoEmpresaSeleccionada}`);
        const response = await fetch(`http://${servidor}:3000/RIPS/usuarios/rips/${fechaInicioValue}/${fechaFinValue}/${SelectResolucionesRips}/${documentoEmpresaSeleccionada}`);
        
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();

        console.log('Enviando datos al servidor para generar archivo ZIP...');

        const zipResponse = await fetch(`http://${servidor}:3000/RIPS/generar-zip/${fechaInicioValue}/${fechaFinValue}/${TextoPrefijo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!zipResponse.ok) {
            throw new Error(`Error en la generación del ZIP: ${zipResponse.status} - ${zipResponse.statusText}`);
        }

        const zipData = await zipResponse.json();
        console.log('Archivo ZIP generado y almacenado en el servidor:', zipData);

        Swal.fire({
            icon: 'success',
            text: 'El archivo RIPS JSON se descargó correctamente'
        })

    } catch (error) {

        Swal.fire({
            icon: 'error',
            text: 'Hubo un error al generar el archivo ZIP o al obtener los datos.'
        })
        console.error('Error al obtener datos o generar ZIP:', error);
    }
}

document.getElementById('obtenerDatosBtn').addEventListener('click', async () => {
    // MensajeDeCarga("Descargando JSON...");
    // await Esperar(1000);
    DescargarArchivosJSON();

})
/* FIN FIN FIN */

document.getElementById('descargarRIPS').addEventListener('click', async () => {


    // try {
    //     const response = await fetch(`http://${servidor}:3000/XMLS/mostrar-empresas-con-resoluciones-vigentes`);
    //     if (!response.ok) {
    //         throw new Error('Network response was not ok');
    //     }
    //     const empresas = await response.json();
    //     console.log('Empresas recibidas:', empresas);

    //     // Se captura el select de las empresas
    //     const EmpresasRegistradasConFacturacionVigente = document.getElementById('EmpresasRips');
    //     EmpresasRegistradasConFacturacionVigente.innerHTML = ''; // Limpia el elmento

    //     // Agrega una opción por defecto
    //     const defaultOption = document.createElement('option');
    //     defaultOption.textContent = 'Seleccione una empresa';
    //     defaultOption.value = '';
    //     EmpresasRegistradasConFacturacionVigente.appendChild(defaultOption);

    //     // Agrega una opción para cada empresa
    //     empresas.forEach(empresa => {
    //         const option = document.createElement('option');
    //         option.textContent = empresa.NombreComercialEmpresa; // Cambia este campo si es necesario
    //         option.value = empresa.DocumentoEmpresa; // Cambia este campo si es necesario
    //         EmpresasRegistradasConFacturacionVigente.appendChild(option);
    //     });
    // } catch (error) {
    //     console.error('Hubo un problema con la solicitud:', error);
    // }

    // })

    // Para mostrar las resoluciones viegentes según la empresa seleccionada
    // document.getElementById('EmpresasRips').addEventListener('change', async () => {

    // const SelectEmpresas = document.getElementById('EmpresasRips');
    // let EmpresaSeleccionada = SelectEmpresas.value;

    // // Verifica si se ha seleccionado una empresa válida
    // if (!EmpresaSeleccionada) {
    //     // Si no hay selección, limpia el select de resoluciones y muestra un mensaje
    //     const ResolucionesVigentes = document.getElementById('ResolucionesRips');
    //     ResolucionesVigentes.innerHTML = ''; // Limpia el elemento

    //     // Agrega una opción por defecto
    //     const defaultOption = document.createElement('option');
    //     defaultOption.textContent = 'Seleccione una resolución';
    //     defaultOption.value = '';
    //     ResolucionesVigentes.appendChild(defaultOption);

    //     console.log('No se ha seleccionado ninguna empresa.');
    //     return; // Sale de la función si no hay selección
    // }

    // console.log(EmpresaSeleccionada);
    try {
        // const response = await fetch(`http://${servidor}:3000/XMLS/mostrar-resoluciones-vigentes-segun-empresa-seleccionada/${EmpresaSeleccionada}`);
        const response = await fetch(`http://${servidor}:3000/XMLS/mostrar-resoluciones-vigentes-segun-empresa-seleccionada/${documentoEmpresaSeleccionada}`);
        console.log(documentoEmpresaSeleccionada);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const Resoluciones = await response.json();
        console.log('Resoluciones recibidas:', Resoluciones);

        // Se captura el select de las resoluciones
        const ResolucionesVigentes = document.getElementById('ResolucionesRips');
        ResolucionesVigentes.innerHTML = ''; // Limpia el elemento

        // Se agrega una opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Seleccione una resolución';
        defaultOption.value = '';
        ResolucionesVigentes.appendChild(defaultOption);

        // Se agregan las resoluciones
        Resoluciones.forEach(resolucion => {
            const option = document.createElement('option');
            option.textContent = resolucion.ResolucionVigente;
            option.value = resolucion.Resolucion;
            ResolucionesVigentes.appendChild(option);
        });
    } catch (Error) {
        console.error(Error);
        Swal.fire({
            icon: 'error',
            text: 'Hubo un problema al mostrar las resoluciones vigentes. Error => ' + Error
        });
    }
});

/* FUNCIONES PARA LA GENERACIÓN/DESCARGA DE LOS ARCHIVOS XMLS */

// Para mostrar las empresas con las resoluciones vigentes
document.getElementById('XMLS').addEventListener('click', async () => {

    //     try {
    //         const response = await fetch(`http://${servidor}:3000/XMLS/mostrar-empresas-con-resoluciones-vigentes`);
    //         if (!response.ok) {
    //             throw new Error('Network response was not ok');
    //         }
    //         const empresas = await response.json();
    //         console.log('Empresas recibidas:', empresas);

    //         // Se captura el select de las empresas
    //         const EmpresasRegistradasConFacturacionVigente = document.getElementById('Empresas');
    //         EmpresasRegistradasConFacturacionVigente.innerHTML = ''; // Limpia el elmento

    //         // Agrega una opción por defecto
    //         const defaultOption = document.createElement('option');
    //         defaultOption.textContent = 'Seleccione una empresa';
    //         defaultOption.value = '';
    //         EmpresasRegistradasConFacturacionVigente.appendChild(defaultOption);

    //         // Agrega una opción para cada empresa
    //         empresas.forEach(empresa => {
    //             const option = document.createElement('option');
    //             option.textContent = empresa.NombreComercialEmpresa; // Cambia este campo si es necesario
    //             option.value = empresa.DocumentoEmpresa; // Cambia este campo si es necesario
    //             EmpresasRegistradasConFacturacionVigente.appendChild(option);
    //         });
    //     } catch (error) {
    //         console.error('Hubo un problema con la solicitud:', error);
    //     }

    // })


    // // Para mostrar las resoluciones viegentes según la empresa seleccionada
    // document.getElementById('Empresas').addEventListener('change', async () => {

    //     const SelectEmpresas = document.getElementById('Empresas');
    //     let EmpresaSeleccionada = SelectEmpresas.value;


    //     // Verifica si se ha seleccionado una empresa válida
    //     if (!EmpresaSeleccionada) {
    //         // Si no hay selección, limpia el select de resoluciones y muestra un mensaje
    //         const ResolucionesVigentes = document.getElementById('Resoluciones');
    //         ResolucionesVigentes.innerHTML = ''; // Limpia el elemento

    //         // Agrega una opción por defecto
    //         const defaultOption = document.createElement('option');
    //         defaultOption.textContent = 'Seleccione una resolución';
    //         defaultOption.value = '';
    //         ResolucionesVigentes.appendChild(defaultOption);

    //         console.log('No se ha seleccionado ninguna empresa.');
    //         return; // Sale de la función si no hay selección
    //     }

    //     console.log(EmpresaSeleccionada);
    try {
        const response = await fetch(`http://${servidor}:3000/XMLS/mostrar-resoluciones-vigentes-segun-empresa-seleccionada/${documentoEmpresaSeleccionada}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const Resoluciones = await response.json();
        console.log('Resoluciones recibidas:', Resoluciones);

        // Se captura el select de las resoluciones
        const ResolucionesVigentes = document.getElementById('Resoluciones');
        ResolucionesVigentes.innerHTML = ''; // Limpia el elemento

        // Se agrega una opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Seleccione una resolución';
        defaultOption.value = '';
        ResolucionesVigentes.appendChild(defaultOption);

        // Se agregan las resoluciones
        Resoluciones.forEach(resolucion => {
            const option = document.createElement('option');
            option.textContent = resolucion.ResolucionVigente;
            option.value = resolucion.PrefijoResolucionVigente;
            ResolucionesVigentes.appendChild(option);
        });
    } catch (Error) {
        console.error(Error);
        Swal.fire({
            icon: 'error',
            text: 'Hubo un problema al mostrar las resoluciones vigentes. Error => ' + Error
        });
    }
});


// Agregar el evento para restablecer el select de resoluciones al cerrar el modal
document.getElementById('ModalEmpresasResolucionVigente').addEventListener('hidden.bs.modal', () => {
    const ResolucionesVigentes = document.getElementById('Resoluciones');
    ResolucionesVigentes.innerHTML = ''; // Limpia el elemento

    // Se agrega una opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Seleccione una resolución';
    defaultOption.value = '';
    ResolucionesVigentes.appendChild(defaultOption);
});

/* FUNCIONALIDAD PARA DESCARGAR LOS RIPS CON MENSAJE DE CARGA */
async function Esperar(TiempoDeEspera) {
    return new Promise(resolve => setTimeout(resolve, TiempoDeEspera));
}

async function MensajeDeCarga(MensajeAlCargar) {
    Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        showConfirmButton: true,
        html:
            `
            <style>
            @media (max-width: 480px) {
                .swal2-container {
                    width: 100%;
                }
                .swal2-content {
                    overflow-x: hidden;
                }
            }
            :root {
                /*--main-color: #ecf0f1;*/
                /*
                   Para Sweetalert Claro                 
                    --main-color: #ffffff;
                    --point-color: #555;
                */

                /* Para Sweetalert Oscuro */
                --point-color: #ffffff;
                --size: 5px;
              }
              
              .loader {
                background-color: var(--main-color);
                overflow: hidden;
                /*width: 100%;*/
                /*height: 100%;*/
                width: 100%;
                height: 100%;
                /*position: fixed;*/
                position: relative;
                top: 0; left: 0;
                display: flex;
                align-items: center;
                align-content: center; 
                justify-content: center;  
                z-index: 100000;
              }
              
              .loader__element {
                border-radius: 100%;
                border: var(--size) solid var(--point-color);
                margin: calc(var(--size)*2);
              }
              
              .loader__element:nth-child(1) {
                animation: preloader .6s ease-in-out alternate infinite;
              }
              .loader__element:nth-child(2) {
                animation: preloader .6s ease-in-out alternate .2s infinite;
              }
              
              .loader__element:nth-child(3) {
                animation: preloader .6s ease-in-out alternate .4s infinite;
              }
              
              @keyframes preloader {
                100% { transform: scale(2); }
              }
            </style>

            <body> 
            
                <div style="margin: 0 auto;">
                    <!-- <h5 style="color: #000000">${MensajeAlCargar}</h5> -->
                    <h5 style="color: #ffffff">${MensajeAlCargar}</h5>

                    <div class="loader">         
                        <span class="loader__element"></span>
                        <span class="loader__element"></span>
                        <span class="loader__element"></span>                    
                    </div>
                </div>


            </body>
        `,
        didOpen: () => {
            // Obtener los botones de aceptar y cancelar
            const confirmButton = Swal.getConfirmButton();
            const cancelButton = Swal.getCancelButton();

            // Ocultar los botones después de mostrarlos si no se necesitan
            if (confirmButton) confirmButton.style.display = 'none';
            if (cancelButton) cancelButton.style.display = 'none';
        }
    })
}

async function DescargarXMLSPorLaAPIDeFacturaTech() {
    // Se capturan los campos para las validaciones
    // const Empresa = document.getElementById('Empresas');
    const Resolucion = document.getElementById('Resoluciones');
    const FechaInicial = document.getElementById('FechaInicial');
    const FechaFinal = document.getElementById('FechaFinal');

    const campos = [
        // { valor: Empresa.value, mensaje: 'Debe seleccionar una empresa.' },
        { valor: Resolucion.value, mensaje: 'Resolución.' },
        { valor: FechaInicial.value, mensaje: 'Fecha inicial.' },
        { valor: FechaFinal.value, mensaje: 'Fecha final.' }
    ];

    // Realiza las validaciones
    const errores = [];

    for (let i = 0; i < campos.length; i++) {
        const campo = campos[i];

        if (!campo.valor) {
            errores.push(campo.mensaje);
        } else if (i >= 2 && isNaN(Date.parse(campo.valor))) {
            // Verifica si es una fecha válida solo para los campos de fechas (índices 2 y 3)
            errores.push(campo.mensaje);
        }
    }

    if (FechaInicial.value > FechaFinal.value) {
        errores.push('La fecha inicial no puede ser mayor que la fecha final.');
    }

    // Muestra los mensajes de error si hay errores
    if (errores.length > 0) {
        // Swal.fire({
        //     icon: 'error',
        //     text: errores.join(' ')
        // });

        Swal.fire({
            icon: 'info',
            html: `
                <h5><b>Los siguientes campos son necesarios</b></h5>
                <br>
                <ul style="text-align: left;">
                    ${errores.map((campo) => `<li style="color: #FFFFFF;">${campo}</li>`).join("")}
                </ul>

            `

        })
    }
    else {

        try {
            const response = await fetch(`http://${servidor}:3000/XMLS/descargarxmls-api-facturatech/${Resolucion.value}/${FechaInicial.value}/${FechaFinal.value}/${documentoEmpresaSeleccionada}`, {
                method: 'POST',
                // headers: {
                //     'Content-Type': 'application/json'
                // }
            });
            // if (!response.ok) {
            //     throw new Error('Network response was not ok');
            // }

            const data = await response.json();
            console.log('Respuesta del servidor:', data);

            if (data.error) {
                Swal.fire({
                    icon: 'error',
                    html: `
                        <h3>Hubo un problema al descargar los XMLs</h3>
                        <br />
                        <p>Error: ${data.error}</p>
                    `
                });
                throw new Error(data.error);
            }

            // Verifica si 'data' y 'data.facturas' existen y son válidos
            const Facturas = data && Array.isArray(data.facturas) ? data.facturas : [];
            let MensajeDelEnviadoDelServidor = data && data.message ? data.message : 'No hay mensaje del servidor';

            console.log('Mensaje enviado del servidor:', MensajeDelEnviadoDelServidor);
            console.log('Facturas recibidas:', Facturas);

            if (Facturas.length > 0) {
                // Si hay facturas, se ordenan y se muestra la tabla
                // Facturas.sort((b, a) => a.NoFactura.localeCompare(b.NoFactura));
                // console.log('Facturas ordenadas:', Facturas);

                const itemsPerPage = 8;
                let currentPage = 1;

                function renderTable(page) {
                    const start = (page - 1) * itemsPerPage;
                    const end = page * itemsPerPage;
                    const paginatedFacturas = Facturas.slice(start, end);

                    let tableHTML = `
                        <table border="1" width="100%" cellpadding="5" cellspacing="0" style="margin: 0 auto;">
                            <thead>
                                <tr>
                                    <th style="color: #000000;" id="ColumnaNumeroFactura">No. Factura &#9660;</th>
                                    <th style="color: #000000;">Fecha Factura</th> 
                                    <th style="color: #000000;">Prefijo</th>
                                    <th style="color: #000000;">Ruta del XML</th>
                                    <th style="color: #000000; cursor: pointer;" id="ColumnaEstadoXML">Estado XML &#9660;</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    paginatedFacturas.forEach(factura => {
                        tableHTML += `
                            <tr style="color: gray;">
                                <td>${factura.NoFactura}</td>
                                <td>${factura.FechaFactura}</td>
                                <td>${factura.Prefijo}</td>
                                <td>${factura.filePath || "No disponible"}</td>
                                <td>${factura.estado}</td>
                            </tr>
                        `;
                    });

                    tableHTML += `
                            </tbody>
                        </table>
                    `;

                    renderPagination(tableHTML);
                    return tableHTML;
                }

                function renderPagination() {
                    const totalPages = Math.ceil(Facturas.length / itemsPerPage);
                    let paginationHTML = '';

                    if (currentPage > 1) {
                        paginationHTML += `<button onclick="goToPage(${currentPage - 1})" class="btn btn-success fw-normal" style="width: 96px;">Anterior</button>`;
                    }

                    for (let i = 1; i <= totalPages; i++) {
                        const isActive = currentPage === i ? 'btn-primary' : 'btn-light';
                        const isActiveFontWeight = currentPage === i ? 'fw-bold' : 'fw-normal';

                        paginationHTML += `<button onclick="goToPage(${i})" class="btn ${isActive} text-center ${isActiveFontWeight} rounded-circle" style="width: 40px; height: 40px; font-size: 10.8px;">${i}</button>`;
                    }

                    if (currentPage < totalPages) {
                        paginationHTML += `<button onclick="goToPage(${currentPage + 1})" class="btn btn-success fw-normal" style="width: 96px;">Siguiente</button>`;
                    }

                    return paginationHTML;
                }

                function goToPage(page) {
                    currentPage = page;
                    showSwal();
                }

                // Aseguramos que las funciones sean globales
                window.goToPage = goToPage;
                window.Ordenar = Ordenar;

                let ordenNumeroFacturaAscendente = false;
                let ordenEstadoXMLAscendente = true;

                // Ordena inicialmente por estado XML ascendente al mostrar la tabla
                Ordenar('OrdenarPorNumeroFactura');

                function showSwal() {
                    const tableHTML = renderTable(currentPage);
                    const paginationHTML = renderPagination();


                    if (Swal.isVisible()) {
                        // Modificar el ancho del modal directamente
                        const swalContainer = Swal.getPopup(); // Obtiene el contenedor principal del modal
                        swalContainer.style.width = '94%'; // Ajusta el ancho al 94%

                        const container = Swal.getHtmlContainer();
                        container.innerHTML = `<h3 class="fw-bold">${data.message}</h3>` + tableHTML + '<div id="paginacion-container" style="text-align: center; margin-top: 10px;">' + paginationHTML + '</div>';

                        // Asegura que el botón de cerrar esté visible
                        const closeButton = Swal.getCloseButton();
                        if (closeButton) {
                            closeButton.style.display = 'block';
                        }

                        // Obtener el botón de aceptar
                        const confirmButton = Swal.getConfirmButton();
                        if (confirmButton) {
                            confirmButton.style.display = 'block';
                            confirmButton.textContent = 'Aceptar';
                        }

                        actualizarEncabezados();
                    }

                    // Asigna los eventos a las cabeceras después de renderizar la tabla
                    const ColumnaEstadoXML = document.getElementById('ColumnaEstadoXML');
                    ColumnaEstadoXML.addEventListener('click', () => {
                        Ordenar('OrdenarPorEstadoXML');
                        console.log("Se ordenó por el estado del XML Header");
                    });

                    const ColumnaNumeroFactura = document.getElementById('ColumnaNumeroFactura');
                    ColumnaNumeroFactura.addEventListener('click', () => {
                        Ordenar('OrdenarPorNumeroFactura');
                        console.log("Se ordenó por el número de factura Header");
                    });
                }

                function actualizarEncabezados() {
                    const TextoColumnaNumeroFactura = document.getElementById('ColumnaNumeroFactura');
                    const TextoColumnaEstadoXML = document.getElementById('ColumnaEstadoXML');

                    if (TextoColumnaNumeroFactura) {
                        TextoColumnaNumeroFactura.innerHTML = ordenNumeroFacturaAscendente
                            ? 'No. Factura &#9660;'
                            : 'No. Factura &#9650;';
                    }

                    if (TextoColumnaEstadoXML) {
                        TextoColumnaEstadoXML.innerHTML = ordenEstadoXMLAscendente
                            ? 'Estado XML &#9660;'
                            : 'Estado XML &#9650;';
                    }
                }



                function Ordenar(Columna) {
                    switch (Columna) {
                        case "OrdenarPorNumeroFactura":
                            // Alterna el orden de la columna de número de factura
                            Facturas.sort((a, b) => ordenNumeroFacturaAscendente
                                ? a.NoFactura.localeCompare(b.NoFactura)
                                : b.NoFactura.localeCompare(a.NoFactura));
                            ordenNumeroFacturaAscendente = !ordenNumeroFacturaAscendente;
                            break;

                        case "OrdenarPorEstadoXML":
                            // Alterna el orden de la columna de estado XML
                            Facturas.sort((a, b) => ordenEstadoXMLAscendente
                                ? a.estado.localeCompare(b.estado)
                                : b.estado.localeCompare(a.estado));
                            ordenEstadoXMLAscendente = !ordenEstadoXMLAscendente;
                            break;
                    }
                    // Renderiza la tabla con la página actual
                    showSwal();
                }

                // Inicializa la tabla con la primera página
                showSwal();
            } else {
                // Si no hay facturas, muestra solo el mensaje del servidor
                Swal.fire({
                    text: data.message,
                    icon: 'info',
                    // html: `
                    //     <p>No se recibieron facturas para mostrar.</p>
                    // `,
                    // width: '60%',
                    showCloseButton: true,
                    confirmButtonText: 'Aceptar'
                });
            }

        } catch (Error) {
            console.error('Error al descargar los XMLs:', Error.message);
            Swal.fire({
                icon: 'error',
                text: 'Hubo un problema al descargar los XMLs. Error =>' + Error.message
            });
        }
    }
}

document.getElementById('DescargarXMLS').addEventListener('click', async () => {
    MensajeDeCarga("Descargando XMLS...");
    DescargarXMLSPorLaAPIDeFacturaTech();
})
/* FIN FIN FIN FIN FIN FIN FIN */

document.getElementById('tablaFilasFacturas').addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName === 'BUTTON' && target.textContent === 'Factura') {
        const fila = target.closest('tr');
        const idFactura = fila.querySelector('td:nth-child(2)').textContent; // Ajusta según la posición de la columna del ID de factura

        // Hacer la solicitud al nuevo endpoint
        fetch(`http://${servidor}:3000/api/usuarios/factura/${idFactura}`)
            .then(response => response.json())
            .then(data => {
                // Llenar el modal con los datos obtenidos
                llenarModal(data);
                // Mostrar el modal
                $('#exampleModal').modal('show');
            })
            .catch(error => console.error('Error al obtener datos de factura:', error));
    }
});

function llenarModal(data) {
    // Obtener elementos del modal
    const modalTitle = document.getElementById('exampleModalLabel');
    const nombreEmpresa = document.getElementById('nombreEmpresa');
    const documentoEmpresa = document.getElementById('documentoEmpresa');
    const noFactura = document.getElementById('noFactura');
    const fechaFactura = document.getElementById('fechaFactura');
    const fechaVencimientoFactura = document.getElementById('fechaVencimientoFactura');
    const nombrePaciente = document.getElementById('nombrePaciente');
    const documentoPaciente = document.getElementById('documentoPaciente');
    const nombreResponsable = document.getElementById('nombreResponsable');
    const descripcionFactura = document.getElementById('descripcionFactura');
    const documentoResponsable = document.getElementById('documentoResponsable');
    const cantidad = document.getElementById('cantidad');
    const valorIva = document.getElementById('valorIva');
    const valorTotal = document.getElementById('valorTotal');
    const observacionesFactura = document.getElementById('observacionesFactura');

    // Llenar campos del modal con los datos obtenidos
    modalTitle.textContent = 'Detalles de Factura';
    nombreEmpresa.textContent = `${data.nombreEmpresa}`;
    documentoEmpresa.textContent = `${data.documentoEmpresa}`;
    noFactura.textContent = `${data.noFactura}`;
    fechaFactura.textContent = `${data.fechaFactura}`;
    fechaVencimientoFactura.textContent = `${data.fechaVencimientoFactura}`;
    nombrePaciente.textContent = `${data.nombrePaciente}`;
    documentoPaciente.textContent = `${data.documentoPaciente}`;
    nombreResponsable.textContent = `${data.nombreResponsable}`;
    documentoResponsable.textContent = `${data.documentoResponsable}`;
    descripcionFactura.textContent = `${data.descripcionFactura}`;
    cantidad.textContent = `${data.cantidad}`;
    valorIva.textContent = `${data.valorIva}`;
    valorTotal.textContent = `${data.valorTotal}`;
    observacionesFactura.textContent = `${data.observacionesFactura}`;
}

const updateEPSSelect = (EPSS) => {
    const selectEPS = document.querySelector('#listaPaciente');
    selectEPS.innerHTML = ""; // Limpiar opciones antiguas

    // Agregar opción "Sin Seleccionar" al principio
    const optionSinSeleccionar = document.createElement("option");
    optionSinSeleccionar.value = "Sin Seleccionar";
    optionSinSeleccionar.text = "Sin Seleccionar";
    selectEPS.appendChild(optionSinSeleccionar);

    // Agregar opciones al select
    EPSS.forEach((EPS) => {
        const option = document.createElement("option");
        option.value = EPS.idFacturaEPS;
        option.text = `${EPS.nombreEPS}`;
        selectEPS.appendChild(option);
    });
};

const getEPS = async (fechaInicio, fechaFin) => {
    try {
        const response = await fetch(`http://${servidor}:3000/api/EPS/${fechaInicio}/${fechaFin}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los datos de las EPS: ${response.statusText}`);
        }

        const EPSS = await response.json();
        updateEPSSelect(EPSS);
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

const updatePacientesEPS = (pacientesPre) => {
    const listaPacientePrepagada = document.querySelector('#listaPacientePrepagada');
    listaPacientePrepagada.innerHTML = ""; // Limpiar opciones antiguas

    // Agregar opción "Sin Seleccionar" al principio
    const optionSinSeleccionar = document.createElement("option");
    optionSinSeleccionar.value = "Sin Seleccionar";
    optionSinSeleccionar.text = "Sin Seleccionar";
    listaPacientePrepagada.appendChild(optionSinSeleccionar);

    // Agregar opciones al select
    pacientesPre.forEach((PacientePre) => {
        const option = document.createElement("option");
        option.value = `${PacientePre.DocumentoPaciente}|${PacientePre.DocumentoEps}` ;
        option.text = `${PacientePre.NombrePaciente}`;
        listaPacientePrepagada.appendChild(option);
    });
};

const getPacientesEPS = async (idFacturaEPS) => {
    try {
        // const response = await fetch(`http://${servidor}:3000/api/pacientesEPS/${idFacturaEPS}`);
        const response = await fetch(`http://${servidor}:3000/api/PacientesTratamientosFacturaEps/${idFacturaEPS}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los datos de evaluaciones: ${response.statusText}`);
        }

        const pacientesPre = await response.json();

        updatePacientesEPS(pacientesPre); // Llama a la función para actualizar la tabla

    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

const updateHistoriasEPS = (historiasPre) => {
    const listaHistoriaClinica = document.querySelector('#listaHistoriaClinica');
    listaHistoriaClinica.innerHTML = ""; // Limpiar opciones antiguas

    // Agregar opción "Sin Seleccionar" al principio
    const optionSinSeleccionar = document.createElement("option");
    optionSinSeleccionar.value = "Sin Seleccionar";
    optionSinSeleccionar.text = "Sin Seleccionar";
    listaHistoriaClinica.appendChild(optionSinSeleccionar);

    // Agregar opciones al select
    historiasPre.forEach((historiaPre) => {
        const option = document.createElement("option");
        option.value = historiaPre.idEveRips;
        option.text = `${historiaPre.TipoEvaluacion} ${historiaPre.fechaEveRips}`;
        listaHistoriaClinica.appendChild(option);
    });
};

const getHistoriasEPS = async (documentoPacienteEPS, DocumentoEPS) => {
    try {
        // const response = await fetch(`http://${servidor}:3000/api/hcPacientesEPS/${documentoPacienteEPS}`);
        const response = await fetch(`http://${servidor}:3000/api/RipsPacientesTratamientosEps/${documentoPacienteEPS}/${DocumentoEPS}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los datos de las historias clinicas EPS: ${response.statusText}`);
        }

        const historiaPre = await response.json();

        updateHistoriasEPS(historiaPre);

    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

document.getElementById('listaPacientePrepagada').addEventListener('change', async () => {
    const selectHistoriaClinicaEPS = document.getElementById('listaPacientePrepagada');
    const documentoPacienteSeleccionado = selectHistoriaClinicaEPS.value;

    console.log(documentoPacienteSeleccionado);

    const [documentoPaciente, documentoEps] = documentoPacienteSeleccionado.split('|');

    console.log("Documento del Paciente:", documentoPaciente);
    console.log("Documento de la EPS:", documentoEps);

    await getHistoriasEPS(documentoPaciente, documentoEps);
});

const relacionarRIPSEPS = async (idFactura, idEveRips) => {

    try {
        const response = await fetch(`http://${servidor}:3000/api/relacionarEPS/${idFactura}/${idEveRips}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },

        });

        if (!response.ok) {
            throw new Error(`Error al relacionar datos: ${response.statusText}`);
        }

        Swal.fire({
            text: "Datos relacionados correctamente",
            icon: "success",
            confirmButtonText: "OK"
        }).then((result) => {
            if (result.isConfirmed) {
                location.reload();
            }
        });
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
}

// Verifica el token al cargar la página
const isTokenValid = () => {
    const token = localStorage.getItem('token');
    const tokenExp = localStorage.getItem('token_exp');

    if (!token || !tokenExp) {
        return false;
    }

    const now = Math.floor(Date.now() / 1000); // Obtener el tiempo actual en segundos
    return now < tokenExp;
};

const redirectToIndexIfTokenExpired = () => {
    if (!isTokenValid()) {
        localStorage.removeItem('token');
        localStorage.removeItem('token_exp');
        Swal.fire({
            icon: "warning",
            title: "Sesión caducada",
            text: "Por favor, inicie sesión nuevamente",
        }).then(() => {
            window.location.href = 'index.html';
        });
    }
};

// // Llamar a esta función al cargar la página
// redirectToIndexIfTokenExpired();

// Función para verificar el token
function verificarToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            title: 'Sesión expirada',
            text: 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.',
            icon: 'warning',
            confirmButtonText: 'Aceptar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token'); // Eliminar el token del almacenamiento local
                window.location.href = 'index.html'; // Redirigir a la página de inicio de sesión
            }
        });
    }
}

// Verificar el token cada 5 segundos (5000 milisegundos)
setInterval(redirectToIndexIfTokenExpired, 5000);

// // Simulación de la expiración del token (solo para pruebas)
// setTimeout(() => {
//     localStorage.removeItem('token'); // Eliminar el token después de 30 segundos (solo para pruebas)
// }, 30000);

let documentoEmpresaSeleccionada;
let NombreEmpresaEnEntorno;
window.addEventListener('load', async () => {
    checkAuthentication();
    const storedFechaInicio = localStorage.getItem("fechaInicio");
    const storedFechaFin = localStorage.getItem("fechaFin");

    if (storedFechaInicio) {
        document.getElementById('fechaInicio').value = storedFechaInicio;
    }

    if (storedFechaFin) {
        document.getElementById('fechaFin').value = storedFechaFin;
    }
    await ripsParticular();

    /* Selección de empresa a trabajar */
    // Verificar si la función EmpresaATrabajar ya se ejecutó
    const empresaTrabajarExecuted = sessionStorage.getItem("empresaTrabajarExecuted");

    if (!empresaTrabajarExecuted) {
        // Ejecutar la función solo si no se ha ejecutado antes
        await EmpresaATrabajar();

        // Marcar que ya se ejecutó
        sessionStorage.setItem("empresaTrabajarExecuted", "true");
        console.log(sessionStorage.getItem("empresaTrabajarExecuted"));
    }

    /* USAR EL DOCUMENTO DE LA EMPRESA SELECCIONADA */
    documentoEmpresaSeleccionada = sessionStorage.getItem("empresaTrabajarExecuted");
    if (documentoEmpresaSeleccionada) {
        console.log('Documento de la empresa seleccionada:', documentoEmpresaSeleccionada);
        // Aquí puedes usar el documento de la empresa seleccionada en tu lógica
    }
    /* FIN FIN FIN */

    /* USAR EL NOMBRE DE LA EMPRESA SELECCIONADA */
    NombreEmpresaEnEntorno = sessionStorage.getItem("empresaTrabajarNombre");
    if (NombreEmpresaEnEntorno) {
        console.log('Nombre de la empresa en entorno:', NombreEmpresaEnEntorno);
        // Aquí puedes usar el nombre de la empresa en entorno en tu lógica
        // Actualizar el contenido del span con el nombre de la empresa
        document.getElementById('EmpresaDeTrabajo').textContent = NombreEmpresaEnEntorno;
    }
    /* FIN FIN FIN */
});

document.addEventListener('DOMContentLoaded', () => {
    const userLevel = localStorage.getItem('userLevel');

    if (userLevel) {
        const level = parseInt(userLevel, 10);

        const descargarRIPSButton = document.getElementById('descargarRIPS');
        const generadorRIPSLink = document.getElementById('generadorRIPS');
        const asignarRIPSLink = document.querySelector('a[href="Asignar_RIPS.html"]');
        const descargarXMLS = document.getElementById('XMLS');

        // switch (level) {
        //     case 1:
        //         // Nivel 1: Mostrar todos los botones y enlaces
        //         descargarRIPSButton.style.display = 'flex';
        //         generadorRIPSLink.style.display = 'None';
        //         // generadorRIPSLink.style.display = 'flex';
        //         // asignarRIPSLink.style.display = 'none';
        //         asignarRIPSLink.style.display = 'flex';
        //         break;
        //     case 2:
        //         // Nivel 2: Mostrar solo enlaces
        //         descargarRIPSButton.style.display = 'none';
        //         generadorRIPSLink.style.display = 'flex';
        //         asignarRIPSLink.style.display = 'flex';
        //         break;
        //     case 3:
        //         // Nivel 3: No mostrar ninguno
        //         descargarRIPSButton.style.display = 'none';
        //         generadorRIPSLink.style.display = 'none';
        //         asignarRIPSLink.style.display = 'none';
        //         break;
        //     default:
        //         console.error('Nivel de usuario no reconocido');
        // }
        if (level === 1) {
            generadorRIPSLink.style.display = 'none';
        } else {
            generadorRIPSLink.style.display = 'none';            
            const ElementosABloquear = {
                'BotonMaestro': 'Maestro (Deshabilitado)',
                'descargarRIPS': 'Descargar RIPS (Deshabilitado)',
                'XMLS': 'XMLS (Deshabilitado)',
                'checkbox1': '',
                'checkbox2': '',
                'documentoInput': '',
                'listaPaciente': '',
                'checkboxFacturaCero': '',
                'btnRelacionar': '',
                'AsignarFacturaManual': ''
            }
        
            for (let key in ElementosABloquear) {
                const elemento = document.getElementById(key); // Obtener el elemento del DOM usando el ID
        
                if (elemento) { // Verificar que el elemento exista
                    elemento.disabled = true;
                    elemento.classList.remove('btn-primary');
                    elemento.classList.add('btn-danger');
                    elemento.textContent = ElementosABloquear[key]; // Cambia el texto del botón
                    elemento.style.pointerEvents = "none"; 
                }
            }
        }
    } else {
        console.error('No se pudo obtener el nivel de usuario');
    }

    const asignarFactura = document.getElementById('asignarFactura');

    asignarFactura.addEventListener('click', async () => {
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success",
                cancelButton: "btn btn-danger",
                // Agrega una clase personalizada para cambiar el color del texto en HTML
                htmlContainer: "html-container-custom"
            },
            buttonsStyling: false
        });

        // Construir el mensaje con los textos seleccionados y aplicar estilos
        const evaluacionSeleccionadaText = obtenerIdSeleccionado('#tablaFilas')
        const selectElement = document.getElementById('selectBuscarFacturas');
        const selectedOptionText = selectElement.options[selectElement.selectedIndex].text;

        const mensaje = `<span style="color: #fff;">La Historia con (${evaluacionSeleccionadaText}) con la Factura ${selectedOptionText}?</span>`;

        const result = await swalWithBootstrapButtons.fire({
            title: "¿Está seguro de querer relacionar?",
            // Usar el formato HTML para aplicar estilos
            html: mensaje,
            icon: "warning",
            showCancelButton: true,
            cancelButtonText: "No relacionar",
            confirmButtonText: "Sí, realizar la relación de RIPS",
            reverseButtons: true
        });

        if (result.isConfirmed) {
            // Llamar a la función para realizar la inserción en la tabla
            await relacionarFacturaManual();

        } else if (result.dismiss === Swal.DismissReason.cancel) {
            swalWithBootstrapButtons.fire({
                title: "Cancelado",
                text: "La relación de RIPS ha sido cancelada.",
                icon: "error"
            });
        }
    });
});

const ripsParticular = async () => {
    checkboxPrepagada.checked = false
    // checkboxParticular.checked = true
    span_paciente.textContent = 'Seleccionar paciente:'
    tabla.style.display = 'flex';
    listasPrepagada.style.display = 'none';
    facturaCero.style.display = 'flex';
    // alerta();
}

async function EmpresaATrabajar() {
    try {
        const response = await fetch(`http://${servidor}:3000/XMLS/mostrar-empresas-con-resoluciones-vigentes`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const empresas = await response.json();
        console.log('Empresas recibidas:', empresas);

        // Muestra el SweetAlert solo después de obtener las empresas
        Swal.fire({
            allowOutsideClick: false,
            allowEscapeKey: false,
            icon: 'question',
            title: '¿En qué empresa desea trabajar?',
            html: `
                <select id="EmpresaATrabajar" class="swal2-input">
                </select>
            `,
            // confirmButtonText: 'Aceptar',
            confirmButtonText: 'IR',
            preConfirm: () => {
                const empresaSeleccionada = document.getElementById('EmpresaATrabajar').value;
                if (!empresaSeleccionada) {
                    Swal.showValidationMessage('Debe seleccionar una empresa');
                }
                return empresaSeleccionada;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // // Almacenar el valor seleccionado en sessionStorage
                // sessionStorage.setItem("empresaTrabajarExecuted", result.value);
                // console.log('Empresa seleccionada (almacenada):', result.value);

                // documentoEmpresaSeleccionada = sessionStorage.getItem("empresaTrabajarExecuted");
                // console.log('Documento de la empresa seleccionada:', documentoEmpresaSeleccionada);

                // NombreEmpresaEnEntorno = sessionStorage.getItem("empresaTrabajarNombre", result.);
                // // Aquí puedes manejar la empresa seleccionada, ya está almacenada en sessionStorage


                const selectElement = document.getElementById('EmpresaATrabajar');

                // Capturar el valor seleccionado
                documentoEmpresaSeleccionada = selectElement.value;

                // Capturar el texto de la opción seleccionada
                NombreEmpresaEnEntorno = selectElement.options[selectElement.selectedIndex].text;

                // Almacenar el valor y el nombre en sessionStorage
                sessionStorage.setItem("empresaTrabajarExecuted", documentoEmpresaSeleccionada);
                sessionStorage.setItem("empresaTrabajarNombre", NombreEmpresaEnEntorno);

                console.log('Documento de la empresa seleccionada:', documentoEmpresaSeleccionada);
                console.log('Nombre de la empresa seleccionada:', NombreEmpresaEnEntorno);

                // Actualizar el contenido del span con el nombre de la empresa
                document.getElementById('EmpresaDeTrabajo').textContent = NombreEmpresaEnEntorno;
            }
        });

        // Aquí el select ya está en el DOM, entonces puedes llenarlo
        const EmpresasRegistradasConFacturacionVigente = document.getElementById('EmpresaATrabajar');

        // Agrega una opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Seleccione una empresa';
        defaultOption.value = '';
        EmpresasRegistradasConFacturacionVigente.appendChild(defaultOption);

        // Agrega una opción para cada empresa
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.textContent = empresa.NombreComercialEmpresa; // Cambia este campo si es necesario
            option.value = empresa.DocumentoEmpresa; // Cambia este campo si es necesario
            EmpresasRegistradasConFacturacionVigente.appendChild(option);
        });
    } catch (error) {
        console.error('Hubo un problema con la solicitud:', error);
    }
}

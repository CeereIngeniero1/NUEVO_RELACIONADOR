// const servidor = "HPGRIS";
const servidor = localStorage.getItem("NombreEquipoServidor");

// Funcionalidad para incorporar buscador en el select de los pacientes
$(document).ready(function (e) {
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
const facturaCero = document.querySelector('.facturaCero')
const asignarFacturaManualBtn = document.getElementById('AsignarFacturaManual')
const ripsSelectCol = document.getElementById('ripsSelectCol')
const labelBuscarRips = document.getElementById('labelBuscarRips')
const tablaPanelIzquierdo = document.getElementById('tablaPanelIzquierdo')
const tablaPanelDerecho = document.getElementById('tablaPanelDerecho')
const emptyPanelIzquierdo = document.getElementById('emptyPanelIzquierdo')
const emptyPanelDerecho = document.getElementById('emptyPanelDerecho')
const tituloPanelIzquierdo = document.getElementById('tituloPanelIzquierdo')
const tituloPanelDerecho = document.getElementById('tituloPanelDerecho')
const theadPanelIzquierdo = document.getElementById('theadPanelIzquierdo')

const ripsUiState = {
    leftRows: [],
    selectedLeftKey: null,
    selectedLeftData: null,
    filterText: '',
};

function formatFechaRips(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    } catch (_) {
        return String(value);
    }
}

function clearPanelDerecho(mensaje = 'Seleccione una atención o factura a la izquierda.') {
    if (tablaPanelDerecho) tablaPanelDerecho.innerHTML = '';
    if (emptyPanelDerecho) {
        emptyPanelDerecho.textContent = mensaje;
        emptyPanelDerecho.classList.remove('d-none');
    }
}

function clearPanels() {
    ripsUiState.leftRows = [];
    ripsUiState.selectedLeftKey = null;
    ripsUiState.selectedLeftData = null;
    if (tablaPanelIzquierdo) tablaPanelIzquierdo.innerHTML = '';
    if (emptyPanelIzquierdo) emptyPanelIzquierdo.classList.add('d-none');
    clearPanelDerecho();
}

function applyModoUI() {
    const prepagada = checkboxPrepagada.checked;
    if (ripsSelectCol) ripsSelectCol.style.display = prepagada ? '' : 'none';
    if (facturaCero) facturaCero.style.display = prepagada ? 'none' : 'flex';
    if (asignarFacturaManualBtn) asignarFacturaManualBtn.style.display = prepagada ? 'none' : '';
    if (labelBuscarRips) {
        labelBuscarRips.textContent = prepagada ? 'Buscar atención' : 'Buscar factura';
    }
    if (tituloPanelIzquierdo) {
        tituloPanelIzquierdo.textContent = prepagada
            ? 'Atenciones / Pacientes en factura'
            : 'Facturas del rango';
    }
    if (tituloPanelDerecho) {
        tituloPanelDerecho.textContent = prepagada
            ? 'Historias clínicas RIPS'
            : 'Historias clínicas RIPS pendientes';
    }
    if (theadPanelIzquierdo) {
        theadPanelIzquierdo.innerHTML = prepagada
            ? '<tr><th>PLAN / PACIENTE</th><th>DOCUMENTO</th><th>ESTADO HC</th></tr>'
            : '<tr><th>ID</th><th>PACIENTE</th><th>FACTURA</th><th>VER</th></tr>';
    }
    clearPanels();
}

function rowMatchesFilter(text) {
    const q = (ripsUiState.filterText || '').trim().toLowerCase();
    if (!q) return true;
    return String(text || '').toLowerCase().includes(q);
}

function markSelectedLeftRow(key) {
    ripsUiState.selectedLeftKey = key;
    if (!tablaPanelIzquierdo) return;
    tablaPanelIzquierdo.querySelectorAll('tr').forEach((tr) => {
        tr.classList.toggle('cr-row-selected', tr.dataset.rowKey === key);
    });
}

function renderPanelIzquierdoParticular(facturas) {
    ripsUiState.leftRows = Array.isArray(facturas) ? facturas : [];
    if (!tablaPanelIzquierdo) return;
    tablaPanelIzquierdo.innerHTML = '';

    const visibles = ripsUiState.leftRows.filter((f) => {
        const blob = `${f.idFactura} ${f.nombrePaciente} ${f.documentoPaciente} ${f.prefijo} ${f.noFactura}`;
        return rowMatchesFilter(blob);
    });

    if (!visibles.length) {
        if (emptyPanelIzquierdo) emptyPanelIzquierdo.classList.remove('d-none');
        return;
    }
    if (emptyPanelIzquierdo) emptyPanelIzquierdo.classList.add('d-none');

    visibles.forEach((f) => {
        const tr = document.createElement('tr');
        const key = `fac-${f.idFactura}`;
        tr.dataset.rowKey = key;
        tr.dataset.modo = 'particular';
        if (ripsUiState.selectedLeftKey === key) tr.classList.add('cr-row-selected');

        const fechaTxt = formatFechaRips(f.fechaFactura);
        const detalle = `${f.prefijo || ''} No. ${f.noFactura} — $${f.totalFactura} — ${fechaTxt}`;

        tr.innerHTML = `
            <td>${f.idFactura}</td>
            <td>${f.nombrePaciente || '—'}<br><small class="text-muted">${f.documentoPaciente || ''}</small></td>
            <td>${detalle}</td>
            <td><button type="button" class="btn btn-sm btn-outline-secondary btn-ver-factura">Ver</button></td>
        `;

        tr.addEventListener('click', (ev) => {
            if (ev.target.closest('.btn-ver-factura')) return;
            onLeftRowClickParticular(f, key);
        });
        tr.querySelector('.btn-ver-factura')?.addEventListener('click', (ev) => {
            ev.stopPropagation();
            fetch(`${window.getApiBaseUrl()}/api/usuarios/factura/${f.idFactura}`)
                .then((r) => r.json())
                .then((data) => { llenarModal(data); $('#exampleModal').modal('show'); })
                .catch((err) => console.error('Error al obtener datos de factura:', err));
        });

        tablaPanelIzquierdo.appendChild(tr);
    });
}

function renderPanelIzquierdoPrepagada(pacientes) {
    ripsUiState.leftRows = Array.isArray(pacientes) ? pacientes : [];
    if (!tablaPanelIzquierdo) return;
    tablaPanelIzquierdo.innerHTML = '';

    const visibles = ripsUiState.leftRows.filter((p) => {
        const blob = `${p.NombrePaciente} ${p.DocumentoPaciente} ${p.Idtratamiento}`;
        return rowMatchesFilter(blob);
    });

    if (!visibles.length) {
        if (emptyPanelIzquierdo) emptyPanelIzquierdo.classList.remove('d-none');
        return;
    }
    if (emptyPanelIzquierdo) emptyPanelIzquierdo.classList.add('d-none');

    visibles.forEach((p) => {
        const key = `${p.DocumentoPaciente}|${p.DocumentoEps}|${p.Idtratamiento}`;
        const tr = document.createElement('tr');
        tr.dataset.rowKey = key;
        tr.dataset.modo = 'prepagada';
        if (ripsUiState.selectedLeftKey === key) tr.classList.add('cr-row-selected');

        const estado = (p.NombrePaciente || '').includes('NO TIENE') ? 'Sin HC relacionada' : 'Con HC';
        tr.innerHTML = `
            <td>${p.NombrePaciente || '—'}</td>
            <td>${p.DocumentoPaciente || '—'}</td>
            <td>${estado}</td>
        `;
        tr.addEventListener('click', () => onLeftRowClickPrepagada(p, key));
        tablaPanelIzquierdo.appendChild(tr);
    });
}

function renderPanelDerechoRips(items, modo) {
    if (!tablaPanelDerecho) return;
    tablaPanelDerecho.innerHTML = '';

    const list = Array.isArray(items) ? items : [];
    if (!list.length) {
        clearPanelDerecho('No hay historias clínicas RIPS para esta selección.');
        return;
    }
    if (emptyPanelDerecho) emptyPanelDerecho.classList.add('d-none');

    list.forEach((item) => {
        const tr = document.createElement('tr');
        const idRips = item.idEveRips ?? item.idEvaluacion;
        const realizadoPor = item.nombreUsuario || item.TipoEvaluacion || '—';
        const detalle = item.fechaEveRips
            ? item.fechaEveRips
            : `Fecha: ${formatFechaRips(item.fechaEvaluacion)}`;

        tr.innerHTML = `
            <td class="ColumnaCheckBox"><input type="checkbox" class="checkboxColumn rips-check-derecho" value="${idRips}"></td>
            <td>${idRips}</td>
            <td>${realizadoPor}</td>
            <td>${detalle}</td>
        `;
        tablaPanelDerecho.appendChild(tr);
    });

    tablaPanelDerecho.querySelectorAll('.rips-check-derecho').forEach((chk) => {
        chk.addEventListener('change', () => {
            if (!chk.checked) return;
            tablaPanelDerecho.querySelectorAll('.rips-check-derecho').forEach((other) => {
                if (other !== chk) other.checked = false;
            });
        });
    });
}

async function onLeftRowClickParticular(factura, key) {
    markSelectedLeftRow(key);
    ripsUiState.selectedLeftData = factura;
    clearPanelDerecho('Cargando historias clínicas...');
    try {
        const doc = factura.documentoPaciente;
        const response = await fetch(`${window.getApiBaseUrl()}/api/evaluaciones/${doc}/${fechaInicio}/${fechaFin}`);
        if (!response.ok) throw new Error(response.statusText);
        const evaluaciones = await response.json();
        renderPanelDerechoRips(evaluaciones, 'particular');
    } catch (ex) {
        console.error(ex);
        clearPanelDerecho(`Error: ${ex.message}`);
    }
}

async function onLeftRowClickPrepagada(paciente, key) {
    markSelectedLeftRow(key);
    ripsUiState.selectedLeftData = paciente;
    clearPanelDerecho('Cargando historias clínicas...');
    try {
        await getHistoriasEPSPanel(
            paciente.DocumentoPaciente,
            paciente.DocumentoEps,
            paciente.Idtratamiento
        );
    } catch (ex) {
        console.error(ex);
        clearPanelDerecho(`Error: ${ex.message}`);
    }
}

function obtenerRipsSeleccionadoDerecho() {
    const chk = tablaPanelDerecho?.querySelector('.rips-check-derecho:checked');
    return chk ? chk.value : null;
}

function obtenerDetalleRipsSeleccionadoDerecho() {
    const chk = tablaPanelDerecho?.querySelector('.rips-check-derecho:checked');
    if (!chk) return null;
    const tr = chk.closest('tr');
    return tr?.querySelector('td:nth-child(4)')?.textContent?.trim() || null;
}

function refrescarTrasRelacionar() {
    if (checkboxPrepagada.checked) {
        const idFactura = document.getElementById('listaPaciente')?.value;
        if (idFactura && idFactura !== 'Sin Seleccionar') {
            getPacientesEPS(idFactura);
            if (ripsUiState.selectedLeftData) {
                const p = ripsUiState.selectedLeftData;
                getHistoriasEPSPanel(p.DocumentoPaciente, p.DocumentoEps, p.Idtratamiento);
            }
        }
    } else if (fechaInicio && fechaFin && documentoEmpresaSeleccionada) {
        getFacturasRango(fechaInicio, fechaFin, documentoEmpresaSeleccionada);
        if (ripsUiState.selectedLeftData) {
            onLeftRowClickParticular(ripsUiState.selectedLeftData, ripsUiState.selectedLeftKey);
        }
    }
}

checkboxParticular.addEventListener('change', () => {
    if (checkboxParticular.checked) {
        checkboxPrepagada.checked = false;
        applyModoUI();
        alerta();
    }
});

checkboxPrepagada.addEventListener('change', () => {
    if (checkboxPrepagada.checked) {
        checkboxParticular.checked = false;
        span_paciente.textContent = 'Seleccionar factura prepagada / EPS:';
        applyModoUI();
        alerta();
    }
});

if (checkboxPrepagada.checked) {
    applyModoUI();
} else {
    applyModoUI();
}

document.getElementById('documentoInput')?.addEventListener('input', (ev) => {
    ripsUiState.filterText = ev.target.value || '';
    if (checkboxPrepagada.checked) {
        buscarPacientePorDocumento();
        renderPanelIzquierdoPrepagada(ripsUiState.leftRows);
    } else {
        renderPanelIzquierdoParticular(ripsUiState.leftRows);
    }
});

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

const getFacturasRango = async (fInicio, fFin, docEmpresa) => {
    try {
        const response = await fetch(`${window.getApiBaseUrl()}/api/facturasRango/${fInicio}/${fFin}/${docEmpresa}`);
        if (!response.ok) {
            throw new Error(`Error al obtener facturas: ${response.statusText}`);
        }
        const facturas = await response.json();
        ripsUiState.selectedLeftKey = null;
        ripsUiState.selectedLeftData = null;
        renderPanelIzquierdoParticular(facturas);
        clearPanelDerecho();
        Swal.close();
        if (!facturas.length) {
            Swal.fire({ icon: 'info', text: 'No hay facturas pendientes de relacionar en el rango seleccionado.' });
        }
    } catch (ex) {
        Swal.close();
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

const getPacientes = async (fechaInicio, fechaFin) => {
    try {
        const response = await fetch(`${window.getApiBaseUrl()}/api/pacientes/${fechaInicio}/${fechaFin}/${documentoEmpresaSeleccionada}`);
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
        const response = await fetch(`${window.getApiBaseUrl()}/api/evaluaciones/${documento}/${fechaInicio}/${fechaFin}`);
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
        const response = await fetch(`${window.getApiBaseUrl()}/api/facturas/${documento}`);
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

$(document).ready(function () {
    $('#listaPaciente').on('change', async function () {
        const idFactura = $(this).val();
        if (!idFactura || idFactura === 'Sin Seleccionar') {
            clearPanels();
            return;
        }
        if (checkboxPrepagada.checked) {
            await getPacientesEPS(idFactura);
        }
    });
});


const relacionarDatosFacturaCero = async () => {
    const evaluacionesSeleccionadas = obtenerFilasSeleccionadas('#tablaPanelDerecho');
    if (!evaluacionesSeleccionadas.length) {
        alert('Seleccione una historia clínica RIPS en el panel derecho.');
        return;
    }

    try {
        const response = await fetch(`${window.getApiBaseUrl()}/api/facturaCero/${documentoEmpresaSeleccionada}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                evaluacion: evaluacionesSeleccionadas[0],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error al relacionar datos: ${data.error}`);
        }

        Swal.fire({
            text: "Datos relacionados correctamente",
            icon: "success",
            confirmButtonText: "OK"
        }).then(() => {
            refrescarTrasRelacionar();
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

const relacionarDatos = async () => {
    const idEveRips = obtenerRipsSeleccionadoDerecho();
    const idFactura = ripsUiState.selectedLeftData?.idFactura;

    if (!idEveRips || !idFactura) {
        alert('Seleccione una factura a la izquierda y un RIPS a la derecha.');
        return;
    }

    try {
        const response = await fetch(`${window.getApiBaseUrl()}/api/relacionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                evaluacion: idEveRips,
                factura: idFactura,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error al relacionar datos: ${response.statusText}`);
        }

        Swal.fire({
            text: "Datos relacionados correctamente",
            icon: "success",
            confirmButtonText: "OK"
        }).then(() => {
            refrescarTrasRelacionar();
        });
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
}

const relacionarFacturaManual = async () => {
    const evaluacionesSeleccionadas = obtenerFilasSeleccionadas('#tablaPanelDerecho');
    const facturasSeleccionadas = document.getElementById('selectBuscarFacturas').value;

    if (!evaluacionesSeleccionadas.length || !facturasSeleccionadas) {
        alert('Seleccione un RIPS en el panel derecho y una factura en el modal.');
        return;
    }

    try {
        const response = await fetch(`${window.getApiBaseUrl()}/api/relacionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                evaluacion: evaluacionesSeleccionadas[0],
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
        }).then(() => {
            refrescarTrasRelacionar();
        });
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
}

// BUTTON RELACIONAR =>
btnRelacionar.addEventListener('click', async () => {
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            confirmButton: "btn btn-success",
            cancelButton: "btn btn-danger",
            htmlContainer: "html-container-custom"
        },
        buttonsStyling: false
    });

    if (checkboxFacturaCero.checked) {
        const detalleHc = obtenerDetalleRipsSeleccionadoDerecho();
        if (!detalleHc) {
            alert('Seleccione una historia clínica RIPS en el panel derecho.');
            return;
        }
        const mensaje = `<span style="color: #fff;">La Historia (${detalleHc}) con una Factura en 0?</span>`;
        const result = await swalWithBootstrapButtons.fire({
            title: "¿Está seguro de querer relacionar?",
            html: mensaje,
            icon: "warning",
            showCancelButton: true,
            cancelButtonText: "No relacionar",
            confirmButtonText: "Sí, realizar la relación de RIPS",
            reverseButtons: true
        });
        if (result.isConfirmed) {
            await relacionarDatosFacturaCero();
        }
        return;
    }

    if (checkboxPrepagada.checked) {
        const idFactura = document.getElementById('listaPaciente').value;
        const idEveRips = obtenerRipsSeleccionadoDerecho();
        const paciente = ripsUiState.selectedLeftData;
        const IdTratamiento = paciente?.Idtratamiento;

        if (!idFactura || idFactura === 'Sin Seleccionar' || !idEveRips || !IdTratamiento) {
            alert('Seleccione factura EPS, una atención a la izquierda y un RIPS a la derecha.');
            return;
        }

        const textoHc = obtenerDetalleRipsSeleccionadoDerecho();
        const mensaje = `<span style="color: #fff;">La Factura (${idFactura}) con la historia (${textoHc})?</span>`;
        const result = await swalWithBootstrapButtons.fire({
            title: "¿Está seguro de querer relacionar?",
            html: mensaje,
            icon: "warning",
            showCancelButton: true,
            cancelButtonText: "No relacionar",
            confirmButtonText: "Sí, realizar la relación de RIPS",
            reverseButtons: true
        });
        if (result.isConfirmed) {
            await relacionarRIPSEPS(idFactura, idEveRips, IdTratamiento);
        }
        return;
    }

    const idEveRips = obtenerRipsSeleccionadoDerecho();
    const factura = ripsUiState.selectedLeftData;
    if (!idEveRips || !factura?.idFactura) {
        alert('Seleccione una factura a la izquierda y un RIPS a la derecha.');
        return;
    }

    const detalleHc = obtenerDetalleRipsSeleccionadoDerecho();
    const detalleFac = `${factura.prefijo || ''} No. ${factura.noFactura}`;
    const mensaje = `<span style="color: #fff;">La Factura (${detalleFac}) con la historia (${detalleHc})?</span>`;
    const result = await swalWithBootstrapButtons.fire({
        title: "¿Está seguro de querer relacionar?",
        html: mensaje,
        icon: "warning",
        showCancelButton: true,
        cancelButtonText: "No relacionar",
        confirmButtonText: "Sí, realizar la relación de RIPS",
        reverseButtons: true
    });
    if (result.isConfirmed) {
        await relacionarDatos();
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
        const response = await fetch(`${window.getApiBaseUrl()}/api/buscarFacturas/${documento}`);
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
    const docFromPanel = ripsUiState.selectedLeftData?.documentoPaciente;
    const pacienteSeleccionado = docFromPanel || selectPaciente.value;
    if (pacienteSeleccionado && pacienteSeleccionado !== 'Sin Seleccionar') {
        await getBuscarFacturas(pacienteSeleccionado);
    } else {
        alert('Seleccione primero una factura en el panel izquierdo (o un paciente).');
    }
});

const modalFacturaManual = document.getElementById('miModal');
if (modalFacturaManual) {
    modalFacturaManual.addEventListener('show.bs.modal', async () => {
        const doc = ripsUiState.selectedLeftData?.documentoPaciente;
        if (doc) {
            await getBuscarFacturas(doc);
        }
    });
}

let fechaInicio;
let fechaFin;

const alerta = async () => {
    // Obtener las fechas almacenadas en localStorage
    const storedFechaInicio = localStorage.getItem("fechaInicio");
    const storedFechaFin = localStorage.getItem("fechaFin");

    const { value: formValues } = await Swal.fire({
        title: checkboxParticular.checked
            ? "Seleccione el rango de fecha para cargar las facturas"
            : "Seleccione el rango de fecha para cargar las facturas EPS",
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
                    await MensajeDeCarga('Cargando facturas');
                    getFacturasRango(fechaInicio, fechaFin, documentoEmpresaSeleccionada);
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
        const response = await fetch(`${window.getApiBaseUrl()}/protected`, {
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

    // Se elimina el nombre del equipo servidor
    localStorage.removeItem('NombreEquipoServidor');

    // Redirigir al usuario a la página de inicio de sesión u otra página deseada
    window.location.href = 'index.html'; // Cambia esto a la página de inicio de sesión o la página que prefieras
};

// Asociar la función a un botón de cierre de sesión (puedes cambiar el selector según tu HTML)
document.getElementById('closeSesion').addEventListener('click', logout);

/** FUNCIÓN PARA LA DESCARGA DE LOS ARCHIVOS JSON */
async function DescargarArchivosJSON() {
    console.log("entre a los eps");
    // DescargarArchivosJSONParticulares();
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
        // const response = await fetch(`${window.getApiBaseUrl()}/RIPS/usuarios/ripsEPS/${fechaInicioValue}/${fechaFinValue}/${SelectResolucionesRips}/${documentoEmpresaSeleccionada}`);
        const response = await fetch(`${window.getApiBaseUrl()}/RIPS/usuarios/rips/${fechaInicioValue}/${fechaFinValue}/${SelectResolucionesRips}/${documentoEmpresaSeleccionada}`);

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();

        console.log('Enviando datos al servidor para generar archivo ZIP...');

        const zipResponse = await fetch(`${window.getApiBaseUrl()}/RIPS/generar-zip/${fechaInicioValue}/${fechaFinValue}/${TextoPrefijo}`, {
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

async function DescargarArchivosJSONParticulares() {
    console.log("entre a los particulares");

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
        // const response = await fetch(`${window.getApiBaseUrl()}/RIPS/usuarios/ripsEPS/${fechaInicioValue}/${fechaFinValue}/${SelectResolucionesRips}/${documentoEmpresaSeleccionada}`);
        const response = await fetch(`${window.getApiBaseUrl()}/RIPS/usuarios/ripsParticular/${fechaInicioValue}/${fechaFinValue}/${SelectResolucionesRips}/${documentoEmpresaSeleccionada}`);

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();

        console.log('Enviando datos al servidor para generar archivo ZIP...');

        const zipResponse = await fetch(`${window.getApiBaseUrl()}/RIPS/generar-zip/${fechaInicioValue}/${fechaFinValue}/${TextoPrefijo}`, {
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
    // DescargarArchivosJSONParticulares();
    DescargarArchivosJSON();


})


document.getElementById('obtenerDatosParticularesBtn').addEventListener('click', async () => {
    // MensajeDeCarga("Descargando JSON...");
    // await Esperar(1000);
    DescargarArchivosJSONParticulares();

})
/* FIN FIN FIN */

document.getElementById('descargarRIPS').addEventListener('click', async () => {


    // try {
    //     const response = await fetch(`${window.getApiBaseUrl()}/XMLS/mostrar-empresas-con-resoluciones-vigentes`);
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
        // const response = await fetch(`${window.getApiBaseUrl()}/XMLS/mostrar-resoluciones-vigentes-segun-empresa-seleccionada/${EmpresaSeleccionada}`);
        const response = await fetch(`${window.getApiBaseUrl()}/XMLS/mostrar-resoluciones-vigentes-segun-empresa-seleccionada/${documentoEmpresaSeleccionada}`);
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
    //         const response = await fetch(`${window.getApiBaseUrl()}/XMLS/mostrar-empresas-con-resoluciones-vigentes`);
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
        const response = await fetch(`${window.getApiBaseUrl()}/XMLS/mostrar-resoluciones-vigentes-segun-empresa-seleccionada/${documentoEmpresaSeleccionada}`);
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
            // const response = await fetch(`${window.getApiBaseUrl()}/XMLS/descargarxmls-api-fenalco/${Resolucion.value}/${FechaInicial.value}/${FechaFinal.value}/${documentoEmpresaSeleccionada}`, {
            const response = await fetch(`${window.getApiBaseUrl()}/XMLS/descargarxmls-api-facturatech/${Resolucion.value}/${FechaInicial.value}/${FechaFinal.value}/${documentoEmpresaSeleccionada}`, {
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


async function DescargarXMLSPorLaAPIFernalco() {
    const Resolucion = document.getElementById('Resoluciones');
    const FechaInicial = document.getElementById('FechaInicial');
    const FechaFinal = document.getElementById('FechaFinal');

    const campos = [
        { valor: Resolucion.value, mensaje: 'Resolución.' },
        { valor: FechaInicial.value, mensaje: 'Fecha inicial.' },
        { valor: FechaFinal.value, mensaje: 'Fecha final.' }
    ];

    const errores = [];

    for (let i = 0; i < campos.length; i++) {
        const campo = campos[i];
        if (!campo.valor) {
            errores.push(campo.mensaje);
        } else if (i >= 1 && isNaN(Date.parse(campo.valor))) {
            errores.push(campo.mensaje);
        }
    }

    if (FechaInicial.value > FechaFinal.value) {
        errores.push('La fecha inicial no puede ser mayor que la fecha final.');
    }

    if (errores.length > 0) {
        Swal.fire({
            icon: 'info',
            html: `
                <h5><b>Los siguientes campos son necesarios</b></h5>
                <br>
                <ul style="text-align: left;">
                    ${errores.map((campo) => `<li style="color: #FFFFFF;">${campo}</li>`).join("")}
                </ul>
            `
        });
        return;
    }

    try {
        // Mostrar mensaje de carga
        await MensajeDeCarga('Descargando XMLs, por favor espera...');

        const response = await fetch(`${window.getApiBaseUrl()}/XMLS/descargarxmls-api-fenalco/${Resolucion.value}/${FechaInicial.value}/${FechaFinal.value}/${documentoEmpresaSeleccionada}`, {
            method: 'POST'
        });

        const data = await response.json();

        // Cierra el mensaje de carga
        Swal.close();

        if (data.error) {
            Swal.fire({
                icon: 'error',
                html: `
                    <h3>Hubo un problema al descargar los XMLs</h3>
                    <br />
                    <p>Error: ${data.error}</p>
                `
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Proceso completado',
                text: 'Se descargaron los XMLs correctamente.'
            });
            console.log('Respuesta del servidor:', data);
        }

    } catch (error) {
        Swal.close();
        Swal.fire({
            icon: 'error',
            text: 'Hubo un problema al descargar los XMLs. Detalles: ' + error.message
        });
        console.error(error);
    }
}


async function BuscarFacturador() {
       
    try {
        const response = await fetch(`${window.getApiBaseUrl()}/XMLS//Facturador/${documentoEmpresaSeleccionada}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const Facturador = await response.json();
        // console.log('Facturador arr:', Facturador);
        // console.log('Facturador:', Facturador[0].Facturador);

        return Facturador[0].Facturador;
        // return Facturador.Facturador[0].Facturador;

    } catch (Err) {
        console.error(Err);
        return "Facturatech";
    }

}




document.getElementById('DescargarXMLS').addEventListener('click', async () => {


    const Facturador = await BuscarFacturador();
    console.log("Encontre ", Facturador);

    if (Facturador == 'Fenalco' || Facturador == 'fenalco') {
        DescargarXMLSPorLaAPIFernalco();
        console.log("Soy Fenalco");

    } else if (Facturador == 'Facturatech' || Facturador == 'facturatech') {
        MensajeDeCarga("Descargando XMLS...");
        DescargarXMLSPorLaAPIDeFacturaTech();
        console.log("Soy Facturatech");

    }

})
/* FIN FIN FIN FIN FIN FIN FIN */

// Ver factura: manejado en renderPanelIzquierdoParticular (btn-ver-factura)

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
        const response = await fetch(`${window.getApiBaseUrl()}/api/EPS/${fechaInicio}/${fechaFin}`);
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
    ripsUiState.selectedLeftKey = null;
    ripsUiState.selectedLeftData = null;
    renderPanelIzquierdoPrepagada(pacientesPre);
    clearPanelDerecho();
};

const getPacientesEPS = async (idFacturaEPS) => {
    try {
        const response = await fetch(`${window.getApiBaseUrl()}/api/PacientesTratamientosFacturaEps/${idFacturaEPS}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los datos de evaluaciones: ${response.statusText}`);
        }

        const pacientesPre = await response.json();
        updatePacientesEPS(pacientesPre);
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

const getHistoriasEPSPanel = async (documentoPacienteEPS, DocumentoEPS, IdTratamiento) => {
    const response = await fetch(`${window.getApiBaseUrl()}/api/RipsPacientesTratamientosEps/${documentoPacienteEPS}/${DocumentoEPS}/${IdTratamiento}`);
    if (!response.ok) {
        throw new Error(`Error al obtener historias clínicas EPS: ${response.statusText}`);
    }
    const historiaPre = await response.json();
    renderPanelDerechoRips(historiaPre, 'prepagada');
};

const getHistoriasEPS = async (documentoPacienteEPS, DocumentoEPS, IdTratamiento) => {
    try {
        await getHistoriasEPSPanel(documentoPacienteEPS, DocumentoEPS, IdTratamiento);
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

const relacionarRIPSEPS = async (idFactura, idEveRips, IdTratamiento) => {

    try {
        const response = await fetch(`${window.getApiBaseUrl()}/api/relacionarEPS/${idFactura}/${idEveRips}/${IdTratamiento}`, {
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
        }).then(() => {
            refrescarTrasRelacionar();
        });
    } catch (ex) {
        console.error(ex);
        alert(`Error: ${ex.message}`);
    }
};

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
        localStorage.removeItem('NombreEquipoServidor');
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
                localStorage.removeItem('NombreEquipoServidor');
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
        const asignarRIPSLink = document.querySelector('a[href="Asignar_RIPS V3.html"]');
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
        const evaluacionSeleccionadaText = obtenerDetalleRipsSeleccionadoDerecho() || '—';
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
    checkboxPrepagada.checked = false;
    checkboxParticular.checked = true;
    applyModoUI();
};

async function EmpresaATrabajar() {
    try {
        const response = await fetch(`${window.getApiBaseUrl()}/XMLS/mostrar-empresas-con-resoluciones-vigentes`);
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

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
const progresoFacturaPrepagada = document.getElementById('progresoFacturaPrepagada')

const ripsUiState = {
    leftRows: [],
    rightRows: [],
    rightModo: null,
    selectedLeftKey: null,
    selectedLeftData: null,
    filterText: '',
    sortLeft: { col: null, dir: 1 },
    sortRight: { col: null, dir: 1 },
    expandedPatientKey: null,
};

const RIPS_HC_MAX_MESES = 4;

const MESES_ABBR = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
    jan: 0, apr: 3, aug: 7, dec: 11,
};

function formatFechaRips(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    } catch (_) {
        return String(value);
    }
}

/** Fecha límite: hoy menos N meses (hora 00:00). */
function fechaLimiteMesesAtras(meses = RIPS_HC_MAX_MESES) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - meses);
    return d;
}

/** Extrae Date de un ítem del panel derecho (fechaEvaluacion o fechaEveRips estilo SQL 100). */
function parseFechaItemRips(item) {
    if (!item) return null;
    if (item.fechaEvaluacion) {
        const d = new Date(item.fechaEvaluacion);
        if (!Number.isNaN(d.getTime())) return d;
    }
    const rawFull = String(item.fechaEveRips || '').trim();
    if (!rawFull) return null;
    const raw = rawFull.split(';')[0].trim();
    const asIso = new Date(raw);
    if (!Number.isNaN(asIso.getTime())) return asIso;

    const m = raw.match(
        /^([A-Za-zÁÉÍÓÚáéíóúñÑ.]+)\s+(\d{1,2})\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?)?/
    );
    if (!m) return null;
    const mesKey = m[1].replace(/\./g, '').slice(0, 3).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mes = MESES_ABBR[mesKey];
    if (mes == null) return null;
    let hora = m[4] != null ? parseInt(m[4], 10) : 0;
    const min = m[5] != null ? parseInt(m[5], 10) : 0;
    const seg = m[6] != null ? parseInt(m[6], 10) : 0;
    const ampm = (m[7] || '').toUpperCase();
    if (ampm === 'PM' && hora < 12) hora += 12;
    if (ampm === 'AM' && hora === 12) hora = 0;
    const d = new Date(parseInt(m[3], 10), mes, parseInt(m[2], 10), hora, min, seg);
    return Number.isNaN(d.getTime()) ? null : d;
}

function filtrarRipsUltimosMeses(items, meses = RIPS_HC_MAX_MESES) {
    const limite = fechaLimiteMesesAtras(meses);
    return (Array.isArray(items) ? items : []).filter((item) => {
        const fecha = parseFechaItemRips(item);
        if (!fecha) return false;
        return fecha >= limite;
    });
}

function compareSortValues(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

function sortMarker(activeCol, col, dir) {
    if (activeCol !== col) return ' <span class="rips-sort-ind" aria-hidden="true">↕</span>';
    return dir > 0
        ? ' <span class="rips-sort-ind rips-sort-ind-active" aria-hidden="true">↑</span>'
        : ' <span class="rips-sort-ind rips-sort-ind-active" aria-hidden="true">↓</span>';
}

function wireTableSort(thead, onSort) {
    if (!thead) return;
    thead.querySelectorAll('th[data-sort-key]').forEach((th) => {
        th.classList.add('rips-sortable-th');
        th.title = 'Clic para ordenar';
        th.addEventListener('click', () => {
            const key = th.getAttribute('data-sort-key');
            onSort(key);
        });
    });
}

function paintTheadIzquierdo() {
    if (!theadPanelIzquierdo) return;
    const prepagada = checkboxPrepagada.checked;
    const { col, dir } = ripsUiState.sortLeft;
    if (prepagada) {
        theadPanelIzquierdo.innerHTML = `<tr>
            <th data-sort-key="paciente">PACIENTE${sortMarker(col, 'paciente', dir)}</th>
            <th data-sort-key="documento">DOCUMENTO${sortMarker(col, 'documento', dir)}</th>
            <th data-sort-key="estado">PROGRESO HC${sortMarker(col, 'estado', dir)}</th>
        </tr>`;
    } else {
        theadPanelIzquierdo.innerHTML = `<tr>
            <th data-sort-key="id">ID${sortMarker(col, 'id', dir)}</th>
            <th data-sort-key="paciente">PACIENTE${sortMarker(col, 'paciente', dir)}</th>
            <th data-sort-key="factura">FACTURA${sortMarker(col, 'factura', dir)}</th>
            <th>VER</th>
        </tr>`;
    }
    wireTableSort(theadPanelIzquierdo, (key) => {
        if (ripsUiState.sortLeft.col === key) ripsUiState.sortLeft.dir *= -1;
        else {
            ripsUiState.sortLeft.col = key;
            ripsUiState.sortLeft.dir = 1;
        }
        if (checkboxPrepagada.checked) renderPanelIzquierdoPrepagada(ripsUiState.leftRows);
        else renderPanelIzquierdoParticular(ripsUiState.leftRows);
    });
}

function paintTheadDerecho() {
    const thead = document.getElementById('theadPanelDerecho');
    if (!thead) return;
    const { col, dir } = ripsUiState.sortRight;
    thead.innerHTML = `<tr>
        <th class="ColumnaCheckBox">SEL.</th>
        <th data-sort-key="idRips">ID RIPS${sortMarker(col, 'idRips', dir)}</th>
        <th data-sort-key="realizadoPor">REALIZADA POR${sortMarker(col, 'realizadoPor', dir)}</th>
        <th data-sort-key="fecha">HISTORIA CLÍNICA${sortMarker(col, 'fecha', dir)}</th>
    </tr>`;
    wireTableSort(thead, (key) => {
        if (ripsUiState.sortRight.col === key) ripsUiState.sortRight.dir *= -1;
        else {
            ripsUiState.sortRight.col = key;
            ripsUiState.sortRight.dir = 1;
        }
        renderPanelDerechoRips(ripsUiState.rightRows, ripsUiState.rightModo, { alreadyFiltered: true });
    });
}

function sortKeyIzquierdoParticular(f, key) {
    if (key === 'id') return Number(f.idFactura) || 0;
    if (key === 'paciente') return f.nombrePaciente || '';
    if (key === 'factura') return `${f.prefijo || ''} ${f.noFactura || ''}`;
    return '';
}

function sortKeyIzquierdoPrepagada(p, key) {
    if (key === 'paciente') return p.NombrePaciente || '';
    if (key === 'documento') return p.DocumentoPaciente || '';
    if (key === 'estado') {
        return (p.NombrePaciente || '').includes('NO TIENE') ? 'Sin HC relacionada' : 'Con HC';
    }
    return '';
}

function sortKeyGrupoPrepagada(grupo, key) {
    if (key === 'paciente') return grupo.nombre || '';
    if (key === 'documento') return grupo.DocumentoPaciente || '';
    if (key === 'estado') {
        const ratio = grupo.total ? grupo.relacionados / grupo.total : 0;
        return ratio;
    }
    return '';
}

function nombrePacienteLimpio(nombreRaw) {
    return String(nombreRaw || '')
        .replace(/\s+Pres\s+\d+[\s\S]*$/i, '')
        .replace(/\s+HC\s+[\s\S]*$/i, '')
        .replace(/\s+/g, ' ')
        .trim() || 'Paciente';
}

function esTratamientoRelacionado(p) {
    return !String(p.NombrePaciente || '').toUpperCase().includes('NO TIENE');
}

function extraerNroPres(p) {
    const m = String(p.NombrePaciente || '').match(/Pres\s+(\d+)/i);
    if (m) return m[1];
    return p.Idtratamiento != null ? String(p.Idtratamiento) : '—';
}

function agruparPacientesPrepagada(rows) {
    const map = new Map();
    for (const p of rows) {
        const doc = String(p.DocumentoPaciente || '').trim();
        const eps = String(p.DocumentoEps || '').trim();
        const key = `grp-${doc}|${eps}`;
        if (!map.has(key)) {
            map.set(key, {
                key,
                DocumentoPaciente: doc,
                DocumentoEps: eps,
                nombre: nombrePacienteLimpio(p.NombrePaciente),
                tratamientos: [],
            });
        }
        const g = map.get(key);
        g.tratamientos.push(p);
        if (!g.nombre || g.nombre === 'Paciente') {
            g.nombre = nombrePacienteLimpio(p.NombrePaciente);
        }
    }
    return [...map.values()].map((g) => {
        const relacionados = g.tratamientos.filter(esTratamientoRelacionado).length;
        const total = g.tratamientos.length;
        return { ...g, relacionados, total };
    });
}

function badgeProgresoHc(relacionados, total) {
    const full = total > 0 && relacionados >= total;
    const none = relacionados === 0;
    const cls = full ? 'rips-progress-full' : none ? 'rips-progress-none' : 'rips-progress-partial';
    const label = full ? 'Completo' : none ? 'Sin relacionar' : 'Parcial';
    return `<span class="rips-progress-badge ${cls}" title="${label}">${relacionados}/${total}</span>`;
}

function actualizarProgresoFacturaPrepagada(grupos) {
    if (!progresoFacturaPrepagada) return;
    if (!checkboxPrepagada?.checked) {
        progresoFacturaPrepagada.classList.add('d-none');
        progresoFacturaPrepagada.innerHTML = '';
        return;
    }
    const list = Array.isArray(grupos) ? grupos : [];
    const relacionados = list.reduce((acc, g) => acc + (Number(g.relacionados) || 0), 0);
    const total = list.reduce((acc, g) => acc + (Number(g.total) || 0), 0);
    if (!total) {
        progresoFacturaPrepagada.classList.add('d-none');
        progresoFacturaPrepagada.innerHTML = '';
        return;
    }
    progresoFacturaPrepagada.classList.remove('d-none');
    progresoFacturaPrepagada.innerHTML = `
        <span class="rips-factura-progress-label">Factura</span>
        ${badgeProgresoHc(relacionados, total)}
    `;
}

function sortKeyDerecho(item, key) {
    if (key === 'idRips') return Number(item.idEveRips ?? item.idEvaluacion) || 0;
    if (key === 'realizadoPor') return item.nombreUsuario || item.TipoEvaluacion || '';
    if (key === 'fecha') return parseFechaItemRips(item) || new Date(0);
    return '';
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
    ripsUiState.rightRows = [];
    ripsUiState.rightModo = null;
    ripsUiState.selectedLeftKey = null;
    ripsUiState.selectedLeftData = null;
    ripsUiState.expandedPatientKey = null;
    if (tablaPanelIzquierdo) tablaPanelIzquierdo.innerHTML = '';
    if (emptyPanelIzquierdo) emptyPanelIzquierdo.classList.add('d-none');
    actualizarProgresoFacturaPrepagada([]);
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
            ? 'Pacientes en factura (agrupados)'
            : 'Facturas del rango';
    }
    if (tituloPanelDerecho) {
        tituloPanelDerecho.textContent = prepagada
            ? 'Historias clínicas RIPS (últimos 4 meses)'
            : 'Historias clínicas RIPS pendientes (últimos 4 meses)';
    }
    ripsUiState.sortLeft = { col: null, dir: 1 };
    ripsUiState.sortRight = { col: null, dir: 1 };
    paintTheadIzquierdo();
    paintTheadDerecho();
    clearPanels();
}

function rowMatchesFilter(text) {
    const q = (ripsUiState.filterText || '').trim().toLowerCase();
    if (!q) return true;
    return String(text || '').toLowerCase().includes(q);
}

function renderPanelIzquierdoParticular(facturas) {
    ripsUiState.leftRows = Array.isArray(facturas) ? facturas : [];
    if (!tablaPanelIzquierdo) return;
    paintTheadIzquierdo();
    tablaPanelIzquierdo.innerHTML = '';

    let visibles = ripsUiState.leftRows.filter((f) => {
        const blob = `${f.idFactura} ${f.nombrePaciente} ${f.documentoPaciente} ${f.prefijo} ${f.noFactura}`;
        return rowMatchesFilter(blob);
    });

    const { col, dir } = ripsUiState.sortLeft;
    if (col) {
        visibles = [...visibles].sort((a, b) =>
            dir * compareSortValues(sortKeyIzquierdoParticular(a, col), sortKeyIzquierdoParticular(b, col))
        );
    }

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

function markSelectedLeftRow(key) {
    ripsUiState.selectedLeftKey = key;
    if (!tablaPanelIzquierdo) return;
    const selectedGroupKey = (() => {
        if (ripsUiState.expandedPatientKey) return ripsUiState.expandedPatientKey;
        if (ripsUiState.selectedLeftData?.DocumentoPaciente != null) {
            return `grp-${ripsUiState.selectedLeftData.DocumentoPaciente}|${ripsUiState.selectedLeftData.DocumentoEps || ''}`;
        }
        return null;
    })();
    tablaPanelIzquierdo.querySelectorAll('tr').forEach((tr) => {
        const isChild = tr.dataset.rowKey && tr.dataset.rowKey === key;
        const isGroup =
            tr.classList.contains('rips-group-row') &&
            selectedGroupKey &&
            tr.dataset.groupKey === selectedGroupKey;
        tr.classList.toggle('cr-row-selected', Boolean(isChild || isGroup));
    });
}

function renderPanelIzquierdoPrepagada(pacientes) {
    ripsUiState.leftRows = Array.isArray(pacientes) ? pacientes : [];
    if (!tablaPanelIzquierdo) return;
    paintTheadIzquierdo();
    tablaPanelIzquierdo.innerHTML = '';

    let visibles = ripsUiState.leftRows.filter((p) => {
        const blob = `${p.NombrePaciente} ${p.DocumentoPaciente} ${p.Idtratamiento}`;
        return rowMatchesFilter(blob);
    });

    let grupos = agruparPacientesPrepagada(visibles);
    const { col, dir } = ripsUiState.sortLeft;
    if (col) {
        grupos = [...grupos].sort((a, b) =>
            dir * compareSortValues(sortKeyGrupoPrepagada(a, col), sortKeyGrupoPrepagada(b, col))
        );
    }

    if (!grupos.length) {
        if (emptyPanelIzquierdo) emptyPanelIzquierdo.classList.remove('d-none');
        actualizarProgresoFacturaPrepagada([]);
        return;
    }
    if (emptyPanelIzquierdo) emptyPanelIzquierdo.classList.add('d-none');
    actualizarProgresoFacturaPrepagada(grupos);

    grupos.forEach((grupo) => {
        const expanded = ripsUiState.expandedPatientKey === grupo.key;
        const trGroup = document.createElement('tr');
        trGroup.className = 'rips-group-row';
        trGroup.dataset.groupKey = grupo.key;
        trGroup.dataset.modo = 'prepagada-group';
        if (expanded) trGroup.classList.add('rips-group-expanded');

        const chevron = expanded ? '▼' : '▶';
        trGroup.innerHTML = `
            <td>
                <span class="rips-group-chevron" aria-hidden="true">${chevron}</span>
                <strong>${grupo.nombre}</strong>
                <div class="small text-muted">${grupo.total} tratamiento${grupo.total === 1 ? '' : 's'}</div>
            </td>
            <td>${grupo.DocumentoPaciente || '—'}</td>
            <td>${badgeProgresoHc(grupo.relacionados, grupo.total)}</td>
        `;
        trGroup.addEventListener('click', () => {
            const wasExpanded = ripsUiState.expandedPatientKey === grupo.key;
            ripsUiState.expandedPatientKey = wasExpanded ? null : grupo.key;
            if (!wasExpanded) {
                ripsUiState.selectedLeftKey = null;
                ripsUiState.selectedLeftData = null;
                clearPanelDerecho('Seleccione un tratamiento del paciente para ver sus RIPS.');
            }
            renderPanelIzquierdoPrepagada(ripsUiState.leftRows);
            markSelectedLeftRow(ripsUiState.selectedLeftKey);
        });
        tablaPanelIzquierdo.appendChild(trGroup);

        if (!expanded) return;

        // Relacionados primero, luego pendientes
        const ordenados = [...grupo.tratamientos].sort((a, b) => {
            const ar = esTratamientoRelacionado(a) ? 1 : 0;
            const br = esTratamientoRelacionado(b) ? 1 : 0;
            if (ar !== br) return ar - br; // no relacionados primero (prioridad para relacionar)
            return String(extraerNroPres(a)).localeCompare(String(extraerNroPres(b)), 'es', { numeric: true });
        });

        ordenados.forEach((p) => {
            const key = `${p.DocumentoPaciente}|${p.DocumentoEps}|${p.Idtratamiento}`;
            const tr = document.createElement('tr');
            tr.className = 'rips-child-row';
            tr.dataset.rowKey = key;
            tr.dataset.groupKey = grupo.key;
            tr.dataset.modo = 'prepagada';
            if (ripsUiState.selectedLeftKey === key) tr.classList.add('cr-row-selected');

            const relacionado = esTratamientoRelacionado(p);
            const estadoTxt = relacionado ? 'Relacionado' : 'Sin HC relacionada';
            const estadoCls = relacionado ? 'rips-child-ok' : 'rips-child-pending';
            tr.innerHTML = `
                <td class="rips-child-cell">
                    <span class="rips-child-indent">↳</span>
                    Pres ${extraerNroPres(p)}
                    <small class="text-muted"> · Id ${p.Idtratamiento ?? '—'}</small>
                </td>
                <td class="rips-child-cell">${p.DocumentoPaciente || '—'}</td>
                <td class="rips-child-cell"><span class="${estadoCls}">${estadoTxt}</span></td>
            `;
            tr.addEventListener('click', (ev) => {
                ev.stopPropagation();
                onLeftRowClickPrepagada(p, key);
            });
            tablaPanelIzquierdo.appendChild(tr);
        });
    });

    markSelectedLeftRow(ripsUiState.selectedLeftKey);
}

function renderPanelDerechoRips(items, modo, opts = {}) {
    if (!tablaPanelDerecho) return;
    const fuente = Array.isArray(items) ? items : [];
    const filtrados = opts.alreadyFiltered ? fuente : filtrarRipsUltimosMeses(fuente);
    ripsUiState.rightRows = filtrados;
    ripsUiState.rightModo = modo || null;

    paintTheadDerecho();
    tablaPanelDerecho.innerHTML = '';

    let list = [...filtrados];
    const { col, dir } = ripsUiState.sortRight;
    if (col) {
        list.sort((a, b) =>
            dir * compareSortValues(sortKeyDerecho(a, col), sortKeyDerecho(b, col))
        );
    }

    if (!list.length) {
        const huboSinFiltro = fuente.length > 0 && filtrados.length === 0 && !opts.alreadyFiltered;
        clearPanelDerecho(
            huboSinFiltro
                ? 'No hay historias clínicas RIPS de los últimos 4 meses para esta selección.'
                : 'No hay historias clínicas RIPS para esta selección.'
        );
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
    ripsUiState.expandedPatientKey = `grp-${paciente.DocumentoPaciente}|${paciente.DocumentoEps || ''}`;
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
            document.querySelector('#TopbarUserName')
                ? (document.querySelector('#TopbarUserName').textContent = user.username)
                : (document.querySelector('#nombreUsuarioLink') && (document.querySelector('#nombreUsuarioLink').textContent = `Hola, ${user.username}`));
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
document.getElementById('closeSesion')?.addEventListener('click', logout);

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

const PREFIJO_BATCH_TODO = 'RIPS'; // legacy; el todo-en-uno ya no usa carpeta RIPS fija

function normalizarFacturaXmlTodo(f) {
    return {
        NoFactura: String(f.NoFactura != null ? f.NoFactura : (f.factura != null ? f.factura : '')),
        Prefijo: f.Prefijo || f.prefijo || '',
        FechaFactura: f.FechaFactura || f.fechaFactura || '',
        estado: f.estado || f.Estado || 'Desconocido',
        filePath: f.filePath || '',
        batchFolder: f.batchFolder || '',
        batchFolders: Array.isArray(f.batchFolders) ? f.batchFolders : (f.batchFolder ? [f.batchFolder] : []),
    };
}

function abrirProgresoTodoEnUno() {
    Swal.fire({
        title: 'Descargar RIPS (todo en uno)',
        html: `
            <div id="todoProgFase" style="font-weight:700;margin-bottom:8px;color:#fff;">Iniciando...</div>
            <div style="background:rgba(255,255,255,0.15);border-radius:8px;height:12px;overflow:hidden;margin-bottom:8px;">
                <div id="todoProgBar" style="height:100%;width:0%;background:#2ecc71;transition:width .25s ease;"></div>
            </div>
            <div id="todoProgCuenta" style="font-size:0.9rem;margin-bottom:6px;color:#fff;">0 / 0</div>
            <div id="todoProgActual" style="font-size:0.95rem;margin-bottom:10px;color:#fff;">Preparando...</div>
            <div id="todoProgLog" style="max-height:240px;overflow:auto;text-align:left;font-size:12px;background:rgba(0,0,0,0.25);border-radius:8px;padding:8px;color:#fff;"></div>
        `,
        width: '640px',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        showCancelButton: false,
        didOpen: () => {
            const popup = Swal.getPopup();
            if (popup) popup.style.width = '640px';
        },
    });
}

function actualizarProgresoTodoEnUno({ fase, index, total, actual, logLine, logOk }) {
    const elFase = document.getElementById('todoProgFase');
    const elBar = document.getElementById('todoProgBar');
    const elCuenta = document.getElementById('todoProgCuenta');
    const elActual = document.getElementById('todoProgActual');
    const elLog = document.getElementById('todoProgLog');

    if (fase && elFase) elFase.textContent = fase;
    if (typeof total === 'number' && typeof index === 'number') {
        const pct = total > 0 ? Math.min(100, Math.round((index / total) * 100)) : 0;
        if (elBar) elBar.style.width = `${pct}%`;
        if (elCuenta) elCuenta.textContent = `${index} / ${total}`;
    }
    if (actual && elActual) elActual.textContent = actual;
    if (logLine && elLog) {
        const color = logOk === false ? '#ff8a80' : (logOk === true ? '#69f0ae' : '#fff');
        const row = document.createElement('div');
        row.style.color = color;
        row.style.marginBottom = '4px';
        row.textContent = logLine;
        elLog.prepend(row);
    }
}

async function leerNdjsonStream(response, onEvent) {
    if (!response.body || !response.body.getReader) {
        const text = await response.text();
        for (const line of text.split('\n')) {
            if (!line.trim()) continue;
            onEvent(JSON.parse(line));
        }
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                onEvent(JSON.parse(line));
            } catch (e) {
                console.warn('Línea NDJSON inválida:', line, e);
            }
        }
    }
    if (buffer.trim()) {
        try {
            onEvent(JSON.parse(buffer));
        } catch (_) { /* ignore */ }
    }
}

async function DescargarXmlsSinPrefijo(fechaInicio, fechaFin) {
    const Facturador = await BuscarFacturador();
    const esFenalco = Facturador === 'Fenalco' || Facturador === 'fenalco';
    const pathSegment = esFenalco
        ? 'descargarxmls-stream-fenalco-sin-prefijo'
        : 'descargarxmls-stream-facturatech-sin-prefijo';

    actualizarProgresoTodoEnUno({
        fase: `1/3 Descargando XMLs (${esFenalco ? 'Fenalco' : 'Facturatech'})`,
        actual: 'Consultando facturas relacionadas...',
        index: 0,
        total: 0,
    });

    const response = await fetch(
        `${window.getApiBaseUrl()}/XMLS/${pathSegment}/${fechaInicio}/${fechaFin}/${documentoEmpresaSeleccionada}`,
        { method: 'POST' }
    );

    if (!response.ok && !String(response.headers.get('content-type') || '').includes('ndjson')) {
        let data = null;
        try { data = await response.json(); } catch (_) { /* ignore */ }
        return {
            ok: false,
            status: response.status,
            facturador: esFenalco ? 'Fenalco' : 'Facturatech',
            message: (data && (data.message || data.error)) || `Error HTTP ${response.status}`,
            facturas: [],
            batchFolders: [],
        };
    }

    let donePayload = null;
    let streamError = null;
    let batchFolders = [];
    const facturas = [];

    await leerNdjsonStream(response, (ev) => {
        if (ev.type === 'start') {
            batchFolders = Array.isArray(ev.batchFolders) ? ev.batchFolders : [];
            actualizarProgresoTodoEnUno({
                fase: `1/3 Descargando XMLs (${ev.facturador || Facturador})`,
                index: 0,
                total: ev.total || 0,
                actual: `Encontradas ${ev.total || 0} facturas`,
                logLine: `Inicio: ${ev.total || 0} facturas (carpetas por prefijo)`,
            });
        } else if (ev.type === 'progress') {
            actualizarProgresoTodoEnUno({
                index: ev.index,
                total: ev.total,
                actual: ev.mensaje || `Procesando ${ev.Prefijo || ''}${ev.NoFactura || ''}...`,
            });
        } else if (ev.type === 'factura') {
            const row = normalizarFacturaXmlTodo(ev);
            facturas.push(row);
            if (row.batchFolder && !batchFolders.includes(row.batchFolder)) {
                batchFolders.push(row.batchFolder);
            }
            if (Array.isArray(row.batchFolders)) {
                row.batchFolders.forEach((bf) => {
                    if (bf && !batchFolders.includes(bf)) batchFolders.push(bf);
                });
            }
            const ok = /exitos|ya existe/i.test(row.estado || '');
            actualizarProgresoTodoEnUno({
                index: ev.index,
                total: ev.total,
                actual: `${row.Prefijo || ''}${row.NoFactura}: ${row.estado}`,
                logLine: `${ev.index}/${ev.total} ${row.Prefijo || ''}${row.NoFactura} → ${row.estado}${row.batchFolder ? ` [${row.batchFolder}]` : ''}`,
                logOk: ok,
            });
        } else if (ev.type === 'done') {
            donePayload = ev;
            if (Array.isArray(ev.batchFolders) && ev.batchFolders.length) {
                batchFolders = ev.batchFolders;
            }
            const list = Array.isArray(ev.facturas) ? ev.facturas.map(normalizarFacturaXmlTodo) : facturas;
            facturas.length = 0;
            facturas.push(...list);
        } else if (ev.type === 'error') {
            streamError = ev.message || 'Error en descarga XML';
            actualizarProgresoTodoEnUno({
                actual: streamError,
                logLine: streamError,
                logOk: false,
            });
        }
    });

    if (streamError && facturas.length === 0) {
        return {
            ok: false,
            status: 404,
            facturador: esFenalco ? 'Fenalco' : 'Facturatech',
            message: streamError,
            facturas,
            batchFolders,
        };
    }

    return {
        ok: !streamError,
        status: 200,
        facturador: esFenalco ? 'Fenalco' : 'Facturatech',
        message: donePayload?.message || (streamError || 'Proceso finalizado'),
        facturas,
        batchFolders,
    };
}

async function GenerarJsonBatchRipsTodo(fechaInicio, fechaFin) {
    const placeholderResolucion = 'TODO';
    const base = window.getApiBaseUrl();
    const doc = documentoEmpresaSeleccionada;

    actualizarProgresoTodoEnUno({
        fase: '2/3 Generando RIPS JSON (EPS + Particulares)',
        actual: 'Consultando RIPS EPS...',
        index: 0,
        total: 3,
        logLine: 'Iniciando flujo EPS...',
    });

    let dataEps = [];
    let dataPart = [];
    const errores = [];

    try {
        const responseEps = await fetch(
            `${base}/RIPS/usuarios/rips/${fechaInicio}/${fechaFin}/${placeholderResolucion}/${doc}`
        );
        if (!responseEps.ok) {
            throw new Error(`EPS HTTP ${responseEps.status} - ${responseEps.statusText}`);
        }
        const raw = await responseEps.json();
        dataEps = Array.isArray(raw) ? raw : [];
        actualizarProgresoTodoEnUno({
            index: 1,
            total: 3,
            actual: `EPS OK (${dataEps.length} registros). Consultando Particulares...`,
            logLine: `EPS: ${dataEps.length} registros`,
            logOk: true,
        });
    } catch (err) {
        console.error('Error JSON EPS (todo en uno):', err);
        errores.push(`EPS: ${err.message || err}`);
        actualizarProgresoTodoEnUno({
            index: 1,
            total: 3,
            actual: `EPS falló. Continuando con Particulares...`,
            logLine: `EPS error: ${err.message || err}`,
            logOk: false,
        });
    }

    try {
        const responsePart = await fetch(
            `${base}/RIPS/usuarios/ripsParticular/${fechaInicio}/${fechaFin}/${placeholderResolucion}/${doc}`
        );
        if (!responsePart.ok) {
            throw new Error(`Particulares HTTP ${responsePart.status} - ${responsePart.statusText}`);
        }
        const raw = await responsePart.json();
        dataPart = Array.isArray(raw) ? raw : [];
        actualizarProgresoTodoEnUno({
            index: 2,
            total: 3,
            actual: `Particulares OK (${dataPart.length} registros). Generando ZIP...`,
            logLine: `Particulares: ${dataPart.length} registros`,
            logOk: true,
        });
    } catch (err) {
        console.error('Error JSON Particulares (todo en uno):', err);
        errores.push(`Particulares: ${err.message || err}`);
        actualizarProgresoTodoEnUno({
            index: 2,
            total: 3,
            actual: `Particulares falló.`,
            logLine: `Particulares error: ${err.message || err}`,
            logOk: false,
        });
    }

    const data = [...dataEps, ...dataPart];
    if (data.length === 0) {
        const err = new Error(
            errores.length
                ? `Sin datos JSON. ${errores.join(' | ')}`
                : 'Sin datos JSON EPS ni Particulares en el rango.'
        );
        err.partialErrors = errores;
        throw err;
    }

    actualizarProgresoTodoEnUno({
        actual: `EPS (${dataEps.length}) + Particulares (${dataPart.length}). Generando carpetas separadas...`,
        logLine: `EPS ${dataEps.length} | PARTICULAR ${dataPart.length}`,
        logOk: true,
    });

    const zipResponse = await fetch(
        `${base}/RIPS/generar-zip-todo-en-uno/${fechaInicio}/${fechaFin}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eps: dataEps, particulares: dataPart }),
        }
    );

    if (!zipResponse.ok) {
        const err = new Error(`Error al generar JSON por prefijo: ${zipResponse.status} - ${zipResponse.statusText}`);
        err.status = zipResponse.status;
        err.partialErrors = errores;
        throw err;
    }

    const zipData = await zipResponse.json();
    const folders = Array.isArray(zipData?.batchFolders) ? zipData.batchFolders : [];
    actualizarProgresoTodoEnUno({
        index: 3,
        total: 3,
        actual: `JSON separado listo (${folders.length} carpeta(s) EPS/PARTICULAR)`,
        logLine: `JSON OK → ${folders.join(', ') || 'sin carpetas'}${errores.length ? ` (parcial: ${errores.join('; ')})` : ''}`,
        logOk: errores.length === 0,
    });

    return {
        ...zipData,
        batchFolders: folders,
        conteoEps: dataEps.length,
        conteoParticulares: dataPart.length,
        conteoTotal: data.length,
        partialErrors: errores,
    };
}

/** @deprecated alias — usar GenerarJsonBatchRipsTodo */
async function GenerarJsonEpsBatchRips(fechaInicio, fechaFin) {
    return GenerarJsonBatchRipsTodo(fechaInicio, fechaFin);
}

async function CerrarEstadoTodoEnUno(fechaInicio, fechaFin, { facturas, xmlError, jsonError, batchFolders }) {
    actualizarProgresoTodoEnUno({
        fase: '3/3 Empaquetando XML + JSON',
        actual: 'Juntando archivos en ARCHIVOS_DE_ENVIO (JSON lote + XML carpeta empresa)...',
        index: 1,
        total: 1,
        logLine: `Empaquetando: ${(batchFolders || []).join(', ') || 'descubrir carpetas'}`,
    });

    const response = await fetch(
        `${window.getApiBaseUrl()}/RIPS/cerrar-todo-en-uno/${fechaInicio}/${fechaFin}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                facturas,
                xmlError,
                jsonError,
                batchFolders,
                documentoEmpresa: documentoEmpresaSeleccionada || sessionStorage.getItem('empresaTrabajarExecuted') || '',
            }),
        }
    );

    let data = null;
    try {
        data = await response.json();
    } catch (_) {
        data = null;
    }

    if (!response.ok) {
        throw new Error((data && (data.message || data.error)) || `Error HTTP ${response.status}`);
    }

    actualizarProgresoTodoEnUno({
        actual: 'Empaquetado listo. Preparando resumen...',
        logLine: `Resumen: XML ${data?.resumen?.xmlOk ?? 0} / JSON ${data?.resumen?.jsonOk ?? 0} / Juntados ${data?.resumen?.empaquetadoOk ?? 0}`,
        logOk: true,
    });

    return data;
}

function MostrarResultadosTodoEnUno(estado) {
    const carpetas = (Array.isArray(estado?.batchFolders) && estado.batchFolders.length)
        ? estado.batchFolders
        : String(estado?.batchFolder || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

    const listaCarpetas = carpetas.length
        ? `<div style="margin:12px auto 0;max-width:560px;">
            ${carpetas.map((c) => `
                <div style="margin-bottom:8px;">
                    <code style="font-size:0.9rem;word-break:break-word;">ARCHIVOS_DE_ENVIO\\REPORTE (${c})</code>
                </div>
            `).join('')}
           </div>`
        : `<p style="margin-top:12px;"><code>ARCHIVOS_DE_ENVIO</code></p>`;

    const huboError = !!(estado?.xmlErrorGlobal || estado?.jsonErrorGlobal || estado?.empaquetadoError);

    Swal.fire({
        icon: huboError ? 'warning' : 'success',
        title: huboError ? 'Proceso finalizado con alertas' : 'Proceso finalizado',
        html: `
            <div style="text-align:center;">
                <p style="margin:0.5rem 0 0;font-size:1.05rem;">
                    Ya puede validar los archivos en la carpeta correspondiente:
                </p>
                ${listaCarpetas}
                <p style="margin:14px 0 0;font-size:0.9rem;opacity:0.9;">
                    Revise dentro de <b>CON_FACTURA</b> (y <b>SIN_FACTURA</b> si aplica).
                </p>
                ${estado?.xmlErrorGlobal ? `<p style="margin-top:10px;color:#ff8a80;font-size:0.85rem;">XML: ${estado.xmlErrorGlobal}</p>` : ''}
                ${estado?.jsonErrorGlobal ? `<p style="margin-top:6px;color:#ff8a80;font-size:0.85rem;">JSON: ${estado.jsonErrorGlobal}</p>` : ''}
                ${estado?.empaquetadoError ? `<p style="margin-top:6px;color:#ff8a80;font-size:0.85rem;">Empaquetado: ${estado.empaquetadoError}</p>` : ''}
            </div>
        `,
        width: '640px',
        showCloseButton: true,
        confirmButtonText: 'Aceptar',
        allowOutsideClick: true,
        allowEscapeKey: true,
    });
}

async function DescargarRipsTodoEnUno() {
    const fechaInicio = document.getElementById('fechaInicioTodo')?.value;
    const fechaFin = document.getElementById('fechaFinTodo')?.value;

    const faltantes = [];
    if (!fechaInicio) faltantes.push('Fecha Inicio.');
    if (!fechaFin) faltantes.push('Fecha Fin.');
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
        faltantes.push('La fecha inicial no puede ser mayor que la fecha final.');
    }
    if (!documentoEmpresaSeleccionada) {
        faltantes.push('Empresa de trabajo (sesión).');
    }

    if (faltantes.length > 0) {
        Swal.fire({
            icon: 'info',
            html: `
                <h5 style="color: #ffffff"><b>Los siguientes campos son necesarios:</b></h5>
                <br>
                <ul style="color: #FFFFFF; text-align: left;">
                    ${faltantes.map((c) => `<li style="color: #FFFFFF;">${c}</li>`).join('')}
                </ul>
            `,
        });
        return;
    }

    localStorage.setItem('fechaInicio', fechaInicio);
    localStorage.setItem('fechaFin', fechaFin);

    let xmlResult = { ok: false, facturas: [], message: '', facturador: '', batchFolders: [] };
    let xmlError = null;
    let jsonError = null;
    let batchFolders = [];

    abrirProgresoTodoEnUno();

    try {
        xmlResult = await DescargarXmlsSinPrefijo(fechaInicio, fechaFin);
        batchFolders = xmlResult.batchFolders || [];
        if (!xmlResult.ok) {
            xmlError = xmlResult.message || 'Error al descargar XMLs';
        }
    } catch (err) {
        console.error('Error en descarga XML (todo en uno):', err);
        xmlError = err.message || 'Error inesperado en XML';
        xmlResult = { ok: false, facturas: [], message: xmlError, facturador: '', batchFolders: [] };
        actualizarProgresoTodoEnUno({ actual: xmlError, logLine: xmlError, logOk: false });
    }

    try {
        const zipInfo = await GenerarJsonBatchRipsTodo(fechaInicio, fechaFin);
        if (Array.isArray(zipInfo?.batchFolders) && zipInfo.batchFolders.length) {
            const merged = new Set([...(batchFolders || []), ...zipInfo.batchFolders]);
            batchFolders = [...merged];
        }
        if (Array.isArray(zipInfo?.partialErrors) && zipInfo.partialErrors.length) {
            jsonError = `Parcial: ${zipInfo.partialErrors.join(' | ')}`;
        }
    } catch (err) {
        console.error('Error generando JSON (todo en uno):', err);
        jsonError = err.message || 'Error inesperado en JSON';
        actualizarProgresoTodoEnUno({ actual: jsonError, logLine: jsonError, logOk: false });
    }

    try {
        const estado = await CerrarEstadoTodoEnUno(fechaInicio, fechaFin, {
            facturas: xmlResult.facturas || [],
            xmlError,
            jsonError,
            batchFolders,
        });
        MostrarResultadosTodoEnUno(estado);
    } catch (err) {
        console.error('Error cerrando estado todo en uno:', err);
        MostrarResultadosTodoEnUno({
            batchFolders,
            batchFolder: (batchFolders || []).join(', '),
            xmlErrorGlobal: xmlError,
            jsonErrorGlobal: jsonError || (err.message || 'Error al cerrar el proceso'),
        });
    }
}

document.getElementById('btnDescargarRipsTodo')?.addEventListener('click', () => {
    DescargarRipsTodoEnUno();
});

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

'use strict';

const PDFDocument = require('pdfkit');

const str = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);

function fmtDateTime(v) {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-CO', { hour12: false });
}

function fmtDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO');
}

function nombrePaciente(pdem) {
    if (!pdem || typeof pdem !== 'object') return '—';
    const parts = [
        pdem.PrimerNombreBase,
        pdem.SegundoNombreBase,
        pdem.PrimerApellidoBase,
        pdem.SegundoApellidoBase,
    ].filter((x) => x != null && String(x).trim() !== '');
    return parts.length ? parts.join(' ') : '—';
}

function paragraph(doc, title, lines) {
    doc.fontSize(11).fillColor('#111').text(title, { underline: true });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#000');
    if (!lines || !lines.length) {
        doc.text('— Sin información registrada.');
    } else {
        lines.forEach((ln) => {
            doc.text(ln, { align: 'left' });
        });
    }
    doc.moveDown(0.6);
}

/**
 * Genera PDF del resumen clínico (sin contraseña ni cifrado).
 * @param {object} aggregate Resultado de loadRdaceAggregate + nombreIpsDisplay opcional
 * @param {{ idEvaluacion?: number }} opts
 * @returns {Promise<Buffer>}
 */
function buildRdaceResumenClinicoPdfBuffer(aggregate, opts = {}) {
    const {
        head,
        pdem,
        diagRelacionados,
        medPrescripciones,
        procPrescripciones,
        otrasTecnologias,
        antecedentesSalud,
        antecedentesFamiliares,
        antecedentesFarmacologicos,
    } = aggregate;
    const idEval = opts.idEvaluacion;
    const codPrest = str(head.CodigoPrestador);
    const nombreIps = str(aggregate.nombreIpsDisplay) || (codPrest ? `IPS (${codPrest})` : '—');
    const nitIps = str(aggregate.nitIpsOverride) || '—';

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 48,
            autoFirstPage: true,
            info: {
                Title: 'Resumen clínico — Consulta externa (RDA)',
                Author: nombreIps !== '—' ? nombreIps : 'Prestador',
                Subject: 'Resumen clínico atención consulta externa',
            },
        });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(15).text('Resumen clínico — Consulta externa (RDA)', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(8).fillColor('#444').text(
            'Documento generado a partir del Resumen Digital de Atención (Resolución 1888). '
            + 'Referencia normativa: Decreto 780 de 2016, art. 2.6.1.4.3.6 y numerales afines sobre epicrisis / resumen clínico. '
            + 'Este archivo no tiene contraseña.',
            { align: 'justify' },
        );
        doc.fillColor('#000');
        doc.moveDown();

        doc.fontSize(10);
        doc.text(`Id registro RDACE: ${idEval != null ? idEval : '—'}   |   Fecha de elaboración del PDF: ${fmtDateTime(new Date())}`);
        doc.text(`Nombre archivo sugerido: ${str(head.NombreDocumentoPDF) || `RDA_CE_${str(head.DocumentoEntidad) || 'doc'}_${idEval || 'id'}.pdf`}`);
        doc.moveDown();

        paragraph(doc, '1. Datos de la institución y del encuentro', [
            `Prestador (REPS): ${codPrest || '—'}`,
            `Nombre IPS: ${nombreIps}`,
            `NIT IPS (si aplica): ${nitIps}`,
            `Administradora plan de beneficios: ${str(head.NombreAdminPlanBeneficios) || '—'} (código: ${str(head.CodigoAdminPlanBeneficios) || '—'})`,
            `Inicio atención: ${fmtDateTime(head.FechaHoraInicioAtencion)}   Fin: ${fmtDateTime(head.FechaHoraFinAtencion)}`,
            `Fecha RDA: ${fmtDateTime(head.FechaRDA)}`,
            `Modalidad atención: ${str(head.NombreModalidadAtencion) || str(head.CodigoModalidadAtencion) || '—'}`,
            `Grupo de servicios: ${str(head.NombreGrupoServicios) || str(head.CodigoGrupoServicios) || '—'}`,
            `Vía de ingreso del usuario: ${str(head.NombreViaIngreso) || str(head.CodigoViaIngreso) || '—'}`,
            `Causa / motivo de atención: ${str(head.NombreCausaMotivo) || str(head.CodigoCausaMotivo) || '—'}`,
            `Entorno de atención: ${str(head.EntornoAtencion) || '—'}`,
        ]);

        paragraph(doc, '2. Identificación del paciente', [
            `Tipo y número de documento: ${str(pdem.TipoDocumentoBase) || '—'} ${str(head.DocumentoEntidad) || '—'}`,
            `Nombre: ${nombrePaciente(pdem)}`,
            `Fecha de nacimiento: ${fmtDate(pdem.FechaNacimiento)}`,
            `Sexo registrado: ${str(pdem.Sexo) || str(pdem.CodigoSexo) || '—'}`,
            `Teléfono: ${str(pdem.TelefonoCelular) || '—'}`,
            `Municipio / dirección: ${str(pdem.NombreMunicipio) || '—'} — ${str(pdem.Direccion) || '—'}`,
        ]);

        paragraph(doc, '3. Profesional de salud (tratante)', [
            `Tipo documento: ${str(head.TipoDocProfesional) || '—'}`,
            `Número documento: ${str(head.NumDocProfesional) || '—'}`,
        ]);

        paragraph(doc, '4. Diagnósticos (CIE-10 / CIE-11)', [
            `Diagnóstico principal CIE-10: ${str(head.DiagPrincipalCIE10Codigo) || '—'} — ${str(head.DiagPrincipalCIE10Nombre) || '—'}`,
            `Tipo diagnóstico principal: ${str(head.TipoDiagnosticoPrincipal) || '—'}`,
            `Diagnóstico ingreso CIE-11: ${str(head.DiagnosticoIngresoCIE11Codigo) || '—'} — ${str(head.DiagnosticoIngresoCIE11Termino) || '—'}`,
            ...(diagRelacionados && diagRelacionados.length
                ? diagRelacionados.map((r, i) => `Relacionado ${i + 1}: CIE-10 ${str(r.CodigoCIE10) || '—'} ${str(r.NombreCIE10) || ''} | CIE-11 ${str(r.CodigoCIE11) || '—'} ${str(r.TerminoCIE11) || ''}`)
                : []),
        ]);

        paragraph(doc, '5. Alergias', [
            str(head.TipoAlergia) ? `Tipo de alergia (código): ${str(head.TipoAlergia)}` : '— Sin información registrada.',
        ]);

        paragraph(doc, '6. Antecedentes personales', [
            ...(antecedentesSalud && antecedentesSalud.length
                ? antecedentesSalud.map((a, i) => `Salud ${i + 1}: ${str(a.Descripcion) || '—'}`)
                : []),
            ...(antecedentesFamiliares && antecedentesFamiliares.length
                ? antecedentesFamiliares.map((a, i) => `Familiar ${i + 1} (${str(a.Parentesco) || '—'}): ${str(a.Descripcion) || '—'}`)
                : []),
            ...(antecedentesFarmacologicos && antecedentesFarmacologicos.length
                ? antecedentesFarmacologicos.map((a, i) => `Farmacológico ${i + 1}: ${str(a.Descripcion) || '—'}`)
                : []),
            ...(!antecedentesSalud?.length && !antecedentesFamiliares?.length && !antecedentesFarmacologicos?.length
                ? ['— Sin antecedentes registrados en el formulario RDACE.']
                : []),
        ]);

        paragraph(doc, '7. Factores de riesgo', [
            (str(head.TipoFactorRiesgo) || str(head.NombreFactorRiesgo))
                ? `Tipo: ${str(head.TipoFactorRiesgo) || '—'}   Descripción: ${str(head.NombreFactorRiesgo) || '—'}`
                : '— Sin información registrada.',
        ]);

        paragraph(doc, '8. Evolución clínica (narrativa)', [
            'No registrado en sistema: el formulario RDACE actual no incluye campo libre de evolución clínica.',
        ]);

        paragraph(doc, '9. Resultados paraclínicos', [
            'No registrado en sistema: no hay captura dedicada de laboratorios / imágenes en RDACE.',
        ]);

        const medLines = (medPrescripciones || []).map((m, i) => {
            const parts = [
                `Med. ${i + 1}: ${str(m.NombreMedicamento) || str(m.CodigoMedicamento) || '—'}`,
                `Código: ${str(m.CodigoMedicamento) || '—'}`,
                `DCI: ${str(m.DCI) || '—'}`,
                `Prescripción: ${fmtDateTime(m.FechaPrescripcion)}`,
                `Dosis: ${str(m.DosisOrdenada) || '—'} ${str(m.UnidadDosis) || ''}`,
                `Vía: ${str(m.ViaAdministracion) || '—'}`,
                `Duración: ${str(m.DuracionCantidad) || '—'} ${str(m.DuracionUnidad) || ''}`,
                `Frecuencia: ${str(m.FrecuenciaCantidad) || '—'} / ${str(m.FrecuenciaUnidad) || ''}`,
                `Finalidad: ${str(m.Finalidad) || '—'}`,
            ];
            return parts.join(' | ');
        });
        paragraph(doc, '10. Medicamentos prescritos / ordenados', medLines);

        const procLines = (procPrescripciones || []).map((p, i) => `Proc. ${i + 1}: ${str(p.CodigoProcedimiento) || '—'} ${str(p.NombreProcedimiento) || ''} | Finalidad ${str(p.Finalidad) || '—'} | ${fmtDateTime(p.FechaPrescripcion)}`);
        paragraph(doc, '11. Procedimientos y órdenes (CUPS)', procLines);

        const otraLines = (otrasTecnologias || []).map((o, i) => `Otra tecnología ${i + 1}: ${str(o.Codigo) || '—'} ${str(o.Nombre) || ''} | Finalidad ${str(o.Finalidad) || '—'} | ${fmtDateTime(o.FechaPrescripcion)}`);
        paragraph(doc, '12. Otras tecnologías en salud', otraLines);

        paragraph(doc, '13. Plan de manejo y recomendaciones (texto libre)', [
            'No registrado en sistema: use órdenes y prescripciones anteriores como referencia del plan terapéutico estructurado.',
        ]);

        paragraph(doc, '14. Incapacidad y licencia', [
            `Alcance incapacidad: ${str(head.AlcanceIncapacidad) || '—'}`,
            `Días incapacidad: ${head.DiasIncapacidad != null ? String(head.DiasIncapacidad) : '—'}`,
            `Días licencia maternidad: ${head.DiasLicenciaMaternidad != null ? String(head.DiasLicenciaMaternidad) : '—'}`,
        ]);

        paragraph(doc, '15. Condición y destino al egreso', [
            `Condición / destino al egreso: ${str(head.CondicionDestinoEgreso) || '—'}`,
            `Código prestador remite / refiere: ${str(head.CodigoPrestadorRemite) || '—'}`,
        ]);

        doc.fontSize(9).fillColor('#333').text(
            'El contenido refleja los datos capturados en el módulo RDA Consulta Externa del relacionador. '
            + 'Para cumplimiento legal estricto puede requerirse ampliar el formulario con narrativas clínicas adicionales.',
            { align: 'justify' },
        );

        doc.end();
    });
}

module.exports = { buildRdaceResumenClinicoPdfBuffer };

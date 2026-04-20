# Matriz: resumen clínico PDF (RDACE) vs Decreto 780 de 2016

Referencia normativa: **Decreto 780 de 2016** (Decreto Único Reglamentario del Sector Salud), **artículo 2.6.1.4.3.6** y contexto en **2.6.1.4.3.5**, en la parte relativa a **epicrisis o resumen clínico** como soporte en procesos de atención/reclamación (texto consolidado: [MinSalud — Decreto 780](https://www.minsalud.gov.co/Normativa/Paginas/decreto-unico-minsalud-780-de-2016.aspx)).

> Nota: el articulado exacto debe contrastarse con la versión oficial vigente. Este documento orienta el **diseño del PDF** frente a los datos que el relacionador **sí captura hoy** en RDA Consulta Externa.

## Requisitos típicos de un resumen clínico / epicrisis (consulta externa)

| Tema normativo (resumen) | Sección en PDF generado | Fuente en RDACE / sistema | Vacío posible |
|--------------------------|-------------------------|---------------------------|---------------|
| Identificación del paciente | Datos del paciente | `[Cnsta Relacionador Usuarios Info]` vía `Documento Entidad` | Si falta registro en vista |
| Prestador / profesional | IPS y profesional tratante | Cabecera: código prestador; tipo/num doc profesional; env `IHCE_RDACE_DEFAULT_*` | Nombre IPS si no hay override |
| Fechas y modalidad de atención | Encuentro | `FechaHoraInicio/Fin`, catálogos modalidad, grupo, vía ingreso, causa motivo | Parcial |
| Diagnóstico principal y relacionados | Diagnósticos | CIE-10 principal, CIE-11 ingreso, tabla diagnósticos relacionados | Sí |
| Alergias | Alergias | `Tipo Alergia` | Sí |
| Antecedentes | Antecedentes personales | Tablas CE antecedentes salud, familiares, farmacológicos | Sí |
| Factores de riesgo | Factores de riesgo | Tipo y nombre factor | Sí |
| Evolución clínica narrativa | Evolución / estado actual | **No hay campo libre en formulario RDACE** | **Siempre “No registrado en sistema”** hasta v2 |
| Procedimientos / órdenes | Procedimientos y otras tecnologías | Prescripción procedimientos, otras tecnologías | Sí |
| Medicamentos prescritos | Prescripción actual | Prescripción medicamentos | Sí |
| Estudios paraclínicos | Resultados paraclínicos | **No hay campo dedicado** | **“No registrado en sistema”** |
| Plan de manejo y recomendaciones | Plan y recomendaciones | **No hay campo dedicado** (órdenes parcialmente sustituyen) | **“No registrado en sistema”** |
| Incapacidad / licencia | Incapacidad (SIPE) | Alcance, días incapacidad, días licencia maternidad | Sí |
| Condición al egreso | Egreso | Condición destino egreso, código prestador remite | Sí |
| Firma / responsable | Identificación del profesional | Doc profesional (firma manuscrita no digital en v1) | Metadatos solo |

## Versión 2 (si auditoría legal lo exige)

Campos narrativos `NVARCHAR(MAX)` + inputs en `#SeccionRDAConsultaExterna` para: evolución, paraclínicos, plan/recomendaciones; validación obligatoria antes de generar PDF o enviar a IHCE.

## IHCE y tamaño del adjunto PDF

- El bundle incluye el PDF en `DocumentReference.content[0].attachment.data` (base64). PDFs muy grandes aumentan el cuerpo JSON y pueden afectar **timeouts** de cliente/proxy o límites del servidor IHCE (umbrales exactos dependen del despliegue).
- Recomendación operativa: mantener el PDF **conciso** (listados tabulares, sin imágenes pesadas); si se superan límites conocidos en producción, valorar almacenamiento externo + URL firmada **solo si** el perfil IHCE lo permitiera (hoy el flujo usa `data`).

### Verificación en implementación

- `POST /apiV3/RdaConsultaExterna/FhirBundle` con `regenerarPdf: true` fuerza un PDF nuevo (útil tras cambiar datos y antes de reenviar).
- Si IHCE rechaza por tamaño, revisar logs del gateway; como mitigación temporal se podría omitir secciones repetitivas en `rdaceResumenPdf.js` (solo con aval clínico/legal).

'use strict';

/**
 * Carga cabecera RDA Paciente + tablas hijas activas (Id Estado = 1).
 * Para módulo de edición / corrección de pendientes.
 *
 * @param {import('mssql').ConnectionPool} pool
 * @param {import('mssql')} sql
 * @param {number} id
 */
async function loadRdaPacienteAggregate(pool, sql, id) {
    const main = await pool
        .request()
        .input('Id', sql.Int, id)
        .query(`
            SELECT
                r.[Id Evaluacion Entidad RDA] AS IdEvaluacionEntidadRDA,
                r.[Documento Entidad] AS DocumentoEntidad,
                r.[Fecha RDA] AS FechaRDA,
                r.[Id Tipo Documento] AS IdTipoDocumento,
                r.[Primer Apellido Entidad] AS PrimerApellidoEntidad,
                r.[Segundo Apellido Entidad] AS SegundoApellidoEntidad,
                r.[Primer Nombre Entidad] AS PrimerNombreEntidad,
                r.[Segundo Nombre Entidad] AS SegundoNombreEntidad,
                r.[Fecha Nacimiento] AS FechaNacimiento,
                r.[Edad] AS Edad,
                r.[Id Unidad de Medida Edad] AS IdUnidaddeMedidaEdad,
                r.[Id Sexo Biologico] AS IdSexoBiologico,
                r.[Id Identidad Genero] AS IdIdentidadGenero,
                r.[Id Pais Nacionalidad] AS IdPaisNacionalidad,
                r.[Talla] AS Talla,
                r.[Peso] AS Peso,
                r.[Id Pais Recidencia] AS IdPaisRecidencia,
                r.[Id Municipio Recidencia] AS IdMunicipioRecidencia,
                r.[Id Zona Residencia] AS IdZonaResidencia,
                r.[Dirección] AS Direccion,
                r.[Id Etnia] AS IdEtnia,
                r.[Comunidad Etnica] AS ComunidadEtnica,
                r.[Id Discapacidad] AS IdDiscapacidad,
                r.[Teléfono Celular] AS TelefonoCelular,
                r.[Alergeno] AS Alergeno,
                r.[Codigo Prestador] AS CodigoPrestador,
                r.[Codigo Admin Plan Beneficios] AS CodigoAdminPlanBeneficios,
                r.[Nombre Admin Plan Beneficios] AS NombreAdminPlanBeneficios,
                r.[Fecha Hora Inicio Atencion] AS FechaHoraInicioAtencion,
                r.[Fecha Hora Fin Atencion] AS FechaHoraFinAtencion,
                r.[Tipo Doc Profesional] AS TipoDocProfesional,
                r.[Num Doc Profesional] AS NumDocProfesional,
                r.[Diagnostico Ingreso CIE11 Codigo] AS DiagnosticoIngresoCIE11Codigo,
                r.[Diagnostico Ingreso CIE11 Termino] AS DiagnosticoIngresoCIE11Termino,
                r.[Tipo Alergia] AS TipoAlergia,
                r.[Id Modalidad Atencion] AS IdModalidadAtencion,
                r.[Id Grupo Servicios] AS IdGrupoServicios,
                r.[NIT Prestador IPS] AS NitPrestadorIPS,
                r.[Nombre Prestador IPS] AS NombrePrestadorIPS,
                r.[Enviado] AS Enviado,
                r.[Enviado pruebas] AS EnviadoPruebas
            FROM [dbo].[Evaluacion Entidad RDA] r
            WHERE r.[Id Evaluacion Entidad RDA] = @Id
        `);

    if (!main.recordset || !main.recordset.length) {
        const err = new Error('No existe Evaluacion Entidad RDA para el Id indicado');
        err.code = 'RDA_PAC_NOT_FOUND';
        throw err;
    }

    const cabecera = main.recordset[0];

    const [antSalud, antFam, antFarm] = await Promise.all([
        pool.request().input('Id', sql.Int, id).query(`
            SELECT
                [ID Antecedente Salud] AS IdAntecedenteSalud,
                [Descripcion] AS Descripcion
            FROM [dbo].[Evaluacion Entidad RDA Antecedentes Salud]
            WHERE [Id Evaluacion Entidad RDA] = @Id AND [Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT
                [ID Antecedente Familiar] AS IdAntecedenteFamiliar,
                [Parentesco] AS Parentesco,
                [Descripcion] AS Descripcion,
                [CIE11 Codigo] AS CIE11Codigo,
                [CIE11 Termino] AS CIE11Termino
            FROM [dbo].[Evaluacion Entidad RDA Antecedentes Familiares]
            WHERE [Id Evaluacion Entidad RDA] = @Id AND [Id Estado] = 1
        `),
        pool.request().input('Id', sql.Int, id).query(`
            SELECT
                [ID Antecedente Farmacologico] AS IdAntecedenteFarmacologico,
                [Descripcion] AS Descripcion
            FROM [dbo].[Evaluacion Entidad RDA Antecedentes Farmacologicos]
            WHERE [Id Evaluacion Entidad RDA] = @Id AND [Id Estado] = 1
        `),
    ]);

    return {
        cabecera,
        antecedentesSalud: antSalud.recordset || [],
        antecedentesFamiliares: antFam.recordset || [],
        antecedentesFarmacologicos: antFarm.recordset || [],
    };
}

module.exports = { loadRdaPacienteAggregate };

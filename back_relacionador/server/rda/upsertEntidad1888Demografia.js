'use strict';

/**
 * Upsert demografía 1888 en [Entidad1888] por documento (trim / LTRIM-RTRIM).
 * Usado por ActualizarPaciente y por INSERT de Evaluacion Entidad RDA.
 *
 * @param {import('mssql').ConnectionPool} pool
 * @param {typeof import('mssql')} sql
 * @param {object} fields
 * @returns {Promise<{ entidad1888RowsAffected: number, documento: string, IdPaisNacionalidad: number|null, IdPaisRecidencia: number|null, IdMunicipioRecidencia: number|null }>}
 */
async function upsertEntidad1888Demografia(pool, sql, fields = {}) {
    const documento = fields.Documento != null ? String(fields.Documento).trim() : '';
    if (!documento) {
        const err = new Error('Documento es obligatorio para actualizar Entidad1888');
        err.code = 'ENTIDAD1888_DOCUMENTO_REQUERIDO';
        throw err;
    }

    const toIntOrNull = (v) => {
        if (v === null || v === undefined) return null;
        const s = String(v).trim();
        if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : null;
    };
    const toStrOrNull = (v, maxLen) => {
        if (v === null || v === undefined) return null;
        const s = String(v).trim();
        if (!s) return null;
        return maxLen != null ? s.slice(0, maxLen) : s;
    };

    const idNacionalidad = toIntOrNull(fields.IdNacionalidad);
    const idResidencia = toIntOrNull(fields.IdResidencia);
    const idMunicipio = toIntOrNull(fields.IdMunicipio);
    const sexoIdenti = toIntOrNull(fields.SexoIdenti);
    const idEtnia = toIntOrNull(fields.IdEtnia);
    const idDiscapacidad = toIntOrNull(fields.IdDiscapacidad);
    const talla = toStrOrNull(fields.Talla, 10);
    const peso = toStrOrNull(fields.Peso, 10);
    const comunidadEtnica = toStrOrNull(fields.ComunidadEtnica, 50);
    const alergias = toStrOrNull(fields.Alergias, 90);
    const alergeno = toStrOrNull(fields.Alergeno, 200);

    const result = await pool.request()
        .input('Documento', sql.NVarChar(50), documento)
        .input('SexoIdenti', sql.Int, sexoIdenti)
        .input('Talla', sql.VarChar(10), talla)
        .input('Peso', sql.VarChar(10), peso)
        .input('IdEtnia', sql.Int, idEtnia)
        .input('ComunidadEtnica', sql.VarChar(50), comunidadEtnica)
        .input('IdDiscapacidad', sql.Int, idDiscapacidad)
        .input('IdNacionalidad', sql.Int, idNacionalidad)
        .input('IdResidencia', sql.Int, idResidencia)
        .input('IdMunicipio', sql.Int, idMunicipio)
        .input('Alergias', sql.VarChar(90), alergias)
        .input('Alergeno', sql.VarChar(200), alergeno)
        .query(`
            IF EXISTS (
                SELECT 1
                FROM [dbo].[Entidad1888]
                WHERE LTRIM(RTRIM([Documento Entidad])) = @Documento
            )
            BEGIN
                UPDATE [dbo].[Entidad1888]
                SET [Id Identidad Genero] = @SexoIdenti,
                    [Talla] = @Talla,
                    [Peso] = @Peso,
                    [Id Etnia] = @IdEtnia,
                    [Comunidad Etnica] = @ComunidadEtnica,
                    [Id Discapacidad] = @IdDiscapacidad,
                    [Id Pais Nacionalidad] = @IdNacionalidad,
                    [Id Pais Recidencia] = @IdResidencia,
                    [Id Municipio Recidencia] = @IdMunicipio,
                    [Alergias] = @Alergias,
                    [Alergeno] = @Alergeno
                WHERE LTRIM(RTRIM([Documento Entidad])) = @Documento;

                SELECT @@ROWCOUNT AS RowsAffected, CAST(0 AS INT) AS WasInsert;
            END
            ELSE
            BEGIN
                INSERT INTO [dbo].[Entidad1888]
                (
                    [Documento Entidad], [Id Identidad Genero], [Talla], [Peso], [Id Etnia],
                    [Comunidad Etnica], [Id Discapacidad], [Id Pais Nacionalidad],
                    [Id Pais Recidencia], [Id Municipio Recidencia], [Alergias], [Alergeno]
                )
                VALUES
                (
                    @Documento, @SexoIdenti, @Talla, @Peso, @IdEtnia,
                    @ComunidadEtnica, @IdDiscapacidad, @IdNacionalidad,
                    @IdResidencia, @IdMunicipio, @Alergias, @Alergeno
                );

                SELECT @@ROWCOUNT AS RowsAffected, CAST(1 AS INT) AS WasInsert;
            END
        `);

    const row = result.recordset && result.recordset[0] ? result.recordset[0] : null;
    const rowsAffected = row && row.RowsAffected != null ? Number(row.RowsAffected) : 0;
    if (!Number.isFinite(rowsAffected) || rowsAffected <= 0) {
        const err = new Error(
            `No se pudo actualizar Entidad1888 para el documento ${documento} (0 filas afectadas)`
        );
        err.code = 'ENTIDAD1888_ZERO_ROWS';
        throw err;
    }

    return {
        entidad1888RowsAffected: rowsAffected,
        documento,
        IdPaisNacionalidad: idNacionalidad,
        IdPaisRecidencia: idResidencia,
        IdMunicipioRecidencia: idMunicipio,
        wasInsert: !!(row && row.WasInsert),
    };
}

/**
 * Asegura fila mínima en Entidad1888 para el documento (trim / LTRIM-RTRIM).
 */
async function ensureEntidad1888Row(pool, sql, documentoRaw) {
    const documento = documentoRaw != null ? String(documentoRaw).trim() : '';
    if (!documento) return { created: false, documento: '' };

    const result = await pool.request()
        .input('DocumentoPaciente', sql.NVarChar(50), documento)
        .query(`
            IF NOT EXISTS (
                SELECT 1
                FROM [dbo].[Entidad1888]
                WHERE LTRIM(RTRIM([Documento Entidad])) = @DocumentoPaciente
            )
            BEGIN
                INSERT INTO [dbo].[Entidad1888] ([Documento Entidad])
                VALUES (@DocumentoPaciente);
                SELECT CAST(1 AS INT) AS Created;
            END
            ELSE
            BEGIN
                SELECT CAST(0 AS INT) AS Created;
            END
        `);

    const created = !!(result.recordset && result.recordset[0] && result.recordset[0].Created);
    return { created, documento };
}

module.exports = {
    upsertEntidad1888Demografia,
    ensureEntidad1888Row,
};

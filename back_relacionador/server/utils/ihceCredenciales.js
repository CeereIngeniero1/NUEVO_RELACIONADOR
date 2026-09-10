/**
 * Credenciales IHCE (OAuth/APIM + custodian) por empresa y ambiente.
 * Fuente de verdad: dbo.CredencialesIhce (sin fallback a .env para secretos).
 */
'use strict';

function sanitizeEmpresa(doc) {
    return String(doc || '')
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/\.+$/g, '') || '';
}

function normalizeAmbiente(ambiente) {
    const a = String(ambiente || 'sandbox').trim().toLowerCase();
    return a === 'prod' || a === 'produccion' || a === 'production' ? 'prod' : 'sandbox';
}

function str(v) {
    return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function normalizeCredRow(row, documentoEmpresa, ambiente) {
    if (!row || typeof row !== 'object') return null;
    const baseUrl = str(row.baseUrl || row['Base Url']).replace(/\/$/, '');
    const tenantId = str(row.tenantId || row['Tenant Id']);
    const clientId = str(row.clientId || row['Client Id']);
    const clientSecret = str(row.clientSecret || row['Client Secret']);
    const scope = str(row.scope || row['Scope']);
    const subscriptionKey = str(row.subscriptionKey || row['Subscription Key']);
    const custodianReps = str(row.custodianReps || row['Custodian Reps']);
    const custodianNit = str(row.custodianNit || row['Custodian Nit']);
    const custodianName = str(row.custodianName || row['Custodian Name']);
    const amb = normalizeAmbiente(ambiente || row.ambiente || row.Ambiente);

    return {
        documentoEmpresa: sanitizeEmpresa(documentoEmpresa || row.documentoEmpresa || row['Documento Empresa']),
        ambiente: amb,
        envPrefix: amb === 'prod' ? 'IHCE_PROD_' : 'IHCE_SANDBOX_',
        baseUrl,
        tenantId,
        clientId,
        clientSecret,
        scope,
        subscriptionKey,
        custodianReps,
        custodianNit,
        custodianName,
    };
}

function assertOauthCompleto(cred) {
    const missing = [
        !cred.baseUrl && 'BASE_URL',
        !cred.tenantId && 'TENANT_ID',
        !cred.clientId && 'CLIENT_ID',
        !cred.clientSecret && 'CLIENT_SECRET',
        !cred.scope && 'SCOPE',
        !cred.subscriptionKey && 'SUBSCRIPTION_KEY',
    ].filter(Boolean);
    if (missing.length) {
        const err = new Error(
            `Faltan credenciales IHCE en BD (${cred.documentoEmpresa || '?'} / ${cred.ambiente}): ${missing.join(', ')}. `
            + 'Configure CredencialesIhce o use la UI de credenciales IHCE.'
        );
        err.code = 'IHCE_CREDENCIALES_INCOMPLETAS';
        err.status = 400;
        err.missing = missing;
        throw err;
    }
}

async function getFromSql(documentoEmpresa, ambiente) {
    const key = sanitizeEmpresa(documentoEmpresa);
    const amb = normalizeAmbiente(ambiente);
    if (!key) return null;

    const { sql, poolPromise } = require('../db2');
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input('DocumentoEmpresa', sql.NVarChar(50), key)
        .input('Ambiente', sql.NVarChar(20), amb)
        .query(`
            SELECT TOP 1
                [Documento Empresa] AS documentoEmpresa,
                [Ambiente] AS ambiente,
                [Base Url] AS baseUrl,
                [Tenant Id] AS tenantId,
                [Client Id] AS clientId,
                [Client Secret] AS clientSecret,
                [Scope] AS scope,
                [Subscription Key] AS subscriptionKey,
                [Custodian Reps] AS custodianReps,
                [Custodian Nit] AS custodianNit,
                [Custodian Name] AS custodianName
            FROM dbo.CredencialesIhce
            WHERE [Documento Empresa] = @DocumentoEmpresa
              AND [Ambiente] = @Ambiente
              AND ISNULL([Activo], 1) = 1
        `);
    const row = result.recordset && result.recordset[0];
    return normalizeCredRow(row, key, amb);
}

/**
 * Credenciales completas (incluye secretos). Lanza si faltan.
 */
async function getIhceCredentials(documentoEmpresa, ambiente) {
    const key = sanitizeEmpresa(documentoEmpresa);
    const amb = normalizeAmbiente(ambiente);
    if (!key) {
        const err = new Error(
            'documentoEmpresa requerido para resolver CredencialesIhce. '
            + 'Envíe documentoEmpresa (sesión) o asegure que el RDA tenga prestador mapeable a Empresa.'
        );
        err.code = 'IHCE_EMPRESA_REQUERIDA';
        err.status = 400;
        throw err;
    }

    let cred;
    try {
        cred = await getFromSql(key, amb);
    } catch (err) {
        if (/Invalid object name|no existe|does not exist/i.test(String(err.message || err))) {
            const e = new Error(
                'No existe la tabla CredencialesIhce. Ejecute SQL/2275/19. CredencialesIhce.sql'
            );
            e.code = 'IHCE_TABLA_AUSENTE';
            e.status = 500;
            throw e;
        }
        throw err;
    }

    if (!cred) {
        const err = new Error(
            `No hay CredencialesIhce activas para empresa "${key}" / ambiente "${amb}".`
        );
        err.code = 'IHCE_CREDENCIALES_NO_ENCONTRADAS';
        err.status = 400;
        throw err;
    }
    assertOauthCompleto(cred);
    return cred;
}

async function getIhceCredentialsPublicas(documentoEmpresa, ambiente) {
    const key = sanitizeEmpresa(documentoEmpresa);
    const amb = normalizeAmbiente(ambiente);
    if (!key) return null;
    let cred;
    try {
        cred = await getFromSql(key, amb);
    } catch (_) {
        return null;
    }
    if (!cred) return null;
    return {
        documentoEmpresa: cred.documentoEmpresa,
        ambiente: cred.ambiente,
        baseUrl: cred.baseUrl || '',
        tenantId: cred.tenantId || '',
        clientId: cred.clientId || '',
        scope: cred.scope || '',
        custodianReps: cred.custodianReps || '',
        custodianNit: cred.custodianNit || '',
        custodianName: cred.custodianName || '',
        tieneClientSecret: Boolean(cred.clientSecret),
        tieneSubscriptionKey: Boolean(cred.subscriptionKey),
    };
}

async function listIhceCredentialsByEmpresa(documentoEmpresa) {
    const key = sanitizeEmpresa(documentoEmpresa);
    if (!key) return { sandbox: null, prod: null };
    const [sandbox, prod] = await Promise.all([
        getIhceCredentialsPublicas(key, 'sandbox'),
        getIhceCredentialsPublicas(key, 'prod'),
    ]);
    return { documentoEmpresa: key, sandbox, prod };
}

async function upsertIhceCredentials(documentoEmpresa, ambiente, payload) {
    const key = sanitizeEmpresa(documentoEmpresa);
    const amb = normalizeAmbiente(ambiente);
    if (!key) {
        const err = new Error('documentoEmpresa requerido');
        err.status = 400;
        throw err;
    }

    const prev = await getFromSql(key, amb).catch(() => null);
    const merged = {
        ...(prev || {}),
        ...(payload || {}),
        documentoEmpresa: key,
        ambiente: amb,
    };

    if (!str(merged.clientSecret) && prev?.clientSecret) {
        merged.clientSecret = prev.clientSecret;
    }
    if (!str(merged.subscriptionKey) && prev?.subscriptionKey) {
        merged.subscriptionKey = prev.subscriptionKey;
    }

    const cred = normalizeCredRow(merged, key, amb);
    if (!cred) {
        const err = new Error('Payload de credenciales IHCE inválido');
        err.status = 400;
        throw err;
    }
    assertOauthCompleto(cred);

    const { sql, poolPromise } = require('../db2');
    const pool = await poolPromise;
    await pool
        .request()
        .input('DocumentoEmpresa', sql.NVarChar(50), key)
        .input('Ambiente', sql.NVarChar(20), amb)
        .input('BaseUrl', sql.NVarChar(300), cred.baseUrl)
        .input('TenantId', sql.NVarChar(100), cred.tenantId)
        .input('ClientId', sql.NVarChar(100), cred.clientId)
        .input('ClientSecret', sql.NVarChar(500), cred.clientSecret)
        .input('Scope', sql.NVarChar(300), cred.scope)
        .input('SubscriptionKey', sql.NVarChar(200), cred.subscriptionKey)
        .input('CustodianReps', sql.NVarChar(50), cred.custodianReps || null)
        .input('CustodianNit', sql.NVarChar(50), cred.custodianNit || null)
        .input('CustodianName', sql.NVarChar(200), cred.custodianName || null)
        .query(`
            MERGE dbo.CredencialesIhce AS t
            USING (SELECT @DocumentoEmpresa AS [Documento Empresa], @Ambiente AS [Ambiente]) AS s
              ON t.[Documento Empresa] = s.[Documento Empresa]
             AND t.[Ambiente] = s.[Ambiente]
            WHEN MATCHED THEN UPDATE SET
                [Base Url] = @BaseUrl,
                [Tenant Id] = @TenantId,
                [Client Id] = @ClientId,
                [Client Secret] = @ClientSecret,
                [Scope] = @Scope,
                [Subscription Key] = @SubscriptionKey,
                [Custodian Reps] = @CustodianReps,
                [Custodian Nit] = @CustodianNit,
                [Custodian Name] = @CustodianName,
                [Activo] = 1,
                [Fecha Actualizacion] = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN INSERT (
                [Documento Empresa], [Ambiente], [Base Url], [Tenant Id], [Client Id],
                [Client Secret], [Scope], [Subscription Key],
                [Custodian Reps], [Custodian Nit], [Custodian Name], [Activo]
            ) VALUES (
                @DocumentoEmpresa, @Ambiente, @BaseUrl, @TenantId, @ClientId,
                @ClientSecret, @Scope, @SubscriptionKey,
                @CustodianReps, @CustodianNit, @CustodianName, 1
            );
        `);

    return getIhceCredentialsPublicas(key, amb);
}

async function resolveDocumentoEmpresaFromRda({
    documentoEmpresaBody,
    codigoPrestador,
    nitPrestador,
} = {}) {
    const fromBody = sanitizeEmpresa(documentoEmpresaBody);
    if (fromBody) return fromBody;

    const reps = str(codigoPrestador);
    const nit = str(nitPrestador);
    if (!reps && !nit) return '';

    try {
        const { sql, poolPromise } = require('../db2');
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('Reps', sql.NVarChar(50), reps || null)
            .input('Nit', sql.NVarChar(50), nit || null)
            .query(`
                SELECT TOP 1 LTRIM(RTRIM([Documento Empresa])) AS documentoEmpresa
                FROM dbo.Empresa
                WHERE (
                        @Reps IS NOT NULL
                        AND LTRIM(RTRIM(ISNULL(NroIDPrestador, N''))) = @Reps
                    )
                   OR (
                        @Nit IS NOT NULL
                        AND (
                            LTRIM(RTRIM([Documento Empresa])) = @Nit
                            OR REPLACE(LTRIM(RTRIM([Documento Empresa])), N'-', N'') = REPLACE(@Nit, N'-', N'')
                        )
                    )
                ORDER BY
                    CASE
                        WHEN @Reps IS NOT NULL
                             AND LTRIM(RTRIM(ISNULL(NroIDPrestador, N''))) = @Reps THEN 0
                        ELSE 1
                    END
            `);
        return sanitizeEmpresa(result.recordset?.[0]?.documentoEmpresa);
    } catch (err) {
        console.warn('[ihceCredenciales] resolveDocumentoEmpresaFromRda:', err.message || err);
        return '';
    }
}

async function resolveIhceCredentials(ambiente, documentoEmpresa) {
    return getIhceCredentials(documentoEmpresa, ambiente);
}

/**
 * Primer Documento Empresa con CredencialesIhce activas para el ambiente (útil ICD-11 / defaults).
 */
async function getFirstIhceDocumentoEmpresa(ambiente) {
    const amb = normalizeAmbiente(ambiente);
    try {
        const { sql, poolPromise } = require('../db2');
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('Ambiente', sql.NVarChar(20), amb)
            .query(`
                SELECT TOP 1 LTRIM(RTRIM([Documento Empresa])) AS documentoEmpresa
                FROM dbo.CredencialesIhce
                WHERE [Ambiente] = @Ambiente
                  AND ISNULL([Activo], 1) = 1
                ORDER BY [Documento Empresa]
            `);
        return sanitizeEmpresa(result.recordset?.[0]?.documentoEmpresa);
    } catch (err) {
        console.warn('[ihceCredenciales] getFirstIhceDocumentoEmpresa:', err.message || err);
        return '';
    }
}

module.exports = {
    sanitizeEmpresa,
    normalizeAmbiente,
    getIhceCredentials,
    getIhceCredentialsPublicas,
    listIhceCredentialsByEmpresa,
    upsertIhceCredentials,
    resolveDocumentoEmpresaFromRda,
    resolveIhceCredentials,
    getFirstIhceDocumentoEmpresa,
};

ALTER TABLE Factura
ADD [Impuesto Factura Electronica retenido] BIT NULL,
[Concepto Factura Electronica] varchar(50) NULL,
EstadoFacturaElectronica INT NULL
GO



CREATE VIEW [dbo].[face_facturaPorUsuarioAnulada]
AS
SELECT        [No Factura] AS NoFactura, [Id EmpresaV] AS IdEmpresaV, [Documento Usuario], EstadoFacturaElectronica, [Id Estado], [Fecha Factura]
FROM            dbo.Factura
WHERE        ([Id Estado] = 5) AND (EstadoFacturaElectronica = 1)

GO


CREATE VIEW [dbo].[face_facturaPorUsuario]
AS
SELECT        [No Factura] AS NoFactura, [Id EmpresaV] AS IdEmpresaV, [Documento Usuario], EstadoFacturaElectronica, [Id Estado], [Fecha Factura]
FROM            dbo.Factura
WHERE        (EstadoFacturaElectronica IS NULL) OR (EstadoFacturaElectronica = 0)

GO



CREATE VIEW [dbo].[face_ConsultaEmpresaV]
AS
SELECT        [Id EmpresaV] AS IDempresaV, [Resolución Facturación EmpresaV] AS resolucionSIO, [Prefijo Resolución Facturación EmpresaV] AS prefijoSIO, [Id Estado] AS EstadoEmpresaV
FROM            dbo.EmpresaV
WHERE        ([Id Estado] = 7) AND ([Resolución Facturación EmpresaV] IS NOT NULL)

GO

CREATE VIEW [dbo].[Face Ultima Nota Credito]
AS
SELECT        TOP (1) [Id Nota Crédito] AS idNotaC, [Número Nota Crédito] AS NumNotaC
FROM            dbo.[Nota Crédito]
ORDER BY idNotaC DESC

GO

CREATE VIEW [dbo].[Face Total base impuestos porcentaje FacturaNormal]
AS
SELECT        ROUND(SUM((ROUND(dbo.FacturaII.[Valor FacturaII], 0) - dbo.FacturaII.[Descuento $ FacturaII]) * dbo.FacturaII.[Cantidad FacturaII]), 0) AS base, dbo.Factura.[No Factura], 
                         ROUND(SUM((dbo.FacturaII.[Valor FacturaII] - dbo.FacturaII.[Descuento $ FacturaII]) * dbo.FacturaII.[Cantidad FacturaII]) * (dbo.FacturaII.[Valor Iva % FacturaII] / 100), 0) AS ValorIva, 
                        dbo.FacturaII.[Valor Iva % FacturaII]
FROM            dbo.Factura INNER JOIN
                        dbo.FacturaII ON dbo.Factura.[Id Factura] = dbo.FacturaII.[Id Factura] INNER JOIN
                        dbo.EmpresaV ON dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV]
GROUP BY dbo.Factura.[No Factura], dbo.FacturaII.[Valor Iva % FacturaII], dbo.EmpresaV.[Id Estado]
HAVING        (dbo.EmpresaV.[Id Estado] = 7) AND (dbo.FacturaII.[Valor Iva % FacturaII] <> 0)

GO

CREATE VIEW [dbo].[Face Total base impuestos porcentaje]
AS
SELECT        ROUND(SUM((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items]), 0) AS base, 
                        ROUND(SUM((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items]) * (dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] / 100), 0) AS ValorIva, dbo.Factura.[No Factura], 
                        dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items]
FROM            dbo.[Plan de Tratamiento Items] INNER JOIN
                        dbo.[Plan de Tratamiento] ON dbo.[Plan de Tratamiento Items].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] LEFT OUTER JOIN
                        dbo.Factura INNER JOIN
                        dbo.FacturaII ON dbo.Factura.[Id Factura] = dbo.FacturaII.[Id Factura] INNER JOIN
                        dbo.EmpresaV ON dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.FacturaII.[Id Plan de Tratamiento]
GROUP BY dbo.Factura.[No Factura], dbo.EmpresaV.[Id Estado], dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items]
HAVING        (dbo.EmpresaV.[Id Estado] = 7) AND (dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] <> 0)

GO


CREATE VIEW [dbo].[Face Total base impuestos]
AS
SELECT        ROUND(f2.[Valor FacturaII] * f2.[Cantidad FacturaII] - f2.[Descuento $ FacturaII], 0) AS base, f.[No Factura], f2.[Valor Iva % FacturaII], ROUND(SUM(f2.[Valor Iva $ FacturaII]), 0) AS ValorIva, f.[Descuentos Factura], 
                        f2.[Cantidad FacturaII]
FROM            dbo.FacturaII AS f2 INNER JOIN
                        dbo.Factura AS f ON f.[Id Factura] = f2.[Id Factura] INNER JOIN
                        dbo.EmpresaV AS emV ON emV.[Id EmpresaV] = f.[Id EmpresaV]
WHERE        (f2.[Valor Iva % FacturaII] <> 0) AND (emV.[Id Estado] = 7)
GROUP BY f.[No Factura], f2.[Valor Iva % FacturaII], f.[Descuentos Factura], f2.[Valor FacturaII], f2.[Descuento $ FacturaII], f2.[Cantidad FacturaII]

GO

ALTER TABLE [Nota Crédito]
ADD [Id concepto Nota] INT NULL,
[No Factura] nvarchar(50) NULL,
EstadoFace INT NULL



CREATE VIEW [dbo].[face Cnta Nota Credito]
AS
SELECT        dbo.[Nota Crédito].[Número Nota Crédito] AS NumNotaCredito, dbo.[Nota Crédito].[Fecha Nota Crédito] AS fechaNotaNC, dbo.[Nota Crédito].[Documento Entidad] AS EntidadDocumento, 
                        dbo.[Nota Crédito].[Concepto Nota Crédito] AS ConceptoTexto, dbo.[Nota Crédito].[Valor Nota Crédito] AS ValorNotaC, dbo.[Nota Crédito].[Valor % Descuento Nota Crédito] AS PorcentajeDescuentoNC, 
                        dbo.[Nota Crédito].[Valor $ Descuento Nota Crédito] AS ValorDescuentoNC, dbo.[Nota Crédito].[Valor % Iva Nota Crédito] AS porcentajeIvaNC, dbo.[Nota Crédito].[No Factura] AS NoFactura, 
                        dbo.[Nota Crédito].[Id concepto Nota] AS IdConcpetoNC, dbo.Entidad.[Nombre Completo Entidad] AS NombreEntidad, dbo.[Nota Crédito].EstadoFace
FROM            dbo.[Nota Crédito] INNER JOIN
                        dbo.Entidad ON dbo.[Nota Crédito].[Documento Entidad] = dbo.Entidad.[Documento Entidad]

GO




CREATE TABLE [dbo].[ConfiguracionFace](
	[IdConfiguracionFace] [int] IDENTITY(1,1) NOT NULL,
	[IdEmpresaV] [int] NULL,
	[IdResolucionFactura] [int] NULL,
	[IdresolucionNotaCredito] [int] NULL,
	[IdresolucionNotaDebito] [int] NULL,
	[VersionGraficaFactura] [int] NULL,
	[VersionGraficaFacturaNC] [int] NULL,
	[VersionGraficaFacturaND] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[IdConfiguracionFace] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

ALTER TABLE EmpresaV
ADD [Fecha Final Resolucion Facturacion Empresa] datetime NULL,
Barrio nvarchar(50) NULL,
ResolucionNC nvarchar(255) NULL,
FechaResolucionNC datetime NULL,
PrefijoNC nvarchar(50) NULL,
InicioResoNC INT NULL,
FinResoNC INT NULL,
FechafinalReso datetime NULL


CREATE VIEW [dbo].[Face Cnta ConfiguracionFace]
AS
SELECT        IdEmpresaV, IdResolucionFactura, IdresolucionNotaCredito, IdresolucionNotaDebito, VersionGraficaFactura, VersionGraficaFacturaNC, VersionGraficaFacturaND
FROM            dbo.ConfiguracionFace

GO


CREATE VIEW [dbo].[Face Cnsta Total Base Imponible FacturaNormal]
AS
SELECT        [No Factura], base AS TotalBaseImponible
FROM            dbo.[Face Total base impuestos porcentaje FacturaNormal]

GO


CREATE VIEW [dbo].[Face Cnsta Total Base Imponible]
AS
SELECT        [No Factura], SUM(base) AS TotalBaseImponible
FROM            dbo.[Face Total base impuestos porcentaje]
GROUP BY [No Factura]

GO


CREATE VIEW [dbo].[Face Cnsta Cuotas]
AS
SELECT        [Id Cuotas Pactadas Inicial Tratamiento], [Capital Faltante Cuotas Pactadas Inicial Tratamiento], [Id Plan de Tratamiento Tratamientos]
FROM            dbo.[Cuotas Pactadas Inicial Tratamiento]
WHERE        ([Cuota Nro Cuotas Pactadas Inicial Tratamiento] = 1)

GO


CREATE VIEW [dbo].[Face Cnsta Descuento Copago]
AS
SELECT        dbo.[Plan de Tratamiento].[Nro Plan de Tratamiento], dbo.Factura.[No Factura] AS NroFactura, dbo.Factura.[Id EmpresaV] AS IdEmpresaV, 
                        dbo.[Plan de Tratamiento].[Descuento Adicional $ Plan de Tratamiento] AS DescuentoPresu, dbo.[Plan de Tratamiento].[Descuento Adicional % Plan de Tratamiento], 
                        dbo.[Cnsta CR Plan de Tratamiento Total].[Total Tratamiento] AS TotalPresu, 
                        dbo.[Plan de Tratamiento].[Descuento Adicional $ Plan de Tratamiento] / dbo.[Cnsta CR Plan de Tratamiento Total].[Total Tratamiento] * 100 AS PorcentajeDctoPresu
FROM            dbo.Factura INNER JOIN
                        dbo.FacturaII ON dbo.Factura.[Id Factura] = dbo.FacturaII.[Id Factura] INNER JOIN
                        dbo.[Plan de Tratamiento] ON dbo.FacturaII.[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] INNER JOIN
                        dbo.[Cnsta CR Plan de Tratamiento Total] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.[Cnsta CR Plan de Tratamiento Total].[Id Plan de Tratamiento]

GO





CREATE VIEW [dbo].[Face Cnsta FacturaAnticiposVariosItems]
AS
SELECT        ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS ValorTotalItem, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII], 0) 
                        AS BaseItemDescuento, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS BaseItemIva, dbo.FacturaII.[Valor Iva $ FacturaII] AS ValorIvaItem, 
                        dbo.FacturaII.[Valor FacturaII] AS ValorItem, dbo.FacturaII.[Valor Iva % FacturaII] AS PorcentajeIvaItem, dbo.FacturaII.[Cantidad FacturaII] AS CantidadItem, dbo.FacturaII.[Descripción FacturaII] AS DescripcionItem, 
                        dbo.FacturaII.[Id FacturaII] AS IdFacturaItem, dbo.Factura.[No Factura] AS NroFactura, dbo.FacturaII.[Descuento $ FacturaII] AS ValorDescuentoItem, dbo.FacturaII.[Código Objeto] AS codigoObjetoItem, 
                        dbo.Factura.[Id EmpresaV] AS IdEmpresaV, dbo.EmpresaV.[Id Estado] AS IdEstadoEmpresaV, dbo.FacturaII.[Descuento % FacturaII] AS PorcentajeDescuentoItem, 
                        dbo.Entidad.[Nombre Completo Entidad] AS Vendedor, dbo.[Plan de Tratamiento].[Documento Paciente] AS DocumentoPacienteEPS, Entidad_1.[Nombre Completo Entidad] AS NombrePacienteEPS
FROM            dbo.FacturaII INNER JOIN
                        dbo.Factura ON dbo.FacturaII.[Id Factura] = dbo.Factura.[Id Factura] INNER JOIN
                        dbo.EmpresaV ON dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV] INNER JOIN
                        dbo.Entidad ON dbo.Factura.[Documento Paciente] = dbo.Entidad.[Documento Entidad] INNER JOIN
                        dbo.[Plan de Tratamiento] ON dbo.FacturaII.[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] INNER JOIN
                        dbo.Entidad AS Entidad_1 ON dbo.[Plan de Tratamiento].[Documento Paciente] = Entidad_1.[Documento Entidad]
WHERE        (dbo.EmpresaV.[Id Estado] = 7)

GO


CREATE VIEW [dbo].[Face Cnsta FacturaCopago]
AS
SELECT        ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS ValorTotalItem, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII], 0) 
                        AS BaseItemDescuento, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS BaseItemIva, dbo.FacturaII.[Valor Iva $ FacturaII] AS ValorIvaItem, 
                        dbo.FacturaII.[Valor FacturaII] AS ValorItem, dbo.FacturaII.[Valor Iva % FacturaII] AS PorcentajeIvaItem, dbo.FacturaII.[Cantidad FacturaII] AS CantidadItem, dbo.FacturaII.[Descripción FacturaII] AS DescripcionItem, 
                        dbo.FacturaII.[Id FacturaII] AS IdFacturaItem, dbo.Factura.[No Factura] AS NroFactura, dbo.FacturaII.[Descuento $ FacturaII] AS ValorDescuentoItem, dbo.FacturaII.[Código Objeto] AS codigoObjetoItem, 
                        dbo.Factura.[Id EmpresaV] AS IdEmpresaV, dbo.EmpresaV.[Id Estado] AS IdEstadoEmpresaV, dbo.FacturaII.[Descuento % FacturaII] AS PorcentajeDescuentoItem, 
                        dbo.Entidad.[Nombre Completo Entidad] AS Vendedor
FROM            dbo.FacturaII INNER JOIN
                        dbo.Factura ON dbo.FacturaII.[Id Factura] = dbo.Factura.[Id Factura] INNER JOIN
                        dbo.EmpresaV ON dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV] INNER JOIN
                        dbo.Entidad ON dbo.Factura.[Documento Paciente] = dbo.Entidad.[Documento Entidad]
WHERE        (dbo.EmpresaV.[Id Estado] = 7)

GO


ALTER TABLE [Tipo de Documento]
ADD codigoDian INT NULL



CREATE VIEW [dbo].[Face Cnsta FacturaE Empresa]
AS
SELECT dbo.Empresa.[Documento Empresa] AS IdEmpresa, dbo.Empresa.[Código Empresa] AS CodPrestador, dbo.Factura.[No Factura] AS NroFactura, dbo.Empresa.[Id Tipo de Documento], UPPER(dbo.Empresa.[Razon Social Empresa]) 
                AS NombreEmpresa, dbo.Departamento.Departamento AS DepartamentoEmpresa, UPPER(dbo.Ciudad.Ciudad) AS CiudadEmpresa, dbo.EmpresaIII.[Dirección EmpresaIII] AS DireccionEmpresa, 
                dbo.EmpresaII.[Id Régimen Tributario] AS RegimenEmpresa, dbo.[Tipo de Documento].[Descripción Tipo de Documento] AS DescripcionTipoDocumentoEmpresa, dbo.EmpresaIII.[E-mail 1 EmpresaIII] AS EmailEmpresa, 
                dbo.EmpresaV.[Id EmpresaV] AS IdEmpresaV, dbo.[Tipo de Documento].codigoDian AS IdTipoDocumentoEmpresa, dbo.Departamento.[Código Departamento] AS codigoDepartamentoEmpresa, 
                dbo.País.[Código País] AS codigoPaisEmpresa, SUBSTRING(dbo.Empresa.[Documento Empresa], 11, 12) AS digitoVerificacionEmpresa, dbo.Ciudad.[Código Ciudad] AS codigoCiudadEmpresa, 
                dbo.EmpresaV.[Resolución Facturación EmpresaV] AS resolucionEmpresa, dbo.EmpresaV.[Fecha Resolución Facturación EmpresaV] AS fechaIniResolucionEmpresa, 
                dbo.EmpresaV.[Fecha Final Resolucion Facturacion Empresa] AS fechaFinalResolucionEmpresa, dbo.EmpresaV.Barrio AS BarrioEmpresa, SUBSTRING(dbo.Empresa.[Documento Empresa], 0, 10) AS DocumentoSinDigito, 
                dbo.[Tipo Empresa].[Código Tipo Empresa] AS codigoTipoEmpresa, UPPER(dbo.País.[Descripción País]) AS PaisEmpresaEmi, dbo.EmpresaV.[Nro Inicio Resolución Facturación EmpresaV] AS NumeroInicioResolucion, 
                dbo.EmpresaV.[Nro Fin Resolución Facturación EmpresaV] AS NumeroFinResolucion, dbo.EmpresaIII.[Teléfono No 1 EmpresaIII] AS TelefonoEmpresa
FROM     dbo.Empresa INNER JOIN
                dbo.EmpresaIII ON dbo.Empresa.[Documento Empresa] = dbo.EmpresaIII.[Documento Empresa] INNER JOIN
                dbo.Ciudad ON dbo.Empresa.[Id Ciudad] = dbo.Ciudad.[Id Ciudad] AND dbo.EmpresaIII.[Id Ciudad] = dbo.Ciudad.[Id Ciudad] INNER JOIN
                dbo.Departamento ON dbo.Ciudad.[Id Departamento] = dbo.Departamento.[Id Departamento] INNER JOIN
                dbo.Factura ON dbo.Empresa.[Documento Empresa] = dbo.Factura.[Documento Empresa] INNER JOIN
                dbo.EmpresaII ON dbo.Empresa.[Documento Empresa] = dbo.EmpresaII.[Documento Empresa] INNER JOIN
                dbo.[Tipo de Documento] ON dbo.Empresa.[Id Tipo de Documento] = dbo.[Tipo de Documento].[Id Tipo de Documento] INNER JOIN
                dbo.EmpresaV ON dbo.Empresa.[Documento Empresa] = dbo.EmpresaV.[Documento Empresa] AND dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV] INNER JOIN
                dbo.País ON dbo.Departamento.[Id País] = dbo.País.[Id País] INNER JOIN
                dbo.[Tipo Empresa] ON dbo.EmpresaII.[Id Tipo Empresa] = dbo.[Tipo Empresa].[Id Tipo Empresa]

GO


IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'EntidadII' AND COLUMN_NAME = 'Id Ciudad')
BEGIN
    ALTER TABLE EntidadII
    ADD [Id Ciudad] INT NULL
END;



CREATE VIEW [dbo].[Face Cnsta FacturaE Entidad]
AS
SELECT DISTINCT 
                        en.[Documento Entidad] AS DocumentoEntidad, en.[Primer Apellido Entidad] AS PrimerApellidoEntidad, en.[Segundo Apellido Entidad] AS SegundoApellidoEntidad, 
                        en.[Primer Nombre Entidad] AS PrimerNombreEntidad, en.[Segundo Nombre Entidad] AS SegundoNombreEntidad, en.[Nombre Completo Entidad] AS NombreCompletoEntidad, 
                        e.[Dirección EntidadII] AS DireccionEntidad, c.[Código Ciudad] AS CodigoCiudad, UPPER(c.Ciudad) AS NombreCiudadEntidad, d.[Código Departamento] AS CodigoDepartamentoEntidad, 
                        d.Departamento AS NombreDepartamentoEntidad, d.[Id País] AS codigoPais, b.Barrio AS BarrioCiudad, td.[Id Tipo de Documento] AS IdTipoDocumentoEntidad, 
                        td.[Descripción Tipo de Documento] AS DescripcionDocumentoEntidad, e.[E-mail Nro 1 EntidadII] AS EmailEntidad, exx.[Autorretenedor EntidadXX] AS AutoRetenedor, 
                        exx.[Gran Contribuyente EntidadXX] AS GranContribuyente, exx.[Id Régimen Tributario] AS regimenEntidad, ae.[Código Actividad Económica] AS ActividadEconomicaEntidad, f.[No Factura] AS NroFactura, 
                        dbo.EmpresaV.[Id EmpresaV] AS IdEmpresaV, e.[Teléfono No 1 EntidadII] AS Telefono1Entidad, e.[Teléfono No 2 EntidadII] AS Telefono2Entidad, e.[Teléfono Celular EntidadII] AS TelefonoCelularEntidad, 
                        td.codigoDian, SUBSTRING(en.[Documento Entidad], 11, 12) AS digitoVerificacion, SUBSTRING(en.[Documento Entidad], 0, 10) AS documentoNit, dbo.País.[Código País] AS CodigoPaisEntidad, 
                        UPPER(dbo.País.[Descripción País]) AS PaisEntidad
FROM            dbo.EmpresaV INNER JOIN
                        dbo.[Tipo de Documento] AS td INNER JOIN
                        dbo.Factura AS f INNER JOIN
                        dbo.Entidad AS en ON f.[Documento Responsable] = en.[Documento Entidad] ON td.[Id Tipo de Documento] = en.[Id Tipo de Documento] INNER JOIN
                        dbo.Ciudad AS c INNER JOIN
                        dbo.EntidadII AS e INNER JOIN
                        dbo.Barrio AS b ON e.[Id Barrio] = b.[Id Barrio] ON c.[Id Ciudad] = e.[Id Ciudad] INNER JOIN
                        dbo.Departamento AS d ON d.[Id Departamento] = c.[Id Departamento] ON en.[Documento Entidad] = e.[Documento Entidad] ON dbo.EmpresaV.[Id EmpresaV] = f.[Id EmpresaV] INNER JOIN
                        dbo.País ON d.[Id País] = dbo.País.[Id País] LEFT OUTER JOIN
                        dbo.[Actividad Económica] AS ae INNER JOIN
                        dbo.EntidadXX AS exx ON ae.[Id Actividad Económica] = exx.[Id Actividad Económica] ON e.[Documento Entidad] = exx.[Documento Entidad]

GO

CREATE VIEW [dbo].[Face Cnsta NumeroItems]
AS
SELECT        COUNT([Código Objeto]) AS CantidadItem, [Id Plan de Tratamiento]
FROM            dbo.[Plan de Tratamiento Items]
GROUP BY [Id Plan de Tratamiento]

GO


CREATE VIEW [dbo].[Face Cnsta FacturaEII]
AS
SELECT        TOP (100) PERCENT ROUND((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items], 0) AS ValorTotalItemOld, 
                        ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items], 0) AS BaseItemDescuento, 
                        ROUND((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items], 0) AS BaseItemIva, 
                        ROUND(((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items]) * (dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] / 100), 0) AS ValorIvaItem, 
                        dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] AS ValorItem, dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] AS PorcentajeIvaItem, 
                        dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] AS CantidadItem, dbo.Objeto.[Descripción Objeto] AS DescripcionItem, dbo.FacturaII.[Id FacturaII] AS IdFacturaItem, 
                        dbo.Factura.[No Factura] AS NroFactura, dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items] AS ValorDescuento, dbo.[Plan de Tratamiento Items].[Código Objeto] AS codigoObjetoItem, 
                        dbo.Factura.[Id EmpresaV] AS IdEmpresaV, dbo.EmpresaV.[Id Estado] AS IdEstadoEmpresaV, dbo.[Plan de Tratamiento Items].[Descuento % Plan de Tratamiento Items] AS PorcentajeDescuentoItem, 
                        dbo.Entidad.[Nombre Completo Entidad] AS NombrePacienteEPS, dbo.[Plan de Tratamiento].[Documento Paciente] AS DocumentoPacienteEPS, dbo.[Plan de Tratamiento].[Nro Plan de Tratamiento], 
                        dbo.FacturaII.[Descripción FacturaII], 
                        ROUND((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                        > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END) 
                        + dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * (dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] / 100), 0) AS ValorTotalMenosCopagoIva, 
                        ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                        > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END, 0) AS ValorTotalItem, 
                        CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] > 0 AND 
                        dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] / (dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items]
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] + dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * (dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items]
                        / 100)) * 100 ELSE 0 END AS PorcentajeCopago, dbo.[Face Cnsta NumeroItems].CantidadItem AS CantidadDeItems, 
                        CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END AS ValorDescuentoItem,
                        CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 1 END AS Total, 
                        Entidad_1.[Nombre Completo Entidad] AS Vendedor
FROM            dbo.FacturaII INNER JOIN
                        dbo.Factura ON dbo.FacturaII.[Id Factura] = dbo.Factura.[Id Factura] INNER JOIN
                        dbo.EmpresaV ON dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV] INNER JOIN
                        dbo.[Plan de Tratamiento] ON dbo.FacturaII.[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] INNER JOIN
                        dbo.Entidad ON dbo.[Plan de Tratamiento].[Documento Paciente] = dbo.Entidad.[Documento Entidad] INNER JOIN
                        dbo.[Plan de Tratamiento Items] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento Items].[Id Plan de Tratamiento] INNER JOIN
                        dbo.Objeto ON dbo.[Plan de Tratamiento Items].[Código Objeto] = dbo.Objeto.[Código Objeto] INNER JOIN
                        dbo.[Plan de Tratamiento Tratamientos] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento] INNER JOIN
                        dbo.[Face Cnsta NumeroItems] ON dbo.[Plan de Tratamiento Items].[Id Plan de Tratamiento] = dbo.[Face Cnsta NumeroItems].[Id Plan de Tratamiento] INNER JOIN
                        dbo.Entidad AS Entidad_1 ON dbo.[Plan de Tratamiento Tratamientos].[Documento Profesional] = Entidad_1.[Documento Entidad] LEFT OUTER JOIN
                        dbo.[Face Cnsta Cuotas] ON dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento Tratamientos] = dbo.[Face Cnsta Cuotas].[Id Plan de Tratamiento Tratamientos]

GO


CREATE VIEW [dbo].[Face Cnsta FacturaEII Definicion TIpo De Factura]
AS
SELECT        TOP (100) PERCENT ROUND((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items], 0) AS ValorTotalItem, 
                        ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items], 0) AS BaseItemDescuento, 
                        ROUND((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items], 0) AS BaseItemIva, 
                        ROUND(((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items]) * (dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] / 100), 0) AS ValorIvaItem, 
                        dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] AS ValorItem, dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] AS PorcentajeIvaItem, 
                        dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] AS CantidadItem, dbo.Objeto.[Descripción Objeto] AS DescripcionItem, dbo.FacturaII.[Id FacturaII] AS IdFacturaItem, 
                        dbo.Factura.[No Factura] AS NroFactura, dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items] AS ValorDescuentoItem, dbo.[Plan de Tratamiento Items].[Código Objeto] AS codigoObjetoItem, 
                        dbo.Factura.[Id EmpresaV] AS IdEmpresaV, dbo.EmpresaV.[Id Estado] AS IdEstadoEmpresaV, dbo.[Plan de Tratamiento Items].[Descuento % Plan de Tratamiento Items] AS PorcentajeDescuentoItem, 
                        dbo.Entidad.[Nombre Completo Entidad] AS NombrePacienteEPS, dbo.[Plan de Tratamiento].[Documento Paciente] AS DocumentoPacienteEPS, 
                        dbo.[Cuotas Pactadas Inicial Tratamiento].[Capital Faltante Cuotas Pactadas Inicial Tratamiento], dbo.[Plan de Tratamiento].[Nro Plan de Tratamiento]
FROM            dbo.FacturaII INNER JOIN
                        dbo.Factura ON dbo.FacturaII.[Id Factura] = dbo.Factura.[Id Factura] INNER JOIN
                        dbo.EmpresaV ON dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV] INNER JOIN
                        dbo.[Plan de Tratamiento] ON dbo.FacturaII.[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] INNER JOIN
                        dbo.Entidad ON dbo.[Plan de Tratamiento].[Documento Paciente] = dbo.Entidad.[Documento Entidad] INNER JOIN
                        dbo.[Plan de Tratamiento Items] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento Items].[Id Plan de Tratamiento] INNER JOIN
                        dbo.Objeto ON dbo.[Plan de Tratamiento Items].[Código Objeto] = dbo.Objeto.[Código Objeto] INNER JOIN
                        dbo.[Plan de Tratamiento Tratamientos] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento] INNER JOIN
                        dbo.[Cuotas Pactadas Inicial Tratamiento] ON 
                        dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento Tratamientos] = dbo.[Cuotas Pactadas Inicial Tratamiento].[Id Plan de Tratamiento Tratamientos]
WHERE        (dbo.EmpresaV.[Id Estado] = 7) AND (dbo.[Cuotas Pactadas Inicial Tratamiento].[Cuota Nro Cuotas Pactadas Inicial Tratamiento] = 1)

GO


CREATE VIEW [dbo].[Face Cnsta SumaTotalPresupuestoSInDesAdi]
AS
SELECT        dbo.[Plan de Tratamiento].[Nro Plan de Tratamiento], 
                        SUM(ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                        > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END, 0)) AS SumatoriaValores, dbo.[Plan de Tratamiento].[Id Plan de Tratamiento], 
                        SUM((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                        * (1 + dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items]) 
                        * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - dbo.[Plan de Tratamiento].[Descuento Adicional $ Plan de Tratamiento]) AS ValorTotalPresupuesto
FROM            dbo.[Face Cnsta Cuotas] INNER JOIN
                        dbo.[Plan de Tratamiento Tratamientos] ON dbo.[Face Cnsta Cuotas].[Id Plan de Tratamiento Tratamientos] = dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento Tratamientos] RIGHT OUTER JOIN
                        dbo.[Plan de Tratamiento] INNER JOIN
                        dbo.[Plan de Tratamiento Items] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento Items].[Id Plan de Tratamiento] ON 
                        dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Id Plan de Tratamiento]
GROUP BY dbo.[Plan de Tratamiento].[Nro Plan de Tratamiento], dbo.[Plan de Tratamiento].[Id Plan de Tratamiento]

GO


CREATE VIEW [dbo].[Face Cnsta GuiaCuotasNoAnticipos]
AS
SELECT DISTINCT 
                        dbo.Factura.[No Factura], dbo.Factura.[Total Factura], CASE WHEN dbo.Factura.[Total Factura] = ValorTotalPresupuesto THEN 0 ELSE 1 END AS GuiaCuotasNoAnticipos, 
                        dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi].ValorTotalPresupuesto
FROM            dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi] INNER JOIN
                        dbo.[Plan de Tratamiento] ON dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi].[Nro Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Nro Plan de Tratamiento] INNER JOIN
                        dbo.Factura INNER JOIN
                        dbo.FacturaII ON dbo.Factura.[Id Factura] = dbo.FacturaII.[Id Factura] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.FacturaII.[Id Plan de Tratamiento]

GO

CREATE VIEW [dbo].[Face Cnsta GuiaCuotaInicial]
AS
SELECT        dbo.[Face Cnsta NumeroItems].[Id Plan de Tratamiento], MAX(CHARINDEX('Inicial', dbo.FacturaII.[Descripción FacturaII])) AS GuiaCuotaInicial
FROM            dbo.Factura INNER JOIN
                        dbo.FacturaII ON dbo.Factura.[Id Factura] = dbo.FacturaII.[Id Factura] LEFT OUTER JOIN
                        dbo.[Face Cnsta NumeroItems] ON dbo.FacturaII.[Id Plan de Tratamiento] = dbo.[Face Cnsta NumeroItems].[Id Plan de Tratamiento]
GROUP BY dbo.[Face Cnsta NumeroItems].[Id Plan de Tratamiento], dbo.Factura.[No Factura]

GO



CREATE VIEW [dbo].[Face Cnsta TipoDeFactura]
AS
SELECT DISTINCT 
        CHARINDEX('Atención', dbo.FacturaII.[Descripción FacturaII]) AS GuiaFactura, dbo.FacturaII.[Descripción FacturaII] AS DescripcionCopago, dbo.Factura.[No Factura] AS NroFactura, 
        dbo.Factura.[Id EmpresaV] AS IdEmpresaV, dbo.FacturaII.[Id FacturaII] AS IdFacturaItem, CHARINDEX('Cuota', dbo.FacturaII.[Descripción FacturaII]) AS GuiaFacturaNormal, CHARINDEX('de Saldo', 
        dbo.FacturaII.[Descripción FacturaII]) AS GuiaSaldos, SUBSTRING(SUBSTRING(dbo.FacturaII.[Descripción FacturaII], CHARINDEX('de Saldo No ', dbo.FacturaII.[Descripción FacturaII]), 20), CHARINDEX('No ', 
        SUBSTRING(dbo.FacturaII.[Descripción FacturaII], CHARINDEX('de Saldo No ', dbo.FacturaII.[Descripción FacturaII]) - 3, 20)), 20) AS NumeroSaldo, ISNULL(dbo.[Face Cnsta NumeroItems].CantidadItem, 1) 
        AS GuiaCantidadPresupuesto, CHARINDEX('Abono', dbo.FacturaII.[Descripción FacturaII]) AS GuiaAbono, dbo.[Face Cnsta GuiaCuotaInicial].[Id Plan de Tratamiento], 
        dbo.[Face Cnsta GuiaCuotaInicial].GuiaCuotaInicial, dbo.[Face Cnsta GuiaCuotasNoAnticipos].GuiaCuotasNoAnticipos

FROM            dbo.Factura INNER JOIN

        dbo.FacturaII ON dbo.Factura.[Id Factura] = dbo.FacturaII.[Id Factura] LEFT OUTER JOIN
        dbo.[Face Cnsta GuiaCuotasNoAnticipos] ON dbo.Factura.[No Factura] = dbo.[Face Cnsta GuiaCuotasNoAnticipos].[No Factura] LEFT OUTER JOIN
        dbo.[Face Cnsta GuiaCuotaInicial] ON dbo.FacturaII.[Id Plan de Tratamiento] = dbo.[Face Cnsta GuiaCuotaInicial].[Id Plan de Tratamiento] LEFT OUTER JOIN
        dbo.[Face Cnsta NumeroItems] ON dbo.FacturaII.[Id Plan de Tratamiento] = dbo.[Face Cnsta NumeroItems].[Id Plan de Tratamiento]

GO

CREATE VIEW [dbo].[Face Cnsta FacturaSaldos]
AS
SELECT DISTINCT 
                        ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS ValorTotalItem, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII], 0) 
                        AS BaseItemDescuento, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS BaseItemIva, dbo.FacturaII.[Valor Iva $ FacturaII] AS ValorIvaItem, 
                        dbo.FacturaII.[Valor FacturaII] AS ValorItem, dbo.FacturaII.[Valor Iva % FacturaII] AS PorcentajeIvaItem, dbo.FacturaII.[Cantidad FacturaII] AS CantidadItem, 
                        dbo.FacturaII.[Descripción FacturaII] AS DescripcionItemVieja, dbo.FacturaII.[Id FacturaII] AS IdFacturaItem, dbo.Factura.[No Factura] AS NroFactura, dbo.FacturaII.[Descuento $ FacturaII] AS ValorDescuentoItem, 
                        dbo.FacturaII.[Código Objeto] AS codigoObjetoItem, dbo.Factura.[Id EmpresaV] AS IdEmpresaV, dbo.EmpresaV.[Id Estado] AS IdEstadoEmpresaV, dbo.FacturaII.[Descuento % FacturaII] AS PorcentajeDescuentoItem,
                        dbo.Entidad.[Nombre Completo Entidad] AS Vendedor, dbo.FacturaII.[Descripción FacturaII] AS DescripcionItem
FROM            dbo.Tratamiento INNER JOIN
                        dbo.[Saldo Entidad] ON dbo.Tratamiento.[Id Tratamiento] = dbo.[Saldo Entidad].[Id Tratamiento] INNER JOIN
                        dbo.FacturaII INNER JOIN
                        dbo.Factura ON dbo.FacturaII.[Id Factura] = dbo.Factura.[Id Factura] INNER JOIN
                        dbo.EmpresaV ON dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV] INNER JOIN
                        dbo.Entidad ON dbo.Factura.[Documento Paciente] = dbo.Entidad.[Documento Entidad] INNER JOIN
                        dbo.[Face Cnsta TipoDeFactura] ON dbo.Factura.[No Factura] = dbo.[Face Cnsta TipoDeFactura].NroFactura ON dbo.[Saldo Entidad].[Nro Saldo Entidad] = dbo.[Face Cnsta TipoDeFactura].NumeroSaldo

GO


CREATE VIEW [dbo].[Face Cnsta FacturaSaldosOld]
AS
SELECT        ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS ValorTotalItem, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII], 0) 
                        AS BaseItemDescuento, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS BaseItemIva, dbo.FacturaII.[Valor Iva $ FacturaII] AS ValorIvaItem, 
                        dbo.FacturaII.[Valor FacturaII] AS ValorItem, dbo.FacturaII.[Valor Iva % FacturaII] AS PorcentajeIvaItem, dbo.FacturaII.[Cantidad FacturaII] AS CantidadItem, 
                        dbo.FacturaII.[Descripción FacturaII] AS DescripcionItemVieja, dbo.FacturaII.[Id FacturaII] AS IdFacturaItem, dbo.Factura.[No Factura] AS NroFactura, dbo.FacturaII.[Descuento $ FacturaII] AS ValorDescuentoItem, 
                        dbo.FacturaII.[Código Objeto] AS codigoObjetoItem, dbo.Factura.[Id EmpresaV] AS IdEmpresaV, dbo.EmpresaV.[Id Estado] AS IdEstadoEmpresaV, dbo.FacturaII.[Descuento % FacturaII] AS PorcentajeDescuentoItem,
                        dbo.Entidad.[Nombre Completo Entidad] AS Vendedor, dbo.Tratamiento.[Descripción Tratamiento] + ' - Saldo ' + dbo.[Saldo Entidad].[Nro Saldo Entidad] AS DescripcionItem
FROM            dbo.Tratamiento INNER JOIN
                        dbo.[Saldo Entidad] ON dbo.Tratamiento.[Id Tratamiento] = dbo.[Saldo Entidad].[Id Tratamiento] INNER JOIN
                        dbo.FacturaII INNER JOIN
                        dbo.Factura ON dbo.FacturaII.[Id Factura] = dbo.Factura.[Id Factura] INNER JOIN
                        dbo.EmpresaV ON dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV] INNER JOIN
                        dbo.Entidad ON dbo.Factura.[Documento Paciente] = dbo.Entidad.[Documento Entidad] INNER JOIN
                        dbo.[Face Cnsta TipoDeFactura] ON dbo.Factura.[No Factura] = dbo.[Face Cnsta TipoDeFactura].NroFactura ON dbo.[Saldo Entidad].[Nro Saldo Entidad] = dbo.[Face Cnsta TipoDeFactura].NumeroSaldo
WHERE        (dbo.EmpresaV.[Id Estado] = 7)

GO


CREATE VIEW [dbo].[Face Cnsta Login]
AS
SELECT        dbo.Contraseña.[Nombre de Usuario] AS NombreUsuario, dbo.Contraseña.Contraseña AS passwordUsuario, dbo.Entidad.[Nombre Completo Entidad] AS NomUsuario, 
                        dbo.Contraseña.[Documento Entidad] AS DocumentoUsuario
FROM            dbo.Contraseña INNER JOIN
                        dbo.Entidad ON dbo.Contraseña.[Documento Entidad] = dbo.Entidad.[Documento Entidad]

GO


CREATE VIEW [dbo].[Face Cnsta AnticiposVariosItemsConDescuento]
AS
SELECT        dbo.[Plan de Tratamiento].[Nro Plan de Tratamiento], 
                        ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                        > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END, 0) AS ValorTotalItem, dbo.[Plan de Tratamiento].[Descuento Adicional $ Plan de Tratamiento], 
                        dbo.[Plan de Tratamiento].[Descuento Adicional % Plan de Tratamiento], dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi].SumatoriaValores, 
                        ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                        > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END, 0) / dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi].SumatoriaValores AS PorcentajeDescuento, 
                        ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                        > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END, 0) 
                        / dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi].SumatoriaValores * dbo.[Plan de Tratamiento].[Descuento Adicional $ Plan de Tratamiento] AS ValorDescuento, 
                        ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                        > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END, 0) 
                        - ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                        > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END, 0) 
                        / dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi].SumatoriaValores * dbo.[Plan de Tratamiento].[Descuento Adicional $ Plan de Tratamiento] AS TotalItemDescuent, dbo.Factura.[Total Factura], 
                        ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                        > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END, 0) 
                        / dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi].SumatoriaValores * dbo.Factura.[Total Factura] AS ValorAnticipoItem, dbo.[Plan de Tratamiento].[Id Plan de Tratamiento], 
                        dbo.[Plan de Tratamiento Items].[Id Plan de Tratamiento Items]
FROM            dbo.[Face Cnsta Cuotas] INNER JOIN
                        dbo.[Plan de Tratamiento Tratamientos] ON dbo.[Face Cnsta Cuotas].[Id Plan de Tratamiento Tratamientos] = dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento Tratamientos] RIGHT OUTER JOIN
                        dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi] INNER JOIN
                        dbo.[Plan de Tratamiento] INNER JOIN
                        dbo.[Plan de Tratamiento Items] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento Items].[Id Plan de Tratamiento] ON 
                        dbo.[Face Cnsta SumaTotalPresupuestoSInDesAdi].[Nro Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Nro Plan de Tratamiento] INNER JOIN
                        dbo.Factura INNER JOIN
                        dbo.FacturaII ON dbo.Factura.[Id Factura] = dbo.FacturaII.[Id Factura] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.FacturaII.[Id Plan de Tratamiento] ON 
                        dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Id Plan de Tratamiento]

GO



CREATE TABLE [dbo].[ConceptosNotaDebito](
	[idconceptoNotaD] [int] NOT NULL,
	[CodigoConceptoNotaD] [int] NULL,
	[conceptoNotaDebito] [varchar](100) NULL,
    
    )


ALTER TABLE [Nota Débito]
ADD IdConceptoNotaD INT NULL,
NoFactura nvarchar(50) NULL,
EstadoFace INT NULL


CREATE VIEW [dbo].[face Cnsta Nota Debito]
AS
SELECT        dbo.[Nota Débito].[Número Nota Débito] AS NumNotaDebito, dbo.[Nota Débito].[Fecha Nota Débito] AS fechaNotaND, dbo.[Nota Débito].[Documento Entidad] AS EntidadDocumento, 
                        dbo.[Nota Débito].[Valor Nota Débito] AS ValorNotaD, dbo.[Nota Débito].[Valor % Descuento Nota Débito] AS PorcentajeDescuentoND, dbo.[Nota Débito].[Valor $ Descuento Nota Débito] AS ValorDescuentoND, 
                        dbo.[Nota Débito].[Valor % Iva Nota Débito] AS porcentajeIvaND, dbo.[Nota Débito].NoFactura, dbo.[Nota Débito].IdConceptoNotaD, dbo.Entidad.[Nombre Completo Entidad] AS NombreEntidad, dbo.[Nota Débito].EstadoFace
FROM            dbo.[Nota Débito] INNER JOIN
                        dbo.Entidad ON dbo.[Nota Débito].[Documento Entidad] = dbo.Entidad.[Documento Entidad] LEFT OUTER JOIN
                        dbo.ConceptosNotaDebito ON dbo.[Nota Débito].IdConceptoNotaD = dbo.ConceptosNotaDebito.idconceptoNotaD

GO



CREATE VIEW [dbo].[Face Cnsta NotaDebito Entidad]
AS
SELECT        en.[Documento Entidad] AS [Id Entidad], en.[Primer Apellido Entidad] AS FamilyName, en.[Segundo Apellido Entidad] AS secondFamilyName, en.[Primer Nombre Entidad] AS FirstName, 
                        en.[Segundo Nombre Entidad] AS MiddleName, en.[Nombre Completo Entidad] AS NomComplete, e.[Dirección EntidadII] AS [Line Entidad], c.[Código Ciudad] AS CodigoCiudad, c.Ciudad AS CityName, 
                        d.[Código Departamento] AS CodigoDepartamento, d.Departamento, d.[Id País] AS codigoPais, b.Barrio AS citySubdivisionName, td.[Id Tipo de Documento], 
                        td.[Descripción Tipo de Documento] AS DescripcionDocE, e.[E-mail Nro 1 EntidadII] AS emailEntidad, e.[Teléfono No 1 EntidadII] AS telefono, exx.[Autorretenedor EntidadXX] AS AutoRetenedor, 
                        exx.[Gran Contribuyente EntidadXX] AS GranContribuyente, exx.[Id Régimen Tributario] AS regimen, ae.[Código Actividad Económica] AS ActividadEconomica, nd.[Número Nota Débito] AS NumNotaDebito, 
                        e.[Teléfono No 2 EntidadII] AS telefono2, e.[Teléfono Celular EntidadII] AS celular
FROM            dbo.[Actividad Económica] AS ae INNER JOIN
                        dbo.EntidadXX AS exx ON ae.[Id Actividad Económica] = exx.[Id Actividad Económica] RIGHT OUTER JOIN
                        dbo.[Tipo de Documento] AS td INNER JOIN
                        dbo.[Nota Débito] AS nd INNER JOIN
                        dbo.Entidad AS en ON nd.[Documento Entidad] = en.[Documento Entidad] ON td.[Id Tipo de Documento] = en.[Id Tipo de Documento] INNER JOIN
                        dbo.Ciudad AS c INNER JOIN
                        dbo.EntidadII AS e INNER JOIN
                        dbo.Barrio AS b ON e.[Id Barrio] = b.[Id Barrio] ON c.[Id Ciudad] = e.[Id Ciudad] INNER JOIN
                        dbo.Departamento AS d ON d.[Id Departamento] = c.[Id Departamento] ON en.[Documento Entidad] = e.[Documento Entidad] ON exx.[Documento Entidad] = e.[Documento Entidad]

GO


CREATE VIEW [dbo].[Face Cnsta NotaCredito Entidad]
AS
SELECT        en.[Documento Entidad] AS [Id Entidad], en.[Primer Apellido Entidad] AS FamilyName, en.[Segundo Apellido Entidad] AS secondFamilyName, en.[Primer Nombre Entidad] AS FirstName, 
                        en.[Segundo Nombre Entidad] AS MiddleName, en.[Nombre Completo Entidad] AS NomComplete, e.[Dirección EntidadII] AS [Line Entidad], c.[Código Ciudad] AS CodigoCiudad, c.Ciudad AS CityName, 
                        d.[Código Departamento] AS CodigoDepartamento, d.Departamento, d.[Id País] AS codigoPais, b.Barrio AS citySubdivisionName, td.[Id Tipo de Documento], 
                        td.[Descripción Tipo de Documento] AS DescripcionDocE, e.[E-mail Nro 1 EntidadII] AS emailEntidad, e.[Teléfono No 1 EntidadII] AS telefono, exx.[Autorretenedor EntidadXX] AS AutoRetenedor, 
                        exx.[Gran Contribuyente EntidadXX] AS GranContribuyente, exx.[Id Régimen Tributario] AS regimen, ae.[Código Actividad Económica] AS ActividadEconomica, nc.[Número Nota Crédito] AS NumNotaCredito, 
                        e.[Teléfono No 2 EntidadII] AS telefono2, e.[Teléfono Celular EntidadII] AS celular
FROM            dbo.[Actividad Económica] AS ae INNER JOIN
                        dbo.EntidadXX AS exx ON ae.[Id Actividad Económica] = exx.[Id Actividad Económica] RIGHT OUTER JOIN
                        dbo.[Tipo de Documento] AS td INNER JOIN
                        dbo.[Nota Crédito] AS nc INNER JOIN
                        dbo.Entidad AS en ON nc.[Documento Entidad] = en.[Documento Entidad] ON td.[Id Tipo de Documento] = en.[Id Tipo de Documento] INNER JOIN
                        dbo.Ciudad AS c INNER JOIN
                        dbo.EntidadII AS e INNER JOIN
                        dbo.Barrio AS b ON e.[Id Barrio] = b.[Id Barrio] ON c.[Id Ciudad] = e.[Id Ciudad] INNER JOIN
                        dbo.Departamento AS d ON d.[Id Departamento] = c.[Id Departamento] ON en.[Documento Entidad] = e.[Documento Entidad] ON exx.[Documento Entidad] = e.[Documento Entidad]

GO


CREATE  VIEW [dbo].[Face Cnsta Factura]
AS
SELECT DISTINCT 
                        f.[Id EmpresaV] AS IdEmpresaV, f.[No Factura] AS NroFactura, f.[Fecha Factura] AS FechaFactura, f.[Fecha Digitación Factura] AS FechaDigitacionFactura, f.[Iva Factura] AS TotalIvaFactura, 
                        f.[Valor Acumulado Factura] AS SubTotalFactura, f.[Total Factura] - f.[Retención Iva Factura] - f.[Retención Otros Factura] - f.[Retención en la Fuente Factura] AS TotalFactura, 
                        f.[Id Condición de Pago Factura] AS IdCondicionPagoFactura, rcII.[Id Forma de Pago] AS IdFormadePago, fp.[Forma de Pago] AS FormaDePago, b.Banco, rcII.[Número Cuenta Recibo de CajaII] AS NumeroCuentaCredito, 
                        rcII.[Número Comprobante Recibo de CajaII] AS NumeroComprobanteCredito, f.[Descuentos Factura] AS DescuentoFactura, f.[Descuento Adicional % Factura] AS PorcentajeDescuentoFactura, 
                        emV.[Resolución Facturación EmpresaV] AS ResolucionFactura, emV.[Prefijo Resolución Facturación EmpresaV] AS PrefijoFactura, f.[Id Estado] AS EstadoFactura, emV.[Id Estado] AS [EstadoEmpresa.V], 
                        e.Estado AS DescripEstadoFactura, f.EstadoFacturaElectronica, f.[Valor En Letras Factura] AS valorLetrasFactura, f.[Documento Usuario] AS DocumentoUsuarioFactura, f.[Id Terminal] AS IdTerminal, 
                        f.[Fecha Vencimiento Factura] AS FechaVencimientoFactura, f.[Observaciones Factura] AS ObservacionesFactura, f.[Retención en la Fuente Factura] AS ReteFuenteFactura, f.[Retención Iva Factura] AS ReteIvaFactura, 
                        f.[Retención Otros Factura] AS ReteOtrosFactura, f.[Descuento Adicional $ Factura] AS DescuentoGeneral, f.[Valor Acumulado Factura] - f.[Descuentos Factura] AS TotalBrutoDesc, 
                        f.[Valor Acumulado Factura] - f.[Descuentos Factura] + f.[Iva Factura] AS TotalBrutoImpDesc, f.[Retención Iva Factura] / (f.[Valor Acumulado Factura] - f.[Descuentos Factura]) * 100 AS PorcentajeReteIva, 
                        f.[Retención en la Fuente Factura] / (f.[Valor Acumulado Factura] - f.[Descuentos Factura]) * 100 AS PorcentajeReteFuente, f.[Retención Otros Factura] / (f.[Valor Acumulado Factura] - f.[Descuentos Factura]) 
                        * 100 AS PorcentajeReteIca, CONVERT(varchar, f.[Fecha Factura], 8) AS horaFactura, emV.FinResoNc, emV.FechafinalReso, emV.InicioResoNC, emV.FechaResolucionNC, emV.ResolucionNC, emV.PrefijoNC, 
                        dbo.Empresa.[Código Empresa] AS CodigoEmpresa
FROM            dbo.Empresa INNER JOIN
                        dbo.Estado AS e INNER JOIN
                        dbo.Factura AS f INNER JOIN
                        dbo.EmpresaV AS emV ON f.[Id EmpresaV] = emV.[Id EmpresaV] ON e.[Id Estado] = f.[Id Estado] ON dbo.Empresa.[Documento Empresa] = emV.[Documento Empresa] LEFT OUTER JOIN
                        dbo.[Forma de Pago] AS fp INNER JOIN
                        dbo.[Recibo de CajaII] AS rcII INNER JOIN
                        dbo.[Recibo de Caja] AS rc ON rcII.[Id Recibo de Caja] = rc.[Id Recibo de Caja] INNER JOIN
                        dbo.Banco AS b ON b.[Id Banco] = rcII.[Id Banco] ON fp.[Id Forma de Pago] = rcII.[Id Forma de Pago] ON f.[Id Factura] = rc.[Id Factura]
WHERE        (emV.[Id Estado] = 7)
GO

CREATE VIEW [dbo].[Face Cnsta FacturaParticular]
AS
SELECT        TOP (100) PERCENT ROUND((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                         * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items], 0) AS ValorTotalItemOld2, 
                         ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items], 0) AS BaseItemDescuento2, 
                         ROUND((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                         * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items], 0) AS BaseItemIva2, 
                         ROUND(((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] - dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items]) 
                         * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items]) * (dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] / 100), 0) AS ValorIvaItem2, 
                         dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] AS ValorItem2, dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] AS PorcentajeIvaItem2, 
                         dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] AS CantidadItem2, dbo.Objeto.[Descripción Objeto] AS DescripcionItem, dbo.FacturaII.[Id FacturaII] AS IdFacturaItem, 
                         dbo.Factura.[No Factura] AS NroFactura, dbo.[Plan de Tratamiento Items].[Descuento $ Plan de Tratamiento Items] AS ValorDescuento2, dbo.[Plan de Tratamiento Items].[Código Objeto] AS codigoObjetoItem, 
                         dbo.Factura.[Id EmpresaV] AS IdEmpresaV, dbo.EmpresaV.[Id Estado] AS IdEstadoEmpresaV, dbo.[Plan de Tratamiento Items].[Descuento % Plan de Tratamiento Items] AS PorcentajeDescuentoItem2, 
                         dbo.Entidad.[Nombre Completo Entidad] AS NombrePacienteEPS, dbo.[Plan de Tratamiento].[Documento Paciente] AS DocumentoPacienteEPS, dbo.[Plan de Tratamiento].[Nro Plan de Tratamiento], 
                         dbo.FacturaII.[Descripción FacturaII], 
                         ROUND((dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                          > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END) 
                         + dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * (dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items] / 100), 0) AS ValorTotalMenosCopagoIva, 
                         ROUND(dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] - CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento]
                          > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END, 0) AS ValorTotalItem2, 
                         CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END / (dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items]
                          * dbo.[Plan de Tratamiento Items].[Cantidad Plan de Tratamiento Items] + dbo.[Plan de Tratamiento Items].[Valor Plan de Tratamiento Items] * (dbo.[Plan de Tratamiento Items].[Valor Iva % Plan de Tratamiento Items]
                          / 100)) * 100 AS PorcentajeCopago, dbo.[Face Cnsta NumeroItems].CantidadItem AS CantidadDeItems, 
                         CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 0 END AS ValorDescuentoItem2,
                          CASE WHEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] > 0 THEN dbo.[Face Cnsta Cuotas].[Capital Faltante Cuotas Pactadas Inicial Tratamiento] ELSE 1 END AS Total, 
                         ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS ValorTotalItem, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII], 0) 
                         AS BaseItemDescuento, ROUND(dbo.FacturaII.[Valor FacturaII] * dbo.FacturaII.[Cantidad FacturaII] - dbo.FacturaII.[Descuento $ FacturaII], 0) AS BaseItemIva, dbo.FacturaII.[Valor Iva $ FacturaII] AS ValorIvaItem, 
                         dbo.FacturaII.[Valor FacturaII] AS ValorItem, dbo.FacturaII.[Valor Iva % FacturaII] AS PorcentajeIvaItem, dbo.FacturaII.[Cantidad FacturaII] AS CantidadItem, 
                         dbo.FacturaII.[Descuento $ FacturaII] AS ValorDescuentoItem, dbo.FacturaII.[Descuento % FacturaII] AS PorcentajeDescuentoItem, Entidad_1.[Nombre Completo Entidad] AS Vendedor
FROM            dbo.FacturaII INNER JOIN
                         dbo.Factura ON dbo.FacturaII.[Id Factura] = dbo.Factura.[Id Factura] INNER JOIN
                         dbo.EmpresaV ON dbo.Factura.[Id EmpresaV] = dbo.EmpresaV.[Id EmpresaV] INNER JOIN
                         dbo.[Plan de Tratamiento] ON dbo.FacturaII.[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] INNER JOIN
                         dbo.Entidad ON dbo.[Plan de Tratamiento].[Documento Paciente] = dbo.Entidad.[Documento Entidad] INNER JOIN
                         dbo.[Plan de Tratamiento Items] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento Items].[Id Plan de Tratamiento] INNER JOIN
                         dbo.Objeto ON dbo.[Plan de Tratamiento Items].[Código Objeto] = dbo.Objeto.[Código Objeto] INNER JOIN
                         dbo.[Plan de Tratamiento Tratamientos] ON dbo.[Plan de Tratamiento].[Id Plan de Tratamiento] = dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento] INNER JOIN
                         dbo.[Face Cnsta NumeroItems] ON dbo.[Plan de Tratamiento Items].[Id Plan de Tratamiento] = dbo.[Face Cnsta NumeroItems].[Id Plan de Tratamiento] INNER JOIN
                         dbo.Entidad AS Entidad_1 ON dbo.Factura.[Documento Vendedor] = Entidad_1.[Documento Entidad] LEFT OUTER JOIN
                         dbo.[Face Cnsta Cuotas] ON dbo.[Plan de Tratamiento Tratamientos].[Id Plan de Tratamiento Tratamientos] = dbo.[Face Cnsta Cuotas].[Id Plan de Tratamiento Tratamientos]
WHERE        (dbo.EmpresaV.[Id Estado] = 7)

GO
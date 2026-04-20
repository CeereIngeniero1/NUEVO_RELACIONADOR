

Create Table Facturador (
[Id Facturador] int primary key not null,
[Facturador] varchar(80) not null
)


ALTER TABLE CredencialesWSDLFacturaTech
ADD [Id Facturador] INT NULL;


insert into Facturador ([Id Facturador],Facturador) values (1, 'Fenalco')
insert into Facturador ([Id Facturador],Facturador) values (2, 'Facturatech')

select *  from facturador
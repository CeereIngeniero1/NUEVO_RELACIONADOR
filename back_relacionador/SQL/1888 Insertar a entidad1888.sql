--- Proceso manual para insertar los datos de la entidad1888
---Es manual por que se debe corroborar los id y estos debes de coincidir con los id de las tablas de paises, municipios, etnias, discapacidades, sexo identidad genero. con todo 



select * from [Sexo Identidad Genero]

select * from Etnia

select * from Discapacidad

select * from País1888

select * from Ciudad1888

insert into Entidad1888

select 
[Documento Entidad],
6, -- identidad
0, -- talla
0, -- peso
14, -- etnia
'Comunidad etnica',
9, --discapacidad
'Alergias', 
1, -- nacionalidad default colombia
1, -- recidencia default colombia
1, -- municipio recidencia default medellin
'Alergeno'
from Entidad




SELECT  
[Documento Entidad], 
[Id Identidad Genero], 
Talla,
Peso, 
[Id Etnia],
[Comunidad Etnica], 
[Id Discapacidad],
Alergias, 
[Id Pais Nacionalidad],
[Id Pais Recidencia],
[Id Municipio Recidencia],
Alergeno
FROM     Entidad1888

















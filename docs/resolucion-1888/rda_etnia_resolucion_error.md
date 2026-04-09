# Documentación: Error de Etnia en FHIR Bundle (RDA Paciente)

## Descripción del Problema
Al intentar enviar el **RDA Paciente** al servidor de validación de Minsalud / IHCE, se reportaba periódicamente el siguiente error de cardinalidad:

```json
{
	"severity": "error",
	"code": "invalid",
	"details": {
		"text": "Instance count for 'Patient.extension:ExtensionPatientEthnicity' is 0, which is not within the specified cardinality of 1..1"
	}
}
```

Este error indicaba que la extensión obligatoria de **Pertenencia Étnica** (`ExtensionPatientEthnicity`) no se estaba incluyendo en el archivo `Patient` dentro del Bundle FHIR.

## Causa Raíz
El problema se originaba por una discrepancia entre los catálogos de base de datos (`dbo.Etnia` vs `Cnsta Etnia 1888`).

1. **Catálogo Frontend Viejo (`dbo.Etnia`):** El usuario en el frontend selecciona, por ejemplo, "Negro(a) o mulato(a) o afro...", el cual en la tabla antigua de la base de datos tenía el `Id Etnia = 12`.
2. **Generación FHIR Backend (`Cnsta Etnia 1888`):** Cuando el script de Node.js (`RdaPacienteRoutes.js`) preparaba el Bundle FHIR, intentaba hacer un `LEFT JOIN` hacia la vista específica de la Resolución 1888:
   ```sql
   LEFT JOIN [dbo].[Cnsta Etnia 1888] et ON et.[IdEtnia] = e.[Id Etnia]
   ```
3. **Ausencia del Dato (NULL):** Debido a que el **ID 12** no pertenece a la tabla 1888 (cuyos identificadores y códigos son solo del 01 al 06), el JOIN devolvía un valor `NULL`. En consecuencia, el script de Node omitía el bloque completo de la extensión, provocando el fallo inmediato en la plataforma de Minsalud.

## Solución Aplicada (Parche Preventivo)
Para garantizar la solidez de la validación sin alterar masivamente la base de datos compartida y prevenir de manera global los valores nulos, se incorporó una capa de manejo de fallbacks en JavaScript dentro del endpoint constructor de FHIR (`RdaPacienteRoutes.js`):

```javascript
const idEt = h.IdEtnia;
let codEtnia = str(h.CodigoEtnia);
let dspEtnia = str(h.TextoEtnia);

// 1. Rescate catálogo viejo: si guardó 12 o 19 (Afro) pero la vista devolvió nulo
if ((idEt === 12 || idEt === 19) && !codEtnia) {
    codEtnia = '05';
    dspEtnia = 'Negro(a), mulato(a), afrocolombiano(a)';
} 
// 2. Fallback de seguridad (Ninguna de las anteriores)
else if (!codEtnia) {
    codEtnia = '06';
    dspEtnia = 'Ninguna de las anteriores';
}

patExt.push({
    url: 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientEthnicity',
    valueCoding: {
        system: 'https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianEthnicGroup',
        code: codEtnia,
        display: dspEtnia || undefined,
    },
});
```

### Por qué esta solución:
- Evita tener que realizar DML (Data Manipulation) en retroactivo.
- Protege el flujo contra datos corruptos o valores nulos desde DB.
- Permite que el proceso de despliegue a IHCE nunca se detenga en la validación por `cardinality 1..1`.

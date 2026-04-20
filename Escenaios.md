1. El paciente "Completamente Sano" (Sin antecedentes)
¿Qué probar?: Crea un RDA Paciente pero no le agregues nada: ni problemas de ingreso, ni antecedentes familiares, ni medicamentos, ni alergias.
¿Por qué puede fallar?: Según el perfil CompositionPatientStatementRDA, las 4 secciones (medicamentos, enfermedades, familia, alergias) son obligatorias. Si un paciente no tiene nada, tu sistema debe enviar correctamente una etiqueta de "Texto Libre" (Narrative) que diga "No se conocen alergias" o "Sin antecedentes", en vez de enviar una matriz vacía ([]), lo cual causaría un error de valididad FHIR en el Ministerio.
2. El Paciente Extranjero / Rural
¿Qué probar?: Crea un paciente que tenga:
Tipo Documento: Pasaporte (PA) o PEP (Permiso Especial).
País de Nacionalidad o País de Residencia diferente a Colombia (Código diferente a 170).
Zona de Residencia: Rural.
¿Por qué puede fallar?: Cuando la persona vive fuera de Colombia, a menudo los sistemas tratan de enviar códigos estructurales DIVIPOLA (códigos de municipios) que solo existen en Colombia. El Ministerio rechazará el paquete si intentas usar DIVIPOLA sobre un país extranjero.
3. Códigos CIE-10 o CIE-11 atípicos o muy nuevos
¿Qué probar?: Existen diagnósticos poco frecuentes, o algunos que el Ministerio no ha actualizado bien en su diccionario de Sandbox. Prueba enviando un diagnóstico por causa externa o un código general de rutina (Ej: Z000 - Examen médico general).
¿Por qué puede fallar?: Si el IHCE no reconoce el código CIE dentro del componente terminology, retornará un error diciendo que el código no pertenece al CodeSystem estipulado.
4. Fechas y Horas (Atención Relámpago o Asincrónica)
¿Qué probar?:
Coloca exactamente la misma hora de inicio y de fin de atención (ej. 08:00 AM inicio y 08:00 AM fin).
Pon una hora de fin que sea anterior a la de inicio (ej. Inicio 09:00 AM, Fin 08:30 AM).
¿Por qué puede fallar?: Los validadores de fecha del Ministerio son estrictos. El tiempo de fin siempre debe ser matemáticamente mayor o igual al de inicio dentro del FHIR Encounter o Composition.date.
5. Caracteres "Peligrosos" en el texto libre
¿Qué probar?: En los campos de descripción (por ejemplo, en las observaciones de un medicamento, o de un antecedente), escribe algo que contenga:
Comillas, diagonales o símbolos especiales: Pcte. "Crítico" con Tº alta & dolor en <brazo>.
Saltos de línea repetidos.
¿Por qué puede fallar?: El servidor del Ministerio es en tecnología .NET / JSON-FHIR. Si tus comillas (") o símbolos Menor/Mayor (< >) rompen la estructura JSON al codificarse, el Ministerio devolverá un error HTTP 400 (Bad Request).
6. Paciente sin Segundo Nombre / Segundo Apellido
¿Qué probar?: Ingresa alguien llamado simplemente "Juan Perez" dejando explícitamente vacíos el segundo nombre y segundo apellido.
¿Por qué puede fallar?: Tu código envía los apellidos a extensiones y matrices diferentes (padre/madre). Si el código intenta leer el campo vacío y lo envía como null explícito en vez de quitarlo, FHIR lo rechaza porque no permite campos vacíos ({ "family": null } no es válido en IHCE).
Sugerencia de Metodología: Ejecuta estos 6 escenarios guardándolos en el formulario y dándole al botón de Enviar a Ministerio (IHCE). Si los 6 te responden un código 201 Created o 200 OK, tienes una arquitectura muy robusta lista para certificación en Producción.
post: http://localhost:3000/apiV3/RdaPaciente/FhirBundle

{
	"resourceType": "Bundle",
	"type": "document",
	"timestamp": "2026-04-01T18:37:56.000Z",
	"entry": [
		{
			"resource": {
				"resourceType": "Composition",
				"id": "Composition-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/CompositionPatientStatementRDA"
					]
				},
				"status": "final",
				"type": {
					"coding": [
						{
							"system": "http://loinc.org",
							"code": "102089-0",
							"display": "FHIR resource patient medical record"
						}
					],
					"text": "FHIR resource patient medical record"
				},
				"date": "2026-04-01T18:37:56.000Z",
				"title": "Resumen Digital de Atención en Salud - RDA de antecedentes manifestados por el paciente",
				"confidentiality": "N",
				"event": [
					{
						"period": {
							"start": "2026-03-31T13:32:00.000Z",
							"end": "2026-04-01T13:32:00.000Z"
						},
						"code": [
							{
								"coding": [
									{
										"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality",
										"code": "01",
										"display": "Intramural"
									}
								],
								"text": "Intramural"
							},
							{
								"coding": [
									{
										"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/GrupoServicios",
										"code": "01",
										"display": "Consulta externa"
									}
								],
								"text": "Consulta externa"
							}
						]
					}
				],
				"subject": {
					"reference": "#CC-79487913"
				},
				"custodian": {
					"reference": "#0500112124"
				},
				"author": [
					{
						"reference": "#CC-1020780822"
					}
				],
				"section": [
					{
						"title": "Diagnóstico de ingreso (CIE-11)",
						"entry": [
							{
								"reference": "#ConditionIngreso-0"
							}
						]
					},
					{
						"title": "Antecedentes farmacológicos",
						"emptyReason": {
							"coding": [
								{
									"system": "http://terminology.hl7.org/CodeSystem/list-empty-reason",
									"code": "nilknown",
									"display": "Nil Known"
								}
							],
							"text": "No se registran antecedentes farmacológicos"
						}
					},
					{
						"title": "Antecedentes alérgicos",
						"emptyReason": {
							"coding": [
								{
									"system": "http://terminology.hl7.org/CodeSystem/list-empty-reason",
									"code": "nilknown",
									"display": "Nil Known"
								}
							],
							"text": "No se conocen alergias"
						}
					},
					{
						"title": "Antecedentes patológicos",
						"entry": [
							{
								"reference": "#Condition-0"
							}
						]
					},
					{
						"title": "Antecedentes familiares",
						"entry": [
							{
								"reference": "#FamilyMemberHistory-0"
							}
						]
					}
				]
			}
		},
		{
			"resource": {
				"resourceType": "Patient",
				"id": "CC-79487913",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/PatientRDA"
					]
				},
				"extension": [
					{
						"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientNationality",
						"valueCoding": {
							"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661",
							"code": "170",
							"display": "COLOMBIA"
						}
					},
					{
						"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientEthnicity",
						"valueCoding": {
							"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianEthnicGroup",
							"code": "5",
							"display": "Negro(a) o mulato(a) o afrocolombiano(a) o afrodescendiente"
						}
					},
					{
						"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientEthnicCommunity",
						"valueString": "16"
					},
					{
						"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientDisability",
						"valueCoding": {
							"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDisabilityClassification",
							"code": "02",
							"display": "Discapacidad visual"
						}
					},
					{
						"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionPatientGenderIdentity",
						"valueCoding": {
							"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderIdentity",
							"code": "01",
							"display": "Masculino"
						}
					}
				],
				"identifier": [
					{
						"id": "NationalPersonIdentifier-0",
						"use": "official",
						"type": {
							"coding": [
								{
									"system": "http://terminology.hl7.org/CodeSystem/v2-0203",
									"code": "PN",
									"display": "Person number"
								},
								{
									"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier",
									"code": "CC",
									"display": "Cédula ciudadanía"
								}
							]
						},
						"system": "https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC",
						"value": "79487913"
					}
				],
				"active": true,
				"name": [
					{
						"use": "official",
						"family": "Rincon",
						"_family": {
							"extension": [
								{
									"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionFathersFamilyName",
									"valueString": "Rincon"
								},
								{
									"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionMothersFamilyName",
									"valueString": "Carranza"
								}
							]
						},
						"given": [
							"Milton",
							"Horacio"
						]
					}
				],
				"gender": "male",
				"_gender": {
					"extension": [
						{
							"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionBiologicalGender",
							"valueCoding": {
								"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianGenderGroup",
								"code": "01",
								"display": "Hombre"
							}
						}
					]
				},
				"birthDate": "1969-09-28",
				"_birthDate": {
					"extension": [
						{
							"url": "http://hl7.org/fhir/StructureDefinition/patient-birthTime",
							"valueDateTime": "1969-09-28T10:00:00.000Z"
						}
					]
				},
				"deceasedBoolean": false,
				"telecom": [
					{
						"system": "phone",
						"value": "(318)-433-31-71"
					}
				],
				"address": [
					{
						"id": "HomeAddress-0",
						"use": "home",
						"type": "physical",
						"extension": [
							{
								"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionResidenceZone",
								"valueCoding": {
									"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianResidenceZone",
									"code": "01",
									"display": "Urbana"
								}
							}
						],
						"line": [
							"Calle 7 # 39-197 Consultorio 1215"
						],
						"city": "MEDELLÍN",
						"_city": {
							"extension": [
								{
									"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionDivipolaMunicipality",
									"valueCoding": {
										"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/DIVIPOLA",
										"code": "5001"
									}
								}
							]
						},
						"country": "COLOMBIA",
						"_country": {
							"extension": [
								{
									"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionCountryCode",
									"valueCoding": {
										"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ISO31661",
										"code": "170"
									}
								}
							]
						}
					}
				],
				"managingOrganization": {
					"reference": "#EPS005",
					"display": "ENTIDAD PROMOTORA DE SALUD SANITAS S.A.S."
				}
			}
		},
		{
			"resource": {
				"resourceType": "Practitioner",
				"id": "CC-1020780822",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/PractitionerRDA"
					]
				},
				"identifier": [
					{
						"id": "NationalPersonIdentifier-0",
						"use": "official",
						"type": {
							"coding": [
								{
									"system": "http://terminology.hl7.org/CodeSystem/v2-0203",
									"code": "PN",
									"display": "Person number"
								},
								{
									"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier",
									"code": "CC",
									"display": "Cédula ciudadanía"
								}
							]
						},
						"system": "https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC",
						"value": "1020780822"
					}
				],
				"active": true
			}
		},
		{
			"resource": {
				"resourceType": "Organization",
				"id": "0500112124",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/CareDeliveryOrganizationRDA"
					]
				},
				"active": true,
				"name": "Grupo Médico Especializado Medellin S.A.S",
				"identifier": [
					{
						"id": "TaxIdentifier",
						"use": "official",
						"type": {
							"coding": [
								{
									"system": "http://terminology.hl7.org/CodeSystem/v2-0203",
									"code": "TAX",
									"display": "Tax ID number"
								},
								{
									"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers",
									"code": "NIT",
									"display": "Número de Identificación Tributaria"
								}
							]
						},
						"system": "https://fhir.minsalud.gov.co/rda/NamingSystem/DIAN",
						"value": "900479959"
					},
					{
						"id": "HealthcareProviderIdentifier",
						"use": "official",
						"type": {
							"coding": [
								{
									"system": "http://terminology.hl7.org/CodeSystem/v2-0203",
									"code": "PRN",
									"display": "Provider number"
								},
								{
									"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers",
									"code": "CodigoPrestador",
									"display": "Código de habilitación de prestador de servicios de salud"
								}
							]
						},
						"system": "https://fhir.minsalud.gov.co/rda/NamingSystem/REPS",
						"value": "0500112124"
					}
				]
			}
		},
		{
			"resource": {
				"resourceType": "Organization",
				"id": "EPS005",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/HealthBenefitPlanAdminOrganizationRDA"
					]
				},
				"identifier": [
					{
						"system": "https://fhir.minsalud.gov.co/rda/NamingSystem/EAPBS",
						"value": "EPS005"
					}
				],
				"active": true,
				"name": "ENTIDAD PROMOTORA DE SALUD SANITAS S.A.S."
			}
		},
		{
			"resource": {
				"resourceType": "Observation",
				"id": "Observation-Talla-0",
				"status": "final",
				"category": [
					{
						"coding": [
							{
								"system": "http://terminology.hl7.org/CodeSystem/observation-category",
								"code": "vital-signs",
								"display": "Vital Signs"
							}
						]
					}
				],
				"code": {
					"coding": [
						{
							"system": "http://loinc.org",
							"code": "8302-2",
							"display": "Body height"
						}
					]
				},
				"subject": {
					"reference": "#CC-79487913"
				},
				"valueQuantity": {
					"value": 176,
					"unit": "cm",
					"system": "http://unitsofmeasure.org",
					"code": "cm"
				}
			}
		},
		{
			"resource": {
				"resourceType": "Observation",
				"id": "Observation-Peso-0",
				"status": "final",
				"category": [
					{
						"coding": [
							{
								"system": "http://terminology.hl7.org/CodeSystem/observation-category",
								"code": "vital-signs",
								"display": "Vital Signs"
							}
						]
					}
				],
				"code": {
					"coding": [
						{
							"system": "http://loinc.org",
							"code": "29463-7",
							"display": "Body weight"
						}
					]
				},
				"subject": {
					"reference": "#CC-79487913"
				},
				"valueQuantity": {
					"value": 90,
					"unit": "kg",
					"system": "http://unitsofmeasure.org",
					"code": "kg"
				}
			}
		},
		{
			"resource": {
				"resourceType": "Condition",
				"id": "ConditionIngreso-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/ConditionStatementRDA"
					]
				},
				"subject": {
					"reference": "#CC-79487913"
				},
				"code": {
					"coding": [
						{
							"system": "http://hl7.org/fhir/sid/icd-11",
							"code": "5B58",
							"display": "Deficiencia de vitamina E"
						}
					],
					"text": "Deficiencia de vitamina E"
				}
			}
		},
		{
			"resource": {
				"resourceType": "Condition",
				"id": "Condition-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/ConditionStatementRDA"
					]
				},
				"subject": {
					"reference": "#CC-79487913"
				},
				"code": {
					"coding": [
						{
							"system": "http://hl7.org/fhir/sid/icd-10",
							"code": "A030",
							"display": "SHIGELOSIS DEBIDA A SHIGELLA DYSENTERIAE"
						}
					],
					"text": "SHIGELOSIS DEBIDA A SHIGELLA DYSENTERIAE"
				}
			}
		},
		{
			"resource": {
				"resourceType": "FamilyMemberHistory",
				"id": "FamilyMemberHistory-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/FamilyMemberHistoryRDA"
					]
				},
				"status": "completed",
				"patient": {
					"reference": "#CC-79487913"
				},
				"relationship": {
					"coding": [
						{
							"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ParentescoAntecedente",
							"code": "02",
							"display": "Hermanos"
						}
					]
				},
				"condition": [
					{
						"code": {
							"coding": [
								{
									"system": "http://hl7.org/fhir/sid/icd-10",
									"code": "A021",
									"display": "SEPSIS DEBIDA A SALMONELLA"
								}
							],
							"text": "SEPSIS DEBIDA A SALMONELLA"
						}
					}
				]
			}
		}
	]
}

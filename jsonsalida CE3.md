post: http://localhost:3000/apiV3/RdaConsultaExterna/FhirBundle

enviamos:
{
  "IdEvaluacionEntidadRDACE": 7
}

200 ok: 

{
	"resourceType": "Bundle",
	"type": "document",
	"timestamp": "2026-04-02T00:54:52.000Z",
	"entry": [
		{
			"resource": {
				"resourceType": "Composition",
				"id": "Composition-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/CompositionAmbulatoryRDA"
					]
				},
				"status": "final",
				"type": {
					"coding": [
						{
							"system": "http://loinc.org",
							"code": "51845-6",
							"display": "Outpatient Consult note"
						}
					]
				},
				"subject": {
					"reference": "#CC-79487913"
				},
				"encounter": {
					"reference": "#Encounter-0"
				},
				"date": "2026-04-02T00:54:52.000Z",
				"author": [
					{
						"reference": "#SI-1017177741"
					}
				],
				"title": "Resumen Digital de Atención en Salud - RDA de consulta externa",
				"confidentiality": "N",
				"attester": [
					{
						"mode": "legal",
						"party": {
							"reference": "#SI-1017177741"
						}
					}
				],
				"custodian": {
					"reference": "#0500112124"
				},
				"event": [
					{
						"period": {
							"start": "2026-04-01T19:52:00.000Z",
							"end": "2026-04-01T19:52:00.000Z"
						}
					}
				],
				"section": [
					{
						"title": "Entidad(es) responsable(s) por el plan de beneficios en salud (consulta)",
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "48768-6",
									"display": "Payment sources Document"
								}
							]
						},
						"entry": [
							{
								"reference": "#EPS010"
							}
						]
					},
					{
						"title": "Otros datos demográficos",
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "74208-0",
									"display": "Demographic information + History of occupation Document"
								}
							]
						},
						"emptyReason": {
							"coding": [
								{
									"system": "http://terminology.hl7.org/CodeSystem/list-empty-reason",
									"code": "nilknown",
									"display": "Nil Known"
								}
							],
							"text": "Sin información registrada"
						}
					},
					{
						"title": "Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)",
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "105583-9",
									"display": "Worker Sick leave form"
								}
							]
						},
						"entry": [
							{
								"reference": "#Observation-0"
							}
						]
					},
					{
						"title": "Historial de diagnósticos de problemas de salud",
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "11450-4",
									"display": "Problem list - Reported"
								}
							]
						},
						"entry": [
							{
								"reference": "#Condition-0"
							},
							{
								"reference": "#Condition-1"
							}
						]
					},
					{
						"title": "Historial de alergias, intolerancias y reacciones adversas",
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "48765-2",
									"display": "Allergies and adverse reactions Document"
								}
							]
						},
						"entry": [
							{
								"reference": "#AllergyIntolerance-0"
							}
						]
					},
					{
						"title": "Factores de riesgo",
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "75492-9",
									"display": "Risk assessment and screening note"
								}
							]
						},
						"entry": [
							{
								"reference": "#RiskAssessment-0"
							}
						]
					},
					{
						"title": "Historial de medicamentos",
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "10160-0",
									"display": "History of Medication use Narrative"
								}
							]
						},
						"entry": [
							{
								"reference": "#MedicationRequest-0"
							}
						]
					},
					{
						"title": "Órdenes, prescripciones o solicitudes de servicio",
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "61146-1",
									"display": "Orders for services Document"
								}
							]
						},
						"entry": [
							{
								"reference": "#ServiceRequest-0"
							}
						]
					},
					{
						"title": "Documentos de soporte",
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "55107-7",
									"display": "Addendum Document"
								}
							]
						},
						"emptyReason": {
							"coding": [
								{
									"system": "http://terminology.hl7.org/CodeSystem/list-empty-reason",
									"code": "nilknown",
									"display": "Nil Known"
								}
							],
							"text": "Sin información registrada"
						}
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
						"valueString": "19"
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
				"birthDate": "1969-09-29",
				"_birthDate": {
					"extension": [
						{
							"url": "http://hl7.org/fhir/StructureDefinition/patient-birthTime",
							"valueDateTime": "1969-09-29T06:00:00.000Z"
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
					"reference": "#EPS010",
					"display": "EPS SURAMERICANA S.A."
				}
			}
		},
		{
			"resource": {
				"resourceType": "Encounter",
				"id": "Encounter-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/EncounterAmbulatoryRDA"
					]
				},
				"extension": [
					{
						"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionDischargeDisposition",
						"extension": [
							{
								"url": "DispositionCode",
								"valueCoding": {
									"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/CondicionyDestinoUsuarioEgreso",
									"code": "04"
								}
							},
							{
								"url": "ReferenceOrganization",
								"valueReference": {
									"reference": "#0500112124"
								}
							}
						]
					}
				],
				"identifier": [
					{
						"id": "EncounterIdentifier",
						"use": "usual",
						"system": "https://fhir.minsalud.gov.co/rda/NamingSystem/Encounters",
						"value": "RDACE-7"
					}
				],
				"status": "finished",
				"class": {
					"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
					"code": "AMB",
					"display": "ambulatory"
				},
				"type": [
					{
						"coding": [
							{
								"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality",
								"code": "04",
								"display": "Extramural jornada de salud"
							}
						]
					},
					{
						"coding": [
							{
								"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/GrupoServicios",
								"code": "02",
								"display": "Apoyo diagnóstico y complementación terapéutica"
							}
						]
					},
					{
						"coding": [
							{
								"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/EntornoAtencion",
								"code": "03"
							}
						]
					}
				],
				"subject": {
					"reference": "#CC-79487913"
				},
				"participant": [
					{
						"id": "AttenderPhysician",
						"type": [
							{
								"coding": [
									{
										"system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
										"code": "ATND",
										"display": "attender"
									}
								]
							}
						],
						"individual": {
							"reference": "#SI-1017177741"
						}
					}
				],
				"period": {
					"start": "2026-04-01T19:52:00.000Z",
					"end": "2026-04-01T19:52:00.000Z"
				},
				"reasonCode": [
					{
						"coding": [
							{
								"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSCausaExternaVersion2",
								"code": "42",
								"display": "Atención de población materno perinatal"
							}
						]
					}
				],
				"diagnosis": [
					{
						"id": "MainDiagnosis",
						"extension": [
							{
								"url": "https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionDiagnosisType",
								"valueCodeableConcept": {
									"coding": [
										{
											"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSTipoDiagnosticoPrincipalVersion2",
											"code": "02"
										}
									]
								}
							}
						],
						"condition": {
							"reference": "#Condition-0"
						},
						"use": {
							"coding": [
								{
									"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDiagnosisRole",
									"code": "8319008",
									"display": "diagnóstico primario"
								}
							]
						},
						"rank": 1
					}
				],
				"serviceProvider": {
					"reference": "#0500112124"
				}
			}
		},
		{
			"resource": {
				"resourceType": "Practitioner",
				"id": "SI-1017177741",
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
									"code": "SI",
									"display": "Sin identificación"
								}
							]
						},
						"system": "https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC",
						"value": "1017177741"
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
				"name": "IPS (0500112124)",
				"identifier": [
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
				"id": "EPS010",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/HealthBenefitPlanAdminOrganizationRDA"
					]
				},
				"identifier": [
					{
						"use": "official",
						"type": {
							"coding": [
								{
									"system": "http://terminology.hl7.org/CodeSystem/v2-0203",
									"code": "NIIP",
									"display": "National Insurance Payor Identifier"
								},
								{
									"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianOrganizationIdentifiers",
									"code": "EAPB",
									"display": "Entidad Administradora de Planes de Beneficios"
								}
							]
						},
						"system": "https://fhir.minsalud.gov.co/rda/NamingSystem/EAPB",
						"value": "EPS010"
					}
				],
				"active": true,
				"name": "EPS SURAMERICANA S.A."
			}
		},
		{
			"resource": {
				"resourceType": "Condition",
				"id": "Condition-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/ConditionRDA"
					]
				},
				"clinicalStatus": {
					"coding": [
						{
							"system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
							"code": "active",
							"display": "Active"
						}
					]
				},
				"verificationStatus": {
					"coding": [
						{
							"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
							"code": "confirmed",
							"display": "Confirmed"
						}
					]
				},
				"category": [
					{
						"coding": [
							{
								"system": "http://terminology.hl7.org/CodeSystem/condition-category",
								"code": "encounter-diagnosis",
								"display": "Encounter Diagnosis"
							}
						]
					}
				],
				"subject": {
					"reference": "#CC-79487913"
				},
				"code": {
					"coding": [
						{
							"system": "http://hl7.org/fhir/sid/icd-10",
							"code": "A060",
							"display": "DISENTERIA AMEBIANA AGUDA"
						},
						{
							"system": "http://hl7.org/fhir/sid/icd-11",
							"code": "DD91.00",
							"display": "Síndrome del intestino irritable con predominio de estreñimiento"
						}
					],
					"text": "DISENTERIA AMEBIANA AGUDA"
				}
			}
		},
		{
			"resource": {
				"resourceType": "Condition",
				"id": "Condition-1",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/ConditionRDA"
					]
				},
				"clinicalStatus": {
					"coding": [
						{
							"system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
							"code": "active",
							"display": "Active"
						}
					]
				},
				"verificationStatus": {
					"coding": [
						{
							"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
							"code": "confirmed",
							"display": "Confirmed"
						}
					]
				},
				"category": [
					{
						"coding": [
							{
								"system": "http://terminology.hl7.org/CodeSystem/condition-category",
								"code": "encounter-diagnosis",
								"display": "Encounter Diagnosis"
							}
						]
					}
				],
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
				"resourceType": "AllergyIntolerance",
				"id": "AllergyIntolerance-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/AllergyIntoleranceRDA"
					]
				},
				"clinicalStatus": {
					"coding": [
						{
							"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
							"code": "active"
						}
					]
				},
				"verificationStatus": {
					"coding": [
						{
							"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
							"code": "confirmed"
						}
					]
				},
				"category": [
					"environment"
				],
				"code": {
					"text": "04"
				},
				"patient": {
					"reference": "#CC-79487913"
				}
			}
		},
		{
			"resource": {
				"resourceType": "RiskAssessment",
				"id": "RiskAssessment-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/RiskFactorRDA"
					]
				},
				"status": "final",
				"subject": {
					"reference": "#CC-79487913"
				},
				"code": {
					"coding": [
						{
							"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/TipoFactorRiesgo",
							"code": "04"
						}
					],
					"text": "Comportamental"
				},
				"prediction": []
			}
		},
		{
			"resource": {
				"resourceType": "MedicationRequest",
				"id": "MedicationRequest-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/MedicationRequestRDA"
					]
				},
				"status": "active",
				"intent": "order",
				"medicationCodeableConcept": {
					"coding": [
						{
							"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/MIPRES",
							"code": "10024",
							"display": "CRISABOROL"
						}
					],
					"text": "CRISABOROL"
				},
				"subject": {
					"reference": "#CC-79487913"
				},
				"authoredOn": "2026-04-01T19:54:00.000Z",
				"dosageInstruction": [
					{
						"route": {
							"text": "03 - Intramuscular (IM)"
						},
						"doseAndRate": [
							{
								"doseQuantity": {
									"value": 6,
									"unit": "UI"
								}
							}
						],
						"timing": {
							"repeat": {
								"frequency": 6,
								"periodUnit": "h",
								"duration": 6,
								"durationUnit": "d"
							}
						}
					}
				]
			}
		},
		{
			"resource": {
				"resourceType": "ServiceRequest",
				"id": "ServiceRequest-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/ServiceRequestRDA"
					]
				},
				"status": "active",
				"intent": "order",
				"code": {
					"coding": [
						{
							"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS",
							"code": "890114",
							"display": "ATENCION [VISITA] DOMICILIARIA POR PROMOTOR DE LA SALUD"
						}
					],
					"text": "ATENCION [VISITA] DOMICILIARIA POR PROMOTOR DE LA SALUD"
				},
				"subject": {
					"reference": "#CC-79487913"
				},
				"authoredOn": "2026-04-01T19:54:00.000Z"
			}
		},
		{
			"resource": {
				"resourceType": "Observation",
				"id": "Observation-0",
				"meta": {
					"profile": [
						"https://fhir.minsalud.gov.co/rda/StructureDefinition/AttendanceAllowanceRDA"
					]
				},
				"status": "final",
				"code": {
					"coding": [
						{
							"system": "http://loinc.org",
							"code": "105583-9",
							"display": "Worker Sick leave form"
						}
					],
					"text": "Datos de incapacidad"
				},
				"subject": {
					"reference": "#CC-79487913"
				},
				"valueCodeableConcept": {
					"coding": [
						{
							"system": "https://fhir.minsalud.gov.co/rda/CodeSystem/AlcanceIncapacidad",
							"code": "02"
						}
					]
				},
				"component": [
					{
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "74010-0",
									"display": "Disability days"
								}
							]
						},
						"valueQuantity": {
							"value": 6,
							"unit": "d",
							"system": "http://unitsofmeasure.org",
							"code": "d"
						}
					},
					{
						"code": {
							"coding": [
								{
									"system": "http://loinc.org",
									"code": "52473-6",
									"display": "Maternity leave days"
								}
							]
						},
						"valueQuantity": {
							"value": 6,
							"unit": "d",
							"system": "http://unitsofmeasure.org",
							"code": "d"
						}
					}
				]
			}
		}
	]
}
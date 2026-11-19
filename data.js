/* ==========================================================================
   ESG 360 · Datos maestros
   Checklist condicional · Repositorio normativo · Factores de emisión
   Autor: Miguel Ángel Layunta López
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   1. CHECKLIST DINÁMICO Y CONDICIONAL
   t: bool | text | num | date | select
   when: función que evalúa las respuestas previas (lógica condicional)
   -------------------------------------------------------------------------- */
const CHECKLIST = [
  /* A. Gobernanza y SGA */
  {id:'A1', sec:'A. Gobernanza y SGA', t:'bool', q:'¿Existe una política ambiental aprobada por la dirección y comunicada a toda la organización?', ref:'ISO 14001:2015 §5.2', std:'ISO 14001'},
  {id:'A2', sec:'A. Gobernanza y SGA', t:'bool', q:'¿El alcance del SGA está documentado, delimitado y actualizado?', ref:'ISO 14001:2015 §4.3', std:'ISO 14001'},
  {id:'A3', sec:'A. Gobernanza y SGA', t:'bool', q:'¿Se han identificado las partes interesadas y sus requisitos pertinentes?', ref:'ISO 14001:2015 §4.2', std:'ISO 14001'},
  {id:'A4', sec:'A. Gobernanza y SGA', t:'bool', q:'¿Existe un registro de requisitos legales y otros requisitos actualizado?', ref:'ISO 14001:2015 §6.1.3', std:'ISO 14001'},
  {id:'A5', sec:'A. Gobernanza y SGA', t:'date', q:'Fecha de la última evaluación del cumplimiento legal', ref:'ISO 14001:2015 §9.1.2', std:'ISO 14001'},
  {id:'A6', sec:'A. Gobernanza y SGA', t:'bool', q:'¿Se dispone de certificación ISO 14001 vigente?', ref:'ISO 14001:2015', std:'ISO 14001'},
  {id:'A7', sec:'A. Gobernanza y SGA', t:'text', q:'Nº de certificado y entidad certificadora acreditada', when:a=>a.A6===true, ref:'ISO/IEC 17021-1:2015', std:'ISO 17021'},
  {id:'A8', sec:'A. Gobernanza y SGA', t:'date', q:'Fecha de caducidad del certificado ISO 14001', when:a=>a.A6===true, ref:'ISO/IEC 17021-1:2015', std:'ISO 17021'},
  {id:'A9', sec:'A. Gobernanza y SGA', t:'bool', q:'¿La organización está adherida al Reglamento EMAS?', ref:'Reglamento (CE) 1221/2009', std:'EMAS'},
  {id:'A10', sec:'A. Gobernanza y SGA', t:'text', q:'Nº de registro EMAS', when:a=>a.A9===true, ref:'Reglamento (CE) 1221/2009', std:'EMAS'},

  /* B. Aspectos e impactos */
  {id:'B1', sec:'B. Aspectos e impactos', t:'bool', q:'¿Se ha realizado una identificación y evaluación de aspectos ambientales?', ref:'ISO 14001:2015 §6.1.2', std:'ISO 14001'},
  {id:'B2', sec:'B. Aspectos e impactos', t:'bool', q:'¿Se revisa la evaluación al menos anualmente o ante cambios significativos?', when:a=>a.B1===true, ref:'ISO 14001:2015 §6.1.2', std:'ISO 14001'},
  {id:'B3', sec:'B. Aspectos e impactos', t:'bool', q:'¿Se contemplan condiciones anormales y situaciones de emergencia?', when:a=>a.B1===true, ref:'ISO 14001:2015 §8.2', std:'ISO 14001'},
  {id:'B4', sec:'B. Aspectos e impactos', t:'bool', q:'¿Se ha evaluado el riesgo ambiental conforme a UNE 150008?', ref:'UNE 150008:2008', std:'UNE 150008'},
  {id:'B5', sec:'B. Aspectos e impactos', t:'num', q:'Nivel de riesgo ambiental global obtenido (1–25)', when:a=>a.B4===true, ref:'UNE 150008:2008', std:'UNE 150008'},

  /* C. Residuos */
  {id:'C1', sec:'C. Residuos', t:'bool', q:'¿Existe inscripción en el registro como productor de residuos peligrosos?', ref:'Ley 7/2022 · RD 833/1988', std:'Ley 7/2022'},
  {id:'C2', sec:'C. Residuos', t:'text', q:'Nº de inscripción como productor de residuos peligrosos', when:a=>a.C1===true, ref:'Ley 7/2022', std:'Ley 7/2022'},
  {id:'C3', sec:'C. Residuos', t:'bool', q:'¿Se dispone de archivo cronológico de residuos actualizado?', ref:'Ley 7/2022 art. 65', std:'Ley 7/2022'},
  {id:'C4', sec:'C. Residuos', t:'bool', q:'¿Se ha presentado la declaración anual de residuos peligrosos en plazo?', ref:'Ley 7/2022', std:'Ley 7/2022'},
  {id:'C5', sec:'C. Residuos', t:'bool', q:'¿Los residuos se entregan a gestor autorizado con contrato vigente?', ref:'Ley 7/2022 · Directiva 2008/98/CE', std:'Directiva 2008/98/CE'},
  {id:'C6', sec:'C. Residuos', t:'bool', q:'¿Existe separación en origen por flujos y correcto etiquetado de envases?', ref:'Decisión 2014/955/UE', std:'Directiva 2008/98/CE'},
  {id:'C7', sec:'C. Residuos', t:'bool', q:'¿Se realiza seguimiento de objetivos de valorización y preparación para la reutilización?', ref:'Directiva (UE) 2018/851', std:'Directiva (UE) 2018/851'},
  {id:'C8', sec:'C. Residuos', t:'num', q:'Generación anual de residuos peligrosos (t)', ref:'Ley 7/2022', std:'Ley 7/2022'},
  {id:'C9', sec:'C. Residuos', t:'num', q:'Generación anual de residuos no peligrosos (t)', ref:'Ley 7/2022', std:'Ley 7/2022'},
  {id:'C10', sec:'C. Residuos', t:'num', q:'Porcentaje de residuos valorizados sobre el total (%)', ref:'Directiva (UE) 2018/851', std:'Directiva (UE) 2018/851'},

  /* D. Emisiones y energía */
  {id:'D1', sec:'D. Emisiones y energía', t:'bool', q:'¿La instalación está afectada por la normativa de prevención y control integrados (IPPC/DEI)?', ref:'Directiva 2010/75/UE', std:'Directiva 2010/75/UE'},
  {id:'D2', sec:'D. Emisiones y energía', t:'text', q:'Nº de Autorización Ambiental Integrada (AAI)', when:a=>a.D1===true, ref:'RDL 1/2016', std:'Directiva 2010/75/UE'},
  {id:'D3', sec:'D. Emisiones y energía', t:'date', q:'Fecha de vencimiento de la AAI', when:a=>a.D1===true, ref:'RDL 1/2016', std:'Directiva 2010/75/UE'},
  {id:'D4', sec:'D. Emisiones y energía', t:'bool', q:'¿Participa la instalación en el RCDE UE (comercio de derechos de emisión)?', ref:'Directiva 2003/87/CE', std:'Directiva 2003/87/CE'},
  {id:'D5', sec:'D. Emisiones y energía', t:'bool', q:'¿Se realizan mediciones periódicas de emisiones a la atmósfera por OCA?', ref:'RD 100/2011', std:'RD 100/2011'},
  {id:'D6', sec:'D. Emisiones y energía', t:'bool', q:'¿Existe un plan de descarbonización con objetivos validados (SBTi o equivalentes)?', ref:'GHG Protocol · SBTi', std:'GHG Protocol'},
  {id:'D7', sec:'D. Emisiones y energía', t:'num', q:'Consumo eléctrico anual (kWh)', ref:'ISO 50001:2018', std:'ISO 50001'},
  {id:'D8', sec:'D. Emisiones y energía', t:'num', q:'Porcentaje de energía renovable sobre el consumo total (%)', ref:'Directiva (UE) 2023/2413', std:'RED III'},
  {id:'D9', sec:'D. Emisiones y energía', t:'num', q:'Consumo anual de gas natural (kWh)', ref:'ISO 50001:2018', std:'ISO 50001'},
  {id:'D10', sec:'D. Emisiones y energía', t:'num', q:'Consumo anual de gasóleo (L)', ref:'ISO 50001:2018', std:'ISO 50001'},
  {id:'D11', sec:'D. Emisiones y energía', t:'bool', q:'¿Dispone de certificación ISO 50001 de gestión energética?', ref:'ISO 50001:2018', std:'ISO 50001'},

  /* E. Agua */
  {id:'E1', sec:'E. Agua', t:'bool', q:'¿Existe autorización de vertido vigente?', ref:'RDL 1/2001 · RD 817/2015', std:'RDL 1/2001'},
  {id:'E2', sec:'E. Agua', t:'date', q:'Fecha de vencimiento de la autorización de vertido', when:a=>a.E1===true, ref:'RDL 1/2001', std:'RDL 1/2001'},
  {id:'E3', sec:'E. Agua', t:'bool', q:'¿Se realizan analíticas periódicas del vertido con laboratorio acreditado?', ref:'ISO/IEC 17025', std:'ISO 17025'},
  {id:'E4', sec:'E. Agua', t:'num', q:'Consumo anual de agua (m³)', ref:'ISO 14046:2014', std:'ISO 14046'},
  {id:'E5', sec:'E. Agua', t:'bool', q:'¿Existe plan de reducción de consumo o de reutilización de agua?', ref:'ISO 14046:2014', std:'ISO 14046'},

  /* F. Suelos y responsabilidad */
  {id:'F1', sec:'F. Suelos y responsabilidad', t:'bool', q:'¿Se ha realizado informe preliminar de situación del suelo?', ref:'RD 9/2005', std:'RD 9/2005'},
  {id:'F2', sec:'F. Suelos y responsabilidad', t:'bool', q:'¿Existe análisis de riesgos medioambientales conforme a la Ley 26/2007?', ref:'Ley 26/2007 · RD 2090/2008', std:'Ley 26/2007'},
  {id:'F3', sec:'F. Suelos y responsabilidad', t:'bool', q:'¿Se dispone de garantía financiera obligatoria constituida?', when:a=>a.F2===true, ref:'Ley 26/2007 art. 24', std:'Ley 26/2007'},

  /* G. Emergencias */
  {id:'G1', sec:'G. Emergencias', t:'bool', q:'¿Existe plan de emergencia ambiental actualizado y probado?', ref:'ISO 14001:2015 §8.2', std:'ISO 14001'},
  {id:'G2', sec:'G. Emergencias', t:'bool', q:'¿Se realizan simulacros periódicos con registro de resultados?', ref:'ISO 14001:2015 §8.2', std:'ISO 14001'},
  {id:'G3', sec:'G. Emergencias', t:'bool', q:'¿La instalación está afectada por el RD 840/2015 (Seveso III)?', ref:'RD 840/2015', std:'Seveso III'},
  {id:'G4', sec:'G. Emergencias', t:'bool', q:'¿Existe kit antiderrame y personal formado en su uso?', ref:'ISO 14001:2015 §7.2', std:'ISO 14001'},

  /* H. ESG y reporting */
  {id:'H1', sec:'H. ESG y reporting', t:'bool', q:'¿La organización está obligada a reportar bajo la Directiva CSRD?', ref:'Directiva (UE) 2022/2464', std:'CSRD'},
  {id:'H2', sec:'H. ESG y reporting', t:'bool', q:'¿Se aplican los estándares ESRS en la elaboración del informe?', when:a=>a.H1===true, ref:'Reglamento Delegado (UE) 2023/2772', std:'ESRS'},
  {id:'H3', sec:'H. ESG y reporting', t:'bool', q:'¿Se dispone de verificación externa limitada del informe de sostenibilidad?', when:a=>a.H1===true, ref:'Directiva (UE) 2022/2464 art. 34', std:'CSRD'},
  {id:'H4', sec:'H. ESG y reporting', t:'bool', q:'¿Se alinea la inversión con la Taxonomía UE de actividades sostenibles?', ref:'Reglamento (UE) 2020/852', std:'Taxonomía UE'},
  {id:'H5', sec:'H. ESG y reporting', t:'bool', q:'¿Existe canal de denuncias y proceso de diligencia debida?', ref:'Directiva (UE) 2019/1937', std:'Directiva (UE) 2019/1937'}
];

/* --------------------------------------------------------------------------
   2. REPOSITORIO NORMATIVO
   Editable desde la propia app (los enlaces se pueden corregir y persistir)
   -------------------------------------------------------------------------- */
const REGULATIONS = [
  /* --- Sistemas de gestión y certificaciones --- */
  {id:'ISO14001', code:'ISO 14001:2015', title:'Sistemas de gestión ambiental. Requisitos con orientación para su uso', scope:'ISO', cat:'SGA', url:'https://www.iso.org/standard/60857.html', tags:['SGA','certificación','aspectos ambientales']},
  {id:'ISO14004', code:'ISO 14004:2016', title:'Sistemas de gestión ambiental. Directrices generales sobre principios, sistemas y técnicas de apoyo', scope:'ISO', cat:'SGA', url:'https://www.iso.org/search.html?q=ISO%2014004', tags:['SGA','directrices']},
  {id:'ISO14005', code:'ISO 14005:2019', title:'Sistemas de gestión ambiental. Directrices para un enfoque por fases', scope:'ISO', cat:'SGA', url:'https://www.iso.org/search.html?q=ISO%2014005', tags:['PYME','implantación']},
  {id:'ISO14006', code:'ISO 14006:2020', title:'Directrices para incorporar el ecodiseño en los sistemas de gestión ambiental', scope:'ISO', cat:'Ecodiseño', url:'https://www.iso.org/search.html?q=ISO%2014006', tags:['ecodiseño','ACV']},
  {id:'ISO14015', code:'ISO 14015:2022', title:'Evaluación ambiental de sitios y organizaciones', scope:'ISO', cat:'Suelos', url:'https://www.iso.org/search.html?q=ISO%2014015', tags:['sitios','due diligence']},
  {id:'ISO14031', code:'ISO 14031:2021', title:'Gestión ambiental. Evaluación del desempeño ambiental. Directrices', scope:'ISO', cat:'Desempeño', url:'https://www.iso.org/search.html?q=ISO%2014031', tags:['KPI','desempeño']},
  {id:'ISO14040', code:'ISO 14040:2006', title:'Gestión ambiental. Análisis del ciclo de vida. Principios y marco de referencia', scope:'ISO', cat:'ACV', url:'https://www.iso.org/search.html?q=ISO%2014040', tags:['ACV','huella']},
  {id:'ISO14044', code:'ISO 14044:2006', title:'Gestión ambiental. Análisis del ciclo de vida. Requisitos y directrices', scope:'ISO', cat:'ACV', url:'https://www.iso.org/search.html?q=ISO%2014044', tags:['ACV','huella']},
  {id:'ISO14046', code:'ISO 14046:2014', title:'Gestión ambiental. Huella de agua. Principios, requisitos y directrices', scope:'ISO', cat:'Agua', url:'https://www.iso.org/search.html?q=ISO%2014046', tags:['huella hídrica','agua']},
  {id:'ISO14050', code:'ISO 14050:2020', title:'Gestión ambiental. Vocabulario', scope:'ISO', cat:'SGA', url:'https://www.iso.org/search.html?q=ISO%2014050', tags:['vocabulario']},
  {id:'ISO14063', code:'ISO 14063:2020', title:'Comunicación ambiental. Directrices y ejemplos', scope:'ISO', cat:'Comunicación', url:'https://www.iso.org/search.html?q=ISO%2014063', tags:['comunicación','stakeholders']},
  {id:'ISO14064', code:'ISO 14064-1:2018', title:'Gases de efecto invernadero. Especificación para la cuantificación e informe de emisiones', scope:'ISO', cat:'Clima', url:'https://www.iso.org/search.html?q=ISO%2014064', tags:['GEI','inventario','verificación']},
  {id:'ISO14067', code:'ISO 14067:2018', title:'Huella de carbono de productos. Requisitos y directrices', scope:'ISO', cat:'Clima', url:'https://www.iso.org/search.html?q=ISO%2014067', tags:['huella carbono','producto']},
  {id:'ISO14090', code:'ISO 14090:2019', title:'Adaptación al cambio climático. Principios, requisitos y directrices', scope:'ISO', cat:'Clima', url:'https://www.iso.org/search.html?q=ISO%2014090', tags:['adaptación','clima']},
  {id:'ISO19011', code:'ISO 19011:2018', title:'Directrices para la auditoría de los sistemas de gestión', scope:'ISO', cat:'Auditoría', url:'https://www.iso.org/standard/70017.html', tags:['auditoría','programa']},
  {id:'ISO17021', code:'ISO/IEC 17021-1:2015', title:'Evaluación de la conformidad. Requisitos para los organismos que realizan auditoría y certificación', scope:'ISO', cat:'Certificación', url:'https://www.iso.org/search.html?q=ISO%2017021', tags:['certificación','acreditación']},
  {id:'ISO17025', code:'ISO/IEC 17025:2017', title:'Requisitos generales para la competencia de los laboratorios de ensayo y calibración', scope:'ISO', cat:'Laboratorios', url:'https://www.iso.org/search.html?q=ISO%2017025', tags:['laboratorio','analíticas']},
  {id:'ISO26000', code:'ISO 26000:2010', title:'Guía de responsabilidad social', scope:'ISO', cat:'ESG', url:'https://www.iso.org/standard/42546.html', tags:['RSC','ESG','diligencia']},
  {id:'ISO20400', code:'ISO 20400:2017', title:'Compras sostenibles. Directrices', scope:'ISO', cat:'ESG', url:'https://www.iso.org/standard/63026.html', tags:['compras','cadena suministro']},
  {id:'ISO31000', code:'ISO 31000:2018', title:'Gestión del riesgo. Directrices', scope:'ISO', cat:'Riesgos', url:'https://www.iso.org/standard/65607.html', tags:['riesgo','matriz']},
  {id:'ISO45001', code:'ISO 45001:2018', title:'Sistemas de gestión de la seguridad y salud en el trabajo', scope:'ISO', cat:'SST', url:'https://www.iso.org/standard/63787.html', tags:['SST','EHS']},
  {id:'ISO9001', code:'ISO 9001:2015', title:'Sistemas de gestión de la calidad. Requisitos', scope:'ISO', cat:'Calidad', url:'https://www.iso.org/standard/62085.html', tags:['calidad','integrado']},
  {id:'ISO50001', code:'ISO 50001:2018', title:'Sistemas de gestión de la energía. Requisitos con orientación para su uso', scope:'ISO', cat:'Energía', url:'https://www.iso.org/standard/69429.html', tags:['energía','eficiencia']},
  {id:'ISO27001', code:'ISO/IEC 27001:2022', title:'Seguridad de la información, ciberseguridad y protección de datos', scope:'ISO', cat:'Seguridad', url:'https://www.iso.org/standard/82875.html', tags:['seguridad','datos','trazabilidad']},
  {id:'UNE150008', code:'UNE 150008:2008', title:'Análisis y evaluación del riesgo ambiental', scope:'UNE', cat:'Riesgos', url:'https://www.une.org/encuentra-tu-norma/busca-tu-norma/?q=150008', tags:['riesgo ambiental','Ley 26/2007']},
  {id:'EMAS', code:'Reglamento (CE) 1221/2009', title:'Sistema comunitario de gestión y auditoría medioambientales (EMAS)', scope:'UE', cat:'SGA', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009R1221', tags:['EMAS','declaración ambiental']},

  /* --- Reporting ESG y finanzas sostenibles --- */
  {id:'CSRD', code:'Directiva (UE) 2022/2464', title:'Directiva sobre información corporativa en materia de sostenibilidad (CSRD)', scope:'UE', cat:'ESG', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32022L2464', tags:['CSRD','reporting','doble materialidad']},
  {id:'ESRS', code:'Reglamento Delegado (UE) 2023/2772', title:'Normas Europeas de Información sobre Sostenibilidad (ESRS)', scope:'UE', cat:'ESG', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R2772', tags:['ESRS','E1','S1','G1']},
  {id:'TAXO', code:'Reglamento (UE) 2020/852', title:'Reglamento de Taxonomía: marco para facilitar las inversiones sostenibles', scope:'UE', cat:'ESG', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32020R0852', tags:['taxonomía','elegibilidad','alineación']},
  {id:'TAXOCLIMA', code:'Reglamento Delegado (UE) 2021/2139', title:'Criterios técnicos de selección para mitigación y adaptación al cambio climático', scope:'UE', cat:'ESG', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32021R2139', tags:['taxonomía','DNSH']},
  {id:'SFDR', code:'Reglamento (UE) 2019/2088', title:'Divulgación de información relativa a la sostenibilidad en el sector de servicios financieros', scope:'UE', cat:'ESG', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019R2088', tags:['SFDR','finanzas']},
  {id:'CSDDD', code:'Directiva (UE) 2024/1760', title:'Diligencia debida de las empresas en materia de sostenibilidad', scope:'UE', cat:'ESG', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024L1760', tags:['diligencia debida','cadena de valor']},
  {id:'WHISTLE', code:'Directiva (UE) 2019/1937', title:'Protección de las personas que informen sobre infracciones del Derecho de la Unión', scope:'UE', cat:'Gobernanza', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019L1937', tags:['canal de denuncias','compliance']},

  /* --- Emisiones, clima y energía --- */
  {id:'DEI', code:'Directiva 2010/75/UE', title:'Prevención y control integrados de la contaminación (DEI/IPPC)', scope:'UE', cat:'Emisiones', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32010L0075', tags:['AAI','MTD','BAT']},
  {id:'RCDE', code:'Directiva 2003/87/CE', title:'Régimen de comercio de derechos de emisión de gases de efecto invernadero', scope:'UE', cat:'Clima', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32003L0087', tags:['RCDE','derechos de emisión']},
  {id:'RCDE2', code:'Directiva (UE) 2023/959', title:'Revisión del RCDE UE y del Mecanismo de Ajuste en Frontera por Carbono', scope:'UE', cat:'Clima', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023L0959', tags:['RCDE','Fit for 55']},
  {id:'CBAM', code:'Reglamento (UE) 2023/956', title:'Mecanismo de Ajuste en Frontera por Carbono (CBAM)', scope:'UE', cat:'Clima', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R0956', tags:['CBAM','importaciones','carbono']},
  {id:'REDIII', code:'Directiva (UE) 2023/2413', title:'Fomento del uso de energía procedente de fuentes renovables (RED III)', scope:'UE', cat:'Energía', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023L2413', tags:['renovables','autoconsumo']},
  {id:'EED', code:'Directiva (UE) 2023/1791', title:'Eficiencia energética (refundición)', scope:'UE', cat:'Energía', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023L1791', tags:['eficiencia','auditoría energética']},
  {id:'ESPR', code:'Reglamento (UE) 2024/1781', title:'Diseño ecológico de productos sostenibles (ESPR)', scope:'UE', cat:'Producto', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024R1781', tags:['ecodiseño','pasaporte digital']},

  /* --- Residuos, agua, aire, ruido --- */
  {id:'RESIDUOS', code:'Directiva 2008/98/CE', title:'Directiva marco de residuos', scope:'UE', cat:'Residuos', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32008L0098', tags:['jerarquía','residuos']},
  {id:'RESIDUOS2', code:'Directiva (UE) 2018/851', title:'Modificación de la Directiva marco de residuos (economía circular)', scope:'UE', cat:'Residuos', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32018L0851', tags:['circularidad','valorización']},
  {id:'PLASTICOS', code:'Directiva (UE) 2019/904', title:'Reducción del impacto de determinados productos de plástico', scope:'UE', cat:'Residuos', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019L0904', tags:['plásticos','SUP']},
  {id:'REACH', code:'Reglamento (CE) 1907/2006', title:'Registro, evaluación, autorización y restricción de sustancias químicas (REACH)', scope:'UE', cat:'Químicos', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32006R1907', tags:['químicos','SVHC']},
  {id:'CLP', code:'Reglamento (CE) 1272/2008', title:'Clasificación, etiquetado y envasado de sustancias y mezclas (CLP)', scope:'UE', cat:'Químicos', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32008R1272', tags:['etiquetado','pictogramas']},
  {id:'DMA', code:'Directiva 2000/60/CE', title:'Directiva Marco del Agua', scope:'UE', cat:'Agua', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32000L0060', tags:['masas de agua','vertido']},
  {id:'NITRATOS', code:'Directiva 91/676/CEE', title:'Protección de las aguas contra la contaminación por nitratos', scope:'UE', cat:'Agua', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:31991L0676', tags:['nitratos','zonas vulnerables']},
  {id:'RUIDO', code:'Directiva 2002/49/CE', title:'Evaluación y gestión del ruido ambiental', scope:'UE', cat:'Ruido', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32002L0049', tags:['ruido','mapas']},
  {id:'HABITATS', code:'Directiva 92/43/CEE', title:'Conservación de los hábitats naturales y de la fauna y flora silvestres', scope:'UE', cat:'Biodiversidad', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:31992L0043', tags:['Red Natura 2000','biodiversidad']},
  {id:'DEFOR', code:'Reglamento (UE) 2023/1115', title:'Productos libres de deforestación', scope:'UE', cat:'Biodiversidad', url:'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1115', tags:['deforestación','cadena suministro']},

  /* --- Legislación española --- */
  {id:'LEY7_2022', code:'Ley 7/2022', title:'Residuos y suelos contaminados para una economía circular', scope:'ES', cat:'Residuos', url:'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809', tags:['residuos','suelos','circular']},
  {id:'LEY7_2021', code:'Ley 7/2021', title:'Cambio climático y transición energética', scope:'ES', cat:'Clima', url:'https://www.boe.es/buscar/act.php?id=BOE-A-2021-8447', tags:['clima','huella','descarbonización']},
  {id:'LEY26_2007', code:'Ley 26/2007', title:'Responsabilidad medioambiental', scope:'ES', cat:'Riesgos', url:'https://www.boe.es/buscar/act.php?id=BOE-A-2007-18475', tags:['responsabilidad','garantía financiera']},
  {id:'RD2090', code:'RD 2090/2008', title:'Reglamento de desarrollo parcial de la Ley 26/2007 de Responsabilidad Medioambiental', scope:'ES', cat:'Riesgos', url:'https://www.boe.es/buscar/legislacion.php?texto=RD%202090/2008', tags:['análisis de riesgos','UNE 150008']},
  {id:'RD9_2005', code:'RD 9/2005', title:'Actividades potencialmente contaminantes del suelo y criterios para su declaración', scope:'ES', cat:'Suelos', url:'https://www.boe.es/buscar/legislacion.php?texto=RD%209/2005%20suelos', tags:['suelos','informe preliminar']},
  {id:'TRIPPC', code:'RDL 1/2016', title:'Texto refundido de la Ley de prevención y control integrados de la contaminación', scope:'ES', cat:'Emisiones', url:'https://www.boe.es/buscar/legislacion.php?texto=RDL%201/2016%20prevenci%C3%B3n%20control%20integrados', tags:['AAI','MTD']},
  {id:'LEY34_2007', code:'Ley 34/2007', title:'Calidad del aire y protección de la atmósfera', scope:'ES', cat:'Aire', url:'https://www.boe.es/buscar/legislacion.php?texto=Ley%2034/2007%20calidad%20del%20aire', tags:['emisiones','atmósfera']},
  {id:'LEY37_2003', code:'Ley 37/2003', title:'El Ruido', scope:'ES', cat:'Ruido', url:'https://www.boe.es/buscar/legislacion.php?texto=Ley%2037/2003%20ruido', tags:['ruido','acústica']},
  {id:'TRLA', code:'RDL 1/2001', title:'Texto refundido de la Ley de Aguas', scope:'ES', cat:'Agua', url:'https://www.boe.es/buscar/act.php?id=BOE-A-2001-14276', tags:['vertido','dominio público hidráulico']},
  {id:'LEY42_2007', code:'Ley 42/2007', title:'Patrimonio Natural y de la Biodiversidad', scope:'ES', cat:'Biodiversidad', url:'https://www.boe.es/buscar/act.php?id=BOE-A-2007-21490', tags:['biodiversidad','Natura 2000']},
  {id:'LEY21_2013', code:'Ley 21/2013', title:'Evaluación ambiental', scope:'ES', cat:'Evaluación', url:'https://www.boe.es/buscar/act.php?id=BOE-A-2013-12913', tags:['EIA','evaluación estratégica']},
  {id:'SEVESO', code:'RD 840/2015', title:'Control de los riesgos inherentes a los accidentes graves en los que intervengan sustancias peligrosas', scope:'ES', cat:'Emergencias', url:'https://www.boe.es/buscar/legislacion.php?texto=RD%20840/2015%20accidentes%20graves', tags:['Seveso','accidentes graves']},
  {id:'APQ', code:'RD 656/2017', title:'Reglamento de almacenamiento de productos químicos y sus ITC MIE APQ', scope:'ES', cat:'Químicos', url:'https://www.boe.es/buscar/legislacion.php?texto=RD%20656/2017%20productos%20qu%C3%ADmicos', tags:['APQ','almacenamiento']},

  /* --- Marcos voluntarios y organismos --- */
  {id:'GHG', code:'GHG Protocol', title:'Estándares corporativos y de producto para el cálculo de GEI', scope:'OTRO', cat:'Clima', url:'https://ghgprotocol.org/standards', tags:['alcance 1','alcance 2','alcance 3']},
  {id:'GRI', code:'GRI Standards', title:'Estándares globales de reporte de sostenibilidad', scope:'OTRO', cat:'ESG', url:'https://www.globalreporting.org/standards/', tags:['reporting','GRI']},
  {id:'SBTI', code:'SBTi', title:'Science Based Targets initiative — objetivos basados en la ciencia', scope:'OTRO', cat:'Clima', url:'https://sciencebasedtargets.org/', tags:['net zero','objetivos']},
  {id:'TCFD', code:'TCFD / IFRS S2', title:'Recomendaciones sobre divulgaciones financieras relacionadas con el clima', scope:'OTRO', cat:'Clima', url:'https://www.ifrs.org/sustainability/tcfd/', tags:['clima','financiero']},
  {id:'EFRAG', code:'EFRAG', title:'Grupo asesor europeo de información financiera — desarrollo de los ESRS', scope:'OTRO', cat:'ESG', url:'https://www.efrag.org/', tags:['ESRS','guías']},
  {id:'MITECO', code:'MITECO', title:'Ministerio para la Transición Ecológica y el Reto Demográfico', scope:'ES', cat:'Institucional', url:'https://www.miteco.gob.es/', tags:['autoridad ambiental','trámites']},
  {id:'PRTR', code:'PRTR España', title:'Registro Estatal de Emisiones y Fuentes Contaminantes', scope:'ES', cat:'Institucional', url:'https://prtr-es.es/', tags:['emisiones','registro']},
  {id:'ENAC', code:'ENAC', title:'Entidad Nacional de Acreditación', scope:'ES', cat:'Certificación', url:'https://www.enac.es/', tags:['acreditación','organismos']},
  {id:'AENOR', code:'AENOR', title:'Asociación Española de Normalización y Certificación', scope:'ES', cat:'Certificación', url:'https://www.aenor.com/', tags:['UNE','certificación']}
];

/* --------------------------------------------------------------------------
   3. FACTORES DE EMISIÓN (editables desde Ajustes)
   Unidades: kg CO2e por unidad de actividad
   -------------------------------------------------------------------------- */
const FACTORS = {
  elec_kwh:      0.190,   // kWh electricidad (mix peninsular)
  gas_kwh:       0.202,   // kWh gas natural
  diesel_l:      2.680,   // L gasóleo
  gasoline_l:    2.310,   // L gasolina
  water_m3:      0.300,   // m³ agua de red
  water_treat:   0.400,   // m³ agua residual tratada
  waste_np_t:    45.0,    // t residuo no peligroso (vertedero)
  waste_p_t:     120.0,   // t residuo peligroso (incineración)
  waste_rec_t:   15.0     // t residuo valorizado
};

/* --------------------------------------------------------------------------
   4. MATRIZ DE RIESGO UNE 150008 (probabilidad × consecuencia)
   -------------------------------------------------------------------------- */
const RISK_LEVELS = [
  {max:4,  label:'Bajo',     cls:'c-ok',     sla:90, action:'Seguimiento en la próxima revisión del SGA.'},
  {max:9,  label:'Moderado', cls:'c-info',   sla:60, action:'Acción correctiva planificada con responsable asignado.'},
  {max:15, label:'Alto',     cls:'c-warn',   sla:30, action:'Acción correctiva prioritaria y verificación de eficacia.'},
  {max:25, label:'Crítico',  cls:'c-danger', sla:7,  action:'Parada o control inmediato. Escalado a dirección.'}
];
const PROBABILITY = ['Muy improbable','Improbable','Posible','Probable','Casi seguro'];
const CONSEQUENCE = ['Insignificante','Menor','Moderada','Grave','Muy grave'];

/* --------------------------------------------------------------------------
   5. CATÁLOGO DE INTEGRACIONES
   -------------------------------------------------------------------------- */
const INTEGRATIONS = [
  {id:'sap',      name:'SAP S/4HANA',            type:'ERP',        proto:'OData / IDoc',        desc:'Consumos, compras y centros de coste para el cálculo de huella.'},
  {id:'dynamics', name:'Microsoft Dynamics 365', type:'ERP',        proto:'Dataverse / OData',   desc:'Órdenes de compra, activos y datos financieros ESG.'},
  {id:'quentic',  name:'Quentic',                type:'EHS',        proto:'REST API',            desc:'Incidentes, observaciones y acciones de prevención.'},
  {id:'enablon',  name:'Enablon',                type:'EHS',        proto:'REST / SOAP',         desc:'Gestión de riesgos, permisos de trabajo y cumplimiento.'},
  {id:'iot',      name:'Sensores IoT',           type:'IoT',        proto:'MQTT / LoRaWAN',      desc:'Medición continua de emisiones, caudal y energía.'},
  {id:'webhook',  name:'Webhooks genéricos',     type:'Integración',proto:'HTTP POST',           desc:'Notificación de hallazgos y cierres a sistemas externos.'}
];

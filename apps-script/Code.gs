/**
 * Central Técnica Leite — Backend Google Apps Script
 * Nova lógica:
 * - Tipo de solicitante: Distrital, Regional ou Técnico
 * - E-mail manual somente para Regional
 * - Distrital vinculado automático para Distrital/Regional e selecionável para Técnico
 * - Retorno para solicitante, com cópia para técnico demandado e distrital vinculado
 */

const CONFIG = {
  SHEET_NAME: 'Demandas',
  DASHBOARD_SHEET_NAME: 'Painel',
  LISTS_SHEET_NAME: 'Listas',
  TRIAGEM_EMAIL: 'paula.tiveron@altagenetics.com, rafael.azevedo@altagenetics.com',
  REMETENTE_NOME: 'Central Técnica Leite',
  COPIAR_TRIAGEM_EM_RETORNOS: false
};

const EMAIL_TECNICOS = {
  "Alexandre Scarpa": "alexandre.scarpa@altagenetics.com",
  "Alice Arantes": "Alice.Arantes@altagenetics.com",
  "Bianca Souza": "bianca.ribeiro@altagenetics.com",
  "Fábio Fogaça": "ffogaca@altagenetics.com",
  "Felipe Secco": "Felipe.Secco@altagenetics.com",
  "Guilherme Marquez": "gmarquez@altagenetics.com",
  "Gustavo Gonçalves": "Gustavo.Goncalves@altagenetics.com",
  "Itamar Aguiar": "itamar.aguiar@altagenetics.com",
  "Natália Espanhol": "nathalia.espanhol@altagenetics.com",
  "Paula Tiveron": "paula.tiveron@altagenetics.com",
  "Rafael Azevedo": "rafael.azevedo@altagenetics.com",
  "Rayce Ferreira": "Rayce.Ferreira@altagenetics.com",
  "Reginaldo Santos": "rsantos@altagenetics.com",
  "Tiago Ferreira": "tiago.ferreira@altagenetics.com"
};

const EMAIL_DISTRITAIS = {
  "André Navarro": "Andre.Navarro@altagenetics.com",
  "Darci D'Anuncio": "ddanuncio@altagenetics.com",
  "Edmarcos Oliveira": "Edmarcos.Oliveira@altagenetics.com",
  "Francisco Hermano": "fhermano@altagenetics.com",
  "Glauco Freire": "gfreire@altagenetics.com",
  "Marco Antônio Oliveira": "Marco.Oliveira@altagenetics.com",
  "Marcos Longas": "mlongas@altagenetics.com",
  "Rodrigo Frigoni": "Rodrigo.Frigoni@altagenetics.com",
  "Rodrigo Longo": "rodrigo.longo@altagenetics.com",
  "Rodrigo Peixoto": "rodrigo.peixoto@altagenetics.com",
  "Rodrigo Rodrigues": "rrodrigues@altagenetics.com",
  "Timótheo Silveira": "Timotheo.Silveira@altagenetics.com"
};

const REGIONAIS_PARA_DISTRITAIS = {
  "MG JUIZ DE FORA": "André Navarro",
  "MG LEOPOLDINA": "André Navarro",
  "MG MATIPO": "André Navarro",
  "MG RIO CASCA": "André Navarro",
  "RJ CAMPOS": "André Navarro",
  "RJ RIO DE JANEIRO": "André Navarro",
  "SP BATATAIS": "André Navarro",
  "SP BOTUCATU": "André Navarro",
  "SP BRAGANCA PAULISTA": "André Navarro",
  "SP GUARATINGUETA": "André Navarro",
  "SP MARILIA": "André Navarro",
  "SP PIRACICABA": "André Navarro",
  "SP RIBEIRAO PRETO": "André Navarro",
  "SP RIO CLARO": "André Navarro",
  "SP SAO JOAO DA BOA VISTA": "André Navarro",
  "SP SAO JOSE DO RIO PRETO": "André Navarro",
  "SP VARGEM GRANDE DO SUL": "André Navarro",
  "AC ACRE": "Darci D'Anuncio",
  "MS CAMPO GRANDE": "Darci D'Anuncio",
  "MT ALTA FLORESTA": "Darci D'Anuncio",
  "MT CUIABA SUL": "Darci D'Anuncio",
  "MT SINOP": "Darci D'Anuncio",
  "DF BRASILIA": "Edmarcos Oliveira",
  "GO PLANALTO CENTRAL": "Edmarcos Oliveira",
  "GO PORANGATU": "Edmarcos Oliveira",
  "GO VALE DOURADO": "Edmarcos Oliveira",
  "MT COCALINHO": "Edmarcos Oliveira",
  "SP ITAPETININGA": "Edmarcos Oliveira",
  "TO ARAGUAINA": "Edmarcos Oliveira",
  "TO DIANOPOLIS": "Edmarcos Oliveira",
  "TO GURUPI": "Edmarcos Oliveira",
  "TO TOCANTINS NORTE": "Edmarcos Oliveira",
  "TO TOCANTINS SUL": "Edmarcos Oliveira",
  "AL MACEIO": "Francisco Hermano",
  "CE CEARA": "Francisco Hermano",
  "PE RECIFE": "Francisco Hermano",
  "BA BARREIRAS": "Glauco Freire",
  "BA EUNAPOLIS": "Glauco Freire",
  "BA FEIRA DE SANTANA": "Glauco Freire",
  "BA GUANAMBI": "Glauco Freire",
  "BA ITABUNA": "Glauco Freire",
  "BA ITAPETINGA": "Glauco Freire",
  "BA OESTE BAHIA": "Glauco Freire",
  "BA SANTA MARIA DA VITORIA": "Glauco Freire",
  "BA TEIXEIRA DE FREITAS": "Glauco Freire",
  "BA VITORIA CONQUISTA": "Glauco Freire",
  "ES ESPIRITO SANTO": "Glauco Freire",
  "ES LINHARES": "Glauco Freire",
  "MG ARACUAI": "Glauco Freire",
  "MG BELO HORIZONTE NORTE": "Glauco Freire",
  "MG CENTRAL DE MINAS": "Glauco Freire",
  "MG GOVERNADOR VALADARES": "Glauco Freire",
  "MG MONTES CLAROS": "Glauco Freire",
  "MG MUCURI": "Glauco Freire",
  "MG NANUQUE": "Glauco Freire",
  "MG POMPEU": "Glauco Freire",
  "MG TEOFILO OTONI": "Glauco Freire",
  "PR BARRACAO": "Marco Antônio Oliveira",
  "PR CAMPO MOURAO": "Marco Antônio Oliveira",
  "PR CANDIDO RONDON": "Marco Antônio Oliveira",
  "PR CORNELIO PROCOPIO": "Marco Antônio Oliveira",
  "PR GUARAPUAVA": "Marco Antônio Oliveira",
  "PR MANGUEIRINHA": "Marco Antônio Oliveira",
  "PR MARINGA": "Marco Antônio Oliveira",
  "PR NOVA LARANJEIRAS": "Marco Antônio Oliveira",
  "PR SAO JOAO": "Marco Antônio Oliveira",
  "RS CACHOEIRA DO SUL": "Marco Antônio Oliveira",
  "RS DOM PEDRITO": "Marco Antônio Oliveira",
  "RS PELOTAS": "Marco Antônio Oliveira",
  "RS PORTO ALEGRE": "Marco Antônio Oliveira",
  "RS SANTIAGO": "Marco Antônio Oliveira",
  "SC CAPINZAL": "Marco Antônio Oliveira",
  "SC SANTA CATARINA CORTE": "Marco Antônio Oliveira",
  "AM MANAUS": "Marcos Longas",
  "GO VALE DO ARAGUAIA": "Marcos Longas",
  "MA ACAILANDIA": "Marcos Longas",
  "MA IMPERATRIZ": "Marcos Longas",
  "MA PRESIDENTE DUTRA": "Marcos Longas",
  "MA SANTA INES": "Marcos Longas",
  "PA ALTAMIRA": "Marcos Longas",
  "PA BELEM": "Marcos Longas",
  "PA JACUNDA": "Marcos Longas",
  "PA MARABA": "Marcos Longas",
  "PA ORIXIMINA": "Marcos Longas",
  "PA PARAGOMINAS": "Marcos Longas",
  "PA XINGU": "Marcos Longas",
  "PA XINGUARA": "Marcos Longas",
  "PR FRANCISCO BELTRAO": "Marcos Longas",
  "PR LONDRINA": "Marcos Longas",
  "RR RORAIMA": "Marcos Longas",
  "SC MARAVILHA": "Marcos Longas",
  "GO OESTE GOIANO": "Rodrigo Rodrigues",
  "MT AGUA BOA": "Rodrigo Rodrigues",
  "MT BARRA DO GARCAS": "Rodrigo Rodrigues",
  "MT CONFRESA": "Rodrigo Rodrigues",
  "MT CUIABA": "Rodrigo Rodrigues",
  "MT JUINA": "Rodrigo Rodrigues",
  "MT MATUPA": "Rodrigo Rodrigues",
  "MT NOVA XAVANTINA": "Rodrigo Rodrigues",
  "MT OESTE MT": "Rodrigo Rodrigues",
  "MT PONTES E LACERDA": "Rodrigo Rodrigues",
  "MT RONDONOPOLIS": "Rodrigo Rodrigues",
  "RO RONDONIA": "Rodrigo Rodrigues",
  "GO GOIAS SUL": "Rodrigo Longo",
  "GO IPORA": "Rodrigo Longo",
  "GO MORRINHOS": "Rodrigo Longo",
  "GO RIO VERDE": "Rodrigo Longo",
  "MG ARAGUARI": "Rodrigo Longo",
  "MG CENTRO OESTE DE MINAS": "Rodrigo Longo",
  "MG GUIMARANIA": "Rodrigo Longo",
  "MG ITUIUTABA": "Rodrigo Longo",
  "MG JOAO PINHEIRO": "Rodrigo Longo",
  "MG LAGOA FORMOSA": "Rodrigo Longo",
  "MG PARACATU": "Rodrigo Longo",
  "MG PATOS DE MINAS": "Rodrigo Longo",
  "MG PATOS NORTE": "Rodrigo Longo",
  "MG PERDIZES": "Rodrigo Longo",
  "MG PONTAL": "Rodrigo Longo",
  "MG SANTA VITORIA": "Rodrigo Longo",
  "MG TIROS": "Rodrigo Longo",
  "MG TRIANGULO": "Rodrigo Longo",
  "MG UBERABA": "Rodrigo Longo",
  "MG UBERLANDIA": "Rodrigo Longo",
  "GO GOIANIA": "Rodrigo Frigoni",
  "GO GOIAS NORTE": "Rodrigo Frigoni",
  "GO MINEIROS": "Rodrigo Frigoni",
  "PA NOVO PROGRESSO": "Rodrigo Frigoni",
  "SP ARACATUBA": "Rodrigo Frigoni",
  "SP BAURU": "Rodrigo Frigoni",
  "Virtual Sales Region": "Rodrigo Frigoni",
  "MG BELO HORIZONTE SUL": "Rodrigo Peixoto",
  "MG BOM SUCESSO": "Rodrigo Peixoto",
  "MG CARMO DO RIO CLARO": "Rodrigo Peixoto",
  "MG CONSELHEIRO LAFAIETE": "Rodrigo Peixoto",
  "MG ITABIRA": "Rodrigo Peixoto",
  "MG ITANHANDU": "Rodrigo Peixoto",
  "MG LAVRAS": "Rodrigo Peixoto",
  "MG POUSO ALEGRE": "Rodrigo Peixoto",
  "MG SAO GONCALO DO SAPUCAI": "Rodrigo Peixoto",
  "MG SAO JOAO DEL REI": "Rodrigo Peixoto",
  "SE SERGIPE": "Rodrigo Peixoto",
  "PR CARAMBEI": "Timótheo Silveira",
  "PR CASTRO": "Timótheo Silveira",
  "RS FREDERICO WESTPHALEN": "Timótheo Silveira",
  "RS IJUI": "Timótheo Silveira",
  "RS SANTA ROSA": "Timótheo Silveira",
  "RS TAPEJARA": "Timótheo Silveira",
  "RS TEUTONIA": "Timótheo Silveira",
  "SC BRACO DO NORTE": "Timótheo Silveira",
  "SC CONCORDIA": "Timótheo Silveira",
  "SC SANTA CATARINA": "Timótheo Silveira",
  "SC TIMBO": "Timótheo Silveira",
  "SC TREZE TILIAS": "Timótheo Silveira"
};

const LISTA_DISTRITAIS = [
  "André Navarro",
  "Darci D'Anuncio",
  "Edmarcos Oliveira",
  "Francisco Hermano",
  "Glauco Freire",
  "Marco Antônio Oliveira",
  "Marcos Longas",
  "Rodrigo Frigoni",
  "Rodrigo Longo",
  "Rodrigo Peixoto",
  "Rodrigo Rodrigues",
  "Timótheo Silveira"
];

const LISTA_TECNICOS = [
  "Alexandre Scarpa",
  "Alice Arantes",
  "Bianca Souza",
  "Fábio Fogaça",
  "Felipe Secco",
  "Guilherme Marquez",
  "Gustavo Gonçalves",
  "Itamar Aguiar",
  "Natália Espanhol",
  "Paula Tiveron",
  "Rafael Azevedo",
  "Rayce Ferreira",
  "Reginaldo Santos",
  "Tiago Ferreira"
];

const LISTA_REGIONAIS = [
  "MG JUIZ DE FORA",
  "MG LEOPOLDINA",
  "MG MATIPO",
  "MG RIO CASCA",
  "RJ CAMPOS",
  "RJ RIO DE JANEIRO",
  "SP BATATAIS",
  "SP BOTUCATU",
  "SP BRAGANCA PAULISTA",
  "SP GUARATINGUETA",
  "SP MARILIA",
  "SP PIRACICABA",
  "SP RIBEIRAO PRETO",
  "SP RIO CLARO",
  "SP SAO JOAO DA BOA VISTA",
  "SP SAO JOSE DO RIO PRETO",
  "SP VARGEM GRANDE DO SUL",
  "AC ACRE",
  "MS CAMPO GRANDE",
  "MT ALTA FLORESTA",
  "MT CUIABA SUL",
  "MT SINOP",
  "DF BRASILIA",
  "GO PLANALTO CENTRAL",
  "GO PORANGATU",
  "GO VALE DOURADO",
  "MT COCALINHO",
  "SP ITAPETININGA",
  "TO ARAGUAINA",
  "TO DIANOPOLIS",
  "TO GURUPI",
  "TO TOCANTINS NORTE",
  "TO TOCANTINS SUL",
  "AL MACEIO",
  "CE CEARA",
  "PE RECIFE",
  "BA BARREIRAS",
  "BA EUNAPOLIS",
  "BA FEIRA DE SANTANA",
  "BA GUANAMBI",
  "BA ITABUNA",
  "BA ITAPETINGA",
  "BA OESTE BAHIA",
  "BA SANTA MARIA DA VITORIA",
  "BA TEIXEIRA DE FREITAS",
  "BA VITORIA CONQUISTA",
  "ES ESPIRITO SANTO",
  "ES LINHARES",
  "MG ARACUAI",
  "MG BELO HORIZONTE NORTE",
  "MG CENTRAL DE MINAS",
  "MG GOVERNADOR VALADARES",
  "MG MONTES CLAROS",
  "MG MUCURI",
  "MG NANUQUE",
  "MG POMPEU",
  "MG TEOFILO OTONI",
  "PR BARRACAO",
  "PR CAMPO MOURAO",
  "PR CANDIDO RONDON",
  "PR CORNELIO PROCOPIO",
  "PR GUARAPUAVA",
  "PR MANGUEIRINHA",
  "PR MARINGA",
  "PR NOVA LARANJEIRAS",
  "PR SAO JOAO",
  "RS CACHOEIRA DO SUL",
  "RS DOM PEDRITO",
  "RS PELOTAS",
  "RS PORTO ALEGRE",
  "RS SANTIAGO",
  "SC CAPINZAL",
  "SC SANTA CATARINA CORTE",
  "AM MANAUS",
  "GO VALE DO ARAGUAIA",
  "MA ACAILANDIA",
  "MA IMPERATRIZ",
  "MA PRESIDENTE DUTRA",
  "MA SANTA INES",
  "PA ALTAMIRA",
  "PA BELEM",
  "PA JACUNDA",
  "PA MARABA",
  "PA ORIXIMINA",
  "PA PARAGOMINAS",
  "PA XINGU",
  "PA XINGUARA",
  "PR FRANCISCO BELTRAO",
  "PR LONDRINA",
  "RR RORAIMA",
  "SC MARAVILHA",
  "GO OESTE GOIANO",
  "MT AGUA BOA",
  "MT BARRA DO GARCAS",
  "MT CONFRESA",
  "MT CUIABA",
  "MT JUINA",
  "MT MATUPA",
  "MT NOVA XAVANTINA",
  "MT OESTE MT",
  "MT PONTES E LACERDA",
  "MT RONDONOPOLIS",
  "RO RONDONIA",
  "GO GOIAS SUL",
  "GO IPORA",
  "GO MORRINHOS",
  "GO RIO VERDE",
  "MG ARAGUARI",
  "MG CENTRO OESTE DE MINAS",
  "MG GUIMARANIA",
  "MG ITUIUTABA",
  "MG JOAO PINHEIRO",
  "MG LAGOA FORMOSA",
  "MG PARACATU",
  "MG PATOS DE MINAS",
  "MG PATOS NORTE",
  "MG PERDIZES",
  "MG PONTAL",
  "MG SANTA VITORIA",
  "MG TIROS",
  "MG TRIANGULO",
  "MG UBERABA",
  "MG UBERLANDIA",
  "GO GOIANIA",
  "GO GOIAS NORTE",
  "GO MINEIROS",
  "PA NOVO PROGRESSO",
  "SP ARACATUBA",
  "SP BAURU",
  "Virtual Sales Region",
  "MG BELO HORIZONTE SUL",
  "MG BOM SUCESSO",
  "MG CARMO DO RIO CLARO",
  "MG CONSELHEIRO LAFAIETE",
  "MG ITABIRA",
  "MG ITANHANDU",
  "MG LAVRAS",
  "MG POUSO ALEGRE",
  "MG SAO GONCALO DO SAPUCAI",
  "MG SAO JOAO DEL REI",
  "SE SERGIPE",
  "PR CARAMBEI",
  "PR CASTRO",
  "RS FREDERICO WESTPHALEN",
  "RS IJUI",
  "RS SANTA ROSA",
  "RS TAPEJARA",
  "RS TEUTONIA",
  "SC BRACO DO NORTE",
  "SC CONCORDIA",
  "SC SANTA CATARINA",
  "SC TIMBO",
  "SC TREZE TILIAS"
];

const HEADERS = [
  'ID da demanda',
  'Data de envio',
  'Status',
  'Prioridade estimada',
  'Tipo de solicitante',
  'Solicitante',
  'E-mail do solicitante',
  'Distrital vinculado',
  'Tipo de demanda',
  'Pode ser remoto?',
  'Objetivo',
  'Informações adicionais',
  'Técnico demandado',
  'Técnico obrigatório?',
  'Justificativa do técnico',
  'Opção 1 — início',
  'Opção 1 — fim',
  'Opção 2 — início',
  'Opção 2 — fim',
  'Opção 3 — início',
  'Opção 3 — fim',
  'Urgência',
  'Impacto principal',
  'Risco',
  'Data de retorno',
  'Decisão',
  'Motivo da negativa/ajuste',
  'Responsável pela triagem',
  'Observações internas',
  'Data aprovada — início',
  'Data aprovada — fim',
  'E-mail de retorno enviado?',
  'Data/hora envio retorno'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Central Técnica Leite')
    .addItem('Enviar retorno da linha selecionada', 'enviarRetornoLinhaSelecionada')
    .addItem('Marcar linha como Em triagem', 'marcarLinhaEmTriagem')
    .addSeparator()
    .addItem('Atualizar painel e organização', 'organizarPlanilha')
    .addToUi();
}

function doGet() {
  return ContentService
    .createTextOutput('Central Técnica Leite API ativa.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const payload = parsePayload_(e);
    const id = gerarId_();
    const sheet = getSheet_();
    garantirCabecalhos_(sheet);

    const dados = normalizarPayload_(payload);

    sheet.appendRow([
      id,
      new Date(),
      'Recebida',
      dados.prioridadeCalculada,
      dados.tipoSolicitante,
      dados.nomeSolicitante,
      dados.emailSolicitante,
      dados.distritalVinculado,
      dados.tipoDemanda,
      dados.podeRemoto,
      dados.objetivo,
      dados.informacoesAdicionais,
      dados.tecnicoDemandado,
      dados.tecnicoObrigatorio,
      dados.justificativaTecnico,
      dados.opcao1Inicio,
      dados.opcao1Fim,
      dados.opcao2Inicio,
      dados.opcao2Fim,
      dados.opcao3Inicio,
      dados.opcao3Fim,
      dados.urgencia,
      dados.impacto,
      dados.risco,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);

    enviarEmailConfirmacao_(dados, id);
    enviarEmailTriagem_(dados, id);
    organizarPlanilha();

    return respostaJson_({ ok: true, id: id, status: 'Recebida' });

  } catch (err) {
    return respostaJson_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function setupSheet() {
  const sheet = getSheet_();
  garantirCabecalhos_(sheet);
  organizarPlanilha();
}

function organizarPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet_();

  garantirCabecalhos_(sheet);
  organizarAbaDemandas_(sheet);
  criarOuAtualizarAbaListas_(ss);
  aplicarValidacoes_(ss, sheet);
  aplicarFormatacaoCondicional_(sheet);
  criarPainelExecutivo_(ss, sheet);

  SpreadsheetApp.flush();
}

function normalizarPayload_(payload) {
  const tipoSolicitante = limpar_(payload.tipoSolicitante || payload.funcao || '');
  const nomeSolicitante = limpar_(payload.nomeSolicitante || payload.nome || '');
  let emailSolicitante = limpar_(payload.emailSolicitante || payload.email || '');
  let distritalVinculado = limpar_(payload.distritalVinculado || payload.regional || payload.regionalDistrital || '');

  if (tipoSolicitante === 'Distrital') {
    distritalVinculado = nomeSolicitante;
    if (!emailSolicitante) emailSolicitante = buscarEmailEmMapa_(nomeSolicitante, EMAIL_DISTRITAIS);
  }

  if (tipoSolicitante === 'Técnico') {
    if (!emailSolicitante) emailSolicitante = buscarEmailEmMapa_(nomeSolicitante, EMAIL_TECNICOS);
  }

  if (tipoSolicitante === 'Regional') {
    distritalVinculado = buscarEmailOuValorEmMapa_(nomeSolicitante, REGIONAIS_PARA_DISTRITAIS) || distritalVinculado;
  }

  return {
    prioridadeCalculada: limpar_(payload.prioridadeCalculada || payload.prioridade || ''),
    tipoSolicitante: tipoSolicitante,
    nomeSolicitante: nomeSolicitante,
    emailSolicitante: emailSolicitante,
    distritalVinculado: distritalVinculado,
    tipoDemanda: formatarLista_(payload.tipoDemanda || payload.tiposDemanda || ''),
    podeRemoto: limpar_(payload.podeRemoto || payload.atendimentoRemoto || ''),
    objetivo: limpar_(payload.objetivo || payload.objetivoSolicitacao || ''),
    informacoesAdicionais: limpar_(payload.informacoesAdicionais || payload.contexto || payload.contextoAdicional || ''),
    tecnicoDemandado: limpar_(payload.tecnicoDemandado || payload.tecnicoPreferencial || ''),
    tecnicoObrigatorio: limpar_(payload.tecnicoObrigatorio || ''),
    justificativaTecnico: limpar_(payload.justificativaTecnico || ''),
    opcao1Inicio: limpar_(payload.opcao1Inicio || payload.dataIdealInicio || ''),
    opcao1Fim: limpar_(payload.opcao1Fim || payload.dataIdealFim || ''),
    opcao2Inicio: limpar_(payload.opcao2Inicio || payload.segundaOpcaoInicio || ''),
    opcao2Fim: limpar_(payload.opcao2Fim || payload.segundaOpcaoFim || ''),
    opcao3Inicio: limpar_(payload.opcao3Inicio || payload.terceiraOpcaoInicio || ''),
    opcao3Fim: limpar_(payload.opcao3Fim || payload.terceiraOpcaoFim || ''),
    urgencia: limpar_(payload.urgencia || ''),
    impacto: limpar_(payload.impacto || payload.impactoPrincipal || ''),
    risco: limpar_(payload.risco || '')
  };
}

function enviarRetornoLinhaSelecionada() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getName() !== CONFIG.SHEET_NAME) {
    ui.alert('Abra a aba "Demandas" e selecione a linha da demanda que deseja responder.');
    return;
  }

  const range = sheet.getActiveRange();
  if (!range || range.getRow() <= 1) {
    ui.alert('Selecione uma linha válida de demanda.');
    return;
  }

  const row = range.getRow();
  garantirCabecalhos_(sheet);
  const dados = lerLinhaComoObjeto_(sheet, row);

  const id = limpar_(dados['ID da demanda']);
  const emailSolicitante = limpar_(dados['E-mail do solicitante']);
  const solicitante = limpar_(dados['Solicitante']);
  const decisao = limpar_(dados['Decisão']);
  const retornoJaEnviado = limpar_(dados['E-mail de retorno enviado?']);

  if (!id) {
    ui.alert('Essa linha não possui ID da demanda.');
    return;
  }

  if (!emailSolicitante) {
    ui.alert('Essa demanda não possui e-mail do solicitante.');
    return;
  }

  if (!decisao) {
    ui.alert('Preencha a coluna "Decisão" antes de enviar o retorno.');
    return;
  }

  const decisoesValidas = [
    'Aprovada',
    'Aprovada com ajuste de data',
    'Aguardando informações',
    'Negada com justificativa',
    'Cancelada',
    'Concluída'
  ];

  if (!decisoesValidas.includes(decisao)) {
    ui.alert('A decisão informada não gera retorno automático.\n\nUse uma destas opções:\n' + decisoesValidas.join('\n'));
    return;
  }

  const motivo = limpar_(dados['Motivo da negativa/ajuste']);
  if (['Aprovada com ajuste de data', 'Aguardando informações', 'Negada com justificativa', 'Cancelada'].includes(decisao) && !motivo) {
    ui.alert('Para essa decisão, preencha a coluna "Motivo da negativa/ajuste" antes de enviar o retorno.');
    return;
  }

  if (retornoJaEnviado.toLowerCase() === 'sim') {
    const confirmReenvio = ui.alert(
      'Retorno já enviado',
      `Essa demanda (${id}) já possui retorno enviado.\n\nDeseja reenviar mesmo assim?`,
      ui.ButtonSet.YES_NO
    );
    if (confirmReenvio !== ui.Button.YES) return;
  }

  const ccRetorno = montarCcRetorno_(dados);
  const textoCc = ccRetorno ? `\n\nCópia para:\n${ccRetorno}` : '\n\nSem cópia automática encontrada.';

  const confirmacao = ui.alert(
    'Confirmar envio',
    `Enviar retorno para ${solicitante || emailSolicitante}?\n\nProtocolo: ${id}\nDecisão: ${decisao}${textoCc}`,
    ui.ButtonSet.YES_NO
  );
  if (confirmacao !== ui.Button.YES) return;

  const emailRetorno = montarEmailRetorno_(dados, decisao);

  const mailOptions = {
    to: emailSolicitante,
    subject: emailRetorno.subject,
    body: emailRetorno.body,
    name: CONFIG.REMETENTE_NOME
  };

  if (ccRetorno) mailOptions.cc = ccRetorno;
  MailApp.sendEmail(mailOptions);

  const statusFinal = statusFinalPorDecisao_(decisao);
  setValorPorCabecalho_(sheet, row, 'Status', statusFinal);
  setValorPorCabecalho_(sheet, row, 'Data de retorno', new Date());
  setValorPorCabecalho_(sheet, row, 'E-mail de retorno enviado?', 'Sim');
  setValorPorCabecalho_(sheet, row, 'Data/hora envio retorno', new Date());

  const responsavelAtual = limpar_(dados['Responsável pela triagem']);
  if (!responsavelAtual) {
    setValorPorCabecalho_(sheet, row, 'Responsável pela triagem', nomeUsuarioAtual_());
  }

  organizarPlanilha();

  ui.alert(
    `Retorno enviado com sucesso.\n\nProtocolo: ${id}\nStatus atualizado: ${statusFinal}\n\nEnviado para: ${emailSolicitante}` +
    (ccRetorno ? `\nCópia para: ${ccRetorno}` : '')
  );
}

function marcarLinhaEmTriagem() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getName() !== CONFIG.SHEET_NAME) {
    ui.alert('Abra a aba "Demandas" e selecione a linha da demanda.');
    return;
  }

  const range = sheet.getActiveRange();
  if (!range || range.getRow() <= 1) {
    ui.alert('Selecione uma linha válida de demanda.');
    return;
  }

  const row = range.getRow();
  setValorPorCabecalho_(sheet, row, 'Status', 'Em triagem');

  const dados = lerLinhaComoObjeto_(sheet, row);
  if (!limpar_(dados['Responsável pela triagem'])) {
    setValorPorCabecalho_(sheet, row, 'Responsável pela triagem', nomeUsuarioAtual_());
  }

  organizarPlanilha();
  ui.alert('Demanda marcada como "Em triagem".');
}

function montarCcRetorno_(dados) {
  const emailSolicitante = limpar_(dados['E-mail do solicitante']);
  const tecnico = limpar_(dados['Técnico demandado']);
  const distrital = limpar_(dados['Distrital vinculado']);

  const emails = [];

  const emailTecnico = buscarEmailEmMapa_(tecnico, EMAIL_TECNICOS);
  if (emailTecnico) emails.push(emailTecnico);

  const emailDistrital = buscarEmailEmMapa_(distrital, EMAIL_DISTRITAIS);
  if (emailDistrital) emails.push(emailDistrital);

  if (CONFIG.COPIAR_TRIAGEM_EM_RETORNOS) emails.push(CONFIG.TRIAGEM_EMAIL);

  return deduplicarEmails_(emails, [emailSolicitante]).join(', ');
}

function montarEmailRetorno_(dados, decisao) {
  const id = limpar_(dados['ID da demanda']);
  const nome = limpar_(dados['Solicitante']);
  const tipoSolicitante = limpar_(dados['Tipo de solicitante']);
  const distrital = limpar_(dados['Distrital vinculado']);
  const tecnico = limpar_(dados['Técnico demandado']);
  const tipo = limpar_(dados['Tipo de demanda']);
  const motivo = limpar_(dados['Motivo da negativa/ajuste']);
  const observacoes = limpar_(dados['Observações internas']);
  const dataAprovadaInicio = limpar_(dados['Data aprovada — início']);
  const dataAprovadaFim = limpar_(dados['Data aprovada — fim']);
  const periodoAprovado = periodo_(dataAprovadaInicio, dataAprovadaFim);

  const saudacao = `Olá, ${nome || 'tudo bem'}.\n\n`;
  const base = `Protocolo: ${id}\nTipo de solicitante: ${tipoSolicitante}\nSolicitante: ${nome}\nDistrital vinculado: ${distrital}\nTipo de demanda: ${tipo}\nTécnico demandado: ${tecnico}`;
  const rodape = `\n\nAtenciosamente,\n${CONFIG.REMETENTE_NOME}`;

  let subject = '';
  let body = '';

  if (decisao === 'Aprovada') {
    subject = `[${id}] Demanda técnica aprovada`;
    body = saudacao +
      `Sua solicitação de agenda técnica foi aprovada.\n\n` +
      `${base}\nStatus: Aprovada\nPeríodo aprovado: ${periodoAprovado || 'a confirmar conforme alinhamento da equipe técnica'}\n\n` +
      `A equipe técnica seguirá com os alinhamentos necessários para execução da demanda.` +
      (observacoes ? `\n\nObservações:\n${observacoes}` : '') +
      rodape;
  }

  if (decisao === 'Aprovada com ajuste de data') {
    subject = `[${id}] Demanda técnica aprovada com ajuste de data`;
    body = saudacao +
      `Sua solicitação de agenda técnica foi aprovada, porém com necessidade de ajuste de data.\n\n` +
      `${base}\nStatus: Aprovada com ajuste de data\nPeríodo aprovado/sugerido: ${periodoAprovado || 'informado abaixo'}\n\n` +
      `Ajuste/justificativa:\n${motivo}` +
      (observacoes ? `\n\nObservações:\n${observacoes}` : '') +
      rodape;
  }

  if (decisao === 'Aguardando informações') {
    subject = `[${id}] Solicitação de informações complementares`;
    body = saudacao +
      `Recebemos sua solicitação de agenda técnica, mas precisamos de informações complementares antes de avançar com a triagem.\n\n` +
      `${base}\nStatus: Aguardando informações\n\n` +
      `Informações necessárias:\n${motivo}` +
      (observacoes ? `\n\nObservações:\n${observacoes}` : '') +
      `\n\nAssim que recebermos essas informações, a demanda poderá seguir para avaliação de agenda e prioridade.` +
      rodape;
  }

  if (decisao === 'Negada com justificativa') {
    subject = `[${id}] Retorno sobre solicitação de agenda técnica`;
    body = saudacao +
      `Após avaliação da solicitação, não será possível atender essa demanda no formato solicitado neste momento.\n\n` +
      `${base}\nStatus: Negada com justificativa\n\n` +
      `Justificativa:\n${motivo}` +
      (observacoes ? `\n\nAlternativa/observações:\n${observacoes}` : '') +
      rodape;
  }

  if (decisao === 'Cancelada') {
    subject = `[${id}] Solicitação de agenda técnica cancelada`;
    body = saudacao +
      `A solicitação de agenda técnica abaixo foi cancelada.\n\n` +
      `${base}\nStatus: Cancelada\n\nMotivo:\n${motivo}` +
      (observacoes ? `\n\nObservações:\n${observacoes}` : '') +
      rodape;
  }

  if (decisao === 'Concluída') {
    subject = `[${id}] Demanda técnica concluída`;
    body = saudacao +
      `A demanda técnica abaixo foi marcada como concluída.\n\n` +
      `${base}\nStatus: Concluída` +
      (observacoes ? `\n\nObservações:\n${observacoes}` : '') +
      rodape;
  }

  return { subject, body };
}

function statusFinalPorDecisao_(decisao) {
  const mapa = {
    'Aprovada': 'Aprovada',
    'Aprovada com ajuste de data': 'Aprovada com ajuste de data',
    'Aguardando informações': 'Aguardando informações',
    'Negada com justificativa': 'Negada com justificativa',
    'Cancelada': 'Cancelada',
    'Concluída': 'Concluída'
  };
  return mapa[decisao] || decisao;
}

function enviarEmailConfirmacao_(dados, id) {
  const email = dados.emailSolicitante;
  if (!email) return;

  const subject = `[${id}] Solicitação de agenda técnica recebida`;
  const body = `Olá, ${dados.nomeSolicitante || ''}.

Recebemos sua solicitação de agenda técnica.

Protocolo: ${id}
Status inicial: Recebida

Tipo de solicitante: ${dados.tipoSolicitante}
Solicitante: ${dados.nomeSolicitante}
Distrital vinculado: ${dados.distritalVinculado}
Tipo de demanda: ${dados.tipoDemanda}
Técnico demandado: ${dados.tecnicoDemandado}
Urgência: ${dados.urgencia}
Prioridade estimada: ${dados.prioridadeCalculada}

Opção 1: ${periodo_(dados.opcao1Inicio, dados.opcao1Fim)}
Opção 2: ${periodo_(dados.opcao2Inicio, dados.opcao2Fim)}
Opção 3: ${periodo_(dados.opcao3Inicio, dados.opcao3Fim)}

Objetivo:
${dados.objetivo}

Informações adicionais:
${dados.informacoesAdicionais}

A equipe técnica irá avaliar a demanda, cruzar com a agenda do técnico demandado e retornar por e-mail com aprovação, ajuste de data, solicitação de informações ou negativa justificada.

Atenciosamente,
${CONFIG.REMETENTE_NOME}`;

  MailApp.sendEmail({ to: email, subject: subject, body: body, name: CONFIG.REMETENTE_NOME });
}

function enviarEmailTriagem_(dados, id) {
  const subject = `[${id}] Nova demanda técnica para triagem`;

  const body = `Nova demanda técnica recebida.

Protocolo: ${id}
Status inicial: Recebida

Tipo de solicitante: ${dados.tipoSolicitante}
Solicitante: ${dados.nomeSolicitante}
E-mail: ${dados.emailSolicitante}
Distrital vinculado: ${dados.distritalVinculado}

Tipo de demanda: ${dados.tipoDemanda}
Técnico demandado: ${dados.tecnicoDemandado}
Técnico obrigatório?: ${dados.tecnicoObrigatorio}
Pode ser remoto?: ${dados.podeRemoto}

Opção 1: ${periodo_(dados.opcao1Inicio, dados.opcao1Fim)}
Opção 2: ${periodo_(dados.opcao2Inicio, dados.opcao2Fim)}
Opção 3: ${periodo_(dados.opcao3Inicio, dados.opcao3Fim)}

Urgência: ${dados.urgencia}
Impacto principal: ${dados.impacto}
Risco: ${dados.risco}
Prioridade estimada: ${dados.prioridadeCalculada}

Objetivo:
${dados.objetivo}

Informações adicionais:
${dados.informacoesAdicionais}

Justificativa do técnico:
${dados.justificativaTecnico}

Próxima etapa:
Avaliar escopo, prioridade e disponibilidade de agenda.`;

  MailApp.sendEmail({ to: CONFIG.TRIAGEM_EMAIL, subject: subject, body: body, name: CONFIG.REMETENTE_NOME });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    garantirColunasMinimas_(sheet);
    sheet.appendRow(HEADERS);
  }

  return sheet;
}

function garantirColunasMinimas_(sheet) {
  const maxCols = sheet.getMaxColumns();
  if (maxCols < HEADERS.length) {
    sheet.insertColumnsAfter(maxCols, HEADERS.length - maxCols);
  }
}

function garantirCabecalhos_(sheet) {
  garantirColunasMinimas_(sheet);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    return;
  }
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

function organizarAbaDemandas_(sheet) {
  garantirColunasMinimas_(sheet);

  const lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
  const lastRow = Math.max(sheet.getLastRow(), 2);

  sheet.setFrozenRows(1);

  sheet.getRange(1, 1, 1, lastCol)
    .setFontWeight('bold')
    .setBackground('#003b79')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  sheet.getRange(1, 1, lastRow, lastCol)
    .setVerticalAlignment('middle')
    .setWrap(true);

  const filtro = sheet.getFilter();
  if (filtro) filtro.remove();
  sheet.getRange(1, 1, lastRow, lastCol).createFilter();

  const widths = {
    1: 120, 2: 140, 3: 210, 4: 150, 5: 160, 6: 220, 7: 240, 8: 200,
    9: 260, 10: 150, 11: 360, 12: 360, 13: 190, 14: 180, 15: 300,
    16: 130, 17: 130, 18: 130, 19: 130, 20: 130, 21: 130, 22: 150,
    23: 200, 24: 230, 25: 140, 26: 220, 27: 320, 28: 200, 29: 360,
    30: 150, 31: 150, 32: 170, 33: 180
  };

  Object.keys(widths).forEach(col => sheet.setColumnWidth(Number(col), widths[col]));
  sheet.setRowHeight(1, 44);

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol)
      .setFontSize(10)
      .setBorder(true, true, true, true, true, true, '#d9e2ef', SpreadsheetApp.BorderStyle.SOLID);
  }

  sheet.getRange('B:B').setNumberFormat('dd/mm/yyyy hh:mm');
  sheet.getRange('P:U').setNumberFormat('dd/mm/yyyy');
  sheet.getRange('Y:Y').setNumberFormat('dd/mm/yyyy');
  sheet.getRange('AD:AE').setNumberFormat('dd/mm/yyyy');
  sheet.getRange('AG:AG').setNumberFormat('dd/mm/yyyy hh:mm');
}

function criarOuAtualizarAbaListas_(ss) {
  let listas = ss.getSheetByName(CONFIG.LISTS_SHEET_NAME);
  if (!listas) listas = ss.insertSheet(CONFIG.LISTS_SHEET_NAME);

  listas.showSheet();
  listas.clear();

  const maxLen = Math.max(
    12,
    LISTA_DISTRITAIS.length,
    LISTA_TECNICOS.length,
    LISTA_REGIONAIS.length
  );

  const headers = ['Status', 'Decisão', 'Responsável pela triagem', 'Técnicos', 'Tipo de demanda', 'Urgência', 'Sim/Não', 'Risco', 'Distritais', 'Regionais', 'Tipo de solicitante'];
  const status = ['Recebida','Em triagem','Aguardando validação de agenda','Aguardando informações','Aprovada','Aprovada com ajuste de data','Negada com justificativa','Concluída','Cancelada'];
  const decisao = ['Aprovada','Aprovada com ajuste de data','Aguardando informações','Negada com justificativa','Cancelada','Concluída'];
  const responsavel = ['Rafael Azevedo','Paula Tiveron'];
  const tipoDemanda = ['Genética - Leite Europeu','Genética - Leite Tropical','Inseminação Artificial - Corte','Inseminação Artificial - Leite','Neonatos - Corte','Neonatos - Leite','Pecuária de Precisão','Reprodução','Termômetros para mensuração de estresse térmico','Embriões'];
  const urgencia = ['acima de 3 meses','2 a 3 meses','1 mês'];
  const simNao = ['Sim','Não'];
  const risco = ['Baixo','Médio','Alto'];
  const tipoSolicitante = ['Distrital','Regional','Técnico'];

  const rows = [headers];

  for (let i = 0; i < maxLen; i++) {
    rows.push([
      status[i] || '',
      decisao[i] || '',
      responsavel[i] || '',
      LISTA_TECNICOS[i] || '',
      tipoDemanda[i] || '',
      urgencia[i] || '',
      simNao[i] || '',
      risco[i] || '',
      LISTA_DISTRITAIS[i] || '',
      LISTA_REGIONAIS[i] || '',
      tipoSolicitante[i] || ''
    ]);
  }

  listas.getRange(1, 1, rows.length, headers.length).setValues(rows);
  listas.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#003b79')
    .setFontColor('#ffffff');

  listas.autoResizeColumns(1, headers.length);
  listas.setFrozenRows(1);
  listas.hideSheet();
}

function aplicarValidacoes_(ss, sheet) {
  const listas = ss.getSheetByName(CONFIG.LISTS_SHEET_NAME);
  const maxRows = 3000;

  const criarValidacao = range => SpreadsheetApp.newDataValidation()
    .requireValueInRange(range, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, 3, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('A2:A20')));
  sheet.getRange(2, 5, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('K2:K10')));
  sheet.getRange(2, 8, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('I2:I30')));
  sheet.getRange(2, 9, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('E2:E20')));
  sheet.getRange(2, 13, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('D2:D30')));
  sheet.getRange(2, 22, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('F2:F10')));
  sheet.getRange(2, 24, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('H2:H4')));
  sheet.getRange(2, 26, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('B2:B20')));
  sheet.getRange(2, 28, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('C2:C20')));
  sheet.getRange(2, 32, maxRows, 1).setDataValidation(criarValidacao(listas.getRange('G2:G3')));
}

function aplicarFormatacaoCondicional_(sheet) {
  const range = sheet.getRange('A2:AG3000');
  const regras = [];
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C2="Recebida"').setBackground('#eaf3ff').setRanges([range]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C2="Em triagem"').setBackground('#fff4d6').setRanges([range]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C2="Aguardando validação de agenda"').setBackground('#f3e8ff').setRanges([range]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C2="Aguardando informações"').setBackground('#fff7ed').setRanges([range]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C2="Aprovada"').setBackground('#e8f5e9').setRanges([range]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C2="Aprovada com ajuste de data"').setBackground('#dff6f3').setRanges([range]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C2="Negada com justificativa"').setBackground('#fdecea').setRanges([range]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C2="Concluída"').setBackground('#eeeeee').setRanges([range]).build());
  sheet.setConditionalFormatRules(regras);
}

function criarPainelExecutivo_(ss, demandSheet) {
  let painel = ss.getSheetByName(CONFIG.DASHBOARD_SHEET_NAME);
  if (!painel) painel = ss.insertSheet(CONFIG.DASHBOARD_SHEET_NAME);

  painel.getRange('A1:N80').breakApart();
  painel.clear();
  painel.clearFormats();
  painel.setConditionalFormatRules([]);
  painel.setHiddenGridlines(true);
  painel.getCharts().forEach(chart => painel.removeChart(chart));

  const demandas = obterDemandasComoObjetos_(demandSheet);
  const total = demandas.length;

  const statusCounts = contarPorCampo_(demandas, 'Status');
  const tipoCounts = contarPorCampo_(demandas, 'Tipo de demanda');
  const tecnicoCounts = contarPorCampo_(demandas, 'Técnico demandado');
  const distritalCounts = contarPorCampo_(demandas, 'Distrital vinculado');
  const solicitanteCounts = contarPorCampo_(demandas, 'Tipo de solicitante');

  const recebidas = statusCounts['Recebida'] || 0;
  const emTriagem = statusCounts['Em triagem'] || 0;
  const aguardandoAgenda = statusCounts['Aguardando validação de agenda'] || 0;
  const aguardandoInfo = statusCounts['Aguardando informações'] || 0;
  const aprovadas = statusCounts['Aprovada'] || 0;
  const aprovadasAjuste = statusCounts['Aprovada com ajuste de data'] || 0;
  const negadas = statusCounts['Negada com justificativa'] || 0;
  const concluidas = statusCounts['Concluída'] || 0;
  const canceladas = statusCounts['Cancelada'] || 0;

  const abertas = total - concluidas - canceladas;
  const remotas = demandas.filter(d => normalizarTexto_(d['Pode ser remoto?']) === 'sim').length;
  const tecnicoObrigatorio = demandas.filter(d => normalizarTexto_(d['Técnico obrigatório?']).includes('sim')).length;
  const riscoAlto = demandas.filter(d => normalizarTexto_(d['Risco']) === 'alto').length;
  const urgentes = demandas.filter(d => normalizarTexto_(d['Urgência']) === '1 mes').length;
  const retornosEnviados = demandas.filter(d => normalizarTexto_(d['E-mail de retorno enviado?']) === 'sim').length;
  const taxaRetorno = total > 0 ? Math.round((retornosEnviados / total) * 100) : 0;
  const taxaAprovacao = total > 0 ? Math.round(((aprovadas + aprovadasAjuste) / total) * 100) : 0;
  const ultimaAtualizacao = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

  painel.setColumnWidths(1, 14, 120);
  painel.getRange('A1:N80').setBackground('#f4f7fb').setFontFamily('Arial');

  painel.getRange('A1:N2').merge();
  painel.getRange('A1').setValue('Central Técnica Leite — Painel Executivo de Demandas')
    .setBackground('#003b79').setFontColor('#ffffff').setFontSize(22).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  painel.getRange('A3:N3').merge();
  painel.getRange('A3').setValue(`Visão gerencial das solicitações técnicas | Atualizado em ${ultimaAtualizacao}`)
    .setBackground('#dbe8f6').setFontColor('#1f3f66').setFontSize(11).setHorizontalAlignment('center');

  criarCardExecutivo_(painel, 5, 1, 2, 'Total', total, 'Demandas registradas', '#003b79', '#ffffff');
  criarCardExecutivo_(painel, 5, 3, 2, 'Abertas', abertas, 'Ainda em fluxo', '#0054a6', '#ffffff');
  criarCardExecutivo_(painel, 5, 5, 2, 'Recebidas', recebidas, 'Aguardando triagem', '#2f80ed', '#ffffff');
  criarCardExecutivo_(painel, 5, 7, 2, 'Em triagem', emTriagem, 'Análise técnica', '#f2c94c', '#111827');
  criarCardExecutivo_(painel, 5, 9, 2, 'Aguard. agenda', aguardandoAgenda, 'Validação de data', '#9b51e0', '#ffffff');
  criarCardExecutivo_(painel, 5, 11, 2, 'Aprovadas', aprovadas + aprovadasAjuste, `${taxaAprovacao}% do total`, '#27ae60', '#ffffff');
  criarCardExecutivo_(painel, 5, 13, 2, 'Negadas', negadas, 'Não aprovadas', '#eb5757', '#ffffff');

  criarCardExecutivo_(painel, 10, 1, 2, 'Aguard. info', aguardandoInfo, 'Pendente solicitante', '#f97316', '#ffffff');
  criarCardExecutivo_(painel, 10, 3, 2, 'Remotas', remotas, 'Podem ser remotas', '#0f766e', '#ffffff');
  criarCardExecutivo_(painel, 10, 5, 2, 'Téc. obrigatório', tecnicoObrigatorio, 'Exigem técnico específico', '#7c3aed', '#ffffff');
  criarCardExecutivo_(painel, 10, 7, 2, 'Risco alto', riscoAlto, 'Atenção prioritária', '#b91c1c', '#ffffff');
  criarCardExecutivo_(painel, 10, 9, 2, 'Urgência 1 mês', urgentes, 'Maior prioridade', '#ea580c', '#ffffff');
  criarCardExecutivo_(painel, 10, 11, 2, 'Retornos enviados', retornosEnviados, `${taxaRetorno}% respondidas`, '#0891b2', '#ffffff');
  criarCardExecutivo_(painel, 10, 13, 2, 'Concluídas', concluidas, 'Fluxo encerrado', '#6b7280', '#ffffff');

  criarTituloExecutivo_(painel, 'A16:D16', 'Status das demandas');
  criarTituloExecutivo_(painel, 'F16:I16', 'Top tipos de demanda');
  criarTituloExecutivo_(painel, 'K16:N16', 'Tipo de solicitante');

  escreverTabelaExecutiva_(painel, 17, 1, ['Status', 'Qtd.'], [
    ['Recebida', recebidas],
    ['Em triagem', emTriagem],
    ['Aguardando validação de agenda', aguardandoAgenda],
    ['Aguardando informações', aguardandoInfo],
    ['Aprovada', aprovadas],
    ['Aprovada com ajuste de data', aprovadasAjuste],
    ['Negada com justificativa', negadas],
    ['Concluída', concluidas],
    ['Cancelada', canceladas]
  ]);
  escreverTabelaExecutiva_(painel, 17, 6, ['Tipo de demanda', 'Qtd.'], ordenarObjetoPorValorDesc_(tipoCounts).slice(0, 10));
  escreverTabelaExecutiva_(painel, 17, 11, ['Solicitante', 'Qtd.'], ordenarObjetoPorValorDesc_(solicitanteCounts).slice(0, 10));

  criarTituloExecutivo_(painel, 'A31:E31', 'Demandas por técnico');
  criarTituloExecutivo_(painel, 'G31:J31', 'Demandas por distrital');
  criarTituloExecutivo_(painel, 'L31:N31', 'Alertas de gestão');

  escreverTabelaExecutiva_(painel, 32, 1, ['Técnico', 'Qtd.'], ordenarObjetoPorValorDesc_(tecnicoCounts).slice(0, 10));
  escreverTabelaExecutiva_(painel, 32, 7, ['Distrital', 'Qtd.'], ordenarObjetoPorValorDesc_(distritalCounts).slice(0, 10));
  escreverTabelaExecutiva_(painel, 32, 12, ['Alerta', 'Status'], montarAlertasExecutivos_(abertas, riscoAlto, urgentes, tecnicoObrigatorio));

  criarTituloExecutivo_(painel, 'A47:N47', 'Últimas demandas registradas');
  const ultimas = demandas.slice(-8).reverse().map(d => [
    d['ID da demanda'] || '',
    formatarDataPainel_(d['Data de envio']),
    d['Status'] || '',
    d['Tipo de solicitante'] || '',
    d['Solicitante'] || '',
    d['Distrital vinculado'] || '',
    d['Tipo de demanda'] || '',
    d['Técnico demandado'] || ''
  ]);
  escreverTabelaExecutiva_(painel, 48, 1, ['ID', 'Data', 'Status', 'Tipo', 'Solicitante', 'Distrital', 'Demanda', 'Técnico'], ultimas);

  painel.setFrozenRows(3);
  painel.getRange('A1:N70').setVerticalAlignment('middle').setWrap(true);
  painel.setColumnWidth(1, 150);
  painel.setColumnWidth(2, 120);
  painel.setColumnWidth(3, 150);
  painel.setColumnWidth(4, 120);
  painel.setColumnWidth(5, 160);
  painel.setColumnWidth(6, 240);
  painel.setColumnWidth(7, 160);
  painel.setColumnWidth(8, 160);
  painel.setColumnWidth(9, 120);
  painel.setColumnWidth(10, 110);
  painel.setColumnWidth(11, 190);
  painel.setColumnWidth(12, 120);
  painel.setColumnWidth(13, 120);
  painel.setColumnWidth(14, 120);
}

function criarCardExecutivo_(sheet, row, col, widthCols, titulo, valor, subtitulo, bgColor, fontColor) {
  sheet.getRange(row, col, 4, widthCols).breakApart();
  sheet.getRange(row, col, 1, widthCols).merge().setValue(titulo)
    .setBackground(bgColor).setFontColor(fontColor).setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange(row + 1, col, 2, widthCols).merge().setValue(valor)
    .setBackground(bgColor).setFontColor(fontColor).setFontSize(24).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange(row + 3, col, 1, widthCols).merge().setValue(subtitulo)
    .setBackground(bgColor).setFontColor(fontColor).setFontSize(9).setHorizontalAlignment('center');
}

function criarTituloExecutivo_(sheet, rangeA1, titulo) {
  sheet.getRange(rangeA1).merge().setValue(titulo)
    .setBackground('#003b79').setFontColor('#ffffff').setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
}

function escreverTabelaExecutiva_(sheet, startRow, startCol, headers, rows) {
  const totalCols = headers.length;
  sheet.getRange(startRow, startCol, 1, totalCols).setValues([headers])
    .setBackground('#dbe8f6').setFontColor('#003b79').setFontWeight('bold').setHorizontalAlignment('center');

  if (!rows || rows.length === 0) {
    const vazio = new Array(totalCols).fill('');
    vazio[0] = 'Sem dados';
    sheet.getRange(startRow + 1, startCol, 1, totalCols).setValues([vazio]).setBackground('#ffffff')
      .setBorder(true, true, true, true, true, true, '#e5e7eb', SpreadsheetApp.BorderStyle.SOLID);
    return;
  }

  sheet.getRange(startRow + 1, startCol, rows.length, totalCols).setValues(rows).setBackground('#ffffff')
    .setBorder(true, true, true, true, true, true, '#e5e7eb', SpreadsheetApp.BorderStyle.SOLID);

  if (totalCols >= 2) {
    sheet.getRange(startRow + 1, startCol + totalCols - 1, rows.length, 1)
      .setHorizontalAlignment('center').setFontWeight('bold');
  }
}

function obterDemandasComoObjetos_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  const rows = values.slice(1).filter(row => row.some(cell => String(cell).trim() !== ''));
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, idx) => obj[header] = row[idx]);
    return obj;
  });
}

function contarPorCampo_(dados, campo) {
  const contagem = {};
  dados.forEach(item => {
    let valor = item[campo];
    if (valor === null || valor === undefined || String(valor).trim() === '') valor = 'Não informado';
    else valor = String(valor).trim();
    contagem[valor] = (contagem[valor] || 0) + 1;
  });
  return contagem;
}

function ordenarObjetoPorValorDesc_(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

function montarAlertasExecutivos_(abertas, riscoAlto, urgentes, tecnicoObrigatorio) {
  return [
    ['Demandas em aberto', abertas > 0 ? `${abertas} em andamento` : 'Sem pendências'],
    ['Risco alto', riscoAlto > 0 ? `${riscoAlto} atenção imediata` : 'Sem alerta'],
    ['Urgência 1 mês', urgentes > 0 ? `${urgentes} priorizar` : 'Sem alerta'],
    ['Técnico obrigatório', tecnicoObrigatorio > 0 ? `${tecnicoObrigatorio} dependência` : 'Sem restrição']
  ];
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Payload vazio.');
  return JSON.parse(e.postData.contents);
}

function gerarId_() {
  const tz = Session.getScriptTimeZone();
  const ano = Utilities.formatDate(new Date(), tz, 'yy');
  const props = PropertiesService.getScriptProperties();
  const chave = `CTL_SEQ_${ano}`;
  const atual = Number(props.getProperty(chave) || '0');
  const proximo = atual + 1;
  props.setProperty(chave, String(proximo));
  return `CTL-${ano}-${String(proximo).padStart(3, '0')}`;
}

function periodo_(inicio, fim) {
  if (!inicio && !fim) return 'Não informado';
  const inicioFormatado = formatarData_(inicio);
  const fimFormatado = formatarData_(fim);
  if (inicioFormatado && fimFormatado) return `${inicioFormatado} até ${fimFormatado}`;
  if (inicioFormatado) return `Início: ${inicioFormatado}`;
  if (fimFormatado) return `Fim: ${fimFormatado}`;
  return 'Não informado';
}

function formatarData_(valor) {
  if (!valor) return '';
  const texto = String(valor).trim();
  const matchData = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchData) return `${matchData[3]}/${matchData[2]}/${matchData[1]}`;
  try {
    const data = new Date(texto);
    if (isNaN(data.getTime())) return texto;
    return Utilities.formatDate(data, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  } catch (err) {
    return texto;
  }
}

function formatarDataPainel_(valor) {
  if (!valor) return '';
  try {
    const data = new Date(valor);
    if (isNaN(data.getTime())) return String(valor);
    return Utilities.formatDate(data, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  } catch (e) {
    return String(valor);
  }
}

function formatarLista_(valor) {
  if (!valor) return '';
  if (Array.isArray(valor)) return valor.join('; ');
  return String(valor);
}

function limpar_(valor) {
  if (valor === null || valor === undefined) return '';
  if (Array.isArray(valor)) return valor.join('; ').trim();
  return String(valor).trim();
}

function normalizarTexto_(valor) {
  return String(valor || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizarChaveMapa_(valor) {
  return normalizarTexto_(valor);
}

function buscarEmailEmMapa_(valor, mapa) {
  return buscarEmailOuValorEmMapa_(valor, mapa);
}

function buscarEmailOuValorEmMapa_(valor, mapa) {
  if (!valor || !mapa) return '';
  const chaveNormalizada = normalizarChaveMapa_(valor);
  const chaveEncontrada = Object.keys(mapa).find(chave => normalizarChaveMapa_(chave) === chaveNormalizada);
  if (!chaveEncontrada) return '';
  return limpar_(mapa[chaveEncontrada]);
}

function deduplicarEmails_(emails, excluirEmails) {
  const excluir = expandirListaEmails_(excluirEmails).map(email => email.toLowerCase());
  const resultado = [];
  const vistos = {};

  expandirListaEmails_(emails).forEach(email => {
    const emailLimpo = limpar_(email).toLowerCase();
    if (!emailLimpo) return;
    if (excluir.includes(emailLimpo)) return;
    if (vistos[emailLimpo]) return;
    vistos[emailLimpo] = true;
    resultado.push(emailLimpo);
  });

  return resultado;
}

function expandirListaEmails_(valor) {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor.flatMap(item => expandirListaEmails_(item)).filter(Boolean);
  return String(valor).split(',').map(email => email.trim()).filter(Boolean);
}

function getMapaCabecalhos_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const mapa = {};
  headers.forEach((header, index) => {
    if (header) mapa[String(header).trim()] = index + 1;
  });
  return mapa;
}

function lerLinhaComoObjeto_(sheet, row) {
  const mapa = getMapaCabecalhos_(sheet);
  const lastCol = sheet.getLastColumn();
  const values = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
  const obj = {};
  Object.keys(mapa).forEach(header => obj[header] = values[mapa[header] - 1]);
  return obj;
}

function setValorPorCabecalho_(sheet, row, header, value) {
  const mapa = getMapaCabecalhos_(sheet);
  const col = mapa[header];
  if (!col) throw new Error(`Coluna não encontrada: ${header}`);
  sheet.getRange(row, col).setValue(value);
}

function nomeUsuarioAtual_() {
  const email = Session.getActiveUser().getEmail();
  const mapa = {
    'rafael.azevedo@altagenetics.com': 'Rafael Azevedo',
    'paula.tiveron@altagenetics.com': 'Paula Tiveron'
  };
  return mapa[email] || email || 'Não informado';
}

function respostaJson_(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

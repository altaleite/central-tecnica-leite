/**
 * Central Técnica Leite — Google Apps Script backend
 *
 * Como usar:
 * 1. Crie uma Google Sheet.
 * 2. Abra Extensões > Apps Script.
 * 3. Cole este arquivo em Code.gs.
 * 4. Ajuste os e-mails em CONFIG.
 * 5. Execute setupSheet() uma vez para criar os cabeçalhos.
 * 6. Publique como Web App: Executar como você; acesso conforme política interna.
 * 7. Copie a URL /exec e cole em config.js no campo GAS_ENDPOINT.
 */

const CONFIG = {
  SHEET_NAME: 'Demandas',
  TRIAGEM_EMAIL: 'equipe.tecnica.leite@empresa.com',
  REMETENTE_NOME: 'Central Técnica Leite'
};

const HEADERS = [
  'ID da demanda',
  'Data de envio',
  'Status',
  'Prioridade estimada',
  'Nome do solicitante',
  'E-mail do solicitante',
  'Função',
  'Regional/Distrital',
  'Cliente/Fazenda',
  'Cidade/UF',
  'Perfil da conta',
  'Oportunidade comercial',
  'Tipo de demanda',
  'Pode ser remoto?',
  'Objetivo',
  'Contexto adicional',
  'Técnico preferencial',
  'Técnico obrigatório?',
  'Justificativa do técnico',
  'Data ideal',
  'Segunda opção',
  'Terceira opção',
  'Urgência',
  'Impacto principal',
  'Risco',
  'Prazo limite',
  'Data de retorno',
  'Decisão',
  'Motivo da negativa/ajuste',
  'Responsável pela triagem',
  'Observações internas'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const payload = parsePayload_(e);
    const id = payload.demandaId || gerarId_();
    const sheet = getSheet_();

    sheet.appendRow([
      id,
      new Date(),
      'Recebida',
      payload.prioridadeCalculada || '',
      payload.nomeSolicitante || '',
      payload.emailSolicitante || '',
      payload.funcao || '',
      payload.regional || '',
      payload.cliente || '',
      payload.cidadeUf || '',
      payload.perfilConta || '',
      payload.oportunidadeComercial || '',
      payload.tipoDemanda || '',
      payload.podeRemoto || '',
      payload.objetivo || '',
      payload.contexto || '',
      payload.tecnicoPreferencial || '',
      payload.tecnicoObrigatorio || '',
      payload.justificativaTecnico || '',
      payload.dataIdeal || '',
      payload.dataOpcao2 || '',
      payload.dataOpcao3 || '',
      payload.urgencia || '',
      payload.impacto || '',
      payload.risco || '',
      payload.prazoLimite || '',
      '',
      '',
      '',
      '',
      ''
    ]);

    enviarEmailConfirmacao_(payload, id);
    enviarEmailTriagem_(payload, id);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, id }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function setupSheet() {
  const sheet = getSheet_();
  sheet.clear();
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#123a7a').setFontColor('#ffffff');
  sheet.autoResizeColumns(1, HEADERS.length);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Payload vazio.');
  return JSON.parse(e.postData.contents);
}

function gerarId_() {
  const tz = Session.getScriptTimeZone();
  const stamp = Utilities.formatDate(new Date(), tz, 'yyyyMMdd-HHmmss');
  return `CTL-${stamp}`;
}

function enviarEmailConfirmacao_(payload, id) {
  const email = payload.emailSolicitante;
  if (!email) return;

  const subject = `[${id}] Solicitação de agenda técnica recebida`;
  const body = `Olá, ${payload.nomeSolicitante || ''}.

Recebemos sua solicitação de agenda técnica.

ID da demanda: ${id}
Status inicial: Recebida
Cliente/Fazenda: ${payload.cliente || ''}
Cidade/UF: ${payload.cidadeUf || ''}
Tipo de demanda: ${payload.tipoDemanda || ''}
Técnico preferencial: ${payload.tecnicoPreferencial || ''}
Data ideal: ${payload.dataIdeal || ''}
Prioridade estimada: ${payload.prioridadeCalculada || ''}

A equipe técnica irá avaliar a demanda, cruzar com a agenda do técnico demandado e retornar por e-mail com aprovação, ajuste de data, solicitação de informações ou negativa justificada.

Atenciosamente,
${CONFIG.REMETENTE_NOME}`;

  MailApp.sendEmail({ to: email, subject, body, name: CONFIG.REMETENTE_NOME });
}

function enviarEmailTriagem_(payload, id) {
  const subject = `[${id}] Nova demanda técnica para triagem`;
  const body = `Nova demanda técnica recebida.

ID: ${id}
Solicitante: ${payload.nomeSolicitante || ''} <${payload.emailSolicitante || ''}>
Regional/Distrital: ${payload.regional || ''}
Cliente/Fazenda: ${payload.cliente || ''}
Cidade/UF: ${payload.cidadeUf || ''}
Tipo de demanda: ${payload.tipoDemanda || ''}
Técnico preferencial: ${payload.tecnicoPreferencial || ''}
Data ideal: ${payload.dataIdeal || ''}
Urgência: ${payload.urgencia || ''}
Impacto: ${payload.impacto || ''}
Risco: ${payload.risco || ''}
Prioridade estimada: ${payload.prioridadeCalculada || ''}

Objetivo:
${payload.objetivo || ''}

Contexto adicional:
${payload.contexto || ''}

Próxima etapa: avaliar escopo, prioridade e disponibilidade de agenda.`;

  MailApp.sendEmail({ to: CONFIG.TRIAGEM_EMAIL, subject, body, name: CONFIG.REMETENTE_NOME });
}

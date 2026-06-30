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
  TRIAGEM_EMAIL: 'paula.tiveron@altagenetics.com, rafael.azevedo@altagenetics.com',
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
  'Observações internas'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const payload = parsePayload_(e);
    const id = gerarId_();
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
      payload.tipoDemanda || '',
      payload.podeRemoto || '',
      payload.objetivo || '',
      payload.contexto || '',
      payload.tecnicoPreferencial || '',
      payload.tecnicoObrigatorio || '',
      payload.justificativaTecnico || '',
      payload.opcao1Inicio || '',
      payload.opcao1Fim || '',
      payload.opcao2Inicio || '',
      payload.opcao2Fim || '',
      payload.opcao3Inicio || '',
      payload.opcao3Fim || '',
      payload.urgencia || '',
      payload.impacto || '',
      payload.risco || '',
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
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#003b79').setFontColor('#ffffff');
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
  const ano = Utilities.formatDate(new Date(), tz, 'yy');
  const props = PropertiesService.getScriptProperties();
  const chave = `CTL_SEQ_${ano}`;
  const atual = Number(props.getProperty(chave) || '0');
  const proximo = atual + 1;

  props.setProperty(chave, String(proximo));

  return `CTL-${ano}-${String(proximo).padStart(3, '0')}`;
}

function periodo_(inicio, fim) {
  if (!inicio && !fim) return '';

  const inicioFormatado = formatarData_(inicio);
  const fimFormatado = formatarData_(fim);

  if (inicioFormatado && fimFormatado) return `${inicioFormatado} até ${fimFormatado}`;
  if (inicioFormatado) return `Início: ${inicioFormatado}`;
  if (fimFormatado) return `Fim: ${fimFormatado}`;

  return '';
}

function formatarData_(valor) {
  if (!valor) return '';

  const texto = String(valor).trim();
  const matchData = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchData) {
    return `${matchData[3]}/${matchData[2]}/${matchData[1]}`;
  }

  try {
    const data = new Date(texto);
    if (isNaN(data.getTime())) return texto;
    const tz = Session.getScriptTimeZone();
    return Utilities.formatDate(data, tz, 'dd/MM/yyyy');
  } catch (err) {
    return texto;
  }
}

function enviarEmailConfirmacao_(payload, id) {
  const email = payload.emailSolicitante;
  if (!email) return;

  const subject = `[${id}] Solicitação de agenda técnica recebida`;
  const body = `Olá, ${payload.nomeSolicitante || ''}.

Recebemos sua solicitação de agenda técnica.

Protocolo da demanda: ${id}
Status inicial: Recebida
Tipo de demanda: ${payload.tipoDemanda || ''}
Técnico demandado: ${payload.tecnicoPreferencial || ''}
Opção 1: ${periodo_(payload.opcao1Inicio, payload.opcao1Fim)}
Opção 2: ${periodo_(payload.opcao2Inicio, payload.opcao2Fim)}
Opção 3: ${periodo_(payload.opcao3Inicio, payload.opcao3Fim)}
Urgência: ${payload.urgencia || ''}
Prioridade estimada: ${payload.prioridadeCalculada || ''}

A equipe técnica irá avaliar a demanda, cruzar com a agenda do técnico demandado e retornar por e-mail com aprovação, ajuste de data, solicitação de informações ou negativa justificada.

Atenciosamente,
${CONFIG.REMETENTE_NOME}`;

  MailApp.sendEmail({ to: email, subject, body, name: CONFIG.REMETENTE_NOME });
}

function enviarEmailTriagem_(payload, id) {
  const subject = `[${id}] Nova demanda técnica para triagem`;
  const body = `Nova demanda técnica recebida.

Protocolo: ${id}
Solicitante: ${payload.nomeSolicitante || ''} <${payload.emailSolicitante || ''}>
Regional/Distrital: ${payload.regional || ''}
Tipo de demanda: ${payload.tipoDemanda || ''}
Técnico demandado: ${payload.tecnicoPreferencial || ''}
Opção 1: ${periodo_(payload.opcao1Inicio, payload.opcao1Fim)}
Opção 2: ${periodo_(payload.opcao2Inicio, payload.opcao2Fim)}
Opção 3: ${periodo_(payload.opcao3Inicio, payload.opcao3Fim)}
Urgência: ${payload.urgencia || ''}
Impacto: ${payload.impacto || ''}
Risco: ${payload.risco || ''}
Prioridade estimada: ${payload.prioridadeCalculada || ''}

Objetivo:
${payload.objetivo || ''}

Informações adicionais:
${payload.contexto || ''}

Próxima etapa: avaliar escopo, prioridade e disponibilidade de agenda.`;

  MailApp.sendEmail({ to: CONFIG.TRIAGEM_EMAIL, subject, body, name: CONFIG.REMETENTE_NOME });
}

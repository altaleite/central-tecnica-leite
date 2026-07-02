
const form = document.getElementById('demandaForm');
const demandaIdInput = document.getElementById('demandaId');
const prioridadeInput = document.getElementById('prioridadeCalculada');
const reviewDialog = document.getElementById('reviewDialog');
const successDialog = document.getElementById('successDialog');
const reviewContent = document.getElementById('reviewContent');
const successText = document.getElementById('successText');

const tipoSolicitante = document.getElementById('tipoSolicitante');
const nomeSolicitante = document.getElementById('nomeSolicitante');
const emailSolicitante = document.getElementById('emailSolicitante');
const emailSolicitanteWrap = document.getElementById('emailSolicitanteWrap');
const distritalVinculado = document.getElementById('distritalVinculado');
const distritalHelp = document.getElementById('distritalHelp');

const DATA = window.CTL_DATA || {
  distritais: [],
  tecnicos: [],
  regionais: [],
  emailsDistritais: {},
  emailsTecnicos: {},
  regionalParaDistrital: {}
};

const requiredLabels = {
  tipoSolicitante: 'Tipo de solicitante',
  nomeSolicitante: 'Solicitante',
  emailSolicitante: 'E-mail de retorno',
  distritalVinculado: 'Distrital vinculado',
  tipoDemanda: 'Tipo de demanda',
  podeRemoto: 'Atendimento remoto possível',
  objetivo: 'Objetivo da solicitação',
  tecnicoPreferencial: 'Técnico demandado',
  tecnicoObrigatorio: 'Esse técnico é obrigatório?',
  opcao1Inicio: 'Opção 1 — início',
  opcao1Fim: 'Opção 1 — fim',
  urgencia: 'Urgência',
  impacto: 'Impacto principal',
  risco: 'Risco se não houver atendimento',
  ciencia: 'Ciência'
};

function mensagemProtocolo() {
  const ano = String(new Date().getFullYear()).slice(-2);
  return `Será gerado após o envio, no padrão CTL-${ano}-001, CTL-${ano}-002...`;
}

function limparSelect(select, placeholder = 'Selecione') {
  select.innerHTML = '';
  const option = document.createElement('option');
  option.value = '';
  option.textContent = placeholder;
  select.appendChild(option);
}

function preencherSelect(select, items, placeholder = 'Selecione') {
  limparSelect(select, placeholder);
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
  select.disabled = false;
}

function obterEmailAutomatico(tipo, nome) {
  if (tipo === 'Distrital') return DATA.emailsDistritais?.[nome] || '';
  if (tipo === 'Técnico') return DATA.emailsTecnicos?.[nome] || '';
  return '';
}

function atualizarCampoEmail() {
  const tipo = tipoSolicitante.value;
  const nome = nomeSolicitante.value;

  if (tipo === 'Regional') {
    emailSolicitanteWrap.classList.remove('is-hidden');
    emailSolicitante.required = true;
    emailSolicitante.readOnly = false;
    emailSolicitante.placeholder = 'nome@altagenetics.com';
    return;
  }

  emailSolicitanteWrap.classList.add('is-hidden');
  emailSolicitante.required = false;
  emailSolicitante.readOnly = true;
  emailSolicitante.value = obterEmailAutomatico(tipo, nome);
}

function atualizarDistritalVinculado() {
  const tipo = tipoSolicitante.value;
  const nome = nomeSolicitante.value;

  distritalVinculado.classList.remove('readonly-select');
  distritalVinculado.style.pointerEvents = 'auto';
  distritalVinculado.tabIndex = 0;

  if (tipo === 'Distrital') {
    distritalVinculado.value = nome || '';
    distritalVinculado.classList.add('readonly-select');
    distritalVinculado.style.pointerEvents = 'none';
    distritalVinculado.tabIndex = -1;
    distritalHelp.textContent = 'Preenchido automaticamente com o próprio distrital solicitante.';
    return;
  }

  if (tipo === 'Regional') {
    const distrital = DATA.regionalParaDistrital?.[nome] || '';
    distritalVinculado.value = distrital;
    distritalVinculado.classList.add('readonly-select');
    distritalVinculado.style.pointerEvents = 'none';
    distritalVinculado.tabIndex = -1;
    distritalHelp.textContent = distrital
      ? `Preenchido automaticamente pelo cadastro: ${distrital}.`
      : 'Não foi possível localizar o distrital no cadastro.';
    return;
  }

  if (tipo === 'Técnico') {
    distritalHelp.textContent = 'Selecione o distrital vinculado à demanda.';
    return;
  }

  distritalVinculado.value = '';
  distritalHelp.textContent = 'Será preenchido automaticamente para Distrital ou Regional.';
}

function atualizarListaSolicitante() {
  const tipo = tipoSolicitante.value;

  if (tipo === 'Distrital') {
    preencherSelect(nomeSolicitante, DATA.distritais, 'Selecione o distrital');
  } else if (tipo === 'Regional') {
    preencherSelect(nomeSolicitante, DATA.regionais, 'Selecione o regional');
  } else if (tipo === 'Técnico') {
    preencherSelect(nomeSolicitante, DATA.tecnicos, 'Selecione o técnico');
  } else {
    limparSelect(nomeSolicitante, 'Selecione o tipo primeiro');
    nomeSolicitante.disabled = true;
  }

  emailSolicitante.value = '';
  distritalVinculado.value = '';
  atualizarCampoEmail();
  atualizarDistritalVinculado();
}

function aplicarLogicaSolicitante() {
  atualizarCampoEmail();
  atualizarDistritalVinculado();
  atualizarResumo();
}

function formToObject() {
  aplicarLogicaSolicitante();

  const data = new FormData(form);
  const obj = {};
  for (const [key, value] of data.entries()) {
    obj[key] = value && value.trim ? value.trim() : value;
  }

  obj.dataEnvio = new Date().toISOString();
  obj.statusInicial = 'Recebida';
  obj.prioridadeCalculada = calcularPrioridade().label;

  // Compatibilidade com versões anteriores do Apps Script.
  obj.funcao = obj.tipoSolicitante;
  obj.regional = obj.distritalVinculado;
  obj.tecnicoDemandado = obj.tecnicoPreferencial;
  obj.informacoesAdicionais = obj.contexto || '';

  if (obj.tipoSolicitante !== 'Regional') {
    obj.emailSolicitante = obterEmailAutomatico(obj.tipoSolicitante, obj.nomeSolicitante);
  }

  return obj;
}

function calcularPrioridade() {
  const urgencia = form.urgencia?.value;
  const impacto = form.impacto?.value;
  const risco = form.risco?.value;
  let score = 0;

  if (urgencia === '1mes') score += 4;
  if (urgencia === '2a3') score += 2;
  if (urgencia === 'acima3') score += 1;

  if (['estrategico', 'recuperacao', 'venda'].includes(impacto)) score += 3;
  if (['comercial', 'tecnico'].includes(impacto)) score += 2;
  if (impacto === 'outro') score += 1;

  if (risco === 'alto') score += 3;
  if (risco === 'medio') score += 2;
  if (risco === 'baixo') score += 1;

  if (score >= 8) return { label: 'Alta', className: 'alta' };
  if (score >= 5) return { label: 'Média', className: 'media' };
  if (score > 0) return { label: 'Baixa', className: 'baixa' };
  return { label: 'Aguardando dados', className: '' };
}

function atualizarResumo() {
  const prioridade = calcularPrioridade();
  prioridadeInput.value = prioridade.label;
}

function validarForm() {
  aplicarLogicaSolicitante();

  const errors = [];
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  Object.keys(requiredLabels).forEach((name) => {
    const field = form.elements[name];
    if (!field) return;

    if (name === 'emailSolicitante' && tipoSolicitante.value !== 'Regional') return;

    const type = field.type;
    const empty = type === 'checkbox' ? !field.checked : !String(field.value || '').trim();
    if (empty) {
      errors.push(requiredLabels[name]);
      field.classList.add('error');
    }
  });

  const email = form.emailSolicitante.value.trim();
  if (tipoSolicitante.value === 'Regional' && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('E-mail de retorno válido');
    form.emailSolicitante.classList.add('error');
  }

  if (tipoSolicitante.value !== 'Regional') {
    const emailAuto = obterEmailAutomatico(tipoSolicitante.value, nomeSolicitante.value);
    if (!emailAuto) {
      errors.push(`E-mail automático não encontrado para ${nomeSolicitante.value || 'o solicitante'}`);
      nomeSolicitante.classList.add('error');
    }
  }

  if (tipoSolicitante.value === 'Regional' && nomeSolicitante.value && !DATA.regionalParaDistrital?.[nomeSolicitante.value]) {
    errors.push('Distrital vinculado ao Regional');
    nomeSolicitante.classList.add('error');
  }

  const inicio1 = form.opcao1Inicio.value;
  const fim1 = form.opcao1Fim.value;
  if (inicio1 && fim1 && fim1 < inicio1) {
    errors.push('Opção 1 com fim igual ou posterior ao início');
    form.opcao1Fim.classList.add('error');
  }

  [['opcao2Inicio', 'opcao2Fim', 'Opção 2'], ['opcao3Inicio', 'opcao3Fim', 'Opção 3']].forEach(([inicio, fim, label]) => {
    const ini = form.elements[inicio].value;
    const end = form.elements[fim].value;
    if ((ini && !end) || (!ini && end)) {
      errors.push(`${label} com início e fim preenchidos`);
      form.elements[inicio].classList.add('error');
      form.elements[fim].classList.add('error');
    }
    if (ini && end && end < ini) {
      errors.push(`${label} com fim igual ou posterior ao início`);
      form.elements[fim].classList.add('error');
    }
  });

  if (errors.length) {
    alert(`Revise os campos obrigatórios:\n\n- ${errors.join('\n- ')}`);
    const firstError = form.querySelector('.error');
    firstError?.focus();
    return false;
  }
  return true;
}

function formatDateTime(value) {
  if (!value) return '';

  const texto = String(value).trim();
  const matchData = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchData) {
    return `${matchData[3]}/${matchData[2]}/${matchData[1]}`;
  }

  const date = new Date(texto);
  if (Number.isNaN(date.getTime())) return texto;
  return date.toLocaleDateString('pt-BR');
}

function montarRevisao(obj) {
  const rows = [
    ['Protocolo', mensagemProtocolo()],
    ['Tipo de solicitante', obj.tipoSolicitante],
    ['Solicitante', obj.nomeSolicitante],
    ['E-mail de retorno', obj.emailSolicitante],
    ['Distrital vinculado', obj.distritalVinculado],
    ['Tipo de demanda', obj.tipoDemanda],
    ['Técnico demandado', obj.tecnicoPreferencial],
    ['Atendimento remoto', obj.podeRemoto],
    ['Opção 1', `${formatDateTime(obj.opcao1Inicio)} até ${formatDateTime(obj.opcao1Fim)}`],
    ['Opção 2', obj.opcao2Inicio || obj.opcao2Fim ? `${formatDateTime(obj.opcao2Inicio)} até ${formatDateTime(obj.opcao2Fim)}` : 'Não informado'],
    ['Opção 3', obj.opcao3Inicio || obj.opcao3Fim ? `${formatDateTime(obj.opcao3Inicio)} até ${formatDateTime(obj.opcao3Fim)}` : 'Não informado'],
    ['Urgência', form.urgencia.options[form.urgencia.selectedIndex]?.text || ''],
    ['Impacto', form.impacto.options[form.impacto.selectedIndex]?.text || ''],
    ['Prioridade estimada', obj.prioridadeCalculada],
    ['Objetivo', obj.objetivo]
  ];

  reviewContent.innerHTML = rows.map(([label, value]) => `
    <div class="review-row">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(value || 'Não informado')}</span>
    </div>
  `).join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function salvarLocalmente(obj) {
  const key = 'ctl_demandas_demo';
  const atuais = JSON.parse(localStorage.getItem(key) || '[]');
  atuais.push(obj);
  localStorage.setItem(key, JSON.stringify(atuais));
}

async function enviarParaEndpoint(obj) {
  const endpoint = window.CTL_CONFIG?.GAS_ENDPOINT;
  if (!endpoint) {
    salvarLocalmente(obj);
    return { modo: 'demo' };
  }

  await fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  });
  return { modo: 'apps-script' };
}

tipoSolicitante.addEventListener('change', atualizarListaSolicitante);
nomeSolicitante.addEventListener('change', aplicarLogicaSolicitante);
distritalVinculado.addEventListener('change', atualizarResumo);
form.addEventListener('input', atualizarResumo);
form.addEventListener('change', atualizarResumo);

document.getElementById('revisarBtn').addEventListener('click', () => {
  const obj = formToObject();
  montarRevisao(obj);
  reviewDialog.showModal();
});

document.getElementById('limparBtn').addEventListener('click', () => {
  const ok = confirm('Deseja limpar todos os campos da solicitação?');
  if (!ok) return;
  form.reset();
  demandaIdInput.value = '';
  atualizarListaSolicitante();
  atualizarResumo();
});

document.getElementById('fecharModal').addEventListener('click', () => reviewDialog.close());
document.getElementById('fecharModal2').addEventListener('click', () => reviewDialog.close());
document.getElementById('fecharSucesso').addEventListener('click', () => successDialog.close());
document.getElementById('novaSolicitacaoBtn')?.addEventListener('click', () => {
  successDialog.close();
  form.reset();
  demandaIdInput.value = '';
  atualizarListaSolicitante();
  atualizarResumo();
  document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validarForm()) return;

  const obj = formToObject();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  try {
    const result = await enviarParaEndpoint(obj);
    successText.innerHTML = result.modo === 'demo'
      ? `Solicitação salva em <strong>modo demonstração local</strong>.<br>Configure o Apps Script para gerar o protocolo oficial.`
      : `Para abrir outro pedido, basta iniciar uma nova solicitação.`;
    successDialog.showModal();
    form.reset();
    demandaIdInput.value = '';
    atualizarListaSolicitante();
    atualizarResumo();
  } catch (error) {
    console.error(error);
    alert('Não foi possível enviar a solicitação. Verifique o endpoint configurado ou tente novamente.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar solicitação';
  }
});

function limparResiduosDoNavegador() {
  const campoContexto = form?.elements?.contexto;
  if (campoContexto && campoContexto.value.trim() === '1404') {
    campoContexto.value = '';
  }
}

window.addEventListener('pageshow', limparResiduosDoNavegador);
window.addEventListener('load', limparResiduosDoNavegador);

atualizarListaSolicitante();
atualizarResumo();

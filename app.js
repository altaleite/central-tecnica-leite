const form = document.getElementById('demandaForm');
const demandaIdInput = document.getElementById('demandaId');
const prioridadeInput = document.getElementById('prioridadeCalculada');
const reviewDialog = document.getElementById('reviewDialog');
const successDialog = document.getElementById('successDialog');
const reviewContent = document.getElementById('reviewContent');
const successText = document.getElementById('successText');

const requiredLabels = {
  nomeSolicitante: 'Nome do solicitante',
  emailSolicitante: 'E-mail de retorno',
  funcao: 'Função',
  regional: 'Regional/Distrital',
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

function formToObject() {
  const data = new FormData(form);
  const obj = {};
  for (const [key, value] of data.entries()) {
    obj[key] = value && value.trim ? value.trim() : value;
  }
  obj.dataEnvio = new Date().toISOString();
  obj.statusInicial = 'Recebida';
  obj.prioridadeCalculada = calcularPrioridade().label;
  prioridadeInput.value = obj.prioridadeCalculada;
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

function atualizarPrioridadeOculta() {
  if (prioridadeInput) prioridadeInput.value = calcularPrioridade().label;
}

function validarForm() {
  const errors = [];
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  Object.keys(requiredLabels).forEach((name) => {
    const field = form.elements[name];
    if (!field) return;
    const type = field.type;
    const empty = type === 'checkbox' ? !field.checked : !String(field.value || '').trim();
    if (empty) {
      errors.push(requiredLabels[name]);
      field.classList.add('error');
    }
  });

  const email = form.emailSolicitante.value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('E-mail válido');
    form.emailSolicitante.classList.add('error');
  }

  const inicio1 = form.opcao1Inicio.value;
  const fim1 = form.opcao1Fim.value;
  if (inicio1 && fim1 && fim1 < inicio1) {
    errors.push('Opção 1 com fim igual ou posterior ao início');
    form.opcao1Fim.classList.add('error');
  }

  [
    ['opcao2Inicio', 'opcao2Fim', 'Opção 2'],
    ['opcao3Inicio', 'opcao3Fim', 'Opção 3']
  ].forEach(([inicio, fim, label]) => {
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

function formatDate(value) {
  if (!value) return '';
  const texto = String(value).trim();
  const matchData = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchData) return `${matchData[3]}/${matchData[2]}/${matchData[1]}`;

  const date = new Date(texto);
  if (Number.isNaN(date.getTime())) return texto;
  return date.toLocaleDateString('pt-BR');
}

function optionText(selectElement) {
  return selectElement?.options?.[selectElement.selectedIndex]?.text || '';
}

function montarRevisao(obj) {
  const rows = [
    ['Protocolo', mensagemProtocolo()],
    ['Solicitante', `${obj.nomeSolicitante} · ${obj.emailSolicitante}`],
    ['Regional/Distrital', obj.regional],
    ['Tipo de demanda', obj.tipoDemanda],
    ['Atendimento remoto possível?', obj.podeRemoto],
    ['Técnico demandado', obj.tecnicoPreferencial],
    ['Técnico obrigatório?', obj.tecnicoObrigatorio],
    ['Opção 1', `${formatDate(obj.opcao1Inicio)} até ${formatDate(obj.opcao1Fim)}`],
    ['Opção 2', obj.opcao2Inicio || obj.opcao2Fim ? `${formatDate(obj.opcao2Inicio)} até ${formatDate(obj.opcao2Fim)}` : 'Não informado'],
    ['Opção 3', obj.opcao3Inicio || obj.opcao3Fim ? `${formatDate(obj.opcao3Inicio)} até ${formatDate(obj.opcao3Fim)}` : 'Não informado'],
    ['Urgência', optionText(form.urgencia)],
    ['Impacto', optionText(form.impacto)],
    ['Risco', optionText(form.risco)],
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

function limparFormulario() {
  form.reset();
  if (demandaIdInput) demandaIdInput.value = '';
  atualizarPrioridadeOculta();
  limparResiduosDoNavegador();
}

function limparResiduosDoNavegador() {
  const campoContexto = form?.elements?.contexto;
  if (campoContexto && campoContexto.value.trim() === '1404') {
    campoContexto.value = '';
  }
}

form.addEventListener('input', atualizarPrioridadeOculta);
form.addEventListener('change', atualizarPrioridadeOculta);

const revisarBtn = document.getElementById('revisarBtn');
revisarBtn?.addEventListener('click', () => {
  const obj = formToObject();
  montarRevisao(obj);
  reviewDialog.showModal();
});

const limparBtn = document.getElementById('limparBtn');
limparBtn?.addEventListener('click', () => {
  const ok = confirm('Deseja limpar todos os campos da solicitação?');
  if (!ok) return;
  limparFormulario();
});

document.getElementById('fecharModal')?.addEventListener('click', () => reviewDialog.close());
document.getElementById('fecharModal2')?.addEventListener('click', () => reviewDialog.close());
document.getElementById('fecharSucesso')?.addEventListener('click', () => successDialog.close());
document.getElementById('novaSolicitacaoBtn')?.addEventListener('click', () => {
  successDialog.close();
  limparFormulario();
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
    successText.textContent = 'Para abrir outro pedido, basta iniciar uma nova solicitação.';
    successDialog.showModal();
    limparFormulario();
  } catch (error) {
    console.error(error);
    alert('Não foi possível enviar a solicitação. Verifique o endpoint configurado ou tente novamente.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar solicitação';
  }
});

window.addEventListener('pageshow', limparResiduosDoNavegador);
window.addEventListener('load', () => {
  limparResiduosDoNavegador();
  atualizarPrioridadeOculta();
});

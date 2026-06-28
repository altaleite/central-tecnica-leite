const form = document.getElementById('demandaForm');
const demandaIdInput = document.getElementById('demandaId');
const prioridadeInput = document.getElementById('prioridadeCalculada');
const priorityPill = document.getElementById('priorityPill');
const resumoTitulo = document.getElementById('resumoTitulo');
const reviewDialog = document.getElementById('reviewDialog');
const successDialog = document.getElementById('successDialog');
const reviewContent = document.getElementById('reviewContent');
const successText = document.getElementById('successText');

const requiredLabels = {
  nomeSolicitante: 'Nome do solicitante',
  emailSolicitante: 'E-mail de retorno',
  funcao: 'Função',
  regional: 'Regional/Distrital',
  cliente: 'Nome do cliente/fazenda',
  cidadeUf: 'Cidade/UF',
  tipoDemanda: 'Tipo de demanda',
  objetivo: 'Objetivo da visita ou atendimento',
  tecnicoPreferencial: 'Técnico demandado ou preferencial',
  dataIdeal: 'Data ideal',
  urgencia: 'Urgência',
  impacto: 'Impacto principal',
  ciencia: 'Ciência'
};

function gerarId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `CTL-${date}-${time}`;
}

function formToObject() {
  const data = new FormData(form);
  const obj = {};
  for (const [key, value] of data.entries()) obj[key] = value.trim ? value.trim() : value;
  obj.demandaId = demandaIdInput.value || gerarId();
  obj.dataEnvio = new Date().toISOString();
  obj.statusInicial = 'Recebida';
  obj.prioridadeCalculada = calcularPrioridade().label;
  return obj;
}

function calcularPrioridade() {
  const urgencia = form.urgencia?.value;
  const impacto = form.impacto?.value;
  const risco = form.risco?.value;
  let score = 0;

  if (urgencia === 'ate7') score += 4;
  if (urgencia === '8a15') score += 3;
  if (urgencia === '16a30') score += 2;
  if (urgencia === 'semUrgencia') score += 1;

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
  priorityPill.textContent = prioridade.label;
  priorityPill.className = `priority-pill ${prioridade.className}`.trim();
  prioridadeInput.value = prioridade.label;

  const cliente = form.cliente?.value?.trim();
  const tecnico = form.tecnicoPreferencial?.value?.trim();
  resumoTitulo.textContent = cliente
    ? `${cliente}${tecnico ? ` · ${tecnico}` : ''}`
    : 'Demanda ainda não enviada';
}

function validarForm() {
  const errors = [];
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  Object.keys(requiredLabels).forEach((name) => {
    const field = form.elements[name];
    if (!field) return;
    const type = field.type;
    const empty = type === 'checkbox' ? !field.checked : !field.value.trim();
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

  if (errors.length) {
    alert(`Revise os campos obrigatórios:\n\n- ${errors.join('\n- ')}`);
    const firstError = form.querySelector('.error');
    firstError?.focus();
    return false;
  }
  return true;
}

function montarRevisao(obj) {
  const rows = [
    ['ID da demanda', obj.demandaId],
    ['Solicitante', `${obj.nomeSolicitante} · ${obj.emailSolicitante}`],
    ['Regional/Distrital', obj.regional],
    ['Cliente/Fazenda', `${obj.cliente} · ${obj.cidadeUf}`],
    ['Tipo de demanda', obj.tipoDemanda],
    ['Técnico preferencial', obj.tecnicoPreferencial],
    ['Data ideal', obj.dataIdeal],
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

form.addEventListener('input', atualizarResumo);
form.addEventListener('change', atualizarResumo);

document.getElementById('revisarBtn').addEventListener('click', () => {
  if (!demandaIdInput.value) demandaIdInput.value = gerarId();
  const obj = formToObject();
  montarRevisao(obj);
  reviewDialog.showModal();
});

document.getElementById('limparBtn').addEventListener('click', () => {
  const ok = confirm('Deseja limpar todos os campos da solicitação?');
  if (!ok) return;
  form.reset();
  demandaIdInput.value = '';
  atualizarResumo();
});

document.getElementById('fecharModal').addEventListener('click', () => reviewDialog.close());
document.getElementById('fecharModal2').addEventListener('click', () => reviewDialog.close());
document.getElementById('fecharSucesso').addEventListener('click', () => successDialog.close());

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validarForm()) return;

  if (!demandaIdInput.value) demandaIdInput.value = gerarId();
  const obj = formToObject();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  try {
    const result = await enviarParaEndpoint(obj);
    successText.innerHTML = `ID da solicitação: <strong>${escapeHtml(obj.demandaId)}</strong><br>Status inicial: <strong>Recebida</strong><br>Modo: <strong>${result.modo === 'demo' ? 'demonstração local' : 'integrado ao Apps Script'}</strong>`;
    successDialog.showModal();
    form.reset();
    demandaIdInput.value = '';
    atualizarResumo();
  } catch (error) {
    console.error(error);
    alert('Não foi possível enviar a solicitação. Verifique o endpoint configurado ou tente novamente.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar solicitação';
  }
});

atualizarResumo();

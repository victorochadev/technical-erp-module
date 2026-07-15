const state = {
  mes: null,
  tipo: 'Remoto',
  filters: { busca: '', tecnico: '', status: '' },
  atendimentosPorId: {},
}

const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

// Dados fixos do timbrado — em produção viriam do cadastro da empresa/filial no ERP.
const EMPRESA = {
  nome: 'BANNERJET IMP EXP E COM DE MAQ EQUIP PARA COM VISUAL LTDA',
  endereco: 'Avenida José Munia, 5535, Jardim Redentor - Andar 2 Conj. 205 Sala 5',
  cidadeEstado: '15090-185 São José do Rio Preto - SP',
  cnpj: '06276736000173',
  ie: '647444053113',
  fones: '(17) 99741-9548, (17) 3235-1836',
  site: 'https://bannerjet.com.br',
  email: 'bm1@bm1.com.br',
}

function mesLabel(mes) {
  const [ano, mm] = mes.split('-')
  return `${MESES_PT[parseInt(mm, 10) - 1]} de ${ano}`
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function statusChip(status) {
  const map = {
    'Em Atendimento': ['chip--emandamento', 'Em Atendimento'],
    'Concluido': ['chip--concluido', 'Concluído'],
    'Cancelado': ['chip--cancelado', 'Cancelado'],
  }
  const [cls, label] = map[status] || ['', status]
  return `<span class="chip ${cls}">${label}</span>`
}

async function loadMeses() {
  const meses = await fetchJson('/api/meses')
  const select = document.getElementById('filter-mes')
  select.innerHTML = ''
  meses.forEach(m => {
    const opt = document.createElement('option')
    opt.value = m
    opt.textContent = mesLabel(m)
    select.appendChild(opt)
  })
  state.mes = meses[0]
  select.value = state.mes
  select.addEventListener('change', e => {
    state.mes = e.target.value
    renderTabela()
  })
}

async function loadTecnicos() {
  const tecnicos = await fetchJson('/api/tecnicos')
  const select = document.getElementById('filter-tecnico')
  tecnicos.forEach(t => {
    const opt = document.createElement('option')
    opt.value = t
    opt.textContent = t
    select.appendChild(opt)
  })
}

function acoesMenu(id) {
  return `
    <div class="row-actions" data-id="${id}">
      <button class="row-actions__toggle" aria-label="Ações">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      <div class="row-actions__menu">
        <button class="row-actions__item" data-action="imprimir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/></svg>
          Imprimir
        </button>
        <a class="row-actions__item" data-action="editar" href="novo-atendimento.html?id=${id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
          Editar
        </a>
      </div>
    </div>
  `
}

async function renderTabela() {
  const params = new URLSearchParams({ mes: state.mes, tipo: state.tipo, ...state.filters })
  const atendimentos = await fetchJson(`/api/atendimentos?${params.toString()}`)
  const tbody = document.getElementById('atendimentos-tbody')
  document.getElementById('atendimentos-count-badge').textContent = `${atendimentos.length} atendimento${atendimentos.length !== 1 ? 's' : ''}`

  state.atendimentosPorId = {}
  atendimentos.forEach(a => { state.atendimentosPorId[a.id] = a })

  if (atendimentos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Nenhum atendimento encontrado</td></tr>'
    return
  }

  tbody.innerHTML = atendimentos.slice(0, 200).map(a => `
    <tr>
      <td>${a.numero}</td>
      <td>${a.dtEmissao.split('-').reverse().join('/')}</td>
      <td>${a.cliente}</td>
      <td class="text-muted">${a.defeito}</td>
      <td>${a.tecnico}</td>
      <td>${statusChip(a.status)}</td>
      <td>${acoesMenu(a.id)}</td>
    </tr>
  `).join('')
}

function fecharTodosOsMenus() {
  document.querySelectorAll('.row-actions__menu--open').forEach(el => el.classList.remove('row-actions__menu--open'))
}

async function imprimirAtendimento(id) {
  const a = state.atendimentosPorId[id]
  if (!a) return
  const cliente = await fetchJson(`/api/clientes/${a.clienteId}`)
  const payload = {
    empresa: EMPRESA,
    numero: a.numero,
    dataHoraCriacao: new Date(a.ida || a.dtEmissao).toISOString(),
    cliente,
    tipo: a.tipo,
    ida: a.ida,
    volta: a.volta,
    tecnico: a.tecnico,
    equipamento: a.equipamento,
    marca: (a.modelo || '').split(' ')[0] || '',
    modelo: (a.modelo || '').split(' ').slice(1).join(' ') || '0',
    defeito: a.defeito,
    laudoTecnico: a.laudoTecnico,
  }
  sessionStorage.setItem('atendimento-impressao', JSON.stringify(payload))
  window.open('imprimir.html', '_blank')
}

function setupAcoes() {
  document.getElementById('atendimentos-tbody').addEventListener('click', e => {
    const toggle = e.target.closest('.row-actions__toggle')
    if (toggle) {
      const menu = toggle.parentElement.querySelector('.row-actions__menu')
      const jaAberto = menu.classList.contains('row-actions__menu--open')
      fecharTodosOsMenus()
      if (!jaAberto) menu.classList.add('row-actions__menu--open')
      return
    }

    const acaoBtn = e.target.closest('[data-action="imprimir"]')
    if (acaoBtn) {
      const id = acaoBtn.closest('.row-actions').dataset.id
      fecharTodosOsMenus()
      imprimirAtendimento(id)
    }
    // data-action="editar" é um <a> normal, navega direto — não precisa de handler.
  })

  document.addEventListener('click', e => {
    if (!e.target.closest('.row-actions')) fecharTodosOsMenus()
  })
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tabs .tab')
  const btnNovo = document.getElementById('btn-novo-atendimento')

  function selecionarTab(tipo) {
    state.tipo = tipo
    tabs.forEach(tab => tab.classList.toggle('tab--active', tab.dataset.tipo === tipo))
    btnNovo.href = `novo-atendimento.html?tipo=${encodeURIComponent(tipo)}`
    renderTabela()
  }

  tabs.forEach(tab => tab.addEventListener('click', () => selecionarTab(tab.dataset.tipo)))
}

function setupFilters() {
  document.getElementById('filter-busca').addEventListener('input', e => {
    state.filters.busca = e.target.value
    renderTabela()
  })
  document.getElementById('filter-tecnico').addEventListener('change', e => {
    state.filters.tecnico = e.target.value
    renderTabela()
  })
  document.getElementById('filter-status').addEventListener('change', e => {
    state.filters.status = e.target.value
    renderTabela()
  })
}

function setupTheme() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('at-theme', next)
  })
}

async function init() {
  setupTheme()
  setupTabs()
  setupFilters()
  setupAcoes()
  await loadMeses()
  await loadTecnicos()
  await renderTabela()
}

document.addEventListener('DOMContentLoaded', init)

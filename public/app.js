const state = {
  mes: null,
  desempenhoTipo: 'Laboratório',
}

const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DIAS_SEMANA_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function mesLabel(mes) {
  const [ano, mm] = mes.split('-')
  return `${MESES_PT[parseInt(mm, 10) - 1]} de ${ano}`
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function setDonut(el, segments) {
  let acc = 0
  const stops = segments.map(s => {
    const start = acc
    acc += s.percentual
    return `${s.color} ${start}% ${acc}%`
  })
  el.style.background = `conic-gradient(${stops.join(', ')})`
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
    renderAll()
  })
}

function qsMes() {
  return state.mes ? `?mes=${state.mes}` : ''
}

async function renderResumo() {
  const resumo = await fetchJson(`/api/dashboard/resumo${qsMes()}`)

  document.getElementById('kpi-total').textContent = resumo.total

  document.getElementById('tipo-presencial-count').textContent = resumo.porTipo.presencial.total
  document.getElementById('tipo-presencial-pct').textContent = `${resumo.porTipo.presencial.percentual}%`
  document.getElementById('tipo-remoto-count').textContent = resumo.porTipo.remoto.total
  document.getElementById('tipo-remoto-pct').textContent = `${resumo.porTipo.remoto.percentual}%`
  document.getElementById('tipo-laboratorio-count').textContent = resumo.porTipo.laboratorio.total
  document.getElementById('tipo-laboratorio-pct').textContent = `${resumo.porTipo.laboratorio.percentual}%`

  setDonut(document.getElementById('donut-tipo'), [
    { percentual: resumo.porTipo.presencial.percentual, color: 'var(--presencial)' },
    { percentual: resumo.porTipo.remoto.percentual, color: 'var(--remoto)' },
    { percentual: resumo.porTipo.laboratorio.percentual, color: 'var(--laboratorio)' },
  ])

  document.getElementById('status-concluido-count').textContent = resumo.porStatus.concluido.total
  document.getElementById('status-concluido-hint').textContent = `${resumo.porStatus.concluido.percentual}% do total no mês`
  document.getElementById('status-em-count').textContent = resumo.porStatus.emAtendimento.total
  document.getElementById('status-em-hint').textContent = `${resumo.porStatus.emAtendimento.percentual}% do total no mês`
  document.getElementById('status-cancelado-count').textContent = resumo.porStatus.cancelado.total
  document.getElementById('status-cancelado-hint').textContent = `${resumo.porStatus.cancelado.percentual}% do total no mês`
}

function iniciaisTecnico(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

const CAMPO_POR_TIPO = { 'Laboratório': 'laboratorio', 'Remoto': 'remoto', 'Presencial': 'presencial' }

async function renderDesempenho() {
  const ranking = await fetchJson(`/api/dashboard/por-tecnico${qsMes()}`)
  const campo = CAMPO_POR_TIPO[state.desempenhoTipo]
  const lista = ranking.filter(r => r[campo] > 0).sort((a, b) => b[campo] - a[campo])

  const container = document.getElementById('tech-list')
  if (lista.length === 0) {
    container.innerHTML = '<div class="agenda-empty">Nenhum atendimento deste tipo no período</div>'
    return
  }

  container.innerHTML = lista.map(r => `
    <div class="tech-row">
      <div class="tech-row__left">
        <div class="tech-avatar">${iniciaisTecnico(r.tecnico)}</div>
        <div class="tech-info">
          <div class="tech-name">${r.tecnico}</div>
          <div class="tech-count">${r[campo]} atendimento${r[campo] !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="tech-rating">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ${r.nota.toFixed(1)}
      </div>
    </div>
  `).join('')
}

function setupDesempenhoTabs() {
  const tabs = document.querySelectorAll('#desempenho-tabs .tab')
  tabs.forEach(tab => tab.addEventListener('click', () => {
    state.desempenhoTipo = tab.dataset.tipo
    tabs.forEach(t => t.classList.toggle('tab--active', t === tab))
    renderDesempenho()
  }))
}

function chipClasseTipo(tipo) {
  if (tipo === 'Remoto') return 'chip--remoto'
  if (tipo === 'Presencial') return 'chip--presencial'
  return 'chip--laboratorio'
}

async function renderAgendaSemana() {
  if (!state.mes) {
    document.getElementById('agenda-list').innerHTML = '<div class="agenda-empty">Nenhum atendimento cadastrado</div>'
    return
  }

  const atendimentos = await fetchJson(`/api/atendimentos${qsMes()}`)

  const inicio = `${state.mes}-01`
  const fim = `${state.mes}-07`
  const porDia = new Map()
  atendimentos.forEach(a => {
    const dataRef = (a.ida || a.dtEmissao).slice(0, 10)
    if (dataRef < inicio || dataRef > fim) return
    if (!porDia.has(dataRef)) porDia.set(dataRef, [])
    porDia.get(dataRef).push(a)
  })

  const dias = [...porDia.keys()].sort()
  const container = document.getElementById('agenda-list')

  if (dias.length === 0) {
    container.innerHTML = '<div class="agenda-empty">Nenhum atendimento agendado nesta semana</div>'
    return
  }

  container.innerHTML = dias.map(dataRef => {
    const eventos = porDia.get(dataRef).slice().sort((a, b) => (a.ida || '').localeCompare(b.ida || ''))
    const [ano, mm, dd] = dataRef.split('-')
    const diaSemana = DIAS_SEMANA_PT[new Date(`${dataRef}T00:00:00`).getDay()]
    const itensHtml = eventos.map(a => `
      <div class="agenda-item">
        <span class="agenda-time">${a.ida ? a.ida.slice(11, 16) : '—'}</span>
        <span class="agenda-title"><b>${a.cliente || 'Cliente'}</b> | Téc. ${a.tecnico || '—'}</span>
        <span class="chip ${chipClasseTipo(a.tipo)}">${a.tipo}</span>
      </div>
    `).join('')
    return `
      <div class="agenda-day">
        <div class="agenda-day__title">${diaSemana}, ${dd}/${mm}</div>
        ${itensHtml}
      </div>
    `
  }).join('')
}

function setupTheme() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('at-theme', next)
  })
}

async function renderAll() {
  await Promise.all([renderResumo(), renderDesempenho(), renderAgendaSemana()])
}

async function init() {
  setupTheme()
  setupDesempenhoTabs()
  await loadMeses()
  await renderAll()
}

document.addEventListener('DOMContentLoaded', init)

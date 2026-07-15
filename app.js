const state = {
  mes: null,
  calendarTipo: 'Remoto',
}

const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

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

async function renderResumo() {
  const resumo = await fetchJson(`/api/dashboard/resumo?mes=${state.mes}`)

  document.getElementById('kpi-total').textContent = resumo.total
  document.getElementById('kpi-mes-label').textContent = mesLabel(resumo.mes)

  document.getElementById('tipo-remoto-count').textContent = resumo.porTipo.remoto.total
  document.getElementById('tipo-remoto-pct').textContent = `${resumo.porTipo.remoto.percentual}%`
  document.getElementById('tipo-presencial-count').textContent = resumo.porTipo.presencial.total
  document.getElementById('tipo-presencial-pct').textContent = `${resumo.porTipo.presencial.percentual}%`

  setDonut(document.getElementById('donut-tipo'), [
    { percentual: resumo.porTipo.remoto.percentual, color: 'var(--remoto)' },
    { percentual: resumo.porTipo.presencial.percentual, color: 'var(--presencial)' },
  ])

  document.getElementById('status-concluido-count').textContent = resumo.porStatus.concluido.total
  document.getElementById('status-concluido-pct').textContent = `${resumo.porStatus.concluido.percentual}%`
  document.getElementById('status-em-count').textContent = resumo.porStatus.emAtendimento.total
  document.getElementById('status-em-pct').textContent = `${resumo.porStatus.emAtendimento.percentual}%`
  document.getElementById('status-cancelado-count').textContent = resumo.porStatus.cancelado.total
  document.getElementById('status-cancelado-pct').textContent = `${resumo.porStatus.cancelado.percentual}%`

  setDonut(document.getElementById('donut-status'), [
    { percentual: resumo.porStatus.concluido.percentual, color: 'var(--concluido)' },
    { percentual: resumo.porStatus.emAtendimento.percentual, color: 'var(--emandamento)' },
    { percentual: resumo.porStatus.cancelado.percentual, color: 'var(--cancelado)' },
  ])
}

async function renderRanking() {
  const ranking = await fetchJson(`/api/dashboard/por-tecnico?mes=${state.mes}`)
  const tbody = document.getElementById('ranking-tbody')
  document.getElementById('ranking-count-badge').textContent = `${ranking.length} técnico${ranking.length !== 1 ? 's' : ''}`

  if (ranking.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty-cell">Nenhum atendimento no período</td></tr>'
    return
  }

  const max = Math.max(...ranking.map(r => r.total))
  tbody.innerHTML = ranking.map(r => `
    <tr>
      <td>${r.tecnico}</td>
      <td class="col-volume">
        <div class="volume-bar-track"><div class="volume-bar-fill" style="width:${Math.round((r.total / max) * 100)}%"></div></div>
      </td>
      <td><b>${r.total}</b></td>
      <td>${r.remoto}</td>
      <td>${r.presencial}</td>
      <td>${r.concluido}</td>
      <td>${r.emAtendimento}</td>
      <td>${r.cancelado}</td>
    </tr>
  `).join('')
}

function buildCalendarCells(mes, eventosPorDia) {
  const [ano, mm] = mes.split('-').map(Number)
  const primeiroDia = new Date(ano, mm - 1, 1)
  const diasNoMes = new Date(ano, mm, 0).getDate()
  const diaSemanaInicio = primeiroDia.getDay()
  const totalCelulas = Math.ceil((diaSemanaInicio + diasNoMes) / 7) * 7

  const cells = []
  for (let i = 0; i < totalCelulas; i++) {
    const diaNum = i - diaSemanaInicio + 1
    if (diaNum < 1 || diaNum > diasNoMes) {
      cells.push({ muted: true })
    } else {
      const chave = `${mes}-${String(diaNum).padStart(2, '0')}`
      cells.push({ muted: false, dia: diaNum, eventos: eventosPorDia[chave] || [] })
    }
  }
  return cells
}

function renderEventoCalendario(a) {
  const tipoClass = a.tipo === 'Remoto' ? 'calendar-event--remoto' : 'calendar-event--presencial'
  const corBorda = { 'Concluido': 'var(--concluido)', 'Em Atendimento': 'var(--emandamento)', 'Cancelado': 'var(--cancelado)' }[a.status] || 'transparent'
  return `
    <a href="novo-atendimento.html?id=${a.id}" class="calendar-event ${tipoClass}" style="border-left-color:${corBorda}" title="${a.tecnico} — ${a.cliente} (${a.status})">
      <span class="calendar-event__tecnico">${a.tecnico}</span>
      <span class="calendar-event__cliente">${a.cliente}</span>
    </a>
  `
}

async function renderCalendario() {
  const atendimentos = await fetchJson(`/api/atendimentos?mes=${state.mes}&tipo=${state.calendarTipo}`)

  const eventosPorDia = {}
  atendimentos.forEach(a => {
    const chave = (a.ida || a.dtEmissao).slice(0, 10)
    if (!eventosPorDia[chave]) eventosPorDia[chave] = []
    eventosPorDia[chave].push(a)
  })

  const cells = buildCalendarCells(state.mes, eventosPorDia)
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const headerHtml = weekdays.map(w => `<div class="calendar-weekday">${w}</div>`).join('')
  const cellsHtml = cells.map(c => {
    if (c.muted) return '<div class="calendar-day calendar-day--muted"></div>'
    return `<div class="calendar-day"><span class="calendar-day__number">${c.dia}</span>${c.eventos.map(renderEventoCalendario).join('')}</div>`
  }).join('')

  document.getElementById('calendar-grid').innerHTML = headerHtml + cellsHtml
  document.getElementById('calendario-mes-label').textContent = `${atendimentos.length} atendimento${atendimentos.length !== 1 ? 's' : ''}`
}

function setupCalendarTabs() {
  const tabRemoto = document.getElementById('cal-tab-remoto')
  const tabPresencial = document.getElementById('cal-tab-presencial')

  function selecionar(tipo) {
    state.calendarTipo = tipo
    tabRemoto.classList.toggle('tab--active', tipo === 'Remoto')
    tabPresencial.classList.toggle('tab--active', tipo === 'Presencial')
    renderCalendario()
  }

  tabRemoto.addEventListener('click', () => selecionar('Remoto'))
  tabPresencial.addEventListener('click', () => selecionar('Presencial'))
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
  await Promise.all([renderResumo(), renderRanking(), renderCalendario()])
}

async function init() {
  setupTheme()
  setupCalendarTabs()
  await loadMeses()
  await renderAll()
}

document.addEventListener('DOMContentLoaded', init)

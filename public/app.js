const state = {
  mes: null,
  desempenhoTipo: 'Laboratório',
  categoria: 'remoto',
  periodo: { preset: 'mes', inicio: null, fim: null },
}

// Barras de equipamento: um tom de azul por aba, dentro da mesma escala dos
// demais gráficos.
const COR_CATEGORIA = {
  remoto: 'var(--grafico-2)',
  presencial: 'var(--grafico-1)',
  laboratorio: 'var(--grafico-3)',
}

const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DIAS_SEMANA_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function mesLabel(mes) {
  if (!mes) return 'no período'
  const [ano, mm] = mes.split('-')
  return `${MESES_PT[parseInt(mm, 10) - 1]} de ${ano}`
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

const SVG_NS = 'http://www.w3.org/2000/svg'

// Raio escolhido para a circunferência dar exatamente 100 (2πr = 100), assim o
// stroke-dasharray recebe o percentual direto, sem conversão.
const RAIO_DONUT = 15.9155

function semAnimacao() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// O donut é SVG (e não mais conic-gradient) porque gradiente cônico não é
// animável — com arcos dá para desenhar cada fatia progressivamente.
function setDonut(el, segmentos, animar = true) {
  const rotulo = el.querySelector('.donut-total')
  el.querySelectorAll('svg').forEach(n => n.remove())

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 42 42')
  svg.setAttribute('class', 'donut-svg')
  svg.setAttribute('aria-hidden', 'true')

  const circulo = (classe) => {
    const c = document.createElementNS(SVG_NS, 'circle')
    c.setAttribute('class', classe)
    c.setAttribute('cx', '21')
    c.setAttribute('cy', '21')
    c.setAttribute('r', String(RAIO_DONUT))
    return c
  }

  svg.appendChild(circulo('donut-trilho'))

  let deslocamento = 0
  const arcos = []
  for (const s of segmentos) {
    const arco = circulo('donut-arco')
    arco.style.stroke = s.color
    arco.style.strokeDashoffset = String(-deslocamento)
    arco.style.strokeDasharray = animar ? '0 100' : `${s.percentual} ${100 - s.percentual}`
    svg.appendChild(arco)
    arcos.push([arco, s.percentual])
    deslocamento += s.percentual
  }

  el.insertBefore(svg, rotulo || null)

  if (!animar) return
  requestAnimationFrame(() => {
    arcos.forEach(([arco, pct], i) => {
      arco.style.transitionDelay = `${i * 110}ms`
      arco.style.strokeDasharray = `${pct} ${100 - pct}`
    })
  })
}

// Contagem progressiva dos números grandes. Lê o alvo do data-num para o
// texto final ser sempre exato, sem depender do último quadro da animação.
function animarNumeros(escopo) {
  escopo.querySelectorAll('[data-num]').forEach((el, i) => {
    const alvo = parseFloat(el.dataset.num)
    const sufixo = el.dataset.sufixo || ''
    const casas = Number(el.dataset.casas || 0)
    const final = alvo.toFixed(casas) + sufixo

    if (!isFinite(alvo) || semAnimacao()) { el.textContent = final; return }

    const duracao = 650
    const atraso = i * 70
    let inicio = null
    el.textContent = (0).toFixed(casas) + sufixo

    function passo(agora) {
      if (inicio === null) inicio = agora
      const t = Math.min(1, (agora - inicio - atraso) / duracao)
      if (t < 0) return requestAnimationFrame(passo)
      const suave = 1 - Math.pow(1 - t, 3)
      el.textContent = (alvo * suave).toFixed(casas) + sufixo
      if (t < 1) requestAnimationFrame(passo)
      else el.textContent = final
    }
    requestAnimationFrame(passo)
  })
}

// Barras e colunas nascem em 0 no HTML e só então recebem a medida real, senão
// o navegador pinta direto no valor final e a transição não roda.
function animarGraficos(escopo, animar) {
  escopo.querySelectorAll('[data-largura], [data-altura]').forEach((el, i) => {
    if (animar && !semAnimacao()) el.style.transitionDelay = `${i * 80}ms`
    requestAnimationFrame(() => {
      if (el.dataset.largura) el.style.width = el.dataset.largura
      if (el.dataset.altura) el.style.height = el.dataset.altura
    })
  })
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

  const kpiTotal = document.getElementById('kpi-total')
  kpiTotal.dataset.num = resumo.total

  document.getElementById('tipo-presencial-count').textContent = resumo.porTipo.presencial.total
  document.getElementById('tipo-presencial-pct').textContent = `${resumo.porTipo.presencial.percentual}%`
  document.getElementById('tipo-remoto-count').textContent = resumo.porTipo.remoto.total
  document.getElementById('tipo-remoto-pct').textContent = `${resumo.porTipo.remoto.percentual}%`
  document.getElementById('tipo-laboratorio-count').textContent = resumo.porTipo.laboratorio.total
  document.getElementById('tipo-laboratorio-pct').textContent = `${resumo.porTipo.laboratorio.percentual}%`

  const donutTipo = document.getElementById('donut-tipo')
  setDonut(donutTipo, [
    { percentual: resumo.porTipo.presencial.percentual, color: 'var(--grafico-1)' },
    { percentual: resumo.porTipo.remoto.percentual, color: 'var(--grafico-2)' },
    { percentual: resumo.porTipo.laboratorio.percentual, color: 'var(--grafico-3)' },
  ].filter(s => s.percentual > 0))
  animarNumeros(donutTipo)

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

// ─────────────── Dashboards por Categoria (planilhas do Google) ───────────────

// Os rótulos vêm de planilha preenchida por gente, não do nosso banco — escapar
// antes de jogar no innerHTML.
function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

function setLiveBadge(dados) {
  const badge = document.getElementById('categoria-live')
  const texto = document.getElementById('categoria-live-texto')

  if (!dados || dados.estado !== 'ok') {
    badge.hidden = dados?.estado !== 'erro'
    if (dados?.estado === 'erro') {
      badge.classList.add('live-badge--erro')
      texto.textContent = 'sem conexão com a planilha'
    }
    return
  }

  badge.hidden = false
  badge.classList.remove('live-badge--erro')
  const hora = dados.atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  texto.textContent = `atualizado · ${hora}`
}

function htmlMensagemCategoria(dados, categoria) {
  if (dados.estado === 'erro') {
    return `<div class="cat-msg cat-msg--erro">
      Não foi possível ler a planilha.<br><b>${esc(dados.mensagem)}</b>
    </div>`
  }

  if (categoria !== 'remoto') {
    return `<div class="cat-msg">
      <b>Aguardando fonte de dados.</b><br>
      Assim que a planilha de ${esc(dados.rotulo)} for definida, basta preencher
      <code>sheets-config.js</code> que os dashboards aparecem aqui.
    </div>`
  }

  return `<div class="cat-msg">
    <b>Planilha ainda não conectada.</b><br>
    Publique a aba em CSV (Arquivo → Compartilhar → Publicar na web) e cole a URL
    em <code>csvUrl</code> dentro de <code>sheets-config.js</code>.
  </div>`
}

// ───────────────────────────── Período ─────────────────────────────

function paraISO(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

function formatarDataBR(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

// 'mes' acompanha o seletor de mês do cabeçalho, mantendo o card em sintonia
// com o resto do painel.
function periodoDoMes() {
  const base = state.mes || paraISO(new Date()).slice(0, 7)
  const [ano, mesNum] = base.split('-').map(Number)
  return { inicio: `${base}-01`, fim: paraISO(new Date(ano, mesNum, 0)) }
}

// Traduz o preset escolhido em { inicio, fim } no formato ISO. 'tudo' devolve
// nulos de propósito: é o sinal para a camada de dados não filtrar nada.
function calcularPeriodo() {
  const { preset, inicio, fim } = state.periodo

  if (preset === 'custom') return { inicio: inicio || null, fim: fim || null }
  if (preset === 'tudo') return { inicio: null, fim: null }

  if (preset === 'hoje') {
    const dia = paraISO(new Date())
    return { inicio: dia, fim: dia }
  }

  if (preset === '7d') {
    const hoje = new Date()
    const de = new Date(hoje)
    de.setDate(de.getDate() - 6)
    return { inicio: paraISO(de), fim: paraISO(hoje) }
  }

  return periodoDoMes()
}

function rotuloPeriodo() {
  const { preset } = state.periodo
  const { inicio, fim } = calcularPeriodo()
  if (preset === 'tudo' || !inicio || !fim) return 'em todo o histórico'
  if (preset === 'mes') return `em ${mesLabel(state.mes)}`
  if (inicio === fim) return `em ${formatarDataBR(inicio)}`
  return `de ${formatarDataBR(inicio)} a ${formatarDataBR(fim)}`
}

function setupPeriodo() {
  const chips = document.querySelectorAll('#periodo-presets .periodo-chip')
  const painelDatas = document.getElementById('periodo-datas')
  const campoInicio = document.getElementById('periodo-inicio')
  const campoFim = document.getElementById('periodo-fim')

  chips.forEach(chip => chip.addEventListener('click', () => {
    // Precisa ser lido ANTES de trocar o preset: depois da troca,
    // calcularPeriodo() já responderia pelo 'custom' (vazio) e a semente
    // abaixo herdaria de si mesma.
    const anterior = calcularPeriodo()

    state.periodo.preset = chip.dataset.preset
    chips.forEach(c => c.classList.toggle('periodo-chip--active', c === chip))
    painelDatas.hidden = state.periodo.preset !== 'custom'

    // Ao abrir o personalizado pela primeira vez, parte do período que já
    // estava em tela em vez de dois campos vazios.
    if (state.periodo.preset === 'custom' && !state.periodo.inicio) {
      const semente = anterior.inicio && anterior.fim ? anterior : periodoDoMes()
      state.periodo.inicio = campoInicio.value = semente.inicio
      state.periodo.fim = campoFim.value = semente.fim
    }
    renderCategoria()
  }))

  campoInicio.addEventListener('change', () => { state.periodo.inicio = campoInicio.value; renderCategoria() })
  campoFim.addEventListener('change', () => { state.periodo.fim = campoFim.value; renderCategoria() })
}

// ─────────────────────── Render do card de categoria ───────────────────────

// Só entram aqui números que os gráficos abaixo NÃO mostram. O total do período
// não aparece em lugar nenhum (o donut conta só quem tem modalidade) e a
// cobertura do preenchimento é o que diz se dá para confiar nas fatias.
function htmlStatTiles(dados) {
  const principal = [...dados.porModalidade].sort((a, b) => b.total - a.total)[0]
  const temPrincipal = principal && principal.total > 0
  const cobertura = dados.total === 0 ? 0 : Math.round((dados.comModalidade / dados.total) * 1000) / 10

  const tiles = [
    { rotulo: 'Atendimentos', num: dados.total, hint: rotuloPeriodo() },
    {
      rotulo: 'Modalidade principal',
      num: temPrincipal ? principal.percentual : null,
      sufixo: '%', casas: 1,
      hint: temPrincipal ? principal.rotulo : 'sem modalidade preenchida',
      cor: temPrincipal ? principal.cor : null,
    },
    {
      rotulo: 'Classificados',
      num: cobertura, sufixo: '%', casas: 1,
      hint: `${dados.comModalidade} de ${dados.total} com modalidade`,
    },
  ]

  return `<div class="stat-row cat-stats">${tiles.map(t => `
    <div class="stat-card">
      <span class="stat-card__label">
        ${t.cor ? `<span class="stat-card__dot" style="background:${t.cor}"></span>` : ''}${esc(t.rotulo)}
      </span>
      <span class="stat-card__big"${t.num === null ? '' : ` data-num="${t.num}" data-sufixo="${t.sufixo || ''}" data-casas="${t.casas || 0}"`}>${t.num === null ? '—' : ''}</span>
      <span class="stat-card__hint" title="${esc(t.hint)}">${esc(t.hint)}</span>
    </div>
  `).join('')}</div>`
}

// Gráfico de colunas. A altura de cada coluna é relativa ao maior valor, e não
// ao percentual, senão uma série com todos os valores baixos ficaria rasteira.
function htmlColunas(itens, vazio, cor) {
  if (itens.length === 0) return `<div class="agenda-empty">${esc(vazio)}</div>`

  const maior = Math.max(...itens.map(i => i.total))
  // Só o percentual aparece: a contagem absoluta foi retirada a pedido, para o
  // gráfico comunicar proporção e não volume. O total continua no title, para
  // quem passar o mouse.
  return `<div class="col-chart">${itens.map(i => `
    <div class="col-item">
      <div class="col-item__trilho">
        <div class="col-item__barra" style="height:0;background:${cor || 'var(--grafico-2)'}"
             data-altura="${maior === 0 ? 0 : (i.total / maior) * 100}%"></div>
      </div>
      <span class="col-item__rotulo" title="${esc(i.rotulo)} — ${i.total} atendimento${i.total !== 1 ? 's' : ''}">${esc(i.rotulo)}</span>
      <span class="col-item__pct">${i.percentual}%</span>
    </div>
  `).join('')}</div>`
}

// Deixa explícito quanto do período ficou de fora do gráfico, para ninguém ler
// as fatias como se cobrissem todos os atendimentos.
function htmlSemPreenchimento(quantidade, texto) {
  if (!quantidade || quantidade <= 0) return ''
  return `<div class="cat-rodape">${quantidade} registro${quantidade !== 1 ? 's' : ''} ${texto}</div>`
}

// Guarda o retrato do que está desenhado: a releitura automática a cada 60s não
// deve reanimar tudo se nada mudou — só a troca de aba/período ou dado novo.
let assinaturaCategoria = null

async function renderCategoria() {
  const container = document.getElementById('categoria-conteudo')
  const categoria = state.categoria
  const periodo = calcularPeriodo()
  const dados = await window.SheetsSource.carregarCategoria(categoria, periodo)

  // A aba pode ter mudado enquanto a planilha era lida.
  if (state.categoria !== categoria) return

  const assinatura = JSON.stringify([
    categoria, periodo, dados.estado, dados.total,
    dados.porModalidade?.map(m => m.total), dados.porEquipamento?.map(e => [e.rotulo, e.total]),
  ])
  const animar = assinatura !== assinaturaCategoria
  assinaturaCategoria = assinatura

  setLiveBadge(dados)

  if (dados.estado !== 'ok') {
    container.innerHTML = htmlMensagemCategoria(dados, categoria)
    return
  }

  if (dados.total === 0) {
    const dica = dados.comData > 0
      ? `<br>A planilha tem <b>${dados.comData}</b> registro${dados.comData !== 1 ? 's' : ''} datado${dados.comData !== 1 ? 's' : ''} fora desse intervalo${dados.primeiraData ? ` (o mais antigo em ${formatarDataBR(dados.primeiraData)})` : ''}.`
      : ''
    container.innerHTML = `<div class="cat-msg">Nenhum registro ${esc(rotuloPeriodo())}.${dica}</div>`
    return
  }

  const comValor = dados.porModalidade.filter(m => m.total > 0)
  const legenda = dados.porModalidade.map(m => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${m.cor}"></span>${esc(m.rotulo)}
      <b>${m.total}</b> <span class="legend-pct">${m.percentual}%</span>
    </div>
  `).join('')

  const semData = dados.temColunaData
    ? ''
    : '<div class="cat-rodape">A planilha não tem coluna de data — exibindo todos os registros.</div>'

  const cor = COR_CATEGORIA[categoria]

  container.innerHTML = `
    ${htmlStatTiles(dados)}
    ${semData}
    <div class="cat-cols">
      <div class="cat-block">
        <div class="cat-block__title">Modalidades</div>
        <div class="donut-row">
          <div class="donut donut--sm" id="donut-categoria">
            <span class="donut-total" data-num="${dados.comModalidade}"></span>
          </div>
          <div class="donut-legend">${legenda}</div>
        </div>
        ${htmlSemPreenchimento(dados.semModalidade, 'sem modalidade preenchida')}
      </div>
      <div class="cat-block">
        <div class="cat-block__title">Equipamentos</div>
        ${htmlColunas(dados.porEquipamento, 'Nenhum equipamento registrado no período', cor)}
        ${htmlSemPreenchimento(dados.semEquipamento, 'sem equipamento preenchido')}
      </div>
    </div>
  `

  // Sem modalidade preenchida na planilha o donut ficaria vazio — melhor um
  // anel neutro do que nenhum desenho.
  const segmentos = comValor.length > 0
    ? comValor.map(m => ({ percentual: m.percentual, color: m.cor }))
    : [{ percentual: 100, color: 'var(--border-subtle)' }]

  setDonut(document.getElementById('donut-categoria'), segmentos, animar)
  animarGraficos(container, animar)
  if (animar) {
    animarNumeros(container)
    container.classList.remove('cat-entrada')
    void container.offsetWidth  // reinicia a animação de entrada
    container.classList.add('cat-entrada')
  } else {
    container.querySelectorAll('[data-num]').forEach(el => {
      el.textContent = Number(el.dataset.num).toFixed(Number(el.dataset.casas || 0)) + (el.dataset.sufixo || '')
    })
  }
}

function setupCategoriaTabs() {
  const tabs = document.querySelectorAll('#categoria-tabs .tab')
  tabs.forEach(tab => tab.addEventListener('click', () => {
    state.categoria = tab.dataset.categoria
    tabs.forEach(t => t.classList.toggle('tab--active', t === tab))
    renderCategoria()
  }))
}

function iniciarAtualizacaoAoVivo() {
  const segundos = window.SHEETS_CONFIG?.refreshSeconds || 60
  setInterval(renderCategoria, Math.max(15, segundos) * 1000)
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
  await Promise.all([renderResumo(), renderDesempenho(), renderAgendaSemana(), renderCategoria()])
}

async function init() {
  setupTheme()
  setupDesempenhoTabs()
  setupCategoriaTabs()
  setupPeriodo()
  await loadMeses()
  await renderAll()
  iniciarAtualizacaoAoVivo()
}

document.addEventListener('DOMContentLoaded', init)

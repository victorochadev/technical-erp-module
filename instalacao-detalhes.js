const state = {
  instalacao: null,
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function showToast(message) {
  const container = document.getElementById('toast-container')
  const toast = document.createElement('div')
  toast.className = 'toast-simple'
  toast.textContent = message
  container.appendChild(toast)
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-simple--show')))
  setTimeout(() => {
    toast.classList.remove('toast-simple--show')
    setTimeout(() => toast.remove(), 300)
  }, 3500)
}

function formatMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusChip(status) {
  const cls = status.label === 'Concluido' ? 'chip--azul' : 'chip--emandamento'
  const label = status.label === 'Concluido' ? 'Concluído' : 'Em andamento'
  const dataHtml = status.data ? `<span class="chip-status__data">${status.data}</span>` : ''
  return `<span class="chip ${cls} chip-status">${label}${dataHtml}</span>`
}

const ICONES_CHECKLIST = [
  '<path d="M3 10l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  '<rect x="3" y="7" width="18" height="6" rx="1"/><line x1="7" y1="16" x2="7" y2="19"/><line x1="12" y1="16" x2="12" y2="19"/><line x1="17" y1="16" x2="17" y2="19"/>',
  '<rect x="3" y="4" width="18" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/>',
  '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
]

function renderClienteCard(instalacao) {
  const c = instalacao.cliente
  return `
    <div class="card">
      <div class="detalhe-topo">
        <h2 class="detalhe-titulo">Cliente: ${c.razaoSocial}</h2>
      </div>
      <div class="detalhe-info-row">
        <div><span class="info-label">Status</span>${statusChip(instalacao.statusCliente)}</div>
        <div><span class="info-label">Transportadora</span>${instalacao.transportadora}</div>
      </div>
      <div class="cliente-grid">
        <div><b>CNPJ:</b> ${c.cnpj}</div>
        <div><b>E-mail:</b> ${c.email}</div>
        <div><b>Endereço:</b> ${c.endereco}</div>
        <div><b>Telefone:</b> ${c.telefone}</div>
      </div>
    </div>
  `
}

function renderProdutos(instalacao) {
  const linhas = instalacao.produtos.map(p => `
    <tr>
      <td>${p.produto}</td>
      <td>${p.qtd}</td>
      <td>${p.peso}</td>
      <td>${p.medida || '—'}</td>
    </tr>
  `).join('')

  return `
    <div class="collapse collapse--open" data-collapse>
      <div class="collapse__header">
        <span>Produtos pedido #${instalacao.pedidoCompra}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="collapse__body">
        <table class="mini-table">
          <thead><tr><th>Produto</th><th>Qtd</th><th>Peso</th><th>Medida</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    </div>
  `
}

function renderCustos(instalacao) {
  if (!instalacao.pedidoDespesas) {
    return `
      <div class="collapse collapse--open" data-collapse>
        <div class="collapse__header">
          <span>Custos de Instalação</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="collapse__body">
          <p class="table-empty-cell">Nenhum pedido de despesas vinculado a esta instalação.</p>
        </div>
      </div>
    `
  }

  const linhas = instalacao.custos.map(c => `
    <tr>
      <td>${c.descricao}</td>
      <td>${formatMoeda(c.valor)}</td>
    </tr>
  `).join('')
  const total = instalacao.custos.reduce((s, c) => s + c.valor, 0)

  return `
    <div class="collapse collapse--open" data-collapse>
      <div class="collapse__header">
        <span>Custos de Instalação — Pedido #${instalacao.pedidoDespesas}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="collapse__body">
        <table class="mini-table">
          <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
          <tbody>${linhas}<tr><td><b>Total</b></td><td><b>${formatMoeda(total)}</b></td></tr></tbody>
        </table>
      </div>
    </div>
  `
}

function renderChecklistItem(item, index) {
  const icone = ICONES_CHECKLIST[index] || ICONES_CHECKLIST[0]

  let acoesHtml = ''
  if (item.status === 'pendente') {
    acoesHtml = `
      <div class="checklist-item__actions" data-acoes>
        <button class="btn btn--aprovar" data-action="aprovar">Aprovar</button>
        <button class="btn btn--reprovar" data-action="reprovar">Reprovar</button>
      </div>
      <div class="checklist-item__motivo" data-motivo style="display:none">
        <textarea placeholder="Motivo da reprovação..."></textarea>
        <button class="btn btn--confirmar" data-action="confirmar-reprovacao" style="align-self:flex-start">Confirmar reprovação</button>
      </div>
    `
  } else if (item.status === 'aprovado') {
    acoesHtml = `
      <div class="checklist-item__resultado">
        <span class="chip chip--concluido">Aprovado</span>
        <button class="btn btn--ghost-sm" data-action="reabrir">Alterar decisão</button>
      </div>
    `
  } else {
    acoesHtml = `
      <div class="checklist-item__resultado">
        <span class="chip chip--cancelado">Reprovado</span>
        <button class="btn btn--ghost-sm" data-action="reabrir">Alterar decisão</button>
      </div>
      <span class="checklist-item__resultado-motivo">Motivo: ${item.motivo}</span>
    `
  }

  return `
    <div class="checklist-item" data-checklist-item="${index}">
      <div class="checklist-item__photo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icone}</svg>
        <span>Aguardando foto real enviada pelo cliente via app Bannerjet</span>
      </div>
      <div class="checklist-item__body">
        <span class="checklist-item__titulo">${item.item}</span>
        ${acoesHtml}
      </div>
    </div>
  `
}

function renderResumo(instalacao) {
  const itens = instalacao.checklist.map(item => {
    const chipCls = { pendente: 'chip--emandamento', aprovado: 'chip--concluido', reprovado: 'chip--cancelado' }[item.status]
    const label = { pendente: 'Pendente', aprovado: 'Aprovado', reprovado: 'Reprovado' }[item.status]
    return `
      <div class="resumo-item">
        <div>
          <div class="resumo-item__nome">${item.item}</div>
          ${item.status === 'reprovado' ? `<div class="resumo-item__motivo">Motivo: ${item.motivo}</div>` : ''}
        </div>
        <span class="chip ${chipCls}">${label}</span>
      </div>
    `
  }).join('')

  const aprovados = instalacao.checklist.filter(i => i.status === 'aprovado').length
  const reprovados = instalacao.checklist.filter(i => i.status === 'reprovado').length
  const pendentes = instalacao.checklist.filter(i => i.status === 'pendente').length

  return `
    <div class="card" style="margin-top:20px">
      <div class="section-header">
        <h2 class="section-title">Resumo do Checklist</h2>
        <span class="section-badge">${aprovados} aprovado${aprovados !== 1 ? 's' : ''} · ${reprovados} reprovado${reprovados !== 1 ? 's' : ''} · ${pendentes} pendente${pendentes !== 1 ? 's' : ''}</span>
      </div>
      <div class="resumo-lista">${itens}</div>
    </div>
  `
}

function podeAvancar(instalacao) {
  return instalacao.checklist.every(i => i.status !== 'pendente')
}

function render() {
  const instalacao = state.instalacao
  const container = document.getElementById('conteudo')
  container.innerHTML = `
    ${renderClienteCard(instalacao)}
    ${renderProdutos(instalacao)}
    ${renderCustos(instalacao)}
    <h2 class="section-title" style="margin-top:28px">Checklist de Instalação</h2>
    ${instalacao.checklist.map(renderChecklistItem).join('')}
    ${renderResumo(instalacao)}
    <div class="avancar-bar">
      <button class="btn btn--avancar" id="btn-avancar" ${podeAvancar(instalacao) ? '' : 'disabled'}>
        Avançar para próxima etapa
      </button>
    </div>
  `

  document.getElementById('btn-avancar').addEventListener('click', () => {
    if (!podeAvancar(instalacao)) return
    showToast('Instalação avançada para a próxima etapa (protótipo)')
  })

  setupCollapse()
  setupChecklistActions()
}

function setupCollapse() {
  document.querySelectorAll('[data-collapse] .collapse__header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('[data-collapse]').classList.toggle('collapse--open')
    })
  })
}

function setupChecklistActions() {
  document.querySelectorAll('[data-checklist-item]').forEach(el => {
    const index = Number(el.dataset.checklistItem)
    const item = state.instalacao.checklist[index]

    el.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const action = btn.dataset.action

      if (action === 'aprovar') {
        item.status = 'aprovado'
        render()
      } else if (action === 'reprovar') {
        const motivoBox = el.querySelector('[data-motivo]')
        const acoesBox = el.querySelector('[data-acoes]')
        acoesBox.style.display = 'none'
        motivoBox.style.display = 'flex'
      } else if (action === 'confirmar-reprovacao') {
        const textarea = el.querySelector('textarea')
        if (!textarea.value.trim()) {
          showToast('Descreva o motivo da reprovação')
          return
        }
        item.status = 'reprovado'
        item.motivo = textarea.value.trim()
        render()
      } else if (action === 'reabrir') {
        item.status = 'pendente'
        item.motivo = ''
        render()
      }
    })
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
  const id = new URLSearchParams(location.search).get('id')
  try {
    state.instalacao = await fetchJson(`/api/instalacoes/${id}`)
    render()
  } catch (e) {
    document.getElementById('conteudo').innerHTML = '<p class="table-empty-cell">Instalação não encontrada.</p>'
  }
}

document.addEventListener('DOMContentLoaded', init)

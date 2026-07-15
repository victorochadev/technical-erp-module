const state = {
  itens: [],
  atendimentoVinculado: null,
  requisicaoId: null,
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function formatMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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

function debounce(fn, wait) {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

// ─── Autocomplete genérico ───────────────────────────────────────────────────

function createAutocomplete({ inputEl, dropdownEl, fetchItems, renderItem, onSelect, minChars = 1 }) {
  let items = []

  function close() {
    dropdownEl.classList.remove('autocomplete-dropdown--open')
    dropdownEl.innerHTML = ''
  }

  function open(list) {
    items = list
    if (items.length === 0) {
      dropdownEl.innerHTML = '<div class="autocomplete-empty">Nenhum resultado encontrado</div>'
    } else {
      dropdownEl.innerHTML = items.map((item, i) => `<div class="autocomplete-item" data-index="${i}">${renderItem(item)}</div>`).join('')
    }
    dropdownEl.classList.add('autocomplete-dropdown--open')
  }

  const runSearch = debounce(async (query) => {
    if (query.trim().length < minChars) { close(); return }
    const results = await fetchItems(query)
    open(results)
  }, 200)

  inputEl.addEventListener('input', () => runSearch(inputEl.value))
  inputEl.addEventListener('focus', () => { if (inputEl.value.trim().length >= minChars) runSearch(inputEl.value) })

  dropdownEl.addEventListener('click', e => {
    const el = e.target.closest('.autocomplete-item')
    if (!el) return
    const item = items[Number(el.dataset.index)]
    onSelect(item)
    close()
  })

  document.addEventListener('click', e => {
    if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) close()
  })
}

// ─── Funcionário ──────────────────────────────────────────────────────────────

function setupAutocompleteFuncionario() {
  createAutocomplete({
    inputEl: document.getElementById('input-funcionario'),
    dropdownEl: document.getElementById('dropdown-funcionario'),
    minChars: 1,
    fetchItems: async query => {
      const tecnicos = await fetchJson('/api/tecnicos')
      return tecnicos.filter(t => t.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    },
    renderItem: nome => `<div class="autocomplete-item__title">${nome}</div>`,
    onSelect: nome => { document.getElementById('input-funcionario').value = nome },
  })
}

// ─── Atendimento vinculado ─────────────────────────────────────────────────────

function setupAutocompleteVinculo() {
  const inputEl = document.getElementById('input-atendimento-vinculado')
  createAutocomplete({
    inputEl,
    dropdownEl: document.getElementById('dropdown-atendimento-vinculado'),
    minChars: 1,
    fetchItems: query => fetchJson(`/api/atendimentos?busca=${encodeURIComponent(query)}`),
    renderItem: a => `<div class="autocomplete-item__title">Nº ${a.numero} — ${a.cliente}</div><div class="autocomplete-item__sub">${a.defeito}</div>`,
    onSelect: atendimento => {
      state.atendimentoVinculado = atendimento
      inputEl.value = `Nº ${atendimento.numero} — ${atendimento.cliente}`
    },
  })
  inputEl.addEventListener('input', () => { if (!inputEl.value.trim()) state.atendimentoVinculado = null })
}

// ─── Produtos ──────────────────────────────────────────────────────────────────

function setupAutocompleteProduto() {
  createAutocomplete({
    inputEl: document.getElementById('input-produto-descricao'),
    dropdownEl: document.getElementById('dropdown-produto'),
    minChars: 1,
    fetchItems: query => fetchJson(`/api/requisicoes/produtos?q=${encodeURIComponent(query)}`),
    renderItem: p => `<div class="autocomplete-item__title">${p.descricao}</div>`,
    onSelect: produto => {
      document.getElementById('input-produto-descricao').value = produto.descricao
      document.getElementById('input-produto-valor').value = produto.valorUnit
      recomputeProdutoTotal()
    },
  })
}

function recomputeProdutoTotal() {
  const qtd = Number(document.getElementById('input-produto-qtd').value) || 0
  const valorUnit = Number(document.getElementById('input-produto-valor').value) || 0
  document.getElementById('input-produto-total').value = (qtd * valorUnit).toFixed(2).replace('.', ',')
}

function renderItensTabela() {
  const tbody = document.getElementById('itens-tbody')
  if (state.itens.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty-cell">Nenhum produto adicionado</td></tr>`
  } else {
    tbody.innerHTML = state.itens.map((item, i) => `
      <tr>
        <td>${item.descricao}</td>
        <td>${item.qtd}</td>
        <td>${formatMoeda(item.valorUnit)}</td>
        <td>${formatMoeda(item.valorTotal)}</td>
        <td><button class="item-remove-btn" data-index="${i}" aria-label="Remover">✕</button></td>
      </tr>
    `).join('')
  }
  const total = state.itens.reduce((soma, item) => soma + item.valorTotal, 0)
  document.getElementById('produtos-valor-total').textContent = formatMoeda(total)
}

function adicionarProduto() {
  const descricao = document.getElementById('input-produto-descricao').value.trim()
  const qtd = Number(document.getElementById('input-produto-qtd').value) || 0
  const valorUnit = Number(document.getElementById('input-produto-valor').value) || 0
  if (!descricao || qtd <= 0) { showToast('Informe a descrição e uma quantidade válida.'); return }

  state.itens.push({ descricao, qtd, valorUnit, valorTotal: qtd * valorUnit })
  renderItensTabela()

  document.getElementById('input-produto-descricao').value = ''
  document.getElementById('input-produto-qtd').value = 1
  document.getElementById('input-produto-valor').value = 0
  recomputeProdutoTotal()
}

function setupProdutos() {
  setupAutocompleteProduto()
  document.getElementById('input-produto-qtd').addEventListener('input', recomputeProdutoTotal)
  document.getElementById('input-produto-valor').addEventListener('input', recomputeProdutoTotal)
  document.getElementById('btn-adicionar-produto').addEventListener('click', adicionarProduto)
  document.getElementById('itens-tbody').addEventListener('click', e => {
    const btn = e.target.closest('.item-remove-btn')
    if (!btn) return
    state.itens.splice(Number(btn.dataset.index), 1)
    renderItensTabela()
  })
}

// ─── Salvar ────────────────────────────────────────────────────────────────────

async function salvarRequisicao() {
  const funcionario = document.getElementById('input-funcionario').value.trim()
  if (!funcionario) { showToast('Selecione um funcionário antes de confirmar.'); return }

  const payload = {
    dtEmissao: document.getElementById('input-data-emissao').value,
    funcionario,
    itens: state.itens,
    atendimentoVinculadoId: state.atendimentoVinculado ? state.atendimentoVinculado.id : null,
    observacao: document.getElementById('input-observacao').value,
  }

  const requisicao = state.requisicaoId
    ? await fetch(`/api/requisicoes/${state.requisicaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json())
    : await fetch('/api/requisicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json())

  document.getElementById('numero-requisicao').textContent = `Pedido: ${requisicao.numero}`
  showToast(`Requisição nº ${requisicao.numero} ${state.requisicaoId ? 'atualizada' : 'salva'}.`)
  setTimeout(() => { window.location.href = 'requisicoes.html' }, 1200)
}

// ─── Edição de requisição já existente ─────────────────────────────────────────

async function abrirEmModoEdicao(id) {
  let requisicao
  try {
    requisicao = await fetchJson(`/api/requisicoes/${id}`)
  } catch (e) {
    showToast('Requisição não encontrada')
    return
  }

  state.requisicaoId = requisicao.id
  state.itens = requisicao.itens || []

  document.getElementById('breadcrumb').textContent = 'Home / Vendas / Requisições / Editar'
  document.getElementById('numero-requisicao').textContent = `Pedido: ${requisicao.numero}`

  document.getElementById('input-data-emissao').value = requisicao.dtEmissao
  document.getElementById('input-funcionario').value = requisicao.funcionario
  document.getElementById('input-observacao').value = requisicao.observacao || ''

  if (requisicao.atendimentoVinculadoId) {
    try {
      const atendimento = await fetchJson(`/api/atendimentos/${requisicao.atendimentoVinculadoId}`)
      state.atendimentoVinculado = atendimento
      document.getElementById('input-atendimento-vinculado').value = `Nº ${atendimento.numero} — ${atendimento.cliente}`
    } catch (e) { /* atendimento pode ter sido removido — ignora */ }
  }

  setupAutocompleteFuncionario()
  setupAutocompleteVinculo()
  setupProdutos()
  document.getElementById('btn-confirmar').addEventListener('click', salvarRequisicao)

  renderItensTabela()
}

function setupTheme() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('at-theme', next)
  })
}

function init() {
  setupTheme()
  recomputeProdutoTotal()

  const params = new URLSearchParams(location.search)
  const id = params.get('id')

  if (id) {
    abrirEmModoEdicao(id)
  } else {
    document.getElementById('input-data-emissao').value = new Date().toISOString().split('T')[0]
    setupAutocompleteFuncionario()
    setupAutocompleteVinculo()
    setupProdutos()
    document.getElementById('btn-confirmar').addEventListener('click', salvarRequisicao)
  }
}

document.addEventListener('DOMContentLoaded', init)

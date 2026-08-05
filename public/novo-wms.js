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

function mostrarPopup(mensagem) {
  document.getElementById('popup-mensagem').textContent = mensagem
  document.getElementById('popup-overlay').classList.add('popup-overlay--show')
}

function setupTheme() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('at-theme', next)
  })
}

// ─── Combobox pesquisável (Produto) ────────────────────────────────────────

function criarComboSelect(container) {
  let opcoes = []
  let itensFiltrados = []
  let valorSelecionado = ''
  let aberto = false

  container.innerHTML = `
    <div class="combo-select__box" tabindex="0">
      <span class="combo-select__value combo-select__value--placeholder">Selecione...</span>
      <svg class="combo-select__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="combo-select__panel">
      <input type="text" class="combo-select__search" placeholder="Buscar..." />
      <div class="combo-select__list"></div>
    </div>
  `

  const box = container.querySelector('.combo-select__box')
  const valueEl = container.querySelector('.combo-select__value')
  const searchInput = container.querySelector('.combo-select__search')
  const listEl = container.querySelector('.combo-select__list')

  function renderLista(filtro) {
    const alvo = (filtro || '').toLowerCase()
    itensFiltrados = opcoes.filter(o => o.toLowerCase().includes(alvo))
    if (itensFiltrados.length === 0) {
      listEl.innerHTML = '<div class="combo-select__empty">Nenhum produto cadastrado</div>'
      return
    }
    listEl.innerHTML = itensFiltrados.map((o, i) => `
      <div class="combo-select__item${o === valorSelecionado ? ' combo-select__item--selected' : ''}" data-index="${i}">${o}</div>
    `).join('')
  }

  function atualizarValue() {
    if (valorSelecionado) {
      valueEl.textContent = valorSelecionado
      valueEl.classList.remove('combo-select__value--placeholder')
    } else {
      valueEl.textContent = 'Selecione...'
      valueEl.classList.add('combo-select__value--placeholder')
    }
  }

  function abrir() {
    aberto = true
    container.classList.add('combo-select--open')
    searchInput.value = ''
    renderLista('')
    searchInput.focus()
  }

  function fechar() {
    aberto = false
    container.classList.remove('combo-select--open')
  }

  box.addEventListener('click', () => { aberto ? fechar() : abrir() })
  searchInput.addEventListener('input', () => renderLista(searchInput.value))
  searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') fechar() })
  listEl.addEventListener('click', e => {
    const item = e.target.closest('.combo-select__item')
    if (!item) return
    valorSelecionado = itensFiltrados[Number(item.dataset.index)]
    atualizarValue()
    fechar()
  })
  document.addEventListener('click', e => {
    if (!container.contains(e.target)) fechar()
  })

  return {
    setOpcoes(lista) { opcoes = lista },
    setValor(v) { valorSelecionado = v || ''; atualizarValue() },
    getValor() { return valorSelecionado },
  }
}

let comboProduto = null
let produtoIdPorNome = {}

async function setupProdutos() {
  comboProduto = criarComboSelect(document.getElementById('combo-produto'))
  const res = await fetch('/api/produtos')
  const produtos = res.ok ? await res.json() : []
  produtoIdPorNome = Object.fromEntries(produtos.map(p => [p.nome, p.id]))
  comboProduto.setOpcoes(produtos.map(p => p.nome))
}

async function registrarWms() {
  const produtoNome = comboProduto.getValor()
  const produtoId = produtoIdPorNome[produtoNome]
  if (!produtoId) { showToast('Selecione um produto antes de registrar.'); return }

  const quantidade = Number(document.getElementById('input-quantidade').value)
  if (!quantidade || quantidade < 1) { showToast('Informe a quantidade de máquinas a registrar.'); return }

  const res = await fetch('/api/wms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produtoId, quantidade }),
  })
  if (!res.ok) { showToast('Não foi possível registrar as máquinas.'); return }
  const unidades = await res.json()

  const lote = String(unidades[0].lote).padStart(3, '0')
  mostrarPopup(`Lote ${lote} registrado com ${unidades.length} máquina${unidades.length !== 1 ? 's' : ''}!`)
  setTimeout(() => { window.location.href = 'wms.html' }, 1800)
}

async function init() {
  setupTheme()
  await setupProdutos()
  document.getElementById('btn-confirmar').addEventListener('click', registrarWms)
}

document.addEventListener('DOMContentLoaded', init)

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

function setupTheme() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('at-theme', next)
  })
}

const state = { funcionarioId: null }

// ─── Combobox pesquisável (Cargo) ─────────────────────────────

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
      listEl.innerHTML = '<div class="combo-select__empty">Nenhum cargo cadastrado</div>'
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

let comboCargo = null

async function setupCargos() {
  comboCargo = criarComboSelect(document.getElementById('combo-cargo'))
  const res = await fetch('/api/cargos-salarios')
  const cargos = res.ok ? (await res.json()).map(c => c.nome) : []
  comboCargo.setOpcoes(cargos)
}

async function preencherFormulario(id) {
  const res = await fetch(`/api/funcionarios/${id}`)
  if (!res.ok) { showToast('Funcionário não encontrado'); return }
  const f = await res.json()

  document.getElementById('input-nome').value = f.nome || ''
  comboCargo.setValor(f.cargo)
  document.getElementById('input-telefone').value = f.telefone || ''
  document.getElementById('input-email').value = f.email || ''

  document.getElementById('page-title').textContent = 'Editar Funcionário'
  document.getElementById('breadcrumb').textContent = 'Home / Cadastro / Funcionários / Editar'
  document.getElementById('btn-confirmar').textContent = 'Salvar Alterações'
}

async function salvarFuncionario() {
  const nome = document.getElementById('input-nome').value.trim()
  if (!nome) { showToast('Informe o nome antes de salvar.'); return }

  const payload = {
    nome,
    cargo: comboCargo.getValor(),
    telefone: document.getElementById('input-telefone').value,
    email: document.getElementById('input-email').value,
  }

  const res = await fetch(state.funcionarioId ? `/api/funcionarios/${state.funcionarioId}` : '/api/funcionarios', {
    method: state.funcionarioId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { showToast('Não foi possível salvar o funcionário.'); return }
  const funcionario = await res.json()

  showToast(`Funcionário "${funcionario.nome}" salvo.`)
  setTimeout(() => { window.location.href = 'funcionarios.html' }, 1200)
}

async function init() {
  setupTheme()
  await setupCargos()
  document.getElementById('btn-confirmar').addEventListener('click', salvarFuncionario)

  const id = new URLSearchParams(location.search).get('id')
  if (id) {
    state.funcionarioId = id
    await preencherFormulario(id)
  }
}

document.addEventListener('DOMContentLoaded', init)

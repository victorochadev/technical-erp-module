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

const state = { produtoId: null, imagem: '' }

// ─── Combobox pesquisável (Grupo de Produtos 1/2) ─────────────────────────────

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
      listEl.innerHTML = '<div class="combo-select__empty">Nenhum grupo cadastrado</div>'
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

let comboGrupo1 = null
let comboGrupo2 = null

async function setupGrupos() {
  comboGrupo1 = criarComboSelect(document.getElementById('combo-grupo-1'))
  comboGrupo2 = criarComboSelect(document.getElementById('combo-grupo-2'))

  const res = await fetch('/api/grupos-produto')
  const grupos = res.ok ? (await res.json()).map(g => g.nome) : []
  comboGrupo1.setOpcoes(grupos)
  comboGrupo2.setOpcoes(grupos)
}

function exibirPreviewImagem(dataUrl) {
  state.imagem = dataUrl || ''
  const preview = document.getElementById('imagem-preview')
  const img = document.getElementById('imagem-preview-img')
  if (dataUrl) {
    img.src = dataUrl
    preview.style.display = 'block'
  } else {
    img.src = ''
    preview.style.display = 'none'
  }
}

function setupImagem() {
  const input = document.getElementById('input-imagem')
  document.getElementById('btn-anexar-imagem').addEventListener('click', () => input.click())
  input.addEventListener('change', () => {
    const file = input.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => exibirPreviewImagem(reader.result)
    reader.readAsDataURL(file)
  })
  document.getElementById('btn-remover-imagem').addEventListener('click', () => {
    input.value = ''
    exibirPreviewImagem('')
  })
}

async function preencherFormulario(id) {
  const res = await fetch(`/api/produtos/${id}`)
  if (!res.ok) { showToast('Produto não encontrado'); return }
  const p = await res.json()

  document.getElementById('input-nome').value = p.nome || ''
  document.getElementById('input-valor').value = p.valor || 0
  document.getElementById('input-valor-avista').value = p.valorAvista || 0
  comboGrupo1.setValor(p.grupo1)
  comboGrupo2.setValor(p.grupo2)
  document.getElementById('input-ncm').value = p.ncm || ''
  document.getElementById('input-juros').value = p.juros || 0
  document.getElementById('input-controla-estoque').checked = !!p.controlaEstoque
  exibirPreviewImagem(p.imagem || '')

  document.getElementById('page-title').textContent = 'Editar Produto'
  document.getElementById('breadcrumb').textContent = 'Home / Cadastro / Produtos / Editar'
  document.getElementById('btn-confirmar').textContent = 'Salvar Alterações'
}

async function salvarProduto() {
  const nome = document.getElementById('input-nome').value.trim()
  if (!nome) { showToast('Informe o nome do item antes de salvar.'); return }

  const payload = {
    nome,
    valor: Number(document.getElementById('input-valor').value) || 0,
    valorAvista: Number(document.getElementById('input-valor-avista').value) || 0,
    grupo1: comboGrupo1.getValor(),
    grupo2: comboGrupo2.getValor(),
    ncm: document.getElementById('input-ncm').value,
    juros: Number(document.getElementById('input-juros').value) || 0,
    controlaEstoque: document.getElementById('input-controla-estoque').checked,
    imagem: state.imagem,
  }

  const res = await fetch(state.produtoId ? `/api/produtos/${state.produtoId}` : '/api/produtos', {
    method: state.produtoId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { showToast('Não foi possível salvar o produto.'); return }
  await res.json()

  const mensagem = state.produtoId ? 'ATENÇÃO! PRODUTO ATUALIZADO COM SUCESSO!' : 'ATENÇÃO! PRODUTO CRIADO COM SUCESSO!'
  mostrarPopup(mensagem)
  setTimeout(() => { window.location.href = 'produtos.html' }, 1800)
}

async function init() {
  setupTheme()
  await setupGrupos()
  setupImagem()
  document.getElementById('btn-confirmar').addEventListener('click', salvarProduto)

  const id = new URLSearchParams(location.search).get('id')
  if (id) {
    state.produtoId = id
    await preencherFormulario(id)
  }
}

document.addEventListener('DOMContentLoaded', init)

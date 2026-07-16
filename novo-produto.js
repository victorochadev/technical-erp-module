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

const state = { produtoId: null }

async function preencherFormulario(id) {
  const res = await fetch(`/api/produtos/${id}`)
  if (!res.ok) { showToast('Produto não encontrado'); return }
  const p = await res.json()

  document.getElementById('input-nome').value = p.nome || ''
  document.getElementById('input-valor').value = p.valor || 0
  document.getElementById('input-valor-avista').value = p.valorAvista || 0

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
  }

  const res = await fetch(state.produtoId ? `/api/produtos/${state.produtoId}` : '/api/produtos', {
    method: state.produtoId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { showToast('Não foi possível salvar o produto.'); return }
  const produto = await res.json()

  showToast(`Produto "${produto.nome}" salvo.`)
  setTimeout(() => { window.location.href = 'produtos.html' }, 1200)
}

async function init() {
  setupTheme()
  document.getElementById('btn-confirmar').addEventListener('click', salvarProduto)

  const id = new URLSearchParams(location.search).get('id')
  if (id) {
    state.produtoId = id
    await preencherFormulario(id)
  }
}

document.addEventListener('DOMContentLoaded', init)

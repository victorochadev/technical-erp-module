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

async function salvarCliente() {
  const razaoSocial = document.getElementById('input-razao-social').value.trim()
  if (!razaoSocial) { showToast('Informe a razão social antes de salvar.'); return }

  const payload = {
    razaoSocial,
    nomeFantasia: document.getElementById('input-nome-fantasia').value,
    cnpj: document.getElementById('input-cnpj').value,
    ie: document.getElementById('input-ie').value,
    endereco: document.getElementById('input-endereco').value,
    bairro: document.getElementById('input-bairro').value,
    cep: document.getElementById('input-cep').value,
    cidade: document.getElementById('input-cidade').value,
    complemento: document.getElementById('input-complemento').value,
    contato: document.getElementById('input-contato').value,
    telefone: document.getElementById('input-telefone').value,
    celular: document.getElementById('input-celular').value,
    email: document.getElementById('input-email').value,
    site: document.getElementById('input-site').value,
  }

  let cliente
  try {
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Falha ao salvar no servidor')
    cliente = await res.json()
  } catch (e) {
    // Sem back-end disponível (ex: versão publicada no GitHub Pages, que só
    // serve arquivos estáticos) — guarda o cadastro no navegador para a lista
    // de Clientes conseguir exibi-lo mesmo assim.
    cliente = { id: `local-${Date.now()}`, ...payload }
    const locais = JSON.parse(localStorage.getItem('clientes-locais') || '[]')
    locais.push(cliente)
    localStorage.setItem('clientes-locais', JSON.stringify(locais))
  }

  showToast(`Cliente "${cliente.nomeFantasia}" salvo.`)
  setTimeout(() => { window.location.href = 'clientes.html' }, 1200)
}

function init() {
  setupTheme()
  document.getElementById('btn-confirmar').addEventListener('click', salvarCliente)
}

document.addEventListener('DOMContentLoaded', init)

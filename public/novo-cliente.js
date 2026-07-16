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

const state = { clienteId: null }

async function preencherFormulario(id) {
  const res = await fetch(`/api/clientes/${id}`)
  if (!res.ok) { showToast('Cliente não encontrado'); return }
  const c = await res.json()

  document.getElementById('input-razao-social').value = c.razaoSocial || ''
  document.getElementById('input-nome-fantasia').value = c.nomeFantasia || ''
  document.getElementById('input-cnpj').value = c.cnpj || ''
  document.getElementById('input-ie').value = c.ie || ''
  document.getElementById('input-endereco').value = c.endereco || ''
  document.getElementById('input-bairro').value = c.bairro || ''
  document.getElementById('input-cep').value = c.cep || ''
  document.getElementById('input-cidade').value = c.cidade || ''
  document.getElementById('input-complemento').value = c.complemento || ''
  document.getElementById('input-contato').value = c.contato || ''
  document.getElementById('input-telefone').value = c.telefone || ''
  document.getElementById('input-celular').value = c.celular || ''
  document.getElementById('input-email').value = c.email || ''
  document.getElementById('input-site').value = c.site || ''

  document.getElementById('page-title').textContent = 'Editar Cliente'
  document.getElementById('breadcrumb').textContent = 'Home / Cadastro / Clientes / Editar'
  document.getElementById('btn-confirmar').textContent = 'Salvar Alterações'
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

  const res = await fetch(state.clienteId ? `/api/clientes/${state.clienteId}` : '/api/clientes', {
    method: state.clienteId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { showToast('Não foi possível salvar o cliente.'); return }
  const cliente = await res.json()

  showToast(`Cliente "${cliente.nomeFantasia}" salvo.`)
  setTimeout(() => { window.location.href = 'clientes.html' }, 1200)
}

async function init() {
  setupTheme()
  document.getElementById('btn-confirmar').addEventListener('click', salvarCliente)

  const id = new URLSearchParams(location.search).get('id')
  if (id) {
    state.clienteId = id
    await preencherFormulario(id)
  }
}

document.addEventListener('DOMContentLoaded', init)

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

const state = { tecnicoId: null }

async function preencherFormulario(id) {
  const res = await fetch(`/api/tecnicos-terceirizados/${id}`)
  if (!res.ok) { showToast('Técnico terceirizado não encontrado'); return }
  const t = await res.json()

  document.getElementById('input-nome').value = t.nome || ''
  document.getElementById('input-empresa').value = t.empresa || ''
  document.getElementById('input-especialidade').value = t.especialidade || ''
  document.getElementById('input-cidade').value = t.cidade || ''
  document.getElementById('input-telefone').value = t.telefone || ''
  document.getElementById('input-email').value = t.email || ''

  document.getElementById('page-title').textContent = 'Editar Técnico Terceirizado'
  document.getElementById('breadcrumb').textContent = 'Home / Cadastro / Técnicos Terceirizados / Editar'
  document.getElementById('btn-confirmar').textContent = 'Salvar Alterações'
}

async function salvarTecnico() {
  const nome = document.getElementById('input-nome').value.trim()
  if (!nome) { showToast('Informe o nome antes de salvar.'); return }

  const payload = {
    nome,
    empresa: document.getElementById('input-empresa').value,
    especialidade: document.getElementById('input-especialidade').value,
    cidade: document.getElementById('input-cidade').value,
    telefone: document.getElementById('input-telefone').value,
    email: document.getElementById('input-email').value,
  }

  const res = await fetch(state.tecnicoId ? `/api/tecnicos-terceirizados/${state.tecnicoId}` : '/api/tecnicos-terceirizados', {
    method: state.tecnicoId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { showToast('Não foi possível salvar o técnico terceirizado.'); return }
  const tecnico = await res.json()

  showToast(`Técnico terceirizado "${tecnico.nome}" salvo.`)
  setTimeout(() => { window.location.href = 'tecnicos-terceirizados.html' }, 1200)
}

async function init() {
  setupTheme()
  document.getElementById('btn-confirmar').addEventListener('click', salvarTecnico)

  const id = new URLSearchParams(location.search).get('id')
  if (id) {
    state.tecnicoId = id
    await preencherFormulario(id)
  }
}

document.addEventListener('DOMContentLoaded', init)

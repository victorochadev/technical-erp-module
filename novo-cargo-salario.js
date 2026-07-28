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

const state = { cargoId: null }

async function preencherFormulario(id) {
  const res = await fetch(`/api/cargos-salarios/${id}`)
  if (!res.ok) { showToast('Cargo não encontrado'); return }
  const c = await res.json()

  document.getElementById('input-nome').value = c.nome || ''
  document.getElementById('input-salario').value = c.salarioBase || 0

  document.getElementById('page-title').textContent = 'Editar Cargo'
  document.getElementById('breadcrumb').textContent = 'Home / Cadastro / Cargos e Salários / Editar'
  document.getElementById('btn-confirmar').textContent = 'Salvar Alterações'
}

async function salvarCargo() {
  const nome = document.getElementById('input-nome').value.trim()
  if (!nome) { showToast('Informe o nome do cargo antes de salvar.'); return }

  const payload = {
    nome,
    salarioBase: Number(document.getElementById('input-salario').value) || 0,
  }

  const res = await fetch(state.cargoId ? `/api/cargos-salarios/${state.cargoId}` : '/api/cargos-salarios', {
    method: state.cargoId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { showToast('Não foi possível salvar o cargo.'); return }
  const cargo = await res.json()

  showToast(`Cargo "${cargo.nome}" salvo.`)
  setTimeout(() => { window.location.href = 'cargos-salarios.html' }, 1200)
}

async function init() {
  setupTheme()
  document.getElementById('btn-confirmar').addEventListener('click', salvarCargo)

  const id = new URLSearchParams(location.search).get('id')
  if (id) {
    state.cargoId = id
    await preencherFormulario(id)
  }
}

document.addEventListener('DOMContentLoaded', init)

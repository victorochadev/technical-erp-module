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

  const tecnico = await fetch('/api/tecnicos-terceirizados', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json())

  showToast(`Técnico terceirizado "${tecnico.nome}" salvo.`)
  setTimeout(() => { window.location.href = 'tecnicos-terceirizados.html' }, 1200)
}

function init() {
  setupTheme()
  document.getElementById('btn-confirmar').addEventListener('click', salvarTecnico)
}

document.addEventListener('DOMContentLoaded', init)

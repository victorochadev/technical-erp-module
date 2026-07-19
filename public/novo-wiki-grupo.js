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

async function salvarGrupo() {
  const nome = document.getElementById('input-nome').value.trim()
  if (!nome) { showToast('Informe o nome do grupo antes de salvar.'); return }

  const res = await fetch('/api/wiki-grupos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome }),
  })
  if (!res.ok) { showToast('Não foi possível salvar o grupo.'); return }
  const grupo = await res.json()

  showToast(`Grupo "${grupo.nome}" salvo.`)
  setTimeout(() => { window.location.href = 'wiki.html' }, 1200)
}

async function init() {
  setupTheme()
  document.getElementById('btn-confirmar').addEventListener('click', salvarGrupo)
}

document.addEventListener('DOMContentLoaded', init)

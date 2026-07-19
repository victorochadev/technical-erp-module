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

async function setupGrupos() {
  const res = await fetch('/api/wiki-grupos')
  const grupos = res.ok ? await res.json() : []
  const select = document.getElementById('input-grupo')
  select.insertAdjacentHTML('beforeend', grupos.map(g => `<option value="${g.id}">${g.nome}</option>`).join(''))
}

async function salvarArtigo() {
  const titulo = document.getElementById('input-titulo').value.trim()
  const conteudo = document.getElementById('input-conteudo').value.trim()
  if (!titulo) { showToast('Informe o título antes de salvar.'); return }

  const payload = {
    titulo,
    conteudo,
    grupoId: document.getElementById('input-grupo').value || null,
  }

  const res = await fetch('/api/wiki', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { showToast('Não foi possível salvar a wiki.'); return }
  await res.json()

  showToast('Wiki salva com sucesso.')
  setTimeout(() => { window.location.href = 'wiki.html' }, 1200)
}

async function init() {
  setupTheme()
  await setupGrupos()
  document.getElementById('btn-confirmar').addEventListener('click', salvarArtigo)
}

document.addEventListener('DOMContentLoaded', init)

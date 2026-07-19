const state = { busca: '' }

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function linkify(texto) {
  return texto.replace(/(https?:\/\/[^\s)]+)/g, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`)
}

async function renderLista() {
  const params = new URLSearchParams(state.busca ? { busca: state.busca } : {})
  const artigos = await fetchJson(`/api/wiki?${params.toString()}`)
  const container = document.getElementById('wiki-list')
  document.getElementById('wiki-count-badge').textContent = `${artigos.length} artigo${artigos.length !== 1 ? 's' : ''}`

  if (artigos.length === 0) {
    container.innerHTML = '<div class="wiki-empty">Nenhum artigo encontrado para essa busca.</div>'
    return
  }

  container.innerHTML = artigos.map(a => `
    <div class="wiki-card">
      <div class="wiki-card__titulo">${a.titulo}</div>
      <div class="wiki-card__conteudo">${linkify(a.conteudo)}</div>
    </div>
  `).join('')
}

function setupBusca() {
  document.getElementById('wiki-busca').addEventListener('input', e => {
    state.busca = e.target.value
    renderLista()
  })
}

function setupTheme() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('at-theme', next)
  })
}

async function init() {
  setupTheme()
  setupBusca()
  await renderLista()
}

document.addEventListener('DOMContentLoaded', init)

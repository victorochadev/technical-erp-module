const state = { filters: { busca: '' } }

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function clientesLocaisFiltrados(busca) {
  const locais = JSON.parse(localStorage.getItem('clientes-locais') || '[]')
  if (!busca) return locais
  const alvo = busca.toLowerCase()
  return locais.filter(c => `${c.razaoSocial} ${c.nomeFantasia} ${c.cnpj} ${c.cidade}`.toLowerCase().includes(alvo))
}

async function renderTabela() {
  const params = new URLSearchParams(state.filters)
  let clientes
  try {
    clientes = await fetchJson(`/api/clientes?${params.toString()}`)
  } catch (e) {
    // Sem back-end disponível (ex: versão publicada no GitHub Pages) — mostra
    // só os cadastros salvos neste navegador.
    clientes = []
  }
  clientes = clientes.concat(clientesLocaisFiltrados(state.filters.busca))
  const tbody = document.getElementById('clientes-tbody')
  document.getElementById('clientes-count-badge').textContent = `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`

  if (clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty-cell">Nenhum cliente encontrado</td></tr>'
    return
  }

  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td>${c.razaoSocial}</td>
      <td>${c.nomeFantasia}</td>
      <td>${c.cnpj}</td>
      <td class="text-muted">${c.cidade}</td>
      <td>${c.telefone || '—'}</td>
      <td class="text-muted">${c.email || '—'}</td>
    </tr>
  `).join('')
}

function setupFilters() {
  document.getElementById('filter-busca').addEventListener('input', e => {
    state.filters.busca = e.target.value
    renderTabela()
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
  setupFilters()
  await renderTabela()
}

document.addEventListener('DOMContentLoaded', init)

const state = { filters: { busca: '' } }

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

async function renderTabela() {
  const params = new URLSearchParams(state.filters)
  const tecnicos = await fetchJson(`/api/tecnicos-terceirizados?${params.toString()}`)
  const tbody = document.getElementById('tecnicos-tbody')
  document.getElementById('tecnicos-count-badge').textContent = `${tecnicos.length} técnico${tecnicos.length !== 1 ? 's' : ''}`

  if (tecnicos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty-cell">Nenhum técnico terceirizado encontrado</td></tr>'
    return
  }

  tbody.innerHTML = tecnicos.map(t => `
    <tr>
      <td>${t.nome}</td>
      <td>${t.empresa}</td>
      <td class="text-muted">${t.especialidade}</td>
      <td class="text-muted">${t.cidade}</td>
      <td>${t.telefone || '—'}</td>
      <td class="text-muted">${t.email || '—'}</td>
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

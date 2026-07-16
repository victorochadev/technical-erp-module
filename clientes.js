const state = { filters: { busca: '' } }

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function acoesMenu(id) {
  return `
    <div class="row-actions" data-id="${id}">
      <button class="row-actions__toggle" aria-label="Ações">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      <div class="row-actions__menu">
        <a class="row-actions__item" href="novo-cliente.html?id=${id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
          Editar
        </a>
      </div>
    </div>
  `
}

async function renderTabela() {
  const params = new URLSearchParams(state.filters)
  const clientes = await fetchJson(`/api/clientes?${params.toString()}`)
  const tbody = document.getElementById('clientes-tbody')
  document.getElementById('clientes-count-badge').textContent = `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`

  if (clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Nenhum cliente encontrado</td></tr>'
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
      <td>${acoesMenu(c.id)}</td>
    </tr>
  `).join('')
}

function fecharTodosOsMenus() {
  document.querySelectorAll('.row-actions__menu--open').forEach(el => el.classList.remove('row-actions__menu--open'))
}

function setupAcoes() {
  document.getElementById('clientes-tbody').addEventListener('click', e => {
    const toggle = e.target.closest('.row-actions__toggle')
    if (!toggle) return
    const menu = toggle.parentElement.querySelector('.row-actions__menu')
    const jaAberto = menu.classList.contains('row-actions__menu--open')
    fecharTodosOsMenus()
    if (!jaAberto) menu.classList.add('row-actions__menu--open')
  })

  document.addEventListener('click', e => {
    if (!e.target.closest('.row-actions')) fecharTodosOsMenus()
  })
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
  setupAcoes()
  await renderTabela()
}

document.addEventListener('DOMContentLoaded', init)

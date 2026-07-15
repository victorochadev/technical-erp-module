const state = {
  busca: '',
  porPagina: 50,
  tecnicos: [],
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function statusChip(status) {
  const cls = status.label === 'Concluido' ? 'chip--azul' : 'chip--emandamento'
  const label = status.label === 'Concluido' ? 'Concluído' : 'Em andamento'
  const dataHtml = status.data ? `<span class="chip-status__data">${status.data}</span>` : ''
  return `<span class="chip ${cls} chip-status">${label}${dataHtml}</span>`
}

function tecnicoCell(instalacao) {
  if (instalacao.tecnico) return instalacao.tecnico
  const options = state.tecnicos.map(t => `<option value="${t}">${t}</option>`).join('')
  return `
    <select class="filter-select tecnico-select" data-id="${instalacao.id}">
      <option value="">Vincular um técnico</option>
      ${options}
    </select>
  `
}

async function loadTecnicos() {
  state.tecnicos = await fetchJson('/api/tecnicos')
}

async function renderTabela() {
  const params = new URLSearchParams()
  if (state.busca) params.set('busca', state.busca)
  const instalacoes = await fetchJson(`/api/instalacoes?${params.toString()}`)
  const tbody = document.getElementById('instalacoes-tbody')
  document.getElementById('instalacoes-count-badge').textContent = `${instalacoes.length} instalaç${instalacoes.length !== 1 ? 'ões' : 'ão'}`

  if (instalacoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Nenhuma instalação encontrada</td></tr>'
    return
  }

  tbody.innerHTML = instalacoes.slice(0, state.porPagina).map(i => `
    <tr>
      <td><a class="badge-pedido" href="instalacao-detalhes.html?id=${i.id}">${i.pedidoCompra}</a></td>
      <td>${i.pedidoDespesas ? `<span class="badge-pedido badge-pedido--muted">${i.pedidoDespesas}</span>` : '<span class="badge-pedido badge-pedido--muted">-</span>'}</td>
      <td>${i.cliente.razaoSocial}</td>
      <td>${tecnicoCell(i)}</td>
      <td>${statusChip(i.statusCliente)}</td>
      <td>${statusChip(i.statusTecnico)}</td>
      <td>
        <a class="arrow-btn" href="instalacao-detalhes.html?id=${i.id}" aria-label="Ver detalhes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </td>
    </tr>
  `).join('')
}

function setupFiltros() {
  document.getElementById('filter-busca').addEventListener('input', e => {
    state.busca = e.target.value
    renderTabela()
  })
  document.getElementById('filter-pagina').addEventListener('change', e => {
    state.porPagina = Number(e.target.value)
    renderTabela()
  })
}

function setupVincularTecnico() {
  document.getElementById('instalacoes-tbody').addEventListener('change', e => {
    const select = e.target.closest('.tecnico-select')
    if (!select || !select.value) return
    const cell = select.closest('td')
    cell.textContent = select.value
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
  setupFiltros()
  setupVincularTecnico()
  await loadTecnicos()
  await renderTabela()
}

document.addEventListener('DOMContentLoaded', init)

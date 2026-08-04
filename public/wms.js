const state = { busca: '' }

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function agruparPorLote(unidades) {
  const grupos = new Map()
  unidades.forEach(u => {
    const chave = `${u.produtoId}::${u.lote}`
    if (!grupos.has(chave)) grupos.set(chave, { produtoNome: u.produtoNome || '', lote: u.lote, numeros: [] })
    grupos.get(chave).numeros.push(u.numero)
  })
  return [...grupos.values()].sort((a, b) => a.produtoNome.localeCompare(b.produtoNome) || a.lote - b.lote)
}

async function renderTabela() {
  const unidades = await fetchJson('/api/wms')
  const alvo = state.busca.toLowerCase()
  const filtradas = alvo
    ? unidades.filter(u => u.produtoNome.toLowerCase().includes(alvo) || u.numero.includes(alvo))
    : unidades
  const lotes = agruparPorLote(filtradas)

  const tbody = document.getElementById('wms-tbody')
  document.getElementById('wms-count-badge').textContent = `${lotes.length} lote${lotes.length !== 1 ? 's' : ''}`

  if (lotes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="table-empty-cell">Nenhuma máquina WMS registrada</td></tr>'
    return
  }

  tbody.innerHTML = lotes.map(l => `
    <tr>
      <td>${l.produtoNome}</td>
      <td>${String(l.lote).padStart(3, '0')}</td>
      <td>${l.numeros.length}</td>
      <td>${l.numeros.join(', ')}</td>
    </tr>
  `).join('')
}

function setupFilters() {
  document.getElementById('filter-busca').addEventListener('input', e => {
    state.busca = e.target.value
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

const state = { filters: { busca: '' } }

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

function formatMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function acoesMenu(id) {
  return `
    <div class="row-actions" data-id="${id}">
      <button class="row-actions__toggle" aria-label="Ações">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
    </div>
  `
}

function itemEditarProduto(id) {
  return `
    <a class="row-actions__item" href="novo-produto.html?id=${id}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
      Editar
    </a>
  `
}

async function renderTabela() {
  fecharTodosOsMenus()
  const params = new URLSearchParams(state.filters)
  const produtos = await fetchJson(`/api/produtos?${params.toString()}`)
  const tbody = document.getElementById('produtos-tbody')
  document.getElementById('produtos-count-badge').textContent = `${produtos.length} produto${produtos.length !== 1 ? 's' : ''}`

  if (produtos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty-cell">Nenhum produto encontrado</td></tr>'
    return
  }

  tbody.innerHTML = produtos.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.imagem ? `<img class="produto-thumb" src="${p.imagem}" alt="${p.nome}" />` : '<div class="produto-thumb produto-thumb--vazio">—</div>'}</td>
      <td>${p.nome}</td>
      <td>${formatMoeda(p.valor)}</td>
      <td>${formatMoeda(p.valorAvista)}</td>
      <td>${acoesMenu(p.id)}</td>
    </tr>
  `).join('')
}

// O menu de ações flutua fora da tabela (anexado ao <body>, position: fixed)
// em vez de ficar aninhado dentro de .row-actions — o .table-wrapper tem
// overflow-x: auto para permitir rolagem horizontal em telas menores, o que
// por regra do CSS também clipa overflow-y, cortando qualquer dropdown
// posicionado dentro dele. Reanexar ao body evita esse recorte.
function menuFlutuante() {
  let menu = document.getElementById('row-menu-flutuante')
  if (!menu) {
    menu = document.createElement('div')
    menu.id = 'row-menu-flutuante'
    menu.className = 'row-actions__menu'
    document.body.appendChild(menu)
  }
  return menu
}

function fecharTodosOsMenus() {
  const menu = document.getElementById('row-menu-flutuante')
  if (menu) { menu.classList.remove('row-actions__menu--open'); menu.dataset.abertoPara = '' }
}

function abrirMenuParaToggle(toggle, id, htmlConteudo) {
  const menu = menuFlutuante()
  menu.innerHTML = htmlConteudo
  menu.dataset.abertoPara = id
  menu.style.position = 'fixed'
  menu.style.right = 'auto'
  const rect = toggle.getBoundingClientRect()
  menu.style.top = `${rect.bottom + 4}px`
  menu.style.left = `${rect.right}px`
  menu.classList.add('row-actions__menu--open')
  requestAnimationFrame(() => {
    const menuRect = menu.getBoundingClientRect()
    menu.style.left = `${Math.max(8, rect.right - menuRect.width)}px`
  })
}

function setupAcoes() {
  document.getElementById('produtos-tbody').addEventListener('click', e => {
    const toggle = e.target.closest('.row-actions__toggle')
    if (!toggle) return
    const id = toggle.closest('.row-actions').dataset.id
    const menu = document.getElementById('row-menu-flutuante')
    const jaAberto = menu && menu.classList.contains('row-actions__menu--open') && menu.dataset.abertoPara === id
    fecharTodosOsMenus()
    if (!jaAberto) abrirMenuParaToggle(toggle, id, itemEditarProduto(id))
  })
  document.addEventListener('click', e => {
    if (!e.target.closest('.row-actions') && !e.target.closest('#row-menu-flutuante')) fecharTodosOsMenus()
  })
  window.addEventListener('scroll', fecharTodosOsMenus, true)
  window.addEventListener('resize', fecharTodosOsMenus)
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

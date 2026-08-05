const USUARIO_LOGADO = 'Claudio Code Dev'

// Dados fixos do timbrado — em produção viriam do cadastro da empresa/filial no ERP.
// >>> PONTO DE INTEGRAÇÃO <<<: preencher com dados fictícios/de teste.
const EMPRESA = {
  nome: '',
  endereco: '',
  cidadeEstado: '',
  cnpj: '',
  ie: '',
  fones: '',
  site: '',
  email: '',
}

const state = {
  cliente: null,
  numero: null,
  atendimentoId: null,
  tipo: 'Remoto',
  anexos: [],
  tecnicosCache: null,
  tecnicoTipo: 'bannerjet',
  modoEdicao: false,
  slaInicial: 'padrao',
  atendimentoVinculado: null,
  requisicaoNumero: null,
}

function gerarNumeroRequisicao() {
  return String(4000 + Math.floor(Math.random() * 6000))
}

function debounce(fn, wait) {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao buscar ${url}`)
  return res.json()
}

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

// ─── Autocomplete genérico ───────────────────────────────────────────────────

function createAutocomplete({ inputEl, dropdownEl, fetchItems, renderItem, onSelect, minChars = 1 }) {
  let items = []
  let activeIndex = -1

  function close() {
    dropdownEl.classList.remove('autocomplete-dropdown--open')
    dropdownEl.innerHTML = ''
    activeIndex = -1
  }

  function open(list) {
    items = list
    if (items.length === 0) {
      dropdownEl.innerHTML = '<div class="autocomplete-empty">Nenhum resultado encontrado</div>'
    } else {
      dropdownEl.innerHTML = items.map((item, i) => `<div class="autocomplete-item" data-index="${i}">${renderItem(item)}</div>`).join('')
    }
    dropdownEl.classList.add('autocomplete-dropdown--open')
  }

  const runSearch = debounce(async (query) => {
    if (query.trim().length < minChars) { close(); return }
    const results = await fetchItems(query)
    open(results)
  }, 200)

  inputEl.addEventListener('input', () => runSearch(inputEl.value))
  inputEl.addEventListener('focus', () => { if (inputEl.value.trim().length >= minChars) runSearch(inputEl.value) })

  dropdownEl.addEventListener('click', e => {
    const el = e.target.closest('.autocomplete-item')
    if (!el) return
    const item = items[Number(el.dataset.index)]
    onSelect(item)
    close()
  })

  document.addEventListener('click', e => {
    if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) close()
  })

  return { close }
}

// ─── Combobox pesquisável (Equipamento = Grupo de Produtos / Modelo = Produto) ─

function criarComboSelect(container, { onChange } = {}) {
  let opcoes = []
  let itensFiltrados = []
  let valorSelecionado = ''
  let aberto = false

  container.innerHTML = `
    <div class="combo-select__box" tabindex="0">
      <span class="combo-select__value combo-select__value--placeholder">Selecione...</span>
      <svg class="combo-select__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="combo-select__panel">
      <input type="text" class="combo-select__search" placeholder="Buscar..." />
      <div class="combo-select__list"></div>
    </div>
  `

  const box = container.querySelector('.combo-select__box')
  const valueEl = container.querySelector('.combo-select__value')
  const searchInput = container.querySelector('.combo-select__search')
  const listEl = container.querySelector('.combo-select__list')

  function renderLista(filtro) {
    const alvo = (filtro || '').toLowerCase()
    itensFiltrados = opcoes.filter(o => o.toLowerCase().includes(alvo))
    if (itensFiltrados.length === 0) {
      listEl.innerHTML = '<div class="combo-select__empty">Nenhuma opção cadastrada</div>'
      return
    }
    listEl.innerHTML = itensFiltrados.map((o, i) => `
      <div class="combo-select__item${o === valorSelecionado ? ' combo-select__item--selected' : ''}" data-index="${i}">${o}</div>
    `).join('')
  }

  function atualizarValue() {
    if (valorSelecionado) {
      valueEl.textContent = valorSelecionado
      valueEl.classList.remove('combo-select__value--placeholder')
    } else {
      valueEl.textContent = 'Selecione...'
      valueEl.classList.add('combo-select__value--placeholder')
    }
  }

  function abrir() {
    aberto = true
    container.classList.add('combo-select--open')
    searchInput.value = ''
    renderLista('')
    searchInput.focus()
  }

  function fechar() {
    aberto = false
    container.classList.remove('combo-select--open')
  }

  box.addEventListener('click', () => { aberto ? fechar() : abrir() })
  searchInput.addEventListener('input', () => renderLista(searchInput.value))
  searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') fechar() })
  listEl.addEventListener('click', e => {
    const item = e.target.closest('.combo-select__item')
    if (!item) return
    valorSelecionado = itensFiltrados[Number(item.dataset.index)]
    atualizarValue()
    fechar()
    if (onChange) onChange(valorSelecionado)
  })
  document.addEventListener('click', e => {
    if (!container.contains(e.target)) fechar()
  })

  return {
    setOpcoes(lista) { opcoes = lista },
    setValor(v) { valorSelecionado = v || ''; atualizarValue() },
    getValor() { return valorSelecionado },
  }
}

let comboEquipamento = null
let comboModelo = null
let produtoIdPorNome = {}

function preencherOpcoesWms(numeros) {
  const options = ['<option value="">Selecione um número WMS</option>']
    .concat(numeros.map(n => `<option value="${n}">${n}</option>`))
    .join('')
  document.getElementById('select-wms-1').innerHTML = options
  document.getElementById('select-wms-2').innerHTML = options
}

async function carregarWmsDoProduto(produtoId) {
  if (!produtoId) {
    document.getElementById('select-wms-1').innerHTML = '<option value="">Selecione um produto primeiro</option>'
    document.getElementById('select-wms-2').innerHTML = '<option value="">Selecione um produto primeiro</option>'
    return
  }
  const unidades = await fetchJson(`/api/wms?produtoId=${produtoId}`)
  preencherOpcoesWms(unidades.map(u => u.numero))
}

async function carregarProdutosDoGrupo(grupoNome) {
  if (!grupoNome) {
    comboModelo.setOpcoes([])
    comboModelo.setValor('')
    produtoIdPorNome = {}
    await carregarWmsDoProduto(null)
    return
  }
  const produtos = await fetchJson(`/api/produtos?grupo=${encodeURIComponent(grupoNome)}`)
  produtoIdPorNome = Object.fromEntries(produtos.map(p => [p.nome, p.id]))
  comboModelo.setOpcoes(produtos.map(p => p.nome))
}

async function selecionarEquipamentoModeloWms(grupoNome, produtoNome, wmsValores) {
  comboEquipamento.setValor(grupoNome || '')
  await carregarProdutosDoGrupo(grupoNome || '')
  comboModelo.setValor(produtoNome || '')
  await carregarWmsDoProduto(produtoIdPorNome[produtoNome])
  const [v1, v2] = wmsValores || []
  if (v1) document.getElementById('select-wms-1').value = v1
  if (v2) document.getElementById('select-wms-2').value = v2
}

async function setupCombosEquipamentoModelo() {
  comboEquipamento = criarComboSelect(document.getElementById('combo-equipamento'), {
    onChange: async grupoNome => {
      await carregarProdutosDoGrupo(grupoNome)
      await carregarWmsDoProduto(null)
    },
  })
  comboModelo = criarComboSelect(document.getElementById('combo-modelo'), {
    onChange: async produtoNome => {
      await carregarWmsDoProduto(produtoIdPorNome[produtoNome])
    },
  })

  const grupos = await fetchJson('/api/grupos-produto')
  comboEquipamento.setOpcoes(grupos.map(g => g.nome))
}

// ─── View: busca de cliente ──────────────────────────────────────────────────

function renderClienteInfo(cliente) {
  const grid = document.getElementById('cliente-info-grid')
  grid.innerHTML = `
    <div><b>Razão Social:</b> ${cliente.razaoSocial}</div>
    <div><b>Nome Fantasia:</b> ${cliente.nomeFantasia}</div>
    <div><b>CNPJ:</b> ${cliente.cnpj} <b style="margin-left:10px">IE:</b> ${cliente.ie}</div>
    <div><b>Endereço:</b> ${cliente.endereco}, ${cliente.bairro} - ${cliente.cidade} - CEP ${cliente.cep}</div>
    <div><b>E-mail:</b> ${cliente.email}</div>
    <div><b>Telefone:</b> ${cliente.telefone}${cliente.celular ? ' / Cel: ' + cliente.celular : ''}</div>
  `
}

function startAtendimento(cliente) {
  state.cliente = cliente
  state.numero = 21000 + Math.floor(Math.random() * 900)
  state.dataHoraCriacao = new Date()
  state.modoEdicao = false

  document.getElementById('view-busca').style.display = 'none'
  document.getElementById('view-form').style.display = 'block'
  document.getElementById('breadcrumb').textContent = 'Home / Área Técnica / Atendimentos / Editar'

  document.getElementById('numero-atendimento').textContent = state.numero
  const agora = state.dataHoraCriacao.toLocaleString('pt-BR')
  document.getElementById('info-banner').textContent = `Atendimento efetuado por: ${USUARIO_LOGADO} ${agora}`

  renderClienteInfo(cliente)
  if (state.tipo === 'Laboratório' && !state.requisicaoNumero) state.requisicaoNumero = gerarNumeroRequisicao()
  atualizarVisibilidadeBlocos()
}

async function abrirEmModoEdicao(atendimentoId) {
  let atendimento
  let cliente
  try {
    atendimento = await fetchJson(`/api/atendimentos/${atendimentoId}`)
    cliente = await fetchJson(`/api/clientes/${atendimento.clienteId}`)
  } catch (e) {
    showToast('Atendimento não encontrado')
    return
  }

  state.cliente = cliente
  state.numero = atendimento.numero
  state.atendimentoId = atendimento.id
  state.dataHoraCriacao = new Date(atendimento.ida || atendimento.dtEmissao)
  state.modoEdicao = true

  document.getElementById('view-busca').style.display = 'none'
  document.getElementById('view-form').style.display = 'block'
  document.getElementById('breadcrumb').textContent = 'Home / Área Técnica / Atendimentos / Editar'

  document.getElementById('numero-atendimento').textContent = state.numero
  document.getElementById('info-banner').textContent =
    `Atendimento nº ${atendimento.numero} — Técnico responsável: ${atendimento.tecnico} — ${atendimento.dtEmissao.split('-').reverse().join('/')}`

  renderClienteInfo(cliente)
  setTipo(atendimento.tipo)

  document.getElementById('input-ida').value = atendimento.ida || ''
  document.getElementById('input-volta').value = atendimento.volta || ''
  document.getElementById('input-tecnico').value = atendimento.tecnico || ''
  setTecnicoTipoUI(await inferirTecnicoTipo(atendimento.tecnico))
  await selecionarEquipamentoModeloWms(atendimento.equipamento, atendimento.modelo, atendimento.wms || [])
  document.getElementById('input-defeito').value = atendimento.defeito || ''
  document.getElementById('input-laudo').value = atendimento.laudoTecnico || ''

  if (atendimento.tipo === 'Laboratório') {
    state.requisicaoNumero = atendimento.requisicao || null
    if (atendimento.atendimentoOrigemId) {
      try {
        const origem = await fetchJson(`/api/atendimentos/${atendimento.atendimentoOrigemId}`)
        document.getElementById('input-atendimento-vinculado').value = `Nº ${origem.numero} — ${origem.defeito}`
        state.atendimentoVinculado = origem
      } catch (e) { /* atendimento de origem pode ter sido removido — ignora */ }
    }
    atualizarVisibilidadeBlocos()
  }
}

function backToBusca() {
  document.getElementById('view-form').style.display = 'none'
  document.getElementById('view-busca').style.display = 'block'
  document.getElementById('breadcrumb').textContent = 'Home / Área Técnica / Atendimentos / Novo'
  document.getElementById('input-busca-cliente').value = ''
  document.getElementById('input-busca-cliente').focus()
}

function resetForm() {
  state.cliente = null
  state.numero = null
  state.atendimentoId = null
  state.tipo = 'Remoto'
  state.anexos = []
  state.modoEdicao = false
  state.atendimentoVinculado = null
  state.requisicaoNumero = null
  setTecnicoTipoUI('bannerjet')
  document.getElementById('input-tecnico').value = ''
  comboEquipamento.setValor('')
  comboModelo.setOpcoes([])
  comboModelo.setValor('')
  document.getElementById('input-defeito').value = ''
  document.getElementById('input-laudo').value = ''
  document.getElementById('input-atendimento-vinculado').value = ''
  document.getElementById('select-wms-1').innerHTML = '<option value="">Selecione um produto primeiro</option>'
  document.getElementById('select-wms-2').innerHTML = '<option value="">Selecione um produto primeiro</option>'
  document.getElementById('anexos-grid').innerHTML = ''
  setSlaInicial('padrao')
  setTipo('Remoto')
  backToBusca()
}

// ─── Tipo de atendimento (Remoto / Presencial / Laboratório) ──────────────────

function atualizarVisibilidadeBlocos() {
  const isLab = state.tipo === 'Laboratório'
  document.getElementById('tipo-tabs').style.display = isLab ? 'none' : 'flex'
  document.getElementById('tipo-laboratorio-badge').style.display = isLab ? 'inline-block' : 'none'
  document.getElementById('bloco-sla-inicial').style.display = (isLab && !state.modoEdicao) ? 'flex' : 'none'
  document.getElementById('bloco-vinculo').style.display = isLab ? 'flex' : 'none'
  document.getElementById('bloco-requisicao-numero').style.display = isLab ? 'flex' : 'none'
  document.getElementById('requisicao-numero-badge').textContent = state.requisicaoNumero ? `Nº ${state.requisicaoNumero}` : 'Nº —'
}

function setTipo(tipo) {
  state.tipo = tipo
  document.querySelectorAll('#tipo-tabs .tab').forEach(tab => {
    tab.classList.toggle('tab--active', tab.dataset.tipo === tipo)
  })
  atualizarVisibilidadeBlocos()
  atualizarDisponibilidadeTecnicoTerceirizado()
}

// ─── Técnico Bannerjet / Terceirizado ─────────────────────────────────────────
// Terceirizado só é uma opção válida para Presencial/Laboratório (não faz
// sentido despachar um terceiro pra um chamado Remoto) — por isso o toggle
// se desabilita e volta pra Bannerjet automaticamente quando o tipo muda pra Remoto.

function atualizarDisponibilidadeTecnicoTerceirizado() {
  const disponivel = state.tipo !== 'Remoto'
  const btnTerceirizado = document.querySelector('#tecnico-tipo-tabs [data-tecnico-tipo="terceirizado"]')
  btnTerceirizado.classList.toggle('tab--disabled', !disponivel)
  btnTerceirizado.disabled = !disponivel

  if (!disponivel && state.tecnicoTipo === 'terceirizado') {
    setTecnicoTipo('bannerjet')
    showToast('Técnico terceirizado não está disponível para atendimento Remoto.')
  }
}

function setTecnicoTipoUI(tipo) {
  state.tecnicoTipo = tipo
  document.querySelectorAll('#tecnico-tipo-tabs .tab').forEach(tab => {
    tab.classList.toggle('tab--active', tab.dataset.tecnicoTipo === tipo)
  })
  document.getElementById('input-tecnico').placeholder =
    tipo === 'terceirizado' ? 'Buscar técnico terceirizado...' : 'Buscar técnico Bannerjet...'
}

function setTecnicoTipo(tipo) {
  setTecnicoTipoUI(tipo)
  const input = document.getElementById('input-tecnico')
  input.value = ''
  input.focus()
}

// Compara a cidade do técnico com a do cliente para ordenar por proximidade —
// este protótipo não tem dados geográficos reais (lat/long), então usa
// "mesma cidade" > "mesmo estado" > resto como um proxy de região/distância.
function parseCidadeUf(cidadeStr) {
  const partes = (cidadeStr || '').split(' - ')
  const uf = partes.length > 1 ? partes[partes.length - 1].trim().toUpperCase() : ''
  const cidade = (partes.length > 1 ? partes.slice(0, -1).join(' - ') : (cidadeStr || '')).trim().toLowerCase()
  return { cidade, uf }
}

function prioridadeRegiao(cidadeTecnico, cidadeCliente) {
  const t = parseCidadeUf(cidadeTecnico)
  const c = parseCidadeUf(cidadeCliente)
  if (t.cidade && t.cidade === c.cidade) return 0
  if (t.uf && t.uf === c.uf) return 1
  return 2
}

async function inferirTecnicoTipo(nomeTecnico) {
  if (!nomeTecnico) return 'bannerjet'
  try {
    const terceirizados = await fetchJson('/api/tecnicos-terceirizados')
    const alvo = nomeTecnico.trim().toLowerCase()
    return terceirizados.some(t => t.nome.trim().toLowerCase() === alvo) ? 'terceirizado' : 'bannerjet'
  } catch (e) {
    return 'bannerjet'
  }
}

function setSlaInicial(sla) {
  state.slaInicial = sla
  document.querySelectorAll('#sla-picker .sla-picker__option').forEach(btn => {
    btn.classList.toggle('sla-picker__option--active', btn.dataset.sla === sla)
  })
}

// ─── Vínculo com o atendimento de suporte remoto de origem ────────────────────

function setupAutocompleteVinculo() {
  createAutocomplete({
    inputEl: document.getElementById('input-atendimento-vinculado'),
    dropdownEl: document.getElementById('dropdown-atendimento-vinculado'),
    minChars: 1,
    fetchItems: query => {
      if (!state.cliente) return []
      return fetchJson(`/api/atendimentos?tipo=Remoto&clienteId=${state.cliente.id}&busca=${encodeURIComponent(query)}`)
    },
    renderItem: a => `<div class="autocomplete-item__title">Nº ${a.numero} — ${a.dtEmissao.split('-').reverse().join('/')}</div><div class="autocomplete-item__sub">${a.defeito}</div>`,
    onSelect: atendimento => {
      document.getElementById('input-atendimento-vinculado').value = `Nº ${atendimento.numero} — ${atendimento.defeito}`
      aplicarVinculo(atendimento)
    },
  })
}

async function aplicarVinculo(atendimento) {
  state.atendimentoVinculado = atendimento

  const resumo = `Resumo do Atendimento Remoto nº ${atendimento.numero} (${atendimento.dtEmissao.split('-').reverse().join('/')}) — Técnico: ${atendimento.tecnico}\n` +
    `Defeito relatado: ${atendimento.defeito}` +
    (atendimento.laudoTecnico ? `\nLaudo técnico: ${atendimento.laudoTecnico}` : '')
  document.getElementById('input-defeito').value = resumo

  if (!comboEquipamento.getValor() && !comboModelo.getValor()) {
    await selecionarEquipamentoModeloWms(atendimento.equipamento, atendimento.modelo, atendimento.wms || [])
  }
}

// ─── Anexos (fotos/vídeos) ─────────────────────────────────────────────────────

function renderAnexos() {
  const grid = document.getElementById('anexos-grid')
  grid.innerHTML = state.anexos.map((anexo, i) => {
    const preview = anexo.tipo === 'video'
      ? `<video src="${anexo.url}" muted></video>`
      : `<img src="${anexo.url}" alt="${anexo.nome}" />`
    return `
      <div class="anexo-thumb">
        ${preview}
        <span class="anexo-thumb__name">${anexo.nome}</span>
        <button class="anexo-thumb__remove" data-index="${i}" aria-label="Remover">✕</button>
      </div>
    `
  }).join('')
}

function adicionarArquivos(fileList) {
  Array.from(fileList).forEach(file => {
    const tipo = file.type.startsWith('video') ? 'video' : 'imagem'
    state.anexos.push({ nome: file.name, tipo, url: URL.createObjectURL(file) })
  })
  renderAnexos()
}

function setupDropzone() {
  const dropzone = document.getElementById('dropzone')
  const input = document.getElementById('input-arquivos')

  dropzone.addEventListener('click', () => input.click())
  input.addEventListener('change', () => adicionarArquivos(input.files))

  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dropzone--dragover') })
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dropzone--dragover'))
  dropzone.addEventListener('drop', e => {
    e.preventDefault()
    dropzone.classList.remove('dropzone--dragover')
    adicionarArquivos(e.dataTransfer.files)
  })

  document.getElementById('anexos-grid').addEventListener('click', e => {
    const btn = e.target.closest('.anexo-thumb__remove')
    if (!btn) return
    state.anexos.splice(Number(btn.dataset.index), 1)
    renderAnexos()
  })
}

// ─── Setup dos autocompletes ───────────────────────────────────────────────────

function setupAutocompleteCliente() {
  createAutocomplete({
    inputEl: document.getElementById('input-busca-cliente'),
    dropdownEl: document.getElementById('dropdown-cliente'),
    minChars: 2,
    fetchItems: query => fetchJson(`/api/clientes/busca?q=${encodeURIComponent(query)}`),
    renderItem: c => `<div class="autocomplete-item__title">${c.razaoSocial}</div><div class="autocomplete-item__sub">${c.cnpj}</div>`,
    onSelect: cliente => startAtendimento(cliente),
  })
}

async function setupAutocompleteTecnico() {
  createAutocomplete({
    inputEl: document.getElementById('input-tecnico'),
    dropdownEl: document.getElementById('dropdown-tecnico'),
    minChars: 0,
    fetchItems: async query => {
      if (state.tecnicoTipo === 'terceirizado') {
        const cidadeCliente = state.cliente ? state.cliente.cidade : ''
        const resultados = await fetchJson(`/api/tecnicos-terceirizados?busca=${encodeURIComponent(query)}`)
        return resultados
          .map(t => ({ ...t, tipo: 'terceirizado', prioridade: prioridadeRegiao(t.cidade, cidadeCliente) }))
          .sort((a, b) => a.prioridade - b.prioridade || a.nome.localeCompare(b.nome))
          .slice(0, 10)
      }
      if (!state.tecnicosCache) state.tecnicosCache = await fetchJson('/api/tecnicos')
      return state.tecnicosCache
        .filter(nome => nome.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10)
        .map(nome => ({ nome, tipo: 'bannerjet' }))
    },
    renderItem: item => {
      if (item.tipo === 'terceirizado') {
        const badge = item.prioridade === 0
          ? '<span class="tecnico-regiao-badge tecnico-regiao-badge--cidade">Mesma cidade</span>'
          : item.prioridade === 1
            ? '<span class="tecnico-regiao-badge tecnico-regiao-badge--estado">Mesmo estado</span>'
            : ''
        return `<div class="autocomplete-item__title">${item.nome}${badge}</div><div class="autocomplete-item__sub">${item.empresa || 'Terceirizado'} — ${item.cidade || ''}</div>`
      }
      return `<div class="autocomplete-item__title">${item.nome}</div>`
    },
    onSelect: item => { document.getElementById('input-tecnico').value = item.nome },
  })
}

// ─── Init ────────────────────────────────────────────────────────────────────

function setupTheme() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('at-theme', next)
  })
}

function setupBotoes() {
  document.querySelectorAll('#tipo-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => setTipo(tab.dataset.tipo))
  })
  document.querySelectorAll('#tecnico-tipo-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => { if (!tab.disabled) setTecnicoTipo(tab.dataset.tecnicoTipo) })
  })
  document.querySelectorAll('#sla-picker .sla-picker__option').forEach(btn => {
    btn.addEventListener('click', () => setSlaInicial(btn.dataset.sla))
  })
  document.getElementById('btn-alterar-cliente').addEventListener('click', backToBusca)
  document.getElementById('btn-novo').addEventListener('click', resetForm)
  document.getElementById('btn-imprimir').addEventListener('click', () => {
    if (!state.cliente || !state.numero) { showToast('Selecione um cliente antes de imprimir'); return }
    const payload = {
      empresa: EMPRESA,
      numero: state.numero,
      dataHoraCriacao: state.dataHoraCriacao.toISOString(),
      cliente: state.cliente,
      tipo: state.tipo,
      ida: document.getElementById('input-ida').value,
      volta: document.getElementById('input-volta').value,
      tecnico: document.getElementById('input-tecnico').value || USUARIO_LOGADO,
      equipamento: comboEquipamento.getValor(),
      marca: comboModelo.getValor().split(' ')[0] || '',
      modelo: comboModelo.getValor().split(' ').slice(1).join(' ') || '0',
      defeito: document.getElementById('input-defeito').value,
      laudoTecnico: document.getElementById('input-laudo').value,
      requisicao: state.tipo === 'Laboratório' ? state.requisicaoNumero : null,
      atendimentoOrigem: state.atendimentoVinculado ? {
        numero: state.atendimentoVinculado.numero,
        tecnico: state.atendimentoVinculado.tecnico,
      } : null,
    }
    sessionStorage.setItem('atendimento-impressao', JSON.stringify(payload))
    window.open('imprimir.html', '_blank')
  })
  document.getElementById('btn-wiki').addEventListener('click', () => showToast('Enviar para JET-IA — ação de protótipo'))
  document.getElementById('btn-timeline').addEventListener('click', () => showToast('Timeline — ação de protótipo'))
  document.getElementById('btn-laudo').addEventListener('click', () => document.getElementById('input-laudo').focus())

  document.getElementById('btn-salvar').addEventListener('click', async () => {
    if (!state.cliente || !state.numero) { showToast('Selecione um cliente antes de salvar'); return }

    if (state.tipo === 'Laboratório' && !state.modoEdicao) {
      await salvarAtendimentoLaboratorio()
      return
    }

    const payload = {
      cliente: state.cliente.nomeFantasia,
      clienteId: state.cliente.id,
      tipo: state.tipo,
      ida: document.getElementById('input-ida').value,
      volta: document.getElementById('input-volta').value,
      tecnico: document.getElementById('input-tecnico').value,
      equipamento: comboEquipamento.getValor(),
      modelo: comboModelo.getValor(),
      wms: [
        valorWmsSelecionado(document.getElementById('select-wms-1')),
        valorWmsSelecionado(document.getElementById('select-wms-2')),
      ].filter(Boolean),
      defeito: document.getElementById('input-defeito').value,
      laudoTecnico: document.getElementById('input-laudo').value,
    }

    try {
      const atendimento = await fetch(
        state.modoEdicao ? `/api/atendimentos/${state.atendimentoId}` : '/api/atendimentos',
        {
          method: state.modoEdicao ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      ).then(r => r.json())

      state.modoEdicao = true
      state.atendimentoId = atendimento.id
      state.numero = atendimento.numero
      document.getElementById('numero-atendimento').textContent = state.numero
      showToast(`Atendimento nº ${atendimento.numero} salvo.`)
    } catch (err) {
      showToast('Não foi possível salvar o atendimento.')
    }
  })
}

function valorWmsSelecionado(select) {
  return select.value || null
}

// Diferente do restante do protótipo (Salvar apenas loga e mostra um toast),
// o Atendimento Laboratório precisa aparecer de verdade no quadro Kanban —
// por isso aqui existe uma gravação real: cria o atendimento e, a partir dele,
// o cartão na coluna Entrada do Laboratório (ver src/routes/api.routes.js).
async function salvarAtendimentoLaboratorio() {
  const wms = [
    valorWmsSelecionado(document.getElementById('select-wms-1')),
    valorWmsSelecionado(document.getElementById('select-wms-2')),
  ].filter(Boolean)

  const tecnico = document.getElementById('input-tecnico').value
  const equipamento = comboEquipamento.getValor()
  const modelo = comboModelo.getValor()
  const defeito = document.getElementById('input-defeito').value
  const requisicao = state.requisicaoNumero || ''
  const origemId = state.atendimentoVinculado ? state.atendimentoVinculado.id : null

  try {
    const atendimentoCriado = await fetch('/api/atendimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: state.cliente.nomeFantasia,
        clienteId: state.cliente.id,
        tipo: state.tipo,
        ida: document.getElementById('input-ida').value,
        volta: document.getElementById('input-volta').value,
        tecnico, equipamento, modelo, wms, defeito, requisicao,
        atendimentoOrigemId: origemId,
      }),
    }).then(r => r.json())

    await fetch('/api/laboratorio/de-atendimento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: state.cliente.nomeFantasia,
        tecnico, equipamento, modelo, wms, defeito, requisicao,
        slaInicial: state.slaInicial,
        atendimentoNumero: atendimentoCriado.numero,
        atendimentoOrigemId: origemId,
        atendimentoOrigemNumero: state.atendimentoVinculado ? state.atendimentoVinculado.numero : null,
        atendimentoOrigemResumo: state.atendimentoVinculado ? state.atendimentoVinculado.defeito : '',
      }),
    })

    state.modoEdicao = true
    state.atendimentoId = atendimentoCriado.id
    state.numero = atendimentoCriado.numero
    document.getElementById('numero-atendimento').textContent = state.numero
    atualizarVisibilidadeBlocos()
    showToast(`Atendimento nº ${atendimentoCriado.numero} salvo e cartão criado no quadro Laboratório (Entrada).`)
  } catch (err) {
    showToast('Não foi possível salvar o atendimento de laboratório.')
  }
}

async function init() {
  document.getElementById('usuario-logado-nome').textContent = USUARIO_LOGADO
  document.getElementById('usuario-logado-nome-2').textContent = USUARIO_LOGADO
  document.getElementById('input-data-emissao').value = new Date().toISOString().split('T')[0]

  setupTheme()
  setupBotoes()
  setupDropzone()
  setupAutocompleteCliente()
  setupAutocompleteTecnico()
  await setupCombosEquipamentoModelo()
  setupAutocompleteVinculo()

  const params = new URLSearchParams(location.search)
  const editId = params.get('id')

  if (editId) {
    abrirEmModoEdicao(editId)
  } else {
    const TIPOS_VALIDOS = ['Remoto', 'Presencial', 'Laboratório']
    const tipoParam = params.get('tipo')
    setTipo(TIPOS_VALIDOS.includes(tipoParam) ? tipoParam : 'Remoto')
  }
}

document.addEventListener('DOMContentLoaded', init)

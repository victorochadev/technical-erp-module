const USUARIO_LOGADO = 'Victor Gabriel Amadeu Rocha'

// Dados fixos do timbrado — em produção viriam do cadastro da empresa/filial no ERP.
const EMPRESA = {
  nome: 'BANNERJET IMP EXP E COM DE MAQ EQUIP PARA COM VISUAL LTDA',
  endereco: 'Avenida José Munia, 5535, Jardim Redentor - Andar 2 Conj. 205 Sala 5',
  cidadeEstado: '15090-185 São José do Rio Preto - SP',
  cnpj: '06276736000173',
  ie: '647444053113',
  fones: '(17) 99741-9548, (17) 3235-1836',
  site: 'https://bannerjet.com.br',
  email: 'bm1@bm1.com.br',
}

const state = {
  cliente: null,
  numero: null,
  tipo: 'Remoto',
  anexos: [],
  tecnicosCache: null,
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
  document.getElementById('input-equipamento').value = atendimento.equipamento || ''
  document.getElementById('input-modelo').value = atendimento.modelo || ''
  preencherWms(atendimento.wms || [])
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
  state.tipo = 'Remoto'
  state.anexos = []
  state.modoEdicao = false
  state.atendimentoVinculado = null
  state.requisicaoNumero = null
  document.getElementById('input-tecnico').value = ''
  document.getElementById('input-equipamento').value = ''
  document.getElementById('input-modelo').value = ''
  document.getElementById('input-defeito').value = ''
  document.getElementById('input-laudo').value = ''
  document.getElementById('input-atendimento-vinculado').value = ''
  document.getElementById('select-wms-1').innerHTML = '<option>Selecione um modelo primeiro</option>'
  document.getElementById('select-wms-2').innerHTML = '<option>Selecione um modelo primeiro</option>'
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

function aplicarVinculo(atendimento) {
  state.atendimentoVinculado = atendimento

  const resumo = `Resumo do Atendimento Remoto nº ${atendimento.numero} (${atendimento.dtEmissao.split('-').reverse().join('/')}) — Técnico: ${atendimento.tecnico}\n` +
    `Defeito relatado: ${atendimento.defeito}` +
    (atendimento.laudoTecnico ? `\nLaudo técnico: ${atendimento.laudoTecnico}` : '')
  document.getElementById('input-defeito').value = resumo

  const equipamentoInput = document.getElementById('input-equipamento')
  const modeloInput = document.getElementById('input-modelo')
  if (!equipamentoInput.value) equipamentoInput.value = atendimento.equipamento || ''
  if (!modeloInput.value) modeloInput.value = atendimento.modelo || ''
  if (atendimento.wms && atendimento.wms.length) preencherWms(atendimento.wms)
}

// ─── WMS ligado ao modelo selecionado ─────────────────────────────────────────

function preencherWms(wmsList) {
  const options = wmsList.map(w => `<option>${w}</option>`).join('')
  document.getElementById('select-wms-1').innerHTML = options
  document.getElementById('select-wms-2').innerHTML = options
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
    minChars: 1,
    fetchItems: async query => {
      if (!state.tecnicosCache) state.tecnicosCache = await fetchJson('/api/tecnicos')
      return state.tecnicosCache.filter(t => t.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    },
    renderItem: nome => `<div class="autocomplete-item__title">${nome}</div>`,
    onSelect: nome => { document.getElementById('input-tecnico').value = nome },
  })
}

function setupAutocompleteEquipamento() {
  createAutocomplete({
    inputEl: document.getElementById('input-equipamento'),
    dropdownEl: document.getElementById('dropdown-equipamento'),
    minChars: 1,
    fetchItems: query => fetchJson(`/api/catalogo/equipamentos?q=${encodeURIComponent(query)}`),
    renderItem: nome => `<div class="autocomplete-item__title">${nome}</div>`,
    onSelect: nome => { document.getElementById('input-equipamento').value = nome },
  })
}

function setupAutocompleteModelo() {
  createAutocomplete({
    inputEl: document.getElementById('input-modelo'),
    dropdownEl: document.getElementById('dropdown-modelo'),
    minChars: 1,
    fetchItems: query => fetchJson(`/api/catalogo/modelos?q=${encodeURIComponent(query)}`),
    renderItem: m => `<div class="autocomplete-item__title">${m.modelo}</div><div class="autocomplete-item__sub">${m.equipamento}</div>`,
    onSelect: m => {
      document.getElementById('input-modelo').value = m.modelo
      const equipamentoInput = document.getElementById('input-equipamento')
      if (!equipamentoInput.value) equipamentoInput.value = m.equipamento
      preencherWms(m.wms)
    },
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
      equipamento: document.getElementById('input-equipamento').value,
      marca: document.getElementById('input-modelo').value.split(' ')[0] || '',
      modelo: document.getElementById('input-modelo').value.split(' ').slice(1).join(' ') || '0',
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
  document.getElementById('btn-wiki').addEventListener('click', () => showToast('Enviar para Wiki — ação de protótipo'))
  document.getElementById('btn-timeline').addEventListener('click', () => showToast('Timeline — ação de protótipo'))
  document.getElementById('btn-laudo').addEventListener('click', () => document.getElementById('input-laudo').focus())

  document.getElementById('btn-salvar').addEventListener('click', async () => {
    if (!state.cliente || !state.numero) { showToast('Selecione um cliente antes de salvar'); return }

    if (state.tipo === 'Laboratório' && !state.modoEdicao) {
      await salvarAtendimentoLaboratorio()
      return
    }

    const payload = {
      numero: state.numero,
      cliente: state.cliente,
      tipo: state.tipo,
      ida: document.getElementById('input-ida').value,
      volta: document.getElementById('input-volta').value,
      tecnico: document.getElementById('input-tecnico').value,
      equipamento: document.getElementById('input-equipamento').value,
      modelo: document.getElementById('input-modelo').value,
      wms1: document.getElementById('select-wms-1').value,
      wms2: document.getElementById('select-wms-2').value,
      defeito: document.getElementById('input-defeito').value,
      laudoTecnico: document.getElementById('input-laudo').value,
      anexos: state.anexos.map(a => a.nome),
    }
    console.log('Payload do atendimento (protótipo):', payload)
    showToast(`Atendimento nº ${state.numero} salvo (protótipo)`)
  })
}

function valorWmsSelecionado(select) {
  const v = select.value
  return v && v !== 'Selecione um modelo primeiro' ? v : null
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
  const equipamento = document.getElementById('input-equipamento').value
  const modelo = document.getElementById('input-modelo').value
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
    state.numero = atendimentoCriado.numero
    document.getElementById('numero-atendimento').textContent = state.numero
    atualizarVisibilidadeBlocos()
    showToast(`Atendimento nº ${atendimentoCriado.numero} salvo e cartão criado no quadro Laboratório (Entrada).`)
  } catch (err) {
    showToast('Não foi possível salvar o atendimento de laboratório.')
  }
}

function init() {
  document.getElementById('usuario-logado-nome').textContent = USUARIO_LOGADO
  document.getElementById('usuario-logado-nome-2').textContent = USUARIO_LOGADO
  document.getElementById('input-data-emissao').value = new Date().toISOString().split('T')[0]

  setupTheme()
  setupBotoes()
  setupDropzone()
  setupAutocompleteCliente()
  setupAutocompleteTecnico()
  setupAutocompleteEquipamento()
  setupAutocompleteModelo()
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

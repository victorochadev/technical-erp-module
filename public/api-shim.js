// Faz o front-end estático (GitHub Pages, sem back-end) falar direto com o
// Supabase, em vez do servidor Express local. Intercepta só chamadas
// fetch('/api/...') e reimplementa a mesma lógica de src/data/*Repository.js
// + src/routes/api.routes.js do lado do navegador, usando o mesmo client
// supabase-js (via CDN) tanto localmente (`npm start`) quanto no GitHub Pages.
;(function () {
  const originalFetch = window.fetch.bind(window)

  function sb() {
    return window.supabaseClient
  }

  // ───────────────────────── clientes ─────────────────────────

  function mapCliente(row) {
    return {
      id: row.id,
      razaoSocial: row.razao_social,
      nomeFantasia: row.nome_fantasia,
      cnpj: row.cnpj,
      ie: row.ie,
      endereco: row.endereco,
      cep: row.cep,
      bairro: row.bairro,
      cidade: row.cidade,
      complemento: row.complemento,
      contato: row.contato,
      telefone: row.telefone,
      celular: row.celular,
      email: row.email,
      site: row.site,
    }
  }

  async function fetchTodosClientes() {
    const { data, error } = await sb().from('clientes').select('*')
    if (error) throw error
    return data.map(mapCliente)
  }

  async function buscarClientesPorNome(query) {
    if (!query || query.trim().length < 2) return []
    const alvo = query.toLowerCase()
    const clientes = await fetchTodosClientes()
    return clientes
      .filter(c => c.razaoSocial.toLowerCase().includes(alvo) || c.nomeFantasia.toLowerCase().includes(alvo) || c.cnpj.includes(alvo))
      .slice(0, 15)
  }

  async function buscarClientePorId(id) {
    const { data, error } = await sb().from('clientes').select('*').eq('id', Number(id)).maybeSingle()
    if (error) throw error
    return data ? mapCliente(data) : null
  }

  async function listClientes({ busca } = {}) {
    const clientes = await fetchTodosClientes()
    return clientes.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia)).filter(c => {
      if (!busca) return true
      const alvo = busca.toLowerCase()
      return `${c.razaoSocial} ${c.nomeFantasia} ${c.cnpj} ${c.cidade}`.toLowerCase().includes(alvo)
    })
  }

  async function criarCliente(dados) {
    const { data, error } = await sb()
      .from('clientes')
      .insert({
        razao_social: dados.razaoSocial || '',
        nome_fantasia: dados.nomeFantasia || dados.razaoSocial || '',
        cnpj: dados.cnpj || '',
        ie: dados.ie || '',
        endereco: dados.endereco || '',
        cep: dados.cep || '',
        bairro: dados.bairro || '',
        cidade: dados.cidade || '',
        complemento: dados.complemento || '',
        contato: dados.contato || '',
        telefone: dados.telefone || '',
        celular: dados.celular || '',
        email: dados.email || '',
        site: dados.site || '',
      })
      .select()
      .single()
    if (error) throw error
    return mapCliente(data)
  }

  async function atualizarCliente(id, dados) {
    const { data, error } = await sb()
      .from('clientes')
      .update({
        razao_social: dados.razaoSocial || '',
        nome_fantasia: dados.nomeFantasia || dados.razaoSocial || '',
        cnpj: dados.cnpj || '',
        ie: dados.ie || '',
        endereco: dados.endereco || '',
        cep: dados.cep || '',
        bairro: dados.bairro || '',
        cidade: dados.cidade || '',
        complemento: dados.complemento || '',
        contato: dados.contato || '',
        telefone: dados.telefone || '',
        celular: dados.celular || '',
        email: dados.email || '',
        site: dados.site || '',
      })
      .eq('id', Number(id))
      .select()
      .maybeSingle()
    if (error) throw error
    return data ? mapCliente(data) : null
  }

  async function excluirCliente(id) {
    const { data, error } = await sb()
      .from('clientes')
      .delete()
      .eq('id', Number(id))
      .select('id')
      .maybeSingle()
    if (error) throw error
    return Boolean(data)
  }

  // ───────────────────────── técnicos ─────────────────────────

  async function listTecnicosInternos() {
    const { data, error } = await sb().from('tecnicos').select('nome').order('nome')
    if (error) throw error
    return data.map(r => r.nome)
  }

  function mapTecnicoTerceirizado(row) {
    return { id: row.id, nome: row.nome, empresa: row.empresa, especialidade: row.especialidade, telefone: row.telefone, email: row.email, cidade: row.cidade }
  }

  async function listTecnicosTerceirizados({ busca } = {}) {
    const { data, error } = await sb().from('tecnicos_terceirizados').select('*').order('nome')
    if (error) throw error
    const tecnicos = data.map(mapTecnicoTerceirizado)
    if (!busca) return tecnicos
    const alvo = busca.toLowerCase()
    return tecnicos.filter(t => `${t.nome} ${t.empresa} ${t.especialidade} ${t.cidade}`.toLowerCase().includes(alvo))
  }

  async function buscarTecnicoTerceirizadoPorId(id) {
    const { data, error } = await sb().from('tecnicos_terceirizados').select('*').eq('id', Number(id)).maybeSingle()
    if (error) throw error
    return data ? mapTecnicoTerceirizado(data) : null
  }

  async function criarTecnicoTerceirizado(dados) {
    const { data, error } = await sb()
      .from('tecnicos_terceirizados')
      .insert({
        nome: dados.nome || '',
        empresa: dados.empresa || '',
        especialidade: dados.especialidade || '',
        telefone: dados.telefone || '',
        email: dados.email || '',
        cidade: dados.cidade || '',
      })
      .select()
      .single()
    if (error) throw error
    return mapTecnicoTerceirizado(data)
  }

  async function atualizarTecnicoTerceirizado(id, dados) {
    const { data, error } = await sb()
      .from('tecnicos_terceirizados')
      .update({
        nome: dados.nome || '',
        empresa: dados.empresa || '',
        especialidade: dados.especialidade || '',
        telefone: dados.telefone || '',
        email: dados.email || '',
        cidade: dados.cidade || '',
      })
      .eq('id', Number(id))
      .select()
      .maybeSingle()
    if (error) throw error
    return data ? mapTecnicoTerceirizado(data) : null
  }

  // ───────────────────────── catálogo ─────────────────────────

  async function buscarEquipamentos(query) {
    if (!query || query.trim().length < 1) return []
    const { data, error } = await sb().from('catalogo_equipamentos').select('nome').ilike('nome', `%${query}%`).limit(10)
    if (error) throw error
    return data.map(r => r.nome)
  }

  async function buscarModelos(query) {
    if (!query || query.trim().length < 1) return []
    const { data, error } = await sb()
      .from('catalogo_modelos')
      .select('nome, catalogo_equipamentos(nome), catalogo_wms(descricao)')
      .ilike('nome', `%${query}%`)
      .limit(10)
    if (error) throw error
    return data.map(m => ({ equipamento: m.catalogo_equipamentos.nome, modelo: m.nome, wms: m.catalogo_wms.map(w => w.descricao) }))
  }

  async function listCatalogoCompleto() {
    const { data, error } = await sb().from('catalogo_equipamentos').select('nome, catalogo_modelos(nome, catalogo_wms(descricao))')
    if (error) throw error
    return data.map(eq => ({
      equipamento: eq.nome,
      modelos: eq.catalogo_modelos.map(m => ({ modelo: m.nome, wms: m.catalogo_wms.map(w => w.descricao) })),
    }))
  }

  // ───────────────────────── atendimentos ─────────────────────────

  function mapAtendimento(row) {
    return {
      id: row.id,
      numero: row.numero,
      dtEmissao: row.dt_emissao,
      clienteId: row.cliente_id,
      cliente: row.cliente_nome,
      defeito: row.defeito || '',
      laudoTecnico: row.laudo_tecnico || '',
      tecnico: row.tecnico_nome || '',
      equipamento: row.equipamento || '',
      modelo: row.modelo || '',
      wms: row.wms || [],
      ida: row.ida ? row.ida.slice(0, 16) : '',
      volta: row.volta ? row.volta.slice(0, 16) : '',
      tipo: row.tipo,
      status: row.status,
      requisicao: row.requisicao || '',
      atendimentoOrigemId: row.atendimento_origem_id,
    }
  }

  async function listAtendimentos({ mes, tecnico, tipo, status, busca, clienteId } = {}) {
    let query = sb().from('atendimentos').select('*')
    if (mes) {
      const mesNum = Number(mes.split('-')[1])
      const anoNum = Number(mes.split('-')[0])
      const inicio = `${mes}-01`
      const fim = new Date(anoNum, mesNum, 1).toISOString().slice(0, 10)
      query = query.gte('dt_emissao', inicio).lt('dt_emissao', fim)
    }
    if (tecnico) query = query.eq('tecnico_nome', tecnico)
    if (tipo) query = query.eq('tipo', tipo)
    if (status) query = query.eq('status', status)
    if (clienteId) query = query.eq('cliente_id', Number(clienteId))

    const { data, error } = await query
    if (error) throw error
    let atendimentos = data.map(mapAtendimento)

    if (busca) {
      const alvo = busca.toLowerCase()
      atendimentos = atendimentos.filter(a => `${a.numero} ${a.cliente} ${a.defeito} ${a.tecnico}`.toLowerCase().includes(alvo))
    }
    return atendimentos
  }

  async function proximoNumeroAtendimento() {
    const { data, error } = await sb().from('atendimentos').select('numero')
    if (error) throw error
    return data.reduce((max, r) => Math.max(max, Number(r.numero) || 0), 0) + 1
  }

  async function criarAtendimento(dados) {
    const numero = String(await proximoNumeroAtendimento())
    const { data, error } = await sb()
      .from('atendimentos')
      .insert({
        numero,
        dt_emissao: dados.dtEmissao || new Date().toISOString().slice(0, 10),
        cliente_id: dados.clienteId || null,
        cliente_nome: dados.cliente || '',
        defeito: dados.defeito || '',
        laudo_tecnico: dados.laudoTecnico || '',
        tecnico_nome: dados.tecnico || '',
        equipamento: dados.equipamento || '',
        modelo: dados.modelo || '',
        wms: dados.wms || [],
        ida: dados.ida || null,
        volta: dados.volta || null,
        tipo: dados.tipo,
        status: dados.status || 'Em Atendimento',
        requisicao: dados.requisicao || '',
        atendimento_origem_id: dados.atendimentoOrigemId || null,
      })
      .select()
      .single()
    if (error) throw error
    return mapAtendimento(data)
  }

  async function listMesesDisponiveis() {
    const { data, error } = await sb().from('atendimentos').select('dt_emissao')
    if (error) throw error
    return [...new Set(data.map(r => r.dt_emissao.slice(0, 7)))].sort().reverse()
  }

  async function buscarAtendimentoPorId(id) {
    const { data, error } = await sb().from('atendimentos').select('*').eq('id', Number(id)).maybeSingle()
    if (error) throw error
    return data ? mapAtendimento(data) : null
  }

  // ───────────────────────── dashboard ─────────────────────────

  function pct(n, total) {
    return total === 0 ? 0 : Math.round((n / total) * 1000) / 10
  }

  // Nota fictícia e estável por técnico (sem cadastro de avaliação real ainda) —
  // apenas para preencher o visual de "Desempenho por Técnico" no dashboard.
  function notaFicticia(nome) {
    let hash = 0
    for (let i = 0; i < nome.length; i++) hash = (hash * 31 + nome.charCodeAt(i)) % 1000
    return Math.round((2 + (hash / 1000) * 3) * 10) / 10
  }

  async function getResumoMensal(mes) {
    const atendimentos = await listAtendimentos({ mes })
    const total = atendimentos.length
    const remoto = atendimentos.filter(a => a.tipo === 'Remoto').length
    const presencial = atendimentos.filter(a => a.tipo === 'Presencial').length
    const laboratorio = atendimentos.filter(a => a.tipo === 'Laboratório').length
    const concluido = atendimentos.filter(a => a.status === 'Concluido').length
    const cancelado = atendimentos.filter(a => a.status === 'Cancelado').length
    const emAtendimento = atendimentos.filter(a => a.status === 'Em Atendimento').length

    return {
      mes,
      total,
      porTipo: {
        remoto: { total: remoto, percentual: pct(remoto, total) },
        presencial: { total: presencial, percentual: pct(presencial, total) },
        laboratorio: { total: laboratorio, percentual: pct(laboratorio, total) },
      },
      porStatus: {
        concluido: { total: concluido, percentual: pct(concluido, total) },
        cancelado: { total: cancelado, percentual: pct(cancelado, total) },
        emAtendimento: { total: emAtendimento, percentual: pct(emAtendimento, total) },
      },
    }
  }

  async function getRankingPorTecnico(mes) {
    const atendimentos = await listAtendimentos({ mes })
    const porTecnico = new Map()
    for (const a of atendimentos) {
      if (!porTecnico.has(a.tecnico)) {
        porTecnico.set(a.tecnico, { tecnico: a.tecnico, nota: notaFicticia(a.tecnico), total: 0, remoto: 0, presencial: 0, laboratorio: 0, concluido: 0, cancelado: 0, emAtendimento: 0 })
      }
      const linha = porTecnico.get(a.tecnico)
      linha.total += 1
      if (a.tipo === 'Remoto') linha.remoto += 1
      if (a.tipo === 'Presencial') linha.presencial += 1
      if (a.tipo === 'Laboratório') linha.laboratorio += 1
      if (a.status === 'Concluido') linha.concluido += 1
      if (a.status === 'Cancelado') linha.cancelado += 1
      if (a.status === 'Em Atendimento') linha.emAtendimento += 1
    }
    return [...porTecnico.values()].sort((a, b) => b.total - a.total)
  }

  // ───────────────────────── instalações ─────────────────────────

  function mapInstalacao(row) {
    return {
      id: row.pedido_compra,
      pedidoCompra: row.pedido_compra,
      pedidoDespesas: row.pedido_despesas,
      cliente: row.cliente,
      tecnico: row.tecnico_nome,
      statusCliente: row.status_cliente,
      statusTecnico: row.status_tecnico,
      transportadora: row.transportadora,
      produtos: row.produtos || [],
      custos: row.custos || [],
      checklist: row.checklist || [],
    }
  }

  async function listInstalacoes({ busca } = {}) {
    const { data, error } = await sb().from('instalacoes').select('*').order('pedido_compra', { ascending: false })
    if (error) throw error
    const instalacoes = data.map(mapInstalacao)
    if (!busca) return instalacoes
    const alvo = busca.toLowerCase()
    return instalacoes.filter(i =>
      String(i.pedidoCompra).includes(alvo) ||
      String(i.pedidoDespesas || '').includes(alvo) ||
      i.cliente.razaoSocial.toLowerCase().includes(alvo) ||
      (i.tecnico || '').toLowerCase().includes(alvo)
    )
  }

  async function buscarInstalacaoPorId(id) {
    const { data, error } = await sb().from('instalacoes').select('*').eq('pedido_compra', Number(id)).maybeSingle()
    if (error) throw error
    return data ? mapInstalacao(data) : null
  }

  // ───────────────────────── laboratório ─────────────────────────

  const USUARIO_LOGADO = 'Claudio Code Dev'
  const PRAZO_DIAS_UTEIS = 10
  const SLA_DIAS_UTEIS_ALERTA = 2
  const COLUNAS_RESOLVIDAS = ['finalizado', 'aguardando-coleta', 'coletado']
  const SLA_CORES = { padrao: '#22c55e', importante: '#f59e0b', urgente: '#ef4444' }
  const DEFEITOS_POOL_LAB = [
    'Cliente alega desalinhamento.', 'Não liga.', 'Corte impreciso, perdendo tensão da lâmina.',
    'Erro de comunicação com o computador.', 'Cabeça de impressão entupida.', 'Ruído anormal durante o corte.',
    'Trava no meio do trabalho.', 'Desalinhamento de cor na impressão.', 'Correia de arraste solta.',
    'Software não reconhece o equipamento.',
  ]

  function addDiasLab(data, dias) {
    const d = new Date(data)
    d.setDate(d.getDate() + dias)
    return d
  }

  function addDiasUteisLab(data, dias) {
    const d = new Date(data)
    let restante = dias
    while (restante > 0) {
      d.setDate(d.getDate() + 1)
      const diaSemana = d.getDay()
      if (diaSemana !== 0 && diaSemana !== 6) restante--
    }
    return d
  }

  function diasUteisEntreLab(inicio, fim) {
    const sinal = fim < inicio ? -1 : 1
    let [cursor, alvo] = sinal === 1 ? [inicio, fim] : [fim, inicio]
    cursor = new Date(cursor)
    let contagem = 0
    while (cursor < alvo) {
      cursor.setDate(cursor.getDate() + 1)
      const diaSemana = cursor.getDay()
      if (diaSemana !== 0 && diaSemana !== 6) contagem++
    }
    return contagem * sinal
  }

  function formatDiaMesLab(data) {
    const meses = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
    return `${data.getDate()} de ${meses[data.getMonth()]}`
  }

  function formatDataHoraLab(data) {
    const hh = String(data.getHours()).padStart(2, '0')
    const mm = String(data.getMinutes()).padStart(2, '0')
    return `${formatDiaMesLab(data)} de ${data.getFullYear()}, ${hh}:${mm}`
  }

  function toIsoLab(data) {
    return data.toISOString().slice(0, 10)
  }

  function randLab(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function pickLab(arr) {
    return arr[randLab(0, arr.length - 1)]
  }

  function iniciaisLab(nome) {
    return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
  }

  function nomeColunaLab(colunas, id) {
    return (colunas.find(c => c.id === id) || {}).nome || id
  }

  function gerarWmsLab() {
    return String(randLab(700000000, 799999999))
  }

  function calcularSlaLab(dataVencimentoIso, coluna) {
    if (COLUNAS_RESOLVIDAS.includes(coluna)) return 'padrao'
    const vencimento = new Date(dataVencimentoIso + 'T00:00:00')
    const diasUteisRestantes = diasUteisEntreLab(new Date(), vencimento)
    if (diasUteisRestantes < 0) return 'urgente'
    if (diasUteisRestantes <= SLA_DIAS_UTEIS_ALERTA) return 'importante'
    return 'padrao'
  }

  function mapColunaLab(row) {
    return { id: row.id, nome: row.nome, cor: row.cor }
  }

  function mapCardLab(row) {
    return {
      id: row.id,
      numero: row.numero,
      cliente: row.cliente,
      coluna: row.coluna_id,
      dataChegada: row.data_chegada,
      dataVencimento: row.data_vencimento,
      anexos: row.anexos,
      tecnico: row.tecnico_nome,
      equipamento: row.equipamento || '',
      modelo: row.modelo || '',
      wms: row.wms || '',
      defeito: row.defeito || '',
      requisicao: row.requisicao || '',
      laudoTecnico: row.laudo_tecnico || '',
      dataManutencaoFin: row.data_manutencao_fin || '',
      dataSaida: row.data_saida || '',
      drive: row.drive || '',
      atendimentoOrigem: row.atendimento_origem_id ? { id: row.atendimento_origem_id } : null,
      timeline: row.timeline || [],
    }
  }

  function serializarCardLab(colunas, c) {
    const sla = calcularSlaLab(c.dataVencimento, c.coluna)
    return {
      ...c,
      dataChegadaLabel: formatDiaMesLab(new Date(c.dataChegada + 'T00:00:00')),
      dataVencimentoLabel: formatDiaMesLab(new Date(c.dataVencimento + 'T00:00:00')),
      sla,
      slaCor: SLA_CORES[sla],
      tecnicoIniciais: c.tecnico ? iniciaisLab(c.tecnico) : null,
      colunaCor: (colunas.find(col => col.id === c.coluna) || {}).cor,
      colunaNome: nomeColunaLab(colunas, c.coluna),
      comentarios: c.timeline.filter(t => t.tipo === 'comentario').length,
      timeline: c.timeline.map(t => ({ ...t, dataLabel: formatDataHoraLab(new Date(t.data)) })).reverse(),
    }
  }

  async function fetchColunasLab() {
    const { data, error } = await sb().from('laboratorio_colunas').select('*').order('ordem')
    if (error) throw error
    return data.map(mapColunaLab)
  }

  async function listQuadro() {
    const colunas = await fetchColunasLab()
    const { data, error } = await sb().from('laboratorio_cards').select('*').order('id')
    if (error) throw error
    return { colunas, cards: data.map(mapCardLab).map(c => serializarCardLab(colunas, c)) }
  }

  async function moverCard(id, novaColuna) {
    const colunas = await fetchColunasLab()
    if (!colunas.some(col => col.id === novaColuna)) return null

    const { data: row, error } = await sb().from('laboratorio_cards').select('*').eq('id', Number(id)).maybeSingle()
    if (error) throw error
    if (!row) return null

    const card = mapCardLab(row)
    let timeline = card.timeline
    if (card.coluna !== novaColuna) {
      timeline = [...timeline, {
        tipo: 'sistema', autor: USUARIO_LOGADO,
        texto: `moveu este cartão de ${nomeColunaLab(colunas, card.coluna)} para ${nomeColunaLab(colunas, novaColuna)}`,
        data: new Date().toISOString(),
      }]
    }

    const { data: atualizado, error: e2 } = await sb().from('laboratorio_cards').update({ coluna_id: novaColuna, timeline }).eq('id', Number(id)).select().single()
    if (e2) throw e2
    return serializarCardLab(colunas, mapCardLab(atualizado))
  }

  async function criarCard({ cliente, coluna }) {
    const colunas = await fetchColunasLab()
    if (!colunas.some(col => col.id === coluna)) return null

    const catalogo = await listCatalogoCompleto()
    const grupo = pickLab(catalogo)
    const modeloInfo = pickLab(grupo.modelos)
    const hoje = new Date()

    const { data, error } = await sb()
      .from('laboratorio_cards')
      .insert({
        numero: randLab(19000, 21000),
        cliente,
        coluna_id: coluna,
        data_chegada: toIsoLab(hoje),
        data_vencimento: toIsoLab(addDiasUteisLab(hoje, PRAZO_DIAS_UTEIS)),
        anexos: 0,
        tecnico_nome: null,
        equipamento: grupo.equipamento,
        modelo: modeloInfo.modelo,
        wms: modeloInfo.wms[0] || gerarWmsLab(),
        defeito: pickLab(DEFEITOS_POOL_LAB),
        requisicao: '',
        laudo_tecnico: '',
        timeline: [{ tipo: 'sistema', autor: USUARIO_LOGADO, texto: `adicionou este cartão a ${nomeColunaLab(colunas, coluna)}`, data: new Date().toISOString() }],
      })
      .select()
      .single()
    if (error) throw error
    return serializarCardLab(colunas, mapCardLab(data))
  }

  async function criarCardDeAtendimento(dados) {
    const colunas = await fetchColunasLab()
    const coluna = 'entrada'
    const hoje = new Date()
    let dataVencimento
    if (dados.slaInicial === 'urgente') dataVencimento = addDiasLab(hoje, -1)
    else if (dados.slaInicial === 'importante') dataVencimento = addDiasUteisLab(hoje, SLA_DIAS_UTEIS_ALERTA)
    else dataVencimento = addDiasUteisLab(hoje, PRAZO_DIAS_UTEIS)

    const wmsArray = Array.isArray(dados.wms) ? dados.wms : (dados.wms ? [dados.wms] : [])

    const { data, error } = await sb()
      .from('laboratorio_cards')
      .insert({
        numero: dados.atendimentoNumero ? Number(dados.atendimentoNumero) : randLab(19000, 21000),
        cliente: dados.cliente,
        coluna_id: coluna,
        data_chegada: toIsoLab(hoje),
        data_vencimento: toIsoLab(dataVencimento),
        anexos: 0,
        tecnico_nome: dados.tecnico || null,
        equipamento: dados.equipamento || '',
        modelo: dados.modelo || '',
        wms: wmsArray[0] || '',
        defeito: dados.defeito || '',
        requisicao: dados.requisicao || '',
        laudo_tecnico: '',
        atendimento_origem_id: dados.atendimentoOrigemId || null,
        timeline: [{
          tipo: 'sistema', autor: USUARIO_LOGADO,
          texto: dados.atendimentoNumero
            ? `adicionou este cartão a ${nomeColunaLab(colunas, coluna)} (a partir do Atendimento nº ${dados.atendimentoNumero})`
            : `adicionou este cartão a ${nomeColunaLab(colunas, coluna)}`,
          data: new Date().toISOString(),
        }],
      })
      .select()
      .single()
    if (error) throw error
    return serializarCardLab(colunas, mapCardLab(data))
  }

  async function adicionarComentario(id, texto) {
    const { data: row, error } = await sb().from('laboratorio_cards').select('*').eq('id', Number(id)).maybeSingle()
    if (error) throw error
    if (!row) return null

    const timeline = [...(row.timeline || []), { tipo: 'comentario', autor: USUARIO_LOGADO, texto, data: new Date().toISOString() }]
    const { data: atualizado, error: e2 } = await sb().from('laboratorio_cards').update({ timeline }).eq('id', Number(id)).select().single()
    if (e2) throw e2

    const colunas = await fetchColunasLab()
    return serializarCardLab(colunas, mapCardLab(atualizado))
  }

  async function excluirColuna(id) {
    const colunas = await fetchColunasLab()
    if (!colunas.some(c => c.id === id)) return { erro: 'not_found' }

    const { count, error: e1 } = await sb().from('laboratorio_cards').select('*', { count: 'exact', head: true }).eq('coluna_id', id)
    if (e1) throw e1
    if (count > 0) return { erro: 'nao_vazia' }

    const { error } = await sb().from('laboratorio_colunas').delete().eq('id', id)
    if (error) throw error
    return { ok: true }
  }

  // ───────────────────────── requisições ─────────────────────────

  const PRODUTOS_REQUISICAO = [
    { descricao: 'Cabeçote de Impressão HP Latex', valorUnit: 2850 },
    { descricao: 'Lâmina de Corte Padrão 45°', valorUnit: 32 },
    { descricao: 'Correia de Transmissão Eixo X', valorUnit: 145 },
    { descricao: 'Fusível de Proteção 10A', valorUnit: 18 },
    { descricao: 'Placa Controladora Principal', valorUnit: 1290 },
    { descricao: 'Sensor de Marca de Registro', valorUnit: 210 },
    { descricao: 'Rolete de Tração de Mídia', valorUnit: 95 },
    { descricao: 'Fonte de Alimentação 24V', valorUnit: 380 },
    { descricao: 'Cabo Flat de Cabeçote', valorUnit: 60 },
    { descricao: 'Kit de Limpeza de Cabeçote', valorUnit: 45 },
    { descricao: 'Motor de Passo Eixo Y', valorUnit: 420 },
    { descricao: 'Correia de Corte Micro Serrilhada', valorUnit: 78 },
  ]

  function mapRequisicao(row) {
    return {
      id: row.id,
      numero: row.numero,
      dtEmissao: row.dt_emissao,
      funcionario: row.funcionario || '',
      itens: row.itens || [],
      valorTotal: Number(row.valor_total),
      atendimentoVinculadoId: row.atendimento_vinculado_id,
      atendimentoVinculadoNumero: row.atendimentos ? row.atendimentos.numero : null,
      observacao: row.observacao || '',
    }
  }

  const SELECT_REQUISICAO_COM_ATENDIMENTO = '*, atendimentos:atendimento_vinculado_id(numero)'

  async function listRequisicoes({ busca } = {}) {
    const { data, error } = await sb().from('requisicoes').select(SELECT_REQUISICAO_COM_ATENDIMENTO).order('id', { ascending: false })
    if (error) throw error
    const requisicoes = data.map(mapRequisicao)
    if (!busca) return requisicoes
    const alvo = busca.toLowerCase()
    return requisicoes.filter(r => `${r.numero} ${r.funcionario} ${r.atendimentoVinculadoNumero || ''}`.toLowerCase().includes(alvo))
  }

  async function buscarRequisicaoPorId(id) {
    const { data, error } = await sb().from('requisicoes').select(SELECT_REQUISICAO_COM_ATENDIMENTO).eq('id', Number(id)).maybeSingle()
    if (error) throw error
    return data ? mapRequisicao(data) : null
  }

  async function buscarProdutos(q) {
    if (!q) return []
    const alvo = q.toLowerCase()
    return PRODUTOS_REQUISICAO.filter(p => p.descricao.toLowerCase().includes(alvo)).slice(0, 10)
  }

  async function resolverAtendimentoVinculadoNumero(atendimentoVinculadoId) {
    if (!atendimentoVinculadoId) return null
    const atendimento = await buscarAtendimentoPorId(atendimentoVinculadoId)
    return atendimento ? atendimento.numero : null
  }

  async function proximoNumeroRequisicao() {
    const { data, error } = await sb().from('requisicoes').select('numero')
    if (error) throw error
    return data.reduce((max, r) => Math.max(max, Number(r.numero) || 0), 0) + 1
  }

  async function criarRequisicao(dados) {
    const numero = String(await proximoNumeroRequisicao())
    const itens = dados.itens || []
    const valorTotal = itens.reduce((soma, item) => soma + Number(item.valorTotal || 0), 0)

    const { data, error } = await sb()
      .from('requisicoes')
      .insert({
        numero,
        dt_emissao: dados.dtEmissao || new Date().toISOString().slice(0, 10),
        funcionario: dados.funcionario || '',
        itens,
        valor_total: valorTotal,
        atendimento_vinculado_id: dados.atendimentoVinculadoId || null,
        observacao: dados.observacao || '',
      })
      .select()
      .single()
    if (error) throw error
    const numeroVinculado = await resolverAtendimentoVinculadoNumero(dados.atendimentoVinculadoId)
    return { ...mapRequisicao(data), atendimentoVinculadoNumero: numeroVinculado }
  }

  async function atualizarRequisicao(id, dados) {
    const itens = dados.itens || []
    const valorTotal = itens.reduce((soma, item) => soma + Number(item.valorTotal || 0), 0)

    const { data, error } = await sb()
      .from('requisicoes')
      .update({
        dt_emissao: dados.dtEmissao || undefined,
        funcionario: dados.funcionario || '',
        itens,
        valor_total: valorTotal,
        atendimento_vinculado_id: dados.atendimentoVinculadoId || null,
        observacao: dados.observacao || '',
      })
      .eq('id', Number(id))
      .select()
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    const numeroVinculado = await resolverAtendimentoVinculadoNumero(dados.atendimentoVinculadoId)
    return { ...mapRequisicao(data), atendimentoVinculadoNumero: numeroVinculado }
  }

  // ───────────────────────── produtos ─────────────────────────

  function mapProduto(row) {
    return {
      id: row.id,
      nome: row.nome,
      valor: Number(row.valor),
      valorAvista: Number(row.valor_avista),
      controlaEstoque: row.controla_estoque,
      grupo1: row.grupo_1 || '',
      grupo2: row.grupo_2 || '',
      ncm: row.ncm || '',
      juros: Number(row.juros),
      imagem: row.imagem || '',
    }
  }

  async function listProdutos({ busca } = {}) {
    const { data, error } = await sb().from('produtos').select('*').order('id')
    if (error) throw error
    const produtos = data.map(mapProduto)
    if (!busca) return produtos
    const alvo = busca.toLowerCase()
    return produtos.filter(p => p.nome.toLowerCase().includes(alvo))
  }

  async function buscarProdutoPorId(id) {
    const { data, error } = await sb().from('produtos').select('*').eq('id', Number(id)).maybeSingle()
    if (error) throw error
    return data ? mapProduto(data) : null
  }

  async function criarProduto(dados) {
    const { data, error } = await sb()
      .from('produtos')
      .insert({
        nome: dados.nome || '',
        valor: dados.valor || 0,
        valor_avista: dados.valorAvista || 0,
        controla_estoque: !!dados.controlaEstoque,
        grupo_1: dados.grupo1 || null,
        grupo_2: dados.grupo2 || null,
        ncm: dados.ncm || '',
        juros: dados.juros || 0,
        imagem: dados.imagem || '',
      })
      .select()
      .single()
    if (error) throw error
    return mapProduto(data)
  }

  async function atualizarProduto(id, dados) {
    const { data, error } = await sb()
      .from('produtos')
      .update({
        nome: dados.nome || '',
        valor: dados.valor || 0,
        valor_avista: dados.valorAvista || 0,
        controla_estoque: !!dados.controlaEstoque,
        grupo_1: dados.grupo1 || null,
        grupo_2: dados.grupo2 || null,
        ncm: dados.ncm || '',
        juros: dados.juros || 0,
        imagem: dados.imagem || '',
      })
      .eq('id', Number(id))
      .select()
      .maybeSingle()
    if (error) throw error
    return data ? mapProduto(data) : null
  }

  async function excluirProduto(id) {
    const { data, error } = await sb()
      .from('produtos')
      .delete()
      .eq('id', Number(id))
      .select('id')
      .maybeSingle()
    if (error) throw error
    return Boolean(data)
  }

  // ───────────────────────── grupos de produto ─────────────────────────

  function mapGrupoProduto(row) {
    return { id: row.id, nome: row.nome }
  }

  async function listGruposProduto() {
    const { data, error } = await sb().from('grupos_produto').select('*').order('nome')
    if (error) throw error
    return data.map(mapGrupoProduto)
  }

  async function buscarGrupoProdutoPorId(id) {
    const { data, error } = await sb().from('grupos_produto').select('*').eq('id', Number(id)).maybeSingle()
    if (error) throw error
    return data ? mapGrupoProduto(data) : null
  }

  async function criarGrupoProduto(dados) {
    const { data, error } = await sb()
      .from('grupos_produto')
      .insert({ nome: dados.nome || '' })
      .select()
      .single()
    if (error) throw error
    return mapGrupoProduto(data)
  }

  async function atualizarGrupoProduto(id, dados) {
    const { data, error } = await sb()
      .from('grupos_produto')
      .update({ nome: dados.nome || '' })
      .eq('id', Number(id))
      .select()
      .maybeSingle()
    if (error) throw error
    return data ? mapGrupoProduto(data) : null
  }

  // ───────────────────────── wiki ─────────────────────────

  function mapWikiArtigo(row) {
    return { id: row.id, titulo: row.titulo, conteudo: row.conteudo, grupoId: row.grupo_id }
  }

  async function listWikiArtigos({ busca, grupoId } = {}) {
    const { data, error } = await sb().from('wiki_artigos').select('*').order('titulo')
    if (error) throw error
    let artigos = data.map(mapWikiArtigo)
    if (grupoId) artigos = artigos.filter(a => a.grupoId === Number(grupoId))
    if (!busca) return artigos
    const alvo = busca.toLowerCase()
    return artigos.filter(a => a.titulo.toLowerCase().includes(alvo) || a.conteudo.toLowerCase().includes(alvo))
  }

  async function criarWikiArtigo(dados) {
    const { data, error } = await sb()
      .from('wiki_artigos')
      .insert({ titulo: dados.titulo || '', conteudo: dados.conteudo || '', grupo_id: dados.grupoId || null })
      .select()
      .single()
    if (error) throw error
    return mapWikiArtigo(data)
  }

  // ───────────────────────── grupos de wiki ─────────────────────────

  function mapWikiGrupo(row) {
    return { id: row.id, nome: row.nome }
  }

  async function listWikiGrupos() {
    const { data, error } = await sb().from('wiki_grupos').select('*').order('nome')
    if (error) throw error
    return data.map(mapWikiGrupo)
  }

  async function criarWikiGrupo(dados) {
    const { data, error } = await sb()
      .from('wiki_grupos')
      .insert({ nome: dados.nome || '' })
      .select()
      .single()
    if (error) throw error
    return mapWikiGrupo(data)
  }

  // ───────────────────────── helpdesk ─────────────────────────

  function mapHelpdeskConversa(row) {
    const mensagens = row.helpdesk_mensagens || []
    const ultima = mensagens.length ? mensagens[mensagens.length - 1] : null
    return {
      id: row.id,
      clienteNome: row.cliente_nome,
      telefone: row.telefone || '',
      status: row.status,
      ultimaMensagem: ultima ? ultima.texto : '',
      ultimaMensagemEm: ultima ? ultima.created_at : row.created_at,
    }
  }

  function mapHelpdeskMensagem(row) {
    return { id: row.id, conversaId: row.conversa_id, autor: row.autor, texto: row.texto, criadaEm: row.created_at }
  }

  async function listHelpdeskConversas() {
    const { data, error } = await sb().from('helpdesk_conversas').select('*, helpdesk_mensagens(texto, created_at)').order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapHelpdeskConversa).sort((a, b) => new Date(b.ultimaMensagemEm) - new Date(a.ultimaMensagemEm))
  }

  async function listHelpdeskMensagens(conversaId) {
    const { data, error } = await sb().from('helpdesk_mensagens').select('*').eq('conversa_id', Number(conversaId)).order('created_at')
    if (error) throw error
    return data.map(mapHelpdeskMensagem)
  }

  async function enviarHelpdeskMensagem(conversaId, texto) {
    const { data, error } = await sb()
      .from('helpdesk_mensagens')
      .insert({ conversa_id: Number(conversaId), autor: 'atendente', texto })
      .select()
      .single()
    if (error) throw error
    return mapHelpdeskMensagem(data)
  }

  // ───────────────────────── roteador ─────────────────────────

  async function route(method, pathname, searchParams, bodyText) {
    const segments = pathname.split('/').filter(Boolean)
    const body = bodyText ? JSON.parse(bodyText) : undefined

    if (segments[0] === 'meses' && method === 'GET') {
      return { status: 200, body: await listMesesDisponiveis() }
    }

    if (segments[0] === 'tecnicos' && segments.length === 1 && method === 'GET') {
      return { status: 200, body: await listTecnicosInternos() }
    }

    if (segments[0] === 'tecnicos-terceirizados') {
      if (segments.length === 1) {
        if (method === 'GET') return { status: 200, body: await listTecnicosTerceirizados({ busca: searchParams.get('busca') }) }
        if (method === 'POST') return { status: 201, body: await criarTecnicoTerceirizado(body) }
      }
      if (segments.length === 2) {
        if (method === 'GET') {
          const t = await buscarTecnicoTerceirizadoPorId(segments[1])
          return t ? { status: 200, body: t } : { status: 404, body: { erro: 'Técnico terceirizado não encontrado' } }
        }
        if (method === 'PUT') {
          const t = await atualizarTecnicoTerceirizado(segments[1], body)
          return t ? { status: 200, body: t } : { status: 404, body: { erro: 'Técnico terceirizado não encontrado' } }
        }
      }
    }

    if (segments[0] === 'atendimentos') {
      if (segments.length === 1) {
        if (method === 'GET') return { status: 200, body: await listAtendimentos(Object.fromEntries(searchParams.entries())) }
        if (method === 'POST') return { status: 201, body: await criarAtendimento(body) }
      }
      if (segments.length === 2 && method === 'GET') {
        const a = await buscarAtendimentoPorId(segments[1])
        return a ? { status: 200, body: a } : { status: 404, body: { erro: 'Atendimento não encontrado' } }
      }
    }

    if (segments[0] === 'dashboard') {
      if (segments[1] === 'resumo' && method === 'GET') return { status: 200, body: await getResumoMensal(searchParams.get('mes')) }
      if (segments[1] === 'por-tecnico' && method === 'GET') return { status: 200, body: await getRankingPorTecnico(searchParams.get('mes')) }
    }

    if (segments[0] === 'clientes') {
      if (segments[1] === 'busca' && method === 'GET') return { status: 200, body: await buscarClientesPorNome(searchParams.get('q')) }
      if (segments.length === 1) {
        if (method === 'GET') return { status: 200, body: await listClientes({ busca: searchParams.get('busca') }) }
        if (method === 'POST') return { status: 201, body: await criarCliente(body) }
      }
      if (segments.length === 2) {
        if (method === 'GET') {
          const c = await buscarClientePorId(segments[1])
          return c ? { status: 200, body: c } : { status: 404, body: { erro: 'Cliente não encontrado' } }
        }
        if (method === 'PUT') {
          const c = await atualizarCliente(segments[1], body)
          return c ? { status: 200, body: c } : { status: 404, body: { erro: 'Cliente não encontrado' } }
        }
        if (method === 'DELETE') {
          const excluido = await excluirCliente(segments[1])
          return excluido ? { status: 204, body: null } : { status: 404, body: { erro: 'Cliente não encontrado' } }
        }
      }
    }

    if (segments[0] === 'catalogo') {
      if (segments[1] === 'equipamentos' && method === 'GET') return { status: 200, body: await buscarEquipamentos(searchParams.get('q')) }
      if (segments[1] === 'modelos' && method === 'GET') return { status: 200, body: await buscarModelos(searchParams.get('q')) }
    }

    if (segments[0] === 'instalacoes') {
      if (segments.length === 1 && method === 'GET') return { status: 200, body: await listInstalacoes({ busca: searchParams.get('busca') }) }
      if (segments.length === 2 && method === 'GET') {
        const i = await buscarInstalacaoPorId(segments[1])
        return i ? { status: 200, body: i } : { status: 404, body: { erro: 'Instalação não encontrada' } }
      }
    }

    if (segments[0] === 'laboratorio') {
      if (segments.length === 1) {
        if (method === 'GET') return { status: 200, body: await listQuadro() }
        if (method === 'POST') {
          const card = await criarCard({ cliente: body.cliente, coluna: body.coluna })
          return card ? { status: 201, body: card } : { status: 400, body: { erro: 'Coluna inválida' } }
        }
      }
      if (segments[1] === 'de-atendimento' && method === 'POST') {
        return { status: 201, body: await criarCardDeAtendimento(body) }
      }
      if (segments[1] === 'colunas') {
        if (segments.length === 3 && method === 'DELETE') {
          const r = await excluirColuna(segments[2])
          if (r.erro === 'not_found') return { status: 404, body: { erro: 'Coluna não encontrada' } }
          if (r.erro === 'nao_vazia') return { status: 400, body: { erro: 'Mova ou exclua os cartões antes de remover esta coluna.' } }
          return { status: 204, body: null }
        }
      }
      if (segments.length === 3 && segments[2] === 'mover' && method === 'PATCH') {
        const card = await moverCard(segments[1], body.coluna)
        return card ? { status: 200, body: card } : { status: 404, body: { erro: 'Cartão ou coluna inválidos' } }
      }
      if (segments.length === 3 && segments[2] === 'comentarios' && method === 'POST') {
        const card = await adicionarComentario(segments[1], body.texto)
        return card ? { status: 201, body: card } : { status: 404, body: { erro: 'Cartão não encontrado' } }
      }
    }

    if (segments[0] === 'requisicoes') {
      if (segments[1] === 'produtos' && method === 'GET') return { status: 200, body: await buscarProdutos(searchParams.get('q')) }
      if (segments.length === 1) {
        if (method === 'GET') return { status: 200, body: await listRequisicoes({ busca: searchParams.get('busca') }) }
        if (method === 'POST') return { status: 201, body: await criarRequisicao(body) }
      }
      if (segments.length === 2) {
        if (method === 'GET') {
          const r = await buscarRequisicaoPorId(segments[1])
          return r ? { status: 200, body: r } : { status: 404, body: { erro: 'Requisição não encontrada' } }
        }
        if (method === 'PUT') {
          const r = await atualizarRequisicao(segments[1], body)
          return r ? { status: 200, body: r } : { status: 404, body: { erro: 'Requisição não encontrada' } }
        }
      }
    }

    if (segments[0] === 'produtos') {
      if (segments.length === 1) {
        if (method === 'GET') return { status: 200, body: await listProdutos({ busca: searchParams.get('busca') }) }
        if (method === 'POST') return { status: 201, body: await criarProduto(body) }
      }
      if (segments.length === 2) {
        if (method === 'GET') {
          const p = await buscarProdutoPorId(segments[1])
          return p ? { status: 200, body: p } : { status: 404, body: { erro: 'Produto não encontrado' } }
        }
        if (method === 'PUT') {
          const p = await atualizarProduto(segments[1], body)
          return p ? { status: 200, body: p } : { status: 404, body: { erro: 'Produto não encontrado' } }
        }
        if (method === 'DELETE') {
          const excluido = await excluirProduto(segments[1])
          return excluido ? { status: 204, body: null } : { status: 404, body: { erro: 'Produto não encontrado' } }
        }
      }
    }

    if (segments[0] === 'grupos-produto') {
      if (segments.length === 1) {
        if (method === 'GET') return { status: 200, body: await listGruposProduto() }
        if (method === 'POST') return { status: 201, body: await criarGrupoProduto(body) }
      }
      if (segments.length === 2) {
        if (method === 'GET') {
          const g = await buscarGrupoProdutoPorId(segments[1])
          return g ? { status: 200, body: g } : { status: 404, body: { erro: 'Grupo de produto não encontrado' } }
        }
        if (method === 'PUT') {
          const g = await atualizarGrupoProduto(segments[1], body)
          return g ? { status: 200, body: g } : { status: 404, body: { erro: 'Grupo de produto não encontrado' } }
        }
      }
    }

    if (segments[0] === 'wiki') {
      if (segments.length === 1) {
        if (method === 'GET') return { status: 200, body: await listWikiArtigos({ busca: searchParams.get('busca'), grupoId: searchParams.get('grupoId') }) }
        if (method === 'POST') return { status: 201, body: await criarWikiArtigo(body) }
      }
    }

    if (segments[0] === 'wiki-grupos' && segments.length === 1) {
      if (method === 'GET') return { status: 200, body: await listWikiGrupos() }
      if (method === 'POST') return { status: 201, body: await criarWikiGrupo(body) }
    }

    if (segments[0] === 'helpdesk' && segments[1] === 'conversas') {
      if (segments.length === 2 && method === 'GET') return { status: 200, body: await listHelpdeskConversas() }
      if (segments.length === 4 && segments[3] === 'mensagens') {
        if (method === 'GET') return { status: 200, body: await listHelpdeskMensagens(segments[2]) }
        if (method === 'POST') return { status: 201, body: await enviarHelpdeskMensagem(segments[2], body.texto) }
      }
    }

    throw new Error(`Rota não implementada no api-shim: ${method} /api/${pathname}`)
  }

  window.fetch = async function (input, init) {
    const urlStr = typeof input === 'string' ? input : input.url
    const url = new URL(urlStr, window.location.origin)
    if (!url.pathname.startsWith('/api/')) return originalFetch(input, init)

    const method = ((init && init.method) || 'GET').toUpperCase()
    const pathname = url.pathname.slice(5) // remove leading '/api/'
    let status, body
    try {
      ;({ status, body } = await route(method, pathname, url.searchParams, init && init.body))
    } catch (e) {
      console.error('[api-shim]', method, url.pathname, e)
      status = 500
      body = { erro: e.message }
    }
    return { ok: status >= 200 && status < 300, status, json: async () => body }
  }
})()

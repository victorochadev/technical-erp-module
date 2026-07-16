// Camada de acesso a dados do quadro Kanban do Laboratório.
// Colunas e cartões vêm das tabelas `laboratorio_colunas` / `laboratorio_cards`
// no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')
const catalogoRepo = require('./catalogoRepository')

const USUARIO_LOGADO = 'Claudio Code Dev'

// SLA de manutenção: 10 dias úteis a partir da chegada do equipamento.
const PRAZO_DIAS_UTEIS = 10
const SLA_DIAS_UTEIS_ALERTA = 2 // a partir de 2 dias úteis (ou menos) para vencer, vira "Importante"

// Colunas em que a manutenção já foi concluída — o SLA de reparo não é mais
// aplicável a partir daqui (o que resta é só a coleta pelo cliente).
const COLUNAS_RESOLVIDAS = ['finalizado', 'aguardando-coleta', 'coletado']

const PALETA_CORES_NOVAS_COLUNAS = [
  '#64748b', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#22c55e', '#eab308', '#ec4899',
  '#ef4444', '#14b8a6', '#0ea5e9', '#a3a3a3',
]

const SLA_CORES = { padrao: '#22c55e', importante: '#f59e0b', urgente: '#ef4444' }

const DEFEITOS_POOL = [
  'Cliente alega desalinhamento.', 'Não liga.', 'Corte impreciso, perdendo tensão da lâmina.',
  'Erro de comunicação com o computador.', 'Cabeça de impressão entupida.', 'Ruído anormal durante o corte.',
  'Trava no meio do trabalho.', 'Desalinhamento de cor na impressão.', 'Correia de arraste solta.',
  'Software não reconhece o equipamento.',
]

function addDias(data, dias) {
  const d = new Date(data)
  d.setDate(d.getDate() + dias)
  return d
}

function addDiasUteis(data, dias) {
  const d = new Date(data)
  let restante = dias
  while (restante > 0) {
    d.setDate(d.getDate() + 1)
    const diaSemana = d.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) restante--
  }
  return d
}

// Diferença em dias úteis entre duas datas (positivo se `fim` é depois de `inicio`).
function diasUteisEntre(inicio, fim) {
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

function formatDiaMes(data) {
  const meses = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
  return `${data.getDate()} de ${meses[data.getMonth()]}`
}

function formatDataHora(data) {
  const hh = String(data.getHours()).padStart(2, '0')
  const mm = String(data.getMinutes()).padStart(2, '0')
  return `${formatDiaMes(data)} de ${data.getFullYear()}, ${hh}:${mm}`
}

function toIso(data) {
  return data.toISOString().slice(0, 10)
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

function iniciais(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function nomeColuna(colunas, id) {
  return (colunas.find(c => c.id === id) || {}).nome || id
}

function gerarWms() {
  return String(rand(700000000, 799999999))
}

function slugify(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'coluna'
}

function calcularSla(dataVencimentoIso, coluna) {
  if (COLUNAS_RESOLVIDAS.includes(coluna)) return 'padrao'
  const vencimento = new Date(dataVencimentoIso + 'T00:00:00')
  const diasUteisRestantes = diasUteisEntre(new Date(), vencimento)
  if (diasUteisRestantes < 0) return 'urgente'
  if (diasUteisRestantes <= SLA_DIAS_UTEIS_ALERTA) return 'importante'
  return 'padrao'
}

function mapColuna(row) {
  return { id: row.id, nome: row.nome, cor: row.cor }
}

function mapCard(row) {
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

function serializar(colunas, c) {
  const sla = calcularSla(c.dataVencimento, c.coluna)
  return {
    ...c,
    dataChegadaLabel: formatDiaMes(new Date(c.dataChegada + 'T00:00:00')),
    dataVencimentoLabel: formatDiaMes(new Date(c.dataVencimento + 'T00:00:00')),
    sla,
    slaCor: SLA_CORES[sla],
    tecnicoIniciais: c.tecnico ? iniciais(c.tecnico) : null,
    colunaCor: (colunas.find(col => col.id === c.coluna) || {}).cor,
    colunaNome: nomeColuna(colunas, c.coluna),
    comentarios: c.timeline.filter(t => t.tipo === 'comentario').length,
    timeline: c.timeline.map(t => ({ ...t, dataLabel: formatDataHora(new Date(t.data)) })).reverse(),
  }
}

async function fetchColunas() {
  const { data, error } = await supabase.from('laboratorio_colunas').select('*').order('ordem')
  if (error) throw error
  return data.map(mapColuna)
}

async function listQuadro() {
  const colunas = await fetchColunas()
  const { data, error } = await supabase.from('laboratorio_cards').select('*').order('id')
  if (error) throw error
  return { colunas, cards: data.map(mapCard).map(c => serializar(colunas, c)) }
}

async function moverCard(id, novaColuna) {
  const colunas = await fetchColunas()
  if (!colunas.some(col => col.id === novaColuna)) return null

  const { data: row, error } = await supabase.from('laboratorio_cards').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  if (!row) return null

  const card = mapCard(row)
  let timeline = card.timeline
  if (card.coluna !== novaColuna) {
    timeline = [...timeline, {
      tipo: 'sistema', autor: USUARIO_LOGADO,
      texto: `moveu este cartão de ${nomeColuna(colunas, card.coluna)} para ${nomeColuna(colunas, novaColuna)}`,
      data: new Date().toISOString(),
    }]
  }

  const { data: atualizado, error: e2 } = await supabase
    .from('laboratorio_cards')
    .update({ coluna_id: novaColuna, timeline })
    .eq('id', Number(id))
    .select()
    .single()
  if (e2) throw e2
  return serializar(colunas, mapCard(atualizado))
}

async function proximoNumeroCard() {
  return rand(19000, 21000)
}

async function criarCard({ cliente, coluna }) {
  const colunas = await fetchColunas()
  if (!colunas.some(col => col.id === coluna)) return null

  const catalogo = await catalogoRepo.listCatalogoCompleto()
  const grupo = pick(catalogo)
  const modeloInfo = pick(grupo.modelos)
  const hoje = new Date()

  const { data, error } = await supabase
    .from('laboratorio_cards')
    .insert({
      numero: await proximoNumeroCard(),
      cliente,
      coluna_id: coluna,
      data_chegada: toIso(hoje),
      data_vencimento: toIso(addDiasUteis(hoje, PRAZO_DIAS_UTEIS)),
      anexos: 0,
      tecnico_nome: null,
      equipamento: grupo.equipamento,
      modelo: modeloInfo.modelo,
      wms: modeloInfo.wms[0] || gerarWms(),
      defeito: pick(DEFEITOS_POOL),
      requisicao: '',
      laudo_tecnico: '',
      timeline: [
        { tipo: 'sistema', autor: USUARIO_LOGADO, texto: `adicionou este cartão a ${nomeColuna(colunas, coluna)}`, data: new Date().toISOString() },
      ],
    })
    .select()
    .single()
  if (error) throw error
  return serializar(colunas, mapCard(data))
}

// Cria um cartão a partir de um Atendimento Laboratório (ver atendimentosRepository.js
// / POST /api/atendimentos) — todo atendimento desse tipo entra direto na coluna
// Entrada do quadro. O SLA inicial escolhido no formulário define a Data Vencimento
// de partida (o cálculo do SLA em si continua sempre automático a partir da data,
// ver calcularSla — isso só ajusta o ponto de partida do prazo).
async function criarCardDeAtendimento(dados) {
  const colunas = await fetchColunas()
  const coluna = 'entrada'
  const hoje = new Date()
  let dataVencimento
  if (dados.slaInicial === 'urgente') dataVencimento = addDias(hoje, -1)
  else if (dados.slaInicial === 'importante') dataVencimento = addDiasUteis(hoje, SLA_DIAS_UTEIS_ALERTA)
  else dataVencimento = addDiasUteis(hoje, PRAZO_DIAS_UTEIS)

  const wmsArray = Array.isArray(dados.wms) ? dados.wms : (dados.wms ? [dados.wms] : [])

  const { data, error } = await supabase
    .from('laboratorio_cards')
    .insert({
      numero: dados.atendimentoNumero ? Number(dados.atendimentoNumero) : await proximoNumeroCard(),
      cliente: dados.cliente,
      coluna_id: coluna,
      data_chegada: toIso(hoje),
      data_vencimento: toIso(dataVencimento),
      anexos: 0,
      tecnico_nome: dados.tecnico || null,
      equipamento: dados.equipamento || '',
      modelo: dados.modelo || '',
      wms: wmsArray[0] || '',
      defeito: dados.defeito || '',
      requisicao: dados.requisicao || '',
      laudo_tecnico: '',
      atendimento_origem_id: dados.atendimentoOrigemId || null,
      timeline: [
        {
          tipo: 'sistema', autor: USUARIO_LOGADO,
          texto: dados.atendimentoNumero
            ? `adicionou este cartão a ${nomeColuna(colunas, coluna)} (a partir do Atendimento nº ${dados.atendimentoNumero})`
            : `adicionou este cartão a ${nomeColuna(colunas, coluna)}`,
          data: new Date().toISOString(),
        },
      ],
    })
    .select()
    .single()
  if (error) throw error
  return serializar(colunas, mapCard(data))
}

async function adicionarComentario(id, texto) {
  const { data: row, error } = await supabase.from('laboratorio_cards').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  if (!row) return null

  const timeline = [...(row.timeline || []), { tipo: 'comentario', autor: USUARIO_LOGADO, texto, data: new Date().toISOString() }]
  const { data: atualizado, error: e2 } = await supabase
    .from('laboratorio_cards')
    .update({ timeline })
    .eq('id', Number(id))
    .select()
    .single()
  if (e2) throw e2

  const colunas = await fetchColunas()
  return serializar(colunas, mapCard(atualizado))
}

async function criarColuna(nome) {
  if (!nome || !nome.trim()) return null
  const nomeLimpo = nome.trim()
  const colunas = await fetchColunas()

  let id = slugify(nomeLimpo)
  let sufixo = 2
  while (colunas.some(c => c.id === id)) {
    id = `${slugify(nomeLimpo)}-${sufixo}`
    sufixo++
  }
  const cor = PALETA_CORES_NOVAS_COLUNAS[colunas.length % PALETA_CORES_NOVAS_COLUNAS.length]

  const { data, error } = await supabase
    .from('laboratorio_colunas')
    .insert({ id, nome: nomeLimpo, cor, ordem: colunas.length + 1 })
    .select()
    .single()
  if (error) throw error
  return mapColuna(data)
}

async function excluirColuna(id) {
  const colunas = await fetchColunas()
  if (!colunas.some(c => c.id === id)) return { erro: 'not_found' }

  const { count, error: e1 } = await supabase
    .from('laboratorio_cards')
    .select('*', { count: 'exact', head: true })
    .eq('coluna_id', id)
  if (e1) throw e1
  if (count > 0) return { erro: 'nao_vazia' }

  const { error } = await supabase.from('laboratorio_colunas').delete().eq('id', id)
  if (error) throw error
  return { ok: true }
}

module.exports = { listQuadro, moverCard, criarCard, criarCardDeAtendimento, adicionarComentario, criarColuna, excluirColuna }

// Mock do quadro Kanban do Laboratório (manutenção de equipamentos).
// Em produção, isso é substituído por consultas/updates reais ao banco do ERP
// (as funções abaixo — listQuadro, moverCard, criarCard, adicionarComentario,
// criarColuna, excluirColuna — são o ponto exato de troca).

const { TECNICOS } = require('./mockAtendimentos')
const { CATALOGO } = require('./catalogoRepository')

const USUARIO_LOGADO = 'Victor Gabriel Amadeu Rocha'

// SLA de manutenção: 10 dias úteis a partir da chegada do equipamento.
const PRAZO_DIAS_UTEIS = 10
const SLA_DIAS_UTEIS_ALERTA = 2 // a partir de 2 dias úteis (ou menos) para vencer, vira "Importante"

let COLUNAS = [
  { id: 'entrada', nome: 'Entrada', cor: '#64748b' },
  { id: 'fila', nome: 'Fila', cor: '#3b82f6' },
  { id: 'orcamento', nome: 'Orçamento', cor: '#8b5cf6' },
  { id: 'manutencao', nome: 'Manutenção', cor: '#f59e0b' },
  { id: 'testes', nome: 'Testes', cor: '#06b6d4' },
  { id: 'finalizado', nome: 'Finalizado', cor: '#22c55e' },
  { id: 'aguardando-coleta', nome: 'Aguardando Coleta', cor: '#eab308' },
  { id: 'coletado', nome: 'Coletado', cor: '#ec4899' },
]

// Colunas em que a manutenção já foi concluída — o SLA de reparo não é mais
// aplicável a partir daqui (o que resta é só a coleta pelo cliente).
const COLUNAS_RESOLVIDAS = ['finalizado', 'aguardando-coleta', 'coletado']

const PALETA_CORES_NOVAS_COLUNAS = [
  '#64748b', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#22c55e', '#eab308', '#ec4899',
  '#ef4444', '#14b8a6', '#0ea5e9', '#a3a3a3',
]

const SLA_CORES = { padrao: '#22c55e', importante: '#f59e0b', urgente: '#ef4444' }

const CLIENTES_POOL = [
  'Dani Duarte Silva Papelaria', 'Fontes Crisostomo Comercio Servicos e Transportes Ltda.',
  'Rodrigo Gehm', 'RIBFER Usinagem e Ferramentaria Ltda.', 'Grafica Gutenberg Ltda.',
  'Jessica Flores da Silva Granada', 'A G M Vago Agv - Grafica e Editora Ltda.', 'Pará Cópias Ltda. - ME',
  'Mavimix Adesivos Decorativos Ltda.', 'Ana Claudia da Silva Reimberg', 'Vitor Costa Marinho',
  'Coretex Industria Textil Ltda.', 'Miria Cardoso de Oliveira', 'Instituto de Agricultura e Evangelismo - IAGE',
  'Serigraf Comunicação Visual Ltda.', 'Print Express Digital Ltda. - ME', 'Adesivare Sinalização Ltda.',
  'Marcia Aparecida dos Santos', 'Copy House Reprografia Ltda.', 'Vinil Sign Comunicação Visual Ltda.',
  'Fernando Augusto Barbosa', 'Grafimax Impressos e Adesivos Ltda.', 'Renata Cristina Souza Lima',
]

const DEFEITOS_POOL = [
  'Cliente alega desalinhamento.', 'Não liga.', 'Corte impreciso, perdendo tensão da lâmina.',
  'Erro de comunicação com o computador.', 'Cabeça de impressão entupida.', 'Ruído anormal durante o corte.',
  'Trava no meio do trabalho.', 'Desalinhamento de cor na impressão.', 'Correia de arraste solta.',
  'Software não reconhece o equipamento.',
]

const HOJE = new Date(2026, 6, 14)

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

function formatDiaMesAno(data) {
  return `${formatDiaMes(data)} de ${data.getFullYear()}`
}

function formatDataHora(data) {
  const hh = String(data.getHours()).padStart(2, '0')
  const mm = String(data.getMinutes()).padStart(2, '0')
  return `${formatDiaMesAno(data)}, ${hh}:${mm}`
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

function nomeColuna(id) {
  return (COLUNAS.find(c => c.id === id) || {}).nome || id
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
  const diasUteisRestantes = diasUteisEntre(HOJE, vencimento)
  if (diasUteisRestantes < 0) return 'urgente'
  if (diasUteisRestantes <= SLA_DIAS_UTEIS_ALERTA) return 'importante'
  return 'padrao'
}

function gerarCard(coluna) {
  const grupo = pick(CATALOGO)
  const modeloInfo = pick(grupo.modelos)
  const chegada = addDias(HOJE, rand(-20, 5))
  const vencimento = addDiasUteis(chegada, PRAZO_DIAS_UTEIS)
  const temTecnico = coluna !== 'entrada' && Math.random() > 0.3
  const avancado = ['testes', ...COLUNAS_RESOLVIDAS].includes(coluna)
  const coletado = coluna === 'coletado'

  return {
    numero: rand(19000, 21000),
    cliente: pick(CLIENTES_POOL),
    coluna,
    dataChegada: toIso(chegada),
    dataVencimento: toIso(vencimento),
    anexos: Math.random() > 0.6 ? rand(1, 2) : 0,
    tecnico: temTecnico ? pick(TECNICOS) : null,
    equipamento: grupo.equipamento,
    modelo: modeloInfo.modelo,
    wms: gerarWms(),
    defeito: pick(DEFEITOS_POOL),
    requisicao: '',
    laudoTecnico: avancado ? 'Peça substituída e equipamento testado, funcionando normalmente.' : '',
    dataManutencaoFin: avancado ? toIso(addDias(chegada, rand(2, 8))) : '',
    dataSaida: coletado ? toIso(addDias(chegada, rand(9, 14))) : '',
    drive: avancado ? 'drive.google.com/bannerjet-lab/' + rand(10000, 99999) : '',
    timeline: [
      { tipo: 'sistema', autor: USUARIO_LOGADO, texto: `adicionou este cartão a ${nomeColuna(coluna)}`, data: HOJE.toISOString() },
    ],
  }
}

const QUANTIDADE_POR_COLUNA = {
  entrada: 6, fila: 3, orcamento: 2, manutencao: 4, testes: 2, finalizado: 3, 'aguardando-coleta': 2, coletado: 2,
}

let proximoId = 1
const CARDS = COLUNAS.flatMap(({ id }) =>
  Array.from({ length: QUANTIDADE_POR_COLUNA[id] || 0 }, () => ({ id: proximoId++, ...gerarCard(id) }))
)

function serializar(c) {
  const sla = calcularSla(c.dataVencimento, c.coluna)
  return {
    ...c,
    dataChegadaLabel: formatDiaMes(new Date(c.dataChegada + 'T00:00:00')),
    dataVencimentoLabel: formatDiaMes(new Date(c.dataVencimento + 'T00:00:00')),
    sla,
    slaCor: SLA_CORES[sla],
    tecnicoIniciais: c.tecnico ? iniciais(c.tecnico) : null,
    colunaCor: (COLUNAS.find(col => col.id === c.coluna) || {}).cor,
    colunaNome: nomeColuna(c.coluna),
    comentarios: c.timeline.filter(t => t.tipo === 'comentario').length,
    timeline: c.timeline.map(t => ({ ...t, dataLabel: formatDataHora(new Date(t.data)) })).reverse(),
  }
}

async function listQuadro() {
  return { colunas: COLUNAS, cards: CARDS.map(serializar) }
}

async function moverCard(id, novaColuna) {
  const card = CARDS.find(c => c.id === Number(id))
  if (!card) return null
  if (!COLUNAS.some(col => col.id === novaColuna)) return null
  if (card.coluna !== novaColuna) {
    card.timeline.push({
      tipo: 'sistema', autor: USUARIO_LOGADO,
      texto: `moveu este cartão de ${nomeColuna(card.coluna)} para ${nomeColuna(novaColuna)}`,
      data: new Date().toISOString(),
    })
    card.coluna = novaColuna
  }
  return serializar(card)
}

async function criarCard({ cliente, coluna }) {
  if (!COLUNAS.some(col => col.id === coluna)) return null
  const card = { id: proximoId++, ...gerarCard(coluna) }
  card.cliente = cliente
  card.anexos = 0
  card.tecnico = null
  card.requisicao = ''
  card.laudoTecnico = ''
  card.dataChegada = toIso(HOJE)
  card.dataVencimento = toIso(addDiasUteis(HOJE, PRAZO_DIAS_UTEIS))
  card.dataManutencaoFin = ''
  card.dataSaida = ''
  card.drive = ''
  CARDS.push(card)
  return serializar(card)
}

// Cria um cartão a partir de um Atendimento Laboratório (ver atendimentosRepository.js
// / POST /api/atendimentos) — todo atendimento desse tipo entra direto na coluna
// Entrada do quadro. O SLA inicial escolhido no formulário define a Data Vencimento
// de partida (o cálculo do SLA em si continua sempre automático a partir da data,
// ver calcularSla — isso só ajusta o ponto de partida do prazo).
async function criarCardDeAtendimento(dados) {
  const coluna = 'entrada'
  let dataVencimento
  if (dados.slaInicial === 'urgente') dataVencimento = addDias(HOJE, -1)
  else if (dados.slaInicial === 'importante') dataVencimento = addDiasUteis(HOJE, SLA_DIAS_UTEIS_ALERTA)
  else dataVencimento = addDiasUteis(HOJE, PRAZO_DIAS_UTEIS)

  const wmsArray = Array.isArray(dados.wms) ? dados.wms : (dados.wms ? [dados.wms] : [])

  const card = {
    id: proximoId++,
    numero: dados.atendimentoNumero ? Number(dados.atendimentoNumero) : rand(19000, 21000),
    cliente: dados.cliente,
    coluna,
    dataChegada: toIso(HOJE),
    dataVencimento: toIso(dataVencimento),
    anexos: 0,
    tecnico: dados.tecnico || null,
    equipamento: dados.equipamento || '',
    modelo: dados.modelo || '',
    wms: wmsArray[0] || '',
    defeito: dados.defeito || '',
    requisicao: dados.requisicao || '',
    laudoTecnico: '',
    dataManutencaoFin: '',
    dataSaida: '',
    drive: '',
    atendimentoOrigem: dados.atendimentoOrigemId ? {
      id: dados.atendimentoOrigemId,
      numero: dados.atendimentoOrigemNumero || null,
      resumo: dados.atendimentoOrigemResumo || '',
    } : null,
    timeline: [
      {
        tipo: 'sistema', autor: USUARIO_LOGADO,
        texto: dados.atendimentoNumero
          ? `adicionou este cartão a ${nomeColuna(coluna)} (a partir do Atendimento nº ${dados.atendimentoNumero})`
          : `adicionou este cartão a ${nomeColuna(coluna)}`,
        data: new Date().toISOString(),
      },
    ],
  }
  CARDS.push(card)
  return serializar(card)
}

async function adicionarComentario(id, texto) {
  const card = CARDS.find(c => c.id === Number(id))
  if (!card) return null
  card.timeline.push({ tipo: 'comentario', autor: USUARIO_LOGADO, texto, data: new Date().toISOString() })
  return serializar(card)
}

async function criarColuna(nome) {
  if (!nome || !nome.trim()) return null
  const nomeLimpo = nome.trim()
  let id = slugify(nomeLimpo)
  let sufixo = 2
  while (COLUNAS.some(c => c.id === id)) {
    id = `${slugify(nomeLimpo)}-${sufixo}`
    sufixo++
  }
  const cor = PALETA_CORES_NOVAS_COLUNAS[COLUNAS.length % PALETA_CORES_NOVAS_COLUNAS.length]
  const coluna = { id, nome: nomeLimpo, cor }
  COLUNAS.push(coluna)
  return coluna
}

async function excluirColuna(id) {
  if (!COLUNAS.some(c => c.id === id)) return { erro: 'not_found' }
  if (CARDS.some(c => c.coluna === id)) return { erro: 'nao_vazia' }
  COLUNAS = COLUNAS.filter(c => c.id !== id)
  return { ok: true }
}

module.exports = { listQuadro, moverCard, criarCard, criarCardDeAtendimento, adicionarComentario, criarColuna, excluirColuna }

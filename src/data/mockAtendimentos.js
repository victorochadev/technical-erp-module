// Gera uma base fictícia de atendimentos técnicos para alimentar o protótipo.
// Em produção, isso é substituído por consultas reais ao banco do ERP
// (ver atendimentosRepository.js para o ponto exato de troca).

const { CLIENTES } = require('./clientesRepository')
const { CATALOGO } = require('./catalogoRepository')

const TECNICOS = [
  'Arthur Henrique Garcia Orcy',
  'Artur Diego Pereira Ferreira dos Santos',
  'Beatriz Guimaraes Gonçalves',
  'Brenno Santos e Silva',
  'Caio Henrique dos Santos',
  'Carlos Henrique Juren Dias',
  'Danilo Stivali Gonçalves',
  'Diego Fernandes',
  'Eduardo Correia da Costa',
  'Edvaldo Caetano da Silva',
  'Elvis Kuester',
  'Erick Alexandre Dantas Ribeiro',
  'Fabio Conti Barreto',
  'Ricardo Domingos Silva',
  'Igor Sanches dos Santos',
  'Lucas Honorato da Cruz',
  'Gabriel Leonardo Tomio',
  'Wylliam Pierre Oliveira Almeida Silva',
  'Nathan Christian Mateus',
  'Vitor Gustavo Campos',
]

const DEFEITOS = [
  'Plugin do CAMERACUT não estava habilitado no COREL',
  'Dúvidas iniciais sobre manuseio da máquina e uso do SignMaster',
  'Maquina veio com placa queimada, técnico foi até lá e trocou a peça',
  'Cliente não consegue utilizar as duas cabeças da D24',
  'Maquina entregue com problema, painel travando',
  'Cortando torto no meio da folha, alinhamentos feitos',
  'Retorno de atendimento anterior',
  'Instalação de equipamento novo',
  'Máquina pula a leitura de marcações, possível problema no sensor',
  'Necessário RESET de signmaster e reinstalação do software',
  'Termolaminadora pulando engrenagens',
  'Máquina não localiza as marcas de registro',
  'Erro de comunicação USB com o computador',
  'Solicitação de treinamento remoto para novo operador',
  'Substituição de lâmina de corte',
  'Atualização de firmware da plotter',
  'Cabeçote de impressão entupido, limpeza necessária',
  'Problema de alinhamento de cores na impressão',
]

const LAUDOS_CONCLUIDO = [
  'Serviço realizado com sucesso, equipamento testado e funcionando normalmente.',
  'Peça substituída e calibração refeita. Cliente confirmou funcionamento.',
  'Reinstalação do software concluída, equipamento operando normalmente.',
  'Ajuste de sensor realizado, leitura de marcações voltou ao normal.',
  'Orientação passada ao operador, dúvidas sanadas remotamente.',
]

const LAUDOS_CANCELADO = [
  'Atendimento cancelado a pedido do cliente.',
  'Cliente remarcou para outra data.',
  'Cancelado — cliente resolveu o problema internamente.',
]

const TIPOS = ['Remoto', 'Presencial']
const STATUSES = ['Concluido', 'Concluido', 'Concluido', 'Em Atendimento', 'Cancelado']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDateInMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const day = 1 + Math.floor(Math.random() * daysInMonth)
  return new Date(year, month, day)
}

function toIsoDate(date) {
  return date.toISOString().split('T')[0]
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDateTimeLocal(date, hour) {
  return `${toIsoDate(date)}T${pad(hour)}:${pad(Math.floor(Math.random() * 60))}`
}

function laudoPorStatus(status) {
  if (status === 'Concluido') return pick(LAUDOS_CONCLUIDO)
  if (status === 'Cancelado') return pick(LAUDOS_CANCELADO)
  return ''
}

function generateMockAtendimentos() {
  const months = [
    { year: 2026, month: 4 }, // maio
    { year: 2026, month: 5 }, // junho
    { year: 2026, month: 6 }, // julho
  ]

  const atendimentos = []
  let numero = 20500

  months.forEach(({ year, month }) => {
    const total = 180 + Math.floor(Math.random() * 60)
    for (let i = 0; i < total; i++) {
      numero += 1
      const tipo = Math.random() < 0.75 ? 'Remoto' : 'Presencial'
      const status = pick(STATUSES)
      const cliente = pick(CLIENTES)
      const grupo = pick(CATALOGO)
      const modeloInfo = pick(grupo.modelos)
      const dataIda = randomDateInMonth(year, month)
      const horaIda = 8 + Math.floor(Math.random() * 9)

      atendimentos.push({
        id: numero,
        numero: String(numero),
        dtEmissao: toIsoDate(dataIda),
        clienteId: cliente.id,
        cliente: cliente.nomeFantasia,
        defeito: pick(DEFEITOS),
        laudoTecnico: laudoPorStatus(status),
        tecnico: pick(TECNICOS),
        equipamento: grupo.equipamento,
        modelo: modeloInfo.modelo,
        wms: modeloInfo.wms,
        ida: toDateTimeLocal(dataIda, horaIda),
        volta: toDateTimeLocal(dataIda, horaIda + 2),
        tipo,
        status,
      })
    }
  })

  atendimentos.sort((a, b) => (a.dtEmissao < b.dtEmissao ? 1 : -1))
  return atendimentos
}

module.exports = { generateMockAtendimentos, TECNICOS, TIPOS }

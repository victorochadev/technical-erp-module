// Script de seed único: gera a massa de dados de demonstração (atendimentos,
// instalações e cards do laboratório) e insere no Supabase, usando os dados
// mestres (clientes, técnicos, catálogo) que já vivem no banco.
//
// Rodar com: node scripts/seedSupabaseData.js
// Seguro para rodar apenas uma vez — números/pedidos são UNIQUE, uma segunda
// execução falha em conflito ao invés de duplicar dados.

require('dotenv').config()
const supabase = require('../src/data/supabaseClient')
const catalogoRepo = require('../src/data/catalogoRepository')

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function toIsoDate(date) {
  return date.toISOString().split('T')[0]
}

function toDateTimeLocal(date, hour) {
  return `${toIsoDate(date)}T${pad(hour)}:${pad(Math.floor(Math.random() * 60))}:00Z`
}

function randomDateInMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const day = 1 + Math.floor(Math.random() * daysInMonth)
  return new Date(year, month, day)
}

// ---------- Atendimentos ----------

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

const STATUSES = ['Concluido', 'Concluido', 'Concluido', 'Em Atendimento', 'Cancelado']

function laudoPorStatus(status) {
  if (status === 'Concluido') return pick(LAUDOS_CONCLUIDO)
  if (status === 'Cancelado') return pick(LAUDOS_CANCELADO)
  return ''
}

function gerarAtendimentos(clientes, tecnicos, catalogo, numeroInicial) {
  const months = [
    { year: 2026, month: 4 }, // maio
    { year: 2026, month: 5 }, // junho
    { year: 2026, month: 6 }, // julho
  ]

  const atendimentos = []
  let numero = numeroInicial

  months.forEach(({ year, month }) => {
    const total = 180 + Math.floor(Math.random() * 60)
    for (let i = 0; i < total; i++) {
      numero += 1
      const tipo = Math.random() < 0.75 ? 'Remoto' : 'Presencial'
      const status = pick(STATUSES)
      const cliente = pick(clientes)
      const grupo = pick(catalogo)
      const modeloInfo = pick(grupo.modelos)
      const dataIda = randomDateInMonth(year, month)
      const horaIda = 8 + Math.floor(Math.random() * 9)

      atendimentos.push({
        numero: String(numero),
        dt_emissao: toIsoDate(dataIda),
        cliente_id: cliente.id,
        cliente_nome: cliente.nome_fantasia,
        defeito: pick(DEFEITOS),
        laudo_tecnico: laudoPorStatus(status),
        tecnico_nome: pick(tecnicos),
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

  return atendimentos
}

// ---------- Instalações ----------

const CLIENTES_INSTALACAO = [
  { razaoSocial: 'P7 Comunicacao E Servicos Visual Ltda', cnpj: '12.987.654/0001-30', endereco: 'Rua Sete de Setembro, 210 - São José do Rio Preto/SP', telefone: '(17) 3214-9087', email: 'compras@p7visual.com.br' },
  { razaoSocial: 'Glg Comercio E Industria Do Vestuario Ltda', cnpj: '23.456.123/0001-45', endereco: 'Rua Marcilio Dias, 121 - Manaus/AM', telefone: '(92) 98417-6447', email: 'financeiro@glgvestuario.com.br' },
  { razaoSocial: 'M2 Placas E Revestimentos Ltda', cnpj: '34.567.234/0001-56', endereco: 'Av. Industrial, 880 - Joinville/SC', telefone: '(47) 3028-4471', email: 'contato@m2placas.com.br' },
  { razaoSocial: 'O Box 19 Ltda', cnpj: '45.678.345/0001-67', endereco: 'Rua das Acácias, 55 - Belo Horizonte/MG', telefone: '(31) 3345-8821', email: 'obox19@gmail.com' },
  { razaoSocial: 'Abdir Company Ltda', cnpj: '56.789.456/0001-78', endereco: 'Av. Brasil, 3040 - Recife/PE', telefone: '(81) 3221-9944', email: 'abdir@abdircompany.com.br' },
  { razaoSocial: 'Blutex Acessorios Texteis Ltda', cnpj: '67.890.567/0001-89', endereco: 'Rua dos Tecidos, 77 - Americana/SP', telefone: '(19) 3468-1122', email: 'vendas@blutex.com.br' },
  { razaoSocial: 'Douglas Rafael De Oliveira', cnpj: '78.901.678/0001-90', endereco: 'Rua Getúlio Vargas, 310 - Cascavel/PR', telefone: '(45) 99912-3344', email: 'douglas.oliveira@gmail.com' },
  { razaoSocial: 'Rota Norte Confeccoes Ltda', cnpj: '89.012.789/0001-01', endereco: 'Av. Duque de Caxias, 1200 - Fortaleza/CE', telefone: '(85) 3299-6633', email: 'rotanorte@confeccoes.com.br' },
  { razaoSocial: 'Vittoria Personalizados Ltda', cnpj: '90.123.890/0001-12', endereco: 'Rua das Flores, 45 - Ribeirão Preto/SP', telefone: '(16) 3234-5566', email: 'contato@vittoriapersonalizados.com.br' },
  { razaoSocial: 'Fenix Estampas E Bordados Ltda', cnpj: '01.234.901/0001-23', endereco: 'Av. Antártica, 990 - Manaus/AM', telefone: '(92) 3612-4477', email: 'fenix@estampasebordados.com.br' },
  { razaoSocial: 'Grafisul Comunicacao Visual Ltda', cnpj: '12.345.012/0001-34', endereco: 'Rua da Graciosa, 320 - Curitiba/PR', telefone: '(41) 3355-7788', email: 'grafisul@graficasul.com.br' },
  { razaoSocial: 'Norte Sign Comercio Ltda', cnpj: '23.456.789/0001-45', endereco: 'Av. Ceará, 450 - Belém/PA', telefone: '(91) 3241-6688', email: 'nortesign@nortesign.com.br' },
]

const PRODUTOS_POOL = [
  { produto: 'FILME - A + FILME B - CRISTAL - DTF UV - ROLOS DE 0,30cm X 100mt', peso: '0.00000' },
  { produto: 'IMPRESSORA BANNERJET DTF UV - MOD. Y30DUV3TX - (3 CAB. TX800) - WMS', peso: '0.00000' },
  { produto: 'Solvente', peso: '0.00000' },
  { produto: 'TINTA INKONE UV - LINHA EPSON - BLACK', peso: '0.00000' },
  { produto: 'TINTA INKONE UV - LINHA EPSON - CYAN', peso: '0.00000' },
  { produto: 'TINTA INKONE UV - LINHA EPSON - MAGENTA', peso: '0.00000' },
  { produto: 'TINTA INKONE UV - LINHA EPSON - VERNIZ', peso: '0.00000' },
  { produto: 'TINTA INKONE UV - LINHA EPSON - WHITE', peso: '0.00000' },
  { produto: 'TINTA INKONE UV - LINHA EPSON - YELLOW', peso: '0.00000' },
  { produto: 'PLOTTER DE RECORTE CAMPRO C24 - LIGHT 0,60cm - WMS', peso: '38.50000' },
  { produto: 'LAMINADORA GMP EXCELAM II 1600 - WMS', peso: '62.00000' },
  { produto: 'PO DE TRANSFER DTF - 1KG', peso: '1.00000' },
  { produto: 'PELICULA TRANSFER DTF - ROLO 30CM X 100M', peso: '4.20000' },
]

const CUSTOS_POOL = ['Hospedagem', 'Alimentação', 'Passagem Aérea', 'KM Rodado', 'Diária Técnico', 'Frete do Equipamento', 'Pedágio']

const TRANSPORTADORAS = [
  'NICOLE MADRID ALIFANTIS - TRANSPORTES (Nativa)',
  'JAMEF TRANSPORTES',
  'BRASPRESS TRANSPORTES URGENTES',
  'TNT MERCÚRIO CARGO',
  'RODONAVES TRANSPORTES',
]

const CHECKLIST_ITENS = [
  'Fotos da Sala (onde o equipamento vai ficar)',
  'Foto do Ar Condicionado (onde o equipamento vai ficar)',
  'Foto das Configurações de Hardware do Computador de Operação/RIP',
  'Foto da parte elétrica - Tomadas e Disjuntores',
]

function randomData2024() {
  const mes = 1 + Math.floor(Math.random() * 12)
  const dia = 1 + Math.floor(Math.random() * 28)
  const hora = 8 + Math.floor(Math.random() * 10)
  const min = Math.floor(Math.random() * 60)
  return `${pad(dia)}/${pad(mes)}/2024 ${pad(hora)}:${pad(min)}`
}

function gerarStatus() {
  return Math.random() < 0.55
    ? { label: 'Concluido', data: randomData2024() }
    : { label: 'Em andamento', data: null }
}

function gerarProdutos() {
  const total = 3 + Math.floor(Math.random() * 6)
  const usados = new Set()
  const produtos = []
  while (produtos.length < total && usados.size < PRODUTOS_POOL.length) {
    const p = pick(PRODUTOS_POOL)
    if (usados.has(p.produto)) continue
    usados.add(p.produto)
    produtos.push({ produto: p.produto, qtd: 1 + Math.floor(Math.random() * 2), peso: p.peso, medida: '' })
  }
  return produtos
}

function gerarCustos() {
  const total = 2 + Math.floor(Math.random() * 4)
  const usados = new Set()
  const custos = []
  while (custos.length < total && usados.size < CUSTOS_POOL.length) {
    const descricao = pick(CUSTOS_POOL)
    if (usados.has(descricao)) continue
    usados.add(descricao)
    custos.push({ descricao, valor: Math.round((80 + Math.random() * 1200) * 100) / 100 })
  }
  return custos
}

function gerarChecklist() {
  return CHECKLIST_ITENS.map(item => ({ item, status: 'pendente', motivo: '' }))
}

function gerarInstalacoes(tecnicos) {
  const instalacoes = []
  let pedidoCompra = 38000
  let pedidoDespesas = 41800

  for (let i = 0; i < 26; i++) {
    pedidoCompra += 30 + Math.floor(Math.random() * 90)
    const temPedidoDespesas = Math.random() < 0.55
    if (temPedidoDespesas) pedidoDespesas += 20 + Math.floor(Math.random() * 60)

    instalacoes.push({
      pedido_compra: pedidoCompra,
      pedido_despesas: temPedidoDespesas ? pedidoDespesas : null,
      cliente: pick(CLIENTES_INSTALACAO),
      tecnico_nome: Math.random() < 0.25 ? null : pick(tecnicos),
      status_cliente: gerarStatus(),
      status_tecnico: gerarStatus(),
      transportadora: pick(TRANSPORTADORAS),
      produtos: gerarProdutos(),
      custos: gerarCustos(),
      checklist: gerarChecklist(),
    })
  }

  return instalacoes
}

// ---------- Laboratório ----------

const CLIENTES_POOL_LAB = [
  'Dani Duarte Silva Papelaria', 'Fontes Crisostomo Comercio Servicos e Transportes Ltda.',
  'Rodrigo Gehm', 'RIBFER Usinagem e Ferramentaria Ltda.', 'Grafica Gutenberg Ltda.',
  'Jessica Flores da Silva Granada', 'A G M Vago Agv - Grafica e Editora Ltda.', 'Pará Cópias Ltda. - ME',
  'Mavimix Adesivos Decorativos Ltda.', 'Ana Claudia da Silva Reimberg', 'Vitor Costa Marinho',
  'Coretex Industria Textil Ltda.', 'Miria Cardoso de Oliveira', 'Instituto de Agricultura e Evangelismo - IAGE',
  'Serigraf Comunicação Visual Ltda.', 'Print Express Digital Ltda. - ME', 'Adesivare Sinalização Ltda.',
  'Marcia Aparecida dos Santos', 'Copy House Reprografia Ltda.', 'Vinil Sign Comunicação Visual Ltda.',
  'Fernando Augusto Barbosa', 'Grafimax Impressos e Adesivos Ltda.', 'Renata Cristina Souza Lima',
]

const DEFEITOS_POOL_LAB = [
  'Cliente alega desalinhamento.', 'Não liga.', 'Corte impreciso, perdendo tensão da lâmina.',
  'Erro de comunicação com o computador.', 'Cabeça de impressão entupida.', 'Ruído anormal durante o corte.',
  'Trava no meio do trabalho.', 'Desalinhamento de cor na impressão.', 'Correia de arraste solta.',
  'Software não reconhece o equipamento.',
]

const QUANTIDADE_POR_COLUNA = {
  entrada: 6, fila: 3, orcamento: 2, manutencao: 4, testes: 2, finalizado: 3, 'aguardando-coleta': 2, coletado: 2,
}

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

function toIso(data) {
  return data.toISOString().slice(0, 10)
}

function gerarWms() {
  return String(rand(700000000, 799999999))
}

function gerarCardLab(coluna, catalogo, tecnicos, hoje) {
  const grupo = pick(catalogo)
  const modeloInfo = pick(grupo.modelos)
  const chegada = addDias(hoje, rand(-20, 5))
  const vencimento = addDiasUteis(chegada, 10)
  const temTecnico = coluna !== 'entrada' && Math.random() > 0.3
  const avancado = ['testes', 'finalizado', 'aguardando-coleta', 'coletado'].includes(coluna)
  const coletado = coluna === 'coletado'

  return {
    numero: rand(19000, 21000),
    cliente: pick(CLIENTES_POOL_LAB),
    coluna_id: coluna,
    data_chegada: toIso(chegada),
    data_vencimento: toIso(vencimento),
    anexos: Math.random() > 0.6 ? rand(1, 2) : 0,
    tecnico_nome: temTecnico ? pick(tecnicos) : null,
    equipamento: grupo.equipamento,
    modelo: modeloInfo.modelo,
    wms: modeloInfo.wms[0] || gerarWms(),
    defeito: pick(DEFEITOS_POOL_LAB),
    requisicao: '',
    laudo_tecnico: avancado ? 'Peça substituída e equipamento testado, funcionando normalmente.' : '',
    data_manutencao_fin: avancado ? toIso(addDias(chegada, rand(2, 8))) : null,
    data_saida: coletado ? toIso(addDias(chegada, rand(9, 14))) : null,
    drive: avancado ? 'drive.google.com/bannerjet-lab/' + rand(10000, 99999) : '',
    timeline: [
      { tipo: 'sistema', autor: 'Claudio Code Dev', texto: `adicionou este cartão a ${coluna}`, data: hoje.toISOString() },
    ],
  }
}

function gerarCardsLab(catalogo, tecnicos) {
  const hoje = new Date()
  const cards = []
  Object.entries(QUANTIDADE_POR_COLUNA).forEach(([coluna, qtd]) => {
    for (let i = 0; i < qtd; i++) cards.push(gerarCardLab(coluna, catalogo, tecnicos, hoje))
  })
  return cards
}

// ---------- Runner ----------

async function inserirEmLotes(tabela, linhas, tamanhoLote = 50) {
  for (let i = 0; i < linhas.length; i += tamanhoLote) {
    const lote = linhas.slice(i, i + tamanhoLote)
    const { error } = await supabase.from(tabela).insert(lote)
    if (error) throw new Error(`Erro inserindo em ${tabela}: ${error.message}`)
    console.log(`  ${tabela}: ${Math.min(i + tamanhoLote, linhas.length)}/${linhas.length}`)
  }
}

async function main() {
  console.log('Buscando dados mestres no Supabase...')
  const { data: clientes, error: e1 } = await supabase.from('clientes').select('id, nome_fantasia')
  if (e1) throw e1
  const { data: tecnicosRows, error: e2 } = await supabase.from('tecnicos').select('nome')
  if (e2) throw e2
  const tecnicos = tecnicosRows.map(r => r.nome)
  const catalogo = await catalogoRepo.listCatalogoCompleto()

  console.log(`clientes: ${clientes.length}, tecnicos: ${tecnicos.length}, equipamentos: ${catalogo.length}`)

  console.log('Gerando atendimentos...')
  const atendimentos = gerarAtendimentos(clientes, tecnicos, catalogo, 20500)
  console.log(`Inserindo ${atendimentos.length} atendimentos...`)
  await inserirEmLotes('atendimentos', atendimentos)

  console.log('Gerando instalações...')
  const instalacoes = gerarInstalacoes(tecnicos)
  console.log(`Inserindo ${instalacoes.length} instalações...`)
  await inserirEmLotes('instalacoes', instalacoes)

  console.log('Gerando cards do laboratório...')
  const cards = gerarCardsLab(catalogo, tecnicos)
  console.log(`Inserindo ${cards.length} cards...`)
  await inserirEmLotes('laboratorio_cards', cards)

  console.log('Seed concluído com sucesso.')
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })

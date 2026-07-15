// Mock do módulo de Instalações — pedidos de venda de equipamento que geram
// uma instalação técnica, com checklist de aprovação de fotos enviadas pelo
// cliente via app Bannerjet.
// >>> PONTO DE INTEGRAÇÃO <<<: trocar pelo cadastro real de pedidos de compra/
// despesas do ERP e pelas fotos recebidas de fato do app Bannerjet (hoje são
// placeholders — ver instalacao-detalhes.js).

const { TECNICOS } = require('./mockAtendimentos')

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

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pad(n) {
  return String(n).padStart(2, '0')
}

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

function generateMockInstalacoes() {
  const instalacoes = []
  let pedidoCompra = 38000
  let pedidoDespesas = 41800

  for (let i = 0; i < 26; i++) {
    pedidoCompra += 30 + Math.floor(Math.random() * 90)
    const temPedidoDespesas = Math.random() < 0.55
    if (temPedidoDespesas) pedidoDespesas += 20 + Math.floor(Math.random() * 60)

    instalacoes.push({
      id: pedidoCompra,
      pedidoCompra,
      pedidoDespesas: temPedidoDespesas ? pedidoDespesas : null,
      cliente: pick(CLIENTES_INSTALACAO),
      tecnico: Math.random() < 0.25 ? null : pick(TECNICOS),
      statusCliente: gerarStatus(),
      statusTecnico: gerarStatus(),
      transportadora: pick(TRANSPORTADORAS),
      produtos: gerarProdutos(),
      custos: gerarCustos(),
      checklist: gerarChecklist(),
    })
  }

  return instalacoes.sort((a, b) => b.pedidoCompra - a.pedidoCompra)
}

const INSTALACOES = generateMockInstalacoes()

async function listInstalacoes({ busca } = {}) {
  if (!busca) return INSTALACOES
  const alvo = busca.toLowerCase()
  return INSTALACOES.filter(i =>
    String(i.pedidoCompra).includes(alvo) ||
    String(i.pedidoDespesas || '').includes(alvo) ||
    i.cliente.razaoSocial.toLowerCase().includes(alvo) ||
    (i.tecnico || '').toLowerCase().includes(alvo)
  )
}

async function buscarInstalacaoPorId(id) {
  return INSTALACOES.find(i => i.id === Number(id)) || null
}

module.exports = { listInstalacoes, buscarInstalacaoPorId }

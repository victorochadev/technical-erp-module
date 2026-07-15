// Camada de acesso a dados das requisições (módulo Vendas > Requisições).
//
// >>> PONTO DE INTEGRAÇÃO <<<
// Hoje os dados vêm de arrays em memória (mock). Para plugar no ERP real,
// troque o corpo das funções abaixo por consultas ao banco, mantendo a mesma
// assinatura e o mesmo formato de retorno.

const { buscarAtendimentoPorId } = require('./atendimentosRepository')

const PRODUTOS = [
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

const REQUISICOES = [
  { id: 6959, numero: '6959', dtEmissao: '2026-07-10', funcionario: 'Ricardo Domingos Silva', itens: [{ descricao: 'Motor de Passo Eixo Y', qtd: 1, valorUnit: 420, valorTotal: 420 }, { descricao: 'Correia de Transmissão Eixo X', qtd: 6.48, valorUnit: 145, valorTotal: 940 }], valorTotal: 1360, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: '' },
  { id: 6960, numero: '6960', dtEmissao: '2026-07-13', funcionario: 'Danilo Stivali Gonçalves', itens: [{ descricao: 'Placa Controladora Principal', qtd: 1.33, valorUnit: 1290, valorTotal: 1720 }], valorTotal: 1720, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: '' },
  { id: 6961, numero: '6961', dtEmissao: '2026-07-13', funcionario: 'Igor Sanches dos Santos', itens: [{ descricao: 'Cabeçote de Impressão HP Latex', qtd: 1.31, valorUnit: 2850, valorTotal: 3725 }], valorTotal: 3725, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: '' },
  { id: 6962, numero: '6962', dtEmissao: '2026-07-13', funcionario: 'Ricardo Domingos Silva', itens: [{ descricao: 'Fusível de Proteção 10A', qtd: 1, valorUnit: 18, valorTotal: 18 }, { descricao: 'Kit de Limpeza de Cabeçote', qtd: 5.13, valorUnit: 45, valorTotal: 231.33 }], valorTotal: 249.33, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: '' },
  { id: 6963, numero: '6963', dtEmissao: '2026-07-13', funcionario: 'Ricardo Domingos Silva', itens: [{ descricao: 'Placa Controladora Principal', qtd: 0.76, valorUnit: 1290, valorTotal: 985 }], valorTotal: 985, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: '' },
  { id: 6964, numero: '6964', dtEmissao: '2026-07-13', funcionario: 'Ricardo Domingos Silva', itens: [], valorTotal: 0, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: 'Requisição cancelada — peça já reposta em atendimento anterior.' },
  { id: 6965, numero: '6965', dtEmissao: '2026-07-14', funcionario: 'Ricardo Domingos Silva', itens: [{ descricao: 'Rolete de Tração de Mídia', qtd: 3.16, valorUnit: 95, valorTotal: 300 }], valorTotal: 300, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: '' },
  { id: 6966, numero: '6966', dtEmissao: '2026-07-14', funcionario: 'Matheus Henrique Agostinho da Silva Fernandes', itens: [{ descricao: 'Sensor de Marca de Registro', qtd: 3.48, valorUnit: 210, valorTotal: 730 }], valorTotal: 730, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: '' },
  { id: 6967, numero: '6967', dtEmissao: '2026-07-14', funcionario: 'Marcio José Alves', itens: [{ descricao: 'Cabo Flat de Cabeçote', qtd: 4.12, valorUnit: 60, valorTotal: 247 }], valorTotal: 247, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: '' },
  { id: 6968, numero: '6968', dtEmissao: '2026-07-14', funcionario: 'Felipe da Silva Wosgrau Pinheiro', itens: [{ descricao: 'Fonte de Alimentação 24V', qtd: 1.42, valorUnit: 380, valorTotal: 540 }], valorTotal: 540, atendimentoVinculadoId: null, atendimentoVinculadoNumero: null, observacao: '' },
]

async function listRequisicoes({ busca } = {}) {
  return [...REQUISICOES].sort((a, b) => Number(b.numero) - Number(a.numero)).filter(r => {
    if (!busca) return true
    const alvo = busca.toLowerCase()
    const combinado = `${r.numero} ${r.funcionario} ${r.atendimentoVinculadoNumero || ''}`.toLowerCase()
    return combinado.includes(alvo)
  })
}

async function buscarRequisicaoPorId(id) {
  return REQUISICOES.find(r => r.id === Number(id)) || null
}

async function buscarProdutos(q) {
  if (!q) return []
  const alvo = q.toLowerCase()
  return PRODUTOS.filter(p => p.descricao.toLowerCase().includes(alvo)).slice(0, 10)
}

async function resolverAtendimentoVinculadoNumero(atendimentoVinculadoId) {
  if (!atendimentoVinculadoId) return null
  const atendimento = await buscarAtendimentoPorId(atendimentoVinculadoId)
  return atendimento ? atendimento.numero : null
}

async function criarRequisicao(dados) {
  const maiorNumero = REQUISICOES.reduce((max, r) => Math.max(max, Number(r.numero) || 0), 0)
  const numero = maiorNumero + 1

  const itens = dados.itens || []
  const valorTotal = itens.reduce((soma, item) => soma + Number(item.valorTotal || 0), 0)

  const nova = {
    id: numero,
    numero: String(numero),
    dtEmissao: dados.dtEmissao || new Date().toISOString().slice(0, 10),
    funcionario: dados.funcionario || '',
    itens,
    valorTotal,
    atendimentoVinculadoId: dados.atendimentoVinculadoId || null,
    atendimentoVinculadoNumero: await resolverAtendimentoVinculadoNumero(dados.atendimentoVinculadoId),
    observacao: dados.observacao || '',
  }
  REQUISICOES.push(nova)
  return nova
}

async function atualizarRequisicao(id, dados) {
  const requisicao = REQUISICOES.find(r => r.id === Number(id))
  if (!requisicao) return null

  const itens = dados.itens || []
  requisicao.dtEmissao = dados.dtEmissao || requisicao.dtEmissao
  requisicao.funcionario = dados.funcionario || ''
  requisicao.itens = itens
  requisicao.valorTotal = itens.reduce((soma, item) => soma + Number(item.valorTotal || 0), 0)
  requisicao.atendimentoVinculadoId = dados.atendimentoVinculadoId || null
  requisicao.atendimentoVinculadoNumero = await resolverAtendimentoVinculadoNumero(dados.atendimentoVinculadoId)
  requisicao.observacao = dados.observacao || ''
  return requisicao
}

module.exports = { listRequisicoes, buscarRequisicaoPorId, buscarProdutos, criarRequisicao, atualizarRequisicao }

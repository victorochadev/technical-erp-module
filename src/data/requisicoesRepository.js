// Camada de acesso a dados das requisições (módulo Vendas > Requisições).
// Dados vêm da tabela `requisicoes` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')
const { buscarAtendimentoPorId } = require('./atendimentosRepository')

// Catálogo de peças de reposição para o autocomplete do formulário —
// não migrado para o Supabase (é só uma lista de apoio, sem cadastro próprio
// no restante do app); os itens de fato salvos ficam em `requisicoes.itens`.
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

const SELECT_COM_ATENDIMENTO = '*, atendimentos:atendimento_vinculado_id(numero)'

async function listRequisicoes({ busca } = {}) {
  const { data, error } = await supabase.from('requisicoes').select(SELECT_COM_ATENDIMENTO).order('id', { ascending: false })
  if (error) throw error
  const requisicoes = data.map(mapRequisicao)
  if (!busca) return requisicoes
  const alvo = busca.toLowerCase()
  return requisicoes.filter(r => `${r.numero} ${r.funcionario} ${r.atendimentoVinculadoNumero || ''}`.toLowerCase().includes(alvo))
}

async function buscarRequisicaoPorId(id) {
  const { data, error } = await supabase.from('requisicoes').select(SELECT_COM_ATENDIMENTO).eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapRequisicao(data) : null
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

async function proximoNumero() {
  const { data, error } = await supabase.from('requisicoes').select('numero')
  if (error) throw error
  return data.reduce((max, r) => Math.max(max, Number(r.numero) || 0), 0) + 1
}

async function criarRequisicao(dados) {
  const numero = String(await proximoNumero())
  const itens = dados.itens || []
  const valorTotal = itens.reduce((soma, item) => soma + Number(item.valorTotal || 0), 0)

  const { data, error } = await supabase
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

  const { data, error } = await supabase
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

module.exports = { listRequisicoes, buscarRequisicaoPorId, buscarProdutos, criarRequisicao, atualizarRequisicao }

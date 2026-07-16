// Camada de acesso a dados do módulo de Instalações.
// Dados vêm da tabela `instalacoes` no Supabase (ver supabase/schema.sql).
// O campo `id` retornado ao front-end é o número do pedido de compra
// (pedidoCompra), preservando o contrato original da API.

const supabase = require('./supabaseClient')

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
  const { data, error } = await supabase.from('instalacoes').select('*').order('pedido_compra', { ascending: false })
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
  const { data, error } = await supabase.from('instalacoes').select('*').eq('pedido_compra', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapInstalacao(data) : null
}

module.exports = { listInstalacoes, buscarInstalacaoPorId }

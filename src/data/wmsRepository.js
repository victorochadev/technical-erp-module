// Camada de acesso a dados das unidades WMS (máquinas registradas por produto).
// Dados vêm da tabela `wms_unidades` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapWmsUnidade(row) {
  return {
    id: row.id,
    produtoId: row.produto_id,
    lote: row.lote,
    numero: row.numero,
    produtoNome: row.produtos ? row.produtos.nome : undefined,
  }
}

function gerarNumero(lote) {
  const prefixo = `${lote}0${lote}`
  const aleatorio = String(Math.floor(Math.random() * 100000)).padStart(5, '0')
  return `${prefixo}${aleatorio}`
}

async function proximoLote(produtoId) {
  const { data, error } = await supabase.from('wms_unidades').select('lote').eq('produto_id', produtoId)
  if (error) throw error
  const maior = data.reduce((max, r) => Math.max(max, r.lote), 0)
  return maior + 1
}

async function listWmsPorProduto(produtoId) {
  const { data, error } = await supabase
    .from('wms_unidades')
    .select('*')
    .eq('produto_id', Number(produtoId))
    .order('lote')
    .order('numero')
  if (error) throw error
  return data.map(mapWmsUnidade)
}

async function listWmsTodos() {
  const { data, error } = await supabase
    .from('wms_unidades')
    .select('*, produtos(nome)')
    .order('produto_id')
    .order('lote')
  if (error) throw error
  return data.map(mapWmsUnidade)
}

async function registrarWms(produtoId, quantidade) {
  const lote = await proximoLote(produtoId)

  const { data: existentesData, error: existentesError } = await supabase.from('wms_unidades').select('numero')
  if (existentesError) throw existentesError
  const numerosExistentes = new Set(existentesData.map(r => r.numero))

  const novos = []
  for (let i = 0; i < quantidade; i++) {
    let numero
    do { numero = gerarNumero(lote) } while (numerosExistentes.has(numero))
    numerosExistentes.add(numero)
    novos.push({ produto_id: produtoId, lote, numero })
  }

  const { data, error } = await supabase.from('wms_unidades').insert(novos).select()
  if (error) throw error
  return data.map(mapWmsUnidade)
}

module.exports = { listWmsPorProduto, listWmsTodos, registrarWms }

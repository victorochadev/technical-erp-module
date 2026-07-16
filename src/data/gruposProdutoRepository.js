// Camada de acesso a dados dos grupos de produtos.
// Dados vêm da tabela `grupos_produto` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapGrupoProduto(row) {
  return { id: row.id, nome: row.nome }
}

async function listGruposProduto() {
  const { data, error } = await supabase.from('grupos_produto').select('*').order('nome')
  if (error) throw error
  return data.map(mapGrupoProduto)
}

async function buscarGrupoProdutoPorId(id) {
  const { data, error } = await supabase.from('grupos_produto').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapGrupoProduto(data) : null
}

async function criarGrupoProduto(dados) {
  const { data, error } = await supabase
    .from('grupos_produto')
    .insert({ nome: dados.nome || '' })
    .select()
    .single()
  if (error) throw error
  return mapGrupoProduto(data)
}

async function atualizarGrupoProduto(id, dados) {
  const { data, error } = await supabase
    .from('grupos_produto')
    .update({ nome: dados.nome || '' })
    .eq('id', Number(id))
    .select()
    .maybeSingle()
  if (error) throw error
  return data ? mapGrupoProduto(data) : null
}

module.exports = { listGruposProduto, buscarGrupoProdutoPorId, criarGrupoProduto, atualizarGrupoProduto }

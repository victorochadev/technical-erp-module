// Camada de acesso a dados de produtos.
// Dados vêm da tabela `produtos` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapProduto(row) {
  return {
    id: row.id,
    nome: row.nome,
    valor: Number(row.valor),
    valorAvista: Number(row.valor_avista),
    controlaEstoque: row.controla_estoque,
    grupo: row.grupo || '',
    ncm: row.ncm || '',
    juros: Number(row.juros),
    imagem: row.imagem || '',
  }
}

async function listProdutos({ busca } = {}) {
  const { data, error } = await supabase.from('produtos').select('*').order('id')
  if (error) throw error
  const produtos = data.map(mapProduto)
  if (!busca) return produtos
  const alvo = busca.toLowerCase()
  return produtos.filter(p => p.nome.toLowerCase().includes(alvo))
}

async function buscarProdutoPorId(id) {
  const { data, error } = await supabase.from('produtos').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapProduto(data) : null
}

async function criarProduto(dados) {
  const { data, error } = await supabase
    .from('produtos')
    .insert({
      nome: dados.nome || '',
      valor: dados.valor || 0,
      valor_avista: dados.valorAvista || 0,
      controla_estoque: !!dados.controlaEstoque,
      grupo: dados.grupo || '',
      ncm: dados.ncm || '',
      juros: dados.juros || 0,
      imagem: dados.imagem || '',
    })
    .select()
    .single()
  if (error) throw error
  return mapProduto(data)
}

async function atualizarProduto(id, dados) {
  const { data, error } = await supabase
    .from('produtos')
    .update({
      nome: dados.nome || '',
      valor: dados.valor || 0,
      valor_avista: dados.valorAvista || 0,
      controla_estoque: !!dados.controlaEstoque,
      grupo: dados.grupo || '',
      ncm: dados.ncm || '',
      juros: dados.juros || 0,
      imagem: dados.imagem || '',
    })
    .eq('id', Number(id))
    .select()
    .maybeSingle()
  if (error) throw error
  return data ? mapProduto(data) : null
}

module.exports = { listProdutos, buscarProdutoPorId, criarProduto, atualizarProduto }

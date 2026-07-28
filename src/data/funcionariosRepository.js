// Camada de acesso a dados de funcionários.
// Dados vêm da tabela `funcionarios` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapFuncionario(row) {
  return {
    id: row.id,
    nome: row.nome,
    cargo: row.cargo || '',
    telefone: row.telefone || '',
    email: row.email || '',
  }
}

async function listFuncionarios({ busca } = {}) {
  const { data, error } = await supabase.from('funcionarios').select('*').order('nome')
  if (error) throw error
  const funcionarios = data.map(mapFuncionario)
  if (!busca) return funcionarios
  const alvo = busca.toLowerCase()
  return funcionarios.filter(f => `${f.nome} ${f.cargo}`.toLowerCase().includes(alvo))
}

async function buscarFuncionarioPorId(id) {
  const { data, error } = await supabase.from('funcionarios').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapFuncionario(data) : null
}

async function criarFuncionario(dados) {
  const { data, error } = await supabase
    .from('funcionarios')
    .insert({
      nome: dados.nome || '',
      cargo: dados.cargo || '',
      telefone: dados.telefone || '',
      email: dados.email || '',
    })
    .select()
    .single()
  if (error) throw error
  return mapFuncionario(data)
}

async function atualizarFuncionario(id, dados) {
  const { data, error } = await supabase
    .from('funcionarios')
    .update({
      nome: dados.nome || '',
      cargo: dados.cargo || '',
      telefone: dados.telefone || '',
      email: dados.email || '',
    })
    .eq('id', Number(id))
    .select()
    .maybeSingle()
  if (error) throw error
  return data ? mapFuncionario(data) : null
}

module.exports = { listFuncionarios, buscarFuncionarioPorId, criarFuncionario, atualizarFuncionario }

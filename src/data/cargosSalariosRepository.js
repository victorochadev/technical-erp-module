// Camada de acesso a dados dos cargos e salários.
// Dados vêm da tabela `cargos_salarios` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapCargoSalario(row) {
  return { id: row.id, nome: row.nome, salarioBase: Number(row.salario_base) }
}

async function listCargosSalarios() {
  const { data, error } = await supabase.from('cargos_salarios').select('*').order('nome')
  if (error) throw error
  return data.map(mapCargoSalario)
}

async function buscarCargoSalarioPorId(id) {
  const { data, error } = await supabase.from('cargos_salarios').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapCargoSalario(data) : null
}

async function criarCargoSalario(dados) {
  const { data, error } = await supabase
    .from('cargos_salarios')
    .insert({ nome: dados.nome || '', salario_base: dados.salarioBase || 0 })
    .select()
    .single()
  if (error) throw error
  return mapCargoSalario(data)
}

async function atualizarCargoSalario(id, dados) {
  const { data, error } = await supabase
    .from('cargos_salarios')
    .update({ nome: dados.nome || '', salario_base: dados.salarioBase || 0 })
    .eq('id', Number(id))
    .select()
    .maybeSingle()
  if (error) throw error
  return data ? mapCargoSalario(data) : null
}

module.exports = { listCargosSalarios, buscarCargoSalarioPorId, criarCargoSalario, atualizarCargoSalario }

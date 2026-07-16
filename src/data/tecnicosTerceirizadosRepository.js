// Cadastro de técnicos terceirizados (prestadores externos).
// Dados vêm da tabela `tecnicos_terceirizados` no Supabase.

const supabase = require('./supabaseClient')

function mapTecnico(row) {
  return {
    id: row.id,
    nome: row.nome,
    empresa: row.empresa,
    especialidade: row.especialidade,
    telefone: row.telefone,
    email: row.email,
    cidade: row.cidade,
  }
}

async function listTecnicosTerceirizados({ busca } = {}) {
  const { data, error } = await supabase.from('tecnicos_terceirizados').select('*').order('nome')
  if (error) throw error
  const tecnicos = data.map(mapTecnico)
  if (!busca) return tecnicos
  const alvo = busca.toLowerCase()
  return tecnicos.filter(t => `${t.nome} ${t.empresa} ${t.especialidade} ${t.cidade}`.toLowerCase().includes(alvo))
}

async function buscarTecnicoTerceirizadoPorId(id) {
  const { data, error } = await supabase.from('tecnicos_terceirizados').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapTecnico(data) : null
}

async function criarTecnicoTerceirizado(dados) {
  const { data, error } = await supabase
    .from('tecnicos_terceirizados')
    .insert({
      nome: dados.nome || '',
      empresa: dados.empresa || '',
      especialidade: dados.especialidade || '',
      telefone: dados.telefone || '',
      email: dados.email || '',
      cidade: dados.cidade || '',
    })
    .select()
    .single()
  if (error) throw error
  return mapTecnico(data)
}

module.exports = { listTecnicosTerceirizados, buscarTecnicoTerceirizadoPorId, criarTecnicoTerceirizado }
